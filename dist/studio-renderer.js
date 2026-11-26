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
      'aside:not(.ags-drawer), [data-testid="sidebar-split"]>div:first-child {',
      '  background-color: var(--ags-bg-sidebar);',
      '  border-color: var(--ags-border);',
      '}',
      '.agy-home:not(:has([data-testid="plugin-theme-home-wallpaper"])) {',
      '  background-color: var(--ags-bg-canvas);',
      '}',
      '.agy-home:has([data-testid="plugin-theme-home-wallpaper"]) {',
      '  background-color: transparent !important;',
      '  position: relative;',
      '  isolation: isolate;',
      '}',
      '.agy-inset-shell:not(:has([data-testid="plugin-theme-home-wallpaper"])),',
      '.agy-sheet:not(:has([data-testid="plugin-theme-home-wallpaper"])) {',
      '  background-color: var(--ags-bg-canvas);',
      '  border-color: var(--ags-border);',
      '  --sash-line: var(--ags-border);',
      '}',
      '.agy-inset-shell:has([data-testid="plugin-theme-home-wallpaper"]),',
      '.agy-sheet:has([data-testid="plugin-theme-home-wallpaper"]) {',
      '  background-color: transparent !important;',
      '  border-color: var(--ags-border);',
      '  --sash-line: var(--ags-border);',
      '  isolation: isolate;',
      '}',
      '[data-testid="plugin-theme-home-wallpaper"] {',
      '  pointer-events: none;',
      '}',
      '[data-testid="tiling-splitter"] {',
      '  background-color: transparent;',
      '  border-color: var(--ags-border);',
      '  --sash-line: var(--ags-border);',
      '}',
      '[data-testid="tiling-splitter"]:hover,',
      '[data-testid="tiling-splitter"][data-dragging="true"] {',
      '  --sash-line: var(--ags-accent);',
      '}',
      '[data-testid="sidecar-iframe-slot"], iframe[data-testid="sidecar-iframe"] {',
      '  background-color: var(--ags-bg-canvas);',
      '}',
      '[data-testid="model-selector-trigger"]:disabled,',
      '[data-testid="model-selector-trigger"][aria-disabled="true"],',
      '[data-testid="model-selector-trigger"][data-disabled]:not([data-disabled="false"]),',
      '[data-testid="permissions-selector-trigger"]:disabled,',
      '[data-testid="permissions-selector-trigger"][aria-disabled="true"],',
      '[data-testid="permissions-selector-trigger"][data-disabled]:not([data-disabled="false"]) {',
      '  opacity: 0.58 !important;',
      '  cursor: not-allowed !important;',
      '}',
      '[data-ag-cs-model-submenu="1"], [data-ag-cs-orch-l2="1"], [data-testid="context-menu-submenu-popup"] {',
      '  z-index: 6010 !important;',
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

  var lastSidecarModeByFrame = typeof WeakMap === 'function' ? new WeakMap() : null;
  var boundSidecarLoadFrames = typeof WeakSet === 'function' ? new WeakSet() : null;

  function resolveIframePostOrigin(iframe) {
    try {
      var src = (iframe && iframe.getAttribute && iframe.getAttribute('src')) || '';
      if (!src || /^plugin:/i.test(src) || /^about:/i.test(src) || /^data:/i.test(src)) {
        return '*';
      }
      if (/^https?:\/\//i.test(src) && typeof URL === 'function') {
        var u = new URL(src);
        return u.origin || '*';
      }
      if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') {
        return window.location.origin;
      }
    } catch (_e) {}
    return '*';
  }

  function collectSidecarIframes() {
    if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return [];
    var seen = [];
    var sels = ['[data-testid="sidecar-iframe-slot"] iframe', 'iframe[data-testid="sidecar-iframe"]'];
    for (var s = 0; s < sels.length; s++) {
      var list = document.querySelectorAll(sels[s]) || [];
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el && seen.indexOf(el) === -1) seen.push(el);
      }
    }
    return seen;
  }

  function syncSidecarIframeThemes(mode) {
    if (typeof document === 'undefined') return 0;
    var effMode = (mode === 'light' || mode === 'dark')
      ? mode
      : ((document.documentElement && document.documentElement.getAttribute && document.documentElement.getAttribute('data-ags-mode')) ||
         (detectHostDarkMode() ? 'dark' : 'light'));
    var frames = collectSidecarIframes();
    if (!frames.length) return 0;

    var sent = 0;
    for (var i = 0; i < frames.length; i++) {
      var frame = frames[i];
      if (!frame || frame.hidden === true || (frame.getAttribute && frame.getAttribute('aria-hidden') === 'true')) {
        continue;
      }
      if (boundSidecarLoadFrames && typeof frame.addEventListener === 'function' && !boundSidecarLoadFrames.has(frame)) {
        boundSidecarLoadFrames.add(frame);
        (function (fr) {
          try {
            fr.addEventListener('load', function () {
              if (lastSidecarModeByFrame) lastSidecarModeByFrame.delete(fr);
              var curMode = (typeof document !== 'undefined' && document.documentElement && document.documentElement.getAttribute && document.documentElement.getAttribute('data-ags-mode')) || effMode;
              syncSidecarIframeThemes(curMode);
            });
          } catch (_eL) {}
        })(frame);
      }
      if (lastSidecarModeByFrame && lastSidecarModeByFrame.get(frame) === effMode) {
        continue;
      }
      var cw = frame.contentWindow;
      if (!cw || typeof cw.postMessage !== 'function') continue;
      var targetOrigin = resolveIframePostOrigin(frame);
      try {
        cw.postMessage({ type: 'theme-change', theme: effMode, isDark: effMode === 'dark' }, targetOrigin);
        if (lastSidecarModeByFrame) lastSidecarModeByFrame.set(frame, effMode);
        sent++;
      } catch (_e) {
        if (targetOrigin !== '*') {
          try {
            cw.postMessage({ type: 'theme-change', theme: effMode, isDark: effMode === 'dark' }, '*');
            if (lastSidecarModeByFrame) lastSidecarModeByFrame.set(frame, effMode);
            sent++;
          } catch (_e2) {}
        }
      }
    }
    return sent;
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
    syncSidecarIframeThemes(resolved.mode);
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
    applyThemeToDocument: applyThemeToDocument,
    syncSidecarIframeThemes: syncSidecarIframeThemes
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
  var TILING_PANE_SEL = '[data-tiling-pane]';
  var INPUT_BOX_SEL = '[data-testid="agent-input-box"]';
  var COMPOSER_CARD_SEL = '[data-testid="agent-input-box"] .surface-composer-card, .surface-composer-card';
  var RUNNING_SEL = [
    '[data-testid="input-cancel-button"]',
    '[data-testid="stop-button"]',
    '[data-testid="cancel-button"]',
    '[data-testid="agent-loading"]',
    '[data-testid="thinking-collapsible-trigger"][data-op-thought-state="streaming"]'
  ].join(', ');
  var DECISION_SEL = [
    '[data-testid="interaction-takeover-card"]',
    '[data-testid="side-question-panel"]',
    '[data-testid="decision-card-blocking-ring"]',
    '[data-testid="agent-inline-card-slot"]'
  ].join(', ');
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
    if (el.closest && el.closest('[hidden], .hidden, [aria-hidden="true"]')) return false;
    if (typeof el.getClientRects === 'function') {
      try {
        var rects = el.getClientRects();
        if (!rects || rects.length === 0) return false;
        var r = rects[0];
        if (r.width === 0 || r.height === 0) return false;
        return r.width > 1 || r.height > 1;
      } catch (_e) {}
    }
    return el.offsetParent !== null;
  }

  var activePaneEl = null;
  var boundPaneDocs = typeof WeakSet === 'function' ? new WeakSet() : null;
  var lastBoundPaneDoc = null;
  var paneListeners = [];

  function isSubagentOnlyPane(el) {
    if (!el) return false;
    if (el.matches && el.matches(SUBAGENT_SEL)) return true;
    if (el.closest && el.closest(SUBAGENT_SEL)) return true;
    if (el.querySelector && el.querySelector(SUBAGENT_SEL) && !el.querySelector(CONV_VIEW_SEL)) return true;
    return false;
  }

  function resolvePaneFromTarget(target) {
    if (!target || typeof target.closest !== 'function' || isOwnNode(target)) return null;
    if (target.closest(SUBAGENT_SEL)) return null;
    var pane = target.closest(TILING_PANE_SEL);
    if (pane && !isOwnNode(pane) && !isSubagentOnlyPane(pane)) return pane;
    var cv = target.closest(CONV_VIEW_SEL);
    if (cv && !isOwnNode(cv) && !(cv.closest && cv.closest(SUBAGENT_SEL))) {
      var outerPane = cv.closest && cv.closest(TILING_PANE_SEL);
      if (outerPane && !isOwnNode(outerPane) && !isSubagentOnlyPane(outerPane)) return outerPane;
      return cv;
    }
    return null;
  }

  function handlePaneFocusEvent(ev) {
    try {
      var target = ev && ev.target;
      var nextPane = resolvePaneFromTarget(target);
      if (!nextPane) return;
      if (nextPane !== activePaneEl) {
        activePaneEl = nextPane;
        for (var i = 0; i < paneListeners.length; i++) {
          try { paneListeners[i]('pane'); } catch (_e) {}
        }
      }
    } catch (_e) {}
  }

  function ensurePaneTracking() {
    if (typeof document === 'undefined' || !document || typeof document.addEventListener !== 'function') return;
    if (boundPaneDocs) {
      if (boundPaneDocs.has(document)) return;
      boundPaneDocs.add(document);
    } else {
      if (lastBoundPaneDoc === document) return;
      lastBoundPaneDoc = document;
    }
    try {
      document.addEventListener('pointerdown', handlePaneFocusEvent, { capture: true, passive: true });
    } catch (_e) {
      try { document.addEventListener('pointerdown', handlePaneFocusEvent, true); } catch (_e2) {}
    }
    try {
      document.addEventListener('focusin', handlePaneFocusEvent, { capture: true, passive: true });
    } catch (_e3) {
      try { document.addEventListener('focusin', handlePaneFocusEvent, true); } catch (_e4) {}
    }
  }

  function isPaneUsable(pane) {
    if (!pane || pane.isConnected === false || isOwnNode(pane) || isSubagentOnlyPane(pane)) return false;
    return isVisible(pane);
  }

  function listVisibleMainPanes() {
    if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') {
      return { tilingCount: 0, viewCount: 0, panes: [] };
    }
    var tiling = document.querySelectorAll(TILING_PANE_SEL) || [];
    var visTiling = [];
    for (var i = 0; i < tiling.length; i++) {
      if (isPaneUsable(tiling[i])) visTiling.push(tiling[i]);
    }
    var views = document.querySelectorAll(CONV_VIEW_SEL) || [];
    var visViews = [];
    for (var j = 0; j < views.length; j++) {
      var v = views[j];
      if (!v || v.isConnected === false || isOwnNode(v) || (v.closest && v.closest(SUBAGENT_SEL))) continue;
      if (v.closest && v.closest('.agy-home')) continue;
      if (v.querySelector && v.querySelector('.agy-home')) continue;
      if (isVisible(v)) visViews.push(v);
    }
    return {
      tilingCount: visTiling.length,
      viewCount: visViews.length,
      panes: visTiling.length ? visTiling : visViews
    };
  }

  function paneMatchesList(pane, panes) {
    if (!pane || !panes || !panes.length) return false;
    for (var i = 0; i < panes.length; i++) {
      var p = panes[i];
      if (p === pane || (p.contains && p.contains(pane))) return true;
    }
    return false;
  }

  function getActivePaneScope() {
    ensurePaneTracking();
    if (typeof document === 'undefined' || !document) return null;
    var info = listVisibleMainPanes();
    if (info.panes.length <= 1) {
      if (activePaneEl && activePaneEl.isConnected === false) activePaneEl = null;
      return null;
    }
    if (activePaneEl && isPaneUsable(activePaneEl) && paneMatchesList(activePaneEl, info.panes)) {
      return activePaneEl;
    }
    activePaneEl = null;
    var actEl = document.activeElement;
    if (actEl && actEl !== document.body && actEl !== document.documentElement) {
      var fromActive = resolvePaneFromTarget(actEl);
      if (fromActive && isPaneUsable(fromActive) && paneMatchesList(fromActive, info.panes)) {
        activePaneEl = fromActive;
        return activePaneEl;
      }
    }
    return null;
  }

  function queryAllInScope(scope, sel) {
    var root = scope || (typeof document !== 'undefined' ? document : null);
    if (!root || typeof root.querySelectorAll !== 'function') return [];
    var list = root.querySelectorAll(sel) || [];
    if (typeof document !== 'undefined' && root !== document && root.matches && root.matches(sel)) {
      var out = [root];
      for (var i = 0; i < list.length; i++) out.push(list[i]);
      return out;
    }
    return list;
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

  function queryOneInScope(scope, sel) {
    var root = scope || (typeof document !== 'undefined' ? document : null);
    if (!root) return null;
    if (typeof document !== 'undefined' && root !== document && root.matches && root.matches(sel)) return root;
    return typeof root.querySelector === 'function' ? root.querySelector(sel) : null;
  }

  function readReduxConvoId(scopeRoot) {
    if (typeof document === 'undefined') return '';
    var sel = CONV_VIEW_SEL + ', ' + INPUT_BOX_SEL + ', #root, [data-testid="home-greeting"]';
    var anchors = scopeRoot ? queryAllInScope(scopeRoot, sel) : (typeof document.querySelectorAll === 'function' ? document.querySelectorAll(sel) : []);
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
    if (scopeRoot && typeof document.querySelectorAll === 'function') {
      var rootNodes = document.querySelectorAll('#root');
      for (var r = 0; r < rootNodes.length; r++) {
        if (!rootNodes[r] || isOwnNode(rootNodes[r])) continue;
        var rootHit = readFiberCascadeId(rootNodes[r], 300);
        if (rootHit) return rootHit;
      }
    }
    return '';
  }

  function findFormalConvView(scopeRoot) {
    if (typeof document === 'undefined') return null;
    var scope = scopeRoot !== undefined ? scopeRoot : getActivePaneScope();
    var views = queryAllInScope(scope || document, CONV_VIEW_SEL);
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
      var activeScope = getActivePaneScope();
      if (activeScope) {
        var scopedCv = findFormalConvView(activeScope);
        if (scopedCv) {
          var sAttrId = scopedCv.getAttribute && scopedCv.getAttribute('data-cascade-id');
          if (sAttrId && sAttrId !== 'conversation' && UUID_RE.test(sAttrId)) {
            return sAttrId.match(UUID_RE)[1];
          }
          var sFibId = readFiberCascadeId(scopedCv, 260);
          if (sFibId) return sFibId;
        }
        if (detectHomeState(activeScope).isHome) return null;
        var scopedComp = findComposerTarget(activeScope);
        if (scopedComp && scopedComp.inputBox && !scopedComp.isHome) {
          var sInpFib = readFiberCascadeId(scopedComp.inputBox, 260);
          if (sInpFib) return sInpFib;
        }
        var sReduxId = readReduxConvoId(activeScope);
        if (sReduxId && UUID_RE.test(sReduxId)) return sReduxId.match(UUID_RE)[1];
      }

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
      var cv = findFormalConvView(null);
      if (cv) {
        var attrId = cv.getAttribute && cv.getAttribute('data-cascade-id');
        if (attrId && attrId !== 'conversation' && UUID_RE.test(attrId)) {
          return attrId.match(UUID_RE)[1];
        }
        var fibId = readFiberCascadeId(cv, 260);
        if (fibId) return fibId;
      }
      var comp = findComposerTarget(null);
      if (comp && comp.inputBox && !comp.isHome) {
        var inpFib = readFiberCascadeId(comp.inputBox, 260);
        if (inpFib) return inpFib;
      }
      for (var j = 0; j < urlCandidates.length; j++) {
        var s2 = String(urlCandidates[j] || '');
        var um = s2.match(UUID_RE);
        if (um && um[1]) return um[1];
      }
      if (!detectHomeState(null).isHome) {
        var reduxId = readReduxConvoId(null);
        if (reduxId && UUID_RE.test(reduxId)) return reduxId.match(UUID_RE)[1];
      }
    } catch (_e) {}
    return null;
  }

  function detectHomeState(scopeRoot) {
    if (typeof document === 'undefined') return { isHome: false, homeRoot: null, greetingEl: null };
    var scope = scopeRoot !== undefined ? scopeRoot : getActivePaneScope();
    var root = scope || document;
    var homeRoot = queryOneInScope(root, '.agy-home');
    var greetingEl = queryOneInScope(root, '[data-testid="home-greeting"]');
    var formalCv = findFormalConvView(scope);
    var hasMessages = Boolean(
      queryOneInScope(root, '[data-testid="agent-response"], [data-testid="user-message"], [data-testid="planner-response-text"]')
    );
    var urlPath = (typeof window !== 'undefined' && window.location && window.location.pathname) || '';
    var hasConvUrl = !scope && ROUTE_UUID_RE.test(urlPath);
    var isHome = Boolean((homeRoot || greetingEl) && !formalCv && !hasMessages && !hasConvUrl);
    return {
      isHome: isHome,
      homeRoot: homeRoot || (greetingEl ? greetingEl.closest('main, section, div') : null),
      greetingEl: greetingEl
    };
  }

  var cachedComposer = null;

  function isWithinScope(el, scope) {
    if (!scope) return true;
    if (!el) return false;
    if (el === scope) return true;
    return Boolean(scope.contains && scope.contains(el));
  }

  function findComposerTarget(scopeRoot) {
    if (typeof document === 'undefined') return null;

    var scope = scopeRoot !== undefined ? scopeRoot : getActivePaneScope();
    if (
      cachedComposer &&
      cachedComposer.doc === document &&
      cachedComposer.card &&
      cachedComposer.card.isConnected &&
      isVisible(cachedComposer.card) &&
      isWithinScope(cachedComposer.card, scope)
    ) {
      return cachedComposer;
    }
    cachedComposer = null;

    var queryRoot = scope || document;

    // 1. Primary Antigravity 2.34+ .surface-composer-card inside [data-testid="agent-input-box"]
    var cards = queryAllInScope(queryRoot, COMPOSER_CARD_SEL);
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
      var ib = (chosenCard.closest && chosenCard.closest(INPUT_BOX_SEL)) || chosenCard;
      var ed = ib.querySelector ? ib.querySelector('[contenteditable="true"], textarea') : null;
      cachedComposer = {
        doc: document,
        card: chosenCard,
        inputBox: ib,
        editable: ed || null,
        isHome: Boolean(chosenCard.closest && chosenCard.closest('.agy-home')),
        isSubagent: false
      };
      return cachedComposer;
    }

    // 2. Fallback: [data-testid="agent-input-box"]
    var boxes = queryAllInScope(queryRoot, INPUT_BOX_SEL);
    for (var j = 0; j < boxes.length; j++) {
      var box = boxes[j];
      if (isOwnNode(box)) continue;
      if (box.closest && box.closest(SUBAGENT_SEL)) continue;
      if (!isVisible(box)) continue;
      var ed2 = box.querySelector ? box.querySelector('[contenteditable="true"], textarea') : null;
      var card2 = (box.querySelector && box.querySelector('.surface-composer-card')) || (ed2 && ed2.closest && ed2.closest('form')) || box;
      cachedComposer = {
        doc: document,
        card: card2,
        inputBox: box,
        editable: ed2 || null,
        isHome: Boolean(box.closest && box.closest('.agy-home')),
        isSubagent: false
      };
      return cachedComposer;
    }

    // 3. Generic fallback: visible contenteditable/textarea composer
    var inputs = queryAllInScope(queryRoot, '[contenteditable="true"][role="textbox"], [contenteditable="true"], textarea');
    for (var k = 0; k < inputs.length; k++) {
      var inp = inputs[k];
      if (isOwnNode(inp)) continue;
      if (inp.closest && inp.closest(SUBAGENT_SEL)) continue;
      if (inp.closest && inp.closest('.monaco-editor, [role="dialog"]')) continue;
      if (!isVisible(inp)) continue;
      var rect = inp.getBoundingClientRect ? inp.getBoundingClientRect() : null;
      if (rect && rect.width > 180 && rect.height >= 20) {
        var outer = (inp.closest && inp.closest('.surface-composer-card, [data-testid="agent-input-box"], form')) || inp.parentElement;
        if (!outer) continue;
        cachedComposer = {
          doc: document,
          card: outer,
          inputBox: outer,
          editable: inp,
          isHome: Boolean(outer.closest && outer.closest('.agy-home')),
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
    if (!stageEl || typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return false;
    var hitEl = (stageEl.querySelector && stageEl.querySelector('.ags-mascot-hit')) || stageEl;
    if (!hitEl || typeof hitEl.getBoundingClientRect !== 'function') return false;
    var hitRect;
    try {
      hitRect = hitEl.getBoundingClientRect();
    } catch (_e) {
      return false;
    }
    if (!hitRect || hitRect.width <= 1 || hitRect.height <= 1) return false;

    var overlaySel = [
      '[data-testid="queued-messages-card"]',
      '[data-testid="queued-messages-status"]',
      '[data-testid="interaction-takeover-card"]',
      '[data-testid="side-question-panel"]',
      '[data-testid="decision-card-blocking-ring"]',
      '[data-testid="agent-inline-card-slot"]',
      '[data-testid="model-selector-panel"]'
    ].join(', ');
    var overlays = document.querySelectorAll(overlaySel) || [];
    for (var i = 0; i < overlays.length; i++) {
      var el = overlays[i];
      if (!el || isOwnNode(el) || !isVisible(el)) continue;
      var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      if (r && rectsOverlap(hitRect, r)) return true;
    }

    var shelves = document.querySelectorAll('[data-testid="bottom-sticky-shelves"]') || [];
    for (var sh = 0; sh < shelves.length; sh++) {
      var shelf = shelves[sh];
      if (!shelf || isOwnNode(shelf) || !isVisible(shelf)) continue;
      var shelfItems = shelf.querySelectorAll
        ? shelf.querySelectorAll('button, [role="button"], a, [data-testid], [class*="card"], [role="status"], [role="alert"]')
        : null;
      if (shelfItems && shelfItems.length > 0) {
        for (var si = 0; si < shelfItems.length; si++) {
          var item = shelfItems[si];
          if (!item || isOwnNode(item) || !isVisible(item)) continue;
          var ir = item.getBoundingClientRect ? item.getBoundingClientRect() : null;
          if (ir && rectsOverlap(hitRect, ir)) return true;
        }
      } else if (shelf.children && shelf.children.length > 0) {
        for (var sc = 0; sc < shelf.children.length; sc++) {
          var child = shelf.children[sc];
          if (!child || isOwnNode(child) || !isVisible(child)) continue;
          var cr = child.getBoundingClientRect ? child.getBoundingClientRect() : null;
          if (cr && rectsOverlap(hitRect, cr)) return true;
        }
      } else {
        var sr = shelf.getBoundingClientRect ? shelf.getBoundingClientRect() : null;
        if (sr && rectsOverlap(hitRect, sr)) return true;
      }
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

    var scope = getActivePaneScope();
    var queryRoot = scope || document;
    var homeInfo = detectHomeState(scope);
    var cid = homeInfo.isHome ? null : extractConversationId();

    var isGenerating = false;
    var runNodes = queryAllInScope(queryRoot, RUNNING_SEL);
    for (var i = 0; i < runNodes.length; i++) {
      var rn = runNodes[i];
      if (rn.closest && rn.closest(SUBAGENT_SEL)) continue;
      if (isVisible(rn)) { isGenerating = true; break; }
    }

    var isThinking = false;
    var thinkNodes = queryAllInScope(queryRoot, '[data-testid="thinking-collapsible-trigger"]');
    for (var j = 0; j < thinkNodes.length; j++) {
      var tn = thinkNodes[j];
      if (tn.closest && tn.closest(SUBAGENT_SEL)) continue;
      if (tn.getAttribute && tn.getAttribute('data-op-thought-state') === 'streaming') {
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
      var toolNodes = queryAllInScope(
        queryRoot,
        '[data-testid="tool-group-collapsible"], [data-testid="running-items-panel"], [data-testid="background-task-command"]'
      );
      for (var k = 0; k < toolNodes.length; k++) {
        var tool = toolNodes[k];
        if (tool.closest && tool.closest(SUBAGENT_SEL)) continue;
        if (tool.getAttribute && tool.getAttribute('data-testid') === 'running-items-panel') {
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
    var subNodes = queryAllInScope(queryRoot, SUBAGENT_SEL + ', [data-testid="subagent-node"]');
    for (var s = 0; s < subNodes.length; s++) {
      if (isVisible(subNodes[s])) { hasSubagent = true; break; }
    }

    var awaitingDecision = false;
    var decNodes = queryAllInScope(queryRoot, DECISION_SEL);
    for (var d = 0; d < decNodes.length; d++) {
      var dn = decNodes[d];
      if (dn.closest && dn.closest(SUBAGENT_SEL)) continue;
      if (isVisible(dn)) { awaitingDecision = true; break; }
    }

    var hasError = false;
    var errNodes = queryAllInScope(queryRoot, ERROR_SEL);
    for (var e = 0; e < errNodes.length; e++) {
      var en = errNodes[e];
      if (en.closest && en.closest(SUBAGENT_SEL)) continue;
      if (isVisible(en)) { hasError = true; break; }
    }

    var modelTrigs = queryAllInScope(queryRoot, '[data-testid="model-selector-trigger"]');
    var modelTrig = null;
    for (var mt = 0; mt < modelTrigs.length; mt++) {
      if (isVisible(modelTrigs[mt]) && !isOwnNode(modelTrigs[mt])) {
        modelTrig = modelTrigs[mt];
        break;
      }
    }
    if (!modelTrig && modelTrigs.length) modelTrig = modelTrigs[0];
    var modelLabel = modelTrig ? String(modelTrig.textContent || (modelTrig.getAttribute && modelTrig.getAttribute('aria-label')) || '').trim() : '';
    var modelPanel = typeof document.querySelector === 'function'
      ? document.querySelector('[data-testid="model-selector-panel"]')
      : null;
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
    ensurePaneTracking();
    var timer = 0;
    var disposed = false;

    function trigger(reason) {
      if (disposed) return;
      var delay = (reason === 'route' || reason === 'pushState' || reason === 'replaceState' || reason === 'pane') ? 32 : 160;
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

    paneListeners.push(trigger);

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
          attributeFilter: ['data-cascade-id', 'data-op-thought-state', 'hidden', 'aria-expanded', 'disabled', 'aria-disabled', 'data-disabled']
        });
      }
    }

    var onPop = function () { trigger('route'); };
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('popstate', onPop);
      window.addEventListener('hashchange', onPop);
    }

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
      var idx = paneListeners.indexOf(trigger);
      if (idx >= 0) paneListeners.splice(idx, 1);
      if (obs) try { obs.disconnect(); } catch (_e) {}
      if (timer) clearTimeout(timer);
      if (typeof window.removeEventListener === 'function') {
        window.removeEventListener('popstate', onPop);
        window.removeEventListener('hashchange', onPop);
      }
      if (origPush && window.history) window.history.pushState = origPush;
      if (origReplace && window.history) window.history.replaceState = origReplace;
    };
  }

  ensurePaneTracking();

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
    watchAnchors: watchAnchors,
    getActivePaneScope: getActivePaneScope,
    ensurePaneTracking: ensurePaneTracking
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
  var SPRITES = {"version":1,"crabFrameMs":80,"deepyFrameMs":90,"whalegirlFrameMs":100,"crab":{"idle":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAAzCAYAAADSDUdEAAABQElEQVR42u3bwQnCMBSA4WQah/DqDg7gEM7gEA7gDl4dwmksCF4CRtOkoQ3fuwnFD4M/wsPEkMzzfHyFitldbvHXMwzGVozosBiMGYHsr/f368fpkH3T9LmSD8JgrN0QCIORC6T2Z+mfny0GY6uGw2IwBMJgCITBaB+IlR+DEcq3WA6LwRAIgyEQBqN5IJ+H09elz+U+CIOxdkMgDIZAGAyBMBjLB2KMscViMKx5GYzFAnE3gMEQCIPhwhSDMddwWAyGQBgMgTAY7QOx8mMwQvkWy2ExGAJhMATCYDQPxD87GQyBMBgCYTAEwmC4MGVM37HFYjCseRmMxoG4G7AuY5QvrwtTAmGMFIh/djIY3w2HxWAIhMEQCIPRPpDRtyYMRo0hEAZDIAyGQBgMF6YYjJ6GQBgMgTAYAmEwXJgypudMYIWU2Sprz98AAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAAzCAYAAADSDUdEAAAAfElEQVR42u3TMQ0AAAzDsJU/6SHo1deGECk5oIoEYBAwCBgEDAIGAYOAQcAgYBDAIGAQMAgYBAwCBgGDgEHAIGAQwCBgEDAIGAQMAgYBg4BBwCCAQcAgYBAwCBgEDAIGAYOAQcAggEHAIGAQMAgYBAwCBgGDgEEAg4BBYPDVcQA0Lxaw0wAAAABJRU5ErkJggg==","frames":24,"columns":8,"box":[24,20,24,16],"still":0,"gutter":1},"idle-look":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABECAYAAADEKno9AAABo0lEQVR42u3d0anCMBSA4XYah/DVHRzAIZzBIRzAHXx1CKdREEQoNNY2iT3hO29C8bsWfuSmCfbdYO7H/aNbMJvTpf92DYMRxejdLAZjRiDb8/X1+nbYJd90eN0vH4QxzZj7/ozlhkAEwkgFsvRracrXFoMR1XCzGAyBMBgCYTDyB9LKchyD4TkIgyEQBkMgDEbsQN4XD1//el3qgzAYazcEwmAIhMEQCINRPhBjjFUsBsMyL4NRJBBnAxgljC7g+RyBMASSCsTOTgZj3HCzGAyBMBgCYTDyB9LKchyD4TkIgyEQBkMgDEbsQOzsZDAEwmAIhMEQCIPhwJQxdccqFoNhmZfByBxIjX37cx0Go5YhEAYjFYidnQzGuOFmMRgCYTAEwmDkD6SV5TgGw3MQBkMgDIZAGIzYgdjZyWAIhMEQCIMhEAbDgSlj6o5VLEYzhkAYjDUF4mzANCPaj8K0aghEIIzagdjZyYhqCITBEAiDIRAGI2YgqX9uS/3hDMZagxAIQyACYQhEIAzG/wKxs5MRzRAIgyEQBkMgDEbMQIwxn3kCg9IFJgYjZPkAAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABECAYAAADEKno9AAAAm0lEQVR42u3TAQ0AAAyDMObf9BXcQSuBhAW8JgEYBAwCBgGDgEHAIGAQMAgYBDAIGAQMAgYBg4BBwCBgEDAIGAQwCBgEDAIGAYOAQcAgYBAwCGAQMAgYBAwCBgGDgEHAIGAQMAhgEDAIGAQMAgYBg4BBwCBgEMAgYBAwCBgEDAIGAYOAQcAgYBDAIGAQMAgYBAwCBgGDgEHAIEAdguEARb6hK8oAAAAASUVORK5CYII=","frames":31,"columns":8,"box":[24,20,24,16],"still":0,"gutter":1},"idle-wave":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAAsCAYAAAAgjfcKAAABZklEQVR42u3cwQ2CQBBGYbcai/BqDxZgEdZgERZgD14twmo0MTESorjoojvr999IiI9x5gmGhTSTn+W0WZ272/PtPqmjrjqSMTVY6iCIwVIHQaI1HaN+BkEqaMiUv7jq+KyO9OpAxibnwCMwcpilGEP1qOO3dSTDa7DU8YYgi93hun1cLwc/rL/fGEHeZYz5sj5l5DQdo10GQQwWxpAgpU99j4Y3IiP6ZRtGGUZoQboFaToGQTQdgyCajlGRIKWhrdwHwcAgCAYGQTAwCIKB8V1Bbjs/W4iWu99QIRgYtTMIgoFBEAwMgmBgTC+IiBBEhCAiBBGJJEgrr4ARIYjIWEEiLFP+p+UTQhASSjxBIjxcnyNIzS+fIAhBCEKQ2IJEvKR6xGyFYSQJMgmLIEKQPzhLGUmCEIQg8f+kT9lkDEIQhCAEIQhBCEIQw0sQgvSb7vHLOhhCEAwhCAZBCEIQgrQuiIjccwFK8iyHjlovAwAAAABJRU5ErkJggg==","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAAsCAYAAAAgjfcKAAAAb0lEQVR42u3TMQ0AAAzDsJU/6SHo3ceGECk5oIoEYBAwCBgEDAIGAYOAQcAgYBDAIGAQMAgYBAwCBgGDgEHAIGAQwCBgEDAIGAQMAgYBg4BBwCCAQcAgYBAwCBgEDAIGAYOAQcAggEHAIGAQMAisPaP+AC03rYJ9AAAAAElFTkSuQmCC","frames":12,"columns":8,"box":[24,15,24,21],"still":0,"gutter":1},"idle-laptop":{"body":"data:image/png;base64,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","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARgAAACQCAYAAADTGnSNAAACn0lEQVR42u3dgXHDIAxAUdh/aDpBcvalAkm8NwFF+NdN78IcAEGmLQAEBhAYAIEBBAYQGACBAQQGEBgAgQEEBhAYAIEBBAYQGACBAQQGEBgAgQEEBhAYAIEBBAYQGJ5YifZumSMCIzACg8AgMCAwHmqBQWCCH6xTP4PAQNPArAQ/w0q0n6vRbBGYFFHxAIHAhARGWEBgtvwZIDggMIDAwPu3SmcIgSH0T1bnCIEhLDDOEgKDtxgEhtpvMs4Yhs+20DhjAgM0jP7x51tg8CD1fqs8ujcGgwfJ3ggMJI9M1tAdXZfAIDL9Q3NsTQKDyNwRmiPfGyQwdI1MhrN+/ZeBCQwgMIDAAAgMIDCAwAAIDCAwgMAACAwgMIDAAAgMIDCAwAAIDCAwgMBs5xqK/MzIjF4FZiX87tBpSKnXYkZm9Coww+akf5DMyIxKrWfaHAfYjMxoR2BsjgNsRmYUGpjhPhcH2IzMKDIww30u6R8kMzKjEvyrERAYQGAABAYQGEBgAAQGEBhAYAAEBhAYQGAABAYQGEBgAAQGEBhAYK7m/h8z4h8C426Zz2sZ7v8xIzP6PTDDlyWnXo8ZmVG5tUyb4wCbkRntCIzNcYDNyIxCA2Nznq3nyT46wGZ0/Ywq3Ivk/h8zMqOia/HvPUBgAIEBEBhAYACBARAYQGAAgQEQGEBgAIEBEBhAYGhpOWMYfr2HdhZZp/OFA+CtIGR9zhYOgch4a2FPYNwtIzICQ2hghrtlUq8l+wO9vCnzbfC+kb3eb2WfeVAmMCLj1R9CAyMyIgOhgRnulhEZiAxMJpk+Z/CZBzQLDCAwAAIDCAwgMAACAwgMIDAAAgMIDCAwAAIDCAwgMAACAwgMIDAAAgMIDCAwAAIDCAwgMAACAwgMcLk/0milkRM/MM0AAAAASUVORK5CYII=","frames":43,"columns":8,"box":[14,13,34,23],"still":0,"gutter":1},"thinking":{"body":"data:image/png;base64,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","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPgAAADeCAYAAAAQJM0gAAAFXElEQVR42u3dwZabOBBAUen/P5pskk2OaZs2UhVV964yi+myQA9jd06YAyhrOgQgcEDggMABgQMCBwQOAgcEDggcEDiwL/Aj8CJg9t7Z1lx8zWeBzxd/3nUAzN672a258JoFbrNbc8PA3Sa7XbXmorfoI+jqZnbcbGsuOlvgZltz08CBhxM4CBwQOCBwQOCAwAGBg8ABgQMCBwQOCBwQOCBwEDggcEDggMABgQMCB4EDAgcEDrx37OhQ4GzbbMlmR695/vDfAud5my3R7Axr3vIaBO5dbAZt+KjZkWv+aY7AvYs9e7MlmR255hSBH8HhH5U/Ewm8feChn8HPbl+ibxkFbu2VjvmI/Ba94zt418/g3b9/KP9RdZ4sOPpER57sTrO7rr3NMT+7TYn+HBx5m9ppdte1tznmAhe4wBsF7lbRLbpb9KK36CPwipZlftfZXdde/pgL3GyBNwscKELgIHBA4IDAAYEDAgcEDgIHBA4IHBA4IHBA4IDAQeCAwAGBAwIHBA4IHAQOuWR4bthx8/wrP++22QInW2Arn/z5aTh3P3nkys+7dfZMepKzzR/NnrSy+tG6Z6GdPT56Z2SvXsO388Nmz8CTHL3Jrswfgc+u3hnZysA+2ezHwodxXI1sxfxx4d17rAp8x0n+5ERkm7/iNfx/0nfNPtvsx4an3UQFHhZZ5MX9ysGMXGTEu9gI2OiRs3ce++PC/nP39vDAz97FdmyyK+8ku+ZH3qJnCCzL9y8lHqkc/Rn8002+aoO/i2r1F10/RTYCN3mGX1NFO4IvMGP1r8l2nOR3Ue+YP/y6kKoybGyR0fkOYWmLM2pw5KITznbce85e/jl/Rg2u/uWGtZstcLOtvfdst+hu0c0ufM6XX1hm1ODIRSee7bibLXCBm13snI+IwAGBAwIHBA4IHBA4CBwQOCBwQOCAwAGBAwIHgQMCBwQOCBwQOCBwQOB/lXgG1Rfz7YHC+2Um2mifzr/zmWXd/x32q8cxw1M/o+c/ar/MX/yPdx/kK/Pvfurobw7aXf+WduTs3xy/bM/tjpofEfmvZ8/gwK5s9FeLvCvyK3cPdz67O3L2txus0/wsx//y7Cu36CsP8pX5I9km3/EaImdnOvaR3yE8OnAn+bvb2V2Bj6D1C1zgrT6HPeokFz32HhD5gfnQg3zXl0zfzh+NH5DY8Vv08dRfkz3tIAOLAgceHvjhQtCK890w8MgvEzputujP9s63wG22wut2vgvOnja62c533dnzwouw2erfqjrfArfZCq7b+W52i56Bjd6L890s8K6bDYELHBA4CBwQOCBwQOCAwAGBAwIHgQMCBwQOCBwQOCBwQOAgcEDggMABgfMs/g27BoF7tKyoxV40cA+H7/3ccHcPhQP/d4CjIouefzZr9/ptepYGPhJt8AwXmB2vIWr2u5+9avanP3fF/MjZAk84f2fgbl3xGdwtus/gAv/uQK/4uU+cPxp8yeZb9GaB05eoBQ4IHBA4FPhYs7zFGTnc7BSzo/8WXOfzPV/8eVvgy4ebnWJ25Jqdb4GbLfCys92im+0WvfDal19YZuRws1PNjv5dtvMtcLMFXnLtIypwQOCAwAGBAwIHBA4CBwQOCBwQOCBwQOCAwEHggMABgQMCBwQOCBwQOAgcEDggcEDggMABgYPAAYEDAgeSBn64EEDtwOeLP+/g4gLFA+94cYma3XHNbWbPpIvvenGJmO14F549L7yQLldWgTveAt98ENy2WbPZCwKP1O3iEj3b8S442zfUNpzIBA48kcBB4IDAAYEDAgcEDggcBA4IHBA4IHBA4IDAAYGDwAGBAwIHBA7c5Q/SYSAMIEE4AwAAAABJRU5ErkJggg==","frames":48,"columns":8,"box":[20,0,30,36],"still":24,"gutter":1},"typing":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOgAAAAPCAYAAADu6INCAAABCklEQVR42u2YMQrCMBSGkzNY0NHNQzi4CB7BVfAQnsFDFFw9guDi4CHcHPUUioVCK0k1pnkS3ve20MBH/rwvbWpNQF02y0fI/Ov91hovdidrAgsmzFhmzmXZUJgIiqA0EUwETS1oUQyqcM/rufP5tDya5vM+woUJE0HZUJgIyifut+GGcmKZh9WsxRsPR0ZinWTLJ260oNIbqqmJyBZBowR9hRsaaK5NJL1OskVQBEVQBEXQ/O9mmgTVkK0qQaXvD1rug2SLoL38JHIFPdnurWvsm1c3RkwTpWT6mig1k2xlslUnaB3c+9g3r9kYnwLuOuVTMf+xTrKVY6oRVOqkhwmTt+iPglIUJVdPjAgSPZi7vrUAAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOgAAAAPCAYAAADu6INCAAAAe0lEQVR42u3XQQqEMBBE0eT+h45blxI1XdDvrQcciv44MwcQa5oABAoIFAQKCBQQKIQHuoT6G9vySaCn36YVh1v1TNvy+ifu6UOqOtzRINJO27b6D+qQRCrS4EAdkkhFGh7ofeQnn3VIe8+1LduBVlgF32+Fb2JbDAbJLjEgJBDplrPGAAAAAElFTkSuQmCC","frames":6,"columns":8,"box":[15,22,28,14],"still":0,"gutter":1},"building":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOgAAAASCAYAAABRoJIHAAABFklEQVR42u2bMQrCMBiFkzNY0NHNQ3RwETyCq+AhPIOHEFw9guDi4CHcHPUUioVCK0nbkCZpk+9tIYHH//J/aVOoFAihwUoSAUIAihByDehjv/mYrH++X7Xx+nQzPhDwxNPWE0BpIjwBFEDxxBNAG5RlkyLc+26lnM+PV1Gd7yNcPPEEUDYUTwDlFbdruKY+tp6X7bLmN5/ORIx1htjPUNkmA2iIJgJQsgXQDoD+wjUNdKxNRJ1xZQugNC51AmiagIa4J1EngI4SUN/3h1Tug2QLoL18JFIFvTicpWqsW1c2hk0TufTUNVGMdfrezxDZJg9oGdz/WLeu2oxtATed8q48qTNuz2QA9Xnq4oknT1F+N0No0PoCUA0SQO8yjucAAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOgAAAASCAYAAABRoJIHAAAAnElEQVR42u3aWwrEIBBEUXv/i3YgCwjMg+6Mde53oKTLiwqp9Rn7ze9rfY9MmXFUw2B/MWCZMiMlrYahypQ5mRl3ggIgKACCAgQFQFCAoAAICuASdBP1KPR5oKDdp+nEJkrKTOgz6orbXerUJkrITOkz7g1KUpKS9MGCkpSkJH24oOvmh+YizF9LenKfUYJOsAfWl5KZ0idBAfTyAq6nNhOWaWWeAAAAAElFTkSuQmCC","frames":6,"columns":8,"box":[15,19,28,17],"still":0,"gutter":1},"conducting":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABLCAYAAABOWAokAAAC5UlEQVR42u3dP24TQRhA8dlTQElHww1S0CDR0NMicQjOwCEi0VBwhEhpKDgEHSWcIihBSJZlJ+P5u7vf7zVOIktP45knbxz7y5IAbJbFQwAIGMDsgH9+en93+P3Lz9+GBD7LG3XNELCABQwBC1jAELCAeYN6lxx5Kb/+/H64ffvl+1Ky6FHeQ/foZ8LRXiEJeNcBj3TO8Ebb2717BSzgKu89L549f/KZhrePN0t+dX37cPvj45tHZcf3qz1co7zH7hJvi4C36M090Lx9vEuO9L/w8OtT0uP71QQ80nvoLvV+ffeqKqSteksP9CxviIBbX97VLHqkt8Zd4+TlbXoJLWAH61Lvpa+y8rbxCljAVd5LL91523oFLGAhCbjtomd5HSxeAQvYweIVsIB5eQUsYN64AacTb7Y/9+b745/ffHh912LBvLy8AublFbAHmpdXwDaYl3dUwADWi4ABAQMQMAABAwIGIGAAAkYjzGcOMBcaAuYV8C4OeC5b+ZSMAev78i49pJcuepbXwar3JgPW1zPYXcD/GDFgfZb3lN+A9e16swLu/R8SZnkFHG+w+968QwJ+atGzvBEv7Vr/7s27wsHuEQ91xBG6yYD1zXvNhfbMYDbVhr0CFrCQBNx20aZS8vIKWMC8Ahawg8UrYAHz8o4OOJkeyMtrrKwHmpdXwLy8vALm5TXYHcAKEDAgYAACBlAecLTBY1HXDAELWMAQsIAFDAELGAI+f7hK2cqo1fTIH9ZHhSxgCLhBwCOdafInryIS4tNIAt5nwL3mb6fCqaO9vSnaYPdz8hHzmWd6U8MB3LMGrAs4P+ARg91HeZecQ1UykLp22PlIb/SAo8393n3ArS/vkqmUaQ1eAQe5hBbwPgPufbh672upt8eZ6r2vuV4BBww40gt3rR9ng90FLGABbytgG7xOr/0VsA0WsP0VsA0WsP0VsA0WsIBPi00P5OU1VtYG8/IKmJeXV8C8vAa7A5jFXymDATzbBcorAAAAAElFTkSuQmCC","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAABLCAYAAABOWAokAAABEUlEQVR42u3dgQ3CMBAEwXf/RSddJL77mQZOlljASMCZmWdmznzvr91ZemYKncUPaBFTE7CIRUx4wPTa9kS1ZlfAIrYbvCtgEdsN3hUwuAMDAgYEDAIGBAwIGBAwCBgQMCBgEDAgYEDAgIBBwICAAQEDAgYBAwIGBAwCppWfdS3dFbCI7QbvCljEdoN3jz81W3Nmiu/AIhYxwQGLWMSEBwwIGBAwIGAQMCBgQMCAgEHAgIABAYOAAQEDAgYEDAIG7gvYF/l3nJniV2ARi5jwt9AiFjHuwICAAQGDgEnms43iXQGLWMTBuwIWsYiDdwUM7sCAgAEBg4ABAQMCBgQMAgYEDAgYBAwIGBAwIGAQMHCvF4cYSEyz2wFOAAAAAElFTkSuQmCC","frames":24,"columns":8,"box":[20,12,29,24],"still":0,"gutter":1},"notification":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAA6CAYAAAD1AhaMAAABWUlEQVR42u3c0QnCMBRAUTuNQ/jrDg7gEM7gEA7gDv46hNMoCEIp7TOa9lnquX+B4MWECxLwNSsAgzSOABAIIBBAIIBAAIEAAgEEAggEEEg1t8Pu3l6vj2eOHzogEA7kBdK9tFr6Lp0jz1ESHcewY/BCNqfLc33db8MPfbcvunQOjrk7JpNExXPkOwQiEA6BjB+I3+rLdvQ5OcodAvmTQNoujnKHQDg4olcsh8XBEQQyttS7O8eSHALh4BAIB4dAODjyAnlt7q4/3Rd9EQ6OuTsEwsEhEA4OgXBwTB8IAIEAAgEEAggEEAggEEAggEAAgQACAZAUiLm583JAIBzIC8TEi2U5/KOwzmEMJQeH2bwcAhEIh0AMr+aod3KUOwTyJ4EYXv2dQyAcHNErlsPi4AgCGVvq3Z1jSQ6BcHAIhINDIBwchldzcGQ6BMLBIRAODoFwcBheDWTyAIP7YLMn+dBkAAAAAElFTkSuQmCC","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAA6CAYAAAD1AhaMAAAAw0lEQVR42u3csQ3AIAxFQf7+Q0PDCCBjdNektBR4gjTJoLO5n2k+41mxscww41wgFsQMgXhZZpghEHd3V16B2FjWw0e6jWU9nCDgBAGBgEBAICAQEAggEBAICAQEAgIBgYBAQCAgEEAgIBAQCAgEBAICAYFwnb/MCMTGMqNuhl+PmmGGQMwwQyDu7q68AsF6+Ei3sayHE8TGwgkCAgGBgEAAgYBAQCAgEBAICAQEAgIBgYBAAIGAQEAgIBAQCAgEBAJfWh22UDsMk+hAAAAAAElFTkSuQmCC","frames":16,"columns":8,"box":[24,8,24,28],"still":0,"gutter":1},"happy":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARgAAAB8CAYAAACynK90AAAEn0lEQVR42u3dzY3UQBCGYSYagtgrORAAQRADQWwA5MCVIIiGFUiW9rA9suVu1U8/7wWQFs837qrXJWulenwCgEU83AIABAOAYACAYBrw5/vXv+///fnHz0em6wEKqHBTywKCIRiCIRiC0dSyyEJ2BKN4h9eYleVOBmcEgmnS1KPvc5cZWcgOBDNBMJmaWhaCIZjgp33nqeHg5fXX/z9/f/vy9P+Nfs40teY6BGNqKN/U/65/XPv93z/KMfo5sus5TUVkIZgGTT3r/szOkE12BJNYMLOZcViRT8dMTS1L3nrJ1EcRWcoKxtQgS4V6IRhTgyyybDFNRWS5JBhTgyyy9Ho3tTrLQ8HIIossq7IQjCyyyEIwssgiC8E4pKAsH/226eg3UK/8rDOShWA0tSxql2AIhmAIhmDK3JjjmmeLd1XhauoagomuF4IhmNKNdCZf1OcSDMGUO6QMWbI0dXYi74vajctCMNhObmqXYACyIxiCAQhmgmAA4CoEA4BgABAMABAMAILBEywYA8Fo6mXXkwUEQzAEQzAEo6llkYXsCEbxDq8RuYPZGYFgmjX16PvcpfrCeYIhmDaCydTUshAMwQQ/7TtPDQeZtgbuPk0RjKmhVVNn2hpIdt5NEUyDpp51fzqvSCWY5IKZzYzDinw6ZmpqWfLWS6Y+ishSVjCmBlkq1AvBmBpkkWWLaSoiyyXBmBpkkaXXu6nVWWx2lEUWWZZlIRhZZJGFYGSRRRaCcUhBWSycl4VgNPUWC+fJThaCIRiCIRiCOVPAUdvxNHUtwWTapkgwBFOukc7ki/pcgiGYcoeUcU92VFNnJ/K+qN24LASD7eSmdgkGIDuCIRiAYCYIBgCuQjAACAYAwQAAwQAgGDzBgjEQjKZedj1ZQDAEQzAEQzCaWhZZyI5gFO/wGpE7mJ0RCKZZU4++z12qL5wnGIJpI5hMTS0LwRBM8NO+89RwkGlr4O7TFMGYGlo1daatgWTn3RTBNGjqWfen84pUgkkumNnMOKzIp2OmppYlb71k6qOILGUFY2qQpUK9EIypQRZZtpimIrJcEoypQRZZer2bWp3FZkdZZJFlWRaCkUUWWQhGFllkIRiHFJTFwnlZCEZTb7FwnuxkIRiCIRiCIZgzBRy1HU9T1xJMpm2KBEMw5RrpTL6ozyUYgil3SBn3ZEc1dXYi74vajctCMNhObmqXYACyIxiCAQhmgmAA4CoEA4BgABAMABAMAILBEywYA8Fo6mXXkwUEQzAEQzAEo6llkYXsCEbxDq8RuYPZGYFgmjX16PvcpfrCeYIhmDaCydTUshAMwQQ/7TtPDQeZtgbuPk0RjKmhVVNn2hpIdt5NEUyDpp51fzqvSCWY5IKZzYzDinw6ZmpqWfLWS6Y+ishSVjCmBlkq1AvBmBpkkWWLaSoiyyXBmBpkkaXXu6nVWWx2lEUWWZZlIRhZZJGFYGSRRRaCcUhBWSycl4VgNPUWC+fJThaCIRiCIRiCOVPAUdvxNHUtwWTapkgwBFOukc7ki/pcgiGYcoeUcU92VFNnJ/K+qN24LASD7eSmdgkGIDuCIRiAYCYIBgCu8gbdPYGprsABVAAAAABJRU5ErkJggg==","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARgAAAB8CAYAAACynK90AAACjElEQVR42u3d0Y2EMAxFUdN/0TMNICQSIj1b51QQgbmY+di9ii5+VXW5DHRiYHs81D/3DIGZF5ek62SDcR0EZtjwGmbR7zovEWfxZvYZYoP5Zl6S5ifmLC6E9RsbjA0G2wT9XIaXjbe1FxWvAuP3EJF9uh/mheXAeCPlxaV805sXGwweGszLzVkML9h4j51FYMAGY4MB+hEYQGAAgQEQGEBgAIEBEBhAYACBARAYQGAAgQEQGEBgAIEBEBhAYACBIYQ/AI7AeKiPncM9Q2CGxSXpOtlgXAeBGTa8hln0u85LxFm8mX2G2GC+mZek+Yk5iwth/cYGY4PBNkE//pk5O29rLypeBcbvISL7dD/MC8uB8UbKi0v5pjcvNhg8NJiXm7MYXrDxHjuLwIANxgYD9CMwgMAAAgMgMIDAAAIDIDCAwAACAyAwgMAAAgMgMIDAAAIDIDCAwAACQwh/AByB8VAfO4d7hsAMi0vSdbLBuA4CM2x4DbPod52XiLN4M/sMscF8My9J8xNzFhfC+o0NxgaDbYJ+/DNzdt7WXlS8CozfQ0T26X6YF5YD442UF5fyTW9ebDB4aDAvN2cxvGDjPXYWgQEbjA0G6EdgAIEBBAZAYACBAQQGQGAAgQEEBkBgAIEBBAZAYACBAQQGQGAAgQEEhhD+ADgC46E+dg73DIEZFpek62SDcR0EZtjwGmbR7zovEWfxZvYZYoP5Zl6S5ifmLC6E9RsbjA0G2wT9+Gfm7Lytvah4FRi/h4js0/0wLywHxhspLy7lm9682GDw0GBebs5ieMHGe+wsAgM2GBsM0I/AAAIDCAyAwAACAwgMgMAAAgMIDIDAAAIDCAyAwAACAwgMgMAAAgMM9wee28B9lQJsDwAAAABJRU5ErkJggg==","frames":32,"columns":8,"box":[18,6,34,30],"still":3,"gutter":1},"error":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAABOCAYAAABCH9izAAAB+ElEQVR42u3cwW3qQBRGYVMNRWSbHiiAIlJDiqAAemBLEakmrLKxbJhgz8z19Xc2bxPl6PHrMBgpcxgAVOPgJQAEBggMgMAAgQECAyAwQGDAXgL7+Tr9Lvmlx+9rUbitPNl99orrmw3s43Ib7ufP4e/fZ4x/9j+DtfBk99krru/pCVYiGcveeUes7cnus1dcnxPMCWavXieYz/SewexV6RnMYAKzl8AEZq/4gS39xaXiVp61XrCoPnttx2cwgdlLYAYTmMAMJjB7TQXmodmXHPbq8C3i+J1s7h3g1c+9+g/V9mT32SuuT2ACs5fADCYwgRlMYPYqCQzAOggMEBggMAACAwQGCAyAwACBAQIDsDwwf/6wLZ+94vrci5jAZ6+4Pjf7JvDZK67PCeYEs1evE8xnes9g9qr0DGYwgdlLYAKzV/zAXAO2LZ+9tuMzmMDsJTCDCUxgBhOYvaYC89DsSw57udnXNWA78WTyCUxg9hKYwQQmMIMJzF4lgQFYB4EBAgMEBkBggMAAgQEQGCAwQGAAlgfW8s8EuLgyu7rei8jFld3V9WZfLq7sLicYF1evE8znbC6uSs9gXkQuLoFxccUPrOV1WVxce3IJjItLYFxcAjMYF9dUYB5kubg6fIvY4rosLq7MLoFxcQmMi0tgBuPiKgkMwDo8AA9eURJus8MfAAAAAElFTkSuQmCC","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAABOCAYAAABCH9izAAAA+0lEQVR42u3csQ3AIAxFQbz/0NCwAEIgbO6alL9Intwl2ro+n9HOurVTfa/q+0ohvDCBCUxgArMjMB+8wAS2HxjggtlzwVwwEBggMBAYCAwQGAgMBAYIDAQGCAwEBgIDBAYCA4EBAgOBgcAAgUGFwPz0Jteen94ITGB2BCYwH77ABGZPYLkDA1wwey6YCwYCAwQGAgOBAQIDgYHAAIGBwACBgcBAYIDAQGAgMEBgIDAQGCAwqBDYzZ+b2LIlMB+HLYEJzJbABGbL1u+BAS6YLRfMBQOBAQIDgYHAAIGBwEBggMBAYIDAQGAgMEBgIDAQGCAwEBgIDBAYvGYAWINaT/xZEG4AAAAASUVORK5CYII=","frames":24,"columns":8,"box":[23,11,26,25],"still":4,"gutter":1},"sleeping":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAACQCAYAAADnY7WRAAADNUlEQVR42u3dQWryQACGYXMKs3TXQ2ThJtAjdCt4iJ6hhxC67RGEbLrwEN112Z4ixUBEBiZWZyLCPM/mVwi8qQMf4uJPtQCKVfkIwAAABgAwAIABAAwAYAAAAwAYAMAAAAYAMACAAQAMAGAAAAMAGADAAAAGADAAwGMPwNfrS39L4Pv3Z/j3+f0zaWz09fXz9w2Avr4BcAD6+gbgwg00u254fdi2k9eeX5fzA9DX18/b9w1AX983AAegr28AHIC+vgFICcZu4Gi1rE+vn94+qjn+YH19/f/3DYC+vgFwAPr6BsAB6OsbAD/C6OuX0b96AMblCN/Hrttv1n3OD0BfXz9f3wDo6xsAoEQGAAwAYAAAAwAYAMAAAAYAMACAAQAMAGAAAAMAGADAAAAGADAAgAEADABgAAADADzwAKQ+pCD1/0bX19efp28A9PUNgAPQ1zcADkBf3wDEbqDZdcP7w7advD68LtcHoK+vn7fvG4C+vm8ADkBf3wA4AH19A5AajN3A0WpZn16HTzbV19e/b98B6OsbAAegr28AHIC+vgHwI4y+fhn96tqbGFcrfB+7br9Z9yl/vL6+/nx9A6CvbwCAEhkAMACAAQAMAGAAAAMAGADAAAAGADAAgAEADABgAAADABgAwAAABgAwAIABAAwAYACARx2AWx9OkPpQBH19/fn6BkBf3wA4AH19A3DhBppdN7w+bNvJa8+vy/kB6Ovr5+37BqCv7xuAA9DXNwAOQF/fACwyPJM8vIGj1bI+vQ6faqqvr3//vgHQ1zcADkBf3wA4AH19A+BHGH39MvpXD8C4HOH72HX7zbrP+QHo6+vn6xsAfX0DAJTIAIABAAwAYAAAAwAYAMAAAAYAMACAAQAMAGAAAAMAGADAAAAGADAAgAEADABgAIAHHoDUhxSk/t/o+vr68/QNgL6+AXAA+voGwAHo6xuA2A00u254f9i2k9eH1+X6APT19fP2fQPQ1/cNwAHo6xsAB6CvbwBSg7EbOFot69Pr8Mmm+vr69+07AH19A+AA9PUNgAPQ1zcAfoTR1y+jX117E+Nqhe9j1+036z7lj9fX15+vbwD09Q0AUKI/kcexcqvrYVYAAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAACQCAYAAADnY7WRAAADHElEQVR42u3dMXbDIBAEUO/9Dy03aZXCxtqF+b9JiaIwI8B+Ub2ATtffz+oYvNx/aA2hAmBUCDrmx9U8N6/UPCgAAby7lsSxXwpAAAVQ+KMLIHkpKIDCbwUQPiGSA5he/ApA+CMDiAIQfgFEAVgKgi0AoAAABQAMcK3OrwKAxgB+cR1LxlYA7BaECSE85lMyBSB8grDX72wLIITtE/HluyJn5KcW3IzuNkwMwYTwJ28BjqEAPIVQAAghCgBQAIACABQAoAAABQAoAEABAAoAUACAAgAUAKAAAAUAKABAAQAKAFAAgAIAFACgAAAFACgASHA9nVEFAM0h/Oc6fj6uAmBiCKJC2DmuAtgriF5CalwFIITCf/C4I88AvA3Wk0gID1QbTQrvo3/uGpwBhKxGSwC3WYFgO7g8D7YA7PY3ST8YXTq2MAmfIASvRhWAp5DwB69Ga8HN6G5DH1PZAqAAPIXAFkAIQQEACgBQAIACABQAoABAAbgFoAAABQAoAEABAAoAUACAAgAUAKAAAAUAfKj1P1spAOgNoQJgVAg65seUNxHF5UEBCODdtSSO7QxAAAVQ+LMLIHkpKIDCbwUQPiG8BDW3+ONWoSUIAkjuKrSEXwAH3ov0reBj4zoD2CuIXkJq3EfPAMgOofAHnwFMCcGU9/B5EgnhcWqjSeFcIu+beVarP54PJYDbrECwHVyeB1sAdvubpB+MLh1bmIRPEIJXowrAU0j4g1ejteBmdLehj6lsAVAAnkJgCyCEoAAABQAoAEABAAoAUACgANwCUACAAgAUAKAAAAUAKABAAQAKAFAAgAIAPtT6n60UAPSGUAEwKgQd82PKm4ji8qAABPDuWhLHdgYggAIo/NkFkLwUFEDhtwIInxBegppb/HGr0BIEASR3FVrCL4AD70X6VvCxcZ0B7BVELyE17qNnAGSHUPiDzwCmhGDKe/g8iYTwOLXRpHAukffNPKvVQQXg4zETkdACsAUAWwBAAQAKAFAAgAIAFACgAAAFACgAQAEACgBQAIACABQAoAAABQAoAEABAAoAUACAAgC+9QbyOyagJXD/DAAAAABJRU5ErkJggg==","frames":32,"columns":8,"box":[18,1,31,35],"still":0,"gutter":1},"waking":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABCCAYAAAASc5kgAAACCUlEQVR42u3dMS4EYRTAcXsKSp1DKDQSR9BKHMIZHEKidQSJRuEQOiWnWCHZYGNnd2bf92a+b37/RsSaFzPvN6yIXRxI2tjCKZAAkQCRAJEAUcleby6Xv98/uX1YTOl4gGjU5W1lBiCAAAKI5W1xeVuZAcgMgax/LGrGf8cGBJDqlnfT/H3rmlErQkAmDiRjeVed3j19v325Pu881qbHZSMEZOJQMu/uGctb+4wS1wOQgDtNK3f3VmZEXg9AAoDUulhRC9bn2LWdK0AmCiRjeVuZAcgIPwaNfVcEBJAUIENP1hwWy4ztM8Ke8Lx9vH+/vbh/LvaFDJkBiBmAAGIGIN0zon/Vt8vJs1gzBTLkrtsXSPQMQMzwHQSQ8Bldf+O0/rl9HgsIIE0sbyszAEmaMbe7OyBbgETdeVfL+9Xx4dGfoRkzxgSyeuyuF73vBQdk2PmKuB6AzBzIrnOjjwcIIHsDyVjesSrxdQAyAEjJ5R0DiJKBtP4k3fJqn8LuvI9XZ8vSy5sxAxABAoiGApEEiASIBIgEiASIBIgEiASIBIgEiCRAJEAkQCRAJEAkQKRmgPg/rdOaoYkCyXjZADMAAQQQQAABBJBGgWT8V3QzPCcBBBBAAAEEEEAsLyDa9iS95EU2AwhAAAEEEEAAAcTyAgLI+kWv/YVnvICOAAFEgAAiQMxQHUAk/fQJyu/onaaoMKwAAAAASUVORK5CYII=","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABCCAYAAAASc5kgAAAAx0lEQVR42u3cMQ7AIAwEQe7/j8aNa0ok8EyTEiVh5dAkC852XzPx5uP927xD1hCIQKwhEJvXGhfXEIiN5VkJxOHWfQjEZ4P3IRAbC4d0EwQTxATBBAGBmCAIBAQCCAQEAgIBgYBAQCAgEBAICAQEAggEBAICAYGAQEAgIBAQCAgEEAgIBAQCAgGBgEDg40D80xaBCAQEAgIBh3QwQcAEAYGAQEAgIBAQCCAQEAgIBAQCAgGBgEBAICAQQCAgEBAICAQEAgKBJxSebiNDneQgOwAAAABJRU5ErkJggg==","frames":12,"columns":8,"box":[24,4,24,32],"still":11,"gutter":1},"poke-left":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOAAAAAiCAYAAABGDdVeAAABOElEQVR42u3b0WnCUBTHYTONQ/jaHRzAITqDQ3SA7uCrQ3SaChUpBBG9Judczv1+b4ryJ+gXMJJpM+vnc/+7eaPt8XtqeV/GbvRm5T1bbVtT1sG9u9OyG71Zea/qVjcAd1+nv8fnw8fDgfnrABwb4Brfm8itaA/dAVxzN3qz8h6ACwFc+qz57Fk0Yzd6s/KerWU+szSAax9w5G+KrJNND3vVtoYD6DehizI9bQEIIIAjAVz64PwPOOaerbYtAAGEAkAAAQQQQACh6AXg7Y3zx6++7tUDjdyN3qy8Z6ttC0AAoQAQQAABBBBAKLIBSoor/Spo1lVXCUAABeB9EBH3WmXsSQACKF0BVr9JVQIQQAlACUAApX+A8yf8DSEBCKAABFACEECNB7DqHQISgABKAEoAAigAJWV0AXMdwF+UPM9TAAAAAElFTkSuQmCC","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOAAAAAiCAYAAABGDdVeAAAAX0lEQVR42u3TAQkAAAzDsM+/6csYg0RCoTmgJhKAAcGAgAHBgIABwYCAAcGAgAHBgIABwYCAAcGAgAHBgIABwYCAAcGAgAHBgGBAwIBgQMCAYEDAgGBAwIBgQMCAsOwBnG0AIxAOm4wAAAAASUVORK5CYII=","frames":10,"columns":8,"box":[24,20,27,16],"still":0,"gutter":1},"poke-right":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOAAAAAiCAYAAABGDdVeAAABMElEQVR42u3bwY2CQBiGYajGIrzagwVYhDVYhAXYg1eLsBpNPBIHRYafceZ5b5uQfK76EBfWvhvpftw/uhltTpf+m+OidqK3WtizOW+zrwHglN3IrRb2bAYA3J6vr59vh93owPA4ANsC+Ov7pJXN4gFGPJnRL1ztezYzAsx99kz9klE70Vst7NnMu1kVwMgnMXXGrH3PJoD+5nMB5C83AQQQhpIB5n4A7gO6D2hzfBNAAGEAEEAAAQQQQABLBDi8eJK6F/XpuLV3orda2LM5bxNAAGEAEEAAAQQQQABLAihp2Yq4CrrmlS0JQAAFYBrE0t8HXGtPAhBAAZjnI+DUj4hrfMlSAhBACUAJQAAF4PvchpAABFAAAigBCKDaA1jzf/JLAAIoAAGUAARQAEqK6Aniw8BfVG17cAAAAABJRU5ErkJggg==","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOAAAAAiCAYAAABGDdVeAAAAX0lEQVR42u3TAQkAAAzDsM+/6csYg0RCoTmgJhKAAcGAgAHBgIABwYCAAcGAgAHBgIABwYCAAcGAgAHBgIABwYCAAcGAgAHBgGBAwIBgQMCAYEDAgGBAwIBgQMCAsOwBnG0AIxAOm4wAAAAASUVORK5CYII=","frames":10,"columns":8,"box":[21,20,27,16],"still":0,"gutter":1},"tickle":{"body":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAAAmCAYAAACmuFWEAAACIElEQVR42u2cP07DMBSHk1PAyMbCDTqwILGwM7AgcQjOwCGQWBjYWZBYGLgBCxsjnKLIlYwsK8Z/4mf7Vd9b0qZJfu778mvjtO/Nk0C8XJ9ujw4O/54f3z3NZvl5e7l1t7PrtURs/O7rXz/f0/nDm4r3By85XjPAMBi8GhvMH1hqmEHaSAFWGlYnNyHmRPLHtiZiwJZyseb4qScSvMbhJZLIVsBCOlIJbA0spAcvPbyCidzcv+6W7zdn/x7E3c4fZOgT2NWroVOSwBLd1G8Wo1tTL+XEh9eYvBaBmZ3sDu7jpYO72z1enGQBq6WTC+zq+aNI1z7OBbZWL2YweI3Lq+u1ttTcofecSHoOAS89vOYaCewNrOQSQBOwlEs3eI3JS+QuYitgre9KtQbW6i4ivOT0MBgGgxcGAxgGw2AAw2DwwmAYDF4YDGAYbP8N5v/uEvrdwq63A8wFJq3jJ9Dul6oX2m4UPXiNywuDYTB4YTCAYbA9MlgssakDrHXc0oT11k/NR+33B69xeKkqoCMIbUFFc8EnaGj8VDTDC4NhMHj1Nhgl6GlBywB4xXhRgj4wsJAevPTwogSdlgHwomUAJegTLQNU8qIEXWBOJD2HgJceXrQMUACMlgG0DOgCjH/Tw2t0XhgMg8ELgwEMg2EwgGEweGEwDAYvDAYwDEbLAAr4xtCDFxXNAMNgGAxgGAxetAyoFrQMgJc0L1oGEIRg/AK4PayuLH1zswAAAABJRU5ErkJggg==","ink":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAAAmCAYAAACmuFWEAAAAZklEQVR42u3TMQ0AAAzDsJU/6b0l0M+GECk5YCYSgMHAYIDBwGBgMMBgYDAwGGAwMBgYDDAYGAwMBhgMDAYGAwwGBgMMBgYDgwEGA4OBwQCDgcHAYIDBwGBgMMBgYDAwGGAwMBjQHkjBACfj5OmDAAAAAElFTkSuQmCC","frames":16,"columns":8,"box":[23,18,26,18],"still":0,"gutter":1}},"deepy":{"idle":{"dataUri":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlAAAAAZCAYAAAD+KhDIAAADjElEQVR42u3dO3LUQBCAYc0dICWEKxgyAgIiMmJ8Ax+FG+CYjIiAgIzlDA6JfQcoFWWzqLSjeXT39Mz8nfhVK33VI/X0aLVyWIhm8eT5h9/3d7cBE7mayUYQBDFCqBRYJrs+Tavn1dtPy4+v10vMZe326PKaK4538kMQhM15FzQwTHZ9m9a45Ep1j+7ymiuOd/Izw4KK5pcFugeTWgPFZNe3aeta/7Z+PTLP4vKaK4538jODiUaTBboHk2oDxWTXt+lh3+eWPW+rJqq1y6MppSikFI2RTdSDMUw0mizQW5vUGygPE8tMpodBj8XRimS7/23k5qjWpOHyaNIuCtuC4KFQtTJ5a36pmzSaLND7O8ZDLxPLiI3BDKaU7aVu82hbvTdQEqZYUSgpUt5Mmp7SscPU7qovjaaNiWN83xRKJ7vaibjFJIypX5Oka3STVKHyZpKsT1Jjl2uyqJuY+m00Gbu+TCEXlFqoLm0vtbiVujCNaZJyzWCSKFLeTNL1SWLsSkza5x4mTJjsTKEGdLST2PuwGhMwprFNta6ZTEdFQbJ50jZp1aeasas1aZx7mDBhsjXt3sRZAzu/UU3iZmiJZGHq31TrmsV0/pbEpXsgUu4x8mLSqk81Yydpkjr3MGHCZG8KEh3dXkEsWflKd5qYxjHVumYxWd1bYGXSqk81Yydtkjj3MGHCZG8Ke5etLiFjfytZAeYkS8uFCdPoppqmrrVp9hx5zBMmXZN2MHZypuBxYrFKFqZ+TTRQc5hoMjHNZIpdIT26esrY2ZuCVfdreRMyJkyYZBqo1qaZc+QxT5gwYTpooL58vPyCdzfHO5Z4eJikC9NYJqlmBZN/k0V9am2SOPcwYcJkb/rvU3gxTA5wiyqdhEtcmDBhGsfksT7VmLRcmDBhsjc9foTv87e/G3j9LA/19MX1EntkfM2j60tdmDBhGsfksT7VmLRcmDBhsjWFPVgObg+0FDy1OiVhqS5MmDCNZfJYn0pNmi5MmDDZmcLeJbIU3Pdf/75//0a/mKe4MGHCNK7JY33KMVm5MGHCZGMKKR3eUaygJfLRSqn/QJ3jwoQJ05gmj/Up12ThwoQJk65pewXq6uzHU4bp5dFrKjrNq82vTpgwYZre5LE+nTJfruLChAmTjSlECqZo3N/d/hQo4pgwYcKECRMmTM1NwQJWkiRMmDBhwoQJEyavprAQBEEQBEEQWfEHUI9Y+7Gx+3kAAAAASUVORK5CYII=","frames":16,"columns":16,"box":[12,26,36,24],"still":0,"gutter":1},"idle-look":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[11,11,37,39],"still":0,"gutter":1},"thinking":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[0,6,47,44],"still":6,"gutter":1},"typing":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[0,17,52,33],"still":5,"gutter":1},"building":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[2,0,50,50],"still":0,"gutter":1},"conducting":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[1,0,51,50],"still":2,"gutter":1},"notification":{"dataUri":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAwAAAAAsCAYAAADSB99eAAAIi0lEQVR42u2dv64dNRCH7UdAIkI0lNCkgAYFOgoU0YBEcWsiHgAKGp6AhgIeAJE6BRI0KEKCjiAaKNKQDhqEEimPcNASre5qsXe9u57xjPf7Vcn9c+7YO/5+6/GcPTEghBBCCCGETqPIFPjR8y9/cMl976tPnoYPP3/uv38/eXSX64oQQvAfIYTYAHgH/+Nv/i76+Rvvv2jWBFImNsQ6fB3jQggh+I8QYgOgBqEBrgM4Q+MKyuXh7Xvx5v2rIgP49IUQPvvHtAHk5tqTaSGE4D/8h/8IsQFwDv6lSopFE/BsAJeHty8lP4cBIITgP/xHCLEBOAScePN+TBlAEv4JkFqsongzAK/zjRCC//Af/iPEBqAAuingtjQBDAADQMv5NIp5R/Af/sN/+I/YABQlzVRj/6T1ROrOADKyZAClxmXh6P0s8J9fj3HurZvCEoM8mNlS/B7YCf/hP/yH//C/H/7HeeUkJI5Ps+A0Cp5NBjDAaBAVIN05Nx73mQwgCQZDFV3vDCrtPW8dN/yH//Af/sP/8/A/pkygyAAcHuN5hVF3BuDwBsJ79cH7WiZuvU0A/If/8B/+w9H+4449T74nGKUe/7ZlB+nOABzlT9cVUEBK3PAf/sMc+A9H2QCczgCM9CMOBhCeHb1dHalCWKtElMDTev/nGfPf4jEqBsAY4D/8J//hP/xnAzAHaPbxb1urKZ4WsodYp/OdesNRcPDmnTNVQDEA4ob/8B/+w3+uARsAN4lT+ji6tUqKl6dZeHrT1HTOvZgXFSDMSyvuQAsE/If/cJNxwH8XGwDHz/JNVSU8PX1gjN/jExO8mlcv+V/yyZxUgIgd/sN/+A//uQZ9xx5Lqie9vAkmBaHAs4cxgE6rD7kbh7lSz4WmAqQfe8tH78F/BP/hP/w/F/+LNgCho8dgea+g9GIC3ipuvVVAcz25Xj9IxXL8S/NtJXb4j+A//If/5+J/PDoYIIp6NxQqoLaB6qntJDhuPYH/CP7DfxjUD//jkeQB/n6rGiXJ6mVhvfnO1+Hn7+8sxnv0+lABtWlgXs3LKz/hP/yH//AfBvURezxb8rSEEGORi3dQLuaaY6ICioGd3XzhP/yH//AfBvmPPbaejB4WUAtoSlUkejOAEoM4S/WB9czcEzP8h//wn/XM3DfdAGgd3Wno3Y8ul7UKRO0xYAD/B/z0Gozzk/reWasPvd0EIb8shf/wH/7Df9SWpdHCwtU4upME6GgAqbFIjGEOvZy2/s3a1RKN+U/NxRB76muACQOQrqickaXwH/7Df/gP//2x1MQGYB74fPdeO6lqAzRlAPMxfPdlVIX/NJ49MM0dp9a4DrXnv+T1LIJpuijXrpFlIJUCKHT2xkIv8695Ywf/4T/8h//w3wf/o5XAp7CS3r17NYCt8N9qBLnrMarGopAwsLXXtLqQl26CpIFUswK6Ng6LN6BHzMxLHkm1QcB/+A//4T/898//2DJ5Wu3cp8CuAaD566WOII8aQOpi7jWCJcjUMkVtA8u9tuVFnDu+lq6ESlfgcgCyamDaBlA7du02CPgP/+E//If//vkfJZOnZCDau/e9EFoaj8YY5n/j2y9CuPHKnaQhLH0vVdkpNZaj8K9tYNOFlEr24ODIMbd4g1AlVKsCJ30DKt0DLWUAW/lp7WYa/sN/+A//4X8f/I/S8Dyyc6+9gGtAaOl4S9LASo/L175Xu3LU0sBaHftKHp9auHmruY5bwX8PR0oM4EgvrsTNZ8ubUPgP/+E//If/fvkfNZJnawVF8uhl/Du1KihaENI2gHmVqDZ8JOOXPrqrvYMved0aBhwEWgg0YtcwsLVq3HS97xnPUX6Gxm0Q8B/+w3/4D//74n/UTJ7SCoqGAUgDSKJ6daQislW1nlqhbQAauSOxcNfmwmoLgVYPt5Ue6LDzaLnm+tRug4D/8B/+w3/43x//o3bylCSQZwPQBNAw14OG+R70+I/r77/38XKM2senWgYm0TMchI/Tc39DsoLo0QBa90DvHU9tfgblNgj4D//hP/yH//3xf/djnoKz47tQ0G9qEUApSIzgL1HOCHIm4NnAtIyr5gJeyrseWgi8xl/zerSI3WvuwH/4D//hP/zX4f+pNwAeADSP/94Pz/7uWy+V/14KSNPrtPUd5xYNTNO4vN3A9bCGW0F0qlpv/tIwX3IH/sN/+A//4X/1DYC36skcQlPQ1wCQ5iPHpiZQagS5ioT2o9IkDUyzatiDAUhWTDy3EGhU3zzFDv/hP/yH//C/z9h3bwD2Vk9aV1C8G8B0HGtG8NNf1/++etueCXgwsJLHa1m/gQuKPcT0QMvzMxhpg4D/8B/+w3/475f/m58CtOX4Lhg4wssByEsFYgtMlzQYQFDqN+zJwHIGILWAJQ0gCB/BB8ctBBbn3gpD4T/8h//wH/73x/+4BzZb4GkRoD/+ef3R7Z6OUHsxAE/xH128WyEkfZwt2UMsnT/ee6D38tMCQ+E//If/8B/+98X/eGTBlg7EGkBrVyBaftx4yacSTud46edbVbE8xJ8yq6MQCjs+8rv2OLzdAPXSA107f6zmDvyHn/Af/hO/Tf7HvQu2ZCAWexAlKhCtTQDpm1XpQt6yBjRNIDjtIQ4d9EBL5Y+l3IH/CP7Df+K3zf9DHy1dCs9g9AiyZgUCAzifGWzJ/5I1EBr04tJC0CZ+ifyxmjvwH8F/+E/89vi/5wTg1uS/Dzb86htrv6O0+3299ms+eXT3V+XEf7Vy/L8rx/9a5fh/U4x9b/4XrYEgf5R9a/alB87Wb0/xV88fhT5c+A//4T/8h/8d8D8enPzaIP3FG/y1TaA2/LVNoDb8NU2gg/wnfuI/c/zwH/6zfomf+PdsACQHIT35kiZABaitCTSsAHnMf+In/jPHD//hP+uX+In/yHsAEEIIIYQQQv70L9zed3eY22t6AAAAAElFTkSuQmCC","frames":16,"columns":16,"box":[3,7,47,43],"still":6,"gutter":1},"happy":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[0,5,52,45],"still":13,"gutter":1},"error":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[4,17,45,33],"still":8,"gutter":1},"sleeping":{"dataUri":"data:image/png;base64,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","frames":16,"columns":16,"box":[2,2,44,48],"still":2,"gutter":1},"poke-left":{"dataUri":"data:image/png;base64,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","frames":12,"columns":12,"box":[1,16,50,34],"still":0,"gutter":1},"poke-right":{"dataUri":"data:image/png;base64,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","frames":12,"columns":12,"box":[8,16,44,34],"still":0,"gutter":1},"tickle":{"dataUri":"data:image/png;base64,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","frames":12,"columns":12,"box":[9,17,43,33],"still":0,"gutter":1}},"whalegirl":{"idle":{"dataUri":"data:image/png;base64,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","frames":21,"columns":21,"box":[0,0,69,66],"still":0,"gutter":1,"durs":[700,280,280,240,360,60,90,60,650,280,280,240,420,60,80,60,140,60,80,60,800]},"idle-look":{"dataUri":"data:image/png;base64,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","frames":13,"columns":13,"box":[0,0,69,66],"still":0,"gutter":1,"durs":[500,420,70,80,70,380,420,110,420,140,140,140,400]},"thinking":{"dataUri":"data:image/png;base64,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","frames":17,"columns":17,"box":[0,0,69,66],"still":0,"gutter":1,"durs":[220,220,260,260,260,300,170,170,170,170,170,170,90,110,200,200,260]},"typing":{"dataUri":"data:image/png;base64,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","frames":14,"columns":14,"box":[0,0,69,66],"still":0,"gutter":1,"durs":[150,170,150,170,150,170,210,150,170,150,170,150,170,210]},"building":{"dataUri":"data:image/png;base64,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","frames":24,"columns":24,"box":[0,0,69,66],"still":0,"gutter":1,"durs":[130,100,80,90,100,120,90,130,130,100,80,90,100,120,90,130,130,100,80,90,100,120,90,130]},"conducting":{"dataUri":"data:image/png;base64,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","frames":12,"columns":12,"box":[0,0,69,66],"still":0,"gutter":1,"durs":[150,150,150,150,150,150,150,150,150,150,150,150]},"notification":{"dataUri":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAjAAAABDCAYAAACC2D8pAAAMuUlEQVR42u2df5AWdR3Hv49NDGFwnEfheYCeUA3CdCQniMNAnGMEA6HETCQpDUlMqRRKOWrSoOKkA0hMVKQxA0TyB5kkQeTIFZMocBTngGRhoHEDFgccl+cNWNd8vnffne+zt8/z3HHP7n73eV7vf/bHs/vcs69773s/+93d76YUQgghhFDClAIBQgghhChgEEIIIYQoYBBCCCGEKGAQQgghRAGDEEIIIUQBgxBCCCFEAYMQQgghChhn1XZoVlunDRy5JWV/bk8Xk3KxgQlMEPnCvgQTCpiITSKmsM3y7n291MCVFzBNwI4EG5gg8oV9CSYUMBgGNjBB+IV8gQ1MKGAwDGxggvALbGCCirSA6bSRCTBM38vHer+/+b29qWJnEyYP/ILwC/lCviQ/X1KFaJgkVbyGy4zFT+np1ub31c61388roySxiYIHfik8kS/kC/lSfPmSKiQgSXtKQNgYLrbOHW9Uf9zyZGgh43K4RMVDJfApgaj5JKlwIV/IF/Kl+PIlVWhAjGmSYpRfLJ2YsoN48oKloQewy826UXPBL8kuXsgX8oV8Kd58SRWiYVy/xmi4GCb+z8Iyi+ts4uCCXwqjgCFfyBfypfjyJQUYd8xiLxM0v5B5wQUu5At+gQtcnChgMEzmbfZvn/8GRJluOr+n07ol/W4qWEZwgQv5gl/gAhdnChgM0zVONgPZ9iAmovXratXceZPSGBUqH7jAhXzBL3CBSywFDIbJzUOGq1ct87bVv+22tm+tU1NnVGcM40I6MMEFLuQLfoELXGIvYDBM9rCtrzumqqorvc/809m42MsKn6SzgQtcyBf8Ahe4OFHAYJjMTIK2c8S4R7Kue/jVx+ACF7iQL/gFLnAJq4AxZ0VhgEmyafyBK5LtMjyGDq/Ouv5bR+qyMppQMwcucCkKLuQLfoELXFJhQgkDTJJN42fTVR5+NTafUudOnPDYCI+Drx/XTeZJDF+4wIV8wS9wgYtzBUy+wYgKIXyFSXd52Bp5/ZVq66Ztmo3/ej9c4FKoXMgX/AIXuERWwOQbjCjJ4fu3N7ermpkrPCb9rynTXZ9nkv9z4WHLsLGVxB0JLnAhX/ALXOASewEjUERhg0mSaUzwlg+erm645S5vm1XHu1v8DMxnRma+n8uJMxfVgR07PTZyT8CX71iox+ECl0LkQr7gF7jAJe8FjA1FFAYYZV23TpJpzI2HE2c9kDa/d1kfdfhPu9WI8RNU774fCeQSFMyGz5qHFrVPT56rHv7KaM3D/I0kvKEYLnAhX/ALXODiRAETBCWfYJIcvpnYyE2FwqW1sSVwXfk8UzO5bPcV5ZWqteW8amlq9MYl3JO8I8EFLuQLfoELXJwoYPIFRpTU8M1klq48NZGNS5+SMs3j9I5ZasjsWu/sNCk7ElzgQr7gF7jAJfYCJlu45AOMKKnh2xPDqCxPWci2S9P6xVdWKqUGq1GLX9fLFsOOBJfi4UK+4Be4wMXpAiYXGNXRgVWSTJPNLLvuulzNf2V41vV/9bUL3nZmM8z+5QvUDYvXJqZbdLjAhXzBL3CBS+wFTK5wyRcYEzBJMk02wxxc/mn1xZ/3yrr+C/f1VZdVDFNfuP8vgZ/vf+lZfdZoZJrw4AKXQuFCvuAXuMAltgImX2BURxNvUkyTjcvwC39WFwZUqt/vfSvr2ePQfmfbOZ4vzcrl2hunqUM716c1hSfxgAQXuJAv+AUucImkgMkGJQwwSTGNcKn4RLUaVnVzp88++q/X1C83fkOP/6/hqLp1ZXPGs8YPXzfWmw4KX3PmaD8xIZK/3fD3OrjAJfFcyBf8Ahe45L2AyQYlLDCum8Y8LSG/SZTLMJm2V/SbFZ9Jm87G0JyNtl1oSpsHF7gkkQv5gl/gApdQCpiuQAkTjKumMYFrK4jNf47+Th04WO9Nn93zuN5eaea2t1uCd8CUpzutn+kapp+HzUXF2AwOF7iQL/gFLnDJJ5dUmFDCAuOqaYK42GyO1r+sx81ZnXSJ/slPTfWWO71jkT5LNCEsjEpv+p5ebtK0JSrVq0SdOPxyRjaGyQN336aeXPPrjGzgApekcSFf8Atc4NLjAqarUOzm13yDcd00Mnxu42r178Zm9bGyvuo7P9iqr83bj3rqM8LSIekrn30n7UzSO2v0L9exrP9s0zBZvuRONXrMMD3vwL6j3ufSs2jcZ9RwgQv5gl/gApd8cEmFCSUsMK6bxma0etUy9dsjH+huzm0u+omIkTV6XB7V1G/YtbikqYOLt5xwm7fV42C+1/Rz8d35Nfp/YriYcHfpeixc4EK+4Be4wCXyAiYIysJvP6wGjbhZn9nYZzRhgEmKaUTDxzzUZsbtAA7LMOZvfG7sULVu3c+cYmE8I79HhrZfip0LfiFf8Av5gl8iLmCa3t6sSq6erfxDMU9YYJISvv4dyTAxzeBpZ4+ZmPjYmOWCmuts47Sc+Yd6++hm5x7jy+QXCZli5YJfyBf8Qr7gF4cKmLAMkwTT5OKirM63RPbjnaI7a76lhxt2/TBt/sU39nqddWUKXLv5+68H1yQqYOACF/IFv8AFLpEWMH6FCSYJpumqYUSHt8/vtP6JH72oh4PumR74/SOmPuM1AQYxMdNH9j3h5I6Uyy/FygW/kC/4hXzBLxEUMOb6dNSG6QmccTN/rH+z9LBpFEaTcHd2JKMgPt0xi9GlcDH/y7CZdMcvcXOJgknS/OJnEiaXpOULfiFfesqF41H3/ZLKN5SowOSCY675RW2YS92RbFWVfaDWP3h92jx5CZ3R6CmT1bnjjd02TBATM3/k5LnKFHdR7kRxcomTh6t+kWvjcTNxNV9ysbFPjFw7UJMv8XGJk02h+yXvLTDSw6X0udDpDOnVx9qDY9wj3rLSNFv7zau86Zpn30sPmfETVGtjS0bAdjNvkGH8QWKDCdMw3dmRouQSFxNX/RInD1f9YvePEhcT/EK+cDzCL6EWMJng2IaxN8aAMXB2PX9/+8T2n6pTVV9SVdWVevLdk+dUzcwVuqoTtTa/r59ZDwKbqbqzO8MynU1FGTRwSQYXOVjHyQMucCFf4AKXS+eS1wJGoIj8YGwo8gijkfz42m2P6t4xTffcqqNnzXtX7tfjw67up564p/3mvPq6Y+r2e9d1C4yBI4+M9R80yCnDFDuXuP1iH5Di4OGqX1zlgl/IF45H+CWSAkZ+SFBVJ2Dsquv0jllqwJQtafOkjwbTP8MzyyaqgeX9vXXt771UMFE388LFTS65DkhRHIzgAhfyBS5wuTQuPS5gpLvvWwYcUx8qKVP/bWpUL52uVFNnVOsqbELNHK+Ce27tIt38ZIOpX32NHgaBkSYo7z0N62bo7xPJd5oOeGwoIv/1NRuOvP9EJHDiNIzIdCQUNZc4mbjsFxe4uOaXuJngF/KF4xF+ybVtPYI28KqpbSf/+aL+0Q0N7Xchi1lMM5IxzLx5X1dPr/pqWmUnAK4or1StLedV7z791JmTx7z5di+Z/a8pUxuWjPeuu5muvO3uxIMM4wdk4GR6kiDf2vb83rZcO1IcXOJk4rJf4uTiql/iZoJfyBeOR/gl1BYYuQ5mmo6MTBV265z2Cu/Ym5v0cPvWOg3NwHnjwGo9/7rRCztVddKcZYZGt097UNXWH1ItTY0ZH/8KMo1pznJpRxJTxMUlDiZJ8EtcXFz2S1xM8Av5wvEIv4RWwMgflY1+7Q9r2iGV99eVl+p4a6u8rbVPSZneiN27Nmlw8kI0qcxMxWXAyHpyg5ANxwDzw7Ovl01esFTf+ewHIy+sijOAu7IjSSUbJZe4D0qu+sWFg7WLfnGBCX4hXzge4ZdQCxiRNC8d3LdRj9/42bu9ZWS+GGb0qCq1a/dPNACBaF6mVj54upLK0DQ52ZClClz86AbvmpwsW/rxyk5wZix+SneiY1d49jV8aZaK+rp9V3ekYuSCX/ALfsEv+AW/5INLjzuyM6YJkjGMaYYyYMzQyD9tg5HHt0aNuaMTlGxg7KcFXN6Rio0LfsEv+AW/4Bf8ki8uqTBNI81SdrPdlRWlGoA0Xcm4bLABauabjnIEjFSHRuYuarmDeuTcF7zn0QWMriZ37PSgqI47zUWl147Qw6gM4zdNph1JVIxc8At+wS/4Bb/gl3xwyUsBk8k0YhiZL0ORPOJWUVGmx+XGIXm2fMjsWj0tgE41nG2v2Boa06Cc3fO4uqximDdtOuEJgmI/lmVXgFHffJhrRypmLvgFv+AX/IJf8EtPuaTChGPAmHEbzOdvW6je2TypIA0DF7jABS5wgQtcHC9gEEIIIYSiFgUMQgghhChgEEIIIYQoYBBCCCGEKGAQQgghRAGDEEIIIUQBgxBCCCGUXf8Hu2QCyYEZt/AAAAAASUVORK5CYII=","frames":8,"columns":8,"box":[0,0,69,66],"still":0,"gutter":1,"durs":[110,110,110,110,110,110,110,110]},"happy":{"dataUri":"data:image/png;base64,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","frames":11,"columns":11,"box":[0,0,69,66],"still":0,"gutter":1,"durs":[200,90,90,100,100,100,100,110,110,120,400]},"error":{"dataUri":"data:image/png;base64,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","frames":10,"columns":10,"box":[0,0,69,66],"still":0,"gutter":1,"durs":[90,80,80,80,90,200,200,160,200,300]},"sleeping":{"dataUri":"data:image/png;base64,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","frames":6,"columns":6,"box":[0,0,69,66],"still":0,"gutter":1,"durs":[330,330,330,330,330,330]},"waking":{"dataUri":"data:image/png;base64,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","frames":11,"columns":11,"box":[0,0,69,66],"still":0,"gutter":1,"durs":[420,110,120,100,100,110,200,70,80,70,500]},"poke-left":{"dataUri":"data:image/png;base64,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","frames":11,"columns":11,"box":[0,0,69,66],"still":0,"gutter":1,"durs":[300,110,90,90,200,140,140,240,200,200,400]},"poke-right":{"dataUri":"data:image/png;base64,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","frames":11,"columns":11,"box":[0,0,69,66],"still":0,"gutter":1,"durs":[300,110,90,90,200,140,140,240,200,200,400]},"tickle":{"dataUri":"data:image/png;base64,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","frames":14,"columns":14,"box":[0,0,69,66],"still":0,"gutter":1,"durs":[90,90,90,90,90,90,90,90,90,90,90,90,200,400]}},"astra":{"dataUri":"data:image/png;base64,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","width":48,"height":50}};
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
      '.ags-mascot-hit:focus, .ags-mascot-hit:focus-visible { outline:none !important; box-shadow:none !important; }',
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
    hitEl.setAttribute('tabindex', '-1');

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
      } else if (cur.style === 'whalegirl') {
        w = 138;
        h = 132;
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
      } else if (cur.style === 'whalegirl') {
        hitW = 98;
        hitH = 98;
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
        ctx.fillStyle = cur.style === 'deepy' ? '#3B82F6' : cur.style === 'whalegirl' ? '#60A5FA' : '#D97757';
        ctx.fillRect(28, 36, 48, 28);
        return;
      }

      var sheetKey = STATE_TO_SHEET[logicalKey] || 'idle';

      function drawSingleSheet(sheet) {
        if (!sheet) return;
        var entry = loadSpriteImage(sheet.dataUri, drawFrame);
        if (!entry || !entry.loaded) return;
        var f = isMotionReduced() ? (sheet.still || 0) : (frameIdx % sheet.frames);
        var cols = sheet.columns || sheet.frames;
        var b = sheet.box;
        var g = sheet.gutter || 0;
        var sx = (f % cols) * (b[2] + g);
        var sy = Math.floor(f / cols) * (b[3] + g);
        ctx.drawImage(entry.img, sx, sy, b[2], b[3], b[0] * 2, b[1] * 2, b[2] * 2, b[3] * 2);
      }

      if (cur.style === 'deepy') {
        drawSingleSheet((sprites.deepy && (sprites.deepy[sheetKey] || sprites.deepy.idle)) || null);
        return;
      }

      if (cur.style === 'whalegirl') {
        drawSingleSheet((sprites.whalegirl && (sprites.whalegirl[sheetKey] || sprites.whalegirl.idle)) || null);
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
      var cg = cSheet.gutter || 0;
      var csx = (cf % cCols) * (cb[2] + cg);
      var csy = Math.floor(cf / cCols) * (cb[3] + cg);

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
      var sprites = getSprites();
      if (cur.style === 'whalegirl') {
        var sheetKey = STATE_TO_SHEET[logicalKey] || 'idle';
        var wSheet = (sprites && sprites.whalegirl && (sprites.whalegirl[sheetKey] || sprites.whalegirl.idle)) || null;
        if (wSheet && Array.isArray(wSheet.durs) && wSheet.durs.length > 0) {
          return wSheet.durs[frameIdx % wSheet.durs.length] || (sprites && sprites.whalegirlFrameMs) || 100;
        }
        if (logicalKey === 'sleeping') return 330;
        return (sprites && sprites.whalegirlFrameMs) || 100;
      }
      if (logicalKey === 'sleeping') return 950;
      if (logicalKey === 'idle') return cur.style === 'astra' ? 280 : 180;
      if (cur.style === 'astra') {
        return logicalKey === 'error' ? 85 : 130;
      }
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

    hitEl.addEventListener('mousedown', function (ev) {
      if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
    });

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

  // Camp-aware dual-theme model color palettes ([darkHex, lightHex]) — 26 fixed slots + golden-angle HSL fallback
  var MODEL_CAMP_PALETTES = {
    gemini: [
      ['#4F8BFF', '#2563EB'],
      ['#22D3EE', '#0891B2'],
      ['#818CF8', '#4F46E5'],
      ['#2DD4BF', '#0D9488'],
      ['#93C5FD', '#1E40AF']
    ],
    claude: [
      ['#F59E0B', '#D97706'],
      ['#FB7185', '#E11D48'],
      ['#F97316', '#C2410C'],
      ['#FBBF24', '#B45309'],
      ['#F43F5E', '#BE123C']
    ],
    gpt: [
      ['#34D399', '#059669'],
      ['#A3E635', '#65A30D'],
      ['#4ADE80', '#16A34A'],
      ['#5EEAD4', '#0F766E']
    ],
    deepseek: [
      ['#A78BFA', '#7C3AED'],
      ['#E879F9', '#C026D3'],
      ['#C084FC', '#9333EA'],
      ['#F472B6', '#DB2777']
    ]
  };
  MODEL_CAMP_PALETTES.orchestrator = [
    ['#818CF8', '#4F46E5'],
    ['#C4B5FD', '#6D28D9'],
    ['#38BDF8', '#0284C7'],
    ['#4F8BFF', '#2563EB']
  ];
  var MODEL_OVERFLOW_PALETTE = [
    ['#38BDF8', '#0284C7'],
    ['#EC4899', '#BE185D'],
    ['#84CC16', '#4D7C0F'],
    ['#FB923C', '#EA580C'],
    ['#C4B5FD', '#6D28D9'],
    ['#FACC15', '#CA8A04'],
    ['#14B8A6', '#115E59'],
    ['#94A3B8', '#475569']
  ];
  var MODEL_ALL_FALLBACKS = [].concat(
    MODEL_OVERFLOW_PALETTE,
    MODEL_CAMP_PALETTES.gemini,
    MODEL_CAMP_PALETTES.claude,
    MODEL_CAMP_PALETTES.gpt,
    MODEL_CAMP_PALETTES.deepseek
  );

  function detectModelCamp(id) {
    var s = String(id || '').toLowerCase();
    if (/orchestrator|编排/.test(s)) {
      if (/claude|anthropic|opus|sonnet|haiku/.test(s)) return 'claude';
      if (/gpt|openai|codex|chatgpt/.test(s)) return 'gpt';
      if (/deepseek/.test(s)) return 'deepseek';
      return 'orchestrator';
    }
    if (/gemini|palm|bard|\b(?:neon|carbon|argon|hydrogen)\b/.test(s)) return 'gemini';
    if (/claude|anthropic|opus|sonnet|haiku/.test(s)) return 'claude';
    if (/gpt|openai|codex|chatgpt|\bo[134](?:-|\b)/.test(s)) return 'gpt';
    if (/deepseek/.test(s)) return 'deepseek';
    return 'other';
  }

  function hslToHex(hDeg, sPct, lPct) {
    var h = (((hDeg % 360) + 360) % 360) / 360;
    var s = sPct / 100;
    var l = lPct / 100;
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    function ch(t) {
      var k = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
      var v = k < 1 / 6 ? p + (q - p) * 6 * k : k < 0.5 ? q : k < 2 / 3 ? p + (q - p) * (2 / 3 - k) * 6 : p;
      return Math.round(v * 255).toString(16).padStart(2, '0').toUpperCase();
    }
    return '#' + ch(h + 1 / 3) + ch(h) + ch(h - 1 / 3);
  }

  function fnv1aHash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    }
    return h >>> 0;
  }

  function resolveHomeModelColours(ids, fallbackIndices) {
    var seen = {};
    var uniqueIds = [];
    var raw = Array.isArray(ids) ? ids : [];
    for (var i = 0; i < raw.length; i++) {
      var k = raw[i];
      if (!k || typeof k !== 'string') continue;
      if (!Object.prototype.hasOwnProperty.call(seen, k)) {
        seen[k] = true;
        uniqueIds.push(k);
      }
    }
    uniqueIds.sort();

    var usedDark = {};
    var usedLight = {};
    var out = {};
    for (var u = 0; u < uniqueIds.length; u++) {
      var id = uniqueIds[u];
      var camp = detectModelCamp(id);
      var campPool = MODEL_CAMP_PALETTES[camp] || [];
      var candidates = campPool.concat(MODEL_ALL_FALLBACKS);
      var picked = null;
      for (var c = 0; c < candidates.length; c++) {
        var pair = candidates[c];
        if (!usedDark[pair[0]] && !usedLight[pair[1]]) {
          picked = pair;
          break;
        }
      }
      if (!picked) {
        var baseHue = fnv1aHash(id) % 360;
        for (var step = 0; step < 360; step++) {
          var hue = (baseHue + step * 137.508) % 360;
          var dHex = hslToHex(hue, 76, step % 2 === 0 ? 64 : 54);
          var lHex = hslToHex(hue, 72, step % 2 === 0 ? 42 : 34);
          if (!usedDark[dHex] && !usedLight[lHex]) {
            picked = [dHex, lHex];
            break;
          }
        }
      }
      usedDark[picked[0]] = true;
      usedLight[picked[1]] = true;
      var baseIdx = fallbackIndices && Number.isInteger(fallbackIndices[id]) ? fallbackIndices[id] : (u % 10);
      out[id] = { idx: baseIdx, dark: picked[0], light: picked[1], camp: camp };
    }
    return out;
  }

  function resolveTopModel(d) {
    if (!d) return '';
    if (typeof d.topModel === 'string' && d.topModel.trim()) return d.topModel.trim();
    if (typeof d.model === 'string' && d.model.trim()) return d.model.trim();
    var list = Array.isArray(d.byModel) ? d.byModel : (Array.isArray(d.models) ? d.models : null);
    if (list && list.length > 0) {
      var first = list[0];
      if (typeof first === 'string' && first.trim()) return first.trim();
      if (first && typeof first === 'object') {
        var lbl = first.model || first.id || first.name || '';
        if (typeof lbl === 'string' && lbl.trim()) return lbl.trim();
      }
    }
    return '';
  }

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
      '.ags-home-prog-fill { height:100%; border-radius:99px; transition:width 200ms ease; }',
      '.ags-home-swatch[data-ag-mc], .ags-home-prog-fill[data-ag-mc] { background:var(--_mc-d); }',
      'html[data-ags-mode="light"] .ags-home-swatch[data-ag-mc], html[data-ags-mode="light"] .ags-home-prog-fill[data-ag-mc] { background:var(--_mc-l); }'
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
      var topModelName = resolveTopModel(d);
      var isLightMode = typeof document !== 'undefined' && document.documentElement && document.documentElement.getAttribute &&
        document.documentElement.getAttribute('data-ags-mode') === 'light';
      var sig = [
        lang,
        state.tab,
        state.days,
        isLightMode ? 'light' : 'dark',
        d.sessions || 0,
        d.calls || d.messages || 0,
        d.totalTokens || 0,
        d.activeDays || 0,
        topModelName,
        Array.isArray(d.byModel) ? d.byModel.length : 0,
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
          [labels.topModel, topModelName || '—']
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

        var rawModels = Array.isArray(d.byModel) ? d.byModel : (Array.isArray(d.models) ? d.models : []);
        var models = rawModels.slice(0, 6);
        var colorMap = resolveHomeModelColours(rawModels.map(function (m) { return (m && (m.model || m.id || m.name)) || ''; }));
        var sumModels = models.reduce(function (acc, m) { return acc + Number(m.totalTokens || 0); }, 0) || 1;
        var maxModel = Math.max.apply(null, models.map(function (m) { return Number(m.totalTokens || 0); }).concat([1]));
        var modelRows = models.length
          ? models.map(function (m) {
              var mName = (m && (m.model || m.id || m.name)) || 'unknown';
              var tok = Number(m.totalTokens || 0);
              var pct = ((tok / sumModels) * 100).toFixed(1).replace(/\.0$/, '');
              var barW = Math.round((tok / maxModel) * 100);
              var spec = colorMap[mName] || { dark: '#4F8BFF', light: '#2563EB' };
              var activeColor = isLightMode ? spec.light : spec.dark;
              var colorStyle = '--_mc-d:' + spec.dark + ';--_mc-l:' + spec.light + ';background:' + activeColor;
              return '<div class="ags-home-model-row">' +
                '  <div class="ags-home-model-meta">' +
                '    <span class="ags-home-model-left"><span class="ags-home-swatch" data-ag-mc="' + esc(activeColor) + '" style="' + colorStyle + '"></span><span>' + esc(mName) + '</span></span>' +
                '    <span style="color:var(--ags-text-secondary)">' + esc(fmtCompact(tok)) + ' (' + pct + '%)</span>' +
                '  </div>' +
                '  <div class="ags-home-prog"><div class="ags-home-prog-fill" data-ag-mc="' + esc(activeColor) + '" style="width:' + barW + '%;' + colorStyle + '"></div></div>' +
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
    formatFunBookText: formatFunBookText,
    resolveHomeModelColours: resolveHomeModelColours,
    detectModelCamp: detectModelCamp,
    resolveTopModel: resolveTopModel
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
  var INK_HIGHLIGHT_STYLE_ID = 'ag-studio-prism-ink-highlight-style';
  var INK_HIGHLIGHT_CSS = [
    '::highlight(ags-ink-0) { opacity: 0.20; }',
    '::highlight(ags-ink-1) { opacity: 0.45; }',
    '::highlight(ags-ink-2) { opacity: 0.72; }',
    '::highlight(ags-ink-3) { opacity: 0.90; }'
  ].join('\n');

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
      '#ag-studio-edge-aura[data-aura="complete"] { opacity:1; box-shadow:inset 0 0 38px rgba(16,185,129,0.22), inset 0 2px 14px rgba(16,185,129,0.26); }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function syncInkHighlightStyles(active) {
    if (typeof document === 'undefined') return;
    var existing = typeof document.getElementById === 'function' ? document.getElementById(INK_HIGHLIGHT_STYLE_ID) : null;
    if (!active) {
      if (existing) {
        if (typeof existing.remove === 'function') existing.remove();
        else if (existing.parentNode) existing.parentNode.removeChild(existing);
      }
      return;
    }
    if (!existing) {
      var s = document.createElement('style');
      s.id = INK_HIGHLIGHT_STYLE_ID;
      s.textContent = INK_HIGHLIGHT_CSS;
      (document.head || document.documentElement).appendChild(s);
    } else if (existing.textContent !== INK_HIGHLIGHT_CSS) {
      existing.textContent = INK_HIGHLIGHT_CSS;
    }
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

    function deleteHighlightBuckets() {
      clearInkHighlights();
      if (typeof CSS !== 'undefined' && CSS.highlights && typeof CSS.highlights.delete === 'function') {
        for (var i = 0; i < 4; i++) {
          try { CSS.highlights.delete('ags-ink-' + i); } catch (_e) {}
        }
      }
      hlBuckets = null;
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
      syncInkHighlightStyles(!destroyed && fxCfg.inkStream);
      if (!fxCfg.inkStream) {
        deleteHighlightBuckets();
      }
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
      deleteHighlightBuckets();
      syncInkHighlightStyles(false);
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
var _NO_TR_A = { "data-ag-i18n-skip": "1", "data-ag-no-tr": "1", "data-no-translate": "1", "data-translate": "no", translate: "no", "data-ag-localization-skip": "true", "data-agy-no-translate": "true", "data-antigravity-zh-skip": "1", "data-ag-no-i18n": "" };
function markNoTranslate(el) {
if (!el) return el;
var hc = el.classList && el.classList.contains ? el.classList.contains("notranslate") : (typeof el.className === "string" && /(?:^|\s)notranslate(?:\s|$)/.test(el.className));
if (hc && el.getAttribute && el.getAttribute("data-ag-i18n-skip") === "1" && el.getAttribute("data-antigravity-zh-skip") === "1" && el.getAttribute("data-ag-no-i18n") === "") return el;
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
var SLIDER_CSS = "@keyframes ces-sweep{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}@keyframes ces-star-sweep{0%{transform:translate3d(0,0,0);opacity:0}6%,94%{opacity:1}100%{transform:translate3d(-100%,0,0);opacity:0}}.ces-inline,.ces-root,.ces-track,.ces-ag-section,.ces-ag-effort-row{box-sizing:border-box}.ces-inline,.ces-root,.ces-ag-section,.ces-ag-section *{user-select:none!important;-webkit-user-select:none!important;-webkit-tap-highlight-color:transparent!important}.ces-inline{width:100%;padding-top:6px}.ces-root{position:relative;width:100%;outline:none!important;box-shadow:none!important}.ces-track{position:relative;width:100%;height:28px;border-radius:999px;background:rgba(128,128,145,.18);box-shadow:inset 0 1px 2px rgba(0,0,0,.24),inset 0 0 0 1px rgba(255,255,255,.06);cursor:pointer;touch-action:none;transition:opacity .15s,box-shadow .2s}.ces-root[data-energy='1'] .ces-track{box-shadow:0 0 calc(var(--ces-energy,0) * 16px) rgba(168,85,247,.5),inset 0 1px 2px rgba(0,0,0,.24)}.ces-root[data-energy='0'] .ces-star,.ces-root[data-energy='0'] .ces-energy__sweep{animation-play-state:paused}.ces-track.is-locked{opacity:.45;cursor:not-allowed;filter:saturate(.25)}.ces-fill,.ces-energy,.ces-stars{position:absolute;top:0;left:0;bottom:0;width:var(--ces-fill,14px);border-radius:14px 0 0 14px;pointer-events:none}.ces-fill{background:var(--ces-fill-bg,#4d93f8);overflow:hidden}.ces-energy{overflow:hidden;opacity:var(--ces-energy,0);transition:opacity .2s;background:linear-gradient(90deg,#3b1178,#6d28d9 30%,#9333ea 62%,#c084fc)}.ces-energy__sweep{position:absolute;inset:0;background:linear-gradient(100deg,transparent 18%,rgba(255,255,255,.3) 50%,transparent 82%);transform:translateX(100%);animation:ces-sweep 2.4s linear infinite;pointer-events:none}.ces-stars{opacity:var(--ces-star-opacity,0);transition:opacity .2s;overflow:hidden}.ces-star{position:absolute;left:0;right:0;height:3px;margin-top:-1.5px;pointer-events:none;animation:ces-star-sweep linear infinite}.ces-star__dot{position:absolute;left:100%;top:0;width:3px;height:3px;margin-left:-1.5px;border-radius:50%;background:#f5f3ff;box-shadow:0 0 5px rgba(216,180,254,.95);opacity:var(--ces-b,1);transform:scale(var(--ces-b,1))}.ces-ticks{position:absolute;inset:0;pointer-events:none}.ces-tick{position:absolute;top:50%;width:3px;height:3px;margin:-1.5px 0 0 -1.5px;border-radius:50%;background:rgba(255,255,255,.28);pointer-events:none;transition:background-color .12s}.ces-tick.is-on{background:rgba(255,255,255,.65)}.ces-tick.is-dim{background:rgba(255,255,255,.28)}.ces-knob{position:absolute;top:50%;left:var(--ces-fill,14px);width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;background:#fff;box-shadow:0 1px 5px rgba(0,0,0,.34),0 0 0 .5px rgba(0,0,0,.06);pointer-events:none;will-change:transform}.ces-root[data-theme='claude'] .ces-stars,.ces-root[data-theme='claude'] .ces-energy{display:none!important}.ces-root[data-theme='claude'] .ces-track{background:rgba(128,128,145,.16);box-shadow:inset 0 1px 2px rgba(0,0,0,.22),inset 0 0 0 1px rgba(255,255,255,.08)}.ces-root[data-theme='claude'][data-energy='1'] .ces-track{box-shadow:0 0 16px rgba(167,139,250,.45),inset 0 1px 2px rgba(0,0,0,.22)}.ces-root[data-theme='claude'] .ces-knob{width:24px;height:30px;margin:-15px 0 0 -12px;border-radius:7px;box-shadow:0 2px 6px rgba(0,0,0,.4),0 0 0 .5px rgba(0,0,0,.12);display:flex;align-items:center;justify-content:center}.ces-knob-notch{display:none;width:2px;height:10px;border-radius:999px;background:rgba(0,0,0,.28)}.ces-root[data-theme='claude'] .ces-knob-notch{display:block}.ces-claude-canvas{position:absolute;left:0;top:0;border-radius:14px 0 0 14px;display:none;pointer-events:none}.ces-root[data-theme='claude'][data-energy='1'] .ces-claude-canvas{display:block}@keyframes ces-claude-rise{0%{transform:translateY(20%) scale(.98);opacity:.15}60%{opacity:1}85%{transform:translateY(-2%) scale(1.01)}100%{transform:none;opacity:1}}.ces-ag-effort-value:is(.is-claude-changing,.ces-text-rise){animation:ces-claude-rise .24s cubic-bezier(.2,.85,.25,1)}.ces-ag-effort-value.is-glowing:is(.is-claude-changing,.ces-text-rise){animation:ces-claude-rise .24s cubic-bezier(.2,.85,.25,1),ces-text-bloom .4s cubic-bezier(.16,1,.3,1) forwards}[data-testid='model-selector-panel'].ces-ag-panel-enhanced{max-height:26rem!important}.ces-ag-section,.ces-ag-section *{outline:none!important}.ces-ag-section,.ces-ag-effort-row{display:flex;flex-direction:column;width:100%}.ces-ag-section{flex-shrink:0}.ces-ag-effort-row{padding:6px 8px 8px;border-radius:6px;transition:box-shadow .2s,background-color .2s}.ces-ag-effort-row:hover{background:rgba(128,128,145,.08)}.ces-ag-effort-row[data-ces-max='true'],[data-ces-effort-row='true'][data-ces-max='true']{box-shadow:inset 0 0 0 1px rgba(139,92,246,.42),0 0 14px -4px rgba(139,92,246,.45)!important;background:rgba(139,92,246,.06)}.ces-ag-effort-head{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:18px;padding:1px 0;font-size:12px;line-height:16px;overflow-y:clip;overflow-clip-margin:10px}.ces-ag-effort-title{display:inline-flex;align-items:center;gap:6px;color:inherit;font-weight:500;opacity:.9}.ces-ag-effort-value{position:relative;z-index:1;display:inline-block;font-size:12px;font-weight:600;transition:color .15s}.ces-ag-effort-value::after{content:'';position:absolute;top:50%;left:50%;width:52px;height:26px;border-radius:999px;transform:translate(-50%,-50%) scale(.6);background:radial-gradient(ellipse,var(--ces-glow-color,rgba(168,85,247,.85)),var(--ces-glow-color,rgba(168,85,247,.45)) 45%,rgba(168,85,247,0) 75%);filter:blur(8px);pointer-events:none;opacity:0;z-index:-1}@keyframes ces-glow-flash{0%{opacity:.95;transform:translate(-50%,-50%) scale(.65);filter:blur(6px)}25%{opacity:1;transform:translate(-50%,-50%) scale(1.15);filter:blur(8px)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5);filter:blur(14px)}}@keyframes ces-text-bloom{0%{text-shadow:0 0 8px var(--ces-glow-color,#c084fc)}30%{text-shadow:0 0 14px var(--ces-glow-color,#c084fc),0 0 3px #fff}100%{text-shadow:none}}.ces-ag-effort-value.is-glowing{animation:ces-text-bloom .4s cubic-bezier(.16,1,.3,1) forwards}.ces-ag-effort-value.is-glowing::after{animation:ces-glow-flash .4s cubic-bezier(.16,1,.3,1) forwards}@media (prefers-reduced-motion:reduce){.ces-panel-shaking,.ces-ag-effort-value.is-glowing,.ces-ag-effort-value.is-glowing::after,.ces-ag-effort-value.ces-text-rise,.ces-ag-effort-value.is-claude-changing{animation:none!important}}html[data-ces-slider-ready='1'] [role='menu']:has([data-testid='model-selector-effort-option']):not(:has([data-testid='model-selector-panel'])),html[data-ces-slider-ready='1'] div[role='presentation']:has(>[role='menu'] [data-testid='model-selector-effort-option']):not(:has([data-testid='model-selector-panel'])),html[data-ces-slider-ready='1'] [role='menu']:has([data-testid='orchestrator-picker-effort']):not(:has([data-testid='model-selector-panel'])):not(:has([data-testid='orchestrator-picker-row'])):not([data-ag-cs-orch-l2='1']),html[data-ces-slider-ready='1'] div[role='presentation']:has([data-testid='orchestrator-picker-effort']):not(:has([data-testid='model-selector-panel'])):not(:has([data-testid='orchestrator-picker-row'])):not(:has([data-ag-cs-orch-l2='1'])),html[data-ces-slider-ready='1'] [data-testid='orchestrator-picker-effort']:not(:has([data-testid='model-selector-panel'])),html[data-ces-slider-ready='1'] [data-ag-cs-orch-l3='1']{display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important}html[data-ces-slider-ready='1'] [role='menuitem']:has([data-testid='model-selector-effort-group'])>span.shrink-0:last-child,html[data-ces-slider-ready='1'] [data-ces-orch-row='1']>svg:last-child:not(:first-child):not(.lucide-check),html[data-ces-slider-ready='1'] [data-ces-orch-row='1']>span:last-child:not(:first-child):has(>svg:only-child:not(.lucide-check)),html[data-ces-slider-ready='1'] [data-ces-orch-row='1']>*:last-child>svg:last-child:not(.lucide-check){display:none!important}html[data-ces-slider-ready='1'] [role='menuitem']:has([data-testid='model-selector-effort-group'])>.group-hover\\:hidden{display:flex!important}[role='menuitem'][data-ces-model-selected='true'],[data-ces-orch-row='1'][data-ces-model-selected='true']{background:rgba(128,128,145,.14)}.ces-set{position:fixed;z-index:2147483646;width:268px;padding:12px;border-radius:10px;background:rgba(24,24,28,.96);color:#f4f4f6;border:1px solid rgba(255,255,255,.12);box-shadow:0 12px 32px rgba(0,0,0,.55);backdrop-filter:blur(12px);font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;box-sizing:border-box;user-select:none}.ces-set-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.08);font-weight:600;font-size:12.5px}.ces-set-ver{font-size:11px;font-weight:400;opacity:.55}.ces-set-group{margin-bottom:10px}.ces-set-label{margin-bottom:5px;font-size:11px;opacity:.72}.ces-set-opts{display:flex;gap:4px}.ces-set-opt{flex:1;padding:5px 6px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#d4d4d8;font-size:11.5px;cursor:pointer;text-align:center;transition:all .12s ease}.ces-set-opt:hover{background:rgba(255,255,255,.1);color:#fff}.ces-set-opt.is-on{background:rgba(139,92,246,.28);border-color:rgba(139,92,246,.75);color:#fff;font-weight:600}.ces-set-actions{display:flex;gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08)}.ces-set-btn{flex:1;padding:5px 8px;border-radius:6px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#e4e4e7;font-size:11px;cursor:pointer}.ces-set-btn:hover{background:rgba(255,255,255,.14)}[data-testid='model-selector-panel'] .ces-ag-section[data-effort-slot='true']{grid-template-rows:auto auto}[data-testid='model-selector-panel'] .ces-ag-section[data-effort-slot='true']>[role='separator']{grid-row:1;grid-column:1}[data-testid='model-selector-panel'] .ces-ag-section[data-effort-slot='true']>:is(.ces-ag-effort-row,[data-testid='orchestrator-effort-bar']){grid-row:2!important;grid-column:1!important}";
function installStyles(doc) {
var d = doc || (typeof document !== "undefined" ? document : null);
if (!d || !d.head) return null;
var s = d.getElementById(STYLE_ELEMENT_ID);
if (!s) { s = d.createElement("style"); s.id = STYLE_ELEMENT_ID; d.head.appendChild(s); }
if (s.textContent !== SLIDER_CSS) s.textContent = SLIDER_CSS;
return s;
}
// ── 右键设置面板 ────────────────────────────────────────────────────────────
var SET_TITLE_I18N = { "zh-CN": "推理等级滑条设置", "zh-TW": "推理等級滑桿設定", en: "Effort Slider", ja: "推論スライダー設定", ko: "추론 슬라이더 설정", es: "Ajustes de esfuerzo", fr: "Réglages d’effort", de: "Aufwandsregler-Einstellungen" };
var SET_HEAD_I18N = { "zh-CN": "推理等级滑条", "zh-TW": "推理等級滑桿", en: "Effort Slider", ja: "推論スライダー", ko: "추론 슬라이더", es: "Nivel de esfuerzo", fr: "Niveau d’effort", de: "Aufwandsregler" };
var FIXED_I18N = { "zh-CN": "固定", "zh-TW": "固定", en: "Fixed", ja: "固定", ko: "고정", es: "Fijo", fr: "Fixe", de: "Fest" };
function _normSliderLang(raw, win) {
var v = String(raw || "").trim();
if (!v || v.toLowerCase() === "auto") {
var w = _win(win);
var navObj = w && "navigator" in w ? w.navigator : (typeof navigator !== "undefined" ? navigator : null);
v = String(navObj?.language || "").trim();
}
var s = v.toLowerCase().replace(/_/g, "-");
if (!s || s === "auto") return "en";
if (s === "yue" || s.startsWith("yue-") || s === "zh-yue" || s.includes("cantonese")) return "zh-CN";
if (/^zh-(tw|hant|hk|mo)/.test(s) || s === "tw" || s === "hant") return "zh-TW";
if (/^zh/.test(s)) return "zh-CN";
if (/^(ja|jp)/.test(s) || s === "japanese") return "ja";
if (/^(ko|kr)/.test(s) || s === "korean") return "ko";
if (/^es/.test(s) || s === "spanish") return "es";
if (/^fr/.test(s) || s === "french") return "fr";
if (/^de/.test(s) || s === "german") return "de";
return "en";
}
function _isZhLang(lk) { var n = _normSliderLang(lk); return n === "zh-CN" || n === "zh-TW"; }
function openSettingsPanel(options) {
var o = options || {}, d = o.document || (typeof document !== "undefined" ? document : null);
var w = o.window || d?.defaultView || (typeof window !== "undefined" ? window : globalRoot);
if (!d?.body) return () => {};
installStyles(d);
var lk = _normSliderLang(getPrismRootAttr(d, w, "data-ag-cs-lang"), w);
var zh = lk === "zh-CN" || lk === "zh-TW";
d.querySelector(".ces-set")?.remove?.();
var mk = (t, c, tx) => { var e = d.createElement(t); if (c) e.className = c; if (tx) e.textContent = tx; return e; };
var p = markNoTranslate(mk("div", "ces-set"));
p.setAttribute("role", "dialog");
p.setAttribute("aria-label", SET_TITLE_I18N[lk] || SET_TITLE_I18N.en);
p.style.left = Math.max(8, Math.min((w?.innerWidth || 800) - 276, typeof o.x === "number" ? o.x : 120)) + "px";
p.style.top = Math.max(8, Math.min((w?.innerHeight || 600) - 230, typeof o.y === "number" ? o.y : 120)) + "px";
var hd = mk("div", "ces-set-head");
hd.appendChild(mk("span", "", SET_HEAD_I18N[lk] || SET_HEAD_I18N.en));
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
var _AG_TRIG_SEL = '[data-testid="model-selector-trigger"],button[aria-label^="Select model"]';
var _AG_PANE_SEL = '[data-testid="agent-input-box"],[data-testid="conversation-view"],.surface-composer-card,[data-tiling-pane]';
var _lastTrigStateByDoc = typeof WeakMap === "function" ? new WeakMap() : null;
function _isSubTrigger(el) { return Boolean(el && el.closest && el.closest('[data-testid="subagent-tab-conversation"]')); }
function _isTrigVisible(el) {
if (!el || el.isConnected === false || el.hidden === true) return false;
if (el.style && (el.style.display === "none" || el.style.visibility === "hidden")) return false;
if (el.closest && el.closest("[hidden], .hidden")) return false;
if (el.checkVisibility) { try { if (!el.checkVisibility()) return false; } catch (e) {} }
return true;
}
function _isTrigExpanded(el) {
if (!el || !el.getAttribute) return false;
return el.getAttribute("aria-expanded") === "true" || el.getAttribute("data-state") === "open" || (el.hasAttribute && el.hasAttribute("data-popup-open") && el.getAttribute("data-popup-open") !== "false");
}
function _rememberActiveTrigger(doc, triggerEl, paneEl) {
if (!doc || !_lastTrigStateByDoc) return;
var prev = _lastTrigStateByDoc.get(doc) || { trigger: null, pane: null };
if (triggerEl !== undefined) prev.trigger = triggerEl;
if (paneEl !== undefined) prev.pane = paneEl;
_lastTrigStateByDoc.set(doc, prev);
}
function _mainTrigs(sc) {
var l = sc?.querySelectorAll?.(_AG_TRIG_SEL), o = [];
if (l) for (var i = 0; i < l.length; i++) if (l[i] && !_isSubTrigger(l[i])) o.push(l[i]);
return o;
}
function _findTriggerInNode(scope) {
if (!scope) return null;
if (scope.matches?.(_AG_TRIG_SEL) && !_isSubTrigger(scope) && scope.isConnected !== false) return scope;
if (scope.querySelectorAll) {
var cs = _mainTrigs(scope), fb = null;
if (cs.length <= 1) return cs[0] || null;
for (var j = 0; j < cs.length; j++) {
if (_isTrigVisible(cs[j])) return cs[j];
if (!fb) fb = cs[j];
}
return fb;
}
var q = scope.querySelector?.(_AG_TRIG_SEL);
return q && !_isSubTrigger(q) ? q : null;
}
function findAntigravityTrigger(doc, hintEl) {
var d = doc || (typeof document !== "undefined" ? document : null);
if (!d) return null;
if (hintEl && hintEl.isConnected !== false) {
var hHit = _findTriggerInNode(hintEl) || _findTriggerInNode(hintEl.closest?.(_AG_PANE_SEL));
if (hHit) return hHit;
}
var visList = [], firstHidden = null;
if (d.querySelectorAll) {
var cands = _mainTrigs(d);
if (cands.length === 1) return cands[0];
for (var j = 0; j < cands.length; j++) {
var cEl = cands[j];
if (_isTrigVisible(cEl)) {
if (_isTrigExpanded(cEl)) return cEl;
visList.push(cEl);
} else if (!firstHidden) firstHidden = cEl;
}
}
if (visList.length > 1) {
var openPanel = findAntigravityPanel(d);
if (openPanel) {
var pCtx = _rdAgFiber(openPanel);
if (pCtx && pCtx.conversationId) {
for (var pIdx = 0; pIdx < visList.length; pIdx += 1) {
var tCtx = _rdAgFiber(visList[pIdx]);
if (tCtx && tCtx.conversationId === pCtx.conversationId) return visList[pIdx];
}
}
}
var rec = _lastTrigStateByDoc ? _lastTrigStateByDoc.get(d) : null;
if (rec) {
if (rec.trigger && rec.trigger.isConnected !== false && !_isSubTrigger(rec.trigger) && _isTrigVisible(rec.trigger)) return rec.trigger;
if (rec.pane && rec.pane.isConnected !== false && !_isSubTrigger(rec.pane)) {
var fromRecPane = _findTriggerInNode(rec.pane);
if (fromRecPane && _isTrigVisible(fromRecPane)) return fromRecPane;
}
}
var actEl = d.activeElement;
if (actEl && actEl !== d.body && actEl !== d.documentElement) {
var actDirect = _findTriggerInNode(actEl);
if (actDirect && _isTrigVisible(actDirect)) return actDirect;
var actPane = actEl.closest && actEl.closest(_AG_PANE_SEL);
if (actPane && !_isSubTrigger(actPane)) {
var fromActPane = _findTriggerInNode(actPane);
if (fromActPane && _isTrigVisible(fromActPane)) return fromActPane;
}
}
}
if (visList.length > 0) return visList[0];
if (firstHidden) return firstHidden;
var q = d.querySelector && (d.querySelector('[data-testid="model-selector-trigger"]') || d.querySelector('button[aria-label^="Select model"]'));
return q && !_isSubTrigger(q) ? q : null;
}
function _isTrigLocked(doc, hintEl) {
var tr = (hintEl && hintEl.isConnected !== false && hintEl.matches && hintEl.matches(_AG_TRIG_SEL) && !_isSubTrigger(hintEl)) ? hintEl : findAntigravityTrigger(doc, hintEl);
if (!tr) return false;
if (tr.disabled === true || (tr.hasAttribute && tr.hasAttribute("disabled")) || (tr.getAttribute && tr.getAttribute("aria-disabled") === "true")) return true;
var dd = tr.getAttribute && tr.getAttribute("data-disabled");
return dd !== null && dd !== undefined && dd !== "false";
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
function syncTriggerColor(doc, label, index, count, isMax, hasOffFirst, isClaude, triggerEl) {
var d = doc || (typeof document !== "undefined" ? document : null);
if (!d) return;
var ag = triggerEl || findAntigravityTrigger(d), col = valueColorFor(label, index, count, isMax, hasOffFirst, typeof isClaude === "boolean" ? isClaude : isClaudeModel(ag ? ag.textContent : ""), resolvePrismAccentTone(d, null)) || "";
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
var sL = sP ? sP.effortLabel : (FIXED_I18N[_normSliderLang(getPrismRootAttr(null, null, "data-ag-cs-lang"))] || FIXED_I18N.en);
var bn = baseName || modelObj?.label || "", sC = isClaudeModel(bn);
return {
baseName: bn, isOrchestrator: isOrch, orchestratorTunable: false,
isClaude: sC, theme: sC ? "claude" : "codex", locked: true,
levels: [{ effort: sE, label: sL, modelOption: modelObj }],
currentIndex: 0, currentEffort: sE, currentLabel: sL, modelOption: modelObj
};
}
function _commitAgOpt(ctx, targetOption, isOrchPlan, keepOpen, triggerEl) {
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
var d = typeof document !== "undefined" ? document : null;
var pScope = triggerEl && triggerEl.closest ? triggerEl.closest('[data-testid="agent-input-box"],[data-testid="conversation-view"]') : null;
var ed = pScope?.querySelector?.('[contenteditable="true"]') || d?.querySelector?.('[contenteditable="true"]');
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
var EFFORT_TITLE_I18N = { "zh-CN": "推理等级", "zh-TW": "推理等級", en: "Reasoning Effort", ja: "推論レベル", ko: "추론 수준", es: "Nivel de razonamiento", fr: "Niveau de raisonnement", de: "Denkaufwand" };
function resolveEffortTitle(doc, win) {
var lang = _normSliderLang(getPrismRootAttr(doc, win, "data-ag-cs-lang"), win);
try {
var ui = (win?.__agCsLocales || globalRoot?.__agCsLocales)?.getUiStrings?.(lang);
if (ui?.effortTitle) return String(ui.effortTitle);
} catch {}
return EFFORT_TITLE_I18N[lang] || EFFORT_TITLE_I18N.en;
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
for (var trEl of doc.querySelectorAll(_AG_TRIG_SEL)) {
var te = trEl?.querySelector?.("span.opacity-70, [data-ces-part='trigger-effort']");
if (te) delete te.__cesLastText;
}
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
var trackedTrigger = null;
var trackedPane = null;
function _trackTarget(ev) {
try {
var t = ev && ev.target;
if (!t || typeof t.closest !== "function") return;
var trig = t.closest(_AG_TRIG_SEL);
if (trig && !_isSubTrigger(trig)) {
trackedTrigger = trig;
var p0 = trig.closest(_AG_PANE_SEL);
if (p0 && !_isSubTrigger(p0)) trackedPane = p0;
_rememberActiveTrigger(doc, trackedTrigger, trackedPane);
return;
}
var pane = t.closest(_AG_PANE_SEL);
if (pane && !_isSubTrigger(pane)) {
trackedPane = pane;
var innerTrig = _findTriggerInNode(pane);
if (innerTrig) trackedTrigger = innerTrig;
_rememberActiveTrigger(doc, trackedTrigger, trackedPane);
}
} catch (e) {}
}
var _trackOpts = { capture: true, passive: true };
doc.addEventListener?.("pointerdown", _trackTarget, _trackOpts);
doc.addEventListener?.("focusin", _trackTarget, _trackOpts);
function _resolveCurTrigger() {
var allM = _mainTrigs(doc);
if (allM.length === 1) { trackedTrigger = allM[0]; return allM[0]; }
var p = findAntigravityPanel(doc);
if (p) {
var fromOpen = findAntigravityTrigger(doc);
if (fromOpen && _isTrigExpanded(fromOpen)) { trackedTrigger = fromOpen; return fromOpen; }
var pCtx = _rdAgFiber(p);
if (pCtx && pCtx.conversationId && doc.querySelectorAll) {
var allTr = doc.querySelectorAll(_AG_TRIG_SEL);
for (var i = 0; i < allTr.length; i += 1) {
var cTr = allTr[i];
if (!cTr || _isSubTrigger(cTr) || !_isTrigVisible(cTr)) continue;
var tc = _rdAgFiber(cTr);
if (tc && tc.conversationId === pCtx.conversationId) { trackedTrigger = cTr; return cTr; }
}
}
}
if (trackedTrigger && trackedTrigger.isConnected !== false && !_isSubTrigger(trackedTrigger) && _isTrigVisible(trackedTrigger)) {
return trackedTrigger;
}
if (trackedPane && trackedPane.isConnected !== false && !_isSubTrigger(trackedPane)) {
var pt = _findTriggerInNode(trackedPane);
if (pt && _isTrigVisible(pt)) { trackedTrigger = pt; return pt; }
}
return findAntigravityTrigger(doc);
}
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
var p = findAntigravityPanel(doc), t = _resolveCurTrigger();
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
var triggerBtn = _resolveCurTrigger();
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
syncTriggerColor(doc, trigLbl, idx, count, isMax, false, Boolean(profile.isClaude), triggerBtn);
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
_read: function () { var p = _curProf(); return p && _isTrigLocked(doc, _resolveCurTrigger()) ? Object.assign({}, p, { locked: true }) : p; },
get effortLevels() { return _curProf()?.levels || []; },
get currentEffort() { return _curProf()?.currentEffort || ""; },
get locked() { return _isTrigLocked(doc, _resolveCurTrigger()) || (_curProf()?.locked ?? true); },
get baseName() { return _curProf()?.baseName || ""; },
get isClaude() { return Boolean(_curProf()?.isClaude); },
get theme() { return _curProf()?.theme || "codex"; },
selectEffort: function (levelItem) {
var curTrig = _resolveCurTrigger();
if (_isTrigLocked(doc, curTrig)) return;
var ctx = getLiveContext(), targetOpt = levelItem && (levelItem.modelOption || levelItem.raw?.modelOption);
if (!ctx || !targetOpt) return;
var curProf = getActiveProfile(ctx);
if (curProf?.isOrchestrator && curProf.orchestratorTunable) {
var opP = parseModelLabel(targetOpt.label);
if (opP) _recEff(_orchEffMap, opP.base, opP.effort);
_orchPlanOvr = targetOpt;
_commitAgOpt(ctx, targetOpt, true, true, curTrig);
_withMut(() => { var np = resolveModelEffortProfile(ctx, _actOptOvr || ctx.selectedModel, _curEffMap(), targetOpt); _syncAgDom(ctx, np); _sySubs(activePanel, ctx, np); notifySeatListeners(); _syP(); });
return;
}
var parsed = parseModelLabel(targetOpt.label);
if (parsed) { _recEff(_effMap, parsed.base, parsed.effort); activeBaseOverride = parsed.base; }
_actOptOvr = targetOpt;
_lastHostLbl = (ctx.selectedModel && ctx.selectedModel.label) || "";
_orchPlanOvr = null;
_commitAgOpt(ctx, targetOpt, false, true, curTrig);
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
var _S_ML = '[role="menu"],[role="listbox"]', _S_OV = '.agy-overlay,[data-radix-popper-content-wrapper],[role="presentation"],[data-side]', _OP_R = "orchestrator-picker-row", _OP_E = "orchestrator-picker-effort", _S_OR = '[data-testid="' + _OP_R + '"]', _S_OE = '[data-testid="' + _OP_E + '"]';
var _L3_RE = /^(?:off|minimal|low|medium|high|xhigh|extra|max)(?:\s+thinking)?$|^(?:关闭|关|极低|最低|最小|低|中|中等|高|超高|极高|特高|最高|最大)(?:思考|推理|强度)?$/i;
function _subIts(m) {
if (!m?.querySelectorAll) return [];
var raw = m.querySelectorAll(_SUB_IT);
if (!raw.length) raw = m.querySelectorAll("button,[tabindex]");
var out = [], i, j, el, mr = m.getAttribute?.("role"), isM = mr === "menu" || mr === "listbox", ef;
for (i = 0; i < raw.length; i += 1) {
el = raw[i];
if (!el || el === m || _isBox(el) || (el.closest && (el.closest(".ces-ag-section") || ((ef = el.closest(_S_OE)) && ef !== m) || (isM && el.closest(_S_ML) !== m))) || !String(el.textContent || "").trim()) continue;
for (j = 0; j < out.length; j += 1) if (out[j].contains?.(el)) { el = null; break; }
if (el) out.push(el);
}
return out;
}
function _badBox(m) {
return !m || !activePanel || m === activePanel || !!m.contains?.(activePanel) || !!m.querySelector?.('[data-testid="model-selector-panel"],[data-testid="model-selector-orchestrator"],[data-testid="quota-progress-circle"],.ces-ag-section');
}
function _isSub(m, c) {
if (_badBox(m) || !_hasOrch(c)) return false;
var its = _subIts(m), n = 0, i;
for (i = 0; i < its.length; i += 1) if (_mPlan(its[i], c)) n += 1;
return n >= 1 && n * 2 >= its.length;
}
function _isL3(m, c) {
if (_badBox(m) || !_hasOrch(c)) return false;
var mt = m.getAttribute?.("data-testid");
if (mt === _OP_R || m.querySelector?.(_S_OR) || m.getAttribute?.("data-ag-cs-orch-l2") === "1") return false;
if (mt === _OP_E || (m.matches && m.matches('[data-testid="orchestrator-picker-effort"]')) || m.querySelector?.(_S_OE)) return true;
var its = _subIts(m), i;
if (its.length < 2 || its.length > 7) return false;
for (i = 0; i < its.length; i += 1) if (!_L3_RE.test(String(its[i].textContent || "").replace(/[✓✔•·]/g, " ").replace(/\s+/g, " ").trim())) return false;
return true;
}
function _wrapOv(m, strict) {
var p = m.parentElement && m.parentElement !== doc.body ? m.parentElement : null;
var o = p?.closest?.(_S_OV) || (!strict && p && p.id !== "root" && !m.matches?.('.agy-overlay,[role="presentation"],[data-side]') ? p : null);
if (!o || o === activePanel || o.contains?.(activePanel) || o.querySelector?.('[data-testid="model-selector-panel"]')) return null;
if (o.getAttribute?.("data-ag-cs-orch-l2") === "1" || o.querySelector?.('[data-ag-cs-orch-l2="1"]')) return null;
var hasL2 = false;
_boundSubs.forEach((b) => { if (b && (b === o || o.contains?.(b))) hasL2 = true; });
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
var ov = _wrapOv(m), ov2 = ov ? _wrapOv(ov, 1) : null, ovs = [ov, ov2];
try {
m.setAttribute("data-ag-cs-model-submenu", "1"); m.setAttribute("data-ag-cs-orch-l2", "1");
for (var w of ovs) if (w && w !== m) { w.setAttribute("data-ag-cs-model-submenu", "1"); if (w.getAttribute?.("data-ag-cs-orch-l3") === "1") w.removeAttribute("data-ag-cs-orch-l3"); }
} catch (e) {}
function rAct(t) {
if (_isTrigLocked(doc) || !t || typeof t.closest !== "function" || t.closest('button[aria-label="Edit Model"],a[href]')) return null;
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
for (var w of ovs) if (w && w !== m) w.removeAttribute("data-ag-cs-model-submenu");
var rs = m.querySelectorAll ? m.querySelectorAll("[data-ces-orch-row]") : [];
for (var r = 0; r < rs.length; r += 1) { rs[r].removeAttribute("data-ces-orch-row"); rs[r].removeAttribute("data-ces-model-selected"); }
} catch (e) {}
delete m.__cesSubUb; delete m.__cesSubBd;
};
_boundSubs.add(m);
}
function _sySubs(panel, c, p) {
_boundSubs.forEach((m) => { if (!m || m.isConnected === false || !panel || !_isSub(m, c)) _ubSub(m); });
_hiddenL3.forEach((ov, m) => { if (!m || m.isConnected === false || !panel || !_isL3(m, c)) _clrL3(ov, m); });
if (!panel || !_hasOrch(c)) return;
var seen = new Set(), cands = [], qm = doc?.querySelectorAll?.(_SUB_BOX + "," + _S_OE) || [], mis = doc?.querySelectorAll?.(_SUB_IT) || [], i, j;
for (i = 0; i < qm.length; i += 1) if (!seen.has(qm[i])) { seen.add(qm[i]); cands.push(qm[i]); }
for (i = 0; i < mis.length; i += 1) { var pr = mis[i].parentElement; if (pr && !seen.has(pr) && !_badBox(pr)) { seen.add(pr); cands.push(pr); } }
var l2 = cands.filter((x) => _isSub(x, c));
for (i = 0; i < l2.length; i += 1) {
for (j = 0; j < l2.length; j += 1) if (i !== j && l2[i].contains?.(l2[j])) { l2[i] = null; break; }
if (l2[i]) { _bdSub(l2[i]); _sySubDom(l2[i], c, p); }
}
if (_boundSubs.size > 0 || panel.getAttribute("data-ces-orch-tunable") === "true") {
for (i = 0; i < cands.length; i += 1) {
var m3 = cands[i], inL2 = false;
if (_boundSubs.has(m3) || !_isL3(m3, c)) continue;
var isEff = m3.getAttribute?.("data-testid") === _OP_E || !!m3.querySelector?.(_S_OE);
_boundSubs.forEach((b) => { if (b === m3 || m3.contains?.(b) || (!isEff && b.contains?.(m3))) inL2 = true; });
if (inL2) continue;
var ov3 = _wrapOv(m3);
if (ov3 && ov3 !== m3 && ov3.querySelector?.(_S_OR)) ov3 = null;
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
if (_isTrigLocked(doc) || !target || typeof target.closest !== "function" || target.closest('.ces-ag-section,.ces-set,button[aria-label="Edit Model"]')) return null;
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
var dp = c?.orchDef && parseModelLabel(c.orchDef.label), defEff = dp && _slug(dp.base) === _slug(ob) && oby?.has(dp.effort) ? dp.effort : "";
if (ot && _okOpt(ot) && or !== defEff) { lk = { o: true, b: ob, t: ot, u: Date.now() + 300 }; qM(() => { if (!_isTrigLocked(doc)) _commitAgOpt(c, ot, true, false); }); }
};
onMemCk = (ev) => {
var t = ev?.target;
if (!t?.closest || _isTrigLocked(doc) || _isDis(t)) return;
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
if (tgt && _okOpt(tgt)) { lk = { o: false, b, t: tgt, u: Date.now() + 300 }; qM(() => { if (_isTrigLocked(doc)) { lk = null; return; } var live = getLiveContext() || c; if (live?.selectedModel?.label === tgt.label) { lk = null; return; } _commitAgOpt(live, tgt, false, false); }); }
};
doc.addEventListener?.("click", onMemCk, true);
}
scan();
var MO = opts.MutationObserver || win?.MutationObserver || (typeof MutationObserver === "function" ? MutationObserver : null);
if (typeof MO === "function") {
var ctrlSel = '[data-testid="model-selector-trigger"],button[aria-label^="Select model"],[data-testid="model-selector-panel"],[role="menu"]';
var noiseSel = '[data-testid="autoscroll-viewport"],.toast-viewport,[data-testid="sidebar-split"]>div:first-child,aside,[data-hover-card-popup]';
observer = new MO((recs) => {
if (_intMut) return;
if (Array.isArray(recs) && recs.length) {
if (!memOnly && activeSection && activePanel?.contains(activeSection) && recs.every((sr) => { var st = sr?.target, sel = st && (st.nodeType === 1 ? st : st.parentElement); return sel && activeSection.contains(sel); })) return;
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
observer.observe(doc.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-expanded", "data-state", "hidden", "data-selected", "disabled", "aria-disabled", "data-disabled"] });
}
return {
stop: () => {
observer?.disconnect(); observer = null;
doc.removeEventListener?.("pointerdown", _trackTarget, _trackOpts);
doc.removeEventListener?.("focusin", _trackTarget, _trackOpts);
trackedTrigger = trackedPane = null;
if (_lastTrigStateByDoc) _lastTrigStateByDoc.delete(doc);
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

  const isMenu = (doc) => !!qs(doc, '[data-testid="model-selector-panel"], .ces-menu-section, [data-ces-effort-row="true"], [role="dialog"] [data-ces-settings]');

  const HC_A = 'data-hover-card-popup';
  const SB_SEL = 'aside,[data-testid="sidebar-split"]>div:first-child,[data-testid="conversation-row-sidebar"],[data-testid="project-header"],[data-hover-card-popup]';
  const IGNORED_CHAT_SEL =
    '#ag-studio-root,[data-ag-studio-ignore],[data-testid="autoscroll-viewport"],[data-testid="planner-response-text"],[data-testid="agent-response"],[data-markdown-root],[data-testid="user-message-bubble"],' + SB_SEL + ',[data-op-thought="1"],.ag-prism-thought-overlay,.ag-cs-crab,.ag-cs-conv-aura-host,#ag-pulse-status-bar,#ag-prism-pulse-bar,[data-ag-prism-pulse-bar="true"],.ag-cs-panel-row-glyph,.ces-ag-section,.ces-set,[data-ag-owned="1"],[data-testid="orchestrator-effort-bar"],.ag-cs-smooth-caret,.ag-anim-icon,[data-agy-hans-ui],#agy-theme-switcher,#agy-theme-menu,#antigravity-quota-widget,#antigravity-translation-audit';

  const EFF_MAP = Object.create(null);
  for (const g of 'xhigh:xhigh|extra|extra high|超高|极高|極高|特高|很高|超高思考;high:high|高|高思考|高推理|高强度|高強度;medium:medium|med|中|中等|中思考|中等思考|中推理;low:low|低|低思考|低推理;minimal:minimal|极低|極低|最小|最低|极简|極簡;max:max|最高|最大|极限|極限;off:off|关闭|關閉|关|關|无|無|不推理|none|disabled;auto:auto|自动|自動;adaptive:adaptive|自适应|自適應;thinking:thinking|深度思考|思考中|思考'.split(';')) {
    const [k, vs] = g.split(':');
    for (const v of vs.split('|')) EFF_MAP[v] = k;
  }
  const EFF_LABELS = { off: 'Off', minimal: 'Minimal', low: 'Low', medium: 'Medium', high: 'High', xhigh: 'Extra', max: 'Max', auto: 'Auto', adaptive: 'Adaptive', thinking: 'Thinking' };

  function normalizeEffortToken(raw) {
    const s = String(raw || '').trim().replace(/^[(\uff08]+|[)\uff09]+$/g, '').trim().replace(/\s+thinking$/i, '').toLowerCase();
    return EFF_MAP[s] || '';
  }

  function parseLocalizedModelLabel(raw) {
    const s = String(raw || '').trim().replace(/^(?:Select model|Current|选择模型|選擇模型)\s*[:：]\s*/i, '').trim();
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
      if (fn) {
        fn(el);
        for (const ch of qa(el, 'div,span')) if (String(ch.className || '').includes('ces-ag-effort-')) fn(ch);
      }
      sa(el, 'data-ag-studio-ignore', 'true');
      sa(el, 'data-ag-no-i18n', 'true');
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
    const el = node?.nodeType === 1 ? node : node?.parentElement;
    if (!el || el.tagName === 'BODY' || el.tagName === 'HTML') return false;
    if (el.classList?.contains?.('ag-prism-thought-chunk') || el.classList?.contains?.('ag-prism-thought-overlay')) return true;
    const h = (n, k) => !!n?.hasAttribute?.(k), f = el.firstElementChild;
    if (h(el, HC_A) || h(f, HC_A) || h(f?.firstElementChild, HC_A) || (h(el, 'data-base-ui-portal') && !!qs(el, '[data-hover-card-popup]'))) return true;
    return !!el.closest?.(IGNORED_CHAT_SEL);
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
        if (!(fSync || closed) && !touchesModel(batch)) {
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
        takeRecords: () => (inner.takeRecords ? inner.takeRecords() : []),
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
      return !!(st && st.getAttribute(PRISM_OWNER_ATTR) !== '1' && !inst);
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

    const getMO = (w) => w.MutationObserver || (typeof MutationObserver === 'function' ? MutationObserver : null);
    function mountMemGuard() {
      const w = gW(), d = gD(), lib = w && d?.body ? resLib(w) : null;
      if (!lib?.installEffortMemoryGuard) return false;
      stopMemGuard();
      memGuard = lib.installEffortMemoryGuard({
        document: d,
        window: w,
        MutationObserver: mkThrottledMO(getMO(w), d, perfStats) || undefined,
      });
      return !!memGuard;
    }

    function mountBuiltIn() {
      const w = gW(), d = gD(), lib = w && d?.body ? resLib(w) : null;
      if (!lib?.installCodexEffortSlider) return false;
      const next = lib.installCodexEffortSlider({
        document: d,
        window: w,
        MutationObserver: mkThrottledMO(getMO(w), d, perfStats) || undefined,
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
        mountedPrism: !!inst,
        memoryGuardActive: !!memGuard,
        yieldedToExternal: !!(yielded || (mode === 'auto' && hasExtInst())),
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

  var STYLE_ID = 'ags-thought-translator-style';
  var BOX_CLASS = 'ags-thought-box';
  var DEFAULT_STABILITY_DEBOUNCE_MS = 650;
  var MEM_CACHE_LIMIT = 600;

  var SEL_TRIGGER = 'button[data-testid="thinking-collapsible-trigger"]';
  var SEL_TOOL_TRIGGERS = '[data-testid="tool-group-collapsible"], [data-testid="worked-for-collapsible"]';
  var SEL_TOOL_ROWS = '[data-testid="tool-call-row"], [data-ag-tool-row="1"]';
  var SEL_TITLE_CONTAINERS =
    '[data-testid="conversation-row-sidebar"], [data-testid="conversation-row-history"], [data-testid="breadcrumb-segment"]';

  var A_EXP = 'aria-expanded';
  var A_PANEL = 'data-ags-thought-panel';
  var A_READY = 'data-ags-thought-ready';
  var A_PENDING = 'data-ags-thought-pending';
  var A_FAILED = 'data-ags-thought-failed';
  var A_FALLBACK = 'data-ags-thought-fallback';
  var A_SIG = 'data-ags-thought-sig';
  var A_SHOW_RAW = 'data-ags-thought-show-raw';
  var A_MANUAL_RAW = 'data-ags-thought-manual-raw';
  var A_BILINGUAL = 'data-ags-thought-bilingual';
  var A_VIEW = 'data-ags-thought-view';

  var BLOCK_TAGS = new Set('P,DIV,LI,UL,OL,PRE,BLOCKQUOTE,H1,H2,H3,H4,H5,H6,TR,HR,SECTION,ARTICLE'.split(','));
  var SKIP_TAGS = new Set('SCRIPT,STYLE,BUTTON,SVG,NOSCRIPT'.split(','));
  var INLINE_SKIP_TAGS = new Set('SCRIPT,STYLE,SVG,NOSCRIPT,PRE,CODE,A,INPUT,TEXTAREA,SELECT,TIME,KBD,SAMP'.split(','));

  var PACKS = {
    'zh-CN': {
      pending: '正在转译思考…',
      retranslate: '重新转译',
      retry: '↻ 重试',
      failed: '转译未完成',
      showRaw: '原文',
      hideRaw: '收起原文',
      fallback: '机翻降级',
      bilingualLabel: '思考原文',
    },
    'zh-TW': {
      pending: '正在轉譯思考…',
      retranslate: '重新轉譯',
      retry: '↻ 重試',
      failed: '轉譯未完成',
      showRaw: '原文',
      hideRaw: '收起原文',
      fallback: '機翻降級',
      bilingualLabel: '思考原文',
    },
    en: {
      pending: 'Translating thought…',
      retranslate: 'Retranslate',
      retry: '↻ Retry',
      failed: 'Translation failed',
      showRaw: 'Raw',
      hideRaw: 'Hide Raw',
      fallback: 'MT Fallback',
      bilingualLabel: 'Original Thought',
    },
  };

  function getPack(lang) {
    var s = String(lang || '').trim().toLowerCase().replace(/_/g, '-');
    if (s.indexOf('zh-tw') === 0 || s.indexOf('zh-hk') === 0 || s.indexOf('zh-hant') === 0) return PACKS['zh-TW'];
    if (s.indexOf('en') === 0) return PACKS.en;
    return PACKS['zh-CN'];
  }

  function hasAttr(el, name) {
    if (!el) return false;
    if (typeof el.hasAttribute === 'function') return el.hasAttribute(name);
    return typeof el.getAttribute === 'function' ? el.getAttribute(name) !== null : false;
  }

  function ga(el, name) {
    return el && typeof el.getAttribute === 'function' ? el.getAttribute(name) : null;
  }

  function sa(el, name, val) {
    if (el && typeof el.setAttribute === 'function') {
      var str = String(val);
      if (ga(el, name) !== str) el.setAttribute(name, str);
    }
  }

  function ra(el, name) {
    if (el && typeof el.removeAttribute === 'function' && hasAttr(el, name)) {
      el.removeAttribute(name);
    }
  }

  function markIgnored(el) {
    sa(el, 'data-ag-studio-ignore', 'true');
    sa(el, 'data-ag-no-i18n', 'true');
    sa(el, 'translate', 'no');
    return el;
  }

  function isIgnoredNode(node) {
    var cur = node;
    while (cur && cur.nodeType !== 9) {
      if (cur.nodeType === 1) {
        if (
          cur.id === 'ag-studio-root' ||
          hasAttr(cur, 'data-ag-studio-ignore') ||
          hasAttr(cur, 'data-ag-no-i18n') ||
          hasAttr(cur, 'data-ags-thought-box')
        ) {
          return true;
        }
        var cls = String((typeof cur.className === 'string' ? cur.className : ga(cur, 'class')) || '');
        if (cls.indexOf(BOX_CLASS) !== -1) return true;
      }
      cur = cur.parentElement || cur.parentNode || null;
    }
    return false;
  }

  function isDirectBoxElement(el) {
    if (!el || el.nodeType !== 1) return false;
    if (hasAttr(el, 'data-ags-thought-box')) return true;
    if (el.classList && typeof el.classList.contains === 'function' && el.classList.contains(BOX_CLASS)) return true;
    var cls = String((typeof el.className === 'string' ? el.className : ga(el, 'class')) || '');
    return (' ' + cls + ' ').indexOf(' ' + BOX_CLASS + ' ') !== -1;
  }

  function findDirectBox(panel) {
    if (!panel) return null;
    var ch = panel.children || panel.childNodes || [];
    for (var i = 0; i < ch.length; i++) {
      if (isDirectBoxElement(ch[i])) return ch[i];
    }
    return null;
  }

  function normalizeTextKey(str) {
    return String(str || '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n')
      .split('\n')
      .map(function (s) { return s.trim(); })
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  function hashText(str) {
    var s = String(str || '');
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36) + '_' + s.length;
  }

  function sanitizeFileHref(rawHref) {
    var trimmed = String(rawHref || '').trim().replace(/^<|>$/g, '');
    if (!trimmed || /[\u0000-\u001f\u007f"'<>`]/.test(trimmed) || !/^file:\/\//i.test(trimmed)) {
      return '';
    }
    try {
      if (typeof URL === 'function') {
        var parsed = new URL(trimmed);
        return parsed.protocol === 'file:' ? parsed.href : '';
      }
    } catch (_e) {
      return '';
    }
    return /^file:\/\/[^\s"'<>`]+$/i.test(trimmed) ? trimmed : '';
  }

  function filePathToSafeHref(rawPath) {
    var p = String(rawPath || '').trim();
    if (!p || /[\u0000-\u001f\u007f"'<>`]/.test(p)) return '';
    if (/^file:\/\//i.test(p)) return sanitizeFileHref(p);
    if (/^[A-Za-z]:[\\/]/.test(p)) return sanitizeFileHref('file:///' + p.replace(/\\/g, '/'));
    return p.charAt(0) === '/' ? sanitizeFileHref('file://' + p) : '';
  }

  function registerFileNodeInMap(node, fileMap) {
    if (!node || !fileMap) return;
    var tag = node.tagName ? String(node.tagName).toUpperCase() : '';
    var rawHref = (tag === 'A' && (ga(node, 'href') || node.href)) || ga(node, 'data-file-href') || ga(node, 'data-href') || '';
    var safeHref = sanitizeFileHref(rawHref);
    if (!safeHref) {
      var rawPath = ga(node, 'data-file-path') || ga(node, 'data-filepath') || ga(node, 'data-omni-path') || '';
      if (rawPath) {
        var ls = ga(node, 'data-line') || ga(node, 'data-omni-line-start') || '';
        var le = ga(node, 'data-omni-line-end') || '';
        var hashSfx = ls && /^\d+$/.test(ls) ? (le && /^\d+$/.test(le) && le !== ls ? '#L' + ls + '-L' + le : '#L' + ls) : '';
        var base = filePathToSafeHref(rawPath);
        if (base) safeHref = hashSfx ? base + hashSfx : base;
      }
    }
    if (!safeHref) return;

    var rec = { el: node, href: safeHref };
    fileMap.byHref.set(safeHref.toLowerCase(), rec);
    var label = String(node.textContent || '').trim().replace(/^`+|`+$/g, '').trim();
    if (label && (/[./\\]/.test(label) || /#L\d+/i.test(label))) {
      var key = label.replace(/\\/g, '/').toLowerCase();
      if (!fileMap.byLabel.has(key)) fileMap.byLabel.set(key, rec);
    }
    try {
      var noHash = safeHref.split('#')[0];
      var decoded = decodeURIComponent(noHash.replace(/^file:\/\/(?:localhost)?/i, '')).replace(/\\/g, '/');
      var segs = decoded.split('/').filter(Boolean);
      var bn = segs.length ? segs[segs.length - 1] : '';
      var hashPart = safeHref.indexOf('#') >= 0 ? safeHref.slice(safeHref.indexOf('#')) : '';
      if (bn) {
        if (hashPart && !fileMap.byLabel.has((bn + hashPart).toLowerCase())) {
          fileMap.byLabel.set((bn + hashPart).toLowerCase(), rec);
        }
        if (!fileMap.byLabel.has(bn.toLowerCase())) {
          fileMap.byLabel.set(bn.toLowerCase(), rec);
        }
      }
      if (segs.length >= 2) {
        var pb = segs[segs.length - 2] + '/' + bn;
        if (!fileMap.byLabel.has(pb.toLowerCase())) fileMap.byLabel.set(pb.toLowerCase(), rec);
      }
    } catch (_e) {}
  }

  function collectCleanText(node, chunks, fileMap) {
    if (!node) return;
    if (node.nodeType === 3) {
      var val = node.nodeValue !== undefined && node.nodeValue !== null ? node.nodeValue : (node.textContent || '');
      if (val) chunks.push(val);
      return;
    }
    if (node.nodeType !== 1 || isDirectBoxElement(node) || hasAttr(node, 'data-ag-studio-ignore') || hasAttr(node, 'data-ag-no-i18n')) {
      return;
    }
    var tag = node.tagName ? String(node.tagName).toUpperCase() : '';
    if (SKIP_TAGS.has(tag)) return;
    if (tag === 'BR') {
      chunks.push('\n');
      return;
    }
    if (fileMap) registerFileNodeInMap(node, fileMap);
    var isBlock = BLOCK_TAGS.has(tag);
    if (isBlock) chunks.push('\n');
    var ch = node.childNodes;
    if (ch && ch.length) {
      for (var i = 0; i < ch.length; i++) collectCleanText(ch[i], chunks, fileMap);
    } else if (typeof node.textContent === 'string' && (!node.children || !node.children.length)) {
      chunks.push(node.textContent);
    }
    if (isBlock) chunks.push('\n');
  }

  function extractPanelText(panel) {
    if (!panel) return { text: '', fileMap: null };
    var chunks = [];
    var fileMap = { byHref: new Map(), byLabel: new Map() };
    var ch = panel.childNodes || panel.children || [];
    for (var i = 0; i < ch.length; i++) {
      collectCleanText(ch[i], chunks, fileMap);
    }
    return { text: normalizeTextKey(chunks.join('')), fileMap: fileMap };
  }

  function isTriggerStreaming(btn) {
    if (!btn) return false;
    if (ga(btn, 'data-op-thought-state') === 'streaming' || ga(btn, 'data-ag-cs-spark-streaming') === '1') {
      return true;
    }
    if (typeof btn.querySelector === 'function') {
      try {
        if (btn.querySelector('.animate-shimmer-text, .animate-spin, .animate-pulse, [class*="animate-shimmer"], .ag-cs-thinking-spark[data-state="streaming"]')) {
          return true;
        }
      } catch (_e) {}
    }
    var txt = String(btn.textContent || '').trim();
    if (!txt || /已思考|Thought\s+for|Thought\s+process/i.test(txt)) return false;
    return /thinking|正在思考|思考中|推演中/i.test(txt) && !/\d+\s*(s|sec|秒|m|min|分)/i.test(txt);
  }

  function isInViewport(el) {
    if (!el || typeof el.getBoundingClientRect !== 'function') return true;
    try {
      var rect = el.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) return true;
      var vh = (typeof window !== 'undefined' && window.innerHeight) ||
        (typeof document !== 'undefined' && document.documentElement && document.documentElement.clientHeight) || 900;
      return rect.bottom >= -120 && rect.top <= vh + 120;
    } catch (_e) {
      return true;
    }
  }

  function buildTranslatorCss() {
    return [
      '.ags-thought-box {',
      '  position: relative;',
      '  margin: 4px 0 8px 0;',
      '  padding: 10px 12px;',
      '  border-radius: 10px;',
      '  border: 1px solid var(--ags-border, rgba(128, 128, 128, 0.25));',
      '  background: var(--ags-bg-surface, rgba(128, 128, 128, 0.06));',
      '  color: var(--ags-text-primary, inherit);',
      '  font-family: var(--ags-font-body, inherit);',
      '  font-size: 13px;',
      '  line-height: 1.62;',
      '}',
      '[data-ags-mode="dark"] .ags-thought-box {',
      '  background: var(--ags-bg-surface, rgba(255, 255, 255, 0.04));',
      '}',
      '.ags-thought-header {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: flex-end;',
      '  gap: 6px;',
      '  margin-bottom: 6px;',
      '}',
      '.ags-thought-badge {',
      '  font-size: 11px;',
      '  line-height: 16px;',
      '  padding: 1px 7px;',
      '  border-radius: 999px;',
      '  background: var(--ags-accent-soft, rgba(217, 119, 87, 0.14));',
      '  color: var(--ags-warning, #d97706);',
      '  border: 1px solid var(--ags-border, rgba(128, 128, 128, 0.25));',
      '  margin-right: auto;',
      '}',
      '.ags-thought-btn {',
      '  appearance: none;',
      '  cursor: pointer;',
      '  border: 1px solid var(--ags-border, rgba(128, 128, 128, 0.28));',
      '  background: var(--ags-bg-subtle, rgba(128, 128, 128, 0.08));',
      '  color: var(--ags-text-secondary, inherit);',
      '  border-radius: 6px;',
      '  padding: 2px 7px;',
      '  font-size: 11px;',
      '  line-height: 16px;',
      '  transition: border-color 140ms ease, color 140ms ease;',
      '}',
      '.ags-thought-btn:hover {',
      '  border-color: var(--ags-accent, #d97757);',
      '  color: var(--ags-text-primary, inherit);',
      '}',
      '.ags-thought-body p { margin: 0 0 6px 0; }',
      '.ags-thought-body p:last-child { margin-bottom: 0; }',
      '.ags-thought-body ul, .ags-thought-body ol { margin: 4px 0 6px 18px; padding: 0; }',
      '.ags-thought-body pre {',
      '  background: var(--ags-code-bg, rgba(128, 128, 128, 0.1));',
      '  border: 1px solid var(--ags-border, rgba(128, 128, 128, 0.22));',
      '  border-radius: 6px;',
      '  padding: 8px 10px;',
      '  overflow-x: auto;',
      '  font-family: var(--ags-font-code, monospace);',
      '  font-size: 12px;',
      '}',
      '.ags-thought-code {',
      '  background: var(--ags-code-bg, rgba(128, 128, 128, 0.12));',
      '  border-radius: 4px;',
      '  padding: 1px 4px;',
      '  font-family: var(--ags-font-code, monospace);',
      '  font-size: 0.92em;',
      '}',
      '.ags-thought-file-pill {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  padding: 0 5px;',
      '  border-radius: 5px;',
      '  background: var(--ags-accent-soft, rgba(217, 119, 87, 0.14));',
      '  color: var(--ags-accent, #d97757);',
      '  font-family: var(--ags-font-code, monospace);',
      '  font-size: 0.92em;',
      '  text-decoration: none;',
      '  cursor: pointer;',
      '}',
      '.ags-thought-file-pill:hover { text-decoration: underline; }',
      '.ags-thought-pending { color: var(--ags-text-secondary, #888); font-style: italic; }',
      '.ags-thought-error {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  color: var(--ags-danger, #dc2626);',
      '  font-size: 12px;',
      '}',
      '.ags-thought-bilingual-divider {',
      '  display: none;',
      '  align-items: center;',
      '  gap: 8px;',
      '  margin-top: 8px;',
      '  padding-top: 6px;',
      '  border-top: 1px dashed var(--ags-border, rgba(128, 128, 128, 0.3));',
      '  font-size: 11px;',
      '  color: var(--ags-text-secondary, #888);',
      '}',
      '[' + A_PANEL + '="1"][' + A_BILINGUAL + '="1"] .ags-thought-bilingual-divider { display: flex; }',
      '[' + A_PANEL + '="1"][' + A_READY + '="1"]:not([' + A_SHOW_RAW + '="1"]) > :not(.ags-thought-box) { display: none !important; }',
    ].join('\n');
  }

  function ensureStyleInjected(doc) {
    if (!doc || !doc.createElement) return;
    var existing = typeof doc.getElementById === 'function' ? doc.getElementById(STYLE_ID) : null;
    if (existing) return;
    var styleEl = doc.createElement('style');
    styleEl.id = STYLE_ID;
    markIgnored(styleEl);
    styleEl.textContent = buildTranslatorCss();
    var target = doc.head || doc.documentElement || doc.body;
    if (target && typeof target.appendChild === 'function') {
      target.appendChild(styleEl);
    }
  }

  function removeStyleElement(doc) {
    if (!doc || typeof doc.getElementById !== 'function') return;
    var el = doc.getElementById(STYLE_ID);
    if (el && typeof el.remove === 'function') el.remove();
    else if (el && el.parentNode && typeof el.parentNode.removeChild === 'function') {
      el.parentNode.removeChild(el);
    }
  }

  function clearChildren(el) {
    while (el && el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function lookupFileTarget(fileMap, candidate) {
    var cleaned = String(candidate || '').trim().replace(/^`+|`+$/g, '').trim();
    if (!cleaned) return null;
    if (/^file:\/\//i.test(cleaned)) {
      var safe = sanitizeFileHref(cleaned);
      if (!safe) return null;
      var hit = fileMap ? fileMap.byHref.get(safe.toLowerCase()) : null;
      return { href: safe, nativeEl: hit ? hit.el : null };
    }
    if (!fileMap) return null;
    var norm = cleaned.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase();
    var labelHit = fileMap.byLabel.get(norm);
    if (labelHit) return { href: labelHit.href, nativeEl: labelHit.el };
    return null;
  }

  function createFileLinkElement(doc, labelText, href, nativeEl) {
    var safeHref = sanitizeFileHref(href);
    if (!safeHref) return doc.createTextNode(labelText);
    var a = doc.createElement('a');
    a.className = 'ags-thought-file-pill';
    sa(a, 'href', safeHref);
    sa(a, 'title', safeHref);
    a.textContent = labelText;
    if (typeof a.addEventListener === 'function') {
      a.addEventListener('click', function (ev) {
        if (nativeEl && nativeEl.isConnected !== false && typeof nativeEl.click === 'function') {
          if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
          if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
          nativeEl.click();
        }
      });
    }
    return a;
  }

  function appendPlainWithFileLinks(doc, parent, slice, fileMap) {
    if (!slice) return;
    var re = /(file:\/\/[^\s"'<>()`\uff0c\u3002\uff1b\uff01\uff1f\u3001\uff08\uff09\u3010\u3011\]]+|(?:[A-Za-z0-9_.-]+[\\/])*[A-Za-z0-9_.-]+\.[A-Za-z0-9]{1,8}(?:#L\d+(?:-L?\d+)?|:\d+(?:-\d+)?)?)/g;
    var last = 0;
    var m;
    while ((m = re.exec(slice)) !== null) {
      var rawTok = m[0];
      var trailing = '';
      if (/^file:\/\//i.test(rawTok)) {
        var stripped = rawTok.replace(/[.,;:!?]+$/, '');
        trailing = rawTok.slice(stripped.length);
        rawTok = stripped;
      }
      var hit = /^file:\/\//i.test(rawTok)
        ? lookupFileTarget(fileMap, rawTok)
        : lookupFileTarget(fileMap, rawTok);
      if (hit && hit.href) {
        if (m.index > last) parent.appendChild(doc.createTextNode(slice.slice(last, m.index)));
        parent.appendChild(createFileLinkElement(doc, rawTok, hit.href, hit.nativeEl));
        if (trailing) parent.appendChild(doc.createTextNode(trailing));
        last = m.index + m[0].length;
      }
    }
    if (last < slice.length) parent.appendChild(doc.createTextNode(slice.slice(last)));
  }

  function appendInlineMarkdown(doc, parent, line, fileMap, depth) {
    var d = depth || 0;
    var tokenRe = /(\[([^\[\]\n]+)\]\(((?:\([^()\s]*\)|[^()\s])+)\)|`([^`\n]+)`|\*\*([^*\n]+)\*\*)/g;
    var last = 0;
    var m;
    while ((m = tokenRe.exec(line)) !== null) {
      if (m.index > last) appendPlainWithFileLinks(doc, parent, line.slice(last, m.index), fileMap);
      if (m[2] !== undefined && m[3] !== undefined) {
        var label = m[2].trim().replace(/^`+|`+$/g, '').trim() || m[2].trim();
        var rawUrl = m[3].trim();
        var safeHref = sanitizeFileHref(rawUrl);
        if (safeHref) {
          var hit = lookupFileTarget(fileMap, safeHref);
          parent.appendChild(createFileLinkElement(doc, label, safeHref, hit ? hit.nativeEl : null));
        } else {
          // Reject non-file:// protocols (javascript:, data:, http:, etc.)
          parent.appendChild(doc.createTextNode(label));
        }
      } else if (m[4] !== undefined) {
        var codeInner = m[4];
        var codeHit = lookupFileTarget(fileMap, codeInner);
        if (codeHit && codeHit.href) {
          parent.appendChild(createFileLinkElement(doc, codeInner.trim(), codeHit.href, codeHit.nativeEl));
        } else {
          var codeEl = doc.createElement('code');
          codeEl.className = 'ags-thought-code';
          codeEl.textContent = codeInner;
          parent.appendChild(codeEl);
        }
      } else if (m[5] !== undefined) {
        var strongEl = doc.createElement('strong');
        if (d < 2) appendInlineMarkdown(doc, strongEl, m[5], fileMap, d + 1);
        else strongEl.textContent = m[5];
        parent.appendChild(strongEl);
      }
      last = m.index + m[0].length;
    }
    if (last < line.length) appendPlainWithFileLinks(doc, parent, line.slice(last), fileMap);
  }

  function renderMarkdownBody(doc, container, text, fileMap) {
    clearChildren(container);
    var lines = String(text || '').split('\n');
    var inFence = false;
    var fenceLines = [];
    var listEl = null;
    var listTag = '';

    for (var i = 0; i < lines.length; i++) {
      var rawLine = lines[i].endsWith('\r') ? lines[i].slice(0, -1) : lines[i];
      var trimmed = rawLine.trim();
      if (!inFence && trimmed.indexOf('```') === 0) {
        listEl = null;
        listTag = '';
        inFence = true;
        fenceLines = [];
        continue;
      }
      if (inFence && /^`{3,}\s*$/.test(trimmed)) {
        var pre = doc.createElement('pre');
        pre.textContent = fenceLines.join('\n');
        container.appendChild(pre);
        inFence = false;
        fenceLines = [];
        continue;
      }
      if (inFence) {
        fenceLines.push(rawLine);
        continue;
      }
      if (!trimmed) {
        listEl = null;
        listTag = '';
        continue;
      }
      var ulMatch = /^[-*•]\s+(.+)$/.exec(trimmed);
      var olMatch = !ulMatch && /^\d+[.)]\s+(.+)$/.exec(trimmed);
      if (ulMatch || olMatch) {
        var wantTag = ulMatch ? 'ul' : 'ol';
        if (!listEl || listTag !== wantTag) {
          listEl = doc.createElement(wantTag);
          listTag = wantTag;
          container.appendChild(listEl);
        }
        var li = doc.createElement('li');
        appendInlineMarkdown(doc, li, (ulMatch ? ulMatch[1] : olMatch[1]), fileMap, 0);
        listEl.appendChild(li);
      } else {
        listEl = null;
        listTag = '';
        var p = doc.createElement('p');
        appendInlineMarkdown(doc, p, trimmed.replace(/^#{1,4}\s+/, ''), fileMap, 0);
        container.appendChild(p);
      }
    }
    if (inFence && fenceLines.length) {
      var tailPre = doc.createElement('pre');
      tailPre.textContent = fenceLines.join('\n');
      container.appendChild(tailPre);
    }
  }

  function createThoughtTranslatorController(opts) {
    var options = opts || {};
    var stabilityDebounceMs = typeof options.debounceMs === 'number' && options.debounceMs >= 0
      ? options.debounceMs
      : DEFAULT_STABILITY_DEBOUNCE_MS;

    var currentCfg = { thought: { mode: 'off' }, i18n: { language: 'zh-CN' } };
    var currentApi = null;
    var currentMode = 'off';
    var currentViewMode = 'immersive';
    var currentLang = 'zh-CN';
    var currentStylePreset = 'technical';
    var currentCustomPrompt = '';
    var currentTrigger = 'preload';
    var translateToolSummaries = false;
    var translateTitles = false;

    var observer = null;
    var scanTimer = null;
    var debounceTimers = new Map();
    var panelStateMap = new WeakMap();
    var memCache = new Map();
    var inflightByKey = new Map();
    var toolRecords = new Set();
    var toolNodeMap = new WeakMap();
    var titleRecords = new Set();
    var titleNodeMap = new WeakMap();
    var destroyed = false;

    function getDoc() {
      return options.document || (typeof document !== 'undefined' ? document : null);
    }

    function putMemCache(key, value) {
      if (!key || !value) return;
      if (memCache.has(key)) memCache.delete(key);
      while (memCache.size >= MEM_CACHE_LIMIT) {
        var oldest = memCache.keys().next().value;
        if (oldest === undefined) break;
        memCache.delete(oldest);
      }
      memCache.set(key, value);
    }

    function buildCacheSig(text) {
      return [currentMode, currentStylePreset, currentLang, hashText(text)].join(':');
    }

    function applyPanelViewAttrs(panel) {
      if (!panel) return;
      var failed = ga(panel, A_FAILED) === '1';
      var manualRaw = ga(panel, A_MANUAL_RAW);
      var showRaw = failed || (manualRaw === '1' ? true : manualRaw === '0' ? false : currentViewMode === 'bilingual');
      sa(panel, A_VIEW, currentViewMode);
      if (showRaw) sa(panel, A_SHOW_RAW, '1');
      else ra(panel, A_SHOW_RAW);

      if (currentViewMode === 'bilingual' && showRaw && !failed) sa(panel, A_BILINGUAL, '1');
      else ra(panel, A_BILINGUAL);

      var box = findDirectBox(panel);
      if (box && typeof box.querySelector === 'function') {
        var toggleBtn = box.querySelector('.ags-thought-raw-toggle');
        if (toggleBtn) {
          var pack = getPack(currentLang);
          toggleBtn.textContent = showRaw ? pack.hideRaw : pack.showRaw;
          sa(toggleBtn, 'aria-pressed', String(showRaw));
        }
      }
    }

    function ensureBox(panel, triggerBtn) {
      var doc = getDoc();
      if (!doc || !panel) return null;
      var box = findDirectBox(panel);
      if (box) return box;

      var pack = getPack(currentLang);
      box = doc.createElement('div');
      box.className = BOX_CLASS;
      markIgnored(box);
      sa(box, 'data-ags-thought-box', '1');

      var header = doc.createElement('div');
      header.className = 'ags-thought-header';

      var badge = doc.createElement('span');
      badge.className = 'ags-thought-badge';
      badge.hidden = true;
      badge.textContent = pack.fallback;
      header.appendChild(badge);

      var retranslateBtn = doc.createElement('button');
      retranslateBtn.type = 'button';
      retranslateBtn.className = 'ags-thought-btn ags-thought-retranslate-btn';
      retranslateBtn.textContent = '↻';
      retranslateBtn.title = pack.retranslate;
      sa(retranslateBtn, 'aria-label', pack.retranslate);
      if (typeof retranslateBtn.addEventListener === 'function') {
        retranslateBtn.addEventListener('click', function (ev) {
          if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
          if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
          translatePanel(panel, triggerBtn, { force: true });
        });
      }
      header.appendChild(retranslateBtn);

      var rawToggleBtn = doc.createElement('button');
      rawToggleBtn.type = 'button';
      rawToggleBtn.className = 'ags-thought-btn ags-thought-raw-toggle';
      rawToggleBtn.textContent = pack.showRaw;
      if (typeof rawToggleBtn.addEventListener === 'function') {
        rawToggleBtn.addEventListener('click', function (ev) {
          if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
          if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
          sa(panel, A_MANUAL_RAW, ga(panel, A_SHOW_RAW) === '1' ? '0' : '1');
          applyPanelViewAttrs(panel);
        });
      }
      header.appendChild(rawToggleBtn);

      var body = doc.createElement('div');
      body.className = 'ags-thought-body';

      var divider = doc.createElement('div');
      divider.className = 'ags-thought-bilingual-divider';
      divider.textContent = pack.bilingualLabel;

      box.appendChild(header);
      box.appendChild(body);
      box.appendChild(divider);

      sa(panel, A_PANEL, '1');
      if (typeof panel.insertBefore === 'function') {
        panel.insertBefore(box, panel.firstChild || null);
      } else if (typeof panel.appendChild === 'function') {
        panel.appendChild(box);
      }
      return box;
    }

    function renderBoxPending(panel, triggerBtn) {
      var doc = getDoc();
      var box = ensureBox(panel, triggerBtn);
      if (!box || !doc) return;
      var body = box.querySelector ? box.querySelector('.ags-thought-body') : box.childNodes[1];
      if (body) {
        clearChildren(body);
        var span = doc.createElement('span');
        span.className = 'ags-thought-pending';
        span.textContent = getPack(currentLang).pending;
        body.appendChild(span);
      }
      sa(panel, A_PENDING, '1');
      ra(panel, A_FAILED);
      applyPanelViewAttrs(panel);
    }

    function renderBoxResult(panel, triggerBtn, text, sig, fileMap, isFallback) {
      var doc = getDoc();
      var box = ensureBox(panel, triggerBtn);
      if (!box || !doc) return;
      var body = box.querySelector ? box.querySelector('.ags-thought-body') : box.childNodes[1];
      if (body) {
        renderMarkdownBody(doc, body, text, fileMap);
      }
      var badge = box.querySelector ? box.querySelector('.ags-thought-badge') : null;
      if (badge) {
        badge.hidden = !isFallback;
        badge.textContent = getPack(currentLang).fallback;
      }
      ra(panel, A_PENDING);
      ra(panel, A_FAILED);
      if (isFallback) sa(panel, A_FALLBACK, '1');
      else ra(panel, A_FALLBACK);
      sa(panel, A_READY, '1');
      sa(panel, A_SIG, sig);
      applyPanelViewAttrs(panel);
    }

    function renderBoxError(panel, triggerBtn, errMsg) {
      var doc = getDoc();
      var box = ensureBox(panel, triggerBtn);
      if (!box || !doc) return;
      var pack = getPack(currentLang);
      var body = box.querySelector ? box.querySelector('.ags-thought-body') : box.childNodes[1];
      if (body) {
        clearChildren(body);
        var wrap = doc.createElement('div');
        wrap.className = 'ags-thought-error';

        var msg = doc.createElement('span');
        msg.textContent = errMsg ? (pack.failed + ': ' + String(errMsg).slice(0, 120)) : pack.failed;
        wrap.appendChild(msg);

        var retryBtn = doc.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'ags-thought-btn ags-thought-retry-btn';
        retryBtn.textContent = pack.retry;
        if (typeof retryBtn.addEventListener === 'function') {
          retryBtn.addEventListener('click', function (ev) {
            if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
            if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
            translatePanel(panel, triggerBtn, { force: true });
          });
        }
        wrap.appendChild(retryBtn);
        body.appendChild(wrap);
      }
      ra(panel, A_PENDING);
      ra(panel, A_READY);
      sa(panel, A_FAILED, '1');
      applyPanelViewAttrs(panel);
    }

    function translatePanel(panel, triggerBtn, optsTranslate) {
      if (destroyed || currentMode === 'off' || !panel) return;
      var info = extractPanelText(panel);
      if (!info.text) return;

      var force = Boolean(optsTranslate && optsTranslate.force);
      var sig = buildCacheSig(info.text);

      if (!force) {
        if (ga(panel, A_READY) === '1' && ga(panel, A_SIG) === sig) {
          applyPanelViewAttrs(panel);
          return;
        }
        var cached = memCache.get(sig);
        if (cached) {
          renderBoxResult(panel, triggerBtn, cached, sig, info.fileMap, false);
          return;
        }
      } else {
        memCache.delete(sig);
      }

      if (!currentApi || typeof currentApi.translateThought !== 'function') return;

      var existingFlight = !force ? inflightByKey.get(sig) : null;
      if (existingFlight) {
        renderBoxPending(panel, triggerBtn);
        existingFlight.then(function (res) {
          if (destroyed || currentMode === 'off' || panel.isConnected === false) return;
          if (res && res.ok && res.text) {
            renderBoxResult(panel, triggerBtn, res.text, sig, info.fileMap, Boolean(res.fallback));
          } else if (res && res.skipped) {
            cleanupPanel(panel);
          } else {
            renderBoxError(panel, triggerBtn, res && res.error);
          }
        }).catch(function (err) {
          if (!destroyed && currentMode !== 'off' && panel.isConnected !== false) {
            renderBoxError(panel, triggerBtn, err && err.message);
          }
        });
        return;
      }

      renderBoxPending(panel, triggerBtn);
      var priority = isInViewport(panel) ? 100 : 10;

      var promise = Promise.resolve().then(function () {
        return currentApi.translateThought({
          text: info.text,
          mode: currentMode,
          kind: 'thought',
          targetLang: currentLang,
          stylePreset: currentStylePreset,
          customPrompt: currentCustomPrompt,
          force: force,
          priority: priority,
        });
      });
      inflightByKey.set(sig, promise);

      promise.then(function (res) {
        if (inflightByKey.get(sig) === promise) inflightByKey.delete(sig);
        if (destroyed || currentMode === 'off' || panel.isConnected === false) return;
        if (res && res.ok && res.skipped) {
          cleanupPanel(panel);
          return;
        }
        if (res && res.ok && typeof res.text === 'string' && res.text.trim()) {
          var finalText = res.text.trim();
          putMemCache(sig, finalText);
          renderBoxResult(panel, triggerBtn, finalText, sig, info.fileMap, Boolean(res.fallback));
        } else {
          renderBoxError(panel, triggerBtn, res && res.error);
        }
      }).catch(function (err) {
        if (inflightByKey.get(sig) === promise) inflightByKey.delete(sig);
        if (!destroyed && currentMode !== 'off' && panel.isConnected !== false) {
          renderBoxError(panel, triggerBtn, err && err.message);
        }
      });
    }

    function schedulePanelTranslation(panel, triggerBtn, delayMs) {
      if (destroyed || currentMode === 'off' || !panel) return;
      var prevTimer = debounceTimers.get(panel);
      if (prevTimer) {
        clearTimeout(prevTimer);
        debounceTimers.delete(panel);
      }
      if (delayMs <= 0) {
        translatePanel(panel, triggerBtn, { force: false });
        return;
      }
      var t = setTimeout(function () {
        debounceTimers.delete(panel);
        if (!destroyed && currentMode !== 'off' && panel.isConnected !== false) {
          translatePanel(panel, triggerBtn, { force: false });
        }
      }, delayMs);
      if (t && typeof t.unref === 'function') t.unref();
      debounceTimers.set(panel, t);
    }

    function restoreInlineRecords(recordsSet, nodeMap, attrName) {
      for (var rec of Array.from(recordsSet)) {
        try {
          if (rec.tn && rec.tn.isConnected !== false && rec.tn.nodeValue === rec.trans) {
            rec.tn.nodeValue = rec.orig;
          }
          if (rec.el) ra(rec.el, attrName);
        } catch (_e) {}
        if (rec.tn) nodeMap.delete(rec.tn);
        recordsSet.delete(rec);
      }
    }

    function scanInlineKind(doc, containers, kind, recordsSet, nodeMap, attrName) {
      if (!currentApi || typeof currentApi.translateThought !== 'function' || currentMode === 'off') return;
      for (var i = 0; i < containers.length; i++) {
        var root = containers[i];
        if (!root || isIgnoredNode(root)) continue;
        var textNodes = [];
        var walk = function (n) {
          if (!n) return;
          if (n.nodeType === 3) {
            var v = String(n.nodeValue || '').trim();
            if (v.length >= 4 && v.length <= 280) textNodes.push(n);
            return;
          }
          if (n.nodeType !== 1 || isIgnoredNode(n)) return;
          var tag = n.tagName ? String(n.tagName).toUpperCase() : '';
          if (INLINE_SKIP_TAGS.has(tag)) return;
          var ch = n.childNodes || [];
          for (var j = 0; j < ch.length; j++) walk(ch[j]);
        };
        walk(root);
        textNodes.forEach(function (tn) {
          var prev = nodeMap.get(tn);
          if (prev && prev.trans === tn.nodeValue && prev.lang === currentLang && prev.mode === currentMode) return;
          var rawVal = String(tn.nodeValue || '');
          var trimmed = rawVal.trim();
          var cacheSig = [kind, currentMode, currentLang, hashText(trimmed)].join(':');
          var cached = memCache.get(cacheSig);
          var applyVal = function (translated) {
            if (destroyed || currentMode === 'off' || tn.isConnected === false || tn.nodeValue !== rawVal) return;
            var nextVal = rawVal.replace(trimmed, translated);
            if (nextVal === rawVal) return;
            var el = tn.parentElement || null;
            tn.nodeValue = nextVal;
            if (el) sa(el, attrName, '1');
            var rec = { tn: tn, el: el, orig: rawVal, trans: nextVal, lang: currentLang, mode: currentMode };
            nodeMap.set(tn, rec);
            recordsSet.add(rec);
          };
          if (cached) {
            applyVal(cached);
            return;
          }
          Promise.resolve().then(function () {
            return currentApi.translateThought({
              text: trimmed,
              mode: currentMode,
              kind: kind,
              targetLang: currentLang,
              stylePreset: currentStylePreset,
              priority: 50,
            });
          }).then(function (res) {
            if (res && res.ok && !res.skipped && typeof res.text === 'string' && res.text.trim()) {
              putMemCache(cacheSig, res.text.trim());
              applyVal(res.text.trim());
            }
          }).catch(function () {});
        });
      }
    }

    function scanNow() {
      scanTimer = null;
      if (destroyed || currentMode === 'off') return;
      var doc = getDoc();
      if (!doc || typeof doc.querySelectorAll !== 'function') return;

      ensureStyleInjected(doc);

      var triggers = doc.querySelectorAll(SEL_TRIGGER) || [];
      var list = [];
      for (var i = 0; i < triggers.length; i++) {
        var btn = triggers[i];
        if (!btn || isIgnoredNode(btn)) continue;
        var expanded = ga(btn, A_EXP) === 'true';
        var isLatest = i === triggers.length - 1;
        if (!expanded && !(currentTrigger === 'preload' && isLatest)) continue;
        var panel = btn.nextElementSibling;
        if (!panel || String(panel.tagName || '').toUpperCase() !== 'DIV' || isIgnoredNode(panel)) continue;
        list.push({
          btn: btn,
          panel: panel,
          priority: (isInViewport(panel) ? 100 : 0) + (isLatest ? 10 : 0),
        });
      }
      list.sort(function (a, b) { return b.priority - a.priority; });

      for (var k = 0; k < list.length; k++) {
        var item = list[k];
        if (isTriggerStreaming(item.btn)) {
          schedulePanelTranslation(item.panel, item.btn, stabilityDebounceMs);
          continue;
        }
        var info = extractPanelText(item.panel);
        if (!info.text) continue;
        var sig = buildCacheSig(info.text);
        if (ga(item.panel, A_READY) === '1' && ga(item.panel, A_SIG) === sig) {
          applyPanelViewAttrs(item.panel);
          continue;
        }
        var cached = memCache.get(sig);
        if (cached) {
          renderBoxResult(item.panel, item.btn, cached, sig, info.fileMap, false);
          continue;
        }
        var state = panelStateMap.get(item.panel);
        if (!state || state.text !== info.text) {
          panelStateMap.set(item.panel, { text: info.text });
          schedulePanelTranslation(item.panel, item.btn, state ? stabilityDebounceMs : Math.min(stabilityDebounceMs, 50));
        } else if (!debounceTimers.has(item.panel) && ga(item.panel, A_PENDING) !== '1' && ga(item.panel, A_FAILED) !== '1') {
          schedulePanelTranslation(item.panel, item.btn, stabilityDebounceMs);
        }
      }

      if (translateToolSummaries) {
        var toolContainers = [];
        var tGroups = doc.querySelectorAll(SEL_TOOL_TRIGGERS) || [];
        for (var g = 0; g < tGroups.length; g++) {
          if (ga(tGroups[g], A_EXP) === 'true' && tGroups[g].nextElementSibling) {
            toolContainers.push(tGroups[g].nextElementSibling);
          }
        }
        var tRows = doc.querySelectorAll(SEL_TOOL_ROWS) || [];
        for (var r = 0; r < tRows.length; r++) toolContainers.push(tRows[r]);
        if (toolContainers.length) {
          scanInlineKind(doc, toolContainers, 'tool_summary', toolRecords, toolNodeMap, 'data-ags-tool-tr');
        }
      }

      if (translateTitles) {
        var titleEls = doc.querySelectorAll(SEL_TITLE_CONTAINERS) || [];
        if (titleEls.length) {
          scanInlineKind(doc, titleEls, 'title', titleRecords, titleNodeMap, 'data-ags-title-tr');
        }
      }
    }

    function scheduleScan(delayMs) {
      if (destroyed || currentMode === 'off' || scanTimer) return;
      scanTimer = setTimeout(scanNow, typeof delayMs === 'number' ? delayMs : 40);
      if (scanTimer && typeof scanTimer.unref === 'function') scanTimer.unref();
    }

    function ensureObserver() {
      if (observer || destroyed || currentMode === 'off') return;
      var doc = getDoc();
      var MO = options.MutationObserver ||
        (typeof globalScope !== 'undefined' && globalScope.MutationObserver) ||
        (typeof MutationObserver === 'function' ? MutationObserver : null);
      if (!doc || typeof MO !== 'function') return;
      var target = doc.body || doc.documentElement;
      if (!target) return;

      observer = new MO(function (records) {
        if (destroyed || currentMode === 'off') return;
        var relevant = false;
        for (var i = 0; i < records.length; i++) {
          var rec = records[i];
          var tgt = rec && rec.target;
          if (!tgt || isIgnoredNode(tgt)) continue;
          relevant = true;
          break;
        }
        if (relevant) scheduleScan(40);
      });
      try {
        observer.observe(target, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: [A_EXP, 'class', 'data-op-thought-state'],
        });
      } catch (_e) {}
    }

    function disconnectObserver() {
      if (observer) {
        try { observer.disconnect(); } catch (_e) {}
        observer = null;
      }
    }

    function cleanupPanel(panel) {
      if (!panel) return;
      var timer = debounceTimers.get(panel);
      if (timer) {
        clearTimeout(timer);
        debounceTimers.delete(panel);
      }
      var box = findDirectBox(panel);
      if (box) {
        if (typeof box.remove === 'function') box.remove();
        else if (panel.removeChild) panel.removeChild(box);
      }
      [A_PANEL, A_READY, A_PENDING, A_FAILED, A_FALLBACK, A_SIG, A_SHOW_RAW, A_MANUAL_RAW, A_BILINGUAL, A_VIEW].forEach(function (attr) {
        ra(panel, attr);
      });
    }

    function cleanupAll() {
      if (scanTimer) {
        clearTimeout(scanTimer);
        scanTimer = null;
      }
      for (var t of debounceTimers.values()) clearTimeout(t);
      debounceTimers.clear();
      disconnectObserver();
      restoreInlineRecords(toolRecords, toolNodeMap, 'data-ags-tool-tr');
      restoreInlineRecords(titleRecords, titleNodeMap, 'data-ags-title-tr');

      var doc = getDoc();
      if (doc && typeof doc.querySelectorAll === 'function') {
        var boxes = doc.querySelectorAll('.' + BOX_CLASS + ', [data-ags-thought-box="1"]') || [];
        for (var i = 0; i < boxes.length; i++) {
          var box = boxes[i];
          var parent = box.parentElement || box.parentNode;
          if (typeof box.remove === 'function') box.remove();
          else if (parent && parent.removeChild) parent.removeChild(box);
        }
        var panels = doc.querySelectorAll('[' + A_PANEL + '="1"]') || [];
        for (var j = 0; j < panels.length; j++) cleanupPanel(panels[j]);
        removeStyleElement(doc);
      }
      inflightByKey.clear();
    }

    function sync(cfg, api) {
      if (destroyed) return;
      if (api !== undefined) currentApi = api;
      currentCfg = cfg || {};
      var tCfg = (currentCfg && currentCfg.thought) || {};
      var nextMode = tCfg.mode === 'machine' || tCfg.mode === 'ai' ? tCfg.mode : 'off';

      if (nextMode === 'off') {
        currentMode = 'off';
        cleanupAll();
        return;
      }

      var prevMode = currentMode;
      var prevLang = currentLang;
      var prevView = currentViewMode;
      var prevPreset = currentStylePreset;
      var prevPrompt = currentCustomPrompt;

      currentMode = nextMode;
      currentViewMode = tCfg.viewMode === 'bilingual' ? 'bilingual' : 'immersive';
      currentLang = tCfg.targetLang || (currentCfg.i18n && currentCfg.i18n.language) || 'zh-CN';
      currentStylePreset = tCfg.stylePreset || 'technical';
      currentCustomPrompt = tCfg.customPrompt || '';
      currentTrigger = tCfg.trigger === 'expand' ? 'expand' : 'preload';
      var nextToolSum = Boolean(tCfg.translateToolSummaries);
      var nextTitles = Boolean(tCfg.translateTitles);

      if (translateToolSummaries && !nextToolSum) {
        restoreInlineRecords(toolRecords, toolNodeMap, 'data-ags-tool-tr');
      }
      if (translateTitles && !nextTitles) {
        restoreInlineRecords(titleRecords, titleNodeMap, 'data-ags-title-tr');
      }
      translateToolSummaries = nextToolSum;
      translateTitles = nextTitles;

      ensureStyleInjected(getDoc());
      ensureObserver();

      var viewChanged = prevView !== currentViewMode;
      var configChanged = prevMode !== currentMode || prevLang !== currentLang || prevPreset !== currentStylePreset || prevPrompt !== currentCustomPrompt;
      if (viewChanged && !configChanged) {
        var doc = getDoc();
        if (doc && typeof doc.querySelectorAll === 'function') {
          var panels = doc.querySelectorAll('[' + A_PANEL + '="1"]') || [];
          for (var i = 0; i < panels.length; i++) {
            ra(panels[i], A_MANUAL_RAW);
            applyPanelViewAttrs(panels[i]);
          }
        }
      }
      scanNow();
    }

    function clearCache() {
      memCache.clear();
      if (currentApi) {
        if (typeof currentApi.clearThoughtCache === 'function') {
          return currentApi.clearThoughtCache();
        }
        if (typeof currentApi.clearCache === 'function') {
          return currentApi.clearCache();
        }
      }
      return Promise.resolve({ ok: true, cleared: 0 });
    }

    function destroy() {
      destroyed = true;
      currentMode = 'off';
      cleanupAll();
      memCache.clear();
      currentApi = null;
    }

    return {
      sync: sync,
      clearCache: clearCache,
      destroy: destroy,
      scanNow: scanNow,
    };
  }

  var exported = {
    createThoughtTranslatorController: createThoughtTranslatorController,
    sanitizeFileHref: sanitizeFileHref,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_THOUGHT_TRANSLATOR__ = exported;
  }
  if (typeof window !== 'undefined' && window !== globalScope) {
    window.__AG_STUDIO_THOUGHT_TRANSLATOR__ = exported;
  }
})(typeof window !== 'undefined' ? window : globalThis);


(function (globalScope) {
  'use strict';

  var STYLE_ID = 'ag-studio-inline-diff-style';
  var PANEL_ATTR = 'data-ags-inline-diff-panel';
  var BOUND_ATTR = 'data-ags-inline-diff-bound';
  var IGNORE_SEL = '[data-ag-studio-ignore], [data-ag-no-i18n], #ag-studio-root';
  var CONV_SCOPE_SEL = '[data-testid="conversation-view"], [data-tiling-pane], [data-testid="autoscroll-viewport"]';
  var FILE_ITEM_SEL = [
    '[data-testid="diff-line-count"]',
    '[data-testid="tool-call-row"]',
    '[data-ag-tool-row="1"]',
    '[data-ag-diff-uri]',
    'a[href^="file://"]'
  ].join(', ');

  var INLINE_DIFF_CSS = [
    '.ags-inline-diff-pill {',
    '  display: inline-flex; align-items: center; gap: 4px;',
    '  height: 20px; padding: 0 7px; margin-left: 6px;',
    '  border-radius: 999px; border: 1px solid var(--ags-border, rgba(148,163,184,0.28));',
    '  background: var(--ags-bg-subtle, rgba(148,163,184,0.12));',
    '  color: var(--ags-text-secondary, #94A3B8);',
    '  font-family: var(--ags-font-ui, system-ui, sans-serif); font-size: 11px; font-weight: 500; line-height: 1;',
    '  cursor: pointer; vertical-align: middle; transition: background-color 140ms ease, color 140ms ease, border-color 140ms ease;',
    '}',
    '.ags-inline-diff-pill:hover {',
    '  background: var(--ags-accent-soft, rgba(59,108,246,0.14));',
    '  border-color: var(--ags-accent, #3B6CF6);',
    '  color: var(--ags-text-primary, #F1F5F9);',
    '}',
    '.ags-inline-diff-pill[aria-expanded="true"] {',
    '  background: var(--ags-accent-soft, rgba(59,108,246,0.16));',
    '  border-color: var(--ags-accent, #3B6CF6);',
    '  color: var(--ags-accent, #60A5FA);',
    '}',
    '.ags-inline-diff-panel {',
    '  display: block; box-sizing: border-box; width: 100%; max-width: 100%;',
    '  margin: 6px 0 10px 0; border-radius: 10px; overflow: hidden;',
    '  border: 1px solid var(--ags-border, rgba(148,163,184,0.24));',
    '  background: var(--ags-bg-surface, #1A1E28);',
    '  color: var(--ags-text-primary, #F1F5F9);',
    '  box-shadow: var(--ags-shadow, 0 8px 24px rgba(0,0,0,0.28));',
    '  font-family: var(--ags-font-ui, system-ui, sans-serif);',
    '}',
    '.ags-inline-diff-header {',
    '  display: flex; align-items: center; justify-content: space-between; gap: 8px;',
    '  padding: 6px 10px; border-bottom: 1px solid var(--ags-border, rgba(148,163,184,0.20));',
    '  background: var(--ags-bg-subtle, rgba(148,163,184,0.08)); font-size: 11.5px;',
    '}',
    '.ags-inline-diff-meta { display: flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden; }',
    '.ags-inline-diff-path {',
    '  font-family: var(--ags-font-code, monospace); font-size: 11.5px; font-weight: 600;',
    '  color: var(--ags-text-primary, #F1F5F9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
    '}',
    '.ags-inline-diff-stats { display: inline-flex; align-items: center; gap: 6px; font-family: var(--ags-font-code, monospace); font-size: 11px; flex-shrink: 0; }',
    '.ags-inline-diff-add-stat { color: var(--ags-success, #34D399); font-weight: 600; }',
    '.ags-inline-diff-del-stat { color: var(--ags-danger, #F87171); font-weight: 600; }',
    '.ags-inline-diff-status {',
    '  padding: 1px 6px; border-radius: 999px; font-size: 10px;',
    '  border: 1px solid var(--ags-border, rgba(148,163,184,0.24));',
    '  color: var(--ags-text-secondary, #94A3B8); flex-shrink: 0;',
    '}',
    '.ags-inline-diff-actions { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }',
    '.ags-inline-diff-btn {',
    '  appearance: none; height: 22px; padding: 0 8px; border-radius: 6px;',
    '  border: 1px solid var(--ags-border, rgba(148,163,184,0.24));',
    '  background: var(--ags-bg-surface, transparent); color: var(--ags-text-secondary, #94A3B8);',
    '  font-size: 11px; cursor: pointer;',
    '}',
    '.ags-inline-diff-btn:hover { color: var(--ags-text-primary, #F1F5F9); border-color: var(--ags-accent, #60A5FA); }',
    '.ags-inline-diff-body {',
    '  max-height: 340px; overflow: auto; padding: 4px 0;',
    '  background: var(--ags-code-bg, #12151E);',
    '  font-family: var(--ags-font-code, "JetBrains Mono", Consolas, monospace);',
    '  font-size: 12px; line-height: 1.55; tab-size: 2;',
    '}',
    '.ags-inline-diff-hunk {',
    '  padding: 3px 12px; margin: 2px 0; font-size: 11px;',
    '  color: var(--ags-text-secondary, #94A3B8);',
    '  background: var(--ags-bg-subtle, rgba(148,163,184,0.08));',
    '  border-top: 1px solid var(--ags-border, rgba(148,163,184,0.12));',
    '  border-bottom: 1px solid var(--ags-border, rgba(148,163,184,0.12));',
    '  white-space: pre;',
    '}',
    '.ags-inline-diff-row {',
    '  display: flex; align-items: stretch; min-width: 100%; width: max-content;',
    '  box-sizing: border-box; white-space: pre; color: var(--ags-text-primary, #F1F5F9);',
    '}',
    '.ags-inline-diff-row.is-add { background: rgba(34, 197, 94, 0.14); }',
    '.ags-inline-diff-row.is-del { background: rgba(239, 68, 68, 0.14); }',
    'html[data-ags-mode="light"] .ags-inline-diff-row.is-add { background: rgba(22, 163, 74, 0.11); }',
    'html[data-ags-mode="light"] .ags-inline-diff-row.is-del { background: rgba(220, 38, 38, 0.10); }',
    '.ags-inline-diff-ln {',
    '  flex: none; width: 42px; padding: 0 6px; text-align: right; user-select: none;',
    '  color: var(--ags-text-secondary, #94A3B8); opacity: 0.72;',
    '  border-right: 1px solid var(--ags-border, rgba(148,163,184,0.14));',
    '  font-variant-numeric: tabular-nums; font-size: 11px;',
    '}',
    '.ags-inline-diff-row.is-add .ags-inline-diff-ln { box-shadow: inset 2px 0 0 var(--ags-success, #34D399); }',
    '.ags-inline-diff-row.is-del .ags-inline-diff-ln { box-shadow: inset 2px 0 0 var(--ags-danger, #F87171); }',
    '.ags-inline-diff-sign { flex: none; width: 20px; text-align: center; user-select: none; font-weight: 600; }',
    '.ags-inline-diff-row.is-add .ags-inline-diff-sign { color: var(--ags-success, #34D399); }',
    '.ags-inline-diff-row.is-del .ags-inline-diff-sign { color: var(--ags-danger, #F87171); }',
    '.ags-inline-diff-code { flex: 1 1 auto; min-width: 0; padding: 0 12px 0 2px; }',
    '.ags-inline-diff-msg, .ags-inline-diff-truncated {',
    '  padding: 8px 12px; font-family: var(--ags-font-ui, system-ui, sans-serif); font-size: 12px;',
    '  color: var(--ags-text-secondary, #94A3B8);',
    '}',
    '.ags-inline-diff-truncated {',
    '  border-top: 1px solid var(--ags-border, rgba(148,163,184,0.16));',
    '  background: var(--ags-bg-subtle, rgba(148,163,184,0.06)); font-size: 11px;',
    '}'
  ].join('\n');

  function getAttr(el, name) {
    return el && typeof el.getAttribute === 'function' ? el.getAttribute(name) : null;
  }

  function setAttr(el, name, val) {
    if (el && typeof el.setAttribute === 'function' && getAttr(el, name) !== String(val)) {
      el.setAttribute(name, String(val));
    }
  }

  function removeNodeSafe(el) {
    if (!el) return;
    if (typeof el.remove === 'function') {
      el.remove();
    } else if (el.parentNode && typeof el.parentNode.removeChild === 'function') {
      el.parentNode.removeChild(el);
    }
  }

  function isIgnoredNode(el) {
    if (!el) return true;
    if (el.id === 'ag-studio-root') return true;
    if (getAttr(el, 'data-ag-studio-ignore') != null || getAttr(el, 'data-ag-no-i18n') != null) return true;
    if (typeof el.closest === 'function') {
      if (el.closest(IGNORE_SEL)) return true;
      if (el.closest('[data-testid="changed-files-card"]')) return true;
    }
    return false;
  }

  function resolveLang(cfg) {
    var lang = (cfg && cfg.i18n && cfg.i18n.language) || (cfg && cfg.language) || 'zh-CN';
    return String(lang).toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
  }

  function labelsForLang(lang) {
    if (lang === 'zh') {
      return {
        expand: '展开 Diff',
        collapse: '收起 Diff',
        refresh: '刷新',
        close: '收起',
        loading: '正在加载 Git Diff...',
        binary: '二进制文件暂不支持行内文本 Diff 预览。',
        clean: '工作区与暂存区暂无未提交变更。',
        truncated: '输出已达行数上限，已自动截断显示。',
        errorPrefix: '无法加载 Diff：'
      };
    }
    return {
      expand: 'Diff',
      collapse: 'Hide Diff',
      refresh: 'Refresh',
      close: 'Collapse',
      loading: 'Loading Git Diff...',
      binary: 'Binary file cannot be previewed inline.',
      clean: 'No uncommitted changes for this file.',
      truncated: 'Diff output truncated at line limit.',
      errorPrefix: 'Diff unavailable: '
    };
  }

  function extractFromFiber(el) {
    if (!el || typeof el !== 'object') return null;
    try {
      var keys = Object.keys(el);
      var fk = keys.find(function (k) {
        return k.indexOf('__reactFiber$') === 0 || k.indexOf('__reactInternalInstance$') === 0;
      });
      if (!fk) return null;
      var f = el[fk];
      for (var d = 0; d < 24 && f; d += 1, f = f.return) {
        var p = f.memoizedProps || {};
        if (p.fileDiff && typeof p.fileDiff.uri === 'string' && p.fileDiff.uri.trim()) {
          return p.fileDiff.uri.trim();
        }
        if (typeof p.uri === 'string' && p.uri.trim()) return p.uri.trim();
        var st = p.step && (p.step.args || p.step.result) ? p.step : p.step && p.step.step && p.step.step.value;
        if (st && st.args) {
          var cand = st.args.TargetFile || st.args.Path || st.args.path || st.args.filePath || st.args.uri;
          if (typeof cand === 'string' && cand.trim()) return cand.trim();
        }
      }
    } catch (_e) {}
    return null;
  }

  function extractFileTarget(itemEl, rowEl, cfg) {
    var nodes = [itemEl, rowEl];
    var filePath = '';
    var workspaceHint = (cfg && cfg.workspaceRoot) || '';

    for (var i = 0; i < nodes.length && !filePath; i += 1) {
      var n = nodes[i];
      if (!n) continue;
      filePath =
        getAttr(n, 'data-ag-diff-uri') ||
        getAttr(n, 'data-file-path') ||
        getAttr(n, 'data-path') ||
        getAttr(n, 'href') ||
        '';
      filePath = String(filePath || '').trim();
      if (!filePath) {
        var rawJson = getAttr(n, 'data-ag-diff-json');
        if (rawJson) {
          try {
            var parsed = JSON.parse(rawJson);
            if (parsed && typeof parsed === 'object') {
              filePath = String(parsed.uri || parsed.filePath || parsed.path || '').trim();
            }
          } catch (_e) {}
        }
      }
      if (!filePath && typeof n.querySelector === 'function') {
        var link = n.querySelector('a[href^="file://"], [data-ag-diff-uri], [data-file-path], [data-path]');
        if (link && !isIgnoredNode(link)) {
          filePath = String(
            getAttr(link, 'data-ag-diff-uri') ||
            getAttr(link, 'data-file-path') ||
            getAttr(link, 'data-path') ||
            getAttr(link, 'href') ||
            ''
          ).trim();
        }
      }
      if (!filePath) {
        filePath = extractFromFiber(n) || '';
      }
      if (!workspaceHint) {
        workspaceHint = String(
          getAttr(n, 'data-workspace-root') || getAttr(n, 'data-workspace-path') || ''
        ).trim();
      }
    }

    if (!workspaceHint && itemEl && typeof itemEl.closest === 'function') {
      var wsHost = itemEl.closest('[data-workspace-root], [data-workspace-path]');
      if (wsHost) {
        workspaceHint = String(
          getAttr(wsHost, 'data-workspace-root') || getAttr(wsHost, 'data-workspace-path') || ''
        ).trim();
      }
    }
    if (!workspaceHint && typeof window !== 'undefined' && window.__AG_STUDIO_WORKSPACE__) {
      workspaceHint = String(window.__AG_STUDIO_WORKSPACE__ || '').trim();
    }

    if (!filePath && itemEl && typeof itemEl.querySelector === 'function') {
      var pill = itemEl.querySelector('[data-testid="entity-pill"], .inline-pill');
      var pillTxt = pill ? String(pill.textContent || '').trim() : '';
      if (pillTxt && /[./\\]/.test(pillTxt)) {
        filePath = pillTxt;
      }
    }

    return { filePath: filePath, workspaceHint: workspaceHint };
  }

  function findHostRow(doc, itemEl) {
    if (!itemEl) return null;
    if (typeof itemEl.closest === 'function') {
      var explicit = itemEl.closest('[data-testid="tool-call-row"], [data-ag-tool-row="1"]');
      if (explicit && !isIgnoredNode(explicit)) return explicit;
    }
    var cur = itemEl;
    for (var i = 0; i < 8 && cur && cur.parentElement; i += 1) {
      var p = cur.parentElement;
      if (p === doc.body || p === doc.documentElement) break;
      var tid = getAttr(p, 'data-testid') || '';
      if (tid === 'conversation-view' || tid === 'autoscroll-viewport') {
        return cur;
      }
      var pTag = String(p.tagName || '').toUpperCase();
      if (pTag === 'DIV' && p.className && String(p.className).indexOf('flex-col') !== -1) {
        return cur;
      }
      cur = p;
    }
    return itemEl.parentElement && itemEl.parentElement !== doc.body ? itemEl.parentElement : itemEl;
  }

  function createInlineDiffController(options) {
    var opts = options || {};
    var doc = opts.doc || opts.document || (typeof document !== 'undefined' ? document : null);
    var currentCfg = opts.cfg || {};
    var currentApi = opts.api || null;
    var enabled = false;
    var destroyed = false;
    var observer = null;
    var scanTimer = 0;
    var activePanels = new Map();

    function getApi() {
      if (currentApi && typeof currentApi.getInlineDiff === 'function') return currentApi;
      if (typeof window !== 'undefined' && window.agStudioAPI && typeof window.agStudioAPI.getInlineDiff === 'function') {
        return window.agStudioAPI;
      }
      return null;
    }

    function mkEl(tag, className, text) {
      var el = doc.createElement(tag);
      if (className) el.className = className;
      if (text !== undefined && text !== null) el.textContent = String(text);
      return el;
    }

    function markOwned(el) {
      setAttr(el, 'data-ag-studio-ignore', 'true');
      setAttr(el, 'data-ag-no-i18n', 'true');
      return el;
    }

    function ensureStyle() {
      if (!doc || typeof doc.createElement !== 'function') return;
      var existing = typeof doc.getElementById === 'function' ? doc.getElementById(STYLE_ID) : null;
      if (existing) {
        if (existing.textContent !== INLINE_DIFF_CSS) existing.textContent = INLINE_DIFF_CSS;
        return;
      }
      var target = doc.head || doc.documentElement || doc.body;
      if (!target || typeof target.appendChild !== 'function') return;
      var s = markOwned(doc.createElement('style'));
      s.id = STYLE_ID;
      s.textContent = INLINE_DIFF_CSS;
      target.appendChild(s);
    }

    function removeStyle() {
      if (!doc || typeof doc.getElementById !== 'function') return;
      var existing = doc.getElementById(STYLE_ID);
      if (existing) removeNodeSafe(existing);
    }

    function cleanupDom() {
      if (!doc || typeof doc.querySelectorAll !== 'function') return;
      var pills = doc.querySelectorAll('.ags-inline-diff-pill');
      for (var i = 0; i < pills.length; i += 1) removeNodeSafe(pills[i]);
      var panels = doc.querySelectorAll('[' + PANEL_ATTR + '], .ags-inline-diff-panel');
      for (var j = 0; j < panels.length; j += 1) removeNodeSafe(panels[j]);
      var bound = doc.querySelectorAll('[' + BOUND_ATTR + ']');
      for (var k = 0; k < bound.length; k += 1) {
        if (typeof bound[k].removeAttribute === 'function') bound[k].removeAttribute(BOUND_ATTR);
      }
      activePanels.clear();
      removeStyle();
    }

    function disconnectObserver() {
      if (scanTimer) {
        clearTimeout(scanTimer);
        scanTimer = 0;
      }
      if (observer) {
        try { observer.disconnect(); } catch (_e) {}
        observer = null;
      }
    }

    function closePanel(rowEl, pillEl) {
      var entry = activePanels.get(rowEl);
      if (entry && entry.panel) {
        removeNodeSafe(entry.panel);
      }
      activePanels.delete(rowEl);
      if (pillEl) {
        var lbls = labelsForLang(resolveLang(currentCfg));
        pillEl.textContent = lbls.expand;
        setAttr(pillEl, 'aria-expanded', 'false');
      }
    }

    function renderPanelResult(panelEl, res, target, rowEl, pillEl) {
      while (panelEl.firstChild) panelEl.removeChild(panelEl.firstChild);
      var lbls = labelsForLang(resolveLang(currentCfg));

      var header = mkEl('div', 'ags-inline-diff-header');
      var meta = mkEl('div', 'ags-inline-diff-meta');
      var pathLabel = (res && res.relPath) || target.filePath || 'diff';
      meta.appendChild(mkEl('span', 'ags-inline-diff-path', pathLabel));

      if (res && res.ok) {
        var stats = mkEl('span', 'ags-inline-diff-stats');
        stats.appendChild(mkEl('span', 'ags-inline-diff-add-stat', '+' + String(res.additions || 0)));
        stats.appendChild(mkEl('span', 'ags-inline-diff-del-stat', '-' + String(res.deletions || 0)));
        meta.appendChild(stats);
        if (res.status) {
          meta.appendChild(mkEl('span', 'ags-inline-diff-status', res.status));
        }
      }

      var actions = mkEl('div', 'ags-inline-diff-actions');
      var refreshBtn = mkEl('button', 'ags-inline-diff-btn ags-inline-diff-refresh', lbls.refresh);
      refreshBtn.type = 'button';
      refreshBtn.addEventListener('click', function (ev) {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        loadPanelDiff(panelEl, target, rowEl, pillEl, true);
      });
      var closeBtn = mkEl('button', 'ags-inline-diff-btn ags-inline-diff-close', lbls.close);
      closeBtn.type = 'button';
      closeBtn.addEventListener('click', function (ev) {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        closePanel(rowEl, pillEl);
      });
      actions.appendChild(refreshBtn);
      actions.appendChild(closeBtn);

      header.appendChild(meta);
      header.appendChild(actions);
      panelEl.appendChild(header);

      var body = mkEl('div', 'ags-inline-diff-body');
      if (!res || !res.ok) {
        var errCode = (res && res.error) || 'unavailable';
        body.appendChild(mkEl('div', 'ags-inline-diff-msg', lbls.errorPrefix + errCode));
        panelEl.appendChild(body);
        return;
      }

      if (res.binary) {
        body.appendChild(mkEl('div', 'ags-inline-diff-msg', lbls.binary));
        panelEl.appendChild(body);
        return;
      }

      var hunks = Array.isArray(res.hunks) ? res.hunks : [];
      if (!hunks.length) {
        body.appendChild(mkEl('div', 'ags-inline-diff-msg', lbls.clean));
        panelEl.appendChild(body);
        return;
      }

      for (var i = 0; i < hunks.length; i += 1) {
        var h = hunks[i];
        if (!h) continue;
        if (h.header) {
          body.appendChild(mkEl('div', 'ags-inline-diff-hunk', h.header));
        }
        var rows = Array.isArray(h.rows) ? h.rows : [];
        for (var j = 0; j < rows.length; j += 1) {
          var r = rows[j];
          if (!r) continue;
          var kind = r.kind === 'add' || r.kind === 'del' ? r.kind : 'ctx';
          var rowNode = mkEl('div', 'ags-inline-diff-row is-' + kind);
          rowNode.appendChild(mkEl('span', 'ags-inline-diff-ln', r.oldLn == null ? '' : String(r.oldLn)));
          rowNode.appendChild(mkEl('span', 'ags-inline-diff-ln', r.newLn == null ? '' : String(r.newLn)));
          rowNode.appendChild(mkEl('span', 'ags-inline-diff-sign', r.sign || ' '));
          rowNode.appendChild(mkEl('span', 'ags-inline-diff-code', r.text || ''));
          body.appendChild(rowNode);
        }
      }

      panelEl.appendChild(body);
      if (res.truncated) {
        panelEl.appendChild(mkEl('div', 'ags-inline-diff-truncated', lbls.truncated));
      }
    }

    function loadPanelDiff(panelEl, target, rowEl, pillEl, noCache) {
      var lbls = labelsForLang(resolveLang(currentCfg));
      while (panelEl.firstChild) panelEl.removeChild(panelEl.firstChild);
      panelEl.appendChild(mkEl('div', 'ags-inline-diff-msg', lbls.loading));

      var api = getApi();
      if (!api) {
        renderPanelResult(panelEl, { ok: false, error: 'api_unavailable' }, target, rowEl, pillEl);
        return Promise.resolve();
      }
      var reqId = (panelEl._agsReqSeq = (panelEl._agsReqSeq || 0) + 1);
      return Promise.resolve()
        .then(function () {
          return api.getInlineDiff({
            filePath: target.filePath,
            workspaceHint: target.workspaceHint || undefined,
            noCache: Boolean(noCache)
          });
        })
        .then(function (res) {
          if (destroyed || !enabled || panelEl._agsReqSeq !== reqId || panelEl.isConnected === false) return;
          renderPanelResult(panelEl, res, target, rowEl, pillEl);
        })
        .catch(function (err) {
          if (destroyed || !enabled || panelEl._agsReqSeq !== reqId || panelEl.isConnected === false) return;
          renderPanelResult(
            panelEl,
            { ok: false, error: (err && err.message) || 'rpc_error' },
            target,
            rowEl,
            pillEl
          );
        });
    }

    function togglePanel(itemEl, rowEl, pillEl) {
      if (destroyed || !enabled || !doc || !rowEl || !rowEl.parentNode) return;
      if (activePanels.has(rowEl)) {
        closePanel(rowEl, pillEl);
        return;
      }
      var target = extractFileTarget(itemEl, rowEl, currentCfg);
      if (!target.filePath) return;

      var panelEl = markOwned(mkEl('div', 'ags-inline-diff-panel'));
      setAttr(panelEl, PANEL_ATTR, '1');
      activePanels.set(rowEl, { panel: panelEl, pill: pillEl });

      var lbls = labelsForLang(resolveLang(currentCfg));
      pillEl.textContent = lbls.collapse;
      setAttr(pillEl, 'aria-expanded', 'true');

      rowEl.parentNode.insertBefore(panelEl, rowEl.nextSibling || null);
      loadPanelDiff(panelEl, target, rowEl, pillEl, false);
    }

    function attachPillToItem(itemEl) {
      if (!itemEl || isIgnoredNode(itemEl)) return;
      if (getAttr(itemEl, BOUND_ATTR) === '1') return;

      var rowEl = findHostRow(doc, itemEl);
      if (!rowEl || isIgnoredNode(rowEl)) return;
      if (typeof rowEl.querySelector === 'function' && rowEl.querySelector('.ags-inline-diff-pill')) {
        setAttr(itemEl, BOUND_ATTR, '1');
        return;
      }

      var target = extractFileTarget(itemEl, rowEl, currentCfg);
      if (!target.filePath) return;

      setAttr(itemEl, BOUND_ATTR, '1');
      var lbls = labelsForLang(resolveLang(currentCfg));
      var pill = markOwned(mkEl('button', 'ags-inline-diff-pill', lbls.expand));
      pill.type = 'button';
      setAttr(pill, 'aria-expanded', 'false');
      pill.addEventListener('click', function (ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        if (ev && ev.stopPropagation) ev.stopPropagation();
        togglePanel(itemEl, rowEl, pill);
      });

      if (itemEl.tagName === 'A' && itemEl.parentNode) {
        itemEl.parentNode.insertBefore(pill, itemEl.nextSibling || null);
      } else if (typeof itemEl.appendChild === 'function') {
        itemEl.appendChild(pill);
      }
    }

    function scan() {
      if (destroyed || !enabled || !doc || typeof doc.querySelectorAll !== 'function') return;
      var scopes = doc.querySelectorAll(CONV_SCOPE_SEL);
      var roots = scopes && scopes.length ? scopes : [doc];
      var seen = typeof Set === 'function' ? new Set() : null;

      for (var s = 0; s < roots.length; s += 1) {
        var rootNode = roots[s];
        if (!rootNode || isIgnoredNode(rootNode) || typeof rootNode.querySelectorAll !== 'function') continue;
        var items = rootNode.querySelectorAll(FILE_ITEM_SEL);
        for (var i = 0; i < items.length; i += 1) {
          var item = items[i];
          if (seen) {
            if (seen.has(item)) continue;
            seen.add(item);
          }
          attachPillToItem(item);
        }
      }
    }

    function scheduleScan() {
      if (destroyed || !enabled || scanTimer) return;
      scanTimer = setTimeout(function () {
        scanTimer = 0;
        if (!destroyed && enabled) scan();
      }, 40);
    }

    function ensureObserver() {
      if (observer || destroyed || !enabled || !doc) return;
      if (typeof MutationObserver !== 'function') return;
      var target = doc.body || doc.documentElement;
      if (!target) return;
      observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i += 1) {
          var m = mutations[i];
          if (m.target && !isIgnoredNode(m.target)) {
            scheduleScan();
            return;
          }
        }
      });
      observer.observe(target, { childList: true, subtree: true });
    }

    function updateExistingPillLabels() {
      if (!doc || typeof doc.querySelectorAll !== 'function') return;
      var lbls = labelsForLang(resolveLang(currentCfg));
      var pills = doc.querySelectorAll('.ags-inline-diff-pill');
      for (var i = 0; i < pills.length; i += 1) {
        var p = pills[i];
        p.textContent = getAttr(p, 'aria-expanded') === 'true' ? lbls.collapse : lbls.expand;
      }
    }

    function sync(cfg, api) {
      if (destroyed) return;
      if (cfg && typeof cfg === 'object') currentCfg = cfg;
      if (api) currentApi = api;

      var nextEnabled = !(currentCfg && currentCfg.fx && currentCfg.fx.inlineDiff === false);
      if (!nextEnabled) {
        enabled = false;
        disconnectObserver();
        cleanupDom();
        return;
      }

      enabled = true;
      ensureStyle();
      ensureObserver();
      updateExistingPillLabels();
      scan();
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      enabled = false;
      disconnectObserver();
      cleanupDom();
    }

    return {
      sync: sync,
      destroy: destroy
    };
  }

  var exported = {
    createInlineDiffController: createInlineDiffController
  };

  if (typeof window !== 'undefined') {
    window.__AG_STUDIO_INLINE_DIFF__ = exported;
  }
  if (globalScope && globalScope !== (typeof window !== 'undefined' ? window : null)) {
    globalScope.__AG_STUDIO_INLINE_DIFF__ = exported;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
})(typeof window !== 'undefined' ? window : globalThis);


(function (globalScope) {
  'use strict';

  var STYLE_ID = 'ag-studio-gemini-web-style';
  var PARTITION_NAME = 'persist:ag-studio-gemini-web';
  var DEFAULT_URL = 'https://gemini.google.com/app';

  var PRESET_SITES = [
    { id: 'gemini', label: 'Gemini', name: 'Gemini 网页版', url: 'https://gemini.google.com/app' },
    { id: 'aistudio', label: 'AI Studio', name: 'Google AI Studio', url: 'https://aistudio.google.com' },
    { id: 'chatgpt', label: 'ChatGPT', name: 'ChatGPT', url: 'https://chatgpt.com' },
    { id: 'claude', label: 'Claude', name: 'Claude', url: 'https://claude.ai' },
    { id: 'deepseek', label: 'DeepSeek', name: 'DeepSeek', url: 'https://chat.deepseek.com' }
  ];

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function sanitizeWebUrl(raw) {
    var input = String(raw || '').trim();
    if (!input) return DEFAULT_URL;
    try {
      var u = new URL(input);
      if (u.protocol === 'https:') {
        return u.toString();
      }
      if (u.protocol === 'http:') {
        var host = String(u.hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
          return u.toString();
        }
      }
    } catch (_e) {}
    return DEFAULT_URL;
  }

  function matchSiteByUrl(url) {
    var safe = sanitizeWebUrl(url);
    try {
      var host = new URL(safe).hostname.toLowerCase();
      for (var i = 0; i < PRESET_SITES.length; i++) {
        var sh = new URL(PRESET_SITES[i].url).hostname.toLowerCase();
        if (host === sh || host.endsWith('.' + sh)) {
          return PRESET_SITES[i];
        }
      }
    } catch (_e) {}
    return { id: 'custom', label: 'Web AI', name: '自定义网页 AI', url: safe };
  }

  function formatHostLabel(url) {
    try {
      return new URL(sanitizeWebUrl(url)).hostname;
    } catch (_e) {
      return 'gemini.google.com';
    }
  }

  function markOwned(el) {
    if (!el || typeof el.setAttribute !== 'function') return el;
    el.setAttribute('data-ag-studio-ignore', 'true');
    el.setAttribute('data-ag-no-i18n', 'true');
    el.setAttribute('translate', 'no');
    return el;
  }

  function makeIconSvg(doc, paths, size) {
    if (!doc) return null;
    if (typeof doc.createElementNS !== 'function') {
      return typeof doc.createElement === 'function' ? doc.createElement('span') : null;
    }
    try {
      var svg = doc.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', String(size || 13));
      svg.setAttribute('height', String(size || 13));
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < paths.length; i++) {
        var p = doc.createElementNS(SVG_NS, 'path');
        p.setAttribute('d', paths[i]);
        svg.appendChild(p);
      }
      return svg;
    } catch (_e) {
      var sp = doc.createElement('span');
      return sp;
    }
  }

  function buildStyles() {
    return [
      '.ags-gw-native-hidden{display:none!important}',
      '.ags-gw-dock{padding:4px 8px 6px;flex-shrink:0;box-sizing:border-box;user-select:none}',
      '.ags-gw-seg{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));padding:3px;border-radius:999px;background:var(--ags-bg-subtle,rgba(148,163,184,0.14));border:1px solid var(--ags-border,rgba(148,163,184,0.22));box-sizing:border-box}',
      '.ags-gw-slider{position:absolute;top:3px;bottom:3px;left:3px;width:calc(50% - 3px);border-radius:999px;background:var(--ags-bg-surface,#FFFFFF);box-shadow:0 1px 4px rgba(0,0,0,0.16),inset 0 1px 0 rgba(255,255,255,0.08);transform:translate3d(0,0,0);transition:transform 260ms cubic-bezier(.22,1,.36,1);pointer-events:none;z-index:0}',
      '.ags-gw-seg[data-mode="gemini"] .ags-gw-slider{transform:translate3d(100%,0,0)}',
      '.ags-gw-mode-btn{position:relative;z-index:1;appearance:none;border:none;background:transparent;color:var(--ags-text-secondary,#6E6B64);height:25px;padding:0 8px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;gap:5px;font-size:11.5px;font-weight:500;font-family:var(--ags-font-ui,system-ui,sans-serif);cursor:pointer;white-space:nowrap;transition:color 160ms ease,transform 140ms ease}',
      '.ags-gw-mode-btn:hover,.ags-gw-mode-btn[data-active="1"]{color:var(--ags-text-primary,#1F1E1D);font-weight:600}',
      '.ags-gw-mode-btn:active{transform:scale(0.95)}',
      '.ags-gw-dot{position:absolute;top:4px;right:7px;width:7px;height:7px;border-radius:999px;display:none;pointer-events:none}',
      '.ags-gw-dot[data-status="running"]{display:block;background:#3B82F6;box-shadow:0 0 8px rgba(59,130,246,0.75);animation:ags-gw-pulse 1.8s ease-in-out infinite}',
      '.ags-gw-dot[data-status="blocked"]{display:block;background:#F59E0B;box-shadow:0 0 8px rgba(245,158,11,0.85);animation:ags-gw-pulse 1.3s ease-in-out infinite}',
      '@keyframes ags-gw-pulse{0%,100%{opacity:.72;transform:scale(1)}50%{opacity:1;transform:scale(1.22)}}',
      '.ags-gw-sidebar-pane{flex:1 1 0;min-height:0;display:flex;flex-direction:column;gap:10px;padding:8px 10px 10px;box-sizing:border-box;overflow-y:auto;color:var(--ags-text-primary,#1F1E1D);font-family:var(--ags-font-ui,system-ui,sans-serif);user-select:none}',
      '.ags-gw-sidebar-pane[data-active="0"]{display:none}',
      '.ags-gw-sb-card{display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:10px;background:var(--ags-bg-surface,#FFFFFF);border:1px solid var(--ags-border,#E6E2D8)}',
      '.ags-gw-sb-head{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:11.5px;font-weight:600;color:var(--ags-text-primary,#1F1E1D)}',
      '.ags-gw-sb-badge{font-size:10px;padding:2px 6px;border-radius:999px;background:var(--ags-accent-soft,rgba(59,108,246,0.14));color:var(--ags-accent,#3B6CF6);font-weight:600;white-space:nowrap}',
      '.ags-gw-sb-sub{font-size:11px;line-height:1.45;color:var(--ags-text-secondary,#6E6B64)}',
      '.ags-gw-site-list{display:flex;flex-direction:column;gap:4px}',
      '.ags-gw-site-btn{appearance:none;width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 9px;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--ags-text-secondary,#6E6B64);font-size:12px;font-family:inherit;cursor:pointer;text-align:left;transition:background-color 140ms ease,color 140ms ease,border-color 140ms ease}',
      '.ags-gw-site-btn:hover{background:var(--ags-bg-subtle,rgba(148,163,184,0.12));color:var(--ags-text-primary,#1F1E1D)}',
      '.ags-gw-site-btn[data-active="1"]{background:var(--ags-accent-soft,rgba(59,108,246,0.14));border-color:var(--ags-accent,#3B6CF6);color:var(--ags-accent,#3B6CF6);font-weight:600}',
      '.ags-gw-sb-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
      '.ags-gw-sb-act-btn{appearance:none;padding:6px 8px;border-radius:8px;border:1px solid var(--ags-border,#E6E2D8);background:var(--ags-bg-canvas,#FAF9F5);color:var(--ags-text-primary,#1F1E1D);font-size:11.5px;font-family:inherit;cursor:pointer;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ags-gw-sb-act-btn:hover{border-color:var(--ags-accent,#3B6CF6);color:var(--ags-accent,#3B6CF6)}',
      '.ags-gw-sb-act-btn.primary{background:var(--ags-accent,#3B6CF6);border-color:var(--ags-accent,#3B6CF6);color:#FFFFFF;font-weight:600;grid-column:1 / -1}',
      '.ags-gw-sb-act-btn.primary:hover{filter:brightness(1.06);color:#FFFFFF}',
      '.ags-gw-stage{position:absolute;inset:0;z-index:45;display:flex;flex-direction:column;background:var(--ags-bg-canvas,#FAF9F5);color:var(--ags-text-primary,#1F1E1D);font-family:var(--ags-font-ui,system-ui,sans-serif);box-sizing:border-box;overflow:hidden}',
      '.ags-gw-stage[data-active="0"]{visibility:hidden;opacity:0;pointer-events:none;z-index:-1}',
      '.ags-gw-toolbar{height:38px;min-height:38px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 12px;background:var(--ags-bg-sidebar,#F4F1EA);border-bottom:1px solid var(--ags-border,#E6E2D8);box-sizing:border-box;-webkit-app-region:drag;user-select:none}',
      '.ags-gw-toolbar[data-top-clearance="1"]{padding-right:148px}',
      '.ags-gw-tb-group{display:flex;align-items:center;gap:5px;-webkit-app-region:no-drag;min-width:0}',
      '.ags-gw-tb-btn{appearance:none;height:25px;padding:0 8px;border-radius:7px;border:1px solid var(--ags-border,#E6E2D8);background:var(--ags-bg-surface,#FFFFFF);color:var(--ags-text-primary,#1F1E1D);font-size:11.5px;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:4px;cursor:pointer;white-space:nowrap}',
      '.ags-gw-tb-btn:hover{border-color:var(--ags-accent,#3B6CF6);color:var(--ags-accent,#3B6CF6)}',
      '.ags-gw-tb-btn[data-active="1"]{background:var(--ags-accent-soft,rgba(59,108,246,0.14));border-color:var(--ags-accent,#3B6CF6);color:var(--ags-accent,#3B6CF6);font-weight:600}',
      '.ags-gw-tb-status{font-size:11.5px;color:var(--ags-text-secondary,#6E6B64);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px}',
      '.ags-gw-progress{height:2px;width:100%;background:transparent;position:relative;overflow:hidden;flex-shrink:0}',
      '.ags-gw-progress[data-loading="1"]::after{content:"";position:absolute;inset:0;width:36%;background:var(--ags-accent,#3B6CF6);animation:ags-gw-load 1.1s ease-in-out infinite}',
      '@keyframes ags-gw-load{0%{transform:translateX(-110%)}100%{transform:translateX(300%)}}',
      '.ags-gw-view-wrap{position:relative;flex:1 1 0;min-height:0;width:100%;display:flex;background:var(--ags-bg-canvas,#FAF9F5)}',
      '.ags-gw-webview{width:100%;height:100%;flex:1 1 auto;border:none;display:flex;background:#FFFFFF}',
      '.ags-gw-error{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:24px;background:var(--ags-bg-canvas,#FAF9F5);z-index:5}',
      '.ags-gw-error[data-visible="1"]{display:flex}',
      '.ags-gw-error-card{max-width:440px;width:100%;padding:18px 20px;border-radius:14px;background:var(--ags-bg-surface,#FFFFFF);border:1px solid var(--ags-border,#E6E2D8);box-shadow:var(--ags-shadow,0 12px 32px rgba(0,0,0,0.22));display:flex;flex-direction:column;gap:10px}',
      '.ags-gw-error-title{font-size:14px;font-weight:600;color:var(--ags-text-primary,#1F1E1D)}',
      '.ags-gw-error-desc{font-size:12px;line-height:1.55;color:var(--ags-text-secondary,#6E6B64);word-break:break-word}',
      '.ags-gw-error-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}'
    ].join('\n');
  }

  function resolveSidebarSlots(doc) {
    if (!doc || typeof doc.querySelector !== 'function') return null;
    var split = doc.querySelector('[data-testid="sidebar-split"]');
    var nav = null;
    var rightPane = null;

    if (split && split.children && split.children.length >= 2) {
      nav = split.children[0];
      rightPane = split.children[split.children.length - 1];
    } else if (split && split.children && split.children.length === 1) {
      nav = split.children[0];
    } else {
      nav = doc.querySelector('nav');
    }

    if (!nav) return null;

    if (!rightPane || rightPane === nav) {
      var conv = doc.querySelector('[data-testid="conversation-view"]');
      var home = doc.querySelector('.agy-home');
      rightPane =
        doc.querySelector('main') ||
        (conv && conv.parentElement !== nav ? conv.parentElement : null) ||
        (home && home.parentElement !== nav ? home.parentElement : null) ||
        null;
    }

    var rawChildren = [];
    var navChildren = nav.children || [];
    for (var i = 0; i < navChildren.length; i++) {
      var ch = navChildren[i];
      if (!ch) continue;
      if (ch.getAttribute && ch.getAttribute('data-ag-studio-ignore') === 'true') continue;
      rawChildren.push(ch);
    }

    var headerSlot = null;
    var codeBodySlots = [];
    if (rawChildren.length >= 3) {
      var first = rawChildren[0];
      var hasRows = first && first.querySelector && first.querySelector('[data-testid="conversation-row-sidebar"], a[href^="/c/"]');
      if (!hasRows) {
        headerSlot = first;
        var endIdx = rawChildren.length;
        var last = rawChildren[endIdx - 1];
        if (last && last !== first && last.getBoundingClientRect) {
          var lr = last.getBoundingClientRect();
          if (lr && lr.height > 0 && lr.height <= 80 && !(last.querySelector && last.querySelector('[data-testid="conversation-row-sidebar"]'))) {
            endIdx -= 1;
          }
        }
        codeBodySlots = rawChildren.slice(1, endIdx);
      } else {
        codeBodySlots = rawChildren;
      }
    } else {
      codeBodySlots = rawChildren;
    }

    return {
      split: split,
      nav: nav,
      rightPane: rightPane,
      headerSlot: headerSlot,
      codeBodySlots: codeBodySlots
    };
  }

  function createGeminiWebController(options) {
    var opts = options || {};
    var getDoc = typeof opts.getDocument === 'function'
      ? opts.getDocument
      : function () { return typeof document !== 'undefined' ? document : null; };

    var mode = 'code'; // 'code' | 'gemini'
    var destroyed = false;
    var enabled = true;
    var currentCfg = {};
    var currentApi = opts.api || null;
    var currentUrl = DEFAULT_URL;
    var lastStatus = { isGenerating: false, awaitingDecision: false };
    var onOpenSettingsCb = typeof opts.onOpenSettings === 'function' ? opts.onOpenSettings : null;

    var navEl = null;
    var rightPaneEl = null;
    var dockEl = null;
    var segEl = null;
    var codeBtnEl = null;
    var geminiBtnEl = null;
    var dotEl = null;
    var sidebarPaneEl = null;
    var stageEl = null;
    var toolbarEl = null;
    var statusTextEl = null;
    var progressEl = null;
    var viewWrapEl = null;
    var webviewEl = null;
    var errorOverlayEl = null;
    var errorDescEl = null;
    var hiddenNodes = [];
    var siteButtons = [];
    var toolbarSiteButtons = [];
    var observer = null;
    var syncTimer = 0;

    function ensureStyle(doc) {
      if (!doc || typeof doc.createElement !== 'function') return;
      var existing = typeof doc.getElementById === 'function' ? doc.getElementById(STYLE_ID) : null;
      if (existing) return;
      var target = doc.head || doc.documentElement || doc.body;
      if (!target || typeof target.appendChild !== 'function') return;
      var style = markOwned(doc.createElement('style'));
      style.id = STYLE_ID;
      style.textContent = buildStyles();
      target.appendChild(style);
    }

    function removeStyle(doc) {
      if (!doc || typeof doc.getElementById !== 'function') return;
      var existing = doc.getElementById(STYLE_ID);
      if (existing && typeof existing.remove === 'function') existing.remove();
      else if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    }

    function restoreCodeSidebar() {
      for (var i = 0; i < hiddenNodes.length; i++) {
        var n = hiddenNodes[i];
        if (n && n.classList) n.classList.remove('ags-gw-native-hidden');
      }
      hiddenNodes = [];
    }

    function updateActiveSiteUi() {
      var activeSite = matchSiteByUrl(currentUrl);
      for (var i = 0; i < siteButtons.length; i++) {
        var b = siteButtons[i];
        var sid = b.getAttribute('data-site-id');
        b.setAttribute('data-active', sid === activeSite.id ? '1' : '0');
      }
      for (var j = 0; j < toolbarSiteButtons.length; j++) {
        var tb = toolbarSiteButtons[j];
        var tsid = tb.getAttribute('data-site-id');
        tb.setAttribute('data-active', tsid === activeSite.id ? '1' : '0');
      }
      if (statusTextEl && (!webviewEl || !webviewEl._hasCustomTitle)) {
        statusTextEl.textContent = activeSite.label + ' · ' + formatHostLabel(currentUrl) + '（网页独立额度）';
      }
    }

    function showErrorOverlay(code, desc) {
      if (!errorOverlayEl || !errorDescEl) return;
      var hint = '';
      if (code === -118 || code === -105 || code === -130 || code === -102 || code === -106) {
        hint = '（请确认本地代理已开启且端口正确，例如 http://127.0.0.1:7897）';
      }
      errorDescEl.textContent = '无法加载 ' + formatHostLabel(currentUrl) + '（错误码 ' + code + (desc ? ': ' + desc : '') + '）' + hint;
      errorOverlayEl.setAttribute('data-visible', '1');
    }

    function hideErrorOverlay() {
      if (errorOverlayEl) errorOverlayEl.setAttribute('data-visible', '0');
    }

    function navigateToUrl(nextUrl) {
      currentUrl = sanitizeWebUrl(nextUrl);
      hideErrorOverlay();
      if (webviewEl) {
        webviewEl._hasCustomTitle = false;
        if (typeof webviewEl.loadURL === 'function') {
          try { webviewEl.loadURL(currentUrl); } catch (_e) { webviewEl.setAttribute('src', currentUrl); }
        } else {
          webviewEl.setAttribute('src', currentUrl);
        }
      }
      updateActiveSiteUi();
    }

    function ensureWebview(doc) {
      if (webviewEl && webviewEl.parentNode === viewWrapEl) return webviewEl;
      if (!viewWrapEl || !doc) return null;
      var wv = markOwned(doc.createElement('webview'));
      wv.className = 'ags-gw-webview';
      wv.setAttribute('partition', PARTITION_NAME);
      wv.setAttribute('allowpopups', 'true');
      wv.setAttribute('src', sanitizeWebUrl(currentUrl));
      wv.style.width = '100%';
      wv.style.height = '100%';
      wv.style.flex = '1';
      wv.style.border = 'none';
      wv.style.display = 'flex';

      wv.addEventListener('did-start-loading', function () {
        hideErrorOverlay();
        if (progressEl) progressEl.setAttribute('data-loading', '1');
      });
      wv.addEventListener('did-stop-loading', function () {
        if (progressEl) progressEl.setAttribute('data-loading', '0');
      });
      wv.addEventListener('did-navigate', function (e) {
        if (e && e.url) {
          currentUrl = sanitizeWebUrl(e.url);
          updateActiveSiteUi();
        }
      });
      wv.addEventListener('did-navigate-in-page', function (e) {
        if (e && e.isMainFrame !== false && e.url) {
          currentUrl = sanitizeWebUrl(e.url);
          updateActiveSiteUi();
        }
      });
      wv.addEventListener('page-title-updated', function (e) {
        if (e && e.title && statusTextEl) {
          wv._hasCustomTitle = true;
          statusTextEl.textContent = String(e.title).slice(0, 48) + '（网页独立额度）';
        }
      });
      wv.addEventListener('did-fail-load', function (e) {
        if (progressEl) progressEl.setAttribute('data-loading', '0');
        if (!e || e.errorCode === -3 || e.isMainFrame === false) return;
        showErrorOverlay(e.errorCode, e.errorDescription || '');
      });

      viewWrapEl.appendChild(wv);
      webviewEl = wv;
      return wv;
    }

    function ensureDockAndSidebar(doc, slots) {
      var nav = slots.nav;
      navEl = nav;

      if (!dockEl || dockEl.parentElement !== nav) {
        if (dockEl && dockEl.parentNode) dockEl.parentNode.removeChild(dockEl);
        dockEl = markOwned(doc.createElement('div'));
        dockEl.className = 'ags-gw-dock';
        dockEl.setAttribute('data-testid', 'ags-gemini-mode-dock');

        segEl = doc.createElement('div');
        segEl.className = 'ags-gw-seg';
        segEl.setAttribute('role', 'tablist');
        segEl.setAttribute('data-mode', mode);

        var slider = doc.createElement('span');
        slider.className = 'ags-gw-slider';
        segEl.appendChild(slider);

        codeBtnEl = doc.createElement('button');
        codeBtnEl.type = 'button';
        codeBtnEl.className = 'ags-gw-mode-btn';
        codeBtnEl.setAttribute('data-mode-btn', 'code');
        var codeIcon = makeIconSvg(doc, ['M8 6L2 12L8 18', 'M16 6L22 12L16 18', 'M13.5 4.5L10.5 19.5'], 12);
        if (codeIcon) codeBtnEl.appendChild(codeIcon);
        var codeLabel = doc.createElement('span');
        codeLabel.textContent = 'Code';
        codeBtnEl.appendChild(codeLabel);
        dotEl = doc.createElement('span');
        dotEl.className = 'ags-gw-dot';
        codeBtnEl.appendChild(dotEl);
        codeBtnEl.addEventListener('click', function () {
          setMode('code');
        });

        geminiBtnEl = doc.createElement('button');
        geminiBtnEl.type = 'button';
        geminiBtnEl.className = 'ags-gw-mode-btn';
        geminiBtnEl.setAttribute('data-mode-btn', 'gemini');
        var gemIcon = makeIconSvg(doc, ['M12 3L14.2 9.8L21 12L14.2 14.2L12 21L9.8 14.2L3 12L9.8 9.8Z'], 12);
        if (gemIcon) geminiBtnEl.appendChild(gemIcon);
        var gemLabel = doc.createElement('span');
        gemLabel.textContent = 'Gemini';
        geminiBtnEl.appendChild(gemLabel);
        geminiBtnEl.addEventListener('click', function () {
          setMode('gemini');
        });

        segEl.appendChild(codeBtnEl);
        segEl.appendChild(geminiBtnEl);
        dockEl.appendChild(segEl);

        var refNode = slots.headerSlot ? slots.headerSlot.nextSibling : nav.firstChild;
        if (refNode && refNode.parentNode === nav) {
          nav.insertBefore(dockEl, refNode);
        } else {
          nav.appendChild(dockEl);
        }
      }

      if (!sidebarPaneEl || sidebarPaneEl.parentElement !== nav) {
        if (sidebarPaneEl && sidebarPaneEl.parentNode) sidebarPaneEl.parentNode.removeChild(sidebarPaneEl);
        sidebarPaneEl = markOwned(doc.createElement('div'));
        sidebarPaneEl.className = 'ags-gw-sidebar-pane';
        sidebarPaneEl.setAttribute('data-active', mode === 'gemini' ? '1' : '0');

        var cardSites = doc.createElement('div');
        cardSites.className = 'ags-gw-sb-card';
        var head = doc.createElement('div');
        head.className = 'ags-gw-sb-head';
        var titleSpan = doc.createElement('span');
        titleSpan.textContent = '网页对话工作台';
        var badgeSpan = doc.createElement('span');
        badgeSpan.className = 'ags-gw-sb-badge';
        badgeSpan.textContent = '独立额度';
        head.appendChild(titleSpan);
        head.appendChild(badgeSpan);
        cardSites.appendChild(head);

        var desc = doc.createElement('div');
        desc.className = 'ags-gw-sb-sub';
        desc.textContent = '直接使用网页版自身额度与历史记录，不消耗 Antigravity 客户端配额。';
        cardSites.appendChild(desc);

        var siteList = doc.createElement('div');
        siteList.className = 'ags-gw-site-list';
        siteButtons = [];
        for (var i = 0; i < PRESET_SITES.length; i++) {
          (function (site) {
            var btn = doc.createElement('button');
            btn.type = 'button';
            btn.className = 'ags-gw-site-btn';
            btn.setAttribute('data-site-id', site.id);
            var nm = doc.createElement('span');
            nm.textContent = site.name;
            var hostTag = doc.createElement('span');
            hostTag.style.fontSize = '10px';
            hostTag.style.opacity = '0.72';
            hostTag.textContent = formatHostLabel(site.url);
            btn.appendChild(nm);
            btn.appendChild(hostTag);
            btn.addEventListener('click', function () {
              navigateToUrl(site.url);
            });
            siteList.appendChild(btn);
            siteButtons.push(btn);
          })(PRESET_SITES[i]);
        }
        cardSites.appendChild(siteList);
        sidebarPaneEl.appendChild(cardSites);

        var cardActs = doc.createElement('div');
        cardActs.className = 'ags-gw-sb-card';
        var actGrid = doc.createElement('div');
        actGrid.className = 'ags-gw-sb-actions';

        var newChatBtn = doc.createElement('button');
        newChatBtn.type = 'button';
        newChatBtn.className = 'ags-gw-sb-act-btn primary';
        newChatBtn.textContent = '+ 新建网页对话';
        newChatBtn.addEventListener('click', function () {
          var site = matchSiteByUrl(currentUrl);
          navigateToUrl(site.url || DEFAULT_URL);
        });

        var reloadBtn = doc.createElement('button');
        reloadBtn.type = 'button';
        reloadBtn.className = 'ags-gw-sb-act-btn';
        reloadBtn.textContent = '刷新页面';
        reloadBtn.addEventListener('click', function () {
          if (webviewEl && typeof webviewEl.reload === 'function') {
            webviewEl.reload();
          } else {
            navigateToUrl(currentUrl);
          }
        });

        var extBtn = doc.createElement('button');
        extBtn.type = 'button';
        extBtn.className = 'ags-gw-sb-act-btn';
        extBtn.textContent = '外部浏览器打开';
        extBtn.addEventListener('click', function () {
          openCurrentExternal();
        });

        var clearBtn = doc.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'ags-gw-sb-act-btn';
        clearBtn.textContent = '清除登录态';
        clearBtn.addEventListener('click', function () {
          clearWebSession();
        });

        var cfgBtn = doc.createElement('button');
        cfgBtn.type = 'button';
        cfgBtn.className = 'ags-gw-sb-act-btn';
        cfgBtn.textContent = '代理设置';
        cfgBtn.addEventListener('click', function () {
          if (typeof onOpenSettingsCb === 'function') onOpenSettingsCb();
        });

        actGrid.appendChild(newChatBtn);
        actGrid.appendChild(reloadBtn);
        actGrid.appendChild(extBtn);
        actGrid.appendChild(clearBtn);
        actGrid.appendChild(cfgBtn);
        cardActs.appendChild(actGrid);

        var proxyNote = doc.createElement('div');
        proxyNote.className = 'ags-gw-sb-sub';
        proxyNote.setAttribute('data-ags-proxy-note', '1');
        var proxyOn = Boolean(currentCfg && currentCfg.proxy && currentCfg.proxy.enabled);
        proxyNote.textContent = proxyOn
          ? ('网络：已启用 Studio 代理 (' + (currentCfg.proxy.proxyUrl || '') + ')')
          : '网络：直连或系统代理（若无法访问可在「设置」启用本地代理）';
        cardActs.appendChild(proxyNote);
        sidebarPaneEl.appendChild(cardActs);

        var dockIdx = Array.prototype.indexOf.call(nav.children || [], dockEl);
        if (dockIdx >= 0 && nav.children[dockIdx + 1]) {
          nav.insertBefore(sidebarPaneEl, nav.children[dockIdx + 1]);
        } else {
          nav.appendChild(sidebarPaneEl);
        }
      } else {
        var noteEl = sidebarPaneEl.querySelector && sidebarPaneEl.querySelector('[data-ags-proxy-note="1"]');
        if (noteEl) {
          var pOn = Boolean(currentCfg && currentCfg.proxy && currentCfg.proxy.enabled);
          noteEl.textContent = pOn
            ? ('网络：已启用 Studio 代理 (' + (currentCfg.proxy.proxyUrl || '') + ')')
            : '网络：直连或系统代理（若无法访问可在「设置」启用本地代理）';
        }
      }
    }

    function ensureStage(doc, rightPane) {
      if (!rightPane) return;
      rightPaneEl = rightPane;
      if (typeof getComputedStyle === 'function') {
        try {
          var pos = getComputedStyle(rightPane).position;
          if (!pos || pos === 'static') {
            rightPane.style.position = 'relative';
          }
        } catch (_e) {
          if (!rightPane.style.position) rightPane.style.position = 'relative';
        }
      } else if (!rightPane.style.position) {
        rightPane.style.position = 'relative';
      }

      if (!stageEl || stageEl.parentElement !== rightPane) {
        if (stageEl && stageEl.parentNode) stageEl.parentNode.removeChild(stageEl);
        stageEl = markOwned(doc.createElement('div'));
        stageEl.className = 'ags-gw-stage';
        stageEl.setAttribute('data-ags-gemini-web-stage', '1');
        stageEl.setAttribute('data-active', mode === 'gemini' ? '1' : '0');

        toolbarEl = doc.createElement('div');
        toolbarEl.className = 'ags-gw-toolbar';
        try {
          if (rightPane.getBoundingClientRect && rightPane.getBoundingClientRect().top <= 12) {
            toolbarEl.setAttribute('data-top-clearance', '1');
          }
        } catch (_e) {}

        var leftGroup = doc.createElement('div');
        leftGroup.className = 'ags-gw-tb-group';

        var backCodeBtn = doc.createElement('button');
        backCodeBtn.type = 'button';
        backCodeBtn.className = 'ags-gw-tb-btn';
        backCodeBtn.textContent = '← 返回 Code';
        backCodeBtn.addEventListener('click', function () { setMode('code'); });

        var navBackBtn = doc.createElement('button');
        navBackBtn.type = 'button';
        navBackBtn.className = 'ags-gw-tb-btn';
        navBackBtn.title = '后退';
        navBackBtn.textContent = '←';
        navBackBtn.addEventListener('click', function () {
          if (webviewEl && typeof webviewEl.canGoBack === 'function' && webviewEl.canGoBack()) {
            webviewEl.goBack();
          }
        });

        var navFwdBtn = doc.createElement('button');
        navFwdBtn.type = 'button';
        navFwdBtn.className = 'ags-gw-tb-btn';
        navFwdBtn.title = '前进';
        navFwdBtn.textContent = '→';
        navFwdBtn.addEventListener('click', function () {
          if (webviewEl && typeof webviewEl.canGoForward === 'function' && webviewEl.canGoForward()) {
            webviewEl.goForward();
          }
        });

        var tbReloadBtn = doc.createElement('button');
        tbReloadBtn.type = 'button';
        tbReloadBtn.className = 'ags-gw-tb-btn';
        tbReloadBtn.title = '刷新';
        tbReloadBtn.textContent = '↻';
        tbReloadBtn.addEventListener('click', function () {
          if (webviewEl && typeof webviewEl.reload === 'function') webviewEl.reload();
          else navigateToUrl(currentUrl);
        });

        var tbNewBtn = doc.createElement('button');
        tbNewBtn.type = 'button';
        tbNewBtn.className = 'ags-gw-tb-btn';
        tbNewBtn.textContent = '+ 新对话';
        tbNewBtn.addEventListener('click', function () {
          var s = matchSiteByUrl(currentUrl);
          navigateToUrl(s.url || DEFAULT_URL);
        });

        leftGroup.appendChild(backCodeBtn);
        leftGroup.appendChild(navBackBtn);
        leftGroup.appendChild(navFwdBtn);
        leftGroup.appendChild(tbReloadBtn);
        leftGroup.appendChild(tbNewBtn);

        var centerGroup = doc.createElement('div');
        centerGroup.className = 'ags-gw-tb-group';
        toolbarSiteButtons = [];
        for (var i = 0; i < 2; i++) {
          (function (site) {
            var sb = doc.createElement('button');
            sb.type = 'button';
            sb.className = 'ags-gw-tb-btn';
            sb.setAttribute('data-site-id', site.id);
            sb.textContent = site.label;
            sb.addEventListener('click', function () {
              navigateToUrl(site.url);
            });
            centerGroup.appendChild(sb);
            toolbarSiteButtons.push(sb);
          })(PRESET_SITES[i]);
        }
        statusTextEl = doc.createElement('span');
        statusTextEl.className = 'ags-gw-tb-status';
        centerGroup.appendChild(statusTextEl);

        var rightGroup = doc.createElement('div');
        rightGroup.className = 'ags-gw-tb-group';
        var extBtn = doc.createElement('button');
        extBtn.type = 'button';
        extBtn.className = 'ags-gw-tb-btn';
        extBtn.textContent = '↗ 外部打开';
        extBtn.addEventListener('click', function () { openCurrentExternal(); });
        rightGroup.appendChild(extBtn);

        toolbarEl.appendChild(leftGroup);
        toolbarEl.appendChild(centerGroup);
        toolbarEl.appendChild(rightGroup);
        stageEl.appendChild(toolbarEl);

        progressEl = doc.createElement('div');
        progressEl.className = 'ags-gw-progress';
        progressEl.setAttribute('data-loading', '0');
        stageEl.appendChild(progressEl);

        viewWrapEl = doc.createElement('div');
        viewWrapEl.className = 'ags-gw-view-wrap';

        errorOverlayEl = doc.createElement('div');
        errorOverlayEl.className = 'ags-gw-error';
        errorOverlayEl.setAttribute('data-visible', '0');
        var errCard = doc.createElement('div');
        errCard.className = 'ags-gw-error-card';
        var errTitle = doc.createElement('div');
        errTitle.className = 'ags-gw-error-title';
        errTitle.textContent = '网页 AI 加载失败';
        errorDescEl = doc.createElement('div');
        errorDescEl.className = 'ags-gw-error-desc';
        var errActs = doc.createElement('div');
        errActs.className = 'ags-gw-error-acts';
        var retryBtn = doc.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'ags-gw-tb-btn';
        retryBtn.textContent = '重试加载';
        retryBtn.addEventListener('click', function () {
          hideErrorOverlay();
          if (webviewEl && typeof webviewEl.reload === 'function') webviewEl.reload();
          else navigateToUrl(currentUrl);
        });
        var proxyBtn = doc.createElement('button');
        proxyBtn.type = 'button';
        proxyBtn.className = 'ags-gw-tb-btn';
        proxyBtn.textContent = '打开代理设置';
        proxyBtn.addEventListener('click', function () {
          if (typeof onOpenSettingsCb === 'function') onOpenSettingsCb();
        });
        errActs.appendChild(retryBtn);
        errActs.appendChild(proxyBtn);
        errCard.appendChild(errTitle);
        errCard.appendChild(errorDescEl);
        errCard.appendChild(errActs);
        errorOverlayEl.appendChild(errCard);
        viewWrapEl.appendChild(errorOverlayEl);
        stageEl.appendChild(viewWrapEl);

        rightPane.appendChild(stageEl);
      }
    }

    function openCurrentExternal() {
      var safe = sanitizeWebUrl(
        (webviewEl && typeof webviewEl.getURL === 'function' && webviewEl.getURL()) || currentUrl
      );
      if (currentApi && typeof currentApi.openGeminiWebExternal === 'function') {
        void currentApi.openGeminiWebExternal(safe);
      } else if (typeof window !== 'undefined' && typeof window.open === 'function') {
        try { window.open(safe, '_blank', 'noopener,noreferrer'); } catch (_e) {}
      }
    }

    function clearWebSession() {
      if (currentApi && typeof currentApi.clearGeminiWebSession === 'function') {
        Promise.resolve(currentApi.clearGeminiWebSession()).then(function () {
          navigateToUrl(currentUrl);
        }).catch(function () {
          navigateToUrl(currentUrl);
        });
      } else {
        navigateToUrl(currentUrl);
      }
    }

    function applyModeState() {
      var doc = getDoc();
      if (!doc || destroyed || !enabled) return;

      var slots = resolveSidebarSlots(doc);
      if (!slots) return;

      ensureStyle(doc);
      ensureDockAndSidebar(doc, slots);
      ensureStage(doc, slots.rightPane);

      if (segEl) segEl.setAttribute('data-mode', mode);
      if (codeBtnEl) codeBtnEl.setAttribute('data-active', mode === 'code' ? '1' : '0');
      if (geminiBtnEl) geminiBtnEl.setAttribute('data-active', mode === 'gemini' ? '1' : '0');

      if (dotEl) {
        if (mode === 'gemini' && lastStatus.awaitingDecision) {
          dotEl.setAttribute('data-status', 'blocked');
        } else if (mode === 'gemini' && lastStatus.isGenerating) {
          dotEl.setAttribute('data-status', 'running');
        } else {
          dotEl.removeAttribute('data-status');
        }
      }

      if (mode === 'gemini') {
        restoreCodeSidebar();
        for (var i = 0; i < slots.codeBodySlots.length; i++) {
          var n = slots.codeBodySlots[i];
          if (n && n.classList && n !== dockEl && n !== sidebarPaneEl) {
            n.classList.add('ags-gw-native-hidden');
            hiddenNodes.push(n);
          }
        }
        if (sidebarPaneEl) sidebarPaneEl.setAttribute('data-active', '1');
        if (stageEl) stageEl.setAttribute('data-active', '1');
        ensureWebview(doc);
        updateActiveSiteUi();
      } else {
        restoreCodeSidebar();
        if (sidebarPaneEl) sidebarPaneEl.setAttribute('data-active', '0');
        if (stageEl) stageEl.setAttribute('data-active', '0');
      }

      if (doc.documentElement && typeof doc.documentElement.setAttribute === 'function') {
        doc.documentElement.setAttribute('data-ags-gemini-mode', mode);
      }
    }

    function disconnectObserver() {
      if (syncTimer) {
        clearTimeout(syncTimer);
        syncTimer = 0;
      }
      if (observer) {
        try { observer.disconnect(); } catch (_e) {}
        observer = null;
      }
    }

    function ensureObserver(doc) {
      if (observer || destroyed || !enabled || !doc || typeof MutationObserver !== 'function') return;
      var rootTarget = doc.body || doc.documentElement;
      if (!rootTarget) return;
      observer = new MutationObserver(function (mutations) {
        if (destroyed || !enabled) return;
        for (var i = 0; i < mutations.length; i++) {
          var t = mutations[i].target;
          if (t && t.getAttribute && t.getAttribute('data-ag-studio-ignore') === 'true') continue;
          if (!syncTimer) {
            syncTimer = setTimeout(function () {
              syncTimer = 0;
              if (!destroyed && enabled) applyModeState();
            }, 60);
          }
          break;
        }
      });
      observer.observe(rootTarget, { childList: true, subtree: true });
    }

    function cleanupAll() {
      disconnectObserver();
      restoreCodeSidebar();
      if (webviewEl && webviewEl.parentNode) webviewEl.parentNode.removeChild(webviewEl);
      webviewEl = null;
      if (stageEl && stageEl.parentNode) stageEl.parentNode.removeChild(stageEl);
      stageEl = null;
      toolbarEl = null;
      statusTextEl = null;
      progressEl = null;
      viewWrapEl = null;
      errorOverlayEl = null;
      errorDescEl = null;
      if (sidebarPaneEl && sidebarPaneEl.parentNode) sidebarPaneEl.parentNode.removeChild(sidebarPaneEl);
      sidebarPaneEl = null;
      if (dockEl && dockEl.parentNode) dockEl.parentNode.removeChild(dockEl);
      dockEl = null;
      segEl = null;
      codeBtnEl = null;
      geminiBtnEl = null;
      dotEl = null;
      siteButtons = [];
      toolbarSiteButtons = [];
      var doc = getDoc();
      removeStyle(doc);
      if (doc && doc.documentElement && typeof doc.documentElement.removeAttribute === 'function') {
        doc.documentElement.removeAttribute('data-ags-gemini-mode');
      }
    }

    function setMode(nextMode) {
      if (destroyed) return mode;
      mode = nextMode === 'gemini' ? 'gemini' : 'code';
      applyModeState();
      return mode;
    }

    function sync(params) {
      if (destroyed) return;
      var p = params || {};
      var cfg = p.cfg || (p.geminiWeb ? p : currentCfg) || {};
      currentCfg = cfg;
      if (p.api !== undefined) currentApi = p.api;
      if (typeof p.onOpenSettings === 'function') onOpenSettingsCb = p.onOpenSettings;
      if (typeof p.isGenerating === 'boolean') lastStatus.isGenerating = p.isGenerating;
      if (typeof p.awaitingDecision === 'boolean') lastStatus.awaitingDecision = p.awaitingDecision;

      var gw = (cfg && cfg.geminiWeb) || {};
      var nextEnabled = gw.enabled !== false;
      var configuredDefault = sanitizeWebUrl(gw.defaultUrl || DEFAULT_URL);
      if (!webviewEl) {
        currentUrl = configuredDefault;
      }

      if (!nextEnabled) {
        enabled = false;
        mode = 'code';
        cleanupAll();
        return;
      }

      enabled = true;
      var doc = getDoc();
      ensureObserver(doc);
      applyModeState();
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      enabled = false;
      mode = 'code';
      cleanupAll();
      currentApi = null;
    }

    return {
      sync: sync,
      setMode: setMode,
      getMode: function () { return mode; },
      navigate: navigateToUrl,
      destroy: destroy
    };
  }

  var exported = {
    createGeminiWebController: createGeminiWebController,
    PRESET_SITES: PRESET_SITES,
    PARTITION_NAME: PARTITION_NAME,
    sanitizeWebUrl: sanitizeWebUrl
  };

  if (typeof window !== 'undefined') {
    window.__AG_STUDIO_GEMINI_WEB__ = exported;
  }
  if (globalScope && globalScope !== (typeof window !== 'undefined' ? window : null)) {
    globalScope.__AG_STUDIO_GEMINI_WEB__ = exported;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
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
      thoughtDiagResult: null,
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
      var thoughtCfg = cfg.thought || {};
      var thoughtAiCfg = thoughtCfg.ai || {};
      var thoughtMode = thoughtCfg.mode || 'off';
      var thoughtView = thoughtCfg.viewMode || thoughtCfg.view || 'bilingual';
      var thoughtLang = thoughtCfg.targetLang || 'zh-CN';
      var thoughtStyle = thoughtCfg.stylePreset || thoughtAiCfg.stylePreset || 'technical';
      var thoughtBaseUrl = thoughtCfg.baseUrl || thoughtAiCfg.baseUrl || 'https://api.openai.com/v1';
      var thoughtApiKey = thoughtCfg.apiKey != null ? thoughtCfg.apiKey : (thoughtAiCfg.apiKey || '');
      var thoughtModel = thoughtCfg.model || thoughtAiCfg.model || 'gpt-4o-mini';
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
        '        <option value="whalegirl" ' + (mascotCfg.style === 'whalegirl' ? 'selected' : '') + '>Whalegirl 鲸娘</option>' +
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
        '  <div class="ags-row"><span>左上角 [Code | Gemini] 网页聊天</span><input type="checkbox" id="ags-gemini-web-enabled" ' + (!cfg.geminiWeb || cfg.geminiWeb.enabled !== false ? 'checked' : '') + '></div>',
        '  <div class="ags-row"><span>网页聊天默认入口</span>' +
        '    <select class="ags-select" style="width:165px" id="ags-gemini-web-url">' +
        '      <option value="https://gemini.google.com/app" ' + (((!cfg.geminiWeb || !cfg.geminiWeb.defaultUrl || cfg.geminiWeb.defaultUrl === 'https://gemini.google.com/app') ? 'selected' : '')) + '>Gemini 网页版</option>' +
        '      <option value="https://aistudio.google.com" ' + ((cfg.geminiWeb && cfg.geminiWeb.defaultUrl === 'https://aistudio.google.com') ? 'selected' : '') + '>Google AI Studio</option>' +
        '      <option value="https://chatgpt.com" ' + ((cfg.geminiWeb && cfg.geminiWeb.defaultUrl === 'https://chatgpt.com') ? 'selected' : '') + '>ChatGPT</option>' +
        '      <option value="https://claude.ai" ' + ((cfg.geminiWeb && cfg.geminiWeb.defaultUrl === 'https://claude.ai') ? 'selected' : '') + '>Claude</option>' +
        '      <option value="https://chat.deepseek.com" ' + ((cfg.geminiWeb && cfg.geminiWeb.defaultUrl === 'https://chat.deepseek.com') ? 'selected' : '') + '>DeepSeek</option>' +
        '    </select></div>',
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
        '  <div class="ags-row"><span>工具调用内联 Diff 预览</span><input type="checkbox" id="ags-fx-inline-diff" ' + (fxCfg.inlineDiff !== false ? 'checked' : '') + '></div>',
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
        '  <details class="ags-details" ' + (thoughtMode !== 'off' ? 'open' : '') + '>',
        '    <summary>思考过程实时翻译 (' + esc(thoughtMode === 'ai' ? 'AI 转译' : (thoughtMode === 'machine' ? '机器翻译' : '关闭')) + ')</summary>',
        '    <div style="display:flex;flex-direction:column;gap:8px">',
        '      <div class="ags-row"><span>翻译引擎</span>' +
        '        <select class="ags-select" style="width:175px" id="ags-thought-mode">' +
        '          <option value="off" ' + (thoughtMode === 'off' ? 'selected' : '') + '>关闭（零开销）</option>' +
        '          <option value="machine" ' + (thoughtMode === 'machine' ? 'selected' : '') + '>机器翻译（免费 GTX）</option>' +
        '          <option value="ai" ' + (thoughtMode === 'ai' ? 'selected' : '') + '>AI 模型转译（OpenAI 兼容）</option>' +
        '        </select></div>',
        (thoughtMode !== 'off' ? [
          '      <div class="ags-row"><span>展示方式</span>' +
          '        <select class="ags-select" style="width:175px" id="ags-thought-view">' +
          '          <option value="bilingual" ' + (thoughtView === 'bilingual' ? 'selected' : '') + '>中英双语对照</option>' +
          '          <option value="immersive" ' + (thoughtView === 'immersive' ? 'selected' : '') + '>沉浸纯译文</option>' +
          '        </select></div>',
          '      <div class="ags-row"><span>目标语言</span>' +
          '        <select class="ags-select" style="width:175px" id="ags-thought-lang">' +
          '          <option value="zh-CN" ' + (thoughtLang === 'zh-CN' ? 'selected' : '') + '>简体中文</option>' +
          '          <option value="zh-TW" ' + (thoughtLang === 'zh-TW' ? 'selected' : '') + '>繁體中文</option>' +
          '          <option value="en" ' + (thoughtLang === 'en' ? 'selected' : '') + '>English</option>' +
          '        </select></div>',
          '      <div class="ags-row"><span>同时翻译工具摘要</span><input type="checkbox" id="ags-thought-tools" ' + (thoughtCfg.translateToolSummaries ? 'checked' : '') + '></div>',
          '      <div class="ags-row"><span>同时翻译会话标题</span><input type="checkbox" id="ags-thought-titles" ' + (thoughtCfg.translateTitles ? 'checked' : '') + '></div>',
          '      <div class="ags-row"><span class="ags-sub">代理覆盖</span><input class="ags-input" style="width:175px" id="ags-thought-proxy" value="' + esc(thoughtCfg.proxyUrl || '') + '" placeholder="留空自动复用系统/本地代理"></div>',
          (thoughtMode === 'ai' ? [
            '      <div class="ags-row"><span class="ags-sub">Base URL</span><input class="ags-input" style="width:175px" id="ags-thought-ai-url" value="' + esc(thoughtBaseUrl) + '" placeholder="https://api.openai.com/v1"></div>',
            '      <div class="ags-row"><span class="ags-sub">API Key</span><input class="ags-input" style="width:175px" type="password" id="ags-thought-ai-key" value="' + esc(thoughtApiKey) + '" placeholder="本地 Ollama 可留空"></div>',
            '      <div class="ags-row"><span class="ags-sub">模型名</span><input class="ags-input" style="width:175px" id="ags-thought-ai-model" value="' + esc(thoughtModel) + '" placeholder="gpt-4o-mini"></div>',
            '      <div class="ags-row"><span>转译风格</span>' +
            '        <select class="ags-select" style="width:175px" id="ags-thought-ai-style">' +
            '          <option value="technical" ' + (thoughtStyle === 'technical' ? 'selected' : '') + '>技术直译（保留术语与行号）</option>' +
            '          <option value="concise" ' + (thoughtStyle === 'concise' ? 'selected' : '') + '>精简摘要（提炼结论脉络）</option>' +
            '        </select></div>'
          ].join('\n') : ''),
          '      <div class="ags-row" style="justify-content:flex-end;gap:6px;flex-wrap:wrap">' +
          '        <button type="button" class="ags-btn ags-btn-primary" id="ags-thought-save-btn">保存</button>' +
          '        <button type="button" class="ags-btn" id="ags-thought-diagnose-btn">一键诊断</button>' +
          '        <button type="button" class="ags-btn" id="ags-thought-clear-cache-btn">清缓存</button>' +
          '      </div>',
          (state.thoughtDiagResult ? ('      <div class="ags-sub" style="line-height:1.45">' + esc(state.thoughtDiagResult) + '</div>') : '')
        ].join('\n') : ''),
        '    </div>',
        '  </details>',
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

      var gwEnabledEl = el.querySelector('#ags-gemini-web-enabled');
      var gwUrlEl = el.querySelector('#ags-gemini-web-url');
      if (gwEnabledEl) gwEnabledEl.addEventListener('change', function () {
        opts.saveConfig({ geminiWeb: { enabled: gwEnabledEl.checked, defaultUrl: gwUrlEl ? gwUrlEl.value : undefined } });
      });
      if (gwUrlEl) gwUrlEl.addEventListener('change', function () {
        opts.saveConfig({ geminiWeb: { enabled: gwEnabledEl ? gwEnabledEl.checked : true, defaultUrl: gwUrlEl.value } });
      });

      var fxMap = [
        ['#ags-fx-ink', 'inkStream'],
        ['#ags-fx-caret', 'smoothCaret'],
        ['#ags-fx-aura', 'edgeAura'],
        ['#ags-fx-effort', 'effortSlider'],
        ['#ags-fx-inline-diff', 'inlineDiff']
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

      var thoughtModeEl = el.querySelector('#ags-thought-mode');
      var thoughtViewEl = el.querySelector('#ags-thought-view');
      var thoughtLangEl = el.querySelector('#ags-thought-lang');
      var thoughtToolsEl = el.querySelector('#ags-thought-tools');
      var thoughtTitlesEl = el.querySelector('#ags-thought-titles');
      var thoughtProxyEl = el.querySelector('#ags-thought-proxy');
      var thoughtUrlEl = el.querySelector('#ags-thought-ai-url');
      var thoughtKeyEl = el.querySelector('#ags-thought-ai-key');
      var thoughtModelEl = el.querySelector('#ags-thought-ai-model');
      var thoughtStyleEl = el.querySelector('#ags-thought-ai-style');

      function readThoughtFormPayload() {
        var curT = (cfg.thought && typeof cfg.thought === 'object') ? cfg.thought : {};
        var curAi = (curT.ai && typeof curT.ai === 'object') ? curT.ai : {};
        var nextView = thoughtViewEl ? thoughtViewEl.value : (curT.viewMode || curT.view || 'bilingual');
        var nextBaseUrl = thoughtUrlEl ? thoughtUrlEl.value.trim() : (curT.baseUrl || curAi.baseUrl || 'https://api.openai.com/v1');
        var nextApiKey = thoughtKeyEl ? thoughtKeyEl.value.trim() : (curT.apiKey != null ? curT.apiKey : (curAi.apiKey || ''));
        var nextModel = thoughtModelEl ? thoughtModelEl.value.trim() : (curT.model || curAi.model || 'gpt-4o-mini');
        var nextStyle = thoughtStyleEl ? thoughtStyleEl.value : (curT.stylePreset || curAi.stylePreset || 'technical');
        return {
          mode: thoughtModeEl ? thoughtModeEl.value : (curT.mode || 'off'),
          viewMode: nextView,
          view: nextView,
          targetLang: thoughtLangEl ? thoughtLangEl.value : (curT.targetLang || 'zh-CN'),
          translateToolSummaries: thoughtToolsEl ? Boolean(thoughtToolsEl.checked) : Boolean(curT.translateToolSummaries),
          translateTitles: thoughtTitlesEl ? Boolean(thoughtTitlesEl.checked) : Boolean(curT.translateTitles),
          proxyUrl: thoughtProxyEl ? thoughtProxyEl.value.trim() : (curT.proxyUrl || ''),
          baseUrl: nextBaseUrl,
          apiKey: nextApiKey,
          model: nextModel,
          stylePreset: nextStyle,
          ai: {
            baseUrl: nextBaseUrl,
            apiKey: nextApiKey,
            model: nextModel,
            stylePreset: nextStyle
          }
        };
      }

      if (thoughtModeEl) {
        thoughtModeEl.addEventListener('change', function () {
          state.thoughtDiagResult = null;
          opts.saveConfig({ thought: readThoughtFormPayload() });
          render(null, true);
        });
      }
      [thoughtViewEl, thoughtLangEl, thoughtToolsEl, thoughtTitlesEl, thoughtStyleEl].forEach(function (ctrl) {
        if (ctrl) {
          ctrl.addEventListener('change', function () {
            opts.saveConfig({ thought: readThoughtFormPayload() });
          });
        }
      });

      var thoughtSaveBtn = el.querySelector('#ags-thought-save-btn');
      if (thoughtSaveBtn) {
        thoughtSaveBtn.addEventListener('click', function () {
          opts.saveConfig({ thought: readThoughtFormPayload() });
          showToast('思考翻译配置已保存');
        });
      }

      var thoughtDiagBtn = el.querySelector('#ags-thought-diagnose-btn');
      if (thoughtDiagBtn) {
        thoughtDiagBtn.addEventListener('click', function () {
          var formThought = readThoughtFormPayload();
          opts.saveConfig({ thought: formThought });
          if (!opts.api || !opts.api.diagnoseThought) return;
          state.thoughtDiagResult = '诊断测试中...';
          render(null, true);
          opts.api.diagnoseThought({ thought: formThought }).then(function (r) {
            if (r && r.ok) {
              state.thoughtDiagResult = '诊断通过 (' + (r.mode || formThought.mode) + ' · ' + (r.proxyUsed || 'direct') + ' · ' + (r.latencyMs != null ? (r.latencyMs + 'ms') : '-') + ')：' + (r.sample || 'OK');
            } else {
              state.thoughtDiagResult = '诊断失败：' + ((r && r.error) || '未知错误');
            }
            render(null, true);
          }).catch(function (e) {
            state.thoughtDiagResult = '诊断失败：' + ((e && e.message) || '未知错误');
            render(null, true);
          });
        });
      }

      var thoughtClearBtn = el.querySelector('#ags-thought-clear-cache-btn');
      if (thoughtClearBtn) {
        thoughtClearBtn.addEventListener('click', function () {
          if (!opts.api || !opts.api.clearThoughtCache) return;
          opts.api.clearThoughtCache().then(function (r) {
            var n = r && r.cleared != null ? (' (' + r.cleared + ' 条)') : '';
            showToast('思考翻译缓存已清空' + n);
          }).catch(function (e) { showToast((e && e.message) || '清理失败'); });
        });
      }

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
  var thoughtTranslatorApi = window.__AG_STUDIO_THOUGHT_TRANSLATOR__;
  var inlineDiffApi = window.__AG_STUDIO_INLINE_DIFF__;
  var geminiWebApi = window.__AG_STUDIO_GEMINI_WEB__;
  var drawerApi = window.__AG_STUDIO_DRAWER__ || window.__AG_STUDIO_DASHBOARD__;

  var currentConfig = {
    theme: { activePreset: 'claude', colorMode: 'system', customThemes: [], editorialSerif: true, fonts: {} },
    mascot: { enabled: true, style: 'clawd', scale: 1, align: 'right', sleepTimeoutMs: 300000 },
    hud: { enabled: true, displayStyle: 'ring', position: 'composer', showVial: true, homeOverview: true },
    fx: { inkStream: true, smoothCaret: true, edgeAura: true, effortSlider: false, inlineDiff: true },
    homeOverview: true,
    geminiWeb: { enabled: true, defaultUrl: 'https://gemini.google.com/app' },
    i18n: { language: 'zh-CN' },
    thought: {
      mode: 'off',
      viewMode: 'bilingual',
      view: 'bilingual',
      targetLang: 'zh-CN',
      stylePreset: 'technical',
      translateToolSummaries: false,
      translateTitles: false,
      proxyUrl: '',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o-mini',
      ai: { baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini', stylePreset: 'technical' }
    },
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

  var thoughtTranslator = thoughtTranslatorApi && thoughtTranslatorApi.createThoughtTranslatorController
    ? thoughtTranslatorApi.createThoughtTranslatorController()
    : null;

  var inlineDiff = inlineDiffApi && inlineDiffApi.createInlineDiffController
    ? inlineDiffApi.createInlineDiffController()
    : null;

  var geminiWeb = geminiWebApi && geminiWebApi.createGeminiWebController
    ? geminiWebApi.createGeminiWebController({
        api: api,
        onOpenSettings: function () { drawer.toggle(true); }
      })
    : null;

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
    if (typeof themes.syncSidecarIframeThemes === 'function') {
      themes.syncSidecarIframeThemes(effMode);
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

    // 4. Prism FX, Effort Slider, Thought Translator & Inline Diff
    prismFx.sync({
      cfg: currentConfig,
      isGenerating: fused.isGenerating,
      auraPhase: fused.auraPhase
    });
    effortSlider.sync(currentConfig);
    if (thoughtTranslator && typeof thoughtTranslator.sync === 'function') {
      thoughtTranslator.sync(currentConfig, api);
    }
    if (inlineDiff && typeof inlineDiff.sync === 'function') {
      inlineDiff.sync(currentConfig, api);
    }
    if (geminiWeb && typeof geminiWeb.sync === 'function') {
      geminiWeb.sync({
        cfg: currentConfig,
        api: api,
        isGenerating: fused.isGenerating,
        awaitingDecision: fused.awaitingDecision,
        onOpenSettings: function () { drawer.toggle(true); }
      });
    }
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
      if (effortSlider) effortSlider.sync(currentConfig);
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
