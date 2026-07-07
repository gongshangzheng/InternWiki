import { Link } from 'react-router-dom'
import { MarkdownView } from '@/components/MarkdownView'

const GUIDE_BODY = `

## 项目目标

InternWiki 是一个**多实习生协作的文档平台**。每位实习生拥有独立命名空间，管理自己的日报、周报、月报、技术文档和项目任务树。

核心理念：**一个人的项目，会变成很多个人的项目。** 实习期间踩过的坑、解决过的问题、写过的方案，都不应随着实习结束而消失。InternWiki 让这些经验沉淀下来，帮助下一批实习生少走弯路。

---

## 协作方式：Agent 辅助 + 人工把关

这个项目设计为与 Agent（AI 编程助手）配合使用。你可以用 Agent 帮你快速生成文档骨架、创建任务结构、管理日常内容。但请记住：

> **关键内容请自己动笔。**

Agent 适合帮你搭框架、补格式、做重复劳动。但以下内容必须是你的真实经历：

- **遇到的困难**：具体是什么问题、报错信息、为什么会卡住
- **解决过程**：你尝试了什么方案、哪些有效哪些无效、最终怎么解决的
- **技术判断**：为什么选 A 不选 B、权衡了什么、代价是什么
- **反思与收获**：这件事让你学到了什么、下次会怎么做

完全由 AI 生成的文档读起来千篇一律，对后来者没有参考价值。你写下的每一句真实踩坑经验，都可能帮到下一个人。

---

## 开始使用

### 第一步：创建你自己的分支

**请务必在自己的分支上工作，不要直接提交到 main。**

\`\`\`bash
# 切到 main 拉最新代码
git checkout main
git pull origin main

# 创建你的分支（命名规则：intern-你的英文名）
git checkout -b intern-zhangsan
git push -u origin intern-zhangsan
\`\`\`

之后所有你的日报、周报、文档、任务修改都提交到你自己的分支。

### 第二步：创建实习生档案

\`\`\`bash
pnpm report new-intern --name 张三 --slug zhangsan --team 后端组 --role 后端开发实习生
\`\`\`

这会自动创建目录结构和 \`profile.md\` 模板。填写你的自我介绍和技术栈。

### 第三步：开始写日报

\`\`\`bash
pnpm report new-daily --intern zhangsan
\`\`\`

生成的模板已经包含「今日完成 / 进行中 / 阻塞项 / 笔记 / 习惯打卡」结构，填写后提交。

### 第四步：编译并预览

\`\`\`bash
pnpm content:build   # 编译 Velite 内容
pnpm dev             # 启动开发服务器 (localhost:5180/InternWiki/)
\`\`\`

---

## 报告写作规范

### 日报（每日提交）

文件路径：\`content/interns/{你的slug}/daily/YYYY-MM-DD.md\`

**写什么：**
- ✅ 今天完成了什么具体工作（写明 PR 编号、Bug ID）
- ✅ 进行中的任务进度百分比
- ✅ 卡住的地方（等待什么资源、需要谁配合）
- ✅ 当天学到的新东西
- ❌ 不要只写「开发功能」三个字

### 周报（每周提交）

文件路径：\`content/interns/{你的slug}/weekly/YYYY-Wxx.md\`

**写什么：**
- ✅ 本周关键成果（交付了什么、有什么价值）
- ✅ 数据量化（PR 数、Bug 修复数、文档数）
- ✅ 遇到的技术挑战和解决思路
- ✅ 反思：哪些做得好、哪些可以改进
- ✅ 下周计划

### 月报（每月提交）

文件路径：\`content/interns/{你的slug}/monthly/YYYY-MM.md\`

**写什么：**
- ✅ 月度成长复盘（技术 + 协作两个维度）
- ✅ 重要里程碑事件
- ✅ 月度数据汇总
- ✅ 下月方向性计划

### 技术文档

文件路径：\`content/interns/{你的slug}/docs/{slug}.md\`

写给其他实习生看的技术指南。**假设读者是刚入职的新人**，从零开始讲清楚一个技术主题。

---

## 习惯打卡

日报末尾有一个习惯打卡区域：

\`\`\`markdown
## 习惯打卡

- [x] 晨会 #routine
- [x] 代码审查 #growth
- [ ] 文档更新 #writing
\`\`\`

系统会自动解析 \`#tag\`，在[习惯页](/interns/alice/habits)生成连续打卡天数和 30 天热力图。

---

## 项目管理

### 创建项目

\`\`\`bash
pnpm project new --intern zhangsan --slug my-project --title "我的项目" --summary "一句话描述"
\`\`\`

这会创建：
- \`projects/my-project/README.md\` — 项目说明
- \`projects/my-project/tasks.json\` — 任务树（空）
- \`projects/my-project/notes/\` — 任务笔记目录

### 管理任务

\`\`\`bash
# 添加任务
pnpm task add --intern zhangsan --project my-project --title "设计数据库 Schema"

# 添加子任务
pnpm task add --intern zhangsan --project my-project --title "用户表设计" --parent t1

# 标记完成
pnpm task done --intern zhangsan --project my-project --id t1-1

# 查看任务树
pnpm task list --intern zhangsan --project my-project

# 查看统计
pnpm task stats --intern zhangsan
\`\`\`

### 任务状态

| 状态 | 含义 | 图标 |
|------|------|------|
| planned | 计划中，尚未开始 | ⚪ |
| active | 正在进行 | 🔵 |
| completed | 已完成 | ✅ |
| paused | 暂停 | ⏸ |
| blocked | 被阻塞 | 🔴 |

### 任务笔记

在 \`projects/{slug}/notes/\` 下创建 Markdown 文件，然后在任务中设置 \`notePath\`：

\`\`\`json
{
  "id": "t2",
  "title": "爬虫模块",
  "notePath": "notes/crawler-design.md",
  ...
}
\`\`\`

点击项目页任务树中的任务即可查看笔记。

---

## 日历

[日历页](/calendar)汇总你的所有有日期任务和周期任务。切换实习生下拉框查看不同人的日程。URL 参数 \`?intern=xxx\` 可以直接分享特定实习生的日历链接。

---

## 搜索

按 **⌘K**（Mac）或 **Ctrl+K**（Windows）随时打开搜索，覆盖日报、周报、月报、文档、项目和实习生。

---

## 开发命令速查

\`\`\`bash
pnpm dev              # 启动开发服务器 (端口 5180)
pnpm build            # 构建生产版本
pnpm content:build    # 仅编译 Velite 内容
pnpm typecheck        # 类型检查
pnpm report help      # 查看 report CLI 帮助
pnpm task help        # 查看 task CLI 帮助
pnpm project help     # 查看 project CLI 帮助
\`\`\`

---

## 分支与提交规范

1. **在自己的分支上工作**：\`intern-你的名字\`
2. 提交信息用中文，简洁明了：
   - \`日报 2026-07-07\`
   - \`周报 W27\`
   - \`添加搜索引擎任务\`
   - \`修复日历事件颜色 bug\`
3. 定期从 main 拉取最新代码，避免冲突
4. 内容稳定后可以提 PR 合并到 main

---

## 技术栈

- **构建**: Vite 6 + Velite（Markdown → 类型化 JSON）
- **框架**: React 19 + React Router v7
- **样式**: Tailwind v4（CSS 变量主题）
- **日历**: FullCalendar 6
- **CLI**: Node.js ESM 脚本

---

有问题？看 [SKILL.md](https://github.com/gongshangzheng/InternWiki/blob/main/SKILL.md) 里的完整框架文档，或问已经上手的同事。
`

export function GuidePage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">使用指南</h1>
        <p className="mt-1 text-sm text-dim">
          InternWiki 是配合 Agent 使用的实习生文档平台。这里说明项目目标、使用方法和协作规范。
        </p>
      </div>
      <div className="lo-card p-6">
        <MarkdownView body={GUIDE_BODY} />
      </div>
    </section>
  )
}
