import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js/lib/common';
import { resolveImageRefs } from './imageStore';

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
      try {
        return hljs.highlight(code, { language, ignoreIllegals: true }).value;
      } catch {
        return code;
      }
    },
  })
);

marked.setOptions({
  gfm: true,
  breaks: false,
});

/**
 * ==text== → <mark>text</mark>
 * 用 marked 内联扩展实现，能正确避开 code/pre 等 token 内部
 */
marked.use({
  extensions: [
    {
      name: 'mark',
      level: 'inline',
      start(src: string) {
        const i = src.indexOf('==');
        return i < 0 ? undefined : i;
      },
      tokenizer(src: string) {
        const m = /^==([^=\n][^=\n]*?)==/.exec(src);
        if (m) {
          return { type: 'mark', raw: m[0], text: m[1].trim() };
        }
      },
      renderer(token) {
        return `<mark>${(token as unknown as { text: string }).text}</mark>`;
      },
    },
  ],
});

/* -------------------- 后处理：4 个自动元素 + figure -------------------- */

/**
 * "段落里只有一张图 + alt 非空"自动包成 figure + figcaption
 */
function figurize(html: string): string {
  return html.replace(/<p>\s*(<img\s[^>]*?>)\s*<\/p>/g, (_m, imgTag: string) => {
    const altMatch = imgTag.match(/\salt="([^"]*)"/);
    const alt = altMatch ? altMatch[1] : '';
    return alt
      ? `<figure>${imgTag}<figcaption>${alt}</figcaption></figure>`
      : `<figure>${imgTag}</figure>`;
  });
}

/**
 * h3 末尾带 ：或 : 的，标记为 chip。每个版式可以单独样式化为暗胶囊 / 标签。
 */
function chipify(html: string): string {
  return html.replace(
    /<h3>([^<]*?[：:])\s*<\/h3>/g,
    (_m, content: string) => `<h3 data-chip="1">${content}</h3>`
  );
}

/**
 * <li><p><strong>Title</strong></p><p>desc...</p></li>
 *  → <li data-def="1"><div data-def-title>Title</div><div data-def-desc>desc...</div></li>
 *
 * 检测"列表项的第一段只是粗体标题"+ 后续段落作为描述，自动渲染成"带副标题的定义项"。
 */
function definitionize(html: string): string {
  return html.replace(
    /<li>\s*<p><strong>([\s\S]+?)<\/strong><\/p>\s*([\s\S]*?)<\/li>/g,
    (m, title: string, rest: string) => {
      const trimmed = rest.trim();
      if (!trimmed) return m;
      return `<li data-def="1"><div data-def-title="1">${title}</div><div data-def-desc="1">${trimmed}</div></li>`;
    }
  );
}

/**
 * GFM Alerts: > [!NOTE] / [!TIP] / [!WARNING] / [!IMPORTANT] / [!CAUTION]
 *  → <div data-callout="note"><div data-callout-head="note">NOTE</div>...</div>
 */
const CALLOUT_TYPES = ['NOTE', 'TIP', 'WARNING', 'IMPORTANT', 'CAUTION'] as const;
function calloutize(html: string): string {
  return html.replace(/<blockquote>\s*([\s\S]*?)\s*<\/blockquote>/g, (m, content: string) => {
    const head = content.match(/^<p>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*\n?([\s\S]*?)<\/p>([\s\S]*)$/);
    if (!head) return m;
    const TYPE = head[1] as (typeof CALLOUT_TYPES)[number];
    const lower = TYPE.toLowerCase();
    const firstParaInner = head[2].trim();
    const restParas = head[3].trim();
    const body = (firstParaInner ? `<p>${firstParaInner}</p>` : '') + restParas;
    return `<div data-callout="${lower}"><div data-callout-head="${lower}">${TYPE}</div>${body}</div>`;
  });
}

export function renderMarkdown(src: string): string {
  let html = marked.parse(src) as string;
  html = figurize(html);
  html = calloutize(html);
  html = chipify(html);
  html = definitionize(html);
  html = resolveImageRefs(html);
  return html;
}
