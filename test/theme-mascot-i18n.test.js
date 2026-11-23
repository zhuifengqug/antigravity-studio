'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const themes = require('../src/renderer/themes');
const typography = require('../src/renderer/typography');
const mascotStage = require('../src/renderer/mascot-stage');
const mascotSprites = require('../src/renderer/assets/mascot-sprites');
const homeCard = require('../src/renderer/home-overview-card');
const effortSlider = require('../src/renderer/effort-slider');
const domI18n = require('../src/i18n/dom-runtime');
const nativeI18n = require('../src/i18n/native-i18n');
const { scanLocalFonts } = require('../src/backend/font-scanner');

const zhCN = require('../src/i18n/dict.zh-CN.json');
const zhTW = require('../src/i18n/dict.zh-TW.json');

test('Claude & Antigravity presets, custom themes, and local font scanning work cleanly', () => {
  assert.deepEqual(Object.keys(themes.PRESET_THEMES), ['claude', 'antigravity']);
  const custom = themes.cloneThemeAsCustom('antigravity', 'Nebula Custom');
  assert.equal(custom.isPreset, false);
  const derived = themes.deriveAccentTokens('#3B6CF6', true);
  assert.match(derived.accentSoft, /^rgba\(59, 108, 246,/);

  assert.ok(themes.parseRgbLuminance('rgb(17, 17, 19)') < 30);
  assert.ok(themes.parseRgbLuminance('rgb(250, 250, 250)') > 240);
  assert.equal(themes.parseRgbLuminance('rgba(0, 0, 0, 0)'), null);

  const agDarkCss = themes.buildThemeCss({ activePreset: 'antigravity', colorMode: 'dark' });
  assert.match(agDarkCss, /color-scheme:\s*dark;/);
  assert.doesNotMatch(agDarkCss, /html,\s*body,\s*#root/);
  assert.doesNotMatch(agDarkCss, /aside,\s*nav/);

  const claudeDarkCss = themes.buildThemeCss({ activePreset: 'claude', colorMode: 'dark' });
  assert.match(claudeDarkCss, /color-scheme:\s*dark;/);
  assert.match(claudeDarkCss, /aside:not\(\.ags-drawer\)/);
  assert.doesNotMatch(claudeDarkCss, /aside,\s*nav/);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-studio-fonts-'));
  try {
    const fontsDir = path.join(tmpDir, 'fonts');
    fs.mkdirSync(fontsDir, { recursive: true });
    fs.writeFileSync(path.join(fontsDir, 'Test-Mono.woff2'), Buffer.from('wOF2mock'));
    const res = scanLocalFonts({ stateDir: tmpDir, fontsDir });
    assert.equal(res.fonts.length, 1);
    assert.equal(res.fonts[0].family, 'Test Mono');
    assert.match(typography.resolveFontStack('code', 'jetbrains', 'Test Mono'), /^"Test Mono"/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('All 3 mascots (Clawd, Deepy, Astra) render sprites/frames across all 9 states', () => {
  assert.ok(mascotSprites.crab && Object.keys(mascotSprites.crab).length >= 10);
  assert.ok(mascotSprites.deepy && Object.keys(mascotSprites.deepy).length >= 8);
  assert.equal(Object.keys(mascotStage.MASCOT_STATES).length, 9);
  for (const state of Object.keys(mascotStage.MASCOT_STATES)) {
    const svg = mascotStage.renderAstraSvg(state, 0);
    assert.match(svg, /<svg /);
  }
});

test('Home overview card 7xN heatmap normalization, book comparison, and effort slider', () => {
  const days = [];
  for (let i = 0; i < 30; i++) {
    days.push({ date: `2026-11-${String((i % 28) + 1).padStart(2, '0')}`, total: i * 100000 });
  }
  const cells = homeCard.normalizeHeatmap7xN({ heatmap7xN: days }, 30);
  assert.equal(cells.length % 7, 0);
  assert.ok(cells.length >= 28);
  const bookLine = homeCard.formatFunBookText(2811000000, 'zh-CN', 0.99);
  assert.match(bookLine, /平凡的世界/);
  assert.equal(effortSlider.detectEffortFromText('Gemini 4 Neon (High)'), 'high');
  assert.equal(effortSlider.detectEffortFromText('Gemini 4 Neon (XHigh)'), 'xhigh');
  const parsedXHigh = effortSlider.parseModelLabel('Gemini 4 Neon Extra High');
  assert.equal(parsedXHigh.base, 'Gemini 4 Neon');
  assert.equal(parsedXHigh.effort, 'xhigh');
  assert.equal(parsedXHigh.effortLabel, 'Extra High');
  assert.equal(effortSlider.extractModelFamily('Gemini 4 Neon (XHigh)'), 'gemini 4 neon');
  assert.equal(effortSlider.itemMatchesEffort('Gemini 4 Neon (XHigh)', 'high'), false);
  assert.equal(effortSlider.itemMatchesEffort('Gemini 4 Neon (High)', 'high'), true);
  assert.equal(effortSlider.itemMatchesEffort('Gemini 4 Neon (XHigh)', 'xhigh'), true);

  // Verify React Fiber model profile resolution & commitEffortOption argument order
  const calls = [];
  const mockCtx = {
    conversationId: 'conv-abc',
    selectedModel: { label: 'Gemini 4 Neon (High)', value: 'm1' },
    modelOptions: [
      { label: 'Gemini 4 Neon (Low)', value: 'm0' },
      { label: 'Gemini 4 Neon (High)', value: 'm1' },
      { label: 'Gemini 4 Neon (XHigh)', value: 'm2' },
      { label: 'Gemini 4 Argon (Low)', value: 'a0' },
      { label: 'Gemini 4 Argon (Medium)', value: 'a1' },
      { label: 'Gemini 4 Argon (High)', value: 'a2' },
    ],
    setModelConfigByLabelForConversation: (label, cid, keepOpen) => {
      calls.push({ type: 'model', label, cid, keepOpen });
    },
  };
  const prof = effortSlider.resolveActiveModelProfile(mockCtx, 'Gemini 4 Neon (High)');
  assert.equal(prof.currentEffort, 'high');
  assert.deepEqual(prof.levels.map((l) => l.id), ['low', 'high', 'xhigh']);
  const argonProf = effortSlider.resolveActiveModelProfile(mockCtx, '', 'Gemini 4 Argon');
  assert.deepEqual(argonProf.levels.map((l) => l.id), ['low', 'medium', 'high']);
  const xhighOpt = prof.levels.find((l) => l.id === 'xhigh').option;
  assert.equal(effortSlider.commitEffortOption(mockCtx, xhighOpt, false, true), true);
  assert.deepEqual(calls[0], { type: 'model', label: 'Gemini 4 Neon (XHigh)', cid: 'conv-abc', keepOpen: true });

  const orchCalls = [];
  const orchCtx = {
    selectedModel: { label: 'Orchestrator', value: 'orch' },
    orchPlanners: [
      { label: 'Gemini 4 Hydrogen (Medium)', value: 11 },
      { label: 'Gemini 4 Hydrogen (High)', value: 12 },
    ],
    orchDefaultPlanner: { label: 'Gemini 4 Hydrogen (Medium)', value: 11 },
    orchPick: { selected: 11, select: (val) => orchCalls.push(val) },
  };
  const orchProf = effortSlider.resolveActiveModelProfile(orchCtx, 'Orchestrator');
  assert.equal(orchProf.isOrchPlan, true);
  assert.equal(effortSlider.commitEffortOption(orchCtx, orchProf.levels[1].option, true, true), true);
  assert.deepEqual(orchCalls, [12]);
});

test('Merged v2.34.0 dictionaries (4000+ entries) translate accurately and protect code/paths', () => {
  assert.ok(Object.keys(zhCN.exact).length >= 4000, `Expected >=4000 zh-CN entries, got ${Object.keys(zhCN.exact).length}`);
  assert.ok(Array.isArray(zhCN.regex) && zhCN.regex.length >= 100);
  assert.ok(Object.keys(zhTW.exact).length >= 4000);

  const engineCN = domI18n.createTranslatorEngine({ language: 'zh-CN', ...zhCN });
  assert.equal(engineCN.translateText('  Settings  '), '  设置  ');
  assert.equal(engineCN.translateText('3 agents running'), '3 个智能体运行中');
  // Negative caching on misses does not corrupt unknown text
  assert.equal(engineCN.translateText('ZzzUnknownBrandTokenXYZ'), 'ZzzUnknownBrandTokenXYZ');
  assert.equal(engineCN.translateText('ZzzUnknownBrandTokenXYZ'), 'ZzzUnknownBrandTokenXYZ');

  // Strict code/path isolation
  assert.equal(domI18n.looksLikeCodeOrPath('C:\\Users\\gjs27\\app.asar'), true);
  assert.equal(domI18n.looksLikeCodeOrPath('src/backend/studio-main.js'), true);
  assert.equal(domI18n.looksLikeCodeOrPath('getUserStatus'), true);
  assert.equal(engineCN.translateText('C:\\Users\\gjs27\\Settings'), 'C:\\Users\\gjs27\\Settings');

  // Native menu & tray
  const menu = nativeI18n.translateMenuTemplate([{ label: '&File', submenu: [{ label: 'New Window' }] }], 'zh-CN');
  assert.equal(menu[0].label, '文件');
  assert.equal(menu[0].submenu[0].label, '新建窗口');
  assert.equal(nativeI18n.formatTrayAgentCount(2, 'zh-CN'), '2 个智能体运行中');
  assert.equal(nativeI18n.formatTrayAgentCount(0, 'en'), 'No agents running');

  // Verify model-selector elements are protected from DOM translation
  const mockPanelEl = {
    nodeType: 1,
    tagName: 'DIV',
    closest: (sel) => sel.indexOf('model-selector-panel') !== -1 ? mockPanelEl : null,
  };
  assert.equal(domI18n.shouldIgnoreElement(mockPanelEl), true);
});
