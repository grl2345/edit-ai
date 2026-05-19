import { en } from '../i18n/locales/en';
import { zh } from '../i18n/locales/zh';
import type { Locale } from '../i18n/types';

/** 宣传稿内嵌海报路径（与 public/demo 一致） */
export const PROMO_POSTER_PATH = '/demo/markdown-ai-promo.png';

export const SAMPLE_MD_ZH = `# Markdown AI

> **AI 驱动的 Markdown 编辑器** · 官网 [markdown-text.com](https://www.markdown-text.com/)

## 不止于 Markdown，AI 让创作更智能

**智能创作 · 实时渲染 · 精美主题 · 效率倍增**

![Markdown AI 产品宣传海报：AI 驱动的 Markdown 编辑器，智能创作、实时渲染、精美主题、效率倍增](${PROMO_POSTER_PATH})

---

## 为什么选择 Markdown AI？

Markdown AI 不只是「写 Markdown」——它把 **AI 润色**、**实时所见即所得预览**、**多套精美主题** 和 **复杂排版能力** 装进一个在线编辑器里。写技术文档、运营推文、学习笔记、产品说明，都能更快出片、更好看。

---

## 四大核心能力

### 1. AI 智能助手

- **润色与优化**：优化句式、打磨表达，把草稿变成可直接发布的成稿。
- **灵感与结构**：保留你的原意，用 AI 重新整理 Markdown 层级，阅读节奏更清晰。
- **一键美化**：选中段落即可改写，不必在编辑器与聊天窗口之间来回切换。

### 2. 多主题样式

- **14 套版式**：海报、杂志、书籍、笔记本、极客、国风等，一键切换。
- **5 组配色 + 4 种字体**：栗原、朱砂、晴野等风格随心搭配。
- **深浅色模式**：写作与阅读场景自由切换。

### 3. 实时渲染预览

- **所见即所得**：左侧写 Markdown，右侧即时预览，专注内容而不是语法。
- **同步滚动**：长文编辑时，预览始终跟得上你的光标。
- **复制即用**：渲染结果可粘贴到公众号、知乎、飞书、Notion 等平台。

### 4. 灵活排版

- **表格、代码、引用、高亮** 自动渲染，复杂内容也能体面呈现。
- **TIP / 警告等卡片** 用简洁语法即可写出杂志级版式。
- **图片与图表** 友好展示，适合教程与产品说明。

---

## 编辑器能做什么？（效果示例）

### 主要特性一览

| 能力 | 说明 |
| --- | --- |
| AI 助手 | 润色、扩写、缩写、改语气 |
| 实时预览 | 边写边看，无需手动刷新 |
| 多主题 | 版式 + 配色 + 字体组合 |
| 导出分享 | 复制 HTML / 长图，便于分发 |

### 代码高亮示例

\`\`\`python
def greet(name: str) -> str:
    """Markdown AI — 专注创作，让 Markdown 更优雅。"""
    return f"Hello, {name}! 开启智能写作之旅 →"
\`\`\`

### 项目进度表示例

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| 实时渲染 | ✅ 已完成 | WYSIWYG 预览 |
| AI 润色 | ✅ 已完成 | 接入自定义 API |
| 主题库 | ✅ 持续更新 | 海报 / 杂志 / 书籍等 |
| 多语言 | ✅ 已完成 | 中文 / English |

> **专注创作，让 Markdown 更优雅。**
>
> — Markdown AI

---

## Markdown AI vs 传统 Markdown

| 维度 | Markdown AI | 传统 Markdown |
| --- | --- | --- |
| **渲染** | 实时预览，所见即所得 | 需手动预览，效率低 |
| **编辑** | AI 智能助手辅助润色 | 纯文本手写，费时费力 |
| **视觉** | 多套主题一键切换 | 界面单一、样式固定 |
| **排版** | 表格 / 代码 / 卡片友好 | 语法原始，阅读成本高 |

> [!TIP]
> 适合技术写作者、产品经理、运营与创作者：写文档、写推文、写教程，都能更快出片。

---

## 开启智能写作之旅

**更智能 · 更美观 · 更高效**

**Markdown AI，重新定义你的写作体验。**

👉 立即体验：**[https://www.markdown-text.com/](https://www.markdown-text.com/)**

---

下方开始编辑，把这篇宣传文案换成你自己的内容吧 👇
`;

export const SAMPLE_MD_EN = `# Markdown AI

> **AI-powered Markdown editor** · [markdown-text.com](https://www.markdown-text.com/)

## More than Markdown — AI makes creation smarter

**Smart writing · Live preview · Beautiful themes · 2× efficiency**

![Markdown AI product poster: AI-driven editor with live preview, themes, and smart writing](${PROMO_POSTER_PATH})

---

## Why Markdown AI?

Markdown AI is more than a text box. It combines **AI polish**, **live WYSIWYG preview**, **rich themes**, and **flexible layout** in one online editor — for docs, posts, notes, and product copy that ship faster and look better.

---

## Four core capabilities

### 1. AI assistant

- **Polish & refine**: Improve phrasing while keeping your voice.
- **Structure & flow**: Reformat Markdown hierarchy for clearer reading.
- **One-click beautify**: Rewrite selections without leaving the editor.

### 2. Multi-theme styling

- **14 templates**: Poster, magazine, book, notebook, geek, Chinese styles, and more.
- **5 palettes × 4 fonts**: Mix and match in one click.
- **Light / dark mode** for writing and reading.

### 3. Live preview

- **WYSIWYG**: Write on the left, preview instantly on the right.
- **Synced scrolling** on long documents.
- **Copy-ready output** for blogs, docs, and social posts.

### 4. Rich layout

- **Tables, code, quotes, highlights** render beautifully.
- **Callouts** (tips, warnings) with simple syntax.
- **Images & diagrams** for tutorials and product pages.

---

## What you can build (examples)

### Feature overview

| Capability | Description |
| --- | --- |
| AI assistant | Polish, expand, shorten, change tone |
| Live preview | Write and see results immediately |
| Themes | Template + palette + font combos |
| Share | Copy HTML or export for distribution |

### Code highlighting

\`\`\`python
def greet(name: str) -> str:
    """Markdown AI — focus on creation, make Markdown elegant."""
    return f"Hello, {name}! Start your smart writing journey →"
\`\`\`

### Status table

| Module | Status | Notes |
| --- | --- | --- |
| Live preview | ✅ Done | WYSIWYG |
| AI polish | ✅ Done | Custom API |
| Theme library | ✅ Ongoing | Poster, magazine, book… |
| i18n | ✅ Done | ZH / EN |

> **Focus on creation. Make Markdown elegant.**
>
> — Markdown AI

---

## Markdown AI vs traditional Markdown

| | Markdown AI | Traditional |
| --- | --- | --- |
| **Rendering** | Real-time WYSIWYG | Manual preview |
| **Editing** | AI-assisted polish | Plain text only |
| **Visuals** | Many themes | Single look |
| **Layout** | Tables, code, cards | Raw syntax |

> [!TIP]
> Built for developers, PMs, marketers, and creators.

---

## Start your smart writing journey

**Smarter · More beautiful · More efficient**

**Markdown AI — redefine how you write.**

👉 Try it now: **[https://www.markdown-text.com/](https://www.markdown-text.com/)**

---

Replace this promo with your own content below 👇
`;

/** @deprecated use getSampleMd */
export const SAMPLE_MD = SAMPLE_MD_ZH;

export function getSampleMd(locale: Locale): string {
  return locale === 'en' ? SAMPLE_MD_EN : SAMPLE_MD_ZH;
}

const FULL_PROMO_MARKER_ZH = '## 四大核心能力';
const FULL_PROMO_MARKER_EN = '## Four core capabilities';

const PROMO_DOC_TITLES = [
  'Markdown AI · 产品宣传',
  'Markdown AI · Product promo',
  'Markdown AI · 示例',
  'Markdown AI · Demo',
  'AI 不是魔法 · 示范',
] as const;

const PROMO_FOOTER_ZH = '下方开始编辑，把这篇宣传文案换成你自己的内容吧';
const PROMO_FOOTER_EN = 'Replace this promo with your own content below';

/** 是否为内置产品宣传示范（切换语言时会同步正文） */
export function isPromoSampleDoc(title: string, content: string): boolean {
  if (PROMO_DOC_TITLES.includes(title as (typeof PROMO_DOC_TITLES)[number])) {
    return true;
  }
  if (
    content.includes(PROMO_POSTER_PATH) &&
    (content.includes(FULL_PROMO_MARKER_ZH) ||
      content.includes(FULL_PROMO_MARKER_EN))
  ) {
    return true;
  }
  if (
    content.includes(PROMO_FOOTER_ZH) ||
    content.includes(PROMO_FOOTER_EN)
  ) {
    return true;
  }
  return false;
}

export function syncPromoDocsForLocale<T extends {
  type: string;
  title: string;
  content?: string;
  updatedAt: number;
}>(
  nodes: T[],
  locale: Locale
): T[] {
  const msg = locale === 'en' ? en : zh;
  const promo = getSampleMd(locale);
  let changed = false;
  const next = nodes.map((n) => {
    if (n.type !== 'doc' || !isPromoSampleDoc(n.title, n.content ?? '')) return n;
    if (n.title === msg.doc.sampleTitle && n.content === promo) return n;
    changed = true;
    return { ...n, title: msg.doc.sampleTitle, content: promo, updatedAt: Date.now() };
  });
  return changed ? next : nodes;
}

/** 判断是否为需升级的旧示范文档（不含用户已改过的完整宣传稿） */
export function isLegacySampleDoc(title: string, content: string): boolean {
  const hasFullPromo =
    content.includes(PROMO_POSTER_PATH) &&
    (content.includes(FULL_PROMO_MARKER_ZH) ||
      content.includes(FULL_PROMO_MARKER_EN));
  if (hasFullPromo) return false;

  const legacyTitles = [
    'Markdown AI · 示例',
    'Markdown AI · Demo',
    'AI 不是魔法 · 示范',
  ];
  if (legacyTitles.includes(title)) return true;

  const legacyMarkers = [
    '# Markdown AI · 在线渲染',
    '# Markdown AI · Live Preview',
    '把这段宣传文案替换成你自己的内容',
    'Replace this with your own content',
    'Replace this promo with your own content',
  ];
  if (legacyMarkers.some((m) => content.includes(m))) return true;

  if (content.trimStart().startsWith('# Markdown AI')) return true;

  return false;
}
