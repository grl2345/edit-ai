import { useState } from 'react';
import { copyImageURLToClipboard } from '../utils/imageClipboard';

export interface TransferImage {
  src: string;
  alt: string;
}

export interface ImageTransferPanelProps {
  images: TransferImage[];
  /** 面板标题，默认"图片转移" */
  title?: string;
  /** 面板提示语，默认通用版 */
  hint?: string;
  /** 给主应用回显 toast，避免组件自己持 toast 系统 */
  onToast(msg: string): void;
  onClose(): void;
}

/**
 * "图片转移"面板 —— 知乎 / 推特通用。
 *
 * 为什么需要：知乎服务端拒收 data URL 形式的 <img>；推特正文是纯文本根本
 * 不接 HTML 图片。但两边都接受"剪贴板里直接装 image/png blob"——用户
 * Cmd+V 一次粘一张图就会自动建图片块 / 媒体附件。所以这个面板的工作是：
 * 列出原文里的所有图，每张配一个"复制"按钮，点完去目标编辑器粘一下，循环。
 *
 * 设计：浮在窗口右下角的卡片，不挡正文，可关闭。复制成功的图会打勾。
 */
export default function ImageTransferPanel({
  images,
  title = '图片转移',
  hint = '正文已复制 · 请先粘贴正文，再按顺序逐张点「复制」→ 在目标编辑器 Cmd+V',
  onToast,
  onClose,
}: ImageTransferPanelProps) {
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set());

  if (images.length === 0) return null;

  async function handleCopy(idx: number) {
    const ok = await copyImageURLToClipboard(images[idx].src);
    if (ok) {
      setDoneIds((s) => {
        const next = new Set(s);
        next.add(idx);
        return next;
      });
      onToast(`图 ${idx + 1} 已复制，去目标编辑器 Cmd+V 粘贴`);
    } else {
      onToast(`图 ${idx + 1} 复制失败（浏览器不支持图片剪贴板）`);
    }
  }

  return (
    <div className="img-transfer-panel" role="dialog" aria-label={title}>
      <div className="img-transfer-head">
        <div className="img-transfer-title">
          {title} · 共 {images.length} 张
        </div>
        <button
          className="img-transfer-close"
          onClick={onClose}
          aria-label="关闭"
          title="关闭"
        >
          ×
        </button>
      </div>
      <div className="img-transfer-hint">{hint}</div>
      <ol className="img-transfer-list">
        {images.map((img, i) => (
          <li key={i} className="img-transfer-item">
            <img className="img-transfer-thumb" src={img.src} alt={img.alt} />
            <div className="img-transfer-meta">
              <div className="img-transfer-idx">图 {i + 1}</div>
              {img.alt && (
                <div className="img-transfer-alt" title={img.alt}>
                  {img.alt}
                </div>
              )}
            </div>
            <button
              className={`img-transfer-copy ${doneIds.has(i) ? 'done' : ''}`}
              onClick={() => handleCopy(i)}
            >
              {doneIds.has(i) ? '✓ 再复制' : '复制'}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
