# Docker 本地构建与运行

## 前置
- 安装并启动 Docker Desktop（Windows）

## 构建与启动
- 构建镜像：`docker compose build --no-cache`
- 启动容器：`docker compose up -d`
- 查看状态：`docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"`
- 预览地址：`http://localhost:1111`

## 常见问题
- 端口被占用：修改映射端口或释放占用进程
- 构建失败：检查网络代理与镜像拉取，可重试 `--no-cache`
- 容器健康检查失败：查看日志并确认 `.env` 与数据库连通

## 清理
- 停止并移除：`docker rm -f blinko-website blinko-postgres`
- 重新构建与启动：重复上述命令

