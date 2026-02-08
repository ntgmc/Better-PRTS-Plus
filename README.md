# Better-PRTS-Plus

<div align="center">

[![Version](https://img.shields.io/badge/version-2.9.0-blue)]()
[![License](https://img.shields.io/badge/license-GPL--3.0-red)](LICENSE)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-Supported-green)]()
[![Greasy Fork](https://img.shields.io/badge/GreasyFork-发布页-orange)](https://greasyfork.org/zh-CN/scripts/558329-better-prts-plus)

**[PRTS Plus (zoot.plus)](https://zoot.plus) 的全方位体验增强脚本**

集成深度配置中心、智能干员筛选与界面视觉重构。<br/>让抄作业变得更护眼、更高效、更直观。

[安装脚本](#-安装方法) · [报告问题](https://github.com/ntgmc/Better-PRTS-Plus/issues)

</div>

---

## 📸 效果预览

![Image](https://github.com/user-attachments/assets/00640304-eb59-43e4-90ee-584701cec319)

## ✨ 核心功能

### 1. 🎨 极致视觉重构
拒绝枯燥的纯文字列表，让作业卡片焕然一新。
- **干员头像可视化**：自动将干员文字标签转换为 **高清头像**，阵容搭配一目了然。
- **原生级气泡交互**：支持在气泡弹窗或悬浮层中以网格形式显示完整干员阵容与技能等级。
- **智能关卡徽章**：自动提取标题中的关卡代号（如 `H13-4`），生成醒目的关卡徽章，并智能清洗标题冗余信息。
- **信息降噪**：自动优化描述文本显示，将 Bilibili 链接转化为简洁的 **▶ 参考视频** 按钮，支持鼠标悬停自动展开详细描述。

### 2. 🔍 智能持有筛选
根据您的练度数据，精准筛选“抄得起”的作业。
- **完美阵容**：一键筛选出您拥有所有核心干员的作业。
- **助战模式**：允许缺失 1 名干员（默认借用助战），并在卡片底部高亮标记缺口明细。
- **灵活视图**：提供 **“置灰”**（视觉降级）或 **“隐藏”**（完全不显示）两种过滤模式。

### 3. 🛠️ 交互体验优化
- **侧边栏净化**：默认折叠“创作工具”，将“站务公告”简化为紧凑按钮，并美化公告弹窗内的 **[更新]**、**[维护]** 标签。
- **配置中心**：集成 **可拖拽悬浮球**，支持实时管理功能开关，并快速导入干员练度数据。
- **深色模式增强**：基于网站原生深色模式，深度修复 Blueprint UI 及第三方组件的配色 Bug。

## 🚀 安装方法

推荐使用 **Tampermonkey** (油猴) 扩展进行安装。

| 渠道 | 说明 | 链接 |
| :--- | :--- | :--- |
| **Greasy Fork** | (推荐) 支持自动更新 | [**点击安装**](https://greasyfork.org/zh-CN/scripts/558329-better-prts-plus) |
| **GitHub** | 开发者版本 | [**点击安装**](https://github.com/ntgmc/Better-PRTS-Plus/raw/main/Better-PRTS-Plus.user.js) |

## 📖 使用指南

### 第一步：导入干员数据
1.  进入 [zoot.plus](https://zoot.plus) 作业列表页。
2.  点击页面右侧的 **⚙️ 悬浮球** 或筛选栏的 **“📂 导入干员”** 按钮。
3.  上传包含干员名称的 `.json` 或 `.txt` 文件。

> **💡 数据源提示**：
> 支持 [MAA](https://github.com/MaaAssistantArknights/MaaAssistantArknights) 导出的 JSON 格式。
> 您也可以使用纯文本格式，每行一个干员名称。

### 第二步：使用筛选
*   **筛选模式**：点击筛选栏的 **[完美阵容]** 或 **[允许助战]** 按钮。
*   **视图切换**：点击 **[置灰模式/隐藏模式]** 按钮，决定不合格作业的显示方式。

### 第三步：个性化设置
*   **悬浮球**：点击右侧悬浮球展开控制面板，可按需开启或关闭“描述自动展开”、“侧边栏净化”等功能。

## 🔗 致谢与溯源

本项目基于以下开源项目合并重构并深度增强：

*   **PRTS Plus (zoot.plus)**: 原站优秀的作业平台
*   **ntgmc/PRTS-Plus-Filter**: 初期筛选逻辑参考

## 📄 License

本项目基于 [GPL-3.0](LICENSE) 协议开源。
任何基于本脚本的修改或衍生作品必须以相同的 GPL-3.0 协议开源。

---
<div align="center">
Made with ❤️ by 一只摆烂的42
</div>