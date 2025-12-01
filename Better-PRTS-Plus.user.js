// ==UserScript==
// @name         Better-PRTS-Plus
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  [整合版] 在 zoot.plus 实现“完美持有/助战筛选”与“更好的暗黑模式”。修复登录框反白、突袭标签、作业详情及B站链接净化。
// @author       一只摆烂的42 & Gemini 3 pro
// @match        https://zoot.plus/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-body
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    //                            MODULE 1: 配置与常量
    // =========================================================================

    const OPS_STORAGE_KEY = 'prts_plus_user_ops';
    const DISPLAY_MODE_KEY = 'prts_plus_display_mode'; // 'GRAY' | 'HIDE'
    const DARK_MODE_KEY = 'prts_plus_dark_mode_v3';

    // 罗德岛配色定义 (用于暗黑模式)
    const c = {
        bgDeep: '#18181c',      // 全局深底
        bgCard: '#232326',      // 卡片/弹窗
        bgHover: '#2d2d30',     // 悬浮/输入框背景
        border: '#38383b',      // 边框
        textMain: '#e0e0e0',    // 主字
        textSub: '#9ca3af',     // 辅字
        primary: '#5c8ae6',     // 罗德岛蓝
        tagRedBg: '#4a1e1e',    // 突袭-暗红背景
        tagRedText: '#fca5a5',  // 突袭-亮粉红文字
        tagRedBorder: '#7f1d1d' // 突袭-深红边框
    };

    // 状态变量 - 筛选
    let currentFilterMode = 'NONE';
    let displayMode = GM_getValue(DISPLAY_MODE_KEY, 'GRAY');
    let ownedOpsSet = new Set();
    let isProcessingFilter = false;
    let rafId = null;
    let filterDebounceTimer = null;

    // 状态变量 - 暗黑模式
    let isDarkMode = localStorage.getItem(DARK_MODE_KEY) === null ? true : (localStorage.getItem(DARK_MODE_KEY) === 'true');

    // =========================================================================
    //                            MODULE 2: 样式定义
    // =========================================================================

    const mergedStyles = `
        /* --- [暗黑模式核心样式] --- */
        html.dark, html.dark body, html.dark #root, html.dark #app,
        html.dark .bg-zinc-50, html.dark .bg-slate-50, html.dark .bg-gray-50, html.dark .bg-white,
        html.dark .bg-zinc-100, html.dark .bg-slate-100, html.dark .bg-gray-100 {
            background-color: ${c.bgDeep} !important;
            color: ${c.textMain} !important;
        }

        /* 顶部导航栏 */
        html.dark .bp4-navbar {
            background-color: ${c.bgCard} !important;
            border-bottom: 1px solid ${c.border} !important;
            box-shadow: none !important;
        }

        /* 抽屉(Drawer) 与 弹窗(Dialog/Overlay) 核心修复 */
        html.dark .bp4-drawer,
        html.dark .bp4-drawer > section,
        html.dark .bp4-overlay-content,
        html.dark .bp4-dialog {
            background-color: ${c.bgCard} !important;
            color: ${c.textMain} !important;
            box-shadow: 0 0 0 1px ${c.border}, 0 4px 8px rgba(0,0,0,0.5) !important;
        }

        /* 抽屉/弹窗 头部修复 */
        html.dark .bp4-drawer .bg-slate-100,
        html.dark .bp4-drawer header,
        html.dark .bp4-dialog-header {
            background-color: ${c.bgCard} !important;
            border-bottom: 1px solid ${c.border} !important;
            color: ${c.textMain} !important;
        }
        html.dark .bp4-dialog-header .bp4-heading {
            color: #fff !important;
        }
        html.dark .bp4-dialog-close-button .bp4-icon {
            color: ${c.textSub} !important;
        }

        /* 组件通用 */
        html.dark .bp4-card, html.dark .card-container {
            background-color: ${c.bgCard} !important;
            border: 1px solid ${c.border} !important;
            box-shadow: none !important;
            color: ${c.textMain} !important;
        }

        /* --- [修复下拉菜单/Popover/Select 反白问题] --- */
        html.dark .bp4-popover2-content,
        html.dark .bp4-menu {
            background-color: ${c.bgCard} !important;
            color: ${c.textMain} !important;
            border-radius: 4px;
        }
        /* 菜单项文字与交互 */
        html.dark .bp4-menu-item {
            color: ${c.textMain} !important;
        }
        html.dark .bp4-menu-item:hover,
        html.dark .bp4-menu-item.bp4-active,
        html.dark .bp4-menu-item.bp4-intent-primary.bp4-active {
            background-color: ${c.primary} !important;
            color: #fff !important;
        }
        html.dark .bp4-menu-item.bp4-disabled {
            color: ${c.textSub} !important;
            background-color: transparent !important;
        }

        /* --- [修复作业详情动作序列颜色条] --- */
        html.dark .bp4-card.border-l-4 {
            border-left-width: 4px !important;
        }
        html.dark .border-sky-700 { border-left-color: #0369a1 !important; }    /* 部署 */
        html.dark .border-pink-700 { border-left-color: #be185d !important; }   /* 倍速/撤退 */
        html.dark .border-violet-700 { border-left-color: #6d28d9 !important; } /* 技能/挂机 */
        html.dark .border-red-700 { border-left-color: #b91c1c !important; }    /* 警告/撤退 */
        html.dark .border-emerald-700 { border-left-color: #047857 !important; }
        html.dark .border-yellow-700 { border-left-color: #a16207 !important; }

        /* 文字颜色适配 */
        html.dark h1, html.dark h2, html.dark h3, html.dark h4, html.dark h5, html.dark .bp4-heading, html.dark strong { color: #fff !important; }
        html.dark .text-gray-700, html.dark .text-zinc-600, html.dark .text-slate-900, html.dark .text-gray-800 { color: ${c.textMain} !important; }
        html.dark .text-gray-500, html.dark .text-zinc-500 { color: ${c.textSub} !important; }

        /* 登录Tab页签适配 */
        html.dark .bp4-tab { color: ${c.textSub} !important; }
        html.dark .bp4-tab[aria-selected="true"] { color: ${c.primary} !important; }

        /* --- [按钮与输入框修复] --- */
        html.dark .bp4-button {
            background-color: ${c.bgHover} !important;
            background-image: none !important;
            border: 1px solid ${c.border} !important;
            color: ${c.textMain} !important;
            box-shadow: none !important;
        }
        html.dark .bp4-button:hover { background-color: #3e3e42 !important; }
        html.dark .bp4-button.bp4-intent-primary {
            background-color: ${c.primary} !important;
            color: #fff !important;
            border: none !important;
        }

        /* 输入框本体 */
        html.dark .bp4-input, html.dark textarea, html.dark select {
            background-color: ${c.bgHover} !important;
            color: #fff !important;
            border: 1px solid ${c.border} !important;
            box-shadow: none !important;
        }
        html.dark .bp4-input::placeholder { color: #666 !important; }

        /* 弹窗内的输入框（加强权重） */
        html.dark .bp4-dialog .bp4-input {
            background-color: ${c.bgHover} !important;
            color: #fff !important;
        }

        /* --- [关键：修复浏览器自动填充(Autofill)导致的白色/黄色背景] --- */
        html.dark input:-webkit-autofill,
        html.dark input:-webkit-autofill:hover,
        html.dark input:-webkit-autofill:focus,
        html.dark input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px ${c.bgHover} inset !important;
            -webkit-text-fill-color: #fff !important;
            caret-color: #fff !important;
            transition: background-color 5000s ease-in-out 0s;
        }

        /* 标签 (Tag) 修复 */
        html.dark .bp4-tag {
            background-color: #333 !important;
            color: #ccc !important;
            border: 1px solid #444 !important;
        }
        html.dark .bp4-tag[class*="bg-red-"], html.dark .bp4-tag.bg-red-400 {
            background-color: ${c.tagRedBg} !important;
            color: ${c.tagRedText} !important;
            border-color: ${c.tagRedBorder} !important;
        }
        html.dark .bg-orange-200 { background-color: #4a3020 !important; border-color: #6d4020 !important; }

        /* Markdown & Links */
        html.dark .markdown-body { color: ${c.textMain} !important; background: transparent !important; }
        html.dark .markdown-body pre, html.dark .markdown-body code { background-color: ${c.bgHover} !important; color: ${c.textMain} !important; }
        html.dark .markdown-body table tr:nth-child(2n) { background-color: rgba(255, 255, 255, 0.05) !important; }
        html.dark .markdown-body a { color: ${c.primary} !important; }

        /* B站链接样式优化 */
        .prts-bili-link {
            color: #fb7299 !important;
            font-weight: bold !important;
            text-decoration: none !important;
            margin-right: 4px;
            background: rgba(251, 114, 153, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
            transition: all 0.2s;
        }
        .prts-bili-link:hover {
            background: rgba(251, 114, 153, 0.2);
            text-decoration: none !important;
        }


        /* --- [筛选插件样式] --- */
        #prts-filter-bar {
            margin-top: 12px !important;
            margin-bottom: 8px !important;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            width: 100%;
        }

        .prts-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0.5rem 1rem !important;
            min-height: 32px !important;
            font-size: 0.875rem !important;
            font-weight: 600 !important;
            line-height: 1.25rem !important;
            border-radius: 0.375rem !important;
            cursor: pointer !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            background-color: #f6f7f9;
            color: #1c2127;
            box-shadow: inset 0 0 0 1px rgba(17, 20, 24, 0.2), 0 1px 2px rgba(17, 20, 24, 0.1);
            border: none !important;
            user-select: none;
        }

        /* 日间模式交互 */
        html:not(.dark) .prts-btn:hover {
            background-color: #edeff2 !important;
            transform: translateY(-1px);
        }
        html:not(.dark) .prts-btn.prts-active {
            background-color: #2563eb !important;
            color: #ffffff !important;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3) !important;
        }
        html:not(.dark) .prts-btn.prts-active .bp4-icon { color: #ffffff !important; }
        html:not(.dark) .prts-btn.prts-setting-active {
            background-color: #4b5563 !important;
            color: #ffffff !important;
        }

        /* 暗黑模式适配 (筛选按钮) */
        html.dark .prts-btn {
            background-color: #2d2d30 !important;
            color: #e0e0e0 !important;
            border: 1px solid #38383b !important;
        }
        html.dark .prts-btn.prts-active {
            background-color: ${c.primary} !important;
            color: #ffffff !important;
            border-color: ${c.primary} !important;
        }

        .prts-btn .bp4-icon { margin-right: 8px !important; color: #5f6b7c; }
        html.dark .prts-btn .bp4-icon { color: #9ca3af !important; }

        /* --- 状态标签样式 --- */
        .prts-status-label {
            margin-top: 12px !important;
            padding-top: 8px !important;
            border-top: 1px dashed #e5e7eb !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            display: flex !important;
            align-items: center !important;
            line-height: 1.5 !important;
        }
        html.dark .prts-status-label { border-top-color: #444 !important; }

        .prts-label-support { color: #d97706 !important; }
        html.dark .prts-label-support { color: #ff9d2e !important; }

        .prts-label-missing { color: #dc2626 !important; }
        html.dark .prts-label-missing { color: #f87171 !important; }

        /* --- 卡片视觉降级 (置灰模式) --- */
        .prts-card-gray .bp4-card {
            opacity: 0.4 !important;
            filter: grayscale(0.9) !important;
            transition: opacity 0.2s ease, filter 0.2s ease !important;
            background-color: #f3f4f6 !important;
        }
        html.dark .prts-card-gray .bp4-card { background-color: #1a1a1a !important; }

        /* 悬停恢复 */
        .prts-card-gray:hover .bp4-card {
            opacity: 0.95 !important;
            filter: grayscale(0) !important;
        }
    `;

    GM_addStyle(mergedStyles);

    // =========================================================================
    //                            MODULE 3: 暗黑模式逻辑
    // =========================================================================

    function applyDarkMode(enable) {
        const html = document.documentElement;
        if (enable) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        updateDarkModeButtonIcon(enable);
    }

    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        localStorage.setItem(DARK_MODE_KEY, isDarkMode);
        applyDarkMode(isDarkMode);
    }

    function updateDarkModeButtonIcon(isDark) {
        const btn = document.getElementById('prts-mode-toggle');
        if (!btn) return;

        const moonSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        const sunSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

        btn.innerHTML = isDark ? moonSvg : sunSvg;
        btn.title = isDark ? "关闭暗黑模式" : "开启暗黑模式";
        btn.style.color = isDark ? c.primary : '#5f6b7c';
    }

    // 辅助函数：通过 XPath 获取元素
    function getElementByXPath(path) {
        return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    function manageDarkModeButton() {
        // 1. 隐藏原版按钮
        const targetXPath = "/html/body/main/div/div[1]/div[4]/button[2]";
        const oldButton = getElementByXPath(targetXPath);
        if (oldButton && oldButton.id !== 'prts-mode-toggle') {
            oldButton.style.display = 'none';
        }

        // 2. 插入自定义按钮
        // 尝试找到容器
        const containerXPath = "/html/body/main/div/div[1]/div[4]";
        const container = getElementByXPath(containerXPath) || document.querySelector('.bp4-navbar .flex.md\\:gap-4.gap-3');

        if (container && !document.getElementById('prts-mode-toggle')) {
            const myBtn = document.createElement('button');
            myBtn.id = 'prts-mode-toggle';
            myBtn.className = 'bp4-button bp4-minimal';
            myBtn.type = 'button';
            myBtn.style.marginLeft = '4px';
            myBtn.onclick = toggleDarkMode;
            container.appendChild(myBtn);
            updateDarkModeButtonIcon(isDarkMode);
        }
    }

    // =========================================================================
    //                            MODULE 4: 筛选与净化逻辑
    // =========================================================================

    function isFilterDisabledPage() {
        const path = window.location.pathname;
        return path.startsWith('/create') || path.startsWith('/editor');
    }

    function loadOwnedOps() {
        const storedData = GM_getValue(OPS_STORAGE_KEY, '[]');
        try {
            const ops = JSON.parse(storedData);
            ownedOpsSet = new Set(ops.filter(op => op.own === true).map(op => op.name));
            console.log(`[Better PRTS] 已加载 ${ownedOpsSet.size} 名持有干员`);
        } catch (e) {
            console.error('[Better PRTS] 数据解析失败', e);
        }
    }

    function handleImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json, .txt';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const jsonStr = event.target.result;
                    const json = JSON.parse(jsonStr);
                    if (!Array.isArray(json)) throw new Error("非数组格式");
                    GM_setValue(OPS_STORAGE_KEY, jsonStr);
                    loadOwnedOps();
                    alert(`✅ 导入成功！\n共识别 ${json.length} 条数据，持有 ${ownedOpsSet.size} 名干员。`);
                    if (currentFilterMode !== 'NONE') requestFilterUpdate();
                } catch (err) {
                    alert('❌ 导入失败，请检查文件格式。\n' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function toggleDisplayMode() {
        displayMode = (displayMode === 'GRAY') ? 'HIDE' : 'GRAY';
        GM_setValue(DISPLAY_MODE_KEY, displayMode);
        const btn = document.getElementById('btn-setting');
        if (btn) btn.innerHTML = `<span class="bp4-icon" style="font-size: 16px;">${displayMode === 'GRAY' ? '👁️' : '🚫'}</span>${displayMode === 'GRAY' ? '置灰模式' : '隐藏模式'}`;
        requestFilterUpdate();
    }

    function toggleFilter(mode) {
        if (ownedOpsSet.size === 0) {
            alert('请先导入干员数据！');
            return;
        }
        currentFilterMode = (currentFilterMode === mode) ? 'NONE' : mode;
        updateFilterButtonStyles();
        requestFilterUpdate();
    }

    function updateFilterButtonStyles() {
        const perfectBtn = document.getElementById('btn-perfect');
        const supportBtn = document.getElementById('btn-support');
        if (!perfectBtn || !supportBtn) return;

        perfectBtn.classList.remove('prts-active');
        supportBtn.classList.remove('prts-active');

        if (currentFilterMode === 'PERFECT') perfectBtn.classList.add('prts-active');
        else if (currentFilterMode === 'SUPPORT') supportBtn.classList.add('prts-active');
    }

    // 注入筛选工具栏
    function injectFilterControls() {
        if (isFilterDisabledPage()) {
            const existingBar = document.getElementById('prts-filter-bar');
            if (existingBar) existingBar.remove();
            return;
        }

        const searchInputGroup = document.querySelector('.bp4-input-group');
        if (!searchInputGroup) return;

        const anchorNode = searchInputGroup.parentElement;
        if (!anchorNode) return;

        let controlBar = document.getElementById('prts-filter-bar');

        if (!controlBar) {
            controlBar = document.createElement('div');
            controlBar.id = 'prts-filter-bar';

            const createBtn = (text, icon, onClick, id) => {
                const btn = document.createElement('button');
                btn.className = 'prts-btn';
                btn.id = id;
                btn.innerHTML = `<span class="bp4-icon" style="font-size: 16px;">${icon}</span>${text}`;
                btn.onclick = onClick;
                return btn;
            };

            controlBar.append(
                createBtn('导入干员', '📂', handleImport, 'btn-import'),
                createBtn('完美阵容', '💎', () => toggleFilter('PERFECT'), 'btn-perfect'),
                createBtn('允许助战', '🤝', () => toggleFilter('SUPPORT'), 'btn-support'),
                createBtn(displayMode === 'GRAY' ? '置灰模式' : '隐藏模式', displayMode === 'GRAY' ? '👁️' : '🚫', toggleDisplayMode, 'btn-setting')
            );
            updateFilterButtonStyles();
        }

        if (anchorNode.nextSibling !== controlBar) {
            anchorNode.parentNode.insertBefore(controlBar, anchorNode.nextSibling);
            if (currentFilterMode !== 'NONE') requestFilterUpdate();
        }
    }

    // --- [Updated] Bilibili 链接净化 (V1.2) ---
    function cleanBilibiliLinks(cardInner) {
        // 根据实际DOM结构更新选择器：定位到描述文本的容器 (.grow.text-gray-700)
        // 它的直接子级包含了 <p> 标签或其他文本节点
        const descContainer = cardInner.querySelector('.grow.text-gray-700');

        if (!descContainer || descContainer.dataset.biliProcessed) return;

        let html = descContainer.innerHTML;

        // 正则说明：
        // 1. (?:【.*】\s*)?  -> 贪婪匹配标题块，能处理【【揭幕者】标题】这种嵌套情况。
        //    由于 zoot 描述通常分段，贪婪匹配不会跨越多行（JS中 . 不匹配换行符），是安全的。
        // 2. (https?:\/\/...) -> 捕获 URL
        const regex = /(?:【.*】\s*)?(https?:\/\/(?:www\.)?(?:bilibili\.com\/video\/|b23\.tv\/)[^\s<"']+)/gi;

        if (regex.test(html)) {
            descContainer.innerHTML = html.replace(regex, '<a href="$1" target="_blank" class="prts-bili-link">📺 原视频</a>');
            descContainer.dataset.biliProcessed = "true";
        }
    }

    function requestFilterUpdate() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(applyFilterLogic);
    }

    function applyFilterLogic() {
        if (isFilterDisabledPage()) return;
        isProcessingFilter = true;

        try {
            let cards = document.querySelectorAll('ul.grid > li, .tabular-nums ul > li');
            if (cards.length === 0) return;

            cards.forEach(card => {
                const cardInner = card.querySelector('.bp4-card');
                if (!cardInner) return;

                // 1. 执行 Bilibili 链接净化 (无论是否开启筛选都执行)
                cleanBilibiliLinks(cardInner);

                // 2. 筛选逻辑
                let isUnavailable = false;
                let statusType = null;
                let statusValue = null;

                if (currentFilterMode !== 'NONE') {
                    const tags = Array.from(card.querySelectorAll('.bp4-tag'));
                    let requiredOps = [];

                    tags.forEach(tag => {
                        if (tag.querySelector('h4')) return;
                        const text = tag.innerText.trim();
                        // 过滤非干员标签
                        if (['普通', '突袭', 'Beta'].includes(text) ||
                            text.includes('活动关卡') || text.includes('剿灭') || text.includes('危机合约') ||
                            text.includes('|') || text.startsWith('[') || text.includes('更新') ||
                            text.includes('医疗') || text.includes('奶')) return;

                        const opName = text.split(/\s+/)[0];
                        if (opName && !['json', '作者'].includes(opName)) {
                            requiredOps.push(opName);
                        }
                    });

                    let missingCount = 0;
                    let missingOpName = '';
                    requiredOps.forEach(op => {
                        if (!ownedOpsSet.has(op)) {
                            missingCount++;
                            if (missingCount === 1) missingOpName = op;
                        }
                    });

                    if (currentFilterMode === 'PERFECT') {
                        if (missingCount > 0) isUnavailable = true;
                    } else if (currentFilterMode === 'SUPPORT') {
                        if (missingCount > 1) isUnavailable = true;
                    }

                    if (isUnavailable) {
                        statusType = 'missing';
                        statusValue = missingCount;
                    } else if (currentFilterMode === 'SUPPORT' && missingCount === 1) {
                        statusType = 'support';
                        statusValue = missingOpName;
                    }
                }

                // 处理隐藏
                if (isUnavailable && displayMode === 'HIDE') {
                    if (card.style.display !== 'none') card.style.display = 'none';
                    return;
                } else {
                    if (card.style.display === 'none') card.style.display = '';
                }

                // 处理置灰
                const hasGrayClass = card.classList.contains('prts-card-gray');
                if (isUnavailable && displayMode === 'GRAY') {
                    if (!hasGrayClass) card.classList.add('prts-card-gray');
                } else {
                    if (hasGrayClass) card.classList.remove('prts-card-gray');
                }

                // 处理标签
                const existingLabel = cardInner.querySelector('.prts-status-label');
                if (!statusType) {
                    if (existingLabel) existingLabel.remove();
                    return;
                }

                let newHtml = '';
                let newClass = 'prts-status-label';
                if (statusType === 'support') {
                    newClass += ' prts-label-support';
                    newHtml = `<span class="bp4-icon" style="margin-right:6px;">🆘</span>需助战: ${statusValue}`;
                } else {
                    newClass += ' prts-label-missing';
                    newHtml = `<span class="bp4-icon" style="margin-right:6px;">✘</span>缺 ${statusValue} 人`;
                }

                if (existingLabel) {
                    if (existingLabel.innerHTML !== newHtml || existingLabel.className !== newClass) {
                        existingLabel.className = newClass;
                        existingLabel.innerHTML = newHtml;
                    }
                } else {
                    const labelDiv = document.createElement('div');
                    labelDiv.className = newClass;
                    labelDiv.innerHTML = newHtml;
                    cardInner.appendChild(labelDiv);
                }
            });

        } finally {
            isProcessingFilter = false;
        }
    }


    // =========================================================================
    //                            MODULE 5: 统一执行与监听
    // =========================================================================

    function init() {
        // 1. 初始化暗黑模式 (立即执行)
        applyDarkMode(isDarkMode);

        // 2. 初始化筛选数据
        loadOwnedOps();
        injectFilterControls();

        // 3. 统一观察者
        const observer = new MutationObserver((mutations) => {
            // A. 暗黑模式按钮守护
            manageDarkModeButton();

            // B. 筛选与页面变动检测
            if (isProcessingFilter) return;
            if (isFilterDisabledPage()) return;

            let domChanged = false;
            for (const mutation of mutations) {
                if (mutation.target.classList && mutation.target.classList.contains('prts-status-label')) continue;
                if (mutation.target.id === 'prts-filter-bar') continue;

                if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
                    domChanged = true;
                    break;
                }
            }

            if (domChanged) {
                injectFilterControls();
                if (filterDebounceTimer) clearTimeout(filterDebounceTimer);
                filterDebounceTimer = setTimeout(requestFilterUpdate, 50);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // 保底定时器 (应对极其顽固的React刷新)
        setInterval(() => {
            manageDarkModeButton();
            if (!isFilterDisabledPage() && !document.getElementById('prts-filter-bar')) {
                injectFilterControls();
            }
        }, 2000);
    }

    // 启动
    init();

})();
