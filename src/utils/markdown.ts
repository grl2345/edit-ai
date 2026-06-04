import {
  DEFAULT_FONT,
  DEFAULT_PALETTE,
  DEFAULT_TEMPLATE,
  FontId,
  PaletteId,
  TemplateId,
  ThemeMode,
  getFontStack,
  getPaletteVars,
} from './themes';
import { renderMarkdown } from './render';
export { renderMarkdown };
import qingyeCss from '../styles/templates/qingye.css?raw';
import haibaoCss from '../styles/templates/haibao.css?raw';
import ningmengCss from '../styles/templates/ningmeng.css?raw';
import chongyingCss from '../styles/templates/chongying.css?raw';
import huabaoCss from '../styles/templates/huabao.css?raw';
import yinzhangCss from '../styles/templates/yinzhang.css?raw';
import geshanCss from '../styles/templates/geshan.css?raw';
import shouzhaCss from '../styles/templates/shouzha.css?raw';
import jiguangCss from '../styles/templates/jiguang.css?raw';
import zhangyeCss from '../styles/templates/zhangye.css?raw';
import juanshouCss from '../styles/templates/juanshou.css?raw';
import jiekanCss from '../styles/templates/jiekan.css?raw';
import yuebaoCss from '../styles/templates/yuebao.css?raw';
import hongbangCss from '../styles/templates/hongbang.css?raw';
import shishangCss from '../styles/templates/shishang.css?raw';
import chuanboCss from '../styles/templates/chuanbo.css?raw';
import wenyiCss from '../styles/templates/wenyi.css?raw';

const TEMPLATE_CSS: Record<TemplateId, string> = {
  qingye: qingyeCss,
  haibao: haibaoCss,
  ningmeng: ningmengCss,
  chongying: chongyingCss,
  huabao: huabaoCss,
  yinzhang: yinzhangCss,
  geshan: geshanCss,
  shouzha: shouzhaCss,
  jiguang: jiguangCss,
  zhangye: zhangyeCss,
  juanshou: juanshouCss,
  jiekan: jiekanCss,
  yuebao: yuebaoCss,
  hongbang: hongbangCss,
  shishang: shishangCss,
  chuanbo: chuanboCss,
  wenyi: wenyiCss,
};

const FONT_STACK_SANS =
  "system-ui,-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei','WenQuanYi Micro Hei',sans-serif";
const FONT_STACK_MONO = "'JetBrains Mono','Menlo',monospace";

export interface ExportAppearance {
  palette: PaletteId;
  font: FontId;
  theme: ThemeMode;
  template: TemplateId;
}

export function buildStandaloneHTML(
  markdown: string,
  title = 'Markdown',
  appearance: ExportAppearance = {
    palette: DEFAULT_PALETTE,
    font: DEFAULT_FONT,
    theme: 'light',
    template: DEFAULT_TEMPLATE,
  }
): string {
  const body = renderMarkdown(markdown);
  const v = getPaletteVars(appearance.palette, appearance.theme);
  const prose = getFontStack(appearance.font);
  const isDark = appearance.theme === 'dark';
  const templateCss = TEMPLATE_CSS[appearance.template] ?? '';

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=LXGW+WenKai+TC:wght@400;700&family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet">
<style>
:root{
  --ink:${v.ink};
  --paper:${v.paper};
  --accent:${v.accent};
  --accent-light:${v.accentLight};
  --accent-glow:${v.accentGlow};
  --surface:${v.surface};
  --gray-100:${v.gray100};
  --gray-200:${v.border};
  --gray-500:${v.gray500};
  --gray-600:${v.gray600};
  --terminal-bg:${v.terminalBg};
  --terminal-text:${v.terminalText};
  --prose-font:${prose};
  --sans:${FONT_STACK_SANS};
  --mono:${FONT_STACK_MONO};
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased}
.prose{font-family:var(--prose-font);max-width:760px;margin:0 auto;padding:48px 24px 96px;font-size:16.5px;line-height:1.85;color:var(--ink)}
.prose>:first-child{margin-top:0!important;padding-top:0!important;border-top:none!important}
.prose h1{font-family:var(--prose-font);font-size:32px;font-weight:700;margin:0 0 24px;letter-spacing:-.4px}
.prose h2{font-family:var(--prose-font);font-size:24px;font-weight:700;margin:56px 0 20px;padding-top:32px;border-top:1px solid var(--gray-200);letter-spacing:-.3px}
.prose h3{font-family:var(--prose-font);font-size:19px;font-weight:700;margin:40px 0 14px}
.prose h4{font-family:var(--prose-font);font-size:17px;font-weight:700;margin:28px 0 10px}
.prose p{margin:0 0 20px}
.prose strong{font-weight:600;color:var(--ink)}
.prose em{font-style:italic}
.prose ul,.prose ol{margin:0 0 20px;padding-left:24px}
.prose li{margin-bottom:8px}
.prose a{color:var(--accent);text-decoration:underline;text-underline-offset:3px}
.prose blockquote{border-left:3px solid var(--accent);padding:16px 24px;margin:28px 0;background:var(--accent-glow);border-radius:0 8px 8px 0;font-style:italic;color:var(--gray-600)}
.prose table{width:100%;border-collapse:collapse;margin:28px 0;font-size:15px}
.prose th{text-align:left;padding:12px 16px;background:var(--gray-100);font-weight:600;border-bottom:2px solid var(--gray-200);font-size:14px}
.prose td{padding:12px 16px;border-bottom:1px solid var(--gray-200)}
.prose img{max-width:100%;border-radius:10px;margin:28px 0}
.prose hr{border:none;height:1px;background:var(--gray-200);margin:48px 0}
.prose code{font-family:var(--mono);font-size:.88em;background:var(--gray-100);padding:2px 7px;border-radius:4px;color:var(--accent)}
.prose pre{background:var(--terminal-bg);border-radius:10px;margin:28px 0;padding:20px;font-family:var(--mono);font-size:13.5px;line-height:1.7;color:var(--terminal-text);overflow-x:auto}
.prose pre code{background:none;padding:0;border-radius:0;color:inherit;font-size:inherit;font-family:inherit}
.hljs-keyword,.hljs-selector-tag,.hljs-built_in{color:#ff7b72}
.hljs-string,.hljs-attr{color:#a5d6ff}
.hljs-number,.hljs-literal{color:#79c0ff}
.hljs-comment,.hljs-quote{color:#8b949e;font-style:italic}
.hljs-title,.hljs-function,.hljs-name{color:#d2a8ff}
.hljs-variable,.hljs-params{color:#ffa657}
.hljs-tag,.hljs-meta{color:#7ee787}
${isDark ? '@media (prefers-color-scheme: light){body{color-scheme:dark}}' : ''}
${templateCss}
</style>
</head>
<body>
<article class="prose" data-template="${appearance.template}">
${body}
</article>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
}
