'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function align4(n) {
  return (n + 3) & ~3;
}

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(filePath, 'r');
  try {
    const chunk = Buffer.alloc(1024 * 1024);
    let bytesRead = 0;
    while ((bytesRead = fs.readSync(fd, chunk, 0, chunk.length, null)) > 0) {
      hash.update(chunk.subarray(0, bytesRead));
    }
    return hash.digest('hex');
  } finally {
    fs.closeSync(fd);
  }
}

function readAsarHeader(asarPath) {
  const fd = fs.openSync(asarPath, 'r');
  try {
    const sizeBuf = Buffer.alloc(16);
    const readBytes = fs.readSync(fd, sizeBuf, 0, 16, 0);
    if (readBytes < 16) {
      throw new Error(`Invalid ASAR file (too small): ${asarPath}`);
    }
    const headerSizeField = sizeBuf.readUInt32LE(4);
    const headerJsonLen = sizeBuf.readUInt32LE(12);
    const dataOffset = 8 + headerSizeField;
    if (headerJsonLen <= 0 || dataOffset < 16 + headerJsonLen) {
      throw new Error(`Corrupted ASAR header in: ${asarPath}`);
    }
    const headerBuf = Buffer.alloc(headerJsonLen);
    const jsonRead = fs.readSync(fd, headerBuf, 0, headerJsonLen, 16);
    if (jsonRead !== headerJsonLen) {
      throw new Error(`Truncated ASAR header in: ${asarPath}`);
    }
    const header = JSON.parse(headerBuf.toString('utf8'));
    return { header, dataOffset, headerJsonLen };
  } finally {
    fs.closeSync(fd);
  }
}

function walkHeader(node, prefix = '', out = []) {
  if (!node || !node.files) return out;
  for (const [name, entry] of Object.entries(node.files)) {
    const rel = prefix ? `${prefix}/${name}` : name;
    if (entry.files) {
      walkHeader(entry, rel, out);
    } else {
      out.push({
        path: rel,
        size: Number(entry.size || 0),
        offset: entry.offset !== undefined ? Number(entry.offset) : null,
        unpacked: Boolean(entry.unpacked),
        executable: Boolean(entry.executable),
        integrity: entry.integrity || null,
      });
    }
  }
  return out;
}

function getHeaderNode(header, relPath) {
  const parts = String(relPath).replace(/\\/g, '/').split('/').filter(Boolean);
  let cur = header;
  for (const part of parts) {
    if (!cur || !cur.files || !Object.prototype.hasOwnProperty.call(cur.files, part)) {
      return null;
    }
    cur = cur.files[part];
  }
  return cur;
}

function listAsarFiles(asarPath) {
  const { header } = readAsarHeader(asarPath);
  return walkHeader(header);
}

function readAsarFile(asarPath, relPath) {
  const { header, dataOffset } = readAsarHeader(asarPath);
  const node = getHeaderNode(header, relPath);
  if (!node || node.files) {
    throw new Error(`File not found in ASAR: ${relPath}`);
  }
  if (node.unpacked) {
    const unpackedFile = path.join(`${asarPath}.unpacked`, relPath);
    return fs.readFileSync(unpackedFile);
  }
  const size = Number(node.size || 0);
  const offset = Number(node.offset || 0);
  const buf = Buffer.alloc(size);
  if (size === 0) return buf;
  const fd = fs.openSync(asarPath, 'r');
  try {
    let total = 0;
    while (total < size) {
      const n = fs.readSync(fd, buf, total, size - total, dataOffset + offset + total);
      if (n <= 0) break;
      total += n;
    }
    if (total !== size) {
      throw new Error(`Short read from ASAR for ${relPath}: got ${total}/${size}`);
    }
    return buf;
  } finally {
    fs.closeSync(fd);
  }
}

function extractAsarToDir(asarPath, outDir) {
  const { header, dataOffset } = readAsarHeader(asarPath);
  fs.mkdirSync(outDir, { recursive: true });
  const fd = fs.openSync(asarPath, 'r');
  const metaMap = new Map();
  try {
    const visit = (node, relPrefix) => {
      if (!node || !node.files) return;
      for (const [name, entry] of Object.entries(node.files)) {
        const rel = relPrefix ? `${relPrefix}/${name}` : name;
        const target = path.join(outDir, rel);
        if (entry.files) {
          fs.mkdirSync(target, { recursive: true });
          visit(entry, rel);
        } else if (entry.unpacked) {
          metaMap.set(rel, { unpacked: true, executable: Boolean(entry.executable) });
        } else {
          fs.mkdirSync(path.dirname(target), { recursive: true });
          const size = Number(entry.size || 0);
          const offset = Number(entry.offset || 0);
          const buf = Buffer.alloc(size);
          let total = 0;
          while (total < size) {
            const n = fs.readSync(fd, buf, total, size - total, dataOffset + offset + total);
            if (n <= 0) break;
            total += n;
          }
          fs.writeFileSync(target, buf);
          if (entry.executable && process.platform !== 'win32') {
            try { fs.chmodSync(target, 0o755); } catch {}
          }
          metaMap.set(rel, { unpacked: false, executable: Boolean(entry.executable) });
        }
      }
    };
    visit(header, '');
  } finally {
    fs.closeSync(fd);
  }
  return { header, metaMap };
}

/**
 * Rebuild an ASAR archive directly from an original ASAR + file replacements/additions map
 * without needing to extract thousands of untouched node_modules files to disk.
 * replacements: Map<relPathPosix, Buffer | null> (null removes file)
 */
function rebuildAsarWithOverlay(srcAsarPath, destAsarPath, overlayMap) {
  const { header: origHeader, dataOffset: origDataOffset } = readAsarHeader(srcAsarPath);
  const normalizedOverlay = new Map();
  for (const [k, v] of overlayMap.entries()) {
    const norm = String(k).replace(/\\/g, '/').replace(/^\/+/, '');
    normalizedOverlay.set(norm, v);
  }

  // Clone tree & inject new/modified entries
  function cloneTree(node, relPrefix = '') {
    const out = { files: {} };
    if (node && node.files) {
      for (const [name, entry] of Object.entries(node.files)) {
        const rel = relPrefix ? `${relPrefix}/${name}` : name;
        if (entry.files) {
          out.files[name] = cloneTree(entry, rel);
        } else {
          if (normalizedOverlay.has(rel)) {
            const rep = normalizedOverlay.get(rel);
            if (rep === null) continue; // deleted
            out.files[name] = {
              __source: 'overlay',
              buf: Buffer.isBuffer(rep) ? rep : Buffer.from(rep, 'utf8'),
              executable: Boolean(entry.executable),
            };
          } else if (entry.unpacked) {
            out.files[name] = {
              unpacked: true,
              size: Number(entry.size || 0),
              ...(entry.executable ? { executable: true } : {}),
              ...(entry.integrity ? { integrity: entry.integrity } : {}),
            };
          } else {
            out.files[name] = {
              __source: 'orig',
              origOffset: Number(entry.offset || 0),
              size: Number(entry.size || 0),
              executable: Boolean(entry.executable),
            };
          }
        }
      }
    }
    return out;
  }

  const newTree = cloneTree(origHeader, '');

  // Insert brand-new files from overlayMap that didn't exist in origHeader
  for (const [rel, val] of normalizedOverlay.entries()) {
    if (val === null) continue;
    const parts = rel.split('/').filter(Boolean);
    let cur = newTree;
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i];
      if (!cur.files[seg] || !cur.files[seg].files) {
        cur.files[seg] = { files: {} };
      }
      cur = cur.files[seg];
    }
    const leaf = parts[parts.length - 1];
    if (!cur.files[leaf] || cur.files[leaf].__source !== 'overlay') {
      cur.files[leaf] = {
        __source: 'overlay',
        buf: Buffer.isBuffer(val) ? val : Buffer.from(val, 'utf8'),
        executable: false,
      };
    }
  }

  // Assign sequential offsets and build clean header JSON
  let cursorOffset = 0;
  const writePlan = [];
  function finalizeHeader(node) {
    const clean = { files: {} };
    const keys = Object.keys(node.files).sort();
    for (const k of keys) {
      const entry = node.files[k];
      if (entry.files) {
        clean.files[k] = finalizeHeader(entry);
      } else if (entry.unpacked) {
        clean.files[k] = entry;
      } else {
        const size = entry.__source === 'overlay' ? entry.buf.length : entry.size;
        const offsetStr = String(cursorOffset);
        cursorOffset += size;
        writePlan.push({ ...entry, size });
        clean.files[k] = {
          size,
          offset: offsetStr,
          ...(entry.executable ? { executable: true } : {}),
        };
      }
    }
    return clean;
  }

  const finalHeader = finalizeHeader(newTree);
  const headerStr = JSON.stringify(finalHeader);
  const headerStrBuf = Buffer.from(headerStr, 'utf8');
  const paddedJsonLen = align4(headerStrBuf.length);
  const paddingBytes = paddedJsonLen - headerStrBuf.length;

  // Chromium Pickle framing for ASAR header:
  // uint32(4), uint32(4 + 4 + paddedJsonLen), uint32(paddedJsonLen), uint32(headerStrBuf.length), headerBytes, zeroPad
  const headerTotal = 16 + paddedJsonLen;
  const headerBuf = Buffer.alloc(headerTotal, 0);
  headerBuf.writeUInt32LE(4, 0);
  headerBuf.writeUInt32LE(8 + paddedJsonLen, 4);
  headerBuf.writeUInt32LE(4 + paddedJsonLen, 8);
  headerBuf.writeUInt32LE(headerStrBuf.length, 12);
  headerStrBuf.copy(headerBuf, 16);

  fs.mkdirSync(path.dirname(destAsarPath), { recursive: true });
  const tmpOut = `${destAsarPath}.tmp-${process.pid}-${Date.now()}`;
  const outFd = fs.openSync(tmpOut, 'w');
  const srcFd = fs.openSync(srcAsarPath, 'r');
  try {
    fs.writeSync(outFd, headerBuf, 0, headerBuf.length, null);
    const copyBuf = Buffer.alloc(1024 * 512);
    for (const item of writePlan) {
      if (item.__source === 'overlay') {
        if (item.buf.length > 0) {
          fs.writeSync(outFd, item.buf, 0, item.buf.length, null);
        }
      } else if (item.size > 0) {
        let remaining = item.size;
        let readPos = origDataOffset + item.origOffset;
        while (remaining > 0) {
          const toRead = Math.min(remaining, copyBuf.length);
          const n = fs.readSync(srcFd, copyBuf, 0, toRead, readPos);
          if (n <= 0) throw new Error('Unexpected EOF reading original ASAR payload');
          fs.writeSync(outFd, copyBuf, 0, n, null);
          remaining -= n;
          readPos += n;
        }
      }
    }
  } finally {
    fs.closeSync(srcFd);
    fs.closeSync(outFd);
  }

  // Atomic swap
  try {
    fs.renameSync(tmpOut, destAsarPath);
  } catch (err) {
    fs.copyFileSync(tmpOut, destAsarPath);
    try { fs.unlinkSync(tmpOut); } catch {}
  }

  return {
    destAsarPath,
    headerBytes: headerTotal,
    payloadBytes: cursorOffset,
    sha256: sha256File(destAsarPath),
  };
}

/**
 * Pack a directory tree into an ASAR archive (useful for tests and standalone builds).
 */
function packDirectoryToAsar(srcDir, destAsarPath) {
  const writePlan = [];
  let cursorOffset = 0;

  function buildDir(dir) {
    const clean = { files: {} };
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        clean.files[ent.name] = buildDir(full);
      } else if (ent.isFile()) {
        const stat = fs.statSync(full);
        const offsetStr = String(cursorOffset);
        cursorOffset += stat.size;
        writePlan.push({ full, size: stat.size });
        clean.files[ent.name] = { size: stat.size, offset: offsetStr };
      }
    }
    return clean;
  }

  const headerObj = buildDir(srcDir);
  const headerStrBuf = Buffer.from(JSON.stringify(headerObj), 'utf8');
  const paddedJsonLen = align4(headerStrBuf.length);
  const headerBuf = Buffer.alloc(16 + paddedJsonLen, 0);
  headerBuf.writeUInt32LE(4, 0);
  headerBuf.writeUInt32LE(8 + paddedJsonLen, 4);
  headerBuf.writeUInt32LE(4 + paddedJsonLen, 8);
  headerBuf.writeUInt32LE(headerStrBuf.length, 12);
  headerStrBuf.copy(headerBuf, 16);

  fs.mkdirSync(path.dirname(destAsarPath), { recursive: true });
  const fd = fs.openSync(destAsarPath, 'w');
  try {
    fs.writeSync(fd, headerBuf, 0, headerBuf.length, null);
    for (const item of writePlan) {
      if (item.size > 0) {
        const data = fs.readFileSync(item.full);
        fs.writeSync(fd, data, 0, data.length, null);
      }
    }
  } finally {
    fs.closeSync(fd);
  }
  return { destAsarPath, payloadBytes: cursorOffset };
}

module.exports = {
  readAsarHeader,
  listAsarFiles,
  readAsarFile,
  extractAsarToDir,
  rebuildAsarWithOverlay,
  packDirectoryToAsar,
  sha256Buffer,
  sha256File,
};
