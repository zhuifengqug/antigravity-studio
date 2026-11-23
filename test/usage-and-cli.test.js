'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const usage = require('../src/main/usage-collector');
const { ContextLimitManager, validateContextLimit } = require('../src/main/context-limit-patcher');
const { EnhanceManager, patchTitleTemplateInBuffer } = require('../src/main/enhance-patcher');
const { buildCliLaunchSpec } = require('../src/main/cli-launcher');

test('Steps breakdown, quota pools, history aggregation, and API cost estimation', () => {
  const stepsResp = {
    steps: [
      { type: 'SYSTEM', text: 'system prompt content' },
      { type: 'USER', text: 'hello world' },
      { type: 'TOOL_CALL', text: 'read_file output' },
      { type: 'THINKING', text: 'reasoning...' },
      { type: 'ASSISTANT', text: 'final answer' },
    ],
  };
  const metaResp = {
    generatorMetadata: [
      {
        model: 'claude-sonnet-4',
        tokenUsage: { inputTokens: 10000, outputTokens: 2000, cachedTokens: 4000, thinkingTokens: 500 },
        durationMs: 2500,
        ttftMs: 320,
      },
    ],
  };

  const parsed = usage.parseStepsBreakdown(stepsResp, metaResp, { 'claude-sonnet-4': 200000 });
  assert.equal(parsed.contextLimit, 200000);
  assert.equal(parsed.speed.tokPerSec, 800);
  assert.equal(parsed.speed.ttftMs, 320);

  const quota = usage.normalizeQuotaPayload({
    userStatus: {
      email: 'dev@example.com',
      cascadeModelConfigData: {
        clientModelConfigs: [
          { label: 'Claude Sonnet 4', quotaInfo: { remainingFraction: 0.15 } },
          { label: 'Gemini 4 Neon', quotaInfo: { remainingFraction: 0.85 } },
        ],
      },
    },
  }, null, 0.2);
  assert.equal(quota.lowQuotaDetected, true);
  assert.equal(quota.pools.length, 2);

  const now = Date.now();
  const agg = usage.aggregateTokenHistory([
    { ts: now, date: new Date(now).toISOString().slice(0, 10), model: 'claude-sonnet-4', source: 'desktop', inputTokens: 100000, outputTokens: 20000, cachedTokens: 50000, thinkingTokens: 0, totalTokens: 120000, durationMs: 10000, ttftMs: 300 },
    { ts: now, date: new Date(now).toISOString().slice(0, 10), model: 'gemini-3-flash', source: 'cli', inputTokens: 50000, outputTokens: 10000, cachedTokens: 0, thinkingTokens: 0, totalTokens: 60000, durationMs: 2000, ttftMs: 150 },
  ], { days: 7, subscriptionMonthlyUsd: 20 });

  assert.equal(agg.totalTokens, 180000);
  assert.equal(agg.heatmap.length, 7);
  assert.ok(agg.totalCostUsd > 0);
  assert.equal(agg.bySource.desktop.totalTokens, 120000);
  assert.equal(agg.bySource.cli.totalTokens, 60000);
});

test('Per-model context limits, Chinese title patcher, and CLI launch spec', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-studio-misc-'));
  try {
    assert.throws(() => validateContextLimit(100), /between 8,192/);
    const ctxMgr = new ContextLimitManager({ stateDir: tmpDir });
    const updated = ctxMgr.setModelLimit('gemini-4-neon', 1500000);
    assert.equal(updated.perModelLimits['gemini-4-neon'], 1500000);
    const reset = ctxMgr.resetModelLimit('gemini-4-neon');
    assert.equal(reset.perModelLimits['gemini-4-neon'], 1048576);

    // Binary Chinese title patch & restore in temp mock binary
    const mockBin = path.join(tmpDir, 'language_server.exe');
    fs.writeFileSync(mockBin, Buffer.from('PADDING_Generate a concise title_TAIL', 'utf8'));
    const enhMgr = new EnhanceManager({ stateDir: tmpDir, binaryPath: mockBin });
    const patchRes = enhMgr.applyBinaryChineseTitlePatch();
    assert.equal(patchRes.ok, true);
    assert.equal(patchRes.patched, true);
    assert.match(fs.readFileSync(mockBin, 'utf8'), /生成中文标题:/);
    const restRes = enhMgr.restoreBinaryPatch();
    assert.equal(restRes.restored, true);
    assert.match(fs.readFileSync(mockBin, 'utf8'), /Generate a concise title/);

    // Same-length patch safety guard
    const tooLong = patchTitleTemplateInBuffer(Buffer.from('abc', 'utf8'), 'abc', 'abcdef');
    assert.equal(tooLong.ok, false);

    // CLI launch spec inherits proxy env
    ctxMgr.store.save({ proxy: { enabled: true, proxyUrl: 'http://127.0.0.1:7897' } });
    const spec = buildCliLaunchSpec({ stateDir: tmpDir, cwd: tmpDir, env: {} });
    assert.equal(spec.env.HTTP_PROXY, 'http://127.0.0.1:7897');
    assert.equal(spec.cwd, tmpDir);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
