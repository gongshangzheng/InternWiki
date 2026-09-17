## Context

- 当前渲染链路：Velite 只存 `body: s.raw()`，前端 `MarkdownView.tsx` 用 react-markdown（+ remark-gfm、rehype-raw、react-syntax-highlighter）渲染。
- 站内已有亮/暗双主题（`:root` / `.dark` CSS 变量），导航栏可切换。
- 参考实现：`~/ProjFlow/web/src/components/common/MarkdownRenderer.vue`（Vue + markdown-it）——mermaid 11.x，fence 重定向为 `<pre class="mermaid">`，挂载后 `mermaid.initialize({ startOnLoad:false, theme, securityLevel:'loose' })` + `mermaid.run({ nodes })`，内容或主题变化时以 `dataset.source` 缓存源码重渲染，异常 `console.warn` 降级保留代码原文。该实现已在生产使用，方案成熟。
- 迁移文档特点：mermaid 代码内含中文节点文案；公式有行内 `$...$`（含 `\mathbf` 等）与块级 `$$...$$`；同一文档多个 mermaid 块（最多 2 个/篇）。

## Goals / Non-Goals

**Goals:**

- mermaid 块 → SVG，失败降级为代码原文
- `$...$` / `$$...$$` → KaTeX 排版
- 主题跟随亮/暗模式，切换时重渲染 mermaid
- 不回归既有能力（GFM、高亮、wiki 链接、图片、TOC）

**Non-Goals:**

- 不改 Velite 内容管线与 schema
- 不支持其他图表语法（plantuml 等）
- 不做公式的服务端预渲染
- 不处理 mermaid 点击交互（securityLevel 保持非 strict 即可，不引入回调）

## Decisions

1. **mermaid 集成方式沿用 ProjFlow 的"DOM 后处理"而非 react 组件包装**
   react-markdown 的 `code` 组件只负责把 `language-mermaid` 块输出为 `<pre class="mermaid">`（内容转义）；真正的渲染在一个 `useEffect` 里对容器内 `pre.mermaid` 节点执行 `mermaid.run()`。理由：与参考实现同构，重渲染/主题切换/错误降级逻辑可直接平移；避免为每个图建 React 状态机。依赖数组 `[html, isDark]` 对应 ProjFlow 的 `watch([rendered, isDark])`。
2. **mermaid 动态 import（`await import('mermaid')`）**
   mermaid 11 全量约 1MB+ gzip，静态引入会拖慢首屏。仅当页面存在 `pre.mermaid` 节点时才加载。ProjFlow 是管理后台静态引入；InternWiki 是公开站点，需要按需加载。
3. **公式用 remark-math + rehype-katex**
   标准组合，`singleDollarTextMath` 默认开启（文档大量使用单 `$` 行内公式）。KaTeX CSS 从 `katex/dist/katex.min.css` 引入，字体经 Vite 打包自动带 hash，无需手动处理 public。备选 MathJax 体积极大且渲染慢，弃。
4. **代码块内的 `$` 与 mermaid 关键字不受影响**
   remark-math 默认跳过 code/inlineCode；`code` 组件拦截仅匹配 `className` 含 `language-mermaid` 的块，其余块走原 react-syntax-highlighter 路径。
5. **主题侦测复用站内现有暗色判定**（`MarkdownView` 所在布局已有的 `.dark` class 判定），不引入新状态源；`mermaid.initialize` 每次主题切换后重新调用（ProjFlow 同款做法，initialize 幂等）。
6. **Vite 构建拆分**：mermaid 动态 import 自动生成独立 chunk；无需 manualChunks 强拆。

## Risks / Trade-offs

- **bundle 增大**：mermaid chunk 仅按需加载，公式页多一次 katex 资源；可接受。
- **react-markdown 输出 `pre>code` 嵌套**：拦截时需把 `code.language-mermaid` 的父级 `pre` 一并替换为 `pre.mermaid`，注意别产生非法嵌套（`pre` 内不得再包 `div`，SVG 由 mermaid.run 注入，无此问题）。
- **mermaid 中文/括号节点语法**：`U[用户输入\n语音/文本]` 等写法在 mermaid 11 下正常；个别旧语法若渲染失败走降级路径，不影响阅读。
- **KaTeX 不支持的 LaTeX 命令**：文档公式为常见宏（`\mathbf`、`\boldsymbol`、`\mathbb`、`\hat`），KaTeX 全支持；未知命令会显示红色报错文本，属可接受降级。
