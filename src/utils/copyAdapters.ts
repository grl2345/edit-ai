import {
  FontId,
  PaletteId,
  TemplateId,
  ThemeMode,
  getFontStack,
  getPaletteVars,
} from './themes';

const MONO = "'JetBrains Mono','Menlo','Consolas',monospace";

/* ---------------- 公众号：行内样式 HTML ---------------- */

interface InlineCtx {
  accent: string;
  accentGlow: string;
  ink: string;
  paper: string;
  surface: string;
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
    accentGlow: v.accentGlow,
    ink: v.ink,
    paper: v.paper,
    surface: v.surface,
    gray100: v.gray100,
    gray500: v.gray500,
    gray600: v.gray600,
    border: v.border,
    terminalBg: v.terminalBg,
    terminalText: v.terminalText,
    prose: getFontStack(font),
  };
}

/** 覆盖式：本次声明放在后面，确保胜出 */
function setStyle(root: ParentNode, selector: string, css: string) {
  root.querySelectorAll(selector).forEach((el) => {
    const e = el as HTMLElement;
    const prev = e.getAttribute('style') ?? '';
    e.setAttribute('style', prev ? `${prev};${css}` : css);
  });
}

/** 合并式：本次声明放在前面，保留 element 自身原 style */
function mergeStyle(root: ParentNode, selector: string, css: string) {
  root.querySelectorAll(selector).forEach((el) => {
    const e = el as HTMLElement;
    const prev = e.getAttribute('style') ?? '';
    e.setAttribute('style', prev ? `${css};${prev}` : css);
  });
}

/**
 * 把当前预览 HTML 转成行内样式 HTML，适合粘贴到微信公众号 / 知乎 / 简书。
 * 微信编辑器会丢弃 class 与外部 CSS，所以这里把所有样式 inline 到元素 style 上。
 * 同时按当前 template 注入版式装饰节点（公众号会丢弃 ::before/::after，因此用真实 DOM 取代）。
 */
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
  applyHeadings(root, ctx, template);

  const section = document.createElement('section');
  section.setAttribute(
    'style',
    `font-family:${ctx.prose};color:${ctx.ink};max-width:100%;line-height:1.85;font-size:16px`
  );
  section.appendChild(root);
  return section.outerHTML;
}

/** 段落、链接、表格、代码块等与模版无关的通用规则 */
function applyShared(root: ParentNode, ctx: InlineCtx) {
  mergeStyle(
    root,
    'p',
    `font-family:${ctx.prose};font-size:16px;line-height:1.85;margin:0 0 16px;color:${ctx.ink}`
  );
  mergeStyle(root, 'strong', `font-weight:600;color:${ctx.ink}`);
  mergeStyle(root, 'em', `font-style:italic`);
  mergeStyle(
    root,
    'a',
    `color:${ctx.accent};text-decoration:underline;text-underline-offset:3px`
  );
  mergeStyle(root, 'ul,ol', `margin:0 0 16px;padding-left:24px`);
  mergeStyle(
    root,
    'li',
    `margin:0 0 6px;line-height:1.85;color:${ctx.ink};font-family:${ctx.prose};font-size:16px`
  );
  mergeStyle(root, 'img', `max-width:100%;border-radius:8px;margin:18px 0;display:block`);
  mergeStyle(
    root,
    'table',
    `width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;font-family:${ctx.prose}`
  );
  mergeStyle(
    root,
    'th',
    `text-align:left;padding:10px 14px;background:${ctx.gray100};font-weight:600;border-bottom:2px solid ${ctx.border};color:${ctx.ink}`
  );
  mergeStyle(
    root,
    'td',
    `padding:10px 14px;border-bottom:1px solid ${ctx.border};color:${ctx.ink}`
  );
  mergeStyle(
    root,
    'code',
    `font-family:${MONO};font-size:13.5px;background:${ctx.gray100};color:${ctx.accent};padding:2px 6px;border-radius:4px`
  );
  mergeStyle(
    root,
    'pre',
    `background:${ctx.terminalBg};color:${ctx.terminalText};padding:16px 18px;border-radius:8px;overflow-x:auto;margin:20px 0;font-family:${MONO};font-size:13px;line-height:1.65`
  );
  mergeStyle(
    root,
    'pre code',
    `background:none;padding:0;border-radius:0;color:inherit;font-size:inherit;font-family:${MONO}`
  );

  // highlight.js token colors
  mergeStyle(root, '.hljs-keyword,.hljs-selector-tag,.hljs-built_in', `color:#ff7b72`);
  mergeStyle(root, '.hljs-string,.hljs-attr', `color:#a5d6ff`);
  mergeStyle(root, '.hljs-number,.hljs-literal', `color:#79c0ff`);
  mergeStyle(root, '.hljs-comment,.hljs-quote', `color:#8b949e;font-style:italic`);
  mergeStyle(root, '.hljs-title,.hljs-function,.hljs-name', `color:#d2a8ff`);
  mergeStyle(root, '.hljs-variable,.hljs-params', `color:#ffa657`);
  mergeStyle(root, '.hljs-tag,.hljs-meta', `color:#7ee787`);
}

/** 按版式分发标题 / 引用 / 分隔线 / 列表的样式 + DOM 装饰 */
function applyHeadings(root: ParentNode, ctx: InlineCtx, template: TemplateId) {
  switch (template) {
    case 'suijian':
      return applySuijian(root, ctx);
    case 'yuanbao':
      return applyYuanbao(root, ctx);
    case 'kapian':
      return applyKapian(root, ctx);
    case 'moyin':
      return applyMoyin(root, ctx);
  }
}

/* ---------------- 素简（默认） ---------------- */

function applySuijian(root: ParentNode, ctx: InlineCtx) {
  setStyle(
    root,
    'h1',
    `font-family:${ctx.prose};font-size:24px;font-weight:700;line-height:1.4;margin:24px 0 14px;color:${ctx.ink};letter-spacing:-.3px`
  );
  setStyle(
    root,
    'h2',
    `font-family:${ctx.prose};font-size:20px;font-weight:700;line-height:1.4;margin:32px 0 14px;padding-top:18px;border-top:1px solid ${ctx.border};color:${ctx.ink};letter-spacing:-.2px`
  );
  setStyle(
    root,
    'h3',
    `font-family:${ctx.prose};font-size:17px;font-weight:700;line-height:1.4;margin:24px 0 10px;color:${ctx.ink}`
  );
  setStyle(
    root,
    'h4',
    `font-family:${ctx.prose};font-size:15px;font-weight:700;line-height:1.4;margin:18px 0 8px;color:${ctx.ink}`
  );
  setStyle(
    root,
    'blockquote',
    `border-left:3px solid ${ctx.accent};padding:12px 18px;margin:20px 0;background:${ctx.accentGlow};border-radius:0 6px 6px 0;color:${ctx.gray600};font-style:italic;font-family:${ctx.prose}`
  );
  setStyle(root, 'blockquote p', `color:${ctx.gray600};margin:0`);
  setStyle(root, 'hr', `border:none;border-top:1px solid ${ctx.border};margin:28px 0`);
}

/* ---------------- 元宝（杂志） ---------------- */

function applyYuanbao(root: ParentNode, ctx: InlineCtx) {
  // h1: 居中 + 下方 accent 短线
  root.querySelectorAll('h1').forEach((h) => {
    (h as HTMLElement).setAttribute(
      'style',
      `font-family:${ctx.prose};font-size:26px;font-weight:700;line-height:1.4;text-align:center;margin:12px 0 18px;color:${ctx.ink};letter-spacing:-.2px`
    );
    const bar = document.createElement('div');
    bar.setAttribute(
      'style',
      `width:40px;height:2px;background:${ctx.accent};margin:14px auto 0`
    );
    h.appendChild(bar);
  });

  // h2: 上下双 hairline + 居中
  setStyle(
    root,
    'h2',
    `font-family:${ctx.prose};font-size:20px;font-weight:700;line-height:1.4;text-align:center;margin:40px 0 22px;padding:14px 0;border-top:1px solid ${ctx.border};border-bottom:1px solid ${ctx.border};color:${ctx.ink}`
  );

  // h3: 左侧 accent 短竖条（用 border-left 实现）
  setStyle(
    root,
    'h3',
    `font-family:${ctx.prose};font-size:17px;font-weight:700;line-height:1.4;margin:28px 0 12px;padding-left:10px;border-left:3px solid ${ctx.accent};color:${ctx.ink}`
  );
  setStyle(
    root,
    'h4',
    `font-family:${ctx.prose};font-size:15px;font-weight:700;line-height:1.4;margin:20px 0 8px;color:${ctx.gray600}`
  );

  // blockquote: 居中斜体 + 前置引号
  root.querySelectorAll('blockquote').forEach((b) => {
    (b as HTMLElement).setAttribute(
      'style',
      `border:none;background:transparent;text-align:center;font-style:italic;color:${ctx.ink};padding:6px 24px 12px;margin:28px 0;font-family:${ctx.prose};font-size:17px;line-height:1.85`
    );
    const quote = document.createElement('div');
    quote.setAttribute(
      'style',
      `font-family:Georgia,'Times New Roman',serif;font-size:48px;color:${ctx.accent};line-height:0.6;margin-bottom:6px;font-style:normal`
    );
    quote.textContent = '“';
    b.insertBefore(quote, b.firstChild);
  });
  setStyle(root, 'blockquote p', `margin:0 0 8px;color:${ctx.ink}`);

  // hr: 替换为三点
  root.querySelectorAll('hr').forEach((hr) => {
    const replacement = document.createElement('p');
    replacement.setAttribute(
      'style',
      `text-align:center;color:${ctx.gray500};font-size:18px;letter-spacing:14px;margin:36px 0;line-height:1`
    );
    replacement.textContent = '·   ·   ·';
    hr.replaceWith(replacement);
  });
}

/* ---------------- 卡片（软文） ---------------- */

function applyKapian(root: ParentNode, ctx: InlineCtx) {
  setStyle(
    root,
    'h1',
    `font-family:${ctx.prose};font-size:24px;font-weight:700;line-height:1.4;margin:14px 0 20px;color:${ctx.ink};letter-spacing:-.3px`
  );
  // h2: 左侧粗 accent 条
  setStyle(
    root,
    'h2',
    `font-family:${ctx.prose};font-size:20px;font-weight:700;line-height:1.4;margin:32px 0 14px;padding:6px 0 6px 14px;border-left:4px solid ${ctx.accent};color:${ctx.ink}`
  );
  // h3: accent 圆点前缀（注入 span）
  root.querySelectorAll('h3').forEach((h) => {
    (h as HTMLElement).setAttribute(
      'style',
      `font-family:${ctx.prose};font-size:17px;font-weight:700;line-height:1.4;margin:24px 0 10px;color:${ctx.ink};display:flex;align-items:center;gap:10px`
    );
    const dot = document.createElement('span');
    dot.setAttribute(
      'style',
      `display:inline-block;width:8px;height:8px;border-radius:50%;background:${ctx.accent};flex-shrink:0`
    );
    h.insertBefore(dot, h.firstChild);
  });
  setStyle(
    root,
    'h4',
    `font-family:${ctx.prose};font-size:15px;font-weight:600;line-height:1.4;margin:20px 0 8px;color:${ctx.gray600}`
  );
  // blockquote: 白卡 + 左 accent 条 + 阴影
  setStyle(
    root,
    'blockquote',
    `border:none;border-left:4px solid ${ctx.accent};background:${ctx.surface};padding:14px 20px;margin:20px 0;border-radius:8px;color:${ctx.gray600};font-style:normal;font-family:${ctx.prose};box-shadow:0 2px 12px rgba(0,0,0,0.04)`
  );
  setStyle(root, 'blockquote p', `color:${ctx.gray600};margin:0`);
  // hr: 短粗圆角条
  root.querySelectorAll('hr').forEach((hr) => {
    const replacement = document.createElement('p');
    replacement.setAttribute(
      'style',
      `text-align:center;margin:32px 0;line-height:0`
    );
    const bar = document.createElement('span');
    bar.setAttribute(
      'style',
      `display:inline-block;width:48px;height:3px;border-radius:2px;background:${ctx.accentGlow}`
    );
    replacement.appendChild(bar);
    hr.replaceWith(replacement);
  });
}

/* ---------------- 墨印（中式 / 朱砂） ---------------- */

function applyMoyin(root: ParentNode, ctx: InlineCtx) {
  // h1: 居中 + 上下 ❉ · ❉ 装饰
  root.querySelectorAll('h1').forEach((h) => {
    (h as HTMLElement).setAttribute(
      'style',
      `font-family:${ctx.prose};font-size:24px;font-weight:700;line-height:1.4;text-align:center;margin:16px 0 16px;color:${ctx.ink};letter-spacing:1px`
    );
    const top = document.createElement('div');
    top.setAttribute(
      'style',
      `text-align:center;color:${ctx.accent};font-size:12px;letter-spacing:8px;margin-bottom:10px;font-weight:400`
    );
    top.textContent = '❉   ·   ❉';
    h.insertBefore(top, h.firstChild);
    const bottom = document.createElement('div');
    bottom.setAttribute(
      'style',
      `width:18px;height:18px;border:1px solid ${ctx.accent};transform:rotate(45deg);margin:14px auto 0`
    );
    h.appendChild(bottom);
  });

  // h2: 朱砂方块前缀 + 虚线下划线
  root.querySelectorAll('h2').forEach((h) => {
    (h as HTMLElement).setAttribute(
      'style',
      `font-family:${ctx.prose};font-size:20px;font-weight:700;line-height:1.5;margin:36px 0 14px;padding:0 0 6px;border-bottom:1px dashed ${ctx.border};color:${ctx.ink};letter-spacing:0.5px;display:flex;align-items:center;gap:10px`
    );
    const sq = document.createElement('span');
    sq.setAttribute(
      'style',
      `display:inline-block;width:12px;height:12px;background:${ctx.accent};border-radius:2px;flex-shrink:0`
    );
    h.insertBefore(sq, h.firstChild);
  });

  // h3: 中文括号包裹
  root.querySelectorAll('h3').forEach((h) => {
    (h as HTMLElement).setAttribute(
      'style',
      `font-family:${ctx.prose};font-size:17px;font-weight:700;line-height:1.5;margin:24px 0 10px;color:${ctx.ink};letter-spacing:0.5px`
    );
    const open = document.createElement('span');
    open.setAttribute('style', `color:${ctx.accent};margin-right:2px`);
    open.textContent = '「';
    const close = document.createElement('span');
    close.setAttribute('style', `color:${ctx.accent};margin-left:2px`);
    close.textContent = '」';
    h.insertBefore(open, h.firstChild);
    h.appendChild(close);
  });

  setStyle(
    root,
    'h4',
    `font-family:${ctx.prose};font-size:15px;font-weight:600;line-height:1.5;margin:20px 0 8px;color:${ctx.gray600}`
  );

  // blockquote: 楷体感 + 大引号 + 左侧 accent 细线
  root.querySelectorAll('blockquote').forEach((b) => {
    (b as HTMLElement).setAttribute(
      'style',
      `border:none;background:transparent;padding:6px 20px 6px 28px;margin:24px 0;color:${ctx.gray600};font-family:'STKaiti','KaiTi',${ctx.prose};font-size:16px;line-height:1.85;position:relative`
    );
    const bar = document.createElement('div');
    bar.setAttribute(
      'style',
      `position:absolute;left:14px;top:8px;bottom:8px;width:1px;background:${ctx.accent};opacity:0.45`
    );
    b.insertBefore(bar, b.firstChild);
    const quote = document.createElement('span');
    quote.setAttribute(
      'style',
      `position:absolute;left:0;top:0;font-size:30px;color:${ctx.accent};line-height:1;font-family:Georgia,'Times New Roman',serif`
    );
    quote.textContent = '“';
    b.insertBefore(quote, b.firstChild);
  });
  setStyle(root, 'blockquote p', `margin:0 0 6px;color:${ctx.gray600}`);

  // hr: 替换为 ❉ · ❉
  root.querySelectorAll('hr').forEach((hr) => {
    const replacement = document.createElement('p');
    replacement.setAttribute(
      'style',
      `text-align:center;color:${ctx.accent};font-size:14px;letter-spacing:8px;margin:36px 0;line-height:1`
    );
    replacement.textContent = '❉   ·   ❉';
    hr.replaceWith(replacement);
  });

  setStyle(root, 'strong', `font-weight:600;color:${ctx.accent}`);
}

/* ---------------- 推特 / X：清理后的纯文本 ---------------- */

export interface TwitterStats {
  text: string;
  chars: number;
  tweets: number;
}

const TWEET_LIMIT = 280;

/**
 * 把 markdown 转成适合推特发布的纯文本：
 * - 标题加几何符号引导
 * - 列表统一为「• 」
 * - 链接展开为「文字 URL」
 * - 行内代码用反引号保留
 * - 代码块保留三反引号围栏，去掉语言标签
 * - 图片转为 [图片] 占位
 */
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
