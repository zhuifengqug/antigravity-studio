'use strict';

const fs = require('fs');
const path = require('path');
const {
  STUDIO_VERSION,
  DEFAULT_MODEL_PRICING,
  DEFAULT_MODEL_LIMITS,
  getGeminiAntigravityDir,
} = require('../shared/constants');
const { ConfigStore } = require('../shared/config-store');
const nativeI18n = require('../i18n/native-i18n');
const proxyManager = require('./proxy-manager');
const localApi = require('./local-api');
const meterCore = require('./meter-core');
const meterCollector = require('./meter-collector');
const meterAccounts = require('./meter-accounts');
const meterEnhance = require('./meter-enhance');
const meterContextUnlock = require('./meter-context-unlock');
const meterCliLauncher = require('./meter-cli-launcher');
const meterRehydrate = require('./meter-rehydrate');
const { scanLocalFonts } = require('./font-scanner');

let ipcRegistered = false;
let rendererSourceCache = null;
let i18nPreloadSourceCache = null;
let isAppQuitting = false;
const boundWindows = new WeakSet();
const boundWebContents = new WeakSet();
const injectionTimers = new WeakMap();
const wcProbeTimers = new WeakMap();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getElectronSafe() {
  try {
    return require('electron');
  } catch {
    return null;
  }
}

function getHostUtilsSafe() {
  try {
    return require('../utils');
  } catch {
    return null;
  }
}

function getHostLanguageServerSafe() {
  try {
    return require('../languageServer');
  } catch {
    return null;
  }
}

function getRendererSource() {
  if (rendererSourceCache) return rendererSourceCache;
  const candidates = [
    path.join(__dirname, 'studio-renderer.js'),
    path.resolve(__dirname, '..', '..', 'dist', 'studio-renderer.js'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      rendererSourceCache = fs.readFileSync(p, 'utf8');
      break;
    }
  }
  return rendererSourceCache || '';
}

function getI18nPreloadSource() {
  if (i18nPreloadSourceCache) return i18nPreloadSourceCache;
  const candidates = [
    path.join(__dirname, 'studio-i18n-preload.js'),
    path.resolve(__dirname, '..', '..', 'dist', 'studio-i18n-preload.js'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      i18nPreloadSourceCache = fs.readFileSync(p, 'utf8');
      break;
    }
  }
  return i18nPreloadSourceCache || '';
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
  const brandTitle = cfg.i18n?.brandTitle || 'english';
  if (lang === 'en') {
    return { language: 'en', brandTitle, exact: {}, regex: [], customExact: {}, customRegex: [] };
  }
  const baseDict = loadPackagedDictionary(lang);
  const custom = cfg.i18n?.customDictionaryEnabled !== false
    ? store.loadCustomDictionary()
    : { exact: {}, regex: [] };
  return {
    language: lang,
    brandTitle,
    exact: { ...(baseDict.exact || {}), ...(custom.exact || {}) },
    regex: [...(custom.regex || []), ...(baseDict.regex || [])],
    baseCount: Object.keys(baseDict.exact || {}).length,
    customCount: Object.keys(custom.exact || {}).length,
    customExact: custom.exact || {},
    customRegex: custom.regex || [],
  };
}

function getWindowWebContents(win) {
  if (!win || win.isDestroyed?.()) return null;
  if (win.webContents && !win.webContents.isDestroyed?.()) return win.webContents;

  const utils = getHostUtilsSafe();
  if (utils && typeof utils.getHubWebContents === 'function') {
    try {
      const wc = utils.getHubWebContents(win);
      if (wc && !wc.isDestroyed?.()) return wc;
    } catch {}
  }

  try {
    const children = win.contentView?.children;
    if (Array.isArray(children)) {
      for (const child of children) {
        if (child?.webContents && !child.webContents.isDestroyed?.()) {
          const url = child.webContents.getURL?.() || '';
          if (/^https?:\/\/(127\.0\.0\.1|localhost):\d+\//i.test(url)) {
            return child.webContents;
          }
        }
      }
      for (const child of children) {
        if (child?.webContents && !child.webContents.isDestroyed?.()) {
          const url = child.webContents.getURL?.() || '';
          if (!url.startsWith('data:')) {
            return child.webContents;
          }
        }
      }
    }
  } catch {}
  return null;
}

function resolveTargetWindow(sender) {
  const electron = getElectronSafe();
  if (electron?.BrowserWindow && typeof electron.BrowserWindow.fromWebContents === 'function') {
    try {
      const direct = electron.BrowserWindow.fromWebContents(sender);
      if (direct && !direct.isDestroyed?.()) return direct;
    } catch {}
  }
  const utils = getHostUtilsSafe();
  if (utils && typeof utils.resolveHubWindowFromWebContents === 'function') {
    try {
      const hubWin = utils.resolveHubWindowFromWebContents(sender);
      if (hubWin && !hubWin.isDestroyed?.()) return hubWin;
    } catch {}
  }
  return null;
}

function getActiveHubWindowOrigins() {
  const origins = [];
  const pushUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    const norm = localApi.normalizeLoopbackOrigin(rawUrl);
    if (norm && !origins.includes(norm)) origins.push(norm);
  };

  const utils = getHostUtilsSafe();
  if (utils && typeof utils.getHubWindows === 'function') {
    try {
      for (const win of utils.getHubWindows() || []) {
        const wc = getWindowWebContents(win);
        if (wc && !wc.isDestroyed?.()) pushUrl(wc.getURL?.());
      }
    } catch {}
  }

  const electron = getElectronSafe();
  if (electron?.BrowserWindow && typeof electron.BrowserWindow.getAllWindows === 'function') {
    try {
      for (const win of electron.BrowserWindow.getAllWindows() || []) {
        const wc = getWindowWebContents(win);
        if (wc && !wc.isDestroyed?.()) pushUrl(wc.getURL?.());
      }
    } catch {}
  }
  return origins;
}

function readHostLanguageServerAuth() {
  const ls = getHostLanguageServerSafe();
  let port = null;
  let csrfToken = '';
  let baseUrl = '';

  if (ls) {
    try {
      const rawPort = typeof ls.getLsPort === 'function' ? ls.getLsPort() : null;
      const numPort = Number(rawPort);
      if (Number.isInteger(numPort) && numPort > 0 && numPort <= 65535) {
        port = numPort;
      }
    } catch {}
    try {
      const tok = typeof ls.getLsCsrfToken === 'function' ? ls.getLsCsrfToken() : '';
      if (typeof tok === 'string' && tok.trim()) csrfToken = tok.trim();
    } catch {}
    try {
      const rawUrl = typeof ls.getLsBaseUrl === 'function' ? ls.getLsBaseUrl() : '';
      if (typeof rawUrl === 'string' && rawUrl.trim()) {
        baseUrl = localApi.normalizeLoopbackOrigin(rawUrl) || '';
      }
    } catch {}
  }

  if (!baseUrl && port) {
    baseUrl = `https://127.0.0.1:${port}`;
  }
  if (!port && baseUrl) {
    try {
      const u = new URL(baseUrl);
      if (u.port) port = Number(u.port);
    } catch {}
  }

  return {
    origin: baseUrl || null,
    port,
    csrfToken: csrfToken || null,
  };
}

function resolveHostAuthContext(event = null) {
  const lsAuth = readHostLanguageServerAuth();
  const senderUrl = event?.senderFrame?.url || event?.sender?.getURL?.() || '';
  const eventOrigin = localApi.normalizeLoopbackOrigin(senderUrl);
  const hubOrigins = getActiveHubWindowOrigins();

  let daemonHit = null;
  if (!lsAuth.origin || !lsAuth.csrfToken) {
    try {
      const daemonList = meterAccounts.discoverDaemonHubOrigins();
      if (Array.isArray(daemonList) && daemonList.length > 0) {
        daemonHit = daemonList[0];
      }
    } catch {}
  }

  const candidateOrigins = [];
  const pushOrigin = (o) => {
    const norm = localApi.normalizeLoopbackOrigin(o);
    if (norm && !candidateOrigins.includes(norm)) candidateOrigins.push(norm);
  };

  if (lsAuth.origin) pushOrigin(lsAuth.origin);
  if (eventOrigin) pushOrigin(eventOrigin);
  for (const h of hubOrigins) pushOrigin(h);
  if (daemonHit?.origin) pushOrigin(daemonHit.origin);

  const primaryOrigin = candidateOrigins[0] || null;
  const primaryToken = lsAuth.csrfToken || daemonHit?.csrfToken || null;

  return {
    origin: primaryOrigin,
    candidateOrigins,
    port: lsAuth.port || daemonHit?.httpsPort || null,
    csrfToken: primaryToken,
    fallbackCsrfToken: daemonHit?.csrfToken || lsAuth.csrfToken || null,
    getLiveOrigins: getActiveHubWindowOrigins,
    getHostAuth: async () => {
      const cur = readHostLanguageServerAuth();
      const hubs = getActiveHubWindowOrigins();
      return {
        origin: cur.origin || hubs[0] || primaryOrigin,
        port: cur.port || lsAuth.port || null,
        csrfToken: cur.csrfToken || primaryToken || null,
      };
    },
  };
}

function broadcastToAllWindows(channel, payload) {
  const sent = new Set();
  const sendToWin = (win) => {
    const wc = getWindowWebContents(win);
    if (!wc || wc.isDestroyed?.() || sent.has(wc)) return;
    sent.add(wc);
    try {
      wc.send(channel, payload);
    } catch {}
  };

  const utils = getHostUtilsSafe();
  if (utils && typeof utils.getHubWindows === 'function') {
    try {
      for (const win of utils.getHubWindows() || []) sendToWin(win);
    } catch {}
  }
  const electron = getElectronSafe();
  if (electron?.BrowserWindow && typeof electron.BrowserWindow.getAllWindows === 'function') {
    try {
      for (const win of electron.BrowserWindow.getAllWindows() || []) sendToWin(win);
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

function resolveContextLimit(modelName, perModelLimits = {}) {
  const name = String(modelName || '');
  const lower = name.toLowerCase();
  if (perModelLimits && perModelLimits[name]) return Number(perModelLimits[name]);
  for (const [k, v] of Object.entries(perModelLimits || {})) {
    if (lower.includes(k.toLowerCase())) return Number(v);
  }
  for (const [k, v] of Object.entries(DEFAULT_MODEL_LIMITS)) {
    if (lower.includes(k)) return Number(v);
  }
  return 200000;
}

function resolveModelPricing(modelName, overrides = {}) {
  const key = String(modelName || '').toLowerCase();
  for (const [k, v] of Object.entries(overrides || {})) {
    if (key.includes(k.toLowerCase())) return { ...DEFAULT_MODEL_PRICING.default, ...v };
  }
  for (const [k, v] of Object.entries(DEFAULT_MODEL_PRICING)) {
    if (k !== 'default' && key.includes(k)) return v;
  }
  return DEFAULT_MODEL_PRICING.default;
}

function estimateFallbackCostUsd({ inputTokens = 0, outputTokens = 0, cachedTokens = 0, model = '', pricingOverrides = {} }) {
  const p = resolveModelPricing(model, pricingOverrides);
  const nonCachedIn = Math.max(0, Number(inputTokens) - Number(cachedTokens));
  const inCost = (nonCachedIn / 1e6) * Number(p.inputPer1M || 0);
  const cacheCost = (Number(cachedTokens) / 1e6) * Number(p.cachedPer1M || 0);
  const outCost = (Number(outputTokens) / 1e6) * Number(p.outputPer1M || 0);
  return Number((inCost + cacheCost + outCost).toFixed(6));
}

function midEstimate(group) {
  if (!group || typeof group !== 'object') return 0;
  const low = Number(group.low || 0);
  const high = Number(group.high || 0);
  if (low > 0 || high > 0) return Math.round((low + high) / 2);
  return 0;
}

function formatFriendlyPoolTitle(rawKey, models = []) {
  const key = String(rawKey || '').trim();
  const low = key.toLowerCase();
  if (low === 'shared_gemini_main') return 'Gemini 4 主力共享池';
  if (low === 'shared_3p_pool') return 'Claude / GPT 共享池';
  if (low === 'shared_gemini_argon') return 'Gemini 4 Argon / 编排池';
  if (low === 'shared_gemini_carbon') return 'Gemini 4 Carbon 专属池';
  if (low === 'shared_gemini_flash' || (low.includes('gemini') && low.includes('flash'))) {
    return 'Gemini Flash 轻量池';
  }
  const labels = (Array.isArray(models) ? models : [])
    .map((m) => String(m?.productLabel || m?.label || '').trim())
    .filter((s) => s && !/^MODEL_PLACEHOLDER/i.test(s));
  const uniqueLabels = [...new Set(labels)];
  if (uniqueLabels.length) {
    return uniqueLabels.slice(0, 2).join(' / ') + (uniqueLabels.length > 2 ? ' 等共享池' : ' 共享池');
  }
  if (!key || /^shared_/i.test(key) || /^MODEL_PLACEHOLDER/i.test(key)) {
    return '模型共享额度池';
  }
  return key;
}

function normalizeQuotaForUi(quotaRes, lowThreshold = 0.2) {
  const snap = quotaRes?.snapshot || {};
  const rawPools = Array.isArray(snap.pools) ? snap.pools : [];
  const pools = rawPools.map((p) => {
    const frac = typeof p.remainingFraction === 'number' ? p.remainingFraction : null;
    const pct = p.remainingPercent != null
      ? Number(p.remainingPercent)
      : (frac !== null ? Math.round(frac * 100) : null);
    const rawKey = p.poolKey || p.title || 'Pool';
    const poolModels = Array.isArray(p.models) ? p.models : [];
    const modelNames = [...new Set(
      poolModels
        .map((m) => String(m?.productLabel || m?.label || m?.productKey || '').trim())
        .filter((s) => s && !/^MODEL_PLACEHOLDER/i.test(s))
    )];
    const displayName = formatFriendlyPoolTitle(rawKey, poolModels);
    return {
      ...p,
      poolKey: rawKey,
      displayName,
      modelNames,
      remainingFraction: frac,
      remainingPercent: pct,
      resetTime: p.resetTime || p.resetTimeIso || null,
      isLow: p.isLow !== undefined ? Boolean(p.isLow) : (frac !== null ? frac <= lowThreshold : false),
    };
  });

  const models = [];
  for (const p of pools) {
    for (const m of (Array.isArray(p.models) ? p.models : [])) {
      const mFrac = typeof m.remainingFraction === 'number' ? m.remainingFraction : p.remainingFraction;
      models.push({
        id: (Array.isArray(m.modelIds) && m.modelIds[0]) || m.productKey || m.productLabel || 'unknown',
        label: m.productLabel || m.productKey || 'unknown',
        poolKey: p.poolKey,
        remainingFraction: mFrac,
        remainingPercent: mFrac !== null ? Math.round(mFrac * 100) : null,
        resetTime: p.resetTime || null,
        isLow: mFrac !== null ? mFrac <= lowThreshold : false,
      });
    }
  }

  return {
    ok: quotaRes?.ok !== false,
    email: snap.planStatus?.email || quotaRes?.planTierSummary?.email || '',
    name: snap.planStatus?.name || '',
    planName: snap.planStatus?.planName || quotaRes?.planTierSummary?.planName || quotaRes?.planTierSummary?.tierName || '',
    creditsBalance: snap.planStatus?.availablePromptCredits ?? null,
    models,
    pools,
    lowQuotaDetected: pools.some((p) => p.isLow) || models.some((m) => m.isLow),
    fetchedAtMs: quotaRes?.fetchedAtMs || snap.fetchedAtMs || Date.now(),
    error: quotaRes?.error || null,
    snapshot: snap,
  };
}

function shapeCollectResultForUi(collected, quotaUi, cfg, cid) {
  const latest = collected?.latest || null;
  const latestCall = collected?.latestCallRecord || null;
  const session = collected?.session || {};
  const groups = session.groups || {};

  const rawSys = midEstimate(groups.system);
  const rawTools = midEstimate(groups.definitions) + midEstimate(groups.tools);
  const rawUser = midEstimate(groups.user) + midEstimate(groups.summaries);
  const rawAsst = midEstimate(groups.assistant);
  const rawThink = Math.max(midEstimate(groups.thinking), Number(latest?.speed?.thinkingTokens || 0));
  const rawTotal = rawSys + rawTools + rawUser + rawAsst + rawThink;

  const modelName = latest?.model || latestCall?.model || latest?.modelRaw || 'gemini-4-neon';
  const contextLimit = Number(
    latest?.budget ||
    latest?.serviceLimit ||
    resolveContextLimit(modelName, cfg.context?.perModelLimits)
  ) || 200000;

  const serverUsed = Number(latest?.actual ?? latest?.used ?? 0);
  const sessionMidTotal = midEstimate(session.total);
  const usedTokens = serverUsed > 0 ? serverUsed : (sessionMidTotal > 0 ? sessionMidTotal : rawTotal);

  let bdSystem = rawSys;
  let bdTools = rawTools;
  let bdUser = rawUser;
  let bdAssistant = rawAsst;
  let bdThinking = rawThink;

  if (usedTokens > 0 && rawTotal > 0 && serverUsed > 0) {
    const scale = usedTokens / rawTotal;
    bdSystem = Math.round(rawSys * scale);
    bdTools = Math.round(rawTools * scale);
    bdUser = Math.round(rawUser * scale);
    bdAssistant = Math.round(rawAsst * scale);
    bdThinking = Math.max(0, usedTokens - bdSystem - bdTools - bdUser - bdAssistant);
  } else if (usedTokens > 0 && rawTotal === 0) {
    const serverIn = Number(latest?.input || 0);
    const serverOut = Number(latest?.output || 0);
    const serverThink = Number(latest?.speed?.thinkingTokens || 0);
    bdUser = serverIn > 0 ? serverIn : usedTokens;
    bdAssistant = Math.max(0, serverOut - serverThink);
    bdThinking = serverThink;
  }

  const cachedTokens = Number(latest?.cached || latestCall?.cacheReadTokens || 0);
  const totalInputForHit = Number(latest?.input || (bdSystem + bdTools + bdUser));
  const cacheHitRate = totalInputForHit > 0 && cachedTokens > 0
    ? Number(Math.min(1, cachedTokens / totalInputForHit).toFixed(4))
    : 0;
  const usageRatio = contextLimit > 0 ? Number(Math.min(1, usedTokens / contextLimit).toFixed(4)) : 0;

  const speedObj = latest?.speed || {};
  const tokPerSec = Number(speedObj.tps || speedObj.streamingTps || latestCall?.tps || 0);
  const ttftMs = speedObj.ttft != null
    ? Math.round(Number(speedObj.ttft) * 1000)
    : (latestCall?.ttftSec != null ? Math.round(Number(latestCall.ttftSec) * 1000) : 0);
  const durationMs = speedObj.duration != null
    ? Math.round(Number(speedObj.duration) * 1000)
    : (latestCall?.durationSec != null ? Math.round(Number(latestCall.durationSec) * 1000) : 0);
  const isGenerating = Boolean(
    latestCall?.status === 'streaming' ||
    latest?.status === 'pending' ||
    latest?.status === 'streaming'
  );

  const rawAtts = Array.isArray(session.attachments) ? session.attachments : [];
  const attachments = {
    count: rawAtts.length,
    totalTokens: midEstimate(session.attachmentTotal),
    unknownFiles: Number(session.unknownFiles || 0),
    complete: session.complete !== false,
    files: rawAtts.map((a) => ({
      name: a.name || a.uri || 'file',
      path: a.uri || a.path || '',
      mime: a.mime || '',
      tokens: midEstimate(a) * Number(a.references || 1),
      references: Number(a.references || 1),
      status: a.status || 'parsed',
    })),
  };

  let estCostUsd = 0;
  if (latestCall && typeof latestCall.costUSD === 'number' && Number.isFinite(latestCall.costUSD)) {
    estCostUsd = latestCall.costUSD;
  } else {
    estCostUsd = estimateFallbackCostUsd({
      inputTokens: Number(latest?.input || (bdSystem + bdTools + bdUser)),
      outputTokens: Number(latest?.output || (bdAssistant + bdThinking)),
      cachedTokens,
      model: modelName,
      pricingOverrides: cfg.enhance?.pricingOverrides,
    });
  }

  let evaluation = null;
  try {
    if (typeof meterCore.evaluateGenerationExperience === 'function') {
      const lang = cfg?.i18n?.language || 'zh-CN';
      const totalIn = Number(latest?.input || (bdSystem + bdTools + bdUser));
      const outTok = Number(latest?.output || (bdAssistant + bdThinking));
      const ttftSec = ttftMs > 0 ? ttftMs / 1000 : null;
      const durSec = durationMs > 0 ? durationMs / 1000 : null;
      const streamingSec = speedObj.streamingSec != null
        ? Number(speedObj.streamingSec)
        : (latestCall?.streamingSec != null ? Number(latestCall.streamingSec) : null);
      const streamSpeed = Number(speedObj.streamingTps || speedObj.tps || latestCall?.tps || 0) || null;
      const phase = isGenerating ? 'streaming' : (outTok > 0 || durSec ? 'final' : '');
      if (phase) {
        const ev = meterCore.evaluateGenerationExperience({
          phase,
          outcomeStatus: latestCall?.outcomeStatus || latestCall?.status || latest?.status || '',
          outputTokens: outTok,
          totalInputTokens: totalIn,
          ttftSec,
          streamingSec,
          totalDurationSec: durSec,
          streamSpeed,
          overallTps: tokPerSec > 0 ? tokPerSec : null,
        }, lang);
        if (ev) {
          evaluation = {
            phase: ev.phase || phase,
            badge: ev.badge || null,
            shortTitle: ev.shortTitle || '',
            comment: ev.comment || '',
            subLabel: ev.subLabel || '',
            score: ev.efficiency?.available ? ev.efficiency.score : null,
            grade: ev.efficiency?.available ? ev.efficiency.grade : null,
            ttftFormatted: ev.ttftFormatted || '',
            durationFormatted: ev.durationFormatted || '',
          };
        }
      }
    }
  } catch {}

  return {
    lsConnected: true,
    lsError: null,
    conversationId: cid || collected?.conversation || '',
    workspacePath: collected?.workspacePath || null,
    context: {
      model: modelName,
      modelId: latest?.modelId || null,
      usedTokens,
      contextLimit,
      remainingTokens: Math.max(0, contextLimit - usedTokens),
      usageRatio,
      cacheHitRate,
      estimated: Boolean(latest?.estimated ?? (serverUsed <= 0)),
      breakdown: {
        system: bdSystem,
        tools: bdTools,
        user: bdUser,
        assistant: bdAssistant,
        thinking: bdThinking,
        cached: cachedTokens,
      },
      speed: {
        tokPerSec,
        tps: tokPerSec,
        streamingTps: Number(speedObj.streamingTps || 0),
        ttftMs,
        durationMs,
        isGenerating,
        eScore: speedObj.eScore ?? evaluation?.score ?? null,
        eGrade: speedObj.eGrade ?? evaluation?.grade ?? null,
        evaluation,
      },
      attachments,
    },
    attachments,
    quota: quotaUi,
    estimatedSessionCostUsd: Number(Number(estCostUsd || 0).toFixed(6)),
    latest,
    latestCallRecord: latestCall,
    recentGeneratorCalls: collected?.recentGeneratorCalls || [],
    cascadeModelConfigs: collected?.cascadeModelConfigs || [],
    scannedAt: collected?.scannedAt || Date.now(),
    timestamp: Date.now(),
  };
}

function buildEmptySnapshot(cfg, quotaUi, cid = '', lsError = null) {
  const defaultLimit = resolveContextLimit('gemini-4-neon', cfg.context?.perModelLimits);
  return {
    lsConnected: Boolean(quotaUi?.ok && (quotaUi.pools?.length || quotaUi.models?.length || quotaUi.email)),
    lsError,
    conversationId: cid || '',
    context: {
      model: '未连接会话',
      usedTokens: 0,
      contextLimit: defaultLimit,
      remainingTokens: defaultLimit,
      usageRatio: 0,
      cacheHitRate: 0,
      breakdown: { system: 0, tools: 0, user: 0, assistant: 0, thinking: 0, cached: 0 },
      speed: { tokPerSec: 0, tps: 0, ttftMs: 0, durationMs: 0, isGenerating: false },
    },
    attachments: { count: 0, totalTokens: 0, files: [] },
    quota: quotaUi || {
      email: '',
      name: '',
      planName: '',
      creditsBalance: null,
      models: [],
      pools: [],
      lowQuotaDetected: false,
    },
    estimatedSessionCostUsd: 0,
    timestamp: Date.now(),
  };
}

async function fetchQuotaWithHostAuth(authCtx, opts = {}, cfg = null) {
  const lowThreshold = Number(cfg?.quota?.lowQuotaThreshold ?? 0.2);
  let lastRes = null;
  const origins = authCtx.candidateOrigins.length ? authCtx.candidateOrigins : [null];
  for (const candOrigin of origins) {
    try {
      const res = await meterCollector.fetchQuotaSnapshotFromHost({
        ...(candOrigin ? { origin: candOrigin } : {}),
        ...(authCtx.csrfToken ? { csrfToken: authCtx.csrfToken } : {}),
        ...(authCtx.fallbackCsrfToken ? { fallbackCsrfToken: authCtx.fallbackCsrfToken } : {}),
        force: opts?.force === true,
        backendSource: 'electron-ipc',
      });
      lastRes = res;
      if (res && res.ok) break;
    } catch (err) {
      lastRes = { ok: false, error: err.message, snapshot: {} };
    }
  }
  return {
    raw: lastRes,
    ui: normalizeQuotaForUi(lastRes, lowThreshold),
  };
}

async function recordLiveCallsBestEffort(calls, authCtx) {
  if (!Array.isArray(calls) || !calls.length) return;
  try {
    const mgr = meterAccounts.getSharedAccountsManager({
      origin: authCtx.origin,
      csrfToken: authCtx.csrfToken,
      getHostAuth: authCtx.getHostAuth,
      getLiveOrigins: authCtx.getLiveOrigins,
    });
    const ov = mgr.getOverviewState();
    const switchInFlight = Boolean(mgr.isSwitchInFlight?.() || ov?.switchInProgress);
    const activeEmail = !switchInFlight ? (ov?.activeAccountEmail || null) : null;
    const sessions = Array.isArray(ov?.accountSessions) ? ov.accountSessions : [];
    const openSess = activeEmail
      ? sessions.slice().reverse().find((s) => String(s.email).toLowerCase() === String(activeEmail).toLowerCase() && s.endAtMs == null)
      : null;
    const recOpts = {
      accountSessions: sessions,
      ...(!switchInFlight && activeEmail ? {
        confirmedAccountEmail: activeEmail,
        liveConfirmedAccount: {
          email: activeEmail,
          verifiedAtMs: openSess?.lastVerifiedAtMs || Date.now(),
          sessionStartMs: openSess?.startAtMs || Date.now(),
        },
      } : {}),
    };
    await meterCollector.recordModelCallsAsync(calls, recOpts);
  } catch {}
}

const TURN_STATE_CACHE_TTL_MS = 2800;
const turnStateCache = new Map();

async function getTurnStateForConversation(cid, authCtx) {
  if (!cid || !UUID_RE.test(cid)) {
    return {
      ok: true,
      lsConnected: Boolean(authCtx.origin && authCtx.csrfToken),
      conversationId: cid || '',
      isGenerating: false,
      isThinking: false,
      isToolWorking: false,
      awaitingApproval: false,
      hasError: false,
      hasRunningSubagents: false,
      streamingStepCount: 0,
      status: 'idle',
      state: 'idle',
    };
  }

  const cached = turnStateCache.get(cid);
  if (cached && (Date.now() - cached.at) < TURN_STATE_CACHE_TTL_MS) {
    return cached.value;
  }

  let full = null;
  const origins = authCtx.candidateOrigins.length ? authCtx.candidateOrigins : [];
  for (const candOrigin of origins) {
    try {
      const api = await localApi.connect({
        origin: candOrigin,
        csrfToken: authCtx.csrfToken,
        fallbackCsrfToken: authCtx.fallbackCsrfToken,
      });
      full = await api.call('GetCascadeTrajectory', { cascadeId: cid, trajectoryVerbosity: 1 });
      if (full?.trajectory) break;
    } catch {}
  }

  if (!full?.trajectory) {
    return {
      ok: true,
      lsConnected: false,
      conversationId: cid,
      isGenerating: false,
      isThinking: false,
      isToolWorking: false,
      awaitingApproval: false,
      hasError: false,
      hasRunningSubagents: false,
      streamingStepCount: 0,
      status: 'idle',
      state: 'idle',
    };
  }

  const traj = full.trajectory;
  const steps = Array.isArray(traj.steps) ? traj.steps : [];
  const trajStatus = String(full.status || traj.status || '').toUpperCase();
  const tailSteps = steps.slice(-8);

  let streamingStepCount = 0;
  let awaitingApproval = trajStatus.includes('WAITING');
  let hasError = trajStatus.includes('ERROR') || trajStatus.includes('FAIL');
  let hasRunningSubagents = false;
  let isToolWorking = false;
  let isThinking = false;
  let activeModel = '';

  for (const step of tailSteps) {
    if (!step || typeof step !== 'object') continue;
    const st = String(step.status || '').toUpperCase();
    const tp = String(step.type || '').toUpperCase();
    const isActiveStep = st.includes('RUNNING') || st.includes('PENDING') || st.includes('STREAMING');
    const isWaitStep = st.includes('WAITING');

    if (isWaitStep) awaitingApproval = true;
    if (isActiveStep) {
      streamingStepCount++;
      if (tp.includes('SUBAGENT') || step.subagent) {
        hasRunningSubagents = true;
      } else if (step.plannerResponse) {
        if (step.plannerResponse.toolCalls?.length) isToolWorking = true;
        else isThinking = true;
      } else if (!step.userInput) {
        isToolWorking = true;
      }
    }
    const mdModel = step.metadata?.requestedModel?.model || step.metadata?.generatorModel?.model;
    if (mdModel) activeModel = mdModel;
  }

  const lastStep = steps.length ? steps[steps.length - 1] : null;
  if (lastStep && (lastStep.errorMessage || String(lastStep.status || '').toUpperCase().includes('ERROR'))) {
    hasError = true;
  }

  const isGenerating = streamingStepCount > 0 || trajStatus.includes('RUNNING');
  let state = 'idle';
  if (hasError) state = 'error';
  else if (awaitingApproval) state = 'waiting';
  else if (hasRunningSubagents) state = 'subagent';
  else if (isToolWorking) state = 'working';
  else if (isThinking || isGenerating) state = 'thinking';

  const out = {
    ok: true,
    lsConnected: true,
    conversationId: cid,
    isGenerating,
    isThinking,
    isToolWorking,
    awaitingApproval,
    hasError,
    hasRunningSubagents,
    streamingStepCount,
    status: hasError ? 'error' : (isGenerating ? 'running' : 'idle'),
    state,
    model: activeModel || undefined,
  };
  turnStateCache.set(cid, { at: Date.now(), value: out });
  if (turnStateCache.size > 16) {
    const firstKey = turnStateCache.keys().next().value;
    if (firstKey) turnStateCache.delete(firstKey);
  }
  return out;
}

function parseCallDateKeyAndHour(call, fallbackDate = null) {
  const tsRaw =
    call.requestStartMs ??
    call.startTimeMs ??
    call.created_at ??
    call.createdAt ??
    call.timestamp ??
    call.updatedAt ??
    null;
  let ms = null;
  if (typeof tsRaw === 'number' && Number.isFinite(tsRaw) && tsRaw > 0) {
    ms = tsRaw < 1e11 ? tsRaw * 1000 : tsRaw;
  } else if (typeof tsRaw === 'string' && tsRaw.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(tsRaw.trim())) {
    const parsed = Date.parse(tsRaw.trim());
    if (Number.isFinite(parsed) && parsed > 0) ms = parsed;
  }
  const dKey = (typeof call.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(call.date))
    ? call.date
    : (ms ? meterCollector.formatLocalDateKey(new Date(ms)) : fallbackDate);
  const hour = ms ? new Date(ms).getHours() : null;
  return { date: dKey, hour };
}

function resolveCutoffDateKey(days) {
  const d = Number(days || 0);
  if (!Number.isFinite(d) || d <= 0) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - (d - 1));
  return meterCollector.formatLocalDateKey(now);
}

async function computeHistoryOverview(days, authCtx, store) {
  const cfg = store.load();
  const reqDays = Number.isFinite(Number(days)) ? Number(days) : 30;
  const cutoffKey = resolveCutoffDateKey(reqDays);
  const agDir = getGeminiAntigravityDir();

  let history = null;
  try {
    history = await meterCollector.collectTokenHistoryAsync({
      force: false,
      agDir,
      ...(authCtx.origin ? { origin: authCtx.origin } : {}),
      ...(authCtx.csrfToken ? { csrfToken: authCtx.csrfToken } : {}),
      ...(authCtx.fallbackCsrfToken ? { fallbackCsrfToken: authCtx.fallbackCsrfToken } : {}),
    });
  } catch {}

  const dailyAll = { ...(history?.dailyMapBySource?.all || history?.dailyMap || {}) };
  const dailyDesktop = { ...(history?.dailyMapBySource?.desktop || {}) };
  const dailyCli = { ...(history?.dailyMapBySource?.cli || {}) };
  const dailyModelsAll = history?.dailyModelMapBySource?.all || {};
  const modelMetaByKey = history?.modelMetaByKey || {};

  // Read pricing_ledger_v1.json directly to compute exact distinct sessions, call count,
  // cost, peakHour, and fallback daily/model buckets when transcripts/archive_v2 are absent.
  const ledger = meterCollector.loadPricingLedger(agDir);
  const callsMap = ledger?.calls || {};
  const sessionIds = new Set();
  const hourBuckets = new Array(24).fill(0);
  const ledgerDailyAll = {};
  const ledgerDailyDesktop = {};
  const ledgerDailyCli = {};
  const ledgerModelAgg = new Map();
  let ledgerCallCount = 0;
  let ledgerCostUsd = 0;

  for (const [callId, call] of Object.entries(callsMap)) {
    if (!call || typeof call !== 'object') continue;
    const { date, hour } = parseCallDateKeyAndHour(call, null);
    if (cutoffKey && date && date < cutoffKey) continue;
    if (cutoffKey && !date) continue;

    ledgerCallCount++;
    const inp = Number(call.inputTokens ?? call.input_tokens ?? call.input ?? 0) || 0;
    const cache = Number(call.cacheTokens ?? call.cacheReadTokens ?? call.cache_read_tokens ?? call.cached ?? 0) || 0;
    const out = Number(call.outputTokens ?? call.output_tokens ?? call.output ?? 0) || 0;
    const tot = Number(call.totalTokens || (inp + cache + out) || 0);
    if (hour !== null && hour >= 0 && hour < 24) {
      hourBuckets[hour] += tot > 0 ? tot : 1;
    }
    if (call.cascadeId) {
      sessionIds.add(String(call.cascadeId).toLowerCase());
    } else if (callId) {
      sessionIds.add(`call:${callId}`);
    }

    const callCost = (typeof call.costUSD === 'number' && Number.isFinite(call.costUSD))
      ? call.costUSD
      : (tot > 0
        ? estimateFallbackCostUsd({
            inputTokens: inp + cache,
            outputTokens: out,
            cachedTokens: cache,
            model: call.modelKey || call.model || '',
            pricingOverrides: cfg.enhance?.pricingOverrides,
          })
        : 0);
    ledgerCostUsd += callCost;

    if (date && tot > 0) {
      const addDay = (map) => {
        if (!map[date]) map[date] = { total: 0, input: 0, output: 0, cache: 0, steps: 0 };
        map[date].total += tot;
        map[date].input += inp;
        map[date].output += out;
        map[date].cache += cache;
        map[date].steps += 1;
      };
      addDay(ledgerDailyAll);
      addDay(call.source === 'cli' ? ledgerDailyCli : ledgerDailyDesktop);

      const mLabel = call.modelLabel || call.model || call.modelKey || 'unknown';
      const curM = ledgerModelAgg.get(mLabel) || {
        model: mLabel,
        modelKey: call.modelKey || mLabel,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheTokens: 0,
        steps: 0,
        costUsd: 0,
      };
      curM.totalTokens += tot;
      curM.inputTokens += inp;
      curM.outputTokens += out;
      curM.cacheTokens += cache;
      curM.steps += 1;
      curM.costUsd = Number((curM.costUsd + callCost).toFixed(4));
      ledgerModelAgg.set(mLabel, curM);
    }
  }

  for (const [dKey, b] of Object.entries(ledgerDailyAll)) {
    if (!dailyAll[dKey] || Number(dailyAll[dKey].total || 0) <= 0) {
      dailyAll[dKey] = b;
    }
  }
  for (const [dKey, b] of Object.entries(ledgerDailyDesktop)) {
    if (!dailyDesktop[dKey] || Number(dailyDesktop[dKey].total || 0) <= 0) {
      dailyDesktop[dKey] = b;
    }
  }
  for (const [dKey, b] of Object.entries(ledgerDailyCli)) {
    if (!dailyCli[dKey] || Number(dailyCli[dKey].total || 0) <= 0) {
      dailyCli[dKey] = b;
    }
  }

  let totalTokens = 0;
  let callsFromDaily = 0;
  let activeDays = 0;
  const heatmap7xN = [];

  for (const dateKey of Object.keys(dailyAll).sort()) {
    if (cutoffKey && dateKey < cutoffKey) continue;
    const b = dailyAll[dateKey] || {};
    const tot = Number(b.total || 0);
    const inp = Number(b.input || 0);
    const out = Number(b.output || 0);
    const cache = Number(b.cache || 0);
    const steps = Number(b.steps || 0);
    if (tot > 0) activeDays++;
    totalTokens += tot;
    callsFromDaily += steps;
    heatmap7xN.push({
      date: dateKey,
      total: tot,
      totalTokens: tot,
      input: inp,
      output: out,
      cache,
      steps,
    });
  }

  const sumSourceMap = (srcMap) => {
    const acc = { totalTokens: 0, inputTokens: 0, outputTokens: 0, cacheTokens: 0, steps: 0 };
    for (const [dateKey, b] of Object.entries(srcMap || {})) {
      if (cutoffKey && dateKey < cutoffKey) continue;
      acc.totalTokens += Number(b?.total || 0);
      acc.inputTokens += Number(b?.input || 0);
      acc.outputTokens += Number(b?.output || 0);
      acc.cacheTokens += Number(b?.cache || 0);
      acc.steps += Number(b?.steps || 0);
    }
    return acc;
  };

  const desktopStats = sumSourceMap(dailyDesktop);
  const cliStats = sumSourceMap(dailyCli);
  if (desktopStats.totalTokens + cliStats.totalTokens === 0 && totalTokens > 0) {
    desktopStats.totalTokens = totalTokens;
  }

  // Aggregate models + estimate cost per model in window
  const modelAgg = new Map();
  for (const [dateKey, dayModels] of Object.entries(dailyModelsAll)) {
    if (cutoffKey && dateKey < cutoffKey) continue;
    for (const [vKey, stats] of Object.entries(dayModels || {})) {
      const meta = modelMetaByKey[vKey] || {};
      const label = meta.modelLabel || meta.modelKey || vKey;
      if (label === '__unattributed__' || vKey === '__unattributed__') continue;
      const cur = modelAgg.get(label) || {
        model: label,
        modelKey: meta.modelKey || vKey,
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheTokens: 0,
        steps: 0,
        costUsd: 0,
      };
      const inp = Number(stats?.input || 0);
      const out = Number(stats?.output || 0);
      const cache = Number(stats?.cache || 0);
      const tot = Number(stats?.total || 0);
      cur.totalTokens += tot;
      cur.inputTokens += inp;
      cur.outputTokens += out;
      cur.cacheTokens += cache;
      cur.steps += Number(stats?.steps || 0);
      cur.costUsd = Number((cur.costUsd + estimateFallbackCostUsd({
        inputTokens: inp + cache,
        outputTokens: out,
        cachedTokens: cache,
        model: meta.modelKey || label,
        pricingOverrides: cfg.enhance?.pricingOverrides,
      })).toFixed(4));
      modelAgg.set(label, cur);
    }
  }

  const byModel = Array.from((modelAgg.size > 0 ? modelAgg : ledgerModelAgg).values())
    .sort((a, b) => b.totalTokens - a.totalTokens);
  const topModel = byModel[0]?.model || null;

  let peakHour = null;
  let peakVal = 0;
  for (let h = 0; h < 24; h++) {
    if (hourBuckets[h] > peakVal) {
      peakVal = hourBuckets[h];
      peakHour = h;
    }
  }

  const sessions = reqDays <= 0
    ? Math.max(sessionIds.size, Number(history?.summary?.totalConversations || 0))
    : sessionIds.size;
  const calls = Math.max(ledgerCallCount, callsFromDaily);

  const modelSumCost = byModel.reduce((s, m) => s + Number(m.costUsd || 0), 0);
  const fullHistoryCost = Number(history?.costEstimate?.pricedCostUSD ?? history?.referenceCost?.hybrid?.costUSD ?? 0);
  const costEstimate = Number((
    ledgerCostUsd > 0
      ? ledgerCostUsd
      : (modelSumCost > 0 ? modelSumCost : (reqDays <= 0 ? fullHistoryCost : 0))
  ).toFixed(4));

  const subMonthlyUsd = Number(cfg.enhance?.subscriptionMonthlyUsd ?? 20);
  const savingsVsSub = Number((costEstimate - subMonthlyUsd).toFixed(2));

  return {
    days: reqDays,
    sessions,
    calls,
    messages: calls,
    totalTokens,
    activeDays,
    peakHour,
    topModel,
    heatmap7xN,
    heatmap: heatmap7xN,
    bySource: {
      desktop: desktopStats,
      cli: cliStats,
    },
    byModel,
    costEstimate,
    totalCostUsd: costEstimate,
    subscriptionMonthlyUsd: subMonthlyUsd,
    savingsVsSub,
    savingsVsApiUsd: savingsVsSub,
    summary: history?.summary || null,
    updatedAt: history?.updatedAt || new Date().toISOString(),
  };
}

function normalizeAccountsOverviewForUi(overview, detectedActive = null) {
  const ov = overview || { accounts: [] };
  const accounts = (Array.isArray(ov.accounts) ? ov.accounts : []).map((acc) => {
    const snap = acc.quotaSnapshot || null;
    let minRem = snap?.minRemainingPercent ?? null;
    if (minRem === null && Array.isArray(snap?.pools) && snap.pools.length) {
      for (const p of snap.pools) {
        const pct = p.remainingPercent != null
          ? Number(p.remainingPercent)
          : (typeof p.remainingFraction === 'number' ? Math.round(p.remainingFraction * 100) : null);
        if (pct !== null && (minRem === null || pct < minRem)) minRem = pct;
      }
    }
    return {
      ...acc,
      id: acc.id || acc.email || acc.accountScopeKey,
      planName: acc.planName || acc.tierId || acc.source || 'Standard',
      quotaSnapshot: snap ? { ...snap, minRemainingPercent: minRem } : null,
    };
  });

  const activeItem = accounts.find((a) => a.isActive) || null;
  const activeDetected = detectedActive && detectedActive.email
    ? {
        email: detectedActive.email,
        name: detectedActive.name || detectedActive.email.split('@')[0],
        planName: detectedActive.planName || detectedActive.tierName || 'Active',
      }
    : (activeItem ? {
        email: activeItem.email,
        name: activeItem.name,
        planName: activeItem.planName,
      } : null);

  return {
    ...ov,
    accounts,
    activeDetected,
  };
}

function normalizeEnhanceStatusForUi(raw, cfg) {
  const summary = raw?.summary || {};
  const promptTier = Number(raw?.promptTier ?? summary.promptTier ?? cfg.enhance?.promptTier ?? 0);
  const chineseMode = raw?.chineseTitleMode || summary.chineseTitleMode || '';
  const chineseTitle = chineseMode
    ? chineseMode === 'zh'
    : Boolean(raw?.chineseTitle ?? cfg.enhance?.chineseTitle ?? cfg.enhance?.chineseSessionTitle);
  return {
    ...(raw || {}),
    ok: raw?.ok !== false,
    promptTier,
    chineseTitle,
    chineseSessionTitle: chineseTitle,
  };
}

function normalizeUnlockStatusForUi(raw, cfg) {
  const cfgMode = String(raw?.configuredMode || '').toLowerCase();
  let mode = cfg.context?.unlockMode || 'ORIG';
  if (cfgMode === 'dynamic') mode = 'DYN';
  else if (cfgMode === 'constant' || cfgMode === 'fixed') mode = 'CONST';
  else if (cfgMode === 'default' || raw?.status === 'not_patched') mode = 'ORIG';

  return {
    ...(raw || {}),
    ok: true,
    binaryType: raw?.mode || null,
    mode,
    limitTokens: Number(
      raw?.configuredLimitTokens ||
      cfg.context?.unlockLimitTokens ||
      cfg.context?.customLimitTokens ||
      512000
    ),
    alignCli: Boolean(cfg.context?.alignCli ?? cfg.context?.syncCli ?? true),
  };
}

function registerIpcOnce() {
  if (ipcRegistered) return;
  const electron = getElectronSafe();
  if (!electron?.ipcMain) return;
  ipcRegistered = true;

  const { ipcMain, app, session, shell } = electron;
  const store = new ConfigStore();

  const handleSafe = (channel, fn) => {
    try {
      ipcMain.removeHandler(channel);
    } catch {}
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
      event.returnValue = { language: 'en', brandTitle: 'english', exact: {}, regex: [] };
    }
  });

  handleSafe('ag-studio:runtime-info', (event) => {
    const authCtx = resolveHostAuthContext(event);
    return {
      ok: true,
      studioVersion: STUDIO_VERSION,
      platform: process.platform,
      arch: process.arch,
      stateDir: store.stateDir,
      fontsDir: store.fontsDir,
      proxyBoot: globalThis.__AG_STUDIO_PROXY_BOOT__ || null,
      lsPort: authCtx.port,
      lsOrigin: authCtx.origin,
      lsConnected: Boolean(authCtx.origin && authCtx.csrfToken),
    };
  });

  handleSafe('ag-studio:get-config', () => store.load());

  handleSafe('ag-studio:save-config', async (_ev, partial) => {
    const prev = store.load();
    const next = store.save(partial || {});
    if (JSON.stringify(prev.proxy) !== JSON.stringify(next.proxy)) {
      proxyManager.applyProxyToEnv(process.env, next.proxy, { clearWhenDisabled: true });
      await proxyManager.applySessionProxy(app, session, next.proxy).catch(() => {});
    }
    if (
      prev.i18n?.language !== next.i18n?.language ||
      prev.i18n?.translateNativeMenu !== next.i18n?.translateNativeMenu ||
      prev.i18n?.translateTray !== next.i18n?.translateTray ||
      prev.i18n?.brandTitle !== next.i18n?.brandTitle
    ) {
      nativeI18n.setCurrentLanguage(next.i18n?.language || 'zh-CN');
      broadcastToAllWindows('ag-studio:i18n-changed', buildI18nPayload(store));
    }
    broadcastToAllWindows('ag-studio:config-changed', next);
    return next;
  });

  const handleScan = async (event, conversationId, force = false) => {
    const cfg = store.load();
    const authCtx = resolveHostAuthContext(event);
    const cid = String(conversationId || process.env.ANTIGRAVITY_CONVERSATION_ID || process.env.ANTIGRAVITY_TRAJECTORY_ID || '').trim();

    const quotaPromise = fetchQuotaWithHostAuth(authCtx, { force }, cfg);
    let collected = null;
    let lsError = null;

    if (cid && UUID_RE.test(cid)) {
      const origins = authCtx.candidateOrigins.length ? authCtx.candidateOrigins : [];
      for (const candOrigin of origins) {
        try {
          collected = await meterCollector.collect(candOrigin, cid, {
            force: Boolean(force),
            supersedePrevious: true,
            csrfToken: authCtx.csrfToken,
            fallbackCsrfToken: authCtx.fallbackCsrfToken,
            getHostAuth: authCtx.getHostAuth,
          });
          if (collected && !collected.abortedStale) break;
        } catch (err) {
          lsError = err.message;
        }
      }
    }

    const quotaPair = await quotaPromise;
    if (collected && !collected.abortedStale) {
      const callsToRecord = Array.isArray(collected.recentGeneratorCalls) && collected.recentGeneratorCalls.length
        ? collected.recentGeneratorCalls
        : (collected.latestCallRecord ? [collected.latestCallRecord] : []);
      if (callsToRecord.length) {
        void recordLiveCallsBestEffort(callsToRecord, authCtx);
      }
      return shapeCollectResultForUi(collected, quotaPair.ui, cfg, cid);
    }

    return buildEmptySnapshot(cfg, quotaPair.ui, cid, lsError);
  };

  handleSafe('ag-studio:scan', handleScan);
  handleSafe('ag-studio:live-snapshot', async (event, conversationId) => handleScan(event, conversationId, false));

  handleSafe('ag-studio:turn-state', async (event, conversationId) => {
    const authCtx = resolveHostAuthContext(event);
    const cid = String(conversationId || '').trim();
    return await getTurnStateForConversation(cid, authCtx);
  });

  handleSafe('ag-studio:session-timeline', async (event, conversationId, opts = {}) => {
    const authCtx = resolveHostAuthContext(event);
    const cid = String(conversationId || '').trim();
    if (!cid) return { cascadeId: '', turns: [], totalCalls: 0 };
    const tl = await meterCollector.collectSessionTimelineAsync(cid, {
      ...(authCtx.origin ? { origin: authCtx.origin } : {}),
      ...(authCtx.csrfToken ? { csrfToken: authCtx.csrfToken } : {}),
      force: Boolean(opts?.force),
    });
    const limit = Number(opts?.limit || 0);
    const rawTurns = Array.isArray(tl?.turns) ? tl.turns : [];
    const enriched = rawTurns.map((tr) => {
      const calls = Array.isArray(tr.calls) ? tr.calls : [];
      const primary = calls.length ? calls[calls.length - 1] : null;
      return {
        ...tr,
        model: tr.model || primary?.modelLabel || primary?.model || primary?.modelExactId || 'model',
        tps: tr.tps ?? primary?.streamingTps ?? primary?.tps ?? null,
        status: tr.status || primary?.outcomeStatus || primary?.status || '',
      };
    });
    const sliced = limit > 0 ? enriched.slice(-limit).reverse() : enriched;
    return {
      ...(tl || {}),
      turns: sliced,
      items: sliced,
    };
  });

  handleSafe('ag-studio:get-quota', async (event, opts = {}) => {
    const cfg = store.load();
    const authCtx = resolveHostAuthContext(event);
    const quotaPair = await fetchQuotaWithHostAuth(authCtx, opts, cfg);
    try {
      const mgr = meterAccounts.getSharedAccountsManager({
        origin: authCtx.origin,
        csrfToken: authCtx.csrfToken,
        getHostAuth: authCtx.getHostAuth,
        getLiveOrigins: authCtx.getLiveOrigins,
      });
      const switchInFlight = Boolean(mgr.isSwitchInFlight?.());
      const email = !switchInFlight
        ? (quotaPair.ui.email || (await mgr.detectCurrentActiveAccount())?.email || null)
        : null;
      if (!switchInFlight && email && quotaPair.raw?.snapshot) {
        mgr.syncActiveHostQuotaSnapshot(quotaPair.raw, email);
        const ov = mgr.getOverviewState();
        if (ov.autoSwitch?.enabled && !quotaPair.raw.error) {
          await mgr.evaluateAutoSwitch({
            activeEmail: email,
            activeSnapshot: quotaPair.raw.snapshot,
            syncState: 'fresh',
            isGenerating: Boolean(opts?.isGenerating),
          });
        }
      }
    } catch {}
    return quotaPair.ui;
  });

  handleSafe('ag-studio:history-overview', async (event, days = 30) => {
    const authCtx = resolveHostAuthContext(event);
    return await computeHistoryOverview(days, authCtx, store);
  });

  handleSafe('ag-studio:history-summary', async (event, days = 90) => {
    const authCtx = resolveHostAuthContext(event);
    return await computeHistoryOverview(days, authCtx, store);
  });

  handleSafe('ag-studio:sync-pricing', async (event, opts = {}) => {
    if (opts?.pricingOverrides && typeof opts.pricingOverrides === 'object') {
      store.save({ enhance: { pricingOverrides: opts.pricingOverrides } });
    }
    const authCtx = resolveHostAuthContext(event);
    const history = await meterCollector.collectTokenHistoryAsync({
      force: opts?.force !== false,
      ...(authCtx.origin ? { origin: authCtx.origin } : {}),
      ...(authCtx.csrfToken ? { csrfToken: authCtx.csrfToken } : {}),
    });
    const overview = await computeHistoryOverview(30, authCtx, store);
    return {
      ok: true,
      updatedAt: history?.updatedAt || new Date().toISOString(),
      table: meterCore.GEMINI_PRICING_TABLE || DEFAULT_MODEL_PRICING,
      overview,
    };
  });

  handleSafe('ag-studio:record-turn', async (event, turn) => {
    if (!turn) return { ok: false };
    const authCtx = resolveHostAuthContext(event);
    const calls = Array.isArray(turn) ? turn : [turn];
    await recordLiveCallsBestEffort(calls, authCtx);
    return { ok: true };
  });

  handleSafe('ag-studio:test-proxy', async (_ev, proxyUrl) => {
    return await proxyManager.testProxyConnectivity(proxyUrl);
  });

  handleSafe('ag-studio:accounts-overview', async (event) => {
    const authCtx = resolveHostAuthContext(event);
    const mgr = meterAccounts.getSharedAccountsManager({
      origin: authCtx.origin,
      csrfToken: authCtx.csrfToken,
      getHostAuth: authCtx.getHostAuth,
      getLiveOrigins: authCtx.getLiveOrigins,
    });
    let active = null;
    try {
      active = await mgr.detectCurrentActiveAccount();
    } catch {}
    return normalizeAccountsOverviewForUi(mgr.getOverviewState(), active);
  });

  handleSafe('ag-studio:accounts-action', async (event, payload = {}) => {
    const authCtx = resolveHostAuthContext(event);
    const mgr = meterAccounts.getSharedAccountsManager({
      origin: authCtx.origin,
      csrfToken: authCtx.csrfToken,
      getHostAuth: authCtx.getHostAuth,
      getLiveOrigins: authCtx.getLiveOrigins,
    });

    const normalizedPayload = { ...(payload || {}) };
    if (!normalizedPayload.email && normalizedPayload.accountId) {
      const ov = mgr.getOverviewState();
      const hit = (ov.accounts || []).find(
        (a) => a.email === normalizedPayload.accountId || a.accountScopeKey === normalizedPayload.accountId
      );
      normalizedPayload.email = hit ? hit.email : normalizedPayload.accountId;
    }
    if (!normalizedPayload.config) {
      if (normalizedPayload.autoSwitch) {
        normalizedPayload.config = normalizedPayload.autoSwitch;
      } else if (normalizedPayload.keepalive) {
        normalizedPayload.config = normalizedPayload.keepalive;
      } else if (normalizedPayload.enabled !== undefined) {
        normalizedPayload.config = { enabled: Boolean(normalizedPayload.enabled) };
      }
    }

    if (normalizedPayload.action === 'add_direct') {
      const added = mgr.addAccountWithCredential(normalizedPayload);
      return {
        ...added,
        overview: normalizeAccountsOverviewForUi(mgr.getOverviewState()),
      };
    }

    const res = await meterAccounts.dispatchAccountsAction(mgr, normalizedPayload);
    if (res && res.overview) {
      res.overview = normalizeAccountsOverviewForUi(res.overview);
    }
    return res;
  });

  handleSafe('ag-studio:enhance-status', async () => {
    const cfg = store.load();
    const res = await meterEnhance.getEnhanceStatusAsync();
    return normalizeEnhanceStatusForUi(res, cfg);
  });

  handleSafe('ag-studio:enhance-apply', async (_ev, payload = {}) => {
    const tier = payload?.promptTier !== undefined ? Number(payload.promptTier) : undefined;
    const cn = payload?.chineseTitle !== undefined
      ? Boolean(payload.chineseTitle)
      : (payload?.chineseSessionTitle !== undefined ? Boolean(payload.chineseSessionTitle) : undefined);

    const res = await meterEnhance.applyEnhancePatchAsync({
      ...(tier !== undefined ? { promptTier: tier } : {}),
      ...(cn !== undefined ? { chineseTitle: cn } : {}),
    });

    const saved = store.save({
      enhance: {
        ...(tier !== undefined ? { promptTier: tier } : {}),
        ...(cn !== undefined ? { chineseTitle: cn, chineseSessionTitle: cn } : {}),
      },
    });
    return normalizeEnhanceStatusForUi(res, saved);
  });

  handleSafe('ag-studio:enhance-restore', async () => {
    const res = await meterEnhance.restoreAllEnhanceAsync();
    const saved = store.save({
      enhance: { promptTier: 0, chineseTitle: false, chineseSessionTitle: false },
    });
    return normalizeEnhanceStatusForUi(res, saved);
  });

  handleSafe('ag-studio:context-unlock-status', async () => {
    const cfg = store.load();
    const res = await meterContextUnlock.analyzeBinaryAsync();
    return normalizeUnlockStatusForUi(res, cfg);
  });

  handleSafe('ag-studio:context-unlock-apply', async (_ev, opts = {}) => {
    const mode = opts?.mode || 'ORIG';
    const limitTokens = opts?.limitTokens !== undefined
      ? Number(opts.limitTokens)
      : Number(opts?.customLimitTokens || 512000);
    const alignCli = opts?.alignCli !== undefined ? Boolean(opts.alignCli) : Boolean(opts?.syncCli ?? true);

    const desktopRes = await meterContextUnlock.applyUnlockAsync({
      mode,
      limitTokens,
      syncConfigFiles: true,
    });

    let cliResult = null;
    if (alignCli) {
      try {
        const cliBin = meterCliLauncher.resolveCliExecutable();
        if (cliBin && desktopRes?.targetPath && path.resolve(cliBin).toLowerCase() !== path.resolve(desktopRes.targetPath).toLowerCase()) {
          cliResult = await meterContextUnlock.applyUnlockAsync({
            targetPath: cliBin,
            mode,
            limitTokens,
            syncConfigFiles: true,
          });
        }
      } catch {}
    }

    const normMode = String(mode).toUpperCase().startsWith('DYN')
      ? 'DYN'
      : (String(mode).toUpperCase().startsWith('CONST') || String(mode).toUpperCase() === 'FIXED' ? 'CONST' : 'ORIG');

    const saved = store.save({
      context: {
        unlockMode: normMode,
        unlockLimitTokens: limitTokens,
        customLimitTokens: limitTokens,
        alignCli,
        syncCli: alignCli,
      },
    });
    return {
      ...normalizeUnlockStatusForUi(desktopRes?.analysis || desktopRes, saved),
      ok: desktopRes?.ok !== false,
      needsRestart: Boolean(desktopRes?.needsRestart || cliResult?.needsRestart),
      cliResult,
      message: desktopRes?.message || '上下文解锁策略已应用',
    };
  });

  handleSafe('ag-studio:context-unlock-restore', async () => {
    const cfg = store.load();
    const res = await meterContextUnlock.restoreUnlockAsync({ syncConfigFiles: true });
    if (cfg.context?.alignCli ?? cfg.context?.syncCli ?? true) {
      try {
        const cliBin = meterCliLauncher.resolveCliExecutable();
        if (cliBin && res?.targetPath && path.resolve(cliBin).toLowerCase() !== path.resolve(res.targetPath).toLowerCase()) {
          await meterContextUnlock.restoreUnlockAsync({ targetPath: cliBin, syncConfigFiles: true });
        }
      } catch {}
    }
    const saved = store.save({ context: { unlockMode: 'ORIG' } });
    return {
      ...normalizeUnlockStatusForUi(res?.analysis || res, saved),
      ok: res?.ok !== false,
      needsRestart: Boolean(res?.needsRestart),
      message: res?.message || '已还原原版上下文限制',
    };
  });

  handleSafe('ag-studio:context-limit-set', (_ev, { model, limit } = {}) => {
    const cfg = store.load();
    const nextLimits = { ...(cfg.context?.perModelLimits || {}), ...(model ? { [model]: Number(limit) } : {}) };
    return store.save({ context: { perModelLimits: nextLimits } });
  });

  handleSafe('ag-studio:context-limit-reset', (_ev, { model } = {}) => {
    const cfg = store.load();
    const nextLimits = { ...(cfg.context?.perModelLimits || {}) };
    if (model) {
      if (DEFAULT_MODEL_LIMITS[model] !== undefined) nextLimits[model] = DEFAULT_MODEL_LIMITS[model];
      else delete nextLimits[model];
      return store.save({ context: { perModelLimits: nextLimits } });
    }
    return store.save({ context: { perModelLimits: { ...DEFAULT_MODEL_LIMITS } } });
  });

  handleSafe('ag-studio:rehydrate-status', () => meterRehydrate.getRehydrateStatus());
  handleSafe('ag-studio:rehydrate-apply', () => {
    const res = meterRehydrate.applyRehydrate();
    store.save({ enhance: { rehydrateEnabled: Boolean(res?.enabled), rehydrateAfterCompact: Boolean(res?.enabled) } });
    return res;
  });
  handleSafe('ag-studio:rehydrate-disable', () => {
    const res = meterRehydrate.disableRehydrate();
    store.save({ enhance: { rehydrateEnabled: false, rehydrateAfterCompact: false } });
    return res;
  });
  handleSafe('ag-studio:rehydrate-restore', () => {
    const res = meterRehydrate.restoreRehydrate();
    store.save({ enhance: { rehydrateEnabled: false, rehydrateAfterCompact: false } });
    return res;
  });

  handleSafe('ag-studio:i18n-get', () => buildI18nPayload(store));
  handleSafe('ag-studio:i18n-save-custom', (_ev, dict) => {
    const saved = store.saveCustomDictionary(dict);
    const payload = buildI18nPayload(store);
    broadcastToAllWindows('ag-studio:i18n-changed', payload);
    return { saved, payload };
  });

  handleSafe('ag-studio:scan-fonts', () => scanLocalFonts({ store }));

  handleSafe('ag-studio:launch-cli', async (event, opts = {}) => {
    const targetWin = resolveTargetWindow(event.sender);
    let ownerHwndStr = '0';
    let hostBounds = null;
    if (targetWin && !targetWin.isDestroyed?.()) {
      try {
        const buf = targetWin.getNativeWindowHandle?.();
        if (buf && buf.length >= 8) ownerHwndStr = buf.readBigInt64LE(0).toString();
        else if (buf && buf.length >= 4) ownerHwndStr = buf.readInt32LE(0).toString();
      } catch {}
      try {
        hostBounds = targetWin.getBounds?.() || null;
      } catch {}
    }
    return await meterCliLauncher.launchCliSession({
      ...(opts || {}),
      ownerHwnd: ownerHwndStr,
      hostBounds,
    }, ownerHwndStr);
  });

  handleSafe('ag-studio:open-path', async (_ev, target) => {
    store.ensureLayout();
    const p = target === 'fonts'
      ? store.fontsDir
      : target === 'state'
        ? store.stateDir
        : String(target || store.stateDir);
    await shell.openPath(p);
    return { ok: true, path: p };
  });

  handleSafe('ag-studio:restart-language-servers', async () => {
    return await meterEnhance.restartLanguageServersAsync();
  });

  handleSafe('ag-studio:restart-host', () => {
    setTimeout(() => {
      try {
        isAppQuitting = true;
        app.relaunch({ args: Array.isArray(process.argv) ? process.argv.slice(1) : [] });
        app.exit(0);
      } catch {}
    }, 120);
    return { ok: true, restarting: true };
  });
}

async function ensureInjected(win, options = {}) {
  try {
    if (!win || win.isDestroyed?.()) return false;
    const wc = getWindowWebContents(win);
    if (!wc || wc.isDestroyed?.()) {
      const attempt = Number(options.attempt || 0);
      const delays = [300, 600, 1000, 1500, 2500];
      if (attempt < delays.length && win && !win.isDestroyed?.()) {
        const prevTimer = injectionTimers.get(win);
        if (prevTimer) clearTimeout(prevTimer);
        const t = setTimeout(() => {
          injectionTimers.delete(win);
          void ensureInjected(win, { ...options, attempt: attempt + 1 });
        }, delays[attempt]);
        injectionTimers.set(win, t);
      }
      return false;
    }

    const url = wc.getURL?.() || '';
    if (url && url.startsWith('data:')) {
      return false;
    }

    if (!options.force) {
      try {
        const mounted = await wc.executeJavaScript('Boolean(window.__AG_STUDIO_MOUNTED__)');
        if (mounted === true) return true;
      } catch {}
    }

    // Fallback i18n runtime injection in case Electron sandbox blocked preload require()
    try {
      const i18nMounted = await wc.executeJavaScript('Boolean(window.__AG_STUDIO_I18N__)');
      if (!i18nMounted) {
        const i18nCode = getI18nPreloadSource();
        if (i18nCode) {
          const store = new ConfigStore();
          const payload = buildI18nPayload(store);
          await wc.executeJavaScript(
            `${i18nCode}\nif (window.__AG_STUDIO_I18N_MODULE__ && typeof window.__AG_STUDIO_I18N_MODULE__.initPreloadI18n === 'function') { window.__AG_STUDIO_I18N_MODULE__.initPreloadI18n(${JSON.stringify(payload)}); }`
          );
        }
      }
    } catch {}

    const code = getRendererSource();
    if (!code) return false;
    await wc.executeJavaScript(code);
    return true;
  } catch {
    return false;
  }
}

function attachWindow(win) {
  registerIpcOnce();
  if (!win || win.isDestroyed?.()) return;

  if (!boundWindows.has(win)) {
    boundWindows.add(win);
    const onShowOrFocus = () => {
      void ensureInjected(win, { force: false });
    };
    win.on?.('show', onShowOrFocus);
    win.on?.('restore', onShowOrFocus);
    win.on?.('focus', onShowOrFocus);
  }

  const bindToWc = (wc) => {
    if (!wc || boundWebContents.has(wc)) return;
    boundWebContents.add(wc);
    wc.on('did-finish-load', () => {
      void ensureInjected(win, { force: true });
    });
    wc.on('dom-ready', () => {
      void ensureInjected(win, { force: false });
    });
    wc.on('did-navigate', () => {
      void ensureInjected(win, { force: false });
    });
    wc.on('did-navigate-in-page', () => {
      void ensureInjected(win, { force: false });
    });
  };

  const initialWc = getWindowWebContents(win);
  if (initialWc) {
    bindToWc(initialWc);
  } else {
    const prevProbe = wcProbeTimers.get(win);
    if (prevProbe) clearInterval(prevProbe);
    let retries = 0;
    const probeInterval = setInterval(() => {
      retries++;
      const candidateWc = getWindowWebContents(win);
      if (candidateWc) {
        clearInterval(probeInterval);
        wcProbeTimers.delete(win);
        bindToWc(candidateWc);
        void ensureInjected(win, { force: false });
      } else if (retries >= 10 || !win || win.isDestroyed?.()) {
        clearInterval(probeInterval);
        wcProbeTimers.delete(win);
      }
    }, 150);
    wcProbeTimers.set(win, probeInterval);
    win.once?.('closed', () => {
      const activeTimer = wcProbeTimers.get(win);
      if (activeTimer) {
        clearInterval(activeTimer);
        wcProbeTimers.delete(win);
      }
    });
  }
}

try {
  const electron = getElectronSafe();
  const app = electron?.app;
  if (app && typeof app.on === 'function') {
    app.on('before-quit', () => { isAppQuitting = true; });
    app.on('will-quit', () => { isAppQuitting = true; });
    const handleCreated = (_event, win) => {
      try {
        attachWindow(win);
        void ensureInjected(win, { force: false });
      } catch {}
    };
    app.on('browser-window-created', handleCreated);
    app.on('base-window-created', handleCreated);
    app.on('activate', () => {
      try {
        const utils = getHostUtilsSafe();
        const wins = typeof utils?.getHubWindows === 'function' ? utils.getHubWindows() : [];
        for (const w of wins) {
          attachWindow(w);
          void ensureInjected(w, { force: true });
        }
      } catch {}
    });
    app.on('second-instance', () => {
      setTimeout(() => {
        try {
          const utils = getHostUtilsSafe();
          const wins = typeof utils?.getHubWindows === 'function' ? utils.getHubWindows() : [];
          for (const w of wins) {
            attachWindow(w);
            void ensureInjected(w, { force: true });
          }
        } catch {}
      }, 120);
    });
  }
} catch {}

module.exports = {
  registerIpcOnce,
  attachWindow,
  ensureInjected,
  buildI18nPayload,
  getWindowWebContents,
  getActiveHubWindowOrigins,
  readHostLanguageServerAuth,
  resolveHostAuthContext,
  computeHistoryOverview,
  formatFriendlyPoolTitle,
  normalizeQuotaForUi,
  shapeCollectResultForUi,
  getAppQuitting: () => isAppQuitting,
};
