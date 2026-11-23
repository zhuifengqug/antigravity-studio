(function () {
  try {
    var electron = require('electron');
    var contextBridge = electron.contextBridge;
    var ipcRenderer = electron.ipcRenderer;

    var api = {
      getRuntimeInfo: function () { return ipcRenderer.invoke('ag-studio:runtime-info'); },
      getConfig: function () { return ipcRenderer.invoke('ag-studio:get-config'); },
      saveConfig: function (partial) { return ipcRenderer.invoke('ag-studio:save-config', partial); },
      getLiveSnapshot: function (cid) { return ipcRenderer.invoke('ag-studio:live-snapshot', cid); },
      getHistorySummary: function (days) { return ipcRenderer.invoke('ag-studio:history-summary', days); },
      recordTurn: function (turn) { return ipcRenderer.invoke('ag-studio:record-turn', turn); },
      testProxy: function (url) { return ipcRenderer.invoke('ag-studio:test-proxy', url); },
      getAccountsOverview: function () { return ipcRenderer.invoke('ag-studio:accounts-overview'); },
      accountsAction: function (payload) { return ipcRenderer.invoke('ag-studio:accounts-action', payload); },
      getContextLimitsStatus: function () { return ipcRenderer.invoke('ag-studio:context-limits-status'); },
      setContextLimit: function (model, limit) { return ipcRenderer.invoke('ag-studio:context-limit-set', { model: model, limit: limit }); },
      resetContextLimit: function (model) { return ipcRenderer.invoke('ag-studio:context-limit-reset', { model: model }); },
      getEnhanceStatus: function () { return ipcRenderer.invoke('ag-studio:enhance-status'); },
      setChineseSessionTitle: function (enabled) { return ipcRenderer.invoke('ag-studio:enhance-set-title', enabled); },
      applyBinaryEnhance: function () { return ipcRenderer.invoke('ag-studio:enhance-apply-binary'); },
      restoreBinaryEnhance: function () { return ipcRenderer.invoke('ag-studio:enhance-restore-binary'); },
      getI18nPayload: function () { return ipcRenderer.invoke('ag-studio:i18n-get'); },
      saveCustomDictionary: function (dict) { return ipcRenderer.invoke('ag-studio:i18n-save-custom', dict); },
      scanFonts: function () { return ipcRenderer.invoke('ag-studio:scan-fonts'); },
      launchCli: function (opts) { return ipcRenderer.invoke('ag-studio:launch-cli', opts); },
      openPath: function (target) { return ipcRenderer.invoke('ag-studio:open-path', target); },
      restartHost: function () { return ipcRenderer.invoke('ag-studio:restart-host'); },
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
