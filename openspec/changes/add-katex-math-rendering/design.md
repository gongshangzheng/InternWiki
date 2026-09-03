## Context

InternWiki 的 `MarkdownView` 使用 `react-markdown`、`remark-gfm`、`rehype-raw`，但没有数学 AST 解析或公式渲染器，因此 `$...$` 和 `$$...$$` 保持文本形式。博客站使用 MathJax 3 SVG 并在带 `mathjax:true` 的文章中运行时加载；InternWiki 是 Vite 静态前端，应避免增加外部 CDN 依赖。

现有 Markdown 链还必须保留 Mermaid、wiki 内链预处理、GFM 表格/任务列表、代码块和主题切换。

## Goals / Non-Goals

**Goals:**
- 本地渲染行内 `$...$` 与块级 `$$...$$` LaTeX。
- 兼容博客已有的 `\(...\)` 与 `\[...\]` 分隔符。
- 在深浅主题中清晰显示，超宽块级公式可横向滚动。
- 保持 KaTeX `trust: false`，不启用 LaTeX 产生任意 HTML 的能力。
- 不破坏 Mermaid、代码块、GFM 与 wiki 内链。

**Non-Goals:**
- 不完整复刻 MathJax 的所有 TeX 宏与扩展。
- 不在构建期预渲染公式。
- 不迁移现有文档公式语法。
- 不在本 change 中调整 `rehype-raw` 的既有信任模型。

## Decisions

### 使用 KaTeX 而非 MathJax

采用 `remark-math` + `rehype-katex` + `katex`。KaTeX 随前端依赖打包，不需要博客当前 MathJax 方案的 CDN/运行时注入，适合内容量较小的静态知识库，首屏与离线行为更可控。

替代方案 MathJax 3 SVG 的 TeX 兼容性更广、与博客一致，但运行时体积与加载复杂度更高；构建期渲染会侵入 Velite 内容管线，超出需求。

### 在 Markdown AST 阶段渲染数学

`MarkdownView` 在现有预处理（wiki 链接、习惯标签）之后使用 `remarkMath` 生成数学节点，`rehypeKatex` 输出 KaTeX HTML。KaTeX CSS 作为应用样式依赖导入。

使用 `{ trust: false, throwOnError: false }`：不信任型 LaTeX 宏不被执行；不支持的公式显示错误样式而不让整篇文档崩溃。

### 兼容博客分隔符

在现有预处理流程新增轻量、代码保护的分隔符转换：
- `\[ ... \]` → `$$ ... $$`
- `\( ... \)` → `$ ... $`

转换必须跳过 fenced code block 和 inline code，防止示例代码被改写。KaTeX 原生处理 `$...$`、`$$...$$`。

### 公式样式

保留 KaTeX 默认 CSS；在 `index.css` 增加颜色继承和 `.katex-display` 横向滚动，使公式在窄侧栏或移动端不撑破页面。无需为深浅主题维护两套公式资源。

## Risks / Trade-offs

- [KaTeX 不支持少数 MathJax/TeX 扩展] → 保持 `throwOnError: false`，对需要完整 MathJax 扩展的文章后续单独评估。
- [美元符号被误识别为数学] → 仅由 `remark-math` 按 Markdown 数学规则解析；文档写价格或代码时使用转义或反引号。
- [分隔符转换误改代码] → 复用代码片段保护逻辑，只转换非代码片段。
- [`rehype-raw` 已存在的 HTML 风险] → 本 change 不扩大该信任边界；KaTeX 保持 `trust: false`。

## Migration Plan

1. 安装依赖并接入插件与样式。
2. 在现有 Avatar Forcing 文档验证 `$...$`、`$$...$$`。
3. 新增或临时内容验证 `\(...\)`、`\[...\]`。
4. 浏览器检查公式、Mermaid、代码块、内链与明暗主题。
5. 失败时移除数学插件与依赖即可回滚，原 Markdown 公式源码保持不变。

## Open Questions

- 当前无阻塞问题。若后续出现 KaTeX 不支持的博客公式，再评估按文章引入 MathJax 兼容层。