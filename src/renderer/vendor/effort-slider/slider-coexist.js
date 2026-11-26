(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    try { root.__agPrismEffortSlider?.destroy?.(); } catch {}
    if (typeof window !== 'undefined' && window !== root) {
      try { window.__agPrismEffortSlider?.destroy?.(); } catch {}
    }
    const api = factory(root);
    root.__agPrismEffortSlider = api;
    if (typeof window !== 'undefined') window.__agPrismEffortSlider = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function (globalRoot) {
  'use strict';

  const SLIDER_STYLE_ID = 'ag-codex-effort-slider-styles';
  const HIDE_STYLE_ID = 'ag-prism-effort-slider-hide';
  const PRISM_OWNER_ATTR = 'data-ag-prism-slider';
  const THROTTLE_MS = 120;
  const MENU_THROTTLE_MS = 32;

  const ga = (e, k) => e?.getAttribute?.(k), sa = (e, k, v) => e?.setAttribute?.(k, v), ra = (e, k) => e?.removeAttribute?.(k);
  const qs = (e, s) => e?.querySelector?.(s), qa = (e, s) => e?.querySelectorAll?.(s) || [];

  function resLib(win) {
    if (win?.AntigravityCodexEffortSlider) return win.AntigravityCodexEffortSlider;
    if (globalRoot?.AntigravityCodexEffortSlider) return globalRoot.AntigravityCodexEffortSlider;
    if (typeof require === 'function') {
      try {
        globalRoot.__agCodexEffortSliderDisableAutoBoot = true;
        if (win) win.__agCodexEffortSliderDisableAutoBoot = true;
        return require('./upstream-client.js');
      } catch {}
    }
    return null;
  }

  const isMenu = (doc) => !!qs(doc, '[data-testid="model-selector-panel"], .ces-menu-section, [data-ces-effort-row="true"], [role="dialog"] [data-ces-settings]');

  const HC_A = 'data-hover-card-popup';
  const SB_SEL = 'aside,[data-testid="sidebar-split"]>div:first-child,[data-testid="conversation-row-sidebar"],[data-testid="project-header"],[data-hover-card-popup]';
  const IGNORED_CHAT_SEL =
    '#ag-studio-root,[data-ag-studio-ignore],[data-testid="autoscroll-viewport"],[data-testid="planner-response-text"],[data-testid="agent-response"],[data-markdown-root],[data-testid="user-message-bubble"],' + SB_SEL + ',[data-op-thought="1"],.ag-prism-thought-overlay,.ag-cs-crab,.ag-cs-conv-aura-host,#ag-pulse-status-bar,#ag-prism-pulse-bar,[data-ag-prism-pulse-bar="true"],.ag-cs-panel-row-glyph,.ces-ag-section,.ces-set,[data-ag-owned="1"],[data-testid="orchestrator-effort-bar"],.ag-cs-smooth-caret,.ag-anim-icon,[data-agy-hans-ui],#agy-theme-switcher,#agy-theme-menu,#antigravity-quota-widget,#antigravity-translation-audit';

  const EFF_MAP = Object.create(null);
  for (const g of 'xhigh:xhigh|extra|extra high|超高|极高|極高|特高|很高|超高思考;high:high|高|高思考|高推理|高强度|高強度;medium:medium|med|中|中等|中思考|中等思考|中推理;low:low|低|低思考|低推理;minimal:minimal|极低|極低|最小|最低|极简|極簡;max:max|最高|最大|极限|極限;off:off|关闭|關閉|关|關|无|無|不推理|none|disabled;auto:auto|自动|自動;adaptive:adaptive|自适应|自適應;thinking:thinking|深度思考|思考中|思考'.split(';')) {
    const [k, vs] = g.split(':');
    for (const v of vs.split('|')) EFF_MAP[v] = k;
  }
  const EFF_LABELS = { off: 'Off', minimal: 'Minimal', low: 'Low', medium: 'Medium', high: 'High', xhigh: 'Extra', max: 'Max', auto: 'Auto', adaptive: 'Adaptive', thinking: 'Thinking' };

  function normalizeEffortToken(raw) {
    const s = String(raw || '').trim().replace(/^[(\uff08]+|[)\uff09]+$/g, '').trim().replace(/\s+thinking$/i, '').toLowerCase();
    return EFF_MAP[s] || '';
  }

  function parseLocalizedModelLabel(raw) {
    const s = String(raw || '').trim().replace(/^(?:Select model|Current|选择模型|選擇模型)\s*[:：]\s*/i, '').trim();
    if (!s) return null;
    const m = /^(.*?)\s*[\(\uff08]([^()\uff08\uff09]+)[\)\uff09]\s*$/.exec(s);
    const eff = m ? normalizeEffortToken(m[2]) : '';
    if (!m || !eff) return { base: s, rawBase: s, effort: '', effortLabel: '', canonicalLabel: s, isThinking: false };
    const rawBase = m[1].trim(), isThinking = eff === 'thinking', effortLabel = EFF_LABELS[eff] || m[2].trim();
    return { base: isThinking ? `${rawBase} (Thinking)` : rawBase, rawBase, effort: eff, effortLabel, canonicalLabel: `${rawBase} (${effortLabel})`, isThinking };
  }

  function markOwnedNoTr(doc) {
    const fn = resLib(doc?.defaultView)?.markNoTranslate;
    for (const el of qa(doc, '.ces-ag-section,.ces-set,[data-testid="orchestrator-effort-bar"]')) {
      if (fn) {
        fn(el);
        for (const ch of qa(el, 'div,span')) if (String(ch.className || '').includes('ces-ag-effort-')) fn(ch);
      }
      sa(el, 'data-ag-studio-ignore', 'true');
      sa(el, 'data-ag-no-i18n', 'true');
    }
  }

  function syncBilingualDom(doc) {
    const p = qs(doc, '[data-testid="model-selector-panel"]');
    if (!p) return;
    for (const g of qa(p, '[data-testid="model-selector-effort-group"]')) {
      if (!ga(g, 'data-model-base')) {
        const pr = parseLocalizedModelLabel(g.textContent);
        if (pr?.rawBase && pr.effort && !pr.isThinking) sa(g, 'data-model-base', pr.rawBase);
      }
      const sib = g.nextElementSibling;
      if (sib?.tagName === 'SPAN') {
        const ek = normalizeEffortToken(sib.textContent);
        if (ek && EFF_LABELS[ek] && sib.textContent.trim() !== EFF_LABELS[ek]) sa(sib, 'data-ces-eff-key', ek);
      }
    }
    for (const it of qa(p, '[data-testid="model-selector-item"]')) {
      if (!ga(it, 'data-model-label')) {
        const pr = parseLocalizedModelLabel(it.textContent);
        if (pr?.effort) sa(it, 'data-model-label', pr.canonicalLabel);
      }
    }
  }

  function isIgnTarget(node) {
    const el = node?.nodeType === 1 ? node : node?.parentElement;
    if (!el || el.tagName === 'BODY' || el.tagName === 'HTML') return false;
    if (el.classList?.contains?.('ag-prism-thought-chunk') || el.classList?.contains?.('ag-prism-thought-overlay')) return true;
    const h = (n, k) => !!n?.hasAttribute?.(k), f = el.firstElementChild;
    if (h(el, HC_A) || h(f, HC_A) || h(f?.firstElementChild, HC_A) || (h(el, 'data-base-ui-portal') && !!qs(el, '[data-hover-card-popup]'))) return true;
    return !!el.closest?.(IGNORED_CHAT_SEL);
  }

  function isIgnRec(rec) {
    const t = rec?.target;
    if (!t) return false;
    if (isIgnTarget(t)) return true;
    const a = rec.addedNodes, r = rec.removedNodes, n = (a?.length || 0) + (r?.length || 0);
    if (!n) return false;
    for (const l of [a, r]) if (l) for (let i = 0; i < l.length; i++) if (!isIgnTarget(l[i])) return false;
    return true;
  }

  const allIgn = (recs) => Array.isArray(recs) && recs.length > 0 && recs.every(isIgnRec);

  const TR_SEL = '[data-testid="model-selector-trigger"],button[aria-label^="Select model"]';
  const SUB_TID = 'context-menu-submenu-popup';
  const SUB_SEL = `[data-testid="${SUB_TID}"]`;
  const MDL_SEL = `[data-testid="model-selector-panel"],${TR_SEL},${SUB_SEL},[role="menu"],[role="listbox"]`;
  function touchesModel(recs) {
    if (!Array.isArray(recs) || !recs.length) return true;
    for (const rec of recs) {
      if (isIgnRec(rec)) continue;
      const t = rec?.target, el = t && (t.nodeType === 1 ? t : t.parentElement);
      if (el?.getAttribute && ((ga(el, 'data-testid') || '').includes('model-selector') || el.closest?.(MDL_SEL))) return true;
      for (const n of rec?.addedNodes || []) {
        if (!n || n.nodeType !== 1 || isIgnTarget(n)) continue;
        const r = ga(n, 'role') || '', tid = ga(n, 'data-testid') || '';
        if (tid.includes('model-selector') || tid === SUB_TID || r === 'menu' || r === 'listbox' || r === 'dialog' || n.classList?.contains?.('agy-overlay') || ((n.tagName === 'DIV' || n.tagName === 'BUTTON') && qs(n, MDL_SEL))) return true;
      }
    }
    return false;
  }

  function mkThrottledMO(BaseMO, doc, stats) {
    if (typeof BaseMO !== 'function') return null;
    return function TMO(cb) {
      let tm = null, closeTm = null, lastAt = 0, q = [], disc = false, wasOpen = false, curTrig = null;
      const syncTrig = () => {
        if (disc) return;
        const tr = qs(doc, TR_SEL);
        if (!tr || tr === curTrig) return;
        curTrig = tr;
        try { inner.observe(tr, { characterData: true, subtree: true }); } catch {}
      };
      const flush = (fSync) => {
        tm = null;
        if (disc) return;
        const batch = q;
        q = [];
        const open = isMenu(doc), closed = wasOpen && !open;
        if (!(fSync || closed) && !touchesModel(batch)) {
          wasOpen = open;
          stats.skippedIrrelevant += 1;
          return;
        }
        wasOpen = open;
        lastAt = Date.now();
        stats.executedScans += 1;
        syncBilingualDom(doc);
        cb(batch, wrap);
        markOwnedNoTr(doc);
        syncTrig();
        if (closed) {
          if (closeTm !== null) clearTimeout(closeTm);
          closeTm = setTimeout(() => { closeTm = null; if (!disc) flush(true); }, 48);
          closeTm?.unref?.();
        }
      };
      const inner = new BaseMO((recs) => {
        if (disc) return;
        stats.rawMutations += 1;
        if (allIgn(recs)) { stats.skippedIrrelevant += 1; return; }
        const open = isMenu(doc), closed = wasOpen && !open;
        if (!closed && !touchesModel(recs)) { stats.skippedIrrelevant += 1; return; }
        if (Array.isArray(recs)) for (let i = 0; i < recs.length && q.length < 48; i++) q.push(recs[i]);
        const el = Date.now() - lastAt, wMs = open ? MENU_THROTTLE_MS : THROTTLE_MS;
        let subAdded = false;
        if (open && Array.isArray(recs)) {
          for (const rec of recs) {
            for (const nd of rec?.addedNodes || []) {
              const nr = nd?.nodeType === 1 ? ga(nd, 'role') : '';
              if (nd?.nodeType === 1 && (nr === 'menu' || nr === 'listbox' || ga(nd, 'data-testid') === SUB_TID || nd.classList?.contains('agy-overlay') || qs(nd, `[role="menu"],[role="listbox"],[role^="menuitem"],${SUB_SEL},.agy-overlay`))) {
                subAdded = true;
                break;
              }
            }
            if (subAdded) break;
          }
        }
        if (closed || subAdded || (open && !wasOpen) || (el >= wMs && tm === null)) {
          if (tm !== null) { clearTimeout(tm); tm = null; }
          flush(closed);
        } else if (tm === null) {
          tm = setTimeout(() => flush(false), Math.max(16, wMs - el));
          tm?.unref?.();
        }
      });
      const wrap = {
        observe(t, o) {
          disc = false;
          const r = inner.observe(t, t === doc?.body && o?.characterData ? { ...o, characterData: false } : o);
          syncTrig();
          return r;
        },
        disconnect() {
          disc = true;
          if (tm !== null) { clearTimeout(tm); tm = null; }
          if (closeTm !== null) { clearTimeout(closeTm); closeTm = null; }
          curTrig = null;
          q = [];
          return inner.disconnect();
        },
        takeRecords: () => (inner.takeRecords ? inner.takeRecords() : []),
      };
      return wrap;
    };
  }

  function createEffortSliderController(envOpts) {
    const gW = () => (envOpts && envOpts.window) || (typeof window !== 'undefined' ? window : globalRoot);
    const gD = () => (envOpts && envOpts.document) || gW()?.document || null;
    let mode = 'auto', rememberEffort = true, inst = null, memGuard = null, yielded = false;
    const perfStats = { rawMutations: 0, executedScans: 0, skippedIrrelevant: 0 };

    function hasExtInst() {
      const w = gW(), d = gD();
      if (!w) return false;
      if (w.__agCodexEffortSliderInstance && !w.__agCodexEffortSliderInstance.__prismOwned) return true;
      const st = d?.getElementById?.(SLIDER_STYLE_ID);
      return !!(st && st.getAttribute(PRISM_OWNER_ATTR) !== '1' && !inst);
    }

    const HIDE_CSS_TEXT =
      '.ces-ag-section,.ces-menu-section,[data-ces-effort-row="true"],.ces-set,.ces-settings-panel{display:none!important}' +
      '[data-testid="orchestrator-effort-bar"]{display:none!important}' +
      '[data-ces-part="trigger-effort"]{color:inherit!important;opacity:.7!important;font-weight:inherit!important}';

    function clrTint(doc) {
      if (!doc) return;
      for (const sp of qa(doc, '[data-ces-part="trigger-effort"], [data-testid="model-selector-trigger"] span[style]')) {
        if (sp.style) sp.style.color = sp.style.opacity = sp.style.fontWeight = '';
        ra(sp, 'data-ces-part');
      }
      for (const p of qa(doc, '.ces-ag-panel-enhanced')) p.classList?.remove?.('ces-ag-panel-enhanced');
      for (const attr of ['data-ces-model-selected', 'data-ag-cs-model-submenu', 'data-ag-cs-orch-l2', 'data-ag-cs-orch-l3', 'data-ces-orch-row', 'data-ces-orch-b', 'data-ces-orch-tunable']) {
        for (const it of qa(doc, `[${attr}]`)) ra(it, attr);
      }
      ra(doc.documentElement, 'data-ces-slider-ready');
    }

    function setHideCss(hidden) {
      const doc = gD();
      if (!doc || typeof doc.getElementById !== 'function') return;
      const ex = doc.getElementById(HIDE_STYLE_ID);
      if (!hidden) { ex?.remove?.(); return; }
      if (ex) { if (ex.textContent !== HIDE_CSS_TEXT) ex.textContent = HIDE_CSS_TEXT; return; }
      if (doc.head || doc.documentElement) {
        const st = doc.createElement('style');
        st.id = HIDE_STYLE_ID;
        st.textContent = HIDE_CSS_TEXT;
        (doc.head || doc.documentElement).appendChild(st);
      }
    }

    function stopInst() {
      const w = gW(), d = gD();
      if (inst) {
        try { inst.stop(); } catch {}
        if (w && w.__agCodexEffortSliderInstance === inst) delete w.__agCodexEffortSliderInstance;
        inst = null;
      }
      if (w && w.__agCodexEffortSliderInstance && w.__agCodexEffortSliderInstance.__prismOwned) {
        try { w.__agCodexEffortSliderInstance.stop?.(); } catch {}
        delete w.__agCodexEffortSliderInstance;
      }
      clrTint(d);
      const st = d?.getElementById?.(SLIDER_STYLE_ID);
      if (st && st.getAttribute(PRISM_OWNER_ATTR) === '1') st.remove();
    }

    function stopMemGuard() {
      if (memGuard) {
        try { memGuard.stop(); } catch {}
        memGuard = null;
      }
    }

    const getMO = (w) => w.MutationObserver || (typeof MutationObserver === 'function' ? MutationObserver : null);
    function mountMemGuard() {
      const w = gW(), d = gD(), lib = w && d?.body ? resLib(w) : null;
      if (!lib?.installEffortMemoryGuard) return false;
      stopMemGuard();
      memGuard = lib.installEffortMemoryGuard({
        document: d,
        window: w,
        MutationObserver: mkThrottledMO(getMO(w), d, perfStats) || undefined,
      });
      return !!memGuard;
    }

    function mountBuiltIn() {
      const w = gW(), d = gD(), lib = w && d?.body ? resLib(w) : null;
      if (!lib?.installCodexEffortSlider) return false;
      const next = lib.installCodexEffortSlider({
        document: d,
        window: w,
        MutationObserver: mkThrottledMO(getMO(w), d, perfStats) || undefined,
        skipGenericMenuObserver: true,
        rememberEffort,
      });
      if (!next) return false;
      next.__prismOwned = true;
      w.__agCodexEffortSliderInstance = prismSyncRef(next);
      d.getElementById?.(SLIDER_STYLE_ID)?.setAttribute(PRISM_OWNER_ATTR, '1');
      return true;
    }

    function prismSyncRef(v) {
      inst = v;
      return v;
    }

    function sync(cfg) {
      const raw = cfg && cfg.effortSliderModule;
      mode = raw === 'on' || raw === 'off' ? raw : 'auto';
      rememberEffort = !(cfg && (cfg.effortMemory === 'off' || cfg.effortMemory === false));
      if (mode === 'off') {
        yielded = false;
        stopInst();
        clrTint(gD());
        setHideCss(true);
        if (rememberEffort) {
          if (!memGuard) mountMemGuard();
          else try { memGuard.rescan?.(); } catch {}
        } else {
          stopMemGuard();
        }
        return getState();
      }
      setHideCss(false);
      if (mode === 'auto' && hasExtInst()) {
        yielded = true;
        stopInst();
        stopMemGuard();
        try { gW()?.__agCodexEffortSliderInstance?.rescan?.(); } catch {}
        return getState();
      }
      yielded = false;
      stopMemGuard();
      syncBilingualDom(gD());
      if (!inst || hasExtInst()) {
        if (inst) stopInst();
        mountBuiltIn();
      } else {
        try { inst.setRememberEffort?.(rememberEffort); } catch {}
        try { inst.rescan?.(); } catch {}
      }
      markOwnedNoTr(gD());
      return getState();
    }

    function destroy() {
      stopInst();
      stopMemGuard();
      setHideCss(false);
      yielded = false;
    }

    function getState() {
      return {
        mode,
        rememberEffort,
        mountedPrism: !!inst,
        memoryGuardActive: !!memGuard,
        yieldedToExternal: !!(yielded || (mode === 'auto' && hasExtInst())),
        hasExternal: hasExtInst(),
        throttleMs: THROTTLE_MS,
        perfStats: { ...perfStats },
      };
    }

    return {
      THROTTLE_MS,
      normalizeEffortToken,
      parseLocalizedModelLabel,
      syncBilingualDom,
      sync,
      destroy,
      getState,
      createEffortSliderController,
    };
  }

  return createEffortSliderController();
});
