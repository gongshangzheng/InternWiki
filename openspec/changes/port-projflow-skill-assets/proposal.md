# Proposal: 移植 ProjFlow Skill 资产（mermaid 速查 + 文档写作规范 + 设计公约）

## Why

ProjFlow 的 `.claude/skills/` 有三份通用 skill 资产，与项目耦合低，可直接为 InternWiki 复用：

1. `documentation/SKILL.md`——文档写作规范（与 internwiki-reports skill 互补，重点是写作方法论而非 CLI）
2. `documentation/references/mermaid-cheatsheet.md`——mermaid 语法速查（中文节点名陷阱、常用图型模板），add-mermaid-support 落地后立即有用
3. `design-principles/SKILL.md`——UI/UX 设计公约 11 条（状态色、空状态、加载/分页），裁剪掉训练平台专属的 dataset-page/media-covers

## What Changes

- 从 ~/ProjFlow 复制三份文件到 `.agents/skills/internwiki-reports/references/`（mermaid 速查 + 文档写作要点）与 `.agents/skills/internwiki-overview/references/`（设计公约，或独立 skill）
- 路径引用与语法糖改写为 InternWiki 约定（`[[project:slug]]` 而非 `[[proj#task]]`、velite 路径等）
- design-principles 裁剪：保留通用 UI 公约，移除 dataset/训练相关 references

## Capabilities

### New Capabilities
- `skill-assets`: mermaid 速查、文档写作方法论、UI 设计公约的 skill 参考

### Modified Capabilities
<!-- 无 -->

## Impact

- 新增：2-3 个 references md 文件（纯文档，无代码）
- 依赖：mermaid 速查的实际使用依赖 add-mermaid-support 先落地
