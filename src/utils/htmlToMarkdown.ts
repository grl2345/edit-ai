/**
 * 把 HTML 转成 Markdown（GFM 风格）。
 *
 * 设计目标：只覆盖编辑器写得出的常用元素 —— 标题 / 段落 / 列表 / 引用 / 表格 /
 * 代码块 / 行内代码 / 链接 / 图片 / 加粗 / 斜体 / 高亮 / 分隔线 / 任务列表。
 * 其余未知元素回退为它们的文本内容，避免把 SVG / script / 样式当正文吐出来。
 */

const BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'header', 'hr', 'main', 'nav',
  'ol', 'p', 'pre', 'section', 'table', 'ul', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
]);

const SKIP_TAGS = new Set(['script', 'style', 'noscript', 'template', 'head', 'meta', 'link', 'title']);

function isElement(node: Node): node is Element {
  return node.nodeType === 1;
}

function isText(node: Node): node is Text {
  return node.nodeType === 3;
}

function escapeMd(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/([*_`\[\]<>])/g, '\\$1');
}

function collapseWS(text: string): string {
  return text.replace(/\s+/g, ' ');
}

function indent(text: string, prefix: string): string {
  return text
    .split('\n')
    .map((line, i) => (i === 0 ? prefix + line : (line ? '    ' + line : '')))
    .join('\n');
}

function trimBlock(s: string): string {
  return s.replace(/^\n+/, '').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '');
}

/**
 * 把内联 children 收集成单行字符串（去多余空白）。
 */
function renderInline(node: Element | DocumentFragment | Document): string {
  let out = '';
  node.childNodes.forEach((child) => {
    out += renderNodeInline(child);
  });
  return out;
}

function renderNodeInline(node: Node): string {
  if (isText(node)) {
    return collapseWS(escapeMd(node.nodeValue ?? ''));
  }
  if (!isElement(node)) return '';
  const tag = node.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) return '';
  const inner = renderInline(node);
  switch (tag) {
    case 'br':
      return '  \n';
    case 'strong':
    case 'b':
      return inner.trim() ? `**${inner.trim()}**` : '';
    case 'em':
    case 'i':
      return inner.trim() ? `*${inner.trim()}*` : '';
    case 'mark':
      return inner.trim() ? `==${inner.trim()}==` : '';
    case 'del':
    case 's':
    case 'strike':
      return inner.trim() ? `~~${inner.trim()}~~` : '';
    case 'code':
      return `\`${(node.textContent ?? '').replace(/`/g, '\\`')}\``;
    case 'a': {
      const href = node.getAttribute('href') ?? '';
      const text = inner.trim() || href;
      if (!href) return text;
      return `[${text}](${href})`;
    }
    case 'img': {
      const src = node.getAttribute('src') ?? '';
      const alt = (node.getAttribute('alt') ?? '').replace(/[\[\]]/g, '');
      if (!src) return '';
      return `![${alt}](${src})`;
    }
    default:
      return inner;
  }
}

function renderListItems(list: Element, ordered: boolean, start: number): string {
  const lines: string[] = [];
  let idx = start;
  list.childNodes.forEach((child) => {
    if (!isElement(child) || child.tagName.toLowerCase() !== 'li') return;
    const marker = ordered ? `${idx}. ` : '- ';
    idx += 1;
    // 任务列表识别：<li><input type=checkbox checked> ...</li>
    const cb = child.querySelector(':scope > input[type=checkbox], :scope > label > input[type=checkbox], :scope > p > input[type=checkbox]');
    let prefix = marker;
    if (cb) {
      const checked = (cb as HTMLInputElement).checked || cb.hasAttribute('checked');
      prefix = `${marker}[${checked ? 'x' : ' '}] `;
      cb.remove();
    }
    const body = renderBlock(child).trim();
    lines.push(indent(body || '', prefix));
  });
  return lines.join('\n');
}

function renderTable(table: Element): string {
  const rows: string[][] = [];
  table.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tr').forEach((tr) => {
    const cells: string[] = [];
    tr.querySelectorAll(':scope > th, :scope > td').forEach((cell) => {
      cells.push(renderInline(cell).replace(/\n+/g, ' ').replace(/\|/g, '\\|').trim());
    });
    if (cells.length) rows.push(cells);
  });
  if (!rows.length) return '';
  const colCount = Math.max(...rows.map((r) => r.length));
  const header = rows[0].concat(Array(colCount - rows[0].length).fill(''));
  const sep = Array(colCount).fill('---');
  const body = rows.slice(1).map((r) => r.concat(Array(colCount - r.length).fill('')));
  const fmt = (r: string[]) => `| ${r.join(' | ')} |`;
  return [fmt(header), fmt(sep), ...body.map(fmt)].join('\n');
}

function renderBlock(node: Element | DocumentFragment | Document): string {
  let out = '';
  node.childNodes.forEach((child) => {
    out += renderNodeBlock(child);
  });
  return out;
}

function renderNodeBlock(node: Node): string {
  if (isText(node)) {
    const text = node.nodeValue ?? '';
    if (!text.trim()) return '';
    return collapseWS(escapeMd(text));
  }
  if (!isElement(node)) return '';
  const tag = node.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) return '';

  switch (tag) {
    case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
      const level = Number(tag[1]);
      const text = renderInline(node).trim();
      return text ? `\n\n${'#'.repeat(level)} ${text}\n\n` : '';
    }
    case 'p': {
      const text = renderInline(node).trim();
      return text ? `\n\n${text}\n\n` : '';
    }
    case 'br':
      return '  \n';
    case 'hr':
      return '\n\n---\n\n';
    case 'pre': {
      const codeEl = node.querySelector('code');
      const raw = (codeEl ?? node).textContent ?? '';
      let lang = '';
      if (codeEl) {
        const cls = codeEl.getAttribute('class') ?? '';
        const m = cls.match(/(?:language|lang)-([\w-]+)/);
        if (m) lang = m[1];
      }
      return `\n\n\`\`\`${lang}\n${raw.replace(/\n+$/, '')}\n\`\`\`\n\n`;
    }
    case 'blockquote': {
      const inner = trimBlock(renderBlock(node));
      if (!inner) return '';
      const quoted = inner
        .split('\n')
        .map((line) => (line ? `> ${line}` : '>'))
        .join('\n');
      return `\n\n${quoted}\n\n`;
    }
    case 'ul':
      return `\n\n${renderListItems(node, false, 1)}\n\n`;
    case 'ol': {
      const startAttr = node.getAttribute('start');
      const start = startAttr ? parseInt(startAttr, 10) || 1 : 1;
      return `\n\n${renderListItems(node, true, start)}\n\n`;
    }
    case 'li': {
      // 直接渲染 li 内容；列表项的标号已经在 renderListItems 里加好。
      // 简单分支：如果 li 里只有内联，按 inline 处理；否则按 block 处理。
      const hasBlock = Array.from(node.children).some((el) =>
        BLOCK_TAGS.has(el.tagName.toLowerCase())
      );
      return hasBlock ? trimBlock(renderBlock(node)) : renderInline(node).trim();
    }
    case 'table':
      return `\n\n${renderTable(node)}\n\n`;
    case 'figure': {
      const img = node.querySelector('img');
      const cap = node.querySelector('figcaption');
      if (img) {
        const src = img.getAttribute('src') ?? '';
        const alt = cap?.textContent?.trim() || img.getAttribute('alt') || '';
        return src ? `\n\n![${alt.replace(/[\[\]]/g, '')}](${src})\n\n` : '';
      }
      return renderBlock(node);
    }
    case 'img': {
      const src = node.getAttribute('src') ?? '';
      const alt = (node.getAttribute('alt') ?? '').replace(/[\[\]]/g, '');
      return src ? `\n\n![${alt}](${src})\n\n` : '';
    }
    case 'a':
    case 'span':
    case 'strong': case 'b':
    case 'em': case 'i':
    case 'mark': case 'del': case 's': case 'strike':
    case 'code':
      return renderNodeInline(node);
    default:
      // 未知容器：当成透明 div 递归。
      return renderBlock(node);
  }
}

/**
 * 把 HTML 字符串转成 Markdown。
 * 浏览器环境直接用 DOMParser；其它环境会抛错（仅在前端用）。
 */
export function htmlToMarkdown(html: string): string {
  if (typeof DOMParser === 'undefined') {
    throw new Error('htmlToMarkdown requires a DOM environment');
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // 优先用 body，没有则用整个 document。
  const root = doc.body ?? doc.documentElement;
  const md = renderBlock(root);
  return trimBlock(md).replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/**
 * 从 HTML 文档里抠出标题：优先 <title>，回退第一个 <h1>。
 */
export function extractHtmlTitle(html: string): string {
  if (typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const t = doc.querySelector('title')?.textContent?.trim();
  if (t) return t;
  const h1 = doc.querySelector('h1')?.textContent?.trim();
  return h1 || '';
}
