(function (globalScope) {
  'use strict';

  function loadEffortModules() {
    var upstream = (globalScope && globalScope.AntigravityCodexEffortSlider) ||
      (typeof window !== 'undefined' && window.AntigravityCodexEffortSlider) || null;
    var coexist = (globalScope && globalScope.__agPrismEffortSlider) ||
      (typeof window !== 'undefined' && window.__agPrismEffortSlider) || null;

    if ((!upstream || !coexist) && typeof require === 'function') {
      try {
        if (typeof globalThis !== 'undefined') globalThis.__agCodexEffortSliderDisableAutoBoot = true;
        if (typeof window !== 'undefined') window.__agCodexEffortSliderDisableAutoBoot = true;
        if (!upstream) upstream = require('./vendor/effort-slider/upstream-client.js');
        if (!coexist) coexist = require('./vendor/effort-slider/slider-coexist.js');
      } catch (_e) {}
    }
    return { upstream: upstream, coexist: coexist };
  }

  var mods = loadEffortModules();
  var upstreamLib = mods.upstream;
  var coexistLib = mods.coexist;

  function createEffortSliderController(_opts) {
    var initialized = false;
    var lastSyncKey = '';
    var ownedLangAttr = false;
    var ownedThemeAttr = false;

    function syncHostBridgeAttrs(lang, mode) {
      if (typeof document === 'undefined' || !document.documentElement) return;
      var rootEl = document.documentElement;
      if (rootEl.hasAttribute('data-ag-cs-style')) return;

      if (lang) {
        if (rootEl.getAttribute('data-ag-cs-lang') !== lang) {
          rootEl.setAttribute('data-ag-cs-lang', lang);
          ownedLangAttr = true;
        }
      }
      if (mode === 'dark' || mode === 'light') {
        if (rootEl.getAttribute('data-ag-cs-theme') !== mode) {
          rootEl.setAttribute('data-ag-cs-theme', mode);
          ownedThemeAttr = true;
        }
      }
    }

    function clearOwnedAttrs() {
      if (typeof document === 'undefined' || !document.documentElement) return;
      var rootEl = document.documentElement;
      if (rootEl.hasAttribute('data-ag-cs-style')) {
        ownedLangAttr = false;
        ownedThemeAttr = false;
        return;
      }
      if (ownedLangAttr) {
        rootEl.removeAttribute('data-ag-cs-lang');
        ownedLangAttr = false;
      }
      if (ownedThemeAttr) {
        rootEl.removeAttribute('data-ag-cs-theme');
        ownedThemeAttr = false;
      }
    }

    function sync(cfg) {
      var fx = (cfg && cfg.fx) || {};
      var enabled = fx.effortSlider === true;
      var lang = (cfg && cfg.i18n && cfg.i18n.language) || 'zh-CN';
      var mode = (typeof document !== 'undefined' && document.documentElement)
        ? (document.documentElement.getAttribute('data-ags-mode') || '')
        : '';

      if (enabled) syncHostBridgeAttrs(lang, mode);
      else clearOwnedAttrs();

      var syncKey = (enabled ? '1' : '0') + '|' + lang + '|' + mode;
      if (initialized && syncKey === lastSyncKey) {
        return;
      }
      initialized = true;
      lastSyncKey = syncKey;

      if (coexistLib && typeof coexistLib.sync === 'function') {
        coexistLib.sync({
          effortSliderModule: enabled ? 'auto' : 'off',
          effortMemory: enabled
        });
      }
    }

    function destroy() {
      if (coexistLib && typeof coexistLib.destroy === 'function') {
        try { coexistLib.destroy(); } catch (_e) {}
      }
      clearOwnedAttrs();
      initialized = false;
      lastSyncKey = '';
    }

    return {
      sync: sync,
      destroy: destroy
    };
  }

  var api = {
    createEffortSliderController: createEffortSliderController,
    upstream: upstreamLib,
    coexist: coexistLib,
    normalizeEffortIndex: upstreamLib && upstreamLib.normalizeEffortIndex,
    resolveModelEffortProfile: upstreamLib && upstreamLib.resolveModelEffortProfile,
    parseModelLabel: (upstreamLib && upstreamLib.parseModelLabel) || (coexistLib && coexistLib.parseLocalizedModelLabel),
    fillColorFor: upstreamLib && upstreamLib.fillColorFor,
    fillBackgroundFor: upstreamLib && upstreamLib.fillBackgroundFor,
    valueColorFor: upstreamLib && upstreamLib.valueColorFor,
    mountCodexEffortSlider: upstreamLib && upstreamLib.mountCodexEffortSlider,
    installAntigravityObserver: upstreamLib && upstreamLib.installAntigravityObserver,
    installCodexEffortSlider: upstreamLib && upstreamLib.installCodexEffortSlider
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_EFFORT_SLIDER__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
