/**
 * 生成「公众号粘贴测试页」：把 10 套版式各自跑一遍 toWeChatHTML，
 * 把结果拼成一个静态 HTML 文件，每个区块带「复制此版式 inline HTML」按钮。
 *
 * 运行：npx tsx scripts/generate-wechat-snapshots.ts
 * 输出：previews/wechat-snapshots.html
 */
import { JSDOM } from 'jsdom';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// 先把 jsdom 注入全局，再 import 任何依赖 document 的模块
const dom = new JSDOM('<!doctype html><html><body></body></html>');
(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
(globalThis as any).HTMLElement = dom.window.HTMLElement;
(globalThis as any).HTMLSpanElement = dom.window.HTMLSpanElement;
(globalThis as any).HTMLDivElement = dom.window.HTMLDivElement;
(globalThis as any).Node = dom.window.Node;

// render.ts 不引 ?raw CSS，tsx 可直接 import
const { renderMarkdown } = await import('../src/utils/render.ts');
const { toWeChatHTML } = await import('../src/utils/copyAdapters.ts');
const { TEMPLATES } = await import('../src/utils/themes.ts');
const { SAMPLE_MD } = await import('../src/utils/sample.ts');

const palette = 'chushaa' as const;
const font = 'wenkai' as const;
const theme = 'light' as const;

const rendered = renderMarkdown(SAMPLE_MD);

const sections = TEMPLATES.map((t) => {
  const html = toWeChatHTML(rendered, palette, font, theme, t.id);
  return { meta: t, html };
});

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
mkdirSync(path.join(root, 'previews'), { recursive: true });

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const out = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>公众号粘贴测试 · 10 套版式</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=LXGW+WenKai+TC:wght@400;700&display=swap" rel="stylesheet">
<style>
  body {
    margin: 0;
    font-family: system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background: #f0ede7;
    color: #1a1a1a;
    -webkit-font-smoothing: antialiased;
    line-height: 1.6;
  }
  .head {
    background: #1a1a1a;
    color: #f6f3ed;
    padding: 20px 24px;
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .head h1 { font-size: 18px; margin: 0 0 6px; font-weight: 600; }
  .head p { margin: 0; font-size: 12.5px; opacity: 0.7; }
  .tabs {
    margin-top: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tabs a {
    display: inline-block;
    padding: 4px 10px;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 20px;
    color: #f6f3ed;
    text-decoration: none;
    font-size: 12px;
    transition: all 0.18s;
  }
  .tabs a:hover { background: #c44b2b; border-color: #c44b2b; }
  .container { max-width: 760px; margin: 0 auto; padding: 24px 16px 80px; }
  .card {
    background: #fff;
    border-radius: 10px;
    margin: 24px 0;
    padding: 22px 24px 26px;
    box-shadow: 0 2px 14px rgba(0,0,0,0.04);
  }
  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px dashed #e2ded6;
    flex-wrap: wrap;
    gap: 10px;
  }
  .card-head h2 {
    font-size: 16px;
    margin: 0;
    color: #c44b2b;
    font-weight: 700;
  }
  .card-head .desc {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #6b665e;
    letter-spacing: 0.5px;
  }
  .copy-btn {
    border: 1px solid #c44b2b;
    background: #fff;
    color: #c44b2b;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s;
    font-family: inherit;
  }
  .copy-btn:hover { background: #c44b2b; color: #fff; }
  .copy-btn.done { background: #2e7d8a; color: #fff; border-color: #2e7d8a; }
  .toast {
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    background: #1a1a1a;
    color: #f6f3ed;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 13px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s, transform 0.2s;
    z-index: 100;
  }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(-4px); }
  .info {
    background: #fbfaf7;
    border: 1px solid #e2ded6;
    border-radius: 10px;
    padding: 16px 20px;
    margin: 16px 0 0;
    font-size: 13.5px;
    line-height: 1.85;
    color: #4a4640;
  }
  .info strong { color: #c44b2b; }
  .info code {
    background: #f0ede7;
    padding: 1px 6px;
    border-radius: 3px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #c44b2b;
  }
</style>
</head>
<body>
<header class="head">
  <h1>公众号粘贴测试 · 10 套版式</h1>
  <p>每个区块都是 <code>toWeChatHTML()</code> 的真实输出。点「复制此版式 inline HTML」按钮，到公众号编辑器粘贴验证。</p>
  <div class="tabs">
${sections.map((s) => `    <a href="#${s.meta.id}">${s.meta.name}</a>`).join('\n')}
  </div>
</header>

<div class="container">

<div class="info">
  <strong>怎么测：</strong>每个区块下面有「复制此版式 inline HTML」按钮，点击后把 inline 富文本写入剪贴板。打开微信公众号后台编辑器，<code>Ctrl/Cmd+V</code> 粘贴 → 检查标题装饰 / 引用块 / 列表编号 / 分隔线是否都保留。如果有掉装饰，告诉我哪个版式哪个元素，我直接调。
</div>

${sections
  .map(
    (s, i) => `
<section id="${s.meta.id}" class="card">
  <div class="card-head">
    <div>
      <h2>${i + 1}. ${s.meta.name} · ${s.meta.id}</h2>
      <div class="desc">${s.meta.desc}</div>
    </div>
    <button class="copy-btn" data-i="${i}">复制此版式 inline HTML</button>
  </div>
  <div class="preview" id="preview-${i}">${s.html}</div>
  <textarea id="src-${i}" style="display:none">${escape(s.html)}</textarea>
</section>
`
  )
  .join('\n')}

</div>

<div class="toast" id="toast"></div>

<script>
(function () {
  const toast = document.getElementById('toast');
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  }
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const i = btn.dataset.i;
      const ta = document.getElementById('src-' + i);
      const html = ta.value;
      const plain = document.getElementById('preview-' + i).innerText;
      try {
        if (navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': new Blob([html], { type: 'text/html' }),
              'text/plain': new Blob([plain], { type: 'text/plain' }),
            }),
          ]);
        } else {
          await navigator.clipboard.writeText(plain);
        }
        btn.classList.add('done');
        btn.textContent = '已复制 ✓';
        showToast('已复制富文本，到公众号编辑器粘贴');
        setTimeout(() => {
          btn.classList.remove('done');
          btn.textContent = '复制此版式 inline HTML';
        }, 2200);
      } catch (e) {
        showToast('复制失败：' + (e.message || e));
      }
    });
  });
})();
</script>
</body>
</html>
`;

writeFileSync(path.join(root, 'previews', 'wechat-snapshots.html'), out);
console.log(`✓ generated previews/wechat-snapshots.html (${(out.length / 1024).toFixed(1)} KB, ${sections.length} templates)`);
