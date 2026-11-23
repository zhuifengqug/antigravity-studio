(function (globalScope) {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__AG_STUDIO_MOUNTED__) return;
  window.__AG_STUDIO_MOUNTED__ = true;

  var api = window.agStudioAPI || null;
  var themes = window.__AG_STUDIO_THEMES__;
  var typography = window.__AG_STUDIO_TYPOGRAPHY__;
  var mascotApi = window.__AG_STUDIO_MASCOT__;
  var hudApi = window.__AG_STUDIO_HUD__;
  var dashApi = window.__AG_STUDIO_DASHBOARD__;

  var currentConfig = {
    theme: { activePreset: 'claude', colorMode: 'system', customThemes: [], editorialSerif: true, fonts: {} },
    mascot: { enabled: true, style: 'clawd', scale: 1 },
    hud: { enabled: true, position: 'composer' },
    i18n: { language: 'zh-CN' },
    proxy: { enabled: false, proxyUrl: 'http://127.0.0.1:7897' },
    context: { perModelLimits: {} },
    quota: { autoSwitch: { enabled: false, threshold: 0.05 } },
    enhance: { chineseSessionTitle: false }
  };
  var scannedFonts = [];
  var lastInteractionAt = Date.now();

  var root = document.getElementById('ag-studio-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'ag-studio-root';
    root.setAttribute('data-ag-studio-ignore', 'true');
    (document.body || document.documentElement).appendChild(root);
  }

  var mascotWidget = mascotApi.createMascotWidget({
    style: currentConfig.mascot.style,
    scale: currentConfig.mascot.scale,
    onClick: function () { drawer.toggle(); }
  });

  var drawer = dashApi.createDashboardDrawer({
    api: api,
    getConfig: function () { return currentConfig; },
    saveConfig: function (partial) {
      currentConfig = deepMergeSimple(currentConfig, partial);
      applyVisuals();
      drawer.render();
      if (api && api.saveConfig) {
        api.saveConfig(partial).then(function (saved) {
          if (saved) {
            currentConfig = saved;
            applyVisuals();
            drawer.render();
          }
        }).catch(function () {});
      }
    },
    onRefresh: function () { refreshData(); }
  });

  var hud = hudApi.createComposerHud({
    mascotElement: mascotWidget.element,
    onToggleDrawer: function () { drawer.toggle(); }
  });

  root.appendChild(drawer.element);

  function deepMergeSimple(target, source) {
    var out = Object.assign({}, target);
    Object.keys(source || {}).forEach(function (k) {
      var v = source[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
        out[k] = deepMergeSimple(out[k], v);
      } else {
        out[k] = v;
      }
    });
    return out;
  }

  function applyVisuals() {
    themes.applyThemeToDocument(currentConfig.theme);
    typography.applyTypographyToDocument(currentConfig.theme, scannedFonts);
    mascotWidget.update({
      style: currentConfig.mascot.style,
      scale: currentConfig.mascot.scale,
      enabled: currentConfig.mascot.enabled !== false
    });
  }

  function inferMascotState(snapshot) {
    var speed = snapshot && snapshot.context && snapshot.context.speed;
    if (speed && speed.isGenerating) return 'thinking';
    var sleepMs = (currentConfig.mascot && currentConfig.mascot.sleepTimeoutMs) || 300000;
    if (Date.now() - lastInteractionAt > sleepMs) return 'asleep';
    return 'idle';
  }

  function refreshData() {
    if (!api) {
      hud.update(null, currentConfig);
      drawer.render({ snapshot: null, history: null, accounts: null, fonts: scannedFonts });
      return;
    }
    Promise.all([
      api.getLiveSnapshot().catch(function () { return null; }),
      drawer.isOpen() ? api.getHistorySummary(drawer.getDays()).catch(function () { return null; }) : Promise.resolve(null),
      drawer.isOpen() ? api.getAccountsOverview().catch(function () { return null; }) : Promise.resolve(null)
    ]).then(function (results) {
      var snap = results[0];
      var hist = results[1];
      var acc = results[2];
      if (snap && snap.context && snap.context.speed) {
        drawer.pushSpeedSample(snap.context.speed.tokPerSec || 0);
      }
      mascotWidget.update({ state: inferMascotState(snap) });
      hud.update(snap, currentConfig);
      if (drawer.isOpen()) {
        drawer.render({
          snapshot: snap,
          history: hist || undefined,
          accounts: acc || undefined,
          fonts: scannedFonts
        });
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    lastInteractionAt = Date.now();
    if (e.ctrlKey && e.shiftKey && (e.key === 'G' || e.key === 'g')) {
      e.preventDefault();
      drawer.toggle();
    }
  });
  document.addEventListener('pointerdown', function () { lastInteractionAt = Date.now(); }, { passive: true });

  if (api) {
    Promise.all([
      api.getConfig().catch(function () { return null; }),
      api.scanFonts().catch(function () { return { fonts: [] }; })
    ]).then(function (res) {
      if (res[0]) currentConfig = res[0];
      if (res[1] && Array.isArray(res[1].fonts)) scannedFonts = res[1].fonts;
      applyVisuals();
      refreshData();
    });

    if (api.onConfigChanged) {
      api.onConfigChanged(function (nextCfg) {
        if (nextCfg) {
          currentConfig = nextCfg;
          applyVisuals();
          hud.update(null, currentConfig);
          if (drawer.isOpen()) drawer.render();
        }
      });
    }
  } else {
    applyVisuals();
    refreshData();
  }

  setInterval(refreshData, 4000);
})(typeof window !== 'undefined' ? window : globalThis);
