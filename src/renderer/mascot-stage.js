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
        ctx.fillStyle = cur.style === 'deepy' ? '#3B82F6' : '#D97757';
        ctx.fillRect(28, 36, 48, 28);
        return;
      }

      var sheetKey = STATE_TO_SHEET[logicalKey] || 'idle';

      if (cur.style === 'deepy') {
        var dSheet = (sprites.deepy && (sprites.deepy[sheetKey] || sprites.deepy.idle)) || null;
        if (!dSheet) return;
        var dEntry = loadSpriteImage(dSheet.dataUri, drawFrame);
        if (!dEntry || !dEntry.loaded) return;
        var df = isMotionReduced() ? (dSheet.still || 0) : (frameIdx % dSheet.frames);
        var dCols = dSheet.columns || dSheet.frames;
        var db = dSheet.box; // [x, y, w, h] in 52x52 logical grid
        var dsx = (df % dCols) * db[2];
        var dsy = Math.floor(df / dCols) * db[3];
        ctx.drawImage(dEntry.img, dsx, dsy, db[2], db[3], db[0] * 2, db[1] * 2, db[2] * 2, db[3] * 2);
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
      var csx = (cf % cCols) * cb[2];
      var csy = Math.floor(cf / cCols) * cb[3];

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
      if (logicalKey === 'sleeping') return 950;
      if (logicalKey === 'idle') return cur.style === 'astra' ? 280 : 180;
      if (cur.style === 'astra') {
        return logicalKey === 'error' ? 85 : 130;
      }
      var sprites = getSprites();
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
