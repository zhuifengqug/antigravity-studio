// Built by scripts/build-renderer.js
(function (globalScope) {
  'use strict';

  var originalTexts = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var originalAttrs = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  var IGNORE_SELECTORS = [
    '[data-ag-studio-ignore]',
    '#ag-studio-root',
    '.monaco-editor',
    '.xterm',
    'pre',
    'code',
    'kbd',
    'samp',
    'textarea',
    'input',
    '[contenteditable="true"]',
    '.codicon',
    '[class*="material-icons"]',
    '[class*="lucide"]',
    '[data-testid*="user-message"]',
    '[data-testid*="assistant-message"]',
    '[data-testid*="thinking"]',
    '[class*="file-tree"]',
    '[class*="FileTree"]',
    '[class*="breadcrumb"]',
    '[class*="Breadcrumb"]'
  ];

  function looksLikeCodeOrPath(text) {
    if (!text) return true;
    var s = text.trim();
    if (s.length < 2 || s.length > 160) return true;
    // Pure numbers, punctuation, symbols
    if (/^[\d\s.,:%+\-*/()[\]{}<>=!@#$^&|~`'"\\|/?]+$/.test(s)) return true;
    // File paths, URLs, Windows paths, relative POSIX paths, package specs
    if (/^(?:[A-Za-z]:\\|\/|~\/|https?:\/\/|file:\/\/|ui:\/\/)/.test(s)) return true;
    if (!/\s/.test(s) && s.indexOf('/') !== -1 && /[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+/.test(s)) return true;
    if (!/\s/.test(s) && s.indexOf('\\') !== -1) return true;
    if (/^[\w.-]+\.(?:js|ts|tsx|jsx|json|py|go|rs|md|css|html|yml|yaml|asar|exe|db|vscdb|pb)$/i.test(s)) return true;
    // Code-like camelCase / snake_case / flags
    if (/^[a-z]+[A-Z][a-zA-Z0-9]+$/.test(s)) return true;
    if (/^[a-z0-9_]+_[a-z0-9_]+$/.test(s)) return true;
    if (/^--?[a-zA-Z0-9-]+$/.test(s)) return true;
    return false;
  }

  function shouldIgnoreElement(el) {
    if (!el || el.nodeType !== 1) return false;
    var tag = (el.tagName || '').toUpperCase();
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'SVG' || tag === 'PATH' || tag === 'CANVAS') {
      return true;
    }
    if (el.isContentEditable) return true;
    if (typeof el.closest === 'function') {
      for (var i = 0; i < IGNORE_SELECTORS.length; i++) {
        try {
          if (el.closest(IGNORE_SELECTORS[i])) return true;
        } catch (_e) {}
      }
    }
    return false;
  }

  function createTranslatorEngine(payload) {
    var exactMap = new Map();
    var regexRules = [];
    var lang = (payload && payload.language) || 'en';

    function load(nextPayload) {
      exactMap.clear();
      regexRules = [];
      lang = (nextPayload && nextPayload.language) || 'en';
      if (lang === 'en') return;

      var exact = (nextPayload && nextPayload.exact) || {};
      var keys = Object.keys(exact);
      for (var i = 0; i < keys.length; i++) {
        exactMap.set(keys[i], exact[keys[i]]);
      }
      var regs = (nextPayload && nextPayload.regex) || [];
      for (var j = 0; j < regs.length; j++) {
        try {
          regexRules.push({
            re: new RegExp(regs[j].pattern, regs[j].flags || ''),
            replace: regs[j].replace
          });
        } catch (_e) {}
      }
    }

    function translateText(raw) {
      if (!raw || typeof raw !== 'string' || lang === 'en') return raw;
      var leadMatch = raw.match(/^\s*/);
      var trailMatch = raw.match(/\s*$/);
      var lead = leadMatch ? leadMatch[0] : '';
      var trail = trailMatch ? trailMatch[0] : '';
      var core = raw.trim();
      if (!core || looksLikeCodeOrPath(core)) return raw;

      if (exactMap.has(core)) {
        return lead + exactMap.get(core) + trail;
      }
      for (var i = 0; i < regexRules.length; i++) {
        var r = regexRules[i];
        if (r.re.test(core)) {
          return lead + core.replace(r.re, r.replace) + trail;
        }
      }
      return raw;
    }

    load(payload);

    return {
      getLanguage: function () { return lang; },
      load: load,
      translateText: translateText,
      isEnabled: function () { return lang !== 'en'; }
    };
  }

  function initPreloadI18n(initialPayload) {
    if (typeof document === 'undefined') return null;
    var engine = createTranslatorEngine(initialPayload || { language: 'en', exact: {}, regex: [] });
    var observer = null;
    var isApplying = false;

    function processTextNode(node) {
      if (!node || node.nodeType !== 3) return;
      var parent = node.parentElement;
      if (shouldIgnoreElement(parent)) return;

      var cur = node.nodeValue || '';
      if (!engine.isEnabled()) {
        if (originalTexts && originalTexts.has(node)) {
          var orig = originalTexts.get(node);
          if (cur !== orig) node.nodeValue = orig;
        }
        return;
      }

      var sourceText = (originalTexts && originalTexts.has(node)) ? originalTexts.get(node) : cur;
      var nextText = engine.translateText(sourceText);
      if (nextText !== sourceText) {
        if (originalTexts && !originalTexts.has(node)) {
          originalTexts.set(node, sourceText);
        }
        if (node.nodeValue !== nextText) {
          node.nodeValue = nextText;
        }
      }
    }

    function processAttributes(el) {
      if (!el || el.nodeType !== 1 || shouldIgnoreElement(el)) return;
      var attrs = ['placeholder', 'title', 'aria-label'];
      for (var i = 0; i < attrs.length; i++) {
        var attr = attrs[i];
        if (!el.hasAttribute(attr)) continue;
        var val = el.getAttribute(attr);
        if (!val) continue;
        var saved = originalAttrs ? originalAttrs.get(el) : null;
        if (!engine.isEnabled()) {
          if (saved && saved[attr] !== undefined && val !== saved[attr]) {
            el.setAttribute(attr, saved[attr]);
          }
          continue;
        }
        var srcVal = (saved && saved[attr] !== undefined) ? saved[attr] : val;
        var nextVal = engine.translateText(srcVal);
        if (nextVal !== srcVal) {
          if (originalAttrs) {
            var map = saved || {};
            if (map[attr] === undefined) map[attr] = srcVal;
            originalAttrs.set(el, map);
          }
          if (val !== nextVal) el.setAttribute(attr, nextVal);
        }
      }
    }

    function walkAndTranslate(rootEl) {
      if (!rootEl || isApplying) return;
      isApplying = true;
      if (observer) observer.disconnect();
      try {
        if (rootEl.nodeType === 3) {
          processTextNode(rootEl);
        } else if (rootEl.nodeType === 1) {
          if (shouldIgnoreElement(rootEl)) return;
          processAttributes(rootEl);
          var walker = document.createTreeWalker(rootEl, 5 /* SHOW_ELEMENT | SHOW_TEXT */);
          var current = walker.currentNode;
          while (current) {
            if (current.nodeType === 1) {
              if (!shouldIgnoreElement(current)) processAttributes(current);
            } else if (current.nodeType === 3) {
              processTextNode(current);
            }
            current = walker.nextNode();
          }
        }
      } finally {
        isApplying = false;
        startObserving();
      }
    }

    function startObserving() {
      if (!observer && typeof MutationObserver === 'function') {
        observer = new MutationObserver(function (mutations) {
          if (isApplying || !engine.isEnabled()) return;
          for (var i = 0; i < mutations.length; i++) {
            var m = mutations[i];
            if (m.type === 'characterData') {
              processTextNode(m.target);
            } else if (m.type === 'childList') {
              for (var j = 0; j < m.addedNodes.length; j++) {
                walkAndTranslate(m.addedNodes[j]);
              }
            }
          }
        });
      }
      if (observer && document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
    }

    function runFullScan() {
      if (document.body) walkAndTranslate(document.body);
    }

    function applyPayload(nextPayload) {
      engine.load(nextPayload);
      runFullScan();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        runFullScan();
        startObserving();
      });
    } else {
      runFullScan();
      startObserving();
    }

    var controller = {
      engine: engine,
      runFullScan: runFullScan,
      applyPayload: applyPayload,
      translateText: engine.translateText,
      shouldIgnoreElement: shouldIgnoreElement,
      looksLikeCodeOrPath: looksLikeCodeOrPath
    };

    if (globalScope) {
      globalScope.__AG_STUDIO_I18N__ = controller;
    }
    return controller;
  }

  var exportsObj = {
    looksLikeCodeOrPath: looksLikeCodeOrPath,
    shouldIgnoreElement: shouldIgnoreElement,
    createTranslatorEngine: createTranslatorEngine,
    initPreloadI18n: initPreloadI18n
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportsObj;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_I18N_MODULE__ = exportsObj;
  }
})(typeof window !== 'undefined' ? window : globalThis);
