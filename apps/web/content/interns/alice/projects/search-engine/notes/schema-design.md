# 索引 Schema 设计

## 目标

为搜索引擎设计高效的倒排索引数据结构。

## 设计方案

### 倒排索引结构

```
term → [doc_id, position, weight]
```

- **term**: 分词后的词条
- **doc_id**: 文档唯一标识
- **position**: 词条在文档中的位置（用于短语查询）
- **weight**: 词频权重（TF-IDF）

### 存储方案

| 字段 | 类型 | 说明 |
|------|------|------|
| term | string | 分词后的词条 |
| doc_ids | int[] | 包含该词条的文档 ID 列表 |
| positions | int[][] | 每个文档中词条位置 |
| tf | float[] | 词频权重 |

## 实现步骤

1. [x] 定义 Schema 结构
2. [x] 选择序列化格式（Protobuf）
3. [ ] 实现 Schema 验证
4. [ ] 编写性能基准测试

## 性能考量

- 内存占用：预计 100 万词条 ≈ 500MB
- 查询延迟：P99 < 10ms
- 写入吞吐：> 10K docs/s
