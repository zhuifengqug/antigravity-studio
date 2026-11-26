'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getDefaultConfig, getStateDir, getLegacyMeterStateDir } = require('./constants');

function isPlainObject(val) {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

function deepMerge(target, source) {
  if (!isPlainObject(source)) return target;
  const out = isPlainObject(target) ? { ...target } : {};
  for (const [k, v] of Object.entries(source)) {
    if (isPlainObject(v) && isPlainObject(out[k])) {
      out[k] = deepMerge(out[k], v);
    } else if (Array.isArray(v)) {
      out[k] = v.slice();
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function readJsonSafe(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function atomicWriteFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  const tmpName = `${path.basename(filePath)}.tmp-${process.pid}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const tmpPath = path.join(path.dirname(filePath), tmpName);
  fs.writeFileSync(tmpPath, content, 'utf8');
  try {
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      fs.copyFileSync(tmpPath, filePath);
      fs.unlinkSync(tmpPath);
    } catch {
      try { fs.unlinkSync(tmpPath); } catch {}
      throw err;
    }
  }
}

function atomicWriteJson(filePath, data) {
  atomicWriteFile(filePath, JSON.stringify(data, null, 2) + '\n');
}

function importLegacyContextMeterConfigReadOnly(targetStateDir, env = process.env) {
  const legacyDir = getLegacyMeterStateDir(env);
  if (!legacyDir || path.resolve(legacyDir).toLowerCase() === path.resolve(targetStateDir).toLowerCase()) {
    return null;
  }
  if (!fs.existsSync(legacyDir)) return null;

  const partial = {};
  let importedAny = false;

  const modCfg = readJsonSafe(path.join(legacyDir, 'modules.json'), null);
  if (isPlainObject(modCfg?.modules)) {
    const m = modCfg.modules;
    if (isPlainObject(m.proxy)) {
      partial.proxy = {
        enabled: m.proxy.enabled === true,
        ...(typeof m.proxy.proxyUrl === 'string' && m.proxy.proxyUrl.trim() ? { proxyUrl: m.proxy.proxyUrl.trim() } : {}),
        ...(typeof m.proxy.bypassList === 'string' ? { bypassList: m.proxy.bypassList } : {}),
      };
      importedAny = true;
    }
    if (isPlainObject(m.chinese)) {
      const lang = m.chinese.language === 'en' ? 'en' : (m.chinese.enabled ? 'zh-CN' : 'en');
      partial.i18n = {
        language: lang,
        ...(typeof m.chinese.brandTitle === 'string' ? { brandTitle: m.chinese.brandTitle } : {}),
      };
      importedAny = true;
    }
    if (isPlainObject(m.enhance)) {
      partial.enhance = {};
      if (m.enhance.promptTier !== undefined && m.enhance.promptTier !== null) {
        partial.enhance.promptTier = Number(m.enhance.promptTier) || 0;
      }
      if (typeof m.enhance.chineseTitle === 'boolean') {
        partial.enhance.chineseTitle = m.enhance.chineseTitle;
        partial.enhance.chineseSessionTitle = m.enhance.chineseTitle;
      }
      importedAny = true;
    }
  } else {
    const legacyProxy = readJsonSafe(path.join(legacyDir, 'proxy.json'), null);
    if (isPlainObject(legacyProxy) && (legacyProxy.proxyUrl || legacyProxy.httpProxy)) {
      partial.proxy = {
        enabled: legacyProxy.enabled === true,
        proxyUrl: String(legacyProxy.proxyUrl || legacyProxy.httpProxy).trim(),
        ...(typeof (legacyProxy.bypassList || legacyProxy.noProxy) === 'string'
          ? { bypassList: legacyProxy.bypassList || legacyProxy.noProxy }
          : {}),
      };
      importedAny = true;
    }
  }

  return importedAny ? partial : null;
}

function normalizeConfigAliases(merged, raw = {}) {
  if (!isPlainObject(merged)) return merged;
  if (isPlainObject(merged.mascot)) {
    if (raw.mascot?.align !== undefined && raw.mascot?.position === undefined) {
      merged.mascot.position = merged.mascot.align;
    } else if (raw.mascot?.position !== undefined && raw.mascot?.align === undefined) {
      merged.mascot.align = merged.mascot.position;
    }
  }
  if (isPlainObject(merged.hud)) {
    if (raw.hud?.showVial !== undefined && raw.hud?.vialEnabled === undefined) {
      merged.hud.vialEnabled = Boolean(raw.hud.showVial);
    } else if (raw.hud?.vialEnabled !== undefined && raw.hud?.showVial === undefined) {
      merged.hud.showVial = Boolean(raw.hud.vialEnabled);
    }
    if (raw.homeOverview !== undefined && raw.hud?.homeOverview === undefined) {
      merged.hud.homeOverview = raw.homeOverview !== false;
    }
  }
  if (isPlainObject(merged.context)) {
    if (raw.context?.unlockLimitTokens !== undefined && raw.context?.customLimitTokens === undefined) {
      merged.context.customLimitTokens = Number(raw.context.unlockLimitTokens) || 512000;
    } else if (raw.context?.customLimitTokens !== undefined && raw.context?.unlockLimitTokens === undefined) {
      merged.context.unlockLimitTokens = Number(raw.context.customLimitTokens) || 512000;
    }
    if (raw.context?.alignCli !== undefined && raw.context?.syncCli === undefined) {
      merged.context.syncCli = Boolean(raw.context.alignCli);
    } else if (raw.context?.syncCli !== undefined && raw.context?.alignCli === undefined) {
      merged.context.alignCli = Boolean(raw.context.syncCli);
    }
  }
  if (isPlainObject(merged.enhance)) {
    if (raw.enhance?.chineseTitle !== undefined && raw.enhance?.chineseSessionTitle === undefined) {
      merged.enhance.chineseSessionTitle = Boolean(raw.enhance.chineseTitle);
    } else if (raw.enhance?.chineseSessionTitle !== undefined && raw.enhance?.chineseTitle === undefined) {
      merged.enhance.chineseTitle = Boolean(raw.enhance.chineseSessionTitle);
    }
    if (raw.enhance?.rehydrateEnabled !== undefined && raw.enhance?.rehydrateAfterCompact === undefined) {
      merged.enhance.rehydrateAfterCompact = Boolean(raw.enhance.rehydrateEnabled);
    } else if (raw.enhance?.rehydrateAfterCompact !== undefined && raw.enhance?.rehydrateEnabled === undefined) {
      merged.enhance.rehydrateEnabled = Boolean(raw.enhance.rehydrateAfterCompact);
    }
  }
  if (isPlainObject(merged.thought)) {
    const rawT = isPlainObject(raw.thought) ? raw.thought : {};
    const rawAi = isPlainObject(rawT.ai) ? rawT.ai : {};
    if (rawT.view !== undefined && rawT.viewMode === undefined) {
      merged.thought.viewMode = merged.thought.view;
    } else if (rawT.viewMode !== undefined && rawT.view === undefined) {
      merged.thought.view = merged.thought.viewMode;
    }
    merged.thought.ai = isPlainObject(merged.thought.ai) ? merged.thought.ai : {};
    for (const k of ['baseUrl', 'apiKey', 'model', 'stylePreset']) {
      if (rawAi[k] !== undefined && rawT[k] === undefined) {
        merged.thought[k] = merged.thought.ai[k];
      } else if (rawT[k] !== undefined && rawAi[k] === undefined) {
        merged.thought.ai[k] = merged.thought[k];
      }
    }
  }
  return merged;
}

class ConfigStore {
  constructor(stateDir = getStateDir()) {
    this.stateDir = path.resolve(stateDir);
    this.configPath = path.join(this.stateDir, 'config.json');
    this.modulesPath = path.join(this.stateDir, 'modules.json');
    this.customDictPath = path.join(this.stateDir, 'dict.custom.json');
    this.fontsDir = path.join(this.stateDir, 'fonts');
    this.accountsPath = path.join(this.stateDir, 'accounts_v1.json');
    this.legacyAccountsEncPath = path.join(this.stateDir, 'accounts.enc.json');
    this.backupsDir = path.join(this.stateDir, 'backups');
  }

  ensureLayout() {
    ensureDir(this.stateDir);
    ensureDir(this.fontsDir);
    ensureDir(this.backupsDir);
  }

  importLegacyIfNeeded() {
    // Only auto-import when using a real state dir (not explicit isolated test dirs)
    if (process.env.AG_STUDIO_STATE_DIR || process.env.AG_METER_STATE_DIR || process.env.NODE_TEST_CONTEXT) {
      return { configImported: false, accountsImported: false };
    }
    let configImported = false;
    let accountsImported = false;
    const legacyDir = getLegacyMeterStateDir();
    if (!fs.existsSync(legacyDir)) return { configImported, accountsImported };

    if (!fs.existsSync(this.configPath)) {
      const legacyPartial = importLegacyContextMeterConfigReadOnly(this.stateDir);
      if (legacyPartial) {
        this.ensureLayout();
        const merged = deepMerge(getDefaultConfig(), legacyPartial);
        merged.migratedFromLegacyMeter = legacyDir;
        atomicWriteJson(this.configPath, merged);
        configImported = true;
      }
    }

    const legacyAccounts = path.join(legacyDir, 'accounts_v1.json');
    if (!fs.existsSync(this.accountsPath) && fs.existsSync(legacyAccounts)) {
      try {
        const rawAcct = readJsonSafe(legacyAccounts, null);
        if (isPlainObject(rawAcct) && isPlainObject(rawAcct.accounts)) {
          this.ensureLayout();
          atomicWriteJson(this.accountsPath, rawAcct);
          accountsImported = true;
        }
      } catch {}
    }

    return { configImported, accountsImported };
  }

  load() {
    const defaults = getDefaultConfig();
    let raw = readJsonSafe(this.configPath, null);
    if (!isPlainObject(raw)) {
      this.importLegacyIfNeeded();
      raw = readJsonSafe(this.configPath, null);
    }
    if (!isPlainObject(raw)) return defaults;
    const merged = deepMerge(defaults, raw);
    return normalizeConfigAliases(merged, raw);
  }

  _syncModulesJsonMirror(cfg) {
    try {
      const existing = readJsonSafe(this.modulesPath, null);
      const baseMods = isPlainObject(existing?.modules) ? existing.modules : {};
      const lang = cfg.i18n?.language || 'zh-CN';
      const nextModules = {
        schemaVersion: '2.0.0',
        modules: {
          meter: { enabled: true, ...(isPlainObject(baseMods.meter) ? baseMods.meter : {}) },
          chinese: {
            ...(isPlainObject(baseMods.chinese) ? baseMods.chinese : {}),
            enabled: lang !== 'en',
            language: lang,
            brandTitle: cfg.i18n?.brandTitle || 'english',
            desktopOnly: true,
            lastUpdated: new Date().toISOString(),
          },
          proxy: {
            ...(isPlainObject(baseMods.proxy) ? baseMods.proxy : {}),
            enabled: Boolean(cfg.proxy?.enabled),
            proxyUrl: cfg.proxy?.proxyUrl || 'http://127.0.0.1:7897',
            bypassList: cfg.proxy?.bypassList || '',
            lastUpdated: new Date().toISOString(),
          },
          enhance: {
            ...(isPlainObject(baseMods.enhance) ? baseMods.enhance : {}),
            promptTier: cfg.enhance?.promptTier ?? null,
            chineseTitle: cfg.enhance?.chineseTitle ?? null,
            lastUpdated: new Date().toISOString(),
          },
        },
      };
      atomicWriteJson(this.modulesPath, nextModules);
    } catch {}
  }

  save(partialOrFull) {
    this.ensureLayout();
    const current = this.load();
    const next = normalizeConfigAliases(deepMerge(current, partialOrFull || {}), partialOrFull || {});
    atomicWriteJson(this.configPath, next);
    this._syncModulesJsonMirror(next);
    return next;
  }

  replace(fullConfig) {
    this.ensureLayout();
    const next = deepMerge(getDefaultConfig(), fullConfig || {});
    atomicWriteJson(this.configPath, next);
    this._syncModulesJsonMirror(next);
    return next;
  }

  loadCustomDictionary() {
    const raw = readJsonSafe(this.customDictPath, null);
    if (!isPlainObject(raw)) return { exact: {}, regex: [] };
    return {
      exact: isPlainObject(raw.exact) ? raw.exact : {},
      regex: Array.isArray(raw.regex) ? raw.regex : [],
    };
  }

  saveCustomDictionary(dict) {
    this.ensureLayout();
    const safe = {
      exact: isPlainObject(dict?.exact) ? dict.exact : {},
      regex: Array.isArray(dict?.regex) ? dict.regex : [],
    };
    atomicWriteJson(this.customDictPath, safe);
    return safe;
  }
}

module.exports = {
  isPlainObject,
  deepMerge,
  ensureDir,
  readJsonSafe,
  atomicWriteFile,
  atomicWriteJson,
  importLegacyContextMeterConfigReadOnly,
  ConfigStore,
};
