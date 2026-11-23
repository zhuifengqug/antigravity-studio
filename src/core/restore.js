'use strict';

const fs = require('fs');
const path = require('path');
const { BACKUP_SUFFIX, MANIFEST_FILENAME, getStateDir } = require('../shared/constants');
const { readJsonSafe } = require('../shared/config-store');
const { sha256File } = require('./asar-engine');
const { detectAntigravityAsar } = require('./installer');

function restoreStudio(options = {}) {
  const stateDir = options.stateDir || getStateDir(options.env);
  const manifestPath = path.join(stateDir, MANIFEST_FILENAME);
  const manifest = readJsonSafe(manifestPath, null);
  const asarPath = detectAntigravityAsar(options.asarPath || manifest?.asarPath, options.env);

  if (!asarPath) {
    throw new Error('Could not locate Antigravity app.asar to restore.');
  }

  const backupCandidates = [
    manifest?.backupPath,
    `${asarPath}${BACKUP_SUFFIX}`,
    `${asarPath}.bak`,
  ].filter(Boolean);

  const chosenBackup = backupCandidates.find((p) => fs.existsSync(p));
  if (!chosenBackup) {
    throw new Error(`No backup found for ${asarPath}. Checked: ${backupCandidates.join(', ')}`);
  }

  if (manifest?.backupSha256 && chosenBackup === manifest.backupPath) {
    const actualSha = sha256File(chosenBackup);
    if (actualSha !== manifest.backupSha256 && !options.force) {
      throw new Error(`Backup integrity check failed: expected ${manifest.backupSha256}, got ${actualSha}`);
    }
  }

  if (options.dryRun) {
    return {
      dryRun: true,
      asarPath,
      chosenBackup,
      backupSha256: sha256File(chosenBackup),
    };
  }

  const tmpDest = `${asarPath}.restore-tmp-${process.pid}-${Date.now()}`;
  fs.copyFileSync(chosenBackup, tmpDest);
  try {
    fs.renameSync(tmpDest, asarPath);
  } catch {
    fs.copyFileSync(tmpDest, asarPath);
    try { fs.unlinkSync(tmpDest); } catch {}
  }

  if (options.removeBackup && chosenBackup.endsWith(BACKUP_SUFFIX)) {
    try { fs.unlinkSync(chosenBackup); } catch {}
  }

  return {
    dryRun: false,
    restored: true,
    asarPath,
    fromBackup: chosenBackup,
    sha256: sha256File(asarPath),
  };
}

module.exports = {
  restoreStudio,
};
