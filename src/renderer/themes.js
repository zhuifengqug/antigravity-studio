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
