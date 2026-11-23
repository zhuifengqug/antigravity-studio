'use strict';

const fs = require('fs');
const path = require('path');
const { ConfigStore } = require('../shared/config-store');

const SUPPORTED_EXT = new Map([
  ['.ttf', { format: 'truetype', mime: 'font/ttf' }],
  ['.otf', { format: 'opentype', mime: 'font/otf' }],
  ['.woff2', { format: 'woff2', mime: 'font/woff2' }],
  ['.woff', { format: 'woff', mime: 'font/woff' }],
]);

function scanLocalFonts(options = {}) {
  const store = options.store || new ConfigStore(options.stateDir);
  store.ensureLayout();
  const fontsDir = options.fontsDir || store.fontsDir;
  const includeDataUrl = options.includeDataUrl !== false;
  const fonts = [];

  if (!fs.existsSync(fontsDir)) {
    return { fontsDir, fonts };
  }

  const files = fs.readdirSync(fontsDir, { withFileTypes: true });
  for (const ent of files) {
    if (!ent.isFile()) continue;
    const ext = path.extname(ent.name).toLowerCase();
    const meta = SUPPORTED_EXT.get(ext);
    if (!meta) continue;
    const fullPath = path.join(fontsDir, ent.name);
    const stat = fs.statSync(fullPath);
    if (stat.size > 15 * 1024 * 1024) continue; // skip oversized font > 15MB
    const family = path.basename(ent.name, ext).replace(/[-_]+/g, ' ').trim();
    const entry = {
      fileName: ent.name,
      family,
      format: meta.format,
      sizeBytes: stat.size,
      filePath: fullPath,
    };
    if (includeDataUrl) {
      const b64 = fs.readFileSync(fullPath).toString('base64');
      entry.dataUrl = `data:${meta.mime};base64,${b64}`;
    }
    fonts.push(entry);
  }

  return { fontsDir, fonts };
}

module.exports = {
  scanLocalFonts,
};
