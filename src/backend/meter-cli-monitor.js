'use strict';

const fs = require('fs');
const { listCliTranscripts, readCliSettings } = require('./meter-cli-adapter');

function summarizeCliTranscriptTail(transcriptPath, maxBytes = 65536) {
  const out = { totalCalls: 0, inputTokens: 0, cacheTokens: 0, outputTokens: 0, lastModel: null, lastAt: null };
  try {
    if (!fs.existsSync(transcriptPath)) return out;
    const st = fs.statSync(transcriptPath);
    const fd = fs.openSync(transcriptPath, 'r');
    let raw = '';
    try {
      const readLen = Math.min(st.size, maxBytes);
      const buf = Buffer.alloc(readLen);
      fs.readSync(fd, buf, 0, readLen, Math.max(0, st.size - readLen));
      raw = buf.toString('utf8');
    } finally {
      fs.closeSync(fd);
    }
    for (const line of raw.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const ev = JSON.parse(line);
        const u = ev.chatModel?.usage;
        const inp = Number(ev.input_tokens ?? u?.inputTokens ?? 0) || 0;
        const cap = Number(ev.cache_read_tokens ?? u?.cacheReadTokens ?? 0) || 0;
        const outp = Number(ev.output_tokens ?? u?.outputTokens ?? 0) || 0;
        if (inp + cap + outp > 0) {
          out.totalCalls++;
          out.inputTokens += inp;
          out.cacheTokens += cap;
          out.outputTokens += outp;
          out.lastModel = ev.chatModel?.modelDisplayName || ev.chatModel?.model || ev.model || out.lastModel;
          out.lastAt = ev.created_at || out.lastAt;
        }
      } catch {}
    }
  } catch {}
  return out;
}

function getCliMonitorSnapshot(options = {}) {
  const limit = Number(options.limit || 10);
  const transcripts = listCliTranscripts(options).slice(0, limit);
  const sessions = transcripts.map((item) => ({
    ...item,
    summary: summarizeCliTranscriptTail(item.transcriptPath)
  }));
  return {
    ok: true,
    sessionCount: sessions.length,
    settings: readCliSettings(options),
    sessions
  };
}

module.exports = {
  summarizeCliTranscriptTail,
  getCliMonitorSnapshot
};
