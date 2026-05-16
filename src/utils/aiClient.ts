/**
 * OpenAI-compatible chat 客户端。支持 OpenAI / DeepSeek / Moonshot / Qwen /
 * OpenRouter / Ollama / 任意 OpenAI-protocol 兼容 endpoint。
 *
 * 用户在 AISettingsDialog 里填 baseUrl + model + apiKey，存 localStorage。
 * 调用时走 POST {baseUrl}/chat/completions。
 */

export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const STORAGE_KEY = 'markdown-ai:ai-config';

export function loadAIConfig(): AIConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as AIConfig;
    if (!cfg.baseUrl || !cfg.apiKey || !cfg.model) return null;
    return cfg;
  } catch {
    return null;
  }
}

export function saveAIConfig(cfg: AIConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function clearAIConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export interface AIProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  hint?: string;
}

export const PROVIDER_PRESETS: AIProviderPreset[] = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
  { id: 'moonshot', name: 'Moonshot · Kimi', baseUrl: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-8k' },
  { id: 'qwen', name: '通义千问 · DashScope', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-plus' },
  { id: 'zhipu', name: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: 'glm-4-flash' },
  { id: 'openrouter', name: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'anthropic/claude-3.5-sonnet' },
  { id: 'ollama', name: 'Ollama · 本地', baseUrl: 'http://localhost:11434/v1', defaultModel: 'qwen2.5:7b', hint: '本地无需 key，随便填' },
  { id: 'custom', name: '自定义', baseUrl: '', defaultModel: '' },
];

/* ============================================================
   美化排版 system prompt
   ============================================================ */
const BEAUTIFY_SYSTEM_PROMPT = `你是一个 markdown 排版美化助手。

【铁律】严格保留原文字句不变。不改写、不增删、不替换近义词、不改变事实、不写解释和总结。只调整 markdown 结构与标记。

【可用增强语法】
1. 标题层级：用 # / ## / ### 整理层级。
   - 中文"一、二、三、" 或"01 02 03"开头的小段标题，升级为 ##
   - "三大原因 / 核心要点"等小节标题，用 ###
2. Chip h3：短句小标题（不超过 14 字）末尾加中文冒号 "：" 会渲染为彩色胶囊。
   适合："三大核心：" "为什么重要："
3. 高亮：核心结论、关键短词包 \`==xxx==\` 渲染为高亮笔。
   适合包：突破性 / 关键 / 决定性 / 首次 / 核心 等强语气词
4. Callout：把"注意 / 警告 / 提示 / 重要"开头的段落转为 GFM callout：
   > [!NOTE]
   > 说明文字
   类型：NOTE（注意 / 说明） · TIP（提示 / 建议） · WARNING（警告 / 注意安全） · IMPORTANT（重要） · CAUTION（小心 / 千万别）
5. 定义列表：连续的"加粗短语 + 描述段落"统一转为：
   - **加粗短语**

     描述段落...
6. 代码：单行命令 / 文件名 / 函数名 / 路径 用 \`反引号\` 包裹

【输出格式】
- 直接输出转换后的完整 markdown。不要任何前后解释、不要写 "好的我帮你...", 不要 ${'`'}${'`'}${'`'}markdown 包裹。
- 仅在确实需要改动的地方加标记。如果某段已经合理，原样输出即可。`;

export interface BeautifyResult {
  markdown: string;
  rawResponse?: string;
}

export async function beautifyMarkdown(
  source: string,
  cfg: AIConfig,
  signal?: AbortSignal
): Promise<BeautifyResult> {
  const url = `${cfg.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const body = {
    model: cfg.model,
    temperature: 0.3,
    messages: [
      { role: 'system', content: BEAUTIFY_SYSTEM_PROMPT },
      { role: 'user', content: source },
    ],
    stream: false,
  };
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (cfg.apiKey) headers['Authorization'] = `Bearer ${cfg.apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI 请求失败 (${res.status}): ${text.slice(0, 200) || res.statusText}`);
  }

  const json = await res.json();
  const raw: string = json?.choices?.[0]?.message?.content ?? '';
  if (!raw) {
    throw new Error('AI 返回空内容，请检查 model 名是否正确');
  }
  return { markdown: stripCodeFence(raw), rawResponse: raw };
}

/**
 * 若模型 disobey 提示用 ```markdown 包裹返回，剥掉外层 fence。
 */
function stripCodeFence(s: string): string {
  const trimmed = s.trim();
  const m = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/);
  return m ? m[1].trim() : trimmed;
}
