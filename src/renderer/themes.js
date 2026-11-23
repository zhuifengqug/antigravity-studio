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
