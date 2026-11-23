(function (globalScope) {
  'use strict';

  var PROSE_SEL = '[data-testid="planner-response-text"], [data-testid="agent-response"] [data-markdown-root]';

  function ensurePrismFxStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ag-studio-prism-fx-style')) return;
    var s = document.createElement('style');
    s.id = 'ag-studio-prism-fx-style';
    s.textContent = [
      '@keyframes ags-ink-in { from { opacity:0.15; filter:blur(1.5px); } to { opacity:1; filter:blur(0); } }',
      '.ags-ink-chunk { animation: ags-ink-in 260ms cubic-bezier(.22,1,.36,1) both; }',
      '@keyframes ags-caret-blink { 0%, 45% { opacity:1; } 55%, 100% { opacity:0.25; } }',
      '.ags-smooth-caret { position:absolute; top:0; left:0; width:2px; border-radius:2px; background:var(--ags-accent, #D97757); box-shadow:0 0 8px var(--ags-accent-soft, rgba(217,119,87,0.35)); pointer-events:none; z-index:40; transition:transform 80ms cubic-bezier(.22,1,.36,1), height 80ms ease, opacity 120ms ease; opacity:0; }',
      '.ags-smooth-caret[data-vis="1"] { opacity:1; animation:ags-caret-blink 1.05s ease-in-out infinite; }',
      '.ags-smooth-caret[data-typing="1"] { opacity:1; animation:none; }',
      '#ag-studio-edge-aura { position:fixed; inset:0; pointer-events:none; z-index:2147482890; opacity:0; transition:opacity 280ms ease, box-shadow 280ms ease; }',
      '#ag-studio-edge-aura[data-aura="waiting"] { opacity:1; box-shadow:inset 0 0 38px rgba(245,158,11,0.22), inset 0 2px 14px rgba(245,158,11,0.26); }',
      '#ag-studio-edge-aura[data-aura="error"] { opacity:1; box-shadow:inset 0 0 42px rgba(239,68,68,0.24), inset 0 2px 16px rgba(239,68,68,0.28); }',
      '#ag-studio-edge-aura[data-aura="complete"] { opacity:1; box-shadow:inset 0 0 38px rgba(16,185,129,0.22), inset 0 2px 14px rgba(16,185,129,0.26); }',
      '::highlight(ags-ink-0) { opacity: 0.20; }',
      '::highlight(ags-ink-1) { opacity: 0.45; }',
      '::highlight(ags-ink-2) { opacity: 0.72; }',
      '::highlight(ags-ink-3) { opacity: 0.90; }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function createPrismFxController() {
    if (typeof document === 'undefined') {
      return { sync: function () {}, destroy: function () {} };
    }
    ensurePrismFxStyles();

    var fxCfg = {
      inkStream: true,
      smoothCaret: true,
      edgeAura: true
    };
    var destroyed = false;

    // ── 1. Edge Aura (0fps static CSS box-shadow) ────────────────────────────
    var auraEl = null;
    var currentAura = 'none';

    function syncEdgeAura(auraPhase) {
      var next = fxCfg.edgeAura ? (auraPhase || 'none') : 'none';
      if (next !== 'waiting' && next !== 'error' && next !== 'complete') next = 'none';
      if (next === 'none' && !auraEl) return;
      if (!auraEl) {
        auraEl = document.getElementById('ag-studio-edge-aura');
        if (!auraEl) {
          auraEl = document.createElement('div');
          auraEl.id = 'ag-studio-edge-aura';
          auraEl.setAttribute('data-ag-studio-ignore', 'true');
          auraEl.setAttribute('aria-hidden', 'true');
          (document.body || document.documentElement).appendChild(auraEl);
        }
      }
      if (currentAura !== next) {
        currentAura = next;
        auraEl.setAttribute('data-aura', next);
      }
    }

    // ── 2. Smooth Caret Follower (0fps at rest, event-driven) ─────────────────
    var caretEl = null;
    var caretHost = null;
    var caretTypingTimer = 0;

    function hideCaret() {
      if (caretEl) {
        caretEl.setAttribute('data-vis', '0');
        caretEl.setAttribute('data-typing', '0');
      }
    }

    function updateCaretPosition(isTyping) {
      if (destroyed || !fxCfg.smoothCaret) {
        hideCaret();
        return;
      }
      var active = document.activeElement;
      if (!active || !active.closest) { hideCaret(); return; }
      if (active.closest('#ag-studio-root, [data-ag-studio-ignore], .monaco-editor')) {
        hideCaret();
        return;
      }
      var inComposer = active.closest('[data-testid="agent-input-box"], .surface-composer-card');
      if (!inComposer || (!active.isContentEditable && active.getAttribute('contenteditable') !== 'true')) {
        hideCaret();
        return;
      }

      var sel = typeof document.getSelection === 'function' ? document.getSelection() : null;
      if (!sel || sel.rangeCount === 0) { hideCaret(); return; }
      var range = sel.getRangeAt(0);
      if (!range || !range.collapsed || !active.contains(range.startContainer)) {
        hideCaret();
        return;
      }

      var rects = range.getClientRects ? range.getClientRects() : [];
      var r = rects.length ? rects[rects.length - 1] : (range.getBoundingClientRect ? range.getBoundingClientRect() : null);
      if (!r || (r.left === 0 && r.top === 0)) {
        var edRect = active.getBoundingClientRect();
        var cs = typeof getComputedStyle === 'function' ? getComputedStyle(active) : null;
        var padL = parseFloat((cs && cs.paddingLeft) || '8') || 8;
        var padT = parseFloat((cs && cs.paddingTop) || '8') || 8;
        var fontSize = parseFloat((cs && cs.fontSize) || '14') || 14;
        r = { left: edRect.left + padL, top: edRect.top + padT, height: Math.round(fontSize * 1.3) };
      }

      var host = active.parentElement || inComposer;
      var hostRect = host.getBoundingClientRect();
      if (!hostRect || hostRect.width <= 0) { hideCaret(); return; }

      try {
        var hPos = typeof getComputedStyle === 'function' ? getComputedStyle(host).position : '';
        if (!hPos || hPos === 'static') host.style.position = 'relative';
      } catch (_e) {}

      if (!caretEl) {
        caretEl = document.createElement('span');
        caretEl.className = 'ags-smooth-caret';
        caretEl.setAttribute('data-ag-studio-ignore', 'true');
        caretEl.setAttribute('aria-hidden', 'true');
      }
      if (caretHost !== host || caretEl.parentElement !== host) {
        caretHost = host;
        host.appendChild(caretEl);
      }

      var x = Math.max(0, r.left - hostRect.left + (host.scrollLeft || 0));
      var y = Math.max(0, r.top - hostRect.top + (host.scrollTop || 0));
      var h = Math.max(14, Math.min(28, r.height || 18));

      caretEl.style.height = h + 'px';
      caretEl.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      caretEl.setAttribute('data-vis', '1');

      if (isTyping) {
        caretEl.setAttribute('data-typing', '1');
        if (caretTypingTimer) clearTimeout(caretTypingTimer);
        caretTypingTimer = setTimeout(function () {
          caretTypingTimer = 0;
          if (caretEl) caretEl.setAttribute('data-typing', '0');
        }, 420);
      }
    }

    var onCaretInput = function () { updateCaretPosition(true); };
    var onCaretNav = function () { updateCaretPosition(false); };
    var onCaretBlur = function () { hideCaret(); };

    document.addEventListener('input', onCaretInput, true);
    document.addEventListener('keyup', onCaretNav, true);
    document.addEventListener('mouseup', onCaretNav, { passive: true });
    document.addEventListener('selectionchange', onCaretNav, true);
    document.addEventListener('focusin', onCaretNav, { passive: true });
    document.addEventListener('focusout', onCaretBlur, { passive: true });

    // ── 3. Ink Stream Fade-In (active ONLY while generating; 0fps when idle) ──
    var streamObs = null;
    var streamTarget = null;
    var seenInkNodes = typeof WeakSet === 'function' ? new WeakSet() : null;
    var textLenMap = typeof WeakMap === 'function' ? new WeakMap() : null;
    var hlBuckets = null;
    var fadeItems = [];
    var fadeTimer = 0;

    function clearInkHighlights() {
      if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = 0; }
      if (hlBuckets) {
        for (var i = 0; i < hlBuckets.length; i++) {
          try { hlBuckets[i].clear(); } catch (_e) {}
        }
      }
      fadeItems.length = 0;
    }

    function stepHighlights() {
      fadeTimer = 0;
      if (destroyed || fadeItems.length === 0) {
        clearInkHighlights();
        return;
      }
      var now = Date.now();
      var next = [];
      for (var i = 0; i < hlBuckets.length; i++) {
        try { hlBuckets[i].clear(); } catch (_e) {}
      }
      for (var j = 0; j < fadeItems.length; j++) {
        var it = fadeItems[j];
        var age = now - it.t;
        if (age >= 240 || !it.n || it.n.isConnected === false) continue;
        var b = Math.min(3, Math.floor(age / 60));
        try {
          hlBuckets[b].add(it.r);
          next.push(it);
        } catch (_e) {}
      }
      fadeItems = next;
      if (fadeItems.length > 0) {
        fadeTimer = setTimeout(stepHighlights, 60);
      }
    }

    function ensureHighlightBuckets() {
      if (hlBuckets) return hlBuckets;
      if (typeof CSS === 'undefined' || !CSS.highlights || typeof Highlight !== 'function') return null;
      hlBuckets = [];
      for (var i = 0; i < 4; i++) {
        var name = 'ags-ink-' + i;
        var hl = CSS.highlights.get(name) || new Highlight();
        CSS.highlights.set(name, hl);
        hlBuckets.push(hl);
      }
      return hlBuckets;
    }

    function stopStreamObserver() {
      if (streamObs) {
        try { streamObs.disconnect(); } catch (_e) {}
        streamObs = null;
      }
      streamTarget = null;
      clearInkHighlights();
    }

    function syncInkStream(isGenerating) {
      if (destroyed || !fxCfg.inkStream || !isGenerating || document.hidden) {
        stopStreamObserver();
        return;
      }
      var conv = document.querySelector('[data-testid="conversation-view"]');
      if (!conv) {
        stopStreamObserver();
        return;
      }
      if (streamObs && streamTarget === conv) return;
      stopStreamObserver();

      streamTarget = conv;
      streamObs = new MutationObserver(function (mutations) {
        if (destroyed || !fxCfg.inkStream || document.hidden) return;
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (m.type === 'characterData' && m.target && m.target.nodeType === 3) {
            var tn = m.target;
            var parentEl = tn.parentElement;
            if (!parentEl || !parentEl.closest || !parentEl.closest(PROSE_SEL)) continue;
            var len = (tn.nodeValue || '').length;
            var prevLen = textLenMap ? (textLenMap.get(tn) || 0) : 0;
            if (textLenMap) textLenMap.set(tn, len);
            if (len > prevLen && len - prevLen <= 40) {
              var buckets = ensureHighlightBuckets();
              if (buckets && typeof document.createRange === 'function') {
                try {
                  var r = document.createRange();
                  r.setStart(tn, prevLen);
                  r.setEnd(tn, len);
                  buckets[0].add(r);
                  fadeItems.push({ n: tn, r: r, t: Date.now() });
                  if (fadeItems.length > 32) fadeItems.shift();
                  if (!fadeTimer) fadeTimer = setTimeout(stepHighlights, 60);
                } catch (_e) {}
              }
            }
          } else if (m.type === 'childList' && m.addedNodes && m.addedNodes.length) {
            for (var a = 0; a < m.addedNodes.length; a++) {
              var node = m.addedNodes[a];
              if (!node || node.nodeType !== 1 || !node.closest) continue;
              if (!node.closest(PROSE_SEL)) continue;
              if (seenInkNodes && seenInkNodes.has(node)) continue;
              if (seenInkNodes) seenInkNodes.add(node);
              if (node.classList && !node.classList.contains('ags-ink-chunk')) {
                node.classList.add('ags-ink-chunk');
              }
            }
          }
        }
      });
      streamObs.observe(conv, { childList: true, characterData: true, subtree: true });
    }

    function sync(opts) {
      if (destroyed) return;
      var o = opts || {};
      var cfgFx = (o.cfg && o.cfg.fx) || {};
      fxCfg.inkStream = cfgFx.inkStream !== false;
      fxCfg.smoothCaret = cfgFx.smoothCaret !== false;
      fxCfg.edgeAura = cfgFx.edgeAura !== false;

      if (!fxCfg.smoothCaret) hideCaret();
      syncEdgeAura(o.auraPhase || 'none');
      syncInkStream(Boolean(o.isGenerating));
    }

    function destroy() {
      destroyed = true;
      stopStreamObserver();
      if (caretTypingTimer) clearTimeout(caretTypingTimer);
      document.removeEventListener('input', onCaretInput, true);
      document.removeEventListener('keyup', onCaretNav, true);
      document.removeEventListener('mouseup', onCaretNav, { passive: true });
      document.removeEventListener('selectionchange', onCaretNav, true);
      document.removeEventListener('focusin', onCaretNav, { passive: true });
      document.removeEventListener('focusout', onCaretBlur, { passive: true });
      if (caretEl && caretEl.parentElement) caretEl.parentElement.removeChild(caretEl);
      if (auraEl && auraEl.parentElement) auraEl.parentElement.removeChild(auraEl);
    }

    return {
      sync: sync,
      destroy: destroy
    };
  }

  var api = {
    createPrismFxController: createPrismFxController
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_PRISM_FX__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
