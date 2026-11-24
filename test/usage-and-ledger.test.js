'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  computeHistoryOverview,
  computeConversationCumulativeCost,
  buildEnrichedQuotaUsageEvents,
  formatFriendlyPoolTitle,
  normalizeQuotaForUi,
  normalizeAccountsOverviewForUi,
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
        costUSD: 0.042,
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
        costUSD: 0.042,
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
    costEstimate: { pricedCostUSD: 0.084 },
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
    assert.ok(ov.costEstimate >= 0.08);
    const sumByModel = ov.byModel.reduce((s, m) => s + Number(m.costUsd || 0), 0);
    assert.ok(Math.abs(ov.costEstimate - sumByModel) < 0.001);
    assert.ok(Array.isArray(ov.heatmap7xN) && ov.heatmap7xN.length >= 1);
    assert.ok(Array.isArray(ov.byModel) && ov.byModel.length >= 2);
    const ovToday = await computeHistoryOverview(1, {}, store);
    assert.equal(ovToday.days, 1);
    assert.equal(ovToday.calls, 2);
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

  assert.equal(formatFriendlyPoolTitle('shared_gemini_main'), 'Gemini 4 全系共享池');
  assert.equal(formatFriendlyPoolTitle('shared_3p_pool'), 'Claude / GPT 共享池');
  assert.equal(
    formatFriendlyPoolTitle('shared_gemini_argon', [
      { productLabel: 'Gemini 4 Neon' },
      { productLabel: 'Gemini 4 Hydrogen' },
      { productLabel: 'Gemini 4 Argon' },
      { productLabel: 'Gemini 3.8 Flash' },
    ]),
    'Gemini 4 全系共享池'
  );
  assert.equal(formatFriendlyPoolTitle('shared_gemini_argon'), 'Gemini 4 Argon 专属池');
  assert.equal(formatFriendlyPoolTitle('shared_gemini_carbon'), 'Gemini 4 Carbon 专属池');

  const neonCost = meterCore.calculateRequestApiCost({
    model: 'Gemini 4 Neon (High)',
    inputTokens: 100000,
    cacheTokens: 200000,
    outputTokens: 1000,
    date: '2026-11-23',
  });
  assert.equal(neonCost.isPriced, true);
  assert.equal(neonCost.modelKey, 'gemini-4-neon');
  assert.ok(Math.abs(neonCost.costUSD - 0.345) < 1e-6);

  const qUi = normalizeQuotaForUi({
    ok: true,
    snapshot: {
      pools: [
        {
          poolKey: 'shared_gemini_argon',
          remainingFraction: 0.8,
          models: [{ productLabel: 'Gemini 4 Hydrogen' }, { productLabel: 'Gemini 4 Neon' }],
          buckets: [
            {
              windowKey: '5h',
              windowShort: '5h',
              windowLabel: '5小时限额',
              remainingFraction: 0.94,
              resetTimeIso: '2026-11-23T18:09:11Z',
              countdownText: '3小时48分',
              tokenEstimate: { estRemainingTokens: 50000000, estRemainingShort: '50M', estTotalShort: '53.2M', isReliable: true },
            },
            {
              windowKey: 'weekly',
              windowShort: '7d',
              windowLabel: '每周限额',
              remainingFraction: 0.8,
              resetTimeIso: '2026-11-29T12:41:15Z',
              countdownText: '5天22小时',
              tokenEstimate: { estRemainingTokens: 186000000, estRemainingShort: '186M', estTotalShort: '232.5M', isReliable: true },
            },
          ],
        },
        {
          poolKey: 'shared_gemini-25-progemini25promodel_google_gemini_2_5_pro',
          remainingFraction: 1,
          models: [{ productLabel: 'Gemini 2.5 Pro' }],
        },
      ],
    },
  });
  assert.equal(qUi.pools.length, 1);
  assert.equal(qUi.pools[0].displayName, 'Gemini 4 全系共享池');
  assert.deepEqual(qUi.pools[0].modelNames, ['Gemini 4 Hydrogen', 'Gemini 4 Neon']);
  assert.equal(qUi.pools[0].buckets.length, 2);
  assert.equal(qUi.pools[0].buckets[0].windowLabel, '5小时限额');
  assert.equal(qUi.pools[0].buckets[1].windowLabel, '每周限额');
  assert.ok(qUi.pools[0].buckets[1].resetTimeText);
  assert.equal(qUi.pools[0].buckets[1].tokenEstimate.estRemainingShort, '186M');

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
  assert.equal(shaped.context.speed.tokPerSec, 92);
  assert.equal(shaped.context.speed.overallTps, 85);
  assert.ok(shaped.currentModelQuota);
  assert.equal(shaped.currentModelQuota.remainingPercent, 80);
  assert.equal(shaped.currentModelQuota.estRemainingShort, '186M');
  assert.ok(shaped.context.speed.evaluation);
  assert.ok(shaped.context.speed.evaluation.comment.length > 0);

  const accUi = normalizeAccountsOverviewForUi({
    accounts: [
      {
        email: 'user@example.com',
        tierId: 'g1-pro-tier',
        isActive: true,
        quotaSnapshot: {
          pools: [
            ...qUi.pools,
            { poolKey: 'shared_chat_23310chat_23310model_chat_23310', remainingFraction: 1, models: [{ productLabel: 'chat_23310' }] },
            { poolKey: 'shared_gemini-25-progemini25promodel_google_gemini_2_5_pro', remainingFraction: 1, models: [{ productLabel: 'Gemini 2.5 Pro' }] },
          ],
        },
      },
    ],
  });
  assert.equal(accUi.accounts[0].planName, 'Google One Pro');
  assert.equal(accUi.accounts[0].quotaPools.length, 1);
  assert.equal(accUi.accounts[0].quotaPools[0].buckets.length, 2);

  // Verify whole-conversation cumulative cost merges ledger + live calls without double counting
  const fakeLedger = {
    calls: {
      c1: { callId: 'c1', cascadeId: 'conv-sum', modelKey: 'gemini-4-hydrogen', costUSD: 0.40 },
      c2: { callId: 'c2', cascadeId: 'conv-sum', modelKey: 'gemini-4-neon', costUSD: 0.35 },
      other: { callId: 'other', cascadeId: 'conv-other', modelKey: 'gemini-4-neon', costUSD: 9.99 },
    },
  };
  const fakeCollected = {
    conversation: 'conv-sum',
    latestCallRecord: { callId: 'c3', cascadeId: 'conv-sum', modelKey: 'gemini-4-neon', costUSD: 0.15 },
    recentGeneratorCalls: [
      { callId: 'c2', cascadeId: 'conv-sum', modelKey: 'gemini-4-neon', costUSD: 0.35 },
      { callId: 'c3', cascadeId: 'conv-sum', modelKey: 'gemini-4-neon', costUSD: 0.15 },
    ],
  };
  const cumRes = computeConversationCumulativeCost('conv-sum', fakeCollected, 'Gemini 4 Neon', 0.15, {}, fakeLedger);
  assert.equal(cumRes.sessionCostUsd, 0.9);
  assert.equal(cumRes.turnCostUsd, 0.15);
  assert.equal(cumRes.callCount, 3);

  assert.equal(meterCore.getModelPoolKey('Orchestrator (Neon)'), 'gemini-4-neon');
  assert.equal(meterCore.getModelPoolKey('Gemini 4 Neon'), 'gemini-4-neon');

  const nowMs = Date.now();
  const resetAtMs = nowMs + 5 * 86400000;
  const resetIso = new Date(resetAtMs).toISOString();
  const cycleStartMs = resetAtMs - 7 * 86400000;
  const enriched = buildEnrichedQuotaUsageEvents({
    calls: {
      old: { callId: 'old', modelLabel: 'Gemini 4 Neon (High)', inputTokens: 1000, cacheTokens: 1000, outputTokens: 100, timestamp: cycleStartMs - 86400000 },
      c1: { callId: 'c1', modelLabel: 'Gemini 4 Neon (High)', inputTokens: 2000000, cacheTokens: 8000000, outputTokens: 500000, timestamp: nowMs - 3600000 },
    },
  }, nowMs);
  assert.equal(enriched.usageEvents.length, 2);
  assert.equal(enriched.usageEvents[1].poolKey, 'gemini-4-neon');
  assert.equal(enriched.usageEvents[1].sharedGroupKey, 'shared_gemini_argon');

  const estSnapRes = meterCore.applyQuotaTokenEstimates({
    pools: [{
      poolKey: 'shared_gemini_argon',
      remainingFraction: 0.8,
      models: [{ productLabel: 'Gemini 4 Neon', modelIds: ['gemini-4-neon'] }],
      buckets: [{
        bucketId: 'weekly',
        windowKey: 'weekly',
        windowShort: '7d',
        windowLabel: '每周限额',
        remainingFraction: 0.8,
        hasResetTime: true,
        resetTimeIso: resetIso,
        resetAtMs,
      }],
    }],
  }, {
    usageEvents: enriched.usageEvents,
    historyCoverageStartMs: enriched.historyCoverageStartMs,
    accountScopeKey: 'test-acct',
    calibrationMap: {},
    nowMs,
  });
  const te = estSnapRes.snapshot.pools[0].buckets[0].tokenEstimate;
  assert.equal(te.isReliable, true);
  assert.ok(te.estRemainingShort);
});
