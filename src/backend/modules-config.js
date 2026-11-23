'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { getStateDir } = require('./asar-engine');
const { safeWriteJsonSync } = require('./meter-storage');
const { parseAndValidateProxyUrl } = require('./meter-proxy');
const { STUDIO_VERSION, DEFAULT_NO_PROXY, getLegacyMeterStateDir } = require('../shared/constants');

const SCHEMA_VERSION = STUDIO_VERSION;
const FALLBACK_PROJECT_VERSION = STUDIO_VERSION;

function resolveProjectVersion() {
  for (const pkgPath of [
    path.join(__dirname, 'package.json'),
    path.join(__dirname, '..', 'package.json'),
    path.join(__dirname, '..', '..', 'package.json')
  ]) {
    try {
      if (fs.existsSync(pkgPath)) {
        const parsed = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (parsed && typeof parsed.version === 'string' && parsed.version.trim()) {
          return parsed.version.trim();
        }
      }
    } catch {}
  }
  return FALLBACK_PROJECT_VERSION;
}

const PROJECT_VERSION = resolveProjectVersion();

const DEFAULT_CONFIG = {
  schemaVersion: SCHEMA_VERSION,
  modules: {
    meter: { enabled: true },
    chinese: {
      enabled: true,
      language: 'zh-CN',
      brandTitle: 'english',
      desktopOnly: true,
      lastUpdated: null
    },
    proxy: {
      enabled: false,
      proxyUrl: 'http://127.0.0.1:7897',
      bypassList: DEFAULT_NO_PROXY,
      lastTestedAt: null
    },
    enhance: {
      promptTier: null,
      chineseTitle: null,
      lastAppliedAt: null,
      targetBuilds: {}
    }
  }
};

function normalizeBrandTitle(val) {
  const s = String(val || '').trim().toLowerCase();
  if (s === 'hidden' || s === 'hide' || s === 'off' || s === 'none') return 'hidden';
  if (s === 'translated' || s === 'zh' || s === 'cn' || s === 'fanzhongli' || s === 'anti-gravity') return 'translated';
  return 'english';
}

function normalizeClientLanguage(val, enabledHint) {
  const s = String(val || '').trim().toLowerCase();
  if (s === 'zh-tw' || s === 'zh-hant' || s === 'tw') return 'zh-TW';
  if (s === 'zh-cn' || s === 'zh' || s === 'zh-hans' || s === 'cn') return 'zh-CN';
  if (s === 'en' || s === 'english' || s === 'en-us') return 'en';
  if (enabledHint === true) return 'zh-CN';
  return 'en';
}

function resolveModulesStateDir(options = {}) {
  if (options && typeof options.stateDir === 'string' && options.stateDir.trim()) {
    return path.resolve(options.stateDir.trim());
  }
  return getStateDir();
}

function getModulesConfigPath(options = {}) {
  return path.join(resolveModulesStateDir(options), 'modules.json');
}

function detectAndMigrateLegacyConfigs(options = {}) {
  const home = options.homeDir || os.homedir();
  const platform = options.platform || process.platform;
  const localApp = platform === 'win32'
    ? (options.localAppData || process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'))
    : platform === 'darwin'
      ? path.join(home, 'Library', 'Application Support')
      : (process.env.XDG_STATE_HOME || path.join(home, '.local', 'state'));

  const legacyMeterDir = getLegacyMeterStateDir();
  const legacyProxyPaths = [
    path.join(legacyMeterDir, 'modules.json'),
    path.join(legacyMeterDir, 'proxy.json'),
    path.join(localApp, 'AntigravityProxyNoTun', 'config.json'),
    path.join(resolveModulesStateDir(options), 'proxy.json')
  ];
  let legacyProxyFound = null;
  for (const lp of legacyProxyPaths) {
    if (fs.existsSync(lp)) {
      try {
        const raw = JSON.parse(fs.readFileSync(lp, 'utf8'));
        const pNode = raw?.modules?.proxy || raw;
        if (pNode && (pNode.proxyUrl || pNode.httpProxy)) {
          legacyProxyFound = {
            enabled: pNode.enabled === true,
            proxyUrl: pNode.proxyUrl || pNode.httpProxy || 'http://127.0.0.1:7897',
            bypassList: pNode.bypassList || pNode.noProxy || DEFAULT_CONFIG.modules.proxy.bypassList,
            source: lp
          };
          break;
        }
      } catch {}
    }
  }

  const legacyChinesePaths = [
    path.join(localApp, 'AntigravityChinese', 'installation.json'),
    path.join(localApp, 'AntigravityChinese', 'config.json')
  ];
  let legacyChineseFound = null;
  for (const lcp of legacyChinesePaths) {
    if (fs.existsSync(lcp)) {
      legacyChineseFound = { detected: true, source: lcp };
      break;
    }
  }

  return { proxy: legacyProxyFound, chinese: legacyChineseFound };
}

function isPlainObject(val) {
  return Boolean(val && typeof val === 'object' && !Array.isArray(val));
}

function validateModulesSchema(parsed) {
  if (!isPlainObject(parsed)) return { ok: false, error: '配置文件根节点必须是 JSON 对象' };
  if (!isPlainObject(parsed.modules)) return { ok: false, error: '配置文件缺少有效的 modules 对象' };
  const mods = parsed.modules;
  for (const key of ['meter', 'chinese', 'proxy', 'enhance']) {
    if (mods[key] !== undefined && !isPlainObject(mods[key])) {
      return { ok: false, error: `配置文件中 modules.${key} 字段格式非法` };
    }
  }
  return { ok: true };
}

function attachConfigCorruptionMeta(target, cfgPath, errorMsg) {
  Object.defineProperties(target, {
    __configCorrupted: { value: true, enumerable: false, configurable: true },
    __configError: { value: errorMsg, enumerable: false, configurable: true },
    __corruptedConfigPath: { value: cfgPath, enumerable: false, configurable: true }
  });
  return target;
}

function loadModulesConfig(options = {}) {
  const cfgPath = getModulesConfigPath(options);
  const current = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  if (fs.existsSync(cfgPath)) {
    try {
      const rawText = fs.readFileSync(cfgPath, 'utf8');
      if (!rawText || !rawText.trim()) {
        return attachConfigCorruptionMeta(current, cfgPath, '配置文件为空，已保持模块默认状态并保留原文件');
      }
      const parsed = JSON.parse(rawText);
      const schemaCheck = validateModulesSchema(parsed);
      if (!schemaCheck.ok) {
        return attachConfigCorruptionMeta(current, cfgPath, `${schemaCheck.error}，已保持默认状态并保留原文件`);
      }

      current.modules.meter = Object.assign({}, DEFAULT_CONFIG.modules.meter, parsed.modules.meter || {});
      current.modules.chinese = Object.assign({}, DEFAULT_CONFIG.modules.chinese, parsed.modules.chinese || {});
      current.modules.chinese.language = normalizeClientLanguage(
        parsed.modules.chinese?.language,
        current.modules.chinese.enabled === true
      );
      current.modules.chinese.brandTitle = normalizeBrandTitle(parsed.modules.chinese?.brandTitle);
      current.modules.chinese.enabled = current.modules.chinese.language !== 'en';
      current.modules.proxy = Object.assign({}, DEFAULT_CONFIG.modules.proxy, parsed.modules.proxy || {});
      current.modules.enhance = Object.assign(
        {},
        DEFAULT_CONFIG.modules.enhance,
        parsed.modules.enhance || {},
        { targetBuilds: Object.assign({}, parsed.modules.enhance?.targetBuilds || {}) }
      );
      return current;
    } catch (e) {
      return attachConfigCorruptionMeta(current, cfgPath, `配置文件解析失败 (${e?.message || 'JSON 语法错误'})`);
    }
  }

  const legacy = detectAndMigrateLegacyConfigs(options);
  if (legacy.proxy) {
    current.modules.proxy.enabled = legacy.proxy.enabled;
    current.modules.proxy.proxyUrl = legacy.proxy.proxyUrl;
    current.modules.proxy.bypassList = legacy.proxy.bypassList;
    current.modules.proxy.migratedFrom = legacy.proxy.source;
  }
  if (legacy.chinese && legacy.chinese.detected) {
    current.modules.chinese.enabled = true;
    current.modules.chinese.language = 'zh-CN';
    current.modules.chinese.migratedFrom = legacy.chinese.source;
  }

  saveModulesConfig(current, options);
  return current;
}

function saveModulesConfig(cfg, options = {}) {
  const cfgPath = getModulesConfigPath(options);
  fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
  const res = safeWriteJsonSync(cfgPath, cfg, {
    validate: (data) => isPlainObject(data) && validateModulesSchema(data).ok
  });
  if (!res.ok) {
    throw new Error(`保存模块配置失败 (${res.phase || 'write'}): ${res.error || '未知错误'}`);
  }
}

function testSocks5Proxy(host, port, targetHost = null, targetPort = 80, timeoutMs = 2500) {
  const net = require('net');
  return new Promise((resolve) => {
    let settled = false;
    const sock = net.createConnection({ host, port });
    const done = (ok, detail = null) => {
      if (settled) return;
      settled = true;
      try { sock.destroy(); } catch {}
      resolve({ ok, detail });
    };
    const timer = setTimeout(() => done(false, 'timeout'), timeoutMs);
    sock.setTimeout(timeoutMs, () => {
      clearTimeout(timer);
      done(false, 'timeout');
    });
    sock.on('error', (e) => {
      clearTimeout(timer);
      done(false, e?.code || e?.message || 'socket_error');
    });

    let stage = 'greeting';
    let chunks = [];
    sock.on('connect', () => {
      sock.write(Buffer.from([0x05, 0x01, 0x00]));
    });
    sock.on('data', (chunk) => {
      chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      if (stage === 'greeting') {
        if (buf.length < 2) return;
        if (buf[0] !== 0x05 || buf[1] === 0xff) {
          clearTimeout(timer);
          return done(false, 'socks5_greeting_rejected');
        }
        if (!targetHost) {
          clearTimeout(timer);
          return done(true, null);
        }
        chunks = [buf.subarray(2)];
        stage = 'connect';
        const hostBuf = Buffer.from(targetHost, 'utf8');
        const req = Buffer.alloc(7 + hostBuf.length);
        req[0] = 0x05;
        req[1] = 0x01;
        req[2] = 0x00;
        req[3] = 0x03;
        req[4] = hostBuf.length;
        hostBuf.copy(req, 5);
        req.writeUInt16BE(targetPort, 5 + hostBuf.length);
        sock.write(req);
        return;
      }
      if (stage === 'connect') {
        if (buf.length < 4) return;
        if (buf[0] === 0x05 && buf[1] === 0x00) {
          stage = 'http';
          chunks = [];
          sock.write(`GET /generate_204 HTTP/1.1\r\nHost: ${targetHost}\r\nConnection: close\r\n\r\n`);
          return;
        }
        clearTimeout(timer);
        return done(false, `socks5_connect_err_${buf[1]}`);
      }
      if (stage === 'http') {
        const text = buf.toString('latin1');
        const m = text.match(/^HTTP\/\d\.\d\s+(\d{3})/);
        if (m) {
          const code = Number(m[1]);
          clearTimeout(timer);
          done(code >= 200 && code < 400, `http_${code}`);
        }
      }
    });
  });
}

async function testProxyHealth(proxyUrlStr) {
  const report = {
    configValid: false,
    proxyReachable: false,
    internetReachable: false,
    modelCallVerified: false,
    error: null,
    testedAt: new Date().toISOString()
  };

  const parsedCheck = parseAndValidateProxyUrl(proxyUrlStr);
  if (!parsedCheck.ok) {
    report.error = parsedCheck.error;
    return report;
  }
  report.configValid = true;
  const u = new URL(parsedCheck.value);
  const isSocks = parsedCheck.isSocks;
  const port = parsedCheck.port;

  try {
    let reachable = false;
    if (isSocks) {
      const sRes = await testSocks5Proxy(u.hostname, port, null, 80, 2500);
      reachable = sRes.ok;
    } else {
      reachable = await new Promise(resolve => {
        let done = false;
        const finish = (v) => { if (!done) { done = true; resolve(v); } };
        const req = http.request({
          host: u.hostname,
          port,
          method: 'CONNECT',
          path: 'www.google.com:443',
          timeout: 2500
        });
        req.on('connect', (_res, socket) => {
          try { socket?.destroy(); } catch {}
          req.destroy();
          finish(true);
        });
        req.on('response', (res) => {
          res.resume();
          req.destroy();
          finish(res.statusCode >= 200 && res.statusCode < 500);
        });
        req.on('error', () => { req.destroy(); finish(false); });
        req.on('timeout', () => { req.destroy(); finish(false); });
        req.end();
      });
    }

    report.proxyReachable = reachable;
    if (!reachable) {
      report.error = `本地代理端口 (${u.hostname}:${port}) 无法连接，请确认代理软件已启动`;
      return report;
    }
  } catch (e) {
    report.error = `本地代理端口检测异常: ${e.message}`;
    return report;
  }

  try {
    let internetOk = false;
    if (isSocks) {
      const netRes = await testSocks5Proxy(u.hostname, port, 'www.google.com', 80, 3500);
      internetOk = netRes.ok;
    } else {
      internetOk = await new Promise(resolve => {
        let done = false;
        const finish = (v) => { if (!done) { done = true; resolve(v); } };
        const req = http.request({
          host: u.hostname,
          port,
          method: 'GET',
          path: 'http://www.google.com/generate_204',
          timeout: 3500,
          headers: { Host: 'www.google.com' }
        }, res => {
          res.resume();
          finish(res.statusCode >= 200 && res.statusCode < 400);
        });
        req.on('error', () => finish(false));
        req.on('timeout', () => { req.destroy(); finish(false); });
        req.end();
      });
    }
    report.internetReachable = internetOk;
    if (!internetOk) {
      report.error = '代理端口可连接，但外网访问无响应，可能节点异常或未接通公网';
    }
  } catch (e) {
    report.error = `外网连通性测试异常: ${e.message}`;
  }

  return report;
}

module.exports = {
  SCHEMA_VERSION,
  PROJECT_VERSION,
  DEFAULT_CONFIG,
  normalizeBrandTitle,
  normalizeClientLanguage,
  parseAndValidateProxyUrl,
  getModulesConfigPath,
  loadModulesConfig,
  saveModulesConfig,
  detectAndMigrateLegacyConfigs,
  testProxyHealth
};
