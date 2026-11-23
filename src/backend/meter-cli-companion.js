'use strict';

const { resolveCliExecutable, resolveCliWorkspace, launchCliSession } = require('./meter-cli-launcher');
const { getCliMonitorSnapshot } = require('./meter-cli-monitor');
const { listCliTranscripts, readCliSettings } = require('./meter-cli-adapter');

async function getCliCompanionStatus(options = {}) {
  const executable = resolveCliExecutable(options.cliPath, options);
  const workspace = await resolveCliWorkspace(options);
  const monitor = getCliMonitorSnapshot(options);
  return {
    ok: true,
    available: Boolean(executable.ok),
    cliPath: executable.cliPath || null,
    exePath: executable.exePath || null,
    cwd: workspace.cwd || null,
    cwdSource: workspace.source || null,
    recentSessionCount: monitor.sessionCount,
    recentSessions: monitor.sessions,
    settings: monitor.settings
  };
}

module.exports = {
  getCliCompanionStatus,
  launchCliSession,
  resolveCliExecutable,
  resolveCliWorkspace,
  getCliMonitorSnapshot,
  listCliTranscripts,
  readCliSettings
};
