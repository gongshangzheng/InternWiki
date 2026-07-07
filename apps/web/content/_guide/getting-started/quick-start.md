---
title: 快速上手
slug: quick-start
category: 开始
order: 2
summary: 从零开始配置环境、创建分支、建立档案并写第一篇日报。
---

## 第一步：创建你自己的分支

**请务必在自己的分支上工作，不要直接提交到 main。**

```bash
# 切到 main 拉最新代码
git checkout main
git pull origin main

# 创建你的分支（命名规则：intern-你的英文名）
git checkout -b intern-zhangsan
git push -u origin intern-zhangsan
```

之后所有你的日报、周报、文档、任务修改都提交到你自己的分支。

---

## 第二步：创建实习生档案

```bash
pnpm report new-intern --name 张三 --slug zhangsan --team 后端组 --role 后端开发实习生
```

这会自动创建目录结构和 `profile.md` 模板。填写你的自我介绍和技术栈。

---

## 第三步：开始写日报

```bash
pnpm report new-daily --intern zhangsan
```

生成的模板已经包含「今日完成 / 进行中 / 阻塞项 / 笔记 / 习惯打卡」结构，填写后提交。

---

## 第四步：编译并预览

```bash
pnpm content:build   # 编译 Velite 内容
pnpm dev             # 启动开发服务器 (localhost:5180/InternWiki/)
```

打开浏览器访问 `http://localhost:5180/InternWiki/`，你应该能看到首页和你的实习生空间。
