## Why

InternWiki 的 MarkdownView 目前不会解析 LaTeX 数学分隔符，数字人文档中的 `$$z = z_S + \mathbf{m}_S \in \mathbb{R}^{512}$$` 只能显示为源码。博客站已经使用 MathJax 渲染公式；InternWiki 需要本地、快速且不依赖 CDN 的公式支持。

## What Changes

- 在 `apps/web` 增加 KaTeX、`remark-math`、`rehype-katex` 依赖
- MarkdownView 支持行内 `$...$` 与块级 `$$...$$` 公式
- 预处理博客常用的 `\(...\)`、`\[...\]` 分隔符，使迁入文档无需重写
- 引入 KaTeX CSS，并为明暗主题与超宽块级公式提供可读性和横向滚动样式
- 保留现有 GFM、Mermaid、wiki 内链、代码块和原始 HTML 渲染行为
- KaTeX 保持 `trust: false`，不启用信任型 LaTeX HTML 宏

## Capabilities

### New Capabilities
- `markdown-math-rendering`: InternWiki Markdown 渲染行内与块级 LaTeX 数学公式，并兼容博客数学分隔符

### Modified Capabilities
<!-- 无现有主规范 -->

## Impact

- 修改：`apps/web/package.json`、根 `pnpm-lock.yaml`、`apps/web/src/components/MarkdownView.tsx`、`apps/web/src/index.css`
- 依赖：KaTeX、remark-math、rehype-katex
- 验证现有 Avatar Forcing 数学公式，并确认 Mermaid、内链、代码块未回归
