## 1. Math rendering integration

- [x] 1.1 Add `katex`, `remark-math`, and `rehype-katex` to `apps/web`
- [x] 1.2 Add math plugins and safe KaTeX options to `MarkdownView`
- [x] 1.3 Normalize `\(...\)` and `\[...\]` outside fenced and inline code
- [x] 1.4 Import KaTeX CSS and add theme/color/overflow styles

## 2. Verification

- [x] 2.1 Run content build and typecheck
- [x] 2.2 Verify existing Avatar Forcing `$...$` and `$$...$$` formulas in a browser
- [x] 2.3 Verify blog delimiters, Mermaid, wiki links, and code delimiter examples render without regression
