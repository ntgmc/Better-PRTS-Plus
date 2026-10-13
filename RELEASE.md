# Release 发布流程

正式版本通过 GitHub tag/Release 发布，GreasyFork 随后同步或手动更新。版本号以 `src/meta/userscript-header.js` 头部的 `// @version` 为准，正式发布的 tag 格式为 `v<@version>`。

## 发布脚本

两个脚本都会写入版本号、构建 userscript、同步 README 版本徽章，检查通过后提交并上传。资源由定时 CI 更新，发布时使用仓库中的生成数据。通过 `-Version` 指定版本号；省略时使用 `src/meta/userscript-header.js` 当前的 `// @version`。

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
- `-DryRun`：执行构建、同步和检查，不执行 `git add`、提交、tag 或 push。

推送完成后，等待 GitHub Actions 创建 Release，确认发布附件中包含 `Better-PRTS-Plus.user.js`，再将 GreasyFork 同步或手动更新到对应版本。README 继续推荐从 GreasyFork 安装。

运行 `powershell -NoProfile -ExecutionPolicy Bypass -File tool/test-release.ps1` 可检查发布重试流程。检查使用离线数据源和临时本地 Git 远端，结束后自动清理。

## 资源更新

`.github/workflows/update-resources.yml` 每 6 小时运行一次（北京时间 02:17、08:17、14:17、20:17），也可在 GitHub Actions 的 **Update resources** 页面手动运行。定时任务从 main 获取最新代码，下载上游干员和模组表，通过项目检查后，将变化提交回 main。数据没有变化时不提交，不修改脚本版本、不创建 tag 或 Release。[GitHub 定时任务说明](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

CI 调用 `tool/update-operator-data.ps1`，生成 `resources/data.json`，同时同步内置数据和 userscript 构建产物。JSON 的 `schemaVersion` 为 1，包含干员 `operators` 和模组分支 `moduleTypes`；数据格式的兼容变更应调整 schemaVersion 和脚本加载逻辑。

安装支持热更新的脚本后，PRTS Plus 和森空岛页面启动时先加载油猴中的资源缓存，每小时检查 main 上的资源 JSON。下载成功后更新本页数据和缓存，重新筛选作业并补齐已识别的新干员头像；下载或校验失败时保留已有数据。资源请求使用 `GM_xmlhttpRequest`，需要允许访问 `raw.githubusercontent.com`。[Tampermonkey 请求说明](https://www.tampermonkey.net/documentation.php#api:GM_xmlhttpRequest)

本地需要手动更新资源时仍可执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tool/update-operator-data.ps1
```

离线更新可通过 `-SourcePath` 和 `-ModuleSourcePath` 分别指定上游干员 JSON 和 `uniequip_table.json`。发布脚本不再接受 `-SkipOperatorDataUpdate`，也不会在线下载资源。

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
- 干员数据没有变化时，资源更新脚本会保留原审计记录，避免因时间戳变化而重复提交。发布和重试均使用仓库中的已有数据。
- 提交失败时，脚本会撤回本次暂存，保留工作区改动。解决提交错误后即可重跑。若进程被强制终止并留下暂存内容，请先检查并取消暂存，再重试。
- 已有 tag 指向其他提交，或发布文件发生改动时，脚本会在创建提交前停止。发布新内容需要使用新版本号。
- tag 写错且 Release 尚未生成时，删除本地和远端的错误 tag，再创建正确的 tag。
- Release 已经生成时，先在 GitHub 上确认错误 Release 和发布附件的状态，再删除错误 Release/tag 并重新发布。
- 手工上传 `Better-PRTS-Plus.user.js` 作为正式发布附件前，也必须通过本地检查。
