// Built by scripts/build-renderer.js
(function (globalScope) {
  'use strict';

  var originalTexts = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var lastTranslatedTexts = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var originalAttrs = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var lastTranslatedAttrs = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  var TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label', 'data-tooltip', 'alt', 'aria-description'];

  var IGNORE_SELECTORS = [
    '[data-ag-studio-ignore]',
    '#ag-studio-root',
    '#context-meter-root',
    '.monaco-editor',
    '.editor-instance',
    '.view-lines',
    '.view-line',
    '.monaco-mouse-cursor-text',
    '.xterm',
    '.xterm-rows',
    '.xterm-screen',
    '.xterm-accessibility',
    '.hljs',
    '.shiki',
    '.prism',
    '.codemirror',
    '.code-block',
    '.codeblock',
    '.code-line',
    '.gutter',
    '.katex',
    '.katex-display',
    '.katex-html',
    '.mjx-container',
    '.cursor-edit',
    '.cursor-text',
    'pre',
    'code',
    'kbd',
    'samp',
    'var',
    'math',
    'mjx-container',
    'textarea',
    'input',
    '[contenteditable="true"]',
    '[role="textbox"]',
    '[role="code"]',
    '[data-lexical-editor="true"]',
    '[data-language]',
    '[data-code]',
    '[data-line]',
    '[data-line-number]',
    '.codicon',
    '.google-symbols',
    '[class*="material-icons"]',
    '[class*="material-symbols"]',
    '[class*="lucide"]',
    '[data-project-glyph]',
    '[data-testid*="user-message"]',
    '[data-testid="user-message-content"]',
    '[data-testid*="assistant-message"]',
    '[data-testid*="model-response"]',
    '.prose',
    '.markdown-body',
    '[class*="markdown"]',
    '.thought-content',
    '.thinking-content',
    '.thought-box',
    '[class*="file-tree"]',
    '[class*="FileTree"]',
    '[class*="breadcrumb"]',
    '[class*="Breadcrumb"]',
    '[data-testid="model-selector-panel"]',
    '[data-testid="model-selector-trigger"]',
    '[data-testid="project-header"]',
    '[data-testid="breadcrumb-segment"]'
  ];

  // Pre-compile static selectors (excluding user-message special handling) into ONE closest() call
  var STATIC_IGNORE_SELECTORS = IGNORE_SELECTORS.filter(function (s) {
    return s !== '[data-testid*="user-message"]' && s !== '[data-testid="project-header"]';
  });
  var COMBINED_STATIC_IGNORE_SEL = STATIC_IGNORE_SELECTORS.join(', ');

  var SWARM_PROTECTED_CLASSES = [
    'msg-body', 'mention', 'msg-author', 'o2-mauth', 'chip-name', 'o2-wchip',
    'hv-nm', 'ov-who', 'o2-runt', 'o2-runsum', 'o2-runnote', 'o2-donem',
    'o2-mnow', 'o2-mrole', 'o2-rcap', 'o2-tvcap', 'o2-thg', 'o2-sttxt'
  ];

  var MENTION_CATEGORIES = new Set([
    'Rules', '规则', '規則',
    'Conversation', '对话', '對話',
    'PDF Document', 'PDF 文档', 'PDF 文件',
    'MCP Resource', 'MCP 资源', 'MCP 資源',
    'Browser Page', '浏览器页面', '瀏覽器頁面',
    'Browser Text', '浏览器文本', '瀏覽器文字',
    'Directory', '目录', '目錄',
    'Git Commit', 'Git 提交',
    'Git Diff', 'Git 差异', 'Git 差異'
  ]);

  var SYSTEM_SIDEBAR_DROP_IDS = new Set([
    'all', 'main-section-header', 'pinned', 'section-coordinator', 'standalone'
  ]);

  var SYSTEM_PROJECT_HEADER_LABELS = new Set([
    'this computer', '本机', '本機',
    'remote', '远程', '遠端',
    'blocked', '已阻止', '已封鎖',
    'in progress', '进行中', '進行中',
    'idle', '空闲', '閒置',
    'standalone', '独立', '獨立',
    'unknown project', '未知项目', '未知專案'
  ]);

  var CORE_WORDS_CN = {
    create: '创建', delete: '删除', new: '新建', edit: '编辑', save: '保存',
    cancel: '取消', confirm: '确认', copy: '复制', close: '关闭', open: '打开',
    stop: '停止', start: '启动', add: '添加', remove: '移除', update: '更新',
    select: '选择', clear: '清除', search: '搜索', find: '查找', view: '查看',
    show: '显示', hide: '隐藏', agent: '智能体', agents: '智能体',
    subagent: '子智能体', subagents: '子智能体', task: '任务', tasks: '任务',
    automation: '自动化', automations: '自动化', workspace: '工作区',
    workspaces: '工作区', project: '项目', projects: '项目', directory: '目录',
    folder: '文件夹', file: '文件', files: '文件', command: '命令', commands: '命令',
    palette: '面板', terminal: '终端', console: '控制台', output: '输出',
    input: '输入', remote: '远程', control: '控制', device: '设备', devices: '设备',
    link: '链接', log: '日志', logs: '日志', setting: '设置', settings: '设置',
    preference: '偏好', preferences: '偏好', permission: '权限', permissions: '权限',
    theme: '主题', themes: '主题', model: '模型', models: '模型',
    capability: '能力', capabilities: '能力', run: '运行', ran: '已运行',
    running: '运行中', completed: '已完成', failed: '已失败', pending: '等待中',
    success: '成功', error: '错误', system: '系统', prompt: '提示词',
    instructions: '指令', description: '描述', name: '名称', version: '版本',
    active: '活跃', background: '后台', parent: '父级', child: '子级',
    branch: '分支', share: '共享', inherit: '继承', original: '原始',
    backup: '备份', duration: '持续时间', seconds: '秒', timer: '定时器',
    timers: '定时器', schedule: '调度', cron: '定时任务', tools: '工具', tool: '工具',
    execute: '执行', execution: '执行', plan: '计划', policy: '策略', policies: '策略',
    never: '从不', always: '总是', changed: '已更改', review: '审核',
    reviewing: '审核中', reviewed: '已审核', canceled: '已取消', explore: '探索',
    change: '更改', changes: '更改', turn: '回合', turns: '回合',
    analyzed: '分析', analyzing: '分析', advanced: '高级', collapse: '折叠',
    expand: '展开', global: '全局', inherits: '继承', wsl: 'WSL',
    distro: '发行版', distros: '发行版'
  };

  var CORE_WORDS_TW = {
    create: '建立', delete: '刪除', new: '新增', edit: '編輯', save: '儲存',
    cancel: '取消', confirm: '確認', copy: '複製', close: '關閉', open: '開啟',
    stop: '停止', start: '啟動', add: '新增', remove: '移除', update: '更新',
    select: '選擇', clear: '清除', search: '搜尋', find: '尋找', view: '檢視',
    show: '顯示', hide: '隱藏', agent: '代理', agents: '代理',
    subagent: '子代理', subagents: '子代理', task: '任務', tasks: '任務',
    automation: '自動化', automations: '自動化', workspace: '工作區',
    workspaces: '工作區', project: '專案', projects: '專案', directory: '目錄',
    folder: '資料夾', file: '檔案', files: '檔案', command: '命令', commands: '命令',
    palette: '面板', terminal: '終端機', console: '主控台', output: '輸出',
    input: '輸入', remote: '遠端', control: '控制', device: '裝置', devices: '裝置',
    link: '連結', log: '記錄檔', logs: '記錄檔', setting: '設定', settings: '設定',
    preference: '偏好', preferences: '偏好', permission: '權限', permissions: '權限',
    theme: '佈景主題', themes: '佈景主題', model: '模型', models: '模型',
    capability: '能力', capabilities: '能力', run: '執行', ran: '已執行',
    running: '執行中', completed: '已完成', failed: '失敗', pending: '等待中',
    success: '成功', error: '錯誤', system: '系統', prompt: '提示詞',
    instructions: '指令', description: '描述', name: '名稱', version: '版本',
    active: '活躍', background: '背景', parent: '父級', child: '子級',
    branch: '分支', share: '共享', inherit: '繼承', original: '原始',
    backup: '備份', duration: '持續時間', seconds: '秒', timer: '計時器',
    timers: '計時器', schedule: '排程', cron: '排程任務', tools: '工具', tool: '工具',
    execute: '執行', execution: '執行', plan: '計畫', policy: '原則', policies: '原則',
    never: '從不', always: '一律', changed: '已變更', review: '檢閱',
    reviewing: '檢閱中', reviewed: '已檢閱', canceled: '已取消', explore: '探索',
    change: '變更', changes: '變更', turn: '回合', turns: '回合',
    analyzed: '分析', analyzing: '分析', advanced: '進階', collapse: '摺疊',
    expand: '展開', global: '全域', inherits: '繼承', wsl: 'WSL',
    distro: '發行版', distros: '發行版'
  };

  var VOICE_NAMES = new Set([
    'arlo', 'cleo', 'finn', 'fola', 'gero', 'lora', 'neno', 'olin', 'tari',
    'aoede', 'charon', 'fenrir', 'kore', 'leda', 'orus', 'puck', 'zephyr',
    'orbit', 'vale', 'pegasus', 'nova', 'dipper', 'ursa', 'vega', 'capella', 'sirius'
  ]);

  var SHORTCUT_SINGLE_KEY_RE = /^(?:Enter|Return|Esc|Escape|Tab|Space|Backspace|Delete|Del|Insert|Ins|Home|End|PageUp|PageDown|Up|Down|Left|Right|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Forward|Back|F(?:[1-9]|1\d|2[0-4])|[^\s])$/;
  var SHORTCUT_MOD_CHORD_RE = /^(?:(?:Ctrl|Cmd|Command|Control|Alt|Opt|Option|Shift|Meta|Super|Win|Fn)\+)+[^\s+]+$/i;
  var SHORTCUT_GLYPH_RE = /[⌘⌥⌃⇧⏎⌫⌦⇥⎋↑↓←→]/;

  function isLikelyShortcutKeys(rawKeys) {
    if (!rawKeys) return false;
    var normalized = rawKeys.trim().replace(/\s*\+\s*/g, '+');
    if (!normalized) return false;
    var tokens = normalized.split(/\s+/);
    if (tokens.length > 4) return false;
    return tokens.every(function (tok) {
      return SHORTCUT_GLYPH_RE.test(tok) || SHORTCUT_MOD_CHORD_RE.test(tok) || SHORTCUT_SINGLE_KEY_RE.test(tok);
    });
  }

  function formatShortcut(sc) {
    if (!sc) return '';
    return sc.split('+').map(function (part) {
      var lp = part.toLowerCase();
      if (lp === 'ctrl') return 'Ctrl';
      if (lp === 'cmd') return 'Cmd';
      if (lp === 'shift') return 'Shift';
      if (lp === 'alt' || lp === 'opt') return part.charAt(0).toUpperCase() + lp.slice(1);
      return part.toUpperCase();
    }).join('+');
  }

  function formatDurationLocalized(str, isTW) {
    var s = String(str).trim();
    if (isTW) {
      return s
        .replace(/^<\s*1\s*m(?:in(?:ute)?s?)?$/i, '不到 1 分鐘')
        .replace(/(\d+)\s*d(?:ays?)?\b/gi, '$1 天 ')
        .replace(/(\d+)\s*h(?:(?:ou)?rs?)?\b/gi, '$1 小時 ')
        .replace(/(\d+)\s*m(?:in(?:ute)?s?)?\b(?!\s*o)/gi, '$1 分鐘 ')
        .replace(/(\d+)\s*s(?:ec(?:ond)?s?)?\b/gi, '$1 秒 ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    return s
      .replace(/^<\s*1\s*m(?:in(?:ute)?s?)?$/i, '不到 1 分钟')
      .replace(/(\d+)\s*d(?:ays?)?\b/gi, '$1 天 ')
      .replace(/(\d+)\s*h(?:(?:ou)?rs?)?\b/gi, '$1 小时 ')
      .replace(/(\d+)\s*m(?:in(?:ute)?s?)?\b(?!\s*o)/gi, '$1 分钟 ')
      .replace(/(\d+)\s*s(?:ec(?:ond)?s?)?\b/gi, '$1 秒 ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function looksLikeCodeOrPath(text) {
    if (!text) return true;
    var s = text.trim();
    if (s.length < 2 || s.length > 1200) return true;
    // Pure numbers, punctuation, symbols
    if (/^[\d\s.,:%+\-*/()[\]{}<>=!@#$^&|~`'"\\|/?]+$/.test(s)) return true;
    // Windows drive paths, UNC paths, POSIX paths (without spaces), URLs
    if (/^(?:[A-Za-z]:\\|\\\\|https?:\/\/|file:\/\/|ui:\/\/|plugin:\/\/|icon:\/\/|vscode:\/\/)/.test(s)) return true;
    if (!/\s/.test(s) && /^(?:\/|~\/)/.test(s)) return true;
    if (!/\s/.test(s) && s.indexOf('/') !== -1 && /[a-zA-Z0-9_.-]+\/[a-zA-Z0-9._-]+/.test(s)) return true;
    if (!/\s/.test(s) && s.indexOf('\\') !== -1) return true;
    if (/^[\w.-]+\.(?:js|mjs|cjs|ts|tsx|jsx|json|py|go|rs|md|css|scss|html|yml|yaml|toml|asar|exe|dll|so|dylib|db|sqlite|vscdb|pb|sh|ps1|bat|cmd)$/i.test(s)) return true;
    // Code-like camelCase / snake_case / CLI flags
    if (/^[a-z]+[A-Z][a-zA-Z0-9]+$/.test(s)) return true;
    if (/^[a-z0-9_]+_[a-z0-9_]+$/.test(s)) return true;
    if (/^--?[a-zA-Z0-9-]+$/.test(s)) return true;
    return false;
  }

  function isSystemGroupProjectHeader(headerEl) {
    if (!headerEl || headerEl.nodeType !== 1 || !headerEl.getAttribute) return false;
    var hasExplicitDropId = false;
    var cur = headerEl;
    while (cur && (typeof document === 'undefined' || cur !== document.body)) {
      var dropId = cur.getAttribute && cur.getAttribute('data-sidebar-section-drop-id');
      if (dropId) {
        if (SYSTEM_SIDEBAR_DROP_IDS.has(dropId) || dropId.indexOf('status-') === 0 || dropId.indexOf('location-') === 0) {
          return true;
        }
        hasExplicitDropId = true;
        break;
      }
      cur = cur.parentElement;
    }
    var rawLabel = (headerEl.getAttribute('data-project-label') || headerEl.innerText || headerEl.textContent || '').trim().toLowerCase();
    if (rawLabel === 'unknown project' || rawLabel === '未知项目' || rawLabel === '未知專案') return true;
    if (!hasExplicitDropId && headerEl.getAttribute('data-project-icon') === 'custom' && SYSTEM_PROJECT_HEADER_LABELS.has(rawLabel)) {
      return true;
    }
    return false;
  }

  function isSwarmProtectedElement(el) {
    if (!el || !el.classList) return false;
    for (var i = 0; i < SWARM_PROTECTED_CLASSES.length; i++) {
      if (el.classList.contains(SWARM_PROTECTED_CLASSES[i])) return true;
    }
    var tag = (el.tagName || '').toUpperCase();
    if ((tag === 'B' || tag === 'P') && el.parentElement && el.parentElement.classList && el.parentElement.classList.contains('o2-goal')) {
      return true;
    }
    return false;
  }

  function shouldIgnoreElement(el) {
    if (!el || el.nodeType !== 1) return false;
    var tag = (el.tagName || '').toUpperCase();
    if (
      tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' ||
      tag === 'SVG' || tag === 'PATH' || tag === 'CANVAS' ||
      tag === 'PRE' || tag === 'CODE' ||
      tag === 'KBD' || tag === 'SAMP' || tag === 'VAR' ||
      tag === 'MATH' || tag === 'MJX-CONTAINER' ||
      tag === 'IFRAME' || tag === 'VIDEO' || tag === 'AUDIO'
    ) {
      return true;
    }
    if (el.isContentEditable) return true;
    if (el.getAttribute) {
      var ce = el.getAttribute('contenteditable');
      var role = el.getAttribute('role');
      if (ce === 'true' || role === 'textbox' || role === 'code' || el.getAttribute('data-lexical-editor') === 'true') {
        return true;
      }
    }

    if (typeof el.closest === 'function') {
      var isThinkingBtn = el.closest('button[data-testid="thinking-collapsible-trigger"]');
      if (el.closest('[data-testid="user-message-content"]')) return true;

      if (COMBINED_STATIC_IGNORE_SEL && el.closest(COMBINED_STATIC_IGNORE_SEL)) return true;

      var um = el.closest('[data-testid*="user-message"]');
      if (um && !el.closest('[data-testid="queued-decorators"], [data-testid="user-message-actions"]')) {
        return true;
      }

      // Fast pointer-only ancestor walk (zero querySelector calls)
      var cur = el;
      var hops = 0;
      while (cur && hops < 16 && (typeof document === 'undefined' || cur !== document.body)) {
        if (!isThinkingBtn && cur.previousElementSibling &&
            cur.previousElementSibling.getAttribute &&
            cur.previousElementSibling.getAttribute('data-testid') === 'thinking-collapsible-trigger') {
          return true;
        }
        if (isSwarmProtectedElement(cur)) return true;
        cur = cur.parentElement;
        hops++;
      }

      // Protect user project headers while allowing system group headers
      var projHeader = el.closest('[data-testid="project-header"], button[data-project-card="true"]');
      if (projHeader && !isSystemGroupProjectHeader(projHeader)) {
        return true;
      }

      // Protect slash/mention option item names while translating category headers
      var menuOpt = el.closest('[data-testid="menu-option-label"]');
      if (menuOpt) {
        var optTxt = (menuOpt.textContent || '').trim();
        if (!MENTION_CATEGORIES.has(optTxt)) return true;
      }
    }

    return false;
  }

  function createTranslatorEngine(payload) {
    var exactMap = new Map();
    var lowerMap = new Map();
    var regexRules = [];
    var lang = 'en';
    var brandTitleMode = 'english';
    var stringCache = new Map();
    var MAX_CACHE = 8000;

    function cacheSet(k, v) {
      if (stringCache.has(k)) {
        stringCache.delete(k);
      } else if (stringCache.size >= MAX_CACHE) {
        var firstKey = stringCache.keys().next().value;
        if (firstKey !== undefined) stringCache.delete(firstKey);
      }
      stringCache.set(k, v);
    }

    function replaceTrimmed(raw, trimmed, fixed) {
      if (raw === trimmed) return fixed;
      var idx = raw.indexOf(trimmed);
      if (idx === -1) return fixed;
      return raw.slice(0, idx) + fixed + raw.slice(idx + trimmed.length);
    }

    function load(nextPayload) {
      exactMap.clear();
      lowerMap.clear();
      regexRules = [];
      stringCache.clear();

      lang = (nextPayload && nextPayload.language) || 'en';
      brandTitleMode = (nextPayload && nextPayload.brandTitle) || 'english';
      if (lang === 'en') return;

      var exact = (nextPayload && nextPayload.exact) || {};
      var keys = Object.keys(exact);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var v = exact[k];
        if (typeof v !== 'string') continue;
        exactMap.set(k, v);
        var lk = k.toLowerCase();
        if (!lowerMap.has(lk)) {
          lowerMap.set(lk, v);
        }
      }

      var regs = (nextPayload && nextPayload.regex) || [];
      for (var j = 0; j < regs.length; j++) {
        try {
          regexRules.push({
            re: new RegExp(regs[j].pattern, regs[j].flags || ''),
            replace: regs[j].replace
          });
        } catch (_e) {}
      }
    }

    function translateComplexDynamic(trimmed, isTW) {
      // 1. Shortcut labels: Add shortcut / Remove shortcut / Shortcut [keys] for <action>
      var shortcutMatch = trimmed.match(/^(Add shortcut|Remove shortcut|Shortcut)(?:\s+(?!for(?:\s|$))(.{1,45}?))?\s+for\s+(.{1,140})$/);
      if (shortcutMatch) {
        var op = shortcutMatch[1];
        var keys = shortcutMatch[2];
        var actionTrimmed = shortcutMatch[3].trim();
        var validKeys = !keys || isLikelyShortcutKeys(keys);
        if (validKeys && actionTrimmed && !/(?:^|[^.])\.$|[?!]$/.test(actionTrimmed)) {
          var opMap = isTW
            ? { 'Add shortcut': '新增快捷鍵', 'Remove shortcut': '移除快捷鍵', Shortcut: '快捷鍵' }
            : { 'Add shortcut': '添加快捷键', 'Remove shortcut': '移除快捷键', Shortcut: '快捷键' };
          var keyPart = keys ? (' ' + keys.trim()) : '';
          var actTrans = translateCore(actionTrimmed) || actionTrimmed;
          return opMap[op] + keyPart + '（' + actTrans + '）';
        }
      }

      // 2. Quota resets with multi-unit duration formatting
      var resetComma = trimmed.match(/^(.+?),\s*resets?\s+in\s+(.+)$/i);
      if (resetComma) {
        var lbl = resetComma[1].trim().toLowerCase();
        var lblMap = isTW
          ? { 'weekly limit': '每週限額', 'daily limit': '每日限額', 'hourly limit': '每小時限額', 'monthly limit': '每月限額', '5-hour limit': '5 小時限額', 'five-hour limit': '5 小時限額', 'five hour limit': '5 小時限額' }
          : { 'weekly limit': '每周限额', 'daily limit': '每日限额', 'hourly limit': '每小时限额', 'monthly limit': '每月限额', '5-hour limit': '5 小时限额', 'five-hour limit': '5 小时限额', 'five hour limit': '5 小时限额' };
        var lblOut = lblMap[lbl] || translateCore(resetComma[1].trim()) || resetComma[1].trim();
        return lblOut + '，' + formatDurationLocalized(resetComma[2], isTW) + (isTW ? '後重設' : '后重置');
      }

      var resetOnly = trimmed.match(/^Resets?\s+in\s+(.+)$/i);
      if (resetOnly) {
        return (isTW ? '距離重設還剩 ' : '距离重置还剩 ') + formatDurationLocalized(resetOnly[1], isTW);
      }

      // 3. Voice selection whitelist ("Use Kore", "Use Nova", etc.)
      if (/^Use\s+([A-Za-z0-9_-]+)$/i.test(trimmed)) {
        var vc = trimmed.replace(/^Use\s+/i, '');
        if (VOICE_NAMES.has(vc.toLowerCase())) {
          return '使用 ' + vc;
        }
      }

      // 4. Quote / Ask /btw floating selection pills
      if (/^Quote(?:\s+((?:Ctrl|Cmd)(?:\+[a-zA-Z0-9]+)+))?$/i.test(trimmed)) {
        return trimmed.replace(/^Quote(?:\s+((?:Ctrl|Cmd)(?:\+[a-zA-Z0-9]+)+))?$/i, function (_m, sc) {
          return sc ? ('引用 ' + formatShortcut(sc)) : '引用';
        });
      }
      if (/^Ask(?:\s+|\s*\/\s*)btw(?:\s+((?:Ctrl|Cmd)(?:\+[a-zA-Z0-9]+)+))?$/i.test(trimmed)) {
        return trimmed.replace(/^Ask(?:\s+|\s*\/\s*)btw(?:\s+((?:Ctrl|Cmd)(?:\+[a-zA-Z0-9]+)+))?$/i, function (_m, sc) {
          return sc ? ((isTW ? '透過 /btw 提問 ' : '通过 /btw 提问 ') + formatShortcut(sc)) : (isTW ? '透過 /btw 提問' : '通过 /btw 提问');
        });
      }

      // 5. Send / Queue tooltip with shortcut glyph
      var sendTooltipMatch = trimmed.match(/^(Send Message|Queue Message|Send Immediately)\s+(\(?(?:(?:Ctrl|Cmd|Alt|Shift|Option|Meta)\+)*Enter\)?|\(?[⌘⌥⌃⇧]*[⏎↵]\)?)$/i);
      if (sendTooltipMatch) {
        var sendMap = isTW
          ? { 'send message': '傳送訊息', 'queue message': '排隊傳送訊息', 'send immediately': '立即傳送' }
          : { 'send message': '发送消息', 'queue message': '排队发送消息', 'send immediately': '立即发送' };
        return sendMap[sendTooltipMatch[1].toLowerCase()] + ' ' + sendTooltipMatch[2];
      }

      // 6. Model tier · context ("Low · 200K")
      if (/^(Low|Medium|High|Extra\s+High|Extra|Max)\s*·\s*(.+)$/i.test(trimmed)) {
        return trimmed.replace(/^(Low|Medium|High|Extra\s+High|Extra|Max)\s*·\s*(.+)$/i, function (_m, tier, ctx) {
          var tierMap = isTW
            ? { low: '低', medium: '中', high: '高', xhigh: '極高', 'extra high': '極高', extra: '極高', max: '最高' }
            : { low: '低', medium: '中', high: '高', xhigh: '极高', 'extra high': '极高', extra: '极高', max: '最高' };
          return (tierMap[tier.trim().toLowerCase()] || tier) + ' · ' + ctx;
        });
      }

      // 7. Voice call mute/unmute & speed
      if (/^Voice speed, (.+)$/.test(trimmed)) {
        return (isTW ? '語速，' : '语速，') + trimmed.replace(/^Voice speed, /, '');
      }
      var muteMatch = trimmed.match(/^(Unmute|Mute) (mic|Antigravity|Jetski) \(([^)]+)\)$/);
      if (muteMatch) {
        var tgt = muteMatch[2] === 'mic' ? (isTW ? '麥克風' : '麦克风') : muteMatch[2];
        var act = muteMatch[1] === 'Mute' ? (isTW ? '靜音' : '静音') : (isTW ? '取消靜音' : '取消静音');
        return act + (muteMatch[2] === 'mic' ? '' : ' ') + tgt + ' (' + muteMatch[3] + ')';
      }

      // 8. Shortcut conflict hints
      if (/^Conflicts with "/i.test(trimmed)) {
        var parts = trimmed.split(/;\s*/);
        return parts.map(function (part) {
          if (/^Conflicts with "(.+)" \(press Enter to replace\)$/i.test(part)) {
            return part.replace(/^Conflicts with "(.+)" \(press Enter to replace\)$/i, isTW ? '與「$1」衝突（按 Enter 取代）' : '与“$1”冲突（按 Enter 替换）');
          }
          if (/^Conflicts with "(.+)" \(managed by application menu\)$/i.test(part)) {
            return part.replace(/^Conflicts with "(.+)" \(managed by application menu\)$/i, isTW ? '與「$1」衝突（由應用程式選單管理）' : '与“$1”冲突（由应用程序菜单管理）');
          }
          if (/^Conflicts with "(.+)"$/i.test(part)) {
            return part.replace(/^Conflicts with "(.+)"$/i, isTW ? '與「$1」衝突' : '与“$1”冲突');
          }
          return part;
        }).join('；');
      }

      // 9. Install / Uninstall <= 3 words safe target
      if (/^(Install|Uninstall)\s+(.+)$/i.test(trimmed)) {
        var verb = /^Uninstall/i.test(trimmed) ? (isTW ? '解除安裝 ' : '卸载 ') : (isTW ? '安裝 ' : '安装 ');
        var target = trimmed.replace(/^(?:Install|Uninstall)\s+/i, '').trim();
        var tWords = target.split(/\s+/);
        if (tWords.length <= 3 && !/\b(?:or|and|to|in|from|with|for|into|on|by)\b/i.test(target) && !/[.!?]$/.test(target)) {
          return verb + (translateCore(target) || target);
        }
      }

      // 10. Permission scope "<Project> setting"
      if (/^(.{1,60}) setting$/.test(trimmed)) {
        var scopeKey = trimmed.slice(0, -8).trim();
        var scopeCommon = /^(?:proxy|system|display|environment|network|keyboard|editor|terminal|audio|video|browser|privacy|appearance|notification|account|billing|search|default|project|security|session|cookie|user|local|global|custom|theme|font|language|timezone|timeout|color|tab|spacing|indent|scale|cursor|permissions?|this|that|your|my|our|their|his|her|its|the|an?|some|any|each|every|one|same|other|new|old|current|previous|next|first|last)s?$/i;
        if (scopeKey === 'Your This Computer') return isTW ? '沿用你在「本機」的設定' : '沿用你在「本机」的设置';
        if (scopeKey === 'Your Remote') return isTW ? '沿用你在「遠端」的設定' : '沿用你在「远程」的设置';
        if (scopeKey && !scopeCommon.test(scopeKey)) {
          var isSingle = !/\s/.test(scopeKey);
          var isSlug = isSingle && (/^[A-Z]/.test(scopeKey) || /[-_.\d]/.test(scopeKey));
          if (isSlug) {
            return isTW ? ('沿用「' + scopeKey + '」的設定') : ('沿用「' + scopeKey + '」的设置');
          }
        }
      }

      return null;
    }

    function translateCore(trimmed) {
      if (!trimmed || !/[a-zA-Z]/.test(trimmed) || looksLikeCodeOrPath(trimmed)) return null;

      if (stringCache.has(trimmed)) {
        return stringCache.get(trimmed);
      }

      var isTW = lang === 'zh-TW';
      if (trimmed === 'NEW') {
        cacheSet(trimmed, '新');
        return '新';
      }
      if (trimmed === 'End') {
        var endLabel = isTW ? '結束' : '结束';
        cacheSet(trimmed, endLabel);
        return endLabel;
      }

      // 1. Exact lookup
      if (exactMap.has(trimmed)) {
        var hit = exactMap.get(trimmed);
        cacheSet(trimmed, hit);
        return hit;
      }
      var normSpace = trimmed.replace(/\s+/g, ' ');
      if (normSpace !== trimmed && exactMap.has(normSpace)) {
        var normHit = exactMap.get(normSpace);
        cacheSet(trimmed, normHit);
        return normHit;
      }

      // 2. Complex dynamic rules (quota resets, shortcuts, voice, conflicts, etc. before unanchored regexes)
      var dynHit = translateComplexDynamic(trimmed, isTW);
      if (dynHit !== null) {
        cacheSet(trimmed, dynHit);
        return dynHit;
      }

      // 3. Regex rules from dictionary payload
      for (var i = 0; i < regexRules.length; i++) {
        var r = regexRules[i];
        if (r.re.test(trimmed)) {
          var res = trimmed.replace(r.re, r.replace);
          if (r.re.global) r.re.lastIndex = 0;
          cacheSet(trimmed, res);
          return res;
        }
      }

      // 4. Case-insensitive exact match (skip ambiguous lowercase single word 'end')
      if (trimmed.toLowerCase() !== 'end') {
        var ciHit = lowerMap.get(trimmed.toLowerCase());
        if (ciHit !== undefined) {
          cacheSet(trimmed, ciHit);
          return ciHit;
        }
      }

      // 5. Trailing punctuation strip + retry
      var core = trimmed;
      var trailPunc = '';
      var puncMatch = core.match(/(\.\.\.|…|\.|\?|!|:|：|？|！|。)$/);
      if (puncMatch) {
        var mp = puncMatch[0];
        core = core.slice(0, -mp.length).trim();
        if (mp === '.') trailPunc = '。';
        else if (mp === '?') trailPunc = '？';
        else if (mp === '!') trailPunc = '！';
        else if (mp === ':') trailPunc = '：';
        else trailPunc = mp;
      }

      if (core) {
        var coreTrans = exactMap.has(core) ? exactMap.get(core) : (core.toLowerCase() !== 'end' ? lowerMap.get(core.toLowerCase()) : undefined);
        if (coreTrans !== undefined && coreTrans !== '') {
          var combined = coreTrans + trailPunc;
          cacheSet(trimmed, combined);
          return combined;
        }
      }

      // 6. Strict <= 3 words coreWords fallback (100% known English words only)
      if (!core || /[\u4e00-\u9fa5]/.test(core) || /[-_\\/.]/.test(core)) {
        cacheSet(trimmed, null);
        return null;
      }
      var words = core.split(/\s+/).filter(Boolean);
      if (words.length === 0 || words.length > 3) {
        cacheSet(trimmed, null);
        return null;
      }

      var cw = isTW ? CORE_WORDS_TW : CORE_WORDS_CN;
      var outTokens = [];
      var replacedAny = false;
      for (var w = 0; w < words.length; w++) {
        var tok = words[w];
        if (!/^[a-zA-Z]+$/.test(tok)) {
          cacheSet(trimmed, null);
          return null;
        }
        var lw = tok.toLowerCase();
        if (lw === 'end') {
          cacheSet(trimmed, null);
          return null;
        }
        var wCn = Object.prototype.hasOwnProperty.call(cw, lw)
          ? cw[lw]
          : (exactMap.has(tok) ? exactMap.get(tok) : lowerMap.get(lw));
        if (wCn === undefined) {
          cacheSet(trimmed, null);
          return null;
        }
        if (wCn !== tok) replacedAny = true;
        outTokens.push(wCn);
      }
      if (!replacedAny) {
        cacheSet(trimmed, null);
        return null;
      }

      var finalWords = outTokens.join(' ').replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, '$1$2') + trailPunc;
      cacheSet(trimmed, finalWords);
      return finalWords;
    }

    function translateText(raw) {
      if (!raw || typeof raw !== 'string' || lang === 'en') return raw;
      var trimmed = raw.trim();
      if (!trimmed || !/[a-zA-Z]/.test(trimmed) || looksLikeCodeOrPath(trimmed)) return raw;
      var out = translateCore(trimmed);
      if (out === null || out === trimmed) return raw;
      return replaceTrimmed(raw, trimmed, out);
    }

    load(payload);

    return {
      getLanguage: function () { return lang; },
      getBrandTitleMode: function () { return brandTitleMode; },
      load: load,
      translateText: translateText,
      isEnabled: function () { return lang !== 'en'; }
    };
  }

  function initPreloadI18n(initialPayload) {
    if (typeof document === 'undefined') return null;
    var engine = createTranslatorEngine(initialPayload || { language: 'en', exact: {}, regex: [] });
    var observer = null;
    var isApplying = false;
    var observedRoots = new WeakSet();
    var trackedShadowRoots = [];
    var pendingAddedNodes = new Set();
    var pendingTextNodes = new Set();
    var pendingAttrNodes = new Map();
    var batchScheduled = false;
    var currentEpoch = 1;

    function isNewBadgeTextNode(node) {
      var parent = node && node.parentElement;
      if (!parent || typeof parent.closest !== 'function') return false;
      if (parent.closest('[data-testid="sidecar-new-button"]')) return false;
      var badgeEl = parent.closest('.rounded-full, .bg-secondary.rounded');
      if (!badgeEl) return false;
      var role = badgeEl.getAttribute ? badgeEl.getAttribute('role') : null;
      if ((badgeEl.tagName || '').toUpperCase() === 'BUTTON' || role === 'button') return false;
      return true;
    }

    function handleBrandTitleNode(node, parent) {
      if (!parent || !parent.tagName || typeof parent.closest !== 'function') return false;
      var tag = parent.tagName.toUpperCase();
      if (tag === 'CODE' || tag === 'PRE' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SCRIPT' || tag === 'STYLE') return false;
      if (parent.closest('p, pre, code, blockquote, [class*="message"], [class*="chat"], [class*="markdown"], [class*="artifact"]')) return false;

      var isBrandContainer = Boolean(
        (parent.getAttribute && (parent.getAttribute('data-agy-brand-item') === 'true' || parent.getAttribute('data-testid') === 'title-menu-bar-item')) ||
        parent.closest('[data-agy-brand-item="true"], [data-testid="title-menu-bar-item"], .titlebar, [class*="titlebar"], [style*="-webkit-app-region: drag"], [style*="-webkit-app-region:drag"]')
      );
      if (!isBrandContainer) return false;

      var mode = engine.getBrandTitleMode();
      var origStored = originalTexts ? originalTexts.get(node) : undefined;
      var cur = node.nodeValue || '';
      var trimmed = (origStored !== undefined ? origStored : cur).trim();
      if (trimmed !== 'Antigravity' && trimmed !== 'Google Antigravity') return false;

      if (originalTexts && !originalTexts.has(node)) {
        originalTexts.set(node, cur);
      }
      var target = trimmed;
      if (mode === 'hidden') {
        target = '';
      } else if (mode === 'translated') {
        target = trimmed === 'Google Antigravity' ? 'Google 反重力' : '反重力';
      }
      var lead = (origStored !== undefined ? origStored : cur).match(/^\s*/)[0];
      var trail = (origStored !== undefined ? origStored : cur).match(/\s*$/)[0];
      var nextVal = target === '' ? '' : (lead + target + trail);
      if (cur !== nextVal) {
        node.nodeValue = nextVal;
      }
      if (lastTranslatedTexts) lastTranslatedTexts.set(node, { val: nextVal, epoch: currentEpoch });
      if (parent.setAttribute) {
        try { parent.setAttribute('data-agy-brand-item', 'true'); } catch (_e) {}
      }
      return true;
    }

    function restoreTextNode(node) {
      if (!originalTexts || !originalTexts.has(node)) return;
      var orig = originalTexts.get(node);
      if (node.nodeValue !== orig) {
        node.nodeValue = orig;
      }
      if (lastTranslatedTexts) lastTranslatedTexts.delete(node);
    }

    function processTextNode(node) {
      if (!node || node.nodeType !== 3) return;
      var parent = node.parentElement;
      if (shouldIgnoreElement(parent)) return;

      if (handleBrandTitleNode(node, parent)) return;

      if (!engine.isEnabled()) {
        restoreTextNode(node);
        return;
      }

      var cur = node.nodeValue || '';
      var lastEntry = lastTranslatedTexts ? lastTranslatedTexts.get(node) : null;
      if (lastEntry && lastEntry.epoch === currentEpoch && lastEntry.val === cur) {
        return;
      }

      // If React changed the underlying text, update originalTexts to the new source
      var sourceText = cur;
      if (originalTexts && originalTexts.has(node)) {
        if (lastEntry && lastEntry.val === cur) {
          sourceText = originalTexts.get(node);
        } else {
          originalTexts.set(node, cur);
        }
      }

      var trimmed = sourceText.trim();
      var nextText;
      if (trimmed === 'New' && isNewBadgeTextNode(node)) {
        var idx = sourceText.indexOf('New');
        nextText = sourceText.slice(0, idx) + '新' + sourceText.slice(idx + 3);
      } else {
        nextText = engine.translateText(sourceText);
      }

      if (nextText !== sourceText) {
        if (originalTexts && !originalTexts.has(node)) {
          originalTexts.set(node, sourceText);
        }
        if (node.nodeValue !== nextText) {
          node.nodeValue = nextText;
        }
        if (lastTranslatedTexts) lastTranslatedTexts.set(node, { val: nextText, epoch: currentEpoch });
      } else {
        // Restore original text if a new language/dict no longer translates it
        if (cur !== sourceText) {
          node.nodeValue = sourceText;
        }
        if (lastTranslatedTexts) lastTranslatedTexts.set(node, { val: sourceText, epoch: currentEpoch });
      }
    }

    function restoreAttributes(el) {
      if (!originalAttrs || !originalAttrs.has(el)) return;
      var saved = originalAttrs.get(el);
      var keys = Object.keys(saved);
      for (var i = 0; i < keys.length; i++) {
        var attr = keys[i];
        var cur = el.getAttribute(attr);
        if (cur !== saved[attr]) {
          el.setAttribute(attr, saved[attr]);
        }
      }
      if (lastTranslatedAttrs) lastTranslatedAttrs.delete(el);
    }

    function processAttributes(el, attrSubset) {
      if (!el || el.nodeType !== 1) return;
      var upperTag = (el.tagName || '').toUpperCase();
      var isInputLike = upperTag === 'INPUT' || upperTag === 'TEXTAREA';
      if (isInputLike) {
        if (el.parentElement && shouldIgnoreElement(el.parentElement)) return;
      } else if (shouldIgnoreElement(el)) {
        return;
      }

      if (!engine.isEnabled()) {
        restoreAttributes(el);
        return;
      }

      var attrs = attrSubset || TRANSLATABLE_ATTRS;
      for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        if (attr === 'value' && isInputLike) continue;
        if (!el.hasAttribute || !el.hasAttribute(attr)) continue;
        var val = el.getAttribute(attr);
        if (!val) continue;

        var lastMap = lastTranslatedAttrs ? lastTranslatedAttrs.get(el) : null;
        var lastAttrEntry = lastMap ? lastMap[attr] : null;
        if (lastAttrEntry && lastAttrEntry.epoch === currentEpoch && lastAttrEntry.val === val) continue;

        var saved = originalAttrs ? originalAttrs.get(el) : null;
        var srcVal = val;
        if (saved && saved[attr] !== undefined) {
          if (lastAttrEntry && lastAttrEntry.val === val) {
            srcVal = saved[attr];
          } else {
            saved[attr] = val;
          }
        }

        var nextVal = engine.translateText(srcVal);
        if (nextVal !== srcVal) {
          if (originalAttrs) {
            var map = saved || {};
            if (map[attr] === undefined) map[attr] = srcVal;
            originalAttrs.set(el, map);
          }
          if (val !== nextVal) el.setAttribute(attr, nextVal);
          if (lastTranslatedAttrs) {
            var lmap = lastMap || {};
            lmap[attr] = { val: nextVal, epoch: currentEpoch };
            lastTranslatedAttrs.set(el, lmap);
          }
        } else {
          if (val !== srcVal) el.setAttribute(attr, srcVal);
          if (lastTranslatedAttrs) {
            var lmap2 = lastMap || {};
            lmap2[attr] = { val: srcVal, epoch: currentEpoch };
            lastTranslatedAttrs.set(el, lmap2);
          }
        }
      }
    }

    function tryHealFragmentedText(el) {
      if (!engine.isEnabled() || !el || el.nodeType !== 1) return false;
      var first = el.firstChild;
      if (!first || !first.nextSibling) return false;

      var allText = true;
      var cur = first;
      while (cur) {
        if (cur.nodeType !== 3) {
          allText = false;
          break;
        }
        cur = cur.nextSibling;
      }
      if (allText) {
        var combined = el.textContent;
        if (!combined || !/[a-zA-Z]/.test(combined)) return false;
        var combinedTrans = engine.translateText(combined);
        if (combinedTrans && combinedTrans !== combined) {
          var c = first;
          while (c) {
            if (originalTexts && !originalTexts.has(c)) {
              originalTexts.set(c, c.nodeValue || '');
            }
            c = c.nextSibling;
          }
          first.nodeValue = combinedTrans;
          if (lastTranslatedTexts) lastTranslatedTexts.set(first, { val: combinedTrans, epoch: currentEpoch });
          var other = first.nextSibling;
          while (other) {
            other.nodeValue = '';
            if (lastTranslatedTexts) lastTranslatedTexts.set(other, { val: '', epoch: currentEpoch });
            other = other.nextSibling;
          }
          return true;
        }
      }
      return false;
    }

    function walkAndTranslate(rootEl) {
      if (!rootEl) return;
      if (rootEl.nodeType === 3) {
        processTextNode(rootEl);
        return;
      }
      if (rootEl.nodeType !== 1 && rootEl.nodeType !== 11 /* DOCUMENT_FRAGMENT_NODE */) return;

      if (rootEl.nodeType === 1) {
        var upperTag = (rootEl.tagName || '').toUpperCase();
        if (upperTag === 'INPUT' || upperTag === 'TEXTAREA') {
          processAttributes(rootEl);
          return;
        }
        if (shouldIgnoreElement(rootEl)) return;
        processAttributes(rootEl);
        if (rootEl.shadowRoot) {
          observeRoot(rootEl.shadowRoot);
          walkAndTranslate(rootEl.shadowRoot);
        }
        if (tryHealFragmentedText(rootEl)) return;
      }

      var walker = document.createTreeWalker(rootEl, 5 /* SHOW_ELEMENT | SHOW_TEXT */, {
        acceptNode: function (node) {
          if (node.nodeType === 1) {
            var nt = (node.tagName || '').toUpperCase();
            if (nt === 'INPUT' || nt === 'TEXTAREA') return 1 /* FILTER_ACCEPT */;
            if (shouldIgnoreElement(node)) return 2 /* FILTER_REJECT (skips whole subtree!) */;
          }
          return 1;
        }
      });
      var current = walker.nextNode();
      while (current) {
        if (current.nodeType === 1) {
          var cTag = (current.tagName || '').toUpperCase();
          if (cTag === 'INPUT' || cTag === 'TEXTAREA') {
            processAttributes(current);
          } else {
            processAttributes(current);
            if (current.shadowRoot) {
              observeRoot(current.shadowRoot);
              walkAndTranslate(current.shadowRoot);
            }
            tryHealFragmentedText(current);
          }
        } else if (current.nodeType === 3) {
          processTextNode(current);
        }
        current = walker.nextNode();
      }
    }

    function runWithoutObserver(fn) {
      if (isApplying) return;
      isApplying = true;
      if (observer) observer.disconnect();
      try {
        fn();
      } catch (_e) {
      } finally {
        isApplying = false;
        reconnectAllRoots();
      }
    }

    function flushPendingBatch() {
      batchScheduled = false;
      if (isApplying || !engine.isEnabled()) {
        pendingAddedNodes.clear();
        pendingTextNodes.clear();
        pendingAttrNodes.clear();
        return;
      }
      runWithoutObserver(function () {
        if (pendingAttrNodes.size > 0) {
          pendingAttrNodes.forEach(function (attrSet, target) {
            processAttributes(target, Array.from(attrSet));
          });
          pendingAttrNodes.clear();
        }
        if (pendingTextNodes.size > 0) {
          pendingTextNodes.forEach(function (tNode) {
            processTextNode(tNode);
          });
          pendingTextNodes.clear();
        }
        if (pendingAddedNodes.size > 0) {
          var roots = [];
          pendingAddedNodes.forEach(function (node) {
            var hasAnc = false;
            var p = node.parentElement;
            while (p) {
              if (pendingAddedNodes.has(p)) {
                hasAnc = true;
                break;
              }
              p = p.parentElement;
            }
            if (!hasAnc) roots.push(node);
          });
          pendingAddedNodes.clear();
          for (var i = 0; i < roots.length; i++) {
            walkAndTranslate(roots[i]);
          }
        }
      });
    }

    function scheduleBatch() {
      if (batchScheduled) return;
      batchScheduled = true;
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(flushPendingBatch);
      } else {
        setTimeout(flushPendingBatch, 16);
      }
    }

    function ensureObserver() {
      if (!observer && typeof MutationObserver === 'function') {
        observer = new MutationObserver(function (mutations) {
          if (isApplying || !engine.isEnabled()) return;
          var any = false;
          for (var i = 0; i < mutations.length; i++) {
            var m = mutations[i];
            if (m.type === 'childList') {
              for (var j = 0; j < m.addedNodes.length; j++) {
                var added = m.addedNodes[j];
                if (added.shadowRoot) observeRoot(added.shadowRoot);
                pendingAddedNodes.add(added);
                any = true;
              }
            } else if (m.type === 'characterData') {
              pendingTextNodes.add(m.target);
              any = true;
            } else if (m.type === 'attributes') {
              var set = pendingAttrNodes.get(m.target);
              if (!set) {
                set = new Set();
                pendingAttrNodes.set(m.target, set);
              }
              set.add(m.attributeName);
              any = true;
            }
          }
          if (any) scheduleBatch();
        });
      }
    }

    var obsOpts = {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRS
    };

    function observeRoot(root) {
      if (!root) return;
      ensureObserver();
      if (!observer) return;
      if (!observedRoots.has(root)) {
        observedRoots.add(root);
        if (root !== document.body && typeof WeakRef === 'function') {
          trackedShadowRoots.push(new WeakRef(root));
        }
      }
      try {
        observer.observe(root, obsOpts);
      } catch (_e) {}
    }

    function reconnectAllRoots() {
      if (document.body) observeRoot(document.body);
      var kept = [];
      for (var i = 0; i < trackedShadowRoots.length; i++) {
        var sr = trackedShadowRoots[i].deref();
        if (sr && sr.isConnected !== false) {
          kept.push(trackedShadowRoots[i]);
          try { observer.observe(sr, obsOpts); } catch (_e) {}
        }
      }
      trackedShadowRoots = kept;
    }

    // Shadow DOM hook
    if (typeof Element !== 'undefined' && Element.prototype && Element.prototype.attachShadow && !Element.prototype.attachShadow.__agStudioPatched) {
      var origAttachShadow = Element.prototype.attachShadow;
      var patchedAttach = function () {
        var sr = origAttachShadow.apply(this, arguments);
        observeRoot(sr);
        return sr;
      };
      patchedAttach.__agStudioPatched = true;
      Element.prototype.attachShadow = patchedAttach;
    }

    function runFullScan() {
      runWithoutObserver(function () {
        if (document.body) walkAndTranslate(document.body);
        for (var i = 0; i < trackedShadowRoots.length; i++) {
          var sr = trackedShadowRoots[i].deref();
          if (sr) walkAndTranslate(sr);
        }
      });
    }

    function applyPayload(nextPayload) {
      currentEpoch++;
      engine.load(nextPayload);
      runFullScan();
    }

    // Hover Tooltip / Radix Portal / Floating UI / ContextMenu scanner
    function isFloatingElement(el) {
      if (!el || el.nodeType !== 1) return false;
      if (el === document.body || el === document.documentElement || el.id === 'workbench') return false;
      var cls = typeof el.className === 'string' ? el.className : '';
      if (cls.indexOf('monaco-workbench') !== -1) return false;
      if (el.matches) {
        try {
          if (el.matches('[role="tooltip"], [role="menu"], [role="dialog"], [data-floating-ui-portal], [data-radix-popper-content-wrapper], .popover, .tooltip, .context-view, .monaco-hover')) {
            return true;
          }
        } catch (_e) {}
      }
      var role = el.getAttribute ? el.getAttribute('role') : '';
      if (role === 'tooltip' || role === 'menu' || role === 'dialog') return true;
      if (el.hasAttribute && (el.hasAttribute('data-floating-ui-portal') || el.hasAttribute('data-radix-popper-content-wrapper'))) return true;
      return cls.indexOf('popover') !== -1 || cls.indexOf('tooltip') !== -1 || cls.indexOf('context-view') !== -1 || cls.indexOf('monaco-hover') !== -1;
    }

    function scanFloatingContainers() {
      if (!document.body || !engine.isEnabled()) return;
      runWithoutObserver(function () {
        var last = document.body.lastElementChild;
        if (last && isFloatingElement(last)) walkAndTranslate(last);
        if (last && last.previousElementSibling && isFloatingElement(last.previousElementSibling)) {
          walkAndTranslate(last.previousElementSibling);
        }
        var portals = document.querySelectorAll('[role="tooltip"], [role="menu"], [role="dialog"], [data-floating-ui-portal], [data-radix-popper-content-wrapper], .popover, .tooltip, .context-view, .monaco-hover');
        for (var i = 0; i < portals.length; i++) {
          walkAndTranslate(portals[i]);
        }
      });
    }

    var lastHoverTs = 0;
    var hoverTimer = null;
    function onHoverOrContext(e) {
      if (!engine.isEnabled()) return;
      var now = Date.now();
      if (now - lastHoverTs < 150) return;
      lastHoverTs = now;
      var target = e && e.target;
      if (target && target.nodeType === 1 && !shouldIgnoreElement(target)) {
        if (isFloatingElement(target) || target.childElementCount <= 8) {
          runWithoutObserver(function () {
            walkAndTranslate(target);
          });
        }
      }
      if (hoverTimer) clearTimeout(hoverTimer);
      hoverTimer = setTimeout(function () {
        hoverTimer = null;
        scanFloatingContainers();
      }, 60);
    }

    function bootListeners() {
      runFullScan();
      if (document.body) observeRoot(document.body);
      document.addEventListener('contextmenu', onHoverOrContext, { capture: true, passive: true });
      if (typeof window !== 'undefined') {
        window.addEventListener('popstate', function () { setTimeout(runFullScan, 60); });
      }
      // Low-frequency safety scan (30s via requestIdleCallback, never spinning)
      var idleScheduled = false;
      setInterval(function () {
        if (typeof document !== 'undefined' && document.hidden) return;
        if (!engine.isEnabled() && engine.getBrandTitleMode() === 'english') return;
        if (idleScheduled) return;
        if (typeof requestIdleCallback === 'function') {
          idleScheduled = true;
          requestIdleCallback(function () {
            idleScheduled = false;
            runFullScan();
          }, { timeout: 5000 });
        }
      }, 30000);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootListeners);
    } else {
      bootListeners();
    }

    var controller = {
      engine: engine,
      runFullScan: runFullScan,
      applyPayload: applyPayload,
      translateText: engine.translateText,
      shouldIgnoreElement: shouldIgnoreElement,
      looksLikeCodeOrPath: looksLikeCodeOrPath
    };

    if (globalScope) {
      globalScope.__AG_STUDIO_I18N__ = controller;
    }
    return controller;
  }

  var exportsObj = {
    looksLikeCodeOrPath: looksLikeCodeOrPath,
    shouldIgnoreElement: shouldIgnoreElement,
    createTranslatorEngine: createTranslatorEngine,
    initPreloadI18n: initPreloadI18n
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_I18N_MODULE__ = exportsObj;
  }
})(typeof window !== 'undefined' ? window : globalThis);
