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
const domAnchors = require('../src/renderer/dom-anchors');
const domI18n = require('../src/i18n/dom-runtime');
const nativeI18n = require('../src/i18n/native-i18n');
const { scanLocalFonts } = require('../src/backend/font-scanner');
const { getDefaultConfig } = require('../src/shared/constants');

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
  assert.match(agDarkCss, /html,\s*body,\s*#root/);
  assert.match(agDarkCss, /aside:not\(\.ags-drawer\)/);
  assert.doesNotMatch(agDarkCss, /aside,\s*nav/);

  const fourColor = themes.buildCustomThemeFromColors('Ocean', {
    accent: '#0EA5E9',
    bgCanvas: '#0F172A',
    bgSidebar: '#1E293B',
    textPrimary: '#F8FAFC',
  });
  assert.equal(fourColor.dark.accent, '#0EA5E9');
  assert.equal(fourColor.dark.bgCanvas, '#0F172A');
  assert.equal(fourColor.dark.bgSidebar, '#1E293B');
  assert.equal(fourColor.dark.textPrimary, '#F8FAFC');
  assert.ok(fourColor.dark.bgSurface);
  assert.ok(fourColor.dark.border);

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
  assert.equal(getDefaultConfig().theme.fonts.code, 'jetbrains');
  assert.ok(mascotSprites.crab && Object.keys(mascotSprites.crab).length >= 10);
  assert.ok(mascotSprites.deepy && Object.keys(mascotSprites.deepy).length >= 8);
  assert.ok(mascotSprites.astra && mascotSprites.astra.dataUri && mascotSprites.astra.dataUri.startsWith('data:image/png;base64,'));
  assert.equal(Object.keys(mascotStage.MASCOT_STATES).length, 9);
  for (const state of Object.keys(mascotStage.MASCOT_STATES)) {
    const svg = mascotStage.renderAstraSvg(state, 0);
    assert.match(svg, /<svg /);
  }
  for (const st of ['thinking', 'waiting', 'happy', 'error', 'sleeping']) {
    const grid = mascotStage.buildAstraFrames(st)[0];
    if (st === 'thinking') {
      assert.equal(grid[10][9], 'C');
      assert.equal(grid[10][14], 'C');
      assert.equal(grid[8][9], 'N');
    } else if (st === 'waiting') {
      assert.equal(grid[9][9], 'G');
      assert.equal(grid[9][14], 'G');
      assert.notEqual(grid[9][10], 'G');
    } else if (st === 'happy') {
      assert.equal(grid[9][9], 'M');
      assert.equal(grid[9][14], 'M');
      assert.notEqual(grid[10][9], 'N');
    } else if (st === 'error') {
      assert.equal(grid[9][8], 'R');
      assert.equal(grid[9][13], 'R');
      assert.notEqual(grid[9][9], 'R');
    } else if (st === 'sleeping') {
      assert.equal(grid[11][9], 'C');
      assert.equal(grid[11][14], 'C');
      assert.equal(grid[12][9], 'P');
      assert.equal(grid[12][14], 'P');
    }
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

  assert.ok(effortSlider.upstream && effortSlider.coexist);
  const parsedXHigh = effortSlider.parseModelLabel('Gemini 4 Neon (XHigh)');
  assert.equal(parsedXHigh.base, 'Gemini 4 Neon');
  assert.equal(parsedXHigh.effort, 'xhigh');
  assert.equal(parsedXHigh.effortLabel, 'Extra');
  const parsedExtra = effortSlider.parseModelLabel('Gemini 4 Neon (Extra)');
  assert.equal(parsedExtra.effort, 'xhigh');
  assert.equal(parsedExtra.effortLabel, 'Extra');
  assert.match(effortSlider.fillBackgroundFor(0.75, 0, 0.5, false), /linear-gradient|#/);

  const neonLow = { label: 'Gemini 4 Neon (Low)', modelId: 'gemini-4-neon-low', value: 1534 };
  const neonMed = { label: 'Gemini 4 Neon (Medium)', modelId: 'gemini-4-neon-medium', value: 1533 };
  const neonHigh = { label: 'Gemini 4 Neon (High)', modelId: 'gemini-4-neon-high', value: 1532 };
  const neonXHigh = { label: 'Gemini 4 Neon (XHigh)', modelId: 'gemini-4-neon-xhigh', value: 1535 };
  const opusLow = { label: 'Claude Opus 5.5 (Low)', modelId: 'claude-opus-5-5-low', value: 1400 };
  const opusMed = { label: 'Claude Opus 5.5 (Medium)', modelId: 'claude-opus-5-5-medium', value: 1401 };
  const opusHigh = { label: 'Claude Opus 5.5 (High)', modelId: 'claude-opus-5-5-high', value: 1402 };
  const orchNeon = { label: 'Orchestrator (Neon)', modelId: 'gemini-pro-orchestrator-neon', value: 1537 };
  const gptOss = { label: 'GPT-OSS 120B (Medium)', modelId: 'gpt-oss-120b-medium', value: 342 };

  const slugIdx = new Map([
    ['gemini-4-neon', new Map([['low', neonLow], ['medium', neonMed], ['high', neonHigh], ['xhigh', neonXHigh]])],
    ['claude-opus-5-5', new Map([['low', opusLow], ['medium', opusMed], ['high', opusHigh]])],
  ]);
  const modelOptions = [neonLow, neonMed, neonHigh, neonXHigh, opusLow, opusMed, opusHigh, orchNeon, gptOss];
  const normIdx = effortSlider.normalizeEffortIndex(slugIdx, modelOptions);
  assert.equal(normIdx.has('Gemini 4 Neon'), true);
  assert.equal(normIdx.has('Claude Opus 5.5'), true);

  const neonProf = effortSlider.resolveModelEffortProfile({ effortIndex: slugIdx, modelOptions, selectedModel: neonXHigh }, neonXHigh);
  assert.equal(neonProf.locked, false);
  assert.equal(neonProf.baseName, 'Gemini 4 Neon');
  assert.deepEqual(neonProf.levels.map((l) => l.effort), ['low', 'medium', 'high', 'xhigh']);
  assert.equal(neonProf.currentEffort, 'xhigh');
  assert.equal(neonProf.currentLabel, 'Extra');
  assert.equal(neonProf.theme, 'codex');

  const claudeProf = effortSlider.resolveModelEffortProfile({ effortIndex: normIdx, modelOptions, selectedModel: opusHigh }, 'Claude Opus 5.5');
  assert.equal(claudeProf.locked, false);
  assert.equal(claudeProf.isClaude, true);
  assert.equal(claudeProf.theme, 'claude');

  const singleProf = effortSlider.resolveModelEffortProfile({ effortIndex: normIdx, modelOptions, selectedModel: gptOss }, gptOss);
  assert.equal(singleProf.locked, true);

  const planners = [neonLow, neonMed, neonHigh, neonXHigh, opusLow, opusHigh];
  const orchCtx = {
    effortIndex: normIdx,
    modelOptions: [...planners, orchNeon],
    selectedModel: orchNeon,
    orchPlanners: planners,
    orchIdx: effortSlider.normalizeEffortIndex(new Map(), planners),
    orchDef: neonXHigh,
    orchPick: { model: null, select: () => {} },
  };
  const orchDefProf = effortSlider.resolveModelEffortProfile(orchCtx, orchNeon);
  assert.equal(orchDefProf.isOrchestrator, true);
  assert.equal(orchDefProf.orchestratorTunable, true);
  assert.equal(orchDefProf.baseName, 'Gemini 4 Neon');
  assert.equal(orchDefProf.currentEffort, 'xhigh');

  const orchCustomProf = effortSlider.resolveModelEffortProfile({ ...orchCtx, orchPick: { model: 1402, select: () => {} } }, orchNeon);
  assert.equal(orchCustomProf.baseName, 'Claude Opus 5.5');
  assert.equal(orchCustomProf.isClaude, true);
  assert.equal(orchCustomProf.currentEffort, 'high');

  const ctrl = effortSlider.createEffortSliderController();
  ctrl.sync({ fx: { effortSlider: true }, i18n: { language: 'zh-CN' } });
  ctrl.sync({ fx: { effortSlider: false }, i18n: { language: 'zh-CN' } });
  ctrl.destroy();
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

test('Mascot composer top anchor prefers inputBox, tracks top inset, and detects host overlap', () => {
  function makeMockNode(overrides) {
    const attrs = Object.assign({}, overrides && overrides.attrs);
    return Object.assign({
      isConnected: true,
      hidden: false,
      style: {},
      className: '',
      children: [],
      id: '',
      hasAttribute: (k) => Object.prototype.hasOwnProperty.call(attrs, k),
      getAttribute: (k) => (Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null),
      setAttribute: (k, v) => { attrs[k] = String(v); },
      closest: () => null,
      getClientRects: () => [{ width: 300, height: 40 }],
      getBoundingClientRect: () => ({ left: 0, right: 300, top: 500, bottom: 600, width: 300, height: 100 }),
    }, overrides || {});
  }

  const cardNode = makeMockNode({});
  const inputBoxNode = makeMockNode({});
  assert.equal(domAnchors.ensureComposerTopAnchor({ inputBox: inputBoxNode, card: cardNode }), inputBoxNode);
  assert.equal(inputBoxNode.style.position, 'relative');
  assert.equal(inputBoxNode.getAttribute('data-ags-mascot-anchor'), '1');
  assert.equal(domAnchors.ensureComposerTopAnchor({ card: cardNode }), cardNode);
  assert.equal(cardNode.getAttribute('data-ags-mascot-anchor'), '1');

  // When a visible queued-messages wrapper is at the top of inputBox, inset is 0
  const queuedWrap = makeMockNode({
    getBoundingClientRect: () => ({ left: 0, right: 300, top: 500, bottom: 548, width: 300, height: 48 }),
  });
  const surfaceComposer = makeMockNode({
    getBoundingClientRect: () => ({ left: 0, right: 300, top: 556, bottom: 620, width: 300, height: 64 }),
  });
  const anchorWithQueued = makeMockNode({
    children: [queuedWrap, surfaceComposer],
    getBoundingClientRect: () => ({ left: 0, right: 300, top: 500, bottom: 620, width: 300, height: 120 }),
  });
  assert.equal(domAnchors.computeComposerTopInset(anchorWithQueued), 0);

  // When earlier wrapper is hidden / 0-height, inset equals offset down to surfaceComposer
  const hiddenWrap = makeMockNode({
    style: { display: 'none' },
    getClientRects: () => [],
    getBoundingClientRect: () => ({ left: 0, right: 0, top: 500, bottom: 500, width: 0, height: 0 }),
  });
  const anchorNoQueued = makeMockNode({
    children: [hiddenWrap, surfaceComposer],
    getBoundingClientRect: () => ({ left: 0, right: 300, top: 540, bottom: 620, width: 300, height: 80 }),
  });
  assert.equal(domAnchors.computeComposerTopInset(anchorNoQueued), 16);

  // Obstruction detection against queued-messages-card and previousSibling buttons
  const prevDoc = global.document;
  try {
    const hitEl = makeMockNode({
      getBoundingClientRect: () => ({ left: 220, right: 280, top: 448, bottom: 500, width: 60, height: 52 }),
    });
    const stageEl = makeMockNode({
      querySelector: (sel) => sel === '.ags-mascot-hit' ? hitEl : null,
    });
    let queuedCard = makeMockNode({
      getBoundingClientRect: () => ({ left: 20, right: 290, top: 460, bottom: 500, width: 270, height: 40 }),
    });
    let siblingBtn = null;
    const prevSib = makeMockNode({
      querySelectorAll: () => siblingBtn ? [siblingBtn] : [],
    });
    const hostAnchor = makeMockNode({ previousElementSibling: prevSib });
    global.document = {
      querySelectorAll: () => queuedCard ? [queuedCard] : [],
    };
    assert.equal(domAnchors.detectMascotObstruction(stageEl, hostAnchor), true);

    // Move queued card below mascot hit rect (no overlap)
    queuedCard = makeMockNode({
      getBoundingClientRect: () => ({ left: 20, right: 290, top: 502, bottom: 550, width: 270, height: 48 }),
    });
    assert.equal(domAnchors.detectMascotObstruction(stageEl, hostAnchor), false);

    // Overlapping button inside anchor's previousSibling triggers obstruction
    siblingBtn = makeMockNode({
      getBoundingClientRect: () => ({ left: 210, right: 265, top: 470, bottom: 494, width: 55, height: 24 }),
    });
    assert.equal(domAnchors.detectMascotObstruction(stageEl, hostAnchor), true);
  } finally {
    global.document = prevDoc;
  }
});
