'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { getGeminiAntigravityDir } = require('../shared/constants');

function discoverLsConnection(env = process.env) {
  let address = env.ANTIGRAVITY_LS_ADDRESS || '';
  let csrfToken = env.ANTIGRAVITY_CSRF_TOKEN || '';
  let trajectoryId = env.ANTIGRAVITY_TRAJECTORY_ID || '';
  let conversationId = env.ANTIGRAVITY_CONVERSATION_ID || '';

  // Also check ~/.gemini/antigravity/daemon/ if env vars are absent
  if (!address || !csrfToken) {
    try {
      const daemonDir = path.join(getGeminiAntigravityDir(env), 'daemon');
      if (fs.existsSync(daemonDir)) {
        const files = fs.readdirSync(daemonDir)
          .filter((n) => n.endsWith('.json'))
          .map((n) => ({ name: n, full: path.join(daemonDir, n), mtime: fs.statSync(path.join(daemonDir, n)).mtimeMs }))
          .sort((a, b) => b.mtime - a.mtime);
        for (const f of files) {
          try {
            const info = JSON.parse(fs.readFileSync(f.full, 'utf8'));
            if (!address && (info.address || info.port)) {
              address = info.address || `127.0.0.1:${info.port}`;
            }
            if (!csrfToken && (info.csrfToken || info.csrf_token)) {
              csrfToken = info.csrfToken || info.csrf_token;
            }
            if (address && csrfToken) break;
          } catch {}
        }
      }
    } catch {}
  }

  const origin = address
    ? (/^https?:\/\//i.test(address) ? address : `http://${address}`)
    : '';

  return {
    origin,
    address,
    csrfToken,
    trajectoryId,
    conversationId,
    ready: Boolean(origin && csrfToken),
  };
}

function callLsRpc(method, body = {}, options = {}) {
  const conn = options.conn || discoverLsConnection(options.env);
  if (!conn.origin) {
    return Promise.reject(new Error('Antigravity LanguageServer address not available'));
  }
  const url = new URL(`/exa.language_server_pb.LanguageServerService/${method}`, conn.origin);
  const payload = JSON.stringify(body || {});
  const mod = url.protocol === 'https:' ? https : http;
  const timeoutMs = Number(options.timeoutMs || 6000);

  return new Promise((resolve, reject) => {
    const req = mod.request(url, {
      method: 'POST',
      timeout: timeoutMs,
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...(conn.csrfToken ? { 'x-codeium-csrf-token': conn.csrfToken } : {}),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode >= 400) {
          return reject(new Error(`LS RPC ${method} HTTP ${res.statusCode}: ${text.slice(0, 240)}`));
        }
        try {
          resolve(text ? JSON.parse(text) : {});
        } catch (err) {
          reject(new Error(`Invalid JSON from LS RPC ${method}: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error(`LS RPC ${method} timed out after ${timeoutMs}ms`)));
    req.write(payload);
    req.end();
  });
}

async function getUserStatus(options = {}) {
  return callLsRpc('GetUserStatus', {}, options);
}

async function getAvailableModels(options = {}) {
  return callLsRpc('GetAvailableModels', {}, options);
}

async function getCascadeTrajectory(cascadeId, options = {}) {
  return callLsRpc('GetCascadeTrajectory', { cascadeId }, options);
}

async function getCascadeTrajectorySteps(cascadeId, options = {}) {
  return callLsRpc('GetCascadeTrajectorySteps', { cascadeId }, options);
}

async function getCascadeTrajectoryGeneratorMetadata(cascadeId, options = {}) {
  return callLsRpc('GetCascadeTrajectoryGeneratorMetadata', { cascadeId }, options);
}

module.exports = {
  discoverLsConnection,
  callLsRpc,
  getUserStatus,
  getAvailableModels,
  getCascadeTrajectory,
  getCascadeTrajectorySteps,
  getCascadeTrajectoryGeneratorMetadata,
};
