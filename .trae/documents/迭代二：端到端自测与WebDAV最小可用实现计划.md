## 目标
- TOD-001/TOD-002：补充端到端测试并在现有 Docker 环境跑测，记录报告；完成 PRD 标记。
- SYNC-001：实现 WebDAV 最小可用（Push/Pull + 配置），在 Docker 环境联调与自测。

## 端到端测试（TOD-001/TOD-002）
1) Playwright 编写场景：
- 访问 `http://localhost:1111`，创建含两段任务清单的笔记 → 进入“待办”断言生成两条。
- 在笔记勾选/编辑任务 → “待办”对应更新；在“待办”编辑 → 笔记对应任务行更新。
- 待办卡片右上角 ICON 点击 → 新窗口 `detail?id=&anchor=`，滚动居中与高亮。
2) 执行与报告：在本机对已启动的 Docker 服务执行测试，输出断言结果与截图；更新 `docs/test/cases/TOD-001.md`、`TOD-002.md` 与 `docs/PRD.md` 状态。

## WebDAV 最小可用实现（SYNC-001）
1) 后端：
- 新增 `WebDAVService`：连接、`stat/list/get/put/delete`、错误重试。
- 配置项：`webdavUrl/webdavUsername/webdavPassword/webdavRootPath/webdavEnable`（沿用 Config 表）。
- 路由：`POST /api/sync/webdav/push`、`POST /api/sync/webdav/pull`、`GET /api/sync/webdav/status`。
- 同步策略：`updatedAt + etag/hash` 增量；Last-Write-Wins；保留 noteHistory。
2) 构建与联调：
- 更新 Docker 镜像；在你的本机对接极空间 NAS，执行 Push/Pull 并记录结果。
- 更新 `docs/test/cases/SYNC-001.md`。

## 交付
- 提交端到端测试脚本与报告；
- 提交 WebDAV 最小实现与 Docker 自测报告；
- 更新 `docs/PRD.md` 与用例文档状态。