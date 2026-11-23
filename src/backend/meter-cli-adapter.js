'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function getCliDataDirs(options = {}) {
  const home = options.homeDir || process.env.USERPROFILE || os.homedir();
  const primary = options.agCliDir || process.env.AG_CLI_DIR || path.join(home, '.gemini', 'antigravity-cli');
  const dirs = [primary];
  if (Array.isArray(options.extraCliDirs)) {
    for (const d of options.extraCliDirs) {
      if (d && !dirs.includes(d)) dirs.push(d);
    }
  }
  return dirs;
}

function listCliTranscripts(options = {}) {
  const dirs = getCliDataDirs(options);
  const items = [];
  for (const baseDir of dirs) {
    const brainDir = path.join(baseDir, 'brain');
    if (!fs.existsSync(brainDir)) continue;
    try {
      for (const ent of fs.readdirSync(brainDir, { withFileTypes: true })) {
        if (!ent.isDirectory()) continue;
        const candidates = [
          path.join(brainDir, ent.name, '.system_generated', 'logs', 'transcript.jsonl'),
          path.join(brainDir, ent.name, 'transcript.jsonl')
        ];
        for (const tp of candidates) {
          if (fs.existsSync(tp)) {
            const st = fs.statSync(tp);
            items.push({
              cascadeId: ent.name,
              transcriptPath: tp,
              cliDir: baseDir,
              size: st.size,
              mtimeMs: st.mtimeMs
            });
            break;
          }
        }
      }
    } catch {}
  }
  items.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return items;
}

function readCliSettings(options = {}) {
  const home = options.homeDir || process.env.USERPROFILE || os.homedir();
  const cliSettingsPath = path.join(home, '.gemini', 'antigravity-cli', 'settings.json');
  try {
    if (fs.existsSync(cliSettingsPath)) {
      return JSON.parse(fs.readFileSync(cliSettingsPath, 'utf8'));
    }
  } catch {}
  return {};
}

module.exports = {
  getCliDataDirs,
  listCliTranscripts,
  readCliSettings
};
