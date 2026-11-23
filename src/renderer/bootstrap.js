(function (globalScope) {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__AG_STUDIO_MOUNTED__) return;
  window.__AG_STUDIO_MOUNTED__ = true;

  var api = window.agStudioAPI || null;
  var themes = window.__AG_STUDIO_THEMES__;
  var typography = window.__AG_STUDIO_TYPOGRAPHY__;
  var anchors = window.__AG_STUDIO_ANCHORS__;
  var mascotStageApi = window.__AG_STUDIO_MASCOT_STAGE__;
  var hudApi = window.__AG_STUDIO_HUD__;
  var homeCardApi = window.__AG_STUDIO_HOME_CARD__;
  var prismFxApi = window.__AG_STUDIO_PRISM_FX__;
  var effortSliderApi = window.__AG_STUDIO_EFFORT_SLIDER__;
  var drawerApi = window.__AG_STUDIO_DRAWER__ || window.__AG_STUDIO_DASHBOARD__;

  var currentConfig = {
    theme: { activePreset: 'claude', colorMode: 'system', customThemes: [], editorialSerif: true, fonts: {} },
    mascot: { enabled: true, style: 'clawd', scale: 1, align: 'right', sleepTimeoutMs: 300000 },
    hud: { enabled: true, position: 'composer', showVial: true, homeOverview: true },
    fx: { inkStream: true, smoothCaret: true, edgeAura: true, effortSlider: false },
    homeOverview: true,
    i18n: { language: 'zh-CN' },
    proxy: { enabled: false, proxyUrl: 'http://127.0.0.1:7897' },
    context: { perModelLimits: {} },
    quota: { autoSwitch: { enabled: false, threshold: 0.05 } },
    enhance: { chineseSessionTitle: false, promptTier: 0, subscriptionMonthlyUsd: 20 }
  };

  var scannedFonts = [];
  var lastInteractionAt = Date.now();
  var lastTypingAt = 0;
  var lastConversationId = null;
  var wasGenerating = false;
  var happyUntil = 0;
  var backgroundCompleted = false;
  var latestSnapshot = null;
  var latestTurnState = null;
  var latestHomeOverview = null;
  var lastHomeFetchAt = 0;
  var refreshBusy = false;

  var root = document.getElementById('ag-studio-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'ag-studio-root';
    root.setAttribute('data-ag-studio-ignore', 'true');
    root.setAttribute('data-ag-no-i18n', 'true');
    (document.body || document.documentElement).appendChild(root);
  }

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

  function saveConfigPartial(partial) {
    currentConfig = deepMergeSimple(currentConfig, partial);
    applyVisuals();
    syncDomAndTurnState();
    if (drawer.isOpen()) drawer.render();
    if (api && api.saveConfig) {
      api.saveConfig(partial).then(function (saved) {
        if (saved) {
          currentConfig = deepMergeSimple(currentConfig, saved);
          applyVisuals();
          syncDomAndTurnState();
          if (drawer.isOpen()) drawer.render();
        }
      }).catch(function () {});
    }
  }

  var drawer = drawerApi.createDashboardDrawer({
    api: api,
    getConfig: function () { return currentConfig; },
    saveConfig: saveConfigPartial,
    onTabChange: function (tab) {
      if (tab === 'settings' || tab === 'accounts' || tab === 'usage') {
        refreshData(true);
      }
    },
    onRefresh: function (force) { refreshData(Boolean(force)); }
  });

  var mascotStage = mascotStageApi.createMascotStage({
    style: currentConfig.mascot.style,
    scale: currentConfig.mascot.scale,
    align: currentConfig.mascot.align || 'right',
    enabled: currentConfig.mascot.enabled !== false,
    onOpenDrawer: function () { drawer.toggle(); }
  });

  var hud = hudApi.createComposerHud({
    onToggleDrawer: function () { drawer.toggle(); }
  });

  var homeCard = homeCardApi.createHomeOverviewCard({
    getConfig: function () { return currentConfig; },
    onRangeChange: function (days) {
      fetchHomeOverview(days, true);
    }
  });

  var prismFx = prismFxApi.createPrismFxController();

  var effortSlider = effortSliderApi.createEffortSliderController({
    getConfig: function () { return currentConfig; },
    onChangeEffort: function (tier) {
      saveConfigPartial({ fx: { reasoningEffort: tier } });
    }
  });

  root.appendChild(drawer.element);

  var lastThemeSig = '';
  var lastTypoSig = '';

  function applyVisuals() {
    var themeSig = JSON.stringify(currentConfig.theme || {});
    if (themeSig !== lastThemeSig) {
      lastThemeSig = themeSig;
      themes.applyThemeToDocument(currentConfig.theme);
    }
    var fontsSig = JSON.stringify((currentConfig.theme && currentConfig.theme.fonts) || {}) + '|' + scannedFonts.length;
    if (fontsSig !== lastTypoSig) {
      lastTypoSig = fontsSig;
      typography.applyTypographyToDocument(currentConfig.theme, scannedFonts);
    }
    var mCfg = currentConfig.mascot || {};
    mascotStage.update({
      style: mCfg.style || 'clawd',
      scale: mCfg.scale || 1,
      align: mCfg.align || 'right',
      offsetX: mCfg.offsetX || 0,
      offsetY: mCfg.offsetY || 0,
      enabled: mCfg.enabled !== false
    });
  }

  function syncDomAndTurnState() {
    if (!anchors) return;
    var domState = anchors.sniffDomTurnState();
    var composer = anchors.findComposerTarget();
    var now = Date.now();

    if (domState.conversationId !== lastConversationId) {
      lastConversationId = domState.conversationId;
      latestSnapshot = null;
      latestTurnState = null;
      wasGenerating = false;
      happyUntil = 0;
      refreshData(true);
    }

    var fused = anchors.fuseTurnState({
      dom: domState,
      backend: latestTurnState,
      now: now,
      lastInteractionAt: lastInteractionAt,
      lastTypingAt: lastTypingAt,
      sleepTimeoutMs: (currentConfig.mascot && currentConfig.mascot.sleepTimeoutMs) || 300000,
      happyUntil: happyUntil,
      backgroundCompleted: backgroundCompleted
    });

    if (wasGenerating && !fused.isGenerating && !fused.hasError && !fused.awaitingDecision) {
      happyUntil = now + 2600;
      fused.mascotState = 'happy';
      var blurred = typeof document.hasFocus === 'function' ? !document.hasFocus() : document.hidden;
      if (blurred) {
        backgroundCompleted = true;
        fused.auraPhase = 'complete';
      }
    }
    wasGenerating = fused.isGenerating;

    // 1. Top edge mascot
    if (composer && currentConfig.mascot && currentConfig.mascot.enabled !== false) {
      var topAnchor = anchors.ensureComposerTopAnchor(composer);
      mascotStage.mountTo(topAnchor);
      mascotStage.update({ state: fused.mascotState });
    } else {
      mascotStage.mountTo(null);
    }

    // 2. Bottom composer HUD + 512K vial
    hud.update(latestSnapshot, currentConfig, composer);

    // 3. Blank home overview card
    if (domState.isHome) {
      homeCard.update(latestHomeOverview, currentConfig);
      if (!latestHomeOverview || now - lastHomeFetchAt > 30000) {
        fetchHomeOverview(homeCard.getDays(), false);
      }
    } else {
      anchors.parkHomeCardSlot();
    }

    // 4. Prism FX & Effort Slider
    prismFx.sync({
      cfg: currentConfig,
      isGenerating: fused.isGenerating,
      auraPhase: fused.auraPhase
    });
    effortSlider.sync(currentConfig);
  }

  function fetchHomeOverview(days, force) {
    if (!api) return;
    var fn = api.getHistoryOverview || api.getHistorySummary;
    if (!fn) return;
    var now = Date.now();
    if (!force && now - lastHomeFetchAt < 4000) return;
    lastHomeFetchAt = now;
    fn(days).then(function (data) {
      if (data) {
        latestHomeOverview = data;
        var domState = anchors ? anchors.sniffDomTurnState() : { isHome: false };
        if (domState.isHome) {
          homeCard.update(latestHomeOverview, currentConfig);
        }
      }
    }).catch(function () {});
  }

  function refreshData(force) {
    if (refreshBusy && !force) return;
    if (!api) {
      syncDomAndTurnState();
      if (drawer.isOpen()) {
        drawer.render({ snapshot: null, history: null, accounts: null, fonts: scannedFonts });
      }
      return;
    }

    refreshBusy = true;
    var cid = anchors ? anchors.extractConversationId() : null;
    var scanFn = api.scan
      ? function () { return api.scan(cid, Boolean(force)); }
      : (api.getLiveSnapshot ? function () { return api.getLiveSnapshot(cid); } : function () { return Promise.resolve(null); });
    var turnFn = (cid && api.getTurnState)
      ? function () { return api.getTurnState(cid); }
      : function () { return Promise.resolve(null); };

    var open = drawer.isOpen();
    var tab = drawer.getActiveTab();
    var histFn = open && (tab === 'usage' || force) && (api.getHistoryOverview || api.getHistorySummary)
      ? function () { return (api.getHistoryOverview || api.getHistorySummary)(drawer.getDays()); }
      : function () { return Promise.resolve(undefined); };
    var accFn = open && (tab === 'accounts' || force) && api.getAccountsOverview
      ? function () { return api.getAccountsOverview(); }
      : function () { return Promise.resolve(undefined); };
    var enhFn = open && tab === 'settings' && api.getEnhanceStatus
      ? function () { return api.getEnhanceStatus(); }
      : function () { return Promise.resolve(undefined); };
    var unlFn = open && tab === 'settings' && api.getContextUnlockStatus
      ? function () { return api.getContextUnlockStatus(); }
      : function () { return Promise.resolve(undefined); };
    var rehFn = open && tab === 'settings' && api.getRehydrateStatus
      ? function () { return api.getRehydrateStatus(); }
      : function () { return Promise.resolve(undefined); };

    Promise.all([
      scanFn().catch(function () { return null; }),
      turnFn().catch(function () { return null; }),
      histFn().catch(function () { return undefined; }),
      accFn().catch(function () { return undefined; }),
      enhFn().catch(function () { return undefined; }),
      unlFn().catch(function () { return undefined; }),
      rehFn().catch(function () { return undefined; })
    ]).then(function (res) {
      refreshBusy = false;
      var snap = res[0];
      var turn = res[1];
      if (snap) {
        if (cid && !snap.conversationId) snap.conversationId = cid;
        latestSnapshot = snap;
        if (snap.context && snap.context.speed) {
          drawer.pushSpeedSample(snap.context.speed.tokPerSec || snap.context.speed.tps || 0);
        }
      }
      if (turn) latestTurnState = turn;

      syncDomAndTurnState();

      if (drawer.isOpen()) {
        drawer.render({
          snapshot: latestSnapshot,
          history: res[2],
          accounts: res[3],
          fonts: scannedFonts,
          enhanceStatus: res[4],
          unlockStatus: res[5],
          rehydrateStatus: res[6]
        });
      }
    });
  }

  // Interaction & Focus Listeners
  document.addEventListener('keydown', function (e) {
    lastInteractionAt = Date.now();
    backgroundCompleted = false;
    if (e.target && e.target.closest && e.target.closest('[data-testid="agent-input-box"], .surface-composer-card')) {
      lastTypingAt = Date.now();
    }
    if (e.ctrlKey && e.shiftKey && (e.key === 'G' || e.key === 'g')) {
      e.preventDefault();
      drawer.toggle();
    }
  }, true);

  document.addEventListener('input', function (e) {
    lastInteractionAt = Date.now();
    if (e.target && e.target.closest && e.target.closest('[data-testid="agent-input-box"], .surface-composer-card')) {
      lastTypingAt = Date.now();
      if (!wasGenerating) {
        mascotStage.update({ state: 'typing' });
      }
    }
  }, true);

  document.addEventListener('pointerdown', function () {
    lastInteractionAt = Date.now();
    backgroundCompleted = false;
  }, { passive: true });

  window.addEventListener('focus', function () {
    lastInteractionAt = Date.now();
    if (backgroundCompleted) {
      backgroundCompleted = false;
      syncDomAndTurnState();
    }
  });

  if (anchors) {
    anchors.watchAnchors(function () {
      syncDomAndTurnState();
    });
  }

  if (api) {
    Promise.all([
      api.getConfig ? api.getConfig().catch(function () { return null; }) : Promise.resolve(null),
      api.scanFonts ? api.scanFonts().catch(function () { return { fonts: [] }; }) : Promise.resolve({ fonts: [] })
    ]).then(function (res) {
      if (res[0]) currentConfig = deepMergeSimple(currentConfig, res[0]);
      if (res[1] && Array.isArray(res[1].fonts)) scannedFonts = res[1].fonts;
      applyVisuals();
      syncDomAndTurnState();
      refreshData(true);
    });

    if (api.onConfigChanged) {
      api.onConfigChanged(function (nextCfg) {
        if (nextCfg) {
          currentConfig = deepMergeSimple(currentConfig, nextCfg);
          applyVisuals();
          syncDomAndTurnState();
          if (drawer.isOpen()) drawer.render();
        }
      });
    }
  } else {
    applyVisuals();
    syncDomAndTurnState();
    refreshData(true);
  }

  setInterval(function () {
    if (!document.hidden) refreshData(false);
  }, 4500);
})(typeof window !== 'undefined' ? window : globalThis);
