# 🚀 Better-PRTS-Plus

<div align="center">

![Version](https://img.shields.io/badge/Version-2.12.3-blue.svg?style=flat-square)
![License](https://img.shields.io/badge/License-GPL--3.0-red.svg?style=flat-square)
![Platform](https://img.shields.io/badge/Platform-Tampermonkey-green.svg?style=flat-square)
[![GreasyFork](https://img.shields.io/badge/Release-GreasyFork-orange.svg?style=flat-square)](https://greasyfork.org/zh-CN/scripts/558329-better-prts-plus)

**[整合版] 为 [prts.plus](https://prts.plus) 打造的深度增强脚本**

集成了多账号无缝切换、完美作业筛选、干员头像可视化及深度暗黑模式适配。
让你的“抄作业”体验从未如此直观、丝滑。

[安装脚本](#-快速安装) · [功能特性](#-核心功能) · [使用指南](#-使用教程) · [问题反馈](https://github.com/ntgmc/Better-PRTS-Plus/issues)

</div>

---

## ✨ 核心功能

### 1. 🖼️ 作业卡片增强 (Visual Enhancement)
*   **干员头像展示**：将作业中的干员文本自动替换为头像网格，阵容需求更直观。
*   **关卡信息提取**：自动识别标题中的关卡编号（如 `7-18`, `H13-4`），并生成清晰的关卡徽章。
*   **描述与链接整理**：压缩冗长描述，将 Bilibili 链接整理为 **“参考视频”** 按钮，页面更清爽。

### 2. 🔍 持有干员筛选 (Perfect Filter)
*   **完美阵容**：只保留您已拥有全部所需干员的作业。
*   **允许助战**：保留最多缺少 1 名干员的作业，方便通过好友助战补齐。
*   **缺失提示**：在卡片上标记 **“缺 X 人”** 或 **“需助战：[干员名]”**，不用手动核对阵容。
*   **结果处理**：不符合条件的作业可选择置灰保留，也可以直接隐藏。

### 3. 👥 多账号数据管理 (Multi-Account)
*   **三组账号档位**：可保存 3 份独立干员数据，适合多账号切换。
*   **一键切换**：可在筛选栏或悬浮球面板快速切换当前账号，无需反复导入文件。
*   **配置同步**：开关状态和账号数据随油猴存储保存，刷新页面后仍能保留。

### 4. 🌙 界面净化与深色适配
*   **深色模式增强**：优化 PRTS Plus 的深色显示体验，并提供高对比模式以改善阅读舒适度。
*   **侧边栏净化**：折叠低频使用区域，让作业列表占据更多可视空间。
*   **公告美化**：为站务公告增加分类标签，更新、维护、活动信息更容易扫读。
*   **悬浮设置面板**：通过页面侧边悬浮球快速开关功能，不必进入额外设置页。

---

## 📦 快速安装

1.  安装浏览器扩展 [Tampermonkey](https://www.tampermonkey.net/) (油猴)。
2.  点击下方链接进入发布页：
    *   👉 [**GreasyFork 发布页 (推荐)**](https://greasyfork.org/zh-CN/scripts/558329-better-prts-plus)
    *   👉 [**GitHub 源码安装**](https://github.com/ntgmc/Better-PRTS-Plus/raw/main/Better-PRTS-Plus.user.js)
3.  点击“安装脚本”即可。

---

## 📖 使用教程

### 第一步：导入您的干员数据
1.  点击页面右侧的 **⚙️ 悬浮球**。
2.  点击 **“📂 导入干员数据”**。
3.  上传包含您已拥有干员名称的 `.json` 或 `.txt` 文件。
    > **提示**：脚本兼容 MAA 导出的 JSON 格式。您也可以新建一个 TXT，每行写一个干员名字进行批量导入。

### 第二步：开启智能筛选
1.  在作业列表上方的搜索框下方，会出现新的控制栏。
2.  点击 **[完美阵容]** 或 **[允许助战]** 开启筛选。
3.  点击 **[置灰模式/隐藏模式]** 切换不合格作业的显示方式。

### 第三步：自定义偏好
*   通过悬浮球的设置面板，您可以实时开关“卡片美化”、“侧边栏净化”、“链接优化”等功能，配置将自动云端同步（随油猴账号）。

---

## 🤝 致谢与声明

*   **原站支持**：感谢 [prts.plus](https://prts.plus) 提供的优秀作业平台。
*   **开源协议**：本项目基于 [GPL-3.0 License](LICENSE) 开源。
*   **作者**：一只摆烂的42 (ntgmc)

---
<div align="center">
    <i>如果这个脚本帮到了你，欢迎在 GitHub 点个 Star 🌟</i>
</div>
