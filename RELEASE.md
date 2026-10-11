# Release 发布流程

正式版本通过 GitHub tag/Release 发布，GreasyFork 随后同步或手动更新。版本号以 `src/meta/userscript-header.js` 头部的 `// @version` 为准，正式发布的 tag 格式为 `v<@version>`。

## 发布脚本

两个脚本都会写入版本号、构建 userscript、同步 README 版本徽章、更新干员生成数据，检查通过后提交并上传。通过 `-Version` 指定版本号；省略时使用 `src/meta/userscript-header.js` 当前的 `// @version`。

### 上传并发布 Release

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tool/publish-release.ps1 -Version X.Y.Z
```

脚本会根据版本号生成 tag `vX.Y.Z`，提交发布文件，并推送当前分支和 tag。推送 tag 后，GitHub Release workflow 会创建 Release，并将 `Better-PRTS-Plus.user.js` 上传为发布附件。

### 上传但不发布 Release

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tool/upload-release.ps1 -Version X.Y.Z
```

脚本会提交并推送当前分支，不创建或推送 tag，也不会触发 GitHub Release。需要先上传发布准备改动，等待 CI 或人工确认时，使用这个脚本。

### 常用参数

- `-Branch main`：将当前 HEAD 推送到指定的远端分支，默认使用当前分支名。
- `-Remote origin`：指定远端，默认为 `origin`。
- `-CommitMessage "chore(release): vX.Y.Z"`：指定提交信息，替换默认值。
- `-SkipOperatorDataUpdate`：跳过干员生成数据的在线更新，使用现有数据重新构建并检查。
- `-DryRun`：执行构建、同步和检查，不执行 `git add`、提交、tag 或 push。

推送完成后，等待 GitHub Actions 创建 Release，确认发布附件中包含 `Better-PRTS-Plus.user.js`，再将 GreasyFork 同步或手动更新到对应版本。README 继续推荐从 GreasyFork 安装。

运行 `powershell -NoProfile -ExecutionPolicy Bypass -File tool/test-release.ps1` 可检查发布重试流程。检查使用离线数据源和临时本地 Git 远端，结束后自动清理。

## 发布门禁

- `tool/check.ps1` 检查 `src/` 拼接产物与 `Better-PRTS-Plus.user.js` 是否一致，并检查 userscript 语法、README 版本徽章、干员生成物与内嵌数据是否同步，以及已有安全约束。
- `tool/check-release.ps1 -Tag vX.Y.Z` 检查 tag 格式，要求 tag 版本与 userscript `@version` 完全一致。
- `tool/publish-release.ps1` 在本地调用 `tool/check-release.ps1`，并在提交前检查已有 tag。只有 tag 指向当前 HEAD 且发布文件没有改动时，脚本才会复用该 tag；否则需要使用新版本号。
- GitHub Release workflow 会在全部检查通过后创建 Release。tag 与 `@version` 不一致时，发布流程会在创建 Release 前停止。
- 带有预发布后缀的版本会在 GitHub Release 中标记为 prerelease。例如，`2.15.0-beta.1` 对应的 tag 是 `v2.15.0-beta.1`。

## Commit 规范与 Changelog

新提交应使用 Conventional Commits 格式：

```text
<type>[optional scope][!]: <description>
```

常用示例：

```text
feat(skland): 支持从森空岛导入干员数据
fix(import): parse JSON content before TXT fallback
chore(release): v2.16.0
```

允许的 type 有 `feat`、`fix`、`perf`、`refactor`、`docs`、`test`、`ci`、`build`、`chore`、`style`、`revert`。使用英文半角冒号 `:`，冒号后加一个空格。

GitHub Actions 会检查 PR 或推送到 main 时新增的提交，不检查旧提交。Release notes 根据符合规范的提交自动生成；需要写入 changelog 的变更，提交信息必须使用上述格式。

## 失败处理

- push 因网络问题或远端拒绝而失败时，解决问题后重跑相同命令，保持 `-Version` 不变。脚本会复用已有提交和匹配的 tag，继续推送尚未上传的分支或 tag；已上传的匹配 tag 会视为成功。
- 干员数据没有变化时，脚本会保留原审计记录，避免因时间戳变化而重复提交。已有发布 tag 时，重试会使用该次发布的数据，不再在线更新干员数据。
- 提交失败时，脚本会撤回本次暂存，保留工作区改动。解决提交错误后即可重跑。若进程被强制终止并留下暂存内容，请先检查并取消暂存，再重试。
- 已有 tag 指向其他提交，或发布文件发生改动时，脚本会在创建提交前停止。发布新内容需要使用新版本号。
- tag 写错且 Release 尚未生成时，删除本地和远端的错误 tag，再创建正确的 tag。
- Release 已经生成时，先在 GitHub 上确认错误 Release 和发布附件的状态，再删除错误 Release/tag 并重新发布。
- 手工上传 `Better-PRTS-Plus.user.js` 作为正式发布附件前，也必须通过本地检查。
