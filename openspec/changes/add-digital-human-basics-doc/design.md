# Design: 《数字人基础》文档大纲

目标读者：数字人方向新实习生 / 想快速建立全景认知的工程师；**文档同时面向面试准备**——每篇末尾附"面试追问预案"（Q&A 形式，模拟面试官深挖点，参照 junjiawang VoiceAgent 文档格式）。
篇幅：2500-3500 字，基础讲解为主，研究前沿只做延伸阅读索引。
主干素材：`~/gongshangzheng.github.io/drafts/about-digital-human.md`（两层论）+ 调研系列文章。
精读篇策略：以博客对应精读文章为底稿改写压缩（自有内容直接复用），保留架构图与关键数字，补上"我们的实践关联"衔接段。

## 大纲

### 1. 数字人是什么：先分清两层

- **数字人**（生成模型）：一个视频生成任务
- **数字人系统**（产品）：围绕模型的一整套交互管线
- 为什么必须区分：聊"实时数字人"时，模型达标 ≠ 产品可用

### 2. 生成任务：输入 → 形象 → 驱动 → 输出

- 四步流程：身份条件（图/视频/资产）→ 创建形象 → 驱动信号（文本/语音）→ 表演视频
- 三轴心智模型（本文的核心框架，彼此不能混写）：
  - **表现质量**（画得好不好）：画质/分辨率、身份一致性、唇音同步、表情与动作自然度、时序流畅度
  - **表现范围**（能表现什么）：只换嘴 → 头肩 talking head → 上半身交互 → 手部动作 → 全身运动；它描述任务与应用场景的边界，不是质量高低
  - **工程性能**（等得久不久）：离线生成 → 近实时（秒级）→ 实时交互（毫秒级、可打断、流式）；并关注延迟、吞吐、显存等
- 任务分类速览只作为术语索引（video dubbing / talking head / portrait animation / 3D avatar 等），不替代三轴判断

### 3. 两轴技术分类：生成方式 × 渲染或资产后端

不要把“模型直接生成什么”和“最终靠什么资产/渲染器出画面”混成一组并列路线。这两件事可以组合：动作空间模型可以驱动 2D renderer，也可以驱动 FLAME/3DGS 等 3D 资产。

- **生成方式**（模型负责什么）：
  - **局部换嘴**：只重绘嘴部 ROI，其余帧来自原视频（Wav2Lip、MuseTalk）。稳定便宜易落地，但表情、头动、手势受限。
  - **动作空间生成（motion space）**——团队当前主力：模型预测低维运动，渲染器保留或生成身份外观。
  - **整帧视频生成**：直接预测视频 latent 或帧（FlashHead、LiveAvatar、Self-Forcing），表现范围自由但实时成本高。
- **渲染或资产后端**（画面如何落地）：2D 参考图/视频外观渲染，或 3D 资产（rigged mesh、NeRF、3DGS 等）。NeRF → 3DGS 的效率演进应放在这一轴下，而不是当作第四种生成方式。

- **动作空间生成（motion space）**——团队当前主力路线，重点展开：
  - 路线定义：把"身份外观"和"运动"拆开，生成模型只预测低维运动序列，渲染器把运动作用到参考身份上
  - **动作空间表示一览**（独立小节，一张表）——按"显式 ↔ 隐式"光谱组织：
    - 3DMM 系数（BFM / **FLAME**）：表情系数 + 头姿系数。FLAME 系数语义清晰，头部旋转、眼睛、下颌、眼睑、表情可单独读写（FLAP 即用 FLAME 系数做可控条件）；FLAME 顶点带 blendshape + LBS skinning，可直接驱动 3DGS avatar（LAM 的做法）
    - **Blendshape 系数**：工业标准接口，游戏引擎 / 直播软件原生消费；LiteAvatar 预测 32 维口型参数即属此类
    - 显式 / 隐式关键点：LivePortrait 的紧凑隐式关键点学出"implicit blendshapes"（无显式语义但能表达局部形变），Ditto 借此实现 gaze/emotion/pose 细粒度控制
    - 整体面部动力学 latent：VASA-1；Avatar Forcing 的 FLOAT latent（512 维，显式 identity-motion 分解 z = z_S + m_S）
    - 混合 motion representation：Ditto 的 keypoints + expression deformation + rotation + translation（265 维、385ms 首帧）
    - 全身/资产接口（一句话带过）：SMPL-X、ARKit 面部系数、BVH、motion tokens——跨向 3D avatar 与游戏资产的通用接口
    - 光谱两端的取舍：显式（可解释、可编辑、可接工业管线）vs 隐式（容量大、上限高）
  - 渲染器消费侧配图：渲染循环图（头姿→变换矩阵、表情→表情系数→渲染），即 3D 引擎驱动 avatar 的标准形态——图中的"表情系数"正是上表的 blendshape/3DMM 系数
  - 扩散演进线：SadTalker（3DMM 系数，ExpNet+PoseVAE，无扩散）→ VASA-1（整体面部动力学 latent，Diffusion Transformer）→ Ditto（显式 motion representation + Conditional DiT，流式推理）→ Avatar Forcing（motion latent space + Diffusion Forcing 因果自回归，blockwise rollout + KV 缓存，500ms 延迟、6.8× 加速）
  - 选型逻辑：身份固定、背景稳定、实时交互、可控表情——正是会议面试官场景的选择理由
- **3D 资产后端的效率演进**：NeRF → 3DGS——AD-NeRF（训练 167.6h、0.04 FPS）→ ER-NeRF（15.2 FPS）→ EGSTalker / GSTalker（40 分钟训练、125 FPS），转折点是体采样换成光栅化。3DGS 可作为动作空间生成的渲染器，而非与动作空间并列的“第四条生成路线”。

### 4. 数字人系统：从模型到产品

- 级联管线四组件表：ASR → LLM → TTS → Avatar 渲染（沿用草稿的表格）
- 三种架构范式：级联 vs 端到端 vs 混合（引用 TTFA 数据：A2-LLM 535ms vs 流式级联 3.2s）
- Agent 能力扩展：RAG 检索、工具调用、记忆与人格

### 5. 实时性：两大工程战场

- **传输层**：WebRTC / WebSocket 选型逻辑
- **推理层**：流式 TTS 分块合成 + Avatar 异步渲染、首帧等待
- 轻量开源方案的经典技巧（源自 LiteAvatar / Ultralight 源码解读）：滑动窗口重叠融合、静音回退中性口型、说话/静音状态机

### 6. 怎么衡量好坏

- 五大指标族一句话索引：画质（FID/FVD）、身份（CSIM）、唇同步（Sync-C）、漂移（Dino-S）、效率（FPS/TTFF/延迟/显存）
- 关键口径提醒：**论文 FPS ≠ 产品 SLA**——模型实时 vs 系统实时、RTP 判读
- 链接到 tangwen 的评测框架实践：[[project:digital-human]]

### 7. 延伸阅读

按主题归类指向博客系列文章（技术路线详解 / 评测基准 / 产业图谱 / 工程解读 CyberVerse 等）

## 写作约束

- frontmatter 按 report 规范（intern 由路径推断），tags 暂定 [数字人, 入门, 技术综述]
- 具体数字（FPS、训练时长、TTFA）必须来自已核实的博客素材，不现编
- 配图：用户提供了一张渲染循环流程图（初始化 → 渲染循环：设变换矩阵/设表情系数 → 渲染），用于 3.2 节渲染器消费侧说明。成稿时复制到 `public/interns/tangwen/docs/` 下，按 `/InternWiki/interns/tangwen/docs/xxx.png` 引用
- 全文一次成稿，成稿后在 dev server 验证渲染和 wiki 内链

---

# 专题篇大纲（6 篇：模型精读独立成篇）

用户裁决：模型"原始架构与逻辑"独立成整篇文档（不只一个章节），改动实践另成一篇；AF 收录中文化+LoRA+条件化漂移（排除 FinalLayer 解冻、absdriver）；CyberVerse 四项全收；Ditto 独立成篇；指标一律表格化；配图取自博客仓库。

## 专题 A1：《Avatar Forcing 模型精读》avatar-forcing-arch

素材：博客 avatar-forcing-2026.html 精读。约 2000-2500 字。只讲模型本身，不涉及我们的改动。

- 任务设定：交互式数字人——用户多模态信号（音频/视频）+ avatar 音频 → 响应视频（双向对话、可打断）
- 三模块：
  - **Motion Latent Encoding**：FLOAT autoencoder，latent 显式 identity-motion 分解 z = z_S + m_S（512 维；identity z_S 全程固定，模型逐帧只预测 m）——"底片与滤镜"类比
  - **Dual Motion Encoder**：把用户信号与 avatar 音频编码为统一条件
  - **Causal DFoT Motion Generator**：因果 Diffusion Forcing Transformer，自回归生成 motion latent（vs 双向扩散的差异）
- 流式推理：blockwise rollout（10 帧/block，12 帧 ODE 窗口）、KV/条件缓存、独立 CFG 三路缓存
- 两阶段训练：Stage1 DF 训练（50 帧 5 block，同 block 共享噪声时间步，2000k steps，H100）→ Stage2 DPO 微调（λ=0.1，β=1000，5k steps 封顶）
- 关键数字：推理延迟 500ms、加速比 6.8×、人类偏好 >80%
- 配图（博客 webp，复制到 public）：整体架构图、Motion Latent AE 图、双向 vs 因果结构对比图
- 可加 mermaid 时序图：一次对话的 blockwise rollout 数据流

## 专题 A2：《Avatar Forcing 微调实践》avatar-forcing-notes

素材：`~/DigitalHuman/finetune-avatarforcing`（openspec changes + train_lora.py）。约 2000-2500 字。前置阅读：[[A1]]。

- 背景：英文 wav2vec 960h 中文唇同步不足；300s 长视频身份漂移；数据三域 talkvid + news + linli
- 音频中文化一整套（蒸馏桥 → geom 桥 → georkd）：B_new 9216→512、geom 损失反塌缩、RKD 保英文老师侧成对距离；多域257 clips 的 md_georkd_best 当前 sync_c/sync_d 为6.299/8.853，但数量/多样性混杂且人工判定待完成，不作纯数据量归因
- LoRA 训练：模块试错表（cross-attn q/kv rank16 + stable sync 0.05 入选 / 时序层试过 / x_embedder 四崩）、工具链（--flow-init / --early-stop-patience / export_merged）、对照臂（geom_lora_s30 锚 6.122/9.044）
- 参考条件化：v1失败双因（GT捷径 + 无容量，换库输出差<0.001）；v2为待实现验证的逐层拼接8层/ref_mode三档设计。A1 `c_hi=0.99` 有c1 300s CSIM 0.645→0.935的单身份结果；A2训练期条件化为失败对照（6/6劣于零条件臂）
- **身份漂移定位实验**：c1 单身份上的两个候选假设——
  - 模长实验：noguide 300s 的 |r_d| 首/中/末为2.03/2.04/2.01，未出现持续增长，因此不支持撑开假说；跨身份机制仍待验证
  - 夹角实验：noguide 离首帧方向10.1°→15.1°→17.5°，A1为3.4°→3.3°→2.5°，支持方向游走假说；需要跨身份/音频复核，不能称主要机制已确定
  - 当前工程含义：A1优先约束方向是合理尝试；v2条件化仍为待验证设计
- 指标表格化

## 专题 B1：《Ditto 模型精读》ditto-arch

素材：博客 paper-ditto.html + ditto-talkinghead.html。约 2000-2500 字。只讲模型本身。

- 任务拆分：音频到面部运动 + 运动到视频渲染两层（"谁在说话"与"怎么动"分离）；Ditto 的判断——"生成空间"比"生成模型"更重要
- Motion Space：论文抽象为 canonical keypoints c、deformation δ、rotation R、translation t；部署 LMDM 输出265维 scale + pitch/yaw/roll + translation + expression，不含kp（由源侧回填），身份与运动并未完全解耦
- Conditional DiT（LMDM）：ECS（音频特征/眼部状态/参考 keypoints/emotion，cross-attention 持续引导）+ ICS（初始运动，拼到噪声序列，保长序列连续）
- 渲染：Appearance Feature Extractor + Face Renderer；参考身份 keypoints 与生成运动合成 x̂ = c_ref·R̂ + δ̂ + t̂
- 流式推理与可控性：gaze correction、眨眼、emotion label；RTF 与 385ms 首帧
- 训练：把视频"训成运动生成器"（数据组织 + loss 设计概述）
- 配图（博客 webp）：Ditto overall framework、Conditional DiT 架构图
- mermaid 流程图：参考人像/音频 → Motion Extractor / HuBERT → 条件汇合 → Conditional DiT → 运动序列 → Face Renderer → 视频（博客精读里已有同款 mermaid，直接改写）

## 专题 B2：《Ditto 改动实践》ditto-notes

素材：`~/code/digital_human`（ditto-mouth-motion-isolation change + models/ditto/ 源码）。约 1500-2000 字。前置阅读：[[B1]]。

- 问题：视频源双重驱动（源嘴动叠加音频唇动）；三条泄露通道（exp 的后验 probing 控制映射 / warp 逐帧源外观 f_s 自带源嘴纹理 / x_d kp 回填）；术语速查表（x_d 265维、不含kp；x_s、f_s、M_c2o、kp 21点骨架）
- 演进线（每版：方案 → 人工判定 → 裁决）：v1 运动隔离渲染层不可见作废 → v2 整帧钉首帧方向保留但最终人工判定待补齐 → kp 回填泄露修复（单 case 指标）→ 前3.2秒错位的静音垫/首窗/M_c2o 假设均已回滚或撤回，根因待继续定位
- 开关 isolate_source_mouth，默认关，不改权重
- 指标表：单 case 下 LSE-C 3.44→3.74→4.87、LSE-D 11.12→10.93→8.81；单图上限 5.01/8.75 只作该样本技术参照

## 专题 C：《CyberVerse 工程专题》cyberverse-notes

素材：`~/code/CyberVerse` 的归档 change 与 `rtf-benchmark.md`。约 2000-2500 字。只写基准记录可直接支持的发布链路与性能事实。

### C1. 发布链路与 GPU 预算
- 以浏览器 25fps 消费为背景，隔离基准 GPU 侧 decode/warp/LMDM/stitch 合计约 38.5ms/帧，占 40ms 预算约 96%
- 结论：生产侧排队会直接变成卡顿，不能把慢都归因于单个模型阶段

### C2. 抖动治理
- H.264 流的段尾持留：旧 `shortfall<=2` 固定 200ms grace 使 encode 超过 200ms 段预算；改 `shortfall==1` 立即返回 + deficit 记账后，cadence 1.056–1.070→1.018–1.020，concealment 2.5–3.6%→0.022%
- 绝对播放锚点：消除相对锚定的逐段误差累积，240s 会话稳态 cadence 1.000
- 僵尸会话：terminal Delete + idle 卸载 + 30s peer 看门狗；会话约 35s 归零、backend 约 3min 卸载，但插件每周期仍残留约 1.4GB，不能写 GPU 归零

### C3. 局部优化与端到端边界
- decode fp32→fp16：隔离 73.5→17.7ms/帧
- warp fp16 TRT：隔离 14.9→11.8ms，但生产端到端 fps 无明显收益，未采纳
- 结论：阶段变快不等于浏览器变快，需同时观测 GPU利用率、fps、stall、cadence与TTFF

### C4. 负结果档案
- 单改 25→20fps 失败：online 窗口和 audio2motion→warp 时序以25fps为前提，配置降帧造成错位
- GPU putback 与继续调 CUDA stream 在GPU饱和下无端到端收益
- 插件显存残留是独立待办，不能与僵尸会话回收混为一谈

## 专题 D：《动作空间专题》motion-space-notes

素材：博客 motion-space / FLAP / LAM / FlexAvatar / LivePortrait / paper-ditto 精读 + `~/code/digital_human/models/ditto/` 源码。约 2500-3000 字。核心目标：把"动作空间"这件事一次性讲透，回答"这些表示从哪来、怎么拆、各自优缺点"。

### D1. 表示谱系：显式 ↔ 隐式光谱（总表）

- **3DMM / FLAME 系数**：身份/表情/头姿系数分离。FLAME 顶点带 blendshape + LBS skinning（可驱动 3DGS，LAM 做法）；FLAME UV 空间是空间对齐工作区
- **Blendshape**：ARKit-52 工业标准；LiteAvatar 32 维口型参数
- **LivePortrait/Ditto 控制表示**：论文抽象使用 canonical keypoints、deformation、rotation、translation；部署 LMDM 输出 265 维 scale + pitch/yaw/roll + translation + expression，**不含 kp**
- **整体面部 latent**：VASA-1；AF 的 FLOAT latent（512 维，z = z_S + m_S 显式分解）
- 光谱两端取舍：显式（可解释/可编辑/可接工业管线）vs 隐式（容量大/上限高）

### D2. 拆分机制：Ditto 怎么把眼部和嘴部拆开（本文核心问答）

四层机制（全部有源码/论文出处）：
- **表示与后验映射**：exp 为 21×3 deformation 操作布局，但预训练不提供嘴/眼天然语义；论文通过逐维扰动和渲染观察建立控制映射，工程代码再手工选用唇部/眼部索引
- **条件层（按音频可解释性拆）**：音频解释不了眨眼/视线 → 眼部状态（aspect ratio + pupil position）单独作为 ECS 条件 e 走 cross-attention；嘴部主要由 HuBERT 音频驱动
- **Loss 层（adaptive loss weights）**：按控制区域分组，相邻 epoch 平均 loss 差异动态调权 + softmax 调整系数，防止某区域训练不足
- **推理层（区域 alpha mask 混合）**：motion_stitch.py 用 0/1 mask 按区域混合驱动值/源值；我们的 mouth-isolation 改动即基于此机制
- mermaid 图：21×3 deformation 操作布局 → 后验 probing 建立的局部控制映射

### D3. 各表示的来源与训练方式对比

- FLAME/3DMM：统计模型，大量 3D 扫描数据先验拟合
- LivePortrait 隐式关键点：one-shot 系统自监督蒸馏，"implicit blendshapes"
- FLOAT latent：autoencoder 显式分解训练
- 对比表：表示 | 维度 | 语义可读性 | 训练来源 | 工业接口

### D4. 我们的实践映射

- mouth-isolation：唇通道操作（D2 推理层机制的应用）
- AF 微调：latent 空间的 identity-motion 分解利用
- 延伸阅读指向博客 FLAP/LAM/FlexAvatar/UIKA 精读

## 专题 E：《微调策略专题》finetune-strategy-notes

素材：`~/DigitalHuman/finetune-avatarforcing` openspec（lora-injection-survey / bridge-finetune-strategy / final-layer-readout-unfreeze / add-lora-train-skill / talkvid-scaling-validation 等）。约 2000-2500 字。核心问答："什么时候用 LoRA、什么时候解冻全参、什么时候开放整块模块"。

### E1. 微调形态光谱

| 形态 | 我们的做法 | 可训参数量 | 适用场景 |
|------|-----------|----------|---------|
| 全冻结（仅训桥/新组件） | 蒸馏桥 B_new 全开放精调（flow/wav2vec 冻结） | 桥 4.7M | 接入新音频编码器、不动主干 |
| LoRA（低秩旁路） | flow cross-attn q/kv rank16 | 低秩增量 | 主干域适配（中文化） |
| LoRA 注入点选择 | 两轮消融：round1 q/kv/proj 三轴 → round2 路径后缀精确匹配 + 4 臂（crossproj/mlp/selfonly/full）+ 条件模块 c_embedder 臂 | 按注入点 | 容量与过拟合平衡 |
| 单层全参解冻 | FinalLayer readout（targets=none 唯一放行 final_layer） | 2.624M（adaLN 1024→2048 + Linear 1024→512） | 历史零训练的瓶颈层探针 |
| 整块开放 vs 桥内 LoRA | 路线A全开放 c1 LSE-C 4.565；路线B桥内 LoRA 5.483；均低于纯桥5.719 | — | 蒸馏契约漂移问题 |

### E2. 我们的实战结论（选型逻辑）

- **注入点是本轮主轴**：中文域适配消融中注入位置带来 +0.39 LSE-C；不是所有模型的普适结论
- **多域结果仍待归因**：257 clips 的 md_georkd_best 双轨 sync_c 6.299 较优，但样本数、来源和身份多样性同时变化，人工判定未完成，不能归因于纯数据量
- **全开放的代价**：路线A训练侧 sync 降、guided_flow 恶化，生成侧 c1 LSE-C 4.565 < 纯桥 5.719；桥内 LoRA 5.483 较A改善但仍未超纯桥
- **解冻的判据**：历史臂未命中 final_layer（17个历史臂零覆盖）→ 空白区探针；以训好的 merged LoRA 为基底（--flow-init）再解冻，归因更干净
- **工具链**：--flow-init 任意基底 strict 载入、--early-stop-patience 谷底连升即停、export_merged、注入点命中清单打印（可审计）
- **指标表必须拆口径**：Round1 单轨 output LSE-C（5.288/5.677）与多域双轨 SyncNet v2 均值（6.122/6.299）不横向排序

### E3. 决策树

什么时候 LoRA（域适配、数据有限、要保底模能力）→ 什么时候解冻单层（瓶颈定位、LoRA 已到上限）→ 什么时候开放整块（接新组件且愿意重训契约）→ 什么时候全冻结只训桥（换音频编码器）。配 mermaid 决策树图。

## 专题 F：《数据集整理专题》dataset-notes

素材：`~/code/digital_human`（datasets/ 适配器）+ `~/DigitalHuman/finetune-avatarforcing`。双语音频脚本在 scripts；`measure_offset_dual.py`、`correct_clip_offset.py`、`prepare_identity.py` 在 models/avatarforcing。约 2000-2500 字。

### F1. 数据域与适配器

- 三域数据：talkvid（通用说话视频）/ news（播报风格）/ linli（补充来源）；多域改变数量、来源和身份分布，不做单一归因
- TTS 管线：items JSONL/文本输入 → prepare_dual_lang_tts 生成16k WAV并追加 audio_manifest.jsonl → normalize_dual_lang_audio 回写规范化信息

### F2. 音频一致性

- normalize 脚本实际做：16kHz、单声道、loudnorm、首尾静音裁剪和 manifest 更新
- 这条链针对双语 TTS 探针，不外推为所有视频数据的统一处理

### F3. Offset 对齐（音画对齐）

- offset 是对齐测量元数据；measure_offset_dual 与 correct_clip_offset 用于复核与 LSE 口径
- 多域训练使用 offsets.json；缺 offset 的 clip 进入排除清单，不在本流程中一律物理平移媒体
- mermaid 图：素材 → 音频规范化/manifest → offset 元数据 → 训练或评测口径

### F4. 身份数据与锚帧库

- build_nopb_anchor_bank：首帧定固定裁剪框，后续帧同框裁512，不旋转校正、不做质量筛选，全帧入库
- A1 当前是 c1 单身份实验输入，不能外推为跨身份部署策略

## 专题 G：《评测指标专题》metrics-notes

素材：`~/code/digital_human/docs/metrics-guide.md`（40+ 指标注册表 + 逐指标解读 + 口径演变史）。约 2000-2500 字。核心叙事："我们要回答什么问题 → 因此引入什么指标 → 指标口径踩过哪些坑"。

### G1. 指标地图：问题 → 指标（主表）

按"回答的问题"组织：
- 嘴型和声音对得上吗 → Sync-C（高好）/Sync-D（L2距离，低好）
- 生成的人和参考是同一人吗 → CSIM等身份指标
- 像素/感知质量 → PSNR、SSIM、LPIPS、TOPIQ-FR（需配对GT）
- 无参考质量（NR-IQA）→ musiq_koniq 等（512构图整帧/人脸/嘴唇三档）
- 长时身份偏离 → CSIM-drift、LPIPS-drift；相邻帧稳定 → Dino-S、flow_smoothness
- 轨道：cross_identity 无配对GT但仍可跑 sync/csim/NR；listening 配置空指标，走人工评价

### G2. 口径的坑（演进史）

- 正式 dh-eval：框架层输入/GT统一512人脸构图，指标层再按需求裁脸/嘴或对齐；pasteback关闭
- speed-run：输入已预裁512，直接对 output.mp4 打分，无 face.mp4；当前 docs 与 metrics.yaml 对身份首帧/中间帧存在快照不一致，报告必须注明版本
- LPIPS/TOPIQ-FR 默认会二次 face-margin 裁剪
- 与 guanmu 对照：sync族 corr=1.000、CSIM单样本模板逐像素一致；musiq_koniq 因输入区域不同 corr=0.036，不能称完全对齐
- 历史裁剪口径变更后必须重建基线，禁止横向比较

### G3. 指标与实际问题的映射案例

- 例 1：CSIM-drift 曲线提示身份随时间下降 → 用模长/夹角实验提出并检验候选机制；当前方向游走仅有 c1 单身份支持证据
- 例 2：不同裁剪、模板或 SyncNet 版本会改变历史数值 → 先统一同口径基线，再解释指标高低
- 例 3：正式 dh-eval 与 speed-run 的输入裁剪路径不同 → 报告必须标注路径，不能横向混表


## 专题篇写作约束

- 每篇开头 2-3 句定位 + 与基础篇/精读篇/项目页的 wiki 互链（[[project:digital-human]]；改动篇标注前置阅读指向精读篇）
- **每篇末尾"面试追问预案"**（参照 junjiawang 格式）：3-5 个模拟面试官深挖问题 + 回答要点，覆盖"为什么这么选/为什么不用 X/失败时怎么定位"三类
- 精读篇（A1/B1）以博客精读为底稿改写，不做从零重写
- 指标表格化（sync_c、LSE、cadence/RTF/p95 三张主表）
- 不写 absdriver（FinalLayer 解冻已按后续裁决纳入微调策略专题 E1 作为形态案例）
- 源码细节点到为止（符号含义 + 文件路径），完整叙述留在原仓库 openspec 里
- 配图：从博客复制 webp 到 `public/interns/tangwen/docs/`（AF 三张、Ditto 两张）+ 用户提供的渲染循环图
- mermaid 图：Ditto 管线流程图（B1）、AF blockwise rollout 数据流（A1）——依赖前置 change add-mermaid-support 落地
- **技术表述审计基线**：三轴（表现质量/表现范围/工程性能）不得混写；术语或缩写首次出现须给出白话定义；指标必须说明高低方向、回答的问题与适用口径；结论必须能回溯到观察或实验；内部链接必须在子目录 slug 下可达；不以“核心/最值钱/会骗人”等口号替代论证。
