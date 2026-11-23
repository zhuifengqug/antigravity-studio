(function (globalScope) {
  'use strict';

  var HOME_BOOKS = [
    { tokens: 7607, zh: '《道德经》', zhTW: '《道德經》', en: 'Tao Te Ching' },
    { tokens: 37248, zh: '《爱丽丝漫游奇境》', zhTW: '《愛麗絲夢遊仙境》', en: "Alice's Adventures in Wonderland" },
    { tokens: 65763, zh: '《了不起的盖茨比》', zhTW: '《大亨小傳》', en: 'The Great Gatsby' },
    { tokens: 115000, zh: '《活着》', zhTW: '《活著》', en: 'To Live' },
    { tokens: 136278, zh: '《一九八四》', zhTW: '《一九八四》', en: 'Nineteen Eighty-Four' },
    { tokens: 202000, zh: '《三体》', zhTW: '《三體》', en: 'The Three-Body Problem' },
    { tokens: 638009, zh: '《三国演义》', zhTW: '《三國演義》', en: 'Romance of the Three Kingdoms' },
    { tokens: 783200, zh: '《西游记》', zhTW: '《西遊記》', en: 'Journey to the West' },
    { tokens: 903956, zh: '《红楼梦》', zhTW: '《紅樓夢》', en: 'Dream of the Red Chamber' },
    { tokens: 998000, zh: '《平凡的世界》', zhTW: '《平凡的世界》', en: 'Ordinary World' }
  ];

  var MODEL_COLORS = [
    'var(--ags-accent, #D97757)',
    '#3B82F6',
    '#10B981',
    '#8B5CF6',
    '#F59E0B',
    '#EC4899'
  ];

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtCompact(n) {
    var v = Number(n || 0);
    if (!Number.isFinite(v) || v <= 0) return '0';
    if (v >= 1e9) return (v / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(Math.round(v));
  }

  function fmtCount(n) {
    var v = Math.round(Number(n || 0));
    return Number.isFinite(v) ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0';
  }

  function fmtPeakHour(hour, lang) {
    if (hour == null || hour === '' || !Number.isFinite(Number(hour))) return '—';
    var h = ((Math.floor(Number(hour)) % 24) + 24) % 24;
    var h12 = h % 12 === 0 ? 12 : h % 12;
    if (lang === 'en') return h12 + (h < 12 ? ' AM' : ' PM');
    if (lang === 'zh-TW') return (h < 12 ? '上午 ' : '下午 ') + h12 + ' 點';
    return (h < 12 ? '上午 ' : '下午 ') + h12 + ' 点';
  }

  function formatFunBookText(totalTokens, lang, seed) {
    var tok = Number(totalTokens || 0);
    if (tok <= 0) {
      if (lang === 'en') return 'Start a conversation to illuminate your usage heatmap.';
      if (lang === 'zh-TW') return '開始對話後，這裡將即時繪製你的 Token 足跡。';
      return '开始对话后，这里将实时绘制你的 Token 足迹。';
    }
    var candidates = HOME_BOOKS.filter(function (b) { return tok >= b.tokens * 0.4; });
    var pool = candidates.length ? candidates : [HOME_BOOKS[0]];
    var book = pool[Math.floor((seed || 0) * pool.length) % pool.length] || HOME_BOOKS[HOME_BOOKS.length - 1];
    var ratio = (tok / book.tokens);
    var ratioStr = ratio >= 10 ? String(Math.round(ratio)) : ratio.toFixed(1).replace(/\.0$/, '');
    if (lang === 'en') {
      return 'Your token usage equals ' + ratioStr + '× ' + book.en + '.';
    }
    if (lang === 'zh-TW') {
      return '你的 Token 用量相當於 ' + ratioStr + ' 本' + (book.zhTW || book.zh) + '。';
    }
    return '你的 Token 用量相当于 ' + ratioStr + ' 本' + book.zh + '。';
  }

  function ensureHomeCardStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ag-studio-home-card-style')) return;
    var s = document.createElement('style');
    s.id = 'ag-studio-home-card-style';
    s.textContent = [
      '.ags-home-card { position:relative; border-radius:14px; border:1px solid var(--ags-border, rgba(148,163,184,.22)); background:color-mix(in srgb, var(--ags-bg-surface, #18181b) 92%, transparent); color:var(--ags-text-primary, #f4f4f5); padding:14px 16px; display:flex; flex-direction:column; gap:12px; font-family:var(--ags-font-ui, system-ui, sans-serif); font-variant-numeric:tabular-nums; box-shadow:0 8px 28px rgba(0,0,0,.08); backdrop-filter:blur(10px); }',
      '.ags-home-head { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }',
      '.ags-home-seg { display:inline-flex; padding:2px; border-radius:9px; background:var(--ags-bg-canvas, rgba(128,128,128,.08)); border:1px solid var(--ags-border, rgba(148,163,184,.18)); gap:2px; }',
      '.ags-home-seg-btn { border:none; background:transparent; color:var(--ags-text-secondary, #94a3b8); font-size:12px; font-weight:500; padding:4px 10px; border-radius:7px; cursor:pointer; transition:all 120ms ease; }',
      '.ags-home-seg-btn:hover { color:var(--ags-text-primary, #f4f4f5); }',
      '.ags-home-seg-btn.active { background:var(--ags-bg-surface, #27272a); color:var(--ags-accent, #D97757); font-weight:600; box-shadow:0 1px 3px rgba(0,0,0,.10); }',
      '.ags-home-kpis { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; }',
      '.ags-home-kpi { padding:9px 11px; border-radius:10px; border:1px solid var(--ags-border, rgba(148,163,184,.16)); background:var(--ags-bg-canvas, rgba(128,128,128,.05)); display:flex; flex-direction:column; gap:3px; min-width:0; }',
      '.ags-home-kpi-lbl { font-size:11px; color:var(--ags-text-secondary, #94a3b8); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
      '.ags-home-kpi-val { font-size:16px; font-weight:600; color:var(--ags-text-primary, #f4f4f5); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
      '.ags-home-heat-wrap { position:relative; display:flex; align-items:stretch; gap:6px; overflow-x:auto; padding:2px 0; }',
      '.ags-home-heat-days { display:grid; grid-template-rows:repeat(7, 1fr); gap:3px; font-size:9.5px; color:var(--ags-text-secondary, #94a3b8); align-items:center; padding-right:2px; flex-shrink:0; }',
      '.ags-home-heat-grid { display:grid; grid-template-rows:repeat(7, 11px); grid-auto-flow:column; grid-auto-columns:11px; gap:3px; flex:1; }',
      '.ags-home-heat-cell { width:11px; height:11px; border-radius:2.5px; background:var(--ags-bg-subtle, rgba(148,163,184,.16)); transition:transform 100ms ease; cursor:default; }',
      '.ags-home-heat-cell:hover { transform:scale(1.22); outline:1px solid var(--ags-accent, #D97757); }',
      '.ags-home-heat-cell[data-lvl="1"] { background:color-mix(in srgb, var(--ags-accent, #D97757) 26%, var(--ags-bg-subtle, transparent)); }',
      '.ags-home-heat-cell[data-lvl="2"] { background:color-mix(in srgb, var(--ags-accent, #D97757) 48%, var(--ags-bg-subtle, transparent)); }',
      '.ags-home-heat-cell[data-lvl="3"] { background:color-mix(in srgb, var(--ags-accent, #D97757) 72%, var(--ags-bg-subtle, transparent)); }',
      '.ags-home-heat-cell[data-lvl="4"] { background:var(--ags-accent, #D97757); }',
      '.ags-home-heat-tip { position:fixed; z-index:2147483600; pointer-events:none; padding:4px 8px; border-radius:6px; background:var(--ags-bg-surface, #18181b); border:1px solid var(--ags-border); color:var(--ags-text-primary); font-size:11px; box-shadow:0 4px 12px rgba(0,0,0,.22); opacity:0; transition:opacity 90ms ease; white-space:nowrap; }',
      '.ags-home-heat-tip[data-show="1"] { opacity:1; }',
      '.ags-home-foot { font-size:11.5px; color:var(--ags-text-secondary, #94a3b8); display:flex; align-items:center; justify-content:space-between; }',
      '.ags-home-split-bar { display:flex; height:8px; border-radius:99px; overflow:hidden; background:var(--ags-bg-subtle, rgba(148,163,184,.18)); gap:1px; }',
      '.ags-home-models { display:flex; flex-direction:column; gap:8px; }',
      '.ags-home-model-row { display:flex; flex-direction:column; gap:4px; }',
      '.ags-home-model-meta { display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:12px; }',
      '.ags-home-model-left { display:inline-flex; align-items:center; gap:7px; min-width:0; }',
      '.ags-home-swatch { width:8px; height:8px; border-radius:50%; flex-shrink:0; }',
      '.ags-home-prog { height:5px; border-radius:99px; background:var(--ags-bg-subtle, rgba(148,163,184,.16)); overflow:hidden; }',
      '.ags-home-prog-fill { height:100%; border-radius:99px; transition:width 200ms ease; }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function normalizeHeatmap7xN(overview, daysRange) {
    var raw = (overview && (overview.heatmap7xN || overview.heatmap)) || [];
    var byDate = {};
    if (Array.isArray(raw)) {
      for (var i = 0; i < raw.length; i++) {
        var item = raw[i];
        if (!item) continue;
        if (Array.isArray(item)) {
          for (var j = 0; j < item.length; j++) {
            var sub = item[j];
            if (sub && sub.date) byDate[sub.date] = Number(sub.total != null ? sub.total : (sub.totalTokens || 0));
          }
        } else if (item.date) {
          byDate[item.date] = Number(item.total != null ? item.total : (item.totalTokens || 0));
        }
      }
    }

    var weeks = daysRange === 7 ? 2 : daysRange === 30 ? 6 : 20;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    // Monday-based day of week (0 = Mon ... 6 = Sun)
    var dow = (today.getDay() + 6) % 7;
    var totalDays = weeks * 7;
    var endOffset = 6 - dow;
    var start = new Date(today.getTime());
    start.setDate(today.getDate() - (totalDays - 1 - endOffset));

    var cells = [];
    var maxVal = 0;
    for (var d = 0; d < totalDays; d++) {
      var cur = new Date(start.getTime());
      cur.setDate(start.getDate() + d);
      var key = cur.getFullYear() + '-' +
        String(cur.getMonth() + 1).padStart(2, '0') + '-' +
        String(cur.getDate()).padStart(2, '0');
      var isFuture = cur.getTime() > today.getTime();
      var val = isFuture ? 0 : (byDate[key] || 0);
      if (val > maxVal) maxVal = val;
      cells.push({ date: key, total: val, future: isFuture });
    }

    for (var c = 0; c < cells.length; c++) {
      var v = cells[c].total;
      var lvl = 0;
      if (v > 0 && maxVal > 0) {
        var r = v / maxVal;
        lvl = r >= 0.75 ? 4 : r >= 0.45 ? 3 : r >= 0.2 ? 2 : 1;
      }
      cells[c].level = lvl;
    }
    return cells;
  }

  function createHomeOverviewCard(options) {
    if (typeof document === 'undefined') return null;
    ensureHomeCardStyles();
    var opts = options || {};

    var card = document.createElement('section');
    card.className = 'ags-home-card';
    card.setAttribute('data-ag-studio-ignore', 'true');
    card.setAttribute('data-ag-no-i18n', 'true');

    var tipEl = document.createElement('div');
    tipEl.className = 'ags-home-heat-tip';
    tipEl.setAttribute('data-ag-studio-ignore', 'true');

    var state = {
      tab: 'overview', // overview | models
      days: 30,        // 0 (all) | 30 | 7
      bookSeed: Math.random(),
      data: null,
      loading: false
    };

    function getLang() {
      var cfg = typeof opts.getConfig === 'function' ? opts.getConfig() : {};
      return (cfg && cfg.i18n && cfg.i18n.language) || 'zh-CN';
    }

    function hideTip() {
      tipEl.removeAttribute('data-show');
    }

    function showTip(cell, ev) {
      var txt = cell.getAttribute('data-tip');
      if (!txt) return;
      if (!tipEl.parentElement) document.body.appendChild(tipEl);
      tipEl.textContent = txt;
      tipEl.style.left = Math.min((window.innerWidth || 1200) - 180, (ev.clientX || 0) + 10) + 'px';
      tipEl.style.top = Math.max(8, (ev.clientY || 0) - 32) + 'px';
      tipEl.setAttribute('data-show', '1');
    }

    function render() {
      var lang = getLang();
      var isEn = lang === 'en';
      var isTw = lang === 'zh-TW';

      var labels = isEn
        ? {
            overview: 'Overview', models: 'Models', all: 'All', d30: '30d', d7: '7d',
            sessions: 'Sessions', calls: 'Messages', total: 'Total Tokens',
            days: 'Active Days', peak: 'Peak Hour', topModel: 'Top Model',
            weekdays: ['M', '', 'W', '', 'F', '', 'S'],
            noModels: 'No model usage data yet',
            split: 'Desktop vs CLI'
          }
        : isTw
          ? {
              overview: '概覽', models: '模型', all: '全部', d30: '30 天', d7: '7 天',
              sessions: '會話數', calls: '訊息數', total: 'Token 總量',
              days: '活躍天數', peak: '高峰時段', topModel: '最常用模型',
              weekdays: ['一', '', '三', '', '五', '', '日'],
              noModels: '暫無模型用量資料',
              split: '桌面端 vs CLI 佔比'
            }
          : {
              overview: '概览', models: '模型', all: '全部', d30: '30 天', d7: '7 天',
              sessions: '会话数', calls: '消息数', total: 'Token 总量',
              days: '活跃天数', peak: '高峰时段', topModel: '最常用模型',
              weekdays: ['一', '', '三', '', '五', '', '日'],
              noModels: '暂无模型用量数据',
              split: '桌面端 vs CLI 占比'
            };

      var d = state.data || {};
      var headerHtml = [
        '<div class="ags-home-head">',
        '  <div class="ags-home-seg">',
        '    <button type="button" class="ags-home-seg-btn ' + (state.tab === 'overview' ? 'active' : '') + '" data-home-tab="overview">' + esc(labels.overview) + '</button>',
        '    <button type="button" class="ags-home-seg-btn ' + (state.tab === 'models' ? 'active' : '') + '" data-home-tab="models">' + esc(labels.models) + '</button>',
        '  </div>',
        '  <div class="ags-home-seg">',
        '    <button type="button" class="ags-home-seg-btn ' + (state.days === 0 ? 'active' : '') + '" data-home-days="0">' + esc(labels.all) + '</button>',
        '    <button type="button" class="ags-home-seg-btn ' + (state.days === 30 ? 'active' : '') + '" data-home-days="30">' + esc(labels.d30) + '</button>',
        '    <button type="button" class="ags-home-seg-btn ' + (state.days === 7 ? 'active' : '') + '" data-home-days="7">' + esc(labels.d7) + '</button>',
        '  </div>',
        '</div>'
      ].join('');

      var bodyHtml = '';
      if (state.tab === 'overview') {
        var totalTok = Number(d.totalTokens || 0);
        var kpis = [
          [labels.sessions, fmtCount(d.sessions || 0)],
          [labels.calls, fmtCount(d.calls || d.messages || 0)],
          [labels.total, fmtCompact(totalTok)],
          [labels.days, fmtCount(d.activeDays || 0)],
          [labels.peak, fmtPeakHour(d.peakHour, lang)],
          [labels.topModel, d.topModel || '—']
        ];
        var kpiHtml = kpis.map(function (k) {
          return '<div class="ags-home-kpi"><span class="ags-home-kpi-lbl">' + esc(k[0]) +
            '</span><span class="ags-home-kpi-val" title="' + esc(k[1]) + '">' + esc(k[1]) + '</span></div>';
        }).join('');

        var cells = normalizeHeatmap7xN(d, state.days);
        var dayAxis = labels.weekdays.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('');
        var gridCells = cells.map(function (c) {
          var tip = c.future ? '' : (c.date + ' · ' + fmtCompact(c.total) + ' tokens');
          return '<span class="ags-home-heat-cell" data-lvl="' + c.level + '" ' +
            (tip ? ('data-tip="' + esc(tip) + '"') : 'style="opacity:0.25"') + '></span>';
        }).join('');

        bodyHtml = [
          '<div class="ags-home-kpis">' + kpiHtml + '</div>',
          '<div class="ags-home-heat-wrap">',
          '  <div class="ags-home-heat-days">' + dayAxis + '</div>',
          '  <div class="ags-home-heat-grid">' + gridCells + '</div>',
          '</div>',
          '<div class="ags-home-foot"><span>' + esc(formatFunBookText(totalTok, lang, state.bookSeed)) + '</span></div>'
        ].join('');
      } else {
        var bySource = d.bySource || {};
        var deskTok = Number((bySource.desktop && bySource.desktop.totalTokens) || bySource.desktop || 0);
        var cliTok = Number((bySource.cli && bySource.cli.totalTokens) || bySource.cli || 0);
        var sumSrc = Math.max(1, deskTok + cliTok);
        var deskPct = deskTok + cliTok > 0 ? Math.round((deskTok / sumSrc) * 100) : 100;
        var cliPct = deskTok + cliTok > 0 ? (100 - deskPct) : 0;

        var models = Array.isArray(d.byModel) ? d.byModel.slice(0, 6) : [];
        var sumModels = models.reduce(function (acc, m) { return acc + Number(m.totalTokens || 0); }, 0) || 1;
        var maxModel = Math.max.apply(null, models.map(function (m) { return Number(m.totalTokens || 0); }).concat([1]));
        var modelRows = models.length
          ? models.map(function (m, idx) {
              var tok = Number(m.totalTokens || 0);
              var pct = ((tok / sumModels) * 100).toFixed(1).replace(/\.0$/, '');
              var barW = Math.round((tok / maxModel) * 100);
              var color = MODEL_COLORS[idx % MODEL_COLORS.length];
              return '<div class="ags-home-model-row">' +
                '  <div class="ags-home-model-meta">' +
                '    <span class="ags-home-model-left"><span class="ags-home-swatch" style="background:' + color + '"></span><span>' + esc(m.model || 'unknown') + '</span></span>' +
                '    <span style="color:var(--ags-text-secondary)">' + esc(fmtCompact(tok)) + ' (' + pct + '%)</span>' +
                '  </div>' +
                '  <div class="ags-home-prog"><div class="ags-home-prog-fill" style="width:' + barW + '%;background:' + color + '"></div></div>' +
                '</div>';
            }).join('')
          : '<div style="font-size:12px;color:var(--ags-text-secondary)">' + esc(labels.noModels) + '</div>';

        bodyHtml = [
          '<div>',
          '  <div class="ags-home-model-meta" style="margin-bottom:5px"><span style="color:var(--ags-text-secondary)">' + esc(labels.split) + '</span><span>Desktop ' + deskPct + '% · CLI ' + cliPct + '%</span></div>',
          '  <div class="ags-home-split-bar"><div style="width:' + deskPct + '%;background:var(--ags-accent,#D97757)"></div><div style="width:' + cliPct + '%;background:#10B981"></div></div>',
          '</div>',
          '<div class="ags-home-models">' + modelRows + '</div>'
        ].join('');
      }

      card.innerHTML = headerHtml + bodyHtml;

      card.querySelectorAll('[data-home-tab]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.tab = btn.getAttribute('data-home-tab');
          render();
        });
      });
      card.querySelectorAll('[data-home-days]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.days = Number(btn.getAttribute('data-home-days'));
          if (typeof opts.onRangeChange === 'function') opts.onRangeChange(state.days);
          render();
        });
      });
      card.querySelectorAll('.ags-home-heat-cell[data-tip]').forEach(function (cell) {
        cell.addEventListener('pointerenter', function (ev) { showTip(cell, ev); });
        cell.addEventListener('pointerleave', hideTip);
      });
    }

    function update(overviewData, cfg) {
      var hudCfg = (cfg && cfg.hud) || {};
      var enabled = !(cfg && cfg.homeOverview === false) && !(hudCfg.homeOverview === false);
      var anchors = globalScope.__AG_STUDIO_ANCHORS__;

      if (!enabled || !anchors) {
        if (anchors) anchors.parkHomeCardSlot();
        hideTip();
        return;
      }

      var slot = anchors.ensureHomeCardSlot();
      if (!slot) {
        hideTip();
        return;
      }
      if (card.parentElement !== slot) {
        slot.appendChild(card);
      }
      if (overviewData) {
        state.data = overviewData;
      }
      render();
    }

    function destroy() {
      hideTip();
      if (tipEl.parentElement) tipEl.parentElement.removeChild(tipEl);
      if (card.parentElement) card.parentElement.removeChild(card);
    }

    return {
      element: card,
      getDays: function () { return state.days; },
      update: update,
      render: render,
      destroy: destroy
    };
  }

  var api = {
    createHomeOverviewCard: createHomeOverviewCard,
    normalizeHeatmap7xN: normalizeHeatmap7xN,
    formatFunBookText: formatFunBookText
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_HOME_CARD__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
