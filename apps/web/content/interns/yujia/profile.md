---
name: yujia
slug: yujia
# team / role / startDate 为可选字段，涉及真实信息我没有代填，请自行补全：
# - team 留空时首页会把你显示为「未分组」
# - startDate 决定顶部导航中实习生的排序位置
# team: 后端组
# role: Agent 开发实习生
# startDate: 2026-08-01
---

## 自我介绍

Agent 开发方向，主攻**检索增强（RAG）与多模态**。做过两个互补的项目：一个是从零设计插件化的 Agent 编排与评测内核，解决「怎么科学地衡量和迭代一条 Agent 工作流」；另一个是企业级多模态知识中台，解决「怎么给 Agent 供给可靠、可溯源的感知能力」。前者偏方法与基础设施，后者偏生产链路与工程治理。

习惯以实测数据而非直觉做技术选型，对外部模型依赖一律配独立超时预算与降级路径。

## 技术栈

**语言**

- Python（主）、TypeScript / JavaScript、SQL

**后端与工程**

- FastAPI（异步 API、SSE 流式协议）、Celery + Beat（异步任务链路、幂等与竞态治理）
- PostgreSQL / ADB-PG、pgvector（HNSW、`halfvec` 高维降本）、Redis、OSS
- Docker Compose 编排、pytest（累计沉淀 84 + 单测与集成测试）、ffmpeg

**AI 与多模态**

- 向量检索：Dense + Sparse 双路并行召回、RRF 融合、多模态精排与三级降级
- 模型编排：Qwen3-VL Embedding / Rerank、qwen3-omni-flash、Paraformer-v2 ASR、VLM 图文联合生成
- 训练与实验：PyTorch、Transformers、Pydantic
- 上下文工程：自研 SCAR 邻接扩展打分、图文锚定、并查集资料组聚合

**方向关键词**

- Agent 编排与能力供给设计、RAG 检索增强、上下文工程、模型降级与成本权衡、异步流水线一致性治理

## 主要项目

共 2 篇项目经历文档。两篇分别对应「Agent 的评测与编排」和「Agent 的感知层供给」，建议按顺序阅读。

1. [多模态 RAG Agent 评测与编排平台（MMRAG）](docs/mmrag-agent-platform.md)

   独立主导「注册中心 + 策略模式」的插件化 Agent 编排内核，新工具接入成本降至 1 个文件 + 1 个装饰器，零成本接入 26 个异构工具与 13 个多模态数据集，累计沉淀 279 组实验。内容寻址的分阶段缓存把重排迭代效率提升 1~2 个数量级，实测 nDCG@5 最高提升 33.4%。

2. [企业级多模态 RAG 知识中台（Agent 检索增强内核）](docs/enterprise-multimodal-rag.md)

   核心开发 / 检索与生成链路 Owner。承接 28+ 种异构资料（含音视频）构建统一多模态向量空间，对外输出检索 API 与流式问答 API。六个技术亮点：多模态混合检索内核、自研 SCAR 邻接上下文扩展、Agent 就绪的 SSE 流式协议、两级语义缓存与写回准入治理、异步摄取流水线的一致性治理、从 0 到 1 的音视频摄取轨（以静音闸门阻断 VLM 幻觉入库）。

## 联系方式

- GitHub: [@Cameron274365](https://github.com/Cameron274365)
