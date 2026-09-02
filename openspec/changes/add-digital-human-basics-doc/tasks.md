# Tasks: 《数字人基础》文档

## 1. 提案阶段（当前）

- [x] 1.1 梳理博客素材（about-digital-human 草稿 + 40+ 篇文章 + CyberVerse/LiteAvatar 源码解读）
- [x] 1.2 检查 InternWiki 已有内容，确认不与 digital-human 项目 README 重复
- [x] 1.3 提出 proposal + 文档大纲（design.md），交用户审核

## 2. 大纲修订

- [x] 2.1 第 1 轮反馈：动作空间扩散（Ditto / Avatar Forcing）被埋在"2D 直接生成"子弹点里，升级为一等路线；路线分类依据改为任务分解方式，共四条；渲染循环图作为 3.2 节配图
- [x] 2.2 第 2 轮反馈：3.2 新增"动作空间表示一览"独立小节（3DMM/FLAME 系数、blendshape、显式/隐式关键点、面部动力学 latent、Ditto 混合表示、SMPL-X/ARKit/BVH 资产接口），按显式↔隐式光谱组织
- [x] 2.3 第 3 轮反馈：范围扩展为 4 篇文档（基础 + AF/Ditto/CyberVerse 专题）。用户裁决：AF 收录中文化+LoRA+条件化漂移（排除 FinalLayer/absdriver）；CyberVerse 四项全收；Ditto 独立成篇；指标表格化；合并零散 change 为完整工作线
- [x] 2.4 终稿确认（口头），进入成稿

## 3. 一次性成稿（4 篇）

- [x] 3.1 `pnpm report new-doc` × 4 创建骨架（digital-human-basics / avatar-forcing-notes / ditto-notes / cyberverse-notes）
- [x] 3.2 复制渲染循环配图到 `public/interns/tangwen/docs/`
- [x] 3.3 按终稿大纲一次写完 4 篇全文（指标表格化）
- [x] 3.4 dev server 验证：页面渲染、wiki 内链跳转、配图显示、frontmatter 正确
