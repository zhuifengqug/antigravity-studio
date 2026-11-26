(function (globalScope) {
  'use strict';

  var STYLE_ID = 'ag-studio-gemini-web-style';
  var PARTITION_NAME = 'persist:ag-studio-gemini-web';
  var DEFAULT_URL = 'https://gemini.google.com/app';

  var PRESET_SITES = [
    { id: 'gemini', label: 'Gemini', name: 'Gemini 网页版', url: 'https://gemini.google.com/app' },
    { id: 'aistudio', label: 'AI Studio', name: 'Google AI Studio', url: 'https://aistudio.google.com' },
    { id: 'chatgpt', label: 'ChatGPT', name: 'ChatGPT', url: 'https://chatgpt.com' },
    { id: 'claude', label: 'Claude', name: 'Claude', url: 'https://claude.ai' },
    { id: 'deepseek', label: 'DeepSeek', name: 'DeepSeek', url: 'https://chat.deepseek.com' }
  ];

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function sanitizeWebUrl(raw) {
    var input = String(raw || '').trim();
    if (!input) return DEFAULT_URL;
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
    return DEFAULT_URL;
  }

  function matchSiteByUrl(url) {
    var safe = sanitizeWebUrl(url);
    try {
      var host = new URL(safe).hostname.toLowerCase();
      for (var i = 0; i < PRESET_SITES.length; i++) {
        var sh = new URL(PRESET_SITES[i].url).hostname.toLowerCase();
        if (host === sh || host.endsWith('.' + sh)) {
          return PRESET_SITES[i];
        }
      }
    } catch (_e) {}
    return { id: 'custom', label: 'Web AI', name: '自定义网页 AI', url: safe };
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
      svg.setAttribute('width', String(size || 13));
      svg.setAttribute('height', String(size || 13));
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < paths.length; i++) {
        var p = doc.createElementNS(SVG_NS, 'path');
        p.setAttribute('d', paths[i]);
        svg.appendChild(p);
      }
      return svg;
    } catch (_e) {
      var sp = doc.createElement('span');
      return sp;
    }
  }

  function buildStyles() {
    return [
      '.ags-gw-native-hidden{display:none!important}',
      '.ags-gw-dock{padding:4px 8px 6px;flex-shrink:0;box-sizing:border-box;user-select:none}',
      '.ags-gw-seg{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));padding:3px;border-radius:999px;background:var(--ags-bg-subtle,rgba(148,163,184,0.14));border:1px solid var(--ags-border,rgba(148,163,184,0.22));box-sizing:border-box}',
      '.ags-gw-slider{position:absolute;top:3px;bottom:3px;left:3px;width:calc(50% - 3px);border-radius:999px;background:var(--ags-bg-surface,#FFFFFF);box-shadow:0 1px 4px rgba(0,0,0,0.16),inset 0 1px 0 rgba(255,255,255,0.08);transform:translate3d(0,0,0);transition:transform 260ms cubic-bezier(.22,1,.36,1);pointer-events:none;z-index:0}',
      '.ags-gw-seg[data-mode="gemini"] .ags-gw-slider{transform:translate3d(100%,0,0)}',
      '.ags-gw-mode-btn{position:relative;z-index:1;appearance:none;border:none;background:transparent;color:var(--ags-text-secondary,#6E6B64);height:25px;padding:0 8px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;gap:5px;font-size:11.5px;font-weight:500;font-family:var(--ags-font-ui,system-ui,sans-serif);cursor:pointer;white-space:nowrap;transition:color 160ms ease,transform 140ms ease}',
      '.ags-gw-mode-btn:hover,.ags-gw-mode-btn[data-active="1"]{color:var(--ags-text-primary,#1F1E1D);font-weight:600}',
      '.ags-gw-mode-btn:active{transform:scale(0.95)}',
      '.ags-gw-dot{position:absolute;top:4px;right:7px;width:7px;height:7px;border-radius:999px;display:none;pointer-events:none}',
      '.ags-gw-dot[data-status="running"]{display:block;background:#3B82F6;box-shadow:0 0 8px rgba(59,130,246,0.75);animation:ags-gw-pulse 1.8s ease-in-out infinite}',
      '.ags-gw-dot[data-status="blocked"]{display:block;background:#F59E0B;box-shadow:0 0 8px rgba(245,158,11,0.85);animation:ags-gw-pulse 1.3s ease-in-out infinite}',
      '@keyframes ags-gw-pulse{0%,100%{opacity:.72;transform:scale(1)}50%{opacity:1;transform:scale(1.22)}}',
      '.ags-gw-sidebar-pane{flex:1 1 0;min-height:0;display:flex;flex-direction:column;gap:10px;padding:8px 10px 10px;box-sizing:border-box;overflow-y:auto;color:var(--ags-text-primary,#1F1E1D);font-family:var(--ags-font-ui,system-ui,sans-serif);user-select:none}',
      '.ags-gw-sidebar-pane[data-active="0"]{display:none}',
      '.ags-gw-sb-card{display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:10px;background:var(--ags-bg-surface,#FFFFFF);border:1px solid var(--ags-border,#E6E2D8)}',
      '.ags-gw-sb-head{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:11.5px;font-weight:600;color:var(--ags-text-primary,#1F1E1D)}',
      '.ags-gw-sb-badge{font-size:10px;padding:2px 6px;border-radius:999px;background:var(--ags-accent-soft,rgba(59,108,246,0.14));color:var(--ags-accent,#3B6CF6);font-weight:600;white-space:nowrap}',
      '.ags-gw-sb-sub{font-size:11px;line-height:1.45;color:var(--ags-text-secondary,#6E6B64)}',
      '.ags-gw-site-list{display:flex;flex-direction:column;gap:4px}',
      '.ags-gw-site-btn{appearance:none;width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 9px;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--ags-text-secondary,#6E6B64);font-size:12px;font-family:inherit;cursor:pointer;text-align:left;transition:background-color 140ms ease,color 140ms ease,border-color 140ms ease}',
      '.ags-gw-site-btn:hover{background:var(--ags-bg-subtle,rgba(148,163,184,0.12));color:var(--ags-text-primary,#1F1E1D)}',
      '.ags-gw-site-btn[data-active="1"]{background:var(--ags-accent-soft,rgba(59,108,246,0.14));border-color:var(--ags-accent,#3B6CF6);color:var(--ags-accent,#3B6CF6);font-weight:600}',
      '.ags-gw-sb-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
      '.ags-gw-sb-act-btn{appearance:none;padding:6px 8px;border-radius:8px;border:1px solid var(--ags-border,#E6E2D8);background:var(--ags-bg-canvas,#FAF9F5);color:var(--ags-text-primary,#1F1E1D);font-size:11.5px;font-family:inherit;cursor:pointer;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ags-gw-sb-act-btn:hover{border-color:var(--ags-accent,#3B6CF6);color:var(--ags-accent,#3B6CF6)}',
      '.ags-gw-sb-act-btn.primary{background:var(--ags-accent,#3B6CF6);border-color:var(--ags-accent,#3B6CF6);color:#FFFFFF;font-weight:600;grid-column:1 / -1}',
      '.ags-gw-sb-act-btn.primary:hover{filter:brightness(1.06);color:#FFFFFF}',
      '.ags-gw-stage{position:absolute;inset:0;z-index:45;display:flex;flex-direction:column;background:var(--ags-bg-canvas,#FAF9F5);color:var(--ags-text-primary,#1F1E1D);font-family:var(--ags-font-ui,system-ui,sans-serif);box-sizing:border-box;overflow:hidden}',
      '.ags-gw-stage[data-active="0"]{visibility:hidden;opacity:0;pointer-events:none;z-index:-1}',
      '.ags-gw-toolbar{height:38px;min-height:38px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 12px;background:var(--ags-bg-sidebar,#F4F1EA);border-bottom:1px solid var(--ags-border,#E6E2D8);box-sizing:border-box;-webkit-app-region:drag;user-select:none}',
      '.ags-gw-toolbar[data-top-clearance="1"]{padding-right:148px}',
      '.ags-gw-tb-group{display:flex;align-items:center;gap:5px;-webkit-app-region:no-drag;min-width:0}',
      '.ags-gw-tb-btn{appearance:none;height:25px;padding:0 8px;border-radius:7px;border:1px solid var(--ags-border,#E6E2D8);background:var(--ags-bg-surface,#FFFFFF);color:var(--ags-text-primary,#1F1E1D);font-size:11.5px;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:4px;cursor:pointer;white-space:nowrap}',
      '.ags-gw-tb-btn:hover{border-color:var(--ags-accent,#3B6CF6);color:var(--ags-accent,#3B6CF6)}',
      '.ags-gw-tb-btn[data-active="1"]{background:var(--ags-accent-soft,rgba(59,108,246,0.14));border-color:var(--ags-accent,#3B6CF6);color:var(--ags-accent,#3B6CF6);font-weight:600}',
      '.ags-gw-tb-status{font-size:11.5px;color:var(--ags-text-secondary,#6E6B64);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px}',
      '.ags-gw-progress{height:2px;width:100%;background:transparent;position:relative;overflow:hidden;flex-shrink:0}',
      '.ags-gw-progress[data-loading="1"]::after{content:"";position:absolute;inset:0;width:36%;background:var(--ags-accent,#3B6CF6);animation:ags-gw-load 1.1s ease-in-out infinite}',
      '@keyframes ags-gw-load{0%{transform:translateX(-110%)}100%{transform:translateX(300%)}}',
      '.ags-gw-view-wrap{position:relative;flex:1 1 0;min-height:0;width:100%;display:flex;background:var(--ags-bg-canvas,#FAF9F5)}',
      '.ags-gw-webview{width:100%;height:100%;flex:1 1 auto;border:none;display:flex;background:#FFFFFF}',
      '.ags-gw-error{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:24px;background:var(--ags-bg-canvas,#FAF9F5);z-index:5}',
      '.ags-gw-error[data-visible="1"]{display:flex}',
      '.ags-gw-error-card{max-width:440px;width:100%;padding:18px 20px;border-radius:14px;background:var(--ags-bg-surface,#FFFFFF);border:1px solid var(--ags-border,#E6E2D8);box-shadow:var(--ags-shadow,0 12px 32px rgba(0,0,0,0.22));display:flex;flex-direction:column;gap:10px}',
      '.ags-gw-error-title{font-size:14px;font-weight:600;color:var(--ags-text-primary,#1F1E1D)}',
      '.ags-gw-error-desc{font-size:12px;line-height:1.55;color:var(--ags-text-secondary,#6E6B64);word-break:break-word}',
      '.ags-gw-error-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}'
    ].join('\n');
  }

  function resolveSidebarSlots(doc) {
    if (!doc || typeof doc.querySelector !== 'function') return null;
    var split = doc.querySelector('[data-testid="sidebar-split"]');
    var nav = null;
    var rightPane = null;

    if (split && split.children && split.children.length >= 2) {
      nav = split.children[0];
      rightPane = split.children[split.children.length - 1];
    } else if (split && split.children && split.children.length === 1) {
      nav = split.children[0];
    } else {
      nav = doc.querySelector('nav');
    }

    if (!nav) return null;

    if (!rightPane || rightPane === nav) {
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
    var destroyed = false;
    var enabled = true;
    var currentCfg = {};
    var currentApi = opts.api || null;
    var currentUrl = DEFAULT_URL;
    var lastStatus = { isGenerating: false, awaitingDecision: false };
    var onOpenSettingsCb = typeof opts.onOpenSettings === 'function' ? opts.onOpenSettings : null;

    var navEl = null;
    var rightPaneEl = null;
    var dockEl = null;
    var segEl = null;
    var codeBtnEl = null;
    var geminiBtnEl = null;
    var dotEl = null;
    var sidebarPaneEl = null;
    var stageEl = null;
    var toolbarEl = null;
    var statusTextEl = null;
    var progressEl = null;
    var viewWrapEl = null;
    var webviewEl = null;
    var errorOverlayEl = null;
    var errorDescEl = null;
    var hiddenNodes = [];
    var siteButtons = [];
    var toolbarSiteButtons = [];
    var observer = null;
    var syncTimer = 0;

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

    function updateActiveSiteUi() {
      var activeSite = matchSiteByUrl(currentUrl);
      for (var i = 0; i < siteButtons.length; i++) {
        var b = siteButtons[i];
        var sid = b.getAttribute('data-site-id');
        b.setAttribute('data-active', sid === activeSite.id ? '1' : '0');
      }
      for (var j = 0; j < toolbarSiteButtons.length; j++) {
        var tb = toolbarSiteButtons[j];
        var tsid = tb.getAttribute('data-site-id');
        tb.setAttribute('data-active', tsid === activeSite.id ? '1' : '0');
      }
      if (statusTextEl && (!webviewEl || !webviewEl._hasCustomTitle)) {
        statusTextEl.textContent = activeSite.label + ' · ' + formatHostLabel(currentUrl) + '（网页独立额度）';
      }
    }

    function showErrorOverlay(code, desc) {
      if (!errorOverlayEl || !errorDescEl) return;
      var hint = '';
      if (code === -118 || code === -105 || code === -130 || code === -102 || code === -106) {
        hint = '（请确认本地代理已开启且端口正确，例如 http://127.0.0.1:7897）';
      }
      errorDescEl.textContent = '无法加载 ' + formatHostLabel(currentUrl) + '（错误码 ' + code + (desc ? ': ' + desc : '') + '）' + hint;
      errorOverlayEl.setAttribute('data-visible', '1');
    }

    function hideErrorOverlay() {
      if (errorOverlayEl) errorOverlayEl.setAttribute('data-visible', '0');
    }

    function navigateToUrl(nextUrl) {
      currentUrl = sanitizeWebUrl(nextUrl);
      hideErrorOverlay();
      if (webviewEl) {
        webviewEl._hasCustomTitle = false;
        if (typeof webviewEl.loadURL === 'function') {
          try { webviewEl.loadURL(currentUrl); } catch (_e) { webviewEl.setAttribute('src', currentUrl); }
        } else {
          webviewEl.setAttribute('src', currentUrl);
        }
      }
      updateActiveSiteUi();
    }

    function ensureWebview(doc) {
      if (webviewEl && webviewEl.parentNode === viewWrapEl) return webviewEl;
      if (!viewWrapEl || !doc) return null;
      var wv = markOwned(doc.createElement('webview'));
      wv.className = 'ags-gw-webview';
      wv.setAttribute('partition', PARTITION_NAME);
      wv.setAttribute('allowpopups', 'true');
      wv.setAttribute('src', sanitizeWebUrl(currentUrl));
      wv.style.width = '100%';
      wv.style.height = '100%';
      wv.style.flex = '1';
      wv.style.border = 'none';
      wv.style.display = 'flex';

      wv.addEventListener('did-start-loading', function () {
        hideErrorOverlay();
        if (progressEl) progressEl.setAttribute('data-loading', '1');
      });
      wv.addEventListener('did-stop-loading', function () {
        if (progressEl) progressEl.setAttribute('data-loading', '0');
      });
      wv.addEventListener('did-navigate', function (e) {
        if (e && e.url) {
          currentUrl = sanitizeWebUrl(e.url);
          updateActiveSiteUi();
        }
      });
      wv.addEventListener('did-navigate-in-page', function (e) {
        if (e && e.isMainFrame !== false && e.url) {
          currentUrl = sanitizeWebUrl(e.url);
          updateActiveSiteUi();
        }
      });
      wv.addEventListener('page-title-updated', function (e) {
        if (e && e.title && statusTextEl) {
          wv._hasCustomTitle = true;
          statusTextEl.textContent = String(e.title).slice(0, 48) + '（网页独立额度）';
        }
      });
      wv.addEventListener('did-fail-load', function (e) {
        if (progressEl) progressEl.setAttribute('data-loading', '0');
        if (!e || e.errorCode === -3 || e.isMainFrame === false) return;
        showErrorOverlay(e.errorCode, e.errorDescription || '');
      });

      viewWrapEl.appendChild(wv);
      webviewEl = wv;
      return wv;
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
        var gemIcon = makeIconSvg(doc, ['M12 3L14.2 9.8L21 12L14.2 14.2L12 21L9.8 14.2L3 12L9.8 9.8Z'], 12);
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

        var cardSites = doc.createElement('div');
        cardSites.className = 'ags-gw-sb-card';
        var head = doc.createElement('div');
        head.className = 'ags-gw-sb-head';
        var titleSpan = doc.createElement('span');
        titleSpan.textContent = '网页对话工作台';
        var badgeSpan = doc.createElement('span');
        badgeSpan.className = 'ags-gw-sb-badge';
        badgeSpan.textContent = '独立额度';
        head.appendChild(titleSpan);
        head.appendChild(badgeSpan);
        cardSites.appendChild(head);

        var desc = doc.createElement('div');
        desc.className = 'ags-gw-sb-sub';
        desc.textContent = '直接使用网页版自身额度与历史记录，不消耗 Antigravity 客户端配额。';
        cardSites.appendChild(desc);

        var siteList = doc.createElement('div');
        siteList.className = 'ags-gw-site-list';
        siteButtons = [];
        for (var i = 0; i < PRESET_SITES.length; i++) {
          (function (site) {
            var btn = doc.createElement('button');
            btn.type = 'button';
            btn.className = 'ags-gw-site-btn';
            btn.setAttribute('data-site-id', site.id);
            var nm = doc.createElement('span');
            nm.textContent = site.name;
            var hostTag = doc.createElement('span');
            hostTag.style.fontSize = '10px';
            hostTag.style.opacity = '0.72';
            hostTag.textContent = formatHostLabel(site.url);
            btn.appendChild(nm);
            btn.appendChild(hostTag);
            btn.addEventListener('click', function () {
              navigateToUrl(site.url);
            });
            siteList.appendChild(btn);
            siteButtons.push(btn);
          })(PRESET_SITES[i]);
        }
        cardSites.appendChild(siteList);
        sidebarPaneEl.appendChild(cardSites);

        var cardActs = doc.createElement('div');
        cardActs.className = 'ags-gw-sb-card';
        var actGrid = doc.createElement('div');
        actGrid.className = 'ags-gw-sb-actions';

        var newChatBtn = doc.createElement('button');
        newChatBtn.type = 'button';
        newChatBtn.className = 'ags-gw-sb-act-btn primary';
        newChatBtn.textContent = '+ 新建网页对话';
        newChatBtn.addEventListener('click', function () {
          var site = matchSiteByUrl(currentUrl);
          navigateToUrl(site.url || DEFAULT_URL);
        });

        var reloadBtn = doc.createElement('button');
        reloadBtn.type = 'button';
        reloadBtn.className = 'ags-gw-sb-act-btn';
        reloadBtn.textContent = '刷新页面';
        reloadBtn.addEventListener('click', function () {
          if (webviewEl && typeof webviewEl.reload === 'function') {
            webviewEl.reload();
          } else {
            navigateToUrl(currentUrl);
          }
        });

        var extBtn = doc.createElement('button');
        extBtn.type = 'button';
        extBtn.className = 'ags-gw-sb-act-btn';
        extBtn.textContent = '外部浏览器打开';
        extBtn.addEventListener('click', function () {
          openCurrentExternal();
        });

        var clearBtn = doc.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'ags-gw-sb-act-btn';
        clearBtn.textContent = '清除登录态';
        clearBtn.addEventListener('click', function () {
          clearWebSession();
        });

        var cfgBtn = doc.createElement('button');
        cfgBtn.type = 'button';
        cfgBtn.className = 'ags-gw-sb-act-btn';
        cfgBtn.textContent = '代理设置';
        cfgBtn.addEventListener('click', function () {
          if (typeof onOpenSettingsCb === 'function') onOpenSettingsCb();
        });

        actGrid.appendChild(newChatBtn);
        actGrid.appendChild(reloadBtn);
        actGrid.appendChild(extBtn);
        actGrid.appendChild(clearBtn);
        actGrid.appendChild(cfgBtn);
        cardActs.appendChild(actGrid);

        var proxyNote = doc.createElement('div');
        proxyNote.className = 'ags-gw-sb-sub';
        proxyNote.setAttribute('data-ags-proxy-note', '1');
        var proxyOn = Boolean(currentCfg && currentCfg.proxy && currentCfg.proxy.enabled);
        proxyNote.textContent = proxyOn
          ? ('网络：已启用 Studio 代理 (' + (currentCfg.proxy.proxyUrl || '') + ')')
          : '网络：直连或系统代理（若无法访问可在「设置」启用本地代理）';
        cardActs.appendChild(proxyNote);
        sidebarPaneEl.appendChild(cardActs);

        var dockIdx = Array.prototype.indexOf.call(nav.children || [], dockEl);
        if (dockIdx >= 0 && nav.children[dockIdx + 1]) {
          nav.insertBefore(sidebarPaneEl, nav.children[dockIdx + 1]);
        } else {
          nav.appendChild(sidebarPaneEl);
        }
      } else {
        var noteEl = sidebarPaneEl.querySelector && sidebarPaneEl.querySelector('[data-ags-proxy-note="1"]');
        if (noteEl) {
          var pOn = Boolean(currentCfg && currentCfg.proxy && currentCfg.proxy.enabled);
          noteEl.textContent = pOn
            ? ('网络：已启用 Studio 代理 (' + (currentCfg.proxy.proxyUrl || '') + ')')
            : '网络：直连或系统代理（若无法访问可在「设置」启用本地代理）';
        }
      }
    }

    function ensureStage(doc, rightPane) {
      if (!rightPane) return;
      rightPaneEl = rightPane;
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

        toolbarEl = doc.createElement('div');
        toolbarEl.className = 'ags-gw-toolbar';
        try {
          if (rightPane.getBoundingClientRect && rightPane.getBoundingClientRect().top <= 12) {
            toolbarEl.setAttribute('data-top-clearance', '1');
          }
        } catch (_e) {}

        var leftGroup = doc.createElement('div');
        leftGroup.className = 'ags-gw-tb-group';

        var backCodeBtn = doc.createElement('button');
        backCodeBtn.type = 'button';
        backCodeBtn.className = 'ags-gw-tb-btn';
        backCodeBtn.textContent = '← 返回 Code';
        backCodeBtn.addEventListener('click', function () { setMode('code'); });

        var navBackBtn = doc.createElement('button');
        navBackBtn.type = 'button';
        navBackBtn.className = 'ags-gw-tb-btn';
        navBackBtn.title = '后退';
        navBackBtn.textContent = '←';
        navBackBtn.addEventListener('click', function () {
          if (webviewEl && typeof webviewEl.canGoBack === 'function' && webviewEl.canGoBack()) {
            webviewEl.goBack();
          }
        });

        var navFwdBtn = doc.createElement('button');
        navFwdBtn.type = 'button';
        navFwdBtn.className = 'ags-gw-tb-btn';
        navFwdBtn.title = '前进';
        navFwdBtn.textContent = '→';
        navFwdBtn.addEventListener('click', function () {
          if (webviewEl && typeof webviewEl.canGoForward === 'function' && webviewEl.canGoForward()) {
            webviewEl.goForward();
          }
        });

        var tbReloadBtn = doc.createElement('button');
        tbReloadBtn.type = 'button';
        tbReloadBtn.className = 'ags-gw-tb-btn';
        tbReloadBtn.title = '刷新';
        tbReloadBtn.textContent = '↻';
        tbReloadBtn.addEventListener('click', function () {
          if (webviewEl && typeof webviewEl.reload === 'function') webviewEl.reload();
          else navigateToUrl(currentUrl);
        });

        var tbNewBtn = doc.createElement('button');
        tbNewBtn.type = 'button';
        tbNewBtn.className = 'ags-gw-tb-btn';
        tbNewBtn.textContent = '+ 新对话';
        tbNewBtn.addEventListener('click', function () {
          var s = matchSiteByUrl(currentUrl);
          navigateToUrl(s.url || DEFAULT_URL);
        });

        leftGroup.appendChild(backCodeBtn);
        leftGroup.appendChild(navBackBtn);
        leftGroup.appendChild(navFwdBtn);
        leftGroup.appendChild(tbReloadBtn);
        leftGroup.appendChild(tbNewBtn);

        var centerGroup = doc.createElement('div');
        centerGroup.className = 'ags-gw-tb-group';
        toolbarSiteButtons = [];
        for (var i = 0; i < 2; i++) {
          (function (site) {
            var sb = doc.createElement('button');
            sb.type = 'button';
            sb.className = 'ags-gw-tb-btn';
            sb.setAttribute('data-site-id', site.id);
            sb.textContent = site.label;
            sb.addEventListener('click', function () {
              navigateToUrl(site.url);
            });
            centerGroup.appendChild(sb);
            toolbarSiteButtons.push(sb);
          })(PRESET_SITES[i]);
        }
        statusTextEl = doc.createElement('span');
        statusTextEl.className = 'ags-gw-tb-status';
        centerGroup.appendChild(statusTextEl);

        var rightGroup = doc.createElement('div');
        rightGroup.className = 'ags-gw-tb-group';
        var extBtn = doc.createElement('button');
        extBtn.type = 'button';
        extBtn.className = 'ags-gw-tb-btn';
        extBtn.textContent = '↗ 外部打开';
        extBtn.addEventListener('click', function () { openCurrentExternal(); });
        rightGroup.appendChild(extBtn);

        toolbarEl.appendChild(leftGroup);
        toolbarEl.appendChild(centerGroup);
        toolbarEl.appendChild(rightGroup);
        stageEl.appendChild(toolbarEl);

        progressEl = doc.createElement('div');
        progressEl.className = 'ags-gw-progress';
        progressEl.setAttribute('data-loading', '0');
        stageEl.appendChild(progressEl);

        viewWrapEl = doc.createElement('div');
        viewWrapEl.className = 'ags-gw-view-wrap';

        errorOverlayEl = doc.createElement('div');
        errorOverlayEl.className = 'ags-gw-error';
        errorOverlayEl.setAttribute('data-visible', '0');
        var errCard = doc.createElement('div');
        errCard.className = 'ags-gw-error-card';
        var errTitle = doc.createElement('div');
        errTitle.className = 'ags-gw-error-title';
        errTitle.textContent = '网页 AI 加载失败';
        errorDescEl = doc.createElement('div');
        errorDescEl.className = 'ags-gw-error-desc';
        var errActs = doc.createElement('div');
        errActs.className = 'ags-gw-error-acts';
        var retryBtn = doc.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'ags-gw-tb-btn';
        retryBtn.textContent = '重试加载';
        retryBtn.addEventListener('click', function () {
          hideErrorOverlay();
          if (webviewEl && typeof webviewEl.reload === 'function') webviewEl.reload();
          else navigateToUrl(currentUrl);
        });
        var proxyBtn = doc.createElement('button');
        proxyBtn.type = 'button';
        proxyBtn.className = 'ags-gw-tb-btn';
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
    }

    function openCurrentExternal() {
      var safe = sanitizeWebUrl(
        (webviewEl && typeof webviewEl.getURL === 'function' && webviewEl.getURL()) || currentUrl
      );
      if (currentApi && typeof currentApi.openGeminiWebExternal === 'function') {
        void currentApi.openGeminiWebExternal(safe);
      } else if (typeof window !== 'undefined' && typeof window.open === 'function') {
        try { window.open(safe, '_blank', 'noopener,noreferrer'); } catch (_e) {}
      }
    }

    function clearWebSession() {
      if (currentApi && typeof currentApi.clearGeminiWebSession === 'function') {
        Promise.resolve(currentApi.clearGeminiWebSession()).then(function () {
          navigateToUrl(currentUrl);
        }).catch(function () {
          navigateToUrl(currentUrl);
        });
      } else {
        navigateToUrl(currentUrl);
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
        ensureWebview(doc);
        updateActiveSiteUi();
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
      if (webviewEl && webviewEl.parentNode) webviewEl.parentNode.removeChild(webviewEl);
      webviewEl = null;
      if (stageEl && stageEl.parentNode) stageEl.parentNode.removeChild(stageEl);
      stageEl = null;
      toolbarEl = null;
      statusTextEl = null;
      progressEl = null;
      viewWrapEl = null;
      errorOverlayEl = null;
      errorDescEl = null;
      if (sidebarPaneEl && sidebarPaneEl.parentNode) sidebarPaneEl.parentNode.removeChild(sidebarPaneEl);
      sidebarPaneEl = null;
      if (dockEl && dockEl.parentNode) dockEl.parentNode.removeChild(dockEl);
      dockEl = null;
      segEl = null;
      codeBtnEl = null;
      geminiBtnEl = null;
      dotEl = null;
      siteButtons = [];
      toolbarSiteButtons = [];
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
      var configuredDefault = sanitizeWebUrl(gw.defaultUrl || DEFAULT_URL);
      if (!webviewEl) {
        currentUrl = configuredDefault;
      }

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
      navigate: navigateToUrl,
      destroy: destroy
    };
  }

  var exported = {
    createGeminiWebController: createGeminiWebController,
    PRESET_SITES: PRESET_SITES,
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
