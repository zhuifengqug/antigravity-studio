'use strict';

const fs = require('fs');
const path = require('path');
const { ConfigStore } = require('../shared/config-store');

let currentLangOverride = null;
const dictCache = new Map();

function loadDict(lang) {
  if (lang === 'en') return { exact: {}, regex: [] };
  if (dictCache.has(lang)) return dictCache.get(lang);
  const file = lang === 'zh-TW' ? 'dict.zh-TW.json' : 'dict.zh-CN.json';
  const candidates = [
    path.join(__dirname, file),
    path.join(__dirname, 'i18n', file),
  ];
  let parsed = { exact: {}, regex: [] };
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
        break;
      } catch {}
    }
  }
  const compiled = {
    exact: parsed.exact || {},
    regex: (parsed.regex || []).map((r) => ({
      re: new RegExp(r.pattern, r.flags || ''),
      replace: r.replace,
    })),
  };
  dictCache.set(lang, compiled);
  return compiled;
}

function getCurrentLanguage(store) {
  if (currentLangOverride) return currentLangOverride;
  try {
    const cfg = (store || new ConfigStore()).load();
    return cfg.i18n?.language || 'zh-CN';
  } catch {
    return 'zh-CN';
  }
}

function setCurrentLanguage(lang) {
  currentLangOverride = lang;
}

function translateNativeLabel(label, lang = getCurrentLanguage()) {
  if (!label || typeof label !== 'string' || lang === 'en') return label;
  const clean = label.replace(/&/g, '');
  const dict = loadDict(lang);
  if (Object.prototype.hasOwnProperty.call(dict.exact, clean)) {
    return dict.exact[clean];
  }
  if (Object.prototype.hasOwnProperty.call(dict.exact, label)) {
    return dict.exact[label];
  }
  for (const rule of dict.regex) {
    if (rule.re.test(clean)) {
      return clean.replace(rule.re, rule.replace);
    }
  }
  return label;
}

function translateMenuItemOptions(item, lang = getCurrentLanguage()) {
  if (!item || typeof item !== 'object' || lang === 'en') return item;
  const out = { ...item };
  if (typeof out.label === 'string') {
    out.label = translateNativeLabel(out.label, lang);
  }
  if (typeof out.toolTip === 'string') {
    out.toolTip = translateNativeLabel(out.toolTip, lang);
  }
  if (Array.isArray(out.submenu)) {
    out.submenu = translateMenuTemplate(out.submenu, lang);
  }
  return out;
}

function translateMenuTemplate(template, lang = getCurrentLanguage()) {
  try {
    const cfg = new ConfigStore().load();
    if (cfg.i18n?.translateNativeMenu === false || lang === 'en') return template;
  } catch {}
  if (!Array.isArray(template)) return template;
  return template.map((item) => translateMenuItemOptions(item, lang));
}

function translateMenuInstance(menu, lang = getCurrentLanguage()) {
  try {
    const cfg = new ConfigStore().load();
    if (cfg.i18n?.translateNativeMenu === false || lang === 'en') return menu;
  } catch {}
  if (!menu) return menu;
  const visit = (item) => {
    if (!item) return;
    if (typeof item.label === 'string') {
      item.label = translateNativeLabel(item.label, lang);
    }
    if (item.submenu) {
      if (Array.isArray(item.submenu.items)) {
        item.submenu.items.forEach(visit);
      } else if (Array.isArray(item.submenu)) {
        item.submenu.forEach(visit);
      }
    }
  };
  if (Array.isArray(menu.items)) {
    menu.items.forEach(visit);
  }
  return menu;
}

function translateTrayActions(actions, lang = getCurrentLanguage()) {
  try {
    const cfg = new ConfigStore().load();
    if (cfg.i18n?.translateTray === false || lang === 'en') return actions;
  } catch {}
  if (!Array.isArray(actions)) return actions;
  return actions.map((item) => translateMenuItemOptions(item, lang));
}

function formatTrayAgentCount(count, lang = getCurrentLanguage()) {
  const n = Number(count || 0);
  if (lang === 'en') {
    return n > 0 ? `${n} agents running` : 'No agents running';
  }
  if (lang === 'zh-TW') {
    return n > 0 ? `${n} 個代理執行中` : '目前無執行中的代理';
  }
  return n > 0 ? `${n} 个智能体运行中` : '没有智能体在运行';
}

module.exports = {
  getCurrentLanguage,
  setCurrentLanguage,
  translateNativeLabel,
  translateMenuItemOptions,
  translateMenuTemplate,
  translateMenuInstance,
  translateTrayActions,
  formatTrayAgentCount,
};
