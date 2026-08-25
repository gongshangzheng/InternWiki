---
name: Junjia Wang
slug: junjiawang
team: 后端组
role: 后端开发实习生
startDate: 2026-08-21
---

## 自我介绍

Junjia Wang，后端开发实习生。主导 **VoiceAgent 智能体管控平台**服务端从 0 到 1 建设，负责实时语音 AI Agent 的编排、配置、生命周期与鉴权全链路；同时负责该平台**前端 Web Demo** 的架构重构与全部交互功能（数字人视频、Bad Case 反馈、MCP/RAG 可视化）。

## 技术栈

### 后端（主）

- **语言**: Java 17
- **框架**: Spring Boot 2.7、MyBatis-Plus、Pandora Boot
- **中间件**: HSF(RPC)、TDDL(MySQL 分布式)、Diamond(配置中心)、Redis、MetaQ
- **AI 相关**: RAG 检索增强、MCP 工具调用、ASR / LLM / TTS 三段式与 S2S 一段式 pipeline
- **工具**: Docker、Git、SpringDoc OpenAPI

### 前端

- **语言**: 原生 JavaScript (ES6+)
- **音视频**: DingRTC SDK、dingrtc-aiagent SDK (RTM)、WebRTC
- **Web API**: Web Audio API（AnalyserNode / MediaRecorder 分片录制）、MutationObserver、requestVideoFrameCallback
- **架构**: 模块化拆分、配置驱动（localStorage 持久化 + 枚举校验 + 按需下发）

## 主要项目

**[VoiceAgent 智能体管控平台 · 项目总览](docs/voice-agent-overview.md)** — 后端负责人 + 前端主要开发，2026.06 - 2026.08

> 建议从总览开始读，共 9 篇文档。

- **跨侧**
  - [前后端契约与协同设计](docs/voice-agent-frontend-backend-contract.md)
- **服务端**
  - [Agent 全生命周期编排引擎与多通路动态路由](docs/voice-agent-orchestration.md)
  - [三级配置继承体系与 RAG / MCP 编排](docs/voice-agent-config-inheritance.md)
  - [事件驱动会话状态机与三层超时兜底](docs/voice-agent-session-lifecycle.md)
  - [多租户分级鉴权体系与 WS 短期票设计](docs/voice-agent-auth.md)
- **前端 Web Demo**
  - [数字人视频流接入与实时渲染方案](docs/voice-agent-web-digital-human.md)
  - [前端模块化重构与多链路配置适配层](docs/voice-agent-web-architecture.md)
  - [Bad Case 收集与反馈系统设计](docs/voice-agent-web-badcase.md)
  - [MCP 工具可视化与知识库 RAG 前端集成](docs/voice-agent-web-mcp-rag.md)

## 联系方式

- GitHub: 
- Email: 
