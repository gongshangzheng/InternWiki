## ADDED Requirements

### Requirement: Render standard LaTeX math delimiters
The Markdown renderer SHALL render inline `$...$` and display `$$...$$` math with locally bundled KaTeX while preserving non-math Markdown rendering.

#### Scenario: Render Avatar Forcing display formula
- **WHEN** a document contains `$$z = z_S + \mathbf{m}_S \in \mathbb{R}^{512}$$`
- **THEN** the document displays a KaTeX block formula rather than the delimiter source text

#### Scenario: Render inline formula
- **WHEN** a document contains an inline `$\lambda = 0.1$` formula
- **THEN** the formula renders inline without breaking surrounding Chinese text

### Requirement: Support blog-compatible math delimiters
The Markdown renderer SHALL normalize `\(...\)` to inline math and `\[...\]` to display math before parsing, without changing code examples.

#### Scenario: Render blog block delimiter
- **WHEN** a document contains `\[x^2 + y^2 = z^2\]` outside a code block
- **THEN** the expression renders as a display formula

#### Scenario: Preserve code delimiter example
- **WHEN** a fenced or inline code span contains `\[...\]` or `\(...\)`
- **THEN** the source text remains unchanged as code

### Requirement: Keep formulas readable and constrained
The renderer SHALL keep KaTeX in untrusted mode, inherit application text color, and allow horizontally scrolling oversized display formulas.

#### Scenario: Render long display formula on narrow viewport
- **WHEN** a display formula exceeds the available content width
- **THEN** the formula container scrolls horizontally without expanding the page layout

#### Scenario: Reject trust-only LaTeX behavior
- **WHEN** a formula uses a trust-required KaTeX command
- **THEN** KaTeX does not execute or inject trusted HTML behavior

### Requirement: Preserve existing Markdown integrations
Adding math rendering SHALL preserve Mermaid rendering, wiki links, GFM tables and task lists, code highlighting, and existing raw HTML behavior.

#### Scenario: Render formula alongside Mermaid and wiki link
- **WHEN** a document contains a math formula, a Mermaid block, and `[[project:digital-human]]`
- **THEN** the formula renders with KaTeX, the Mermaid block renders as SVG, and the project link resolves to the intern project route
