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
