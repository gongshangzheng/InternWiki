---
name: internwiki-run
description: 启动、验证并截图 InternWiki 前端开发服务器。触发词：运行前端、启动开发服务器、pnpm dev、开前端、run、screenshot app。Use when launching the InternWiki dev server, verifying it is up, or taking a screenshot of the running app.
---

# InternWiki 前端运行指南

## 快速启动

```bash
# 确认 5183 端口未被占用
lsof -ti :5183

# 若有占用，先查明进程再决定是否 kill
ps -p $(lsof -ti :5183) -o pid,command

# 启动开发服务器（固定端口 5183，strictPort=true，不会 fallback）
pnpm dev
```

访问地址：**http://localhost:5183/InternWiki/**

## 端口约定

| 项目 | 端口 |
|------|------|
| InternWiki | **5183** |

- `vite.config.ts` 中已设置 `port: 5183, strictPort: true`
- 若 5183 被占用，Vite 会报错退出（不会静默 fallback），此时需手动释放端口

## 验证服务器已就绪

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5183/InternWiki/
# 期望返回 200
```

## 配套脚本

位于 `scripts/check-server.mjs`（通过 `.agents/skills/internwiki-run/scripts/check-server.mjs` 访问）：

```bash
# 检查服务器是否在线（exit 0 = 在线，exit 1 = 未运行）
node .agents/skills/internwiki-run/scripts/check-server.mjs

# 启动后等待就绪（最多 30 秒轮询）
node .agents/skills/internwiki-run/scripts/check-server.mjs --wait

# 指定其他端口
node .agents/skills/internwiki-run/scripts/check-server.mjs --port 5183
```

纯 Node.js 标准库，无需安装依赖。

## 常见问题

### 端口被其他项目占用

```bash
# 查看占用进程
lsof -ti :5183 | xargs ps -o pid,command -p

# 确认是无关进程后 kill
kill <PID>

# 重新启动
pnpm dev
```

### 内容没有热更新

- Markdown 内容（日报/周报/文档）通过 Velite 编译，`pnpm dev` 下有热重载
- `tasks.json` 由 Vite 插件直接 serve，修改即时生效，无需重启

### 构建产物预览

```bash
pnpm build    # velite build + tsc + vite build
pnpm preview  # 预览 dist/，端口同为 5183
```

## 其他开发命令

```bash
pnpm content:build  # 仅重新编译 Velite 内容（不启动服务器）
pnpm typecheck      # TypeScript 类型检查
pnpm lint           # ESLint 检查
```
