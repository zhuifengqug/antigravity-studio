(function (globalScope) {
  'use strict';

  var EFFORT_LEVELS = [
    { id: 'off', labelZh: '关', labelEn: 'Off', keywords: ['off', 'none', 'disabled', '关'] },
    { id: 'minimal', labelZh: '极简', labelEn: 'Min', keywords: ['minimal', 'min', '极简'] },
    { id: 'low', labelZh: '低', labelEn: 'Low', keywords: ['low', 'lite', '低'] },
    { id: 'medium', labelZh: '中', labelEn: 'Medium', keywords: ['medium', 'med', '中'] },
    { id: 'high', labelZh: '高', labelEn: 'High', keywords: ['high', 'thinking', '高', '深度思考'] },
    { id: 'xhigh', labelZh: '极高', labelEn: 'xHigh', keywords: ['xhigh', 'x-high', 'extra high', 'extra', '极高', '超高'] },
    { id: 'max', labelZh: '最大', labelEn: 'Max', keywords: ['max', 'ultra', '最大'] }
  ];

  var DEFAULT_DISPLAY_ORDER = ['low', 'medium', 'high', 'xhigh'];
  var EFFORT_RANK = { off: 0, minimal: 1, low: 2, medium: 3, high: 4, xhigh: 5, max: 6 };

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
      '.ags-effort-btn { border:none; background:transparent; color:var(--ags-text-secondary, #94a3b8); font-size:11px; font-weight:500; padding:4px 2px; border-radius:6px; cursor:pointer; transition:color 100ms ease, background-color 100ms ease; }',
      '.ags-effort-btn:hover { color:var(--ags-text-primary, #f4f4f5); }',
      '.ags-effort-btn.active { background:var(--ags-accent-soft, rgba(217,119,87,.16)); color:var(--ags-accent, #D97757); font-weight:600; }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function detectEffortFromText(text) {
    var low = String(text || '').toLowerCase();
    if (/(?:\bxhigh\b|\bx-high\b|extra[\s-]*high|极高|超高)/i.test(low)) return 'xhigh';
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
      .replace(/[（(][^（）()]*[）)]/g, ' ')
      .replace(/\b(?:off|none|minimal|min|low|medium|med|high|xhigh|x-high|extra\s*high|max)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function parseModelLabel(label) {
    var s = String(label || '').trim();
    if (!s) return null;
    var mParen = s.match(/^(.*?)\s*[（(]([^()（）]+)[）)]\s*$/);
    if (mParen) {
      var eff1 = detectEffortFromText(mParen[2]);
      return { base: mParen[1].trim(), effort: eff1, effortLabel: mParen[2].trim() };
    }
    var mTail = s.match(/^(.*?)\s+(off|minimal|min|low|medium|med|high|xhigh|x-high|extra\s*high|max)$/i);
    if (mTail) {
      var eff2 = detectEffortFromText(mTail[2]);
      return { base: mTail[1].trim(), effort: eff2, effortLabel: mTail[2].trim() };
    }
    return { base: s, effort: 'medium', effortLabel: 'Medium' };
  }

  function itemMatchesEffort(txt, levelId) {
    var low = String(txt || '').toLowerCase().trim();
    if (!low) return false;
    if (levelId === 'xhigh') {
      return /\bxhigh\b|\bx-high\b|extra[\s-]*high|极高|超高/.test(low);
    }
    if (levelId === 'high') {
      if (/\bxhigh\b|\bx-high\b|extra[\s-]*high|极高|超高/.test(low)) return false;
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
        for (var g = 0; root.return && g < 80; g++) root = root.return;
        if (root && root.stateNode && root.stateNode.current && root.stateNode.current !== root) {
          return raw.alternate;
        }
      }
      return raw;
    } catch (_e) {
      return null;
    }
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
      effortIndex: sc && sc.effortIndex instanceof Map ? sc.effortIndex : null,
      modelOptions: Array.isArray(mos) ? mos : [],
      selectedModel: sel,
      orchPlanners: ops,
      orchIdx: sc && sc.orchestratorPlannerIndex instanceof Map ? sc.orchestratorPlannerIndex : null,
      orchDef: (sc && sc.orchestratorDefaultPlanner) || null,
      orchPick: (sc && sc.orchestratorPick && typeof sc.orchestratorPick === 'object') ? sc.orchestratorPick : null,
      conversationId: cid,
      setModelConfigByLabelForConversation: _fn(gm, 'setModelConfigByLabelForConversation'),
      setCurrentModelConfigByLabel: _fn(gm, 'setCurrentModelConfigByLabel'),
      unwrappedSetSelectedModel: _fn(op, 'setSelectedModel') || _fn(ip, 'setSelectedModel') || _fn(sc, 'setSelectedModel'),
      setIsOpen: _fn(op, 'setIsOpen') || _fn(ip, 'setIsOpen') || _fn(sc, 'setIsOpen')
    };
  }

  function isOrchestratorModel(m) {
    if (!m) return false;
    var txt = typeof m === 'string' ? m : (String(m.label || '') + ' ' + String(m.modelId || ''));
    return /\borchestrator\b|编排/i.test(txt);
  }

  function collectEffortOptionsForBase(optionsList, targetBaseSlug) {
    var map = new Map();
    for (var i = 0; i < (optionsList || []).length; i++) {
      var opt = optionsList[i];
      if (!opt || opt.disabled || opt.isCustom || !opt.label) continue;
      if (isOrchestratorModel(opt)) continue;
      var parsed = parseModelLabel(opt.label);
      if (!parsed || !parsed.base) continue;
      if (extractModelFamily(parsed.base) === targetBaseSlug) {
        if (!map.has(parsed.effort)) {
          map.set(parsed.effort, opt);
        }
      }
    }
    var levels = [];
    map.forEach(function (opt, effId) {
      levels.push({ id: effId, option: opt });
    });
    levels.sort(function (a, b) {
      return (EFFORT_RANK[a.id] ?? 99) - (EFFORT_RANK[b.id] ?? 99);
    });
    return levels;
  }

  function resolveActiveModelProfile(ctx, triggerText) {
    if (!ctx) return null;
    var selected = ctx.selectedModel;
    var isOrch = isOrchestratorModel(selected) || isOrchestratorModel(triggerText);

    if (isOrch && Array.isArray(ctx.orchPlanners) && ctx.orchPlanners.length) {
      var pk = ctx.orchPick;
      var activePlanner = null;
      if (pk && pk.selected != null) {
        activePlanner = ctx.orchPlanners.find(function (p) { return p && p.value === pk.selected; }) || null;
      }
      if (!activePlanner) activePlanner = ctx.orchDef || ctx.orchPlanners[0];
      var pParsed = activePlanner ? parseModelLabel(activePlanner.label) : null;
      var pBase = pParsed ? pParsed.base : (activePlanner && activePlanner.label) || '';
      var pSlug = extractModelFamily(pBase);
      var pLevels = collectEffortOptionsForBase(ctx.orchPlanners, pSlug);
      if (pLevels.length) {
        return {
          isOrchPlan: true,
          baseName: pBase,
          currentEffort: pParsed ? pParsed.effort : 'medium',
          levels: pLevels
        };
      }
    }

    var baseLabel = (selected && selected.label) || triggerText || '';
    var parsed = parseModelLabel(baseLabel);
    var baseName = parsed ? parsed.base : baseLabel;
    var baseSlug = extractModelFamily(baseName);
    var levels = collectEffortOptionsForBase(ctx.modelOptions, baseSlug);
    if (!levels.length) return null;
    return {
      isOrchPlan: false,
      baseName: baseName,
      currentEffort: parsed ? parsed.effort : 'medium',
      levels: levels
    };
  }

  function commitEffortOption(ctx, targetOption, isOrchPlan, keepOpen) {
    if (!ctx || !targetOption || !targetOption.label) return false;
    var shouldKeep = keepOpen !== false;
    try {
      var pk = ctx.orchPick || ctx.orchestratorPick;
      if (isOrchPlan && pk && typeof pk.select === 'function') {
        var def = ctx.orchDef || ctx.orchestratorDefaultPlanner;
        pk.select(def && def.value === targetOption.value ? 0 : targetOption.value);
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

  function createEffortSliderController(options) {
    if (typeof document === 'undefined') {
      return { sync: function () {}, destroy: function () {} };
    }
    ensureEffortStyles();
    var opts = options || {};
    var barEl = null;
    var titleEl = null;
    var valEl = null;
    var stepsEl = null;
    var currentEffort = 'medium';
    var currentLevels = DEFAULT_DISPLAY_ORDER.slice();
    var activeProfile = null;
    var liveCtx = null;
    var lastRenderedKey = '';
    var mountedPanel = null;
    var syncTimer = 0;

    function isZh() {
      var cfg = typeof opts.getConfig === 'function' ? opts.getConfig() : {};
      var lang = (cfg && cfg.i18n && cfg.i18n.language) || 'zh-CN';
      return lang !== 'en';
    }

    function readHostTriggerRaw() {
      var trig = document.querySelector('[data-testid="model-selector-trigger"]');
      if (!trig) return { trig: null, raw: '', family: '', effort: null };
      var raw = String(trig.getAttribute('aria-label') || trig.textContent || '').trim();
      return {
        trig: trig,
        raw: raw,
        family: extractModelFamily(raw),
        effort: detectEffortFromText(raw)
      };
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
      var prof = ctx ? resolveActiveModelProfile(ctx, trigInfo.raw) : activeProfile;

      var committed = false;
      if (ctx && prof && Array.isArray(prof.levels)) {
        var match = prof.levels.find(function (l) { return l.id === levelId; });
        if (match && match.option) {
          committed = commitEffortOption(ctx, match.option, prof.isOrchPlan, true);
        }
      }

      if (!committed) {
        committed = tryApplyEffortDomFallback(panel, levelId, trigInfo.family);
      }

      currentEffort = levelId;
      updateBarDom();

      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(function () {
        syncTimer = 0;
        var curPanel = document.querySelector('[data-testid="model-selector-panel"]');
        var curTrig = readHostTriggerRaw();
        var nextCtx = readAgFiberContext(curPanel || curTrig.trig);
        var nextProf = nextCtx ? resolveActiveModelProfile(nextCtx, curTrig.raw) : null;
        if (nextProf && nextProf.currentEffort) {
          currentEffort = nextProf.currentEffort;
          updateBarDom();
        } else if (curTrig.effort) {
          currentEffort = curTrig.effort;
          updateBarDom();
        }
      }, 120);
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

    function updateBarDom() {
      ensureBarBuilt();
      var zh = isZh();
      var levelIds = (activeProfile && Array.isArray(activeProfile.levels) && activeProfile.levels.length)
        ? activeProfile.levels.map(function (l) { return l.id; })
        : DEFAULT_DISPLAY_ORDER;
      var baseName = (activeProfile && activeProfile.baseName) || '';
      var key = currentEffort + '|' + levelIds.join(',') + '|' + baseName + '|' + (zh ? '1' : '0');
      if (key === lastRenderedKey) return;
      lastRenderedKey = key;
      currentLevels = levelIds;

      var activeLvl = EFFORT_LEVELS.find(function (l) { return l.id === currentEffort; }) || EFFORT_LEVELS[3];
      titleEl.textContent = (zh ? '推理等级' : 'Reasoning Effort') + (baseName ? (' · ' + baseName) : '');
      valEl.textContent = zh ? activeLvl.labelZh : activeLvl.labelEn;

      stepsEl.innerHTML = currentLevels.map(function (id) {
        var meta = EFFORT_LEVELS.find(function (l) { return l.id === id; }) || { id: id, labelZh: id, labelEn: id };
        return '<button type="button" class="ags-effort-btn ' + (id === currentEffort ? 'active' : '') +
          '" data-effort="' + id + '">' + (zh ? meta.labelZh : meta.labelEn) + '</button>';
      }).join('');
    }

    function removeBar() {
      mountedPanel = null;
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

      var trigInfo = readHostTriggerRaw();
      liveCtx = readAgFiberContext(panel) || readAgFiberContext(trigInfo.trig);
      activeProfile = liveCtx ? resolveActiveModelProfile(liveCtx, trigInfo.raw) : null;

      if (activeProfile && activeProfile.currentEffort) {
        currentEffort = activeProfile.currentEffort;
      } else if (trigInfo.effort) {
        currentEffort = trigInfo.effort;
      }

      updateBarDom();
      var studioRoot = document.getElementById('ag-studio-root') || document.body;
      if (barEl.parentElement !== studioRoot) {
        studioRoot.appendChild(barEl);
      }
      mountedPanel = panel;
      try {
        var r = panel.getBoundingClientRect();
        if (r && r.width > 0) {
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
