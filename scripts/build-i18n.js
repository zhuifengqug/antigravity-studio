'use strict';

/**
 * Antigravity Studio i18n Dictionary Builder
 * Merges:
 *   1) REF_I18N (Antigravity-Chinese-Localization v2.34.0 dictionary.js + localize.js native menus/dialogs)
 *   2) REF_ACV  (antigravity-context-viewer i18n/zh-CN.json)
 *   3) REF_PRISM (obsidian-prism vendor/host-i18n/zh-CN.json)
 *   4) Built-in Antigravity Studio & v2.34.0 curated entries & regex rules
 *
 * Outputs:
 *   - src/i18n/dict.zh-CN.json  ({ exact: {...}, regex: [{ pattern, flags, replace }] })
 *   - src/i18n/dict.zh-TW.json  ({ exact: {...}, regex: [{ pattern, flags, replace }] })
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT_CN = path.join(ROOT, 'src', 'i18n', 'dict.zh-CN.json');
const OUT_TW = path.join(ROOT, 'src', 'i18n', 'dict.zh-TW.json');

const DEFAULT_REFS = {
  refI18n: process.env.REF_I18N || 'C:\\Users\\gjs27\\.gemini\\antigravity\\brain\\ea1dcc05-9f2b-4229-b691-c34bbe950222\\scratch\\refs\\Antigravity-Chinese-Localization',
  refAcv: process.env.REF_ACV || 'C:\\Users\\gjs27\\.gemini\\antigravity\\brain\\ea1dcc05-9f2b-4229-b691-c34bbe950222\\scratch\\refs\\antigravity-context-viewer',
  refPrism: process.env.REF_PRISM || 'C:\\Users\\gjs27\\.gemini\\antigravity\\brain\\ea1dcc05-9f2b-4229-b691-c34bbe950222\\scratch\\refs\\obsidian-prism',
};

function parseCliArgs(argv) {
  const opts = { ...DEFAULT_REFS };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--ref-i18n' && argv[i + 1]) opts.refI18n = argv[++i];
    else if (a === '--ref-acv' && argv[i + 1]) opts.refAcv = argv[++i];
    else if (a === '--ref-prism' && argv[i + 1]) opts.refPrism = argv[++i];
  }
  return opts;
}

function readJsonSafe(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.warn(`[build-i18n] Warning: failed to parse ${filePath}: ${err.message}`);
    return null;
  }
}

function extractObjectMapFromLocalizeJs(localizePath, varName) {
  if (!localizePath || !fs.existsSync(localizePath)) return {};
  const src = fs.readFileSync(localizePath, 'utf8');
  const marker = `const ${varName} = {`;
  const start = src.indexOf(marker);
  if (start === -1) return {};
  const braceStart = src.indexOf('{', start);
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;
  let end = -1;

  for (let i = braceStart; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];
    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inSingle || inDouble || inTemplate) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (inSingle && ch === "'") inSingle = false;
      else if (inDouble && ch === '"') inDouble = false;
      else if (inTemplate && ch === '`') inTemplate = false;
      continue;
    }
    if (ch === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (ch === "'") { inSingle = true; continue; }
    if (ch === '"') { inDouble = true; continue; }
    if (ch === '`') { inTemplate = true; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) return {};
  const objExpr = src.slice(braceStart, end);
  try {
    const parsed = vm.runInNewContext(`(${objExpr})`, {}, { timeout: 2000 });
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.warn(`[build-i18n] Warning: failed to eval ${varName}: ${err.message}`);
    return {};
  }
}

// Curated Antigravity Studio + v2.34.0 native menus / tray / dialogs / UI entries
const CURATED_EXACT_CN = {
  // Core Electron Menu & Accelerator Mnemonic Aliases
  'File': '文件',
  'Edit': '编辑',
  'Selection': '选择',
  'View': '视图',
  'Go': '转到',
  'Run': '运行',
  'Terminal': '终端',
  'Window': '窗口',
  'Help': '帮助',
  'Services': '服务',
  'Hide Others': '隐藏其他',
  'Show All': '显示全部',
  'Quit Antigravity': '退出 Antigravity',
  'Close Window': '关闭窗口',
  'New Window': '新建窗口',
  'Actual Size': '实际大小',
  'Zoom In': '放大',
  'Zoom Out': '缩小',
  'Reset Zoom': '重置缩放',
  'Toggle Full Screen': '切换全屏',
  'Toggle Fullscreen': '切换全屏',
  'Toggle Developer Tools': '切换开发者工具',
  'Force Reload': '强制重新加载',
  'Reload': '重新加载',
  'Minimize': '最小化',
  'Maximize': '最大化',
  'Settings': '设置',
  'Preferences': '偏好设置',
  'Open Antigravity': '打开 Antigravity',
  'Show Antigravity': '显示 Antigravity',
  'Hide Antigravity': '隐藏 Antigravity',
  'No agents running': '没有智能体在运行',
  'Checking for Updates...': '正在检查更新...',
  'Downloading Update...': '正在下载更新...',
  'Restart to Update': '重启以应用更新',
  'No updates available': '当前已是最新版本，暂无可用更新。',
  'Select Download Folder': '选择下载文件夹',
  'Choose an SSH config file': '选择 SSH 配置文件',
  'Choose another SSH config file': '选择其他 SSH 配置文件',
  'Choose Another File…': '选择其他文件…',
  'Stop SSH server': '停止 SSH 服务端',
  'Restart SSH server': '重启 SSH 服务端',
  'Shared home directory': '共享主目录冲突',
  'Take Over': '接管',
  'Later': '稍后',
  'Microphone access': '麦克风访问权限',
  "Don't Allow": '不允许',
  'Touch your security key': '请轻触你的安全密钥',
  'Choose a Passkey': '选择通行密钥',
  'Passkeys': '通行密钥',
  'Connect a device': '连接设备',
  'Connection info': '连接信息',
  'Connection info…': '连接信息…',
  'Your connection to this site is not secure': '您与此网站的连接不安全',
  'Connection is secure': '连接安全',
  'Certificate is valid': '证书有效',
  'Certificate details': '证书详情',
  'Open': '打开',
  'Save': '保存',
  'Cancel': '取消',
  'OK': '确定',
  'Yes': '是',
  'No': '否',
  'Quit': '退出',
  'Exit': '退出',
  'Confirm Quit': '确认退出',
  'Are you sure you want to quit?': '您确定要退出吗？',
  'There may be agents or background tasks running.': '可能还有智能体或后台任务正在运行。',
};

// High-priority declarative regex rules (ordered: specific first, studio compatibility first, then general)
const CURATED_REGEX_CN = [
  // Core Antigravity Studio & v2.34.0 rules (aligned with tests & UI)
  { pattern: '^(\\d+)\\s+agents?\\s+running$', flags: 'i', replace: '$1 个智能体运行中' },
  { pattern: '^Running\\s+(\\d+)\\s+tools?$', flags: 'i', replace: '正在运行 $1 个工具' },
  { pattern: '^(\\d+)\\s+files?\\s+changed$', flags: 'i', replace: '已修改 $1 个文件' },
  { pattern: '^(\\d+)\\s+items?$', flags: 'i', replace: '$1 项' },
  { pattern: '^(\\d+)\\s+selected$', flags: 'i', replace: '已选择 $1 项' },
  { pattern: '^([0-9.,]+)\\s*tokens?\\s+used$', flags: 'i', replace: '已用 $1 tokens' },
  { pattern: '^([0-9.,]+)%\\s+remaining$', flags: 'i', replace: '剩余 $1%' },
  { pattern: '^(\\d+(?:\\.\\d+)?)%\\s+left$', flags: 'i', replace: '$1% 可用' },
  { pattern: '^(\\d+)\\s+seconds?\\s+ago$', flags: 'i', replace: '$1 秒前' },
  { pattern: '^(\\d+)\\s+minutes?\\s+ago$', flags: 'i', replace: '$1 分钟前' },
  { pattern: '^(\\d+)\\s+hours?\\s+ago$', flags: 'i', replace: '$1 小时前' },
  { pattern: '^(\\d+)\\s+days?\\s+ago$', flags: 'i', replace: '$1 天前' },
  { pattern: '^(\\d+)\\s+weeks?\\s+ago$', flags: 'i', replace: '$1 周前' },
  { pattern: '^(\\d+)\\s+months?\\s+ago$', flags: 'i', replace: '$1 个月前' },
  { pattern: '^(\\d+)\\s+years?\\s+ago$', flags: 'i', replace: '$1 年前' },
  { pattern: '^Just now$', flags: 'i', replace: '刚刚' },

  // Greetings
  { pattern: '^Hey there,\\s*what should we build today\\?$', flags: 'i', replace: '嘿，今天想构建点什么？' },
  { pattern: '^Hey\\s+(.+?),\\s*what should we build today\\?$', flags: 'i', replace: '嘿，$1，今天想构建点什么？' },
  { pattern: '^Welcome back,\\s*(.+?)\\.\\s*Where should we pick up\\?$', flags: 'i', replace: '欢迎回来，$1。我们从哪里继续？' },
  { pattern: '^Welcome back\\.\\s*Where should we pick up\\?$', flags: 'i', replace: '欢迎回来。我们从哪里继续？' },
  { pattern: "^Good to see you,\\s*(.+?)\\.\\s*What's next\\?$", flags: 'i', replace: '很高兴见到你，$1。接下来做什么？' },
  { pattern: "^Good to see you\\.\\s*What's next\\?$", flags: 'i', replace: '很高兴见到你。接下来做什么？' },

  // Model / Effort / Announcements
  { pattern: "^Effort isn't adjustable for\\s+(.+?)\\.?$", flags: 'i', replace: '无法为 $1 调整思考档位。' },
  { pattern: '^Introducing\\s+((?:Gemini|Claude|GPT|Gemma|Veo|Imagen)(?:\\s+[A-Za-z0-9._-]+){1,5})!$', flags: 'i', replace: '全新推出 $1！' },
  { pattern: '^Introducing\\s+((?:Gemini|Claude|GPT|Gemma|Veo|Imagen)(?:\\s+[A-Za-z0-9._-]+){1,5})\\.?$', flags: 'i', replace: '全新推出 $1' },
  { pattern: '^([A-Za-z0-9._ -]+?)\\s+that\\s+may\\s+offload\\s+routine\\s+steps\\s+to\\s+([A-Za-z0-9._ -]+?)\\.\\s*Same\\s+([A-Za-z0-9._ -]+?)-level\\s+quality,\\s*fewer\\s+tokens\\s+used\\.?$', flags: 'i', replace: '由 $1 主导，可将常规步骤分流至 $2 执行。保持 $3 级输出质量，消耗更少 Token。' },
  { pattern: '^(.+?)\\s+(?:is|are)\\s+not available (?:on|in) your (?:current )?plan\\.$', flags: 'i', replace: '$1 在你当前方案中不可用。' },
  { pattern: "^You(?:'re|\\s+are)\\s+subscribed\\s+to\\s+the\\s+(?:best|highest|top(?:-tier)?)\\s+(.+?)\\s+plan[.!]?$", flags: 'i', replace: '您已订阅最高等级的 $1 计划。' },

  // Quota & Resets
  { pattern: '^Weekly\\s+Limit\\s+Remaining$', flags: 'i', replace: '每周限额剩余' },
  { pattern: '^Monthly\\s+Limit\\s+Remaining$', flags: 'i', replace: '每月限额剩余' },
  { pattern: '^(?:Five[- ]Hour|5[- ]Hour)\\s+Limit\\s+Remaining$', flags: 'i', replace: '5 小时限额剩余' },
  { pattern: '^Hourly\\s+Limit\\s+Remaining$', flags: 'i', replace: '每小时限额剩余' },
  { pattern: '^Daily\\s+Limit\\s+Remaining$', flags: 'i', replace: '每日限额剩余' },
  { pattern: '^(\\d+)h\\s+limit$', flags: 'i', replace: '$1 小时限额' },
  { pattern: '^Resets\\s+in\\s+(.+)$', flags: 'i', replace: '距离重置还剩 $1' },

  // Composer / Queue / Shortcuts
  { pattern: '^(.+?)\\s+Queues after the turn$', flags: '', replace: '$1 在当前回合结束后排队' },
  { pattern: '^(.+?)\\s+Sends immediately$', flags: '', replace: '$1 立即发送' },
  { pattern: '^(.+?)\\s+On empty prompt,\\s*sends next in queue$', flags: '', replace: '$1 输入框为空时，发送队列中的下一条' },
  { pattern: '^Send\\s+all\\s*\\((\\d+)\\)$', flags: 'i', replace: '全部发送 ($1)' },
  { pattern: '^Send\\s+all$', flags: 'i', replace: '全部发送' },
  { pattern: '^Send\\s+now:\\s*(.+)$', flags: 'i', replace: '立即发送：$1' },
  { pattern: '^View\\s+Diff\\s+for\\s+(.+)$', flags: 'i', replace: '查看 $1 的差异' },
  { pattern: '^\\+(\\d+)\\s+attachments?$', flags: 'i', replace: '+$1 个附件' },
  { pattern: '^(\\d+)\\s+models\\s+selected$', flags: 'i', replace: '已选择 $1 个模型' },
  { pattern: '^Recording shortcut for (.+)\\. Press keys to bind, Enter to save, Escape to cancel\\.$', flags: '', replace: '正在为 $1 录制快捷键。按下按键绑定，Enter 保存，Escape 取消。' },

  // Automation / Schedule
  { pattern: '^Step\\s+(\\d+)\\s+of\\s+(\\d+)$', flags: 'i', replace: '第 $1 步，共 $2 步' },
  { pattern: '^Edit side question title:\\s*(.+)$', flags: 'i', replace: '编辑侧边提问标题：$1' },
  { pattern: '^Reply to\\s+(.+)$', flags: 'i', replace: '回复 $1' },
  { pattern: '^Next run today around (.+)$', flags: 'i', replace: '下次运行：今天 $1 左右' },
  { pattern: '^Next run tomorrow around (.+)$', flags: 'i', replace: '下次运行：明天 $1 左右' },
  { pattern: '^Next run on (.+?) around (.+)$', flags: 'i', replace: '下次运行：$1 $2 左右' },
  { pattern: '^Every\\s+(\\d+)\\s+hours?$', flags: 'i', replace: '每 $1 小时' },
  { pattern: '^Every\\s+(\\d+)\\s+minutes?$', flags: 'i', replace: '每 $1 分钟' },
  { pattern: '^Every\\s+(\\d+)\\s+hours?\\s+on\\s+(.+)$', flags: 'i', replace: '每 $1 小时（$2）' },
  { pattern: '^Every\\s+(\\d+)\\s+minutes?\\s+on\\s+(.+)$', flags: 'i', replace: '每 $1 分钟（$2）' },
  { pattern: '^Daily at (.+)$', flags: 'i', replace: '每天 $1' },
  { pattern: '^Weekdays at (.+)$', flags: 'i', replace: '每个工作日 $1' },
  { pattern: '^Weekends at (.+)$', flags: 'i', replace: '每个周末 $1' },
  { pattern: '^Monthly on the\\s+(\\d+)(?:st|nd|rd|th)\\s+at\\s+(.+)$', flags: 'i', replace: '每月 $1 日 $2' },

  // Browser / Subagent / Tool steps
  { pattern: '^Compacting\\s*·\\s*(.+)$', flags: 'i', replace: '正在压缩上下文 · $1' },
  { pattern: '^Using browser\\s*\\((\\d+s)\\)$', flags: 'i', replace: '正在使用浏览器 ($1)' },
  { pattern: '^Marked\\s+(\\d+)\\s+conversations?\\s+as\\s+read$', flags: 'i', replace: '已将 $1 个对话标为已读' },
  { pattern: '^(\\d+)\\s+pinned\\s+conversations?$', flags: 'i', replace: '$1 个置顶对话' },
  { pattern: '^Detached at\\s+(.+)$', flags: 'i', replace: '游离于 $1' },
  { pattern: '^Branch,\\s*current:\\s*(.+)$', flags: 'i', replace: '分支，当前：$1' },
  { pattern: '^No handlers configured for\\s+(.+)$', flags: 'i', replace: '尚未为 $1 配置处理程序' },
  { pattern: '^Add New Handler to\\s+(.+)$', flags: 'i', replace: '向 $1 添加新处理程序' },
  { pattern: '^Managed by the\\s+(.+?)\\s+automation$', flags: 'i', replace: '由自动化任务 $1 托管' },
  { pattern: '^Managed by the\\s+(.+?)\\s+plugin$', flags: 'i', replace: '由插件 $1 托管' },
  { pattern: '^(.+)\\s+plugin for Antigravity$', flags: 'i', replace: 'Antigravity 的 $1 插件' },
  { pattern: '^The first (.+) tool call opens a browser window to authorize your workspace[。.]?$', flags: 'i', replace: '首次调用 $1 工具时会打开浏览器窗口以授权你的工作区。' },
  { pattern: '^See\\s+(\\d+)\\s+more$', flags: 'i', replace: '查看其余 $1 项' },
  { pattern: '^See\\s+less$', flags: 'i', replace: '收起' },
  { pattern: '^Show\\s+(\\d+)\\s+more\\s+subagents?$', flags: 'i', replace: '显示其余 $1 个子智能体' },
  { pattern: '^Show\\s+less$', flags: 'i', replace: '收起' },
  { pattern: '^Last\\s+(\\d+)\\s+days?$', flags: 'i', replace: '最近 $1 天' },
  { pattern: '^Last\\s+(\\d+)\\s+hours?$', flags: 'i', replace: '最近 $1 小时' },

  // Agent execution summaries
  { pattern: '^Explored\\s+(\\d+)\\s+files?,\\s*ran\\s+(\\d+)\\s+commands?,\\s*edited\\s+(\\d+)\\s+files?$', flags: 'i', replace: '已探索 $1 个文件，已执行 $2 条命令，已编辑 $3 个文件' },
  { pattern: '^Explored\\s+(\\d+)\\s+files?,\\s*ran\\s+(\\d+)\\s+commands?,\\s*edited\\s+(\\d+)\\s+artifacts?$', flags: 'i', replace: '已探索 $1 个文件，已执行 $2 条命令，已编辑 $3 个工件' },
  { pattern: '^Exploring\\s+(\\d+)\\s+files?,\\s*running\\s+(\\d+)\\s+commands?,\\s*editing\\s+(\\d+)\\s+files?$', flags: 'i', replace: '正在探索 $1 个文件，正在运行 $2 条命令，正在编辑 $3 个文件' },
  { pattern: '^Exploring\\s+(\\d+)\\s+files?,\\s*running\\s+(\\d+)\\s+commands?,\\s*editing\\s+(\\d+)\\s+artifacts?$', flags: 'i', replace: '正在探索 $1 个文件，正在运行 $2 条命令，正在编辑 $3 个工件' },
  { pattern: '^Explored\\s+(\\d+)\\s+files?,\\s*ran\\s+(\\d+)\\s+commands?$', flags: 'i', replace: '已探索 $1 个文件，已执行 $2 条命令' },
  { pattern: '^Exploring\\s+(\\d+)\\s+files?,\\s*running\\s+(\\d+)\\s+commands?$', flags: 'i', replace: '正在探索 $1 个文件，正在运行 $2 条命令' },
  { pattern: '^Explored\\s+files?,\\s*ran\\s+commands?,\\s*edited\\s+files?$', flags: 'i', replace: '已探索文件、已执行命令、已编辑文件' },
  { pattern: '^Explored\\s+files?,\\s*ran\\s+commands?,\\s*edited\\s+artifacts?$', flags: 'i', replace: '已探索文件、已执行命令、已编辑工件' },
  { pattern: '^Exploring\\s+files?,\\s*running\\s+commands?,\\s*editing\\s+files?$', flags: 'i', replace: '正在探索文件、运行命令、编辑文件' },
  { pattern: '^Exploring\\s+files?,\\s*running\\s+commands?,\\s*editing\\s+artifacts?$', flags: 'i', replace: '正在探索文件、运行命令、编辑工件' },
  { pattern: '^Explored\\s+files?,\\s*ran\\s+commands?$', flags: 'i', replace: '已探索文件，已执行命令' },
  { pattern: '^Exploring\\s+files?,\\s*running\\s+commands?$', flags: 'i', replace: '正在探索文件，正在运行命令' },
  { pattern: '^Running\\s+commands?,\\s*editing\\s+files?$', flags: 'i', replace: '正在运行命令、编辑文件' },
  { pattern: '^Ran\\s+commands?,\\s*edited\\s+files?$', flags: 'i', replace: '已执行命令、已编辑文件' },
  { pattern: '^Explored\\s+files?,\\s*edited\\s+files?$', flags: 'i', replace: '已探索文件、已编辑文件' },
  { pattern: '^Exploring\\s+files?,\\s*editing\\s+files?$', flags: 'i', replace: '正在探索文件、编辑文件' },
  { pattern: '^Ran\\s+(\\d+)\\s+commands?$', flags: 'i', replace: '已运行 $1 条命令' },
  { pattern: '^Running\\s+(\\d+)\\s+commands?$', flags: 'i', replace: '正在运行 $1 条命令' },
  { pattern: '^Explored\\s+(\\d+)\\s+files?$', flags: 'i', replace: '已探索 $1 个文件' },
  { pattern: '^Exploring\\s+(\\d+)\\s+files?$', flags: 'i', replace: '正在探索 $1 个文件' },
  { pattern: '^Edited\\s+(\\d+)\\s+files?$', flags: 'i', replace: '已编辑 $1 个文件' },
  { pattern: '^Editing\\s+(\\d+)\\s+files?$', flags: 'i', replace: '正在编辑 $1 个文件' },
  { pattern: '^Edited\\s+(\\d+)\\s+artifacts?$', flags: 'i', replace: '已编辑 $1 个工件' },
  { pattern: '^Editing\\s+(\\d+)\\s+artifacts?$', flags: 'i', replace: '正在编辑 $1 个工件' },
  { pattern: '^Ran\\s+command:\\s*(.+)$', flags: 'i', replace: '已运行命令: $1' },
  { pattern: '^Running\\s+command:\\s*(.+)$', flags: 'i', replace: '正在运行命令: $1' },
  { pattern: '^Waiting for command completion \\(up to (\\d+) seconds\\)$', flags: 'i', replace: '等待命令执行完成（最多 $1 秒）' },
  { pattern: '^Canceled edit to (.+)$', flags: 'i', replace: '已取消对 $1 的编辑' },
  { pattern: '^Canceled creation of (.+)$', flags: 'i', replace: '已取消创建 $1' },
  { pattern: '^Canceled deletion of (.+)$', flags: 'i', replace: '已取消删除 $1' },
  { pattern: '^Used MCP tool:\\s*(.+)$', flags: 'i', replace: '调用 MCP 工具: $1' },
  { pattern: '^Used tool:\\s*(.+)$', flags: 'i', replace: '调用工具: $1' },
  { pattern: '^Generated image:\\s*(.+)$', flags: 'i', replace: '生成图像: $1' },
  { pattern: '^Browser task:\\s*(.+)$', flags: 'i', replace: '浏览器任务: $1' },
  { pattern: '^Opened browser:\\s*(.+)$', flags: 'i', replace: '已打开浏览器: $1' },
  { pattern: '^Read URL:\\s*(.+)$', flags: 'i', replace: '读取 URL: $1' },
  { pattern: '^Searched web:\\s*(.+)$', flags: 'i', replace: '网页搜索: $1' },
  { pattern: '^Invoked subagent:\\s*(.+)$', flags: 'i', replace: '调用子智能体: $1' },
  { pattern: '^Searched for files:\\s*(.+)$', flags: 'i', replace: '搜索文件: $1' },
  { pattern: '^Searched for\\s+"([^"]+)"$', flags: 'i', replace: '搜索: "$1"' },
  { pattern: '^Code search:\\s*(.+)$', flags: 'i', replace: '代码搜索: $1' },
  { pattern: '^Internal search:\\s*(.+)$', flags: 'i', replace: '内部搜索: $1' },
  { pattern: '^Listed directory\\s+(.+)$', flags: 'i', replace: '列出目录: $1' },
  { pattern: '^No more older messages,\\s*showing\\s+(\\d+)\\s+of\\s+(\\d+)$', flags: 'i', replace: '已无更早的历史消息（共显示 $1 / $2 条）' },
  { pattern: '^No more older messages$', flags: 'i', replace: '已无更早的历史消息' },
  { pattern: '^Load older messages,\\s*showing\\s+(\\d+)\\s+of\\s+(\\d+)$', flags: 'i', replace: '加载历史消息，正在显示 $1 / $2 条' },
  { pattern: '^Fold lines\\s+([0-9-]+)$', flags: 'i', replace: '折叠第 $1 行' },
  { pattern: '^Opens external link:\\s*(.+)$', flags: 'i', replace: '打开外部链接: $1' },
  { pattern: '^(\\d+)\\s+searches?$', flags: 'i', replace: '$1 次搜索' },
  { pattern: '^Edited (.*) \\+(\\d+) -(\\d+)$', flags: 'i', replace: '编辑 $1 (+$2 -$3)' },
  { pattern: '^(\\d+)\\s+turns?$', flags: 'i', replace: '$1 回合' },
  { pattern: '^Turn\\s+(\\d+)$', flags: 'i', replace: '第 $1 回合' },
  { pattern: '^Step (\\d+) \\(([^)]+)\\):?$', flags: 'i', replace: '步骤 $1 ($2)：' },
  { pattern: '^Task id "([^"]+)" finished with result:$', flags: 'i', replace: '任务 "$1" 执行完成：' },
  { pattern: '^Tool is running as a background task with task id: (.+)$', flags: 'i', replace: '工具正在后台运行 (任务ID: $1)' },
  { pattern: '^Version\\s+(\\d+.*)$', flags: 'i', replace: '版本 $1' },
  { pattern: '^Updated\\s+(just now|today|yesterday|\\d.*)$', flags: 'i', replace: '更新于 $1' },
  { pattern: '^Thought\\s+for\\s+(.+)$', flags: 'i', replace: '已思考 $1' },
  { pattern: '^Thinking\\s+for\\s+(.+)$', flags: 'i', replace: '正在思考 $1' },
  { pattern: '^Thinking\\s*\\((.+)\\)$', flags: 'i', replace: '正在思考 ($1)' },
  { pattern: '^Worked\\s+for\\s+(.+)$', flags: 'i', replace: '总耗时 $1' },

  // Remote SSH & WSL
  { pattern: '^Setting up WSL:\\s*(.+)$', flags: 'i', replace: '正在配置 WSL: $1' },
  { pattern: '^Connected to WSL:\\s*(.+)$', flags: 'i', replace: '已连接到 WSL: $1' },
  { pattern: '^Not connected to (.+?)$', flags: 'i', replace: '未连接到 $1' },
  { pattern: '^Reconnecting to (.+?)[.…⋯]?$', flags: 'i', replace: '正在重新连接到 $1…' },
  { pattern: '^Disconnected from (.+?)$', flags: 'i', replace: '已断开与 $1 的连接' },
  { pattern: '^Connected to\\s+(?!WSL:)(.+)$', flags: 'i', replace: '已连接到 $1' },
  { pattern: '^Connecting to\\s+(?!the\\s+live\\s+preview)(.+?)[.…]*$', flags: 'i', replace: '正在连接到 $1…' },
  { pattern: "^This window's agents, files, and terminals are on\\s+(.+?)\\.?$", flags: 'i', replace: '此窗口的智能体、文件与终端均运行在 $1 上。' },
  { pattern: '^(\\d+)\\s+hidden\\s+hosts?$', flags: 'i', replace: '$1 个已隐藏的主机' },
  { pattern: '^SSH Config \\((.+)\\)$', flags: 'i', replace: 'SSH 配置 ($1)' },
  { pattern: "^You're signing in on\\s+(.+?)\\.\\s*Your sign-in stays on that machine\\.?$", flags: 'i', replace: '你正在 $1 上登录。登录状态将保存在该机器上。' },
  { pattern: '^Stop the Antigravity server on (.+?)\\?$', flags: 'i', replace: '停止 $1 上的 Antigravity 服务端？' },

  // Cookies & Browser
  { pattern: '^(\\d+)\\s+cookies?$', flags: 'i', replace: '$1 个 Cookie' },
  { pattern: '^Delete cookies for\\s+(.+)$', flags: 'i', replace: '删除 $1 的 Cookie' },
  { pattern: '^Deleted cookies for\\s+(.+)$', flags: 'i', replace: '已删除 $1 的 Cookie' },
  { pattern: '^Site data cleared for (.+?)\\.?$', flags: 'i', replace: '已清除 $1 的站点数据。' },
  { pattern: '^Could not clear site data for (.+?)\\.?$', flags: 'i', replace: '无法清除 $1 的站点数据。' },
  { pattern: '^Showing latest\\s+(\\d+)\\s+browser steps$', flags: 'i', replace: '正在显示最近 $1 个浏览器步骤' },
  { pattern: '^The preview did not respond on port\\s+(\\d+)\\.?$', flags: 'i', replace: '端口 $1 上的预览未响应。' },
  { pattern: '^Nothing is running on port\\s+(\\d+)\\.?$', flags: 'i', replace: '端口 $1 上没有正在运行的服务' },

  // Bundles & Step Plan & Permissions
  { pattern: '^Add bundle\\s+(.+)$', flags: 'i', replace: '添加组合包 $1' },
  { pattern: '^Adding plugins from\\s+(.+)$', flags: 'i', replace: '正在从 $1 添加插件' },
  { pattern: '^Added\\s+(.+?)\\s+and installed\\s+(\\d+)\\s+plugins?\\.?$', flags: 'i', replace: '已添加 $1 并安装 $2 个插件。' },
  { pattern: '^Plan,\\s*(\\d+)\\s+of\\s+(\\d+)\\s+steps done$', flags: 'i', replace: '计划：已完成 $1 / $2 步' },
  { pattern: '^Side question \\(conversation ([^)]+)\\):\\s*(.+)$', flags: 'i', replace: '侧边提问（对话 $1）：$2' },
  { pattern: '^Yes,\\s+allow downloads from (.+?) for this run$', flags: 'i', replace: '是，本次运行允许从 $1 下载' },
  { pattern: '^Yes,\\s+save rule for (.+?) in this conversation$', flags: 'i', replace: '是，在当前对话中为 $1 保存规则' },
  { pattern: '^Yes,\\s+allow downloads from (.+?) in this conversation$', flags: 'i', replace: '是，在当前对话中允许从 $1 下载' },
  { pattern: '^Yes,\\s+and always allow (.+?) in this conversation$', flags: 'i', replace: '是，并在当前对话中始终允许 $1' },
  { pattern: '^Yes,\\s+allow (.+?) in this conversation$', flags: 'i', replace: '是，在当前对话中允许 $1' },
  { pattern: '^Yes,\\s+save rule for (.+?) globally$', flags: 'i', replace: '是，全局保存 $1 的规则' },
  { pattern: '^Yes,\\s+always allow downloads from (.+)$', flags: 'i', replace: '是，始终允许从 $1 下载' },
  { pattern: '^Yes,\\s+and always allow (.+)$', flags: 'i', replace: '是，并始终允许 $1' },
  { pattern: '^Yes,\\s+always allow (.+)$', flags: 'i', replace: '是，始终允许 $1' },
  { pattern: '^Conflicts with your configured Ask permission:\\s*(.+)$', flags: 'i', replace: '与您配置的询问权限冲突：$1' },
  { pattern: '^Requires manual confirmation:\\s*(.+)$', flags: 'i', replace: '需要人工确认：$1' },

  // v2.34.0 UI / Swarm / Accessibility
  { pattern: '^(\\d+)\\s+agents?\\s+working,\\s*live preview unavailable$', flags: 'i', replace: '$1 个智能体正在工作，实时预览不可用' },
  { pattern: '^Please retry:\\s*(.+)$', flags: '', replace: '请重试：$1' },
  { pattern: '^Sent response:\\s*(.+)$', flags: '', replace: '已发送回复：$1' },
  { pattern: '^Skipped:\\s*(.+)$', flags: '', replace: '已跳过：$1' },
  { pattern: '^Skipped\\s+(.+)$', flags: '', replace: '已跳过：$1' },
  { pattern: '^Open Subagent:\\s*(.+)$', flags: '', replace: '打开子智能体：$1' },
  { pattern: '^Select Sidebar Item (\\d+)$', flags: 'i', replace: '选择侧边栏第 $1 项' },
  { pattern: '^UI Plugin (\\d+)$', flags: 'i', replace: 'UI 插件 $1' },
  { pattern: '^Automation (\\d+)$', flags: 'i', replace: '自动化 $1' },
  { pattern: '^More options for (.+)$', flags: '', replace: '$1 的更多选项' },
  { pattern: '^Open image (\\d+) of (\\d+)$', flags: 'i', replace: '打开第 $1 张图片（共 $2 张）' },
  { pattern: '^Image (\\d+)$', flags: 'i', replace: '图片 $1' },
  { pattern: '^Show (\\d+) More$', flags: 'i', replace: '显示其余 $1 项' },
  { pattern: '^(.+) \\(experimental\\)$', flags: 'i', replace: '$1（实验性）' },
  { pattern: '^Line (\\d+) → (\\d+)$', flags: '', replace: '第 $1 → $2 行' },
  { pattern: '^(\\d+)\\s+of\\s+(\\d+)\\s+tasks?\\s+done$', flags: 'i', replace: '$1 / $2 项任务已完成' },
  { pattern: '^(\\d+)\\s+threads?\\s+open$', flags: 'i', replace: '$1 个线程进行中' },
  { pattern: '^(\\d+)\\s+waiting\\s+on\\s+@([A-Za-z0-9_.-]+)$', flags: '', replace: '$1 项正在等待 @$2' },
  { pattern: '^Up\\s+next\\s+·\\s+(\\d+)$', flags: '', replace: '接下来 · $1' },
  { pattern: '^\\+(\\d+)\\s+more$', flags: 'i', replace: '还有 +$1 项' },
  { pattern: '^Waiting\\s+on\\s+@([A-Za-z0-9_.-]+)$', flags: '', replace: '等待 @$1' },
  { pattern: '^Waiting\\s+on\\s+(\\d+)$', flags: '', replace: '等待 $1 位成员' },
  { pattern: '^Working\\s+for\\s+@([A-Za-z0-9_.-]+)$', flags: '', replace: '正在为 @$1 处理' },
  { pattern: '^(\\d+)\\s+posts?$', flags: 'i', replace: '$1 条动态' },
  { pattern: '^Runs\\s+on\\s+(.+)$', flags: '', replace: '运行于 $1' },
  { pattern: '^Open\\s+@([A-Za-z0-9_.-]+)$', flags: '', replace: '打开 @$1' },
  { pattern: '^Go\\s+to\\s+#(\\d+)\\s+on\\s+the\\s+Board$', flags: '', replace: '跳转到看板 #$1' },
  { pattern: '^Posted\\s+in\\s+#([A-Za-z0-9_.-]+);\\s+click\\s+to\\s+show\\s+only\\s+#([A-Za-z0-9_.-]+)$', flags: '', replace: '发布于 #$1；点击仅查看 #$2' },
  { pattern: '^Exporting\\s+(\\d+)%$', flags: '', replace: '正在导出 $1%' },
  { pattern: '^Exported\\s+(.+?)\\s+\\((.+)\\)$', flags: '', replace: '已导出 $1（$2）' },
  { pattern: '^Rendering\\s+(.+?)…$', flags: '', replace: '正在渲染 $1…' },
  { pattern: '^Download\\s+(.+\\.gif)$', flags: 'i', replace: '下载 $1' },
  { pattern: '^(\\d+)\\s+frames?\\s+·\\s+(.+)$', flags: 'i', replace: '$1 帧 · $2' },
  { pattern: '^Narrator\\s+read\\s+up\\s+to\\s+#(\\d+)\\s+of\\s+(\\d+)$', flags: '', replace: '旁白已阅读至 #$1 / $2' },
  { pattern: "^overview\\s+·\\s+from\\s+the\\s+narrator['’]s\\s+notes\\s+·\\s+(.+)$", flags: 'i', replace: '概览 · 来自旁白笔记 · $1' },
  { pattern: "^Opening\\s+(.+?)'s\\s+conversation\\s+needs\\s+the\\s+app\\.$", flags: '', replace: '打开 $1 的对话需要在客户端内操作。' },
  { pattern: '^(.+?)\\s+runs\\s+on\\s+(.+?);\\s+open\\s+it\\s+there\\.$', flags: '', replace: '$1 运行在 $2 上，请在对应设备打开。' },
  { pattern: '^Now\\s+·\\s+(\\d+)\\s+\\/\\s+(\\d+)$', flags: '', replace: '现在 · $1 / $2' },

  // Native menu / window / dialog patterns
  { pattern: '^Open\\s+(.+)\\s+\\(Default\\)$', flags: 'i', replace: '打开 $1（默认）' },
  { pattern: '^Open in\\s+(.+)\\s+\\(Default\\)$', flags: 'i', replace: '在 $1 中打开（默认）' },
  { pattern: '^Move to Group:\\s*(.+)$', flags: 'i', replace: '移动到分组：$1' },
  { pattern: '^Remove\\s+(.+)\\s+from Recent$', flags: 'i', replace: '从最近记录中移除 $1' },
  { pattern: '^Hide\\s+(.+)\\s+from this list$', flags: 'i', replace: '从此列表中隐藏 $1' },
  { pattern: '^Show\\s+(.+)\\s+in the list again$', flags: 'i', replace: '在列表中重新显示 $1' },
  { pattern: '^Open in\\s+(.+)$', flags: 'i', replace: '在 $1 中打开' },
  { pattern: '^Open\\s+(.+)$', flags: '', replace: '打开 $1' },
  { pattern: '^Close\\s+(.+)$', flags: '', replace: '关闭 $1' },
  { pattern: '^Connect\\s+to\\s+(.+)$', flags: '', replace: '连接到 $1' },
  { pattern: '^Quit\\s+Antigravity\\??$', flags: 'i', replace: '确定要退出 Antigravity 吗？' },
];

// Overly generic catch-all patterns from older dictionaries that can cause false positives if kept unchecked
const BLOCKED_LEGACY_PATTERNS = new Set([
  '^Updated\\s+(.*)$',
  '^Created\\s+(?!worker\\b)(.*)$',
  '^Ran\\s+(.*)$',
  '^Explored\\s+(.*)$',
  '^Edited\\s+(.*)$',
  '^Viewed\\s+(.*)$',
]);

// =====================================================================
// Simplified Chinese -> Traditional Chinese (zh-TW) Converter
// =====================================================================
const TW_PHRASE_MAP = [
  ['配置文件', '設定檔'],
  ['文件资源管理器', '檔案總管'],
  ['文件系统', '檔案系統'],
  ['文件夹', '資料夾'],
  ['文件名', '檔案名稱'],
  ['文件路径', '檔案路徑'],
  ['文件列表', '檔案列表'],
  ['文档', '文件'],
  ['文件', '檔案'],
  ['智能体', '代理'],
  ['子智能体', '子代理'],
  ['默认', '預設'],
  ['设置', '設定'],
  ['偏好设置', '偏好設定'],
  ['自定义', '自訂'],
  ['插件市场', '外掛市集'],
  ['扩展市场', '擴充市集'],
  ['插件', '外掛'],
  ['扩展', '擴充功能'],
  ['缓存', '快取'],
  ['服务器', '伺服器'],
  ['服务端', '伺服器端'],
  ['内存', '記憶體'],
  ['硬盘', '硬碟'],
  ['云端硬盘', '雲端硬碟'],
  ['屏幕', '螢幕'],
  ['鼠标', '滑鼠'],
  ['光标', '游標'],
  ['环境变量', '環境變數'],
  ['变量', '變數'],
  ['控制台', '主控台'],
  ['终端', '終端機'],
  ['窗口', '視窗'],
  ['标签页', '分頁'],
  ['快捷键', '快捷鍵'],
  ['菜单', '選單'],
  ['对话框', '對話方塊'],
  ['弹窗', '彈窗'],
  ['剪切', '剪下'],
  ['粘贴', '貼上'],
  ['撤销', '復原'],
  ['重做', '重做'],
  ['查找', '尋找'],
  ['替换', '取代'],
  ['搜索', '搜尋'],
  ['筛选', '篩選'],
  ['创建', '建立'],
  ['打开', '開啟'],
  ['关闭', '關閉'],
  ['退出', '結束'],
  ['重启', '重新啟動'],
  ['重新启动', '重新啟動'],
  ['运行', '執行'],
  ['发送', '傳送'],
  ['消息', '訊息'],
  ['信息', '資訊'],
  ['隐私', '隱私權'],
  ['连接', '連線'],
  ['链接', '連結'],
  ['网络', '網路'],
  ['打印', '列印'],
  ['浏览', '瀏覽'],
  ['日志', '記錄檔'],
  ['队列', '佇列'],
  ['异步', '非同步'],
  ['当前', '目前'],
  ['刷新', '重新整理'],
  ['加载', '載入'],
  ['卸载', '解除安裝'],
  ['启用', '啟用'],
  ['禁用', '停用'],
  ['保存', '儲存'],
  ['还原', '還原'],
  ['重置', '重設'],
  ['详情', '詳細資訊'],
  ['帮助', '說明'],
  ['反馈', '意見回饋'],
  ['报告', '回報'],
  ['跳过', '略過'],
  ['归档', '封存'],
  ['置顶', '釘選'],
  ['派生', '分支'],
  ['账号', '帳號'],
  ['账户', '帳戶'],
  ['权限', '權限'],
  ['视图', '檢視'],
  ['数据', '資料'],
  ['代码', '程式碼'],
  ['脚本', '腳本'],
  ['调试', '偵錯'],
  ['超时', '逾時'],
  ['重试', '重試'],
  ['导出', '匯出'],
  ['导入', '匯入'],
  ['预览', '預覽'],
  ['支持', '支援'],
  ['兼容', '相容'],
  ['空闲', '閒置'],
  ['工作流', '工作流程'],
  ['定时任务', '排程任務'],
  ['拖拽', '拖曳'],
  ['拖动', '拖動'],
  ['点击', '點擊'],
  ['单击', '單擊'],
  ['双击', '雙擊'],
  ['悬停', '懸停'],
  ['滚动', '捲動'],
  ['音频', '音訊'],
  ['视频', '視訊'],
  ['图像', '影像'],
  ['图片', '圖片'],
  ['字体', '字型'],
  ['颜色', '色彩'],
  ['主题', '佈景主題'],
  ['后台', '背景'],
  ['前台', '前景'],
  ['发现', '發現'],
  ['发布', '發佈'],
  ['开发', '開發'],
  ['触发', '觸發'],
  ['之后', '之後'],
  ['以后', '以後'],
  ['后面', '後面'],
  ['后续', '後續'],
  ['然后', '然後'],
  ['最后', '最後'],
  ['最近', '最近'],
  ['里面', '裡面'],
  ['这里', '這裡'],
  ['那里', '那裡'],
  ['哪里', '哪裡'],
  ['恢复', '恢復'],
  ['复制', '複製'],
  ['重复', '重複'],
  ['修复', '修復'],
  ['复杂', '複雜'],
  ['复合', '複合'],
  ['历史', '歷史'],
  ['日历', '日曆'],
  ['遍历', '遍歷'],
  ['准备', '準備'],
  ['准确', '準確'],
  ['批准', '核准'],
  ['标准', '標準'],
  ['剩余', '剩餘'],
  ['其余', '其餘'],
  ['多余', '多餘'],
  ['云端', '雲端'],
  ['范围', '範圍'],
  ['规范', '規範'],
  ['计划', '計畫'],
  ['规划', '規劃'],
  ['特征', '特徵'],
  ['宽松', '寬鬆'],
  ['轻松', '輕鬆'],
  ['必须', '必須'],
  ['无须', '無須'],
  ['备注', '備註'],
  ['批注', '批註'],
  ['注释', '註釋'],
  ['标注', '標註'],
  ['关注', '關注'],
  ['注册', '註冊'],
  ['注入', '注入'],
  ['分钟', '分鐘'],
  ['秒钟', '秒鐘'],
  ['时钟', '時鐘'],
  ['游离', '游離'],
  ['漫游', '漫遊'],
  ['游标', '游標'],
  ['上游', '上游'],
  ['下游', '下游'],
  ['证据', '證據'],
  ['根据', '根據'],
  ['凭据', '憑據'],
  ['依据', '依據'],
  ['占据', '佔據'],
  ['复用', '複用'],
  ['可复用', '可複用'],
  ['回复', '回覆'],
  ['重复', '重複'],
  ['反复', '反覆'],
  ['之后', '之後'],
  ['以后', '以後'],
  ['后续', '後續'],
  ['随后', '隨後'],
  ['稍后', '稍後'],
  ['最后', '最後'],
  ['然后', '然後'],
  ['此后', '此後'],
  ['过后', '過後'],
  ['背后', '背後'],
  ['前后', '前後'],
  ['向后', '向後'],
  ['往后', '往後'],
  ['后退', '後退'],
  ['滞后', '滯後'],
  ['后缀', '後綴'],
  ['后备', '後備'],
  ['项目', '專案'],
  ['通用', '一般'],
  ['审查', '檢閱'],
  ['收起', '收合'],
  ['清空', '清除'],
  ['应用', '套用'],
  ['应用程序', '應用程式'],
  ['程序', '程式'],
  ['组件', '元件'],
  ['套件', '套件'],
  ['组合包', '組合包'],
  ['产物', '產物'],
  ['工件', '成品'],
  ['全局', '全域'],
  ['本地', '本機'],
  ['远程', '遠端'],
  ['主机', '主機'],
  ['桌面', '桌面'],
  ['网页', '網頁'],
  ['网站', '網站'],
  ['网址', '網址'],
  ['邮箱', '電子郵件'],
  ['邮箱地址', '電子郵件地址'],
  ['电子邮箱', '電子郵件'],
  ['凭据', '憑證'],
  ['密钥', '金鑰'],
  ['令牌', '權杖'],
  ['额度', '額度'],
  ['配额', '配額'],
  ['积分', '點數'],
  ['订阅', '訂閱'],
  ['套餐', '方案'],
  ['并发', '並行'],
  ['线程', '執行緒'],
  ['进程', '處理程序'],
  ['处理程序', '處理常式'],
  ['钩子', '掛鉤'],
  ['提示词', '提示詞'],
  ['上下文', '上下文'],
  ['字符', '字元'],
  ['字符串', '字串'],
  ['回车', 'Enter'],
  ['空格', '空白鍵'],
  ['仅此', '僅此'],
  ['总是', '一律'],
  ['始终', '始終'],
  ['从未', '從未'],
  ['暂无', '暫無'],
  ['没有', '沒有'],
  ['确定', '確定'],
  ['确认', '確認'],
  ['警告', '警告'],
  ['错误', '錯誤'],
  ['提示', '提示'],
  ['成功', '成功'],
  ['失败', '失敗'],
  ['只读', '唯讀'],
  ['只有', '只有'],
  ['只是', '只是'],
  ['只要', '只要'],
  ['只需', '只需'],
  ['系列', '系列'],
  ['系统', '系統'],
  ['联系', '聯絡'],
  ['关系', '關係'],
  ['关联', '關聯'],
  ['对话', '對話'],
  ['会话', '工作階段'],
  ['回合', '回合'],
  ['轮次', '輪次'],
  ['步骤', '步驟'],
  ['目标', '目標'],
  ['动态', '動態'],
  ['静态', '靜態'],
  ['看板', '看板'],
  ['图谱', '圖譜'],
  ['蜂巢', '蜂巢'],
  ['回放', '重播'],
  ['录制', '錄製'],
  ['麦克风', '麥克風'],
  ['语音', '語音'],
  ['音色', '音色'],
  ['转写', '轉錄'],
  ['安全', '安全'],
  ['认证', '驗證'],
  ['验证', '驗證'],
  ['授权', '授權'],
  ['加密', '加密'],
  ['解密', '解密'],
  ['压缩', '壓縮'],
  ['解压', '解壓縮'],
  ['安装', '安裝'],
  ['更新', '更新'],
  ['检查', '檢查'],
  ['检测', '偵測'],
  ['探测', '偵測'],
  ['自动', '自動'],
  ['手动', '手動'],
  ['交互', '互動'],
  ['协作', '協作'],
  ['协同', '協同'],
  ['编排', '編排'],
  ['协调器', '協調器'],
  ['旁白', '旁白'],
  ['监控', '監控'],
  ['遥测', '遙測'],
  ['诊断', '診斷'],
  ['性能', '效能'],
  ['效率', '效率'],
  ['优化', '最佳化'],
  ['默认情况下', '預設情況下'],
  ['例如', '例如'],
  ['至少', '至少'],
  ['最多', '最多'],
  ['超过', '超過'],
  ['超出', '超出'],
  ['小于', '小於'],
  ['大于', '大於'],
  ['等于', '等於'],
  ['包含', '包含'],
  ['排除', '排除'],
  ['忽略', '略過'],
  ['阻止', '封鎖'],
  ['拒绝', '拒絕'],
  ['允许', '允許'],
  ['禁止', '禁止'],
  ['限制', '限制'],
  ['上限', '上限'],
  ['下限', '下限'],
];
// Sort phrase rules longest-first so multi-char phrases beat short substrings
TW_PHRASE_MAP.sort((a, b) => b[0].length - a[0].length);

// Comprehensive Simplified -> Traditional CJK single-character map (common UI/technical characters)
const S2T_CHARS_SRC =
  '万与丑专业丛东丝丢两严丧个丰临为丽举么义乌乐乔习乡书买乱争于亏云亚产亩亲亵亿仅从仑仓仪们价众优伙会伞伟传伤伦伪伫体余佣佩佳使例供依侠侣侦侧侨保信俩修俯俱倍倒候借倦值倾假伟偏做停健偶偷偿储催傲傻像僚僧僵儿允兄充先光克免党兰关兴兹养兽内冈册写军农冠冬冯冰冲决况冻净凄准凉减凑凝几凭凯凰出击函凿划刘则创初删判别利刮到制刷券刹刺刻剂剃削前剑剔剖剥剧剩剪副割力劝办功加务劣动助努劫励劲劳势勃勇勉勋勒勘募勤协博占卢卫却卷厂厅历厉压厌厕厢厨去县参又双反发叔取受变叙叠古只叫召可台史右号司叹吃各合吉同名后吐向吓吕吗君吝吞否吧含听启呈吴吸吹吻吼呀呆告呐员呜呢周味呵呼命和咀咱哀品哇哈响哎哑哄哑哇咽咱哀品哲哭哮哪售唯唱商啊问啸啥啦啪喀喂善喇喊喜喝喧喷喻嗓嗜嗡嗣叹嘉嘎嘘嘛嘲嘴嘻嘿器噩喷噪吓团园困囱围固国图圆圈圣在场坏块坚坛坝坠垒垦垫垮埃埋城域培基堂堆堕堡堪塑塔涂塞填境墓墙增墨壁压坏垄壳声处备复夏够头夸夹夺奋奖套奥女妆妇妈妖妙妥妨妹妻始姐姑姓委姿威娃娘娱娶婆婉婚婴婶媒嫁嫌嫩子孔字存孙学季孤孩孵宁它宇守安完宏宗官宙定宛宜实审客宣室宫宪害家容宽宾宿寂寄密富寒察寡寝实宠审对寻导寿将尊小少尔尘尚尝尤就尺尼尽尾局层居屈屋展属履山岁岂岗岛岩岭岳岸峡峰崎崩川州巡工巧巨差己已巴布帅师希帐帕帖帝带席帮常帽幅幕币干平年并幸幻幼广庄庆庇床序库应底店庙府度座庭康庸廉廊廓延建开异弃弄式引张弥弦弯弹强归当录形彩影彻彼往征径待很律后徒得徘徙御复微德心必忆忍志忘忙忠忧快念忽怀态怒怕怜思急怨怪恋恒恐恕恢恨恩恰恶恼悄悉悔悟患悲闷情惊惑惜惠惧惨惩惫惯想惹愁愈愉意愚感愧慈慌慎慕慢慰庆忧懂懒怀悬成我戒或战截户房所扁扇手才扎扑打托扛扣执扩扫扬扭扮扯扰扶批找承技抄把抓投抖抗折抚抛抠抡抢护报披抬抱抵抹抽担拆拉拌拍拎拐拒拓拔拖招拜拟拢拣拥拦拧拨择括拭拯拱拳拾拿持挂指按挑挖挨挪挫振挺挽捂捆捉捕损捡换掉掌排掏掠探接控推掩措掷揉描提插握揣揭援揽搜搞搬搭携摄摆摇摊摔摘摩摸撑撒撕撞撤撩播撮撰扑撵撼操擒擅擦攀支收改攻放政故效敌敏救教敛散敬数整敲文斋斑斗料斜斤斥断斯新方旁旅旋族旗无既日旦旧早旬时旺昂昆昌明昏易昔星映春昨昭是显晃晋晒晓晕晚晨普景晰晴晶智暂暑暖暗暮暴曲更书曾替最会月有朋服朗望朝期木未末本术朱朴机杀杂权杆李材村杖杜束条来杨杭杯杰松板极构析林果枝枢枪枫架柏某染柔柜查柬柱柳柴标栈栋栏树栖样校核根格框案桌桑档桥桦桩桶梁梅梦梯械梳检棉棋棍棒棕棚森棱棵植椒椭椰椿杨楚楼概榜荣构榴槽乐樊标模横樱橡机权次欢欣欧欲欺款歇歌正此步武歧歪死殊残段杀毁母每毒比毛毫氏民气氧氢水永求汇汉汗汝江池汤汪汹汽沃沈沉沙沟没沧沫河油治沼沿泄泉泊泌法泡波泥注泪泰泳泽洁洋洒洗洛洞津洪洲活洽派流浅测济浑浓浙浦浩浪浮浴海浸涂消涉涌液涵淋淑淘淡淤净深混淹添清渊渐渔渗渡渣温测港游湖湘湾湿溃溅滋滑滔滚满滤滥滨滩滴漂漏演漠漫涨激浊浓湿济涛滥涛火灭灯灰灵灶灾灿炉炎炒炫炮炸点炼烂烈烤烦烧热焦焰然无然煤照煮熊熏熔熟燃爆爱爷爸爽片版牌牙牛牧物牲特牵犀牺犬犯状犹狂狐狗狠独狭狮狱狼猎猛猜猫献猴玄率玉王玩环现玻珊珍珠班现球理琐瑞瑟瑰瑶环瓜瓦瓶甘甜生用甩田由甲申电男画畅界留略番画异当疏疑疗疯症疲疼疾病痕痛痴痒登白百的皂的皇皮盈益监盒盖盘盛盟目直相盼盾省眉看真眠眼着睁睡督瞒瞧瞩矛矢知短石研砖破砸硬碎碗碟碑碰磁磨示礼社祖祝神祥票祭禁祸福禅离秀私秋科秒秘租秤秦稀税程稳稻稿谷究穷空穿突窃窄窗窝立竖站竞竟章童端竹笑笔笛符第等筋筑筒答策筹签简算管箱节范茎茅茧草荐荒荣药荷获莱莲获营萧萨落著葛葬葱葵蒋蒙蒸蓄蓝蔓蔬蕴藏藤药虎虑虚虫虹虽虾蚀蚁蚊蛇蛋蛙蜂蜗蝉蝶融血行街衡衣表衰补衬袋装裤西要覆见观规觅视览觉角解触言订计认讨让训议讯记讲讳讶许论讼设访证评识诉词译试诗诚话诞询该详语误说请诸诺读课谁调谅谈谊谋谓谜谢谨谦谣谱谷豆象豪貌贝贞负贡财责贤败货质贩贪贫购贯贱贴贵贷贸费贺贼资贾贿赏赔赖赚赛赞赠赢赤走赴起趁超越趋足跃距跟跨路跳踏踢踩身躯车轨轩转轮软轰轻载较辅辆辈辉辑输辞辩边达迁过迈迎运近返还这进远违连迟追退送适逃选逊透通递途逛逝速造逢连逮进逸遇遍道遗遥遭遮避邀那邦邪邮邻郁郊郎郑部郭都配酒酷酸酿采释里重野量金鉴针钉钙钛钟钢钦钩钮钱钻铁铃铅缺铜铝铭铲银铸铺链销锁锅锋错锡锦键锯镇镜长门闪闭问闯闲间闷闸闹闻阀阁阅队列防阳阴阵阶阻阿附际陆陈降限院除险陪陵陶陷隆随隐隔障难雄集雅雕雨雪雾震霉霜露霸青静非面革鞋音页顶项顺须顽顾顿预领颇颈频颗题颜额风飘飞食餐饥饭饮饰饱饼馆首香马驱驳驴驶驻驾验骑骗骚骨高鱼鲜鸡鸣鸭鹅黄黑默鼓鼠鼻齐齿龄龙龟' +
  '刚匀区医单唤屿屉帧总戏昵杠滞潜烁烟睐码础确碍种积称类紧纠级纯纲纳线练组织终绍经绑结绕绘给绝统继绪续维缀缓编缘缝缩职联聪胁胜胶脑脱腊账赋践踪逻锚阐隶颁据泄淀后余准';
const S2T_TRAD_SRC =
  '萬與丑專業叢東絲丟兩嚴喪個豐臨為麗舉麼義烏樂喬習鄉書買亂爭於虧雲亞產畝親褻億僅從侖倉儀們價眾優夥會傘偉傳傷倫偽佇體餘傭佩佳使例供依俠侶偵側僑保信倆修俯俱倍倒候借倦值傾假偉偏做停健偶偷償儲催傲傻像僚僧僵兒允兄充先光克免黨蘭關興茲養獸內岡冊寫軍農冠冬馮冰衝決況凍淨淒準涼減湊凝幾憑凱凰出擊函鑿劃劉則創初刪判別利刮到制刷券剎刺刻劑剃削前劍剔剖剝劇剩剪副割力勸辦功加務劣動助努劫勵勁勞勢勃勇勉勳勒勘募勤協博占盧衛卻捲廠廳歷厲壓厭廁廂廚去縣參又雙反發叔取受變敘疊古只叫召可台史右號司嘆吃各合吉同名後吐向嚇呂嗎君吝吞否吧含聽啟呈吳吸吹吻吼呀呆告吶員嗚呢周味呵呼命和咀咱哀品哇哈響哎啞哄啞哇咽咱哀品哲哭哮哪售唯唱商啊問嘯啥啦啪喀喂善喇喊喜喝喧噴喻嗓嗜嗡嗣嘆嘉嘎噓嘛嘲嘴嘻嘿器噩噴噪嚇團園困囪圍固國圖圓圈聖在場壞塊堅壇壩墜壘墾墊垮埃埋城域培基堂堆墮堡堪塑塔塗塞填境墓牆增墨壁壓壞壟殼聲處備復夏夠頭誇夾奪奮獎套奧女妝婦媽妖妙妥妨妹妻始姐姑姓委姿威娃娘娛娶婆婉婚嬰嬸媒嫁嫌嫩子孔字存孫學季孤孩孵寧它宇守安完宏宗官宙定宛宜實審客宣室宮憲害家容寬賓宿寂寄密富寒察寡寢實寵審對尋導壽將尊小少爾塵尚嘗尤就尺尼盡尾局層居屈屋展屬履山歲豈崗島岩嶺岳岸峽峰崎崩川州巡工巧巨差己已巴布帥師希帳帕帖帝帶席幫常帽幅幕幣干平年並幸幻幼廣莊慶庇床序庫應底店廟府度座庭康庸廉廊廓延建開異棄弄式引張彌弦彎彈強歸當錄形彩影徹彼往徵徑待很律後徒得徘徙御復微德心必憶忍志忘忙忠憂快念忽懷態怒怕憐思急怨怪戀恆恐恕恢恨恩恰惡惱悄悉悔悟患悲悶情驚惑惜惠懼慘懲憊慣想惹愁愈愉意愚感愧慈慌慎慕慢慰慶憂懂懶懷懸成我戒或戰截戶房所扁扇手才扎撲打托扛扣執擴掃揚扭扮扯擾扶批找承技抄把抓投抖抗折撫拋摳掄搶護報披抬抱抵抹抽擔拆拉拌拍拎拐拒拓拔拖招拜擬攏揀擁攔擰撥擇括拭拯拱拳拾拿持掛指按挑挖挨挪挫振挺挽捂捆捉捕損撿換掉掌排掏掠探接控推掩措擲揉描提插握揣揭援攬搜搞搬搭攜攝擺搖攤摔摘摩摸撐撒撕撞撤撩播撮撰撲攆撼操擒擅擦攀支收改攻放政故效敵敏救教斂散敬數整敲文齋斑斗料斜斤斥斷斯新方旁旅旋族旗無既日旦舊早旬時旺昂昆昌明昏易昔星映春昨昭是顯晃晉晒曉暈晚晨普景晰晴晶智暫暑暖暗暮暴曲更書曾替最會月有朋服朗望朝期木未末本術朱樸機殺雜權杆李材村杖杜束條來楊杭杯傑松板極構析林果枝樞槍楓架柏某染柔櫃查柬柱柳柴標棧棟欄樹棲樣校核根格框案桌桑檔橋樺樁桶梁梅夢梯械梳檢棉棋棍棒棕棚森棱棵植椒橢椰椿楊楚樓概榜榮構榴槽樂樊標模橫櫻橡機權次歡欣歐欲欺款歇歌正此步武歧歪死殊殘段殺毀母每毒比毛毫氏民氣氧氫水永求匯漢汗汝江池湯汪洶汽沃沈沉沙溝沒滄沫河油治沼沿泄泉泊泌法泡波泥注淚泰泳澤潔洋灑洗洛洞津洪洲活洽派流淺測濟渾濃浙浦浩浪浮浴海浸塗消涉湧液涵淋淑淘淡淤淨深混淹添清淵漸漁滲渡渣溫測港游湖湘灣濕潰濺滋滑滔滾滿濾濫濱灘滴漂漏演漠漫漲激濁濃濕濟濤濫濤火滅燈灰靈灶災燦爐炎炒炫炮炸點煉爛烈烤煩燒熱焦焰然無然煤照煮熊熏熔熟燃爆愛爺爸爽片版牌牙牛牧物牲特牽犀犧犬犯狀猶狂狐狗狠獨狹獅獄狼獵猛猜貓獻猴玄率玉王玩環現玻珊珍珠班現球理瑣瑞瑟瑰瑤環瓜瓦瓶甘甜生用甩田由甲申電男畫暢界留略番畫異當疏疑療瘋症疲疼疾病痕痛癡癢登白百的皂的皇皮盈益監盒蓋盤盛盟目直相盼盾省眉看真眠眼著睜睡督瞞瞧矚矛矢知短石研磚破砸硬碎碗碟碑碰磁磨示禮社祖祝神祥票祭禁禍福禪離秀私秋科秒秘租秤秦稀稅程穩稻稿穀究窮空穿突竊窄窗窩立豎站競竟章童端竹笑筆笛符第等筋築筒答策籌簽簡算管箱節範莖茅繭草薦荒榮藥荷獲萊蓮獲營蕭薩落著葛葬蔥葵蔣蒙蒸蓄藍蔓蔬蘊藏藤藥虎慮虛蟲虹雖蝦蝕蟻蚊蛇蛋蛙蜂蝸蟬蝶融血行街衡衣表衰補襯袋裝褲西要覆見觀規覓視覽覺角解觸言訂計認討讓訓議訊記講諱訝許論訟設訪證評識訴詞譯試詩誠話誕詢該詳語誤說請諸諾讀課誰調諒談誼謀謂謎謝謹謙謠譜穀豆象豪貌貝貞負貢財責賢敗貨質販貪貧購貫賤貼貴貸貿費賀賊資賈賄賞賠賴賺賽讚贈贏赤走赴起趁超越趨足躍距跟跨路跳踏踢踩身軀車軌軒轉輪軟轟輕載較輔輛輩輝輯輸辭辯邊達遷過邁迎運近返還這進遠違連遲追退送適逃選遜透通遞途逛逝速造逢連逮進逸遇遍道遺遙遭遮避邀那邦邪郵鄰鬱郊郎鄭部郭都配酒酷酸釀采釋里重野量金鑑針釘鈣鈦鐘鋼欽鉤鈕錢鑽鐵鈴鉛缺銅鋁銘鏟銀鑄鋪鏈銷鎖鍋鋒錯錫錦鍵鋸鎮鏡長門閃閉問闖閒間悶閘鬧聞閥閣閱隊列防陽陰陣階阻阿附際陸陳降限院除險陪陵陶陷隆隨隱隔障難雄集雅雕雨雪霧震霉霜露霸青靜非面革鞋音頁頂項順須頑顧頓預領頗頸頻顆題顏額風飄飛食餐飢飯飲飾飽餅館首香馬驅駁驢駛駐駕驗騎騙騷骨高魚鮮雞鳴鴨鵝黃黑默鼓鼠鼻齊齒齡龍龜' +
  '剛勻區醫單喚嶼屜幀總戲暱槓滯潛爍煙睞碼礎確礙種積稱類緊糾級純綱納線練組織終紹經綁結繞繪給絕統繼緒續維綴緩編緣縫縮職聯聰脅勝膠腦脫臘帳賦踐蹤邏錨闡隸頒據洩澱後餘準';

const S2T_CHAR_MAP = new Map();
{
  const sArr = Array.from(S2T_CHARS_SRC);
  const tArr = Array.from(S2T_TRAD_SRC);
  const len = Math.min(sArr.length, tArr.length);
  for (let i = 0; i < len; i++) {
    if (sArr[i] !== tArr[i] && !S2T_CHAR_MAP.has(sArr[i])) {
      S2T_CHAR_MAP.set(sArr[i], tArr[i]);
    }
  }
}

function toTraditionalChinese(text) {
  if (!text || typeof text !== 'string') return text;
  // Preserve placeholders ($1, $2, etc.) and ASCII segments naturally
  let out = text;
  for (const [sc, tc] of TW_PHRASE_MAP) {
    if (out.includes(sc)) {
      out = out.split(sc).join(tc);
    }
  }
  let res = '';
  for (const ch of out) {
    res += S2T_CHAR_MAP.get(ch) || ch;
  }
  return res;
}

function isCleanExactKey(key) {
  if (!key || typeof key !== 'string') return false;
  if (key.length > 1500) return false;
  // Reject keys containing Chinese characters (corrupted/half-translated keys)
  if (/[\u4e00-\u9fa5]/.test(key)) return false;
  return true;
}

function compilePatternRule(pattern, flags, replace) {
  if (!pattern || typeof pattern !== 'string' || typeof replace !== 'string') return null;
  // Skip rules whose pattern matches half-Chinese artifacts unless explicitly needed
  if (/[\u4e00-\u9fa5]/.test(pattern)) return null;
  if (BLOCKED_LEGACY_PATTERNS.has(pattern)) return null;
  try {
    new RegExp(pattern, flags || '');
  } catch {
    return null;
  }
  return { pattern, flags: flags || '', replace };
}

// Curated Traditional Chinese (zh-TW) overrides (authentic Taiwanese terminology)
const CURATED_EXACT_TW = {
  'File': '檔案',
  'Edit': '編輯',
  'Selection': '選取',
  'View': '檢視',
  'Go': '前往',
  'Run': '執行',
  'Terminal': '終端機',
  'Window': '視窗',
  'Help': '說明',
  'New Window': '新增視窗',
  'Close Window': '關閉視窗',
  'Close': '關閉',
  'Quit': '結束',
  'Exit': '結束',
  'Undo': '復原',
  'Redo': '重做',
  'Cut': '剪下',
  'Copy': '複製',
  'Paste': '貼上',
  'Select All': '全選',
  'Find': '尋找',
  'Replace': '取代',
  'Reload': '重新載入',
  'Force Reload': '強制重新載入',
  'Toggle Developer Tools': '切換開發人員工具',
  'Actual Size': '實際大小',
  'Zoom In': '放大',
  'Zoom Out': '縮小',
  'Reset Zoom': '重設縮放',
  'Toggle Full Screen': '切換全螢幕',
  'Toggle Fullscreen': '切換全螢幕',
  'Minimize': '最小化',
  'Check for Updates...': '檢查更新...',
  'Check for Updates': '檢查更新',
  'About Antigravity': '關於 Antigravity',
  'Connect to WSL': '連線至 WSL',
  'Reopen Locally': '在本機重新開啟',
  'No agents running': '目前無執行中的代理',
  'Open Antigravity': '開啟 Antigravity',
  'Show Antigravity': '顯示 Antigravity',
  'Hide Antigravity': '隱藏 Antigravity',
  'New Chat': '新增對話',
  'New Conversation': '新增對話',
  'New Agent': '新增代理',
  'Conversations': '對話列表',
  'Recent Conversations': '最近對話',
  'Pinned': '已釘選',
  'Pin': '釘選',
  'Unpin': '取消釘選',
  'Rename': '重新命名',
  'Delete': '刪除',
  'Archive': '封存',
  'Search': '搜尋',
  'Search conversations...': '搜尋對話...',
  'Search plugins...': '搜尋外掛...',
  'Search files...': '搜尋檔案...',
  'Settings': '設定',
  'Preferences': '偏好設定',
  'General': '一般',
  'Appearance': '外觀',
  'Theme': '佈景主題',
  'Light': '淺色',
  'Dark': '深色',
  'System': '跟隨系統',
  'Follow System': '跟隨系統',
  'Language': '語言',
  'Account': '帳號',
  'Accounts': '帳號管理',
  'Sign In': '登入',
  'Sign in': '登入',
  'Sign Out': '登出',
  'Sign out': '登出',
  'Switch Account': '切換帳號',
  'Profile': '個人資料',
  'Plan': '訂閱方案',
  'Usage': '用量',
  'Quota': '額度',
  'Model': '模型',
  'Models': '模型',
  'Select Model': '選擇模型',
  'Default Model': '預設模型',
  'Customizations': '自訂設定',
  'Plugins': '外掛',
  'Plugin': '外掛',
  'Installed': '已安裝',
  'Marketplace': '市集',
  'Agent Marketplace': '代理市集',
  'Browse Marketplace': '瀏覽市集',
  'Install': '安裝',
  'Uninstall': '解除安裝',
  'Enable': '啟用',
  'Disable': '停用',
  'Enabled': '已啟用',
  'Disabled': '已停用',
  'Skills': '技能',
  'Rules': '規則',
  'Agents': '代理',
  'Subagents': '子代理',
  'Workflows': '工作流程',
  'MCP Servers': 'MCP 伺服器',
  'MCP': 'MCP',
  'Automations': '自動化',
  'Schedules': '排程任務',
  'Workspace': '工作區',
  'Workspaces': '工作區',
  'Open Folder': '開啟資料夾',
  'Open Workspace': '開啟工作區',
  'Add Folder to Workspace': '將資料夾加入工作區',
  'Recent Workspaces': '最近工作區',
  'Remote': '遠端',
  'SSH': 'SSH 遠端',
  'Remote Hosts': '遠端主機',
  'Files': '檔案',
  'Changes': '變更',
  'Diff': '差異比對',
  'Review': '檢閱',
  'Accept': '接受',
  'Accept All': '全部接受',
  'Reject': '拒絕',
  'Reject All': '全部拒絕',
  'Approve': '同意',
  'Deny': '拒絕',
  'Allow': '允許',
  'Allow Once': '僅允許此次',
  'Always Allow': '一律允許',
  'Cancel': '取消',
  'Confirm': '確認',
  'Save': '儲存',
  'Apply': '套用',
  'Reset': '重設',
  'Restore': '還原',
  'Retry': '重試',
  'Continue': '繼續',
  'Stop': '停止',
  'Pause': '暫停',
  'Resume': '繼續',
  'Send': '傳送',
  'Attach': '附件',
  'Attach file': '加入附件',
  'Upload': '上傳',
  'Download': '下載',
  'Export': '匯出',
  'Import': '匯入',
  'Copied': '已複製',
  'Details': '詳細資訊',
  'Show details': '顯示詳細資訊',
  'Hide details': '隱藏詳細資訊',
  'View more': '檢視更多',
  'Show less': '收合',
  'Thinking': '思考中',
  'Thought': '思考過程',
  'Working': '處理中',
  'Running': '執行中',
  'Completed': '已完成',
  'Failed': '失敗',
  'Cancelled': '已取消',
  'Pending': '等待中',
  'Idle': '閒置',
  'Loading...': '載入中...',
  'Connecting...': '連線中...',
  'Connected': '已連線',
  'Disconnected': '已中斷連線',
  'Offline': '離線',
  'Online': '線上',
  'Error': '錯誤',
  'Warning': '警告',
  'Info': '提示',
  'Success': '成功',
  'Ask anything...': '輸入任何問題或指令...',
  'Type a message...': '輸入訊息...',
  'Context': '上下文',
  'Context Window': '上下文視窗',
  'Clear Context': '清除上下文',
  'Compact': '壓縮上下文',
  'Compact Conversation': '壓縮對話上下文',
  'Permissions': '權限',
  'Notifications': '通知',
  'Keyboard Shortcuts': '快捷鍵',
  'Privacy': '隱私權',
  'Security': '安全性',
  'Proxy': '網路代理',
  'Network': '網路',
  'Advanced': '進階',
  'Diagnostics': '診斷',
  'Logs': '記錄檔',
  'Open Logs': '開啟記錄檔',
  'Clear Cache': '清除快取',
  'Restart': '重新啟動',
  'Restart Now': '立即重新啟動',
  'Update Available': '發現新版本',
  "What's New": '更新說明',
  'Documentation': '說明文件',
  'Feedback': '意見回饋',
  'Report Issue': '回報問題',
  'Back': '返回',
  'Next': '下一步',
  'Skip': '略過',
  'Done': '完成',
  'Yes': '是',
  'No': '否',
  'OK': '確定',
  'Confirm Quit': '確認結束',
  'Are you sure you want to quit?': '您確定要結束嗎？',
  'There may be agents or background tasks running.': '可能還有代理或背景任務正在執行。',
};

const CURATED_REGEX_TW_MAP = new Map([
  ['^(\\d+)\\s+agents?\\s+running$\u0000i', '$1 個代理執行中'],
  ['^Running\\s+(\\d+)\\s+tools?$\u0000i', '正在執行 $1 個工具'],
  ['^(\\d+)\\s+files?\\s+changed$\u0000i', '已變更 $1 個檔案'],
  ['^(\\d+)\\s+items?$\u0000i', '$1 項'],
  ['^(\\d+)\\s+selected$\u0000i', '已選取 $1 項'],
  ['^([0-9.,]+)\\s*tokens?\\s+used$\u0000i', '已用 $1 tokens'],
  ['^([0-9.,]+)%\\s+remaining$\u0000i', '剩餘 $1%'],
  ['^Resets\\s+in\\s+(.+)$\u0000i', '距離重設剩餘 $1'],
  ['^Updated\\s+(.+)\\s+ago$\u0000i', '$1前更新'],
  ['^(\\d+)\\s+seconds?\\s+ago$\u0000i', '$1 秒前'],
  ['^(\\d+)\\s+minutes?\\s+ago$\u0000i', '$1 分鐘前'],
  ['^(\\d+)\\s+hours?\\s+ago$\u0000i', '$1 小時前'],
  ['^(\\d+)\\s+days?\\s+ago$\u0000i', '$1 天前'],
  ['^Just now$\u0000i', '剛剛'],
  ['^Thought\\s+for\\s+(.+)$\u0000i', '已思考 $1'],
  ['^Open\\s+(.+)$\u0000', '開啟 $1'],
  ['^Close\\s+(.+)$\u0000', '關閉 $1'],
  ['^Connect\\s+to\\s+(.+)$\u0000', '連線至 $1'],
  ['^Quit\\s+Antigravity\\??$\u0000i', '確定要結束 Antigravity 嗎？'],
]);

function main() {
  const opts = parseCliArgs(process.argv.slice(2));
  const sourcesUsed = [];

  const exactCN = {};
  const regexCN = [];
  const seenRegex = new Set();

  function addExact(k, v) {
    if (!isCleanExactKey(k) || !v || typeof v !== 'string') return;
    exactCN[k] = v;
  }

  function addRegex(pattern, flags, replace) {
    const rule = compilePatternRule(pattern, flags, replace);
    if (!rule) return;
    const sig = `${rule.pattern}\u0000${rule.flags}`;
    if (seenRegex.has(sig)) return;
    seenRegex.add(sig);
    regexCN.push(rule);
  }

  // 1. Curated high-priority regex rules first (test & runtime guarantees)
  for (const r of CURATED_REGEX_CN) {
    addRegex(r.pattern, r.flags, r.replace);
  }

  // 2. Existing dict.zh-CN.json (baseline preservation)
  const existingCN = readJsonSafe(OUT_CN);
  if (existingCN && existingCN.exact) {
    sourcesUsed.push('existing:dict.zh-CN.json');
    for (const [k, v] of Object.entries(existingCN.exact)) {
      addExact(k, v);
    }
    for (const r of existingCN.regex || []) {
      addRegex(r.pattern, r.flags, r.replace);
    }
  }

  // 3. Curated TW overrides (independent of previous build output so runs are deterministic)
  const curatedTWExact = CURATED_EXACT_TW;
  const curatedTWRegexMap = CURATED_REGEX_TW_MAP;

  // 4. REF_PRISM/vendor/host-i18n/zh-CN.json
  const prismDict = readJsonSafe(path.join(opts.refPrism, 'vendor', 'host-i18n', 'zh-CN.json'));
  if (prismDict) {
    sourcesUsed.push(`REF_PRISM(${Object.keys(prismDict.exact || {}).length})`);
    for (const [k, v] of Object.entries(prismDict.exact || {})) addExact(k, v);
    for (const p of prismDict.patterns || []) addRegex(p.regex, p.flags || '', p.replacement);
  }

  // 5. REF_ACV/i18n/zh-CN.json
  const acvDict = readJsonSafe(path.join(opts.refAcv, 'i18n', 'zh-CN.json'));
  if (acvDict) {
    sourcesUsed.push(`REF_ACV(${Object.keys(acvDict.exact || {}).length})`);
    for (const [k, v] of Object.entries(acvDict.exact || {})) addExact(k, v);
    for (const p of acvDict.patterns || []) addRegex(p.regex, p.flags || '', p.replacement);
  }

  // 6. REF_I18N/src/dictionary.js + REF_I18N/localize.js (highest authority for 2.34.0)
  const refI18nDictPath = path.join(opts.refI18n, 'src', 'dictionary.js');
  if (fs.existsSync(refI18nDictPath)) {
    const refMod = require(refI18nDictPath);
    const refExact = refMod.dictionary || {};
    sourcesUsed.push(`REF_I18N(${Object.keys(refExact).length})`);
    for (const [k, v] of Object.entries(refExact)) {
      addExact(k, v);
    }
  }

  const refLocalizePath = path.join(opts.refI18n, 'localize.js');
  if (fs.existsSync(refLocalizePath)) {
    const menuMap = extractObjectMapFromLocalizeJs(refLocalizePath, 'menuTranslationMap');
    const ctxMap = extractObjectMapFromLocalizeJs(refLocalizePath, 'contextMenuTranslationMap');
    sourcesUsed.push(`REF_I18N:menus(${Object.keys(menuMap).length}+${Object.keys(ctxMap).length})`);
    for (const [k, v] of Object.entries(menuMap)) addExact(k, v);
    for (const [k, v] of Object.entries(ctxMap)) addExact(k, v);
  }

  // 7. Curated overrides win for core labels ("Settings": "设置", etc.)
  for (const [k, v] of Object.entries(CURATED_EXACT_CN)) {
    addExact(k, v);
  }

  // Sort exact keys deterministically for clean diffs
  const sortedExactCN = {};
  for (const k of Object.keys(exactCN).sort()) {
    sortedExactCN[k] = exactCN[k];
  }

  const outDictCN = {
    exact: sortedExactCN,
    regex: regexCN,
  };

  // Build zh-TW dictionary (curated TW overrides + automated S2T phrase & char conversion)
  const sortedExactTW = {};
  for (const k of Object.keys(sortedExactCN)) {
    sortedExactTW[k] = Object.prototype.hasOwnProperty.call(curatedTWExact, k)
      ? curatedTWExact[k]
      : toTraditionalChinese(sortedExactCN[k]);
  }
  // Ensure any curated TW-only keys remain
  for (const [k, v] of Object.entries(curatedTWExact)) {
    if (!Object.prototype.hasOwnProperty.call(sortedExactTW, k)) {
      sortedExactTW[k] = v;
    }
  }

  const regexTW = regexCN.map((r) => {
    const sig = `${r.pattern}\u0000${r.flags}`;
    const replaceTW = curatedTWRegexMap.has(sig)
      ? curatedTWRegexMap.get(sig)
      : toTraditionalChinese(r.replace);
    return {
      pattern: r.pattern,
      flags: r.flags,
      replace: replaceTW,
    };
  });

  const outDictTW = {
    exact: sortedExactTW,
    regex: regexTW,
  };

  fs.mkdirSync(path.dirname(OUT_CN), { recursive: true });
  fs.writeFileSync(OUT_CN, JSON.stringify(outDictCN, null, 2) + '\n', 'utf8');
  fs.writeFileSync(OUT_TW, JSON.stringify(outDictTW, null, 2) + '\n', 'utf8');

  const cnCount = Object.keys(sortedExactCN).length;
  const twCount = Object.keys(sortedExactTW).length;
  console.log(`[build-i18n] Sources: ${sourcesUsed.join(', ') || 'curated-only'}`);
  console.log(`[build-i18n] Wrote ${path.relative(ROOT, OUT_CN)}: ${cnCount} exact, ${regexCN.length} regex`);
  console.log(`[build-i18n] Wrote ${path.relative(ROOT, OUT_TW)}: ${twCount} exact, ${regexTW.length} regex`);
}

if (require.main === module) {
  main();
}

module.exports = {
  toTraditionalChinese,
  main,
};
