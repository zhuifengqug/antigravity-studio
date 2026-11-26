'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function buildAll() {
  fs.mkdirSync(DIST, { recursive: true });

  const spritesPath = path.join(ROOT, 'src', 'renderer', 'assets', 'mascot-sprites.js');
  if (!fs.existsSync(spritesPath)) {
    const buildMascotAssets = path.join(ROOT, 'scripts', 'build-mascot-assets.js');
    if (fs.existsSync(buildMascotAssets)) {
      require(buildMascotAssets).buildSprites();
    }
  }

  const rendererParts = [
    path.join(ROOT, 'src', 'renderer', 'themes.js'),
    path.join(ROOT, 'src', 'renderer', 'typography.js'),
    path.join(ROOT, 'src', 'renderer', 'dom-anchors.js'),
    spritesPath,
    path.join(ROOT, 'src', 'renderer', 'mascot-stage.js'),
    path.join(ROOT, 'src', 'renderer', 'composer-hud.js'),
    path.join(ROOT, 'src', 'renderer', 'home-overview-card.js'),
    path.join(ROOT, 'src', 'renderer', 'prism-fx.js'),
    path.join(ROOT, 'src', 'renderer', 'vendor', 'effort-slider', 'upstream-client.js'),
    path.join(ROOT, 'src', 'renderer', 'vendor', 'effort-slider', 'slider-coexist.js'),
    path.join(ROOT, 'src', 'renderer', 'effort-slider.js'),
    path.join(ROOT, 'src', 'renderer', 'thought-translator.js'),
    path.join(ROOT, 'src', 'renderer', 'inline-diff.js'),
    path.join(ROOT, 'src', 'renderer', 'drawer-ui.js'),
    path.join(ROOT, 'src', 'renderer', 'bootstrap.js'),
  ];

  const upstreamClientPath = path.join(ROOT, 'src', 'renderer', 'vendor', 'effort-slider', 'upstream-client.js');
  const rendererBundle = [
    '// Built by scripts/build-renderer.js — Antigravity Studio Renderer Bundle',
    ...rendererParts.map((p) => {
      const src = fs.readFileSync(p, 'utf8');
      if (p === upstreamClientPath) {
        return ';(function(){try{globalThis.__agCodexEffortSliderDisableAutoBoot=true;if(typeof window!==\'undefined\')window.__agCodexEffortSliderDisableAutoBoot=true;}catch(_e){}})();\n' + src;
      }
      return src;
    }),
  ].join('\n\n');

  const outRenderer = path.join(DIST, 'studio-renderer.js');
  fs.writeFileSync(outRenderer, rendererBundle, 'utf8');

  const domRuntimeSrc = fs.readFileSync(path.join(ROOT, 'src', 'i18n', 'dom-runtime.js'), 'utf8');
  const outI18nPreload = path.join(DIST, 'studio-i18n-preload.js');
  fs.writeFileSync(outI18nPreload, `// Built by scripts/build-renderer.js\n${domRuntimeSrc}`, 'utf8');

  // Verify syntax with node --check
  execFileSync(process.execPath, ['--check', outRenderer], { stdio: 'inherit' });
  execFileSync(process.execPath, ['--check', outI18nPreload], { stdio: 'inherit' });

  console.log(`[build] Generated ${path.relative(ROOT, outRenderer)} (${Buffer.byteLength(rendererBundle)} bytes)`);
  console.log(`[build] Generated ${path.relative(ROOT, outI18nPreload)} (${Buffer.byteLength(domRuntimeSrc)} bytes)`);
}

if (require.main === module) {
  buildAll();
}

module.exports = { buildAll };
