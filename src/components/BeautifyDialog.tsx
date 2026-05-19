import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { AIConfig, beautifyMarkdown } from '../utils/aiClient';

export interface BeautifyApplyOptions {
  /** 应用时是否把原文另存一份副本（默认 true） */
  keepOriginal: boolean;
}

export interface BeautifyDialogProps {
  open: boolean;
  source: string;
  cfg: AIConfig;
  onApply(next: string, opts: BeautifyApplyOptions): void;
  onClose(): void;
}

type State =
  | { kind: 'loading' }
  | { kind: 'result'; result: string }
  | { kind: 'error'; message: string };

export default function BeautifyDialog({ open, source, cfg, onApply, onClose }: BeautifyDialogProps) {
  const { t } = useI18n();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [keepOriginal, setKeepOriginal] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    setState({ kind: 'loading' });
    const ac = new AbortController();
    abortRef.current = ac;
    beautifyMarkdown(source, cfg, ac.signal)
      .then((r) => {
        if (!ac.signal.aborted) setState({ kind: 'result', result: r.markdown });
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
      });
    return () => ac.abort();
  }, [open, source, cfg]);

  function handleApply() {
    if (state.kind === 'result') {
      onApply(state.result, { keepOriginal });
      onClose();
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="ai-dialog-overlay" onClick={handleCancel}>
      <div className="ai-dialog ai-dialog-wide" onClick={(e) => e.stopPropagation()}>
        <div className="ai-dialog-head">
          <div>
            <h3>{t.beautify.title}</h3>
            <p>{t.beautify.subtitle}</p>
          </div>
          <button className="ai-dialog-close" onClick={handleCancel} aria-label={t.beautify.close}>✕</button>
        </div>

        {state.kind === 'loading' && (
          <div className="ai-loading">
            <div className="ai-spinner" />
            <div>
              <div className="ai-loading-title">{t.beautify.loadingTitle}</div>
              <div className="ai-loading-sub">{t.beautify.loadingSub} <code>{cfg.model}</code></div>
            </div>
          </div>
        )}

        {state.kind === 'error' && (
          <div className="ai-error">
            <div className="ai-error-title">{t.beautify.errorTitle}</div>
            <pre>{state.message}</pre>
            <div className="ai-error-tip">{t.beautify.errorTip}</div>
          </div>
        )}

        {state.kind === 'result' && (
          <div className="ai-diff">
            <div className="ai-diff-col">
              <div className="ai-diff-tag">{t.beautify.original}</div>
              <textarea className="ai-diff-area" value={source} readOnly />
            </div>
            <div className="ai-diff-col">
              <div className="ai-diff-tag ai-diff-tag-new">{t.beautify.result}</div>
              <textarea
                className="ai-diff-area"
                value={state.result}
                onChange={(e) => setState({ kind: 'result', result: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="ai-dialog-foot">
          <button className="ai-btn-ghost" onClick={handleCancel}>{t.beautify.cancel}</button>
          {state.kind === 'result' && (
            <label className="ai-keep-original" title={t.beautify.keepOriginalTitle}>
              <input
                type="checkbox"
                checked={keepOriginal}
                onChange={(e) => setKeepOriginal(e.target.checked)}
              />
              <span>{t.beautify.keepOriginal}</span>
            </label>
          )}
          <div style={{ flex: 1 }} />
          {state.kind === 'result' && (
            <button className="ai-btn-primary" onClick={handleApply}>{t.beautify.apply}</button>
          )}
        </div>
      </div>
    </div>
  );
}
