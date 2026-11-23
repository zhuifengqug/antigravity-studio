'use strict';

/**
 * Zero-dependency Protobuf wire-format encoder/decoder
 * Used for Antigravity UnifiedStateSync OAuthToken / UserStatus topics.
 */

function encodeVarint(value) {
  let n = BigInt(value);
  if (n < 0n) {
    n = BigInt.asUintN(64, n);
  }
  const bytes = [];
  while (n >= 0x80n) {
    bytes.push(Number((n & 0x7fn) | 0x80n));
    n >>= 7n;
  }
  bytes.push(Number(n));
  return Buffer.from(bytes);
}

function decodeVarint(buf, offset = 0) {
  let result = 0n;
  let shift = 0n;
  let pos = offset;
  while (pos < buf.length) {
    const b = buf[pos++];
    result |= BigInt(b & 0x7f) << shift;
    if ((b & 0x80) === 0) {
      return { value: result, nextOffset: pos };
    }
    shift += 7n;
    if (shift > 70n) {
      throw new Error('Malformed protobuf varint');
    }
  }
  throw new Error('Truncated protobuf varint');
}

function encodeTag(fieldNumber, wireType) {
  return encodeVarint((BigInt(fieldNumber) << 3n) | BigInt(wireType));
}

function encodeProtoFieldVarint(fieldNumber, value) {
  return Buffer.concat([encodeTag(fieldNumber, 0), encodeVarint(value)]);
}

function encodeProtoFieldBytes(fieldNumber, bytes) {
  const payload = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes || '');
  return Buffer.concat([encodeTag(fieldNumber, 2), encodeVarint(payload.length), payload]);
}

function encodeProtoFieldString(fieldNumber, str) {
  return encodeProtoFieldBytes(fieldNumber, Buffer.from(String(str ?? ''), 'utf8'));
}

function skipProtoField(buf, offset, wireType) {
  switch (wireType) {
    case 0:
      return decodeVarint(buf, offset).nextOffset;
    case 1:
      return Math.min(buf.length, offset + 8);
    case 2: {
      const { value, nextOffset } = decodeVarint(buf, offset);
      return Math.min(buf.length, nextOffset + Number(value));
    }
    case 5:
      return Math.min(buf.length, offset + 4);
    default:
      throw new Error(`Unsupported protobuf wireType: ${wireType}`);
  }
}

function decodeProtoFields(buf) {
  const buffer = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  const fields = [];
  let pos = 0;
  while (pos < buffer.length) {
    const tagRes = decodeVarint(buffer, pos);
    pos = tagRes.nextOffset;
    const tag = tagRes.value;
    const fieldNumber = Number(tag >> 3n);
    const wireType = Number(tag & 7n);
    if (fieldNumber <= 0) throw new Error('Invalid protobuf field number 0');

    if (wireType === 0) {
      const v = decodeVarint(buffer, pos);
      fields.push({ fieldNumber, wireType, value: v.value });
      pos = v.nextOffset;
    } else if (wireType === 1) {
      const slice = buffer.subarray(pos, pos + 8);
      fields.push({ fieldNumber, wireType, value: slice });
      pos += 8;
    } else if (wireType === 2) {
      const lenRes = decodeVarint(buffer, pos);
      const len = Number(lenRes.value);
      const start = lenRes.nextOffset;
      const end = start + len;
      if (end > buffer.length) throw new Error('Truncated length-delimited field');
      fields.push({ fieldNumber, wireType, value: buffer.subarray(start, end) });
      pos = end;
    } else if (wireType === 5) {
      const slice = buffer.subarray(pos, pos + 4);
      fields.push({ fieldNumber, wireType, value: slice });
      pos += 4;
    } else {
      throw new Error(`Unsupported wire type ${wireType}`);
    }
  }
  return fields;
}

/**
 * UnifiedStateSync Topic envelope:
 *   field 1 (bytes): entry {
 *     field 1 (string): key ("oauthToken" / "userStatus" / ...)
 *     field 2 (bytes): value wrapper {
 *       field 1 (string): base64 encoded inner payload OR direct inner fields
 *       field 2 (message): timestamp { field 1: seconds (varint) }
 *     }
 *   }
 * Also supports direct inner OAuthTokenInfo protobuf:
 *   field 1: accessToken (string)
 *   field 2: tokenType (string, e.g. "Bearer")
 *   field 3: refreshToken (string)
 *   field 4: expiry (Timestamp { field 1: seconds })
 */
function buildOAuthTokenProto({ accessToken, tokenType = 'Bearer', refreshToken = '', expirySeconds = 0 }) {
  const parts = [];
  if (accessToken) parts.push(encodeProtoFieldString(1, accessToken));
  if (tokenType) parts.push(encodeProtoFieldString(2, tokenType));
  if (refreshToken) parts.push(encodeProtoFieldString(3, refreshToken));
  if (expirySeconds > 0) {
    parts.push(encodeProtoFieldBytes(4, encodeProtoFieldVarint(1, expirySeconds)));
  }
  return Buffer.concat(parts);
}

function parseOAuthTokenProto(buf) {
  const fields = decodeProtoFields(buf);
  const out = { accessToken: '', tokenType: 'Bearer', refreshToken: '', expirySeconds: 0 };
  for (const f of fields) {
    if (f.wireType === 2) {
      if (f.fieldNumber === 1) out.accessToken = f.value.toString('utf8');
      else if (f.fieldNumber === 2) out.tokenType = f.value.toString('utf8');
      else if (f.fieldNumber === 3) out.refreshToken = f.value.toString('utf8');
      else if (f.fieldNumber === 4) {
        try {
          const tsFields = decodeProtoFields(f.value);
          const sec = tsFields.find((x) => x.fieldNumber === 1 && x.wireType === 0);
          if (sec) out.expirySeconds = Number(sec.value);
        } catch {}
      }
    }
  }
  return out;
}

function buildUnifiedTopicBase64(topicKey, innerPayloadBufOrStr, updatedAtSec = Math.floor(Date.now() / 1000)) {
  const innerB64 = Buffer.isBuffer(innerPayloadBufOrStr)
    ? innerPayloadBufOrStr.toString('base64')
    : String(innerPayloadBufOrStr || '');
  const timestampMsg = encodeProtoFieldVarint(1, updatedAtSec);
  const valueWrapper = Buffer.concat([
    encodeProtoFieldString(1, innerB64),
    encodeProtoFieldBytes(2, timestampMsg),
  ]);
  const entry = Buffer.concat([
    encodeProtoFieldString(1, topicKey),
    encodeProtoFieldBytes(2, valueWrapper),
  ]);
  return encodeProtoFieldBytes(1, entry).toString('base64');
}

function parseUnifiedTopicBase64(b64) {
  if (!b64 || typeof b64 !== 'string') return null;
  const raw = Buffer.from(b64.trim(), 'base64');
  const outer = decodeProtoFields(raw);
  const entries = [];
  for (const f of outer) {
    if (f.fieldNumber === 1 && f.wireType === 2) {
      const entryFields = decodeProtoFields(f.value);
      const keyField = entryFields.find((x) => x.fieldNumber === 1 && x.wireType === 2);
      const valField = entryFields.find((x) => x.fieldNumber === 2 && x.wireType === 2);
      const key = keyField ? keyField.value.toString('utf8') : '';
      let innerBase64 = '';
      let updatedAtSec = 0;
      if (valField) {
        const valSub = decodeProtoFields(valField.value);
        const sField = valSub.find((x) => x.fieldNumber === 1 && x.wireType === 2);
        const tsField = valSub.find((x) => x.fieldNumber === 2 && x.wireType === 2);
        if (sField) innerBase64 = sField.value.toString('utf8');
        if (tsField) {
          const tsSub = decodeProtoFields(tsField.value);
          const sec = tsSub.find((x) => x.fieldNumber === 1 && x.wireType === 0);
          if (sec) updatedAtSec = Number(sec.value);
        }
      }
      entries.push({ key, innerBase64, updatedAtSec });
    }
  }
  return entries;
}

function buildUnifiedOAuthTokenTopicBase64(oauthInfo) {
  const inner = buildOAuthTokenProto(oauthInfo);
  return buildUnifiedTopicBase64('oauthTokenInfoSentinelKey', inner);
}

function parseUnifiedOAuthTokenTopicBase64(b64) {
  const entries = parseUnifiedTopicBase64(b64);
  if (!entries || !entries.length) {
    // fallback: try parsing directly as OAuthTokenProto
    try {
      const direct = parseOAuthTokenProto(Buffer.from(String(b64).trim(), 'base64'));
      if (direct.accessToken || direct.refreshToken) return direct;
    } catch {}
    return null;
  }
  const target = entries.find((e) => e.key.toLowerCase().includes('oauth')) || entries[0];
  if (!target || !target.innerBase64) return null;
  const parsed = parseOAuthTokenProto(Buffer.from(target.innerBase64, 'base64'));
  return { ...parsed, key: target.key, updatedAtSec: target.updatedAtSec };
}

function buildUnifiedUserStatusTopicBase64({ email = '', name = '', tier = '' }) {
  const parts = [];
  if (name) parts.push(encodeProtoFieldString(1, name));
  if (email) parts.push(encodeProtoFieldString(2, email));
  if (tier) parts.push(encodeProtoFieldString(3, tier));
  return buildUnifiedTopicBase64('userStatusSentinelKey', Buffer.concat(parts));
}

function parseUnifiedUserStatusTopicBase64(b64) {
  const entries = parseUnifiedTopicBase64(b64);
  if (!entries || !entries.length) return null;
  const target = entries[0];
  if (!target || !target.innerBase64) return { key: target?.key || '', email: '', name: '', tier: '' };
  const innerBuf = Buffer.from(target.innerBase64, 'base64');
  // Collect printable UTF-8 strings from nested protobuf fields to reliably locate email
  const strings = [];
  const collectStrings = (buf, depth = 0) => {
    if (depth > 4) return;
    try {
      for (const f of decodeProtoFields(buf)) {
        if (f.wireType === 2) {
          const text = f.value.toString('utf8');
          if (/^[\x20-\x7E\u4e00-\u9fff]+$/.test(text) && text.length >= 2) {
            strings.push({ fieldNumber: f.fieldNumber, text });
          }
          if (f.value.length > 2) collectStrings(f.value, depth + 1);
        }
      }
    } catch {}
  };
  collectStrings(innerBuf);
  const emailItem = strings.find((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.text));
  const nameItem = strings.find((s) => s !== emailItem && !s.text.startsWith('http'));
  return {
    key: target.key,
    updatedAtSec: target.updatedAtSec,
    email: emailItem ? emailItem.text : '',
    name: nameItem ? nameItem.text : '',
    rawStrings: strings.map((s) => s.text),
  };
}

module.exports = {
  encodeVarint,
  decodeVarint,
  encodeProtoFieldVarint,
  encodeProtoFieldBytes,
  encodeProtoFieldString,
  skipProtoField,
  decodeProtoFields,
  buildOAuthTokenProto,
  parseOAuthTokenProto,
  buildUnifiedTopicBase64,
  parseUnifiedTopicBase64,
  buildUnifiedOAuthTokenTopicBase64,
  parseUnifiedOAuthTokenTopicBase64,
  buildUnifiedUserStatusTopicBase64,
  parseUnifiedUserStatusTopicBase64,
};
