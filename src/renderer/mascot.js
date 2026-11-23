(function (globalScope) {
  'use strict';

  var MASCOT_STATES = {
    idle: { label: '待机中', badge: '·' },
    thinking: { label: '思考中', badge: '✦' },
    working: { label: '调用工具中', badge: '⚡' },
    subagent: { label: '调度子智能体', badge: '◈' },
    waiting: { label: '等待确认', badge: '!' },
    success: { label: '已完成', badge: '✓' },
    error: { label: '遇到异常', badge: '×' },
    asleep: { label: '打盹中', badge: 'z' }
  };

  function getMascotSvg(style, state) {
    var st = MASCOT_STATES[state] ? state : 'idle';
    if (style === 'astra') {
      // Astra: cute blue/cyan starlight pixel cat spirit
      var eyeColor = st === 'error' ? '#F87171' : st === 'waiting' ? '#FBBF24' : '#38BDF8';
      var eyes = st === 'asleep'
        ? '<rect x="5" y="6" width="2" height="1" fill="#1E293B"/><rect x="9" y="6" width="2" height="1" fill="#1E293B"/>'
        : st === 'thinking'
          ? '<rect x="5" y="5" width="2" height="2" fill="' + eyeColor + '"/><rect x="9" y="5" width="2" height="1" fill="' + eyeColor + '"/>'
          : '<rect x="5" y="5" width="2" height="2" fill="' + eyeColor + '"/><rect x="9" y="5" width="2" height="2" fill="' + eyeColor + '"/>';
      return '<svg viewBox="0 0 16 14" width="26" height="22" shape-rendering="crispEdges" aria-hidden="true">' +
        '<rect x="3" y="1" width="2" height="2" fill="#60A5FA"/>' +
        '<rect x="11" y="1" width="2" height="2" fill="#60A5FA"/>' +
        '<rect x="3" y="3" width="10" height="7" fill="#E2E8F0"/>' +
        '<rect x="4" y="4" width="8" height="5" fill="#0F172A"/>' +
        eyes +
        '<rect x="7" y="7" width="2" height="1" fill="#38BDF8"/>' +
        '<rect x="4" y="10" width="8" height="3" fill="#3B82F6"/>' +
        '<rect x="2" y="10" width="2" height="2" fill="#60A5FA"/>' +
        '<rect x="12" y="10" width="2" height="2" fill="#60A5FA"/>' +
        '</svg>';
    }

    // Default: Clawd warm terracotta pixel crab
    var bodyColor = st === 'error' ? '#E06C6C' : st === 'success' ? '#4CAF84' : '#D97757';
    var crabEyes = st === 'asleep'
      ? '<rect x="5" y="6" width="2" height="1" fill="#1F1E1D"/><rect x="9" y="6" width="2" height="1" fill="#1F1E1D"/>'
      : '<rect x="5" y="5" width="2" height="2" fill="#1F1E1D"/><rect x="9" y="5" width="2" height="2" fill="#1F1E1D"/>';
    return '<svg viewBox="0 0 16 14" width="26" height="22" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect x="1" y="2" width="2" height="3" fill="' + bodyColor + '"/>' +
      '<rect x="13" y="2" width="2" height="3" fill="' + bodyColor + '"/>' +
      '<rect x="2" y="4" width="1" height="2" fill="' + bodyColor + '"/>' +
      '<rect x="13" y="4" width="1" height="2" fill="' + bodyColor + '"/>' +
      '<rect x="3" y="3" width="10" height="7" fill="' + bodyColor + '"/>' +
      crabEyes +
      '<rect x="4" y="10" width="2" height="3" fill="' + bodyColor + '"/>' +
      '<rect x="7" y="10" width="2" height="2" fill="' + bodyColor + '"/>' +
      '<rect x="10" y="10" width="2" height="3" fill="' + bodyColor + '"/>' +
      '</svg>';
  }

  function ensureMascotStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('ag-studio-mascot-style')) return;
    var s = document.createElement('style');
    s.id = 'ag-studio-mascot-style';
    s.textContent = [
      '@keyframes ags-bob { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-2px); } }',
      '@keyframes ags-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.65; } }',
      '.ags-mascot { display:inline-flex; align-items:center; gap:5px; cursor:pointer; user-select:none; transition:transform 150ms ease; transform-origin:bottom center; }',
      '.ags-mascot[data-state="thinking"] svg, .ags-mascot[data-state="working"] svg, .ags-mascot[data-state="subagent"] svg { animation: ags-bob 0.85s steps(2, end) infinite; }',
      '.ags-mascot[data-state="asleep"] svg { animation: ags-pulse 2.4s ease-in-out infinite; opacity: 0.72; }',
      '.ags-mascot-tip { font-size:11px; color:var(--ags-text-secondary); background:var(--ags-bg-surface); border:1px solid var(--ags-border); border-radius:999px; padding:1px 7px; opacity:0; transition:opacity 140ms ease; pointer-events:none; white-space:nowrap; }',
      '.ags-mascot:hover .ags-mascot-tip { opacity:1; }'
    ].join('\n');
    (document.head || document.documentElement).appendChild(s);
  }

  function createMascotWidget(options) {
    if (typeof document === 'undefined') return null;
    ensureMascotStyles();
    var opts = options || {};
    var el = document.createElement('div');
    el.className = 'ags-mascot';
    el.setAttribute('data-ag-studio-ignore', 'true');
    var currentStyle = opts.style || 'clawd';
    var currentState = opts.state || 'idle';
    var currentScale = Number(opts.scale || 1);

    function render() {
      var info = MASCOT_STATES[currentState] || MASCOT_STATES.idle;
      el.setAttribute('data-state', currentState);
      el.style.transform = 'scale(' + currentScale + ')';
      el.innerHTML = getMascotSvg(currentStyle, currentState) +
        '<span class="ags-mascot-tip">' + info.badge + ' ' + info.label + '</span>';
    }

    el.addEventListener('click', function () {
      if (typeof opts.onClick === 'function') opts.onClick();
    });

    render();

    return {
      element: el,
      update: function (next) {
        if (next.style) currentStyle = next.style;
        if (next.state) currentState = next.state;
        if (next.scale) currentScale = Number(next.scale);
        if (next.enabled === false) el.style.display = 'none';
        else el.style.display = 'inline-flex';
        render();
      }
    };
  }

  var api = {
    MASCOT_STATES: MASCOT_STATES,
    getMascotSvg: getMascotSvg,
    createMascotWidget: createMascotWidget
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (globalScope) {
    globalScope.__AG_STUDIO_MASCOT__ = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
