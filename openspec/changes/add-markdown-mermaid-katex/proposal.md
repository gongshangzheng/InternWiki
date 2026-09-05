## Why

汤问迁移进来的 20 篇数字人文档大量使用 mermaid 图表（17 篇、26 个块）和 LaTeX 公式（4 篇、10+ 处 `$...$` / `$$...$$`），当前 `MarkdownView` 只用 react-markdown + rehype-raw 渲染，代码块原样显示为文本、公式显示为原始 TeX 源码，文档可读性严重受损。

## What Changes

- 新增 mermaid 图表渲染：` ```mermaid ` 代码块在报告中渲染为 SVG 图（参考 `~/ProjFlow/web` 的 `MarkdownRenderer.vue` 成熟实现：mermaid 11.x + 代码块重定向 + 渲染后处理）。
- 新增 LaTeX 数学公式渲染：行内 `$...$` 与块级 `$$...$$` 经 remark-math + rehype-katex 渲染为 KaTeX，引入 katex 字体 CSS。
- mermaid 主题跟随站内亮/暗模式（InternWiki 有 `.dark` 切换，ProjFlow 同款问题已处理）。
- 不改动 Velite 内容管线（body 为 raw markdown，渲染完全在前端 MarkdownView 层完成）。

## Capabilities

### New Capabilities

- `markdown-rendering`: 站内 Markdown 报告/文档的富渲染能力（mermaid 图表、KaTeX 公式）及其降级行为。

### Modified Capabilities

（无 —— 现有 specs 未定义 Markdown 渲染相关需求）

## Impact

- **代码**：`apps/web/src/components/MarkdownView.tsx`（react-markdown 的 code 组件拦截 mermaid 块 + remarkPlugins/rehypePlugins 注册）、`apps/web/src/lib/markdown.ts`（可选：wiki 链接预处理不受影响）。
- **依赖**：新增 `mermaid@^11`、`remark-math`、`rehype-katex`、`katex`（CSS + 字体资源，经 Vite 打包）。
- **构建**：mermaid 体积较大，需关注 vite chunk 拆分（mermaid 动态 import 或 manualChunks）。
- **不受影响**：Velite schema、内容文件、路由、tasks.json 管线。
