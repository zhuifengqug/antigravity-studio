(function (globalScope) {
  'use strict';

  function formatCompactNumber(n) {
    var num = Number(n || 0);
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
      '.ags-hud-wrap { display:flex; align-items:center; justify-content:space-between; gap:10px; pointer-events:auto; z-index:2147483000; font-family:var(--ags-font-ui, system-ui, sans-serif); font-variant-numeric:tabular-nums; }',
      '.ags-hud-floating { position:fixed; right:18px; bottom:16px; }',
      '.ags-hud-inline { margin:6px 0 4px 0; }',
      '.ags-hud-pill { display:inline-flex; align-items:center; gap:9px; height:28px; padding:0 11px; border-radius:999px; border:1px solid var(--ags-border, rgba(128,128,128,0.22)); background:var(--ags-bg-surface, rgba(24,24,27,0.88)); color:var(--ags-text-secondary, #a1a1aa); font-size:11.5px; cursor:pointer; backdrop-filter:blur(10px); box-shadow:0 4px 14px rgba(0,0,0,0.10); transition:border-color 140ms ease, color 140ms ease, transform 120ms ease; }',
      '.ags-hud-pill:hover { border-color:var(--ags-accent, #D97757); color:var(--ags-text-primary, #f4f4f5); }',
      '.ags-hud-bar { width:38px; height:4px; border-radius:99px; background:var(--ags-bg-subtle, rgba(128,128,128,0.2)); overflow:hidden; }',
      '.ags-hud-bar-fill { height:100%; border-radius:99px; background:var(--ags-accent, #D97757); transition:width 240ms ease; }',
      '.ags-hud-sep { opacity:0.35; }',
      '.ags-hud-strong { color:var(--ags-text-primary, #f4f4f5); font-weight:500; }',
      '.ags-hud-quota-low { color:var(--ags-warning, #D9822B); font-weight:500; }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function findComposerContainer() {
    if (typeof document === 'undefined') return null;
    var inputs = document.querySelectorAll('textarea, [contenteditable="true"][role="textbox"]');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      if (el.closest('#ag-studio-root')) continue;
      var rect = el.getBoundingClientRect();
      if (rect.width > 180 && rect.height >= 20) {
        return el.closest('form') || el.parentElement;
      }
    }
    return null;
  }

  function createComposerHud(options) {
    if (typeof document === 'undefined') return null;
    ensureHudStyles();
    var opts = options || {};
    var wrap = document.createElement('div');
    wrap.className = 'ags-hud-wrap ags-hud-floating';
    wrap.setAttribute('data-ag-studio-ignore', 'true');

    var pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'ags-hud-pill';
    pill.addEventListener('click', function () {
      if (typeof opts.onToggleDrawer === 'function') opts.onToggleDrawer();
    });

    if (opts.mascotElement) {
      wrap.appendChild(opts.mascotElement);
    }
    wrap.appendChild(pill);

    function mountToBestSpot(positionMode) {
      var mode = positionMode || 'composer';
      if (mode === 'composer') {
        var composer = findComposerContainer();
        if (composer && composer.parentElement) {
          wrap.className = 'ags-hud-wrap ags-hud-inline';
          if (wrap.parentElement !== composer.parentElement) {
            composer.parentElement.insertBefore(wrap, composer);
          }
          return;
        }
      }
      wrap.className = 'ags-hud-wrap ags-hud-floating';
      var host = document.getElementById('ag-studio-root') || document.body;
      if (host && wrap.parentElement !== host) {
        host.appendChild(wrap);
      }
    }

    function update(snapshot, cfg) {
      var hudCfg = (cfg && cfg.hud) || {};
      if (hudCfg.enabled === false) {
        wrap.style.display = 'none';
        return;
      }
      wrap.style.display = 'flex';
      mountToBestSpot(hudCfg.position || 'composer');

      var ctx = (snapshot && snapshot.context) || {};
      var used = Number(ctx.usedTokens || 0);
      var limit = Number(ctx.contextLimit || 200000);
      var pct = Math.min(100, Math.round((ctx.usageRatio || (limit > 0 ? used / limit : 0)) * 100));
      var speed = (ctx.speed && ctx.speed.tokPerSec) ? ctx.speed.tokPerSec : 0;
      var ttft = (ctx.speed && ctx.speed.ttftMs) ? ctx.speed.ttftMs : 0;
      var cachePct = Math.round((ctx.cacheHitRate || 0) * 100);
      var cost = Number((snapshot && snapshot.estimatedSessionCostUsd) || 0);

      var pools = (snapshot && snapshot.quota && snapshot.quota.pools) || [];
      var minQuotaPct = null;
      for (var i = 0; i < pools.length; i++) {
        if (typeof pools[i].remainingPercent === 'number') {
          if (minQuotaPct === null || pools[i].remainingPercent < minQuotaPct) {
            minQuotaPct = pools[i].remainingPercent;
          }
        }
      }

      pill.title = '模型: ' + (ctx.model || 'gemini-4-neon') +
        ' | 缓存命中: ' + cachePct + '%' +
        (ttft ? (' | 首字延迟: ' + ttft + 'ms') : '') +
        ' — 点击打开 Antigravity Studio (Ctrl+Shift+G)';

      var parts = [];
      if (hudCfg.showContext !== false) {
        parts.push(
          '<span class="ags-hud-bar"><span class="ags-hud-bar-fill" style="width:' + pct + '%"></span></span>' +
          '<span class="ags-hud-strong">' + pct + '%</span>' +
          '<span>' + formatCompactNumber(used) + '/' + formatCompactNumber(limit) + '</span>'
        );
      }
      if (hudCfg.showSpeed !== false) {
        parts.push('<span>' + speed + ' tok/s</span>');
      }
      if (hudCfg.showCost !== false) {
        parts.push('<span>$' + cost.toFixed(2) + '</span>');
      }
      if (hudCfg.showQuotaBadge !== false && minQuotaPct !== null) {
        var lowCls = minQuotaPct <= 20 ? 'ags-hud-quota-low' : '';
        parts.push('<span class="' + lowCls + '">额度 ' + minQuotaPct + '%</span>');
      }
      if (!parts.length) {
        parts.push('<span class="ags-hud-strong">Studio</span>');
      }
      pill.innerHTML = parts.join('<span class="ags-hud-sep">·</span>');
    }

    return {
      element: wrap,
      mountToBestSpot: mountToBestSpot,
      update: update
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
