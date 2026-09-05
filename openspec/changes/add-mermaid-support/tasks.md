# Tasks: Mermaid 支持

## 1. 实现

- [x] 1.1 `apps/web` 安装 mermaid ^11.16.0
- [x] 1.2 MarkdownView.tsx：CodeBlock 拦截 language-mermaid，新增 MermaidBlock 组件（initialize + render + 主题响应 + 失败降级）
- [x] 1.3 typecheck 通过

## 2. 验证

- [x] 2.1 dev server 打开 junjiawang 含 mermaid 的文档（voice-agent-config-inheritance 等），确认图表渲染
- [x] 2.2 明暗主题切换图表重渲染
- [x] 2.3 写一个语法错误的 mermaid 块验证降级不崩溃
