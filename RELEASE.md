# Release 发布流程

本项目以 GitHub tag/Release 作为权威发布入口，GreasyFork 作为分发渠道跟随同步或手动更新。版本源是 `Better-PRTS-Plus.user.js` 头部的 `// @version`，正式发布 tag 必须写成 `v<@version>`。

## 发布步骤

1. 修改 `Better-PRTS-Plus.user.js` 头部的 `// @version`。
2. 同步 README 版本徽章：
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File tool/sync-readme-version.ps1
   ```
3. 运行发布前检查：
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File tool/check.ps1
   ```
4. 提交版本变更，例如：
   ```powershell
   git add Better-PRTS-Plus.user.js README.md
   git commit -m "release: vX.Y.Z"
   ```
5. 创建并推送 tag：
   ```powershell
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin main vX.Y.Z
   ```
6. 等待 GitHub Actions 创建 Release，并确认 Release asset 中包含 `Better-PRTS-Plus.user.js`。
7. GreasyFork 按 GitHub Release 对应版本同步或手动更新；README 中的 GreasyFork 推荐安装入口保持不变。

## 发布门禁

- `tool/check.ps1` 会检查 userscript 语法、README 版本徽章、干员表和已有安全约束。
- `tool/check-release.ps1 -Tag vX.Y.Z` 会检查 tag 格式，并要求 tag 版本与 userscript `@version` 完全一致。
- GitHub Release workflow 会先运行全部检查，再创建 Release；如果 tag 与 `@version` 不一致，发布会在创建 Release 前失败。
- 如果版本带有预发布后缀，例如 `2.15.0-beta.1`，对应 tag 为 `v2.15.0-beta.1`，GitHub Release 会标记为 prerelease。

## 失败处理

- 如果 tag 写错但 Release 还没有生成，删除本地和远端错误 tag 后重新创建正确 tag。
- 如果 Release 已经生成，先在 GitHub 上确认错误 Release 和资产状态，再删除错误 Release/tag 并重新发布。
- 不要绕过检查把本地未校验的 `Better-PRTS-Plus.user.js` 手工上传为正式发布资产。
