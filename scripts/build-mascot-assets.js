'use strict';

/**
 * Antigravity Studio — Mascot Sprite Atlas Builder
 *
 * Reads Clawd (crab) and Deepy (whale) sprite sheets from REF_DSH when available,
 * optimizes Deepy sheets (5x -> 1x logical pixel cell sampling + keyframe stride)
 * so the combined bundle stays compact (< 180 KB), and emits:
 *   src/renderer/assets/mascot-sprites.js
 *
 * Zero external npm dependencies (uses Node.js built-in fs, path, zlib).
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'src', 'renderer', 'assets', 'mascot-sprites.js');
const DEFAULT_REF_DSH =
  'C:\\Users\\gjs27\\.gemini\\antigravity\\brain\\ea1dcc05-9f2b-4229-b691-c34bbe950222\\scratch\\refs\\dsh-claude-style';

const MAX_BUNDLE_BYTES = 350 * 1024;
const SHEET_GUTTER = 1;

// Subset of sheets from dsh-claude-style sheets.ts mapped to our 9+ states & reactions
const CRAB_SPECS = {
  idle: { frames: 24, box: [24, 20, 24, 16], still: 0 },
  'idle-look': { frames: 31, box: [24, 20, 24, 16], still: 0 },
  'idle-wave': { frames: 12, box: [24, 15, 24, 21], still: 0 },
  'idle-laptop': { frames: 43, box: [14, 13, 34, 23], still: 0 },
  thinking: { frames: 48, box: [20, 0, 30, 36], still: 24 },
  typing: { frames: 6, box: [15, 22, 28, 14], still: 0 },
  building: { frames: 6, box: [15, 19, 28, 17], still: 0 },
  conducting: { frames: 24, box: [20, 12, 29, 24], still: 0 },
  notification: { frames: 16, box: [24, 8, 24, 28], still: 0 },
  happy: { frames: 32, box: [18, 6, 34, 30], still: 3 },
  error: { frames: 24, box: [23, 11, 26, 25], still: 4 },
  sleeping: { frames: 32, box: [18, 1, 31, 35], still: 0 },
  waking: { frames: 12, box: [24, 4, 24, 32], still: 11 },
  'poke-left': { frames: 10, box: [24, 20, 27, 16], still: 0 },
  'poke-right': { frames: 10, box: [21, 20, 27, 16], still: 0 },
  tickle: { frames: 16, box: [23, 18, 26, 18], still: 0 },
};

const DEEPY_SPECS = {
  idle: { frames: 48, box: [12, 26, 36, 24], still: 0, maxKeep: 16 },
  'idle-look': { frames: 68, box: [11, 11, 37, 39], still: 0, maxKeep: 16 },
  thinking: { frames: 48, box: [0, 6, 47, 44], still: 20, maxKeep: 16 },
  typing: { frames: 48, box: [0, 17, 52, 33], still: 16, maxKeep: 16 },
  building: { frames: 48, box: [2, 0, 50, 50], still: 0, maxKeep: 16 },
  conducting: { frames: 48, box: [1, 0, 51, 50], still: 6, maxKeep: 16 },
  notification: { frames: 32, box: [3, 7, 47, 43], still: 12, maxKeep: 16 },
  happy: { frames: 52, box: [0, 5, 52, 45], still: 44, maxKeep: 16 },
  error: { frames: 48, box: [4, 17, 45, 33], still: 24, maxKeep: 16 },
  sleeping: { frames: 64, box: [2, 2, 44, 48], still: 10, maxKeep: 16 },
  'poke-left': { frames: 40, box: [1, 16, 50, 34], still: 0, maxKeep: 12 },
  'poke-right': { frames: 40, box: [8, 16, 44, 34], still: 0, maxKeep: 12 },
  tickle: { frames: 48, box: [9, 17, 43, 33], still: 0, maxKeep: 12 },
};

// Whalegirl (鲸娘) 69x66 logical pixel sheets & per-frame timings from dsh-claude-style sheets.ts
const WHALEGIRL_SPECS = {
  idle: { frames: 21, box: [0, 0, 69, 66], still: 0, columns: 21, durs: [700, 280, 280, 240, 360, 60, 90, 60, 650, 280, 280, 240, 420, 60, 80, 60, 140, 60, 80, 60, 800] },
  'idle-look': { frames: 13, box: [0, 0, 69, 66], still: 0, columns: 13, durs: [500, 420, 70, 80, 70, 380, 420, 110, 420, 140, 140, 140, 400] },
  thinking: { frames: 17, box: [0, 0, 69, 66], still: 0, columns: 17, durs: [220, 220, 260, 260, 260, 300, 170, 170, 170, 170, 170, 170, 90, 110, 200, 200, 260] },
  typing: { frames: 14, box: [0, 0, 69, 66], still: 0, columns: 14, durs: [150, 170, 150, 170, 150, 170, 210, 150, 170, 150, 170, 150, 170, 210] },
  building: { frames: 24, box: [0, 0, 69, 66], still: 0, columns: 24, durs: [130, 100, 80, 90, 100, 120, 90, 130, 130, 100, 80, 90, 100, 120, 90, 130, 130, 100, 80, 90, 100, 120, 90, 130] },
  conducting: { frames: 12, box: [0, 0, 69, 66], still: 0, columns: 12, durs: [150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150, 150] },
  notification: { frames: 8, box: [0, 0, 69, 66], still: 0, columns: 8, durs: [110, 110, 110, 110, 110, 110, 110, 110] },
  happy: { frames: 11, box: [0, 0, 69, 66], still: 0, columns: 11, durs: [200, 90, 90, 100, 100, 100, 100, 110, 110, 120, 400] },
  error: { frames: 10, box: [0, 0, 69, 66], still: 0, columns: 10, durs: [90, 80, 80, 80, 90, 200, 200, 160, 200, 300] },
  sleeping: { frames: 6, box: [0, 0, 69, 66], still: 0, columns: 6, durs: [330, 330, 330, 330, 330, 330] },
  waking: { frames: 11, box: [0, 0, 69, 66], still: 0, columns: 11, durs: [420, 110, 120, 100, 100, 110, 200, 70, 80, 70, 500] },
  'poke-left': { frames: 11, box: [0, 0, 69, 66], still: 0, columns: 11, durs: [300, 110, 90, 90, 200, 140, 140, 240, 200, 200, 400] },
  'poke-right': { frames: 11, box: [0, 0, 69, 66], still: 0, columns: 11, durs: [300, 110, 90, 90, 200, 140, 140, 240, 200, 200, 400] },
  tickle: { frames: 14, box: [0, 0, 69, 66], still: 0, columns: 14, durs: [90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 200, 400] },
};

// ── Minimal Pure-Node PNG Codec (supports 8-bit RGBA, RGB, Grayscale+Alpha, Indexed) ──

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const body = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([lenBuf, body, crcBuf]);
}

function decodePng(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) {
    throw new Error('Invalid PNG header');
  }
  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 6;
  let palette = null;
  let trns = null;
  const idatParts = [];

  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.subarray(pos + 4, pos + 8).toString('ascii');
    const data = buf.subarray(pos + 8, pos + 8 + len);
    pos += 12 + len;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (![1, 2, 4, 8].includes(bitDepth)) throw new Error(`Unsupported PNG bitDepth=${bitDepth}`);
    } else if (type === 'PLTE') {
      palette = data;
    } else if (type === 'tRNS') {
      trns = data;
    } else if (type === 'IDAT') {
      idatParts.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  const bppMap = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
  const channels = bppMap[colorType];
  if (!channels) throw new Error(`Unsupported PNG colorType=${colorType}`);
  const bpp = bitDepth < 8 ? 1 : channels;
  const stride = bitDepth < 8 ? Math.ceil((width * bitDepth) / 8) : width * channels;

  const raw = zlib.inflateSync(Buffer.concat(idatParts));
  const recon = Buffer.alloc(height * stride);

  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };

  let inOff = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[inOff++];
    const rowStart = y * stride;
    const prevStart = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const val = raw[inOff++];
      const a = x >= bpp ? recon[rowStart + x - bpp] : 0;
      const b = y > 0 ? recon[prevStart + x] : 0;
      const c = y > 0 && x >= bpp ? recon[prevStart + x - bpp] : 0;
      let out = val;
      if (filter === 1) out = (val + a) & 0xff;
      else if (filter === 2) out = (val + b) & 0xff;
      else if (filter === 3) out = (val + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) out = (val + paeth(a, b, c)) & 0xff;
      recon[rowStart + x] = out;
    }
  }

  const readSample = (y, x) => {
    const rowOff = y * stride;
    if (bitDepth === 8) return recon[rowOff + x];
    const ppb = 8 / bitDepth;
    const byteVal = recon[rowOff + Math.floor(x / ppb)];
    const shift = (ppb - 1 - (x % ppb)) * bitDepth;
    return (byteVal >> shift) & ((1 << bitDepth) - 1);
  };

  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const dst = i * 4;
      if (colorType === 6) {
        const s = y * stride + x * 4;
        recon.copy(rgba, dst, s, s + 4);
      } else if (colorType === 2) {
        const s = y * stride + x * 3;
        rgba[dst] = recon[s];
        rgba[dst + 1] = recon[s + 1];
        rgba[dst + 2] = recon[s + 2];
        rgba[dst + 3] = 255;
      } else if (colorType === 4) {
        const s = y * stride + x * 2;
        rgba[dst] = rgba[dst + 1] = rgba[dst + 2] = recon[s];
        rgba[dst + 3] = recon[s + 1];
      } else if (colorType === 0) {
        const v = readSample(y, x);
        const scaled = bitDepth === 8 ? v : Math.round((v * 255) / ((1 << bitDepth) - 1));
        rgba[dst] = rgba[dst + 1] = rgba[dst + 2] = scaled;
        rgba[dst + 3] = 255;
      } else if (colorType === 3) {
        const idx = readSample(y, x);
        rgba[dst] = palette ? palette[idx * 3] : 0;
        rgba[dst + 1] = palette ? palette[idx * 3 + 1] : 0;
        rgba[dst + 2] = palette ? palette[idx * 3 + 2] : 0;
        rgba[dst + 3] = trns && idx < trns.length ? trns[idx] : 255;
      }
    }
  }
  return { width, height, data: rgba };
}

function encodePngRgba(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const outRow = y * (stride + 1);
    raw[outRow] = 1; // Sub filter compresses pixel art tightly
    const inRow = y * stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? rgba[inRow + x - 4] : 0;
      raw[outRow + 1 + x] = (rgba[inRow + x] - left) & 0xff;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Selects keyframe indices (preserving all frames when maxKeep is unset or >= total).
 */
function pickFrameIndices(total, maxKeep, still) {
  const limit = maxKeep && maxKeep < total ? maxKeep : total;
  const indices = [];
  if (total <= limit) {
    for (let i = 0; i < total; i++) indices.push(i);
  } else {
    const step = total / limit;
    for (let i = 0; i < limit; i++) {
      indices.push(Math.min(total - 1, Math.floor(i * step)));
    }
  }
  const stillIdx = total <= limit
    ? Math.min(indices.length - 1, still || 0)
    : Math.min(indices.length - 1, Math.round(((still || 0) / Math.max(1, total - 1)) * (indices.length - 1)));
  return { indices, stillIdx };
}

/**
 * Packs a sprite sheet into a PNG with a transparent gutter between cells so
 * fractional/HiDPI scaling never bleeds adjacent frames.
 */
function packSpriteSheet(pngBuf, spec, opts) {
  const options = opts || {};
  const scale = options.scale || 1;
  const gutter = options.gutter != null ? options.gutter : SHEET_GUTTER;
  const src = decodePng(pngBuf);
  const cellW = spec.box[2];
  const cellH = spec.box[3];
  const srcCellW = cellW * scale;
  const srcCellH = cellH * scale;
  const srcCols = options.srcColumns || Math.max(1, Math.floor(src.width / srcCellW));
  const { indices, stillIdx } = pickFrameIndices(spec.frames, options.maxKeep, spec.still);

  const outCols = options.columns || indices.length;
  const outRows = Math.ceil(indices.length / outCols);
  const strideW = cellW + gutter;
  const strideH = cellH + gutter;
  const outW = outCols * strideW;
  const outH = outRows * strideH;
  const outRgba = Buffer.alloc(outW * outH * 4);
  const sampleOff = Math.floor(scale / 2);

  for (let fIdx = 0; fIdx < indices.length; fIdx++) {
    const origFrame = indices[fIdx];
    const fc = origFrame % srcCols;
    const fr = Math.floor(origFrame / srcCols);
    const sx0 = fc * srcCellW;
    const sy0 = fr * srcCellH;
    const dstFc = fIdx % outCols;
    const dstFr = Math.floor(fIdx / outCols);
    const dx0 = dstFc * strideW;
    const dy0 = dstFr * strideH;

    for (let y = 0; y < cellH; y++) {
      const sy = sy0 + y * scale + sampleOff;
      if (sy >= src.height) continue;
      for (let x = 0; x < cellW; x++) {
        const sx = sx0 + x * scale + sampleOff;
        if (sx >= src.width) continue;
        const sOff = (sy * src.width + sx) * 4;
        const dOff = ((dy0 + y) * outW + (dx0 + x)) * 4;
        outRgba[dOff] = src.data[sOff];
        outRgba[dOff + 1] = src.data[sOff + 1];
        outRgba[dOff + 2] = src.data[sOff + 2];
        outRgba[dOff + 3] = src.data[sOff + 3];
      }
    }
  }

  return {
    png: encodePngRgba(outW, outH, outRgba),
    indices,
    frames: indices.length,
    columns: outCols,
    box: spec.box,
    still: stillIdx,
    gutter,
  };
}

/**
 * Downsamples a Deepy 5x sprite sheet into a 1x-cell horizontal strip with 1px gutter.
 */
function compactDeepySheet(pngBuf, spec, gutter) {
  const packed = packSpriteSheet(pngBuf, spec, {
    scale: 5,
    gutter: gutter != null ? gutter : SHEET_GUTTER,
    maxKeep: spec.maxKeep || 16,
  });
  return {
    dataUri: 'data:image/png;base64,' + packed.png.toString('base64'),
    frames: packed.frames,
    columns: packed.columns,
    box: packed.box,
    still: packed.still,
    gutter: packed.gutter,
  };
}

/**
 * Packs a Whalegirl 1x strip with 1px transparent gutter and frame durations.
 */
function compactWhalegirlSheet(pngBuf, spec, gutter) {
  const packed = packSpriteSheet(pngBuf, spec, {
    scale: 1,
    gutter: gutter != null ? gutter : SHEET_GUTTER,
    srcColumns: spec.columns || spec.frames,
    maxKeep: spec.maxKeep,
  });
  let durs;
  if (Array.isArray(spec.durs) && spec.durs.length > 0) {
    if (packed.indices.length === spec.frames && spec.durs.length === spec.frames) {
      durs = spec.durs.slice();
    } else {
      durs = packed.indices.map((origIdx, i) => {
        const nextIdx = i + 1 < packed.indices.length ? packed.indices[i + 1] : spec.frames;
        let sum = 0;
        for (let k = origIdx; k < nextIdx; k++) {
          sum += spec.durs[k] || 100;
        }
        return sum || 100;
      });
    }
  }
  const sheet = {
    dataUri: 'data:image/png;base64,' + packed.png.toString('base64'),
    frames: packed.frames,
    columns: packed.columns,
    box: packed.box,
    still: packed.still,
    gutter: packed.gutter,
  };
  if (durs) sheet.durs = durs;
  return sheet;
}

/**
 * Repacks a Crab sheet pair (body + optional ink) with 1px transparent gutter.
 */
function repackCrabSheet(bodyBuf, inkBuf, spec, gutter) {
  const g = gutter != null ? gutter : SHEET_GUTTER;
  const bodyPacked = packSpriteSheet(bodyBuf, spec, {
    scale: 1,
    gutter: g,
    srcColumns: 8,
    columns: 8,
    maxKeep: spec.frames,
  });
  let inkDataUri = '';
  if (inkBuf) {
    const inkPacked = packSpriteSheet(inkBuf, spec, {
      scale: 1,
      gutter: g,
      srcColumns: 8,
      columns: 8,
      maxKeep: spec.frames,
    });
    inkDataUri = 'data:image/png;base64,' + inkPacked.png.toString('base64');
  }
  return {
    body: 'data:image/png;base64,' + bodyPacked.png.toString('base64'),
    ink: inkDataUri,
    frames: bodyPacked.frames,
    columns: bodyPacked.columns,
    box: bodyPacked.box,
    still: bodyPacked.still,
    gutter: bodyPacked.gutter,
  };
}

function resolveMascotBaseDir(refRoot) {
  const candidates = [
    path.join(refRoot, 'packages', 'assets', 'src', 'mascot'),
    path.join(refRoot, 'mascot'),
    refRoot,
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'crab')) && fs.existsSync(path.join(dir, 'deepy'))) {
      return dir;
    }
  }
  return candidates[0];
}

function loadExistingAstra(outFile) {
  if (!fs.existsSync(outFile)) return null;
  try {
    const resolved = require.resolve(outFile);
    delete require.cache[resolved];
    const existing = require(outFile);
    if (existing && existing.astra && typeof existing.astra === 'object' && existing.astra.dataUri) {
      return existing.astra;
    }
  } catch (_err) {
    // Ignore unparseable existing bundle
  }
  return null;
}

function buildSprites() {
  const refRoot = process.env.AG_STUDIO_REF_DSH || DEFAULT_REF_DSH;
  const mascotRoot = resolveMascotBaseDir(refRoot);
  const crabDir = path.join(mascotRoot, 'crab');
  const deepyDir = path.join(mascotRoot, 'deepy');
  const whalegirlDir = path.join(mascotRoot, 'whalegirl');

  if (!fs.existsSync(crabDir) || !fs.existsSync(deepyDir)) {
    if (fs.existsSync(OUT_FILE)) {
      console.log(`[mascot-assets] REF_DSH not found at ${refRoot}; keeping existing ${path.relative(ROOT, OUT_FILE)}`);
      return;
    }
    throw new Error(`REF_DSH mascot directory not found: ${crabDir}`);
  }

  // Preserve any existing baked Astra sprite before overwriting OUT_FILE
  const existingAstra = loadExistingAstra(OUT_FILE);

  const crab = {};
  for (const [name, spec] of Object.entries(CRAB_SPECS)) {
    const bodyPath = path.join(crabDir, `${name}.png`);
    const inkPath = path.join(crabDir, `${name}-ink.png`);
    if (!fs.existsSync(bodyPath)) continue;
    const bodyBuf = fs.readFileSync(bodyPath);
    const inkBuf = fs.existsSync(inkPath) ? fs.readFileSync(inkPath) : null;
    crab[name] = repackCrabSheet(bodyBuf, inkBuf, spec, SHEET_GUTTER);
  }

  const deepy = {};
  for (const [name, spec] of Object.entries(DEEPY_SPECS)) {
    const p = path.join(deepyDir, `${name}.png`);
    if (!fs.existsSync(p)) continue;
    deepy[name] = compactDeepySheet(fs.readFileSync(p), spec, SHEET_GUTTER);
  }

  const whalegirl = {};
  if (fs.existsSync(whalegirlDir)) {
    for (const [name, spec] of Object.entries(WHALEGIRL_SPECS)) {
      const p = path.join(whalegirlDir, `${name}.png`);
      if (!fs.existsSync(p)) continue;
      whalegirl[name] = compactWhalegirlSheet(fs.readFileSync(p), spec, SHEET_GUTTER);
    }
  }

  const payload = {
    version: 1,
    crabFrameMs: 80,
    deepyFrameMs: 90,
    whalegirlFrameMs: 100,
    crab,
    deepy,
    whalegirl,
  };
  if (existingAstra) {
    payload.astra = existingAstra;
  }

  const outSrc = [
    '// Auto-generated by scripts/build-mascot-assets.js — Do not edit manually.',
    '(function (globalScope) {',
    "  'use strict';",
    '  var SPRITES = ' + JSON.stringify(payload) + ';',
    "  if (typeof module !== 'undefined' && module.exports) {",
    '    module.exports = SPRITES;',
    '  }',
    '  if (globalScope) {',
    '    globalScope.__AG_STUDIO_MASCOT_SPRITES__ = SPRITES;',
    '  }',
    "})(typeof window !== 'undefined' ? window : globalThis);",
    '',
  ].join('\n');

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, outSrc, 'utf8');

  const bytes = Buffer.byteLength(outSrc, 'utf8');
  console.log(
    `[mascot-assets] Generated ${path.relative(ROOT, OUT_FILE)} (${(bytes / 1024).toFixed(1)} KB; crab=${Object.keys(crab).length} sheets, deepy=${Object.keys(deepy).length} sheets, whalegirl=${Object.keys(whalegirl).length} sheets, astra=${existingAstra ? 'preserved' : 'none'})`
  );
  if (bytes > MAX_BUNDLE_BYTES) {
    console.warn(`[mascot-assets] WARNING: bundle size ${bytes} bytes exceeds ${MAX_BUNDLE_BYTES} bytes`);
  }
}

if (require.main === module) {
  buildSprites();
}

module.exports = {
  CRAB_SPECS,
  DEEPY_SPECS,
  WHALEGIRL_SPECS,
  SHEET_GUTTER,
  buildSprites,
  compactDeepySheet,
  compactWhalegirlSheet,
  repackCrabSheet,
  packSpriteSheet,
  resolveMascotBaseDir,
  loadExistingAstra,
  decodePng,
  encodePngRgba,
};
