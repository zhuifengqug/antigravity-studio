'use strict';

const os = require('os');
const path = require('path');

const STUDIO_VERSION = '2.3.0';
const STUDIO_DIR_NAME = 'ag-studio';
const STATE_DIR_NAME = 'AntigravityStudio';
const LEGACY_METER_DIR_NAME = 'AntigravityContextMeter';
const BACKUP_SUFFIX = '.studio-orig.bak';
const MANIFEST_FILENAME = 'studio-manifest.json';

const MARKERS = {
  PROXY_BOOT_START: '// --- Antigravity Studio Proxy Boot Start ---',
  PROXY_BOOT_END: '// --- Antigravity Studio Proxy Boot End ---',
  UTILS_START: '// --- Antigravity Studio Utils Injection Start ---',
  UTILS_END: '// --- Antigravity Studio Utils Injection End ---',
  PRELOAD_START: '// --- Antigravity Studio Preload Start ---',
  PRELOAD_END: '// --- Antigravity Studio Preload End ---',
  MENU_START: '// --- Antigravity Studio Menu i18n Start ---',
  MENU_END: '// --- Antigravity Studio Menu i18n End ---',
  TRAY_START: '// --- Antigravity Studio Tray i18n Start ---',
  TRAY_END: '// --- Antigravity Studio Tray i18n End ---',
  LS_START: '// --- Antigravity Studio LanguageServer Proxy Start ---',
  LS_END: '// --- Antigravity Studio LanguageServer Proxy End ---',
};

const LEGACY_MARKERS = [
  ['// --- Antigravity Proxy NoTun Injection Start ---', '// --- Antigravity Proxy NoTun Injection End ---'],
  ['// --- Antigravity Context Meter utils Injection Start ---', '// --- Antigravity Context Meter utils Injection End ---'],
  ['// --- Antigravity Chinese Localization Injection Start ---', '// --- Antigravity Chinese Localization Injection End ---'],
  ['// --- Antigravity Context Meter Preload Start ---', '// --- Antigravity Context Meter Preload End ---'],
  ['// --- Antigravity Context Meter Start ---', '// --- Antigravity Context Meter End ---'],
];

const DEFAULT_NO_PROXY = 'localhost,127.0.0.1,::1,127.0.0.0/8,10.0.0.0/8,192.168.0.0/16,172.16.0.0/12,<local>';

const DEFAULT_MODEL_PRICING = {
  'gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 10.0, cachedPer1M: 0.125 },
  'gemini-2.5-flash': { inputPer1M: 0.15, outputPer1M: 0.60, cachedPer1M: 0.0375 },
  'gemini-3-pro': { inputPer1M: 2.0, outputPer1M: 12.0, cachedPer1M: 0.20 },
  'gemini-3-flash': { inputPer1M: 0.30, outputPer1M: 1.50, cachedPer1M: 0.075 },
  'gemini-3.8-flash': { inputPer1M: 0.75, outputPer1M: 3.75, cachedPer1M: 0.075 },
  'gemini-4-hydrogen': { inputPer1M: 1.50, outputPer1M: 7.50, cachedPer1M: 0.075 },
  'gemini-4-argon': { inputPer1M: 2.00, outputPer1M: 10.0, cachedPer1M: 0.10 },
  'gemini-4-carbon': { inputPer1M: 2.00, outputPer1M: 10.0, cachedPer1M: 0.10 },
  'gemini-4-neon': { inputPer1M: 3.00, outputPer1M: 15.0, cachedPer1M: 0.15 },
  'orchestrator': { inputPer1M: 3.00, outputPer1M: 15.0, cachedPer1M: 0.15 },
  'claude-sonnet-4': { inputPer1M: 3.0, outputPer1M: 15.0, cachedPer1M: 0.30 },
  'claude-opus-4': { inputPer1M: 15.0, outputPer1M: 75.0, cachedPer1M: 1.50 },
  'claude-sonnet-5-5': { inputPer1M: 2.00, outputPer1M: 10.0, cachedPer1M: 0.10 },
  'claude-opus-5-5': { inputPer1M: 4.00, outputPer1M: 20.0, cachedPer1M: 0.20 },
  'gpt-4o': { inputPer1M: 2.50, outputPer1M: 10.0, cachedPer1M: 1.25 },
  'gpt-oss-120b': { inputPer1M: 0.60, outputPer1M: 2.40, cachedPer1M: 0.15 },
  'default': { inputPer1M: 1.50, outputPer1M: 7.50, cachedPer1M: 0.075 },
};

const DEFAULT_MODEL_LIMITS = {
  'gemini-2.5-pro': 1048576,
  'gemini-2.5-flash': 1048576,
  'gemini-3-pro': 1048576,
  'gemini-3-flash': 1048576,
  'gemini-3.8-flash': 1048576,
  'gemini-4-hydrogen': 1048576,
  'gemini-4-argon': 1048576,
  'gemini-4-carbon': 1048576,
  'gemini-4-neon': 1048576,
  'claude-sonnet-4': 200000,
  'claude-opus-4': 200000,
  'claude-sonnet-5-5': 200000,
  'claude-opus-5-5': 200000,
  'claude-3-7-sonnet': 200000,
  'gpt-4o': 128000,
};

function getDefaultConfig() {
  return {
    version: 2,
    theme: {
      activePreset: 'claude', // claude | antigravity
      colorMode: 'system', // system | light | dark
      customThemes: [],
      editorialSerif: true,
      fonts: {
        ui: 'system',
        body: 'serif-editorial',
        code: 'jetbrains',
        customUiFont: '',
        customBodyFont: '',
        customCodeFont: '',
      },
    },
    mascot: {
      enabled: true,
      style: 'clawd', // clawd | deepy | astra | whalegirl
      align: 'right', // left | center | right
      position: 'right', // legacy alias for align
      scale: 1, // 1 | 1.5 | 2
      offsetX: 16,
      offsetY: 0,
      sleepTimeoutMs: 300000,
    },
    hud: {
      enabled: true,
      displayStyle: 'ring', // ring | capsule
      showVial: true,
      vialEnabled: true,
      homeOverview: true,
      position: 'composer', // composer | floating
      showContext: true,
      showCacheHit: true,
      showSpeed: true,
      showCost: true,
      showQuotaBadge: true,
    },
    fx: {
      inkStream: true,
      smoothCaret: true,
      edgeAura: true,
      effortSlider: false,
      inlineDiff: true,
      homeOverview: true,
      reasoningEffort: 'medium',
    },
    thought: {
      mode: 'off', // off | machine | ai
      viewMode: 'bilingual', // immersive | bilingual
      view: 'bilingual',
      targetLang: 'zh-CN', // zh-CN | zh-TW | en
      stylePreset: 'technical', // technical | concise
      translateToolSummaries: false,
      translateTitles: false,
      proxyUrl: '',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o-mini',
      ai: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-4o-mini',
        stylePreset: 'technical', // technical | concise
      },
    },
    homeOverview: true,
    homeOverviewPrefs: {
      defaultView: 'overview', // overview | models
      defaultDays: 0, // 0 (all) | 30 | 7
    },
    i18n: {
      language: 'zh-CN', // zh-CN | zh-TW | en
      translateNativeMenu: true,
      translateTray: true,
      customDictionaryEnabled: true,
      brandTitle: 'english', // english | hidden | translated
    },
    proxy: {
      enabled: false,
      proxyUrl: 'http://127.0.0.1:7897',
      bypassList: DEFAULT_NO_PROXY,
    },
    quota: {
      lowQuotaThreshold: 0.2,
      lowQuotaAlertEnabled: true,
      autoSwitch: {
        enabled: false,
        metricMode: 'remaining_pct',
        poolKey: 'shared_gemini_main',
        windowKey: 'primary',
        thresholdPct: 10,
        threshold: 0.05,
        debounceSec: 15,
        cooldownSec: 300,
        waitUntilIdle: true,
        strategy: 'highest_quota',
        candidates: [],
      },
    },
    context: {
      unlockMode: 'ORIG', // ORIG | CONST | DYN
      unlockLimitTokens: 512000,
      customLimitTokens: 512000,
      alignCli: true,
      syncCli: true,
      perModelLimits: { ...DEFAULT_MODEL_LIMITS },
    },
    enhance: {
      promptTier: 0, // 0..4
      chineseTitle: false,
      chineseSessionTitle: false,
      rehydrateEnabled: false,
      rehydrateAfterCompact: false,
      subscriptionMonthlyUsd: 20,
      subscriptionCurrency: 'USD',
      pricingOverrides: {},
    },
  };
}

function getStateDir(env = process.env) {
  if (env.AG_STUDIO_STATE_DIR && env.AG_STUDIO_STATE_DIR.trim()) {
    return path.resolve(env.AG_STUDIO_STATE_DIR.trim());
  }
  if (env.AG_METER_STATE_DIR && env.AG_METER_STATE_DIR.trim()) {
    return path.resolve(env.AG_METER_STATE_DIR.trim());
  }
  const localApp = env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  if (process.platform === 'win32') {
    return path.join(localApp, STATE_DIR_NAME);
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', STATE_DIR_NAME);
  }
  return path.join(env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), STATE_DIR_NAME);
}

function getLegacyMeterStateDir(env = process.env) {
  const localApp = env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  if (process.platform === 'win32') {
    return path.join(localApp, LEGACY_METER_DIR_NAME);
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', LEGACY_METER_DIR_NAME);
  }
  return path.join(env.XDG_STATE_HOME || path.join(os.homedir(), '.local', 'state'), LEGACY_METER_DIR_NAME);
}

function getGeminiAntigravityDir(env = process.env) {
  if (env.ANTIGRAVITY_APP_DATA_DIR && env.ANTIGRAVITY_APP_DATA_DIR.trim()) {
    return path.resolve(env.ANTIGRAVITY_APP_DATA_DIR.trim());
  }
  if (env.AG_DIR && env.AG_DIR.trim()) {
    return path.resolve(env.AG_DIR.trim());
  }
  return path.join(os.homedir(), '.gemini', 'antigravity');
}

function getAntigravityRoamingDir(env = process.env) {
  if (env.AG_STUDIO_ROAMING_DIR && env.AG_STUDIO_ROAMING_DIR.trim()) {
    return path.resolve(env.AG_STUDIO_ROAMING_DIR.trim());
  }
  const appData = env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  if (process.platform === 'win32') {
    return path.join(appData, 'Antigravity');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Antigravity');
  }
  return path.join(env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'Antigravity');
}

module.exports = {
  STUDIO_VERSION,
  STUDIO_DIR_NAME,
  STATE_DIR_NAME,
  LEGACY_METER_DIR_NAME,
  BACKUP_SUFFIX,
  MANIFEST_FILENAME,
  MARKERS,
  LEGACY_MARKERS,
  DEFAULT_NO_PROXY,
  DEFAULT_MODEL_PRICING,
  DEFAULT_MODEL_LIMITS,
  getDefaultConfig,
  getStateDir,
  getLegacyMeterStateDir,
  getGeminiAntigravityDir,
  getAntigravityRoamingDir,
};
