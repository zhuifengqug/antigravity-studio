'use strict';

const net = require('net');
const tls = require('tls');
const { URL } = require('url');
const { ConfigStore } = require('../shared/config-store');
const { DEFAULT_NO_PROXY } = require('../shared/constants');
const meterProxy = require('./meter-proxy');

function normalizeProxyUrl(rawUrl) {
  const s = String(rawUrl || '').trim();
  if (!s) return null;
  let candidate = s;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(candidate)) {
    candidate = `http://${candidate}`;
  }
  const u = new URL(candidate);
  const proto = u.protocol.toLowerCase();
  if (!['http:', 'https:', 'socks5:', 'socks5h:'].includes(proto)) {
    throw new Error(`Unsupported proxy protocol: ${u.protocol}`);
  }
  if (!u.hostname) throw new Error('Proxy hostname is required');
  const defaultPort = proto === 'https:' ? 443 : proto.startsWith('socks') ? 1080 : 7890;
  const port = u.port ? Number(u.port) : defaultPort;
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid proxy port: ${u.port}`);
  }
  return {
    normalized: `${proto}//${u.username ? `${u.username}${u.password ? `:${u.password}` : ''}@` : ''}${u.hostname}:${port}`,
    chromiumProxyUrl: `${proto === 'socks5h:' ? 'socks5:' : proto}//${u.hostname}:${port}`,
    protocol: proto.replace(':', ''),
    hostname: u.hostname,
    port,
    username: decodeURIComponent(u.username || ''),
    password: decodeURIComponent(u.password || ''),
  };
}

function matchesBypassRule(hostname, bypassList) {
  return meterProxy.matchesNoProxy(hostname, bypassList);
}

function clearProxyFromEnv(targetEnv) {
  if (!targetEnv || typeof targetEnv !== 'object') return;
  for (const k of ['HTTP_PROXY', 'http_proxy', 'HTTPS_PROXY', 'https_proxy', 'ALL_PROXY', 'all_proxy', 'NO_PROXY', 'no_proxy', 'NODE_USE_ENV_PROXY']) {
    delete targetEnv[k];
  }
}

function applyProxyToEnv(targetEnv, proxyCfg, options = {}) {
  if (!targetEnv || typeof targetEnv !== 'object') return null;
  let cfg = proxyCfg;
  if (!cfg) {
    const store = new ConfigStore();
    cfg = store.load().proxy;
  }
  if (!cfg || cfg.enabled !== true || !cfg.proxyUrl) {
    if (options.clearWhenDisabled) {
      clearProxyFromEnv(targetEnv);
    }
    return null;
  }
  let parsed;
  try {
    parsed = normalizeProxyUrl(cfg.proxyUrl);
  } catch {
    return null;
  }
  if (!parsed) return null;
  const noProxy = String(cfg.bypassList ?? DEFAULT_NO_PROXY).trim();
  for (const k of ['HTTP_PROXY', 'http_proxy', 'HTTPS_PROXY', 'https_proxy', 'ALL_PROXY', 'all_proxy']) {
    targetEnv[k] = parsed.normalized;
  }
  if (noProxy) {
    targetEnv.NO_PROXY = noProxy;
    targetEnv.no_proxy = noProxy;
  } else {
    delete targetEnv.NO_PROXY;
    delete targetEnv.no_proxy;
  }
  targetEnv.NODE_USE_ENV_PROXY = '1';
  return parsed;
}

async function applySessionProxy(electronApp, electronSession, proxyCfg) {
  if (!electronSession) return { applied: false, reason: 'No electron session' };
  const store = new ConfigStore();
  const cfg = proxyCfg || store.load().proxy;
  const applyOne = async (sess) => {
    if (!sess || typeof sess.setProxy !== 'function') return;
    if (!cfg || cfg.enabled !== true || !cfg.proxyUrl) {
      await sess.setProxy({ mode: 'direct' });
      return;
    }
    const parsed = normalizeProxyUrl(cfg.proxyUrl);
    await sess.setProxy({
      mode: 'fixed_servers',
      proxyRules: parsed.chromiumProxyUrl,
      proxyBypassRules: String(cfg.bypassList ?? DEFAULT_NO_PROXY).trim(),
    });
  };
  await applyOne(electronSession.defaultSession);
  try {
    await applyOne(electronSession.fromPartition('persist:hub-browser-anonymous'));
  } catch {}
  return { applied: true, enabled: Boolean(cfg?.enabled), proxyUrl: cfg?.proxyUrl || null };
}

function applyBootProxySync() {
  let electron;
  try { electron = require('electron'); } catch { return { active: false }; }
  const store = new ConfigStore();
  const cfg = store.load().proxy;
  if (!cfg || cfg.enabled !== true || !cfg.proxyUrl) {
    globalThis.__AG_STUDIO_PROXY_BOOT__ = { active: false, reason: 'disabled' };
    return globalThis.__AG_STUDIO_PROXY_BOOT__;
  }
  const parsed = applyProxyToEnv(process.env, cfg);
  if (!parsed) {
    globalThis.__AG_STUDIO_PROXY_BOOT__ = { active: false, reason: 'invalid_url' };
    return globalThis.__AG_STUDIO_PROXY_BOOT__;
  }
  const bypassList = String(cfg.bypassList ?? DEFAULT_NO_PROXY).trim();
  try {
    if (electron.app && electron.app.commandLine) {
      electron.app.commandLine.appendSwitch('proxy-server', parsed.chromiumProxyUrl);
      if (bypassList) {
        electron.app.commandLine.appendSwitch('proxy-bypass-list', bypassList);
      }
    }
    if (electron.app) {
      electron.app.on('session-created', (sess) => {
        if (sess && typeof sess.setProxy === 'function') {
          sess.setProxy({ mode: 'fixed_servers', proxyRules: parsed.chromiumProxyUrl, proxyBypassRules: bypassList }).catch(() => {});
        }
      });
      electron.app.whenReady().then(() => applySessionProxy(electron.app, electron.session, cfg)).catch(() => {});
    }
  } catch {}
  globalThis.__AG_STUDIO_PROXY_BOOT__ = {
    active: true,
    proxyUrl: parsed.normalized,
    chromiumProxyUrl: parsed.chromiumProxyUrl,
    bypassList,
  };
  return globalThis.__AG_STUDIO_PROXY_BOOT__;
}

function openHttpConnectTunnel(proxy, targetHost, targetPort, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const socket = net.connect(proxy.port, proxy.hostname);
    let settled = false;
    const done = (err, res) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) {
        try { socket.destroy(); } catch {}
        reject(err);
      } else {
        resolve(res);
      }
    };
    const timer = setTimeout(() => done(new Error(`HTTP CONNECT timeout after ${timeoutMs}ms`)), timeoutMs);

    socket.once('error', (err) => done(err));
    socket.once('connect', () => {
      const headers = [
        `CONNECT ${targetHost}:${targetPort} HTTP/1.1`,
        `Host: ${targetHost}:${targetPort}`,
      ];
      if (proxy.username || proxy.password) {
        const token = Buffer.from(`${proxy.username}:${proxy.password}`).toString('base64');
        headers.push(`Proxy-Authorization: Basic ${token}`);
      }
      headers.push('', '');
      socket.write(headers.join('\r\n'));
    });

    let buf = Buffer.alloc(0);
    socket.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      const idx = buf.indexOf('\r\n\r\n');
      if (idx !== -1) {
        const head = buf.subarray(0, idx).toString('utf8');
        const statusLine = head.split('\r\n')[0] || '';
        const match = statusLine.match(/^HTTP\/\d\.\d\s+(\d+)/);
        const code = match ? Number(match[1]) : 0;
        if (code >= 200 && code < 300) {
          socket.removeAllListeners('data');
          done(null, { socket, latencyMs: Date.now() - start });
        } else {
          done(new Error(`Proxy rejected CONNECT: ${statusLine}`));
        }
      }
    });
  });
}

function openSocks5Tunnel(proxy, targetHost, targetPort, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const socket = net.connect(proxy.port, proxy.hostname);
    let settled = false;
    let stage = 'greeting';
    let buf = Buffer.alloc(0);

    const done = (err, res) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) {
        try { socket.destroy(); } catch {}
        reject(err);
      } else {
        resolve(res);
      }
    };
    const timer = setTimeout(() => done(new Error(`SOCKS5 tunnel timeout after ${timeoutMs}ms`)), timeoutMs);

    const sendConnect = () => {
      stage = 'connect';
      const hostBuf = Buffer.from(targetHost, 'utf8');
      const portBuf = Buffer.alloc(2);
      portBuf.writeUInt16BE(targetPort, 0);
      const req = Buffer.concat([
        Buffer.from([0x05, 0x01, 0x00, 0x03, hostBuf.length]),
        hostBuf,
        portBuf,
      ]);
      socket.write(req);
    };

    socket.once('error', (err) => done(err));
    socket.once('connect', () => {
      const methods = (proxy.username || proxy.password) ? [0x00, 0x02] : [0x00];
      socket.write(Buffer.from([0x05, methods.length, ...methods]));
    });

    socket.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      if (stage === 'greeting') {
        if (buf.length < 2) return;
        const ver = buf[0];
        const method = buf[1];
        buf = buf.subarray(2);
        if (ver !== 0x05 || method === 0xff) {
          return done(new Error(`SOCKS5 handshake rejected (ver=${ver}, method=${method})`));
        }
        if (method === 0x02) {
          stage = 'auth';
          const u = Buffer.from(proxy.username || '', 'utf8');
          const p = Buffer.from(proxy.password || '', 'utf8');
          socket.write(Buffer.concat([Buffer.from([0x01, u.length]), u, Buffer.from([p.length]), p]));
        } else {
          sendConnect();
        }
      } else if (stage === 'auth') {
        if (buf.length < 2) return;
        const status = buf[1];
        buf = buf.subarray(2);
        if (status !== 0x00) return done(new Error('SOCKS5 username/password auth failed'));
        sendConnect();
      } else if (stage === 'connect') {
        if (buf.length < 4) return;
        const rep = buf[1];
        const atyp = buf[3];
        let needed = 4;
        if (atyp === 0x01) needed += 4 + 2;
        else if (atyp === 0x03) {
          if (buf.length < 5) return;
          needed += 1 + buf[4] + 2;
        } else if (atyp === 0x04) needed += 16 + 2;
        if (buf.length < needed) return;
        if (rep !== 0x00) {
          return done(new Error(`SOCKS5 connect failed with reply code ${rep}`));
        }
        socket.removeAllListeners('data');
        done(null, { socket, latencyMs: Date.now() - start });
      }
    });
  });
}

async function testProxyConnectivity(proxyUrl, options = {}) {
  const parsed = normalizeProxyUrl(proxyUrl);
  const targetHost = options.targetHost || 'www.gstatic.com';
  const targetPort = Number(options.targetPort || 443);
  const timeoutMs = Number(options.timeoutMs || 5000);
  const start = Date.now();

  let tunnel;
  if (parsed.protocol.startsWith('socks5')) {
    tunnel = await openSocks5Tunnel(parsed, targetHost, targetPort, timeoutMs);
  } else {
    tunnel = await openHttpConnectTunnel(parsed, targetHost, targetPort, timeoutMs);
  }

  if (options.skipTlsProbe) {
    try { tunnel.socket.destroy(); } catch {}
    return {
      ok: true,
      protocol: parsed.protocol,
      proxyUrl: parsed.normalized,
      latencyMs: Date.now() - start,
      target: `${targetHost}:${targetPort}`,
    };
  }

  return new Promise((resolve, reject) => {
    const tlsSock = tls.connect({
      socket: tunnel.socket,
      servername: targetHost,
      rejectUnauthorized: false,
    }, () => {
      const totalMs = Date.now() - start;
      tlsSock.end();
      resolve({
        ok: true,
        protocol: parsed.protocol,
        proxyUrl: parsed.normalized,
        latencyMs: totalMs,
        target: `${targetHost}:${targetPort}`,
      });
    });
    tlsSock.setTimeout(timeoutMs, () => {
      tlsSock.destroy();
      reject(new Error(`TLS probe over proxy timed out after ${timeoutMs}ms`));
    });
    tlsSock.on('error', (err) => {
      tlsSock.destroy();
      reject(err);
    });
  });
}

module.exports = {
  ...meterProxy,
  normalizeProxyUrl,
  matchesBypassRule,
  clearProxyFromEnv,
  applyProxyToEnv,
  applySessionProxy,
  applyBootProxySync,
  openHttpConnectTunnel,
  openSocks5Tunnel,
  testProxyConnectivity,
};
