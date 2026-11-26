'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { fileURLToPath } = require('url');
const { spawn, execFile } = require('child_process');
const { buildCliProxyEnv } = require('./meter-proxy');
const { getStateDir, getLegacyMeterStateDir } = require('./asar-engine');

const windowsTerminalPlacement = `
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public static class CliWindowPlacement {
    [StructLayout(LayoutKind.Sequential)]
    public struct Rect {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct Point {
        public int X;
        public int Y;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct MonitorInfo {
        public int cbSize;
        public Rect rcMonitor;
        public Rect rcWork;
        public uint dwFlags;
    }

    delegate bool EnumProc(IntPtr hwnd, IntPtr data);
    [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc callback, IntPtr data);
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr hwnd);
    [DllImport("user32.dll")] static extern bool IsZoomed(IntPtr hwnd);
    [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr hwnd, int command);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetClassName(IntPtr hwnd, StringBuilder name, int count);
    [DllImport("user32.dll")] static extern IntPtr SetThreadDpiAwarenessContext(IntPtr context);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr hwnd, out Rect rect);
    [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr hwnd, IntPtr after, int x, int y, int width, int height, uint flags);
    [DllImport("user32.dll")] static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint dwFlags);
    [DllImport("user32.dll")] static extern IntPtr MonitorFromPoint(Point pt, uint dwFlags);
    [DllImport("user32.dll")] static extern bool GetCursorPos(out Point lpPoint);
    [DllImport("user32.dll")] static extern bool GetMonitorInfo(IntPtr hMonitor, ref MonitorInfo lpmi);
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr hwnd);
    [DllImport("user32.dll")] static extern bool BringWindowToTop(IntPtr hwnd);
    [DllImport("user32.dll")] static extern IntPtr SetFocus(IntPtr hwnd);
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint lpdwProcessId);
    [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
    [DllImport("user32.dll")] static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern bool CreateProcess(string lpApplicationName, string lpCommandLine, IntPtr lpProcessAttributes, IntPtr lpThreadAttributes, bool bInheritHandles, uint dwCreationFlags, IntPtr lpEnvironment, string lpCurrentDirectory, ref STARTUPINFO lpStartupInfo, out PROCESS_INFORMATION lpProcessInformation);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct STARTUPINFO {
        public int cb; public string lpReserved; public string lpDesktop; public string lpTitle;
        public int dwX; public int dwY; public int dwXSize; public int dwYSize;
        public int dwXCountChars; public int dwYCountChars; public int dwFillAttribute;
        public int dwFlags; public short wShowWindow; public short cbReserved2;
        public IntPtr lpReserved2; public IntPtr hStdInput; public IntPtr hStdOutput; public IntPtr hStdError;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct PROCESS_INFORMATION {
        public IntPtr hProcess; public IntPtr hThread; public int dwProcessId; public int dwThreadId;
    }

    public static IntPtr[] Terminals() {
        var windows = new List<IntPtr>();
        EnumWindows((hwnd, data) => {
            if (!IsWindowVisible(hwnd)) return true;
            var name = new StringBuilder(128);
            GetClassName(hwnd, name, name.Capacity);
            string cls = name.ToString();
            if (cls == "ConsoleWindowClass" || cls == "CASCADIA_HOSTING_WINDOW_CLASS" || cls == "VirtualConsoleClass") {
                windows.Add(hwnd);
            }
            return true;
        }, IntPtr.Zero);
        return windows.ToArray();
    }
}
`;

const LAUNCHER_VERSION = '0.8.4-helper-v2';
const conversationWorkspaces = new Map();

function extractWorkspacePathFromUri(uriStr) {
  if (!uriStr || typeof uriStr !== 'string') return null;
  try {
    const trimmed = uriStr.trim();
    if (trimmed.startsWith('file://')) {
      return path.resolve(fileURLToPath(trimmed));
    }
    if (path.isAbsolute(trimmed)) {
      return path.resolve(trimmed);
    }
  } catch {
    try {
      const decoded = decodeURIComponent(uriStr.replace(/^file:\/\/\/?/i, ''));
      const normalized = process.platform === 'win32' && /^[a-zA-Z]:/.test(decoded)
        ? decoded
        : (process.platform === 'win32' ? decoded.replace(/^\//, '') : '/' + decoded);
      if (path.isAbsolute(normalized)) return path.resolve(normalized);
    } catch {}
  }
  return null;
}

function extractWorkspaceFromTrajectory(trajectory) {
  try {
    const meta = trajectory?.metadata || trajectory?.trajectoryMetadata || {};
    const wsList = Array.isArray(meta.workspaces) ? meta.workspaces : [];
    for (const ws of wsList) {
      const cand = extractWorkspacePathFromUri(ws?.workspaceFolderAbsoluteUri || ws?.gitRootAbsoluteUri);
      if (cand && fs.existsSync(cand)) return cand;
    }
    const uriList = Array.isArray(meta.workspaceUris) ? meta.workspaceUris : [];
    for (const u of uriList) {
      const cand = extractWorkspacePathFromUri(u);
      if (cand && fs.existsSync(cand)) return cand;
    }
  } catch {}
  return null;
}

function extractWorkspaceFromTranscriptFile(transcriptPath) {
  try {
    if (!fs.existsSync(transcriptPath)) return null;
    const fd = fs.openSync(transcriptPath, 'r');
    try {
      const buf = Buffer.alloc(16384);
      const bytes = fs.readSync(fd, buf, 0, buf.length, 0);
      const head = buf.slice(0, bytes).toString('utf8');
      const m1 = head.match(/Command Working Directory:\s*([^\r\n\\"]+)/i);
      if (m1 && m1[1]) {
        const cand = m1[1].trim();
        if (fs.existsSync(cand) && fs.statSync(cand).isDirectory()) return path.resolve(cand);
      }
      const m2 = head.match(/Active Workspaces:\s*(?:\\n|\r?\n)\s*-\s*([^\r\n\\"]+)/i);
      if (m2 && m2[1]) {
        const cand = m2[1].trim();
        if (fs.existsSync(cand) && fs.statSync(cand).isDirectory()) return path.resolve(cand);
      }
    } finally {
      fs.closeSync(fd);
    }
  } catch {}
  return null;
}

function unwrapCmdTargetExe(candidatePath) {
  let exePath = candidatePath;
  if (!candidatePath) return exePath;
  const lower = String(candidatePath).toLowerCase();
  if (lower.endsWith('.cmd') || lower.endsWith('.bat')) {
    try {
      const content = fs.readFileSync(candidatePath, 'utf8');
      const m = content.match(/"([^"]*agy\.exe)"/i);
      if (m && m[1]) {
        const resolvedM = m[1].replace(/%~dp0/gi, path.dirname(candidatePath) + path.sep);
        if (fs.existsSync(resolvedM)) exePath = path.resolve(resolvedM);
      } else {
        const sib = path.join(path.dirname(candidatePath), 'agy.exe');
        if (fs.existsSync(sib)) exePath = sib;
      }
    } catch {}
  }
  return exePath;
}

function resolveCliExecutable(customCliPath, options = {}) {
  const env = options.env || process.env;
  const platform = options.platform || process.platform;
  if (customCliPath !== undefined && customCliPath !== null && String(customCliPath).trim() !== '') {
    const explicit = path.resolve(String(customCliPath).trim());
    try {
      if (fs.existsSync(explicit) && fs.statSync(explicit).isFile()) {
        const directExe = explicit.toLowerCase().endsWith('.exe')
          ? explicit
          : (platform === 'win32' ? unwrapCmdTargetExe(explicit) : explicit);
        return { ok: true, cliPath: explicit, exePath: directExe, source: 'explicit' };
      }
    } catch {}
    return {
      ok: false,
      code: 'CLI_NOT_FOUND',
      cliPath: explicit,
      error: `指定的 Antigravity CLI 路径不存在或不可用: ${explicit}`
    };
  }

  const home = options.homeDir || env.USERPROFILE || os.homedir();
  const localAppData = env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  const appData = env.APPDATA || path.join(home, 'AppData', 'Roaming');

  const candidates = [];
  if (env.AG_CLI_PATH) candidates.push({ p: env.AG_CLI_PATH, src: 'env_AG_CLI_PATH' });
  if (platform === 'win32') {
    candidates.push(
      { p: path.join(home, '.gemini', 'antigravity', 'bin', 'agy.exe'), src: 'gemini_bin_exe' },
      { p: path.join(home, '.gemini', 'bin', 'agy.exe'), src: 'gemini_cli_bin_exe' },
      { p: path.join(home, '.gemini', 'antigravity', 'bin', 'agy.cmd'), src: 'gemini_bin_cmd' },
      { p: path.join(home, '.gemini', 'bin', 'agy.cmd'), src: 'gemini_cli_bin_cmd' },
      { p: path.join(appData, 'Antigravity', 'bin', 'agy.exe'), src: 'appdata_bin_exe' },
      { p: path.join(appData, 'Antigravity', 'bin', 'agy.cmd'), src: 'appdata_bin_cmd' },
      { p: path.join(localAppData, 'Programs', 'Antigravity IDE', 'bin', 'agy.exe'), src: 'ide_bin_exe' },
      { p: path.join(localAppData, 'Programs', 'Antigravity IDE', 'bin', 'agy.cmd'), src: 'ide_bin_cmd' },
      { p: path.join(home, '.local', 'bin', 'agy.exe'), src: 'local_bin' }
    );
  } else if (platform === 'darwin') {
    const appRoots = Array.isArray(options.macAppRoots)
      ? options.macAppRoots
      : [
          '/Applications/Antigravity.app',
          path.join(home, 'Applications', 'Antigravity.app'),
          '/Applications/Antigravity IDE.app',
          path.join(home, 'Applications', 'Antigravity IDE.app'),
          '/Applications/Google Antigravity.app',
          path.join(home, 'Applications', 'Google Antigravity.app')
        ];
    for (const appRoot of appRoots) {
      candidates.push(
        { p: path.join(appRoot, 'Contents', 'Resources', 'app', 'bin', 'agy'), src: 'mac_app_bin' },
        { p: path.join(appRoot, 'Contents', 'Resources', 'bin', 'agy'), src: 'mac_resources_bin' }
      );
    }
    candidates.push(
      { p: path.join(home, '.gemini', 'antigravity', 'bin', 'agy'), src: 'gemini_bin' },
      { p: path.join(home, '.gemini', 'bin', 'agy'), src: 'gemini_cli_bin' },
      { p: path.join(home, '.local', 'bin', 'agy'), src: 'local_bin' },
      { p: '/opt/homebrew/bin/agy', src: 'homebrew_bin' },
      { p: '/usr/local/bin/agy', src: 'usr_local_bin' }
    );
  } else {
    candidates.push(
      { p: path.join(home, '.gemini', 'antigravity', 'bin', 'agy'), src: 'gemini_bin' },
      { p: path.join(home, '.gemini', 'bin', 'agy'), src: 'gemini_cli_bin' },
      { p: path.join(home, '.local', 'bin', 'agy'), src: 'local_bin' },
      { p: '/usr/local/bin/agy', src: 'usr_local_bin' }
    );
  }

  for (const item of candidates) {
    try {
      if (item.p && fs.existsSync(item.p) && fs.statSync(item.p).isFile()) {
        const exePath = unwrapCmdTargetExe(item.p);
        return {
          ok: true,
          cliPath: item.launcher && fs.existsSync(item.launcher) ? item.launcher : item.p,
          exePath,
          source: item.src
        };
      }
    } catch {}
  }

  const pathDirs = String(env.PATH || '').split(path.delimiter).filter(Boolean);
  const binNames = platform === 'win32' ? ['agy.exe', 'agy.cmd', 'agy.bat'] : ['agy'];
  for (const d of pathDirs) {
    for (const b of binNames) {
      const full = path.join(d, b);
      try {
        if (fs.existsSync(full) && fs.statSync(full).isFile()) {
          return { ok: true, cliPath: full, exePath: unwrapCmdTargetExe(full), source: 'PATH' };
        }
      } catch {}
    }
  }

  return {
    ok: false,
    code: 'CLI_NOT_FOUND',
    cliPath: null,
    error: '未找到已安装的 Antigravity CLI (agy)。请将 agy 加入 PATH，或通过 AG_CLI_PATH 指定可执行文件。'
  };
}

async function resolveCliWorkspace(options = {}) {
  const home = options.homeDir || process.env.USERPROFILE || os.homedir();
  const agDir = options.agDir || process.env.AG_DIR || path.join(home, '.gemini', 'antigravity');
  const configDir = options.configDir || path.join(home, '.gemini', 'config');
  const platform = options.platform || process.platform;
  const appDataDir = options.appDataDir || process.env.APPDATA || (
    platform === 'win32'
      ? path.join(home, 'AppData', 'Roaming')
      : platform === 'darwin'
        ? path.join(home, 'Library', 'Application Support')
        : (process.env.XDG_CONFIG_HOME || path.join(home, '.config'))
  );

  if (options.cwd !== undefined && options.cwd !== null && String(options.cwd).trim() !== '') {
    const rawCwd = String(options.cwd).trim();
    const resolvedCwd = extractWorkspacePathFromUri(rawCwd) || path.resolve(rawCwd);
    try {
      if (fs.existsSync(resolvedCwd) && fs.statSync(resolvedCwd).isDirectory()) {
        return { ok: true, cwd: resolvedCwd, source: 'explicit_cwd' };
      }
    } catch {}
    if (options.strictCwd) {
      return { ok: false, code: 'CWD_NOT_FOUND', cwd: resolvedCwd, error: `指定的工作目录不存在或无法访问: ${resolvedCwd}` };
    }
  }

  const cascadeId = options.cascadeId && /^[a-f\d-]{36}$/i.test(String(options.cascadeId).trim())
    ? String(options.cascadeId).trim().toLowerCase()
    : null;

  if (cascadeId) {
    const cachedWs = conversationWorkspaces.get(cascadeId);
    if (cachedWs && fs.existsSync(cachedWs)) {
      return { ok: true, cwd: cachedWs, source: 'conversation_cache' };
    }
    const tPath = path.join(agDir, 'brain', cascadeId, '.system_generated', 'logs', 'transcript.jsonl');
    const fromTranscript = extractWorkspaceFromTranscriptFile(tPath);
    if (fromTranscript) {
      conversationWorkspaces.set(cascadeId, fromTranscript);
      return { ok: true, cwd: fromTranscript, source: 'conversation_transcript' };
    }
    try {
      const { connect } = require('./local-api');
      const api = await connect();
      const full = await api.call('GetCascadeTrajectory', { cascadeId, trajectoryVerbosity: 1 });
      const wsPath = extractWorkspaceFromTrajectory(full?.trajectory);
      if (wsPath) {
        conversationWorkspaces.set(cascadeId, wsPath);
        return { ok: true, cwd: wsPath, source: 'conversation_trajectory' };
      }
    } catch {}
  }

  try {
    const storagePath = path.join(appDataDir, 'Antigravity', 'app_storage.json');
    if (fs.existsSync(storagePath)) {
      const storage = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
      const lastProjId = storage['new-convo-last-selected-project'];
      if (lastProjId && typeof lastProjId === 'string') {
        const projFile = path.join(configDir, 'projects', `${lastProjId}.json`);
        if (fs.existsSync(projFile)) {
          const proj = JSON.parse(fs.readFileSync(projFile, 'utf8'));
          const resources = proj?.projectResources?.resources || [];
          for (const res of resources) {
            const uri = res?.gitFolder?.folderUri || res?.folderUri;
            const folderPath = extractWorkspacePathFromUri(uri);
            if (folderPath && fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
              return { ok: true, cwd: folderPath, source: 'last_selected_project', projectName: proj.name || lastProjId };
            }
          }
        }
      }
    }
  } catch {}

  const defaultCandidates = [
    options.defaultDir,
    path.join(home, 'Documents', 'antigravity'),
    home
  ].filter(Boolean);

  for (const cand of defaultCandidates) {
    try {
      const resolved = path.resolve(cand);
      if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
        return { ok: true, cwd: resolved, source: 'default_fallback' };
      }
    } catch {}
  }

  return { ok: true, cwd: home, source: 'homedir_fallback' };
}

function escapePosixArg(arg) {
  if (arg === undefined || arg === null) return "''";
  return "'" + String(arg).replace(/'/g, "'\\''") + "'";
}

function resolveHelperExecutable(options = {}) {
  if (typeof options._resolveHelperExecutable === 'function') {
    return options._resolveHelperExecutable(options);
  }
  if (options.helperPath !== undefined && options.helperPath !== null && String(options.helperPath).trim() !== '') {
    const explicit = path.resolve(String(options.helperPath).trim());
    try {
      if (fs.existsSync(explicit) && fs.statSync(explicit).isFile()) {
        const crypto = require('crypto');
        const helperSha = crypto.createHash('sha256').update(fs.readFileSync(explicit)).digest('hex');
        return { ok: true, helperPath: explicit, helperSha256: helperSha, source: 'explicit' };
      }
    } catch {}
    return { ok: false, helperPath: explicit, helperSha256: null, error: `指定的辅助程序路径不存在或不可用: ${explicit}` };
  }

  const candidates = [];
  if (process.env.AG_HELPER_PATH) {
    candidates.push({ p: path.resolve(process.env.AG_HELPER_PATH.trim()), src: 'env_AG_HELPER_PATH' });
  }
  if (options.stateDir) {
    candidates.push({ p: path.join(path.resolve(options.stateDir), 'cli-window-helper.exe'), src: 'custom_stateDir' });
  } else {
    candidates.push(
      { p: path.join(getStateDir(), 'cli-window-helper.exe'), src: 'studio_stateDir' },
      { p: path.join(getLegacyMeterStateDir(), 'cli-window-helper.exe'), src: 'legacy_stateDir' }
    );
  }
  if (process.resourcesPath) {
    candidates.push({ p: path.join(process.resourcesPath, 'bin', 'cli-window-helper.exe'), src: 'host_resources_bin' });
  }
  candidates.push(
    { p: path.join(__dirname, 'scripts', 'cli-window-helper.exe'), src: 'local_scripts' },
    { p: path.join(__dirname, '..', '..', 'scripts', 'cli-window-helper.exe'), src: 'repo_scripts' }
  );

  for (const item of candidates) {
    try {
      if (item.p && fs.existsSync(item.p) && fs.statSync(item.p).isFile()) {
        const crypto = require('crypto');
        const helperSha = crypto.createHash('sha256').update(fs.readFileSync(item.p)).digest('hex');
        return { ok: true, helperPath: item.p, helperSha256: helperSha, source: item.src };
      }
    } catch {}
  }

  return { ok: false, helperPath: null, helperSha256: null, error: '未找到原生辅助定位程序 cli-window-helper.exe' };
}

async function resolveCliAccountProfile(accountQuery, options = {}) {
  const home = options.homeDir || process.env.USERPROFILE || os.homedir();
  const cliAppDataDir = options.cliAppDataDir || path.join(home, '.gemini', 'antigravity-cli');
  const profilesBaseDir = options.cliProfilesDir || path.join(cliAppDataDir, 'profiles');

  let targetAccount = accountQuery || options.account || options.email || null;
  if (!targetAccount) {
    try {
      const { getPluginSettings } = require('./meter-collector');
      const settingsSnap = getPluginSettings({ stateDir: options.stateDir });
      if (settingsSnap?.cliAccountEmail) {
        targetAccount = settingsSnap.cliAccountEmail;
      }
    } catch {}
  }

  if (!targetAccount || typeof targetAccount !== 'string' || !targetAccount.trim()) {
    return { ok: true, isolated: false, email: null, isolatedDir: null, accountRecord: null };
  }

  const queryRaw = targetAccount.trim();
  const { getSharedAccountsManager, normalizeEmail } = require('./meter-accounts');
  const mgr = getSharedAccountsManager({ stateDir: options.stateDir, forceNew: Boolean(options.stateDir) });
  const store = mgr.loadStore();
  const accounts = store.accounts || {};

  const queryNorm = normalizeEmail(queryRaw);
  let matchedAccount = null;
  if (accounts[queryNorm]) {
    matchedAccount = accounts[queryNorm];
  } else {
    const qLower = queryRaw.toLowerCase();
    for (const [accEmail, acc] of Object.entries(accounts)) {
      const el = accEmail.toLowerCase();
      if (el === qLower || el.startsWith(qLower) || el.split('@')[0] === qLower) {
        matchedAccount = acc;
        break;
      }
    }
  }

  if (!matchedAccount) {
    const available = Object.keys(accounts);
    return {
      ok: false,
      code: 'ACCOUNT_NOT_FOUND',
      error: `未在多账号管理器中找到指定账号: ${queryRaw}${available.length > 0 ? ` (可用账号: ${available.join(', ')})` : ' (暂无已配置账号)'}`,
      targetAccount: queryRaw
    };
  }

  const cred = matchedAccount.credential || {};
  if (!cred.accessToken && !cred.refreshToken) {
    return {
      ok: false,
      code: 'ACCOUNT_NO_CREDENTIALS',
      error: `账号 ${matchedAccount.email} 暂无可用凭据，请先在面板多账号管理中登录或重新授权`,
      email: matchedAccount.email
    };
  }

  const safeDirName = matchedAccount.email.toLowerCase().replace(/[@.]/g, '_');
  const isolatedDir = path.resolve(profilesBaseDir, safeDirName);
  try {
    fs.mkdirSync(isolatedDir, { recursive: true });
    const tokenFile = path.join(isolatedDir, 'antigravity-oauth-token');
    const tokenPayload = {
      token: {
        access_token: cred.accessToken || '',
        token_type: 'Bearer',
        refresh_token: cred.refreshToken || '',
        expiry: cred.expiresAt ? new Date(cred.expiresAt).toISOString() : new Date(Date.now() + 3600000).toISOString()
      },
      auth_method: 'consumer',
      id_token_email: matchedAccount.email,
      id_token: cred.idToken || ''
    };
    fs.writeFileSync(tokenFile, JSON.stringify(tokenPayload, null, 2), 'utf8');

    // Disable OS keyring lookup for isolated CLI profiles without passing unsupported flags.
    const markerFile = path.join(isolatedDir, 'keyring-marker-disabled');
    fs.writeFileSync(markerFile, '1', 'utf8');

    return {
      ok: true,
      isolated: true,
      email: matchedAccount.email,
      accountRecord: matchedAccount,
      isolatedDir,
      tokenFile
    };
  } catch (err) {
    return {
      ok: false,
      code: 'PROFILE_PREPARE_ERROR',
      error: `准备独立账号运行目录失败: ${err?.message || err}`,
      email: matchedAccount.email
    };
  }
}

async function launchCliSession(options = {}, ownerHwnd = 0) {
  const cliInfo = resolveCliExecutable(options.cliPath, options);
  if (!cliInfo.ok) {
    return cliInfo;
  }

  const wsInfo = await resolveCliWorkspace(options);
  if (!wsInfo.ok) {
    return wsInfo;
  }

  const accProfile = await resolveCliAccountProfile(options.account || options.email, options);
  if (!accProfile.ok) {
    return accProfile;
  }

  const cwd = wsInfo.cwd;
  const model = (typeof options.model === 'string' && /^[a-zA-Z0-9._-]+$/.test(options.model.trim()))
    ? options.model.trim()
    : 'gemini-3.8-flash-high';
  const extraArgs = Array.isArray(options.args)
    ? options.args.filter(a => typeof a === 'string' && a.trim().length > 0 && !/[\r\n\0]/.test(a))
    : [];

  const cliArgs = ['--model', model, ...extraArgs];
  const env = buildCliProxyEnv(options.env || process.env, options);
  if (accProfile.isolated) {
    env.JETSKI_APP_DATA_DIR = accProfile.isolatedDir;
    env.AG_CLI_ACCOUNT_EMAIL = accProfile.email;
    if (accProfile.accountRecord?.credential?.accessToken) {
      env.JETSKI_OAUTH_TOKEN = accProfile.accountRecord.credential.accessToken;
    }
  }
  delete env.NO_COLOR;
  env.TERM = 'xterm-256color';
  env.COLORTERM = 'truecolor';

  if (options.dryRun === true) {
    return {
      ok: true,
      dryRun: true,
      cliPath: cliInfo.cliPath,
      exePath: cliInfo.exePath,
      cliSource: cliInfo.source,
      cwd,
      cwdSource: wsInfo.source,
      model,
      account: accProfile.isolated ? accProfile.email : null,
      isolatedDir: accProfile.isolated ? accProfile.isolatedDir : null,
      keyringBypassed: accProfile.isolated === true,
      args: cliArgs,
      env: {
        NO_COLOR: env.NO_COLOR,
        TERM: env.TERM,
        COLORTERM: env.COLORTERM,
        HTTP_PROXY: env.HTTP_PROXY,
        HTTPS_PROXY: env.HTTPS_PROXY,
        JETSKI_APP_DATA_DIR: env.JETSKI_APP_DATA_DIR,
        JETSKI_OAUTH_TOKEN: env.JETSKI_OAUTH_TOKEN,
        AG_CLI_ACCOUNT_EMAIL: env.AG_CLI_ACCOUNT_EMAIL
      }
    };
  }

  try {
    const runtimePlatform = options.platform || process.platform;
    if (runtimePlatform === 'win32') {
      const stateDir = options.stateDir ? path.resolve(options.stateDir) : getStateDir();
      const spawnFn = typeof options._spawn === 'function' ? options._spawn : spawn;
      fs.mkdirSync(stateDir, { recursive: true });
      const runnerBat = path.join(stateDir, 'launch-cli-runner.cmd');
      const probeFile = path.join(stateDir, 'last-cli-cwd.txt');
      try { if (fs.existsSync(probeFile)) fs.unlinkSync(probeFile); } catch {}

      const extraArgsStr = extraArgs.map(a => `"${String(a).replace(/"/g, '')}"`).join(' ');
      const launchTarget = cliInfo.exePath || cliInfo.cliPath;
      const isWrapperScript = /\.(cmd|bat)$/i.test(String(launchTarget));
      const invokeLine = isWrapperScript
        ? `call "${launchTarget}" --model "${model}" ${extraArgsStr}`
        : `"${launchTarget}" --model "${model}" ${extraArgsStr}`;
      const batContent = [
        '@echo off',
        'chcp 65001 >nul',
        'if defined AG_CLI_PROBE_FILE (',
        '  > "%AG_CLI_PROBE_FILE%" echo %CD%',
        ')',
        invokeLine
      ].join('\r\n') + '\r\n';
      fs.writeFileSync(runnerBat, batContent, 'utf8');

      env.AG_CLI_TARGET_EXE = cliInfo.exePath;
      env.AG_CLI_TARGET_MODEL = model;
      env.AG_CLI_TARGET_CWD = cwd;
      env.AG_CLI_RUNNER_BAT = runnerBat;
      env.AG_CLI_PROBE_FILE = probeFile;
      env.AG_CLI_EXTRA_ARGS = extraArgsStr;

      const resolvedOwnerHwnd = String(options.ownerHwnd || ownerHwnd || 0);
      env.AG_CLI_OWNER_HWND = resolvedOwnerHwnd;
      if (options.hostBounds && typeof options.hostBounds === 'object') {
        try { env.AG_CLI_HOST_BOUNDS = JSON.stringify(options.hostBounds); } catch {}
      } else {
        delete env.AG_CLI_HOST_BOUNDS;
      }

      const helperResolution = resolveHelperExecutable(options);
      const helperExe = helperResolution.ok ? helperResolution.helperPath : null;
      const helperSha = helperResolution.helperSha256;

      if (helperExe) {
        const helperArgs = ['--cmd', runnerBat, '--cwd', cwd];
        if (resolvedOwnerHwnd && resolvedOwnerHwnd !== '0') {
          helperArgs.push('--owner', resolvedOwnerHwnd);
        }
        const helperResult = await new Promise((resolve) => {
          execFile(helperExe, helperArgs, {
            cwd,
            env,
            timeout: 5500,
            windowsHide: false
          }, (error, stdout, stderr) => {
            let parsed = null;
            const rawOut = (stdout || '').trim();
            const rawErr = (stderr || '').trim();
            if (rawOut) {
              try {
                parsed = JSON.parse(rawOut);
              } catch {
                const m = rawOut.match(/\{[\s\S]*\}/);
                if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
              }
            }
            if (parsed && typeof parsed === 'object') {
              if (error && parsed.ok === undefined) parsed.ok = false;
              if (error && !parsed.error) parsed.error = error.message;
              resolve(parsed);
            } else if (error) {
              resolve({ ok: false, terminalSpawned: false, error: error.message, stderr: rawErr, stdout: rawOut });
            } else {
              resolve({ ok: false, terminalSpawned: false, error: '解析辅助程序输出失败', stdout: rawOut });
            }
          });
        });

        const runtimeInfo = {
          launcherModulePath: __filename,
          launcherVersion: LAUNCHER_VERSION,
          helperPath: helperExe,
          helperSha256: helperSha,
          timestamp: new Date().toISOString()
        };

        if (helperResult.terminalSpawned === true || (helperResult.cmdPid && helperResult.cmdPid > 0)) {
          return {
            ok: helperResult.ok === true,
            nativePlacement: true,
            fallback: false,
            terminalSpawned: true,
            cliAlive: helperResult.cliAlive !== false,
            windowLocated: helperResult.windowLocated !== false,
            isCentered: helperResult.isCentered === true,
            isForeground: helperResult.isForeground === true,
            pid: helperResult.cmdPid || helperResult.windowPid || null,
            probeFile,
            cliPath: cliInfo.cliPath,
            exePath: cliInfo.exePath,
            cliSource: cliInfo.source,
            cwd,
            cwdSource: wsInfo.source,
            model,
            args: cliArgs,
            telemetry: helperResult,
            runtimeInfo,
            ...(helperResult.ok === true ? {} : { code: 'WINDOW_PLACEMENT_PARTIAL', error: helperResult.error || '终端已启动，但窗口定位未达标' })
          };
        }
      }

      const child = spawnFn('cmd.exe', ['/d', '/k', runnerBat], {
        cwd,
        env,
        detached: true,
        stdio: 'ignore',
        windowsHide: false
      });
      child.unref();

      return {
        ok: true,
        fallback: true,
        nativePlacement: false,
        terminalSpawned: true,
        windowLocated: false,
        isCentered: false,
        isForeground: false,
        pid: child.pid || null,
        probeFile,
        cliPath: cliInfo.cliPath,
        exePath: cliInfo.exePath,
        cliSource: cliInfo.source,
        cwd,
        cwdSource: wsInfo.source,
        model,
        account: accProfile.isolated ? accProfile.email : null,
        isolatedDir: accProfile.isolated ? accProfile.isolatedDir : null,
        keyringBypassed: accProfile.isolated === true,
        args: cliArgs,
        runtimeInfo: {
          launcherModulePath: __filename,
          launcherVersion: LAUNCHER_VERSION,
          helperPath: helperExe,
          fallback: true
        }
      };
    } else if (runtimePlatform === 'darwin') {
      const preferredShell = (env.SHELL && typeof env.SHELL === 'string' && fs.existsSync(env.SHELL))
        ? env.SHELL
        : (fs.existsSync('/bin/zsh') ? '/bin/zsh' : '/bin/bash');
      const safeShell = escapePosixArg(preferredShell);
      const safeCwd = escapePosixArg(cwd);
      const safeCli = escapePosixArg(cliInfo.exePath);
      const safeArgs = cliArgs.map(escapePosixArg).join(' ');
      const envAssigns = [
        `TERM=${escapePosixArg(env.TERM)}`,
        `COLORTERM=${escapePosixArg(env.COLORTERM)}`
      ];
      for (const k of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NO_PROXY', 'JETSKI_APP_DATA_DIR', 'JETSKI_OAUTH_TOKEN', 'AG_CLI_ACCOUNT_EMAIL']) {
        if (env[k]) envAssigns.push(`${k}=${escapePosixArg(env[k])}`);
      }
      const shellCmd = `cd ${safeCwd} && export ${envAssigns.join(' ')} && ${safeCli} ${safeArgs}; exec ${safeShell} -l`;
      const escapedScriptCmd = shellCmd.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const appleScript = `tell application "Terminal"\n  do script "${escapedScriptCmd}"\n  activate\nend tell`;

      if (options._inspectAppleScript === true) {
        return {
          ok: true,
          dryRun: true,
          terminal: 'Terminal.app',
          shell: preferredShell,
          shellCmd,
          appleScript,
          cliPath: cliInfo.cliPath,
          exePath: cliInfo.exePath,
          cliSource: cliInfo.source,
          cwd,
          cwdSource: wsInfo.source,
          model,
          args: cliArgs
        };
      }

      const spawner = typeof options._spawn === 'function' ? options._spawn : spawn;
      const child = spawner('osascript', ['-e', appleScript], {
        detached: true,
        stdio: 'ignore',
        env
      });
      child.unref?.();

      return {
        ok: true,
        nativePlacement: false,
        fallback: false,
        terminal: 'Terminal.app',
        shell: preferredShell,
        pid: child.pid || null,
        cliPath: cliInfo.cliPath,
        exePath: cliInfo.exePath,
        cliSource: cliInfo.source,
        cwd,
        cwdSource: wsInfo.source,
        model,
        args: cliArgs
      };
    } else if (runtimePlatform === 'linux') {
      const candidateTerminals = [
        { bin: 'x-terminal-emulator', buildArgs: cmd => ['-e', `bash -c ${escapePosixArg(cmd + '; exec bash')}`] },
        { bin: 'gnome-terminal', buildArgs: cmd => ['--', 'bash', '-c', `${cmd}; exec bash`] },
        { bin: 'konsole', buildArgs: cmd => ['-e', 'bash', '-c', `${cmd}; exec bash`] },
        { bin: 'xfce4-terminal', buildArgs: cmd => ['-x', 'bash', '-c', `${cmd}; exec bash`] },
        { bin: 'xterm', buildArgs: cmd => ['-e', 'bash', '-c', `${cmd}; exec bash`] }
      ];

      const safeCwd = escapePosixArg(cwd);
      const safeCli = escapePosixArg(cliInfo.exePath);
      const safeArgs = cliArgs.map(escapePosixArg).join(' ');
      const targetCommand = `cd ${safeCwd} && ${safeCli} ${safeArgs}`;

      let foundTerm = null;
      const pathDirs = String(process.env.PATH || '').split(path.delimiter).filter(Boolean);
      for (const t of candidateTerminals) {
        for (const dir of pathDirs) {
          const full = path.join(dir, t.bin);
          if (fs.existsSync(full)) {
            foundTerm = { full, t };
            break;
          }
        }
        if (foundTerm) break;
      }

      if (!foundTerm) {
        return {
          ok: false,
          code: 'NO_TERMINAL_EMULATOR',
          error: '未在系统中检测到支持的图形终端模拟器（需安装 x-terminal-emulator、gnome-terminal、konsole 或 xterm）',
          cliPath: cliInfo.cliPath,
          cwd
        };
      }

      const termArgs = foundTerm.t.buildArgs(targetCommand);
      const child = spawn(foundTerm.full, termArgs, {
        cwd,
        env,
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      return {
        ok: true,
        nativePlacement: false,
        fallback: false,
        terminal: foundTerm.t.bin,
        pid: child.pid || null,
        cliPath: cliInfo.cliPath,
        exePath: cliInfo.exePath,
        cliSource: cliInfo.source,
        cwd,
        cwdSource: wsInfo.source,
        model,
        args: cliArgs
      };
    } else {
      return {
        ok: false,
        code: 'PLATFORM_UNSUPPORTED',
        error: `不支持的操作系统平台: ${process.platform}`,
        cliPath: cliInfo.cliPath,
        cwd
      };
    }
  } catch (err) {
    return {
      ok: false,
      code: 'LAUNCH_ERROR',
      error: `启动 Antigravity CLI 异常: ${err?.message || err}`,
      cliPath: cliInfo.cliPath,
      cwd
    };
  }
}

module.exports = {
  windowsTerminalPlacement,
  conversationWorkspaces,
  extractWorkspacePathFromUri,
  extractWorkspaceFromTrajectory,
  extractWorkspaceFromTranscriptFile,
  unwrapCmdTargetExe,
  resolveCliExecutable,
  resolveCliWorkspace,
  resolveCliAccountProfile,
  resolveHelperExecutable,
  escapePosixArg,
  launchCliSession
};
