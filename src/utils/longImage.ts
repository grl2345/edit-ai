import { toPng } from 'html-to-image';

/**
 * 把预览 article 整段（含 scrollHeight 外的部分）截成长图。
 *
 * 路线选 html-to-image 的 SVG foreignObject 法：
 *   - 截到的是当前 DOM 全部样式 + 内嵌图（data URL 直接拿来用）
 *   - 它会自动把 @font-face 引用的 woff2 拉成 data URL inline 进 SVG，
 *     确保字体不掉
 *   - pixelRatio: 2 是为 retina 显示清晰；推特粘进去后再压一次，质感
 *     仍 OK
 *
 * 输出策略：
 *   优先写到剪贴板（ClipboardItem image/png），用户在推特撰文框 Cmd+V
 *   就能把长图作为媒体附件贴上去；
 *   浏览器不支持 ClipboardItem 时退化成下载 PNG，用户手动拖到推特媒体
 *   按钮里。
 */
export type LongImageResult = 'copied' | 'downloaded' | 'failed';

export async function copyOrDownloadPreviewImage(
  node: HTMLElement,
  filename: string
): Promise<LongImageResult> {
  // 预览背景：当前节点 transparent 时往上找父节点拿
  const bg = pickBackgroundColor(node);
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: bg,
    // 字体里 LXGW WenKai / Noto Serif SC 文件偏大，给它充足超时
    fetchRequestInit: { cache: 'no-cache' },
  });

  // 剪贴板路线
  if ('ClipboardItem' in window && navigator.clipboard?.write) {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return 'copied';
    } catch {
      // 落到下载分支
    }
  }

  // 下载分支
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return 'downloaded';
}

function pickBackgroundColor(node: HTMLElement): string {
  let cur: HTMLElement | null = node;
  while (cur) {
    const bg = getComputedStyle(cur).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
    cur = cur.parentElement;
  }
  return '#ffffff';
}
