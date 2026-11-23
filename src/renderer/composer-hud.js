(function (globalScope) {
  'use strict';

  function formatCompactNumber(n) {
    var num = Number(n || 0);
    if (!Number.isFinite(num) || num <= 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(Math.round(num));
  }

  function ensureHudStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ag-studio-hud-style')) return;
    var s = document.createElement('style');
    s.id = 'ag-studio-hud-style';
    s.textContent = [
      '.ags-hud-wrap { display:inline-flex; align-items:center; justify-content:center; gap:6px; pointer-events:auto; z-index:2147483000; font-family:var(--ags-font-ui, system-ui, sans-serif); font-variant-numeric:tabular-nums; }',
      '.ags-hud-floating { position:fixed; right:18px; bottom:16px; }',
      '.ags-hud-inline { margin:2px auto; }',
      '.ags-hud-toolbar { gap:5px; max-width:100%; overflow:hidden; }',
      '.ags-vial-btn { position:relative; display:inline-flex; align-items:center; justify-content:center; width:24px; height:38px; padding:0; border:none; background:transparent; cursor:pointer; flex-shrink:0; transition:transform 140ms ease; }',
      '.ags-hud-toolbar .ags-vial-btn { width:14px; height:22px; }',
      '.ags-vial-btn:hover { transform:translateY(-1px) scale(1.06); }',
      '.ags-vial-cv { display:block; width:24px; height:38px; }',
      '.ags-hud-toolbar .ags-vial-cv { width:14px; height:22px; }',
      '.ags-hud-pill { display:inline-flex; align-items:center; gap:7px; height:26px; padding:0 10px; border-radius:999px; border:1px solid var(--ags-border, rgba(148,163,184,0.22)); background:var(--ags-bg-surface, #18181b); color:var(--ags-text-secondary, #a1a1aa); font-size:11.5px; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.06); transition:border-color 140ms ease, color 140ms ease; white-space:nowrap; }',
      '.ags-hud-toolbar .ags-hud-pill { height:22px; padding:0 8px; gap:5px; font-size:11px; border-color:color-mix(in srgb, var(--ags-border) 55%, transparent); background:color-mix(in srgb, var(--ags-text-primary) 3%, transparent); box-shadow:none; }',
      '.ags-hud-pill:hover { border-color:var(--ags-accent, #D97757); color:var(--ags-text-primary, #f4f4f5); }',
      '.ags-hud-sep { opacity:0.32; }',
      '.ags-hud-strong { color:var(--ags-text-primary, #f4f4f5); font-weight:600; }',
      '.ags-hud-quota-low { color:var(--ags-warning, #D9822B); font-weight:600; }',
      '.ags-hud-crit { color:var(--ags-danger, #EF4444); font-weight:600; }',
      '@media (max-width: 720px) { .ags-hud-toolbar .ags-hud-hide-sm { display:none; } }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  /**
   * Compact 12-node damped shallow-water physics kernel (0fps when settled).
   */
  function createMiniVialPhysics() {
    var N = 12;
    var waveH = new Float32Array(N);
    var waveV = new Float32Array(N);
    var fill = 0.0;
    var targetFill = 0.0;
    var tilt = 0;
    var tiltVel = 0;
    var streaming = false;
    var clock = 0;
    var bubbles = [];
    var dustCd = 0.35;

    function step(dt) {
      var df = targetFill - fill;
      if (Math.abs(df) < 0.0004) fill = targetFill;
      else fill += df * Math.min(1, dt * 6.5);

      var torque = 0;
      if (streaming) {
        clock += dt;
        torque = Math.sin(clock * 2.1) * 0.28 + Math.sin(clock * 3.7 + 0.9) * 0.12;
      }
      var accT = -2 * 0.42 * 7.5 * tiltVel - 7.5 * 7.5 * tilt + torque;
      tiltVel += accT * dt;
      tilt = Math.max(-0.36, Math.min(0.36, tilt + tiltVel * dt));
      if (!streaming && Math.abs(tilt) < 0.0005 && Math.abs(tiltVel) < 0.002) {
        tilt = 0;
        tiltVel = 0;
      }

      for (var i = 0; i < N; i++) {
        var hL = i > 0 ? waveH[i - 1] : waveH[0];
        var hR = i < N - 1 ? waveH[i + 1] : waveH[N - 1];
        var norm = (i / (N - 1)) * 2 - 1;
        var acc = 260 * (hL + hR - 2 * waveH[i]) - 3.2 * waveV[i] - 28 * waveH[i] - accT * 0.25 * norm;
        waveV[i] += acc * dt;
      }
      var energy = 0;
      for (var j = 0; j < N; j++) {
        waveH[j] = Math.max(-4, Math.min(4, waveH[j] + waveV[j] * dt));
        energy += Math.abs(waveH[j]) + Math.abs(waveV[j]) * 0.05;
      }
      if (!streaming && tilt === 0 && energy < 0.03) {
        waveH.fill(0);
        waveV.fill(0);
      }

      if (streaming && fill > 0.08) {
        dustCd -= dt;
        if (dustCd <= 0 && bubbles.length < 4) {
          dustCd = 0.45 + Math.random() * 0.4;
          bubbles.push({
            x: (Math.random() - 0.5) * 8,
            y: 1,
            vy: 0.45 + Math.random() * 0.35,
            r: 0.65 + Math.random() * 0.55
          });
        }
      }
      for (var b = bubbles.length - 1; b >= 0; b--) {
        bubbles[b].y -= bubbles[b].vy * dt;
        if (bubbles[b].y <= 1 - Math.max(0.05, fill)) {
          bubbles.splice(b, 1);
        }
      }
    }

    function impulse(power) {
      var p = Math.max(-2.5, Math.min(2.5, Number(power) || 1));
      tiltVel += p * 1.4;
      for (var i = 0; i < N; i++) {
        var norm = (i / (N - 1)) * 2 - 1;
        waveV[i] += norm * p * 12;
      }
    }

    function isSettled() {
      if (streaming || bubbles.length > 0) return false;
      if (Math.abs(targetFill - fill) >= 0.001) return false;
      if (Math.abs(tilt) >= 0.003 || Math.abs(tiltVel) >= 0.01) return false;
      var e = 0;
      for (var i = 0; i < N; i++) e += Math.abs(waveH[i]) + Math.abs(waveV[i]) * 0.05;
      return e < 0.06;
    }

    return {
      waveH: waveH,
      bubbles: bubbles,
      setTargetFill: function (v) { targetFill = Math.max(0, Math.min(1, Number(v) || 0)); },
      snapFill: function (v) { targetFill = fill = Math.max(0, Math.min(1, Number(v) || 0)); },
      setStreaming: function (on) { streaming = Boolean(on); },
      getFill: function () { return fill; },
      getTilt: function () { return tilt; },
      impulse: impulse,
      step: step,
      isSettled: isSettled
    };
  }

  function createComposerHud(options) {
    if (typeof document === 'undefined') return null;
    ensureHudStyles();
    var opts = options || {};

    var wrap = document.createElement('div');
    wrap.className = 'ags-hud-wrap ags-hud-floating';
    wrap.setAttribute('data-ag-studio-ignore', 'true');
    wrap.setAttribute('data-ag-no-i18n', 'true');

    // 1. Mini Breathing Water Vial Button
    var vialBtn = document.createElement('button');
    vialBtn.type = 'button';
    vialBtn.className = 'ags-vial-btn';
    vialBtn.title = '512K 上下文呼吸试管 — 点击打开 Studio';
    var vialCv = document.createElement('canvas');
    vialCv.className = 'ags-vial-cv';
    vialBtn.appendChild(vialCv);

    // 2. Minimalist Capsule Pill
    var pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'ags-hud-pill';

    var onOpen = function () {
      if (typeof opts.onToggleDrawer === 'function') opts.onToggleDrawer();
    };
    vialBtn.addEventListener('click', function () {
      phys.impulse(1.4);
      wakeVial();
      onOpen();
    });
    vialBtn.addEventListener('pointerenter', function () {
      phys.impulse(0.65);
      wakeVial();
    });
    pill.addEventListener('click', onOpen);

    wrap.appendChild(vialBtn);
    wrap.appendChild(pill);

    var phys = createMiniVialPhysics();
    var rafId = 0;
    var lastFrameAt = 0;
    var currentCtx = vialCv.getContext('2d');
    var lastVisualSig = '';
    var lastPillKey = '';
    var isCompactToolbar = false;
    var isDark = true;
    var accentHex = '#3B82F6';
    var isStreaming = false;
    var isCritical = false;

    function resolveVialColors() {
      var mode = document.documentElement.getAttribute('data-ags-mode');
      isDark = mode !== 'light';
      var themeId = document.documentElement.getAttribute('data-ags-theme') || 'claude';
      var accentCss = '';
      try {
        accentCss = getComputedStyle(document.documentElement).getPropertyValue('--ags-accent').trim();
      } catch (_e) {}
      if (isCritical) {
        accentHex = '#EA580C';
      } else if (themeId === 'claude') {
        accentHex = accentCss || (isDark ? '#E08666' : '#D97757');
      } else {
        accentHex = accentCss || (isDark ? '#60A5FA' : '#2563EB');
      }
    }

    function drawRoundedRectPath(ctx, x, y, w, h, r) {
      var rad = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.lineTo(x + w - rad, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
      ctx.lineTo(x + w, y + h - rad);
      ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
      ctx.lineTo(x + rad, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
      ctx.lineTo(x, y + rad);
      ctx.quadraticCurveTo(x, y, x + rad, y);
      ctx.closePath();
    }

    function renderVialFrame() {
      if (!currentCtx) return;
      var cssW = isCompactToolbar ? 14 : 24;
      var cssH = isCompactToolbar ? 22 : 38;
      var dpr = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2);
      var tw = Math.round(cssW * dpr);
      var th = Math.round(cssH * dpr);
      if (vialCv.width !== tw || vialCv.height !== th) {
        vialCv.width = tw;
        vialCv.height = th;
      }

      var ctx = currentCtx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      resolveVialColors();

      var cx = cssW / 2;
      var tubeX = isCompactToolbar ? 3 : 5;
      var tubeY = 2;
      var tubeW = isCompactToolbar ? 10 : 14;
      var tubeH = isCompactToolbar ? 20 : 34;
      var tubeR = isCompactToolbar ? 4.5 : 6.5;

      // 1. Glass air chamber background
      drawRoundedRectPath(ctx, tubeX, tubeY, tubeW, tubeH, tubeR);
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(226, 232, 240, 0.55)';
      ctx.fill();

      // 2. Clipped shallow-water liquid column
      var fillFrac = phys.getFill();
      if (fillFrac > 0.005) {
        ctx.save();
        drawRoundedRectPath(ctx, tubeX + 1.2, tubeY + 1.2, tubeW - 2.4, tubeH - 2.4, tubeR - 1);
        ctx.clip();

        var innerTop = tubeY + 2;
        var innerBot = tubeY + tubeH - 1.5;
        var baseSurfY = innerBot - fillFrac * (innerBot - innerTop);
        var tilt = phys.getTilt();
        var waveH = phys.waveH;
        var segs = waveH.length - 1;

        ctx.beginPath();
        for (var i = 0; i <= segs; i++) {
          var u = i / segs;
          var x = (tubeX + 1) + u * (tubeW - 2);
          var slope = Math.tan(tilt) * (x - cx) * 0.85;
          var y = baseSurfY + slope + (waveH[i] || 0) * 0.65;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(tubeX + tubeW, innerBot + 4);
        ctx.lineTo(tubeX, innerBot + 4);
        ctx.closePath();

        var grad = ctx.createLinearGradient(0, baseSurfY, 0, innerBot);
        if (isCritical) {
          grad.addColorStop(0, '#F59E0B');
          grad.addColorStop(1, '#DC2626');
        } else {
          grad.addColorStop(0, accentHex);
          grad.addColorStop(1, isDark ? 'rgba(30, 64, 175, 0.92)' : 'rgba(29, 78, 216, 0.92)');
        }
        ctx.fillStyle = grad;
        ctx.fill();

        // Crisp meniscus highlight
        ctx.beginPath();
        for (var m = 0; m <= segs; m++) {
          var mu = m / segs;
          var mx = (tubeX + 1) + mu * (tubeW - 2);
          var mSlope = Math.tan(tilt) * (mx - cx) * 0.85;
          var my = baseSurfY + mSlope + (waveH[m] || 0) * 0.65;
          if (m === 0) ctx.moveTo(mx, my);
          else ctx.lineTo(mx, my);
        }
        ctx.strokeStyle = isDark ? 'rgba(224, 242, 254, 0.88)' : 'rgba(255, 255, 255, 0.92)';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Streaming rising micro-bubbles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
        for (var b = 0; b < phys.bubbles.length; b++) {
          var bub = phys.bubbles[b];
          var by = innerBot - (1 - bub.y) * (innerBot - innerTop);
          if (by > baseSurfY + 2) {
            ctx.beginPath();
            ctx.arc(cx + bub.x * 0.4, by, bub.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 3. Laser tick marks on right glass wall
      ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.45)' : 'rgba(51, 65, 85, 0.35)';
      for (var t = 1; t <= 3; t++) {
        var ty = tubeY + (tubeH * t) / 4;
        ctx.fillRect(tubeX + tubeW - 3.5, ty, 2.2, 0.8);
      }

      // 4. Vertical glass refraction thread + outer borosilicate outline
      ctx.fillStyle = isDark ? 'rgba(226, 232, 240, 0.25)' : 'rgba(255, 255, 255, 0.55)';
      ctx.fillRect(tubeX + 2.5, tubeY + 6, 1, tubeH - 12);

      drawRoundedRectPath(ctx, tubeX, tubeY, tubeW, tubeH, tubeR);
      ctx.strokeStyle = isCritical
        ? 'rgba(234, 88, 12, 0.78)'
        : isDark ? 'rgba(148, 163, 184, 0.52)' : 'rgba(71, 85, 105, 0.45)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    function stepLoop(now) {
      rafId = 0;
      if (typeof document !== 'undefined' && document.hidden) return;
      var dt = lastFrameAt > 0 ? Math.max(0.004, Math.min(0.05, (now - lastFrameAt) / 1000)) : 0.016;
      lastFrameAt = now;
      phys.step(dt);
      renderVialFrame();
      if (!phys.isSettled() && typeof requestAnimationFrame === 'function') {
        rafId = requestAnimationFrame(stepLoop);
      } else {
        lastFrameAt = 0;
      }
    }

    function wakeVial() {
      renderVialFrame();
      if (rafId || phys.isSettled()) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      if (typeof requestAnimationFrame === 'function') {
        lastFrameAt = performance.now ? performance.now() : Date.now();
        rafId = requestAnimationFrame(stepLoop);
      }
    }

    function mountToSlot(positionMode, composer) {
      var anchors = globalScope.__AG_STUDIO_ANCHORS__;
      var mode = positionMode || 'composer';
      if (mode !== 'floating' && anchors && composer) {
        // Primary: inside composer toolbar right next to the model selector button
        if (typeof anchors.ensureComposerToolbarSlot === 'function') {
          var toolbarSlot = anchors.ensureComposerToolbarSlot(composer);
          if (toolbarSlot) {
            isCompactToolbar = true;
            anchors.parkComposerBottomSlot();
            wrap.className = 'ags-hud-wrap ags-hud-toolbar';
            if (wrap.parentElement !== toolbarSlot) {
              toolbarSlot.appendChild(wrap);
            }
            return;
          }
        }
        // Fallback: below composer
        if (typeof anchors.parkComposerToolbarSlot === 'function') anchors.parkComposerToolbarSlot();
        var bottomSlot = anchors.ensureComposerBottomSlot(composer);
        if (bottomSlot) {
          isCompactToolbar = false;
          wrap.className = 'ags-hud-wrap ags-hud-inline';
          if (wrap.parentElement !== bottomSlot) {
            bottomSlot.appendChild(wrap);
          }
          return;
        }
      }
      if (anchors) {
        if (typeof anchors.parkComposerToolbarSlot === 'function') anchors.parkComposerToolbarSlot();
        anchors.parkComposerBottomSlot();
      }
      isCompactToolbar = false;
      wrap.className = 'ags-hud-wrap ags-hud-floating';
      var host = document.getElementById('ag-studio-root') || document.body;
      if (host && wrap.parentElement !== host) {
        host.appendChild(wrap);
      }
    }

    function update(snapshot, cfg, composer) {
      var hudCfg = (cfg && cfg.hud) || {};
      if (hudCfg.enabled === false) {
        wrap.style.display = 'none';
        if (rafId && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        return;
      }
      wrap.style.display = 'inline-flex';
      vialBtn.style.display = hudCfg.showVial === false ? 'none' : 'inline-flex';
      mountToSlot(hudCfg.position || 'composer', composer);

      var ctx = (snapshot && snapshot.context) || {};
      var used = Number(ctx.usedTokens || 0);
      var limit = Number(ctx.contextLimit || 200000);
      var ratio = ctx.usageRatio != null ? Number(ctx.usageRatio) : (limit > 0 ? used / limit : 0);
      if (!Number.isFinite(ratio) || ratio < 0) ratio = 0;
      var pct = Math.min(100, Math.round(ratio * 100));
      var speed = Number((ctx.speed && (ctx.speed.tokPerSec || ctx.speed.tps)) || 0);
      var ttft = Number((ctx.speed && ctx.speed.ttftMs) || 0);
      var cachePct = Math.round(Number(ctx.cacheHitRate || 0) * 100);
      var cost = Number((snapshot && snapshot.estimatedSessionCostUsd) || 0);
      var generating = Boolean(ctx.speed && ctx.speed.isGenerating);

      var pools = (snapshot && snapshot.quota && snapshot.quota.pools) || [];
      var minQuotaPct = null;
      for (var i = 0; i < pools.length; i++) {
        if (typeof pools[i].remainingPercent === 'number') {
          if (minQuotaPct === null || pools[i].remainingPercent < minQuotaPct) {
            minQuotaPct = pools[i].remainingPercent;
          }
        }
      }

      isCritical = ratio >= 0.85;
      isStreaming = generating;
      phys.setTargetFill(ratio);
      phys.setStreaming(generating);

      var visSig = [
        Math.round(ratio * 100),
        generating ? 1 : 0,
        isCompactToolbar ? 1 : 0,
        document.documentElement.getAttribute('data-ags-theme') || '',
        document.documentElement.getAttribute('data-ags-mode') || ''
      ].join('|');
      if (visSig !== lastVisualSig) {
        lastVisualSig = visSig;
        if (generating) phys.impulse(0.45);
        wakeVial();
      }

      var pillKey = [
        ctx.model || '',
        pct,
        used,
        limit,
        Math.round(speed),
        cost.toFixed(2),
        minQuotaPct === null ? 'n' : Math.round(minQuotaPct),
        cachePct,
        Math.round(ttft),
        hudCfg.showContext !== false ? 1 : 0,
        hudCfg.showSpeed !== false ? 1 : 0,
        hudCfg.showCost !== false ? 1 : 0,
        hudCfg.showQuotaBadge !== false ? 1 : 0
      ].join('|');

      if (pillKey === lastPillKey) return;
      lastPillKey = pillKey;

      pill.title = '模型: ' + (ctx.model || '未检测') +
        ' · 缓存命中: ' + cachePct + '%' +
        (ttft > 0 ? (' · 首字延迟: ' + Math.round(ttft) + 'ms') : '') +
        ' — 点击打开 Antigravity Studio (Ctrl+Shift+G)';

      var parts = [];
      if (hudCfg.showContext !== false) {
        var pctCls = pct >= 85 ? 'ags-hud-crit' : 'ags-hud-strong';
        parts.push(
          '<span class="' + pctCls + '">' + pct + '%</span>' +
          '<span class="ags-hud-sep">·</span>' +
          '<span>' + formatCompactNumber(used) + '/' + formatCompactNumber(limit) + '</span>'
        );
      }
      if (hudCfg.showSpeed !== false) {
        parts.push('<span>' + Math.round(speed) + ' tok/s</span>');
      }
      if (hudCfg.showCost !== false) {
        parts.push('<span class="ags-hud-hide-sm">$' + cost.toFixed(2) + '</span>');
      }
      if (hudCfg.showQuotaBadge !== false && minQuotaPct !== null) {
        var qCls = minQuotaPct <= 20 ? 'ags-hud-quota-low' : '';
        parts.push('<span class="' + qCls + '">额度 ' + Math.round(minQuotaPct) + '%</span>');
      }
      if (!parts.length) {
        parts.push('<span class="ags-hud-strong">Studio</span>');
      }
      pill.innerHTML = parts.join('<span class="ags-hud-sep">·</span>');
    }

    function destroy() {
      if (rafId && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (wrap.parentElement) wrap.parentElement.removeChild(wrap);
    }

    return {
      element: wrap,
      mountToBestSpot: function (mode, comp) { mountToSlot(mode, comp); },
      update: update,
      destroy: destroy
    };
  }

  var api = {
    formatCompactNumber: formatCompactNumber,
    createMiniVialPhysics: createMiniVialPhysics,
    createComposerHud: createComposerHud
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_HUD__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
