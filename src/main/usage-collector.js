'use strict';

const fs = require('fs');
const path = require('path');
const {
  DEFAULT_MODEL_PRICING,
  DEFAULT_MODEL_LIMITS,
  getGeminiAntigravityDir,
} = require('../shared/constants');
const { readJsonSafe, ConfigStore } = require('../shared/config-store');
const lsClient = require('./ls-client');

function resolveModelPricing(modelName, overrides = {}) {
  const key = String(modelName || '').toLowerCase();
  for (const [k, v] of Object.entries(overrides || {})) {
    if (key.includes(k.toLowerCase())) return { ...DEFAULT_MODEL_PRICING.default, ...v };
  }
  for (const [k, v] of Object.entries(DEFAULT_MODEL_PRICING)) {
    if (k !== 'default' && key.includes(k)) return v;
  }
  return DEFAULT_MODEL_PRICING.default;
}

function resolveContextLimit(modelName, perModelLimits = {}) {
  const name = String(modelName || '');
  const lower = name.toLowerCase();
  if (perModelLimits && perModelLimits[name]) return Number(perModelLimits[name]);
  for (const [k, v] of Object.entries(perModelLimits || {})) {
    if (lower.includes(k.toLowerCase())) return Number(v);
  }
  for (const [k, v] of Object.entries(DEFAULT_MODEL_LIMITS)) {
    if (lower.includes(k)) return Number(v);
  }
  return 200000;
}

function estimateCostUsd({ inputTokens = 0, outputTokens = 0, cachedTokens = 0, model = '', pricingOverrides = {} }) {
  const p = resolveModelPricing(model, pricingOverrides);
  const nonCachedIn = Math.max(0, Number(inputTokens) - Number(cachedTokens));
  const inCost = (nonCachedIn / 1e6) * Number(p.inputPer1M || 0);
  const cacheCost = (Number(cachedTokens) / 1e6) * Number(p.cachedPer1M || 0);
  const outCost = (Number(outputTokens) / 1e6) * Number(p.outputPer1M || 0);
  return Number((inCost + cacheCost + outCost).toFixed(6));
}

function formatLocalDate(tsMs) {
  const d = new Date(tsMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseTimestampMs(raw) {
  if (!raw) return 0;
  if (typeof raw === 'number') return raw > 1e12 ? raw : raw * 1000;
  const num = Number(raw);
  if (!Number.isNaN(num) && num > 0) return num > 1e12 ? num : num * 1000;
  const parsed = Date.parse(String(raw));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeHistoryRecord(rec, sourceHint = 'desktop') {
  if (!rec || typeof rec !== 'object') return null;
  const ts = parseTimestampMs(rec.timestamp || rec.ts || rec.createdAt || rec.updatedAt || rec.time || rec.date);
  if (!ts) return null;
  const model = String(rec.model || rec.modelId || rec.modelName || 'unknown');
  const inputTokens = Number(rec.inputTokens ?? rec.promptTokens ?? rec.input_tokens ?? 0) || 0;
  const outputTokens = Number(rec.outputTokens ?? rec.completionTokens ?? rec.output_tokens ?? 0) || 0;
  const cachedTokens = Number(rec.cachedTokens ?? rec.cacheReadTokens ?? rec.cached_tokens ?? 0) || 0;
  const thinkingTokens = Number(rec.thinkingTokens ?? rec.reasoningTokens ?? 0) || 0;
  const durationMs = Number(rec.durationMs ?? rec.elapsedMs ?? 0) || 0;
  const ttftMs = Number(rec.ttftMs ?? rec.firstTokenMs ?? 0) || 0;
  const sourceRaw = String(rec.source || rec.client || rec.surface || sourceHint).toLowerCase();
  const source = sourceRaw.includes('cli') || sourceRaw.includes('agy') ? 'cli' : 'desktop';
  const totalTokens = inputTokens + outputTokens + thinkingTokens;
  if (totalTokens <= 0 && cachedTokens <= 0) return null;
  return {
    ts,
    date: formatLocalDate(ts),
    model,
    source,
    inputTokens,
    outputTokens,
    cachedTokens,
    thinkingTokens,
    totalTokens,
    durationMs,
    ttftMs,
  };
}

function collectLedgerRecordsFromDir(geminiDir) {
  const records = [];
  const pushFromObject = (obj, sourceHint) => {
    if (!obj) return;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const norm = normalizeHistoryRecord(item, sourceHint);
        if (norm) records.push(norm);
      }
    } else if (typeof obj === 'object') {
      for (const key of ['entries', 'records', 'items', 'history', 'events', 'usage']) {
        if (Array.isArray(obj[key])) {
          for (const item of obj[key]) {
            const norm = normalizeHistoryRecord(item, sourceHint);
            if (norm) records.push(norm);
          }
        }
      }
      // Map keyed by date or id
      if (!obj.entries && !obj.records && !obj.items && !obj.history && !obj.events && !obj.usage) {
        for (const [k, v] of Object.entries(obj)) {
          if (v && typeof v === 'object') {
            const norm = normalizeHistoryRecord({ date: /^\d{4}-\d{2}-\d{2}/.test(k) ? k : undefined, ...v }, sourceHint);
            if (norm) records.push(norm);
          }
        }
      }
    }
  };

  const candidates = [
    [path.join(geminiDir, 'pricing_ledger_v1.json'), 'desktop'],
    [path.join(geminiDir, 'token_usage_archive_v2.json'), 'desktop'],
    [path.join(geminiDir, 'token_usage_archive_v1.json'), 'desktop'],
  ];

  for (const [filePath, hint] of candidates) {
    const data = readJsonSafe(filePath, null);
    if (data) pushFromObject(data, hint);
  }

  const accountLedgersDir = path.join(geminiDir, 'account_ledgers');
  try {
    if (fs.existsSync(accountLedgersDir)) {
      for (const name of fs.readdirSync(accountLedgersDir)) {
        if (name.endsWith('.json')) {
          const data = readJsonSafe(path.join(accountLedgersDir, name), null);
          if (data) pushFromObject(data, name.includes('cli') ? 'cli' : 'desktop');
        }
      }
    }
  } catch {}

  return records;
}

function aggregateTokenHistory(records, options = {}) {
  const days = Number(options.days || 90);
  const now = Date.now();
  const cutoff = now - days * 86400000;
  const pricingOverrides = options.pricingOverrides || {};
  const subscriptionMonthlyUsd = Number(options.subscriptionMonthlyUsd ?? 20);

  const byDay = new Map();
  const byModel = new Map();
  const bySource = {
    desktop: { inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalTokens: 0, costUsd: 0, turns: 0 },
    cli: { inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalTokens: 0, costUsd: 0, turns: 0 },
  };
  let totalCostUsd = 0;
  let totalSpeedSamples = [];
  let totalTtftSamples = [];

  for (const rec of records) {
    if (rec.ts < cutoff) continue;
    const cost = estimateCostUsd({ ...rec, pricingOverrides });
    totalCostUsd += cost;

    const dayEntry = byDay.get(rec.date) || {
      date: rec.date,
      desktopTokens: 0,
      cliTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      totalTokens: 0,
      costUsd: 0,
      turns: 0,
    };
    if (rec.source === 'cli') dayEntry.cliTokens += rec.totalTokens;
    else dayEntry.desktopTokens += rec.totalTokens;
    dayEntry.inputTokens += rec.inputTokens;
    dayEntry.outputTokens += rec.outputTokens;
    dayEntry.cachedTokens += rec.cachedTokens;
    dayEntry.totalTokens += rec.totalTokens;
    dayEntry.costUsd = Number((dayEntry.costUsd + cost).toFixed(4));
    dayEntry.turns += 1;
    byDay.set(rec.date, dayEntry);

    const modelEntry = byModel.get(rec.model) || {
      model: rec.model,
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      totalTokens: 0,
      costUsd: 0,
      turns: 0,
    };
    modelEntry.inputTokens += rec.inputTokens;
    modelEntry.outputTokens += rec.outputTokens;
    modelEntry.cachedTokens += rec.cachedTokens;
    modelEntry.totalTokens += rec.totalTokens;
    modelEntry.costUsd = Number((modelEntry.costUsd + cost).toFixed(4));
    modelEntry.turns += 1;
    byModel.set(rec.model, modelEntry);

    const s = bySource[rec.source] || bySource.desktop;
    s.inputTokens += rec.inputTokens;
    s.outputTokens += rec.outputTokens;
    s.cachedTokens += rec.cachedTokens;
    s.totalTokens += rec.totalTokens;
    s.costUsd = Number((s.costUsd + cost).toFixed(4));
    s.turns += 1;

    if (rec.durationMs > 0 && rec.outputTokens > 0) {
      totalSpeedSamples.push((rec.outputTokens / rec.durationMs) * 1000);
    }
    if (rec.ttftMs > 0) totalTtftSamples.push(rec.ttftMs);
  }

  // Fill continuous calendar heatmap for requested days
  const heatmap = [];
  for (let i = days - 1; i >= 0; i--) {
    const dStr = formatLocalDate(now - i * 86400000);
    const existing = byDay.get(dStr);
    heatmap.push(
      existing || {
        date: dStr,
        desktopTokens: 0,
        cliTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        turns: 0,
      }
    );
  }

  const avgTokPerSec = totalSpeedSamples.length
    ? Number((totalSpeedSamples.reduce((a, b) => a + b, 0) / totalSpeedSamples.length).toFixed(1))
    : 0;
  const avgTtftMs = totalTtftSamples.length
    ? Math.round(totalTtftSamples.reduce((a, b) => a + b, 0) / totalTtftSamples.length)
    : 0;

  const estimated30dCost = heatmap.slice(-30).reduce((acc, d) => acc + d.costUsd, 0);
  const savingsVsApi = Number((estimated30dCost - subscriptionMonthlyUsd).toFixed(2));

  return {
    days,
    totalTokens: bySource.desktop.totalTokens + bySource.cli.totalTokens,
    totalCostUsd: Number(totalCostUsd.toFixed(4)),
    estimated30dCostUsd: Number(estimated30dCost.toFixed(2)),
    subscriptionMonthlyUsd,
    savingsVsApiUsd: savingsVsApi,
    avgTokPerSec,
    avgTtftMs,
    bySource,
    byModel: [...byModel.values()].sort((a, b) => b.totalTokens - a.totalTokens),
    heatmap,
  };
}

function parseStepsBreakdown(stepsResp, metaResp, perModelLimits = {}) {
  const steps = Array.isArray(stepsResp?.steps) ? stepsResp.steps : [];
  const gens = Array.isArray(metaResp?.generatorMetadata) ? metaResp.generatorMetadata : [];

  let systemTokens = 0;
  let toolsTokens = 0;
  let userTokens = 0;
  let assistantTokens = 0;
  let thinkingTokens = 0;
  let cachedTokens = 0;
  let activeModel = '';
  let lastSpeedTokPerSec = 0;
  let lastTtftMs = 0;
  let lastDurationMs = 0;
  let isGenerating = false;

  for (const step of steps) {
    const type = String(step.type || step.stepType || '').toLowerCase();
    const status = String(step.status || '').toLowerCase();
    if (status.includes('running') || status.includes('generating') || status.includes('pending')) {
      isGenerating = true;
    }
    const textLen = JSON.stringify(step).length;
    const approxTokens = Math.max(1, Math.round(textLen / 4));
    if (type.includes('user')) userTokens += approxTokens;
    else if (type.includes('tool')) toolsTokens += approxTokens;
    else if (type.includes('think')) thinkingTokens += approxTokens;
    else if (type.includes('system')) systemTokens += approxTokens;
    else assistantTokens += approxTokens;
  }

  for (const g of gens) {
    const usage = g.tokenUsage || g.usage || g;
    if (g.model || g.modelId) activeModel = g.model || g.modelId;
    const inTok = Number(usage.inputTokens ?? usage.promptTokens ?? 0);
    const outTok = Number(usage.outputTokens ?? usage.completionTokens ?? 0);
    const cacheTok = Number(usage.cachedTokens ?? usage.cacheReadTokens ?? 0);
    const thinkTok = Number(usage.thinkingTokens ?? 0);
    if (inTok || outTok) {
      cachedTokens = cacheTok;
      if (!systemTokens && inTok) systemTokens = Math.round(inTok * 0.25);
      if (outTok) assistantTokens = Math.max(assistantTokens, outTok);
      if (thinkTok) thinkingTokens = Math.max(thinkingTokens, thinkTok);
    }
    const dur = Number(g.durationMs ?? g.latencyMs ?? 0);
    const ttft = Number(g.ttftMs ?? g.timeToFirstTokenMs ?? 0);
    if (dur > 0 && outTok > 0) {
      lastDurationMs = dur;
      lastSpeedTokPerSec = Number(((outTok / dur) * 1000).toFixed(1));
    }
    if (ttft > 0) lastTtftMs = Math.round(ttft);
  }

  const usedTokens = systemTokens + toolsTokens + userTokens + assistantTokens + thinkingTokens;
  const contextLimit = resolveContextLimit(activeModel || 'default', perModelLimits);
  const ratio = contextLimit > 0 ? Math.min(1, usedTokens / contextLimit) : 0;
  const totalInput = Math.max(1, systemTokens + toolsTokens + userTokens);
  const cacheHitRate = cachedTokens > 0 ? Math.min(1, cachedTokens / totalInput) : 0;

  return {
    model: activeModel || 'gemini-4-neon',
    usedTokens,
    contextLimit,
    remainingTokens: Math.max(0, contextLimit - usedTokens),
    usageRatio: Number(ratio.toFixed(4)),
    cacheHitRate: Number(cacheHitRate.toFixed(4)),
    breakdown: {
      system: systemTokens,
      tools: toolsTokens,
      user: userTokens,
      assistant: assistantTokens,
      thinking: thinkingTokens,
      cached: cachedTokens,
    },
    speed: {
      tokPerSec: lastSpeedTokPerSec,
      ttftMs: lastTtftMs,
      durationMs: lastDurationMs,
      isGenerating,
    },
  };
}

function normalizeQuotaPayload(userStatusResp, modelsResp, lowThreshold = 0.2) {
  const userStatus = userStatusResp?.userStatus || userStatusResp || {};
  const configs = userStatus?.cascadeModelConfigData?.clientModelConfigs || modelsResp?.models || [];
  const models = [];
  const pools = new Map();

  for (const m of configs) {
    const label = m.label || m.modelOrAlias?.model || m.id || 'unknown';
    const quotaInfo = m.quotaInfo || {};
    const remainingFraction = quotaInfo.remainingFraction !== undefined
      ? Number(quotaInfo.remainingFraction)
      : (m.remainingFraction !== undefined ? Number(m.remainingFraction) : null);
    const resetTime = quotaInfo.resetTime || m.resetTime || null;
    const poolKey = m.quotaPool || (label.toLowerCase().includes('claude') ? 'Claude Pool' : label.toLowerCase().includes('pro') ? 'Gemini Pro Pool' : 'Flash / Standard Pool');
    const isLow = remainingFraction !== null && remainingFraction <= lowThreshold;
    const item = {
      id: m.modelOrAlias?.model || m.id || label,
      label,
      poolKey,
      remainingFraction,
      remainingPercent: remainingFraction !== null ? Math.round(remainingFraction * 100) : null,
      resetTime,
      isLow,
    };
    models.push(item);

    if (!pools.has(poolKey) && remainingFraction !== null) {
      pools.set(poolKey, {
        poolKey,
        remainingFraction,
        remainingPercent: Math.round(remainingFraction * 100),
        resetTime,
        isLow,
        models: [label],
      });
    } else if (pools.has(poolKey)) {
      const p = pools.get(poolKey);
      p.models.push(label);
      if (remainingFraction !== null && remainingFraction < p.remainingFraction) {
        p.remainingFraction = remainingFraction;
        p.remainingPercent = Math.round(remainingFraction * 100);
        p.isLow = remainingFraction <= lowThreshold;
      }
    }
  }

  return {
    email: userStatus?.email || '',
    name: userStatus?.name || '',
    planName: userStatus?.planStatus?.planInfo?.planName || userStatus?.userTier?.name || '',
    creditsBalance: userStatus?.planStatus?.availablePromptCredits ?? null,
    models,
    pools: [...pools.values()],
    lowQuotaDetected: models.some((m) => m.isLow),
  };
}

class UsageCollector {
  constructor(options = {}) {
    this.store = options.store || new ConfigStore(options.stateDir);
    this.geminiDir = options.geminiDir || getGeminiAntigravityDir(options.env);
    this.env = options.env || process.env;
    this.liveTurns = [];
  }

  recordLiveTurn(turn) {
    if (!turn) return;
    this.liveTurns.push({ ...turn, ts: turn.ts || Date.now() });
    if (this.liveTurns.length > 200) this.liveTurns.shift();
  }

  async getLiveSnapshot(conversationId) {
    const cfg = this.store.load();
    const conn = lsClient.discoverLsConnection(this.env);
    const cid = conversationId || conn.conversationId || conn.trajectoryId || '';

    let contextData = {
      model: 'gemini-4-neon',
      usedTokens: 0,
      contextLimit: resolveContextLimit('gemini-4-neon', cfg.context.perModelLimits),
      remainingTokens: resolveContextLimit('gemini-4-neon', cfg.context.perModelLimits),
      usageRatio: 0,
      cacheHitRate: 0,
      breakdown: { system: 0, tools: 0, user: 0, assistant: 0, thinking: 0, cached: 0 },
      speed: { tokPerSec: 0, ttftMs: 0, durationMs: 0, isGenerating: false },
    };

    let quotaData = {
      email: '',
      name: '',
      planName: '',
      creditsBalance: null,
      models: [],
      pools: [],
      lowQuotaDetected: false,
    };

    let lsConnected = false;
    let lsError = null;

    if (conn.ready) {
      try {
        const [userStatus, availModels] = await Promise.all([
          lsClient.getUserStatus({ conn }).catch(() => null),
          lsClient.getAvailableModels({ conn }).catch(() => null),
        ]);
        if (userStatus || availModels) {
          lsConnected = true;
          quotaData = normalizeQuotaPayload(userStatus, availModels, cfg.quota.lowQuotaThreshold);
        }
        if (cid) {
          const [steps, meta] = await Promise.all([
            lsClient.getCascadeTrajectorySteps(cid, { conn }).catch(() => null),
            lsClient.getCascadeTrajectoryGeneratorMetadata(cid, { conn }).catch(() => null),
          ]);
          if (steps || meta) {
            contextData = parseStepsBreakdown(steps, meta, cfg.context.perModelLimits);
          }
        }
      } catch (err) {
        lsError = err.message;
      }
    }

    const estTurnCostUsd = estimateCostUsd({
      inputTokens: contextData.breakdown.system + contextData.breakdown.tools + contextData.breakdown.user,
      outputTokens: contextData.breakdown.assistant + contextData.breakdown.thinking,
      cachedTokens: contextData.breakdown.cached,
      model: contextData.model,
      pricingOverrides: cfg.enhance.pricingOverrides,
    });

    return {
      lsConnected,
      lsError,
      conversationId: cid,
      context: contextData,
      quota: quotaData,
      estimatedSessionCostUsd: estTurnCostUsd,
      timestamp: Date.now(),
    };
  }

  getHistorySummary(days = 90) {
    const cfg = this.store.load();
    const ledgerRecords = collectLedgerRecordsFromDir(this.geminiDir);
    const liveRecords = this.liveTurns
      .map((t) => normalizeHistoryRecord(t, 'desktop'))
      .filter(Boolean);
    return aggregateTokenHistory([...ledgerRecords, ...liveRecords], {
      days,
      pricingOverrides: cfg.enhance.pricingOverrides,
      subscriptionMonthlyUsd: cfg.enhance.subscriptionMonthlyUsd,
    });
  }
}

module.exports = {
  resolveModelPricing,
  resolveContextLimit,
  estimateCostUsd,
  normalizeHistoryRecord,
  collectLedgerRecordsFromDir,
  aggregateTokenHistory,
  parseStepsBreakdown,
  normalizeQuotaPayload,
  UsageCollector,
};
