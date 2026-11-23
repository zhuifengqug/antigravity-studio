(function (globalScope) {
  'use strict';

  var EFFORT_LEVELS = [
    { id: 'off', labelEn: 'Off', keywords: ['off', 'none', 'disabled'] },
    { id: 'minimal', labelEn: 'Minimal', keywords: ['minimal', 'min'] },
    { id: 'low', labelEn: 'Low', keywords: ['low', 'lite'] },
    { id: 'medium', labelEn: 'Medium', keywords: ['medium', 'med'] },
    { id: 'high', labelEn: 'High', keywords: ['high', 'thinking'] },
    { id: 'xhigh', labelEn: 'Extra High', keywords: ['xhigh', 'x-high', 'extra high', 'extra'] },
    { id: 'max', labelEn: 'Max', keywords: ['max', 'ultra'] }
  ];

  var EFFORT_RANK = { off: 0, minimal: 1, low: 2, medium: 3, high: 4, xhigh: 5, max: 6 };
  var EFFORT_DISPLAY_LABEL = {
    off: 'Off',
    minimal: 'Minimal',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    xhigh: 'Extra High',
    max: 'Max'
  };

  function ensureEffortStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ag-studio-effort-style')) return;
    var s = document.createElement('style');
    s.id = 'ag-studio-effort-style';
    s.textContent = [
      '.ags-effort-bar { position:fixed; z-index:2147483550; padding:7px 10px; border-radius:10px; border:1px solid var(--ags-border, rgba(148,163,184,.25)); background:var(--ags-bg-surface, #18181b); box-shadow:0 8px 24px rgba(0,0,0,.22); font-family:var(--ags-font-ui, system-ui, sans-serif); display:flex; flex-direction:column; gap:6px; box-sizing:border-box; -webkit-app-region:no-drag; app-region:no-drag; }',
      '.ags-effort-bar * { -webkit-app-region:no-drag; app-region:no-drag; }',
      '.ags-effort-head { display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:11.5px; }',
      '.ags-effort-title { color:var(--ags-text-secondary, #94a3b8); font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
      '.ags-effort-val { color:var(--ags-accent, #D97757); font-weight:600; flex-shrink:0; }',
      '.ags-effort-steps { position:relative; display:grid; grid-auto-flow:column; grid-auto-columns:1fr; gap:4px; padding:2px; border-radius:8px; background:var(--ags-bg-canvas, rgba(24,24,27,.6)); border:1px solid var(--ags-border, rgba(148,163,184,.16)); }',
      '.ags-effort-btn { border:none; background:transparent; color:var(--ags-text-secondary, #94a3b8); font-size:11px; font-weight:500; padding:4px 4px; border-radius:6px; cursor:pointer; white-space:nowrap; transition:color 100ms ease, background-color 100ms ease; }',
      '.ags-effort-btn:hover { color:var(--ags-text-primary, #f4f4f5); }',
      '.ags-effort-btn.active { background:var(--ags-accent-soft, rgba(217,119,87,.16)); color:var(--ags-accent, #D97757); font-weight:600; }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function detectEffortFromText(text) {
    var low = String(text || '').toLowerCase();
    if (/(?:\bxhigh\b|\bx-high\b|extra[\s-]*high|\bextra\b|极高|超高)/i.test(low)) return 'xhigh';
    if (/(?:\bmax\b|最大)/i.test(low)) return 'max';
    if (/(?:\bhigh\b|\bthinking\b|深度思考|\(\s*高\s*\)|（\s*高\s*）|\s高$)/i.test(low)) return 'high';
    if (/(?:\bmedium\b|\bmed\b|\(\s*中\s*\)|（\s*中\s*）|\s中$)/i.test(low)) return 'medium';
    if (/(?:\bminimal\b|\bmin\b|极简)/i.test(low)) return 'minimal';
    if (/(?:\blow\b|\blite\b|\(\s*低\s*\)|（\s*低\s*）|\s低$)/i.test(low)) return 'low';
    if (/(?:\boff\b|\bnone\b|\(\s*关\s*\))/i.test(low)) return 'off';
    return 'medium';
  }

  function extractModelFamily(text) {
    return String(text || '')
      .replace(/\b(?:new|notice|beta|preview|recommended|default)\b|默认|自动/gi, ' ')
      .replace(/[（(][^（）()]*[）)]/g, ' ')
      .replace(/\b(?:orchestrator|编排)\b/gi, ' ')
      .replace(/\b(?:off|none|minimal|min|low|medium|med|high|xhigh|x-high|extra\s+high|extra|thinking|max)\b/gi, ' ')
      .replace(/[^a-z0-9.\u4e00-\u9fa5]+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function parseModelLabel(label) {
    var s = String(label || '').trim();
    if (!s) return null;
    var mParen = s.match(/^(.*?)\s*[（(](off|minimal|min|low|lite|medium|med|high|xhigh|x-high|extra(?:\s+high)?|max)(?:\s+thinking)?[）)]\s*$/i);
    if (mParen) {
      var eff1 = detectEffortFromText(mParen[2]);
      return {
        base: mParen[1].trim(),
        effort: eff1,
        effortLabel: EFFORT_DISPLAY_LABEL[eff1] || mParen[2].trim()
      };
    }
    var mTail = s.match(/^(.*?)\s+(extra\s+high|x-high|xhigh|extra|minimal|medium|high|low|min|med|off|max)$/i);
    if (mTail) {
      var eff2 = detectEffortFromText(mTail[2]);
      return {
        base: mTail[1].trim(),
        effort: eff2,
        effortLabel: EFFORT_DISPLAY_LABEL[eff2] || mTail[2].trim()
      };
    }
    return null;
  }

  function itemMatchesEffort(txt, levelId) {
    var low = String(txt || '').toLowerCase().trim();
    if (!low) return false;
    if (levelId === 'xhigh') {
      return /\bxhigh\b|\bx-high\b|extra[\s-]*high|\bextra\b|极高|超高/.test(low);
    }
    if (levelId === 'high') {
      if (/\bxhigh\b|\bx-high\b|extra[\s-]*high|\bextra\b|极高|超高/.test(low)) return false;
      return /\bhigh\b|\(\s*高\s*\)|（\s*高\s*）|^高$|\s高$/.test(low);
    }
    if (levelId === 'medium') {
      return /\bmedium\b|\bmed\b|\(\s*中\s*\)|（\s*中\s*）|^中$|\s中$/.test(low);
    }
    if (levelId === 'low') {
      return /\blow\b|\blite\b|\(\s*低\s*\)|（\s*低\s*）|^低$|\s低$/.test(low);
    }
    if (levelId === 'minimal') return /\bminimal\b|\bmin\b|极简/.test(low);
    if (levelId === 'max') return /\bmax\b|最大/.test(low);
    if (levelId === 'off') return /\boff\b|\bnone\b|关/.test(low);
    return false;
  }

  function getReactFiber(el) {
    if (!el || typeof el !== 'object') return null;
    try {
      var ks = Object.keys(el);
      var raw = null;
      for (var i = 0; i < ks.length; i++) {
        if (ks[i].indexOf('__reactFiber$') === 0 || ks[i].indexOf('__reactInternalInstance$') === 0) {
          raw = el[ks[i]];
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

  function isOrchestratorModel(m) {
    if (!m) return false;
    var txt = typeof m === 'string' ? m : (String(m.label || '') + ' ' + String(m.modelId || ''));
    return /\borchestrator\b|编排/i.test(txt);
  }

  function findPlannerOption(planners, ref) {
    if (!ref) return null;
    if (typeof ref === 'object' && typeof ref.label === 'string') return ref;
    var list = Array.isArray(planners) ? planners : [];
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (!p) continue;
      if (p.value === ref || p.modelId === ref || p.label === ref) return p;
    }
    return null;
  }

  function buildEffortIndexFromOptions(list) {
    var out = new Map();
    if (!Array.isArray(list)) return out;
    for (var i = 0; i < list.length; i++) {
      var o = list[i];
      if (!o || o.disabled || o.isCustom || typeof o.label !== 'string' || isOrchestratorModel(o)) continue;
      var parsed = parseModelLabel(o.label);
      if (!parsed || !parsed.base) continue;
      var slug = extractModelFamily(parsed.base);
      if (!slug) continue;
      var m = out.get(slug);
      if (!m) {
        m = new Map();
        out.set(slug, m);
      }
      if (!m.has(parsed.effort)) m.set(parsed.effort, o);
    }
    return out;
  }

  function normalizeEffortIndex(rawMap, optsList) {
    var out = buildEffortIndexFromOptions(optsList);
    if (!(rawMap instanceof Map)) return out;
    rawMap.forEach(function (inn, rk) {
      if (!(inn instanceof Map) || !inn.size) return;
      var detectedBase = '';
      inn.forEach(function (o) {
        if (detectedBase || !o || typeof o.label !== 'string') return;
        var p = parseModelLabel(o.label);
        if (p && p.base) detectedBase = p.base;
      });
      var slug = extractModelFamily(detectedBase || String(rk || ''));
      if (!slug) return;
      var merged = out.get(slug) || new Map();
      inn.forEach(function (o, ek) {
        var nk = detectEffortFromText(ek);
        if (nk && o && !o.disabled && !merged.has(nk)) merged.set(nk, o);
      });
      if (merged.size) out.set(slug, merged);
    });
    return out;
  }

  function readAgFiberContext(el) {
    var cur = getReactFiber(el);
    if (!cur) return null;
    var sc = null;
    var ip = null;
    var op = null;
    var cid = '';
    var hasC = false;
    var gm = null;

    for (var step = 0; cur && step < 500; step += 1, cur = cur.return) {
      var props = cur.memoizedProps;
      if (!props || typeof props !== 'object') continue;
      var val = props.value;
      if (!sc && val && typeof val === 'object' && val.effortIndex instanceof Map && Array.isArray(val.modelOptions)) {
        sc = val;
      }
      if (typeof props.setIsOpen === 'function' && typeof props.setSelectedModel === 'function' && Array.isArray(props.modelOptions)) {
        if (!ip) ip = props;
        op = props;
      }
      if (!hasC && ('conversationId' in props) && ('placement' in props)) {
        hasC = true;
        cid = props.conversationId;
      }
      if (!gm && val && typeof val === 'object' && typeof val.setModelConfigByLabelForConversation === 'function') {
        gm = val;
      }
      if (sc && op && hasC && gm) break;
    }

    if (!sc && !ip && !op && !gm) return null;
    var mos = (op && op.modelOptions) || (ip && ip.modelOptions) || (sc && sc.modelOptions) || (gm && gm.visibleModelConfigs) || [];
    var sel = (op && op.selectedModel) || (ip && ip.selectedModel) || (sc && sc.selectedModel) ||
      (gm && (hasC && typeof gm.getModelConfigForConversation === 'function' ? gm.getModelConfigForConversation(cid) : gm.currentModelConfig)) || null;
    var _fn = function (o, k) { return (o && typeof o[k] === 'function') ? o[k] : null; };
    var ops = Array.isArray(sc && sc.orchestratorPlanners) ? sc.orchestratorPlanners : [];

    return {
      effortIndex: normalizeEffortIndex(sc && sc.effortIndex, mos),
      modelOptions: Array.isArray(mos) ? mos : [],
      selectedModel: sel,
      orchPlanners: ops,
      orchIdx: normalizeEffortIndex(sc && sc.orchestratorPlannerIndex, ops),
      orchDef: (sc && sc.orchestratorDefaultPlanner) || null,
      orchPick: (sc && sc.orchestratorPick && typeof sc.orchestratorPick === 'object') ? sc.orchestratorPick : null,
      conversationId: cid,
      setModelConfigByLabelForConversation: _fn(gm, 'setModelConfigByLabelForConversation'),
      setCurrentModelConfigByLabel: _fn(gm, 'setCurrentModelConfigByLabel'),
      unwrappedSetSelectedModel: _fn(op, 'setSelectedModel') || _fn(ip, 'setSelectedModel') || _fn(sc, 'setSelectedModel'),
      setIsOpen: _fn(op, 'setIsOpen') || _fn(ip, 'setIsOpen') || _fn(sc, 'setIsOpen')
    };
  }

  function collectEffortOptionsForBase(optionsList, targetBaseSlug, extraIndexMap) {
    var map = new Map();
    if (extraIndexMap instanceof Map) {
      var slugHit = extraIndexMap.get(targetBaseSlug);
      if (!(slugHit instanceof Map)) {
        extraIndexMap.forEach(function (inner, baseKey) {
          if (!slugHit && inner instanceof Map && extractModelFamily(baseKey) === targetBaseSlug) {
            slugHit = inner;
          }
        });
      }
      if (slugHit instanceof Map) {
        slugHit.forEach(function (opt, effKey) {
          var normId = detectEffortFromText(effKey);
          if (normId && opt && !opt.disabled && !map.has(normId)) {
            map.set(normId, {
              id: normId,
              label: EFFORT_DISPLAY_LABEL[normId] || effKey,
              option: opt
            });
          }
        });
      }
    }
    for (var i = 0; i < (optionsList || []).length; i++) {
      var opt = optionsList[i];
      if (!opt || opt.disabled || opt.isCustom || !opt.label) continue;
      var parsed = parseModelLabel(opt.label);
      if (!parsed || !parsed.base) continue;
      if (extractModelFamily(parsed.base) === targetBaseSlug) {
        if (!map.has(parsed.effort)) {
          map.set(parsed.effort, { id: parsed.effort, label: parsed.effortLabel, option: opt });
        }
      }
    }
    var levels = [];
    map.forEach(function (entry) {
      levels.push(entry);
    });
    levels.sort(function (a, b) {
      return (EFFORT_RANK[a.id] ?? 99) - (EFFORT_RANK[b.id] ?? 99);
    });
    return levels;
  }

  function resolveActiveModelProfile(ctx, triggerText, hoveredBaseText) {
    if (!ctx) return null;

    var effIdx = ctx.effortIndex instanceof Map ? ctx.effortIndex : normalizeEffortIndex(null, ctx.modelOptions);
    var orchIdx = (ctx.orchIdx instanceof Map && ctx.orchIdx.size) ? ctx.orchIdx : normalizeEffortIndex(null, ctx.orchPlanners);

    // 1. If user is hovering over a specific non-orchestrator model row in the open menu, inspect THAT model's real efforts
    if (hoveredBaseText && !isOrchestratorModel(hoveredBaseText)) {
      var hovSlug = extractModelFamily(hoveredBaseText);
      var hovLevels = collectEffortOptionsForBase(ctx.modelOptions, hovSlug, effIdx);
      if (hovLevels.length) {
        var selParsed = ctx.selectedModel ? parseModelLabel(ctx.selectedModel.label) : null;
        var isSameAsSelected = selParsed && extractModelFamily(selParsed.base) === hovSlug;
        var hovCur = isSameAsSelected && hovLevels.some(function (l) { return l.id === selParsed.effort; })
          ? selParsed.effort
          : (hovLevels.some(function (l) { return l.id === 'medium'; }) ? 'medium' : hovLevels[0].id);
        return {
          isOrchPlan: false,
          isHovered: true,
          baseName: (selParsed && isSameAsSelected ? selParsed.base : null) || hoveredBaseText.trim(),
          currentEffort: hovCur,
          levels: hovLevels
        };
      }
    }

    var selected = ctx.selectedModel;
    var isOrch = isOrchestratorModel(selected) || isOrchestratorModel(triggerText);

    if (isOrch && Array.isArray(ctx.orchPlanners) && ctx.orchPlanners.length) {
      var pk = ctx.orchPick || ctx.orchestratorPick;
      var def = findPlannerOption(ctx.orchPlanners, ctx.orchDef || ctx.orchestratorDefaultPlanner) || ctx.orchPlanners[0] || null;
      var pkRef = pk ? (pk.model !== undefined ? pk.model : pk.selected) : null;
      var activePlanner = (pkRef && pkRef !== 0 ? findPlannerOption(ctx.orchPlanners, pkRef) : null) || def;

      var pParsed = activePlanner && activePlanner.label ? parseModelLabel(activePlanner.label) : null;
      var pBase = pParsed ? pParsed.base : ((activePlanner && activePlanner.label) || '');
      var pSlug = extractModelFamily(pBase);
      var pLevels = collectEffortOptionsForBase(ctx.orchPlanners, pSlug, orchIdx);
      if (pLevels.length) {
        var realOrchEffort = (pParsed && pParsed.effort)
          || ((triggerText && pSlug && extractModelFamily(triggerText) === pSlug) ? detectEffortFromText(triggerText) : '')
          || (pLevels.some(function (l) { return l.id === 'medium'; }) ? 'medium' : pLevels[0].id);
        return {
          isOrchPlan: true,
          isHovered: false,
          baseName: pBase,
          currentEffort: realOrchEffort,
          levels: pLevels
        };
      }
    }

    var baseLabel = (selected && selected.label) || triggerText || '';
    var parsed = parseModelLabel(baseLabel);
    var baseName = parsed ? parsed.base : baseLabel;
    var baseSlug = extractModelFamily(baseName);
    var levels = collectEffortOptionsForBase(ctx.modelOptions, baseSlug, effIdx);
    if (!levels.length) return null;
    var realEff = (parsed && parsed.effort)
      || ((triggerText && baseSlug && extractModelFamily(triggerText) === baseSlug) ? detectEffortFromText(triggerText) : '')
      || (levels.some(function (l) { return l.id === 'medium'; }) ? 'medium' : levels[0].id);
    return {
      isOrchPlan: false,
      isHovered: false,
      baseName: baseName,
      currentEffort: realEff,
      levels: levels
    };
  }

  function commitEffortOption(ctx, targetOption, isOrchPlan, keepOpen) {
    if (!ctx || !targetOption || !targetOption.label) return false;
    var shouldKeep = keepOpen !== false;
    try {
      var pk = ctx.orchPick || ctx.orchestratorPick;
      if (isOrchPlan && pk && typeof pk.select === 'function') {
        var def = findPlannerOption(ctx.orchPlanners, ctx.orchDef || ctx.orchestratorDefaultPlanner);
        var nextVal = (def && def.value === targetOption.value) ? 0 : targetOption.value;
        pk.select(nextVal);
        if (shouldKeep && typeof ctx.setIsOpen === 'function') {
          try { ctx.setIsOpen(true); } catch (_e) {}
        }
        return true;
      }
      if (typeof ctx.setModelConfigByLabelForConversation === 'function') {
        ctx.setModelConfigByLabelForConversation(targetOption.label, ctx.conversationId, shouldKeep);
        return true;
      }
      if (typeof ctx.unwrappedSetSelectedModel === 'function') {
        ctx.unwrappedSetSelectedModel(targetOption);
        if (shouldKeep && typeof ctx.setIsOpen === 'function') {
          try { ctx.setIsOpen(true); } catch (_e2) {}
        }
        return true;
      }
      if (typeof ctx.setCurrentModelConfigByLabel === 'function') {
        ctx.setCurrentModelConfigByLabel(targetOption.label);
        return true;
      }
    } catch (_e3) {}
    return false;
  }

  function triggerHostClick(el) {
    if (!el) return;
    try {
      if (typeof PointerEvent === 'function') {
        el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      }
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      el.click();
    } catch (_e) {
      try { el.click(); } catch (_e2) {}
    }
  }

  function createEffortSliderController() {
    if (typeof document === 'undefined') {
      return { sync: function () {}, destroy: function () {} };
    }
    ensureEffortStyles();
    var barEl = null;
    var titleEl = null;
    var valEl = null;
    var stepsEl = null;
    var currentEffort = 'medium';
    var activeProfile = null;
    var liveCtx = null;
    var lastRenderedKey = '';
    var mountedPanel = null;
    var hoveredModelText = '';
    var optimisticLock = null;
    var syncTimer = 0;
    var clickResyncTimer1 = 0;
    var clickResyncTimer2 = 0;

    function readHostTriggerRaw() {
      var trigs = document.querySelectorAll('[data-testid="model-selector-trigger"]');
      var trig = null;
      for (var i = 0; i < trigs.length; i++) {
        try {
          var rect = trigs[i].getBoundingClientRect();
          if (rect && rect.width > 0) {
            trig = trigs[i];
            break;
          }
        } catch (_e) {}
      }
      if (!trig && trigs.length) trig = trigs[0];
      if (!trig) return { trig: null, raw: '', family: '', effort: null };
      var raw = String(trig.textContent || trig.getAttribute('aria-label') || '').trim();
      return {
        trig: trig,
        raw: raw,
        family: extractModelFamily(raw),
        effort: detectEffortFromText(raw)
      };
    }

    function forceResyncFromHost() {
      var curPanel = document.querySelector('[data-testid="model-selector-panel"]');
      var curTrig = readHostTriggerRaw();
      var nextCtx = readAgFiberContext(curPanel || curTrig.trig);
      if (nextCtx) liveCtx = nextCtx;
      var nextProf = nextCtx ? resolveActiveModelProfile(nextCtx, curTrig.raw, hoveredModelText) : null;
      if (nextProf && nextProf.currentEffort) {
        activeProfile = nextProf;
        currentEffort = nextProf.currentEffort;
        updateBarDom();
      }
    }

    function tryApplyEffortDomFallback(panel, levelId, familySlug) {
      if (!panel) return false;
      var effortBtns = panel.querySelectorAll('[data-testid="model-selector-effort-group"] button, [role="radio"]');
      for (var i = 0; i < effortBtns.length; i++) {
        var btn = effortBtns[i];
        if (btn.closest && btn.closest('.ags-effort-bar')) continue;
        var txt = String(btn.textContent || btn.getAttribute('aria-label') || '').trim();
        if (itemMatchesEffort(txt, levelId)) {
          triggerHostClick(btn);
          return true;
        }
      }
      var menuItems = panel.querySelectorAll('[role="menuitem"], [role="option"], [role="menuitemradio"], button');
      var fallbackMatch = null;
      for (var j = 0; j < menuItems.length; j++) {
        var item = menuItems[j];
        if (item.closest && item.closest('.ags-effort-bar')) continue;
        var itemTxt = String(item.textContent || item.getAttribute('aria-label') || '').trim();
        if (!itemMatchesEffort(itemTxt, levelId)) continue;
        if (familySlug && extractModelFamily(itemTxt).indexOf(familySlug) !== -1) {
          triggerHostClick(item);
          return true;
        }
        if (!fallbackMatch) fallbackMatch = item;
      }
      if (fallbackMatch) {
        triggerHostClick(fallbackMatch);
        return true;
      }
      return false;
    }

    function applyLevelChange(levelId) {
      var panel = mountedPanel || document.querySelector('[data-testid="model-selector-panel"]');
      var trigInfo = readHostTriggerRaw();
      var ctx = readAgFiberContext(panel || trigInfo.trig) || liveCtx;
      var prof = ctx ? resolveActiveModelProfile(ctx, trigInfo.raw, hoveredModelText) : activeProfile;
      if (!prof || !Array.isArray(prof.levels)) return;

      var match = prof.levels.find(function (l) { return l.id === levelId; });
      if (!match || !match.option) return;

      var committed = commitEffortOption(ctx, match.option, prof.isOrchPlan, true);
      if (!committed) {
        tryApplyEffortDomFallback(panel, levelId, extractModelFamily(prof.baseName) || trigInfo.family);
      }

      currentEffort = levelId;
      optimisticLock = { base: prof.baseName, effort: levelId, until: Date.now() + 450 };
      updateBarDom();

      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(function () {
        syncTimer = 0;
        optimisticLock = null;
        var curPanel = document.querySelector('[data-testid="model-selector-panel"]');
        var curTrig = readHostTriggerRaw();
        var nextCtx = readAgFiberContext(curPanel || curTrig.trig);
        var nextProf = nextCtx ? resolveActiveModelProfile(nextCtx, curTrig.raw, hoveredModelText) : null;
        if (nextProf && nextProf.currentEffort) {
          activeProfile = nextProf;
          currentEffort = nextProf.currentEffort;
          updateBarDom();
        }
      }, 140);
    }

    function ensureBarBuilt() {
      if (barEl) return;
      barEl = document.createElement('div');
      barEl.className = 'ags-effort-bar';
      barEl.setAttribute('data-ag-studio-ignore', 'true');
      barEl.setAttribute('data-ag-no-i18n', 'true');

      var head = document.createElement('div');
      head.className = 'ags-effort-head';
      titleEl = document.createElement('span');
      titleEl.className = 'ags-effort-title';
      valEl = document.createElement('span');
      valEl.className = 'ags-effort-val';
      head.appendChild(titleEl);
      head.appendChild(valEl);

      stepsEl = document.createElement('div');
      stepsEl.className = 'ags-effort-steps';
      stepsEl.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var btn = ev.target && ev.target.closest && ev.target.closest('[data-effort]');
        if (!btn) return;
        var nextId = btn.getAttribute('data-effort');
        if (!nextId) return;
        applyLevelChange(nextId);
      });

      barEl.appendChild(head);
      barEl.appendChild(stepsEl);
    }

    function getDisplayLabel(levelId, prof) {
      if (prof && Array.isArray(prof.levels)) {
        var found = prof.levels.find(function (l) { return l.id === levelId; });
        if (found && found.label) return found.label;
      }
      var meta = EFFORT_LEVELS.find(function (l) { return l.id === levelId; });
      return meta ? meta.labelEn : levelId;
    }

    function updateBarDom() {
      if (!activeProfile || !Array.isArray(activeProfile.levels) || activeProfile.levels.length < 2) {
        if (barEl && barEl.parentElement) barEl.parentElement.removeChild(barEl);
        return;
      }
      ensureBarBuilt();

      var levelIds = activeProfile.levels.map(function (l) { return l.id; });
      var baseName = activeProfile.baseName || '';
      var key = currentEffort + '|' + levelIds.join(',') + '|' + baseName;
      if (key === lastRenderedKey) return;
      lastRenderedKey = key;

      titleEl.textContent = baseName || 'Thinking effort';
      valEl.textContent = getDisplayLabel(currentEffort, activeProfile);

      stepsEl.innerHTML = activeProfile.levels.map(function (lvl) {
        return '<button type="button" class="ags-effort-btn ' + (lvl.id === currentEffort ? 'active' : '') +
          '" data-effort="' + lvl.id + '">' + (lvl.label || getDisplayLabel(lvl.id, activeProfile)) + '</button>';
      }).join('');
    }

    function onPanelPointerOver(ev) {
      var item = ev.target && ev.target.closest && ev.target.closest(
        '[data-testid="model-selector-item"], [data-testid="model-selector-orchestrator"], [data-testid="orchestrator-picker-row"], [role="menuitem"], [role="option"]'
      );
      if (!item || !mountedPanel || !mountedPanel.contains(item)) return;
      var raw = item.getAttribute('data-model-base') || item.getAttribute('data-model-label') || item.textContent || '';
      var fam = extractModelFamily(raw);
      if (!fam) return;
      if (isOrchestratorModel(raw)) {
        if (!hoveredModelText) return;
        hoveredModelText = '';
      } else {
        if (fam === extractModelFamily(hoveredModelText)) return;
        hoveredModelText = raw.replace(/\b(?:new|notice|beta|preview|recommended|default)\b/gi, '').trim();
      }
      var trigInfo = readHostTriggerRaw();
      var ctx = readAgFiberContext(mountedPanel) || liveCtx;
      if (ctx) {
        liveCtx = ctx;
        activeProfile = resolveActiveModelProfile(ctx, trigInfo.raw, hoveredModelText);
        if (activeProfile && activeProfile.currentEffort) currentEffort = activeProfile.currentEffort;
        updateBarDom();
        if (activeProfile && activeProfile.levels && activeProfile.levels.length >= 2) {
          var studioRoot = document.getElementById('ag-studio-root') || document.body;
          if (barEl && barEl.parentElement !== studioRoot) studioRoot.appendChild(barEl);
        }
      }
    }

    function onPanelClick(ev) {
      if (ev && ev.target && ev.target.closest && ev.target.closest('.ags-effort-bar')) return;
      optimisticLock = null;
      hoveredModelText = '';
      if (clickResyncTimer1) clearTimeout(clickResyncTimer1);
      if (clickResyncTimer2) clearTimeout(clickResyncTimer2);
      clickResyncTimer1 = setTimeout(function () {
        clickResyncTimer1 = 0;
        forceResyncFromHost();
      }, 50);
      clickResyncTimer2 = setTimeout(function () {
        clickResyncTimer2 = 0;
        forceResyncFromHost();
      }, 180);
    }

    function detachPanelListener() {
      if (mountedPanel) {
        try { mountedPanel.removeEventListener('pointerover', onPanelPointerOver, true); } catch (_e) {}
        try { mountedPanel.removeEventListener('click', onPanelClick, true); } catch (_e2) {}
      }
    }

    function removeBar() {
      detachPanelListener();
      if (clickResyncTimer1) { clearTimeout(clickResyncTimer1); clickResyncTimer1 = 0; }
      if (clickResyncTimer2) { clearTimeout(clickResyncTimer2); clickResyncTimer2 = 0; }
      mountedPanel = null;
      hoveredModelText = '';
      lastRenderedKey = '';
      optimisticLock = null;
      if (barEl && barEl.parentElement) barEl.parentElement.removeChild(barEl);
    }

    function sync(cfg) {
      var fx = (cfg && cfg.fx) || {};
      if (fx.effortSlider !== true) {
        removeBar();
        return;
      }
      var panel = document.querySelector('[data-testid="model-selector-panel"]');
      if (!panel) {
        if (mountedPanel) removeBar();
        return;
      }

      if (mountedPanel !== panel) {
        detachPanelListener();
        mountedPanel = panel;
        hoveredModelText = '';
        panel.addEventListener('pointerover', onPanelPointerOver, { capture: true, passive: true });
        panel.addEventListener('click', onPanelClick, { capture: true });
      }

      var trigInfo = readHostTriggerRaw();
      liveCtx = readAgFiberContext(panel) || readAgFiberContext(trigInfo.trig);
      activeProfile = liveCtx ? resolveActiveModelProfile(liveCtx, trigInfo.raw, hoveredModelText) : null;

      if (optimisticLock && Date.now() < optimisticLock.until && activeProfile && activeProfile.baseName === optimisticLock.base) {
        currentEffort = optimisticLock.effort;
      } else if (activeProfile && activeProfile.currentEffort) {
        currentEffort = activeProfile.currentEffort;
      } else if (trigInfo.effort) {
        currentEffort = trigInfo.effort;
      }

      updateBarDom();
      if (!activeProfile || !activeProfile.levels || activeProfile.levels.length < 2) {
        return;
      }
      var studioRoot = document.getElementById('ag-studio-root') || document.body;
      if (barEl && barEl.parentElement !== studioRoot) {
        studioRoot.appendChild(barEl);
      }
      try {
        var r = panel.getBoundingClientRect();
        if (r && r.width > 0 && barEl) {
          var w = Math.max(220, Math.min(340, Math.round(r.width)));
          barEl.style.width = w + 'px';
          barEl.style.left = Math.max(8, Math.round(r.left)) + 'px';
          var topPos = r.bottom + 6;
          if (topPos + 68 > (window.innerHeight || 900)) {
            topPos = Math.max(8, r.top - 72);
          }
          barEl.style.top = Math.round(topPos) + 'px';
        }
      } catch (_e) {}
    }

    function destroy() {
      if (syncTimer) clearTimeout(syncTimer);
      if (clickResyncTimer1) clearTimeout(clickResyncTimer1);
      if (clickResyncTimer2) clearTimeout(clickResyncTimer2);
      removeBar();
    }

    return {
      sync: sync,
      destroy: destroy
    };
  }

  var api = {
    EFFORT_LEVELS: EFFORT_LEVELS,
    detectEffortFromText: detectEffortFromText,
    extractModelFamily: extractModelFamily,
    parseModelLabel: parseModelLabel,
    itemMatchesEffort: itemMatchesEffort,
    resolveActiveModelProfile: resolveActiveModelProfile,
    commitEffortOption: commitEffortOption,
    createEffortSliderController: createEffortSliderController
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_EFFORT_SLIDER__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
