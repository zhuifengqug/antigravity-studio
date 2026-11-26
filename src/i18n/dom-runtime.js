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
    '[data-testid="markdown-code-block-preview"]',
    '[data-testid="automation-instructions-markdown"]',
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
    '[data-testid="orchestrator-picker-row"]',
    '[data-testid="orchestrator-picker-effort"]',
    '[data-ag-cs-orch-l2]',
    '[data-ag-cs-orch-l3]',
    '[data-ag-cs-model-submenu]',
    '[data-ces-orch-row]',
    '.ces-ag-section',
    '.ces-set',
    '.input-area',
    '.chat-input',
    '[data-testid="project-header"]',
    '[data-testid="breadcrumb-segment"]'
  ];

  // Pre-compile static selectors (excluding dynamically evaluated selectors) into ONE closest() call
  var STATIC_IGNORE_SELECTORS = IGNORE_SELECTORS.filter(function (s) {
    return (
      s !== '[data-testid*="user-message"]' &&
      s !== '[data-testid="project-header"]' &&
      s !== '[data-testid="breadcrumb-segment"]'
    );
  });
  var COMBINED_STATIC_IGNORE_SEL = STATIC_IGNORE_SELECTORS.join(', ');

  var codeClassPattern = /(?:^|[\s_-])(monaco-editor|editor-instance|hljs|shiki|prism|codemirror|line-content|gutter|codeblock|code-block|code-line|view-line|xterm|xterm-rows|xterm-screen|xterm-accessibility)(?:$|[\s_-])/i;

  var CODE_OR_LITERAL_TAGS = new Set([
    'CODE', 'PRE', 'KBD', 'SAMP', 'VAR', 'SVG', 'MATH', 'MJX-CONTAINER'
  ]);
  var UI_MARKDOWN_CHROME_TESTIDS = new Set([
    'toast-notification', 'nux-card'
  ]);
  var PROTECTED_MARKDOWN_TESTIDS = new Set([
    'markdown-code-block-preview', 'automation-instructions-markdown'
  ]);
  var ORCHESTRATOR_OR_SLIDER_TESTIDS = new Set([
    'model-selector-panel',
    'model-selector-trigger',
    'orchestrator-picker-row',
    'orchestrator-picker-effort'
  ]);
  var ORCHESTRATOR_OR_SLIDER_ATTRS = [
    'data-ag-cs-orch-l2',
    'data-ag-cs-orch-l3',
    'data-ag-cs-model-submenu',
    'data-ces-orch-row'
  ];
  var ORCHESTRATOR_OR_SLIDER_CLASSES = ['ces-ag-section', 'ces-set'];

  var SETTINGS_PROJECT_SECTION_HEADERS = new Set([
    'projects', '项目', '專案',
    'workspaces', '工作区', '工作區'
  ]);
  var PROJECT_PLACEHOLDER_LABELS = new Set([
    'unknown project', '未知项目', '未知專案',
    'unknown workspace', '未知工作区', '未知工作區'
  ]);
  var BREADCRUMB_PLACEHOLDER_LABELS = new Set([
    'unknown project', '未知项目', '未知專案',
    'unknown workspace', '未知工作区', '未知工作區',
    'new project', '新建项目', '新增專案',
    'new workspace', '新建工作区', '新增工作區'
  ]);
  var EDIT_PROJECT_NAME_ARIA_RE = /^(?:Edit\s+(?:project|workspace)\s+name|编辑\s*(?:项目|工作区)\s*名称?|編輯\s*(?:專案|工作區)\s*名稱?)$/i;
  var PROJECT_BREADCRUMB_ARIA_RE = /^(?:(?:Project|Workspace)\s*:\s*|(?:项目|工作区|專案|工作區)\s*[:：]\s*)/i;

  var COMPOSER_ARIA_ALLOWED = new Set(['Message input']);
  var VOICE_BUTTON_ARIA_ALLOWED = new Set(['Start Voice mode', 'End Voice mode']);

  var ENGLISH_MONTHS = {
    january: 1, jan: 1,
    february: 2, feb: 2,
    march: 3, mar: 3,
    april: 4, apr: 4,
    may: 5,
    june: 6, jun: 6,
    july: 7, jul: 7,
    august: 8, aug: 8,
    september: 9, sep: 9, sept: 9,
    october: 10, oct: 10,
    november: 11, nov: 11,
    december: 12, dec: 12
  };
  var MODEL_LEAVING_SUBJECT_RE = /^(?:this model|(?:Gemini|Claude|GPT|Gemma|Veo|Imagen|Hydrogen|Helium|Lithium|Sonnet|Opus|Haiku|DeepSeek|Qwen|Llama|Mistral|o[134])(?:[\s._/-]|$))/i;

  var skipCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

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

  function hasAttr(el, name) {
    if (!el || el.nodeType !== 1) return false;
    if (el.hasAttribute && el.hasAttribute(name)) return true;
    var val = el.getAttribute ? el.getAttribute(name) : null;
    return val !== null && val !== undefined;
  }

  function hasAncestorTestId(el, allowedSet) {
    var cur = el;
    while (cur && (typeof document === 'undefined' || cur !== document.body)) {
      if (cur.nodeType === 1 && cur.getAttribute) {
        var tid = cur.getAttribute('data-testid');
        if (tid && allowedSet.has(tid)) return true;
      }
      cur = cur.parentElement;
    }
    return false;
  }

  function isProtectedMarkdownElement(el) {
    if (!el || el.nodeType !== 1) return false;
    var tid = el.getAttribute ? el.getAttribute('data-testid') : null;
    if (tid && PROTECTED_MARKDOWN_TESTIDS.has(tid)) return true;
    if (hasAttr(el, 'data-markdown-root')) {
      return !hasAncestorTestId(el, UI_MARKDOWN_CHROME_TESTIDS);
    }
    return false;
  }

  function isOrchestratorOrSliderSelf(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.getAttribute) {
      var tid = el.getAttribute('data-testid');
      if (tid && ORCHESTRATOR_OR_SLIDER_TESTIDS.has(tid)) return true;
      for (var i = 0; i < ORCHESTRATOR_OR_SLIDER_ATTRS.length; i++) {
        if (hasAttr(el, ORCHESTRATOR_OR_SLIDER_ATTRS[i])) return true;
      }
    }
    if (el.classList) {
      for (var j = 0; j < ORCHESTRATOR_OR_SLIDER_CLASSES.length; j++) {
        if (el.classList.contains(ORCHESTRATOR_OR_SLIDER_CLASSES[j])) return true;
      }
    }
    return false;
  }

  function isProjectHeaderElement(el) {
    if (!el || el.nodeType !== 1 || !el.getAttribute) return false;
    return (
      el.getAttribute('data-testid') === 'project-header' ||
      ((el.tagName || '').toUpperCase() === 'BUTTON' && el.getAttribute('data-project-card') === 'true')
    );
  }

  function findProjectHeaderElement(node) {
    var cur = node;
    while (cur && (typeof document === 'undefined' || cur !== document.body)) {
      if (isProjectHeaderElement(cur)) return cur;
      cur = cur.parentElement;
    }
    return null;
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

  function isUserProjectHeader(el) {
    return isProjectHeaderElement(el) && !isSystemGroupProjectHeader(el);
  }

  function getPreviousElementSibling(el) {
    if (!el) return null;
    if (el.previousElementSibling !== undefined) return el.previousElementSibling;
    var parent = el.parentElement;
    if (!parent || !parent.childNodes) return null;
    var idx = Array.prototype.indexOf.call(parent.childNodes, el);
    for (var i = idx - 1; i >= 0; i--) {
      if (parent.childNodes[i] && parent.childNodes[i].nodeType === 1) {
        return parent.childNodes[i];
      }
    }
    return null;
  }

  function getNextElementSibling(el) {
    if (!el) return null;
    if (el.nextElementSibling !== undefined) return el.nextElementSibling;
    var parent = el.parentElement;
    if (!parent || !parent.childNodes) return null;
    var idx = Array.prototype.indexOf.call(parent.childNodes, el);
    if (idx < 0) return null;
    for (var i = idx + 1; i < parent.childNodes.length; i++) {
      if (parent.childNodes[i] && parent.childNodes[i].nodeType === 1) {
        return parent.childNodes[i];
      }
    }
    return null;
  }

  function isProjectGlyphIconNode(el) {
    if (!el || el.nodeType !== 1) return false;
    if (hasAttr(el, 'data-project-glyph')) return true;
    if ((el.tagName || '').toUpperCase() === 'SPAN' && el.childNodes && el.childNodes.length > 0) {
      var hasGlyphChild = false;
      for (var i = 0; i < el.childNodes.length; i++) {
        var ch = el.childNodes[i];
        if (!ch) continue;
        if (ch.nodeType === 3) {
          if ((ch.nodeValue || '').trim()) return false;
        } else if (ch.nodeType === 1) {
          if (hasAttr(ch, 'data-project-glyph')) hasGlyphChild = true;
          else return false;
        }
      }
      if (hasGlyphChild) return true;
    }
    return false;
  }

  function isProjectGlyphLabelSelf(cur) {
    if (!cur || cur.nodeType !== 1) return false;
    if (hasAttr(cur, 'data-project-glyph')) return true;
    if ((cur.tagName || '').toUpperCase() !== 'SPAN') return false;
    var prev = getPreviousElementSibling(cur);
    if (!isProjectGlyphIconNode(prev)) return false;
    var rawLabel = (cur.innerText || cur.textContent || '').trim().toLowerCase();
    return !PROJECT_PLACEHOLDER_LABELS.has(rawLabel);
  }

  function isProjectGlyphLabelElement(el) {
    var cur = el;
    var depth = 0;
    while (cur && (typeof document === 'undefined' || cur !== document.body) && depth < 3) {
      if (isProjectGlyphLabelSelf(cur)) return true;
      cur = cur.parentElement;
      depth++;
    }
    return false;
  }

  function isSettingsSectionHeading(el, allowedTitles) {
    if (!el || el.nodeType !== 1) return false;
    var headingEl = null;
    if ((el.tagName || '').toUpperCase() === 'H2') {
      headingEl = el;
    } else if (el.childNodes) {
      for (var i = 0; i < el.childNodes.length; i++) {
        var ch = el.childNodes[i];
        if (ch && ch.nodeType === 1 && (ch.tagName || '').toUpperCase() === 'H2') {
          headingEl = ch;
          break;
        }
      }
    }
    if (!headingEl) return false;
    var text = (headingEl.innerText || headingEl.textContent || '').trim().toLowerCase();
    return allowedTitles.has(text);
  }

  function isSettingsNavButton(el) {
    if (!el || el.nodeType !== 1 || !el.getAttribute) return false;
    if ((el.tagName || '').toUpperCase() !== 'BUTTON') return false;
    return (el.getAttribute('data-testid') || '').indexOf('settings-nav-item-') === 0;
  }

  function isSettingsProjectNavButton(navBtn) {
    if (!isSettingsNavButton(navBtn)) return false;
    var rawLabel = (navBtn.innerText || navBtn.textContent || '').trim().toLowerCase();
    if (PROJECT_PLACEHOLDER_LABELS.has(rawLabel)) return false;

    var flatPrev = getPreviousElementSibling(navBtn);
    while (flatPrev && isSettingsNavButton(flatPrev)) {
      flatPrev = getPreviousElementSibling(flatPrev);
    }
    if (isSettingsSectionHeading(flatPrev, SETTINGS_PROJECT_SECTION_HEADERS)) {
      return true;
    }

    var sidebar = null;
    if (typeof navBtn.closest === 'function') {
      sidebar = navBtn.closest('[data-testid="settings-sidebar"]');
    } else {
      var c = navBtn;
      while (c && (typeof document === 'undefined' || c !== document.body)) {
        if (c.nodeType === 1 && c.getAttribute && c.getAttribute('data-testid') === 'settings-sidebar') {
          sidebar = c;
          break;
        }
        c = c.parentElement;
      }
    }
    if (!sidebar) return false;

    var listNode = navBtn.parentElement;
    var depth = 0;
    while (listNode && listNode !== sidebar && depth < 4) {
      var prev = getPreviousElementSibling(listNode);
      if (isSettingsSectionHeading(prev, SETTINGS_PROJECT_SECTION_HEADERS)) return true;
      listNode = listNode.parentElement;
      depth++;
    }
    return false;
  }

  function isSettingsProjectNavItem(el) {
    var cur = el;
    var depth = 0;
    while (cur && (typeof document === 'undefined' || cur !== document.body) && depth < 4) {
      if (isSettingsNavButton(cur)) return isSettingsProjectNavButton(cur);
      cur = cur.parentElement;
      depth++;
    }
    return false;
  }

  function isSettingsProjectTitleSelf(cur) {
    if (!cur || cur.nodeType !== 1 || (cur.tagName || '').toUpperCase() !== 'SPAN') return false;
    var next = getNextElementSibling(cur);
    if (!next || (next.tagName || '').toUpperCase() !== 'BUTTON' || !next.getAttribute) return false;
    var aria = (next.getAttribute('aria-label') || '').trim();
    if (!EDIT_PROJECT_NAME_ARIA_RE.test(aria)) return false;
    var rawLabel = (cur.innerText || cur.textContent || '').trim().toLowerCase();
    return !PROJECT_PLACEHOLDER_LABELS.has(rawLabel);
  }

  function isSettingsProjectTitleElement(el) {
    var cur = el;
    var depth = 0;
    while (cur && (typeof document === 'undefined' || cur !== document.body) && depth < 3) {
      if (isSettingsProjectTitleSelf(cur)) return true;
      cur = cur.parentElement;
      depth++;
    }
    return false;
  }

  function isProjectBreadcrumbSegmentSelf(seg) {
    if (!seg || seg.nodeType !== 1 || !seg.getAttribute) return false;
    if (seg.getAttribute('data-testid') !== 'breadcrumb-segment') return false;
    var aria = (seg.getAttribute('aria-label') || '').trim();
    if (!PROJECT_BREADCRUMB_ARIA_RE.test(aria)) return false;
    var rawLabel = (seg.innerText || seg.textContent || '').trim().toLowerCase();
    return !BREADCRUMB_PLACEHOLDER_LABELS.has(rawLabel);
  }

  function isProjectBreadcrumbSegment(el) {
    if (!el) return false;
    if (typeof el.closest === 'function') {
      var seg = el.closest('[data-testid="breadcrumb-segment"]');
      return seg ? isProjectBreadcrumbSegmentSelf(seg) : false;
    }
    var cur = el;
    var depth = 0;
    while (cur && (typeof document === 'undefined' || cur !== document.body) && depth < 5) {
      if (cur.nodeType === 1 && cur.getAttribute && cur.getAttribute('data-testid') === 'breadcrumb-segment') {
        return isProjectBreadcrumbSegmentSelf(cur);
      }
      cur = cur.parentElement;
      depth++;
    }
    return false;
  }

  function isProtectedProjectNameSelf(el) {
    return (
      isProjectGlyphLabelSelf(el) ||
      isSettingsProjectNavButton(el) ||
      isSettingsProjectTitleSelf(el) ||
      isProjectBreadcrumbSegmentSelf(el)
    );
  }

  function isProtectedProjectNameElement(el) {
    return (
      isProjectGlyphLabelElement(el) ||
      isSettingsProjectNavItem(el) ||
      isSettingsProjectTitleElement(el) ||
      isProjectBreadcrumbSegment(el)
    );
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

  function isInsideThinkingBody(cur, isThinkingBtn) {
    if (isThinkingBtn || !cur) return false;
    if (cur.previousElementSibling &&
        cur.previousElementSibling.getAttribute &&
        cur.previousElementSibling.getAttribute('data-testid') === 'thinking-collapsible-trigger') {
      return true;
    }
    if (cur.parentElement && cur.parentElement.querySelector) {
      try {
        var trig = cur.parentElement.querySelector(':scope > button[data-testid="thinking-collapsible-trigger"]');
        if (trig && cur !== trig && !trig.contains(cur)) return true;
      } catch (_e) {}
    }
    return false;
  }

  function isProtectedSelfCore(cur, allowComposerSurface) {
    if (!cur || cur.nodeType !== 1) return false;
    var curTag = (cur.tagName || '').toUpperCase();
    if (CODE_OR_LITERAL_TAGS.has(curTag) || curTag === 'SCRIPT' || curTag === 'STYLE' || curTag === 'NOSCRIPT') {
      return true;
    }
    if (isProtectedMarkdownElement(cur) || isSwarmProtectedElement(cur) || isOrchestratorOrSliderSelf(cur)) {
      return true;
    }
    if (cur.getAttribute) {
      var tid = cur.getAttribute('data-testid');
      var ce = cur.getAttribute('contenteditable');
      var role = cur.getAttribute('role');
      if (
        tid === 'user-message-content' ||
        role === 'code' ||
        (!allowComposerSurface && (ce === 'true' || role === 'textbox' || cur.getAttribute('data-lexical-editor') === 'true')) ||
        cur.getAttribute('data-language') ||
        cur.getAttribute('data-code') ||
        cur.getAttribute('data-line') ||
        cur.getAttribute('data-line-number')
      ) {
        return true;
      }
    }
    if (cur.classList && (
      cur.classList.contains('group/user-input-step') ||
      cur.classList.contains('user-message') ||
      cur.classList.contains('thought-content') ||
      cur.classList.contains('thinking-content') ||
      cur.classList.contains('thought-box') ||
      cur.classList.contains('cursor-edit') ||
      cur.classList.contains('cursor-text') ||
      cur.classList.contains('monaco-editor') ||
      cur.classList.contains('editor-instance') ||
      cur.classList.contains('katex') ||
      cur.classList.contains('katex-display') ||
      cur.classList.contains('katex-html') ||
      cur.classList.contains('mjx-container')
    )) {
      return true;
    }
    if (cur.className && typeof cur.className === 'string') {
      var lowerClass = cur.className.toLowerCase();
      if (
        lowerClass.indexOf('code-line') !== -1 ||
        lowerClass.indexOf('view-line') !== -1 ||
        codeClassPattern.test(cur.className)
      ) {
        return true;
      }
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
      tag === 'IFRAME' || tag === 'VIDEO' || tag === 'AUDIO' ||
      tag === 'INPUT' || tag === 'TEXTAREA'
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

    // Dynamic project headers & PR #72 project names (checked BEFORE skipCache & isActionPill)
    var projHeader = typeof el.closest === 'function'
      ? el.closest('[data-testid="project-header"], button[data-project-card="true"]')
      : findProjectHeaderElement(el);
    if (projHeader && !isSystemGroupProjectHeader(projHeader)) {
      return true;
    }
    if (isProtectedProjectNameElement(el)) {
      return true;
    }

    // Slash / @-mention option item labels (recycled nodes; never write skipCache)
    var hasClosest = typeof el.closest === 'function';
    var menuOpt = hasClosest ? el.closest('[data-testid="menu-option-label"]') : null;
    if (!menuOpt && !hasClosest) {
      var mCur = el;
      while (mCur && (typeof document === 'undefined' || mCur !== document.body)) {
        if (mCur.getAttribute && mCur.getAttribute('data-testid') === 'menu-option-label') {
          menuOpt = mCur;
          break;
        }
        mCur = mCur.parentElement;
      }
    }
    if (menuOpt) {
      var optTxt = (menuOpt.innerText || menuOpt.textContent || '').trim();
      return !MENTION_CATEGORIES.has(optTxt);
    }

    // Explicit UI controls inside agent responses / queued decorators
    var isThinkingBtn = hasClosest ? el.closest('button[data-testid="thinking-collapsible-trigger"]') : null;
    if (!isThinkingBtn && !hasClosest) {
      var tCur = el;
      while (tCur && (typeof document === 'undefined' || tCur !== document.body)) {
        if ((tCur.tagName || '').toUpperCase() === 'BUTTON' && tCur.getAttribute && tCur.getAttribute('data-testid') === 'thinking-collapsible-trigger') {
          isThinkingBtn = tCur;
          break;
        }
        tCur = tCur.parentElement;
      }
    }
    if (isThinkingBtn) {
      if (skipCache) skipCache.set(el, false);
      return false;
    }

    if (hasClosest) {
      var isUserActionDecorator = el.closest('[data-testid="queued-decorators"], [data-testid="user-message-actions"]');
      if (isUserActionDecorator && !el.closest('[data-testid="user-message-content"]')) {
        if (skipCache) skipCache.set(el, false);
        return false;
      }
    }

    // Quote / Ask /btw floating selection pills & action step pills (must verify not inside protected ancestors)
    var textContent = (el.innerText || el.textContent || '').trim();
    var isQuoteOrBtwBubble = textContent.length <= 40 && /^(?:Quote|Ask(?:\s+|\s*\/\s*)btw)(?:\s+(?:Ctrl|Cmd)(?:\+[a-zA-Z0-9]+)+)?$/i.test(textContent);
    var isActionPill = textContent.length <= 40 && /^(Explored|Exploring|Ran|Run|Running|Viewed|Viewing|Edited|Editing|Thought|Thinking|Working|Done|Analyzed|Analyzing|Created|Creating|Deleted|Deleting|Waiting|Rejected|Errored|Completed|Used)(\s+(command|commands|files?|tools?|artifacts?))?$/i.test(textContent);
    if (isQuoteOrBtwBubble || isActionPill) {
      var inProtected = false;
      var chk = el;
      while (chk && (typeof document === 'undefined' || chk !== document.body)) {
        if (isProtectedSelfCore(chk) || isInsideThinkingBody(chk, false)) {
          inProtected = true;
          break;
        }
        chk = chk.parentElement;
      }
      if (!inProtected) {
        return false;
      }
    }

    // Hot-path WeakMap skipCache lookup
    if (skipCache && skipCache.has(el)) {
      return skipCache.get(el);
    }

    if (hasClosest) {
      if (el.closest('[data-testid="user-message-content"]')) {
        if (skipCache) skipCache.set(el, true);
        return true;
      }
      if (COMBINED_STATIC_IGNORE_SEL && el.closest(COMBINED_STATIC_IGNORE_SEL)) {
        if (skipCache) skipCache.set(el, true);
        return true;
      }
      var um = el.closest('[data-testid*="user-message"]');
      if (um && !el.closest('[data-testid="queued-decorators"], [data-testid="user-message-actions"]')) {
        if (skipCache) skipCache.set(el, true);
        return true;
      }
    }

    // Pointer-only ancestor walk (works identically in browser & minimal Node DOM mocks without closest())
    var cur = el;
    var shouldSkip = false;
    while (cur && (typeof document === 'undefined' || cur !== document.body)) {
      if (skipCache && skipCache.has(cur)) {
        shouldSkip = skipCache.get(cur);
        break;
      }
      if (isProtectedSelfCore(cur) || isInsideThinkingBody(cur, isThinkingBtn)) {
        shouldSkip = true;
        break;
      }
      if (cur.classList && (cur.classList.contains('input-area') || cur.classList.contains('chat-input'))) {
        shouldSkip = true;
        break;
      }
      cur = cur.parentElement;
    }

    if (skipCache) skipCache.set(el, shouldSkip);
    return shouldSkip;
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
          if (/^Conflicts with "(.+)" \(reserved for sidebar switching\)$/i.test(part)) {
            return part.replace(/^Conflicts with "(.+)" \(reserved for sidebar switching\)$/i, isTW ? '與「$1」衝突（保留用於側欄切換）' : '与“$1”冲突（保留用于侧栏切换）');
          }
          if (/^Conflicts with "(.+)" \((.+)\)$/i.test(part)) {
            return part.replace(/^Conflicts with "(.+)" \((.+)\)$/i, isTW ? '與「$1」衝突（$2）' : '与“$1”冲突（$2）');
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

      // 11. PR #77 AI Credits / Baseline Quota Refresh / Overages & Model Quota Exhausted
      var quotaExMatch = trimmed.match(/^Your quota for\s+(.+?)\s+(will reset on\s+(.+?)|has been reached)\.\s*Switch to another available model to continue\.?$/i);
      if (quotaExMatch) {
        var qModel = quotaExMatch[1].trim();
        var qResetAt = quotaExMatch[3];
        var qSubj = /^this model$/i.test(qModel) ? (isTW ? '此模型' : '此模型') : (qModel + ' ');
        return qResetAt
          ? (qSubj + (isTW ? '的配額將於 ' : '的配额将于 ') + qResetAt.trim() + (isTW ? ' 重設。請切換至其他可用模型以繼續。' : ' 重置。请切换至其他可用模型以继续。'))
          : (qSubj + (isTW ? '的配額已用盡。請切換至其他可用模型以繼續。' : '的配额已用尽。请切换至其他可用模型以继续。'));
      }

      if (/^(?:You need (?:at least \d+(?:,\d+)*|more) AI Credits to send messages\.|Your plan['’]s baseline quota will refresh on |To continue using this model now,\s*enable AI Credit overages\.?)/i.test(trimmed)) {
        var rest = trimmed;
        var needPart = '';
        var refreshPart = '';
        var overagePart = '';
        var needMatch = rest.match(/^You need (?:at least\s+(\d+(?:,\d+)*)|more)\s+AI Credits to send messages\.\s*To continue using\s+(.+?)\s+now,\s*purchase more AI Credits\.?(?:\s+|$)/i);
        if (needMatch) {
          var credits = needMatch[1];
          var rawM = needMatch[2].trim();
          var contClause = /^this model$/i.test(rawM)
            ? (isTW ? '若要立即繼續使用此模型，請購買更多 AI 點數。' : '若要立即继续使用此模型，请购买更多 AI 点数。')
            : (isTW ? ('若要立即繼續使用 ' + rawM + '，請購買更多 AI 點數。') : ('若要立即继续使用 ' + rawM + '，请购买更多 AI 点数。'));
          var needPrefix = credits
            ? (isTW ? ('傳送訊息至少需要 ' + credits + ' 個 AI 點數。') : ('发送消息至少需要 ' + credits + ' 个 AI 点数。'))
            : (isTW ? '傳送訊息需要更多 AI 點數。' : '发送消息需要更多 AI 点数。');
          needPart = needPrefix + contClause;
          rest = rest.slice(needMatch[0].length).trim();
        }
        var overageMatch = rest.match(/(?:^|\s+)To continue using this model now,\s*enable AI Credit overages\.?$/i);
        if (overageMatch) {
          overagePart = isTW ? '若要立即繼續使用此模型，請開啟 AI 點數超額使用。' : '若要立即继续使用此模型，请开启 AI 点数超额使用。';
          rest = rest.slice(0, rest.length - overageMatch[0].length).trim();
        }
        if (rest) {
          var refreshMatch = rest.match(/^Your plan['’]s baseline quota will refresh on\s+(.+?)\.?$/i);
          if (refreshMatch) {
            refreshPart = isTW
              ? ('您目前方案的基礎配額將於 ' + refreshMatch[1].trim() + ' 重新整理。')
              : ('您当前方案的基础配额将于 ' + refreshMatch[1].trim() + ' 刷新。');
            rest = '';
          }
        }
        var combinedCredits = needPart + refreshPart + overagePart;
        if (combinedCredits && !rest) {
          return combinedCredits;
        }
      }

      // 12. PR #79 Hydrogen Tooltip & Date-Validated "leaving on" / "will be removed on"
      function parseEnglishDateLocalized(rawDate) {
        var m = String(rawDate || '').trim().match(/^([A-Za-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?$/i);
        if (!m) return null;
        var month = ENGLISH_MONTHS[m[1].toLowerCase()];
        var day = Number(m[2]);
        if (!month || day < 1 || day > 31) return null;
        return (m[3] ? m[3] + ' 年 ' : '') + month + ' 月 ' + day + ' 日';
      }
      function formatLeavingSubjectLocalized(model) {
        var m = String(model || '').trim();
        if (!m || /^this model$/i.test(m)) return '此模型';
        return m + ' ';
      }
      var hydroMatch = trimmed.match(/^Use Hydrogen for better quality with lower quota usage\.(?:\s+(.+))?$/i);
      if (hydroMatch) {
        var trailingText = hydroMatch[1] || '';
        var hLeaving = trailingText.match(/^(?:(.+?)\s+)?(?:is\s+)?leaving on\s+(.+?)\.?$/i);
        var hFixed = isTW
          ? '使用 Hydrogen 可獲得更好的品質，同時消耗更少配額。'
          : '使用 Hydrogen 可获得更好的质量，同时消耗更少配额。';
        var hDate = hLeaving ? parseEnglishDateLocalized(hLeaving[2]) : null;
        if (hLeaving && hDate) {
          return hFixed + formatLeavingSubjectLocalized(hLeaving[1]) + (isTW ? '將於 ' : '将于 ') + hDate + (isTW ? ' 下線。' : ' 下线。');
        }
        if (trailingText) {
          return hFixed + (translateCore(trailingText) || trailingText);
        }
        return hFixed;
      }
      var leavingMatch = trimmed.match(/^(?:(.+?)\s+)?(?:is\s+)?leaving on\s+(.+?)\.?$/i);
      if (leavingMatch) {
        var lModel = (leavingMatch[1] || '').trim();
        var lDate = parseEnglishDateLocalized(leavingMatch[2]);
        var subjectOk = !lModel || (lModel.length <= 64 && MODEL_LEAVING_SUBJECT_RE.test(lModel));
        if (lDate && subjectOk) {
          return formatLeavingSubjectLocalized(lModel) + (isTW ? '將於 ' : '将于 ') + lDate + (isTW ? ' 下線。' : ' 下线。');
        }
      }
      var removedMatch = trimmed.match(/^(?:((?:(?![.!?]\s).)+?)\s+)?will be removed(\s+from Antigravity)?\s+on\s+(.+?)\.?$/i);
      if (removedMatch) {
        var rDate = parseEnglishDateLocalized(removedMatch[3]) || removedMatch[3];
        var rModel = removedMatch[1] ? removedMatch[1].trim() : '';
        var rSubj = !rModel ? '' : (/^this model$/i.test(rModel) ? '此模型' : (rModel + ' '));
        return rSubj + (isTW ? '將於 ' : '将于 ') + rDate + (removedMatch[2] ? (isTW ? ' 從 Antigravity 移除。' : ' 从 Antigravity 移除。') : '移除。');
      }

      // 13. PR #74 9-Action Path/URL/Command Permissions & Approval Prompts
      var permQMatch = trimmed.match(/^(Save rule to always allow|Allow)\s+([^?\r\n]{2,140})\?$/i);
      if (permQMatch) {
        var permActMap = isTW
          ? {
              'read access to this path': '讀取此路徑',
              'write access to this path': '寫入此路徑',
              'reading this url': '讀取此 URL',
              'executing actions on this url': '在此 URL 上執行操作',
              'browser downloads from this site': '瀏覽器從此網站下載檔案',
              'running this command': '執行此命令',
              'running this command outside the sandbox': '在沙箱外執行此命令',
              'using this mcp tool': '使用此 MCP 工具',
              'a one-time administrator (uac) elevation': '一次性系統管理員 (UAC) 提權',
              'access to this resource': '存取此資源',
              'the browser agent to download a file': '瀏覽器代理下載檔案'
            }
          : {
              'read access to this path': '读取此路径',
              'write access to this path': '写入此路径',
              'reading this url': '读取此 URL',
              'executing actions on this url': '在此 URL 上执行操作',
              'browser downloads from this site': '浏览器从此站点下载文件',
              'running this command': '运行此命令',
              'running this command outside the sandbox': '在沙盒外运行此命令',
              'using this mcp tool': '使用此 MCP 工具',
              'a one-time administrator (uac) elevation': '一次性管理员 (UAC) 提权',
              'access to this resource': '访问此资源',
              'the browser agent to download a file': '浏览器智能体下载文件'
            };
        var pAct = permQMatch[2].trim();
        var pActCn = permActMap[pAct.toLowerCase()];
        if (/^Save rule/i.test(permQMatch[1])) {
          return pActCn
            ? ((isTW ? '儲存規則以一律允許' : '保存规则以始终允许') + pActCn + '？')
            : ((isTW ? '儲存規則以一律允許 ' : '保存规则以始终允许 ') + pAct + '？');
        }
        return pActCn
          ? ((isTW ? '是否允許' : '是否允许') + pActCn + '？')
          : ((isTW ? '是否允許 ' : '是否允许 ') + pAct + '？');
      }

      var waitAppMatch = trimmed.match(/^Waiting for approval to (access|execute|run|read|write|edit|modify|delete|use|download)(?::\s*(.+))?$/i);
      if (waitAppMatch) {
        var verbMap235 = isTW
          ? { access: '存取', execute: '執行', run: '執行', read: '讀取', write: '寫入', edit: '編輯', modify: '修改', delete: '刪除', use: '使用', download: '下載' }
          : { access: '访问', execute: '执行', run: '运行', read: '读取', write: '写入', edit: '编辑', modify: '修改', delete: '删除', use: '使用', download: '下载' };
        return (isTW ? '正在等待核准' : '正在等待批准') + (verbMap235[waitAppMatch[1].toLowerCase()] || waitAppMatch[1]) + (waitAppMatch[2] ? ('：' + waitAppMatch[2]) : '');
      }

      // 14. v2.35.2 10 $-safe Navigation / Sign-in / Error Prefixes (callback-safe)
      var blkNav = trimmed.match(/^Blocked navigation to "(.+)"$/);
      if (blkNav) return isTW ? ('已封鎖前往「' + blkNav[1] + '」的導覽') : ('已拦截前往“' + blkNav[1] + '”的导航');
      var signPanel = trimmed.match(/^Sign in from the ([^.!?\r\n]{1,40}) panel\.$/);
      if (signPanel) return isTW ? ('請從 ' + signPanel[1] + ' 面板登入。') : ('请从 ' + signPanel[1] + ' 面板登录。');
      var signUse = trimmed.match(/^Sign in to use ([^.!?\r\n]{1,40})!$/);
      if (signUse) return isTW ? ('請登入以使用 ' + signUse[1] + '！') : ('请登录以使用 ' + signUse[1] + '！');
      var failMatch = trimmed.match(/^Failed to (create|save|unarchive|delete) (project|workspace|settings|project settings|project permissions|cloud permission settings|configuration):\s*(.+)$/i);
      if (failMatch) {
        var actM = isTW
          ? { create: '建立', save: '儲存', unarchive: '取消封存', delete: '刪除' }
          : { create: '创建', save: '保存', unarchive: '取消归档', delete: '删除' };
        var tgtM = isTW
          ? { project: '專案', workspace: '工作區', settings: '設定', 'project settings': '專案設定', 'project permissions': '專案權限', 'cloud permission settings': '雲端權限設定', configuration: '設定' }
          : { project: '项目', workspace: '工作区', settings: '设置', 'project settings': '项目设置', 'project permissions': '项目权限', 'cloud permission settings': '云端权限设置', configuration: '配置' };
        return (actM[failMatch[1].toLowerCase()] || failMatch[1]) + (tgtM[failMatch[2].toLowerCase()] || failMatch[2]) + (isTW ? '失敗：' : '失败：') + failMatch[3];
      }
      var attachFolderM = trimmed.match(/^Could not attach folder "(.+)":\s*(.+)$/);
      if (attachFolderM) return isTW ? ('無法附加資料夾「' + attachFolderM[1] + '」：' + attachFolderM[2]) : ('无法附加文件夹“' + attachFolderM[1] + '”：' + attachFolderM[2]);
      var attachImgOrOpen = trimmed.match(/^Could not (attach image|open folder):\s*(.+)$/);
      if (attachImgOrOpen) {
        return (isTW ? '無法' : '无法') + (attachImgOrOpen[1] === 'attach image' ? (isTW ? '附加圖片' : '附加图片') : (isTW ? '開啟資料夾' : '打开文件夹')) + '：' + attachImgOrOpen[2];
      }
      var errMcpM = trimmed.match(/^Error (installing MCP server|refreshing MCP servers|restarting MCP server|updating agent):\s*(.+)$/);
      if (errMcpM) {
        var errMcpMap = isTW
          ? { 'installing MCP server': '安裝 MCP 伺服器', 'refreshing MCP servers': '重新整理 MCP 伺服器', 'restarting MCP server': '重新啟動 MCP 伺服器', 'updating agent': '更新代理' }
          : { 'installing MCP server': '安装 MCP 服务器', 'refreshing MCP servers': '刷新 MCP 服务器', 'restarting MCP server': '重启 MCP 服务器', 'updating agent': '更新智能体' };
        return (errMcpMap[errMcpM[1]] || errMcpM[1]) + (isTW ? '發生錯誤：' : '出错：') + errMcpM[2];
      }
      var errRestartM = trimmed.match(/^Error restarting ([^:\r\n]{1,60}):\s*(.+)$/);
      if (errRestartM) return (isTW ? '重新啟動 ' : '重启 ') + errRestartM[1] + (isTW ? ' 發生錯誤：' : ' 出错：') + errRestartM[2];
      var addedMcpFailM = trimmed.match(/^Added MCP server "(.+)", but it failed to start:\s*(.+)$/);
      if (addedMcpFailM) return isTW ? ('已新增 MCP 伺服器「' + addedMcpFailM[1] + '」，但啟動失敗：' + addedMcpFailM[2]) : ('已添加 MCP 服务器“' + addedMcpFailM[1] + '”，但启动失败：' + addedMcpFailM[2]);
      var failInteractM = trimmed.match(/^Failed to send interaction:\s*(.+)$/);
      if (failInteractM) return (isTW ? '傳送互動失敗：' : '发送交互失败：') + failInteractM[1];

      // 15. v2.35.0 & v2.35.1 Dynamic Rules (Inbox / Permissions / Viewers / Queue / Git / Hooks / Schedule / Forms)
      var resMatch = trimmed.match(/^Resolved "(.+)"$/);
      if (resMatch) return isTW ? ('已解決「' + resMatch[1] + '」') : ('已解决“' + resMatch[1] + '”');
      var allowInM = trimmed.match(/^Allowed in (.+)$/);
      if (allowInM) return isTW ? ('已在 ' + allowInM[1] + ' 中允許') : ('已在 ' + allowInM[1] + ' 中允许');
      var revAllM = trimmed.match(/^Revoke all:\s*(.+)$/);
      if (revAllM) return (isTW ? '全部撤銷：' : '全部撤销：') + revAllM[1];
      var revM = trimmed.match(/^Revoke:\s*(.+)$/);
      if (revM) return (isTW ? '撤銷：' : '撤销：') + revM[1];
      var noLangM = trimmed.match(/^No matching languages for "(.+)"$/);
      if (noLangM) return isTW ? ('未找到符合「' + noLangM[1] + '」的語言') : ('未找到匹配“' + noLangM[1] + '”的语言');
      var moveConvM = trimmed.match(/^Move this conversation to "(.+)"\?$/);
      if (moveConvM) return isTW ? ('確定將此對話移動至「' + moveConvM[1] + '」嗎？') : ('确定将此对话移动到“' + moveConvM[1] + '”吗？');
      var statusSuffixM = trimmed.match(/^(.+?) \((Not running|Sidecar disabled)\)$/);
      if (statusSuffixM) {
        var stPrefix = statusSuffixM[1];
        var stPrefixCn = exactMap.has(stPrefix) ? exactMap.get(stPrefix) : (lowerMap.get(stPrefix.toLowerCase()) || stPrefix);
        var stReasonCn = statusSuffixM[2] === 'Sidecar disabled'
          ? (isTW ? 'Sidecar 已停用' : 'Sidecar 已禁用')
          : (isTW ? '未執行' : '未运行');
        return stPrefixCn + '（' + stReasonCn + '）';
      }
      var reqToM = trimmed.match(/^Required to ([^:\r\n]{1,40}):\s*(.+)$/);
      if (reqToM) {
        var reqMap = isTW
          ? { save: '儲存', create: '建立', enable: '啟用', run: '執行', continue: '繼續', submit: '提交', activate: '啟用', start: '啟動' }
          : { save: '保存', create: '创建', enable: '启用', run: '运行', continue: '继续', submit: '提交', activate: '激活', start: '启动' };
        var rActCn = reqMap[reqToM[1].trim().toLowerCase()] || reqToM[1];
        return (isTW ? '執行「' : '执行“') + rActCn + (isTW ? '」所需的條件：' : '”所需的条件：') + reqToM[2];
      }
      var openUrlSysM = trimmed.match(/^Open URL in system browser:\s*(.+)$/);
      if (openUrlSysM) return (isTW ? '在系統瀏覽器中開啟連結：' : '在系统浏览器中打开链接：') + openUrlSysM[1];
      var msgQMatch = trimmed.match(/^Message queued\.(?:\s+(\d+)\s+messages?\s+in\s+queue\.)?\s+(Sends after background work finishes\.|Sends after agent finishes working\.)\s+Actions available:\s*Send Now,\s*Edit,\s*Delete\.$/i);
      if (msgQMatch) {
        var qCnt = msgQMatch[1];
        var qWhenCn = /background work/i.test(msgQMatch[2])
          ? (isTW ? '將在背景工作完成後傳送。' : '将在后台工作完成后发送。')
          : (isTW ? '將在代理完成目前工作後傳送。' : '将在智能体完成当前工作后发送。');
        return (isTW ? '訊息已加入佇列。' : '消息已加入队列。')
          + (qCnt ? (isTW ? ('佇列中共有 ' + qCnt + ' 則訊息。') : ('队列中共有 ' + qCnt + ' 条消息。')) : '')
          + qWhenCn
          + (isTW ? '可用操作：立即傳送、編輯、刪除。' : '可用操作：立即发送、编辑、删除。');
      }
      var allChangesM = trimmed.match(/^All changes since (.+)$/);
      if (allChangesM) return (isTW ? '自 ' : '自 ') + allChangesM[1] + (isTW ? ' 以來的所有變更' : ' 以来的所有更改');
      var pushCommitsM = trimmed.match(/^Push (\d+) commits? to (.+)$/);
      if (pushCommitsM) return (isTW ? '推送 ' : '推送 ') + pushCommitsM[1] + (isTW ? ' 個提交至 ' : ' 个提交到 ') + pushCommitsM[2];
      var pushedCommitsM = trimmed.match(/^Pushed (\d+) commits? to (.+)\.$/);
      if (pushedCommitsM) return (isTW ? '已推送 ' : '已推送 ') + pushedCommitsM[1] + (isTW ? ' 個提交至 ' : ' 个提交到 ') + pushedCommitsM[2] + '。';
      var pushedToM = trimmed.match(/^Pushed to (.+)\.$/);
      if (pushedToM) return (isTW ? '已推送至 ' : '已推送到 ') + pushedToM[1] + '。';
      var publishM = trimmed.match(/^Publish (.+) to origin$/);
      if (publishM) return (isTW ? '將 ' : '将 ') + publishM[1] + (isTW ? ' 發佈至 origin' : ' 发布到 origin');
      var publishedM = trimmed.match(/^Published (.+) to origin\.$/);
      if (publishedM) return (isTW ? '已將 ' : '已将 ') + publishedM[1] + (isTW ? ' 發佈至 origin。' : ' 发布到 origin。');
      var hookTrigM = trimmed.match(/^Hook will only trigger if the tool name (matches|starts with) (.+)\.$/);
      if (hookTrigM) {
        return hookTrigM[1] === 'matches'
          ? (isTW ? ('僅當工具名稱匹配 ' + hookTrigM[2] + ' 時才會觸發 Hook。') : ('仅当工具名称匹配 ' + hookTrigM[2] + ' 时才会触发 Hook。'))
          : (isTW ? ('僅當工具名稱以 ' + hookTrigM[2] + ' 開頭時才會觸發 Hook。') : ('仅当工具名称以 ' + hookTrigM[2] + ' 开头时才会触发 Hook。'));
      }
      var renderFailM = trimmed.match(/^⚠️\s*Failed to render (LaTeX|Mermaid diagram):\s*(.+)$/);
      if (renderFailM) {
        return '⚠️ ' + (isTW ? '渲染 ' : '渲染 ') + (renderFailM[1] === 'LaTeX' ? 'LaTeX ' : (isTW ? 'Mermaid 圖表' : 'Mermaid 图表')) + (isTW ? '失敗：' : '失败：') + renderFailM[2];
      }
      var everyHourM = trimmed.match(/^Every hour(?: at :(\d{2}))?(?:\s*·\s*(.+))?$/);
      if (everyHourM) {
        return (isTW ? '每小時' : '每小时') + (everyHourM[1] ? ' :' + everyHourM[1] : '') + (everyHourM[2] ? ' · ' + everyHourM[2] : '');
      }
      var dayTimeM = trimmed.match(/^(Today|Tomorrow|Yesterday|今天|明天|昨天)\s+(\d{1,2}:\d{2}(?:\s*[AP]M)?)$/i);
      if (dayTimeM) {
        var dayW = { today: '今天', tomorrow: '明天', yesterday: '昨天', '今天': '今天', '明天': '明天', '昨天': '昨天' };
        return (dayW[dayTimeM[1].toLowerCase()] || dayTimeM[1]) + ' ' + dayTimeM[2];
      }

      // 16. Swarm & Archive Split Toast Dynamic Helpers
      var postsOverM = trimmed.match(/^(\d+)\s+posts?\s+over\s+(.+)$/i);
      if (postsOverM) return postsOverM[1] + (isTW ? ' 則動態 · 歷時 ' : ' 条动态 · 历时 ') + formatDurationLocalized(postsOverM[2], isTW);
      var gifReadyM = trimmed.match(/^GIF\s+ready\s+\((.+)\)\s+—\s+right-click\s+image\s+to\s+save\.$/);
      if (gifReadyM) return isTW ? ('GIF 已就緒（' + gifReadyM[1] + '）— 右鍵圖片即可儲存。') : ('GIF 已就绪（' + gifReadyM[1] + '）— 右键图片即可保存。');
      var coordDoneM = trimmed.match(/^Coordinator\s+·\s+(\d+)\s+of\s+(\d+)\s+done(?:\s+·\s+Needs you)?$/);
      if (coordDoneM) {
        var needsYou = /Needs you$/.test(trimmed);
        return (isTW ? '協調器 · 已完成 ' : '协调器 · 已完成 ') + coordDoneM[1] + ' / ' + coordDoneM[2] + (needsYou ? (isTW ? ' · 需要你處理' : ' · 需要你处理') : '');
      }
      if (/^View archived in the sidebar \($/.test(trimmed)) return isTW ? '已封存內容可在側邊欄（' : '已归档内容可在侧边栏（';
      if (/^menu\)\.$/.test(trimmed)) return isTW ? '選單）中檢視。' : '菜单）中查看。';
      if (/^Customize Sidebar\)\.$/.test(trimmed)) return isTW ? '自訂側邊欄）中檢視。' : '自定义侧边栏）中查看。';

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
      if (trimmed === 'log') {
        cacheSet(trimmed, null);
        return null;
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

      // 2. Complex dynamic rules (quota resets, shortcuts, voice, conflicts, v2.35.x rules before unanchored regexes)
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

      // 4. Case-insensitive exact match (skip ambiguous lowercase single words 'end' and 'log')
      var lowerKey = trimmed.toLowerCase();
      if (lowerKey !== 'end' && trimmed !== 'log') {
        var ciHit = lowerMap.get(lowerKey);
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
        var coreTrans = exactMap.has(core) ? exactMap.get(core) : (core.toLowerCase() !== 'end' && core !== 'log' ? lowerMap.get(core.toLowerCase()) : undefined);
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
        if (lw === 'end' || (words.length === 1 && tok === 'log')) {
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
    var pendingPortalNodes = new Set();
    var pendingPortalTextNodes = new Set();
    var pendingPortalAttrNodes = new Map();
    var portalDebounceTimer = null;
    var PORTAL_DEBOUNCE_MS = 120;
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

    function isNonComposerProtectedSelf(cur) {
      if (!cur || cur.nodeType !== 1) return false;
      if (isProtectedSelfCore(cur, true) || isUserProjectHeader(cur) || isProtectedProjectNameSelf(cur)) {
        return true;
      }
      if (isInsideThinkingBody(cur, false)) return true;
      return false;
    }

    function isProtectedFromComposerLabel(node) {
      var cur = node && node.nodeType === 3 ? node.parentElement : node;
      while (cur && (typeof document === 'undefined' || cur !== document.body)) {
        if (isNonComposerProtectedSelf(cur)) return true;
        cur = cur.parentElement;
      }
      return false;
    }

    function setTranslatedAttribute(el, attr, targetVal) {
      if (!el || !el.getAttribute || !el.setAttribute) return;
      var curVal = el.getAttribute(attr);
      if (!curVal) return;
      var saved = originalAttrs ? originalAttrs.get(el) : null;
      if (originalAttrs && (!saved || saved[attr] === undefined)) {
        var map = saved || {};
        map[attr] = curVal;
        originalAttrs.set(el, map);
      }
      if (curVal !== targetVal) {
        el.setAttribute(attr, targetVal);
      }
      if (lastTranslatedAttrs) {
        var lmap = lastTranslatedAttrs.get(el) || {};
        lmap[attr] = { val: targetVal, epoch: currentEpoch };
        lastTranslatedAttrs.set(el, lmap);
      }
    }

    function translateComposerLabel(node, skipAncestorCheck) {
      if (!node || node.nodeType !== 1 || !node.getAttribute) return;
      if (!engine.isEnabled()) {
        restoreAttributes(node);
        return;
      }
      var label = node.getAttribute('aria-label');
      if (!label) return;
      var lastMap = lastTranslatedAttrs ? lastTranslatedAttrs.get(node) : null;
      var lastEntry = lastMap ? lastMap['aria-label'] : null;
      if (lastEntry && lastEntry.epoch === currentEpoch && lastEntry.val === label) return;

      var saved = originalAttrs ? originalAttrs.get(node) : null;
      var srcLabel = (saved && saved['aria-label'] !== undefined && lastEntry && lastEntry.val === label)
        ? saved['aria-label']
        : label;

      var trimmed = srcLabel.trim();
      var upperTag = (node.tagName || '').toUpperCase();
      var eligible = false;
      if (COMPOSER_ARIA_ALLOWED.has(trimmed)) {
        var role = node.getAttribute('role');
        eligible = role === 'textbox' || role === 'combobox' || upperTag === 'TEXTAREA';
      } else if (VOICE_BUTTON_ARIA_ALLOWED.has(trimmed)) {
        eligible = upperTag === 'BUTTON';
      }
      if (!eligible || (!skipAncestorCheck && isProtectedFromComposerLabel(node))) return;
      var translated = engine.translateText(srcLabel);
      if (translated && translated !== srcLabel) {
        setTranslatedAttribute(node, 'aria-label', translated);
      }
    }

    function isEditableSurface(node) {
      if (!node || node.nodeType !== 1) return false;
      return Boolean(node.isContentEditable || (node.getAttribute && (
        node.getAttribute('contenteditable') === 'true' ||
        node.getAttribute('data-lexical-editor') === 'true'
      )));
    }

    function isComposerSubtreeRoot(node) {
      if (!node || node.nodeType !== 1) return false;
      if (node.classList && (node.classList.contains('chat-input') || node.classList.contains('input-area'))) {
        return true;
      }
      return isEditableSurface(node) || Boolean(node.getAttribute && (
        node.getAttribute('role') === 'textbox' ||
        node.getAttribute('role') === 'combobox'
      ));
    }

    function translateComposerLabelsInSubtree(rootNode) {
      if (!rootNode || rootNode.nodeType !== 1) return;
      if (isProtectedFromComposerLabel(rootNode)) return;
      function walkComposer(el) {
        if (!el || el.nodeType !== 1 || isNonComposerProtectedSelf(el)) return;
        translateComposerLabel(el, true);
        // Prune immediately at contenteditable / Lexical editor surface to never traverse pasted drafts
        if (isEditableSurface(el)) return;
        if (el.shadowRoot) {
          observeRoot(el.shadowRoot);
          var srChildren = el.shadowRoot.childNodes;
          for (var s = 0; srChildren && s < srChildren.length; s++) {
            walkComposer(srChildren[s]);
          }
        }
        var children = el.childNodes;
        for (var i = 0; children && i < children.length; i++) {
          walkComposer(children[i]);
        }
      }
      walkComposer(rootNode);
    }

    function processAttributes(el, attrSubset) {
      if (!el || el.nodeType !== 1) return;
      var upperTag = (el.tagName || '').toUpperCase();
      var isInputLike = upperTag === 'INPUT' || upperTag === 'TEXTAREA';
      if (isInputLike) {
        if (el.parentElement && shouldIgnoreElement(el.parentElement)) {
          translateComposerLabel(el, false);
          return;
        }
      } else if (shouldIgnoreElement(el)) {
        if (isComposerSubtreeRoot(el)) translateComposerLabelsInSubtree(el);
        else translateComposerLabel(el, false);
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

    function setCombinedTextValue(tNode, nextVal) {
      if (!tNode || tNode.nodeType !== 3) return;
      if (originalTexts && !originalTexts.has(tNode)) {
        originalTexts.set(tNode, tNode.nodeValue || '');
      }
      if (tNode.nodeValue !== nextVal) {
        tNode.nodeValue = nextVal;
      }
      if (lastTranslatedTexts) {
        lastTranslatedTexts.set(tNode, { val: nextVal, epoch: currentEpoch });
      }
    }

    function tryCombinedSentenceTranslation(element) {
      if (!engine.isEnabled() || !element || element.nodeType !== 1) return false;
      if (shouldIgnoreElement(element)) return false;
      var children = element.childNodes ? Array.prototype.slice.call(element.childNodes) : [];
      if (children.length < 2) return false;

      var slots = [];
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child.nodeType === 3) {
          if (!(child.nodeValue || '').trim()) {
            slots.push({ type: 'space', node: child });
            continue;
          }
          slots.push({ type: 'text', node: child });
        } else if (child.nodeType === 1) {
          if (!child.childNodes || child.childNodes.length !== 1 || !child.firstChild || child.firstChild.nodeType !== 3) {
            return false;
          }
          var anchorTag = (child.tagName || '').toUpperCase();
          var isProtectedAnchor = CODE_OR_LITERAL_TAGS.has(anchorTag) || shouldIgnoreElement(child);
          slots.push({
            type: 'anchor',
            node: child,
            anchorText: (child.firstChild.nodeValue || '').trim(),
            isProtectedAnchor: isProtectedAnchor
          });
        } else {
          return false;
        }
      }

      var anchors = slots.filter(function (s) { return s.type === 'anchor'; });
      var isTW = engine.getLanguage() === 'zh-TW';
      if (!anchors.length) {
        // React 3-text-node preservation: {"Site data cleared for "}{host}{"."} / {"Could not clear site data for "}{host}{"."}
        if (children.length === 3 && children.every(function (c) { return c.nodeType === 3; })) {
          var pre = (children[0].nodeValue || '').trim();
          var mid = (children[1].nodeValue || '').trim();
          var post = (children[2].nodeValue || '').trim();
          if (mid && (post === '.' || post === '。' || post === '')) {
            if (/^Site data cleared for$/i.test(pre)) {
              setCombinedTextValue(children[0], '已清除 ');
              if (lastTranslatedTexts) lastTranslatedTexts.set(children[1], { val: children[1].nodeValue, epoch: currentEpoch });
              setCombinedTextValue(children[2], isTW ? ' 的網站資料。' : ' 的站点数据。');
              return true;
            }
            if (/^Could not clear site data for$/i.test(pre)) {
              setCombinedTextValue(children[0], isTW ? '無法清除 ' : '无法清除 ');
              if (lastTranslatedTexts) lastTranslatedTexts.set(children[1], { val: children[1].nodeValue, epoch: currentEpoch });
              setCombinedTextValue(children[2], isTW ? ' 的網站資料。' : ' 的站点数据。');
              return true;
            }
          }
        }
        return false;
      }

      var fullText = '';
      for (var k = 0; k < children.length; k++) {
        fullText += children[k].nodeType === 3 ? (children[k].nodeValue || '') : (children[k].textContent || '');
      }
      var key = fullText.trim();
      if (!key || !/[A-Za-z]/.test(key)) return false;

      var translated = engine.translateText(key);
      if (!translated || translated === key) return false;

      var probe = 0;
      for (var aIdx = 0; aIdx < anchors.length; aIdx++) {
        var a = anchors[aIdx];
        if (!a.anchorText || a.anchorText.length < 2) return false;
        var idx = translated.indexOf(a.anchorText, probe);
        var matchedText = a.anchorText;
        var shouldTranslateAnchor = false;
        if (idx < 0 && !a.isProtectedAnchor) {
          var anchorCn = engine.translateText(a.anchorText);
          if (anchorCn && anchorCn !== a.anchorText && anchorCn.length >= 2) {
            idx = translated.indexOf(anchorCn, probe);
            if (idx >= 0) {
              matchedText = anchorCn;
              shouldTranslateAnchor = true;
            }
          }
        }
        if (idx < 0) return false;
        a.start = idx;
        a.end = idx + matchedText.length;
        a.newAnchorText = shouldTranslateAnchor ? matchedText : null;
        probe = a.end;
      }

      var anchorCursor = 0;
      var consumed = 0;
      for (var sIdx = 0; sIdx < slots.length; sIdx++) {
        var s = slots[sIdx];
        if (s.type === 'anchor') {
          var anc = anchors[anchorCursor];
          if (anc.newAnchorText) {
            setCombinedTextValue(s.node.firstChild, anc.newAnchorText);
          } else if (lastTranslatedTexts && s.node.firstChild) {
            lastTranslatedTexts.set(s.node.firstChild, { val: s.node.firstChild.nodeValue || '', epoch: currentEpoch });
          }
          consumed = anc.end;
          anchorCursor++;
          continue;
        }
        if (s.type === 'space') {
          setCombinedTextValue(s.node, '');
          continue;
        }
        var segEnd = anchorCursor < anchors.length ? anchors[anchorCursor].start : translated.length;
        var segVal = translated.slice(consumed, segEnd);
        setCombinedTextValue(s.node, segVal);
        consumed = segEnd;
      }
      return true;
    }

    function collectSafeLeafTextNodes(rootEl, out) {
      if (!rootEl || !rootEl.childNodes) return;
      for (var i = 0; i < rootEl.childNodes.length; i++) {
        var ch = rootEl.childNodes[i];
        if (ch.nodeType === 3) {
          if (ch.nodeValue && ch.nodeValue.trim()) {
            out.push(ch);
          }
        } else if (ch.nodeType === 1) {
          if (isNonComposerProtectedSelf(ch)) continue;
          collectSafeLeafTextNodes(ch, out);
        }
      }
    }

    function tryConvergeEmptyState(el) {
      if (!engine.isEnabled() || !el || el.nodeType !== 1 || shouldIgnoreElement(el)) return false;
      var leafTexts = [];
      collectSafeLeafTextNodes(el, leafTexts);
      if (leafTexts.length >= 1 && leafTexts.length <= 8) {
        var joinedLeafText = leafTexts.map(function (t) { return t.nodeValue || ''; }).join('').trim();
        var emptyStateMatch = joinedLeafText.match(/^No\s+(automations?|automation|自动化|自動化|conversations?|conversation|对话|對話|groups?|group|分组|分組)\s+yet[.。]?$/i);
        if (emptyStateMatch) {
          var isTW = engine.getLanguage() === 'zh-TW';
          var emptyStateMap = isTW
            ? { automations: '暫無自動化', automation: '暫無自動化', '自动化': '暫無自動化', '自動化': '暫無自動化', conversations: '暫無對話', conversation: '暫無對話', '对话': '暫無對話', '對話': '暫無對話', groups: '暫無分組', group: '暫無分組', '分组': '暫無分組', '分組': '暫無分組' }
            : { automations: '暂无自动化', automation: '暂无自动化', '自动化': '暂无自动化', '自動化': '暂无自动化', conversations: '暂无对话', conversation: '暂无对话', '对话': '暂无对话', '對話': '暂无对话', groups: '暂无分组', group: '暂无分组', '分组': '暂无分组', '分組': '暂无分组' };
          var targetText = emptyStateMap[emptyStateMatch[1].toLowerCase()] || (isTW ? '暫無自動化' : '暂无自动化');
          setCombinedTextValue(leafTexts[0], targetText);
          for (var i = 1; i < leafTexts.length; i++) {
            setCombinedTextValue(leafTexts[i], '');
          }
          return true;
        }
      }
      return false;
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

    function processElementNode(el) {
      var upperTag = (el.tagName || '').toUpperCase();
      if (upperTag === 'INPUT' || upperTag === 'TEXTAREA') {
        processAttributes(el);
        return false;
      }
      if (shouldIgnoreElement(el)) {
        if (isComposerSubtreeRoot(el)) translateComposerLabelsInSubtree(el);
        else translateComposerLabel(el, false);
        return false;
      }
      processAttributes(el);
      if (el.shadowRoot) {
        observeRoot(el.shadowRoot);
        walkAndTranslate(el.shadowRoot);
      }
      if (tryConvergeEmptyState(el)) return false;
      tryCombinedSentenceTranslation(el);
      tryHealFragmentedText(el);
      return true;
    }

    function walkAndTranslate(rootEl) {
      if (!rootEl) return;
      if (rootEl.nodeType === 3) {
        processTextNode(rootEl);
        return;
      }
      if (rootEl.nodeType !== 1 && rootEl.nodeType !== 11 /* DOCUMENT_FRAGMENT_NODE */) return;

      if (rootEl.nodeType === 1) {
        if (!processElementNode(rootEl)) return;
      }

      if (typeof document.createTreeWalker === 'function') {
        var composerRoots = [];
        var composerSingles = [];
        var walker = document.createTreeWalker(rootEl, 5 /* SHOW_ELEMENT | SHOW_TEXT */, {
          acceptNode: function (node) {
            if (node.nodeType === 1) {
              var nt = (node.tagName || '').toUpperCase();
              if (nt === 'INPUT' || nt === 'TEXTAREA') return 1 /* FILTER_ACCEPT */;
              if (shouldIgnoreElement(node)) {
                if (isComposerSubtreeRoot(node)) composerRoots.push(node);
                else if (node.getAttribute && node.getAttribute('aria-label')) composerSingles.push(node);
                return 2 /* FILTER_REJECT (skips whole subtree!) */;
              }
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
              if (!tryConvergeEmptyState(current)) {
                if (!tryCombinedSentenceTranslation(current)) {
                  tryHealFragmentedText(current);
                }
              }
            }
          } else if (current.nodeType === 3) {
            processTextNode(current);
          }
          current = walker.nextNode();
        }
        for (var cr = 0; cr < composerRoots.length; cr++) translateComposerLabelsInSubtree(composerRoots[cr]);
        for (var cs = 0; cs < composerSingles.length; cs++) translateComposerLabel(composerSingles[cs], false);
      } else {
        var chs = rootEl.childNodes;
        for (var i = 0; chs && i < chs.length; i++) {
          walkAndTranslate(chs[i]);
        }
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

    function drainBatchedSets(addedSet, textSet, attrMap) {
      if (attrMap.size > 0) {
        attrMap.forEach(function (attrSet, target) {
          processAttributes(target, Array.from(attrSet));
        });
        attrMap.clear();
      }
      if (textSet.size > 0) {
        textSet.forEach(function (tNode) {
          processTextNode(tNode);
        });
        textSet.clear();
      }
      if (addedSet.size > 0) {
        var roots = [];
        addedSet.forEach(function (node) {
          var hasAnc = false;
          var p = node.parentElement;
          while (p) {
            if (addedSet.has(p)) {
              hasAnc = true;
              break;
            }
            p = p.parentElement;
          }
          if (!hasAnc) roots.push(node);
        });
        addedSet.clear();
        for (var i = 0; i < roots.length; i++) {
          walkAndTranslate(roots[i]);
        }
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
        drainBatchedSets(pendingAddedNodes, pendingTextNodes, pendingAttrNodes);
      });
    }

    function flushPortalBatch() {
      portalDebounceTimer = null;
      if (isApplying || !engine.isEnabled()) {
        pendingPortalNodes.clear();
        pendingPortalTextNodes.clear();
        pendingPortalAttrNodes.clear();
        return;
      }
      runWithoutObserver(function () {
        drainBatchedSets(pendingPortalNodes, pendingPortalTextNodes, pendingPortalAttrNodes);
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

    function schedulePortalBatch() {
      if (portalDebounceTimer) clearTimeout(portalDebounceTimer);
      portalDebounceTimer = setTimeout(flushPortalBatch, PORTAL_DEBOUNCE_MS);
    }

    function isPortalMutationNode(node) {
      if (!node) return false;
      var el = node.nodeType === 3 ? node.parentElement : node;
      if (!el || el.nodeType !== 1) return false;
      if (typeof el.closest === 'function') {
        try {
          if (el.closest('[data-base-ui-portal], [data-hover-card-popup]')) return true;
        } catch (_e) {}
      }
      var cur = el;
      while (cur && (typeof document === 'undefined' || cur !== document.body)) {
        if (hasAttr(cur, 'data-base-ui-portal') || hasAttr(cur, 'data-hover-card-popup')) return true;
        cur = cur.parentElement;
      }
      return false;
    }

    function ensureObserver() {
      if (!observer && typeof MutationObserver === 'function') {
        observer = new MutationObserver(function (mutations) {
          if (isApplying || !engine.isEnabled()) return;
          var anyMain = false;
          var anyPortal = false;
          for (var i = 0; i < mutations.length; i++) {
            var m = mutations[i];
            if (m.type === 'childList') {
              for (var j = 0; j < m.addedNodes.length; j++) {
                var added = m.addedNodes[j];
                if (skipCache && added && added.nodeType === 1) skipCache.delete(added);
                if (added.shadowRoot) observeRoot(added.shadowRoot);
                if (isPortalMutationNode(added) || isPortalMutationNode(m.target)) {
                  pendingPortalNodes.add(added);
                  anyPortal = true;
                } else {
                  pendingAddedNodes.add(added);
                  anyMain = true;
                }
              }
            } else if (m.type === 'characterData') {
              if (isPortalMutationNode(m.target)) {
                pendingPortalTextNodes.add(m.target);
                anyPortal = true;
              } else {
                pendingTextNodes.add(m.target);
                anyMain = true;
              }
            } else if (m.type === 'attributes') {
              var isP = isPortalMutationNode(m.target);
              var targetAttrMap = isP ? pendingPortalAttrNodes : pendingAttrNodes;
              var set = targetAttrMap.get(m.target);
              if (!set) {
                set = new Set();
                targetAttrMap.set(m.target, set);
              }
              set.add(m.attributeName);
              if (isP) anyPortal = true;
              else anyMain = true;
            }
          }
          if (anyMain) scheduleBatch();
          if (anyPortal) schedulePortalBatch();
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

    // Hover Tooltip / Radix Portal / Base UI Portal / HoverCard / Floating UI / ContextMenu scanner
    var FLOATING_PORTAL_SEL = '[role="tooltip"], [role="menu"], [role="dialog"], [data-floating-ui-portal], [data-radix-popper-content-wrapper], [data-base-ui-portal], [data-hover-card-popup], .popover, .tooltip, .context-view, .monaco-hover';

    function isFloatingElement(el) {
      if (!el || el.nodeType !== 1) return false;
      if (el === document.body || el === document.documentElement || el.id === 'workbench') return false;
      var cls = typeof el.className === 'string' ? el.className : '';
      if (cls.indexOf('monaco-workbench') !== -1) return false;
      if (el.matches) {
        try {
          if (el.matches(FLOATING_PORTAL_SEL)) {
            return true;
          }
        } catch (_e) {}
      }
      var role = el.getAttribute ? el.getAttribute('role') : '';
      if (role === 'tooltip' || role === 'menu' || role === 'dialog') return true;
      if (hasAttr(el, 'data-floating-ui-portal') || hasAttr(el, 'data-radix-popper-content-wrapper') || hasAttr(el, 'data-base-ui-portal') || hasAttr(el, 'data-hover-card-popup')) {
        return true;
      }
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
        if (typeof document.querySelectorAll === 'function') {
          var portals = document.querySelectorAll(FLOATING_PORTAL_SEL);
          for (var i = 0; i < portals.length; i++) {
            walkAndTranslate(portals[i]);
          }
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
      if (typeof document.addEventListener === 'function') {
        document.addEventListener('contextmenu', onHoverOrContext, { capture: true, passive: true });
      }
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
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

    if (document.readyState === 'loading' && typeof document.addEventListener === 'function') {
      document.addEventListener('DOMContentLoaded', bootListeners);
    } else {
      bootListeners();
    }

    var controller = {
      engine: engine,
      runFullScan: runFullScan,
      applyPayload: applyPayload,
      translateText: engine.translateText,
      tryCombinedSentenceTranslation: tryCombinedSentenceTranslation,
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
    initPreloadI18n: initPreloadI18n,
    mountDomI18n: initPreloadI18n
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_I18N_MODULE__ = exportsObj;
  }
})(typeof window !== 'undefined' ? window : globalThis);
