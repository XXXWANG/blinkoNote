# Blinko 改造 PRD（统一文档）

## 概述
- 产品：Blinko（Web + Docker）改造
- 文档版本：v1.0（持续迭代）
- 目标：
  - 仅同步“任务清单”内容在“闪念/笔记”和“待办”间双向一致
  - 在“待办”卡片右上角按钮行最前显示“查看来源”ICON，点击跳转源笔记并锚定到任务行
  - 与极空间 NAS 进行 WebDAV 双向同步
  - 提升离线能力：离线创建/编辑/删除与附件补传，联网自动增量同步

## 范围
- 改动涉及后端路由与前端 UI，不改数据库模型；使用 `notes.metadata` 存储任务映射信息
- 仅处理 Markdown 任务清单（`- [ ]`/`- [x]`），其他正文不参与同步

## 非目标
- 不同步除任务清单以外的正文内容
- 不引入复杂的冲突合并界面（使用提示与历史保留策略）

## 用户场景
- 在“闪念/笔记”编写包含任务清单的笔记，保存后在“待办”处理与追踪
- 在“待办”中修改任务内容或完成状态，返回源笔记定位到对应任务行并看到同步变化
- 无网络时继续写作，恢复网络后自动同步到服务端与 NAS

## 需求列表

### TOD-001 任务清单双向同步
- 描述：解析“闪念/笔记”正文中的任务清单，仅这些任务映射为 `NoteType.TODO` 并与“待办”保持双向同步；其他正文不参与同步
- 逻辑：
  - 解析：忽略代码块；支持 `- [ ]` 与 `- [x]`
  - 映射：每条任务创建/更新 `NoteType.TODO`，`metadata={originNoteId,lineHash,checked,position}`；建立 `noteReference(from:TODO → to:源笔记)`
  - 回写：更新 TODO 时按 `lineHash` 精确替换源笔记对应任务行文本与勾选，仅修改该行
  - 删除：源笔记删除某任务行时，对应 TODO 进入回收（或隐藏）
- 验收标准：
  - 新建笔记含两段任务清单，保存后“待办”出现对应条目
  - 在笔记修改任务文本或勾选，“待办”同步更新；反之亦然
  - 删除笔记任务行后，“待办”对应项进入回收
- 状态：验收中（冒烟通过；端到端脚本将补齐并入库）

### TOD-002 待办跳转源笔记并锚定（低强调）
- 描述：在“待办”卡片右上角按钮行（评论、分享）最前显示一个小 ICON，点击跳转源笔记并锚定到任务行
- UI：位置最前，尺寸 16，`text-desc` 低强调，随卡片 `group-hover` 渐显
- 行为：打开 `/detail?id=<originNoteId>&anchor=<lineHash>`；详情页滚动居中并高亮 1.5s
- 验收标准：ICON低强调呈现，点击能准确跳转并锚定
- 状态：验收中（直接导航锚点已验证；点击脚本化将补充稳健选择器）

### SYNC-001 WebDAV 同步到极空间 NAS
- 描述：后端支持 WebDAV Push/Pull，同步 `notes/*.json/.md` 与 `attachments/*`；按 `updatedAt+etag/hash` 增量
- 配置：`webdavUrl/webdavUsername/webdavPassword/webdavRootPath/webdavEnable`
- 目录：`/blinko/notes/<id>.json/.md`、`/blinko/attachments/<id>/<file>`、`/blinko/index.json`
- 策略：Last-Write-Wins，保留另一版本到 `noteHistory` 并通知冲突
- 验收：填完配置后可手动触发 Push/Pull；断网重连自动增量
- 状态：规划中

### OFF-001 离线优先增强
- 描述：离线状态下可创建/编辑/删除笔记与 TODO，附件进入“待上传队列”；联网后自动增量同步
- 前端：PWA 背景同步与 IndexedDB 队列；桌面端监听网络事件
- 验收：断网创建/编辑/删除与附件上传能在重连后稳定同步
- 状态：规划中

## 逻辑与数据
- `notes.metadata`：`{ originNoteId, lineHash, checked, position }`
- `noteReference`：维持 TODO → 源笔记指向关系
- 解析忽略代码块；`lineHash` 基于任务行文本生成，确保定位稳定

## 边界与异常
- 任务行移动导致 `lineHash` 变化：使用位置近似与文本哈希匹配；无法定位时保留 TODO 并提示
- 大笔记性能：解析仅在保存时运行；只处理任务清单行

## 里程碑与状态
- v1.0：建立统一 PRD；明确低强调 ICON 位置与行为；确认仅同步任务清单行

## 变更记录
- 2025-11-16：创建文档框架与需求条目；确定 Docker 真实环境测试为交付前置
