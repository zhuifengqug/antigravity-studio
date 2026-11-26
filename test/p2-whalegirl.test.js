'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const mascotSprites = require('../src/renderer/assets/mascot-sprites');
const mascotStage = require('../src/renderer/mascot-stage');
const { decodePng } = require('../scripts/build-mascot-assets');

const REQUIRED_SHEETS = [
  'idle',
  'idle-look',
  'thinking',
  'typing',
  'building',
  'conducting',
  'notification',
  'happy',
  'error',
  'sleeping',
  'poke-left',
  'poke-right',
  'tickle',
];

function createMockEnvironment(options) {
  const opts = options || {};
  const drawCalls = [];
  const fillCalls = [];
  const createdElements = [];
  const elementsById = new Map();
  let nextTimerId = 1;
  const timers = [];

  class MockElement {
    constructor(tagName) {
      this.tagName = String(tagName || 'div').toUpperCase();
      this.className = '';
      this.id = '';
      this.style = {};
      this.attributes = new Map();
      this.children = [];
      this.parentElement = null;
      this.parentNode = null;
      this.isConnected = true;
      this.listeners = new Map();
      this.width = 0;
      this.height = 0;
      this.textContent = '';
      createdElements.push(this);
    }

    setAttribute(k, v) {
      this.attributes.set(k, String(v));
    }

    getAttribute(k) {
      return this.attributes.has(k) ? this.attributes.get(k) : null;
    }

    removeAttribute(k) {
      this.attributes.delete(k);
    }

    hasAttribute(k) {
      return this.attributes.has(k);
    }

    appendChild(child) {
      if (child.parentElement) {
        child.parentElement.removeChild(child);
      }
      child.parentElement = this;
      child.parentNode = this;
      this.children.push(child);
      if (child.id) elementsById.set(child.id, child);
      return child;
    }

    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) this.children.splice(idx, 1);
      child.parentElement = null;
      child.parentNode = null;
      return child;
    }

    addEventListener(type, fn) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(fn);
    }

    dispatchEvent(type, ev) {
      const list = this.listeners.get(type) || [];
      for (const fn of list) fn(ev || { stopPropagation() {}, preventDefault() {}, clientX: 0, clientY: 0 });
    }

    getBoundingClientRect() {
      const w = parseFloat(this.style.width) || this.width || 98;
      const h = parseFloat(this.style.height) || this.height || 98;
      return { left: 0, top: 0, width: w, height: h, right: w, bottom: h };
    }

    getContext(kind) {
      if (kind !== '2d') return null;
      const canvasEl = this;
      return {
        imageSmoothingEnabled: true,
        fillStyle: '#000',
        globalCompositeOperation: 'source-over',
        clearRect() {},
        fillRect(x, y, w, h) {
          fillCalls.push({ canvas: canvasEl, x, y, w, h, fillStyle: this.fillStyle });
        },
        drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
          drawCalls.push({ canvas: canvasEl, img, sx, sy, sw, sh, dx, dy, dw, dh });
        },
      };
    }
  }

  const head = new MockElement('head');
  const documentElement = new MockElement('html');
  const body = new MockElement('body');
  const anchor = new MockElement('div');
  body.appendChild(anchor);

  const mockDocument = {
    hidden: Boolean(opts.hidden),
    head,
    documentElement,
    body,
    getElementById(id) {
      return elementsById.get(id) || null;
    },
    createElement(tag) {
      return new MockElement(tag);
    },
  };

  class MockImage {
    constructor() {
      this._src = '';
      this.onload = null;
    }
    set src(val) {
      this._src = val;
      if (typeof this.onload === 'function') this.onload();
    }
    get src() {
      return this._src;
    }
  }

  const mockWindow = {
    matchMedia() {
      return { matches: Boolean(opts.reducedMotion) };
    },
  };

  const saved = {
    document: global.document,
    window: global.window,
    Image: global.Image,
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout,
    sprites: global.__AG_STUDIO_MASCOT_SPRITES__,
    anchors: global.__AG_STUDIO_ANCHORS__,
  };

  global.document = mockDocument;
  global.window = mockWindow;
  global.Image = MockImage;
  global.setTimeout = (fn, ms) => {
    const id = nextTimerId++;
    timers.push({ id, fn, ms, cleared: false });
    return id;
  };
  global.clearTimeout = (id) => {
    const t = timers.find((x) => x.id === id);
    if (t) t.cleared = true;
  };
  global.__AG_STUDIO_MASCOT_SPRITES__ = opts.sprites === undefined ? mascotSprites : opts.sprites;
  global.__AG_STUDIO_ANCHORS__ = opts.anchors || null;

  return {
    anchor,
    drawCalls,
    fillCalls,
    timers,
    mockDocument,
    restore() {
      global.document = saved.document;
      global.window = saved.window;
      global.Image = saved.Image;
      global.setTimeout = saved.setTimeout;
      global.clearTimeout = saved.clearTimeout;
      global.__AG_STUDIO_MASCOT_SPRITES__ = saved.sprites;
      global.__AG_STUDIO_ANCHORS__ = saved.anchors;
    },
  };
}

test('mascot-sprites.js preserves crab, deepy, astra.dataUri, and adds whalegirl with 1px transparent gutters', () => {
  assert.ok(mascotSprites.crab && Object.keys(mascotSprites.crab).length >= 10);
  assert.ok(mascotSprites.deepy && Object.keys(mascotSprites.deepy).length >= 8);
  assert.ok(mascotSprites.astra && typeof mascotSprites.astra.dataUri === 'string');
  assert.ok(mascotSprites.astra.dataUri.startsWith('data:image/png;base64,'));
  assert.equal(typeof mascotSprites.whalegirlFrameMs, 'number');
  assert.ok(mascotSprites.whalegirl && typeof mascotSprites.whalegirl === 'object');

  for (const key of REQUIRED_SHEETS) {
    const sheet = mascotSprites.whalegirl[key];
    assert.ok(sheet, `missing whalegirl sheet: ${key}`);
    assert.ok(sheet.dataUri.startsWith('data:image/png;base64,'), `invalid dataUri for ${key}`);
    assert.equal(sheet.gutter, 1, `expected gutter=1 on whalegirl.${key}`);
    assert.deepEqual(sheet.box, [0, 0, 69, 66]);
    assert.ok(sheet.frames >= 1);
    assert.ok(Array.isArray(sheet.durs) && sheet.durs.length === sheet.frames);

    const pngBuf = Buffer.from(sheet.dataUri.slice('data:image/png;base64,'.length), 'base64');
    const decoded = decodePng(pngBuf);
    const cols = sheet.columns || sheet.frames;
    const rows = Math.ceil(sheet.frames / cols);
    assert.equal(decoded.width, cols * (sheet.box[2] + 1));
    assert.equal(decoded.height, rows * (sheet.box[3] + 1));

    // Verify the 1px vertical gutter column right after frame 0 is completely transparent
    const gutterX = sheet.box[2];
    for (let y = 0; y < decoded.height; y++) {
      const alpha = decoded.data[(y * decoded.width + gutterX) * 4 + 3];
      assert.equal(alpha, 0, `expected transparent gutter pixel at (${gutterX}, ${y}) for whalegirl.${key}`);
    }
  }

  for (const [name, sheet] of Object.entries(mascotSprites.deepy)) {
    assert.equal(sheet.gutter, 1, `expected gutter=1 on deepy.${name}`);
  }
  for (const [name, sheet] of Object.entries(mascotSprites.crab)) {
    assert.equal(sheet.gutter, 1, `expected gutter=1 on crab.${name}`);
  }

  const bundleBytes = fs.statSync(path.join(__dirname, '../src/renderer/assets/mascot-sprites.js')).size;
  assert.ok(bundleBytes < 350 * 1024, `mascot-sprites.js (${bundleBytes} bytes) exceeds 350 KB`);
});

test('mascot-stage.js renders whalegirl across states/reactions with tight hit rect, tabindex=-1, obscured & reduced-motion handling', () => {
  assert.equal(Object.keys(mascotStage.MASCOT_STATES).length, 9);

  const env = createMockEnvironment({
    anchors: {
      computeComposerTopInset: () => 0,
      detectMascotObstruction: () => true,
    },
  });

  try {
    const pokes = [];
    const stage = mascotStage.createMascotStage({
      style: 'whalegirl',
      state: 'idle',
      onPoke: (kind) => pokes.push(kind),
    });

    const stageEl = stage.element;
    const canvasEl = stageEl.children.find((c) => c.className === 'ags-mascot-canvas');
    const hitEl = stageEl.children.find((c) => c.className === 'ags-mascot-hit');

    assert.equal(canvasEl.width, 138);
    assert.equal(canvasEl.height, 132);
    assert.equal(hitEl.getAttribute('tabindex'), '-1');
    const hitW = parseInt(hitEl.style.width, 10);
    const hitH = parseInt(hitEl.style.height, 10);
    assert.ok(hitW > 0 && hitW < canvasEl.width, `expected tight hitW (${hitW}) < ${canvasEl.width}`);
    assert.ok(hitH > 0 && hitH < canvasEl.height, `expected tight hitH (${hitH}) < ${canvasEl.height}`);

    stage.mountTo(env.anchor);
    assert.equal(stageEl.getAttribute('data-obscured'), 'true');
    assert.equal(stageEl.getAttribute('data-mascot-style'), 'whalegirl');
    assert.ok(env.drawCalls.length >= 1, 'expected initial drawImage for idle');

    const statesToCycle = Object.keys(mascotStage.MASCOT_STATES).filter((s) => s !== 'idle');
    statesToCycle.push('idle');
    for (const st of statesToCycle) {
      env.drawCalls.length = 0;
      stage.update({ state: st });
      assert.ok(env.drawCalls.length >= 1, `expected drawImage for state ${st}`);
      const last = env.drawCalls[env.drawCalls.length - 1];
      assert.equal(last.sw, 69);
      assert.equal(last.sh, 66);
      assert.equal(last.dw, 138);
      assert.equal(last.dh, 132);
    }

    // Trigger poke-left, poke-right, tickle reactions
    hitEl.dispatchEvent('click', { stopPropagation() {}, clientX: 5, clientY: 10 });
    hitEl.dispatchEvent('click', { stopPropagation() {}, clientX: hitW - 5, clientY: 10 });
    hitEl.dispatchEvent('click', { stopPropagation() {}, clientX: 10, clientY: 10 });
    hitEl.dispatchEvent('click', { stopPropagation() {}, clientX: 10, clientY: 10 });
    assert.deepEqual(pokes, ['poke-left', 'poke-right', 'poke-left', 'tickle']);

    stage.destroy();
  } finally {
    env.restore();
  }
});

test('mascot-stage.js honors 1px gutter drawImage source coordinates across whalegirl, deepy, and crab', () => {
  const fakeSprites = {
    crabFrameMs: 80,
    deepyFrameMs: 90,
    whalegirlFrameMs: 100,
    whalegirl: {
      idle: { dataUri: 'data:image/png;base64,wg', frames: 4, columns: 4, box: [0, 0, 69, 66], still: 2, gutter: 1, durs: [120, 120, 120, 120] },
    },
    deepy: {
      idle: { dataUri: 'data:image/png;base64,dp', frames: 4, columns: 4, box: [12, 26, 36, 24], still: 1, gutter: 1 },
    },
    crab: {
      idle: { body: 'data:image/png;base64,cb', ink: '', frames: 10, columns: 8, box: [24, 20, 24, 16], still: 9, gutter: 1 },
    },
  };

  const env = createMockEnvironment({ sprites: fakeSprites });
  try {
    const stage = mascotStage.createMascotStage({ style: 'whalegirl', state: 'idle' });
    stage.mountTo(env.anchor);

    // Frame 0 -> sx = 0
    assert.equal(env.drawCalls[env.drawCalls.length - 1].sx, 0);
    // Advance timer 3 times to frame 3 -> sx = 3 * (69 + 1) = 210
    for (let i = 0; i < 3; i++) {
      const pending = env.timers.filter((t) => !t.cleared);
      const t = pending[pending.length - 1];
      t.cleared = true;
      t.fn();
    }
    const wgCall = env.drawCalls[env.drawCalls.length - 1];
    assert.equal(wgCall.sx, 3 * (69 + 1));
    assert.equal(wgCall.sy, 0);

    // Switch to crab and advance to frame 9 (row 1, col 1 with columns=8, gutter=1)
    env.drawCalls.length = 0;
    stage.update({ style: 'clawd', state: 'idle' });
    for (let i = 0; i < 9; i++) {
      const pending = env.timers.filter((t) => !t.cleared);
      const t = pending[pending.length - 1];
      t.cleared = true;
      t.fn();
    }
    const crabCall = env.drawCalls[env.drawCalls.length - 1];
    assert.equal(crabCall.sx, (9 % 8) * (24 + 1));
    assert.equal(crabCall.sy, Math.floor(9 / 8) * (16 + 1));

    stage.destroy();
  } finally {
    env.restore();
  }
});

test('mascot-stage.js stops loop on prefers-reduced-motion / document.hidden and draws pixel fallback without sprites', () => {
  const reducedEnv = createMockEnvironment({ reducedMotion: true });
  try {
    const s1 = mascotStage.createMascotStage({ style: 'whalegirl', state: 'idle' });
    s1.mountTo(reducedEnv.anchor);
    assert.equal(reducedEnv.timers.filter((t) => !t.cleared).length, 0);
    s1.destroy();
  } finally {
    reducedEnv.restore();
  }

  const hiddenEnv = createMockEnvironment({ hidden: true });
  try {
    const s2 = mascotStage.createMascotStage({ style: 'whalegirl', state: 'idle' });
    s2.mountTo(hiddenEnv.anchor);
    assert.equal(hiddenEnv.timers.filter((t) => !t.cleared).length, 0);
    s2.destroy();
  } finally {
    hiddenEnv.restore();
  }

  const fallbackEnv = createMockEnvironment({ sprites: null });
  try {
    const s3 = mascotStage.createMascotStage({ style: 'whalegirl', state: 'idle' });
    s3.mountTo(fallbackEnv.anchor);
    assert.ok(fallbackEnv.fillCalls.length >= 1);
    s3.destroy();
  } finally {
    fallbackEnv.restore();
  }
});
