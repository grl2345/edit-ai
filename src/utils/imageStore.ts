/**
 * 图片仓库（IndexedDB 版）。
 *
 * 为什么从 localStorage 迁到 IndexedDB：
 *   localStorage 全站配额 5–10MB，一两张高清图就塞满，弹"仓库已满"。
 *   IndexedDB 是浏览器为大数据准备的，单 origin 一般给几百 MB～GB，
 *   足够装 50+ 张图。
 *
 * 设计要点：
 *   - 持久化在 IndexedDB（异步），渲染时需要同步拿到 data URL，所以有
 *     一层内存 Map 作为同步 cache；
 *   - 启动时 ensureCache() 把所有图一次性读进 cache，之后 resolveImageRefs
 *     完全同步；
 *   - 老版本写在 localStorage 的 markdown-ai:images 自动迁移到 IndexedDB
 *     然后清掉，对用户透明；
 *   - IndexedDB 不可用（极少数浏览器 / 隐私模式）时退化到 localStorage，
 *     保功能。
 */

const DB_NAME = 'markdown-ai';
const STORE_NAME = 'images';
const LEGACY_LS_KEY = 'markdown-ai:images';
const REF_SCHEME = 'app-img:';

const cache = new Map<string, string>();
let cacheReadyPromise: Promise<void> | null = null;
let onReadyCallbacks: Array<() => void> = [];
let usingFallback = false;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('indexeddb blocked'));
  });
}

async function migrateLegacyIfAny(db: IDBDatabase) {
  const raw = localStorage.getItem(LEGACY_LS_KEY);
  if (!raw) return;
  try {
    const legacy = JSON.parse(raw) as Record<string, string>;
    const entries = Object.entries(legacy);
    if (entries.length === 0) {
      localStorage.removeItem(LEGACY_LS_KEY);
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const s = tx.objectStore(STORE_NAME);
      for (const [id, data] of entries) s.put(data, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    localStorage.removeItem(LEGACY_LS_KEY);
  } catch {
    localStorage.removeItem(LEGACY_LS_KEY);
  }
}

async function loadAllIntoCache(db: IDBDatabase) {
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cache.set(cursor.key as string, cursor.value as string);
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}

function loadFallbackFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LEGACY_LS_KEY);
    if (!raw) return;
    const map = JSON.parse(raw) as Record<string, string>;
    for (const [id, data] of Object.entries(map)) cache.set(id, data);
  } catch {
    /* ignore */
  }
}

export function ensureCache(): Promise<void> {
  if (cacheReadyPromise) return cacheReadyPromise;
  cacheReadyPromise = (async () => {
    try {
      const db = await openDB();
      await migrateLegacyIfAny(db);
      await loadAllIntoCache(db);
    } catch {
      usingFallback = true;
      loadFallbackFromLocalStorage();
    }
    const cbs = onReadyCallbacks;
    onReadyCallbacks = [];
    cbs.forEach((cb) => cb());
  })();
  return cacheReadyPromise;
}

export function onImagesReady(cb: () => void): () => void {
  if (cacheReadyPromise) {
    cacheReadyPromise.then(cb);
    return () => {};
  }
  onReadyCallbacks.push(cb);
  return () => {
    onReadyCallbacks = onReadyCallbacks.filter((f) => f !== cb);
  };
}

function makeId(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36).slice(-4)
  );
}

export class ImageStoreFullError extends Error {
  constructor() {
    super('浏览器存储空间不足，请删除一些旧图片或文档');
    this.name = 'ImageStoreFullError';
  }
}

export async function putImage(dataUrl: string): Promise<string> {
  await ensureCache();
  const id = makeId();
  if (usingFallback) {
    try {
      const raw = localStorage.getItem(LEGACY_LS_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      map[id] = dataUrl;
      localStorage.setItem(LEGACY_LS_KEY, JSON.stringify(map));
      cache.set(id, dataUrl);
      return id;
    } catch {
      throw new ImageStoreFullError();
    }
  }
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(dataUrl, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    cache.set(id, dataUrl);
    return id;
  } catch (e) {
    if (
      e instanceof DOMException &&
      (e.name === 'QuotaExceededError' || e.name === 'AbortError')
    ) {
      throw new ImageStoreFullError();
    }
    throw e;
  }
}

export function getImage(id: string): string | null {
  return cache.get(id) ?? null;
}

export function imageRefURL(id: string): string {
  return REF_SCHEME + id;
}

/**
 * 把渲染出的 HTML 里 src="app-img:xxx" 替换回真实 data URL。同步——前提是
 * ensureCache() 已 await 完成。cache 还没就绪 / 找不到的图回落空 src。
 */
export function resolveImageRefs(html: string): string {
  return html.replace(/src="app-img:([a-z0-9]+)"/g, (_m, id: string) => {
    const data = cache.get(id);
    return data ? `src="${escapeAttr(data)}"` : 'src="" data-missing-image="1"';
  });
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}

/** 删掉所有当前文档里都没引用的图，回收空间。可以放在"清理"按钮里手动触发。 */
export async function pruneOrphans(allContent: string[]): Promise<number> {
  await ensureCache();
  const used = new Set<string>();
  const re = /app-img:([a-z0-9]+)/g;
  for (const md of allContent) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(md)) !== null) used.add(m[1]);
  }
  const orphans = Array.from(cache.keys()).filter((id) => !used.has(id));
  if (orphans.length === 0) return 0;
  if (usingFallback) {
    try {
      const raw = localStorage.getItem(LEGACY_LS_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      for (const id of orphans) {
        delete map[id];
        cache.delete(id);
      }
      localStorage.setItem(LEGACY_LS_KEY, JSON.stringify(map));
      return orphans.length;
    } catch {
      return 0;
    }
  }
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const s = tx.objectStore(STORE_NAME);
      for (const id of orphans) {
        s.delete(id);
        cache.delete(id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return orphans.length;
  } catch {
    return 0;
  }
}
