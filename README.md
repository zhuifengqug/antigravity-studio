# Antigravity Studio

零外部依赖的 **Google Antigravity 2.x** 一体化桌面增强引擎：集成了 Claude Code Desktop / 原创 Antigravity 双预设皮肤、像素桌宠、极简 HUD 状态胶囊、全界面与原生菜单汉化、实时上下文/速度/额度看板、多账号一键切号及免 TUN 本地代理。

## 核心特性

1. **皮肤与极简交互**
   - 内置 **Claude**（暖纸陶橙编辑部风格）与 **Antigravity**（原创星轨极光）两套双模预设，支持新建/克隆/编辑自定义配色与单色自动派生。
   - 三轨字体系统（UI / 正文衬线 / 代码等宽），支持把 `.ttf` / `.woff2` / `.otf` 放入 `%LOCALAPPDATA%\AntigravityStudio\fonts\` 自动加载。
   - **像素桌宠**：`Clawd` 像素蟹与 `Astra` 悬浮星灵，8 种运行状态实时联动，支持 `1x / 1.5x / 2x` 缩放。
   - **极简瘦身 HUD & 4-Tab 右侧窄抽屉**：快捷键 `Ctrl+Shift+G` 或点击输入框旁胶囊即可展开（概览 / 统计 / 账号 / 设置）。

2. **客户端汉化（简 / 繁 / 英）**
   - 渲染层 `MutationObserver` + 动态正则覆盖界面，同时严格隔离用户消息、AI 思考块、代码区、文件路径与终端防止误译。
   - 原生汉化 Electron 顶部菜单栏、右键菜单与系统托盘菜单。
   - 支持界面内自定义词条覆盖，切回 `EN` 时即时无损还原英文。

3. **上下文、额度、多账号切号与免 TUN 代理**
   - 实时监控当前会话 Token 拆解、输出速度（`tok/s`）、首字延迟（`TTFT`）、模型共享额度池与 90 天桌面/CLI 用量热力图及估算 API 费用。
   - 支持导入当前账号、OAuth 新增账号、刷新额度与通过 `node:sqlite` 事务安全切换 `state.vscdb` 凭证（切换前自动备份）。
   - 支持按模型配置上下文上限、中文会话标题偏好、一键唤起继承代理的 `agy` CLI 终端。
   - 免 TUN 本地代理支持 `http://` / `https://` / `socks5://` / `socks5h://`、Bypass 绕过列表与一键隧道测速。

## 常用命令（在插件目录运行）

```bash
# 1. 检查本地 Antigravity 客户端状态与路径
node cli.js status
node cli.js doctor

# 2. 只读预检注入锚点（不改动客户端文件）
node cli.js install --dry-run

# 3. 不改包无侵入热预览（需 Antigravity 启动时带 --remote-debugging-port=9222）
node cli.js live --port 9222

# 4. 正式安装注入（自动生成 app.asar.studio-orig.bak 原版备份）
# 如果之前装过其他注入补丁，脚本会自动清理旧标记区块
node cli.js install

# 5. 一键无损还原原版客户端
node cli.js restore

# 6. 构建前端产物与运行测试
npm run build
npm test
```

## 状态与配置目录

- Windows: `%LOCALAPPDATA%\AntigravityStudio`
  - `config.json` — 全部主题、HUD、桌宠、代理、语言与按模型上下文配置
  - `dict.custom.json` — 自定义汉化词典覆盖
  - `fonts/` — 放入自定义 `.ttf` / `.woff2` / `.otf` 字体文件
  - `accounts.enc.json` — 加密保存的多账号档案库
  - `backups/` — 切号前的 `state.vscdb` 自动快照备份
