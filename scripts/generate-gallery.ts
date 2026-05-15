/**
 * 生成「14 套版式 Gallery」预览 HTML：
 * - 把 sample.md 用真实 renderMarkdown 渲染一次（含所有自动元素）
 * - 把 14 套版式 CSS 全部 inline
 * - 顶部 14 个 tab 切换 data-template
 *
 * 跑：npx tsx scripts/generate-gallery.ts
 * 产出：previews/gallery.html
 */
import { JSDOM } from 'jsdom';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dom = new JSDOM('<!doctype html><html><body></body></html>');
(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
(globalThis as any).HTMLElement = dom.window.HTMLElement;
(globalThis as any).Node = dom.window.Node;

const { renderMarkdown } = await import('../src/utils/render.ts');
const { TEMPLATES } = await import('../src/utils/themes.ts');
const { SAMPLE_MD } = await import('../src/utils/sample.ts');

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');

const tokensCss = readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
const proseCss = readFileSync(path.join(root, 'src/styles/prose.css'), 'utf8');
const allTemplateCss = TEMPLATES.map((t) =>
  readFileSync(path.join(root, `src/styles/templates/${t.id}.css`), 'utf8')
).join('\n\n');

const renderedBody = renderMarkdown(SAMPLE_MD);

const tabsHtml = TEMPLATES.map((t, i) => {
  const isNew = ['juanshou', 'jiekan', 'yuebao', 'hongbang'].includes(t.id);
  return `<button data-t="${t.id}"${i === 0 ? ' class="active"' : ''}>${t.name}${isNew ? ' <span class="new">NEW</span>' : ''}</button>`;
}).join('\n    ');

const namesJs = TEMPLATES.map((t) => `${t.id}: '${t.name} ${t.id}'`).join(', ');
const defaultId = 'hongbang';

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Markdown AI · ${TEMPLATES.length} 套版式 Gallery</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=LXGW+WenKai+TC:wght@400;700&display=swap" rel="stylesheet">
<style>
${tokensCss}
${proseCss}
${allTemplateCss}

/* ============ Gallery UI ============ */
body { margin: 0; font-family: var(--sans); background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
.topbar {
  position: sticky; top: 0; z-index: 100;
  background: rgba(255,255,255,0.94);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  padding: 14px 20px;
}
.topbar-title {
  font-family: var(--serif); font-weight: 700; font-size: 18px;
  color: var(--ink); letter-spacing: -0.3px; margin-bottom: 12px;
}
.topbar-title .tag {
  font-family: var(--mono); font-size: 11px; letter-spacing: 1px;
  color: var(--text-muted); margin-left: 10px; text-transform: uppercase;
}
.template-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
.template-tabs button {
  border: 1.5px solid var(--border); background: var(--surface); color: var(--ink);
  padding: 7px 14px; border-radius: 20px;
  font-family: var(--sans); font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all 0.18s ease; letter-spacing: 0.3px;
  display: inline-flex; align-items: center; gap: 6px;
}
.template-tabs button:hover { border-color: var(--accent); color: var(--accent); transform: translateY(-1px); }
.template-tabs button.active { background: var(--accent); color: var(--paper); border-color: var(--accent); }
.template-tabs .new {
  display: inline-block;
  background: var(--accent); color: var(--paper);
  font-family: var(--mono); font-size: 9px; font-weight: 700;
  letter-spacing: 1px; padding: 1px 5px; border-radius: 3px;
}
.template-tabs button.active .new {
  background: var(--paper); color: var(--accent);
}
.stage { max-width: 760px; margin: 0 auto; padding: 32px 20px 80px; }
.stage-meta {
  font-family: var(--mono); font-size: 11px; letter-spacing: 1px;
  color: var(--text-muted); text-transform: uppercase;
  margin-bottom: 12px; text-align: center;
}
.stage-meta strong { color: var(--accent); font-weight: 700; }
</style>
</head>
<body>
<header class="topbar">
  <div class="topbar-title">Markdown AI · ${TEMPLATES.length} 套版式 Gallery <span class="tag">朱砂 · 文楷 · 浅色</span></div>
  <div class="template-tabs" id="tabs">
    ${tabsHtml}
  </div>
</header>

<div class="stage">
  <div class="stage-meta">CURRENT · <strong id="current-name">红榜 hongbang</strong></div>
  <article class="prose" id="prose" data-template="${defaultId}">
${renderedBody}
  </article>
</div>

<script>
(function () {
  var prose = document.getElementById('prose');
  var current = document.getElementById('current-name');
  var tabs = document.querySelectorAll('#tabs button');
  var names = { ${namesJs} };
  function activate(id) {
    prose.setAttribute('data-template', id);
    current.textContent = names[id];
    tabs.forEach(function (t) { t.classList.toggle('active', t.dataset.t === id); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { activate(t.dataset.t); }); });
  activate('${defaultId}');
})();
</script>
</body>
</html>
`;

mkdirSync(path.join(root, 'previews'), { recursive: true });
writeFileSync(path.join(root, 'previews', 'gallery.html'), html);
console.log(`✓ generated previews/gallery.html (${(html.length / 1024).toFixed(1)} KB, ${TEMPLATES.length} templates)`);
