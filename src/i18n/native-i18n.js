'use strict';

const fs = require('fs');
const path = require('path');
const { ConfigStore } = require('../shared/config-store');

let currentLangOverride = null;
const dictCache = new Map();

// Complete Antigravity 2.35.2 Native Menu, Context Menu, System Tray & Dialog Vocabulary
// [en, zh-CN, zh-TW]
const NATIVE_ENTRIES = [
  // Top-level menus & standard Electron roles
  ['File', '文件', '檔案'],
  ['Edit', '编辑', '編輯'],
  ['Selection', '选择', '選取'],
  ['View', '视图', '檢視'],
  ['Go', '转到', '前往'],
  ['Run', '运行', '執行'],
  ['Terminal', '终端', '終端機'],
  ['Window', '窗口', '視窗'],
  ['Help', '帮助', '說明'],
  ['Services', '服务', '服務'],
  ['Hide Antigravity', '隐藏 Antigravity', '隱藏 Antigravity'],
  ['Hide Others', '隐藏其他', '隱藏其他'],
  ['Show All', '显示全部', '顯示全部'],
  ['Show Antigravity', '显示 Antigravity', '顯示 Antigravity'],
  ['Open Antigravity', '打开 Antigravity', '開啟 Antigravity'],
  ['Quit Antigravity', '退出 Antigravity', '結束 Antigravity'],
  ['About Antigravity', '关于 Antigravity', '關於 Antigravity'],
  ['New Window', '新建窗口', '新增視窗'],
  ['Close Window', '关闭窗口', '關閉視窗'],
  ['Close', '关闭', '關閉'],
  ['Quit', '退出', '結束'],
  ['Exit', '退出', '結束'],
  ['Minimize', '最小化', '最小化'],
  ['Maximize', '最大化', '最大化'],
  ['Undo', '撤销', '復原'],
  ['Redo', '重做', '重做'],
  ['Cut', '剪切', '剪下'],
  ['Copy', '复制', '複製'],
  ['Paste', '粘贴', '貼上'],
  ['Delete', '删除', '刪除'],
  ['Select All', '全选', '全選'],
  ['Reload', '重新加载', '重新載入'],
  ['Force Reload', '强制重新加载', '強制重新載入'],
  ['Toggle Developer Tools', '切换开发者工具', '切換開發人員工具'],
  ['Actual Size', '实际大小', '實際大小'],
  ['Zoom In', '放大', '放大'],
  ['Zoom Out', '缩小', '縮小'],
  ['Reset Zoom', '重置缩放', '重設縮放'],
  ['Toggle Full Screen', '切换全屏', '切換全螢幕'],
  ['Toggle Fullscreen', '切换全屏', '切換全螢幕'],
  ['Docs', '使用文档', '使用文件'],

  // Updater menu state machine & dialogs
  ['Check for Updates', '检查更新', '檢查更新'],
  ['Check for Updates...', '检查更新...', '檢查更新...'],
  ['Checking for Updates...', '正在检查更新...', '正在檢查更新...'],
  ['Downloading Update...', '正在下载更新...', '正在下載更新...'],
  ['Restart to Update', '重启以应用更新', '重新啟動以套用更新'],
  ['No updates available', '当前已是最新版本，暂无可用更新。', '目前已是最新版本，暫無可用更新。'],

  // Quit confirmation dialog
  ['Confirm Quit', '确认退出', '確認結束'],
  ['Are you sure you want to quit?', '您确定要退出吗？', '您確定要結束嗎？'],
  ['There may be agents or background tasks running.', '可能还有智能体或后台任务正在运行。', '可能還有代理或背景任務正在執行。'],
  ['Cancel', '取消', '取消'],
  ['OK', '确定', '確定'],

  // System Tray & Remote / WSL
  ['No agents running', '没有智能体在运行', '目前無執行中的代理'],
  ['Connect to WSL', '连接到 WSL', '連線至 WSL'],
  ['Reopen Locally', '在本地重新打开', '在本機重新開啟'],
  ['Switch to This Computer', '切换到本机', '切換至本機'],
  ['This Computer', '本机', '本機'],
  ['Connect to SSH Host', '连接到 SSH 主机', '連線至 SSH 主機'],
  ['Connect to SSH Host…', '连接到 SSH 主机…', '連線至 SSH 主機…'],
  ['SSH Host…', 'SSH 主机…', 'SSH 主機…'],
  ['SSH Host...', 'SSH 主机...', 'SSH 主機...'],
  ['Stop Server', '停止服务端', '停止伺服器端'],
  ['Stop SSH Server', '停止 SSH 服务端', '停止 SSH 伺服器端'],
  ['Stop SSH Server…', '停止 SSH 服务端…', '停止 SSH 伺服器端…'],
  ['Restart SSH Server', '重启 SSH 服务端', '重新啟動 SSH 伺服器端'],
  ['Disconnect', '断开连接', '中斷連線'],

  // App menu & workspace / conversation commands (2.32 - 2.34)
  ['New Conversation', '新建对话', '新增對話'],
  ['Create Project', '创建项目', '建立專案'],
  ['New Project', '新建项目', '新增專案'],
  ['Create New Project', '创建新项目', '建立新專案'],
  ['Open Project', '打开项目', '開啟專案'],
  ['Open Folder', '打开文件夹', '開啟資料夾'],
  ['New Folder', '新建文件夹', '新增資料夾'],
  ['Command Palette', '命令面板', '命令面板'],
  ['Split', '分屏', '分割'],
  ['Split Right', '向右分屏', '向右分割'],
  ['Split Down', '向下分屏', '向下分割'],
  ['Split Left', '向左分屏', '向左分割'],
  ['Split Up', '向上分屏', '向上分割'],
  ['Replace With New', '替换为新建', '取代為新增'],
  ['Replace with New', '替换为新建', '取代為新增'],
  ['Replace with new', '替换为新建', '取代為新增'],
  ['Remove From Split', '从分屏中移除', '從分割中移除'],
  ['Remove from Split', '从分屏中移除', '從分割中移除'],
  ['Split Terminal', '拆分终端', '分割終端機'],
  ['Kill Terminal', '终止终端', '終止終端機'],
  ['Split Conversation', '拆分对话', '分割對話'],
  ['Split Conversation Vertically', '垂直分屏对话', '垂直分割對話'],
  ['Split Conversation Horizontally', '水平分屏对话', '水平分割對話'],
  ['Equalize Split Panes', '均分分屏窗格', '均分分割窗格'],
  ['Fork', '派生', '分支'],
  ['Fork Conversation', '派生对话', '分支對話'],
  ['Automations', '自动化', '自動化'],
  ['Automation', '自动化', '自動化'],
  ['Give Feedback', '提供反馈', '提供意見回饋'],
  ['Provide Feedback', '提供反馈', '提供意見回饋'],
  ['Sort By', '排序方式', '排序方式'],
  ['Sort by', '排序方式', '排序方式'],
  ['Last Updated', '最近更新', '最近更新'],
  ['Last Prompt', '最新提示词', '最新提示詞'],
  ['Custom Order', '自定义排序', '自訂排序'],
  ['Manual Order', '手动排序', '手動排序'],
  ['Quote', '引用', '引用'],
  ['Quote Ctrl+L', '引用 Ctrl+L', '引用 Ctrl+L'],
  ['Quote Cmd+L', '引用 Cmd+L', '引用 Cmd+L'],
  ['Quote Selection', '引用所选内容', '引用所選內容'],
  ['Ask /btw', '通过 /btw 提问', '透過 /btw 提問'],
  ['Side Question Selection', '针对所选内容发起侧边提问', '針對所選內容發起側邊提問'],
  ['Comment', '评论', '評論'],
  ['Comment on Selection', '针对所选内容添加评论', '針對所選內容新增評論'],

  // Tab, file viewer, browser & link context menus (2.32 - 2.34)
  ['Conversation Name', '对话名称', '對話名稱'],
  ['Conversation ID', '对话 ID', '對話 ID'],
  ['Project Name', '项目名称', '專案名稱'],
  ['Project Path', '项目路径', '專案路徑'],
  ['Workspace Name', '工作区名称', '工作區名稱'],
  ['Workspace Path', '工作区路径', '工作區路徑'],
  ['Worktree Name', '工作树名称', '工作樹名稱'],
  ['Conversation Path', '对话路径', '對話路徑'],
  ['Close Tab', '关闭标签页', '關閉分頁'],
  ['Close Other Tabs', '关闭其他标签页', '關閉其他分頁'],
  ['Close Tabs to the Left', '关闭左侧标签页', '關閉左側分頁'],
  ['Close Tabs to the Right', '关闭右侧标签页', '關閉右側分頁'],
  ['Close All Tabs', '关闭全部标签页', '關閉全部分頁'],
  ['Close Terminal Tab', '关闭终端标签页', '關閉終端機分頁'],
  ['Close Others', '关闭其他', '關閉其他'],
  ['Close All', '全部关闭', '全部關閉'],
  ['Keep Open', '保持打开', '保持開啟'],
  ['Pin Tab', '固定标签页', '釘選分頁'],
  ['Unpin Tab', '取消固定标签页', '取消釘選分頁'],
  ['Reopen Closed Tab', '重新打开已关闭的标签页', '重新開啟已關閉的分頁'],
  ['Open in Tab', '在标签页中打开', '在分頁中開啟'],
  ['Open in New Tab', '在新标签页中打开', '在新分頁中開啟'],
  ['Open in New Window', '在新窗口中打开', '在新視窗中開啟'],
  ['Open in Side Panel', '在侧边栏中打开', '在側邊欄中開啟'],
  ['Open in Built-in Browser', '在内置浏览器中打开', '在內建瀏覽器中開啟'],
  ['Open in External Browser', '在外部浏览器中打开', '在外部瀏覽器中開啟'],
  ['Open Link in New Tab', '在新标签页中打开链接', '在新分頁中開啟連結'],
  ['Open Link in External Browser', '在外部浏览器中打开链接', '在外部瀏覽器中開啟連結'],
  ['Open Image in New Tab', '在新标签页中打开图片', '在新分頁中開啟圖片'],
  ['Open Conversation in New Tab', '在新标签页中打开对话', '在新分頁中開啟對話'],
  ['Open In', '打开方式', '開啟方式'],
  ['Open in Code Search', '在代码搜索中打开', '在程式碼搜尋中開啟'],
  ['Side Panel', '侧边栏', '側邊欄'],
  ['Built-in Browser', '内置浏览器', '內建瀏覽器'],
  ['External Browser', '外部浏览器', '外部瀏覽器'],
  ['Link Settings', '链接设置', '連結設定'],
  ['Copy Image', '复制图片', '複製圖片'],
  ['Copy Image Address', '复制图片地址', '複製圖片位址'],
  ['Copy Link', '复制链接', '複製連結'],
  ['Copy Link Address', '复制链接地址', '複製連結位址'],
  ['Copy Message', '复制消息', '複製訊息'],
  ['Copy File Path', '复制文件路径', '複製檔案路徑'],
  ['Copy File Name', '复制文件名', '複製檔案名稱'],
  ['Copy Path', '复制路径', '複製路徑'],
  ['Copy Relative Path', '复制相对路径', '複製相對路徑'],
  ['Copy Content', '复制内容', '複製內容'],
  ['Copy Project Name', '复制项目名称', '複製專案名稱'],
  ['Copy Project Path', '复制项目路径', '複製專案路徑'],
  ['Copy Conversation Markdown', '复制对话 Markdown', '複製對話 Markdown'],
  ['Copy Trajectory ID', '复制轨迹 ID', '複製軌跡 ID'],
  ['Copy Config File Path', '复制配置文件路径', '複製設定檔路徑'],
  ['Save Image', '保存图片', '儲存圖片'],
  ['Save Video', '保存视频', '儲存視訊'],
  ['Undo to Here', '撤销到此处', '復原到此處'],
  ['Edit Shortcut', '编辑快捷键', '編輯快捷鍵'],
  ['Add Shortcut', '添加快捷键', '新增快捷鍵'],
  ['Remove Shortcut', '移除快捷键', '移除快捷鍵'],
  ['Reset to Default', '重置为默认', '重設為預設值'],
  ['Move to Group', '移动到分组', '移動至群組'],
  ['New Group', '新建分组', '新增群組'],
  ['Rename Group', '重命名分组', '重新命名群組'],
  ['Delete Group', '删除分组', '刪除群組'],
  ['Move Up', '上移', '上移'],
  ['Move Down', '下移', '下移'],
  ['Remove from Group', '从分组中移除', '從群組中移除'],
  ['Remove from Recent', '从最近记录中移除', '從最近記錄中移除'],
  ['Delete Permanently', '永久删除', '永久刪除'],
  ['Proceed with Plan', '按计划继续', '依計畫繼續'],
  ['Pin', '置顶', '釘選'],
  ['Unpin', '取消置顶', '取消釘選'],
  ['Auto Pin', '自动置顶', '自動釘選'],
  ['Pin This Conversation', '置顶此对话', '釘選此對話'],
  ['Unpin This Conversation', '取消置顶此对话', '取消釘選此對話'],
  ['Rename', '重命名', '重新命名'],
  ['Rename This Conversation', '重命名此对话', '重新命名此對話'],
  ['Mark Unread', '标为未读', '標為未讀'],
  ['Mark Read', '标为已读', '標為已讀'],
  ['Mark as Unread', '标为未读', '標為未讀'],
  ['Mark as Read', '标为已读', '標為已讀'],
  ['Archive', '归档', '封存'],
  ['Archive Conversation', '归档对话', '封存對話'],
  ['Unarchive', '取消归档', '取消封存'],
  ['Unarchive Conversation', '取消归档对话', '取消封存對話'],
  ['Share', '分享', '分享'],
  ['Export', '导出', '匯出'],
  ['Export Conversation', '导出对话', '匯出對話'],
  ['Clear', '清除', '清除'],
  ['Clear History', '清除历史', '清除歷史'],
  ['Restore', '恢复', '還原'],
  ['View Debug', '查看调试信息', '檢視偵錯資訊'],
  ['Telemetry', '遥测', '遙測'],
  ['Find References', '查找引用', '尋找引用'],
  ['Open on phone', '在手机上打开', '在手機上開啟'],
  ['Open on another device', '在其他设备上打开', '在其他裝置上開啟'],
  ['Coordinator settings', '协调器设置', '協調器設定'],
  ['Project Settings', '项目设置', '專案設定'],
  ['Delete Project', '删除项目', '刪除專案'],
  ['Rename Project', '重命名项目', '重新命名專案'],
  ['Remove Project', '移除项目', '移除專案'],
  ['Remove from List', '从列表中移除', '從列表中移除'],
  ['Project options', '项目选项', '專案選項'],
  ['Reveal in File Explorer', '在文件资源管理器中显示', '在檔案總管中顯示'],
  ['Reveal in Finder', '在访达中显示', '在 Finder 中顯示'],
  ['Open in Terminal', '在终端中打开', '在終端機中開啟'],
  ['View Usage', '查看使用额度', '檢視使用額度'],
  ['Duplicate', '创建副本', '建立副本'],
  ['Stop', '停止', '停止'],
  ['Stop Agent', '停止智能体', '停止代理'],
  ['Interrupt Agent', '中断智能体', '中斷代理'],
  ['Resume', '恢复', '繼續'],
  ['Restart', '重新启动', '重新啟動'],
  ['Settings', '设置', '設定'],
  ['Back', '后退', '返回'],
  ['Forward', '前进', '前進'],
  ['Go Back', '后退', '返回'],
  ['Go Forward', '前进', '前進'],
  ['Add to Chat', '添加到对话', '加入對話'],
  ['Find in Pane', '在窗格中查找', '在窗格中尋找'],
  ['Toggle Virtual Machine', '切换虚拟机面板', '切換虛擬機面板'],
  ['Agents', '智能体', '代理'],
  ['Screen Recording', '屏幕录制', '螢幕錄製'],
  ['Add bundle', '添加组合包', '新增組合包'],
  ['Remove bundle', '移除组合包', '移除組合包'],
  ['Terminal: Select All', '终端：全选', '終端機：全選'],
  ['Terminal: Add to Chat', '终端：添加到对话', '終端機：加入對話'],
  ['Delete Hook', '删除钩子', '刪除掛鉤'],
  ['Add Hook Card', '添加钩子卡片', '新增掛鉤卡片'],
  ['Delete Handler', '删除处理程序', '刪除處理常式'],
  ['Hide', '隐藏', '隱藏'],
  ['Reply', '回复', '回覆'],
  ['Send Message', '发送消息', '傳送訊息'],
  ['Queue Message', '排队发送消息', '排隊傳送訊息'],
  ['Send Immediately', '立即发送', '立即傳送'],
  ['Connection info…', '连接信息…', '連線資訊…'],
  ['Connection info', '连接信息', '連線資訊'],

  // 2.35.0 - 2.35.2 Inbox, Move Conversation, Continue as New, Open with, Remote Agents & Downloads
  ['Resolve', '标为已解决', '標為已解決'],
  ['Return to Inbox', '移回收件箱', '移回收件匣'],
  ['Inbox Mode', '收件箱模式', '收件匣模式'],
  ['Working Section', '“正在工作”分组', '「正在執行」分組'],
  ['Auto-Resolve', '自动解决', '自動解決'],
  ['Subtitle', '副标题', '副標題'],
  ['Move to Project', '移动到项目', '移動至專案'],
  ['Move to Workspace', '移动到工作区', '移動至工作區'],
  ['New Project...', '新建项目...', '新增專案...'],
  ['New Workspace...', '新建工作区...', '新增工作區...'],
  ['Remove from Project', '从项目中移除', '從專案中移除'],
  ['Remove from Workspace', '从工作区中移除', '從工作區中移除'],
  ['Continue as a New Conversation', '作为新对话继续', '作為新對話繼續'],
  ['Continue in Current Workspace', '在当前工作区继续', '在目前工作區繼續'],
  ['Continue in Shared Workspace', '在共享工作区继续', '在共享工作區繼續'],
  ['Continue in New Workspace', '在新工作区继续', '在新工作區繼續'],
  ['Open with', '打开方式', '開啟方式'],
  ['Text viewer', '文本查看器', '文字檢視器'],
  ['Image viewer', '图片查看器', '圖片檢視器'],
  ['Video player', '视频播放器', '視訊播放器'],
  ['Audio player', '音频播放器', '音訊播放器'],
  ['HTML viewer', 'HTML 查看器', 'HTML 檢視器'],
  ['Notebook viewer', 'Notebook 查看器', 'Notebook 檢視器'],
  ['PDF viewer', 'PDF 查看器', 'PDF 檢視器'],
  ['System default app', '系统默认应用', '系統預設應用程式'],
  ['Application Menu', '应用菜单', '應用程式選單'],
  ['For Me', '仅自己使用', '僅自己使用'],
  ['For My Team', '团队共享', '團隊共享'],
  ['Sidecar disabled', 'Sidecar 已禁用', 'Sidecar 已停用'],
  ['Not running', '未运行', '未執行'],
  ['Open in external browser', '在外部浏览器中打开', '在外部瀏覽器中開啟'],
  ['Open in External Browser', '在外部浏览器中打开', '在外部瀏覽器中開啟'],
  ['Show in folder', '在文件夹中显示', '在資料夾中顯示'],
  ['Cancel download', '取消下载', '取消下載'],
  ['Remove from list', '从列表中移除', '從列表中移除'],
  ['Close downloads', '关闭下载列表', '關閉下載列表'],
];

const BUILTIN_EXACT = {
  'zh-CN': Object.create(null),
  'zh-TW': Object.create(null),
};

for (const [en, cn, tw] of NATIVE_ENTRIES) {
  BUILTIN_EXACT['zh-CN'][en] = cn;
  BUILTIN_EXACT['zh-TW'][en] = tw;
}

const BUILTIN_REGEX = {
  'zh-CN': [
    { re: /^Open in\s+(.+)\s+\(Default\)$/i, replace: '在 $1 中打开（默认）' },
    { re: /^(.+)\s+\(Default\)$/i, replace: '$1（默认）' },
    { re: /^Move to Group:\s*(.+)$/i, replace: '移动到分组：$1' },
    { re: /^Remove\s+(.+)\s+from Recent$/i, replace: '从最近记录中移除 $1' },
    { re: /^Hide\s+(.+)\s+from this list$/i, replace: '从此列表中隐藏 $1' },
    { re: /^Show\s+(.+)\s+in the list again$/i, replace: '在列表中重新显示 $1' },
    { re: /^Open in\s+(.+)$/i, replace: '在 $1 中打开' },
    { re: /^Open\s+(.+)$/, replace: '打开 $1' },
    { re: /^Close\s+(.+)$/, replace: '关闭 $1' },
    { re: /^Connect\s+to\s+(.+)$/, replace: '连接到 $1' },
    { re: /^Quit\s+Antigravity\??$/i, replace: '确定要退出 Antigravity 吗？' },
  ],
  'zh-TW': [
    { re: /^Open in\s+(.+)\s+\(Default\)$/i, replace: '在 $1 中開啟（預設）' },
    { re: /^(.+)\s+\(Default\)$/i, replace: '$1（預設）' },
    { re: /^Move to Group:\s*(.+)$/i, replace: '移動至群組：$1' },
    { re: /^Remove\s+(.+)\s+from Recent$/i, replace: '從最近記錄中移除 $1' },
    { re: /^Hide\s+(.+)\s+from this list$/i, replace: '從此列表中隱藏 $1' },
    { re: /^Show\s+(.+)\s+in the list again$/i, replace: '在列表中重新顯示 $1' },
    { re: /^Open in\s+(.+)$/i, replace: '在 $1 中開啟' },
    { re: /^Open\s+(.+)$/, replace: '開啟 $1' },
    { re: /^Close\s+(.+)$/, replace: '關閉 $1' },
    { re: /^Connect\s+to\s+(.+)$/, replace: '連線至 $1' },
    { re: /^Quit\s+Antigravity\??$/i, replace: '確定要結束 Antigravity 嗎？' },
  ],
};

function loadDict(lang) {
  if (lang === 'en') return { exact: {}, regex: [] };
  if (dictCache.has(lang)) return dictCache.get(lang);
  const file = lang === 'zh-TW' ? 'dict.zh-TW.json' : 'dict.zh-CN.json';
  const candidates = [
    path.join(__dirname, file),
    path.join(__dirname, 'i18n', file),
  ];
  let parsed = { exact: {}, regex: [] };
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
        break;
      } catch {}
    }
  }
  const compiled = {
    exact: parsed.exact || {},
    regex: (parsed.regex || []).map((r) => {
      try {
        return {
          re: new RegExp(r.pattern, r.flags || ''),
          replace: r.replace,
        };
      } catch {
        return null;
      }
    }).filter(Boolean),
  };
  dictCache.set(lang, compiled);
  return compiled;
}

function getCurrentLanguage(store) {
  if (currentLangOverride) return currentLangOverride;
  try {
    const cfg = (store || new ConfigStore()).load();
    return cfg.i18n?.language || 'zh-CN';
  } catch {
    return 'zh-CN';
  }
}

function setCurrentLanguage(lang) {
  currentLangOverride = lang;
}

function resolveEffectiveLang(lang) {
  return lang === 'zh-TW' ? 'zh-TW' : (lang === 'en' ? 'en' : 'zh-CN');
}

function getDictionary(lang = getCurrentLanguage()) {
  const effLang = resolveEffectiveLang(lang);
  if (effLang === 'en') return { exact: {}, regex: [] };
  const dict = loadDict(effLang);
  return {
    exact: Object.assign({}, dict.exact, BUILTIN_EXACT[effLang] || {}),
    regex: dict.regex.slice(),
  };
}

function translateNativeLabel(label, lang = getCurrentLanguage()) {
  if (!label || typeof label !== 'string' || lang === 'en') return label;
  const effLang = resolveEffectiveLang(lang);
  const clean = label.replace(/&/g, '').trim();
  const rawTrim = label.trim();

  // 1. Built-in high-priority native menu / tray / context menu map
  const builtinMap = BUILTIN_EXACT[effLang];
  if (builtinMap) {
    if (Object.prototype.hasOwnProperty.call(builtinMap, clean)) return builtinMap[clean];
    if (Object.prototype.hasOwnProperty.call(builtinMap, rawTrim)) return builtinMap[rawTrim];
  }

  // 2. Dynamic viewer/status suffixes: "(Not running)" / "(Sidecar disabled)" / "(Default)"
  const statusSuffixMatch = clean.match(/^(.+?)\s+\((Not running|Sidecar disabled)\)$/);
  if (statusSuffixMatch) {
    const base = statusSuffixMatch[1].trim();
    const dictForPrefix = loadDict(effLang);
    const baseTrans = (builtinMap && builtinMap[base]) || dictForPrefix.exact[base] || base;
    const reasonKey = statusSuffixMatch[2];
    const reasonTrans = (builtinMap && builtinMap[reasonKey])
      || (effLang === 'zh-TW'
        ? (reasonKey === 'Sidecar disabled' ? 'Sidecar 已停用' : '未執行')
        : (reasonKey === 'Sidecar disabled' ? 'Sidecar 已禁用' : '未运行'));
    return `${baseTrans}（${reasonTrans}）`;
  }

  const defaultSuffixMatch = clean.match(/^(.+?)\s+\(Default\)$/i);
  if (defaultSuffixMatch) {
    const base = defaultSuffixMatch[1].trim();
    if (builtinMap && Object.prototype.hasOwnProperty.call(builtinMap, base)) {
      return `${builtinMap[base]}${effLang === 'zh-TW' ? '（預設）' : '（默认）'}`;
    }
  }

  // 3. Built-in native dynamic patterns (e.g. "Open in Chrome (Default)", "Move to Group: X")
  const builtinRegs = BUILTIN_REGEX[effLang] || [];
  for (const rule of builtinRegs) {
    if (rule.re.test(clean)) {
      return clean.replace(rule.re, rule.replace);
    }
  }

  // 4. Full merged dictionary fallback (6,800+ entries + 540+ regex rules)
  const dict = loadDict(effLang);
  if (Object.prototype.hasOwnProperty.call(dict.exact, clean)) {
    return dict.exact[clean];
  }
  if (Object.prototype.hasOwnProperty.call(dict.exact, label)) {
    return dict.exact[label];
  }
  for (const rule of dict.regex) {
    if (rule.re.test(clean)) {
      return clean.replace(rule.re, rule.replace);
    }
  }
  return label;
}

function translateMenuItemOptions(item, lang = getCurrentLanguage()) {
  if (!item || typeof item !== 'object' || lang === 'en') return item;
  const out = { ...item };
  if (typeof out.label === 'string') {
    out.label = translateNativeLabel(out.label, lang);
  }
  if (typeof out.sublabel === 'string') {
    out.sublabel = translateNativeLabel(out.sublabel, lang);
  }
  if (typeof out.toolTip === 'string') {
    out.toolTip = translateNativeLabel(out.toolTip, lang);
  }
  if (Array.isArray(out.submenu)) {
    out.submenu = out.submenu.map((sub) => translateMenuItemOptions(sub, lang));
  }
  return out;
}

function translateMenuTemplate(template, lang) {
  const effectiveLang = lang !== undefined ? lang : getCurrentLanguage();
  if (effectiveLang === 'en') return template;
  if (lang === undefined) {
    try {
      const cfg = new ConfigStore().load();
      if (cfg.i18n?.translateNativeMenu === false) return template;
    } catch {}
  }
  if (!Array.isArray(template)) return template;
  return template.map((item) => translateMenuItemOptions(item, effectiveLang));
}

function translateMenuInstance(menu, lang) {
  const effectiveLang = lang !== undefined ? lang : getCurrentLanguage();
  if (effectiveLang === 'en') return menu;
  if (lang === undefined) {
    try {
      const cfg = new ConfigStore().load();
      if (cfg.i18n?.translateNativeMenu === false) return menu;
    } catch {}
  }
  if (!menu) return menu;
  const visit = (item) => {
    if (!item) return;
    if (typeof item.label === 'string') {
      item.label = translateNativeLabel(item.label, effectiveLang);
    }
    if (typeof item.sublabel === 'string') {
      item.sublabel = translateNativeLabel(item.sublabel, effectiveLang);
    }
    if (typeof item.toolTip === 'string') {
      item.toolTip = translateNativeLabel(item.toolTip, effectiveLang);
    }
    if (item.submenu) {
      if (Array.isArray(item.submenu.items)) {
        item.submenu.items.forEach(visit);
      } else if (Array.isArray(item.submenu)) {
        item.submenu.forEach(visit);
      }
    }
  };
  if (Array.isArray(menu.items)) {
    menu.items.forEach(visit);
  }
  return menu;
}

function translateTrayActions(actions, lang) {
  const effectiveLang = lang !== undefined ? lang : getCurrentLanguage();
  if (effectiveLang === 'en') return actions;
  if (lang === undefined) {
    try {
      const cfg = new ConfigStore().load();
      if (cfg.i18n?.translateTray === false) return actions;
    } catch {}
  }
  if (!Array.isArray(actions)) return actions;
  return actions.map((item) => translateMenuItemOptions(item, effectiveLang));
}

function formatTrayAgentCount(count, lang = getCurrentLanguage()) {
  const n = Number(count || 0);
  if (lang === 'en') {
    if (n <= 0) return 'No agents running';
    return n === 1 ? '1 agent running' : `${n} agents running`;
  }
  if (lang === 'zh-TW') {
    return n > 0 ? `${n} 個代理執行中` : '目前無執行中的代理';
  }
  return n > 0 ? `${n} 个智能体运行中` : '没有智能体在运行';
}

module.exports = {
  getCurrentLanguage,
  setCurrentLanguage,
  getDictionary,
  translateNativeLabel,
  translateMenuItemOptions,
  translateMenuTemplate,
  translateMenuInstance,
  translateTrayActions,
  formatTrayAgentCount,
};
