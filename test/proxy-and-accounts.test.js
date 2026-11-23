'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const proxyMgr = require('../src/main/proxy-manager');
const proto = require('../src/shared/proto-lite');
const {
  sealSecret,
  unsealSecret,
  maskEmail,
  readStateDbItems,
  AccountManager,
  TOPIC_OAUTH_KEY,
  TOPIC_USER_STATUS_KEY,
} = require('../src/main/account-manager');

test('Proxy URL normalization, bypass matching, and env injection', () => {
  const httpP = proxyMgr.normalizeProxyUrl('127.0.0.1:7897');
  assert.equal(httpP.normalized, 'http://127.0.0.1:7897');
  const socksP = proxyMgr.normalizeProxyUrl('socks5h://127.0.0.1:10808');
  assert.equal(socksP.chromiumProxyUrl, 'socks5://127.0.0.1:10808');

  assert.equal(proxyMgr.matchesBypassRule('192.168.1.50', '192.168.0.0/16,<local>'), true);
  assert.equal(proxyMgr.matchesBypassRule('localhost', '192.168.0.0/16,<local>'), true);
  assert.equal(proxyMgr.matchesBypassRule('api.google.com', '192.168.0.0/16,<local>'), false);

  const env = {};
  proxyMgr.applyProxyToEnv(env, { enabled: true, proxyUrl: 'http://127.0.0.1:7897', bypassList: 'localhost' });
  assert.equal(env.HTTP_PROXY, 'http://127.0.0.1:7897');
  assert.equal(env.HTTPS_PROXY, 'http://127.0.0.1:7897');
  assert.equal(env.NODE_USE_ENV_PROXY, '1');
});

test('HTTP CONNECT and SOCKS5 tunnel probes work against mock socket streams', async () => {
  const { EventEmitter } = require('node:events');

  function createMockSocket(onWrite) {
    const sock = new EventEmitter();
    sock.destroyed = false;
    sock.write = (data) => {
      onWrite(Buffer.isBuffer(data) ? data : Buffer.from(data), sock);
      return true;
    };
    sock.destroy = () => { sock.destroyed = true; };
    process.nextTick(() => sock.emit('connect'));
    return sock;
  }

  const origConnect = net.connect;
  try {
    // 1. Mock HTTP CONNECT
    net.connect = () => createMockSocket((buf, sock) => {
      assert.match(buf.toString('utf8'), /^CONNECT www\.gstatic\.com:443 HTTP\/1\.1/);
      process.nextTick(() => sock.emit('data', Buffer.from('HTTP/1.1 200 Connection Established\r\n\r\n')));
    });
    const res1 = await proxyMgr.testProxyConnectivity('http://127.0.0.1:7897', { skipTlsProbe: true });
    assert.equal(res1.ok, true);
    assert.equal(res1.protocol, 'http');

    // 2. Mock SOCKS5
    let socksStage = 0;
    net.connect = () => createMockSocket((buf, sock) => {
      if (socksStage === 0) {
        socksStage = 1;
        assert.equal(buf[0], 0x05);
        process.nextTick(() => sock.emit('data', Buffer.from([0x05, 0x00])));
      } else {
        assert.equal(buf[0], 0x05);
        assert.equal(buf[1], 0x01);
        process.nextTick(() => sock.emit('data', Buffer.from([0x05, 0x00, 0x00, 0x01, 127, 0, 0, 1, 0x01, 0xbb])));
      }
    });
    const res2 = await proxyMgr.testProxyConnectivity('socks5://127.0.0.1:10808', { skipTlsProbe: true });
    assert.equal(res2.ok, true);
    assert.equal(res2.protocol, 'socks5');
  } finally {
    net.connect = origConnect;
  }
});

test('Protobuf roundtrip, secret sealing, and SQLite state.vscdb account switch', async () => {
  const b64 = proto.buildUnifiedOAuthTokenTopicBase64({
    accessToken: 'ya29.test-access-token',
    refreshToken: '1//test-refresh-token',
    expirySeconds: 1893456000,
  });
  const parsedOAuth = proto.parseUnifiedOAuthTokenTopicBase64(b64);
  assert.equal(parsedOAuth.accessToken, 'ya29.test-access-token');
  assert.equal(parsedOAuth.refreshToken, '1//test-refresh-token');

  const sealed = sealSecret('super-secret-token');
  assert.notEqual(sealed, 'super-secret-token');
  assert.equal(unsealSecret(sealed), 'super-secret-token');
  assert.equal(maskEmail('alice.smith@gmail.com'), 'a***h@gmail.com');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-studio-acc-'));
  try {
    const stateDbPath = path.join(tmpDir, 'User', 'globalStorage', 'state.vscdb');
    const mgr = new AccountManager({ stateDir: tmpDir, stateDbPath });

    const a1 = mgr.addAccountDirect({
      email: 'user1@example.com',
      name: 'User One',
      planName: 'Pro',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      quotaSnapshot: { minRemainingFraction: 0.02, minRemainingPercent: 2 },
    });
    const a2 = mgr.addAccountDirect({
      email: 'user2@example.com',
      name: 'User Two',
      planName: 'Ultra',
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      quotaSnapshot: { minRemainingFraction: 0.9, minRemainingPercent: 90 },
    });

    const sw = await mgr.switchAccount(a2.id);
    assert.equal(sw.ok, true);
    assert.equal(fs.existsSync(stateDbPath), true);

    const dbItems = readStateDbItems(stateDbPath, [TOPIC_OAUTH_KEY, TOPIC_USER_STATUS_KEY]);
    const activeOAuth = proto.parseUnifiedOAuthTokenTopicBase64(dbItems[TOPIC_OAUTH_KEY]);
    const activeUser = proto.parseUnifiedUserStatusTopicBase64(dbItems[TOPIC_USER_STATUS_KEY]);
    assert.equal(activeOAuth.accessToken, 'access-2');
    assert.equal(activeUser.email, 'user2@example.com');

    // Auto-switch evaluation
    mgr.store.save({ quota: { autoSwitch: { enabled: true, threshold: 0.05 } } });
    // Active is a2, let's switch back to low-quota a1 and test evaluateAutoSwitch
    await mgr.switchAccount(a1.id);
    const evalRes = mgr.evaluateAutoSwitch(0.02);
    assert.equal(evalRes.shouldSwitch, true);
    assert.equal(evalRes.candidateId, a2.id);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
