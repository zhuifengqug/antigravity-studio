'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { fileURLToPath } = require('url');

const INLINE_DIFF_MAX_URI_LENGTH = 2048;
const INLINE_DIFF_DEFAULT_MAX_LINES = 400;
const INLINE_DIFF_DEFAULT_MAX_LINE_CHARS = 400;
const INLINE_DIFF_DEFAULT_TIMEOUT_MS = 4000;
const INLINE_DIFF_MAX_READ_BYTES = 64 * 1024;
const INLINE_DIFF_GIT_MAX_BUFFER = 1024 * 1024;
const INLINE_DIFF_MAX_GIT_POINTER_BYTES = 4096;
const INLINE_DIFF_CACHE_TTL_MS = 4000;
const INLINE_DIFF_CACHE_MAX = 64;
const INLINE_DIFF_MAX_CONCURRENCY = 3;
const INLINE_DIFF_MAX_QUEUE = 24;

const SENSITIVE_BASENAMES = new Set([
  'accounts_v1.json',
  'pricing_ledger_v1.json',
  'token_usage_archive_v2.json',
  'config.json',
  'model-hub.config.json',
  'secrets.json',
  'credentials.json',
  'auth.json',
  'token.json',
  'mcp_config.json',
  'transcript.jsonl',
  'transcript_full.jsonl',
  'state.vscdb',
  '.claude.json',
  'keys.txt',
  '.npmrc',
  '.pypirc',
  '.git-credentials',
  '.netrc',
  '.envrc',
  '.pgpass',
  'kubeconfig',
  'cookies',
  'cookies-journal',
  'login data',
  'login data-journal',
  'local state',
  'web data',
  'obsidian-prism-sidebar.json',
  'consolehost_history.txt',
  'hosts.yml',
  'logins.json',
  'key4.db',
]);

const SENSITIVE_EXTENSIONS = new Set([
  '.env',
  '.pem',
  '.key',
  '.p12',
  '.pfx',
  '.kdbx',
  '.jks',
  '.keystore',
  '.ppk',
  '.ovpn',
  '.vscdb',
  '.sqlite',
  '.sqlite3',
  '.db',
]);

const SENSITIVE_DIRECTORIES = new Set([
  '.ssh',
  '.aws',
  '.gnupg',
  '.kube',
  '.gemini',
  '.azure',
  '.claude',
  '.codex',
  'antigravitystudio',
  'antigravitycontextmeter',
]);

const SENSITIVE_SSH_KEYS = new Set([
  'id_rsa',
  'id_ed25519',
  'id_ecdsa',
  'id_dsa',
  'id_ed25519_sk',
  'id_ecdsa_sk',
]);

const SENSITIVE_SYS_PREFIX_RE = /^(?:\/(?:proc|sys|dev|etc)(?:\/|$)|(?:[a-z]:)?\/(?:windows|program files(?: \(x86\))?|programdata)(?:\/|$))/;
const SENSITIVE_SUBPATH_RE = /(?:^|\/)(?:\.config\/(?:gcloud|gh)|appdata\/roaming|appdata\/local\/google|appdata\/local\/antigravitystudio|library\/application support\/google|library\/keychains)(?:\/|$)/;
const SENSITIVE_SYS_SUFFIXES = [
  '/etc/shadow',
  '/etc/gshadow',
  '/etc/master.passwd',
  '/etc/sudoers',
  '/windows/system32/config/sam',
  '/windows/system32/config/system',
  '/windows/system32/config/security',
];

const inlineDiffCache = new Map();
const inlineDiffInFlight = new Map();
const inlineDiffWaitQueue = [];
let inlineDiffActiveCount = 0;

function clampPositiveInt(value, fallback, maxAllowed) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(maxAllowed, Math.floor(n));
}

function hasControlOrNulChars(raw) {
  return typeof raw !== 'string' || /[\x00-\x1f\x7f]/.test(raw) || /%00/i.test(raw);
}

function hasDotDotPathSegment(rawPath) {
  if (typeof rawPath !== 'string') return true;
  const parts = rawPath.split(/[\\/]+/);
  return parts.some((seg) => seg === '..');
}

function hasBlockedInlineDiffUnc(rawInput) {
  if (typeof rawInput !== 'string' || !rawInput) return false;
  let s = rawInput.trim();
  if (!s) return false;
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  if (/^file:\/\//i.test(s)) {
    const afterScheme = s.slice(7);
    if (!afterScheme.startsWith('/')) {
      return true;
    }
    try {
      s = decodeURIComponent(afterScheme);
    } catch {
      return true;
    }
    if (/^\/[\\/]{1}/.test(s)) return true;
    if (s.startsWith('/') && hasBlockedInlineDiffUnc(s.slice(1))) return true;
  }
  if (/^[\\/]{2}/.test(s)) return true;
  if (/^[\\/](?:[?.]+[\\/])+/.test(s)) return true;
  if (/^[\\/]globalroot[\\/]/i.test(s)) return true;
  if (
    /^[\\/](?:global(?:root)?[\\/]+)*(?:unc|device[\\/]+(?:mup|lanmanredirector|webdavredirector|hgfs|vmhgfs|vboxsvr))(?:[\\/]|$)/i.test(
      s
    )
  ) {
    return true;
  }
  return false;
}

function isSensitiveInlineDiffPath(filePath) {
  if (typeof filePath !== 'string' || !filePath.trim()) return true;
  if (hasControlOrNulChars(filePath)) return true;
  let normalized = filePath.trim().replace(/\\/g, '/');
  while (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  if (!normalized) return true;

  const lower = normalized.toLowerCase();
  const base = path.posix.basename(lower);
  if (!base) return true;

  const cleanBase = base.replace(/[. ]+$/, '');
  const basesToCheck = cleanBase && cleanBase !== base ? [base, cleanBase] : [base];
  for (const b of basesToCheck) {
    if (b === '.env' || b.startsWith('.env.') || b.startsWith('.env')) return true;
    if (b.endsWith('_history')) return true;
    if (/^obsidian-prism-thought.*\.json(?:\.tmp)?$/.test(b)) return true;
    if (SENSITIVE_BASENAMES.has(b)) return true;
    if (SENSITIVE_SSH_KEYS.has(b)) return true;
    if (/^id_(?:rsa|ed25519|ecdsa|dsa)(?:_sk)?(?:\.pem|\.key)?$/.test(b)) return true;
    const ext = path.posix.extname(b);
    if (ext && SENSITIVE_EXTENSIONS.has(ext)) return true;
  }

  const cleanLower = lower.replace(/[. ]+$/, '');
  if (
    SENSITIVE_SYS_PREFIX_RE.test(lower) ||
    SENSITIVE_SYS_PREFIX_RE.test(cleanLower) ||
    SENSITIVE_SUBPATH_RE.test(lower) ||
    SENSITIVE_SUBPATH_RE.test(cleanLower)
  ) {
    return true;
  }

  const segs = lower.split('/').filter(Boolean);
  for (let i = 0; i < segs.length; i += 1) {
    const seg = segs[i];
    if (SENSITIVE_DIRECTORIES.has(seg)) return true;
    if (i < segs.length - 1 && seg === '.git') return true;
    if (seg === 'thought-translator' && basesToCheck.some((b) => b.endsWith('.json'))) return true;
  }

  for (const suffix of SENSITIVE_SYS_SUFFIXES) {
    if (lower === suffix || lower.endsWith(suffix) || cleanLower === suffix || cleanLower.endsWith(suffix)) {
      return true;
    }
  }
  return false;
}

function normalizeComparablePath(p) {
  let norm = path.normalize(String(p || ''));
  if (norm.length > 1 && (norm.endsWith(path.sep) || norm.endsWith('/'))) {
    norm = norm.slice(0, -1);
  }
  return process.platform === 'win32' ? norm.toLowerCase() : norm;
}

function isSameCanonicalPath(candidatePath, realPath, allowDarwinSystemRootAlias) {
  const a = normalizeComparablePath(candidatePath);
  const b = normalizeComparablePath(realPath);
  if (a === b) return true;
  if (allowDarwinSystemRootAlias && process.platform === 'darwin') {
    if ((a.startsWith('/var/') && `/private${a}` === b) || (a.startsWith('/tmp/') && `/private${a}` === b)) {
      return true;
    }
  }
  return false;
}

function isPathWithinRoot(rootPath, candidatePath, allowEqual) {
  const rel = path.relative(rootPath, candidatePath);
  if (rel === '') return Boolean(allowEqual);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

function canonicalRealpathSync(targetPath) {
  if (typeof fs.realpathSync.native === 'function') {
    try {
      return fs.realpathSync.native(targetPath);
    } catch (err) {
      if (err && (err.code === 'ENOENT' || err.code === 'ENOTDIR' || err.code === 'EACCES' || err.code === 'EPERM')) {
        throw err;
      }
    }
  }
  return fs.realpathSync(targetPath);
}

function resolveWorkspaceRoot(rawWorkspace) {
  if (typeof rawWorkspace !== 'string') return { ok: false, error: 'invalid_workspace' };
  const raw = rawWorkspace.trim();
  if (!raw || raw.length > INLINE_DIFF_MAX_URI_LENGTH) {
    return { ok: false, error: 'invalid_workspace' };
  }
  if (hasControlOrNulChars(raw)) {
    return { ok: false, error: 'invalid_workspace' };
  }
  if (hasBlockedInlineDiffUnc(raw)) {
    return { ok: false, error: 'blocked_unc' };
  }

  let candidate = '';
  if (/^file:/i.test(raw)) {
    if (!/^file:\/\//i.test(raw)) return { ok: false, error: 'invalid_workspace' };
    const rawPathPart = raw.slice(7).split(/[?#]/, 1)[0];
    if (!rawPathPart.startsWith('/')) return { ok: false, error: 'blocked_unc' };
    if (hasDotDotPathSegment(rawPathPart)) return { ok: false, error: 'blocked_traversal' };
    let decoded;
    try {
      decoded = decodeURIComponent(rawPathPart);
    } catch {
      return { ok: false, error: 'invalid_workspace' };
    }
    if (!decoded || hasControlOrNulChars(decoded) || hasDotDotPathSegment(decoded)) {
      return { ok: false, error: 'blocked_traversal' };
    }
    if (hasBlockedInlineDiffUnc(decoded) || (decoded.startsWith('/') && hasBlockedInlineDiffUnc(decoded.slice(1)))) {
      return { ok: false, error: 'blocked_unc' };
    }
    let parsedUrl;
    try {
      parsedUrl = new URL(raw);
    } catch {
      return { ok: false, error: 'invalid_workspace' };
    }
    if (parsedUrl.protocol !== 'file:' || parsedUrl.hostname) {
      return { ok: false, error: 'blocked_unc' };
    }
    if (/^\/[A-Za-z]:[\\/]/.test(decoded)) {
      candidate = process.platform === 'win32' ? path.resolve(decoded.slice(1)) : decoded;
    } else if (decoded.startsWith('/')) {
      candidate = process.platform === 'win32' ? decoded : path.resolve(decoded);
    } else {
      return { ok: false, error: 'invalid_workspace' };
    }
  } else {
    if (hasDotDotPathSegment(raw)) return { ok: false, error: 'blocked_traversal' };
    const isWinDriveAbs = /^[A-Za-z]:[\\/]/.test(raw);
    if (!isWinDriveAbs && /^[A-Za-z][A-Za-z0-9+.-]*:/.test(raw)) {
      return { ok: false, error: 'invalid_workspace' };
    }
    if (!isWinDriveAbs && !raw.startsWith('/')) {
      return { ok: false, error: 'invalid_workspace' };
    }
    candidate = path.resolve(raw);
  }

  if (hasBlockedInlineDiffUnc(candidate)) {
    return { ok: false, error: 'blocked_unc' };
  }
  if (process.platform === 'win32' && (!/^[A-Za-z]:[\\/]/.test(candidate) || candidate.slice(2).includes(':'))) {
    return { ok: false, error: 'invalid_workspace' };
  }
  return { ok: true, workspaceRoot: candidate };
}

function resolveInlineDiffCandidatePath(rawInput, optsOrWorkspace) {
  let rawUri = rawInput;
  let opts = {};
  if (rawInput && typeof rawInput === 'object') {
    rawUri = rawInput.filePath || rawInput.uri || rawInput.path || '';
    opts = rawInput;
  } else if (typeof optsOrWorkspace === 'string') {
    opts = { workspaceRoot: optsOrWorkspace };
  } else if (optsOrWorkspace && typeof optsOrWorkspace === 'object') {
    opts = optsOrWorkspace;
  }

  if (typeof rawUri !== 'string') {
    return { ok: false, error: 'invalid_uri' };
  }
  const raw = rawUri.trim();
  if (!raw || raw.length > INLINE_DIFF_MAX_URI_LENGTH) {
    return { ok: false, error: 'invalid_uri' };
  }
  if (hasControlOrNulChars(raw)) {
    return { ok: false, error: 'invalid_uri' };
  }
  if (hasBlockedInlineDiffUnc(raw)) {
    return { ok: false, error: 'blocked_unc' };
  }

  let candidatePath = '';
  let resolvedWs = '';
  if (/^file:/i.test(raw)) {
    if (!/^file:\/\//i.test(raw)) {
      return { ok: false, error: 'invalid_uri' };
    }
    const afterScheme = raw.slice(7);
    const rawPathPart = afterScheme.split(/[?#]/, 1)[0];
    if (!rawPathPart.startsWith('/')) {
      return { ok: false, error: 'blocked_unc' };
    }
    if (hasDotDotPathSegment(rawPathPart)) {
      return { ok: false, error: 'blocked_traversal' };
    }
    let decodedPart;
    try {
      decodedPart = decodeURIComponent(rawPathPart);
    } catch {
      return { ok: false, error: 'invalid_uri' };
    }
    if (!decodedPart || hasControlOrNulChars(decodedPart)) {
      return { ok: false, error: 'invalid_uri' };
    }
    if (
      hasBlockedInlineDiffUnc(decodedPart) ||
      (decodedPart.startsWith('/') && hasBlockedInlineDiffUnc(decodedPart.slice(1)))
    ) {
      return { ok: false, error: 'blocked_unc' };
    }
    if (hasDotDotPathSegment(decodedPart)) {
      return { ok: false, error: 'blocked_traversal' };
    }
    let parsedUrl;
    try {
      parsedUrl = new URL(raw);
    } catch {
      return { ok: false, error: 'invalid_uri' };
    }
    if (parsedUrl.protocol !== 'file:') {
      return { ok: false, error: 'invalid_uri' };
    }
    if (parsedUrl.hostname) {
      return { ok: false, error: 'blocked_unc' };
    }
    if (/^\/[A-Za-z]:[\\/]/.test(decodedPart)) {
      candidatePath = process.platform === 'win32' ? path.resolve(decodedPart.slice(1)) : decodedPart;
    } else if (decodedPart.startsWith('/')) {
      try {
        candidatePath = process.platform === 'win32' ? fileURLToPath(parsedUrl) : decodedPart;
      } catch {
        candidatePath = decodedPart;
      }
    } else {
      return { ok: false, error: 'invalid_uri' };
    }
  } else {
    const isWinDriveAbs = /^[A-Za-z]:[\\/]/.test(raw);
    if (!isWinDriveAbs && /^[A-Za-z][A-Za-z0-9+.-]*:/.test(raw)) {
      return { ok: false, error: 'invalid_uri' };
    }
    if (hasDotDotPathSegment(raw)) {
      return { ok: false, error: 'blocked_traversal' };
    }
    if (isWinDriveAbs || raw.startsWith('/')) {
      candidatePath = isWinDriveAbs && process.platform === 'win32' ? path.resolve(raw) : path.resolve(raw);
    } else {
      const wsInput = opts.workspaceRoot || opts.workspaceHint || '';
      if (!wsInput) {
        return { ok: false, error: 'invalid_uri' };
      }
      const wsCheck = resolveWorkspaceRoot(wsInput);
      if (!wsCheck.ok) {
        return { ok: false, error: wsCheck.error };
      }
      resolvedWs = wsCheck.workspaceRoot;
      const joined = path.resolve(resolvedWs, raw);
      if (!isPathWithinRoot(resolvedWs, joined, false)) {
        return { ok: false, error: 'blocked_traversal' };
      }
      candidatePath = joined;
    }
  }

  if (hasBlockedInlineDiffUnc(candidatePath)) {
    return { ok: false, error: 'blocked_unc' };
  }
  if (process.platform === 'win32') {
    if (!/^[A-Za-z]:[\\/]/.test(candidatePath) || candidatePath.slice(2).includes(':')) {
      return { ok: false, error: 'invalid_uri' };
    }
  } else if (!candidatePath.startsWith('/')) {
    return { ok: false, error: 'invalid_uri' };
  }

  if (isSensitiveInlineDiffPath(candidatePath)) {
    return { ok: false, error: 'blocked_sensitive' };
  }

  return {
    ok: true,
    candidatePath,
    workspaceRoot: resolvedWs || undefined,
  };
}

function readSmallNoFollowFileSync(filePath, maxBytes) {
  let fd = null;
  try {
    const openFlags =
      process.platform !== 'win32' && typeof fs.constants?.O_NOFOLLOW === 'number'
        ? fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW
        : 'r';
    fd = fs.openSync(filePath, openFlags);
    const fdStat = fs.fstatSync(fd);
    if (!fdStat.isFile() || fdStat.size > maxBytes) return null;
    const postStat = fs.lstatSync(filePath);
    if (postStat.isSymbolicLink() || !postStat.isFile()) return null;
    if (process.platform !== 'win32' && (fdStat.ino !== postStat.ino || fdStat.dev !== postStat.dev)) {
      return null;
    }
    const buf = Buffer.alloc(fdStat.size);
    let offset = 0;
    while (offset < fdStat.size) {
      const n = fs.readSync(fd, buf, offset, fdStat.size - offset, offset);
      if (n <= 0) break;
      offset += n;
    }
    return buf.subarray(0, offset).toString('utf8');
  } catch {
    return null;
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch {}
    }
  }
}

function resolveValidatedCommonGitDir(realGitDir) {
  const commonPtrPath = path.join(realGitDir, 'commondir');
  let st;
  try {
    st = fs.lstatSync(commonPtrPath);
  } catch (err) {
    if (err && err.code === 'ENOENT') return realGitDir;
    return null;
  }
  if (st.isSymbolicLink() || !st.isFile() || st.size <= 0 || st.size > INLINE_DIFF_MAX_GIT_POINTER_BYTES) {
    return null;
  }
  const rawCommon = readSmallNoFollowFileSync(commonPtrPath, INLINE_DIFF_MAX_GIT_POINTER_BYTES);
  if (typeof rawCommon !== 'string') return null;
  const trimmed = rawCommon.trim();
  if (!trimmed || hasControlOrNulChars(trimmed) || hasBlockedInlineDiffUnc(trimmed)) return null;
  const commonPath = path.resolve(realGitDir, trimmed);
  if (hasBlockedInlineDiffUnc(commonPath)) return null;
  try {
    const cst = fs.lstatSync(commonPath);
    if (cst.isSymbolicLink() || !cst.isDirectory()) return null;
    const realCommon = canonicalRealpathSync(commonPath);
    if (hasBlockedInlineDiffUnc(realCommon)) return null;
    const rcst = fs.lstatSync(realCommon);
    if (rcst.isSymbolicLink() || !rcst.isDirectory()) return null;
    if (!isSameCanonicalPath(commonPath, realCommon, path.isAbsolute(trimmed))) return null;
    return realCommon;
  } catch {
    return null;
  }
}

function validateGitMarkerAtDir(dirPath) {
  let realCur;
  try {
    realCur = canonicalRealpathSync(dirPath);
  } catch {
    return { ok: false, error: 'outside_git_repo' };
  }
  if (hasBlockedInlineDiffUnc(realCur)) return { ok: false, error: 'blocked_unc' };

  const gitMarker = path.join(realCur, '.git');
  let gst;
  try {
    gst = fs.lstatSync(gitMarker);
  } catch {
    return { ok: false, error: 'outside_git_repo' };
  }

  if (gst.isSymbolicLink()) {
    return { ok: false, error: 'invalid_git_dir' };
  }

  if (gst.isDirectory()) {
    try {
      const realGitDir = canonicalRealpathSync(gitMarker);
      const rgst = fs.lstatSync(realGitDir);
      if (rgst.isSymbolicLink() || !rgst.isDirectory()) return { ok: false, error: 'invalid_git_dir' };
      if (hasBlockedInlineDiffUnc(realGitDir)) return { ok: false, error: 'blocked_unc' };
      if (!isSameCanonicalPath(path.join(realCur, '.git'), realGitDir, false)) {
        return { ok: false, error: 'invalid_git_dir' };
      }
      const commonGitDir = resolveValidatedCommonGitDir(realGitDir);
      if (!commonGitDir) return { ok: false, error: 'invalid_git_dir' };
      return { ok: true, root: realCur, gitDir: realGitDir, commonGitDir };
    } catch {
      return { ok: false, error: 'invalid_git_dir' };
    }
  }

  if (gst.isFile()) {
    if (gst.size <= 0 || gst.size > INLINE_DIFF_MAX_GIT_POINTER_BYTES) {
      return { ok: false, error: 'invalid_git_dir' };
    }
    const gitPtrRaw = readSmallNoFollowFileSync(gitMarker, INLINE_DIFF_MAX_GIT_POINTER_BYTES);
    if (typeof gitPtrRaw !== 'string') return { ok: false, error: 'invalid_git_dir' };
    const gitPtr = gitPtrRaw.trim();
    const m = /^gitdir:\s*([^\r\n]+)$/i.exec(gitPtr);
    if (!m || !m[1]) return { ok: false, error: 'invalid_git_dir' };
    const rawPtr = m[1].trim();
    if (!rawPtr || hasControlOrNulChars(rawPtr) || hasBlockedInlineDiffUnc(rawPtr)) {
      return { ok: false, error: 'invalid_git_dir' };
    }
    if (process.platform === 'win32' && path.isAbsolute(rawPtr) && !/^[A-Za-z]:[\\/]/.test(rawPtr)) {
      return { ok: false, error: 'invalid_git_dir' };
    }
    const gitDirPath = path.resolve(realCur, rawPtr);
    if (hasBlockedInlineDiffUnc(gitDirPath)) return { ok: false, error: 'blocked_unc' };
    try {
      const gdLstat = fs.lstatSync(gitDirPath);
      if (gdLstat.isSymbolicLink() || !gdLstat.isDirectory()) return { ok: false, error: 'invalid_git_dir' };
      const realGitDir = canonicalRealpathSync(gitDirPath);
      if (hasBlockedInlineDiffUnc(realGitDir)) return { ok: false, error: 'blocked_unc' };
      const rgst = fs.lstatSync(realGitDir);
      if (rgst.isSymbolicLink() || !rgst.isDirectory()) return { ok: false, error: 'invalid_git_dir' };
      if (!isSameCanonicalPath(gitDirPath, realGitDir, path.isAbsolute(rawPtr))) {
        return { ok: false, error: 'invalid_git_dir' };
      }
      const commonGitDir = resolveValidatedCommonGitDir(realGitDir);
      if (!commonGitDir) return { ok: false, error: 'invalid_git_dir' };
      return { ok: true, root: realCur, gitDir: realGitDir, commonGitDir };
    } catch {
      return { ok: false, error: 'invalid_git_dir' };
    }
  }

  return { ok: false, error: 'invalid_git_dir' };
}

function findNearestGitMarker(startDir) {
  let cur = startDir;
  for (let depth = 0; depth < 32 && cur; depth += 1) {
    const gitMarker = path.join(cur, '.git');
    try {
      fs.lstatSync(gitMarker);
      return validateGitMarkerAtDir(cur);
    } catch (err) {
      if (err && (err.code === 'ENOENT' || err.code === 'ENOTDIR')) {
        const parent = path.dirname(cur);
        if (!parent || parent === cur) break;
        cur = parent;
        continue;
      }
      return { ok: false, error: 'outside_git_repo' };
    }
  }
  return { ok: false, error: 'outside_git_repo' };
}

function execGitSafe(args, cwd, timeoutMs = INLINE_DIFF_DEFAULT_TIMEOUT_MS) {
  const fullArgs = [
    '--no-optional-locks',
    '--literal-pathspecs',
    '-c',
    'core.quotepath=false',
    '-c',
    'diff.external=',
    '-c',
    'filter.lfs.clean=',
    '-c',
    'filter.lfs.smudge=',
    '-c',
    'protocol.ext.allow=never',
    '-c',
    'submodule.recurse=false',
    '-c',
    'core.fsmonitor=false',
    ...args,
  ];
  return new Promise((resolve) => {
    execFile(
      'git',
      fullArgs,
      {
        cwd,
        encoding: 'utf8',
        windowsHide: true,
        timeout: timeoutMs,
        maxBuffer: INLINE_DIFF_GIT_MAX_BUFFER,
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: '0',
          GIT_LITERAL_PATHSPECS: '1',
          GIT_OPTIONAL_LOCKS: '0',
          NoDefaultCurrentDirectoryInExePath: '1',
        },
      },
      (err, stdout, stderr) => {
        resolve({
          ok: !err,
          code: err ? err.code || err.status || 'GIT_ERROR' : null,
          stdout: typeof stdout === 'string' ? stdout : '',
          stderr: typeof stderr === 'string' ? stderr : '',
        });
      }
    );
  });
}

function truncateLineText(text, maxLineChars) {
  const s = String(text ?? '');
  if (s.length <= maxLineChars) return s;
  return `${s.slice(0, Math.max(0, maxLineChars - 1))}…`;
}

function unescapeGitQuotedPath(rawToken) {
  if (typeof rawToken !== 'string') return '';
  let s = rawToken.trim();
  if (!s) return '';
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1);
    const bytes = [];
    for (let i = 0; i < s.length; i += 1) {
      const ch = s[i];
      if (ch === '\\' && i + 1 < s.length) {
        const next = s[i + 1];
        if (next >= '0' && next <= '7') {
          let oct = next;
          if (i + 2 < s.length && s[i + 2] >= '0' && s[i + 2] <= '7') {
            oct += s[i + 2];
            if (i + 3 < s.length && s[i + 3] >= '0' && s[i + 3] <= '7') {
              oct += s[i + 3];
            }
          }
          bytes.push(parseInt(oct, 8) & 0xff);
          i += oct.length;
          continue;
        }
        const escMap = { n: 0x0a, r: 0x0d, t: 0x09, b: 0x08, f: 0x0c, a: 0x07, v: 0x0b, '"': 0x22, '\\': 0x5c };
        if (Object.prototype.hasOwnProperty.call(escMap, next)) {
          bytes.push(escMap[next]);
        } else {
          const encoded = Buffer.from(next, 'utf8');
          for (const b of encoded) bytes.push(b);
        }
        i += 1;
      } else {
        const encoded = Buffer.from(ch, 'utf8');
        for (const b of encoded) bytes.push(b);
      }
    }
    return Buffer.from(bytes).toString('utf8');
  }
  return s;
}

function stripGitDiffPrefix(p) {
  const s = unescapeGitQuotedPath(p);
  if (!s || s === '/dev/null') return '';
  return s.replace(/^(?:a|b|i|w|c|o|1|2)\//, '');
}

function parseDiffGitHeaderPaths(line) {
  const rest = line.slice('diff --git '.length).trim();
  if (!rest) return null;
  const candidates = [];
  const tokens = [];
  let idx = 0;
  while (idx < rest.length && tokens.length < 3) {
    while (idx < rest.length && rest[idx] === ' ') idx += 1;
    if (idx >= rest.length) break;
    if (rest[idx] === '"') {
      let end = idx + 1;
      while (end < rest.length) {
        if (rest[end] === '\\' && end + 1 < rest.length) {
          end += 2;
          continue;
        }
        if (rest[end] === '"') {
          end += 1;
          break;
        }
        end += 1;
      }
      tokens.push(rest.slice(idx, end));
      idx = end;
    } else {
      let end = idx;
      while (end < rest.length && rest[end] !== ' ') end += 1;
      tokens.push(rest.slice(idx, end));
      idx = end;
    }
  }
  if (tokens.length === 2 && idx >= rest.length) {
    const p1 = stripGitDiffPrefix(tokens[0]);
    const p2 = stripGitDiffPrefix(tokens[1]);
    if (p1) candidates.push(p1);
    if (p2) candidates.push(p2);
  }
  let splitPos = rest.indexOf(' b/');
  while (splitPos !== -1) {
    const left = stripGitDiffPrefix(rest.slice(0, splitPos));
    const right = stripGitDiffPrefix(rest.slice(splitPos + 1));
    if (left) candidates.push(left);
    if (right) candidates.push(right);
    splitPos = rest.indexOf(' b/', splitPos + 3);
  }
  return candidates.length > 0 ? candidates : null;
}

function isBlockedDiffHeaderPath(relPath) {
  if (typeof relPath !== 'string' || !relPath) return true;
  if (hasControlOrNulChars(relPath)) return true;
  if (hasBlockedInlineDiffUnc(relPath) || hasDotDotPathSegment(relPath)) return true;
  if (isSensitiveInlineDiffPath(relPath)) return true;
  return false;
}

function parseUnifiedDiff(rawDiff, opts = {}) {
  const maxLines = clampPositiveInt(opts.maxLines, INLINE_DIFF_DEFAULT_MAX_LINES, 5000);
  const maxLineChars = clampPositiveInt(opts.maxLineChars, INLINE_DIFF_DEFAULT_MAX_LINE_CHARS, 5000);
  const repoRoot = typeof opts.repoRoot === 'string' ? opts.repoRoot : '';
  let relPath = typeof opts.relPath === 'string' ? opts.relPath : '';
  let status = typeof opts.status === 'string' ? opts.status : '';

  const normalized = String(rawDiff || '').replace(/\r\n/g, '\n');
  const rawLines = normalized.split('\n');
  if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') {
    rawLines.pop();
  }

  const hunks = [];
  let curHunk = null;
  let additions = 0;
  let deletions = 0;
  let binary = false;
  let truncated = Boolean(opts.bufferTruncated);
  let emittedRows = 0;
  let seenDiffHeaders = 0;
  let inHunk = false;
  let oldLn = 1;
  let newLn = 1;
  let inferredStatus = '';

  for (let i = 0; i < rawLines.length; i += 1) {
    const line = rawLines[i];
    if (line.startsWith('diff --git ')) {
      if (seenDiffHeaders >= 1) {
        truncated = true;
        break;
      }
      seenDiffHeaders += 1;
      inHunk = false;
      curHunk = null;
      const headerPaths = parseDiffGitHeaderPaths(line);
      if (!headerPaths || headerPaths.some((p) => isBlockedDiffHeaderPath(p))) {
        return {
          ok: false,
          error: 'blocked_sensitive',
          relPath,
          repoRoot,
          status: 'blocked',
          additions: 0,
          deletions: 0,
          truncated: false,
          binary: false,
          hunks: [],
        };
      }
      if (!relPath && headerPaths.length > 0) {
        relPath = headerPaths[headerPaths.length - 1];
      }
      continue;
    }

    if (!inHunk) {
      if (line.startsWith('new file mode ')) {
        inferredStatus = 'added';
        continue;
      }
      if (line.startsWith('deleted file mode ')) {
        inferredStatus = 'deleted';
        continue;
      }
      if (line.startsWith('rename from ') || line.startsWith('rename to ')) {
        inferredStatus = 'renamed';
        const p = unescapeGitQuotedPath(line.slice(line.indexOf(' ', 7) + 1));
        if (!p || isBlockedDiffHeaderPath(p)) {
          return {
            ok: false,
            error: 'blocked_sensitive',
            relPath,
            repoRoot,
            status: 'blocked',
            additions: 0,
            deletions: 0,
            truncated: false,
            binary: false,
            hunks: [],
          };
        }
        if (line.startsWith('rename to ')) relPath = p;
        continue;
      }
      if (line.startsWith('--- ') || line.startsWith('+++ ')) {
        const rawHeaderPath = line.slice(4).split('\t', 1)[0].trim();
        if (rawHeaderPath && rawHeaderPath !== '/dev/null') {
          const p = stripGitDiffPrefix(rawHeaderPath);
          if (!p || isBlockedDiffHeaderPath(p)) {
            return {
              ok: false,
              error: 'blocked_sensitive',
              relPath,
              repoRoot,
              status: 'blocked',
              additions: 0,
              deletions: 0,
              truncated: false,
              binary: false,
              hunks: [],
            };
          }
          if (line.startsWith('+++ ') && !relPath) relPath = p;
        }
        continue;
      }
      if ((line.startsWith('Binary files ') && line.endsWith(' differ')) || line === 'GIT binary patch') {
        if (line.startsWith('Binary files ')) {
          const bm = /^Binary files (.+) and (.+) differ$/.exec(line);
          if (bm) {
            const p1 = stripGitDiffPrefix(bm[1]);
            const p2 = stripGitDiffPrefix(bm[2]);
            if ((p1 && isBlockedDiffHeaderPath(p1)) || (p2 && isBlockedDiffHeaderPath(p2))) {
              return {
                ok: false,
                error: 'blocked_sensitive',
                relPath,
                repoRoot,
                status: 'blocked',
                additions: 0,
                deletions: 0,
                truncated: false,
                binary: false,
                hunks: [],
              };
            }
          }
        }
        binary = true;
        break;
      }
    }

    const hm = /^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/.exec(line);
    if (hm) {
      inHunk = true;
      oldLn = Number(hm[1]) || 0;
      newLn = Number(hm[2]) || 0;
      if (emittedRows < maxLines) {
        curHunk = {
          header: truncateLineText(line, maxLineChars),
          rows: [],
        };
        hunks.push(curHunk);
      } else {
        curHunk = null;
        truncated = true;
      }
      continue;
    }

    if (!inHunk) continue;
    if (line.startsWith('\\')) continue;

    if (line.startsWith('+')) {
      additions += 1;
      if (curHunk && emittedRows < maxLines) {
        curHunk.rows.push({
          kind: 'add',
          oldLn: null,
          newLn,
          sign: '+',
          text: truncateLineText(line.slice(1), maxLineChars),
        });
        emittedRows += 1;
      } else {
        truncated = true;
      }
      newLn += 1;
    } else if (line.startsWith('-')) {
      deletions += 1;
      if (curHunk && emittedRows < maxLines) {
        curHunk.rows.push({
          kind: 'del',
          oldLn,
          newLn: null,
          sign: '-',
          text: truncateLineText(line.slice(1), maxLineChars),
        });
        emittedRows += 1;
      } else {
        truncated = true;
      }
      oldLn += 1;
    } else if (line.startsWith(' ') || line === '') {
      if (curHunk && emittedRows < maxLines) {
        curHunk.rows.push({
          kind: 'ctx',
          oldLn,
          newLn,
          sign: ' ',
          text: truncateLineText(line.startsWith(' ') ? line.slice(1) : '', maxLineChars),
        });
        emittedRows += 1;
      } else {
        truncated = true;
      }
      oldLn += 1;
      newLn += 1;
    }
  }

  const cleanHunks = hunks.filter((h) => h.rows.length > 0);
  const finalStatus = status || inferredStatus || (binary || cleanHunks.length > 0 ? 'modified' : 'clean');

  if (binary) {
    return {
      ok: true,
      relPath,
      repoRoot,
      status: finalStatus,
      additions: 0,
      deletions: 0,
      truncated: false,
      binary: true,
      hunks: [],
    };
  }

  return {
    ok: true,
    relPath,
    repoRoot,
    status: finalStatus,
    additions,
    deletions,
    truncated,
    binary: false,
    hunks: cleanHunks,
  };
}

function readBoundedTextFile(realPath, maxReadBytes) {
  const buf = Buffer.alloc(maxReadBytes);
  let bytesRead = 0;
  let fileSize = 0;
  let fd = null;
  try {
    const openFlags =
      process.platform !== 'win32' && typeof fs.constants?.O_NOFOLLOW === 'number'
        ? fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW
        : 'r';
    fd = fs.openSync(realPath, openFlags);
    const fdStat = fs.fstatSync(fd);
    if (!fdStat.isFile()) return { ok: false, error: 'not_a_file' };
    const postStat = fs.lstatSync(realPath);
    if (postStat.isSymbolicLink() || !postStat.isFile()) return { ok: false, error: 'not_a_file' };
    if (process.platform !== 'win32' && (fdStat.ino !== postStat.ino || fdStat.dev !== postStat.dev)) {
      return { ok: false, error: 'read_failed' };
    }
    fileSize = fdStat.size;
    bytesRead = fs.readSync(fd, buf, 0, maxReadBytes, 0);
  } catch (err) {
    const code = err?.code;
    if (code === 'ELOOP') return { ok: false, error: 'not_a_file' };
    if (code === 'EACCES' || code === 'EPERM') return { ok: false, error: 'access_denied' };
    return { ok: false, error: 'read_failed' };
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch {}
    }
  }

  const slice = buf.subarray(0, bytesRead);
  if (slice.includes(0)) {
    return { ok: true, binary: true, rawText: '', byteTruncated: false };
  }
  return {
    ok: true,
    binary: false,
    rawText: slice.toString('utf8').replace(/\r\n/g, '\n'),
    byteTruncated: bytesRead < fileSize,
  };
}

function buildUntrackedPreview({ relPath, repoRoot, realPath, maxLines, maxLineChars, maxReadBytes }) {
  const readRes = readBoundedTextFile(realPath, maxReadBytes);
  if (!readRes.ok) {
    return { ok: false, error: readRes.error, relPath, repoRoot };
  }
  if (readRes.binary) {
    return {
      ok: true,
      relPath,
      repoRoot,
      status: 'untracked',
      additions: 0,
      deletions: 0,
      truncated: false,
      binary: true,
      hunks: [],
    };
  }
  const lines = readRes.rawText.length > 0 ? readRes.rawText.split('\n') : [];
  if (!readRes.byteTruncated && lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  const lineTruncated = lines.length > maxLines;
  const capped = lineTruncated ? lines.slice(0, maxLines) : lines;
  const rows = capped.map((line, idx) => ({
    kind: 'add',
    oldLn: null,
    newLn: idx + 1,
    sign: '+',
    text: truncateLineText(line, maxLineChars),
  }));
  const hunks = rows.length
    ? [{ header: `@@ -0,0 +1,${rows.length} @@`, rows }]
    : [];

  return {
    ok: true,
    relPath,
    repoRoot,
    status: 'untracked',
    additions: lines.length,
    deletions: 0,
    truncated: Boolean(readRes.byteTruncated || lineTruncated),
    binary: false,
    hunks,
  };
}

function getCachedEntry(cacheKey) {
  const entry = inlineDiffCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.at > INLINE_DIFF_CACHE_TTL_MS) {
    inlineDiffCache.delete(cacheKey);
    return null;
  }
  inlineDiffCache.delete(cacheKey);
  inlineDiffCache.set(cacheKey, entry);
  return entry.value;
}

function setCachedEntry(cacheKey, value) {
  if (!value || !value.ok) return value;
  if (inlineDiffCache.has(cacheKey)) {
    inlineDiffCache.delete(cacheKey);
  }
  while (inlineDiffCache.size >= INLINE_DIFF_CACHE_MAX) {
    const oldest = inlineDiffCache.keys().next().value;
    if (oldest === undefined) break;
    inlineDiffCache.delete(oldest);
  }
  inlineDiffCache.set(cacheKey, { at: Date.now(), value });
  return value;
}

function clearInlineDiffCache() {
  inlineDiffCache.clear();
}

async function runWithConcurrencyLimit(taskFn) {
  if (inlineDiffActiveCount >= INLINE_DIFF_MAX_CONCURRENCY) {
    if (inlineDiffWaitQueue.length >= INLINE_DIFF_MAX_QUEUE) {
      return { ok: false, error: 'busy' };
    }
    await new Promise((resolve) => {
      inlineDiffWaitQueue.push(resolve);
    });
  } else {
    inlineDiffActiveCount += 1;
  }
  try {
    return await taskFn();
  } finally {
    const next = inlineDiffWaitQueue.shift();
    if (typeof next === 'function') {
      next();
    } else {
      inlineDiffActiveCount = Math.max(0, inlineDiffActiveCount - 1);
    }
  }
}

async function getInlineDiff(input, maybeOpts) {
  const opts =
    input && typeof input === 'object'
      ? { ...input, ...(maybeOpts && typeof maybeOpts === 'object' ? maybeOpts : {}) }
      : maybeOpts && typeof maybeOpts === 'object'
        ? maybeOpts
        : {};
  const rawUri =
    typeof input === 'string'
      ? input
      : input && typeof input === 'object'
        ? input.filePath || input.uri || input.path || ''
        : '';

  const maxLines = clampPositiveInt(opts.maxLines, INLINE_DIFF_DEFAULT_MAX_LINES, 5000);
  const maxLineChars = clampPositiveInt(opts.maxLineChars, INLINE_DIFF_DEFAULT_MAX_LINE_CHARS, 5000);
  const timeoutMs = clampPositiveInt(opts.timeout, INLINE_DIFF_DEFAULT_TIMEOUT_MS, 10000);
  const maxReadBytes = clampPositiveInt(opts.maxReadBytes, INLINE_DIFF_MAX_READ_BYTES, 256 * 1024);

  const resolved = resolveInlineDiffCandidatePath(rawUri, opts);
  if (!resolved.ok) {
    return resolved;
  }

  let realPath;
  try {
    realPath = canonicalRealpathSync(resolved.candidatePath);
  } catch (err) {
    const code = err?.code;
    if (code === 'ENOENT' || code === 'ENOTDIR') return { ok: false, error: 'not_found' };
    if (code === 'EACCES' || code === 'EPERM') return { ok: false, error: 'access_denied' };
    return { ok: false, error: 'read_failed' };
  }

  if (hasBlockedInlineDiffUnc(realPath)) {
    return { ok: false, error: 'blocked_unc' };
  }
  if (isSensitiveInlineDiffPath(realPath)) {
    return { ok: false, error: 'blocked_sensitive' };
  }

  let st;
  try {
    st = fs.lstatSync(realPath);
  } catch {
    return { ok: false, error: 'read_failed' };
  }
  if (!st.isFile() || st.isSymbolicLink()) {
    return { ok: false, error: 'not_a_file' };
  }

  const fileDir = path.dirname(realPath);
  const markerCheck = findNearestGitMarker(fileDir);
  if (!markerCheck.ok) {
    return { ok: false, error: markerCheck.error || 'outside_git_repo' };
  }

  const cacheKey = `${realPath}|${maxLines}|${maxLineChars}|${maxReadBytes}`;
  if (!opts.noCache) {
    const cached = getCachedEntry(cacheKey);
    if (cached) return cached;
    const inflight = inlineDiffInFlight.get(cacheKey);
    if (inflight) return inflight;
  }

  const execute = async () => {
    const revRes = await execGitSafe(['-C', fileDir, 'rev-parse', '--show-toplevel'], fileDir, timeoutMs);
    if (!revRes.ok || !revRes.stdout.trim()) {
      return { ok: false, error: 'outside_git_repo' };
    }
    const rawTopLevel = revRes.stdout.trim();
    if (hasBlockedInlineDiffUnc(rawTopLevel) || hasControlOrNulChars(rawTopLevel)) {
      return { ok: false, error: 'outside_git_repo' };
    }

    let realRepoRoot;
    try {
      realRepoRoot = canonicalRealpathSync(rawTopLevel);
      const rstat = fs.lstatSync(realRepoRoot);
      if (!rstat.isDirectory() || rstat.isSymbolicLink() || hasBlockedInlineDiffUnc(realRepoRoot)) {
        return { ok: false, error: 'outside_git_repo' };
      }
    } catch {
      return { ok: false, error: 'outside_git_repo' };
    }

    const rootMarker = validateGitMarkerAtDir(realRepoRoot);
    if (!rootMarker.ok) {
      return { ok: false, error: rootMarker.error || 'invalid_git_dir' };
    }

    if (!isPathWithinRoot(realRepoRoot, realPath, false)) {
      return { ok: false, error: 'outside_git_repo' };
    }

    const relNative = path.relative(realRepoRoot, realPath);
    const relPath = relNative.split(path.sep).join('/');
    if (!relPath || hasControlOrNulChars(relPath) || path.isAbsolute(relNative) || hasDotDotPathSegment(relPath)) {
      return { ok: false, error: 'outside_git_repo' };
    }
    if (isSensitiveInlineDiffPath(relPath)) {
      return { ok: false, error: 'blocked_sensitive' };
    }

    const baseDiffArgs = ['diff', '--no-ext-diff', '--no-color', '--unified=3'];
    let diffRes = await execGitSafe(['-C', realRepoRoot, ...baseDiffArgs, '--', relPath], realRepoRoot, timeoutMs);
    let rawDiff = diffRes.ok || diffRes.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' ? diffRes.stdout : '';
    let bufferTruncated = diffRes.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER';

    if (!rawDiff.trim()) {
      diffRes = await execGitSafe(['-C', realRepoRoot, ...baseDiffArgs, '--cached', '--', relPath], realRepoRoot, timeoutMs);
      rawDiff = diffRes.ok || diffRes.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' ? diffRes.stdout : '';
      bufferTruncated = diffRes.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER';
    }

    if (!rawDiff.trim()) {
      diffRes = await execGitSafe(['-C', realRepoRoot, ...baseDiffArgs, 'HEAD', '--', relPath], realRepoRoot, timeoutMs);
      rawDiff = diffRes.ok || diffRes.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' ? diffRes.stdout : '';
      bufferTruncated = diffRes.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER';
    }

    if (rawDiff.trim()) {
      return parseUnifiedDiff(rawDiff, {
        maxLines,
        maxLineChars,
        relPath,
        repoRoot: realRepoRoot,
        bufferTruncated,
      });
    }

    const untrackedRes = await execGitSafe(
      ['-C', realRepoRoot, 'ls-files', '--others', '--exclude-standard', '--', relPath],
      realRepoRoot,
      timeoutMs
    );
    if (untrackedRes.ok && untrackedRes.stdout.trim()) {
      return buildUntrackedPreview({
        relPath,
        repoRoot: realRepoRoot,
        realPath,
        maxLines,
        maxLineChars,
        maxReadBytes,
      });
    }

    return {
      ok: true,
      relPath,
      repoRoot: realRepoRoot,
      status: 'clean',
      additions: 0,
      deletions: 0,
      truncated: false,
      binary: false,
      hunks: [],
    };
  };

  if (opts.noCache) {
    return runWithConcurrencyLimit(execute);
  }

  const promise = runWithConcurrencyLimit(execute).then((res) => {
    if (res && res.ok) {
      setCachedEntry(cacheKey, res);
    }
    return res;
  });
  inlineDiffInFlight.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    if (inlineDiffInFlight.get(cacheKey) === promise) {
      inlineDiffInFlight.delete(cacheKey);
    }
  }
}

module.exports = {
  getInlineDiff,
  parseUnifiedDiff,
  isSensitiveInlineDiffPath,
  hasBlockedInlineDiffUnc,
  resolveInlineDiffCandidatePath,
  clearInlineDiffCache,
};
