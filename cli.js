#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { STUDIO_VERSION, getStateDir } = require('./src/shared/constants');
const { ConfigStore } = require('./src/shared/config-store');
const { getStudioStatus, installStudio } = require('./src/core/installer');
const { restoreStudio } = require('./src/core/restore');
const { runLivePreview } = require('./src/core/cdp-live');

function parseArgs(argv) {
  const args = argv.slice(2);
  const cmd = args.find((a) => !a.startsWith('-')) || 'help';
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const [k, inlineV] = a.slice(2).split('=');
      if (inlineV !== undefined) flags[k] = inlineV;
      else if (args[i + 1] && !args[i + 1].startsWith('-')) flags[k] = args[++i];
      else flags[k] = true;
    }
  }
  return { cmd, flags };
}

function printHelp() {
  console.log(`Antigravity Studio v${STUDIO_VERSION}

Usage:
  node cli.js status [--asar <path>]             Inspect client installation & anchor status
  node cli.js build                              Build renderer & i18n bundles into dist/
  node cli.js install [--dry-run] [--asar <p>]   Patch app.asar safely (creates .studio-orig.bak)
                      [--clean-legacy]           Also strip legacy meter-* files during install
  node cli.js restore [--dry-run] [--asar <p>]   Losslessly restore original app.asar from backup
  node cli.js live [--port 9222]                 Non-invasive CDP hot-preview on running window
  node cli.js doctor                             Check Node version, node:sqlite, state dir & paths
`);
}

async function main() {
  const { cmd, flags } = parseArgs(process.argv);
  const stateDir = flags['state-dir'] || getStateDir();

  if (cmd === 'help' || flags.help) {
    printHelp();
    return 0;
  }

  if (cmd === 'build') {
    execSync('node scripts/build-renderer.js', { cwd: __dirname, stdio: 'inherit' });
    return 0;
  }

  if (cmd === 'status') {
    const status = getStudioStatus({ asarPath: flags.asar, stateDir });
    console.log(JSON.stringify(status, null, 2));
    return status.found ? 0 : 1;
  }

  if (cmd === 'install') {
    const builtRenderer = path.join(__dirname, 'dist', 'studio-renderer.js');
    if (!fs.existsSync(builtRenderer)) {
      console.log('[ag-studio] dist/studio-renderer.js missing, building first...');
      execSync('node scripts/build-renderer.js', { cwd: __dirname, stdio: 'inherit' });
    }
    const res = installStudio({
      asarPath: flags.asar,
      stateDir,
      dryRun: Boolean(flags['dry-run']),
      cleanLegacy: Boolean(flags['clean-legacy']),
    });
    console.log(JSON.stringify(res, null, 2));
    return 0;
  }

  if (cmd === 'restore') {
    const res = restoreStudio({
      asarPath: flags.asar,
      stateDir,
      dryRun: Boolean(flags['dry-run']),
      force: Boolean(flags.force),
    });
    console.log(JSON.stringify(res, null, 2));
    return 0;
  }

  if (cmd === 'live') {
    const res = await runLivePreview({ port: flags.port || 9222, projectRoot: __dirname });
    console.log(JSON.stringify(res, null, 2));
    return 0;
  }

  if (cmd === 'doctor') {
    let sqliteOk = false;
    try {
      const s = require('node:sqlite');
      sqliteOk = typeof s.DatabaseSync === 'function';
    } catch {}
    const store = new ConfigStore(stateDir);
    const status = getStudioStatus({ asarPath: flags.asar, stateDir });
    console.log(JSON.stringify({
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      sqliteAvailable: sqliteOk,
      stateDir: store.stateDir,
      configExists: fs.existsSync(store.configPath),
      fontsDir: store.fontsDir,
      antigravityDetected: status.found,
      asarPath: status.asarPath,
      appVersion: status.appVersion,
      studioInstalled: status.installed,
    }, null, 2));
    return 0;
  }

  console.error(`Unknown command: ${cmd}`);
  printHelp();
  return 1;
}

main()
  .then((code) => { process.exitCode = code; })
  .catch((err) => {
    console.error(`[ag-studio] Error: ${err.message}`);
    process.exitCode = 1;
  });
