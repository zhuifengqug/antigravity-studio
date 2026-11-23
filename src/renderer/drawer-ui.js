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
      cost: '对话总费用',
      timelineTitle: '逐轮调用时间线',
      attachTitle: '附件审计摘要',
      quotaTitle: '模型额度池',
      noQuota: '连接本地 LanguageServer 后自动显示模型额度',
      launchCli: '打开 CLI 终端',
      daysAll: '全部', daysToday: '今天', days7: '7天', days30: '30天', days90: '90天',
      totalTok: '总消耗', estApi: '估算 API 费用', vsSub: '较订阅节省',
      heatmap: '7×N 活跃热力图',
      sourceSplit: '桌面端 vs CLI 占比',
      topModels: '热门模型排行',
      syncPricing: '同步模型定价',
      importCur: '导入当前', addOauth: 'OAuth 添加', importTools: '导入 Tools', refreshQuota: '刷新额度',
      activeTag: '当前', switchBtn: '一键切号',
      keepaliveTitle: '保活 Keepalive & 低额度自动切号',
      secTheme: '外观与桌宠',
      secFx: 'Prism 质感增强（独立开关）',
      secLang: '语言与词典',
      secNet: '代理与系统增强',
      testProxy: '测速',
      customDictTitle: '自定义词典（覆盖内置词条）',
      customThemeTitle: '自定义配色编辑器（新建 / 克隆 / 调色）',
      enhanceTitle: '系统提示词精简 & 中文标题 & 上下文解锁 & 压缩回填'
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
      cost: '對話總費用',
      timelineTitle: '逐輪呼叫時間線',
      attachTitle: '附件稽核摘要',
      quotaTitle: '模型額度池',
      noQuota: '連線本機 LanguageServer 後自動顯示模型額度',
      launchCli: '開啟 CLI 終端機',
      daysAll: '全部', daysToday: '今天', days7: '7天', days30: '30天', days90: '90天',
      totalTok: '總消耗', estApi: '估算 API 費用', vsSub: '較訂閱節省',
      heatmap: '7×N 活躍熱力圖',
      sourceSplit: '桌面端 vs CLI 佔比',
      topModels: '熱門模型排行',
      syncPricing: '同步模型定價',
      importCur: '匯入目前', addOauth: 'OAuth 新增', importTools: '匯入 Tools', refreshQuota: '重新整理額度',
      activeTag: '使用中', switchBtn: '一鍵切號',
      keepaliveTitle: '保活 Keepalive & 低額度自動切號',
      secTheme: '外觀與桌寵',
      secFx: 'Prism 質感增強（獨立開關）',
      secLang: '語言與詞典',
      secNet: '代理與系統增強',
      testProxy: '測速',
      customDictTitle: '自訂詞典（覆蓋內建詞條）',
      customThemeTitle: '自訂配色編輯器（新增 / 複製 / 調色）',
      enhanceTitle: '系統提示詞精簡 & 中文標題 & 上下文解鎖 & 壓縮回填'
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
      cost: 'Session Cost',
      timelineTitle: 'Session Turn Timeline',
      attachTitle: 'Attachment Audit',
      quotaTitle: 'Model Quota Pools',
      noQuota: 'Connects automatically to local LanguageServer when active',
      launchCli: 'Open CLI Terminal',
      daysAll: 'All', daysToday: 'Today', days7: '7d', days30: '30d', days90: '90d',
      totalTok: 'Total Tokens', estApi: 'Est. API Cost', vsSub: 'vs Subscription',
      heatmap: '7×N Activity Heatmap',
      sourceSplit: 'Desktop vs CLI',
      topModels: 'Top Models',
      syncPricing: 'Sync Pricing',
      importCur: 'Import Current', addOauth: 'Add OAuth', importTools: 'Import Tools', refreshQuota: 'Refresh',
      activeTag: 'Active', switchBtn: 'Switch',
      keepaliveTitle: 'Keepalive & Auto-Switch Strategy',
      secTheme: 'Appearance & Mascot',
      secFx: 'Prism FX (Independent Toggles)',
      secLang: 'Language & Dictionary',
      secNet: 'Proxy & System Enhancements',
      testProxy: 'Test',
      customDictTitle: 'Custom Dictionary Overrides',
      customThemeTitle: 'Custom Color Editor (Create / Clone / Edit)',
      enhanceTitle: 'Prompt Tiers & Chinese Title & Context Unlock & Rehydrate'
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
    if (!Number.isFinite(v) || v <= 0) return '0';
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
      '.ags-drawer { position:fixed; top:40px; right:12px; bottom:12px; width:420px; max-width:calc(100vw - 24px); background:var(--ags-bg-surface,#18181b); color:var(--ags-text-primary,#f4f4f5); border:1px solid var(--ags-border,#2e2e32); border-radius:14px; box-shadow:var(--ags-shadow,0 16px 40px rgba(0,0,0,0.45)); z-index:2147483500; display:flex; flex-direction:column; font-family:var(--ags-font-ui,system-ui,sans-serif); font-size:13px; font-variant-numeric:tabular-nums; transition:transform 180ms cubic-bezier(.22,1,.36,1), opacity 160ms ease; overflow:hidden; -webkit-app-region:no-drag; app-region:no-drag; }',
      '.ags-drawer * { -webkit-app-region:no-drag; app-region:no-drag; }',
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
      '.ags-metric-val { font-size:15px; font-weight:600; margin-top:2px; }',
      '.ags-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }',
      '.ags-prog { width:100%; height:5px; border-radius:99px; background:var(--ags-bg-subtle); overflow:hidden; }',
      '.ags-prog-fill { height:100%; border-radius:99px; background:var(--ags-accent); transition:width 200ms ease; }',
      '.ags-btn { border:1px solid var(--ags-border); background:var(--ags-bg-surface); color:var(--ags-text-primary); padding:5px 10px; border-radius:8px; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:5px; transition:border-color 120ms ease, background 120ms ease; white-space:nowrap; }',
      '.ags-btn:hover { border-color:var(--ags-accent); }',
      '.ags-btn-primary { background:var(--ags-accent); color:#fff; border-color:var(--ags-accent); }',
      '.ags-btn-primary:hover { background:var(--ags-accent-hover); }',
      '.ags-btn-ghost { border:none; background:transparent; color:var(--ags-text-secondary); padding:4px 8px; }',
      '.ags-btn-ghost:hover { color:var(--ags-text-primary); background:var(--ags-bg-subtle); }',
      '.ags-input, .ags-select { width:100%; box-sizing:border-box; height:30px; padding:0 9px; border-radius:8px; border:1px solid var(--ags-border); background:var(--ags-bg-surface); color:var(--ags-text-primary); font-size:12px; outline:none; }',
      '.ags-select option { background:var(--ags-bg-surface,#18181b); color:var(--ags-text-primary,#f4f4f5); }',
      '.ags-input:focus, .ags-select:focus { border-color:var(--ags-accent); }',
      '.ags-pill-group { display:inline-flex; padding:2px; border-radius:8px; background:var(--ags-bg-surface); border:1px solid var(--ags-border); gap:2px; }',
      '.ags-pill-opt { border:none; background:transparent; color:var(--ags-text-secondary); padding:3px 9px; border-radius:6px; font-size:11.5px; cursor:pointer; }',
      '.ags-pill-opt.active { background:var(--ags-accent-soft); color:var(--ags-accent); font-weight:600; }',
      '.ags-theme-cards { display:grid; grid-template-columns:1fr 1fr; gap:8px; }',
      '.ags-theme-card { padding:10px; border-radius:10px; border:1px solid var(--ags-border); background:var(--ags-bg-surface); cursor:pointer; text-align:left; transition:border-color 120ms ease; }',
      '.ags-theme-card.active { border-color:var(--ags-accent); box-shadow:0 0 0 1px var(--ags-accent); }',
      '.ags-acc-item { display:flex; flex-direction:column; gap:8px; padding:10px 12px; border-radius:10px; border:1px solid var(--ags-border); background:var(--ags-bg-surface); }',
      '.ags-acc-quota-box { display:flex; flex-direction:column; gap:6px; padding-top:8px; border-top:1px solid var(--ags-border); }',
      '.ags-acc-pool { display:flex; flex-direction:column; gap:3px; }',
      '.ags-avatar { width:30px; height:30px; border-radius:50%; background:var(--ags-accent-soft); color:var(--ags-accent); display:flex; align-items:center; justify-content:center; font-weight:600; flex-shrink:0; }',
      '.ags-details { border:1px solid var(--ags-border); border-radius:10px; background:var(--ags-bg-surface); padding:8px 11px; }',
      '.ags-details summary { cursor:pointer; font-size:12px; color:var(--ags-text-secondary); font-weight:500; outline:none; user-select:none; }',
      '.ags-details[open] summary { margin-bottom:10px; color:var(--ags-text-primary); }',
      '.ags-fold-card { border:1px solid var(--ags-border); border-radius:10px; background:var(--ags-bg-surface); overflow:hidden; }',
      '.ags-fold-btn { width:100%; border:none; background:transparent; color:var(--ags-text-secondary); padding:9px 11px; display:flex; align-items:center; justify-content:space-between; font-size:12px; font-weight:500; cursor:pointer; text-align:left; }',
      '.ags-fold-btn:hover { color:var(--ags-text-primary); background:var(--ags-bg-canvas); }',
      '.ags-fold-body { padding:0 11px 10px 11px; display:flex; flex-direction:column; gap:6px; }',
      '.ags-eval-box { padding:8px 10px; border-radius:9px; background:var(--ags-bg-surface); border:1px solid var(--ags-border); display:flex; flex-direction:column; gap:4px; }',
      '.ags-eval-badge { display:inline-flex; align-items:center; gap:5px; font-size:11.5px; font-weight:600; }',
      '.ags-hm-7row { display:grid; grid-template-rows:repeat(7, 10px); grid-auto-flow:column; grid-auto-columns:10px; gap:3px; overflow-x:auto; padding:2px 0; }',
      '.ags-hm-cell { width:10px; height:10px; border-radius:2px; background:var(--ags-bg-subtle); }',
      '.ags-tl-item { padding:7px 9px; border-radius:8px; border:1px solid var(--ags-border); background:var(--ags-bg-canvas); display:flex; flex-direction:column; gap:3px; font-size:11.5px; }',
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
    el.setAttribute('data-ag-no-i18n', 'true');

    var state = {
      open: false,
      activeTab: 'overview',
      days: 30,
      currency: 'USD', // USD | CNY
      speedHistory: [],
      proxyTestResult: null,
      timelineOpen: false,
      timelineLoading: false,
      timelineConvId: '',
      timelineData: null,
      attachOpen: false,
      enhanceStatus: null,
      unlockStatus: null,
      rehydrateStatus: null,
      snapshot: null,
      history: null,
      accounts: null,
      fonts: []
    };

    // Build fixed header + tabs + scrollable body shell once so close/tabs never lose listeners or scroll
    el.innerHTML = [
      '<div class="ags-head">',
      '  <div class="ags-title"><span class="ags-dot"></span><span id="ags-head-title">Antigravity Studio</span></div>',
      '  <button type="button" class="ags-btn ags-btn-ghost" id="ags-close-btn">收起</button>',
      '</div>',
      '<div class="ags-tabs">',
      '  <button type="button" class="ags-tab active" data-tab="overview">概览</button>',
      '  <button type="button" class="ags-tab" data-tab="usage">统计</button>',
      '  <button type="button" class="ags-tab" data-tab="accounts">账号</button>',
      '  <button type="button" class="ags-tab" data-tab="settings">设置</button>',
      '</div>',
      '<div class="ags-body" id="ags-drawer-body"></div>'
    ].join('\n');

    var closeBtnFixed = el.querySelector('#ags-close-btn');
    if (closeBtnFixed) {
      closeBtnFixed.addEventListener('click', function (ev) {
        ev.stopPropagation();
        toggle(false);
      });
    }
    el.querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.activeTab = btn.getAttribute('data-tab');
        if (opts.onTabChange) opts.onTabChange(state.activeTab);
        render(null, true);
      });
    });

    function t(key) {
      var cfg = opts.getConfig ? opts.getConfig() : {};
      var lang = (cfg && cfg.i18n && cfg.i18n.language) || 'zh-CN';
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
      var used = Number(ctx.usedTokens || 0);
      var limit = Number(ctx.contextLimit || 200000);
      var pct = used > 0 && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

      // Fix: never render a 100% orange thinking bar when there is no context data!
      var bdSys = Number(bd.system || 0);
      var bdTool = Number(bd.tools || 0);
      var bdChat = Number(bd.user || 0) + Number(bd.assistant || 0);
      var bdThink = Number(bd.thinking || 0);
      var bdSum = bdSys + bdTool + bdChat + bdThink;

      var segSys = 0, segTool = 0, segChat = 0, segThink = 0;
      if (used > 0 && bdSum > 0) {
        segSys = Math.round((bdSys / bdSum) * pct);
        segTool = Math.round((bdTool / bdSum) * pct);
        segChat = Math.round((bdChat / bdSum) * pct);
        segThink = bdThink > 0 ? Math.max(0, pct - segSys - segTool - segChat) : 0;
      } else if (used > 0 && pct > 0) {
        segChat = pct;
      }

      var speed = Number((ctx.speed && (ctx.speed.streamingTps || ctx.speed.tokPerSec || ctx.speed.tps)) || 0);
      var overallTps = Number((ctx.speed && ctx.speed.overallTps) || 0);
      var speedStr = speed > 0 ? Number(speed).toFixed(1).replace(/\.0$/, '') : '0';
      var ttft = Number((ctx.speed && ctx.speed.ttftMs) || 0);
      var ttftVal = ttft >= 1000 ? (ttft / 1000).toFixed(1) : (ttft > 0 ? String(Math.round(ttft)) : '-');
      var ttftUnit = ttft >= 1000 ? 's' : 'ms';
      var cost = Number((snap && snap.estimatedSessionCostUsd) || 0);
      var turnCost = Number((snap && snap.estimatedTurnCostUsd) || 0);
      var callCount = Number((snap && snap.sessionCallCount) || 0);
      var costStr = cost >= 1 ? ('$' + cost.toFixed(2)) : ('$' + cost.toFixed(3));
      var costTitle = (callCount > 1 || (turnCost > 0 && Math.abs(cost - turnCost) >= 0.001))
        ? (' title="本轮估算 $' + turnCost.toFixed(3) + (callCount > 0 ? (' · 共 ' + callCount + ' 次调用') : '') + '"')
        : '';
      var pools = (snap && snap.quota && snap.quota.pools) || [];
      var remainingCtx = Math.max(0, limit - used);
      var cmq = (snap && snap.currentModelQuota) || null;
      var histMed = ctx.speed && ctx.speed.historyMedian;
      var legend = t('ctxLegend');

      var attachInfo = (snap && snap.attachments) || ctx.attachments || null;
      var attachHtml = '<div class="ags-sub">当前会话暂无附件</div>';
      if (attachInfo && Number(attachInfo.count || (attachInfo.files && attachInfo.files.length) || 0) > 0) {
        var files = Array.isArray(attachInfo.files) ? attachInfo.files : [];
        attachHtml = '<div class="ags-row"><span>已挂载 ' + esc(attachInfo.count || files.length) + ' 个附件</span>' +
          '<span class="ags-sub">' + (attachInfo.totalTokens ? ('≈ ' + fmtTok(attachInfo.totalTokens) + ' tok') : '') + '</span></div>' +
          ((attachInfo.unknownFiles > 0 || attachInfo.complete === false)
            ? '<div class="ags-sub" style="color:var(--ags-warning)">含 ' + Number(attachInfo.unknownFiles || 0) + ' 个无法解析的文件，总计为部分估算</div>'
            : '') +
          (files.length
            ? '<div style="display:flex;flex-direction:column;gap:4px;margin-top:4px">' + files.slice(0, 5).map(function (f) {
                var nm = typeof f === 'string' ? f : (f.name || f.path || 'file');
                var tk = typeof f === 'object' && f.tokens ? (' · ' + fmtTok(f.tokens) + ' tok') : '';
                return '<div class="ags-sub" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(nm + tk) + '</div>';
              }).join('') + '</div>'
            : '');
      }

      var evalInfo = ctx.speed && ctx.speed.evaluation;
      var evalHtml = '';
      if (evalInfo && (evalInfo.comment || evalInfo.shortTitle || (evalInfo.badge && evalInfo.badge.text))) {
        var evColor = (evalInfo.badge && evalInfo.badge.color) || 'var(--ags-accent)';
        var evGlyph = (evalInfo.badge && evalInfo.badge.glyph) || '⚡';
        var evBadgeTxt = (evalInfo.badge && evalInfo.badge.text) || '';
        var titleText = evBadgeTxt
          ? evBadgeTxt
          : ((evalInfo.grade ? (evalInfo.grade + '级' + (evalInfo.score != null ? (' ' + Number(evalInfo.score).toFixed(1) + '分') : '') + ' · ') : '') + (evalInfo.shortTitle || ''));
        evalHtml = '<div class="ags-eval-box">' +
          '<div class="ags-row"><span class="ags-eval-badge" style="color:' + esc(evColor) + '">' + esc(evGlyph + ' ' + titleText) + '</span>' +
          (evalInfo.subLabel ? '<span class="ags-sub">' + esc(evalInfo.subLabel) + '</span>' : '') + '</div>' +
          (evalInfo.comment ? '<div class="ags-sub" style="line-height:1.45">' + esc(evalInfo.comment) + '</div>' : '') +
          '</div>';
      }

      var turns = (state.timelineData && (state.timelineData.turns || state.timelineData.items)) || [];
      var timelineHtml = state.timelineLoading
        ? '<div class="ags-sub">正在加载逐轮调用记录...</div>'
        : (turns.length
          ? turns.slice(0, 10).map(function (tr, i) {
              return '<div class="ags-tl-item">' +
                '<div class="ags-row"><span style="font-weight:500">#' + (tr.turnIndex != null ? tr.turnIndex : (i + 1)) + ' · ' + esc(tr.model || 'model') + '</span>' +
                '<span class="ags-sub">' + esc(tr.tps ? (Math.round(tr.tps) + ' tok/s') : (tr.status || '')) + '</span></div>' +
                '<div class="ags-sub">in ' + fmtTok(tr.inputTokens || 0) + ' · out ' + fmtTok(tr.outputTokens || 0) +
                (tr.cacheReadTokens ? (' · cache ' + fmtTok(tr.cacheReadTokens)) : '') + '</div>' +
                '</div>';
            }).join('')
          : '<div class="ags-sub">' + (snap && snap.conversationId ? '暂无逐轮记录' : '进入会话后可查看逐轮调用记录') + '</div>');

      var quotaMetaHtml = (snap && snap.quota && (snap.quota.planName || snap.quota.creditsBalance != null))
        ? '<div class="ags-row" style="font-size:11px;margin-top:-2px">' +
            '<span class="ags-sub">' + esc(snap.quota.planName || 'Subscription') + '</span>' +
            (snap.quota.creditsBalance != null ? ('<span class="ags-sub">AI Credits: ' + esc(snap.quota.creditsBalance) + '</span>') : '') +
          '</div>'
        : '';

      var quotaHtml = pools.length
        ? pools.map(function (p) {
            var poolTitle = p.displayName || p.poolKey || p.title || '模型共享池';
            var bList = Array.isArray(p.buckets) && p.buckets.length
              ? p.buckets
              : [{
                  windowLabel: '当前周期额度',
                  remainingPercent: p.remainingPercent,
                  resetTime: p.resetTime,
                  resetTimeText: p.resetTimeText,
                  countdownText: p.countdownText,
                  isLow: p.isLow,
                  tokenEstimate: p.tokenEstimate || null
                }];

            var bucketsHtml = bList.map(function (b) {
              var bPct = b.remainingPercent == null ? 100 : Math.round(b.remainingPercent);
              var bEta = b.countdownText || formatResetEta(b.resetTime);
              var bReset = b.resetTimeText ? (' (' + b.resetTimeText + ' 重置)') : '';
              var bColor = b.isLow ? 'var(--ags-warning)' : 'var(--ags-accent)';
              var te = b.tokenEstimate;
              var tokLine = '';
              if (te && te.estRemainingShort) {
                tokLine = '<div class="ags-sub" style="font-size:11px;color:var(--ags-text-primary);opacity:0.88">预计剩余 ≈ <strong>' + esc(te.estRemainingShort) + ' tokens</strong>' +
                  (te.estTotalShort ? (' · 周期总额 ≈ ' + esc(te.estTotalShort)) : '') +
                  (te.cycleTokensUsed > 0 ? (' · 本周期已用 ' + fmtTok(te.cycleTokensUsed)) : '') +
                  (te.isReliable ? '' : ' (校准中)') + '</div>';
              } else if (te && te.cycleTokensUsed > 0) {
                tokLine = '<div class="ags-sub" style="font-size:10.5px">本周期已用 ' + fmtTok(te.cycleTokensUsed) + ' tokens（样本校准中，待进度变化后估算剩余）</div>';
              } else if (bPct >= 98) {
                tokLine = '<div class="ags-sub" style="font-size:10.5px;opacity:0.75">本周期尚未消耗（消耗 ≥3% 后自动校准预计剩余 tokens）</div>';
              }
              return '<div style="display:flex;flex-direction:column;gap:3px">' +
                '<div class="ags-row"><span class="ags-sub">' + esc(b.windowLabel || '周期额度') + '</span>' +
                '<span class="ags-sub">' + bPct + '%' + (bEta ? (' · ' + esc(bEta)) : '') + esc(bReset) + '</span></div>' +
                '<div class="ags-prog"><div class="ags-prog-fill" style="width:' + bPct + '%;background:' + bColor + '"></div></div>' +
                tokLine +
                '</div>';
            }).join('');

            var subModels = Array.isArray(p.modelNames) && p.modelNames.length
              ? '<div class="ags-sub" style="font-size:10.5px;opacity:0.8">' + esc(p.modelNames.join(' · ')) + '</div>'
              : '';
            return '<div style="display:flex;flex-direction:column;gap:5px;padding-top:4px;border-top:1px dashed var(--ags-border)">' +
              '<div style="font-size:12px;font-weight:600">' + esc(poolTitle) + '</div>' +
              bucketsHtml +
              subModels +
              '</div>';
          }).join('')
        : '<div class="ags-sub">' + esc(t('noQuota')) + '</div>';

      var cmqHtml = (cmq && cmq.remainingPercent != null)
        ? '<div class="ags-row" style="padding-top:6px;border-top:1px solid var(--ags-border);font-size:11.5px">' +
            '<span class="ags-sub">当前模型额度' + (cmq.windowLabel ? (' (' + esc(cmq.windowLabel) + ')') : '') + '</span>' +
            '<span style="font-weight:500">' + Math.round(cmq.remainingPercent) + '%' +
            (cmq.estRemainingShort ? (' · 约剩 ' + esc(cmq.estRemainingShort)) : '') +
            (cmq.countdownText ? (' · ' + esc(cmq.countdownText)) : '') + '</span></div>'
        : '';

      var speedTitle = (overallTps > 0 && Math.abs(overallTps - speed) >= 1)
        ? (' title="纯流式输出速率（含首字综合 ' + Math.round(overallTps) + ' tok/s）"')
        : '';

      return [
        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('ctxTitle')) + '</span><span>' + esc(ctx.model || '未检测会话') + '</span></div>',
        '  <div class="ags-row"><span class="ags-big">' + pct + '%</span><span class="ags-sub">' + fmtTok(used) + ' / ' + fmtTok(limit) + ' · 剩 ' + fmtTok(remainingCtx) + '</span></div>',
        '  <div class="ags-seg-bar">' +
        '    <div style="width:' + segSys + '%;background:var(--ags-accent)"></div>' +
        '    <div style="width:' + segTool + '%;background:var(--ags-success)"></div>' +
        '    <div style="width:' + segChat + '%;background:#60A5FA"></div>' +
        '    <div style="width:' + segThink + '%;background:var(--ags-warning)"></div>' +
        '  </div>',
        '  <div class="ags-legend">' +
        '    <span class="ags-legend-item"><span class="ags-swatch" style="background:var(--ags-accent)"></span>' + legend.system + ' ' + fmtTok(bdSys) + '</span>' +
        '    <span class="ags-legend-item"><span class="ags-swatch" style="background:var(--ags-success)"></span>' + legend.tools + ' ' + fmtTok(bdTool) + '</span>' +
        '    <span class="ags-legend-item"><span class="ags-swatch" style="background:#60A5FA"></span>' + legend.chat + ' ' + fmtTok(bdChat) + '</span>' +
        '    <span class="ags-legend-item"><span class="ags-swatch" style="background:var(--ags-warning)"></span>' + legend.think + ' ' + fmtTok(bdThink) + '</span>' +
        '  </div>',
        cmqHtml,
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('perfTitle')) + '</span><span>缓存命中 ' + Math.round((ctx.cacheHitRate || 0) * 100) + '%' + (histMed && histMed.medianTps ? (' · 历史中位 ' + Math.round(histMed.medianTps) + ' tok/s') : '') + '</span></div>',
        '  <div class="ags-grid-3">',
        '    <div class="ags-metric-box"' + speedTitle + '><div class="ags-sub">' + esc(t('speed')) + '</div><div class="ags-metric-val">' + speedStr + ' <span class="ags-sub">tok/s</span></div></div>',
        '    <div class="ags-metric-box"><div class="ags-sub">' + esc(t('ttft')) + '</div><div class="ags-metric-val">' + ttftVal + ' <span class="ags-sub">' + ttftUnit + '</span></div></div>',
        '    <div class="ags-metric-box"' + costTitle + '><div class="ags-sub">' + esc(t('cost')) + '</div><div class="ags-metric-val">' + costStr + '</div></div>',
        '  </div>',
        evalHtml,
        '  <div>' + renderSparklineSvg(state.speedHistory.slice(-16)) + '</div>',
        '</div>',

        '<div class="ags-fold-card">',
        '  <button type="button" class="ags-fold-btn" data-action="toggle-timeline"><span>' + (state.timelineOpen ? '▾ ' : '▸ ') + esc(t('timelineTitle')) + '</span>' +
        (turns.length ? ('<span class="ags-sub">' + turns.length + ' 条</span>') : '') + '</button>',
        (state.timelineOpen ? '<div class="ags-fold-body">' + timelineHtml + '</div>' : ''),
        '</div>',

        '<div class="ags-fold-card">',
        '  <button type="button" class="ags-fold-btn" data-action="toggle-attach"><span>' + (state.attachOpen ? '▾ ' : '▸ ') + esc(t('attachTitle')) + '</span></button>',
        (state.attachOpen ? '<div class="ags-fold-body">' + attachHtml + '</div>' : ''),
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('quotaTitle')) + '</span>' +
        '    <div style="display:flex;gap:6px"><button class="ags-btn" data-action="refresh-quota-only">刷新</button><button class="ags-btn" data-action="launch-cli">' + esc(t('launchCli')) + '</button></div></div>',
        quotaMetaHtml,
        quotaHtml,
        '</div>'
      ].join('\n');
    }

    function renderUsage(hist, cfg) {
      var h = hist || { totalTokens: 0, totalCostUsd: 0, savingsVsSub: 0, bySource: { desktop: { totalTokens: 0 }, cli: { totalTokens: 0 } }, byModel: [], heatmap7xN: [], heatmap: [] };
      var cells = [];
      if (globalScope.__AG_STUDIO_HOME_CARD__ && globalScope.__AG_STUDIO_HOME_CARD__.normalizeHeatmap7xN) {
        cells = globalScope.__AG_STUDIO_HOME_CARD__.normalizeHeatmap7xN(h, state.days || 30);
      } else {
        cells = (h.heatmap || []).slice(-63).map(function (c) {
          return { date: c.date, total: c.totalTokens || 0, level: (c.totalTokens || 0) > 0 ? 2 : 0 };
        });
      }

      var hmHtml = cells.map(function (c) {
        var bg = c.level === 0 ? 'var(--ags-bg-subtle)' :
          c.level === 1 ? 'color-mix(in srgb, var(--ags-accent) 26%, var(--ags-bg-subtle))' :
          c.level === 2 ? 'color-mix(in srgb, var(--ags-accent) 48%, var(--ags-bg-subtle))' :
          c.level === 3 ? 'color-mix(in srgb, var(--ags-accent) 72%, var(--ags-bg-subtle))' :
          'var(--ags-accent)';
        return '<div class="ags-hm-cell" style="background:' + bg + '" title="' + esc(c.date + ': ' + fmtTok(c.total) + ' tokens') + '"></div>';
      }).join('');

      var deskTok = Number((h.bySource && h.bySource.desktop && (h.bySource.desktop.totalTokens != null ? h.bySource.desktop.totalTokens : h.bySource.desktop)) || 0);
      var cliTok = Number((h.bySource && h.bySource.cli && (h.bySource.cli.totalTokens != null ? h.bySource.cli.totalTokens : h.bySource.cli)) || 0);
      var sumSrc = Math.max(1, deskTok + cliTok);
      var deskPct = deskTok + cliTok > 0 ? Math.round((deskTok / sumSrc) * 100) : 100;
      var cliPct = deskTok + cliTok > 0 ? (100 - deskPct) : 0;

      var isCny = state.currency === 'CNY';
      var fxRate = isCny ? 7.25 : 1;
      var curSym = isCny ? '¥' : '$';
      var fmtMoney = function (usd) { return curSym + (Number(usd || 0) * fxRate).toFixed(2); };

      var allModels = Array.isArray(h.byModel) ? h.byModel : [];
      var topModels = allModels.slice(0, 12);
      if (allModels.length > 12) {
        var restModels = allModels.slice(12);
        topModels = topModels.concat([{
          model: '其他模型 (' + restModels.length + ')',
          totalTokens: restModels.reduce(function (s, m) { return s + Number(m.totalTokens || 0); }, 0),
          costUsd: restModels.reduce(function (s, m) { return s + Number(m.costUsd || 0); }, 0)
        }]);
      }
      var maxModel = Math.max.apply(null, topModels.map(function (m) { return m.totalTokens || 0; }).concat([1]));
      var modelHtml = topModels.length
        ? topModels.map(function (m) {
            var w = Math.round(((m.totalTokens || 0) / maxModel) * 100);
            return '<div style="display:flex;flex-direction:column;gap:3px">' +
              '<div class="ags-row"><span style="font-size:12px">' + esc(m.model) + '</span><span class="ags-sub">' + fmtTok(m.totalTokens) + ' · ' + fmtMoney(m.costUsd) + '</span></div>' +
              '<div class="ags-prog"><div class="ags-prog-fill" style="width:' + w + '%"></div></div></div>';
          }).join('')
        : '<div class="ags-sub">暂无历史用量记录</div>';

      var subPrice = Number((cfg && cfg.enhance && cfg.enhance.subscriptionMonthlyUsd) != null ? cfg.enhance.subscriptionMonthlyUsd : 20);
      var estCost = Number(h.totalCostUsd != null ? h.totalCostUsd : (h.costEstimate || 0));
      var savings = Number(h.savingsVsSub != null ? h.savingsVsSub : (h.savingsVsApiUsd != null ? h.savingsVsApiUsd : (estCost - subPrice)));
      var speedRows = Array.isArray(h.speedByModel) ? h.speedByModel : [];
      var speedRowsHtml = speedRows.length
        ? speedRows.map(function (sr) {
            return '<div class="ags-row" style="font-size:11.5px"><span>' + esc(sr.modelLabel || sr.model || 'model') + '</span>' +
              '<span class="ags-sub">' + Math.round(sr.medianTps || sr.avgTps || 0) + ' tok/s' +
              (sr.medianTtftSec != null ? (' · TTFT ' + Number(sr.medianTtftSec).toFixed(1) + 's') : '') +
              ' · ' + (sr.sampleCount || sr.count || 0) + '次</span></div>';
          }).join('')
        : '<div class="ags-sub">暂无速度样本</div>';

      return [
        '<div class="ags-row">',
        '  <div class="ags-pill-group">',
        '    <button class="ags-pill-opt ' + (state.days === 0 ? 'active' : '') + '" data-days="0">' + esc(t('daysAll')) + '</button>',
        '    <button class="ags-pill-opt ' + (state.days === 1 ? 'active' : '') + '" data-days="1">' + esc(t('daysToday')) + '</button>',
        '    <button class="ags-pill-opt ' + (state.days === 7 ? 'active' : '') + '" data-days="7">' + esc(t('days7')) + '</button>',
        '    <button class="ags-pill-opt ' + (state.days === 30 ? 'active' : '') + '" data-days="30">' + esc(t('days30')) + '</button>',
        '    <button class="ags-pill-opt ' + (state.days === 90 ? 'active' : '') + '" data-days="90">' + esc(t('days90')) + '</button>',
        '  </div>',
        '  <div style="display:flex;gap:5px"><button class="ags-btn" id="ags-currency-btn">' + (isCny ? '¥ CNY' : '$ USD') + '</button><button class="ags-btn" id="ags-sync-pricing-btn">' + esc(t('syncPricing')) + '</button></div>',
        '</div>',

        '<div class="ags-grid-3">',
        '  <div class="ags-metric-box"><div class="ags-sub">' + esc(t('totalTok')) + '</div><div class="ags-metric-val">' + fmtTok(h.totalTokens) + '</div></div>',
        '  <div class="ags-metric-box"><div class="ags-sub">' + esc(t('estApi')) + '</div><div class="ags-metric-val">' + fmtMoney(estCost) + '</div></div>',
        '  <div class="ags-metric-box"><div class="ags-sub">' + esc(t('vsSub')) + '</div><div class="ags-metric-val">' + (savings >= 0 ? ('+' + fmtMoney(savings)) : ('-' + fmtMoney(Math.abs(savings)))) + '</div></div>',
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('heatmap')) + '</span><span class="ags-sub">' + (h.sessions || 0) + ' 会话 · ' + (h.calls || 0) + ' 消息</span></div>',
        '  <div class="ags-hm-7row">' + hmHtml + '</div>',
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('sourceSplit')) + '</span><span class="ags-sub">Desktop ' + deskPct + '% / CLI ' + cliPct + '%</span></div>',
        '  <div class="ags-seg-bar"><div style="width:' + deskPct + '%;background:var(--ags-accent)"></div><div style="width:' + cliPct + '%;background:var(--ags-success)"></div></div>',
        '</div>',

        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('topModels')) + '</span><span class="ags-sub">订阅月费 $<input id="ags-sub-price" type="number" min="0" max="500" value="' + subPrice + '" style="width:46px;background:transparent;border:1px solid var(--ags-border);border-radius:5px;color:var(--ags-text-primary);padding:1px 4px;font-size:11px"></span></div>',
        modelHtml,
        '</div>',

        '<details class="ags-details">',
        '  <summary>各模型历史速度中位数对比</summary>',
        '  <div style="display:flex;flex-direction:column;gap:5px">' + speedRowsHtml + '</div>',
        '</details>'
      ].join('\n');
    }

    function renderAccounts(overview) {
      var ov = overview || { accounts: [], activeDetected: null, keepalive: { enabled: false }, autoSwitch: { enabled: false, threshold: 0.05 } };
      var list = ov.accounts || [];
      var activeInfo = ov.activeDetected || list.find(function (a) { return a.isActive; }) || null;

      var bannerHtml = '<div class="ags-card" style="padding:10px 12px">' +
        '<div class="ags-row"><span class="ags-sub">当前检测账号</span><span class="ags-sub">' + esc(activeInfo ? (activeInfo.planName || 'Active') : '未登录/未检测') + '</span></div>' +
        '<div style="font-weight:600;font-size:13px">' + esc(activeInfo ? (activeInfo.email || activeInfo.name || '已登录') : '等待检测客户端登录态') + '</div>' +
        '</div>';

      var cards = list.length
        ? list.map(function (a) {
            var letter = (a.name || a.email || 'A').slice(0, 1).toUpperCase();
            var accPools = Array.isArray(a.quotaPools) && a.quotaPools.length
              ? a.quotaPools
              : (a.quotaSnapshot && Array.isArray(a.quotaSnapshot.pools) ? a.quotaSnapshot.pools : []);
            var accQuotaHtml = '';
            if (accPools.length) {
              accQuotaHtml = '<div class="ags-acc-quota-box">' + accPools.map(function (p) {
                var pName = p.displayName || p.title || p.poolKey || '模型池';
                var bList = Array.isArray(p.buckets) && p.buckets.length
                  ? p.buckets
                  : [{ windowLabel: '当前额度', remainingPercent: p.remainingPercent, resetTime: p.resetTime, resetTimeText: p.resetTimeText, countdownText: p.countdownText, isLow: p.isLow }];
                var bHtml = bList.map(function (b) {
                  var bPct = b.remainingPercent != null
                    ? Math.round(Number(b.remainingPercent))
                    : (typeof b.remainingFraction === 'number' ? Math.round(b.remainingFraction * 100) : 100);
                  var bEta = b.countdownText || formatResetEta(b.resetTime || b.resetTimeIso);
                  var bColor = b.isLow || bPct <= 20 ? 'var(--ags-warning)' : 'var(--ags-accent)';
                  return '<div class="ags-acc-pool">' +
                    '<div class="ags-row" style="font-size:11px"><span class="ags-sub">' + esc(b.windowLabel || '周期额度') + '</span>' +
                    '<span class="ags-sub">' + bPct + '%' + (bEta ? (' · ' + esc(bEta)) : '') + (b.resetTimeText ? (' (' + esc(b.resetTimeText) + ')') : '') + '</span></div>' +
                    '<div class="ags-prog"><div class="ags-prog-fill" style="width:' + bPct + '%;background:' + bColor + '"></div></div>' +
                    '</div>';
                }).join('');
                return '<div style="display:flex;flex-direction:column;gap:4px"><div style="font-size:11.5px;font-weight:500">' + esc(pName) + '</div>' + bHtml + '</div>';
              }).join('') + '</div>';
            } else {
              accQuotaHtml = '<div class="ags-acc-quota-box"><div class="ags-sub" style="font-size:11px">' +
                (a.lastQuotaError ? ('刷新失败: ' + esc(a.lastQuotaError)) : '尚未获取额度快照（点击右上 ↻ 或「刷新额度」拉取）') +
                '</div></div>';
            }

            return '<div class="ags-acc-item">' +
              '  <div class="ags-row">' +
              '    <div style="display:flex;align-items:center;gap:10px;min-width:0">' +
              '      <div class="ags-avatar">' + esc(letter) + '</div>' +
              '      <div style="min-width:0">' +
              '        <div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(a.email || a.name) + '</div>' +
              '        <div class="ags-sub">' + esc(a.planName || a.source || 'Standard') + (a.lastQuotaUpdatedAtMs ? (' · 已同步') : '') + '</div>' +
              '      </div>' +
              '    </div>' +
              '    <div style="display:flex;align-items:center;gap:5px;flex-shrink:0">' +
              '      <button class="ags-btn ags-btn-ghost" title="刷新此账号额度" data-acc-refresh-one="' + esc(a.email || a.id) + '">↻</button>' +
              (a.isActive
                ? '<span class="ags-pill-opt active">' + esc(t('activeTag')) + '</span>'
                : '<button class="ags-btn ags-btn-primary" data-acc-switch="' + esc(a.id) + '">' + esc(t('switchBtn')) + '</button>') +
              '      <button class="ags-btn ags-btn-ghost" title="移除" data-acc-remove="' + esc(a.id) + '">×</button>' +
              '    </div>' +
              '  </div>' +
              accQuotaHtml +
              '</div>';
          }).join('')
        : '<div class="ags-card"><div class="ags-sub">尚未保存账号槽位，点击上方「导入当前」快速保存当前登录态。</div></div>';

      var ka = ov.keepalive || {};
      var asw = ov.autoSwitch || {};

      return [
        bannerHtml,
        '<div class="ags-row" style="flex-wrap:wrap;gap:6px">',
        '  <button class="ags-btn ags-btn-primary" data-acc-action="import_current">' + esc(t('importCur')) + '</button>',
        '  <button class="ags-btn" data-acc-action="oauth_login">' + esc(t('addOauth')) + '</button>',
        '  <button class="ags-btn" data-acc-action="import_tools">' + esc(t('importTools')) + '</button>',
        '  <button class="ags-btn" data-acc-action="refresh_quota">' + esc(t('refreshQuota')) + '</button>',
        '</div>',
        cards,
        '<details class="ags-details">',
        '  <summary>' + esc(t('keepaliveTitle')) + '</summary>',
        '  <div class="ags-row" style="margin-bottom:8px"><span>启用后台保活 (Keepalive)</span><input type="checkbox" id="ags-keepalive-en" ' + (ka.enabled ? 'checked' : '') + '></div>',
        '  <div class="ags-row" style="margin-bottom:8px"><span>启用低额度自动切号</span><input type="checkbox" id="ags-auto-switch-en" ' + (asw.enabled ? 'checked' : '') + '></div>',
        '  <div class="ags-row"><span>触发阈值 (%)</span><input class="ags-input" style="width:90px" type="number" min="1" max="50" id="ags-auto-switch-th" value="' + Math.round(((asw.threshold) || 0.05) * 100) + '"></div>',
        '</details>'
      ].join('\n');
    }

    function renderSettings(cfg) {
      var themeCfg = cfg.theme || {};
      var mascotCfg = cfg.mascot || {};
      var hudCfg = cfg.hud || {};
      var fxCfg = cfg.fx || {};
      var i18nCfg = cfg.i18n || {};
      var proxyCfg = cfg.proxy || {};
      var fonts = themeCfg.fonts || {};
      var customThemes = Array.isArray(themeCfg.customThemes) ? themeCfg.customThemes : [];
      var scannedFonts = state.fonts || [];
      var enh = state.enhanceStatus || {};
      var unl = state.unlockStatus || {};
      var reh = state.rehydrateStatus || {};

      var curPromptTier = enh.promptTier != null ? Number(enh.promptTier) : Number((cfg.enhance && cfg.enhance.promptTier) || 0);
      var curCnTitle = enh.chineseTitle != null ? Boolean(enh.chineseTitle) : Boolean(cfg.enhance && cfg.enhance.chineseSessionTitle);
      var curUnlockMode = unl.mode || (cfg.context && cfg.context.unlockMode) || 'ORIG';
      var curUnlockConst = unl.limitTokens || (cfg.context && cfg.context.unlockLimitTokens) || 512000;
      var curCliAlign = unl.alignCli != null ? Boolean(unl.alignCli) : Boolean(cfg.context && cfg.context.alignCli);
      var curRehydrate = Boolean(reh.enabled != null ? reh.enabled : (cfg.enhance && cfg.enhance.rehydrateEnabled));

      var customThemeOptions = customThemes.map(function (ct) {
        return '<div class="ags-row" style="margin-top:6px">' +
          '<button class="ags-btn ' + (themeCfg.activePreset === ct.id ? 'ags-btn-primary' : '') + '" data-select-theme="' + esc(ct.id) + '">' + esc(ct.name) + '</button>' +
          '<button class="ags-btn ags-btn-ghost" data-del-theme="' + esc(ct.id) + '">删除</button>' +
          '</div>';
      }).join('');

      var curModel = (state.snapshot && state.snapshot.context && state.snapshot.context.model) || 'gemini-4-neon';
      var curPerLimits = (cfg.context && cfg.context.perModelLimits) || {};
      var curModelLimitVal = curPerLimits[curModel] || 512000;

      return [
        // Section 1: Appearance, Fonts & Mascot
        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('secTheme')) + '</span></div>',
        '  <div class="ags-theme-cards">',
        '    <button class="ags-theme-card ' + (themeCfg.activePreset === 'claude' ? 'active' : '') + '" data-select-theme="claude">' +
        '      <div style="display:flex;align-items:center;gap:6px;font-weight:600"><span class="ags-swatch" style="background:#D97757;border-radius:50%"></span>Claude</div>' +
        '      <div class="ags-sub" style="margin-top:2px">暖纸陶橙编辑部</div>' +
        '    </button>',
        '    <button class="ags-theme-card ' + (themeCfg.activePreset === 'antigravity' ? 'active' : '') + '" data-select-theme="antigravity">' +
        '      <div style="display:flex;align-items:center;gap:6px;font-weight:600"><span class="ags-swatch" style="background:#3B6CF6;border-radius:50%"></span>Antigravity</div>' +
        '      <div class="ags-sub" style="margin-top:2px">星轨极光未来感</div>' +
        '    </button>',
        '  </div>',
        '  <div class="ags-row"><span>明暗模式</span>' +
        '    <div class="ags-pill-group">' +
        '      <button class="ags-pill-opt ' + (themeCfg.colorMode === 'system' ? 'active' : '') + '" data-colormode="system">系统</button>' +
        '      <button class="ags-pill-opt ' + (themeCfg.colorMode === 'light' ? 'active' : '') + '" data-colormode="light">浅色</button>' +
        '      <button class="ags-pill-opt ' + (themeCfg.colorMode === 'dark' ? 'active' : '') + '" data-colormode="dark">深色</button>' +
        '    </div></div>',
        '  <div class="ags-row"><span>桌宠</span>' +
        '    <div style="display:flex;gap:5px;align-items:center">' +
        '      <select class="ags-select" style="width:98px" id="ags-mascot-style">' +
        '        <option value="clawd" ' + (mascotCfg.style === 'clawd' ? 'selected' : '') + '>Clawd 蟹</option>' +
        '        <option value="deepy" ' + (mascotCfg.style === 'deepy' ? 'selected' : '') + '>Deepy 鲸</option>' +
        '        <option value="astra" ' + (mascotCfg.style === 'astra' ? 'selected' : '') + '>Astra 星灵</option>' +
        '      </select>' +
        '      <select class="ags-select" style="width:62px" id="ags-mascot-scale">' +
        '        <option value="1" ' + (Number(mascotCfg.scale || 1) === 1 ? 'selected' : '') + '>1x</option>' +
        '        <option value="1.5" ' + (Number(mascotCfg.scale) === 1.5 ? 'selected' : '') + '>1.5x</option>' +
        '        <option value="2" ' + (Number(mascotCfg.scale) === 2 ? 'selected' : '') + '>2x</option>' +
        '      </select>' +
        '      <select class="ags-select" style="width:54px" id="ags-mascot-align">' +
        '        <option value="right" ' + ((mascotCfg.align || 'right') === 'right' ? 'selected' : '') + '>右</option>' +
        '        <option value="center" ' + (mascotCfg.align === 'center' ? 'selected' : '') + '>中</option>' +
        '        <option value="left" ' + (mascotCfg.align === 'left' ? 'selected' : '') + '>左</option>' +
        '      </select>' +
        '      <input type="checkbox" id="ags-mascot-enabled" ' + (mascotCfg.enabled !== false ? 'checked' : '') + '>' +
        '    </div></div>',
        '  <div class="ags-row"><span>工具栏上下文展示</span>' +
        '    <div style="display:flex;gap:5px;align-items:center">' +
        '      <select class="ags-select" style="width:82px" id="ags-hud-style">' +
        '        <option value="ring" ' + ((hudCfg.displayStyle || 'ring') === 'ring' ? 'selected' : '') + '>极简圆环</option>' +
        '        <option value="capsule" ' + (hudCfg.displayStyle === 'capsule' ? 'selected' : '') + '>完整胶囊</option>' +
        '      </select>' +
        '      <select class="ags-select" style="width:94px" id="ags-hud-pos">' +
        '        <option value="composer" ' + (hudCfg.position !== 'floating' ? 'selected' : '') + '>工具栏内</option>' +
        '        <option value="floating" ' + (hudCfg.position === 'floating' ? 'selected' : '') + '>右下悬浮</option>' +
        '      </select>' +
        '      <input type="checkbox" id="ags-hud-enabled" ' + (hudCfg.enabled !== false ? 'checked' : '') + '>' +
        '    </div></div>',
        '  <div class="ags-row"><span>512K 呼吸试管 (胶囊模式)</span><input type="checkbox" id="ags-vial-enabled" ' + (hudCfg.showVial !== false ? 'checked' : '') + '></div>',
        '  <div class="ags-row"><span>新对话首页用量概览卡片</span><input type="checkbox" id="ags-home-card-enabled" ' + (cfg.homeOverview !== false && hudCfg.homeOverview !== false ? 'checked' : '') + '></div>',
        '  <details class="ags-details">',
        '    <summary>' + esc(t('customThemeTitle')) + ' & 三轨字体 (' + scannedFonts.length + ')</summary>',
        '    <div class="ags-row" style="gap:6px">' +
        '      <input class="ags-input" id="ags-new-theme-name" placeholder="新方案名称">' +
        '      <input type="color" id="ags-new-theme-accent" value="#D97757" style="width:36px;height:30px;border:none;background:transparent">' +
        '      <button class="ags-btn" id="ags-create-theme-btn">新建</button>' +
        '    </div>',
        customThemeOptions,
        '    <div class="ags-row" style="margin-top:8px"><span>编辑部衬线阅读</span><input type="checkbox" id="ags-serif-toggle" ' + (themeCfg.editorialSerif !== false ? 'checked' : '') + '></div>',
        '    <div class="ags-row" style="margin-top:6px"><span class="ags-sub">UI 字体</span><select class="ags-select" style="width:160px" id="ags-font-ui">' +
        '      <option value="system" ' + ((fonts.ui || 'system') === 'system' ? 'selected' : '') + '>System UI</option>' +
        '      <option value="inter" ' + (fonts.ui === 'inter' ? 'selected' : '') + '>Inter</option>' +
        '      <option value="noto" ' + (fonts.ui === 'noto' ? 'selected' : '') + '>Noto Sans SC</option>' +
        '    </select></div>',
        '    <div class="ags-row" style="margin-top:6px"><span class="ags-sub">正文字体</span><select class="ags-select" style="width:160px" id="ags-font-body">' +
        '      <option value="serif-editorial" ' + ((fonts.body || 'serif-editorial') === 'serif-editorial' ? 'selected' : '') + '>Newsreader / 思源宋体</option>' +
        '      <option value="sans-clean" ' + (fonts.body === 'sans-clean' ? 'selected' : '') + '>干净无衬线</option>' +
        '      <option value="georgia" ' + (fonts.body === 'georgia' ? 'selected' : '') + '>Georgia 经典</option>' +
        '    </select></div>',
        '    <div class="ags-row" style="margin-top:6px"><span class="ags-sub">代码字体</span><select class="ags-select" style="width:160px" id="ags-font-code">' +
        '      <option value="jetbrains" ' + ((fonts.code || 'jetbrains') === 'jetbrains' ? 'selected' : '') + '>JetBrains Mono</option>' +
        '      <option value="cascadia" ' + (fonts.code === 'cascadia' ? 'selected' : '') + '>Cascadia Code</option>' +
        '      <option value="system" ' + (fonts.code === 'system' ? 'selected' : '') + '>System Monospace</option>' +
        '    </select></div>',
        '    <div class="ags-row" style="margin-top:6px"><span class="ags-sub">自定义正文字体名</span><input class="ags-input" style="width:160px" id="ags-custom-body-font" value="' + esc(fonts.customBodyFont || '') + '" placeholder="本地字体名"></div>',
        '    <div class="ags-row" style="margin-top:6px"><span class="ags-sub">本地字体目录 (' + scannedFonts.length + ' 已加载)</span><button class="ags-btn" data-open-path="fonts">打开目录</button></div>',
        '  </details>',
        '</div>',

        // Section 2: Prism FX
        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('secFx')) + '</span></div>',
        '  <div class="ags-row"><span>水墨流式淡入</span><input type="checkbox" id="ags-fx-ink" ' + (fxCfg.inkStream !== false ? 'checked' : '') + '></div>',
        '  <div class="ags-row"><span>输入框平滑光标</span><input type="checkbox" id="ags-fx-caret" ' + (fxCfg.smoothCaret !== false ? 'checked' : '') + '></div>',
        '  <div class="ags-row"><span>三态边缘余晖提示</span><input type="checkbox" id="ags-fx-aura" ' + (fxCfg.edgeAura !== false ? 'checked' : '') + '></div>',
        '  <div class="ags-row"><span>模型菜单推理等级滑块</span><input type="checkbox" id="ags-fx-effort" ' + (fxCfg.effortSlider !== false ? 'checked' : '') + '></div>',
        '</div>',

        // Section 3: Language & Dictionary
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

        // Section 4: Proxy & System Enhancements
        '<div class="ags-card">',
        '  <div class="ags-card-head"><span>' + esc(t('secNet')) + '</span>' + (state.proxyTestResult ? '<span class="ags-sub">' + esc(state.proxyTestResult) + '</span>' : '') + '</div>',
        '  <div class="ags-row"><span>免 TUN 本地代理</span><input type="checkbox" id="ags-proxy-enabled" ' + (proxyCfg.enabled ? 'checked' : '') + '></div>',
        '  <div class="ags-row" style="gap:6px">' +
        '    <input class="ags-input" id="ags-proxy-url" value="' + esc(proxyCfg.proxyUrl || 'http://127.0.0.1:7897') + '" placeholder="http://127.0.0.1:7897">' +
        '    <button class="ags-btn" id="ags-proxy-save-btn">保存</button>' +
        '    <button class="ags-btn" id="ags-proxy-test-btn">' + esc(t('testProxy')) + '</button>' +
        '  </div>',
        '  <div><div class="ags-sub" style="margin-bottom:4px">Bypass 绕过规则</div><input class="ags-input" id="ags-proxy-bypass" value="' + esc(proxyCfg.bypassList || '') + '"></div>',

        '  <details class="ags-details" open>',
        '    <summary>' + esc(t('enhanceTitle')) + '</summary>',
        '    <div style="display:flex;flex-direction:column;gap:8px">',
        '      <div class="ags-row"><span>系统提示词精简档位</span>' +
        '        <select class="ags-select" style="width:165px" id="ags-prompt-tier">' +
        '          <option value="0" ' + (curPromptTier === 0 ? 'selected' : '') + '>0 档 · 官方原版</option>' +
        '          <option value="1" ' + (curPromptTier === 1 ? 'selected' : '') + '>1 档 · 仅去推销</option>' +
        '          <option value="2" ' + (curPromptTier === 2 ? 'selected' : '') + '>2 档 · 原版精简</option>' +
        '          <option value="3" ' + (curPromptTier === 3 ? 'selected' : '') + '>3 档 · 核心重写</option>' +
        '          <option value="4" ' + (curPromptTier === 4 ? 'selected' : '') + '>4 档 · 精简+防幻觉</option>' +
        '        </select></div>',
        '      <div class="ags-row"><span>对话自动中文标题</span><input type="checkbox" id="ags-cn-title" ' + (curCnTitle ? 'checked' : '') + '></div>',
        '      <div class="ags-row" style="justify-content:flex-end;gap:6px">' +
        '        <button class="ags-btn ags-btn-primary" id="ags-enhance-apply-btn">应用提示词/标题</button>' +
        '        <button class="ags-btn" id="ags-enhance-restore-btn">还原</button>' +
        '      </div>',

        '      <hr style="border:none;border-top:1px solid var(--ags-border);margin:2px 0">',

        '      <div class="ags-row"><span>上下文窗口解锁</span>' +
        '        <select class="ags-select" style="width:165px" id="ags-unlock-mode">' +
        '          <option value="ORIG" ' + (curUnlockMode === 'ORIG' ? 'selected' : '') + '>ORIG · 原版 (256K)</option>' +
        '          <option value="CONST" ' + (curUnlockMode === 'CONST' ? 'selected' : '') + '>CONST · 固定上限</option>' +
        '          <option value="DYN" ' + (curUnlockMode === 'DYN' ? 'selected' : '') + '>DYN · 动态解锁 (1M)</option>' +
        '        </select></div>',
        '      <div class="ags-row"><span>CONST 上限 (tokens)</span><input class="ags-input" style="width:120px" type="number" id="ags-unlock-limit" value="' + esc(curUnlockConst) + '"></div>',
        '      <div class="ags-row"><span>同步对齐 agy CLI</span><input type="checkbox" id="ags-unlock-cli" ' + (curCliAlign ? 'checked' : '') + '></div>',
        '      <div class="ags-row" style="justify-content:flex-end;gap:6px">' +
        '        <button class="ags-btn ags-btn-primary" id="ags-unlock-apply-btn">应用上下文解锁</button>' +
        '        <button class="ags-btn" id="ags-unlock-restore-btn">还原</button>' +
        '      </div>',

        '      <hr style="border:none;border-top:1px solid var(--ags-border);margin:2px 0">',

        '      <div class="ags-row"><span>当前模型显示上限 (' + esc(curModel) + ')</span><input class="ags-input" style="width:100px" type="number" id="ags-per-model-limit" value="' + esc(curModelLimitVal) + '"></div>',
        '      <div class="ags-row" style="justify-content:flex-end;gap:5px">' +
        '        <button class="ags-btn" data-model-preset="200000">200K</button>' +
        '        <button class="ags-btn" data-model-preset="524288">512K</button>' +
        '        <button class="ags-btn" data-model-preset="1048576">1M</button>' +
        '        <button class="ags-btn" id="ags-model-limit-reset-btn">恢复默认</button>' +
        '      </div>',

        '      <hr style="border:none;border-top:1px solid var(--ags-border);margin:2px 0">',

        '      <div class="ags-row"><span>压缩后记忆自动回填</span><input type="checkbox" id="ags-rehydrate-en" ' + (curRehydrate ? 'checked' : '') + '></div>',
        '      <div class="ags-row" style="gap:6px;flex-wrap:wrap;margin-top:4px">' +
        '        <button class="ags-btn" id="ags-restart-ls-btn">重启 LS</button>' +
        '        <button class="ags-btn" id="ags-restart-host-btn">重启宿主客户端</button>' +
        '        <button class="ags-btn" data-open-path="state">配置目录</button>' +
        '      </div>',
        '    </div>',
        '  </details>',
        '</div>'
      ].join('\n');
    }

    function bindEvents(cfg) {
      var bodyEl = el.querySelector('#ags-drawer-body');
      if (!bodyEl) return;

      var tlBtn = bodyEl.querySelector('[data-action="toggle-timeline"]');
      if (tlBtn) {
        tlBtn.addEventListener('click', function () {
          state.timelineOpen = !state.timelineOpen;
          var cid = state.snapshot && state.snapshot.conversationId;
          if (state.timelineOpen && opts.api && opts.api.getSessionTimeline && cid && (!state.timelineData || state.timelineConvId !== cid)) {
            state.timelineLoading = true;
            state.timelineConvId = cid;
            render(null, true);
            opts.api.getSessionTimeline(cid, { limit: 15 }).then(function (tl) {
              state.timelineLoading = false;
              state.timelineData = tl;
              render(null, true);
            }).catch(function () {
              state.timelineLoading = false;
              render(null, true);
            });
          } else {
            render(null, true);
          }
        });
      }

      var attBtn = bodyEl.querySelector('[data-action="toggle-attach"]');
      if (attBtn) {
        attBtn.addEventListener('click', function () {
          state.attachOpen = !state.attachOpen;
          render(null, true);
        });
      }

      el.querySelectorAll('[data-days]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.days = Number(btn.getAttribute('data-days'));
          if (opts.onRefresh) opts.onRefresh(true);
        });
      });

      var syncPriceBtn = el.querySelector('#ags-sync-pricing-btn');
      if (syncPriceBtn) {
        syncPriceBtn.addEventListener('click', function () {
          if (!opts.api || !opts.api.syncPricing) return;
          opts.api.syncPricing({ force: true }).then(function () {
            showToast('已同步最新模型定价');
            if (opts.onRefresh) opts.onRefresh(true);
          }).catch(function (e) { showToast(e.message || '同步失败'); });
        });
      }

      var curBtn = el.querySelector('#ags-currency-btn');
      if (curBtn) {
        curBtn.addEventListener('click', function () {
          state.currency = state.currency === 'CNY' ? 'USD' : 'CNY';
          render(null, true);
        });
      }

      var subPriceEl = el.querySelector('#ags-sub-price');
      if (subPriceEl) {
        subPriceEl.addEventListener('change', function () {
          opts.saveConfig({ enhance: { subscriptionMonthlyUsd: Number(subPriceEl.value || 20) } });
        });
      }

      var refQuotaBtn = el.querySelector('[data-action="refresh-quota-only"]');
      if (refQuotaBtn) {
        refQuotaBtn.addEventListener('click', function () {
          if (opts.api && opts.api.getQuota) {
            opts.api.getQuota({ force: true }).then(function (q) {
              if (state.snapshot && q) state.snapshot.quota = q;
              showToast('额度已刷新');
              render();
            }).catch(function () {});
          }
        });
      }

      var cliBtn = el.querySelector('[data-action="launch-cli"]');
      if (cliBtn) cliBtn.addEventListener('click', function () {
        if (opts.api && opts.api.launchCli) opts.api.launchCli().then(function () { showToast('已唤起 CLI 终端'); });
      });

      el.querySelectorAll('[data-acc-action]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var action = btn.getAttribute('data-acc-action');
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: action }).then(function (res) {
              showToast((res && (res.message || res.error)) || '操作已完成');
              if (opts.onRefresh) opts.onRefresh(true);
            }).catch(function (err) { showToast((err && err.message) || '操作失败'); });
          }
        });
      });

      el.querySelectorAll('[data-acc-refresh-one]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var email = btn.getAttribute('data-acc-refresh-one');
          if (opts.api && opts.api.accountsAction && email) {
            opts.api.accountsAction({ action: 'refresh_quota', email: email }).then(function (res) {
              showToast((res && (res.message || res.error)) || '额度已刷新');
              if (opts.onRefresh) opts.onRefresh(true);
            }).catch(function (err) { showToast((err && err.message) || '刷新失败'); });
          }
        });
      });

      el.querySelectorAll('[data-acc-switch]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-acc-switch');
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: 'switch', accountId: id }).then(function (res) {
              showToast(res && res.requiresRestart ? '已切换账号，重启客户端生效' : '账号已切换');
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

      var kaEn = el.querySelector('#ags-keepalive-en');
      if (kaEn) {
        kaEn.addEventListener('change', function () {
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: kaEn.checked ? 'update_keepalive' : 'stop_keepalive', enabled: kaEn.checked }).then(function () {
              showToast(kaEn.checked ? '已开启账号保活' : '已关闭保活');
            }).catch(function () {});
          }
        });
      }

      var autoSw = el.querySelector('#ags-auto-switch-en');
      var autoTh = el.querySelector('#ags-auto-switch-th');
      if (autoSw && autoTh) {
        var saveAuto = function () {
          var payload = { enabled: autoSw.checked, threshold: Number(autoTh.value || 5) / 100 };
          opts.saveConfig({ quota: { autoSwitch: payload } });
          if (opts.api && opts.api.accountsAction) {
            opts.api.accountsAction({ action: 'update_auto_switch', autoSwitch: payload }).catch(function () {});
          }
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
      var mAlign = el.querySelector('#ags-mascot-align');
      var mEn = el.querySelector('#ags-mascot-enabled');
      if (mStyle && mScale && mEn) {
        var saveMascot = function () {
          opts.saveConfig({
            mascot: {
              style: mStyle.value,
              scale: Number(mScale.value),
              align: mAlign ? mAlign.value : 'right',
              enabled: mEn.checked
            }
          });
        };
        mStyle.addEventListener('change', saveMascot);
        mScale.addEventListener('change', saveMascot);
        if (mAlign) mAlign.addEventListener('change', saveMascot);
        mEn.addEventListener('change', saveMascot);
      }

      var hStyle = el.querySelector('#ags-hud-style');
      var hPos = el.querySelector('#ags-hud-pos');
      var hEn = el.querySelector('#ags-hud-enabled');
      var vialEn = el.querySelector('#ags-vial-enabled');
      if (hPos && hEn && vialEn) {
        var saveHud = function () {
          opts.saveConfig({
            hud: {
              displayStyle: hStyle ? hStyle.value : 'ring',
              position: hPos.value,
              enabled: hEn.checked,
              showVial: vialEn.checked
            }
          });
        };
        if (hStyle) hStyle.addEventListener('change', saveHud);
        hPos.addEventListener('change', saveHud);
        hEn.addEventListener('change', saveHud);
        vialEn.addEventListener('change', saveHud);
      }

      var homeCardEl = el.querySelector('#ags-home-card-enabled');
      if (homeCardEl) homeCardEl.addEventListener('change', function () {
        opts.saveConfig({ homeOverview: homeCardEl.checked, hud: { homeOverview: homeCardEl.checked } });
      });

      var fxMap = [
        ['#ags-fx-ink', 'inkStream'],
        ['#ags-fx-caret', 'smoothCaret'],
        ['#ags-fx-aura', 'edgeAura'],
        ['#ags-fx-effort', 'effortSlider']
      ];
      fxMap.forEach(function (pair) {
        var node = el.querySelector(pair[0]);
        if (node) {
          node.addEventListener('change', function () {
            var p = {};
            p[pair[1]] = node.checked;
            opts.saveConfig({ fx: p });
          });
        }
      });

      var createThemeBtn = el.querySelector('#ags-create-theme-btn');
      if (createThemeBtn) createThemeBtn.addEventListener('click', function () {
        var nameInput = el.querySelector('#ags-new-theme-name');
        var colorInput = el.querySelector('#ags-new-theme-accent');
        var themesApi = globalScope.__AG_STUDIO_THEMES__;
        if (!themesApi) return;
        var base = themesApi.cloneThemeAsCustom(cfg.theme && cfg.theme.activePreset === 'antigravity' ? 'antigravity' : 'claude', (nameInput && nameInput.value) || 'My Theme');
        var hex = (colorInput && colorInput.value) || '#D97757';
        Object.assign(base.light, themesApi.deriveAccentTokens(hex, false));
        Object.assign(base.dark, themesApi.deriveAccentTokens(hex, true));
        var nextCustoms = ((cfg.theme && cfg.theme.customThemes) || []).concat([base]);
        opts.saveConfig({ theme: { customThemes: nextCustoms, activePreset: base.id } });
        showToast('已创建并应用自定义配色');
      });

      var fontBindings = [
        ['#ags-font-ui', 'ui'],
        ['#ags-font-body', 'body'],
        ['#ags-font-code', 'code']
      ];
      fontBindings.forEach(function (pair) {
        var sel = el.querySelector(pair[0]);
        if (sel) {
          sel.addEventListener('change', function () {
            var f = {};
            f[pair[1]] = sel.value;
            opts.saveConfig({ theme: { fonts: f } });
          });
        }
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
          state.proxyTestResult = res && res.latencyMs != null ? ('连通 ' + res.latencyMs + 'ms') : '连通正常';
          render();
        }).catch(function (err) {
          state.proxyTestResult = '失败: ' + err.message;
          render();
        });
      });

      // Enhance: promptTier (0~4) + chineseTitle
      var enhApplyBtn = el.querySelector('#ags-enhance-apply-btn');
      var enhRestBtn = el.querySelector('#ags-enhance-restore-btn');
      var tierSel = el.querySelector('#ags-prompt-tier');
      var cnTitleEl = el.querySelector('#ags-cn-title');
      if (enhApplyBtn && tierSel && cnTitleEl) {
        enhApplyBtn.addEventListener('click', function () {
          var tier = Number(tierSel.value || 0);
          var cn = Boolean(cnTitleEl.checked);
          opts.saveConfig({ enhance: { promptTier: tier, chineseSessionTitle: cn } });
          if (opts.api && opts.api.applyEnhance) {
            opts.api.applyEnhance({ promptTier: tier, chineseTitle: cn }).then(function (r) {
              state.enhanceStatus = r || { promptTier: tier, chineseTitle: cn };
              showToast('提示词与标题增强已应用');
              render();
            }).catch(function (e) { showToast(e.message || '应用失败'); });
          }
        });
      }
      if (enhRestBtn) {
        enhRestBtn.addEventListener('click', function () {
          if (opts.api && opts.api.restoreEnhance) {
            opts.api.restoreEnhance().then(function (r) {
              state.enhanceStatus = r || { promptTier: 0, chineseTitle: false };
              opts.saveConfig({ enhance: { promptTier: 0, chineseSessionTitle: false } });
              showToast('已还原官方提示词与标题');
              render();
            }).catch(function (e) { showToast(e.message || '还原失败'); });
          }
        });
      }

      // Context Unlock: ORIG / CONST / DYN + CLI align
      var unlApplyBtn = el.querySelector('#ags-unlock-apply-btn');
      var unlRestBtn = el.querySelector('#ags-unlock-restore-btn');
      var unlModeSel = el.querySelector('#ags-unlock-mode');
      var unlLimitInp = el.querySelector('#ags-unlock-limit');
      var unlCliChk = el.querySelector('#ags-unlock-cli');
      if (unlApplyBtn && unlModeSel) {
        unlApplyBtn.addEventListener('click', function () {
          var mode = unlModeSel.value || 'ORIG';
          var limitTokens = Number((unlLimitInp && unlLimitInp.value) || 512000);
          var alignCli = Boolean(unlCliChk && unlCliChk.checked);
          opts.saveConfig({ context: { unlockMode: mode, unlockLimitTokens: limitTokens, alignCli: alignCli } });
          if (opts.api && opts.api.applyContextUnlock) {
            opts.api.applyContextUnlock({ mode: mode, limitTokens: limitTokens, alignCli: alignCli }).then(function (r) {
              state.unlockStatus = r || { mode: mode, limitTokens: limitTokens, alignCli: alignCli };
              showToast('上下文解锁策略已应用');
              render();
            }).catch(function (e) { showToast(e.message || '应用失败'); });
          }
        });
      }
      if (unlRestBtn) {
        unlRestBtn.addEventListener('click', function () {
          if (opts.api && opts.api.restoreContextUnlock) {
            opts.api.restoreContextUnlock().then(function (r) {
              state.unlockStatus = r || { mode: 'ORIG' };
              opts.saveConfig({ context: { unlockMode: 'ORIG' } });
              showToast('已还原原版上下文限制');
              render();
            }).catch(function (e) { showToast(e.message || '还原失败'); });
          }
        });
      }

      // Rehydrate after compact
      var curModelForLimit = (state.snapshot && state.snapshot.context && state.snapshot.context.model) || 'gemini-4-neon';
      var perLimInp = el.querySelector('#ags-per-model-limit');
      if (perLimInp) {
        perLimInp.addEventListener('change', function () {
          if (opts.api && opts.api.setContextLimit) {
            opts.api.setContextLimit(curModelForLimit, Number(perLimInp.value || 512000)).then(function () {
              showToast('已保存 ' + curModelForLimit + ' 上限');
              if (opts.onRefresh) opts.onRefresh(true);
            }).catch(function (e) { showToast(e.message || '保存失败'); });
          }
        });
      }
      el.querySelectorAll('[data-model-preset]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var v = Number(btn.getAttribute('data-model-preset'));
          if (perLimInp) perLimInp.value = String(v);
          if (opts.api && opts.api.setContextLimit) {
            opts.api.setContextLimit(curModelForLimit, v).then(function () {
              showToast('已设为 ' + fmtTok(v));
              if (opts.onRefresh) opts.onRefresh(true);
            }).catch(function () {});
          }
        });
      });
      var resetLimBtn = el.querySelector('#ags-model-limit-reset-btn');
      if (resetLimBtn) {
        resetLimBtn.addEventListener('click', function () {
          if (opts.api && opts.api.resetContextLimit) {
            opts.api.resetContextLimit(curModelForLimit).then(function () {
              showToast('已恢复默认上限');
              if (opts.onRefresh) opts.onRefresh(true);
            }).catch(function () {});
          }
        });
      }

      var rehEl = el.querySelector('#ags-rehydrate-en');
      if (rehEl) {
        rehEl.addEventListener('change', function () {
          var on = rehEl.checked;
          opts.saveConfig({ enhance: { rehydrateEnabled: on } });
          if (opts.api) {
            var fn = on ? opts.api.applyRehydrate : (opts.api.disableRehydrate || opts.api.restoreRehydrate);
            if (fn) {
              fn().then(function (r) {
                state.rehydrateStatus = r || { enabled: on };
                showToast(on ? '已开启压缩后记忆回填' : '已关闭压缩后记忆回填');
              }).catch(function (e) { showToast(e.message || '操作失败'); });
            }
          }
        });
      }

      el.querySelectorAll('[data-open-path]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (opts.api && opts.api.openPath) opts.api.openPath(btn.getAttribute('data-open-path'));
        });
      });

      var restartLsBtn = el.querySelector('#ags-restart-ls-btn');
      if (restartLsBtn) restartLsBtn.addEventListener('click', function () {
        if (opts.api && opts.api.restartLanguageServers) {
          opts.api.restartLanguageServers().then(function () { showToast('LanguageServer 已重启'); }).catch(function () {});
        }
      });

      var restartBtn = el.querySelector('#ags-restart-host-btn');
      if (restartBtn) restartBtn.addEventListener('click', function () {
        if (opts.api && opts.api.restartHost) opts.api.restartHost();
      });
    }

    function render(dataPatch, forceUserAction) {
      if (dataPatch) {
        if (dataPatch.snapshot !== undefined) state.snapshot = dataPatch.snapshot;
        if (dataPatch.history !== undefined) state.history = dataPatch.history;
        if (dataPatch.accounts !== undefined) state.accounts = dataPatch.accounts;
        if (dataPatch.fonts !== undefined) state.fonts = dataPatch.fonts;
        if (dataPatch.enhanceStatus !== undefined) state.enhanceStatus = dataPatch.enhanceStatus;
        if (dataPatch.unlockStatus !== undefined) state.unlockStatus = dataPatch.unlockStatus;
        if (dataPatch.rehydrateStatus !== undefined) state.rehydrateStatus = dataPatch.rehydrateStatus;
      }

      var bodyEl = el.querySelector('#ags-drawer-body');
      if (!bodyEl) return;

      // Avoid destroying focused input/select during background polling
      if (!forceUserAction && typeof document !== 'undefined' && document.activeElement && bodyEl.contains(document.activeElement)) {
        var tag = (document.activeElement.tagName || '').toUpperCase();
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
          return;
        }
      }

      var cfg = (opts.getConfig && opts.getConfig()) || {};
      var tabLabels = t('tabs');

      var titleSpan = el.querySelector('#ags-head-title');
      if (titleSpan) titleSpan.textContent = t('title');
      var closeSpan = el.querySelector('#ags-close-btn');
      if (closeSpan) closeSpan.textContent = t('close');
      el.querySelectorAll('[data-tab]').forEach(function (tb) {
        var tk = tb.getAttribute('data-tab');
        tb.textContent = tabLabels[tk] || tk;
        tb.classList.toggle('active', state.activeTab === tk);
      });

      var content = '';
      if (state.activeTab === 'overview') content = renderOverview(state.snapshot);
      else if (state.activeTab === 'usage') content = renderUsage(state.history, cfg);
      else if (state.activeTab === 'accounts') content = renderAccounts(state.accounts);
      else content = renderSettings(cfg);

      var prevScroll = bodyEl.scrollTop || 0;
      bodyEl.innerHTML = content;
      bodyEl.scrollTop = prevScroll;

      bindEvents(cfg);
    }

    function toggle(forceOpen) {
      state.open = typeof forceOpen === 'boolean' ? forceOpen : !state.open;
      el.classList.toggle('ags-hidden', !state.open);
      if (state.open && opts.onRefresh) opts.onRefresh(true);
    }

    render();

    return {
      element: el,
      isOpen: function () { return state.open; },
      getDays: function () { return state.days; },
      getActiveTab: function () { return state.activeTab; },
      pushSpeedSample: function (v) {
        state.speedHistory.push(Number(v || 0));
        if (state.speedHistory.length > 32) state.speedHistory.shift();
      },
      toggle: toggle,
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
    globalScope.__AG_STUDIO_DRAWER__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
