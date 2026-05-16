import { CSSProperties } from 'react';

export type FormatAction =
  | { type: 'color'; value: string }
  | { type: 'clearColor' }
  | { type: 'bold' }
  | { type: 'highlight' };

const COLORS = [
  { id: 'red', value: '#d83b3b', label: '红' },
  { id: 'orange', value: '#e07a3c', label: '橙' },
  { id: 'blue', value: '#2f6ed8', label: '蓝' },
  { id: 'green', value: '#2e8b57', label: '绿' },
  { id: 'gray', value: '#666666', label: '灰' },
];

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
      {COLORS.map((c) => (
        <button
          key={c.id}
          className="format-toolbar-swatch"
          title={`${c.label}色`}
          onClick={() => onAction({ type: 'color', value: c.value })}
        >
          <span style={{ background: c.value }} />
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
