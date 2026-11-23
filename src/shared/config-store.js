'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getDefaultConfig, getStateDir } = require('./constants');

function isPlainObject(val) {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

function deepMerge(target, source) {
  if (!isPlainObject(source)) return target;
  const out = isPlainObject(target) ? { ...target } : {};
  for (const [k, v] of Object.entries(source)) {
    if (isPlainObject(v) && isPlainObject(out[k])) {
      out[k] = deepMerge(out[k], v);
    } else if (Array.isArray(v)) {
      out[k] = v.slice();
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function readJsonSafe(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function atomicWriteFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  const tmpName = `${path.basename(filePath)}.tmp-${process.pid}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const tmpPath = path.join(path.dirname(filePath), tmpName);
  fs.writeFileSync(tmpPath, content, 'utf8');
  try {
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      fs.copyFileSync(tmpPath, filePath);
      fs.unlinkSync(tmpPath);
    } catch {
      try { fs.unlinkSync(tmpPath); } catch {}
      throw err;
    }
  }
}

function atomicWriteJson(filePath, data) {
  atomicWriteFile(filePath, JSON.stringify(data, null, 2) + '\n');
}

class ConfigStore {
  constructor(stateDir = getStateDir()) {
    this.stateDir = path.resolve(stateDir);
    this.configPath = path.join(this.stateDir, 'config.json');
    this.customDictPath = path.join(this.stateDir, 'dict.custom.json');
    this.fontsDir = path.join(this.stateDir, 'fonts');
    this.accountsPath = path.join(this.stateDir, 'accounts.enc.json');
    this.backupsDir = path.join(this.stateDir, 'backups');
  }

  ensureLayout() {
    ensureDir(this.stateDir);
    ensureDir(this.fontsDir);
    ensureDir(this.backupsDir);
  }

  load() {
    const defaults = getDefaultConfig();
    const raw = readJsonSafe(this.configPath, null);
    if (!isPlainObject(raw)) return defaults;
    return deepMerge(defaults, raw);
  }

  save(partialOrFull) {
    this.ensureLayout();
    const current = this.load();
    const next = deepMerge(current, partialOrFull || {});
    atomicWriteJson(this.configPath, next);
    return next;
  }

  replace(fullConfig) {
    this.ensureLayout();
    const next = deepMerge(getDefaultConfig(), fullConfig || {});
    atomicWriteJson(this.configPath, next);
    return next;
  }

  loadCustomDictionary() {
    const raw = readJsonSafe(this.customDictPath, null);
    if (!isPlainObject(raw)) return { exact: {}, regex: [] };
    return {
      exact: isPlainObject(raw.exact) ? raw.exact : {},
      regex: Array.isArray(raw.regex) ? raw.regex : [],
    };
  }

  saveCustomDictionary(dict) {
    this.ensureLayout();
    const safe = {
      exact: isPlainObject(dict?.exact) ? dict.exact : {},
      regex: Array.isArray(dict?.regex) ? dict.regex : [],
    };
    atomicWriteJson(this.customDictPath, safe);
    return safe;
  }
}

module.exports = {
  isPlainObject,
  deepMerge,
  ensureDir,
  readJsonSafe,
  atomicWriteFile,
  atomicWriteJson,
  ConfigStore,
};
