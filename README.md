# Antigravity Studio v2.0

零外部 npm 依赖的 **Google Antigravity 2.x** 一体化桌面增强引擎——深度整合四大开源社区方案，开箱兼容 `Antigravity 2.34.0+`。

> Built upon [elviscjn-cjn/antigravity-context-viewer](https://github.com/elviscjn-cjn/antigravity-context-viewer), [antigravity-cn-community/Antigravity-Chinese-Localization](https://github.com/antigravity-cn-community/Antigravity-Chinese-Localization), [Nwflower/dsh-claude-style](https://github.com/Nwflower/dsh-claude-style), and [RMvdesi/obsidian-prism](https://github.com/RMvdesi/obsidian-prism) (licensed under [`GPL-3.0`](./LICENSE)). Upstream notices are preserved in [`NOTICE`](./NOTICE) and [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).

---

## 核心特性全景

1. **皮肤、排版与光学质感**
   - **Claude**（暖纸/暖黑 + 陶土橙编辑部风格）& **Antigravity**（原创星轨极光）双预设 + 自定义配色编辑器（支持新建、克隆、删除、强调色自动推导）。
   - 三轨字体（UI / 正文衬线 / 代码等宽），支持把 `.ttf` / `.woff2` / `.otf` 放入 `%LOCALAPPDATA%\AntigravityStudio\fonts\` 自动加载。
   - **Prism 光学质感增强（各自独立开关，静止 0fps 零耗电）**：水墨流式淡入、输入框平滑光标、三态边缘余晖（待确认琥珀 / 报错红 / 后台完成翡翠）、模型菜单推理等级滑块。

2. **三款高清像素桌宠 + 上下分离式 HUD + 新对话首页卡片**
   - **输入框正上方像素桌宠**：支持 **Clawd（像素蟹）**、**Deepy（深海像素鲸）**、**Astra（反重力专属像素星灵）** 三选一；支持左/中/右位置、1x/1.5x/2x 缩放、9 种对话状态实时联动与点击互动。
   - **输入框正下方状态条**：会呼吸的 **512K 浅水波上下文试管** + 极简一行胶囊（百分比、Token 用量、实时 `tok/s`、估算费用、额度余量），悬停查看缓存命中与 TTFT，点击或按 `Ctrl+Shift+G` 打开极简 420px 4-Tab 抽屉。
   - **新对话首页用量卡片**：自动在空白新对话页下方渲染「概览 / 模型」与「全部 / 30 天 / 7 天」视图、2×3 核心指标卡、7 行（周一~周日）热力图与趣味书本换算。

3. **v2.34.0 全量无死角汉化（简 / 繁 / 英）**
   - 合并 **6,607 条精确词条 + 541 条动态正则**，覆盖主界面、侧边栏、设置、插件/MCP 市场、弹窗与原生 Electron 顶部菜单/右键菜单/系统托盘。
   - 严格隔离聊天消息、Thinking、代码编辑器、文件路径、终端与图标字体防止误译；支持自定义词典覆盖与切回 `EN` 100% 无损还原。

4. **真实上下文、额度、历史账本、多账号切号与系统增强**
   - **主进程直连 LanguageServer**：自动对接桌面客户端当前会话与 `~/.gemini/antigravity/` 历史账本（`pricing_ledger_v1.json`、`token_usage_archive_v2.json`），支持逐轮时间线、附件 Token 审计、动态定价同步与 CLI 终端一键唤起。
   - **多账号管理与切号**：支持自动探测当前账号、OAuth 浏览器登录、导入 `~/.antigravity_tools/accounts.json`、刷新各账号额度、一键切号并重启 LS、保活（Keepalive）及低额度自动切号。
   - **全部独立可控的系统增强**：**0~4 档系统提示词**切换与还原、**会话/章节自动中文标题**双向可逆补丁、**多模式上下文真解锁（`ORIG / CONST / DYN` + CLI 对齐）**、**压缩后记忆回填（Compact 防失忆）**。
   - **免 TUN 本地代理**：同时注入主进程、`setupNodeWrapper`、`dist/languageServer.js`（位于 `loginShellEnv` 展开之后避免被覆盖）及 Electron Session，支持 HTTP/SOCKS5、Bypass 列表与一键测速。

---

## 快速命令

```bash
# 查看状态与环境诊断
node cli.js status
node cli.js doctor

# 只读预检 app.asar 全部注入锚点（不改动任何文件）
node cli.js install --dry-run

# 正式安装（请先关闭 Antigravity 客户端；自动保留 app.asar.studio-orig.bak 备份）
node cli.js install --clean-legacy

# 一键无损还原官方原版 app.asar
node cli.js restore

# 不改盘 CDP 热预览（需客户端带 --remote-debugging-port=9222 启动）
node cli.js live --port 9222

# 构建词典、桌宠图集、前端产物与运行全量测试
npm run build:i18n
npm run build:mascot
npm run build
npm test
```
