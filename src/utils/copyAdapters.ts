import {
  FontId,
  PaletteId,
  TemplateId,
  ThemeMode,
  getFontStack,
  getPaletteVars,
} from './themes';

const MONO = "'JetBrains Mono','Menlo','Consolas',monospace";
const KAITI = "'STKaiti','KaiTi','BiauKai','SimKai'";
const SERIF = "Georgia,'Times New Roman',serif";

/* ---------------- 公众号：行内样式 HTML ---------------- */

interface InlineCtx {
  accent: string;
  accentLight: string;
  accentGlow: string;
  ink: string;
  paper: string;
  surface: string;
  surface2: string;
  gray100: string;
  gray500: string;
  gray600: string;
  border: string;
  terminalBg: string;
  terminalText: string;
  prose: string;
}

function buildCtx(palette: PaletteId, font: FontId, theme: ThemeMode): InlineCtx {
  const v = getPaletteVars(palette, theme);
  return {
    accent: v.accent,
    accentLight: v.accentLight,
    accentGlow: v.accentGlow,
    ink: v.ink,
    paper: v.paper,
    surface: v.surface,
    surface2: v.surface2,
    gray100: v.gray100,
    gray500: v.gray500,
    gray600: v.gray600,
    border: v.border,
    terminalBg: v.terminalBg,
    terminalText: v.terminalText,
    prose: getFontStack(font),
  };
}

function setStyle(root: ParentNode, selector: string, css: string) {
  root.querySelectorAll(selector).forEach((el) => {
    const e = el as HTMLElement;
    const prev = e.getAttribute('style') ?? '';
    e.setAttribute('style', prev ? `${prev};${css}` : css);
  });
}

function mergeStyle(root: ParentNode, selector: string, css: string) {
  root.querySelectorAll(selector).forEach((el) => {
    const e = el as HTMLElement;
    const prev = e.getAttribute('style') ?? '';
    e.setAttribute('style', prev ? `${css};${prev}` : css);
  });
}

function span(text: string, css: string): HTMLSpanElement {
  const s = document.createElement('span');
  s.setAttribute('style', css);
  s.textContent = text;
  return s;
}

function div(css: string, text = ''): HTMLDivElement {
  const d = document.createElement('div');
  d.setAttribute('style', css);
  if (text) d.textContent = text;
  return d;
}

function replaceHr(root: ParentNode, build: () => HTMLElement) {
  root.querySelectorAll('hr').forEach((hr) => hr.replaceWith(build()));
}

function toRoman(n: number): string {
  const v = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const s = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let r = '';
  for (let i = 0; i < v.length; i++) while (n >= v[i]) { r += s[i]; n -= v[i]; }
  return r;
}

function toCjk(n: number): string {
  const d = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (n < 10) return d[n];
  if (n < 20) return n === 10 ? '十' : '十' + d[n - 10];
  if (n < 100) return d[Math.floor(n / 10)] + '十' + (n % 10 === 0 ? '' : d[n % 10]);
  return String(n);
}

function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

/** 给每个 li 注入有序编号 chip / 项目符号 span */
function injectListMarkers(
  root: ParentNode,
  ulMarker: (li: HTMLElement) => HTMLElement | null,
  olMarker: (li: HTMLElement, n: number) => HTMLElement | null
) {
  root.querySelectorAll('ul').forEach((ul) => {
    Array.from(ul.children).forEach((li) => {
      if (!(li instanceof HTMLElement) || li.tagName !== 'LI') return;
      const m = ulMarker(li);
      if (m) li.insertBefore(m, li.firstChild);
    });
  });
  root.querySelectorAll('ol').forEach((ol) => {
    let i = 0;
    Array.from(ol.children).forEach((li) => {
      if (!(li instanceof HTMLElement) || li.tagName !== 'LI') return;
      i++;
      const m = olMarker(li, i);
      if (m) li.insertBefore(m, li.firstChild);
    });
  });
}

/* ============================================================
   主入口
   ============================================================ */

export function toWeChatHTML(
  previewHTML: string,
  palette: PaletteId,
  font: FontId,
  theme: ThemeMode,
  template: TemplateId
): string {
  const ctx = buildCtx(palette, font, theme);
  const tpl = document.createElement('template');
  tpl.innerHTML = previewHTML;
  const root = tpl.content;

  applyShared(root, ctx);
  dispatchTemplate(root, ctx, template);

  const section = document.createElement('section');
  const wrapperStyle = wrapperStyleFor(template, ctx);
  section.setAttribute(
    'style',
    `font-family:${ctx.prose};color:${ctx.ink};max-width:100%;line-height:1.85;font-size:16px;${wrapperStyle}`
  );
  section.appendChild(root);
  return section.outerHTML;
}

function wrapperStyleFor(_template: TemplateId, _ctx: InlineCtx): string {
  // 公众号编辑器会把 wrapper section 上的 background-image (radial/linear-gradient)
  // 大概率 strip 掉，所以这里不再下发底纹。底纹只在 app 内预览展示。
  return '';
}

function applyShared(root: ParentNode, ctx: InlineCtx) {
  mergeStyle(root, 'p', `font-family:${ctx.prose};font-size:16px;line-height:1.85;margin:0 0 16px;color:${ctx.ink}`);
  mergeStyle(root, 'em', `font-style:italic`);
  mergeStyle(root, 'ul,ol', `margin:0 0 16px;padding-left:24px`);
  mergeStyle(root, 'li', `margin:0 0 8px;line-height:1.85;color:${ctx.ink};font-family:${ctx.prose};font-size:16px`);
  mergeStyle(root, 'img', `max-width:100%;border-radius:8px;margin:18px 0;display:block`);
  mergeStyle(root, 'table', `width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;font-family:${ctx.prose}`);
  mergeStyle(root, 'th', `text-align:left;padding:10px 14px;background:${ctx.gray100};font-weight:600;border-bottom:2px solid ${ctx.border};color:${ctx.ink}`);
  mergeStyle(root, 'td', `padding:10px 14px;border-bottom:1px solid ${ctx.border};color:${ctx.ink}`);
  mergeStyle(root, 'pre', `background:${ctx.terminalBg};color:${ctx.terminalText};padding:16px 18px;border-radius:8px;overflow-x:auto;margin:20px 0;font-family:${MONO};font-size:13px;line-height:1.65`);
  mergeStyle(root, 'pre code', `background:none;padding:0;border-radius:0;color:inherit;font-size:inherit;font-family:${MONO}`);
  mergeStyle(root, '.hljs-keyword,.hljs-selector-tag,.hljs-built_in', `color:#ff7b72`);
  mergeStyle(root, '.hljs-string,.hljs-attr', `color:#a5d6ff`);
  mergeStyle(root, '.hljs-number,.hljs-literal', `color:#79c0ff`);
  mergeStyle(root, '.hljs-comment,.hljs-quote', `color:#8b949e;font-style:italic`);
  mergeStyle(root, '.hljs-title,.hljs-function,.hljs-name', `color:#d2a8ff`);
  mergeStyle(root, '.hljs-variable,.hljs-params', `color:#ffa657`);
  mergeStyle(root, '.hljs-tag,.hljs-meta', `color:#7ee787`);
}

function dispatchTemplate(root: ParentNode, ctx: InlineCtx, template: TemplateId) {
  switch (template) {
    case 'qingye': return applyQingye(root, ctx);
    case 'haibao': return applyHaibao(root, ctx);
    case 'ningmeng': return applyNingmeng(root, ctx);
    case 'chongying': return applyChongying(root, ctx);
    case 'huabao': return applyHuabao(root, ctx);
    case 'yinzhang': return applyYinzhang(root, ctx);
    case 'geshan': return applyGeshan(root, ctx);
    case 'shouzha': return applyShouzha(root, ctx);
    case 'jiguang': return applyJiguang(root, ctx);
    case 'zhangye': return applyZhangye(root, ctx);
  }
}

/* ============================================================
   1. 晴野 qingye
   ============================================================ */
function applyQingye(root: ParentNode, ctx: InlineCtx) {
  setStyle(root, 'h1', `font-family:${ctx.prose};font-size:30px;font-weight:800;line-height:1.32;color:${ctx.accent};letter-spacing:-.4px;margin:4px 0 24px;padding:0;border:none`);
  root.querySelectorAll('h2').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:21px;font-weight:800;line-height:1.4;margin:40px 0 16px;padding:0 0 10px;color:${ctx.accent};border:none;border-bottom:3px solid ${ctx.accent};letter-spacing:-.1px`);
    const icon = span('▍', `display:inline-block;color:${ctx.accent};margin-right:10px;font-weight:900`);
    h.insertBefore(icon, h.firstChild);
  });
  setStyle(root, 'h3', `font-family:${ctx.prose};font-size:18px;font-weight:700;line-height:1.4;margin:28px 0 12px;color:${ctx.accent}`);
  setStyle(root, 'h4', `font-family:${ctx.prose};font-size:16px;font-weight:700;margin:22px 0 8px;color:${ctx.gray600}`);

  root.querySelectorAll('blockquote').forEach((b) => {
    (b as HTMLElement).setAttribute('style', `border:none;border-radius:12px;background:${ctx.accentGlow};padding:18px 24px 20px;margin:24px 0;color:${ctx.gray600};font-style:normal`);
    // 引号改为 block 元素放在最前，避开 absolute（公众号不稳定）
    const q = div(`font-size:42px;line-height:.7;color:${ctx.accent};font-family:${SERIF};font-weight:700;margin-bottom:6px`, '"');
    b.insertBefore(q, b.firstChild);
  });
  setStyle(root, 'blockquote p', `margin:0 0 8px;color:${ctx.gray600}`);

  replaceHr(root, () => div(`height:2px;background:${ctx.accent};opacity:.6;margin:36px 0`));

  setStyle(root, 'strong', `color:${ctx.accent};font-weight:700`);
  setStyle(root, 'a', `color:${ctx.accent};text-decoration:underline;text-underline-offset:3px;font-weight:500`);
  setStyle(root, 'code', `background:${ctx.accentGlow};color:${ctx.accent};padding:2px 6px;border-radius:3px;font-family:${MONO};font-size:13.5px;font-weight:500`);
  setStyle(root, 'th', `text-align:left;padding:10px 14px;background:${ctx.accent};color:${ctx.paper};font-weight:600;border-bottom:none`);

  injectListMarkers(root,
    () => span('◆', `color:${ctx.accent};font-size:.7em;margin-right:10px;vertical-align:middle`),
    (_li, n) => span(String(n), `display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:${ctx.accent};color:${ctx.paper};border-radius:6px;font-family:${MONO};font-size:12px;font-weight:700;margin-right:10px;vertical-align:middle`)
  );
  setStyle(root, 'ul,ol', `padding-left:4px;list-style:none;margin:0 0 16px`);
}

/* ============================================================
   2. 海报 haibao
   ============================================================ */
function applyHaibao(root: ParentNode, ctx: InlineCtx) {
  setStyle(root, 'h1', `font-family:${ctx.prose};font-size:32px;font-weight:800;line-height:1.25;background:${ctx.accent};color:${ctx.paper};padding:28px 24px;margin:0 0 28px;letter-spacing:-.4px;border:none`);
  root.querySelectorAll('h2').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:22px;font-weight:800;line-height:1.4;margin:40px 0 16px;padding:0 0 6px;border:none;border-bottom:4px solid ${ctx.accent};color:${ctx.ink};letter-spacing:-.2px;display:inline-block`);
  });
  root.querySelectorAll('h3').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:18px;font-weight:700;line-height:1.4;margin:28px 0 10px;color:${ctx.ink};display:flex;align-items:center;gap:12px`);
    const bar = span('', `display:inline-block;width:6px;height:18px;background:${ctx.accent};flex-shrink:0`);
    h.insertBefore(bar, h.firstChild);
  });
  setStyle(root, 'h4', `font-family:${ctx.prose};font-size:16px;font-weight:700;margin:22px 0 8px;color:${ctx.gray600}`);

  root.querySelectorAll('blockquote').forEach((b) => {
    (b as HTMLElement).setAttribute('style', `border:none;background:${ctx.ink};color:${ctx.paper};padding:18px 22px;margin:24px 0;border-radius:0;font-style:normal;font-weight:500;position:relative;border-left:5px solid ${ctx.accent}`);
  });
  setStyle(root, 'blockquote p', `color:${ctx.paper};margin:0 0 8px`);

  replaceHr(root, () => div(`height:5px;background:${ctx.accent};width:72px;margin:40px 0`));

  setStyle(root, 'strong', `color:${ctx.accent};font-weight:700`);
  setStyle(root, 'a', `color:${ctx.accent};text-decoration:underline;font-weight:600`);
  setStyle(root, 'code', `background:${ctx.ink};color:${ctx.paper};padding:2px 7px;border-radius:2px;font-family:${MONO};font-size:13.5px`);
  setStyle(root, 'th', `background:${ctx.ink};color:${ctx.paper};padding:10px 14px;font-weight:600;border-bottom:none;text-align:left`);

  injectListMarkers(root,
    () => span('', `display:inline-block;width:14px;height:4px;background:${ctx.accent};margin-right:10px;vertical-align:middle`),
    (_li, n) => span(pad2(n), `color:${ctx.accent};font-family:${MONO};font-size:18px;font-weight:800;margin-right:12px;letter-spacing:-1px`)
  );
  setStyle(root, 'ul,ol', `padding-left:4px;list-style:none;margin:0 0 16px`);
}

/* ============================================================
   3. 柠檬 ningmeng
   ============================================================ */
function applyNingmeng(root: ParentNode, ctx: InlineCtx) {
  root.querySelectorAll('h1').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:28px;font-weight:700;line-height:1.35;margin:8px 0 12px;padding-bottom:14px;border:none;letter-spacing:-.3px`);
    const bar = div(`width:48px;height:5px;background:${ctx.accent};border-radius:2px;margin-top:12px`);
    h.appendChild(bar);
  });
  setStyle(root, 'h2', `font-family:${ctx.prose};display:inline-block;font-size:20px;font-weight:700;line-height:1.4;margin:36px 0 18px;padding:6px 16px 7px;background:${ctx.accent};color:${ctx.paper};border:none;letter-spacing:.3px;border-radius:2px`);
  setStyle(root, 'h3', `font-family:${ctx.prose};font-size:18px;font-weight:700;line-height:1.4;margin:28px 0 12px;padding-bottom:5px;display:inline-block;border-bottom:3px solid ${ctx.accent}`);
  setStyle(root, 'h4', `font-family:${ctx.prose};font-size:16px;font-weight:700;margin:22px 0 8px;color:${ctx.gray600}`);

  root.querySelectorAll('blockquote').forEach((b) => {
    (b as HTMLElement).setAttribute('style', `border:none;border-left:5px solid ${ctx.accent};background:${ctx.surface2};padding:14px 20px;margin:20px 0;border-radius:0 6px 6px 0;color:${ctx.gray600};font-style:normal`);
  });
  setStyle(root, 'blockquote p', `margin:0 0 8px;color:${ctx.gray600}`);

  replaceHr(root, () => div(`height:4px;border-radius:2px;background:${ctx.accent};width:60px;margin:40px 0`));

  setStyle(root, 'strong', `color:${ctx.accent};font-weight:700`);
  setStyle(root, 'a', `color:${ctx.accent};font-weight:600;text-decoration:underline;text-underline-offset:3px`);
  setStyle(root, 'code', `background:${ctx.accent};color:${ctx.paper};padding:2px 8px;border-radius:3px;font-family:${MONO};font-size:13.5px;font-weight:500`);
  setStyle(root, 'th', `background:${ctx.accent};color:${ctx.paper};padding:10px 14px;font-weight:600;border-bottom:none;text-align:left`);

  injectListMarkers(root,
    () => span('', `display:inline-block;width:8px;height:8px;background:${ctx.accent};border-radius:50%;margin-right:12px;vertical-align:middle`),
    (_li, n) => span(String(n), `display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:${ctx.accent};color:${ctx.paper};border-radius:50%;font-family:${MONO};font-size:12px;font-weight:700;margin-right:10px;vertical-align:middle`)
  );
  setStyle(root, 'ul,ol', `padding-left:4px;list-style:none;margin:0 0 16px`);
}

/* ============================================================
   4. 重影 chongying
   ============================================================ */
function applyChongying(root: ParentNode, ctx: InlineCtx) {
  setStyle(root, 'h1', `font-family:${ctx.prose};font-size:26px;font-weight:800;line-height:1.3;margin:12px 0 24px;padding:8px 16px 9px;border:2px solid ${ctx.ink};box-shadow:6px 6px 0 ${ctx.accent};display:inline-block;background:${ctx.surface};color:${ctx.ink};letter-spacing:-.3px`);
  setStyle(root, 'h2', `font-family:${ctx.prose};font-size:18px;font-weight:700;line-height:1.4;margin:36px 0 18px;padding:5px 14px 6px;background:${ctx.surface};color:${ctx.ink};border:2px solid ${ctx.accent};box-shadow:4px 4px 0 ${ctx.accent};display:inline-block;border-radius:2px;letter-spacing:.2px`);
  root.querySelectorAll('h3').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:17px;font-weight:700;line-height:1.4;margin:24px 0 12px;color:${ctx.ink};display:flex;align-items:center;gap:10px`);
    const bar = span('', `display:inline-block;width:4px;height:18px;background:${ctx.accent};flex-shrink:0`);
    h.insertBefore(bar, h.firstChild);
  });
  setStyle(root, 'h4', `font-family:${ctx.prose};font-size:15px;font-weight:700;margin:20px 0 8px;color:${ctx.gray600}`);

  root.querySelectorAll('blockquote').forEach((b) => {
    (b as HTMLElement).setAttribute('style', `border:2px solid ${ctx.ink};border-radius:4px;background:${ctx.surface};padding:14px 18px;margin:20px 0;box-shadow:4px 4px 0 ${ctx.accent};font-style:normal;color:${ctx.gray600}`);
  });
  setStyle(root, 'blockquote p', `margin:0 0 8px;color:${ctx.gray600}`);

  // 公众号对 repeating-linear-gradient 支持有限，改用一行短条排列：用三段 inline-block 短块拼接
  replaceHr(root, () => {
    const wrap = div(`margin:36px 0;text-align:left;line-height:0;font-size:0`);
    const make = (color: string) => span('', `display:inline-block;width:18px;height:6px;background:${color};margin-right:6px;vertical-align:middle`);
    wrap.appendChild(make(ctx.accent));
    wrap.appendChild(make(ctx.ink));
    wrap.appendChild(make(ctx.accent));
    return wrap;
  });

  setStyle(root, 'strong', `background:${ctx.accent};color:${ctx.paper};padding:1px 5px;border-radius:2px;font-weight:700`);
  setStyle(root, 'a', `color:${ctx.ink};font-weight:600;text-decoration:none;background:linear-gradient(transparent 60%,${ctx.accentGlow} 60%);padding:0 2px`);
  setStyle(root, 'code', `background:${ctx.surface};color:${ctx.ink};border:1px solid ${ctx.ink};padding:0 6px;border-radius:2px;font-family:${MONO};font-size:13.5px`);
  setStyle(root, 'th', `background:${ctx.ink};color:${ctx.paper};padding:10px 14px;border-bottom:none;text-align:left`);

  injectListMarkers(root,
    () => span('', `display:inline-block;width:8px;height:8px;background:${ctx.accent};border:1.5px solid ${ctx.ink};margin-right:10px;vertical-align:middle`),
    (_li, n) => span(String(n), `display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:1.5px solid ${ctx.ink};background:${ctx.surface};box-shadow:2px 2px 0 ${ctx.accent};color:${ctx.ink};font-family:${MONO};font-size:12px;font-weight:700;margin-right:12px;vertical-align:middle`)
  );
  setStyle(root, 'ul,ol', `padding-left:4px;list-style:none;margin:0 0 16px`);
}

/* ============================================================
   5. 画报 huabao
   ============================================================ */
function applyHuabao(root: ParentNode, ctx: InlineCtx) {
  root.querySelectorAll('h1').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:32px;font-weight:700;line-height:1.25;text-align:center;margin:8px 0 12px;padding:18px 0 0;border:none;letter-spacing:-.3px`);
    const bar = div(`width:24px;height:2px;background:${ctx.accent};margin:0 auto 14px`);
    h.insertBefore(bar, h.firstChild);
  });
  setStyle(root, 'h2', `font-family:${ctx.prose};font-size:13px;font-weight:700;line-height:1.4;text-align:center;margin:48px 0 12px;padding:10px 0;border-top:1px solid ${ctx.ink};border-bottom:1px solid ${ctx.ink};letter-spacing:6px;color:${ctx.ink};text-transform:uppercase`);
  setStyle(root, 'h3', `font-family:${ctx.prose};font-size:19px;font-weight:700;line-height:1.4;margin:32px 0 12px;color:${ctx.ink};font-style:italic`);
  setStyle(root, 'h4', `font-family:${ctx.prose};font-size:14px;font-weight:700;margin:22px 0 8px;color:${ctx.gray600};letter-spacing:.5px;text-transform:uppercase`);

  root.querySelectorAll('blockquote').forEach((b) => {
    (b as HTMLElement).setAttribute('style', `border:none;background:transparent;text-align:center;font-style:italic;color:${ctx.ink};padding:14px 28px;margin:32px 0;font-size:18px;line-height:1.7`);
    const q = div(`font-size:48px;color:${ctx.accent};line-height:.6;font-family:${SERIF};margin-bottom:6px;font-weight:700;font-style:normal`, '"');
    b.insertBefore(q, b.firstChild);
    const tail = div(`width:24px;height:1px;background:${ctx.accent};margin:14px auto 0`);
    b.appendChild(tail);
  });
  setStyle(root, 'blockquote p', `margin:0 0 6px;color:${ctx.ink}`);

  replaceHr(root, () => div(`text-align:center;color:${ctx.accent};font-size:16px;margin:48px 0;line-height:1`, '❖'));

  setStyle(root, 'strong', `color:${ctx.ink};font-weight:700;border-bottom:1px solid ${ctx.accent}`);
  setStyle(root, 'a', `color:${ctx.ink};border-bottom:1px solid ${ctx.accent};text-decoration:none`);
  setStyle(root, 'code', `background:${ctx.gray100};color:${ctx.accent};padding:1px 7px;border-radius:3px;font-family:${MONO};font-size:13.5px`);

  injectListMarkers(root,
    () => span('', `display:inline-block;width:10px;height:1px;background:${ctx.ink};margin-right:10px;vertical-align:middle`),
    (_li, n) => span(String(n), `color:${ctx.accent};font-family:${SERIF};font-style:italic;font-weight:700;font-size:18px;margin-right:12px;vertical-align:baseline`)
  );
  setStyle(root, 'ul,ol', `padding-left:4px;list-style:none;margin:0 0 16px`);
}

/* ============================================================
   6. 印章 yinzhang
   ============================================================ */
function applyYinzhang(root: ParentNode, ctx: InlineCtx) {
  root.querySelectorAll('h1').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:28px;font-weight:700;line-height:1.4;margin:14px 0 22px;padding:0;border:none;letter-spacing:1.5px;color:${ctx.ink};display:flex;align-items:center;gap:18px`);
    // 朱印外层：accent 实心方块；内层：paper 边框模拟"印章透气"；不用 transform / inset shadow
    const seal = div(`width:46px;height:46px;background:${ctx.accent};padding:3px;flex-shrink:0;display:flex;align-items:center;justify-content:center`);
    const inner = span('印', `display:flex;align-items:center;justify-content:center;width:100%;height:100%;border:1.5px solid ${ctx.paper};color:${ctx.paper};font-family:${KAITI},${ctx.prose};font-weight:700;font-size:20px`);
    seal.appendChild(inner);
    h.appendChild(seal);
  });
  root.querySelectorAll('h2').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:22px;font-weight:700;line-height:1.5;margin:40px 0 16px;padding:0 0 8px;border:none;border-bottom:1px solid ${ctx.border};color:${ctx.ink};letter-spacing:.8px;display:flex;align-items:center;gap:12px`);
    // 小方印：accent 外块 + paper 内框（border 模拟），无 rotate
    const sq = div(`width:20px;height:20px;background:${ctx.accent};padding:2px;flex-shrink:0;box-sizing:border-box`);
    const inner = div(`width:100%;height:100%;border:1px solid ${ctx.paper}`);
    sq.appendChild(inner);
    h.insertBefore(sq, h.firstChild);
  });
  setStyle(root, 'h3', `font-family:${ctx.prose};font-size:18px;font-weight:700;line-height:1.5;margin:28px 0 12px;color:${ctx.ink};letter-spacing:.5px;padding-left:14px;border-left:2px solid ${ctx.accent}`);
  setStyle(root, 'h4', `font-family:${ctx.prose};font-size:16px;font-weight:600;margin:22px 0 8px;color:${ctx.gray600}`);

  root.querySelectorAll('blockquote').forEach((b) => {
    // 「」 改成内嵌行内 span，不用 position:absolute（公众号常吞 absolute）
    (b as HTMLElement).setAttribute('style', `border:none;background:transparent;padding:8px 20px;margin:24px 0;color:${ctx.gray600};font-family:${KAITI},${ctx.prose};font-size:16.5px;line-height:1.9`);
    const open = span('「', `font-size:24px;color:${ctx.accent};font-weight:700;margin-right:4px;vertical-align:-2px`);
    b.insertBefore(open, b.firstChild);
    const close = span('」', `font-size:24px;color:${ctx.accent};font-weight:700;margin-left:4px;vertical-align:-2px`);
    b.appendChild(close);
  });
  setStyle(root, 'blockquote p', `margin:0 0 6px;color:${ctx.gray600};display:inline`);

  replaceHr(root, () => div(`text-align:center;color:${ctx.accent};font-size:12px;letter-spacing:18px;padding-left:18px;margin:40px 0;line-height:1`, '◆ ◆ ◆'));

  setStyle(root, 'strong', `color:${ctx.accent};font-weight:700`);
  setStyle(root, 'a', `color:${ctx.accent};border-bottom:1px solid ${ctx.accent};text-decoration:none`);
  setStyle(root, 'code', `background:${ctx.accentGlow};color:${ctx.accent};padding:2px 6px;border-radius:2px;font-family:${MONO};font-size:13.5px`);

  injectListMarkers(root,
    () => span('◆', `color:${ctx.accent};font-size:.7em;margin-right:10px;vertical-align:middle`),
    (_li, n) => span(toCjk(n) + '、', `color:${ctx.accent};font-weight:700;margin-right:6px`)
  );
  setStyle(root, 'ul,ol', `padding-left:0;list-style:none;margin:0 0 16px`);
}

/* ============================================================
   7. 格栅 geshan
   ============================================================ */
function applyGeshan(root: ParentNode, ctx: InlineCtx) {
  root.querySelectorAll('h1').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${MONO},${ctx.prose};font-size:26px;font-weight:700;line-height:1.3;margin:4px 0 16px;padding:0;border:none;color:${ctx.ink};letter-spacing:-.4px`);
    const hashtag = span('# ', `color:${ctx.accent};font-family:${MONO};font-weight:700`);
    h.insertBefore(hashtag, h.firstChild);
  });
  root.querySelectorAll('h2').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${MONO},${ctx.prose};font-size:18px;font-weight:600;line-height:1.4;margin:32px 0 16px;padding:6px 12px;border:1px dashed ${ctx.accent};background:${ctx.surface};color:${ctx.ink};display:inline-block`);
    h.insertBefore(span('[ ', `color:${ctx.accent};font-weight:700`), h.firstChild);
    h.appendChild(span(' ]', `color:${ctx.accent};font-weight:700`));
  });
  root.querySelectorAll('h3').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${MONO},${ctx.prose};font-size:16px;font-weight:600;line-height:1.4;margin:24px 0 12px;color:${ctx.ink}`);
    h.insertBefore(span('> ', `color:${ctx.accent};font-weight:700`), h.firstChild);
  });
  root.querySelectorAll('h4').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${MONO},${ctx.prose};font-size:14px;font-weight:600;margin:20px 0 8px;color:${ctx.gray600}`);
    h.insertBefore(span('// ', `color:${ctx.gray500}`), h.firstChild);
  });

  root.querySelectorAll('blockquote').forEach((b) => {
    (b as HTMLElement).setAttribute('style', `border:1px solid ${ctx.ink};border-left:4px solid ${ctx.accent};background:${ctx.surface};padding:12px 16px;margin:20px 0;color:${ctx.ink};font-family:${MONO},${ctx.prose};font-size:13.5px;line-height:1.75`);
    b.querySelectorAll('p').forEach((p) => {
      const prev = (p as HTMLElement).getAttribute('style') ?? '';
      (p as HTMLElement).setAttribute('style', `${prev};margin:0 0 6px;font-family:inherit;color:${ctx.ink}`);
      p.insertBefore(span('> ', `color:${ctx.accent}`), p.firstChild);
    });
  });

  replaceHr(root, () => {
    // flex 三段：横线 - / / / - 横线，避开 absolute / negative top
    const wrap = div(`display:flex;align-items:center;gap:12px;margin:36px 0`);
    const lineL = div(`flex:1;height:1px;background:${ctx.ink}`);
    const text = span('/ / /', `color:${ctx.accent};font-family:${MONO};font-size:12px;letter-spacing:2px;flex-shrink:0`);
    const lineR = div(`flex:1;height:1px;background:${ctx.ink}`);
    wrap.appendChild(lineL);
    wrap.appendChild(text);
    wrap.appendChild(lineR);
    return wrap;
  });

  setStyle(root, 'strong', `color:${ctx.accent};font-weight:700`);
  setStyle(root, 'em', `color:${ctx.gray600};font-style:italic`);
  setStyle(root, 'a', `color:${ctx.accent};font-family:${MONO};text-decoration:underline`);
  setStyle(root, 'code', `background:${ctx.ink};color:${ctx.accent};padding:2px 7px;border-radius:0;font-family:${MONO};font-size:13px;font-weight:500`);

  injectListMarkers(root,
    () => span('- ', `color:${ctx.accent};font-family:${MONO};font-weight:700;margin-right:6px`),
    (_li, n) => span(pad2(n) + '.', `color:${ctx.accent};font-family:${MONO};font-weight:700;font-size:13px;margin-right:10px`)
  );
  setStyle(root, 'ul,ol', `padding-left:4px;list-style:none;margin:0 0 16px`);
}

/* ============================================================
   8. 手札 shouzha
   ============================================================ */
function applyShouzha(root: ParentNode, ctx: InlineCtx) {
  // 公众号不可靠：SVG data: URL / absolute / linear-gradient 50%/50%（虚线 trick）
  // 替代方案：CSS text-decoration: underline wavy 或粗实色 border-bottom；blockquote 用 dashed border-left
  setStyle(root, 'h1', `font-family:${KAITI},${ctx.prose};font-size:30px;font-weight:700;line-height:1.3;margin:8px 0 22px;padding:0 0 8px;border:none;border-bottom:3px solid ${ctx.accent};letter-spacing:1px;color:${ctx.ink}`);
  setStyle(root, 'h2', `font-family:${KAITI},${ctx.prose};font-size:22px;font-weight:700;line-height:1.4;margin:36px 0 14px;padding:0 6px 6px;border:none;border-bottom:3px solid ${ctx.accent};color:${ctx.ink};letter-spacing:1px;display:inline-block`);
  root.querySelectorAll('h3').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${KAITI},${ctx.prose};font-size:18px;font-weight:700;line-height:1.5;margin:26px 0 10px;color:${ctx.accent};letter-spacing:.5px`);
    h.insertBefore(span('✎ ', `color:${ctx.accent};font-size:.85em`), h.firstChild);
  });
  setStyle(root, 'h4', `font-family:${KAITI},${ctx.prose};font-size:15px;font-weight:600;margin:20px 0 8px;color:${ctx.gray600};font-style:italic`);

  // blockquote 旁线改 border-left dashed（公众号原生支持），不再用 absolute + linear-gradient
  root.querySelectorAll('blockquote').forEach((b) => {
    (b as HTMLElement).setAttribute('style', `border:none;border-left:3px dashed ${ctx.accent};background:transparent;padding:8px 16px 8px 18px;margin:20px 0;color:${ctx.gray600};font-family:${KAITI},${ctx.prose};font-size:16.5px`);
  });
  setStyle(root, 'blockquote p', `margin:0 0 6px;color:${ctx.gray600};font-family:inherit`);

  // hr 用虚线 border-top（公众号原生支持）
  replaceHr(root, () => div(`border:none;border-top:2px dotted ${ctx.accent};opacity:.7;margin:32px 0;height:0`));

  setStyle(root, 'strong', `color:${ctx.ink};font-weight:700;background:linear-gradient(transparent 65%,${ctx.accentGlow} 65%);padding:0 2px`);
  setStyle(root, 'em', `color:${ctx.accent};font-style:italic`);
  setStyle(root, 'a', `color:${ctx.accent};text-decoration:underline`);
  setStyle(root, 'code', `background:${ctx.accentGlow};color:${ctx.accent};padding:2px 6px;border-radius:3px;font-family:${MONO};font-size:13.5px`);

  injectListMarkers(root,
    () => span('❉ ', `color:${ctx.accent};font-size:.75em;margin-right:8px;vertical-align:middle`),
    (_li, n) => span(n + '.', `color:${ctx.accent};font-family:${SERIF};font-style:italic;font-weight:700;font-size:1.1em;margin-right:10px`)
  );
  setStyle(root, 'ul,ol', `padding-left:4px;list-style:none;margin:0 0 16px`);
}

/* ============================================================
   9. 极光 jiguang
   ============================================================ */
function applyJiguang(root: ParentNode, ctx: InlineCtx) {
  setStyle(root, 'h1', `font-family:${ctx.prose};font-size:30px;font-weight:800;line-height:1.3;margin:8px 0 24px;padding:4px 0 4px 16px;border:none;border-left:6px solid ${ctx.accent};background:linear-gradient(90deg,${ctx.accentGlow},transparent 60%);letter-spacing:-.3px;color:${ctx.ink}`);
  setStyle(root, 'h2', `font-family:${ctx.prose};font-size:21px;font-weight:700;line-height:1.4;margin:36px 0 16px;padding:0 0 8px;border:none;background-image:linear-gradient(90deg,${ctx.accent},transparent 80%);background-repeat:no-repeat;background-size:100% 3px;background-position:0 100%;color:${ctx.ink};letter-spacing:-.2px`);
  root.querySelectorAll('h3').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:18px;font-weight:700;line-height:1.4;margin:28px 0 12px;color:${ctx.ink};display:flex;align-items:center;gap:10px`);
    const dot = span('', `display:inline-block;width:8px;height:8px;border-radius:50%;background:linear-gradient(135deg,${ctx.accent},${ctx.accentLight});flex-shrink:0`);
    h.insertBefore(dot, h.firstChild);
  });
  setStyle(root, 'h4', `font-family:${ctx.prose};font-size:16px;font-weight:700;margin:22px 0 8px;color:${ctx.gray600}`);

  root.querySelectorAll('blockquote').forEach((b) => {
    (b as HTMLElement).setAttribute('style', `border:none;border-left:3px solid ${ctx.accent};background:linear-gradient(135deg,${ctx.accentGlow},transparent 70%);padding:14px 20px;margin:22px 0;border-radius:8px;font-style:normal;color:${ctx.gray600}`);
  });
  setStyle(root, 'blockquote p', `margin:0 0 8px;color:${ctx.gray600}`);

  replaceHr(root, () => div(`height:3px;background:linear-gradient(90deg,${ctx.accent},transparent 100%);margin:36px 0;border-radius:2px`));

  setStyle(root, 'strong', `color:${ctx.accent};font-weight:700`);
  setStyle(root, 'a', `color:${ctx.accent};text-decoration:underline`);
  setStyle(root, 'code', `background:${ctx.accentGlow};color:${ctx.accent};padding:2px 7px;border-radius:4px;font-family:${MONO};font-size:13.5px`);
  setStyle(root, 'th', `background:${ctx.accent};color:${ctx.paper};padding:10px 14px;border-bottom:none;text-align:left`);

  injectListMarkers(root,
    () => span('', `display:inline-block;width:8px;height:8px;border-radius:50%;background:linear-gradient(135deg,${ctx.accent},${ctx.accentLight});margin-right:12px;vertical-align:middle`),
    (_li, n) => span(String(n), `display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,${ctx.accent},${ctx.accentLight});color:${ctx.paper};font-family:${MONO};font-size:12px;font-weight:700;margin-right:10px;vertical-align:middle`)
  );
  setStyle(root, 'ul,ol', `padding-left:4px;list-style:none;margin:0 0 16px`);
}

/* ============================================================
   10. 章页 zhangye
   ============================================================ */
function applyZhangye(root: ParentNode, ctx: InlineCtx) {
  root.querySelectorAll('h1').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:32px;font-weight:700;line-height:1.3;text-align:center;margin:16px 0 32px;padding:22px 0 18px;border:none;border-top:1px solid ${ctx.ink};border-bottom:1px solid ${ctx.ink};letter-spacing:2px;color:${ctx.ink}`);
    const kicker = div(`text-align:center;font-family:${SERIF};font-size:11px;letter-spacing:6px;color:${ctx.accent};font-weight:700;margin-bottom:10px`, 'CHAPTER');
    (h as HTMLElement).parentNode?.insertBefore(kicker, h);
  });
  let romanI = 0;
  root.querySelectorAll('h2').forEach((h) => {
    romanI++;
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:23px;font-weight:700;line-height:1.4;margin:0 0 18px;padding:0;border:none;color:${ctx.ink};letter-spacing:.5px;text-align:center`);
    const wrap = div(`text-align:center;margin:48px 0 0`);
    const num = div(`font-family:${SERIF};font-size:28px;color:${ctx.accent};font-style:italic;letter-spacing:2px;margin-bottom:8px`, toRoman(romanI));
    wrap.appendChild(num);
    (h as HTMLElement).parentNode?.insertBefore(wrap, h);
    const tail = div(`width:24px;height:1px;background:${ctx.ink};margin:12px auto 24px`);
    (h as HTMLElement).parentNode?.insertBefore(tail, h.nextSibling);
  });
  setStyle(root, 'h3', `font-family:${ctx.prose};font-size:19px;font-weight:700;line-height:1.4;margin:30px 0 12px;color:${ctx.ink};font-style:italic`);
  setStyle(root, 'h4', `font-family:${ctx.prose};font-size:16px;font-weight:700;margin:22px 0 8px;color:${ctx.gray600};font-style:italic`);

  root.querySelectorAll('blockquote').forEach((b) => {
    (b as HTMLElement).setAttribute('style', `border:none;border-left:1px solid ${ctx.ink};background:transparent;padding:12px 32px;margin:28px 0;color:${ctx.gray600};font-style:italic;font-size:16.5px;line-height:1.85`);
  });
  setStyle(root, 'blockquote p', `margin:0 0 8px;color:${ctx.gray600}`);

  replaceHr(root, () => div(`text-align:center;color:${ctx.accent};font-size:14px;margin:48px 0;line-height:1`, '❦'));

  setStyle(root, 'strong', `color:${ctx.ink};font-weight:700;font-style:italic`);
  setStyle(root, 'em', `color:${ctx.accent};font-style:italic`);
  setStyle(root, 'a', `color:${ctx.ink};border-bottom:1px solid ${ctx.accent};text-decoration:none`);
  setStyle(root, 'code', `background:${ctx.gray100};color:${ctx.ink};font-style:normal;border:1px solid ${ctx.border};padding:1px 6px;border-radius:2px;font-family:${MONO};font-size:13.5px`);

  injectListMarkers(root,
    () => span('— ', `color:${ctx.ink};margin-right:6px`),
    (_li, n) => span(toRoman(n).toLowerCase() + '.', `color:${ctx.accent};font-family:${SERIF};font-style:italic;font-weight:700;margin-right:10px`)
  );
  setStyle(root, 'ul,ol', `padding-left:4px;list-style:none;margin:0 0 16px`);
}

/* ---------------- 推特 / X：清理后的纯文本 ---------------- */

export interface TwitterStats {
  text: string;
  chars: number;
  tweets: number;
}

const TWEET_LIMIT = 280;

export function toTwitterText(md: string): TwitterStats {
  const text = md
    .replace(/```\w*\n?/g, '```\n')
    .replace(/^######\s+(.+)$/gm, '▸ $1')
    .replace(/^#####\s+(.+)$/gm, '▸ $1')
    .replace(/^####\s+(.+)$/gm, '◇ $1')
    .replace(/^###\s+(.+)$/gm, '◇ $1')
    .replace(/^##\s+(.+)$/gm, '◆ $1')
    .replace(/^#\s+(.+)$/gm, '◉ $1')
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '$1')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt) => (alt ? `[图片: ${alt}]` : '[图片]'))
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 $2')
    .replace(/^[\s]*[-*+]\s+/gm, '• ')
    .replace(/^>\s?/gm, '“ ')
    .replace(/^---+$/gm, '— — — —')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    text,
    chars: [...text].length,
    tweets: Math.max(1, Math.ceil([...text].length / TWEET_LIMIT)),
  };
}
