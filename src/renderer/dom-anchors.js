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
      (el.hasAttribute && el.hasAttribute('data-ag-studio-ignore')) ||
      el.closest('#ag-studio-root, [data-ag-studio-ignore]')
    );
  }

  function isVisible(el) {
    if (!el || el.isConnected === false || el.hidden) return false;
    if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return false;
    if (el.style && (el.style.display === 'none' || el.style.visibility === 'hidden')) return false;
    var cls = typeof el.className === 'string' ? el.className : '';
    if (cls && /(?:^|\s)(?:hidden|sr-only)(?:\s|$)/.test(cls)) return false;
    if (typeof el.getClientRects === 'function') {
      try {
        var rects = el.getClientRects();
        if (!rects || rects.length === 0) return false;
        return rects[0].width > 1 || rects[0].height > 1;
      } catch (_e) {}
    }
    return el.offsetParent !== null;
  }

  function getCurrentFiber(el) {
    if (!el || typeof el !== 'object') return null;
    try {
      var keys = Object.keys(el);
      var raw = null;
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('__reactFiber$') === 0 || keys[i].indexOf('__reactInternalInstance$') === 0) {
          raw = el[keys[i]];
          break;
        }
      }
      if (!raw) return null;
      if (raw.alternate) {
        var root = raw;
        for (var g = 0; root.return && g < 600; g++) root = root.return;
        if (root && root.stateNode && root.stateNode.current && root.stateNode.current !== root) {
          return raw.alternate;
        }
      }
      return raw;
    } catch (_e) {
      return null;
    }
  }

  function extractConvoIdFromStore(store) {
    if (!store || typeof store.getState !== 'function') return '';
    try {
      var st = store.getState();
      var cs = st && st.conversation && st.conversation.convoState;
      if (!cs) return '';
      if (cs.type === 'active' && typeof cs.cascadeId === 'string' && UUID_RE.test(cs.cascadeId)) {
        return cs.cascadeId.match(UUID_RE)[1];
      }
      if (cs.type === 'subagent') {
        var subId = cs.childConversationId || cs.parentConversationId;
        if (typeof subId === 'string' && UUID_RE.test(subId)) {
          return subId.match(UUID_RE)[1];
        }
      }
    } catch (_e) {}
    return '';
  }

  function readFiberCascadeId(el, maxDepth) {
    if (!el) return '';
    try {
      var f = getCurrentFiber(el);
      var depth = 0;
      var limit = maxDepth || 260;
      while (f && depth < limit) {
        var props = f.memoizedProps || f.pendingProps;
        if (props && typeof props.cascadeId === 'string' && UUID_RE.test(props.cascadeId)) {
          return props.cascadeId.match(UUID_RE)[1];
        }
        var cidProps = extractConvoIdFromStore(props && props.store);
        if (cidProps) return cidProps;
        var dep = f.dependencies && f.dependencies.firstContext;
        while (dep) {
          var mv = dep.memoizedValue;
          var cidCtx = extractConvoIdFromStore(mv && mv.store);
          if (cidCtx) return cidCtx;
          dep = dep.next;
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
      CONV_VIEW_SEL + ', ' + INPUT_BOX_SEL + ', #root, [data-testid="conversation-row-sidebar"], [data-testid="home-greeting"]'
    );
    var visible = [];
    var hidden = [];
    for (var i = 0; i < anchors.length; i++) {
      var node = anchors[i];
      if (!node || isOwnNode(node)) continue;
      if (isVisible(node)) visible.push(node);
      else hidden.push(node);
    }
    var ordered = visible.concat(hidden);
    for (var j = 0; j < ordered.length; j++) {
      var hit = readFiberCascadeId(ordered[j], 300);
      if (hit) return hit;
    }
    return '';
  }

  function findFormalConvView() {
    if (typeof document === 'undefined') return null;
    var views = document.querySelectorAll(CONV_VIEW_SEL);
    var visibleCandidates = [];
    var hiddenCandidates = [];
    for (var i = 0; i < views.length; i++) {
      var cv = views[i];
      if (isOwnNode(cv)) continue;
      if (cv.closest && cv.closest(SUBAGENT_SEL)) continue;
      if (cv.closest && cv.closest('.agy-home')) continue;
      if (cv.querySelector && cv.querySelector('.agy-home')) continue;
      if (isVisible(cv)) visibleCandidates.push(cv);
      else hiddenCandidates.push(cv);
    }
    for (var v = 0; v < visibleCandidates.length; v++) {
      var vAttr = visibleCandidates[v].getAttribute && visibleCandidates[v].getAttribute('data-cascade-id');
      if (vAttr && UUID_RE.test(vAttr)) return visibleCandidates[v];
    }
    if (visibleCandidates.length) return visibleCandidates[0];
    for (var h = 0; h < hiddenCandidates.length; h++) {
      var hAttr = hiddenCandidates[h].getAttribute && hiddenCandidates[h].getAttribute('data-cascade-id');
      if (hAttr && UUID_RE.test(hAttr)) return hiddenCandidates[h];
    }
    return hiddenCandidates.length ? hiddenCandidates[0] : null;
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
        var fibId = readFiberCascadeId(cv, 260);
        if (fibId) return fibId;
      }
      var comp = findComposerTarget();
      if (comp && comp.inputBox && !comp.isHome) {
        var inpFib = readFiberCascadeId(comp.inputBox, 260);
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

        var activeRows = document.querySelectorAll(
          '[data-testid="conversation-row-sidebar"][aria-current="page"], [data-testid="conversation-row-sidebar"][data-active="true"], [data-testid="conversation-row-sidebar"][data-selected="true"]'
        );
        for (var r = 0; r < activeRows.length; r++) {
          var row = activeRows[r];
          if (!row || isOwnNode(row)) continue;
          var rAttr = row.getAttribute && row.getAttribute('data-cascade-id');
          if (rAttr && UUID_RE.test(rAttr)) return rAttr.match(UUID_RE)[1];
          var rFib = readFiberCascadeId(row, 40);
          if (rFib) return rFib;
        }
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

  var cachedComposer = null;

  function findComposerTarget() {
    if (typeof document === 'undefined') return null;

    if (cachedComposer && cachedComposer.card && cachedComposer.card.isConnected && isVisible(cachedComposer.card)) {
      return cachedComposer;
    }
    cachedComposer = null;

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
      cachedComposer = {
        card: chosenCard,
        inputBox: ib,
        editable: ed || null,
        isHome: Boolean(chosenCard.closest('.agy-home')),
        isSubagent: false
      };
      return cachedComposer;
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
      cachedComposer = {
        card: card2,
        inputBox: box,
        editable: ed2 || null,
        isHome: Boolean(box.closest('.agy-home')),
        isSubagent: false
      };
      return cachedComposer;
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
        cachedComposer = {
          card: outer,
          inputBox: outer,
          editable: inp,
          isHome: Boolean(outer.closest('.agy-home')),
          isSubagent: false
        };
        return cachedComposer;
      }
    }

    return null;
  }

  function findModelTriggerInComposer(composer) {
    if (typeof document === 'undefined' || !composer) return null;
    var roots = [composer.card, composer.inputBox].filter(Boolean);
    for (var r = 0; r < roots.length; r++) {
      var trig = roots[r].querySelector('[data-testid="model-selector-trigger"]');
      if (trig && isVisible(trig) && !isOwnNode(trig)) return trig;
    }
    // Fallback: look for model selector button inside composer toolbar
    for (var r2 = 0; r2 < roots.length; r2++) {
      var btns = roots[r2].querySelectorAll('button');
      for (var b = 0; b < btns.length; b++) {
        var btn = btns[b];
        if (isOwnNode(btn) || !isVisible(btn)) continue;
        var txt = String(btn.getAttribute('aria-label') || btn.textContent || '');
        if (/\b(?:gemini|claude|gpt|sonnet|opus|flash|neon|hydrogen|model)\b/i.test(txt)) {
          return btn;
        }
      }
    }
    return null;
  }

  function ensureComposerToolbarSlot(composer) {
    if (typeof document === 'undefined' || !composer) return null;
    var trig = findModelTriggerInComposer(composer);
    if (!trig || !trig.parentElement) return null;

    var slot = document.getElementById('ag-studio-composer-toolbar-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.id = 'ag-studio-composer-toolbar-slot';
      slot.setAttribute('data-ag-studio-ignore', 'true');
      slot.setAttribute('data-ag-no-i18n', 'true');
      slot.style.cssText = 'display:inline-flex;align-items:center;gap:4px;margin-left:6px;flex-shrink:0;vertical-align:middle;pointer-events:auto;';
    }

    // Walk up from trig to find the horizontal toolbar flex row (not a column wrapper)
    var targetParent = trig.parentElement;
    var insertAfter = trig;
    var cur = trig;
    for (var depth = 0; depth < 4 && cur && cur.parentElement && cur.parentElement !== composer.card; depth++) {
      var p = cur.parentElement;
      try {
        var cs = typeof getComputedStyle === 'function' ? getComputedStyle(p) : null;
        if (cs && (cs.display === 'flex' || cs.display === 'inline-flex') && cs.flexDirection !== 'column') {
          targetParent = p;
          insertAfter = cur;
          if (p.children && p.children.length >= 2) break;
        }
      } catch (_e) {}
      cur = p;
    }

    // Ensure targetParent itself lays out horizontally without wrapping the HUD below the model trigger
    try {
      var pcs = typeof getComputedStyle === 'function' ? getComputedStyle(targetParent) : null;
      if (pcs && pcs.flexDirection === 'column') {
        targetParent.style.flexDirection = 'row';
        targetParent.style.alignItems = 'center';
        targetParent.style.flexWrap = 'nowrap';
      } else if (pcs && pcs.display === 'block') {
        targetParent.style.display = 'inline-flex';
        targetParent.style.alignItems = 'center';
        targetParent.style.flexWrap = 'nowrap';
      }
    } catch (_e2) {}

    if (slot.parentElement !== targetParent || slot.previousElementSibling !== insertAfter) {
      if (insertAfter.nextSibling) {
        targetParent.insertBefore(slot, insertAfter.nextSibling);
      } else {
        targetParent.appendChild(slot);
      }
    }
    slot.style.display = 'inline-flex';
    return slot;
  }

  function parkComposerToolbarSlot() {
    if (typeof document === 'undefined') return;
    var slot = document.getElementById('ag-studio-composer-toolbar-slot');
    if (slot) slot.style.display = 'none';
  }

  function ensureComposerTopAnchor(composer) {
    if (!composer) return null;
    var anchor = null;
    if (composer.inputBox && composer.inputBox.isConnected !== false) {
      anchor = composer.inputBox;
    } else if (composer.card && composer.card.isConnected !== false) {
      anchor = (composer.card.closest && composer.card.closest('.surface-composer')) || composer.card;
    }
    if (!anchor || anchor.isConnected === false) return null;
    try {
      var pos = typeof getComputedStyle === 'function' ? getComputedStyle(anchor).position : '';
      if (!pos || pos === 'static') {
        anchor.style.position = 'relative';
      }
      anchor.setAttribute('data-ags-mascot-anchor', '1');
    } catch (_e) {}
    return anchor;
  }

  function rectsOverlap(a, b) {
    return Boolean(
      a && b &&
      a.left + 2 < b.right &&
      a.right - 2 > b.left &&
      a.top + 2 < b.bottom &&
      a.bottom - 2 > b.top
    );
  }

  function computeComposerTopInset(anchorEl) {
    if (!anchorEl || typeof anchorEl.getBoundingClientRect !== 'function') return 0;
    var anchorRect;
    try {
      anchorRect = anchorEl.getBoundingClientRect();
    } catch (_e) {
      return 0;
    }
    if (!anchorRect || anchorRect.height <= 0) return 0;

    var minTop = Infinity;
    var children = anchorEl.children || [];
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (!child || isOwnNode(child) || !isVisible(child)) continue;
      if (typeof getComputedStyle === 'function') {
        try {
          var cs = getComputedStyle(child);
          if (cs && (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') <= 0.05)) {
            continue;
          }
        } catch (_e2) {}
      }
      var cr;
      try {
        cr = typeof child.getBoundingClientRect === 'function' ? child.getBoundingClientRect() : null;
      } catch (_e3) {
        cr = null;
      }
      if (!cr || cr.height < 8 || cr.width < 40) continue;
      if (cr.top < minTop) minTop = cr.top;
    }
    return minTop < Infinity ? Math.max(0, Math.round(minTop - anchorRect.top)) : 0;
  }

  function detectMascotObstruction(stageEl, anchorEl) {
    if (!stageEl || typeof document === 'undefined') return false;
    var hitEl = (stageEl.querySelector && stageEl.querySelector('.ags-mascot-hit')) || stageEl;
    if (!hitEl || typeof hitEl.getBoundingClientRect !== 'function') return false;
    var hitRect;
    try {
      hitRect = hitEl.getBoundingClientRect();
    } catch (_e) {
      return false;
    }
    if (!hitRect || hitRect.width <= 1 || hitRect.height <= 1) return false;

    var overlaySel = '[data-testid="queued-messages-card"], [data-testid="interaction-takeover-card"], [data-testid="side-question-panel"], [data-testid="model-selector-panel"]';
    var overlays = document.querySelectorAll(overlaySel);
    for (var i = 0; i < overlays.length; i++) {
      var el = overlays[i];
      if (!el || isOwnNode(el) || !isVisible(el)) continue;
      var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      if (r && rectsOverlap(hitRect, r)) return true;
    }

    var prevSib = anchorEl && anchorEl.previousElementSibling;
    if (prevSib && !isOwnNode(prevSib) && prevSib.querySelectorAll) {
      var btns = prevSib.querySelectorAll('button, [role="button"], a');
      for (var j = 0; j < btns.length; j++) {
        var b = btns[j];
        if (!b || isOwnNode(b) || !isVisible(b)) continue;
        var r2 = b.getBoundingClientRect ? b.getBoundingClientRect() : null;
        if (r2 && rectsOverlap(hitRect, r2)) return true;
      }
    }
    return false;
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
      slot.style.cssText = 'width:100%;max-width:660px;margin:14px auto 14px auto;padding:0 12px;box-sizing:border-box;z-index:20;';
    }

    // Target placement: right BELOW the Antigravity icon + greeting, and ABOVE the 3 suggestion rows & composer
    var comp = findComposerTarget();
    var compEl = comp && comp.isHome ? (comp.inputBox || comp.card) : null;
    var homeColumn = compEl ? compEl.parentElement : null;

    var anchorAfter = null;
    var anchorBefore = null;
    var parent = null;

    if (homeInfo.greetingEl && homeColumn) {
      // Walk up from greetingEl to find the direct child of homeColumn (or shared column)
      var gNode = homeInfo.greetingEl;
      while (gNode && gNode.parentElement && gNode.parentElement !== homeColumn && gNode.parentElement !== document.body) {
        gNode = gNode.parentElement;
      }
      if (gNode && gNode.parentElement === homeColumn) {
        parent = homeColumn;
        anchorAfter = gNode;
      }
    }

    if (!parent && homeInfo.greetingEl && homeInfo.greetingEl.parentElement) {
      parent = homeInfo.greetingEl.parentElement;
      anchorAfter = homeInfo.greetingEl;
    }

    // Fallback: if greeting not matched, place above the first non-slot child before composer (suggestions block) or above composer
    if (!parent && homeColumn) {
      parent = homeColumn;
      anchorBefore = compEl;
      var kids = homeColumn.children || [];
      for (var k = 0; k < kids.length; k++) {
        var kid = kids[k];
        if (kid === slot || kid === compEl) continue;
        if (kid.querySelector && kid.querySelector('h1, h2, svg, img')) {
          anchorAfter = kid;
          anchorBefore = null;
          break;
        }
      }
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
    } else if (anchorBefore) {
      if (slot.parentElement !== parent || slot.nextElementSibling !== anchorBefore) {
        parent.insertBefore(slot, anchorBefore);
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

    var modelTrigs = document.querySelectorAll('[data-testid="model-selector-trigger"]');
    var modelTrig = null;
    for (var mt = 0; mt < modelTrigs.length; mt++) {
      if (isVisible(modelTrigs[mt]) && !isOwnNode(modelTrigs[mt])) {
        modelTrig = modelTrigs[mt];
        break;
      }
    }
    if (!modelTrig && modelTrigs.length) modelTrig = modelTrigs[0];
    var modelLabel = modelTrig ? String(modelTrig.textContent || modelTrig.getAttribute('aria-label') || '').trim() : '';
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
    var disposed = false;

    function trigger(reason) {
      if (disposed) return;
      var delay = (reason === 'route' || reason === 'pushState' || reason === 'replaceState') ? 32 : 160;
      if (timer) {
        if (delay > 32) return;
        clearTimeout(timer);
      }
      timer = setTimeout(function () {
        timer = 0;
        if (!disposed && typeof onChange === 'function') {
          try { onChange(reason || 'mutation'); } catch (_e) {}
        }
      }, delay);
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
          attributeFilter: ['data-cascade-id', 'data-op-thought-state', 'hidden', 'aria-expanded']
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
    findModelTriggerInComposer: findModelTriggerInComposer,
    ensureComposerTopAnchor: ensureComposerTopAnchor,
    computeComposerTopInset: computeComposerTopInset,
    detectMascotObstruction: detectMascotObstruction,
    ensureComposerToolbarSlot: ensureComposerToolbarSlot,
    parkComposerToolbarSlot: parkComposerToolbarSlot,
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
