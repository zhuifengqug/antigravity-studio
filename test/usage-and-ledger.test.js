'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  computeHistoryOverview,
  formatFriendlyPoolTitle,
  normalizeQuotaForUi,
  shapeCollectResultForUi,
} = require('../src/backend/studio-main');
const meterCore = require('../src/backend/meter-core');
const { ConfigStore } = require('../src/shared/config-store');

test('computeHistoryOverview parses real pricing_ledger_v1 and token_usage_archive_v2 schema accurately', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-studio-usage-'));
  const geminiDir = path.join(root, '.gemini', 'antigravity');
  const stateDir = path.join(root, 'state');
  fs.mkdirSync(geminiDir, { recursive: true });

  const today = new Date();
  const ymdToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const ts1 = new Date(`${ymdToday}T14:15:00.000Z`).getTime();
  const ts2 = new Date(`${ymdToday}T14:40:00.000Z`).getTime();

  // Exact schema observed in user's ~/.gemini/antigravity/pricing_ledger_v1.json
  const ledger = {
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    calls: {
      'conv-1#1': {
        callId: 'conv-1#1',
        source: 'desktop',
        cascadeId: 'conv-1',
        stepIndex: 1,
        model: 'gemini-4-hydrogen-tiered-high',
        modelLabel: 'Gemini 4 Hydrogen (High)',
        modelKey: 'gemini-4-hydrogen',
        inputTokens: 12000,
        cacheTokens: 80000,
        cacheReadTokens: 80000,
        outputTokens: 2400,
        thinkingTokens: 600,
        totalTokens: 94400,
        status: 'final',
        isPriced: true,
        costUSD: 0.145,
        date: ymdToday,
        timestamp: ts1,
        ttftSec: 0.42,
        tps: 64.5,
      },
      'conv-2#1': {
        callId: 'conv-2#1',
        source: 'cli',
        cascadeId: 'conv-2',
        stepIndex: 1,
        model: 'claude-sonnet-4',
        modelLabel: 'Claude Sonnet 4',
        modelKey: 'claude-sonnet-4',
        inputTokens: 6000,
        cacheTokens: 20000,
        cacheReadTokens: 20000,
        outputTokens: 1200,
        thinkingTokens: 0,
        totalTokens: 27200,
        status: 'final',
        isPriced: true,
        costUSD: 0.055,
        date: ymdToday,
        timestamp: ts2,
        ttftSec: 0.31,
        tps: 72.0,
      },
    },
  };
  fs.writeFileSync(path.join(geminiDir, 'pricing_ledger_v1.json'), JSON.stringify(ledger));

  // Exact schema observed in token_usage_archive_v2.json
  const archiveV2 = {
    version: '2.0.0',
    firstUseDate: ymdToday,
    updatedAt: `${ymdToday} 14:40:00`,
    dailyMapBySource: {
      all: { [ymdToday]: { total: 121600, input: 18000, output: 3600, cache: 100000, steps: 2 } },
      desktop: { [ymdToday]: { total: 94400, input: 12000, output: 2400, cache: 80000, steps: 1 } },
      cli: { [ymdToday]: { total: 27200, input: 6000, output: 1200, cache: 20000, steps: 1 } },
    },
    dailyModelMapBySource: {
      desktop: { [ymdToday]: { 'Gemini 4 Hydrogen (High)': { total: 94400, input: 12000, output: 2400, cache: 80000, steps: 1 } } },
      cli: { [ymdToday]: { 'Claude Sonnet 4': { total: 27200, input: 6000, output: 1200, cache: 20000, steps: 1 } } },
    },
    costEstimate: { pricedCostUSD: 0.2 },
  };
  fs.writeFileSync(path.join(geminiDir, 'token_usage_archive_v2.json'), JSON.stringify(archiveV2));

  const prevEnv = process.env.ANTIGRAVITY_APP_DATA_DIR;
  process.env.ANTIGRAVITY_APP_DATA_DIR = geminiDir;
  try {
    const store = new ConfigStore(stateDir);
    const ov = await computeHistoryOverview(30, {}, store);
    assert.equal(ov.sessions, 2);
    assert.equal(ov.calls, 2);
    assert.ok(ov.totalTokens >= 121600);
    assert.ok(ov.activeDays >= 1);
    assert.ok(ov.topModel);
    assert.ok(ov.bySource.desktop.totalTokens >= 94400);
    assert.ok(ov.bySource.cli.totalTokens >= 27200);
    assert.ok(ov.costEstimate >= 0.2);
    assert.ok(Array.isArray(ov.heatmap7xN) && ov.heatmap7xN.length >= 1);
    assert.ok(Array.isArray(ov.byModel) && ov.byModel.length >= 2);
  } finally {
    if (prevEnv === undefined) delete process.env.ANTIGRAVITY_APP_DATA_DIR;
    else process.env.ANTIGRAVITY_APP_DATA_DIR = prevEnv;
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('meter-core pricing catalog normalization & quota formatting', () => {
  assert.equal(typeof meterCore.summarize, 'function');
  assert.equal(typeof meterCore.resolveModelQuota, 'function');
  assert.equal(typeof meterCore.summarizeApiCost, 'function');

  assert.equal(formatFriendlyPoolTitle('shared_gemini_main'), 'Gemini 4 主力共享池');
  assert.equal(formatFriendlyPoolTitle('shared_3p_pool'), 'Claude / GPT 共享池');
  assert.equal(formatFriendlyPoolTitle('shared_gemini_argon'), 'Gemini 4 Argon / 编排池');
  assert.equal(formatFriendlyPoolTitle('shared_gemini_carbon'), 'Gemini 4 Carbon 专属池');

  const qUi = normalizeQuotaForUi({
    ok: true,
    snapshot: {
      pools: [
        {
          poolKey: 'shared_gemini_main',
          remainingFraction: 0.8,
          models: [{ productLabel: 'Gemini 4 Hydrogen' }, { productLabel: 'Gemini 4 Neon' }],
        },
      ],
    },
  });
  assert.equal(qUi.pools[0].displayName, 'Gemini 4 主力共享池');
  assert.deepEqual(qUi.pools[0].modelNames, ['Gemini 4 Hydrogen', 'Gemini 4 Neon']);

  const shaped = shapeCollectResultForUi({
    latest: {
      model: 'Gemini 4 Hydrogen (High)',
      actual: 560000,
      budget: 786400,
      input: 100000,
      output: 12000,
      cached: 80000,
      speed: { tps: 85, streamingTps: 92, ttft: 1.4, duration: 15, streamingSec: 13.6 },
    },
  }, qUi, { i18n: { language: 'zh-CN' }, enhance: {}, context: {} }, 'conv-test');
  assert.ok(shaped.context.speed.evaluation);
  assert.ok(shaped.context.speed.evaluation.comment.length > 0);
});
