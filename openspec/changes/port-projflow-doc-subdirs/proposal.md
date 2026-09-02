# Proposal: 文档子目录体系（移植自 ProjFlow）

## Why

InternWiki 文档列表目前是平铺的（velite glob `interns/*/docs/**/*.md` 能扫子目录，但 slug transform 压平为文件名，子目录会撞名）。数字人文档系列将有 8 篇 + 未来持续增长，需要子目录分组与折叠侧边栏。

来源：~/ProjFlow（已确认最新）commit 046d35d（子目录扫描 + frontmatter id 排序）+ 8db8272（侧边栏子目录折叠展开）。

## What Changes

- Velite docs collection 的 slug transform 保留相对路径（子目录 slug 含 `/`），避免同名冲突
- frontmatter 可选 `id` 字段：升序排前；无 id 按 date 降序排后
- 文档侧边栏组件：按 slug 路径构建树形结构，`expandedFolders` Set 管理折叠态，当前文档的父级目录自动展开

## Capabilities

### New Capabilities
- `docs-subdirs`: 文档支持子目录组织、路径化 slug、id 排序与树形折叠侧边栏

### Modified Capabilities
<!-- 无 -->

## Impact

- 修改：`apps/web/velite.config.ts`（slug transform）、docs 侧边栏组件（ReportPages.tsx 或独立组件）
- 现有平铺文档不受影响（无子目录时行为不变）
- 是 add-digital-human-basics-doc 的弱前置（文档多后按主题分目录更清晰，但平铺也可运行）
