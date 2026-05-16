/**
 * 图片仓库：把 data URL 单独存到 localStorage，markdown 里只放短引用。
 *
 * 为什么不直接把 data URL 写到 markdown？
 *   一张 200KB 的图 base64 后约 270KB，整段 ![](data:...) 塞进 textarea
 *   会让编辑器没法读、没法编辑、撤销栈也炸。
 *
 * 短引用形如：![alt](app-img:abc123def456)
 *   - 渲染时（renderMarkdown）会把 src="app-img:..." 还原成真实 data URL
 *   - 导出 / 复制都走 renderMarkdown，所以产物里仍是自包含的 data URL
 *
 * 存储：localStorage 单 key，整张 store 作为一个 JSON。读时缓存到模块变量，
 *      写时 dirty-write 整个对象。这样 10~30 张图够用，再多用户也该自己清理。
 */

const KEY = 'markdown-ai:images';
const REF_SCHEME = 'app-img:';

type Store = Record<string, string>;

let cache: Store | null = null;

function load(): Store {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    cache = {};
  }
  return cache!;
}

function persist() {
  if (!cache) return;
  localStorage.setItem(KEY, JSON.stringify(cache));
}

function makeId(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36).slice(-4)
  );
}

export class ImageStoreFullError extends Error {
  constructor() {
    super('图片仓库已满，请删除旧文档中不再用的图片');
    this.name = 'ImageStoreFullError';
  }
}

export function putImage(dataUrl: string): string {
  const s = load();
  const id = makeId();
  s[id] = dataUrl;
  try {
    persist();
  } catch {
    delete s[id];
    throw new ImageStoreFullError();
  }
  return id;
}

export function getImage(id: string): string | null {
  return load()[id] ?? null;
}

export function imageRefURL(id: string): string {
  return REF_SCHEME + id;
}

/**
 * 把渲染出的 HTML 里 src="app-img:xxx" 替换回真实 data URL。
 * 找不到对应图（被清理 / 跨设备）时降级为空 src，浏览器会显示 broken image
 * 占位，不影响排版。
 */
export function resolveImageRefs(html: string): string {
  const s = load();
  return html.replace(/src="app-img:([a-z0-9]+)"/g, (_m, id: string) => {
    const data = s[id];
    return data ? `src="${escapeAttr(data)}"` : 'src="" data-missing-image="1"';
  });
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}

/**
 * GC：扫所有文档正文里出现的 app-img:xxx 引用，把仓库里没用到的删掉。
 * 调用方负责传入"当前所有 markdown 正文"。
 */
export function pruneOrphans(allContent: string[]): number {
  const s = load();
  const used = new Set<string>();
  const re = /app-img:([a-z0-9]+)/g;
  for (const md of allContent) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(md)) !== null) used.add(m[1]);
  }
  let removed = 0;
  for (const id of Object.keys(s)) {
    if (!used.has(id)) {
      delete s[id];
      removed++;
    }
  }
  if (removed > 0) persist();
  return removed;
}
