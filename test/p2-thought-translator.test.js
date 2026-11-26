'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');

const backend = require('../src/backend/thought-translator');
const { createThoughtTranslatorController } = require('../src/renderer/thought-translator');

test('isBlockedTargetHost blocks SSRF & cloud-metadata addresses including IPv6 variants', () => {
  const blocked = [
    '',
    'metadata.google.internal',
    'sub.metadata.google.internal',
    'metadata.goog',
    'metadata',
    'instance-data',
    '169.254.169.254',
    '169.254.0.1',
    '0.0.0.0',
    '100.100.100.200',
    '::',
    'fe80::1',
    'fd00:ec2::254',
    '::ffff:169.254.169.254',
    '[::ffff:169.254.169.254]',
    '::169.254.169.254',
    '::ffff:0:169.254.169.254',
    '64:ff9b::169.254.169.254',
    '2002:a9fe:a9fe::',
  ];
  for (const host of blocked) {
    assert.equal(backend.isBlockedTargetHost(host), true, `Expected blocked host: ${host}`);
  }

  const allowed = [
    'api.openai.com',
    'localhost',
    '127.0.0.1',
    '::1',
    '[::1]',
    '192.168.1.25',
    '10.0.0.5',
  ];
  for (const host of allowed) {
    assert.equal(backend.isBlockedTargetHost(host), false, `Expected allowed host: ${host}`);
  }
});

test('validateOpenAiBaseUrl & normalizeOpenAiBaseUrl handle defaults, local bare hosts, and SSRF rejections', () => {
  assert.deepEqual(backend.validateOpenAiBaseUrl(''), {
    ok: true,
    url: 'https://api.openai.com/v1',
    isDefault: true,
  });
  assert.equal(backend.normalizeOpenAiBaseUrl('https://api.example.com/v1/chat/completions/'), 'https://api.example.com/v1');
  assert.equal(backend.normalizeOpenAiBaseUrl('localhost:11434'), 'http://localhost:11434/v1');
  assert.equal(backend.normalizeOpenAiBaseUrl('192.168.1.50:8000/v1/models'), 'http://192.168.1.50:8000/v1');
  assert.equal(backend.normalizeOpenAiBaseUrl('http://user:secret@api.example.com/custom/?k=1#frag'), 'https://api.openai.com/v1'.length ? 'http://api.example.com/custom' : '');

  assert.equal(backend.validateOpenAiBaseUrl('http://169.254.169.254/latest/meta-data').ok, false);
  assert.equal(backend.validateOpenAiBaseUrl('http://[::ffff:169.254.169.254]/v1').ok, false);
  assert.equal(backend.validateOpenAiBaseUrl('http://metadata.google.internal/v1').ok, false);
  assert.equal(backend.validateOpenAiBaseUrl('file:///etc/passwd').ok, false);
  assert.equal(backend.validateOpenAiBaseUrl('http://example.com:22/v1').ok, false);
  // Blocked URL falls back to safe default in normalizeOpenAiBaseUrl
  assert.equal(backend.normalizeOpenAiBaseUrl('http://169.254.169.254/v1'), 'https://api.openai.com/v1');
});

test('parseProxyUrl supports http, https, socks5, socks5h and rejects bad protocols/SSRF/control chars', () => {
  const pHttp = backend.parseProxyUrl('http://127.0.0.1:7897');
  assert.equal(pHttp.protocol, 'http:');
  assert.equal(pHttp.hostname, '127.0.0.1');
  assert.equal(pHttp.port, 7897);

  const pSocks = backend.parseProxyUrl('socks5h://alice:s3cr3t@127.0.0.1:1080');
  assert.equal(pSocks.protocol, 'socks5h:');
  assert.equal(pSocks.username, 'alice');
  assert.equal(pSocks.password, 's3cr3t');
  assert.equal(pSocks.port, 1080);

  const pSocksBare = backend.parseProxyUrl('socks5://127.0.0.1');
  assert.equal(pSocksBare.port, 1080);

  assert.equal(backend.parseProxyUrl(''), null);
  assert.equal(backend.parseProxyUrl('ftp://127.0.0.1:21'), null);
  assert.equal(backend.parseProxyUrl('javascript:alert(1)'), null);
  assert.equal(backend.parseProxyUrl('http://127.0.0.1:7897\r\nX-Injected: 1'), null);
  assert.equal(backend.parseProxyUrl('http://169.254.169.254:8080'), null);
  assert.equal(backend.parseProxyUrl('http://127.0.0.1:70000'), null);
});

test('protectInlineTokens & restoreInlineTokens preserve paths, #L line refs, backticks, and identifiers', () => {
  const input =
    'Inspect `translateThought` in src/backend/thought-translator.js#L12-L45 and C:\\Users\\dev\\app.ts#L8 using `--no-check`.';
  const { masked, tokens } = backend.protectInlineTokens(input);
  assert.ok(tokens.length >= 4);
  assert.doesNotMatch(masked, /thought-translator\.js#L12-L45/);
  assert.doesNotMatch(masked, /`translateThought`/);

  // Simulate machine translator altering whitespace/case around placeholder tokens
  const simulatedTranslated = masked
    .replace('Inspect', '检查')
    .replace('and', '以及')
    .replace('__OPID_0__', '__ opid_0 __');

  const restored = backend.restoreInlineTokens(simulatedTranslated, tokens);
  assert.equal(restored.ok, true);
  assert.match(restored.text, /`translateThought`/);
  assert.match(restored.text, /src\/backend\/thought-translator\.js#L12-L45/);
  assert.match(restored.text, /C:\\Users\\dev\\app\.ts#L8/);
  assert.match(restored.text, /`--no-check`/);
});

test('chunkThoughtText splits long multi-paragraph text cleanly and marks truncation beyond maxTotalChars', () => {
  const p1 = 'First paragraph. '.repeat(25).trim();
  const p2 = 'Second paragraph. '.repeat(25).trim();
  const p3 = 'Third paragraph. '.repeat(25).trim();
  const full = `${p1}\n\n${p2}\n\n${p3}`;

  const chunked = backend.chunkThoughtText(full, 500, 5000);
  assert.ok(chunked.chunks.length >= 3);
  assert.equal(chunked.truncated, false);
  for (const c of chunked.chunks) {
    assert.ok(c.length <= 500, `Chunk exceeded 500 chars: ${c.length}`);
  }

  const truncated = backend.chunkThoughtText(full, 400, 700);
  assert.equal(truncated.truncated, true);
  assert.ok(truncated.translatedLength <= 700);
});

test('AI engine allows empty apiKey for loopback/Ollama, blocks redirects, and redacts apiKey in diagnose', async () => {
  const seenAuth = [];
  const server = http.createServer((req, res) => {
    seenAuth.push(req.headers.authorization || '');
    if (req.url === '/redirect/chat/completions') {
      res.writeHead(302, { Location: 'http://evil.example.com/steal' });
      res.end();
      return;
    }
    let body = '';
    req.on('data', (d) => { body += d; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        choices: [{ message: { content: '我正在检查配置。' } }],
      }));
    });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-thought-ai-'));

  try {
    // 1. Keyless loopback allowed (e.g. Ollama)
    const localRes = await backend.translateThought({
      text: 'Checking local Ollama model behavior.',
      mode: 'ai',
      baseUrl: `http://127.0.0.1:${port}/v1`,
      apiKey: '',
      model: 'qwen3:8b',
      stateDir: tmpDir,
    });
    assert.equal(localRes.ok, true);
    assert.equal(localRes.text, '我正在检查配置。');
    assert.equal(seenAuth[0], '');

    // 2. Remote URL without apiKey is rejected
    const remoteRes = await backend.translateThought({
      text: 'Checking remote model without key.',
      mode: 'ai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4o-mini',
      stateDir: tmpDir,
    });
    assert.equal(remoteRes.ok, false);
    assert.match(remoteRes.error, /api key/i);

    // 3. HTTP redirect is strictly blocked
    const redirRes = await backend.translateThought({
      text: 'Checking redirect blocking.',
      mode: 'ai',
      baseUrl: `http://127.0.0.1:${port}/redirect`,
      apiKey: 'sk-secret-redirect-999999',
      model: 'gpt-4o-mini',
      force: true,
      stateDir: tmpDir,
    });
    assert.equal(redirRes.ok, false);
    assert.match(redirRes.error, /Redirect blocked/i);
    assert.ok(!redirRes.error.includes('sk-secret-redirect-999999'));

    // 4. diagnose returns redacted result & latency
    const diag = await backend.diagnose({
      config: {
        thought: {
          mode: 'ai',
          baseUrl: `http://127.0.0.1:${port}/v1`,
          apiKey: 'sk-topsecret-123456789',
          model: 'qwen3:8b',
          proxyUrl: 'http://user:proxypass@127.0.0.1:7897',
          stateDir: tmpDir,
        },
      },
    });
    assert.equal(diag.ok, true);
    assert.equal(diag.mode, 'ai');
    assert.equal(typeof diag.latencyMs, 'number');
    assert.equal(diag.sample, '我正在检查配置。');
    assert.ok(!JSON.stringify(diag).includes('sk-topsecret-123456789'));
    assert.ok(!JSON.stringify(diag).includes('proxypass'));
  } finally {
    backend.clearCache(tmpDir);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Disk cache persists across translateThought calls and clearCache removes disk file', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-thought-cache-'));
  let fetchCount = 0;
  const mockFetch = async () => {
    fetchCount++;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      async text() {
        return JSON.stringify([[['检查缓存持久性。', 'Checking cache persistence.']]]);
      },
    };
  };

  try {
    const r1 = await backend.translateThought({
      text: 'Checking cache persistence.',
      mode: 'machine',
      targetLang: 'zh-CN',
      stateDir: tmpDir,
      fetchImpl: mockFetch,
    });
    assert.equal(r1.ok, true);
    assert.equal(r1.cached, false);
    assert.equal(fetchCount, 1);

    const cacheFile = path.join(tmpDir, 'thought-translate-cache.json');
    assert.equal(fs.existsSync(cacheFile), true);
    const diskJson = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    assert.equal(Object.keys(diskJson.entries).length, 1);

    const r2 = await backend.translateThought({
      text: 'Checking cache persistence.',
      mode: 'machine',
      targetLang: 'zh-CN',
      stateDir: tmpDir,
      fetchImpl: mockFetch,
    });
    assert.equal(r2.ok, true);
    assert.equal(r2.cached, true);
    assert.equal(r2.text, '检查缓存持久性。');
    assert.equal(fetchCount, 1);

    const cleared = backend.clearCache(tmpDir);
    assert.equal(cleared.ok, true);
    assert.equal(cleared.cleared, 1);
    assert.equal(fs.existsSync(cacheFile), false);
  } finally {
    backend.clearCache(tmpDir);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Pure-Node SOCKS5h tunnel and proxy priority resolution work end-to-end', async () => {
  // Spin up a target HTTP server and a minimal SOCKS5 server
  const targetServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { content: '隧道工作正常' } }] }));
  });
  await new Promise((resolve) => targetServer.listen(0, '127.0.0.1', resolve));
  const targetPort = targetServer.address().port;

  let socksHandled = 0;
  const socksServer = net.createServer((clientSock) => {
    let stage = 'greeting';
    let upstream = null;
    clientSock.on('data', (chunk) => {
      if (stage === 'greeting') {
        stage = 'connect';
        clientSock.write(Buffer.from([0x05, 0x00]));
      } else if (stage === 'connect') {
        socksHandled++;
        // Parse SOCKS5 connect request (ver=5, cmd=1, rsv=0, atyp=3 domain or 1 ipv4)
        const atyp = chunk[3];
        let destPort;
        if (atyp === 0x03) {
          const len = chunk[4];
          destPort = chunk.readUInt16BE(5 + len);
        } else {
          destPort = chunk.readUInt16BE(8);
        }
        stage = 'pipe';
        upstream = net.connect(destPort, '127.0.0.1', () => {
          clientSock.write(Buffer.from([0x05, 0x00, 0x00, 0x01, 127, 0, 0, 1, 0, 0]));
          upstream.pipe(clientSock);
          clientSock.pipe(upstream);
        });
        upstream.on('error', () => clientSock.destroy());
      }
    });
    clientSock.on('error', () => { if (upstream) upstream.destroy(); });
  });
  await new Promise((resolve) => socksServer.listen(0, '127.0.0.1', resolve));
  const socksPort = socksServer.address().port;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-thought-socks-'));

  try {
    // Verify proxy resolution priority: explicit config.proxyUrl > proxyFallback > env > OS > direct
    const p1 = backend.resolveProxyForRequest('https://translate.googleapis.com/translate_a/single', {
      config: { thought: { proxyUrl: 'http://127.0.0.1:9999' } },
      proxyFallback: { enabled: true, proxyUrl: 'http://127.0.0.1:8888' },
      env: { HTTPS_PROXY: 'http://127.0.0.1:7777' },
      osConfig: { enabled: true, https: backend.parseProxyUrl('http://127.0.0.1:6666') },
    });
    assert.equal(p1.source, 'config');
    assert.equal(p1.proxy.port, 9999);

    const p2 = backend.resolveProxyForRequest('https://translate.googleapis.com/translate_a/single', {
      config: {},
      proxyFallback: { enabled: true, proxyUrl: 'http://127.0.0.1:8888' },
      env: { HTTPS_PROXY: 'http://127.0.0.1:7777' },
      osConfig: { enabled: true, https: backend.parseProxyUrl('http://127.0.0.1:6666') },
    });
    assert.equal(p2.source, 'proxyFallback');
    assert.equal(p2.proxy.port, 8888);

    const p3 = backend.resolveProxyForRequest('https://translate.googleapis.com/translate_a/single', {
      config: {},
      proxyFallback: { enabled: false, proxyUrl: 'http://127.0.0.1:8888' },
      env: { HTTPS_PROXY: 'http://127.0.0.1:7777' },
      osConfig: { enabled: true, https: backend.parseProxyUrl('http://127.0.0.1:6666') },
    });
    assert.equal(p3.source, 'env');
    assert.equal(p3.proxy.port, 7777);

    const p4 = backend.resolveProxyForRequest('https://translate.googleapis.com/translate_a/single', {
      config: {},
      env: {},
      osConfig: { enabled: true, https: backend.parseProxyUrl('http://127.0.0.1:6666') },
    });
    assert.equal(p4.source, 'os');
    assert.equal(p4.proxy.port, 6666);

    // Live SOCKS5h tunnel request to non-loopback hostname (using local test host via custom DNS/proxy)
    const res = await backend.translateThought({
      text: 'Testing SOCKS5h tunnel.',
      mode: 'ai',
      baseUrl: `http://ollama.local.test:${targetPort}/v1`,
      apiKey: 'sk-test-tunnel',
      model: 'test-model',
      proxyUrl: `socks5h://127.0.0.1:${socksPort}`,
      stateDir: tmpDir,
    });
    assert.equal(res.ok, true);
    assert.equal(res.text, '隧道工作正常');
    assert.equal(socksHandled, 1);
  } finally {
    backend.clearCache(tmpDir);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    await new Promise((resolve) => socksServer.close(resolve));
    await new Promise((resolve) => targetServer.close(resolve));
  }
});

// --- Lightweight Mock DOM for Renderer Controller Tests ---
function createMockDom() {
  class MockNode {
    constructor(nodeType, tagName = '') {
      this.nodeType = nodeType;
      this.tagName = tagName;
      this.parentNode = null;
      this.childNodes = [];
      this.attrs = new Map();
      this.listeners = new Map();
      this.style = {};
      this.id = '';
      this.className = '';
      this.hidden = false;
      this.isConnected = true;
      this._text = '';
      const self = this;
      this.classList = {
        contains(c) { return (' ' + self.className + ' ').includes(' ' + c + ' '); },
        add(c) { if (!this.contains(c)) self.className = (self.className + ' ' + c).trim(); },
        remove(c) { self.className = self.className.split(/\s+/).filter((x) => x && x !== c).join(' '); },
      };
    }
    get parentElement() { return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null; }
    get firstChild() { return this.childNodes[0] || null; }
    get children() { return this.childNodes.filter((n) => n.nodeType === 1); }
    get nextElementSibling() {
      if (!this.parentNode) return null;
      const sibs = this.parentNode.children;
      const idx = sibs.indexOf(this);
      return idx >= 0 ? sibs[idx + 1] || null : null;
    }
    get textContent() {
      if (this.nodeType === 3) return this._text;
      return this.childNodes.map((n) => n.textContent).join('');
    }
    set textContent(v) {
      if (this.nodeType === 3) {
        this._text = String(v);
        this.nodeValue = this._text;
      } else {
        this.childNodes = [];
        if (v !== '' && v !== null && v !== undefined) {
          const tn = new MockNode(3);
          tn.textContent = String(v);
          this.appendChild(tn);
        }
      }
    }
    appendChild(child) {
      if (child.parentNode) child.parentNode.removeChild(child);
      child.parentNode = this;
      this.childNodes.push(child);
      return child;
    }
    insertBefore(newNode, refNode) {
      if (!refNode) return this.appendChild(newNode);
      if (newNode.parentNode) newNode.parentNode.removeChild(newNode);
      const idx = this.childNodes.indexOf(refNode);
      if (idx === -1) return this.appendChild(newNode);
      newNode.parentNode = this;
      this.childNodes.splice(idx, 0, newNode);
      return newNode;
    }
    removeChild(child) {
      const idx = this.childNodes.indexOf(child);
      if (idx >= 0) {
        this.childNodes.splice(idx, 1);
        child.parentNode = null;
      }
      return child;
    }
    remove() {
      if (this.parentNode) this.parentNode.removeChild(this);
    }
    setAttribute(k, v) {
      const val = String(v);
      this.attrs.set(k, val);
      if (k === 'id') this.id = val;
      if (k === 'class') this.className = val;
    }
    getAttribute(k) {
      if (k === 'id' && this.id) return this.id;
      if (k === 'class' && this.className) return this.className;
      return this.attrs.has(k) ? this.attrs.get(k) : null;
    }
    hasAttribute(k) { return this.attrs.has(k); }
    removeAttribute(k) { this.attrs.delete(k); }
    addEventListener(type, fn) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(fn);
    }
    click() {
      for (const fn of (this.listeners.get('click') || [])) {
        fn({ preventDefault() {}, stopPropagation() {} });
      }
    }
    matchesSelector(sel) {
      const s = sel.trim();
      if (s.startsWith('#')) return this.id === s.slice(1);
      if (s.startsWith('.')) return this.classList.contains(s.slice(1));
      const attrMatch = /^(?:([a-zA-Z0-9]+))?\[([a-zA-Z0-9_-]+)(?:="([^"]*)")?\]$/.exec(s);
      if (attrMatch) {
        if (attrMatch[1] && this.tagName.toLowerCase() !== attrMatch[1].toLowerCase()) return false;
        if (attrMatch[3] !== undefined) return this.getAttribute(attrMatch[2]) === attrMatch[3];
        return this.hasAttribute(attrMatch[2]);
      }
      return this.tagName.toLowerCase() === s.toLowerCase();
    }
    querySelectorAll(sel) {
      const parts = sel.split(',').map((p) => p.trim()).filter(Boolean);
      const out = [];
      const walk = (node) => {
        for (const ch of node.children) {
          if (parts.some((p) => ch.matchesSelector(p))) out.push(ch);
          walk(ch);
        }
      };
      walk(this);
      return out;
    }
    querySelector(sel) {
      return this.querySelectorAll(sel)[0] || null;
    }
  }

  const documentElement = new MockNode(1, 'HTML');
  const head = new MockNode(1, 'HEAD');
  const body = new MockNode(1, 'BODY');
  documentElement.appendChild(head);
  documentElement.appendChild(body);

  return {
    documentElement,
    head,
    body,
    createElement(tag) { return new MockNode(1, String(tag).toUpperCase()); },
    createTextNode(txt) {
      const n = new MockNode(3);
      n.textContent = String(txt);
      return n;
    },
    getElementById(id) { return documentElement.querySelector('#' + id); },
    querySelectorAll(sel) { return documentElement.querySelectorAll(sel); },
    querySelector(sel) { return documentElement.querySelector(sel); },
  };
}

test('Renderer controller: off mode has zero IPC calls and cleans up; bilingual/immersive/retranslate/destroy work cleanly', async () => {
  const doc = createMockDom();
  const trigger = doc.createElement('button');
  trigger.setAttribute('data-testid', 'thinking-collapsible-trigger');
  trigger.setAttribute('aria-expanded', 'true');
  trigger.textContent = 'Thought for 2s';

  const panel = doc.createElement('div');
  const origPara = doc.createElement('p');
  origPara.textContent = 'Checking `src/app.js` and [open](file:///d:/repo/src/app.js) vs [bad](javascript:alert(1)).';
  const origAnchor = doc.createElement('a');
  origAnchor.setAttribute('href', 'file:///d:/repo/src/app.js');
  origAnchor.textContent = 'src/app.js';
  panel.appendChild(origPara);
  panel.appendChild(origAnchor);

  doc.body.appendChild(trigger);
  doc.body.appendChild(panel);

  const calls = [];
  const mockApi = {
    async translateThought(payload) {
      calls.push(payload);
      return {
        ok: true,
        text: '正在检查 `translateThought` 与 `src/app.js` 和 [open](file:///d:/repo/src/app.js) 以及 [bad](javascript:alert(1))。',
        engine: payload.mode,
      };
    },
  };

  const ctrl = createThoughtTranslatorController({ document: doc, debounceMs: 0 });

  // 1. Disabled mode -> zero IPC calls, no injected styles or boxes
  ctrl.sync({ thought: { mode: 'off' } }, mockApi);
  assert.equal(calls.length, 0);
  assert.equal(doc.getElementById('ags-thought-translator-style'), null);
  assert.equal(panel.querySelectorAll('.ags-thought-box').length, 0);

  // 2. Enabled machine + bilingual mode
  ctrl.sync({
    thought: { mode: 'machine', viewMode: 'bilingual' },
    i18n: { language: 'zh-CN' },
  }, mockApi);
  await new Promise((r) => setTimeout(r, 20));

  assert.equal(calls.length, 1);
  assert.ok(doc.getElementById('ags-thought-translator-style'));
  const box = panel.querySelector('.ags-thought-box');
  assert.ok(box);
  assert.equal(box.getAttribute('data-ag-studio-ignore'), 'true');
  assert.equal(box.getAttribute('data-ag-no-i18n'), 'true');
  assert.equal(panel.getAttribute('data-ags-thought-ready'), '1');
  assert.equal(panel.getAttribute('data-ags-thought-view'), 'bilingual');
  assert.equal(panel.getAttribute('data-ags-thought-bilingual'), '1');
  assert.equal(panel.getAttribute('data-ags-thought-show-raw'), '1');
  // Original React-managed text node was never mutated
  assert.match(origPara.textContent, /^Checking `src\/app\.js`/);

  // Safe file:// links rendered (both matched backtick and markdown file:// link); non-file protocols rejected
  const pills = box.querySelectorAll('.ags-thought-file-pill');
  assert.equal(pills.length, 2);
  assert.equal(pills[0].getAttribute('href'), 'file:///d:/repo/src/app.js');
  assert.equal(pills[1].getAttribute('href'), 'file:///d:/repo/src/app.js');
  assert.equal(box.querySelectorAll('.ags-thought-code').length, 1);
  assert.equal(box.querySelectorAll('a[href^="javascript:"]').length, 0);

  // 3. Switch to immersive mode
  ctrl.sync({
    thought: { mode: 'machine', viewMode: 'immersive' },
    i18n: { language: 'zh-CN' },
  }, mockApi);
  assert.equal(panel.getAttribute('data-ags-thought-view'), 'immersive');
  assert.equal(panel.hasAttribute('data-ags-thought-bilingual'), false);
  assert.equal(panel.hasAttribute('data-ags-thought-show-raw'), false);

  // 4. Force retranslate button sends force: true
  const retranslateBtn = box.querySelector('.ags-thought-retranslate-btn');
  assert.ok(retranslateBtn);
  retranslateBtn.click();
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(calls.length, 2);
  assert.equal(calls[1].force, true);

  // 5. Switch to mode: 'off' cleans up everything cleanly
  ctrl.sync({ thought: { mode: 'off' } }, mockApi);
  assert.equal(panel.querySelectorAll('.ags-thought-box').length, 0);
  assert.equal(doc.getElementById('ags-thought-translator-style'), null);
  assert.equal(panel.hasAttribute('data-ags-thought-panel'), false);
  assert.equal(panel.hasAttribute('data-ags-thought-ready'), false);
  assert.equal(calls.length, 2);

  // 6. Re-enable and destroy() cleans up everything cleanly
  ctrl.sync({ thought: { mode: 'machine', viewMode: 'immersive' }, i18n: { language: 'zh-CN' } }, mockApi);
  await new Promise((r) => setTimeout(r, 20));
  assert.ok(panel.querySelector('.ags-thought-box'));
  ctrl.destroy();
  assert.equal(panel.querySelectorAll('.ags-thought-box').length, 0);
  assert.equal(doc.getElementById('ags-thought-translator-style'), null);
});

test('Concurrency limit caps active translations at 3, detectSystemProxy parses Windows Registry, and kind=tool_summary/title work', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-thought-conc-'));
  let active = 0;
  let peak = 0;
  const mockFetch = async (url) => {
    active++;
    peak = Math.max(peak, active);
    await new Promise((r) => setTimeout(r, 25));
    active--;
    const q = new URL(url).searchParams.get('q') || '';
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      async text() {
        return JSON.stringify([[['译文:' + q, q]]]);
      },
    };
  };

  try {
    const jobs = [];
    for (let i = 0; i < 6; i++) {
      jobs.push(
        backend.translateThought({
          text: `Concurrent thought item number ${i} needing translation.`,
          mode: 'machine',
          kind: i === 0 ? 'tool_summary' : i === 1 ? 'title' : 'thought',
          targetLang: 'zh-CN',
          stateDir: tmpDir,
          fetchImpl: mockFetch,
        })
      );
    }
    const results = await Promise.all(jobs);
    assert.equal(results.every((r) => r.ok), true);
    assert.ok(peak <= 3 && peak >= 2, `Expected peak concurrency between 2 and 3, got ${peak}`);

    const regOut = [
      'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
      '    ProxyEnable    REG_DWORD    0x1',
      '    ProxyServer    REG_SZ    127.0.0.1:7897',
      '    ProxyOverride    REG_SZ    localhost;127.*;<local>',
    ].join('\r\n');
    const detected = backend.detectSystemProxy({
      platform: 'win32',
      noCache: true,
      execFileSyncFn: () => regOut,
    });
    assert.equal(detected.enabled, true);
    assert.equal(detected.https.hostname, '127.0.0.1');
    assert.equal(detected.https.port, 7897);
    assert.deepEqual(detected.bypass, ['localhost', '127.*', '<local>']);
  } finally {
    backend.clearCache(tmpDir);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
