'use strict';

const fs = require('fs');
const path = require('path');
const { STUDIO_VERSION } = require('../shared/constants');
const { ConfigStore } = require('../shared/config-store');
const proxyManager = require('./proxy-manager');
const { UsageCollector } = require('./usage-collector');
const { AccountManager } = require('./account-manager');
const { ContextLimitManager } = require('./context-limit-patcher');
const { EnhanceManager } = require('./enhance-patcher');
const { launchCliTerminal } = require('./cli-launcher');
const { scanLocalFonts } = require('./font-scanner');
const nativeI18n = require('../i18n/native-i18n');

let ipcRegistered = false;
let rendererSourceCache = null;

function getElectronSafe() {
  try { return require('electron'); } catch { return null; }
}

function getRendererSource() {
  if (rendererSourceCache) return rendererSourceCache;
  const candidate = path.join(__dirname, 'studio-renderer.js');
  const devCandidate = path.resolve(__dirname, '..', '..', 'dist', 'studio-renderer.js');
  const p = fs.existsSync(candidate) ? candidate : devCandidate;
  if (fs.existsSync(p)) {
    rendererSourceCache = fs.readFileSync(p, 'utf8');
  }
  return rendererSourceCache || '';
}

function loadPackagedDictionary(lang) {
  const file = lang === 'zh-TW' ? 'dict.zh-TW.json' : 'dict.zh-CN.json';
  const candidates = [
    path.join(__dirname, 'i18n', file),
    path.resolve(__dirname, '..', 'i18n', file),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch {}
    }
  }
  return { exact: {}, regex: [] };
}

function buildI18nPayload(store) {
  const cfg = store.load();
  const lang = cfg.i18n?.language || 'zh-CN';
  if (lang === 'en') {
    return { language: 'en', exact: {}, regex: [], customExact: {}, customRegex: [] };
  }
  const baseDict = loadPackagedDictionary(lang);
  const custom = cfg.i18n?.customDictionaryEnabled !== false ? store.loadCustomDictionary() : { exact: {}, regex: [] };
  return {
    language: lang,
    exact: { ...(baseDict.exact || {}), ...(custom.exact || {}) },
    regex: [...(custom.regex || []), ...(baseDict.regex || [])],
    baseCount: Object.keys(baseDict.exact || {}).length,
    customCount: Object.keys(custom.exact || {}).length,
    customExact: custom.exact || {},
    customRegex: custom.regex || [],
  };
}

function broadcastToAllWindows(channel, payload) {
  const electron = getElectronSafe();
  if (!electron?.BrowserWindow) return;
  for (const win of electron.BrowserWindow.getAllWindows()) {
    try {
      if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
        win.webContents.send(channel, payload);
      }
    } catch {}
  }
}

function isTrustedLocalSender(event) {
  try {
    const url = event?.senderFrame?.url || event?.sender?.getURL?.() || '';
    if (!url) return true;
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url) || url.startsWith('file://');
  } catch {
    return true;
  }
}

function registerIpcOnce() {
  if (ipcRegistered) return;
  const electron = getElectronSafe();
  if (!electron?.ipcMain) return;
  ipcRegistered = true;

  const { ipcMain, app, session, shell } = electron;
  const store = new ConfigStore();
  const collector = new UsageCollector({ store });
  const accountMgr = new AccountManager({ store });
  const ctxLimitMgr = new ContextLimitManager({ store });
  const enhanceMgr = new EnhanceManager({ store });

  const handleSafe = (channel, fn) => {
    try { ipcMain.removeHandler(channel); } catch {}
    ipcMain.handle(channel, async (event, ...args) => {
      if (!isTrustedLocalSender(event)) {
        throw new Error('Untrusted frame sender rejected');
      }
      return await fn(event, ...args);
    });
  };

  ipcMain.on('ag-studio:i18n-boot-sync', (event) => {
    try {
      event.returnValue = buildI18nPayload(store);
    } catch {
      event.returnValue = { language: 'en', exact: {}, regex: [] };
    }
  });

  handleSafe('ag-studio:runtime-info', () => ({
    studioVersion: STUDIO_VERSION,
    platform: process.platform,
    arch: process.arch,
    stateDir: store.stateDir,
    fontsDir: store.fontsDir,
    proxyBoot: globalThis.__AG_STUDIO_PROXY_BOOT__ || null,
  }));

  handleSafe('ag-studio:get-config', () => store.load());

  handleSafe('ag-studio:save-config', async (_ev, partial) => {
    const prev = store.load();
    const next = store.save(partial || {});
    if (JSON.stringify(prev.proxy) !== JSON.stringify(next.proxy)) {
      proxyManager.applyProxyToEnv(process.env, next.proxy);
      await proxyManager.applySessionProxy(app, session, next.proxy).catch(() => {});
    }
    if (prev.i18n?.language !== next.i18n?.language ||
        prev.i18n?.translateNativeMenu !== next.i18n?.translateNativeMenu ||
        prev.i18n?.translateTray !== next.i18n?.translateTray) {
      nativeI18n.setCurrentLanguage(next.i18n?.language || 'zh-CN');
      broadcastToAllWindows('ag-studio:i18n-changed', buildI18nPayload(store));
    }
    broadcastToAllWindows('ag-studio:config-changed', next);
    return next;
  });

  handleSafe('ag-studio:live-snapshot', async (_ev, conversationId) => {
    return await collector.getLiveSnapshot(conversationId);
  });

  handleSafe('ag-studio:history-summary', (_ev, days) => {
    return collector.getHistorySummary(Number(days || 90));
  });

  handleSafe('ag-studio:record-turn', (_ev, turn) => {
    collector.recordLiveTurn(turn);
    return { ok: true };
  });

  handleSafe('ag-studio:test-proxy', async (_ev, proxyUrl) => {
    return await proxyManager.testProxyConnectivity(proxyUrl);
  });

  handleSafe('ag-studio:accounts-overview', () => accountMgr.getOverview());

  handleSafe('ag-studio:accounts-action', async (_ev, payload) => {
    const action = payload?.action;
    switch (action) {
      case 'overview':
        return accountMgr.getOverview();
      case 'import_current':
        return await accountMgr.importCurrentAccount();
      case 'add_direct':
        return accountMgr.addAccountDirect(payload);
      case 'oauth_login':
        return await accountMgr.startOAuthLoginFlow({
          clientId: payload.clientId,
          clientSecret: payload.clientSecret,
          onAuthUrl: (url) => { try { shell.openExternal(url); } catch {} },
        });
      case 'refresh_quota':
        return await accountMgr.refreshQuotas();
      case 'switch':
        return await accountMgr.switchAccount(payload.accountId);
      case 'remove':
        return accountMgr.removeAccount(payload.accountId);
      case 'update_auto_switch': {
        store.save({ quota: { autoSwitch: payload.autoSwitch || {} } });
        return accountMgr.getOverview();
      }
      default:
        throw new Error(`Unknown account action: ${action}`);
    }
  });

  handleSafe('ag-studio:context-limits-status', () => ctxLimitMgr.getStatus());
  handleSafe('ag-studio:context-limit-set', (_ev, { model, limit }) => ctxLimitMgr.setModelLimit(model, limit));
  handleSafe('ag-studio:context-limit-reset', (_ev, { model } = {}) => ctxLimitMgr.resetModelLimit(model));

  handleSafe('ag-studio:enhance-status', () => enhanceMgr.getStatus());
  handleSafe('ag-studio:enhance-set-title', (_ev, enabled) => enhanceMgr.setChineseSessionTitle(enabled));
  handleSafe('ag-studio:enhance-apply-binary', () => enhanceMgr.applyBinaryChineseTitlePatch());
  handleSafe('ag-studio:enhance-restore-binary', () => enhanceMgr.restoreBinaryPatch());

  handleSafe('ag-studio:i18n-get', () => buildI18nPayload(store));
  handleSafe('ag-studio:i18n-save-custom', (_ev, dict) => {
    const saved = store.saveCustomDictionary(dict);
    const payload = buildI18nPayload(store);
    broadcastToAllWindows('ag-studio:i18n-changed', payload);
    return { saved, payload };
  });

  handleSafe('ag-studio:scan-fonts', () => scanLocalFonts({ store }));
  handleSafe('ag-studio:launch-cli', (_ev, opts) => launchCliTerminal({ store, ...(opts || {}) }));
  handleSafe('ag-studio:open-path', async (_ev, target) => {
    store.ensureLayout();
    const p = target === 'fonts' ? store.fontsDir : target === 'state' ? store.stateDir : String(target || store.stateDir);
    await shell.openPath(p);
    return { ok: true, path: p };
  });
  handleSafe('ag-studio:restart-host', () => {
    setTimeout(() => {
      try {
        app.relaunch();
        app.exit(0);
      } catch {}
    }, 150);
    return { restarting: true };
  });
}

async function ensureInjected(win, options = {}) {
  if (!win || (typeof win.isDestroyed === 'function' && win.isDestroyed())) return false;
  const wc = win.webContents;
  if (!wc || (typeof wc.isDestroyed === 'function' && wc.isDestroyed())) return false;
  const code = getRendererSource();
  if (!code) return false;
  try {
    const already = options.force ? false : await wc.executeJavaScript('Boolean(window.__AG_STUDIO_MOUNTED__)');
    if (already) return true;
    await wc.executeJavaScript(code);
    return true;
  } catch {
    return false;
  }
}

function attachWindow(win) {
  registerIpcOnce();
  if (!win || !win.webContents) return;
  if (win.__agStudioAttached) return;
  win.__agStudioAttached = true;

  win.webContents.on('did-finish-load', () => {
    void ensureInjected(win, { force: false });
  });
}

module.exports = {
  registerIpcOnce,
  attachWindow,
  ensureInjected,
  buildI18nPayload,
};
