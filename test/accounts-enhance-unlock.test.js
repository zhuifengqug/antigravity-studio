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

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-studio-acc-'));
  try {
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
