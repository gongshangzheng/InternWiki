# InternWiki

多人实习文档平台 — 每个实习生拥有独立项目空间，支持日报、周报、知识库文档和项目任务管理。

基于自定义 Node.js 静态站点生成器，将纯 Markdown 文件编译为 HTML 页面。

## 特性

- **多人空间** — 每个实习生拥有独立的 `daily/`、`weekly/`、`docs/`、`projects/` 目录
- **日报 & 周报** — 结构化模板，自动生成摘要和统计
- **项目任务树** — JSON 定义的任务层级，支持级联完成和状态追踪
- **习惯追踪** — 从日报中自动提取打卡记录，生成热力图
- **知识库文档** — 支持 PDF 展示、Mermaid 图表、数学公式
- **全文搜索** — 中文拼音搜索，按实习生/类型/标签过滤
- **增量构建** — SHA1 缓存，仅重建变更页面
- **开发服务器** — 文件监听 + WebSocket LiveReload

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run serve

# 构建静态站点
npm run build

# 新增实习生
node scripts/cli.js new-intern --name 张三 --team 后端组 --start-date 2026-06-01

# 新增日报
node scripts/cli.js new-report --intern 张三 --type daily

# 新增周报
node scripts/cli.js new-report --intern 张三 --type weekly
```

## 项目结构

```
InternWiki/
├── content/              # 内容源（Markdown + JSON）
│   ├── _shared/          # 团队共享内容（入职指南、规范）
│   ├── interns/          # 实习生空间
│   │   └── {name}/
│   │       ├── profile.md      # 个人信息
│   │       ├── daily/          # 日报 (YYYY-MM-DD.md)
│   │       ├── weekly/         # 周报 (YYYY-Www.md)
│   │       ├── projects/       # 项目（tasks.json + 文档）
│   │       └── docs/           # 知识库文档
│   └── config.yml        # 站点配置
├── src/templates/        # HTML 模板
├── lib/                  # 构建系统模块
├── assets/               # CSS、JS、静态资源
├── scripts/cli.js        # CLI 工具
├── dist/                 # 构建输出
├── PLAN.md               # 详细实现计划
└── README.md
```

## 内容格式

### 日报

```yaml
---
date: 2026-07-07
type: daily
intern: 张三
tags: [后端, API]
---

## ✅ 今日完成
- 完成了用户认证接口

## 🚧 进行中
- API 限流中间件 (60%)

## 🚫 阻塞项
- 等待 DevOps 配置 Redis 实例

## 🔄 习惯打卡
- [x] 晨会 #routine
- [x] 代码审查 #growth
- [ ] 文档更新 #writing
```

### 周报

```yaml
---
week: 2026-W28
type: weekly
intern: 张三
---

## 📊 本周总结
<!-- 构建时自动注入日报摘要 -->

## 🎯 关键成果
- 交付了用户认证接口

## 🔮 下周计划
- 完成限流中间件
```

### 项目任务树

```json
{
  "project": "搜索引擎",
  "intern": "张三",
  "status": "active",
  "tasks": [
    { "id": "t1", "title": "设计索引 Schema", "status": "done" },
    {
      "id": "t2",
      "title": "实现爬虫",
      "status": "in-progress",
      "children": [
        { "id": "t2a", "title": "URL 队列", "status": "done" },
        { "id": "t2b", "title": "HTML 解析器", "status": "in-progress" }
      ]
    }
  ]
}
```

### 短代码

在 Markdown 中使用短代码嵌入富媒体内容：

```markdown
{{< pdf src="/media/spec.pdf" title="技术规格" >}}

{{< mermaid >}}
graph LR
  Client --> Cache --> DB
{{< /mermaid >}}

{{< alert type="info" >}}
这是一条提示信息
{{< /alert >}}

{{< tasktree path="projects/search-engine/tasks.json" >}}
```

## CLI 命令

| 命令 | 说明 |
|------|------|
| `npm run build` | 构建静态站点 |
| `npm run serve` | 启动开发服务器（默认 :3000） |
| `cli.js new-intern` | 创建新实习生空间 |
| `cli.js new-report` | 创建日报或周报 |
| `cli.js task add` | 添加项目任务 |
| `cli.js task done` | 标记任务完成 |
| `cli.js task list` | 列出项目任务树 |

## 技术栈

- **构建系统**：自定义 Node.js SSG
- **Markdown**：`marked` + `gray-matter`
- **模板引擎**：自定义 Mustache 风格
- **开发服务器**：原生 `http` + `ws` + `chokidar`
- **搜索**：`pinyin-pro` 拼音索引 + 客户端模糊搜索
- **部署**：GitHub Pages / 任意静态托管

## 许可证

MIT
