'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

function fetchJson(url, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error(`Timeout fetching ${url}`));
    });
  });
}

async function listCdpTargets(port = 9222) {
  const list = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  return Array.isArray(list) ? list : [];
}

function pickBestTarget(targets) {
  return (
    targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl && !String(t.url || '').startsWith('devtools://')) ||
    targets.find((t) => t.webSocketDebuggerUrl) ||
    null
  );
}

async function evaluateOverCdp(wsUrl, expression) {
  const WebSocketCtor = globalThis.WebSocket;
  if (typeof WebSocketCtor !== 'function') {
    throw new Error('Global WebSocket is unavailable in this Node runtime (requires Node 22+).');
  }
  return new Promise((resolve, reject) => {
    const ws = new WebSocketCtor(wsUrl);
    const id = 1;
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error('CDP evaluation timed out'));
    }, 8000);

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: {
          expression,
          awaitPromise: true,
          returnByValue: true,
        },
      }));
    });

    ws.addEventListener('message', (evt) => {
      try {
        const msg = JSON.parse(String(evt.data));
        if (msg.id === id) {
          clearTimeout(timer);
          ws.close();
          if (msg.error) reject(new Error(msg.error.message || 'CDP error'));
          else if (msg.result?.exceptionDetails) {
            reject(new Error(msg.result.exceptionDetails.text || 'CDP runtime exception'));
          } else {
            resolve(msg.result?.result?.value);
          }
        }
      } catch (err) {
        clearTimeout(timer);
        ws.close();
        reject(err);
      }
    });

    ws.addEventListener('error', (err) => {
      clearTimeout(timer);
      reject(new Error(err?.message || 'CDP WebSocket connection failed'));
    });
  });
}

async function runLivePreview(options = {}) {
  const port = Number(options.port || 9222);
  const projectRoot = options.projectRoot || path.resolve(__dirname, '..', '..');
  const rendererPath = path.join(projectRoot, 'dist', 'studio-renderer.js');
  if (!fs.existsSync(rendererPath)) {
    throw new Error('Built renderer dist/studio-renderer.js missing. Run `npm run build` first.');
  }

  const targets = await listCdpTargets(port);
  const target = pickBestTarget(targets);
  if (!target) {
    throw new Error(
      `No inspectable Antigravity window found on CDP port ${port}. Start Antigravity with --remote-debugging-port=${port} first.`
    );
  }

  const rendererCode = fs.readFileSync(rendererPath, 'utf8');
  const expr = `(() => {
    window.__AG_STUDIO_LIVE_PREVIEW__ = true;
    ${rendererCode}
    return { ok: true, href: location.href, hasStudio: Boolean(window.__AG_STUDIO_MOUNTED__) };
  })()`;

  const result = await evaluateOverCdp(target.webSocketDebuggerUrl, expr);
  return {
    port,
    targetTitle: target.title,
    targetUrl: target.url,
    result,
  };
}

module.exports = {
  listCdpTargets,
  pickBestTarget,
  evaluateOverCdp,
  runLivePreview,
};
