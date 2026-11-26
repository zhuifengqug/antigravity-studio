'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const proxyManager = require('../src/backend/proxy-manager');
const geminiWebMod = require('../src/renderer/gemini-web-mode');

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
  ctrl.destroy();
});
