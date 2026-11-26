'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const net = require('net');
const tls = require('tls');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const dns = require('dns');
const os = require('os');
const zlib = require('zlib');
const { Readable, Transform } = require('stream');

const MAX_CONCURRENCY = 3;
const MAX_CACHE_ENTRIES = 600;
const MAX_DISK_ENTRY_CHARS = 32000;
const MAX_DISK_TOTAL_CHARS = 800000;
const MAX_STREAM_CHARS = 96000;
const MAX_STREAM_BYTES = 8 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;
const MAX_SINGLE_THOUGHT_CHARS = 48000;
const MAX_TOTAL_THOUGHT_CHARS = 96000;
const MAX_CONNECT_HEADER_BYTES = 16 * 1024;
const SOCKS5_HANDSHAKE_TIMEOUT_MS = 15000;
const CONNECT_HANDSHAKE_TIMEOUT_MS = 15000;
const SOCKS5_DNS_LOOKUP_TIMEOUT_MS = 3000;
const SYSTEM_PROXY_CACHE_TTL_MS = 30000;

const ALLOWED_PROXY_PROTOCOLS = new Set(['http:', 'https:', 'socks5:', 'socks5h:']);

const BLOCKED_AI_PORTS = new Set([
  21, 22, 23, 25, 53, 110, 135, 139, 143, 445, 1433, 3306, 3389, 5432, 6379, 11211, 27017,
]);

const SYSTEM_PROMPTS_BY_LANG = Object.freeze({
  'zh-CN': Object.freeze({
    technical:
      '你是资深软件工程推理转译助手。请将输入的模型思考过程（Chain-of-Thought）准确、自然地转写润色为简体中文第一人称（「我」）工程手稿。若原文夹杂简体中文与外语（如英文、日文等），请保留原有已通顺的简体中文内容，并将其中所有外语段落与句子完整译为简体中文，绝不漏翻或原样照抄外语段落。严格保留所有代码标识符、函数名、类名、文件路径、行号（如 path/file.js#L12）、终端命令与反引号格式不变；忠实还原技术因果推演、假设验证与边界排查逻辑，不编造原文没有的事实，不添加任何寒暄、标题前缀或额外解释，直接输出转写后的中文思考正文。',
    concise:
      '你是高效软件工程思考摘要助手。请将输入的模型思考过程提炼转写为简明利落的简体中文第一人称（「我」）推理脉络。若原文夹杂中文与外语，请保留原有核心中文表述并完整翻译所有外语段落与句子，绝不漏翻外语内容。严格保留所有精确文件路径、行号、关键代码标识符与核心结论依据，合并冗余重复的自我纠结句式，不加额外标题或套话，直接输出精炼后的中文思考正文。',
  }),
  'zh-TW': Object.freeze({
    technical:
      '你是資深軟體工程推論轉譯助手。請將輸入的模型思考過程（Chain-of-Thought）準確、自然地轉寫潤飾為繁體中文（台灣慣用工程術語）第一人稱（「我」）工程手稿。若原文夾雜簡體中文、繁體中文與外語（如英文、日文等），請保留技術術語並將全文統一轉寫為自然流暢的繁體中文，務必完整翻譯所有外語段落與句子，絕不漏翻或原樣照抄外語段落。嚴格保留所有程式碼識別字、函式名稱、類別名稱、檔案路徑、行號（如 path/file.js#L12）、終端機指令與反引號格式不變；忠實還原技術因果推演與邊界排查邏輯，不添加任何寒暄或額外標題，直接輸出轉寫後的繁體中文思考正文。',
    concise:
      '你是高效軟體工程思考摘要助手。請將輸入的模型思考過程提煉轉寫為簡明俐落的繁體中文第一人稱（「我」）推論脈絡。若原文夾雜簡體中文或外語，請統一轉寫為繁體中文並完整翻譯所有外語段落，絕不漏翻。嚴格保留所有精確檔案路徑、行號、關鍵程式碼識別字與核心結論依據，合併冗餘重複句式，不加額外標題或套話，直接輸出精煉後的繁體中文思考正文。',
  }),
  en: Object.freeze({
    technical:
      'You are a senior software engineering reasoning translator. Accurately and naturally rewrite the input Chain-of-Thought into first-person ("I") English engineering notes. When the input mixes English with Chinese, Japanese, or other languages, preserve well-formed English prose and translate ALL foreign-language paragraphs and sentences completely into natural English—never omit or leave foreign prose untranslated. Strictly preserve all code identifiers, function/class names, file paths, line numbers (e.g., path/file.js#L12), terminal commands, and backtick formatting. Faithfully reproduce technical causal reasoning, hypothesis checks, and edge-case analysis without inventing facts or adding greetings, headings, or meta-commentary. Output the English reasoning body directly.',
    concise:
      'You are an efficient software engineering reasoning summarizer. Distill and translate the input Chain-of-Thought into crisp first-person ("I") English engineering notes. When languages are mixed, preserve existing clear English and translate ALL non-English paragraphs and sentences completely into English without omission. Strictly preserve all exact file paths, line numbers, key code identifiers, and core conclusions while removing repetitive self-doubt. Output the refined English reasoning body directly with no extra headings or filler.',
  }),
});

const KIND_PROMPTS_BY_LANG = Object.freeze({
  tool_summary: Object.freeze({
    'zh-CN':
      '你是软件工程工具日志摘要翻译器。请将输入的英文工具操作摘要准确译为简明自然的简体中文。严格保留所有代码标识符、文件路径、行号（如 #L12）、命令参数与反引号内容不变，不要添加任何额外说明。',
    'zh-TW':
      '你是軟體工程工具日誌摘要翻譯器。請將輸入的英文工具操作摘要準確譯為簡明自然的繁體中文。嚴格保留所有程式碼識別字、檔案路徑、行號（如 #L12）、命令參數與反引號內容不變，不要添加任何額外說明。',
    en:
      'You are a software engineering tool-log summary translator. Translate the natural-language prose into crisp, concise English while strictly preserving all code identifiers, file paths, line numbers (e.g., #L12), CLI flags, and backticks. Output only the translated summary.',
  }),
  title: Object.freeze({
    'zh-CN':
      '你是软件工程会话标题翻译器。请将输入的会话标题准确译为简练自然的简体中文标题。严格保留文件名、路径、版本号、代码标识符与反引号内容不变，不加引号或额外解释，直接输出翻译后的标题。',
    'zh-TW':
      '你是軟體工程工作階段標題翻譯器。請將輸入的工作階段標題準確譯為簡練自然的繁體中文標題。嚴格保留檔名、路徑、版本號、程式碼識別字與反引號內容不變，不加引號或額外解釋，直接輸出翻譯後的標題。',
    en:
      'You are a software engineering conversation title translator. Translate the conversation title into concise, natural English while strictly preserving filenames, paths, versions, code identifiers, and backticks. Output only the translated title without quotes.',
  }),
});

const GTX_TARGET_LANG_MAP = Object.freeze({
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  es: 'es',
  fr: 'fr',
  de: 'de',
});

const KEY_REDACT_RE =
  /(sk-[A-Za-z0-9_\-]{6,}|gsk_[A-Za-z0-9_\-]{12,}|hf_[A-Za-z0-9_\-]{12,}|pplx-[A-Za-z0-9_\-]{12,}|csk-[A-Za-z0-9_\-]{12,}|nvapi-[A-Za-z0-9_\-]{12,}|AIza[A-Za-z0-9_\-]{12,}|xai-[A-Za-z0-9_\-]{8,}|ghp_[A-Za-z0-9]{12,}|github_pat_[A-Za-z0-9_]{12,}|Bearer\s+[A-Za-z0-9._\-:+/=]{6,}|(?:Proxy-)?Authorization\s*:\s*Basic\s+[A-Za-z0-9+/=]{4,})/gi;
const URL_KEY_PARAM_RE = /([?&](?:api_key|apikey|key|token|access_token)=)[^&\s"'<>]+/gi;
const URL_USERINFO_PASS_RE = /([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)[^@\s/"'<>]+@/gi;

// Inline protection patterns ordered from highest specificity (code blocks/backticks/URLs/paths)
// to code identifiers. Used for GTX machine translation and batch token preservation.
const INLINE_PROTECT_PATTERNS = [
  /```[\s\S]*?```/g,
  /`[^`\n]+`/g,
  /\bExited\s+with\s+(?:exit\s+)?code\s+-?\d+\b/gi,
  /\bexit\s+code\s+-?\d+\b/gi,
  /\bHTTP\s+\d{3}\b/g,
  /(?:https?|file|socks5h?):\/\/[^\s"'<>()]+/gi,
  /[A-Za-z]:[\\/][^\s"'<>|]+/g,
  /(?<![A-Za-z0-9_])(?:\.{1,2}\/|\/)(?:[A-Za-z0-9_.@-]+\/)*[A-Za-z0-9_.@-]+(?:#L\d+(?:-L?\d+)?|:\d+(?:-\d+)?(?::\d+)?)?/g,
  /(?<![A-Za-z0-9_./\\-])(?:[A-Za-z0-9_.@-]+\/)+[A-Za-z0-9_.@-]+(?:#L\d+(?:-L?\d+)?|:\d+(?:-\d+)?(?::\d+)?)?/g,
  /#L\d+(?:-L?\d+)?\b/gi,
  /\bL\d+-L?\d+\b/g,
  /(?<!\w):\d+(?:-\d+)(?::\d+)?\b/g,
  /(?<![A-Za-z0-9_./\\-])[A-Za-z0-9_][A-Za-z0-9_.-]*\.[A-Za-z][A-Za-z0-9]{0,7}(?:#L\d+(?:-L?\d+)?|:\d+(?:-\d+)?)?(?![A-Za-z0-9_])/g,
  /(?<=^|[\s([{"'])--?[A-Za-z][A-Za-z0-9_-]*(?:=[^\s)\]}"']+)?/g,
  /\b[A-Za-z0-9]+(?:_[A-Za-z0-9]+)+\b/g,
  /\b(?:[a-z]+[A-Z][A-Za-z0-9]*|[A-Z][a-z0-9]+[A-Z][A-Za-z0-9]*)\b/g,
  /\b[A-Za-z_][A-Za-z0-9_]*\(\)/g,
];

// Minimal protection patterns fallback if full identifier masking causes GTX to drop a placeholder.
const MINIMAL_PROTECT_PATTERNS = [
  /```[\s\S]*?```/g,
  /`[^`\n]+`/g,
  /(?:https?|file|socks5h?):\/\/[^\s"'<>()]+/gi,
  /[A-Za-z]:[\\/][^\s"'<>|]+/g,
  /(?<![A-Za-z0-9_./\\-])(?:[A-Za-z0-9_.@-]+\/)+[A-Za-z0-9_.@-]+(?:#L\d+(?:-L?\d+)?|:\d+(?:-\d+)?(?::\d+)?)?/g,
  /#L\d+(?:-L?\d+)?\b/gi,
];

function getDefaultStateDir(env = process.env) {
  if (env.AG_STUDIO_STATE_DIR && env.AG_STUDIO_STATE_DIR.trim()) {
    return path.resolve(env.AG_STUDIO_STATE_DIR.trim());
  }
  const localApp = env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  if (process.platform === 'win32') {
    return path.join(localApp, 'AntigravityStudio');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'AntigravityStudio');
  }
  return path.join(env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'AntigravityStudio');
}

function normalizeTargetLang(lang) {
  const s = String(lang || '').trim().toLowerCase().replace(/_/g, '-');
  if (!s || s === 'auto') return 'zh-CN';
  if (/^zh-(tw|hk|mo|hant)/.test(s) || s === 'tw' || s === 'hant') return 'zh-TW';
  if (/^zh(?:\b|-)/.test(s)) return 'zh-CN';
  if (/^en(?:\b|-)/.test(s) || s === 'english') return 'en';
  if (/^(ja|jp)(?:\b|-)/.test(s) || s === 'japanese') return 'ja';
  if (/^(ko|kr)(?:\b|-)/.test(s) || s === 'korean') return 'ko';
  if (/^es(?:\b|-)/.test(s) || s === 'spanish') return 'es';
  if (/^fr(?:\b|-)/.test(s) || s === 'french') return 'fr';
  if (/^de(?:\b|-)/.test(s) || s === 'german') return 'de';
  return 'zh-CN';
}

function redactSecrets(text, explicitKeys = []) {
  let out = String(text || '')
    .replace(KEY_REDACT_RE, '***REDACTED***')
    .replace(URL_KEY_PARAM_RE, '$1***REDACTED***')
    .replace(URL_USERINFO_PASS_RE, '$1***REDACTED***@');

  const keys = Array.isArray(explicitKeys) ? explicitKeys : [explicitKeys];
  const expanded = [];
  for (const raw of keys) {
    const k = String(raw || '').trim();
    if (k.length < 3) continue;
    expanded.push(k);
    try {
      const enc = encodeURIComponent(k);
      if (enc !== k && enc.length >= 3) expanded.push(enc);
    } catch {}
  }
  expanded.sort((a, b) => b.length - a.length);
  for (const tok of expanded) {
    if (out.includes(tok)) out = out.split(tok).join('***REDACTED***');
  }
  return out;
}

function parseIpv4Octets(raw) {
  const parts = String(raw || '').split('.');
  if (parts.length !== 4) return null;
  const out = [];
  for (let i = 0; i < 4; i++) {
    if (!/^\d{1,3}$/.test(parts[i])) return null;
    const n = Number(parts[i]);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    out.push(n);
  }
  return out;
}

function isBlockedIpv4(a, b, c, d) {
  if (a === 0) return true; // 0.0.0.0/8 unspecified
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 cloud metadata & link-local
  if (a === 100 && b === 100 && c === 100 && d === 200) return true; // Alibaba Cloud metadata
  return false;
}

function parseIpv6Hextets(raw) {
  let s = String(raw || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
  const zoneIdx = s.indexOf('%');
  if (zoneIdx >= 0) s = s.slice(0, zoneIdx);
  if (!s.includes(':')) return null;

  let ipv4Tail = null;
  const lastColon = s.lastIndexOf(':');
  const tailPart = s.slice(lastColon + 1);
  if (tailPart.includes('.')) {
    const octets = parseIpv4Octets(tailPart);
    if (!octets) return null;
    ipv4Tail = [(octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]];
    if (lastColon > 0 && s[lastColon - 1] === ':') {
      s = s.slice(0, lastColon + 1);
    } else {
      s = s.slice(0, lastColon);
    }
  }

  const targetGroups = ipv4Tail ? 6 : 8;
  const dblIdx = s.indexOf('::');
  let groups;
  if (dblIdx >= 0) {
    if (s.indexOf('::', dblIdx + 2) >= 0) return null;
    const leftStr = s.slice(0, dblIdx);
    const rightStr = s.slice(dblIdx + 2);
    const left = leftStr ? leftStr.split(':') : [];
    const right = rightStr ? rightStr.split(':') : [];
    const missing = targetGroups - left.length - right.length;
    if (missing < 1) return null;
    groups = [...left, ...new Array(missing).fill('0'), ...right];
  } else {
    groups = s.split(':');
    if (groups.length !== targetGroups) return null;
  }

  const hextets = [];
  for (let i = 0; i < groups.length; i++) {
    if (!/^[0-9a-f]{1,4}$/.test(groups[i])) return null;
    hextets.push(parseInt(groups[i], 16));
  }
  if (ipv4Tail) {
    hextets.push(ipv4Tail[0], ipv4Tail[1]);
  }
  return hextets.length === 8 ? hextets : null;
}

/**
 * Checks whether a hostname or IP literal targets a blocked cloud-metadata or SSRF address.
 * Blocks metadata.google.internal, *.metadata.google.internal, metadata.goog, 169.254.0.0/16,
 * 0.0.0.0/8, 100.100.100.200, fe80::/10, fd00:ec2::/32, and IPv4-mapped/translated/compatible IPv6 forms.
 */
function isBlockedTargetHost(rawHost) {
  const host = String(rawHost || '').trim().toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host) return true;
  if (
    host === 'metadata.google.internal' ||
    host.endsWith('.metadata.google.internal') ||
    host === 'metadata.goog' ||
    host === 'metadata' ||
    host === 'instance-data'
  ) {
    return true;
  }
  const v4 = parseIpv4Octets(host);
  if (v4) {
    return isBlockedIpv4(v4[0], v4[1], v4[2], v4[3]);
  }
  if (host.includes(':')) {
    const h = parseIpv6Hextets(host);
    if (!h) return true;
    if (h.every((x) => x === 0)) return true; // :: unspecified
    // Allow ::1 loopback for local LLM servers
    if (h[0] === 0 && h[1] === 0 && h[2] === 0 && h[3] === 0 && h[4] === 0 && h[5] === 0 && h[6] === 0 && h[7] === 1) {
      return false;
    }
    if ((h[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if (h[0] === 0xfd00 && h[1] === 0x0ec2) return true; // fd00:ec2::/32 AWS IMDSv2 IPv6
    const isV4Mapped = h[0] === 0 && h[1] === 0 && h[2] === 0 && h[3] === 0 && h[4] === 0 && h[5] === 0xffff;
    const isV4Translated = h[0] === 0 && h[1] === 0 && h[2] === 0 && h[3] === 0 && h[4] === 0xffff && h[5] === 0;
    const isV4Compatible = h[0] === 0 && h[1] === 0 && h[2] === 0 && h[3] === 0 && h[4] === 0 && h[5] === 0;
    const isNat64 =
      h[0] === 0x0064 &&
      h[1] === 0xff9b &&
      ((h[2] === 0 && h[3] === 0 && h[4] === 0 && h[5] === 0) || h[2] === 0x0001);
    if (isV4Mapped || isV4Translated || isV4Compatible || isNat64) {
      if (isBlockedIpv4(h[6] >> 8, h[6] & 0xff, h[7] >> 8, h[7] & 0xff)) return true;
    }
    if (h[0] === 0x2002) {
      if (isBlockedIpv4(h[1] >> 8, h[1] & 0xff, h[2] >> 8, h[2] & 0xff)) return true;
    }
    return false;
  }
  return false;
}

/**
 * Validates and normalizes an OpenAI-compatible base URL, enforcing SSRF host and port protections.
 */
function validateOpenAiBaseUrl(rawUrl) {
  let u = String(rawUrl || '').trim();
  if (!u) return { ok: true, url: 'https://api.openai.com/v1', isDefault: true };
  if (/[\r\n\u0000-\u001f\u007f]/.test(u)) {
    return { ok: false, reason: 'control-chars', error: 'Invalid Base URL (control characters are not allowed)' };
  }
  const hasExplicitScheme =
    /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(u) ||
    /^(?:javascript|data|vbscript|file|about|blob|mailto):/i.test(u) ||
    (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(u) &&
      !/^(?:localhost|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|\[::1\]|[a-zA-Z0-9.-]+):\d+(?:\/|$)/.test(u));
  if (!hasExplicitScheme) {
    const bare = u.split('/')[0].toLowerCase();
    const isLocalBare =
      bare.startsWith('localhost') ||
      bare.startsWith('127.') ||
      bare.startsWith('[::1]') ||
      /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[0-1])\.)/.test(bare);
    u = (isLocalBare ? 'http://' : 'https://') + u;
  }
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { ok: false, reason: 'blocked-protocol', error: `Unsupported Base URL protocol: ${parsed.protocol}` };
    }
    const cleanHost = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (isBlockedTargetHost(cleanHost)) {
      return { ok: false, reason: 'blocked-ssrf-host', error: 'Blocked Base URL host (SSRF protection)' };
    }
    if (parsed.port && BLOCKED_AI_PORTS.has(Number(parsed.port))) {
      return { ok: false, reason: 'blocked-port', error: `Blocked Base URL port: ${parsed.port}` };
    }
    parsed.username = '';
    parsed.password = '';
    parsed.hash = '';
    parsed.search = '';
    let pathname = String(parsed.pathname || '').replace(/\/+$/, '');
    pathname = pathname.replace(/\/chat\/completions$/i, '').replace(/\/models$/i, '').replace(/\/+$/, '');
    if (!pathname) pathname = '/v1';
    return { ok: true, url: `${parsed.origin}${pathname}`, isDefault: false };
  } catch {
    return { ok: false, reason: 'invalid-url', error: 'Invalid Base URL format' };
  }
}

function normalizeOpenAiBaseUrl(rawUrl) {
  const checked = validateOpenAiBaseUrl(rawUrl);
  return checked.ok ? checked.url : 'https://api.openai.com/v1';
}

function isKeylessAllowedEndpoint(rawUrl) {
  const raw = String(rawUrl || '').trim();
  if (!raw) return false;
  const withProto = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw) ? raw : `http://${raw}`;
  try {
    const parsed = new URL(withProto);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (isBlockedTargetHost(host)) return false;
    if (parsed.port && BLOCKED_AI_PORTS.has(Number(parsed.port))) return false;
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host === '::1' ||
      host === '0:0:0:0:0:0:0:1' ||
      host === 'host.docker.internal' ||
      host === 'gateway.docker.internal'
    ) {
      return true;
    }
    if (/^127(?:\.\d{1,3}){3}$/.test(host)) return true;
    if (/^10(?:\.\d{1,3}){3}$/.test(host)) return true;
    if (/^192\.168(?:\.\d{1,3}){2}$/.test(host)) return true;
    if (/^172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/.test(host)) return true;
    if (/^100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])(?:\.\d{1,3}){2}$/.test(host)) return true;
    if (/^(?:f[cd][0-9a-f]{2}:|fe80:)/i.test(host)) return true;
    if (/\.(?:local|lan|internal|home|arpa)$/i.test(host)) return true;
    if (!host.includes('.') && !host.includes(':')) return true;
    return false;
  } catch {
    return false;
  }
}

function validateProxyUrl(rawProxy) {
  const rawStr = String(rawProxy || '');
  if (/[\r\n\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(rawStr)) {
    return { ok: false, reason: 'control-chars', error: 'Invalid proxy URL (control characters or newlines are not allowed)' };
  }
  const s = rawStr.trim();
  if (!s) return { ok: true, proxy: null };
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)) {
    if (!/^(?:https?|socks5h?):\/\//i.test(s)) {
      return { ok: false, reason: 'unsupported-protocol', error: 'Unsupported proxy protocol (use http://, https://, socks5://, or socks5h://)' };
    }
  } else if (s.includes('=') || /^[a-zA-Z][a-zA-Z0-9+.-]*:(?!\d+$)/.test(s)) {
    return { ok: false, reason: 'invalid-format', error: 'Invalid proxy URL format (expected scheme://host:port)' };
  }
  const withScheme = /^(?:https?|socks5h?):\/\//i.test(s) ? s : `http://${s}`;
  try {
    const u = new URL(withScheme);
    if (!ALLOWED_PROXY_PROTOCOLS.has(u.protocol)) {
      return { ok: false, reason: 'unsupported-protocol', error: `Unsupported proxy protocol: ${u.protocol}` };
    }
    const hostname = u.hostname.replace(/^\[|\]$/g, '');
    if (!hostname || /[\u0000-\u001f\u007f\s=@/?#]/.test(hostname)) {
      return { ok: false, reason: 'invalid-host', error: 'Invalid proxy host' };
    }
    if (isBlockedTargetHost(hostname)) {
      return { ok: false, reason: 'blocked-ssrf-host', error: 'Blocked proxy host (SSRF protection)' };
    }
    if (u.port && !/^\d{1,5}$/.test(u.port)) {
      return { ok: false, reason: 'invalid-port', error: 'Invalid proxy port' };
    }
    const defaultPort = u.protocol === 'https:' ? 443 : u.protocol === 'socks5:' || u.protocol === 'socks5h:' ? 1080 : 80;
    const port = u.port ? Number(u.port) : defaultPort;
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return { ok: false, reason: 'invalid-port', error: 'Proxy port must be between 1 and 65535' };
    }
    let username = '';
    let password = '';
    try { username = decodeURIComponent(u.username || ''); } catch { username = u.username || ''; }
    try { password = decodeURIComponent(u.password || ''); } catch { password = u.password || ''; }
    if (/[\u0000-\u001f\u007f]/.test(username) || /[\u0000-\u001f\u007f]/.test(password)) {
      return { ok: false, reason: 'control-chars', error: 'Invalid proxy credentials' };
    }
    if (
      (u.protocol === 'socks5:' || u.protocol === 'socks5h:') &&
      (Buffer.byteLength(username, 'utf8') > 255 || Buffer.byteLength(password, 'utf8') > 255)
    ) {
      return { ok: false, reason: 'credentials-too-long', error: 'SOCKS5 credentials must not exceed 255 bytes' };
    }
    return {
      ok: true,
      proxy: {
        href: u.href,
        protocol: u.protocol,
        hostname,
        port,
        username,
        password,
      },
    };
  } catch {
    return { ok: false, reason: 'invalid-url', error: 'Invalid proxy URL format' };
  }
}

/**
 * Parses and validates a proxy URL (http://, https://, socks5://, socks5h://).
 * Returns null if empty or invalid.
 */
function parseProxyUrl(rawProxy) {
  const res = validateProxyUrl(rawProxy);
  return res.ok ? res.proxy : null;
}

function maskProxyUrl(rawProxy) {
  if (!rawProxy) return '';
  const parsed = typeof rawProxy === 'object' ? rawProxy : parseProxyUrl(rawProxy);
  if (!parsed || !parsed.hostname) return '';
  const hostPart = parsed.hostname.includes(':') ? `[${parsed.hostname}]` : parsed.hostname;
  if (parsed.username || parsed.password) {
    return `${parsed.protocol}//••••@${hostPart}:${parsed.port}`;
  }
  return `${parsed.protocol}//${hostPart}:${parsed.port}`;
}

function parseNoProxyList(rawList) {
  if (Array.isArray(rawList)) {
    return rawList.map((s) => String(s || '').trim()).filter(Boolean);
  }
  return String(rawList || '')
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isLoopbackOrLocalHost(rawHost) {
  const host = String(rawHost || '').toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (/^127(?:\.\d{1,3}){3}$/.test(host)) return true;
  if (host === '::1' || host === '0:0:0:0:0:0:0:1') return true;
  if (host.includes(':')) {
    const h = parseIpv6Hextets(host);
    if (h) {
      if (h[0] === 0 && h[1] === 0 && h[2] === 0 && h[3] === 0 && h[4] === 0 && h[5] === 0 && h[6] === 0 && h[7] === 1) {
        return true;
      }
      if (h[0] === 0 && h[1] === 0 && h[2] === 0 && h[3] === 0 && h[4] === 0 && h[5] === 0xffff && (h[6] >> 8) === 127) {
        return true;
      }
    }
  }
  return false;
}

function matchIpv4Cidr(host, rule) {
  const m = /^(\d{1,3}(?:\.\d{1,3}){0,3})\/(\d{1,2})$/.exec(rule);
  if (!m) return false;
  const hostOctets = parseIpv4Octets(host);
  if (!hostOctets) return false;
  const prefix = Number(m[2]);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  const rawParts = m[1].split('.');
  while (rawParts.length < 4) rawParts.push('0');
  const ruleOctets = parseIpv4Octets(rawParts.join('.'));
  if (!ruleOctets) return false;
  const hostInt = (((hostOctets[0] << 24) >>> 0) | (hostOctets[1] << 16) | (hostOctets[2] << 8) | hostOctets[3]) >>> 0;
  const ruleInt = (((ruleOctets[0] << 24) >>> 0) | (ruleOctets[1] << 16) | (ruleOctets[2] << 8) | ruleOctets[3]) >>> 0;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (hostInt & mask) === (ruleInt & mask);
}

function splitRuleHostPort(pat) {
  if (pat.startsWith('[')) {
    const closeIdx = pat.indexOf(']');
    if (closeIdx > 0) {
      const h = pat.slice(1, closeIdx);
      const rest = pat.slice(closeIdx + 1);
      if (rest.startsWith(':') && /^\d+$/.test(rest.slice(1))) {
        return { ruleHost: h, rulePort: Number(rest.slice(1)) };
      }
      return { ruleHost: h, rulePort: null };
    }
  }
  const firstColon = pat.indexOf(':');
  const lastColon = pat.lastIndexOf(':');
  if (firstColon > 0 && firstColon === lastColon) {
    const portStr = pat.slice(lastColon + 1);
    if (/^\d+$/.test(portStr)) {
      return { ruleHost: pat.slice(0, lastColon), rulePort: Number(portStr) };
    }
  }
  return { ruleHost: pat, rulePort: null };
}

function shouldBypassProxy(targetUrl, bypassEntries = []) {
  let parsed;
  try {
    parsed = targetUrl instanceof URL ? targetUrl : new URL(String(targetUrl || ''));
  } catch {
    return true;
  }
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  const targetPort = parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80;
  if (isLoopbackOrLocalHost(host)) return true;

  const list = parseNoProxyList(bypassEntries);
  for (const rawEntry of list) {
    if (!rawEntry || rawEntry.length > 256) continue;
    const pat = rawEntry.toLowerCase();
    if (!pat) continue;
    if (pat === '*') return true;
    if (pat === '<local>') {
      if (!host.includes('.')) return true;
      continue;
    }
    if (pat.includes('/') && matchIpv4Cidr(host, pat)) return true;
    const { ruleHost: rawRuleHost, rulePort } = splitRuleHostPort(pat);
    if (rulePort !== null && rulePort !== targetPort) continue;
    const ruleHost = rawRuleHost.replace(/^\[|\]$/g, '').replace(/\.$/, '');
    if (!ruleHost) continue;
    if (ruleHost.includes('*')) {
      const escaped = ruleHost.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*+/g, '.*');
      if (new RegExp(`^${escaped}$`, 'i').test(host)) return true;
      continue;
    }
    if (ruleHost.startsWith('.')) {
      const suffix = ruleHost.slice(1);
      if (suffix && (host === suffix || host.endsWith(`.${suffix}`))) return true;
      continue;
    }
    if (net.isIP(ruleHost)) {
      if (host === ruleHost) return true;
    } else if (host === ruleHost || host.endsWith(`.${ruleHost}`)) {
      return true;
    }
  }
  return false;
}

function parseWindowsRegProxyOutput(stdout) {
  const empty = { enabled: false, http: null, https: null, socks: null, bypass: [], preferred: null };
  const text = Buffer.isBuffer(stdout) ? stdout.toString('utf8') : String(stdout || '');
  if (!text.trim()) return empty;

  let proxyEnable = 0;
  let proxyServerRaw = '';
  let proxyOverrideRaw = '';

  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z0-9_]+)\s+REG_[A-Z_]+\s*(.*)$/i.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === 'proxyenable') {
      proxyEnable = /^0x/i.test(val) ? parseInt(val, 16) : Number(val);
    } else if (key === 'proxyserver') {
      proxyServerRaw = val;
    } else if (key === 'proxyoverride') {
      proxyOverrideRaw = val;
    }
  }

  if (proxyEnable !== 1 || !proxyServerRaw) return empty;

  const bypass = parseNoProxyList(proxyOverrideRaw);
  let httpProxy = null;
  let httpsProxy = null;
  let socksProxy = null;

  if (proxyServerRaw.includes('=')) {
    for (const part of proxyServerRaw.split(';')) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const kv = /^([a-z0-9_-]+)=(.+)$/i.exec(trimmed);
      if (!kv) continue;
      const proto = kv[1].toLowerCase();
      const addr = kv[2].trim();
      if (proto === 'http') {
        httpProxy = parseProxyUrl(addr);
      } else if (proto === 'https') {
        httpsProxy = parseProxyUrl(addr);
      } else if (proto === 'socks' || proto === 'socks5' || proto === 'socks5h') {
        const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(addr);
        socksProxy = parseProxyUrl(hasScheme ? addr : `socks5h://${addr}`);
      }
    }
  } else {
    const shared = parseProxyUrl(proxyServerRaw);
    if (shared && (shared.protocol === 'socks5:' || shared.protocol === 'socks5h:')) {
      socksProxy = shared;
    } else {
      httpProxy = shared;
      httpsProxy = shared;
    }
  }

  const preferred = httpsProxy || httpProxy || socksProxy || null;
  return {
    enabled: Boolean(preferred),
    http: httpProxy,
    https: httpsProxy,
    socks: socksProxy,
    bypass,
    preferred,
  };
}

function parseMacScutilProxyOutput(stdout) {
  const empty = { enabled: false, http: null, https: null, socks: null, bypass: [], preferred: null };
  const text = Buffer.isBuffer(stdout) ? stdout.toString('utf8') : String(stdout || '');
  if (!text.trim()) return empty;

  const map = new Map();
  const bypass = [];
  let inExceptions = false;

  for (const line of text.split(/\r?\n/)) {
    if (inExceptions) {
      if (/^\s*\}/.test(line)) {
        inExceptions = false;
        continue;
      }
      const arrItem = /^\s*\d+\s*:\s*(.+)$/.exec(line);
      if (arrItem && arrItem[1].trim()) bypass.push(arrItem[1].trim());
      continue;
    }
    if (/^\s*ExceptionsList\s*:\s*<array>\s*\{/i.test(line)) {
      inExceptions = true;
      continue;
    }
    const m = /^\s*([A-Za-z0-9_]+)\s*:\s*(.+)$/.exec(line);
    if (!m) continue;
    const val = m[2].trim();
    if (val.startsWith('<')) continue;
    map.set(m[1], val);
  }

  const buildProxy = (enableKey, hostKey, portKey, defaultScheme = '') => {
    if (map.get(enableKey) !== '1') return null;
    const rawHost = (map.get(hostKey) || '').trim();
    if (!rawHost) return null;
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(rawHost)) return parseProxyUrl(rawHost);
    const rawPort = (map.get(portKey) || '').trim();
    const formattedHost = rawHost.includes(':') && !rawHost.startsWith('[') ? `[${rawHost}]` : rawHost;
    const hostPort = rawPort ? `${formattedHost}:${rawPort}` : formattedHost;
    return parseProxyUrl(defaultScheme ? `${defaultScheme}${hostPort}` : hostPort);
  };

  const httpProxy = buildProxy('HTTPEnable', 'HTTPProxy', 'HTTPPort');
  const httpsProxy = buildProxy('HTTPSEnable', 'HTTPSProxy', 'HTTPSPort');
  const socksProxy = buildProxy('SOCKSEnable', 'SOCKSProxy', 'SOCKSPort', 'socks5h://');
  const preferred = httpsProxy || httpProxy || socksProxy || null;

  return {
    enabled: Boolean(preferred),
    http: httpProxy,
    https: httpsProxy,
    socks: socksProxy,
    bypass,
    preferred,
  };
}

let cachedOsProxy = { ts: 0, value: null };

/**
 * Detects OS-level proxy settings (Windows Registry Internet Settings or macOS scutil).
 */
function detectSystemProxy(opts = {}) {
  const platform = opts.platform || process.platform;
  const execFn = typeof opts.execFileSyncFn === 'function' ? opts.execFileSyncFn : execFileSync;
  const useCache = !opts.noCache && !opts.execFileSyncFn && !opts.platform;
  const now = Date.now();
  if (useCache && cachedOsProxy.value && now - cachedOsProxy.ts < SYSTEM_PROXY_CACHE_TTL_MS) {
    return cachedOsProxy.value;
  }

  const empty = { enabled: false, http: null, https: null, socks: null, bypass: [], preferred: null };
  let detected = empty;
  try {
    if (platform === 'win32') {
      const regExe = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'reg.exe');
      const raw = execFn(
        regExe,
        ['query', 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'],
        { encoding: 'utf8', timeout: 1500, windowsHide: true }
      );
      detected = parseWindowsRegProxyOutput(raw);
    } else if (platform === 'darwin') {
      const raw = execFn('/usr/sbin/scutil', ['--proxy'], { encoding: 'utf8', timeout: 1500 });
      detected = parseMacScutilProxyOutput(raw);
    }
  } catch {
    detected = empty;
  }

  if (useCache) {
    cachedOsProxy = { ts: now, value: detected };
  }
  return detected;
}

/**
 * Resolves proxy for a target URL according to priority:
 * 1. explicit config.proxyUrl (unless proxyMode === 'direct')
 * 2. proxyFallback when proxyFallback.enabled && proxyFallback.proxyUrl
 * 3. env HTTPS_PROXY / HTTP_PROXY / ALL_PROXY
 * 4. OS system proxy (Windows Registry HKCU\...\Internet Settings)
 * 5. direct (null)
 */
function resolveProxyForRequest(targetUrl, opts = {}) {
  let parsed;
  try {
    parsed = targetUrl instanceof URL ? targetUrl : new URL(String(targetUrl || ''));
  } catch {
    return { proxy: null, source: 'direct' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { proxy: null, source: 'direct' };
  }
  const targetHost = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (isLoopbackOrLocalHost(targetHost)) {
    return { proxy: null, source: 'direct' };
  }

  const config = opts.config || {};
  const thoughtCfg = config.thought && typeof config.thought === 'object' ? config.thought : config;
  const proxyMode = thoughtCfg.proxyMode || config.proxyMode || 'auto';
  if (proxyMode === 'direct') {
    return { proxy: null, source: 'direct' };
  }

  const explicitRaw = thoughtCfg.proxyUrl || thoughtCfg.customProxyUrl || config.proxyUrl || '';
  if (String(explicitRaw).trim()) {
    const explicitProxy = parseProxyUrl(explicitRaw);
    if (explicitProxy) {
      return { proxy: explicitProxy, source: 'config' };
    }
  }

  const proxyFallback = opts.proxyFallback || (config.proxy && typeof config.proxy === 'object' ? config.proxy : null);
  if (proxyFallback && proxyFallback.enabled === true && proxyFallback.proxyUrl) {
    const fbBypass = parseNoProxyList(proxyFallback.bypassList || '');
    if (!shouldBypassProxy(parsed, fbBypass)) {
      const fbProxy = parseProxyUrl(proxyFallback.proxyUrl);
      if (fbProxy) {
        return { proxy: fbProxy, source: 'proxyFallback' };
      }
    } else {
      return { proxy: null, source: 'direct' };
    }
  }

  const env = opts.env || process.env;
  const envBypass = parseNoProxyList(env.NO_PROXY || env.no_proxy || '');
  if (!shouldBypassProxy(parsed, envBypass)) {
    const isHttps = parsed.protocol === 'https:';
    const envOrder = isHttps
      ? ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy', 'ALL_PROXY', 'all_proxy']
      : ['HTTP_PROXY', 'http_proxy', 'HTTPS_PROXY', 'https_proxy', 'ALL_PROXY', 'all_proxy'];
    for (const key of envOrder) {
      const raw = env[key];
      if (!raw || !String(raw).trim()) continue;
      const envProxy = parseProxyUrl(raw);
      if (envProxy) {
        return { proxy: envProxy, source: 'env' };
      }
    }
  }

  const osCfg = opts.osConfig !== undefined ? opts.osConfig : detectSystemProxy({
    platform: opts.platform,
    execFileSyncFn: opts.execFileSyncFn,
  });
  if (osCfg && osCfg.enabled) {
    if (!osCfg.bypass || !osCfg.bypass.length || !shouldBypassProxy(parsed, osCfg.bypass)) {
      const isHttps = parsed.protocol === 'https:';
      const osProxy = isHttps
        ? osCfg.https || osCfg.http || osCfg.socks || null
        : osCfg.http || osCfg.https || osCfg.socks || null;
      if (osProxy) {
        return { proxy: osProxy, source: 'os' };
      }
    }
  }

  return { proxy: null, source: 'direct' };
}

function redactProxyErr(err, proxyInfo) {
  const raw = err?.message || String(err);
  const secrets = [];
  if (proxyInfo) {
    if (proxyInfo.username) secrets.push(proxyInfo.username);
    if (proxyInfo.password) secrets.push(proxyInfo.password);
    if (proxyInfo.username || proxyInfo.password) {
      secrets.push(Buffer.from(`${proxyInfo.username || ''}:${proxyInfo.password || ''}`, 'utf8').toString('base64'));
    }
  }
  return new Error(redactSecrets(raw, secrets));
}

function normalizeHeaders(rawHeaders) {
  const out = {};
  if (!rawHeaders) return out;
  const entries = typeof rawHeaders.forEach === 'function'
    ? (() => { const arr = []; rawHeaders.forEach((v, k) => arr.push([k, v])); return arr; })()
    : Array.isArray(rawHeaders)
      ? rawHeaders
      : Object.entries(rawHeaders);

  for (const [k, v] of entries) {
    if (v === undefined || v === null) continue;
    const key = String(k).trim();
    const val = String(v);
    if (!key || /[\r\n\0]/.test(key) || /[\r\n\0]/.test(val)) continue;
    out[key] = val;
  }
  return out;
}

function hasHeaderIgnoreCase(headersObj, targetLower) {
  for (const k of Object.keys(headersObj)) {
    if (k.toLowerCase() === targetLower) return true;
  }
  return false;
}

async function resolveSocks5ConnectHost(proxyInfo, targetHost, signal, dnsLookupFn = null) {
  if (proxyInfo.protocol !== 'socks5:' || net.isIP(targetHost)) {
    return targetHost;
  }
  if (signal?.aborted) throw new Error('Request aborted');
  const lookupFn = dnsLookupFn || dns.promises.lookup;
  let lookupResult = null;
  let timer = null;
  try {
    const lookupPromise = Promise.resolve().then(() => lookupFn(targetHost, { verbatim: true }));
    lookupPromise.catch(() => {});
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('DNS lookup timeout')), SOCKS5_DNS_LOOKUP_TIMEOUT_MS);
      if (timer.unref) timer.unref();
    });
    lookupResult = await Promise.race([lookupPromise, timeoutPromise]);
  } catch {
    return targetHost;
  } finally {
    if (timer) clearTimeout(timer);
  }
  if (signal?.aborted) throw new Error('Request aborted');
  const resolvedIp = typeof lookupResult === 'string' ? lookupResult : lookupResult?.address;
  if (!resolvedIp || !net.isIP(resolvedIp)) return targetHost;
  if (isBlockedTargetHost(resolvedIp)) {
    throw new Error('Blocked target host for proxy request (SSRF protection)');
  }
  return resolvedIp;
}

function openSocks5Tunnel(proxyInfo, targetHost, targetPort, signal, timeoutOverrideMs = 0) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Request aborted'));
      return;
    }
    if (!targetHost || /[\u0000-\u001f\u007f\s]/.test(targetHost) || !Number.isInteger(targetPort) || targetPort < 1 || targetPort > 65535) {
      reject(new Error('Invalid SOCKS5 target host or port'));
      return;
    }
    const hasAuth = Boolean(proxyInfo.username || proxyInfo.password);
    const userBuf = hasAuth ? Buffer.from(proxyInfo.username || '', 'utf8') : Buffer.alloc(0);
    const passBuf = hasAuth ? Buffer.from(proxyInfo.password || '', 'utf8') : Buffer.alloc(0);
    if (userBuf.length > 255 || passBuf.length > 255) {
      reject(new Error('SOCKS5 credentials exceed 255-byte RFC 1929 limit'));
      return;
    }

    const ipVer = net.isIP(targetHost);
    let addrPacket;
    if (ipVer === 4) {
      const octets = parseIpv4Octets(targetHost);
      if (!octets) {
        reject(new Error('Invalid SOCKS5 IPv4 target address'));
        return;
      }
      addrPacket = Buffer.from([0x01, octets[0], octets[1], octets[2], octets[3]]);
    } else if (ipVer === 6) {
      const hextets = parseIpv6Hextets(targetHost);
      if (!hextets) {
        reject(new Error('Invalid SOCKS5 IPv6 target address'));
        return;
      }
      addrPacket = Buffer.alloc(17);
      addrPacket[0] = 0x04;
      for (let i = 0; i < 8; i++) {
        addrPacket.writeUInt16BE(hextets[i], 1 + i * 2);
      }
    } else {
      const hostBuf = Buffer.from(targetHost, 'utf8');
      if (hostBuf.length < 1 || hostBuf.length > 255) {
        reject(new Error('Invalid SOCKS5 domain length'));
        return;
      }
      addrPacket = Buffer.concat([Buffer.from([0x03, hostBuf.length]), hostBuf]);
    }

    const portBuf = Buffer.from([(targetPort >> 8) & 0xff, targetPort & 0xff]);
    const connectReq = Buffer.concat([Buffer.from([0x05, 0x01, 0x00]), addrPacket, portBuf]);
    const socket = net.connect({ host: proxyInfo.hostname, port: proxyInfo.port });

    let settled = false;
    let stage = 'greeting';
    let needTail = 0;
    let rxBuf = Buffer.alloc(0);
    let handshakeTimer = null;

    const cleanupListeners = () => {
      if (handshakeTimer) {
        clearTimeout(handshakeTimer);
        handshakeTimer = null;
      }
      socket.removeListener('connect', onConnect);
      socket.removeListener('data', onData);
      socket.removeListener('error', onError);
      socket.removeListener('end', onPrematureClose);
      socket.removeListener('close', onPrematureClose);
      if (signal && typeof signal.removeEventListener === 'function') {
        try { signal.removeEventListener('abort', onAbort); } catch {}
      }
    };

    const fail = (err) => {
      if (settled) return;
      settled = true;
      cleanupListeners();
      socket.on('error', () => {});
      try { socket.destroy(); } catch {}
      reject(redactProxyErr(err, proxyInfo));
    };

    const onAbort = () => fail(new Error('Request aborted'));
    const onError = (err) => fail(err);
    const onPrematureClose = () => fail(new Error('SOCKS5 proxy closed connection during handshake'));

    const sendConnect = () => {
      stage = 'connect-head';
      socket.write(connectReq);
    };

    const onConnect = () => {
      if (settled) return;
      const greeting = hasAuth ? Buffer.from([0x05, 0x02, 0x00, 0x02]) : Buffer.from([0x05, 0x01, 0x00]);
      socket.write(greeting);
    };

    const SOCKS5_REP_ERRORS = {
      0x01: 'general SOCKS server failure',
      0x02: 'connection not allowed by ruleset',
      0x03: 'network unreachable',
      0x04: 'host unreachable',
      0x05: 'connection refused',
      0x06: 'TTL expired',
      0x07: 'command not supported',
      0x08: 'address type not supported',
    };

    const onData = (chunk) => {
      if (settled) return;
      rxBuf = rxBuf.length ? Buffer.concat([rxBuf, chunk]) : Buffer.from(chunk);
      if (rxBuf.length > 4096) {
        fail(new Error('SOCKS5 handshake response exceeded size limit'));
        return;
      }

      while (!settled) {
        if (stage === 'greeting') {
          if (rxBuf.length < 2) return;
          const ver = rxBuf[0];
          const method = rxBuf[1];
          rxBuf = rxBuf.subarray(2);
          if (ver !== 0x05) return fail(new Error(`Invalid SOCKS5 server version: ${ver}`));
          if (method === 0x00) {
            sendConnect();
          } else if (method === 0x02) {
            if (!hasAuth) return fail(new Error('SOCKS5 proxy requires username/password authentication'));
            stage = 'auth';
            socket.write(Buffer.concat([Buffer.from([0x01, userBuf.length]), userBuf, Buffer.from([passBuf.length]), passBuf]));
          } else if (method === 0xff) {
            return fail(new Error('SOCKS5 proxy rejected authentication methods'));
          } else {
            return fail(new Error(`Unsupported SOCKS5 authentication method: 0x${method.toString(16)}`));
          }
        } else if (stage === 'auth') {
          if (rxBuf.length < 2) return;
          const authVer = rxBuf[0];
          const status = rxBuf[1];
          rxBuf = rxBuf.subarray(2);
          if (authVer !== 0x01 || status !== 0x00) {
            return fail(new Error(`SOCKS5 authentication failed (status ${status})`));
          }
          sendConnect();
        } else if (stage === 'connect-head') {
          if (rxBuf.length < 4) return;
          const ver = rxBuf[0];
          const rep = rxBuf[1];
          const atyp = rxBuf[3];
          rxBuf = rxBuf.subarray(4);
          if (ver !== 0x05) return fail(new Error(`Invalid SOCKS5 connect reply version: ${ver}`));
          if (rep !== 0x00) {
            return fail(new Error(`SOCKS5 CONNECT rejected (${SOCKS5_REP_ERRORS[rep] || `error code 0x${rep.toString(16)}`})`));
          }
          if (atyp === 0x01) {
            needTail = 6;
            stage = 'connect-tail';
          } else if (atyp === 0x04) {
            needTail = 18;
            stage = 'connect-tail';
          } else if (atyp === 0x03) {
            stage = 'connect-domain-len';
          } else {
            return fail(new Error(`Unsupported SOCKS5 reply address type: 0x${atyp.toString(16)}`));
          }
        } else if (stage === 'connect-domain-len') {
          if (rxBuf.length < 1) return;
          needTail = rxBuf[0] + 2;
          rxBuf = rxBuf.subarray(1);
          stage = 'connect-tail';
        } else if (stage === 'connect-tail') {
          if (rxBuf.length < needTail) return;
          const remainder = rxBuf.subarray(needTail);
          settled = true;
          cleanupListeners();
          socket.on('error', (err) => {
            if (!socket.__agsHandoverErr) socket.__agsHandoverErr = err;
          });
          socket.pause();
          if (remainder.length > 0) socket.unshift(remainder);
          resolve(socket);
          return;
        }
      }
    };

    const timeoutMs = timeoutOverrideMs > 0 ? timeoutOverrideMs : SOCKS5_HANDSHAKE_TIMEOUT_MS;
    handshakeTimer = setTimeout(() => fail(new Error('SOCKS5 handshake timed out')), timeoutMs);
    if (handshakeTimer.unref) handshakeTimer.unref();
    if (signal && typeof signal.addEventListener === 'function') {
      signal.addEventListener('abort', onAbort, { once: true });
    }
    socket.once('connect', onConnect);
    socket.on('data', onData);
    socket.once('error', onError);
    socket.once('end', onPrematureClose);
    socket.once('close', onPrematureClose);
  });
}

function openConnectTunnel(proxyInfo, authority, proxyAuthHeader, signal, tlsOptions = null, timeoutOverrideMs = 0) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Request aborted'));
      return;
    }
    if (!authority || /[\r\n\0\s]/.test(authority)) {
      reject(new Error('Invalid CONNECT target authority'));
      return;
    }

    const socket =
      proxyInfo.protocol === 'https:'
        ? tls.connect({
            host: proxyInfo.hostname,
            port: proxyInfo.port,
            servername: net.isIP(proxyInfo.hostname) ? undefined : proxyInfo.hostname,
            ...(tlsOptions || {}),
          })
        : net.connect({
            host: proxyInfo.hostname,
            port: proxyInfo.port,
          });

    let settled = false;
    let headerBuf = Buffer.alloc(0);
    let handshakeTimer = null;

    const cleanupListeners = () => {
      if (handshakeTimer) {
        clearTimeout(handshakeTimer);
        handshakeTimer = null;
      }
      socket.removeListener('connect', onConnect);
      socket.removeListener('secureConnect', onConnect);
      socket.removeListener('data', onData);
      socket.removeListener('error', onError);
      socket.removeListener('end', onPrematureClose);
      socket.removeListener('close', onPrematureClose);
      if (signal && typeof signal.removeEventListener === 'function') {
        try { signal.removeEventListener('abort', onAbort); } catch {}
      }
    };

    const fail = (err) => {
      if (settled) return;
      settled = true;
      cleanupListeners();
      socket.on('error', () => {});
      try { socket.destroy(); } catch {}
      reject(redactProxyErr(err, proxyInfo));
    };

    const onAbort = () => fail(new Error('Request aborted'));
    const onError = (err) => fail(err);
    const onPrematureClose = () => fail(new Error('Proxy closed connection during CONNECT'));

    const onConnect = () => {
      if (settled) return;
      const lines = [`CONNECT ${authority} HTTP/1.1`, `Host: ${authority}`, 'Proxy-Connection: Keep-Alive'];
      if (proxyAuthHeader) lines.push(`Proxy-Authorization: ${proxyAuthHeader}`);
      lines.push('', '');
      socket.write(lines.join('\r\n'));
    };

    const onData = (chunk) => {
      if (settled) return;
      headerBuf = headerBuf.length ? Buffer.concat([headerBuf, chunk]) : Buffer.from(chunk);
      let sepIdx = headerBuf.indexOf('\r\n\r\n');
      let sepLen = 4;
      if (sepIdx === -1) {
        sepIdx = headerBuf.indexOf('\n\n');
        sepLen = 2;
      }
      if (sepIdx === -1) {
        if (headerBuf.length > MAX_CONNECT_HEADER_BYTES) {
          fail(new Error('Proxy CONNECT response header exceeded size limit'));
        }
        return;
      }

      const headerText = headerBuf.subarray(0, sepIdx).toString('latin1');
      const remainder = headerBuf.subarray(sepIdx + sepLen);
      const statusLine = headerText.split(/\r?\n/)[0] || '';
      const statusMatch = /^HTTP\/\d\.\d\s+(\d{3})(?:\s+(.*))?$/i.exec(statusLine.trim());
      const statusCode = statusMatch ? Number(statusMatch[1]) : 0;
      if (statusCode !== 200) {
        const reason = statusMatch && statusMatch[2] ? ` ${statusMatch[2].trim()}` : '';
        fail(new Error(`Proxy CONNECT rejected (HTTP ${statusCode || 'invalid'}${reason})`));
        return;
      }

      settled = true;
      cleanupListeners();
      socket.on('error', (err) => {
        if (!socket.__agsHandoverErr) socket.__agsHandoverErr = err;
      });
      socket.pause();
      if (remainder.length > 0) socket.unshift(remainder);
      resolve(socket);
    };

    const timeoutMs = timeoutOverrideMs > 0 ? timeoutOverrideMs : CONNECT_HANDSHAKE_TIMEOUT_MS;
    handshakeTimer = setTimeout(() => fail(new Error('Proxy CONNECT handshake timed out')), timeoutMs);
    if (handshakeTimer.unref) handshakeTimer.unref();
    if (signal && typeof signal.addEventListener === 'function') {
      signal.addEventListener('abort', onAbort, { once: true });
    }
    socket.once(proxyInfo.protocol === 'https:' ? 'secureConnect' : 'connect', onConnect);
    socket.on('data', onData);
    socket.once('error', onError);
    socket.once('end', onPrematureClose);
    socket.once('close', onPrematureClose);
  });
}

function buildFetchLikeResponse(incomingRes, cleanupAbort, activeState) {
  const status = Number(incomingRes.statusCode) || 0;
  const headers = new Headers();
  for (const [k, v] of Object.entries(incomingRes.headers || {})) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) headers.append(k, String(item));
    } else {
      headers.append(k, String(v));
    }
  }

  const enc = String(incomingRes.headers['content-encoding'] || '').trim().toLowerCase();
  let streamForBody = incomingRes;
  let decompressor = null;
  if (enc === 'gzip' || enc === 'x-gzip') {
    decompressor = zlib.createGunzip({ maxOutputLength: MAX_STREAM_BYTES });
  } else if (enc === 'deflate') {
    decompressor = zlib.createInflate({ maxOutputLength: MAX_STREAM_BYTES });
  } else if (enc === 'br') {
    decompressor = zlib.createBrotliDecompress({ maxOutputLength: MAX_STREAM_BYTES });
  }

  if (decompressor) {
    let decompressedBytes = 0;
    const limiter = new Transform({
      transform(chunk, _encoding, cb) {
        decompressedBytes += chunk.byteLength;
        if (decompressedBytes > MAX_STREAM_BYTES) {
          const limitErr = new Error(`Decompressed response exceeded size limit (${MAX_STREAM_BYTES} bytes)`);
          if (!decompressor.destroyed) decompressor.destroy(limitErr);
          if (!incomingRes.destroyed) incomingRes.destroy();
          cb(limitErr);
          return;
        }
        cb(null, chunk);
      },
    });
    incomingRes.on('error', (err) => {
      if (!decompressor.destroyed) decompressor.destroy(err);
      if (!limiter.destroyed) limiter.destroy(err);
    });
    decompressor.on('error', (err) => {
      if (!limiter.destroyed) limiter.destroy(err);
    });
    streamForBody = incomingRes.pipe(decompressor).pipe(limiter);
    streamForBody.once('close', () => {
      if (!decompressor.destroyed) decompressor.destroy();
    });
  }
  activeState.bodyStream = streamForBody;

  streamForBody.once('close', () => {
    cleanupAbort();
    if (streamForBody !== incomingRes && !incomingRes.destroyed) incomingRes.destroy();
  });
  streamForBody.once('end', cleanupAbort);

  const webBody = Readable.toWeb(streamForBody);
  let consumed = false;
  const readAllText = async () => {
    if (consumed) throw new Error('Body already consumed');
    consumed = true;
    const reader = webBody.getReader();
    const chunks = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const buf = Buffer.from(value);
        total += buf.byteLength;
        if (total > MAX_STREAM_BYTES) {
          try { await reader.cancel(); } catch {}
          throw new Error(`Response body exceeded size limit (${MAX_STREAM_BYTES} bytes)`);
        }
        chunks.push(buf);
      }
    } finally {
      try { reader.releaseLock(); } catch {}
      cleanupAbort();
    }
    return Buffer.concat(chunks, total).toString('utf8');
  };

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(incomingRes.statusMessage || ''),
    headers,
    body: webBody,
    async text() {
      return readAllText();
    },
    async json() {
      return JSON.parse(await readAllText());
    },
  };
}

/**
 * Performs an HTTP(S) request either directly (Node http/https) or via HTTP CONNECT / SOCKS5/SOCKS5h tunnel.
 * Redirects (3xx) are strictly blocked so API keys never leak cross-origin.
 */
async function performNodeHttpRequest(urlStr, init = {}, proxyInfo = null, transportOpts = {}) {
  let target;
  try {
    target = new URL(String(urlStr || ''));
  } catch {
    throw new Error('Invalid request URL');
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    throw new Error(`Unsupported protocol: ${target.protocol}`);
  }

  const targetHost = target.hostname.replace(/^\[|\]$/g, '');
  const defaultPort = target.protocol === 'https:' ? 443 : 80;
  const targetPort = target.port ? Number(target.port) : defaultPort;
  if (!targetHost || /[\r\n\0\s]/.test(targetHost) || !Number.isInteger(targetPort) || targetPort < 1 || targetPort > 65535) {
    throw new Error('Invalid target host or port');
  }
  if (isBlockedTargetHost(targetHost)) {
    throw new Error('Blocked target host (SSRF protection)');
  }
  if (BLOCKED_AI_PORTS.has(targetPort)) {
    throw new Error(`Blocked target port: ${targetPort}`);
  }

  const signal = init.signal || null;
  if (signal?.aborted) throw new Error('Request aborted');

  const method = String(init.method || 'GET').toUpperCase();
  const reqHeaders = normalizeHeaders(init.headers);
  const formattedHost = targetHost.includes(':') ? `[${targetHost}]` : targetHost;
  const hostHeader = targetPort === defaultPort ? formattedHost : `${formattedHost}:${targetPort}`;
  if (!hasHeaderIgnoreCase(reqHeaders, 'host')) reqHeaders.Host = hostHeader;
  if (!hasHeaderIgnoreCase(reqHeaders, 'accept-encoding')) reqHeaders['Accept-Encoding'] = 'identity';
  if (!hasHeaderIgnoreCase(reqHeaders, 'connection')) reqHeaders.Connection = 'close';

  let bodyBuf = null;
  if (init.body !== undefined && init.body !== null) {
    if (typeof init.body === 'string') bodyBuf = Buffer.from(init.body, 'utf8');
    else if (Buffer.isBuffer(init.body)) bodyBuf = init.body;
    else if (ArrayBuffer.isView(init.body)) bodyBuf = Buffer.from(init.body.buffer, init.body.byteOffset, init.body.byteLength);
    else bodyBuf = Buffer.from(String(init.body), 'utf8');
    if (!hasHeaderIgnoreCase(reqHeaders, 'content-length')) {
      reqHeaders['Content-Length'] = String(bodyBuf.byteLength);
    }
  }

  const isHttpsTarget = target.protocol === 'https:';
  const isSocks5 = Boolean(proxyInfo && (proxyInfo.protocol === 'socks5:' || proxyInfo.protocol === 'socks5h:'));
  const proxyAuthHeader =
    proxyInfo && !isSocks5 && (proxyInfo.username || proxyInfo.password)
      ? `Basic ${Buffer.from(`${proxyInfo.username}:${proxyInfo.password}`, 'utf8').toString('base64')}`
      : '';

  let tunnelSocket = null;
  let tlsSocket = null;

  if (proxyInfo) {
    if (isSocks5) {
      const socksHost = await resolveSocks5ConnectHost(proxyInfo, targetHost, signal, transportOpts.dnsLookup);
      tunnelSocket = await openSocks5Tunnel(proxyInfo, socksHost, targetPort, signal, transportOpts.socks5HandshakeTimeoutMs);
    } else if (isHttpsTarget) {
      const authority = `${formattedHost}:${targetPort}`;
      tunnelSocket = await openConnectTunnel(
        proxyInfo,
        authority,
        proxyAuthHeader,
        signal,
        transportOpts.tlsOptions,
        transportOpts.connectHandshakeTimeoutMs
      );
    }
    if (tunnelSocket && (tunnelSocket.__agsHandoverErr || tunnelSocket.destroyed)) {
      const err = tunnelSocket.__agsHandoverErr || new Error('Proxy tunnel closed before request handover');
      try { tunnelSocket.destroy(); } catch {}
      throw redactProxyErr(err, proxyInfo);
    }
  }

  return await new Promise((resolve, reject) => {
    let settled = false;
    let activeReq = null;
    let activeIncomingRes = null;
    const activeState = { bodyStream: null };
    let abortAttached = false;

    const destroyAll = (destroyErr) => {
      if (activeState.bodyStream && activeState.bodyStream !== activeIncomingRes) {
        try { activeState.bodyStream.destroy(destroyErr); } catch {}
      }
      if (activeIncomingRes) {
        activeIncomingRes.on('error', () => {});
        try { activeIncomingRes.destroy(); } catch {}
      }
      if (activeReq) {
        activeReq.on('error', () => {});
        try { activeReq.destroy(); } catch {}
      }
      if (tlsSocket) {
        tlsSocket.on('error', () => {});
        try { tlsSocket.destroy(); } catch {}
      }
      if (tunnelSocket) {
        tunnelSocket.on('error', () => {});
        try { tunnelSocket.destroy(); } catch {}
      }
    };

    const cleanupAbort = () => {
      if (abortAttached && signal && typeof signal.removeEventListener === 'function') {
        abortAttached = false;
        try { signal.removeEventListener('abort', onAbort); } catch {}
      }
    };

    const failBeforeResponse = (err) => {
      if (settled) return;
      settled = true;
      cleanupAbort();
      destroyAll();
      reject(proxyInfo ? redactProxyErr(err, proxyInfo) : err);
    };

    const onAbort = () => {
      const abortErr = new Error('Request aborted');
      if (!settled) {
        failBeforeResponse(abortErr);
      } else {
        cleanupAbort();
        destroyAll(abortErr);
      }
    };

    if (signal) {
      if (signal.aborted) {
        failBeforeResponse(new Error('Request aborted'));
        return;
      }
      if (typeof signal.addEventListener === 'function') {
        signal.addEventListener('abort', onAbort, { once: true });
        abortAttached = true;
      }
    }

    const onResponse = (incomingRes) => {
      if (settled) {
        incomingRes.on('error', () => {});
        incomingRes.destroy();
        return;
      }
      activeIncomingRes = incomingRes;
      const status = Number(incomingRes.statusCode) || 0;
      if (status >= 300 && status < 400) {
        failBeforeResponse(new Error(`Redirect blocked (HTTP ${status})`));
        return;
      }
      settled = true;
      resolve(buildFetchLikeResponse(incomingRes, cleanupAbort, activeState));
    };

    try {
      if (!proxyInfo) {
        const reqFn = isHttpsTarget ? https.request : http.request;
        activeReq = reqFn(
          {
            hostname: targetHost,
            port: targetPort,
            method,
            path: `${target.pathname || '/'}${target.search || ''}`,
            headers: reqHeaders,
            agent: false,
            ...(isHttpsTarget && transportOpts.tlsOptions ? transportOpts.tlsOptions : {}),
          },
          onResponse
        );
      } else if (isHttpsTarget) {
        activeReq = http.request(
          {
            host: targetHost,
            port: targetPort,
            method,
            path: `${target.pathname || '/'}${target.search || ''}`,
            headers: reqHeaders,
            createConnection: () => {
              tlsSocket = tls.connect({
                socket: tunnelSocket,
                servername: net.isIP(targetHost) ? undefined : targetHost,
                ...(transportOpts.tlsOptions || {}),
              });
              tlsSocket.once('close', () => {
                if (tunnelSocket && !tunnelSocket.destroyed) tunnelSocket.destroy();
              });
              return tlsSocket;
            },
          },
          onResponse
        );
      } else if (isSocks5) {
        activeReq = http.request(
          {
            host: targetHost,
            port: targetPort,
            method,
            path: `${target.pathname || '/'}${target.search || ''}`,
            headers: reqHeaders,
            createConnection: () => {
              process.nextTick(() => {
                if (tunnelSocket && !tunnelSocket.destroyed) tunnelSocket.resume();
              });
              return tunnelSocket;
            },
          },
          onResponse
        );
      } else {
        const httpHeaders = { ...reqHeaders };
        if (proxyAuthHeader && !hasHeaderIgnoreCase(httpHeaders, 'proxy-authorization')) {
          httpHeaders['Proxy-Authorization'] = proxyAuthHeader;
        }
        const reqFn = proxyInfo.protocol === 'https:' ? https.request : http.request;
        activeReq = reqFn(
          {
            host: proxyInfo.hostname,
            port: proxyInfo.port,
            method,
            path: target.href,
            headers: httpHeaders,
            agent: false,
            ...(proxyInfo.protocol === 'https:'
              ? {
                  servername: net.isIP(proxyInfo.hostname) ? '' : proxyInfo.hostname,
                  ...(transportOpts.tlsOptions || {}),
                }
              : {}),
          },
          onResponse
        );
      }
    } catch (err) {
      failBeforeResponse(err);
      return;
    }

    activeReq.on('error', (err) => {
      if (!settled) {
        failBeforeResponse(err);
      } else if (activeState.bodyStream && !activeState.bodyStream.destroyed) {
        activeState.bodyStream.destroy(proxyInfo ? redactProxyErr(err, proxyInfo) : err);
      }
    });

    if (bodyBuf && bodyBuf.byteLength > 0) activeReq.write(bodyBuf);
    activeReq.end();
  });
}

function createManagedTimeoutSignal(timeoutMs) {
  const ctl = new AbortController();
  let timer = setTimeout(() => {
    timer = null;
    const err = Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });
    ctl.abort(err);
  }, timeoutMs);
  if (timer.unref) timer.unref();
  return {
    signal: ctl.signal,
    cleanup() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}

function composeAbortSignal(timeoutMs, externalSignal = null) {
  if (!externalSignal) return createManagedTimeoutSignal(timeoutMs);
  if (externalSignal.aborted) return { signal: externalSignal, cleanup() {} };
  const managed = createManagedTimeoutSignal(timeoutMs);
  const ctl = new AbortController();
  const cleanup = () => {
    managed.cleanup();
    try { managed.signal.removeEventListener('abort', onTimeoutAbort); } catch {}
    try { externalSignal.removeEventListener?.('abort', onExternalAbort); } catch {}
  };
  const onTimeoutAbort = () => {
    cleanup();
    if (!ctl.signal.aborted) ctl.abort(managed.signal.reason);
  };
  const onExternalAbort = () => {
    cleanup();
    if (!ctl.signal.aborted) ctl.abort(externalSignal.reason);
  };
  managed.signal.addEventListener('abort', onTimeoutAbort, { once: true });
  externalSignal.addEventListener?.('abort', onExternalAbort, { once: true });
  return { signal: ctl.signal, cleanup };
}

async function readResponseTextBounded(res, maxBytes = MAX_RESPONSE_BYTES) {
  if (res?.body && typeof res.body.getReader === 'function') {
    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const buf = Buffer.from(value);
        total += buf.byteLength;
        if (total > maxBytes) {
          try { await reader.cancel(); } catch {}
          throw new Error('Upstream response exceeded size limit');
        }
        chunks.push(buf);
      }
    } finally {
      try { reader.releaseLock(); } catch {}
    }
    return Buffer.concat(chunks, total).toString('utf8');
  }
  const text = await res.text();
  if (Buffer.byteLength(text, 'utf8') > maxBytes) {
    throw new Error('Upstream response exceeded size limit');
  }
  return text;
}

/**
 * Protects code identifiers, file paths, #L line references, and backticked snippets
 * with collision-free __OPID_N__ placeholders for machine translation.
 */
function protectInlineTokens(text, opts = {}) {
  const src = String(text || '');
  if (!src) return { masked: '', tokens: [] };
  const tokens = [];
  let masked = src;
  let tag = 'OPID';
  if (/__\s*OPID/i.test(src)) {
    do {
      tag = `OPID_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    } while (src.toUpperCase().includes(tag));
  }
  const tokenPrefix = `__${tag}_`;
  const patterns = opts.minimal ? MINIMAL_PROTECT_PATTERNS : INLINE_PROTECT_PATTERNS;
  for (const re of patterns) {
    re.lastIndex = 0;
    masked = masked.replace(re, (match) => {
      if (!match || match.includes(tokenPrefix)) return match;
      const idx = tokens.push(match) - 1;
      return `${tokenPrefix}${idx}__`;
    });
  }
  if (tag !== 'OPID') {
    Object.defineProperty(tokens, '__opidTag', { value: tag, enumerable: false, configurable: true });
  }
  return { masked, tokens };
}

/**
 * Restores __OPID_N__ placeholders back to original protected tokens.
 */
function restoreInlineTokens(translated, tokens = []) {
  const raw = String(translated || '');
  const tokList = Array.isArray(tokens) ? tokens : Array.isArray(tokens?.tokens) ? tokens.tokens : [];
  if (!tokList.length) {
    return { ok: true, text: raw, missing: [] };
  }
  const tag =
    typeof tokList.__opidTag === 'string' && /^[A-Z0-9_]+$/.test(tokList.__opidTag) ? tokList.__opidTag : 'OPID';
  const restoreRe = new RegExp(`__\\s*${tag}\\s*_?\\s*(\\d+)\\s*__`, 'gi');
  const seen = new Set();
  const restored = raw.replace(restoreRe, (full, numStr) => {
    const idx = Number(numStr);
    if (!Number.isInteger(idx) || idx < 0 || idx >= tokList.length) return full;
    seen.add(idx);
    return tokList[idx];
  });
  const missing = [];
  for (let i = 0; i < tokList.length; i++) {
    if (!seen.has(i)) missing.push(i);
  }
  const leftoverRe = new RegExp(`__\\s*${tag}\\s*_?\\s*\\d+\\s*__`, 'i');
  if (missing.length > 0 || leftoverRe.test(restored)) {
    return { ok: false, text: restored, missing };
  }
  return { ok: true, text: restored, missing: [] };
}

/**
 * Splits long thought text into bounded chunks at paragraph/line/word boundaries.
 */
function chunkThoughtText(rawText, maxChunkOrOpts = MAX_SINGLE_THOUGHT_CHARS, maxTotalChars = MAX_TOTAL_THOUGHT_CHARS) {
  const text = String(rawText || '').trim();
  const originalLength = text.length;
  if (!text) {
    return { chunks: [], truncated: false, originalLength: 0, translatedLength: 0 };
  }

  let chunkLimit = MAX_SINGLE_THOUGHT_CHARS;
  let totalLimit = MAX_TOTAL_THOUGHT_CHARS;
  let maxChunks = Infinity;

  if (maxChunkOrOpts && typeof maxChunkOrOpts === 'object') {
    chunkLimit = Math.max(32, Number(maxChunkOrOpts.maxChunkChars) || MAX_SINGLE_THOUGHT_CHARS);
    totalLimit = Math.max(chunkLimit, Number(maxChunkOrOpts.maxTotalChars) || MAX_TOTAL_THOUGHT_CHARS);
    if (Number.isFinite(maxChunkOrOpts.maxChunks) && maxChunkOrOpts.maxChunks > 0) {
      maxChunks = Math.floor(maxChunkOrOpts.maxChunks);
    }
  } else {
    chunkLimit = Math.max(32, Number(maxChunkOrOpts) || MAX_SINGLE_THOUGHT_CHARS);
    totalLimit = Math.max(chunkLimit, Number(maxTotalChars) || MAX_TOTAL_THOUGHT_CHARS);
  }

  if (originalLength <= chunkLimit) {
    return { chunks: [text], truncated: false, originalLength, translatedLength: originalLength };
  }

  const pickCutIndex = (str, start, limit) => {
    const hardEnd = Math.min(str.length, start + limit);
    if (hardEnd >= str.length) return str.length;
    const minSearch = start + Math.floor(limit * 0.55);
    const paraIdx = str.lastIndexOf('\n\n', hardEnd);
    if (paraIdx >= minSearch) return paraIdx;
    const lineIdx = str.lastIndexOf('\n', hardEnd);
    if (lineIdx >= minSearch) return lineIdx;
    const spaceIdx = str.lastIndexOf(' ', hardEnd);
    if (spaceIdx >= start + Math.floor(limit * 0.75)) return spaceIdx;
    return hardEnd;
  };

  const effectiveLimit = Math.min(originalLength, totalLimit);
  const capped = text.slice(0, effectiveLimit);
  const chunks = [];
  let cursor = 0;
  let translatedLength = 0;

  while (cursor < capped.length && chunks.length < maxChunks) {
    const remaining = capped.length - cursor;
    if (remaining <= chunkLimit) {
      const part = capped.slice(cursor).trim();
      if (part) {
        chunks.push(part);
        translatedLength += part.length;
      }
      cursor = capped.length;
      break;
    }
    const cut = pickCutIndex(capped, cursor, chunkLimit);
    const nextEnd = cut > cursor ? cut : Math.min(capped.length, cursor + chunkLimit);
    const part = capped.slice(cursor, nextEnd).trim();
    if (part) {
      chunks.push(part);
      translatedLength += part.length;
    }
    cursor = nextEnd;
    while (cursor < capped.length && (capped[cursor] === '\n' || capped[cursor] === '\r' || capped[cursor] === ' ')) {
      cursor++;
    }
  }

  return {
    chunks,
    truncated: originalLength > totalLimit || cursor < originalLength,
    originalLength,
    translatedLength,
  };
}

function stripNonProseForLangCheck(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]+`/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[A-Za-z]:[\\/][^\s"'<>|]+/g, ' ')
    .replace(/(?:\/[A-Za-z0-9._-]+){2,}/g, ' ');
}

function hasForeignProseParagraph(prose, targetLang) {
  const paras = prose.split(/\n+/);
  for (let i = 0; i < paras.length; i++) {
    const para = paras[i].trim();
    if (!para) continue;
    const pLatin = (para.match(/[A-Za-z]{3,}/g) || []).length;
    const pCjk = (para.match(/[\u4e00-\u9fa5]/g) || []).length;
    const pKana = (para.match(/[\u3040-\u30ff]/g) || []).length;
    const pHangul = (para.match(/[\uac00-\ud7af]/g) || []).length;
    if (targetLang === 'en') {
      if (pCjk + pKana + pHangul >= 4) return true;
    } else if (targetLang === 'ja') {
      if ((pLatin >= 6 && pKana < pLatin * 1.5) || (pCjk >= 12 && pKana === 0)) return true;
    } else if (targetLang === 'ko') {
      if ((pLatin >= 6 && pHangul < pLatin * 1.5) || pCjk >= 6 || pKana >= 6) return true;
    } else if (targetLang === 'es' || targetLang === 'fr' || targetLang === 'de') {
      if (pCjk + pKana + pHangul >= 4 || pLatin >= 4) return true;
    } else {
      if ((pLatin >= 6 && pCjk < pLatin * 1.5) || pKana >= 6 || pHangul >= 6) return true;
    }
  }
  return false;
}

function isAlreadyTargetLang(text, targetLang = 'zh-CN') {
  const norm = String(text || '').trim();
  if (!norm || norm.length < 4) return true;
  const sample = norm.length > MAX_SINGLE_THOUGHT_CHARS ? norm.slice(0, MAX_SINGLE_THOUGHT_CHARS) : norm;
  const tl = normalizeTargetLang(targetLang);
  const prose = stripNonProseForLangCheck(sample);
  if (!prose.trim()) return true;

  const latinWords = (prose.match(/[A-Za-z]{3,}/g) || []).length;
  const latinChars = (prose.match(/[A-Za-z]/g) || []).length;
  const cjk = (prose.match(/[\u4e00-\u9fa5]/g) || []).length;
  const kana = (prose.match(/[\u3040-\u30ff]/g) || []).length;
  const hangul = (prose.match(/[\uac00-\ud7af]/g) || []).length;
  const totalAlpha = latinChars + cjk + kana + hangul;

  if (tl === 'en') {
    if (cjk + kana + hangul >= 4) return false;
    return true;
  }
  if (totalAlpha < 10) return true;
  if (tl === 'zh-TW') return false;
  if (tl === 'es' || tl === 'fr' || tl === 'de') return false;
  if (tl === 'ja') {
    if (latinWords >= 8 || hasForeignProseParagraph(prose, 'ja')) return false;
    return kana >= 8;
  }
  if (tl === 'ko') {
    if (latinWords >= 8 || cjk >= 6 || kana >= 6 || hasForeignProseParagraph(prose, 'ko')) return false;
    return hangul >= 6;
  }
  if (latinWords >= 8 || kana >= 6 || hangul >= 6 || hasForeignProseParagraph(prose, tl)) return false;
  if (latinWords < 6 && kana < 4 && hangul < 4 && cjk >= 6) return true;
  return false;
}

function shouldKeepMachineParagraph(paragraph, targetLang) {
  const p = String(paragraph || '').trim();
  if (!p) return true;
  const prose = stripNonProseForLangCheck(p).trim();
  if (!prose) return true;
  const tl = normalizeTargetLang(targetLang);
  if (tl === 'zh-TW' || tl === 'es' || tl === 'fr' || tl === 'de') return false;
  const latinWords = (prose.match(/[A-Za-z]{3,}/g) || []).length;
  const cjk = (prose.match(/[\u4e00-\u9fa5]/g) || []).length;
  const kana = (prose.match(/[\u3040-\u30ff]/g) || []).length;
  const hangul = (prose.match(/[\uac00-\ud7af]/g) || []).length;
  if (tl === 'en') return cjk + kana + hangul === 0;
  if (tl === 'ja') return latinWords < 6 && kana >= 4 && !(cjk >= 8 && kana === 0);
  if (tl === 'ko') return latinWords < 6 && hangul >= 4 && cjk < 6 && kana === 0;
  if (cjk >= 2 && latinWords === 0 && kana === 0 && hangul === 0) return true;
  return isAlreadyTargetLang(p, 'zh-CN');
}

function stripThinkTagsAndQuotes(text) {
  let s = String(text || '');
  if (s.includes('<') && /<think|<\/?thought_source/i.test(s)) {
    s = s.replace(/<think>[\s\S]*?<\/think>/gi, '');
    if (/<think>/i.test(s) && !/<\/think>/i.test(s)) {
      s = s.replace(/<think>[\s\S]*$/i, '');
    }
    s = s.replace(/<\/?thought_source>/gi, '');
  }
  return s.trim();
}

function buildNoThinkingParams(model, baseUrl = '') {
  const m = String(model || '').trim().toLowerCase();
  if (!m) return null;
  const isOllamaPort = /:11434(?:\/|$)/.test(String(baseUrl || ''));
  if (/qwen3|qwq|qwen/i.test(m)) {
    const params = { enable_thinking: false, chat_template_kwargs: { enable_thinking: false } };
    if (isOllamaPort) params.reasoning_effort = 'none';
    return params;
  }
  if (/glm|zhipu|deepseek|doubao|kimi|moonshot/i.test(m)) {
    return { thinking: { type: 'disabled' } };
  }
  if (/^(?:o1|o3|o4)(?:[-_]|$)|gpt-5|reasoning/i.test(m)) {
    return { reasoning_effort: 'low' };
  }
  if (isOllamaPort && /r1|think|nemotron/i.test(m)) {
    return { reasoning_effort: 'none' };
  }
  return null;
}

function canonicalizeThoughtSkeleton(str) {
  return String(str || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]+/g, '')
    .toLowerCase();
}

function hashThoughtKey(rawText, modeTag = 'ai') {
  const norm = String(rawText || '').trim();
  if (!norm) return '';
  const skel = canonicalizeThoughtSkeleton(norm) || norm;
  let h = 2166136261;
  for (let i = 0; i < skel.length; i++) {
    h ^= skel.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${modeTag}_v3_${(h >>> 0).toString(36)}_${skel.length}`;
}

function computeStyleTag(thoughtCfg = {}) {
  const preset = thoughtCfg.stylePreset === 'concise' ? 'concise' : thoughtCfg.stylePreset === 'custom' ? 'custom' : 'technical';
  if (preset === 'custom') {
    const cp = String(thoughtCfg.customPrompt || '').trim();
    if (!cp) return 'ai_technical';
    let h = 2166136261;
    for (let i = 0; i < cp.length; i++) {
      h ^= cp.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return `ai_custom_${(h >>> 0).toString(36)}`;
  }
  return preset === 'concise' ? 'ai_concise' : 'ai_technical';
}

// --- LRU Disk-Backed Cache (per stateDir) ---
const cacheRegistry = new Map();

function getCacheFilePath(stateDir) {
  const dir = stateDir ? path.resolve(String(stateDir)) : getDefaultStateDir();
  return path.join(dir, 'thought-translate-cache.json');
}

function getCacheBucket(stateDir) {
  const cacheFile = getCacheFilePath(stateDir);
  let bucket = cacheRegistry.get(cacheFile);
  if (!bucket) {
    bucket = {
      cacheFile,
      map: new Map(),
      loaded: false,
      flushChain: Promise.resolve(),
      epoch: 0,
    };
    cacheRegistry.set(cacheFile, bucket);
  }
  return bucket;
}

function ensureCacheLoaded(bucket) {
  if (bucket.loaded) return;
  bucket.loaded = true;
  try {
    if (fs.existsSync(bucket.cacheFile)) {
      const raw = fs.readFileSync(bucket.cacheFile, 'utf8');
      const obj = JSON.parse(raw);
      const entries = obj?.entries && typeof obj.entries === 'object' ? obj.entries : obj;
      if (entries && typeof entries === 'object') {
        for (const [k, v] of Object.entries(entries)) {
          const val = typeof v === 'string' ? v : v?.text;
          if (k && typeof val === 'string' && val.trim()) {
            bucket.map.set(k, val);
          }
        }
      }
    }
  } catch {}
  while (bucket.map.size > MAX_CACHE_ENTRIES) {
    const oldest = bucket.map.keys().next().value;
    if (oldest === undefined) break;
    bucket.map.delete(oldest);
  }
}

function buildDiskCacheJson(bucket) {
  const entriesArr = Array.from(bucket.map.entries());
  const picked = [];
  let totalChars = 0;
  for (let i = entriesArr.length - 1; i >= 0 && picked.length < MAX_CACHE_ENTRIES; i--) {
    const [k, v] = entriesArr[i];
    if (!k || typeof v !== 'string' || v.length > MAX_DISK_ENTRY_CHARS) continue;
    if (totalChars + k.length + v.length > MAX_DISK_TOTAL_CHARS) break;
    totalChars += k.length + v.length;
    picked.push([k, v]);
  }
  const out = {};
  for (let i = picked.length - 1; i >= 0; i--) {
    out[picked[i][0]] = picked[i][1];
  }
  return JSON.stringify({ version: 1, entries: out });
}

function flushBucketSync(bucket) {
  const tmp = `${bucket.cacheFile}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  try {
    fs.mkdirSync(path.dirname(bucket.cacheFile), { recursive: true });
    fs.writeFileSync(tmp, buildDiskCacheJson(bucket), { encoding: 'utf8', mode: 0o600 });
    for (let attempt = 0; ; attempt++) {
      try {
        fs.renameSync(tmp, bucket.cacheFile);
        break;
      } catch (err) {
        if (process.platform !== 'win32' || attempt >= 3 || !['EBUSY', 'EPERM', 'EACCES'].includes(err?.code)) {
          throw err;
        }
      }
    }
  } catch {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {}
  }
}

function setCacheEntry(stateDir, key, value) {
  if (!key || !value || !String(value).trim()) return;
  const bucket = getCacheBucket(stateDir);
  ensureCacheLoaded(bucket);
  const trimmed = String(value).trim();
  const unchanged = bucket.map.get(key) === trimmed;
  if (bucket.map.has(key)) bucket.map.delete(key);
  bucket.map.set(key, trimmed);
  while (bucket.map.size > MAX_CACHE_ENTRIES) {
    const oldest = bucket.map.keys().next().value;
    if (oldest === undefined) break;
    bucket.map.delete(oldest);
  }
  if (!unchanged) {
    flushBucketSync(bucket);
  }
}

function getCacheEntry(stateDir, key) {
  const bucket = getCacheBucket(stateDir);
  ensureCacheLoaded(bucket);
  if (!bucket.map.has(key)) return null;
  const val = bucket.map.get(key);
  // Touch LRU order
  bucket.map.delete(key);
  bucket.map.set(key, val);
  return val;
}

/**
 * Clears both in-memory and disk-backed translation cache for the given stateDir (or default stateDir).
 */
function clearCache(stateDir = null) {
  let cleared = 0;
  const targets = stateDir ? [getCacheBucket(stateDir)] : Array.from(cacheRegistry.values());
  if (!targets.length) {
    targets.push(getCacheBucket(stateDir));
  }
  for (const bucket of targets) {
    ensureCacheLoaded(bucket);
    bucket.epoch++;
    cleared += bucket.map.size;
    bucket.map.clear();
    try {
      if (fs.existsSync(bucket.cacheFile)) {
        fs.unlinkSync(bucket.cacheFile);
      }
    } catch {}
  }
  return { ok: true, cleared, entries: 0 };
}

// --- Concurrency Scheduler (max 3) + In-flight Deduplication ---
let activeRequests = 0;
const waitQueue = [];
let queueSeq = 0;
const inflightMap = new Map();

function acquireSlot(priority = 0, signal = null) {
  if (signal?.aborted) {
    return Promise.resolve({ acquired: false, cancelled: true });
  }
  if (activeRequests < MAX_CONCURRENCY) {
    activeRequests++;
    return Promise.resolve({ acquired: true });
  }
  return new Promise((resolve) => {
    const item = {
      priority: Number(priority) || 0,
      seq: ++queueSeq,
      cancelled: false,
      cleanupAbort: null,
      resolve,
    };
    if (signal && typeof signal.addEventListener === 'function') {
      const onAbort = () => {
        const idx = waitQueue.indexOf(item);
        if (idx >= 0) waitQueue.splice(idx, 1);
        if (!item.cancelled) {
          item.cancelled = true;
          item.resolve({ acquired: false, cancelled: true });
        }
      };
      signal.addEventListener('abort', onAbort, { once: true });
      item.cleanupAbort = () => {
        try { signal.removeEventListener('abort', onAbort); } catch {}
      };
    }
    waitQueue.push(item);
  });
}

function releaseSlot() {
  activeRequests = Math.max(0, activeRequests - 1);
  while (activeRequests < MAX_CONCURRENCY && waitQueue.length > 0) {
    let bestIdx = 0;
    for (let i = 1; i < waitQueue.length; i++) {
      const cur = waitQueue[i];
      const best = waitQueue[bestIdx];
      if (cur.priority > best.priority || (cur.priority === best.priority && cur.seq > best.seq)) {
        bestIdx = i;
      }
    }
    const [next] = waitQueue.splice(bestIdx, 1);
    if (!next || next.cancelled) continue;
    if (next.cleanupAbort) {
      next.cleanupAbort();
      next.cleanupAbort = null;
    }
    activeRequests++;
    next.resolve({ acquired: true });
  }
}

function resolveEffectiveSettings(input = {}) {
  const cfg = input.config && typeof input.config === 'object' ? input.config : {};
  const thought = cfg.thought && typeof cfg.thought === 'object' ? cfg.thought : cfg;
  const proxyFallback = input.proxyFallback !== undefined
    ? input.proxyFallback
    : (cfg.proxy && typeof cfg.proxy === 'object' ? cfg.proxy : null);

  const modeRaw = String(input.mode || thought.mode || 'machine').trim().toLowerCase();
  const mode = modeRaw === 'ai' ? 'ai' : modeRaw === 'off' ? 'off' : 'machine';
  const kindRaw = String(input.kind || 'thought').trim().toLowerCase();
  const kind = kindRaw === 'tool_summary' || kindRaw === 'title' ? kindRaw : 'thought';
  const targetLang = normalizeTargetLang(input.targetLang || input.lang || thought.targetLang || cfg.i18n?.language);
  const stylePreset = (input.stylePreset || thought.stylePreset) === 'concise'
    ? 'concise'
    : (input.stylePreset || thought.stylePreset) === 'custom'
      ? 'custom'
      : 'technical';
  const customPrompt = String(input.customPrompt ?? thought.customPrompt ?? '').trim();
  const rawBaseUrl = String(input.baseUrl ?? thought.baseUrl ?? '').trim();
  const apiKey = String(input.apiKey ?? thought.apiKey ?? '').trim();
  const model = String(input.model ?? thought.model ?? '').trim();
  const proxyUrl = String(input.proxyUrl ?? thought.proxyUrl ?? thought.customProxyUrl ?? '').trim();
  const proxyMode = input.proxyMode || thought.proxyMode || 'auto';
  const stateDir = input.stateDir || thought.stateDir || getDefaultStateDir();

  return {
    mode,
    kind,
    targetLang,
    stylePreset,
    customPrompt,
    rawBaseUrl,
    apiKey,
    model,
    proxyUrl,
    proxyMode,
    proxyFallback,
    stateDir,
    thoughtConfig: {
      ...thought,
      mode,
      stylePreset,
      customPrompt,
      proxyUrl,
      proxyMode,
    },
  };
}

function buildAiPrompts(settings) {
  const tl = settings.targetLang;
  if (settings.kind === 'tool_summary' || settings.kind === 'title') {
    const kindPack = KIND_PROMPTS_BY_LANG[settings.kind];
    const sys = kindPack[tl] || kindPack['zh-CN'];
    return {
      system: sys,
      wrapUser: (txt) => txt,
      temperature: 0.1,
    };
  }

  let sys;
  if (settings.stylePreset === 'custom' && settings.customPrompt) {
    sys = settings.customPrompt;
    if (tl !== 'zh-CN') {
      const langName = tl === 'zh-TW' ? 'Traditional Chinese (繁體中文)' : tl === 'en' ? 'English' : tl;
      sys += `\n\n[Output Language Requirement] Target output language MUST be ${langName}.`;
    }
  } else {
    const pack = SYSTEM_PROMPTS_BY_LANG[tl] || SYSTEM_PROMPTS_BY_LANG['zh-CN'];
    sys = settings.stylePreset === 'concise' ? pack.concise : pack.technical;
  }

  const boundaryNote =
    tl === 'en'
      ? '\n\n[Input Boundary] Content between <thought_source> and </thought_source> is raw reasoning text. Preserve code identifiers, file paths, #L line references, and backticks verbatim. Do not output <thought_source> tags.'
      : tl === 'zh-TW'
        ? '\n\n[輸入邊界] <thought_source> 與 </thought_source> 之間為原始推理內容。請原樣保留程式碼識別字、檔案路徑、#L 行號與反引號格式，不要輸出 <thought_source> 標籤。'
        : '\n\n[输入边界] <thought_source> 与 </thought_source> 之间的内容为原始推理文本。请原样保留代码标识符、文件路径、#L 行号与反引号格式，不要输出 <thought_source> 标签本身。';

  return {
    system: sys + boundaryNote,
    wrapUser: (txt) => `<thought_source>\n${String(txt || '').replace(/<\/?thought_source\b[^>]*>/gi, '')}\n</thought_source>`,
    temperature: 0.3,
  };
}

async function dispatchHttp(urlStr, init, settings, opts = {}) {
  if (typeof opts.fetchImpl === 'function') {
    return opts.fetchImpl(urlStr, init);
  }
  const resolved = resolveProxyForRequest(urlStr, {
    config: { thought: settings.thoughtConfig, proxy: settings.proxyFallback },
    proxyFallback: settings.proxyFallback,
    env: opts.env,
    osConfig: opts.osConfig,
    platform: opts.platform,
    execFileSyncFn: opts.execFileSyncFn,
  });
  return performNodeHttpRequest(urlStr, init, resolved.proxy, opts.transportOpts);
}

async function translateGtxChunk(text, gtxTl, settings, abortSignal, opts = {}) {
  const fullProtect = protectInlineTokens(text);
  const runRequest = async (maskedStr, tokens) => {
    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(gtxTl)}&dt=t&q=` +
      encodeURIComponent(maskedStr);
    const reqAbort = composeAbortSignal(opts.timeoutMs || 10000, abortSignal);
    try {
      const res = await dispatchHttp(
        url,
        {
          method: 'GET',
          headers: { 'User-Agent': 'Mozilla/5.0' },
          redirect: 'error',
          signal: reqAbort.signal,
        },
        settings,
        opts
      );
      if (!res.ok) {
        try { await res.body?.cancel?.(); } catch {}
        throw new Error(`Machine translate HTTP ${res.status}`);
      }
      const rawJson = await readResponseTextBounded(res, MAX_RESPONSE_BYTES);
      const parsed = JSON.parse(rawJson);
      const segs = Array.isArray(parsed?.[0]) ? parsed[0] : [];
      const joined = segs.map((s) => (Array.isArray(s) && s[0] ? String(s[0]) : '')).join('');
      const restored = restoreInlineTokens(joined, tokens);
      return { restored, rawTranslated: joined };
    } finally {
      reqAbort.cleanup();
    }
  };

  const first = await runRequest(fullProtect.masked, fullProtect.tokens);
  if (first.restored.ok) {
    return first.restored.text.trim();
  }
  // For tool_summary or title, fail closed on token loss so identifiers are never corrupted.
  if (settings.kind === 'tool_summary' || settings.kind === 'title') {
    throw new Error('Protected inline token missing after translation');
  }
  // Retry thought chunk with minimal path/backtick protection if GTX mangled an identifier placeholder.
  const minimalProtect = protectInlineTokens(text, { minimal: true });
  const second = await runRequest(minimalProtect.masked, minimalProtect.tokens);
  return second.restored.ok ? second.restored.text.trim() : second.rawTranslated.trim();
}

async function translateWithMachine(rawText, settings, abortSignal, opts = {}) {
  const tl = settings.targetLang;
  const gtxTl = GTX_TARGET_LANG_MAP[tl] || 'zh-CN';
  const text = String(rawText || '').trim();
  if (!text) return '';

  if (settings.kind === 'tool_summary' || settings.kind === 'title') {
    return translateGtxChunk(text, gtxTl, settings, abortSignal, opts);
  }

  // Split fenced code blocks & paragraphs so fenced code blocks are never sent to GTX.
  const segments = [];
  const fenceRe = /(```[\s\S]*?```)/g;
  let lastIdx = 0;
  let m;
  while ((m = fenceRe.exec(text)) !== null) {
    if (m.index > lastIdx) {
      for (const p of text.slice(lastIdx, m.index).split(/\n{2,}/)) {
        if (p.trim()) segments.push({ kind: 'prose', text: p.trim() });
      }
    }
    segments.push({ kind: 'fence', text: m[1].trim() });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) {
    for (const p of text.slice(lastIdx).split(/\n{2,}/)) {
      if (p.trim()) segments.push({ kind: 'prose', text: p.trim() });
    }
  }

  const outParts = [];
  let pendingBatch = '';
  const flushBatch = async () => {
    if (!pendingBatch) return;
    const translated = await translateGtxChunk(pendingBatch, gtxTl, settings, abortSignal, opts);
    if (translated) outParts.push(translated);
    pendingBatch = '';
  };

  for (const seg of segments) {
    if (seg.kind === 'fence' || shouldKeepMachineParagraph(seg.text, tl)) {
      await flushBatch();
      outParts.push(seg.text);
      continue;
    }
    if (pendingBatch && pendingBatch.length + seg.text.length + 2 > 1400) {
      await flushBatch();
    }
    pendingBatch = pendingBatch ? `${pendingBatch}\n\n${seg.text}` : seg.text;
  }
  await flushBatch();

  return outParts.join('\n\n').trim();
}

async function translateChunkWithAi(chunkText, settings, onPartial, abortSignal, opts = {}) {
  const checkedUrl = validateOpenAiBaseUrl(settings.rawBaseUrl);
  if (!checkedUrl.ok) {
    throw new Error(checkedUrl.error || 'Blocked Base URL');
  }
  const baseUrl = checkedUrl.url;
  const allowEmptyKey = isKeylessAllowedEndpoint(baseUrl);
  if (!settings.model) {
    throw new Error('Missing AI model ID');
  }
  if (!settings.apiKey && !allowEmptyKey) {
    throw new Error('Missing API key (only loopback or private LAN endpoints may omit apiKey)');
  }

  const prompts = buildAiPrompts(settings);
  const noThinkParams = buildNoThinkingParams(settings.model, baseUrl);
  const wantStream = typeof onPartial === 'function';
  const headers = {
    'Content-Type': 'application/json',
    Accept: wantStream ? 'text/event-stream, application/json' : 'application/json',
  };
  if (settings.apiKey) {
    headers.Authorization = `Bearer ${settings.apiKey}`;
  }

  let activeAbort = null;
  const cleanupAbort = () => {
    if (activeAbort) {
      activeAbort.cleanup();
      activeAbort = null;
    }
  };

  const sendCompletion = (includeNoThink) => {
    cleanupAbort();
    const payload = {
      model: settings.model,
      stream: wantStream,
      temperature: prompts.temperature,
      messages: [
        { role: 'system', content: prompts.system },
        { role: 'user', content: prompts.wrapUser(chunkText) },
      ],
    };
    if (includeNoThink && noThinkParams) {
      Object.assign(payload, noThinkParams);
    }
    activeAbort = composeAbortSignal(opts.timeoutMs || 45000, abortSignal);
    return dispatchHttp(
      `${baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers,
        redirect: 'error',
        body: JSON.stringify(payload),
        signal: activeAbort.signal,
      },
      settings,
      opts
    );
  };

  try {
    let res = await sendCompletion(Boolean(noThinkParams));
    if (!res.ok && noThinkParams && (res.status === 400 || res.status === 422)) {
      try { await res.body?.cancel?.(); } catch {}
      res = await sendCompletion(false);
    }

    if (!res.ok) {
      const errBody = await readResponseTextBounded(res, 65536).catch(() => '');
      throw new Error(`AI HTTP ${res.status}: ${redactSecrets(errBody.slice(0, 240), settings.apiKey)}`);
    }

    const ctype = String(res.headers?.get?.('content-type') || '').toLowerCase();
    if (!ctype.includes('text/event-stream') || !res.body || typeof res.body.getReader !== 'function') {
      const jsonText = await readResponseTextBounded(res, MAX_RESPONSE_BYTES);
      const json = JSON.parse(jsonText);
      const full = stripThinkTagsAndQuotes(json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text || '').slice(0, MAX_STREAM_CHARS);
      if (full && onPartial) onPartial(full);
      return full;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let acc = '';
    let totalBytes = 0;

    try {
      while (true) {
        if (abortSignal?.aborted) {
          try { await reader.cancel(); } catch {}
          throw new Error('Translation aborted');
        }
        const { done, value } = await reader.read();
        if (done) break;
        const chunkBytes = value?.byteLength ?? value?.length ?? 0;
        totalBytes += chunkBytes;
        if (totalBytes > MAX_STREAM_BYTES) {
          try { await reader.cancel(); } catch {}
          throw new Error(`AI stream exceeded size limit (${MAX_STREAM_BYTES} bytes)`);
        }
        buf += typeof value === 'string' ? value : decoder.decode(value, { stream: true });
        if (buf.length > MAX_STREAM_CHARS) buf = buf.slice(0, MAX_STREAM_CHARS);
        const lines = buf.split(/\r?\n/);
        buf = lines.pop() || '';
        let appended = false;
        let reachedDone = false;
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line || !line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') {
            reachedDone = true;
            break;
          }
          try {
            const obj = JSON.parse(payload);
            const delta = obj?.choices?.[0]?.delta?.content ?? obj?.choices?.[0]?.message?.content ?? '';
            if (delta) {
              acc += delta;
              appended = true;
            }
          } catch {}
        }
        if (appended && onPartial) {
          const cleaned = stripThinkTagsAndQuotes(acc);
          if (cleaned) onPartial(cleaned);
        }
        if (reachedDone || acc.length >= MAX_STREAM_CHARS) {
          try { await reader.cancel(); } catch {}
          break;
        }
      }
    } finally {
      try { reader.releaseLock(); } catch {}
    }

    const finalOut = stripThinkTagsAndQuotes(acc).slice(0, MAX_STREAM_CHARS);
    if (finalOut && onPartial) onPartial(finalOut);
    return finalOut;
  } finally {
    cleanupAbort();
  }
}

/**
 * Translates a thought block, tool summary, or conversation title using either the zero-config
 * Google Translate GTX engine ('machine') or an OpenAI-compatible LLM endpoint ('ai').
 */
async function translateThought(input = {}) {
  const settings = resolveEffectiveSettings(input);
  const raw = String(input.text || '').trim();
  if (!raw) {
    return { ok: true, text: '', skipped: true };
  }
  if (settings.mode === 'off') {
    return { ok: false, error: 'Thought translator is disabled (mode: off)' };
  }

  if (settings.mode === 'ai') {
    const checkedUrl = validateOpenAiBaseUrl(settings.rawBaseUrl);
    if (!checkedUrl.ok) {
      return { ok: false, error: checkedUrl.error, blocked: true };
    }
  }

  const isSmallKind = settings.kind === 'tool_summary' || settings.kind === 'title';
  if (!isSmallKind && isAlreadyTargetLang(raw, settings.targetLang)) {
    return { ok: true, text: raw, skipped: true };
  }

  const splitPlan = isSmallKind
    ? { chunks: [raw], truncated: false, originalLength: raw.length, translatedLength: raw.length }
    : chunkThoughtText(raw, MAX_SINGLE_THOUGHT_CHARS, MAX_TOTAL_THOUGHT_CHARS);
  const effectiveRaw = splitPlan.chunks.join('\n\n');

  const baseTag = settings.mode === 'machine' ? 'mt' : computeStyleTag(settings);
  const modeTag = `${baseTag}_${settings.kind}_${settings.targetLang}`;
  const cacheKey = hashThoughtKey(effectiveRaw, modeTag);
  const skipCache = Boolean(input.force || input.bypassCache);

  if (!skipCache) {
    const cachedText = getCacheEntry(settings.stateDir, cacheKey);
    if (cachedText) {
      return {
        ok: true,
        text: cachedText,
        cached: true,
        engine: settings.mode,
        kind: settings.kind,
        key: cacheKey,
        ...(splitPlan.truncated ? { truncated: true, originalLength: splitPlan.originalLength, translatedLength: splitPlan.translatedLength } : {}),
        ...(splitPlan.chunks.length > 1 ? { chunked: true } : {}),
      };
    }
  }

  const inflightKey = `${settings.stateDir}:${cacheKey}`;
  if (!skipCache && inflightMap.has(inflightKey)) {
    const existing = inflightMap.get(inflightKey);
    if (!existing.aborted) {
      if (typeof input.onPartial === 'function') {
        existing.listeners.add(input.onPartial);
      }
      return existing.promise;
    }
  }

  const abortController = new AbortController();
  let detachExternal = null;
  if (input.signal && typeof input.signal.addEventListener === 'function') {
    if (input.signal.aborted) abortController.abort();
    else {
      const onExtAbort = () => abortController.abort();
      input.signal.addEventListener('abort', onExtAbort, { once: true });
      detachExternal = () => {
        try { input.signal.removeEventListener('abort', onExtAbort); } catch {}
      };
    }
  }

  const entry = {
    aborted: false,
    listeners: new Set(typeof input.onPartial === 'function' ? [input.onPartial] : []),
    promise: null,
  };

  const transportOpts = {
    fetchImpl: input.fetchImpl,
    env: input.env,
    osConfig: input.osConfig,
    platform: input.platform,
    execFileSyncFn: input.execFileSyncFn,
    timeoutMs: input.timeoutMs,
    transportOpts: input.transportOpts,
  };

  entry.promise = (async () => {
    const slot = await acquireSlot(input.priority || 0, abortController.signal);
    if (!slot.acquired || abortController.signal.aborted) {
      if (slot.acquired) releaseSlot();
      if (detachExternal) detachExternal();
      if (inflightMap.get(inflightKey) === entry) inflightMap.delete(inflightKey);
      return { ok: false, cancelled: true, key: cacheKey };
    }

    try {
      let outText = '';
      if (settings.mode === 'machine') {
        outText = await translateWithMachine(effectiveRaw, settings, abortController.signal, transportOpts);
        if (outText) {
          entry.listeners.forEach((cb) => { try { cb(outText); } catch {} });
        }
      } else {
        const chunkOutputs = [];
        for (let i = 0; i < splitPlan.chunks.length; i++) {
          const prefix = chunkOutputs.length ? `${chunkOutputs.join('\n\n')}\n\n` : '';
          const part = await translateChunkWithAi(
            splitPlan.chunks[i],
            settings,
            (partial) => {
              const combined = prefix + partial;
              entry.listeners.forEach((cb) => { try { cb(combined); } catch {} });
            },
            abortController.signal,
            transportOpts
          );
          if (part) chunkOutputs.push(part);
        }
        outText = chunkOutputs.join('\n\n').trim();
      }

      if (outText) {
        setCacheEntry(settings.stateDir, cacheKey, outText);
      }

      return {
        ok: Boolean(outText),
        text: outText,
        cached: false,
        engine: settings.mode,
        kind: settings.kind,
        key: cacheKey,
        ...(splitPlan.truncated ? { truncated: true, originalLength: splitPlan.originalLength, translatedLength: splitPlan.translatedLength } : {}),
        ...(splitPlan.chunks.length > 1 ? { chunked: true } : {}),
      };
    } catch (err) {
      if (abortController.signal.aborted) {
        return { ok: false, cancelled: true, key: cacheKey };
      }
      return {
        ok: false,
        engine: settings.mode,
        kind: settings.kind,
        error: redactSecrets(err?.message || String(err), [settings.apiKey, settings.proxyUrl, settings.proxyFallback?.proxyUrl]),
      };
    } finally {
      if (detachExternal) detachExternal();
      releaseSlot();
      if (inflightMap.get(inflightKey) === entry) inflightMap.delete(inflightKey);
    }
  })();

  if (!skipCache) {
    inflightMap.set(inflightKey, entry);
  }
  return entry.promise;
}

/**
 * Resolves the active proxy and executes a live test translation ("Checking configuration.")
 * with all API keys and proxy credentials strictly redacted.
 */
async function diagnose({ config = {}, proxyFallback = null, ...rest } = {}) {
  const settings = resolveEffectiveSettings({ config, proxyFallback, ...rest });
  const diagMode = (settings.mode === 'off')
    ? (settings.model && (settings.apiKey || isKeylessAllowedEndpoint(normalizeOpenAiBaseUrl(settings.rawBaseUrl))) ? 'ai' : 'machine')
    : settings.mode;

  const probeUrl = diagMode === 'ai'
    ? `${normalizeOpenAiBaseUrl(settings.rawBaseUrl)}/chat/completions`
    : 'https://translate.googleapis.com/translate_a/single';

  const resolvedProxy = resolveProxyForRequest(probeUrl, {
    config: { thought: settings.thoughtConfig, proxy: settings.proxyFallback },
    proxyFallback: settings.proxyFallback,
    env: rest.env,
    osConfig: rest.osConfig,
    platform: rest.platform,
    execFileSyncFn: rest.execFileSyncFn,
  });

  const proxyUsed = resolvedProxy.proxy ? maskProxyUrl(resolvedProxy.proxy) : 'direct';
  const secretsToRedact = [
    settings.apiKey,
    settings.proxyUrl,
    settings.proxyFallback?.proxyUrl,
    resolvedProxy.proxy?.username,
    resolvedProxy.proxy?.password,
  ];

  const t0 = Date.now();
  try {
    const res = await translateThought({
      text: 'Checking configuration.',
      mode: diagMode,
      kind: 'thought',
      targetLang: settings.targetLang,
      config,
      proxyFallback,
      force: true,
      bypassCache: true,
      ...rest,
    });
    const latencyMs = Date.now() - t0;
    if (!res.ok) {
      return {
        ok: false,
        mode: diagMode,
        proxyUsed,
        proxySource: resolvedProxy.source,
        latencyMs,
        sample: '',
        error: redactSecrets(res.error || 'Diagnosis failed', secretsToRedact),
      };
    }
    return {
      ok: true,
      mode: diagMode,
      proxyUsed,
      proxySource: resolvedProxy.source,
      latencyMs,
      sample: redactSecrets(res.text || '', secretsToRedact),
      error: null,
    };
  } catch (err) {
    return {
      ok: false,
      mode: diagMode,
      proxyUsed,
      proxySource: resolvedProxy.source,
      latencyMs: Date.now() - t0,
      sample: '',
      error: redactSecrets(err?.message || String(err), secretsToRedact),
    };
  }
}

module.exports = {
  translateThought,
  diagnose,
  clearCache,
  validateOpenAiBaseUrl,
  normalizeOpenAiBaseUrl,
  isBlockedTargetHost,
  parseProxyUrl,
  detectSystemProxy,
  chunkThoughtText,
  protectInlineTokens,
  restoreInlineTokens,
  isKeylessAllowedEndpoint,
  resolveProxyForRequest,
  redactSecrets,
  MAX_CONCURRENCY,
  MAX_CACHE_ENTRIES,
};
