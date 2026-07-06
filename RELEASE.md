# Release 发布流程

本项目以 GitHub tag/Release 作为权威发布入口，GreasyFork 作为分发渠道跟随同步或手动更新。版本源是 `src/meta/userscript-header.js` 头部的 `// @version`，正式发布 tag 必须写成 `v<@version>`。

## 发布脚本

两个脚本都会自动完成版本写入、userscript 构建、README 版本徽章同步、干员生成数据更新、发布前检查、提交和上传。`-Version` 只需要填写一次；如果省略，则使用 `src/meta/userscript-header.js` 当前的 `// @version`。

### 上传并发布 Release

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tool/publish-release.ps1 -Version X.Y.Z
```

该脚本会自动推导 tag `vX.Y.Z`，提交发布文件，推送当前分支和 tag。tag 推送后会触发 GitHub Release workflow，并上传 `Better-PRTS-Plus.user.js` 作为 Release asset。

### 上传但不发布 Release

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tool/upload-release.ps1 -Version X.Y.Z
```

该脚本只提交并推送当前分支，不创建或推送 tag，因此不会触发 GitHub Release。适合先上传发布准备改动、等待 CI 或人工确认。

### 常用参数

- `-Branch main`：把当前 HEAD 推送到指定远端分支；默认使用当前分支名。
- `-Remote origin`：指定远端；默认是 `origin`。
- `-CommitMessage "chore(release): vX.Y.Z"`：覆盖默认提交信息。
- `-SkipOperatorDataUpdate`：跳过在线更新干员生成数据，仅重新构建并检查现有数据。
- `-DryRun`：执行构建、同步和检查，但不执行 `git add`、提交、tag 或 push。

发布完成后，等待 GitHub Actions 创建 Release，并确认 Release asset 中包含 `Better-PRTS-Plus.user.js`。GreasyFork 按 GitHub Release 对应版本同步或手动更新；README 中的 GreasyFork 推荐安装入口保持不变。

## 发布门禁

- `tool/check.ps1` 会检查 `src/` 拼接产物是否与 `Better-PRTS-Plus.user.js` 一致、userscript 语法、README 版本徽章、干员生成物与内嵌数据同步状态，以及已有安全约束。
- `tool/check-release.ps1 -Tag vX.Y.Z` 会检查 tag 格式，并要求 tag 版本与 userscript `@version` 完全一致。
- `tool/publish-release.ps1` 会在本地调用 `tool/check-release.ps1`，并拒绝复用已经存在的远端 tag。
- GitHub Release workflow 会先运行全部检查，再创建 Release；如果 tag 与 `@version` 不一致，发布会在创建 Release 前失败。
- 如果版本带有预发布后缀，例如 `2.15.0-beta.1`，对应 tag 为 `v2.15.0-beta.1`，GitHub Release 会标记为 prerelease。

## Commit 规范与 Changelog

所有新提交都应使用 Conventional Commits 格式：

```text
<type>[optional scope][!]: <description>
```

常用示例：

```text
feat(skland): 支持从森空岛导入干员数据
fix(import): parse JSON content before TXT fallback
chore(release): v2.16.0
```

允许的 type 包括 `feat`、`fix`、`perf`、`refactor`、`docs`、`test`、`ci`、`build`、`chore`、`style`、`revert`。冒号必须使用英文半角 `:`，并且冒号后需要有一个空格。

GitHub Actions 会检查 PR 或 main push 中新增的提交，不追溯旧历史。Release notes 会由符合规范的提交自动生成；如果某个变更必须出现在 changelog 中，提交信息必须使用上面的格式。

## 失败处理

- 如果 tag 写错但 Release 还没有生成，删除本地和远端错误 tag 后重新创建正确 tag。
- 如果 Release 已经生成，先在 GitHub 上确认错误 Release 和资产状态，再删除错误 Release/tag 并重新发布。
- 不要绕过检查把本地未校验的 `Better-PRTS-Plus.user.js` 手工上传为正式发布资产。
