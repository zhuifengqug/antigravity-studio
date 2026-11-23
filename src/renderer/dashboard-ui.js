(function (globalScope) {
  'use strict';

  var UI_TEXT = {
    'zh-CN': {
      tabs: { overview: '概览', usage: '统计', accounts: '账号', settings: '设置' },
      title: 'Antigravity Studio',
      close: '收起',
      ctxTitle: '当前上下文',
      ctxLegend: { system: '系统', tools: '工具', chat: '对话', think: '思考' },
      perfTitle: '实时性能',
      speed: '输出速度',
      ttft: '首字延迟',
      cost: '本轮估算',
      quotaTitle: '模型额度',
      noQuota: '连接本地 LanguageServer 后自动显示模型额度',
      launchCli: '打开 CLI 终端',
      days7: '7天', days30: '30天', days90: '90天',
      totalTok: '总消耗', estApi: '估算 API 费用', vsSub: '较订阅节省',
      heatmap: '活跃热力图',
      sourceSplit: '桌面端 vs CLI 占比',
      topModels: '热门模型排行',
      importCur: '导入当前', addOauth: 'OAuth 添加', refreshQuota: '刷新额度',
      activeTag: '当前', switchBtn: '切换',
      autoSwitchTitle: '低额度自动切号策略（默认关闭）',
      secTheme: '外观与桌宠',
      secLang: '语言与词典',
      secNet: '代理与高级',
      testProxy: '测速',
      customDictTitle: '自定义词典（覆盖内置词条）',
      customThemeTitle: '自定义配色方案（新建 / 克隆 / 编辑）',
      advancedTitle: '高级设置（Bypass / 按模型上下文 / 会话标题 / 重启）'
    },
    'zh-TW': {
      tabs: { overview: '概覽', usage: '統計', accounts: '帳號', settings: '設定' },
      title: 'Antigravity Studio',
      close: '收合',
      ctxTitle: '目前上下文',
      ctxLegend: { system: '系統', tools: '工具', chat: '對話', think: '思考' },
      perfTitle: '即時效能',
      speed: '輸出速度',
      ttft: '首字延遲',
      cost: '本輪估算',
      quotaTitle: '模型額度',
      noQuota: '連線本機 LanguageServer 後自動顯示模型額度',
      launchCli: '開啟 CLI 終端機',
      days7: '7天', days30: '30天', days90: '90天',
      totalTok: '總消耗', estApi: '估算 API 費用', vsSub: '較訂閱節省',
      heatmap: '活躍熱力圖',
      sourceSplit: '桌面端 vs CLI 佔比',
      topModels: '熱門模型排行',
      importCur: '匯入目前', addOauth: 'OAuth 新增', refreshQuota: '重新整理額度',
      activeTag: '使用中', switchBtn: '切換',
      autoSwitchTitle: '低額度自動切號策略（預設關閉）',
      secTheme: '外觀與桌寵',
      secLang: '語言與詞典',
      secNet: '代理與進階',
      testProxy: '測速',
      customDictTitle: '自訂詞典（覆蓋內建詞條）',
      customThemeTitle: '自訂配色方案（新增 / 複製 / 編輯）',
      advancedTitle: '進階設定（Bypass / 按模型上下文 / 工作階段標題 / 重啟）'
    },
    'en': {
      tabs: { overview: 'Overview', usage: 'Usage', accounts: 'Accounts', settings: 'Settings' },
      title: 'Antigravity Studio',
      close: 'Close',
      ctxTitle: 'Context Window',
      ctxLegend: { system: 'System', tools: 'Tools', chat: 'Chat', think: 'Thinking' },
      perfTitle: 'Live Performance',
      speed: 'Speed',
      ttft: 'TTFT',
      cost: 'Est. Cost',
      quotaTitle: 'Model Quotas',
      noQuota: 'Connects automatically to local LanguageServer when active',
      launchCli: 'Open CLI Terminal',
      days7: '7d', days30: '30d', days90: '90d',
      totalTok: 'Total Tokens', estApi: 'Est. API Cost', vsSub: 'vs Subscription',
      heatmap: 'Activity Heatmap',
      sourceSplit: 'Desktop vs CLI',
      topModels: 'Top Models',
      importCur: 'Import Current', addOauth: 'Add via OAuth', refreshQuota: 'Refresh',
      activeTag: 'Active', switchBtn: 'Switch',
      autoSwitchTitle: 'Auto-switch on low quota (off by default)',
      secTheme: 'Appearance & Mascot',
      secLang: 'Language & Dictionary',
      secNet: 'Proxy & Advanced',
      testProxy: 'Test',
      customDictTitle: 'Custom Dictionary Overrides',
      customThemeTitle: 'Custom Color Schemes (Create / Clone / Edit)',
      advancedTitle: 'Advanced (Bypass / Per-model Limits / Chinese Title / Restart)'
    }
  };

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtTok(n) {
    var v = Number(n || 0);
    if (v >= 1000000) return (v / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
    if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(Math.round(v));
  }

  function formatResetEta(isoStr) {
    if (!isoStr) return '';
    var ms = Date.parse(isoStr) - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) return '';
    var mins = Math.round(ms / 60000);
    if (mins < 60) return mins + 'm';
    var hrs = Math.floor(mins / 60);
    var rem = mins % 60;
    return hrs + 'h ' + rem + 'm';
  }

  function ensureDrawerStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ag-studio-drawer-style')) return;
    var style = document.createElement('style');
    style.id = 'ag-studio-drawer-style';
    style.textContent = [
      '.ags-drawer { position:fixed; top:12px; right:12px; bottom:12px; width:420px; max-width:calc(100vw - 24px); background:var(--ags-bg-surface,#18181b); color:var(--ags-text-primary,#f4f4f5); border:1px solid var(--ags-border,#2e2e32); border-radius:14px; box-shadow:var(--ags-shadow,0 16px 40px rgba(0,0,0,0.45)); z-index:2147483500; display:flex; flex-direction:column; font-family:var(--ags-font-ui,system-ui,sans-serif); font-size:13px; font-variant-numeric:tabular-nums; transition:transform 180ms cubic-bezier(.22,1,.36,1), opacity 160ms ease; overflow:hidden; }',
      '.ags-drawer.ags-hidden { transform:translateX(calc(100% + 24px)); opacity:0; pointer-events:none; }',
      '.ags-head { display:flex; align-items:center; justify-content:space-between; padding:14px 16px 10px 16px; border-bottom:1px solid var(--ags-border); }',
      '.ags-title { font-size:14px; font-weight:600; letter-spacing:-0.01em; display:flex; align-items:center; gap:8px; }',
      '.ags-dot { width:8px; height:8px; border-radius:50%; background:var(--ags-accent,#D97757); }',
      '.ags-tabs { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; padding:8px 16px; border-bottom:1px solid var(--ags-border); background:var(--ags-bg-canvas); }',
      '.ags-tab { border:none; background:transparent; color:var(--ags-text-secondary); padding:6px 4px; border-radius:8px; cursor:pointer; font-size:12.5px; font-weight:500; transition:all 120ms ease; }',
      '.ags-tab.active { background:var(--ags-bg-surface); color:var(--ags-text-primary); box-shadow:0 1px 3px rgba(0,0,0,0.08); }',
      '.ags-body { flex:1; overflow-y:auto; padding:14px 16px 20px 16px; display:flex; flex-direction:column; gap:12px; }',
      '.ags-card { background:var(--ags-bg-canvas); border:1px solid var(--ags-border); border-radius:11px; padding:13px 14px; display:flex; flex-direction:column; gap:10px; }',
      '.ags-card-head { display:flex; align-items:center; justify-content:space-between; font-size:12px; color:var(--ags-text-secondary); font-weight:500; }',
      '.ags-big { font-size:22px; font-weight:600; letter-spacing:-0.02em; color:var(--ags-text-primary); }',
      '.ags-sub { font-size:11.5px; color:var(--ags-text-secondary); }',
      '.ags-seg-bar { display:flex; height:7px; border-radius:99px; overflow:hidden; background:var(--ags-bg-subtle); gap:1px; }',
      '.ags-legend { display:flex; flex-wrap:wrap; gap:10px; font-size:11.5px; color:var(--ags-text-secondary); }',
      '.ags-legend-item { display:inline-flex; align-items:center; gap:5px; }',
      '.ags-swatch { width:7px; height:7px; border-radius:2px; }',
      '.ags-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }',
      '.ags-metric-box { padding:8px 10px; border-radius:9px; background:var(--ags-bg-surface); border:1px solid var(--ags-border); }',
      '.ags-metric-val { font-size:16px; font-weight:600; margin-top:2px; }',
      '.ags-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }',
      '.ags-prog { width:100%; height:5px; border-radius:99px; background:var(--ags-bg-subtle); overflow:hidden; }',
      '.ags-prog-fill { height:100%; border-radius:99px; background:var(--ags-accent); transition:width 200ms ease; }',
      '.ags-btn { border:1px solid var(--ags-border); background:var(--ags-bg-surface); color:var(--ags-text-primary); padding:5px 10px; border-radius:8px; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:5px; transition:border-color 120ms ease, background 120ms ease; }',
      '.ags-btn:hover { border-color:var(--ags-accent); }',
      '.ags-btn-primary { background:var(--ags-accent); color:#fff; border-color:var(--ags-accent); }',
      '.ags-btn-primary:hover { background:var(--ags-accent-hover); }',
      '.ags-btn-ghost { border:none; background:transparent; color:var(--ags-text-secondary); padding:4px 8px; }',
      '.ags-btn-ghost:hover { color:var(--ags-text-primary); background:var(--ags-bg-subtle); }',
      '.ags-input, .ags-select { width:100%; box-sizing:border-box; height:31px; padding:0 9px; border-radius:8px; border:1px solid var(--ags-border); background:var(--ags-bg-surface); color:var(--ags-text-primary); font-size:12.5px; outline:none; }',
      '.ags-input:focus, .ags-select:focus { border-color:var(--ags-accent); }',
      '.ags-pill-group { display:inline-flex; padding:2px; border-radius:8px; background:var(--ags-bg-surface); border:1px solid var(--ags-border); gap:2px; }',
      '.ags-pill-opt { border:none; background:transparent; color:var(--ags-text-secondary); padding:3px 9px; border-radius:6px; font-size:11.5px; cursor:pointer; }',
      '.ags-pill-opt.active { background:var(--ags-accent-soft); color:var(--ags-accent); font-weight:600; }',
      '.ags-theme-cards { display:grid; grid-template-columns:1fr 1fr; gap:8px; }',
      '.ags-theme-card { padding:10px; border-radius:10px; border:1px solid var(--ags-border); background:var(--ags-bg-surface); cursor:pointer; text-align:left; transition:border-color 120ms ease; }',
      '.ags-theme-card.active { border-color:var(--ags-accent); box-shadow:0 0 0 1px var(--ags-accent); }',
      '.ags-acc-item { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; border-radius:10px; border:1px solid var(--ags-border); background:var(--ags-bg-surface); }',
      '.ags-avatar { width:30px; height:30px; border-radius:50%; background:var(--ags-accent-soft); color:var(--ags-accent); display:flex; align-items:center; justify-content:center; font-weight:600; flex-shrink:0; }',
      '.ags-details { border:1px solid var(--ags-border); border-radius:10px; background:var(--ags-bg-surface); padding:8px 11px; }',
      '.ags-details summary { cursor:pointer; font-size:12px; color:var(--ags-text-secondary); font-weight:500; outline:none; user-select:none; }',
      '.ags-details[open] summary { margin-bottom:10px; color:var(--ags-text-primary); }',
      '.ags-heatmap { display:grid; grid-template-columns:repeat(15, 1fr); gap:3px; }',
      '.ags-hm-cell { aspect-ratio:1; border-radius:2px; background:var(--ags-bg-subtle); }',
      '.ags-toast { position:fixed; bottom:56px; right:20px; z-index:2147483600; padding:7px 13px; border-radius:9px; background:var(--ags-bg-surface); border:1px solid var(--ags-accent); color:var(--ags-text-primary); font-size:12px; box-shadow:var(--ags-shadow); }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(style);
  }

  function renderSparklineSvg(values) {
    var list = Array.isArray(values) && values.length >= 2 ? values : [0, 0];
    var w = 160;
    var h = 28;
    var max = Math.max.apply(null, list.concat([1]));
    var pts = list.map(function (v, idx) {
      var x = (idx / (list.length - 1)) * w;
      var y = h - 3 - ((v / max) * (h - 6));
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="28" style="display:block;overflow:visible">' +
      '<polyline fill="none" stroke="var(--ags-accent,#D97757)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" points="' + pts + '"/>' +
      '</svg>';
  }

  function createDashboardDrawer(options) {
    if (typeof document === 'undefined') return null;
    ensureDrawerStyles();
    var opts = options || {};
    var el = document.createElement('aside');
    el.className = 'ags-drawer ags-hidden';
    el.setAttribute('data-ag-studio-ignore', 'true');

    var state = {
      open: false,
      activeTab: 'overview',
      days: 30,
      speedHistory: [],
      proxyTestResult: null,
      statusMessage: ''
    };

    function t(key) {
      var lang = (opts.getConfig() && opts.getConfig().i18n && opts.getConfig().i18n.language) || 'zh-CN';
      return (UI_TEXT[lang] || UI_TEXT['zh-CN'])[key];
    }

    function showToast(msg) {
      if (!msg) return;
      var toast = document.createElement('div');
      toast.className = 'ags-toast';
      toast.setAttribute('data-ag-studio-ignore', 'true');
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(function () { try { toast.remove(); } catch (_e) {} }, 2600);
    }

    function renderOverview(snap) {
      var ctx = (snap && snap.context) || {};
      var bd = ctx.breakdown || {};
      var totalUsed = Math.max(1, Number(ctx.usedTokens || 0));
      var limit = Number(ctx.contextLimit || 200000);
      var pct = Math.min(100, Math.round((ctx.usedTokens || 0) / limit * 100));

      var segSys = Math.round(((bd.system || 0) / totalUsed) * 100);
      var segTool = Math.round(((bd.tools || 0) / totalUsed) * 100);
      var segChat = Math.round((((bd.user || 0) + (bd.assistant || 0)) / totalUsed) * 100);
      var segThink = Math.max(0, 100 - segSys - segTool - segChat);

      var speed = (ctx.speed && ctx.speed.tokPerSec) || 0;
      var ttft = (ctx.speed && ctx.speed.ttftMs) || 0;
      var cost = Number((snap && snap.estimatedSessionCostUsd) || 0);
      var pools = (snap && snap.quota && snap.quota.pools) || [];
      var legend = t('ctxLegend');

      var quotaHtml = pools.length
        ? pools.map(function (p) {
            var pPct = p.remainingPercent == null ? 100 : p.remainingPercent;
            var eta = formatResetEta(p.resetTime);
            var barColor = p.isLow ? 'var(--ags-warning)' : 'var(--ags-accent)';
            return '<div style="display:flex;flex-direction:column;gap:4px">' +
              '<div class="ags-row"><span style="font-size:12px">' + esc(p.poolKey) + '</span>' +
              '<span class="ags-sub">' + pPct + '%' + (eta ? (' · ' + eta) : '') + '</span></div>' +
              '<div class="ags-prog"><div class="ags-prog-fill" style="width:' + pPct + '%;background:' + barColor + '"></div></div>' +
              '</div>';
          }).join('')
        : '<div class="ags-sub">' + esc(t('noQuota')) + '</div>';

      return [
        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('ctxTitle')) + '</span><span>' + esc(ctx.model || 'gemini-4-neon') + '</span></div>',
        '  <div class="ags-row"><span class="ags-big">' + pct + '%</span><span class="ags-sub">' + fmtTok(ctx.usedTokens || 0) + ' / ' + fmtTok(limit) + '</span></div>',
        '  <div class="ags-seg-bar">' +
        '    <div style="width:' + segSys + '%;background:var(--ags-accent)"></div>' +
        '    <div style="width:' + segTool + '%;background:var(--ags-success)"></div>' +
        '    <div style="width:' + segChat + '%;background:#60A5FA"></div>' +
        '    <div style="width:' + segThink + '%;background:var(--ags-warning)"></div>' +
        '  </div>',
        '  <div class="ags-legend">' +
        '    <span class="ags-legend-item"><span class="ags-swatch" style="background:var(--ags-accent)"></span>' + legend.system + ' ' + fmtTok(bd.system || 0) + '</span>' +
        '    <span class="ags-legend-item"><span class="ags-swatch" style="background:var(--ags-success)"></span>' + legend.tools + ' ' + fmtTok(bd.tools || 0) + '</span>' +
        '    <span class="ags-legend-item"><span class="ags-swatch" style="background:#60A5FA"></span>' + legend.chat + ' ' + fmtTok((bd.user || 0) + (bd.assistant || 0)) + '</span>' +
        '    <span class="ags-legend-item"><span class="ags-swatch" style="background:var(--ags-warning)"></span>' + legend.think + ' ' + fmtTok(bd.thinking || 0) + '</span>' +
        '  </div>',
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('perfTitle')) + '</span><span>缓存命中 ' + Math.round((ctx.cacheHitRate || 0) * 100) + '%</span></div>',
        '  <div class="ags-grid-3">',
        '    <div class="ags-metric-box"><div class="ags-sub">' + esc(t('speed')) + '</div><div class="ags-metric-val">' + speed + ' <span class="ags-sub">tok/s</span></div></div>',
        '    <div class="ags-metric-box"><div class="ags-sub">' + esc(t('ttft')) + '</div><div class="ags-metric-val">' + (ttft || '-') + ' <span class="ags-sub">ms</span></div></div>',
        '    <div class="ags-metric-box"><div class="ags-sub">' + esc(t('cost')) + '</div><div class="ags-metric-val">$' + cost.toFixed(3) + '</div></div>',
        '  </div>',
        '  <div>' + renderSparklineSvg(state.speedHistory.slice(-16)) + '</div>',
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('quotaTitle')) + '</span>' +
        '    <button class="ags-btn" data-action="launch-cli">' + esc(t('launchCli')) + '</button></div>',
        quotaHtml,
        '</div>'
      ].join('\n');
    }

    function renderUsage(hist) {
      var h = hist || { totalTokens: 0, estimated30dCostUsd: 0, savingsVsApiUsd: 0, bySource: { desktop: { totalTokens: 0 }, cli: { totalTokens: 0 } }, byModel: [], heatmap: [] };
      var cells = (h.heatmap || []).slice(-60);
      var maxDay = Math.max.apply(null, cells.map(function (c) { return c.totalTokens || 0; }).concat([1]));
      var hmHtml = cells.map(function (c) {
        var ratio = (c.totalTokens || 0) / maxDay;
        var alpha = ratio === 0 ? 0.08 : (0.22 + ratio * 0.78).toFixed(2);
        var bg = ratio === 0 ? 'var(--ags-bg-subtle)' : 'color-mix(in srgb, var(--ags-accent) ' + Math.round(alpha * 100) + '%, transparent)';
        return '<div class="ags-hm-cell" style="background:' + bg + '" title="' + esc(c.date + ': ' + fmtTok(c.totalTokens) + ' ($' + (c.costUsd || 0).toFixed(2) + ')') + '"></div>';
      }).join('');

      var deskTok = (h.bySource && h.bySource.desktop && h.bySource.desktop.totalTokens) || 0;
      var cliTok = (h.bySource && h.bySource.cli && h.bySource.cli.totalTokens) || 0;
      var sumSrc = Math.max(1, deskTok + cliTok);
      var deskPct = Math.round((deskTok / sumSrc) * 100);
      var cliPct = 100 - deskPct;

      var topModels = (h.byModel || []).slice(0, 4);
      var maxModel = Math.max.apply(null, topModels.map(function (m) { return m.totalTokens || 0; }).concat([1]));
      var modelHtml = topModels.length
        ? topModels.map(function (m) {
            var w = Math.round(((m.totalTokens || 0) / maxModel) * 100);
            return '<div style="display:flex;flex-direction:column;gap:3px">' +
              '<div class="ags-row"><span style="font-size:12px">' + esc(m.model) + '</span><span class="ags-sub">' + fmtTok(m.totalTokens) + ' · $' + (m.costUsd || 0).toFixed(2) + '</span></div>' +
              '<div class="ags-prog"><div class="ags-prog-fill" style="width:' + w + '%"></div></div></div>';
          }).join('')
        : '<div class="ags-sub">暂无历史用量记录</div>';

      return [
        '<div class="ags-row">',
        '  <div class="ags-pill-group">',
        '    <button class="ags-pill-opt ' + (state.days === 7 ? 'active' : '') + '" data-days="7">' + esc(t('days7')) + '</button>',
        '    <button class="ags-pill-opt ' + (state.days === 30 ? 'active' : '') + '" data-days="30">' + esc(t('days30')) + '</button>',
        '    <button class="ags-pill-opt ' + (state.days === 90 ? 'active' : '') + '" data-days="90">' + esc(t('days90')) + '</button>',
        '  </div>',
        '  <span class="ags-sub">均速 ' + (h.avgTokPerSec || 0) + ' tok/s</span>',
        '</div>',

        '<div class="ags-grid-3">',
        '  <div class="ags-metric-box"><div class="ags-sub">' + esc(t('totalTok')) + '</div><div class="ags-metric-val">' + fmtTok(h.totalTokens) + '</div></div>',
        '  <div class="ags-metric-box"><div class="ags-sub">' + esc(t('estApi')) + '</div><div class="ags-metric-val">$' + Number(h.totalCostUsd || 0).toFixed(2) + '</div></div>',
        '  <div class="ags-metric-box"><div class="ags-sub">' + esc(t('vsSub')) + '</div><div class="ags-metric-val">' + (h.savingsVsApiUsd >= 0 ? ('+$' + h.savingsVsApiUsd.toFixed(1)) : ('-$' + Math.abs(h.savingsVsApiUsd).toFixed(1))) + '</div></div>',
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('heatmap')) + '</span><span class="ags-sub">近 60 天</span></div>',
        '  <div class="ags-heatmap">' + hmHtml + '</div>',
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('sourceSplit')) + '</span><span class="ags-sub">Desktop ' + deskPct + '% / CLI ' + cliPct + '%</span></div>',
        '  <div class="ags-seg-bar"><div style="width:' + deskPct + '%;background:var(--ags-accent)"></div><div style="width:' + cliPct + '%;background:var(--ags-success)"></div></div>',
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('topModels')) + '</span></div>',
        modelHtml,
        '</div>'
      ].join('\n');
    }

    function renderAccounts(overview) {
      var ov = overview || { accounts: [], autoSwitch: { enabled: false, threshold: 0.05 } };
      var list = ov.accounts || [];
      var cards = list.length
        ? list.map(function (a) {
            var letter = (a.name || a.email || 'A').slice(0, 1).toUpperCase();
            var minQ = a.quotaSnapshot && a.quotaSnapshot.minRemainingPercent;
            return '<div class="ags-acc-item">' +
              '  <div style="display:flex;align-items:center;gap:10px;min-width:0">' +
              '    <div class="ags-avatar">' + esc(letter) + '</div>' +
              '    <div style="min-width:0">' +
              '      <div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(a.email || a.name) + '</div>' +
              '      <div class="ags-sub">' + esc(a.planName || a.source || 'Standard') + (minQ != null ? (' · 额度 ' + minQ + '%') : '') + '</div>' +
              '    </div>' +
              '  </div>' +
              '  <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">' +
              (a.isActive
                ? '<span class="ags-pill-opt active">' + esc(t('activeTag')) + '</span>'
                : '<button class="ags-btn ags-btn-primary" data-acc-switch="' + esc(a.id) + '">' + esc(t('switchBtn')) + '</button>') +
              '    <button class="ags-btn ags-btn-ghost" title="移除" data-acc-remove="' + esc(a.id) + '">×</button>' +
              '  </div>' +
              '</div>';
          }).join('')
        : '<div class="ags-card"><div class="ags-sub">尚未保存账号槽位，点击上方「导入当前」快速保存当前登录态。</div></div>';

      return [
        '<div class="ags-row">',
        '  <button class="ags-btn ags-btn-primary" data-acc-action="import_current">' + esc(t('importCur')) + '</button>',
        '  <button class="ags-btn" data-acc-action="oauth_login">' + esc(t('addOauth')) + '</button>',
        '  <button class="ags-btn" data-acc-action="refresh_quota">' + esc(t('refreshQuota')) + '</button>',
        '</div>',
        cards,
        '<details class="ags-details">',
        '  <summary>' + esc(t('autoSwitchTitle')) + '</summary>',
        '  <div class="ags-row" style="margin-bottom:8px"><span>启用低额度自动切号</span><input type="checkbox" id="ags-auto-switch-en" ' + (ov.autoSwitch && ov.autoSwitch.enabled ? 'checked' : '') + '></div>',
        '  <div class="ags-row"><span>触发阈值 (%)</span><input class="ags-input" style="width:90px" type="number" min="1" max="50" id="ags-auto-switch-th" value="' + Math.round(((ov.autoSwitch && ov.autoSwitch.threshold) || 0.05) * 100) + '"></div>',
        '</details>'
      ].join('\n');
    }

    function renderSettings(cfg, extra) {
      var themeCfg = cfg.theme || {};
      var mascotCfg = cfg.mascot || {};
      var hudCfg = cfg.hud || {};
      var i18nCfg = cfg.i18n || {};
      var proxyCfg = cfg.proxy || {};
      var fonts = themeCfg.fonts || {};
      var customThemes = Array.isArray(themeCfg.customThemes) ? themeCfg.customThemes : [];
      var scannedFonts = (extra && extra.fonts) || [];
      var ctxLimits = (cfg.context && cfg.context.perModelLimits) || {};

      var customThemeOptions = customThemes.map(function (ct) {
        return '<div class="ags-row" style="margin-top:6px">' +
          '<button class="ags-btn ' + (themeCfg.activePreset === ct.id ? 'ags-btn-primary' : '') + '" data-select-theme="' + esc(ct.id) + '">' + esc(ct.name) + '</button>' +
          '<button class="ags-btn ags-btn-ghost" data-del-theme="' + esc(ct.id) + '">删除</button>' +
          '</div>';
      }).join('');

      var modelLimitRows = Object.entries(ctxLimits).slice(0, 6).map(function (pair) {
        return '<div class="ags-row" style="margin-top:6px"><span class="ags-sub">' + esc(pair[0]) + '</span>' +
          '<input class="ags-input" style="width:110px" type="number" data-model-limit="' + esc(pair[0]) + '" value="' + esc(pair[1]) + '"></div>';
      }).join('');

      return [
        // Section 1: Appearance & Mascot
        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('secTheme')) + '</span></div>',
        '  <div class="ags-theme-cards">',
        '    <button class="ags-theme-card ' + (themeCfg.activePreset === 'claude' ? 'active' : '') + '" data-select-theme="claude">' +
        '      <div style="display:flex;align-items:center;gap:6px;font-weight:600"><span class="ags-swatch" style="background:#D97757;border-radius:50%"></span>Claude</div>' +
        '      <div class="ags-sub" style="margin-top:2px">暖纸陶橙桌面风格</div>' +
        '    </button>',
        '    <button class="ags-theme-card ' + (themeCfg.activePreset === 'antigravity' ? 'active' : '') + '" data-select-theme="antigravity">' +
        '      <div style="display:flex;align-items:center;gap:6px;font-weight:600"><span class="ags-swatch" style="background:#3B6CF6;border-radius:50%"></span>Antigravity</div>' +
        '      <div class="ags-sub" style="margin-top:2px">原创星轨极光</div>' +
        '    </button>',
        '  </div>',
        '  <div class="ags-row"><span>明暗模式</span>' +
        '    <div class="ags-pill-group">' +
        '      <button class="ags-pill-opt ' + (themeCfg.colorMode === 'system' ? 'active' : '') + '" data-colormode="system">系统</button>' +
        '      <button class="ags-pill-opt ' + (themeCfg.colorMode === 'light' ? 'active' : '') + '" data-colormode="light">浅色</button>' +
        '      <button class="ags-pill-opt ' + (themeCfg.colorMode === 'dark' ? 'active' : '') + '" data-colormode="dark">深色</button>' +
        '    </div></div>',
        '  <div class="ags-row"><span>编辑部衬线阅读</span><input type="checkbox" id="ags-serif-toggle" ' + (themeCfg.editorialSerif !== false ? 'checked' : '') + '></div>',
        '  <div class="ags-row"><span>桌宠</span>' +
        '    <div style="display:flex;gap:6px;align-items:center">' +
        '      <select class="ags-select" style="width:110px" id="ags-mascot-style">' +
        '        <option value="clawd" ' + (mascotCfg.style === 'clawd' ? 'selected' : '') + '>Clawd 蟹</option>' +
        '        <option value="astra" ' + (mascotCfg.style === 'astra' ? 'selected' : '') + '>Astra 星灵</option>' +
        '      </select>' +
        '      <select class="ags-select" style="width:72px" id="ags-mascot-scale">' +
        '        <option value="1" ' + (Number(mascotCfg.scale || 1) === 1 ? 'selected' : '') + '>1x</option>' +
        '        <option value="1.5" ' + (Number(mascotCfg.scale) === 1.5 ? 'selected' : '') + '>1.5x</option>' +
        '        <option value="2" ' + (Number(mascotCfg.scale) === 2 ? 'selected' : '') + '>2x</option>' +
        '      </select>' +
        '      <input type="checkbox" id="ags-mascot-enabled" ' + (mascotCfg.enabled !== false ? 'checked' : '') + '>' +
        '    </div></div>',
        '  <div class="ags-row"><span>HUD 状态胶囊</span>' +
        '    <div style="display:flex;gap:6px;align-items:center">' +
        '      <select class="ags-select" style="width:110px" id="ags-hud-pos">' +
        '        <option value="composer" ' + (hudCfg.position !== 'floating' ? 'selected' : '') + '>锚定输入框</option>' +
        '        <option value="floating" ' + (hudCfg.position === 'floating' ? 'selected' : '') + '>右下角悬浮</option>' +
        '      </select>' +
        '      <input type="checkbox" id="ags-hud-enabled" ' + (hudCfg.enabled !== false ? 'checked' : '') + '>' +
        '    </div></div>',
        '  <details class="ags-details">',
        '    <summary>' + esc(t('customThemeTitle')) + '</summary>',
        '    <div class="ags-row" style="gap:6px">' +
        '      <input class="ags-input" id="ags-new-theme-name" placeholder="新方案名称">' +
        '      <input type="color" id="ags-new-theme-accent" value="#D97757" style="width:36px;height:31px;border:none;background:transparent">' +
        '      <button class="ags-btn" id="ags-create-theme-btn">新建</button>' +
        '    </div>',
        customThemeOptions,
        '    <div class="ags-row" style="margin-top:8px"><span class="ags-sub">本地字体目录 (' + scannedFonts.length + ' 个已加载)</span><button class="ags-btn" data-open-path="fonts">打开目录</button></div>',
        '    <div class="ags-row" style="margin-top:6px"><span class="ags-sub">自定义正文字体名</span><input class="ags-input" style="width:170px" id="ags-custom-body-font" value="' + esc(fonts.customBodyFont || '') + '" placeholder="留空使用默认"></div>',
        '  </details>',
        '</div>',

        // Section 2: Language & Dictionary
        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('secLang')) + '</span></div>',
        '  <div class="ags-row"><span>界面语言</span>' +
        '    <div class="ags-pill-group">' +
        '      <button class="ags-pill-opt ' + (i18nCfg.language === 'zh-CN' ? 'active' : '') + '" data-lang="zh-CN">简体</button>',
        '      <button class="ags-pill-opt ' + (i18nCfg.language === 'zh-TW' ? 'active' : '') + '" data-lang="zh-TW">繁體</button>',
        '      <button class="ags-pill-opt ' + (i18nCfg.language === 'en' ? 'active' : '') + '" data-lang="en">EN</button>',
        '    </div></div>',
        '  <div class="ags-row"><span>原生菜单与托盘汉化</span><input type="checkbox" id="ags-native-menu-i18n" ' + (i18nCfg.translateNativeMenu !== false ? 'checked' : '') + '></div>',
        '  <details class="ags-details">',
        '    <summary>' + esc(t('customDictTitle')) + '</summary>',
        '    <div class="ags-row" style="gap:6px">' +
        '      <input class="ags-input" id="ags-dict-en" placeholder="英文原文">' +
        '      <input class="ags-input" id="ags-dict-zh" placeholder="自定义译文">' +
        '      <button class="ags-btn" id="ags-dict-add-btn">添加</button>' +
        '    </div>',
        '  </details>',
        '</div>',

        // Section 3: Proxy & Advanced
        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('secNet')) + '</span>' + (state.proxyTestResult ? '<span class="ags-sub">' + esc(state.proxyTestResult) + '</span>' : '') + '</div>',
        '  <div class="ags-row"><span>免 TUN 本地代理</span><input type="checkbox" id="ags-proxy-enabled" ' + (proxyCfg.enabled ? 'checked' : '') + '></div>',
        '  <div class="ags-row" style="gap:6px">' +
        '    <input class="ags-input" id="ags-proxy-url" value="' + esc(proxyCfg.proxyUrl || 'http://127.0.0.1:7897') + '" placeholder="http://127.0.0.1:7897 或 socks5://...">' +
        '    <button class="ags-btn" id="ags-proxy-save-btn">保存</button>' +
        '    <button class="ags-btn" id="ags-proxy-test-btn">' + esc(t('testProxy')) + '</button>' +
        '  </div>',
        '  <details class="ags-details">',
        '    <summary>' + esc(t('advancedTitle')) + '</summary>',
        '    <div style="margin-bottom:8px"><div class="ags-sub" style="margin-bottom:4px">Bypass 绕过列表</div><input class="ags-input" id="ags-proxy-bypass" value="' + esc(proxyCfg.bypassList || '') + '"></div>',
        '    <div class="ags-row" style="margin:6px 0"><span>中文会话标题偏好</span><input type="checkbox" id="ags-cn-title" ' + (cfg.enhance && cfg.enhance.chineseSessionTitle ? 'checked' : '') + '></div>',
        '    <div class="ags-sub" style="margin-top:8px">按模型上下文上限</div>',
        modelLimitRows,
        '    <div class="ags-row" style="margin-top:10px"><button class="ags-btn" id="ags-restart-host-btn">重启客户端生效</button><button class="ags-btn" data-open-path="state">打开配置目录</button></div>',
        '  </details>',
        '</div>'
      ].join('\n');
    }

    function bindEvents(cfg) {
      el.querySelectorAll('[data-tab]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.activeTab = btn.getAttribute('data-tab');
          render();
        });
      });

      var closeBtn = el.querySelector('#ags-close-btn');
      if (closeBtn) closeBtn.addEventListener('click', function () { toggle(false); });

      el.querySelectorAll('[data-days]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.days = Number(btn.getAttribute('data-days'));
          if (opts.onRefresh) opts.onRefresh(true);
        });
      });

      var cliBtn = el.querySelector('[data-action="launch-cli"]');
      if (cliBtn) cliBtn.addEventListener('click', function () {
        if (opts.api && opts.api.launchCli) opts.api.launchCli().then(function () { showToast('已唤起 CLI 终端'); });
      });

      el.querySelectorAll('[data-acc-action]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var action = btn.getAttribute('data-acc-action');
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: action }).then(function () {
              showToast('操作已完成');
              if (opts.onRefresh) opts.onRefresh(true);
            }).catch(function (err) { showToast(err.message || '操作失败'); });
          }
        });
      });

      el.querySelectorAll('[data-acc-switch]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-acc-switch');
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: 'switch', accountId: id }).then(function (res) {
              showToast(res && res.requiresRestart ? '已切换账号，请重启客户端生效' : '账号已切换');
              if (opts.onRefresh) opts.onRefresh(true);
            }).catch(function (err) { showToast(err.message); });
          }
        });
      });

      el.querySelectorAll('[data-acc-remove]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-acc-remove');
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: 'remove', accountId: id }).then(function () {
              if (opts.onRefresh) opts.onRefresh(true);
            });
          }
        });
      });

      var autoSw = el.querySelector('#ags-auto-switch-en');
      var autoTh = el.querySelector('#ags-auto-switch-th');
      if (autoSw && autoTh) {
        var saveAuto = function () {
          opts.saveConfig({ quota: { autoSwitch: { enabled: autoSw.checked, threshold: Number(autoTh.value || 5) / 100 } } });
        };
        autoSw.addEventListener('change', saveAuto);
        autoTh.addEventListener('change', saveAuto);
      }

      el.querySelectorAll('[data-select-theme]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          opts.saveConfig({ theme: { activePreset: btn.getAttribute('data-select-theme') } });
        });
      });

      el.querySelectorAll('[data-del-theme]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-del-theme');
          var next = (cfg.theme.customThemes || []).filter(function (c) { return c.id !== id; });
          opts.saveConfig({ theme: { customThemes: next, activePreset: cfg.theme.activePreset === id ? 'claude' : cfg.theme.activePreset } });
        });
      });

      el.querySelectorAll('[data-colormode]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          opts.saveConfig({ theme: { colorMode: btn.getAttribute('data-colormode') } });
        });
      });

      var serifEl = el.querySelector('#ags-serif-toggle');
      if (serifEl) serifEl.addEventListener('change', function () {
        opts.saveConfig({ theme: { editorialSerif: serifEl.checked } });
      });

      var mStyle = el.querySelector('#ags-mascot-style');
      var mScale = el.querySelector('#ags-mascot-scale');
      var mEn = el.querySelector('#ags-mascot-enabled');
      if (mStyle && mScale && mEn) {
        var saveMascot = function () {
          opts.saveConfig({ mascot: { style: mStyle.value, scale: Number(mScale.value), enabled: mEn.checked } });
        };
        mStyle.addEventListener('change', saveMascot);
        mScale.addEventListener('change', saveMascot);
        mEn.addEventListener('change', saveMascot);
      }

      var hPos = el.querySelector('#ags-hud-pos');
      var hEn = el.querySelector('#ags-hud-enabled');
      if (hPos && hEn) {
        var saveHud = function () {
          opts.saveConfig({ hud: { position: hPos.value, enabled: hEn.checked } });
        };
        hPos.addEventListener('change', saveHud);
        hEn.addEventListener('change', saveHud);
      }

      var createThemeBtn = el.querySelector('#ags-create-theme-btn');
      if (createThemeBtn) createThemeBtn.addEventListener('click', function () {
        var nameInput = el.querySelector('#ags-new-theme-name');
        var colorInput = el.querySelector('#ags-new-theme-accent');
        var themesApi = globalScope.__AG_STUDIO_THEMES__;
        if (!themesApi) return;
        var base = themesApi.cloneThemeAsCustom('claude', (nameInput && nameInput.value) || 'My Theme');
        var hex = (colorInput && colorInput.value) || '#D97757';
        Object.assign(base.light, themesApi.deriveAccentTokens(hex, false));
        Object.assign(base.dark, themesApi.deriveAccentTokens(hex, true));
        var nextCustoms = (cfg.theme.customThemes || []).concat([base]);
        opts.saveConfig({ theme: { customThemes: nextCustoms, activePreset: base.id } });
        showToast('已创建并应用自定义配色');
      });

      var bodyFontInput = el.querySelector('#ags-custom-body-font');
      if (bodyFontInput) bodyFontInput.addEventListener('change', function () {
        opts.saveConfig({ theme: { fonts: { customBodyFont: bodyFontInput.value.trim() } } });
      });

      el.querySelectorAll('[data-lang]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          opts.saveConfig({ i18n: { language: btn.getAttribute('data-lang') } });
        });
      });

      var nativeI18nEl = el.querySelector('#ags-native-menu-i18n');
      if (nativeI18nEl) nativeI18nEl.addEventListener('change', function () {
        opts.saveConfig({ i18n: { translateNativeMenu: nativeI18nEl.checked, translateTray: nativeI18nEl.checked } });
      });

      var dictAddBtn = el.querySelector('#ags-dict-add-btn');
      if (dictAddBtn) dictAddBtn.addEventListener('click', function () {
        var enVal = (el.querySelector('#ags-dict-en').value || '').trim();
        var zhVal = (el.querySelector('#ags-dict-zh').value || '').trim();
        if (!enVal || !zhVal || !opts.api || !opts.api.getI18nPayload) return;
        opts.api.getI18nPayload().then(function (cur) {
          var nextExact = Object.assign({}, cur.customExact || {});
          nextExact[enVal] = zhVal;
          return opts.api.saveCustomDictionary({ exact: nextExact, regex: cur.customRegex || [] });
        }).then(function () { showToast('词条已保存'); });
      });

      var proxySaveBtn = el.querySelector('#ags-proxy-save-btn');
      var proxyEnEl = el.querySelector('#ags-proxy-enabled');
      var proxyUrlEl = el.querySelector('#ags-proxy-url');
      var proxyByEl = el.querySelector('#ags-proxy-bypass');
      if (proxySaveBtn && proxyEnEl && proxyUrlEl) {
        var saveProxy = function () {
          opts.saveConfig({
            proxy: {
              enabled: proxyEnEl.checked,
              proxyUrl: proxyUrlEl.value.trim(),
              bypassList: proxyByEl ? proxyByEl.value.trim() : undefined
            }
          });
          showToast('代理配置已保存');
        };
        proxySaveBtn.addEventListener('click', saveProxy);
        proxyEnEl.addEventListener('change', saveProxy);
      }

      var proxyTestBtn = el.querySelector('#ags-proxy-test-btn');
      if (proxyTestBtn && proxyUrlEl) proxyTestBtn.addEventListener('click', function () {
        if (!opts.api || !opts.api.testProxy) return;
        state.proxyTestResult = '测速中...';
        render();
        opts.api.testProxy(proxyUrlEl.value.trim()).then(function (res) {
          state.proxyTestResult = '连通 ' + res.latencyMs + 'ms';
          render();
        }).catch(function (err) {
          state.proxyTestResult = '失败: ' + err.message;
          render();
        });
      });

      var cnTitleEl = el.querySelector('#ags-cn-title');
      if (cnTitleEl) cnTitleEl.addEventListener('change', function () {
        if (opts.api && opts.api.setChineseSessionTitle) opts.api.setChineseSessionTitle(cnTitleEl.checked);
      });

      el.querySelectorAll('[data-model-limit]').forEach(function (inp) {
        inp.addEventListener('change', function () {
          var model = inp.getAttribute('data-model-limit');
          if (opts.api && opts.api.setContextLimit) {
            opts.api.setContextLimit(model, Number(inp.value)).then(function () { showToast('已更新 ' + model + ' 上限'); });
          }
        });
      });

      el.querySelectorAll('[data-open-path]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (opts.api && opts.api.openPath) opts.api.openPath(btn.getAttribute('data-open-path'));
        });
      });

      var restartBtn = el.querySelector('#ags-restart-host-btn');
      if (restartBtn) restartBtn.addEventListener('click', function () {
        if (opts.api && opts.api.restartHost) opts.api.restartHost();
      });
    }

    var lastData = {};

    function render(data) {
      if (data) lastData = Object.assign(lastData, data);
      var cfg = opts.getConfig() || {};
      var tabs = t('tabs');
      var content = '';
      if (state.activeTab === 'overview') content = renderOverview(lastData.snapshot);
      else if (state.activeTab === 'usage') content = renderUsage(lastData.history);
      else if (state.activeTab === 'accounts') content = renderAccounts(lastData.accounts);
      else content = renderSettings(cfg, lastData);

      el.innerHTML = [
        '<div class="ags-head">',
        '  <div class="ags-title"><span class="ags-dot"></span><span>' + esc(t('title')) + '</span></div>',
        '  <button class="ags-btn ags-btn-ghost" id="ags-close-btn">' + esc(t('close')) + '</button>',
        '</div>',
        '<div class="ags-tabs">',
        '  <button class="ags-tab ' + (state.activeTab === 'overview' ? 'active' : '') + '" data-tab="overview">' + esc(tabs.overview) + '</button>',
        '  <button class="ags-tab ' + (state.activeTab === 'usage' ? 'active' : '') + '" data-tab="usage">' + esc(tabs.usage) + '</button>',
        '  <button class="ags-tab ' + (state.activeTab === 'accounts' ? 'active' : '') + '" data-tab="accounts">' + esc(tabs.accounts) + '</button>',
        '  <button class="ags-tab ' + (state.activeTab === 'settings' ? 'active' : '') + '" data-tab="settings">' + esc(tabs.settings) + '</button>',
        '</div>',
        '<div class="ags-body">' + content + '</div>'
      ].join('\n');

      bindEvents(cfg);
    }

    function toggle(forceOpen) {
      state.open = typeof forceOpen === 'boolean' ? forceOpen : !state.open;
      if (state.open) {
        el.classList.remove('ags-hidden');
        if (opts.onRefresh) opts.onRefresh(true);
      } else {
        el.classList.add('ags-hidden');
      }
    }

    return {
      element: el,
      toggle: toggle,
      isOpen: function () { return state.open; },
      getDays: function () { return state.days; },
      pushSpeedSample: function (v) {
        state.speedHistory.push(Number(v || 0));
        if (state.speedHistory.length > 32) state.speedHistory.shift();
      },
      render: render
    };
  }

  var api = {
    UI_TEXT: UI_TEXT,
    createDashboardDrawer: createDashboardDrawer
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_DASHBOARD__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
