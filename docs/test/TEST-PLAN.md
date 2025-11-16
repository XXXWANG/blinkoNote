# 测试总计划

## 范围
- 单元测试：解析、映射与回写逻辑；WebDAV Service；离线队列
- 端到端：在真实 Docker 环境访问 `http://localhost:1111` 验证 UI 与数据一致性

## 环境前置
- Docker Desktop 运行，镜像使用仓库 `dockerfile` 构建（非官方镜像）
- 启动命令：
  - 构建：`docker compose build --no-cache`
  - 启动：`docker compose up -d`
  - 状态：`docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"`

## 执行
- 单元测试：`bun test`（后端与通用逻辑）
- 端到端：Playwright 脚本运行，断言页面行为与元素状态

## 报告
- 输出：单元测试通过率、端到端步骤断言结果（必要时截图）、容器健康状态与预览链接
- 结论：按 PRD 条目逐条标记通过/失败，并记录失败原因与修复计划

