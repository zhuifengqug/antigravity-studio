'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  packDirectoryToAsar,
  listAsarFiles,
  readAsarFile,
  sha256File,
} = require('../src/core/asar-engine');
const { installStudio, getStudioStatus } = require('../src/core/installer');
const { restoreStudio } = require('../src/core/restore');

function makeTempSandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-studio-test-'));
  const srcDir = path.join(root, 'mock-app');
  const distDir = path.join(srcDir, 'dist');
  const stateDir = path.join(root, 'state');
  fs.mkdirSync(distDir, { recursive: true });

  fs.writeFileSync(path.join(srcDir, 'package.json'), JSON.stringify({
    name: 'antigravity',
    version: '2.34.0',
    main: 'dist/main.js',
  }, null, 2));

  fs.writeFileSync(path.join(distDir, 'main.js'), '"use strict";\nconsole.log("mock main");\n');
  fs.writeFileSync(path.join(distDir, 'utils.js'), `"use strict";
// --- Antigravity Proxy NoTun Injection Start ---
console.log("legacy proxy");
// --- Antigravity Proxy NoTun Injection End ---
function createWindow(url) {
    void loadHubWindowUrl(win, url, { skipBootstrapMint: false });
    return win;
}
const showOrCreateWindow = (port) => {
    if (wins.length > 0) {
        wins[0].focus();
    } else if (port > 0) {
        createWindow('http://localhost:' + port + '/');
    }
};
function setupNodeWrapper(env) {
    return env;
}
`);
  fs.writeFileSync(path.join(distDir, 'preload.js'), `"use strict";
const electron_1 = require("electron");
// --- Antigravity Chinese Localization Injection Start ---
console.log("legacy i18n");
// --- Antigravity Chinese Localization Injection End ---
`);
  fs.writeFileSync(path.join(distDir, 'menu.js'), `"use strict";
const electron_1 = require("electron");
function setupApplicationMenu() {
  return electron_1.Menu.buildFromTemplate([{ label: "File", submenu: [{ label: "New Window" }] }]);
}
`);
  fs.writeFileSync(path.join(distDir, 'tray.js'), `"use strict";
const electron_1 = require("electron");
function createTray(actions) {
  contextMenu = electron_1.Menu.buildFromTemplate(actions);
}
function insertTrayMenuItem(pos, options) {
  contextMenu.insert(pos, new electron_1.MenuItem(options));
}
function updateTrayAgentCount(count) {
  countItem.label = count > 0 ? count + ' agents running' : 'No agents running';
}
`);

  fs.writeFileSync(path.join(distDir, 'languageServer.js'), `"use strict";
function startLanguageServer(port, csrf, options) {
    const loginShellEnv = {};
    const env = { ...process.env, ...loginShellEnv };
    env['ANTIGRAVITY_SERVER_CSRF_TOKEN'] = csrf;
    return { port, env };
}
exports.startLanguageServer = startLanguageServer;
`);

  const asarPath = path.join(root, 'app.asar');
  packDirectoryToAsar(srcDir, asarPath);
  return { root, asarPath, stateDir };
}

test('ASAR pack, idempotent install, legacy cleanup, and lossless restore', () => {
  const { root, asarPath, stateDir } = makeTempSandbox();
  try {
    const origSha = sha256File(asarPath);

    // Dry-run first
    const dryRes = installStudio({ asarPath, stateDir, dryRun: true });
    assert.equal(dryRes.dryRun, true);
    assert.equal(dryRes.appVersion, '2.34.0');
    assert.equal(dryRes.anchorReport['dist/utils.js'].ok, true);
    assert.equal(dryRes.anchorReport['dist/preload.js'].ok, true);
    assert.equal(dryRes.anchorReport['dist/menu.js'].ok, true);
    assert.equal(dryRes.anchorReport['dist/tray.js'].ok, true);
    assert.equal(dryRes.anchorReport['dist/languageServer.js'].ok, true);
    assert.equal(sha256File(asarPath), origSha);

    // Real install on sandbox ASAR
    const inst1 = installStudio({ asarPath, stateDir });
    assert.equal(inst1.dryRun, false);
    assert.equal(fs.existsSync(`${asarPath}.studio-orig.bak`), true);

    const status = getStudioStatus({ asarPath, stateDir });
    assert.equal(status.installed, true);
    assert.equal(status.appVersion, '2.34.0');

    const patchedUtils = readAsarFile(asarPath, 'dist/utils.js').toString('utf8');
    assert.match(patchedUtils, /Antigravity Studio Proxy Boot Start/);
    assert.match(patchedUtils, /require\("\.\/ag-studio\/studio-main"\)\.attachWindow\(win\)/);
    assert.doesNotMatch(patchedUtils, /legacy proxy/);

    const patchedPreload = readAsarFile(asarPath, 'dist/preload.js').toString('utf8');
    assert.match(patchedPreload, /exposeInMainWorld\('agStudioAPI'/);
    assert.doesNotMatch(patchedPreload, /legacy i18n/);

    // language server proxy injection must sit AFTER the loginShellEnv spread
    const patchedLs = readAsarFile(asarPath, 'dist/languageServer.js').toString('utf8');
    assert.match(patchedLs, /Antigravity Studio LanguageServer Proxy Start/);
    const spreadIdx = patchedLs.indexOf('{ ...process.env, ...loginShellEnv }');
    const proxyIdx = patchedLs.indexOf('applyProxyToEnv(env)');
    assert.ok(spreadIdx > 0 && proxyIdx > spreadIdx, 'proxy injection must follow the env spread');

    const files = listAsarFiles(asarPath).map((f) => f.path);
    assert.ok(files.includes('dist/ag-studio/studio-main.js'));
    assert.ok(files.includes('dist/ag-studio/studio-renderer.js'));
    assert.ok(files.includes('dist/ag-studio/native-i18n.js'));

    // Re-install idempotency check (byte-for-byte identical across all 5 targets)
    const snap1 = {};
    for (const rel of ['dist/utils.js', 'dist/preload.js', 'dist/menu.js', 'dist/tray.js', 'dist/languageServer.js']) {
      snap1[rel] = readAsarFile(asarPath, rel).toString('utf8');
    }
    installStudio({ asarPath, stateDir });
    for (const rel of Object.keys(snap1)) {
      assert.equal(readAsarFile(asarPath, rel).toString('utf8'), snap1[rel], `${rel} should be byte-identical across repeated installs`);
    }
    const utilsAfterSecond = readAsarFile(asarPath, 'dist/utils.js').toString('utf8');
    assert.equal(utilsAfterSecond.match(/Antigravity Studio Proxy Boot Start/g).length, 1);
    assert.equal(utilsAfterSecond.match(/applyProxyToEnv\(env\)/g).length, 1);
    assert.equal(utilsAfterSecond.match(/attachWindow\(wins\[0\]\)/g).length, 1);
    assert.match(utilsAfterSecond, /^ {4}void loadHubWindowUrl\(/m);

    const lsAfterSecond = readAsarFile(asarPath, 'dist/languageServer.js').toString('utf8');
    assert.equal(lsAfterSecond.match(/LanguageServer Proxy Start/g).length, 1);
    assert.equal(lsAfterSecond.match(/applyProxyToEnv\(env\)/g).length, 1);

    // Lossless restore check
    const res = restoreStudio({ asarPath, stateDir });
    assert.equal(res.restored, true);
    assert.equal(sha256File(asarPath), origSha);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
