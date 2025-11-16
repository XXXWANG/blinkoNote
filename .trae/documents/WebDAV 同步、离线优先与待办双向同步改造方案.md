## 目标
- 将笔记与附件通过 WebDAV 与极空间 NAS 双向同步（Push/Pull）。
- 提升离线能力：无网络时可完整使用；联网后自动、可靠地增量同步。
- 在“笔记”正文中的待办项（Markdown 复选框）自动出现在“待办”视图中；在“笔记”和“待办”任一处修改，另一处立即双向同步。

## 总体架构
- 前端维持现有列表与编辑体验；新增离线更新队列与后台同步触发。
- 后端新增 WebDAVService 与同步路由/任务；在 Note 保存/更新时执行待办项解析与映射。
- 数据仍以 Prisma/Postgres 为真源；WebDAV 作为文件型镜像（可离线查看与第三方协作）。

## WebDAV 同步
### 远端目录结构
- 根路径：`/blinko/`
  - `notes/<noteId>.json`：标准化笔记数据（含 `content/type/isArchived/isRecycle/attachments/tags/updatedAt/metadata`）
  - `notes/<noteId>.md`：可选 Markdown 导出（便于人读与第三方编辑）
  - `attachments/<noteId>/<filename>`：附件原文件
  - `index.json`：远端索引（每条记录的 `id` 与 `updatedAt`、附加 `etag`/`hash`）

### 配置项（后端 Config 表）
- `webdavUrl`、`webdavUsername`、`webdavPassword`、`webdavRootPath`、`webdavEnable`。
- 密钥仅存后端；桌面端（Tauri）可选保存在系统安全存储。

### 服务端实现
- 新增 `WebDAVService`：封装连接、`stat/list/get/put/delete`、`etag` 支持与指数退避重试。
- 新增路由：
  - `POST /api/sync/webdav/push`：根据本地增量（`updatedAt`）推送到 NAS。
  - `POST /api/sync/webdav/pull`：读取 `index.json`，拉取远端更新并合并到 DB。
  - `POST /api/sync/webdav/status`：返回上次同步时间、待处理数量、错误摘要。
- 同步 Job：
  - 定时/手动触发 Push/Pull；与现有任务框架整合（参考 `server/jobs/baseScheduleJob.ts`）。
  - 失败重试与告警（系统通知）。

### 同步与冲突策略
- 采用 `updatedAt` + `etag/hash` 比对，执行增量同步。
- 默认“最后写入覆盖”（Last-Write-Wins），保留另一版本到 `noteHistory`（`prisma.schema notes -> noteHistory`）。
- 冲突告警：在 UI 显示冲突提示，支持手动合并。
- 附件以内容哈希去重，避免重复上传。

### 安全与性能
- 后端保存 WebDAV 凭证，前端仅请求后端执行同步，避免凭证外泄。
- 大文件分块上传（必要时）；并发控制与限流；错误可恢复。

## 离线优先
### 现状
- 已支持离线创建与重连同步（`app/src/store/blinkoStore.tsx:129-176, 270-291`）。

### 改造要点
- 新增离线“更新/删除”队列：对已有 `id` 的编辑与删除在离线时写入队列；重连后批量 `upsert/delete`。
- 附件离线：上传失败时进入“待上传队列”，记录本地路径或 Blob，联网后自动补传。
- PWA 后台同步：利用 `service worker` 的 Background Sync/周期同步触发，消费前端 IndexedDB 队列。
- Tauri 桌面：监听网络变化事件，调用前端 `syncOfflineNotes` 并触发后端 WebDAV 同步；大文件优先使用桌面直连（可选）。
- 重试机制：指数退避、断点续传、错误可视化。

## 待办双向同步
### 格式约定
- Markdown 任务列表：`- [ ] 任务内容`、`- [x] 已完成`；忽略代码块内内容（与 `extractHashtags` 逻辑一致）。

### 映射策略（不新增表，使用 NoteType.TODO）
- 解析“普通笔记/闪念”正文中的待办项，映射为 `NoteType.TODO` 的笔记项：
  - 新建/更新 TODO 笔记，`content=任务文本`，`isArchived/isRecycle` 跟随源笔记；
  - 在 `metadata` 写入 `{ originNoteId, lineHash, position }`；
  - 与现有 Todo 视图直接兼容（`app/src/store/blinkoStore.tsx:327-342`）。

### 后端钩子
- 在 `notes.upsert` 成功后：
  - 解析正文生成任务清单；
  - 逐项用 `lineHash` 查找既有 TODO 笔记并 `upsert`；新增的生成新的 `NoteType.TODO`；被删除的标记为回收或删除；
  - 事务化处理确保一致性。
- 在更新 TODO 类型笔记时：
  - 若存在 `originNoteId`，回写源笔记正文对应行（勾选状态与文本），再次触发解析保证幂等。

### 前端呈现与交互
- “待办”列表无需改动（按 `NoteType.TODO` 加载）。
- 在笔记正文中勾选复选框时：触发 `upsert`，由后端解析映射；列表实时刷新。
- 在“待办”视图编辑任务文本/勾选状态：更新对应 TODO 笔记，后端回写源笔记，页面收到更新。

### 边界与去重
- 同行重复任务通过 `lineHash+position` 区分；跨移动行用近似匹配（文本哈希 + 最邻近位置）。
- 忽略代码块与引用块中的复选框；防止误识别。
- 支持 `hasTodo` 过滤（`server/routerTrpc/note.ts:185-192`）。

## 迁移与兼容
- 不改变表结构；以 Note 的 `metadata` 存放映射信息。
- 可选导出：在 WebDAV 上同时生成 `.md` 以便第三方编辑；后端 Pull 时解析 `.md` 与 `.json` 的差异。

## 验证计划
- 单元测试：
  - 解析器（Markdown 待办提取、`lineHash` 与回写）；
  - WebDAVService（Push/Pull、冲突处理）。
- 集成测试：
  - 离线创建/编辑/删除 → 重连同步；
  - “笔记”↔“待办”双向编辑一致性。
- 手验场景：
  - 大量附件同步；
  - 断网/重连、NAS 不可达、凭证错误、冲突提示。

## 风险与回滚
- 风险：远端第三方修改 `.md` 引入冲突；大文件传输失败；任务定位漂移。
- 缓解：保留 `noteHistory`（回溯）；记录冲突通知；分块/重试；近似定位策略与人工提示。
- 回滚：停用 `webdavEnable` 即刻停止外部同步；所有映射逻辑仅附加在 `metadata`，可清理。

## 交付与排期（建议）
- 第 1 周：后端 WebDAVService & Push；前端离线队列扩展（更新/删除/附件）。
- 第 2 周：Pull 与冲突；待办解析与 TODO 映射；双向回写。
- 第 3 周：PWA 周期同步与桌面网络监听；测试完善与性能调优；文档与配置面板（新增 WebDAV 配置项）。

## 参考点
- NoteType 定义：`shared/lib/types.ts:14-28`
- hasTodo 过滤：`server/routerTrpc/note.ts:185-192`
- 离线同步现状：`app/src/store/blinkoStore.tsx:129-176, 270-291`
- 备份任务参考：`server/jobs/dbjob.ts:35-76, 151-175`