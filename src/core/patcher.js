'use strict';

const { MARKERS, LEGACY_MARKERS } = require('../shared/constants');

function stripMarkedBlock(content, startMarker, endMarker) {
  let out = content;
  while (true) {
    const startIdx = out.indexOf(startMarker);
    if (startIdx === -1) break;
    const endIdx = out.indexOf(endMarker, startIdx);
    if (endIdx === -1) break;
    let after = endIdx + endMarker.length;
    if (out[after] === '\r') after++;
    if (out[after] === '\n') after++;
    out = out.slice(0, startIdx) + out.slice(after);
  }
  return out;
}

function stripAllStudioAndLegacyBlocks(content) {
  let out = String(content || '');
  out = stripMarkedBlock(out, MARKERS.PROXY_BOOT_START, MARKERS.PROXY_BOOT_END);
  out = stripMarkedBlock(out, MARKERS.UTILS_START, MARKERS.UTILS_END);
  out = stripMarkedBlock(out, MARKERS.PRELOAD_START, MARKERS.PRELOAD_END);
  out = stripMarkedBlock(out, MARKERS.MENU_START, MARKERS.MENU_END);
  out = stripMarkedBlock(out, MARKERS.TRAY_START, MARKERS.TRAY_END);

  // Strip legacy third-party patch blocks cleanly if present
  for (const [s, e] of LEGACY_MARKERS) {
    out = stripMarkedBlock(out, s, e);
  }

  // Also strip single-line legacy utils hooks left by earlier tools
  out = out.replace(/^\s*try\s*\{\s*require\("\.\/meter-main"\)\.ensureProxyEnvironment\(.*?\);\s*\}\s*catch\s*\{\s*\}\s*\r?\n?/gm, '');
  out = out.replace(/^\s*try\s*\{\s*require\("\.\/meter-main"\)\.installContextMeter\(.*?\);\s*require\("\.\/meter-main"\)\.ensureMeterInjected\(.*?\);\s*\}\s*catch\s*\{\s*\}\s*\r?\n?/gm, '');
  return out;
}

function buildProxyBootBlock() {
  return `${MARKERS.PROXY_BOOT_START}
try { require("./ag-studio/proxy-manager").applyBootProxySync(); } catch (_agBootErr) {}
${MARKERS.PROXY_BOOT_END}`;
}

function patchUtilsJs(rawSource) {
  let src = stripAllStudioAndLegacyBlocks(rawSource);
  const warnings = [];

  // 1. Proxy boot at top (after "use strict"; if present)
  const bootBlock = buildProxyBootBlock();
  const useStrictMatch = src.match(/^(['"]use strict['"];?\r?\n)/);
  if (useStrictMatch) {
    src = src.replace(useStrictMatch[1], `${useStrictMatch[1]}${bootBlock}\n`);
  } else {
    src = `${bootBlock}\n${src}`;
  }

  // 2. Attach window before loadHubWindowUrl(win, url, ...)
  const loadHubRegex = /([ \t]*)(void\s+loadHubWindowUrl\(\s*win\s*,)/;
  if (!loadHubRegex.test(src)) {
    throw new Error('Anchor not found in dist/utils.js: loadHubWindowUrl(win, ...)');
  }
  src = src.replace(
    loadHubRegex,
    `$1${MARKERS.UTILS_START}\n$1try { require("./ag-studio/studio-main").attachWindow(win); } catch (_agErr) {}\n$1${MARKERS.UTILS_END}\n$1$2`
  );

  // 3. Ensure injected on showOrCreateWindow
  const showWinRegex = /(wins\[0\]\.focus\(\);)/;
  if (showWinRegex.test(src)) {
    src = src.replace(
      showWinRegex,
      `$1\n        try { require("./ag-studio/studio-main").attachWindow(wins[0]); require("./ag-studio/studio-main").ensureInjected(wins[0], { force: true }); } catch {}`
    );
  } else {
    warnings.push('Optional anchor wins[0].focus() not found in dist/utils.js');
  }

  const createShowWinRegex = /(else if \(port > 0\) \{\s*\r?\n\s*createWindow\(([^)]+)\);)/;
  if (createShowWinRegex.test(src)) {
    src = src.replace(
      createShowWinRegex,
      `else if (port > 0) {\n        const _agWin = createWindow($2);\n        try { require("./ag-studio/studio-main").attachWindow(_agWin); require("./ag-studio/studio-main").ensureInjected(_agWin, { force: true }); } catch {}`
    );
  }

  // 4. setupNodeWrapper(env) proxy inheritance
  const setupNodeRegex = /(function setupNodeWrapper\(env\)\s*\{)/;
  if (setupNodeRegex.test(src)) {
    src = src.replace(
      setupNodeRegex,
      `$1\n    try { require("./ag-studio/proxy-manager").applyProxyToEnv(env); } catch {}`
    );
  } else {
    warnings.push('Optional anchor setupNodeWrapper(env) not found in dist/utils.js');
  }

  return { content: src, warnings };
}

function patchPreloadJs(rawSource, preloadSnippet) {
  let src = stripAllStudioAndLegacyBlocks(rawSource);
  // Restore clean line ending and append studio preload snippet
  if (!src.endsWith('\n')) src += '\n';
  const block = `${MARKERS.PRELOAD_START}\n${preloadSnippet.trim()}\n${MARKERS.PRELOAD_END}\n`;
  return { content: src + block, warnings: [] };
}

function patchMenuJs(rawSource) {
  let src = stripAllStudioAndLegacyBlocks(rawSource);
  const warnings = [];
  // Hook electron_1.Menu.buildFromTemplate(...) inside menu.js safely
  const buildMenuRegex = /electron_1\.Menu\.buildFromTemplate\(/g;
  if (!buildMenuRegex.test(src)) {
    warnings.push('Anchor Menu.buildFromTemplate not found in dist/menu.js; native menu i18n will be skipped.');
    return { content: src, warnings };
  }
  const helperBlock = `${MARKERS.MENU_START}
function __agTranslateMenu(tpl) {
  try { return require("./ag-studio/native-i18n").translateMenuTemplate(tpl); } catch { return tpl; }
}
${MARKERS.MENU_END}`;
  src = src.replace(/electron_1\.Menu\.buildFromTemplate\(/g, 'electron_1.Menu.buildFromTemplate(__agTranslateMenu(');
  // Close the extra paren carefully by hooking Menu.buildFromTemplate via local wrapper instead of regex balancing parens!
  // Revert above call replacement and use a safe local wrapper on Menu.buildFromTemplate reference
  src = stripAllStudioAndLegacyBlocks(rawSource);
  const anchor = 'const electron_1 = require("electron");';
  if (src.includes(anchor)) {
    const wrapper = `${anchor}
${MARKERS.MENU_START}
const __agOrigBuildFromTemplate = electron_1.Menu.buildFromTemplate.bind(electron_1.Menu);
function __agBuildLocalizedMenu(tpl) {
  try {
    const i18n = require("./ag-studio/native-i18n");
    return __agOrigBuildFromTemplate(i18n.translateMenuTemplate(tpl));
  } catch {
    return __agOrigBuildFromTemplate(tpl);
  }
}
${MARKERS.MENU_END}`;
    src = src.replace(anchor, wrapper);
    src = src.replace(/electron_1\.Menu\.buildFromTemplate\(/g, '__agBuildLocalizedMenu(');
  } else {
    warnings.push('electron_1 import not found in dist/menu.js; skipped menu hook.');
  }
  return { content: src, warnings };
}

function patchTrayJs(rawSource) {
  let src = stripAllStudioAndLegacyBlocks(rawSource);
  const warnings = [];
  // Also strip hardcoded inline translations if present from previous tools
  src = src.replace(/const translatedActions = actions\.map[\s\S]*?return action;\s*\}\);\s*contextMenu = electron_1\.Menu\.buildFromTemplate\(translatedActions\);/m,
    'contextMenu = electron_1.Menu.buildFromTemplate(actions);');
  src = src.replace(/if \(options && typeof options === 'object'\) \{\s*if \(options\.label === 'Connect to WSL'\)[\s\S]*?\}\r?\n/m, '');

  const anchor = 'const electron_1 = require("electron");';
  if (!src.includes(anchor)) {
    warnings.push('electron_1 import not found in dist/tray.js; skipped tray hook.');
    return { content: src, warnings };
  }

  const wrapper = `${anchor}
${MARKERS.TRAY_START}
function __agTranslateTrayActions(actions) {
  try { return require("./ag-studio/native-i18n").translateTrayActions(actions); } catch { return actions; }
}
function __agTranslateTrayItem(opts) {
  try { return require("./ag-studio/native-i18n").translateMenuItemOptions(opts); } catch { return opts; }
}
function __agFormatAgentCount(count) {
  try { return require("./ag-studio/native-i18n").formatTrayAgentCount(count); } catch { return count > 0 ? count + ' agents running' : 'No agents running'; }
}
${MARKERS.TRAY_END}`;

  src = src.replace(anchor, wrapper);

  // Hook createTray buildFromTemplate(actions)
  src = src.replace(
    /contextMenu\s*=\s*electron_1\.Menu\.buildFromTemplate\(\s*actions\s*\)/,
    'contextMenu = electron_1.Menu.buildFromTemplate(__agTranslateTrayActions(actions))'
  );

  // Hook insertTrayMenuItem options
  src = src.replace(
    /new electron_1\.MenuItem\(\s*options\s*\)/,
    'new electron_1.MenuItem(__agTranslateTrayItem(options))'
  );

  // Hook updateTrayAgentCount
  src = src.replace(
    /countItem\.label\s*=\s*count\s*>\s*0\s*\?[^;]+;/,
    'countItem.label = __agFormatAgentCount(count);'
  );

  return { content: src, warnings };
}

function inspectPatchAnchors(filesMap) {
  const results = {};
  const checks = [
    ['dist/utils.js', () => patchUtilsJs(filesMap['dist/utils.js'])],
    ['dist/preload.js', () => patchPreloadJs(filesMap['dist/preload.js'], '/* dry-run */')],
    ['dist/menu.js', () => patchMenuJs(filesMap['dist/menu.js'])],
    ['dist/tray.js', () => patchTrayJs(filesMap['dist/tray.js'])],
  ];
  for (const [name, fn] of checks) {
    try {
      if (!filesMap[name]) {
        results[name] = { ok: false, error: 'File missing from ASAR', warnings: [] };
      } else {
        const res = fn();
        results[name] = { ok: true, warnings: res.warnings || [] };
      }
    } catch (err) {
      results[name] = { ok: false, error: err.message, warnings: [] };
    }
  }
  return results;
}

module.exports = {
  stripMarkedBlock,
  stripAllStudioAndLegacyBlocks,
  patchUtilsJs,
  patchPreloadJs,
  patchMenuJs,
  patchTrayJs,
  inspectPatchAnchors,
};
