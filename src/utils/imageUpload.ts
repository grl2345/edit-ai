/**
 * 把本地图片读成 data URL，存进 image store，并往 textarea 光标处插入一段
 * 短引用 markdown（![alt](app-img:xxx)）。
 *
 * 不直接把 data URL 写到 markdown 是因为一张图就能把编辑器撑到几十万字，
 * 失去可读性也拖慢撤销栈。详见 imageStore.ts 的说明。
 *
 * 体积上限 8MB，太大直接拒绝——base64 会膨胀 ~33%，再大 localStorage 会爆。
 */

import { ImageStoreFullError, imageRefURL, putImage } from './imageStore';

const MAX_BYTES = 8 * 1024 * 1024;

export interface InsertImageResult {
  ok: boolean;
  message: string;
  /** 新的 textarea 文本，调用方负责 setState */
  nextValue?: string;
  /** 插入后的光标位置，调用方负责 setSelectionRange */
  nextCaret?: number;
}

export async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error ?? new Error('read failed'));
    fr.readAsDataURL(file);
  });
}

function altFromFilename(name: string): string {
  return name.replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]+/g, ' ').trim() || '图片';
}

/**
 * 把若干图片插到 source 的 caret 处，返回新 source 与新光标。
 * 每张图占一段独立 paragraph，这样渲染器 figurize() 能识别并包成 figure + figcaption。
 */
export async function insertImagesAtCaret(
  source: string,
  caret: number,
  files: File[]
): Promise<InsertImageResult> {
  const imgs = files.filter((f) => f.type.startsWith('image/'));
  if (imgs.length === 0) {
    return { ok: false, message: '没有可插入的图片' };
  }
  for (const f of imgs) {
    if (f.size > MAX_BYTES) {
      return { ok: false, message: `${f.name} 超过 8MB，无法插入` };
    }
  }

  const snippets: string[] = [];
  for (const f of imgs) {
    const url = await fileToDataURL(f);
    try {
      const id = putImage(url);
      snippets.push(`![${altFromFilename(f.name)}](${imageRefURL(id)})`);
    } catch (e) {
      if (e instanceof ImageStoreFullError) {
        return { ok: false, message: e.message };
      }
      throw e;
    }
  }

  const before = source.slice(0, caret);
  const after = source.slice(caret);
  const needsLeadingBreak = before.length > 0 && !before.endsWith('\n\n');
  const needsTrailingBreak = after.length > 0 && !after.startsWith('\n\n');
  const block =
    (needsLeadingBreak ? (before.endsWith('\n') ? '\n' : '\n\n') : '') +
    snippets.join('\n\n') +
    (needsTrailingBreak ? '\n\n' : '');

  const nextValue = before + block + after;
  return {
    ok: true,
    message: imgs.length === 1 ? '已插入图片' : `已插入 ${imgs.length} 张图片`,
    nextValue,
    nextCaret: before.length + block.length,
  };
}

/** 从 ClipboardEvent / DataTransfer 里抽出图片 File 列表 */
export function imagesFromDataTransfer(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  const out: File[] = [];
  if (dt.files && dt.files.length) {
    for (let i = 0; i < dt.files.length; i++) {
      const f = dt.files[i];
      if (f.type.startsWith('image/')) out.push(f);
    }
  }
  if (out.length === 0 && dt.items) {
    for (let i = 0; i < dt.items.length; i++) {
      const it = dt.items[i];
      if (it.kind === 'file' && it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) out.push(f);
      }
    }
  }
  return out;
}
