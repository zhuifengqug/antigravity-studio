'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function safeWriteJsonSync(targetPath, data, options = {}) {
  const fsImpl = options.fs || fs;
  if (!targetPath || typeof targetPath !== 'string') {
    return { ok: false, phase: 'argument', error: '目标文件路径无效', path: targetPath };
  }

  const resolved = path.resolve(targetPath);
  const dir = path.dirname(resolved);

  try {
    fsImpl.mkdirSync(dir, { recursive: true });
  } catch (err) {
    return { ok: false, phase: 'mkdir', ...(err?.code ? { code: err.code } : {}), error: err?.message || '创建父目录失败', path: resolved };
  }

  try {
    if (fsImpl.existsSync(resolved)) {
      const st = fsImpl.statSync(resolved);
      if (st.isDirectory()) {
        return { ok: false, phase: 'validate_target', code: 'EISDIR', error: '目标路径是一个目录，无法写入文件', path: resolved };
      }
    }
  } catch (err) {
    return { ok: false, phase: 'stat', ...(err?.code ? { code: err.code } : {}), error: err?.message || '检查目标路径失败', path: resolved };
  }

  let serialized;
  try {
    const indent = options.indent !== undefined ? options.indent : 2;
    serialized = JSON.stringify(data, null, indent) + '\n';
  } catch (err) {
    return { ok: false, phase: 'serialize', error: err?.message || 'JSON 序列化失败', path: resolved };
  }

  const baseName = path.basename(resolved);
  const rand = crypto.randomBytes(4).toString('hex');
  const tmpName = `.${baseName}.${process.pid}.${Date.now()}.${rand}.tmp`;
  const tmpPath = path.join(dir, tmpName);

  try {
    fsImpl.writeFileSync(tmpPath, serialized, 'utf8');
  } catch (err) {
    try { if (fsImpl.existsSync(tmpPath)) fsImpl.unlinkSync(tmpPath); } catch {}
    return { ok: false, phase: 'write_temp', ...(err?.code ? { code: err.code } : {}), error: err?.message || '写入临时文件失败', path: resolved };
  }

  try {
    const tmpContent = fsImpl.readFileSync(tmpPath, 'utf8');
    const parsed = JSON.parse(tmpContent);
    if (typeof options.validate === 'function') {
      const valid = options.validate(parsed);
      if (!valid) {
        throw new Error('临时文件内容未通过业务校验规则');
      }
    }
  } catch (err) {
    try { if (fsImpl.existsSync(tmpPath)) fsImpl.unlinkSync(tmpPath); } catch {}
    return { ok: false, phase: 'pre_verify', ...(err?.code ? { code: err.code } : {}), error: err?.message || '临时文件校验失败', path: resolved };
  }

  try {
    fsImpl.renameSync(tmpPath, resolved);
  } catch (renameErr) {
    try {
      if (fsImpl.existsSync(tmpPath)) {
        fsImpl.unlinkSync(tmpPath);
      }
    } catch {}
    return { ok: false, phase: 'rename', ...(renameErr?.code ? { code: renameErr.code } : {}), error: renameErr?.message || '重命名替换目标文件失败', path: resolved };
  }

  try {
    const finalContent = fsImpl.readFileSync(resolved, 'utf8');
    const finalParsed = JSON.parse(finalContent);
    if (typeof options.validate === 'function') {
      const valid = options.validate(finalParsed);
      if (!valid) {
        throw new Error('目标文件写后校验未通过业务规则');
      }
    }
  } catch (postErr) {
    return { ok: false, phase: 'post_verify', ...(postErr?.code ? { code: postErr.code } : {}), error: postErr?.message || '替换后读回校验失败', path: resolved };
  }

  return {
    ok: true,
    path: resolved,
    bytesWritten: Buffer.byteLength(serialized, 'utf8')
  };
}

function safeReadJsonSync(targetPath, fallbackValue = null, options = {}) {
  const fsImpl = options.fs || fs;
  if (!targetPath) {
    return { ok: false, data: fallbackValue, exists: false, corrupted: false, error: '未指定目标路径' };
  }

  const resolved = path.resolve(targetPath);
  if (typeof fsImpl.statSync === 'function') {
    try {
      const st = fsImpl.statSync(resolved);
      if (st && typeof st.isDirectory === 'function' && st.isDirectory()) {
        return { ok: false, data: fallbackValue, exists: true, corrupted: false, code: 'EISDIR', error: '目标路径是一个目录，无法作为文件读取' };
      }
    } catch (statErr) {
      if (statErr && statErr.code === 'ENOENT') {
        return { ok: true, data: fallbackValue, exists: false, corrupted: false };
      }
      return {
        ok: false,
        data: fallbackValue,
        exists: true,
        corrupted: false,
        code: statErr?.code,
        error: statErr?.message || '检查目标文件状态失败'
      };
    }
  } else if (!fsImpl.existsSync(resolved)) {
    return { ok: true, data: fallbackValue, exists: false, corrupted: false };
  }

  let content = '';
  try {
    content = fsImpl.readFileSync(resolved, 'utf8');
  } catch (err) {
    return { ok: false, data: fallbackValue, exists: true, corrupted: false, code: err?.code, error: err?.message || '读取文件失败' };
  }

  if (!content.trim()) {
    return { ok: false, data: fallbackValue, exists: true, corrupted: true, error: '文件内容为空' };
  }

  try {
    const parsed = JSON.parse(content);
    if (typeof options.validate === 'function') {
      const valid = options.validate(parsed);
      if (!valid) {
        throw new Error('数据结构未通过业务校验');
      }
    }
    return { ok: true, data: parsed, exists: true, corrupted: false };
  } catch (parseErr) {
    let quarantinePath = null;
    if (options.quarantineCorrupt !== false) {
      try {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        quarantinePath = resolved.replace(/\.json$/i, '') + `.corrupt.${stamp}.json`;
        fsImpl.copyFileSync(resolved, quarantinePath);
      } catch {}
    }

    if (options.backupPath && fsImpl.existsSync(options.backupPath)) {
      try {
        const bakContent = fsImpl.readFileSync(options.backupPath, 'utf8');
        const bakParsed = JSON.parse(bakContent);
        if (!options.validate || options.validate(bakParsed)) {
          return {
            ok: true,
            data: bakParsed,
            exists: true,
            corrupted: true,
            recoveredFromBackup: true,
            backupPath: options.backupPath,
            quarantinePath,
            error: parseErr?.message || '原始文件损坏，已从备份恢复'
          };
        }
      } catch {}
    }

    return {
      ok: false,
      data: fallbackValue,
      exists: true,
      corrupted: true,
      quarantinePath,
      error: parseErr?.message || 'JSON 解析失败'
    };
  }
}

const LOCK_SLEEP_BUF = typeof SharedArrayBuffer === 'function'
  ? new Int32Array(new SharedArrayBuffer(4))
  : null;

function sleepSyncMs(ms) {
  if (LOCK_SLEEP_BUF) {
    try {
      Atomics.wait(LOCK_SLEEP_BUF, 0, 0, ms);
      return;
    } catch {}
  }
  const until = Date.now() + ms;
  while (Date.now() < until) {}
}

function acquireSyncFileLock(targetPath, timeoutMs = 15000) {
  const resolved = path.resolve(targetPath);
  const lockFile = `${resolved}.lock`;
  try { fs.mkdirSync(path.dirname(lockFile), { recursive: true }); } catch {}
  const start = Date.now();
  while (true) {
    try {
      const fd = fs.openSync(lockFile, 'wx');
      fs.writeFileSync(fd, `${process.pid}:${Date.now()}`, 'utf8');
      fs.closeSync(fd);
      return {
        lockFile,
        release: () => {
          try { fs.unlinkSync(lockFile); } catch {}
        }
      };
    } catch {
      if (Date.now() - start >= timeoutMs) {
        throw new Error(`获取文件写锁超时 (${lockFile})`);
      }
      try {
        const content = fs.readFileSync(lockFile, 'utf8');
        const pid = parseInt(String(content).split(':')[0], 10);
        if (pid && !isNaN(pid)) {
          let running = true;
          try { process.kill(pid, 0); } catch { running = false; }
          if (!running) {
            try { fs.unlinkSync(lockFile); } catch {}
            continue;
          }
        }
      } catch {}
      sleepSyncMs(12);
    }
  }
}

function withFileLockSync(targetPath, fn, timeoutMs = 15000) {
  const lock = acquireSyncFileLock(targetPath, timeoutMs);
  try {
    return fn();
  } finally {
    lock.release();
  }
}

module.exports = {
  safeWriteJsonSync,
  safeReadJsonSync,
  withFileLockSync
};
