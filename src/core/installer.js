'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  STUDIO_VERSION,
  STUDIO_DIR_NAME,
  BACKUP_SUFFIX,
  MANIFEST_FILENAME,
  getStateDir,
} = require('../shared/constants');
const { atomicWriteJson, readJsonSafe, ensureDir } = require('../shared/config-store');
const {
  readAsarFile,
  listAsarFiles,
  rebuildAsarWithOverlay,
  sha256File,
  sha256Buffer,
} = require('./asar-engine');
const {
  patchUtilsJs,
  patchPreloadJs,
  patchMenuJs,
  patchTrayJs,
  patchLanguageServerJs,
  inspectPatchAnchors,
} = require('./patcher');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

function detectAntigravityAsar(explicitPath, env = process.env) {
  const candidates = [];
  if (explicitPath) candidates.push(path.resolve(explicitPath));
  if (env.AG_STUDIO_ASAR_PATH) candidates.push(path.resolve(env.AG_STUDIO_ASAR_PATH));

  if (process.platform === 'win32') {
    const localApp = env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    candidates.push(path.join(localApp, 'Programs', 'antigravity', 'resources', 'app.asar'));
    candidates.push(path.join(localApp, 'Programs', 'Antigravity', 'resources', 'app.asar'));
    if (env.ProgramFiles) {
      candidates.push(path.join(env.ProgramFiles, 'Antigravity', 'resources', 'app.asar'));
    }
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Antigravity.app/Contents/Resources/app.asar');
    candidates.push(path.join(os.homedir(), 'Applications', 'Antigravity.app', 'Contents', 'Resources', 'app.asar'));
  } else {
    candidates.push('/usr/lib/antigravity/resources/app.asar');
    candidates.push('/opt/Antigravity/resources/app.asar');
    candidates.push(path.join(os.homedir(), '.local', 'share', 'antigravity', 'resources', 'app.asar'));
  }

  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function collectBundleFiles(projectRoot = PROJECT_ROOT) {
  const overlay = new Map();
  const addDir = (absDir, targetSubdir) => {
    if (!fs.existsSync(absDir)) return;
    for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
      const full = path.join(absDir, ent.name);
      if (ent.isDirectory()) {
        addDir(full, `${targetSubdir}/${ent.name}`);
      } else if (ent.isFile()) {
        overlay.set(`dist/${STUDIO_DIR_NAME}/${targetSubdir}/${ent.name}`, fs.readFileSync(full));
      }
    }
  };

  addDir(path.join(projectRoot, 'src', 'shared'), 'shared');
  addDir(path.join(projectRoot, 'src', 'i18n'), 'i18n');

  // Include core/asar-engine.js so dist/ag-studio/asar-engine.js resolves inside ASAR
  const coreAsarPath = path.join(projectRoot, 'src', 'core', 'asar-engine.js');
  if (fs.existsSync(coreAsarPath)) {
    overlay.set(`dist/${STUDIO_DIR_NAME}/core/asar-engine.js`, fs.readFileSync(coreAsarPath));
  }

  // Include Python runtime helper scripts under dist/ag-studio/scripts/
  for (const pyName of ['attachment_scan.py', 'rehydrate_after_compact.py']) {
    const pyPath = path.join(projectRoot, 'scripts', pyName);
    if (fs.existsSync(pyPath)) {
      overlay.set(`dist/${STUDIO_DIR_NAME}/scripts/${pyName}`, fs.readFileSync(pyPath));
    }
  }

  // Flatten backend modules directly under dist/ag-studio/ for concise require('./ag-studio/studio-main')
  const backendDir = path.join(projectRoot, 'src', 'backend');
  for (const ent of fs.readdirSync(backendDir, { withFileTypes: true })) {
    if (ent.isFile() && ent.name.endsWith('.js') && ent.name !== 'studio-preload-snippet.js') {
      overlay.set(`dist/${STUDIO_DIR_NAME}/${ent.name}`, fs.readFileSync(path.join(backendDir, ent.name)));
    }
  }

  // Expose native-i18n at dist/ag-studio/native-i18n.js for menu.js / tray.js hooks
  const nativeI18nPath = path.join(projectRoot, 'src', 'i18n', 'native-i18n.js');
  if (fs.existsSync(nativeI18nPath)) {
    overlay.set(`dist/${STUDIO_DIR_NAME}/native-i18n.js`, fs.readFileSync(nativeI18nPath));
  }

  // Built renderer & i18n bundles
  const builtRenderer = path.join(projectRoot, 'dist', 'studio-renderer.js');
  if (!fs.existsSync(builtRenderer)) {
    throw new Error('Built renderer not found at dist/studio-renderer.js. Run `npm run build` first.');
  }
  overlay.set(`dist/${STUDIO_DIR_NAME}/studio-renderer.js`, fs.readFileSync(builtRenderer));

  const builtI18nPreload = path.join(projectRoot, 'dist', 'studio-i18n-preload.js');
  if (fs.existsSync(builtI18nPreload)) {
    overlay.set(`dist/${STUDIO_DIR_NAME}/studio-i18n-preload.js`, fs.readFileSync(builtI18nPreload));
  }

  return overlay;
}

function readAsarPackageVersionSafe(asarPath) {
  try {
    const raw = readAsarFile(asarPath, 'package.json').toString('utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.version === 'string' && parsed.version.trim()
      ? parsed.version.trim()
      : null;
  } catch {
    return null;
  }
}

function atomicCopyFile(srcPath, destPath) {
  const tmpDest = `${destPath}.tmp-${process.pid}-${Date.now()}`;
  fs.copyFileSync(srcPath, tmpDest);
  try {
    fs.renameSync(tmpDest, destPath);
  } catch {
    fs.copyFileSync(tmpDest, destPath);
    try { fs.unlinkSync(tmpDest); } catch {}
  }
}

function ensureStockBackup(asarPath, backupPath, stockPkgVersion, isAlreadyPatched, currentAsarSha) {
  if (!fs.existsSync(backupPath)) {
    atomicCopyFile(asarPath, backupPath);
    return { rotated: false, rotatedBackupPath: null, previousBackupVersion: null };
  }
  if (isAlreadyPatched) {
    return { rotated: false, rotatedBackupPath: null, previousBackupVersion: null };
  }

  const backupVersion = readAsarPackageVersionSafe(backupPath);
  const backupSha = sha256File(backupPath);
  const stockSha = currentAsarSha || sha256File(asarPath);
  if (backupVersion === stockPkgVersion && backupSha === stockSha) {
    return { rotated: false, rotatedBackupPath: null, previousBackupVersion: backupVersion };
  }

  const verTag = String(backupVersion || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');
  const rotatedBackupPath = `${asarPath}.studio-orig.${verTag}.bak`;
  if (!fs.existsSync(rotatedBackupPath)) {
    atomicCopyFile(backupPath, rotatedBackupPath);
  }
  atomicCopyFile(asarPath, backupPath);
  return {
    rotated: true,
    rotatedBackupPath,
    previousBackupVersion: backupVersion,
  };
}

function getBackupCandidates(asarPath) {
  return [
    `${asarPath}${BACKUP_SUFFIX}`,
    `${asarPath}.bak`,
    `${asarPath}.orig`,
  ];
}

function getStudioStatus(options = {}) {
  const asarPath = detectAntigravityAsar(options.asarPath, options.env);
  const stateDir = options.stateDir || getStateDir(options.env);
  const manifestPath = path.join(stateDir, MANIFEST_FILENAME);
  const savedManifest = readJsonSafe(manifestPath, null);

  if (!asarPath) {
    return {
      found: false,
      asarPath: null,
      installed: false,
      appVersion: null,
      studioVersion: null,
      backupExists: false,
      manifest: savedManifest,
    };
  }

  const pkg = JSON.parse(readAsarFile(asarPath, 'package.json').toString('utf8'));
  const files = listAsarFiles(asarPath);
  const hasStudioManifest = files.some((f) => f.path === `dist/${STUDIO_DIR_NAME}/manifest.json`);
  let embeddedManifest = null;
  if (hasStudioManifest) {
    try {
      embeddedManifest = JSON.parse(readAsarFile(asarPath, `dist/${STUDIO_DIR_NAME}/manifest.json`).toString('utf8'));
    } catch {}
  }

  const backupPath = `${asarPath}${BACKUP_SUFFIX}`;
  const legacyBackups = getBackupCandidates(asarPath).filter((p) => p !== backupPath && fs.existsSync(p));
  const legacyModulesPresent = files.some((f) => /^dist\/meter-/.test(f.path));

  return {
    found: true,
    asarPath,
    installed: Boolean(embeddedManifest),
    hasStudioManifest,
    appVersion: pkg.version || 'unknown',
    productName: pkg.productName || 'Antigravity',
    studioVersion: embeddedManifest?.studioVersion || null,
    backupExists: fs.existsSync(backupPath),
    backupPath,
    legacyBackups,
    legacyModulesPresent,
    currentSha256: sha256File(asarPath),
    manifest: embeddedManifest || savedManifest,
  };
}

function installStudio(options = {}) {
  const dryRun = Boolean(options.dryRun);
  const projectRoot = options.projectRoot || PROJECT_ROOT;
  const stateDir = options.stateDir || getStateDir(options.env);
  const asarPath = detectAntigravityAsar(options.asarPath, options.env);

  if (!asarPath) {
    throw new Error('Could not locate Antigravity resources/app.asar. Pass --asar <path> explicitly.');
  }

  const pkg = JSON.parse(readAsarFile(asarPath, 'package.json').toString('utf8'));
  const targetFiles = ['dist/utils.js', 'dist/preload.js', 'dist/menu.js', 'dist/tray.js', 'dist/languageServer.js'];
  const rawContents = {};
  for (const rel of targetFiles) {
    rawContents[rel] = readAsarFile(asarPath, rel).toString('utf8');
  }

  const anchorReport = inspectPatchAnchors(rawContents);
  const failedAnchors = Object.entries(anchorReport).filter(([, v]) => !v.ok);
  if (failedAnchors.length > 0) {
    const details = failedAnchors.map(([k, v]) => `${k}: ${v.error}`).join('; ');
    throw new Error(`Pre-flight anchor check failed (fail-closed): ${details}`);
  }

  const preloadSnippetPath = path.join(projectRoot, 'src', 'backend', 'studio-preload-snippet.js');
  const preloadSnippet = fs.readFileSync(preloadSnippetPath, 'utf8');
  const bundleOverlay = collectBundleFiles(projectRoot);

  const patchedUtils = patchUtilsJs(rawContents['dist/utils.js']);
  const patchedPreload = patchPreloadJs(rawContents['dist/preload.js'], preloadSnippet);
  const patchedMenu = patchMenuJs(rawContents['dist/menu.js']);
  const patchedTray = patchTrayJs(rawContents['dist/tray.js']);
  const patchedLs = patchLanguageServerJs(rawContents['dist/languageServer.js']);

  // Also fix relative require paths inside embedded backend modules:
  // Inside ASAR: dist/ag-studio/*.js expects ../shared/... -> actually dist/ag-studio/shared/...
  // Rewrite require('../shared/...') / require('../i18n/...') / require('../core/...') inside dist/ag-studio/*.js
  for (const [rel, buf] of bundleOverlay.entries()) {
    const isTopStudioJs =
      rel.startsWith(`dist/${STUDIO_DIR_NAME}/`) &&
      rel.endsWith('.js') &&
      !rel.endsWith('/studio-renderer.js') &&
      !rel.endsWith('/studio-i18n-preload.js') &&
      !rel.includes('/shared/') &&
      !rel.includes('/i18n/') &&
      !rel.includes('/core/') &&
      !rel.includes('/scripts/');
    if (isTopStudioJs) {
      let code = buf.toString('utf8');
      code = code.replace(/require\(['"]\.\.\/shared\/([^'"]+)['"]\)/g, "require('./shared/$1')");
      code = code.replace(/require\(['"]\.\.\/i18n\/([^'"]+)['"]\)/g, "require('./i18n/$1')");
      code = code.replace(/require\(['"]\.\.\/core\/([^'"]+)['"]\)/g, "require('./core/$1')");
      bundleOverlay.set(rel, Buffer.from(code, 'utf8'));
    }
  }

  const allWarnings = [
    ...patchedUtils.warnings,
    ...patchedPreload.warnings,
    ...patchedMenu.warnings,
    ...patchedTray.warnings,
    ...patchedLs.warnings,
  ];

  const backupPath = `${asarPath}${BACKUP_SUFFIX}`;
  const statusBefore = getStudioStatus({ asarPath, stateDir, env: options.env });

  if (dryRun) {
    return {
      dryRun: true,
      asarPath,
      appVersion: pkg.version,
      studioVersion: STUDIO_VERSION,
      backupPath,
      backupExists: fs.existsSync(backupPath),
      legacyModulesDetected: statusBefore.legacyModulesPresent,
      anchorReport,
      warnings: allWarnings,
      bundleFileCount: bundleOverlay.size + 6,
    };
  }

  // Backup before modifying: when installing onto an unpatched ASAR (host upgrade),
  // rotate stale backup instead of letting restore downgrade to an older host version.
  const isPatchedAsar = Boolean(statusBefore.hasStudioManifest || statusBefore.installed);
  const backupOutcome = ensureStockBackup(
    asarPath,
    backupPath,
    pkg.version,
    isPatchedAsar,
    statusBefore.currentSha256
  );
  const origBackupSha = sha256File(backupPath);

  const manifest = {
    studioVersion: STUDIO_VERSION,
    appVersion: pkg.version,
    installedAt: new Date().toISOString(),
    asarPath,
    backupPath,
    backupSha256: origBackupSha,
    ...(backupOutcome.rotated ? {
      rotatedBackupPath: backupOutcome.rotatedBackupPath,
      previousBackupVersion: backupOutcome.previousBackupVersion,
    } : {}),
    patchedFiles: targetFiles,
    warnings: allWarnings,
  };

  bundleOverlay.set('dist/utils.js', Buffer.from(patchedUtils.content, 'utf8'));
  bundleOverlay.set('dist/preload.js', Buffer.from(patchedPreload.content, 'utf8'));
  bundleOverlay.set('dist/menu.js', Buffer.from(patchedMenu.content, 'utf8'));
  bundleOverlay.set('dist/tray.js', Buffer.from(patchedTray.content, 'utf8'));
  bundleOverlay.set('dist/languageServer.js', Buffer.from(patchedLs.content, 'utf8'));
  bundleOverlay.set(`dist/${STUDIO_DIR_NAME}/manifest.json`, Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'));

  // Remove legacy meter-* files if user requested clean takeover (default: keep untouched unless cleanLegacy:true)
  if (options.cleanLegacy) {
    for (const f of listAsarFiles(asarPath)) {
      if (/^dist\/meter-/.test(f.path)) {
        bundleOverlay.set(f.path, null);
      }
    }
  }

  const buildResult = rebuildAsarWithOverlay(asarPath, asarPath, bundleOverlay);
  manifest.installedAsarSha256 = buildResult.sha256;
  manifest.manifestSelfSha256 = sha256Buffer(Buffer.from(JSON.stringify(manifest)));

  ensureDir(stateDir);
  atomicWriteJson(path.join(stateDir, MANIFEST_FILENAME), manifest);

  return {
    dryRun: false,
    ...manifest,
    anchorReport,
    bundleFileCount: bundleOverlay.size,
  };
}

module.exports = {
  detectAntigravityAsar,
  collectBundleFiles,
  getStudioStatus,
  installStudio,
};
