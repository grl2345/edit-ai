import { FontId, PaletteId, ThemeMode, getFontStack, getPaletteVars } from './themes';

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

function applyStyle(root: ParentNode, selector: string, css: string) {
  root.querySelectorAll(selector).forEach((el) => {
    const e = el as HTMLElement;
    const prev = e.getAttribute('style') ?? '';
    const merged = prev ? `${css};${prev}` : css;
    e.setAttribute('style', merged);
  });
}

/**
 * 把当前预览 HTML 转成行内样式 HTML，适合粘贴到微信公众号 / 知乎 / 简书。
 * 微信编辑器会丢弃 class 与外部 CSS，所以这里把所有样式 inline 到元素 style 上。
 */
export function toWeChatHTML(
  previewHTML: string,
  palette: PaletteId,
  font: FontId,
  theme: ThemeMode
): string {
  const ctx = buildCtx(palette, font, theme);
  const tpl = document.createElement('template');
  tpl.innerHTML = previewHTML;
  const root = tpl.content;

  applyStyle(
    root,
    'h1',
    `font-family:${ctx.prose};font-size:24px;font-weight:700;line-height:1.4;margin:24px 0 14px;color:${ctx.ink};letter-spacing:-.3px`
  );
  applyStyle(
    root,
    'h2',
    `font-family:${ctx.prose};font-size:20px;font-weight:700;line-height:1.4;margin:32px 0 14px;padding-top:18px;border-top:1px solid ${ctx.border};color:${ctx.ink};letter-spacing:-.2px`
  );
  applyStyle(
    root,
    'h3',
    `font-family:${ctx.prose};font-size:17px;font-weight:700;line-height:1.4;margin:24px 0 10px;color:${ctx.ink}`
  );
  applyStyle(
    root,
    'h4',
    `font-family:${ctx.prose};font-size:15px;font-weight:700;line-height:1.4;margin:18px 0 8px;color:${ctx.ink}`
  );
  applyStyle(
    root,
    'p',
    `font-family:${ctx.prose};font-size:16px;line-height:1.85;margin:0 0 16px;color:${ctx.ink}`
  );
  applyStyle(root, 'strong', `font-weight:600;color:${ctx.ink}`);
  applyStyle(root, 'em', `font-style:italic`);
  applyStyle(
    root,
    'a',
    `color:${ctx.accent};text-decoration:underline;text-underline-offset:3px`
  );
  applyStyle(
    root,
    'blockquote',
    `border-left:3px solid ${ctx.accent};padding:12px 18px;margin:20px 0;background:${ctx.accentGlow};border-radius:0 6px 6px 0;color:${ctx.gray600};font-style:italic;font-family:${ctx.prose}`
  );
  applyStyle(root, 'blockquote p', `color:${ctx.gray600};margin:0`);
  applyStyle(root, 'ul,ol', `margin:0 0 16px;padding-left:24px`);
  applyStyle(
    root,
    'li',
    `margin:0 0 6px;line-height:1.85;color:${ctx.ink};font-family:${ctx.prose};font-size:16px`
  );
  applyStyle(root, 'hr', `border:none;border-top:1px solid ${ctx.border};margin:28px 0`);
  applyStyle(root, 'img', `max-width:100%;border-radius:8px;margin:18px 0;display:block`);
  applyStyle(
    root,
    'table',
    `width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;font-family:${ctx.prose}`
  );
  applyStyle(
    root,
    'th',
    `text-align:left;padding:10px 14px;background:${ctx.gray100};font-weight:600;border-bottom:2px solid ${ctx.border};color:${ctx.ink}`
  );
  applyStyle(
    root,
    'td',
    `padding:10px 14px;border-bottom:1px solid ${ctx.border};color:${ctx.ink}`
  );
  applyStyle(
    root,
    'code',
    `font-family:${MONO};font-size:13.5px;background:${ctx.gray100};color:${ctx.accent};padding:2px 6px;border-radius:4px`
  );
  applyStyle(
    root,
    'pre',
    `background:${ctx.terminalBg};color:${ctx.terminalText};padding:16px 18px;border-radius:8px;overflow-x:auto;margin:20px 0;font-family:${MONO};font-size:13px;line-height:1.65`
  );
  applyStyle(
    root,
    'pre code',
    `background:none;padding:0;border-radius:0;color:inherit;font-size:inherit;font-family:${MONO}`
  );

  applyStyle(root, '.hljs-keyword,.hljs-selector-tag,.hljs-built_in', `color:#ff7b72`);
  applyStyle(root, '.hljs-string,.hljs-attr', `color:#a5d6ff`);
  applyStyle(root, '.hljs-number,.hljs-literal', `color:#79c0ff`);
  applyStyle(root, '.hljs-comment,.hljs-quote', `color:#8b949e;font-style:italic`);
  applyStyle(root, '.hljs-title,.hljs-function,.hljs-name', `color:#d2a8ff`);
  applyStyle(root, '.hljs-variable,.hljs-params', `color:#ffa657`);
  applyStyle(root, '.hljs-tag,.hljs-meta', `color:#7ee787`);

  const section = document.createElement('section');
  section.setAttribute(
    'style',
    `font-family:${ctx.prose};color:${ctx.ink};max-width:100%;line-height:1.85;font-size:16px`
  );
  section.appendChild(root);
  return section.outerHTML;
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
