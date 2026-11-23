(function (globalScope) {
  'use strict';

  var UUID_RE = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  var ROUTE_UUID_RE = /\/c\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:[/?#]|$)/i;

  var SUBAGENT_SEL = '[data-testid="subagent-tab-conversation"]';
  var CONV_VIEW_SEL = '[data-testid="conversation-view"]';
  var INPUT_BOX_SEL = '[data-testid="agent-input-box"]';
  var COMPOSER_CARD_SEL = '[data-testid="agent-input-box"] .surface-composer-card, .surface-composer-card';
  var RUNNING_SEL = [
    '[data-testid="input-cancel-button"]',
    '[data-testid="stop-button"]',
    '[data-testid="cancel-button"]',
    '[data-testid="agent-loading"]',
    '[data-testid="thinking-collapsible-trigger"][data-op-thought-state="streaming"]'
  ].join(', ');
  var DECISION_SEL = '[data-testid="interaction-takeover-card"], [data-testid="side-question-panel"]';
  var ERROR_SEL = '[data-testid="agent-error"], [role="alert"][data-error="true"]';

  function isOwnNode(el) {
    if (!el || !el.closest) return false;
    return Boolean(
      el.id === 'ag-studio-root' ||
      el.hasAttribute('data-ag-studio-ignore') ||
      el.closest('#ag-studio-root, [data-ag-studio-ignore]')
    );
  }

  function isVisible(el) {
    if (!el || el.isConnected === false || el.hidden) return false;
    if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return false;
    var cls = typeof el.className === 'string' ? el.className : '';
    if (/(?:^|\s)(?:hidden|sr-only)(?:\s|$)/.test(cls)) return false;
    if (el.style && (el.style.display === 'none' || el.style.visibility === 'hidden')) return false;
    if (typeof el.checkVisibility === 'function') {
      try { if (!el.checkVisibility()) return false; } catch (_e) {}
    }
    if (typeof el.getBoundingClientRect === 'function') {
      var r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) return false;
    }
    return true;
  }

  function readFiberCascadeId(el, maxDepth) {
    if (!el) return '';
    try {
      var keys = Object.keys(el);
      var fiberKey = null;
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('__reactFiber$') === 0) {
          fiberKey = keys[i];
          break;
        }
      }
      var f = fiberKey ? el[fiberKey] : null;
      var depth = 0;
      while (f && depth < (maxDepth || 50)) {
        var props = f.memoizedProps || f.pendingProps;
        if (props && typeof props.cascadeId === 'string' && UUID_RE.test(props.cascadeId)) {
          return props.cascadeId.match(UUID_RE)[1];
        }
        if (props && props.store && typeof props.store.getState === 'function') {
          var st = props.store.getState();
          var cs = st && st.conversation && st.conversation.convoState;
          if (cs && cs.type === 'active' && typeof cs.cascadeId === 'string' && UUID_RE.test(cs.cascadeId)) {
            return cs.cascadeId.match(UUID_RE)[1];
          }
          if (cs && cs.type === 'subagent' && typeof cs.childConversationId === 'string' && UUID_RE.test(cs.childConversationId)) {
            return cs.childConversationId.match(UUID_RE)[1];
          }
        }
        f = f.return;
        depth++;
      }
    } catch (_e) {}
    return '';
  }

  function readReduxConvoId() {
    if (typeof document === 'undefined') return '';
    var anchors = document.querySelectorAll(
      CONV_VIEW_SEL + ', ' + INPUT_BOX_SEL + ', [data-testid="conversation-row-sidebar"], [data-testid="home-greeting"]'
    );
    for (var i = 0; i < anchors.length; i++) {
      var el = anchors[i];
      try {
        var keys = Object.keys(el);
        var fk = null;
        for (var j = 0; j < keys.length; j++) {
          if (keys[j].indexOf('__reactFiber$') === 0) { fk = keys[j]; break; }
        }
        var f = fk ? el[fk] : null;
        var depth = 0;
        while (f && depth < 60) {
          var p = f.memoizedProps;
          if (p && p.store && typeof p.store.getState === 'function') {
            var st = p.store.getState();
            var cs = st && st.conversation && st.conversation.convoState;
            if (cs && cs.type === 'active' && cs.cascadeId) return String(cs.cascadeId);
            if (cs && cs.type === 'subagent' && cs.childConversationId) return String(cs.childConversationId);
          }
          var dep = f.dependencies && f.dependencies.firstContext;
          while (dep) {
            var mv = dep.memoizedValue;
            if (mv && mv.store && typeof mv.store.getState === 'function') {
              var st2 = mv.store.getState();
              var cs2 = st2 && st2.conversation && st2.conversation.convoState;
              if (cs2 && cs2.type === 'active' && cs2.cascadeId) return String(cs2.cascadeId);
              if (cs2 && cs2.type === 'subagent' && cs2.childConversationId) return String(cs2.childConversationId);
            }
            dep = dep.next;
          }
          f = f.return;
          depth++;
        }
      } catch (_e) {}
    }
    return '';
  }

  function findFormalConvView() {
    if (typeof document === 'undefined') return null;
    var views = document.querySelectorAll(CONV_VIEW_SEL);
    for (var i = 0; i < views.length; i++) {
      var cv = views[i];
      if (isOwnNode(cv)) continue;
      if (cv.closest && cv.closest(SUBAGENT_SEL)) continue;
      if (cv.closest && cv.closest('.agy-home')) continue;
      if (cv.querySelector && cv.querySelector('.agy-home')) continue;
      return cv;
    }
    return null;
  }

  function extractConversationId() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null;
    try {
      var urlCandidates = [
        window.location && window.location.pathname,
        window.location && window.location.hash,
        window.location && window.location.search,
        window.location && window.location.href
      ];
      for (var i = 0; i < urlCandidates.length; i++) {
        var s = String(urlCandidates[i] || '');
        var rm = s.match(ROUTE_UUID_RE);
        if (rm && rm[1]) return rm[1];
      }
      var cv = findFormalConvView();
      if (cv) {
        var attrId = cv.getAttribute && cv.getAttribute('data-cascade-id');
        if (attrId && attrId !== 'conversation' && UUID_RE.test(attrId)) {
          return attrId.match(UUID_RE)[1];
        }
        var fibId = readFiberCascadeId(cv, 40);
        if (fibId) return fibId;
      }
      var comp = findComposerTarget();
      if (comp && comp.inputBox && !comp.isHome) {
        var inpFib = readFiberCascadeId(comp.inputBox, 60);
        if (inpFib) return inpFib;
      }
      for (var j = 0; j < urlCandidates.length; j++) {
        var s2 = String(urlCandidates[j] || '');
        var um = s2.match(UUID_RE);
        if (um && um[1]) return um[1];
      }
      if (!detectHomeState().isHome) {
        var reduxId = readReduxConvoId();
        if (reduxId && UUID_RE.test(reduxId)) return reduxId.match(UUID_RE)[1];
      }
    } catch (_e) {}
    return null;
  }

  function detectHomeState() {
    if (typeof document === 'undefined') return { isHome: false, homeRoot: null, greetingEl: null };
    var homeRoot = document.querySelector('.agy-home');
    var greetingEl = document.querySelector('[data-testid="home-greeting"]');
    var formalCv = findFormalConvView();
    var hasMessages = Boolean(
      document.querySelector('[data-testid="agent-response"], [data-testid="user-message"], [data-testid="planner-response-text"]')
    );
    var urlPath = (typeof window !== 'undefined' && window.location && window.location.pathname) || '';
    var hasConvUrl = ROUTE_UUID_RE.test(urlPath);
    var isHome = Boolean((homeRoot || greetingEl) && !formalCv && !hasMessages && !hasConvUrl);
    return {
      isHome: isHome,
      homeRoot: homeRoot || (greetingEl ? greetingEl.closest('main, section, div') : null),
      greetingEl: greetingEl
    };
  }

  function findComposerTarget() {
    if (typeof document === 'undefined') return null;

    // 1. Primary Antigravity 2.34 .surface-composer-card inside [data-testid="agent-input-box"]
    var cards = document.querySelectorAll(COMPOSER_CARD_SEL);
    var chosenCard = null;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (isOwnNode(c)) continue;
      if (c.closest && c.closest(SUBAGENT_SEL)) continue;
      if (!isVisible(c)) continue;
      chosenCard = c;
      break;
    }

    if (chosenCard) {
      var ib = chosenCard.closest(INPUT_BOX_SEL) || chosenCard;
      var ed = ib.querySelector('[contenteditable="true"], textarea');
      return {
        card: chosenCard,
        inputBox: ib,
        editable: ed || null,
        isHome: Boolean(chosenCard.closest('.agy-home')),
        isSubagent: false
      };
    }

    // 2. Fallback: [data-testid="agent-input-box"]
    var boxes = document.querySelectorAll(INPUT_BOX_SEL);
    for (var j = 0; j < boxes.length; j++) {
      var box = boxes[j];
      if (isOwnNode(box)) continue;
      if (box.closest && box.closest(SUBAGENT_SEL)) continue;
      if (!isVisible(box)) continue;
      var ed2 = box.querySelector('[contenteditable="true"], textarea');
      var card2 = box.querySelector('.surface-composer-card') || (ed2 && ed2.closest('form')) || box;
      return {
        card: card2,
        inputBox: box,
        editable: ed2 || null,
        isHome: Boolean(box.closest('.agy-home')),
        isSubagent: false
      };
    }

    // 3. Generic fallback: visible contenteditable/textarea composer
    var inputs = document.querySelectorAll('[contenteditable="true"][role="textbox"], [contenteditable="true"], textarea');
    for (var k = 0; k < inputs.length; k++) {
      var inp = inputs[k];
      if (isOwnNode(inp)) continue;
      if (inp.closest && inp.closest(SUBAGENT_SEL)) continue;
      if (inp.closest && inp.closest('.monaco-editor, [role="dialog"]')) continue;
      if (!isVisible(inp)) continue;
      var rect = inp.getBoundingClientRect ? inp.getBoundingClientRect() : null;
      if (rect && rect.width > 180 && rect.height >= 20) {
        var outer = inp.closest('.surface-composer-card, [data-testid="agent-input-box"], form') || inp.parentElement;
        if (!outer) continue;
        return {
          card: outer,
          inputBox: outer,
          editable: inp,
          isHome: Boolean(outer.closest('.agy-home')),
          isSubagent: false
        };
      }
    }

    return null;
  }

  function ensureComposerTopAnchor(composer) {
    if (!composer || !composer.card || composer.card.isConnected === false) return null;
    var anchor = composer.card;
    try {
      var pos = typeof getComputedStyle === 'function' ? getComputedStyle(anchor).position : '';
      if (!pos || pos === 'static') {
        anchor.style.position = 'relative';
      }
      anchor.setAttribute('data-ags-mascot-anchor', '1');
    } catch (_e) {}
    return anchor;
  }

  function ensureComposerBottomSlot(composer) {
    if (typeof document === 'undefined' || !composer) return null;
    var refEl = composer.inputBox || composer.card;
    if (!refEl || !refEl.parentElement) return null;

    var slot = document.getElementById('ag-studio-composer-bottom');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'ag-studio-composer-bottom';
      slot.setAttribute('data-ag-studio-ignore', 'true');
      slot.setAttribute('data-ag-no-i18n', 'true');
      slot.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;margin-top:6px;pointer-events:none;z-index:30;';
    }
    if (slot.parentElement !== refEl.parentElement || slot.previousElementSibling !== refEl) {
      if (refEl.nextSibling) {
        refEl.parentElement.insertBefore(slot, refEl.nextSibling);
      } else {
        refEl.parentElement.appendChild(slot);
      }
    }
    slot.style.display = 'flex';
    return slot;
  }

  function parkComposerBottomSlot() {
    if (typeof document === 'undefined') return;
    var slot = document.getElementById('ag-studio-composer-bottom');
    if (slot) {
      slot.style.display = 'none';
    }
  }

  function ensureHomeCardSlot() {
    if (typeof document === 'undefined') return null;
    var homeInfo = detectHomeState();
    if (!homeInfo.isHome) {
      parkHomeCardSlot();
      return null;
    }

    var slot = document.getElementById('ag-studio-home-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'ag-studio-home-slot';
      slot.setAttribute('data-ag-studio-ignore', 'true');
      slot.setAttribute('data-ag-no-i18n', 'true');
      slot.style.cssText = 'width:100%;max-width:740px;margin:14px auto 8px auto;padding:0 12px;box-sizing:border-box;z-index:20;';
    }

    // Prefer placing right below the home composer box (or bottom HUD slot if present inside home)
    var comp = findComposerTarget();
    var anchorAfter = null;
    var parent = null;
    if (comp && comp.isHome) {
      var bottomSlot = document.getElementById('ag-studio-composer-bottom');
      if (bottomSlot && bottomSlot.parentElement && bottomSlot.closest('.agy-home')) {
        anchorAfter = bottomSlot;
        parent = bottomSlot.parentElement;
      } else if (comp.inputBox && comp.inputBox.parentElement) {
        anchorAfter = comp.inputBox;
        parent = comp.inputBox.parentElement;
      }
    }
    if (!parent && homeInfo.greetingEl && homeInfo.greetingEl.parentElement) {
      anchorAfter = homeInfo.greetingEl;
      parent = homeInfo.greetingEl.parentElement;
    }
    if (!parent && homeInfo.homeRoot) {
      parent = homeInfo.homeRoot;
    }
    if (!parent) return null;

    if (anchorAfter) {
      if (slot.parentElement !== parent || slot.previousElementSibling !== anchorAfter) {
        if (anchorAfter.nextSibling) parent.insertBefore(slot, anchorAfter.nextSibling);
        else parent.appendChild(slot);
      }
    } else if (slot.parentElement !== parent) {
      parent.appendChild(slot);
    }

    slot.style.display = 'block';
    return slot;
  }

  function parkHomeCardSlot() {
    if (typeof document === 'undefined') return;
    var slot = document.getElementById('ag-studio-home-slot');
    if (slot && slot.parentElement) {
      slot.style.display = 'none';
    }
  }

  function sniffDomTurnState() {
    if (typeof document === 'undefined') {
      return {
        conversationId: null,
        isHome: false,
        isGenerating: false,
        isThinking: false,
        isToolWorking: false,
        hasSubagent: false,
        awaitingDecision: false,
        hasError: false,
        isModelMenuOpen: false,
        modelLabel: ''
      };
    }

    var homeInfo = detectHomeState();
    var cid = homeInfo.isHome ? null : extractConversationId();

    var isGenerating = false;
    var runNodes = document.querySelectorAll(RUNNING_SEL);
    for (var i = 0; i < runNodes.length; i++) {
      var rn = runNodes[i];
      if (rn.closest && rn.closest(SUBAGENT_SEL)) continue;
      if (isVisible(rn)) { isGenerating = true; break; }
    }

    var isThinking = false;
    var thinkNodes = document.querySelectorAll('[data-testid="thinking-collapsible-trigger"]');
    for (var j = 0; j < thinkNodes.length; j++) {
      var tn = thinkNodes[j];
      if (tn.closest && tn.closest(SUBAGENT_SEL)) continue;
      if (tn.getAttribute('data-op-thought-state') === 'streaming') {
        isThinking = true;
        break;
      }
      if (isGenerating && j === thinkNodes.length - 1) {
        var txt = String(tn.textContent || '').trim();
        if (/(?:\.\.\.|…)\s*$|思考中|正在思考/.test(txt)) {
          isThinking = true;
          break;
        }
      }
    }

    var isToolWorking = false;
    if (isGenerating) {
      var toolNodes = document.querySelectorAll(
        '[data-testid="tool-group-collapsible"], [data-testid="running-items-panel"], [data-testid="background-task-command"]'
      );
      for (var k = 0; k < toolNodes.length; k++) {
        var tool = toolNodes[k];
        if (tool.closest && tool.closest(SUBAGENT_SEL)) continue;
        if (tool.getAttribute('data-testid') === 'running-items-panel') {
          if (String(tool.className || '').indexOf('grid-rows-[1fr]') !== -1 && isVisible(tool)) {
            isToolWorking = true;
            break;
          }
        } else if (isVisible(tool)) {
          isToolWorking = true;
          break;
        }
      }
    }

    var hasSubagent = false;
    var subNodes = document.querySelectorAll(SUBAGENT_SEL + ', [data-testid="subagent-node"]');
    for (var s = 0; s < subNodes.length; s++) {
      if (isVisible(subNodes[s])) { hasSubagent = true; break; }
    }

    var awaitingDecision = false;
    var decNodes = document.querySelectorAll(DECISION_SEL);
    for (var d = 0; d < decNodes.length; d++) {
      var dn = decNodes[d];
      if (dn.closest && dn.closest(SUBAGENT_SEL)) continue;
      if (isVisible(dn)) { awaitingDecision = true; break; }
    }

    var hasError = false;
    var errNodes = document.querySelectorAll(ERROR_SEL);
    for (var e = 0; e < errNodes.length; e++) {
      var en = errNodes[e];
      if (en.closest && en.closest(SUBAGENT_SEL)) continue;
      if (isVisible(en)) { hasError = true; break; }
    }

    var modelTrig = document.querySelector('[data-testid="model-selector-trigger"]');
    var modelLabel = modelTrig ? String(modelTrig.getAttribute('aria-label') || modelTrig.textContent || '').trim() : '';
    var modelPanel = document.querySelector('[data-testid="model-selector-panel"]');
    var isModelMenuOpen = Boolean(modelPanel && isVisible(modelPanel));

    return {
      conversationId: cid,
      isHome: homeInfo.isHome,
      isGenerating: isGenerating,
      isThinking: isThinking,
      isToolWorking: isToolWorking,
      hasSubagent: hasSubagent,
      awaitingDecision: awaitingDecision,
      hasError: hasError,
      isModelMenuOpen: isModelMenuOpen,
      modelLabel: modelLabel
    };
  }

  function fuseTurnState(opts) {
    var o = opts || {};
    var dom = o.dom || {};
    var backend = o.backend || {};
    var now = o.now || Date.now();
    var lastInteractionAt = o.lastInteractionAt || now;
    var lastTypingAt = o.lastTypingAt || 0;
    var sleepTimeoutMs = Number(o.sleepTimeoutMs || 300000);
    var happyUntil = o.happyUntil || 0;

    var hasError = Boolean(dom.hasError || backend.hasError || backend.status === 'error' || backend.status === 'failed');
    var awaitingDecision = Boolean(dom.awaitingDecision || backend.awaitingApproval || backend.state === 'waiting');
    var hasSubagent = Boolean(
      (dom.isGenerating && dom.hasSubagent) ||
      backend.hasRunningSubagents ||
      backend.state === 'subagent'
    );
    var isGenerating = Boolean(dom.isGenerating || backend.isGenerating || backend.state === 'thinking' || backend.state === 'working');
    var isToolWorking = Boolean(dom.isToolWorking || backend.isToolWorking || backend.state === 'working');
    var isThinking = Boolean(dom.isThinking || backend.isThinking || backend.state === 'thinking');
    var isTyping = Boolean(now - lastTypingAt < 1800);

    var mascotState = 'idle';
    if (hasError) mascotState = 'error';
    else if (awaitingDecision) mascotState = 'waiting';
    else if (hasSubagent) mascotState = 'subagent';
    else if (isToolWorking) mascotState = 'working';
    else if (isThinking || isGenerating) mascotState = 'thinking';
    else if (happyUntil > now) mascotState = 'happy';
    else if (isTyping) mascotState = 'typing';
    else if (now - lastInteractionAt > sleepTimeoutMs) mascotState = 'sleeping';

    var auraPhase = 'none';
    if (hasError) auraPhase = 'error';
    else if (awaitingDecision) auraPhase = 'waiting';
    else if (isGenerating || isThinking || isToolWorking || hasSubagent) auraPhase = 'running';
    else if (o.backgroundCompleted) auraPhase = 'complete';

    return {
      mascotState: mascotState,
      auraPhase: auraPhase,
      isGenerating: isGenerating,
      awaitingDecision: awaitingDecision,
      hasError: hasError
    };
  }

  function watchAnchors(onChange) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return function () {};
    }
    var timer = 0;
    var raf = 0;
    var disposed = false;

    function trigger(reason) {
      if (disposed) return;
      if (raf) return;
      var fire = function () {
        raf = 0;
        if (!disposed && typeof onChange === 'function') {
          try { onChange(reason || 'mutation'); } catch (_e) {}
        }
      };
      if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(fire);
      else {
        if (timer) clearTimeout(timer);
        timer = setTimeout(fire, 32);
      }
    }

    var obs = null;
    if (typeof MutationObserver === 'function') {
      obs = new MutationObserver(function (mutations) {
        if (disposed) return;
        var relevant = false;
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (isOwnNode(m.target)) continue;
          if (m.type === 'childList') {
            var allOwn = true;
            var added = m.addedNodes || [];
            var removed = m.removedNodes || [];
            for (var a = 0; a < added.length; a++) {
              if (!isOwnNode(added[a])) { allOwn = false; break; }
            }
            if (allOwn) {
              for (var r = 0; r < removed.length; r++) {
                if (!isOwnNode(removed[r])) { allOwn = false; break; }
              }
            }
            if (!allOwn) { relevant = true; break; }
          } else {
            relevant = true;
            break;
          }
        }
        if (relevant) trigger('dom');
      });
      if (document.body || document.documentElement) {
        obs.observe(document.body || document.documentElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['data-cascade-id', 'data-op-thought-state', 'hidden', 'class', 'aria-expanded']
        });
      }
    }

    var onPop = function () { trigger('route'); };
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);

    var origPush = window.history && window.history.pushState;
    var origReplace = window.history && window.history.replaceState;
    if (typeof origPush === 'function') {
      window.history.pushState = function () {
        var r = origPush.apply(this, arguments);
        trigger('pushState');
        return r;
      };
    }
    if (typeof origReplace === 'function') {
      window.history.replaceState = function () {
        var r = origReplace.apply(this, arguments);
        trigger('replaceState');
        return r;
      };
    }

    return function dispose() {
      disposed = true;
      if (obs) try { obs.disconnect(); } catch (_e) {}
      if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
      if (origPush && window.history) window.history.pushState = origPush;
      if (origReplace && window.history) window.history.replaceState = origReplace;
    };
  }

  var api = {
    extractConversationId: extractConversationId,
    detectHomeState: detectHomeState,
    findComposerTarget: findComposerTarget,
    ensureComposerTopAnchor: ensureComposerTopAnchor,
    ensureComposerBottomSlot: ensureComposerBottomSlot,
    parkComposerBottomSlot: parkComposerBottomSlot,
    ensureHomeCardSlot: ensureHomeCardSlot,
    parkHomeCardSlot: parkHomeCardSlot,
    sniffDomTurnState: sniffDomTurnState,
    fuseTurnState: fuseTurnState,
    watchAnchors: watchAnchors
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_ANCHORS__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
