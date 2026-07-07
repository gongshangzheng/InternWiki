# InternWiki 实现计划

## Context

团队需要一个多人实习文档平台，每个实习生有独立的项目空间，可以保存日报、周报、文档和项目任务。参考了 `gongshangzheng.github.io`（自定义 Node.js 静态站点生成器，支持 PDF 展示、短代码、增量构建）和 `lifeOS`（项目管理功能：日报/周报层级体系、任务树、习惯追踪、日历集成），从头构建一个融合两者优势的平台。

**核心原则**：纯 Markdown 文件 + 自定义 Node.js SSG → 编译为 HTML 静态页面，不使用 React/Vue 等前端框架。

---

## 第一阶段：项目骨架 + 核心 SSG

### 1.1 目录结构

```
InternWiki/
├── content/                    # 内容源（Markdown + JSON）
│   ├── _shared/                # 团队共享内容
│   │   ├── onboarding/         # 入职指南
│   │   └── standards/          # 编码/写作规范
│   ├── interns/                # 实习生空间
│   │   └── {name}/
│   │       ├── profile.md      # 个人信息（frontmatter 元数据）
│   │       ├── daily/          # 日报 (YYYY-MM-DD.md)
│   │       ├── weekly/         # 周报 (YYYY-Www.md)
│   │       ├── projects/       # 项目（每个含 tasks.json + 文档）
│   │       └── docs/           # 知识库文档
│   └── config.yml              # 站点配置（标题、导航、实习生列表）
├── src/templates/              # HTML 模板
│   ├── base.html               # 基础布局（HTML 骨架）
│   ├── article.html            # 文章/报告模板
│   ├── intern-home.html        # 实习生主页（仪表盘）
│   ├── listing.html            # 列表页模板（日报列表、文档列表）
│   ├── index.html              # 首页模板（实习生目录）
│   ├── _nav.html               # 导航栏
│   ├── _toc.html               # 目录侧边栏
│   └── _footer.html            # 页脚
├── lib/                        # 构建系统模块
│   ├── build.js                # 主构建管线（编排 9 个阶段）
│   ├── config.js               # 路径和配置常量
│   ├── parser.js               # Frontmatter 解析 + Mustache 模板引擎
│   ├── markdown.js             # marked 封装 + 短代码预处理
│   ├── shortcode.js            # 短代码注册表（PDF/Mermaid/Alert 等）
│   ├── toc.js                  # TOC 从 headings 自动提取
│   ├── tasks.js                # 任务树加载 + 级联完成逻辑
│   ├── habits.js               # 习惯追踪（从日报 - [x] #tag 提取）
│   ├── search.js               # 搜索索引生成（含拼音索引）
│   ├── cache.js                # 增量构建缓存（SHA1 文件哈希）
│   ├── css.js                  # CSS 模块打包（always/optional）
│   ├── generator.js            # 页面生成器（文章、列表、目录）
│   └── server.js               # 开发服务器 + WebSocket LiveReload
├── assets/
│   ├── css/
│   │   ├── always/             # 始终加载的样式
│   │   │   ├── variables.css   # CSS 变量和主题色
│   │   │   ├── base.css        # 基础排版和重置
│   │   │   └── nav.css         # 导航栏样式
│   │   └── optional/           # 按需加载的样式
│   │       ├── calendar.css    # 日历组件
│   │       ├── pdf.css         # PDF 查看器
│   │       └── search.css      # 搜索弹窗
│   ├── js/
│   │   ├── search.js           # 客户端模糊搜索
│   │   ├── toc.js              # 目录滚动高亮
│   │   ├── theme.js            # 暗/亮模式切换
│   │   └── livereload.js       # 开发模式 WebSocket 客户端
│   └── media/                  # 图片、PDF 等静态资源
├── scripts/
│   └── cli.js                  # CLI 入口（new-intern / new-report / task）
├── dist/                       # 构建输出目录（gitignore）
├── package.json
├── .gitignore
├── PLAN.md                     # 本文件
└── README.md
```

### 1.2 构建管线 (`lib/build.js`)

参考 gongshangzheng.github.io 的 9 阶段管线：

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ 1. 初始化 &  │──▶│ 2. 资源复制 & │──▶│ 3. 内容收集  │
│   缓存加载   │   │   CSS 打包   │   │              │
└──────────────┘   └──────────────┘   └──────┬───────┘
                                             │
                    ┌────────────────────────┤
                    ▼                        ▼
          ┌──────────────────┐     ┌──────────────────┐
          │ 4a. Markdown     │     │ 4b. 加载任务树   │
          │     解析 + 短代码│     │   + 习惯提取     │
          └────────┬─────────┘     └────────┬─────────┘
                   │                        │
                   └────────────┬───────────┘
                                ▼
                     ┌──────────────────┐
                     │ 5. 模板渲染      │
                     │  (布局 + 注入)   │
                     └────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌──────────────┐ ┌────────────┐ ┌──────────────┐
     │ 6. 列表页    │ │ 7. 搜索    │ │ 8. 缓存保存  │
     │   生成       │ │   索引     │ │   & 清理     │
     └──────────────┘ └────────────┘ └──────────────┘
```

**阶段说明**：

1. **初始化** — 读取 `.internwiki-cache/build-manifest.json`，检查缓存有效性
2. **资源 & CSS** — 复制 `assets/media/` 到 `dist/`；`always/` CSS 合并为一个文件，`optional/` 按需复制
3. **内容收集** — 扫描 `content/interns/` 发现所有实习生及其文件，扫描 `content/_shared/`
4a. **Markdown 解析** — 提取 frontmatter → 短代码占位 → `marked` 转 HTML → 短代码渲染回注 → TOC 提取
4b. **任务 & 习惯** — 解析每个项目的 `tasks.json`，从日报中提取 `- [x] desc #tag` 习惯数据
5. **模板渲染** — 将内容注入模板，组合布局（base + nav + content + toc + footer）
6. **列表页** — 为每个实习生生成日报列表、周报列表、文档列表；生成全站实习生目录
7. **搜索索引** — 生成 `dist/search-index.json`（含 pinyin-pro 拼音索引用于中文搜索）
8. **缓存保存** — 计算 SHA1 哈希更新缓存，删除不再存在的输出文件

### 1.3 模板引擎 (`lib/parser.js`)

自定义 Mustache 风格引擎（参考 gongshangzheng 的实现）：

| 语法 | 说明 |
|------|------|
| `{{variable}}` | 变量插值（自动 HTML 转义） |
| `{{{variable}}}` | 原始 HTML 注入 |
| `{{#array}}...{{/array}}` | 数组循环 |
| `{{^array}}...{{/array}}` | 空判断（数组为空时显示） |
| `<!-- INCLUDE partial.html -->` | 引入局部模板 |
| `<!-- INJECT key -->` | 命名注入点（用于布局组合） |

### 1.4 短代码系统 (`lib/shortcode.js`)

可扩展的短代码注册表，参考 gongshangzheng 的 `{{< name >}}` 语法：

| 短代码 | 输出 | 说明 |
|--------|------|------|
| `{{< pdf src="..." title="..." >}}` | PDF.js canvas 容器 | 懒加载 PDF.js CDN 渲染 PDF 页面 |
| `{{< mermaid >}}...{{< /mermaid >}}` | `<pre class="mermaid">` | 客户端 Mermaid.js 渲染图表 |
| `{{< alert type="info\|warning\|danger" >}}...{{< /alert >}}` | styled callout div | 带样式的提示框 |
| `{{< tasktree path="..." >}}` | 交互式任务树 | 从 tasks.json 生成 git 风格分支图 |
| `{{< heatmap intern="..." >}}` | 贡献热力图 | GitHub 风格日期 × 活跃度网格 |

### 1.5 技术依赖

**生产依赖（最小化）**：

| 包名 | 用途 | 备注 |
|------|------|------|
| `marked` | Markdown → HTML | 核心依赖 |
| `gray-matter` | YAML Frontmatter 提取 | 支持 YAML + JSON |
| `ws` | WebSocket | LiveReload 开发服务器 |
| `chokidar` | 文件监听 | 开发模式增量构建 |
| `mime-types` | MIME 类型 | 开发服务器静态文件 |

**开发/可选**：

| 包名 | 用途 | 备注 |
|------|------|------|
| `pinyin-pro` | 拼音搜索索引 | 仅在构建时使用 |

**明确不使用**：
- ❌ React / Vue / Svelte（纯 HTML 输出）
- ❌ Vite / Webpack / Rollup（自定义 CSS 打包）
- ❌ Hugo / Jekyll / Astro（自定义 SSG）
- ❌ Express / Koa（使用原生 `http` 模块）
- ❌ 数据库（文件系统即数据库）

---

## 第二阶段：内容模型 & 模板

### 2.1 日报 (`content/interns/{name}/daily/YYYY-MM-DD.md`)

```yaml
---
date: 2026-07-07
type: daily
intern: alice
tags: [后端, API]
---

## ✅ 今日完成
- 完成了用户认证接口 PR #42
- Review 了 Bob 的数据库迁移

## 🚧 进行中
- API 限流中间件 (60%)
- 阅读 Redis 缓存模式

## 🚫 阻塞项
- 等待 DevOps 配置 staging Redis 实例

## 📝 笔记
发现了令牌桶算法的有用模式

## 🔄 习惯打卡
- [x] 晨会 #routine
- [x] 代码审查 #growth
- [ ] 文档更新 #writing
```

**构建时处理**：
- 提取 `- [x] desc #tag` → 习惯追踪数据
- 提取各部分内容 → 周报自动聚合

### 2.2 周报 (`content/interns/{name}/weekly/YYYY-Www.md`)

```yaml
---
week: 2026-W28
type: weekly
intern: alice
---

## 📊 本周总结
<!-- 构建时自动注入本周日报摘要 -->

## 🎯 关键成果
- 交付了用户认证接口
- 解决了支付流程中 3 个关键 Bug

## 📈 数据
- PR 合并: 4
- 代码审查: 6
- 文档撰写: 2

## 🔮 下周计划
- 完成限流中间件
- 启动集成测试框架

## 💭 反思
本周感觉很有成效...
```

### 2.3 项目任务树 (`content/interns/{name}/projects/{slug}/tasks.json`)

```json
{
  "project": "搜索引擎",
  "intern": "alice",
  "status": "active",
  "startDate": "2026-06-01",
  "tasks": [
    { "id": "t1", "title": "设计索引 Schema", "status": "done", "completedDate": "2026-06-05" },
    {
      "id": "t2",
      "title": "实现爬虫",
      "status": "in-progress",
      "children": [
        { "id": "t2a", "title": "URL 队列", "status": "done" },
        { "id": "t2b", "title": "HTML 解析器", "status": "in-progress" },
        { "id": "t2c", "title": "Robots.txt 遵守", "status": "todo" }
      ]
    },
    { "id": "t3", "title": "排序算法", "status": "todo", "blockedBy": ["t2"] }
  ]
}
```

**任务状态**：`todo` / `in-progress` / `done` / `blocked`
**级联完成**：子任务全部 `done` → 父任务自动 `done`

### 2.4 实习生档案 (`content/interns/{name}/profile.md`)

```yaml
---
name: 张三
team: 后端组
start_date: 2026-06-01
role: 后端开发实习生
---

## 自我介绍
我是后端组实习生，主要参与搜索引擎和数据管道相关工作...
```

### 2.5 知识库文档 (`content/interns/{name}/docs/*.md`)

```yaml
---
title: Redis 缓存指南
type: doc
intern: alice
created: 2026-07-05
updated: 2026-07-07
tags: [redis, 缓存, 后端]
toc: true
---

## 概述
...

## 架构图
{{< mermaid >}}
graph LR
  Client --> Cache
  Cache --> DB
{{< /mermaid >}}

## 配置参考
{{< pdf src="/media/redis-config-spec.pdf" title="Redis 配置规范" >}}
```

---

## 第三阶段：项目管理功能

### 3.1 任务树引擎 (`lib/tasks.js`)

- 加载 `tasks.json`，递归解析任务层级
- **级联完成**：子任务全部完成 → 父任务自动标记完成
- **状态统计**：完成数 / 总数 / 百分比
- **分支可视化**：生成 git 风格的任务树 HTML（参考 lifeOS 的实现）
- **阻塞关系**：`blockedBy` 字段支持任务依赖

### 3.2 习惯追踪 (`lib/habits.js`)

- 扫描日报中的 `- [x] desc #tag` 模式
- 生成 `tag × date` 热力图数据（参考 lifeOS 的贡献热力图）
- 计算连续打卡天数、完成率、周趋势

### 3.3 实习生仪表盘 (`src/templates/intern-home.html`)

每个实习生主页自动生成以下组件：

| 组件 | 数据来源 | 展示形式 |
|------|----------|----------|
| 活动热力图 | 日报日期 | GitHub 风格贡献网格 |
| 项目进度 | tasks.json | 进度条 + 下一任务预览 |
| 习惯打卡 | 日报习惯提取 | 连续天数 + 30 天趋势线 |
| 最近报告 | 最新 5 篇日报/周报 | 卡片列表带摘要 |
| 任务统计 | 所有任务树 | 完成/进行中/待办统计 |
| 文档列表 | docs/ 目录 | 按日期排序的文档列表 |

---

## 第四阶段：高级功能 & 打磨

### 4.1 搜索系统 (`lib/search.js` + `assets/js/search.js`)

- 构建时生成 `dist/search-index.json`
- 中文内容使用 `pinyin-pro` 生成拼音索引，支持拼音模糊搜索
- 客户端轻量级模糊匹配
- 过滤器：按实习生、类型（日报/周报/文档）、标签、日期范围

### 4.2 PDF 展示 (`lib/shortcode.js` pdf handler)

- 短代码 `{{< pdf src="..." title="..." >}}`
- 构建时注入 `<canvas data-pdf="...">` 容器
- 运行时懒加载 PDF.js CDN 渲染 PDF 各页面

### 4.3 开发服务器 (`lib/server.js`)

- 原生 `http` 模块提供静态文件服务（`dist/` 目录）
- `chokidar` 监听 `content/`、`src/templates/`、`assets/`
- 变更时增量重构建 + WebSocket 通知浏览器刷新
- 默认端口 3000，可配置

### 4.4 增量构建缓存 (`lib/cache.js`)

- SHA1 文件哈希 + 依赖关系图
- 内容文件、模板文件、任务文件分别跟踪
- 仅重建变更的页面
- 缓存在 `.internwiki-cache/build-manifest.json`

### 4.5 暗/亮模式

- Tailwind 风格的 CSS 变量系统
- 本地存储偏好，支持系统偏好自动检测
- 导航栏切换按钮

---

## 第五阶段：CLI 工具

### 命令设计 (`scripts/cli.js`)

```bash
# 构建和开发
npm run build              # 完整构建
npm run build -- --clean   # 清除缓存后重建
npm run serve              # 启动开发服务器（默认 :3000）

# 实习生管理
node scripts/cli.js new-intern --name 张三 --team 后端组 --start-date 2026-06-01

# 报告管理
node scripts/cli.js new-report --intern alice --type daily [--date 2026-07-07]
node scripts/cli.js new-report --intern alice --type weekly [--week 2026-W28]

# 任务管理
node scripts/cli.js task add --intern alice --project search-engine --title "添加测试" --parent t2
node scripts/cli.js task done --intern alice --project search-engine --id t2b
node scripts/cli.js task list --intern alice --project search-engine
node scripts/cli.js task stats --intern alice
```

---

## 实施路线图

| 阶段 | 内容 | 产出 |
|------|------|------|
| **Phase 1** | 核心 SSG + 项目骨架 | 可将 Markdown 编译为 HTML |
| **Phase 2** | 内容模型 + 模板 | 日报/周报/文档完整渲染 |
| **Phase 3** | 项目管理 | 任务树、习惯追踪、仪表盘 |
| **Phase 4** | 高级功能 | 搜索、PDF、LiveReload |
| **Phase 5** | CLI 工具 | 便捷的内容创建和管理命令 |

---

## 验证计划

1. **基础构建** — 创建示例实习生空间，包含几篇日报和周报，运行 `npm run build` 确认生成正确的 HTML
2. **模板渲染** — 确认短代码（PDF、Mermaid、Alert）正确渲染
3. **任务树** — 创建 tasks.json，验证级联完成逻辑和可视化
4. **搜索** — 确认搜索索引正确生成，客户端搜索可用
5. **开发服务器** — 启动 `npm run serve`，修改 Markdown 文件确认 LiveReload 生效
6. **CLI** — 测试 new-intern 和 new-report 命令生成正确的文件
