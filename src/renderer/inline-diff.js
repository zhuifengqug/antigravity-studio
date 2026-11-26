(function (globalScope) {
  'use strict';

  var STYLE_ID = 'ag-studio-inline-diff-style';
  var PANEL_ATTR = 'data-ags-inline-diff-panel';
  var BOUND_ATTR = 'data-ags-inline-diff-bound';
  var IGNORE_SEL = '[data-ag-studio-ignore], [data-ag-no-i18n], #ag-studio-root';
  var CONV_SCOPE_SEL = '[data-testid="conversation-view"], [data-tiling-pane], [data-testid="autoscroll-viewport"]';
  var FILE_ITEM_SEL = [
    '[data-testid="diff-line-count"]',
    '[data-testid="tool-call-row"]',
    '[data-ag-tool-row="1"]',
    '[data-ag-diff-uri]',
    'a[href^="file://"]'
  ].join(', ');

  var INLINE_DIFF_CSS = [
    '.ags-inline-diff-pill {',
    '  display: inline-flex; align-items: center; gap: 4px;',
    '  height: 20px; padding: 0 7px; margin-left: 6px;',
    '  border-radius: 999px; border: 1px solid var(--ags-border, rgba(148,163,184,0.28));',
    '  background: var(--ags-bg-subtle, rgba(148,163,184,0.12));',
    '  color: var(--ags-text-secondary, #94A3B8);',
    '  font-family: var(--ags-font-ui, system-ui, sans-serif); font-size: 11px; font-weight: 500; line-height: 1;',
    '  cursor: pointer; vertical-align: middle; transition: background-color 140ms ease, color 140ms ease, border-color 140ms ease;',
    '}',
    '.ags-inline-diff-pill:hover {',
    '  background: var(--ags-accent-soft, rgba(59,108,246,0.14));',
    '  border-color: var(--ags-accent, #3B6CF6);',
    '  color: var(--ags-text-primary, #F1F5F9);',
    '}',
    '.ags-inline-diff-pill[aria-expanded="true"] {',
    '  background: var(--ags-accent-soft, rgba(59,108,246,0.16));',
    '  border-color: var(--ags-accent, #3B6CF6);',
    '  color: var(--ags-accent, #60A5FA);',
    '}',
    '.ags-inline-diff-panel {',
    '  display: block; box-sizing: border-box; width: 100%; max-width: 100%;',
    '  margin: 6px 0 10px 0; border-radius: 10px; overflow: hidden;',
    '  border: 1px solid var(--ags-border, rgba(148,163,184,0.24));',
    '  background: var(--ags-bg-surface, #1A1E28);',
    '  color: var(--ags-text-primary, #F1F5F9);',
    '  box-shadow: var(--ags-shadow, 0 8px 24px rgba(0,0,0,0.28));',
    '  font-family: var(--ags-font-ui, system-ui, sans-serif);',
    '}',
    '.ags-inline-diff-header {',
    '  display: flex; align-items: center; justify-content: space-between; gap: 8px;',
    '  padding: 6px 10px; border-bottom: 1px solid var(--ags-border, rgba(148,163,184,0.20));',
    '  background: var(--ags-bg-subtle, rgba(148,163,184,0.08)); font-size: 11.5px;',
    '}',
    '.ags-inline-diff-meta { display: flex; align-items: center; gap: 8px; min-width: 0; overflow: hidden; }',
    '.ags-inline-diff-path {',
    '  font-family: var(--ags-font-code, monospace); font-size: 11.5px; font-weight: 600;',
    '  color: var(--ags-text-primary, #F1F5F9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
    '}',
    '.ags-inline-diff-stats { display: inline-flex; align-items: center; gap: 6px; font-family: var(--ags-font-code, monospace); font-size: 11px; flex-shrink: 0; }',
    '.ags-inline-diff-add-stat { color: var(--ags-success, #34D399); font-weight: 600; }',
    '.ags-inline-diff-del-stat { color: var(--ags-danger, #F87171); font-weight: 600; }',
    '.ags-inline-diff-status {',
    '  padding: 1px 6px; border-radius: 999px; font-size: 10px;',
    '  border: 1px solid var(--ags-border, rgba(148,163,184,0.24));',
    '  color: var(--ags-text-secondary, #94A3B8); flex-shrink: 0;',
    '}',
    '.ags-inline-diff-actions { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }',
    '.ags-inline-diff-btn {',
    '  appearance: none; height: 22px; padding: 0 8px; border-radius: 6px;',
    '  border: 1px solid var(--ags-border, rgba(148,163,184,0.24));',
    '  background: var(--ags-bg-surface, transparent); color: var(--ags-text-secondary, #94A3B8);',
    '  font-size: 11px; cursor: pointer;',
    '}',
    '.ags-inline-diff-btn:hover { color: var(--ags-text-primary, #F1F5F9); border-color: var(--ags-accent, #60A5FA); }',
    '.ags-inline-diff-body {',
    '  max-height: 340px; overflow: auto; padding: 4px 0;',
    '  background: var(--ags-code-bg, #12151E);',
    '  font-family: var(--ags-font-code, "JetBrains Mono", Consolas, monospace);',
    '  font-size: 12px; line-height: 1.55; tab-size: 2;',
    '}',
    '.ags-inline-diff-hunk {',
    '  padding: 3px 12px; margin: 2px 0; font-size: 11px;',
    '  color: var(--ags-text-secondary, #94A3B8);',
    '  background: var(--ags-bg-subtle, rgba(148,163,184,0.08));',
    '  border-top: 1px solid var(--ags-border, rgba(148,163,184,0.12));',
    '  border-bottom: 1px solid var(--ags-border, rgba(148,163,184,0.12));',
    '  white-space: pre;',
    '}',
    '.ags-inline-diff-row {',
    '  display: flex; align-items: stretch; min-width: 100%; width: max-content;',
    '  box-sizing: border-box; white-space: pre; color: var(--ags-text-primary, #F1F5F9);',
    '}',
    '.ags-inline-diff-row.is-add { background: rgba(34, 197, 94, 0.14); }',
    '.ags-inline-diff-row.is-del { background: rgba(239, 68, 68, 0.14); }',
    'html[data-ags-mode="light"] .ags-inline-diff-row.is-add { background: rgba(22, 163, 74, 0.11); }',
    'html[data-ags-mode="light"] .ags-inline-diff-row.is-del { background: rgba(220, 38, 38, 0.10); }',
    '.ags-inline-diff-ln {',
    '  flex: none; width: 42px; padding: 0 6px; text-align: right; user-select: none;',
    '  color: var(--ags-text-secondary, #94A3B8); opacity: 0.72;',
    '  border-right: 1px solid var(--ags-border, rgba(148,163,184,0.14));',
    '  font-variant-numeric: tabular-nums; font-size: 11px;',
    '}',
    '.ags-inline-diff-row.is-add .ags-inline-diff-ln { box-shadow: inset 2px 0 0 var(--ags-success, #34D399); }',
    '.ags-inline-diff-row.is-del .ags-inline-diff-ln { box-shadow: inset 2px 0 0 var(--ags-danger, #F87171); }',
    '.ags-inline-diff-sign { flex: none; width: 20px; text-align: center; user-select: none; font-weight: 600; }',
    '.ags-inline-diff-row.is-add .ags-inline-diff-sign { color: var(--ags-success, #34D399); }',
    '.ags-inline-diff-row.is-del .ags-inline-diff-sign { color: var(--ags-danger, #F87171); }',
    '.ags-inline-diff-code { flex: 1 1 auto; min-width: 0; padding: 0 12px 0 2px; }',
    '.ags-inline-diff-msg, .ags-inline-diff-truncated {',
    '  padding: 8px 12px; font-family: var(--ags-font-ui, system-ui, sans-serif); font-size: 12px;',
    '  color: var(--ags-text-secondary, #94A3B8);',
    '}',
    '.ags-inline-diff-truncated {',
    '  border-top: 1px solid var(--ags-border, rgba(148,163,184,0.16));',
    '  background: var(--ags-bg-subtle, rgba(148,163,184,0.06)); font-size: 11px;',
    '}'
  ].join('\n');

  function getAttr(el, name) {
    return el && typeof el.getAttribute === 'function' ? el.getAttribute(name) : null;
  }

  function setAttr(el, name, val) {
    if (el && typeof el.setAttribute === 'function' && getAttr(el, name) !== String(val)) {
      el.setAttribute(name, String(val));
    }
  }

  function removeNodeSafe(el) {
    if (!el) return;
    if (typeof el.remove === 'function') {
      el.remove();
    } else if (el.parentNode && typeof el.parentNode.removeChild === 'function') {
      el.parentNode.removeChild(el);
    }
  }

  function isIgnoredNode(el) {
    if (!el) return true;
    if (el.id === 'ag-studio-root') return true;
    if (getAttr(el, 'data-ag-studio-ignore') != null || getAttr(el, 'data-ag-no-i18n') != null) return true;
    if (typeof el.closest === 'function') {
      if (el.closest(IGNORE_SEL)) return true;
      if (el.closest('[data-testid="changed-files-card"]')) return true;
    }
    return false;
  }

  function resolveLang(cfg) {
    var lang = (cfg && cfg.i18n && cfg.i18n.language) || (cfg && cfg.language) || 'zh-CN';
    return String(lang).toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
  }

  function labelsForLang(lang) {
    if (lang === 'zh') {
      return {
        expand: '展开 Diff',
        collapse: '收起 Diff',
        refresh: '刷新',
        close: '收起',
        loading: '正在加载 Git Diff...',
        binary: '二进制文件暂不支持行内文本 Diff 预览。',
        clean: '工作区与暂存区暂无未提交变更。',
        truncated: '输出已达行数上限，已自动截断显示。',
        errorPrefix: '无法加载 Diff：'
      };
    }
    return {
      expand: 'Diff',
      collapse: 'Hide Diff',
      refresh: 'Refresh',
      close: 'Collapse',
      loading: 'Loading Git Diff...',
      binary: 'Binary file cannot be previewed inline.',
      clean: 'No uncommitted changes for this file.',
      truncated: 'Diff output truncated at line limit.',
      errorPrefix: 'Diff unavailable: '
    };
  }

  function extractFromFiber(el) {
    if (!el || typeof el !== 'object') return null;
    try {
      var keys = Object.keys(el);
      var fk = keys.find(function (k) {
        return k.indexOf('__reactFiber$') === 0 || k.indexOf('__reactInternalInstance$') === 0;
      });
      if (!fk) return null;
      var f = el[fk];
      for (var d = 0; d < 24 && f; d += 1, f = f.return) {
        var p = f.memoizedProps || {};
        if (p.fileDiff && typeof p.fileDiff.uri === 'string' && p.fileDiff.uri.trim()) {
          return p.fileDiff.uri.trim();
        }
        if (typeof p.uri === 'string' && p.uri.trim()) return p.uri.trim();
        var st = p.step && (p.step.args || p.step.result) ? p.step : p.step && p.step.step && p.step.step.value;
        if (st && st.args) {
          var cand = st.args.TargetFile || st.args.Path || st.args.path || st.args.filePath || st.args.uri;
          if (typeof cand === 'string' && cand.trim()) return cand.trim();
        }
      }
    } catch (_e) {}
    return null;
  }

  function extractFileTarget(itemEl, rowEl, cfg) {
    var nodes = [itemEl, rowEl];
    var filePath = '';
    var workspaceHint = (cfg && cfg.workspaceRoot) || '';

    for (var i = 0; i < nodes.length && !filePath; i += 1) {
      var n = nodes[i];
      if (!n) continue;
      filePath =
        getAttr(n, 'data-ag-diff-uri') ||
        getAttr(n, 'data-file-path') ||
        getAttr(n, 'data-path') ||
        getAttr(n, 'href') ||
        '';
      filePath = String(filePath || '').trim();
      if (!filePath) {
        var rawJson = getAttr(n, 'data-ag-diff-json');
        if (rawJson) {
          try {
            var parsed = JSON.parse(rawJson);
            if (parsed && typeof parsed === 'object') {
              filePath = String(parsed.uri || parsed.filePath || parsed.path || '').trim();
            }
          } catch (_e) {}
        }
      }
      if (!filePath && typeof n.querySelector === 'function') {
        var link = n.querySelector('a[href^="file://"], [data-ag-diff-uri], [data-file-path], [data-path]');
        if (link && !isIgnoredNode(link)) {
          filePath = String(
            getAttr(link, 'data-ag-diff-uri') ||
            getAttr(link, 'data-file-path') ||
            getAttr(link, 'data-path') ||
            getAttr(link, 'href') ||
            ''
          ).trim();
        }
      }
      if (!filePath) {
        filePath = extractFromFiber(n) || '';
      }
      if (!workspaceHint) {
        workspaceHint = String(
          getAttr(n, 'data-workspace-root') || getAttr(n, 'data-workspace-path') || ''
        ).trim();
      }
    }

    if (!workspaceHint && itemEl && typeof itemEl.closest === 'function') {
      var wsHost = itemEl.closest('[data-workspace-root], [data-workspace-path]');
      if (wsHost) {
        workspaceHint = String(
          getAttr(wsHost, 'data-workspace-root') || getAttr(wsHost, 'data-workspace-path') || ''
        ).trim();
      }
    }
    if (!workspaceHint && typeof window !== 'undefined' && window.__AG_STUDIO_WORKSPACE__) {
      workspaceHint = String(window.__AG_STUDIO_WORKSPACE__ || '').trim();
    }

    if (!filePath && itemEl && typeof itemEl.querySelector === 'function') {
      var pill = itemEl.querySelector('[data-testid="entity-pill"], .inline-pill');
      var pillTxt = pill ? String(pill.textContent || '').trim() : '';
      if (pillTxt && /[./\\]/.test(pillTxt)) {
        filePath = pillTxt;
      }
    }

    return { filePath: filePath, workspaceHint: workspaceHint };
  }

  function findHostRow(doc, itemEl) {
    if (!itemEl) return null;
    if (typeof itemEl.closest === 'function') {
      var explicit = itemEl.closest('[data-testid="tool-call-row"], [data-ag-tool-row="1"]');
      if (explicit && !isIgnoredNode(explicit)) return explicit;
    }
    var cur = itemEl;
    for (var i = 0; i < 8 && cur && cur.parentElement; i += 1) {
      var p = cur.parentElement;
      if (p === doc.body || p === doc.documentElement) break;
      var tid = getAttr(p, 'data-testid') || '';
      if (tid === 'conversation-view' || tid === 'autoscroll-viewport') {
        return cur;
      }
      var pTag = String(p.tagName || '').toUpperCase();
      if (pTag === 'DIV' && p.className && String(p.className).indexOf('flex-col') !== -1) {
        return cur;
      }
      cur = p;
    }
    return itemEl.parentElement && itemEl.parentElement !== doc.body ? itemEl.parentElement : itemEl;
  }

  function createInlineDiffController(options) {
    var opts = options || {};
    var doc = opts.doc || opts.document || (typeof document !== 'undefined' ? document : null);
    var currentCfg = opts.cfg || {};
    var currentApi = opts.api || null;
    var enabled = false;
    var destroyed = false;
    var observer = null;
    var scanTimer = 0;
    var activePanels = new Map();

    function getApi() {
      if (currentApi && typeof currentApi.getInlineDiff === 'function') return currentApi;
      if (typeof window !== 'undefined' && window.agStudioAPI && typeof window.agStudioAPI.getInlineDiff === 'function') {
        return window.agStudioAPI;
      }
      return null;
    }

    function mkEl(tag, className, text) {
      var el = doc.createElement(tag);
      if (className) el.className = className;
      if (text !== undefined && text !== null) el.textContent = String(text);
      return el;
    }

    function markOwned(el) {
      setAttr(el, 'data-ag-studio-ignore', 'true');
      setAttr(el, 'data-ag-no-i18n', 'true');
      return el;
    }

    function ensureStyle() {
      if (!doc || typeof doc.createElement !== 'function') return;
      var existing = typeof doc.getElementById === 'function' ? doc.getElementById(STYLE_ID) : null;
      if (existing) {
        if (existing.textContent !== INLINE_DIFF_CSS) existing.textContent = INLINE_DIFF_CSS;
        return;
      }
      var target = doc.head || doc.documentElement || doc.body;
      if (!target || typeof target.appendChild !== 'function') return;
      var s = markOwned(doc.createElement('style'));
      s.id = STYLE_ID;
      s.textContent = INLINE_DIFF_CSS;
      target.appendChild(s);
    }

    function removeStyle() {
      if (!doc || typeof doc.getElementById !== 'function') return;
      var existing = doc.getElementById(STYLE_ID);
      if (existing) removeNodeSafe(existing);
    }

    function cleanupDom() {
      if (!doc || typeof doc.querySelectorAll !== 'function') return;
      var pills = doc.querySelectorAll('.ags-inline-diff-pill');
      for (var i = 0; i < pills.length; i += 1) removeNodeSafe(pills[i]);
      var panels = doc.querySelectorAll('[' + PANEL_ATTR + '], .ags-inline-diff-panel');
      for (var j = 0; j < panels.length; j += 1) removeNodeSafe(panels[j]);
      var bound = doc.querySelectorAll('[' + BOUND_ATTR + ']');
      for (var k = 0; k < bound.length; k += 1) {
        if (typeof bound[k].removeAttribute === 'function') bound[k].removeAttribute(BOUND_ATTR);
      }
      activePanels.clear();
      removeStyle();
    }

    function disconnectObserver() {
      if (scanTimer) {
        clearTimeout(scanTimer);
        scanTimer = 0;
      }
      if (observer) {
        try { observer.disconnect(); } catch (_e) {}
        observer = null;
      }
    }

    function closePanel(rowEl, pillEl) {
      var entry = activePanels.get(rowEl);
      if (entry && entry.panel) {
        removeNodeSafe(entry.panel);
      }
      activePanels.delete(rowEl);
      if (pillEl) {
        var lbls = labelsForLang(resolveLang(currentCfg));
        pillEl.textContent = lbls.expand;
        setAttr(pillEl, 'aria-expanded', 'false');
      }
    }

    function renderPanelResult(panelEl, res, target, rowEl, pillEl) {
      while (panelEl.firstChild) panelEl.removeChild(panelEl.firstChild);
      var lbls = labelsForLang(resolveLang(currentCfg));

      var header = mkEl('div', 'ags-inline-diff-header');
      var meta = mkEl('div', 'ags-inline-diff-meta');
      var pathLabel = (res && res.relPath) || target.filePath || 'diff';
      meta.appendChild(mkEl('span', 'ags-inline-diff-path', pathLabel));

      if (res && res.ok) {
        var stats = mkEl('span', 'ags-inline-diff-stats');
        stats.appendChild(mkEl('span', 'ags-inline-diff-add-stat', '+' + String(res.additions || 0)));
        stats.appendChild(mkEl('span', 'ags-inline-diff-del-stat', '-' + String(res.deletions || 0)));
        meta.appendChild(stats);
        if (res.status) {
          meta.appendChild(mkEl('span', 'ags-inline-diff-status', res.status));
        }
      }

      var actions = mkEl('div', 'ags-inline-diff-actions');
      var refreshBtn = mkEl('button', 'ags-inline-diff-btn ags-inline-diff-refresh', lbls.refresh);
      refreshBtn.type = 'button';
      refreshBtn.addEventListener('click', function (ev) {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        loadPanelDiff(panelEl, target, rowEl, pillEl, true);
      });
      var closeBtn = mkEl('button', 'ags-inline-diff-btn ags-inline-diff-close', lbls.close);
      closeBtn.type = 'button';
      closeBtn.addEventListener('click', function (ev) {
        if (ev && ev.stopPropagation) ev.stopPropagation();
        closePanel(rowEl, pillEl);
      });
      actions.appendChild(refreshBtn);
      actions.appendChild(closeBtn);

      header.appendChild(meta);
      header.appendChild(actions);
      panelEl.appendChild(header);

      var body = mkEl('div', 'ags-inline-diff-body');
      if (!res || !res.ok) {
        var errCode = (res && res.error) || 'unavailable';
        body.appendChild(mkEl('div', 'ags-inline-diff-msg', lbls.errorPrefix + errCode));
        panelEl.appendChild(body);
        return;
      }

      if (res.binary) {
        body.appendChild(mkEl('div', 'ags-inline-diff-msg', lbls.binary));
        panelEl.appendChild(body);
        return;
      }

      var hunks = Array.isArray(res.hunks) ? res.hunks : [];
      if (!hunks.length) {
        body.appendChild(mkEl('div', 'ags-inline-diff-msg', lbls.clean));
        panelEl.appendChild(body);
        return;
      }

      for (var i = 0; i < hunks.length; i += 1) {
        var h = hunks[i];
        if (!h) continue;
        if (h.header) {
          body.appendChild(mkEl('div', 'ags-inline-diff-hunk', h.header));
        }
        var rows = Array.isArray(h.rows) ? h.rows : [];
        for (var j = 0; j < rows.length; j += 1) {
          var r = rows[j];
          if (!r) continue;
          var kind = r.kind === 'add' || r.kind === 'del' ? r.kind : 'ctx';
          var rowNode = mkEl('div', 'ags-inline-diff-row is-' + kind);
          rowNode.appendChild(mkEl('span', 'ags-inline-diff-ln', r.oldLn == null ? '' : String(r.oldLn)));
          rowNode.appendChild(mkEl('span', 'ags-inline-diff-ln', r.newLn == null ? '' : String(r.newLn)));
          rowNode.appendChild(mkEl('span', 'ags-inline-diff-sign', r.sign || ' '));
          rowNode.appendChild(mkEl('span', 'ags-inline-diff-code', r.text || ''));
          body.appendChild(rowNode);
        }
      }

      panelEl.appendChild(body);
      if (res.truncated) {
        panelEl.appendChild(mkEl('div', 'ags-inline-diff-truncated', lbls.truncated));
      }
    }

    function loadPanelDiff(panelEl, target, rowEl, pillEl, noCache) {
      var lbls = labelsForLang(resolveLang(currentCfg));
      while (panelEl.firstChild) panelEl.removeChild(panelEl.firstChild);
      panelEl.appendChild(mkEl('div', 'ags-inline-diff-msg', lbls.loading));

      var api = getApi();
      if (!api) {
        renderPanelResult(panelEl, { ok: false, error: 'api_unavailable' }, target, rowEl, pillEl);
        return Promise.resolve();
      }
      var reqId = (panelEl._agsReqSeq = (panelEl._agsReqSeq || 0) + 1);
      return Promise.resolve()
        .then(function () {
          return api.getInlineDiff({
            filePath: target.filePath,
            workspaceHint: target.workspaceHint || undefined,
            noCache: Boolean(noCache)
          });
        })
        .then(function (res) {
          if (destroyed || !enabled || panelEl._agsReqSeq !== reqId || panelEl.isConnected === false) return;
          renderPanelResult(panelEl, res, target, rowEl, pillEl);
        })
        .catch(function (err) {
          if (destroyed || !enabled || panelEl._agsReqSeq !== reqId || panelEl.isConnected === false) return;
          renderPanelResult(
            panelEl,
            { ok: false, error: (err && err.message) || 'rpc_error' },
            target,
            rowEl,
            pillEl
          );
        });
    }

    function togglePanel(itemEl, rowEl, pillEl) {
      if (destroyed || !enabled || !doc || !rowEl || !rowEl.parentNode) return;
      if (activePanels.has(rowEl)) {
        closePanel(rowEl, pillEl);
        return;
      }
      var target = extractFileTarget(itemEl, rowEl, currentCfg);
      if (!target.filePath) return;

      var panelEl = markOwned(mkEl('div', 'ags-inline-diff-panel'));
      setAttr(panelEl, PANEL_ATTR, '1');
      activePanels.set(rowEl, { panel: panelEl, pill: pillEl });

      var lbls = labelsForLang(resolveLang(currentCfg));
      pillEl.textContent = lbls.collapse;
      setAttr(pillEl, 'aria-expanded', 'true');

      rowEl.parentNode.insertBefore(panelEl, rowEl.nextSibling || null);
      loadPanelDiff(panelEl, target, rowEl, pillEl, false);
    }

    function attachPillToItem(itemEl) {
      if (!itemEl || isIgnoredNode(itemEl)) return;
      if (getAttr(itemEl, BOUND_ATTR) === '1') return;

      var rowEl = findHostRow(doc, itemEl);
      if (!rowEl || isIgnoredNode(rowEl)) return;
      if (typeof rowEl.querySelector === 'function' && rowEl.querySelector('.ags-inline-diff-pill')) {
        setAttr(itemEl, BOUND_ATTR, '1');
        return;
      }

      var target = extractFileTarget(itemEl, rowEl, currentCfg);
      if (!target.filePath) return;

      setAttr(itemEl, BOUND_ATTR, '1');
      var lbls = labelsForLang(resolveLang(currentCfg));
      var pill = markOwned(mkEl('button', 'ags-inline-diff-pill', lbls.expand));
      pill.type = 'button';
      setAttr(pill, 'aria-expanded', 'false');
      pill.addEventListener('click', function (ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        if (ev && ev.stopPropagation) ev.stopPropagation();
        togglePanel(itemEl, rowEl, pill);
      });

      if (itemEl.tagName === 'A' && itemEl.parentNode) {
        itemEl.parentNode.insertBefore(pill, itemEl.nextSibling || null);
      } else if (typeof itemEl.appendChild === 'function') {
        itemEl.appendChild(pill);
      }
    }

    function scan() {
      if (destroyed || !enabled || !doc || typeof doc.querySelectorAll !== 'function') return;
      var scopes = doc.querySelectorAll(CONV_SCOPE_SEL);
      var roots = scopes && scopes.length ? scopes : [doc];
      var seen = typeof Set === 'function' ? new Set() : null;

      for (var s = 0; s < roots.length; s += 1) {
        var rootNode = roots[s];
        if (!rootNode || isIgnoredNode(rootNode) || typeof rootNode.querySelectorAll !== 'function') continue;
        var items = rootNode.querySelectorAll(FILE_ITEM_SEL);
        for (var i = 0; i < items.length; i += 1) {
          var item = items[i];
          if (seen) {
            if (seen.has(item)) continue;
            seen.add(item);
          }
          attachPillToItem(item);
        }
      }
    }

    function scheduleScan() {
      if (destroyed || !enabled || scanTimer) return;
      scanTimer = setTimeout(function () {
        scanTimer = 0;
        if (!destroyed && enabled) scan();
      }, 40);
    }

    function ensureObserver() {
      if (observer || destroyed || !enabled || !doc) return;
      if (typeof MutationObserver !== 'function') return;
      var target = doc.body || doc.documentElement;
      if (!target) return;
      observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i += 1) {
          var m = mutations[i];
          if (m.target && !isIgnoredNode(m.target)) {
            scheduleScan();
            return;
          }
        }
      });
      observer.observe(target, { childList: true, subtree: true });
    }

    function updateExistingPillLabels() {
      if (!doc || typeof doc.querySelectorAll !== 'function') return;
      var lbls = labelsForLang(resolveLang(currentCfg));
      var pills = doc.querySelectorAll('.ags-inline-diff-pill');
      for (var i = 0; i < pills.length; i += 1) {
        var p = pills[i];
        p.textContent = getAttr(p, 'aria-expanded') === 'true' ? lbls.collapse : lbls.expand;
      }
    }

    function sync(cfg, api) {
      if (destroyed) return;
      if (cfg && typeof cfg === 'object') currentCfg = cfg;
      if (api) currentApi = api;

      var nextEnabled = !(currentCfg && currentCfg.fx && currentCfg.fx.inlineDiff === false);
      if (!nextEnabled) {
        enabled = false;
        disconnectObserver();
        cleanupDom();
        return;
      }

      enabled = true;
      ensureStyle();
      ensureObserver();
      updateExistingPillLabels();
      scan();
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      enabled = false;
      disconnectObserver();
      cleanupDom();
    }

    return {
      sync: sync,
      destroy: destroy
    };
  }

  var exported = {
    createInlineDiffController: createInlineDiffController
  };

  if (typeof window !== 'undefined') {
    window.__AG_STUDIO_INLINE_DIFF__ = exported;
  }
  if (globalScope && globalScope !== (typeof window !== 'undefined' ? window : null)) {
    globalScope.__AG_STUDIO_INLINE_DIFF__ = exported;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
})(typeof window !== 'undefined' ? window : globalThis);
