(function () {
  try {
    var electron = require('electron');
    var contextBridge = electron.contextBridge;
    var ipcRenderer = electron.ipcRenderer;

    var invoke = function (channel, arg1, arg2) {
      if (arg2 !== undefined) return ipcRenderer.invoke(channel, arg1, arg2);
      if (arg1 !== undefined) return ipcRenderer.invoke(channel, arg1);
      return ipcRenderer.invoke(channel);
    };

    var api = {
      runtimeInfo: function () { return invoke('ag-studio:runtime-info'); },
      getRuntimeInfo: function () { return invoke('ag-studio:runtime-info'); },

      getConfig: function () { return invoke('ag-studio:get-config'); },
      saveConfig: function (partial) { return invoke('ag-studio:save-config', partial); },

      scan: function (conversationId, force) {
        return ipcRenderer.invoke('ag-studio:scan', conversationId, Boolean(force));
      },
      getLiveSnapshot: function (conversationId) {
        return ipcRenderer.invoke('ag-studio:live-snapshot', conversationId);
      },
      getTurnState: function (conversationId) {
        return ipcRenderer.invoke('ag-studio:turn-state', conversationId);
      },
      getSessionTimeline: function (conversationId, opts) {
        return ipcRenderer.invoke('ag-studio:session-timeline', conversationId, opts || {});
      },
      getQuota: function (opts) {
        return ipcRenderer.invoke('ag-studio:get-quota', opts || {});
      },
      getHistoryOverview: function (days) {
        return ipcRenderer.invoke('ag-studio:history-overview', days);
      },
      getHistorySummary: function (days) {
        return ipcRenderer.invoke('ag-studio:history-summary', days);
      },
      syncPricing: function (opts) {
        return ipcRenderer.invoke('ag-studio:sync-pricing', opts || {});
      },
      recordTurn: function (turn) {
        return ipcRenderer.invoke('ag-studio:record-turn', turn);
      },

      getAccountsOverview: function () { return invoke('ag-studio:accounts-overview'); },
      accountsAction: function (payload) { return invoke('ag-studio:accounts-action', payload || {}); },

      getEnhanceStatus: function () { return invoke('ag-studio:enhance-status'); },
      applyEnhance: function (opts) { return invoke('ag-studio:enhance-apply', opts || {}); },
      restoreEnhance: function () { return invoke('ag-studio:enhance-restore'); },
      setChineseSessionTitle: function (enabled) {
        return invoke('ag-studio:enhance-apply', { chineseTitle: Boolean(enabled) });
      },

      getContextUnlockStatus: function () { return invoke('ag-studio:context-unlock-status'); },
      applyContextUnlock: function (opts) { return invoke('ag-studio:context-unlock-apply', opts || {}); },
      restoreContextUnlock: function () { return invoke('ag-studio:context-unlock-restore'); },
      getContextLimitsStatus: function () { return invoke('ag-studio:context-unlock-status'); },
      setContextLimit: function (model, limit) {
        return invoke('ag-studio:context-limit-set', { model: model, limit: limit });
      },
      resetContextLimit: function (model) {
        return invoke('ag-studio:context-limit-reset', { model: model });
      },

      getRehydrateStatus: function () { return invoke('ag-studio:rehydrate-status'); },
      applyRehydrate: function () { return invoke('ag-studio:rehydrate-apply'); },
      disableRehydrate: function () { return invoke('ag-studio:rehydrate-disable'); },
      restoreRehydrate: function () { return invoke('ag-studio:rehydrate-restore'); },

      testProxy: function (url) { return invoke('ag-studio:test-proxy', url); },
      launchCli: function (opts) { return invoke('ag-studio:launch-cli', opts || {}); },
      scanFonts: function () { return invoke('ag-studio:scan-fonts'); },
      getI18nPayload: function () { return invoke('ag-studio:i18n-get'); },
      saveCustomDictionary: function (dict) { return invoke('ag-studio:i18n-save-custom', dict || {}); },
      translateThought: function (payload) { return invoke('ag-studio:thought-translate', payload || {}); },
      diagnoseThought: function (payload) { return invoke('ag-studio:thought-diagnose', payload || {}); },
      clearThoughtCache: function () { return invoke('ag-studio:thought-clear-cache'); },
      getInlineDiff: function (payload) { return invoke('ag-studio:inline-diff', payload || {}); },
      clearGeminiWebSession: function () { return invoke('ag-studio:gemini-web-clear-session'); },
      openGeminiWebExternal: function (url) { return invoke('ag-studio:gemini-web-open-external', url); },
      openPath: function (target) { return invoke('ag-studio:open-path', target); },
      restartHost: function () { return invoke('ag-studio:restart-host'); },
      restartLanguageServers: function () { return invoke('ag-studio:restart-language-servers'); },

      onConfigChanged: function (cb) {
        if (typeof cb !== 'function') return function () {};
        var fn = function (_e, data) { cb(data); };
        ipcRenderer.on('ag-studio:config-changed', fn);
        return function () { ipcRenderer.removeListener('ag-studio:config-changed', fn); };
      },
      onI18nChanged: function (cb) {
        if (typeof cb !== 'function') return function () {};
        var fn = function (_e, data) { cb(data); };
        ipcRenderer.on('ag-studio:i18n-changed', fn);
        return function () { ipcRenderer.removeListener('ag-studio:i18n-changed', fn); };
      }
    };

    if (contextBridge && typeof contextBridge.exposeInMainWorld === 'function') {
      contextBridge.exposeInMainWorld('agStudioAPI', api);
    } else if (typeof window !== 'undefined') {
      window.agStudioAPI = api;
    }

    var bootI18n = null;
    try {
      bootI18n = ipcRenderer.sendSync('ag-studio:i18n-boot-sync');
    } catch (_e) {}

    try {
      var i18nMod = require('./ag-studio/studio-i18n-preload.js');
      if (i18nMod && typeof i18nMod.initPreloadI18n === 'function') {
        i18nMod.initPreloadI18n(bootI18n);
      }
    } catch (_e2) {}

    ipcRenderer.on('ag-studio:i18n-changed', function (_e, payload) {
      try {
        if (typeof globalThis !== 'undefined' && globalThis.__AG_STUDIO_I18N__ && typeof globalThis.__AG_STUDIO_I18N__.applyPayload === 'function') {
          globalThis.__AG_STUDIO_I18N__.applyPayload(payload);
        }
        if (typeof window !== 'undefined' && window.__AG_STUDIO_I18N__ && typeof window.__AG_STUDIO_I18N__.applyPayload === 'function') {
          window.__AG_STUDIO_I18N__.applyPayload(payload);
        }
      } catch (_e3) {}
    });
  } catch (err) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[Antigravity Studio] Preload snippet warning:', err);
    }
  }
})();
