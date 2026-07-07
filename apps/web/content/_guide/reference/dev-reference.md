---
title: 开发参考
slug: dev-reference
category: 附录
order: 7
summary: 开发命令速查、分支与提交规范、技术栈概览。
---

## 开发命令速查

```bash
pnpm dev              # 启动开发服务器 (端口 5180)
pnpm build            # 构建生产版本
pnpm content:build    # 仅编译 Velite 内容
pnpm typecheck        # 类型检查
pnpm report help      # 查看 report CLI 帮助
pnpm task help        # 查看 task CLI 帮助
pnpm project help     # 查看 project CLI 帮助
pnpm setting help     # 查看 setting CLI 帮助
```

---

## 环境配置

在 `apps/web/.env` 中配置环境变量（该文件被 .gitignore 忽略，不会提交）。可参考 `.env.example` 了解可用变量。

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_DEFAULT_INTERN` | 默认实习生 slug，日历等页面未指定 `?intern=` 时自动选中 | `alice` |

设置默认实习生最简单的方式是使用 CLI 命令：

```bash
pnpm setting set-default --intern alice
```

这会自动写入 `VITE_DEFAULT_INTERN=alice` 到 `.env` 文件。修改后重启 dev server 生效。

---

## 分支与提交规范

### 分支策略

1. **在自己的分支上工作**：`intern-你的名字`
2. 定期从 main 拉取最新代码，避免冲突
3. 内容稳定后可以提 PR 合并到 main

### 提交信息规范

提交信息用中文，简洁明了：

- `日报 2026-07-07`
- `周报 W27`
- `添加搜索引擎任务`
- `修复日历事件颜色 bug`

---

## 技术栈

- **构建**: Vite 6 + Velite（Markdown → 类型化 JSON）
- **框架**: React 19 + React Router v7
- **样式**: Tailwind v4（CSS 变量主题）
- **日历**: FullCalendar 6
- **CLI**: Node.js ESM 脚本（report / project / task / setting）

---

## 更多资源

- [项目 README](https://github.com/gongshangzheng/InternWiki) — 完整项目说明
- [SKILL.md](https://github.com/gongshangzheng/InternWiki/blob/main/SKILL.md) — 框架使用文档
- [团队共享文档](/shared) — 入职指南、编码规范等
