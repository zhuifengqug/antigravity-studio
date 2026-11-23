// Built by scripts/build-renderer.js — Antigravity Studio Renderer Bundle

(function (globalScope) {
  'use strict';

  var PRESET_THEMES = {
    claude: {
      id: 'claude',
      name: 'Claude',
      subtitle: '暖纸陶橙 · 桌面编辑部美学',
      isPreset: true,
      light: {
        bgCanvas: '#FAF9F5',
        bgSidebar: '#F4F1EA',
        bgSurface: '#FFFFFF',
        bgSubtle: '#EFECE4',
        accent: '#D97757',
        accentHover: '#C56444',
        accentSoft: 'rgba(217, 119, 87, 0.12)',
        textPrimary: '#1F1E1D',
        textSecondary: '#6E6B64',
        border: '#E6E2D8',
        codeBg: '#F2EFE9',
        success: '#2E7D5B',
        warning: '#D9822B',
        danger: '#C94A4A'
      },
      dark: {
        bgCanvas: '#141413',
        bgSidebar: '#1B1A18',
        bgSurface: '#22211E',
        bgSubtle: '#2A2824',
        accent: '#E08666',
        accentHover: '#EA987A',
        accentSoft: 'rgba(224, 134, 102, 0.16)',
        textPrimary: '#F0ECE4',
        textSecondary: '#A6A197',
        border: '#32302B',
        codeBg: '#1A1917',
        success: '#4CAF84',
        warning: '#E5A04D',
        danger: '#E06C6C'
      }
    },
    antigravity: {
      id: 'antigravity',
      name: 'Antigravity',
      subtitle: '星轨极光 · 澄澈未来感',
      isPreset: true,
      light: {
        bgCanvas: '#F6F8FC',
        bgSidebar: '#EDF1F9',
        bgSurface: '#FFFFFF',
        bgSubtle: '#E7ECF7',
        accent: '#3B6CF6',
        accentHover: '#2958DF',
        accentSoft: 'rgba(59, 108, 246, 0.11)',
        textPrimary: '#0F172A',
        textSecondary: '#52607A',
        border: '#DCE3F2',
        codeBg: '#EEF2FA',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626'
      },
      dark: {
        bgCanvas: '#0B0F19',
        bgSidebar: '#111726',
        bgSurface: '#161E31',
        bgSubtle: '#1D2740',
        accent: '#60A5FA',
        accentHover: '#7CB6FC',
        accentSoft: 'rgba(96, 165, 250, 0.15)',
        textPrimary: '#E8EEF9',
        textSecondary: '#8D9BB8',
        border: '#25314B',
        codeBg: '#0F1524',
        success: '#34D399',
        warning: '#FBBF24',
        danger: '#F87171'
      }
    }
  };

  function hexToRgb(hex) {
    var s = String(hex || '').replace('#', '').trim();
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
    return {
      r: parseInt(s.slice(0, 2), 16),
      g: parseInt(s.slice(2, 4), 16),
      b: parseInt(s.slice(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    var clamp = function (n) { return Math.max(0, Math.min(255, Math.round(n))); };
    return '#' + [clamp(r), clamp(g), clamp(b)].map(function (v) {
      var h = v.toString(16);
      return h.length === 1 ? '0' + h : h;
    }).join('').toUpperCase();
  }

  function deriveAccentTokens(accentHex, isDark) {
    var rgb = hexToRgb(accentHex) || { r: 217, g: 119, b: 87 };
    var delta = isDark ? 24 : -20;
    return {
      accent: rgbToHex(rgb.r, rgb.g, rgb.b),
      accentHover: rgbToHex(rgb.r + delta, rgb.g + delta, rgb.b + delta),
      accentSoft: 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + (isDark ? '0.16' : '0.12') + ')'
    };
  }

  function detectSystemDark() {
    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch (_e) {}
    return true;
  }

  function resolveEffectiveMode(colorMode) {
    if (colorMode === 'light') return 'light';
    if (colorMode === 'dark') return 'dark';
    return detectSystemDark() ? 'dark' : 'light';
  }

  function getAllThemes(themeConfig) {
    var customs = Array.isArray(themeConfig && themeConfig.customThemes) ? themeConfig.customThemes : [];
    return [PRESET_THEMES.claude, PRESET_THEMES.antigravity].concat(customs);
  }

  function resolveActivePalette(themeConfig) {
    var cfg = themeConfig || {};
    var all = getAllThemes(cfg);
    var active = all.find(function (t) { return t.id === cfg.activePreset; }) || PRESET_THEMES.claude;
    var mode = resolveEffectiveMode(cfg.colorMode || 'system');
    var palette = active[mode] || active.dark || PRESET_THEMES.claude.dark;
    return {
      theme: active,
      mode: mode,
      palette: palette
    };
  }

  function cloneThemeAsCustom(baseId, newName) {
    var base = PRESET_THEMES[baseId] || PRESET_THEMES.claude;
    var id = 'custom_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    return {
      id: id,
      name: String(newName || (base.name + ' Custom')).trim(),
      subtitle: '自定义配色',
      isPreset: false,
      light: Object.assign({}, base.light),
      dark: Object.assign({}, base.dark)
    };
  }

  function buildThemeCss(themeConfig) {
    var resolved = resolveActivePalette(themeConfig);
    var p = resolved.palette;
    var isDark = resolved.mode === 'dark';
    var editorialSerif = !(themeConfig && themeConfig.editorialSerif === false);

    return [
      ':root {',
      '  --ags-bg-canvas: ' + p.bgCanvas + ';',
      '  --ags-bg-sidebar: ' + p.bgSidebar + ';',
      '  --ags-bg-surface: ' + p.bgSurface + ';',
      '  --ags-bg-subtle: ' + p.bgSubtle + ';',
      '  --ags-accent: ' + p.accent + ';',
      '  --ags-accent-hover: ' + p.accentHover + ';',
      '  --ags-accent-soft: ' + p.accentSoft + ';',
      '  --ags-text-primary: ' + p.textPrimary + ';',
      '  --ags-text-secondary: ' + p.textSecondary + ';',
      '  --ags-border: ' + p.border + ';',
      '  --ags-code-bg: ' + p.codeBg + ';',
      '  --ags-success: ' + p.success + ';',
      '  --ags-warning: ' + p.warning + ';',
      '  --ags-danger: ' + p.danger + ';',
      '  --ags-shadow: ' + (isDark ? '0 16px 40px rgba(0,0,0,0.45)' : '0 16px 40px rgba(15,23,42,0.10)') + ';',
      '}',
      'html, body, #root {',
      '  background-color: var(--ags-bg-canvas) !important;',
      '  color: var(--ags-text-primary) !important;',
      '  font-family: var(--ags-font-ui, system-ui, -apple-system, sans-serif);',
      '}',
      'aside, nav, [class*="sidebar"], [class*="Sidebar"] {',
      '  background-color: var(--ags-bg-sidebar);',
      '  border-color: var(--ags-border);',
      '}',
      '.agy-home {',
      '  background-color: var(--ags-bg-canvas);',
      '}',
      '[data-testid="agent-input-box"] .surface-composer-card, .surface-composer-card {',
      '  background-color: var(--ags-bg-surface);',
      '  border-color: var(--ags-border);',
      '  transition: border-color 150ms ease, box-shadow 150ms ease;',
      '}',
      '[data-testid="agent-input-box"] .surface-composer-card:focus-within, .surface-composer-card:focus-within {',
      '  border-color: var(--ags-accent);',
      '  box-shadow: 0 0 0 1px var(--ags-accent-soft);',
      '}',
      '[data-testid="model-selector-panel"], [role="dialog"] {',
      '  background-color: var(--ags-bg-surface);',
      '  border-color: var(--ags-border);',
      '  color: var(--ags-text-primary);',
      '}',
      (editorialSerif
        ? '.prose, [class*="markdown"], [class*="Markdown"], [data-markdown-root] { font-family: var(--ags-font-body, Georgia, "Noto Serif SC", serif); line-height: 1.68; }'
        : ''),
      'pre, code, kbd, samp, .monaco-editor, .xterm { font-family: var(--ags-font-code, "JetBrains Mono", Consolas, monospace); }',
      'pre:not(.monaco-editor pre) { background-color: var(--ags-code-bg); border: 1px solid var(--ags-border); border-radius: 8px; }',
      'button[data-variant="primary"], [class*="primaryButton"] { background-color: var(--ags-accent); border-color: var(--ags-accent); }',
      '::-webkit-scrollbar { width: 8px; height: 8px; }',
      '::-webkit-scrollbar-thumb { background: var(--ags-border); border-radius: 99px; }',
      '::-webkit-scrollbar-track { background: transparent; }'
    ].join('\n');
  }

  function applyThemeToDocument(themeConfig) {
    if (typeof document === 'undefined') return null;
    var styleId = 'ag-studio-theme-style';
    var styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      (document.head || document.documentElement).appendChild(styleEl);
    }
    var resolved = resolveActivePalette(themeConfig);
    styleEl.textContent = buildThemeCss(themeConfig);
    if (document.documentElement) {
      document.documentElement.setAttribute('data-ags-theme', resolved.theme.id);
      document.documentElement.setAttribute('data-ags-mode', resolved.mode);
    }
    return resolved;
  }

  var api = {
    PRESET_THEMES: PRESET_THEMES,
    deriveAccentTokens: deriveAccentTokens,
    resolveEffectiveMode: resolveEffectiveMode,
    getAllThemes: getAllThemes,
    resolveActivePalette: resolveActivePalette,
    cloneThemeAsCustom: cloneThemeAsCustom,
    buildThemeCss: buildThemeCss,
    applyThemeToDocument: applyThemeToDocument
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_THEMES__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);


(function (globalScope) {
  'use strict';

  var FONT_PRESETS = {
    ui: {
      system: 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      inter: '"Inter", system-ui, -apple-system, "PingFang SC", sans-serif',
      noto: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'
    },
    body: {
      'serif-editorial': '"Newsreader", Georgia, "Noto Serif SC", "Songti SC", serif',
      'sans-clean': 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
      'georgia': 'Georgia, Cambria, "Times New Roman", "Noto Serif SC", serif'
    },
    code: {
      jetbrains: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace',
      cascadia: '"Cascadia Code", "Cascadia Mono", Consolas, monospace',
      system: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    }
  };

  function resolveFontStack(track, choice, customFamily) {
    if (customFamily && String(customFamily).trim()) {
      return '"' + String(customFamily).trim().replace(/"/g, '') + '", ' + (FONT_PRESETS[track].system || FONT_PRESETS[track]['serif-editorial'] || FONT_PRESETS[track].jetbrains);
    }
    var group = FONT_PRESETS[track] || {};
    return group[choice] || choice || Object.values(group)[0];
  }

  function applyTypographyToDocument(themeConfig, scannedFonts) {
    if (typeof document === 'undefined') return;
    var fonts = (themeConfig && themeConfig.fonts) || {};
    var rules = [];

    if (Array.isArray(scannedFonts)) {
      for (var i = 0; i < scannedFonts.length; i++) {
        var f = scannedFonts[i];
        if (!f || !f.dataUrl || !f.family) continue;
        rules.push(
          '@font-face { font-family: "' + f.family.replace(/"/g, '') + '"; src: url("' + f.dataUrl + '") format("' + (f.format || 'truetype') + '"); font-display: swap; }'
        );
      }
    }

    var uiStack = resolveFontStack('ui', fonts.ui || 'system', fonts.customUiFont);
    var bodyStack = resolveFontStack('body', fonts.body || 'serif-editorial', fonts.customBodyFont);
    var codeStack = resolveFontStack('code', fonts.code || 'jetbrains', fonts.customCodeFont);

    rules.push(
      ':root { --ags-font-ui: ' + uiStack + '; --ags-font-body: ' + bodyStack + '; --ags-font-code: ' + codeStack + '; }'
    );

    var styleId = 'ag-studio-typography-style';
    var styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      (document.head || document.documentElement).appendChild(styleEl);
    }
    styleEl.textContent = rules.join('\n');
  }

  var api = {
    FONT_PRESETS: FONT_PRESETS,
    resolveFontStack: resolveFontStack,
    applyTypographyToDocument: applyTypographyToDocument
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_TYPOGRAPHY__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);


(function (globalScope) {
  'use strict';

  var UUID_RE = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  var ROUTE_UUID_RE = /\/c\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:[/?#]|$)/i;

  var SUBAGENT_SEL = '[data-testid="subagent-tab-conversation"]';
  var CONV_VIEW_SEL = '[data-testid="conversation-view"]';
  var INPUT_BOX_SEL = '[data-testid="agent-input-box"]';
  var COMPOSER_CARD_SEL = '[data-testid="agent-input-box"] .surface-composer-card, .surface-composer-card';
  var RUNNING_SEL = [
    '[data-testid="input-cancel-button"]',
    '[data-testid="stop-button"]',
    '[data-testid="cancel-button"]',
    '[data-testid="agent-loading"]',
    '[data-testid="thinking-collapsible-trigger"][data-op-thought-state="streaming"]'
  ].join(', ');
  var DECISION_SEL = '[data-testid="interaction-takeover-card"], [data-testid="side-question-panel"]';
  var ERROR_SEL = '[data-testid="agent-error"], [role="alert"][data-error="true"]';

  function isOwnNode(el) {
    if (!el || !el.closest) return false;
    return Boolean(
      el.id === 'ag-studio-root' ||
      el.hasAttribute('data-ag-studio-ignore') ||
      el.closest('#ag-studio-root, [data-ag-studio-ignore]')
    );
  }

  function isVisible(el) {
    if (!el || el.isConnected === false || el.hidden) return false;
    if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return false;
    var cls = typeof el.className === 'string' ? el.className : '';
    if (/(?:^|\s)(?:hidden|sr-only)(?:\s|$)/.test(cls)) return false;
    if (el.style && (el.style.display === 'none' || el.style.visibility === 'hidden')) return false;
    if (typeof el.checkVisibility === 'function') {
      try { if (!el.checkVisibility()) return false; } catch (_e) {}
    }
    if (typeof el.getBoundingClientRect === 'function') {
      var r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) return false;
    }
    return true;
  }

  function readFiberCascadeId(el, maxDepth) {
    if (!el) return '';
    try {
      var keys = Object.keys(el);
      var fiberKey = null;
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('__reactFiber$') === 0) {
          fiberKey = keys[i];
          break;
        }
      }
      var f = fiberKey ? el[fiberKey] : null;
      var depth = 0;
      while (f && depth < (maxDepth || 50)) {
        var props = f.memoizedProps || f.pendingProps;
        if (props && typeof props.cascadeId === 'string' && UUID_RE.test(props.cascadeId)) {
          return props.cascadeId.match(UUID_RE)[1];
        }
        if (props && props.store && typeof props.store.getState === 'function') {
          var st = props.store.getState();
          var cs = st && st.conversation && st.conversation.convoState;
          if (cs && cs.type === 'active' && typeof cs.cascadeId === 'string' && UUID_RE.test(cs.cascadeId)) {
            return cs.cascadeId.match(UUID_RE)[1];
          }
          if (cs && cs.type === 'subagent' && typeof cs.childConversationId === 'string' && UUID_RE.test(cs.childConversationId)) {
            return cs.childConversationId.match(UUID_RE)[1];
          }
        }
        f = f.return;
        depth++;
      }
    } catch (_e) {}
    return '';
  }

  function readReduxConvoId() {
    if (typeof document === 'undefined') return '';
    var anchors = document.querySelectorAll(
      CONV_VIEW_SEL + ', ' + INPUT_BOX_SEL + ', [data-testid="conversation-row-sidebar"], [data-testid="home-greeting"]'
    );
    for (var i = 0; i < anchors.length; i++) {
      var el = anchors[i];
      try {
        var keys = Object.keys(el);
        var fk = null;
        for (var j = 0; j < keys.length; j++) {
          if (keys[j].indexOf('__reactFiber$') === 0) { fk = keys[j]; break; }
        }
        var f = fk ? el[fk] : null;
        var depth = 0;
        while (f && depth < 60) {
          var p = f.memoizedProps;
          if (p && p.store && typeof p.store.getState === 'function') {
            var st = p.store.getState();
            var cs = st && st.conversation && st.conversation.convoState;
            if (cs && cs.type === 'active' && cs.cascadeId) return String(cs.cascadeId);
            if (cs && cs.type === 'subagent' && cs.childConversationId) return String(cs.childConversationId);
          }
          var dep = f.dependencies && f.dependencies.firstContext;
          while (dep) {
            var mv = dep.memoizedValue;
            if (mv && mv.store && typeof mv.store.getState === 'function') {
              var st2 = mv.store.getState();
              var cs2 = st2 && st2.conversation && st2.conversation.convoState;
              if (cs2 && cs2.type === 'active' && cs2.cascadeId) return String(cs2.cascadeId);
              if (cs2 && cs2.type === 'subagent' && cs2.childConversationId) return String(cs2.childConversationId);
            }
            dep = dep.next;
          }
          f = f.return;
          depth++;
        }
      } catch (_e) {}
    }
    return '';
  }

  function findFormalConvView() {
    if (typeof document === 'undefined') return null;
    var views = document.querySelectorAll(CONV_VIEW_SEL);
    for (var i = 0; i < views.length; i++) {
      var cv = views[i];
      if (isOwnNode(cv)) continue;
      if (cv.closest && cv.closest(SUBAGENT_SEL)) continue;
      if (cv.closest && cv.closest('.agy-home')) continue;
      if (cv.querySelector && cv.querySelector('.agy-home')) continue;
      return cv;
    }
    return null;
  }

  function extractConversationId() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null;
    try {
      var urlCandidates = [
        window.location && window.location.pathname,
        window.location && window.location.hash,
        window.location && window.location.search,
        window.location && window.location.href
      ];
      for (var i = 0; i < urlCandidates.length; i++) {
        var s = String(urlCandidates[i] || '');
        var rm = s.match(ROUTE_UUID_RE);
        if (rm && rm[1]) return rm[1];
      }
      var cv = findFormalConvView();
      if (cv) {
        var attrId = cv.getAttribute && cv.getAttribute('data-cascade-id');
        if (attrId && attrId !== 'conversation' && UUID_RE.test(attrId)) {
          return attrId.match(UUID_RE)[1];
        }
        var fibId = readFiberCascadeId(cv, 40);
        if (fibId) return fibId;
      }
      var comp = findComposerTarget();
      if (comp && comp.inputBox && !comp.isHome) {
        var inpFib = readFiberCascadeId(comp.inputBox, 60);
        if (inpFib) return inpFib;
      }
      for (var j = 0; j < urlCandidates.length; j++) {
        var s2 = String(urlCandidates[j] || '');
        var um = s2.match(UUID_RE);
        if (um && um[1]) return um[1];
      }
      if (!detectHomeState().isHome) {
        var reduxId = readReduxConvoId();
        if (reduxId && UUID_RE.test(reduxId)) return reduxId.match(UUID_RE)[1];
      }
    } catch (_e) {}
    return null;
  }

  function detectHomeState() {
    if (typeof document === 'undefined') return { isHome: false, homeRoot: null, greetingEl: null };
    var homeRoot = document.querySelector('.agy-home');
    var greetingEl = document.querySelector('[data-testid="home-greeting"]');
    var formalCv = findFormalConvView();
    var hasMessages = Boolean(
      document.querySelector('[data-testid="agent-response"], [data-testid="user-message"], [data-testid="planner-response-text"]')
    );
    var urlPath = (typeof window !== 'undefined' && window.location && window.location.pathname) || '';
    var hasConvUrl = ROUTE_UUID_RE.test(urlPath);
    var isHome = Boolean((homeRoot || greetingEl) && !formalCv && !hasMessages && !hasConvUrl);
    return {
      isHome: isHome,
      homeRoot: homeRoot || (greetingEl ? greetingEl.closest('main, section, div') : null),
      greetingEl: greetingEl
    };
  }

  function findComposerTarget() {
    if (typeof document === 'undefined') return null;

    // 1. Primary Antigravity 2.34 .surface-composer-card inside [data-testid="agent-input-box"]
    var cards = document.querySelectorAll(COMPOSER_CARD_SEL);
    var chosenCard = null;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (isOwnNode(c)) continue;
      if (c.closest && c.closest(SUBAGENT_SEL)) continue;
      if (!isVisible(c)) continue;
      chosenCard = c;
      break;
    }

    if (chosenCard) {
      var ib = chosenCard.closest(INPUT_BOX_SEL) || chosenCard;
      var ed = ib.querySelector('[contenteditable="true"], textarea');
      return {
        card: chosenCard,
        inputBox: ib,
        editable: ed || null,
        isHome: Boolean(chosenCard.closest('.agy-home')),
        isSubagent: false
      };
    }

    // 2. Fallback: [data-testid="agent-input-box"]
    var boxes = document.querySelectorAll(INPUT_BOX_SEL);
    for (var j = 0; j < boxes.length; j++) {
      var box = boxes[j];
      if (isOwnNode(box)) continue;
      if (box.closest && box.closest(SUBAGENT_SEL)) continue;
      if (!isVisible(box)) continue;
      var ed2 = box.querySelector('[contenteditable="true"], textarea');
      var card2 = box.querySelector('.surface-composer-card') || (ed2 && ed2.closest('form')) || box;
      return {
        card: card2,
        inputBox: box,
        editable: ed2 || null,
        isHome: Boolean(box.closest('.agy-home')),
        isSubagent: false
      };
    }

    // 3. Generic fallback: visible contenteditable/textarea composer
    var inputs = document.querySelectorAll('[contenteditable="true"][role="textbox"], [contenteditable="true"], textarea');
    for (var k = 0; k < inputs.length; k++) {
      var inp = inputs[k];
      if (isOwnNode(inp)) continue;
      if (inp.closest && inp.closest(SUBAGENT_SEL)) continue;
      if (inp.closest && inp.closest('.monaco-editor, [role="dialog"]')) continue;
      if (!isVisible(inp)) continue;
      var rect = inp.getBoundingClientRect ? inp.getBoundingClientRect() : null;
      if (rect && rect.width > 180 && rect.height >= 20) {
        var outer = inp.closest('.surface-composer-card, [data-testid="agent-input-box"], form') || inp.parentElement;
        if (!outer) continue;
        return {
          card: outer,
          inputBox: outer,
          editable: inp,
          isHome: Boolean(outer.closest('.agy-home')),
          isSubagent: false
        };
      }
    }

    return null;
  }

  function ensureComposerTopAnchor(composer) {
    if (!composer || !composer.card || composer.card.isConnected === false) return null;
    var anchor = composer.card;
    try {
      var pos = typeof getComputedStyle === 'function' ? getComputedStyle(anchor).position : '';
      if (!pos || pos === 'static') {
        anchor.style.position = 'relative';
      }
      anchor.setAttribute('data-ags-mascot-anchor', '1');
    } catch (_e) {}
    return anchor;
  }

  function ensureComposerBottomSlot(composer) {
    if (typeof document === 'undefined' || !composer) return null;
    var refEl = composer.inputBox || composer.card;
    if (!refEl || !refEl.parentElement) return null;

    var slot = document.getElementById('ag-studio-composer-bottom');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'ag-studio-composer-bottom';
      slot.setAttribute('data-ag-studio-ignore', 'true');
      slot.setAttribute('data-ag-no-i18n', 'true');
      slot.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;margin-top:6px;pointer-events:none;z-index:30;';
    }
    if (slot.parentElement !== refEl.parentElement || slot.previousElementSibling !== refEl) {
      if (refEl.nextSibling) {
        refEl.parentElement.insertBefore(slot, refEl.nextSibling);
      } else {
        refEl.parentElement.appendChild(slot);
      }
    }
    slot.style.display = 'flex';
    return slot;
  }

  function parkComposerBottomSlot() {
    if (typeof document === 'undefined') return;
    var slot = document.getElementById('ag-studio-composer-bottom');
    if (slot) {
      slot.style.display = 'none';
    }
  }

  function ensureHomeCardSlot() {
    if (typeof document === 'undefined') return null;
    var homeInfo = detectHomeState();
    if (!homeInfo.isHome) {
      parkHomeCardSlot();
      return null;
    }

    var slot = document.getElementById('ag-studio-home-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'ag-studio-home-slot';
      slot.setAttribute('data-ag-studio-ignore', 'true');
      slot.setAttribute('data-ag-no-i18n', 'true');
      slot.style.cssText = 'width:100%;max-width:740px;margin:14px auto 8px auto;padding:0 12px;box-sizing:border-box;z-index:20;';
    }

    // Prefer placing right below the home composer box (or bottom HUD slot if present inside home)
    var comp = findComposerTarget();
    var anchorAfter = null;
    var parent = null;
    if (comp && comp.isHome) {
      var bottomSlot = document.getElementById('ag-studio-composer-bottom');
      if (bottomSlot && bottomSlot.parentElement && bottomSlot.closest('.agy-home')) {
        anchorAfter = bottomSlot;
        parent = bottomSlot.parentElement;
      } else if (comp.inputBox && comp.inputBox.parentElement) {
        anchorAfter = comp.inputBox;
        parent = comp.inputBox.parentElement;
      }
    }
    if (!parent && homeInfo.greetingEl && homeInfo.greetingEl.parentElement) {
      anchorAfter = homeInfo.greetingEl;
      parent = homeInfo.greetingEl.parentElement;
    }
    if (!parent && homeInfo.homeRoot) {
      parent = homeInfo.homeRoot;
    }
    if (!parent) return null;

    if (anchorAfter) {
      if (slot.parentElement !== parent || slot.previousElementSibling !== anchorAfter) {
        if (anchorAfter.nextSibling) parent.insertBefore(slot, anchorAfter.nextSibling);
        else parent.appendChild(slot);
      }
    } else if (slot.parentElement !== parent) {
      parent.appendChild(slot);
    }

    slot.style.display = 'block';
    return slot;
  }

  function parkHomeCardSlot() {
    if (typeof document === 'undefined') return;
    var slot = document.getElementById('ag-studio-home-slot');
    if (slot && slot.parentElement) {
      slot.style.display = 'none';
    }
  }

  function sniffDomTurnState() {
    if (typeof document === 'undefined') {
      return {
        conversationId: null,
        isHome: false,
        isGenerating: false,
        isThinking: false,
        isToolWorking: false,
        hasSubagent: false,
        awaitingDecision: false,
        hasError: false,
        isModelMenuOpen: false,
        modelLabel: ''
      };
    }

    var homeInfo = detectHomeState();
    var cid = homeInfo.isHome ? null : extractConversationId();

    var isGenerating = false;
    var runNodes = document.querySelectorAll(RUNNING_SEL);
    for (var i = 0; i < runNodes.length; i++) {
      var rn = runNodes[i];
      if (rn.closest && rn.closest(SUBAGENT_SEL)) continue;
      if (isVisible(rn)) { isGenerating = true; break; }
    }

    var isThinking = false;
    var thinkNodes = document.querySelectorAll('[data-testid="thinking-collapsible-trigger"]');
    for (var j = 0; j < thinkNodes.length; j++) {
      var tn = thinkNodes[j];
      if (tn.closest && tn.closest(SUBAGENT_SEL)) continue;
      if (tn.getAttribute('data-op-thought-state') === 'streaming') {
        isThinking = true;
        break;
      }
      if (isGenerating && j === thinkNodes.length - 1) {
        var txt = String(tn.textContent || '').trim();
        if (/(?:\.\.\.|…)\s*$|思考中|正在思考/.test(txt)) {
          isThinking = true;
          break;
        }
      }
    }

    var isToolWorking = false;
    if (isGenerating) {
      var toolNodes = document.querySelectorAll(
        '[data-testid="tool-group-collapsible"], [data-testid="running-items-panel"], [data-testid="background-task-command"]'
      );
      for (var k = 0; k < toolNodes.length; k++) {
        var tool = toolNodes[k];
        if (tool.closest && tool.closest(SUBAGENT_SEL)) continue;
        if (tool.getAttribute('data-testid') === 'running-items-panel') {
          if (String(tool.className || '').indexOf('grid-rows-[1fr]') !== -1 && isVisible(tool)) {
            isToolWorking = true;
            break;
          }
        } else if (isVisible(tool)) {
          isToolWorking = true;
          break;
        }
      }
    }

    var hasSubagent = false;
    var subNodes = document.querySelectorAll(SUBAGENT_SEL + ', [data-testid="subagent-node"]');
    for (var s = 0; s < subNodes.length; s++) {
      if (isVisible(subNodes[s])) { hasSubagent = true; break; }
    }

    var awaitingDecision = false;
    var decNodes = document.querySelectorAll(DECISION_SEL);
    for (var d = 0; d < decNodes.length; d++) {
      var dn = decNodes[d];
      if (dn.closest && dn.closest(SUBAGENT_SEL)) continue;
      if (isVisible(dn)) { awaitingDecision = true; break; }
    }

    var hasError = false;
    var errNodes = document.querySelectorAll(ERROR_SEL);
    for (var e = 0; e < errNodes.length; e++) {
      var en = errNodes[e];
      if (en.closest && en.closest(SUBAGENT_SEL)) continue;
      if (isVisible(en)) { hasError = true; break; }
    }

    var modelTrig = document.querySelector('[data-testid="model-selector-trigger"]');
    var modelLabel = modelTrig ? String(modelTrig.getAttribute('aria-label') || modelTrig.textContent || '').trim() : '';
    var modelPanel = document.querySelector('[data-testid="model-selector-panel"]');
    var isModelMenuOpen = Boolean(modelPanel && isVisible(modelPanel));

    return {
      conversationId: cid,
      isHome: homeInfo.isHome,
      isGenerating: isGenerating,
      isThinking: isThinking,
      isToolWorking: isToolWorking,
      hasSubagent: hasSubagent,
      awaitingDecision: awaitingDecision,
      hasError: hasError,
      isModelMenuOpen: isModelMenuOpen,
      modelLabel: modelLabel
    };
  }

  function fuseTurnState(opts) {
    var o = opts || {};
    var dom = o.dom || {};
    var backend = o.backend || {};
    var now = o.now || Date.now();
    var lastInteractionAt = o.lastInteractionAt || now;
    var lastTypingAt = o.lastTypingAt || 0;
    var sleepTimeoutMs = Number(o.sleepTimeoutMs || 300000);
    var happyUntil = o.happyUntil || 0;

    var hasError = Boolean(dom.hasError || backend.hasError || backend.status === 'error' || backend.status === 'failed');
    var awaitingDecision = Boolean(dom.awaitingDecision || backend.awaitingApproval || backend.state === 'waiting');
    var hasSubagent = Boolean(
      (dom.isGenerating && dom.hasSubagent) ||
      backend.hasRunningSubagents ||
      backend.state === 'subagent'
    );
    var isGenerating = Boolean(dom.isGenerating || backend.isGenerating || backend.state === 'thinking' || backend.state === 'working');
    var isToolWorking = Boolean(dom.isToolWorking || backend.isToolWorking || backend.state === 'working');
    var isThinking = Boolean(dom.isThinking || backend.isThinking || backend.state === 'thinking');
    var isTyping = Boolean(now - lastTypingAt < 1800);

    var mascotState = 'idle';
    if (hasError) mascotState = 'error';
    else if (awaitingDecision) mascotState = 'waiting';
    else if (hasSubagent) mascotState = 'subagent';
    else if (isToolWorking) mascotState = 'working';
    else if (isThinking || isGenerating) mascotState = 'thinking';
    else if (happyUntil > now) mascotState = 'happy';
    else if (isTyping) mascotState = 'typing';
    else if (now - lastInteractionAt > sleepTimeoutMs) mascotState = 'sleeping';

    var auraPhase = 'none';
    if (hasError) auraPhase = 'error';
    else if (awaitingDecision) auraPhase = 'waiting';
    else if (isGenerating || isThinking || isToolWorking || hasSubagent) auraPhase = 'running';
    else if (o.backgroundCompleted) auraPhase = 'complete';

    return {
      mascotState: mascotState,
      auraPhase: auraPhase,
      isGenerating: isGenerating,
      awaitingDecision: awaitingDecision,
      hasError: hasError
    };
  }

  function watchAnchors(onChange) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return function () {};
    }
    var timer = 0;
    var raf = 0;
    var disposed = false;

    function trigger(reason) {
      if (disposed) return;
      if (raf) return;
      var fire = function () {
        raf = 0;
        if (!disposed && typeof onChange === 'function') {
          try { onChange(reason || 'mutation'); } catch (_e) {}
        }
      };
      if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(fire);
      else {
        if (timer) clearTimeout(timer);
        timer = setTimeout(fire, 32);
      }
    }

    var obs = null;
    if (typeof MutationObserver === 'function') {
      obs = new MutationObserver(function (mutations) {
        if (disposed) return;
        var relevant = false;
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (isOwnNode(m.target)) continue;
          if (m.type === 'childList') {
            var allOwn = true;
            var added = m.addedNodes || [];
            var removed = m.removedNodes || [];
            for (var a = 0; a < added.length; a++) {
              if (!isOwnNode(added[a])) { allOwn = false; break; }
            }
            if (allOwn) {
              for (var r = 0; r < removed.length; r++) {
                if (!isOwnNode(removed[r])) { allOwn = false; break; }
              }
            }
            if (!allOwn) { relevant = true; break; }
          } else {
            relevant = true;
            break;
          }
        }
        if (relevant) trigger('dom');
      });
      if (document.body || document.documentElement) {
        obs.observe(document.body || document.documentElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['data-cascade-id', 'data-op-thought-state', 'hidden', 'class', 'aria-expanded']
        });
      }
    }

    var onPop = function () { trigger('route'); };
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);

    var origPush = window.history && window.history.pushState;
    var origReplace = window.history && window.history.replaceState;
    if (typeof origPush === 'function') {
      window.history.pushState = function () {
        var r = origPush.apply(this, arguments);
        trigger('pushState');
        return r;
      };
    }
    if (typeof origReplace === 'function') {
      window.history.replaceState = function () {
        var r = origReplace.apply(this, arguments);
        trigger('replaceState');
        return r;
      };
    }

    return function dispose() {
      disposed = true;
      if (obs) try { obs.disconnect(); } catch (_e) {}
      if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
      if (origPush && window.history) window.history.pushState = origPush;
      if (origReplace && window.history) window.history.replaceState = origReplace;
    };
  }

  var api = {
    extractConversationId: extractConversationId,
    detectHomeState: detectHomeState,
    findComposerTarget: findComposerTarget,
    ensureComposerTopAnchor: ensureComposerTopAnchor,
    ensureComposerBottomSlot: ensureComposerBottomSlot,
    parkComposerBottomSlot: parkComposerBottomSlot,
    ensureHomeCardSlot: ensureHomeCardSlot,
    parkHomeCardSlot: parkHomeCardSlot,
    sniffDomTurnState: sniffDomTurnState,
    fuseTurnState: fuseTurnState,
    watchAnchors: watchAnchors
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_ANCHORS__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);


// Auto-generated by scripts/build-mascot-assets.js — Do not edit manually.
(function (globalScope) {
  'use strict';
  var SPRITES = {"version":1,"crabFrameMs":80,"deepyFrameMs":90,"crab":{"idle":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAAwCAYAAABHTnUeAAAA+ElEQVR42u3bsQ3CQAwF0H+IXRgigzAKMzBEBmCHLMI0UNGcBAGl4BS/VwL6FVaMjVs698v5kQ1O11v79L58+SPlHwKFvS2AaV4yzctqwLefky9/xHxPAEprW3sq2GULBAoAFADs+DdAzInlxx4AtECgAKCQ41qv9Oq5+t6pf/3X3ky+/BHyPQHQAoECgNgDmBPLjz0AuAfwf3H57gHAPQCYAoECAAUA9gAxh5YfewDQAoECgLgH8H90+XEPAFogUAAQewD58mMPAO4B5NfgHoASXyD3AGAKBAoAFADYA8QcWn7sAUALBAoA4h5Avvy4BwAtECgA+LcnkKN/7mnIqCwAAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAAwCAYAAABHTnUeAAAAOklEQVR42u3BMQEAAADCoPVP7W8GoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgDeQMAABeOTGmAAAAABJRU5ErkJggg==","frames":24,"columns":8,"box":[24,20,24,16],"still":0},"idle-look":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAABACAYAAABMbHjfAAABSUlEQVR42u3dwY3CMBAF0B9ELxSRQiiFGigiBdBDGqEaOOViCQJERE783nFZfYlII088tuhSuF/Ojyxwut66d5/Ll19T/iHQsJcF0A9j+mGcDfj0/+R7NjXmWwFoWre0p4JdtkCgAEABwI7fAWKfWH7MAUALBAoAGnKc65Wmnqvsncq/f9ubyZdfQ74VAC0QKACIOYB9YvkxB4CWWyDnxeUvyd/Sd7AC4D6Ax4AWCBQAKAAwB4h9YvkxBwAtECgAiPsAzqPLj/sAoAUCBQAxB7APLT/mAOD3AeJcvfwN5VsBcB/AY0ALBAoAFACYA8Q+sfyYA4AWCBQAxH0A59Hlx30A0AKBAoCYA9iHlr9SvhUA1ioA58U9m5p/g8AKAO4DsGf/fiewAuAdABQAmAPYh5YfcwDQAoECgLgP4Dy6/NryrQCgAEABwM+e2Uo8TK1/jy4AAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAABACAYAAABMbHjfAAAAR0lEQVR42u3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4N8AwEAAAWSBsuAAAAAASUVORK5CYII=","frames":31,"columns":8,"box":[24,20,24,16],"still":0},"idle-wave":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAAqCAYAAADlA1TjAAABJ0lEQVR42u3cyw3CMAwAUBd1F4bgyg4MwBDMwBAMwA5cGYJp4ISE+JVKLamb925IlRVVMXGauk3wV5fd5vr4e7k/NsZfbvwLU5KaSQCq1roFSpSaxy8BCsk2Mec6/rYrA4e+MVOP3/cfSvzc8VslCvYAb6wOp4iIOG/XXwP8el22+F2JZfzzGL+nQFStGbtmy765G/r+iD+t+IvME1X9T3WbYJOecBIMA+0BwjmA+BXHtwKgBAIJAOEp0EutdK+5Pj2ffb6uby0mvvgl41sBUAKBBAAAAKLGVyFCxxY2wRB1HoRNval57i97oR9AiUX+pvjsTdml42MPAJGuKX7spubwhTisAJri0RQP9gCgKT6cA2AFAAkAEgBCU3zq+FgBQAKABICR3AAtroMyqwB90gAAAABJRU5ErkJggg==","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAAqCAYAAADlA1TjAAAANklEQVR42u3BMQEAAADCoPVPbQZ/oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4DH4qAAH4CjvkAAAAAElFTkSuQmCC","frames":12,"columns":8,"box":[24,15,24,21],"still":0},"idle-laptop":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARAAAACKCAYAAABigBWEAAAFPElEQVR42u3dv20cRxQH4HeH7UEKlbEIBk4MsASnBlyEa2ARBJiyBANMGLgIZwqlKuRopeOC93/m5u3M9wFMhJP4087tu9nZ2zcRAAAAAAAAACSyufQv/vf3Hz+u+cV3jy+bEv8BOXLmYAyTQ0ANCuoYObbXBrp/eo37p9dir5OjrxyYgUDzGUyrSys5DufY3GrqU2qKJkfOHLVzyZEzxzagoiyXSHLUyeEShhRv5tm/f/0ux4pyKCBUvfNyygnw0WtKX+O3yDHC8ZguveZqdVtKjpw5erqF7JZ6WAMB6lNAiNZ3BhwPBQR+njStT5xMJ27vx2MqFW6+ztp3Tb58Xa2DJEeuHK1PGushdY+HuzDc9I2rsPeVwyUMYA0EAAAAICq0NASiu/4q5/YdsYgKhLswQPGH6Y79XZcwWt2hgBz09fu3iIh4eH7bdPdNVF235ZAj1tdUWd8JYOplxjG3XzvWaenU18WVbeDkIAZ4sHAafQ2h1Ayq1VOfWXIoqHVzlDpfSh+Hbp7GPXXAa3/SyuEDZqQ2Alc3jC1Vse2D0keO2o+fr+V4ZHyfXprp0F2Y7S33oCixD4XFV5+6RD+LqC3a1N89vmy8WSPlupBxGau/6rTWTxgt65wwFtndxvVG7SRHlhMky1pUeBYGoGABUY2Bqy5hsq496LrdNsep/75xaZ/jkgzzrdxu94WBkRYvrYEACggAAAAAAAAAAAAxVkvDc78avPwO/Udt0YDo/2G6f/787cda2+fVKmRyyDFyjumcX77viTwgPAtzSuU61hy5VPNkwMN0UbvTe+tCJoccI+fYXnpNBDCdWzyObeNwq53OWuY4Z0GqVo7lgvaXT5+Ni3G5+bhMa5p56C4VNpQi1bgcLSDL2zet3iyZbiFncezTzbgYl+YFxKcLYGOpqNO4V4E1LgpIxW7s8yVQiSnV7npMq2lilin7w/Nbmn1ojcu447KaGci+tZgWhSxLQc2Qw7iMPS7bUiu8+6ru8s9LD9DIOe4eXzbzj+NhXFocj+05B2N5UA5td7n889JP4bbK8fD8ttn9Gf14GBfjAgAAAAAAAAAAQNgXJrSpl0MOOc7NsdqmykDoyg4MVEC0y5dDDjnMQIC4SUMh7fJtY2BcjIueqLYxMC6M21TZNgbGxbjkGhdrIEDdGYh2+WEbA4zLJQVEu/ywjYFxMS497AtjGwPjYlxy5dhqlx+2MTAuxqXWtg7a5YdtDIyLcQEAAAAAAAAgemyqDFHx0fr56+i+fxAe5yf3SVurA3hPPUL2feFKjgsLiHb5OXPoh4EZCBcXsGVham1u0HusVd6pr8sygyk1E+glhwLS0fT82MmY+WTNVgCpNAPJ8iaVo481h/m4fP3+7V0Pj32Pm699RtRbDi0NO5Dl01tXNDMQ7fJjXdsY7BaPtYxNC6f+35evK73W0FuOySeLmUdvhSNLpkzHplaWye3BWOU2BhG/bgH3UuB3C6IvkrmNywCfcB9NrS/JNRdld2Oi7821W79Zlz0eyb2twYi/P1uO5jMQ7fLzXb4c+pS/e3zZHOu6Pf/5fFxrXTKc2gV8maf0721dRHrNMWmX32cOritktU743nJstcuXw2I5N1sDadUe/sunz+9+Rm+Xv7se9NG6kLb9AAAAAAAAABC2dQjdrtecA8LDdMAQBeT+6fVn38QSr5MDzECAsAaS7pq/9mPRp+bKkgNiDR3JSp8wWTbKAVzCAAoIED2ugWS95vc9EIj8ayD7Wp45YcAlDIACAqxoYyndrnPmADMQQAEBFBCAd/4HyvgDJ3UI0qEAAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARAAAACKCAYAAABigBWEAAAB70lEQVR42u3dQQ7CIBAF0I/x/leuSzcao6hlmPcS94TfjgXrkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMC0wzjg7mIKAAUEUEAABeQfewD2AeBkV5uYXxnDaDwOGhtFi4YbBTyBbFnwwBNIkWWLggIAkM3fwvXLF/EeCDPLSEUEBQT/xUEBITbbcWGwz5OHa8oTCDwtDgoEgL0oTyC4YcyJAgKKyMQepjmBIi+0rfhCnZf8oNgNs9pNe8p47KhTfSkzjOPl8u5nY1NA2HE/ZDQdBwAAAAAAAAAAAAAAAAAAAABANMxFLnLJp13ZD5Oy5A0jF7mkyrEOhzb1Lla5yGWHLtO6bstFLgXHYlJcrHKRy1RX9tZt6h0fIBe5zB/roE294wPkIhcAAAAAAAAAAAAAAAAAAAAAgGiXj1wauOh0HccYyEUumxzrEO3yXaxyqVncdbqODuRykYtJcbHKRS7tj3VwjIFc5LL4OIZ2+XGMgVzkAgAAAAAAAAAAAAAAAEDK9aUA6vQBVTzSuycqishs4fCXcfAN76mDul3ZyfLNhGHZruw6XdcrIseDD82+2Vbp7ajv53vFzb4D1rU6XYMioohA4yWMdvn1ljOwZAGx3o99BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAjN0jO0KHi9KHDAAAAAElFTkSuQmCC","frames":43,"columns":8,"box":[14,13,34,23],"still":0},"thinking":{"body":"data:image/png;base64,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","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADYCAYAAADVqm7JAAAEi0lEQVR42u3d0XLjKBAFUHDp/3+5530qdmwHaEGf85at2dwB1BLCu+7WAAAAAAAAAAAAAAD203/4Z/HGn5lBrrEa6+C/QMg9KtdYD8t92ITAvq43twEtafsh11iN1eDlGuuZubbQAAAAAAAAAAAAAAAAAAAAAAAAAAAAbffeSEAb/t3QXQGzzYV1o9zMsfYXP8OQjgFxcG72WLPyy13QkTC5GblZF1ZGbtzoxjEt+1K8Kduc7O1V1lauN+c8bXZvpCjYUA1G3zTil5v20m1H5vbO+6Ax7zjPS16T+hvbu8wtrRNZY955ntvKBt+RWEhZ2RUbQOsNnJPdVxdRSyxgucZsnpsG33C0y9bONto2+qxsF5a5VsSbZNtCAwAAAAAAAAAAAAAAAAAAAAAAANB0bqNpNv6n/L74d4Ua5IQeyW3CV7C+O5aR3RM++V1LujZkLeqdsqNI7szvMX42nlkNuN8tjhhcTFm52l/+khWH5MaLuZ35JPx0XVcX8OjsyF7ruEE/1ztlj86PJxfZzNz48ALfuYBvU0grcq92zwOunnhw0Rf1P/6/jeqJhxn9xVz3H+ZgVGvZ7lRwzd0pFj8RvnkqrMjO2kKX6GJfsdVqLCrev2y1Zk3e7MOkSMq9axHd5QT+uNzZi/pb0c7Ornix4j/kuO2H6HD319E+u8H3ktAnvzuSbi6ReFOrNuaKa9xnvus+XoRmPBWr5ZrrGms8zWWXAymf6kwt4DhxsDfMNddn5/bBn2+baEUs96Tchx0O+N92AQAAAAAAAAAAAAAAAAAAAICmpUbbrSuEbhSHXh/ZF1W0te1ejm1qNXjuKjd53+b6+PRfGjmxn2SPbHr2zUSNaD6WlfvNnFVv8r66iL/OzSqib7qpjy7iSGjKnJWryfsec96+fQpH0sR+2009+4KanR+JF9Qd5rsp4N9zry++t3b0d9zu8p25vflOYdp5PV6y7oyRPPY4OLfyO/BWh1j9i4D+4ueVA+yn9Xpt925/mjnfvVDv6o9y+4YTCwDt2KZL4SClVTrPsL7tvAbf/QaHF10hLelda30PLODsXUEopKN3feEAcm4BR9HXiSrjtr4H5F5vhHYX1nHjtb620C6szcdrfd2wTLZFNs/W14WFAgYAAAAAAAAAAAAAAAAAAAAAoPmKGIYtaiQtbma29rIct7jVeslm3ECycj35D53UjEKK5CKu2PgbW6ujslcXU0ZutPVPxmg5T+WsXAV8k+xVBWyLiXdgW2jvwO3ABt9/ndzMvje9SI/f1bnP+hmFPr/gSQgAUPAdGFh8TnEVP5ipmBuJN/Fq6/t/U/PhHr8EZzyh5Z471orrO9VllwP7nthfupmXzI2CH0FFyztjSvusXDEpYvN849yHHQ74tAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoLXnTZdCcyZoWzf47gktGd04YFABZ+8KKtw4MnIrjfX43OumDaCr3DiyciuN9ejc643gXqhzPNhCD7pjVblxRJFMuYVYaGOV+4bHZh9vAQAAAAAAAAAAAAAAAAAAAADAE/8AZ56Iufksc5YAAAAASUVORK5CYII=","frames":48,"columns":8,"box":[20,0,30,36],"still":24},"typing":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOAAAAAOCAYAAAA2YxATAAABCUlEQVR42u2aPwrCMBSHE/EOOrr1EB1chB7BVfAQnqGHKHTtEYQuHTyEm6OeQqeAfVLatH2Bxu+DDPlTfuRH3iOvxBoP7pfj22f94/Vs9bOyseihp6W3RFYGAAhAAAKwh7SoTVrUo+d9QQ89AhAA1Fj7LL6dD5Pm5y7cp+pdT/uW1m6zVd8ffur5GWUA+v7JAvyEmQJQZrQY6cvSc4KfQA0IsNQaMARJXlmua/hJAJrf1wna14vQV7SsbGzoQ4mfMDgA5VMgZ67LqrIv17nvpx6EWPTwM4xe9DWgzHJdWU+OjzVWUy/JK+tajPv7Rz+jDUCZuWS/a3zoo9qsbOx309YLvT/81NVbIh8bcFH1c0M4RAAAAABJRU5ErkJggg==","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOAAAAAOCAYAAAA2YxATAAAAZElEQVR42u3WgQ3AIAgAQen+O9MVWlOF1LsFNB9IGAMAAAAAAGCZlEBPalwFQ5MHLISePF7AMDSf0pPpqPnDtyre0xNDYwktYXfx4ryIhadMbD6dYtSfa3rSIlxu/ls2bqHnYW6S9y/jZM1ljwAAAABJRU5ErkJggg==","frames":6,"columns":8,"box":[15,22,28,14],"still":0},"building":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOAAAAARCAYAAADE46BdAAABHklEQVR42u2aMQ6CMBSGqfEOOrpxCAYXE47gauIhPAOHIGHlCCYuDB7CzVFPoRMJvIRggRb7+L6kQ0vJn77H/9KSRhEAAAAAgFeMzeTH5fixmf98v1r9tKjQQ8+ZXoisqEEAGBAAA/aR5LcoyW+Dn9uCHnoYEACcsbaZfD8fRj2f+uA+Vu962re0dputqvX5zt8c8VRvQNs/WfBfkL+ADSgrmkb6qnTIzJE/zfHkDAiw5DOgD+KsNJq3T9rXBxMbsHk7wfX2wveWKS0q49MEc2wJfebPdzzVG1BeBaqDW1dx2Zfz6vfHfnjoDdNbav7UnwFlleuqenJ8aGBd6sVZaeqmcX1LjKdaA8rKJftd479eqk2LyjSbaz3Wp0svRL7741H17CprKQAAAABJRU5ErkJggg==","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOAAAAARCAYAAADE46BdAAAAiElEQVR42u3bwQ2AMAwDwIb9dw4zAKJV3bs3yFKDBY9Q451+eH2Nb+TJi3RNOMy398iTF68WHErJk+dtCAAAAAAA8Lt2BObHWLoJ08EPTB9QiFb4fQtYSrh1XilhzqdMB2adkJc+PyVUCiVUwjnL2D1xKbYnL9ym56XP7+i/IRIemBPy0ucX5QZ30kfb7Nw7WwAAAABJRU5ErkJggg==","frames":6,"columns":8,"box":[15,19,28,17],"still":0},"conducting":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOgAAABICAYAAAD8tbmWAAACu0lEQVR42u3dO27bQBQF0EdBe0jKdGqyAxduDKRJn9aAF5E1aBEG3KTQEgy4SeFFpEuZrEKpBBiMLA9pDoecOaeyDUFXHz7+RF9FAABAVbqXv/z6/u348vfd/tDlfgAlMlt7rqzXxksABhQYYeslqFsru/K1Zm7PBZyC+w9gqN9//0RExJeHn68+8BKZ53LnUCITW9AqtzRTrxBkyhyTaUAZ5PH2+vjpw8dZdyVbzkw6SXR1/xRX90+T3U7mfJm7/aHrL1wy15O5Tbmj57ub/34ee7vUhXYtmT++fpa5wMyo8UKFqfap+/vWERGpuwslMqc4fhiaJ1NmSqZjUOI9Z6Rl5s00oAwy5uymzPGZriSCaPxz0BbWgK2s5QnX4gIGFAwokOkYdLc/dKfPdvoXevdPP/f//nh7fRxznFQi89IF7amZMeFF9DJl2oKCXVzAgAIAAAAAAMSiGhUIvbgyi2b6HBRsQfXilsqcqiRbZpnMbY7AIU+2RGapdvcaGuX14i6wF7cVenFlxtp6cU93FhFv9s6m3m6pma2shHTxriezS9kFGzssKR2jJTJzHD+k9KiWyNRRG/X04r727VupW6cxW7ESmb7dTEdtrLkXt6WF16CG9sLQiwuEXtzQi0toVAAMKBhQQC9u6MWVKVMvLtjFBQwoAAAAUWvlSStlT609V8JJIsCAggEFFly72Upt4qXLseY4FnUMSizh/0FDL+5iMr2f63o/DaiFdNJCrRKZOXJTenHnyNy02hfbcmboOV7N+7lJ7fp8vru5eIeptxvSLzpnpgXXiijW9t0s792Ej+kYLZFZa3ernuP19xw7Bq1Y7s7hcwtticycVaaXVrRzZBrQhgc1MrYJlsicMnfIWdycmS5UgNCLqxc39OISLvUDAwoYUHAMGnpxW+lu9X7qxQXs4oIBBQr7B7y59sdqFKDYAAAAAElFTkSuQmCC","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOgAAABICAYAAAD8tbmWAAAAmUlEQVR42u3c0QnAIAxAwbf/0nELFb1bIATy+lFoq6b9Tszss115iEhFikhFCjBmetAiUjPB8ZoJAAAAAAAAAAAAAAAAAAAAAAAAQP5yZyYIRqSI1EzL2RVEKlJEKlInBgAAAAAAAAAAAAAAAADk20i7IlKRihSHa1cAAADIuwTvEsDh2hWRilSkAAAAAAAAAAAAAAAAAFxtAVpuR7l7YA6iAAAAAElFTkSuQmCC","frames":24,"columns":8,"box":[20,12,29,24],"still":0},"notification":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAA4CAYAAACrHfdzAAABJUlEQVR42u3czQ0BURgF0DsyvSjCVg8KUIQaFKEAPdgqQjWsJEjGDDNvIs85O4nchfjm/ZCbAAAAAAAAAFCXZurAy25zfXy93B8b+fPl85mFj4B/1vY9oUqvEPKnze9bUeQ/57ddb1wdTkmS83b9NnDo++TPkz90iyW/ZwDGKr23lY8zAIzUTL2nfX2yyZ83n5GHYOpwH7RSA1ZLvgGo9Isvf1i+MwB+CXZPLP9f860AxDUoGACIa9Cua6iu++tvr6vky/+FfCsAtkBgAAAAAAAAAAAAohs0ujujGzT+CwTRDaq7M7pBoxs0ujujG1Q3aPTTRDeoMwBEN6j86AbVDUp0g0Y3KM4u0Q0KukHly49uUIhrUDAAEN2g8uVHNyjYAoEBgAJum8colXsFaJEAAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAA4CAYAAACrHfdzAAAAhklEQVR42u3csQ2AQAwDQBOx/8rQMMSb3Em0X1iWSOWEJs/3tb5/nFEgBdqc/ygQm40I2OwWQZWr/H03nBNI/iiQ/EvzVyAAAAAAAAAAAAAAAAAAAAAgRgliGU6B5G8bFPwBILZBYxs0tkHdcPKXPwokf9ugAAAAAAAAAAAAAAAAAAAA/NcLs/xH0QBTK9kAAAAASUVORK5CYII=","frames":16,"columns":8,"box":[24,8,24,28],"still":0},"happy":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARAAAAB4CAYAAAA62q2WAAAEN0lEQVR42u3dwW3cMBCF4ZGQXlKEr+7BBbgI15AiXEB68NVFuBr7FIMwNptYK5JD8vtPSSAoD8TMm6Ek7kQAAAAAAADMz2YJxuLt6eG9/PvPX7+3TPfDWvywBBLXeuAouyUAMG0HotJBfDAQnMSfgP4a6GfdF2AgCyXu2XoYGRhIh9bZelgPBqLyD8vd80tERLw+3p9ync5QJ3STgWR9OJWt0mVI3Lvnl8/7ln8+et3I69ErPrLkS2sdtjCDJm5Zecv7Xbv3pevOrLSZjAzR90vU2k7+3cD9qufWStf74eVZiUtHjvjIki+tdewjV/7Xx/vPALjlOszZGYqPBGdhVH466BivU26lY+fswNydUE0dmwpDBx10HNXhMB2AcBoXQPgSFd9uT8s289K/Xbv27enh3VeXYCAS13rAFgaADiRaH6L6V6VzWjSW/vkF8cFAcPKrPlsGNDcQzp47cf927x7/JyPLky+1dOhABk5c6wFbmBsD838DVeCuaVziI7yFAQAAAAAAAIDI+otkCKMcgfAdiMS1HgivcQHoQFQ6iA8GgjDKEQwEQyZur8OKjAwMxDR664G5DUSli2GGfIsPBpL+4VS2SpchcTMNte69Hr3iI0u+tNZhCzNo4paVt7zftXtfuu7MSpvJyBB9v0TNMm3cjF46RoiPLPnSWsdu5ijMpBUf1c7CqPx00DFep9xKx87Zgbk7oZo6NhWGDjroOKrDYToA4TQugPAlKgy1BgORuOskrvWwhQGAdToQM3ohPhgIDLXGSgbC2XMnbo+h1owsf77U0qEDMY3eemCdLYzp6xAf4S0MAAAAAAAAAMQMv0iGMMoRCN+BSFzrgfAaF4AORKWD+GAgCKMcwUAwZOL2OqzIyMBATKO3HpjbQFS6GGbIt/hgIOkfTmWrdBkSN9NQ697r0Ss+suRLax22MIMmbll5y/tdu/el686stJmMDNH3S9Qs08bN6KVjhPjIki+tdexmjsJMWvFR7SyMyk8HHeN1yq107JwdmLsTqqljU2HooIOOozocpgMQTuMCCF+iwlBrMBCJu07iWg9bGABYpwMxoxfig4HAUGusZCCcPXfi9hhqzcjy50stHToQ0+itB9bZwpi+DvER3sIAAAAAAAAAQMzwi2QIoxyB8B2IxLUeCK9xAehAVDqIDwaCMMoRDARDJm6vw4qMDAzENHrrgbkNRKWLYYZ8iw8Gkv7hVLZKlyFxMw217r0eveIjS7601mELM2jilpW3vN+1e1+67sxKm8nIEH2/RM0ybdyMXjpGiI8s+dJax27mKMykFR/VzsKo/HTQMV6n3ErHztmBuTuhmjo2FYYOOug4qsNhOgDhNC6A8CUqDLUGA5G46ySu9bCFAYB1OhAzeiE+GAgMtcZKBsLZcyduj6HWjCx/vtTSoQMxjd56YJ0tjOnrEB/hLQyA8fkALyHJsnPhb50AAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARAAAAB4CAYAAAA62q2WAAACA0lEQVR42u3d0Q3CMAwEUB/771wmaMQf5+i9CRA255RI9QzNHl8BzT6+gtof7iNEYGd4PGUhIsxhUaNqWmG+oT/+/jlS8iWkqBDxu60LkZT+UKNnTRinDpxAPOOiVqBRm6eu0yJzusZ1fSlA3z5DSp639Yf/I0yYH+ogyPSHyYc6cG1/PK4sYWd4RIgBq08gSgEAAAAAAAAAAAAAAAAAAAAAADDe+MRY64D1FoD1FsIc7D6lOcy91Hh6tnq3bV+36qIvRFpXGETPmjBOHTiBeMZFrUCjNk9dp0XmdI3r+lKAvn2GlK1UFCL+jzBhDnUQZPrD5EMduHc3ritL2BkeEWLA6hOIUgAAAAAAAAAAAAAAAAAAAAAAAIw3PjHWOmC9BWC9hTAHu09pDnMvNZ6erd5t29etuugLkdYVBtGzJoxTB04gnnFRK9CozVPXaZE5XeO6vhSgb58hZSsVhYj/I0yYQx0Emf4w+VAH7t2N68oSdoZHhBiw+gSiFAAAAAAAAAAAAAAAAAAAAAAAAOONT4y1DlhvAVhvIczB7lOaw9xLjadnq3fb9nWrLvpCpHWFQfSsCePUgROIZ1zUCjRq89R1WmRO17iuLwXo22dI2UpFIeL/CBPmUAdBpj9MPtSBe3fjurKEneERIQasPoEoBQAAAAAAAAAAAAAAAAAAAAAAXOALqhfvSfh7RAEAAAAASUVORK5CYII=","frames":32,"columns":8,"box":[18,6,34,30],"still":3},"error":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANAAAABLCAYAAAABBQn0AAABm0lEQVR42u3cwW0CMRAF0M+KXlIEV3pIARSRGlIEBaQHrhRBNcmJAyiwSzZ4bfPeBQkZPtLIsr0ykwAAAAAAAABwYfXbm6eP9+85X/r2+bUaG1Mio9cs9akna7g1cLM/XLze88jY0hm9ZqlPHVk3J9Bxt81mf8hxtx0NeWRs6Yxes9Snjqy7K9D5w1Nm6dSxpTN6zVKfOrKcgZyB1OcZZyBgnAkEmfkYe+6yNmXZK5HxX8t0bVnqU2+WFQhMIDCBwFUej0k9xn6l+qynDD6HXn/4+v2//LgSGb1mqc/yWbZw4AwEJhAAAAAAAAAAELex47av29iaikTjvmisqD7RWDEaK6qPxooa90VjxWisaI/tDKSxIhD/B4JorKixovpEY0WwhQMTCHCVJx5jq080VtS4LxoraqwIzkCACQQAAAAAAAAApPvb2HLk9JAzLN3oTo6clnOGpRvdyZHTcs6wdKM7OXJaznEGkiPnGWcgIP4PBOmhsaIcOT3mWIHAFg5MIHCVx2NSOa+Us66h0Z0cOa3m2MKBMxCYQNCcHxqW5WOVyKJXAAAAAElFTkSuQmCC","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANAAAABLCAYAAAABBQn0AAAAk0lEQVR42u3csQrAIBBEwUf+/5+TxjqQwiDHDFgvKFt4xdV39zo7/ZExNWva+xztcgWgQKBAAGCI4O4MEQAAAAAAAAAAAAAAAAAAAMhOhOxEkJG1VqBAgAIBkCGCj70hAgAAAAAAAAAAAAAAAAAAADRoh4AcOVlrBQoEKBAAGSLIkQMAAAAAAAAAAAAAAAAAAAAvHoBsR8vwrJ6sAAAAAElFTkSuQmCC","frames":24,"columns":8,"box":[23,11,26,25],"still":4},"sleeping":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPgAAACMCAYAAABRYmTcAAACnElEQVR42u3dPYrbQACG4W+D72CX7vYQKtQYcoS0Ah9iz7CHEKTdIwjUpPAh0qVMTuEUwWYRCKKfWXa1z1PZRvhVM/YgiZkEAAAAAAAAAAAAAAAAAAAAAAAAAGCDHv73wJ9P365zAr/+/E6SfP3+42HuSWpra89rf/EbB9tlgIMB/k/V9qnafrXjtLW1y7Z3U+KX82nV47S1tcu2TdHBFB3Ilm6Tzb1kn5FL+Ely3B/urx+fX7S1tQu3/YODKTpggAMeVY1HF7W136S9m/plt4sGt5MZXkQYft419XWtXyNtbe1pbVN0AAAAAAAAAAAAAAAAAAAAAAAAACCfdtnkpVusLFlSVltbe37bqqoQO5sABjjwYQd41fap2n6147S1tcu2J21ddDmfVj1OW1u7bNsUHUzRgWzlPvjSe3IZuUeXJMf9IcNdFLW1tcu0/YODKTpggAOeRY9nk7W13037fgKvT2L4fuzzrqmvXVMvOnltbe15bVN0AAAAAAAAAAAAAAAAAAAAAAAAAAAg21sXPZm/bvPi9Zq1tbVnty2bDLF1EbD1AV61faq2X+04bW3tsu3dlPjlfFr1OG1t7bJtU3QwRQeypdtkS7czzeASfpIc94f768fnF21t7cJt/+Bgig4Y4IBHVePRRW3tN2nvpn7Z7aLB7WSGFxGGn3dNfV3r10hbW3ta2xQdAAAAAAAAAAAAAAAAAAAAAAAAAMinXTZ56RYrS5aU1dbWnt+2qirEziaAAQ582AFetX2qtl/tOG1t7bLtSVsXXc6nVY/T1tYu2zZFB1N0IFu5D770nlxG7tElyXF/yHAXRW1t7TJt/+Bgig4Y4IBn0ePZZG3td9O+n8Drkxi+H/u8a+pr19SLTl5bW3te2xQdNuwvkgbHOE++OwQAAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPgAAACMCAYAAABRYmTcAAACuklEQVR42u3dMW7DMAwFUCrI/a+sLh2KDF2SmDL/e0Bnoa6+SSWuWQV82/79udzDtUfQ5nr6m0dv9ldr8LqdVtzCHLXZd9i6BLZtu7mFsy6XVPDk1m2roCp30tkgaQMkhswZ3PkwYt3O3/WE4wFhFTytcqsoOIMLGgAAeNAFKvrD7SXgcHDIOj9wFnBO3vDbg08CLmA2/OQHkLToQUHbwh11Q22t4Lv5fJJWybrDndiil/8Hz6ziXRWl68bWFSyBdgG1bgAAAAAAAAAAAAAAAAAAAAAAAAAAUN6qCtRFb+b9ag4FHEEbPKlGwOne7BFBq7Mm1dActr8/J4R98tqj13QHMWgwebjhCYMNjziDJw+f28ItaBXyKXrSCNmk0bXpZ/CxneMSMoMGmds5atHx9x9c1ARGwByVBneOAq6iCPfgznF94CJ03uV8paNF5x9Pl+BWFaXrxtYVLIF2AbVuAAAAAAAAAAAAAAAAAAAAQL0zreZyD9ceQSuvbMLAwTLooO725iSvHDLCNnGoBcHTPHfQZM3EdSv9pYvJrZvZayp31NnAJIuKmaDhDB42Pli4bXZBu/m+W8ItZMYHzy0qzuCGK6TPPxu9pnZQ0IQ79Axu+JyqImiV9YSNr3Nm3tTSz+BjO8clZAYNMrdz1KLj7z+4qAmMgDkqDe4cBVxFEe7BneP6wEXovMv5SkeLTvl/8CkVpevG1hUsgXYBtW4AAAAAAAAAAAAAAAAAAABAvTOi+nIP1x5BK69swsDBMuig7vbmJK8cMsI2cagFgW3bbm7hrIvxwSqZdflci26SRcVM0HAGDxsfLNw2u6DdfN8t4RYy44PnFhVncMMV0uefjV5TOyhowh16Bjd8TlURtMp6wsbXOTNvaulncEIfxOh++AW06AAAAAAAAAAAAAAAAAAAAAAAAAAAr34AGBc5K2DI1cQAAAAASUVORK5CYII=","frames":32,"columns":8,"box":[18,1,31,35],"still":0},"waking":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAABACAYAAABMbHjfAAAB5klEQVR42u3cMU7DMBQA0B+UO8DIxiE6dEHiCF2ROARn4BBIrD1CpS4MHIKNEU4RNlQhmoYQB9t5bwMFY1n+/j+16wgAAABYiMYQ1O31ftMd/nz1sG1yau+/taZI3RNUgPU7MwVZMhmg8hXa+Pe3JwNU7uph26QoI1K1KwMscIKmyAzHJmeq/1NKuwKgsJSfyupxHxERL3fXkzxXaoknADJboVNP0LlM1f/U4y8AvMQuevwFQGYlxFyZbGh/vj+Xy4vvVOMvADIttUqboKX2v5UiI2ra2kcJlKREqa2EkCGPBMDYFfTt4z0iIm6enpsUK/TQ9iGcBYKFlEDHMsrYFFnbcV9GZIDV4/6rNj5VPw95bu724U8ZYOzqOVTq9unPlodZ7aff9T37er/pasqK9gFM0EX3v63l4zH7AIwKgKnPVuxu193l+UWyDn9vP5edz1MrnDNEeY6/EmiBk0Z2FAAm6Im/mbKtnAOslSLzLlGmnKD6H6fvBSr9KMSxiT00ALwE2wcYtYLubtddyhX6t+1DOAsEAAAAAAAAAAAAAABAbZq579fXvq9cRgnfCCv9flD3m+IrkSAAoOcdwJV9UfRlWMgAIABAAIB9APsAyAAgAEAAQMxwO/Rva2PtIwOAAAABAP/iE7RU52unkeZ5AAAAAElFTkSuQmCC","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAABACAYAAABMbHjfAAAAkUlEQVR42u3cQQqAIBAF0DG6/5V1EyjtReS/B62rab6TG6tg6t8V4/HNNWjy8wsA0QTACh1d/1fNWLS0FxYADfpfQXfepwnA+RF580p3e4P21EnjHx2bYAFD/RUIABMAAAAAAAAAAAAAAAAAAAAAAAAAAChHC1KORwcBAAEAAJtgAAAAAAAAAAAAAAAAAAAAjhq4KRwHBpIvogAAAABJRU5ErkJggg==","frames":12,"columns":8,"box":[24,4,24,32],"still":11},"poke-left":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAAAgCAYAAABw4baZAAABDklEQVR42u3bwRGCQAwF0F2HXizCQizFGijCAujBRqxG74woomYlvHdV+eNAyOKaWkaup+OtfGDfD/Xdz0RnRuZlzJIzP6crDXz6hf45L2NWtpxIu6kXDudLOZwvLw8w933kE3WNrDlnt8UT1iIvaxbP1V+35Ufr0+jMyLyMWXKWn6MmHWzfD3XJjyFryMuYlS3nL57BFJoshbbyAoPsum8/r7S480RnRnfdbFmtcyKveR0MLBFBgQFz/yo13jOYWrd+c28hOjMyL2OWnNc5OhhYIoICA0bqVmalQAcD82DFeAXoYLCxebAWs2egg4ECAxQY2Acr9sHQwQAFBgoMinmw/LNSoIOBAgMUGDR0B/glUpc7BkxsAAAAAElFTkSuQmCC","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAAAgCAYAAABw4baZAAAAMklEQVR42u3BMQEAAADCoPVPbQlPoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgJcBbCAAAQ5e1s0AAAAASUVORK5CYII=","frames":10,"columns":8,"box":[24,20,27,16],"still":0},"poke-right":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAAAgCAYAAABw4baZAAABCUlEQVR42u3bwQ2CQBAF0IHQi0VQiKVYg0VQgD3QiNXonUQFIQPsvnfe5EdgmMXJNvHF83Z9xQqX+6P5tSYjIzOn5Cx5y/O6OLnpBVl6QY+WU3JWDXlT7ZxF/TBGP4ybreP8sp+Js+a1td2wzBtVahbzNVvuP+fsTzMysn5L5nXbI0veel0pb4qsvXXmHr7UrBryiikwheVBP2JhHe4bDIr/BgtzMHMweZvm6WBgiwgKDIg//kWczpY+zRLWzKAyMjJzSs6SNz9PBwNbRFBgQBxsDhY7zTtAB4MaCsyxC9DBwHmw2OncD+hgoMAABQbmYGEOhg4GKDBQYBDOg9Vzrgl0MFBggAKDRG9/9FZS9IHJcwAAAABJRU5ErkJggg==","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAAAgCAYAAABw4baZAAAAMklEQVR42u3BMQEAAADCoPVPbQlPoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgJcBbCAAAQ5e1s0AAAAASUVORK5CYII=","frames":10,"columns":8,"box":[21,20,27,16],"still":0},"tickle":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANAAAAAkCAYAAAD4p7R7AAAB0ElEQVR42u2bMU7DMBSGfyPfAUa2LtyAoQsSCztrJQ7BGXoIJBaGHqESCwOHYOvYniJMQVYVp7Zjhxfp+6a0dfJi/7H9aud3asB+s+5ur2/+Pq+2O/fz+tyFZVbbndNCGLv38LfD6ajH9y/z9UKfelwJAIrxKT06lcPpWDxq5MbIGUn2m3UnSeGo23J0nxIrZeRHHzv6+CmNZS0NiU3bS2IoHUEfu/r4WMH7t09J0vfLw+gFx8qFjdYfhzdQI0YuU2IOzQ5D9ZqjfuhjQx8fO6EvHB5fKvfxdJfVUK1j1IpZ8mC0jIU+dvRxNVO4nPy3Rh6fmyK0/F/SKp+vmcKhT319/KVpzjq50/YS64U+duvll1qxlFG0r08/6iz1gUMfu/qwDwQgNlIB6EAAdCAAOhAAqPRdOEVWfc5XIM6/L1lNmSNGaawpq11zxEKf/9eHGQiAFA7AUAqX+mpETdNV6rVKDFGp57QwkbVoS/Sxo4/D8SgcqehDCgeAIxXHI45UHKk4HnGk4kjF8YgjFX1wpOJIRR8cqThS0QdHqnA84kjFkSocjzhS0UfsAwGIjVQAOhAAHQiADgQAwpGKIxV9cKQCkMIB4EjF8YgjFX0i5X4BUl3ASmlIMWIAAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANAAAAAkCAYAAAD4p7R7AAAANElEQVR42u3BMQEAAADCoPVPbQdvoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfgN1JAABgIwlBQAAAABJRU5ErkJggg==","frames":16,"columns":8,"box":[23,18,26,18],"still":0}},"deepy":{"idle":{"dataUri":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAkAAAAAYCAYAAAAS2EKFAAADhElEQVR42u3dO3LUQBCAYc0dICWEKxgyAgIiMmJ8Ax+FG9gxGREBARnLGRwS+w64VC6btUqaV3ePekZ/J37VSl/1aHpaWq0cJqJ5vHj95d/d7U3AQ45GdREEQXgPk8LJ4tWPZ7a8+3g9/f5xOcVMLc3eTB5zxLFNXgiCkM2vYAFh8erPM8eWKdc8qsljjji2yctoJz00rJw0t/aYNUAsXv15lqb5b/PXlHd0k8cccWyTl9E8NIicNLf2mDZALF79eR73e+5Ys+7RBO1p8ubJmfg5hWFED3O+Xw8NIifNLT3mDdDei8URPI+DHIvUmcNy38soyY3Uo23y5rGe+MtJv3ch2sPjqWGlJtIgctLs0xN6WCxGW+BH9uRsK3d7qW312gBpeGITv7QIefJYWmqPQTxtG3kaRDsPx3PkHqCSxUu6qLZeUPH05dEyjezRKESePJr1R2O8Sj3WNRFPXw0i4+XfE0oxuYVoa3u5xavGhGccj4ZpdI+0CHnyaNcf6XjVeCznGB48ePQ9QYJJ7SD23qX2YopnPI/EdBRPauJrNT+WHqv6UzteUo/2HMODB4+NZ/UGRQnq/OYs6U29GknC06dHYjqC5/xS/9b9Aan7bDx4rOpP7XhpejTmGB48eOw8QaMbWyt2pWek2h0inr49EtMRPC3ee2/hsao/teOl7ZHOMTx48Nh5wtoloy1g7G81Z2i5SbIy4cEzkqe2IdvTc+TceMsPHn2PdTBeMk/wtli0ShKevjw0QGN6aA7xjOqJXY1MXalkvNp4QquOtdUNtXjwHNEz7fSWpXZBPEpuvOUHD54jelYboO9ft1/w6Sq9U+nDojRNePr3aDQceHx6WtSfPT3SOYYHDx47z7NPgcUgJbglqGZBrTHhwYOnL4+3+iPxWJjw4MFj53n6+Ni3nw8vfv+qDPTyzeUUe0x37aPCa0148ODpy+Ot/kg8FiY8ePDYeMIaqgS2hpkKnyCck6hcEx48ePrzeKs/tR4rEx48ePQ9Ye3yVA7s19//33/+YFukc0x48ODp2+Ot/pR4Wpjw4MGj6wk53VkqZswU+Tifxn/MLTHhwYOnX4+3+lPqsTbhwYNHx7O8AnRx9uOpwPM29ZrKDvFi8asTHjx4DuHxVn9OhS9XN+HBg0fXEyLFUDXubm/+CIszHjx48ODBgwePiie0QJUmBw8ePHjw4MGDx9JzD653WPqr9cjFAAAAAElFTkSuQmCC","frames":16,"columns":16,"box":[12,26,36,24],"still":0},"idle-look":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[11,11,37,39],"still":0},"thinking":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[0,6,47,44],"still":6},"typing":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[0,17,52,33],"still":5},"building":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[2,0,50,50],"still":0},"conducting":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[1,0,51,50],"still":2},"notification":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[3,7,47,43],"still":6},"happy":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[0,5,52,45],"still":13},"error":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[4,17,45,33],"still":8},"sleeping":{"dataUri":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAsAAAAAwCAYAAAAfIszfAAAIwklEQVR42u2dra8dRRjGdxIEpqSiWBQt/0BFwSFIAwQqLkFUtaYJDoXAtNdWgcA0IbeqguQmfAhCEDiKqCKYtihsG3JTUxLEkhPugblzZ8/O7s7svM/u71Ht/Tj9nem8z/vMnNld1yCEEEIIIbQiOQsQ5y5cezX82tNHd3/nvwchhBBCCC02AD95ePDf319+7ToBGKFy9XY5suD8gZFBqEi93YjU2x1GBiEC8Ikd4E0QJgAjVDYARxacBGCECgXgSL0RgBEqU2+3IwvOT8wG4MbbBSb8IrFiO4wU2571ABxZcBKAkUK9PYjU20XrAThSbwRghAoF4MiC024A9sOvZ2qEYCQRgCPFtifAfZnwixQDcKTeLgpw3yD8IsF6O4osOM9aD8CRBaf9AByYGgF4fcXWRorNGWc+jBSb+R3gyIKTEEytOQHuB5F6M78DHKk3QjCSCMCRbHZWgPt2X/htuAsEzc0ad6TYFLgPVcJvwxlgJFxrjbcLrLb7G4w1AZierNDbjiILTvM7wJEFp+0zwIjm5puEV2zmd4AjxSZzBthjJgCvqLkp1loYfr2xljkD7DETgOnJKgvOI5Xw2yieAaa50dxCo1Db/Q2KbY/KoblRa+UCcDDWF5mF9GN6ctnw6423zBlgj5kATHPTYRZabMjdBYIGR3NTrLVG9C4QiH4s3JMlzwCnytWYBDQ3mtvSzA2x4BTb2aHW0Il5oNLb1PqxeE+WuwuE6QDctm1Lc6O5pSyOVExCaUxpcDQ3ag2F80A1TKrt/rLgXHkAVis4mhtSb3BKOzwsOBELznm12ZRiJ5WeTACmudHc0CAzU1kMseCkuSEWnOqBnX6Mcs7fKkcgaG5IWdtjPDQ4GhxiwblrEadUb4p+Rj9GU+qNM8CIBkeDo8Eh6i0zayO4wUOtoTXVG3eBQKZCmnNO5swcDQ6x4KQhU29oqR6x9A0eipMGZ2oiKwRgxfFFSLne1K76RygW0qg3WwtOzGTBBad4oaGCQSCkvCBS9AcWnIgFJ/6QW5jJAs2XBofQvFK8lRQLTqRaa0pzl08wCMCmQ9eu8GVl8g65OMgCMxczoZHz5t7xXLnKInm5vGr+AK+9QKkUgOmBCw7ASsW2ZX3j7YNT3/v5+9OBsXaYHMpbu+DG8NIskB+Aj5sbARj/hbcg77kL197zett3Kv6rtgOMFhqA+4rNmhlveH3Wbz5rmisfx7m3zDUD8BhetfG13Cyshokl70a1bXvvuLldZXzxX3jL8dYOwGPnb+07FPBpwHJ4Xclis2QSPu8uVivM8NZvFtaanGLgGcpb8wiE0vjiv/Dm4H3y8OD9GgEY/4XXAq+bo9gsTOSw4EJ1vQ//Y6PNa8zFDq+dZmFx/ioFHniZv/gZvPgvvNZ43ZzFVqvoxgzu9ue3rNvX6Dv3leP9wDsvr9r8VeJVaHDMB/wXXvwX/12f/7qSxWal6PoG2Ne3nzsX/k4Xf9e/M/XiCHjL8arN3yXWm6WGwXzAf+HFf/HfdfqvK1lssQvK5i46/56XKdpe7LY9j+I/Zs9/3+EkSXkv8NrgVZu/yrxqDY75gP/Ci//iv+vwX1ey2CwU3RSD8H8vZI0Neux9wGuHV23+wgsv/ouf4b/UG7xleGcHrmUSqT8bXJF+4v6eKauVHPeGhLcMr9r8hRde/Bc/w3+pN3jL8LqSxWbNJFK22lO2+3e9Tq6bo8Nbhldt/sILL/6Ln+G/1Bu8+Xld6WKLQdcoutRzJk3P1ZBdr5XzCkp4bfCqzV944cV/uzlvPm6fhV/bP+9ewn/xX3jXyetKF1vtohvLu+vfD18z5yMx4bXJqzZ/4YUX/z0dfv3AG/uaJT9LCez4L/UG73heNwS06XhKx9jii13Nl7PocjHPwQqvxlyYmznH2M7V5OAtF3qszt9dIc2KP2wYYzu94fct+VlKYLfmvzcft7f2z7tbsa/hv/ivRV43J2wXfFdatzDAc7HCqzMX5mBWaxiWef2Qljs8zBV6vnj3+hlr87cvpFnwhxhj18/kHOMpYzsksOO/+C+843mrBuDUN2Sp6HKz+s25RJPLyRsGCevjW2NsxzLPMbY5G4YKbxgmSoSHXKGnK6htvvf387/O/Pbli2bmbx+vFT8L///btn3mXJzZCm+NwL6UXpwzoKkFdniH8yZ/xOUbsH8Yueu2E1PSfYlAWYp56kTYGnRowNZ4fWOOGbB1Xsvzt29srTUMFd5tbYWhZ86wM2bXLxbSPv31eWtp/vbxWvGzvt1U67ypgd1qf4sFHsv5gcC+Lt7kHRTfgC0PblegtDoR5t6lnBIow500JV7L87dvbC0GdgXervBjkbcvqFmbvykf01vwh7EBGN5Bc+HU2d9Q7+x/3b7w5xWJcKYe2OFN5x21A7zV5jF7Xep7/N4WLPfZkr5AOZa5BGvKqsgKb+qun1Vey/O39NjW4q3d4FIDsIXxHROALfPmHuOxrFOPFNTgnRKArfa3nL1tDuYl8KosMGqO76i7QOwCHfoGQujcRTeGuQarAm/s3KcK76ZZWJ6/ucYW3t2BInbFvwXelDPAdz74SIZ3Ss2VYB16F4havEMDu0p/U8sP8K6Dd/Cj67768d8Xf/OV4dB9j6rLHSinMNdghdfmXKjFDG8e3thdICzyptxVQYnXkj8MuQ9wbd7UwI7/4r/wTuN1U6BzFF2T+SkzuZhrscJrby7UZIZ3Xbx9Dz9Q47XkD0OeBFebNzWwGxvfzvsA4w/wWuSd9PzmVPCf/vj/zx++VS/4pDBbYIXXxlywwgwvvPjv+vwsNbDjv9QbvON4Jx9k9qFTtAFudlzRV+qj+jHMtVnhtTMXLDDDCy/+i5/hv9QbvHl4x+4AX/L+en/gr7/e93sFzh5dCr503yorvLPzmp6/E8YW3gXy4r/4Gf6LP8Cbh9dlAM6qp4/u/lLYHOCFV4K3NCu8WrzUG7zw4g/w5uN1lsBzFxu88KrzljQJePV4qTd44cUf4M3D+w+aQZyosw2YrwAAAABJRU5ErkJggg==","frames":16,"columns":16,"box":[2,2,44,48],"still":2},"poke-left":{"dataUri":"data:image/png;base64,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","frames":12,"columns":12,"box":[1,16,50,34],"still":0},"poke-right":{"dataUri":"data:image/png;base64,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","frames":12,"columns":12,"box":[8,16,44,34],"still":0},"tickle":{"dataUri":"data:image/png;base64,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","frames":12,"columns":12,"box":[9,17,43,33],"still":0}}};
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPRITES;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_MASCOT_SPRITES__ = SPRITES;
  }
})(typeof window !== 'undefined' ? window : globalThis);


(function (globalScope) {
  'use strict';

  var MASCOT_STATES = {
    idle: { label: '待机中', badge: '·' },
    thinking: { label: '思考中', badge: '✦' },
    typing: { label: '输入中', badge: '⌨' },
    working: { label: '运行工具', badge: '⚡' },
    subagent: { label: '子代理中', badge: '◈' },
    waiting: { label: '等待确认', badge: '!' },
    happy: { label: '已完成', badge: '✓' },
    error: { label: '遇到异常', badge: '×' },
    sleeping: { label: '打盹中', badge: 'z' }
  };

  var STATE_ALIASES = {
    asleep: 'sleeping',
    success: 'happy',
    attention: 'waiting'
  };

  // Map 9 unified states + reactions -> dsh-claude-style sheet keys
  var STATE_TO_SHEET = {
    idle: 'idle',
    thinking: 'thinking',
    typing: 'typing',
    working: 'building',
    subagent: 'conducting',
    waiting: 'notification',
    happy: 'happy',
    error: 'error',
    sleeping: 'sleeping',
    'poke-left': 'poke-left',
    'poke-right': 'poke-right',
    tickle: 'tickle'
  };

  // ── Astra 24x22 Pixel Star-Spirit Matrix Engine ──────────────────────────────
  // Palette:
  //   '.': transparent
  //   'W': #FFFFFF (star core white)
  //   'C': #E0F2FE (ice starlight)
  //   'B': #60A5FA (astral blue)
  //   'D': #2563EB (deep orbit blue)
  //   'N': #0F172A (visor/pupil dark)
  //   'E': #38BDF8 (glowing cyan pupil/visor)
  //   'G': #FBBF24 (amber star/alert)
  //   'R': #F87171 (crimson alert)
  //   'M': #34D399 (emerald spark)
  //   'P': #94A3B8 (sleep Z / quiet ink)
  var ASTRA_PALETTE = {
    W: '#FFFFFF',
    C: '#E0F2FE',
    B: '#60A5FA',
    D: '#2563EB',
    N: '#0F172A',
    E: '#38BDF8',
    G: '#FBBF24',
    R: '#F87171',
    M: '#34D399',
    P: '#94A3B8'
  };

  // Base 24x22 silhouette rows (rows 0..21, cols 0..23).
  // Star-orbit blue-white body, floating ear-wings on cols 3-5 & 18-20,
  // 1x2 vertical pupils inside visor, glowing star core on chest.
  var ASTRA_BASE_ROWS = [
    '........................', // 0
    '........................', // 1
    '........................', // 2
    '........................', // 3
    '....BB............BB....', // 4  ear-wing tips
    '...BCCB..........BCCB...', // 5  ear-wings
    '...BDDB..CCCCCC..BDDB...', // 6  head top
    '....BB..CCCCCCCC..BB....', // 7
    '.......CCNNNNNNCC.......', // 8  visor top
    '......CCNNENNEENCC......', // 9  1x2 vertical eyes (col 10 & 13)
    '......CCNNENNEENCC......', // 10
    '.......CCNNNNNNCC.......', // 11 visor bottom
    '........CCCCCCCC........', // 12 chin
    '......BBBBWWWWBBBB......', // 13 collar + star core
    '.....BBDDWWWWWWDDDB.....', // 14 body + bright star core
    '....BB.DDWWCCWWDD.BB....', // 15 floating arm-wings + core
    '...CB..DDDDCCDDDD..BC...', // 16
    '.......DDDDDDDDDD.......', // 17
    '........DDDDDDDD........', // 18
    '........BB....BB........', // 19 feet
    '.......CC......CC.......', // 20
    '........................'  // 21
  ];

  // Clean 24-char row helper
  function padRow24(str) {
    if (str.length === 24) return str;
    if (str.length > 24) return str.slice(0, 24);
    return str + new Array(24 - str.length + 1).join('.');
  }

  function cloneGrid(rows) {
    return rows.map(function (r) { return padRow24(r).split(''); });
  }

  function paintPixel(grid, x, y, ch) {
    if (y >= 0 && y < 22 && x >= 0 && x < 24) grid[y][x] = ch;
  }

  function shiftGridY(grid, dy) {
    if (!dy) return grid;
    var out = [];
    for (var y = 0; y < 22; y++) {
      var sy = y - dy;
      out.push(sy >= 0 && sy < 22 ? grid[sy].slice() : new Array(24).fill('.'));
    }
    return out;
  }

  function shiftGridX(grid, dx) {
    if (!dx) return grid;
    return grid.map(function (row) {
      var next = new Array(24).fill('.');
      for (var x = 0; x < 24; x++) {
        var sx = x - dx;
        if (sx >= 0 && sx < 24) next[x] = row[sx];
      }
      return next;
    });
  }

  function buildAstraFrames(state) {
    var st = STATE_ALIASES[state] || state || 'idle';
    var frames = [];
    var f;

    if (st === 'idle') {
      for (f = 0; f < 8; f++) {
        var g = cloneGrid(ASTRA_BASE_ROWS);
        // Gentle wing hover on frames 2-5
        if (f >= 2 && f <= 5) {
          paintPixel(g, 4, 3, 'B'); paintPixel(g, 5, 3, 'B');
          paintPixel(g, 18, 3, 'B'); paintPixel(g, 19, 3, 'B');
        }
        // 1x2 pupil blink on frame 6
        if (f === 6) {
          for (var ex = 9; ex <= 14; ex++) paintPixel(g, ex, 9, 'N');
        }
        // Star core pulse
        if (f % 4 === 0) {
          paintPixel(g, 11, 14, 'C'); paintPixel(g, 12, 14, 'C');
        }
        frames.push(g);
      }
    } else if (st === 'thinking') {
      // Orbiting star ring above head (rows 0-3)
      var orbitXs = [8, 10, 13, 15, 13, 10];
      for (f = 0; f < 6; f++) {
        var g2 = cloneGrid(ASTRA_BASE_ROWS);
        var ox = orbitXs[f];
        var oy = f < 3 ? 1 : 2;
        paintPixel(g2, ox, oy, 'W');
        paintPixel(g2, ox - 1, oy, 'E');
        paintPixel(g2, ox + 1, oy, 'E');
        paintPixel(g2, 23 - ox, oy === 1 ? 2 : 1, 'B');
        // Eyes look upward (row 8-9 instead of 9-10)
        paintPixel(g2, 10, 8, 'E'); paintPixel(g2, 13, 8, 'E');
        paintPixel(g2, 10, 10, 'N'); paintPixel(g2, 13, 10, 'N');
        frames.push(g2);
      }
    } else if (st === 'typing') {
      for (f = 0; f < 4; f++) {
        var g3 = cloneGrid(ASTRA_BASE_ROWS);
        if (f % 2 === 1) g3 = shiftGridY(g3, 1);
        // Electric cyan/gold sparks at lower paw tips
        paintPixel(g3, f % 2 === 0 ? 3 : 4, 18, 'G');
        paintPixel(g3, f % 2 === 0 ? 20 : 19, 18, 'E');
        paintPixel(g3, 11, 20, f % 2 === 0 ? 'E' : 'W');
        paintPixel(g3, 12, 20, f % 2 === 0 ? 'W' : 'E');
        frames.push(g3);
      }
    } else if (st === 'working') {
      for (f = 0; f < 6; f++) {
        var g4 = cloneGrid(ASTRA_BASE_ROWS);
        if (f % 2 === 0) g4 = shiftGridY(g4, -1);
        // Bright cyan tool sparks on alternating sides
        var sx = f % 2 === 0 ? 2 : 21;
        paintPixel(g4, sx, 13, 'W');
        paintPixel(g4, sx, 14, 'E');
        paintPixel(g4, sx + (f % 2 === 0 ? -1 : 1), 14, 'G');
        paintPixel(g4, 11, 14, 'E'); paintPixel(g4, 12, 14, 'E');
        frames.push(g4);
      }
    } else if (st === 'subagent') {
      // Conducting twin mini orbital star-wisps
      for (f = 0; f < 6; f++) {
        var g5 = cloneGrid(ASTRA_BASE_ROWS);
        var dyL = (f % 3) - 1;
        var dyR = -dyL;
        // Left mini wisp
        paintPixel(g5, 1, 11 + dyL, 'W');
        paintPixel(g5, 2, 11 + dyL, 'E');
        paintPixel(g5, 1, 12 + dyL, 'B');
        // Right mini wisp
        paintPixel(g5, 21, 11 + dyR, 'E');
        paintPixel(g5, 22, 11 + dyR, 'W');
        paintPixel(g5, 22, 12 + dyR, 'B');
        // Raised baton arms
        paintPixel(g5, 4, 13, 'C'); paintPixel(g5, 19, 13, 'C');
        frames.push(g5);
      }
    } else if (st === 'waiting') {
      for (f = 0; f < 4; f++) {
        var g6 = cloneGrid(ASTRA_BASE_ROWS);
        var bob = f < 2 ? 0 : 1;
        // Golden pixel '!' beacon above head
        paintPixel(g6, 11, 0 + bob, 'G'); paintPixel(g6, 12, 0 + bob, 'G');
        paintPixel(g6, 11, 1 + bob, 'G'); paintPixel(g6, 12, 1 + bob, 'G');
        paintPixel(g6, 11, 2 + bob, 'G'); paintPixel(g6, 12, 2 + bob, 'G');
        paintPixel(g6, 11, 4 + bob, 'W'); paintPixel(g6, 12, 4 + bob, 'G');
        // Amber eyes
        paintPixel(g6, 10, 9, 'G'); paintPixel(g6, 10, 10, 'G');
        paintPixel(g6, 13, 9, 'G'); paintPixel(g6, 13, 10, 'G');
        frames.push(g6);
      }
    } else if (st === 'happy') {
      for (f = 0; f < 6; f++) {
        var g7 = cloneGrid(ASTRA_BASE_ROWS);
        if (f % 2 === 1) g7 = shiftGridY(g7, -1);
        // Happy curved '^ ^' eyes
        paintPixel(g7, 9, 10, 'N'); paintPixel(g7, 10, 9, 'M'); paintPixel(g7, 11, 10, 'N');
        paintPixel(g7, 12, 10, 'N'); paintPixel(g7, 13, 9, 'M'); paintPixel(g7, 14, 10, 'N');
        paintPixel(g7, 10, 10, 'N'); paintPixel(g7, 13, 10, 'N');
        // Star rain burst
        paintPixel(g7, 3, (f * 2) % 6, 'G');
        paintPixel(g7, 20, (f * 2 + 3) % 6, 'W');
        paintPixel(g7, 7, (f + 1) % 5, 'M');
        paintPixel(g7, 16, (f + 2) % 5, 'E');
        frames.push(g7);
      }
    } else if (st === 'error') {
      var offsets = [-1, 1, -1, 1, 0, 0];
      for (f = 0; f < 6; f++) {
        var g8 = shiftGridX(cloneGrid(ASTRA_BASE_ROWS), offsets[f]);
        // Crimson visor eyes
        paintPixel(g8, 10 + offsets[f], 9, 'R'); paintPixel(g8, 10 + offsets[f], 10, 'R');
        paintPixel(g8, 13 + offsets[f], 9, 'R'); paintPixel(g8, 13 + offsets[f], 10, 'R');
        // Alert X spark
        paintPixel(g8, 11, 1, 'R'); paintPixel(g8, 13, 1, 'R');
        paintPixel(g8, 12, 2, 'R');
        paintPixel(g8, 11, 3, 'R'); paintPixel(g8, 13, 3, 'R');
        frames.push(g8);
      }
    } else if (st === 'sleeping') {
      for (f = 0; f < 4; f++) {
        var g9 = shiftGridY(cloneGrid(ASTRA_BASE_ROWS), 2);
        // Closed sleeping horizontal eyes
        paintPixel(g9, 9, 12, 'P'); paintPixel(g9, 10, 12, 'P');
        paintPixel(g9, 13, 12, 'P'); paintPixel(g9, 14, 12, 'P');
        paintPixel(g9, 10, 11, 'N'); paintPixel(g9, 13, 11, 'N');
        // Floating Zzz
        var zy = 4 - (f % 3);
        paintPixel(g9, 17, zy, 'P'); paintPixel(g9, 18, zy, 'P');
        paintPixel(g9, 17, zy + 1, 'P'); paintPixel(g9, 18, zy + 1, 'P');
        paintPixel(g9, 20, Math.max(0, zy - 2), 'C'); paintPixel(g9, 21, Math.max(0, zy - 2), 'C');
        frames.push(g9);
      }
    } else {
      // poke-left / poke-right / tickle
      var dx = st === 'poke-left' ? 1 : st === 'poke-right' ? -1 : 0;
      for (f = 0; f < 4; f++) {
        var g10 = shiftGridY(shiftGridX(cloneGrid(ASTRA_BASE_ROWS), f < 2 ? dx : 0), f === 1 ? -1 : 0);
        paintPixel(g10, 5, 2, 'W');
        paintPixel(g10, 18, 2, 'W');
        frames.push(g10);
      }
    }

    return frames;
  }

  function renderAstraSvg(state) {
    var frames = buildAstraFrames(state);
    var grid = frames[0] || [];
    var rects = [];
    for (var y = 0; y < grid.length; y++) {
      var row = grid[y];
      for (var x = 0; x < row.length; x++) {
        var ch = row[x];
        if (ch !== '.' && ASTRA_PALETTE[ch]) {
          rects.push('<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + ASTRA_PALETTE[ch] + '"/>');
        }
      }
    }
    return '<svg viewBox="0 0 24 22" width="48" height="44" shape-rendering="crispEdges" aria-hidden="true">' + rects.join('') + '</svg>';
  }

  // ── Shared Image Loader Cache for Clawd / Deepy ──────────────────────────────
  var imageCache = new Map();
  function loadSpriteImage(dataUri, onReady) {
    if (!dataUri) return null;
    var entry = imageCache.get(dataUri);
    if (entry) {
      if (!entry.loaded && typeof onReady === 'function') entry.waiters.push(onReady);
      return entry;
    }
    if (typeof Image === 'undefined') return null;
    entry = { img: new Image(), loaded: false, waiters: typeof onReady === 'function' ? [onReady] : [] };
    entry.img.onload = function () {
      entry.loaded = true;
      var ws = entry.waiters.slice();
      entry.waiters.length = 0;
      for (var i = 0; i < ws.length; i++) {
        try { ws[i](); } catch (_e) {}
      }
    };
    entry.img.src = dataUri;
    imageCache.set(dataUri, entry);
    return entry;
  }

  function ensureStageStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ag-studio-mascot-stage-style')) return;
    var s = document.createElement('style');
    s.id = 'ag-studio-mascot-stage-style';
    s.textContent = [
      '.ags-mascot-stage { position:absolute; bottom:100%; z-index:45; display:inline-flex; flex-direction:column; align-items:center; pointer-events:none; user-select:none; transition:transform 160ms cubic-bezier(.22,1,.36,1); }',
      '.ags-mascot-stage[data-align="right"] { right:16px; transform-origin:bottom right; }',
      '.ags-mascot-stage[data-align="center"] { left:50%; transform-origin:bottom center; }',
      '.ags-mascot-stage[data-align="left"] { left:16px; transform-origin:bottom left; }',
      '.ags-mascot-hit { position:relative; display:inline-flex; align-items:flex-end; justify-content:center; pointer-events:auto; cursor:pointer; }',
      '.ags-mascot-canvas { display:block; image-rendering:pixelated; image-rendering:crisp-edges; }',
      '.ags-mascot-badge { position:absolute; bottom:calc(100% + 2px); left:50%; transform:translateX(-50%) translateY(4px); font-family:var(--ags-font-ui,system-ui,sans-serif); font-size:11px; line-height:1.2; white-space:nowrap; padding:3px 8px; border-radius:999px; background:var(--ags-bg-surface,#18181b); color:var(--ags-text-primary,#f4f4f5); border:1px solid var(--ags-border,rgba(148,163,184,.26)); box-shadow:0 4px 12px rgba(0,0,0,.18); opacity:0; pointer-events:none; transition:opacity 140ms ease, transform 140ms ease; }',
      '.ags-mascot-hit:hover .ags-mascot-badge, .ags-mascot-stage[data-pinned-tip="1"] .ags-mascot-badge { opacity:1; transform:translateX(-50%) translateY(0); }',
      '.ags-mascot-stage[data-state="sleeping"] .ags-mascot-canvas { opacity:0.82; }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function createMascotStage(options) {
    if (typeof document === 'undefined') return null;
    ensureStageStyles();
    var opts = options || {};

    var stageEl = document.createElement('div');
    stageEl.className = 'ags-mascot-stage';
    stageEl.setAttribute('data-ag-studio-ignore', 'true');
    stageEl.setAttribute('data-ag-no-i18n', 'true');
    stageEl.setAttribute('aria-hidden', 'true');

    var hitEl = document.createElement('div');
    hitEl.className = 'ags-mascot-hit';

    var canvas = document.createElement('canvas');
    canvas.className = 'ags-mascot-canvas';
    var ctx = canvas.getContext('2d');

    var badge = document.createElement('span');
    badge.className = 'ags-mascot-badge';

    hitEl.appendChild(canvas);
    hitEl.appendChild(badge);
    stageEl.appendChild(hitEl);

    var scratchCanvas = document.createElement('canvas');
    var scratchCtx = scratchCanvas.getContext('2d');

    var cur = {
      enabled: opts.enabled !== false,
      style: opts.style || 'clawd',
      state: STATE_ALIASES[opts.state] || opts.state || 'idle',
      scale: Number(opts.scale || 1),
      align: opts.align || 'right',
      offsetX: Number(opts.offsetX || 0),
      offsetY: Number(opts.offsetY || 0)
    };

    var frameIdx = 0;
    var timerId = 0;
    var reaction = null; // { sheet: 'poke-left' | 'poke-right' | 'tickle', until: number }
    var clickStamps = [];
    var currentAnchor = null;

    function getSprites() {
      return globalScope.__AG_STUDIO_MASCOT_SPRITES__ || null;
    }

    function isMotionReduced() {
      try {
        return Boolean(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      } catch (_e) {
        return false;
      }
    }

    function getInkColor() {
      try {
        if (typeof getComputedStyle === 'function') {
          var v = getComputedStyle(document.documentElement).getPropertyValue('--ags-text-secondary').trim();
          if (v) return v;
        }
      } catch (_e) {}
      return '#91888A';
    }

    function resolveLogicalKey() {
      if (reaction && Date.now() < reaction.until) return reaction.sheet;
      reaction = null;
      return cur.state;
    }

    function applyGeometry() {
      var w = 104;
      var h = 72;
      if (cur.style === 'deepy') {
        w = 104;
        h = 104;
      } else if (cur.style === 'astra') {
        w = 48;
        h = 44;
      }
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';

      stageEl.setAttribute('data-align', cur.align);
      stageEl.setAttribute('data-state', cur.state);
      stageEl.setAttribute('data-mascot-style', cur.style);

      var tx = cur.align === 'center' ? ('calc(-50% + ' + cur.offsetX + 'px)') : (cur.offsetX + 'px');
      var ty = (-cur.offsetY) + 'px';
      stageEl.style.transform = 'translate(' + tx + ', ' + ty + ') scale(' + cur.scale + ')';
      if (cur.align === 'right') {
        stageEl.style.left = '';
        stageEl.style.right = '16px';
      } else if (cur.align === 'left') {
        stageEl.style.right = '';
        stageEl.style.left = '16px';
      } else {
        stageEl.style.right = '';
        stageEl.style.left = '50%';
      }

      var info = MASCOT_STATES[cur.state] || MASCOT_STATES.idle;
      badge.textContent = info.badge + ' ' + info.label;
    }

    function drawFrame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      var logicalKey = resolveLogicalKey();

      if (cur.style === 'astra') {
        var aFrames = buildAstraFrames(logicalKey);
        var af = isMotionReduced() ? 0 : (frameIdx % aFrames.length);
        var grid = aFrames[af] || aFrames[0];
        for (var y = 0; y < grid.length; y++) {
          var row = grid[y];
          for (var x = 0; x < row.length; x++) {
            var ch = row[x];
            if (ch !== '.' && ASTRA_PALETTE[ch]) {
              ctx.fillStyle = ASTRA_PALETTE[ch];
              ctx.fillRect(x * 2, y * 2, 2, 2);
            }
          }
        }
        return;
      }

      var sprites = getSprites();
      if (!sprites) {
        // Fallback minimal pixel silhouette if sprites failed to load
        ctx.fillStyle = cur.style === 'deepy' ? '#3B82F6' : '#D97757';
        ctx.fillRect(28, 36, 48, 28);
        return;
      }

      var sheetKey = STATE_TO_SHEET[logicalKey] || 'idle';

      if (cur.style === 'deepy') {
        var dSheet = (sprites.deepy && (sprites.deepy[sheetKey] || sprites.deepy.idle)) || null;
        if (!dSheet) return;
        var dEntry = loadSpriteImage(dSheet.dataUri, drawFrame);
        if (!dEntry || !dEntry.loaded) return;
        var df = isMotionReduced() ? (dSheet.still || 0) : (frameIdx % dSheet.frames);
        var dCols = dSheet.columns || dSheet.frames;
        var db = dSheet.box; // [x, y, w, h] in 52x52 logical grid
        var dsx = (df % dCols) * db[2];
        var dsy = Math.floor(df / dCols) * db[3];
        ctx.drawImage(dEntry.img, dsx, dsy, db[2], db[3], db[0] * 2, db[1] * 2, db[2] * 2, db[3] * 2);
        return;
      }

      // Clawd (crab)
      var cSheet = (sprites.crab && (sprites.crab[sheetKey] || sprites.crab.idle)) || null;
      if (!cSheet) return;
      var bodyEntry = loadSpriteImage(cSheet.body, drawFrame);
      var inkEntry = cSheet.ink ? loadSpriteImage(cSheet.ink, drawFrame) : null;
      if (!bodyEntry || !bodyEntry.loaded) return;

      var cf = isMotionReduced() ? (cSheet.still || 0) : (frameIdx % cSheet.frames);
      var cCols = cSheet.columns || 8;
      var cb = cSheet.box; // [x, y, w, h] in 52x36 grid
      var csx = (cf % cCols) * cb[2];
      var csy = Math.floor(cf / cCols) * cb[3];

      ctx.drawImage(bodyEntry.img, csx, csy, cb[2], cb[3], cb[0] * 2, cb[1] * 2, cb[2] * 2, cb[3] * 2);

      if (inkEntry && inkEntry.loaded && scratchCtx) {
        if (scratchCanvas.width !== cb[2] || scratchCanvas.height !== cb[3]) {
          scratchCanvas.width = cb[2];
          scratchCanvas.height = cb[3];
        }
        scratchCtx.clearRect(0, 0, cb[2], cb[3]);
        scratchCtx.globalCompositeOperation = 'source-over';
        scratchCtx.drawImage(inkEntry.img, csx, csy, cb[2], cb[3], 0, 0, cb[2], cb[3]);
        scratchCtx.globalCompositeOperation = 'source-in';
        scratchCtx.fillStyle = getInkColor();
        scratchCtx.fillRect(0, 0, cb[2], cb[3]);
        scratchCtx.globalCompositeOperation = 'source-over';
        ctx.drawImage(scratchCanvas, 0, 0, cb[2], cb[3], cb[0] * 2, cb[1] * 2, cb[2] * 2, cb[3] * 2);
      }
    }

    function stopAnimLoop() {
      if (timerId) {
        clearTimeout(timerId);
        timerId = 0;
      }
    }

    function getStepIntervalMs() {
      var logicalKey = resolveLogicalKey();
      if (isMotionReduced() || (typeof document !== 'undefined' && document.hidden) || !cur.enabled || !currentAnchor) {
        return 0;
      }
      if (logicalKey === 'sleeping') return 900; // ultra-low-power Zzz drift
      if (cur.style === 'astra') {
        return logicalKey === 'idle' ? 220 : logicalKey === 'error' ? 75 : 120;
      }
      var sprites = getSprites();
      if (cur.style === 'deepy') return (sprites && sprites.deepyFrameMs) || 95;
      return (sprites && sprites.crabFrameMs) || 85;
    }

    function scheduleNextTick() {
      stopAnimLoop();
      var ms = getStepIntervalMs();
      if (ms <= 0) return;
      timerId = setTimeout(function () {
        timerId = 0;
        frameIdx = (frameIdx + 1) % 1024;
        drawFrame();
        scheduleNextTick();
      }, ms);
    }

    hitEl.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var now = Date.now();
      clickStamps = clickStamps.filter(function (t) { return now - t < 500; });
      clickStamps.push(now);

      if (clickStamps.length >= 4) {
        clickStamps = [];
        reaction = { sheet: 'tickle', until: now + 1300 };
      } else {
        var r = hitEl.getBoundingClientRect();
        var isLeft = ev.clientX - r.left < r.width / 2;
        reaction = { sheet: isLeft ? 'poke-left' : 'poke-right', until: now + 900 };
      }
      frameIdx = 0;
      drawFrame();
      scheduleNextTick();
      if (typeof opts.onPoke === 'function') opts.onPoke(reaction.sheet);
    });

    hitEl.addEventListener('dblclick', function (ev) {
      ev.stopPropagation();
      if (typeof opts.onOpenDrawer === 'function') opts.onOpenDrawer();
    });

    function mountTo(anchorEl) {
      if (!cur.enabled || !anchorEl || anchorEl.isConnected === false) {
        if (stageEl.parentElement) stageEl.parentElement.removeChild(stageEl);
        currentAnchor = null;
        stopAnimLoop();
        return;
      }
      currentAnchor = anchorEl;
      if (stageEl.parentElement !== anchorEl) {
        anchorEl.appendChild(stageEl);
      }
      applyGeometry();
      drawFrame();
      scheduleNextTick();
    }

    function update(next) {
      if (!next) return;
      var stateChanged = false;
      var styleChanged = false;
      if (typeof next.enabled === 'boolean' && next.enabled !== cur.enabled) {
        cur.enabled = next.enabled;
        stateChanged = true;
      }
      if (next.style && next.style !== cur.style) {
        cur.style = next.style;
        styleChanged = true;
      }
      if (next.state) {
        var norm = STATE_ALIASES[next.state] || next.state;
        if (MASCOT_STATES[norm] && norm !== cur.state) {
          cur.state = norm;
          stateChanged = true;
        }
      }
      if (next.scale != null) cur.scale = Number(next.scale) || 1;
      if (next.align) cur.align = next.align;
      if (next.offsetX != null) cur.offsetX = Number(next.offsetX) || 0;
      if (next.offsetY != null) cur.offsetY = Number(next.offsetY) || 0;

      if (!cur.enabled) {
        if (stageEl.parentElement) stageEl.parentElement.removeChild(stageEl);
        stopAnimLoop();
        return;
      }
      if (styleChanged || stateChanged) frameIdx = 0;
      applyGeometry();
      drawFrame();
      scheduleNextTick();
    }

    function destroy() {
      stopAnimLoop();
      if (stageEl.parentElement) stageEl.parentElement.removeChild(stageEl);
      currentAnchor = null;
    }

    applyGeometry();

    return {
      element: stageEl,
      mountTo: mountTo,
      update: update,
      destroy: destroy,
      getState: function () { return Object.assign({}, cur); }
    };
  }

  var api = {
    MASCOT_STATES: MASCOT_STATES,
    renderAstraSvg: renderAstraSvg,
    buildAstraFrames: buildAstraFrames,
    createMascotStage: createMascotStage
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_MASCOT_STAGE__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);


(function (globalScope) {
  'use strict';

  function formatCompactNumber(n) {
    var num = Number(n || 0);
    if (!Number.isFinite(num) || num <= 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(Math.round(num));
  }

  function ensureHudStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ag-studio-hud-style')) return;
    var s = document.createElement('style');
    s.id = 'ag-studio-hud-style';
    s.textContent = [
      '.ags-hud-wrap { display:inline-flex; align-items:center; justify-content:center; gap:8px; pointer-events:auto; z-index:2147483000; font-family:var(--ags-font-ui, system-ui, sans-serif); font-variant-numeric:tabular-nums; }',
      '.ags-hud-floating { position:fixed; right:18px; bottom:16px; }',
      '.ags-hud-inline { margin:2px auto; }',
      '.ags-vial-btn { position:relative; display:inline-flex; align-items:center; justify-content:center; width:26px; height:42px; padding:0; border:none; background:transparent; cursor:pointer; flex-shrink:0; transition:transform 140ms ease; }',
      '.ags-vial-btn:hover { transform:translateY(-1px) scale(1.06); }',
      '.ags-vial-cv { display:block; width:24px; height:42px; }',
      '.ags-hud-pill { display:inline-flex; align-items:center; gap:8px; height:28px; padding:0 12px; border-radius:999px; border:1px solid var(--ags-border, rgba(148,163,184,0.22)); background:color-mix(in srgb, var(--ags-bg-surface, #18181b) 88%, transparent); color:var(--ags-text-secondary, #a1a1aa); font-size:11.5px; cursor:pointer; backdrop-filter:blur(12px); box-shadow:0 4px 16px rgba(0,0,0,0.10); transition:border-color 140ms ease, color 140ms ease, box-shadow 140ms ease; white-space:nowrap; }',
      '.ags-hud-pill:hover { border-color:var(--ags-accent, #D97757); color:var(--ags-text-primary, #f4f4f5); box-shadow:0 6px 20px rgba(0,0,0,0.16); }',
      '.ags-hud-sep { opacity:0.32; }',
      '.ags-hud-strong { color:var(--ags-text-primary, #f4f4f5); font-weight:600; }',
      '.ags-hud-quota-low { color:var(--ags-warning, #D9822B); font-weight:600; }',
      '.ags-hud-crit { color:var(--ags-danger, #EF4444); font-weight:600; }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  /**
   * Compact 12-node damped shallow-water physics kernel (0fps when settled).
   */
  function createMiniVialPhysics() {
    var N = 12;
    var waveH = new Float32Array(N);
    var waveV = new Float32Array(N);
    var fill = 0.0;
    var targetFill = 0.0;
    var tilt = 0;
    var tiltVel = 0;
    var streaming = false;
    var clock = 0;
    var bubbles = [];
    var dustCd = 0.35;

    function step(dt) {
      var df = targetFill - fill;
      if (Math.abs(df) < 0.0004) fill = targetFill;
      else fill += df * Math.min(1, dt * 6.5);

      var torque = 0;
      if (streaming) {
        clock += dt;
        torque = Math.sin(clock * 2.1) * 0.28 + Math.sin(clock * 3.7 + 0.9) * 0.12;
      }
      var accT = -2 * 0.42 * 7.5 * tiltVel - 7.5 * 7.5 * tilt + torque;
      tiltVel += accT * dt;
      tilt = Math.max(-0.36, Math.min(0.36, tilt + tiltVel * dt));
      if (!streaming && Math.abs(tilt) < 0.0005 && Math.abs(tiltVel) < 0.002) {
        tilt = 0;
        tiltVel = 0;
      }

      for (var i = 0; i < N; i++) {
        var hL = i > 0 ? waveH[i - 1] : waveH[0];
        var hR = i < N - 1 ? waveH[i + 1] : waveH[N - 1];
        var norm = (i / (N - 1)) * 2 - 1;
        var acc = 260 * (hL + hR - 2 * waveH[i]) - 3.2 * waveV[i] - 28 * waveH[i] - accT * 0.25 * norm;
        waveV[i] += acc * dt;
      }
      var energy = 0;
      for (var j = 0; j < N; j++) {
        waveH[j] = Math.max(-4, Math.min(4, waveH[j] + waveV[j] * dt));
        energy += Math.abs(waveH[j]) + Math.abs(waveV[j]) * 0.05;
      }
      if (!streaming && tilt === 0 && energy < 0.03) {
        waveH.fill(0);
        waveV.fill(0);
      }

      if (streaming && fill > 0.08) {
        dustCd -= dt;
        if (dustCd <= 0 && bubbles.length < 4) {
          dustCd = 0.45 + Math.random() * 0.4;
          bubbles.push({
            x: (Math.random() - 0.5) * 8,
            y: 1,
            vy: 0.45 + Math.random() * 0.35,
            r: 0.65 + Math.random() * 0.55
          });
        }
      }
      for (var b = bubbles.length - 1; b >= 0; b--) {
        bubbles[b].y -= bubbles[b].vy * dt;
        if (bubbles[b].y <= 1 - Math.max(0.05, fill)) {
          bubbles.splice(b, 1);
        }
      }
    }

    function impulse(power) {
      var p = Math.max(-2.5, Math.min(2.5, Number(power) || 1));
      tiltVel += p * 1.4;
      for (var i = 0; i < N; i++) {
        var norm = (i / (N - 1)) * 2 - 1;
        waveV[i] += norm * p * 12;
      }
    }

    function isSettled() {
      if (streaming || bubbles.length > 0) return false;
      if (Math.abs(targetFill - fill) >= 0.001) return false;
      if (Math.abs(tilt) >= 0.003 || Math.abs(tiltVel) >= 0.01) return false;
      var e = 0;
      for (var i = 0; i < N; i++) e += Math.abs(waveH[i]) + Math.abs(waveV[i]) * 0.05;
      return e < 0.06;
    }

    return {
      waveH: waveH,
      bubbles: bubbles,
      setTargetFill: function (v) { targetFill = Math.max(0, Math.min(1, Number(v) || 0)); },
      snapFill: function (v) { targetFill = fill = Math.max(0, Math.min(1, Number(v) || 0)); },
      setStreaming: function (on) { streaming = Boolean(on); },
      getFill: function () { return fill; },
      getTilt: function () { return tilt; },
      impulse: impulse,
      step: step,
      isSettled: isSettled
    };
  }

  function createComposerHud(options) {
    if (typeof document === 'undefined') return null;
    ensureHudStyles();
    var opts = options || {};

    var wrap = document.createElement('div');
    wrap.className = 'ags-hud-wrap ags-hud-floating';
    wrap.setAttribute('data-ag-studio-ignore', 'true');
    wrap.setAttribute('data-ag-no-i18n', 'true');

    // 1. Mini Breathing Water Vial Button
    var vialBtn = document.createElement('button');
    vialBtn.type = 'button';
    vialBtn.className = 'ags-vial-btn';
    vialBtn.title = '512K 上下文呼吸试管 — 点击打开 Studio';
    var vialCv = document.createElement('canvas');
    vialCv.className = 'ags-vial-cv';
    vialBtn.appendChild(vialCv);

    // 2. Minimalist Capsule Pill
    var pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'ags-hud-pill';

    var onOpen = function () {
      if (typeof opts.onToggleDrawer === 'function') opts.onToggleDrawer();
    };
    vialBtn.addEventListener('click', function () {
      phys.impulse(1.4);
      wakeVial();
      onOpen();
    });
    vialBtn.addEventListener('pointerenter', function () {
      phys.impulse(0.65);
      wakeVial();
    });
    pill.addEventListener('click', onOpen);

    wrap.appendChild(vialBtn);
    wrap.appendChild(pill);

    var phys = createMiniVialPhysics();
    var rafId = 0;
    var lastFrameAt = 0;
    var currentCtx = vialCv.getContext('2d');
    var lastVisualSig = '';
    var isDark = true;
    var accentHex = '#3B82F6';
    var isStreaming = false;
    var isCritical = false;

    function resolveVialColors() {
      var mode = document.documentElement.getAttribute('data-ags-mode');
      isDark = mode !== 'light';
      var themeId = document.documentElement.getAttribute('data-ags-theme') || 'claude';
      var accentCss = '';
      try {
        accentCss = getComputedStyle(document.documentElement).getPropertyValue('--ags-accent').trim();
      } catch (_e) {}
      if (isCritical) {
        accentHex = '#EA580C';
      } else if (themeId === 'claude') {
        accentHex = accentCss || (isDark ? '#E08666' : '#D97757');
      } else {
        accentHex = accentCss || (isDark ? '#60A5FA' : '#2563EB');
      }
    }

    function drawRoundedRectPath(ctx, x, y, w, h, r) {
      var rad = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.lineTo(x + w - rad, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
      ctx.lineTo(x + w, y + h - rad);
      ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
      ctx.lineTo(x + rad, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
      ctx.lineTo(x, y + rad);
      ctx.quadraticCurveTo(x, y, x + rad, y);
      ctx.closePath();
    }

    function renderVialFrame() {
      if (!currentCtx) return;
      var cssW = 24;
      var cssH = 42;
      var dpr = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2);
      var tw = Math.round(cssW * dpr);
      var th = Math.round(cssH * dpr);
      if (vialCv.width !== tw || vialCv.height !== th) {
        vialCv.width = tw;
        vialCv.height = th;
      }

      var ctx = currentCtx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      resolveVialColors();

      var cx = cssW / 2;
      var tubeX = 5;
      var tubeY = 3;
      var tubeW = 14;
      var tubeH = 36;
      var tubeR = 6.5;

      // 1. Glass air chamber background
      drawRoundedRectPath(ctx, tubeX, tubeY, tubeW, tubeH, tubeR);
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(226, 232, 240, 0.55)';
      ctx.fill();

      // 2. Clipped shallow-water liquid column
      var fillFrac = phys.getFill();
      if (fillFrac > 0.005) {
        ctx.save();
        drawRoundedRectPath(ctx, tubeX + 1.2, tubeY + 1.2, tubeW - 2.4, tubeH - 2.4, tubeR - 1);
        ctx.clip();

        var innerTop = tubeY + 2;
        var innerBot = tubeY + tubeH - 1.5;
        var baseSurfY = innerBot - fillFrac * (innerBot - innerTop);
        var tilt = phys.getTilt();
        var waveH = phys.waveH;
        var segs = waveH.length - 1;

        ctx.beginPath();
        for (var i = 0; i <= segs; i++) {
          var u = i / segs;
          var x = (tubeX + 1) + u * (tubeW - 2);
          var slope = Math.tan(tilt) * (x - cx) * 0.85;
          var y = baseSurfY + slope + (waveH[i] || 0) * 0.65;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(tubeX + tubeW, innerBot + 4);
        ctx.lineTo(tubeX, innerBot + 4);
        ctx.closePath();

        var grad = ctx.createLinearGradient(0, baseSurfY, 0, innerBot);
        if (isCritical) {
          grad.addColorStop(0, '#F59E0B');
          grad.addColorStop(1, '#DC2626');
        } else {
          grad.addColorStop(0, accentHex);
          grad.addColorStop(1, isDark ? 'rgba(30, 64, 175, 0.92)' : 'rgba(29, 78, 216, 0.92)');
        }
        ctx.fillStyle = grad;
        ctx.fill();

        // Crisp meniscus highlight
        ctx.beginPath();
        for (var m = 0; m <= segs; m++) {
          var mu = m / segs;
          var mx = (tubeX + 1) + mu * (tubeW - 2);
          var mSlope = Math.tan(tilt) * (mx - cx) * 0.85;
          var my = baseSurfY + mSlope + (waveH[m] || 0) * 0.65;
          if (m === 0) ctx.moveTo(mx, my);
          else ctx.lineTo(mx, my);
        }
        ctx.strokeStyle = isDark ? 'rgba(224, 242, 254, 0.88)' : 'rgba(255, 255, 255, 0.92)';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Streaming rising micro-bubbles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
        for (var b = 0; b < phys.bubbles.length; b++) {
          var bub = phys.bubbles[b];
          var by = innerBot - (1 - bub.y) * (innerBot - innerTop);
          if (by > baseSurfY + 2) {
            ctx.beginPath();
            ctx.arc(cx + bub.x * 0.4, by, bub.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 3. Laser tick marks on right glass wall
      ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(51, 65, 85, 0.35)';
      for (var t = 1; t <= 3; t++) {
        var ty = tubeY + (tubeH * t) / 4;
        ctx.fillRect(tubeX + tubeW - 3.5, ty, 2.2, 0.8);
      }

      // 4. Vertical glass refraction thread + outer borosilicate outline
      ctx.fillStyle = isDark ? 'rgba(226, 232, 240, 0.25)' : 'rgba(255, 255, 255, 0.55)';
      ctx.fillRect(tubeX + 2.5, tubeY + 6, 1, tubeH - 12);

      drawRoundedRectPath(ctx, tubeX, tubeY, tubeW, tubeH, tubeR);
      ctx.strokeStyle = isCritical
        ? 'rgba(234, 88, 12, 0.78)'
        : isDark ? 'rgba(148, 163, 184, 0.52)' : 'rgba(71, 85, 105, 0.45)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    function stepLoop(now) {
      rafId = 0;
      if (typeof document !== 'undefined' && document.hidden) return;
      var dt = lastFrameAt > 0 ? Math.max(0.004, Math.min(0.05, (now - lastFrameAt) / 1000)) : 0.016;
      lastFrameAt = now;
      phys.step(dt);
      renderVialFrame();
      if (!phys.isSettled() && typeof requestAnimationFrame === 'function') {
        rafId = requestAnimationFrame(stepLoop);
      } else {
        lastFrameAt = 0;
      }
    }

    function wakeVial() {
      renderVialFrame();
      if (rafId || phys.isSettled()) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      if (typeof requestAnimationFrame === 'function') {
        lastFrameAt = performance.now ? performance.now() : Date.now();
        rafId = requestAnimationFrame(stepLoop);
      }
    }

    function mountToSlot(positionMode, composer) {
      var anchors = globalScope.__AG_STUDIO_ANCHORS__;
      var mode = positionMode || 'composer';
      if (mode === 'composer' && anchors && composer) {
        var bottomSlot = anchors.ensureComposerBottomSlot(composer);
        if (bottomSlot) {
          wrap.className = 'ags-hud-wrap ags-hud-inline';
          if (wrap.parentElement !== bottomSlot) {
            bottomSlot.appendChild(wrap);
          }
          return;
        }
      }
      if (anchors) anchors.parkComposerBottomSlot();
      wrap.className = 'ags-hud-wrap ags-hud-floating';
      var host = document.getElementById('ag-studio-root') || document.body;
      if (host && wrap.parentElement !== host) {
        host.appendChild(wrap);
      }
    }

    function update(snapshot, cfg, composer) {
      var hudCfg = (cfg && cfg.hud) || {};
      if (hudCfg.enabled === false) {
        wrap.style.display = 'none';
        if (rafId && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        return;
      }
      wrap.style.display = 'inline-flex';
      vialBtn.style.display = hudCfg.showVial === false ? 'none' : 'inline-flex';
      mountToSlot(hudCfg.position || 'composer', composer);

      var ctx = (snapshot && snapshot.context) || {};
      var used = Number(ctx.usedTokens || 0);
      var limit = Number(ctx.contextLimit || 200000);
      var ratio = ctx.usageRatio != null ? Number(ctx.usageRatio) : (limit > 0 ? used / limit : 0);
      if (!Number.isFinite(ratio) || ratio < 0) ratio = 0;
      var pct = Math.min(100, Math.round(ratio * 100));
      var speed = Number((ctx.speed && (ctx.speed.tokPerSec || ctx.speed.tps)) || 0);
      var ttft = Number((ctx.speed && ctx.speed.ttftMs) || 0);
      var cachePct = Math.round(Number(ctx.cacheHitRate || 0) * 100);
      var cost = Number((snapshot && snapshot.estimatedSessionCostUsd) || 0);
      var generating = Boolean(ctx.speed && ctx.speed.isGenerating);

      var pools = (snapshot && snapshot.quota && snapshot.quota.pools) || [];
      var minQuotaPct = null;
      for (var i = 0; i < pools.length; i++) {
        if (typeof pools[i].remainingPercent === 'number') {
          if (minQuotaPct === null || pools[i].remainingPercent < minQuotaPct) {
            minQuotaPct = pools[i].remainingPercent;
          }
        }
      }

      isCritical = ratio >= 0.85;
      isStreaming = generating;
      phys.setTargetFill(ratio);
      phys.setStreaming(generating);

      var visSig = [
        Math.round(ratio * 100),
        generating ? 1 : 0,
        document.documentElement.getAttribute('data-ags-theme') || '',
        document.documentElement.getAttribute('data-ags-mode') || ''
      ].join('|');
      if (visSig !== lastVisualSig) {
        lastVisualSig = visSig;
        if (generating) phys.impulse(0.45);
        wakeVial();
      }

      pill.title = '模型: ' + (ctx.model || '未检测') +
        ' · 缓存命中: ' + cachePct + '%' +
        (ttft > 0 ? (' · 首字延迟: ' + Math.round(ttft) + 'ms') : '') +
        ' — 点击打开 Antigravity Studio (Ctrl+Shift+G)';

      var parts = [];
      if (hudCfg.showContext !== false) {
        var pctCls = pct >= 85 ? 'ags-hud-crit' : 'ags-hud-strong';
        parts.push(
          '<span class="' + pctCls + '">' + pct + '%</span>' +
          '<span class="ags-hud-sep">·</span>' +
          '<span>' + formatCompactNumber(used) + '/' + formatCompactNumber(limit) + '</span>'
        );
      }
      if (hudCfg.showSpeed !== false) {
        parts.push('<span>' + Math.round(speed) + ' tok/s</span>');
      }
      if (hudCfg.showCost !== false) {
        parts.push('<span>$' + cost.toFixed(2) + '</span>');
      }
      if (hudCfg.showQuotaBadge !== false && minQuotaPct !== null) {
        var qCls = minQuotaPct <= 20 ? 'ags-hud-quota-low' : '';
        parts.push('<span class="' + qCls + '">额度 ' + Math.round(minQuotaPct) + '%</span>');
      }
      if (!parts.length) {
        parts.push('<span class="ags-hud-strong">Studio</span>');
      }
      pill.innerHTML = parts.join('<span class="ags-hud-sep">·</span>');
    }

    function destroy() {
      if (rafId && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (wrap.parentElement) wrap.parentElement.removeChild(wrap);
    }

    return {
      element: wrap,
      mountToBestSpot: function (mode, comp) { mountToSlot(mode, comp); },
      update: update,
      destroy: destroy
    };
  }

  var api = {
    formatCompactNumber: formatCompactNumber,
    createMiniVialPhysics: createMiniVialPhysics,
    createComposerHud: createComposerHud
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_HUD__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);


(function (globalScope) {
  'use strict';

  var HOME_BOOKS = [
    { tokens: 7607, zh: '《道德经》', zhTW: '《道德經》', en: 'Tao Te Ching' },
    { tokens: 37248, zh: '《爱丽丝漫游奇境》', zhTW: '《愛麗絲夢遊仙境》', en: "Alice's Adventures in Wonderland" },
    { tokens: 65763, zh: '《了不起的盖茨比》', zhTW: '《大亨小傳》', en: 'The Great Gatsby' },
    { tokens: 115000, zh: '《活着》', zhTW: '《活著》', en: 'To Live' },
    { tokens: 136278, zh: '《一九八四》', zhTW: '《一九八四》', en: 'Nineteen Eighty-Four' },
    { tokens: 202000, zh: '《三体》', zhTW: '《三體》', en: 'The Three-Body Problem' },
    { tokens: 638009, zh: '《三国演义》', zhTW: '《三國演義》', en: 'Romance of the Three Kingdoms' },
    { tokens: 783200, zh: '《西游记》', zhTW: '《西遊記》', en: 'Journey to the West' },
    { tokens: 903956, zh: '《红楼梦》', zhTW: '《紅樓夢》', en: 'Dream of the Red Chamber' },
    { tokens: 998000, zh: '《平凡的世界》', zhTW: '《平凡的世界》', en: 'Ordinary World' }
  ];

  var MODEL_COLORS = [
    'var(--ags-accent, #D97757)',
    '#3B82F6',
    '#10B981',
    '#8B5CF6',
    '#F59E0B',
    '#EC4899'
  ];

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtCompact(n) {
    var v = Number(n || 0);
    if (!Number.isFinite(v) || v <= 0) return '0';
    if (v >= 1e9) return (v / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(Math.round(v));
  }

  function fmtCount(n) {
    var v = Math.round(Number(n || 0));
    return Number.isFinite(v) ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0';
  }

  function fmtPeakHour(hour, lang) {
    if (hour == null || hour === '' || !Number.isFinite(Number(hour))) return '—';
    var h = ((Math.floor(Number(hour)) % 24) + 24) % 24;
    var h12 = h % 12 === 0 ? 12 : h % 12;
    if (lang === 'en') return h12 + (h < 12 ? ' AM' : ' PM');
    if (lang === 'zh-TW') return (h < 12 ? '上午 ' : '下午 ') + h12 + ' 點';
    return (h < 12 ? '上午 ' : '下午 ') + h12 + ' 点';
  }

  function formatFunBookText(totalTokens, lang, seed) {
    var tok = Number(totalTokens || 0);
    if (tok <= 0) {
      if (lang === 'en') return 'Start a conversation to illuminate your usage heatmap.';
      if (lang === 'zh-TW') return '開始對話後，這裡將即時繪製你的 Token 足跡。';
      return '开始对话后，这里将实时绘制你的 Token 足迹。';
    }
    var candidates = HOME_BOOKS.filter(function (b) { return tok >= b.tokens * 0.4; });
    var pool = candidates.length ? candidates : [HOME_BOOKS[0]];
    var book = pool[Math.floor((seed || 0) * pool.length) % pool.length] || HOME_BOOKS[HOME_BOOKS.length - 1];
    var ratio = (tok / book.tokens);
    var ratioStr = ratio >= 10 ? String(Math.round(ratio)) : ratio.toFixed(1).replace(/\.0$/, '');
    if (lang === 'en') {
      return 'Your token usage equals ' + ratioStr + '× ' + book.en + '.';
    }
    if (lang === 'zh-TW') {
      return '你的 Token 用量相當於 ' + ratioStr + ' 本' + (book.zhTW || book.zh) + '。';
    }
    return '你的 Token 用量相当于 ' + ratioStr + ' 本' + book.zh + '。';
  }

  function ensureHomeCardStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ag-studio-home-card-style')) return;
    var s = document.createElement('style');
    s.id = 'ag-studio-home-card-style';
    s.textContent = [
      '.ags-home-card { position:relative; border-radius:14px; border:1px solid var(--ags-border, rgba(148,163,184,.22)); background:color-mix(in srgb, var(--ags-bg-surface, #18181b) 92%, transparent); color:var(--ags-text-primary, #f4f4f5); padding:14px 16px; display:flex; flex-direction:column; gap:12px; font-family:var(--ags-font-ui, system-ui, sans-serif); font-variant-numeric:tabular-nums; box-shadow:0 8px 28px rgba(0,0,0,.08); backdrop-filter:blur(10px); }',
      '.ags-home-head { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }',
      '.ags-home-seg { display:inline-flex; padding:2px; border-radius:9px; background:var(--ags-bg-canvas, rgba(128,128,128,.08)); border:1px solid var(--ags-border, rgba(148,163,184,.18)); gap:2px; }',
      '.ags-home-seg-btn { border:none; background:transparent; color:var(--ags-text-secondary, #94a3b8); font-size:12px; font-weight:500; padding:4px 10px; border-radius:7px; cursor:pointer; transition:all 120ms ease; }',
      '.ags-home-seg-btn:hover { color:var(--ags-text-primary, #f4f4f5); }',
      '.ags-home-seg-btn.active { background:var(--ags-bg-surface, #27272a); color:var(--ags-accent, #D97757); font-weight:600; box-shadow:0 1px 3px rgba(0,0,0,.10); }',
      '.ags-home-kpis { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; }',
      '.ags-home-kpi { padding:9px 11px; border-radius:10px; border:1px solid var(--ags-border, rgba(148,163,184,.16)); background:var(--ags-bg-canvas, rgba(128,128,128,.05)); display:flex; flex-direction:column; gap:3px; min-width:0; }',
      '.ags-home-kpi-lbl { font-size:11px; color:var(--ags-text-secondary, #94a3b8); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
      '.ags-home-kpi-val { font-size:16px; font-weight:600; color:var(--ags-text-primary, #f4f4f5); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
      '.ags-home-heat-wrap { position:relative; display:flex; align-items:stretch; gap:6px; overflow-x:auto; padding:2px 0; }',
      '.ags-home-heat-days { display:grid; grid-template-rows:repeat(7, 1fr); gap:3px; font-size:9.5px; color:var(--ags-text-secondary, #94a3b8); align-items:center; padding-right:2px; flex-shrink:0; }',
      '.ags-home-heat-grid { display:grid; grid-template-rows:repeat(7, 11px); grid-auto-flow:column; grid-auto-columns:11px; gap:3px; flex:1; }',
      '.ags-home-heat-cell { width:11px; height:11px; border-radius:2.5px; background:var(--ags-bg-subtle, rgba(148,163,184,.16)); transition:transform 100ms ease; cursor:default; }',
      '.ags-home-heat-cell:hover { transform:scale(1.22); outline:1px solid var(--ags-accent, #D97757); }',
      '.ags-home-heat-cell[data-lvl="1"] { background:color-mix(in srgb, var(--ags-accent, #D97757) 26%, var(--ags-bg-subtle, transparent)); }',
      '.ags-home-heat-cell[data-lvl="2"] { background:color-mix(in srgb, var(--ags-accent, #D97757) 48%, var(--ags-bg-subtle, transparent)); }',
      '.ags-home-heat-cell[data-lvl="3"] { background:color-mix(in srgb, var(--ags-accent, #D97757) 72%, var(--ags-bg-subtle, transparent)); }',
      '.ags-home-heat-cell[data-lvl="4"] { background:var(--ags-accent, #D97757); }',
      '.ags-home-heat-tip { position:fixed; z-index:2147483600; pointer-events:none; padding:4px 8px; border-radius:6px; background:var(--ags-bg-surface, #18181b); border:1px solid var(--ags-border); color:var(--ags-text-primary); font-size:11px; box-shadow:0 4px 12px rgba(0,0,0,.22); opacity:0; transition:opacity 90ms ease; white-space:nowrap; }',
      '.ags-home-heat-tip[data-show="1"] { opacity:1; }',
      '.ags-home-foot { font-size:11.5px; color:var(--ags-text-secondary, #94a3b8); display:flex; align-items:center; justify-content:space-between; }',
      '.ags-home-split-bar { display:flex; height:8px; border-radius:99px; overflow:hidden; background:var(--ags-bg-subtle, rgba(148,163,184,.18)); gap:1px; }',
      '.ags-home-models { display:flex; flex-direction:column; gap:8px; }',
      '.ags-home-model-row { display:flex; flex-direction:column; gap:4px; }',
      '.ags-home-model-meta { display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:12px; }',
      '.ags-home-model-left { display:inline-flex; align-items:center; gap:7px; min-width:0; }',
      '.ags-home-swatch { width:8px; height:8px; border-radius:50%; flex-shrink:0; }',
      '.ags-home-prog { height:5px; border-radius:99px; background:var(--ags-bg-subtle, rgba(148,163,184,.16)); overflow:hidden; }',
      '.ags-home-prog-fill { height:100%; border-radius:99px; transition:width 200ms ease; }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function normalizeHeatmap7xN(overview, daysRange) {
    var raw = (overview && (overview.heatmap7xN || overview.heatmap)) || [];
    var byDate = {};
    if (Array.isArray(raw)) {
      for (var i = 0; i < raw.length; i++) {
        var item = raw[i];
        if (!item) continue;
        if (Array.isArray(item)) {
          for (var j = 0; j < item.length; j++) {
            var sub = item[j];
            if (sub && sub.date) byDate[sub.date] = Number(sub.total != null ? sub.total : (sub.totalTokens || 0));
          }
        } else if (item.date) {
          byDate[item.date] = Number(item.total != null ? item.total : (item.totalTokens || 0));
        }
      }
    }

    var weeks = daysRange === 7 ? 2 : daysRange === 30 ? 6 : 20;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    // Monday-based day of week (0 = Mon ... 6 = Sun)
    var dow = (today.getDay() + 6) % 7;
    var totalDays = weeks * 7;
    var endOffset = 6 - dow;
    var start = new Date(today.getTime());
    start.setDate(today.getDate() - (totalDays - 1 - endOffset));

    var cells = [];
    var maxVal = 0;
    for (var d = 0; d < totalDays; d++) {
      var cur = new Date(start.getTime());
      cur.setDate(start.getDate() + d);
      var key = cur.getFullYear() + '-' +
        String(cur.getMonth() + 1).padStart(2, '0') + '-' +
        String(cur.getDate()).padStart(2, '0');
      var isFuture = cur.getTime() > today.getTime();
      var val = isFuture ? 0 : (byDate[key] || 0);
      if (val > maxVal) maxVal = val;
      cells.push({ date: key, total: val, future: isFuture });
    }

    for (var c = 0; c < cells.length; c++) {
      var v = cells[c].total;
      var lvl = 0;
      if (v > 0 && maxVal > 0) {
        var r = v / maxVal;
        lvl = r >= 0.75 ? 4 : r >= 0.45 ? 3 : r >= 0.2 ? 2 : 1;
      }
      cells[c].level = lvl;
    }
    return cells;
  }

  function createHomeOverviewCard(options) {
    if (typeof document === 'undefined') return null;
    ensureHomeCardStyles();
    var opts = options || {};

    var card = document.createElement('section');
    card.className = 'ags-home-card';
    card.setAttribute('data-ag-studio-ignore', 'true');
    card.setAttribute('data-ag-no-i18n', 'true');

    var tipEl = document.createElement('div');
    tipEl.className = 'ags-home-heat-tip';
    tipEl.setAttribute('data-ag-studio-ignore', 'true');

    var state = {
      tab: 'overview', // overview | models
      days: 30,        // 0 (all) | 30 | 7
      bookSeed: Math.random(),
      data: null,
      loading: false
    };

    function getLang() {
      var cfg = typeof opts.getConfig === 'function' ? opts.getConfig() : {};
      return (cfg && cfg.i18n && cfg.i18n.language) || 'zh-CN';
    }

    function hideTip() {
      tipEl.removeAttribute('data-show');
    }

    function showTip(cell, ev) {
      var txt = cell.getAttribute('data-tip');
      if (!txt) return;
      if (!tipEl.parentElement) document.body.appendChild(tipEl);
      tipEl.textContent = txt;
      tipEl.style.left = Math.min((window.innerWidth || 1200) - 180, (ev.clientX || 0) + 10) + 'px';
      tipEl.style.top = Math.max(8, (ev.clientY || 0) - 32) + 'px';
      tipEl.setAttribute('data-show', '1');
    }

    function render() {
      var lang = getLang();
      var isEn = lang === 'en';
      var isTw = lang === 'zh-TW';

      var labels = isEn
        ? {
            overview: 'Overview', models: 'Models', all: 'All', d30: '30d', d7: '7d',
            sessions: 'Sessions', calls: 'Messages', total: 'Total Tokens',
            days: 'Active Days', peak: 'Peak Hour', topModel: 'Top Model',
            weekdays: ['M', '', 'W', '', 'F', '', 'S'],
            noModels: 'No model usage data yet',
            split: 'Desktop vs CLI'
          }
        : isTw
          ? {
              overview: '概覽', models: '模型', all: '全部', d30: '30 天', d7: '7 天',
              sessions: '會話數', calls: '訊息數', total: 'Token 總量',
              days: '活躍天數', peak: '高峰時段', topModel: '最常用模型',
              weekdays: ['一', '', '三', '', '五', '', '日'],
              noModels: '暫無模型用量資料',
              split: '桌面端 vs CLI 佔比'
            }
          : {
              overview: '概览', models: '模型', all: '全部', d30: '30 天', d7: '7 天',
              sessions: '会话数', calls: '消息数', total: 'Token 总量',
              days: '活跃天数', peak: '高峰时段', topModel: '最常用模型',
              weekdays: ['一', '', '三', '', '五', '', '日'],
              noModels: '暂无模型用量数据',
              split: '桌面端 vs CLI 占比'
            };

      var d = state.data || {};
      var headerHtml = [
        '<div class="ags-home-head">',
        '  <div class="ags-home-seg">',
        '    <button type="button" class="ags-home-seg-btn ' + (state.tab === 'overview' ? 'active' : '') + '" data-home-tab="overview">' + esc(labels.overview) + '</button>',
        '    <button type="button" class="ags-home-seg-btn ' + (state.tab === 'models' ? 'active' : '') + '" data-home-tab="models">' + esc(labels.models) + '</button>',
        '  </div>',
        '  <div class="ags-home-seg">',
        '    <button type="button" class="ags-home-seg-btn ' + (state.days === 0 ? 'active' : '') + '" data-home-days="0">' + esc(labels.all) + '</button>',
        '    <button type="button" class="ags-home-seg-btn ' + (state.days === 30 ? 'active' : '') + '" data-home-days="30">' + esc(labels.d30) + '</button>',
        '    <button type="button" class="ags-home-seg-btn ' + (state.days === 7 ? 'active' : '') + '" data-home-days="7">' + esc(labels.d7) + '</button>',
        '  </div>',
        '</div>'
      ].join('');

      var bodyHtml = '';
      if (state.tab === 'overview') {
        var totalTok = Number(d.totalTokens || 0);
        var kpis = [
          [labels.sessions, fmtCount(d.sessions || 0)],
          [labels.calls, fmtCount(d.calls || d.messages || 0)],
          [labels.total, fmtCompact(totalTok)],
          [labels.days, fmtCount(d.activeDays || 0)],
          [labels.peak, fmtPeakHour(d.peakHour, lang)],
          [labels.topModel, d.topModel || '—']
        ];
        var kpiHtml = kpis.map(function (k) {
          return '<div class="ags-home-kpi"><span class="ags-home-kpi-lbl">' + esc(k[0]) +
            '</span><span class="ags-home-kpi-val" title="' + esc(k[1]) + '">' + esc(k[1]) + '</span></div>';
        }).join('');

        var cells = normalizeHeatmap7xN(d, state.days);
        var dayAxis = labels.weekdays.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('');
        var gridCells = cells.map(function (c) {
          var tip = c.future ? '' : (c.date + ' · ' + fmtCompact(c.total) + ' tokens');
          return '<span class="ags-home-heat-cell" data-lvl="' + c.level + '" ' +
            (tip ? ('data-tip="' + esc(tip) + '"') : 'style="opacity:0.25"') + '></span>';
        }).join('');

        bodyHtml = [
          '<div class="ags-home-kpis">' + kpiHtml + '</div>',
          '<div class="ags-home-heat-wrap">',
          '  <div class="ags-home-heat-days">' + dayAxis + '</div>',
          '  <div class="ags-home-heat-grid">' + gridCells + '</div>',
          '</div>',
          '<div class="ags-home-foot"><span>' + esc(formatFunBookText(totalTok, lang, state.bookSeed)) + '</span></div>'
        ].join('');
      } else {
        var bySource = d.bySource || {};
        var deskTok = Number((bySource.desktop && bySource.desktop.totalTokens) || bySource.desktop || 0);
        var cliTok = Number((bySource.cli && bySource.cli.totalTokens) || bySource.cli || 0);
        var sumSrc = Math.max(1, deskTok + cliTok);
        var deskPct = deskTok + cliTok > 0 ? Math.round((deskTok / sumSrc) * 100) : 100;
        var cliPct = deskTok + cliTok > 0 ? (100 - deskPct) : 0;

        var models = Array.isArray(d.byModel) ? d.byModel.slice(0, 6) : [];
        var sumModels = models.reduce(function (acc, m) { return acc + Number(m.totalTokens || 0); }, 0) || 1;
        var maxModel = Math.max.apply(null, models.map(function (m) { return Number(m.totalTokens || 0); }).concat([1]));
        var modelRows = models.length
          ? models.map(function (m, idx) {
              var tok = Number(m.totalTokens || 0);
              var pct = ((tok / sumModels) * 100).toFixed(1).replace(/\.0$/, '');
              var barW = Math.round((tok / maxModel) * 100);
              var color = MODEL_COLORS[idx % MODEL_COLORS.length];
              return '<div class="ags-home-model-row">' +
                '  <div class="ags-home-model-meta">' +
                '    <span class="ags-home-model-left"><span class="ags-home-swatch" style="background:' + color + '"></span><span>' + esc(m.model || 'unknown') + '</span></span>' +
                '    <span style="color:var(--ags-text-secondary)">' + esc(fmtCompact(tok)) + ' (' + pct + '%)</span>' +
                '  </div>' +
                '  <div class="ags-home-prog"><div class="ags-home-prog-fill" style="width:' + barW + '%;background:' + color + '"></div></div>' +
                '</div>';
            }).join('')
          : '<div style="font-size:12px;color:var(--ags-text-secondary)">' + esc(labels.noModels) + '</div>';

        bodyHtml = [
          '<div>',
          '  <div class="ags-home-model-meta" style="margin-bottom:5px"><span style="color:var(--ags-text-secondary)">' + esc(labels.split) + '</span><span>Desktop ' + deskPct + '% · CLI ' + cliPct + '%</span></div>',
          '  <div class="ags-home-split-bar"><div style="width:' + deskPct + '%;background:var(--ags-accent,#D97757)"></div><div style="width:' + cliPct + '%;background:#10B981"></div></div>',
          '</div>',
          '<div class="ags-home-models">' + modelRows + '</div>'
        ].join('');
      }

      card.innerHTML = headerHtml + bodyHtml;

      card.querySelectorAll('[data-home-tab]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.tab = btn.getAttribute('data-home-tab');
          render();
        });
      });
      card.querySelectorAll('[data-home-days]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.days = Number(btn.getAttribute('data-home-days'));
          if (typeof opts.onRangeChange === 'function') opts.onRangeChange(state.days);
          render();
        });
      });
      card.querySelectorAll('.ags-home-heat-cell[data-tip]').forEach(function (cell) {
        cell.addEventListener('pointerenter', function (ev) { showTip(cell, ev); });
        cell.addEventListener('pointerleave', hideTip);
      });
    }

    function update(overviewData, cfg) {
      var hudCfg = (cfg && cfg.hud) || {};
      var enabled = !(cfg && cfg.homeOverview === false) && !(hudCfg.homeOverview === false);
      var anchors = globalScope.__AG_STUDIO_ANCHORS__;

      if (!enabled || !anchors) {
        if (anchors) anchors.parkHomeCardSlot();
        hideTip();
        return;
      }

      var slot = anchors.ensureHomeCardSlot();
      if (!slot) {
        hideTip();
        return;
      }
      if (card.parentElement !== slot) {
        slot.appendChild(card);
      }
      if (overviewData) {
        state.data = overviewData;
      }
      render();
    }

    function destroy() {
      hideTip();
      if (tipEl.parentElement) tipEl.parentElement.removeChild(tipEl);
      if (card.parentElement) card.parentElement.removeChild(card);
    }

    return {
      element: card,
      getDays: function () { return state.days; },
      update: update,
      render: render,
      destroy: destroy
    };
  }

  var api = {
    createHomeOverviewCard: createHomeOverviewCard,
    normalizeHeatmap7xN: normalizeHeatmap7xN,
    formatFunBookText: formatFunBookText
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_HOME_CARD__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);


(function (globalScope) {
  'use strict';

  var PROSE_SEL = '[data-testid="planner-response-text"], [data-testid="agent-response"] [data-markdown-root]';

  function ensurePrismFxStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ag-studio-prism-fx-style')) return;
    var s = document.createElement('style');
    s.id = 'ag-studio-prism-fx-style';
    s.textContent = [
      '@keyframes ags-ink-in { from { opacity:0.15; filter:blur(1.5px); } to { opacity:1; filter:blur(0); } }',
      '.ags-ink-chunk { animation: ags-ink-in 260ms cubic-bezier(.22,1,.36,1) both; }',
      '@keyframes ags-caret-blink { 0%, 45% { opacity:1; } 55%, 100% { opacity:0.25; } }',
      '.ags-smooth-caret { position:absolute; top:0; left:0; width:2px; border-radius:2px; background:var(--ags-accent, #D97757); box-shadow:0 0 8px var(--ags-accent-soft, rgba(217,119,87,0.35)); pointer-events:none; z-index:40; transition:transform 80ms cubic-bezier(.22,1,.36,1), height 80ms ease, opacity 120ms ease; opacity:0; }',
      '.ags-smooth-caret[data-vis="1"] { opacity:1; animation:ags-caret-blink 1.05s ease-in-out infinite; }',
      '.ags-smooth-caret[data-typing="1"] { opacity:1; animation:none; }',
      '#ag-studio-edge-aura { position:fixed; inset:0; pointer-events:none; z-index:2147482890; opacity:0; transition:opacity 280ms ease, box-shadow 280ms ease; }',
      '#ag-studio-edge-aura[data-aura="waiting"] { opacity:1; box-shadow:inset 0 0 38px rgba(245,158,11,0.22), inset 0 2px 14px rgba(245,158,11,0.26); }',
      '#ag-studio-edge-aura[data-aura="error"] { opacity:1; box-shadow:inset 0 0 42px rgba(239,68,68,0.24), inset 0 2px 16px rgba(239,68,68,0.28); }',
      '#ag-studio-edge-aura[data-aura="complete"] { opacity:1; box-shadow:inset 0 0 38px rgba(16,185,129,0.22), inset 0 2px 14px rgba(16,185,129,0.26); }',
      '::highlight(ags-ink-0) { opacity: 0.20; }',
      '::highlight(ags-ink-1) { opacity: 0.45; }',
      '::highlight(ags-ink-2) { opacity: 0.72; }',
      '::highlight(ags-ink-3) { opacity: 0.90; }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function createPrismFxController() {
    if (typeof document === 'undefined') {
      return { sync: function () {}, destroy: function () {} };
    }
    ensurePrismFxStyles();

    var fxCfg = {
      inkStream: true,
      smoothCaret: true,
      edgeAura: true
    };
    var destroyed = false;

    // ── 1. Edge Aura (0fps static CSS box-shadow) ────────────────────────────
    var auraEl = null;
    var currentAura = 'none';

    function syncEdgeAura(auraPhase) {
      var next = fxCfg.edgeAura ? (auraPhase || 'none') : 'none';
      if (next !== 'waiting' && next !== 'error' && next !== 'complete') next = 'none';
      if (next === 'none' && !auraEl) return;
      if (!auraEl) {
        auraEl = document.getElementById('ag-studio-edge-aura');
        if (!auraEl) {
          auraEl = document.createElement('div');
          auraEl.id = 'ag-studio-edge-aura';
          auraEl.setAttribute('data-ag-studio-ignore', 'true');
          auraEl.setAttribute('aria-hidden', 'true');
          (document.body || document.documentElement).appendChild(auraEl);
        }
      }
      if (currentAura !== next) {
        currentAura = next;
        auraEl.setAttribute('data-aura', next);
      }
    }

    // ── 2. Smooth Caret Follower (0fps at rest, event-driven) ─────────────────
    var caretEl = null;
    var caretHost = null;
    var caretTypingTimer = 0;

    function hideCaret() {
      if (caretEl) {
        caretEl.setAttribute('data-vis', '0');
        caretEl.setAttribute('data-typing', '0');
      }
    }

    function updateCaretPosition(isTyping) {
      if (destroyed || !fxCfg.smoothCaret) {
        hideCaret();
        return;
      }
      var active = document.activeElement;
      if (!active || !active.closest) { hideCaret(); return; }
      if (active.closest('#ag-studio-root, [data-ag-studio-ignore], .monaco-editor')) {
        hideCaret();
        return;
      }
      var inComposer = active.closest('[data-testid="agent-input-box"], .surface-composer-card');
      if (!inComposer || (!active.isContentEditable && active.getAttribute('contenteditable') !== 'true')) {
        hideCaret();
        return;
      }

      var sel = typeof document.getSelection === 'function' ? document.getSelection() : null;
      if (!sel || sel.rangeCount === 0) { hideCaret(); return; }
      var range = sel.getRangeAt(0);
      if (!range || !range.collapsed || !active.contains(range.startContainer)) {
        hideCaret();
        return;
      }

      var rects = range.getClientRects ? range.getClientRects() : [];
      var r = rects.length ? rects[rects.length - 1] : (range.getBoundingClientRect ? range.getBoundingClientRect() : null);
      if (!r || (r.left === 0 && r.top === 0)) {
        var edRect = active.getBoundingClientRect();
        var cs = typeof getComputedStyle === 'function' ? getComputedStyle(active) : null;
        var padL = parseFloat((cs && cs.paddingLeft) || '8') || 8;
        var padT = parseFloat((cs && cs.paddingTop) || '8') || 8;
        var fontSize = parseFloat((cs && cs.fontSize) || '14') || 14;
        r = { left: edRect.left + padL, top: edRect.top + padT, height: Math.round(fontSize * 1.3) };
      }

      var host = active.parentElement || inComposer;
      var hostRect = host.getBoundingClientRect();
      if (!hostRect || hostRect.width <= 0) { hideCaret(); return; }

      try {
        var hPos = typeof getComputedStyle === 'function' ? getComputedStyle(host).position : '';
        if (!hPos || hPos === 'static') host.style.position = 'relative';
      } catch (_e) {}

      if (!caretEl) {
        caretEl = document.createElement('span');
        caretEl.className = 'ags-smooth-caret';
        caretEl.setAttribute('data-ag-studio-ignore', 'true');
        caretEl.setAttribute('aria-hidden', 'true');
      }
      if (caretHost !== host || caretEl.parentElement !== host) {
        caretHost = host;
        host.appendChild(caretEl);
      }

      var x = Math.max(0, r.left - hostRect.left + (host.scrollLeft || 0));
      var y = Math.max(0, r.top - hostRect.top + (host.scrollTop || 0));
      var h = Math.max(14, Math.min(28, r.height || 18));

      caretEl.style.height = h + 'px';
      caretEl.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      caretEl.setAttribute('data-vis', '1');

      if (isTyping) {
        caretEl.setAttribute('data-typing', '1');
        if (caretTypingTimer) clearTimeout(caretTypingTimer);
        caretTypingTimer = setTimeout(function () {
          caretTypingTimer = 0;
          if (caretEl) caretEl.setAttribute('data-typing', '0');
        }, 420);
      }
    }

    var onCaretInput = function () { updateCaretPosition(true); };
    var onCaretNav = function () { updateCaretPosition(false); };
    var onCaretBlur = function () { hideCaret(); };

    document.addEventListener('input', onCaretInput, true);
    document.addEventListener('keyup', onCaretNav, true);
    document.addEventListener('mouseup', onCaretNav, { passive: true });
    document.addEventListener('selectionchange', onCaretNav, true);
    document.addEventListener('focusin', onCaretNav, { passive: true });
    document.addEventListener('focusout', onCaretBlur, { passive: true });

    // ── 3. Ink Stream Fade-In (active ONLY while generating; 0fps when idle) ──
    var streamObs = null;
    var streamTarget = null;
    var seenInkNodes = typeof WeakSet === 'function' ? new WeakSet() : null;
    var textLenMap = typeof WeakMap === 'function' ? new WeakMap() : null;
    var hlBuckets = null;
    var fadeItems = [];
    var fadeTimer = 0;

    function clearInkHighlights() {
      if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = 0; }
      if (hlBuckets) {
        for (var i = 0; i < hlBuckets.length; i++) {
          try { hlBuckets[i].clear(); } catch (_e) {}
        }
      }
      fadeItems.length = 0;
    }

    function stepHighlights() {
      fadeTimer = 0;
      if (destroyed || fadeItems.length === 0) {
        clearInkHighlights();
        return;
      }
      var now = Date.now();
      var next = [];
      for (var i = 0; i < hlBuckets.length; i++) {
        try { hlBuckets[i].clear(); } catch (_e) {}
      }
      for (var j = 0; j < fadeItems.length; j++) {
        var it = fadeItems[j];
        var age = now - it.t;
        if (age >= 240 || !it.n || it.n.isConnected === false) continue;
        var b = Math.min(3, Math.floor(age / 60));
        try {
          hlBuckets[b].add(it.r);
          next.push(it);
        } catch (_e) {}
      }
      fadeItems = next;
      if (fadeItems.length > 0) {
        fadeTimer = setTimeout(stepHighlights, 60);
      }
    }

    function ensureHighlightBuckets() {
      if (hlBuckets) return hlBuckets;
      if (typeof CSS === 'undefined' || !CSS.highlights || typeof Highlight !== 'function') return null;
      hlBuckets = [];
      for (var i = 0; i < 4; i++) {
        var name = 'ags-ink-' + i;
        var hl = CSS.highlights.get(name) || new Highlight();
        CSS.highlights.set(name, hl);
        hlBuckets.push(hl);
      }
      return hlBuckets;
    }

    function stopStreamObserver() {
      if (streamObs) {
        try { streamObs.disconnect(); } catch (_e) {}
        streamObs = null;
      }
      streamTarget = null;
      clearInkHighlights();
    }

    function syncInkStream(isGenerating) {
      if (destroyed || !fxCfg.inkStream || !isGenerating || document.hidden) {
        stopStreamObserver();
        return;
      }
      var conv = document.querySelector('[data-testid="conversation-view"]');
      if (!conv) {
        stopStreamObserver();
        return;
      }
      if (streamObs && streamTarget === conv) return;
      stopStreamObserver();

      streamTarget = conv;
      streamObs = new MutationObserver(function (mutations) {
        if (destroyed || !fxCfg.inkStream || document.hidden) return;
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (m.type === 'characterData' && m.target && m.target.nodeType === 3) {
            var tn = m.target;
            var parentEl = tn.parentElement;
            if (!parentEl || !parentEl.closest || !parentEl.closest(PROSE_SEL)) continue;
            var len = (tn.nodeValue || '').length;
            var prevLen = textLenMap ? (textLenMap.get(tn) || 0) : 0;
            if (textLenMap) textLenMap.set(tn, len);
            if (len > prevLen && len - prevLen <= 40) {
              var buckets = ensureHighlightBuckets();
              if (buckets && typeof document.createRange === 'function') {
                try {
                  var r = document.createRange();
                  r.setStart(tn, prevLen);
                  r.setEnd(tn, len);
                  buckets[0].add(r);
                  fadeItems.push({ n: tn, r: r, t: Date.now() });
                  if (fadeItems.length > 32) fadeItems.shift();
                  if (!fadeTimer) fadeTimer = setTimeout(stepHighlights, 60);
                } catch (_e) {}
              }
            }
          } else if (m.type === 'childList' && m.addedNodes && m.addedNodes.length) {
            for (var a = 0; a < m.addedNodes.length; a++) {
              var node = m.addedNodes[a];
              if (!node || node.nodeType !== 1 || !node.closest) continue;
              if (!node.closest(PROSE_SEL)) continue;
              if (seenInkNodes && seenInkNodes.has(node)) continue;
              if (seenInkNodes) seenInkNodes.add(node);
              if (node.classList && !node.classList.contains('ags-ink-chunk')) {
                node.classList.add('ags-ink-chunk');
              }
            }
          }
        }
      });
      streamObs.observe(conv, { childList: true, characterData: true, subtree: true });
    }

    function sync(opts) {
      if (destroyed) return;
      var o = opts || {};
      var cfgFx = (o.cfg && o.cfg.fx) || {};
      fxCfg.inkStream = cfgFx.inkStream !== false;
      fxCfg.smoothCaret = cfgFx.smoothCaret !== false;
      fxCfg.edgeAura = cfgFx.edgeAura !== false;

      if (!fxCfg.smoothCaret) hideCaret();
      syncEdgeAura(o.auraPhase || 'none');
      syncInkStream(Boolean(o.isGenerating));
    }

    function destroy() {
      destroyed = true;
      stopStreamObserver();
      if (caretTypingTimer) clearTimeout(caretTypingTimer);
      document.removeEventListener('input', onCaretInput, true);
      document.removeEventListener('keyup', onCaretNav, true);
      document.removeEventListener('mouseup', onCaretNav, { passive: true });
      document.removeEventListener('selectionchange', onCaretNav, true);
      document.removeEventListener('focusin', onCaretNav, { passive: true });
      document.removeEventListener('focusout', onCaretBlur, { passive: true });
      if (caretEl && caretEl.parentElement) caretEl.parentElement.removeChild(caretEl);
      if (auraEl && auraEl.parentElement) auraEl.parentElement.removeChild(auraEl);
    }

    return {
      sync: sync,
      destroy: destroy
    };
  }

  var api = {
    createPrismFxController: createPrismFxController
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_PRISM_FX__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);


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


(function (globalScope) {
  'use strict';

  var UI_TEXT = {
    'zh-CN': {
      tabs: { overview: '概览', usage: '统计', accounts: '账号', settings: '设置' },
      title: 'Antigravity Studio',
      close: '收起',
      ctxTitle: '当前上下文',
      ctxLegend: { system: '系统', tools: '工具', chat: '对话', think: '思考' },
      perfTitle: '实时性能',
      speed: '输出速度',
      ttft: '首字延迟',
      cost: '本轮估算',
      timelineTitle: '逐轮调用时间线',
      attachTitle: '附件审计摘要',
      quotaTitle: '模型额度池',
      noQuota: '连接本地 LanguageServer 后自动显示模型额度',
      launchCli: '打开 CLI 终端',
      daysAll: '全部', days7: '7天', days30: '30天', days90: '90天',
      totalTok: '总消耗', estApi: '估算 API 费用', vsSub: '较订阅节省',
      heatmap: '7×N 活跃热力图',
      sourceSplit: '桌面端 vs CLI 占比',
      topModels: '热门模型排行',
      syncPricing: '同步模型定价',
      importCur: '导入当前', addOauth: 'OAuth 添加', importTools: '导入 Tools', refreshQuota: '刷新额度',
      activeTag: '当前', switchBtn: '一键切号',
      keepaliveTitle: '保活 Keepalive & 低额度自动切号',
      secTheme: '外观与桌宠',
      secFx: 'Prism 质感增强（独立开关）',
      secLang: '语言与词典',
      secNet: '代理与系统增强',
      testProxy: '测速',
      customDictTitle: '自定义词典（覆盖内置词条）',
      customThemeTitle: '自定义配色编辑器（新建 / 克隆 / 调色）',
      enhanceTitle: '系统提示词精简 & 中文标题 & 上下文解锁 & 压缩回填'
    },
    'zh-TW': {
      tabs: { overview: '概覽', usage: '統計', accounts: '帳號', settings: '設定' },
      title: 'Antigravity Studio',
      close: '收合',
      ctxTitle: '目前上下文',
      ctxLegend: { system: '系統', tools: '工具', chat: '對話', think: '思考' },
      perfTitle: '即時效能',
      speed: '輸出速度',
      ttft: '首字延遲',
      cost: '本輪估算',
      timelineTitle: '逐輪呼叫時間線',
      attachTitle: '附件稽核摘要',
      quotaTitle: '模型額度池',
      noQuota: '連線本機 LanguageServer 後自動顯示模型額度',
      launchCli: '開啟 CLI 終端機',
      daysAll: '全部', days7: '7天', days30: '30天', days90: '90天',
      totalTok: '總消耗', estApi: '估算 API 費用', vsSub: '較訂閱節省',
      heatmap: '7×N 活躍熱力圖',
      sourceSplit: '桌面端 vs CLI 佔比',
      topModels: '熱門模型排行',
      syncPricing: '同步模型定價',
      importCur: '匯入目前', addOauth: 'OAuth 新增', importTools: '匯入 Tools', refreshQuota: '重新整理額度',
      activeTag: '使用中', switchBtn: '一鍵切號',
      keepaliveTitle: '保活 Keepalive & 低額度自動切號',
      secTheme: '外觀與桌寵',
      secFx: 'Prism 質感增強（獨立開關）',
      secLang: '語言與詞典',
      secNet: '代理與系統增強',
      testProxy: '測速',
      customDictTitle: '自訂詞典（覆蓋內建詞條）',
      customThemeTitle: '自訂配色編輯器（新增 / 複製 / 調色）',
      enhanceTitle: '系統提示詞精簡 & 中文標題 & 上下文解鎖 & 壓縮回填'
    },
    'en': {
      tabs: { overview: 'Overview', usage: 'Usage', accounts: 'Accounts', settings: 'Settings' },
      title: 'Antigravity Studio',
      close: 'Close',
      ctxTitle: 'Context Window',
      ctxLegend: { system: 'System', tools: 'Tools', chat: 'Chat', think: 'Thinking' },
      perfTitle: 'Live Performance',
      speed: 'Speed',
      ttft: 'TTFT',
      cost: 'Est. Cost',
      timelineTitle: 'Session Turn Timeline',
      attachTitle: 'Attachment Audit',
      quotaTitle: 'Model Quota Pools',
      noQuota: 'Connects automatically to local LanguageServer when active',
      launchCli: 'Open CLI Terminal',
      daysAll: 'All', days7: '7d', days30: '30d', days90: '90d',
      totalTok: 'Total Tokens', estApi: 'Est. API Cost', vsSub: 'vs Subscription',
      heatmap: '7×N Activity Heatmap',
      sourceSplit: 'Desktop vs CLI',
      topModels: 'Top Models',
      syncPricing: 'Sync Pricing',
      importCur: 'Import Current', addOauth: 'Add OAuth', importTools: 'Import Tools', refreshQuota: 'Refresh',
      activeTag: 'Active', switchBtn: 'Switch',
      keepaliveTitle: 'Keepalive & Auto-Switch Strategy',
      secTheme: 'Appearance & Mascot',
      secFx: 'Prism FX (Independent Toggles)',
      secLang: 'Language & Dictionary',
      secNet: 'Proxy & System Enhancements',
      testProxy: 'Test',
      customDictTitle: 'Custom Dictionary Overrides',
      customThemeTitle: 'Custom Color Editor (Create / Clone / Edit)',
      enhanceTitle: 'Prompt Tiers & Chinese Title & Context Unlock & Rehydrate'
    }
  };

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtTok(n) {
    var v = Number(n || 0);
    if (!Number.isFinite(v) || v <= 0) return '0';
    if (v >= 1000000) return (v / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
    if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(Math.round(v));
  }

  function formatResetEta(isoStr) {
    if (!isoStr) return '';
    var ms = Date.parse(isoStr) - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) return '';
    var mins = Math.round(ms / 60000);
    if (mins < 60) return mins + 'm';
    var hrs = Math.floor(mins / 60);
    var rem = mins % 60;
    return hrs + 'h ' + rem + 'm';
  }

  function ensureDrawerStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ag-studio-drawer-style')) return;
    var style = document.createElement('style');
    style.id = 'ag-studio-drawer-style';
    style.textContent = [
      '.ags-drawer { position:fixed; top:12px; right:12px; bottom:12px; width:420px; max-width:calc(100vw - 24px); background:var(--ags-bg-surface,#18181b); color:var(--ags-text-primary,#f4f4f5); border:1px solid var(--ags-border,#2e2e32); border-radius:14px; box-shadow:var(--ags-shadow,0 16px 40px rgba(0,0,0,0.45)); z-index:2147483500; display:flex; flex-direction:column; font-family:var(--ags-font-ui,system-ui,sans-serif); font-size:13px; font-variant-numeric:tabular-nums; transition:transform 180ms cubic-bezier(.22,1,.36,1), opacity 160ms ease; overflow:hidden; }',
      '.ags-drawer.ags-hidden { transform:translateX(calc(100% + 24px)); opacity:0; pointer-events:none; }',
      '.ags-head { display:flex; align-items:center; justify-content:space-between; padding:14px 16px 10px 16px; border-bottom:1px solid var(--ags-border); }',
      '.ags-title { font-size:14px; font-weight:600; letter-spacing:-0.01em; display:flex; align-items:center; gap:8px; }',
      '.ags-dot { width:8px; height:8px; border-radius:50%; background:var(--ags-accent,#D97757); }',
      '.ags-tabs { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; padding:8px 16px; border-bottom:1px solid var(--ags-border); background:var(--ags-bg-canvas); }',
      '.ags-tab { border:none; background:transparent; color:var(--ags-text-secondary); padding:6px 4px; border-radius:8px; cursor:pointer; font-size:12.5px; font-weight:500; transition:all 120ms ease; }',
      '.ags-tab.active { background:var(--ags-bg-surface); color:var(--ags-text-primary); box-shadow:0 1px 3px rgba(0,0,0,0.08); }',
      '.ags-body { flex:1; overflow-y:auto; padding:14px 16px 20px 16px; display:flex; flex-direction:column; gap:12px; }',
      '.ags-card { background:var(--ags-bg-canvas); border:1px solid var(--ags-border); border-radius:11px; padding:13px 14px; display:flex; flex-direction:column; gap:10px; }',
      '.ags-card-head { display:flex; align-items:center; justify-content:space-between; font-size:12px; color:var(--ags-text-secondary); font-weight:500; }',
      '.ags-big { font-size:22px; font-weight:600; letter-spacing:-0.02em; color:var(--ags-text-primary); }',
      '.ags-sub { font-size:11.5px; color:var(--ags-text-secondary); }',
      '.ags-seg-bar { display:flex; height:7px; border-radius:99px; overflow:hidden; background:var(--ags-bg-subtle); gap:1px; }',
      '.ags-legend { display:flex; flex-wrap:wrap; gap:10px; font-size:11.5px; color:var(--ags-text-secondary); }',
      '.ags-legend-item { display:inline-flex; align-items:center; gap:5px; }',
      '.ags-swatch { width:7px; height:7px; border-radius:2px; }',
      '.ags-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }',
      '.ags-metric-box { padding:8px 10px; border-radius:9px; background:var(--ags-bg-surface); border:1px solid var(--ags-border); }',
      '.ags-metric-val { font-size:15px; font-weight:600; margin-top:2px; }',
      '.ags-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }',
      '.ags-prog { width:100%; height:5px; border-radius:99px; background:var(--ags-bg-subtle); overflow:hidden; }',
      '.ags-prog-fill { height:100%; border-radius:99px; background:var(--ags-accent); transition:width 200ms ease; }',
      '.ags-btn { border:1px solid var(--ags-border); background:var(--ags-bg-surface); color:var(--ags-text-primary); padding:5px 10px; border-radius:8px; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:5px; transition:border-color 120ms ease, background 120ms ease; white-space:nowrap; }',
      '.ags-btn:hover { border-color:var(--ags-accent); }',
      '.ags-btn-primary { background:var(--ags-accent); color:#fff; border-color:var(--ags-accent); }',
      '.ags-btn-primary:hover { background:var(--ags-accent-hover); }',
      '.ags-btn-ghost { border:none; background:transparent; color:var(--ags-text-secondary); padding:4px 8px; }',
      '.ags-btn-ghost:hover { color:var(--ags-text-primary); background:var(--ags-bg-subtle); }',
      '.ags-input, .ags-select { width:100%; box-sizing:border-box; height:30px; padding:0 9px; border-radius:8px; border:1px solid var(--ags-border); background:var(--ags-bg-surface); color:var(--ags-text-primary); font-size:12px; outline:none; }',
      '.ags-input:focus, .ags-select:focus { border-color:var(--ags-accent); }',
      '.ags-pill-group { display:inline-flex; padding:2px; border-radius:8px; background:var(--ags-bg-surface); border:1px solid var(--ags-border); gap:2px; }',
      '.ags-pill-opt { border:none; background:transparent; color:var(--ags-text-secondary); padding:3px 9px; border-radius:6px; font-size:11.5px; cursor:pointer; }',
      '.ags-pill-opt.active { background:var(--ags-accent-soft); color:var(--ags-accent); font-weight:600; }',
      '.ags-theme-cards { display:grid; grid-template-columns:1fr 1fr; gap:8px; }',
      '.ags-theme-card { padding:10px; border-radius:10px; border:1px solid var(--ags-border); background:var(--ags-bg-surface); cursor:pointer; text-align:left; transition:border-color 120ms ease; }',
      '.ags-theme-card.active { border-color:var(--ags-accent); box-shadow:0 0 0 1px var(--ags-accent); }',
      '.ags-acc-item { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; border-radius:10px; border:1px solid var(--ags-border); background:var(--ags-bg-surface); }',
      '.ags-avatar { width:30px; height:30px; border-radius:50%; background:var(--ags-accent-soft); color:var(--ags-accent); display:flex; align-items:center; justify-content:center; font-weight:600; flex-shrink:0; }',
      '.ags-details { border:1px solid var(--ags-border); border-radius:10px; background:var(--ags-bg-surface); padding:8px 11px; }',
      '.ags-details summary { cursor:pointer; font-size:12px; color:var(--ags-text-secondary); font-weight:500; outline:none; user-select:none; }',
      '.ags-details[open] summary { margin-bottom:10px; color:var(--ags-text-primary); }',
      '.ags-hm-7row { display:grid; grid-template-rows:repeat(7, 10px); grid-auto-flow:column; grid-auto-columns:10px; gap:3px; overflow-x:auto; padding:2px 0; }',
      '.ags-hm-cell { width:10px; height:10px; border-radius:2px; background:var(--ags-bg-subtle); }',
      '.ags-tl-item { padding:7px 9px; border-radius:8px; border:1px solid var(--ags-border); background:var(--ags-bg-canvas); display:flex; flex-direction:column; gap:3px; font-size:11.5px; }',
      '.ags-toast { position:fixed; bottom:56px; right:20px; z-index:2147483600; padding:7px 13px; border-radius:9px; background:var(--ags-bg-surface); border:1px solid var(--ags-accent); color:var(--ags-text-primary); font-size:12px; box-shadow:var(--ags-shadow); }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(style);
  }

  function renderSparklineSvg(values) {
    var list = Array.isArray(values) && values.length >= 2 ? values : [0, 0];
    var w = 160;
    var h = 28;
    var max = Math.max.apply(null, list.concat([1]));
    var pts = list.map(function (v, idx) {
      var x = (idx / (list.length - 1)) * w;
      var y = h - 3 - ((v / max) * (h - 6));
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="28" style="display:block;overflow:visible">' +
      '<polyline fill="none" stroke="var(--ags-accent,#D97757)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" points="' + pts + '"/>' +
      '</svg>';
  }

  function createDashboardDrawer(options) {
    if (typeof document === 'undefined') return null;
    ensureDrawerStyles();
    var opts = options || {};
    var el = document.createElement('aside');
    el.className = 'ags-drawer ags-hidden';
    el.setAttribute('data-ag-studio-ignore', 'true');
    el.setAttribute('data-ag-no-i18n', 'true');

    var state = {
      open: false,
      activeTab: 'overview',
      days: 30,
      speedHistory: [],
      proxyTestResult: null,
      timelineOpen: false,
      timelineData: null,
      enhanceStatus: null,
      unlockStatus: null,
      rehydrateStatus: null,
      snapshot: null,
      history: null,
      accounts: null,
      fonts: []
    };

    function t(key) {
      var cfg = opts.getConfig ? opts.getConfig() : {};
      var lang = (cfg && cfg.i18n && cfg.i18n.language) || 'zh-CN';
      return (UI_TEXT[lang] || UI_TEXT['zh-CN'])[key];
    }

    function showToast(msg) {
      if (!msg) return;
      var toast = document.createElement('div');
      toast.className = 'ags-toast';
      toast.setAttribute('data-ag-studio-ignore', 'true');
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(function () { try { toast.remove(); } catch (_e) {} }, 2600);
    }

    function renderOverview(snap) {
      var ctx = (snap && snap.context) || {};
      var bd = ctx.breakdown || {};
      var used = Number(ctx.usedTokens || 0);
      var limit = Number(ctx.contextLimit || 200000);
      var pct = used > 0 && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

      // Fix: never render a 100% orange thinking bar when there is no context data!
      var bdSys = Number(bd.system || 0);
      var bdTool = Number(bd.tools || 0);
      var bdChat = Number(bd.user || 0) + Number(bd.assistant || 0);
      var bdThink = Number(bd.thinking || 0);
      var bdSum = bdSys + bdTool + bdChat + bdThink;

      var segSys = 0, segTool = 0, segChat = 0, segThink = 0;
      if (used > 0 && bdSum > 0) {
        segSys = Math.round((bdSys / bdSum) * pct);
        segTool = Math.round((bdTool / bdSum) * pct);
        segChat = Math.round((bdChat / bdSum) * pct);
        segThink = bdThink > 0 ? Math.max(0, pct - segSys - segTool - segChat) : 0;
      } else if (used > 0 && pct > 0) {
        segChat = pct;
      }

      var speed = Number((ctx.speed && (ctx.speed.tokPerSec || ctx.speed.tps)) || 0);
      var ttft = Number((ctx.speed && ctx.speed.ttftMs) || 0);
      var cost = Number((snap && snap.estimatedSessionCostUsd) || 0);
      var pools = (snap && snap.quota && snap.quota.pools) || [];
      var legend = t('ctxLegend');

      var attachInfo = (snap && snap.attachments) || ctx.attachments || null;
      var attachHtml = '<div class="ags-sub">当前会话暂无附件</div>';
      if (attachInfo && Number(attachInfo.count || (attachInfo.files && attachInfo.files.length) || 0) > 0) {
        var files = Array.isArray(attachInfo.files) ? attachInfo.files : [];
        attachHtml = '<div class="ags-row"><span>已挂载 ' + esc(attachInfo.count || files.length) + ' 个附件</span>' +
          '<span class="ags-sub">' + (attachInfo.totalTokens ? ('≈ ' + fmtTok(attachInfo.totalTokens) + ' tok') : '') + '</span></div>' +
          (files.length
            ? '<div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">' + files.slice(0, 5).map(function (f) {
                var nm = typeof f === 'string' ? f : (f.name || f.path || 'file');
                var tk = typeof f === 'object' && f.tokens ? (' · ' + fmtTok(f.tokens) + ' tok') : '';
                return '<div class="ags-sub" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(nm + tk) + '</div>';
              }).join('') + '</div>'
            : '');
      }

      var turns = (state.timelineData && (state.timelineData.turns || state.timelineData.items)) || [];
      var timelineHtml = turns.length
        ? turns.slice(0, 10).map(function (tr, i) {
            return '<div class="ags-tl-item">' +
              '<div class="ags-row"><span style="font-weight:500">#' + (tr.turnIndex != null ? tr.turnIndex : (i + 1)) + ' · ' + esc(tr.model || 'model') + '</span>' +
              '<span class="ags-sub">' + esc(tr.tps ? (Math.round(tr.tps) + ' tok/s') : (tr.status || '')) + '</span></div>' +
              '<div class="ags-sub">in ' + fmtTok(tr.inputTokens || 0) + ' · out ' + fmtTok(tr.outputTokens || 0) +
              (tr.cacheReadTokens ? (' · cache ' + fmtTok(tr.cacheReadTokens)) : '') + '</div>' +
              '</div>';
          }).join('')
        : '<div class="ags-sub">' + (snap && snap.conversationId ? '暂无逐轮记录或等待加载' : '进入会话后可查看逐轮调用记录') + '</div>';

      var quotaHtml = pools.length
        ? pools.map(function (p) {
            var pPct = p.remainingPercent == null ? 100 : Math.round(p.remainingPercent);
            var eta = formatResetEta(p.resetTime);
            var barColor = p.isLow ? 'var(--ags-warning)' : 'var(--ags-accent)';
            return '<div style="display:flex;flex-direction:column;gap:4px">' +
              '<div class="ags-row"><span style="font-size:12px">' + esc(p.poolKey || p.title || 'Pool') + '</span>' +
              '<span class="ags-sub">' + pPct + '%' + (eta ? (' · ' + eta) : '') + '</span></div>' +
              '<div class="ags-prog"><div class="ags-prog-fill" style="width:' + pPct + '%;background:' + barColor + '"></div></div>' +
              '</div>';
          }).join('')
        : '<div class="ags-sub">' + esc(t('noQuota')) + '</div>';

      return [
        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('ctxTitle')) + '</span><span>' + esc(ctx.model || '未检测会话') + '</span></div>',
        '  <div class="ags-row"><span class="ags-big">' + pct + '%</span><span class="ags-sub">' + fmtTok(used) + ' / ' + fmtTok(limit) + '</span></div>',
        '  <div class="ags-seg-bar">' +
        '    <div style="width:' + segSys + '%;background:var(--ags-accent)"></div>' +
        '    <div style="width:' + segTool + '%;background:var(--ags-success)"></div>' +
        '    <div style="width:' + segChat + '%;background:#60A5FA"></div>' +
        '    <div style="width:' + segThink + '%;background:var(--ags-warning)"></div>' +
        '  </div>',
        '  <div class="ags-legend">' +
        '    <span class="ags-legend-item"><span class="ags-swatch" style="background:var(--ags-accent)"></span>' + legend.system + ' ' + fmtTok(bdSys) + '</span>' +
        '    <span class="ags-legend-item"><span class="ags-swatch" style="background:var(--ags-success)"></span>' + legend.tools + ' ' + fmtTok(bdTool) + '</span>' +
        '    <span class="ags-legend-item"><span class="ags-swatch" style="background:#60A5FA"></span>' + legend.chat + ' ' + fmtTok(bdChat) + '</span>' +
        '    <span class="ags-legend-item"><span class="ags-swatch" style="background:var(--ags-warning)"></span>' + legend.think + ' ' + fmtTok(bdThink) + '</span>' +
        '  </div>',
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('perfTitle')) + '</span><span>缓存命中 ' + Math.round((ctx.cacheHitRate || 0) * 100) + '%</span></div>',
        '  <div class="ags-grid-3">',
        '    <div class="ags-metric-box"><div class="ags-sub">' + esc(t('speed')) + '</div><div class="ags-metric-val">' + Math.round(speed) + ' <span class="ags-sub">tok/s</span></div></div>',
        '    <div class="ags-metric-box"><div class="ags-sub">' + esc(t('ttft')) + '</div><div class="ags-metric-val">' + (ttft ? Math.round(ttft) : '-') + ' <span class="ags-sub">ms</span></div></div>',
        '    <div class="ags-metric-box"><div class="ags-sub">' + esc(t('cost')) + '</div><div class="ags-metric-val">$' + cost.toFixed(3) + '</div></div>',
        '  </div>',
        '  <div>' + renderSparklineSvg(state.speedHistory.slice(-16)) + '</div>',
        '</div>',

        '<details class="ags-details" id="ags-timeline-details" ' + (state.timelineOpen ? 'open' : '') + '>',
        '  <summary>' + esc(t('timelineTitle')) + '</summary>',
        '  <div style="display:flex;flex-direction:column;gap:6px">' + timelineHtml + '</div>',
        '</details>',

        '<details class="ags-details">',
        '  <summary>' + esc(t('attachTitle')) + '</summary>',
        attachHtml,
        '</details>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('quotaTitle')) + '</span>' +
        '    <div style="display:flex;gap:6px"><button class="ags-btn" data-action="refresh-quota-only">刷新</button><button class="ags-btn" data-action="launch-cli">' + esc(t('launchCli')) + '</button></div></div>',
        quotaHtml,
        '</div>'
      ].join('\n');
    }

    function renderUsage(hist, cfg) {
      var h = hist || { totalTokens: 0, totalCostUsd: 0, savingsVsSub: 0, bySource: { desktop: { totalTokens: 0 }, cli: { totalTokens: 0 } }, byModel: [], heatmap7xN: [], heatmap: [] };
      var cells = [];
      if (globalScope.__AG_STUDIO_HOME_CARD__ && globalScope.__AG_STUDIO_HOME_CARD__.normalizeHeatmap7xN) {
        cells = globalScope.__AG_STUDIO_HOME_CARD__.normalizeHeatmap7xN(h, state.days || 30);
      } else {
        cells = (h.heatmap || []).slice(-63).map(function (c) {
          return { date: c.date, total: c.totalTokens || 0, level: (c.totalTokens || 0) > 0 ? 2 : 0 };
        });
      }

      var hmHtml = cells.map(function (c) {
        var bg = c.level === 0 ? 'var(--ags-bg-subtle)' :
          c.level === 1 ? 'color-mix(in srgb, var(--ags-accent) 26%, var(--ags-bg-subtle))' :
          c.level === 2 ? 'color-mix(in srgb, var(--ags-accent) 48%, var(--ags-bg-subtle))' :
          c.level === 3 ? 'color-mix(in srgb, var(--ags-accent) 72%, var(--ags-bg-subtle))' :
          'var(--ags-accent)';
        return '<div class="ags-hm-cell" style="background:' + bg + '" title="' + esc(c.date + ': ' + fmtTok(c.total) + ' tokens') + '"></div>';
      }).join('');

      var deskTok = Number((h.bySource && h.bySource.desktop && (h.bySource.desktop.totalTokens != null ? h.bySource.desktop.totalTokens : h.bySource.desktop)) || 0);
      var cliTok = Number((h.bySource && h.bySource.cli && (h.bySource.cli.totalTokens != null ? h.bySource.cli.totalTokens : h.bySource.cli)) || 0);
      var sumSrc = Math.max(1, deskTok + cliTok);
      var deskPct = deskTok + cliTok > 0 ? Math.round((deskTok / sumSrc) * 100) : 100;
      var cliPct = deskTok + cliTok > 0 ? (100 - deskPct) : 0;

      var topModels = (h.byModel || []).slice(0, 6);
      var maxModel = Math.max.apply(null, topModels.map(function (m) { return m.totalTokens || 0; }).concat([1]));
      var modelHtml = topModels.length
        ? topModels.map(function (m) {
            var w = Math.round(((m.totalTokens || 0) / maxModel) * 100);
            return '<div style="display:flex;flex-direction:column;gap:3px">' +
              '<div class="ags-row"><span style="font-size:12px">' + esc(m.model) + '</span><span class="ags-sub">' + fmtTok(m.totalTokens) + ' · $' + Number(m.costUsd || 0).toFixed(2) + '</span></div>' +
              '<div class="ags-prog"><div class="ags-prog-fill" style="width:' + w + '%"></div></div></div>';
          }).join('')
        : '<div class="ags-sub">暂无历史用量记录</div>';

      var subPrice = Number((cfg && cfg.enhance && cfg.enhance.subscriptionMonthlyUsd) != null ? cfg.enhance.subscriptionMonthlyUsd : 20);
      var estCost = Number(h.totalCostUsd != null ? h.totalCostUsd : (h.costEstimate || 0));
      var savings = Number(h.savingsVsSub != null ? h.savingsVsSub : (h.savingsVsApiUsd != null ? h.savingsVsApiUsd : (estCost - subPrice)));

      return [
        '<div class="ags-row">',
        '  <div class="ags-pill-group">',
        '    <button class="ags-pill-opt ' + (state.days === 0 ? 'active' : '') + '" data-days="0">' + esc(t('daysAll')) + '</button>',
        '    <button class="ags-pill-opt ' + (state.days === 7 ? 'active' : '') + '" data-days="7">' + esc(t('days7')) + '</button>',
        '    <button class="ags-pill-opt ' + (state.days === 30 ? 'active' : '') + '" data-days="30">' + esc(t('days30')) + '</button>',
        '    <button class="ags-pill-opt ' + (state.days === 90 ? 'active' : '') + '" data-days="90">' + esc(t('days90')) + '</button>',
        '  </div>',
        '  <button class="ags-btn" id="ags-sync-pricing-btn">' + esc(t('syncPricing')) + '</button>',
        '</div>',

        '<div class="ags-grid-3">',
        '  <div class="ags-metric-box"><div class="ags-sub">' + esc(t('totalTok')) + '</div><div class="ags-metric-val">' + fmtTok(h.totalTokens) + '</div></div>',
        '  <div class="ags-metric-box"><div class="ags-sub">' + esc(t('estApi')) + '</div><div class="ags-metric-val">$' + estCost.toFixed(2) + '</div></div>',
        '  <div class="ags-metric-box"><div class="ags-sub">' + esc(t('vsSub')) + '</div><div class="ags-metric-val">' + (savings >= 0 ? ('+$' + savings.toFixed(1)) : ('-$' + Math.abs(savings).toFixed(1))) + '</div></div>',
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('heatmap')) + '</span><span class="ags-sub">' + (h.sessions || 0) + ' 会话 · ' + (h.calls || 0) + ' 消息</span></div>',
        '  <div class="ags-hm-7row">' + hmHtml + '</div>',
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('sourceSplit')) + '</span><span class="ags-sub">Desktop ' + deskPct + '% / CLI ' + cliPct + '%</span></div>',
        '  <div class="ags-seg-bar"><div style="width:' + deskPct + '%;background:var(--ags-accent)"></div><div style="width:' + cliPct + '%;background:var(--ags-success)"></div></div>',
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('topModels')) + '</span><span class="ags-sub">订阅月费 $<input id="ags-sub-price" type="number" min="0" max="500" value="' + subPrice + '" style="width:46px;background:transparent;border:1px solid var(--ags-border);border-radius:5px;color:var(--ags-text-primary);padding:1px 4px;font-size:11px"></span></div>',
        modelHtml,
        '</div>'
      ].join('\n');
    }

    function renderAccounts(overview) {
      var ov = overview || { accounts: [], activeDetected: null, keepalive: { enabled: false }, autoSwitch: { enabled: false, threshold: 0.05 } };
      var list = ov.accounts || [];
      var activeInfo = ov.activeDetected || list.find(function (a) { return a.isActive; }) || null;

      var bannerHtml = '<div class="ags-card" style="padding:10px 12px">' +
        '<div class="ags-row"><span class="ags-sub">当前检测账号</span><span class="ags-sub">' + esc(activeInfo ? (activeInfo.planName || 'Active') : '未登录/未检测') + '</span></div>' +
        '<div style="font-weight:600;font-size:13px">' + esc(activeInfo ? (activeInfo.email || activeInfo.name || '已登录') : '等待检测客户端登录态') + '</div>' +
        '</div>';

      var cards = list.length
        ? list.map(function (a) {
            var letter = (a.name || a.email || 'A').slice(0, 1).toUpperCase();
            var minQ = a.quotaSnapshot && a.quotaSnapshot.minRemainingPercent;
            return '<div class="ags-acc-item">' +
              '  <div style="display:flex;align-items:center;gap:10px;min-width:0">' +
              '    <div class="ags-avatar">' + esc(letter) + '</div>' +
              '    <div style="min-width:0">' +
              '      <div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(a.email || a.name) + '</div>' +
              '      <div class="ags-sub">' + esc(a.planName || a.source || 'Standard') + (minQ != null ? (' · 额度 ' + Math.round(minQ) + '%') : '') + '</div>' +
              '    </div>' +
              '  </div>' +
              '  <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">' +
              (a.isActive
                ? '<span class="ags-pill-opt active">' + esc(t('activeTag')) + '</span>'
                : '<button class="ags-btn ags-btn-primary" data-acc-switch="' + esc(a.id) + '">' + esc(t('switchBtn')) + '</button>') +
              '    <button class="ags-btn ags-btn-ghost" title="移除" data-acc-remove="' + esc(a.id) + '">×</button>' +
              '  </div>' +
              '</div>';
          }).join('')
        : '<div class="ags-card"><div class="ags-sub">尚未保存账号槽位，点击上方「导入当前」快速保存当前登录态。</div></div>';

      var ka = ov.keepalive || {};
      var asw = ov.autoSwitch || {};

      return [
        bannerHtml,
        '<div class="ags-row" style="flex-wrap:wrap;gap:6px">',
        '  <button class="ags-btn ags-btn-primary" data-acc-action="import_current">' + esc(t('importCur')) + '</button>',
        '  <button class="ags-btn" data-acc-action="oauth_login">' + esc(t('addOauth')) + '</button>',
        '  <button class="ags-btn" data-acc-action="import_tools">' + esc(t('importTools')) + '</button>',
        '  <button class="ags-btn" data-acc-action="refresh_quota">' + esc(t('refreshQuota')) + '</button>',
        '</div>',
        cards,
        '<details class="ags-details">',
        '  <summary>' + esc(t('keepaliveTitle')) + '</summary>',
        '  <div class="ags-row" style="margin-bottom:8px"><span>启用后台保活 (Keepalive)</span><input type="checkbox" id="ags-keepalive-en" ' + (ka.enabled ? 'checked' : '') + '></div>',
        '  <div class="ags-row" style="margin-bottom:8px"><span>启用低额度自动切号</span><input type="checkbox" id="ags-auto-switch-en" ' + (asw.enabled ? 'checked' : '') + '></div>',
        '  <div class="ags-row"><span>触发阈值 (%)</span><input class="ags-input" style="width:90px" type="number" min="1" max="50" id="ags-auto-switch-th" value="' + Math.round(((asw.threshold) || 0.05) * 100) + '"></div>',
        '</details>'
      ].join('\n');
    }

    function renderSettings(cfg) {
      var themeCfg = cfg.theme || {};
      var mascotCfg = cfg.mascot || {};
      var hudCfg = cfg.hud || {};
      var fxCfg = cfg.fx || {};
      var i18nCfg = cfg.i18n || {};
      var proxyCfg = cfg.proxy || {};
      var fonts = themeCfg.fonts || {};
      var customThemes = Array.isArray(themeCfg.customThemes) ? themeCfg.customThemes : [];
      var scannedFonts = state.fonts || [];
      var enh = state.enhanceStatus || {};
      var unl = state.unlockStatus || {};
      var reh = state.rehydrateStatus || {};

      var curPromptTier = enh.promptTier != null ? Number(enh.promptTier) : Number((cfg.enhance && cfg.enhance.promptTier) || 0);
      var curCnTitle = enh.chineseTitle != null ? Boolean(enh.chineseTitle) : Boolean(cfg.enhance && cfg.enhance.chineseSessionTitle);
      var curUnlockMode = unl.mode || (cfg.context && cfg.context.unlockMode) || 'ORIG';
      var curUnlockConst = unl.limitTokens || (cfg.context && cfg.context.unlockLimitTokens) || 512000;
      var curCliAlign = unl.alignCli != null ? Boolean(unl.alignCli) : Boolean(cfg.context && cfg.context.alignCli);
      var curRehydrate = Boolean(reh.enabled != null ? reh.enabled : (cfg.enhance && cfg.enhance.rehydrateEnabled));

      var customThemeOptions = customThemes.map(function (ct) {
        return '<div class="ags-row" style="margin-top:6px">' +
          '<button class="ags-btn ' + (themeCfg.activePreset === ct.id ? 'ags-btn-primary' : '') + '" data-select-theme="' + esc(ct.id) + '">' + esc(ct.name) + '</button>' +
          '<button class="ags-btn ags-btn-ghost" data-del-theme="' + esc(ct.id) + '">删除</button>' +
          '</div>';
      }).join('');

      return [
        // Section 1: Appearance, Fonts & Mascot
        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('secTheme')) + '</span></div>',
        '  <div class="ags-theme-cards">',
        '    <button class="ags-theme-card ' + (themeCfg.activePreset === 'claude' ? 'active' : '') + '" data-select-theme="claude">' +
        '      <div style="display:flex;align-items:center;gap:6px;font-weight:600"><span class="ags-swatch" style="background:#D97757;border-radius:50%"></span>Claude</div>' +
        '      <div class="ags-sub" style="margin-top:2px">暖纸陶橙编辑部</div>' +
        '    </button>',
        '    <button class="ags-theme-card ' + (themeCfg.activePreset === 'antigravity' ? 'active' : '') + '" data-select-theme="antigravity">' +
        '      <div style="display:flex;align-items:center;gap:6px;font-weight:600"><span class="ags-swatch" style="background:#3B6CF6;border-radius:50%"></span>Antigravity</div>' +
        '      <div class="ags-sub" style="margin-top:2px">星轨极光未来感</div>' +
        '    </button>',
        '  </div>',
        '  <div class="ags-row"><span>明暗模式</span>' +
        '    <div class="ags-pill-group">' +
        '      <button class="ags-pill-opt ' + (themeCfg.colorMode === 'system' ? 'active' : '') + '" data-colormode="system">系统</button>' +
        '      <button class="ags-pill-opt ' + (themeCfg.colorMode === 'light' ? 'active' : '') + '" data-colormode="light">浅色</button>' +
        '      <button class="ags-pill-opt ' + (themeCfg.colorMode === 'dark' ? 'active' : '') + '" data-colormode="dark">深色</button>' +
        '    </div></div>',
        '  <div class="ags-row"><span>桌宠</span>' +
        '    <div style="display:flex;gap:5px;align-items:center">' +
        '      <select class="ags-select" style="width:98px" id="ags-mascot-style">' +
        '        <option value="clawd" ' + (mascotCfg.style === 'clawd' ? 'selected' : '') + '>Clawd 蟹</option>' +
        '        <option value="deepy" ' + (mascotCfg.style === 'deepy' ? 'selected' : '') + '>Deepy 鲸</option>' +
        '        <option value="astra" ' + (mascotCfg.style === 'astra' ? 'selected' : '') + '>Astra 星灵</option>' +
        '      </select>' +
        '      <select class="ags-select" style="width:62px" id="ags-mascot-scale">' +
        '        <option value="1" ' + (Number(mascotCfg.scale || 1) === 1 ? 'selected' : '') + '>1x</option>' +
        '        <option value="1.5" ' + (Number(mascotCfg.scale) === 1.5 ? 'selected' : '') + '>1.5x</option>' +
        '        <option value="2" ' + (Number(mascotCfg.scale) === 2 ? 'selected' : '') + '>2x</option>' +
        '      </select>' +
        '      <select class="ags-select" style="width:54px" id="ags-mascot-align">' +
        '        <option value="right" ' + ((mascotCfg.align || 'right') === 'right' ? 'selected' : '') + '>右</option>' +
        '        <option value="center" ' + (mascotCfg.align === 'center' ? 'selected' : '') + '>中</option>' +
        '        <option value="left" ' + (mascotCfg.align === 'left' ? 'selected' : '') + '>左</option>' +
        '      </select>' +
        '      <input type="checkbox" id="ags-mascot-enabled" ' + (mascotCfg.enabled !== false ? 'checked' : '') + '>' +
        '    </div></div>',
        '  <div class="ags-row"><span>512K 呼吸试管</span><input type="checkbox" id="ags-vial-enabled" ' + (hudCfg.showVial !== false ? 'checked' : '') + '></div>',
        '  <div class="ags-row"><span>HUD 状态胶囊</span>' +
        '    <div style="display:flex;gap:6px;align-items:center">' +
        '      <select class="ags-select" style="width:110px" id="ags-hud-pos">' +
        '        <option value="composer" ' + (hudCfg.position !== 'floating' ? 'selected' : '') + '>对话框正下方</option>' +
        '        <option value="floating" ' + (hudCfg.position === 'floating' ? 'selected' : '') + '>右下角悬浮</option>' +
        '      </select>' +
        '      <input type="checkbox" id="ags-hud-enabled" ' + (hudCfg.enabled !== false ? 'checked' : '') + '>' +
        '    </div></div>',
        '  <div class="ags-row"><span>新对话首页用量概览卡片</span><input type="checkbox" id="ags-home-card-enabled" ' + (cfg.homeOverview !== false && hudCfg.homeOverview !== false ? 'checked' : '') + '></div>',
        '  <details class="ags-details">',
        '    <summary>' + esc(t('customThemeTitle')) + ' & 三轨字体 (' + scannedFonts.length + ')</summary>',
        '    <div class="ags-row" style="gap:6px">' +
        '      <input class="ags-input" id="ags-new-theme-name" placeholder="新方案名称">' +
        '      <input type="color" id="ags-new-theme-accent" value="#D97757" style="width:36px;height:30px;border:none;background:transparent">' +
        '      <button class="ags-btn" id="ags-create-theme-btn">新建</button>' +
        '    </div>',
        customThemeOptions,
        '    <div class="ags-row" style="margin-top:8px"><span>编辑部衬线阅读</span><input type="checkbox" id="ags-serif-toggle" ' + (themeCfg.editorialSerif !== false ? 'checked' : '') + '></div>',
        '    <div class="ags-row" style="margin-top:6px"><span class="ags-sub">UI 字体</span><select class="ags-select" style="width:160px" id="ags-font-ui">' +
        '      <option value="system" ' + ((fonts.ui || 'system') === 'system' ? 'selected' : '') + '>System UI</option>' +
        '      <option value="inter" ' + (fonts.ui === 'inter' ? 'selected' : '') + '>Inter</option>' +
        '      <option value="noto" ' + (fonts.ui === 'noto' ? 'selected' : '') + '>Noto Sans SC</option>' +
        '    </select></div>',
        '    <div class="ags-row" style="margin-top:6px"><span class="ags-sub">正文字体</span><select class="ags-select" style="width:160px" id="ags-font-body">' +
        '      <option value="serif-editorial" ' + ((fonts.body || 'serif-editorial') === 'serif-editorial' ? 'selected' : '') + '>Newsreader / 思源宋体</option>' +
        '      <option value="sans-clean" ' + (fonts.body === 'sans-clean' ? 'selected' : '') + '>干净无衬线</option>' +
        '      <option value="georgia" ' + (fonts.body === 'georgia' ? 'selected' : '') + '>Georgia 经典</option>' +
        '    </select></div>',
        '    <div class="ags-row" style="margin-top:6px"><span class="ags-sub">代码字体</span><select class="ags-select" style="width:160px" id="ags-font-code">' +
        '      <option value="jetbrains" ' + ((fonts.code || 'jetbrains') === 'jetbrains' ? 'selected' : '') + '>JetBrains Mono</option>' +
        '      <option value="cascadia" ' + (fonts.code === 'cascadia' ? 'selected' : '') + '>Cascadia Code</option>' +
        '      <option value="system" ' + (fonts.code === 'system' ? 'selected' : '') + '>System Monospace</option>' +
        '    </select></div>',
        '    <div class="ags-row" style="margin-top:6px"><span class="ags-sub">自定义正文字体名</span><input class="ags-input" style="width:160px" id="ags-custom-body-font" value="' + esc(fonts.customBodyFont || '') + '" placeholder="本地字体名"></div>',
        '    <div class="ags-row" style="margin-top:6px"><span class="ags-sub">本地字体目录 (' + scannedFonts.length + ' 已加载)</span><button class="ags-btn" data-open-path="fonts">打开目录</button></div>',
        '  </details>',
        '</div>',

        // Section 2: Prism FX
        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('secFx')) + '</span></div>',
        '  <div class="ags-row"><span>水墨流式淡入</span><input type="checkbox" id="ags-fx-ink" ' + (fxCfg.inkStream !== false ? 'checked' : '') + '></div>',
        '  <div class="ags-row"><span>输入框平滑光标</span><input type="checkbox" id="ags-fx-caret" ' + (fxCfg.smoothCaret !== false ? 'checked' : '') + '></div>',
        '  <div class="ags-row"><span>三态边缘余晖提示</span><input type="checkbox" id="ags-fx-aura" ' + (fxCfg.edgeAura !== false ? 'checked' : '') + '></div>',
        '  <div class="ags-row"><span>模型菜单推理等级滑块</span><input type="checkbox" id="ags-fx-effort" ' + (fxCfg.effortSlider !== false ? 'checked' : '') + '></div>',
        '</div>',

        // Section 3: Language & Dictionary
        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('secLang')) + '</span></div>',
        '  <div class="ags-row"><span>界面语言</span>' +
        '    <div class="ags-pill-group">' +
        '      <button class="ags-pill-opt ' + (i18nCfg.language === 'zh-CN' ? 'active' : '') + '" data-lang="zh-CN">简体</button>',
        '      <button class="ags-pill-opt ' + (i18nCfg.language === 'zh-TW' ? 'active' : '') + '" data-lang="zh-TW">繁體</button>',
        '      <button class="ags-pill-opt ' + (i18nCfg.language === 'en' ? 'active' : '') + '" data-lang="en">EN</button>',
        '    </div></div>',
        '  <div class="ags-row"><span>原生菜单与托盘汉化</span><input type="checkbox" id="ags-native-menu-i18n" ' + (i18nCfg.translateNativeMenu !== false ? 'checked' : '') + '></div>',
        '  <details class="ags-details">',
        '    <summary>' + esc(t('customDictTitle')) + '</summary>',
        '    <div class="ags-row" style="gap:6px">' +
        '      <input class="ags-input" id="ags-dict-en" placeholder="英文原文">' +
        '      <input class="ags-input" id="ags-dict-zh" placeholder="自定义译文">' +
        '      <button class="ags-btn" id="ags-dict-add-btn">添加</button>' +
        '    </div>',
        '  </details>',
        '</div>',

        // Section 4: Proxy & System Enhancements
        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('secNet')) + '</span>' + (state.proxyTestResult ? '<span class="ags-sub">' + esc(state.proxyTestResult) + '</span>' : '') + '</div>',
        '  <div class="ags-row"><span>免 TUN 本地代理</span><input type="checkbox" id="ags-proxy-enabled" ' + (proxyCfg.enabled ? 'checked' : '') + '></div>',
        '  <div class="ags-row" style="gap:6px">' +
        '    <input class="ags-input" id="ags-proxy-url" value="' + esc(proxyCfg.proxyUrl || 'http://127.0.0.1:7897') + '" placeholder="http://127.0.0.1:7897">' +
        '    <button class="ags-btn" id="ags-proxy-save-btn">保存</button>' +
        '    <button class="ags-btn" id="ags-proxy-test-btn">' + esc(t('testProxy')) + '</button>' +
        '  </div>',
        '  <div><div class="ags-sub" style="margin-bottom:4px">Bypass 绕过规则</div><input class="ags-input" id="ags-proxy-bypass" value="' + esc(proxyCfg.bypassList || '') + '"></div>',

        '  <details class="ags-details" open>',
        '    <summary>' + esc(t('enhanceTitle')) + '</summary>',
        '    <div style="display:flex;flex-direction:column;gap:8px">',
        '      <div class="ags-row"><span>系统提示词精简档位</span>' +
        '        <select class="ags-select" style="width:165px" id="ags-prompt-tier">' +
        '          <option value="0" ' + (curPromptTier === 0 ? 'selected' : '') + '>0 档 · 官方原版</option>' +
        '          <option value="1" ' + (curPromptTier === 1 ? 'selected' : '') + '>1 档 · 仅去推销</option>' +
        '          <option value="2" ' + (curPromptTier === 2 ? 'selected' : '') + '>2 档 · 原版精简</option>' +
        '          <option value="3" ' + (curPromptTier === 3 ? 'selected' : '') + '>3 档 · 核心重写</option>' +
        '          <option value="4" ' + (curPromptTier === 4 ? 'selected' : '') + '>4 档 · 精简+防幻觉</option>' +
        '        </select></div>',
        '      <div class="ags-row"><span>对话自动中文标题</span><input type="checkbox" id="ags-cn-title" ' + (curCnTitle ? 'checked' : '') + '></div>',
        '      <div class="ags-row" style="justify-content:flex-end;gap:6px">' +
        '        <button class="ags-btn ags-btn-primary" id="ags-enhance-apply-btn">应用提示词/标题</button>' +
        '        <button class="ags-btn" id="ags-enhance-restore-btn">还原</button>' +
        '      </div>',

        '      <hr style="border:none;border-top:1px solid var(--ags-border);margin:2px 0">',

        '      <div class="ags-row"><span>上下文窗口解锁</span>' +
        '        <select class="ags-select" style="width:165px" id="ags-unlock-mode">' +
        '          <option value="ORIG" ' + (curUnlockMode === 'ORIG' ? 'selected' : '') + '>ORIG · 原版 (256K)</option>' +
        '          <option value="CONST" ' + (curUnlockMode === 'CONST' ? 'selected' : '') + '>CONST · 固定上限</option>' +
        '          <option value="DYN" ' + (curUnlockMode === 'DYN' ? 'selected' : '') + '>DYN · 动态解锁 (1M)</option>' +
        '        </select></div>',
        '      <div class="ags-row"><span>CONST 上限 (tokens)</span><input class="ags-input" style="width:120px" type="number" id="ags-unlock-limit" value="' + esc(curUnlockConst) + '"></div>',
        '      <div class="ags-row"><span>同步对齐 agy CLI</span><input type="checkbox" id="ags-unlock-cli" ' + (curCliAlign ? 'checked' : '') + '></div>',
        '      <div class="ags-row" style="justify-content:flex-end;gap:6px">' +
        '        <button class="ags-btn ags-btn-primary" id="ags-unlock-apply-btn">应用上下文解锁</button>' +
        '        <button class="ags-btn" id="ags-unlock-restore-btn">还原</button>' +
        '      </div>',

        '      <hr style="border:none;border-top:1px solid var(--ags-border);margin:2px 0">',

        '      <div class="ags-row"><span>压缩后记忆自动回填</span><input type="checkbox" id="ags-rehydrate-en" ' + (curRehydrate ? 'checked' : '') + '></div>',
        '      <div class="ags-row" style="gap:6px;flex-wrap:wrap;margin-top:4px">' +
        '        <button class="ags-btn" id="ags-restart-ls-btn">重启 LS</button>' +
        '        <button class="ags-btn" id="ags-restart-host-btn">重启宿主客户端</button>' +
        '        <button class="ags-btn" data-open-path="state">配置目录</button>' +
        '      </div>',
        '    </div>',
        '  </details>',
        '</div>'
      ].join('\n');
    }

    function bindEvents(cfg) {
      el.querySelectorAll('[data-tab]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.activeTab = btn.getAttribute('data-tab');
          if (opts.onTabChange) opts.onTabChange(state.activeTab);
          render();
        });
      });

      var closeBtn = el.querySelector('#ags-close-btn');
      if (closeBtn) closeBtn.addEventListener('click', function () { toggle(false); });

      var tlDet = el.querySelector('#ags-timeline-details');
      if (tlDet) {
        tlDet.addEventListener('toggle', function () {
          state.timelineOpen = tlDet.open;
          if (tlDet.open && opts.api && opts.api.getSessionTimeline && state.snapshot && state.snapshot.conversationId) {
            opts.api.getSessionTimeline(state.snapshot.conversationId, { limit: 15 }).then(function (tl) {
              state.timelineData = tl;
              render();
            }).catch(function () {});
          }
        });
      }

      el.querySelectorAll('[data-days]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.days = Number(btn.getAttribute('data-days'));
          if (opts.onRefresh) opts.onRefresh(true);
        });
      });

      var syncPriceBtn = el.querySelector('#ags-sync-pricing-btn');
      if (syncPriceBtn) {
        syncPriceBtn.addEventListener('click', function () {
          if (!opts.api || !opts.api.syncPricing) return;
          opts.api.syncPricing({ force: true }).then(function () {
            showToast('已同步最新模型定价');
            if (opts.onRefresh) opts.onRefresh(true);
          }).catch(function (e) { showToast(e.message || '同步失败'); });
        });
      }

      var subPriceEl = el.querySelector('#ags-sub-price');
      if (subPriceEl) {
        subPriceEl.addEventListener('change', function () {
          opts.saveConfig({ enhance: { subscriptionMonthlyUsd: Number(subPriceEl.value || 20) } });
        });
      }

      var refQuotaBtn = el.querySelector('[data-action="refresh-quota-only"]');
      if (refQuotaBtn) {
        refQuotaBtn.addEventListener('click', function () {
          if (opts.api && opts.api.getQuota) {
            opts.api.getQuota({ force: true }).then(function (q) {
              if (state.snapshot && q) state.snapshot.quota = q;
              showToast('额度已刷新');
              render();
            }).catch(function () {});
          }
        });
      }

      var cliBtn = el.querySelector('[data-action="launch-cli"]');
      if (cliBtn) cliBtn.addEventListener('click', function () {
        if (opts.api && opts.api.launchCli) opts.api.launchCli().then(function () { showToast('已唤起 CLI 终端'); });
      });

      el.querySelectorAll('[data-acc-action]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var action = btn.getAttribute('data-acc-action');
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: action }).then(function () {
              showToast('操作已完成');
              if (opts.onRefresh) opts.onRefresh(true);
            }).catch(function (err) { showToast((err && err.message) || '操作失败'); });
          }
        });
      });

      el.querySelectorAll('[data-acc-switch]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-acc-switch');
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: 'switch', accountId: id }).then(function (res) {
              showToast(res && res.requiresRestart ? '已切换账号，重启客户端生效' : '账号已切换');
              if (opts.onRefresh) opts.onRefresh(true);
            }).catch(function (err) { showToast(err.message); });
          }
        });
      });

      el.querySelectorAll('[data-acc-remove]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-acc-remove');
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: 'remove', accountId: id }).then(function () {
              if (opts.onRefresh) opts.onRefresh(true);
            });
          }
        });
      });

      var kaEn = el.querySelector('#ags-keepalive-en');
      if (kaEn) {
        kaEn.addEventListener('change', function () {
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: kaEn.checked ? 'update_keepalive' : 'stop_keepalive', enabled: kaEn.checked }).then(function () {
              showToast(kaEn.checked ? '已开启账号保活' : '已关闭保活');
            }).catch(function () {});
          }
        });
      }

      var autoSw = el.querySelector('#ags-auto-switch-en');
      var autoTh = el.querySelector('#ags-auto-switch-th');
      if (autoSw && autoTh) {
        var saveAuto = function () {
          var payload = { enabled: autoSw.checked, threshold: Number(autoTh.value || 5) / 100 };
          opts.saveConfig({ quota: { autoSwitch: payload } });
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: 'update_auto_switch', autoSwitch: payload }).catch(function () {});
          }
        };
        autoSw.addEventListener('change', saveAuto);
        autoTh.addEventListener('change', saveAuto);
      }

      el.querySelectorAll('[data-select-theme]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          opts.saveConfig({ theme: { activePreset: btn.getAttribute('data-select-theme') } });
        });
      });

      el.querySelectorAll('[data-del-theme]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-del-theme');
          var next = (cfg.theme.customThemes || []).filter(function (c) { return c.id !== id; });
          opts.saveConfig({ theme: { customThemes: next, activePreset: cfg.theme.activePreset === id ? 'claude' : cfg.theme.activePreset } });
        });
      });

      el.querySelectorAll('[data-colormode]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          opts.saveConfig({ theme: { colorMode: btn.getAttribute('data-colormode') } });
        });
      });

      var serifEl = el.querySelector('#ags-serif-toggle');
      if (serifEl) serifEl.addEventListener('change', function () {
        opts.saveConfig({ theme: { editorialSerif: serifEl.checked } });
      });

      var mStyle = el.querySelector('#ags-mascot-style');
      var mScale = el.querySelector('#ags-mascot-scale');
      var mAlign = el.querySelector('#ags-mascot-align');
      var mEn = el.querySelector('#ags-mascot-enabled');
      if (mStyle && mScale && mEn) {
        var saveMascot = function () {
          opts.saveConfig({
            mascot: {
              style: mStyle.value,
              scale: Number(mScale.value),
              align: mAlign ? mAlign.value : 'right',
              enabled: mEn.checked
            }
          });
        };
        mStyle.addEventListener('change', saveMascot);
        mScale.addEventListener('change', saveMascot);
        if (mAlign) mAlign.addEventListener('change', saveMascot);
        mEn.addEventListener('change', saveMascot);
      }

      var hPos = el.querySelector('#ags-hud-pos');
      var hEn = el.querySelector('#ags-hud-enabled');
      var vialEn = el.querySelector('#ags-vial-enabled');
      if (hPos && hEn && vialEn) {
        var saveHud = function () {
          opts.saveConfig({ hud: { position: hPos.value, enabled: hEn.checked, showVial: vialEn.checked } });
        };
        hPos.addEventListener('change', saveHud);
        hEn.addEventListener('change', saveHud);
        vialEn.addEventListener('change', saveHud);
      }

      var homeCardEl = el.querySelector('#ags-home-card-enabled');
      if (homeCardEl) homeCardEl.addEventListener('change', function () {
        opts.saveConfig({ homeOverview: homeCardEl.checked, hud: { homeOverview: homeCardEl.checked } });
      });

      var fxMap = [
        ['#ags-fx-ink', 'inkStream'],
        ['#ags-fx-caret', 'smoothCaret'],
        ['#ags-fx-aura', 'edgeAura'],
        ['#ags-fx-effort', 'effortSlider']
      ];
      fxMap.forEach(function (pair) {
        var node = el.querySelector(pair[0]);
        if (node) {
          node.addEventListener('change', function () {
            var p = {};
            p[pair[1]] = node.checked;
            opts.saveConfig({ fx: p });
          });
        }
      });

      var createThemeBtn = el.querySelector('#ags-create-theme-btn');
      if (createThemeBtn) createThemeBtn.addEventListener('click', function () {
        var nameInput = el.querySelector('#ags-new-theme-name');
        var colorInput = el.querySelector('#ags-new-theme-accent');
        var themesApi = globalScope.__AG_STUDIO_THEMES__;
        if (!themesApi) return;
        var base = themesApi.cloneThemeAsCustom(cfg.theme && cfg.theme.activePreset === 'antigravity' ? 'antigravity' : 'claude', (nameInput && nameInput.value) || 'My Theme');
        var hex = (colorInput && colorInput.value) || '#D97757';
        Object.assign(base.light, themesApi.deriveAccentTokens(hex, false));
        Object.assign(base.dark, themesApi.deriveAccentTokens(hex, true));
        var nextCustoms = ((cfg.theme && cfg.theme.customThemes) || []).concat([base]);
        opts.saveConfig({ theme: { customThemes: nextCustoms, activePreset: base.id } });
        showToast('已创建并应用自定义配色');
      });

      var fontBindings = [
        ['#ags-font-ui', 'ui'],
        ['#ags-font-body', 'body'],
        ['#ags-font-code', 'code']
      ];
      fontBindings.forEach(function (pair) {
        var sel = el.querySelector(pair[0]);
        if (sel) {
          sel.addEventListener('change', function () {
            var f = {};
            f[pair[1]] = sel.value;
            opts.saveConfig({ theme: { fonts: f } });
          });
        }
      });

      var bodyFontInput = el.querySelector('#ags-custom-body-font');
      if (bodyFontInput) bodyFontInput.addEventListener('change', function () {
        opts.saveConfig({ theme: { fonts: { customBodyFont: bodyFontInput.value.trim() } } });
      });

      el.querySelectorAll('[data-lang]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          opts.saveConfig({ i18n: { language: btn.getAttribute('data-lang') } });
        });
      });

      var nativeI18nEl = el.querySelector('#ags-native-menu-i18n');
      if (nativeI18nEl) nativeI18nEl.addEventListener('change', function () {
        opts.saveConfig({ i18n: { translateNativeMenu: nativeI18nEl.checked, translateTray: nativeI18nEl.checked } });
      });

      var dictAddBtn = el.querySelector('#ags-dict-add-btn');
      if (dictAddBtn) dictAddBtn.addEventListener('click', function () {
        var enVal = (el.querySelector('#ags-dict-en').value || '').trim();
        var zhVal = (el.querySelector('#ags-dict-zh').value || '').trim();
        if (!enVal || !zhVal || !opts.api || !opts.api.getI18nPayload) return;
        opts.api.getI18nPayload().then(function (cur) {
          var nextExact = Object.assign({}, cur.customExact || {});
          nextExact[enVal] = zhVal;
          return opts.api.saveCustomDictionary({ exact: nextExact, regex: cur.customRegex || [] });
        }).then(function () { showToast('词条已保存'); });
      });

      var proxySaveBtn = el.querySelector('#ags-proxy-save-btn');
      var proxyEnEl = el.querySelector('#ags-proxy-enabled');
      var proxyUrlEl = el.querySelector('#ags-proxy-url');
      var proxyByEl = el.querySelector('#ags-proxy-bypass');
      if (proxySaveBtn && proxyEnEl && proxyUrlEl) {
        var saveProxy = function () {
          opts.saveConfig({
            proxy: {
              enabled: proxyEnEl.checked,
              proxyUrl: proxyUrlEl.value.trim(),
              bypassList: proxyByEl ? proxyByEl.value.trim() : undefined
            }
          });
          showToast('代理配置已保存');
        };
        proxySaveBtn.addEventListener('click', saveProxy);
        proxyEnEl.addEventListener('change', saveProxy);
      }

      var proxyTestBtn = el.querySelector('#ags-proxy-test-btn');
      if (proxyTestBtn && proxyUrlEl) proxyTestBtn.addEventListener('click', function () {
        if (!opts.api || !opts.api.testProxy) return;
        state.proxyTestResult = '测速中...';
        render();
        opts.api.testProxy(proxyUrlEl.value.trim()).then(function (res) {
          state.proxyTestResult = res && res.latencyMs != null ? ('连通 ' + res.latencyMs + 'ms') : '连通正常';
          render();
        }).catch(function (err) {
          state.proxyTestResult = '失败: ' + err.message;
          render();
        });
      });

      // Enhance: promptTier (0~4) + chineseTitle
      var enhApplyBtn = el.querySelector('#ags-enhance-apply-btn');
      var enhRestBtn = el.querySelector('#ags-enhance-restore-btn');
      var tierSel = el.querySelector('#ags-prompt-tier');
      var cnTitleEl = el.querySelector('#ags-cn-title');
      if (enhApplyBtn && tierSel && cnTitleEl) {
        enhApplyBtn.addEventListener('click', function () {
          var tier = Number(tierSel.value || 0);
          var cn = Boolean(cnTitleEl.checked);
          opts.saveConfig({ enhance: { promptTier: tier, chineseSessionTitle: cn } });
          if (opts.api && opts.api.applyEnhance) {
            opts.api.applyEnhance({ promptTier: tier, chineseTitle: cn }).then(function (r) {
              state.enhanceStatus = r || { promptTier: tier, chineseTitle: cn };
              showToast('提示词与标题增强已应用');
              render();
            }).catch(function (e) { showToast(e.message || '应用失败'); });
          }
        });
      }
      if (enhRestBtn) {
        enhRestBtn.addEventListener('click', function () {
          if (opts.api && opts.api.restoreEnhance) {
            opts.api.restoreEnhance().then(function (r) {
              state.enhanceStatus = r || { promptTier: 0, chineseTitle: false };
              opts.saveConfig({ enhance: { promptTier: 0, chineseSessionTitle: false } });
              showToast('已还原官方提示词与标题');
              render();
            }).catch(function (e) { showToast(e.message || '还原失败'); });
          }
        });
      }

      // Context Unlock: ORIG / CONST / DYN + CLI align
      var unlApplyBtn = el.querySelector('#ags-unlock-apply-btn');
      var unlRestBtn = el.querySelector('#ags-unlock-restore-btn');
      var unlModeSel = el.querySelector('#ags-unlock-mode');
      var unlLimitInp = el.querySelector('#ags-unlock-limit');
      var unlCliChk = el.querySelector('#ags-unlock-cli');
      if (unlApplyBtn && unlModeSel) {
        unlApplyBtn.addEventListener('click', function () {
          var mode = unlModeSel.value || 'ORIG';
          var limitTokens = Number((unlLimitInp && unlLimitInp.value) || 512000);
          var alignCli = Boolean(unlCliChk && unlCliChk.checked);
          opts.saveConfig({ context: { unlockMode: mode, unlockLimitTokens: limitTokens, alignCli: alignCli } });
          if (opts.api && opts.api.applyContextUnlock) {
            opts.api.applyContextUnlock({ mode: mode, limitTokens: limitTokens, alignCli: alignCli }).then(function (r) {
              state.unlockStatus = r || { mode: mode, limitTokens: limitTokens, alignCli: alignCli };
              showToast('上下文解锁策略已应用');
              render();
            }).catch(function (e) { showToast(e.message || '应用失败'); });
          }
        });
      }
      if (unlRestBtn) {
        unlRestBtn.addEventListener('click', function () {
          if (opts.api && opts.api.restoreContextUnlock) {
            opts.api.restoreContextUnlock().then(function (r) {
              state.unlockStatus = r || { mode: 'ORIG' };
              opts.saveConfig({ context: { unlockMode: 'ORIG' } });
              showToast('已还原原版上下文限制');
              render();
            }).catch(function (e) { showToast(e.message || '还原失败'); });
          }
        });
      }

      // Rehydrate after compact
      var rehEl = el.querySelector('#ags-rehydrate-en');
      if (rehEl) {
        rehEl.addEventListener('change', function () {
          var on = rehEl.checked;
          opts.saveConfig({ enhance: { rehydrateEnabled: on } });
          if (opts.api) {
            var fn = on ? opts.api.applyRehydrate : (opts.api.disableRehydrate || opts.api.restoreRehydrate);
            if (fn) {
              fn().then(function (r) {
                state.rehydrateStatus = r || { enabled: on };
                showToast(on ? '已开启压缩后记忆回填' : '已关闭压缩后记忆回填');
              }).catch(function (e) { showToast(e.message || '操作失败'); });
            }
          }
        });
      }

      el.querySelectorAll('[data-open-path]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (opts.api && opts.api.openPath) opts.api.openPath(btn.getAttribute('data-open-path'));
        });
      });

      var restartLsBtn = el.querySelector('#ags-restart-ls-btn');
      if (restartLsBtn) restartLsBtn.addEventListener('click', function () {
        if (opts.api && opts.api.restartLanguageServers) {
          opts.api.restartLanguageServers().then(function () { showToast('LanguageServer 已重启'); }).catch(function () {});
        }
      });

      var restartBtn = el.querySelector('#ags-restart-host-btn');
      if (restartBtn) restartBtn.addEventListener('click', function () {
        if (opts.api && opts.api.restartHost) opts.api.restartHost();
      });
    }

    function render(dataPatch) {
      if (dataPatch) {
        if (dataPatch.snapshot !== undefined) state.snapshot = dataPatch.snapshot;
        if (dataPatch.history !== undefined) state.history = dataPatch.history;
        if (dataPatch.accounts !== undefined) state.accounts = dataPatch.accounts;
        if (dataPatch.fonts !== undefined) state.fonts = dataPatch.fonts;
        if (dataPatch.enhanceStatus !== undefined) state.enhanceStatus = dataPatch.enhanceStatus;
        if (dataPatch.unlockStatus !== undefined) state.unlockStatus = dataPatch.unlockStatus;
        if (dataPatch.rehydrateStatus !== undefined) state.rehydrateStatus = dataPatch.rehydrateStatus;
      }

      var cfg = (opts.getConfig && opts.getConfig()) || {};
      var tabLabels = t('tabs');

      var content = '';
      if (state.activeTab === 'overview') content = renderOverview(state.snapshot);
      else if (state.activeTab === 'usage') content = renderUsage(state.history, cfg);
      else if (state.activeTab === 'accounts') content = renderAccounts(state.accounts);
      else content = renderSettings(cfg);

      el.innerHTML = [
        '<div class="ags-head">',
        '  <div class="ags-title"><span class="ags-dot"></span><span>' + esc(t('title')) + '</span></div>',
        '  <button class="ags-btn ags-btn-ghost" id="ags-close-btn">' + esc(t('close')) + '</button>',
        '</div>',
        '<div class="ags-tabs">',
        '  <button class="ags-tab ' + (state.activeTab === 'overview' ? 'active' : '') + '" data-tab="overview">' + esc(tabLabels.overview) + '</button>',
        '  <button class="ags-tab ' + (state.activeTab === 'usage' ? 'active' : '') + '" data-tab="usage">' + esc(tabLabels.usage) + '</button>',
        '  <button class="ags-tab ' + (state.activeTab === 'accounts' ? 'active' : '') + '" data-tab="accounts">' + esc(tabLabels.accounts) + '</button>',
        '  <button class="ags-tab ' + (state.activeTab === 'settings' ? 'active' : '') + '" data-tab="settings">' + esc(tabLabels.settings) + '</button>',
        '</div>',
        '<div class="ags-body">' + content + '</div>'
      ].join('\n');

      bindEvents(cfg);
    }

    function toggle(forceOpen) {
      state.open = typeof forceOpen === 'boolean' ? forceOpen : !state.open;
      el.classList.toggle('ags-hidden', !state.open);
      if (state.open && opts.onRefresh) opts.onRefresh(true);
    }

    render();

    return {
      element: el,
      isOpen: function () { return state.open; },
      getDays: function () { return state.days; },
      getActiveTab: function () { return state.activeTab; },
      pushSpeedSample: function (v) {
        state.speedHistory.push(Number(v || 0));
        if (state.speedHistory.length > 32) state.speedHistory.shift();
      },
      toggle: toggle,
      render: render
    };
  }

  var api = {
    UI_TEXT: UI_TEXT,
    createDashboardDrawer: createDashboardDrawer
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_DASHBOARD__ = api;
    globalScope.__AG_STUDIO_DRAWER__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);


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
    fx: { inkStream: true, smoothCaret: true, edgeAura: true, effortSlider: true },
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

  function applyVisuals() {
    themes.applyThemeToDocument(currentConfig.theme);
    typography.applyTypographyToDocument(currentConfig.theme, scannedFonts);
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
    var turnFn = api.getTurnState
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
      syncDomAndTurnState();
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
  }, 2500);
})(typeof window !== 'undefined' ? window : globalThis);
