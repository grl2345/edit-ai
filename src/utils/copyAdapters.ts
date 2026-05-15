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

function div(css: string, text = ''): HTMLElement {
  // 实际用 <section>：WeChat 对 div font-size 经常 strip，section 保留率最高
  const d = document.createElement('section');
  d.setAttribute('style', css);
  if (text) d.textContent = text;
  return d;
}

/**
 * Drop cap：把指定段落的第一个字符抠出来包成一个真实 <span>，
 * 让首字下沉效果可以在 WeChat 复制后存活（::first-letter 是 CSS 伪元素，不复制）。
 */
function injectDropCap(p: HTMLElement, css: string) {
  if (p.querySelector(':scope > [data-dropcap]')) return;
  // 找第一个文本节点
  const walker = document.createTreeWalker(p, /* SHOW_TEXT */ 4);
  const firstText = walker.nextNode() as Text | null;
  if (!firstText || !firstText.nodeValue) return;
  const raw = firstText.nodeValue;
  // 跳过前导空白
  let i = 0;
  while (i < raw.length && /\s/.test(raw[i])) i++;
  if (i >= raw.length) return;
  const ch = raw[i];
  const before = raw.slice(0, i);
  const after = raw.slice(i + 1);
  // 拆成 [before-text][span][after-text]
  const span = document.createElement('span');
  span.setAttribute('style', css);
  span.setAttribute('data-dropcap', '1');
  span.textContent = ch;
  const parent = firstText.parentNode!;
  if (before) parent.insertBefore(document.createTextNode(before), firstText);
  parent.insertBefore(span, firstText);
  if (after) parent.insertBefore(document.createTextNode(after), firstText);
  parent.removeChild(firstText);
}

/** 把第一段（紧跟 h1/h2 的 <p>）应用 drop cap */
function applyDropCap(root: ParentNode, css: string) {
  root.querySelectorAll('h1 + p, h2 + p').forEach((p) => {
    injectDropCap(p as HTMLElement, css);
  });
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

function wrapperStyleFor(template: TemplateId, ctx: InlineCtx): string {
  // 编辑器的"paper / 卡片"背景下发到公众号。
  // background-image / gradient / radial 公众号会 strip，所以只用 solid color。
  // padding 让正文不贴边。每个版式可以微调底色。
  const bg: Record<TemplateId, string> = {
    qingye: ctx.surface,      // 点阵网格降级为纯色卡
    haibao: ctx.paper,
    ningmeng: ctx.paper,
    chongying: ctx.paper,
    huabao: ctx.paper,
    yinzhang: ctx.surface,    // 米色卡
    geshan: ctx.paper,
    shouzha: ctx.surface,     // 信笺
    jiguang: ctx.paper,
    zhangye: ctx.surface,     // 章页 cream
    juanshou: ctx.paper,
    jiekan: ctx.paper,
    yuebao: ctx.paper,
    hongbang: ctx.paper,
  };
  return `background:${bg[template]};padding:28px 22px;border-radius:10px;`;
}

function applyShared(root: ParentNode, ctx: InlineCtx) {
  mergeStyle(root, 'p', `font-family:${ctx.prose};font-size:16px;line-height:1.85;margin:0 0 16px;color:${ctx.ink}`);
  mergeStyle(root, 'em', `font-style:italic`);
  mergeStyle(root, 'figure', `margin:28px 0;text-align:center`);
  mergeStyle(root, 'figure img', `max-width:100%;display:block;margin:0 auto;border-radius:6px`);
  mergeStyle(root, 'figcaption', `font-family:${ctx.prose};font-style:italic;font-size:13.5px;color:${ctx.gray500};text-align:center;margin-top:10px;line-height:1.5`);
  mergeStyle(root, 'ul,ol', `margin:0 0 16px;padding-left:24px`);
  // ==highlight== via <mark>
  mergeStyle(root, 'mark', `background:${ctx.accentGlow};color:${ctx.accent};font-weight:600;padding:1px 3px;border-radius:2px`);
  // 自动元素：chip / def-list / callout 的 inline 基线（每个版式可以再覆盖）
  applyAutoElementBase(root, ctx);
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

/* ============================================================
   自动元素 inline 基线
   ============================================================ */
function applyAutoElementBase(root: ParentNode, ctx: InlineCtx) {
  // chip h3：暗胶囊
  mergeStyle(
    root,
    'h3[data-chip]',
    `display:inline-block;padding:5px 14px 6px;background:${ctx.ink};color:${ctx.paper};border:none;border-radius:6px;font-size:14px;font-weight:600;line-height:1.4;letter-spacing:.5px;font-family:${ctx.prose};margin:24px 0 12px`
  );

  // 定义列表 li[data-def]
  mergeStyle(
    root,
    'li[data-def]',
    `list-style:none;margin-bottom:18px;padding-left:22px;position:relative`
  );
  mergeStyle(
    root,
    'li[data-def] [data-def-title]',
    `font-weight:700;font-size:16px;color:${ctx.ink};margin-bottom:4px;line-height:1.4`
  );
  mergeStyle(
    root,
    'li[data-def] [data-def-desc]',
    `color:${ctx.gray500};font-size:14.5px;line-height:1.7`
  );
  mergeStyle(
    root,
    'li[data-def] [data-def-desc] p',
    `color:${ctx.gray500};font-size:14.5px;line-height:1.7;margin:0`
  );
  // li[data-def] 前置项目符号：注入真实 span（不能用 ::before）
  root.querySelectorAll('li[data-def]').forEach((li) => {
    if ((li as HTMLElement).querySelector(':scope > [data-def-bullet]')) return;
    const bullet = span('', `display:inline-block;width:6px;height:6px;border-radius:50%;background:${ctx.accent};margin-right:12px;vertical-align:1px`);
    bullet.setAttribute('data-def-bullet', '1');
    const title = (li as HTMLElement).querySelector(':scope > [data-def-title]');
    if (title) title.insertBefore(bullet, title.firstChild);
  });

  // GFM callout
  mergeStyle(
    root,
    '[data-callout]',
    `border-left:4px solid ${ctx.accent};background:${ctx.surface2};padding:14px 18px;margin:24px 0;border-radius:0 8px 8px 0;color:${ctx.gray600}`
  );
  mergeStyle(
    root,
    '[data-callout-head]',
    `font-family:${MONO};font-size:11px;font-weight:700;letter-spacing:1.5px;color:${ctx.accent};margin-bottom:6px;text-transform:uppercase`
  );
  mergeStyle(
    root,
    '[data-callout] p',
    `color:${ctx.gray600};margin:0 0 6px`
  );
  mergeStyle(root, '[data-callout] p:last-child', `margin-bottom:0`);
  // warning / caution = 橙黄
  root.querySelectorAll('[data-callout="warning"],[data-callout="caution"]').forEach((c) => {
    const prev = (c as HTMLElement).getAttribute('style') ?? '';
    (c as HTMLElement).setAttribute('style', `${prev};border-left-color:#d97706`);
  });
  root.querySelectorAll('[data-callout="warning"] [data-callout-head],[data-callout="caution"] [data-callout-head]').forEach((c) => {
    const prev = (c as HTMLElement).getAttribute('style') ?? '';
    (c as HTMLElement).setAttribute('style', `${prev};color:#d97706`);
  });
  // tip = 绿
  root.querySelectorAll('[data-callout="tip"]').forEach((c) => {
    const prev = (c as HTMLElement).getAttribute('style') ?? '';
    (c as HTMLElement).setAttribute('style', `${prev};border-left-color:#16a34a`);
  });
  root.querySelectorAll('[data-callout="tip"] [data-callout-head]').forEach((c) => {
    const prev = (c as HTMLElement).getAttribute('style') ?? '';
    (c as HTMLElement).setAttribute('style', `${prev};color:#16a34a`);
  });
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
    case 'juanshou': return applyJuanshou(root, ctx);
    case 'jiekan': return applyJiekan(root, ctx);
    case 'yuebao': return applyYuebao(root, ctx);
    case 'hongbang': return applyHongbang(root, ctx);
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

  // Drop cap：画报风
  applyDropCap(root, `font-size:3.6em;float:left;line-height:.86;padding:8px 12px 0 0;font-weight:800;color:${ctx.accent};font-family:${ctx.prose}`);
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

  // Drop cap：首段第一个字符
  applyDropCap(root, `font-size:3.4em;float:left;line-height:.88;padding:6px 12px 0 0;font-weight:700;color:${ctx.accent};font-family:Georgia,${ctx.prose};font-style:italic`);
}

/* ============================================================
   11. 卷首 juanshou —— The New Yorker
   ============================================================ */
function applyJuanshou(root: ParentNode, ctx: InlineCtx) {
  // h1：上方 accent 短条 + 大字
  root.querySelectorAll('h1').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:34px;font-weight:700;line-height:1.2;letter-spacing:-.4px;margin:8px 0 24px;padding:0 0 14px;border:none;color:${ctx.ink}`);
    const bar = div(`width:54px;height:4px;background:${ctx.accent};margin-bottom:16px`);
    h.insertBefore(bar, h.firstChild);
  });
  // h2：罗马数字悬挂（flex 替代 absolute）
  let jsI = 0;
  root.querySelectorAll('h2').forEach((h) => {
    jsI++;
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:24px;font-weight:700;line-height:1.3;margin:48px 0 18px;padding:14px 0 0;border-top:1px solid ${ctx.ink};border-bottom:none;color:${ctx.ink};letter-spacing:-.2px;display:flex;align-items:baseline;gap:18px`);
    const r = span(toRoman(jsI) + '.', `font-family:${SERIF};font-size:24px;color:${ctx.accent};font-style:italic;font-weight:400;flex-shrink:0;min-width:42px`);
    h.insertBefore(r, h.firstChild);
  });
  setStyle(root, 'h3', `font-family:${ctx.prose};font-size:19px;font-weight:700;line-height:1.4;margin:32px 0 12px;color:${ctx.ink};font-style:italic`);
  setStyle(root, 'h4', `font-family:${ctx.prose};font-size:14px;font-weight:700;margin:22px 0 8px;color:${ctx.gray600};text-transform:uppercase;letter-spacing:1.5px`);

  // pull-quote：上下细线 + 大字斜体居中
  root.querySelectorAll('blockquote').forEach((b) => {
    (b as HTMLElement).setAttribute('style', `border:none;border-top:1px solid ${ctx.ink};border-bottom:1px solid ${ctx.ink};background:transparent;text-align:center;font-style:italic;color:${ctx.ink};padding:22px 24px;margin:36px 0;font-size:20px;line-height:1.5;font-family:${SERIF}`);
    const q = div(`text-align:center;font-size:52px;color:${ctx.accent};line-height:.5;font-family:${SERIF};margin-bottom:10px;font-style:normal;font-weight:700`, '"');
    b.insertBefore(q, b.firstChild);
  });
  setStyle(root, 'blockquote p', `margin:0 0 8px;color:${ctx.ink}`);

  // figure：底部细线 + italic 图注
  setStyle(root, 'figure', `margin:32px 0;text-align:center`);
  setStyle(root, 'figure img', `max-width:100%;display:block;margin:0 auto;border-radius:0;padding-bottom:8px;border-bottom:1px solid ${ctx.ink}`);
  setStyle(root, 'figcaption', `font-family:${SERIF};font-style:italic;font-size:13.5px;color:${ctx.gray600};text-align:center;margin-top:10px;line-height:1.5`);

  // table 编辑级
  setStyle(root, 'table', `width:100%;border-collapse:collapse;margin:28px 0;font-size:14.5px`);
  setStyle(root, 'th', `background:transparent;text-align:left;padding:8px 12px;border:none;border-top:2px solid ${ctx.ink};border-bottom:1px solid ${ctx.ink};font-family:${ctx.prose};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:${ctx.ink}`);
  setStyle(root, 'td', `padding:9px 12px;border-bottom:1px solid ${ctx.border};font-family:${SERIF}`);

  replaceHr(root, () => div(`text-align:center;color:${ctx.accent};font-size:18px;margin:48px 0;line-height:1`, '❦'));

  setStyle(root, 'strong', `color:${ctx.ink};font-weight:700;border-bottom:2px solid ${ctx.accent}`);
  setStyle(root, 'em', `color:${ctx.ink};font-style:italic`);
  setStyle(root, 'a', `color:${ctx.ink};border-bottom:1px solid ${ctx.accent};text-decoration:none;font-style:italic`);
  setStyle(root, 'code', `font-family:${SERIF};font-style:italic;background:transparent;color:${ctx.accent};padding:0`);

  injectListMarkers(root,
    () => span('', `display:inline-block;width:12px;height:1px;background:${ctx.accent};margin-right:10px;vertical-align:middle`),
    (_li, n) => span(n + '.', `color:${ctx.accent};font-family:${SERIF};font-style:italic;font-weight:700;font-size:1.1em;margin-right:10px`)
  );
  setStyle(root, 'ul,ol', `padding-left:4px;list-style:none;margin:0 0 16px`);

  // Drop cap：The New Yorker 风
  applyDropCap(root, `font-size:5.2em;float:left;line-height:.86;padding:10px 14px 0 0;font-weight:700;color:${ctx.accent};font-family:Georgia,${ctx.prose}`);
}

/* ============================================================
   12. 街刊 jiekan —— Monocle / Wallpaper*
   ============================================================ */
function applyJiekan(root: ParentNode, ctx: InlineCtx) {
  // h1：上方 COVER STORY 标 + 巨大粗黑体
  root.querySelectorAll('h1').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',${ctx.prose},sans-serif;font-size:36px;font-weight:900;line-height:1.1;letter-spacing:-1px;margin:4px 0 26px;padding:0;border:none;color:${ctx.ink}`);
    const tag = div(`background:${ctx.accent};color:${ctx.paper};padding:4px 10px;font-family:${MONO};font-size:10px;letter-spacing:3px;font-weight:700;display:inline-block;margin-bottom:14px`, 'COVER STORY');
    h.insertBefore(tag, h.firstChild);
  });
  // h2：№ 01 chip 前缀
  let jkI = 0;
  root.querySelectorAll('h2').forEach((h) => {
    jkI++;
    (h as HTMLElement).setAttribute('style', `font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',${ctx.prose},sans-serif;font-size:22px;font-weight:800;line-height:1.3;margin:44px 0 16px;padding:0 0 10px;border:none;border-bottom:5px solid ${ctx.ink};letter-spacing:-.3px;color:${ctx.ink}`);
    const chip = span('№ ' + pad2(jkI), `display:inline-block;background:${ctx.ink};color:${ctx.paper};padding:3px 9px;font-family:${MONO};font-size:11px;font-weight:700;letter-spacing:1.5px;margin-right:12px;vertical-align:3px`);
    h.insertBefore(chip, h.firstChild);
  });
  root.querySelectorAll('h3').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:18px;font-weight:700;line-height:1.4;margin:30px 0 12px;font-style:italic;color:${ctx.ink}`);
    h.insertBefore(span('— ', `color:${ctx.accent};font-weight:700`), h.firstChild);
  });
  setStyle(root, 'h4', `font-family:${MONO};font-size:11px;font-weight:700;margin:22px 0 8px;color:${ctx.accent};letter-spacing:2px;text-transform:uppercase`);

  // pull-quote：左 6px accent 粗条 + 大斜体
  root.querySelectorAll('blockquote').forEach((b) => {
    (b as HTMLElement).setAttribute('style', `border:none;border-left:6px solid ${ctx.accent};background:transparent;padding:12px 0 12px 22px;margin:28px 0;color:${ctx.ink};font-style:italic;font-size:20px;line-height:1.45;font-weight:600;font-family:${ctx.prose}`);
    // 最后一段当作 attribution，特殊样式
    const ps = b.querySelectorAll('p');
    if (ps.length > 1) {
      const last = ps[ps.length - 1] as HTMLElement;
      const prev = last.getAttribute('style') ?? '';
      last.setAttribute('style', `${prev};font-size:11px;font-style:normal;font-weight:700;letter-spacing:2px;color:${ctx.accent};font-family:${MONO};text-transform:uppercase;margin:8px 0 0`);
    }
  });
  setStyle(root, 'blockquote p', `margin:0 0 8px;color:${ctx.ink}`);

  // figure：全宽 + 厚黑下边线 + mono uppercase 图注 + accent 方块
  setStyle(root, 'figure', `margin:30px 0;padding-bottom:12px;border-bottom:4px solid ${ctx.ink}`);
  setStyle(root, 'figure img', `max-width:100%;width:100%;display:block;border-radius:0;margin:0`);
  setStyle(root, 'figcaption', `font-family:${MONO};font-size:11px;letter-spacing:1.5px;color:${ctx.gray500};text-transform:uppercase;margin-top:12px;display:flex;align-items:center;gap:8px`);
  root.querySelectorAll('figcaption').forEach((fc) => {
    const dot = span('', `display:inline-block;width:8px;height:8px;background:${ctx.accent};flex-shrink:0`);
    fc.insertBefore(dot, fc.firstChild);
  });

  // table：重黑表头 + 隔行 tint
  setStyle(root, 'table', `width:100%;border-collapse:collapse;margin:26px 0;font-size:14px;border-top:4px solid ${ctx.ink};border-bottom:4px solid ${ctx.ink}`);
  setStyle(root, 'th', `background:${ctx.ink};color:${ctx.paper};text-align:left;padding:9px 13px;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;border-bottom:none`);
  setStyle(root, 'td', `padding:10px 13px;border-bottom:1px solid ${ctx.border};font-family:${ctx.prose}`);
  // 隔行 tint
  root.querySelectorAll('tbody tr').forEach((tr, i) => {
    if (i % 2 === 1) {
      tr.querySelectorAll('td').forEach((td) => {
        const prev = (td as HTMLElement).getAttribute('style') ?? '';
        (td as HTMLElement).setAttribute('style', `${prev};background:${ctx.surface2}`);
      });
    }
  });

  // hr：粗黑实条 + 中间 accent 方块
  replaceHr(root, () => {
    const wrap = div(`position:relative;height:4px;background:${ctx.ink};margin:40px 0;display:flex;align-items:center;justify-content:center`);
    const sq = div(`width:14px;height:14px;background:${ctx.accent}`);
    wrap.appendChild(sq);
    return wrap;
  });

  setStyle(root, 'strong', `background:${ctx.ink};color:${ctx.paper};padding:1px 5px;font-weight:700`);
  setStyle(root, 'em', `color:${ctx.accent};font-style:italic;font-weight:600`);
  setStyle(root, 'a', `color:${ctx.ink};background:${ctx.accentGlow};text-decoration:none;padding:0 4px;font-weight:600`);
  setStyle(root, 'code', `background:${ctx.ink};color:${ctx.paper};padding:2px 7px;border-radius:0;font-family:${MONO};font-size:13px;font-weight:500`);

  injectListMarkers(root,
    () => span('', `display:inline-block;width:14px;height:4px;background:${ctx.accent};margin-right:12px;vertical-align:middle`),
    (_li, n) => span(pad2(n), `color:${ctx.ink};font-family:${MONO};font-size:18px;font-weight:800;margin-right:12px;letter-spacing:-1px`)
  );
  setStyle(root, 'ul,ol', `padding-left:4px;list-style:none;margin:0 0 16px`);
}

/* ============================================================
   13. 月报 yuebao —— Economist / NY Times Graphics
   ============================================================ */
function applyYuebao(root: ParentNode, ctx: InlineCtx) {
  // h1：上方 MONTHLY REPORT kicker + 双横线
  root.querySelectorAll('h1').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:30px;font-weight:700;line-height:1.25;margin:12px 0 24px;padding:18px 0 14px;border:none;border-top:1px solid ${ctx.ink};letter-spacing:-.2px;color:${ctx.ink}`);
    const kicker = div(`font-family:${MONO};font-size:10px;letter-spacing:4px;color:${ctx.accent};font-weight:700;margin-bottom:12px`, 'MONTHLY REPORT');
    h.insertBefore(kicker, h.firstChild);
    const dbl = div(`height:4px;border-top:1px solid ${ctx.ink};border-bottom:1px solid ${ctx.ink};margin-top:14px`);
    h.appendChild(dbl);
  });
  // h2：大编号 01 02 03（flex 替代 absolute）
  let ybI = 0;
  root.querySelectorAll('h2').forEach((h) => {
    ybI++;
    (h as HTMLElement).setAttribute('style', `font-family:${ctx.prose};font-size:21px;font-weight:700;line-height:1.4;margin:40px 0 16px;padding:0 0 8px;border:none;border-bottom:1px solid ${ctx.ink};color:${ctx.ink};letter-spacing:-.1px;display:flex;align-items:flex-end;gap:14px`);
    const num = span(pad2(ybI), `font-family:${MONO};font-size:26px;font-weight:800;color:${ctx.accent};letter-spacing:-2px;line-height:1;flex-shrink:0`);
    h.insertBefore(num, h.firstChild);
  });
  setStyle(root, 'h3', `font-family:${ctx.prose};font-size:17px;font-weight:700;line-height:1.4;margin:28px 0 12px;color:${ctx.ink};font-style:italic;padding-left:10px;border-left:2px solid ${ctx.accent}`);
  setStyle(root, 'h4', `font-family:${MONO};font-size:11px;font-weight:700;margin:22px 0 8px;color:${ctx.gray500};letter-spacing:2px;text-transform:uppercase`);

  // NOTE 卡片
  root.querySelectorAll('blockquote').forEach((b) => {
    (b as HTMLElement).setAttribute('style', `border:1px solid ${ctx.border};border-left:4px solid ${ctx.accent};background:${ctx.surface2};padding:18px 18px 14px;margin:28px 0;border-radius:0;color:${ctx.gray600};font-size:14.5px;line-height:1.7;position:relative`);
    const tag = div(`display:inline-block;background:${ctx.accent};color:${ctx.paper};padding:2px 8px;font-family:${MONO};font-size:10px;font-weight:700;letter-spacing:2px;margin-bottom:8px`, 'NOTE');
    b.insertBefore(tag, b.firstChild);
  });
  setStyle(root, 'blockquote p', `margin:0 0 6px;color:${ctx.gray600}`);

  // figure：bordered 杂志图 + FIG 图注（flex，无 absolute）
  setStyle(root, 'figure', `margin:30px 0;border:1px solid ${ctx.border};padding:10px 10px 0;background:${ctx.surface}`);
  setStyle(root, 'figure img', `max-width:100%;display:block;border-radius:0;margin:0`);
  setStyle(root, 'figcaption', `font-family:${ctx.prose};font-style:italic;font-size:13px;color:${ctx.gray600};padding:10px 4px 12px;border-top:1px solid ${ctx.border};margin-top:10px;line-height:1.5;display:flex;align-items:baseline;gap:8px`);
  root.querySelectorAll('figcaption').forEach((fc) => {
    const tag = span('FIG', `font-family:${MONO};font-size:10px;font-weight:700;letter-spacing:1.5px;color:${ctx.accent};font-style:normal;flex-shrink:0`);
    fc.insertBefore(tag, fc.firstChild);
  });

  // table：Economist 风
  setStyle(root, 'table', `width:100%;border-collapse:collapse;margin:26px 0;font-size:14px;border-top:3px solid ${ctx.ink};border-bottom:2px solid ${ctx.ink}`);
  setStyle(root, 'th', `background:transparent;text-align:left;padding:8px 13px;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:${ctx.accent};border:none;border-bottom:1px solid ${ctx.ink}`);
  setStyle(root, 'td', `padding:8px 13px;border-bottom:1px solid ${ctx.border};font-family:${ctx.prose}`);
  // 数字列右对齐：把非首列的 th/td 都右对齐
  root.querySelectorAll('table').forEach((tbl) => {
    const headRow = tbl.querySelector('thead tr') || tbl.querySelector('tr');
    if (!headRow) return;
    const cells = headRow.children;
    for (let i = 1; i < cells.length; i++) {
      const idx = i + 1;
      tbl.querySelectorAll(`th:nth-child(${idx}),td:nth-child(${idx})`).forEach((c) => {
        const prev = (c as HTMLElement).getAttribute('style') ?? '';
        (c as HTMLElement).setAttribute('style', `${prev};text-align:right;font-variant-numeric:tabular-nums`);
      });
    }
  });

  // hr：双细线
  replaceHr(root, () => {
    const wrap = div(`margin:40px 0`);
    const a = div(`height:1px;background:${ctx.ink};margin-bottom:2px`);
    const b = div(`height:1px;background:${ctx.ink}`);
    wrap.appendChild(a);
    wrap.appendChild(b);
    return wrap;
  });

  setStyle(root, 'strong', `color:${ctx.ink};font-weight:700;font-style:italic`);
  setStyle(root, 'em', `color:${ctx.accent};font-style:italic`);
  setStyle(root, 'a', `color:${ctx.ink};border-bottom:1px dotted ${ctx.accent};text-decoration:none`);
  setStyle(root, 'code', `background:${ctx.gray100};color:${ctx.ink};font-family:${MONO};font-size:13px;padding:1px 6px;border:1px solid ${ctx.border};border-radius:2px`);

  injectListMarkers(root,
    () => span('', `display:inline-block;width:14px;height:1px;background:${ctx.ink};margin-right:10px;vertical-align:middle`),
    (_li, n) => span(pad2(n), `color:${ctx.accent};font-family:${MONO};font-size:13px;font-weight:700;margin-right:12px;letter-spacing:-.5px`)
  );
  setStyle(root, 'ul,ol', `padding-left:4px;list-style:none;margin:0 0 16px`);
}

/* ============================================================
   14. 红榜 hongbang —— 大红数字 + 黑体粗 + 暗胶囊
   ============================================================ */
function applyHongbang(root: ParentNode, ctx: InlineCtx) {
  const SANS = `'PingFang SC','Hiragino Sans GB','Microsoft YaHei',${ctx.prose},sans-serif`;

  setStyle(root, 'h1', `font-family:${SANS};font-size:28px;font-weight:800;line-height:1.3;margin:8px 0 24px;padding:0;border:none;letter-spacing:-.4px;color:${ctx.ink}`);

  // h2：大红数字编号 + 标题（用 div 块包裹数字）
  let hbI = 0;
  root.querySelectorAll('h2').forEach((h) => {
    hbI++;
    (h as HTMLElement).setAttribute('style', `font-family:${SANS};font-size:22px;font-weight:800;line-height:1.3;margin:48px 0 16px;padding:0;border:none;letter-spacing:-.3px;color:${ctx.ink}`);
    const num = div(`font-family:${SANS};font-size:52px;font-weight:900;color:${ctx.accent};letter-spacing:-3px;line-height:.95;margin-bottom:6px`, pad2(hbI));
    (h as HTMLElement).parentNode?.insertBefore(num, h);
  });

  // h3 普通 + chip 强样式
  root.querySelectorAll('h3:not([data-chip])').forEach((h) => {
    (h as HTMLElement).setAttribute('style', `font-family:${SANS};font-size:18px;font-weight:700;line-height:1.4;margin:28px 0 12px;color:${ctx.ink}`);
  });
  setStyle(root, 'h3[data-chip]', `display:inline-block;background:${ctx.ink};color:${ctx.paper};padding:7px 16px 8px;font-size:14.5px;font-weight:700;border-radius:24px;margin:24px 0 16px;letter-spacing:.5px;font-family:${SANS}`);
  setStyle(root, 'h4', `font-family:${SANS};font-size:15.5px;font-weight:700;margin:22px 0 8px;color:${ctx.gray600}`);

  // 定义列表（覆盖基线，更黑更粗）
  setStyle(root, 'li[data-def]', `list-style:none;padding:0 0 0 24px;margin-bottom:20px;position:relative`);
  setStyle(root, 'li[data-def] [data-def-title]', `font-weight:800;font-size:17px;color:${ctx.ink};margin-bottom:6px;line-height:1.4;letter-spacing:-.1px;font-family:${SANS}`);
  setStyle(root, 'li[data-def] [data-def-desc]', `color:${ctx.gray500};font-size:14.5px;line-height:1.75;font-family:${SANS}`);
  setStyle(root, 'li[data-def] [data-def-desc] p', `color:${ctx.gray500};font-size:14.5px;line-height:1.75;margin:0;font-family:${SANS}`);
  // 让定义列表的 bullet 改为黑色（覆盖基线 accent）
  root.querySelectorAll('li[data-def] [data-def-bullet]').forEach((b) => {
    (b as HTMLElement).setAttribute('style', `display:inline-block;width:8px;height:8px;border-radius:50%;background:${ctx.ink};margin-right:14px;vertical-align:1px`);
  });

  // 普通 ul / ol
  setStyle(root, 'ul,ol', `padding-left:4px;list-style:none;margin:0 0 16px`);
  injectListMarkers(root,
    () => span('', `display:inline-block;width:6px;height:6px;border-radius:50%;background:${ctx.ink};margin-right:10px;vertical-align:middle`),
    (_li, n) => span(String(n), `display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;background:${ctx.accent};color:${ctx.paper};border-radius:50%;font-family:${SANS};font-size:12px;font-weight:800;margin-right:10px;vertical-align:middle`)
  );

  // blockquote / callout
  setStyle(root, 'blockquote', `border:none;border-left:4px solid ${ctx.accent};background:${ctx.surface2};padding:14px 20px;margin:22px 0;border-radius:0 8px 8px 0;color:${ctx.gray600};font-style:normal`);
  setStyle(root, 'blockquote p', `color:${ctx.gray600};margin:0 0 8px`);

  // hr：accent 短粗块
  replaceHr(root, () => div(`height:4px;background:${ctx.accent};width:54px;margin:40px 0;border-radius:2px`));

  // figure
  setStyle(root, 'figure', `margin:28px 0;text-align:center`);
  setStyle(root, 'figure img', `max-width:100%;display:block;margin:0 auto;border-radius:8px;box-shadow:0 4px 18px rgba(0,0,0,0.06)`);
  setStyle(root, 'figcaption', `font-family:${SANS};font-style:normal;font-size:13px;color:${ctx.gray500};text-align:center;margin-top:12px;letter-spacing:.3px`);

  // table 黑表头
  setStyle(root, 'table', `width:100%;border-collapse:collapse;margin:22px 0;font-size:14.5px`);
  setStyle(root, 'th', `background:${ctx.ink};color:${ctx.paper};text-align:left;padding:10px 14px;font-family:${SANS};font-weight:700;font-size:13.5px;border-bottom:none;letter-spacing:.3px`);
  setStyle(root, 'td', `padding:10px 14px;border-bottom:1px solid ${ctx.border};font-family:${SANS}`);

  // 强调
  setStyle(root, 'strong', `color:${ctx.accent};font-weight:800`);
  setStyle(root, 'em', `color:${ctx.ink};font-style:italic;border-bottom:2px dotted ${ctx.accent};padding-bottom:1px`);
  setStyle(root, 'mark', `background:${ctx.accentGlow};color:${ctx.accent};font-weight:700;padding:1px 4px;border-radius:2px`);
  setStyle(root, 'a', `color:${ctx.ink};text-decoration:none;border-bottom:2px solid ${ctx.accent};font-weight:600`);
  setStyle(root, 'code', `background:${ctx.gray100};color:${ctx.accent};padding:2px 7px;border-radius:4px;font-family:${MONO};font-size:13.5px;font-weight:600`);
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
