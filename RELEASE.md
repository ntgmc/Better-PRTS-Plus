# Release 发布流程

正式版本通过 GitHub tag/Release 发布，GreasyFork 随后同步或手动更新。版本号以 `src/meta/userscript-header.js` 头部的 `// @version` 为准，正式发布的 tag 格式为 `v<@version>`。

## 准备更新说明

每次发布前，由维护者在 `releases.json` 的 `releases` 数组中添加目标版本的记录，并保留历史记录：

```json
{
  "version": "下一次发布的版本号",
  "level": "normal",
  "notes": "维护者亲自填写的更新内容，可用换行分项说明。",
  "humanWritten": true
}
```

更新级别：`normal` 为普通功能和体验调整，`important` 为影响核心功能的变更或修复，`urgent` 为需要尽快安装的修复。级别由维护者判断。

更新说明可以使用 AI 辅助梳理或润色，但必须由维护者本人提供最终内容，不能完全由 AI 代写。确认后设置 `humanWritten: true`；这是维护者的声明，工具无法自动鉴别文字作者。清单初始为空，首次发布前需要补齐目标版本说明，不要求为接入前的历史版本补写。

### 获取 AI 参考摘要

参考 `goofish-infrast-v1` 的 `record-pr-changelog`，本仓库提供 **Summarize PR for Maintainer** 手动工作流（`.github/workflows/record-pr-changelog.yml`）。在 Actions 选择该工作流，使用 main 分支，填写 PR 编号后运行；可处理目标为 main 的未合并或已合并 PR。

运行前在仓库 Actions 设置中配置：

| 类型 | 名称 | 用途 |
| --- | --- | --- |
| Secret | `CHANGELOG_API_KEY` | AI 服务密钥，也兼容 `ANTHROPIC_API_KEY`。 |
| Variable | `CHANGELOG_MODEL` | 模型名称，也兼容 `ANTHROPIC_MODEL`。 |
| Secret 或 Variable | `CHANGELOG_BASE_URL` | 接口根地址，可包含 `/v1`；默认 `https://api.anthropic.com`，也兼容变量 `ANTHROPIC_BASE_URL`。 |
| Variable | `CHANGELOG_API_TYPE` | `message`、`response` 或 `chatcompletion`，默认 `message`；也可在每次运行时选择。 |

工作流按实际 PR diff 分段总结用户可见变化、修复和待核对事项，省略与 src 重复的 userscript 构建产物，并标出 PR Head SHA。GitHub 未提供 diff 的文件会标为需要人工核对。超大 PR 需要拆分，摘要被模型截断时本次运行失败。

结果位于 Actions 运行摘要和保留 14 天的 `ai-pr-编号-reference` 附件内，仅供维护者参考。工作流只读仓库与 PR，不执行 PR 代码、不写评论、不设置合并状态，也不会写入 `releases.json`、提交代码或发布 Release。维护者核对摘要后，亲自填写最终更新说明。运行时会将相关 PR diff 发送给所配置的 AI 服务。

## 发布脚本

两个脚本都会写入版本号、构建 userscript、同步 README 版本徽章，检查通过后提交并上传。资源由定时 CI 更新，发布时使用仓库中的生成数据。通过 `-Version` 指定版本号；省略时使用 `src/meta/userscript-header.js` 当前的 `// @version`。

### 上传并发布 Release

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tool/publish-release.ps1 -Version X.Y.Z
```

脚本会根据版本号生成 tag `vX.Y.Z`，提交发布文件，并推送当前分支和 tag。推送 tag 后，GitHub Release workflow 会创建 Release，并将 `Better-PRTS-Plus.user.js` 和 `update.json` 上传为发布附件。Release 正文与 `update.json` 均由 `tool/prepare-release.js` 读取维护者填写的说明生成，不再从提交记录自动撰写更新内容。

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

推送完成后，等待 GitHub Actions 创建 Release，确认发布附件中包含 `Better-PRTS-Plus.user.js` 和 `update.json`，再将 GreasyFork 同步或手动更新到对应版本。README 继续推荐从 GreasyFork 安装。

运行 `powershell -NoProfile -ExecutionPolicy Bypass -File tool/test-release.ps1` 可检查发布重试流程。检查使用离线数据源和临时本地 Git 远端，结束后自动清理。Check CI 在发布工具、版本说明校验逻辑、`releases.json`、`.githooks/` 或 `.github/workflows/` 变更时自动运行这套测试，首次推送或无法比较提交范围时也会运行；仅修改业务代码或文档时继续运行项目检查。离线发布测试步骤最多运行 5 分钟，可在 Actions 的步骤耗时中观察执行成本。

## 资源更新

`.github/workflows/update-resources.yml` 每 6 小时运行一次（北京时间 02:17、08:17、14:17、20:17），也可在 GitHub Actions 的 **Update resources** 页面手动运行。定时任务从 main 获取最新代码，下载上游干员和模组表，通过项目检查后，将变化提交回 main。数据没有变化时不提交，不修改脚本版本、不创建 tag 或 Release。[GitHub 定时任务说明](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

CI 调用 `tool/update-operator-data.ps1`，生成 `resources/data.json`，同时同步内置数据和 userscript 构建产物。JSON 的 `schemaVersion` 为 1，包含干员 `operators`、模组分支 `moduleTypes` 和正整数 `resourceVersion`。资源版本从 1 开始，仅在干员或模组内容变化时递增；相同内容重复生成会保留版本，恢复历史内容也会产生新版本。该版本同时写入内置数据，与脚本的 `@version` 独立。数据格式的兼容变更应调整 schemaVersion 和脚本加载逻辑。

安装支持热更新的脚本后，PRTS Plus 和森空岛页面启动时先加载油猴中的资源缓存，每小时检查 main 上的资源 JSON。缓存与下载均须通过版本校验：低于本页已加载版本的数据不会覆盖当前表，成功加载较新资源后也会提高版本下限。缺少版本的旧缓存会被忽略，并立即允许重新同步；旧格式下载响应同样不予采用。新增版本字段保留 schemaVersion 1，旧脚本可继续读取新资源。下载成功后更新本页数据和缓存，重新筛选作业并补齐已识别的新干员头像；全部下载源失败时保留已有数据。资源请求使用 `GM_xmlhttpRequest`，需要允许访问 `raw.githubusercontent.com`、`cdn.jsdelivr.net` 和 `gcore.jsdelivr.net`。[Tampermonkey 请求说明](https://www.tampermonkey.net/documentation.php#api:GM_xmlhttpRequest)

每次同步并发请求 GitHub Raw、jsDelivr 默认节点和 Gcore 节点，通过 `Promise.any` 使用首个返回 HTTP 200、文件大小合规、通过 JSON/schema 校验且版本不低于当前数据的响应，随后取消其余请求并清理计时器。每个请求保留 15 秒原生超时和独立计时器，不单独发送测速请求或保存节点排名。镜像读取同一仓库的 `main/resources/data.json`，分支内容可能受 CDN 缓存影响而延迟更新。实现参考 [kkocdko/user-scripts 的 race 片段（Unlicense）](https://github.com/kkocdko/user-scripts/blob/master/scripts/snippets/snippets.js)和 [sindresorhus/globals 的双源读取](https://github.com/sindresorhus/globals/blob/main/scripts/es-builtin.mjs)，复用并发择优和取消剩余请求的思路，沿用本项目的油猴请求、数据校验和缓存逻辑。

本地需要手动更新资源时仍可执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tool/update-operator-data.ps1
```

离线更新可通过 `-SourcePath` 和 `-ModuleSourcePath` 分别指定上游干员 JSON 和 `uniequip_table.json`。发布脚本不再接受 `-SkipOperatorDataUpdate`，也不会在线下载资源。

## 发布门禁

- `tool/check.ps1` 检查 `src/` 拼接产物与 `Better-PRTS-Plus.user.js` 是否一致，并检查 userscript 语法、README 版本徽章、干员生成物与内嵌数据是否同步，以及已有安全约束。干员组匹配由 `tool/test-core.js` 直接调用实际 JS 验证，覆盖候选重分配、固定干员占用和助战放行；检查脚本不再维护另一份匹配算法。
- `tool/check-release.ps1 -Tag vX.Y.Z` 检查 tag 格式，要求 tag 版本与 userscript `@version` 完全一致，并检查 `releases.json` 中存在对应版本、说明非空、级别有效且已确认 `humanWritten: true`。缺少任一项都会停止发布。
- `tool/publish-release.ps1` 在本地调用 `tool/check-release.ps1`，并在提交前检查已有 tag。只有 tag 指向当前 HEAD 且发布文件没有改动时，脚本才会复用该 tag；否则需要使用新版本号。
- GitHub Release workflow 会在全部检查通过后创建 Release。tag 与 `@version` 不一致或人工说明校验失败时，发布流程会在创建 Release 前停止。`update.json` 只包含不高于目标发布版本的记录，避免混入未来版本。
- 带有预发布后缀的版本会在 GitHub Release 中标记为 prerelease。例如，`2.15.0-beta.1` 对应的 tag 是 `v2.15.0-beta.1`。

## 脚本内更新提示

脚本在 PRTS Plus 和森空岛页面启动时检查正式 Release 的 `update.json`，之后每小时重新下载。请求使用 `GM_xmlhttpRequest`，需要允许 `github.com` 和 `release-assets.githubusercontent.com`。网络失败时不自动弹出错误，手动检查时会显示失败信息。

发现比当前 `GM_info.script.version` 更新的正式版时，弹窗展示所有中间版本说明，使用其中最高的更新级别；忽略预发布记录。同一页面每个新版本只自动提示一次，已有导入或确认窗口时延后显示，避免中断操作。

弹窗底部提供“仅重要更新提示”“当前版本不再提示”“立即更新”：前者保留重要和紧急提醒，可在悬浮球的“关于”子面板中恢复全部提醒；跳过版本会持久保存，只针对弹窗中的目标版本；立即更新通过 `GM_openInTab` 打开该 tag 的脚本附件，由油猴确认安装，刷新页面后生效。悬浮球 → 关于 → 检查脚本更新，绕过提醒偏好和跳过记录，可主动重新查看。

脚本头的 `@updateURL`、`@downloadURL` 指向最新正式 Release 的脚本附件，油猴自身的检查和自动安装由扩展设置控制。脚本中的提醒偏好只影响弹窗。干员与模组资源继续独立热更新。

设置主面板提供“作业卡片”“页面增强”“账号与数据”“关于”分类，各分类从设置外侧展开子面板，沿用原面板的滑动、缩放与淡入淡出动画，随悬浮球靠边方向向左或向右展开。空间不足时错开叠放并露出上一级边缘，系统减少动态效果时直接切换。同一时间展开一个分类，切换分类时收起上一块，保留各分类的设置和滚动位置。再次点击当前分类、收起按钮或 Escape 只收起子面板；点击整个区域外、关闭设置或拖动悬浮球会收起全部层级。“关于”展示当前安装版本、作者、开源协议及项目链接，并保留更新操作。手动检查发现新版本时，更新提示显示在所有面板上方，关闭后保留已展开的面板；自动更新提醒会等待当前分类收起后再显示。

### 调试预览更新弹窗

打开 PRTS Plus 页面的悬浮球设置，按住 **Shift** 点击面板顶部的“设置”，显示隐藏的“诊断”分类。打开“诊断”子面板，在“更新弹窗预览”下点击“普通更新”“重要更新”或“紧急更新”，即可反复查看对应级别的弹窗。已开启“兼容诊断”时，“诊断”分类默认显示。

预览使用真实弹窗和示例说明，三个按钮仅显示点击反馈，便于检查不同主题、窄屏换行和按钮布局；不会联网检查、修改提醒偏好、跳过真实版本或打开安装页。

PRTS Plus 和森空岛页面也可在开发者控制台执行 `window.BetterPRTSPlusDebug.previewScriptUpdate('important')`；参数可选 `normal`、`important`、`urgent`，默认 `important`。预览前需先关闭已有的导入或确认窗口。

## Commit 规范

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

GitHub Actions 会检查 PR 或推送到 main 时新增的提交，不检查旧提交。提交规范用于记录代码变更，正式更新内容由维护者在 `releases.json` 中提供。

## 失败处理

- push 因网络问题或远端拒绝而失败时，解决问题后重跑相同命令，保持 `-Version` 不变。脚本会复用已有提交和匹配的 tag，继续推送尚未上传的分支或 tag；已上传的匹配 tag 会视为成功。
- 干员数据没有变化时，资源更新脚本会保留原审计记录，避免因时间戳变化而重复提交。发布和重试均使用仓库中的已有数据。
- 提交失败时，脚本会撤回本次暂存，保留工作区改动。解决提交错误后即可重跑。若进程被强制终止并留下暂存内容，请先检查并取消暂存，再重试。
- 已有 tag 指向其他提交，或发布文件发生改动时，脚本会在创建提交前停止。发布新内容需要使用新版本号。
- tag 写错且 Release 尚未生成时，删除本地和远端的错误 tag，再创建正确的 tag。
- Release 已经生成时，先在 GitHub 上确认错误 Release 和发布附件的状态，再删除错误 Release/tag 并重新发布。
- 手工上传 `Better-PRTS-Plus.user.js` 作为正式发布附件前，也必须通过本地检查。
