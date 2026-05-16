import { useEffect, useState } from 'react';
import {
  AIConfig,
  PROVIDER_PRESETS,
  loadAIConfig,
  saveAIConfig,
  clearAIConfig,
} from '../utils/aiClient';

export interface AISettingsDialogProps {
  open: boolean;
  onClose(): void;
  onSaved?(cfg: AIConfig): void;
}

export default function AISettingsDialog({ open, onClose, onSaved }: AISettingsDialogProps) {
  const [providerId, setProviderId] = useState<string>('deepseek');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);

  useEffect(() => {
    if (!open) return;
    const cfg = loadAIConfig();
    if (cfg) {
      setBaseUrl(cfg.baseUrl);
      setApiKey(cfg.apiKey);
      setModel(cfg.model);
      // 反向匹配 preset
      const matched = PROVIDER_PRESETS.find((p) => p.baseUrl === cfg.baseUrl);
      setProviderId(matched?.id ?? 'custom');
    } else {
      const def = PROVIDER_PRESETS.find((p) => p.id === 'deepseek')!;
      setBaseUrl(def.baseUrl);
      setModel(def.defaultModel);
      setApiKey('');
      setProviderId(def.id);
    }
    setTestResult('');
  }, [open]);

  function applyPreset(id: string) {
    setProviderId(id);
    const preset = PROVIDER_PRESETS.find((p) => p.id === id);
    if (preset && preset.id !== 'custom') {
      setBaseUrl(preset.baseUrl);
      setModel(preset.defaultModel);
    }
  }

  function handleSave() {
    if (!baseUrl.trim() || !model.trim()) {
      setTestResult('Base URL 和 Model 不能为空');
      return;
    }
    const cfg: AIConfig = {
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
    };
    saveAIConfig(cfg);
    onSaved?.(cfg);
    onClose();
  }

  function handleClear() {
    if (!confirm('确定清除 AI 配置吗？')) return;
    clearAIConfig();
    setBaseUrl('');
    setApiKey('');
    setModel('');
    setTestResult('已清除');
  }

  async function handleTest() {
    if (!baseUrl.trim() || !model.trim()) {
      setTestResult('Base URL 和 Model 不能为空');
      return;
    }
    setTesting(true);
    setTestResult('测试中…');
    try {
      const url = `${baseUrl.trim().replace(/\/+$/, '')}/chat/completions`;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey.trim()) headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: model.trim(),
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
          stream: false,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setTestResult(`✗ ${res.status}: ${text.slice(0, 120) || res.statusText}`);
      } else {
        setTestResult('✓ 连接成功');
      }
    } catch (e) {
      setTestResult(`✗ 网络错误: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setTesting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="ai-dialog-overlay" onClick={onClose}>
      <div className="ai-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ai-dialog-head">
          <div>
            <h3>AI 服务配置</h3>
            <p>OpenAI 兼容 API · 数据只存浏览器本地</p>
          </div>
          <button className="ai-dialog-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        <div className="ai-dialog-body">
          <div className="ai-field">
            <label>服务商</label>
            <div className="ai-preset-grid">
              {PROVIDER_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`ai-preset ${providerId === p.id ? 'active' : ''}`}
                  onClick={() => applyPreset(p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="ai-field">
            <label htmlFor="ai-base-url">Base URL</label>
            <input
              id="ai-base-url"
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              autoComplete="off"
              spellCheck={false}
            />
            <span className="ai-field-hint">必须支持 /chat/completions endpoint</span>
          </div>

          <div className="ai-field">
            <label htmlFor="ai-model">Model</label>
            <input
              id="ai-model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="如 deepseek-chat / gpt-4o-mini / qwen-plus"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="ai-field">
            <label htmlFor="ai-key">API Key</label>
            <div className="ai-key-row">
              <input
                id="ai-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" className="ai-key-toggle" onClick={() => setShowKey((v) => !v)}>
                {showKey ? '隐藏' : '显示'}
              </button>
            </div>
            <span className="ai-field-hint">仅存浏览器 localStorage，不会上传任何服务器</span>
          </div>

          {testResult && (
            <div className={`ai-test-result ${testResult.startsWith('✓') ? 'ok' : testResult.startsWith('✗') ? 'err' : ''}`}>
              {testResult}
            </div>
          )}
        </div>

        <div className="ai-dialog-foot">
          <button className="ai-btn-ghost" onClick={handleClear}>清除</button>
          <div style={{ flex: 1 }} />
          <button className="ai-btn-ghost" onClick={handleTest} disabled={testing}>
            {testing ? '测试中…' : '测试连接'}
          </button>
          <button className="ai-btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
}
