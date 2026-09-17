## ADDED Requirements

### Requirement: Mermaid 代码块渲染为图表

Markdown 正文中的 ` ```mermaid ` 围栏代码块 MUST 渲染为 mermaid 图表（SVG），而非原始代码文本。

#### Scenario: 渲染 flowchart

- **WHEN** 报告包含合法的 ` ```mermaid ` 代码块（如 flowchart LR）
- **THEN** 页面在该位置显示渲染后的图表，代码文本不可见
- **AND** 同一报告中的多个 mermaid 块全部渲染

#### Scenario: 非法 mermaid 语法降级

- **WHEN** mermaid 代码存在语法错误、无法渲染
- **THEN** 页面不崩溃，该代码块以可读的代码形式展示（保留原文），报告其余内容正常渲染

### Requirement: LaTeX 数学公式渲染

Markdown 正文中的行内公式 `$...$` 与块级公式 `$$...$$` MUST 渲染为数学排版。

#### Scenario: 行内公式

- **WHEN** 正文包含 `$\mathbf{m}=\{\delta,R,t\}$`
- **THEN** 显示为排版后的数学符号，`$` 定界符不可见

#### Scenario: 块级公式

- **WHEN** 正文包含 `$$...$$` 独立公式块
- **THEN** 显示为居中/独立成行的数学排版

#### Scenario: 代码块与行内代码不受影响

- **WHEN** `$...$` 或 mermaid 语法出现在普通代码块或行内代码中
- **THEN** 原样显示，不做公式解析或图表渲染

### Requirement: 渲染主题跟随站内亮暗模式

mermaid 图表配色 MUST 跟随站内亮/暗模式切换（`:root` / `.dark`），保证暗色模式下图表可读。

#### Scenario: 暗色模式下渲染

- **WHEN** 站内处于暗色模式时查看含 mermaid 图的报告
- **THEN** 图表使用暗色主题渲染，文字与背景对比度可读

#### Scenario: 模式切换后更新

- **WHEN** 用户在报告页切换亮/暗模式
- **THEN** 页面上的 mermaid 图表以对应主题重新渲染

### Requirement: 渲染不破坏既有 Markdown 能力

新增渲染 MUST NOT 影响既有行为：GFM 表格、代码高亮、wiki 链接（`[[project:...]]`）、`/InternWiki/` 前缀图片、标题 TOC 锚点。

#### Scenario: 回归

- **WHEN** 查看不含 mermaid/公式的既有报告
- **THEN** 表格、代码高亮、内链、图片、TOC 行为与改动前一致
