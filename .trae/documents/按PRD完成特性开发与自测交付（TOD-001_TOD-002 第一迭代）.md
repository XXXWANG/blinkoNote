## 实施范围
- TOD-001：仅同步“任务清单”在“闪念/笔记”与“待办”间双向一致（后端已落地，联调与测试完善）。
- TOD-002：将“查看来源”ICON置于卡片右上角按钮行最前，低强调；跳转并锚定到源笔记任务行。
- 单元测试：为任务清单解析/lineHash新增测试；端到端在真实 Docker 环境自测。

## 代码改动
- 后端：将任务解析与lineHash计算抽到可测模块；`notes.upsert`继续在保存后执行“解析→映射”，更新TODO时执行“回写”。
- 前端：
  - 在 `app/src/components/BlinkoCard/cardHeader.tsx` 的右上角按钮行最前插入跳转 ICON（仅在有 `originNoteId+lineHash` 时显示，低强调样式）。
  - 继续保留锚点渲染与滚动高亮（`ListItem.tsx`、`detail/index.tsx`）。

## 测试与交付
- 单元测试：
  - 覆盖任务解析（忽略代码块）、lineHash稳定性。
- 真实 Docker 环境：
  - 构建镜像：`docker compose build --no-cache`；
  - 启动：`docker compose up -d`；
  - 冒烟用例：按 `docs/test/cases/TOD-001.md` 与 `TOD-002.md` 执行并记录结果；
  - 交付链接：`http://localhost:1111`。

## 输出物
- 代码改动（后端/前端）
- 单元测试报告摘要
- 容器状态与预览链接
- 在 `docs/PRD.md` 更新条目状态（进行中→验收中/已完成）

## 后续
- 下一迭代：按 PRD 推进 SYNC-001 与 OFF-001，并补充相应测试用例。