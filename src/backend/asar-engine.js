'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
let coreAsar;
try {
  coreAsar = require('../core/asar-engine');
} catch {
  coreAsar = require('./core/asar-engine');
}
const {
  getStateDir: getStudioStateDir,
  getLegacyMeterStateDir,
  getAntigravityRoamingDir,
} = require('../shared/constants');

function getRawFs() {
  if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
    try {
      return require('original-fs');
    } catch {}
  }
  return fs;
}

function getAppDataDir(options = {}) {
  if (options && typeof options.appDataDir === 'string' && options.appDataDir.trim()) {
    return path.resolve(options.appDataDir.trim());
  }
  if (process.env.APPDATA) return process.env.APPDATA;
  const home = (options && options.homeDir) || os.homedir();
  const platform = (options && options.platform) || process.platform;
  if (platform === 'win32') {
    return path.join(home, 'AppData', 'Roaming');
  }
  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support');
  }
  return process.env.XDG_CONFIG_HOME || path.join(home, '.config');
}

function getStateDir(env = process.env) {
  const dir = getStudioStateDir(env);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {}
  return dir;
}

function isIsolatedTestPath(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') return false;
  const resolved = path.resolve(targetPath);
  const candidates = [os.tmpdir()];
  try {
    candidates.push(fs.realpathSync(os.tmpdir()));
  } catch {}
  try {
    if (fs.existsSync(resolved)) {
      const realTarget = fs.realpathSync(resolved);
      for (const tmpBase of candidates) {
        if (tmpBase && realTarget.toLowerCase().startsWith(path.resolve(tmpBase).toLowerCase())) {
          return true;
        }
      }
    }
  } catch {}
  const lower = resolved.toLowerCase().replace(/\\/g, '/');
  for (const tmpBase of candidates) {
    if (tmpBase && lower.startsWith(path.resolve(tmpBase).toLowerCase().replace(/\\/g, '/'))) {
      return true;
    }
  }
  return (
    lower.startsWith('/tmp/') ||
    lower.startsWith('/private/tmp/') ||
    lower.startsWith('/var/folders/') ||
    lower.startsWith('/private/var/folders/')
  );
}

function findAsarPath(customPath) {
  const rawFs = getRawFs();
  const explicitPath = customPath || (process.env.AG_STUDIO_ASAR_PATH || process.env.AG_ASAR_PATH || '').trim();
  if (explicitPath) {
    const resolved = path.resolve(explicitPath);
    if (rawFs.existsSync(resolved) && rawFs.statSync(resolved).isDirectory()) {
      const inMacBundle = path.join(resolved, 'Contents', 'Resources', 'app.asar');
      if (rawFs.existsSync(inMacBundle)) return inMacBundle;
      const inRes = path.join(resolved, 'resources', 'app.asar');
      if (rawFs.existsSync(inRes)) return inRes;
      const direct = path.join(resolved, 'app.asar');
      if (rawFs.existsSync(direct)) return direct;
    }
    if (rawFs.existsSync(resolved)) return resolved;
    throw new Error(`Could not find app.asar at specified path: ${explicitPath}`);
  }
  if (process.versions && process.versions.electron && process.execPath) {
    const execDir = path.dirname(process.execPath);
    const hostCandidates = [
      path.join(execDir, 'resources', 'app.asar'),
      path.join(execDir, '..', 'Resources', 'app.asar'),
    ];
    for (const hostAsar of hostCandidates) {
      if (rawFs.existsSync(hostAsar)) return path.resolve(hostAsar);
    }
  }
  const home = os.homedir();
  const candidates = [];
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    candidates.push(
      path.join(localAppData, 'Programs', 'antigravity', 'resources', 'app.asar'),
      path.join(localAppData, 'Programs', 'Antigravity', 'resources', 'app.asar'),
      path.join(programFiles, 'antigravity', 'resources', 'app.asar'),
      path.join(programFiles, 'Google Antigravity', 'resources', 'app.asar'),
      path.join(home, 'AppData', 'Roaming', 'antigravity', 'resources', 'app.asar')
    );
  } else if (process.platform === 'darwin') {
    candidates.push(
      '/Applications/Antigravity.app/Contents/Resources/app.asar',
      path.join(home, 'Applications', 'Antigravity.app', 'Contents', 'Resources', 'app.asar'),
      '/Applications/Antigravity IDE.app/Contents/Resources/app.asar',
      path.join(home, 'Applications', 'Antigravity IDE.app', 'Contents', 'Resources', 'app.asar'),
      '/Applications/Google Antigravity.app/Contents/Resources/app.asar',
      path.join(home, 'Applications', 'Google Antigravity.app', 'Contents', 'Resources', 'app.asar')
    );
  } else {
    candidates.push(
      '/opt/antigravity/resources/app.asar',
      '/usr/lib/antigravity/resources/app.asar',
      '/usr/share/antigravity/resources/app.asar',
      path.join(home, '.local', 'share', 'antigravity', 'resources', 'app.asar')
    );
  }
  for (const p of candidates) {
    if (rawFs.existsSync(p)) return p;
  }
  throw new Error('Could not auto-detect Antigravity installation (app.asar).');
}

const builtinAsar = {
  extractFile: coreAsar.readAsarFile,
  listPackage: (archivePath) => coreAsar.listAsarFiles(archivePath).map((f) => '/' + f.path),
  extractAll: coreAsar.extractAsarToDir,
  createPackage: coreAsar.packDirectoryToAsar,
};

function loadAsarEngine() {
  return builtinAsar;
}

module.exports = {
  loadAsarEngine,
  builtinAsar,
  getRawFs,
  getStateDir,
  getLegacyMeterStateDir,
  getAntigravityRoamingDir,
  getAppDataDir,
  isIsolatedTestPath,
  findAsarPath,
};
