## 1. 依赖与基础设施

- [ ] 1.1 `pnpm add mermaid remark-math rehype-katex katex`（web 工作区）
- [ ] 1.2 确认 `pnpm build` 依赖安装后无类型冲突

## 2. KaTeX 公式渲染

- [ ] 2.1 `MarkdownView.tsx`：react-markdown 注册 `remarkPlugins: [remarkGfm, remarkMath]`、`rehypePlugins: [...rehypeKatex]`
- [ ] 2.2 引入 `katex/dist/katex.min.css`，确认亮/暗主题下公式颜色可读（必要时加 CSS 变量覆盖 color）

## 3. Mermaid 渲染

- [ ] 3.1 `code` 组件拦截 `language-mermaid`：输出 `<pre class="mermaid">`（转义文本），父级 `pre` 不再走语法高亮路径
- [ ] 3.2 新增 effect：容器内存在 `pre.mermaid` 时动态 `import('mermaid')`，`initialize({ startOnLoad:false, theme: isDark?'dark':'default', securityLevel:'loose' })` 后 `mermaid.run({ nodes })`
- [ ] 3.3 重渲染处理：仿 ProjFlow 用 `dataset.source` 缓存原始代码，主题切换/内容变化时重置 `data-processed` 后重跑
- [ ] 3.4 错误降级：`try/catch` + `console.warn`，失败块保留代码原文展示

## 4. 样式与主题

- [ ] 4.1 `pre.mermaid` 容器样式（居中、溢出滚动、亮暗背景适配）
- [ ] 4.2 验证暗色模式下图表对比度

## 5. 验证

- [ ] 5.1 `pnpm content:build` + `pnpm typecheck` 通过
- [ ] 5.2 `pnpm dev` 实测：汤问的《5分钟认识数字人》（mermaid + 表格 + `[[project:...]]`）、《Ditto_模型精读》（块级+行内公式 + mermaid + 图片）、《Avatar_Forcing_模型精读》（公式 + 图片）渲染正确
- [ ] 5.3 回归：alice 既有日报/文档渲染不变；亮暗切换后 mermaid 重渲染
- [ ] 5.4 `pnpm build` 通过，确认 mermaid 为独立异步 chunk
