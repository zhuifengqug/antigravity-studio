'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const proxyManager = require('../src/backend/proxy-manager');
const geminiWebMod = require('../src/renderer/gemini-web-mode');
const aiStudioI18n = require('../src/i18n/aistudio-i18n');
const studioMain = require('../src/backend/studio-main');

function createMiniDom() {
  function makeClassList(el) {
    return {
      add: (...cls) => {
        const cur = new Set(String(el.className || '').split(/\s+/).filter(Boolean));
        cls.forEach((c) => cur.add(c));
        el.className = Array.from(cur).join(' ');
      },
      remove: (...cls) => {
        const cur = new Set(String(el.className || '').split(/\s+/).filter(Boolean));
        cls.forEach((c) => cur.delete(c));
        el.className = Array.from(cur).join(' ');
      },
      contains: (c) => String(el.className || '').split(/\s+/).filter(Boolean).includes(c),
    };
  }

  function makeEl(tag, attrs = {}) {
    const el = {
      tagName: String(tag || 'div').toUpperCase(),
      nodeType: 1,
      id: attrs.id || '',
      className: attrs.class || '',
      attributes: new Map(),
      style: {},
      children: [],
      parentNode: null,
      parentElement: null,
      listeners: new Map(),
      textContent: '',
      _rect: { top: 0, left: 0, width: 320, height: 600 },
      getBoundingClientRect() { return el._rect; },
      setAttribute(k, v) {
        if (k === 'id') el.id = String(v);
        if (k === 'class') el.className = String(v);
        el.attributes.set(String(k), String(v));
      },
      getAttribute(k) {
        if (k === 'id') return el.id || null;
        if (k === 'class') return el.className || null;
        return el.attributes.has(k) ? el.attributes.get(k) : null;
      },
      hasAttribute(k) {
        return el.attributes.has(k) || (k === 'id' && Boolean(el.id));
      },
      removeAttribute(k) {
        el.attributes.delete(k);
      },
      get nodeValue() { return el.textContent; },
      set nodeValue(v) { el.textContent = String(v || ''); },
      get childNodes() { return el.children; },
      addEventListener(type, fn) {
        if (!el.listeners.has(type)) el.listeners.set(type, []);
        el.listeners.get(type).push(fn);
      },
      dispatchEvent(type, payload) {
        const fns = el.listeners.get(type) || [];
        for (const fn of fns) fn(payload || {});
      },
      appendChild(child) {
        if (child.parentNode && child.parentNode !== el) {
          const prev = child.parentNode.children;
          const idx = prev.indexOf(child);
          if (idx >= 0) prev.splice(idx, 1);
        }
        el.children.push(child);
        child.parentNode = el;
        child.parentElement = el;
        return child;
      },
      insertBefore(newChild, refChild) {
        if (!refChild) return el.appendChild(newChild);
        if (newChild.parentNode) {
          const prev = newChild.parentNode.children;
          const oldIdx = prev.indexOf(newChild);
          if (oldIdx >= 0) prev.splice(oldIdx, 1);
        }
        const idx = el.children.indexOf(refChild);
        if (idx < 0) return el.appendChild(newChild);
        el.children.splice(idx, 0, newChild);
        newChild.parentNode = el;
        newChild.parentElement = el;
        return newChild;
      },
      removeChild(child) {
        const idx = el.children.indexOf(child);
        if (idx >= 0) el.children.splice(idx, 1);
        child.parentNode = null;
        child.parentElement = null;
        return child;
      },
      remove() {
        if (el.parentNode) el.parentNode.removeChild(el);
      },
      get firstChild() { return el.children[0] || null; },
      get nextSibling() {
        if (!el.parentNode) return null;
        const idx = el.parentNode.children.indexOf(el);
        return idx >= 0 ? (el.parentNode.children[idx + 1] || null) : null;
      },
      querySelector(sel) {
        return el.querySelectorAll(sel)[0] || null;
      },
      querySelectorAll(sel) {
        const out = [];
        const parts = sel.split(',').map((s) => s.trim()).filter(Boolean);
        const matchesOne = (node, s) => {
          if (s.startsWith('.')) return node.classList.contains(s.slice(1));
          if (s.startsWith('#')) return node.id === s.slice(1);
          const am = /^\[([^\]=]+)(?:="([^"]*)")?\]$/.exec(s);
          if (am) {
            const v = node.getAttribute(am[1]);
            return am[2] !== undefined ? v === am[2] : v !== null;
          }
          return node.tagName.toLowerCase() === s.toLowerCase();
        };
        const walk = (root) => {
          for (const c of root.children) {
            if (parts.some((p) => matchesOne(c, p))) out.push(c);
            walk(c);
          }
        };
        walk(el);
        return out;
      },
    };
    el.classList = makeClassList(el);
    return el;
  }

  const doc = {
    documentElement: makeEl('html'),
    head: makeEl('head'),
    body: makeEl('body'),
    createElement: (tag) => makeEl(tag),
    createElementNS: (_ns, tag) => makeEl(tag),
    getElementById(id) {
      for (const root of [doc.head, doc.body, doc.documentElement]) {
        const hit = root.querySelector(`#${id}`);
        if (hit) return hit;
      }
      return null;
    },
    querySelector(sel) {
      return doc.body.querySelector(sel) || doc.head.querySelector(sel) || doc.documentElement.querySelector(sel);
    },
    querySelectorAll(sel) {
      return [...doc.head.querySelectorAll(sel), ...doc.body.querySelectorAll(sel)];
    },
  };
  return { doc, makeEl };
}

test('sanitizeWebUrl allows https and loopback http, rejects unsafe schemes', () => {
  assert.equal(geminiWebMod.sanitizeWebUrl('https://gemini.google.com/app'), 'https://gemini.google.com/app');
  assert.equal(geminiWebMod.sanitizeWebUrl('https://aistudio.google.com/prompts'), 'https://aistudio.google.com/prompts');
  assert.equal(geminiWebMod.sanitizeWebUrl('http://127.0.0.1:3000/chat'), 'http://127.0.0.1:3000/chat');
  assert.equal(geminiWebMod.sanitizeWebUrl('http://localhost:8080'), 'http://localhost:8080/');
  assert.equal(geminiWebMod.sanitizeWebUrl('javascript:alert(1)'), 'https://gemini.google.com/app');
  assert.equal(geminiWebMod.sanitizeWebUrl('file:///etc/passwd'), 'https://gemini.google.com/app');
  assert.equal(geminiWebMod.sanitizeWebUrl('data:text/html,<h1>x</h1>'), 'https://gemini.google.com/app');
  assert.equal(geminiWebMod.sanitizeWebUrl('http://example.com'), 'https://gemini.google.com/app');
});

test('Gemini Web mode mounts top-left switcher, lazy-loads webview on demand, preserves state on return, and cleans up cleanly', () => {
  const { doc, makeEl } = createMiniDom();
  const split = makeEl('div');
  split.setAttribute('data-testid', 'sidebar-split');
  const nav = makeEl('div');
  const headerSlot = makeEl('div');
  headerSlot._rect = { top: 0, left: 0, width: 260, height: 40 };
  const bodySlot = makeEl('div');
  bodySlot.setAttribute('data-testid', 'native-list');
  const convRow = makeEl('div');
  convRow.setAttribute('data-testid', 'conversation-row-sidebar');
  bodySlot.appendChild(convRow);
  const footerSlot = makeEl('div');
  footerSlot._rect = { top: 550, left: 0, width: 260, height: 48 };
  nav.appendChild(headerSlot);
  nav.appendChild(bodySlot);
  nav.appendChild(footerSlot);

  const rightPane = makeEl('div');
  rightPane._rect = { top: 0, left: 260, width: 1000, height: 600 };
  split.appendChild(nav);
  split.appendChild(rightPane);
  doc.body.appendChild(split);

  const ctrl = geminiWebMod.createGeminiWebController({
    getDocument: () => doc,
  });

  ctrl.sync({
    cfg: {
      geminiWeb: { enabled: true, defaultUrl: 'https://gemini.google.com/app' },
      proxy: { enabled: true, proxyUrl: 'http://127.0.0.1:7897' },
    },
    isGenerating: true,
  });

  // In default code mode: dock mounted right after headerSlot, zero <webview> allocated
  const dock = doc.querySelector('[data-testid="ags-gemini-mode-dock"]');
  assert.ok(dock, 'top-left switcher dock must mount');
  assert.equal(nav.children[1], dock, 'dock must be right after headerSlot');
  assert.equal(doc.querySelectorAll('webview').length, 0, 'webview must be lazy (0 in code mode)');
  assert.equal(bodySlot.classList.contains('ags-gw-native-hidden'), false);

  // Switch to Gemini mode
  ctrl.setMode('gemini');
  assert.equal(bodySlot.classList.contains('ags-gw-native-hidden'), true);
  assert.equal(headerSlot.classList.contains('ags-gw-native-hidden'), false, 'headerSlot must remain visible');
  assert.equal(footerSlot.classList.contains('ags-gw-native-hidden'), false, 'footerSlot must remain visible');

  const webviews = doc.querySelectorAll('webview');
  assert.equal(webviews.length, 1);
  assert.equal(webviews[0].getAttribute('partition'), 'persist:ag-studio-gemini-web');
  assert.equal(webviews[0].getAttribute('src'), 'https://gemini.google.com/app');
  assert.equal(webviews[0].getAttribute('allowpopups'), 'true');
  assert.equal(doc.querySelector('.ags-gw-stage').getAttribute('data-active'), '1');

  // Pure full-bleed Gemini UI checks: no browser toolbar, no multi-site switcher, minimalist hero & new chat btn
  assert.equal(doc.querySelector('.ags-gw-toolbar'), null, 'redundant browser toolbar must be removed');
  assert.equal(doc.querySelectorAll('.ags-gw-site-btn').length, 0, 'multi-site buttons must be removed');
  assert.ok(doc.querySelector('.ags-gw-hero'), 'Gemini hero card must be present');
  assert.ok(doc.querySelector('.ags-gw-new-btn'), 'primary new-chat button must be present');
  assert.equal(doc.querySelector('.ags-gw-float-back').getAttribute('data-visible'), '0', 'float-back hidden when sidebar open');

  // Running dot shows on Code button while in Gemini mode
  ctrl.sync({
    cfg: { geminiWeb: { enabled: true, defaultUrl: 'https://gemini.google.com/app' } },
    isGenerating: true,
    awaitingDecision: false,
  });
  assert.equal(doc.querySelector('.ags-gw-dot').getAttribute('data-status'), 'running');

  // Switch back to Code: native list returns immediately, webview stays alive hidden
  ctrl.setMode('code');
  assert.equal(bodySlot.classList.contains('ags-gw-native-hidden'), false);
  assert.equal(doc.querySelector('.ags-gw-stage').getAttribute('data-active'), '0');
  assert.equal(doc.querySelectorAll('webview').length, 1, 'webview stays alive across toggles');

  // Disable via config cleans everything cleanly
  ctrl.sync({
    cfg: { geminiWeb: { enabled: false } },
  });
  assert.equal(doc.querySelectorAll('webview').length, 0);
  assert.equal(doc.querySelector('[data-testid="ags-gemini-mode-dock"]'), null);
  assert.equal(doc.getElementById('ag-studio-gemini-web-style'), null);

  ctrl.destroy();
});

test('applySessionProxy configures proxy on persist:ag-studio-gemini-web partition', async () => {
  const calls = [];
  const fakeSession = (name) => ({
    async setProxy(cfg) {
      calls.push({ name, cfg });
    },
  });
  const electronSession = {
    defaultSession: fakeSession('default'),
    fromPartition: (part) => fakeSession(part),
  };

  await proxyManager.applySessionProxy(null, electronSession, {
    enabled: true,
    proxyUrl: 'http://127.0.0.1:7897',
    bypassList: 'localhost,127.0.0.1',
  });

  const geminiCall = calls.find((c) => c.name === 'persist:ag-studio-gemini-web');
  assert.ok(geminiCall, 'persist:ag-studio-gemini-web session must receive proxy config');
  assert.equal(geminiCall.cfg.mode, 'fixed_servers');
  assert.equal(geminiCall.cfg.proxyRules, 'http://127.0.0.1:7897');
});

test('Gemini Web mode unwraps 2.35.2 nested sidebar-split wrapper divs (div.contents / data-peek-surface)', () => {
  const { doc, makeEl } = createMiniDom();
  const split = makeEl('div');
  split.setAttribute('data-testid', 'sidebar-split');
  const outerWrap = makeEl('div', { class: 'contents' });
  const peekSurface = makeEl('div');
  peekSurface.setAttribute('data-peek-surface', 'closed');
  const innerAside = makeEl('aside');

  const headerSlot = makeEl('div');
  headerSlot._rect = { top: 0, left: 0, width: 260, height: 40 };
  const navItems = makeEl('div');
  navItems.setAttribute('data-testid', 'navigation-items');
  const newBtn = makeEl('div');
  newBtn.setAttribute('data-testid', 'new-conversation-button');
  navItems.appendChild(newBtn);
  const convList = makeEl('div');
  convList.setAttribute('data-testid', 'conversation-list-sidebar');
  const convRow = makeEl('div');
  convRow.setAttribute('data-testid', 'conversation-row-sidebar');
  convList.appendChild(convRow);
  const footerSlot = makeEl('div');
  footerSlot._rect = { top: 550, left: 0, width: 260, height: 48 };

  innerAside.appendChild(headerSlot);
  innerAside.appendChild(navItems);
  innerAside.appendChild(convList);
  innerAside.appendChild(footerSlot);
  peekSurface.appendChild(innerAside);
  outerWrap.appendChild(peekSurface);

  const rightPane = makeEl('div');
  rightPane._rect = { top: 0, left: 260, width: 1000, height: 600 };
  split.appendChild(outerWrap);
  split.appendChild(rightPane);
  doc.body.appendChild(split);

  const ctrl = geminiWebMod.createGeminiWebController({ getDocument: () => doc });
  ctrl.sync({ cfg: { geminiWeb: { enabled: true, defaultUrl: 'https://gemini.google.com/app' } } });

  const dock = doc.querySelector('[data-testid="ags-gemini-mode-dock"]');
  assert.ok(dock, 'dock must mount inside unwrapped innerAside');
  assert.equal(dock.parentNode, innerAside, 'dock must mount inside innerAside, not outer div.contents wrapper');
  assert.equal(innerAside.children[1], dock, 'dock must appear right after headerSlot and before navigation-items');

  ctrl.setMode('gemini');
  assert.equal(headerSlot.classList.contains('ags-gw-native-hidden'), false);
  assert.equal(navItems.classList.contains('ags-gw-native-hidden'), true);
  assert.equal(convList.classList.contains('ags-gw-native-hidden'), true);
  assert.equal(footerSlot.classList.contains('ags-gw-native-hidden'), false);

  // Dual-webview lazy creation & 0ms toggle between Gemini and AI Studio
  assert.equal(doc.querySelectorAll('webview').length, 1, 'only gemini webview created initially');
  assert.ok(doc.querySelector('.ags-gw-site-seg'), 'compact Gemini | AI Studio switcher must exist');
  assert.equal(doc.querySelector('[data-site-tab="gemini"]').getAttribute('data-active'), '1');

  ctrl.setSite('aistudio');
  const wvsAfter = doc.querySelectorAll('webview');
  assert.equal(wvsAfter.length, 2, 'second webview created lazily on AI Studio tab switch');
  assert.equal(wvsAfter[0].getAttribute('data-active'), '0');
  assert.equal(wvsAfter[1].getAttribute('data-active'), '1');
  assert.equal(wvsAfter[1].getAttribute('partition'), 'persist:ag-studio-gemini-web');
  assert.equal(wvsAfter[1].getAttribute('src'), 'https://aistudio.google.com/prompts/new_chat');

  ctrl.setSite('gemini');
  assert.equal(wvsAfter[0].getAttribute('data-active'), '1');
  assert.equal(wvsAfter[1].getAttribute('data-active'), '0');

  ctrl.destroy();
});

test('aistudio-i18n translates UI chrome, supports zh-TW & en restore, and protects prompts/code/icons', () => {
  const tr = aiStudioI18n.createAiStudioTranslator('zh-CN');
  assert.equal(tr.translateText('Run settings'), '运行设置');
  assert.equal(tr.translateText('System instructions'), '系统指令');
  assert.equal(tr.translateText('Grounding with Google Search'), 'Google 搜索联网依据');
  assert.equal(tr.translateText('Thought for 4.2s'), '已思考 4.2 秒');
  assert.equal(tr.translateText('Run (Ctrl+Enter)'), '运行 (Ctrl+Enter)');
  assert.equal(tr.translateText('Saved 5 minutes ago'), '5 分钟前已保存');

  tr.setLanguage('zh-TW');
  assert.equal(tr.translateText('Run settings'), '執行設定');
  assert.equal(tr.translateText('System instructions'), '系統指令');

  const { doc, makeEl } = createMiniDom();
  const textNode = (txt) => ({ nodeType: 3, nodeValue: txt, parentElement: null });
  const mountText = (el, txt) => {
    const t = textNode(txt);
    t.parentElement = el;
    el.children.push(t);
    return t;
  };

  const runBtn = makeEl('button', { class: 'run-btn [&:has(>.material-symbols-outlined:first-child)]:pl-1' });
  const runText = mountText(runBtn, 'Run settings');
  const matIcon = makeEl('mat-icon', { class: 'material-symbols-outlined' });
  const iconText = mountText(matIcon, 'tune');
  const modelChunk = makeEl('ms-text-chunk');
  modelChunk.setAttribute('data-turn-role', 'model');
  const replyText = mountText(modelChunk, 'Run settings should stay untouched in model reply.');
  const promptInput = makeEl('textarea');
  promptInput.setAttribute('placeholder', 'Ask anything');

  doc.body.appendChild(runBtn);
  doc.body.appendChild(matIcon);
  doc.body.appendChild(modelChunk);
  doc.body.appendChild(promptInput);

  assert.equal(aiStudioI18n.shouldIgnoreAiStudioElement(runBtn), false);
  assert.equal(aiStudioI18n.shouldIgnoreAiStudioElement(matIcon), true);
  assert.equal(aiStudioI18n.shouldIgnoreAiStudioElement(modelChunk), true);

  const handle = aiStudioI18n.mountAiStudioI18n('zh-CN', { document: doc });
  assert.equal(runText.nodeValue, '运行设置');
  assert.equal(iconText.nodeValue, 'tune', 'mat-icon ligature text must not be translated');
  assert.equal(replyText.nodeValue, 'Run settings should stay untouched in model reply.');
  assert.equal(promptInput.getAttribute('placeholder'), '随便问点什么...');

  handle.applyLanguage('en');
  assert.equal(runText.nodeValue, 'Run settings');
  assert.equal(promptInput.getAttribute('placeholder'), 'Ask anything');
  handle.destroy();
});

test('injectAiStudioI18nIntoWebContents only injects on aistudio.google.com', async () => {
  const execCalls = [];
  const makeFakeWc = (url) => ({
    getURL: () => url,
    isDestroyed: () => false,
    async executeJavaScript(code) {
      execCalls.push({ url, len: code.length });
      return false;
    },
  });
  const fakeStore = { load: () => ({ i18n: { language: 'zh-CN' } }) };

  assert.equal(await studioMain.injectAiStudioI18nIntoWebContents(makeFakeWc('https://gemini.google.com/app'), fakeStore), false);
  assert.equal(await studioMain.injectAiStudioI18nIntoWebContents(makeFakeWc('https://accounts.google.com/signin'), fakeStore), false);
  assert.equal(execCalls.length, 0);

  assert.equal(await studioMain.injectAiStudioI18nIntoWebContents(makeFakeWc('https://aistudio.google.com/prompts/new_chat'), fakeStore), true);
  assert.ok(execCalls.length >= 2 && execCalls[1].len > 2000);
});
