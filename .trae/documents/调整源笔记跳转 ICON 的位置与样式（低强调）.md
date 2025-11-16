## 目标
- 在工程根目录新增 `/docs` 作为文档统一入口，纳入 PRD 与测试文档，后续所有需求与验收仅以该处为准。

## 文档结构
- `/docs/PRD.md`：主PRD（持续更新）
  - 概述、范围、非目标、用户场景
  - 需求列表（TOD-001、TOD-002、SYNC-001、OFF-001），含描述、验收标准、状态
  - 逻辑与数据（接口与数据结构要点）
  - 边界与异常、里程碑与变更记录
- `/docs/test/TEST-PLAN.md`：总测试计划
  - 覆盖范围、测试类型（单元/端到端）、环境前置（Docker）
  - 执行命令与报告产出规范
- `/docs/test/cases/TOD-001.md`：任务清单双向同步用例
- `/docs/test/cases/TOD-002.md`：源笔记跳转与锚定用例
- `/docs/test/cases/SYNC-001.md`：WebDAV同步用例
- `/docs/test/cases/OFF-001.md`：离线增强用例
- `/docs/DEPLOYMENT.md`：Docker 本地构建与运行指南（含 Windows PowerShell 命令）
- （可选）`/docs/CHANGELOG.md`：变更记录与版本日志

## 维护规则
- 所有需求、变更与完成情况只在 `/docs/PRD.md` 更新；提交时保持状态同步（未开始/进行中/已完成/验收中）。
- 每个特性完成后在对应 `/docs/test/cases/*.md` 记录测试结果（通过/失败与原因）。
- 交付时附测试报告摘要与预览链接。

## 后续动作
- 我将创建上述文档框架并写入当前已确认的需求与测试清单；后续每次迭代按此文档更新与交付。