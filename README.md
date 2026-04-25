# 🚀 Better-PRTS-Plus

<div align="center">

![Version](https://img.shields.io/badge/Version-2.12.1-blue.svg?style=flat-square)
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

### 1. 🖼️ 极致视觉优化 (Visual Enhancement)
*   **干员头像可视化**：自动将繁杂的文本标签转换为 **高清干员头像**。支持网格化布局，一眼识别阵容需求。
*   **智能关卡徽章**：自动提取标题中的关卡代号（如 `7-18`, `H13-4`），生成醒目的 **Level Badge**。
*   **气泡增强**：优化干员组详情弹窗，以美观的网格形式展示备选干员及推荐技能等级。
*   **描述深度净化**：将冗长的 Bilibili 链接转化为简洁的 **“参考视频”** 按钮，并支持鼠标悬停自动展开详细描述。

### 2. 🔍 完美作业筛选 (Perfect Filter)
*   **双模式筛选**：
    *   **完美阵容**：仅显示您拥有全部所需干员的作业。
    *   **允许助战**：允许缺失 1 名干员（即通过助战借入）。
*   **可视化标记**：在缺失干员的作业卡片上直白标记 **“缺 X 人”** 或 **“需助战：[干员名]”**。
*   **灵活显示**：支持将不符合条件的作业 **“半透明置灰”** 或 **“直接隐藏”**。

### 3. 👥 多账号管理 (Multi-Account)
*   **三档独立存储**：支持保存 3 组不同的干员持有数据，满足多号党、代练或不同阶段练度的切换需求。
*   **无缝切换**：在筛选栏或悬浮球面板中一键秒切，无需重复导入。

### 4. 🌙 深度暗黑模式 & 界面净化
*   ⚠️ **适配状态说明**：*目前深色模式在部分特定组件或极端场景下，可能会存在配色怪异、不协调的问题（后续版本等待持续适配中，敬请谅解）。* 建议**优先使用深色模式（高对比）**。
*   **侧边栏净化**：默认折叠“创作工具”与“上传”区域，大幅提升首屏有效信息密度。
*   **公告美化**：重构站务公告显示，增加“更新”、“维护”、“活动”等分类标签。

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
3.  点击 **[置灰模式/隐藏模式]** 切换不合格作业的处理方式。

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
