# Better-PRTS-Plus

[![Version](https://img.shields.io/badge/version-1.5-blue)]()
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-Supported-green)]()

专为 [PRTS Plus (zoot.plus)](https://zoot.plus) 设计的全方位体验增强脚本。整合了深度暗黑模式适配、智能干员持有筛选功能以及界面信息优化，旨在提供更舒适的视觉体验和更高效的作业查找效率。

## ✨ 主要功能

### 1. 深度暗黑模式 (Enhanced Dark Mode)
为网站提供基于罗德岛配色风格（Rhodes Island Theme）的全局暗黑模式适配。
*   **全局覆盖**：深度适配 Blueprint UI、Tailwind 样式及 Markdown 渲染，确保视觉统一。
*   **舒适阅读**：优化色彩对比度，降低夜晚/长时间浏览作业时的视觉疲劳。
*   **一键切换**：在顶部导航栏无缝集成切换按钮，随时在明亮/暗黑模式间切换。

### 2. 智能持有筛选 (Operator Inventory Filter)
在搜索作业时，根据您持有的干员数据快速筛选可抄作业。
*   **完美持有**：仅显示您拥有所有核心干员的作业。
*   **允许助战**：允许缺失 1 名干员（默认借用助战）的作业。
*   **灵活视图**：支持 **“置灰”**（视觉降级）或 **“隐藏”**（完全不显示）两种模式处理缺人作业。
*   **直观提示**：在卡片上直接标记缺失的干员数量或具体的助战需求。

### 3. 链接显示优化 (Link Purification)
智能识别作业描述中的 Bilibili 视频链接。
*   **自动净化**：自动检测并隐藏冗长的“【视频标题】+ 链接”格式文本。
*   **简洁展示**：将原链接替换为简洁醒目的 **(原视频)** 按钮，保持作业列表页面的整洁与清爽。

## 🚀 安装方法

1.  安装浏览器扩展程序：[Tampermonkey](https://www.tampermonkey.net/) (Chrome/Edge/Firefox)。
2.  [**点击这里安装脚本**](https://github.com/ntgmc/Better-PRTS-Plus/raw/refs/heads/main/Better-PRTS-Plus.user.js)。
3.  刷新 zoot.plus 页面即可生效。

## 📖 使用指南

### 导入干员数据
要启用筛选功能，您需要先导入干员持有数据。
1.  进入作业搜索列表页。
2.  点击筛选栏上的 **“📂 导入干员”** 按钮。
3.  上传包含干员数据的 `.json` 文件。
    *   *数据格式参考：* `[{"name": "史尔特尔", "own": true}, ...]` (可以从MAA小工具-干员识别导出)。

### 筛选模式
*   **💎 完美阵容**：筛选出所有干员均持有的作业。
*   **🤝 允许助战**：允许缺失 1 名干员，系统会自动标记该干员为“需助战”。
*   **👁️/🚫 视图切换**：点击设置按钮可切换过滤模式，选择是将不符合条件的作业“变灰”还是直接“隐藏”。

### 切换配色
*   点击顶部导航栏右侧的 **月亮/太阳** 图标即可切换暗黑/明亮模式。脚本会自动记忆您的选择。

## 🔗 致谢与溯源

本项目是基于以下两个开源项目的合并与重构版本：

*   **筛选功能** 原型源自：[ntgmc/PRTS-Plus-Filter](https://github.com/ntgmc/PRTS-Plus-Filter)
*   **暗黑模式** 原型源自：[ntgmc/PRTS-Plus-Darkmode](https://github.com/ntgmc/PRTS-Plus-Darkmode)

## 📄 License

None
