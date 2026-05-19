import { CSSProperties } from 'react';
import { useI18n } from '../i18n';

export type FormatAction =
  | { type: 'color'; value: string }
  | { type: 'clearColor' }
  | { type: 'bold' }
  | { type: 'highlight' };

export interface FormatToolbarProps {
  style: CSSProperties;
  onAction(action: FormatAction): void;
}

export default function FormatToolbar({ style, onAction }: FormatToolbarProps) {
  const { t, palettes } = useI18n();
  const stop = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="format-toolbar" style={style} onMouseDown={stop}>
      {palettes.map((p) => (
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
        title={t.editor.formatClearColor}
        onClick={() => onAction({ type: 'clearColor' })}
      >
        ⌀
      </button>
      <span className="format-toolbar-sep" />
      <button
        className="format-toolbar-btn bold"
        title={t.editor.formatBold}
        onClick={() => onAction({ type: 'bold' })}
      >
        B
      </button>
      <button
        className="format-toolbar-btn hl"
        title={t.editor.formatHighlight}
        onClick={() => onAction({ type: 'highlight' })}
      >
        H
      </button>
    </div>
  );
}
