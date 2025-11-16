# SYNC-001 WebDAV 同步测试用例

## 用例1：Push 增量
- 步骤：配置 WebDAV；执行 Push
- 期望：`notes/*.json/.md` 与附件上传；按 `updatedAt+etag/hash` 增量，无重复

## 用例2：Pull 合并
- 步骤：远端修改后执行 Pull
- 期望：合并到本地；Last-Write-Wins；另一版本保留到 `noteHistory` 并通知

## 用例3：冲突与重试
- 步骤：模拟并发写入与异常网络
- 期望：产生冲突提示；失败任务重试成功

## 用例4：断网重连自动增量
- 步骤：断网后编辑与附件上传；恢复网络
- 期望：自动增量同步成功

