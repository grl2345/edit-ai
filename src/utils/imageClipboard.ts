/**
 * 把一张图片（data URL / 任意 URL）写到剪贴板，作为 image/png blob。
 *
 * 用途：知乎 / 飞书 / Notion 等的粘贴流水线对"HTML 内嵌 data URL"支持不
 * 稳定，但对"剪贴板里有 image/png"几乎都能直接吃下变成一个图片块。所以
 * 走"单张图单次粘贴"路线最稳。
 *
 * 实现要点：
 *   - data URL / blob URL / http(s) URL 都先 fetch 成 Blob；
 *   - ClipboardItem 在多数浏览器里只接 image/png，不接 image/jpeg；如果
 *     源是 JPEG，先用 canvas 转码成 PNG；
 *   - 写失败（HTTP / 跨域 / 用户拒授权）返回 false。
 */

export async function copyImageURLToClipboard(src: string): Promise<boolean> {
  if (!('ClipboardItem' in window) || !navigator.clipboard?.write) return false;
  try {
    const blob = await (await fetch(src)).blob();
    const png = blob.type === 'image/png' ? blob : await blobToPng(blob);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
    return true;
  } catch {
    return false;
  }
}

async function blobToPng(blob: Blob): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas ctx unavailable');
    ctx.drawImage(img, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/png'
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}
