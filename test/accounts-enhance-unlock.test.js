'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');
const { EventEmitter } = require('node:events');

const meterProxy = require('../src/backend/meter-proxy');
const meterEnhance = require('../src/backend/meter-enhance');
const meterUnlock = require('../src/backend/meter-context-unlock');
const meterRehydrate = require('../src/backend/meter-rehydrate');
const meterAccounts = require('../src/backend/meter-accounts');
const localApi = require('../src/backend/local-api');
const meterCliLauncher = require('../src/backend/meter-cli-launcher');

test('meter-proxy validates URLs, bypass rules, and tunnel handshakes', async () => {
  const parsed = meterProxy.parseAndValidateProxyUrl('http://127.0.0.1:7897');
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value, 'http://127.0.0.1:7897');

  assert.equal(meterProxy.matchesNoProxy('192.168.1.10', '192.168.0.0/16,<local>'), true);
  assert.equal(meterProxy.matchesNoProxy('generativelanguage.googleapis.com', '192.168.0.0/16,<local>'), false);

  function createMockSocket(onWrite) {
    const sock = new EventEmitter();
    sock.destroyed = false;
    sock.setTimeout = () => {};
    sock.write = (data) => {
      onWrite(Buffer.isBuffer(data) ? data : Buffer.from(data), sock);
      return true;
    };
    sock.destroy = () => { sock.destroyed = true; };
    process.nextTick(() => sock.emit('connect'));
    return sock;
  }

  const origConnect = net.connect;
  const origHttpReq = http.request;
  try {
    http.request = (_opts) => {
      const req = new EventEmitter();
      req.setTimeout = () => {};
      req.end = () => {
        const fakeSock = new EventEmitter();
        fakeSock.destroy = () => {};
        process.nextTick(() => req.emit('connect', { statusCode: 200 }, fakeSock, Buffer.alloc(0)));
      };
      req.destroy = () => {};
      return req;
    };
    const httpSock = await meterProxy.openHttpConnectTunnel('http://127.0.0.1:7897', 'www.gstatic.com', 443, 3000);
    assert.ok(httpSock);
    httpSock.destroy();

    let stage = 0;
    net.connect = () => createMockSocket((buf, sock) => {
      if (stage === 0) {
        stage = 1;
        process.nextTick(() => sock.emit('data', Buffer.from([0x05, 0x00])));
      } else {
        process.nextTick(() => sock.emit('data', Buffer.from([0x05, 0x00, 0x00, 0x01, 127, 0, 0, 1, 0x01, 0xbb])));
      }
    });
    const socksSock = await meterProxy.openSocks5Tunnel('socks5://127.0.0.1:10808', 'www.gstatic.com', 443, 3000);
    assert.ok(socksSock);
    socksSock.destroy();
  } finally {
    net.connect = origConnect;
    http.request = origHttpReq;
  }
});

test('meter-enhance Chinese title rules are strictly equal-byte reversible and 0-4 tier metadata complete', () => {
  assert.deepEqual(Object.keys(meterEnhance.PROMPT_TIER_META).sort(), ['0', '1', '2', '3', '4']);
  for (const rule of meterEnhance.CHINESE_TITLE_RULES) {
    assert.equal(Buffer.byteLength(rule.oldText, 'ascii'), Buffer.byteLength(rule.newText, 'ascii'));
  }

  // Test applying Chinese title rule and reversing it cleanly on a buffer
  const sampleBuf = Buffer.from(
    'HEAD__' + meterEnhance.CHINESE_TITLE_RULES[0].oldText + '__TAIL',
    'utf8'
  );
  const origStr = sampleBuf.toString('utf8');
  const matchedOn = meterEnhance.applyChineseTitlePatchToBuffer(sampleBuf, true);
  assert.equal(matchedOn.length, 1);
  assert.match(sampleBuf.toString('utf8'), /Simplified Chinese title/);
  const matchedOff = meterEnhance.applyChineseTitlePatchToBuffer(sampleBuf, false);
  assert.equal(matchedOff.length, 1);
  assert.equal(sampleBuf.toString('utf8'), origStr);
});

test('meter-context-unlock, meter-rehydrate, and meter-accounts export working managers', async () => {
  assert.equal(meterUnlock.validateContextLimit(524288).ok, true);
  assert.equal(meterUnlock.validateContextLimit(100).ok, false);
  assert.equal(typeof meterUnlock.applyUnlock, 'function');
  assert.equal(typeof meterUnlock.restoreUnlock, 'function');

  assert.equal(typeof meterRehydrate.getRehydrateStatus, 'function');
  assert.equal(typeof meterRehydrate.applyRehydrate, 'function');
  assert.equal(typeof meterRehydrate.disableRehydrate, 'function');
  assert.equal(typeof meterRehydrate.materializeRehydrateScriptIfAsar, 'function');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-studio-acc-'));
  try {
    const plainScript = path.join(tmpDir, 'plain.py');
    fs.writeFileSync(plainScript, '# plain');
    assert.equal(meterRehydrate.materializeRehydrateScriptIfAsar(plainScript, { stateDir: tmpDir }), plainScript);

    const fakeAsarScript = path.join(tmpDir, 'app.asar', 'dist', 'ag-studio', 'scripts', 'rehydrate_after_compact.py');
    const outStateDir = path.join(tmpDir, 'out-state');
    fs.mkdirSync(path.dirname(fakeAsarScript), { recursive: true });
    fs.writeFileSync(fakeAsarScript, 'print("rehydrate")');
    const materialized = meterRehydrate.materializeRehydrateScriptIfAsar(fakeAsarScript, { stateDir: outStateDir });
    assert.doesNotMatch(materialized, /\.asar(?:[\\/]|$)/i);
    assert.equal(fs.readFileSync(materialized, 'utf8'), 'print("rehydrate")');
    const mgr = meterAccounts.createAccountsManager({
      stateDir: tmpDir,
      homeDir: tmpDir,
      appDataDir: tmpDir,
      localAppDataDir: tmpDir,
    });
    const ov = mgr.getOverviewState();
    assert.ok(ov && Array.isArray(ov.accounts));
    const added = mgr.addAccountWithCredential({
      email: 'test@example.com',
      name: 'Test User',
      accessToken: 'ya29.test',
      refreshToken: '1//test',
    });
    assert.equal(added.ok, true);
    assert.equal(mgr.getOverviewState().accounts.length, 1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('meter-accounts importFromCurrentClient separates OS credential id_token_email and CLI creds cleanly', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-studio-imp-'));
  try {
    const geminiDir = path.join(tmpDir, '.gemini');
    fs.mkdirSync(geminiDir, { recursive: true });
    fs.writeFileSync(path.join(geminiDir, 'google_accounts.json'), JSON.stringify({ active: 'cli.user@example.com', old: [] }));
    fs.writeFileSync(path.join(geminiDir, 'oauth_creds.json'), JSON.stringify({
      access_token: 'cli-access',
      refresh_token: 'cli-refresh',
      expiry_date: Date.now() + 3600000,
    }));

    const mgr = meterAccounts.createAccountsManager({
      stateDir: path.join(tmpDir, 'state'),
      homeDir: tmpDir,
      appDataDir: tmpDir,
      localAppDataDir: tmpDir,
      credentialStore: {
        getPaths: () => ({
          desktopDbPath: path.join(tmpDir, 'missing.vscdb'),
          ideDbPath: path.join(tmpDir, 'missing-ide.vscdb'),
          googleAccountsPath: path.join(geminiDir, 'google_accounts.json'),
          oauthCredsPath: path.join(geminiDir, 'oauth_creds.json'),
        }),
        readWindowsSystemCredential: () => ({
          id_token_email: 'desktop.user@example.com',
          token: { access_token: 'desk-access', refresh_token: 'desk-refresh', expiry: new Date(Date.now() + 3600000).toISOString() },
        }),
        readMacKeychainCredential: () => null,
      },
    });

    const res = await mgr.importFromCurrentClient();
    assert.equal(res.ok, true);
    assert.equal(res.importedCount, 2);
    const store = mgr.loadStore();
    assert.equal(store.activeAccountEmail, 'desktop.user@example.com');
    assert.equal(store.accounts['desktop.user@example.com'].credential.refreshToken, 'desk-refresh');
    assert.equal(store.accounts['cli.user@example.com'].credential.refreshToken, 'cli-refresh');

    // Verify auto-switch matches shared_gemini_argon against poolKey shared_gemini_main
    const stForAuto = mgr.loadStore();
    stForAuto.accounts['desktop.user@example.com'].quotaSnapshot = {
      pools: [{ poolKey: 'shared_gemini_argon', remainingFraction: 0.05 }],
    };
    stForAuto.accounts['desktop.user@example.com'].lastQuotaUpdatedAtMs = Date.now();
    mgr.saveStore(stForAuto);
    mgr.updateAutoSwitchConfig({ enabled: true, poolKey: 'shared_gemini_main', thresholdPct: 10, candidates: ['cli.user@example.com'] });
    const evalRes = await mgr.evaluateAutoSwitch({
      activeEmail: 'desktop.user@example.com',
      activeSnapshot: stForAuto.accounts['desktop.user@example.com'].quotaSnapshot,
      syncState: 'fresh',
      nowMs: Date.now(),
    });
    assert.equal(evalRes.action, 'pending_debounce');
    assert.equal(evalRes.remainingPct, 5);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('v2.2.0 P0.3 meter-accounts scopes, 4-target validation, trusted quota context & consumedNoticeIds persistence', async () => {
  assert.ok(meterAccounts.ANTIGRAVITY_OAUTH_SCOPES.includes('https://www.googleapis.com/auth/aicode'));
  assert.equal(meterAccounts.CLOUDCODE_DAILY_URL, 'https://daily-cloudcode-pa.googleapis.com');
  assert.equal(meterAccounts.AUTO_SWITCH_QUOTA_TARGETS.length, 4);
  assert.equal(meterAccounts.validateAutoSwitchQuotaTarget('shared_gemini_main', '5h').valid, true);
  assert.equal(meterAccounts.validateAutoSwitchQuotaTarget('shared_gemini_main', '7d').valid, true);
  assert.equal(meterAccounts.validateAutoSwitchQuotaTarget('shared_3p_pool', '5h').valid, true);
  assert.equal(meterAccounts.validateAutoSwitchQuotaTarget('shared_3p_pool', '7d').valid, true);
  assert.equal(meterAccounts.validateAutoSwitchQuotaTarget('shared_gemini_carbon', 'primary').valid, false);

  const nowMs = Date.now();
  const trusted = meterAccounts.deriveTrustedAutoSwitchQuotaContext({
    res: { ok: true, email: 'a@example.com', snapshot: { syncState: 'fresh', updatedAtMs: nowMs - 1000 } },
    activeEmail: 'a@example.com',
    nowMs,
  });
  assert.equal(trusted.trusted, true);
  const mismatched = meterAccounts.deriveTrustedAutoSwitchQuotaContext({
    res: { ok: true, email: 'other@example.com', snapshot: { syncState: 'fresh', updatedAtMs: nowMs - 1000 } },
    activeEmail: 'a@example.com',
    nowMs,
  });
  assert.equal(mismatched.trusted, false);
  assert.equal(mismatched.reason, 'quota_snapshot_account_mismatch');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-studio-notice-'));
  try {
    const exp = new Date(Date.now() + 3600000).toISOString();
    const mgr1 = meterAccounts.createAccountsManager({
      stateDir: tmpDir,
      homeDir: tmpDir,
      appDataDir: tmpDir,
      credentialStore: {
        getPaths: () => ({ desktopDbPath: '', ideDbPath: '', googleAccountsPath: '' }),
        captureSnapshot: () => ({ ok: true }),
        applyCredential: () => ({ ok: true }),
        restoreSnapshot: () => ({ ok: true }),
      },
      getHostUserStatus: async () => ({ email: 'b@example.com' }),
      restartLanguageServers: async () => ({ ok: true }),
    });
    mgr1.addAccountWithCredential({ email: 'a@example.com', accessToken: 'tA', refreshToken: 'rA', expiresAt: exp });
    mgr1.addAccountWithCredential({ email: 'b@example.com', accessToken: 'tB', refreshToken: 'rB', expiresAt: exp });
    await mgr1.refreshAccountQuota('b@example.com', {
      mockQuotaSnapshot: {
        pools: [{ poolKey: 'shared_gemini_main', buckets: [{ windowKey: '5h', windowShort: '5h', remainingFraction: 0.9 }] }],
      },
      nowMs,
    });
    mgr1.updateAutoSwitchConfig({
      enabled: true,
      poolKey: 'shared_gemini_main',
      windowKey: '5h',
      thresholdPct: 10,
      debounceSec: 0,
      candidates: ['b@example.com'],
    });
    const sw = await mgr1.evaluateAutoSwitch({
      activeEmail: 'a@example.com',
      activeSnapshot: {
        pools: [{ poolKey: 'shared_gemini_main', buckets: [{ windowKey: '5h', windowShort: '5h', remainingFraction: 0.05 }] }],
      },
      syncState: 'fresh',
      skipCandidateRefresh: true,
      skipTokenRefresh: true,
      nowMs,
    });
    assert.equal(sw.action, 'switched');
    const ovBeforeAck = mgr1.getOverviewState();
    assert.equal(ovBeforeAck.autoSwitchStatus.lastResult.noticeConsumed, false);
    const noticeId = ovBeforeAck.autoSwitchStatus.lastResult.noticeId;
    assert.ok(noticeId);

    const ackRes = mgr1.ackAutoSwitchNotice(noticeId);
    assert.equal(ackRes.consumed, true);
    assert.ok(ackRes.consumedNoticeIds.includes(noticeId));

    // Cold restart simulation: new manager instance reads persisted consumedNoticeIds
    const mgr2 = meterAccounts.createAccountsManager({ stateDir: tmpDir, homeDir: tmpDir, appDataDir: tmpDir });
    const ovCold = mgr2.getOverviewState();
    assert.equal(ovCold.autoSwitchStatus.lastResult.noticeConsumed, true);
    assert.ok(ovCold.autoSwitchStatus.consumedNoticeIds.includes(noticeId));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('v2.2.0 P0.4/P0.5/P1.2 local-api CSRF fallback, enhance PID filter, unlock 128K CLI, launcher & proxy fixes', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-studio-p0p1-'));
  let mockServer = null;
  let cdpServer = null;
  try {
    // 1. P0.4 local-api: discoverLiveDaemonHubs + 401/403 CSRF auto-refresh retry
    let currentToken = 'fresh-tok-2';
    let callCount = 0;
    mockServer = http.createServer((req, res) => {
      if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<script>window.__APP_CONFIG__ = {"csrfToken":"${currentToken}"};</script>`);
        return;
      }
      if (req.url.includes('GetUserStatus')) {
        callCount++;
        const tok = req.headers['x-codeium-csrf-token'];
        if (tok !== currentToken) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'unauthorized' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ userStatus: { email: 'refreshed@example.com' } }));
        return;
      }
      res.writeHead(404);
      res.end();
    });
    await new Promise((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
    const apiPort = mockServer.address().port;
    const apiOrigin = `http://127.0.0.1:${apiPort}`;

    const daemonDir = path.join(tmpDir, 'daemon');
    fs.mkdirSync(daemonDir, { recursive: true });
    fs.writeFileSync(path.join(daemonDir, 'hub_live.json'), JSON.stringify({
      pid: process.pid,
      httpPort: apiPort,
      csrfToken: 'stale-tok-1',
    }));
    fs.writeFileSync(path.join(daemonDir, 'hub_dead.json'), JSON.stringify({
      pid: 999999999,
      httpPort: apiPort,
      csrfToken: 'dead-tok',
    }));
    const hubs = localApi.discoverLiveDaemonHubs({ daemonDir, isPidAlive: (pid) => pid === process.pid });
    assert.equal(hubs.length, 1);
    assert.equal(hubs[0].csrfToken, 'stale-tok-1');
    assert.equal(localApi.resolveOriginCsrfToken(apiOrigin, { daemonDir, isPidAlive: (pid) => pid === process.pid }), 'stale-tok-1');

    const conn = await localApi.connectOrigin(apiOrigin, null, [apiOrigin], { csrfToken: 'stale-tok-1' });
    const statusRes = await conn.call('GetUserStatus', {});
    assert.equal(callCount, 2);
    assert.equal(statusRes.userStatus.email, 'refreshed@example.com');
    assert.equal(conn.csrfToken, 'fresh-tok-2');

    // CDP third-party local preview filtering
    const previewServer = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body>Third Party Preview</body></html>');
    });
    await new Promise((resolve) => previewServer.listen(0, '127.0.0.1', resolve));
    const previewOrigin = `http://127.0.0.1:${previewServer.address().port}`;
    cdpServer = http.createServer((req, res) => {
      if (req.url === '/json/list') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([
          { type: 'page', url: `${previewOrigin}/index.html` },
          { type: 'page', url: `${apiOrigin}/` },
        ]));
        return;
      }
      res.writeHead(404);
      res.end();
    });
    await new Promise((resolve) => cdpServer.listen(0, '127.0.0.1', resolve));
    const cdpDiscovered = await localApi.discoverAntigravityCdp({
      port: cdpServer.address().port,
      strictPort: true,
      appDataDir: tmpDir,
    });
    assert.equal(cdpDiscovered.page.url, `${apiOrigin}/`);
    assert.equal(cdpDiscovered.pages.length, 1);
    await new Promise((resolve) => previewServer.close(resolve));

    // 2. P0.5 meter-enhance: selectWindowsTargetProcesses skips external paths & ancestors
    const agRoot = 'C:\\Users\\Test\\AppData\\Local\\Programs\\antigravity';
    const pickedProcs = meterEnhance.selectWindowsTargetProcesses(
      ['language_server.exe', 'language_server_windows_x64.exe'],
      [agRoot],
      new Set([100]),
      [
        { pid: 100, name: 'language_server.exe', exePath: `${agRoot}\\resources\\bin\\language_server.exe` },
        { pid: 200, name: 'language_server.exe', exePath: 'D:\\OtherIde\\language_server.exe' },
        { pid: 300, name: 'language_server.exe', exePath: `${agRoot}\\resources\\bin\\language_server.exe` },
      ]
    );
    assert.deepEqual(pickedProcs.map((p) => p.pid), [300]);

    // 3. P1.2 meter-context-unlock: 128K agy.exe variant & detectCliBinary
    assert.ok(meterUnlock.X64_CLAMP_VARIANTS.some((v) => v.id === 'ecx_edx_128k' && v.origLimit === 128000));
    const cliBinDir = path.join(tmpDir, '.gemini', 'antigravity', 'bin');
    fs.mkdirSync(cliBinDir, { recursive: true });
    const fakeAgyExe = path.join(cliBinDir, 'agy.exe');
    const fakeAgyCmd = path.join(cliBinDir, 'agy.cmd');
    fs.writeFileSync(fakeAgyExe, 'MZ');
    fs.writeFileSync(fakeAgyCmd, `@echo off\r\n"%~dp0agy.exe" %*\r\n`);
    assert.equal(meterCliLauncher.unwrapCmdTargetExe(fakeAgyCmd), fakeAgyExe);
    assert.equal(meterUnlock.detectCliBinary(null, { homeDir: tmpDir, platform: 'win32', env: { USERPROFILE: tmpDir, LOCALAPPDATA: tmpDir, APPDATA: tmpDir } }), path.resolve(fakeAgyExe));

    // 4. P1.2 meter-cli-launcher: resolveCliAccountProfile uses keyring-marker-disabled (not -keyring-unavailable)
    const accStateDir = path.join(tmpDir, 'cli-acct-state');
    const mgr = meterAccounts.createAccountsManager({ stateDir: accStateDir, homeDir: tmpDir, appDataDir: tmpDir });
    mgr.addAccountWithCredential({
      email: 'cli.iso@example.com',
      accessToken: 'acc-tok',
      refreshToken: 'ref-tok',
    });
    const prof = await meterCliLauncher.resolveCliAccountProfile('cli.iso@example.com', {
      stateDir: accStateDir,
      homeDir: tmpDir,
    });
    assert.equal(prof.ok, true);
    assert.equal(prof.isolated, true);
    assert.equal(fs.existsSync(path.join(prof.isolatedDir, 'keyring-marker-disabled')), true);
    assert.equal(fs.existsSync(path.join(prof.isolatedDir, 'antigravity-oauth-token')), true);

    // 5. P1.2 meter-proxy: launch env precedence, Windows Unicode path & credential redaction
    const targetEnv = { HTTPS_PROXY: 'http://127.0.0.1:9999' };
    meterProxy.applyProxyEnvironment(targetEnv, {
      overrideExisting: true,
      launchEnv: { AG_STUDIO_NO_TUN_LAUNCH: '1', HTTPS_PROXY: 'http://user:secret@127.0.0.1:7897', NO_PROXY: 'localhost' },
      env: { AG_STUDIO_STATE_DIR: tmpDir },
    });
    assert.equal(targetEnv.HTTPS_PROXY, 'http://user:secret@127.0.0.1:7897');
    assert.equal(meterProxy.redactProxyUrl('http://user:secret@127.0.0.1:7897'), 'http://127.0.0.1:7897');
    assert.match(meterProxy.sanitizeDiagnosticErrorText('Bearer secret_tok_123 http://u:p@127.0.0.1:7897'), /Bearer <REDACTED>/);
    const vbsText = meterProxy.generateWindowsNoTunVbs({
      exePath: 'C:\\测试目录\\Antigravity.exe',
      proxyUrl: 'http://127.0.0.1:7897',
      noProxy: 'localhost',
    });
    assert.match(vbsText, /ChrW\(&H6d4b\)/i);
  } finally {
    if (mockServer) await new Promise((resolve) => mockServer.close(resolve));
    if (cdpServer) await new Promise((resolve) => cdpServer.close(resolve));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
