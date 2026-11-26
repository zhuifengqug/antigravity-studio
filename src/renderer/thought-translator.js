(function (globalScope) {
  'use strict';

  var STYLE_ID = 'ags-thought-translator-style';
  var BOX_CLASS = 'ags-thought-box';
  var DEFAULT_STABILITY_DEBOUNCE_MS = 650;
  var MEM_CACHE_LIMIT = 600;

  var SEL_TRIGGER = 'button[data-testid="thinking-collapsible-trigger"]';
  var SEL_TOOL_TRIGGERS = '[data-testid="tool-group-collapsible"], [data-testid="worked-for-collapsible"]';
  var SEL_TOOL_ROWS = '[data-testid="tool-call-row"], [data-ag-tool-row="1"]';
  var SEL_TITLE_CONTAINERS =
    '[data-testid="conversation-row-sidebar"], [data-testid="conversation-row-history"], [data-testid="breadcrumb-segment"]';

  var A_EXP = 'aria-expanded';
  var A_PANEL = 'data-ags-thought-panel';
  var A_READY = 'data-ags-thought-ready';
  var A_PENDING = 'data-ags-thought-pending';
  var A_FAILED = 'data-ags-thought-failed';
  var A_FALLBACK = 'data-ags-thought-fallback';
  var A_SIG = 'data-ags-thought-sig';
  var A_SHOW_RAW = 'data-ags-thought-show-raw';
  var A_MANUAL_RAW = 'data-ags-thought-manual-raw';
  var A_BILINGUAL = 'data-ags-thought-bilingual';
  var A_VIEW = 'data-ags-thought-view';

  var BLOCK_TAGS = new Set('P,DIV,LI,UL,OL,PRE,BLOCKQUOTE,H1,H2,H3,H4,H5,H6,TR,HR,SECTION,ARTICLE'.split(','));
  var SKIP_TAGS = new Set('SCRIPT,STYLE,BUTTON,SVG,NOSCRIPT'.split(','));
  var INLINE_SKIP_TAGS = new Set('SCRIPT,STYLE,SVG,NOSCRIPT,PRE,CODE,A,INPUT,TEXTAREA,SELECT,TIME,KBD,SAMP'.split(','));

  var PACKS = {
    'zh-CN': {
      pending: '正在转译思考…',
      retranslate: '重新转译',
      retry: '↻ 重试',
      failed: '转译未完成',
      showRaw: '原文',
      hideRaw: '收起原文',
      fallback: '机翻降级',
      bilingualLabel: '思考原文',
    },
    'zh-TW': {
      pending: '正在轉譯思考…',
      retranslate: '重新轉譯',
      retry: '↻ 重試',
      failed: '轉譯未完成',
      showRaw: '原文',
      hideRaw: '收起原文',
      fallback: '機翻降級',
      bilingualLabel: '思考原文',
    },
    en: {
      pending: 'Translating thought…',
      retranslate: 'Retranslate',
      retry: '↻ Retry',
      failed: 'Translation failed',
      showRaw: 'Raw',
      hideRaw: 'Hide Raw',
      fallback: 'MT Fallback',
      bilingualLabel: 'Original Thought',
    },
  };

  function getPack(lang) {
    var s = String(lang || '').trim().toLowerCase().replace(/_/g, '-');
    if (s.indexOf('zh-tw') === 0 || s.indexOf('zh-hk') === 0 || s.indexOf('zh-hant') === 0) return PACKS['zh-TW'];
    if (s.indexOf('en') === 0) return PACKS.en;
    return PACKS['zh-CN'];
  }

  function hasAttr(el, name) {
    if (!el) return false;
    if (typeof el.hasAttribute === 'function') return el.hasAttribute(name);
    return typeof el.getAttribute === 'function' ? el.getAttribute(name) !== null : false;
  }

  function ga(el, name) {
    return el && typeof el.getAttribute === 'function' ? el.getAttribute(name) : null;
  }

  function sa(el, name, val) {
    if (el && typeof el.setAttribute === 'function') {
      var str = String(val);
      if (ga(el, name) !== str) el.setAttribute(name, str);
    }
  }

  function ra(el, name) {
    if (el && typeof el.removeAttribute === 'function' && hasAttr(el, name)) {
      el.removeAttribute(name);
    }
  }

  function markIgnored(el) {
    sa(el, 'data-ag-studio-ignore', 'true');
    sa(el, 'data-ag-no-i18n', 'true');
    sa(el, 'translate', 'no');
    return el;
  }

  function isIgnoredNode(node) {
    var cur = node;
    while (cur && cur.nodeType !== 9) {
      if (cur.nodeType === 1) {
        if (
          cur.id === 'ag-studio-root' ||
          hasAttr(cur, 'data-ag-studio-ignore') ||
          hasAttr(cur, 'data-ag-no-i18n') ||
          hasAttr(cur, 'data-ags-thought-box')
        ) {
          return true;
        }
        var cls = String((typeof cur.className === 'string' ? cur.className : ga(cur, 'class')) || '');
        if (cls.indexOf(BOX_CLASS) !== -1) return true;
      }
      cur = cur.parentElement || cur.parentNode || null;
    }
    return false;
  }

  function isDirectBoxElement(el) {
    if (!el || el.nodeType !== 1) return false;
    if (hasAttr(el, 'data-ags-thought-box')) return true;
    if (el.classList && typeof el.classList.contains === 'function' && el.classList.contains(BOX_CLASS)) return true;
    var cls = String((typeof el.className === 'string' ? el.className : ga(el, 'class')) || '');
    return (' ' + cls + ' ').indexOf(' ' + BOX_CLASS + ' ') !== -1;
  }

  function findDirectBox(panel) {
    if (!panel) return null;
    var ch = panel.children || panel.childNodes || [];
    for (var i = 0; i < ch.length; i++) {
      if (isDirectBoxElement(ch[i])) return ch[i];
    }
    return null;
  }

  function normalizeTextKey(str) {
    return String(str || '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n')
      .split('\n')
      .map(function (s) { return s.trim(); })
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  function hashText(str) {
    var s = String(str || '');
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36) + '_' + s.length;
  }

  function sanitizeFileHref(rawHref) {
    var trimmed = String(rawHref || '').trim().replace(/^<|>$/g, '');
    if (!trimmed || /[\u0000-\u001f\u007f"'<>`]/.test(trimmed) || !/^file:\/\//i.test(trimmed)) {
      return '';
    }
    try {
      if (typeof URL === 'function') {
        var parsed = new URL(trimmed);
        return parsed.protocol === 'file:' ? parsed.href : '';
      }
    } catch (_e) {
      return '';
    }
    return /^file:\/\/[^\s"'<>`]+$/i.test(trimmed) ? trimmed : '';
  }

  function filePathToSafeHref(rawPath) {
    var p = String(rawPath || '').trim();
    if (!p || /[\u0000-\u001f\u007f"'<>`]/.test(p)) return '';
    if (/^file:\/\//i.test(p)) return sanitizeFileHref(p);
    if (/^[A-Za-z]:[\\/]/.test(p)) return sanitizeFileHref('file:///' + p.replace(/\\/g, '/'));
    return p.charAt(0) === '/' ? sanitizeFileHref('file://' + p) : '';
  }

  function registerFileNodeInMap(node, fileMap) {
    if (!node || !fileMap) return;
    var tag = node.tagName ? String(node.tagName).toUpperCase() : '';
    var rawHref = (tag === 'A' && (ga(node, 'href') || node.href)) || ga(node, 'data-file-href') || ga(node, 'data-href') || '';
    var safeHref = sanitizeFileHref(rawHref);
    if (!safeHref) {
      var rawPath = ga(node, 'data-file-path') || ga(node, 'data-filepath') || ga(node, 'data-omni-path') || '';
      if (rawPath) {
        var ls = ga(node, 'data-line') || ga(node, 'data-omni-line-start') || '';
        var le = ga(node, 'data-omni-line-end') || '';
        var hashSfx = ls && /^\d+$/.test(ls) ? (le && /^\d+$/.test(le) && le !== ls ? '#L' + ls + '-L' + le : '#L' + ls) : '';
        var base = filePathToSafeHref(rawPath);
        if (base) safeHref = hashSfx ? base + hashSfx : base;
      }
    }
    if (!safeHref) return;

    var rec = { el: node, href: safeHref };
    fileMap.byHref.set(safeHref.toLowerCase(), rec);
    var label = String(node.textContent || '').trim().replace(/^`+|`+$/g, '').trim();
    if (label && (/[./\\]/.test(label) || /#L\d+/i.test(label))) {
      var key = label.replace(/\\/g, '/').toLowerCase();
      if (!fileMap.byLabel.has(key)) fileMap.byLabel.set(key, rec);
    }
    try {
      var noHash = safeHref.split('#')[0];
      var decoded = decodeURIComponent(noHash.replace(/^file:\/\/(?:localhost)?/i, '')).replace(/\\/g, '/');
      var segs = decoded.split('/').filter(Boolean);
      var bn = segs.length ? segs[segs.length - 1] : '';
      var hashPart = safeHref.indexOf('#') >= 0 ? safeHref.slice(safeHref.indexOf('#')) : '';
      if (bn) {
        if (hashPart && !fileMap.byLabel.has((bn + hashPart).toLowerCase())) {
          fileMap.byLabel.set((bn + hashPart).toLowerCase(), rec);
        }
        if (!fileMap.byLabel.has(bn.toLowerCase())) {
          fileMap.byLabel.set(bn.toLowerCase(), rec);
        }
      }
      if (segs.length >= 2) {
        var pb = segs[segs.length - 2] + '/' + bn;
        if (!fileMap.byLabel.has(pb.toLowerCase())) fileMap.byLabel.set(pb.toLowerCase(), rec);
      }
    } catch (_e) {}
  }

  function collectCleanText(node, chunks, fileMap) {
    if (!node) return;
    if (node.nodeType === 3) {
      var val = node.nodeValue !== undefined && node.nodeValue !== null ? node.nodeValue : (node.textContent || '');
      if (val) chunks.push(val);
      return;
    }
    if (node.nodeType !== 1 || isDirectBoxElement(node) || hasAttr(node, 'data-ag-studio-ignore') || hasAttr(node, 'data-ag-no-i18n')) {
      return;
    }
    var tag = node.tagName ? String(node.tagName).toUpperCase() : '';
    if (SKIP_TAGS.has(tag)) return;
    if (tag === 'BR') {
      chunks.push('\n');
      return;
    }
    if (fileMap) registerFileNodeInMap(node, fileMap);
    var isBlock = BLOCK_TAGS.has(tag);
    if (isBlock) chunks.push('\n');
    var ch = node.childNodes;
    if (ch && ch.length) {
      for (var i = 0; i < ch.length; i++) collectCleanText(ch[i], chunks, fileMap);
    } else if (typeof node.textContent === 'string' && (!node.children || !node.children.length)) {
      chunks.push(node.textContent);
    }
    if (isBlock) chunks.push('\n');
  }

  function extractPanelText(panel) {
    if (!panel) return { text: '', fileMap: null };
    var chunks = [];
    var fileMap = { byHref: new Map(), byLabel: new Map() };
    var ch = panel.childNodes || panel.children || [];
    for (var i = 0; i < ch.length; i++) {
      collectCleanText(ch[i], chunks, fileMap);
    }
    return { text: normalizeTextKey(chunks.join('')), fileMap: fileMap };
  }

  function isTriggerStreaming(btn) {
    if (!btn) return false;
    if (ga(btn, 'data-op-thought-state') === 'streaming' || ga(btn, 'data-ag-cs-spark-streaming') === '1') {
      return true;
    }
    if (typeof btn.querySelector === 'function') {
      try {
        if (btn.querySelector('.animate-shimmer-text, .animate-spin, .animate-pulse, [class*="animate-shimmer"], .ag-cs-thinking-spark[data-state="streaming"]')) {
          return true;
        }
      } catch (_e) {}
    }
    var txt = String(btn.textContent || '').trim();
    if (!txt || /已思考|Thought\s+for|Thought\s+process/i.test(txt)) return false;
    return /thinking|正在思考|思考中|推演中/i.test(txt) && !/\d+\s*(s|sec|秒|m|min|分)/i.test(txt);
  }

  function isInViewport(el) {
    if (!el || typeof el.getBoundingClientRect !== 'function') return true;
    try {
      var rect = el.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) return true;
      var vh = (typeof window !== 'undefined' && window.innerHeight) ||
        (typeof document !== 'undefined' && document.documentElement && document.documentElement.clientHeight) || 900;
      return rect.bottom >= -120 && rect.top <= vh + 120;
    } catch (_e) {
      return true;
    }
  }

  function buildTranslatorCss() {
    return [
      '.ags-thought-box {',
      '  position: relative;',
      '  margin: 4px 0 8px 0;',
      '  padding: 10px 12px;',
      '  border-radius: 10px;',
      '  border: 1px solid var(--ags-border, rgba(128, 128, 128, 0.25));',
      '  background: var(--ags-bg-surface, rgba(128, 128, 128, 0.06));',
      '  color: var(--ags-text-primary, inherit);',
      '  font-family: var(--ags-font-body, inherit);',
      '  font-size: 13px;',
      '  line-height: 1.62;',
      '}',
      '[data-ags-mode="dark"] .ags-thought-box {',
      '  background: var(--ags-bg-surface, rgba(255, 255, 255, 0.04));',
      '}',
      '.ags-thought-header {',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: flex-end;',
      '  gap: 6px;',
      '  margin-bottom: 6px;',
      '}',
      '.ags-thought-badge {',
      '  font-size: 11px;',
      '  line-height: 16px;',
      '  padding: 1px 7px;',
      '  border-radius: 999px;',
      '  background: var(--ags-accent-soft, rgba(217, 119, 87, 0.14));',
      '  color: var(--ags-warning, #d97706);',
      '  border: 1px solid var(--ags-border, rgba(128, 128, 128, 0.25));',
      '  margin-right: auto;',
      '}',
      '.ags-thought-btn {',
      '  appearance: none;',
      '  cursor: pointer;',
      '  border: 1px solid var(--ags-border, rgba(128, 128, 128, 0.28));',
      '  background: var(--ags-bg-subtle, rgba(128, 128, 128, 0.08));',
      '  color: var(--ags-text-secondary, inherit);',
      '  border-radius: 6px;',
      '  padding: 2px 7px;',
      '  font-size: 11px;',
      '  line-height: 16px;',
      '  transition: border-color 140ms ease, color 140ms ease;',
      '}',
      '.ags-thought-btn:hover {',
      '  border-color: var(--ags-accent, #d97757);',
      '  color: var(--ags-text-primary, inherit);',
      '}',
      '.ags-thought-body p { margin: 0 0 6px 0; }',
      '.ags-thought-body p:last-child { margin-bottom: 0; }',
      '.ags-thought-body ul, .ags-thought-body ol { margin: 4px 0 6px 18px; padding: 0; }',
      '.ags-thought-body pre {',
      '  background: var(--ags-code-bg, rgba(128, 128, 128, 0.1));',
      '  border: 1px solid var(--ags-border, rgba(128, 128, 128, 0.22));',
      '  border-radius: 6px;',
      '  padding: 8px 10px;',
      '  overflow-x: auto;',
      '  font-family: var(--ags-font-code, monospace);',
      '  font-size: 12px;',
      '}',
      '.ags-thought-code {',
      '  background: var(--ags-code-bg, rgba(128, 128, 128, 0.12));',
      '  border-radius: 4px;',
      '  padding: 1px 4px;',
      '  font-family: var(--ags-font-code, monospace);',
      '  font-size: 0.92em;',
      '}',
      '.ags-thought-file-pill {',
      '  display: inline-flex;',
      '  align-items: center;',
      '  padding: 0 5px;',
      '  border-radius: 5px;',
      '  background: var(--ags-accent-soft, rgba(217, 119, 87, 0.14));',
      '  color: var(--ags-accent, #d97757);',
      '  font-family: var(--ags-font-code, monospace);',
      '  font-size: 0.92em;',
      '  text-decoration: none;',
      '  cursor: pointer;',
      '}',
      '.ags-thought-file-pill:hover { text-decoration: underline; }',
      '.ags-thought-pending { color: var(--ags-text-secondary, #888); font-style: italic; }',
      '.ags-thought-error {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  color: var(--ags-danger, #dc2626);',
      '  font-size: 12px;',
      '}',
      '.ags-thought-bilingual-divider {',
      '  display: none;',
      '  align-items: center;',
      '  gap: 8px;',
      '  margin-top: 8px;',
      '  padding-top: 6px;',
      '  border-top: 1px dashed var(--ags-border, rgba(128, 128, 128, 0.3));',
      '  font-size: 11px;',
      '  color: var(--ags-text-secondary, #888);',
      '}',
      '[' + A_PANEL + '="1"][' + A_BILINGUAL + '="1"] .ags-thought-bilingual-divider { display: flex; }',
      '[' + A_PANEL + '="1"][' + A_READY + '="1"]:not([' + A_SHOW_RAW + '="1"]) > :not(.ags-thought-box) { display: none !important; }',
    ].join('\n');
  }

  function ensureStyleInjected(doc) {
    if (!doc || !doc.createElement) return;
    var existing = typeof doc.getElementById === 'function' ? doc.getElementById(STYLE_ID) : null;
    if (existing) return;
    var styleEl = doc.createElement('style');
    styleEl.id = STYLE_ID;
    markIgnored(styleEl);
    styleEl.textContent = buildTranslatorCss();
    var target = doc.head || doc.documentElement || doc.body;
    if (target && typeof target.appendChild === 'function') {
      target.appendChild(styleEl);
    }
  }

  function removeStyleElement(doc) {
    if (!doc || typeof doc.getElementById !== 'function') return;
    var el = doc.getElementById(STYLE_ID);
    if (el && typeof el.remove === 'function') el.remove();
    else if (el && el.parentNode && typeof el.parentNode.removeChild === 'function') {
      el.parentNode.removeChild(el);
    }
  }

  function clearChildren(el) {
    while (el && el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function lookupFileTarget(fileMap, candidate) {
    var cleaned = String(candidate || '').trim().replace(/^`+|`+$/g, '').trim();
    if (!cleaned) return null;
    if (/^file:\/\//i.test(cleaned)) {
      var safe = sanitizeFileHref(cleaned);
      if (!safe) return null;
      var hit = fileMap ? fileMap.byHref.get(safe.toLowerCase()) : null;
      return { href: safe, nativeEl: hit ? hit.el : null };
    }
    if (!fileMap) return null;
    var norm = cleaned.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase();
    var labelHit = fileMap.byLabel.get(norm);
    if (labelHit) return { href: labelHit.href, nativeEl: labelHit.el };
    return null;
  }

  function createFileLinkElement(doc, labelText, href, nativeEl) {
    var safeHref = sanitizeFileHref(href);
    if (!safeHref) return doc.createTextNode(labelText);
    var a = doc.createElement('a');
    a.className = 'ags-thought-file-pill';
    sa(a, 'href', safeHref);
    sa(a, 'title', safeHref);
    a.textContent = labelText;
    if (typeof a.addEventListener === 'function') {
      a.addEventListener('click', function (ev) {
        if (nativeEl && nativeEl.isConnected !== false && typeof nativeEl.click === 'function') {
          if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
          if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
          nativeEl.click();
        }
      });
    }
    return a;
  }

  function appendPlainWithFileLinks(doc, parent, slice, fileMap) {
    if (!slice) return;
    var re = /(file:\/\/[^\s"'<>()`\uff0c\u3002\uff1b\uff01\uff1f\u3001\uff08\uff09\u3010\u3011\]]+|(?:[A-Za-z0-9_.-]+[\\/])*[A-Za-z0-9_.-]+\.[A-Za-z0-9]{1,8}(?:#L\d+(?:-L?\d+)?|:\d+(?:-\d+)?)?)/g;
    var last = 0;
    var m;
    while ((m = re.exec(slice)) !== null) {
      var rawTok = m[0];
      var trailing = '';
      if (/^file:\/\//i.test(rawTok)) {
        var stripped = rawTok.replace(/[.,;:!?]+$/, '');
        trailing = rawTok.slice(stripped.length);
        rawTok = stripped;
      }
      var hit = /^file:\/\//i.test(rawTok)
        ? lookupFileTarget(fileMap, rawTok)
        : lookupFileTarget(fileMap, rawTok);
      if (hit && hit.href) {
        if (m.index > last) parent.appendChild(doc.createTextNode(slice.slice(last, m.index)));
        parent.appendChild(createFileLinkElement(doc, rawTok, hit.href, hit.nativeEl));
        if (trailing) parent.appendChild(doc.createTextNode(trailing));
        last = m.index + m[0].length;
      }
    }
    if (last < slice.length) parent.appendChild(doc.createTextNode(slice.slice(last)));
  }

  function appendInlineMarkdown(doc, parent, line, fileMap, depth) {
    var d = depth || 0;
    var tokenRe = /(\[([^\[\]\n]+)\]\(((?:\([^()\s]*\)|[^()\s])+)\)|`([^`\n]+)`|\*\*([^*\n]+)\*\*)/g;
    var last = 0;
    var m;
    while ((m = tokenRe.exec(line)) !== null) {
      if (m.index > last) appendPlainWithFileLinks(doc, parent, line.slice(last, m.index), fileMap);
      if (m[2] !== undefined && m[3] !== undefined) {
        var label = m[2].trim().replace(/^`+|`+$/g, '').trim() || m[2].trim();
        var rawUrl = m[3].trim();
        var safeHref = sanitizeFileHref(rawUrl);
        if (safeHref) {
          var hit = lookupFileTarget(fileMap, safeHref);
          parent.appendChild(createFileLinkElement(doc, label, safeHref, hit ? hit.nativeEl : null));
        } else {
          // Reject non-file:// protocols (javascript:, data:, http:, etc.)
          parent.appendChild(doc.createTextNode(label));
        }
      } else if (m[4] !== undefined) {
        var codeInner = m[4];
        var codeHit = lookupFileTarget(fileMap, codeInner);
        if (codeHit && codeHit.href) {
          parent.appendChild(createFileLinkElement(doc, codeInner.trim(), codeHit.href, codeHit.nativeEl));
        } else {
          var codeEl = doc.createElement('code');
          codeEl.className = 'ags-thought-code';
          codeEl.textContent = codeInner;
          parent.appendChild(codeEl);
        }
      } else if (m[5] !== undefined) {
        var strongEl = doc.createElement('strong');
        if (d < 2) appendInlineMarkdown(doc, strongEl, m[5], fileMap, d + 1);
        else strongEl.textContent = m[5];
        parent.appendChild(strongEl);
      }
      last = m.index + m[0].length;
    }
    if (last < line.length) appendPlainWithFileLinks(doc, parent, line.slice(last), fileMap);
  }

  function renderMarkdownBody(doc, container, text, fileMap) {
    clearChildren(container);
    var lines = String(text || '').split('\n');
    var inFence = false;
    var fenceLines = [];
    var listEl = null;
    var listTag = '';

    for (var i = 0; i < lines.length; i++) {
      var rawLine = lines[i].endsWith('\r') ? lines[i].slice(0, -1) : lines[i];
      var trimmed = rawLine.trim();
      if (!inFence && trimmed.indexOf('```') === 0) {
        listEl = null;
        listTag = '';
        inFence = true;
        fenceLines = [];
        continue;
      }
      if (inFence && /^`{3,}\s*$/.test(trimmed)) {
        var pre = doc.createElement('pre');
        pre.textContent = fenceLines.join('\n');
        container.appendChild(pre);
        inFence = false;
        fenceLines = [];
        continue;
      }
      if (inFence) {
        fenceLines.push(rawLine);
        continue;
      }
      if (!trimmed) {
        listEl = null;
        listTag = '';
        continue;
      }
      var ulMatch = /^[-*•]\s+(.+)$/.exec(trimmed);
      var olMatch = !ulMatch && /^\d+[.)]\s+(.+)$/.exec(trimmed);
      if (ulMatch || olMatch) {
        var wantTag = ulMatch ? 'ul' : 'ol';
        if (!listEl || listTag !== wantTag) {
          listEl = doc.createElement(wantTag);
          listTag = wantTag;
          container.appendChild(listEl);
        }
        var li = doc.createElement('li');
        appendInlineMarkdown(doc, li, (ulMatch ? ulMatch[1] : olMatch[1]), fileMap, 0);
        listEl.appendChild(li);
      } else {
        listEl = null;
        listTag = '';
        var p = doc.createElement('p');
        appendInlineMarkdown(doc, p, trimmed.replace(/^#{1,4}\s+/, ''), fileMap, 0);
        container.appendChild(p);
      }
    }
    if (inFence && fenceLines.length) {
      var tailPre = doc.createElement('pre');
      tailPre.textContent = fenceLines.join('\n');
      container.appendChild(tailPre);
    }
  }

  function createThoughtTranslatorController(opts) {
    var options = opts || {};
    var stabilityDebounceMs = typeof options.debounceMs === 'number' && options.debounceMs >= 0
      ? options.debounceMs
      : DEFAULT_STABILITY_DEBOUNCE_MS;

    var currentCfg = { thought: { mode: 'off' }, i18n: { language: 'zh-CN' } };
    var currentApi = null;
    var currentMode = 'off';
    var currentViewMode = 'immersive';
    var currentLang = 'zh-CN';
    var currentStylePreset = 'technical';
    var currentCustomPrompt = '';
    var currentTrigger = 'preload';
    var translateToolSummaries = false;
    var translateTitles = false;

    var observer = null;
    var scanTimer = null;
    var debounceTimers = new Map();
    var panelStateMap = new WeakMap();
    var memCache = new Map();
    var inflightByKey = new Map();
    var toolRecords = new Set();
    var toolNodeMap = new WeakMap();
    var titleRecords = new Set();
    var titleNodeMap = new WeakMap();
    var destroyed = false;

    function getDoc() {
      return options.document || (typeof document !== 'undefined' ? document : null);
    }

    function putMemCache(key, value) {
      if (!key || !value) return;
      if (memCache.has(key)) memCache.delete(key);
      while (memCache.size >= MEM_CACHE_LIMIT) {
        var oldest = memCache.keys().next().value;
        if (oldest === undefined) break;
        memCache.delete(oldest);
      }
      memCache.set(key, value);
    }

    function buildCacheSig(text) {
      return [currentMode, currentStylePreset, currentLang, hashText(text)].join(':');
    }

    function applyPanelViewAttrs(panel) {
      if (!panel) return;
      var failed = ga(panel, A_FAILED) === '1';
      var manualRaw = ga(panel, A_MANUAL_RAW);
      var showRaw = failed || (manualRaw === '1' ? true : manualRaw === '0' ? false : currentViewMode === 'bilingual');
      sa(panel, A_VIEW, currentViewMode);
      if (showRaw) sa(panel, A_SHOW_RAW, '1');
      else ra(panel, A_SHOW_RAW);

      if (currentViewMode === 'bilingual' && showRaw && !failed) sa(panel, A_BILINGUAL, '1');
      else ra(panel, A_BILINGUAL);

      var box = findDirectBox(panel);
      if (box && typeof box.querySelector === 'function') {
        var toggleBtn = box.querySelector('.ags-thought-raw-toggle');
        if (toggleBtn) {
          var pack = getPack(currentLang);
          toggleBtn.textContent = showRaw ? pack.hideRaw : pack.showRaw;
          sa(toggleBtn, 'aria-pressed', String(showRaw));
        }
      }
    }

    function ensureBox(panel, triggerBtn) {
      var doc = getDoc();
      if (!doc || !panel) return null;
      var box = findDirectBox(panel);
      if (box) return box;

      var pack = getPack(currentLang);
      box = doc.createElement('div');
      box.className = BOX_CLASS;
      markIgnored(box);
      sa(box, 'data-ags-thought-box', '1');

      var header = doc.createElement('div');
      header.className = 'ags-thought-header';

      var badge = doc.createElement('span');
      badge.className = 'ags-thought-badge';
      badge.hidden = true;
      badge.textContent = pack.fallback;
      header.appendChild(badge);

      var retranslateBtn = doc.createElement('button');
      retranslateBtn.type = 'button';
      retranslateBtn.className = 'ags-thought-btn ags-thought-retranslate-btn';
      retranslateBtn.textContent = '↻';
      retranslateBtn.title = pack.retranslate;
      sa(retranslateBtn, 'aria-label', pack.retranslate);
      if (typeof retranslateBtn.addEventListener === 'function') {
        retranslateBtn.addEventListener('click', function (ev) {
          if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
          if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
          translatePanel(panel, triggerBtn, { force: true });
        });
      }
      header.appendChild(retranslateBtn);

      var rawToggleBtn = doc.createElement('button');
      rawToggleBtn.type = 'button';
      rawToggleBtn.className = 'ags-thought-btn ags-thought-raw-toggle';
      rawToggleBtn.textContent = pack.showRaw;
      if (typeof rawToggleBtn.addEventListener === 'function') {
        rawToggleBtn.addEventListener('click', function (ev) {
          if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
          if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
          sa(panel, A_MANUAL_RAW, ga(panel, A_SHOW_RAW) === '1' ? '0' : '1');
          applyPanelViewAttrs(panel);
        });
      }
      header.appendChild(rawToggleBtn);

      var body = doc.createElement('div');
      body.className = 'ags-thought-body';

      var divider = doc.createElement('div');
      divider.className = 'ags-thought-bilingual-divider';
      divider.textContent = pack.bilingualLabel;

      box.appendChild(header);
      box.appendChild(body);
      box.appendChild(divider);

      sa(panel, A_PANEL, '1');
      if (typeof panel.insertBefore === 'function') {
        panel.insertBefore(box, panel.firstChild || null);
      } else if (typeof panel.appendChild === 'function') {
        panel.appendChild(box);
      }
      return box;
    }

    function renderBoxPending(panel, triggerBtn) {
      var doc = getDoc();
      var box = ensureBox(panel, triggerBtn);
      if (!box || !doc) return;
      var body = box.querySelector ? box.querySelector('.ags-thought-body') : box.childNodes[1];
      if (body) {
        clearChildren(body);
        var span = doc.createElement('span');
        span.className = 'ags-thought-pending';
        span.textContent = getPack(currentLang).pending;
        body.appendChild(span);
      }
      sa(panel, A_PENDING, '1');
      ra(panel, A_FAILED);
      applyPanelViewAttrs(panel);
    }

    function renderBoxResult(panel, triggerBtn, text, sig, fileMap, isFallback) {
      var doc = getDoc();
      var box = ensureBox(panel, triggerBtn);
      if (!box || !doc) return;
      var body = box.querySelector ? box.querySelector('.ags-thought-body') : box.childNodes[1];
      if (body) {
        renderMarkdownBody(doc, body, text, fileMap);
      }
      var badge = box.querySelector ? box.querySelector('.ags-thought-badge') : null;
      if (badge) {
        badge.hidden = !isFallback;
        badge.textContent = getPack(currentLang).fallback;
      }
      ra(panel, A_PENDING);
      ra(panel, A_FAILED);
      if (isFallback) sa(panel, A_FALLBACK, '1');
      else ra(panel, A_FALLBACK);
      sa(panel, A_READY, '1');
      sa(panel, A_SIG, sig);
      applyPanelViewAttrs(panel);
    }

    function renderBoxError(panel, triggerBtn, errMsg) {
      var doc = getDoc();
      var box = ensureBox(panel, triggerBtn);
      if (!box || !doc) return;
      var pack = getPack(currentLang);
      var body = box.querySelector ? box.querySelector('.ags-thought-body') : box.childNodes[1];
      if (body) {
        clearChildren(body);
        var wrap = doc.createElement('div');
        wrap.className = 'ags-thought-error';

        var msg = doc.createElement('span');
        msg.textContent = errMsg ? (pack.failed + ': ' + String(errMsg).slice(0, 120)) : pack.failed;
        wrap.appendChild(msg);

        var retryBtn = doc.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'ags-thought-btn ags-thought-retry-btn';
        retryBtn.textContent = pack.retry;
        if (typeof retryBtn.addEventListener === 'function') {
          retryBtn.addEventListener('click', function (ev) {
            if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
            if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
            translatePanel(panel, triggerBtn, { force: true });
          });
        }
        wrap.appendChild(retryBtn);
        body.appendChild(wrap);
      }
      ra(panel, A_PENDING);
      ra(panel, A_READY);
      sa(panel, A_FAILED, '1');
      applyPanelViewAttrs(panel);
    }

    function translatePanel(panel, triggerBtn, optsTranslate) {
      if (destroyed || currentMode === 'off' || !panel) return;
      var info = extractPanelText(panel);
      if (!info.text) return;

      var force = Boolean(optsTranslate && optsTranslate.force);
      var sig = buildCacheSig(info.text);

      if (!force) {
        if (ga(panel, A_READY) === '1' && ga(panel, A_SIG) === sig) {
          applyPanelViewAttrs(panel);
          return;
        }
        var cached = memCache.get(sig);
        if (cached) {
          renderBoxResult(panel, triggerBtn, cached, sig, info.fileMap, false);
          return;
        }
      } else {
        memCache.delete(sig);
      }

      if (!currentApi || typeof currentApi.translateThought !== 'function') return;

      var existingFlight = !force ? inflightByKey.get(sig) : null;
      if (existingFlight) {
        renderBoxPending(panel, triggerBtn);
        existingFlight.then(function (res) {
          if (destroyed || currentMode === 'off' || panel.isConnected === false) return;
          if (res && res.ok && res.text) {
            renderBoxResult(panel, triggerBtn, res.text, sig, info.fileMap, Boolean(res.fallback));
          } else if (res && res.skipped) {
            cleanupPanel(panel);
          } else {
            renderBoxError(panel, triggerBtn, res && res.error);
          }
        }).catch(function (err) {
          if (!destroyed && currentMode !== 'off' && panel.isConnected !== false) {
            renderBoxError(panel, triggerBtn, err && err.message);
          }
        });
        return;
      }

      renderBoxPending(panel, triggerBtn);
      var priority = isInViewport(panel) ? 100 : 10;

      var promise = Promise.resolve().then(function () {
        return currentApi.translateThought({
          text: info.text,
          mode: currentMode,
          kind: 'thought',
          targetLang: currentLang,
          stylePreset: currentStylePreset,
          customPrompt: currentCustomPrompt,
          force: force,
          priority: priority,
        });
      });
      inflightByKey.set(sig, promise);

      promise.then(function (res) {
        if (inflightByKey.get(sig) === promise) inflightByKey.delete(sig);
        if (destroyed || currentMode === 'off' || panel.isConnected === false) return;
        if (res && res.ok && res.skipped) {
          cleanupPanel(panel);
          return;
        }
        if (res && res.ok && typeof res.text === 'string' && res.text.trim()) {
          var finalText = res.text.trim();
          putMemCache(sig, finalText);
          renderBoxResult(panel, triggerBtn, finalText, sig, info.fileMap, Boolean(res.fallback));
        } else {
          renderBoxError(panel, triggerBtn, res && res.error);
        }
      }).catch(function (err) {
        if (inflightByKey.get(sig) === promise) inflightByKey.delete(sig);
        if (!destroyed && currentMode !== 'off' && panel.isConnected !== false) {
          renderBoxError(panel, triggerBtn, err && err.message);
        }
      });
    }

    function schedulePanelTranslation(panel, triggerBtn, delayMs) {
      if (destroyed || currentMode === 'off' || !panel) return;
      var prevTimer = debounceTimers.get(panel);
      if (prevTimer) {
        clearTimeout(prevTimer);
        debounceTimers.delete(panel);
      }
      if (delayMs <= 0) {
        translatePanel(panel, triggerBtn, { force: false });
        return;
      }
      var t = setTimeout(function () {
        debounceTimers.delete(panel);
        if (!destroyed && currentMode !== 'off' && panel.isConnected !== false) {
          translatePanel(panel, triggerBtn, { force: false });
        }
      }, delayMs);
      if (t && typeof t.unref === 'function') t.unref();
      debounceTimers.set(panel, t);
    }

    function restoreInlineRecords(recordsSet, nodeMap, attrName) {
      for (var rec of Array.from(recordsSet)) {
        try {
          if (rec.tn && rec.tn.isConnected !== false && rec.tn.nodeValue === rec.trans) {
            rec.tn.nodeValue = rec.orig;
          }
          if (rec.el) ra(rec.el, attrName);
        } catch (_e) {}
        if (rec.tn) nodeMap.delete(rec.tn);
        recordsSet.delete(rec);
      }
    }

    function scanInlineKind(doc, containers, kind, recordsSet, nodeMap, attrName) {
      if (!currentApi || typeof currentApi.translateThought !== 'function' || currentMode === 'off') return;
      for (var i = 0; i < containers.length; i++) {
        var root = containers[i];
        if (!root || isIgnoredNode(root)) continue;
        var textNodes = [];
        var walk = function (n) {
          if (!n) return;
          if (n.nodeType === 3) {
            var v = String(n.nodeValue || '').trim();
            if (v.length >= 4 && v.length <= 280) textNodes.push(n);
            return;
          }
          if (n.nodeType !== 1 || isIgnoredNode(n)) return;
          var tag = n.tagName ? String(n.tagName).toUpperCase() : '';
          if (INLINE_SKIP_TAGS.has(tag)) return;
          var ch = n.childNodes || [];
          for (var j = 0; j < ch.length; j++) walk(ch[j]);
        };
        walk(root);
        textNodes.forEach(function (tn) {
          var prev = nodeMap.get(tn);
          if (prev && prev.trans === tn.nodeValue && prev.lang === currentLang && prev.mode === currentMode) return;
          var rawVal = String(tn.nodeValue || '');
          var trimmed = rawVal.trim();
          var cacheSig = [kind, currentMode, currentLang, hashText(trimmed)].join(':');
          var cached = memCache.get(cacheSig);
          var applyVal = function (translated) {
            if (destroyed || currentMode === 'off' || tn.isConnected === false || tn.nodeValue !== rawVal) return;
            var nextVal = rawVal.replace(trimmed, translated);
            if (nextVal === rawVal) return;
            var el = tn.parentElement || null;
            tn.nodeValue = nextVal;
            if (el) sa(el, attrName, '1');
            var rec = { tn: tn, el: el, orig: rawVal, trans: nextVal, lang: currentLang, mode: currentMode };
            nodeMap.set(tn, rec);
            recordsSet.add(rec);
          };
          if (cached) {
            applyVal(cached);
            return;
          }
          Promise.resolve().then(function () {
            return currentApi.translateThought({
              text: trimmed,
              mode: currentMode,
              kind: kind,
              targetLang: currentLang,
              stylePreset: currentStylePreset,
              priority: 50,
            });
          }).then(function (res) {
            if (res && res.ok && !res.skipped && typeof res.text === 'string' && res.text.trim()) {
              putMemCache(cacheSig, res.text.trim());
              applyVal(res.text.trim());
            }
          }).catch(function () {});
        });
      }
    }

    function scanNow() {
      scanTimer = null;
      if (destroyed || currentMode === 'off') return;
      var doc = getDoc();
      if (!doc || typeof doc.querySelectorAll !== 'function') return;

      ensureStyleInjected(doc);

      var triggers = doc.querySelectorAll(SEL_TRIGGER) || [];
      var list = [];
      for (var i = 0; i < triggers.length; i++) {
        var btn = triggers[i];
        if (!btn || isIgnoredNode(btn)) continue;
        var expanded = ga(btn, A_EXP) === 'true';
        var isLatest = i === triggers.length - 1;
        if (!expanded && !(currentTrigger === 'preload' && isLatest)) continue;
        var panel = btn.nextElementSibling;
        if (!panel || String(panel.tagName || '').toUpperCase() !== 'DIV' || isIgnoredNode(panel)) continue;
        list.push({
          btn: btn,
          panel: panel,
          priority: (isInViewport(panel) ? 100 : 0) + (isLatest ? 10 : 0),
        });
      }
      list.sort(function (a, b) { return b.priority - a.priority; });

      for (var k = 0; k < list.length; k++) {
        var item = list[k];
        if (isTriggerStreaming(item.btn)) {
          schedulePanelTranslation(item.panel, item.btn, stabilityDebounceMs);
          continue;
        }
        var info = extractPanelText(item.panel);
        if (!info.text) continue;
        var sig = buildCacheSig(info.text);
        if (ga(item.panel, A_READY) === '1' && ga(item.panel, A_SIG) === sig) {
          applyPanelViewAttrs(item.panel);
          continue;
        }
        var cached = memCache.get(sig);
        if (cached) {
          renderBoxResult(item.panel, item.btn, cached, sig, info.fileMap, false);
          continue;
        }
        var state = panelStateMap.get(item.panel);
        if (!state || state.text !== info.text) {
          panelStateMap.set(item.panel, { text: info.text });
          schedulePanelTranslation(item.panel, item.btn, state ? stabilityDebounceMs : Math.min(stabilityDebounceMs, 50));
        } else if (!debounceTimers.has(item.panel) && ga(item.panel, A_PENDING) !== '1' && ga(item.panel, A_FAILED) !== '1') {
          schedulePanelTranslation(item.panel, item.btn, stabilityDebounceMs);
        }
      }

      if (translateToolSummaries) {
        var toolContainers = [];
        var tGroups = doc.querySelectorAll(SEL_TOOL_TRIGGERS) || [];
        for (var g = 0; g < tGroups.length; g++) {
          if (ga(tGroups[g], A_EXP) === 'true' && tGroups[g].nextElementSibling) {
            toolContainers.push(tGroups[g].nextElementSibling);
          }
        }
        var tRows = doc.querySelectorAll(SEL_TOOL_ROWS) || [];
        for (var r = 0; r < tRows.length; r++) toolContainers.push(tRows[r]);
        if (toolContainers.length) {
          scanInlineKind(doc, toolContainers, 'tool_summary', toolRecords, toolNodeMap, 'data-ags-tool-tr');
        }
      }

      if (translateTitles) {
        var titleEls = doc.querySelectorAll(SEL_TITLE_CONTAINERS) || [];
        if (titleEls.length) {
          scanInlineKind(doc, titleEls, 'title', titleRecords, titleNodeMap, 'data-ags-title-tr');
        }
      }
    }

    function scheduleScan(delayMs) {
      if (destroyed || currentMode === 'off' || scanTimer) return;
      scanTimer = setTimeout(scanNow, typeof delayMs === 'number' ? delayMs : 40);
      if (scanTimer && typeof scanTimer.unref === 'function') scanTimer.unref();
    }

    function ensureObserver() {
      if (observer || destroyed || currentMode === 'off') return;
      var doc = getDoc();
      var MO = options.MutationObserver ||
        (typeof globalScope !== 'undefined' && globalScope.MutationObserver) ||
        (typeof MutationObserver === 'function' ? MutationObserver : null);
      if (!doc || typeof MO !== 'function') return;
      var target = doc.body || doc.documentElement;
      if (!target) return;

      observer = new MO(function (records) {
        if (destroyed || currentMode === 'off') return;
        var relevant = false;
        for (var i = 0; i < records.length; i++) {
          var rec = records[i];
          var tgt = rec && rec.target;
          if (!tgt || isIgnoredNode(tgt)) continue;
          relevant = true;
          break;
        }
        if (relevant) scheduleScan(40);
      });
      try {
        observer.observe(target, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: [A_EXP, 'class', 'data-op-thought-state'],
        });
      } catch (_e) {}
    }

    function disconnectObserver() {
      if (observer) {
        try { observer.disconnect(); } catch (_e) {}
        observer = null;
      }
    }

    function cleanupPanel(panel) {
      if (!panel) return;
      var timer = debounceTimers.get(panel);
      if (timer) {
        clearTimeout(timer);
        debounceTimers.delete(panel);
      }
      var box = findDirectBox(panel);
      if (box) {
        if (typeof box.remove === 'function') box.remove();
        else if (panel.removeChild) panel.removeChild(box);
      }
      [A_PANEL, A_READY, A_PENDING, A_FAILED, A_FALLBACK, A_SIG, A_SHOW_RAW, A_MANUAL_RAW, A_BILINGUAL, A_VIEW].forEach(function (attr) {
        ra(panel, attr);
      });
    }

    function cleanupAll() {
      if (scanTimer) {
        clearTimeout(scanTimer);
        scanTimer = null;
      }
      for (var t of debounceTimers.values()) clearTimeout(t);
      debounceTimers.clear();
      disconnectObserver();
      restoreInlineRecords(toolRecords, toolNodeMap, 'data-ags-tool-tr');
      restoreInlineRecords(titleRecords, titleNodeMap, 'data-ags-title-tr');

      var doc = getDoc();
      if (doc && typeof doc.querySelectorAll === 'function') {
        var boxes = doc.querySelectorAll('.' + BOX_CLASS + ', [data-ags-thought-box="1"]') || [];
        for (var i = 0; i < boxes.length; i++) {
          var box = boxes[i];
          var parent = box.parentElement || box.parentNode;
          if (typeof box.remove === 'function') box.remove();
          else if (parent && parent.removeChild) parent.removeChild(box);
        }
        var panels = doc.querySelectorAll('[' + A_PANEL + '="1"]') || [];
        for (var j = 0; j < panels.length; j++) cleanupPanel(panels[j]);
        removeStyleElement(doc);
      }
      inflightByKey.clear();
    }

    function sync(cfg, api) {
      if (destroyed) return;
      if (api !== undefined) currentApi = api;
      currentCfg = cfg || {};
      var tCfg = (currentCfg && currentCfg.thought) || {};
      var nextMode = tCfg.mode === 'machine' || tCfg.mode === 'ai' ? tCfg.mode : 'off';

      if (nextMode === 'off') {
        currentMode = 'off';
        cleanupAll();
        return;
      }

      var prevMode = currentMode;
      var prevLang = currentLang;
      var prevView = currentViewMode;
      var prevPreset = currentStylePreset;
      var prevPrompt = currentCustomPrompt;

      currentMode = nextMode;
      currentViewMode = tCfg.viewMode === 'bilingual' ? 'bilingual' : 'immersive';
      currentLang = tCfg.targetLang || (currentCfg.i18n && currentCfg.i18n.language) || 'zh-CN';
      currentStylePreset = tCfg.stylePreset || 'technical';
      currentCustomPrompt = tCfg.customPrompt || '';
      currentTrigger = tCfg.trigger === 'expand' ? 'expand' : 'preload';
      var nextToolSum = Boolean(tCfg.translateToolSummaries);
      var nextTitles = Boolean(tCfg.translateTitles);

      if (translateToolSummaries && !nextToolSum) {
        restoreInlineRecords(toolRecords, toolNodeMap, 'data-ags-tool-tr');
      }
      if (translateTitles && !nextTitles) {
        restoreInlineRecords(titleRecords, titleNodeMap, 'data-ags-title-tr');
      }
      translateToolSummaries = nextToolSum;
      translateTitles = nextTitles;

      ensureStyleInjected(getDoc());
      ensureObserver();

      var viewChanged = prevView !== currentViewMode;
      var configChanged = prevMode !== currentMode || prevLang !== currentLang || prevPreset !== currentStylePreset || prevPrompt !== currentCustomPrompt;
      if (viewChanged && !configChanged) {
        var doc = getDoc();
        if (doc && typeof doc.querySelectorAll === 'function') {
          var panels = doc.querySelectorAll('[' + A_PANEL + '="1"]') || [];
          for (var i = 0; i < panels.length; i++) {
            ra(panels[i], A_MANUAL_RAW);
            applyPanelViewAttrs(panels[i]);
          }
        }
      }
      scanNow();
    }

    function clearCache() {
      memCache.clear();
      if (currentApi) {
        if (typeof currentApi.clearThoughtCache === 'function') {
          return currentApi.clearThoughtCache();
        }
        if (typeof currentApi.clearCache === 'function') {
          return currentApi.clearCache();
        }
      }
      return Promise.resolve({ ok: true, cleared: 0 });
    }

    function destroy() {
      destroyed = true;
      currentMode = 'off';
      cleanupAll();
      memCache.clear();
      currentApi = null;
    }

    return {
      sync: sync,
      clearCache: clearCache,
      destroy: destroy,
      scanNow: scanNow,
    };
  }

  var exported = {
    createThoughtTranslatorController: createThoughtTranslatorController,
    sanitizeFileHref: sanitizeFileHref,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_THOUGHT_TRANSLATOR__ = exported;
  }
  if (typeof window !== 'undefined' && window !== globalScope) {
    window.__AG_STUDIO_THOUGHT_TRANSLATOR__ = exported;
  }
})(typeof window !== 'undefined' ? window : globalThis);
