# Release 发布流程

正式版本通过 GitHub tag/Release 发布，GreasyFork 随后同步或手动更新。版本号以 `src/meta/userscript-header.js` 头部的 `// @version` 为准，正式发布的 tag 格式为 `v<@version>`。

## 准备更新说明

先运行一条命令，创建空的更新说明文件，并自动登记到 `releases.json`，保留历史记录：

```sh
node tool/prepare-release.js --init X.Y.Z
```

默认级别为 `normal`；重要或紧急更新可在版本号后加 `important` 或 `urgent`，例如 `node tool/prepare-release.js --init X.Y.Z important`。版本号不带 `v`，对应的 Git tag 由发布脚本生成为 `vX.Y.Z`。

然后编辑 `release-notes/X.Y.Z.md`。重复运行初始化命令会保留已有记录、级别和正文；需要调整已登记的级别时，直接修改 `releases.json` 中对应的 `level`。

也可直接运行发布命令：目标版本尚未登记时，脚本会按普通更新生成文件并停止，提示填写说明；填完后重跑相同命令即可。空文件不会通过发布检查。

按实际变化填写“新增”“优化”“修复”等分类，没有内容的分类直接省略：

```markdown
### 新增

- 新功能的用途和使用方式。

### 优化

- 已有功能的体验改进。

### 修复

- 修复的问题及影响。
```

GitHub Release 直接使用这份 Markdown。脚本更新弹窗支持分类标题、有序和无序列表、**粗体**、*斜体*、行内代码、HTTP(S) 链接，以及普通文本和换行。HTML 会作为文字显示，更复杂的 Markdown 排版可前往 GitHub 查看。

`releases.json` 中的记录只需版本号、更新级别和 Markdown 路径，初始化命令会自动填写：

```json
{
  "version": "X.Y.Z",
  "level": "normal",
  "notesFile": "release-notes/X.Y.Z.md"
}
```

路径必须位于 `release-notes/` 目录内，以 `.md` 结尾。发布工具会读取文件，将正文写入 Release 和 `update.json` 的 `notes` 字段；更新附件包含完整说明，脚本无需另行下载 `.md`。旧记录仍可直接使用字符串 `notes`，但同一记录不能同时填写 `notes` 和 `notesFile`。

更新级别：`normal` 为普通功能和体验调整，`important` 为影响核心功能的变更或修复，`urgent` 为需要尽快安装的修复。级别由维护者判断。

最终更新内容由维护者提供，AI 可辅助梳理或润色。无需填写额外的作者确认字段。为兼容已安装的旧脚本，生成的 `update.json` 会自动附带 `humanWritten: true`。

发布只读取目标版本及更早版本的说明，未来版本的草稿不会阻止当前版本发布。接入前的历史版本无需补写。

### 获取 AI 参考摘要

在 Actions 选择 **Summarize Changes for Maintainer** 手动工作流（`.github/workflows/record-pr-changelog.yml`），使用 main 分支。主要用于发布前对比上一版本与 main，梳理尚未发布的变化：

- `summary_type` 默认 `release`：将最新正式 GitHub Release 的 tag 与 main 对比，无需填写 PR 编号。
- `base_tag` 可指定基准版本，例如 `v3.10.1`；留空自动使用最新正式 Release。尚无正式 Release 时，需填写已有的版本 tag。
- 单独分析 PR 时，将 `summary_type` 改为 `pr` 并填写 `pull_request_number`；支持目标为 main 的未合并或已合并 PR，此时忽略 `base_tag`。

运行前在仓库 Actions 设置中配置：

| 类型 | 名称 | 用途 |
| --- | --- | --- |
| Secret | `CHANGELOG_API_KEY` | AI 服务密钥，也兼容 `ANTHROPIC_API_KEY`。 |
| Variable | `CHANGELOG_MODEL` | 模型名称，也兼容 `ANTHROPIC_MODEL`。 |
| Secret 或 Variable | `CHANGELOG_BASE_URL` | 接口根地址，可包含 `/v1`；默认 `https://api.anthropic.com`，也兼容变量 `ANTHROPIC_BASE_URL`。 |
| Variable | `CHANGELOG_API_TYPE` | `message`、`response` 或 `chatcompletion`，默认 `message`；也可在每次运行时选择。 |

工作流先将文件 diff 分块，逐块提取变化，再由 AI 合并同类项、去掉重复内容，生成总摘要。各分块只总结变化，最后根据整体影响判断普通、重要或紧急级别，并说明理由。只有一个分块时也会执行最后的汇总；没有文件变化时不调用 AI。

分析时会省略与 src 重复的 userscript 构建产物。版本模式先确定基准 tag 和 main 对应的提交 SHA，再比较这两个提交；基准版本必须是 main 的祖先。摘要会标出基准版本及 Base/Head SHA，PR 模式则标出 PR Head SHA。

Actions 日志显示 GitHub 读取阶段、文件数、diff 大小、分块进度，以及各次 AI 请求的接口类型、模型、输入规模、token 用量（服务返回时）、结束状态和耗时。失败时显示具体阶段及 HTTP 状态、超时、响应格式或截断原因。

GitHub 未提供 diff 的文件会标为需要人工核对。GitHub Compare 最多返回 300 个文件，版本模式达到该上限时会停止，避免输出不完整摘要；PR 模式通过分页读取文件并校验数量。超大 diff 或模型截断也会停止，需要缩小范围后重试。

结果会显示在 Actions 运行摘要中，也会保存到 `ai-release-reference` 或 `ai-pr-reference` 附件，保留 14 天。结果包含汇总后的变更说明和整体更新级别；汇总失败时，工作流也会失败。运行过程中，所选范围的 diff 和分块摘要会发送给你配置的 AI 服务。

## 发布脚本

以下两个脚本都会写入版本号、构建 userscript、同步 README 版本徽章，检查通过后提交并推送。`releases.json` 和 `release-notes/` 会一起提交，无需提前单独 commit。运行前请先提交已有的暂存内容，或取消暂存。资源由定时 CI 更新，发布时使用仓库中的生成数据。通过 `-Version` 指定版本号；省略时使用 `src/meta/userscript-header.js` 当前的 `// @version`。正式发布会先检查说明，缺少正文时停止，不修改版本号或执行 Git 提交。

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
- `tool/check-release.ps1 -Tag vX.Y.Z` 检查 tag 格式，要求 tag 版本与 userscript `@version` 完全一致，并检查对应版本的说明文件可读、正文非空、级别有效，以及版本记录无重复。缺少任一项都会停止发布。
- `tool/publish-release.ps1` 在本地调用 `tool/check-release.ps1`，并在提交前检查已有 tag。只有 tag 指向当前 HEAD 且发布文件没有改动时，脚本才会复用该 tag；否则需要使用新版本号。
- GitHub Release workflow 会在全部检查通过后创建 Release。tag 与 `@version` 不一致或更新说明校验失败时，发布流程会在创建 Release 前停止。`update.json` 只包含不高于目标发布版本的记录。
- 带有预发布后缀的版本会在 GitHub Release 中标记为 prerelease。例如，`2.15.0-beta.1` 对应的 tag 是 `v2.15.0-beta.1`。

## 脚本内更新提示

脚本在 PRTS Plus 和森空岛页面启动时检查正式 Release 的 `update.json`，之后每小时重新下载。更新检查与干员资源复用同一个并发下载函数，同时请求 GitHub Release 原站、GH-Proxy（`gh-proxy.com`）和 GHFast（`ghfast.top`），采用首个返回 HTTP 200、文件不超过 1 MiB 且通过 JSON 与更新说明校验的响应，随后取消其余请求并清理计时器；各请求均有 15 秒原生超时和独立计时器。低于当前安装版本或本页已检测到的正式版本的说明不会被采用。Release 附件无法使用现有 jsDelivr 仓库文件节点代理，因此更新镜像代理同一个 `releases/latest/download/update.json`，不读取 main 分支上可能尚未发布的说明。

请求使用 `GM_xmlhttpRequest`，需要允许 `github.com`、`release-assets.githubusercontent.com`、`gh-proxy.com` 和 `ghfast.top`。全部下载源失败时不自动弹出错误，手动检查时会显示失败信息。

发现比当前 `GM_info.script.version` 更新的正式版时，弹窗展示所有中间版本说明，使用其中最高的更新级别；忽略预发布记录。同一页面每个新版本只自动提示一次，已有导入或确认窗口时延后显示，避免中断操作。

弹窗底部提供三个按钮：

- “仅重要更新提示”：以后只提醒重要和紧急更新，可在悬浮球 → 关于中恢复全部提醒。
- “当前版本不再提示”：记住跳过的版本，只跳过弹窗中的目标版本。
- “立即更新”：通过 `GM_openInTab` 打开该 tag 的脚本附件，在油猴中确认安装，刷新页面后生效。

通过悬浮球 → 关于 → 检查脚本更新，可手动重新查看更新，不受提醒偏好和已跳过版本的限制。

脚本头的 `@updateURL`、`@downloadURL` 指向最新正式 Release 的脚本附件，油猴自身的检查和自动安装由扩展设置控制。脚本中的提醒偏好只影响弹窗。干员与模组资源继续独立热更新。

设置主面板提供“作业卡片”“页面增强”“账号与数据”“关于”分类。各分类从设置面板外侧展开子面板，沿用原面板的滑动、缩放和淡入淡出动画，根据悬浮球的位置向左或向右展开。空间不足时错开叠放，露出上一级边缘；系统开启减少动态效果时，面板直接切换。

每次只展开一个分类，切换时收起上一个，保留各分类的设置和滚动位置。再次点击当前分类、点击收起按钮或按 Escape，只收起子面板；点击所有面板之外的区域、关闭设置或拖动悬浮球，会收起全部面板。

“关于”显示当前安装版本、作者、开源协议和项目链接，也可在此检查更新。手动检查发现新版本时，更新弹窗显示在所有面板上方，关闭后保留已展开的面板；自动更新提醒会等当前分类收起后再显示。

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

GitHub Actions 会检查 PR 或推送到 main 时新增的提交，不检查旧提交。提交规范用于记录代码变更，正式更新内容由维护者在 `release-notes/<版本号>.md` 中提供。

## 失败处理

- push 因网络问题或远端拒绝而失败时，解决问题后重跑相同命令，保持 `-Version` 不变。脚本会复用已有提交和匹配的 tag，继续推送尚未上传的分支或 tag；已上传的匹配 tag 会视为成功。
- 干员数据没有变化时，资源更新脚本会保留原审计记录，避免因时间戳变化而重复提交。发布和重试均使用仓库中的已有数据。
- 提交失败时，脚本会撤回本次暂存，保留工作区改动。解决提交错误后即可重跑。若进程被强制终止并留下暂存内容，请先检查并取消暂存，再重试。
- 已有 tag 指向其他提交，或发布文件发生改动时，脚本会在创建提交前停止。发布新内容需要使用新版本号。
- tag 写错且 Release 尚未生成时，删除本地和远端的错误 tag，再创建正确的 tag。
- Release 已经生成时，先在 GitHub 上确认错误 Release 和发布附件的状态，再删除错误 Release/tag 并重新发布。
- 手工上传 `Better-PRTS-Plus.user.js` 作为正式发布附件前，也必须通过本地检查。
