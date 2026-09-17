# Proposal: InternWiki 支持 Mermaid 图表渲染

## Why

InternWiki 的 MarkdownView 目前把 ` ```mermaid ` 代码块当普通代码渲染（SyntaxHighlighter 高亮）。已合并的 junjiawang 文档（VoiceAgent 系列）里已有多处 mermaid 块，只能看源码；即将撰写的数字人文档系列（add-digital-human-basics-doc）也需要 mermaid 画模型管线图。

参考实现：~/ProjFlow（已确认最新，mermaid ^11.16.0）——markdown-it fence 拦截 + `mermaid.run({ nodes })` + 主题切换时重渲染 + 失败 console.warn 降级。ProjFlow 还有一份 mermaid 语法速查表（`.claude/skills/documentation/references/mermaid-cheatsheet.md`）可吸收进本仓库 skill。

## What Changes

- `apps/web` 添加 `mermaid` 依赖（^11.16.0，与 ProjFlow 对齐）
- `MarkdownView.tsx`：CodeBlock 拦截 `language-mermaid` → 渲染 `<MermaidBlock>` 组件
- MermaidBlock：`mermaid.initialize({ startOnLoad: false, theme: dark?dark:default, securityLevel: 'loose', fontFamily })` + useEffect 调 `mermaid.render()` 产出 SVG，主题切换重渲染；解析失败显示源码降级（不整页崩溃）
- 验证：junjiawang 现有文档中的 mermaid 块在 dev server 中正确渲染

## Capabilities

### New Capabilities
- `mermaid-rendering`: 文档中 ` ```mermaid ` 代码块渲染为图表，响应明暗主题

### Modified Capabilities
<!-- 无 -->

## Impact

- 修改：`apps/web/package.json`（+mermaid）、`apps/web/src/components/MarkdownView.tsx`
- 纯前端渲染层改动，不影响 Velite 内容管线、路由、数据结构
- add-mermaid-support 是 add-digital-human-basics-doc 的前置 change（后者文档中要写 mermaid 图）
