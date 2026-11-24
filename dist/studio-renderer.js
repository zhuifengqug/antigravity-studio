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
        bgCanvas: '#0F1117',
        bgSidebar: '#141720',
        bgSurface: '#1A1E28',
        bgSubtle: '#252B39',
        accent: '#60A5FA',
        accentHover: '#7CB6FC',
        accentSoft: 'rgba(96, 165, 250, 0.16)',
        textPrimary: '#F1F5F9',
        textSecondary: '#94A3B8',
        border: 'rgba(148, 163, 184, 0.22)',
        codeBg: '#12151E',
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

  function mixHex(hexA, hexB, weightB) {
    var a = hexToRgb(hexA) || { r: 20, g: 20, b: 19 };
    var b = hexToRgb(hexB) || { r: 255, g: 255, b: 255 };
    var w = Math.max(0, Math.min(1, Number(weightB) || 0));
    return rgbToHex(
      a.r + (b.r - a.r) * w,
      a.g + (b.g - a.g) * w,
      a.b + (b.b - a.b) * w
    );
  }

  function hexLuminance(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) return 128;
    return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
  }

  function buildCustomThemeFromColors(name, colors, preferredMode) {
    var c = colors || {};
    var accent = c.accent || '#3B6CF6';
    var bgCanvas = c.bgCanvas || '#0F1117';
    var bgSidebar = c.bgSidebar || bgCanvas;
    var textPrimary = c.textPrimary || (hexLuminance(bgCanvas) >= 140 ? '#0F172A' : '#F1F5F9');
    var isDarkCanvas = hexLuminance(bgCanvas) < 140;
    var activeKey = isDarkCanvas ? 'dark' : 'light';
    var basePreset = PRESET_THEMES.antigravity;

    var customPal = Object.assign({}, basePreset[activeKey], deriveAccentTokens(accent, isDarkCanvas), {
      bgCanvas: bgCanvas,
      bgSidebar: bgSidebar,
      bgSurface: mixHex(bgCanvas, isDarkCanvas ? '#FFFFFF' : '#FFFFFF', isDarkCanvas ? 0.06 : 0.65),
      bgSubtle: mixHex(bgCanvas, textPrimary, 0.08),
      textPrimary: textPrimary,
      textSecondary: mixHex(textPrimary, bgCanvas, 0.36),
      border: mixHex(bgCanvas, textPrimary, 0.16),
      codeBg: mixHex(bgCanvas, bgSidebar, 0.55)
    });

    var altKey = isDarkCanvas ? 'light' : 'dark';
    var altPal = Object.assign({}, basePreset[altKey], deriveAccentTokens(accent, !isDarkCanvas));
    var id = 'custom_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    var themeObj = {
      id: id,
      name: String(name || 'Custom Theme').trim() || 'Custom Theme',
      subtitle: '四色自定义方案',
      isPreset: false,
      preferredMode: preferredMode || activeKey
    };
    themeObj[activeKey] = customPal;
    themeObj[altKey] = altPal;
    return themeObj;
  }

  function parseRgbLuminance(colorStr) {
    if (!colorStr || typeof colorStr !== 'string') return null;
    var m = colorStr.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
    if (!m) return null;
    var alpha = m[4] !== undefined ? Number(m[4]) : 1;
    if (Number.isFinite(alpha) && alpha < 0.2) return null;
    var r = Number(m[1]);
    var g = Number(m[2]);
    var b = Number(m[3]);
    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return null;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function detectHostDarkMode() {
    if (typeof document !== 'undefined') {
      try {
        var docEl = document.documentElement;
        var bodyEl = document.body;
        var cls = String((docEl && docEl.className) || '') + ' ' + String((bodyEl && bodyEl.className) || '');
        if (/\b(dark|vs-dark|theme-dark|dark-theme)\b/i.test(cls)) return true;
        if (/\b(light|vs-light|theme-light|light-theme)\b/i.test(cls)) return false;

        var attrNames = ['data-theme', 'data-color-scheme', 'data-color-mode', 'data-mode'];
        var els = [docEl, bodyEl];
        for (var e = 0; e < els.length; e++) {
          var target = els[e];
          if (!target || typeof target.getAttribute !== 'function') continue;
          for (var a = 0; a < attrNames.length; a++) {
            var val = String(target.getAttribute(attrNames[a]) || '').toLowerCase();
            if (!val) continue;
            if (val.indexOf('dark') !== -1) return true;
            if (val.indexOf('light') !== -1) return false;
          }
        }

        if (typeof window !== 'undefined' && window.matchMedia) {
          try {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
          } catch (_eMql) {}
        }

        if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
          var probeSelectors = [
            'header',
            '[data-testid="conversation-view"]',
            '[role="main"]'
          ];
          for (var s = 0; s < probeSelectors.length; s++) {
            var node = document.querySelector(probeSelectors[s]);
            if (!node || (node.classList && node.classList.contains('ags-drawer'))) continue;
            var cs = window.getComputedStyle(node);
            if (!cs) continue;
            var lum = parseRgbLuminance(cs.backgroundColor);
            if (lum !== null) {
              if (lum < 128) return true;
              if (lum > 160) return false;
            }
          }
        }
      } catch (_e) {}
    }

    try {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch (_e2) {}
    return true;
  }

  function resolveEffectiveMode(colorMode) {
    if (colorMode === 'light') return 'light';
    if (colorMode === 'dark') return 'dark';
    return detectHostDarkMode() ? 'dark' : 'light';
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

    var rules = [
      ':root {',
      '  color-scheme: ' + (isDark ? 'dark' : 'light') + ';',
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
      'aside:not(.ags-drawer) {',
      '  background-color: var(--ags-bg-sidebar);',
      '  border-color: var(--ags-border);',
      '}',
      '.agy-home {',
      '  background-color: var(--ags-bg-canvas);',
      '}',
      '[data-testid="agent-input-box"] .surface-composer-card, .surface-composer-card {',
      '  background-color: var(--ags-bg-surface);',
      '  border-color: var(--ags-border);',
      '  transition: border-color 150ms ease;',
      '}',
      '[data-testid="model-selector-panel"], [role="dialog"] {',
      '  background-color: var(--ags-bg-surface);',
      '  border-color: var(--ags-border);',
      '  color: var(--ags-text-primary);',
      '}'
    ];

    rules.push(
      '[data-testid="agent-input-box"] .surface-composer-card:focus-within, .surface-composer-card:focus-within {',
      '  border-color: var(--ags-accent);',
      '  box-shadow: 0 0 0 1px var(--ags-accent-soft);',
      '}'
    );
    if (editorialSerif) {
      rules.push('.prose, [data-markdown-root] { font-family: var(--ags-font-body, Georgia, "Noto Serif SC", serif); line-height: 1.68; }');
    }
    rules.push(
      'pre, code, kbd, samp, .monaco-editor, .xterm { font-family: var(--ags-font-code, "JetBrains Mono", Consolas, monospace); }',
      'pre:not(.monaco-editor pre) { background-color: var(--ags-code-bg); border: 1px solid var(--ags-border); border-radius: 8px; }',
      'button[data-variant="primary"] { background-color: var(--ags-accent); border-color: var(--ags-accent); }',
      '::-webkit-scrollbar { width: 8px; height: 8px; }',
      '::-webkit-scrollbar-thumb { background: var(--ags-border); border-radius: 99px; }',
      '::-webkit-scrollbar-track { background: transparent; }'
    );
    return rules.join('\n');
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
    var css = buildThemeCss(themeConfig);
    if (styleEl.textContent !== css) {
      styleEl.textContent = css;
    }
    if (document.documentElement) {
      if (document.documentElement.getAttribute('data-ags-theme') !== resolved.theme.id) {
        document.documentElement.setAttribute('data-ags-theme', resolved.theme.id);
      }
      if (document.documentElement.getAttribute('data-ags-mode') !== resolved.mode) {
        document.documentElement.setAttribute('data-ags-mode', resolved.mode);
      }
    }
    return resolved;
  }

  var api = {
    PRESET_THEMES: PRESET_THEMES,
    deriveAccentTokens: deriveAccentTokens,
    parseRgbLuminance: parseRgbLuminance,
    detectHostDarkMode: detectHostDarkMode,
    resolveEffectiveMode: resolveEffectiveMode,
    getAllThemes: getAllThemes,
    resolveActivePalette: resolveActivePalette,
    cloneThemeAsCustom: cloneThemeAsCustom,
    buildCustomThemeFromColors: buildCustomThemeFromColors,
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
      (el.hasAttribute && el.hasAttribute('data-ag-studio-ignore')) ||
      el.closest('#ag-studio-root, [data-ag-studio-ignore]')
    );
  }

  function isVisible(el) {
    if (!el || el.isConnected === false || el.hidden) return false;
    if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return false;
    if (el.style && (el.style.display === 'none' || el.style.visibility === 'hidden')) return false;
    var cls = typeof el.className === 'string' ? el.className : '';
    if (cls && /(?:^|\s)(?:hidden|sr-only)(?:\s|$)/.test(cls)) return false;
    if (typeof el.getClientRects === 'function') {
      try {
        var rects = el.getClientRects();
        if (!rects || rects.length === 0) return false;
        return rects[0].width > 1 || rects[0].height > 1;
      } catch (_e) {}
    }
    return el.offsetParent !== null;
  }

  function getCurrentFiber(el) {
    if (!el || typeof el !== 'object') return null;
    try {
      var keys = Object.keys(el);
      var raw = null;
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('__reactFiber$') === 0 || keys[i].indexOf('__reactInternalInstance$') === 0) {
          raw = el[keys[i]];
          break;
        }
      }
      if (!raw) return null;
      if (raw.alternate) {
        var root = raw;
        for (var g = 0; root.return && g < 600; g++) root = root.return;
        if (root && root.stateNode && root.stateNode.current && root.stateNode.current !== root) {
          return raw.alternate;
        }
      }
      return raw;
    } catch (_e) {
      return null;
    }
  }

  function extractConvoIdFromStore(store) {
    if (!store || typeof store.getState !== 'function') return '';
    try {
      var st = store.getState();
      var cs = st && st.conversation && st.conversation.convoState;
      if (!cs) return '';
      if (cs.type === 'active' && typeof cs.cascadeId === 'string' && UUID_RE.test(cs.cascadeId)) {
        return cs.cascadeId.match(UUID_RE)[1];
      }
      if (cs.type === 'subagent') {
        var subId = cs.childConversationId || cs.parentConversationId;
        if (typeof subId === 'string' && UUID_RE.test(subId)) {
          return subId.match(UUID_RE)[1];
        }
      }
    } catch (_e) {}
    return '';
  }

  function readFiberCascadeId(el, maxDepth) {
    if (!el) return '';
    try {
      var f = getCurrentFiber(el);
      var depth = 0;
      var limit = maxDepth || 260;
      while (f && depth < limit) {
        var props = f.memoizedProps || f.pendingProps;
        if (props && typeof props.cascadeId === 'string' && UUID_RE.test(props.cascadeId)) {
          return props.cascadeId.match(UUID_RE)[1];
        }
        var cidProps = extractConvoIdFromStore(props && props.store);
        if (cidProps) return cidProps;
        var dep = f.dependencies && f.dependencies.firstContext;
        while (dep) {
          var mv = dep.memoizedValue;
          var cidCtx = extractConvoIdFromStore(mv && mv.store);
          if (cidCtx) return cidCtx;
          dep = dep.next;
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
      CONV_VIEW_SEL + ', ' + INPUT_BOX_SEL + ', #root, [data-testid="conversation-row-sidebar"], [data-testid="home-greeting"]'
    );
    var visible = [];
    var hidden = [];
    for (var i = 0; i < anchors.length; i++) {
      var node = anchors[i];
      if (!node || isOwnNode(node)) continue;
      if (isVisible(node)) visible.push(node);
      else hidden.push(node);
    }
    var ordered = visible.concat(hidden);
    for (var j = 0; j < ordered.length; j++) {
      var hit = readFiberCascadeId(ordered[j], 300);
      if (hit) return hit;
    }
    return '';
  }

  function findFormalConvView() {
    if (typeof document === 'undefined') return null;
    var views = document.querySelectorAll(CONV_VIEW_SEL);
    var visibleCandidates = [];
    var hiddenCandidates = [];
    for (var i = 0; i < views.length; i++) {
      var cv = views[i];
      if (isOwnNode(cv)) continue;
      if (cv.closest && cv.closest(SUBAGENT_SEL)) continue;
      if (cv.closest && cv.closest('.agy-home')) continue;
      if (cv.querySelector && cv.querySelector('.agy-home')) continue;
      if (isVisible(cv)) visibleCandidates.push(cv);
      else hiddenCandidates.push(cv);
    }
    for (var v = 0; v < visibleCandidates.length; v++) {
      var vAttr = visibleCandidates[v].getAttribute && visibleCandidates[v].getAttribute('data-cascade-id');
      if (vAttr && UUID_RE.test(vAttr)) return visibleCandidates[v];
    }
    if (visibleCandidates.length) return visibleCandidates[0];
    for (var h = 0; h < hiddenCandidates.length; h++) {
      var hAttr = hiddenCandidates[h].getAttribute && hiddenCandidates[h].getAttribute('data-cascade-id');
      if (hAttr && UUID_RE.test(hAttr)) return hiddenCandidates[h];
    }
    return hiddenCandidates.length ? hiddenCandidates[0] : null;
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
        var fibId = readFiberCascadeId(cv, 260);
        if (fibId) return fibId;
      }
      var comp = findComposerTarget();
      if (comp && comp.inputBox && !comp.isHome) {
        var inpFib = readFiberCascadeId(comp.inputBox, 260);
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

        var activeRows = document.querySelectorAll(
          '[data-testid="conversation-row-sidebar"][aria-current="page"], [data-testid="conversation-row-sidebar"][data-active="true"], [data-testid="conversation-row-sidebar"][data-selected="true"]'
        );
        for (var r = 0; r < activeRows.length; r++) {
          var row = activeRows[r];
          if (!row || isOwnNode(row)) continue;
          var rAttr = row.getAttribute && row.getAttribute('data-cascade-id');
          if (rAttr && UUID_RE.test(rAttr)) return rAttr.match(UUID_RE)[1];
          var rFib = readFiberCascadeId(row, 40);
          if (rFib) return rFib;
        }
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

  var cachedComposer = null;

  function findComposerTarget() {
    if (typeof document === 'undefined') return null;

    if (cachedComposer && cachedComposer.card && cachedComposer.card.isConnected && isVisible(cachedComposer.card)) {
      return cachedComposer;
    }
    cachedComposer = null;

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
      cachedComposer = {
        card: chosenCard,
        inputBox: ib,
        editable: ed || null,
        isHome: Boolean(chosenCard.closest('.agy-home')),
        isSubagent: false
      };
      return cachedComposer;
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
      cachedComposer = {
        card: card2,
        inputBox: box,
        editable: ed2 || null,
        isHome: Boolean(box.closest('.agy-home')),
        isSubagent: false
      };
      return cachedComposer;
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
        cachedComposer = {
          card: outer,
          inputBox: outer,
          editable: inp,
          isHome: Boolean(outer.closest('.agy-home')),
          isSubagent: false
        };
        return cachedComposer;
      }
    }

    return null;
  }

  function findModelTriggerInComposer(composer) {
    if (typeof document === 'undefined' || !composer) return null;
    var roots = [composer.card, composer.inputBox].filter(Boolean);
    for (var r = 0; r < roots.length; r++) {
      var trig = roots[r].querySelector('[data-testid="model-selector-trigger"]');
      if (trig && isVisible(trig) && !isOwnNode(trig)) return trig;
    }
    // Fallback: look for model selector button inside composer toolbar
    for (var r2 = 0; r2 < roots.length; r2++) {
      var btns = roots[r2].querySelectorAll('button');
      for (var b = 0; b < btns.length; b++) {
        var btn = btns[b];
        if (isOwnNode(btn) || !isVisible(btn)) continue;
        var txt = String(btn.getAttribute('aria-label') || btn.textContent || '');
        if (/\b(?:gemini|claude|gpt|sonnet|opus|flash|neon|hydrogen|model)\b/i.test(txt)) {
          return btn;
        }
      }
    }
    return null;
  }

  function ensureComposerToolbarSlot(composer) {
    if (typeof document === 'undefined' || !composer) return null;
    var trig = findModelTriggerInComposer(composer);
    if (!trig || !trig.parentElement) return null;

    var slot = document.getElementById('ag-studio-composer-toolbar-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'ag-studio-composer-toolbar-slot';
      slot.setAttribute('data-ag-studio-ignore', 'true');
      slot.setAttribute('data-ag-no-i18n', 'true');
      slot.style.cssText = 'display:inline-flex;align-items:center;gap:4px;margin-left:6px;flex-shrink:0;vertical-align:middle;pointer-events:auto;';
    }

    // Walk up from trig to find the horizontal toolbar flex row (not a column wrapper)
    var targetParent = trig.parentElement;
    var insertAfter = trig;
    var cur = trig;
    for (var depth = 0; depth < 4 && cur && cur.parentElement && cur.parentElement !== composer.card; depth++) {
      var p = cur.parentElement;
      try {
        var cs = typeof getComputedStyle === 'function' ? getComputedStyle(p) : null;
        if (cs && (cs.display === 'flex' || cs.display === 'inline-flex') && cs.flexDirection !== 'column') {
          targetParent = p;
          insertAfter = cur;
          if (p.children && p.children.length >= 2) break;
        }
      } catch (_e) {}
      cur = p;
    }

    // Ensure targetParent itself lays out horizontally without wrapping the HUD below the model trigger
    try {
      var pcs = typeof getComputedStyle === 'function' ? getComputedStyle(targetParent) : null;
      if (pcs && pcs.flexDirection === 'column') {
        targetParent.style.flexDirection = 'row';
        targetParent.style.alignItems = 'center';
        targetParent.style.flexWrap = 'nowrap';
      } else if (pcs && pcs.display === 'block') {
        targetParent.style.display = 'inline-flex';
        targetParent.style.alignItems = 'center';
        targetParent.style.flexWrap = 'nowrap';
      }
    } catch (_e2) {}

    if (slot.parentElement !== targetParent || slot.previousElementSibling !== insertAfter) {
      if (insertAfter.nextSibling) {
        targetParent.insertBefore(slot, insertAfter.nextSibling);
      } else {
        targetParent.appendChild(slot);
      }
    }
    slot.style.display = 'inline-flex';
    return slot;
  }

  function parkComposerToolbarSlot() {
    if (typeof document === 'undefined') return;
    var slot = document.getElementById('ag-studio-composer-toolbar-slot');
    if (slot) slot.style.display = 'none';
  }

  function ensureComposerTopAnchor(composer) {
    if (!composer) return null;
    var anchor = null;
    if (composer.inputBox && composer.inputBox.isConnected !== false) {
      anchor = composer.inputBox;
    } else if (composer.card && composer.card.isConnected !== false) {
      anchor = (composer.card.closest && composer.card.closest('.surface-composer')) || composer.card;
    }
    if (!anchor || anchor.isConnected === false) return null;
    try {
      var pos = typeof getComputedStyle === 'function' ? getComputedStyle(anchor).position : '';
      if (!pos || pos === 'static') {
        anchor.style.position = 'relative';
      }
      anchor.setAttribute('data-ags-mascot-anchor', '1');
    } catch (_e) {}
    return anchor;
  }

  function rectsOverlap(a, b) {
    return Boolean(
      a && b &&
      a.left + 2 < b.right &&
      a.right - 2 > b.left &&
      a.top + 2 < b.bottom &&
      a.bottom - 2 > b.top
    );
  }

  function computeComposerTopInset(anchorEl) {
    if (!anchorEl || typeof anchorEl.getBoundingClientRect !== 'function') return 0;
    var anchorRect;
    try {
      anchorRect = anchorEl.getBoundingClientRect();
    } catch (_e) {
      return 0;
    }
    if (!anchorRect || anchorRect.height <= 0) return 0;

    var minTop = Infinity;
    var children = anchorEl.children || [];
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (!child || isOwnNode(child) || !isVisible(child)) continue;
      if (typeof getComputedStyle === 'function') {
        try {
          var cs = getComputedStyle(child);
          if (cs && (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') <= 0.05)) {
            continue;
          }
        } catch (_e2) {}
      }
      var cr;
      try {
        cr = typeof child.getBoundingClientRect === 'function' ? child.getBoundingClientRect() : null;
      } catch (_e3) {
        cr = null;
      }
      if (!cr || cr.height < 8 || cr.width < 40) continue;
      if (cr.top < minTop) minTop = cr.top;
    }
    return minTop < Infinity ? Math.max(0, Math.round(minTop - anchorRect.top)) : 0;
  }

  function detectMascotObstruction(stageEl, anchorEl) {
    if (!stageEl || typeof document === 'undefined') return false;
    var hitEl = (stageEl.querySelector && stageEl.querySelector('.ags-mascot-hit')) || stageEl;
    if (!hitEl || typeof hitEl.getBoundingClientRect !== 'function') return false;
    var hitRect;
    try {
      hitRect = hitEl.getBoundingClientRect();
    } catch (_e) {
      return false;
    }
    if (!hitRect || hitRect.width <= 1 || hitRect.height <= 1) return false;

    var overlaySel = '[data-testid="queued-messages-card"], [data-testid="interaction-takeover-card"], [data-testid="side-question-panel"], [data-testid="model-selector-panel"]';
    var overlays = document.querySelectorAll(overlaySel);
    for (var i = 0; i < overlays.length; i++) {
      var el = overlays[i];
      if (!el || isOwnNode(el) || !isVisible(el)) continue;
      var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      if (r && rectsOverlap(hitRect, r)) return true;
    }

    var prevSib = anchorEl && anchorEl.previousElementSibling;
    if (prevSib && !isOwnNode(prevSib) && prevSib.querySelectorAll) {
      var btns = prevSib.querySelectorAll('button, [role="button"], a');
      for (var j = 0; j < btns.length; j++) {
        var b = btns[j];
        if (!b || isOwnNode(b) || !isVisible(b)) continue;
        var r2 = b.getBoundingClientRect ? b.getBoundingClientRect() : null;
        if (r2 && rectsOverlap(hitRect, r2)) return true;
      }
    }
    return false;
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
      slot.style.cssText = 'width:100%;max-width:660px;margin:14px auto 14px auto;padding:0 12px;box-sizing:border-box;z-index:20;';
    }

    // Target placement: right BELOW the Antigravity icon + greeting, and ABOVE the 3 suggestion rows & composer
    var comp = findComposerTarget();
    var compEl = comp && comp.isHome ? (comp.inputBox || comp.card) : null;
    var homeColumn = compEl ? compEl.parentElement : null;

    var anchorAfter = null;
    var anchorBefore = null;
    var parent = null;

    if (homeInfo.greetingEl && homeColumn) {
      // Walk up from greetingEl to find the direct child of homeColumn (or shared column)
      var gNode = homeInfo.greetingEl;
      while (gNode && gNode.parentElement && gNode.parentElement !== homeColumn && gNode.parentElement !== document.body) {
        gNode = gNode.parentElement;
      }
      if (gNode && gNode.parentElement === homeColumn) {
        parent = homeColumn;
        anchorAfter = gNode;
      }
    }

    if (!parent && homeInfo.greetingEl && homeInfo.greetingEl.parentElement) {
      parent = homeInfo.greetingEl.parentElement;
      anchorAfter = homeInfo.greetingEl;
    }

    // Fallback: if greeting not matched, place above the first non-slot child before composer (suggestions block) or above composer
    if (!parent && homeColumn) {
      parent = homeColumn;
      anchorBefore = compEl;
      var kids = homeColumn.children || [];
      for (var k = 0; k < kids.length; k++) {
        var kid = kids[k];
        if (kid === slot || kid === compEl) continue;
        if (kid.querySelector && kid.querySelector('h1, h2, svg, img')) {
          anchorAfter = kid;
          anchorBefore = null;
          break;
        }
      }
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
    } else if (anchorBefore) {
      if (slot.parentElement !== parent || slot.nextElementSibling !== anchorBefore) {
        parent.insertBefore(slot, anchorBefore);
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

    var modelTrigs = document.querySelectorAll('[data-testid="model-selector-trigger"]');
    var modelTrig = null;
    for (var mt = 0; mt < modelTrigs.length; mt++) {
      if (isVisible(modelTrigs[mt]) && !isOwnNode(modelTrigs[mt])) {
        modelTrig = modelTrigs[mt];
        break;
      }
    }
    if (!modelTrig && modelTrigs.length) modelTrig = modelTrigs[0];
    var modelLabel = modelTrig ? String(modelTrig.textContent || modelTrig.getAttribute('aria-label') || '').trim() : '';
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
    var disposed = false;

    function trigger(reason) {
      if (disposed) return;
      var delay = (reason === 'route' || reason === 'pushState' || reason === 'replaceState') ? 32 : 160;
      if (timer) {
        if (delay > 32) return;
        clearTimeout(timer);
      }
      timer = setTimeout(function () {
        timer = 0;
        if (!disposed && typeof onChange === 'function') {
          try { onChange(reason || 'mutation'); } catch (_e) {}
        }
      }, delay);
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
          attributeFilter: ['data-cascade-id', 'data-op-thought-state', 'hidden', 'aria-expanded']
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
    findModelTriggerInComposer: findModelTriggerInComposer,
    ensureComposerTopAnchor: ensureComposerTopAnchor,
    computeComposerTopInset: computeComposerTopInset,
    detectMascotObstruction: detectMascotObstruction,
    ensureComposerToolbarSlot: ensureComposerToolbarSlot,
    parkComposerToolbarSlot: parkComposerToolbarSlot,
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
  var SPRITES = {"version":1,"crabFrameMs":80,"deepyFrameMs":90,"crab":{"idle":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAAwCAYAAABHTnUeAAAA+ElEQVR42u3bsQ3CQAwF0H+IXRgigzAKMzBEBmCHLMI0UNGcBAGl4BS/VwL6FVaMjVs698v5kQ1O11v79L58+SPlHwKFvS2AaV4yzctqwLefky9/xHxPAEprW3sq2GULBAoAFADs+DdAzInlxx4AtECgAKCQ41qv9Oq5+t6pf/3X3ky+/BHyPQHQAoECgNgDmBPLjz0AuAfwf3H57gHAPQCYAoECAAUA9gAxh5YfewDQAoECgLgH8H90+XEPAFogUAAQewD58mMPAO4B5NfgHoASXyD3AGAKBAoAFADYA8QcWn7sAUALBAoA4h5Avvy4BwAtECgA+LcnkKN/7mnIqCwAAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAAwCAYAAABHTnUeAAAAOklEQVR42u3BMQEAAADCoPVP7W8GoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgDeQMAABeOTGmAAAAABJRU5ErkJggg==","frames":24,"columns":8,"box":[24,20,24,16],"still":0},"idle-look":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAABACAYAAABMbHjfAAABSUlEQVR42u3dwY3CMBAF0B9ELxSRQiiFGigiBdBDGqEaOOViCQJERE783nFZfYlII088tuhSuF/Ojyxwut66d5/Ll19T/iHQsJcF0A9j+mGcDfj0/+R7NjXmWwFoWre0p4JdtkCgAEABwI7fAWKfWH7MAUALBAoAGnKc65Wmnqvsncq/f9ubyZdfQ74VAC0QKACIOYB9YvkxB4CWWyDnxeUvyd/Sd7AC4D6Ax4AWCBQAKAAwB4h9YvkxBwAtECgAiPsAzqPLj/sAoAUCBQAxB7APLT/mAOD3AeJcvfwN5VsBcB/AY0ALBAoAFACYA8Q+sfyYA4AWCBQAxH0A59Hlx30A0AKBAoCYA9iHlr9SvhUA1ioA58U9m5p/g8AKAO4DsGf/fiewAuAdABQAmAPYh5YfcwDQAoECgLgP4Dy6/NryrQCgAEABwM+e2Uo8TK1/jy4AAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAABACAYAAABMbHjfAAAAR0lEQVR42u3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4N8AwEAAAWSBsuAAAAAASUVORK5CYII=","frames":31,"columns":8,"box":[24,20,24,16],"still":0},"idle-wave":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAAqCAYAAADlA1TjAAABJ0lEQVR42u3cyw3CMAwAUBd1F4bgyg4MwBDMwBAMwA5cGYJp4ISE+JVKLamb925IlRVVMXGauk3wV5fd5vr4e7k/NsZfbvwLU5KaSQCq1roFSpSaxy8BCsk2Mec6/rYrA4e+MVOP3/cfSvzc8VslCvYAb6wOp4iIOG/XXwP8el22+F2JZfzzGL+nQFStGbtmy765G/r+iD+t+IvME1X9T3WbYJOecBIMA+0BwjmA+BXHtwKgBAIJAOEp0EutdK+5Pj2ffb6uby0mvvgl41sBUAKBBAAAAKLGVyFCxxY2wRB1HoRNval57i97oR9AiUX+pvjsTdml42MPAJGuKX7spubwhTisAJri0RQP9gCgKT6cA2AFAAkAEgBCU3zq+FgBQAKABICR3AAtroMyqwB90gAAAABJRU5ErkJggg==","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAAqCAYAAADlA1TjAAAANklEQVR42u3BMQEAAADCoPVPbQZ/oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4DH4qAAH4CjvkAAAAAElFTkSuQmCC","frames":12,"columns":8,"box":[24,15,24,21],"still":0},"idle-laptop":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARAAAACKCAYAAABigBWEAAAFPElEQVR42u3dv20cRxQH4HeH7UEKlbEIBk4MsASnBlyEa2ARBJiyBANMGLgIZwqlKuRopeOC93/m5u3M9wFMhJP4087tu9nZ2zcRAAAAAAAAACSyufQv/vf3Hz+u+cV3jy+bEv8BOXLmYAyTQ0ANCuoYObbXBrp/eo37p9dir5OjrxyYgUDzGUyrSys5DufY3GrqU2qKJkfOHLVzyZEzxzagoiyXSHLUyeEShhRv5tm/f/0ux4pyKCBUvfNyygnw0WtKX+O3yDHC8ZguveZqdVtKjpw5erqF7JZ6WAMB6lNAiNZ3BhwPBQR+njStT5xMJ27vx2MqFW6+ztp3Tb58Xa2DJEeuHK1PGushdY+HuzDc9I2rsPeVwyUMYA0EAAAAICq0NASiu/4q5/YdsYgKhLswQPGH6Y79XZcwWt2hgBz09fu3iIh4eH7bdPdNVF235ZAj1tdUWd8JYOplxjG3XzvWaenU18WVbeDkIAZ4sHAafQ2h1Ayq1VOfWXIoqHVzlDpfSh+Hbp7GPXXAa3/SyuEDZqQ2Alc3jC1Vse2D0keO2o+fr+V4ZHyfXprp0F2Y7S33oCixD4XFV5+6RD+LqC3a1N89vmy8WSPlupBxGau/6rTWTxgt65wwFtndxvVG7SRHlhMky1pUeBYGoGABUY2Bqy5hsq496LrdNsep/75xaZ/jkgzzrdxu94WBkRYvrYEACggAAAAAAAAAAAAxVkvDc78avPwO/Udt0YDo/2G6f/787cda2+fVKmRyyDFyjumcX77viTwgPAtzSuU61hy5VPNkwMN0UbvTe+tCJoccI+fYXnpNBDCdWzyObeNwq53OWuY4Z0GqVo7lgvaXT5+Ni3G5+bhMa5p56C4VNpQi1bgcLSDL2zet3iyZbiFncezTzbgYl+YFxKcLYGOpqNO4V4E1LgpIxW7s8yVQiSnV7npMq2lilin7w/Nbmn1ojcu447KaGci+tZgWhSxLQc2Qw7iMPS7bUiu8+6ru8s9LD9DIOe4eXzbzj+NhXFocj+05B2N5UA5td7n889JP4bbK8fD8ttn9Gf14GBfjAgAAAAAAAAAAQNgXJrSpl0MOOc7NsdqmykDoyg4MVEC0y5dDDjnMQIC4SUMh7fJtY2BcjIueqLYxMC6M21TZNgbGxbjkGhdrIEDdGYh2+WEbA4zLJQVEu/ywjYFxMS497AtjGwPjYlxy5dhqlx+2MTAuxqXWtg7a5YdtDIyLcQEAAAAAAAAgemyqDFHx0fr56+i+fxAe5yf3SVurA3hPPUL2feFKjgsLiHb5OXPoh4EZCBcXsGVham1u0HusVd6pr8sygyk1E+glhwLS0fT82MmY+WTNVgCpNAPJ8iaVo481h/m4fP3+7V0Pj32Pm699RtRbDi0NO5Dl01tXNDMQ7fJjXdsY7BaPtYxNC6f+35evK73W0FuOySeLmUdvhSNLpkzHplaWye3BWOU2BhG/bgH3UuB3C6IvkrmNywCfcB9NrS/JNRdld2Oi7821W79Zlz0eyb2twYi/P1uO5jMQ7fLzXb4c+pS/e3zZHOu6Pf/5fFxrXTKc2gV8maf0721dRHrNMWmX32cOritktU743nJstcuXw2I5N1sDadUe/sunz+9+Rm+Xv7se9NG6kLb9AAAAAAAAABC2dQjdrtecA8LDdMAQBeT+6fVn38QSr5MDzECAsAaS7pq/9mPRp+bKkgNiDR3JSp8wWTbKAVzCAAoIED2ugWS95vc9EIj8ayD7Wp45YcAlDIACAqxoYyndrnPmADMQQAEBFBCAd/4HyvgDJ3UI0qEAAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARAAAACKCAYAAABigBWEAAAB70lEQVR42u3dQQ7CIBAF0I/x/leuSzcao6hlmPcS94TfjgXrkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMC0wzjg7mIKAAUEUEAABeQfewD2AeBkV5uYXxnDaDwOGhtFi4YbBTyBbFnwwBNIkWWLggIAkM3fwvXLF/EeCDPLSEUEBQT/xUEBITbbcWGwz5OHa8oTCDwtDgoEgL0oTyC4YcyJAgKKyMQepjmBIi+0rfhCnZf8oNgNs9pNe8p47KhTfSkzjOPl8u5nY1NA2HE/ZDQdBwAAAAAAAAAAAAAAAAAAAABANMxFLnLJp13ZD5Oy5A0jF7mkyrEOhzb1Lla5yGWHLtO6bstFLgXHYlJcrHKRy1RX9tZt6h0fIBe5zB/roE294wPkIhcAAAAAAAAAAAAAAAAAAAAAgGiXj1wauOh0HccYyEUumxzrEO3yXaxyqVncdbqODuRykYtJcbHKRS7tj3VwjIFc5LL4OIZ2+XGMgVzkAgAAAAAAAAAAAAAAAEDK9aUA6vQBVTzSuycqishs4fCXcfAN76mDul3ZyfLNhGHZruw6XdcrIseDD82+2Vbp7ajv53vFzb4D1rU6XYMioohA4yWMdvn1ljOwZAGx3o99BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAjN0jO0KHi9KHDAAAAAElFTkSuQmCC","frames":43,"columns":8,"box":[14,13,34,23],"still":0},"thinking":{"body":"data:image/png;base64,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","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADYCAYAAADVqm7JAAAEi0lEQVR42u3d0XLjKBAFUHDp/3+5530qdmwHaEGf85at2dwB1BLCu+7WAAAAAAAAAAAAAAD203/4Z/HGn5lBrrEa6+C/QMg9KtdYD8t92ITAvq43twEtafsh11iN1eDlGuuZubbQAAAAAAAAAAAAAAAAAAAAAAAAAAAAbffeSEAb/t3QXQGzzYV1o9zMsfYXP8OQjgFxcG72WLPyy13QkTC5GblZF1ZGbtzoxjEt+1K8Kduc7O1V1lauN+c8bXZvpCjYUA1G3zTil5v20m1H5vbO+6Ax7zjPS16T+hvbu8wtrRNZY955ntvKBt+RWEhZ2RUbQOsNnJPdVxdRSyxgucZsnpsG33C0y9bONto2+qxsF5a5VsSbZNtCAwAAAAAAAAAAAAAAAAAAAAAAANB0bqNpNv6n/L74d4Ua5IQeyW3CV7C+O5aR3RM++V1LujZkLeqdsqNI7szvMX42nlkNuN8tjhhcTFm52l/+khWH5MaLuZ35JPx0XVcX8OjsyF7ruEE/1ztlj86PJxfZzNz48ALfuYBvU0grcq92zwOunnhw0Rf1P/6/jeqJhxn9xVz3H+ZgVGvZ7lRwzd0pFj8RvnkqrMjO2kKX6GJfsdVqLCrev2y1Zk3e7MOkSMq9axHd5QT+uNzZi/pb0c7Ornix4j/kuO2H6HD319E+u8H3ktAnvzuSbi6ReFOrNuaKa9xnvus+XoRmPBWr5ZrrGms8zWWXAymf6kwt4DhxsDfMNddn5/bBn2+baEUs96Tchx0O+N92AQAAAAAAAAAAAAAAAAAAAICmpUbbrSuEbhSHXh/ZF1W0te1ejm1qNXjuKjd53+b6+PRfGjmxn2SPbHr2zUSNaD6WlfvNnFVv8r66iL/OzSqib7qpjy7iSGjKnJWryfsec96+fQpH0sR+2009+4KanR+JF9Qd5rsp4N9zry++t3b0d9zu8p25vflOYdp5PV6y7oyRPPY4OLfyO/BWh1j9i4D+4ueVA+yn9Xpt925/mjnfvVDv6o9y+4YTCwDt2KZL4SClVTrPsL7tvAbf/QaHF10hLelda30PLODsXUEopKN3feEAcm4BR9HXiSrjtr4H5F5vhHYX1nHjtb620C6szcdrfd2wTLZFNs/W14WFAgYAAAAAAAAAAAAAAAAAAAAAoPmKGIYtaiQtbma29rIct7jVeslm3ECycj35D53UjEKK5CKu2PgbW6ujslcXU0ZutPVPxmg5T+WsXAV8k+xVBWyLiXdgW2jvwO3ABt9/ndzMvje9SI/f1bnP+hmFPr/gSQgAUPAdGFh8TnEVP5ipmBuJN/Fq6/t/U/PhHr8EZzyh5Z471orrO9VllwP7nthfupmXzI2CH0FFyztjSvusXDEpYvN849yHHQ74tAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoLXnTZdCcyZoWzf47gktGd04YFABZ+8KKtw4MnIrjfX43OumDaCr3DiyciuN9ejc643gXqhzPNhCD7pjVblxRJFMuYVYaGOV+4bHZh9vAQAAAAAAAAAAAAAAAAAAAADAE/8AZ56Iufksc5YAAAAASUVORK5CYII=","frames":48,"columns":8,"box":[20,0,30,36],"still":24},"typing":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOAAAAAOCAYAAAA2YxATAAABCUlEQVR42u2aPwrCMBSHE/EOOrr1EB1chB7BVfAQnqGHKHTtEYQuHTyEm6OeQqeAfVLatH2Bxu+DDPlTfuRH3iOvxBoP7pfj22f94/Vs9bOyseihp6W3RFYGAAhAAAKwh7SoTVrUo+d9QQ89AhAA1Fj7LL6dD5Pm5y7cp+pdT/uW1m6zVd8ffur5GWUA+v7JAvyEmQJQZrQY6cvSc4KfQA0IsNQaMARJXlmua/hJAJrf1wna14vQV7SsbGzoQ4mfMDgA5VMgZ67LqrIv17nvpx6EWPTwM4xe9DWgzHJdWU+OjzVWUy/JK+tajPv7Rz+jDUCZuWS/a3zoo9qsbOx309YLvT/81NVbIh8bcFH1c0M4RAAAAABJRU5ErkJggg==","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOAAAAAOCAYAAAA2YxATAAAAZElEQVR42u3WgQ3AIAgAQen+O9MVWlOF1LsFNB9IGAMAAAAAAGCZlEBPalwFQ5MHLISePF7AMDSf0pPpqPnDtyre0xNDYwktYXfx4ryIhadMbD6dYtSfa3rSIlxu/ls2bqHnYW6S9y/jZM1ljwAAAABJRU5ErkJggg==","frames":6,"columns":8,"box":[15,22,28,14],"still":0},"building":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOAAAAARCAYAAADE46BdAAABHklEQVR42u2aMQ6CMBSGqfEOOrpxCAYXE47gauIhPAOHIGHlCCYuDB7CzVFPoRMJvIRggRb7+L6kQ0vJn77H/9KSRhEAAAAAgFeMzeTH5fixmf98v1r9tKjQQ8+ZXoisqEEAGBAAA/aR5LcoyW+Dn9uCHnoYEACcsbaZfD8fRj2f+uA+Vu962re0dputqvX5zt8c8VRvQNs/WfBfkL+ADSgrmkb6qnTIzJE/zfHkDAiw5DOgD+KsNJq3T9rXBxMbsHk7wfX2wveWKS0q49MEc2wJfebPdzzVG1BeBaqDW1dx2Zfz6vfHfnjoDdNbav7UnwFlleuqenJ8aGBd6sVZaeqmcX1LjKdaA8rKJftd479eqk2LyjSbaz3Wp0svRL7741H17CprKQAAAABJRU5ErkJggg==","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOAAAAARCAYAAADE46BdAAAAiElEQVR42u3bwQ2AMAwDwIb9dw4zAKJV3bs3yFKDBY9Q451+eH2Nb+TJi3RNOMy398iTF68WHErJk+dtCAAAAAAA8Lt2BObHWLoJ08EPTB9QiFb4fQtYSrh1XilhzqdMB2adkJc+PyVUCiVUwjnL2D1xKbYnL9ym56XP7+i/IRIemBPy0ucX5QZ30kfb7Nw7WwAAAABJRU5ErkJggg==","frames":6,"columns":8,"box":[15,19,28,17],"still":0},"conducting":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOgAAABICAYAAAD8tbmWAAACu0lEQVR42u3dO27bQBQF0EdBe0jKdGqyAxduDKRJn9aAF5E1aBEG3KTQEgy4SeFFpEuZrEKpBBiMLA9pDoecOaeyDUFXHz7+RF9FAABAVbqXv/z6/u348vfd/tDlfgAlMlt7rqzXxksABhQYYeslqFsru/K1Zm7PBZyC+w9gqN9//0RExJeHn68+8BKZ53LnUCITW9AqtzRTrxBkyhyTaUAZ5PH2+vjpw8dZdyVbzkw6SXR1/xRX90+T3U7mfJm7/aHrL1wy15O5Tbmj57ub/34ee7vUhXYtmT++fpa5wMyo8UKFqfap+/vWERGpuwslMqc4fhiaJ1NmSqZjUOI9Z6Rl5s00oAwy5uymzPGZriSCaPxz0BbWgK2s5QnX4gIGFAwokOkYdLc/dKfPdvoXevdPP/f//nh7fRxznFQi89IF7amZMeFF9DJl2oKCXVzAgAIAAAAAAMSiGhUIvbgyi2b6HBRsQfXilsqcqiRbZpnMbY7AIU+2RGapdvcaGuX14i6wF7cVenFlxtp6cU93FhFv9s6m3m6pma2shHTxriezS9kFGzssKR2jJTJzHD+k9KiWyNRRG/X04r727VupW6cxW7ESmb7dTEdtrLkXt6WF16CG9sLQiwuEXtzQi0toVAAMKBhQQC9u6MWVKVMvLtjFBQwoAAAAUWvlSStlT609V8JJIsCAggEFFly72Upt4qXLseY4FnUMSizh/0FDL+5iMr2f63o/DaiFdNJCrRKZOXJTenHnyNy02hfbcmboOV7N+7lJ7fp8vru5eIeptxvSLzpnpgXXiijW9t0s792Ej+kYLZFZa3ernuP19xw7Bq1Y7s7hcwtticycVaaXVrRzZBrQhgc1MrYJlsicMnfIWdycmS5UgNCLqxc39OISLvUDAwoYUHAMGnpxW+lu9X7qxQXs4oIBBQr7B7y59sdqFKDYAAAAAElFTkSuQmCC","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOgAAABICAYAAAD8tbmWAAAAmUlEQVR42u3c0QnAIAxAwbf/0nELFb1bIATy+lFoq6b9Tszss115iEhFikhFCjBmetAiUjPB8ZoJAAAAAAAAAAAAAAAAAAAAAAAAQP5yZyYIRqSI1EzL2RVEKlJEKlInBgAAAAAAAAAAAAAAAADk20i7IlKRihSHa1cAAADIuwTvEsDh2hWRilSkAAAAAAAAAAAAAAAAAFxtAVpuR7l7YA6iAAAAAElFTkSuQmCC","frames":24,"columns":8,"box":[20,12,29,24],"still":0},"notification":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAA4CAYAAACrHfdzAAABJUlEQVR42u3czQ0BURgF0DsyvSjCVg8KUIQaFKEAPdgqQjWsJEjGDDNvIs85O4nchfjm/ZCbAAAAAAAAAFCXZurAy25zfXy93B8b+fPl85mFj4B/1vY9oUqvEPKnze9bUeQ/57ddb1wdTkmS83b9NnDo++TPkz90iyW/ZwDGKr23lY8zAIzUTL2nfX2yyZ83n5GHYOpwH7RSA1ZLvgGo9Isvf1i+MwB+CXZPLP9f860AxDUoGACIa9Cua6iu++tvr6vky/+FfCsAtkBgAAAAAAAAAAAAohs0ujujGzT+CwTRDaq7M7pBoxs0ujujG1Q3aPTTRDeoMwBEN6j86AbVDUp0g0Y3KM4u0Q0KukHly49uUIhrUDAAEN2g8uVHNyjYAoEBgAJum8colXsFaJEAAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAAA4CAYAAACrHfdzAAAAhklEQVR42u3csQ2AQAwDQBOx/8rQMMSb3Em0X1iWSOWEJs/3tb5/nFEgBdqc/ygQm40I2OwWQZWr/H03nBNI/iiQ/EvzVyAAAAAAAAAAAAAAAAAAAAAgRgliGU6B5G8bFPwBILZBYxs0tkHdcPKXPwokf9ugAAAAAAAAAAAAAAAAAAAA/NcLs/xH0QBTK9kAAAAASUVORK5CYII=","frames":16,"columns":8,"box":[24,8,24,28],"still":0},"happy":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARAAAAB4CAYAAAA62q2WAAAEN0lEQVR42u3dwW3cMBCF4ZGQXlKEr+7BBbgI15AiXEB68NVFuBr7FIMwNptYK5JD8vtPSSAoD8TMm6Ek7kQAAAAAAADMz2YJxuLt6eG9/PvPX7+3TPfDWvywBBLXeuAouyUAMG0HotJBfDAQnMSfgP4a6GfdF2AgCyXu2XoYGRhIh9bZelgPBqLyD8vd80tERLw+3p9ync5QJ3STgWR9OJWt0mVI3Lvnl8/7ln8+et3I69ErPrLkS2sdtjCDJm5Zecv7Xbv3pevOrLSZjAzR90vU2k7+3cD9qufWStf74eVZiUtHjvjIki+tdewjV/7Xx/vPALjlOszZGYqPBGdhVH466BivU26lY+fswNydUE0dmwpDBx10HNXhMB2AcBoXQPgSFd9uT8s289K/Xbv27enh3VeXYCAS13rAFgaADiRaH6L6V6VzWjSW/vkF8cFAcPKrPlsGNDcQzp47cf927x7/JyPLky+1dOhABk5c6wFbmBsD838DVeCuaVziI7yFAQAAAAAAAIDI+otkCKMcgfAdiMS1HgivcQHoQFQ6iA8GgjDKEQwEQyZur8OKjAwMxDR664G5DUSli2GGfIsPBpL+4VS2SpchcTMNte69Hr3iI0u+tNZhCzNo4paVt7zftXtfuu7MSpvJyBB9v0TNMm3cjF46RoiPLPnSWsdu5ijMpBUf1c7CqPx00DFep9xKx87Zgbk7oZo6NhWGDjroOKrDYToA4TQugPAlKgy1BgORuOskrvWwhQGAdToQM3ohPhgIDLXGSgbC2XMnbo+h1owsf77U0qEDMY3eemCdLYzp6xAf4S0MAAAAAAAAAMQMv0iGMMoRCN+BSFzrgfAaF4AORKWD+GAgCKMcwUAwZOL2OqzIyMBATKO3HpjbQFS6GGbIt/hgIOkfTmWrdBkSN9NQ697r0Ss+suRLax22MIMmbll5y/tdu/el686stJmMDNH3S9Qs08bN6KVjhPjIki+tdexmjsJMWvFR7SyMyk8HHeN1yq107JwdmLsTqqljU2HooIOOozocpgMQTuMCCF+iwlBrMBCJu07iWg9bGABYpwMxoxfig4HAUGusZCCcPXfi9hhqzcjy50stHToQ0+itB9bZwpi+DvER3sIAAAAAAAAAQMzwi2QIoxyB8B2IxLUeCK9xAehAVDqIDwaCMMoRDARDJm6vw4qMDAzENHrrgbkNRKWLYYZ8iw8Gkv7hVLZKlyFxMw217r0eveIjS7601mELM2jilpW3vN+1e1+67sxKm8nIEH2/RM0ybdyMXjpGiI8s+dJax27mKMykFR/VzsKo/HTQMV6n3ErHztmBuTuhmjo2FYYOOug4qsNhOgDhNC6A8CUqDLUGA5G46ySu9bCFAYB1OhAzeiE+GAgMtcZKBsLZcyduj6HWjCx/vtTSoQMxjd56YJ0tjOnrEB/hLQyA8fkALyHJsnPhb50AAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARAAAAB4CAYAAAA62q2WAAACA0lEQVR42u3d0Q3CMAwEUB/771wmaMQf5+i9CRA255RI9QzNHl8BzT6+gtof7iNEYGd4PGUhIsxhUaNqWmG+oT/+/jlS8iWkqBDxu60LkZT+UKNnTRinDpxAPOOiVqBRm6eu0yJzusZ1fSlA3z5DSp639Yf/I0yYH+ogyPSHyYc6cG1/PK4sYWd4RIgBq08gSgEAAAAAAAAAAAAAAAAAAAAAADDe+MRY64D1FoD1FsIc7D6lOcy91Hh6tnq3bV+36qIvRFpXGETPmjBOHTiBeMZFrUCjNk9dp0XmdI3r+lKAvn2GlK1UFCL+jzBhDnUQZPrD5EMduHc3ritL2BkeEWLA6hOIUgAAAAAAAAAAAAAAAAAAAAAAAIw3PjHWOmC9BWC9hTAHu09pDnMvNZ6erd5t29etuugLkdYVBtGzJoxTB04gnnFRK9CozVPXaZE5XeO6vhSgb58hZSsVhYj/I0yYQx0Emf4w+VAH7t2N68oSdoZHhBiw+gSiFAAAAAAAAAAAAAAAAAAAAAAAAOONT4y1DlhvAVhvIczB7lOaw9xLjadnq3fb9nWrLvpCpHWFQfSsCePUgROIZ1zUCjRq89R1WmRO17iuLwXo22dI2UpFIeL/CBPmUAdBpj9MPtSBe3fjurKEneERIQasPoEoBQAAAAAAAAAAAAAAAAAAAAAAXOALqhfvSfh7RAEAAAAASUVORK5CYII=","frames":32,"columns":8,"box":[18,6,34,30],"still":3},"error":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANAAAABLCAYAAAABBQn0AAABm0lEQVR42u3cwW0CMRAF0M+KXlIEV3pIARSRGlIEBaQHrhRBNcmJAyiwSzZ4bfPeBQkZPtLIsr0ykwAAAAAAAABwYfXbm6eP9+85X/r2+bUaG1Mio9cs9akna7g1cLM/XLze88jY0hm9ZqlPHVk3J9Bxt81mf8hxtx0NeWRs6Yxes9Snjqy7K9D5w1Nm6dSxpTN6zVKfOrKcgZyB1OcZZyBgnAkEmfkYe+6yNmXZK5HxX8t0bVnqU2+WFQhMIDCBwFUej0k9xn6l+qynDD6HXn/4+v2//LgSGb1mqc/yWbZw4AwEJhAAAAAAAAAAELex47av29iaikTjvmisqD7RWDEaK6qPxooa90VjxWisaI/tDKSxIhD/B4JorKixovpEY0WwhQMTCHCVJx5jq080VtS4LxoraqwIzkCACQQAAAAAAAAApPvb2HLk9JAzLN3oTo6clnOGpRvdyZHTcs6wdKM7OXJaznEGkiPnGWcgIP4PBOmhsaIcOT3mWIHAFg5MIHCVx2NSOa+Us66h0Z0cOa3m2MKBMxCYQNCcHxqW5WOVyKJXAAAAAElFTkSuQmCC","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANAAAABLCAYAAAABBQn0AAAAk0lEQVR42u3csQrAIBBEwUf+/5+TxjqQwiDHDFgvKFt4xdV39zo7/ZExNWva+xztcgWgQKBAAGCI4O4MEQAAAAAAAAAAAAAAAAAAAMhOhOxEkJG1VqBAgAIBkCGCj70hAgAAAAAAAAAAAAAAAAAAADRoh4AcOVlrBQoEKBAAGSLIkQMAAAAAAAAAAAAAAAAAAAAvHoBsR8vwrJ6sAAAAAElFTkSuQmCC","frames":24,"columns":8,"box":[23,11,26,25],"still":4},"sleeping":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPgAAACMCAYAAABRYmTcAAACnElEQVR42u3dPYrbQACG4W+D72CX7vYQKtQYcoS0Ah9iz7CHEKTdIwjUpPAh0qVMTuEUwWYRCKKfWXa1z1PZRvhVM/YgiZkEAAAAAAAAAAAAAAAAAAAAAAAAAGCDHv73wJ9P365zAr/+/E6SfP3+42HuSWpra89rf/EbB9tlgIMB/k/V9qnafrXjtLW1y7Z3U+KX82nV47S1tcu2TdHBFB3Ilm6Tzb1kn5FL+Ely3B/urx+fX7S1tQu3/YODKTpggAMeVY1HF7W136S9m/plt4sGt5MZXkQYft419XWtXyNtbe1pbVN0AAAAAAAAAAAAAAAAAAAAAAAAACCfdtnkpVusLFlSVltbe37bqqoQO5sABjjwYQd41fap2n6147S1tcu2J21ddDmfVj1OW1u7bNsUHUzRgWzlPvjSe3IZuUeXJMf9IcNdFLW1tcu0/YODKTpggAOeRY9nk7W13037fgKvT2L4fuzzrqmvXVMvOnltbe15bVN0AAAAAAAAAAAAAAAAAAAAAAAAAAAg21sXPZm/bvPi9Zq1tbVnty2bDLF1EbD1AV61faq2X+04bW3tsu3dlPjlfFr1OG1t7bJtU3QwRQeypdtkS7czzeASfpIc94f768fnF21t7cJt/+Bgig4Y4IBHVePRRW3tN2nvpn7Z7aLB7WSGFxGGn3dNfV3r10hbW3ta2xQdAAAAAAAAAAAAAAAAAAAAAAAAAMinXTZ56RYrS5aU1dbWnt+2qirEziaAAQ582AFetX2qtl/tOG1t7bLtSVsXXc6nVY/T1tYu2zZFB1N0IFu5D770nlxG7tElyXF/yHAXRW1t7TJt/+Bgig4Y4IBn0ePZZG3td9O+n8Drkxi+H/u8a+pr19SLTl5bW3te2xQdNuwvkgbHOE++OwQAAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPgAAACMCAYAAABRYmTcAAACuklEQVR42u3dMW7DMAwFUCrI/a+sLh2KDF2SmDL/e0Bnoa6+SSWuWQV82/79udzDtUfQ5nr6m0dv9ldr8LqdVtzCHLXZd9i6BLZtu7mFsy6XVPDk1m2roCp30tkgaQMkhswZ3PkwYt3O3/WE4wFhFTytcqsoOIMLGgAAeNAFKvrD7SXgcHDIOj9wFnBO3vDbg08CLmA2/OQHkLToQUHbwh11Q22t4Lv5fJJWybrDndiil/8Hz6ziXRWl68bWFSyBdgG1bgAAAAAAAAAAAAAAAAAAAAAAAAAAUN6qCtRFb+b9ag4FHEEbPKlGwOne7BFBq7Mm1dActr8/J4R98tqj13QHMWgwebjhCYMNjziDJw+f28ItaBXyKXrSCNmk0bXpZ/CxneMSMoMGmds5atHx9x9c1ARGwByVBneOAq6iCPfgznF94CJ03uV8paNF5x9Pl+BWFaXrxtYVLIF2AbVuAAAAAAAAAAAAAAAAAAAAQL0zreZyD9ceQSuvbMLAwTLooO725iSvHDLCNnGoBcHTPHfQZM3EdSv9pYvJrZvZayp31NnAJIuKmaDhDB42Pli4bXZBu/m+W8ItZMYHzy0qzuCGK6TPPxu9pnZQ0IQ79Axu+JyqImiV9YSNr3Nm3tTSz+BjO8clZAYNMrdz1KLj7z+4qAmMgDkqDe4cBVxFEe7BneP6wEXovMv5SkeLTvl/8CkVpevG1hUsgXYBtW4AAAAAAAAAAAAAAAAAAABAvTOi+nIP1x5BK69swsDBMuig7vbmJK8cMsI2cagFgW3bbm7hrIvxwSqZdflci26SRcVM0HAGDxsfLNw2u6DdfN8t4RYy44PnFhVncMMV0uefjV5TOyhowh16Bjd8TlURtMp6wsbXOTNvaulncEIfxOh++AW06AAAAAAAAAAAAAAAAAAAAAAAAAAAr34AGBc5K2DI1cQAAAAASUVORK5CYII=","frames":32,"columns":8,"box":[18,1,31,35],"still":0},"waking":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAABACAYAAABMbHjfAAAB5klEQVR42u3cMU7DMBQA0B+UO8DIxiE6dEHiCF2ROARn4BBIrD1CpS4MHIKNEU4RNlQhmoYQB9t5bwMFY1n+/j+16wgAAABYiMYQ1O31ftMd/nz1sG1yau+/taZI3RNUgPU7MwVZMhmg8hXa+Pe3JwNU7uph26QoI1K1KwMscIKmyAzHJmeq/1NKuwKgsJSfyupxHxERL3fXkzxXaoknADJboVNP0LlM1f/U4y8AvMQuevwFQGYlxFyZbGh/vj+Xy4vvVOMvADIttUqboKX2v5UiI2ra2kcJlKREqa2EkCGPBMDYFfTt4z0iIm6enpsUK/TQ9iGcBYKFlEDHMsrYFFnbcV9GZIDV4/6rNj5VPw95bu724U8ZYOzqOVTq9unPlodZ7aff9T37er/pasqK9gFM0EX3v63l4zH7AIwKgKnPVuxu193l+UWyDn9vP5edz1MrnDNEeY6/EmiBk0Z2FAAm6Im/mbKtnAOslSLzLlGmnKD6H6fvBSr9KMSxiT00ALwE2wcYtYLubtddyhX6t+1DOAsEAAAAAAAAAAAAAABAbZq579fXvq9cRgnfCCv9flD3m+IrkSAAoOcdwJV9UfRlWMgAIABAAIB9APsAyAAgAEAAQMxwO/Rva2PtIwOAAAABAP/iE7RU52unkeZ5AAAAAElFTkSuQmCC","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAABACAYAAABMbHjfAAAAkUlEQVR42u3cQQqAIBAF0DG6/5V1EyjtReS/B62rab6TG6tg6t8V4/HNNWjy8wsA0QTACh1d/1fNWLS0FxYADfpfQXfepwnA+RF580p3e4P21EnjHx2bYAFD/RUIABMAAAAAAAAAAAAAAAAAAAAAAAAAAChHC1KORwcBAAEAAJtgAAAAAAAAAAAAAAAAAAAAjhq4KRwHBpIvogAAAABJRU5ErkJggg==","frames":12,"columns":8,"box":[24,4,24,32],"still":11},"poke-left":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAAAgCAYAAABw4baZAAABDklEQVR42u3bwRGCQAwF0F2HXizCQizFGijCAujBRqxG74woomYlvHdV+eNAyOKaWkaup+OtfGDfD/Xdz0RnRuZlzJIzP6crDXz6hf45L2NWtpxIu6kXDudLOZwvLw8w933kE3WNrDlnt8UT1iIvaxbP1V+35Ufr0+jMyLyMWXKWn6MmHWzfD3XJjyFryMuYlS3nL57BFJoshbbyAoPsum8/r7S480RnRnfdbFmtcyKveR0MLBFBgQFz/yo13jOYWrd+c28hOjMyL2OWnNc5OhhYIoICA0bqVmalQAcD82DFeAXoYLCxebAWs2egg4ECAxQY2Acr9sHQwQAFBgoMinmw/LNSoIOBAgMUGDR0B/glUpc7BkxsAAAAAElFTkSuQmCC","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAAAgCAYAAABw4baZAAAAMklEQVR42u3BMQEAAADCoPVPbQlPoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgJcBbCAAAQ5e1s0AAAAASUVORK5CYII=","frames":10,"columns":8,"box":[24,20,27,16],"still":0},"poke-right":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAAAgCAYAAABw4baZAAABCUlEQVR42u3bwQ2CQBAF0IHQi0VQiKVYg0VQgD3QiNXonUQFIQPsvnfe5EdgmMXJNvHF83Z9xQqX+6P5tSYjIzOn5Cx5y/O6OLnpBVl6QY+WU3JWDXlT7ZxF/TBGP4ybreP8sp+Js+a1td2wzBtVahbzNVvuP+fsTzMysn5L5nXbI0veel0pb4qsvXXmHr7UrBryiikwheVBP2JhHe4bDIr/BgtzMHMweZvm6WBgiwgKDIg//kWczpY+zRLWzKAyMjJzSs6SNz9PBwNbRFBgQBxsDhY7zTtAB4MaCsyxC9DBwHmw2OncD+hgoMAABQbmYGEOhg4GKDBQYBDOg9Vzrgl0MFBggAKDRG9/9FZS9IHJcwAAAABJRU5ErkJggg==","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAAAgCAYAAABw4baZAAAAMklEQVR42u3BMQEAAADCoPVPbQlPoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgJcBbCAAAQ5e1s0AAAAASUVORK5CYII=","frames":10,"columns":8,"box":[21,20,27,16],"still":0},"tickle":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANAAAAAkCAYAAAD4p7R7AAAB0ElEQVR42u2bMU7DMBSGfyPfAUa2LtyAoQsSCztrJQ7BGXoIJBaGHqESCwOHYOvYniJMQVYVp7Zjhxfp+6a0dfJi/7H9aud3asB+s+5ur2/+Pq+2O/fz+tyFZVbbndNCGLv38LfD6ajH9y/z9UKfelwJAIrxKT06lcPpWDxq5MbIGUn2m3UnSeGo23J0nxIrZeRHHzv6+CmNZS0NiU3bS2IoHUEfu/r4WMH7t09J0vfLw+gFx8qFjdYfhzdQI0YuU2IOzQ5D9ZqjfuhjQx8fO6EvHB5fKvfxdJfVUK1j1IpZ8mC0jIU+dvRxNVO4nPy3Rh6fmyK0/F/SKp+vmcKhT319/KVpzjq50/YS64U+duvll1qxlFG0r08/6iz1gUMfu/qwDwQgNlIB6EAAdCAAOhAAqPRdOEVWfc5XIM6/L1lNmSNGaawpq11zxEKf/9eHGQiAFA7AUAqX+mpETdNV6rVKDFGp57QwkbVoS/Sxo4/D8SgcqehDCgeAIxXHI45UHKk4HnGk4kjF8YgjFX1wpOJIRR8cqThS0QdHqnA84kjFkSocjzhS0UfsAwGIjVQAOhAAHQiADgQAwpGKIxV9cKQCkMIB4EjF8YgjFX0i5X4BUl3ASmlIMWIAAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANAAAAAkCAYAAAD4p7R7AAAANElEQVR42u3BMQEAAADCoPVPbQdvoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfgN1JAABgIwlBQAAAABJRU5ErkJggg==","frames":16,"columns":8,"box":[23,18,26,18],"still":0}},"deepy":{"idle":{"dataUri":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAkAAAAAYCAYAAAAS2EKFAAADhElEQVR42u3dO3LUQBCAYc0dICWEKxgyAgIiMmJ8Ax+FG9gxGREBARnLGRwS+w64VC6btUqaV3ePekZ/J37VSl/1aHpaWq0cJqJ5vHj95d/d7U3AQ45GdREEQXgPk8LJ4tWPZ7a8+3g9/f5xOcVMLc3eTB5zxLFNXgiCkM2vYAFh8erPM8eWKdc8qsljjji2yctoJz00rJw0t/aYNUAsXv15lqb5b/PXlHd0k8cccWyTl9E8NIicNLf2mDZALF79eR73e+5Ys+7RBO1p8ubJmfg5hWFED3O+Xw8NIifNLT3mDdDei8URPI+DHIvUmcNy38soyY3Uo23y5rGe+MtJv3ch2sPjqWGlJtIgctLs0xN6WCxGW+BH9uRsK3d7qW312gBpeGITv7QIefJYWmqPQTxtG3kaRDsPx3PkHqCSxUu6qLZeUPH05dEyjezRKESePJr1R2O8Sj3WNRFPXw0i4+XfE0oxuYVoa3u5xavGhGccj4ZpdI+0CHnyaNcf6XjVeCznGB48ePQ9QYJJ7SD23qX2YopnPI/EdBRPauJrNT+WHqv6UzteUo/2HMODB4+NZ/UGRQnq/OYs6U29GknC06dHYjqC5/xS/9b9Aan7bDx4rOpP7XhpejTmGB48eOw8QaMbWyt2pWek2h0inr49EtMRPC3ee2/hsao/teOl7ZHOMTx48Nh5wtoloy1g7G81Z2i5SbIy4cEzkqe2IdvTc+TceMsPHn2PdTBeMk/wtli0ShKevjw0QGN6aA7xjOqJXY1MXalkvNp4QquOtdUNtXjwHNEz7fSWpXZBPEpuvOUHD54jelYboO9ft1/w6Sq9U+nDojRNePr3aDQceHx6WtSfPT3SOYYHDx47z7NPgcUgJbglqGZBrTHhwYOnL4+3+iPxWJjw4MFj53n6+Ni3nw8vfv+qDPTyzeUUe0x37aPCa0148ODpy+Ot/kg8FiY8ePDYeMIaqgS2hpkKnyCck6hcEx48ePrzeKs/tR4rEx48ePQ9Ye3yVA7s19//33/+YFukc0x48ODp2+Ot/pR4Wpjw4MGj6wk53VkqZswU+Tifxn/MLTHhwYOnX4+3+lPqsTbhwYNHx7O8AnRx9uOpwPM29ZrKDvFi8asTHjx4DuHxVn9OhS9XN+HBg0fXEyLFUDXubm/+CIszHjx48ODBgwePiie0QJUmBw8ePHjw4MGDx9JzD653WPqr9cjFAAAAAElFTkSuQmCC","frames":16,"columns":16,"box":[12,26,36,24],"still":0},"idle-look":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[11,11,37,39],"still":0},"thinking":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[0,6,47,44],"still":6},"typing":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[0,17,52,33],"still":5},"building":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[2,0,50,50],"still":0},"conducting":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[1,0,51,50],"still":2},"notification":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[3,7,47,43],"still":6},"happy":{"dataUri":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA0AAAAAtCAYAAACH4QtbAAAO5klEQVR42u2dX4hdRx3H56AIFt/Mqq2Ytg+ND8lqwCSkQkAFvVFJg+kSfIqJedBSSxIf6kMou0sbikHI9iH0KWYJgiUukTSCWUUtDRhpWojuLeLmodrS1ti8KFoQhCNz7p3N7Oz5M//OzG/mfr8vdzfd3d7v+c2Z8/vc329mCgZBUDLatOVwyV/vrC4WuBoQBEEQBEHmQhIFQYkB0Oe/ep79/pdHAEEQBEEQBEEAIAiaDADiAgRBEARBEAQBgCAIAARBEARBEAQBgCAoNwACBEEQBEEQBAGAIAgABEHQmnbenK02Drmxfb7IzVdOnnLzA0EQAAiCIEPIkb8Xmx6Ir2UBgCAkohvfe3l6T3UPFU9ey+be4J5y8jMpELTz5uzSje3zM5hZIAgABEGQBgSpsFMnABDkI+l85Ve/XYOFHAAoB2BQK1c5AJAan9wgFQAEQQAgCIIcAYjVVHwAQXQT1JQTUjm5LoeDsti2nNV4avJ07mRZHj1VFDl5SgWAclN5es9S8eQ1gA4EAYAgCPIBQvKub01ABAgKm8Txikmlr93DRBJKMZk2fU91SXVsX33+/3MFIO6Lv6bqLYWY8coOG30AMjNpALTz5uz0je3zK3gaQAAgCIKCAZH4WoWhF5+jm+zwCsOur3xJq1rCPbbBXNd/95lodSWRIgmlmnDy6/7jf75c+77qEuhy36GyuHKhoPT+U2+RShmyKEEdricEQQAgCJpwPXKsLNV/o1QFkpMUUTHhAPTdn821QoKoeLV5ET/TJ/DJ6xMEFPDkrPq3cYLG/736nhAwNPqpAZumZJMSBOkAkBqXOj8x49QGoTYAAJBLDuqWim3LyVWGytN7psdzICo9EAAIgiC6AMQIVYEqgLj2IGPP3ma7/rebcQCa+8bLbPMi0wIgAXRcAoTUdVEhgK8teZ69NYrB/ENFwb/mr6lAkLrToBC/nqoXSt5s4Cw20JlWsXQgKAbUAYB6v75LR08VUUCJt7SxUTvfigpBACAIAARBEBk17RJHpQokA5BI5mRgMPEVawvw8szVUZJ5Yu/a5gCsodKg4y1aLM5cLYUH+To3ARBVXy4gkwKgdsVHjU1IsLNtRRQwp+Mntfk3Jz8QxltgP6/W+NkBAIIgD5NFqpMDTzR4pWTuF8tV4i28yK1hXTvDxa4CVS1vT73BRNuYDAwiGa9LylnC23/Lfih9Ut4EPw9evL/25984+LdaCIoJD01jhRm2jNX5iOGtq3rTFJ+62IScl0wBSIYfXT99Q52PKgvF+IROsMvhYLrYtrySix/qsclpvHH4afETFIIAQFB2n4ykPulxgOCTwXuPfZNNPf+C1lbYlOBATWLkGHFPbQCkC0G9V38MWoxUL2rliEocuuCH65XPzrGpT9+9tnVxagK8cjg4xEYVsguhAEgk2lMH7jW+90V1ixGq3LXFR42NaXWuHA4OjONzqa/x5eInREXLdac2Ez/G7204eHwcn7PUE2xTADp3spw+eqpYoepHMz69zG+xxhsl+FH87LCMz+FxfBYBQNBEgE9u5+SYVHpUj+J6yGtnQlfDmoBU9qKu7TGBIJ3f9QGgLPHzfUwBiD98uHb9cW4tUWiCn29vWt4Ad1VysPXq6JvX95JIElL7hFSAXFN85NjogJ0MRhX8rI/PpT7Gl25s2vxQbVfkmxlMHbj3URM/5b5DS8WVCzMaf/txJT5nY947vhPsUADUl59Y85vN/ZMiACl+dljE57ASHy0IAgBBycPP5QeW2f6/DrQAgfJkYQJ1OhCkwlAoeDN9v3XvrWktEPrs9SGuDuDEA1U8cOSHjy441IERtQTBNeHx3caoWxXsio9JwiODRB8AZBIfEz+U12uZ+uEAxEaV5JmUACjhBLsXP7HnNx/zASUA6vADAIKgpgnh4q/Psy9uHn2///hdAGpaLJ9CAu0KPxSgzxSAut6n+vcAQO4QJCcIctVHllOS4KlFRLcF0TbhaWuri7mGqys+tgDEemiB6xgLG9b/uPrpE450KzW+/WyAoMAtcBkm2L35id0C53u8xQSgDj9ogYOgLvgRACSS49jrRijBT2i/tvDT9H5zqwBR2ZhDBQa1+pPaQ9U24elaV0Q1PlE3QjC4Zk0bILj66QOAdOGHenyQYOftJ5Px9qqGn2AbIQCAoOQAiEuGIN7mkvJaIN1F/6btZSHhxxfAtVXxUgUgncNdQ0KS6S5wodXUvhcy4Ym5kYXLmqYuSOHVLf5qU+GyhUbfa7Rib81u6mf2Vrk0fr8kDkPlGxiw0SflKzkDXQ5+GHaBAwBBkCv8MKLrgHThh413UBNrnS4v3PUvFPKAUFMPtiCXEwC1edCFJAoA1Deo2QIQtYTHZVcz2218dSAlRosfzgHqhLqlWIBktQvcvkPTxZULK1RjM+nblKcAQTV+JvMcoJTPbYHCwk8dADGD3eCoTRyPHCtLU2gQ8CP0uzdHrwe/HAcQ6tbqtMXDBoJSb39rWsukVs9C+dQ9CNUW1ELO6VQTnpAHlZpee6otgBRzBL77GxtVTGb68hK7SuSaYFPL4Vz85JaP5phf+/JEoied2gMVg44uAMnwI0sXhKgl0ibtbyr4yPBDBYDk3efq1vBUPh5Yrr7v2rkvVwBiLa1+1H2GqGaVw8F944TznUlN4Pp+nroAUDkcfG4cn9co5ghtFa7yzNURzJzYO0MxPqISZDoe5YpMORxsGcdnFTkcPS/lcPCFcXxeQmzieiIDQIxIewgGHc3ryV/VDRBkic0QWEuFgeL40W0fq4MfGYI4/LBI1S3hQQUbOQ4mVR/1Z2PGreugXd1rTuFw1z7Gq+9qVgU/67czfSeUJ1/zdcxzpHw/T9UqVgU/6+PTOwSJ9Vhip882T/s/Yre+iUp8OACd/fqRR23yHQ5B7Nnb/1Xis5ramMs5H63gZ318XkJs4nkiBUCMSHsIBh3Na9oEQGIr7KnnX2AswW2wu9rg1tYA/eV8LfywiNWfpuReXaMkv/cqXgsbwbUNgl58rigo+GqLD7M83DVlAGKeq1kxASi3BK4nQA0OQDnlCAHisyUUAM3eKqfnHypWEJ80ACjH/NrVEzkAYgm3h+Q86FIAINbSVpXaFthy2xuHCKrwo3poq1Q1qW4jC/VQ19D+fJ9p1PY3Y5zX1PUzLiDner/ZtMBhvg73PI3VAqfriW8WwyLt4EckPlFa4HLI4QLFJ3gLXM75tYunwsebcXmYsozaQ3IedCxyy17bOqCmKkKqANS25kcFoNjwoxMfGwBikTat8H0mE7WzjUyqWrlXs6jO19QBNXR+QMlT7Hzn3Mly6egp+40S+BbYfPvrkPH58EdHr7/5SRpjLrf7B/NBswpXM75236LyQEXPf7sf3ffsG5aadoJLGX6akm65mlW34xv3Tgl+umLUBnBC3AuV6kgfB9IyAmcbmXqbhGoWxQQ7F0DNrYXUd75z+VvHqq9/+I/tQQBIPv+HZdriO8n3D+aDgABkkyhQf6Ci59/s2tS1irCe2kXkjRBEwqz+/0yus+02wCGuMQcgFX5kWJD9U9zUQY5TGwipAMQIrN8y2dLb5Uyj2L58zNttrWPjhOueccL1fg7z9fQHD7JnjvzrRLFteYFCjCg/T3NrIe0r3/nBx26uAyD5d8rh4OPj++d2DvH5888/cJa/Tm09970c7p8+57fc8usY4+29S+9uHsfnLa8A5Popqe0DFRM2LQBigT/dFhWGpmqBSYKpbjxABUblSht/Pf79jT9DFX7qYtUl1UvbJ/qhQUFnS+8UDnb11dZn0s5XJQfrF/u+H2I+6mu+/s6+/7BnfnTxhORngYIfis9TH1VUSp5i5DsV/Ky/f9YgiG/l7bKNd4z4lMPBU4qfp1O+f/qc33LLryONt08p8XnLCwD57JGn0h+f24StxqpLJgeEuYJHyFilBj9NcRPQx99javv1+xp7oQFUd0tv8XPM8Fyj1OY30w88KCcIlg/U44qfBd/3SUhApQ7bVDzFyne6AIhZnmUUKz59AlBOH/Dkll9HHG/9AZDJ2R46p8KziP3xOU7YfXx6oPP3dVtNXNS0ZXTdOJI/pRfwkPImFFA4AJLVtaW3zj0Vc9zFACDWUwtczPm6gqCRn4Uc4kN9rFHw5NuP4f3jvQUuZnwqCBr5eRrzG73xltt8UEGQ7xa4kD3yoQPkA+hiDro+JgLW8ClpHWzEgFX5fXaBNuAHMhljNlt6655rFBOA+pqzYzxQc1ijhfjQjU/O+Q7un8mOD8YbgQpQzODkNCH4/mS06T239cmHBiBd+Ik9xqD0IMh2S29G8FyjEOuaYszXOa3RQnzoJ3B9+sktPvd/6N/sp5efwP2D8UZ6PnCuAPWlFPvjY3pqat8wrYqkEi9X+AEIQboQZApClM41YpbrmqivZ8pxjRbiQ8+TrZ9Jj08MAJrk+wfzQUQAamsV6eqRp9gf7+InlieVtHXBIKWtfOsAqG33MJNKESAIqhtrTHNLb0b0XCPmeV0T5fk6pzVaiA8NT779ID64fzDe6Iw3p13gTHvkqfbHswx6/kNWsmIDkPha5wTkrl2eYienUBogpLOltywq5xq5zHGYrxGfSY8P8h3cP6nEB+MtAAAxxx55av3xLJOef9eBlsKnI32BlCzAD2QyXppE5Vwj1zkO8zXiM+nxQb6D+yeV+GC8BQAg5tAjT60/3tUPJU8uHkz8yK1lAAYISgfiTOcHzNeID+KDfAf3D8ZbjuOtcDXFNHvkqfbH2/qh6qmuXcfHpwiqH4ZqCQQlCUE6cxzma9qeEJ84EIR8B/cPxls+463wZcykR55Sf7wPP5Q92XiR/TCN83UAQhCUHgjpzguYrxEfxAf5Du6fNOKD8RYIgDZtObxb+va6wa8+3PU7kWDB1g9JT5Kf6xa//rDutQjcj73V19+6s7r4OrGk9BMWHv5OOMn+pGVc3ibk4TMex9ufInvZrfzTdcO5APM14oP4IN/B/YPxlsV4KzwONq+6s7r4h8g3D/wQ8uMbfqhBkA38UIYgW/ihBEE+4Sc2BGF+gx/4gR/4gR/48QBAfZqKkVzDD30/DBWgJODHFYJQAcJ8AD/wAz/wAz/w06ef/wMyWlSHOg1SQwAAAABJRU5ErkJggg==","frames":16,"columns":16,"box":[0,5,52,45],"still":13},"error":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[4,17,45,33],"still":8},"sleeping":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[2,2,44,48],"still":2},"poke-left":{"dataUri":"data:image/png;base64,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","frames":12,"columns":12,"box":[1,16,50,34],"still":0},"poke-right":{"dataUri":"data:image/png;base64,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","frames":12,"columns":12,"box":[8,16,44,34],"still":0},"tickle":{"dataUri":"data:image/png;base64,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","frames":12,"columns":12,"box":[9,17,43,33],"still":0}},"astra":{"dataUri":"data:image/png;base64,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","width":48,"height":50}};
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

  // ── Astra 24x22 Pixel Star-Spirit Matrix Engine (1px Deepy-style indigo outline) ──
  var ASTRA_PALETTE = {
    O: '#1E293B', // crisp 1px dark indigo outline (matches Deepy)
    W: '#FFFFFF',
    C: '#EFF6FF', // bright starlight highlight
    L: '#93C5FD', // soft sky highlight
    B: '#3B82F6', // aurora royal blue (matches Deepy body)
    D: '#1D4ED8', // deep shade blue
    N: '#0F172A', // visor/pupil dark
    E: '#38BDF8', // glowing cyan star halo / cheek
    G: '#FBBF24', // amber star/alert
    R: '#F87171', // crimson alert
    M: '#34D399', // emerald spark
    P: '#94A3B8'  // sleep / subtle gray
  };

  // Chubby cosmic starlight spirit with crisp dark outline, tiny star halo, and cute ear-wings
  var ASTRA_BASE_ROWS = [
    '........................', // 0
    '...........EE...........', // 1  tiny floating star halo
    '..........EWWEE.........', // 2
    '........................', // 3
    '....OO............OO....', // 4  ear-wing tips
    '...OBBO..OOOOOO..OBBO...', // 5  crisp 1px outline + head top
    '...OBLOOOBBBBBBOOOBBO...', // 6
    '....OOBBBBBBBBBBBBOO....', // 7
    '.....OBBCCCCCCCCBBO.....', // 8  bright face shield
    '....OBBCCNCCCCNCCBBO....', // 9  1x2 cute dark pixel eyes (cols 9 & 14)
    '....OBBCCNCCCCNCCBBO....', // 10
    '....OBBCCWWWWWWCCBBO....', // 11 starlight cheeks + chin
    '.....OOBBCCCCCCBBOO.....', // 12
    '....OOBBBWWWWWWBBBOO....', // 13 chubby body + star core
    '...OBBDBBWWCCWWBBDBBO...', // 14
    '...OB.ODDBBBBBBDDO.BO...', // 15 cute mini fins
    '......ODDDDDDDDDDO......', // 16
    '.......OODDDDDDOO.......', // 17
    '........OOB..BOO........', // 18 feet
    '........OO....OO........', // 19
    '........................', // 20
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

  function clearAstraEyes(grid, xOff, yOff) {
    var dx = xOff || 0;
    var dy = yOff || 0;
    paintPixel(grid, 9 + dx, 9 + dy, 'C');
    paintPixel(grid, 9 + dx, 10 + dy, 'C');
    paintPixel(grid, 14 + dx, 9 + dy, 'C');
    paintPixel(grid, 14 + dx, 10 + dy, 'C');
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
          for (var ex = 9; ex <= 14; ex++) {
            if (ex === 9 || ex === 14) paintPixel(g, ex, 9, 'C');
          }
          paintPixel(g, 9, 10, 'N'); paintPixel(g, 14, 10, 'N');
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
        clearAstraEyes(g2, 0, 0);
        paintPixel(g2, 9, 8, 'N'); paintPixel(g2, 9, 9, 'N');
        paintPixel(g2, 14, 8, 'N'); paintPixel(g2, 14, 9, 'N');
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
        // Amber eyes directly on base eye coordinates (cols 9 & 14)
        paintPixel(g6, 9, 9, 'G'); paintPixel(g6, 9, 10, 'G');
        paintPixel(g6, 14, 9, 'G'); paintPixel(g6, 14, 10, 'G');
        frames.push(g6);
      }
    } else if (st === 'happy') {
      for (f = 0; f < 6; f++) {
        var g7 = cloneGrid(ASTRA_BASE_ROWS);
        var yBounce = f % 2 === 1 ? -1 : 0;
        if (yBounce !== 0) g7 = shiftGridY(g7, yBounce);
        // Happy curved '^ ^' eyes replacing cols 9 & 14
        clearAstraEyes(g7, 0, yBounce);
        paintPixel(g7, 8, 10 + yBounce, 'N'); paintPixel(g7, 9, 9 + yBounce, 'M'); paintPixel(g7, 10, 10 + yBounce, 'N');
        paintPixel(g7, 13, 10 + yBounce, 'N'); paintPixel(g7, 14, 9 + yBounce, 'M'); paintPixel(g7, 15, 10 + yBounce, 'N');
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
        // Crimson visor eyes directly on shifted cols 9 & 14
        paintPixel(g8, 9 + offsets[f], 9, 'R'); paintPixel(g8, 9 + offsets[f], 10, 'R');
        paintPixel(g8, 14 + offsets[f], 9, 'R'); paintPixel(g8, 14 + offsets[f], 10, 'R');
        // Alert X spark
        paintPixel(g8, 11, 1, 'R'); paintPixel(g8, 13, 1, 'R');
        paintPixel(g8, 12, 2, 'R');
        paintPixel(g8, 11, 3, 'R'); paintPixel(g8, 13, 3, 'R');
        frames.push(g8);
      }
    } else if (st === 'sleeping') {
      for (f = 0; f < 4; f++) {
        var g9 = shiftGridY(cloneGrid(ASTRA_BASE_ROWS), 2);
        // Closed sleeping horizontal eyes replacing cols 9 & 14 at rows 11-12
        clearAstraEyes(g9, 0, 2);
        paintPixel(g9, 8, 12, 'P'); paintPixel(g9, 9, 12, 'P'); paintPixel(g9, 10, 12, 'P');
        paintPixel(g9, 13, 12, 'P'); paintPixel(g9, 14, 12, 'P'); paintPixel(g9, 15, 12, 'P');
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
      '.ags-mascot-stage { position:absolute; bottom:100%; z-index:8; display:inline-flex; flex-direction:column; align-items:center; pointer-events:none; user-select:none; transition:bottom 180ms cubic-bezier(.22,1,.36,1), transform 160ms cubic-bezier(.22,1,.36,1), opacity 160ms ease; }',
      '.ags-mascot-stage[data-align="right"] { right:16px; transform-origin:bottom right; }',
      '.ags-mascot-stage[data-align="center"] { left:50%; transform-origin:bottom center; }',
      '.ags-mascot-stage[data-align="left"] { left:16px; transform-origin:bottom left; }',
      '.ags-mascot-hit { position:absolute; bottom:0; left:50%; transform:translateX(-50%); pointer-events:auto; cursor:pointer; z-index:1; }',
      '.ags-mascot-canvas { display:block; pointer-events:none; image-rendering:pixelated; image-rendering:crisp-edges; }',
      '.ags-mascot-stage[data-state="sleeping"] .ags-mascot-canvas { opacity:0.82; }',
      '.ags-mascot-stage[data-obscured="true"] { opacity:0.28; }',
      '.ags-mascot-stage[data-obscured="true"] .ags-mascot-hit { pointer-events:none; }'
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

    stageEl.appendChild(canvas);
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
    var resizeObserver = null;
    var cachedInkColor = '#91888A';
    var cachedInkKey = '';
    var lastGeomKey = '';

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
        var key = (document.documentElement.getAttribute('data-ags-theme') || '') + '|' +
          (document.documentElement.getAttribute('data-ags-mode') || '');
        if (key !== cachedInkKey) {
          cachedInkKey = key;
          if (typeof getComputedStyle === 'function') {
            var v = getComputedStyle(document.documentElement).getPropertyValue('--ags-text-secondary').trim();
            if (v) cachedInkColor = v;
          }
        }
      } catch (_e) {}
      return cachedInkColor;
    }

    function resolveLogicalKey() {
      if (reaction && Date.now() < reaction.until) return reaction.sheet;
      reaction = null;
      return cur.state;
    }

    function applyGeometry() {
      var gKey = [cur.style, cur.state, cur.scale, cur.align, cur.offsetX, cur.offsetY].join('|');
      if (gKey === lastGeomKey) return;
      lastGeomKey = gKey;

      var w = 104;
      var h = 72;
      if (cur.style === 'deepy') {
        w = 104;
        h = 104;
      } else if (cur.style === 'astra') {
        var astraSprite = globalScope.__AG_STUDIO_ASTRA_SPRITE__ || null;
        var builtSprites = getSprites();
        if (astraSprite && astraSprite.width) {
          w = astraSprite.displayWidth || 76;
          h = astraSprite.displayHeight || 68;
        } else if (builtSprites && builtSprites.astra && builtSprites.astra.dataUri) {
          w = 64;
          h = 66;
        } else {
          w = 48;
          h = 44;
        }
      }
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';

      var hitW = 64;
      var hitH = 48;
      if (cur.style === 'deepy') {
        hitW = 76;
        hitH = 56;
      } else if (cur.style === 'astra') {
        hitW = 52;
        hitH = 52;
      }
      hitEl.style.width = hitW + 'px';
      hitEl.style.height = hitH + 'px';

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
    }

    function drawFrame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      var logicalKey = resolveLogicalKey();

      if (cur.style === 'astra') {
        var astraSprite = globalScope.__AG_STUDIO_ASTRA_SPRITE__ || null;
        if (astraSprite && astraSprite.frames) {
          var aKey = astraSprite.stateMap && astraSprite.stateMap[logicalKey] ? astraSprite.stateMap[logicalKey] : 'idle';
          var aList = astraSprite.frames[aKey] || astraSprite.frames.idle || [];
          if (aList.length) {
            var aUri = aList[isMotionReduced() ? 0 : (frameIdx % aList.length)];
            var aImg = loadSpriteImage(aUri, drawFrame);
            if (aImg && aImg.loaded) {
              var bobY = (logicalKey === 'thinking' || logicalKey === 'working' || logicalKey === 'happy')
                ? ((frameIdx % 2) === 0 ? -2 : 0)
                : ((frameIdx % 4) === 0 ? -1 : 0);
              ctx.drawImage(aImg.img, 0, Math.max(0, bobY + 2), canvas.width, canvas.height - 2);
              return;
            }
            return;
          }
        }
        var builtSpritesA = getSprites();
        if (builtSpritesA && builtSpritesA.astra && builtSpritesA.astra.dataUri) {
          var aPngEntry = loadSpriteImage(builtSpritesA.astra.dataUri, drawFrame);
          if (!aPngEntry || !aPngEntry.loaded) return;
          var dxA = 0;
          var dyA = 4;
          if (!isMotionReduced()) {
            if (logicalKey === 'idle') dyA = (frameIdx % 6) < 3 ? 4 : 3;
            else if (logicalKey === 'thinking') dyA = (frameIdx % 4) < 2 ? 3 : 4;
            else if (logicalKey === 'typing' || logicalKey === 'working') dyA = (frameIdx % 2) === 0 ? 2 : 5;
            else if (logicalKey === 'happy' || logicalKey === 'tickle') dyA = (frameIdx % 2) === 0 ? 1 : 6;
            else if (logicalKey === 'error') { dxA = (frameIdx % 2) === 0 ? -2 : 2; dyA = 4; }
            else if (logicalKey === 'sleeping') dyA = 6;
            else if (logicalKey === 'poke-left') dxA = 3;
            else if (logicalKey === 'poke-right') dxA = -3;
          }
          ctx.drawImage(aPngEntry.img, 8 + dxA, dyA, 48, 50);

          // Crisp pixel FX overlays per state so state stays clear without any text badge
          var fi = frameIdx % 6;
          if (logicalKey === 'thinking') {
            var oxs = [16, 24, 34, 44, 34, 24];
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(oxs[fi], 2, 3, 3);
            ctx.fillStyle = '#38BDF8';
            ctx.fillRect(oxs[fi] - 2, 4, 2, 2);
          } else if (logicalKey === 'working' || logicalKey === 'typing') {
            ctx.fillStyle = (fi % 2) === 0 ? '#FBBF24' : '#38BDF8';
            ctx.fillRect((fi % 2) === 0 ? 4 : 56, 36, 4, 4);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect((fi % 2) === 0 ? 6 : 54, 32, 2, 2);
          } else if (logicalKey === 'waiting') {
            var wBob = (frameIdx % 2) === 0 ? 0 : 2;
            ctx.fillStyle = '#FBBF24';
            ctx.fillRect(48, 4 + wBob, 4, 10);
            ctx.fillRect(48, 17 + wBob, 4, 4);
          } else if (logicalKey === 'happy') {
            ctx.fillStyle = '#34D399';
            ctx.fillRect(6, (fi * 4) % 18 + 4, 3, 3);
            ctx.fillStyle = '#FBBF24';
            ctx.fillRect(54, ((fi + 2) * 4) % 18 + 4, 3, 3);
          } else if (logicalKey === 'error') {
            ctx.fillStyle = '#F87171';
            ctx.fillRect(48, 6, 3, 3); ctx.fillRect(54, 6, 3, 3);
            ctx.fillRect(51, 9, 3, 3);
            ctx.fillRect(48, 12, 3, 3); ctx.fillRect(54, 12, 3, 3);
          } else if (logicalKey === 'sleeping') {
            var zy = 14 - ((frameIdx % 4) * 2);
            ctx.fillStyle = '#94A3B8';
            ctx.fillRect(48, zy, 5, 2);
            ctx.fillRect(50, zy + 2, 2, 2);
            ctx.fillRect(48, zy + 4, 5, 2);
          }
          return;
        }
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
      if (logicalKey === 'sleeping') return 950;
      if (logicalKey === 'idle') return cur.style === 'astra' ? 280 : 180;
      if (cur.style === 'astra') {
        return logicalKey === 'error' ? 85 : 130;
      }
      var sprites = getSprites();
      if (cur.style === 'deepy') return (sprites && sprites.deepyFrameMs) || 110;
      return (sprites && sprites.crabFrameMs) || 100;
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

    function disconnectResizeObserver() {
      if (resizeObserver) {
        try { resizeObserver.disconnect(); } catch (_e) {}
        resizeObserver = null;
      }
    }

    function syncLayout() {
      if (!cur.enabled || !currentAnchor || currentAnchor.isConnected === false) return;
      var anchorsApi = globalScope.__AG_STUDIO_ANCHORS__;
      var inset = (anchorsApi && typeof anchorsApi.computeComposerTopInset === 'function')
        ? anchorsApi.computeComposerTopInset(currentAnchor)
        : 0;
      stageEl.style.bottom = inset > 0 ? ('calc(100% - ' + inset + 'px)') : '100%';
      var obscured = Boolean(
        anchorsApi &&
        typeof anchorsApi.detectMascotObstruction === 'function' &&
        anchorsApi.detectMascotObstruction(stageEl, currentAnchor)
      );
      if (obscured) stageEl.setAttribute('data-obscured', 'true');
      else stageEl.removeAttribute('data-obscured');
    }

    function mountTo(anchorEl) {
      if (!cur.enabled || !anchorEl || anchorEl.isConnected === false) {
        if (stageEl.parentElement) stageEl.parentElement.removeChild(stageEl);
        currentAnchor = null;
        disconnectResizeObserver();
        stopAnimLoop();
        return;
      }
      if (currentAnchor === anchorEl && stageEl.parentElement === anchorEl) {
        syncLayout();
        return;
      }
      disconnectResizeObserver();
      currentAnchor = anchorEl;
      if (stageEl.parentElement !== anchorEl) {
        anchorEl.appendChild(stageEl);
      }
      if (typeof ResizeObserver === 'function') {
        try {
          resizeObserver = new ResizeObserver(function () {
            syncLayout();
          });
          resizeObserver.observe(anchorEl);
        } catch (_e) {}
      }
      applyGeometry();
      syncLayout();
      drawFrame();
      scheduleNextTick();
    }

    function update(next) {
      if (!next) return;
      var changed = false;
      var stateOrStyleChanged = false;
      if (typeof next.enabled === 'boolean' && next.enabled !== cur.enabled) {
        cur.enabled = next.enabled;
        changed = true;
        stateOrStyleChanged = true;
      }
      if (next.style && next.style !== cur.style) {
        cur.style = next.style;
        changed = true;
        stateOrStyleChanged = true;
      }
      if (next.state) {
        var norm = STATE_ALIASES[next.state] || next.state;
        if (MASCOT_STATES[norm] && norm !== cur.state) {
          cur.state = norm;
          changed = true;
          stateOrStyleChanged = true;
        }
      }
      if (next.scale != null && Number(next.scale) !== cur.scale) {
        cur.scale = Number(next.scale) || 1;
        changed = true;
      }
      if (next.align && next.align !== cur.align) {
        cur.align = next.align;
        changed = true;
      }
      if (next.offsetX != null && Number(next.offsetX) !== cur.offsetX) {
        cur.offsetX = Number(next.offsetX) || 0;
        changed = true;
      }
      if (next.offsetY != null && Number(next.offsetY) !== cur.offsetY) {
        cur.offsetY = Number(next.offsetY) || 0;
        changed = true;
      }

      if (!changed) {
        syncLayout();
        return;
      }

      if (!cur.enabled) {
        if (stageEl.parentElement) stageEl.parentElement.removeChild(stageEl);
        disconnectResizeObserver();
        stopAnimLoop();
        return;
      }
      if (stateOrStyleChanged) frameIdx = 0;
      applyGeometry();
      syncLayout();
      drawFrame();
      scheduleNextTick();
    }

    function destroy() {
      stopAnimLoop();
      disconnectResizeObserver();
      if (stageEl.parentElement) stageEl.parentElement.removeChild(stageEl);
      currentAnchor = null;
    }

    applyGeometry();

    return {
      element: stageEl,
      mountTo: mountTo,
      update: update,
      syncLayout: syncLayout,
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

  function formatDurationShort(ms) {
    var v = Number(ms || 0);
    if (!Number.isFinite(v) || v <= 0) return '—';
    if (v >= 1000) return (v / 1000).toFixed(1) + 's';
    return Math.round(v) + 'ms';
  }

  function ensureHudStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ag-studio-hud-style')) return;
    var s = document.createElement('style');
    s.id = 'ag-studio-hud-style';
    s.textContent = [
      '.ags-hud-wrap { position:relative; display:inline-flex; align-items:center; justify-content:center; gap:6px; pointer-events:auto; z-index:2147483000; font-family:var(--ags-font-ui, system-ui, sans-serif); font-variant-numeric:tabular-nums; -webkit-app-region:no-drag; app-region:no-drag; }',
      '.ags-hud-floating { position:fixed; right:18px; bottom:16px; }',
      '.ags-hud-inline { margin:2px auto; }',
      '.ags-hud-toolbar { gap:4px; max-width:100%; overflow:visible; }',
      '.ags-ring-btn { position:relative; display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; padding:0; border:none; border-radius:50%; background:transparent; cursor:pointer; flex-shrink:0; transition:transform 140ms ease; }',
      '.ags-ring-btn:hover { transform:scale(1.08); }',
      '.ags-ring-svg { display:block; width:22px; height:22px; transform:rotate(-90deg); }',
      '.ags-ring-num { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:8.5px; font-weight:700; color:var(--ags-text-primary, #f4f4f5); letter-spacing:-0.04em; pointer-events:none; }',
      '.ags-hud-popover { position:fixed; z-index:2147483580; min-width:196px; max-width:250px; padding:9px 11px; border-radius:11px; border:1px solid var(--ags-border, rgba(148,163,184,0.28)); background:var(--ags-bg-surface, #18181b); color:var(--ags-text-primary, #f4f4f5); box-shadow:0 10px 28px rgba(0,0,0,0.26); display:none; flex-direction:column; gap:5px; font-family:var(--ags-font-ui, system-ui, sans-serif); font-size:11.5px; font-variant-numeric:tabular-nums; pointer-events:none; }',
      '.ags-hud-popover[data-open="1"] { display:flex; }',
      '.ags-hud-pop-head { display:flex; align-items:center; justify-content:space-between; gap:8px; padding-bottom:4px; border-bottom:1px solid var(--ags-border, rgba(148,163,184,0.18)); font-weight:600; font-size:11.5px; }',
      '.ags-hud-pop-row { display:flex; align-items:center; justify-content:space-between; gap:12px; }',
      '.ags-hud-pop-lbl { color:var(--ags-text-secondary, #94a3b8); }',
      '.ags-hud-pop-val { color:var(--ags-text-primary, #f4f4f5); font-weight:500; }',
      '.ags-vial-btn { position:relative; display:inline-flex; align-items:center; justify-content:center; width:24px; height:38px; padding:0; border:none; background:transparent; cursor:pointer; flex-shrink:0; transition:transform 140ms ease; }',
      '.ags-hud-toolbar .ags-vial-btn { width:14px; height:22px; }',
      '.ags-vial-btn:hover { transform:translateY(-1px) scale(1.06); }',
      '.ags-vial-cv { display:block; width:24px; height:38px; }',
      '.ags-hud-toolbar .ags-vial-cv { width:14px; height:22px; }',
      '.ags-hud-pill { display:inline-flex; align-items:center; gap:7px; height:26px; padding:0 10px; border-radius:999px; border:1px solid var(--ags-border, rgba(148,163,184,0.22)); background:var(--ags-bg-surface, #18181b); color:var(--ags-text-secondary, #a1a1aa); font-size:11.5px; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.06); transition:border-color 140ms ease, color 140ms ease; white-space:nowrap; }',
      '.ags-hud-toolbar .ags-hud-pill { height:22px; padding:0 8px; gap:5px; font-size:11px; border-color:color-mix(in srgb, var(--ags-text-primary, #f4f4f5) 18%, transparent); background:color-mix(in srgb, var(--ags-text-primary, #f4f4f5) 7%, transparent); color:var(--ags-text-secondary, #cbd5e1); box-shadow:none; }',
      '.ags-hud-pill:hover { border-color:var(--ags-accent, #D97757); color:var(--ags-text-primary, #f4f4f5); }',
      '.ags-hud-sep { opacity:0.32; }',
      '.ags-hud-strong { color:var(--ags-text-primary, #f4f4f5); font-weight:600; }',
      '.ags-hud-quota-low { color:var(--ags-warning, #D9822B); font-weight:600; }',
      '.ags-hud-crit { color:var(--ags-danger, #EF4444); font-weight:600; }',
      '@media (max-width: 720px) { .ags-hud-toolbar .ags-hud-hide-sm { display:none; } }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

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

    // Ring HUD (compact default)
    var ringBtn = document.createElement('button');
    ringBtn.type = 'button';
    ringBtn.className = 'ags-ring-btn';
    var ringArc = null;
    var ringNum = null;

    var R = 8.5;
    var CIRC = Number((2 * Math.PI * R).toFixed(2));
    ringBtn.innerHTML =
      '<svg class="ags-ring-svg" viewBox="0 0 22 22" aria-hidden="true">' +
      '  <circle cx="11" cy="11" r="' + R + '" fill="none" stroke="color-mix(in srgb, var(--ags-text-primary, #f4f4f5) 20%, transparent)" stroke-width="2.4"/>' +
      '  <circle class="ags-ring-arc" cx="11" cy="11" r="' + R + '" fill="none" stroke="var(--ags-accent, #3B82F6)" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="' + CIRC + '" stroke-dashoffset="' + CIRC + '"/>' +
      '</svg>' +
      '<span class="ags-ring-num">0</span>';
    ringArc = ringBtn.querySelector('.ags-ring-arc');
    ringNum = ringBtn.querySelector('.ags-ring-num');

    // Vertical hover card popover
    var popEl = document.createElement('div');
    popEl.className = 'ags-hud-popover';
    popEl.setAttribute('data-ag-studio-ignore', 'true');
    popEl.setAttribute('data-ag-no-i18n', 'true');

    // Capsule / Vial mode (optional in settings)
    var vialBtn = document.createElement('button');
    vialBtn.type = 'button';
    vialBtn.className = 'ags-vial-btn';
    vialBtn.title = '512K 上下文呼吸试管 — 点击打开 Studio';
    var vialCv = document.createElement('canvas');
    vialCv.className = 'ags-vial-cv';
    vialBtn.appendChild(vialCv);

    var pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'ags-hud-pill';

    var hidePopTimer = 0;
    function showPopover() {
      if (hidePopTimer) { clearTimeout(hidePopTimer); hidePopTimer = 0; }
      var root = document.getElementById('ag-studio-root') || document.body;
      if (popEl.parentElement !== root) root.appendChild(popEl);
      popEl.setAttribute('data-open', '1');
      try {
        var r = ringBtn.getBoundingClientRect();
        var pr = popEl.getBoundingClientRect();
        var pw = pr.width || 210;
        var ph = pr.height || 175;
        var left = Math.max(8, Math.min((window.innerWidth || 1200) - pw - 8, r.left + r.width / 2 - pw / 2));
        var top = r.top - ph - 8;
        if (top < 8) top = r.bottom + 8;
        popEl.style.left = Math.round(left) + 'px';
        popEl.style.top = Math.round(top) + 'px';
      } catch (_e) {}
    }

    function hidePopoverDelayed() {
      if (hidePopTimer) clearTimeout(hidePopTimer);
      hidePopTimer = setTimeout(function () {
        hidePopTimer = 0;
        popEl.removeAttribute('data-open');
      }, 100);
    }

    var onOpen = function (ev) {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      if (typeof opts.onToggleDrawer === 'function') opts.onToggleDrawer();
    };
    ringBtn.addEventListener('click', onOpen);
    ringBtn.addEventListener('pointerenter', showPopover);
    ringBtn.addEventListener('pointerleave', hidePopoverDelayed);

    vialBtn.addEventListener('click', function (ev) {
      phys.impulse(1.4);
      wakeVial();
      onOpen(ev);
    });
    vialBtn.addEventListener('pointerenter', function () {
      phys.impulse(0.65);
      wakeVial();
    });
    pill.addEventListener('click', onOpen);

    wrap.appendChild(ringBtn);
    wrap.appendChild(vialBtn);
    wrap.appendChild(pill);

    var phys = createMiniVialPhysics();
    var rafId = 0;
    var lastFrameAt = 0;
    var currentCtx = vialCv.getContext('2d');
    var lastVisualSig = '';
    var lastPillKey = '';
    var lastPopKey = '';
    var isCompactToolbar = false;
    var isDark = true;
    var accentHex = '#3B82F6';
    var isCritical = false;

    function resolveVialColors() {
      var mode = document.documentElement.getAttribute('data-ags-mode');
      isDark = mode !== 'light';
      var themeId = document.documentElement.getAttribute('data-ags-theme') || 'claude';
      if (isCritical) {
        accentHex = '#EA580C';
      } else if (themeId === 'claude') {
        accentHex = isDark ? '#E08666' : '#D97757';
      } else {
        accentHex = isDark ? '#60A5FA' : '#2563EB';
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
      if (!currentCtx || vialBtn.style.display === 'none') return;
      var cssW = isCompactToolbar ? 14 : 24;
      var cssH = isCompactToolbar ? 22 : 38;
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
      var tubeX = isCompactToolbar ? 3 : 5;
      var tubeY = 2;
      var tubeW = isCompactToolbar ? 10 : 14;
      var tubeH = isCompactToolbar ? 20 : 34;
      var tubeR = isCompactToolbar ? 4.5 : 6.5;

      drawRoundedRectPath(ctx, tubeX, tubeY, tubeW, tubeH, tubeR);
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(226, 232, 240, 0.55)';
      ctx.fill();

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
        ctx.restore();
      }

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
      if (vialBtn.style.display === 'none') return;
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
      if (mode !== 'floating' && anchors && composer) {
        if (typeof anchors.ensureComposerToolbarSlot === 'function') {
          var toolbarSlot = anchors.ensureComposerToolbarSlot(composer);
          if (toolbarSlot) {
            isCompactToolbar = true;
            anchors.parkComposerBottomSlot();
            wrap.className = 'ags-hud-wrap ags-hud-toolbar';
            if (wrap.parentElement !== toolbarSlot) {
              toolbarSlot.appendChild(wrap);
            }
            return;
          }
        }
        if (typeof anchors.parkComposerToolbarSlot === 'function') anchors.parkComposerToolbarSlot();
        var bottomSlot = anchors.ensureComposerBottomSlot(composer);
        if (bottomSlot) {
          isCompactToolbar = false;
          wrap.className = 'ags-hud-wrap ags-hud-inline';
          if (wrap.parentElement !== bottomSlot) {
            bottomSlot.appendChild(wrap);
          }
          return;
        }
      }
      if (anchors) {
        if (typeof anchors.parkComposerToolbarSlot === 'function') anchors.parkComposerToolbarSlot();
        anchors.parkComposerBottomSlot();
      }
      isCompactToolbar = false;
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
        popEl.removeAttribute('data-open');
        if (rafId && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        return;
      }

      var displayStyle = hudCfg.displayStyle === 'capsule' ? 'capsule' : 'ring';
      wrap.style.display = 'inline-flex';
      mountToSlot(hudCfg.position || 'composer', composer);

      if (displayStyle === 'ring') {
        ringBtn.style.display = 'inline-flex';
        vialBtn.style.display = 'none';
        pill.style.display = 'none';
      } else {
        ringBtn.style.display = 'none';
        vialBtn.style.display = hudCfg.showVial === false ? 'none' : 'inline-flex';
        pill.style.display = 'inline-flex';
      }

      var ctx = (snapshot && snapshot.context) || {};
      var used = Number(ctx.usedTokens || 0);
      var limit = Number(ctx.contextLimit || 200000);
      var remainingCtx = Math.max(0, limit - used);
      var ratio = ctx.usageRatio != null ? Number(ctx.usageRatio) : (limit > 0 ? used / limit : 0);
      if (!Number.isFinite(ratio) || ratio < 0) ratio = 0;
      ratio = Math.min(1, ratio);
      var pct = Math.min(100, Math.round(ratio * 100));
      var speed = Number((ctx.speed && (ctx.speed.streamingTps || ctx.speed.tokPerSec || ctx.speed.tps)) || 0);
      var speedStr = speed > 0 ? Number(speed).toFixed(1).replace(/\.0$/, '') : '0';
      var ttft = Number((ctx.speed && ctx.speed.ttftMs) || 0);
      var cachePct = Math.round(Number(ctx.cacheHitRate || 0) * 100);
      var cost = Number((snapshot && snapshot.estimatedSessionCostUsd) || 0);
      var turnCost = Number((snapshot && snapshot.estimatedTurnCostUsd) || 0);
      var callCount = Number((snapshot && snapshot.sessionCallCount) || 0);
      var fmtUsd = function (v) { return v >= 1 ? ('$' + v.toFixed(2)) : ('$' + v.toFixed(3)); };
      var generating = Boolean(ctx.speed && ctx.speed.isGenerating);

      var cmq = (snapshot && snapshot.currentModelQuota) || null;
      var pools = (snapshot && snapshot.quota && snapshot.quota.pools) || [];
      var minQuotaPct = cmq && cmq.remainingPercent != null ? Number(cmq.remainingPercent) : null;
      if (minQuotaPct === null) {
        for (var i = 0; i < pools.length; i++) {
          if (typeof pools[i].remainingPercent === 'number') {
            if (minQuotaPct === null || pools[i].remainingPercent < minQuotaPct) {
              minQuotaPct = pools[i].remainingPercent;
            }
          }
        }
      }

      isCritical = ratio >= 0.85;

      // Update Ring SVG
      if (ringArc && ringNum) {
        var offset = Number((CIRC * (1 - ratio)).toFixed(2));
        ringArc.setAttribute('stroke-dashoffset', String(offset));
        ringArc.setAttribute('stroke', isCritical ? 'var(--ags-danger, #EF4444)' : ratio >= 0.68 ? 'var(--ags-warning, #D9822B)' : 'var(--ags-accent, #3B82F6)');
        ringNum.textContent = String(pct);
      }

      // Vertical hover popover content (dirty-checked)
      var estRemShort = (cmq && cmq.estRemainingShort) || '';
      var popKey = [
        ctx.model || '',
        pct, used, limit,
        speedStr,
        cachePct,
        Math.round(ttft),
        cost.toFixed(3),
        turnCost.toFixed(3),
        callCount,
        minQuotaPct == null ? 'n' : Math.round(minQuotaPct),
        estRemShort
      ].join('|');

      if (popKey !== lastPopKey) {
        lastPopKey = popKey;
        var quotaLine = minQuotaPct != null
          ? (Math.round(minQuotaPct) + '%' + (estRemShort ? (' · 约剩 ' + estRemShort) : ''))
          : '—';
        var showTurnCost = turnCost > 0 && callCount > 1 && Math.abs(cost - turnCost) >= 0.001;
        popEl.innerHTML = [
          '<div class="ags-hud-pop-head"><span>' + (ctx.model || '当前会话') + '</span><span>' + pct + '%</span></div>',
          '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">上下文用量</span><span class="ags-hud-pop-val">' + formatCompactNumber(used) + ' / ' + formatCompactNumber(limit) + '</span></div>',
          '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">剩余上下文</span><span class="ags-hud-pop-val">' + formatCompactNumber(remainingCtx) + '</span></div>',
          '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">输出速度</span><span class="ags-hud-pop-val">' + speedStr + ' tok/s</span></div>',
          '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">缓存命中</span><span class="ags-hud-pop-val">' + cachePct + '%</span></div>',
          '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">首字延迟</span><span class="ags-hud-pop-val">' + formatDurationShort(ttft) + '</span></div>',
          '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">对话总费用</span><span class="ags-hud-pop-val">' + fmtUsd(cost) + '</span></div>',
          (showTurnCost ? '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">本轮估算</span><span class="ags-hud-pop-val">' + fmtUsd(turnCost) + '</span></div>' : ''),
          '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">模型额度</span><span class="ags-hud-pop-val">' + quotaLine + '</span></div>'
        ].join('');
      }

      if (displayStyle !== 'ring') {
        phys.setTargetFill(ratio);
        phys.setStreaming(generating);
        var visSig = [
          Math.round(ratio * 100),
          generating ? 1 : 0,
          isCompactToolbar ? 1 : 0,
          document.documentElement.getAttribute('data-ags-theme') || '',
          document.documentElement.getAttribute('data-ags-mode') || ''
        ].join('|');
        if (visSig !== lastVisualSig) {
          lastVisualSig = visSig;
          if (generating) phys.impulse(0.45);
          wakeVial();
        }

        var pillKey = popKey + '|' + (hudCfg.showContext !== false ? 1 : 0) + (hudCfg.showSpeed !== false ? 1 : 0) + (hudCfg.showCost !== false ? 1 : 0) + (hudCfg.showQuotaBadge !== false ? 1 : 0);
        if (pillKey !== lastPillKey) {
          lastPillKey = pillKey;
          var parts = [];
          if (hudCfg.showContext !== false) {
            var pctCls = pct >= 85 ? 'ags-hud-crit' : 'ags-hud-strong';
            parts.push(
              '<span class="' + pctCls + '">' + pct + '%</span>' +
              '<span class="ags-hud-sep">·</span>' +
              '<span>' + formatCompactNumber(used) + '/' + formatCompactNumber(limit) + '</span>'
            );
          }
          if (hudCfg.showSpeed !== false) parts.push('<span>' + speedStr + ' tok/s</span>');
          if (hudCfg.showCost !== false) parts.push('<span class="ags-hud-hide-sm">' + fmtUsd(cost) + '</span>');
          if (hudCfg.showQuotaBadge !== false && minQuotaPct !== null) {
            var qCls = minQuotaPct <= 20 ? 'ags-hud-quota-low' : '';
            parts.push('<span class="' + qCls + '">额度 ' + Math.round(minQuotaPct) + '%</span>');
          }
          if (!parts.length) parts.push('<span class="ags-hud-strong">Studio</span>');
          pill.innerHTML = parts.join('<span class="ags-hud-sep">·</span>');
        }
      }
    }

    function destroy() {
      if (hidePopTimer) clearTimeout(hidePopTimer);
      if (rafId && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (popEl.parentElement) popEl.parentElement.removeChild(popEl);
      if (wrap.parentElement) wrap.parentElement.removeChild(wrap);
    }

    return {
      element: wrap,
      mountToSlot: mountToSlot,
      update: update,
      destroy: destroy
    };
  }

  var api = {
    formatCompactNumber: formatCompactNumber,
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
      '.ags-home-card { position:relative; border-radius:14px; border:1px solid color-mix(in srgb, var(--ags-border, rgba(148,163,184,.25)) 48%, transparent); background:color-mix(in srgb, var(--ags-text-primary, #111) 2.8%, transparent); color:var(--ags-text-primary, #f4f4f5); padding:13px 15px; display:flex; flex-direction:column; gap:11px; font-family:var(--ags-font-ui, system-ui, sans-serif); font-variant-numeric:tabular-nums; box-shadow:none; }',
      '.ags-home-head { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }',
      '.ags-home-seg { display:inline-flex; padding:2px; border-radius:8px; background:transparent; border:none; gap:3px; }',
      '.ags-home-seg-btn { border:none; background:transparent; color:var(--ags-text-secondary, #94a3b8); font-size:12px; font-weight:500; padding:3px 9px; border-radius:7px; cursor:pointer; transition:color 120ms ease, background-color 120ms ease; }',
      '.ags-home-seg-btn:hover { color:var(--ags-text-primary, #f4f4f5); }',
      '.ags-home-seg-btn.active { background:color-mix(in srgb, var(--ags-text-primary, #111) 7%, transparent); color:var(--ags-text-primary, #f4f4f5); font-weight:600; }',
      '.ags-home-kpis { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:7px; }',
      '.ags-home-kpi { padding:8px 11px; border-radius:9px; border:none; background:color-mix(in srgb, var(--ags-text-primary, #111) 4%, transparent); display:flex; flex-direction:column; gap:2px; min-width:0; }',
      '.ags-home-kpi-lbl { font-size:11px; color:var(--ags-text-secondary, #94a3b8); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
      '.ags-home-kpi-val { font-size:15.5px; font-weight:600; color:var(--ags-text-primary, #f4f4f5); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
      '.ags-home-heat-wrap { position:relative; display:flex; align-items:stretch; gap:6px; padding:2px 0; }',
      '.ags-home-heat-days { display:grid; grid-template-rows:repeat(7, 1fr); gap:3px; font-size:9.5px; color:var(--ags-text-secondary, #94a3b8); align-items:center; padding-right:2px; flex-shrink:0; }',
      '.ags-home-heat-grid { display:grid; grid-template-rows:repeat(7, minmax(10px, 13px)); grid-auto-flow:column; gap:3px; flex:1; }',
      '.ags-home-heat-cell { width:100%; height:100%; min-width:9px; min-height:10px; border-radius:2.5px; background:color-mix(in srgb, var(--ags-text-primary, #111) 7%, transparent); cursor:default; }',
      '.ags-home-heat-cell:hover { outline:1px solid var(--ags-accent, #D97757); }',
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

    var weeks = (daysRange === 1 || daysRange === 7) ? 2 : daysRange === 30 ? 8 : 26;
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
      days: 0,         // 0 (all) | 30 | 7
      bookSeed: Math.random(),
      data: null,
      loading: false,
      lastRenderSig: ''
    };

    // Single delegated listener on card instead of 182 per-cell listeners
    card.addEventListener('click', function (ev) {
      var tabBtn = ev.target && ev.target.closest && ev.target.closest('[data-home-tab]');
      if (tabBtn) {
        state.tab = tabBtn.getAttribute('data-home-tab');
        state.lastRenderSig = '';
        render();
        return;
      }
      var dayBtn = ev.target && ev.target.closest && ev.target.closest('[data-home-days]');
      if (dayBtn) {
        state.days = Number(dayBtn.getAttribute('data-home-days'));
        state.lastRenderSig = '';
        if (typeof opts.onRangeChange === 'function') opts.onRangeChange(state.days);
        render();
      }
    });
    card.addEventListener('pointerover', function (ev) {
      var cell = ev.target && ev.target.closest && ev.target.closest('.ags-home-heat-cell[data-tip]');
      if (cell) showTip(cell, ev);
    }, { passive: true });
    card.addEventListener('pointerout', function (ev) {
      var cell = ev.target && ev.target.closest && ev.target.closest('.ags-home-heat-cell[data-tip]');
      if (cell) hideTip();
    }, { passive: true });

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
            overview: 'Overview', models: 'Models', all: 'All', d30: '30d', d7: '7d', today: 'Today',
            sessions: 'Sessions', calls: 'Messages', total: 'Total Tokens',
            days: 'Active Days', peak: 'Peak Hour', topModel: 'Top Model',
            weekdays: ['M', '', 'W', '', 'F', '', 'S'],
            noModels: 'No model usage data yet',
            split: 'Desktop vs CLI'
          }
        : isTw
          ? {
              overview: '概覽', models: '模型', all: '全部', d30: '30 天', d7: '7 天', today: '今天',
              sessions: '會話數', calls: '訊息數', total: 'Token 總量',
              days: '活躍天數', peak: '高峰時段', topModel: '最常用模型',
              weekdays: ['一', '', '三', '', '五', '', '日'],
              noModels: '暫無模型用量資料',
              split: '桌面端 vs CLI 佔比'
            }
          : {
              overview: '概览', models: '模型', all: '全部', d30: '30 天', d7: '7 天', today: '今天',
              sessions: '会话数', calls: '消息数', total: 'Token 总量',
              days: '活跃天数', peak: '高峰时段', topModel: '最常用模型',
              weekdays: ['一', '', '三', '', '五', '', '日'],
              noModels: '暂无模型用量数据',
              split: '桌面端 vs CLI 占比'
            };

      var d = state.data || {};
      var sig = [
        lang,
        state.tab,
        state.days,
        d.sessions || 0,
        d.calls || d.messages || 0,
        d.totalTokens || 0,
        d.activeDays || 0,
        d.topModel || '',
        d.updatedAt || ''
      ].join('|');
      if (sig === state.lastRenderSig && card.firstChild) return;
      state.lastRenderSig = sig;
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
        '    <button type="button" class="ags-home-seg-btn ' + (state.days === 1 ? 'active' : '') + '" data-home-days="1">' + esc(labels.today) + '</button>',
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
        var colsCount = Math.max(1, Math.round(cells.length / 7));
        var dayAxis = labels.weekdays.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('');
        var gridCells = cells.map(function (c) {
          var tip = c.future ? '' : (c.date + ' · ' + fmtCompact(c.total) + ' tokens');
          return '<span class="ags-home-heat-cell" data-lvl="' + c.level + '" ' +
            (tip ? ('data-tip="' + esc(tip) + '"') : 'style="opacity:0.22"') + '></span>';
        }).join('');

        bodyHtml = [
          '<div class="ags-home-kpis">' + kpiHtml + '</div>',
          '<div class="ags-home-heat-wrap">',
          '  <div class="ags-home-heat-days">' + dayAxis + '</div>',
          '  <div class="ags-home-heat-grid" style="grid-template-columns:repeat(' + colsCount + ', minmax(0, 1fr))">' + gridCells + '</div>',
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
      '@keyframes ags-ink-in { from { opacity:0.22; } to { opacity:1; } }',
      '.ags-ink-chunk { animation: ags-ink-in 220ms cubic-bezier(.22,1,.36,1) both; }',
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
      if (!active || (!active.isContentEditable && active.getAttribute && active.getAttribute('contenteditable') !== 'true')) {
        hideCaret();
        return;
      }
      if (!active.closest || active.closest('#ag-studio-root, [data-ag-studio-ignore], .monaco-editor')) {
        hideCaret();
        return;
      }
      var inComposer = active.closest('[data-testid="agent-input-box"], .surface-composer-card');
      if (!inComposer) {
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


;(function(){try{globalThis.__agCodexEffortSliderDisableAutoBoot=true;if(typeof window!=='undefined')window.__agCodexEffortSliderDisableAutoBoot=true;}catch(_e){}})();
"use strict";
/**
* Antigravity Codex 风格推理等级滑条 (antigravity-codex-effort-slider)
*/
(function (root, factory) {
try {
var exportsObj = factory(root);
if (typeof module === "object" && module && typeof module.exports === "object") {
module.exports = exportsObj;
}
if (root && typeof root === "object") {
root.AntigravityCodexEffortSlider = exportsObj;
}
} catch (err) {
// Factory error handled silently
}
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this, function (globalRoot) {
// ── 常量与默认几何参数 ──────────────────────────────────────────────────────
var STYLE_ELEMENT_ID = "ag-codex-effort-slider-styles";
var KNOB_RADIUS = 14;
var ENERGY_START = 0;
var ENERGY_END = 0.5;
// Antigravity 官方推理档位枚举与展示名映射（对应 main.js 中的 DXb / EXb / GXb）
var AG_EFFORT_ORDER = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
var AG_EFFORT_LABELS = {
off: "Off",
minimal: "Minimal",
low: "Low",
medium: "Medium",
high: "High",
xhigh: "Extra",
max: "Max"
};
var AG_MODEL_LABEL_RE = /^(.*?)\s*\((off|minimal|low|medium|high|xhigh|extra|max)(?:\s+thinking)?\)\s*$/i;
var _EFF_ALIAS = Object.create(null);
"xhigh:xhigh|extra|extra high|超高|极高|極高|特高|很高;high:high|高;medium:medium|med|中|中等;low:low|低;minimal:minimal|极低|極低|最小|最低|极简|極簡;max:max|最高|最大|极限|極限;off:off|关闭|關閉|关|關|不推理|无|無|none|disabled;auto:auto|自动|自動;adaptive:adaptive|自适应|自適應;thinking:thinking|深度思考|思考中|思考;fixed:fixed|固定".split(";").forEach(function (g) {
var p = g.split(":"), k = p[0], vs = p[1].split("|");
for (var i = 0; i < vs.length; i += 1) _EFF_ALIAS[vs[i]] = k;
});
function _normEffTxt(raw) {
var s = String(raw || "").trim().replace(/^[(\uff08]+|[)\uff09]+$/g, "").trim().replace(/\s+thinking$/i, "").toLowerCase();
return _EFF_ALIAS[s] || _EFF_ALIAS[s.replace(/(.+?)(?:思考|推理|强度|強度)$/, "$1")] || "";
}
function _sameEffTxt(a, b) {
if (a === b) return true;
var ka = _normEffTxt(a), kb = _normEffTxt(b);
return ka && kb ? ka === kb : Boolean(a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase());
}
var _NO_TR_A = { "data-ag-i18n-skip": "1", "data-ag-no-tr": "1", "data-no-translate": "1", "data-translate": "no", translate: "no", "data-ag-localization-skip": "true", "data-agy-no-translate": "true", "data-antigravity-zh-skip": "1" };
function markNoTranslate(el) {
if (!el) return el;
var hc = el.classList && el.classList.contains ? el.classList.contains("notranslate") : (typeof el.className === "string" && /(?:^|\s)notranslate(?:\s|$)/.test(el.className));
if (hc && el.getAttribute && el.getAttribute("data-ag-i18n-skip") === "1" && el.getAttribute("data-antigravity-zh-skip") === "1") return el;
if (el.setAttribute) {
for (var k in _NO_TR_A) if (!el.getAttribute || el.getAttribute(k) !== _NO_TR_A[k]) el.setAttribute(k, _NO_TR_A[k]);
}
if (!hc) {
if (el.classList && el.classList.add) el.classList.add("notranslate");
else if (typeof el.className === "string") el.className += (el.className ? " " : "") + "notranslate";
}
return el;
}
var CLAUDE_CELL = 28 / 6;
var CLAUDE_SWEEP_MS = 1600;
function isClaudeModel(name) {
if (!name || typeof name !== "string") return false;
return /claude/i.test(name);
}
// ── 连续物理运动参数 ────────────────────────────────────────────────────────
// full: 完整星云阻尼变速动画；fast: 快速 ~70ms 跟手吸附（默认）；quick: 0 动画直接跳格
var _F = Object.freeze;
var MOTION = _F({ maxSpeed: 3.2, accel: 28, decel: 18, snapEps: 0.0015, velEps: 0.01 });
var MOTION_REDUCED = _F({ maxSpeed: 1e6, accel: 1e9, decel: 1e9, snapEps: 1e-4, velEps: 1e6 });
var MOTION_FAST = _F({ maxSpeed: 18, accel: 260, decel: 180, snapEps: 0.002, velEps: 0.04 });
var _REL_PRJ = 0.09, _PS_EMA = 0.45, _PS_STL = 0.05, _PS_TAU = 0.035;
var SETTINGS_KEY = "ag.codexEffortSlider.settings.v1";
var LEGACY_SETTINGS_KEY = "dsh.codexEffortSlider.settings.v1";
var SETTINGS_EVENT = "ag:codex-effort-slider:settings";
var SETTINGS_VERSION = 1;
var SETTINGS_SCHEMA = _F([
_F({ key: "motion", label: "动画效果", labelEn: "Animation", defaultValue: "fast", options: _F([
_F({ value: "fast", label: "快速动画", labelEn: "Fast", hint: "拨过 1/3 即切档 · ~70ms 快速吸附", hintEn: "Snaps after 1/3 travel (~70ms)" }),
_F({ value: "quick", label: "简洁动画", labelEn: "Instant", hint: "无过渡 · 直接跳档", hintEn: "No transition, immediate jump" }),
_F({ value: "full", label: "完整动画", labelEn: "Full", hint: "匀变速追赶 + 星尘渐亮", hintEn: "Smooth physics catch-up + starfield" })
]) }),
_F({ key: "ticks", label: "已到达档位的刻度点", labelEn: "Reached Tick Marks", defaultValue: "highlight", options: _F([
_F({ value: "highlight", label: "亮白显示", labelEn: "Bright", hint: "默认 · 已滑过档位高亮", hintEn: "Default: highlight reached ticks" }),
_F({ value: "dim", label: "与未到达同色", labelEn: "Muted", hint: "所有刻度点保持柔和半透明", hintEn: "Keep all ticks softly muted" }),
_F({ value: "hidden", label: "隐藏", labelEn: "Hidden", hint: "不显示任何刻度点", hintEn: "Hide all tick marks" })
]) })
]);
function schemaDefaults() {
var out = { v: SETTINGS_VERSION };
for (var i = 0; i < SETTINGS_SCHEMA.length; i += 1) out[SETTINGS_SCHEMA[i].key] = SETTINGS_SCHEMA[i].defaultValue;
return out;
}
function normalizeSettings(raw) {
var base = schemaDefaults();
if (!raw || typeof raw !== "object") return base;
for (var i = 0; i < SETTINGS_SCHEMA.length; i += 1) {
var it = SETTINGS_SCHEMA[i], c = raw[it.key];
for (var j = 0; j < it.options.length; j += 1) if (it.options[j].value === c) { base[it.key] = c; break; }
}
if (!raw.motion && raw.reducedMotion === true) base.motion = "quick";
return base;
}
function _win(w) { return w || (typeof window !== "undefined" ? window : globalRoot); }
function resolveStorage(win) { try { var w = _win(win); return w && w.localStorage || null; } catch (e) { return null; } }
var _cfgCache = null, _cfgStorage = null;
function _invCfg() { _cfgCache = _cfgStorage = null; }
function readSettings(win) {
var s = resolveStorage(win);
if (!s) return schemaDefaults();
if (_cfgCache && _cfgStorage === s) return _cfgCache;
try { var t = s.getItem(SETTINGS_KEY) || s.getItem(LEGACY_SETTINGS_KEY); _cfgStorage = s; return (_cfgCache = t ? normalizeSettings(JSON.parse(t)) : schemaDefaults()); }
catch (e) { return schemaDefaults(); }
}
function writeSettings(patch, win) {
var w = _win(win), next = normalizeSettings(Object.assign({}, readSettings(w), patch || {})), s = resolveStorage(w);
if (s) { try { s.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch (e) {} }
_cfgCache = s ? next : null; _cfgStorage = s;
try { if (w && w.dispatchEvent && w.CustomEvent) w.dispatchEvent(new w.CustomEvent(SETTINGS_EVENT, { detail: next })); } catch (e) {}
return next;
}
function resetSettings(win) { return writeSettings(schemaDefaults(), win); }
function onSettingsChange(fn, win) {
var w = _win(win);
if (!w || typeof w.addEventListener !== "function") return function () {};
var hC = function (ev) { _invCfg(); fn(ev && ev.detail ? normalizeSettings(ev.detail) : readSettings(w)); };
var hS = function (ev) { if (ev && (ev.key === SETTINGS_KEY || ev.key === LEGACY_SETTINGS_KEY)) { _invCfg(); fn(readSettings(w)); } };
w.addEventListener(SETTINGS_EVENT, hC); w.addEventListener("storage", hS);
return function () { w.removeEventListener(SETTINGS_EVENT, hC); w.removeEventListener("storage", hS); };
}
function prefersReducedMotion(win) {
try { var w = _win(win); return Boolean(w && w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; }
}
function getPrismRootAttr(doc, win, attr) {
try { var d = doc || (win && win.document) || (typeof document !== "undefined" ? document : null), r = d && d.documentElement; return (r && r.getAttribute && r.getAttribute(attr)) || ""; } catch (e) { return ""; }
}
function isPrismMotionOff(doc, win) { return getPrismRootAttr(doc, win, "data-ag-cs-motion") === "off" || prefersReducedMotion(win); }
function resolvePrismAccentTone(doc, win) { var ac = getPrismRootAttr(doc, win, "data-ag-cs-accent"); return ac === "mono" || ac === "amber" || ac === "iris" || ac === "cobalt" ? ac : "follow"; }
function motionMode(win, explicitSettings, doc) { return isPrismMotionOff(doc, win) ? "quick" : (explicitSettings ? normalizeSettings(explicitSettings) : readSettings(win)).motion || "fast"; }
function motionParamsForMode(mode) { return mode === "quick" ? MOTION_REDUCED : mode === "full" ? MOTION : MOTION_FAST; }
// ── 诊断环形缓冲区 ──────────────────────────────────────────────────────────
var _tr = [];
function tracePush(type, detail) {
var e = Object.assign({ t: Date.now(), type: String(type || "event") }, detail && typeof detail === "object" ? detail : null);
_tr.push(e);
if (_tr.length > 200) _tr.splice(0, _tr.length - 200);
}
function dumpTrace(win) {
var w = _win(win);
return { plugin: "antigravity-codex-effort-slider@1.2.1", time: new Date().toISOString(), ua: w && w.navigator ? w.navigator.userAgent : "node", settings: readSettings(w), events: _tr.slice() };
}
function clamp01(v) { var n = Number(v); return !Number.isFinite(n) || n <= 0 ? 0 : n >= 1 ? 1 : n; }
function clampAbs(v, l) { var m = Math.max(0, Number(l) || 0), n = Number(v) || 0; return n > m ? m : n < -m ? -m : n; }
function pctFromIndex(i, c) { var n = Number(c) || 0; return n <= 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round(Number(i) || 0))) / (n - 1); }
function indexFromPct(p, c) { var n = Number(c) || 0; return n <= 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round(clamp01(p) * (n - 1)))); }
// 迟滞棘轮分档器（推进 1/3 切档，回退 2/3 防抖）
function detentTargetIndex(currentIndex, ptrPct, count) {
var n = Number(count) || 0, p = clamp01(ptrPct);
if (n <= 1) return 0;
if (typeof currentIndex !== "number" || currentIndex < 0 || currentIndex >= n) return indexFromPct(p, n);
var step = 1 / (n - 1), idx = currentIndex;
if (p >= idx * step) { while (idx < n - 1 && p >= (idx + 1 / 3) * step - 1e-9) idx += 1; }
else { while (idx > 0 && p <= (idx - 1 / 3) * step + 1e-9) idx -= 1; }
return idx;
}
function knobOffsetOf(pct, radiusPx) {
var p = clamp01(pct);
var r = typeof radiusPx === "number" && Number.isFinite(radiusPx) ? radiusPx : KNOB_RADIUS;
return "calc(" + r + "px + (100% - " + (r * 2) + "px) * " + p + ")";
}
function motionSettled(state, params) {
if (!state) return true;
var cfg = params || MOTION;
var dist = Math.abs((Number(state.target) || 0) - (Number(state.x) || 0));
var vel = Math.abs(Number(state.v) || 0);
return dist <= cfg.snapEps && vel <= cfg.velEps;
}
/**
* 连续物理步进器：基于刹车距离 v^2 / (2 * decel) 平滑追赶 target，无过冲回弹
*/
function motionStep(state, dtSeconds, params) {
if (!state) return;
var cfg = params || MOTION, dt = Number(dtSeconds);
if (!Number.isFinite(dt) || dt <= 0) return;
if (dt > 0.05) dt = 0.05;
var target = clamp01(state.target), x = clamp01(state.x), v = Number(state.v) || 0, diff = target - x, dist = Math.abs(diff);
if (dist <= cfg.snapEps && Math.abs(v) <= cfg.velEps) { state.x = target; state.v = state.a = 0; return; }
var dir = diff >= 0 ? 1 : -1;
var a = (v * dir >= 0 && (v * v) / (2 * cfg.decel) >= dist) ? -dir * cfg.decel : dir * cfg.accel;
var nextV = clampAbs(v + a * dt, cfg.maxSpeed), nextX = x + nextV * dt;
if ((target - x) * (target - nextX) <= 0 && Math.abs(nextV) <= cfg.maxSpeed) { state.x = target; state.v = state.a = 0; return; }
state.a = a;
state.x = nextX <= 0 ? (state.v = Math.max(0, nextV), 0) : nextX >= 1 ? (state.v = Math.min(0, nextV), 1) : (state.v = nextV, nextX);
}
function decayPointerSpeed(rawSpeed, idleSeconds) {
var v = Number(rawSpeed) || 0;
var idle = Number(idleSeconds) || 0;
if (idle <= _PS_STL) return v;
var decay = Math.exp(-(idle - _PS_STL) / _PS_TAU);
var out = v * decay;
return Math.abs(out) < 1e-4 ? 0 : out;
}
function releaseIndexFor(ptrPct, rawSpeed, idleSeconds, count) {
var v = decayPointerSpeed(rawSpeed, idleSeconds);
var projected = clamp01((Number(ptrPct) || 0) + v * _REL_PRJ);
return indexFromPct(projected, count);
}
// ── 22 颗黄金分割确定性星尘与色彩引擎（对齐 dsh-codex-effort-slider 右向左横穿星空） ──
var PARTICLE_COUNT = 22;
var _SF_MEAN = 1.5;
var _SF_SPR = 0.08;
var STARFIELD_MIN = 0.5;
var GOLDEN_RATIO = 0.6180339887498949;
var MAX_SPEED_FACTOR = 2;
var _RM_SLOW = 2.6;
/** 确定性伪随机 [0,1)：不用 Math.random，每次渲染完全一致且可离线断言 */
function starHash01(index, salt) {
var value = ((index + 1) * (salt || 1) * 2654435761) % 4294967296;
return ((value >>> 8) % 1000) / 1000;
}
// 22 颗黄金比确定性星尘粒子（右向左横穿）
var PARTICLES = (function () {
var count = PARTICLE_COUNT, out = [], byPhase = [], i;
for (i = 0; i < count; i += 1) {
var b = STARFIELD_MIN + (1 - STARFIELD_MIN) * starHash01(i, 61);
out.push({ id: i, y: 0, phase: ((i + 1) * GOLDEN_RATIO) % 1, threshold: i / count, brightness: Math.round(b * 1000) / 1000 });
byPhase.push(i);
}
byPhase.sort(function (a, b) { return out[a].phase - out[b].phase; });
var slots = [10, 21, 1, 8, 19, 6, 17, 4, 15, 2, 13, 20, 0, 11, 18, 9, 16, 7, 14, 5, 12, 3];
for (var r = 0; r < count; r += 1) out[byPhase[r]].y = Math.round((8 + (slots[r] / (count - 1)) * 84) * 100) / 100;
for (i = 0; i < count; i += 1) _F(out[i]);
return _F(out);
})();
function isOffLevel(text) {
if (text === null || text === undefined) return false;
if (typeof text === "object") return isOffLevel(text.id || text.name || text.effort || text.label || "");
return /^(?:off|none|disabled|0|关闭|关|不推理|无)$/.test(String(text).trim().toLowerCase());
}
/* ── Claude Ultracode 像素点阵抖动引擎 ──────────────────────────────── */
function hash01(a, b, c) {
var h = (a | 0) * 374761393 + (b | 0) * 668265263 + (c | 0) * 1274126177;
h = (h ^ (h >>> 13)) * 1274126177;
h = h ^ (h >>> 16);
return ((h >>> 0) % 100000) / 100000;
}
function ditherAlphaAt(x, w, col, row) {
var t = clamp01(x / Math.max(1, w));
var ramp = 0.92 + 0.08 * t;
var jitter = 0.25 + 0.75 * hash01(col, row, 7);
return clamp01(ramp * jitter);
}
var _DRW = [];
for (var _r = 0; _r < 6; _r += 1) {
var _w1 = 3 + ((hash01(0, _r, 47) * 5) | 0), _s1 = (5 + 10 * hash01(0, _r, 43)) / 6.2831853, _w2 = 2 + ((hash01(0, _r, 61) * 4) | 0);
_DRW.push([_w1, _s1, hash01(0, _r, 53), _w2, _s1 * (_w2 / _w1), hash01(0, _r, 71)]);
}
var _ditherLightLut = null;
function _getLightLut() {
if (_ditherLightLut) return _ditherLightLut;
var lut = [], cl = function (v, a, b) { return v < a ? a : v > b ? b : (v + 0.5) | 0; };
for (var i = 0; i < 256; i += 1) {
var tv = (i >> 5) / 7, ov = -40 + (((i >> 2) & 7) / 7) * 96, pv = (i & 3) / 3;
lut.push("rgb(" + cl(187 - 32 * tv + ov + 12 * pv, 124, 240) + "," + cl(184 - 46 * tv + (ov < 0 ? ov : ov * 1.05) + 12 * pv, 100, 232) + "," + cl(206 + 4 * tv + (ov < 0 ? ov : ov * 0.65) + 8 * pv, 180, 252) + ")");
}
return (_ditherLightLut = lut);
}
function valueNoise(col, row, timeSec, speed, seed) {
var tt = timeSec * speed + hash01(col, row, seed) * 17;
var step = Math.floor(tt);
var f = tt - step;
var e = f * f * (3 - 2 * f);
var a = hash01(col, row, (step % 997) + seed * 11);
var b = hash01(col, row, ((step + 1) % 997) + seed * 11);
return a + (b - a) * e;
}
var mergeCache = null;
var mergeCacheKey = "";
function getMergeMap(cols, rows) {
var key = cols + "x" + rows;
if (mergeCache && mergeCacheKey === key) return mergeCache;
var map = new Uint8Array(cols * rows);
for (var r = 0; r < rows; r += 1) {
for (var c = 0; c < cols; c += 1) {
var i = r * cols + c;
if (map[i]) continue;
var h = hash01(c, r, 91);
if (h < 0.02 && c + 1 < cols && r + 1 < rows && !map[i + 1] && !map[i + cols] && !map[i + cols + 1]) {
map[i] = 1; map[i + 1] = 2; map[i + cols] = 2; map[i + cols + 1] = 2;
} else if (h < 0.06 && c + 1 < cols && !map[i + 1]) {
map[i] = 3; map[i + 1] = 2;
} else if (h < 0.08 && r + 1 < rows && !map[i + cols]) {
map[i] = 4; map[i + cols] = 2;
}
}
}
mergeCache = map;
mergeCacheKey = key;
return map;
}
function surfaceIsDark(win, doc) {
try {
var d = doc || (typeof document !== "undefined" ? document : null), w = win || (typeof window !== "undefined" ? window : globalRoot), r = d && d.documentElement;
if (!d || !d.body || !w) return true;
var pt = r && r.getAttribute ? (r.getAttribute("data-ag-cs-theme") || r.getAttribute("data-ags-mode")) : "";
if (pt === "dark" || pt === "light") return pt === "dark";
if ((r && r.classList.contains("dark")) || d.body.classList.contains("dark")) return true;
var ps = ((w.getComputedStyle && w.getComputedStyle(d.body).backgroundColor) || "").match(/[\d.]+/g);
return !ps || ps.length < 3 || (ps.length > 3 && +ps[3] < 0.5) || (0.2126 * ps[0] + 0.7152 * ps[1] + 0.0722 * ps[2]) / 255 < 0.5;
} catch (e) { return true; }
}
// Claude 点阵绘制（intensity ∈ [0,1] 连续控制底晕/密度/亮度）
var _ditherWashCache = typeof WeakMap === "function" ? new WeakMap() : null;
function paintDither(ctx, w, h, dark, progress, timeSec, intensity) {
if (!ctx) return;
var _mx = Math.max, _mn = Math.min, _pw = Math.pow;
var strength = typeof intensity === "number" ? clamp01(intensity) : 1;
ctx.clearRect(0, 0, w, h);
if (strength <= 0 || w <= 0) return;
var keepRatio = strength >= 1 ? 1 : 0.25 + 0.75 * strength, alphaMul = 0.45 + 0.55 * strength;
var wash = null, wKey = progress >= 1 ? w + "|" + (dark ? 1 : 0) : "";
if (wKey && _ditherWashCache) {
var _wc = _ditherWashCache.get(ctx);
if (_wc && _wc.k === wKey) wash = _wc.g;
}
if (!wash) {
var k = 1 - progress, s1 = _mx(0, _mn(1, k - 0.08)), s2 = _mx(s1, _mn(1, k + 0.18));
wash = ctx.createLinearGradient(0, 0, w, 0);
var stops = dark
? [[0, "rgba(112,78,162,0)"], [s1, "rgba(112,78,162,0)"], [s2, "rgba(118,84,169,0.3)"], [1, "rgba(116,84,170,0.75)"]]
: [[0, "rgba(142,118,192,0)"], [s1, "rgba(142,118,192,0)"], [s2, "rgba(142,118,192,0.45)"], [1, "rgba(142,118,192,1)"]];
for (var si = 0; si < 4; si += 1) wash.addColorStop(stops[si][0], stops[si][1]);
if (wKey && _ditherWashCache) _ditherWashCache.set(ctx, { k: wKey, g: wash });
}
ctx.globalAlpha = strength;
ctx.fillStyle = wash;
ctx.fillRect(0, 0, w, h);
var purple = dark ? "rgb(208,192,246)" : "rgb(150,130,205)";
var cell = h / 6 > 0 ? h / 6 : CLAUDE_CELL, cols = Math.ceil(w / cell), rows = 6, front = 1 - progress;
var lmap = !dark ? getMergeMap(cols, rows) : null;
var lightLut = !dark ? _getLightLut() : null;
var size = cell * 0.72;
for (var col = 0; col < cols; col += 1) {
var x = col * cell, t = clamp01(x / _mx(1, w)), fade = clamp01((t - 0.02) / 0.48);
for (var row = 0; row < rows; row += 1) {
if (keepRatio < 1 && hash01(col, row, 101) > keepRatio) continue;
var base = ditherAlphaAt(x, w, col, row) * alphaMul;
if (base < 0.05) continue;
var edgeJit = (hash01(col, row, 31) - 0.5) * 0.05;
if (t < front + edgeJit) continue;
var appear = (0.35 + 0.65 * clamp01((t - front - edgeJit) / 0.04)) * (dark ? 1 : alphaMul);
var rw = _DRW[row];
var u1 = (t * rw[0] + timeSec * rw[1] + rw[2]) % 1;
if (u1 < 0) u1 += 1;
var u2 = (t * rw[3] + timeSec * rw[4] + rw[5]) % 1;
if (u2 < 0) u2 += 1;
var p1 = _pw(1 - u1, 2.6 + 3.4 * hash01(col, row, 17)), p2 = _pw(1 - u2, 3.4);
var pulse = _mx(p1, p2 * (0.55 + 0.45 * hash01(col, row, 19))) * 0.85;
var wAmt = clamp01(pulse * (0.35 + 0.65 * t)) * (0.55 + 0.45 * hash01(col, row, 71));
if (progress < 0.999) wAmt = _mx(wAmt, clamp01(1 - (t - front) / 0.16) * (0.55 + 0.45 * hash01(col, row, 73)));
if (!dark) {
var lt = clamp01((t - 0.05) / 0.2);
if (lt <= 0) continue;
var mv = lmap[row * cols + col];
if (mv === 2 || hash01(col, row, 95) < 0.03) continue;
var y2 = row * cell, off = (hash01(col, row, 93) - 0.42) * (22 + 66 * t);
if (off > 0) off *= 1.1;
var lw = cell * (mv === 3 || mv === 1 ? 2 : 1) * 0.88, lh = cell * (mv === 4 || mv === 1 ? 2 : 1) * 0.88;
var flicker = valueNoise(col, row, timeSec, 0.9, 83), density = clamp01((t - 0.12) / 0.35);
var presence = density > 0.9 ? 1 : clamp01((0.2 + 0.8 * density - flicker) / 0.2);
if (presence <= 0.01) continue;
var lAlpha = clamp01(lt * appear * presence * (0.7 + 0.3 * (1 - flicker)) * (0.85 + 0.15 * hash01(col, row, 29)));
ctx.globalAlpha = lAlpha;
ctx.fillStyle = lightLut[(_mn(7, (t * 7.99) | 0) << 5) | (_mx(0, _mn(7, (((off + 40) / 96) * 7.99) | 0)) << 2) | _mn(3, (pulse * 3.99) | 0)];
ctx.fillRect(x + 0.5, y2 + 0.5, lw, lh);
if (wAmt > 0.03) {
ctx.globalAlpha = _mn(1, (lAlpha / alphaMul) * (0.12 + 0.88 * wAmt));
ctx.fillStyle = "rgb(247,243,255)";
var ins = lw * 0.14;
ctx.fillRect(x + 0.5 + ins, y2 + 0.5 + ins, lw - ins * 2, lh - ins * 2);
}
continue;
}
var flick = valueNoise(col, row, timeSec, 1.5, 5), gap = 0.6 + 0.4 * clamp01((flick - (1 - fade) * 0.5) / 0.3);
var vis = clamp01((t - 0.2) / 0.18), baseAlpha = 0.04 + 0.96 * vis + 0.06 * clamp01((flick - 0.5) / 0.5) * (1 - vis);
var gridAlpha = clamp01(base * baseAlpha * gap * appear * 1.15 * (0.9 + 0.1 * hash01(col, row, 29)));
if (gridAlpha < 0.008) continue;
var y = row * cell;
ctx.globalAlpha = _mn(1, gridAlpha * 0.55);
ctx.fillStyle = purple;
ctx.fillRect(x + 0.5, y + 0.5, size, size);
if (wAmt > 0.03) {
ctx.globalAlpha = _mn(1, (gridAlpha / alphaMul) * (0.1 + 0.72 * wAmt));
ctx.fillStyle = "rgb(220, 204, 255)";
ctx.fillRect(x + 0.5, y + 0.5, size, size);
}
}
}
ctx.globalAlpha = 1;
}
function energyStopsFor(levels) {
var list = Array.isArray(levels) ? levels : [];
var n = list.length;
if (n <= 1) return { start: 0, end: 0.5, hasOffFirst: false };
var first = list[0];
var firstLabel = first && typeof first === "object" ? (first.effort || first.label || first.id || "") : String(first || "");
var hasOffFirst = isOffLevel(firstLabel);
var start = hasOffFirst ? 1 / (n - 1) : 0;
var end = (start + 1) / 2;
return { start: start, end: end, hasOffFirst: hasOffFirst };
}
function energyForPct(pct, startOverride) {
var p = clamp01(pct);
var start = typeof startOverride === "number" && Number.isFinite(startOverride) ? clamp01(startOverride) : ENERGY_START;
if (p <= start || start >= 1) return 0;
return clamp01((p - start) / (1 - start));
}
function speedFor(pct, startOverride) {
var e = energyForPct(pct, startOverride);
return Math.min(MAX_SPEED_FACTOR, Math.max(0.35, 2 * e));
}
function claudeIntensityFor(pct, startOverride) {
var e = energyForPct(pct, startOverride);
if (e <= 0) return 0;
return Math.round(Math.pow(e, 1.5) * 1000) / 1000;
}
function claudeSpeedFor(pct, startOverride) {
return speedFor(pct, startOverride) / MAX_SPEED_FACTOR;
}
function starDurationFor(starOrIndex, speedFactor) {
var idx = typeof starOrIndex === "number" ? starOrIndex : (starOrIndex && typeof starOrIndex.id === "number" ? starOrIndex.id : 0);
var speed = Math.min(MAX_SPEED_FACTOR, Math.max(0.35, typeof speedFactor === "number" && Number.isFinite(speedFactor) ? speedFactor : MAX_SPEED_FACTOR));
return ((_SF_MEAN * MAX_SPEED_FACTOR) / speed) * (1 - _SF_SPR + 2 * _SF_SPR * starHash01(idx, 29));
}
function starDelayFor(starOrIndex, duration) {
var idx = typeof starOrIndex === "number" ? starOrIndex : (starOrIndex && typeof starOrIndex.id === "number" ? starOrIndex.id : 0);
var p = PARTICLES[idx], ph = p && typeof p.phase === "number" ? p.phase : 0;
return -((ph + starHash01(idx, 53) * 0.03) % 1) * (typeof duration === "number" && duration > 0 ? duration : starDurationFor(idx, MAX_SPEED_FACTOR));
}
function starLayerOpacityFor(energyOrPct, startOverride) {
var e = typeof startOverride === "number" ? energyForPct(energyOrPct, startOverride) : clamp01(energyOrPct);
return e <= 0 ? 0 : Math.round((0.6 + 0.4 * e) * 1000) / 1000;
}
function parseHexRgb(hex) {
var n = parseInt(String(hex || "").replace(/^#/, ""), 16);
return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mixHex(hexA, hexB, t) {
var k = clamp01(t), a = parseHexRgb(hexA), b = parseHexRgb(hexB), m = function (i) { return Math.round(a[i] + (b[i] - a[i]) * k); };
return "#" + ((1 << 24) | (m(0) << 16) | (m(1) << 8) | m(2)).toString(16).slice(1);
}
var TONE_PAL = {
mono: ["#71717a", "#a1a1aa", "#d4d4d8", ""],
amber: ["#b45309", "#d97706", "#f59e0b", "#f59e0b"],
iris: ["#6d28d9", "#8b5cf6", "#a855f7", "#a78bfa"],
cobalt: ["#1d4ed8", "#2563eb", "#0284c7", "#38bdf8"]
};
function fillColorFor(pct, startOverride, endOverride, isClaude, accentOverride) {
var p = clamp01(pct);
var start = typeof startOverride === "number" && Number.isFinite(startOverride) ? startOverride : ENERGY_START;
var end = typeof endOverride === "number" && Number.isFinite(endOverride) ? endOverride : ENERGY_END;
var tone = accentOverride || resolvePrismAccentTone(null, null);
var tp = tone === "mono" || (!isClaude && TONE_PAL[tone]) ? TONE_PAL[tone] : isClaude ? ["#71717a", "#a78bfa", "#704ea2"] : ["#4d93f8", "#9333ea", "#4c1d95"];
if (p <= start + 1e-6) return tp[0];
if (p <= end + 1e-6) return mixHex(tp[0], tp[1], (p - start) / Math.max(1e-6, end - start));
return mixHex(tp[1], tp[2], (p - end) / Math.max(1e-6, 1 - end));
}
function fillBackgroundFor(pct, startOverride, endOverride, isClaude, accentOverride) {
var p = clamp01(pct);
var start = typeof startOverride === "number" && Number.isFinite(startOverride) ? startOverride : ENERGY_START;
var end = typeof endOverride === "number" && Number.isFinite(endOverride) ? endOverride : ENERGY_END;
var tone = accentOverride || resolvePrismAccentTone(null, null), lg = "linear-gradient(90deg,";
if (tone === "mono") return p <= 0.05 ? "rgba(161, 161, 170, 0.22)" : lg + " rgba(113, 113, 122, 0.45) 0%, " + fillColorFor(p, start, end, false, "mono") + " 100%)";
if (isClaude) return p <= 0.05 ? "rgba(142, 118, 192, 0.15)" : lg + " rgba(142, 118, 192, 0.25) 0%, " + fillColorFor(p, start, end, true, "follow") + " 100%)";
if (TONE_PAL[tone]) return lg + " " + TONE_PAL[tone][0] + " 0%, " + fillColorFor(p, start, end, false, tone) + " 100%)";
if (p <= start + 1e-6) return "#4d93f8";
var ec = fillColorFor(p, start, end, false, "follow"), sb = start > 0 ? Math.round((start / p) * 100) : 0;
var pre = lg + " #4d93f8 0%," + (sb > 0 ? " #4d93f8 " + sb + "%," : "");
return p <= end + 1e-6 ? pre + " " + ec + " 100%)" : pre + " #9333ea " + Math.round((end / p) * 100) + "%, " + ec + " 100%)";
}
function valueColorFor(label, index, count, isMax, hasOffFirst, isClaude, accentOverride) {
if (isOffLevel(label)) return "";
var n = Number(count) || 0;
if (n <= 1) return "";
var tone = accentOverride || resolvePrismAccentTone(null, null);
if (tone === "mono") return "";
var tp = !isClaude && TONE_PAL[tone];
var lo = isClaude ? "#94a3b8" : tp ? tp[1] : "#4d93f8";
var hi = isClaude ? "#c4b5fd" : tp ? tp[3] : "#8b5cf6";
if (isMax || index === n - 1) return hi;
var idx = typeof index === "number" && index >= 0 ? index : 0;
var first = hasOffFirst ? 1 : 0;
if (!tp && idx <= first) return lo;
if (isClaude && n === 3 && idx === 1) return "#a78bfa";
return mixHex(lo, hi, clamp01((idx - first) / Math.max(1, n - 1 - first)));
}
// ── 样式表注入（对齐 dsh-codex-effort-slider 右向左星尘横穿 + 星云扫光 + Antigravity 面板适配） ──
var SLIDER_CSS = "@keyframes ces-sweep{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}@keyframes ces-star-sweep{0%{transform:translate3d(0,0,0);opacity:0}6%,94%{opacity:1}100%{transform:translate3d(-100%,0,0);opacity:0}}.ces-inline,.ces-root,.ces-track,.ces-ag-section,.ces-ag-effort-row{box-sizing:border-box}.ces-inline,.ces-root,.ces-ag-section,.ces-ag-section *{user-select:none!important;-webkit-user-select:none!important;-webkit-tap-highlight-color:transparent!important}.ces-inline{width:100%;padding-top:6px}.ces-root{position:relative;width:100%;outline:none!important;box-shadow:none!important}.ces-track{position:relative;width:100%;height:28px;border-radius:999px;background:rgba(128,128,145,.18);box-shadow:inset 0 1px 2px rgba(0,0,0,.24),inset 0 0 0 1px rgba(255,255,255,.06);cursor:pointer;touch-action:none;transition:opacity .15s,box-shadow .2s}.ces-root[data-energy='1'] .ces-track{box-shadow:0 0 calc(var(--ces-energy,0) * 16px) rgba(168,85,247,.5),inset 0 1px 2px rgba(0,0,0,.24)}.ces-root[data-energy='0'] .ces-star,.ces-root[data-energy='0'] .ces-energy__sweep{animation-play-state:paused}.ces-track.is-locked{opacity:.45;cursor:not-allowed;filter:saturate(.25)}.ces-fill,.ces-energy,.ces-stars{position:absolute;top:0;left:0;bottom:0;width:var(--ces-fill,14px);border-radius:14px 0 0 14px;pointer-events:none}.ces-fill{background:var(--ces-fill-bg,#4d93f8);overflow:hidden}.ces-energy{overflow:hidden;opacity:var(--ces-energy,0);transition:opacity .2s;background:linear-gradient(90deg,#3b1178,#6d28d9 30%,#9333ea 62%,#c084fc)}.ces-energy__sweep{position:absolute;inset:0;background:linear-gradient(100deg,transparent 18%,rgba(255,255,255,.3) 50%,transparent 82%);transform:translateX(100%);animation:ces-sweep 2.4s linear infinite;pointer-events:none}.ces-stars{opacity:var(--ces-star-opacity,0);transition:opacity .2s;overflow:hidden}.ces-star{position:absolute;left:0;right:0;height:3px;margin-top:-1.5px;pointer-events:none;animation:ces-star-sweep linear infinite}.ces-star__dot{position:absolute;left:100%;top:0;width:3px;height:3px;margin-left:-1.5px;border-radius:50%;background:#f5f3ff;box-shadow:0 0 5px rgba(216,180,254,.95);opacity:var(--ces-b,1);transform:scale(var(--ces-b,1))}.ces-ticks{position:absolute;inset:0;pointer-events:none}.ces-tick{position:absolute;top:50%;width:3px;height:3px;margin:-1.5px 0 0 -1.5px;border-radius:50%;background:rgba(255,255,255,.28);pointer-events:none;transition:background-color .12s}.ces-tick.is-on{background:rgba(255,255,255,.65)}.ces-tick.is-dim{background:rgba(255,255,255,.28)}.ces-knob{position:absolute;top:50%;left:var(--ces-fill,14px);width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;background:#fff;box-shadow:0 1px 5px rgba(0,0,0,.34),0 0 0 .5px rgba(0,0,0,.06);pointer-events:none;will-change:transform}.ces-root[data-theme='claude'] .ces-stars,.ces-root[data-theme='claude'] .ces-energy{display:none!important}.ces-root[data-theme='claude'] .ces-track{background:rgba(128,128,145,.16);box-shadow:inset 0 1px 2px rgba(0,0,0,.22),inset 0 0 0 1px rgba(255,255,255,.08)}.ces-root[data-theme='claude'][data-energy='1'] .ces-track{box-shadow:0 0 16px rgba(167,139,250,.45),inset 0 1px 2px rgba(0,0,0,.22)}.ces-root[data-theme='claude'] .ces-knob{width:24px;height:30px;margin:-15px 0 0 -12px;border-radius:7px;box-shadow:0 2px 6px rgba(0,0,0,.4),0 0 0 .5px rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center}.ces-knob-notch{display:none;width:2px;height:10px;border-radius:999px;background:rgba(0,0,0,.28)}.ces-root[data-theme='claude'] .ces-knob-notch{display:block}.ces-claude-canvas{position:absolute;left:0;top:0;border-radius:14px 0 0 14px;display:none;pointer-events:none}.ces-root[data-theme='claude'][data-energy='1'] .ces-claude-canvas{display:block}@keyframes ces-claude-rise{0%{transform:translateY(20%) scale(.98);opacity:.15}60%{opacity:1}85%{transform:translateY(-2%) scale(1.01)}100%{transform:none;opacity:1}}.ces-ag-effort-value:is(.is-claude-changing,.ces-text-rise){animation:ces-claude-rise .24s cubic-bezier(.2,.85,.25,1)}.ces-ag-effort-value.is-glowing:is(.is-claude-changing,.ces-text-rise){animation:ces-claude-rise .24s cubic-bezier(.2,.85,.25,1),ces-text-bloom .4s cubic-bezier(.16,1,.3,1) forwards}[data-testid='model-selector-panel'].ces-ag-panel-enhanced{max-height:26rem!important}.ces-ag-section,.ces-ag-section *{outline:none!important}.ces-ag-section,.ces-ag-effort-row{display:flex;flex-direction:column;width:100%}.ces-ag-section{flex-shrink:0}.ces-ag-effort-row{padding:6px 8px 8px;border-radius:6px;transition:box-shadow .2s,background-color .2s}.ces-ag-effort-row:hover{background:rgba(128,128,145,.08)}.ces-ag-effort-row[data-ces-max='true'],[data-ces-effort-row='true'][data-ces-max='true']{box-shadow:inset 0 0 0 1px rgba(139,92,246,.42),0 0 14px -4px rgba(139,92,246,.45)!important;background:rgba(139,92,246,.06)}.ces-ag-effort-head{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:18px;padding:1px 0;font-size:12px;line-height:16px;overflow-y:clip;overflow-clip-margin:10px}.ces-ag-effort-title{display:inline-flex;align-items:center;gap:6px;color:inherit;font-weight:500;opacity:.9}.ces-ag-effort-value{position:relative;z-index:1;display:inline-block;font-size:12px;font-weight:600;transition:color .15s}.ces-ag-effort-value::after{content:'';position:absolute;top:50%;left:50%;width:52px;height:26px;border-radius:999px;transform:translate(-50%,-50%) scale(.6);background:radial-gradient(ellipse,var(--ces-glow-color,rgba(168,85,247,.85)),var(--ces-glow-color,rgba(168,85,247,.45)) 45%,rgba(168,85,247,0) 75%);filter:blur(8px);pointer-events:none;opacity:0;z-index:-1}@keyframes ces-glow-flash{0%{opacity:.95;transform:translate(-50%,-50%) scale(.65);filter:blur(6px)}25%{opacity:1;transform:translate(-50%,-50%) scale(1.15);filter:blur(8px)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5);filter:blur(14px)}}@keyframes ces-text-bloom{0%{text-shadow:0 0 8px var(--ces-glow-color,#c084fc)}30%{text-shadow:0 0 14px var(--ces-glow-color,#c084fc),0 0 3px #fff}100%{text-shadow:none}}.ces-ag-effort-value.is-glowing{animation:ces-text-bloom .4s cubic-bezier(.16,1,.3,1) forwards}.ces-ag-effort-value.is-glowing::after{animation:ces-glow-flash .4s cubic-bezier(.16,1,.3,1) forwards}@media (prefers-reduced-motion:reduce){.ces-panel-shaking,.ces-ag-effort-value.is-glowing,.ces-ag-effort-value.is-glowing::after,.ces-ag-effort-value.ces-text-rise,.ces-ag-effort-value.is-claude-changing{animation:none!important}}html[data-ces-slider-ready='1'] [role='menu']:has([data-testid='model-selector-effort-option']):not(:has([data-testid='model-selector-panel'])),html[data-ces-slider-ready='1'] div[role='presentation']:has(>[role='menu'] [data-testid='model-selector-effort-option']):not(:has([data-testid='model-selector-panel'])),html[data-ces-slider-ready='1'] [data-ag-cs-orch-l3='1']{display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important}html[data-ces-slider-ready='1'] [role='menuitem']:has([data-testid='model-selector-effort-group'])>span.shrink-0:last-child,html[data-ces-slider-ready='1'] [data-ces-orch-row='1']>svg:last-child:not(:first-child):not(.lucide-check),html[data-ces-slider-ready='1'] [data-ces-orch-row='1']>span:last-child:not(:first-child):has(>svg:only-child:not(.lucide-check)),html[data-ces-slider-ready='1'] [data-ces-orch-row='1']>*:last-child>svg:last-child:not(.lucide-check){display:none!important}html[data-ces-slider-ready='1'] [role='menuitem']:has([data-testid='model-selector-effort-group'])>.group-hover\\:hidden{display:flex!important}[role='menuitem'][data-ces-model-selected='true'],[data-ces-orch-row='1'][data-ces-model-selected='true']{background:rgba(128,128,145,.14)}.ces-set{position:fixed;z-index:2147483646;width:268px;padding:12px;border-radius:10px;background:rgba(24,24,28,.96);color:#f4f4f6;border:1px solid rgba(255,255,255,.12);box-shadow:0 12px 32px rgba(0,0,0,.55);backdrop-filter:blur(12px);font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;box-sizing:border-box;user-select:none}.ces-set-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.08);font-weight:600;font-size:12.5px}.ces-set-ver{font-size:11px;font-weight:400;opacity:.55}.ces-set-group{margin-bottom:10px}.ces-set-label{margin-bottom:5px;font-size:11px;opacity:.72}.ces-set-opts{display:flex;gap:4px}.ces-set-opt{flex:1;padding:5px 6px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#d4d4d8;font-size:11.5px;cursor:pointer;text-align:center;transition:all .12s ease}.ces-set-opt:hover{background:rgba(255,255,255,.1);color:#fff}.ces-set-opt.is-on{background:rgba(139,92,246,.28);border-color:rgba(139,92,246,.75);color:#fff;font-weight:600}.ces-set-actions{display:flex;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08)}.ces-set-btn{flex:1;padding:5px 8px;border-radius:6px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#e4e4e7;font-size:11px;cursor:pointer}.ces-set-btn:hover{background:rgba(255,255,255,.14)}[data-testid='model-selector-panel'] .ces-ag-section[data-effort-slot='true']{grid-template-rows:auto auto}[data-testid='model-selector-panel'] .ces-ag-section[data-effort-slot='true']>[role='separator']{grid-row:1;grid-column:1}[data-testid='model-selector-panel'] .ces-ag-section[data-effort-slot='true']>:is(.ces-ag-effort-row,[data-testid='orchestrator-effort-bar']){grid-row:2!important;grid-column:1!important}";
function installStyles(doc) {
var d = doc || (typeof document !== "undefined" ? document : null);
if (!d || !d.head) return null;
var s = d.getElementById(STYLE_ELEMENT_ID);
if (!s) { s = d.createElement("style"); s.id = STYLE_ELEMENT_ID; d.head.appendChild(s); }
if (s.textContent !== SLIDER_CSS) s.textContent = SLIDER_CSS;
return s;
}
// ── 右键设置面板 ────────────────────────────────────────────────────────────
var SET_TITLE_I18N = { "zh-CN": "推理等级滑条设置", "zh-TW": "推理等級滑桿設定", yue: "推理等級滑桿設定", en: "Effort Slider", ja: "推論スライダー設定" };
var SET_HEAD_I18N = { "zh-CN": "推理等级滑条", "zh-TW": "推理等級滑桿", yue: "推理等級滑桿", en: "Effort Slider", ja: "推論スライダー" };
function _isZhLang(lk) { return !lk || /^(?:zh|yue)\b/i.test(String(lk)); }
function openSettingsPanel(options) {
var o = options || {}, d = o.document || (typeof document !== "undefined" ? document : null);
var w = o.window || d?.defaultView || (typeof window !== "undefined" ? window : globalRoot);
if (!d?.body) return () => {};
installStyles(d);
var lk = getPrismRootAttr(d, w, "data-ag-cs-lang") || "zh-CN";
var zh = _isZhLang(lk);
d.querySelector(".ces-set")?.remove?.();
var mk = (t, c, tx) => { var e = d.createElement(t); if (c) e.className = c; if (tx) e.textContent = tx; return e; };
var p = markNoTranslate(mk("div", "ces-set"));
p.setAttribute("role", "dialog");
p.setAttribute("aria-label", SET_TITLE_I18N[lk] || (zh ? SET_TITLE_I18N["zh-CN"] : SET_TITLE_I18N.en));
p.style.left = Math.max(8, Math.min((w?.innerWidth || 800) - 276, typeof o.x === "number" ? o.x : 120)) + "px";
p.style.top = Math.max(8, Math.min((w?.innerHeight || 600) - 230, typeof o.y === "number" ? o.y : 120)) + "px";
var hd = mk("div", "ces-set-head");
hd.appendChild(mk("span", "", SET_HEAD_I18N[lk] || (zh ? SET_HEAD_I18N["zh-CN"] : SET_HEAD_I18N.en)));
hd.appendChild(mk("span", "ces-set-ver", "v1.2.1"));
p.appendChild(hd);
var obs = [];
var ref = () => {
var cur = readSettings(w);
for (var it of obs) {
var on = cur[it.k] === it.v;
if (it.b.classList) it.b.classList.toggle ? it.b.classList.toggle("is-on", on) : it.b.classList[on ? "add" : "remove"]("is-on");
else it.b.className = on ? "ces-set-opt is-on" : "ces-set-opt";
it.b.setAttribute("aria-pressed", String(on));
}
};
for (var sc of SETTINGS_SCHEMA) {
var g = mk("div", "ces-set-group"), r = mk("div", "ces-set-opts");
g.appendChild(mk("div", "ces-set-label", zh ? sc.label : (sc.labelEn || sc.label)));
for (var op of sc.options) {
let k = sc.key, v = op.value;
var b = mk("button", "ces-set-opt", zh ? op.label : (op.labelEn || op.label));
b.type = "button";
var hTxt = zh ? op.hint : (op.hintEn || op.hint);
if (hTxt) b.title = hTxt;
b.addEventListener("click", (ev) => { ev.stopPropagation(); writeSettings({ [k]: v }, w); ref(); });
obs.push({ k, v, b });
r.appendChild(b);
}
g.appendChild(r); p.appendChild(g);
}
var acts = mk("div", "ces-set-actions");
var mb = (tx, fn) => {
var b = mk("button", "ces-set-btn", tx);
b.type = "button";
b.addEventListener("click", (ev) => { ev.stopPropagation(); fn(b); });
acts.appendChild(b);
};
mb(zh ? "复制诊断" : "Copy Debug", (b) => { try { w?.navigator?.clipboard?.writeText?.(JSON.stringify(dumpTrace(w), null, 2)); } catch {} b.textContent = zh ? "已复制" : "Copied"; });
mb(zh ? "恢复默认" : "Reset", () => { resetSettings(w); ref(); });
mb(zh ? "关闭" : "Close", () => cls());
p.appendChild(acts);
ref();
var offS = onSettingsChange(ref, w);
var onPd = (ev) => { if (!p.contains(ev.target)) cls(); };
var onKd = (ev) => { if (ev?.key === "Escape") { ev.stopPropagation(); cls(); } };
function cls() { offS(); d.removeEventListener("pointerdown", onPd, true); d.removeEventListener("keydown", onKd, true); p.parentNode?.removeChild(p); }
d.addEventListener("pointerdown", onPd, true);
d.addEventListener("keydown", onKd, true);
d.body.appendChild(p);
return cls;
}
function installSettingsUi(options) {
var o = options || {}, d = o.document || (typeof document !== "undefined" ? document : null);
var w = o.window || d?.defaultView || (typeof window !== "undefined" ? window : globalRoot);
if (!d) return { stop: () => {} };
var ac = null, lt = null, ps = null;
var inS = (t) => t?.closest?.(".ces-inline, .ces-root, .ces-ag-effort-row") || null;
var clr = () => { if (lt !== null) { clearTimeout(lt); lt = null; } ps = null; };
var opn = (x, y) => { ac?.(); ac = openSettingsPanel({ document: d, window: w, x: x || 120, y: y || 120 }); };
var evs = [
["contextmenu", (ev) => { if (!inS(ev.target)) return; ev.preventDefault(); ev.stopPropagation(); opn(ev.clientX, ev.clientY); }],
["keydown", (ev) => { var h = inS(ev.target); if (h && (ev.key === "ContextMenu" || (ev.key === "F10" && ev.shiftKey))) { ev.preventDefault(); ev.stopPropagation(); var rc = h.getBoundingClientRect?.() || { left: 120, bottom: 120 }; opn(rc.left, rc.bottom + 4); } }],
["pointerdown", (ev) => { if (!inS(ev.target) || ev.button === 2) return; clr(); ps = { x: ev.clientX || 0, y: ev.clientY || 0 }; lt = setTimeout(() => { lt = null; opn(ps?.x, ps?.y); }, 500); }],
["pointermove", (ev) => { if (!ps || lt === null) return; var dx = (ev.clientX || 0) - ps.x, dy = (ev.clientY || 0) - ps.y; if (dx * dx + dy * dy > 36) clr(); }],
["pointerup", clr], ["pointercancel", clr]
];
evs.forEach((e) => d.addEventListener(e[0], e[1], true));
return { stop: () => { clr(); ac?.(); ac = null; evs.forEach((e) => d.removeEventListener(e[0], e[1], true)); } };
}
// ── DOM 与 Antigravity React Fiber 解析辅助函数 ─────────────────────────────
var INFERENCE_LABELS = ["推理等级", "Reasoning effort", "Reasoning Effort", "Thinking effort", "推理强度"];
function parseModelLabel(label) {
if (!label || typeof label !== "string") return null;
var match = AG_MODEL_LABEL_RE.exec(label.trim());
if (!match) return null;
var base = match[1].trim();
var effort = match[2].toLowerCase();
// 兼容展示名 "(Extra)" 与内部枚举 "(xhigh)"，统一归并到 xhigh 槽位进行排序与着色
if (effort === "extra") effort = "xhigh";
return {
base: base,
effort: effort,
effortLabel: AG_EFFORT_LABELS[effort] || match[2]
};
}
function _isSubTrigger(el) { return Boolean(el && el.closest && el.closest('[data-testid="subagent-tab-conversation"]')); }
function findAntigravityTrigger(doc) {
var d = doc || (typeof document !== "undefined" ? document : null), sel = '[data-testid="model-selector-trigger"],button[aria-label^="Select model"]';
if (!d) return null;
if (d.querySelectorAll) {
var list = d.querySelectorAll(sel), fb = null;
for (var i = 0; i < list.length; i += 1) {
var el = list[i];
if (!el || _isSubTrigger(el)) continue;
if (el.checkVisibility) { try { if (!el.checkVisibility()) { if (!fb) fb = el; continue; } } catch (e) {} }
return el;
}
if (fb) return fb;
}
var q = d.querySelector && (d.querySelector('[data-testid="model-selector-trigger"]') || d.querySelector('button[aria-label^="Select model"]'));
return q && !_isSubTrigger(q) ? q : null;
}
function findAntigravityPanel(doc) {
var d = doc || (typeof document !== "undefined" ? document : null);
return d && d.querySelector ? d.querySelector('[data-testid="model-selector-panel"]') : null;
}
function findInferenceRow(doc) {
var d = doc || (typeof document !== "undefined" ? document : null);
if (!d || typeof d.querySelectorAll !== "function") return null;
var explicit = d.querySelector('[data-ces-effort-row="true"]');
if (explicit) return explicit;
var menus = d.querySelectorAll('[role="menu"], .surface-menu, [data-testid="model-selector-panel"]');
for (var mIdx = 0; mIdx < menus.length; mIdx += 1) {
var menu = menus[mIdx];
var items = menu.querySelectorAll('[role="menuitem"], .ces-ag-effort-row, div, button');
for (var i = 0; i < items.length; i += 1) {
var el = items[i];
var txt = (el.textContent || "").trim();
for (var k = 0; k < INFERENCE_LABELS.length; k += 1) {
var kw = INFERENCE_LABELS[k];
if (txt === kw || txt.indexOf(kw) === 0) {
return el.closest('[role="menuitem"]') || el;
}
}
}
}
return null;
}
function findValueElement(row) {
if (!row || typeof row.querySelector !== "function") return null;
var ex = row.querySelector('[data-ces-part="value"], .ces-ag-effort-value');
if (ex) return ex;
var ch = row.querySelectorAll("span, div"), cand = null;
for (var i = 0; i < ch.length; i += 1) {
var c = ch[i], t = (c.textContent || "").trim();
if (!t || (c.closest && c.closest(".ces-inline")) || (c.children && c.children.length)) continue;
if (INFERENCE_LABELS.indexOf(t) < 0) cand = c;
}
return cand;
}
function syncTriggerColor(doc, label, index, count, isMax, hasOffFirst, isClaude) {
var d = doc || (typeof document !== "undefined" ? document : null);
if (!d) return;
var ag = findAntigravityTrigger(d), col = valueColorFor(label, index, count, isMax, hasOffFirst, typeof isClaude === "boolean" ? isClaude : isClaudeModel(ag ? ag.textContent : ""), resolvePrismAccentTone(d, null)) || "";
if (ag) {
var sp = ag.querySelector("span.opacity-70, [data-ces-part='trigger-effort']");
if (sp) { sp.setAttribute("data-ces-part", "trigger-effort"); sp.style.color = col; sp.style.opacity = col ? "1" : ""; sp.style.fontWeight = col ? "600" : ""; }
return;
}
if (!d.querySelectorAll) return;
var cs = d.querySelectorAll(".surface-composer, .surface-composer-card, form, body");
for (var i = 0; i < cs.length; i += 1) {
var bs = cs[i].querySelectorAll('button[aria-haspopup="menu"]');
for (var j = 0; j < bs.length; j += 1) if ((bs[j].textContent || "").indexOf(" · ") >= 0) { var sps = bs[j].querySelectorAll("span"); (sps.length ? sps[sps.length - 1] : bs[j]).style.color = col; return; }
}
}
function findSeatEffort(win) {
var map = (win || (typeof window !== "undefined" ? window : globalRoot));
map = map && map.__dshSeats;
if (!map || typeof map.forEach !== "function") return null;
var found = null;
map.forEach(function (s) { if (!found && s && Array.isArray(s.effortLevels)) found = s; });
return found;
}
function getReactFiber(el) {
if (!el || typeof el !== "object") return null;
var raw = null, ks = Object.keys(el);
for (var i = 0; i < ks.length; i += 1) if (ks[i].indexOf("__reactFiber$") === 0 || ks[i].indexOf("__reactInternalInstance$") === 0) { raw = el[ks[i]]; break; }
if (!raw) return null;
if (raw.alternate) {
var root = raw, g = 0;
while (root.return && g < 600) { root = root.return; g += 1; }
if (root && root.stateNode && root.stateNode.current && root.stateNode.current !== root) return raw.alternate;
}
return raw;
}
function _slug(s) {
return String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function _isOrch(m) {
if (!m) return false;
if (typeof m === "string") return /\borchestrator\b|编排/i.test(m);
return /\borchestrator\b|编排/i.test(String(m.label || "")) || /orchestrator/i.test(String(m.modelId || ""));
}
function buildEffortIndexFromOptions(list) {
var out = new Map();
if (!Array.isArray(list)) return out;
for (var i = 0; i < list.length; i += 1) {
var o = list[i];
if (!o || o.isCustom || typeof o.label !== "string" || _isOrch(o)) continue;
var p = parseModelLabel(o.label);
if (!p) continue;
var m = out.get(p.base);
if (!m) { m = new Map(); out.set(p.base, m); }
if (!m.has(p.effort)) m.set(p.effort, o);
}
return out;
}
function normalizeEffortIndex(raw, opts) {
var out = buildEffortIndexFromOptions(opts);
if (!(raw instanceof Map)) return out;
raw.forEach(function (inn, rk) {
if (!(inn instanceof Map) || !inn.size) return;
var db = "";
inn.forEach(function (o) {
if (db || !o || typeof o.label !== "string") return;
var p = parseModelLabel(o.label);
if (p && p.base) db = p.base;
});
var k = db || String(rk || "");
if (!k) return;
var mg = out.get(k) || new Map();
inn.forEach(function (o, ek) {
var nk = String(ek || "").toLowerCase();
if (nk === "extra") nk = "xhigh";
if (nk && o && !mg.has(nk)) mg.set(nk, o);
});
if (mg.size) out.set(k, mg);
});
return out;
}
function _luEff(idx, base) {
if (!base || !(idx instanceof Map)) return null;
var d = idx.get(base);
if (d instanceof Map && d.size) return d;
var w = _slug(base), hit = w ? idx.get(w) : null;
if (!(hit instanceof Map && hit.size) && w) { hit = null; idx.forEach(function (v, k) { if (!hit && v instanceof Map && v.size && _slug(k) === w) hit = v; }); }
return hit;
}
function _resOrch(ctx, ovr) {
var pk = ctx && (ctx.orchPick || ctx.orchestratorPick), ps = ctx && (ctx.orchPlanners || ctx.orchestratorPlanners);
if (!pk || typeof pk.select !== "function" || !Array.isArray(ps) || !ps.length) return null;
var f = function (r) {
if (!r) return null;
if (typeof r === "object" && typeof r.label === "string") return r;
for (var i = 0; i < ps.length; i += 1) if (ps[i] && (ps[i].value === r || ps[i].modelId === r || ps[i].label === r)) return ps[i];
return null;
};
var def = f(ctx.orchDef || ctx.orchestratorDefaultPlanner) || ps[0] || null;
var act = f(ovr) || f(pk.model) || def;
var oi = ctx.orchIdx || ctx.orchestratorPlannerIndex;
return act ? { opt: act, def: def, idx: oi instanceof Map && oi.size ? oi : ctx.effortIndex } : null;
}
/**
* 从 Antigravity 的 DOM 节点向上遍历 React Fiber 树，提取：
* - OXb.Provider: effortIndex, modelOptions, selectedModel, groups
* - $Xb         : 未包装 setIsOpen(false) 的 setSelectedModel, open, setIsOpen
* - cYb         : conversationId
* - eKa.Provider: setModelConfigByLabelForConversation（直接切档不关菜单、不抢焦点）
*/
function _rdAgFiber(el) {
var cur = getReactFiber(el);
if (!cur) return null;
var sc = null, ip = null, op = null, cid, hasC = false, gm = null;
for (var step = 0; cur && step < 500; step += 1, cur = cur.return) {
var props = cur.memoizedProps;
if (!props || typeof props !== "object") continue;
var val = props.value;
if (!sc && val && typeof val === "object" && val.effortIndex instanceof Map && Array.isArray(val.modelOptions)) sc = val;
if (typeof props.setIsOpen === "function" && typeof props.setSelectedModel === "function" && Array.isArray(props.modelOptions)) { if (!ip) ip = props; op = props; }
if (!hasC && ("conversationId" in props) && ("placement" in props)) { hasC = true; cid = props.conversationId; }
if (!gm && val && typeof val === "object" && typeof val.setModelConfigByLabelForConversation === "function") gm = val;
if (sc && op && hasC && gm) break;
}
if (!sc && !ip && !op && !gm) return null;
var mos = op?.modelOptions || ip?.modelOptions || sc?.modelOptions || gm?.visibleModelConfigs || [];
var sel = op?.selectedModel || ip?.selectedModel || sc?.selectedModel || (gm && (hasC && typeof gm.getModelConfigForConversation === "function" ? gm.getModelConfigForConversation(cid) : gm.currentModelConfig)) || null;
var _fn = (o, k) => (o && typeof o[k] === "function" ? o[k] : null), ops = Array.isArray(sc?.orchestratorPlanners) ? sc.orchestratorPlanners : [];
return {
effortIndex: normalizeEffortIndex(sc?.effortIndex, mos), modelOptions: mos, selectedModel: sel,
orchPlanners: ops, orchIdx: normalizeEffortIndex(sc?.orchestratorPlannerIndex, ops),
orchDef: sc?.orchestratorDefaultPlanner || null,
orchPick: sc?.orchestratorPick && typeof sc.orchestratorPick === "object" ? sc.orchestratorPick : null,
groups: sc?.groups || [], conversationId: cid, hasConversationSelector: hasC,
setModelConfigByLabelForConversation: _fn(gm, "setModelConfigByLabelForConversation"),
setCurrentModelConfigByLabel: _fn(gm, "setCurrentModelConfigByLabel"),
unwrappedSetSelectedModel: _fn(op, "setSelectedModel") || _fn(ip, "setSelectedModel") || _fn(sc, "setSelectedModel"),
setIsOpen: _fn(op, "setIsOpen") || _fn(ip, "setIsOpen") || _fn(sc, "setIsOpen"),
isOpen: Boolean(op?.open || ip?.open)
};
}
function resolveModelEffortProfile(ctx, targetModelOrBase, _effMap, planOvr) {
if (!ctx) return null;
var selected = ctx.selectedModel, modelObj = null, baseName = "", activeEffort = "";
if (typeof targetModelOrBase === "string" && targetModelOrBase) baseName = targetModelOrBase;
else if (targetModelOrBase && typeof targetModelOrBase === "object") modelObj = targetModelOrBase;
else modelObj = selected;
var isOrch = _isOrch(modelObj || baseName), idx = ctx.effortIndex, orchTune = false;
if (isOrch) {
var pi = _resOrch(ctx, planOvr);
if (pi?.opt) { modelObj = pi.opt; idx = pi.idx || ctx.effortIndex; orchTune = true; }
}
if (typeof modelObj?.label === "string") {
var parsed = parseModelLabel(modelObj.label);
if (parsed) { baseName = parsed.base; activeEffort = parsed.effort; }
else baseName = modelObj.label;
}
var byEffort = _luEff(idx, baseName);
if (byEffort && byEffort.size >= 2) {
var sortedKeys = AG_EFFORT_ORDER.filter((k) => byEffort.has(k));
if (!activeEffort) {
var rem = _effMap?.get(baseName);
if (rem && byEffort.has(rem)) activeEffort = rem;
else {
var selParsed = selected && parseModelLabel(selected.label);
activeEffort = (selParsed && selParsed.base === baseName && byEffort.has(selParsed.effort)) ? selParsed.effort : byEffort.has("medium") ? "medium" : (sortedKeys[0] || "");
}
}
var levels = sortedKeys.map((k) => ({ effort: k, label: AG_EFFORT_LABELS[k] || k, modelOption: byEffort.get(k) }));
var currentIndex = Math.max(0, sortedKeys.indexOf(activeEffort)), isClaude = isClaudeModel(baseName), ck = sortedKeys[currentIndex];
return {
baseName, isOrchestrator: isOrch, orchestratorTunable: orchTune,
isClaude, theme: isClaude ? "claude" : "codex", locked: false, levels,
currentIndex, currentEffort: ck || activeEffort,
currentLabel: AG_EFFORT_LABELS[ck] || activeEffort,
modelOption: byEffort.get(ck) || modelObj
};
}
var sP = modelObj && parseModelLabel(modelObj.label), sE = sP ? sP.effort : "fixed";
var sL = sP ? sP.effortLabel : (_isZhLang(getPrismRootAttr(null, null, "data-ag-cs-lang")) ? "固定" : "Fixed");
var bn = baseName || modelObj?.label || "", sC = isClaudeModel(bn);
return {
baseName: bn, isOrchestrator: isOrch, orchestratorTunable: false,
isClaude: sC, theme: sC ? "claude" : "codex", locked: true,
levels: [{ effort: sE, label: sL, modelOption: modelObj }],
currentIndex: 0, currentEffort: sE, currentLabel: sL, modelOption: modelObj
};
}
function _commitAgOpt(ctx, targetOption, isOrchPlan, keepOpen) {
if (!ctx || !targetOption?.label) return false;
var shouldKeep = keepOpen !== false;
try {
var pk = ctx.orchPick || ctx.orchestratorPick;
if (isOrchPlan && typeof pk?.select === "function") {
var def = ctx.orchDef || ctx.orchestratorDefaultPlanner;
pk.select(def && def.value === targetOption.value ? 0 : targetOption.value);
if (shouldKeep) { try { ctx.setIsOpen?.(true); } catch {} }
return true;
}
if (typeof ctx.setModelConfigByLabelForConversation === "function") {
ctx.setModelConfigByLabelForConversation(targetOption.label, ctx.conversationId, shouldKeep);
return true;
}
if (typeof ctx.unwrappedSetSelectedModel === "function") {
var d = typeof document !== "undefined" ? document : null, ed = d?.querySelector?.('[contenteditable="true"]');
var prevFocus = d?.activeElement, onFocus = (ev) => { ev?.stopPropagation?.(); try { ed?.blur?.(); } catch {} };
ed?.addEventListener?.("focus", onFocus, true);
try {
ctx.unwrappedSetSelectedModel(targetOption);
if (ed && d?.activeElement === ed) {
try { ed.blur?.(); } catch {}
if (prevFocus && prevFocus !== ed) { try { prevFocus.focus?.(); } catch {} }
}
} finally {
ed?.removeEventListener?.("focus", onFocus, true);
}
if (shouldKeep) { try { ctx.setIsOpen?.(true); } catch {} }
return true;
}
if (typeof ctx.setCurrentModelConfigByLabel === "function") {
ctx.setCurrentModelConfigByLabel(targetOption.label);
return true;
}
} catch (err) {
tracePush("ag-commit-error", { message: String(err?.message || err) });
}
return false;
}
function extractEffortKey(item) {
return item == null ? "" : typeof item === "object" ? String(item.effort || item.id || item.value || item.key || item.label || "") : String(item);
}
function _extEffLbl(item, effortKey, seat) {
if (typeof item?.label === "string" && item.label) return item.label;
if (typeof seat?.formatEffortLabel === "function") { try { var f = seat.formatEffortLabel(effortKey); if (f) return String(f); } catch {} }
return AG_EFFORT_LABELS[String(effortKey || "").toLowerCase()] || String(effortKey || "");
}
var EFFORT_TITLE_I18N = { "zh-CN": "推理等级", "zh-TW": "推理等級", yue: "推理等級", en: "Reasoning Effort", ja: "推論レベル" };
function resolveEffortTitle(doc, win) {
var lang = getPrismRootAttr(doc, win, "data-ag-cs-lang") || "zh-CN";
try {
var ui = (win?.__agCsLocales || globalRoot?.__agCsLocales)?.getUiStrings?.(lang);
if (ui?.effortTitle) return String(ui.effortTitle);
} catch {}
return EFFORT_TITLE_I18N[lang] || EFFORT_TITLE_I18N["zh-CN"];
}
function _clrSibs(r) {
for (var g of r?.querySelectorAll?.('[data-testid="model-selector-effort-group"]') || []) if (g?.nextElementSibling) delete g.nextElementSibling.__cesLastText;
}
function _clrAgDom(doc) {
if (!doc?.querySelectorAll) return;
for (var sp of doc.querySelectorAll('[data-ces-part="trigger-effort"], [data-testid="model-selector-trigger"] span[style]')) {
if (sp.style) sp.style.color = sp.style.opacity = sp.style.fontWeight = "";
sp.removeAttribute?.("data-ces-part");
delete sp.__cesLastText;
}
var te = findAntigravityTrigger(doc)?.querySelector?.("span.opacity-70, [data-ces-part='trigger-effort']");
if (te) delete te.__cesLastText;
_clrSibs(doc);
for (var v of doc.querySelectorAll('[data-ces-part="value"], .ces-ag-effort-value')) { delete v.__cesLastLabel; delete v.__cesLastKey; }
for (var p of doc.querySelectorAll(".ces-ag-panel-enhanced")) p.classList?.remove("ces-ag-panel-enhanced");
for (var a of ["data-ces-model-selected", "data-ag-cs-model-submenu", "data-ag-cs-orch-l2", "data-ag-cs-orch-l3", "data-ces-orch-row", "data-ces-orch-b", "data-ces-orch-tunable"]) {
for (var m of doc.querySelectorAll("[" + a + "]")) m.removeAttribute(a);
}
doc.documentElement?.removeAttribute?.("data-ces-slider-ready");
}
function mountCodexEffortSlider(options) {
var opts = options || {};
var container = opts.container;
var seat = opts.seat;
var doc = opts.document || (container && container.ownerDocument) || (typeof document !== "undefined" ? document : null);
var win = opts.window || (doc && doc.defaultView) || (typeof window !== "undefined" ? window : globalRoot);
if (!container || !doc) {
return { unmount: function () {}, refresh: function () {} };
}
installStyles(doc);
// 清空宿主容器并构建 DOM 树（对齐 dsh-codex-effort-slider 四层结构：fill / energy+sweep / stars+dot / knob）
container.innerHTML = "";
var _sa = function (el, k, v) { if (el && typeof el.setAttribute === "function" && el.getAttribute(k) !== v) el.setAttribute(k, v); };
function _ce(tag, cls, part, parent) {
var el = doc.createElement(tag);
if (cls) el.className = cls;
if (part) el.setAttribute("data-ces-part", part);
if (parent) parent.appendChild(el);
return el;
}
var rootEl = markNoTranslate(_ce("div", "ces-root"));
rootEl.setAttribute("role", "slider");
rootEl.setAttribute("aria-label", resolveEffortTitle(doc, win));
var trackEl = _ce("div", "ces-track", "track", rootEl);
var fillEl = _ce("div", "ces-fill", "fill", trackEl);
var energyEl = _ce("div", "ces-energy", "energy", trackEl);
_ce("div", "ces-energy__sweep", "sweep", energyEl);
var starsEl = _ce("div", "ces-stars", "stars", trackEl);
var starNodes = [];
for (var sIdx = 0; sIdx < PARTICLES.length; sIdx += 1) {
var p = PARTICLES[sIdx];
var starEl = _ce("span", "ces-star", "star", starsEl);
starEl.style.top = p.y + "%";
starEl.style.display = "none";
var dotEl = _ce("span", "ces-star__dot", "particle", starEl);
var bStr = p.brightness.toFixed(3);
dotEl.setAttribute("data-brightness", bStr);
dotEl.style.setProperty("--ces-b", bStr);
starNodes.push({ el: starEl, dot: dotEl, meta: p });
}
var ticksEl = _ce("div", "ces-ticks", "ticks", trackEl);
var claudeCanvasEl = _ce("canvas", "ces-claude-canvas", "claude-canvas", fillEl);
claudeCanvasEl.width = 280;
claudeCanvasEl.height = 28;
var knobEl = _ce("div", "ces-knob", "knob", trackEl);
_ce("div", "ces-knob-notch", null, knobEl);
container.appendChild(rootEl);
// ── 内部状态机 ──────────────────────────────────────────────────────────
var destroyed = false;
var rafId = null;
var lastFrameMs = 0;
var claudeRafId = null;
var _clTm = null;
var _dLW = 0;
var claudeAnimStart = 0;
// 点阵流动相位（秒）：按「帧间隔 × 当前速度倍率」累加，而不是 elapsed × 倍率，
// 这样拖动中速度连续变化时波纹不会因倍率突变而跳帧/倒退
var claudeFlowTime = 0;
var claudeLastTs = 0;
// 当前位置对应的强度与速度（由 applyVisualPct 每次刷新，RAF 循环读取）
var claudeIntensity = 0;
var claudeSpeed = 0;
var dragging = false;
var buttonDown = false;
var draftPct = null;
var draftIndex = null;
var snapIndex = null;
var detentIndex = -1;
var _lastCmtIdx = -1;
var lastPtrPct = null;
var lastPtrMs = 0;
var ptrSpeed = 0;
var motionState = null;
var tickNodes = [];
var _lastTicks = -1;
var _lastEng = -1;
var _lastSlow = -1;
var dragTrackRect = null;
var dragSnap = null;
var dragRafId = null;
var lastSnap = null;
var _lastShownIdx = -1;
var _lastFillCss = "";
var _lastFillBg = "";
var _knobTf = false;
var _rAF = function (f) { return win && win.requestAnimationFrame ? win.requestAnimationFrame(f) : null; };
var _cAF = function (id) { if (id !== null && win && win.cancelAnimationFrame) win.cancelAnimationFrame(id); };
var _st = function (f, ms) { return (win && win.setTimeout || setTimeout)(f, ms); }, _ct = function (id) { if (id) (win && win.clearTimeout || clearTimeout)(id); };
var _cT = function () { if (_clTm !== null) { _ct(_clTm); _clTm = null; } };
function nowMs() {
return win && win.performance && typeof win.performance.now === "function" ? win.performance.now() : Date.now();
}
function readSeatSnapshot() {
var _p = seat && typeof seat._read === "function" ? seat._read() : null, _s = _p || seat;
var rawLevels = (_s && (Array.isArray(_s.effortLevels) ? _s.effortLevels : Array.isArray(_s.levels) ? _s.levels : []) || []).slice();
var levels = rawLevels.map(function (item) {
var key = extractEffortKey(item);
return { raw: item, effort: key, label: _extEffLbl(item, key, _s) };
});
var count = levels.length, curEffort = extractEffortKey(_s && _s.currentEffort), officialIndex = 0;
for (var i = 0; i < count; i += 1) {
if (String(levels[i].effort).toLowerCase() === String(curEffort).toLowerCase()) { officialIndex = i; break; }
}
var locked = Boolean((_s && _s.locked) || count <= 1), stops = energyStopsFor(levels);
var baseName = (_s && (_s.baseName || _s.modelName)) || "", isClaude = Boolean((_s && _s.isClaude) || isClaudeModel(baseName));
return {
baseName: baseName, isClaude: isClaude, theme: (_s && _s.theme) || (isClaude ? "claude" : "codex"),
levels: levels, count: count, officialIndex: officialIndex, locked: locked,
energyStart: stops.start, energyEnd: stops.end, hasOffFirst: stops.hasOffFirst
};
}
function currentShownIndex(snap) {
if (dragging && draftIndex !== null) return draftIndex;
if (snapIndex !== null) return snapIndex;
return snap.officialIndex;
}
function ensureMotion(snap) {
if (!motionState) {
var initPct = pctFromIndex(currentShownIndex(snap), snap.count);
motionState = {
x: initPct,
v: 0,
a: 0,
target: initPct
};
}
return motionState;
}
function _rowEl() {
return opts.row || (container.closest && container.closest('.ces-ag-effort-row,[data-ces-effort-row="true"],[role="menuitem"]'));
}
function _reAnim(el, cls, k, ms) {
if (!el || !el.classList || destroyed) return;
var cl = el.classList, tk = k + "t", rk = k + "r", had = false;
_ct(el[tk]); el[tk] = null;
if (el[rk]) { _cAF(el[rk]); el[rk] = null; }
cls.forEach(function (c) { if (cl.contains(c)) { had = true; cl.remove(c); } });
var run = function () {
el[rk] = null;
if (destroyed || !el.classList) return;
cls.forEach(function (c) { cl.add(c); });
el[tk] = _st(function () { if (el.classList) cls.forEach(function (c) { cl.remove(c); }); el[tk] = null; }, ms);
};
var r = had ? _rAF(run) : null;
if (r !== null) el[rk] = r; else run();
}
function _syncValOnly(snap, safeIdx) {
var count = snap.count, levelItem = snap.levels[safeIdx], label = levelItem ? levelItem.label : "";
var isMax = !snap.locked && count > 1 && safeIdx === count - 1 && !isOffLevel(label), rowEl = _rowEl();
if (rowEl) {
_sa(rowEl, "data-ces-effort-row", "true");
if (isMax) _sa(rowEl, "data-ces-max", "true");
else if (rowEl.hasAttribute("data-ces-max")) rowEl.removeAttribute("data-ces-max");
}
var valEl = opts.valueElement || (rowEl && findValueElement(rowEl));
if (valEl) {
var had = typeof valEl.__cesLastLabel === "string", curVal = valEl.textContent || "", eff = levelItem && levelItem.effort;
var nk = _normEffTxt(label) || _normEffTxt(eff) || String(label || eff || "").trim().toLowerCase();
var chg = Boolean(label) && !(had && (_sameEffTxt(valEl.__cesLastLabel, label) || (valEl.__cesLastKey && nk && valEl.__cesLastKey === nk)));
var ka = _normEffTxt(curVal);
if (chg || (label && (!curVal.trim() || (ka && !_sameEffTxt(curVal, label))))) {
valEl.__cesLastLabel = label; valEl.__cesLastKey = nk;
if (!_sameEffTxt(curVal, label)) valEl.textContent = label;
if (had && chg && !isPrismMotionOff(doc, win)) _reAnim(valEl, ["ces-text-rise", "is-claude-changing"], "_c", 260);
}
var vColor = snap.locked ? "" : valueColorFor(label, safeIdx, count, isMax, snap.hasOffFirst, snap.isClaude, resolvePrismAccentTone(doc, win)) || "";
if (valEl.style && valEl.style.color !== vColor) valEl.style.color = vColor;
}
return { label: label, isMax: isMax, levelItem: levelItem };
}
function _syncHeadTrig(snap, showIdx) {
var count = snap.count;
var safeIdx = Math.max(0, Math.min(Math.max(0, count - 1), showIdx));
if (dragging) {
if (safeIdx === _lastShownIdx) return;
_lastShownIdx = safeIdx;
_syncValOnly(snap, safeIdx);
return;
}
_lastShownIdx = safeIdx;
var st = _syncValOnly(snap, safeIdx);
syncTriggerColor(doc, st.label, safeIdx, count, st.isMax, snap.hasOffFirst, snap.isClaude);
if (typeof opts.onVisualChange === "function") {
try {
opts.onVisualChange({
index: safeIdx,
count: count,
label: st.label,
effort: st.levelItem ? st.levelItem.effort : "",
isMax: st.isMax,
locked: snap.locked
});
} catch (err) {}
}
}
function renderTicks(snap, effectivePct) {
var tickMode = readSettings(win).ticks || "highlight", count = snap.count;
if (tickMode === "hidden" || count <= 1) { if (ticksEl.style.display !== "none") ticksEl.style.display = "none"; return; }
if (ticksEl.style.display !== "") ticksEl.style.display = "";
if (_lastTicks !== count) {
ticksEl.innerHTML = ""; tickNodes = [];
for (var i = 0; i < count; i += 1) {
var tick = _ce("span", "ces-tick", "tick", ticksEl), tp = pctFromIndex(i, count);
tick.style.left = knobOffsetOf(tp, KNOB_RADIUS);
tickNodes.push({ el: tick, pct: tp });
}
_lastTicks = count;
}
for (var j = 0; j < tickNodes.length; j += 1) {
var node = tickNodes[j], nc = tickMode === "dim" ? "ces-tick is-dim" : effectivePct + 1e-4 >= node.pct ? "ces-tick is-on" : "ces-tick";
if (node.el.className !== nc) node.el.className = nc;
}
}
var cachedTrackRect = null;
var cachedTrackRectAt = 0;
var cachedSurfaceDark = true;
var cachedSurfaceDarkAt = 0;
var lastClaudePaintAt = 0;
var cachedClaudeCtx = null;
function _stopClRaf() { _cAF(claudeRafId); _cT(); claudeRafId = cachedTrackRect = null; cachedTrackRectAt = lastClaudePaintAt = 0; }
function _clOff() { return destroyed || _isBgWin() || isPrismMotionOff(doc, win); }
function _schedCl(ms) {
if (_clTm === null && claudeRafId === null) _clTm = _st(function () { _clTm = null; if (!_clOff() && claudeIntensity > 0) _startClRaf(); }, ms);
}
function _isBgWin() {
var r = doc && doc.documentElement, k = "data-ag-cs-win-blur", v = r && r.getAttribute && r.getAttribute(k);
return !!(doc && (doc.hidden || v === "1" || (r && r.hasAttribute && r.hasAttribute(k) && v !== "0")));
}
function _trkRect(now) {
var r = dragging && dragTrackRect && dragTrackRect.width > 0 ? dragTrackRect : cachedTrackRect;
if (!r || (!dragging && now && now - cachedTrackRectAt > 250)) {
r = trackEl.getBoundingClientRect ? trackEl.getBoundingClientRect() : null;
if (r && r.width > 0) { cachedTrackRect = r; cachedTrackRectAt = now || nowMs(); if (dragging) dragTrackRect = r; }
}
return r;
}
function stepClaudeCanvas(nowTs) {
claudeRafId = null;
if (_clOff()) { _stopClRaf(); return; }
var snap = (dragging && dragSnap) || lastSnap || readSeatSnapshot();
if (!snap.isClaude || snap.locked || claudeIntensity <= 0) { _stopClRaf(); return; }
var now = typeof nowTs === "number" && nowTs > 0 ? nowTs : nowMs(), X = Math.max, N = Math.min, R = Math.round;
var pr = N(1, X(0, now - claudeAnimStart) / CLAUDE_SWEEP_MS), iq = motionMode(win, null, doc) === "quick", idle = !dragging && pr >= 1, gap = idle ? (claudeIntensity >= 0.7 ? 32 : 50) : 15.5;
if (lastClaudePaintAt > 0 && now - lastClaudePaintAt < gap) {
if (idle && !iq) _schedCl(X(1, Math.ceil(gap - (now - lastClaudePaintAt))));
else claudeRafId = _rAF(stepClaudeCanvas);
return;
}
lastClaudePaintAt = now;
claudeFlowTime += (claudeLastTs > 0 ? N(0.05, X(0, (now - claudeLastTs) / 1000)) : 0) * claudeSpeed;
claudeLastTs = now;
if (now - cachedSurfaceDarkAt > 300 || !cachedSurfaceDarkAt) { cachedSurfaceDark = surfaceIsDark(win, doc); cachedSurfaceDarkAt = now; }
var rect = _trkRect(now), tW = trackEl.clientWidth || (rect && rect.width > 0 ? rect.width : 280), th = trackEl.clientHeight || (rect && rect.height > 0 ? R(rect.height) : 28);
var dpr = X(1, N(3, (win && +win.devicePixelRatio) || 1)), fw = X(1, R(tW)), bw = X(1, R(fw * dpr)), bh = X(1, R(th * dpr)), cv = claudeCanvasEl, cs = cv.style;
var tw = X(1, N(fw, R(KNOB_RADIUS + (tW - KNOB_RADIUS * 2) * (motionState ? clamp01(motionState.x) : 0))));
if (cv.width !== bw) cv.width = bw;
if (cv.height !== bh) cv.height = bh;
if (cs.width !== fw + "px") cs.width = fw + "px";
if (cs.height !== th + "px") cs.height = th + "px";
var cctx = cachedClaudeCtx || (cv.getContext && (cachedClaudeCtx = cv.getContext("2d")));
if (cctx) {
if (cctx.setTransform) cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
var clp = tw < fw && cctx.save && cctx.rect && cctx.clip;
if (tw < fw) cctx.clearRect(tw, 0, fw - tw + 1, th + 1);
if (clp) { cctx.save(); cctx.beginPath(); cctx.rect(0, 0, tw, th); cctx.clip(); }
paintDither(cctx, tw, th, cachedSurfaceDark, pr, claudeFlowTime, claudeIntensity);
if (clp) cctx.restore();
}
if (idle) { if (iq) _stopClRaf(); else _schedCl(gap); return; }
claudeRafId = _rAF(stepClaudeCanvas);
}
function _startClRaf() {
if (_clOff()) { _stopClRaf(); return; }
if (dragging) _cT();
if (claudeRafId !== null || _clTm !== null) return;
claudeRafId = _rAF(stepClaudeCanvas);
if (claudeRafId === null) stepClaudeCanvas(nowMs());
}
function applyVisualPct(snap, effectivePct, showIdx) {
lastSnap = snap;
var p = clamp01(effectivePct), count = snap.count, safeIdx = Math.max(0, Math.min(Math.max(0, count - 1), showIdx));
var levelItem = snap.levels[safeIdx], label = levelItem ? levelItem.label : "", theme = snap.theme || "codex";
_sa(rootEl, "data-theme", theme);
_sa(trackEl, "data-theme", theme);
_sa(rootEl, "tabindex", "-1");
_sa(rootEl, "aria-valuemin", "0");
_sa(rootEl, "aria-valuemax", String(Math.max(0, count - 1)));
_sa(rootEl, "aria-valuenow", String(safeIdx));
_sa(rootEl, "aria-valuetext", label);
_sa(rootEl, "aria-disabled", snap.locked ? "true" : "false");
if (snap.locked) { if (!trackEl.classList.contains("is-locked")) trackEl.classList.add("is-locked"); }
else if (trackEl.classList.contains("is-locked")) trackEl.classList.remove("is-locked");
var curTone = resolvePrismAccentTone(doc, win), motOff = isPrismMotionOff(doc, win);
var offsetCss = knobOffsetOf(p, KNOB_RADIUS), fillBg = fillBackgroundFor(p, snap.energyStart, snap.energyEnd, snap.isClaude, curTone);
if (offsetCss !== _lastFillCss) { _lastFillCss = offsetCss; trackEl.style.setProperty("--ces-fill", offsetCss); }
if (fillBg !== _lastFillBg) { _lastFillBg = fillBg; trackEl.style.setProperty("--ces-fill-bg", fillBg); }
var kW = dragging ? (_dLW || trackEl.clientWidth || (dragTrackRect && dragTrackRect.width) || 0) : 0;
if (kW > 0) {
if (!_knobTf) { knobEl.style.left = "0px"; _knobTf = true; }
knobEl.style.transform = "translate3d(" + (KNOB_RADIUS + (kW - KNOB_RADIUS * 2) * p).toFixed(1) + "px,0,0)";
} else if (_knobTf) { knobEl.style.left = knobEl.style.transform = ""; _knobTf = false; }
claudeIntensity = !motOff && curTone !== "mono" && snap.isClaude && !snap.locked && count > 1 ? claudeIntensityFor(p, snap.energyStart) : 0;
claudeSpeed = claudeSpeedFor(p, snap.energyStart);
if (claudeIntensity > 0) {
if (claudeCanvasEl.style.display !== "block") { claudeCanvasEl.style.display = "block"; claudeAnimStart = nowMs(); claudeLastTs = 0; }
_startClRaf();
} else {
if (claudeCanvasEl.style.display !== "none") claudeCanvasEl.style.display = "none";
_stopClRaf();
}
var energy = snap.locked || motOff ? 0 : energyForPct(p, snap.energyStart), slowdown = motionMode(win, null, doc) === "quick" ? _RM_SLOW : 1;
if (Math.abs(energy - _lastEng) > 1e-5 || slowdown !== _lastSlow) {
_lastEng = energy; _lastSlow = slowdown;
_sa(rootEl, "data-energy", energy > 0 ? "1" : "0");
rootEl.style.setProperty("--ces-energy", String(Math.round(energy * 1000) / 1000));
var slo = String(starLayerOpacityFor(energy)), vc = Math.round(energy * PARTICLES.length), sf = speedFor(p, snap.energyStart);
trackEl.style.setProperty("--ces-star-opacity", slo);
starsEl.style.opacity = slo;
starsEl.setAttribute("data-count", String(vc));
for (var i = 0; i < starNodes.length; i += 1) {
var st = starNodes[i].el.style, dur = starDurationFor(i, sf) * slowdown;
st.display = i < vc ? "" : "none";
st.animationDuration = dur.toFixed(3) + "s";
st.animationDelay = starDelayFor(i, dur).toFixed(3) + "s";
}
}
renderTicks(snap, p);
_syncHeadTrig(snap, safeIdx);
}
function stopFrames() { _cAF(rafId); rafId = null; lastFrameMs = 0; }
function stepFrame(ts) {
rafId = null;
if (destroyed) return;
var snap = readSeatSnapshot(), m = ensureMotion(snap), params = motionParamsForMode(motionMode(win, null, doc));
var now = typeof ts === "number" && ts > 0 ? ts : nowMs();
motionStep(m, lastFrameMs > 0 ? (now - lastFrameMs) / 1000 : 1 / 60, params);
lastFrameMs = now;
applyVisualPct(snap, m.x, currentShownIndex(snap));
if (!motionSettled(m, params)) startFrames();
else {
m.x = clamp01(m.target); m.v = m.a = 0;
if (!dragging) snapIndex = null;
applyVisualPct(snap, m.x, currentShownIndex(snap));
}
}
function startFrames() {
if (destroyed || rafId !== null) return;
rafId = _rAF(stepFrame);
if (rafId === null) stepFrame(nowMs());
}
function clearMaxEffects() {
var valEl = opts.valueElement || findValueElement(_rowEl());
if (valEl) {
_ct(valEl._gt); valEl._gt = null;
if (valEl._gr) { _cAF(valEl._gr); valEl._gr = null; }
if (valEl.classList) valEl.classList.remove("is-glowing");
}
}
function triggerMaxEffects(isClaude) {
if (isPrismMotionOff(doc, win)) return;
var valEl = opts.valueElement || findValueElement(_rowEl());
if (valEl && valEl.classList) {
if (valEl.style && valEl.style.setProperty) valEl.style.setProperty("--ces-glow-color", isClaude ? "rgba(196, 181, 253, 0.9)" : "rgba(168, 85, 247, 0.9)");
_reAnim(valEl, ["is-glowing"], "_g", 450);
}
}
/**
* 立即把目标档位写回宿主（Antigravity React Fiber 或 Seat）：
* 拖过档位边界时同步触发，无需等待 pointerup 松手。
*/
function commitAtIndex(targetIndex, reason) {
var snap = readSeatSnapshot();
if (snap.locked || snap.count <= 1) return;
var idx = Math.max(0, Math.min(snap.count - 1, targetIndex)), item = snap.levels[idx];
if (!item) return;
var isNowMax = idx === snap.count - 1 && !isOffLevel(item.label), wasMax = _lastCmtIdx === snap.count - 1;
_lastCmtIdx = idx;
tracePush("commit", { reason: reason || "drag", index: idx, effort: item.effort, label: item.label });
if (isNowMax && !wasMax) triggerMaxEffects(snap.isClaude);
else if (!isNowMax && wasMax) clearMaxEffects();
if (seat && typeof seat.selectEffort === "function") {
try { seat.selectEffort(item.raw !== undefined ? item.raw : item.effort, idx); }
catch (err) { tracePush("commit-error", { message: String(err && err.message ? err.message : err) }); }
}
if (typeof opts.onCommit === "function") try { opts.onCommit(item, idx, reason || "drag"); } catch (err) {}
}
function _cancelDragRaf() { _cAF(dragRafId); dragRafId = null; }
function pctAtClientX(clientX) {
var rect = _trkRect(0);
return rect && rect.width > 0 ? clamp01((clientX - rect.left - KNOB_RADIUS) / Math.max(1, rect.width - KNOB_RADIUS * 2)) : null;
}
function _flushDragVisual() {
dragRafId = null;
if (destroyed || !dragging) return;
var ds = dragSnap || readSeatSnapshot(), dm = ensureMotion(ds);
applyVisualPct(ds, dm.x, draftIndex !== null ? draftIndex : ds.officialIndex);
}
function moveToClientX(clientX, isInitialDown) {
var snap = (dragging && dragSnap) || readSeatSnapshot();
if (snap.locked || snap.count <= 0) return;
var ptrPct = pctAtClientX(clientX);
if (ptrPct === null) ptrPct = pctFromIndex(snap.officialIndex, snap.count);
var now = nowMs();
if (lastPtrPct !== null && lastPtrMs > 0) {
var dt = (now - lastPtrMs) / 1000;
if (dt > 1e-4 && dt < 0.25) ptrSpeed = ptrSpeed * (1 - _PS_EMA) + ((ptrPct - lastPtrPct) / dt) * _PS_EMA;
} else ptrSpeed = 0;
lastPtrPct = ptrPct; lastPtrMs = now;
var nowIndex;
if (motionMode(win, null, doc) === "fast") {
nowIndex = isInitialDown ? indexFromPct(ptrPct, snap.count) : detentTargetIndex(detentIndex >= 0 && detentIndex < snap.count ? detentIndex : snap.officialIndex, ptrPct, snap.count);
detentIndex = detentTargetIndex(nowIndex, ptrPct, snap.count) === nowIndex ? nowIndex : ptrPct < pctFromIndex(nowIndex, snap.count) ? Math.max(0, nowIndex - 1) : Math.min(snap.count - 1, nowIndex + 1);
} else nowIndex = indexFromPct(ptrPct, snap.count);
draftPct = ptrPct; draftIndex = nowIndex;
var m = ensureMotion(snap);
m.x = m.target = ptrPct; m.v = m.a = 0;
stopFrames();
if (isInitialDown || !win || typeof win.requestAnimationFrame !== "function") {
_cancelDragRaf();
applyVisualPct(snap, ptrPct, nowIndex);
} else {
if (nowIndex !== _lastShownIdx) { _lastShownIdx = nowIndex; _syncValOnly(snap, nowIndex); }
if (dragRafId === null) dragRafId = _rAF(_flushDragVisual);
}
}
function _settle(snap, idx, imm, startX) {
var m = ensureMotion(snap), tgt = pctFromIndex(idx, snap.count);
m.target = tgt;
if (imm) {
m.x = tgt; m.v = m.a = 0; snapIndex = null; stopFrames();
applyVisualPct(snap, m.x, idx);
} else {
if (typeof startX === "number") { m.x = startX; m.v = m.a = 0; }
applyVisualPct(snap, m.x, idx);
startFrames();
}
}
function endDrag(clientX) {
if (!dragging) return;
_cancelDragRaf();
var snap = dragSnap || readSeatSnapshot();
var ptrPct = draftPct !== null ? draftPct : pctFromIndex(snap.officialIndex, snap.count);
if (typeof clientX === "number") {
var p = pctAtClientX(clientX);
if (p !== null) ptrPct = p;
}
var mode = motionMode(win, null, doc), finalIndex;
if (mode === "fast") finalIndex = detentTargetIndex(detentIndex >= 0 && detentIndex < snap.count ? detentIndex : snap.officialIndex, ptrPct, snap.count);
else if (mode === "quick") finalIndex = indexFromPct(ptrPct, snap.count);
else finalIndex = releaseIndexFor(ptrPct, ptrSpeed, lastPtrMs > 0 ? Math.max(0, (nowMs() - lastPtrMs) / 1000) : 1, snap.count);
dragging = buttonDown = false;
dragTrackRect = dragSnap = draftPct = draftIndex = lastPtrPct = null;
_dLW = 0;
detentIndex = _lastShownIdx = -1;
ptrSpeed = 0;
snapIndex = finalIndex;
if (finalIndex !== snap.officialIndex) commitAtIndex(finalIndex, "release");
_settle(readSeatSnapshot(), finalIndex, mode === "quick", ptrPct);
}
function swallowEvent(ev) { if (ev && typeof ev.stopPropagation === "function") ev.stopPropagation(); }
function onPointerDown(ev) {
if (ev && typeof ev.button === "number" && ev.button !== 0) return;
var snap = readSeatSnapshot();
if (snap.locked || snap.count <= 1) return;
swallowEvent(ev);
if (typeof ev.preventDefault === "function") ev.preventDefault();
dragging = buttonDown = true;
dragSnap = snap;
dragTrackRect = trackEl.getBoundingClientRect ? trackEl.getBoundingClientRect() : null;
_dLW = trackEl.clientWidth || (dragTrackRect && dragTrackRect.width) || 0;
if (dragTrackRect && dragTrackRect.width > 0) { cachedTrackRect = dragTrackRect; cachedTrackRectAt = nowMs(); }
_lastCmtIdx = detentIndex = snap.officialIndex;
snapIndex = lastPtrPct = null;
try { if (trackEl.setPointerCapture && ev.pointerId !== undefined) trackEl.setPointerCapture(ev.pointerId); } catch (err) {}
moveToClientX(ev.clientX, true);
}
function onPointerMove(ev) {
if (!dragging || (ev && ev.buttons === 0 && !buttonDown)) return;
swallowEvent(ev);
moveToClientX(ev.clientX, false);
}
function onPointerUp(ev) {
if (!dragging) return;
swallowEvent(ev);
buttonDown = false;
try { if (trackEl.releasePointerCapture && ev && ev.pointerId !== undefined) trackEl.releasePointerCapture(ev.pointerId); } catch (err) {}
endDrag(ev && typeof ev.clientX === "number" ? ev.clientX : undefined);
}
function onPointerCancel(ev) {
if (!dragging) return;
if (!ev || ev.type !== "blur") swallowEvent(ev);
buttonDown = false;
endDrag();
}
function onKeyDown(ev) {
var snap = readSeatSnapshot();
if (snap.locked || snap.count <= 1) return;
var key = ev && ev.key, curIdx = currentShownIndex(snap), nextIdx = null;
if (key === "ArrowLeft" || key === "ArrowDown") nextIdx = Math.max(0, curIdx - 1);
else if (key === "ArrowRight" || key === "ArrowUp") nextIdx = Math.min(snap.count - 1, curIdx + 1);
else if (key === "Home") nextIdx = 0;
else if (key === "End") nextIdx = snap.count - 1;
else return;
swallowEvent(ev);
if (typeof ev.preventDefault === "function") ev.preventDefault();
snapIndex = nextIdx;
commitAtIndex(nextIdx, "key");
_settle(readSeatSnapshot(), nextIdx, motionMode(win, null, doc) === "quick");
}
function onBlockMenuClose(ev) { swallowEvent(ev); }
var _trkEvs = [["pointerdown", onPointerDown], ["pointermove", onPointerMove], ["pointerup", onPointerUp], ["pointercancel", onPointerCancel], ["lostpointercapture", onPointerCancel], ["click", onBlockMenuClose], ["mouseup", onBlockMenuClose]];
for (var _ei = 0; _ei < _trkEvs.length; _ei += 1) trackEl.addEventListener(_trkEvs[_ei][0], _trkEvs[_ei][1]);
rootEl.addEventListener("keydown", onKeyDown);
function onWinResize() { dragTrackRect = cachedTrackRect = null; _dLW = cachedTrackRectAt = 0; }
function _wEv(m) { if (win && win[m]) { win[m]("resize", onWinResize); win[m]("blur", onPointerCancel); } }
_wEv("addEventListener");
function syncFromExternal() {
if (destroyed || dragging) return;
var snap = readSeatSnapshot(), m = ensureMotion(snap), idx = snap.officialIndex, mode = motionMode(win, null, doc);
m.target = pctFromIndex(idx, snap.count);
_settle(snap, idx, snap.locked || mode === "quick" || motionSettled(m, motionParamsForMode(mode)));
}
var offSeat =
seat && typeof seat.subscribe === "function"
? seat.subscribe(function () {
syncFromExternal();
})
: function () {};
var offSettings = onSettingsChange(function () {
var snap = readSeatSnapshot();
var m = ensureMotion(snap);
applyVisualPct(snap, m.x, currentShownIndex(snap));
}, win);
// 首次同步渲染
var initSnap = readSeatSnapshot();
var initMotion = ensureMotion(initSnap);
initMotion.x = pctFromIndex(initSnap.officialIndex, initSnap.count);
initMotion.target = initMotion.x;
applyVisualPct(initSnap, initMotion.x, initSnap.officialIndex);
return {
unmount: function () {
destroyed = true;
stopFrames();
_cancelDragRaf();
_stopClRaf();
cachedClaudeCtx = null;
dragTrackRect = dragSnap = lastSnap = null;
_dLW = 0;
clearMaxEffects();
var valEl = opts.valueElement || findValueElement(_rowEl());
if (valEl) {
_ct(valEl._ct); valEl._ct = null;
if (valEl._cr) { _cAF(valEl._cr); valEl._cr = null; }
if (valEl.classList) { valEl.classList.remove("ces-text-rise", "is-claude-changing"); }
delete valEl.__cesLastLabel;
delete valEl.__cesLastKey;
}
if (typeof offSeat === "function") offSeat();
if (typeof offSettings === "function") offSettings();
_wEv("removeEventListener");
for (var _ri = 0; _ri < _trkEvs.length; _ri += 1) trackEl.removeEventListener(_trkEvs[_ri][0], _trkEvs[_ri][1]);
rootEl.removeEventListener("keydown", onKeyDown);
if (rootEl.parentNode === container) {
container.removeChild(rootEl);
}
},
refresh: function () {
syncFromExternal();
}
};
}
// ── 通用菜单观察器（兼容预置「推理等级」行的 DOM 结构与独立预览页） ────────────
function installMenuObserver(options) {
var o = options || {}, d = o.document || (typeof document !== "undefined" ? document : null);
var w = o.window || d?.defaultView || (typeof window !== "undefined" ? window : globalRoot);
var onC = typeof o.onChange === "function" ? o.onChange : () => {};
if (!d?.body) return { stop: () => {}, rescan: () => {}, getCurrent: () => null };
var cur = null, obs = null, SKS = ["height", "flexWrap", "paddingTop", "paddingBottom"];
var detach = () => {
if (!cur) return;
var prev = cur; cur = null;
try {
prev.container?.parentNode?.removeChild(prev.container);
if (prev.row && prev.previousStyle) SKS.forEach((k) => { prev.row.style[k] = prev.previousStyle[k]; });
} catch {}
onC(null);
};
var scan = () => {
if (findAntigravityPanel(d) || findAntigravityTrigger(d)) return;
var row = findInferenceRow(d);
if (!row) { if (cur) detach(); return; }
if (cur && cur.row === row && cur.container && row.contains(cur.container)) return;
if (cur) detach();
var ps = {}; SKS.forEach((k) => { ps[k] = row.style[k] || ""; });
row.setAttribute("data-ces-effort-row", "true");
Object.assign(row.style, { height: "auto", flexWrap: "wrap", paddingTop: "8px", paddingBottom: "8px" });
var valEl = findValueElement(row), host = d.createElement("div");
host.className = "ces-inline"; host.setAttribute("data-ces-part", "host");
row.appendChild(host);
cur = { row, container: host, value: valEl ? (valEl.textContent || "").trim() : "", previousStyle: ps };
onC(cur);
};
scan();
var MO = o.MutationObserver || w?.MutationObserver || (typeof MutationObserver === "function" ? MutationObserver : null);
if (typeof MO === "function") { obs = new MO(scan); obs.observe(d.body, { childList: true, subtree: true }); }
return { stop: () => { obs?.disconnect(); obs = null; detach(); }, rescan: scan, getCurrent: () => cur };
}
// ── Antigravity 原生模型选择器深度桥接器 ───────────────────────────────────
var EFFORT_MEMORY_KEY = "ag.prism.effortMemory.v1", _EFF_V = Object.create(null);
AG_EFFORT_ORDER.forEach((k) => { _EFF_V[k] = 1; });
function _loadEffMem(w) {
var o = { models: new Map(), orch: new Map() }, s = resolveStorage(w);
if (!s) return o;
try {
var p = JSON.parse(s.getItem(EFFORT_MEMORY_KEY) || "null");
var f = (src, dst) => { if (!src || typeof src !== "object") return; for (var k of Object.keys(src)) { if (dst.size >= 64) break; var kk = k.trim(), v = String(src[k] || "").trim().toLowerCase(); if (kk && _EFF_V[v]) dst.set(kk, v); } };
if (p && typeof p === "object") { f(p.models, o.models); f(p.orch, o.orch); }
} catch {}
return o;
}
function _saveEffMem(w, m1, m2) {
var s = resolveStorage(w);
if (!s) return;
try {
var d = (m) => { var o = Object.create(null), a = m ? Array.from(m.entries()) : []; for (var i = Math.max(0, a.length - 64); i < a.length; i++) { var k = String(a[i][0] || "").trim(), v = String(a[i][1] || "").trim().toLowerCase(); if (k && _EFF_V[v]) o[k] = v; } return o; };
s.setItem(EFFORT_MEMORY_KEY, JSON.stringify({ v: 1, models: d(m1), orch: d(m2) }));
} catch {}
}
function _setTxtNode(el, s, fd) {
var txt = String(s == null ? "" : s);
if (!el || el.textContent === txt) return;
var tNodes = [], cn = el.childNodes;
if (cn?.length) { for (var i = 0; i < cn.length; i++) if (cn[i]?.nodeType === 3) tNodes.push(cn[i]); }
else if (el.firstChild?.nodeType === 3) tNodes.push(el.firstChild);
if (tNodes.length === 1) { tNodes[0].nodeValue = txt; return; }
if (tNodes.length >= 2) {
var last = tNodes.length - 1, lead = txt[0] === " " && /^\s*$/.test(tNodes[0].nodeValue || "");
if (lead && tNodes[0].nodeValue !== " ") tNodes[0].nodeValue = " ";
for (var k = lead ? 1 : 0; k < (txt ? last : tNodes.length); k++) if (tNodes[k].nodeValue !== "") tNodes[k].nodeValue = "";
if (txt) { var tail = lead ? txt.slice(1) : txt; if (tNodes[last].nodeValue !== tail) tNodes[last].nodeValue = tail; }
return;
}
if (!txt) { if (!cn?.length && !el.children?.length) el.textContent = ""; return; }
var d = el.ownerDocument || fd;
if (d?.createTextNode && el.appendChild) el.appendChild(d.createTextNode(txt));
else if (!el.children?.length) el.textContent = txt;
}
function _setEffTxtNode(el, s, fd) {
if (!el) return;
var txt = String(s == null ? "" : s), cur = el.textContent || "", ka = _normEffTxt(cur), kb = _normEffTxt(txt);
if (!txt.trim()) { el.__cesLastText = txt; if (cur !== txt) _setTxtNode(el, txt, fd); return; }
if (cur.trim() && ((ka && kb && ka === kb) || (el.__cesLastText === txt && !(ka && kb && ka !== kb)))) { el.__cesLastText = txt; return; }
el.__cesLastText = txt;
_setTxtNode(el, txt, fd);
}
function installAntigravityObserver(options) {
var opts = options || {}, doc = opts.document || (typeof document !== "undefined" ? document : null);
var win = opts.window || doc?.defaultView || (typeof window !== "undefined" ? window : globalRoot);
var memOnly = Boolean(opts.memoryOnly);
if (!doc?.body) return { stop: () => {}, rescan: () => {}, setRememberEffort: () => {}, getMemory: () => ({ models: {}, orch: {} }) };
if (!memOnly) installStyles(doc);
var rememberEffort = memOnly ? true : opts.rememberEffort !== false;
var _loadedMem = rememberEffort ? _loadEffMem(win) : { models: new Map(), orch: new Map() };
var _effMap = _loadedMem.models, _orchEffMap = _loadedMem.orch;
var _curEffMap = () => (rememberEffort ? _effMap : null);
var _recEff = (m, b, e) => { if (!rememberEffort || !b || !e || !_EFF_V[e] || m.get(b) === e) return; m.set(b, e); _saveEffMem(win, _effMap, _orchEffMap); };
var lk = null, qM = typeof queueMicrotask === "function" ? queueMicrotask : (fn) => Promise.resolve().then(fn);
var activeMount = null;
var activePanel = null;
var activeSection = null;
var activeRow = null;
var activeValueEl = null;
var activeHostEl = null;
var _seatLs = new Set();
var activeBaseOverride = null;
var _actOptOvr = null;
var _orchPlanOvr = null;
var _lastHostLbl = "";
var _boundSubs = new Set();
var _hiddenL3 = new Map();
var observer = null;
var _intMut = false;
function _setTxt(el, s) { _setTxtNode(el, s, doc); }
function _setEffTxt(el, s) { _setEffTxtNode(el, s, doc); }
function notifySeatListeners() { _seatLs.forEach(function (fn) { try { fn(); } catch (e) {} }); }
function _withMut(fn) {
_intMut = true;
try { return fn(); }
finally { try { if (observer && observer.takeRecords) observer.takeRecords(); } catch (e) {} _intMut = false; }
}
function _hasValidCtx(c) { return Boolean(c && ((c.effortIndex && c.effortIndex.size > 0) || (c.orchPlanners && c.orchPlanners.length > 0))); }
function _setReady(on) {
var r = doc && doc.documentElement;
if (!r) return;
if (on) { if (r.setAttribute && r.getAttribute("data-ces-slider-ready") !== "1") r.setAttribute("data-ces-slider-ready", "1"); }
else if (r.removeAttribute && (!r.hasAttribute || r.hasAttribute("data-ces-slider-ready"))) r.removeAttribute("data-ces-slider-ready");
}
function getLiveContext() {
var p = findAntigravityPanel(doc), t = findAntigravityTrigger(doc);
return (p && _rdAgFiber(p)) || (t && _rdAgFiber(t)) || null;
}
function getActiveProfile(ctx) {
return ctx ? resolveModelEffortProfile(ctx, _actOptOvr || activeBaseOverride || ctx.selectedModel, _curEffMap(), _orchPlanOvr) : null;
}
/**
* 立即同步更新：
* 1. 底部 Composer 折叠触发按钮的模型名与档位颜色
* 2. 展开菜单中每一行模型右侧的档位文字与颜色、以及选中态高亮
*/
function _syncAgDom(ctx, activeProfile) {
var profile = ctx && (activeProfile || getActiveProfile(ctx));
if (!profile) return;
if (!profile.locked && profile.baseName && profile.currentEffort) {
if (profile.isOrchestrator) _recEff(_orchEffMap, profile.baseName, profile.currentEffort);
else _recEff(_effMap, profile.baseName, profile.currentEffort);
}
var count = profile.levels.length, idx = profile.currentIndex, isMax = !profile.locked && count > 1 && idx === count - 1 && !isOffLevel(profile.currentLabel);
var _sa = (el, k, v) => { if (el && el.getAttribute(k) !== v) el.setAttribute(k, v); };
var triggerBtn = findAntigravityTrigger(doc);
if (triggerBtn) {
if (profile.isOrchestrator && profile.orchestratorTunable) _sa(triggerBtn, "data-ces-orch-b", profile.isClaude ? "claude" : "gemini");
else triggerBtn.removeAttribute("data-ces-orch-b");
var outerSpan = !profile.isOrchestrator && triggerBtn.querySelector("span.min-w-0");
if (outerSpan) {
var effortSpan = outerSpan.querySelector("span.opacity-70, [data-ces-part='trigger-effort']"), firstNode = outerSpan.firstChild, expBase = "", expEff = "", hasExp = false;
if (!profile.locked && profile.baseName) { expBase = profile.baseName; expEff = " " + profile.currentLabel; hasExp = true; }
else if (profile.locked) {
var lp = profile.modelOption && parseModelLabel(profile.modelOption.label);
expBase = lp ? lp.base : profile.modelOption?.label || profile.baseName || "";
expEff = lp ? " " + lp.effortLabel : "";
hasExp = true;
}
if (hasExp) {
var selMatch = !_actOptOvr && !activeBaseOverride && ctx.selectedModel && (((!expBase || (firstNode?.nodeType === 3 && firstNode.nodeValue.trim() === expBase.trim())) && (!effortSpan || _sameEffTxt(effortSpan.textContent, expEff))) || String(outerSpan.textContent || "").replace(/\s+/g, " ").trim() === (expBase + expEff).replace(/\s+/g, " ").trim());
if (selMatch) { if (effortSpan) effortSpan.__cesLastText = expEff; }
else {
if (expBase && firstNode?.nodeType === 3 && firstNode.nodeValue !== expBase) firstNode.nodeValue = expBase;
if (effortSpan) _setEffTxt(effortSpan, expEff);
}
}
}
}
var trigLbl = profile.locked ? (profile.modelOption && parseModelLabel(profile.modelOption.label) ? profile.currentLabel : "") : profile.currentLabel;
syncTriggerColor(doc, trigLbl, idx, count, isMax, false, Boolean(profile.isClaude));
var panel = findAntigravityPanel(doc);
if (!panel) return;
var _s = (st, c) => { var o = c ? "1" : "", w = c ? "600" : ""; if (st.color !== c) st.color = c; if (st.opacity !== o) st.opacity = o; if (st.fontWeight !== w) st.fontWeight = w; };
var _mkSel = (el, on) => { if (!el) return; _sa(el, "data-ces-model-selected", String(on)); el.classList.toggle("text-foreground", on); el.classList.toggle("text-secondary-foreground", !on); };
var ob = panel.querySelector('[data-testid="orchestrator-effort-bar"]'), ot = !!(profile.isOrchestrator && profile.orchestratorTunable && !profile.locked), ao = !!(profile.isOrchestrator && !ot);
var _sh = (e, h) => { _sa(e, "data-row-hidden", "" + h); _sa(e, "aria-hidden", "" + h); };
ot ? _sa(panel, "data-ces-orch-tunable", "true") : panel.removeAttribute("data-ces-orch-tunable");
ao ? _sa(panel, "data-ag-cs-orch-active", "1") : panel.removeAttribute("data-ag-cs-orch-active");
_sh(activeRow, ao); _sh(ob, !ao);
for (var oRow of panel.querySelectorAll('[data-testid="model-selector-orchestrator"]')) {
var oM = oRow.closest?.('[role^="menuitem"]') || oRow;
_mkSel(oM, Boolean(profile.isOrchestrator));
if (oM !== oRow) _sa(oRow, "data-ces-model-selected", String(Boolean(profile.isOrchestrator)));
}
for (var gSpan of panel.querySelectorAll('[data-testid="model-selector-effort-group"]')) {
var base = gSpan.getAttribute("data-model-base") || (gSpan.textContent || "").trim(), rowProf = resolveModelEffortProfile(ctx, base, _curEffMap());
if (!rowProf) continue;
var sel = !profile.isOrchestrator && profile.baseName === base, sib = gSpan.nextElementSibling;
_mkSel(gSpan.closest('[role="menuitem"]'), sel);
if (sib?.tagName === "SPAN") {
var dE = sel ? profile.currentLabel : rowProf.currentLabel, dI = sel ? profile.currentIndex : rowProf.currentIndex, dC = rowProf.levels.length;
_setEffTxt(sib, dE);
_s(sib.style, valueColorFor(dE, dI, dC, dC > 1 && dI === dC - 1, false) || "");
}
}
for (var sItem of panel.querySelectorAll('[data-testid="model-selector-item"]')) {
var sLabel = sItem.getAttribute("data-model-label") || (sItem.textContent || "").trim();
_mkSel(sItem, !profile.isOrchestrator && (profile.modelOption?.label === sLabel || profile.baseName === sLabel));
}
}
function _curProf() { return getActiveProfile(getLiveContext()); }
function _syP() { try { win?.__agPrism?.sync?.(); } catch {} }
var agSeatAdapter = {
_read: _curProf,
get effortLevels() { return _curProf()?.levels || []; },
get currentEffort() { return _curProf()?.currentEffort || ""; },
get locked() { return _curProf()?.locked ?? true; },
get baseName() { return _curProf()?.baseName || ""; },
get isClaude() { return Boolean(_curProf()?.isClaude); },
get theme() { return _curProf()?.theme || "codex"; },
selectEffort: function (levelItem) {
var ctx = getLiveContext(), targetOpt = levelItem && (levelItem.modelOption || levelItem.raw?.modelOption);
if (!ctx || !targetOpt) return;
var curProf = getActiveProfile(ctx);
if (curProf?.isOrchestrator && curProf.orchestratorTunable) {
var opP = parseModelLabel(targetOpt.label);
if (opP) _recEff(_orchEffMap, opP.base, opP.effort);
_orchPlanOvr = targetOpt;
_commitAgOpt(ctx, targetOpt, true);
_withMut(() => { var np = resolveModelEffortProfile(ctx, _actOptOvr || ctx.selectedModel, _curEffMap(), targetOpt); _syncAgDom(ctx, np); _sySubs(activePanel, ctx, np); notifySeatListeners(); _syP(); });
return;
}
var parsed = parseModelLabel(targetOpt.label);
if (parsed) { _recEff(_effMap, parsed.base, parsed.effort); activeBaseOverride = parsed.base; }
_actOptOvr = targetOpt;
_lastHostLbl = (ctx.selectedModel && ctx.selectedModel.label) || "";
_orchPlanOvr = null;
_commitAgOpt(ctx, targetOpt);
_withMut(function () {
_syncAgDom(ctx, resolveModelEffortProfile(ctx, targetOpt, _curEffMap()));
_syP();
});
},
subscribe: function (fn) {
_seatLs.add(fn);
return function () {
_seatLs.delete(fn);
};
}
};
function _stp(ev) { ev.stopPropagation(); if (typeof ev.stopImmediatePropagation === "function") ev.stopImmediatePropagation(); }
function _okOpt(o) { return Boolean(o && !o.disabled && !o.isCustom && o.label); }
function _canCm(c) { return Boolean(c && (typeof c.setModelConfigByLabelForConversation === "function" || typeof c.unwrappedSetSelectedModel === "function" || typeof c.setCurrentModelConfigByLabel === "function")); }
function _hasOrch(c) { return Boolean(c && c.orchPick && typeof c.orchPick.select === "function" && Array.isArray(c.orchPlanners) && c.orchPlanners.length); }
function _fOrch(c) {
if (!c) return null;
if (_okOpt(c.selectedModel) && _isOrch(c.selectedModel)) return c.selectedModel;
var os = Array.isArray(c.modelOptions) ? c.modelOptions : [], f = null, dp = c.orchDef && parseModelLabel(c.orchDef.label), dt = dp ? (_slug(dp.base).split("-").pop() || "") : "";
for (var i = 0; i < os.length; i += 1) {
var o = os[i];
if (!_okOpt(o) || !_isOrch(o)) continue;
if (!f) f = o;
if (dt && _slug(o.label).indexOf(dt) !== -1) return o;
}
return f;
}
function _isDis(t, it) {
if (!t || typeof t.closest !== "function") return true;
if (t.closest('[aria-disabled="true"],[disabled]')) return true;
var d = t.closest("[data-disabled]");
return Boolean((d && d.getAttribute("data-disabled") !== "false") || (it && it.disabled));
}
function _isBox(e) {
return !e || /^(?:menu|listbox|presentation|group|dialog|status)$/.test((e.getAttribute && e.getAttribute("role")) || "") || !!(e.classList && e.classList.contains("agy-overlay"));
}
function _mPlan(it, c) {
if (!it || !_hasOrch(c)) return null;
var g = it.querySelector && it.querySelector('[data-testid="model-selector-effort-group"]');
var raw = (g && (g.getAttribute("data-model-base") || g.textContent)) || it.getAttribute("data-model-label") || it.getAttribute("data-model-base") || it.textContent || "";
var cl = String(raw).replace(/\b(?:new|notice|beta|preview|recommended|default)\b|默认|自动/gi, " ").replace(/\s+/g, " ").trim();
if (_isOrch(cl) || cl.length > 80) return null;
if (!cl) {
if (!/^(?:default|auto|默认|自动)\b/i.test(String(raw).trim())) return null;
var d = c.orchDef || c.orchPlanners[0];
return _okOpt(d) ? { opt: d, base: (parseModelLabel(d.label) || {}).base || d.label, fam: true } : null;
}
var ps = c.orchPlanners, es = _slug(cl), bp = parseModelLabel(cl), bc = bp ? bp.base : cl, sp;
if (!bp) while ((sp = bc.lastIndexOf(" ")) > 0 && /^(?:off|minimal|low|medium|high|xhigh|extra|max)$/i.test(bc.slice(sp + 1))) bc = bc.slice(0, sp).trim();
var bs = _slug(bc);
var mb = "", bl = 0, fb = null, i, p, ep;
for (i = 0; i < ps.length; i += 1) {
p = ps[i];
if (!_okOpt(p)) continue;
ep = parseModelLabel(p.label);
var ob = ep ? ep.base : p.label;
if (p.label === cl || _slug(p.label) === es) return { opt: p, base: ob, fam: false };
var os = _slug(ob);
if (os && (os === bs || (os.length > bl && (es === os || es.indexOf(os) === 0)))) { bl = os === bs ? 999 : os.length; mb = ob; fb = p; }
}
if (!mb) return null;
var by = _luEff(c.orchIdx instanceof Map && c.orchIdx.size ? c.orchIdx : c.effortIndex, mb);
if (by && by.size) {
var ok = function (k) { return k && by.has(k) && _okOpt(by.get(k)); }, cur = getActiveProfile(c), dp2 = c.orchDef && parseModelLabel(c.orchDef.label), ek = "";
if (bp && ok(bp.effort)) ek = bp.effort;
else if (rememberEffort && ok(_orchEffMap.get(mb))) ek = _orchEffMap.get(mb);
else if (cur && cur.isOrchestrator && ok(cur.currentEffort)) ek = cur.currentEffort;
else if (dp2 && _slug(dp2.base) === _slug(mb) && ok(dp2.effort)) ek = dp2.effort;
else if (ok("medium")) ek = "medium";
for (i = 0; !ek && i < AG_EFFORT_ORDER.length; i += 1) if (ok(AG_EFFORT_ORDER[i])) ek = AG_EFFORT_ORDER[i];
p = ek ? by.get(ek) : fb;
return _okOpt(p) ? { opt: p, base: mb, fam: true } : null;
}
return _okOpt(fb) ? { opt: fb, base: mb, fam: true } : null;
}
var _SUB_BOX = '[role="menu"],[role="listbox"],[data-testid="context-menu-submenu-popup"],.agy-overlay,[data-side]';
var _SUB_IT = '[role^="menuitem"],[role="option"],.agy-overlay-item';
var _L3_RE = /^(?:off|minimal|low|medium|high|xhigh|extra|max)(?:\s+thinking)?$|^(?:关闭|关|极低|最低|最小|低|中|中等|高|超高|极高|特高|最高|最大)(?:思考|推理|强度)?$/i;
function _subIts(m) {
if (!m || !m.querySelectorAll) return [];
var raw = m.querySelectorAll(_SUB_IT);
if (!raw.length) raw = m.querySelectorAll("button,[tabindex]");
var out = [], i, j, el;
for (i = 0; i < raw.length; i += 1) {
el = raw[i];
if (!el || el === m || _isBox(el) || (el.closest && el.closest(".ces-ag-section")) || !String(el.textContent || "").trim()) continue;
for (j = 0; j < out.length; j += 1) if (out[j].contains && out[j].contains(el)) { el = null; break; }
if (el) out.push(el);
}
return out;
}
function _badBox(m) {
return !m || !activePanel || m === activePanel || Boolean(m.contains && m.contains(activePanel)) || Boolean(m.querySelector && m.querySelector('[data-testid="model-selector-panel"],[data-testid="model-selector-orchestrator"],[data-testid="quota-progress-circle"],.ces-ag-section'));
}
function _isSub(m, c) {
if (_badBox(m) || !_hasOrch(c)) return false;
var its = _subIts(m), n = 0, i;
for (i = 0; i < its.length; i += 1) if (_mPlan(its[i], c)) n += 1;
return n >= 1 && n * 2 >= its.length;
}
function _isL3(m, c) {
if (_badBox(m) || !_hasOrch(c)) return false;
var its = _subIts(m), i;
if (its.length < 2 || its.length > 7) return false;
for (i = 0; i < its.length; i += 1) if (!_L3_RE.test(String(its[i].textContent || "").replace(/[✓✔•·]/g, " ").replace(/\s+/g, " ").trim())) return false;
return true;
}
function _wrapOv(m) {
var o = (m.closest && m.closest('.agy-overlay,[data-radix-popper-content-wrapper],[role="presentation"],[data-side]')) || (m.parentElement && m.parentElement !== doc.body ? m.parentElement : null);
if (!o || o === activePanel || (o.contains && o.contains(activePanel)) || (o.querySelector && o.querySelector('[data-testid="model-selector-panel"]'))) return null;
if ((o.getAttribute && o.getAttribute("data-ag-cs-orch-l2") === "1") || (o.querySelector && o.querySelector('[data-ag-cs-orch-l2="1"]'))) return null;
var hasL2 = false;
_boundSubs.forEach(function (b) { if (b && (b === o || (o.contains && o.contains(b)))) hasL2 = true; });
return hasL2 ? null : o;
}
function _ubSub(m) { if (m) { try { if (typeof m.__cesSubUb === "function") m.__cesSubUb(); } catch (e) {} _boundSubs.delete(m); } }
function _clrL3(ov, m) {
try { m && m.removeAttribute("data-ag-cs-orch-l3"); if (ov && ov !== m) ov.removeAttribute("data-ag-cs-orch-l3"); } catch (e) {}
_hiddenL3.delete(m);
}
function _sySubDom(m, c, p) {
if (!m || !c || !p) return;
var its = _subIts(m), i, h, v;
for (i = 0; i < its.length; i += 1) {
h = _mPlan(its[i], c);
if (!h) continue;
if (its[i].getAttribute("data-ces-orch-row") !== "1") its[i].setAttribute("data-ces-orch-row", "1");
v = p.isOrchestrator && p.baseName && _slug(p.baseName) === _slug(h.base) ? "true" : "false";
if (its[i].getAttribute("data-ces-model-selected") !== v) its[i].setAttribute("data-ces-model-selected", v);
}
}
function _bdSub(m) {
if (!m || m.__cesSubBd) return;
m.__cesSubBd = true;
var ov = _wrapOv(m);
try {
m.setAttribute("data-ag-cs-model-submenu", "1");
m.setAttribute("data-ag-cs-orch-l2", "1");
if (ov && ov !== m) {
ov.setAttribute("data-ag-cs-model-submenu", "1");
if (ov.getAttribute && ov.getAttribute("data-ag-cs-orch-l3") === "1") ov.removeAttribute("data-ag-cs-orch-l3");
}
} catch (e) {}
function rAct(t) {
if (!t || typeof t.closest !== "function" || t.closest('button[aria-label="Edit Model"],a[href]')) return null;
var it = t.closest(_SUB_IT);
if (!it || !m.contains(it)) it = t.closest("button,[tabindex]");
if (!it || it === m || _isBox(it) || !m.contains(it) || _isDis(t, it)) return null;
var c = getLiveContext() || _rdAgFiber(m), h = _mPlan(it, c);
if (!h || !h.opt) return null;
var cur = getActiveProfile(c), need = !cur || !cur.isOrchestrator, oo = need ? _fOrch(c) : (_actOptOvr || c.selectedModel || _fOrch(c));
if (need && (!_canCm(c) || !oo)) return null;
if (!need && cur && cur.baseName && _slug(cur.baseName) === _slug(h.base) && (h.fam || (cur.modelOption && cur.modelOption.value === h.opt.value))) return null;
return { ctx: c, oo: oo, po: h.opt, need: need };
}
function onUp(ev) { if (rAct(ev.target)) _stp(ev); }
function onMd(ev) { if (rAct(ev.target)) { ev.preventDefault(); _stp(ev); } }
function onCk(ev) {
var a = rAct(ev.target);
if (!a || (a.need && !_commitAgOpt(a.ctx, a.oo, false)) || !_commitAgOpt(a.ctx, a.po, true)) return;
ev.preventDefault(); _stp(ev);
activeBaseOverride = null; _actOptOvr = a.oo; _lastHostLbl = (a.ctx.selectedModel && a.ctx.selectedModel.label) || ""; _orchPlanOvr = a.po;
_withMut(function () {
var p = resolveModelEffortProfile(a.ctx, a.oo, _curEffMap(), a.po);
_syncAgDom(a.ctx, p); _sySubDom(m, a.ctx, p); _sySubs(activePanel, a.ctx, p); notifySeatListeners(); _syP();
});
}
var evs = [["pointerdown", onUp], ["mousedown", onMd], ["pointerup", onUp], ["mouseup", onUp], ["click", onCk]], i;
for (i = 0; i < evs.length; i += 1) m.addEventListener(evs[i][0], evs[i][1], true);
m.__cesSubUb = function () {
for (var u = 0; u < evs.length; u += 1) m.removeEventListener(evs[u][0], evs[u][1], true);
try {
m.removeAttribute("data-ag-cs-model-submenu"); m.removeAttribute("data-ag-cs-orch-l2");
if (ov && ov !== m) ov.removeAttribute("data-ag-cs-model-submenu");
var rs = m.querySelectorAll ? m.querySelectorAll("[data-ces-orch-row]") : [];
for (var r = 0; r < rs.length; r += 1) { rs[r].removeAttribute("data-ces-orch-row"); rs[r].removeAttribute("data-ces-model-selected"); }
} catch (e) {}
delete m.__cesSubUb; delete m.__cesSubBd;
};
_boundSubs.add(m);
}
function _sySubs(panel, c, p) {
_boundSubs.forEach(function (m) { if (!m || m.isConnected === false || !panel || !_isSub(m, c)) _ubSub(m); });
_hiddenL3.forEach(function (ov, m) { if (!m || m.isConnected === false || !panel || !_isL3(m, c)) _clrL3(ov, m); });
if (!panel || !_hasOrch(c)) return;
var seen = new Set(), cands = [], qm = doc && doc.querySelectorAll ? doc.querySelectorAll(_SUB_BOX) : [], mis = doc && doc.querySelectorAll ? doc.querySelectorAll(_SUB_IT) : [], i, j;
for (i = 0; i < qm.length; i += 1) if (!seen.has(qm[i])) { seen.add(qm[i]); cands.push(qm[i]); }
for (i = 0; i < mis.length; i += 1) { var pr = mis[i].parentElement; if (pr && !seen.has(pr) && !_badBox(pr)) { seen.add(pr); cands.push(pr); } }
var l2 = cands.filter(function (x) { return _isSub(x, c); });
for (i = 0; i < l2.length; i += 1) {
for (j = 0; j < l2.length; j += 1) if (i !== j && l2[i].contains && l2[i].contains(l2[j])) { l2[i] = null; break; }
if (l2[i]) { _bdSub(l2[i]); _sySubDom(l2[i], c, p); }
}
if (_boundSubs.size > 0 || panel.getAttribute("data-ces-orch-tunable") === "true") {
for (i = 0; i < cands.length; i += 1) {
var m3 = cands[i], inL2 = false;
if (_boundSubs.has(m3) || !_isL3(m3, c)) continue;
_boundSubs.forEach(function (b) { if (b === m3 || (b.contains && b.contains(m3)) || (m3.contains && m3.contains(b))) inL2 = true; });
if (inL2) continue;
var ov3 = _wrapOv(m3);
try {
if (m3.getAttribute("data-ag-cs-orch-l3") !== "1") m3.setAttribute("data-ag-cs-orch-l3", "1");
if (ov3 && ov3 !== m3 && ov3.getAttribute("data-ag-cs-orch-l3") !== "1") ov3.setAttribute("data-ag-cs-orch-l3", "1");
} catch (e) {}
_hiddenL3.set(m3, ov3);
}
}
}
function _bindPnl(panel) {
if (!panel || panel.__cesAgBound) return;
panel.__cesAgBound = true;
function rKeep(target) {
if (!target || typeof target.closest !== "function" || target.closest('.ces-ag-section,.ces-set,button[aria-label="Edit Model"]')) return null;
var menuItem = target.closest('[role^="menuitem"]');
if (_isDis(target, menuItem)) return null;
var oe = target.closest('[data-testid="model-selector-orchestrator"]') || (menuItem && menuItem.querySelector && menuItem.querySelector('[data-testid="model-selector-orchestrator"]'));
if (!oe && menuItem && panel.contains(menuItem) && !menuItem.querySelector('[data-testid="model-selector-effort-group"],[data-testid="model-selector-item"]') && _isOrch(menuItem.textContent)) oe = menuItem;
if (oe && panel.contains(oe)) {
var oc = getLiveContext();
if (!_canCm(oc)) return null;
var oCur = getActiveProfile(oc);
if (oCur && oCur.isOrchestrator) return null;
var oo = _fOrch(oc);
return oo ? { ctx: oc, base: null, targetOption: oo, isOrch: true } : null;
}
if (target.closest('[data-testid="model-selector-item"]')) return null;
var gs = menuItem && panel.contains(menuItem) && menuItem.querySelector('[data-testid="model-selector-effort-group"]');
if (!gs) return null;
var base = (gs.getAttribute("data-model-base") || gs.textContent || "").trim(), bp = parseModelLabel(base);
if (bp && bp.base) base = bp.base;
if (!base || _isOrch(base)) return null;
var ctx = getLiveContext();
if (!_canCm(ctx)) return null;
var prof = resolveModelEffortProfile(ctx, base, _curEffMap()), opt = prof && !prof.locked && prof.levels && prof.levels.length >= 2 ? prof.modelOption : null;
if (!_okOpt(opt)) return null;
if (Array.isArray(ctx.modelOptions) && ctx.modelOptions.length && !ctx.modelOptions.some(function (o) { return _okOpt(o) && (o === opt || o.label === opt.label); })) return null;
var cur = getActiveProfile(ctx);
if (cur && !cur.isOrchestrator && cur.baseName === prof.baseName) return null;
return { ctx: ctx, base: prof.baseName || base, targetOption: opt, isOrch: false };
}
function onUpC(ev) {
if (rKeep(ev.target)) _stp(ev);
}
function onCkC(ev) {
var act = rKeep(ev.target);
if (!act || !_commitAgOpt(act.ctx, act.targetOption)) return;
ev.preventDefault();
_stp(ev);
activeBaseOverride = act.isOrch ? null : act.base;
_actOptOvr = act.targetOption;
_lastHostLbl = (act.ctx.selectedModel && act.ctx.selectedModel.label) || "";
_orchPlanOvr = null;
_withMut(function () {
var nextProf = resolveModelEffortProfile(act.ctx, act.targetOption, _curEffMap());
_syncAgDom(act.ctx, nextProf);
_sySubs(panel, act.ctx, nextProf);
notifySeatListeners();
});
}
var uTm = null, uEl = null, uOk = false, uSyn = false;
function fUsg(target) {
if (!target || typeof target.closest !== "function") return null;
var item = target.closest('[role="menuitem"],.agy-overlay-item,button'), uRe = /View Usage|查看用量|\bUsage\b/;
if (!item) {
var div = target.closest("div"), dt = div && div !== panel && panel.contains(div) ? (div.textContent || "").trim() : "";
if (dt && /^(?:View Usage|Usage$|查看用量)/.test(dt) && !/Claude|Gemini|GPT/.test(dt)) item = div;
}
return item && item !== panel && panel.contains(item) && uRe.test((item.textContent || "").trim()) ? item : null;
}
function rstUsg() {
if (uTm) { clearTimeout(uTm); uTm = null; }
uOk = false; uEl = null;
}
function onPeC(ev) {
if (uSyn) return;
var trigger = fUsg(ev.target);
if (!trigger) { rstUsg(); return; }
if (uOk && uEl === trigger) return;
_stp(ev);
rstUsg();
uEl = trigger;
try {
trigger.addEventListener("pointerleave", rstUsg, { once: true });
trigger.addEventListener("mouseleave", rstUsg, { once: true });
} catch (e) {}
var cx = ev.clientX, cy = ev.clientY, pid = ev.pointerId || 1, pt = ev.pointerType || "mouse";
uTm = setTimeout(function () {
uTm = null;
if (trigger && panel.contains(trigger)) {
uOk = true; uSyn = true;
try {
var PE = (win && win.PointerEvent) || (typeof PointerEvent !== "undefined" ? PointerEvent : null);
var ME = (win && win.MouseEvent) || (typeof MouseEvent !== "undefined" ? MouseEvent : null);
var EV = (win && win.Event) || (typeof Event !== "undefined" ? Event : null);
if (typeof PE === "function") {
[["pointerenter", false], ["pointerover", true], ["pointermove", true]].forEach(function (it) {
trigger.dispatchEvent(new PE(it[0], { bubbles: it[1], cancelable: true, pointerId: pid, pointerType: pt, clientX: cx, clientY: cy }));
});
} else if (typeof ME === "function") trigger.dispatchEvent(new ME("mouseenter", { bubbles: false, cancelable: true, clientX: cx, clientY: cy }));
else if (typeof EV === "function") trigger.dispatchEvent(new EV("pointerenter", { bubbles: false, cancelable: true }));
} catch (err) {} finally { uSyn = false; }
}
}, 300);
}
function onPoC(ev) {
if (uSyn) return;
var trigger = fUsg(ev.target);
if (!trigger) { if (uOk || uTm) rstUsg(); return; }
if (!uOk) _stp(ev);
}
function onPouC(ev) {
if (uSyn) return;
var trigger = fUsg(ev.target);
if (trigger && (!ev.relatedTarget || !trigger.contains(ev.relatedTarget))) rstUsg();
}
function onPmC(ev) {
if (uSyn) return;
if (fUsg(ev.target) && !uOk) _stp(ev);
}
function onPlC(ev) {
if (!ev.relatedTarget || !panel.contains(ev.relatedTarget)) rstUsg();
}
var evPairs = [
["pointerenter", onPeC],
["pointerover", onPoC],
["pointerout", onPouC],
["pointerleave", onPlC],
["pointermove", onPmC],
["pointerup", onUpC],
["mouseup", onUpC],
["click", onCkC]
];
for (var ei = 0; ei < evPairs.length; ei++) panel.addEventListener(evPairs[ei][0], evPairs[ei][1], true);
panel.__cesAgResetUsageHover = rstUsg;
panel.__cesAgUnbindPanel = function () {
for (var ui = 0; ui < evPairs.length; ui++) panel.removeEventListener(evPairs[ui][0], evPairs[ui][1], true);
delete panel.__cesAgResetUsageHover;
delete panel.__cesAgUnbindPanel;
delete panel.__cesAgBound;
};
}
function _unmntSec() {
_setReady(false);
_boundSubs.forEach(_ubSub);
_boundSubs.clear();
_hiddenL3.forEach(_clrL3);
_hiddenL3.clear();
if (activePanel) {
try { if (typeof activePanel.__cesAgResetUsageHover === "function") activePanel.__cesAgResetUsageHover(); } catch (e) {}
try { if (typeof activePanel.__cesAgUnbindPanel === "function") activePanel.__cesAgUnbindPanel(); } catch (e) {}
}
if (doc && doc.activeElement && activeSection && activeSection.contains(doc.activeElement)) {
try { doc.activeElement.blur(); } catch (e) {}
}
if (activeValueEl) { delete activeValueEl.__cesLastLabel; delete activeValueEl.__cesLastKey; }
_clrSibs(activePanel);
if (activeMount) { activeMount.unmount(); activeMount = null; }
if (activeSection && activeSection.parentNode) activeSection.parentNode.removeChild(activeSection);
activeSection = activeRow = activeValueEl = activeHostEl = activePanel = activeBaseOverride = _actOptOvr = _orchPlanOvr = null;
}
function _mntSec(panel, ctx) {
panel.classList.add("ces-ag-panel-enhanced");
_bindPnl(panel);
var mk = function (t, c, p) { var e = doc.createElement(t); e.className = c; if (p) e.setAttribute("data-ces-part", p); return markNoTranslate(e); };
var section = mk("div", "ces-ag-section", "ag-section");
var _stopProp = function (ev) { if (ev && typeof ev.stopPropagation === "function") ev.stopPropagation(); };
["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach(function (evName) { section.addEventListener(evName, _stopProp); });
var sep = doc.createElement("div");
sep.setAttribute("role", "separator");
sep.setAttribute("aria-orientation", "horizontal");
sep.className = "h-px bg-border my-1 -mx-1";
section.appendChild(sep);
var row = mk("div", "ces-ag-effort-row text-foreground");
row.setAttribute("data-ces-effort-row", "true");
var head = mk("div", "ces-ag-effort-head");
var title = mk("span", "ces-ag-effort-title");
title.textContent = resolveEffortTitle(doc, win);
var valueEl = mk("span", "ces-ag-effort-value", "value");
var initProf = getActiveProfile(ctx);
if (initProf && initProf.currentLabel) {
valueEl.textContent = initProf.currentLabel;
valueEl.__cesLastLabel = initProf.currentLabel;
valueEl.__cesLastKey = _normEffTxt(initProf.currentLabel) || _normEffTxt(initProf.currentEffort) || String(initProf.currentLabel || initProf.currentEffort || "").trim().toLowerCase();
}
head.appendChild(title);
head.appendChild(valueEl);
row.appendChild(head);
var hostEl = mk("div", "ces-inline", "host");
row.appendChild(hostEl);
section.appendChild(row);
// 挂载位置：模型列表容器 (panel.firstElementChild) 之后、View Usage 分隔线之前
var modelListWrapper = panel.firstElementChild;
if (modelListWrapper && modelListWrapper.nextSibling) {
panel.insertBefore(section, modelListWrapper.nextSibling);
} else {
panel.appendChild(section);
}
activePanel = panel;
activeSection = section;
activeRow = row;
activeValueEl = valueEl;
activeHostEl = hostEl;
activeMount = mountCodexEffortSlider({
container: hostEl,
panel: panel,
row: row,
valueElement: valueEl,
seat: agSeatAdapter,
document: doc,
window: win,
onVisualChange: function (vState) {
if (vState && vState.dragging) return;
_withMut(function () {
var liveCtx = getLiveContext();
if (liveCtx) _syncAgDom(liveCtx, getActiveProfile(liveCtx));
else syncTriggerColor(doc, vState.label, vState.index, vState.count, vState.isMax, false);
});
}
});
}
function scan() {
if (_intMut) return;
_withMut(() => {
var ctx = getLiveContext();
if (memOnly) {
if (!ctx) return;
var sel = ctx.selectedModel, isO = _isOrch(sel);
if (lk && Date.now() > lk.u) lk = null;
var pi = isO ? _resOrch(ctx) : null, mp = isO ? (pi?.opt && parseModelLabel(pi.opt.label)) : (sel?.label && parseModelLabel(sel.label)), lbl = isO ? pi?.opt?.label : sel?.label;
if (mp?.base && mp.effort && (isO || (_luEff(ctx.effortIndex, mp.base)?.size || 0) >= 2)) {
var dst = isO ? _orchEffMap : _effMap;
if (lk && lk.o === isO && lk.b === mp.base) { if (lbl === lk.t.label) { lk = null; _recEff(dst, mp.base, mp.effort); } }
else _recEff(dst, mp.base, mp.effort);
}
var p0 = findAntigravityPanel(doc);
if (!p0) return;
var sB = !isO && sel?.label ? (parseModelLabel(sel.label)?.base || sel.label) : "";
for (var g of p0.querySelectorAll('[data-testid="model-selector-effort-group"]')) {
var gb = g.getAttribute("data-model-base") || (g.textContent || "").trim(); gb = parseModelLabel(gb)?.base || gb;
var gr = gb && (isO || gb !== sB) ? _effMap.get(gb) : "";
if (gr && _luEff(ctx.effortIndex, gb)?.has(gr) && g.nextElementSibling?.tagName === "SPAN") _setEffTxt(g.nextElementSibling, AG_EFFORT_LABELS[gr] || gr);
}
if (!isO && _orchEffMap.size) {
var oi = ctx.orchIdx instanceof Map && ctx.orchIdx.size ? ctx.orchIdx : ctx.effortIndex;
for (var row of doc.querySelectorAll('[data-testid="orchestrator-picker-row"][data-model-base]')) {
var ob = (row.getAttribute("data-model-base") || "").trim(), or = ob ? _orchEffMap.get(ob) : "", os = or && _luEff(oi, ob)?.has(or) && row.querySelector("span.opacity-70");
if (os) _setEffTxt(os, AG_EFFORT_LABELS[or] || or);
}
}
return;
}
var curLbl = ctx?.selectedModel?.label || "";
if ((_actOptOvr || activeBaseOverride) && (!curLbl || (_actOptOvr && curLbl === _actOptOvr.label) || curLbl !== _lastHostLbl)) _actOptOvr = activeBaseOverride = null;
_lastHostLbl = curLbl;
if (_orchPlanOvr) {
var effModel = _actOptOvr || ctx?.selectedModel, lp = ctx && _isOrch(effModel) ? _resOrch(ctx) : null;
if (!ctx || !_isOrch(effModel) || lp?.opt?.value === _orchPlanOvr.value) _orchPlanOvr = null;
}
var panel = findAntigravityPanel(doc);
if (!panel) {
activeSection || activePanel ? _unmntSec() : _setReady(false);
if (ctx) _syncAgDom(ctx, getActiveProfile(ctx));
return;
}
if (!_hasValidCtx(ctx)) { activeSection || activePanel ? _unmntSec() : _setReady(false); return; }
if (activePanel !== panel || !activeSection || !panel.contains(activeSection)) { _unmntSec(); _mntSec(panel, ctx); }
else {
_setTxt(activeSection.querySelector(".ces-ag-effort-title"), resolveEffortTitle(doc, win));
activeMount?.refresh?.();
}
_setReady(Boolean(activeMount && activeSection));
var liveProf = getActiveProfile(ctx);
_syncAgDom(ctx, liveProf); _sySubs(panel, ctx, liveProf); notifySeatListeners();
});
}
var onMemCk = null;
if (memOnly) {
var qOrch = (c, ob) => {
var or = ob ? _orchEffMap.get(ob) : "", oi = c ? (c.orchIdx instanceof Map && c.orchIdx.size ? c.orchIdx : c.effortIndex) : null, oby = oi && or ? _luEff(oi, ob) : null, ot = oby?.get(or);
if (ot && _okOpt(ot) && or !== (oby.has("medium") ? "medium" : "")) { lk = { o: true, b: ob, t: ot, u: Date.now() + 300 }; qM(() => _commitAgOpt(c, ot, true, false)); }
};
onMemCk = (ev) => {
var t = ev?.target;
if (!t?.closest || _isDis(t)) return;
if (t.closest('[data-testid="model-selector-effort-option"],[data-testid="orchestrator-picker-effort"]')) { lk = null; return; }
if (t.closest('button[aria-label="Edit Model"],a[href]')) return;
var oRow = t.closest('[data-testid="orchestrator-picker-row"][data-model-base]');
if (oRow) { qOrch(getLiveContext(), (oRow.getAttribute("data-model-base") || "").trim()); return; }
var pnl = findAntigravityPanel(doc);
if (pnl && !pnl.contains(t)) {
var sm = t.closest(_SUB_BOX);
if (sm && sm !== pnl) {
var sc = getLiveContext() || _rdAgFiber(sm);
if (sc && _hasOrch(sc)) {
var it3 = t.closest(_SUB_IT) || t.closest("button,[tabindex]");
if (it3 && _L3_RE.test(String(it3.textContent || "").replace(/[✓✔•·]/g, " ").replace(/\s+/g, " ").trim())) { lk = null; return; }
if (it3 && !_isBox(it3) && !_isDis(t, it3)) {
var hm = _mPlan(it3, sc);
if (hm) { if (hm.fam && hm.base) qOrch(sc, hm.base); else lk = null; return; }
}
}
}
}
var mi = pnl?.contains(t) && t.closest('[role^="menuitem"]');
if (!mi || !pnl.contains(mi) || t.closest('[data-testid="model-selector-item"],[data-testid="model-selector-orchestrator"]')) return;
var g = mi.querySelector('[data-testid="model-selector-effort-group"]');
if (!g) return;
var b = (g.getAttribute("data-model-base") || g.textContent || "").trim(); b = parseModelLabel(b)?.base || b;
var r = b ? _effMap.get(b) : "", c = r ? getLiveContext() : null;
if (!c) return;
var curP = c.selectedModel && !_isOrch(c.selectedModel) ? parseModelLabel(c.selectedModel.label) : null;
if (curP?.base === b) return;
var by = _luEff(c.effortIndex, b), tgt = by?.get(r);
if (tgt && _okOpt(tgt) && r !== (by.has("medium") ? "medium" : "")) { lk = { o: false, b, t: tgt, u: Date.now() + 300 }; qM(() => _commitAgOpt(c, tgt, false, false)); }
};
doc.addEventListener?.("click", onMemCk, true);
}
scan();
var MO = opts.MutationObserver || win?.MutationObserver || (typeof MutationObserver === "function" ? MutationObserver : null);
if (typeof MO === "function") {
var ctrlSel = '[data-testid="model-selector-trigger"],button[aria-label^="Select model"],[data-testid="model-selector-panel"],[role="menu"]';
var noiseSel = '[data-testid="autoscroll-viewport"],.toast-viewport,[data-testid="sidebar-split"]>div:first-child';
observer = new MO((recs) => {
if (_intMut) return;
if (!memOnly && Array.isArray(recs) && recs.length) {
if (activeSection && activePanel?.contains(activeSection) && recs.every((sr) => { var st = sr?.target, sel = st && (st.nodeType === 1 ? st : st.parentElement); return sel && activeSection.contains(sel); })) return;
if (!activePanel) {
var rel = recs.some((r) => {
var t = r?.target, el = t && (t.nodeType === 1 ? t : t.parentElement);
if (!el?.closest) return true;
return (r.type === "characterData" || r.type === "attributes") ? Boolean(el.closest(ctrlSel)) : Boolean(el.closest(ctrlSel) || !el.closest(noiseSel));
});
if (!rel) return;
}
}
scan();
});
observer.observe(doc.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-expanded", "data-state", "hidden", "data-selected"] });
}
return {
stop: () => {
observer?.disconnect(); observer = null;
if (memOnly) { if (onMemCk) doc.removeEventListener?.("click", onMemCk, true); lk = null; _clrSibs(doc); }
else { _unmntSec(); _clrAgDom(doc); }
},
rescan: scan,
setRememberEffort: (on) => {
var next = on !== false;
if (next === rememberEffort) return;
rememberEffort = next;
if (next) {
var ld = _loadEffMem(win);
ld.models.forEach((v, k) => { if (!_effMap.has(k)) _effMap.set(k, v); });
ld.orch.forEach((v, k) => { if (!_orchEffMap.has(k)) _orchEffMap.set(k, v); });
} else {
_effMap.clear();
_orchEffMap.clear();
}
scan();
},
getMemory: () => ({ models: Object.fromEntries(_effMap), orch: Object.fromEntries(_orchEffMap) }),
_bindPnl
};
}
function installEffortMemoryGuard(options) {
return installAntigravityObserver(Object.assign({}, options, { memoryOnly: true, rememberEffort: true }));
}
function installCodexEffortSlider(options) {
var o = options || {}, d = o.document || (typeof document !== "undefined" ? document : null), w = o.window || d?.defaultView || (typeof window !== "undefined" ? window : globalRoot);
if (!d?.body) return null;
try { w?.__agCodexEffortSliderInstance?.stop?.(); } catch {}
installStyles(d);
var _onStoInv = (ev) => { if (!ev || ev.key === SETTINGS_KEY || ev.key === LEGACY_SETTINGS_KEY) _invCfg(); };
w?.addEventListener?.("storage", _onStoInv); w?.addEventListener?.(SETTINGS_EVENT, _onStoInv);
var noop = { stop: () => {}, rescan: () => {} };
var sUi = o.disableContextMenuSettings ? noop : installSettingsUi({ document: d, window: w });
var agObs = installAntigravityObserver({ document: d, window: w, MutationObserver: o.MutationObserver, rememberEffort: o.rememberEffort });
var _actGenMnt = null;
var menuObs = o.skipGenericMenuObserver ? noop : installMenuObserver({
document: d, window: w, MutationObserver: o.MutationObserver,
onChange: (cur) => {
_actGenMnt?.unmount(); _actGenMnt = null;
var seat = cur?.container && (o.seat || findSeatEffort(w));
if (seat) _actGenMnt = mountCodexEffortSlider({ container: cur.container, row: cur.row, seat, document: d, window: w });
}
});
var inst = {
stop: () => {
_actGenMnt?.unmount(); _actGenMnt = null;
menuObs.stop(); agObs.stop(); sUi.stop();
w?.removeEventListener?.("storage", _onStoInv); w?.removeEventListener?.(SETTINGS_EVENT, _onStoInv);
_invCfg();
if (w?.__agCodexEffortSliderInstance === inst) delete w.__agCodexEffortSliderInstance;
},
rescan: () => { agObs.rescan(); menuObs.rescan(); },
setRememberEffort: (on) => { agObs.setRememberEffort?.(on); }
};
if (w) w.__agCodexEffortSliderInstance = inst;
return inst;
}
// 在浏览器主世界（非 Node 测试环境且非禁用自动启动）下自动挂载
if (
typeof window !== "undefined" &&
typeof document !== "undefined" &&
!window.__agCodexEffortSliderDisableAutoBoot && !(globalRoot && globalRoot.__agCodexEffortSliderDisableAutoBoot)
) {
var boot = function () {
if (document.body) installCodexEffortSlider({ document: document, window: window });
};
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
boot();
}
}
return {mountCodexEffortSlider,installMenuObserver,installAntigravityObserver,installEffortMemoryGuard,installCodexEffortSlider,findAntigravityTrigger,findAntigravityPanel,resolveModelEffortProfile,normalizeEffortIndex,parseModelLabel,motionMode,openSettingsPanel,fillColorFor,fillBackgroundFor,valueColorFor,paintDither,surfaceIsDark,markNoTranslate};
});


(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    try { root.__agPrismEffortSlider?.destroy?.(); } catch {}
    if (typeof window !== 'undefined' && window !== root) {
      try { window.__agPrismEffortSlider?.destroy?.(); } catch {}
    }
    const api = factory(root);
    root.__agPrismEffortSlider = api;
    if (typeof window !== 'undefined') window.__agPrismEffortSlider = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function (globalRoot) {
  'use strict';

  const SLIDER_STYLE_ID = 'ag-codex-effort-slider-styles';
  const HIDE_STYLE_ID = 'ag-prism-effort-slider-hide';
  const PRISM_OWNER_ATTR = 'data-ag-prism-slider';
  const THROTTLE_MS = 120;
  const MENU_THROTTLE_MS = 32;

  const ga = (e, k) => e?.getAttribute?.(k), sa = (e, k, v) => e?.setAttribute?.(k, v), ra = (e, k) => e?.removeAttribute?.(k);
  const qs = (e, s) => e?.querySelector?.(s), qa = (e, s) => e?.querySelectorAll?.(s) || [];

  function resLib(win) {
    if (win?.AntigravityCodexEffortSlider) return win.AntigravityCodexEffortSlider;
    if (globalRoot?.AntigravityCodexEffortSlider) return globalRoot.AntigravityCodexEffortSlider;
    if (typeof require === 'function') {
      try {
        globalRoot.__agCodexEffortSliderDisableAutoBoot = true;
        if (win) win.__agCodexEffortSliderDisableAutoBoot = true;
        return require('./upstream-client.js');
      } catch {}
    }
    return null;
  }

  const isMenu = (doc) => Boolean(qs(doc, '[data-testid="model-selector-panel"], .ces-menu-section, [data-ces-effort-row="true"], [role="dialog"] [data-ces-settings]'));

  const IGNORED_CHAT_SEL =
    '[data-testid="autoscroll-viewport"],[data-testid="planner-response-text"],[data-testid="agent-response"],[data-markdown-root],[data-testid="user-message-bubble"],aside,[data-op-thought="1"],.ag-prism-thought-overlay,.ag-cs-crab,.ag-cs-conv-aura-host,#ag-pulse-status-bar,#ag-prism-pulse-bar,[data-ag-prism-pulse-bar="true"],.ag-cs-panel-row-glyph,.ces-ag-section,.ces-set,[data-ag-owned="1"],[data-testid="orchestrator-effort-bar"],.ag-cs-smooth-caret,.ag-anim-icon,[data-agy-hans-ui],#agy-theme-switcher,#agy-theme-menu,#antigravity-quota-widget,#antigravity-translation-audit';

  const EFF_MAP = Object.create(null);
  for (const g of 'xhigh:xhigh|extra|超高|极高|特高|超高思考;high:high|高|高思考|高推理|高强度;medium:medium|med|中|中等|中思考|中等思考|中推理;low:low|低|低思考|低推理;minimal:minimal|极低|最小|最低;max:max|最高|最大;off:off|关闭|关;auto:auto|自动;adaptive:adaptive|自适应|自適應;thinking:thinking|深度思考|思考中|思考'.split(';')) {
    const [k, vs] = g.split(':');
    for (const v of vs.split('|')) EFF_MAP[v] = k;
  }
  const EFF_LABELS = { off: 'Off', minimal: 'Minimal', low: 'Low', medium: 'Medium', high: 'High', xhigh: 'Extra', max: 'Max', auto: 'Auto', adaptive: 'Adaptive', thinking: 'Thinking' };

  function normalizeEffortToken(raw) {
    const s = String(raw || '').trim().replace(/^[(\uff08]+|[)\uff09]+$/g, '').trim().replace(/\s+thinking$/i, '').toLowerCase();
    return EFF_MAP[s] || '';
  }

  function parseLocalizedModelLabel(raw) {
    const s = String(raw || '').trim().replace(/^(?:Select model|选择模型)\s*[:：]\s*/i, '').trim();
    if (!s) return null;
    const m = /^(.*?)\s*[\(\uff08]([^()\uff08\uff09]+)[\)\uff09]\s*$/.exec(s);
    const eff = m ? normalizeEffortToken(m[2]) : '';
    if (!m || !eff) return { base: s, rawBase: s, effort: '', effortLabel: '', canonicalLabel: s, isThinking: false };
    const rawBase = m[1].trim(), isThinking = eff === 'thinking', effortLabel = EFF_LABELS[eff] || m[2].trim();
    return { base: isThinking ? `${rawBase} (Thinking)` : rawBase, rawBase, effort: eff, effortLabel, canonicalLabel: `${rawBase} (${effortLabel})`, isThinking };
  }

  function markOwnedNoTr(doc) {
    const fn = resLib(doc?.defaultView)?.markNoTranslate;
    for (const el of qa(doc, '.ces-ag-section,.ces-set,[data-testid="orchestrator-effort-bar"]')) {
      sa(el, 'data-ag-studio-ignore', 'true');
      sa(el, 'data-ag-no-i18n', 'true');
      if (fn) {
        fn(el);
        for (const ch of qa(el, 'div,span')) if (String(ch.className || '').includes('ces-ag-effort-')) fn(ch);
      }
    }
  }

  function syncBilingualDom(doc) {
    const p = qs(doc, '[data-testid="model-selector-panel"]');
    if (!p) return;
    for (const g of qa(p, '[data-testid="model-selector-effort-group"]')) {
      if (!ga(g, 'data-model-base')) {
        const pr = parseLocalizedModelLabel(g.textContent);
        if (pr?.rawBase && pr.effort && !pr.isThinking) sa(g, 'data-model-base', pr.rawBase);
      }
      const sib = g.nextElementSibling;
      if (sib?.tagName === 'SPAN') {
        const ek = normalizeEffortToken(sib.textContent);
        if (ek && EFF_LABELS[ek] && sib.textContent.trim() !== EFF_LABELS[ek]) sa(sib, 'data-ces-eff-key', ek);
      }
    }
    for (const it of qa(p, '[data-testid="model-selector-item"]')) {
      if (!ga(it, 'data-model-label')) {
        const pr = parseLocalizedModelLabel(it.textContent);
        if (pr?.effort) sa(it, 'data-model-label', pr.canonicalLabel);
      }
    }
  }

  function isIgnTarget(node) {
    if (!node) return false;
    const el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return false;
    if (el.classList?.contains?.('ag-prism-thought-chunk') || el.classList?.contains?.('ag-prism-thought-overlay')) return true;
    return typeof el.closest === 'function' ? Boolean(el.closest(IGNORED_CHAT_SEL)) : false;
  }

  function isIgnRec(rec) {
    const t = rec?.target;
    if (!t) return false;
    if (isIgnTarget(t)) return true;
    const a = rec.addedNodes, r = rec.removedNodes, n = (a?.length || 0) + (r?.length || 0);
    if (!n) return false;
    for (const l of [a, r]) if (l) for (let i = 0; i < l.length; i++) if (!isIgnTarget(l[i])) return false;
    return true;
  }

  const allIgn = (recs) => Array.isArray(recs) && recs.length > 0 && recs.every(isIgnRec);

  const TR_SEL = '[data-testid="model-selector-trigger"],button[aria-label^="Select model"]';
  const SUB_TID = 'context-menu-submenu-popup';
  const SUB_SEL = `[data-testid="${SUB_TID}"]`;
  const MDL_SEL = `[data-testid="model-selector-panel"],${TR_SEL},${SUB_SEL},[role="menu"],[role="listbox"]`;
  function touchesModel(recs) {
    if (!Array.isArray(recs) || !recs.length) return true;
    for (const rec of recs) {
      if (isIgnRec(rec)) continue;
      const t = rec?.target, el = t && (t.nodeType === 1 ? t : t.parentElement);
      if (el?.getAttribute && ((ga(el, 'data-testid') || '').includes('model-selector') || el.closest?.(MDL_SEL))) return true;
      for (const n of rec?.addedNodes || []) {
        if (!n || n.nodeType !== 1 || isIgnTarget(n)) continue;
        const r = ga(n, 'role') || '', tid = ga(n, 'data-testid') || '';
        if (tid.includes('model-selector') || tid === SUB_TID || r === 'menu' || r === 'listbox' || r === 'dialog' || n.classList?.contains?.('agy-overlay') || ((n.tagName === 'DIV' || n.tagName === 'BUTTON') && qs(n, MDL_SEL))) return true;
      }
    }
    return false;
  }

  function mkThrottledMO(BaseMO, doc, stats) {
    if (typeof BaseMO !== 'function') return null;
    return function TMO(cb) {
      let tm = null, closeTm = null, lastAt = 0, q = [], disc = false, wasOpen = false, curTrig = null;
      const syncTrig = () => {
        if (disc) return;
        const tr = qs(doc, TR_SEL);
        if (!tr || tr === curTrig) return;
        curTrig = tr;
        try { inner.observe(tr, { characterData: true, subtree: true }); } catch {}
      };
      const flush = (fSync) => {
        tm = null;
        if (disc) return;
        const batch = q;
        q = [];
        const open = isMenu(doc), closed = wasOpen && !open;
        if (!Boolean(fSync || closed) && !touchesModel(batch)) {
          wasOpen = open;
          stats.skippedIrrelevant += 1;
          return;
        }
        wasOpen = open;
        lastAt = Date.now();
        stats.executedScans += 1;
        syncBilingualDom(doc);
        cb(batch, wrap);
        markOwnedNoTr(doc);
        syncTrig();
        if (closed) {
          if (closeTm !== null) clearTimeout(closeTm);
          closeTm = setTimeout(() => { closeTm = null; if (!disc) flush(true); }, 48);
          closeTm?.unref?.();
        }
      };
      const inner = new BaseMO((recs) => {
        if (disc) return;
        stats.rawMutations += 1;
        if (allIgn(recs)) { stats.skippedIrrelevant += 1; return; }
        const open = isMenu(doc), closed = wasOpen && !open;
        if (!closed && !touchesModel(recs)) { stats.skippedIrrelevant += 1; return; }
        if (Array.isArray(recs)) for (let i = 0; i < recs.length && q.length < 48; i++) q.push(recs[i]);
        const el = Date.now() - lastAt, wMs = open ? MENU_THROTTLE_MS : THROTTLE_MS;
        let subAdded = false;
        if (open && Array.isArray(recs)) {
          for (const rec of recs) {
            for (const nd of rec?.addedNodes || []) {
              const nr = nd?.nodeType === 1 ? ga(nd, 'role') : '';
              if (nd?.nodeType === 1 && (nr === 'menu' || nr === 'listbox' || ga(nd, 'data-testid') === SUB_TID || nd.classList?.contains('agy-overlay') || qs(nd, `[role="menu"],[role="listbox"],[role^="menuitem"],${SUB_SEL},.agy-overlay`))) {
                subAdded = true;
                break;
              }
            }
            if (subAdded) break;
          }
        }
        if (closed || subAdded || (open && !wasOpen) || (el >= wMs && tm === null)) {
          if (tm !== null) { clearTimeout(tm); tm = null; }
          flush(closed);
        } else if (tm === null) {
          tm = setTimeout(() => flush(false), Math.max(16, wMs - el));
          tm?.unref?.();
        }
      });
      const wrap = {
        observe(t, o) {
          disc = false;
          const r = inner.observe(t, t === doc?.body && o?.characterData ? { ...o, characterData: false } : o);
          syncTrig();
          return r;
        },
        disconnect() {
          disc = true;
          if (tm !== null) { clearTimeout(tm); tm = null; }
          if (closeTm !== null) { clearTimeout(closeTm); closeTm = null; }
          curTrig = null;
          q = [];
          return inner.disconnect();
        },
        takeRecords: () => (typeof inner.takeRecords === 'function' ? inner.takeRecords() : []),
      };
      return wrap;
    };
  }

  function createEffortSliderController(envOpts) {
    const gW = () => (envOpts && envOpts.window) || (typeof window !== 'undefined' ? window : globalRoot);
    const gD = () => (envOpts && envOpts.document) || gW()?.document || null;
    let mode = 'auto', rememberEffort = true, inst = null, memGuard = null, yielded = false;
    const perfStats = { rawMutations: 0, executedScans: 0, skippedIrrelevant: 0 };

    function hasExtInst() {
      const w = gW(), d = gD();
      if (!w) return false;
      if (w.__agCodexEffortSliderInstance && !w.__agCodexEffortSliderInstance.__prismOwned) return true;
      const st = d?.getElementById?.(SLIDER_STYLE_ID);
      return Boolean(st && st.getAttribute(PRISM_OWNER_ATTR) !== '1' && !inst);
    }

    const HIDE_CSS_TEXT =
      '.ces-ag-section,.ces-menu-section,[data-ces-effort-row="true"],.ces-set,.ces-settings-panel{display:none!important}' +
      '[data-testid="orchestrator-effort-bar"]{display:none!important}' +
      '[data-ces-part="trigger-effort"]{color:inherit!important;opacity:.7!important;font-weight:inherit!important}';

    function clrTint(doc) {
      if (!doc) return;
      for (const sp of qa(doc, '[data-ces-part="trigger-effort"], [data-testid="model-selector-trigger"] span[style]')) {
        if (sp.style) sp.style.color = sp.style.opacity = sp.style.fontWeight = '';
        ra(sp, 'data-ces-part');
      }
      for (const p of qa(doc, '.ces-ag-panel-enhanced')) p.classList?.remove?.('ces-ag-panel-enhanced');
      for (const attr of ['data-ces-model-selected', 'data-ag-cs-model-submenu', 'data-ag-cs-orch-l2', 'data-ag-cs-orch-l3', 'data-ces-orch-row', 'data-ces-orch-b', 'data-ces-orch-tunable']) {
        for (const it of qa(doc, `[${attr}]`)) ra(it, attr);
      }
      ra(doc.documentElement, 'data-ces-slider-ready');
    }

    function setHideCss(hidden) {
      const doc = gD();
      if (!doc || typeof doc.getElementById !== 'function') return;
      const ex = doc.getElementById(HIDE_STYLE_ID);
      if (!hidden) { ex?.remove?.(); return; }
      if (ex) { if (ex.textContent !== HIDE_CSS_TEXT) ex.textContent = HIDE_CSS_TEXT; return; }
      if (doc.head || doc.documentElement) {
        const st = doc.createElement('style');
        st.id = HIDE_STYLE_ID;
        st.textContent = HIDE_CSS_TEXT;
        (doc.head || doc.documentElement).appendChild(st);
      }
    }

    function stopInst() {
      const w = gW(), d = gD();
      if (inst) {
        try { inst.stop(); } catch {}
        if (w && w.__agCodexEffortSliderInstance === inst) delete w.__agCodexEffortSliderInstance;
        inst = null;
      }
      if (w && w.__agCodexEffortSliderInstance && w.__agCodexEffortSliderInstance.__prismOwned) {
        try { w.__agCodexEffortSliderInstance.stop?.(); } catch {}
        delete w.__agCodexEffortSliderInstance;
      }
      clrTint(d);
      const st = d?.getElementById?.(SLIDER_STYLE_ID);
      if (st && st.getAttribute(PRISM_OWNER_ATTR) === '1') st.remove();
    }

    function stopMemGuard() {
      if (memGuard) {
        try { memGuard.stop(); } catch {}
        memGuard = null;
      }
    }

    function mountMemGuard() {
      const w = gW(), d = gD();
      if (!w || !d || !d.body) return false;
      const lib = resLib(w);
      if (!lib || typeof lib.installEffortMemoryGuard !== 'function') return false;
      const BaseMO = w.MutationObserver || (typeof MutationObserver === 'function' ? MutationObserver : null);
      stopMemGuard();
      memGuard = lib.installEffortMemoryGuard({
        document: d,
        window: w,
        MutationObserver: mkThrottledMO(BaseMO, d, perfStats) || undefined,
      });
      return Boolean(memGuard);
    }

    function mountBuiltIn() {
      const w = gW(), d = gD();
      if (!w || !d || !d.body) return false;
      const lib = resLib(w);
      if (!lib || typeof lib.installCodexEffortSlider !== 'function') return false;
      const BaseMO = w.MutationObserver || (typeof MutationObserver === 'function' ? MutationObserver : null);
      const next = lib.installCodexEffortSlider({
        document: d,
        window: w,
        MutationObserver: mkThrottledMO(BaseMO, d, perfStats) || undefined,
        skipGenericMenuObserver: true,
        rememberEffort,
      });
      if (!next) return false;
      next.__prismOwned = true;
      w.__agCodexEffortSliderInstance = prismSyncRef(next);
      d.getElementById?.(SLIDER_STYLE_ID)?.setAttribute(PRISM_OWNER_ATTR, '1');
      return true;
    }

    function prismSyncRef(v) {
      inst = v;
      return v;
    }

    function sync(cfg) {
      const raw = cfg && cfg.effortSliderModule;
      mode = raw === 'on' || raw === 'off' ? raw : 'auto';
      rememberEffort = !(cfg && (cfg.effortMemory === 'off' || cfg.effortMemory === false));
      if (mode === 'off') {
        yielded = false;
        stopInst();
        clrTint(gD());
        setHideCss(true);
        if (rememberEffort) {
          if (!memGuard) mountMemGuard();
          else try { memGuard.rescan?.(); } catch {}
        } else {
          stopMemGuard();
        }
        return getState();
      }
      setHideCss(false);
      if (mode === 'auto' && hasExtInst()) {
        yielded = true;
        stopInst();
        stopMemGuard();
        try { gW()?.__agCodexEffortSliderInstance?.rescan?.(); } catch {}
        return getState();
      }
      yielded = false;
      stopMemGuard();
      syncBilingualDom(gD());
      if (!inst || hasExtInst()) {
        if (inst) stopInst();
        mountBuiltIn();
      } else {
        try { inst.setRememberEffort?.(rememberEffort); } catch {}
        try { inst.rescan?.(); } catch {}
      }
      markOwnedNoTr(gD());
      return getState();
    }

    function destroy() {
      stopInst();
      stopMemGuard();
      setHideCss(false);
      yielded = false;
    }

    function getState() {
      return {
        mode,
        rememberEffort,
        mountedPrism: Boolean(inst),
        memoryGuardActive: Boolean(memGuard),
        yieldedToExternal: Boolean(yielded || (mode === 'auto' && hasExtInst())),
        hasExternal: hasExtInst(),
        throttleMs: THROTTLE_MS,
        perfStats: { ...perfStats },
      };
    }

    return {
      THROTTLE_MS,
      normalizeEffortToken,
      parseLocalizedModelLabel,
      syncBilingualDom,
      sync,
      destroy,
      getState,
      createEffortSliderController,
    };
  }

  return createEffortSliderController();
});


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
      cost: '对话总费用',
      timelineTitle: '逐轮调用时间线',
      attachTitle: '附件审计摘要',
      quotaTitle: '模型额度池',
      noQuota: '连接本地 LanguageServer 后自动显示模型额度',
      launchCli: '打开 CLI 终端',
      daysAll: '全部', daysToday: '今天', days7: '7天', days30: '30天', days90: '90天',
      totalTok: '总消耗', estApi: '估算 API 费用', vsSub: '较订阅节省',
      heatmap: '7×N 活跃热力图',
      sourceSplit: '桌面端 vs CLI 占比',
      topModels: '热门模型排行',
      syncPricing: '同步模型定价',
      importCur: '导入当前', addOauth: 'OAuth 添加', importTools: '导入 Tools', refreshQuota: '刷新额度',
      activeTag: '当前', switchBtn: '一键切号',
      keepaliveTitle: '低额度自动切号策略',
      secTheme: '外观与桌宠',
      secFx: 'Prism 质感增强（独立开关）',
      secLang: '语言与词典',
      secNet: '代理与系统增强',
      testProxy: '测速',
      customDictTitle: '自定义词典（覆盖内置词条）',
      customThemeTitle: '自定义配色编辑器（新建 / 克隆 / 调色）',
      enhanceTitle: '系统提示词精简 & 中文标题 & 上下文解锁'
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
      cost: '對話總費用',
      timelineTitle: '逐輪呼叫時間線',
      attachTitle: '附件稽核摘要',
      quotaTitle: '模型額度池',
      noQuota: '連線本機 LanguageServer 後自動顯示模型額度',
      launchCli: '開啟 CLI 終端機',
      daysAll: '全部', daysToday: '今天', days7: '7天', days30: '30天', days90: '90天',
      totalTok: '總消耗', estApi: '估算 API 費用', vsSub: '較訂閱節省',
      heatmap: '7×N 活躍熱力圖',
      sourceSplit: '桌面端 vs CLI 佔比',
      topModels: '熱門模型排行',
      syncPricing: '同步模型定價',
      importCur: '匯入目前', addOauth: 'OAuth 新增', importTools: '匯入 Tools', refreshQuota: '重新整理額度',
      activeTag: '使用中', switchBtn: '一鍵切號',
      keepaliveTitle: '低額度自動切號策略',
      secTheme: '外觀與桌寵',
      secFx: 'Prism 質感增強（獨立開關）',
      secLang: '語言與詞典',
      secNet: '代理與系統增強',
      testProxy: '測速',
      customDictTitle: '自訂詞典（覆蓋內建詞條）',
      customThemeTitle: '自訂配色編輯器（新增 / 複製 / 調色）',
      enhanceTitle: '系統提示詞精簡 & 中文標題 & 上下文解鎖'
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
      cost: 'Session Cost',
      timelineTitle: 'Session Turn Timeline',
      attachTitle: 'Attachment Audit',
      quotaTitle: 'Model Quota Pools',
      noQuota: 'Connects automatically to local LanguageServer when active',
      launchCli: 'Open CLI Terminal',
      daysAll: 'All', daysToday: 'Today', days7: '7d', days30: '30d', days90: '90d',
      totalTok: 'Total Tokens', estApi: 'Est. API Cost', vsSub: 'vs Subscription',
      heatmap: '7×N Activity Heatmap',
      sourceSplit: 'Desktop vs CLI',
      topModels: 'Top Models',
      syncPricing: 'Sync Pricing',
      importCur: 'Import Current', addOauth: 'Add OAuth', importTools: 'Import Tools', refreshQuota: 'Refresh',
      activeTag: 'Active', switchBtn: 'Switch',
      keepaliveTitle: 'Low-Quota Auto-Switch Strategy',
      secTheme: 'Appearance & Mascot',
      secFx: 'Prism FX (Independent Toggles)',
      secLang: 'Language & Dictionary',
      secNet: 'Proxy & System Enhancements',
      testProxy: 'Test',
      customDictTitle: 'Custom Dictionary Overrides',
      customThemeTitle: 'Custom Color Editor (Create / Clone / Edit)',
      enhanceTitle: 'Prompt Tiers & Chinese Title & Context Unlock'
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
      '.ags-drawer { position:fixed; top:40px; right:12px; bottom:12px; width:420px; max-width:calc(100vw - 24px); background:var(--ags-bg-surface,#18181b); color:var(--ags-text-primary,#f4f4f5); border:1px solid var(--ags-border,#2e2e32); border-radius:14px; box-shadow:var(--ags-shadow,0 16px 40px rgba(0,0,0,0.45)); z-index:2147483500; display:flex; flex-direction:column; font-family:var(--ags-font-ui,system-ui,sans-serif); font-size:13px; font-variant-numeric:tabular-nums; transition:transform 180ms cubic-bezier(.22,1,.36,1), opacity 160ms ease; overflow:hidden; -webkit-app-region:no-drag; app-region:no-drag; }',
      '.ags-drawer * { -webkit-app-region:no-drag; app-region:no-drag; }',
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
      '.ags-select option { background:var(--ags-bg-surface,#18181b); color:var(--ags-text-primary,#f4f4f5); }',
      '.ags-input:focus, .ags-select:focus { border-color:var(--ags-accent); }',
      '.ags-pill-group { display:inline-flex; padding:2px; border-radius:8px; background:var(--ags-bg-surface); border:1px solid var(--ags-border); gap:2px; }',
      '.ags-pill-opt { border:none; background:transparent; color:var(--ags-text-secondary); padding:3px 9px; border-radius:6px; font-size:11.5px; cursor:pointer; }',
      '.ags-pill-opt.active { background:var(--ags-accent-soft); color:var(--ags-accent); font-weight:600; }',
      '.ags-theme-cards { display:grid; grid-template-columns:1fr 1fr; gap:8px; }',
      '.ags-theme-card { padding:10px; border-radius:10px; border:1px solid var(--ags-border); background:var(--ags-bg-surface); cursor:pointer; text-align:left; transition:border-color 120ms ease; }',
      '.ags-theme-card.active { border-color:var(--ags-accent); box-shadow:0 0 0 1px var(--ags-accent); }',
      '.ags-acc-item { display:flex; flex-direction:column; gap:8px; padding:10px 12px; border-radius:10px; border:1px solid var(--ags-border); background:var(--ags-bg-surface); }',
      '.ags-acc-quota-box { display:flex; flex-direction:column; gap:6px; padding-top:8px; border-top:1px solid var(--ags-border); }',
      '.ags-acc-pool { display:flex; flex-direction:column; gap:3px; }',
      '.ags-avatar { width:30px; height:30px; border-radius:50%; background:var(--ags-accent-soft); color:var(--ags-accent); display:flex; align-items:center; justify-content:center; font-weight:600; flex-shrink:0; }',
      '.ags-details { border:1px solid var(--ags-border); border-radius:10px; background:var(--ags-bg-surface); padding:8px 11px; }',
      '.ags-details summary { cursor:pointer; font-size:12px; color:var(--ags-text-secondary); font-weight:500; outline:none; user-select:none; }',
      '.ags-details[open] summary { margin-bottom:10px; color:var(--ags-text-primary); }',
      '.ags-fold-card { border:1px solid var(--ags-border); border-radius:10px; background:var(--ags-bg-surface); overflow:hidden; }',
      '.ags-fold-btn { width:100%; border:none; background:transparent; color:var(--ags-text-secondary); padding:9px 11px; display:flex; align-items:center; justify-content:space-between; font-size:12px; font-weight:500; cursor:pointer; text-align:left; }',
      '.ags-fold-btn:hover { color:var(--ags-text-primary); background:var(--ags-bg-canvas); }',
      '.ags-fold-body { padding:0 11px 10px 11px; display:flex; flex-direction:column; gap:6px; }',
      '.ags-eval-box { padding:8px 10px; border-radius:9px; background:var(--ags-bg-surface); border:1px solid var(--ags-border); display:flex; flex-direction:column; gap:4px; }',
      '.ags-eval-badge { display:inline-flex; align-items:center; gap:5px; font-size:11.5px; font-weight:600; }',
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
      currency: 'USD', // USD | CNY
      speedHistory: [],
      proxyTestResult: null,
      timelineOpen: false,
      timelineLoading: false,
      timelineConvId: '',
      timelineData: null,
      attachOpen: false,
      enhanceStatus: null,
      unlockStatus: null,
      rehydrateStatus: null,
      customDict: {},
      snapshot: null,
      history: null,
      accounts: null,
      fonts: []
    };

    // Build fixed header + tabs + scrollable body shell once so close/tabs never lose listeners or scroll
    el.innerHTML = [
      '<div class="ags-head">',
      '  <div class="ags-title"><span class="ags-dot"></span><span id="ags-head-title">Antigravity Studio</span></div>',
      '  <button type="button" class="ags-btn ags-btn-ghost" id="ags-close-btn">收起</button>',
      '</div>',
      '<div class="ags-tabs">',
      '  <button type="button" class="ags-tab active" data-tab="overview">概览</button>',
      '  <button type="button" class="ags-tab" data-tab="usage">统计</button>',
      '  <button type="button" class="ags-tab" data-tab="accounts">账号</button>',
      '  <button type="button" class="ags-tab" data-tab="settings">设置</button>',
      '</div>',
      '<div class="ags-body" id="ags-drawer-body"></div>'
    ].join('\n');

    var closeBtnFixed = el.querySelector('#ags-close-btn');
    if (closeBtnFixed) {
      closeBtnFixed.addEventListener('click', function (ev) {
        ev.stopPropagation();
        toggle(false);
      });
    }
    el.querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.activeTab = btn.getAttribute('data-tab');
        if (opts.onTabChange) opts.onTabChange(state.activeTab);
        render(null, true);
      });
    });

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

      var speed = Number((ctx.speed && (ctx.speed.streamingTps || ctx.speed.tokPerSec || ctx.speed.tps)) || 0);
      var overallTps = Number((ctx.speed && ctx.speed.overallTps) || 0);
      var speedStr = speed > 0 ? Number(speed).toFixed(1).replace(/\.0$/, '') : '0';
      var ttft = Number((ctx.speed && ctx.speed.ttftMs) || 0);
      var ttftVal = ttft >= 1000 ? (ttft / 1000).toFixed(1) : (ttft > 0 ? String(Math.round(ttft)) : '-');
      var ttftUnit = ttft >= 1000 ? 's' : 'ms';
      var cost = Number((snap && snap.estimatedSessionCostUsd) || 0);
      var turnCost = Number((snap && snap.estimatedTurnCostUsd) || 0);
      var callCount = Number((snap && snap.sessionCallCount) || 0);
      var costStr = cost >= 1 ? ('$' + cost.toFixed(2)) : ('$' + cost.toFixed(3));
      var costTitle = (callCount > 1 || (turnCost > 0 && Math.abs(cost - turnCost) >= 0.001))
        ? (' title="本轮估算 $' + turnCost.toFixed(3) + (callCount > 0 ? (' · 共 ' + callCount + ' 次调用') : '') + '"')
        : '';
      var pools = (snap && snap.quota && snap.quota.pools) || [];
      var remainingCtx = Math.max(0, limit - used);
      var cmq = (snap && snap.currentModelQuota) || null;
      var histMed = ctx.speed && ctx.speed.historyMedian;
      var legend = t('ctxLegend');

      var attachInfo = (snap && snap.attachments) || ctx.attachments || null;
      var attachHtml = '<div class="ags-sub">当前会话暂无附件</div>';
      if (attachInfo && Number(attachInfo.count || (attachInfo.files && attachInfo.files.length) || 0) > 0) {
        var files = Array.isArray(attachInfo.files) ? attachInfo.files : [];
        attachHtml = '<div class="ags-row"><span>已挂载 ' + esc(attachInfo.count || files.length) + ' 个附件</span>' +
          '<span class="ags-sub">' + (attachInfo.totalTokens ? ('≈ ' + fmtTok(attachInfo.totalTokens) + ' tok') : '') + '</span></div>' +
          ((attachInfo.unknownFiles > 0 || attachInfo.complete === false)
            ? '<div class="ags-sub" style="color:var(--ags-warning)">含 ' + Number(attachInfo.unknownFiles || 0) + ' 个无法解析的文件，总计为部分估算</div>'
            : '') +
          (files.length
            ? '<div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">' + files.slice(0, 5).map(function (f) {
                var nm = typeof f === 'string' ? f : (f.name || f.path || 'file');
                var tk = typeof f === 'object' && f.tokens ? (' · ' + fmtTok(f.tokens) + ' tok') : '';
                return '<div class="ags-sub" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(nm + tk) + '</div>';
              }).join('') + '</div>'
            : '');
      }

      var evalInfo = ctx.speed && ctx.speed.evaluation;
      var evalHtml = '';
      if (evalInfo && (evalInfo.comment || evalInfo.shortTitle || (evalInfo.badge && evalInfo.badge.text))) {
        var evColor = (evalInfo.badge && evalInfo.badge.color) || 'var(--ags-accent)';
        var evGlyph = (evalInfo.badge && evalInfo.badge.glyph) || '⚡';
        var evBadgeTxt = (evalInfo.badge && evalInfo.badge.text) || '';
        var titleText = evBadgeTxt
          ? evBadgeTxt
          : ((evalInfo.grade ? (evalInfo.grade + '级' + (evalInfo.score != null ? (' ' + Number(evalInfo.score).toFixed(1) + '分') : '') + ' · ') : '') + (evalInfo.shortTitle || ''));
        evalHtml = '<div class="ags-eval-box">' +
          '<div class="ags-row"><span class="ags-eval-badge" style="color:' + esc(evColor) + '">' + esc(evGlyph + ' ' + titleText) + '</span>' +
          (evalInfo.subLabel ? '<span class="ags-sub">' + esc(evalInfo.subLabel) + '</span>' : '') + '</div>' +
          (evalInfo.comment ? '<div class="ags-sub" style="line-height:1.45">' + esc(evalInfo.comment) + '</div>' : '') +
          '</div>';
      }

      var turns = (state.timelineData && (state.timelineData.turns || state.timelineData.items)) || [];
      var timelineHtml = state.timelineLoading
        ? '<div class="ags-sub">正在加载逐轮调用记录...</div>'
        : (turns.length
          ? turns.slice(0, 10).map(function (tr, i) {
              return '<div class="ags-tl-item">' +
                '<div class="ags-row"><span style="font-weight:500">#' + (tr.turnIndex != null ? tr.turnIndex : (i + 1)) + ' · ' + esc(tr.model || 'model') + '</span>' +
                '<span class="ags-sub">' + esc(tr.tps ? (Math.round(tr.tps) + ' tok/s') : (tr.status || '')) + '</span></div>' +
                '<div class="ags-sub">in ' + fmtTok(tr.inputTokens || 0) + ' · out ' + fmtTok(tr.outputTokens || 0) +
                (tr.cacheReadTokens ? (' · cache ' + fmtTok(tr.cacheReadTokens)) : '') + '</div>' +
                '</div>';
            }).join('')
          : '<div class="ags-sub">' + (snap && snap.conversationId ? '暂无逐轮记录' : '进入会话后可查看逐轮调用记录') + '</div>');

      var quotaMetaHtml = (snap && snap.quota && (snap.quota.planName || snap.quota.creditsBalance != null))
        ? '<div class="ags-row" style="font-size:11px;margin-top:-2px">' +
            '<span class="ags-sub">' + esc(snap.quota.planName || 'Subscription') + '</span>' +
            (snap.quota.creditsBalance != null ? ('<span class="ags-sub">AI Credits: ' + esc(snap.quota.creditsBalance) + '</span>') : '') +
          '</div>'
        : '';

      var quotaHtml = pools.length
        ? pools.map(function (p) {
            var poolTitle = p.displayName || p.poolKey || p.title || '模型共享池';
            var bList = Array.isArray(p.buckets) && p.buckets.length
              ? p.buckets
              : [{
                  windowLabel: '当前周期额度',
                  remainingPercent: p.remainingPercent,
                  resetTime: p.resetTime,
                  resetTimeText: p.resetTimeText,
                  countdownText: p.countdownText,
                  isLow: p.isLow,
                  tokenEstimate: p.tokenEstimate || null
                }];

            var bucketsHtml = bList.map(function (b) {
              var bPct = b.remainingPercent == null ? 100 : Math.round(b.remainingPercent);
              var bEta = b.countdownText || formatResetEta(b.resetTime);
              var bReset = b.resetTimeText ? (' (' + b.resetTimeText + ' 重置)') : '';
              var bColor = b.isLow ? 'var(--ags-warning)' : 'var(--ags-accent)';
              var te = b.tokenEstimate;
              var tokLine = '';
              if (te && te.estRemainingShort) {
                tokLine = '<div class="ags-sub" style="font-size:11px;color:var(--ags-text-primary);opacity:0.88">预计剩余 ≈ <strong>' + esc(te.estRemainingShort) + ' tokens</strong>' +
                  (te.estTotalShort ? (' · 周期总额 ≈ ' + esc(te.estTotalShort)) : '') +
                  (te.cycleTokensUsed > 0 ? (' · 本周期已用 ' + fmtTok(te.cycleTokensUsed)) : '') +
                  (te.isReliable ? '' : ' (校准中)') + '</div>';
              } else if (te && te.cycleTokensUsed > 0) {
                tokLine = '<div class="ags-sub" style="font-size:10.5px">本周期已用 ' + fmtTok(te.cycleTokensUsed) + ' tokens（样本校准中，待进度变化后估算剩余）</div>';
              } else if (bPct >= 98) {
                tokLine = '<div class="ags-sub" style="font-size:10.5px;opacity:0.75">本周期尚未消耗（消耗 ≥3% 后自动校准预计剩余 tokens）</div>';
              }
              return '<div style="display:flex;flex-direction:column;gap:3px">' +
                '<div class="ags-row"><span class="ags-sub">' + esc(b.windowLabel || '周期额度') + '</span>' +
                '<span class="ags-sub">' + bPct + '%' + (bEta ? (' · ' + esc(bEta)) : '') + esc(bReset) + '</span></div>' +
                '<div class="ags-prog"><div class="ags-prog-fill" style="width:' + bPct + '%;background:' + bColor + '"></div></div>' +
                tokLine +
                '</div>';
            }).join('');

            var subModels = Array.isArray(p.modelNames) && p.modelNames.length
              ? '<div class="ags-sub" style="font-size:10.5px;opacity:0.8">' + esc(p.modelNames.join(' · ')) + '</div>'
              : '';
            return '<div style="display:flex;flex-direction:column;gap:5px;padding-top:4px;border-top:1px dashed var(--ags-border)">' +
              '<div style="font-size:12px;font-weight:600">' + esc(poolTitle) + '</div>' +
              bucketsHtml +
              subModels +
              '</div>';
          }).join('')
        : '<div class="ags-sub">' + esc(t('noQuota')) + '</div>';

      var cmqHtml = (cmq && cmq.remainingPercent != null)
        ? '<div class="ags-row" style="padding-top:6px;border-top:1px solid var(--ags-border);font-size:11.5px">' +
            '<span class="ags-sub">当前模型额度' + (cmq.windowLabel ? (' (' + esc(cmq.windowLabel) + ')') : '') + '</span>' +
            '<span style="font-weight:500">' + Math.round(cmq.remainingPercent) + '%' +
            (cmq.estRemainingShort ? (' · 约剩 ' + esc(cmq.estRemainingShort)) : '') +
            (cmq.countdownText ? (' · ' + esc(cmq.countdownText)) : '') + '</span></div>'
        : '';

      var speedTitle = (overallTps > 0 && Math.abs(overallTps - speed) >= 1)
        ? (' title="纯流式输出速率（含首字综合 ' + Math.round(overallTps) + ' tok/s）"')
        : '';

      return [
        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('ctxTitle')) + '</span><span>' + esc(ctx.model || '未检测会话') + '</span></div>',
        '  <div class="ags-row"><span class="ags-big">' + pct + '%</span><span class="ags-sub">' + fmtTok(used) + ' / ' + fmtTok(limit) + ' · 剩 ' + fmtTok(remainingCtx) + '</span></div>',
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
        cmqHtml,
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('perfTitle')) + '</span><span>缓存命中 ' + Math.round((ctx.cacheHitRate || 0) * 100) + '%' + (histMed && histMed.medianTps ? (' · 历史中位 ' + Math.round(histMed.medianTps) + ' tok/s') : '') + '</span></div>',
        '  <div class="ags-grid-3">',
        '    <div class="ags-metric-box"' + speedTitle + '><div class="ags-sub">' + esc(t('speed')) + '</div><div class="ags-metric-val">' + speedStr + ' <span class="ags-sub">tok/s</span></div></div>',
        '    <div class="ags-metric-box"><div class="ags-sub">' + esc(t('ttft')) + '</div><div class="ags-metric-val">' + ttftVal + ' <span class="ags-sub">' + ttftUnit + '</span></div></div>',
        '    <div class="ags-metric-box"' + costTitle + '><div class="ags-sub">' + esc(t('cost')) + '</div><div class="ags-metric-val">' + costStr + '</div></div>',
        '  </div>',
        evalHtml,
        '  <div>' + renderSparklineSvg(state.speedHistory.slice(-16)) + '</div>',
        '</div>',

        '<div class="ags-fold-card">',
        '  <button type="button" class="ags-fold-btn" data-action="toggle-timeline"><span>' + (state.timelineOpen ? '▾ ' : '▸ ') + esc(t('timelineTitle')) + '</span>' +
        (turns.length ? ('<span class="ags-sub">' + turns.length + ' 条</span>') : '') + '</button>',
        (state.timelineOpen ? '<div class="ags-fold-body">' + timelineHtml + '</div>' : ''),
        '</div>',

        '<div class="ags-fold-card">',
        '  <button type="button" class="ags-fold-btn" data-action="toggle-attach"><span>' + (state.attachOpen ? '▾ ' : '▸ ') + esc(t('attachTitle')) + '</span></button>',
        (state.attachOpen ? '<div class="ags-fold-body">' + attachHtml + '</div>' : ''),
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('quotaTitle')) + '</span>' +
        '    <div style="display:flex;gap:6px"><button class="ags-btn" data-action="refresh-quota-only">刷新</button><button class="ags-btn" data-action="launch-cli">' + esc(t('launchCli')) + '</button></div></div>',
        quotaMetaHtml,
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

      var isCny = state.currency === 'CNY';
      var fxRate = isCny ? 7.25 : 1;
      var curSym = isCny ? '¥' : '$';
      var fmtMoney = function (usd) { return curSym + (Number(usd || 0) * fxRate).toFixed(2); };

      var allModels = Array.isArray(h.byModel) ? h.byModel : [];
      var topModels = allModels.slice(0, 12);
      if (allModels.length > 12) {
        var restModels = allModels.slice(12);
        topModels = topModels.concat([{
          model: '其他模型 (' + restModels.length + ')',
          totalTokens: restModels.reduce(function (s, m) { return s + Number(m.totalTokens || 0); }, 0),
          costUsd: restModels.reduce(function (s, m) { return s + Number(m.costUsd || 0); }, 0)
        }]);
      }
      var maxModel = Math.max.apply(null, topModels.map(function (m) { return m.totalTokens || 0; }).concat([1]));
      var modelHtml = topModels.length
        ? topModels.map(function (m) {
            var w = Math.round(((m.totalTokens || 0) / maxModel) * 100);
            return '<div style="display:flex;flex-direction:column;gap:3px">' +
              '<div class="ags-row"><span style="font-size:12px">' + esc(m.model) + '</span><span class="ags-sub">' + fmtTok(m.totalTokens) + ' · ' + fmtMoney(m.costUsd) + '</span></div>' +
              '<div class="ags-prog"><div class="ags-prog-fill" style="width:' + w + '%"></div></div></div>';
          }).join('')
        : '<div class="ags-sub">暂无历史用量记录</div>';

      var subPrice = Number((cfg && cfg.enhance && cfg.enhance.subscriptionMonthlyUsd) != null ? cfg.enhance.subscriptionMonthlyUsd : 20);
      var estCost = Number(h.totalCostUsd != null ? h.totalCostUsd : (h.costEstimate || 0));
      var savings = Number(h.savingsVsSub != null ? h.savingsVsSub : (h.savingsVsApiUsd != null ? h.savingsVsApiUsd : (estCost - subPrice)));
      var speedRows = Array.isArray(h.speedByModel) ? h.speedByModel : [];
      var speedRowsHtml = speedRows.length
        ? speedRows.map(function (sr) {
            return '<div class="ags-row" style="font-size:11.5px"><span>' + esc(sr.modelLabel || sr.model || 'model') + '</span>' +
              '<span class="ags-sub">' + Math.round(sr.medianTps || sr.avgTps || 0) + ' tok/s' +
              (sr.medianTtftSec != null ? (' · TTFT ' + Number(sr.medianTtftSec).toFixed(1) + 's') : '') +
              ' · ' + (sr.sampleCount || sr.count || 0) + '次</span></div>';
          }).join('')
        : '<div class="ags-sub">暂无速度样本</div>';

      return [
        '<div class="ags-row">',
        '  <div class="ags-pill-group">',
        '    <button class="ags-pill-opt ' + (state.days === 0 ? 'active' : '') + '" data-days="0">' + esc(t('daysAll')) + '</button>',
        '    <button class="ags-pill-opt ' + (state.days === 1 ? 'active' : '') + '" data-days="1">' + esc(t('daysToday')) + '</button>',
        '    <button class="ags-pill-opt ' + (state.days === 7 ? 'active' : '') + '" data-days="7">' + esc(t('days7')) + '</button>',
        '    <button class="ags-pill-opt ' + (state.days === 30 ? 'active' : '') + '" data-days="30">' + esc(t('days30')) + '</button>',
        '    <button class="ags-pill-opt ' + (state.days === 90 ? 'active' : '') + '" data-days="90">' + esc(t('days90')) + '</button>',
        '  </div>',
        '  <div style="display:flex;gap:5px"><button class="ags-btn" id="ags-currency-btn">' + (isCny ? '¥ CNY' : '$ USD') + '</button><button class="ags-btn" id="ags-sync-pricing-btn">' + esc(t('syncPricing')) + '</button></div>',
        '</div>',

        '<div class="ags-grid-3">',
        '  <div class="ags-metric-box"><div class="ags-sub">' + esc(t('totalTok')) + '</div><div class="ags-metric-val">' + fmtTok(h.totalTokens) + '</div></div>',
        '  <div class="ags-metric-box"><div class="ags-sub">' + esc(t('estApi')) + '</div><div class="ags-metric-val">' + fmtMoney(estCost) + '</div></div>',
        '  <div class="ags-metric-box"><div class="ags-sub">' + esc(t('vsSub')) + '</div><div class="ags-metric-val">' + (savings >= 0 ? ('+' + fmtMoney(savings)) : ('-' + fmtMoney(Math.abs(savings)))) + '</div></div>',
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
        '</div>',

        '<details class="ags-details">',
        '  <summary>各模型历史速度中位数对比</summary>',
        '  <div style="display:flex;flex-direction:column;gap:5px">' + speedRowsHtml + '</div>',
        '</details>'
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
            var accPools = Array.isArray(a.quotaPools) && a.quotaPools.length
              ? a.quotaPools
              : (a.quotaSnapshot && Array.isArray(a.quotaSnapshot.pools) ? a.quotaSnapshot.pools : []);
            var accQuotaHtml = '';
            if (accPools.length) {
              accQuotaHtml = '<div class="ags-acc-quota-box">' + accPools.map(function (p) {
                var pName = p.displayName || p.title || p.poolKey || '模型池';
                var bList = Array.isArray(p.buckets) && p.buckets.length
                  ? p.buckets
                  : [{ windowLabel: '当前额度', remainingPercent: p.remainingPercent, resetTime: p.resetTime, resetTimeText: p.resetTimeText, countdownText: p.countdownText, isLow: p.isLow }];
                var bHtml = bList.map(function (b) {
                  var bPct = b.remainingPercent != null
                    ? Math.round(Number(b.remainingPercent))
                    : (typeof b.remainingFraction === 'number' ? Math.round(b.remainingFraction * 100) : 100);
                  var bEta = b.countdownText || formatResetEta(b.resetTime || b.resetTimeIso);
                  var bColor = b.isLow || bPct <= 20 ? 'var(--ags-warning)' : 'var(--ags-accent)';
                  return '<div class="ags-acc-pool">' +
                    '<div class="ags-row" style="font-size:11px"><span class="ags-sub">' + esc(b.windowLabel || '周期额度') + '</span>' +
                    '<span class="ags-sub">' + bPct + '%' + (bEta ? (' · ' + esc(bEta)) : '') + (b.resetTimeText ? (' (' + esc(b.resetTimeText) + ')') : '') + '</span></div>' +
                    '<div class="ags-prog"><div class="ags-prog-fill" style="width:' + bPct + '%;background:' + bColor + '"></div></div>' +
                    '</div>';
                }).join('');
                return '<div style="display:flex;flex-direction:column;gap:4px"><div style="font-size:11.5px;font-weight:500">' + esc(pName) + '</div>' + bHtml + '</div>';
              }).join('') + '</div>';
            } else {
              accQuotaHtml = '<div class="ags-acc-quota-box"><div class="ags-sub" style="font-size:11px">' +
                (a.lastQuotaError ? ('刷新失败: ' + esc(a.lastQuotaError)) : '尚未获取额度快照（点击右上 ↻ 或「刷新额度」拉取）') +
                '</div></div>';
            }

            return '<div class="ags-acc-item">' +
              '  <div class="ags-row">' +
              '    <div style="display:flex;align-items:center;gap:10px;min-width:0">' +
              '      <div class="ags-avatar">' + esc(letter) + '</div>' +
              '      <div style="min-width:0">' +
              '        <div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(a.email || a.name) + '</div>' +
              '        <div class="ags-sub">' + esc(a.planName || a.source || 'Standard') + (a.lastQuotaUpdatedAtMs ? (' · 已同步') : '') + '</div>' +
              '      </div>' +
              '    </div>' +
              '    <div style="display:flex;align-items:center;gap:5px;flex-shrink:0">' +
              '      <button class="ags-btn ags-btn-ghost" title="刷新此账号额度" data-acc-refresh-one="' + esc(a.email || a.id) + '">↻</button>' +
              (a.isActive
                ? '<span class="ags-pill-opt active">' + esc(t('activeTag')) + '</span>'
                : '<button class="ags-btn ags-btn-primary" data-acc-switch="' + esc(a.id) + '">' + esc(t('switchBtn')) + '</button>') +
              '      <button class="ags-btn ags-btn-ghost" title="移除" data-acc-remove="' + esc(a.id) + '">×</button>' +
              '    </div>' +
              '  </div>' +
              accQuotaHtml +
              '</div>';
          }).join('')
        : '<div class="ags-card"><div class="ags-sub">尚未保存账号槽位，点击上方「导入当前」快速保存当前登录态。</div></div>';

      var asw = ov.autoSwitch || {};
      var thPct = asw.thresholdPct != null ? Math.round(Number(asw.thresholdPct)) : Math.round(((asw.threshold) || 0.1) * 100);
      var poolSel = asw.poolKey === 'shared_3p_pool' ? 'shared_3p_pool' : 'shared_gemini_main';
      var stratSel = asw.strategy === 'candidate_order' ? 'candidate_order' : 'highest_quota';
      var savedCands = Array.isArray(asw.candidates) ? asw.candidates.map(function (c) { return String(c || '').toLowerCase(); }) : [];
      var eligibleAccs = list.filter(function (a) { return a.hasRefreshToken && a.email; });
      var candHtml = eligibleAccs.length
        ? '<div style="display:flex;flex-direction:column;gap:4px;margin-top:6px"><span class="ags-sub">参与自动切号的候选账号</span>' +
          eligibleAccs.map(function (a) {
            var em = String(a.email).toLowerCase();
            var chk = savedCands.length === 0 || savedCands.indexOf(em) !== -1;
            return '<label class="ags-row" style="font-size:11.5px;cursor:pointer"><span>' + esc(a.email) + '</span>' +
              '<input type="checkbox" data-auto-cand="' + esc(a.email) + '" ' + (chk ? 'checked' : '') + '></label>';
          }).join('') + '</div>'
        : '<div class="ags-sub" style="margin-top:6px">暂无包含可用凭据的候选账号</div>';

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
        '  <div class="ags-row" style="margin-bottom:8px"><span>启用低额度自动切号</span><input type="checkbox" id="ags-auto-switch-en" ' + (asw.enabled ? 'checked' : '') + '></div>',
        '  <div class="ags-row" style="margin-bottom:8px"><span>触发阈值 (%)</span><input class="ags-input" style="width:90px" type="number" min="1" max="95" id="ags-auto-switch-th" value="' + thPct + '"></div>',
        '  <div class="ags-row" style="margin-bottom:8px"><span>监控额度池</span><select class="ags-select" style="width:165px" id="ags-auto-switch-pool">' +
        '    <option value="shared_gemini_main" ' + (poolSel === 'shared_gemini_main' ? 'selected' : '') + '>Gemini 4 全系共享池</option>' +
        '    <option value="shared_3p_pool" ' + (poolSel === 'shared_3p_pool' ? 'selected' : '') + '>Claude / GPT 共享池</option>' +
        '  </select></div>',
        '  <div class="ags-row" style="margin-bottom:4px"><span>切号策略</span><select class="ags-select" style="width:165px" id="ags-auto-switch-strategy">' +
        '    <option value="highest_quota" ' + (stratSel === 'highest_quota' ? 'selected' : '') + '>最高剩余额度优先</option>' +
        '    <option value="candidate_order" ' + (stratSel === 'candidate_order' ? 'selected' : '') + '>按候选账号顺序</option>' +
        '  </select></div>',
        candHtml,
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

      var curPromptTier = enh.promptTier != null ? Number(enh.promptTier) : Number((cfg.enhance && cfg.enhance.promptTier) || 0);
      var curCnTitle = enh.chineseTitle != null ? Boolean(enh.chineseTitle) : Boolean(cfg.enhance && cfg.enhance.chineseSessionTitle);
      var curUnlockMode = unl.mode || (cfg.context && cfg.context.unlockMode) || 'ORIG';
      var curUnlockConst = unl.limitTokens || (cfg.context && cfg.context.unlockLimitTokens) || 512000;
      var curCliAlign = unl.alignCli != null ? Boolean(unl.alignCli) : Boolean(cfg.context && cfg.context.alignCli);
      var themesApiForPal = globalScope.__AG_STUDIO_THEMES__;
      var activePalInfo = themesApiForPal && themesApiForPal.resolveActivePalette ? themesApiForPal.resolveActivePalette(themeCfg) : null;
      var curPal = (activePalInfo && activePalInfo.palette) || {};
      var pickAccent = curPal.accent || '#3B6CF6';
      var pickCanvas = curPal.bgCanvas || '#0F1117';
      var pickSidebar = curPal.bgSidebar || '#141720';
      var pickText = curPal.textPrimary || '#F1F5F9';

      var customThemeOptions = customThemes.map(function (ct) {
        return '<div class="ags-row" style="margin-top:6px">' +
          '<button class="ags-btn ' + (themeCfg.activePreset === ct.id ? 'ags-btn-primary' : '') + '" data-select-theme="' + esc(ct.id) + '">' + esc(ct.name) + '</button>' +
          '<button class="ags-btn ags-btn-ghost" data-del-theme="' + esc(ct.id) + '">删除</button>' +
          '</div>';
      }).join('');

      var codeFontVal = (fonts.code === 'cascadia' || fonts.code === 'system') ? fonts.code : 'jetbrains';
      var dictEntries = Object.entries(state.customDict || {});
      var dictListHtml = dictEntries.length
        ? '<div style="display:flex;flex-direction:column;gap:4px;margin-top:8px">' + dictEntries.map(function (kv) {
            return '<div class="ags-row" style="font-size:11.5px;padding:3px 6px;border-radius:6px;background:var(--ags-bg-canvas)">' +
              '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(kv[0]) + ' → ' + esc(kv[1]) + '</span>' +
              '<button type="button" class="ags-btn ags-btn-ghost" title="删除" data-del-dict="' + esc(kv[0]) + '">×</button>' +
              '</div>';
          }).join('') + '</div>'
        : '<div class="ags-sub" style="margin-top:6px">暂无自定义词条</div>';

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
        '  <div class="ags-row"><span>工具栏上下文展示</span>' +
        '    <div style="display:flex;gap:5px;align-items:center">' +
        '      <select class="ags-select" style="width:96px" id="ags-hud-style">' +
        '        <option value="ring" ' + ((hudCfg.displayStyle || 'ring') === 'ring' ? 'selected' : '') + '>极简圆环</option>' +
        '        <option value="capsule" ' + (hudCfg.displayStyle === 'capsule' ? 'selected' : '') + '>完整胶囊</option>' +
        '      </select>' +
        '      <select class="ags-select" style="width:90px" id="ags-hud-pos">' +
        '        <option value="composer" ' + (hudCfg.position !== 'floating' ? 'selected' : '') + '>工具栏内</option>' +
        '        <option value="floating" ' + (hudCfg.position === 'floating' ? 'selected' : '') + '>右下悬浮</option>' +
        '      </select>' +
        '      <input type="checkbox" id="ags-hud-enabled" ' + (hudCfg.enabled !== false ? 'checked' : '') + '>' +
        '    </div></div>',
        (hudCfg.displayStyle === 'capsule'
          ? '  <div class="ags-row"><span>512K 呼吸试管 (胶囊模式)</span><input type="checkbox" id="ags-vial-enabled" ' + (hudCfg.showVial !== false ? 'checked' : '') + '></div>'
          : ''),
        '  <div class="ags-row"><span>新对话首页用量概览卡片</span><input type="checkbox" id="ags-home-card-enabled" ' + (cfg.homeOverview !== false && hudCfg.homeOverview !== false ? 'checked' : '') + '></div>',
        '  <details class="ags-details">',
        '    <summary>' + esc(t('customThemeTitle')) + ' & 三轨字体 (' + scannedFonts.length + ')</summary>',
        '    <div class="ags-row" style="gap:6px">' +
        '      <input class="ags-input" id="ags-new-theme-name" placeholder="新方案名称">' +
        '      <button class="ags-btn ags-btn-primary" id="ags-create-theme-btn">新建并应用</button>' +
        '    </div>',
        '    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">' +
        '      <label class="ags-row" style="font-size:11.5px"><span class="ags-sub">强调色</span><input type="color" id="ags-new-theme-accent" value="' + esc(pickAccent) + '" style="width:32px;height:24px;border:none;background:transparent"></label>' +
        '      <label class="ags-row" style="font-size:11.5px"><span class="ags-sub">画布背景</span><input type="color" id="ags-new-theme-canvas" value="' + esc(pickCanvas) + '" style="width:32px;height:24px;border:none;background:transparent"></label>' +
        '      <label class="ags-row" style="font-size:11.5px"><span class="ags-sub">侧栏背景</span><input type="color" id="ags-new-theme-sidebar" value="' + esc(pickSidebar) + '" style="width:32px;height:24px;border:none;background:transparent"></label>' +
        '      <label class="ags-row" style="font-size:11.5px"><span class="ags-sub">文字颜色</span><input type="color" id="ags-new-theme-text" value="' + esc(pickText) + '" style="width:32px;height:24px;border:none;background:transparent"></label>' +
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
        '      <option value="jetbrains" ' + (codeFontVal === 'jetbrains' ? 'selected' : '') + '>JetBrains Mono</option>' +
        '      <option value="cascadia" ' + (codeFontVal === 'cascadia' ? 'selected' : '') + '>Cascadia Code</option>' +
        '      <option value="system" ' + (codeFontVal === 'system' ? 'selected' : '') + '>System Monospace</option>' +
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
        '    <summary>' + esc(t('customDictTitle')) + (dictEntries.length ? (' (' + dictEntries.length + ')') : '') + '</summary>',
        '    <div class="ags-row" style="gap:6px">' +
        '      <input class="ags-input" id="ags-dict-en" placeholder="英文原文">' +
        '      <input class="ags-input" id="ags-dict-zh" placeholder="自定义译文">' +
        '      <button class="ags-btn" id="ags-dict-add-btn">添加</button>' +
        '    </div>',
        dictListHtml,
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
        '      <div class="ags-row ags-unlock-const-row" style="' + (curUnlockMode === 'CONST' ? '' : 'display:none') + '"><span>CONST 上限 (tokens)</span><input class="ags-input" style="width:120px" type="number" id="ags-unlock-limit" value="' + esc(curUnlockConst) + '"></div>',
        '      <div class="ags-row"><span>同步对齐 agy CLI</span><input type="checkbox" id="ags-unlock-cli" ' + (curCliAlign ? 'checked' : '') + '></div>',
        '      <div class="ags-row" style="justify-content:flex-end;gap:6px">' +
        '        <button class="ags-btn ags-btn-primary" id="ags-unlock-apply-btn">应用上下文解锁</button>' +
        '        <button class="ags-btn" id="ags-unlock-restore-btn">还原</button>' +
        '      </div>',

        '      <hr style="border:none;border-top:1px solid var(--ags-border);margin:2px 0">',

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
      var bodyEl = el.querySelector('#ags-drawer-body');
      if (!bodyEl) return;

      var tlBtn = bodyEl.querySelector('[data-action="toggle-timeline"]');
      if (tlBtn) {
        tlBtn.addEventListener('click', function () {
          state.timelineOpen = !state.timelineOpen;
          var cid = state.snapshot && state.snapshot.conversationId;
          if (state.timelineOpen && opts.api && opts.api.getSessionTimeline && cid && (!state.timelineData || state.timelineConvId !== cid)) {
            state.timelineLoading = true;
            state.timelineConvId = cid;
            render(null, true);
            opts.api.getSessionTimeline(cid, { limit: 15 }).then(function (tl) {
              state.timelineLoading = false;
              state.timelineData = tl;
              render(null, true);
            }).catch(function () {
              state.timelineLoading = false;
              render(null, true);
            });
          } else {
            render(null, true);
          }
        });
      }

      var attBtn = bodyEl.querySelector('[data-action="toggle-attach"]');
      if (attBtn) {
        attBtn.addEventListener('click', function () {
          state.attachOpen = !state.attachOpen;
          render(null, true);
        });
      }

      el.querySelectorAll('[data-days]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.days = Number(btn.getAttribute('data-days'));
          render(null, true);
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

      var curBtn = el.querySelector('#ags-currency-btn');
      if (curBtn) {
        curBtn.addEventListener('click', function () {
          state.currency = state.currency === 'CNY' ? 'USD' : 'CNY';
          render(null, true);
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
              if (q && q.ok === false) {
                showToast(q.error || '额度刷新失败');
                return;
              }
              if (state.snapshot && q) state.snapshot.quota = q;
              showToast('额度已刷新');
              render(null, true);
            }).catch(function (e) { showToast((e && e.message) || '额度刷新失败'); });
          }
        });
      }

      var cliBtn = el.querySelector('[data-action="launch-cli"]');
      if (cliBtn) cliBtn.addEventListener('click', function () {
        if (opts.api && opts.api.launchCli) {
          opts.api.launchCli().then(function (res) {
            if (res && res.ok === false) {
              showToast(res.error || '未找到 agy CLI 可执行文件');
              return;
            }
            showToast('已唤起 CLI 终端');
          }).catch(function (e) { showToast((e && e.message) || '唤起 CLI 失败'); });
        }
      });

      el.querySelectorAll('[data-acc-action]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var action = btn.getAttribute('data-acc-action');
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: action }).then(function (res) {
              showToast((res && (res.message || res.error)) || '操作已完成');
              if (opts.onRefresh) opts.onRefresh(true);
            }).catch(function (err) { showToast((err && err.message) || '操作失败'); });
          }
        });
      });

      el.querySelectorAll('[data-acc-refresh-one]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var email = btn.getAttribute('data-acc-refresh-one');
          if (opts.api && opts.api.accountsAction && email) {
            opts.api.accountsAction({ action: 'refresh_quota', email: email }).then(function (res) {
              showToast((res && (res.message || res.error)) || '额度已刷新');
              if (opts.onRefresh) opts.onRefresh(true);
            }).catch(function (err) { showToast((err && err.message) || '刷新失败'); });
          }
        });
      });

      el.querySelectorAll('[data-acc-switch]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-acc-switch');
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: 'switch', accountId: id }).then(function (res) {
              if (res && res.ok === false) {
                showToast(res.error || '切号失败');
                return;
              }
              showToast((res && res.message) || (res && (res.requiresWindowReloadHint || res.requiresRestart) ? '已切换账号，请重载或重启客户端生效' : '账号已切换'));
              if (opts.onRefresh) opts.onRefresh(true);
            }).catch(function (err) { showToast((err && err.message) || '切号失败'); });
          }
        });
      });

      el.querySelectorAll('[data-acc-remove]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-acc-remove');
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: 'remove', accountId: id }).then(function (res) {
              if (res && res.ok === false) {
                showToast(res.error || '移除失败');
                return;
              }
              showToast('已移除账号槽位');
              if (opts.onRefresh) opts.onRefresh(true);
            }).catch(function (err) { showToast((err && err.message) || '移除失败'); });
          }
        });
      });

      var autoSw = el.querySelector('#ags-auto-switch-en');
      var autoTh = el.querySelector('#ags-auto-switch-th');
      var autoPool = el.querySelector('#ags-auto-switch-pool');
      var autoStrat = el.querySelector('#ags-auto-switch-strategy');
      var autoCands = el.querySelectorAll('[data-auto-cand]');
      if (autoSw && autoTh) {
        var saveAuto = function () {
          var pct = Math.max(1, Math.min(95, Math.round(Number(autoTh.value || 10))));
          var picked = [];
          autoCands.forEach(function (chk) {
            if (chk.checked) picked.push(chk.getAttribute('data-auto-cand'));
          });
          var payload = {
            enabled: autoSw.checked,
            thresholdPct: pct,
            threshold: pct / 100,
            poolKey: (autoPool && autoPool.value) || 'shared_gemini_main',
            strategy: (autoStrat && autoStrat.value) || 'highest_quota',
            candidates: picked
          };
          opts.saveConfig({ quota: { autoSwitch: payload } });
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: 'update_auto_switch', autoSwitch: payload }).then(function (r) {
              if (r && r.ok === false) showToast(r.error || '保存自动切号配置失败');
              else showToast(autoSw.checked ? ('已保存低额度自动切号策略 (≤' + pct + '%)') : '已关闭自动切号');
            }).catch(function (e) { showToast((e && e.message) || '保存失败'); });
          }
        };
        autoSw.addEventListener('change', saveAuto);
        autoTh.addEventListener('change', saveAuto);
        if (autoPool) autoPool.addEventListener('change', saveAuto);
        if (autoStrat) autoStrat.addEventListener('change', saveAuto);
        autoCands.forEach(function (chk) { chk.addEventListener('change', saveAuto); });
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

      var hStyle = el.querySelector('#ags-hud-style');
      var hPos = el.querySelector('#ags-hud-pos');
      var hEn = el.querySelector('#ags-hud-enabled');
      var vialEn = el.querySelector('#ags-vial-enabled');
      if (hPos && hEn) {
        var saveHud = function () {
          opts.saveConfig({
            hud: {
              displayStyle: hStyle ? hStyle.value : 'ring',
              position: hPos.value,
              enabled: hEn.checked,
              showVial: vialEn ? vialEn.checked : ((cfg.hud && cfg.hud.showVial) !== false)
            }
          });
        };
        if (hStyle) hStyle.addEventListener('change', function () { saveHud(); render(null, true); });
        hPos.addEventListener('change', saveHud);
        hEn.addEventListener('change', saveHud);
        if (vialEn) vialEn.addEventListener('change', saveHud);
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
        var accInput = el.querySelector('#ags-new-theme-accent');
        var cvsInput = el.querySelector('#ags-new-theme-canvas');
        var sbInput = el.querySelector('#ags-new-theme-sidebar');
        var txtInput = el.querySelector('#ags-new-theme-text');
        var themesApi = globalScope.__AG_STUDIO_THEMES__;
        if (!themesApi) return;
        var base = themesApi.buildCustomThemeFromColors(
          (nameInput && nameInput.value) || 'My Theme',
          {
            accent: (accInput && accInput.value) || '#3B6CF6',
            bgCanvas: (cvsInput && cvsInput.value) || '#0F1117',
            bgSidebar: (sbInput && sbInput.value) || '#141720',
            textPrimary: (txtInput && txtInput.value) || '#F1F5F9'
          },
          (cfg.theme && cfg.theme.colorMode) || 'system'
        );
        var nextCustoms = ((cfg.theme && cfg.theme.customThemes) || []).concat([base]);
        opts.saveConfig({ theme: { customThemes: nextCustoms, activePreset: base.id } });
        showToast('已创建并应用 4 色自定义主题');
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
        var enInp = el.querySelector('#ags-dict-en');
        var zhInp = el.querySelector('#ags-dict-zh');
        var enVal = ((enInp && enInp.value) || '').trim();
        var zhVal = ((zhInp && zhInp.value) || '').trim();
        if (!enVal || !zhVal || !opts.api || !opts.api.getI18nPayload) return;
        opts.api.getI18nPayload().then(function (cur) {
          var nextExact = Object.assign({}, cur.customExact || {});
          nextExact[enVal] = zhVal;
          state.customDict = nextExact;
          return opts.api.saveCustomDictionary({ exact: nextExact, regex: cur.customRegex || [] });
        }).then(function () {
          showToast('词条已保存');
          render(null, true);
        }).catch(function (e) { showToast((e && e.message) || '保存失败'); });
      });

      el.querySelectorAll('[data-del-dict]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var key = btn.getAttribute('data-del-dict');
          if (!key || !opts.api || !opts.api.getI18nPayload) return;
          opts.api.getI18nPayload().then(function (cur) {
            var nextExact = Object.assign({}, cur.customExact || {});
            delete nextExact[key];
            state.customDict = nextExact;
            return opts.api.saveCustomDictionary({ exact: nextExact, regex: cur.customRegex || [] });
          }).then(function () {
            showToast('已删除词条');
            render(null, true);
          }).catch(function (e) { showToast((e && e.message) || '删除失败'); });
        });
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
          if (opts.api && opts.api.applyEnhance) {
            opts.api.applyEnhance({ promptTier: tier, chineseTitle: cn }).then(function (r) {
              if (r && r.ok === false) {
                showToast(r.error || '应用失败');
                return;
              }
              state.enhanceStatus = r || { promptTier: tier, chineseTitle: cn };
              opts.saveConfig({ enhance: { promptTier: tier, chineseSessionTitle: cn } });
              showToast((r && r.message) || (r && r.needsRestart ? '已应用，重启 LS 或客户端后生效' : '提示词与标题增强已应用'));
              render(null, true);
            }).catch(function (e) { showToast((e && e.message) || '应用失败'); });
          }
        });
      }
      if (enhRestBtn) {
        enhRestBtn.addEventListener('click', function () {
          if (opts.api && opts.api.restoreEnhance) {
            opts.api.restoreEnhance().then(function (r) {
              if (r && r.ok === false) {
                showToast(r.error || '还原失败');
                return;
              }
              state.enhanceStatus = r || { promptTier: 0, chineseTitle: false };
              opts.saveConfig({ enhance: { promptTier: 0, chineseSessionTitle: false } });
              showToast((r && r.message) || '已还原官方提示词与标题');
              render(null, true);
            }).catch(function (e) { showToast((e && e.message) || '还原失败'); });
          }
        });
      }

      // Context Unlock: ORIG / CONST / DYN + CLI align
      var unlApplyBtn = el.querySelector('#ags-unlock-apply-btn');
      var unlRestBtn = el.querySelector('#ags-unlock-restore-btn');
      var unlModeSel = el.querySelector('#ags-unlock-mode');
      var unlLimitInp = el.querySelector('#ags-unlock-limit');
      var unlConstRow = el.querySelector('.ags-unlock-const-row');
      var unlCliChk = el.querySelector('#ags-unlock-cli');
      if (unlModeSel && unlConstRow) {
        unlModeSel.addEventListener('change', function () {
          unlConstRow.style.display = unlModeSel.value === 'CONST' ? '' : 'none';
        });
      }
      if (unlApplyBtn && unlModeSel) {
        unlApplyBtn.addEventListener('click', function () {
          var mode = unlModeSel.value || 'ORIG';
          var limitTokens = Number((unlLimitInp && unlLimitInp.value) || 512000);
          var alignCli = Boolean(unlCliChk && unlCliChk.checked);
          if (opts.api && opts.api.applyContextUnlock) {
            opts.api.applyContextUnlock({ mode: mode, limitTokens: limitTokens, alignCli: alignCli }).then(function (r) {
              if (r && r.ok === false) {
                showToast(r.error || '应用上下文解锁失败');
                return;
              }
              state.unlockStatus = r || { mode: mode, limitTokens: limitTokens, alignCli: alignCli };
              opts.saveConfig({ context: { unlockMode: mode, unlockLimitTokens: limitTokens, alignCli: alignCli } });
              showToast((r && r.message) || (r && r.needsRestart ? '上下文解锁已应用，重启 LS 后生效' : '上下文解锁策略已应用'));
              render(null, true);
            }).catch(function (e) { showToast((e && e.message) || '应用失败'); });
          }
        });
      }
      if (unlRestBtn) {
        unlRestBtn.addEventListener('click', function () {
          if (opts.api && opts.api.restoreContextUnlock) {
            opts.api.restoreContextUnlock().then(function (r) {
              if (r && r.ok === false) {
                showToast(r.error || '还原失败');
                return;
              }
              state.unlockStatus = r || { mode: 'ORIG' };
              opts.saveConfig({ context: { unlockMode: 'ORIG' } });
              showToast((r && r.message) || '已还原原版上下文限制');
              render(null, true);
            }).catch(function (e) { showToast((e && e.message) || '还原失败'); });
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
          opts.api.restartLanguageServers().then(function (r) {
            if (r && r.ok === false) {
              showToast(r.error || '重启 LS 失败');
              return;
            }
            showToast((r && r.message) || 'LanguageServer 已重启');
          }).catch(function (e) { showToast((e && e.message) || '重启 LS 失败'); });
        }
      });

      var restartBtn = el.querySelector('#ags-restart-host-btn');
      if (restartBtn) restartBtn.addEventListener('click', function () {
        if (opts.api && opts.api.restartHost) opts.api.restartHost();
      });
    }

    function resetSessionState(nextCid) {
      state.timelineData = null;
      state.timelineConvId = nextCid || '';
      state.timelineLoading = false;
      state.speedHistory = [];
    }

    function render(dataPatch, forceUserAction) {
      if (dataPatch) {
        if (dataPatch.snapshot !== undefined) {
          state.snapshot = dataPatch.snapshot;
          if (dataPatch.snapshot && state.timelineConvId && dataPatch.snapshot.conversationId && dataPatch.snapshot.conversationId !== state.timelineConvId) {
            state.timelineData = null;
            state.timelineConvId = '';
            state.timelineLoading = false;
          }
        }
        if (dataPatch.history !== undefined) state.history = dataPatch.history;
        if (dataPatch.accounts !== undefined) state.accounts = dataPatch.accounts;
        if (dataPatch.fonts !== undefined) state.fonts = dataPatch.fonts;
        if (dataPatch.enhanceStatus !== undefined) state.enhanceStatus = dataPatch.enhanceStatus;
        if (dataPatch.unlockStatus !== undefined) state.unlockStatus = dataPatch.unlockStatus;
        if (dataPatch.rehydrateStatus !== undefined) state.rehydrateStatus = dataPatch.rehydrateStatus;
        if (dataPatch.i18nPayload !== undefined) state.customDict = (dataPatch.i18nPayload && dataPatch.i18nPayload.customExact) || {};
      }

      var bodyEl = el.querySelector('#ags-drawer-body');
      if (!bodyEl) return;

      // Avoid destroying focused input/select during background polling
      if (!forceUserAction && typeof document !== 'undefined' && document.activeElement && bodyEl.contains(document.activeElement)) {
        var tag = (document.activeElement.tagName || '').toUpperCase();
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
          return;
        }
      }

      var cfg = (opts.getConfig && opts.getConfig()) || {};
      var tabLabels = t('tabs');

      var titleSpan = el.querySelector('#ags-head-title');
      if (titleSpan) titleSpan.textContent = t('title');
      var closeSpan = el.querySelector('#ags-close-btn');
      if (closeSpan) closeSpan.textContent = t('close');
      el.querySelectorAll('[data-tab]').forEach(function (tb) {
        var tk = tb.getAttribute('data-tab');
        tb.textContent = tabLabels[tk] || tk;
        tb.classList.toggle('active', state.activeTab === tk);
      });

      var content = '';
      if (state.activeTab === 'overview') content = renderOverview(state.snapshot);
      else if (state.activeTab === 'usage') content = renderUsage(state.history, cfg);
      else if (state.activeTab === 'accounts') content = renderAccounts(state.accounts);
      else content = renderSettings(cfg);

      var prevScroll = bodyEl.scrollTop || 0;
      bodyEl.innerHTML = content;
      bodyEl.scrollTop = prevScroll;

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
      resetSessionState: resetSessionState,
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
    hud: { enabled: true, displayStyle: 'ring', position: 'composer', showVial: true, homeOverview: true },
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
  var refreshSeq = 0;

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
    var effMode = themes.resolveEffectiveMode((currentConfig.theme && currentConfig.theme.colorMode) || 'system');
    var themeSig = JSON.stringify(currentConfig.theme || {}) + '|' + effMode;
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
    applyVisuals();
    var domState = anchors.sniffDomTurnState();
    var composer = anchors.findComposerTarget();
    var now = Date.now();

    if (domState.conversationId !== lastConversationId) {
      lastConversationId = domState.conversationId;
      refreshSeq++;
      refreshBusy = false;
      latestSnapshot = null;
      latestTurnState = null;
      wasGenerating = false;
      happyUntil = 0;
      if (drawer && typeof drawer.resetSessionState === 'function') {
        drawer.resetSessionState(domState.conversationId);
      }
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
      if (typeof mascotStage.syncLayout === 'function') mascotStage.syncLayout();
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
    var mySeq = ++refreshSeq;
    var cid = anchors ? anchors.extractConversationId() : null;
    var reqCid = cid || null;
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
    var i18nFn = open && tab === 'settings' && api.getI18nPayload
      ? function () { return api.getI18nPayload(); }
      : function () { return Promise.resolve(undefined); };

    Promise.all([
      scanFn().catch(function () { return null; }),
      turnFn().catch(function () { return null; }),
      histFn().catch(function () { return undefined; }),
      accFn().catch(function () { return undefined; }),
      enhFn().catch(function () { return undefined; }),
      unlFn().catch(function () { return undefined; }),
      rehFn().catch(function () { return undefined; }),
      i18nFn().catch(function () { return undefined; })
    ]).then(function (res) {
      if (mySeq === refreshSeq) refreshBusy = false;
      var curCid = (anchors ? anchors.extractConversationId() : lastConversationId) || null;
      if (mySeq !== refreshSeq || reqCid !== (lastConversationId || null) || (curCid && reqCid && curCid !== reqCid)) {
        return;
      }
      var snap = res[0];
      var turn = res[1];
      if (snap) {
        if (reqCid && !snap.conversationId) snap.conversationId = reqCid;
        if (snap.abortedStale) {
          if (latestSnapshot && snap.quota) latestSnapshot.quota = snap.quota;
        } else {
          var isEmptyFallback = Boolean(
            snap.context &&
            snap.context.model === '未连接会话' &&
            !snap.context.usedTokens
          );
          var hasValidExisting = Boolean(
            reqCid &&
            latestSnapshot &&
            latestSnapshot.conversationId === reqCid &&
            latestSnapshot.context &&
            latestSnapshot.context.usedTokens > 0
          );
          if (isEmptyFallback && hasValidExisting) {
            if (snap.quota) latestSnapshot.quota = snap.quota;
          } else {
            latestSnapshot = snap;
            if (snap.context && snap.context.speed) {
              drawer.pushSpeedSample(snap.context.speed.tokPerSec || snap.context.speed.tps || 0);
            }
          }
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
          rehydrateStatus: res[6],
          i18nPayload: res[7]
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
    if (e.key === 'Escape' && drawer.isOpen()) {
      e.preventDefault();
      drawer.toggle(false);
      return;
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

  var hostThemeRaf = 0;
  function onHostThemeChange() {
    if (hostThemeRaf) return;
    var rafFn = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : function (cb) { return setTimeout(cb, 16); };
    hostThemeRaf = rafFn(function () {
      hostThemeRaf = 0;
      applyVisuals();
      hud.update(latestSnapshot, currentConfig, anchors && anchors.findComposerTarget());
      if (drawer.isOpen()) drawer.render();
    });
  }
  if (typeof MutationObserver === 'function') {
    try {
      var themeAttrObs = new MutationObserver(onHostThemeChange);
      var themeObsOpts = { attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-color-scheme', 'data-color-mode', 'data-mode'] };
      if (document.documentElement) themeAttrObs.observe(document.documentElement, themeObsOpts);
      if (document.body) themeAttrObs.observe(document.body, themeObsOpts);
    } catch (_e) {}
  }
  try {
    if (window.matchMedia) {
      var mql = window.matchMedia('(prefers-color-scheme: dark)');
      if (mql && typeof mql.addEventListener === 'function') mql.addEventListener('change', onHostThemeChange);
    }
  } catch (_e2) {}

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

    if (api.onI18nChanged) {
      api.onI18nChanged(function (payload) {
        try {
          if (window.__AG_STUDIO_I18N__ && typeof window.__AG_STUDIO_I18N__.applyPayload === 'function') {
            window.__AG_STUDIO_I18N__.applyPayload(payload);
          }
        } catch (_e) {}
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
