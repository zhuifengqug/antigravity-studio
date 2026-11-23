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
