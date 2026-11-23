'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { DEFAULT_MODEL_LIMITS } = require('../shared/constants');
const { ConfigStore, readJsonSafe, atomicWriteJson, ensureDir } = require('../shared/config-store');

function validateContextLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error('Context limit must be an integer');
  }
  if (n < 8192 || n > 4194304) {
    throw new Error('Context limit must be between 8,192 and 4,194,304 tokens');
  }
  return n;
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function detectLanguageServerBinary(env = process.env) {
  const candidates = [];
  if (env.ANTIGRAVITY_AGENTAPI_EXE) candidates.push(env.ANTIGRAVITY_AGENTAPI_EXE);
  if (process.platform === 'win32') {
    const localApp = env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    candidates.push(path.join(localApp, 'Programs', 'antigravity', 'resources', 'bin', 'language_server.exe'));
    candidates.push(path.join(localApp, 'Programs', 'antigravity', 'resources', 'app.asar.unpacked', 'bin', 'language_server.exe'));
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Antigravity.app/Contents/Resources/bin/language_server');
  } else {
    candidates.push('/usr/lib/antigravity/resources/bin/language_server');
  }
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function inspectPeHeader(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const head = Buffer.alloc(512);
    const n = fs.readSync(fd, head, 0, 512, 0);
    fs.closeSync(fd);
    if (n < 64 || head[0] !== 0x4d || head[1] !== 0x5a) {
      return { validPe: false, reason: 'Not a PE executable' };
    }
    const peOff = head.readUInt32LE(0x3c);
    if (peOff + 6 > n || head.toString('ascii', peOff, peOff + 4) !== 'PE\0\0') {
      return { validPe: false, reason: 'PE signature out of header preview' };
    }
    const machine = head.readUInt16LE(peOff + 4);
    return {
      validPe: true,
      arch: machine === 0x8664 ? 'x64' : machine === 0xaa64 ? 'arm64' : `0x${machine.toString(16)}`,
    };
  } catch (err) {
    return { validPe: false, reason: err.message };
  }
}

class ContextLimitManager {
  constructor(options = {}) {
    this.store = options.store || new ConfigStore(options.stateDir);
    this.env = options.env || process.env;
    this.binaryPath = options.binaryPath || null;
  }

  getBackupPath(binPath) {
    return path.join(this.store.backupsDir, `${path.basename(binPath)}.studio-orig.bak`);
  }

  getManifestPath() {
    return path.join(this.store.stateDir, 'context-limit-manifest.json');
  }

  getStatus() {
    const cfg = this.store.load();
    const binPath = this.binaryPath || detectLanguageServerBinary(this.env);
    const manifest = readJsonSafe(this.getManifestPath(), null);
    const pe = binPath && process.platform === 'win32' ? inspectPeHeader(binPath) : null;
    return {
      perModelLimits: cfg.context?.perModelLimits || { ...DEFAULT_MODEL_LIMITS },
      defaultLimits: { ...DEFAULT_MODEL_LIMITS },
      binaryFound: Boolean(binPath),
      binaryPath: binPath,
      peInfo: pe,
      binaryPatchSupported: false, // Fail-closed unless exact signature verified; config-level limit always works safely
      backupExists: binPath ? fs.existsSync(this.getBackupPath(binPath)) : false,
      manifest,
    };
  }

  setModelLimit(modelName, limit) {
    const cleanModel = String(modelName || '').trim();
    if (!cleanModel) throw new Error('Model name is required');
    const validLimit = validateContextLimit(limit);
    const cfg = this.store.load();
    const nextLimits = { ...(cfg.context?.perModelLimits || {}), [cleanModel]: validLimit };
    this.store.save({ context: { perModelLimits: nextLimits } });
    return this.getStatus();
  }

  resetModelLimit(modelName) {
    const cfg = this.store.load();
    const nextLimits = { ...(cfg.context?.perModelLimits || {}) };
    if (modelName) {
      if (DEFAULT_MODEL_LIMITS[modelName]) {
        nextLimits[modelName] = DEFAULT_MODEL_LIMITS[modelName];
      } else {
        delete nextLimits[modelName];
      }
      this.store.save({ context: { perModelLimits: nextLimits } });
    } else {
      this.store.save({ context: { perModelLimits: { ...DEFAULT_MODEL_LIMITS } } });
    }
    return this.getStatus();
  }

  /**
   * Safe binary backup & fail-closed gate check for language_server.exe.
   * Never mutates binary bytes unless explicit verified pattern exists.
   */
  backupBinaryIfPresent() {
    const binPath = this.binaryPath || detectLanguageServerBinary(this.env);
    if (!binPath || !fs.existsSync(binPath)) {
      return { ok: false, reason: 'language_server binary not found' };
    }
    ensureDir(this.store.backupsDir);
    const bak = this.getBackupPath(binPath);
    if (!fs.existsSync(bak)) {
      fs.copyFileSync(binPath, bak);
    }
    const manifest = {
      binaryPath: binPath,
      backupPath: bak,
      backupSha256: sha256File(bak),
      updatedAt: new Date().toISOString(),
    };
    atomicWriteJson(this.getManifestPath(), manifest);
    return { ok: true, ...manifest };
  }

  restoreBinaryBackup() {
    const binPath = this.binaryPath || detectLanguageServerBinary(this.env);
    const manifest = readJsonSafe(this.getManifestPath(), null);
    const targetBin = binPath || manifest?.binaryPath;
    if (!targetBin) return { ok: false, reason: 'Target binary path unknown' };
    const bak = manifest?.backupPath || this.getBackupPath(targetBin);
    if (!fs.existsSync(bak)) {
      return { ok: false, reason: 'No binary backup found' };
    }
    fs.copyFileSync(bak, targetBin);
    return { ok: true, restoredPath: targetBin, fromBackup: bak };
  }
}

module.exports = {
  validateContextLimit,
  detectLanguageServerBinary,
  inspectPeHeader,
  ContextLimitManager,
};
