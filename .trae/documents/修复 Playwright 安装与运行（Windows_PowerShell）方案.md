## 目标
- 在你的本机完成 Playwright 浏览器资源的正确安装，使端到端测试可以在真实 Docker 环境下运行。

## 方案
### 1) 本地安装测试框架
- 在仓库根目录执行：
  - `npm i -D @playwright/test`
  - 验证：`npx playwright --version`

### 2) 安装浏览器资源（Chromium）
- 默认路径：`%LOCALAPPDATA%\ms-playwright`
- 执行安装：
  - `npx playwright install chromium`
  - 若网络/权限导致安装未下载到默认路径：
    - 设置浏览器缓存路径（一次性）：`setx PLAYWRIGHT_BROWSERS_PATH "%LOCALAPPDATA%\ms-playwright"`
    - 强制重装：`npx playwright install --force chromium`

### 3) 代理/网络兼容
- 如果你的环境启用了 HTTP/HTTPS 代理（Docker 信息显示存在代理），在执行安装前设置：
  - `setx HTTP_PROXY http://http.docker.internal:3128`
  - `setx HTTPS_PROXY http://http.docker.internal:3128`
- 然后重开终端或 `RefreshEnv` 后重新执行安装。

### 4) 校验与修复
- 校验浏览器目录存在：`dir "%LOCALAPPDATA%\ms-playwright"`
- 校验可执行：`Test-Path "$env:LOCALAPPDATA\ms-playwright\chromium*\chrome-win\headless_shell.exe"`
- 若仍缺失：
  - 清理残留：删除 `%LOCALAPPDATA%\ms-playwright` 再执行第2步强制安装

### 5) 最小运行验证
- 启动浏览器导航主页（我这边用脚本驱动）：
  - 访问 `http://localhost:1111/` 并截图首页
  - 若成功，继续编写并运行 TOD-001/TOD-002 的端到端场景

## 交付
- 我将按上述步骤在你的环境执行，并在完成后提供：
  - 安装日志与校验输出
  - 首页访问截图
  - 后续端到端测试的断言结果与截图（TOD-001/TOD-002）

请确认，我将立即开始执行这些命令并修复 Playwright 安装。