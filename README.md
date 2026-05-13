# Markdown AI

一个把 [xiaogao-ai.com](https://xiaogao-ai.com) 的配色 / 字体 / 排版抽出来做的 Markdown 在线渲染工具。

- 中文衬线字体：霞鹜文楷
- 主色 `#c44b2b` 朱砂红 + 米色纸面 `#f6f3ed`
- 代码块沿用站点 terminal-dark 配色

## 功能

- 左编辑右预览，实时渲染
- 代码语法高亮 (highlight.js)
- 一键导出独立 HTML（样式内嵌，可独立打开）
- 复制富文本到剪贴板（直接粘公众号 / 飞书 / Notion）
- 深色 / 浅色主题切换
- 移动端编辑 / 预览切换

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

产物在 `dist/`，可直接部署到 GitHub Pages / Vercel / Cloudflare Pages。

## 部署到 GitHub Pages

```bash
npm run build
# 把 dist/ 推到 gh-pages 分支即可
```

`vite.config.ts` 中 `base: './'` 已设为相对路径，子目录部署也能正常工作。
