'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const themes = require('../src/renderer/themes');
const typography = require('../src/renderer/typography');
const mascot = require('../src/renderer/mascot');
const domI18n = require('../src/i18n/dom-runtime');
const nativeI18n = require('../src/i18n/native-i18n');
const { scanLocalFonts } = require('../src/main/font-scanner');
const zhCN = require('../src/i18n/dict.zh-CN.json');
const zhTW = require('../src/i18n/dict.zh-TW.json');

test('Only Claude & Antigravity presets exist plus custom theme cloning and CSS generation', () => {
  assert.deepEqual(Object.keys(themes.PRESET_THEMES), ['claude', 'antigravity']);
  const custom = themes.cloneThemeAsCustom('antigravity', 'Aurora Test');
  assert.equal(custom.isPreset, false);
  const derived = themes.deriveAccentTokens('#3B6CF6', true);
  assert.match(derived.accent, /^#3B6CF6$/i);
  assert.match(derived.accentSoft, /^rgba\(59, 108, 246,/);

  const css = themes.buildThemeCss({
    activePreset: custom.id,
    colorMode: 'dark',
    customThemes: [custom],
    editorialSerif: true,
  });
  assert.match(css, /--ags-bg-canvas:/);
  assert.match(css, /\.prose/);
});

test('Typography presets and local font scanner load .ttf/.woff2 safely', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-studio-fonts-'));
  try {
    const fontsDir = path.join(tmpDir, 'fonts');
    fs.mkdirSync(fontsDir, { recursive: true });
    fs.writeFileSync(path.join(fontsDir, 'My-Test-Font.woff2'), Buffer.from('wOF2mock'));
    fs.writeFileSync(path.join(fontsDir, 'ignored.txt'), 'nope');

    const res = scanLocalFonts({ stateDir: tmpDir, fontsDir });
    assert.equal(res.fonts.length, 1);
    assert.equal(res.fonts[0].family, 'My Test Font');
    assert.match(res.fonts[0].dataUrl, /^data:font\/woff2;base64,/);

    const uiStack = typography.resolveFontStack('ui', 'system', 'My Test Font');
    assert.match(uiStack, /^"My Test Font"/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Mascot renders Clawd and Astra SVG for all 8 states', () => {
  assert.equal(Object.keys(mascot.MASCOT_STATES).length, 8);
  for (const state of Object.keys(mascot.MASCOT_STATES)) {
    const svg1 = mascot.getMascotSvg('clawd', state);
    const svg2 = mascot.getMascotSvg('astra', state);
    assert.match(svg1, /<svg /);
    assert.match(svg2, /<svg /);
  }
});

test('i18n engine translates exact/regex/native menus and protects code/paths from mistranslation', () => {
  const engineCN = domI18n.createTranslatorEngine({ language: 'zh-CN', ...zhCN });
  assert.equal(engineCN.translateText('  Settings  '), '  设置  ');
  assert.equal(engineCN.translateText('3 agents running'), '3 个智能体运行中');
  assert.equal(engineCN.translateText('12,400 tokens used'), '已用 12,400 tokens');

  // Code, file paths, camelCase/snake_case must never be mistranslated
  assert.equal(domI18n.looksLikeCodeOrPath('C:\\Users\\gjs27\\app.asar'), true);
  assert.equal(domI18n.looksLikeCodeOrPath('src/main/studio-main.js'), true);
  assert.equal(domI18n.looksLikeCodeOrPath('getUserStatus'), true);
  assert.equal(domI18n.looksLikeCodeOrPath('studio_manifest_v1'), true);
  assert.equal(engineCN.translateText('C:\\Users\\gjs27\\Settings'), 'C:\\Users\\gjs27\\Settings');

  const engineTW = domI18n.createTranslatorEngine({ language: 'zh-TW', ...zhTW });
  assert.equal(engineTW.translateText('Settings'), '設定');

  // Native menu & tray localization
  const menu = nativeI18n.translateMenuTemplate([{ label: '&File', submenu: [{ label: 'New Window' }] }], 'zh-CN');
  assert.equal(menu[0].label, '文件');
  assert.equal(menu[0].submenu[0].label, '新建窗口');
  assert.equal(nativeI18n.formatTrayAgentCount(2, 'zh-CN'), '2 个智能体运行中');
  assert.equal(nativeI18n.formatTrayAgentCount(0, 'en'), 'No agents running');
});
