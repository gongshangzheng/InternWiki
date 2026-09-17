# Proposal: 《数字人基础》+ 数字人专题系列文档

## Why

tangwen 在 digital-human 项目（钉钉数字人方向）已完成 20+ 篇调研、Ditto/Avatar Forcing 模型改造、CyberVerse 工程优化，但 InternWiki 里 `interns/tangwen/docs/` 还是空的。需要一套入门总览 + 模型精读 + 改动实践的文档体系。素材来自博客 `~/gongshangzheng.github.io`（草稿 + 40+ 篇文章 + 精读配图）、`~/code/digital_human`（Ditto 改动）、`~/DigitalHuman/finetune-avatarforcing`（AF 微调）、`~/code/CyberVerse`（工程优化，博客未写的独有内容）。

## What Changes

创建 10 篇文档（`--intern tangwen`），互相 wiki 链接，指标数值表格化，配图取自博客 webp，流程图用 mermaid（依赖前置 change add-mermaid-support），每篇末尾附"面试追问预案"。成稿后还要逐篇进行技术表述审计：以三轴模型为一致性基线，核查并修复概念分类、因果链、指标方向与口径、术语边界、模型架构/训练/数据管线描述和内部链接：

1. **《数字人基础》**（digital-human-basics）：两层论 + 三轴心智模型（表现质量：画质/身份一致性/唇音同步/动作自然度/时序流畅度；表现范围：换嘴/头肩/上半身/全身；工程性能：延迟/吞吐/资源）+ 两轴技术分类（生成方式：局部换嘴/动作空间/整帧生成；渲染或资产后端：2D 外观/3D 资产 NeRF、3DGS 等，可组合）+ 动作空间表示光谱 + 系统架构 + 评测口径
2. **《Avatar Forcing 模型精读》**（avatar-forcing-arch）：原始架构与逻辑（三模块 / 流式推理 / 两阶段训练），博客精读为底稿，配博客架构图
3. **《Avatar Forcing 微调实践》**（avatar-forcing-notes）：音频中文化整套、身份漂移定位实验（c1 轨迹不支持范数撑开、支持方向游走假说）、A1 单身份结果、待实现验证的参考条件化 v2
4. **《Ditto 模型精读》**（ditto-arch）：原始架构与逻辑（Motion Space / Conditional DiT / 渲染 / 流式），博客精读为底稿，配 mermaid 管线图
5. **《Ditto 改动实践》**（ditto-notes）：视频源唇动隔离完整演进线 + LSE 指标表
6. **《CyberVerse 工程专题》**（cyberverse-notes）：架构概览、抖动治理、速度优化、负结果档案
7. **《动作空间专题》**（motion-space-notes）：表示谱系光谱、Ditto 眼部/嘴部拆分四层机制、各表示训练来源对比
8. **《微调策略专题》**（finetune-strategy-notes）：微调形态光谱（LoRA/单层解冻/整块开放/全冻结训桥）、选型逻辑与决策树
9. **《数据集整理专题》**（dataset-notes）：数据域与适配器、音频一致性、offset 对齐、锚帧库
10. **《评测指标专题》**（metrics-notes）：问题→指标映射地图（40+ 项）、口径演进史与坑、实际问题映射案例

大纲先提案（design.md），经多轮用户反馈确认后一次性成稿（已完成 6 轮反馈）。

用户裁决记录：
- 模型原始架构独立成篇（精读篇 + 实践篇分离）；精读以博客文章为底稿改写
- 面向面试：每篇末尾"面试追问预案"（参照 junjiawang VoiceAgent 文档格式）
- AF 实践篇收录：中文化、条件化+漂移（含膜长/夹角定位实验）；LoRA 内容拆入《微调策略专题》；不含 absdriver
- CyberVerse 篇：四项全收（架构/抖动/速度/负结果）
- Ditto：精读 + 实践两篇
- 动作空间专题：Blendshape/FLAME/显式隐式 + Ditto 眼嘴拆分机制讲透
- 微调策略专题：LoRA/解冻/开放训练的适用边界（什么时候用哪种）
- 数据集专题：音频一致性怎么做、offset 对齐、锚帧库
- 指标专题：解决什么问题→引入什么指标，含口径坑
- 指标表格化；配图从博客仓库取 webp；管线图用 mermaid

## Capabilities

### New Capabilities
- `digital-human-docs`: InternWiki 数字人方向文档体系（基础 + 精读 + 实践）

### Modified Capabilities
<!-- 无 -->

## Impact

- 新增：`apps/web/content/interns/tangwen/docs/` 下 10 篇文档（基础、模型精读、微调与实践、工程与评测四个子目录）+ 配图（`public/interns/tangwen/docs/`：博客 webp 5 张 + 渲染循环图 1 张）
- 素材来源：4 个外部仓库只读引用，不复制文章正文进本仓库
- 不修改站点代码、不改动项目 README（文档用 wiki 内链引用项目）
- 本仓库首次引入 `openspec/` 变更管理
