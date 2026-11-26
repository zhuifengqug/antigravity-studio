(function (globalScope) {
  'use strict';

  var DICT_ZH_CN = {
    // Left navigation & workspace chrome
    'Home': '首页',
    'Studio': '工作台',
    'Chat': '对话',
    'Stream': '实时流',
    'Stream Realtime': '实时音视频交互',
    'Generate Media': '媒体生成',
    'Generate media': '媒体生成',
    'Build': '构建应用',
    'Dashboard': '控制台',
    'History': '历史记录',
    'My Library': '我的资料库',
    'My library': '我的资料库',
    'Library': '资料库',
    'Starter apps': '示例应用',
    'Gallery': '画廊',
    'Showcase': '展示柜',
    'Create new prompt': '新建提示词',
    'New prompt': '新提示词',
    'New chat': '新对话',
    'Create prompt': '创建提示词',
    'Untitled prompt': '未命名提示词',
    'Untitled': '未命名',
    'Get API key': '获取 API 密钥',
    'API keys': 'API 密钥',
    'API key': 'API 密钥',
    'Create API key': '创建 API 密钥',
    'Copy API key': '复制 API 密钥',
    'Documentation': '文档',
    'API docs': 'API 文档',
    'Usage & Billing': '用量与计费',
    'Usage and Billing': '用量与计费',
    'Usage': '用量统计',
    'Billing': '计费',
    'Logs': '调用日志',
    'Settings': '设置',
    'Changelog': '更新日志',
    'Pricing': '价格说明',
    'Feedback': '意见反馈',
    'Send feedback': '发送反馈',
    'Whats new': '最新动态',
    "What's new": '最新动态',
    'Open in Drive': '在云端硬盘中打开',
    'Save': '保存',
    'Saved': '已保存',
    'Saving...': '正在保存...',
    'Unsaved changes': '有未保存的更改',
    'Share': '分享',
    'Make a copy': '创建副本',
    'Duplicate': '复制副本',
    'Delete': '删除',
    'Rename': '重命名',
    'Download': '下载',
    'Export': '导出',
    'Compare': '对比模式',
    'Compare mode': '对比模式',
    'Get code': '获取代码',
    'View code': '查看代码',
    'Terms of Service': '服务条款',
    'Privacy Policy': '隐私政策',
    'Help': '帮助',
    'Switch to dark theme': '切换至深色主题',
    'Switch to light theme': '切换至浅色主题',
    'Appearance': '外观',
    'Theme': '主题',
    'Dark': '深色',
    'Light': '浅色',
    'System': '跟随系统',

    // Right Run settings panel
    'Run settings': '运行设置',
    'Model': '模型',
    'Select a model': '选择模型',
    'Token count': 'Token 计数',
    'Tokens': 'Tokens',
    'Temperature': '随机性 (Temperature)',
    'Top P': '核采样 (Top P)',
    'Top K': 'Top K',
    'Output length': '最大输出长度',
    'Max output tokens': '最大输出 Token 数',
    'Thinking': '深度思考',
    'Thinking mode': '思考模式',
    'Thinking budget': '思考预算',
    'Thinking level': '推理等级',
    'Set thinking budget': '设置思考预算',
    'Reasoning': '推理',
    'Tools': '工具能力',
    'Structured output': '结构化输出',
    'Structured outputs': '结构化输出',
    'Edit': '编辑',
    'Code execution': '代码执行',
    'Function calling': '函数调用',
    'Grounding with Google Search': 'Google 搜索联网依据',
    'Google Search': 'Google 搜索联网',
    'URL context': 'URL 网页上下文',
    'URL context tool': 'URL 网页读取工具',
    'Safety settings': '安全设置',
    'Edit safety settings': '编辑安全设置',
    'Advanced settings': '高级设置',
    'Stop sequences': '停止词序列',
    'Add stop sequence': '添加停止词',
    'Media resolution': '媒体分辨率',
    'Resolution': '分辨率',
    'Audio': '音频',
    'Video': '视频',
    'Images': '图像',
    'Low': '低',
    'Medium': '中',
    'High': '高',
    'Minimal': '极简',
    'Default': '默认',
    'Auto': '自动',
    'Off': '关闭',
    'On': '开启',
    'None': '无',
    'Reset': '重置',
    'Reset defaults': '恢复默认',
    'Close panel': '收起面板',

    // Prompt / Chat workspace & actions
    'System instructions': '系统指令',
    'System Instructions': '系统指令',
    'Optional tone and style instructions for the model': '可选：为模型设定角色、语气或输出规范',
    'Type something or tab to choose an example prompt': '输入内容，或按 Tab 选择示例提示词',
    'Start typing a prompt': '开始输入提示词...',
    'Ask anything': '随便问点什么...',
    'Enter a prompt here': '在此输入提示词',
    'Run': '运行',
    'Running': '运行中',
    'Stop': '停止',
    'Cancel run': '停止生成',
    'Add': '添加',
    'Insert': '插入',
    'Upload file': '上传本地文件',
    'Upload to Drive': '上传至 Google 云端硬盘',
    'Record audio': '录制音频',
    'Camera': '摄像头拍照',
    'Sample Media': '示例媒体',
    'My Drive': '我的云端硬盘',
    'Google Drive': 'Google 云端硬盘',
    'Thoughts': '思考过程',
    'Expand to view model thoughts': '展开查看模型思考过程',
    'Collapse': '收起',
    'Expand': '展开',
    'Copy': '复制',
    'Copied': '已复制',
    'Copy as markdown': '复制为 Markdown',
    'Copy text': '复制纯文本',
    'Rerun this turn': '重新运行本轮',
    'Rerun': '重新运行',
    'Branch from here': '从此处创建分支',
    'Delete turn': '删除本轮',
    'Clear chat': '清空对话',
    'Clear': '清空',
    'Apply': '应用',
    'Cancel': '取消',
    'Close': '关闭',
    'Done': '完成',
    'Confirm': '确认',
    'Continue': '继续',
    'Got it': '知道了',
    'Learn more': '了解更多',
    'Dismiss': '忽略',
    'Search': '搜索',
    'Filter': '筛选',
    'All': '全部',
    'Recent': '最近使用',
    'Starred': '已标星',
    'Shared with me': '与我共享',
    'Edit title': '编辑标题',
    'More options': '更多操作',
    'Open prompt': '打开提示词',

    // Media / Live / API Keys / Quotas
    'Aspect ratio': '画面比例',
    'Number of results': '生成数量',
    'Live': '实时对话',
    'Talk to Gemini': '语音对话 Gemini',
    'Share your screen': '共享屏幕',
    'Webcam': '摄像头',
    'Microphone': '麦克风',
    'Voice': '语音音色',
    'Project': '所属项目',
    'Projects': '项目列表',
    'Quota': '配额',
    'Rate limits': '速率限制',
    'Free tier': '免费层级',
    'Pay-as-you-go': '按量付费',
    'Paid tier': '付费层级',
    'No prompts yet': '暂无提示词记录',
    'User': '用户',
    'Model output': '模型输出',
    'Show more': '显示更多',
    'Show less': '收起',
    'Enable': '启用',
    'Disable': '停用',
    'Enabled': '已启用',
    'Disabled': '已停用',
    'Experimental': '实验性',
    'Preview': '预览版',
    'New': '新'
  };

  var DICT_ZH_TW = {
    'Home': '首頁',
    'Studio': '工作台',
    'Chat': '對話',
    'Stream': '即時串流',
    'Stream Realtime': '即時音訊視訊互動',
    'Generate Media': '媒體生成',
    'Generate media': '媒體生成',
    'Build': '建置應用',
    'Dashboard': '控制台',
    'History': '歷史記錄',
    'My Library': '我的資料庫',
    'My library': '我的資料庫',
    'Library': '資料庫',
    'Starter apps': '範例應用',
    'Gallery': '畫廊',
    'Showcase': '展示區',
    'Create new prompt': '建立新提示詞',
    'New prompt': '新提示詞',
    'New chat': '新對話',
    'Create prompt': '建立提示詞',
    'Untitled prompt': '未命名提示詞',
    'Untitled': '未命名',
    'Get API key': '取得 API 金鑰',
    'API keys': 'API 金鑰',
    'API key': 'API 金鑰',
    'Create API key': '建立 API 金鑰',
    'Copy API key': '複製 API 金鑰',
    'Documentation': '技術文件',
    'API docs': 'API 文件',
    'Usage & Billing': '用量與帳務',
    'Usage and Billing': '用量與帳務',
    'Usage': '用量統計',
    'Billing': '帳務',
    'Logs': '呼叫記錄',
    'Settings': '設定',
    'Changelog': '更新日誌',
    'Pricing': '價格說明',
    'Feedback': '意見回饋',
    'Send feedback': '傳送意見回饋',
    'Whats new': '最新動態',
    "What's new": '最新動態',
    'Open in Drive': '在雲端硬碟中開啟',
    'Save': '儲存',
    'Saved': '已儲存',
    'Saving...': '正在儲存...',
    'Unsaved changes': '有未儲存的變更',
    'Share': '分享',
    'Make a copy': '建立副本',
    'Duplicate': '複製副本',
    'Delete': '刪除',
    'Rename': '重新命名',
    'Download': '下載',
    'Export': '匯出',
    'Compare': '對比模式',
    'Compare mode': '對比模式',
    'Get code': '取得程式碼',
    'View code': '檢視程式碼',
    'Terms of Service': '服務條款',
    'Privacy Policy': '隱私權政策',
    'Help': '說明',
    'Switch to dark theme': '切換為深色主題',
    'Switch to light theme': '切換為淺色主題',
    'Appearance': '外觀',
    'Theme': '主題',
    'Dark': '深色',
    'Light': '淺色',
    'System': '跟隨系統',
    'Run settings': '執行設定',
    'Model': '模型',
    'Select a model': '選擇模型',
    'Token count': 'Token 計數',
    'Tokens': 'Tokens',
    'Temperature': '隨機性 (Temperature)',
    'Top P': '核採樣 (Top P)',
    'Top K': 'Top K',
    'Output length': '最大輸出長度',
    'Max output tokens': '最大輸出 Token 數',
    'Thinking': '深度思考',
    'Thinking mode': '思考模式',
    'Thinking budget': '思考預算',
    'Thinking level': '推論等級',
    'Set thinking budget': '設定思考預算',
    'Reasoning': '推論',
    'Tools': '工具能力',
    'Structured output': '結構化輸出',
    'Structured outputs': '結構化輸出',
    'Edit': '編輯',
    'Code execution': '程式碼執行',
    'Function calling': '函式呼叫',
    'Grounding with Google Search': 'Google 搜尋連網依據',
    'Google Search': 'Google 搜尋連網',
    'URL context': 'URL 網頁上下文',
    'URL context tool': 'URL 網頁讀取工具',
    'Safety settings': '安全性設定',
    'Edit safety settings': '編輯安全性設定',
    'Advanced settings': '進階設定',
    'Stop sequences': '停止詞序列',
    'Add stop sequence': '新增停止詞',
    'Media resolution': '媒體解析度',
    'Resolution': '解析度',
    'Audio': '音訊',
    'Video': '視訊',
    'Images': '圖片',
    'Low': '低',
    'Medium': '中',
    'High': '高',
    'Minimal': '極簡',
    'Default': '預設',
    'Auto': '自動',
    'Off': '關閉',
    'On': '開啟',
    'None': '無',
    'Reset': '重設',
    'Reset defaults': '恢復預設',
    'Close panel': '收合面板',
    'System instructions': '系統指令',
    'System Instructions': '系統指令',
    'Optional tone and style instructions for the model': '選填：為模型設定角色、語氣或輸出規範',
    'Type something or tab to choose an example prompt': '輸入內容，或按 Tab 選擇範例提示詞',
    'Start typing a prompt': '開始輸入提示詞...',
    'Ask anything': '隨便問點什麼...',
    'Enter a prompt here': '在此輸入提示詞',
    'Run': '執行',
    'Running': '執行中',
    'Stop': '停止',
    'Cancel run': '停止產生',
    'Add': '新增',
    'Insert': '插入',
    'Upload file': '上傳本機檔案',
    'Upload to Drive': '上傳至 Google 雲端硬碟',
    'Record audio': '錄製音訊',
    'Camera': '相機拍照',
    'Sample Media': '範例媒體',
    'My Drive': '我的雲端硬碟',
    'Google Drive': 'Google 雲端硬碟',
    'Thoughts': '思考過程',
    'Expand to view model thoughts': '展開檢視模型思考過程',
    'Collapse': '收合',
    'Expand': '展開',
    'Copy': '複製',
    'Copied': '已複製',
    'Copy as markdown': '複製為 Markdown',
    'Copy text': '複製純文字',
    'Rerun this turn': '重新執行本輪',
    'Rerun': '重新執行',
    'Branch from here': '從此處建立分支',
    'Delete turn': '刪除本輪',
    'Clear chat': '清空對話',
    'Clear': '清空',
    'Apply': '套用',
    'Cancel': '取消',
    'Close': '關閉',
    'Done': '完成',
    'Confirm': '確認',
    'Continue': '繼續',
    'Got it': '知道了',
    'Learn more': '瞭解更多',
    'Dismiss': '略過',
    'Search': '搜尋',
    'Filter': '篩選',
    'All': '全部',
    'Recent': '最近使用',
    'Starred': '已加星號',
    'Shared with me': '與我共用',
    'Edit title': '編輯標題',
    'More options': '更多操作',
    'Open prompt': '開啟提示詞',
    'Aspect ratio': '畫面比例',
    'Number of results': '產生數量',
    'Live': '即時對話',
    'Talk to Gemini': '語音對話 Gemini',
    'Share your screen': '分享螢幕畫面',
    'Webcam': '攝影機',
    'Microphone': '麥克風',
    'Voice': '語音音色',
    'Project': '所屬專案',
    'Projects': '專案列表',
    'Quota': '配額',
    'Rate limits': '速率限制',
    'Free tier': '免費層級',
    'Pay-as-you-go': '依量計費',
    'Paid tier': '付費層級',
    'No prompts yet': '尚無提示詞記錄',
    'User': '使用者',
    'Model output': '模型輸出',
    'Show more': '顯示更多',
    'Show less': '收合',
    'Enable': '啟用',
    'Disable': '停用',
    'Enabled': '已啟用',
    'Disabled': '已停用',
    'Experimental': '實驗性',
    'Preview': '預覽版',
    'New': '新'
  };

  var REGEX_RULES = [
    {
      re: /^Thought\s+for\s+([\d.]+)\s*(?:s|sec|secs|second|seconds)$/i,
      zhCN: function (m) { return '已思考 ' + m[1] + ' 秒'; },
      zhTW: function (m) { return '已思考 ' + m[1] + ' 秒'; }
    },
    {
      re: /^Thinking\s+for\s+([\d.]+)\s*(?:s|sec|secs|second|seconds)\.{0,3}$/i,
      zhCN: function (m) { return '正在思考（' + m[1] + ' 秒）'; },
      zhTW: function (m) { return '正在思考（' + m[1] + ' 秒）'; }
    },
    {
      re: /^Run\s*\(([^)]+)\)$/i,
      zhCN: function (m) { return '运行 (' + m[1] + ')'; },
      zhTW: function (m) { return '執行 (' + m[1] + ')'; }
    },
    {
      re: /^Saved\s+(\d+)\s*m(?:in(?:utes?)?)?\s+ago$/i,
      zhCN: function (m) { return m[1] + ' 分钟前已保存'; },
      zhTW: function (m) { return m[1] + ' 分鐘前已儲存'; }
    },
    {
      re: /^Saved\s+(\d+)\s*h(?:(?:ou)?rs?)?\s+ago$/i,
      zhCN: function (m) { return m[1] + ' 小时前已保存'; },
      zhTW: function (m) { return m[1] + ' 小時前已儲存'; }
    },
    {
      re: /^Saved\s+just\s+now$/i,
      zhCN: function () { return '刚刚已保存'; },
      zhTW: function () { return '剛剛已儲存'; }
    }
  ];

  var TRANSLATABLE_ATTRS = ['placeholder', 'aria-label', 'title', 'data-tooltip'];
  var SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'PRE', 'CODE', 'KBD', 'SAMP', 'VAR', 'MAT-ICON', 'CANVAS'
  ]);
  var ICON_CLASS_TOKEN_RE = /^(?:codicon|google-symbols|mat-icon|material-icons(?:-[a-z0-9-]+)?|material-symbols(?:-[a-z0-9-]+)?|lucide(?:-[a-z0-9-]+)?)$/i;

  function hasIconClassToken(el) {
    if (!el || el.nodeType !== 1) return false;
    var i;
    if (el.classList && typeof el.classList.length === 'number') {
      for (i = 0; i < el.classList.length; i++) {
        if (ICON_CLASS_TOKEN_RE.test(el.classList[i])) return true;
      }
      return false;
    }
    var raw = typeof el.className === 'string'
      ? el.className
      : (el.className && typeof el.className.baseVal === 'string' ? el.className.baseVal : '');
    if (!raw) return false;
    var parts = raw.split(/\s+/);
    for (i = 0; i < parts.length; i++) {
      if (parts[i] && ICON_CLASS_TOKEN_RE.test(parts[i])) return true;
    }
    return false;
  }

  function hasAttr(el, name) {
    if (!el || el.nodeType !== 1) return false;
    if (el.hasAttribute) return el.hasAttribute(name);
    var v = el.getAttribute ? el.getAttribute(name) : null;
    return v !== null && v !== undefined;
  }

  function isThoughtHeaderElement(el) {
    var cur = el;
    var depth = 0;
    while (cur && depth < 4) {
      if (cur.nodeType === 1) {
        var tag = (cur.tagName || '').toUpperCase();
        var cls = typeof cur.className === 'string' ? cur.className : '';
        if (
          (tag === 'BUTTON' || (cur.getAttribute && cur.getAttribute('role') === 'button')) &&
          (cls.indexOf('thought') !== -1 || /thoughts?/i.test(cur.textContent || ''))
        ) {
          return true;
        }
      }
      cur = cur.parentElement;
      depth++;
    }
    return false;
  }

  function shouldIgnoreAiStudioElement(el) {
    if (!el || el.nodeType !== 1) return false;
    var cur = el;
    var allowedThought = isThoughtHeaderElement(el);
    while (cur && (typeof document === 'undefined' || cur !== document.body)) {
      if (cur.nodeType !== 1) break;
      var tag = (cur.tagName || '').toUpperCase();
      if (SKIP_TAGS.has(tag)) return true;
      if (hasIconClassToken(cur)) return true;
      if (cur.isContentEditable) return true;
      if (cur.getAttribute) {
        if (
          cur.getAttribute('contenteditable') === 'true' ||
          cur.getAttribute('role') === 'textbox' ||
          cur.getAttribute('data-ag-studio-ignore') === 'true'
        ) {
          return true;
        }
        var turnRole = cur.getAttribute('data-turn-role');
        if (!allowedThought && (turnRole === 'user' || turnRole === 'model')) {
          return true;
        }
      }
      if (tag === 'MS-TEXT-CHUNK' && !allowedThought) {
        return true;
      }
      if (cur.classList) {
        if (
          cur.classList.contains('monaco-editor') ||
          cur.classList.contains('cm-editor') ||
          cur.classList.contains('hljs') ||
          cur.classList.contains('code-block') ||
          cur.classList.contains('markdown-body') ||
          (!allowedThought && cur.classList.contains('turn-content'))
        ) {
          return true;
        }
      }
      cur = cur.parentElement;
    }
    return false;
  }

  function createAiStudioTranslator(initialLang) {
    var lang = initialLang || 'zh-CN';
    var lowerMapCN = new Map();
    var lowerMapTW = new Map();

    Object.keys(DICT_ZH_CN).forEach(function (k) {
      var lk = k.toLowerCase();
      if (!lowerMapCN.has(lk)) lowerMapCN.set(lk, DICT_ZH_CN[k]);
    });
    Object.keys(DICT_ZH_TW).forEach(function (k) {
      var lk = k.toLowerCase();
      if (!lowerMapTW.has(lk)) lowerMapTW.set(lk, DICT_ZH_TW[k]);
    });

    function setLanguage(nextLang) {
      lang = nextLang === 'zh-TW' ? 'zh-TW' : nextLang === 'en' ? 'en' : 'zh-CN';
    }

    function translateText(raw) {
      if (!raw || typeof raw !== 'string') return raw;
      if (lang === 'en') return raw;
      var trimmed = raw.trim();
      if (!trimmed || trimmed.length < 2 || trimmed.length > 260) return raw;
      if (!/[a-zA-Z]/.test(trimmed)) return raw;

      var isTW = lang === 'zh-TW';
      var dict = isTW ? DICT_ZH_TW : DICT_ZH_CN;
      var lmap = isTW ? lowerMapTW : lowerMapCN;

      var out = dict[trimmed];
      if (out === undefined) {
        out = lmap.get(trimmed.toLowerCase());
      }
      if (out === undefined) {
        for (var i = 0; i < REGEX_RULES.length; i++) {
          var m = REGEX_RULES[i].re.exec(trimmed);
          if (m) {
            out = isTW ? REGEX_RULES[i].zhTW(m) : REGEX_RULES[i].zhCN(m);
            break;
          }
        }
      }
      if (out === undefined || out === trimmed) return raw;

      var idx = raw.indexOf(trimmed);
      if (idx === -1) return out;
      return raw.slice(0, idx) + out + raw.slice(idx + trimmed.length);
    }

    return {
      setLanguage: setLanguage,
      getLanguage: function () { return lang; },
      isEnabled: function () { return lang !== 'en'; },
      translateText: translateText
    };
  }

  function mountAiStudioI18n(initialLang, options) {
    var opts = options || {};
    var doc = opts.document || (typeof document !== 'undefined' ? document : null);
    var translator = createAiStudioTranslator(initialLang || 'zh-CN');
    var originalTexts = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
    var lastTranslatedTexts = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
    var originalAttrs = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
    var lastTranslatedAttrs = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
    var observer = null;
    var isApplying = false;
    var scheduled = false;
    var pendingNodes = new Set();
    var epoch = 0;

    function restoreTextNode(node) {
      if (!originalTexts || !originalTexts.has(node)) return;
      var orig = originalTexts.get(node);
      if (node.nodeValue !== orig) node.nodeValue = orig;
      if (lastTranslatedTexts) lastTranslatedTexts.delete(node);
    }

    function restoreAttrs(el) {
      if (!originalAttrs || !originalAttrs.has(el)) return;
      var map = originalAttrs.get(el);
      Object.keys(map).forEach(function (attr) {
        if (el.getAttribute(attr) !== map[attr]) el.setAttribute(attr, map[attr]);
      });
      if (lastTranslatedAttrs) lastTranslatedAttrs.delete(el);
    }

    function processTextNode(node) {
      if (!node || node.nodeType !== 3) return;
      var parent = node.parentElement;
      if (parent && shouldIgnoreAiStudioElement(parent)) return;

      if (!translator.isEnabled()) {
        restoreTextNode(node);
        return;
      }

      var cur = node.nodeValue || '';
      var last = lastTranslatedTexts ? lastTranslatedTexts.get(node) : null;
      if (last && last.epoch === epoch && last.val === cur) return;

      var sourceText = cur;
      if (originalTexts && originalTexts.has(node)) {
        if (last && last.val === cur) {
          sourceText = originalTexts.get(node);
        } else {
          originalTexts.set(node, cur);
        }
      }

      var next = translator.translateText(sourceText);
      if (next !== sourceText) {
        if (originalTexts && !originalTexts.has(node)) originalTexts.set(node, sourceText);
        if (node.nodeValue !== next) node.nodeValue = next;
        if (lastTranslatedTexts) lastTranslatedTexts.set(node, { val: next, epoch: epoch });
      } else {
        if (cur !== sourceText) node.nodeValue = sourceText;
        if (lastTranslatedTexts) lastTranslatedTexts.set(node, { val: sourceText, epoch: epoch });
      }
    }

    function processAttributes(el) {
      if (!el || el.nodeType !== 1 || !el.getAttribute || !el.setAttribute) return;
      var tag = (el.tagName || '').toUpperCase();
      var isInput = tag === 'INPUT' || tag === 'TEXTAREA';
      if (!isInput && shouldIgnoreAiStudioElement(el)) return;

      if (!translator.isEnabled()) {
        restoreAttrs(el);
        return;
      }

      for (var i = 0; i < TRANSLATABLE_ATTRS.length; i++) {
        var attr = TRANSLATABLE_ATTRS[i];
        var val = el.getAttribute(attr);
        if (!val) continue;
        var lastMap = lastTranslatedAttrs ? lastTranslatedAttrs.get(el) : null;
        var lastEntry = lastMap ? lastMap[attr] : null;
        if (lastEntry && lastEntry.epoch === epoch && lastEntry.val === val) continue;

        var saved = originalAttrs ? originalAttrs.get(el) : null;
        var srcVal = (saved && saved[attr] !== undefined && lastEntry && lastEntry.val === val)
          ? saved[attr]
          : val;
        if (saved && lastEntry && lastEntry.val !== val) {
          saved[attr] = val;
        }
        var next = translator.translateText(srcVal);
        if (next !== srcVal) {
          if (originalAttrs) {
            var sMap = saved || {};
            if (sMap[attr] === undefined) sMap[attr] = srcVal;
            originalAttrs.set(el, sMap);
          }
          if (el.getAttribute(attr) !== next) el.setAttribute(attr, next);
          if (lastTranslatedAttrs) {
            var lMap = lastMap || {};
            lMap[attr] = { val: next, epoch: epoch };
            lastTranslatedAttrs.set(el, lMap);
          }
        }
      }
    }

    function walk(node) {
      if (!node) return;
      if (node.nodeType === 3) {
        processTextNode(node);
        return;
      }
      if (node.nodeType !== 1 && node.nodeType !== 11) return;
      if (node.nodeType === 1) {
        processAttributes(node);
        var tag = (node.tagName || '').toUpperCase();
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && shouldIgnoreAiStudioElement(node)) return;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      }
      var children = node.childNodes || [];
      for (var i = 0; i < children.length; i++) {
        walk(children[i]);
      }
    }

    function runFullScan() {
      if (!doc || !doc.body || isApplying) return;
      isApplying = true;
      try {
        walk(doc.body);
      } finally {
        isApplying = false;
      }
    }

    function flush() {
      scheduled = false;
      if (isApplying || !doc || !doc.body) {
        pendingNodes.clear();
        return;
      }
      isApplying = true;
      try {
        var list = Array.from(pendingNodes);
        pendingNodes.clear();
        for (var i = 0; i < list.length; i++) walk(list[i]);
      } finally {
        isApplying = false;
      }
    }

    function scheduleFlush() {
      if (scheduled) return;
      scheduled = true;
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(flush);
      } else {
        setTimeout(flush, 16);
      }
    }

    function startObserver() {
      if (observer || !doc || !doc.body || typeof MutationObserver !== 'function') return;
      observer = new MutationObserver(function (mutations) {
        if (isApplying) return;
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (m.type === 'childList') {
            for (var j = 0; j < m.addedNodes.length; j++) pendingNodes.add(m.addedNodes[j]);
          } else if (m.type === 'characterData') {
            pendingNodes.add(m.target);
          } else if (m.type === 'attributes') {
            pendingNodes.add(m.target);
          }
        }
        if (pendingNodes.size > 0) scheduleFlush();
      });
      observer.observe(doc.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: TRANSLATABLE_ATTRS
      });
    }

    function applyLanguage(nextLang) {
      epoch++;
      translator.setLanguage(nextLang);
      runFullScan();
    }

    function destroy() {
      if (observer) {
        try { observer.disconnect(); } catch (_e) {}
        observer = null;
      }
      pendingNodes.clear();
      translator.setLanguage('en');
      epoch++;
      runFullScan();
    }

    runFullScan();
    startObserver();

    var handle = {
      applyLanguage: applyLanguage,
      getLanguage: translator.getLanguage,
      translateText: translator.translateText,
      runFullScan: runFullScan,
      shouldIgnoreAiStudioElement: shouldIgnoreAiStudioElement,
      destroy: destroy
    };
    if (globalScope) globalScope.__AG_STUDIO_AISTUDIO_I18N__ = handle;
    return handle;
  }

  var exported = {
    DICT_ZH_CN: DICT_ZH_CN,
    DICT_ZH_TW: DICT_ZH_TW,
    REGEX_RULES: REGEX_RULES,
    shouldIgnoreAiStudioElement: shouldIgnoreAiStudioElement,
    createAiStudioTranslator: createAiStudioTranslator,
    mountAiStudioI18n: mountAiStudioI18n
  };

  if (globalScope && typeof globalScope.addEventListener === 'function' && !globalScope.__AG_STUDIO_AISTUDIO_I18N__) {
    globalScope.__AG_STUDIO_AISTUDIO_I18N__ = mountAiStudioI18n('zh-CN');
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_AISTUDIO_I18N_MOD__ = exported;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
})(typeof window !== 'undefined' ? window : globalThis);
