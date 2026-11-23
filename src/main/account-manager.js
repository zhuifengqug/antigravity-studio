'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { URL } = require('url');
const { getAntigravityRoamingDir, getGeminiAntigravityDir } = require('../shared/constants');
const { ConfigStore, atomicWriteJson, readJsonSafe, ensureDir } = require('../shared/config-store');
const {
  buildUnifiedOAuthTokenTopicBase64,
  parseUnifiedOAuthTokenTopicBase64,
  buildUnifiedUserStatusTopicBase64,
  parseUnifiedUserStatusTopicBase64,
} = require('../shared/proto-lite');
const lsClient = require('./ls-client');

const TOPIC_OAUTH_KEY = 'antigravityUnifiedStateSync.oauthToken';
const TOPIC_USER_STATUS_KEY = 'antigravityUnifiedStateSync.userStatus';
const TOPIC_ONBOARDING_KEY = 'antigravityOnboarding';

function maskEmail(email) {
  const s = String(email || '').trim();
  const at = s.indexOf('@');
  if (at <= 1) return s ? '***' : '';
  const name = s.slice(0, at);
  const domain = s.slice(at + 1);
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

function redactSecret(val) {
  const s = String(val || '');
  if (!s) return '';
  if (s.length <= 8) return '***';
  return `${s.slice(0, 4)}***${s.slice(-4)}`;
}

function getLocalSealKey() {
  const seed = `${os.hostname()}|${os.userInfo().username}|antigravity-studio-v1`;
  return crypto.createHash('sha256').update(seed).digest();
}

function sealSecret(plaintext) {
  const text = String(plaintext || '');
  if (!text) return '';
  try {
    const electron = require('electron');
    if (electron?.safeStorage?.isEncryptionAvailable?.()) {
      const buf = electron.safeStorage.encryptString(text);
      return `safe:${buf.toString('base64')}`;
    }
  } catch {}
  const key = getLocalSealKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `aes:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

function unsealSecret(sealed) {
  const s = String(sealed || '');
  if (!s) return '';
  if (s.startsWith('safe:')) {
    const electron = require('electron');
    const raw = Buffer.from(s.slice(5), 'base64');
    return electron.safeStorage.decryptString(raw);
  }
  if (s.startsWith('aes:')) {
    const parts = s.slice(4).split(':');
    if (parts.length !== 3) throw new Error('Invalid sealed secret format');
    const key = getLocalSealKey();
    const iv = Buffer.from(parts[0], 'base64');
    const tag = Buffer.from(parts[1], 'base64');
    const enc = Buffer.from(parts[2], 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  }
  return s;
}

function getDatabaseSync() {
  const mod = require('node:sqlite');
  if (!mod || typeof mod.DatabaseSync !== 'function') {
    throw new Error('node:sqlite DatabaseSync is unavailable');
  }
  return mod.DatabaseSync;
}

function resolveStateDbPath(options = {}) {
  if (options.stateDbPath) return path.resolve(options.stateDbPath);
  return path.join(getAntigravityRoamingDir(options.env), 'User', 'globalStorage', 'state.vscdb');
}

function readStateDbItems(dbPath, keys) {
  if (!fs.existsSync(dbPath)) return {};
  const DatabaseSync = getDatabaseSync();
  const db = new DatabaseSync(dbPath, { open: true, readOnly: true });
  try {
    const out = {};
    const stmt = db.prepare('SELECT value FROM ItemTable WHERE key = ?');
    for (const k of keys) {
      const row = stmt.get(k);
      if (row && row.value !== undefined) {
        out[k] = String(row.value);
      }
    }
    return out;
  } finally {
    db.close();
  }
}

function writeStateDbItems(dbPath, kvMap) {
  ensureDir(path.dirname(dbPath));
  const DatabaseSync = getDatabaseSync();
  const db = new DatabaseSync(dbPath);
  try {
    db.exec('CREATE TABLE IF NOT EXISTS ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB);');
    db.exec('BEGIN IMMEDIATE;');
    const stmt = db.prepare('INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)');
    for (const [k, v] of Object.entries(kvMap)) {
      if (v === null || v === undefined) continue;
      stmt.run(String(k), String(v));
    }
    db.exec('COMMIT;');
  } catch (err) {
    try { db.exec('ROLLBACK;'); } catch {}
    throw err;
  } finally {
    db.close();
  }
}

function decodeJwtEmail(idToken) {
  try {
    const parts = String(idToken || '').split('.');
    if (parts.length < 2) return '';
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload.email || '';
  } catch {
    return '';
  }
}

class AccountManager {
  constructor(options = {}) {
    this.store = options.store || new ConfigStore(options.stateDir);
    this.stateDbPath = resolveStateDbPath(options);
    this.geminiDir = options.geminiDir || getGeminiAntigravityDir(options.env);
    this.env = options.env || process.env;
    this.accountsFile = options.accountsPath || this.store.accountsPath;
    this.diagnosticsFile = path.join(this.store.stateDir, 'account_diagnostics.jsonl');
    this.lastAutoSwitchAt = 0;
  }

  appendDiagnostic(action, detail = {}) {
    try {
      this.store.ensureLayout();
      const entry = {
        at: new Date().toISOString(),
        action,
        ...detail,
        ...(detail.email ? { email: maskEmail(detail.email) } : {}),
        ...(detail.accessToken ? { accessToken: redactSecret(detail.accessToken) } : {}),
        ...(detail.refreshToken ? { refreshToken: redactSecret(detail.refreshToken) } : {}),
      };
      fs.appendFileSync(this.diagnosticsFile, JSON.stringify(entry) + '\n', 'utf8');
    } catch {}
  }

  loadVault() {
    const raw = readJsonSafe(this.accountsFile, null);
    if (!raw || !Array.isArray(raw.accounts)) {
      return { activeAccountId: null, accounts: [] };
    }
    return {
      activeAccountId: raw.activeAccountId || null,
      accounts: raw.accounts.map((a) => ({
        ...a,
        accessToken: a.sealedAccessToken ? unsealSecret(a.sealedAccessToken) : (a.accessToken || ''),
        refreshToken: a.sealedRefreshToken ? unsealSecret(a.sealedRefreshToken) : (a.refreshToken || ''),
      })),
    };
  }

  saveVault(vault) {
    this.store.ensureLayout();
    const persisted = {
      version: 1,
      updatedAt: new Date().toISOString(),
      activeAccountId: vault.activeAccountId || null,
      accounts: (vault.accounts || []).map((a) => {
        const clone = { ...a };
        if (clone.accessToken) clone.sealedAccessToken = sealSecret(clone.accessToken);
        if (clone.refreshToken) clone.sealedRefreshToken = sealSecret(clone.refreshToken);
        delete clone.accessToken;
        delete clone.refreshToken;
        return clone;
      }),
    };
    atomicWriteJson(this.accountsFile, persisted);
  }

  detectActiveFromStateDb() {
    if (!fs.existsSync(this.stateDbPath)) return null;
    try {
      const items = readStateDbItems(this.stateDbPath, [TOPIC_OAUTH_KEY, TOPIC_USER_STATUS_KEY]);
      const oauth = items[TOPIC_OAUTH_KEY] ? parseUnifiedOAuthTokenTopicBase64(items[TOPIC_OAUTH_KEY]) : null;
      const userStatus = items[TOPIC_USER_STATUS_KEY] ? parseUnifiedUserStatusTopicBase64(items[TOPIC_USER_STATUS_KEY]) : null;
      if (!oauth && !userStatus) return null;
      return {
        email: userStatus?.email || '',
        name: userStatus?.name || '',
        accessToken: oauth?.accessToken || '',
        refreshToken: oauth?.refreshToken || '',
        tokenType: oauth?.tokenType || 'Bearer',
        expirySeconds: oauth?.expirySeconds || 0,
        source: 'state.vscdb',
      };
    } catch (err) {
      this.appendDiagnostic('detect_state_db_error', { error: err.message });
      return null;
    }
  }

  async detectCurrentAccount() {
    const dbAcc = this.detectActiveFromStateDb();
    let lsEmail = '';
    let lsName = '';
    let lsPlan = '';
    let lsQuota = null;

    const conn = lsClient.discoverLsConnection(this.env);
    if (conn.ready) {
      try {
        const status = await lsClient.getUserStatus({ conn });
        const us = status?.userStatus || status || {};
        lsEmail = us.email || '';
        lsName = us.name || '';
        lsPlan = us.planStatus?.planInfo?.planName || us.userTier?.name || '';
        lsQuota = us.cascadeModelConfigData?.clientModelConfigs || null;
      } catch {}
    }

    // Fallback: ~/.gemini/antigravity/oauth_creds.json or google_accounts.json
    let fileCreds = null;
    const oauthFile = path.join(this.geminiDir, 'oauth_creds.json');
    if (fs.existsSync(oauthFile)) {
      fileCreds = readJsonSafe(oauthFile, null);
    }

    const email = lsEmail || dbAcc?.email || decodeJwtEmail(fileCreds?.id_token) || '';
    const accessToken = dbAcc?.accessToken || fileCreds?.access_token || '';
    const refreshToken = dbAcc?.refreshToken || fileCreds?.refresh_token || '';

    if (!email && !accessToken && !refreshToken) {
      return null;
    }

    return {
      email,
      name: lsName || dbAcc?.name || email.split('@')[0] || 'Antigravity User',
      planName: lsPlan,
      accessToken,
      refreshToken,
      tokenType: dbAcc?.tokenType || fileCreds?.token_type || 'Bearer',
      expirySeconds: dbAcc?.expirySeconds || (fileCreds?.expiry_date ? Math.floor(fileCreds.expiry_date / 1000) : 0),
      quotaSnapshot: lsQuota ? summarizeConfigsQuota(lsQuota) : null,
      source: dbAcc ? 'state.vscdb' : 'oauth_creds',
    };
  }

  upsertAccount(account) {
    const vault = this.loadVault();
    const emailKey = String(account.email || '').trim().toLowerCase();
    const id = account.id || (emailKey ? `acc_${crypto.createHash('sha1').update(emailKey).digest('hex').slice(0, 12)}` : `acc_${Date.now()}`);
    const existingIdx = vault.accounts.findIndex(
      (a) => a.id === id || (emailKey && String(a.email || '').toLowerCase() === emailKey)
    );
    const record = {
      id,
      email: account.email || '',
      name: account.name || account.email || id,
      planName: account.planName || '',
      accessToken: account.accessToken || '',
      refreshToken: account.refreshToken || '',
      tokenType: account.tokenType || 'Bearer',
      expirySeconds: Number(account.expirySeconds || 0),
      quotaSnapshot: account.quotaSnapshot || null,
      lastCheckedAt: account.lastCheckedAt || new Date().toISOString(),
      source: account.source || 'manual',
    };

    if (existingIdx >= 0) {
      vault.accounts[existingIdx] = { ...vault.accounts[existingIdx], ...record, id: vault.accounts[existingIdx].id };
    } else {
      vault.accounts.push(record);
    }
    if (!vault.activeAccountId) {
      vault.activeAccountId = record.id;
    }
    this.saveVault(vault);
    this.appendDiagnostic('upsert_account', { id: record.id, email: record.email, source: record.source });
    return record;
  }

  async importCurrentAccount() {
    const detected = await this.detectCurrentAccount();
    if (!detected) {
      throw new Error('No active Antigravity account found in state.vscdb, LanguageServer, or oauth_creds.json');
    }
    const saved = this.upsertAccount(detected);
    const vault = this.loadVault();
    vault.activeAccountId = saved.id;
    this.saveVault(vault);
    return this.sanitizeAccountForUi(saved, true);
  }

  addAccountDirect(payload) {
    if (!payload || (!payload.email && !payload.accessToken && !payload.refreshToken)) {
      throw new Error('Account payload requires email or OAuth tokens');
    }
    const saved = this.upsertAccount({ ...payload, source: payload.source || 'manual' });
    return this.sanitizeAccountForUi(saved, false);
  }

  removeAccount(accountId) {
    const vault = this.loadVault();
    const next = vault.accounts.filter((a) => a.id !== accountId);
    if (next.length === vault.accounts.length) {
      throw new Error(`Account not found: ${accountId}`);
    }
    vault.accounts = next;
    if (vault.activeAccountId === accountId) {
      vault.activeAccountId = next[0]?.id || null;
    }
    this.saveVault(vault);
    this.appendDiagnostic('remove_account', { id: accountId });
    return { removed: true, accountId };
  }

  backupStateDb() {
    if (!fs.existsSync(this.stateDbPath)) return null;
    this.store.ensureLayout();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(this.store.backupsDir, `state.vscdb.${stamp}.bak`);
    fs.copyFileSync(this.stateDbPath, dest);
    return dest;
  }

  async switchAccount(accountId, options = {}) {
    const vault = this.loadVault();
    const target = vault.accounts.find((a) => a.id === accountId);
    if (!target) {
      throw new Error(`Target account slot not found: ${accountId}`);
    }
    if (!target.accessToken && !target.refreshToken) {
      throw new Error(`Target account ${maskEmail(target.email)} has no stored OAuth tokens`);
    }

    const backupFile = this.backupStateDb();
    const oauthB64 = buildUnifiedOAuthTokenTopicBase64({
      accessToken: target.accessToken,
      tokenType: target.tokenType || 'Bearer',
      refreshToken: target.refreshToken || '',
      expirySeconds: target.expirySeconds || Math.floor(Date.now() / 1000) + 3600,
    });
    const userStatusB64 = buildUnifiedUserStatusTopicBase64({
      email: target.email,
      name: target.name,
      tier: target.planName || '',
    });

    writeStateDbItems(this.stateDbPath, {
      [TOPIC_OAUTH_KEY]: oauthB64,
      [TOPIC_USER_STATUS_KEY]: userStatusB64,
      [TOPIC_ONBOARDING_KEY]: 'true',
    });

    vault.activeAccountId = target.id;
    this.saveVault(vault);
    this.appendDiagnostic('switch_account', {
      id: target.id,
      email: target.email,
      backupFile,
    });

    let reloaded = false;
    if (typeof options.onSwitched === 'function') {
      await options.onSwitched(target);
      reloaded = true;
    }

    return {
      ok: true,
      switchedTo: this.sanitizeAccountForUi(target, true),
      backupFile,
      stateDbPath: this.stateDbPath,
      reloaded,
      requiresRestart: !reloaded,
    };
  }

  async refreshQuotas() {
    const vault = this.loadVault();
    const conn = lsClient.discoverLsConnection(this.env);
    let activeLsEmail = '';
    let activeSnapshot = null;

    if (conn.ready) {
      try {
        const status = await lsClient.getUserStatus({ conn });
        const us = status?.userStatus || status || {};
        activeLsEmail = String(us.email || '').toLowerCase();
        const cfgs = us.cascadeModelConfigData?.clientModelConfigs || [];
        activeSnapshot = summarizeConfigsQuota(cfgs);
      } catch {}
    }

    for (const acc of vault.accounts) {
      if (activeLsEmail && acc.email && acc.email.toLowerCase() === activeLsEmail && activeSnapshot) {
        acc.quotaSnapshot = activeSnapshot;
        acc.lastCheckedAt = new Date().toISOString();
      }
    }
    this.saveVault(vault);
    return this.getOverview();
  }

  evaluateAutoSwitch(currentMinFraction) {
    const cfg = this.store.load().quota?.autoSwitch;
    if (!cfg || !cfg.enabled) return { shouldSwitch: false, reason: 'disabled' };
    if (currentMinFraction === null || currentMinFraction === undefined) {
      return { shouldSwitch: false, reason: 'no_quota_data' };
    }
    if (currentMinFraction > Number(cfg.threshold ?? 0.05)) {
      return { shouldSwitch: false, reason: 'above_threshold' };
    }
    const now = Date.now();
    const cooldownMs = Number(cfg.cooldownSec ?? 300) * 1000;
    if (now - this.lastAutoSwitchAt < cooldownMs) {
      return { shouldSwitch: false, reason: 'cooldown_active' };
    }
    const vault = this.loadVault();
    const candidate = vault.accounts.find((a) => {
      if (a.id === vault.activeAccountId) return false;
      const frac = a.quotaSnapshot?.minRemainingFraction;
      return frac === undefined || frac === null || frac > Number(cfg.threshold ?? 0.05);
    });
    if (!candidate) return { shouldSwitch: false, reason: 'no_healthy_candidate' };
    return { shouldSwitch: true, candidateId: candidate.id, candidateEmail: maskEmail(candidate.email) };
  }

  async startOAuthLoginFlow(options = {}) {
    const clientId = options.clientId || process.env.AG_STUDIO_OAUTH_CLIENT_ID || '';
    const clientSecret = options.clientSecret || process.env.AG_STUDIO_OAUTH_CLIENT_SECRET || '';
    const timeoutMs = Number(options.timeoutMs || 120000);

    return new Promise((resolve, reject) => {
      const state = crypto.randomBytes(16).toString('hex');
      const server = http.createServer(async (req, res) => {
        try {
          const u = new URL(req.url, 'http://127.0.0.1');
          if (u.pathname !== '/oauth2callback') {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          const code = u.searchParams.get('code');
          const returnedState = u.searchParams.get('state');
          if (!code || returnedState !== state) {
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h3>授权校验失败，请关闭窗口后重试。</h3>');
            cleanup();
            return reject(new Error('OAuth state mismatch or missing code'));
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h3>Antigravity Studio 授权成功，可以关闭此标签页返回客户端。</h3>');
          cleanup();

          const port = server.address().port;
          const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;
          if (typeof options.exchangeCode === 'function') {
            const tokens = await options.exchangeCode({ code, redirectUri });
            const saved = this.upsertAccount({ ...tokens, source: 'oauth_login' });
            return resolve(this.sanitizeAccountForUi(saved, false));
          }
          if (!clientId) {
            return reject(new Error('Received OAuth code but no OAuth clientId configured for token exchange'));
          }
          const tokens = await exchangeGoogleAuthCode({ code, redirectUri, clientId, clientSecret });
          const email = decodeJwtEmail(tokens.id_token) || tokens.email || '';
          const saved = this.upsertAccount({
            email,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenType: tokens.token_type || 'Bearer',
            expirySeconds: Math.floor(Date.now() / 1000) + Number(tokens.expires_in || 3600),
            source: 'oauth_login',
          });
          resolve(this.sanitizeAccountForUi(saved, false));
        } catch (err) {
          cleanup();
          reject(err);
        }
      });

      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('OAuth 授权超时，请重新发起登录'));
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timer);
        try { server.close(); } catch {}
      };

      server.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId || 'antigravity-studio')}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('openid email profile https://www.googleapis.com/auth/cloud-platform')}&access_type=offline&prompt=consent&state=${state}`;
        if (typeof options.onAuthUrl === 'function') {
          options.onAuthUrl(authUrl);
        }
      });
    });
  }

  sanitizeAccountForUi(acc, isActive) {
    return {
      id: acc.id,
      email: acc.email,
      maskedEmail: maskEmail(acc.email),
      name: acc.name,
      planName: acc.planName,
      isActive: Boolean(isActive),
      hasAccessToken: Boolean(acc.accessToken),
      hasRefreshToken: Boolean(acc.refreshToken),
      expirySeconds: acc.expirySeconds || 0,
      quotaSnapshot: acc.quotaSnapshot || null,
      lastCheckedAt: acc.lastCheckedAt || null,
      source: acc.source || 'manual',
    };
  }

  getOverview() {
    const vault = this.loadVault();
    const activeDb = this.detectActiveFromStateDb();
    const cfg = this.store.load();
    return {
      activeAccountId: vault.activeAccountId,
      activeDbEmail: activeDb?.email || '',
      stateDbExists: fs.existsSync(this.stateDbPath),
      stateDbPath: this.stateDbPath,
      autoSwitch: cfg.quota?.autoSwitch || { enabled: false, threshold: 0.05, cooldownSec: 300 },
      accounts: vault.accounts.map((a) => this.sanitizeAccountForUi(a, a.id === vault.activeAccountId)),
    };
  }
}

function summarizeConfigsQuota(configs) {
  if (!Array.isArray(configs) || !configs.length) return null;
  let minFrac = 1;
  const pools = {};
  for (const c of configs) {
    const frac = c?.quotaInfo?.remainingFraction;
    if (typeof frac === 'number') {
      if (frac < minFrac) minFrac = frac;
      const key = c.label || c.modelOrAlias?.model || 'model';
      pools[key] = Math.round(frac * 100);
    }
  }
  return {
    minRemainingFraction: minFrac,
    minRemainingPercent: Math.round(minFrac * 100),
    models: pools,
  };
}

function exchangeGoogleAuthCode({ code, redirectUri, clientId, clientSecret }) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      ...(clientSecret ? { client_secret: clientSecret } : {}),
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString();

    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (res.statusCode >= 400) return reject(new Error(data.error_description || data.error || `HTTP ${res.statusCode}`));
          resolve(data);
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = {
  TOPIC_OAUTH_KEY,
  TOPIC_USER_STATUS_KEY,
  maskEmail,
  redactSecret,
  sealSecret,
  unsealSecret,
  readStateDbItems,
  writeStateDbItems,
  decodeJwtEmail,
  AccountManager,
};
