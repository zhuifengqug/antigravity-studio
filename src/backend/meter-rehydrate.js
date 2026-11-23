'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { getStateDir } = require('./asar-engine');
const { safeReadJsonSync, safeWriteJsonSync } = require('./meter-storage');
const { getGeminiAntigravityDir } = require('../shared/constants');

function resolveRehydrateScriptPath() {
  const candidates = [
    path.join(__dirname, 'scripts', 'rehydrate_after_compact.py'),
    path.join(__dirname, '..', '..', 'scripts', 'rehydrate_after_compact.py'),
    path.join(__dirname, 'rehydrate_after_compact.py')
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

function materializeRehydrateScriptIfAsar(scriptPath, options = {}) {
  if (!scriptPath) return null;
  if (!/\.asar(?:[\\/]|$)/i.test(scriptPath)) return scriptPath;
  try {
    const stateDir = options.stateDir || getStateDir();
    const outPath = path.join(stateDir, 'scripts', 'rehydrate_after_compact.py');
    const content = fs.readFileSync(scriptPath, 'utf8');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    let existing = '';
    try {
      if (fs.existsSync(outPath)) existing = fs.readFileSync(outPath, 'utf8');
    } catch {}
    if (existing !== content) {
      fs.writeFileSync(outPath, content, 'utf8');
    }
    return outPath;
  } catch {
    return scriptPath;
  }
}

function getRehydrateStatePath(options = {}) {
  const stateDir = options.stateDir || getStateDir();
  return path.join(stateDir, 'rehydrate-state.json');
}

function getRehydrateHookBackupPath(options = {}) {
  const stateDir = options.stateDir || getStateDir();
  return path.join(stateDir, 'backups', 'rehydrate-hook.bak.json');
}

function getHostHooksConfigPath(options = {}) {
  const agDir = options.agDir || getGeminiAntigravityDir();
  return path.join(agDir, 'hooks.json');
}

function resolvePythonBin() {
  try {
    const { resolvePython } = require('./meter-collector');
    const py = resolvePython();
    if (py) return py;
  } catch {}
  for (const cmd of process.platform === 'win32' ? ['python', 'python3', 'py'] : ['python3', 'python']) {
    try {
      const check = spawnSync(cmd, ['-c', 'import sys; print(sys.executable)'], {
        encoding: 'utf8',
        timeout: 2500,
        windowsHide: true
      });
      if (check.status === 0 && check.stdout.trim()) {
        return check.stdout.trim().split(/\r?\n/)[0];
      }
    } catch {}
  }
  return null;
}

function loadStateFile(options = {}) {
  const p = getRehydrateStatePath(options);
  const res = safeReadJsonSync(p, null);
  if (res.ok && res.data && typeof res.data === 'object') {
    return res.data;
  }
  return {
    enabled: false,
    mode: 'off',
    appliedAt: null,
    disabledAt: null,
    lastRunAt: null,
    lastSummary: null
  };
}

function saveStateFile(next, options = {}) {
  const p = getRehydrateStatePath(options);
  return safeWriteJsonSync(p, next);
}

function syncHostHookConfig(enable, options = {}) {
  if (options.syncHostHooks === false || process.env.NODE_TEST_CONTEXT) {
    return { synced: false, reason: 'skipped_in_isolation' };
  }
  const hookPath = getHostHooksConfigPath(options);
  const bakPath = getRehydrateHookBackupPath(options);
  const scriptPath = materializeRehydrateScriptIfAsar(resolveRehydrateScriptPath(), options);
  if (!fs.existsSync(path.dirname(hookPath))) {
    return { synced: false, reason: 'host_dir_missing' };
  }
  try {
    const hadExisting = fs.existsSync(hookPath);
    if (hadExisting && !fs.existsSync(bakPath)) {
      fs.mkdirSync(path.dirname(bakPath), { recursive: true });
      fs.copyFileSync(hookPath, bakPath);
    }
    const cur = hadExisting ? (safeReadJsonSync(hookPath, {}).data || {}) : {};
    const hooks = (cur.hooks && typeof cur.hooks === 'object') ? { ...cur.hooks } : {};
    if (enable && scriptPath) {
      hooks.postCompact = {
        managedBy: 'antigravity-studio',
        enabled: true,
        script: scriptPath,
        updatedAt: new Date().toISOString()
      };
    } else if (hooks.postCompact && hooks.postCompact.managedBy === 'antigravity-studio') {
      hooks.postCompact = {
        ...hooks.postCompact,
        enabled: false,
        updatedAt: new Date().toISOString()
      };
    }
    safeWriteJsonSync(hookPath, { ...cur, hooks });
    return { synced: true, hookPath };
  } catch (err) {
    return { synced: false, reason: err?.message || 'sync_failed' };
  }
}

function getRehydrateStatus(options = {}) {
  const state = loadStateFile(options);
  const scriptPath = resolveRehydrateScriptPath();
  const pythonBin = options.skipPythonCheck ? null : resolvePythonBin();
  const bakPath = getRehydrateHookBackupPath(options);
  const hookPath = getHostHooksConfigPath(options);
  let hookConfigured = false;
  try {
    if (fs.existsSync(hookPath)) {
      const data = safeReadJsonSync(hookPath, {}).data;
      hookConfigured = Boolean(data?.hooks?.postCompact?.enabled);
    }
  } catch {}

  return {
    ok: true,
    enabled: Boolean(state.enabled),
    mode: state.enabled ? 'active' : 'off',
    scriptAvailable: Boolean(scriptPath),
    scriptPath,
    pythonAvailable: Boolean(pythonBin),
    pythonPath: pythonBin,
    hookConfigured,
    backupExists: fs.existsSync(bakPath),
    appliedAt: state.appliedAt || null,
    disabledAt: state.disabledAt || null,
    lastRunAt: state.lastRunAt || null,
    lastSummary: state.lastSummary || null
  };
}

function applyRehydrate(options = {}) {
  const scriptPath = resolveRehydrateScriptPath();
  if (!scriptPath) {
    return { ok: false, error: '未找到 scripts/rehydrate_after_compact.py 脚本' };
  }
  const prev = loadStateFile(options);
  const next = {
    ...prev,
    enabled: true,
    mode: 'active',
    appliedAt: new Date().toISOString(),
    disabledAt: null
  };
  const writeRes = saveStateFile(next, options);
  if (!writeRes.ok) {
    return { ok: false, error: writeRes.error || '保存压缩回填配置失败' };
  }
  syncHostHookConfig(true, options);
  return {
    ok: true,
    ...getRehydrateStatus(options),
    message: '已开启压缩后记忆回填（Post-Compact Rehydration）'
  };
}

function disableRehydrate(options = {}) {
  const prev = loadStateFile(options);
  const next = {
    ...prev,
    enabled: false,
    mode: 'off',
    disabledAt: new Date().toISOString()
  };
  const writeRes = saveStateFile(next, options);
  if (!writeRes.ok) {
    return { ok: false, error: writeRes.error || '停用压缩回填配置失败' };
  }
  syncHostHookConfig(false, options);
  return {
    ok: true,
    ...getRehydrateStatus(options),
    message: '已停用压缩后记忆回填'
  };
}

function restoreRehydrate(options = {}) {
  const bakPath = getRehydrateHookBackupPath(options);
  const hookPath = getHostHooksConfigPath(options);
  if (!process.env.NODE_TEST_CONTEXT && fs.existsSync(bakPath)) {
    try {
      fs.copyFileSync(bakPath, hookPath);
      fs.unlinkSync(bakPath);
    } catch {}
  } else if (!process.env.NODE_TEST_CONTEXT && fs.existsSync(hookPath)) {
    try {
      const cur = safeReadJsonSync(hookPath, {}).data;
      if (cur?.hooks?.postCompact?.managedBy === 'antigravity-studio') {
        delete cur.hooks.postCompact;
        safeWriteJsonSync(hookPath, cur);
      }
    } catch {}
  }

  const next = {
    enabled: false,
    mode: 'off',
    appliedAt: null,
    disabledAt: new Date().toISOString(),
    lastRunAt: null,
    lastSummary: null
  };
  saveStateFile(next, options);
  return {
    ok: true,
    restored: true,
    ...getRehydrateStatus(options),
    message: '已还原压缩后记忆回填默认状态'
  };
}

function extractRehydrateMemoryFallbackJs(conversationId, options = {}) {
  const agDir = options.agDir || getGeminiAntigravityDir();
  const brainDir = options.brainDir || (conversationId ? path.join(agDir, 'brain', conversationId) : null);
  const userGoals = [];
  const taskItems = [];
  const touchedFiles = [];

  if (brainDir && fs.existsSync(brainDir)) {
    for (const f of ['task.md', 'implementation_plan.md']) {
      const fp = path.join(brainDir, f);
      if (fs.existsSync(fp)) {
        try {
          const lines = fs.readFileSync(fp, 'utf8').split(/\r?\n/);
          for (const l of lines) {
            if (/^\s*-\s*\[[ xX/\-]\]\s+/.test(l)) {
              taskItems.push(l.trim().slice(0, 160));
            }
          }
        } catch {}
      }
    }
    const tCand = [
      path.join(brainDir, '.system_generated', 'logs', 'transcript.jsonl'),
      path.join(brainDir, 'transcript.jsonl')
    ].find((p) => fs.existsSync(p));
    if (tCand) {
      try {
        const raw = fs.readFileSync(tCand, 'utf8');
        for (const line of raw.split(/\r?\n/)) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line);
            const t = String(ev.type || ev.role || '').toUpperCase();
            if ((t === 'USER_INPUT' || t === 'USER') && ev.source !== 'SYSTEM_SDK') {
              const txt = String(ev.content || ev.text || '').replace(/\s+/g, ' ').trim();
              if (txt) userGoals.push(txt.slice(0, 220));
            }
          } catch {}
        }
      } catch {}
    }
  }

  const sections = [];
  if (userGoals.length) sections.push('## Active User Goals\n' + userGoals.slice(-6).map((g) => `- ${g}`).join('\n'));
  if (taskItems.length) sections.push('## Task Checklist\n' + taskItems.slice(0, 15).join('\n'));
  return {
    ok: true,
    cascadeId: conversationId || null,
    brainDir,
    fallback: 'js',
    userGoalsCount: Math.min(6, userGoals.length),
    taskItemsCount: Math.min(15, taskItems.length),
    touchedFilesCount: touchedFiles.length,
    memoryBlock: sections.join('\n\n')
  };
}

function extractRehydrateMemory(conversationId, options = {}) {
  const scriptPath = resolveRehydrateScriptPath();
  const py = resolvePythonBin();
  let result = null;
  if (scriptPath && py) {
    try {
      const source = fs.readFileSync(scriptPath, 'utf8');
      const inputJson = JSON.stringify({
        cascadeId: conversationId || '',
        brainDir: options.brainDir || null,
        transcriptPath: options.transcriptPath || null
      });
      const res = spawnSync(py, ['-I', '-c', source, '--stdin-json'], {
        input: inputJson,
        encoding: 'utf8',
        timeout: 8000,
        windowsHide: true
      });
      if (res.status === 0 && res.stdout.trim()) {
        result = JSON.parse(res.stdout.trim());
      }
    } catch {}
  }
  if (!result) {
    result = extractRehydrateMemoryFallbackJs(conversationId, options);
  }
  try {
    const prev = loadStateFile(options);
    saveStateFile({
      ...prev,
      lastRunAt: new Date().toISOString(),
      lastSummary: {
        cascadeId: conversationId || null,
        userGoalsCount: result.userGoalsCount || 0,
        taskItemsCount: result.taskItemsCount || 0,
        touchedFilesCount: result.touchedFilesCount || 0
      }
    }, options);
  } catch {}
  return result;
}

module.exports = {
  resolveRehydrateScriptPath,
  materializeRehydrateScriptIfAsar,
  getRehydrateStatus,
  applyRehydrate,
  disableRehydrate,
  restoreRehydrate,
  extractRehydrateMemory
};
