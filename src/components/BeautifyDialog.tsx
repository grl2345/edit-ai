import { useEffect, useRef, useState } from 'react';
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
            <h3>AI 美化排版</h3>
            <p>保留原文字句，仅调整 markdown 结构</p>
          </div>
          <button className="ai-dialog-close" onClick={handleCancel} aria-label="关闭">✕</button>
        </div>

        {state.kind === 'loading' && (
          <div className="ai-loading">
            <div className="ai-spinner" />
            <div>
              <div className="ai-loading-title">AI 正在重排版式…</div>
              <div className="ai-loading-sub">用模型 <code>{cfg.model}</code></div>
            </div>
          </div>
        )}

        {state.kind === 'error' && (
          <div className="ai-error">
            <div className="ai-error-title">出错了</div>
            <pre>{state.message}</pre>
            <div className="ai-error-tip">检查 Base URL、Model 名是否正确，API Key 是否有效</div>
          </div>
        )}

        {state.kind === 'result' && (
          <div className="ai-diff">
            <div className="ai-diff-col">
              <div className="ai-diff-tag">原文</div>
              <textarea className="ai-diff-area" value={source} readOnly />
            </div>
            <div className="ai-diff-col">
              <div className="ai-diff-tag ai-diff-tag-new">美化后</div>
              <textarea
                className="ai-diff-area"
                value={state.result}
                onChange={(e) => setState({ kind: 'result', result: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="ai-dialog-foot">
          <button className="ai-btn-ghost" onClick={handleCancel}>取消</button>
          {state.kind === 'result' && (
            <label className="ai-keep-original" title="把原文另存为一份副本到文档列表，应用后还能找回">
              <input
                type="checkbox"
                checked={keepOriginal}
                onChange={(e) => setKeepOriginal(e.target.checked)}
              />
              <span>保留原文为副本</span>
            </label>
          )}
          <div style={{ flex: 1 }} />
          {state.kind === 'result' && (
            <button className="ai-btn-primary" onClick={handleApply}>应用</button>
          )}
        </div>
      </div>
    </div>
  );
}
