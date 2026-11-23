(function (globalScope) {
  'use strict';

  var EFFORT_LEVELS = [
    { id: 'low', labelZh: '低', labelEn: 'Low', keywords: ['low', 'minimal', 'lite', '低'] },
    { id: 'medium', labelZh: '中', labelEn: 'Medium', keywords: ['medium', 'med', '中'] },
    { id: 'high', labelZh: '高', labelEn: 'High', keywords: ['high', 'thinking', '高', '深度思考'] },
    { id: 'xhigh', labelZh: '极高', labelEn: 'xHigh', keywords: ['xhigh', 'extra', 'max', '极高', '超高'] }
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
      '.ags-effort-btn { border:none; background:transparent; color:var(--ags-text-secondary, #94a3b8); font-size:11px; font-weight:500; padding:4px 2px; border-radius:6px; cursor:pointer; transition:all 120ms ease; }',
      '.ags-effort-btn:hover { color:var(--ags-text-primary, #f4f4f5); }',
      '.ags-effort-btn.active { background:var(--ags-accent-soft, rgba(217,119,87,.16)); color:var(--ags-accent, #D97757); font-weight:600; }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function detectEffortFromText(text) {
    var low = String(text || '').toLowerCase();
    for (var i = EFFORT_LEVELS.length - 1; i >= 0; i--) {
      var lvl = EFFORT_LEVELS[i];
      for (var k = 0; k < lvl.keywords.length; k++) {
        if (low.indexOf(lvl.keywords[k]) !== -1) return lvl.id;
      }
    }
    return 'medium';
  }

  function createEffortSliderController(options) {
    if (typeof document === 'undefined') {
      return { sync: function () {}, destroy: function () {} };
    }
    ensureEffortStyles();
    var opts = options || {};
    var barEl = null;
    var currentEffort = 'medium';

    function isZh() {
      var cfg = typeof opts.getConfig === 'function' ? opts.getConfig() : {};
      var lang = (cfg && cfg.i18n && cfg.i18n.language) || 'zh-CN';
      return lang !== 'en';
    }

    function tryApplyEffortToMenu(panel, levelId) {
      var lvl = EFFORT_LEVELS.find(function (l) { return l.id === levelId; });
      if (!lvl || !panel) return;
      // 1. Check dedicated host effort group buttons if rendered inside panel
      var effortBtns = panel.querySelectorAll('[data-testid="model-selector-effort-group"] button, [role="radio"], [role="menuitem"]');
      for (var i = 0; i < effortBtns.length; i++) {
        var btn = effortBtns[i];
        if (btn.closest('.ags-effort-bar')) continue;
        var txt = String(btn.textContent || btn.getAttribute('aria-label') || '').toLowerCase().trim();
        for (var k = 0; k < lvl.keywords.length; k++) {
          if (txt === lvl.keywords[k] || txt.indexOf('(' + lvl.keywords[k] + ')') !== -1 || txt.indexOf('（' + lvl.keywords[k] + '）') !== -1) {
            try { btn.click(); } catch (_e) {}
            return;
          }
        }
      }
    }

    function renderBar(panel) {
      if (!barEl) {
        barEl = document.createElement('div');
        barEl.className = 'ags-effort-bar';
        barEl.setAttribute('data-ag-studio-ignore', 'true');
        barEl.setAttribute('data-ag-no-i18n', 'true');
      }
      var zh = isZh();
      var activeLvl = EFFORT_LEVELS.find(function (l) { return l.id === currentEffort; }) || EFFORT_LEVELS[1];

      barEl.innerHTML = [
        '<div class="ags-effort-head">',
        '  <span class="ags-effort-title">' + (zh ? '推理等级' : 'Reasoning Effort') + '</span>',
        '  <span class="ags-effort-val">' + (zh ? activeLvl.labelZh : activeLvl.labelEn) + '</span>',
        '</div>',
        '<div class="ags-effort-steps">',
        EFFORT_LEVELS.map(function (l) {
          return '<button type="button" class="ags-effort-btn ' + (l.id === currentEffort ? 'active' : '') +
            '" data-effort="' + l.id + '">' + (zh ? l.labelZh : l.labelEn) + '</button>';
        }).join(''),
        '</div>'
      ].join('');

      barEl.querySelectorAll('[data-effort]').forEach(function (btn) {
        btn.addEventListener('click', function (ev) {
          ev.stopPropagation();
          var nextId = btn.getAttribute('data-effort');
          currentEffort = nextId;
          try { localStorage.setItem('ag-studio:effort', nextId); } catch (_e) {}
          if (typeof opts.onChangeEffort === 'function') opts.onChangeEffort(nextId);
          tryApplyEffortToMenu(panel, nextId);
          renderBar(panel);
        });
      });
    }

    function removeBar() {
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
        removeBar();
        return;
      }

      if (fx.reasoningEffort) {
        currentEffort = fx.reasoningEffort;
      } else {
        var trig = document.querySelector('[data-testid="model-selector-trigger"]');
        if (trig) {
          currentEffort = detectEffortFromText(trig.getAttribute('aria-label') || trig.textContent);
        } else {
          try {
            var saved = localStorage.getItem('ag-studio:effort');
            if (saved) currentEffort = saved;
          } catch (_e) {}
        }
      }

      renderBar(panel);
      if (barEl.parentElement !== panel) {
        panel.appendChild(barEl);
      }
    }

    function destroy() {
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
    createEffortSliderController: createEffortSliderController
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_EFFORT_SLIDER__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
