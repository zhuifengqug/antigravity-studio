(function (globalScope) {
  'use strict';

  var EFFORT_LEVELS = [
    { id: 'low', labelZh: '低', labelEn: 'Low', keywords: ['low', 'minimal', 'lite', '低'] },
    { id: 'medium', labelZh: '中', labelEn: 'Medium', keywords: ['medium', 'med', '中'] },
    { id: 'high', labelZh: '高', labelEn: 'High', keywords: ['high', 'thinking', '高', '深度思考'] },
    { id: 'xhigh', labelZh: '极高', labelEn: 'xHigh', keywords: ['xhigh', 'extra high', 'extra', 'max', '极高', '超高'] }
  ];

  function ensureEffortStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ag-studio-effort-style')) return;
    var s = document.createElement('style');
    s.id = 'ag-studio-effort-style';
    s.textContent = [
      '.ags-effort-bar { margin:6px 8px 4px 8px; padding:8px 10px; border-radius:10px; border:1px solid var(--ags-border, rgba(148,163,184,.22)); background:var(--ags-bg-canvas, rgba(128,128,128,.06)); font-family:var(--ags-font-ui, system-ui, sans-serif); display:flex; flex-direction:column; gap:7px; }',
      '.ags-effort-head { display:flex; align-items:center; justify-content:space-between; font-size:11.5px; }',
      '.ags-effort-title { color:var(--ags-text-secondary, #94a3b8); font-weight:500; }',
      '.ags-effort-val { color:var(--ags-accent, #D97757); font-weight:600; }',
      '.ags-effort-steps { position:relative; display:grid; grid-template-columns:repeat(4,1fr); gap:4px; padding:2px; border-radius:8px; background:var(--ags-bg-surface, rgba(24,24,27,.6)); border:1px solid var(--ags-border, rgba(148,163,184,.16)); }',
      '.ags-effort-btn { border:none; background:transparent; color:var(--ags-text-secondary, #94a3b8); font-size:11px; font-weight:500; padding:4px 2px; border-radius:6px; cursor:pointer; transition:color 100ms ease, background-color 100ms ease; }',
      '.ags-effort-btn:hover { color:var(--ags-text-primary, #f4f4f5); }',
      '.ags-effort-btn.active { background:var(--ags-accent-soft, rgba(217,119,87,.16)); color:var(--ags-accent, #D97757); font-weight:600; }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function detectEffortFromText(text) {
    var low = String(text || '').toLowerCase();
    // Check xhigh BEFORE high so "xhigh" / "extra high" never gets misclassified as "high"
    if (/(?:\bxhigh\b|\bx-high\b|extra[\s-]*high|\bmax\b|极高|超高)/i.test(low)) return 'xhigh';
    if (/(?:\bhigh\b|\bthinking\b|深度思考|\(\s*高\s*\)|（\s*高\s*）)/i.test(low)) return 'high';
    if (/(?:\bmedium\b|\bmed\b|\(\s*中\s*\)|（\s*中\s*）)/i.test(low)) return 'medium';
    if (/(?:\blow\b|\bminimal\b|\blite\b|\(\s*低\s*\)|（\s*低\s*）)/i.test(low)) return 'low';
    for (var i = EFFORT_LEVELS.length - 1; i >= 0; i--) {
      var lvl = EFFORT_LEVELS[i];
      for (var k = 0; k < lvl.keywords.length; k++) {
        if (low.indexOf(lvl.keywords[k]) !== -1) return lvl.id;
      }
    }
    return 'medium';
  }

  function extractModelFamily(text) {
    return String(text || '')
      .replace(/[（(][^（）()]*[）)]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function itemMatchesEffort(txt, levelId) {
    var low = String(txt || '').toLowerCase().trim();
    if (!low) return false;
    if (levelId === 'xhigh') {
      return /\bxhigh\b|\bx-high\b|extra[\s-]*high|极高|超高/.test(low);
    }
    if (levelId === 'high') {
      if (/\bxhigh\b|\bx-high\b|extra[\s-]*high|极高|超高/.test(low)) return false;
      return /\bhigh\b|\(\s*高\s*\)|（\s*高\s*）|^高$/.test(low);
    }
    if (levelId === 'medium') {
      return /\bmedium\b|\bmed\b|\(\s*中\s*\)|（\s*中\s*）|^中$/.test(low);
    }
    if (levelId === 'low') {
      return /\blow\b|\bminimal\b|\blite\b|\(\s*低\s*\)|（\s*低\s*）|^低$/.test(low);
    }
    return false;
  }

  function triggerHostClick(el) {
    if (!el) return;
    try {
      if (typeof PointerEvent === 'function') {
        el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      }
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      el.click();
    } catch (_e) {
      try { el.click(); } catch (_e2) {}
    }
  }

  function createEffortSliderController(options) {
    if (typeof document === 'undefined') {
      return { sync: function () {}, destroy: function () {} };
    }
    ensureEffortStyles();
    var opts = options || {};
    var barEl = null;
    var titleEl = null;
    var valEl = null;
    var btnMap = {};
    var currentEffort = 'medium';
    var lastRenderedKey = '';
    var mountedPanel = null;
    var syncTimer = 0;

    function isZh() {
      var cfg = typeof opts.getConfig === 'function' ? opts.getConfig() : {};
      var lang = (cfg && cfg.i18n && cfg.i18n.language) || 'zh-CN';
      return lang !== 'en';
    }

    function readHostTrigger() {
      var trig = document.querySelector('[data-testid="model-selector-trigger"]');
      if (!trig) return { family: '', effort: null };
      var raw = trig.getAttribute('aria-label') || trig.textContent || '';
      return {
        family: extractModelFamily(raw),
        effort: detectEffortFromText(raw)
      };
    }

    function tryApplyEffortToMenu(panel, levelId) {
      if (!panel) return false;

      // 1. Dedicated host effort group buttons if rendered
      var effortBtns = panel.querySelectorAll('[data-testid="model-selector-effort-group"] button, [role="radio"]');
      for (var i = 0; i < effortBtns.length; i++) {
        var btn = effortBtns[i];
        if (btn.closest && btn.closest('.ags-effort-bar')) continue;
        var txt = String(btn.textContent || btn.getAttribute('aria-label') || '').trim();
        if (itemMatchesEffort(txt, levelId)) {
          triggerHostClick(btn);
          return true;
        }
      }

      // 2. Match model list items with same model family + target effort
      var host = readHostTrigger();
      var menuItems = panel.querySelectorAll('[role="menuitem"], [role="option"], [role="menuitemradio"], button');
      var fallbackMatch = null;
      for (var j = 0; j < menuItems.length; j++) {
        var item = menuItems[j];
        if (item.closest && item.closest('.ags-effort-bar')) continue;
        var itemTxt = String(item.textContent || item.getAttribute('aria-label') || '').trim();
        if (!itemMatchesEffort(itemTxt, levelId)) continue;
        if (host.family && extractModelFamily(itemTxt).indexOf(host.family) !== -1) {
          triggerHostClick(item);
          return true;
        }
        if (!fallbackMatch) fallbackMatch = item;
      }

      if (fallbackMatch) {
        triggerHostClick(fallbackMatch);
        return true;
      }
      return false;
    }

    function ensureBarBuilt() {
      if (barEl) return;
      barEl = document.createElement('div');
      barEl.className = 'ags-effort-bar';
      barEl.setAttribute('data-ag-studio-ignore', 'true');
      barEl.setAttribute('data-ag-no-i18n', 'true');

      var head = document.createElement('div');
      head.className = 'ags-effort-head';
      titleEl = document.createElement('span');
      titleEl.className = 'ags-effort-title';
      valEl = document.createElement('span');
      valEl.className = 'ags-effort-val';
      head.appendChild(titleEl);
      head.appendChild(valEl);

      var steps = document.createElement('div');
      steps.className = 'ags-effort-steps';
      for (var i = 0; i < EFFORT_LEVELS.length; i++) {
        (function (lvl) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'ags-effort-btn';
          b.setAttribute('data-effort', lvl.id);
          b.addEventListener('click', function (ev) {
            ev.stopPropagation();
            if (currentEffort === lvl.id) return;
            currentEffort = lvl.id;
            updateBarDom();
            var panel = mountedPanel || document.querySelector('[data-testid="model-selector-panel"]');
            tryApplyEffortToMenu(panel, lvl.id);
            if (syncTimer) clearTimeout(syncTimer);
            syncTimer = setTimeout(function () {
              syncTimer = 0;
              var host = readHostTrigger();
              if (host.effort && host.effort !== currentEffort) {
                currentEffort = host.effort;
                updateBarDom();
              }
            }, 120);
          });
          btnMap[lvl.id] = b;
          steps.appendChild(b);
        })(EFFORT_LEVELS[i]);
      }

      barEl.appendChild(head);
      barEl.appendChild(steps);
    }

    function updateBarDom() {
      ensureBarBuilt();
      var zh = isZh();
      var key = currentEffort + '|' + (zh ? '1' : '0');
      if (key === lastRenderedKey) return;
      lastRenderedKey = key;

      var activeLvl = EFFORT_LEVELS.find(function (l) { return l.id === currentEffort; }) || EFFORT_LEVELS[1];
      titleEl.textContent = zh ? '推理等级' : 'Reasoning Effort';
      valEl.textContent = zh ? activeLvl.labelZh : activeLvl.labelEn;

      for (var i = 0; i < EFFORT_LEVELS.length; i++) {
        var lvl = EFFORT_LEVELS[i];
        var btn = btnMap[lvl.id];
        if (!btn) continue;
        btn.textContent = zh ? lvl.labelZh : lvl.labelEn;
        btn.classList.toggle('active', lvl.id === currentEffort);
      }
    }

    function removeBar() {
      mountedPanel = null;
      if (barEl && barEl.parentElement) barEl.parentElement.removeChild(barEl);
    }

    function sync(cfg) {
      var fx = (cfg && cfg.fx) || {};
      if (fx.effortSlider === false) {
        removeBar();
        return;
      }
      var panel = document.querySelector('[data-testid="model-selector-panel"]');
      if (!panel) {
        if (mountedPanel) removeBar();
        return;
      }

      // Host trigger is always the single source of truth so model changes stay in sync
      var host = readHostTrigger();
      if (host.effort) {
        currentEffort = host.effort;
      }

      updateBarDom();
      if (mountedPanel !== panel || barEl.parentElement !== panel) {
        mountedPanel = panel;
        panel.appendChild(barEl);
      }
    }

    function destroy() {
      if (syncTimer) clearTimeout(syncTimer);
      removeBar();
    }

    return {
      sync: sync,
      destroy: destroy
    };
  }

  var api = {
    EFFORT_LEVELS: EFFORT_LEVELS,
    detectEffortFromText: detectEffortFromText,
    extractModelFamily: extractModelFamily,
    itemMatchesEffort: itemMatchesEffort,
    createEffortSliderController: createEffortSliderController
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_EFFORT_SLIDER__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
