import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js/lib/common';

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
 * 把"段落里只有一张图片"的结构升级成 <figure><img><figcaption>。
 * 图注用图片的 alt 文本；alt 为空则只输出 <figure><img></figure>。
 * 这样所有 10+ 套版式可以单独给 figure / figcaption 设计杂志感样式。
 */
function figurize(html: string): string {
  return html.replace(
    /<p>\s*(<img\s[^>]*?>)\s*<\/p>/g,
    (_m, imgTag: string) => {
      const altMatch = imgTag.match(/\salt="([^"]*)"/);
      const alt = altMatch ? altMatch[1] : '';
      return alt
        ? `<figure>${imgTag}<figcaption>${alt}</figcaption></figure>`
        : `<figure>${imgTag}</figure>`;
    }
  );
}

export function renderMarkdown(src: string): string {
  return figurize(marked.parse(src) as string);
}
