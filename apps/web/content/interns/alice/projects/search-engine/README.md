---
title: 搜索引擎
slug: search-engine
status: active
startDate: 2026-07-07
endDate: null
category: work
tags: [搜索引擎, Elasticsearch, Go]
summary: 基于 Elasticsearch 的全文搜索引擎，支持中文分词和实时索引更新。
timeline:
  - date: 2026-07-07
    title: 项目立项
    type: milestone
    description: 完成需求分析和索引 Schema 设计。
---

## 项目背景

随着平台数据量增长，现有的数据库 LIKE 查询已无法满足搜索性能和相关性需求。需要构建一个基于 Elasticsearch 的全文搜索引擎。

## 技术方案

- **搜索引擎**: Elasticsearch 8.x
- **中文分词**: IK 分词器
- **数据同步**: Canal + Kafka 实现增量同步
- **查询服务**: Go + gin

## 当前阶段

索引 Schema 设计完成，等待运维分配 Elasticsearch 集群资源。
