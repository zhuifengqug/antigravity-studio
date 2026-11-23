(function (globalScope) {
  'use strict';

  function formatCompactNumber(n) {
    var num = Number(n || 0);
    if (!Number.isFinite(num) || num <= 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(Math.round(num));
  }

  function formatDurationShort(ms) {
    var v = Number(ms || 0);
    if (!Number.isFinite(v) || v <= 0) return '—';
    if (v >= 1000) return (v / 1000).toFixed(1) + 's';
    return Math.round(v) + 'ms';
  }

  function ensureHudStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ag-studio-hud-style')) return;
    var s = document.createElement('style');
    s.id = 'ag-studio-hud-style';
    s.textContent = [
      '.ags-hud-wrap { position:relative; display:inline-flex; align-items:center; justify-content:center; gap:6px; pointer-events:auto; z-index:2147483000; font-family:var(--ags-font-ui, system-ui, sans-serif); font-variant-numeric:tabular-nums; -webkit-app-region:no-drag; app-region:no-drag; }',
      '.ags-hud-floating { position:fixed; right:18px; bottom:16px; }',
      '.ags-hud-inline { margin:2px auto; }',
      '.ags-hud-toolbar { gap:4px; max-width:100%; overflow:visible; }',
      '.ags-ring-btn { position:relative; display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; padding:0; border:none; border-radius:50%; background:transparent; cursor:pointer; flex-shrink:0; transition:transform 140ms ease; }',
      '.ags-ring-btn:hover { transform:scale(1.08); }',
      '.ags-ring-svg { display:block; width:22px; height:22px; transform:rotate(-90deg); }',
      '.ags-ring-num { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:8.5px; font-weight:700; color:var(--ags-text-primary, #f4f4f5); letter-spacing:-0.04em; pointer-events:none; }',
      '.ags-hud-popover { position:fixed; z-index:2147483580; min-width:196px; max-width:250px; padding:9px 11px; border-radius:11px; border:1px solid var(--ags-border, rgba(148,163,184,0.28)); background:var(--ags-bg-surface, #18181b); color:var(--ags-text-primary, #f4f4f5); box-shadow:0 10px 28px rgba(0,0,0,0.26); display:none; flex-direction:column; gap:5px; font-family:var(--ags-font-ui, system-ui, sans-serif); font-size:11.5px; font-variant-numeric:tabular-nums; pointer-events:none; }',
      '.ags-hud-popover[data-open="1"] { display:flex; }',
      '.ags-hud-pop-head { display:flex; align-items:center; justify-content:space-between; gap:8px; padding-bottom:4px; border-bottom:1px solid var(--ags-border, rgba(148,163,184,0.18)); font-weight:600; font-size:11.5px; }',
      '.ags-hud-pop-row { display:flex; align-items:center; justify-content:space-between; gap:12px; }',
      '.ags-hud-pop-lbl { color:var(--ags-text-secondary, #94a3b8); }',
      '.ags-hud-pop-val { color:var(--ags-text-primary, #f4f4f5); font-weight:500; }',
      '.ags-vial-btn { position:relative; display:inline-flex; align-items:center; justify-content:center; width:24px; height:38px; padding:0; border:none; background:transparent; cursor:pointer; flex-shrink:0; transition:transform 140ms ease; }',
      '.ags-hud-toolbar .ags-vial-btn { width:14px; height:22px; }',
      '.ags-vial-btn:hover { transform:translateY(-1px) scale(1.06); }',
      '.ags-vial-cv { display:block; width:24px; height:38px; }',
      '.ags-hud-toolbar .ags-vial-cv { width:14px; height:22px; }',
      '.ags-hud-pill { display:inline-flex; align-items:center; gap:7px; height:26px; padding:0 10px; border-radius:999px; border:1px solid var(--ags-border, rgba(148,163,184,0.22)); background:var(--ags-bg-surface, #18181b); color:var(--ags-text-secondary, #a1a1aa); font-size:11.5px; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.06); transition:border-color 140ms ease, color 140ms ease; white-space:nowrap; }',
      '.ags-hud-toolbar .ags-hud-pill { height:22px; padding:0 8px; gap:5px; font-size:11px; border-color:color-mix(in srgb, var(--ags-text-primary, #f4f4f5) 18%, transparent); background:color-mix(in srgb, var(--ags-text-primary, #f4f4f5) 7%, transparent); color:var(--ags-text-secondary, #cbd5e1); box-shadow:none; }',
      '.ags-hud-pill:hover { border-color:var(--ags-accent, #D97757); color:var(--ags-text-primary, #f4f4f5); }',
      '.ags-hud-sep { opacity:0.32; }',
      '.ags-hud-strong { color:var(--ags-text-primary, #f4f4f5); font-weight:600; }',
      '.ags-hud-quota-low { color:var(--ags-warning, #D9822B); font-weight:600; }',
      '.ags-hud-crit { color:var(--ags-danger, #EF4444); font-weight:600; }',
      '@media (max-width: 720px) { .ags-hud-toolbar .ags-hud-hide-sm { display:none; } }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

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

    // Ring HUD (compact default)
    var ringBtn = document.createElement('button');
    ringBtn.type = 'button';
    ringBtn.className = 'ags-ring-btn';
    var ringArc = null;
    var ringNum = null;

    var R = 8.5;
    var CIRC = Number((2 * Math.PI * R).toFixed(2));
    ringBtn.innerHTML =
      '<svg class="ags-ring-svg" viewBox="0 0 22 22" aria-hidden="true">' +
      '  <circle cx="11" cy="11" r="' + R + '" fill="none" stroke="color-mix(in srgb, var(--ags-text-primary, #f4f4f5) 20%, transparent)" stroke-width="2.4"/>' +
      '  <circle class="ags-ring-arc" cx="11" cy="11" r="' + R + '" fill="none" stroke="var(--ags-accent, #3B82F6)" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="' + CIRC + '" stroke-dashoffset="' + CIRC + '"/>' +
      '</svg>' +
      '<span class="ags-ring-num">0</span>';
    ringArc = ringBtn.querySelector('.ags-ring-arc');
    ringNum = ringBtn.querySelector('.ags-ring-num');

    // Vertical hover card popover
    var popEl = document.createElement('div');
    popEl.className = 'ags-hud-popover';
    popEl.setAttribute('data-ag-studio-ignore', 'true');
    popEl.setAttribute('data-ag-no-i18n', 'true');

    // Capsule / Vial mode (optional in settings)
    var vialBtn = document.createElement('button');
    vialBtn.type = 'button';
    vialBtn.className = 'ags-vial-btn';
    vialBtn.title = '512K 上下文呼吸试管 — 点击打开 Studio';
    var vialCv = document.createElement('canvas');
    vialCv.className = 'ags-vial-cv';
    vialBtn.appendChild(vialCv);

    var pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'ags-hud-pill';

    var hidePopTimer = 0;
    function showPopover() {
      if (hidePopTimer) { clearTimeout(hidePopTimer); hidePopTimer = 0; }
      var root = document.getElementById('ag-studio-root') || document.body;
      if (popEl.parentElement !== root) root.appendChild(popEl);
      popEl.setAttribute('data-open', '1');
      try {
        var r = ringBtn.getBoundingClientRect();
        var pr = popEl.getBoundingClientRect();
        var pw = pr.width || 210;
        var ph = pr.height || 175;
        var left = Math.max(8, Math.min((window.innerWidth || 1200) - pw - 8, r.left + r.width / 2 - pw / 2));
        var top = r.top - ph - 8;
        if (top < 8) top = r.bottom + 8;
        popEl.style.left = Math.round(left) + 'px';
        popEl.style.top = Math.round(top) + 'px';
      } catch (_e) {}
    }

    function hidePopoverDelayed() {
      if (hidePopTimer) clearTimeout(hidePopTimer);
      hidePopTimer = setTimeout(function () {
        hidePopTimer = 0;
        popEl.removeAttribute('data-open');
      }, 100);
    }

    var onOpen = function (ev) {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      if (typeof opts.onToggleDrawer === 'function') opts.onToggleDrawer();
    };
    ringBtn.addEventListener('click', onOpen);
    ringBtn.addEventListener('pointerenter', showPopover);
    ringBtn.addEventListener('pointerleave', hidePopoverDelayed);

    vialBtn.addEventListener('click', function (ev) {
      phys.impulse(1.4);
      wakeVial();
      onOpen(ev);
    });
    vialBtn.addEventListener('pointerenter', function () {
      phys.impulse(0.65);
      wakeVial();
    });
    pill.addEventListener('click', onOpen);

    wrap.appendChild(ringBtn);
    wrap.appendChild(vialBtn);
    wrap.appendChild(pill);

    var phys = createMiniVialPhysics();
    var rafId = 0;
    var lastFrameAt = 0;
    var currentCtx = vialCv.getContext('2d');
    var lastVisualSig = '';
    var lastPillKey = '';
    var lastPopKey = '';
    var isCompactToolbar = false;
    var isDark = true;
    var accentHex = '#3B82F6';
    var isCritical = false;

    function resolveVialColors() {
      var mode = document.documentElement.getAttribute('data-ags-mode');
      isDark = mode !== 'light';
      var themeId = document.documentElement.getAttribute('data-ags-theme') || 'claude';
      if (isCritical) {
        accentHex = '#EA580C';
      } else if (themeId === 'claude') {
        accentHex = isDark ? '#E08666' : '#D97757';
      } else {
        accentHex = isDark ? '#60A5FA' : '#2563EB';
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
      if (!currentCtx || vialBtn.style.display === 'none') return;
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

      drawRoundedRectPath(ctx, tubeX, tubeY, tubeW, tubeH, tubeR);
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(226, 232, 240, 0.55)';
      ctx.fill();

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
        ctx.restore();
      }

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
      if (vialBtn.style.display === 'none') return;
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
        popEl.removeAttribute('data-open');
        if (rafId && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
        return;
      }

      var displayStyle = hudCfg.displayStyle === 'capsule' ? 'capsule' : 'ring';
      wrap.style.display = 'inline-flex';
      mountToSlot(hudCfg.position || 'composer', composer);

      if (displayStyle === 'ring') {
        ringBtn.style.display = 'inline-flex';
        vialBtn.style.display = 'none';
        pill.style.display = 'none';
      } else {
        ringBtn.style.display = 'none';
        vialBtn.style.display = hudCfg.showVial === false ? 'none' : 'inline-flex';
        pill.style.display = 'inline-flex';
      }

      var ctx = (snapshot && snapshot.context) || {};
      var used = Number(ctx.usedTokens || 0);
      var limit = Number(ctx.contextLimit || 200000);
      var remainingCtx = Math.max(0, limit - used);
      var ratio = ctx.usageRatio != null ? Number(ctx.usageRatio) : (limit > 0 ? used / limit : 0);
      if (!Number.isFinite(ratio) || ratio < 0) ratio = 0;
      ratio = Math.min(1, ratio);
      var pct = Math.min(100, Math.round(ratio * 100));
      var speed = Number((ctx.speed && (ctx.speed.streamingTps || ctx.speed.tokPerSec || ctx.speed.tps)) || 0);
      var speedStr = speed > 0 ? Number(speed).toFixed(1).replace(/\.0$/, '') : '0';
      var ttft = Number((ctx.speed && ctx.speed.ttftMs) || 0);
      var cachePct = Math.round(Number(ctx.cacheHitRate || 0) * 100);
      var cost = Number((snapshot && snapshot.estimatedSessionCostUsd) || 0);
      var turnCost = Number((snapshot && snapshot.estimatedTurnCostUsd) || 0);
      var callCount = Number((snapshot && snapshot.sessionCallCount) || 0);
      var fmtUsd = function (v) { return v >= 1 ? ('$' + v.toFixed(2)) : ('$' + v.toFixed(3)); };
      var generating = Boolean(ctx.speed && ctx.speed.isGenerating);

      var cmq = (snapshot && snapshot.currentModelQuota) || null;
      var pools = (snapshot && snapshot.quota && snapshot.quota.pools) || [];
      var minQuotaPct = cmq && cmq.remainingPercent != null ? Number(cmq.remainingPercent) : null;
      if (minQuotaPct === null) {
        for (var i = 0; i < pools.length; i++) {
          if (typeof pools[i].remainingPercent === 'number') {
            if (minQuotaPct === null || pools[i].remainingPercent < minQuotaPct) {
              minQuotaPct = pools[i].remainingPercent;
            }
          }
        }
      }

      isCritical = ratio >= 0.85;

      // Update Ring SVG
      if (ringArc && ringNum) {
        var offset = Number((CIRC * (1 - ratio)).toFixed(2));
        ringArc.setAttribute('stroke-dashoffset', String(offset));
        ringArc.setAttribute('stroke', isCritical ? 'var(--ags-danger, #EF4444)' : ratio >= 0.68 ? 'var(--ags-warning, #D9822B)' : 'var(--ags-accent, #3B82F6)');
        ringNum.textContent = String(pct);
      }

      // Vertical hover popover content (dirty-checked)
      var estRemShort = (cmq && cmq.estRemainingShort) || '';
      var popKey = [
        ctx.model || '',
        pct, used, limit,
        speedStr,
        cachePct,
        Math.round(ttft),
        cost.toFixed(3),
        turnCost.toFixed(3),
        callCount,
        minQuotaPct == null ? 'n' : Math.round(minQuotaPct),
        estRemShort
      ].join('|');

      if (popKey !== lastPopKey) {
        lastPopKey = popKey;
        var quotaLine = minQuotaPct != null
          ? (Math.round(minQuotaPct) + '%' + (estRemShort ? (' · 约剩 ' + estRemShort) : ''))
          : '—';
        var showTurnCost = turnCost > 0 && callCount > 1 && Math.abs(cost - turnCost) >= 0.001;
        popEl.innerHTML = [
          '<div class="ags-hud-pop-head"><span>' + (ctx.model || '当前会话') + '</span><span>' + pct + '%</span></div>',
          '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">上下文用量</span><span class="ags-hud-pop-val">' + formatCompactNumber(used) + ' / ' + formatCompactNumber(limit) + '</span></div>',
          '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">剩余上下文</span><span class="ags-hud-pop-val">' + formatCompactNumber(remainingCtx) + '</span></div>',
          '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">输出速度</span><span class="ags-hud-pop-val">' + speedStr + ' tok/s</span></div>',
          '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">缓存命中</span><span class="ags-hud-pop-val">' + cachePct + '%</span></div>',
          '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">首字延迟</span><span class="ags-hud-pop-val">' + formatDurationShort(ttft) + '</span></div>',
          '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">对话总费用</span><span class="ags-hud-pop-val">' + fmtUsd(cost) + '</span></div>',
          (showTurnCost ? '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">本轮估算</span><span class="ags-hud-pop-val">' + fmtUsd(turnCost) + '</span></div>' : ''),
          '<div class="ags-hud-pop-row"><span class="ags-hud-pop-lbl">模型额度</span><span class="ags-hud-pop-val">' + quotaLine + '</span></div>'
        ].join('');
      }

      if (displayStyle !== 'ring') {
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

        var pillKey = popKey + '|' + (hudCfg.showContext !== false ? 1 : 0) + (hudCfg.showSpeed !== false ? 1 : 0) + (hudCfg.showCost !== false ? 1 : 0) + (hudCfg.showQuotaBadge !== false ? 1 : 0);
        if (pillKey !== lastPillKey) {
          lastPillKey = pillKey;
          var parts = [];
          if (hudCfg.showContext !== false) {
            var pctCls = pct >= 85 ? 'ags-hud-crit' : 'ags-hud-strong';
            parts.push(
              '<span class="' + pctCls + '">' + pct + '%</span>' +
              '<span class="ags-hud-sep">·</span>' +
              '<span>' + formatCompactNumber(used) + '/' + formatCompactNumber(limit) + '</span>'
            );
          }
          if (hudCfg.showSpeed !== false) parts.push('<span>' + speedStr + ' tok/s</span>');
          if (hudCfg.showCost !== false) parts.push('<span class="ags-hud-hide-sm">' + fmtUsd(cost) + '</span>');
          if (hudCfg.showQuotaBadge !== false && minQuotaPct !== null) {
            var qCls = minQuotaPct <= 20 ? 'ags-hud-quota-low' : '';
            parts.push('<span class="' + qCls + '">额度 ' + Math.round(minQuotaPct) + '%</span>');
          }
          if (!parts.length) parts.push('<span class="ags-hud-strong">Studio</span>');
          pill.innerHTML = parts.join('<span class="ags-hud-sep">·</span>');
        }
      }
    }

    function destroy() {
      if (hidePopTimer) clearTimeout(hidePopTimer);
      if (rafId && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (popEl.parentElement) popEl.parentElement.removeChild(popEl);
      if (wrap.parentElement) wrap.parentElement.removeChild(wrap);
    }

    return {
      element: wrap,
      mountToSlot: mountToSlot,
      update: update,
      destroy: destroy
    };
  }

  var api = {
    formatCompactNumber: formatCompactNumber,
    createComposerHud: createComposerHud
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_HUD__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
