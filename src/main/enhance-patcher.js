'use strict';

const fs = require('fs');
const path = require('path');
const { ConfigStore, readJsonSafe, atomicWriteJson, ensureDir } = require('../shared/config-store');
const { detectLanguageServerBinary } = require('./context-limit-patcher');

const DEFAULT_TITLE_PROMPT_SNIPPETS = [
  'Generate a concise title',
  'Create a short title',
  'Summarize the conversation title',
];

function patchTitleTemplateInBuffer(buf, targetAsciiOrUtf8, replacementUtf8) {
  const needle = Buffer.from(targetAsciiOrUtf8, 'utf8');
  const idx = buf.indexOf(needle);
  if (idx === -1) return { matched: false, offset: -1 };
  const repBuf = Buffer.from(replacementUtf8, 'utf8');
  if (repBuf.length > needle.length) {
    return { matched: true, offset: idx, ok: false, reason: 'Replacement exceeds original slot length' };
  }
  const out = Buffer.from(buf);
  repBuf.copy(out, idx);
  for (let i = repBuf.length; i < needle.length; i++) {
    out[idx + i] = 0x20; // safe space padding inside string literal
  }
  return { matched: true, offset: idx, ok: true, buffer: out };
}

class EnhanceManager {
  constructor(options = {}) {
    this.store = options.store || new ConfigStore(options.stateDir);
    this.env = options.env || process.env;
    this.binaryPath = options.binaryPath || null;
  }

  getManifestPath() {
    return path.join(this.store.stateDir, 'enhance-manifest.json');
  }

  getBackupPath(binPath) {
    return path.join(this.store.backupsDir, `${path.basename(binPath)}.enhance-orig.bak`);
  }

  getStatus() {
    const cfg = this.store.load();
    const binPath = this.binaryPath || detectLanguageServerBinary(this.env);
    const manifest = readJsonSafe(this.getManifestPath(), null);
    return {
      chineseSessionTitle: Boolean(cfg.enhance?.chineseSessionTitle),
      subscriptionMonthlyUsd: Number(cfg.enhance?.subscriptionMonthlyUsd ?? 20),
      pricingOverrides: cfg.enhance?.pricingOverrides || {},
      binaryFound: Boolean(binPath),
      binaryPath: binPath,
      binaryPatched: Boolean(manifest?.patched),
      backupExists: binPath ? fs.existsSync(this.getBackupPath(binPath)) : false,
    };
  }

  setChineseSessionTitle(enabled) {
    const flag = Boolean(enabled);
    this.store.save({ enhance: { chineseSessionTitle: flag } });
    return this.getStatus();
  }

  applyBinaryChineseTitlePatch() {
    const binPath = this.binaryPath || detectLanguageServerBinary(this.env);
    if (!binPath || !fs.existsSync(binPath)) {
      return { ok: false, fallbackToPreference: true, reason: 'language_server binary not found; saved renderer preference only' };
    }
    const raw = fs.readFileSync(binPath);
    for (const snip of DEFAULT_TITLE_PROMPT_SNIPPETS) {
      const zhRep = '生成中文标题:';
      if (Buffer.byteLength(zhRep) <= Buffer.byteLength(snip)) {
        const res = patchTitleTemplateInBuffer(raw, snip, zhRep);
        if (res.matched && res.ok) {
          ensureDir(this.store.backupsDir);
          const bak = this.getBackupPath(binPath);
          if (!fs.existsSync(bak)) fs.copyFileSync(binPath, bak);
          fs.writeFileSync(binPath, res.buffer);
          atomicWriteJson(this.getManifestPath(), {
            patched: true,
            binaryPath: binPath,
            backupPath: bak,
            offset: res.offset,
            updatedAt: new Date().toISOString(),
          });
          this.store.save({ enhance: { chineseSessionTitle: true } });
          return { ok: true, patched: true, offset: res.offset };
        }
      }
    }
    // Fail-closed: keep binary untouched and enable preference flag
    this.store.save({ enhance: { chineseSessionTitle: true } });
    return {
      ok: true,
      patched: false,
      fallbackToPreference: true,
      reason: 'Binary template signature not matched in current build; enabled preference-level localization without mutating binary.',
    };
  }

  restoreBinaryPatch() {
    const binPath = this.binaryPath || detectLanguageServerBinary(this.env);
    const manifest = readJsonSafe(this.getManifestPath(), null);
    const target = binPath || manifest?.binaryPath;
    if (!target) return { ok: false, reason: 'No target binary' };
    const bak = manifest?.backupPath || this.getBackupPath(target);
    if (!fs.existsSync(bak)) {
      this.store.save({ enhance: { chineseSessionTitle: false } });
      return { ok: true, restored: false, reason: 'No binary backup needed' };
    }
    fs.copyFileSync(bak, target);
    atomicWriteJson(this.getManifestPath(), { patched: false, restoredAt: new Date().toISOString() });
    this.store.save({ enhance: { chineseSessionTitle: false } });
    return { ok: true, restored: true, fromBackup: bak };
  }
}

module.exports = {
  patchTitleTemplateInBuffer,
  EnhanceManager,
};
