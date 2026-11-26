(function (globalScope) {
  'use strict';

  var STYLE_ID = 'ag-studio-gemini-web-style';
  var PARTITION_NAME = 'persist:ag-studio-gemini-web';
  var GEMINI_URL = 'https://gemini.google.com/app';
  var AISTUDIO_URL = 'https://aistudio.google.com/prompts/new_chat';

  var PRESET_SITES = [
    {
      id: 'gemini',
      label: 'Gemini',
      name: 'Gemini',
      badge: '独立额度',
      desc: '使用网页端额度 · 不占客户端配额',
      url: GEMINI_URL
    },
    {
      id: 'aistudio',
      label: 'AI Studio',
      name: 'AI Studio',
      badge: '自动汉化',
      desc: 'Google AI Studio · 内置中文界面与独立调试',
      url: AISTUDIO_URL
    }
  ];

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function sanitizeWebUrl(raw) {
    var input = String(raw || '').trim();
    if (!input) return GEMINI_URL;
    try {
      var u = new URL(input);
      if (u.protocol === 'https:') {
        return u.toString();
      }
      if (u.protocol === 'http:') {
        var host = String(u.hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
          return u.toString();
        }
      }
    } catch (_e) {}
    return GEMINI_URL;
  }

  function getSiteSpec(siteId) {
    return siteId === 'aistudio' ? PRESET_SITES[1] : PRESET_SITES[0];
  }

  function formatHostLabel(url) {
    try {
      return new URL(sanitizeWebUrl(url)).hostname;
    } catch (_e) {
      return 'gemini.google.com';
    }
  }

  function markOwned(el) {
    if (!el || typeof el.setAttribute !== 'function') return el;
    el.setAttribute('data-ag-studio-ignore', 'true');
    el.setAttribute('data-ag-no-i18n', 'true');
    el.setAttribute('translate', 'no');
    return el;
  }

  function makeIconSvg(doc, paths, size) {
    if (!doc) return null;
    if (typeof doc.createElementNS !== 'function') {
      return typeof doc.createElement === 'function' ? doc.createElement('span') : null;
    }
    try {
      var svg = doc.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', String(size || 14));
      svg.setAttribute('height', String(size || 14));
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.85');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.flexShrink = '0';
      for (var i = 0; i < paths.length; i++) {
        var p = doc.createElementNS(SVG_NS, 'path');
        p.setAttribute('d', paths[i]);
        svg.appendChild(p);
      }
      return svg;
    } catch (_e) {
      return typeof doc.createElement === 'function' ? doc.createElement('span') : null;
    }
  }

  function makeGeminiBrandSvg(doc, size) {
    if (!doc) return null;
    if (typeof doc.createElementNS !== 'function') {
      return typeof doc.createElement === 'function' ? doc.createElement('span') : null;
    }
    try {
      var svg = doc.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', String(size || 18));
      svg.setAttribute('height', String(size || 18));
      svg.setAttribute('fill', 'none');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.flexShrink = '0';

      var defs = doc.createElementNS(SVG_NS, 'defs');
      var grad = doc.createElementNS(SVG_NS, 'linearGradient');
      grad.setAttribute('id', 'ags-gemini-star-grad');
      grad.setAttribute('x1', '2');
      grad.setAttribute('y1', '2');
      grad.setAttribute('x2', '22');
      grad.setAttribute('y2', '22');
      grad.setAttribute('gradientUnits', 'userSpaceOnUse');

      var stops = [
        ['0%', '#4285F4'],
        ['42%', '#3186FF'],
        ['74%', '#8B5CF6'],
        ['100%', '#38BDF8']
      ];
      for (var s = 0; s < stops.length; s++) {
        var st = doc.createElementNS(SVG_NS, 'stop');
        st.setAttribute('offset', stops[s][0]);
        st.setAttribute('stop-color', stops[s][1]);
        grad.appendChild(st);
      }
      defs.appendChild(grad);
      svg.appendChild(defs);

      var path = doc.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', 'M12 2C12.7 7.1 16.9 11.3 22 12C16.9 12.7 12.7 16.9 12 22C11.3 16.9 7.1 12.7 2 12C7.1 11.3 11.3 7.1 12 2Z');
      path.setAttribute('fill', 'url(#ags-gemini-star-grad)');
      svg.appendChild(path);
      return svg;
    } catch (_e) {
      return typeof doc.createElement === 'function' ? doc.createElement('span') : null;
    }
  }

  function buildStyles() {
    return [
      '.ags-gw-native-hidden{display:none!important}',
      '.ags-gw-dock{padding:2px 10px 8px;flex-shrink:0;box-sizing:border-box;user-select:none}',
      '.ags-gw-seg{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));height:32px;padding:3px;border-radius:10px;background:var(--ags-bg-subtle,rgba(148,163,184,0.12));border:1px solid var(--ags-border,rgba(148,163,184,0.20));box-sizing:border-box}',
      '.ags-gw-slider{position:absolute;top:3px;bottom:3px;left:3px;width:calc(50% - 3px);border-radius:7px;background:var(--ags-bg-surface,#FFFFFF);box-shadow:0 1px 3px rgba(0,0,0,0.10),0 0 0 0.5px rgba(0,0,0,0.05);transform:translate3d(0,0,0);transition:transform 260ms cubic-bezier(.22,1,.36,1);pointer-events:none;z-index:0}',
      '.ags-gw-seg[data-mode="gemini"] .ags-gw-slider{transform:translate3d(100%,0,0)}',
      '.ags-gw-mode-btn{position:relative;z-index:1;appearance:none;border:none;background:transparent;color:var(--ags-text-secondary,#6E6B64);height:24px;padding:0 8px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;gap:5px;font-size:12px;font-weight:500;font-family:var(--ags-font-ui,system-ui,sans-serif);cursor:pointer;white-space:nowrap;transition:color 160ms ease,transform 140ms ease}',
      '.ags-gw-mode-btn:hover,.ags-gw-mode-btn[data-active="1"]{color:var(--ags-text-primary,#1F1E1D);font-weight:600}',
      '.ags-gw-mode-btn:active{transform:scale(0.96)}',
      '.ags-gw-dot{position:absolute;top:4px;right:7px;width:6px;height:6px;border-radius:999px;display:none;pointer-events:none}',
      '.ags-gw-dot[data-status="running"]{display:block;background:#3B82F6;box-shadow:0 0 8px rgba(59,130,246,0.75);animation:ags-gw-pulse 1.8s ease-in-out infinite}',
      '.ags-gw-dot[data-status="blocked"]{display:block;background:#F59E0B;box-shadow:0 0 8px rgba(245,158,11,0.85);animation:ags-gw-pulse 1.3s ease-in-out infinite}',
      '@keyframes ags-gw-pulse{0%,100%{opacity:.72;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}',

      '.ags-gw-sidebar-pane{flex:1 1 0;min-height:0;display:flex;flex-direction:column;gap:8px;padding:2px 10px 10px;box-sizing:border-box;overflow-y:auto;color:var(--ags-text-primary,#1F1E1D);font-family:var(--ags-font-ui,system-ui,sans-serif);user-select:none}',
      '.ags-gw-sidebar-pane[data-active="0"]{display:none}',

      '.ags-gw-hero{position:relative;overflow:hidden;padding:11px 12px;border-radius:12px;border:1px solid color-mix(in srgb,var(--ags-border,#E2E8F0) 80%,rgba(49,134,255,0.22));background:linear-gradient(135deg,rgba(49,134,255,0.09) 0%,rgba(139,92,246,0.06) 55%,rgba(56,189,248,0.04) 100%);display:flex;flex-direction:column;gap:5px}',
      'html[data-ags-mode="dark"] .ags-gw-hero{background:linear-gradient(135deg,rgba(49,134,255,0.16) 0%,rgba(139,92,246,0.10) 60%,rgba(15,23,42,0.4) 100%);border-color:rgba(96,165,250,0.24)}',
      '.ags-gw-hero-top{display:flex;align-items:center;justify-content:space-between;gap:8px}',
      '.ags-gw-hero-brand{display:inline-flex;align-items:center;gap:7px;font-size:13.5px;font-weight:600;letter-spacing:-0.01em;color:var(--ags-text-primary,#0F172A)}',
      '.ags-gw-hero-pill{font-size:10px;line-height:1;padding:3px 7px;border-radius:999px;background:rgba(49,134,255,0.12);color:#2563EB;font-weight:600;white-space:nowrap}',
      'html[data-ags-mode="dark"] .ags-gw-hero-pill{background:rgba(96,165,250,0.18);color:#93C5FD}',
      '.ags-gw-hero-sub{font-size:11px;line-height:1.4;color:var(--ags-text-secondary,#64748B)}',

      '.ags-gw-site-seg{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));height:28px;padding:2px;border-radius:9px;background:var(--ags-bg-subtle,rgba(148,163,184,0.12));border:1px solid var(--ags-border,rgba(148,163,184,0.18));box-sizing:border-box}',
      '.ags-gw-site-slider{position:absolute;top:2px;bottom:2px;left:2px;width:calc(50% - 2px);border-radius:7px;background:var(--ags-bg-surface,#FFFFFF);box-shadow:0 1px 2px rgba(0,0,0,0.08);transform:translate3d(0,0,0);transition:transform 220ms cubic-bezier(.22,1,.36,1);pointer-events:none}',
      '.ags-gw-site-seg[data-site="aistudio"] .ags-gw-site-slider{transform:translate3d(100%,0,0)}',
      '.ags-gw-site-tab{position:relative;z-index:1;appearance:none;border:none;background:transparent;color:var(--ags-text-secondary,#64748B);height:22px;padding:0 6px;border-radius:7px;font-size:11.5px;font-weight:500;font-family:inherit;cursor:pointer;white-space:nowrap;transition:color 140ms ease}',
      '.ags-gw-site-tab:hover,.ags-gw-site-tab[data-active="1"]{color:var(--ags-text-primary,#0F172A);font-weight:600}',

      '.ags-gw-new-btn{appearance:none;width:100%;height:34px;padding:0 11px;border-radius:10px;border:1px solid var(--ags-border,#E2E8F0);background:var(--ags-bg-surface,#FFFFFF);color:var(--ags-text-primary,#1F1E1D);font-size:12.5px;font-weight:500;font-family:inherit;display:flex;align-items:center;gap:8px;cursor:pointer;box-sizing:border-box;transition:background-color 140ms ease,border-color 140ms ease,transform 120ms ease}',
      '.ags-gw-new-btn:hover{background:var(--ags-bg-subtle,rgba(148,163,184,0.12));border-color:color-mix(in srgb,var(--ags-accent,#3B6CF6) 45%,var(--ags-border,#E2E8F0))}',
      '.ags-gw-new-btn:active{transform:scale(0.985)}',

      '.ags-gw-nav-list{display:flex;flex-direction:column;gap:2px;margin-top:2px}',
      '.ags-gw-nav-row{appearance:none;width:100%;height:32px;padding:0 9px;border-radius:8px;border:none;background:transparent;color:var(--ags-text-secondary,#52607A);font-size:12px;font-weight:450;font-family:inherit;display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer;text-align:left;transition:background-color 130ms ease,color 130ms ease}',
      '.ags-gw-nav-row:hover{background:var(--ags-bg-subtle,rgba(148,163,184,0.12));color:var(--ags-text-primary,#0F172A)}',
      '.ags-gw-nav-left{display:inline-flex;align-items:center;gap:8px;min-width:0;overflow:hidden}',
      '.ags-gw-nav-left span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ags-gw-nav-meta{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:var(--ags-text-secondary,#64748B);opacity:0.85;flex-shrink:0}',
      '.ags-gw-mini-dot{width:6px;height:6px;border-radius:50%;background:#94A3B8}',
      '.ags-gw-mini-dot[data-on="1"]{background:#22C55E;box-shadow:0 0 6px rgba(34,197,94,0.45)}',
      '.ags-gw-sep{height:1px;background:var(--ags-border,rgba(148,163,184,0.18));margin:4px 4px}',
      '.ags-gw-nav-row.muted{opacity:0.78}',
      '.ags-gw-nav-row.muted:hover{opacity:1}',

      '.ags-gw-foot{margin-top:auto;padding:6px 6px 2px;font-size:10.5px;line-height:1.4;color:var(--ags-text-secondary,#64748B);opacity:0.78;word-break:break-all}',

      '.ags-gw-stage{position:absolute;inset:0;z-index:45;display:flex;flex-direction:column;background:var(--ags-bg-canvas,#FAF9F5);color:var(--ags-text-primary,#1F1E1D);font-family:var(--ags-font-ui,system-ui,sans-serif);box-sizing:border-box;overflow:hidden}',
      '.ags-gw-stage[data-active="0"]{visibility:hidden;opacity:0;pointer-events:none;z-index:-1}',
      '.ags-gw-progress{position:absolute;top:0;left:0;right:0;height:2px;background:transparent;overflow:hidden;pointer-events:none;z-index:6}',
      '.ags-gw-progress[data-loading="1"]::after{content:"";position:absolute;inset:0;width:36%;background:linear-gradient(90deg,#4285F4,#8B5CF6,#38BDF8);animation:ags-gw-load 1.1s ease-in-out infinite}',
      '@keyframes ags-gw-load{0%{transform:translateX(-110%)}100%{transform:translateX(300%)}}',

      '.ags-gw-float-back{position:absolute;top:10px;left:12px;z-index:8;appearance:none;height:28px;padding:0 10px;border-radius:999px;border:1px solid var(--ags-border,rgba(148,163,184,0.28));background:var(--ags-bg-surface,rgba(255,255,255,0.92));color:var(--ags-text-primary,#1F1E1D);font-size:11.5px;font-weight:500;font-family:inherit;display:none;align-items:center;gap:5px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,0.12)}',
      '.ags-gw-float-back[data-visible="1"]{display:inline-flex}',
      '.ags-gw-float-back:hover{border-color:var(--ags-accent,#3B6CF6);color:var(--ags-accent,#3B6CF6)}',

      '.ags-gw-view-wrap{position:relative;flex:1 1 0;min-height:0;width:100%;display:flex;background:var(--ags-bg-canvas,#FAF9F5)}',
      '.ags-gw-webview{width:100%;height:100%;flex:1 1 auto;border:none;display:none;background:#FFFFFF}',
      '.ags-gw-webview[data-active="1"]{display:flex}',
      '.ags-gw-error{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:24px;background:var(--ags-bg-canvas,#FAF9F5);z-index:7}',
      '.ags-gw-error[data-visible="1"]{display:flex}',
      '.ags-gw-error-card{max-width:420px;width:100%;padding:18px 20px;border-radius:14px;background:var(--ags-bg-surface,#FFFFFF);border:1px solid var(--ags-border,#E6E2D8);box-shadow:var(--ags-shadow,0 12px 32px rgba(0,0,0,0.18));display:flex;flex-direction:column;gap:10px}',
      '.ags-gw-error-title{font-size:14px;font-weight:600;color:var(--ags-text-primary,#1F1E1D)}',
      '.ags-gw-error-desc{font-size:12px;line-height:1.55;color:var(--ags-text-secondary,#6E6B64);word-break:break-word}',
      '.ags-gw-error-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}',
      '.ags-gw-err-btn{appearance:none;height:30px;padding:0 12px;border-radius:8px;border:1px solid var(--ags-border,#E2E8F0);background:var(--ags-bg-canvas,#FAF9F5);color:var(--ags-text-primary,#1F1E1D);font-size:12px;font-family:inherit;cursor:pointer}',
      '.ags-gw-err-btn:hover{border-color:var(--ags-accent,#3B6CF6);color:var(--ags-accent,#3B6CF6)}',
      '.ags-gw-err-btn.primary{background:var(--ags-accent,#3B6CF6);border-color:var(--ags-accent,#3B6CF6);color:#FFFFFF;font-weight:500}'
    ].join('\n');
  }

  function resolveSidebarSlots(doc) {
    if (!doc || typeof doc.querySelector !== 'function') return null;
    var split = doc.querySelector('[data-testid="sidebar-split"]');
    var nav = null;
    var rightPane = null;

    var leftPane = null;
    if (split && split.children && split.children.length >= 2) {
      leftPane = split.children[0];
      rightPane = split.children[split.children.length - 1];
    } else if (split && split.children && split.children.length === 1) {
      leftPane = split.children[0];
    } else {
      leftPane = doc.querySelector('nav');
    }

    if (!leftPane) return null;

    nav = leftPane;
    var listNode = nav.querySelector
      ? nav.querySelector('[data-testid="conversation-list-sidebar"], [data-sidebar-scroll-container="true"]')
      : null;
    if (listNode) {
      var walk = listNode.parentElement;
      while (walk && walk !== leftPane) {
        if (
          walk.children &&
          walk.children.length >= 2 &&
          walk.querySelector &&
          walk.querySelector('[data-testid="new-conversation-button"], [data-testid="navigation-items"]')
        ) {
          nav = walk;
          break;
        }
        walk = walk.parentElement;
      }
    }
    if (nav === leftPane) {
      for (var unwrap = 0; unwrap < 4; unwrap++) {
        var nonIgnored = [];
        var chList = nav.children || [];
        for (var ui = 0; ui < chList.length; ui++) {
          var uc = chList[ui];
          if (uc && (!uc.getAttribute || uc.getAttribute('data-ag-studio-ignore') !== 'true')) {
            nonIgnored.push(uc);
          }
        }
        if (nonIgnored.length === 1 && nonIgnored[0].children && nonIgnored[0].children.length >= 2) {
          nav = nonIgnored[0];
        } else {
          break;
        }
      }
    }

    if (!rightPane || rightPane === leftPane || rightPane === nav) {
      var conv = doc.querySelector('[data-testid="conversation-view"]');
      var home = doc.querySelector('.agy-home');
      rightPane =
        doc.querySelector('main') ||
        (conv && conv.parentElement !== nav ? conv.parentElement : null) ||
        (home && home.parentElement !== nav ? home.parentElement : null) ||
        null;
    }

    var rawChildren = [];
    var navChildren = nav.children || [];
    for (var i = 0; i < navChildren.length; i++) {
      var ch = navChildren[i];
      if (!ch) continue;
      if (ch.getAttribute && ch.getAttribute('data-ag-studio-ignore') === 'true') continue;
      rawChildren.push(ch);
    }

    var headerSlot = null;
    var codeBodySlots = [];
    if (rawChildren.length >= 3) {
      var first = rawChildren[0];
      var hasRows = first && first.querySelector && first.querySelector('[data-testid="conversation-row-sidebar"], a[href^="/c/"]');
      if (!hasRows) {
        headerSlot = first;
        var endIdx = rawChildren.length;
        var last = rawChildren[endIdx - 1];
        if (last && last !== first && last.getBoundingClientRect) {
          var lr = last.getBoundingClientRect();
          if (lr && lr.height > 0 && lr.height <= 80 && !(last.querySelector && last.querySelector('[data-testid="conversation-row-sidebar"]'))) {
            endIdx -= 1;
          }
        }
        codeBodySlots = rawChildren.slice(1, endIdx);
      } else {
        codeBodySlots = rawChildren;
      }
    } else {
      codeBodySlots = rawChildren;
    }

    return {
      split: split,
      nav: nav,
      rightPane: rightPane,
      headerSlot: headerSlot,
      codeBodySlots: codeBodySlots
    };
  }

  function createGeminiWebController(options) {
    var opts = options || {};
    var getDoc = typeof opts.getDocument === 'function'
      ? opts.getDocument
      : function () { return typeof document !== 'undefined' ? document : null; };

    var mode = 'code'; // 'code' | 'gemini'
    var activeSite = 'gemini'; // 'gemini' | 'aistudio'
    var destroyed = false;
    var enabled = true;
    var currentCfg = {};
    var currentApi = opts.api || null;
    var lastStatus = { isGenerating: false, awaitingDecision: false };
    var onOpenSettingsCb = typeof opts.onOpenSettings === 'function' ? opts.onOpenSettings : null;

    var navEl = null;
    var dockEl = null;
    var segEl = null;
    var codeBtnEl = null;
    var geminiBtnEl = null;
    var dotEl = null;
    var sidebarPaneEl = null;
    var heroTitleEl = null;
    var heroBadgeEl = null;
    var heroSubEl = null;
    var siteSegEl = null;
    var siteTabBtns = { gemini: null, aistudio: null };
    var newBtnLabelEl = null;
    var proxyDotEl = null;
    var proxyStatusLabelEl = null;
    var footNoteEl = null;
    var stageEl = null;
    var floatBackEl = null;
    var progressEl = null;
    var viewWrapEl = null;
    var webviews = { gemini: null, aistudio: null };
    var currentUrls = { gemini: GEMINI_URL, aistudio: AISTUDIO_URL };
    var errorOverlayEl = null;
    var errorDescEl = null;
    var hiddenNodes = [];
    var observer = null;
    var syncTimer = 0;

    function getActiveWebview() {
      return webviews[activeSite] || null;
    }

    function ensureStyle(doc) {
      if (!doc || typeof doc.createElement !== 'function') return;
      var existing = typeof doc.getElementById === 'function' ? doc.getElementById(STYLE_ID) : null;
      if (existing) return;
      var target = doc.head || doc.documentElement || doc.body;
      if (!target || typeof target.appendChild !== 'function') return;
      var style = markOwned(doc.createElement('style'));
      style.id = STYLE_ID;
      style.textContent = buildStyles();
      target.appendChild(style);
    }

    function removeStyle(doc) {
      if (!doc || typeof doc.getElementById !== 'function') return;
      var existing = doc.getElementById(STYLE_ID);
      if (existing && typeof existing.remove === 'function') existing.remove();
      else if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    }

    function restoreCodeSidebar() {
      for (var i = 0; i < hiddenNodes.length; i++) {
        var n = hiddenNodes[i];
        if (n && n.classList) n.classList.remove('ags-gw-native-hidden');
      }
      hiddenNodes = [];
    }

    function updateSiteMetaUi() {
      var spec = getSiteSpec(activeSite);
      if (heroTitleEl) heroTitleEl.textContent = spec.name;
      if (heroBadgeEl) heroBadgeEl.textContent = spec.badge;
      if (heroSubEl) heroSubEl.textContent = spec.desc;
      if (siteSegEl) siteSegEl.setAttribute('data-site', activeSite);
      if (siteTabBtns.gemini) siteTabBtns.gemini.setAttribute('data-active', activeSite === 'gemini' ? '1' : '0');
      if (siteTabBtns.aistudio) siteTabBtns.aistudio.setAttribute('data-active', activeSite === 'aistudio' ? '1' : '0');
      if (newBtnLabelEl) newBtnLabelEl.textContent = activeSite === 'aistudio' ? '新建提示词 / 对话' : '发起新对话';

      var pCfg = (currentCfg && currentCfg.proxy) || {};
      var pOn = Boolean(pCfg.enabled && pCfg.proxyUrl);
      if (proxyDotEl) proxyDotEl.setAttribute('data-on', pOn ? '1' : '0');
      if (proxyStatusLabelEl) proxyStatusLabelEl.textContent = pOn ? '已开启' : '系统/直连';
      if (footNoteEl) {
        footNoteEl.textContent = pOn
          ? ('独立分区 · 代理 ' + String(pCfg.proxyUrl))
          : '独立分区 · 跟随系统或直连';
      }
    }

    function showErrorOverlay(siteId, code, desc) {
      if (siteId !== activeSite || !errorOverlayEl || !errorDescEl) return;
      var hint = '';
      if (code === -118 || code === -105 || code === -130 || code === -102 || code === -106) {
        hint = '（请确认本地代理已开启且端口正确，例如 http://127.0.0.1:7897）';
      }
      errorDescEl.textContent = '无法连接 ' + formatHostLabel(currentUrls[siteId]) + '（错误码 ' + code + (desc ? ': ' + desc : '') + '）' + hint;
      errorOverlayEl.setAttribute('data-visible', '1');
    }

    function hideErrorOverlay() {
      if (errorOverlayEl) errorOverlayEl.setAttribute('data-visible', '0');
    }

    function navigateSite(siteId, nextUrl) {
      var sid = siteId === 'aistudio' ? 'aistudio' : 'gemini';
      var spec = getSiteSpec(sid);
      var safe = sanitizeWebUrl(nextUrl || spec.url);
      currentUrls[sid] = safe;
      hideErrorOverlay();
      var wv = webviews[sid];
      if (wv) {
        if (typeof wv.loadURL === 'function') {
          try { wv.loadURL(safe); } catch (_e) { wv.setAttribute('src', safe); }
        } else {
          wv.setAttribute('src', safe);
        }
      }
    }

    function ensureWebviewForSite(doc, siteId) {
      var sid = siteId === 'aistudio' ? 'aistudio' : 'gemini';
      if (webviews[sid] && webviews[sid].parentNode === viewWrapEl) return webviews[sid];
      if (!viewWrapEl || !doc) return null;

      var wv = markOwned(doc.createElement('webview'));
      wv.className = 'ags-gw-webview';
      wv.setAttribute('partition', PARTITION_NAME);
      wv.setAttribute('allowpopups', 'true');
      wv.setAttribute('data-ags-site', sid);
      wv.setAttribute('data-active', sid === activeSite ? '1' : '0');
      wv.setAttribute('src', sanitizeWebUrl(currentUrls[sid]));
      wv.style.width = '100%';
      wv.style.height = '100%';
      wv.style.flex = '1';
      wv.style.border = 'none';

      wv.addEventListener('did-start-loading', function () {
        if (sid === activeSite) {
          hideErrorOverlay();
          if (progressEl) progressEl.setAttribute('data-loading', '1');
        }
      });
      wv.addEventListener('did-stop-loading', function () {
        if (sid === activeSite && progressEl) progressEl.setAttribute('data-loading', '0');
      });
      wv.addEventListener('did-navigate', function (e) {
        if (e && e.url) currentUrls[sid] = sanitizeWebUrl(e.url);
      });
      wv.addEventListener('did-navigate-in-page', function (e) {
        if (e && e.isMainFrame !== false && e.url) currentUrls[sid] = sanitizeWebUrl(e.url);
      });
      wv.addEventListener('did-fail-load', function (e) {
        if (sid === activeSite && progressEl) progressEl.setAttribute('data-loading', '0');
        if (!e || e.errorCode === -3 || e.isMainFrame === false) return;
        showErrorOverlay(sid, e.errorCode, e.errorDescription || '');
      });

      viewWrapEl.appendChild(wv);
      webviews[sid] = wv;
      return wv;
    }

    function makeNavRow(doc, labelText, iconPaths, onClick, optsRow) {
      var rowOpts = optsRow || {};
      var row = doc.createElement('button');
      row.type = 'button';
      row.className = 'ags-gw-nav-row' + (rowOpts.muted ? ' muted' : '');
      var left = doc.createElement('span');
      left.className = 'ags-gw-nav-left';
      var ico = makeIconSvg(doc, iconPaths, 14);
      if (ico) left.appendChild(ico);
      var lbl = doc.createElement('span');
      lbl.textContent = labelText;
      left.appendChild(lbl);
      row.appendChild(left);
      if (rowOpts.trailingEl) {
        row.appendChild(rowOpts.trailingEl);
      }
      row.addEventListener('click', onClick);
      return { row: row, labelEl: lbl };
    }

    function ensureDockAndSidebar(doc, slots) {
      var nav = slots.nav;
      navEl = nav;

      if (!dockEl || dockEl.parentElement !== nav) {
        if (dockEl && dockEl.parentNode) dockEl.parentNode.removeChild(dockEl);
        dockEl = markOwned(doc.createElement('div'));
        dockEl.className = 'ags-gw-dock';
        dockEl.setAttribute('data-testid', 'ags-gemini-mode-dock');

        segEl = doc.createElement('div');
        segEl.className = 'ags-gw-seg';
        segEl.setAttribute('role', 'tablist');
        segEl.setAttribute('data-mode', mode);

        var slider = doc.createElement('span');
        slider.className = 'ags-gw-slider';
        segEl.appendChild(slider);

        codeBtnEl = doc.createElement('button');
        codeBtnEl.type = 'button';
        codeBtnEl.className = 'ags-gw-mode-btn';
        codeBtnEl.setAttribute('data-mode-btn', 'code');
        var codeIcon = makeIconSvg(doc, ['M8 6L2 12L8 18', 'M16 6L22 12L16 18', 'M13.5 4.5L10.5 19.5'], 12);
        if (codeIcon) codeBtnEl.appendChild(codeIcon);
        var codeLabel = doc.createElement('span');
        codeLabel.textContent = 'Code';
        codeBtnEl.appendChild(codeLabel);
        dotEl = doc.createElement('span');
        dotEl.className = 'ags-gw-dot';
        codeBtnEl.appendChild(dotEl);
        codeBtnEl.addEventListener('click', function () {
          setMode('code');
        });

        geminiBtnEl = doc.createElement('button');
        geminiBtnEl.type = 'button';
        geminiBtnEl.className = 'ags-gw-mode-btn';
        geminiBtnEl.setAttribute('data-mode-btn', 'gemini');
        var gemIcon = makeGeminiBrandSvg(doc, 13);
        if (gemIcon) geminiBtnEl.appendChild(gemIcon);
        var gemLabel = doc.createElement('span');
        gemLabel.textContent = 'Gemini';
        geminiBtnEl.appendChild(gemLabel);
        geminiBtnEl.addEventListener('click', function () {
          setMode('gemini');
        });

        segEl.appendChild(codeBtnEl);
        segEl.appendChild(geminiBtnEl);
        dockEl.appendChild(segEl);

        var refNode = slots.headerSlot ? slots.headerSlot.nextSibling : nav.firstChild;
        if (refNode && refNode.parentNode === nav) {
          nav.insertBefore(dockEl, refNode);
        } else {
          nav.appendChild(dockEl);
        }
      }

      if (!sidebarPaneEl || sidebarPaneEl.parentElement !== nav) {
        if (sidebarPaneEl && sidebarPaneEl.parentNode) sidebarPaneEl.parentNode.removeChild(sidebarPaneEl);
        sidebarPaneEl = markOwned(doc.createElement('div'));
        sidebarPaneEl.className = 'ags-gw-sidebar-pane';
        sidebarPaneEl.setAttribute('data-active', mode === 'gemini' ? '1' : '0');

        // 1. Minimalist Brand Hero Card
        var hero = doc.createElement('div');
        hero.className = 'ags-gw-hero';
        var heroTop = doc.createElement('div');
        heroTop.className = 'ags-gw-hero-top';
        var brand = doc.createElement('div');
        brand.className = 'ags-gw-hero-brand';
        var star = makeGeminiBrandSvg(doc, 18);
        if (star) brand.appendChild(star);
        heroTitleEl = doc.createElement('span');
        heroTitleEl.textContent = 'Gemini';
        brand.appendChild(heroTitleEl);
        heroBadgeEl = doc.createElement('span');
        heroBadgeEl.className = 'ags-gw-hero-pill';
        heroBadgeEl.textContent = '独立额度';
        heroTop.appendChild(brand);
        heroTop.appendChild(heroBadgeEl);
        hero.appendChild(heroTop);

        heroSubEl = doc.createElement('div');
        heroSubEl.className = 'ags-gw-hero-sub';
        heroSubEl.textContent = '使用网页端额度 · 不占客户端配额';
        hero.appendChild(heroSubEl);
        sidebarPaneEl.appendChild(hero);

        // 2. Compact 2-Tab Switcher: Gemini | AI Studio
        siteSegEl = doc.createElement('div');
        siteSegEl.className = 'ags-gw-site-seg';
        siteSegEl.setAttribute('role', 'tablist');
        siteSegEl.setAttribute('data-site', activeSite);
        var siteSlider = doc.createElement('span');
        siteSlider.className = 'ags-gw-site-slider';
        siteSegEl.appendChild(siteSlider);

        for (var si = 0; si < PRESET_SITES.length; si++) {
          (function (spec) {
            var tab = doc.createElement('button');
            tab.type = 'button';
            tab.className = 'ags-gw-site-tab';
            tab.setAttribute('data-site-tab', spec.id);
            tab.textContent = spec.label;
            tab.addEventListener('click', function () {
              setSite(spec.id);
            });
            siteSegEl.appendChild(tab);
            siteTabBtns[spec.id] = tab;
          })(PRESET_SITES[si]);
        }
        sidebarPaneEl.appendChild(siteSegEl);

        // 3. Native-style Primary Action
        var newBtn = doc.createElement('button');
        newBtn.type = 'button';
        newBtn.className = 'ags-gw-new-btn';
        var plusIco = makeIconSvg(doc, ['M12 5V19', 'M5 12H19'], 14);
        if (plusIco) newBtn.appendChild(plusIco);
        newBtnLabelEl = doc.createElement('span');
        newBtnLabelEl.textContent = '发起新对话';
        newBtn.appendChild(newBtnLabelEl);
        newBtn.addEventListener('click', function () {
          var spec = getSiteSpec(activeSite);
          navigateSite(activeSite, spec.url);
        });
        sidebarPaneEl.appendChild(newBtn);

        // 4. Borderless Native Action Rows
        var navList = doc.createElement('div');
        navList.className = 'ags-gw-nav-list';

        navList.appendChild(
          makeNavRow(
            doc,
            '刷新页面',
            ['M21 12A9 9 0 1 1 18.36 5.64', 'M21 3V8H16'],
            function () {
              var wv = getActiveWebview();
              if (wv && typeof wv.reload === 'function') wv.reload();
              else navigateSite(activeSite, currentUrls[activeSite]);
            }
          ).row
        );

        navList.appendChild(
          makeNavRow(
            doc,
            '返回上一页',
            ['M19 12H5', 'M12 19L5 12L12 5'],
            function () {
              var wv = getActiveWebview();
              if (wv && typeof wv.canGoBack === 'function' && wv.canGoBack()) {
                wv.goBack();
              }
            }
          ).row
        );

        navList.appendChild(
          makeNavRow(
            doc,
            '在外部浏览器打开',
            ['M14 3H21V10', 'M10 14L21 3', 'M21 14V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H10'],
            function () { openCurrentExternal(); }
          ).row
        );

        var proxyTrail = doc.createElement('span');
        proxyTrail.className = 'ags-gw-nav-meta';
        proxyDotEl = doc.createElement('span');
        proxyDotEl.className = 'ags-gw-mini-dot';
        proxyStatusLabelEl = doc.createElement('span');
        proxyTrail.appendChild(proxyDotEl);
        proxyTrail.appendChild(proxyStatusLabelEl);

        navList.appendChild(
          makeNavRow(
            doc,
            '代理设置',
            ['M12 15A3 3 0 1 0 12 9A3 3 0 0 0 12 15Z', 'M19.4 15A1.65 1.65 0 0 0 19.73 16.82L19.79 16.88A2 2 0 1 1 16.96 19.71L16.9 19.65A1.65 1.65 0 0 0 15.08 19.32A1.65 1.65 0 0 0 14 20.91V21A2 2 0 1 1 10 21V20.91A1.65 1.65 0 0 0 8.92 19.32A1.65 1.65 0 0 0 7.1 19.65L7.04 19.71A2 2 0 1 1 4.21 16.88L4.27 16.82A1.65 1.65 0 0 0 4.6 15A1.65 1.65 0 0 0 3.09 14H3A2 2 0 1 1 3 10H3.09A1.65 1.65 0 0 0 4.6 8.92A1.65 1.65 0 0 0 4.27 7.1L4.21 7.04A2 2 0 1 1 7.04 4.21L7.1 4.27A1.65 1.65 0 0 0 8.92 4.6H9A1.65 1.65 0 0 0 10 3.09V3A2 2 0 1 1 14 3V3.09A1.65 1.65 0 0 0 15.08 4.6A1.65 1.65 0 0 0 16.9 4.27L16.96 4.21A2 2 0 1 1 19.79 7.04L19.73 7.1A1.65 1.65 0 0 0 19.4 8.92V9A1.65 1.65 0 0 0 20.91 10H21A2 2 0 1 1 21 14H20.91A1.65 1.65 0 0 0 19.4 15Z'],
            function () {
              if (typeof onOpenSettingsCb === 'function') onOpenSettingsCb();
            },
            { trailingEl: proxyTrail }
          ).row
        );

        var sep = doc.createElement('div');
        sep.className = 'ags-gw-sep';
        navList.appendChild(sep);

        navList.appendChild(
          makeNavRow(
            doc,
            '重置登录态',
            ['M9 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H9', 'M16 17L21 12L16 7', 'M21 12H9'],
            function () { clearWebSession(); },
            { muted: true }
          ).row
        );

        sidebarPaneEl.appendChild(navList);

        footNoteEl = doc.createElement('div');
        footNoteEl.className = 'ags-gw-foot';
        sidebarPaneEl.appendChild(footNoteEl);

        var dockIdx = Array.prototype.indexOf.call(nav.children || [], dockEl);
        if (dockIdx >= 0 && nav.children[dockIdx + 1]) {
          nav.insertBefore(sidebarPaneEl, nav.children[dockIdx + 1]);
        } else {
          nav.appendChild(sidebarPaneEl);
        }
      }

      updateSiteMetaUi();
    }

    function ensureStage(doc, rightPane) {
      if (!rightPane) return;
      if (typeof getComputedStyle === 'function') {
        try {
          var pos = getComputedStyle(rightPane).position;
          if (!pos || pos === 'static') {
            rightPane.style.position = 'relative';
          }
        } catch (_e) {
          if (!rightPane.style.position) rightPane.style.position = 'relative';
        }
      } else if (!rightPane.style.position) {
        rightPane.style.position = 'relative';
      }

      if (!stageEl || stageEl.parentElement !== rightPane) {
        if (stageEl && stageEl.parentNode) stageEl.parentNode.removeChild(stageEl);
        stageEl = markOwned(doc.createElement('div'));
        stageEl.className = 'ags-gw-stage';
        stageEl.setAttribute('data-ags-gemini-web-stage', '1');
        stageEl.setAttribute('data-active', mode === 'gemini' ? '1' : '0');

        progressEl = doc.createElement('div');
        progressEl.className = 'ags-gw-progress';
        progressEl.setAttribute('data-loading', '0');
        stageEl.appendChild(progressEl);

        floatBackEl = doc.createElement('button');
        floatBackEl.type = 'button';
        floatBackEl.className = 'ags-gw-float-back';
        floatBackEl.setAttribute('data-visible', '0');
        floatBackEl.textContent = '← 返回 Code';
        floatBackEl.addEventListener('click', function () { setMode('code'); });
        stageEl.appendChild(floatBackEl);

        viewWrapEl = doc.createElement('div');
        viewWrapEl.className = 'ags-gw-view-wrap';

        errorOverlayEl = doc.createElement('div');
        errorOverlayEl.className = 'ags-gw-error';
        errorOverlayEl.setAttribute('data-visible', '0');
        var errCard = doc.createElement('div');
        errCard.className = 'ags-gw-error-card';
        var errTitle = doc.createElement('div');
        errTitle.className = 'ags-gw-error-title';
        errTitle.textContent = '网页加载失败';
        errorDescEl = doc.createElement('div');
        errorDescEl.className = 'ags-gw-error-desc';
        var errActs = doc.createElement('div');
        errActs.className = 'ags-gw-error-acts';
        var retryBtn = doc.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'ags-gw-err-btn primary';
        retryBtn.textContent = '重试加载';
        retryBtn.addEventListener('click', function () {
          hideErrorOverlay();
          var wv = getActiveWebview();
          if (wv && typeof wv.reload === 'function') wv.reload();
          else navigateSite(activeSite, currentUrls[activeSite]);
        });
        var proxyBtn = doc.createElement('button');
        proxyBtn.type = 'button';
        proxyBtn.className = 'ags-gw-err-btn';
        proxyBtn.textContent = '打开代理设置';
        proxyBtn.addEventListener('click', function () {
          if (typeof onOpenSettingsCb === 'function') onOpenSettingsCb();
        });
        errActs.appendChild(retryBtn);
        errActs.appendChild(proxyBtn);
        errCard.appendChild(errTitle);
        errCard.appendChild(errorDescEl);
        errCard.appendChild(errActs);
        errorOverlayEl.appendChild(errCard);
        viewWrapEl.appendChild(errorOverlayEl);
        stageEl.appendChild(viewWrapEl);

        rightPane.appendChild(stageEl);
      }

      if (floatBackEl && navEl && navEl.getBoundingClientRect) {
        try {
          var nr = navEl.getBoundingClientRect();
          var isCollapsed = Boolean(nr && nr.width > 0 && nr.width < 60) || (nr && nr.width === 0 && mode === 'gemini' && navEl.offsetWidth === 0);
          floatBackEl.setAttribute('data-visible', mode === 'gemini' && isCollapsed ? '1' : '0');
        } catch (_e) {}
      }
    }

    function openCurrentExternal() {
      var wv = getActiveWebview();
      var safe = sanitizeWebUrl(
        (wv && typeof wv.getURL === 'function' && wv.getURL()) || currentUrls[activeSite]
      );
      if (currentApi && typeof currentApi.openGeminiWebExternal === 'function') {
        void currentApi.openGeminiWebExternal(safe);
      } else if (typeof window !== 'undefined' && typeof window.open === 'function') {
        try { window.open(safe, '_blank', 'noopener,noreferrer'); } catch (_e) {}
      }
    }

    function clearWebSession() {
      var reloadAny = function () {
        hideErrorOverlay();
        if (webviews.gemini) navigateSite('gemini', GEMINI_URL);
        if (webviews.aistudio) navigateSite('aistudio', AISTUDIO_URL);
      };
      if (currentApi && typeof currentApi.clearGeminiWebSession === 'function') {
        Promise.resolve(currentApi.clearGeminiWebSession()).then(reloadAny).catch(reloadAny);
      } else {
        reloadAny();
      }
    }

    function applyModeState() {
      var doc = getDoc();
      if (!doc || destroyed || !enabled) return;

      var slots = resolveSidebarSlots(doc);
      if (!slots) return;

      ensureStyle(doc);
      ensureDockAndSidebar(doc, slots);
      ensureStage(doc, slots.rightPane);

      if (segEl) segEl.setAttribute('data-mode', mode);
      if (codeBtnEl) codeBtnEl.setAttribute('data-active', mode === 'code' ? '1' : '0');
      if (geminiBtnEl) geminiBtnEl.setAttribute('data-active', mode === 'gemini' ? '1' : '0');

      if (dotEl) {
        if (mode === 'gemini' && lastStatus.awaitingDecision) {
          dotEl.setAttribute('data-status', 'blocked');
        } else if (mode === 'gemini' && lastStatus.isGenerating) {
          dotEl.setAttribute('data-status', 'running');
        } else {
          dotEl.removeAttribute('data-status');
        }
      }

      if (mode === 'gemini') {
        restoreCodeSidebar();
        for (var i = 0; i < slots.codeBodySlots.length; i++) {
          var n = slots.codeBodySlots[i];
          if (n && n.classList && n !== dockEl && n !== sidebarPaneEl) {
            n.classList.add('ags-gw-native-hidden');
            hiddenNodes.push(n);
          }
        }
        if (sidebarPaneEl) sidebarPaneEl.setAttribute('data-active', '1');
        if (stageEl) stageEl.setAttribute('data-active', '1');
        ensureWebviewForSite(doc, activeSite);
        if (webviews.gemini) webviews.gemini.setAttribute('data-active', activeSite === 'gemini' ? '1' : '0');
        if (webviews.aistudio) webviews.aistudio.setAttribute('data-active', activeSite === 'aistudio' ? '1' : '0');
        updateSiteMetaUi();
      } else {
        restoreCodeSidebar();
        if (sidebarPaneEl) sidebarPaneEl.setAttribute('data-active', '0');
        if (stageEl) stageEl.setAttribute('data-active', '0');
      }

      if (doc.documentElement && typeof doc.documentElement.setAttribute === 'function') {
        doc.documentElement.setAttribute('data-ags-gemini-mode', mode);
      }
    }

    function disconnectObserver() {
      if (syncTimer) {
        clearTimeout(syncTimer);
        syncTimer = 0;
      }
      if (observer) {
        try { observer.disconnect(); } catch (_e) {}
        observer = null;
      }
    }

    function ensureObserver(doc) {
      if (observer || destroyed || !enabled || !doc || typeof MutationObserver !== 'function') return;
      var rootTarget = doc.body || doc.documentElement;
      if (!rootTarget) return;
      observer = new MutationObserver(function (mutations) {
        if (destroyed || !enabled) return;
        for (var i = 0; i < mutations.length; i++) {
          var t = mutations[i].target;
          if (t && t.getAttribute && t.getAttribute('data-ag-studio-ignore') === 'true') continue;
          if (!syncTimer) {
            syncTimer = setTimeout(function () {
              syncTimer = 0;
              if (!destroyed && enabled) applyModeState();
            }, 60);
          }
          break;
        }
      });
      observer.observe(rootTarget, { childList: true, subtree: true });
    }

    function cleanupAll() {
      disconnectObserver();
      restoreCodeSidebar();
      ['gemini', 'aistudio'].forEach(function (k) {
        if (webviews[k] && webviews[k].parentNode) webviews[k].parentNode.removeChild(webviews[k]);
        webviews[k] = null;
      });
      if (stageEl && stageEl.parentNode) stageEl.parentNode.removeChild(stageEl);
      stageEl = null;
      floatBackEl = null;
      progressEl = null;
      viewWrapEl = null;
      errorOverlayEl = null;
      errorDescEl = null;
      if (sidebarPaneEl && sidebarPaneEl.parentNode) sidebarPaneEl.parentNode.removeChild(sidebarPaneEl);
      sidebarPaneEl = null;
      heroTitleEl = null;
      heroBadgeEl = null;
      heroSubEl = null;
      siteSegEl = null;
      siteTabBtns = { gemini: null, aistudio: null };
      newBtnLabelEl = null;
      proxyDotEl = null;
      proxyStatusLabelEl = null;
      footNoteEl = null;
      if (dockEl && dockEl.parentNode) dockEl.parentNode.removeChild(dockEl);
      dockEl = null;
      segEl = null;
      codeBtnEl = null;
      geminiBtnEl = null;
      dotEl = null;
      var doc = getDoc();
      removeStyle(doc);
      if (doc && doc.documentElement && typeof doc.documentElement.removeAttribute === 'function') {
        doc.documentElement.removeAttribute('data-ags-gemini-mode');
      }
    }

    function setMode(nextMode) {
      if (destroyed) return mode;
      mode = nextMode === 'gemini' ? 'gemini' : 'code';
      applyModeState();
      return mode;
    }

    function setSite(nextSite) {
      if (destroyed) return activeSite;
      activeSite = nextSite === 'aistudio' ? 'aistudio' : 'gemini';
      hideErrorOverlay();
      if (mode !== 'gemini') {
        mode = 'gemini';
      }
      applyModeState();
      return activeSite;
    }

    function sync(params) {
      if (destroyed) return;
      var p = params || {};
      var cfg = p.cfg || (p.geminiWeb ? p : currentCfg) || {};
      currentCfg = cfg;
      if (p.api !== undefined) currentApi = p.api;
      if (typeof p.onOpenSettings === 'function') onOpenSettingsCb = p.onOpenSettings;
      if (typeof p.isGenerating === 'boolean') lastStatus.isGenerating = p.isGenerating;
      if (typeof p.awaitingDecision === 'boolean') lastStatus.awaitingDecision = p.awaitingDecision;

      var gw = (cfg && cfg.geminiWeb) || {};
      var nextEnabled = gw.enabled !== false;

      if (!nextEnabled) {
        enabled = false;
        mode = 'code';
        cleanupAll();
        return;
      }

      enabled = true;
      var doc = getDoc();
      ensureObserver(doc);
      applyModeState();
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      enabled = false;
      mode = 'code';
      cleanupAll();
      currentApi = null;
    }

    return {
      sync: sync,
      setMode: setMode,
      getMode: function () { return mode; },
      setSite: setSite,
      getSite: function () { return activeSite; },
      navigate: function (urlOrSite, maybeUrl) {
        if (urlOrSite === 'gemini' || urlOrSite === 'aistudio') {
          navigateSite(urlOrSite, maybeUrl);
        } else {
          navigateSite(activeSite, urlOrSite);
        }
      },
      destroy: destroy
    };
  }

  var exported = {
    createGeminiWebController: createGeminiWebController,
    PRESET_SITES: PRESET_SITES,
    GEMINI_URL: GEMINI_URL,
    AISTUDIO_URL: AISTUDIO_URL,
    PARTITION_NAME: PARTITION_NAME,
    sanitizeWebUrl: sanitizeWebUrl
  };

  if (typeof window !== 'undefined') {
    window.__AG_STUDIO_GEMINI_WEB__ = exported;
  }
  if (globalScope && globalScope !== (typeof window !== 'undefined' ? window : null)) {
    globalScope.__AG_STUDIO_GEMINI_WEB__ = exported;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
})(typeof window !== 'undefined' ? window : globalThis);
