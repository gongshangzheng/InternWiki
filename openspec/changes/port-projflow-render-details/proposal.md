# Proposal: 渲染细节微调（移植自 ProjFlow）

## Why

两处小的渲染问题，ProjFlow 已有成熟解法（commit 23da4dd + c58121c），InternWiki 直接移植：

1. 文档 body 里若写了 `# 标题`，会与页面头部标题重复显示——ProjFlow 用一行正则去掉 body 中的 h1
2. markdown 正文链接缺主题色与 hover 下划线，可读性差——ProjFlow 补了 9 行 CSS

## What Changes

- MarkdownView 或文档页入口：`body.replace(/^# .+\n*/gm, '')` 去 h1（仅文档页，报告页保持现状——需确认报告页是否同样处理）
- markdown body 链接样式：主题色 + hover 下划线

## Capabilities

### New Capabilities
- `md-render-polish`: 文档页去重复 h1 + 链接主题色样式

### Modified Capabilities
<!-- 无 -->

## Impact

- 修改：`apps/web/src/components/MarkdownView.tsx`（或调用处）+ 对应 CSS
- 零风险，纯展示层
