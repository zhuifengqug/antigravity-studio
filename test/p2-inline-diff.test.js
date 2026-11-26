'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

const {
  getInlineDiff,
  parseUnifiedDiff,
  isSensitiveInlineDiffPath,
  hasBlockedInlineDiffUnc,
  resolveInlineDiffCandidatePath,
  clearInlineDiffCache,
} = require('../src/backend/inline-diff');
const { createInlineDiffController } = require('../src/renderer/inline-diff');

function runGit(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  }).trim();
}

function createMockDom() {
  const listeners = new Map();

  function parseSimpleSelector(sel) {
    return sel.split(',').map((s) => s.trim()).filter(Boolean);
  }

  function matchesSingle(el, part) {
    if (!el || el.nodeType !== 1) return false;
    if (part.startsWith('#')) return el.id === part.slice(1);
    if (part.startsWith('.')) {
      const classes = part.slice(1).split('.').filter(Boolean);
      return classes.every((c) => el.classList.contains(c));
    }
    const attrLinkMatch = /^([a-zA-Z0-9_-]+)\[([a-zA-Z0-9_-]+)\^="([^"]+)"\]$/.exec(part);
    if (attrLinkMatch) {
      const [, tag, attr, prefix] = attrLinkMatch;
      const val = el.getAttribute(attr);
      return el.tagName === tag.toUpperCase() && typeof val === 'string' && val.startsWith(prefix);
    }
    const attrEqMatch = /^\[([a-zA-Z0-9_-]+)="([^"]+)"\]$/.exec(part);
    if (attrEqMatch) {
      return el.getAttribute(attrEqMatch[1]) === attrEqMatch[2];
    }
    const attrHasMatch = /^\[([a-zA-Z0-9_-]+)\]$/.exec(part);
    if (attrHasMatch) {
      return el.hasAttribute(attrHasMatch[1]);
    }
    return el.tagName === part.toUpperCase();
  }

  function matchesSelector(el, selector) {
    return parseSimpleSelector(selector).some((part) => matchesSingle(el, part));
  }

  function collectAll(root, selector, out = []) {
    for (const child of root.children) {
      if (matchesSelector(child, selector)) out.push(child);
      collectAll(child, selector, out);
    }
    return out;
  }

  function createElement(tagName, attrs = {}) {
    const _attrs = new Map();
    const _listeners = new Map();
    let _className = '';
    const el = {
      nodeType: 1,
      tagName: String(tagName).toUpperCase(),
      children: [],
      parentNode: null,
      parentElement: null,
      isConnected: true,
      _textContent: '',
      get id() {
        return _attrs.get('id') || '';
      },
      set id(v) {
        _attrs.set('id', String(v));
      },
      get className() {
        return _className;
      },
      set className(v) {
        _className = String(v || '');
      },
      classList: {
        contains: (cls) => _className.split(/\s+/).filter(Boolean).includes(cls),
      },
      get textContent() {
        if (el.children.length === 0) return el._textContent;
        return el._textContent + el.children.map((c) => c.textContent).join('');
      },
      set textContent(v) {
        el.children = [];
        el._textContent = String(v ?? '');
      },
      get firstChild() {
        return el.children[0] || null;
      },
      get nextSibling() {
        if (!el.parentNode) return null;
        const idx = el.parentNode.children.indexOf(el);
        return idx >= 0 && idx + 1 < el.parentNode.children.length ? el.parentNode.children[idx + 1] : null;
      },
      setAttribute(k, v) {
        _attrs.set(k, String(v));
      },
      getAttribute(k) {
        return _attrs.has(k) ? _attrs.get(k) : null;
      },
      hasAttribute(k) {
        return _attrs.has(k);
      },
      removeAttribute(k) {
        _attrs.delete(k);
      },
      appendChild(child) {
        if (child.parentNode) child.parentNode.removeChild(child);
        child.parentNode = el;
        child.parentElement = el;
        el.children.push(child);
        return child;
      },
      insertBefore(newChild, refChild) {
        if (newChild.parentNode) newChild.parentNode.removeChild(newChild);
        newChild.parentNode = el;
        newChild.parentElement = el;
        if (!refChild) {
          el.children.push(newChild);
          return newChild;
        }
        const idx = el.children.indexOf(refChild);
        if (idx === -1) el.children.push(newChild);
        else el.children.splice(idx, 0, newChild);
        return newChild;
      },
      removeChild(child) {
        const idx = el.children.indexOf(child);
        if (idx !== -1) {
          el.children.splice(idx, 1);
          child.parentNode = null;
          child.parentElement = null;
        }
        return child;
      },
      remove() {
        if (el.parentNode) el.parentNode.removeChild(el);
      },
      querySelectorAll(sel) {
        return collectAll(el, sel);
      },
      querySelector(sel) {
        return collectAll(el, sel)[0] || null;
      },
      closest(sel) {
        let cur = el;
        while (cur) {
          if (matchesSelector(cur, sel)) return cur;
          cur = cur.parentElement;
        }
        return null;
      },
      addEventListener(type, fn) {
        if (!_listeners.has(type)) _listeners.set(type, []);
        _listeners.get(type).push(fn);
      },
      dispatchEvent(ev) {
        const list = _listeners.get(ev.type) || [];
        for (const fn of list) fn(ev);
      },
      click() {
        el.dispatchEvent({ type: 'click', preventDefault() {}, stopPropagation() {} });
      },
    };
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v;
      else el.setAttribute(k, v);
    }
    return el;
  }

  const documentElement = createElement('html');
  const head = createElement('head');
  const body = createElement('body');
  documentElement.appendChild(head);
  documentElement.appendChild(body);

  const doc = {
    documentElement,
    head,
    body,
    createElement,
    getElementById(id) {
      return collectAll(documentElement, '#' + id)[0] || null;
    },
    querySelectorAll(sel) {
      return collectAll(documentElement, sel);
    },
    querySelector(sel) {
      return collectAll(documentElement, sel)[0] || null;
    },
    addEventListener(t, fn) {
      listeners.set(t, fn);
    },
  };

  return { doc };
}

test('fail-closed security blocks UNC/device paths, traversal, and sensitive paths', () => {
  assert.equal(hasBlockedInlineDiffUnc('\\\\server\\share\\secret.txt'), true);
  assert.equal(hasBlockedInlineDiffUnc('//server/share/secret.txt'), true);
  assert.equal(hasBlockedInlineDiffUnc('\\\\?\\C:\\Windows\\win.ini'), true);
  assert.equal(hasBlockedInlineDiffUnc('\\\\.\\PhysicalDrive0'), true);
  assert.equal(hasBlockedInlineDiffUnc('file://server/share/file.js'), true);
  assert.equal(hasBlockedInlineDiffUnc('C:\\repo\\src\\app.js'), false);

  assert.equal(resolveInlineDiffCandidatePath('\\\\evil\\share\\a.js').error, 'blocked_unc');
  assert.equal(resolveInlineDiffCandidatePath('\\\\?\\C:\\repo\\a.js').error, 'blocked_unc');
  assert.equal(resolveInlineDiffCandidatePath('file://evil/share/a.js').error, 'blocked_unc');
  assert.equal(resolveInlineDiffCandidatePath('C:\\repo\\..\\secret.txt').error, 'blocked_traversal');
  assert.equal(resolveInlineDiffCandidatePath('file:///C:/repo/../secret.txt').error, 'blocked_traversal');
  assert.equal(resolveInlineDiffCandidatePath('C:\\repo\\bad\x00.js').error, 'invalid_uri');
  assert.equal(resolveInlineDiffCandidatePath('../outside.js', { workspaceRoot: 'C:\\repo' }).error, 'blocked_traversal');

  assert.equal(isSensitiveInlineDiffPath('/repo/.env'), true);
  assert.equal(isSensitiveInlineDiffPath('/repo/.env.production'), true);
  assert.equal(isSensitiveInlineDiffPath('/home/user/.ssh/id_rsa'), true);
  assert.equal(isSensitiveInlineDiffPath('/home/user/.ssh/id_ed25519'), true);
  assert.equal(isSensitiveInlineDiffPath('C:\\Users\\a\\.gemini\\antigravity\\accounts_v1.json'), true);
  assert.equal(isSensitiveInlineDiffPath('C:\\Users\\a\\AppData\\Local\\AntigravityStudio\\config.json'), true);
  assert.equal(isSensitiveInlineDiffPath('/repo/certs/private.pem'), true);
  assert.equal(isSensitiveInlineDiffPath('/repo/certs/server.key'), true);
  assert.equal(isSensitiveInlineDiffPath('/Users/a/Cookies'), true);
  assert.equal(isSensitiveInlineDiffPath('/Users/a/Login Data'), true);
  assert.equal(isSensitiveInlineDiffPath('/repo/src/index.js'), false);

  assert.equal(resolveInlineDiffCandidatePath('C:\\repo\\.env').error, 'blocked_sensitive');
  assert.equal(resolveInlineDiffCandidatePath('/home/u/.ssh/id_rsa').error, 'blocked_sensitive');
  assert.equal(resolveInlineDiffCandidatePath('C:\\Users\\a\\.gemini\\antigravity\\accounts_v1.json').error, 'blocked_sensitive');
});

test('parseUnifiedDiff parses hunks, line numbers, truncation, and binary diffs accurately', () => {
  const sample = [
    'diff --git a/src/demo.js b/src/demo.js',
    'index 1111111..2222222 100644',
    '--- a/src/demo.js',
    '+++ b/src/demo.js',
    '@@ -10,4 +10,5 @@ function greet() {',
    ' const a = 1;',
    '-const b = 2;',
    '+const b = 20;',
    '+const c = 30;',
    ' return a + b;',
  ].join('\n');

  const parsed = parseUnifiedDiff(sample, { repoRoot: '/repo' });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.relPath, 'src/demo.js');
  assert.equal(parsed.repoRoot, '/repo');
  assert.equal(parsed.status, 'modified');
  assert.equal(parsed.additions, 2);
  assert.equal(parsed.deletions, 1);
  assert.equal(parsed.truncated, false);
  assert.equal(parsed.binary, false);
  assert.equal(parsed.hunks.length, 1);
  assert.deepEqual(parsed.hunks[0].rows, [
    { kind: 'ctx', oldLn: 10, newLn: 10, sign: ' ', text: 'const a = 1;' },
    { kind: 'del', oldLn: 11, newLn: null, sign: '-', text: 'const b = 2;' },
    { kind: 'add', oldLn: null, newLn: 11, sign: '+', text: 'const b = 20;' },
    { kind: 'add', oldLn: null, newLn: 12, sign: '+', text: 'const c = 30;' },
    { kind: 'ctx', oldLn: 12, newLn: 13, sign: ' ', text: 'return a + b;' },
  ]);

  const capped = parseUnifiedDiff(sample, { maxLines: 2, maxLineChars: 8 });
  assert.equal(capped.ok, true);
  assert.equal(capped.truncated, true);
  assert.equal(capped.hunks[0].rows.length, 2);
  assert.equal(capped.hunks[0].rows[0].text, 'const a…');

  const binDiff = [
    'diff --git a/assets/icon.png b/assets/icon.png',
    'Binary files a/assets/icon.png and b/assets/icon.png differ',
  ].join('\n');
  const binParsed = parseUnifiedDiff(binDiff);
  assert.equal(binParsed.ok, true);
  assert.equal(binParsed.binary, true);
  assert.equal(binParsed.hunks.length, 0);
});

test('getInlineDiff integrates with a live Git repo, fails closed outside Git / malformed .git, and supports cache clear', async () => {
  clearInlineDiffCache();
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'ags-inline-diff-'));
  const repoDir = path.join(tmpBase, 'repo');
  const outsideDir = path.join(tmpBase, 'outside');
  const badGitDir = path.join(tmpBase, 'bad-gitfile');
  fs.mkdirSync(repoDir, { recursive: true });
  fs.mkdirSync(outsideDir, { recursive: true });
  fs.mkdirSync(badGitDir, { recursive: true });

  try {
    runGit(repoDir, ['init']);
    runGit(repoDir, ['config', 'user.email', 'test@example.com']);
    runGit(repoDir, ['config', 'user.name', 'Test User']);

    const trackedFile = path.join(repoDir, 'app.js');
    fs.writeFileSync(trackedFile, 'const x = 1;\nconst y = 2;\n', 'utf8');
    runGit(repoDir, ['add', 'app.js']);
    runGit(repoDir, ['commit', '-m', 'init']);

    // Modify tracked file
    fs.writeFileSync(trackedFile, 'const x = 1;\nconst y = 99;\nconst z = 3;\n', 'utf8');

    const modRes = await getInlineDiff({ filePath: pathToFileURL(trackedFile).href });
    assert.equal(modRes.ok, true);
    assert.equal(modRes.relPath, 'app.js');
    assert.equal(modRes.status, 'modified');
    assert.equal(modRes.additions, 2);
    assert.equal(modRes.deletions, 1);
    assert.equal(modRes.hunks.length, 1);
    assert.ok(modRes.hunks[0].rows.some((r) => r.kind === 'del' && r.text === 'const y = 2;'));
    assert.ok(modRes.hunks[0].rows.some((r) => r.kind === 'add' && r.text === 'const y = 99;'));

    // Cache hit within TTL returns previous snapshot until cleared
    fs.writeFileSync(trackedFile, 'const x = 1;\nconst y = 2;\nconst w = 4;\n', 'utf8');
    const cachedRes = await getInlineDiff({ filePath: trackedFile });
    assert.equal(cachedRes.additions, 2);
    assert.equal(cachedRes.deletions, 1);

    clearInlineDiffCache();
    const freshRes = await getInlineDiff({ filePath: trackedFile });
    assert.equal(freshRes.ok, true);
    assert.equal(freshRes.additions, 1);
    assert.equal(freshRes.deletions, 0);

    // Newly created untracked file returns bounded '+' preview
    const untrackedFile = path.join(repoDir, 'new-file.txt');
    fs.writeFileSync(untrackedFile, 'alpha\nbeta\ngamma\n', 'utf8');
    const untrackedRes = await getInlineDiff({ filePath: 'new-file.txt', workspaceRoot: repoDir, maxLines: 2 });
    assert.equal(untrackedRes.ok, true);
    assert.equal(untrackedRes.status, 'untracked');
    assert.equal(untrackedRes.truncated, true);
    assert.equal(untrackedRes.hunks[0].rows.length, 2);
    assert.equal(untrackedRes.hunks[0].rows[0].kind, 'add');
    assert.equal(untrackedRes.hunks[0].rows[0].newLn, 1);

    // Non-git file fails closed
    const outsideFile = path.join(outsideDir, 'plain.txt');
    fs.writeFileSync(outsideFile, 'hello\n', 'utf8');
    const outsideRes = await getInlineDiff({ filePath: outsideFile });
    assert.equal(outsideRes.ok, false);
    assert.equal(outsideRes.error, 'outside_git_repo');

    // Malformed .git gitfile pointing to UNC fails closed
    fs.writeFileSync(path.join(badGitDir, '.git'), 'gitdir: \\\\evil\\share\\repo.git\n', 'utf8');
    const badFile = path.join(badGitDir, 'a.js');
    fs.writeFileSync(badFile, 'const a = 1;\n', 'utf8');
    const badRes = await getInlineDiff({ filePath: badFile });
    assert.equal(badRes.ok, false);
    assert.notEqual(badRes.ok, true);
  } finally {
    clearInlineDiffCache();
    fs.rmSync(tmpBase, { recursive: true, force: true });
  }
});

test('renderer inline-diff controller attaches pills, expands diff panels, and cleans up when disabled', async () => {
  const { doc } = createMockDom();
  const prevDoc = global.document;
  global.document = doc;

  try {
    const convView = doc.createElement('div', { 'data-testid': 'conversation-view' });
    const row = doc.createElement('div', { 'data-testid': 'tool-call-row' });
    const chip = doc.createElement('div', { 'data-ag-diff-uri': 'file:///C:/repo/src/app.js' });
    const badge = doc.createElement('span', { 'data-testid': 'diff-line-count' });
    badge.textContent = '+1 -1';
    chip.appendChild(badge);
    row.appendChild(chip);
    convView.appendChild(row);
    doc.body.appendChild(convView);

    const calls = [];
    const mockApi = {
      async getInlineDiff(payload) {
        calls.push(payload);
        return {
          ok: true,
          relPath: 'src/app.js',
          repoRoot: 'C:\\repo',
          status: 'modified',
          additions: 1,
          deletions: 1,
          truncated: false,
          binary: false,
          hunks: [
            {
              header: '@@ -1,2 +1,2 @@',
              rows: [
                { kind: 'del', oldLn: 1, newLn: null, sign: '-', text: 'oldLine();' },
                { kind: 'add', oldLn: null, newLn: 1, sign: '+', text: 'newLine();' },
              ],
            },
          ],
        };
      },
    };

    const ctrl = createInlineDiffController({ doc });
    ctrl.sync({ fx: { inlineDiff: true }, i18n: { language: 'zh-CN' } }, mockApi);

    const styleEl = doc.getElementById('ag-studio-inline-diff-style');
    assert.ok(styleEl);

    const pill = row.querySelector('.ags-inline-diff-pill');
    assert.ok(pill);
    assert.equal(pill.textContent, '展开 Diff');

    pill.click();
    await new Promise((r) => setTimeout(r, 15));

    assert.equal(calls.length, 1);
    assert.equal(calls[0].filePath, 'file:///C:/repo/src/app.js');
    assert.equal(pill.textContent, '收起 Diff');

    const panel = convView.querySelector('[data-ags-inline-diff-panel="1"]');
    assert.ok(panel);
    assert.equal(panel.getAttribute('data-ag-studio-ignore'), 'true');
    assert.equal(panel.getAttribute('data-ag-no-i18n'), 'true');
    assert.ok(panel.querySelector('.ags-inline-diff-row.is-add'));
    assert.ok(panel.querySelector('.ags-inline-diff-row.is-del'));

    // Disable removes pills, panels, and styles
    ctrl.sync({ fx: { inlineDiff: false }, i18n: { language: 'zh-CN' } }, mockApi);
    assert.equal(doc.querySelectorAll('.ags-inline-diff-pill').length, 0);
    assert.equal(doc.querySelectorAll('[data-ags-inline-diff-panel="1"]').length, 0);
    assert.equal(doc.getElementById('ag-studio-inline-diff-style'), null);

    ctrl.destroy();
  } finally {
    global.document = prevDoc;
  }
});
