import { CSSProperties } from 'react';
import { PALETTES } from '../utils/themes';

export type FormatAction =
  | { type: 'color'; value: string }
  | { type: 'clearColor' }
  | { type: 'bold' }
  | { type: 'highlight' };

export interface FormatToolbarProps {
  style: CSSProperties;
  onAction(action: FormatAction): void;
}

/**
 * 选中文字时浮在选区上方的工具栏。颜色 swatch / 加粗 / 高亮 / 清除颜色。
 *
 * 所有按钮用 onMouseDown + preventDefault，避免点按钮时 textarea 先 blur
 * 导致 selectionStart/End 被重置。
 */
export default function FormatToolbar({ style, onAction }: FormatToolbarProps) {
  const stop = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="format-toolbar" style={style} onMouseDown={stop}>
      {PALETTES.map((p) => (
        <button
          key={p.id}
          className="format-toolbar-swatch"
          title={p.name}
          onClick={() => onAction({ type: 'color', value: p.swatch })}
        >
          <span style={{ background: p.swatch }} />
        </button>
      ))}
      <button
        className="format-toolbar-btn"
        title="清除颜色"
        onClick={() => onAction({ type: 'clearColor' })}
      >
        ⌀
      </button>
      <span className="format-toolbar-sep" />
      <button
        className="format-toolbar-btn bold"
        title="加粗（**）"
        onClick={() => onAction({ type: 'bold' })}
      >
        B
      </button>
      <button
        className="format-toolbar-btn hl"
        title="高亮（==）"
        onClick={() => onAction({ type: 'highlight' })}
      >
        H
      </button>
    </div>
  );
}
