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
- 两个正交评价维度（本文的核心心智模型）：
  - **生成质量**（从无到有，覆盖更多身体部位）：唇同步 → 面部表情 → 头部姿态 → 手部动作 → 全身运动
  - **工程性能**（从离线到实时）：离线生成 → 近实时（秒级）→ 实时交互（毫秒级、可打断、流式）
- 任务分类速览（一句话带过六分类：video dubbing / talking head / portrait animation / 3D avatar / 上半身交互 / 流式基模）

### 3. 四条主流技术路线

每条路线：一句话原理 + 代表工作 + 优缺点。分类依据是**任务分解方式**（生成模型负责什么、渲染器负责什么），而非 2D/3D 之分。

- **3.1 局部换嘴**：只重绘嘴部 ROI，其余帧来自原视频（Wav2Lip、MuseTalk）。稳定便宜易落地，但表情、头动、手势全受限——一句话带过即可
- **3.2 动作空间生成（motion space）**——团队当前主力路线，重点展开：
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
- **3.3 3D 资产路线**：NeRF → 3DGS 演进一条线讲清效率转折——AD-NeRF（训练 167.6h、0.04 FPS）→ ER-NeRF（15.2 FPS）→ EGSTalker / GSTalker（40 分钟训练、125 FPS），转折点是体采样换成光栅化。与 3.2 的关系：3DGS 也可作为动作空间路线的渲染器
- **3.4 整帧视频扩散基模**：直接在视频 latent/帧空间生成（FlashHead、LiveAvatar、Self-Forcing 流式蒸馏）。表现自由度高（身体、背景、场景），但成本高、长时稳定与实时化难

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
- 音频中文化一整套（蒸馏桥 → geom 桥 → georkd）：B_new 9216→512、geom 损失反塌缩、RKD 保英文老师侧成对距离、多域 257 clips；指标表 md_georkd_best sync_c 6.299/8.853
- LoRA 训练：模块试错表（cross-attn q/kv rank16 + stable sync 0.05 入选 / 时序层试过 / x_embedder 四崩）、工具链（--flow-init / --early-stop-patience / export_merged）、对照臂（geom_lora_s30 锚 6.122/9.044）
- 参考条件化 v2 + identity-drift 正负结论：v1 失败双因（GT 捷径 + 无容量，换库输出差 <0.001）→ v2 Ditto 式逐层拼接 8 层、ref_mode 三档；A1 推理期锚点 GO（c_hi=0.99，300s csim 0.645→0.935，无同步税）；A2 训练期条件化 FAIL（6/6 劣于零条件臂）
- **身份漂移定位实验（定位在先、治理在后）**：两个假设对照实验——
  - 膜长实验（范数撑开假说）：**证伪**。noguide 300s 的 |r_d| 首/中/末 1/3 = 2.03/2.04/2.01，斜率 −0.01/min，无增长无撑开；GT 2.17/2.18/2.16 斜率 ≈0；A1 引导 2.09 恒定。模长恒定偏低（−14%，对应模糊问题，不累积）
  - 夹角实验（方向漂移假说）：**成立，与漂移曲线精确同构**。noguide 离首帧方向 10.1°→15.1°→17.5°（峰值 24.8°），离 GT 方向字典最近邻 7.1°→12.4°→14.1°，斜率 +2.1°/min 持续游走；A1 引导 3.4°→3.3°→2.5°（峰值 6.2°）≈0 全程钉住；GT 自身游走带宽 3~5°（4° 左右波动）
  - 结论链：漂移主体 = latent 方向持续转角 → 引导/条件化都应作用于方向 → A1 锚点引导与参考条件化 v2 的设计依据
- 指标表格化

## 专题 B1：《Ditto 模型精读》ditto-arch

素材：博客 paper-ditto.html + ditto-talkinghead.html。约 2000-2500 字。只讲模型本身。

- 任务拆分：音频到面部运动 + 运动到视频渲染两层（"谁在说话"与"怎么动"分离）；Ditto 的判断——"生成空间"比"生成模型"更重要
- Motion Space：Motion Extractor 输出 canonical keypoints c、expression deformation δ、head rotation R、translation t；扩散模型只预测 m = {δ, R, t}（identity-agnostic，265 维）
- Conditional DiT（LMDM）：ECS（音频特征/眼部状态/参考 keypoints/emotion，cross-attention 持续引导）+ ICS（初始运动，拼到噪声序列，保长序列连续）
- 渲染：Appearance Feature Extractor + Face Renderer；参考身份 keypoints 与生成运动合成 x̂ = c_ref·R̂ + δ̂ + t̂
- 流式推理与可控性：gaze correction、眨眼、emotion label；RTF 与 385ms 首帧
- 训练：把视频"训成运动生成器"（数据组织 + loss 设计概述）
- 配图（博客 webp）：Ditto overall framework、Conditional DiT 架构图
- mermaid 流程图：参考人像/音频 → Motion Extractor / HuBERT → 条件汇合 → Conditional DiT → 运动序列 → Face Renderer → 视频（博客精读里已有同款 mermaid，直接改写）

## 专题 B2：《Ditto 改动实践》ditto-notes

素材：`~/code/digital_human`（ditto-mouth-motion-isolation change + models/ditto/ 源码）。约 1500-2000 字。前置阅读：[[B1]]。

- 问题：视频源双重驱动（源嘴动叠加音频唇动）；三条泄露通道（exp 唇通道逐帧偏移 / warp 逐帧源外观 f_s 自带源嘴纹理 / x_d kp 回填）；术语速查表（x_d 265 维、x_s、f_s、M_c2o、kp 21 点骨架）
- 演进线（每版：方案 → 人工判定 → 裁决）：v1 运动隔离渲染层不可见作废 → v2 整帧钉首帧终裁（v3/v4 否决回滚）→ kp 回填泄露修复 → 0.6s 音画错位修复（前置 15 帧静音垫）
- 开关 isolate_source_mouth，默认关，不改权重
- 指标表：LSE-C 3.44→3.74→4.87、LSE-D 11.12→10.93→8.81，单图上限 5.01/8.75 对照

## 专题 C：《CyberVerse 工程专题》cyberverse-notes

素材：`~/code/CyberVerse`（19 个归档 change + rtf-benchmark.md 38 条实测）。约 2000-2500 字。定位：工程实践，博客未写的后续优化。

### C1. 架构概览（一段 + 一张表）
三进程（Python inference gRPC / Go 编排 WebRTC / vite 前端）+ 六个流式服务；详细架构链接博客文章

### C2. 抖动治理
- 呲呲声三步取证与解法：NVENC 死等 200ms tail grace（改 shortfall==1 + deficit 记账）→ 每段相对锚定累积漂移（绝对网格 deadline + 300ms 重锚定护栏）→ cadence 1.06×→1.000、concealment 3%→0、TTFF 2.2s→~1s
- 段间爆破音：per-200ms 重建 Opus encoder 的 19733 LSB 阶跃 → per-peer 持久复用
- 僵尸会话：GPU 滞留 ~9GB → terminal Delete + idle 驱逐 + 30s 看门狗
- 间歇卡顿取证：GPU0 同租户训练争用（fps 25→12-14），非代码回归——取证方法论本身值得写

### C3. 速度优化
- alignment net 逐帧 20 次 GPU 同步 → batch=10：paste p95 4750→52.7ms（-98.9%）
- 全 GPU 帧管线（去归一化/uint8 H2D/网格缓存/pinned D2H）：paste p95 67.3→12.7ms、RTF 0.698→0.588、TTFF 1.39→1.18s
- 720p 全画布 warp 15ms/帧 → 人脸 ROI warp 恢复实时
- 软 VP8 → NVENC H.264：像素吞吐 3.3×、预热 663→445ms
- inference 按需生命周期：空闲 3 分钟停进程 GPU 归零

### C4. 负结果档案
- fp16/DDIM 只降 RTF 不提 fps（GPU 饱和）
- ditto GPU putback 及微优化零收益（默认 CUDA 流串行）
- config 降帧 25→20 反致抖动
- turn-audio-flush 弃做（积压形态搬家）、换轮 TTFF 2.18s 待 timeline 跳播
- 价值：负结果防止后人重蹈，也是选型依据

## 专题 D：《动作空间专题》motion-space-notes

素材：博客 motion-space / FLAP / LAM / FlexAvatar / LivePortrait / paper-ditto 精读 + `~/code/digital_human/models/ditto/` 源码。约 2500-3000 字。核心目标：把"动作空间"这件事一次性讲透，回答"这些表示从哪来、怎么拆、各自优缺点"。

### D1. 表示谱系：显式 ↔ 隐式光谱（总表）

- **3DMM / FLAME 系数**：身份/表情/头姿系数分离。FLAME 顶点带 blendshape + LBS skinning（可直驱 3DGS，LAM 做法）；FLAME UV 空间是空间对齐工作区（FlexAvatar 2500 token=50×50 网格、UIKA canonical UV）
- **Blendshape**：ARKit-52 工业标准；LiteAvatar 32 维口型参数
- **隐式关键点**：LivePortrait 紧凑关键点 = implicit blendshapes（无显式语义维度，但 MLP 能学出局部形变 offset）
- **整体面部 latent**：VASA-1；AF 的 FLOAT latent（512 维，z = z_S + m_S 显式分解）
- **混合表示**：Ditto 的 265 维（scale + pose + t + 63 exp）
- 光谱两端取舍：显式（可解释/可编辑/可接工业管线）vs 隐式（容量大/上限高）

### D2. 拆分机制：Ditto 怎么把眼部和嘴部拆开（本文核心问答）

四层机制（全部有源码/论文出处）：
- **表示层（继承而非训练）**：motion space 来自预训练 LivePortrait 风格 Motion Extractor；exp 为 21×3 语义布局，唇部行 [6,12,14,17,19,20]、眼部行 [11,13,15,16,18]——分区固化在预训练表示中
- **条件层（按音频可解释性拆）**：音频解释不了眨眼/视线 → 眼部状态（aspect ratio + pupil position）单独作为 ECS 条件 e 走 cross-attention；嘴部由 HuBERT 音频驱动 exp 通道
- **Loss 层（adaptive loss weights）**：按控制区域分组，相邻 epoch 平均 loss 差异动态调权 + softmax 调整系数，防止某区域训练不足
- **推理层（区域 alpha mask 混合）**：motion_stitch.py 用 0/1 mask 按区域混合驱动值/源值；我们的 mouth-isolation 改动即基于此机制
- mermaid 图：21×3 exp 通道布局 → 面部区域映射示意

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
| 单层全参解冻 | FinalLayer readout（targets=none 唯一放行 final_layer） | 0.79M→勘误 2.624M | 历史零训练的瓶颈层探针 |
| 整块开放 vs 桥内 LoRA | 桥全开放精调（吃掉蒸馏增益 0.38→0.13）vs 桥内 LoRA rank16（~0.15M 低秩约束） | — | 蒸馏契约漂移问题 |

### E2. 我们的实战结论（选型逻辑）

- **注入点是唯一有效轴**：三轴消融（层/秩/数据）中只有注入位置带来收益（+0.39 LSE-C）；秩与数据量在数据不足时非瓶颈
- **数据是瓶颈的判据**：多域 257 clips 后 sync_c 6.299 全臂第一——"数据不足"假设 A 成立；talkvid scaling 验证
- **全开放的代价**：桥全开放精调让训练侧 sync 降但验证侧 guided_flow 恶化（契约漂移）——LoRA 低秩约束是"吸收监督又不过度偏离蒸馏契约"的平衡点
- **解冻的判据**：历史臂全部未命中 final_layer（17 个历史臂零覆盖）→ 空白区探针；以训好的 merged LoRA 为基底（--flow-init）再解冻，归因最干净
- **工具链**：--flow-init 任意基底 strict 载入、--early-stop-patience 谷底连升即停、export_merged、注入点命中清单打印（可审计）
- 指标表：各形态 sync_c / LSE 对照（base 5.288 → layer_proj 5.677 → md_georkd_best 6.299 → 锚 6.122）

### E3. 决策树

什么时候 LoRA（域适配、数据有限、要保底模能力）→ 什么时候解冻单层（瓶颈定位、LoRA 已到上限）→ 什么时候开放整块（接新组件且愿意重训契约）→ 什么时候全冻结只训桥（换音频编码器）。配 mermaid 决策树图。

## 专题 F：《数据集整理专题》dataset-notes

素材：`~/code/digital_human`（datasets/ 适配器 base/talkvid/conversation/long）+ `~/DigitalHuman/finetune-avatarforcing`（prepare_dual_lang_tts / normalize_dual_lang_audio / measure_offset_dual / correct_clip_offset / prepare_identity / build_nopb_anchor_bank）。约 2000-2500 字。核心问答："一份能训练和评测的数字人数据集是怎么整理出来的"。

### F1. 数据域与适配器

- 三域数据：talkvid（通用说话视频）/ news（央视联播，播报风格）/ linli；conversation / long 适配器
- 双语 TTS 数据管线：prepare_dual_lang_tts → normalize_dual_lang_audio（响度/采样率归一）→ dual_lang_tts_items.jsonl

### F2. 音频一致性

- 为什么需要：同一 clip 的音频要重采样 16kHz、响度归一，否则特征抽取（wav2vec/HuBERT）和唇同步评测都会被无关方差污染
- 具体做法（从脚本提炼）：采样率/声道/响度归一、静音段处理、片段切分

### F3. Offset 对齐（音画对齐）

- 为什么需要：数据集的音频与视频常有毫秒级错位（剪辑/转码引入），直接训练会教模型学错位唇形
- offset 双重测量（measure_offset_dual）：两路独立测量互为校验
- correct_clip_offset 修正 + 聚合 offset 口径（评测时全 clip 统一）
- mermaid 图：原始 clip → 音频归一 → offset 双测 → 修正 → 训练/评测数据集

### F4. 身份数据与锚帧库

- prepare_identity（身份素材准备）→ build_nopb_anchor_bank（锚帧库）→ A1 引导的库从哪来
- 与身份漂移治理的衔接（指向 A2 篇）

## 专题 G：《评测指标专题》metrics-notes

素材：`~/code/digital_human/docs/metrics-guide.md`（40+ 指标注册表 + 逐指标解读 + 口径演变史）。约 2000-2500 字。核心叙事："我们要回答什么问题 → 因此引入什么指标 → 指标口径踩过哪些坑"。

### G1. 指标地图：问题 → 指标（主表）

按"回答的问题"组织（沿用 metrics-guide 的分组表）：
- 嘴型和声音对得上吗 → Sync-C/Sync-D（经验值：自然视频 >5，好生成 >3，不同步 <2）
- 生成的人和参考是同一人吗 → CSIM
- 像素/感知质量 → PSNR、SSIM、LPIPS、TOPIQ-FR
- 无参考质量（NR-IQA）→ musiq_koniq 等 7+ 项（整帧/人脸裁剪/嘴唇裁剪三档）
- 时间长了会变差吗 → CSIM-drift、LPIPS-drift、Dino-S
- 运动质量 → SID、flow_smoothness、motion_magnitude；表情 expression_nr
- 跑得快吗占多少资源 → FPS、RTF、VRAM、GPU-Util、Throughput、Latency P50/P95/P99
- Tier 2（THEval 衍生）：lip_dynamics、silent_lip_stability 等

### G2. 口径的坑（演进史）

- **指标只在人脸裁剪视频上算**：pasteback 全帧不参与指标——两层裁剪（输入侧 face_crop 契约 crop_coeff=1.9 + 指标级 face_crop_mode）
- LPIPS/TOPIQ-FR 勘误：曾以为不受裁剪影响，实际构造函数默认也在做二次裁剪
- speed-run 打分口径定稿：SyncNet v2 + 人脸检测恢复；身份模板统一中间帧；共用裁剪框保证构图逐像素一致
- 与 guanmu 参考实现逐指标对照（sync 族 corr=1.000、csim 逐像素 diff=0）
- cross_identity / listening 轨道无 GT——指标必须按轨道绑定（applies_to）

### G3. 指标与实际问题的映射案例

- 例 1：怀疑长视频身份漂移 → CSIM-drift 曲线定位 → 引出 A2 篇的膜长/夹角实验
- 例 2：唇同步可疑高（Wav2Lip 得分最高）→ 判定结果可疑需复验——单一指标会骗人，要交叉验证
- 例 3：3DGS 无背景算法的 PSNR 不公平 → 人脸 matting 前置


## 专题篇写作约束

- 每篇开头 2-3 句定位 + 与基础篇/精读篇/项目页的 wiki 互链（[[project:digital-human]]；改动篇标注前置阅读指向精读篇）
- **每篇末尾"面试追问预案"**（参照 junjiawang 格式）：3-5 个模拟面试官深挖问题 + 回答要点，覆盖"为什么这么选/为什么不用 X/失败时怎么定位"三类
- 精读篇（A1/B1）以博客精读为底稿改写，不做从零重写
- 指标表格化（sync_c、LSE、cadence/RTF/p95 三张主表）
- 不写 absdriver（FinalLayer 解冻已按后续裁决纳入微调策略专题 E1 作为形态案例）
- 源码细节点到为止（符号含义 + 文件路径），完整叙述留在原仓库 openspec 里
- 配图：从博客复制 webp 到 `public/interns/tangwen/docs/`（AF 三张、Ditto 两张）+ 用户提供的渲染循环图
- mermaid 图：Ditto 管线流程图（B1）、AF blockwise rollout 数据流（A1）——依赖前置 change add-mermaid-support 落地
