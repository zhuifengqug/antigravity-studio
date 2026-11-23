'use strict';

const os = require('os');
const path = require('path');

const STUDIO_VERSION = '1.0.0';
const STUDIO_DIR_NAME = 'ag-studio';
const STATE_DIR_NAME = 'AntigravityStudio';
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
  'gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 10.0, cachedPer1M: 0.3125 },
  'gemini-2.5-flash': { inputPer1M: 0.15, outputPer1M: 0.60, cachedPer1M: 0.0375 },
  'gemini-3-pro': { inputPer1M: 2.0, outputPer1M: 12.0, cachedPer1M: 0.5 },
  'gemini-3-flash': { inputPer1M: 0.30, outputPer1M: 1.50, cachedPer1M: 0.075 },
  'gemini-4-neon': { inputPer1M: 2.50, outputPer1M: 15.0, cachedPer1M: 0.625 },
  'claude-sonnet-4': { inputPer1M: 3.0, outputPer1M: 15.0, cachedPer1M: 0.30 },
  'claude-opus-4': { inputPer1M: 15.0, outputPer1M: 75.0, cachedPer1M: 1.50 },
  'gpt-4o': { inputPer1M: 2.50, outputPer1M: 10.0, cachedPer1M: 1.25 },
  'default': { inputPer1M: 1.50, outputPer1M: 8.0, cachedPer1M: 0.375 },
};

const DEFAULT_MODEL_LIMITS = {
  'gemini-2.5-pro': 1048576,
  'gemini-2.5-flash': 1048576,
  'gemini-3-pro': 1048576,
  'gemini-3-flash': 1048576,
  'gemini-4-neon': 1048576,
  'claude-sonnet-4': 200000,
  'claude-opus-4': 200000,
  'claude-3-7-sonnet': 200000,
  'gpt-4o': 128000,
};

function getDefaultConfig() {
  return {
    version: 1,
    theme: {
      activePreset: 'claude',
      colorMode: 'system', // system | light | dark
      customThemes: [],
      editorialSerif: true,
      fonts: {
        ui: 'system',
        body: 'serif-editorial',
        code: 'JetBrains Mono, Consolas, monospace',
        customUiFont: '',
        customBodyFont: '',
        customCodeFont: '',
      },
    },
    mascot: {
      enabled: true,
      style: 'clawd', // clawd | astra
      scale: 1, // 1 | 1.5 | 2
      offsetX: 16,
      offsetY: 0,
      sleepTimeoutMs: 300000,
    },
    hud: {
      enabled: true,
      position: 'composer', // composer | floating
      showContext: true,
      showCacheHit: true,
      showSpeed: true,
      showCost: true,
      showQuotaBadge: true,
    },
    i18n: {
      language: 'zh-CN', // zh-CN | zh-TW | en
      translateNativeMenu: true,
      translateTray: true,
      customDictionaryEnabled: true,
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
        threshold: 0.05,
        cooldownSec: 300,
      },
    },
    context: {
      perModelLimits: { ...DEFAULT_MODEL_LIMITS },
    },
    enhance: {
      chineseSessionTitle: false,
      subscriptionMonthlyUsd: 20,
      pricingOverrides: {},
    },
  };
}

function getStateDir(env = process.env) {
  if (env.AG_STUDIO_STATE_DIR && env.AG_STUDIO_STATE_DIR.trim()) {
    return path.resolve(env.AG_STUDIO_STATE_DIR.trim());
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

function getGeminiAntigravityDir(env = process.env) {
  if (env.ANTIGRAVITY_APP_DATA_DIR && env.ANTIGRAVITY_APP_DATA_DIR.trim()) {
    return path.resolve(env.ANTIGRAVITY_APP_DATA_DIR.trim());
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
  BACKUP_SUFFIX,
  MANIFEST_FILENAME,
  MARKERS,
  LEGACY_MARKERS,
  DEFAULT_NO_PROXY,
  DEFAULT_MODEL_PRICING,
  DEFAULT_MODEL_LIMITS,
  getDefaultConfig,
  getStateDir,
  getGeminiAntigravityDir,
  getAntigravityRoamingDir,
};
