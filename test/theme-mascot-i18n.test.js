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
const prismFx = require('../src/renderer/prism-fx');
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

test('extractConversationId prefers visible conversation-view and traverses deep Fiber/Context Redux store', () => {
  const prevWin = global.window;
  const prevDoc = global.document;
  try {
    const hiddenId = '11111111-1111-4111-8111-111111111111';
    const visibleId = '22222222-2222-4222-8222-222222222222';
    const reduxId = '33333333-3333-4333-8333-333333333333';

    function makeViewNode(cid, visible) {
      return {
        id: '',
        isConnected: true,
        hidden: false,
        style: {},
        className: '',
        closest: () => null,
        querySelector: () => null,
        hasAttribute: () => false,
        getAttribute: (k) => k === 'data-cascade-id' ? cid : null,
        getClientRects: () => visible ? [{ width: 600, height: 400 }] : [],
      };
    }

    const hiddenView = makeViewNode(hiddenId, false);
    const visibleView = makeViewNode(visibleId, true);

    global.window = { location: { pathname: '/', hash: '', search: '', href: 'https://127.0.0.1:24807/' } };
    global.document = {
      querySelector: () => null,
      querySelectorAll: (sel) => sel.indexOf('conversation-view') !== -1 ? [hiddenView, visibleView] : [],
    };
    assert.equal(domAnchors.extractConversationId(), visibleId);

    // Fallback to deep Fiber dependencies.firstContext when view has no data-cascade-id
    let fiberRoot = {
      memoizedProps: {},
      dependencies: {
        firstContext: {
          memoizedValue: {
            store: { getState: () => ({ conversation: { convoState: { type: 'active', cascadeId: reduxId } } }) },
          },
          next: null,
        },
      },
      return: null,
    };
    let leaf = fiberRoot;
    for (let i = 0; i < 120; i++) {
      leaf = { memoizedProps: {}, return: leaf };
    }
    const bareView = makeViewNode('conversation', true);
    bareView.__reactFiber$test = leaf;
    global.document = {
      querySelector: () => null,
      querySelectorAll: (sel) => sel.indexOf('conversation-view') !== -1 ? [bareView] : [],
    };
    assert.equal(domAnchors.extractConversationId(), reduxId);
  } finally {
    global.window = prevWin;
    global.document = prevDoc;
  }
});

function createTestFakeDom() {
  const docListeners = new Map();
  const winListeners = new Map();
  const store = new Map();

  function addL(map, type, fn, opts) {
    if (!map.has(type)) map.set(type, []);
    map.get(type).push({ fn, capture: Boolean(opts === true || (opts && opts.capture)) });
  }
  function remL(map, type, fn, opts) {
    const arr = map.get(type);
    if (!arr) return;
    const cap = Boolean(opts === true || (opts && opts.capture));
    const idx = arr.findIndex((r) => r.fn === fn && r.capture === cap);
    if (idx >= 0) arr.splice(idx, 1);
  }
  function matchSimple(el, part) {
    let rest = String(part || '').trim();
    if (!rest) return false;
    if (rest === '*') return true;
    const tagM = /^[a-zA-Z0-9_-]+/.exec(rest);
    if (tagM) {
      if (el.tagName !== tagM[0].toUpperCase()) return false;
      rest = rest.slice(tagM[0].length);
    }
    while (rest) {
      if (rest[0] === '.') {
        const m = /^\.([a-zA-Z0-9_-]+)/.exec(rest);
        if (!m || !el.classList.contains(m[1])) return false;
        rest = rest.slice(m[0].length);
      } else if (rest[0] === '#') {
        const m = /^#([a-zA-Z0-9_-]+)/.exec(rest);
        if (!m || el.id !== m[1]) return false;
        rest = rest.slice(m[0].length);
      } else if (rest[0] === '[') {
        const m = /^\[([a-zA-Z0-9_-]+)(?:(\^=|\*=|=)["']?([^\]"']*)["']?)?\]/.exec(rest);
        if (!m) return false;
        const [, ak, op, av] = m;
        const cur = el.getAttribute(ak);
        if (!op) {
          if (!el.hasAttribute(ak)) return false;
        } else if (op === '=') {
          if (cur !== av) return false;
        } else if (op === '^=') {
          if (!cur || !cur.startsWith(av)) return false;
        } else if (op === '*=') {
          if (!cur || cur.indexOf(av) === -1) return false;
        }
        rest = rest.slice(m[0].length);
      } else {
        return false;
      }
    }
    return true;
  }
  function matchSelector(el, sel) {
    if (!el || el.nodeType !== 1) return false;
    return String(sel || '').split(',').some((raw) => {
      const tokens = raw.trim().split(/\s+/).filter(Boolean);
      if (!tokens.length || !matchSimple(el, tokens[tokens.length - 1])) return false;
      let cur = el.parentElement;
      for (let i = tokens.length - 2; i >= 0; i--) {
        while (cur && !matchSimple(cur, tokens[i])) cur = cur.parentElement;
        if (!cur) return false;
        cur = cur.parentElement;
      }
      return true;
    });
  }

  class FakeEl {
    constructor(nodeType, tagName = '', attrs = {}) {
      this.nodeType = nodeType;
      this.tagName = tagName ? tagName.toUpperCase() : '';
      this.parentNode = null;
      this.childNodes = [];
      this.ownerDocument = null;
      this.hidden = false;
      this.disabled = false;
      this.dataset = {};
      this._attrs = new Map();
      this._listeners = [];
      this._rect = { left: 0, top: 0, width: 320, height: 48, right: 320, bottom: 48 };
      this._clientRects = null;
      this._html = '';
      this.style = {
        _map: new Map(),
        setProperty: (k, v) => this.style._map.set(k, String(v)),
        getPropertyValue: (k) => this.style._map.get(k) || '',
        removeProperty: (k) => this.style._map.delete(k),
      };
      this.classList = {
        _set: new Set(),
        add: (...cs) => { cs.forEach((c) => c && this.classList._set.add(c)); this._syncCls(); },
        remove: (...cs) => { cs.forEach((c) => this.classList._set.delete(c)); this._syncCls(); },
        toggle: (c, f) => {
          const on = f === undefined ? !this.classList._set.has(c) : Boolean(f);
          if (on) this.classList._set.add(c); else this.classList._set.delete(c);
          this._syncCls();
          return on;
        },
        contains: (c) => this.classList._set.has(c),
      };
      for (const [k, v] of Object.entries(attrs)) this.setAttribute(k, v);
    }
    _syncCls() { this._attrs.set('class', [...this.classList._set].join(' ')); }
    get parentElement() { return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null; }
    get children() { return this.childNodes.filter((c) => c.nodeType === 1); }
    get firstChild() { return this.childNodes[0] || null; }
    get firstElementChild() { return this.children[0] || null; }
    get nextSibling() {
      if (!this.parentNode) return null;
      const idx = this.parentNode.childNodes.indexOf(this);
      return idx >= 0 ? this.parentNode.childNodes[idx + 1] || null : null;
    }
    get nextElementSibling() {
      let cur = this.nextSibling;
      while (cur && cur.nodeType !== 1) cur = cur.nextSibling;
      return cur || null;
    }
    get previousElementSibling() {
      if (!this.parentNode) return null;
      const ch = this.parentNode.children;
      const idx = ch.indexOf(this);
      return idx > 0 ? ch[idx - 1] : null;
    }
    get isConnected() {
      let cur = this;
      while (cur) {
        if (cur === doc.documentElement) return true;
        cur = cur.parentNode;
      }
      return false;
    }
    get id() { return this._attrs.get('id') || ''; }
    set id(v) { this.setAttribute('id', v); }
    get className() { return this._attrs.get('class') || ''; }
    set className(v) {
      this.classList._set = new Set(String(v || '').split(/\s+/).filter(Boolean));
      this._syncCls();
    }
    get textContent() {
      if (this.nodeType === 3) return this.nodeValue || '';
      return this.childNodes.map((c) => c.textContent).join('');
    }
    set textContent(v) {
      if (this.nodeType === 3) { this.nodeValue = String(v ?? ''); return; }
      for (const c of this.childNodes) c.parentNode = null;
      this.childNodes = [];
      const s = String(v ?? '');
      if (s) this.appendChild(doc.createTextNode(s));
    }
    get innerHTML() { return this._html; }
    set innerHTML(v) {
      this._html = String(v ?? '');
      for (const c of this.childNodes) c.parentNode = null;
      this.childNodes = [];
    }
    setAttribute(k, v) {
      const s = String(v);
      this._attrs.set(k, s);
      if (k === 'disabled') this.disabled = true;
      if (k === 'class') this.classList._set = new Set(s.split(/\s+/).filter(Boolean));
    }
    getAttribute(k) { return this._attrs.has(k) ? this._attrs.get(k) : null; }
    hasAttribute(k) { return this._attrs.has(k); }
    removeAttribute(k) {
      this._attrs.delete(k);
      if (k === 'disabled') this.disabled = false;
      if (k === 'class') this.classList._set.clear();
    }
    appendChild(child) {
      if (child.parentNode) child.parentNode.removeChild(child);
      child.parentNode = this;
      child.ownerDocument = doc;
      this.childNodes.push(child);
      return child;
    }
    insertBefore(child, ref) {
      if (!ref) return this.appendChild(child);
      if (child.parentNode) child.parentNode.removeChild(child);
      const idx = this.childNodes.indexOf(ref);
      child.parentNode = this;
      child.ownerDocument = doc;
      if (idx < 0) this.childNodes.push(child);
      else this.childNodes.splice(idx, 0, child);
      return child;
    }
    removeChild(child) {
      const idx = this.childNodes.indexOf(child);
      if (idx >= 0) { this.childNodes.splice(idx, 1); child.parentNode = null; }
      return child;
    }
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }
    contains(other) {
      let cur = other;
      while (cur) { if (cur === this) return true; cur = cur.parentNode; }
      return false;
    }
    matches(sel) { return matchSelector(this, sel); }
    closest(sel) {
      let cur = this;
      while (cur && cur.nodeType === 1) {
        if (matchSelector(cur, sel)) return cur;
        cur = cur.parentElement;
      }
      return null;
    }
    querySelectorAll(sel) {
      const out = [];
      const walk = (n) => {
        for (const c of n.childNodes) {
          if (c.nodeType === 1) {
            if (matchSelector(c, sel)) out.push(c);
            walk(c);
          }
        }
      };
      walk(this);
      return out;
    }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    getBoundingClientRect() { return this._rect; }
    getClientRects() { return this._clientRects || (this.hidden ? [] : [this._rect]); }
    getContext() {
      return {
        clearRect() {}, fillRect() {}, save() {}, restore() {},
        createLinearGradient() { return { addColorStop() {} }; },
      };
    }
    addEventListener(type, fn, opts) {
      this._listeners.push({ type, fn, capture: Boolean(opts === true || (opts && opts.capture)) });
    }
    removeEventListener(type, fn, opts) {
      const cap = Boolean(opts === true || (opts && opts.capture));
      const idx = this._listeners.findIndex((r) => r.type === type && r.fn === fn && r.capture === cap);
      if (idx >= 0) this._listeners.splice(idx, 1);
    }
    dispatchEvent(ev) {
      ev.target = ev.target || this;
      ev.type = ev.type || 'click';
      ev.preventDefault = ev.preventDefault || (() => { ev.defaultPrevented = true; });
      ev.stopPropagation = ev.stopPropagation || (() => { ev._stopped = true; });
      ev.stopImmediatePropagation = ev.stopImmediatePropagation || (() => { ev._stoppedImm = true; ev._stopped = true; });
      const chain = [];
      let cur = this;
      while (cur) { chain.push(cur); cur = cur.parentNode; }
      for (const rec of (docListeners.get(ev.type) || []).filter((r) => r.capture)) {
        if (ev._stoppedImm) break;
        rec.fn(ev);
      }
      for (let i = chain.length - 1; i >= 0 && !ev._stopped; i--) {
        for (const rec of chain[i]._listeners.filter((r) => r.type === ev.type && r.capture)) {
          if (ev._stoppedImm) break;
          rec.fn.call(chain[i], ev);
        }
      }
      for (let i = 0; i < chain.length && !ev._stopped; i++) {
        for (const rec of chain[i]._listeners.filter((r) => r.type === ev.type && !r.capture)) {
          if (ev._stoppedImm) break;
          rec.fn.call(chain[i], ev);
        }
      }
      if (!ev._stopped) {
        for (const rec of (docListeners.get(ev.type) || []).filter((r) => !r.capture)) {
          if (ev._stoppedImm) break;
          rec.fn(ev);
        }
      }
      return !ev.defaultPrevented;
    }
  }

  const doc = {
    nodeType: 9,
    hidden: false,
    readyState: 'complete',
    activeElement: null,
    createElement: (t, a) => { const n = new FakeEl(1, t, a); n.ownerDocument = doc; return n; },
    createTextNode: (txt) => { const n = new FakeEl(3); n.nodeValue = String(txt ?? ''); n.ownerDocument = doc; return n; },
    getElementById: (id) => doc.documentElement.querySelector(`#${id}`),
    querySelector: (s) => doc.documentElement.querySelector(s),
    querySelectorAll: (s) => doc.documentElement.querySelectorAll(s),
    contains: (n) => doc.documentElement.contains(n),
    addEventListener: (t, fn, opts) => addL(docListeners, t, fn, opts),
    removeEventListener: (t, fn, opts) => remL(docListeners, t, fn, opts),
    dispatch: (t, ev) => {
      const evt = Object.assign({ type: t }, ev || {});
      if (evt.target && typeof evt.target.dispatchEvent === 'function') return evt.target.dispatchEvent(evt);
      for (const rec of (docListeners.get(t) || []).slice()) rec.fn(evt);
      return true;
    },
  };
  doc.documentElement = doc.createElement('html');
  doc.head = doc.createElement('head');
  doc.body = doc.createElement('body');
  doc.documentElement.appendChild(doc.head);
  doc.documentElement.appendChild(doc.body);
  doc.activeElement = doc.body;

  const win = {
    document: doc,
    innerWidth: 1280,
    innerHeight: 800,
    location: { origin: 'https://127.0.0.1:24807', pathname: '/', hash: '', search: '', href: 'https://127.0.0.1:24807/' },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    addEventListener: (t, fn, opts) => addL(winListeners, t, fn, opts),
    removeEventListener: (t, fn, opts) => remL(winListeners, t, fn, opts),
    getComputedStyle: () => ({ position: 'static', display: 'block', visibility: 'visible', opacity: '1', backgroundColor: 'rgb(20, 20, 19)', getPropertyValue: () => '' }),
    AntigravityCodexEffortSlider: effortSlider.upstream,
  };
  doc.defaultView = win;
  return { doc, win };
}

test('v2.35 effort slider handles data-disabled locked trigger, High-default effortMemory, Orchestrator L2, and Studio patches', async () => {
  const { doc, win } = createTestFakeDom();
  const prevWin = global.window;
  const prevDoc = global.document;
  global.window = win;
  global.document = doc;
  try {
    // Patch (a): surfaceIsDark honors data-ags-mode
    doc.documentElement.setAttribute('data-ags-mode', 'light');
    assert.equal(effortSlider.upstream.surfaceIsDark(win, doc), false);
    doc.documentElement.setAttribute('data-ags-mode', 'dark');
    assert.equal(effortSlider.upstream.surfaceIsDark(win, doc), true);

    // Patch (b): parseModelLabel exported on upstream & effortSlider
    assert.equal(typeof effortSlider.upstream.parseModelLabel, 'function');
    assert.equal(effortSlider.upstream.parseModelLabel('Claude Opus 5.5 (High)').effort, 'high');

    const neonLow = { label: 'Gemini 4 Neon (Low)', value: 1534 };
    const neonMed = { label: 'Gemini 4 Neon (Medium)', value: 1533 };
    const neonHigh = { label: 'Gemini 4 Neon (High)', value: 1532 };
    const opusHigh = { label: 'Claude Opus 5.5 (High)', value: 1402 };
    const orchOpt = { label: 'Orchestrator (Neon)', modelId: 'gemini-pro-orchestrator-neon', value: 1537 };

    const effortIndex = new Map([
      ['Gemini 4 Neon', new Map([['low', neonLow], ['medium', neonMed], ['high', neonHigh]])],
      ['Claude Opus 5.5', new Map([['high', opusHigh]])],
    ]);

    const commits = [];
    const orchCommits = [];
    const fiberProps = {
      selectedModel: neonHigh,
      modelOptions: [neonLow, neonMed, neonHigh, opusHigh, orchOpt],
      effortIndex,
      orchestratorPlanners: [neonLow, neonMed, neonHigh, opusHigh],
      orchestratorPlannerIndex: effortIndex,
      orchestratorDefaultPlanner: neonHigh,
      orchestratorPick: {
        model: neonMed.value,
        select(v) {
          fiberProps.orchestratorPick.model = v;
          orchCommits.push(v);
        },
      },
      setModelConfigByLabelForConversation(lbl) {
        commits.push(lbl);
        const hit = [neonLow, neonMed, neonHigh, opusHigh, orchOpt].find((o) => o.label === lbl);
        if (hit) fiberProps.selectedModel = hit;
      },
    };

    // Deep fiber > 120 ancestors (< 600 limit)
    let providerFiber = { memoizedProps: { value: fiberProps }, return: null };
    let deepFiber = providerFiber;
    for (let i = 0; i < 150; i++) deepFiber = { memoizedProps: {}, return: deepFiber };

    const trig = doc.createElement('button', { 'data-testid': 'model-selector-trigger' });
    trig.__reactFiber$v235 = deepFiber;
    doc.body.appendChild(trig);

    const panel = doc.createElement('div', { 'data-testid': 'model-selector-panel' });
    const listWrap = doc.createElement('div');
    panel.appendChild(listWrap);
    const orchEntry = doc.createElement('div', { role: 'menuitem' });
    orchEntry.appendChild(doc.createElement('div', { 'data-testid': 'model-selector-orchestrator' }));
    listWrap.appendChild(orchEntry);
    panel.__reactFiber$v235 = deepFiber;
    doc.body.appendChild(panel);

    // Orchestrator L2 submenu + L3 effort submenu
    const l2Menu = doc.createElement('div', { role: 'menu' });
    const l2Row = doc.createElement('div', { role: 'menuitem', 'data-testid': 'orchestrator-picker-row', 'data-model-base': 'Gemini 4 Neon' });
    l2Row.textContent = 'Gemini 4 Neon';
    l2Menu.appendChild(l2Row);
    doc.body.appendChild(l2Menu);

    const l3Menu = doc.createElement('div', { role: 'menu', 'data-testid': 'orchestrator-picker-effort' });
    for (const lbl of ['Low', 'Medium', 'High']) {
      const it = doc.createElement('div', { role: 'menuitem' });
      it.textContent = lbl;
      l3Menu.appendChild(it);
    }
    doc.body.appendChild(l3Menu);

    // Sync via sliderCoexist (Patch (c): data-ag-studio-ignore & data-ag-no-i18n on owned nodes)
    const coexistCtl = effortSlider.coexist.createEffortSliderController({ window: win, document: doc });
    coexistCtl.sync({ effortSliderModule: 'on', effortMemory: true });

    const section = panel.querySelector('.ces-ag-section');
    assert.ok(section, 'effort slider section must mount in model selector panel');
    assert.equal(section.getAttribute('data-ag-studio-ignore'), 'true');
    assert.equal(section.getAttribute('data-ag-no-i18n'), 'true');

    // Verify Orchestrator L2 preserved & L3 hidden
    assert.equal(l2Menu.getAttribute('data-ag-cs-orch-l2'), '1');
    assert.equal(l2Menu.getAttribute('data-ag-cs-orch-l3'), null);
    assert.equal(l3Menu.getAttribute('data-ag-cs-orch-l3'), '1');

    // Locked trigger via data-disabled blocks commits, unlocking via data-disabled="false" resumes
    const sliderRoot = panel.querySelector('.ces-root');
    const track = panel.querySelector('.ces-track');
    assert.equal(sliderRoot.getAttribute('aria-disabled'), 'false');
    trig.setAttribute('data-disabled', '');
    coexistCtl.sync({ effortSliderModule: 'on', effortMemory: true });
    assert.equal(sliderRoot.getAttribute('aria-disabled'), 'true');
    assert.equal(track.classList.contains('is-locked'), true);
    commits.length = 0;
    sliderRoot.dispatchEvent({ type: 'keydown', key: 'ArrowLeft' });
    assert.deepEqual(commits, [], 'data-disabled trigger must block commits mid-turn');

    trig.setAttribute('data-disabled', 'false');
    coexistCtl.sync({ effortSliderModule: 'on', effortMemory: true });
    assert.equal(sliderRoot.getAttribute('aria-disabled'), 'false');
    sliderRoot.dispatchEvent({ type: 'keydown', key: 'ArrowLeft' });
    assert.deepEqual(commits, ['Gemini 4 Neon (Medium)']);

    // High-default effortMemory restore when effortSliderModule is off + effortMemory on
    const neonItem = doc.createElement('div', { role: 'menuitem' });
    const neonGrp = doc.createElement('span', { 'data-testid': 'model-selector-effort-group', 'data-model-base': 'Gemini 4 Neon' });
    neonGrp.textContent = 'Gemini 4 Neon';
    const neonSib = doc.createElement('span');
    neonSib.textContent = 'High';
    neonItem.appendChild(neonGrp);
    neonItem.appendChild(neonSib);
    listWrap.appendChild(neonItem);

    fiberProps.selectedModel = neonMed;
    coexistCtl.sync({ effortSliderModule: 'off', effortMemory: 'on' });
    fiberProps.selectedModel = opusHigh;
    coexistCtl.sync({ effortSliderModule: 'off', effortMemory: 'on' });
    assert.equal(neonSib.textContent, 'Medium');

    commits.length = 0;
    neonItem.dispatchEvent({ type: 'click', target: neonGrp });
    fiberProps.selectedModel = neonHigh; // host defaults to High in v2.35
    await new Promise((r) => setTimeout(r, 15));
    assert.deepEqual(commits, ['Gemini 4 Neon (Medium)']);

    coexistCtl.destroy();
  } finally {
    global.window = prevWin;
    global.document = prevDoc;
  }
});

test('v2.35 Split View scopes sniffDomTurnState per active pane and detects decision-card-blocking-ring & bottom-sticky-shelves', () => {
  const { doc, win } = createTestFakeDom();
  const prevWin = global.window;
  const prevDoc = global.document;
  global.window = win;
  global.document = doc;

  const CID1 = 'aaaaaaaa-1111-4111-8111-111111111111';
  const CID2 = 'bbbbbbbb-2222-4222-8222-222222222222';

  function buildPane(idx, cid, modelName) {
    const pane = doc.createElement('div', { 'data-tiling-pane': String(idx) });
    const cv = doc.createElement('div', { 'data-testid': 'conversation-view', 'data-cascade-id': cid });
    const box = doc.createElement('div', { 'data-testid': 'agent-input-box' });
    const card = doc.createElement('div', { class: 'surface-composer-card' });
    const editor = doc.createElement('div', { contenteditable: 'true' });
    const trig = doc.createElement('button', { 'data-testid': 'model-selector-trigger' });
    trig.textContent = modelName;
    card.appendChild(editor);
    card.appendChild(trig);
    box.appendChild(card);
    cv.appendChild(box);
    pane.appendChild(cv);
    doc.body.appendChild(pane);
    return { pane, cv, box, card, editor, trig };
  }

  const p1 = buildPane(1, CID1, 'Gemini 4 Neon (High)');
  const p2 = buildPane(2, CID2, 'Claude Sonnet 5.5');

  // Make Pane 1 actively running + thinking + decision-card-blocking-ring + error
  p1.card.appendChild(doc.createElement('button', { 'data-testid': 'input-cancel-button' }));
  p1.cv.appendChild(doc.createElement('button', { 'data-testid': 'thinking-collapsible-trigger', 'data-op-thought-state': 'streaming' }));
  p1.cv.appendChild(doc.createElement('div', { 'data-testid': 'decision-card-blocking-ring' }));
  p1.cv.appendChild(doc.createElement('div', { 'data-testid': 'agent-error' }));

  const disposeWatch = domAnchors.watchAnchors(() => {});
  try {
    // Focusing Pane 2 isolates idle state without Pane 1 leakage
    doc.dispatch('pointerdown', { target: p2.editor });
    const s2 = domAnchors.sniffDomTurnState();
    assert.equal(s2.conversationId, CID2);
    assert.equal(s2.isGenerating, false);
    assert.equal(s2.isThinking, false);
    assert.equal(s2.awaitingDecision, false);
    assert.equal(s2.hasError, false);
    assert.equal(s2.modelLabel, 'Claude Sonnet 5.5');
    assert.equal(domAnchors.findComposerTarget().card, p2.card);

    // Inline card slot inside Pane 2 triggers awaitingDecision only on Pane 2
    const inlineSlot = doc.createElement('div', { 'data-testid': 'agent-inline-card-slot' });
    p2.cv.appendChild(inlineSlot);
    assert.equal(domAnchors.sniffDomTurnState().awaitingDecision, true);
    inlineSlot.remove();
    assert.equal(domAnchors.sniffDomTurnState().awaitingDecision, false);

    // Focusing Pane 1 picks up Pane 1's running, thinking, blocking-ring, and error state
    doc.dispatch('focusin', { target: p1.editor });
    const s1 = domAnchors.sniffDomTurnState();
    assert.equal(s1.conversationId, CID1);
    assert.equal(s1.isGenerating, true);
    assert.equal(s1.isThinking, true);
    assert.equal(s1.awaitingDecision, true);
    assert.equal(s1.hasError, true);
    assert.equal(s1.modelLabel, 'Gemini 4 Neon (High)');

    // Disconnecting active Pane 1 falls back cleanly to surviving Pane 2
    p1.pane.remove();
    const sFallback = domAnchors.sniffDomTurnState();
    assert.equal(sFallback.conversationId, CID2);
    assert.equal(sFallback.isGenerating, false);

    // bottom-sticky-shelves obstruction detection + decision-card-blocking-ring overlap
    const hitEl = doc.createElement('div', { class: 'ags-mascot-hit' });
    hitEl._rect = { left: 220, right: 280, top: 448, bottom: 500, width: 60, height: 52 };
    const stageEl = doc.createElement('div', { class: 'ags-mascot-stage' });
    stageEl.appendChild(hitEl);
    const shelves = doc.createElement('div', { 'data-testid': 'bottom-sticky-shelves' });
    shelves._rect = { left: 0, right: 320, top: 440, bottom: 500, width: 320, height: 60 };
    const shelfBtn = doc.createElement('button');
    shelfBtn._rect = { left: 20, right: 120, top: 460, bottom: 492, width: 100, height: 32 };
    shelves.appendChild(shelfBtn);
    doc.body.appendChild(shelves);

    assert.equal(domAnchors.detectMascotObstruction(stageEl, p2.box), false, 'non-overlapping shelf button must not obstruct mascot');
    shelfBtn._rect = { left: 210, right: 275, top: 460, bottom: 492, width: 65, height: 32 };
    assert.equal(domAnchors.detectMascotObstruction(stageEl, p2.box), true, 'overlapping shelf button must obstruct mascot');

    shelves.remove();
    const ring = doc.createElement('div', { 'data-testid': 'decision-card-blocking-ring' });
    ring._rect = { left: 200, right: 290, top: 450, bottom: 495, width: 90, height: 45 };
    doc.body.appendChild(ring);
    assert.equal(domAnchors.detectMascotObstruction(stageEl, p2.box), true);
  } finally {
    disposeWatch();
    global.window = prevWin;
    global.document = prevDoc;
  }
});

test('themes.js covers v2.35 shell selectors, preserves plugin-theme-home-wallpaper, and syncs sidecar iframes without idle spam', () => {
  const css = themes.buildThemeCss({ activePreset: 'claude', colorMode: 'dark' });
  assert.match(css, /\[data-testid="sidebar-split"\]>div:first-child/);
  assert.match(css, /\.agy-inset-shell/);
  assert.match(css, /\.agy-sheet/);
  assert.match(css, /\[data-testid="tiling-splitter"\]/);
  assert.match(css, /\[data-testid="model-selector-trigger"\]:disabled/);
  assert.match(css, /\[data-testid="model-selector-trigger"\]\[aria-disabled="true"\]/);
  assert.match(css, /\[data-testid="model-selector-trigger"\]\[data-disabled\]/);
  assert.match(css, /\[data-testid="permissions-selector-trigger"\]\[data-disabled\]/);
  assert.match(css, /\.agy-home:not\(:has\(\[data-testid="plugin-theme-home-wallpaper"\]\)\)/);
  assert.match(css, /\.agy-home:has\(\[data-testid="plugin-theme-home-wallpaper"\]\)\s*\{[^}]*background-color:\s*transparent\s*!important/);

  const { doc, win } = createTestFakeDom();
  const prevWin = global.window;
  const prevDoc = global.document;
  global.window = win;
  global.document = doc;
  try {
    const slot = doc.createElement('div', { 'data-testid': 'sidecar-iframe-slot' });
    const iframe1 = doc.createElement('iframe', { src: 'plugin://swarm--panel/' });
    const posted1 = [];
    iframe1.contentWindow = { postMessage: (msg, origin) => posted1.push({ msg, origin }) };
    slot.appendChild(iframe1);
    doc.body.appendChild(slot);

    themes.applyThemeToDocument({ activePreset: 'claude', colorMode: 'dark' });
    assert.equal(posted1.length, 1);
    assert.deepEqual(posted1[0], {
      msg: { type: 'theme-change', theme: 'dark', isDark: true },
      origin: '*',
    });

    // Unchanged mode on idle tick causes zero duplicate postMessages
    assert.equal(themes.syncSidecarIframeThemes('dark'), 0);
    assert.equal(posted1.length, 1);

    // Newly mounted sidecar iframe receives current mode immediately
    const iframe2 = doc.createElement('iframe', { src: 'plugin://pulse--panel/' });
    const posted2 = [];
    iframe2.contentWindow = { postMessage: (msg, origin) => posted2.push({ msg, origin }) };
    slot.appendChild(iframe2);
    assert.equal(themes.syncSidecarIframeThemes('dark'), 1);
    assert.equal(posted1.length, 1);
    assert.equal(posted2.length, 1);

    // Mode change notifies both mounted iframes
    themes.applyThemeToDocument({ activePreset: 'claude', colorMode: 'light' });
    assert.equal(posted1.length, 2);
    assert.deepEqual(posted1[1].msg, { type: 'theme-change', theme: 'light', isDark: false });
    assert.equal(posted2.length, 2);
    assert.deepEqual(posted2[1].msg, { type: 'theme-change', theme: 'light', isDark: false });
  } finally {
    global.window = prevWin;
    global.document = prevDoc;
  }
});

test('home-overview-card deterministic model colors & topModel fallback, mascot tabindex="-1", and dynamic prism-fx highlight stylesheet', () => {
  const models12 = [
    'Gemini 4 Carbon',
    'Gemini 4 Neon',
    'Gemini 4 Hydrogen',
    'Gemini 3.1 Pro',
    'Orchestrator (Neon)',
    'Claude Opus 5.5',
    'Claude Sonnet 5.5',
    'GPT-5',
    'o3-mini',
    'OpenAI Codex',
    'DeepSeek R1',
    'Qwen 2.5 Max',
  ];
  const cmapA = homeCard.resolveHomeModelColours(models12);
  const cmapB = homeCard.resolveHomeModelColours([...models12].reverse());
  assert.deepEqual(cmapA, cmapB, 'model color resolution must be deterministic regardless of order');
  assert.equal(new Set(models12.map((m) => cmapA[m].dark)).size, models12.length);
  assert.equal(new Set(models12.map((m) => cmapA[m].light)).size, models12.length);
  assert.equal(cmapA['Gemini 4 Neon'].camp, 'gemini');
  assert.equal(cmapA['Claude Opus 5.5'].camp, 'claude');
  assert.equal(cmapA['GPT-5'].camp, 'gpt');
  assert.equal(cmapA['OpenAI Codex'].camp, 'gpt');
  assert.equal(cmapA['Orchestrator (Neon)'].camp, 'orchestrator');
  assert.equal(cmapA['DeepSeek R1'].camp, 'deepseek');

  // 30+ models triggers golden-angle HSL fallback cleanly with unique #RRGGBB hexes
  const models32 = Array.from({ length: 32 }, (_, i) => `Model-Custom-${i + 1}`);
  const cmap32 = homeCard.resolveHomeModelColours(models32);
  assert.equal(new Set(models32.map((m) => cmap32[m].dark)).size, 32);
  assert.equal(new Set(models32.map((m) => cmap32[m].light)).size, 32);
  for (const m of models32) {
    assert.match(cmap32[m].dark, /^#[0-9A-F]{6}$/);
    assert.match(cmap32[m].light, /^#[0-9A-F]{6}$/);
  }

  // topModel falls back to byModel[0]
  assert.equal(homeCard.resolveTopModel({ byModel: [{ model: 'Claude Opus 5.5', totalTokens: 12000 }] }), 'Claude Opus 5.5');
  assert.equal(homeCard.resolveTopModel({ topModel: 'Gemini 4 Neon', byModel: [{ model: 'Claude Opus 5.5' }] }), 'Gemini 4 Neon');

  const { doc, win } = createTestFakeDom();
  const prevWin = global.window;
  const prevDoc = global.document;
  global.window = win;
  global.document = doc;
  try {
    // Home overview card renders byModel[0] fallback and camp-aware swatch CSS vars
    const home = doc.createElement('div', { class: 'agy-home' });
    const greeting = doc.createElement('div', { 'data-testid': 'home-greeting' });
    const compBox = doc.createElement('div', { 'data-testid': 'agent-input-box' });
    const compCard = doc.createElement('div', { class: 'surface-composer-card' });
    compBox.appendChild(compCard);
    home.appendChild(greeting);
    home.appendChild(compBox);
    doc.body.appendChild(home);

    const cardCtl = homeCard.createHomeOverviewCard({ getConfig: () => ({ i18n: { language: 'en' } }) });
    const prevAnchors = global.window.__AG_STUDIO_ANCHORS__;
    global.window.__AG_STUDIO_ANCHORS__ = domAnchors;
    try {
      cardCtl.update({
        sessions: 3,
        calls: 9,
        totalTokens: 50000,
        activeDays: 2,
        peakHour: 14,
        byModel: [
          { model: 'Claude Opus 5.5', totalTokens: 32000 },
          { model: 'Gemini 4 Neon', totalTokens: 18000 },
        ],
      }, { homeOverview: true, i18n: { language: 'en' } });
      assert.match(cardCtl.element.innerHTML, /Claude Opus 5\.5/);
      cardCtl.element.dispatchEvent({
        type: 'click',
        target: { closest: (sel) => (sel === '[data-home-tab]' ? { getAttribute: () => 'models' } : null) },
      });
      assert.match(cardCtl.element.innerHTML, /--_mc-d:#F59E0B;--_mc-l:#D97706/);
      assert.match(cardCtl.element.innerHTML, /--_mc-d:#4F8BFF;--_mc-l:#2563EB/);
    } finally {
      cardCtl.destroy();
      global.window.__AG_STUDIO_ANCHORS__ = prevAnchors;
    }
    // Mascot hit target uses tabindex="-1"
    const stage = mascotStage.createMascotStage({ enabled: true, style: 'astra' });
    const hitEl = stage.element.querySelector('.ags-mascot-hit');
    assert.ok(hitEl);
    assert.equal(hitEl.getAttribute('tabindex'), '-1');
    stage.destroy();

    // Dynamic ::highlight(ags-ink-0..3) stylesheet attach/detach in prism-fx
    const fx = prismFx.createPrismFxController();
    const baseStyle = doc.getElementById('ag-studio-prism-fx-style');
    assert.ok(baseStyle);
    assert.doesNotMatch(baseStyle.textContent, /::highlight\(ags-ink-/);
    assert.equal(doc.getElementById('ag-studio-prism-ink-highlight-style'), null);

    fx.sync({ cfg: { fx: { inkStream: true, smoothCaret: true, edgeAura: true } }, isGenerating: true, auraPhase: 'running' });
    const hlStyleOn = doc.getElementById('ag-studio-prism-ink-highlight-style');
    assert.ok(hlStyleOn);
    assert.match(hlStyleOn.textContent, /::highlight\(ags-ink-0\)/);
    assert.match(hlStyleOn.textContent, /::highlight\(ags-ink-3\)/);

    fx.sync({ cfg: { fx: { inkStream: false, smoothCaret: true, edgeAura: true } }, isGenerating: true, auraPhase: 'running' });
    assert.equal(doc.getElementById('ag-studio-prism-ink-highlight-style'), null);

    fx.sync({ cfg: { fx: { inkStream: true, smoothCaret: true, edgeAura: true } }, isGenerating: true, auraPhase: 'running' });
    assert.ok(doc.getElementById('ag-studio-prism-ink-highlight-style'));
    fx.destroy();
    assert.equal(doc.getElementById('ag-studio-prism-ink-highlight-style'), null);
  } finally {
    global.window = prevWin;
    global.document = prevDoc;
  }
});
