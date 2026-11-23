'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execFileSync } = require('child_process');
const { ConfigStore } = require('../shared/config-store');
const { applyProxyToEnv } = require('./proxy-manager');

function resolveAgyCommand(env = process.env) {
  const candidates = process.platform === 'win32'
    ? ['agy.cmd', 'agy.exe', 'agy', 'antigravity.cmd', 'antigravity.exe']
    : ['agy', 'antigravity'];

  const localApp = env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const extraDirs = process.platform === 'win32'
    ? [
        path.join(localApp, 'Programs', 'antigravity', 'resources', 'bin'),
        path.join(localApp, 'Programs', 'antigravity', 'bin'),
        path.join(os.homedir(), '.gemini', 'antigravity', 'bin'),
      ]
    : [
        '/usr/local/bin',
        path.join(os.homedir(), '.local', 'bin'),
        path.join(os.homedir(), '.gemini', 'antigravity', 'bin'),
      ];

  for (const dir of extraDirs) {
    for (const cmd of candidates) {
      const full = path.join(dir, cmd);
      if (fs.existsSync(full)) return full;
    }
  }

  // Try PATH lookup
  try {
    const finder = process.platform === 'win32' ? 'where.exe' : 'which';
    for (const cmd of candidates) {
      try {
        const res = execFileSync(finder, [cmd], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        const firstLine = res.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
        if (firstLine) return firstLine;
      } catch {}
    }
  } catch {}

  return 'agy';
}

function buildCliLaunchSpec(options = {}) {
  const store = options.store || new ConfigStore(options.stateDir);
  const cfg = store.load();
  const cwd = options.cwd && fs.existsSync(options.cwd) ? options.cwd : os.homedir();
  const cliBin = resolveAgyCommand(options.env || process.env);
  const childEnv = { ...(options.env || process.env) };
  applyProxyToEnv(childEnv, cfg.proxy);

  if (process.platform === 'win32') {
    const hasWt = (() => {
      try {
        execFileSync('where.exe', ['wt.exe'], { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    })();

    if (hasWt && !options.preferPowerShell) {
      return {
        command: 'wt.exe',
        args: ['-d', cwd, 'powershell.exe', '-NoExit', '-Command', `& '${cliBin.replace(/'/g, "''")}'`],
        cwd,
        env: childEnv,
        cliBin,
        terminal: 'windows-terminal',
      };
    }

    return {
      command: 'cmd.exe',
      args: ['/c', 'start', 'Antigravity CLI', 'powershell.exe', '-NoExit', '-Command', `Set-Location -LiteralPath '${cwd.replace(/'/g, "''")}'; & '${cliBin.replace(/'/g, "''")}'`],
      cwd,
      env: childEnv,
      cliBin,
      terminal: 'powershell',
    };
  }

  if (process.platform === 'darwin') {
    return {
      command: 'osascript',
      args: ['-e', `tell application "Terminal" to do script "cd '${cwd.replace(/'/g, "'\\''")}' && '${cliBin.replace(/'/g, "'\\''")}'"`],
      cwd,
      env: childEnv,
      cliBin,
      terminal: 'macos-terminal',
    };
  }

  return {
    command: 'x-terminal-emulator',
    args: ['-e', cliBin],
    cwd,
    env: childEnv,
    cliBin,
    terminal: 'x-terminal-emulator',
  };
}

function launchCliTerminal(options = {}) {
  const spec = buildCliLaunchSpec(options);
  const child = spawn(spec.command, spec.args, {
    cwd: spec.cwd,
    env: spec.env,
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
  });
  child.unref();
  return {
    ok: true,
    pid: child.pid || null,
    terminal: spec.terminal,
    cliBin: spec.cliBin,
    cwd: spec.cwd,
    proxyInherited: Boolean(spec.env.HTTP_PROXY || spec.env.HTTPS_PROXY),
  };
}

module.exports = {
  resolveAgyCommand,
  buildCliLaunchSpec,
  launchCliTerminal,
};
