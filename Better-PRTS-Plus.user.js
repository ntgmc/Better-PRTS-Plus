// ==UserScript==
// @name         Better-PRTS-Plus
// @namespace    https://github.com/ntgmc/Better-PRTS-Plus
// @version      2.14.2
// @description  一款集成多账号无缝切换、智能作业筛选(支持干员组)、深度暗黑模式适配与干员头像可视化的 PRTS 全方位增强脚本。
// @author       一只摆烂的42
// @match        https://zoot.plus/*
// @match        https://prts.plus/*
// @match        https://www.skland.com/*
// @match        https://skland.com/*
// @icon         https://prts.plus/favicon.ico
// @homepage     https://github.com/ntgmc/Better-PRTS-Plus
// @supportURL   https://github.com/ntgmc/Better-PRTS-Plus/issues
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_addValueChangeListener
// @connect      zonai.skland.com
// @run-at       document-body
// @license      GPL-3.0 License
// ==/UserScript==

/*
    Better-PRTS-Plus
    Copyright (C) 2023-2026  ntgmc
*/

(function() {
    'use strict';

    // =========================================================================
    //                            MODULE 1: 配置与常量
    // =========================================================================

    // [V12.0/V3.1.0 数据重构] 单一集合存储提升性能，包含向下兼容
    const ACCOUNTS_DATA_KEY = 'prts_plus_accounts_data';
    const DISPLAY_MODE_KEY = 'prts_plus_display_mode'; // 可选值: 'GRAY' | 'HIDE'
    const FILTER_MODE_KEY = 'prts_plus_filter_mode'; // 可选值: 'NONE' | 'PERFECT' | 'SUPPORT'
    const SKLAND_LAST_IMPORT_KEY = 'prts_plus_skland_last_import';
    const SKLAND_BASE_URL = 'https://zonai.skland.com';
    const SKLAND_HOME_URL = 'https://www.skland.com/index';
    const SKLAND_REQUEST_TIMEOUT_MS = 25000;

    // [设置配置] 功能开关默认状态
    const SKLAND_FAVICON_SVG = '<svg class="prts-btn-icon-svg" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M0,15h1v1H0z" fill="#CCE519" opacity="0.039"/><path d="M2,15h1v1H2z" fill="#C8EE21" opacity="0.424"/><path d="M15,0h1v1H15z" fill="#D0D017" opacity="0.043"/><path d="M14,15h1v1H14z" fill="#D3F825" opacity="0.486"/><path d="M4,15h2v1H4z" fill="#C7EB21" opacity="0.502"/><path d="M11,15h3v1H11z" fill="#C9ED21" opacity="0.502"/><path d="M6,15h1v1H6z" fill="#C9EF1F" opacity="0.502"/><path d="M10,15h1v1H10z" fill="#C9F11F" opacity="0.502"/><path d="M3,15h1v1H3zM7,15h1v1H7z" fill="#CBEF21" opacity="0.502"/><path d="M8,15h2v1H8z" fill="#CDF321" opacity="0.502"/><path d="M14,0h1v1H14z" fill="#D1F323" opacity="0.502"/><path d="M15,1h1v1H15z" fill="#D0F321" opacity="0.6"/><path d="M0,13h1v1H0z" fill="#CFEF23" opacity="0.651"/><path d="M0,11h1v1H0z" fill="#D3B809" opacity="0.71"/><path d="M2,0h1v1H2z" fill="#D6F822" opacity="0.745"/><path d="M0,10h1v1H0z" fill="#DFC01A" opacity="0.757"/><path d="M0,12h1v1H0z" fill="#C9F718" opacity="0.769"/><path d="M0,2h1v1H0z" fill="#CDF222" opacity="0.773"/><path d="M13,0h1v1H13z" fill="#D2F723" opacity="0.792"/><path d="M0,5h1v1H0z" fill="#C0E51A" opacity="0.816"/><path d="M0,4h1v1H0z" fill="#C6EB17" opacity="0.816"/><path d="M0,6h1v1H0z" fill="#C9E618" opacity="0.816"/><path d="M15,14h1v1H15z" fill="#C9F127" opacity="0.816"/><path d="M4,0h2v1H4zM9,0h3v1H9z" fill="#CDF222" opacity="0.816"/><path d="M6,0h1v1H6z" fill="#CFF322" opacity="0.816"/><path d="M8,0h1v1H8z" fill="#D0F61F" opacity="0.816"/><path d="M7,0h1v1H7z" fill="#D4FB1D" opacity="0.816"/><path d="M0,8h1v1H0z" fill="#D5F022" opacity="0.816"/><path d="M0,7h1v1H0z" fill="#E0B61D" opacity="0.816"/><path d="M12,0h1v1H12z" fill="#CEF221" opacity="0.824"/><path d="M9,6h1v1H9z" fill="#9BB075" opacity="0.827"/><path d="M3,0h1v1H3z" fill="#CEF221" opacity="0.827"/><path d="M0,9h1v1H0z" fill="#D2FD21" opacity="0.827"/><path d="M0,3h1v1H0z" fill="#D0F522" opacity="0.831"/><path d="M8,10h1v1H8z" fill="#4B4848" opacity="0.859"/><path d="M10,6h1v1H10z" fill="#EBE6D6" opacity="0.89"/><path d="M1,14h1v1H1z" fill="#D0F421" opacity="0.922"/><path d="M15,8h1v1H15z" fill="#95DC0B" opacity="0.933"/><path d="M15,7h1v1H15z" fill="#9EBD4D" opacity="0.933"/><path d="M15,10h1v1H15z" fill="#A7B177" opacity="0.933"/><path d="M15,9h1v1H15z" fill="#ABB952" opacity="0.933"/><path d="M15,6h1v1H15z" fill="#BBCA71" opacity="0.933"/><path d="M15,11h1v1H15z" fill="#BBD01D" opacity="0.933"/><path d="M15,5h1v1H15z" fill="#C1E516" opacity="0.933"/><path d="M15,12h1v1H15z" fill="#D0F320" opacity="0.933"/><path d="M15,4h1v1H15z" fill="#D3F721" opacity="0.933"/><path d="M15,2h1v1H15z" fill="#CCF021" opacity="0.937"/><path d="M9,7h1v1H9z" fill="#4D5441" opacity="0.937"/><path d="M15,3h1v1H15z" fill="#CDF022" opacity="0.941"/><path d="M5,10h1v1H5z" fill="#E1F0D0" opacity="0.945"/><path d="M12,8h1v1H12z" fill="#4B4749" opacity="0.945"/><path d="M8,9h1v1H8z" fill="#FAF9FB" opacity="0.953"/><path d="M15,13h1v1H15z" fill="#CFF121" opacity="0.961"/><path d="M10,7h1v1H10z" fill="#2F2D28" opacity="0.961"/><path d="M9,10h1v1H9z" fill="#323031" opacity="0.976"/><path d="M13,8h1v1H13z" fill="#9E9693" opacity="0.98"/><path d="M5,9h1v1H5z" fill="#ABB09A" opacity="0.98"/><path d="M12,9h1v1H12z" fill="#1C1B19" opacity="0.98"/><path d="M6,10h1v1H6z" fill="#525650" opacity="0.984"/><path d="M11,6h1v1H11z" fill="#FCFDF6" opacity="0.992"/><path d="M12,6h1v1H12z" fill="#FEFEFE" opacity="0.992"/><path d="M13,9h1v1H13z" fill="#272429" opacity="0.992"/><path d="M9,9h1v1H9z" fill="#3D3D3D" opacity="0.992"/><path d="M7,10h1v1H7z" fill="#1F1F20" opacity="0.996"/><path d="M6,9h1v1H6z" fill="#282A06" opacity="0.996"/><path d="M11,7h1v1H11z" fill="#555653" opacity="0.996"/><path d="M7,12h1v1H7z" fill="#656379"/><path d="M8,6h1v1H8z" fill="#667D4D"/><path d="M7,9h1v1H7z" fill="#69696F"/><path d="M7,4h1v1H7z" fill="#6B687A"/><path d="M4,7h1v1H4z" fill="#6F6C80"/><path d="M14,8h1v1H14z" fill="#719246"/><path d="M4,8h1v1H4z" fill="#767574"/><path d="M3,7h1v1H3z" fill="#7C7778"/><path d="M8,12h1v1H8z" fill="#7C7967"/><path d="M9,12h1v1H9z" fill="#828073"/><path d="M7,8h1v1H7z" fill="#82827E"/><path d="M2,9h1v1H2z" fill="#82C10A"/><path d="M12,11h1v1H12z" fill="#848194"/><path d="M7,3h1v1H7z" fill="#8984A5"/><path d="M6,12h1v1H6z" fill="#8A8EA8"/><path d="M7,5h1v1H7z" fill="#8C8C86"/><path d="M3,9h1v1H3z" fill="#8CA753"/><path d="M2,5h1v1H2z" fill="#908AA8"/><path d="M3,6h1v1H3z" fill="#93948D"/><path d="M10,12h1v1H10z" fill="#94978F"/><path d="M2,7h1v1H2z" fill="#959994"/><path d="M14,10h1v1H14z" fill="#9692A3"/><path d="M5,7h1v1H5z" fill="#989892"/><path d="M8,3h1v1H8z" fill="#9EA675"/><path d="M14,5h1v1H14z" fill="#A1AF5D"/><path d="M3,8h1v1H3z" fill="#A2B173"/><path d="M13,4h1v1H13z" fill="#A3B357"/><path d="M8,8h1v1H8z" fill="#A5A4A7"/><path d="M6,7h1v1H6z" fill="#A5A6AD"/><path d="M6,13h1v1H6z" fill="#A5B030"/><path d="M6,6h1v1H6z" fill="#A5BF2C"/><path d="M7,2h1v1H7z" fill="#A6A4B0"/><path d="M1,5h1v1H1z" fill="#A6AA95"/><path d="M11,3h1v1H11z" fill="#A6B658"/><path d="M9,3h1v1H9z" fill="#A7C711"/><path d="M8,2h1v1H8z" fill="#A8B959"/><path d="M12,4h1v1H12z" fill="#A9AF8C"/><path d="M10,3h1v1H10z" fill="#A9B862"/><path d="M1,10h1v1H1z" fill="#A9CB31"/><path d="M11,12h1v1H11z" fill="#ABB288"/><path d="M2,4h1v1H2z" fill="#ABB86E"/><path d="M12,12h1v1H12z" fill="#ABBE4F"/><path d="M4,6h1v1H4z" fill="#ACBA68"/><path d="M9,13h1v1H9z" fill="#ADB95F"/><path d="M6,3h1v1H6z" fill="#ADC054"/><path d="M8,4h1v1H8z" fill="#AEAEAD"/><path d="M13,11h1v1H13z" fill="#AEB789"/><path d="M2,8h1v1H2z" fill="#AED330"/><path d="M1,6h1v1H1z" fill="#AFB97C"/><path d="M6,4h1v1H6z" fill="#B0C061"/><path d="M1,11h1v1H1z" fill="#B0C765"/><path d="M1,4h1v1H1z" fill="#B1BD74"/><path d="M3,5h1v1H3z" fill="#B1C64C"/><path d="M7,6h1v1H7z" fill="#B2B0B8"/><path d="M2,10h1v1H2z" fill="#B2B19B"/><path d="M7,13h1v1H7z" fill="#B2BE62"/><path d="M6,2h1v1H6z" fill="#B2CF29"/><path d="M12,3h1v1H12z" fill="#B4D70F"/><path d="M8,13h1v1H8z" fill="#B7C36A"/><path d="M14,11h1v1H14z" fill="#B7CE3E"/><path d="M10,13h1v1H10z" fill="#B9B938"/><path d="M9,4h1v1H9z" fill="#B9BAB2"/><path d="M13,7h1v1H13z" fill="#B9BCA2"/><path d="M14,7h1v1H14z" fill="#BAC981"/><path d="M2,12h1v1H2z" fill="#BBC39A"/><path d="M7,1h1v1H7z" fill="#BBDB28"/><path d="M5,13h1v1H5z" fill="#BBDF11"/><path d="M3,13h1v1H3z" fill="#BCDF15"/><path d="M13,12h1v1H13z" fill="#BCDF18"/><path d="M6,5h1v1H6z" fill="#BDDA2E"/><path d="M1,12h1v1H1z" fill="#BDDB2F"/><path d="M2,13h1v1H2z" fill="#BDE114"/><path d="M5,6h1v1H5z" fill="#BEDA35"/><path d="M4,13h1v1H4zM11,13h1v1H11z" fill="#C0E215"/><path d="M14,4h1v1H14z" fill="#C2E710"/><path d="M2,3h1v1H2z" fill="#C3E617"/><path d="M3,4h1v1H3z" fill="#C3E714"/><path d="M6,11h1v1H6z" fill="#C4C3C3"/><path d="M10,2h1v1H10z" fill="#C6EB12"/><path d="M3,2h1v1H3z" fill="#C7EA21"/><path d="M11,2h1v1H11z" fill="#C7EC14"/><path d="M4,5h1v1H4z" fill="#C7EF0A"/><path d="M4,2h1v1H4zM13,2h1v1H13zM4,3h1v1H4z" fill="#C8EB21"/><path d="M2,2h1v1H2z" fill="#C8EC21"/><path d="M13,3h1v1H13z" fill="#C8EE14"/><path d="M5,4h1v1H5z" fill="#C8EF15"/><path d="M3,12h1v1H3z" fill="#C9CEB2"/><path d="M5,12h1v1H5z" fill="#CACFAA"/><path d="M8,1h1v1H8z" fill="#CAEE22"/><path d="M1,3h1v1H1z" fill="#CAEF1A"/><path d="M5,3h1v1H5z" fill="#CAF016"/><path d="M4,12h1v1H4z" fill="#CBD0B0"/><path d="M3,3h1v1H3z" fill="#CBEE21"/><path d="M1,7h1v1H1z" fill="#CBF12D"/><path d="M12,13h1v1H12z" fill="#CBF216"/><path d="M4,9h1v1H4z" fill="#CCCACC"/><path d="M12,2h1v1H12z" fill="#CCEF21"/><path d="M4,4h1v1H4z" fill="#CCEF22"/><path d="M1,13h1v1H1z" fill="#CCF01E"/><path d="M5,2h1v1H5z" fill="#CCF11D"/><path d="M9,2h1v1H9z" fill="#CDF513"/><path d="M13,13h1v1H13z" fill="#CFF320"/><path d="M1,8h1v1H1z" fill="#CFF419"/><path d="M14,2h1v1H14z" fill="#CFF422"/><path d="M5,5h1v1H5z" fill="#CFF617"/><path d="M14,3h1v1H14z" fill="#D0F322"/><path d="M12,7h1v1H12z" fill="#D1D1D5"/><path d="M6,1h1v1H6z" fill="#D1F820"/><path d="M11,8h1v1H11z" fill="#151616"/><path d="M3,1h2v1H3zM12,1h1v1H12z" fill="#D2F723"/><path d="M5,1h1v1H5zM10,1h2v1H10z" fill="#D3F823"/><path d="M14,12h1v1H14z" fill="#D3F918"/><path d="M13,1h1v1H13z" fill="#D4F823"/><path d="M9,1h1v1H9z" fill="#D4F923"/><path d="M14,13h1v1H14z" fill="#D5FA22"/><path d="M1,9h1v1H1z" fill="#D6F621"/><path d="M9,14h1v1H9z" fill="#D6FA16"/><path d="M9,5h1v1H9z" fill="#D7D4E0"/><path d="M8,14h1v1H8z" fill="#D7F613"/><path d="M2,1h1v1H2z" fill="#D7FC24"/><path d="M1,2h1v1H1z" fill="#D9FF23"/><path d="M14,14h1v1H14z" fill="#D9FF24"/><path d="M1,1h1v1H1z" fill="#DAFF24"/><path d="M7,14h1v1H7z" fill="#DCFF17"/><path d="M4,14h2v1H4z" fill="#DDFF22"/><path d="M3,14h1v1H3z" fill="#DEFF22"/><path d="M2,14h1v1H2z" fill="#DEFF23"/><path d="M12,14h1v1H12z" fill="#E0FF23"/><path d="M13,5h1v1H13z" fill="#E1DEEF"/><path d="M11,14h1v1H11z" fill="#E1FF22"/><path d="M13,14h1v1H13z" fill="#E1FF23"/><path d="M14,1h1v1H14z" fill="#E1FF25"/><path d="M10,14h1v1H10z" fill="#E2FF1F"/><path d="M6,14h1v1H6z" fill="#E3FF21"/><path d="M11,4h1v1H11z" fill="#EAE7F7"/><path d="M3,10h1v1H3z" fill="#EEEAF3"/><path d="M14,6h1v1H14z" fill="#F2EDFF"/><path d="M10,4h1v1H10z" fill="#F5F2FF"/><path d="M2,11h1v1H2z" fill="#FFFEFF"/><path d="M10,5h3v1H10zM13,6h1v1H13zM4,10h1v1H4zM3,11h3v1H3z" fill="#FFFFFF"/><path d="M8,11h1v1H8z" fill="#1E1F1E"/><path d="M10,10h1v1H10z" fill="#1F1F23"/><path d="M10,9h1v1H10z" fill="#212121"/><path d="M9,11h1v1H9z" fill="#22221B"/><path d="M10,8h1v1H10z" fill="#272829"/><path d="M11,9h1v1H11z" fill="#292929"/><path d="M11,10h1v1H11z" fill="#292A2B"/><path d="M7,11h1v1H7z" fill="#2F2F2E"/><path d="M9,8h1v1H9z" fill="#302F32"/><path d="M12,10h1v1H12z" fill="#3A3B3A"/><path d="M2,6h1v1H2z" fill="#46435C"/><path d="M10,11h1v1H10z" fill="#48472B"/><path d="M13,10h1v1H13z" fill="#4B4A54"/><path d="M8,5h1v1H8z" fill="#4C4755"/><path d="M8,7h1v1H8z" fill="#4D553F"/><path d="M11,11h1v1H11z" fill="#4F4D4E"/><path d="M6,8h1v1H6z" fill="#5C5B54"/><path d="M14,9h1v1H14z" fill="#605D93"/><path d="M5,8h1v1H5z" fill="#615F60"/><path d="M7,7h1v1H7z" fill="#626084"/><path d="M0,14h1v1H0z" fill="#CEEC1E" opacity="0.165"/><path d="M1,15h1v1H1z" fill="#CCEF1E" opacity="0.259"/><path d="M15,15h1v1H15z" fill="#C9F225" opacity="0.318"/><path d="M0,1h1v1H0z" fill="#CEF122" opacity="0.373"/><path d="M1,0h1v1H1z" fill="#CAEF21" opacity="0.384"/></svg>';

    const CONFIG = {
        visuals: GM_getValue('prts_cfg_visuals', true),       // 干员头像优化
        cleanLink: GM_getValue('prts_cfg_link', true),        // 链接净化
        hideSidebar: GM_getValue('prts_cfg_hide_sidebar', false) // 折叠侧边栏
    };

    const BP_SELECTORS = {
        inputGroup: '.bp4-input-group, .bp6-input-group',
        card: '.bp4-card, .bp6-card',
        tag: '.bp4-tag, .bp6-tag',
        heading: '.bp4-heading, .bp6-heading',
        popoverTarget: '.bp4-popover2-target, .bp6-popover-target',
        popoverContent: '.bp4-popover2-content, .bp6-popover-content',
        popover: '.bp4-popover2, .bp6-popover',
        menuOrItem: 'ul.bp4-menu, ul.bp6-menu, li, a.bp4-menu-item, a.bp6-menu-item',
        portal: '.bp4-portal, .bp6-portal',
        dialog: '.bp4-dialog, .bp6-dialog'
    };

    // 全局状态变量
    let activeAccountId = 1;
    let accountsData = { 1:[], 2: [], 3:[] }; // 多账号数据缓存池

    let currentFilterMode = GM_getValue(FILTER_MODE_KEY, 'NONE');
    let displayMode = GM_getValue(DISPLAY_MODE_KEY, 'GRAY');
    let ownedOpsSet = new Set();
    const operationCache = new WeakMap();

    let isProcessingFilter = false;
    let rafId = null;
    let filterDebounceTimer = null;
    let lastRouteKey = `${window.location.pathname}${window.location.search}`;

    // =========================================================================
    //                            MODULE 2: 数据与样式
    // =========================================================================

    // [数据] 干员头像数据映射
    const RAW_OPS = [{"id":"char_002_amiya","name":"阿米娅"},{"id":"char_003_kalts","name":"凯尔希"},{"id":"char_009_12fce","name":"12F"},{"id":"char_010_chen","name":"陈"},{"id":"char_017_huang","name":"煌"},{"id":"char_1011_lava2","name":"炎狱炎熔"},{"id":"char_1012_skadi2","name":"浊心斯卡蒂"},{"id":"char_1013_chen2","name":"假日威龙陈"},{"id":"char_1014_nearl2","name":"耀骑士临光"},{"id":"char_1016_agoat2","name":"纯烬艾雅法拉"},{"id":"char_1019_siege2","name":"维娜·维多利亚"},{"id":"char_101_sora","name":"空"},{"id":"char_1020_reed2","name":"焰影苇草"},{"id":"char_1021_kroos2","name":"寒芒克洛丝"},{"id":"char_1022_flwr2","name":"撷英调香师"},{"id":"char_1023_ghost2","name":"归溟幽灵鲨"},{"id":"char_1024_hbisc2","name":"濯尘芙蓉"},{"id":"char_1026_gvial2","name":"百炼嘉维尔"},{"id":"char_1027_greyy2","name":"承曦格雷伊"},{"id":"char_1028_texas2","name":"缄默德克萨斯"},{"id":"char_1029_yato2","name":"麒麟R夜刀"},{"id":"char_102_texas","name":"德克萨斯"},{"id":"char_1030_noirc2","name":"火龙S黑角"},{"id":"char_1031_slent2","name":"淬羽赫默"},{"id":"char_1032_excu2","name":"圣约送葬人"},{"id":"char_1033_swire2","name":"琳琅诗怀雅"},{"id":"char_1034_jesca2","name":"涤火杰西卡"},{"id":"char_1035_wisdel","name":"维什戴尔"},{"id":"char_1036_fang2","name":"历阵锐枪芬"},{"id":"char_1038_whitw2","name":"荒芜拉普兰德"},{"id":"char_1039_thorn2","name":"引星棘刺"},{"id":"char_103_angel","name":"能天使"},{"id":"char_1040_blaze2","name":"烛煌"},{"id":"char_1041_angel2","name":"新约能天使"},{"id":"char_1042_phatm2","name":"酒神"},{"id":"char_1043_leizi2","name":"司霆惊蛰"},{"id":"char_1044_hsgma2","name":"斩业星熊"},{"id":"char_1045_svash2","name":"凛御银灰"},{"id":"char_1046_sbell2","name":"圣聆初雪"},{"id":"char_1047_halo2","name":"溯光星源"},{"id":"char_1048_orchd2","name":"焰狐龙梓兰"},{"id":"char_1049_catap2","name":"雷狼龙S空爆"},{"id":"char_1050_chen3","name":"赤刃明霄陈"},{"id":"char_1051_headb2","name":"怒潮凛冬"},{"id":"char_1052_kalts2","name":"凯尔希·思衡托"},{"id":"char_106_franka","name":"芙兰卡"},{"id":"char_107_liskam","name":"雷蛇"},{"id":"char_108_silent","name":"赫默"},{"id":"char_109_fmout","name":"远山"},{"id":"char_110_deepcl","name":"深海色"},{"id":"char_112_siege","name":"推进之王"},{"id":"char_113_cqbw","name":"W"},{"id":"char_115_headbr","name":"凛冬"},{"id":"char_117_myrrh","name":"末药"},{"id":"char_118_yuki","name":"白雪"},{"id":"char_120_hibisc","name":"芙蓉"},{"id":"char_121_lava","name":"炎熔"},{"id":"char_122_beagle","name":"米格鲁"},{"id":"char_123_fang","name":"芬"},{"id":"char_124_kroos","name":"克洛丝"},{"id":"char_126_shotst","name":"流星"},{"id":"char_127_estell","name":"艾丝黛尔"},{"id":"char_128_plosis","name":"白面鸮"},{"id":"char_129_bluep","name":"蓝毒"},{"id":"char_130_doberm","name":"杜宾"},{"id":"char_131_flameb","name":"炎客"},{"id":"char_133_mm","name":"梅"},{"id":"char_134_ifrit","name":"伊芙利特"},{"id":"char_135_halo","name":"星源"},{"id":"char_136_hsguma","name":"星熊"},{"id":"char_137_brownb","name":"猎蜂"},{"id":"char_140_whitew","name":"拉普兰德"},{"id":"char_141_nights","name":"夜烟"},{"id":"char_143_ghost","name":"幽灵鲨"},{"id":"char_144_red","name":"红"},{"id":"char_145_prove","name":"普罗旺斯"},{"id":"char_147_shining","name":"闪灵"},{"id":"char_148_nearl","name":"临光"},{"id":"char_149_scave","name":"清道夫"},{"id":"char_1502_crosly","name":"弑君者"},{"id":"char_150_snakek","name":"蛇屠箱"},{"id":"char_151_myrtle","name":"桃金娘"},{"id":"char_154_morgan","name":"摩根"},{"id":"char_155_tiger","name":"因陀罗"},{"id":"char_157_dagda","name":"达格达"},{"id":"char_158_milu","name":"守林人"},{"id":"char_159_peacok","name":"断罪者"},{"id":"char_163_hpsts","name":"火神"},{"id":"char_164_nightm","name":"夜魔"},{"id":"char_166_skfire","name":"天火"},{"id":"char_171_bldsk","name":"华法琳"},{"id":"char_172_svrash","name":"银灰"},{"id":"char_173_slchan","name":"崖心"},{"id":"char_174_slbell","name":"初雪"},{"id":"char_179_cgbird","name":"夜莺"},{"id":"char_180_amgoat","name":"艾雅法拉"},{"id":"char_181_flower","name":"调香师"},{"id":"char_183_skgoat","name":"地灵"},{"id":"char_185_frncat","name":"慕斯"},{"id":"char_187_ccheal","name":"嘉维尔"},{"id":"char_188_helage","name":"赫拉格"},{"id":"char_190_clour","name":"红云"},{"id":"char_192_falco","name":"翎羽"},{"id":"char_193_frostl","name":"霜叶"},{"id":"char_194_leto","name":"烈夏"},{"id":"char_195_glassb","name":"真理"},{"id":"char_196_sunbr","name":"古米"},{"id":"char_197_poca","name":"早露"},{"id":"char_198_blackd","name":"讯使"},{"id":"char_199_yak","name":"角峰"},{"id":"char_2012_typhon","name":"提丰"},{"id":"char_2013_cerber","name":"刻俄柏"},{"id":"char_2014_nian","name":"年"},{"id":"char_2015_dusk","name":"夕"},{"id":"char_201_moeshd","name":"可颂"},{"id":"char_2023_ling","name":"令"},{"id":"char_2024_chyue","name":"重岳"},{"id":"char_2025_shu","name":"黍"},{"id":"char_2026_yu","name":"余"},{"id":"char_2027_wang","name":"望"},{"id":"char_202_demkni","name":"塞雷娅"},{"id":"char_204_platnm","name":"白金"},{"id":"char_206_gnosis","name":"灵知"},{"id":"char_208_melan","name":"玫兰莎"},{"id":"char_209_ardign","name":"卡缇"},{"id":"char_210_stward","name":"史都华德"},{"id":"char_211_adnach","name":"安德切尔"},{"id":"char_212_ansel","name":"安赛尔"},{"id":"char_213_mostma","name":"莫斯提马"},{"id":"char_214_kafka","name":"卡夫卡"},{"id":"char_215_mantic","name":"狮蝎"},{"id":"char_218_cuttle","name":"安哲拉"},{"id":"char_219_meteo","name":"陨星"},{"id":"char_220_grani","name":"格拉尼"},{"id":"char_222_bpipe","name":"风笛"},{"id":"char_225_haak","name":"阿"},{"id":"char_226_hmau","name":"吽"},{"id":"char_230_savage","name":"暴行"},{"id":"char_235_jesica","name":"杰西卡"},{"id":"char_236_rope","name":"暗索"},{"id":"char_237_gravel","name":"砾"},{"id":"char_240_wyvern","name":"香草"},{"id":"char_241_panda","name":"食铁兽"},{"id":"char_242_otter","name":"梅尔"},{"id":"char_243_waaifu","name":"槐琥"},{"id":"char_245_cello","name":"塑心"},{"id":"char_248_mgllan","name":"麦哲伦"},{"id":"char_249_mlyss","name":"缪尔赛思"},{"id":"char_250_phatom","name":"傀影"},{"id":"char_252_bibeak","name":"柏喙"},{"id":"char_253_greyy","name":"格雷伊"},{"id":"char_254_vodfox","name":"巫恋"},{"id":"char_258_podego","name":"波登可"},{"id":"char_260_durnar","name":"坚雷"},{"id":"char_261_sddrag","name":"苇草"},{"id":"char_263_skadi","name":"斯卡蒂"},{"id":"char_264_f12yin","name":"山"},{"id":"char_265_sophia","name":"鞭刃"},{"id":"char_271_spikes","name":"芳汀"},{"id":"char_272_strong","name":"孑"},{"id":"char_274_astesi","name":"星极"},{"id":"char_275_breeze","name":"微风"},{"id":"char_277_sqrrel","name":"阿消"},{"id":"char_278_orchid","name":"梓兰"},{"id":"char_279_excu","name":"送葬人"},{"id":"char_281_popka","name":"泡普卡"},{"id":"char_282_catap","name":"空爆"},{"id":"char_283_midn","name":"月见夜"},{"id":"char_284_spot","name":"斑点"},{"id":"char_285_medic2","name":"Lancet-2"},{"id":"char_286_cast3","name":"Castle-3"},{"id":"char_289_gyuki","name":"缠丸"},{"id":"char_290_vigna","name":"红豆"},{"id":"char_291_aglina","name":"安洁莉娜"},{"id":"char_293_thorns","name":"棘刺"},{"id":"char_294_ayer","name":"断崖"},{"id":"char_297_hamoni","name":"和弦"},{"id":"char_298_susuro","name":"苏苏洛"},{"id":"char_300_phenxi","name":"菲亚梅塔"},{"id":"char_301_cutter","name":"刻刀"},{"id":"char_302_glaze","name":"安比尔"},{"id":"char_304_zebra","name":"暴雨"},{"id":"char_306_leizi","name":"惊蛰"},{"id":"char_308_swire","name":"诗怀雅"},{"id":"char_311_mudrok","name":"泥岩"},{"id":"char_322_lmlee","name":"老鲤"},{"id":"char_325_bison","name":"拜松"},{"id":"char_326_glacus","name":"格劳克斯"},{"id":"char_328_cammou","name":"卡达"},{"id":"char_332_archet","name":"空弦"},{"id":"char_333_sidero","name":"铸铁"},{"id":"char_336_folivo","name":"稀音"},{"id":"char_337_utage","name":"宴"},{"id":"char_338_iris","name":"爱丽丝"},{"id":"char_340_shwaz","name":"黑"},{"id":"char_341_sntlla","name":"寒檀"},{"id":"char_343_tknogi","name":"月禾"},{"id":"char_344_beewax","name":"蜜蜡"},{"id":"char_345_folnic","name":"亚叶"},{"id":"char_346_aosta","name":"奥斯塔"},{"id":"char_347_jaksel","name":"杰克"},{"id":"char_348_ceylon","name":"锡兰"},{"id":"char_349_chiave","name":"贾维"},{"id":"char_350_surtr","name":"史尔特尔"},{"id":"char_355_ethan","name":"伊桑"},{"id":"char_356_broca","name":"布洛卡"},{"id":"char_358_lisa","name":"铃兰"},{"id":"char_362_saga","name":"嵯峨"},{"id":"char_363_toddi","name":"熔泉"},{"id":"char_365_aprl","name":"四月"},{"id":"char_366_acdrop","name":"酸糖"},{"id":"char_367_swllow","name":"灰喉"},{"id":"char_369_bena","name":"贝娜"},{"id":"char_373_lionhd","name":"莱恩哈特"},{"id":"char_376_therex","name":"THRM-EX"},{"id":"char_377_gdglow","name":"澄闪"},{"id":"char_378_asbest","name":"石棉"},{"id":"char_379_sesa","name":"慑砂"},{"id":"char_381_bubble","name":"泡泡"},{"id":"char_383_snsant","name":"雪雉"},{"id":"char_385_finlpp","name":"清流"},{"id":"char_388_mint","name":"薄绿"},{"id":"char_391_rosmon","name":"迷迭香"},{"id":"char_394_hadiya","name":"哈蒂娅"},{"id":"char_4000_jnight","name":"正义骑士号"},{"id":"char_4004_pudd","name":"布丁"},{"id":"char_4006_melnte","name":"玫拉"},{"id":"char_4009_irene","name":"艾丽妮"},{"id":"char_400_weedy","name":"温蒂"},{"id":"char_4010_etlchi","name":"隐德来希"},{"id":"char_4011_lessng","name":"止颂"},{"id":"char_4013_kjera","name":"耶拉"},{"id":"char_4014_lunacu","name":"子月"},{"id":"char_4015_spuria","name":"空构"},{"id":"char_4016_kazema","name":"风丸"},{"id":"char_4017_puzzle","name":"谜图"},{"id":"char_4019_ncdeer","name":"九色鹿"},{"id":"char_401_elysm","name":"极境"},{"id":"char_4023_rfalcn","name":"红隼"},{"id":"char_4025_aprot2","name":"暮落"},{"id":"char_4026_vulpis","name":"忍冬"},{"id":"char_4027_heyak","name":"霍尔海雅"},{"id":"char_402_tuye","name":"图耶"},{"id":"char_4031_liesel","name":"复奏"},{"id":"char_4032_provs","name":"但书"},{"id":"char_4036_forcer","name":"见行者"},{"id":"char_4037_demetr","name":"贝洛内"},{"id":"char_4039_horn","name":"号角"},{"id":"char_4040_rockr","name":"洛洛"},{"id":"char_4041_chnut","name":"褐果"},{"id":"char_4042_lumen","name":"流明"},{"id":"char_4043_erato","name":"埃拉托"},{"id":"char_4045_heidi","name":"海蒂"},{"id":"char_4046_ebnhlz","name":"黑键"},{"id":"char_4047_pianst","name":"车尔尼"},{"id":"char_4048_doroth","name":"多萝西"},{"id":"char_4051_akkord","name":"协律"},{"id":"char_4052_surfer","name":"寻澜"},{"id":"char_4054_malist","name":"至简"},{"id":"char_4055_bgsnow","name":"鸿雪"},{"id":"char_4056_titi","name":"缇缇"},{"id":"char_4058_pepe","name":"佩佩"},{"id":"char_405_absin","name":"苦艾"},{"id":"char_4062_totter","name":"铅踝"},{"id":"char_4063_quartz","name":"石英"},{"id":"char_4064_mlynar","name":"玛恩纳"},{"id":"char_4065_judge","name":"斥罪"},{"id":"char_4066_highmo","name":"海沫"},{"id":"char_4067_lolxh","name":"罗小黑"},{"id":"char_4071_peper","name":"明椒"},{"id":"char_4072_ironmn","name":"白铁"},{"id":"char_4077_palico","name":"泰拉大陆调查团"},{"id":"char_4078_bdhkgt","name":"截云"},{"id":"char_4079_haini","name":"海霓"},{"id":"char_4080_lin","name":"林"},{"id":"char_4081_warmy","name":"温米"},{"id":"char_4082_qiubai","name":"仇白"},{"id":"char_4083_chimes","name":"铎铃"},{"id":"char_4087_ines","name":"伊内丝"},{"id":"char_4088_hodrer","name":"赫德雷"},{"id":"char_4091_ulika","name":"U-Official"},{"id":"char_4093_frston","name":"Friston-3"},{"id":"char_4098_vvana","name":"薇薇安娜"},{"id":"char_4100_caper","name":"跃跃"},{"id":"char_4102_threye","name":"凛视"},{"id":"char_4104_coldst","name":"冰酿"},{"id":"char_4105_almond","name":"杏仁"},{"id":"char_4106_bryota","name":"苍苔"},{"id":"char_4107_vrdant","name":"维荻"},{"id":"char_4109_baslin","name":"深律"},{"id":"char_4110_delphn","name":"戴菲恩"},{"id":"char_4114_harold","name":"哈洛德"},{"id":"char_4116_blkkgt","name":"锏"},{"id":"char_4117_ray","name":"莱伊"},{"id":"char_4119_wanqin","name":"万顷"},{"id":"char_411_tomimi","name":"特米米"},{"id":"char_4121_zuole","name":"左乐"},{"id":"char_4122_grabds","name":"小满"},{"id":"char_4123_ela","name":"艾拉"},{"id":"char_4124_iana","name":"双月"},{"id":"char_4125_rdoc","name":"医生"},{"id":"char_4126_fuze","name":"导火索"},{"id":"char_4130_luton","name":"露托"},{"id":"char_4131_odda","name":"奥达"},{"id":"char_4132_ascln","name":"阿斯卡纶"},{"id":"char_4133_logos","name":"逻各斯"},{"id":"char_4134_cetsyr","name":"魔王"},{"id":"char_4136_phonor","name":"PhonoR-0"},{"id":"char_4137_udflow","name":"深巡"},{"id":"char_4138_narant","name":"娜仁图亚"},{"id":"char_4139_papyrs","name":"莎草"},{"id":"char_4140_lasher","name":"衡沙"},{"id":"char_4141_marcil","name":"玛露西尔"},{"id":"char_4142_laios","name":"莱欧斯"},{"id":"char_4143_sensi","name":"森西"},{"id":"char_4144_chilc","name":"齐尔查克"},{"id":"char_4145_ulpia","name":"乌尔比安"},{"id":"char_4146_nymph","name":"妮芙"},{"id":"char_4147_mitm","name":"渡桥"},{"id":"char_4148_philae","name":"菲莱"},{"id":"char_4151_tinman","name":"锡人"},{"id":"char_4155_talr","name":"裁度"},{"id":"char_415_flint","name":"燧石"},{"id":"char_4162_cathy","name":"凯瑟琳"},{"id":"char_4163_rosesa","name":"瑰盐"},{"id":"char_4164_tecno","name":"特克诺"},{"id":"char_4165_ctrail","name":"云迹"},{"id":"char_4166_varkis","name":"摆渡人"},{"id":"char_416_zumama","name":"森蚺"},{"id":"char_4171_wulfen","name":"钼铅"},{"id":"char_4172_xingzh","name":"行箸"},{"id":"char_4173_nowell","name":"诺威尔"},{"id":"char_4177_brigid","name":"水灯心"},{"id":"char_4178_alanna","name":"阿兰娜"},{"id":"char_4179_monstr","name":"Mon3tr"},{"id":"char_4182_oblvns","name":"丰川祥子"},{"id":"char_4183_mortis","name":"若叶睦"},{"id":"char_4184_dolris","name":"三角初华"},{"id":"char_4185_amoris","name":"祐天寺若麦"},{"id":"char_4186_tmoris","name":"八幡海铃"},{"id":"char_4187_graceb","name":"聆音"},{"id":"char_4188_confes","name":"CONFESS-47"},{"id":"char_4191_tippi","name":"蒂比"},{"id":"char_4193_lemuen","name":"蕾缪安"},{"id":"char_4194_rmixer","name":"信仰搅拌机"},{"id":"char_4195_radian","name":"电弧"},{"id":"char_4196_reckpr","name":"录武官"},{"id":"char_4198_christ","name":"Miss.Christine"},{"id":"char_4199_makiri","name":"松桐"},{"id":"char_4202_haruka","name":"遥"},{"id":"char_4203_kichi","name":"吉星"},{"id":"char_4204_mantra","name":"真言"},{"id":"char_4207_branch","name":"折桠"},{"id":"char_4208_wintim","name":"冬时"},{"id":"char_420_flamtl","name":"焰尾"},{"id":"char_4211_snhunt","name":"雪猎"},{"id":"char_4212_nasti","name":"娜斯提"},{"id":"char_4213_skybx","name":"天空盒"},{"id":"char_4214_cairn","name":"响石"},{"id":"char_4215_buddy","name":"罗德岛隐秘队"},{"id":"char_421_crow","name":"羽毛笔"},{"id":"char_4221_ju","name":"矩"},{"id":"char_4222_taraxa","name":"风絮"},{"id":"char_4223_botany","name":"伯塔尼"},{"id":"char_4224_turdus","name":"乌啾"},{"id":"char_4225_tanya","name":"裂响"},{"id":"char_4226_veen","name":"维伊"},{"id":"char_4227_gallus","name":"GALLUS²"},{"id":"char_4228_closur","name":"可露希尔"},{"id":"char_422_aurora","name":"极光"},{"id":"char_423_blemsh","name":"瑕光"},{"id":"char_426_billro","name":"卡涅利安"},{"id":"char_427_vigil","name":"伺夜"},{"id":"char_430_fartth","name":"远牙"},{"id":"char_431_ashlok","name":"灰毫"},{"id":"char_433_windft","name":"掠风"},{"id":"char_436_whispr","name":"絮雨"},{"id":"char_437_mizuki","name":"水月"},{"id":"char_440_pinecn","name":"松果"},{"id":"char_445_wscoot","name":"骋风"},{"id":"char_446_aroma","name":"阿罗玛"},{"id":"char_449_glider","name":"蜜莓"},{"id":"char_450_necras","name":"死芒"},{"id":"char_451_robin","name":"罗宾"},{"id":"char_452_bstalk","name":"豆苗"},{"id":"char_455_nothin","name":"乌有"},{"id":"char_456_ash","name":"灰烬"},{"id":"char_457_blitz","name":"闪击"},{"id":"char_458_rfrost","name":"霜华"},{"id":"char_459_tachak","name":"战车"},{"id":"char_464_cement","name":"洋灰"},{"id":"char_466_qanik","name":"雪绒"},{"id":"char_469_indigo","name":"深靛"},{"id":"char_472_pasngr","name":"异客"},{"id":"char_473_mberry","name":"桑葚"},{"id":"char_474_glady","name":"歌蕾蒂娅"},{"id":"char_475_akafyu","name":"赤冬"},{"id":"char_476_blkngt","name":"夜半"},{"id":"char_478_kirara","name":"绮良"},{"id":"char_479_sleach","name":"琴柳"},{"id":"char_484_robrta","name":"罗比菈塔"},{"id":"char_485_pallas","name":"帕拉斯"},{"id":"char_486_takila","name":"龙舌兰"},{"id":"char_487_bobb","name":"波卜"},{"id":"char_488_buildr","name":"青枳"},{"id":"char_489_serum","name":"蚀清"},{"id":"char_491_humus","name":"休谟斯"},{"id":"char_492_quercu","name":"夏栎"},{"id":"char_493_firwhl","name":"火哨"},{"id":"char_494_vendla","name":"刺玫"},{"id":"char_496_wildmn","name":"野鬃"},{"id":"char_497_ctable","name":"晓歌"},{"id":"char_498_inside","name":"隐现"},{"id":"char_499_kaitou","name":"折光"},{"id":"char_500_noirc","name":"黑角"},{"id":"char_501_durin","name":"杜林"},{"id":"char_502_nblade","name":"夜刀"},{"id":"char_503_rang","name":"巡林者"}]
    const OP_ID_MAP = {};
    if (typeof RAW_OPS !== 'undefined' && RAW_OPS.length > 0) {
        RAW_OPS.forEach(op => { OP_ID_MAP[op.name] = op.id; });
    }

    const ACCOUNT_IDS = [1, 2, 3];

    function createEmptyAccountsData() {
        return { 1: [], 2: [], 3: [] };
    }

    function normalizeAccountId(id) {
        const parsed = parseInt(id, 10);
        return ACCOUNT_IDS.includes(parsed) ? parsed : 1;
    }

    function normalizeOperatorName(name) {
        return typeof name === 'string' ? name.trim() : '';
    }

    function sanitizeOperatorNames(names) {
        if (!Array.isArray(names)) return [];

        const seen = new Set();
        const result = [];
        names.forEach(name => {
            const normalized = normalizeOperatorName(name);
            if (!normalized) return;
            if (normalized.length > 50) return;
            if (/[\x00-\x1F\x7F]/.test(normalized)) return;
            if (seen.has(normalized)) return;
            seen.add(normalized);
            result.push(normalized);
        });
        return result;
    }

    function normalizeAccountsData(value) {
        const normalized = createEmptyAccountsData();
        if (!value || typeof value !== 'object') return normalized;

        ACCOUNT_IDS.forEach(id => {
            normalized[id] = sanitizeOperatorNames(value[id]);
        });
        return normalized;
    }

    function safeJsonParse(rawValue, fallback) {
        try {
            return JSON.parse(rawValue);
        } catch (e) {
            return fallback;
        }
    }

    function isOwnedOperatorRecord(op) {
        if (!op || typeof op !== 'object') return false;
        if (!Object.prototype.hasOwnProperty.call(op, 'own')) return true;

        const own = op.own;
        if (own === false || own === 0) return false;
        if (typeof own === 'string' && ['false', '0', 'no'].includes(own.trim().toLowerCase())) return false;
        return true;
    }

    function parseOperatorNamesFromJson(json) {
        if (!Array.isArray(json)) throw new Error('数据格式非数组');
        if (json.length === 0) return [];

        if (typeof json[0] === 'string') {
            return sanitizeOperatorNames(json);
        }

        if (typeof json[0] === 'object' && json[0] !== null && 'name' in json[0]) {
            return sanitizeOperatorNames(
                json
                    .filter(isOwnedOperatorRecord)
                    .map(op => normalizeOperatorName(op?.name))
            );
        }

        return [];
    }

    function parseOperatorNamesFromText(text) {
        return sanitizeOperatorNames(
            String(text || '')
                .replace(/^\uFEFF/, '')
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#') && !line.startsWith('//'))
        );
    }

    function parseImportedOperatorNames(rawText, fileName = '') {
        const text = String(rawText || '');

        const parsed = safeJsonParse(text, null);
        if (parsed !== null) return parseOperatorNamesFromJson(parsed);
        if (/\.json$/i.test(fileName)) throw new Error('文件格式错误：不是有效的 JSON 文件');

        return parseOperatorNamesFromText(text);
    }

    function isSklandHost() {
        return /(^|\.)skland\.com$/i.test(window.location.hostname);
    }

    function isPrtsHost() {
        return /(^|\.)prts\.plus$/i.test(window.location.hostname) || /(^|\.)zoot\.plus$/i.test(window.location.hostname);
    }

    function isPlainRecord(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function stringValue(value) {
        if (typeof value === 'string') return value.trim();
        if (typeof value === 'number' && Number.isFinite(value)) return String(value);
        return '';
    }

    function readSklandCredentialFromStorage() {
        let raw = '';
        try {
            raw = window.localStorage.getItem('SK_OAUTH_CRED_KEY') || '';
        } catch (error) {
            throw new Error('无法读取森空岛网页存储，请确认浏览器允许脚本访问 localStorage。');
        }

        const candidates = [];
        const pushCandidate = value => {
            if (typeof value === 'string' && value.trim()) candidates.push(value.trim());
        };
        const pushJsonCandidates = text => {
            try {
                const parsed = JSON.parse(text);
                if (typeof parsed === 'string') pushCandidate(parsed);
                if (isPlainRecord(parsed)) {
                    pushCandidate(parsed.cred);
                    pushCandidate(parsed.value);
                }
            } catch (error) {
                // 不是 JSON 时按原始凭据继续处理。
            }
        };

        pushCandidate(raw);
        const decodedRaw = decodeSklandCredentialText(raw);
        pushCandidate(decodedRaw);
        pushJsonCandidates(raw);
        if (decodedRaw !== raw) pushJsonCandidates(decodedRaw);

        for (const candidate of candidates) {
            const normalized = normalizeSklandCredentialCandidate(candidate);
            if (normalized) return normalized;
        }
        throw new Error('未找到森空岛登录凭据，请先在当前森空岛页面完成登录。');
    }

    function decodeSklandCredentialText(value) {
        let decoded = String(value || '').trim();
        for (let i = 0; i < 2; i++) {
            try {
                const next = decodeURIComponent(decoded);
                if (next === decoded) break;
                decoded = next;
            } catch (error) {
                break;
            }
        }
        return decoded;
    }

    function normalizeSklandCredentialCandidate(value) {
        const candidate = decodeSklandCredentialText(value).replace(/^["']|["']$/g, '').trim();
        if (!candidate || candidate.length < 12) return null;
        if (candidate.includes('=') || candidate.includes(';')) return null;
        return candidate;
    }

    async function importSklandOperatorsToAccount(accountId) {
        const targetAccountId = normalizeAccountId(accountId);
        const credential = readSklandCredentialFromStorage();
        const refreshed = await refreshSklandToken(credential);
        const binding = await getSklandArknightsBinding(credential, refreshed.token, refreshed.timestamp);
        const playerInfo = await getSklandGamePlayerInfo(credential, refreshed.token, refreshed.timestamp, binding.uid);
        const names = convertSklandPlayerInfoToNames(playerInfo);

        accountsData[targetAccountId] = names;
        activeAccountId = targetAccountId;
        saveAccountsData();
        ownedOpsSet = new Set(names);

        const summary = {
            accountId: targetAccountId,
            operatorCount: names.length,
            nickname: binding.nickname,
            uid: binding.uid,
            importedAt: new Date().toISOString()
        };
        GM_setValue(SKLAND_LAST_IMPORT_KEY, JSON.stringify(summary));
        return summary;
    }

    async function refreshSklandToken(credential) {
        const path = '/api/v1/auth/refresh';
        const timestamp = `${Math.floor(Date.now() / 1000)}`;
        const sign = await generateSklandSign('', path, '', timestamp);
        const data = await sklandRequestJson(`${SKLAND_BASE_URL}${path}`, {
            method: 'GET',
            headers: buildSklandHeaders(timestamp, sign, { cred: credential })
        });
        if (data.code !== 0 || data.message !== 'OK' || !isPlainRecord(data.data) || typeof data.data.token !== 'string') {
            throw new Error('森空岛登录凭据已失效，请刷新页面或重新登录森空岛。');
        }
        return {
            token: data.data.token,
            timestamp: stringValue(data.timestamp) || timestamp
        };
    }

    async function getSklandArknightsBinding(credential, token, timestamp) {
        const data = await sklandSignedGet('/api/v1/game/player/binding', '', credential, token, timestamp);
        if (data.code !== 0 || data.message !== 'OK' || !isPlainRecord(data.data) || !Array.isArray(data.data.list)) {
            throw new Error('读取森空岛绑定角色失败，请稍后重试。');
        }

        for (const item of data.data.list) {
            if (!isPlainRecord(item) || item.appCode !== 'arknights' || !Array.isArray(item.bindingList)) continue;
            const bindingList = item.bindingList.filter(isPlainRecord);
            const first = bindingList[0];
            const uid = stringValue(item.defaultUid ?? first?.uid);
            const matched = bindingList.find(binding => stringValue(binding.uid) === uid) || first;
            const nickname = stringValue(matched?.nickName ?? matched?.nickname ?? uid);
            const channel = stringValue(matched?.channelName ?? matched?.channel ?? '官方');
            if (uid && nickname) {
                return { uid, nickname, channelName: channel || '官方' };
            }
        }
        throw new Error('森空岛账号未找到已绑定的明日方舟角色。');
    }

    async function getSklandGamePlayerInfo(credential, token, timestamp, uid) {
        const query = `uid=${encodeURIComponent(uid)}`;
        const data = await sklandSignedGet('/api/v1/game/player/info', query, credential, token, timestamp);
        if (data.code !== 0 || data.message !== 'OK') {
            throw new Error('读取森空岛干员数据失败，请稍后重试。');
        }
        return data;
    }

    async function sklandSignedGet(path, query, credential, token, timestamp) {
        const sign = await generateSklandSign(token, path, query, timestamp);
        const url = `${SKLAND_BASE_URL}${path}${query ? `?${query}` : ''}`;
        return sklandRequestJson(url, {
            method: 'GET',
            headers: buildSklandHeaders(timestamp, sign, { cred: credential, token })
        });
    }

    function buildSklandHeaders(timestamp, sign, extraHeaders = {}) {
        return {
            'Content-Type': 'application/json',
            platform: '1',
            'Accept-Language': 'zh-Hans-CN;q=1.0',
            dId: '',
            vName: '1.21.0',
            language: 'zh-hans-CN',
            sign,
            timestamp,
            ...extraHeaders
        };
    }

    async function sklandRequestJson(url, init) {
        const method = init.method || 'GET';
        const headers = init.headers || {};
        const body = init.body;
        let fetchError = null;

        if (typeof fetch === 'function') {
            const controller = typeof AbortController === 'function' ? new AbortController() : null;
            const timeoutId = controller ? window.setTimeout(() => controller.abort(), SKLAND_REQUEST_TIMEOUT_MS) : null;
            try {
                const response = await fetch(url, {
                    method,
                    headers,
                    body,
                    signal: controller?.signal,
                    credentials: 'omit'
                });
                if (!response.ok) throw new Error(`森空岛接口请求失败: HTTP ${response.status}`);
                return await response.json();
            } catch (error) {
                fetchError = error;
            } finally {
                if (timeoutId !== null) window.clearTimeout(timeoutId);
            }
        }

        if (typeof GM_xmlhttpRequest !== 'function') {
            throw fetchError instanceof Error ? fetchError : new Error('森空岛接口请求失败，请稍后重试。');
        }

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method,
                url,
                headers,
                data: body,
                timeout: SKLAND_REQUEST_TIMEOUT_MS,
                responseType: 'json',
                onload: response => {
                    if (response.status < 200 || response.status >= 300) {
                        reject(new Error(`森空岛接口请求失败: HTTP ${response.status}`));
                        return;
                    }
                    if (response.response && typeof response.response === 'object') {
                        resolve(response.response);
                        return;
                    }
                    try {
                        resolve(JSON.parse(response.responseText || 'null'));
                    } catch (error) {
                        reject(new Error('森空岛接口返回格式异常，请稍后重试。'));
                    }
                },
                ontimeout: () => reject(new Error('森空岛接口请求超时，请稍后重试。')),
                onerror: () => reject(new Error('森空岛接口请求失败，请稍后重试。'))
            });
        });
    }

    function convertSklandPlayerInfoToNames(gamePlayerInfo) {
        const data = isPlainRecord(gamePlayerInfo) && isPlainRecord(gamePlayerInfo.data) ? gamePlayerInfo.data : null;
        const chars = data && Array.isArray(data.chars) ? data.chars : [];
        const charInfoMap = data && isPlainRecord(data.charInfoMap) ? data.charInfoMap : {};
        const names = [];

        for (const raw of chars) {
            if (!isPlainRecord(raw)) continue;
            const id = stringValue(raw.charId ?? raw.id);
            if (!id.startsWith('char_')) continue;
            const meta = isPlainRecord(charInfoMap[id]) ? charInfoMap[id] : null;
            const name = normalizeOperatorName(meta?.name ?? raw.name);
            if (name) names.push(name);
        }

        const sanitized = sanitizeOperatorNames(names);
        if (sanitized.length === 0) {
            throw new Error('森空岛干员数据为空，请确认账号已绑定明日方舟角色。');
        }
        return sanitized.sort((left, right) => left.localeCompare(right, 'zh-CN'));
    }

    async function generateSklandSign(token, path, queryOrBody, timestamp) {
        const headerForSign = {
            platform: '1',
            timestamp,
            dId: '',
            vName: '1.21.0'
        };
        const source = path + queryOrBody + timestamp + JSON.stringify(headerForSign);
        const hmac = await hmacSha256Hex(token, source);
        return md5Hex(hmac);
    }

    async function hmacSha256Hex(key, message) {
        const blockSize = 64;
        let keyBytes = utf8Bytes(key);
        if (keyBytes.length > blockSize) keyBytes = await sha256Bytes(keyBytes);

        const paddedKey = new Uint8Array(blockSize);
        paddedKey.set(keyBytes);

        const outerPad = new Uint8Array(blockSize);
        const innerPad = new Uint8Array(blockSize);
        for (let i = 0; i < blockSize; i++) {
            outerPad[i] = paddedKey[i] ^ 0x5c;
            innerPad[i] = paddedKey[i] ^ 0x36;
        }

        const innerHash = await sha256Bytes(concatBytes(innerPad, utf8Bytes(message)));
        const finalHash = await sha256Bytes(concatBytes(outerPad, innerHash));
        return bytesToHex(finalHash);
    }

    async function sha256Bytes(bytes) {
        if (!window.crypto?.subtle) throw new Error('当前浏览器不支持森空岛请求签名所需的 WebCrypto。');
        return new Uint8Array(await window.crypto.subtle.digest('SHA-256', bytes));
    }

    function utf8Bytes(value) {
        return new TextEncoder().encode(String(value));
    }

    function concatBytes(left, right) {
        const combined = new Uint8Array(left.length + right.length);
        combined.set(left, 0);
        combined.set(right, left.length);
        return combined;
    }

    function bytesToHex(bytes) {
        return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function md5Hex(input) {
        const bytes = utf8Bytes(input);
        const wordCount = (((bytes.length + 8) >>> 6) + 1) * 16;
        const words = new Array(wordCount).fill(0);
        for (let i = 0; i < bytes.length; i++) {
            words[i >> 2] |= bytes[i] << ((i % 4) * 8);
        }
        words[bytes.length >> 2] |= 0x80 << ((bytes.length % 4) * 8);
        const bitLength = bytes.length * 8;
        words[wordCount - 2] = bitLength >>> 0;
        words[wordCount - 1] = Math.floor(bitLength / 0x100000000) >>> 0;

        let a = 0x67452301;
        let b = 0xefcdab89;
        let c = 0x98badcfe;
        let d = 0x10325476;

        for (let i = 0; i < wordCount; i += 16) {
            const oldA = a;
            const oldB = b;
            const oldC = c;
            const oldD = d;

            a = md5Ff(a, b, c, d, words[i], 7, -680876936);
            d = md5Ff(d, a, b, c, words[i + 1], 12, -389564586);
            c = md5Ff(c, d, a, b, words[i + 2], 17, 606105819);
            b = md5Ff(b, c, d, a, words[i + 3], 22, -1044525330);
            a = md5Ff(a, b, c, d, words[i + 4], 7, -176418897);
            d = md5Ff(d, a, b, c, words[i + 5], 12, 1200080426);
            c = md5Ff(c, d, a, b, words[i + 6], 17, -1473231341);
            b = md5Ff(b, c, d, a, words[i + 7], 22, -45705983);
            a = md5Ff(a, b, c, d, words[i + 8], 7, 1770035416);
            d = md5Ff(d, a, b, c, words[i + 9], 12, -1958414417);
            c = md5Ff(c, d, a, b, words[i + 10], 17, -42063);
            b = md5Ff(b, c, d, a, words[i + 11], 22, -1990404162);
            a = md5Ff(a, b, c, d, words[i + 12], 7, 1804603682);
            d = md5Ff(d, a, b, c, words[i + 13], 12, -40341101);
            c = md5Ff(c, d, a, b, words[i + 14], 17, -1502002290);
            b = md5Ff(b, c, d, a, words[i + 15], 22, 1236535329);

            a = md5Gg(a, b, c, d, words[i + 1], 5, -165796510);
            d = md5Gg(d, a, b, c, words[i + 6], 9, -1069501632);
            c = md5Gg(c, d, a, b, words[i + 11], 14, 643717713);
            b = md5Gg(b, c, d, a, words[i], 20, -373897302);
            a = md5Gg(a, b, c, d, words[i + 5], 5, -701558691);
            d = md5Gg(d, a, b, c, words[i + 10], 9, 38016083);
            c = md5Gg(c, d, a, b, words[i + 15], 14, -660478335);
            b = md5Gg(b, c, d, a, words[i + 4], 20, -405537848);
            a = md5Gg(a, b, c, d, words[i + 9], 5, 568446438);
            d = md5Gg(d, a, b, c, words[i + 14], 9, -1019803690);
            c = md5Gg(c, d, a, b, words[i + 3], 14, -187363961);
            b = md5Gg(b, c, d, a, words[i + 8], 20, 1163531501);
            a = md5Gg(a, b, c, d, words[i + 13], 5, -1444681467);
            d = md5Gg(d, a, b, c, words[i + 2], 9, -51403784);
            c = md5Gg(c, d, a, b, words[i + 7], 14, 1735328473);
            b = md5Gg(b, c, d, a, words[i + 12], 20, -1926607734);

            a = md5Hh(a, b, c, d, words[i + 5], 4, -378558);
            d = md5Hh(d, a, b, c, words[i + 8], 11, -2022574463);
            c = md5Hh(c, d, a, b, words[i + 11], 16, 1839030562);
            b = md5Hh(b, c, d, a, words[i + 14], 23, -35309556);
            a = md5Hh(a, b, c, d, words[i + 1], 4, -1530992060);
            d = md5Hh(d, a, b, c, words[i + 4], 11, 1272893353);
            c = md5Hh(c, d, a, b, words[i + 7], 16, -155497632);
            b = md5Hh(b, c, d, a, words[i + 10], 23, -1094730640);
            a = md5Hh(a, b, c, d, words[i + 13], 4, 681279174);
            d = md5Hh(d, a, b, c, words[i], 11, -358537222);
            c = md5Hh(c, d, a, b, words[i + 3], 16, -722521979);
            b = md5Hh(b, c, d, a, words[i + 6], 23, 76029189);
            a = md5Hh(a, b, c, d, words[i + 9], 4, -640364487);
            d = md5Hh(d, a, b, c, words[i + 12], 11, -421815835);
            c = md5Hh(c, d, a, b, words[i + 15], 16, 530742520);
            b = md5Hh(b, c, d, a, words[i + 2], 23, -995338651);

            a = md5Ii(a, b, c, d, words[i], 6, -198630844);
            d = md5Ii(d, a, b, c, words[i + 7], 10, 1126891415);
            c = md5Ii(c, d, a, b, words[i + 14], 15, -1416354905);
            b = md5Ii(b, c, d, a, words[i + 5], 21, -57434055);
            a = md5Ii(a, b, c, d, words[i + 12], 6, 1700485571);
            d = md5Ii(d, a, b, c, words[i + 3], 10, -1894986606);
            c = md5Ii(c, d, a, b, words[i + 10], 15, -1051523);
            b = md5Ii(b, c, d, a, words[i + 1], 21, -2054922799);
            a = md5Ii(a, b, c, d, words[i + 8], 6, 1873313359);
            d = md5Ii(d, a, b, c, words[i + 15], 10, -30611744);
            c = md5Ii(c, d, a, b, words[i + 6], 15, -1560198380);
            b = md5Ii(b, c, d, a, words[i + 13], 21, 1309151649);
            a = md5Ii(a, b, c, d, words[i + 4], 6, -145523070);
            d = md5Ii(d, a, b, c, words[i + 11], 10, -1120210379);
            c = md5Ii(c, d, a, b, words[i + 2], 15, 718787259);
            b = md5Ii(b, c, d, a, words[i + 9], 21, -343485551);

            a = md5Add(a, oldA);
            b = md5Add(b, oldB);
            c = md5Add(c, oldC);
            d = md5Add(d, oldD);
        }

        return md5WordToHex(a) + md5WordToHex(b) + md5WordToHex(c) + md5WordToHex(d);
    }

    function md5Add(left, right) {
        return (left + right) >>> 0;
    }

    function md5RotateLeft(value, shift) {
        return (value << shift) | (value >>> (32 - shift));
    }

    function md5Cmn(query, a, b, x, shift, constant) {
        return md5Add(md5RotateLeft(md5Add(md5Add(a, query), md5Add(x, constant)), shift), b);
    }

    function md5Ff(a, b, c, d, x, shift, constant) {
        return md5Cmn((b & c) | (~b & d), a, b, x, shift, constant);
    }

    function md5Gg(a, b, c, d, x, shift, constant) {
        return md5Cmn((b & d) | (c & ~d), a, b, x, shift, constant);
    }

    function md5Hh(a, b, c, d, x, shift, constant) {
        return md5Cmn(b ^ c ^ d, a, b, x, shift, constant);
    }

    function md5Ii(a, b, c, d, x, shift, constant) {
        return md5Cmn(c ^ (b | ~d), a, b, x, shift, constant);
    }

    function md5WordToHex(word) {
        let output = '';
        for (let i = 0; i < 4; i++) {
            output += ((word >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
        }
        return output;
    }

    function parseFloatingPosition(rawValue) {
        const fallback = { top: '40%', isRight: true };
        const parsed = typeof rawValue === 'string' ? safeJsonParse(rawValue, fallback) : rawValue;
        const topValue = typeof parsed?.top === 'string' ? parsed.top : fallback.top;
        const topNumber = /^-?\d+(?:\.\d+)?%$/.test(topValue) ? parseFloat(topValue) : parseFloat(fallback.top);
        const clampedTop = Math.min(95, Math.max(0, topNumber));

        return {
            top: `${Number(clampedTop.toFixed(1))}%`,
            isRight: parsed?.isRight !== false
        };
    }

    function normalizeFilterMode(mode) {
        return ['NONE', 'PERFECT', 'SUPPORT'].includes(mode) ? mode : 'NONE';
    }

    function findSearchInputGroup() {
        const blueprintGroup = document.querySelector(BP_SELECTORS.inputGroup);
        if (blueprintGroup) return blueprintGroup;

        const searchInput = document.querySelector('input[type="search"][enterkeyhint="search"]') ||
                            document.querySelector('input[type="search"]');
        return searchInput?.closest('div') || null;
    }

    function getCardSignature(card) {
        if (!card) return '';

        const ignoredSelector = '.prts-status-label, .prts-video-box, #prts-filter-bar, #prts-float-container';
        const parts = [];
        const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                if (node.parentElement?.closest(ignoredSelector)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
        });

        let node = walker.nextNode();
        while (node) {
            parts.push(node.nodeValue.trim());
            node = walker.nextNode();
        }
        return parts.join('|');
    }

    function buildFallbackOperation(card) {
        const tags = Array.from(card.querySelectorAll(`${BP_SELECTORS.tag}, .prts-op-text`));
        const requiredOps = [];
        const requiredGroups = [];

        tags.forEach(tag => {
            if (tag.querySelector('h4')) return;
            if (tag.style.display === 'none') return;

            const text = tag.innerText.trim();
            if (!text || ['普通', '突袭', 'Beta'].includes(text) || text.includes('活动关卡') ||
                text.includes('|') || text.includes('更新') || text.includes('作者')) return;

            let name = text.split(/\s+/)[0];
            const isGroup = /^\[.*\]$/.test(name) || tag.classList.contains('prts-op-text');
            name = name.replace(/^\[|\]$/g, '');

            if (!name) return;

            if (isGroup) {
                // 尝试获取悬浮窗组件内部的文本内容
                const targetNode = tag.closest(BP_SELECTORS.popoverTarget);
                let groupCandidates = [];
                if (targetNode) {
                    const popoverText = extractPopoverContentFromFiber(targetNode);
                    // 格式化文本 "-> 塞雷娅, 临光" -> ["塞雷娅", "临光"]
                    const cleanStr = popoverText.replace(/^->\s*/, '');
                    const names = cleanStr.split(/[,，]\s*/).map(s => s.split(/\s+/)[0]).filter(Boolean);
                    groupCandidates = names.map(n => ({ name: n }));
                }
                requiredGroups.push({ name: name, opers: groupCandidates });
            } else {
                requiredOps.push({ name });
            }
        });

        return { parsedContent: { opers: requiredOps, groups: requiredGroups }, _isFallback: true };
    }

    function getOperationForCard(card, cardInner) {
        const signature = getCardSignature(card);
        const cached = operationCache.get(card);
        if (cached && cached.signature === signature) {
            return cached.operation;
        }

        const operation = extractOperationFromFiber(cardInner) || extractOperationFromFiber(card) || buildFallbackOperation(card);
        operationCache.set(card, { signature, operation });
        return operation;
    }

    function updateStatusLabel(label, className, iconText, text) {
        const state = `${className}|${iconText}|${text}`;
        if (label.dataset.prtsStatusState === state) return;

        label.className = className;
        label.replaceChildren();

        const icon = document.createElement('span');
        icon.className = 'bp4-icon';
        icon.style.marginRight = '6px';
        icon.textContent = iconText;

        label.appendChild(icon);
        label.appendChild(document.createTextNode(text));
        label.dataset.prtsStatusState = state;
    }

    // [样式] CSS 样式定义
    const mergedStyles = `
    /* ==========================================================================
       [PRTS 业务模块] 专有组件样式
       ========================================================================== */

    /* 1. 描述容器 (Hover 展开) */
    .prts-desc-wrapper { position: relative; height: 24px; margin: 2px 0; width: 100%; z-index: 10; }
    .prts-desc-wrapper:hover { z-index: 100; }
    .prts-desc-content {
        width: 100%; height: 24px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        font-size: 13px; color: #6b7280; line-height: 24px; border-radius: 4px; background-color: transparent;
    }
    .prts-desc-wrapper:hover .prts-desc-content {
        position: absolute; top: -4px; left: -8px; width: calc(100% + 16px); height: auto;
        white-space: normal; overflow: visible; background-color: #ffffff; color: #374151;
        padding: 4px 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.2); border: 1px solid #e5e7eb;
    }

    body.dark .prts-desc-content { color: #8a9baa; }
    body.high-contrast-theme .prts-desc-content { color: #a1a1aa; }

    body.dark .prts-desc-wrapper:hover .prts-desc-content {
        background-color: #30404d; color: #f5f8fa; border-color: #415262;
        box-shadow: 0 4px 16px rgba(0,0,0,0.5);
    }
    body.high-contrast-theme .prts-desc-wrapper:hover .prts-desc-content {
        background-color: #18181c; border-color: #38383b;
    }

    /* 2. 视频链接 */
    .prts-video-box { margin-top: 2px; margin-bottom: 6px; display: flex; align-items: center; position: relative; z-index: 1; }
    .prts-bili-link {
        display: inline-flex !important; align-items: center; color: #94a3b8 !important;
        font-size: 12px !important; font-weight: normal !important; text-decoration: none !important;
        padding: 2px 0; background: transparent !important; border: none !important; transition: color 0.2s; cursor: pointer;
    }
    .prts-bili-link:hover { color: #fb7299 !important; text-decoration: underline !important; }
    body.dark .prts-bili-link { color: #415262 !important; }
    body.dark .prts-bili-link:hover { color: #fb7299 !important; }
    body.high-contrast-theme .prts-bili-link { color: #6b7280 !important; }
    body.high-contrast-theme .prts-bili-link:hover { color: #fb7299 !important; }

    .prts-bili-link .bp4-icon { margin-right: 4px; font-size: 11px; }

    /* 3. 筛选栏与按钮 */
    #prts-filter-bar { display: flex; align-items: center; flex-wrap: wrap; width: 100%; margin-top: 8px; margin-bottom: 12px; padding-left: 2px; }
    .prts-btn {
        background: none !important; background-color: transparent !important; border: none !important;
        box-shadow: none !important; cursor: pointer !important; display: inline-flex !important;
        align-items: center !important; justify-content: center !important; padding: 6px 12px !important;
        font-size: 14px !important; color: #5c7080 !important; border-radius: 3px !important;
        min-height: 30px !important; line-height: 1 !important; font-weight: normal !important;
        margin-right: 4px !important; transition: background-color 0.1s cubic-bezier(0.4, 1, 0.75, 0.9) !important;
    }
    .prts-btn:hover { background-color: rgba(167, 182, 194, 0.3) !important; color: #1c2127 !important; text-decoration: none !important; }
    .prts-btn.prts-active { background-color: rgba(167, 182, 194, 0.3) !important; color: #2563eb !important; font-weight: 600 !important; }
    .prts-btn .bp4-icon { margin-right: 7px !important; color: #5c7080 !important; fill: currentColor !important; }
    .prts-btn-icon-img, .prts-btn-icon-svg { width: 16px !important; height: 16px !important; margin-right: 7px !important; border-radius: 3px !important; flex: 0 0 auto !important; object-fit: contain !important; display: inline-block !important; vertical-align: middle !important; }
    .prts-btn-icon-svg { overflow: visible !important; }
    .prts-btn.prts-active .bp4-icon { color: #2563eb !important; }

    body.dark .prts-btn { color: #8a9baa !important; }
    body.dark .prts-btn:hover, body.dark .prts-btn.prts-active {
        background-color: rgba(138, 155, 168, 0.15) !important; color: #f5f8fa !important;
    }
    body.dark .prts-btn.prts-active { color: #60a5fa !important; }
    body.dark .prts-btn .bp4-icon { color: #8a9baa !important; }
    body.dark .prts-btn.prts-active .bp4-icon { color: #60a5fa !important; }

    body.high-contrast-theme .prts-btn { color: #a7b6c2 !important; }
    body.high-contrast-theme .prts-btn:hover, body.high-contrast-theme .prts-btn.prts-active {
        background-color: rgba(138, 155, 168, 0.15) !important; color: #f5f8fa !important;
    }
    body.high-contrast-theme .prts-btn.prts-active { color: #60a5fa !important; }
    body.high-contrast-theme .prts-btn .bp4-icon { color: #a7b6c2 !important; }
    body.high-contrast-theme .prts-btn.prts-active .bp4-icon { color: #60a5fa !important; }


    /* [V12.0/3.1.0] 多账号悬浮面板小按钮专属样式 */
    .prts-acc-btn { min-width: 28px !important; padding: 2px 6px !important; border: 1px solid #cbd5e1 !important; margin: 0 !important; border-radius: 4px !important; transition: all 0.2s; }
    .prts-acc-btn.active { background-color: #3b82f6 !important; color: #fff !important; border-color: #3b82f6 !important; }
    body.dark .prts-acc-btn { border-color: #415262 !important; color: #c4d0dc !important; }
    body.dark .prts-acc-btn.active { background-color: #2563eb !important; border-color: #2563eb !important; color: #fff !important; }
    body.high-contrast-theme .prts-acc-btn { border-color: #38383b !important; color: #d1d5db !important; }
    body.high-contrast-theme .prts-acc-btn.active { background-color: #2563eb !important; border-color: #2563eb !important; color: #fff !important; }


    .prts-divider { width: 1px; height: 16px; background-color: rgba(16, 22, 26, 0.15); margin: 0 8px; display: inline-block; }
    body.dark .prts-divider { background-color: rgba(255, 255, 255, 0.15); }
    body.high-contrast-theme .prts-divider { background-color: rgba(255, 255, 255, 0.15); }


    /* 4. 状态标签与卡片置灰 */
    .prts-status-label {
        font-size: 13px !important; font-weight: 700 !important; display: flex !important;
        align-items: center !important; line-height: 1.5 !important; margin-bottom: 4px !important;
    }

    .prts-label-missing { color: #dc2626 !important; }
    body.dark .prts-label-missing { color: #ef4444 !important; }
    .prts-label-support { color: #d97706 !important; }
    body.dark .prts-label-support { color: #f59e0b !important; }
    body.high-contrast-theme .prts-label-missing { color: #ef4444 !important; }
    body.high-contrast-theme .prts-label-support { color: #f59e0b !important; }


    .prts-card-gray .bp4-card, .prts-card-gray .bp6-card { opacity: 0.4 !important; filter: grayscale(1) !important; transition: opacity 0.2s ease, filter 0.2s ease !important; }
    .prts-card-gray:hover .bp4-card, .prts-card-gray:hover .bp6-card { opacity: 0.9 !important; filter: grayscale(0) !important; }

    /* 5. 干员显示 (Grid, Items, Avatar, Badges) */
    .prts-op-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; margin-bottom: 8px; align-items: center; }
    .prts-op-grid .bp4-popover2-target, .prts-op-grid .bp6-popover-target { display: inline-flex !important; margin: 0 !important; padding: 0 !important; vertical-align: top !important; height: 42px !important; }

    body.dark .bg-orange-200.ring-orange-300 { background-color: rgba(234, 88, 12, 0.2) !important; --tw-ring-color: rgba(249, 115, 22, 0.6) !important; box-shadow: inset 0 0 0 2px var(--tw-ring-color) !important; }
    body.dark .bg-yellow-100.ring-yellow-200 { background-color: rgba(234, 179, 8, 0.2) !important; --tw-ring-color: rgba(234, 179, 8, 0.6) !important; box-shadow: inset 0 0 0 2px var(--tw-ring-color) !important; }
    body.dark .bg-purple-100.ring-purple-200 { background-color: rgba(147, 51, 234, 0.2) !important; --tw-ring-color: rgba(168, 85, 247, 0.6) !important; box-shadow: inset 0 0 0 2px var(--tw-ring-color) !important; }
    body.dark .bg-slate-100.ring-slate-200 { background-color: #202b33 !important; --tw-ring-color: #415262 !important; box-shadow: inset 0 0 0 2px #415262 !important; color: #415262 !important; }
    body.dark .text-slate-300 { color: #415262 !important; }

    body.high-contrast-theme .bg-orange-200.ring-orange-300 { background-color: rgba(234, 88, 12, 0.2) !important; --tw-ring-color: rgba(249, 115, 22, 0.6) !important; box-shadow: inset 0 0 0 2px var(--tw-ring-color) !important; }
    body.high-contrast-theme .bg-yellow-100.ring-yellow-200 { background-color: rgba(234, 179, 8, 0.2) !important; --tw-ring-color: rgba(234, 179, 8, 0.6) !important; box-shadow: inset 0 0 0 2px var(--tw-ring-color) !important; }
    body.high-contrast-theme .bg-purple-100.ring-purple-200 { background-color: rgba(147, 51, 234, 0.2) !important; --tw-ring-color: rgba(168, 85, 247, 0.6) !important; box-shadow: inset 0 0 0 2px var(--tw-ring-color) !important; }
    body.high-contrast-theme .bg-slate-100.ring-slate-200 { background-color: #2d2d30 !important; --tw-ring-color: #38383b !important; box-shadow: inset 0 0 0 2px #38383b !important; color: #52525b !important; }
    body.high-contrast-theme .text-slate-300 { color: #52525b !important; }


    .prts-op-item, .prts-op-text { position: relative; width: 42px; height: 42px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s; box-sizing: border-box; }
    .prts-op-item:hover, .prts-op-text:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.2); z-index: 50; }

    .prts-op-item { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    body.dark .prts-op-item { background-color: #293d4e; border-color: #415262; }
    .prts-op-item:hover { border-color: #3b82f6; }
    body.dark .prts-op-item:hover { border-color: #60a5fa; }
    body.high-contrast-theme .prts-op-item { background-color: #2d2d30; border-color: #38383b; }
    body.high-contrast-theme .prts-op-item:hover { border-color: #60a5fa; }


    .prts-op-img { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 3px; }

    .prts-op-text { display: flex; align-items: center; justify-content: center; background-color: #f1f5f9; color: #475569; border: 1px dashed #94a3b8; border-radius: 4px; font-size: 12px; font-weight: bold; text-align: center; line-height: 1.1; padding: 2px; word-break: break-all; }
    .prts-op-text:hover { border-style: solid; border-color: #3b82f6; background-color: #fff; }
    body.dark .prts-op-text { background-color: #293d4e; color: #c4d0dc; border: 1px solid #415262; }
    body.dark .prts-op-text:hover { background-color: #293d4e; border-color: #60a5fa; }
    body.high-contrast-theme .prts-op-text { background-color: #2d2d30; color: #d1d5db; border: 1px solid #38383b; }
    body.high-contrast-theme .prts-op-text:hover { background-color: #2d2d30; border-color: #60a5fa; }


    /* 关卡徽章 */
    .prts-level-badge { display: inline-flex; align-items: center; justify-content: center; background-color: #3b82f6; color: #ffffff !important; padding: 2px 8px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, monospace; font-weight: 700; font-size: 0.95em; margin-right: 8px; border: 1px solid #2563eb; vertical-align: middle; line-height: 1.2; flex-shrink: 0; box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2); }
    body.dark .prts-level-badge { background-color: #1e3a8a; border-color: #1e40af; color: #e0e7ff !important; box-shadow: none; }
    body.high-contrast-theme .prts-level-badge { background-color: #1e3a8a; border-color: #1e40af; color: #e0e7ff !important; box-shadow: none; }


    /* 技能角标与 Grid Popover */
    .bp4-popover2-content, .bp6-popover-content { background-color: #ffffff !important; color: #18181b !important; border: 1px solid #e5e7eb !important; box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important; }
    body.dark .bp4-popover2-content, body.dark .bp6-popover-content { background-color: #30404d !important; color: #f5f8fa !important; border-color: #415262 !important; box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important; }
    body.high-contrast-theme .bp4-popover2-content, body.high-contrast-theme .bp6-popover-content { background-color: #18181c !important; color: #e0e0e0 !important; border-color: #38383b !important; box-shadow: 0 4px 12px rgba(0,0,0,0.6) !important; }

    .bp4-popover2-arrow-fill { fill: #ffffff !important; }
    body.dark .bp4-popover2-arrow-fill { fill: #30404d !important; }
    body.high-contrast-theme .bp4-popover2-arrow-fill { fill: #18181c !important; }

    .bp4-popover2-arrow-border { fill: #e5e7eb !important; }
    body.dark .bp4-popover2-arrow-border { fill: #415262 !important; }
    body.high-contrast-theme .bp4-popover2-arrow-border { fill: #38383b !important; }

    /* bp4-menu inside popover: must be transparent to inherit popover bg */
    .bp4-popover2-content .bp4-menu, .bp6-popover-content .bp6-menu { background-color: transparent !important; border: none !important; }
    body.dark .bp4-popover2-content .bp4-menu, body.dark .bp6-popover-content .bp6-menu { background-color: transparent !important; border: none !important; }
    body.high-contrast-theme .bp4-popover2-content .bp4-menu, body.high-contrast-theme .bp6-popover-content .bp6-menu { background-color: transparent !important; border: none !important; }

    /* bp4-menu-item hover & selected states */
    .bp4-menu-item:hover, .bp4-menu-item.bp4-active, .bp6-menu-item:hover, .bp6-menu-item.bp6-active { background-color: rgba(167, 182, 194, 0.15) !important; }
    .bp4-menu-item.bp4-selected, .bp6-menu-item.bp6-selected { background-color: rgba(59, 130, 246, 0.15) !important; color: #f5f8fa !important; }
    body.dark .bp4-menu-item:hover, body.dark .bp4-menu-item.bp4-active, body.dark .bp6-menu-item:hover, body.dark .bp6-menu-item.bp6-active { background-color: rgba(138, 155, 168, 0.15) !important; }
    body.dark .bp4-menu-item.bp4-selected, body.dark .bp6-menu-item.bp6-selected { background-color: rgba(139, 92, 246, 0.15) !important; color: #f5f8fa !important; }
    body.high-contrast-theme .bp4-menu-item:hover, body.high-contrast-theme .bp4-menu-item.bp4-active, body.high-contrast-theme .bp6-menu-item:hover, body.high-contrast-theme .bp6-menu-item.bp6-active { background-color: rgba(138, 155, 168, 0.15) !important; }
    body.high-contrast-theme .bp4-menu-item.bp4-selected, body.high-contrast-theme .bp6-menu-item.bp6-selected { background-color: rgba(139, 92, 246, 0.15) !important; color: #e0e0e0 !important; }

    /* bp4-input-group & bp4-input inside popover */
    .bp4-popover2-content .bp4-input-group .bp4-input, .bp6-popover-content .bp6-input-group .bp6-input { background-color: #ffffff; border: 1px solid #e5e7eb; color: #18181b; box-shadow: none; }
    .bp4-popover2-content .bp4-input-group .bp4-input::placeholder, .bp6-popover-content .bp6-input-group .bp6-input::placeholder { color: #9ca3af; }
    body.dark .bp4-popover2-content .bp4-input-group .bp4-input, body.dark .bp6-popover-content .bp6-input-group .bp6-input { background-color: #202b33; border-color: #415262; color: #f5f8fa; }
    body.dark .bp4-popover2-content .bp4-input-group .bp4-input::placeholder, body.dark .bp6-popover-content .bp6-input-group .bp6-input::placeholder { color: #8a9baa; }
    body.high-contrast-theme .bp4-popover2-content .bp4-input-group .bp4-input, body.high-contrast-theme .bp6-popover-content .bp6-input-group .bp6-input { background-color: #2d2d30; border-color: #38383b; color: #ffffff; }
    body.high-contrast-theme .bp4-popover2-content .bp4-input-group .bp4-input::placeholder, body.high-contrast-theme .bp6-popover-content .bp6-input-group .bp6-input::placeholder { color: #6b7280; }

    /* bp4-input-group icon inside popover */
    .bp4-popover2-content .bp4-input-group .bp4-icon, .bp6-popover-content .bp6-input-group .bp6-icon { color: #9ca3af; background-color: transparent; }
    body.dark .bp4-popover2-content .bp4-input-group .bp4-icon, body.dark .bp6-popover-content .bp6-input-group .bp6-icon { color: #8a9baa; background-color: transparent; }
    body.high-contrast-theme .bp4-popover2-content .bp4-input-group .bp4-icon, body.high-contrast-theme .bp6-popover-content .bp6-input-group .bp6-icon { color: #9ca3af; background-color: transparent; }

    /* bp4-button inside popover */
    body.dark .bp4-popover2-content .bp4-button .bp4-button-text, body.dark .bp6-popover-content .bp6-button .bp6-button-text { color: #f5f8fa; }
    body.high-contrast-theme .bp4-popover2-content .bp4-button .bp4-button-text, body.high-contrast-theme .bp6-popover-content .bp6-button .bp6-button-text { color: #e0e0e0; }

    /* bp4-divider inside popover */
    .bp4-popover2-content .bp4-divider, .bp6-popover-content .bp6-divider { border-color: #e5e7eb; }
    body.dark .bp4-popover2-content .bp4-divider, body.dark .bp6-popover-content .bp6-divider { border-color: #415262; }
    body.high-contrast-theme .bp4-popover2-content .bp4-divider, body.high-contrast-theme .bp6-popover-content .bp6-divider { border-color: #38383b; }

    /* bp4-tag inside popover */
    body.dark .bp4-popover2-content .bp4-tag, body.dark .bp6-popover-content .bp6-tag { background-color: #202b33; color: #f5f8fa; }
    body.high-contrast-theme .bp4-popover2-content .bp4-tag, body.high-contrast-theme .bp6-popover-content .bp6-tag { background-color: #2d2d30; color: #e0e0e0; }



    .prts-popover-grid { display: flex; flex-wrap: wrap; gap: 6px; max-width: 320px; padding: 4px; }
    .prts-popover-item { position: relative; width: 48px; height: 48px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
    body.dark .prts-popover-item { background-color: #293d4e; border-color: #415262; }
    body.high-contrast-theme .prts-popover-item { background-color: #2d2d30; border-color: #38383b; }

    .prts-popover-img { width: 100%; height: 100%; object-fit: cover; border-radius: 3px; }

    .prts-op-skill, .prts-popover-skill { position: absolute; bottom: 0; right: 0; z-index: 10; font-size: 11px !important; font-weight: 800 !important; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; line-height: 1.1; text-align: center; padding: 1px 4px; min-width: 14px; border-top-left-radius: 4px; background-color: #18181b !important; color: #f3f4f6 !important; border-top: 1px solid rgba(255, 255, 255, 0.3); border-left: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5); pointer-events: none; }
    .bp4-popover2-content .prts-popover-skill, .bp6-popover-content .prts-popover-skill { background-color: #ffffff !important; color: #000000 !important; border: 1px solid #e5e7eb; }
    body.dark .bp4-popover2-content .prts-popover-skill, body.dark .bp6-popover-content .prts-popover-skill, body.dark .prts-popover-skill { background-color: #30404d !important; color: #f5f8fa !important; border-color: rgba(255, 255, 255, 0.3) !important; }
    body.high-contrast-theme .bp4-popover2-content .prts-popover-skill, body.high-contrast-theme .bp6-popover-content .prts-popover-skill, body.high-contrast-theme .prts-popover-skill { background-color: #18181c !important; color: #e0e0e0 !important; border-color: rgba(255, 255, 255, 0.3) !important; }


    /* 6. 模拟 Tooltip */
    [data-prts-tooltip]:hover::after { content: attr(data-prts-tooltip); position: absolute; bottom: 115%; left: 50%; transform: translateX(-50%); background-color: #1f2937; color: #f9fafb; padding: 5px 8px; font-size: 12px; border-radius: 3px; white-space: nowrap; pointer-events: none; box-shadow: 0 0 0 1px rgba(16,22,26,.1), 0 2px 4px rgba(16,22,26,.2), 0 8px 24px rgba(16,22,26,.2); z-index: 100; }
    [data-prts-tooltip]:hover::before { content: ""; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); border-width: 5px; border-style: solid; border-color: #1f2937 transparent transparent transparent; z-index: 100; }
    body.dark [data-prts-tooltip]:hover::after { background-color: #30404d; }
    body.dark [data-prts-tooltip]:hover::before { border-color: #30404d transparent transparent transparent; }
    body.high-contrast-theme [data-prts-tooltip]:hover::after { background-color: #2d2d30; }
    body.high-contrast-theme [data-prts-tooltip]:hover::before { border-color: #2d2d30 transparent transparent transparent; }


    /* 7. 公告弹窗标签 */
    .prts-dialog-tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 14px; font-weight: bold; margin-right: 8px; color: #fff; vertical-align: middle; }
    .prts-tag-update { background-color: #10b981; } .prts-tag-fix { background-color: #f59e0b; }
    .prts-tag-event { background-color: #3b82f6; } .prts-tag-note { background-color: #64748b; }

    /* 8. 悬浮球 & 控制面板 */
    #prts-float-container { position: fixed; z-index: 9999; display: flex; align-items: center; opacity: 0.6; user-select: none; transition: opacity 0.3s, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
    #prts-float-container:hover, #prts-float-container.prts-float-open { opacity: 1; }
    #prts-float-container.is-dragging { opacity: 1; transition: none !important; }
    #prts-float-container.is-snapping { transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
    #prts-float-container.snap-right:not(:hover):not(.prts-float-open):not(.is-dragging) { transform: translateX(calc(100% - 12px)); }
    #prts-float-container.snap-left:not(:hover):not(.prts-float-open):not(.is-dragging) { transform: translateX(calc(-100% + 12px)); }

    .prts-float-btn { width: 48px; height: 48px; background-color: #fff; border: 1px solid #e5e7eb; border-right: none; border-radius: 8px 0 0 8px; box-shadow: -2px 2px 8px rgba(0,0,0,0.1); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #374151; transition: all 0.3s; position: relative; z-index: 2; }
    .prts-float-btn svg { width: 24px; height: 24px; fill: currentColor; }
    #prts-float-container.snap-left .prts-float-btn { border-radius: 0 8px 8px 0; border-right: 1px solid #e5e7eb; border-left: none; box-shadow: 2px 2px 8px rgba(0,0,0,0.1); }
    body.dark .prts-float-btn { background-color: #30404d; border-color: #415262; color: #f5f8fa; box-shadow: -2px 2px 12px rgba(0,0,0,0.5); }
    body.high-contrast-theme .prts-float-btn { background-color: #2d2d30; border-color: #38383b; color: #e0e0e0; box-shadow: -2px 2px 12px rgba(0,0,0,0.5); }


    .prts-settings-panel { position: absolute; top: 0; width: 260px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 1; visibility: hidden; opacity: 0; pointer-events: none; transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1); right: 55px; left: auto; transform: translateX(20px) scale(0.95); transform-origin: top right; }
    #prts-float-container.snap-left .prts-settings-panel { left: 55px; right: auto; transform: translateX(-20px) scale(0.95); transform-origin: top left; }
    #prts-float-container.prts-float-open .prts-settings-panel { visibility: visible; opacity: 1; transform: translateX(0) scale(1); pointer-events: auto; }
    body.dark .prts-settings-panel { background: #30404d; border-color: #415262; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    body.high-contrast-theme .prts-settings-panel { background: #2d2d30; border-color: #38383b; box-shadow: 0 4px 20px rgba(0,0,0,0.6); }

    .prts-panel-title { font-size: 14px; font-weight: bold; margin-bottom: 12px; color: #1f2937; display: flex; align-items: center; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6; }
    body.dark .prts-panel-title { color: #f5f8fa; border-color: #415262; }
    body.high-contrast-theme .prts-panel-title { color: #e0e0e0; border-color: #38383b; }

    .prts-panel-item { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-size: 13px; color: #4b5563; }
    body.dark .prts-panel-item { color: #c4d0dc; }
    body.high-contrast-theme .prts-panel-item { color: #d1d5db; }


    .prts-switch { position: relative; display: inline-block; width: 36px; height: 20px; }
    .prts-switch input { opacity: 0; width: 0; height: 0; }
    .prts-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px; }
    .prts-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .prts-slider { background-color: #3b82f6; }
    input:checked + .prts-slider:before { transform: translateX(16px); }
    body.dark .prts-slider { background-color: #415262; }
    body.dark input:checked + .prts-slider { background-color: #2563eb; }
    body.high-contrast-theme .prts-slider { background-color: #4b5563; }
    body.high-contrast-theme input:checked + .prts-slider { background-color: #2563eb; }


    /* 9. 侧边栏折叠布局 */
    .prts-sidebar-hidden-layout > div:nth-child(1) {
        width: 100% !important;
        max-width: 100% !important;
        margin-right: 0 !important;
    }
    .prts-sidebar-hidden-layout > div:nth-child(2) {
        display: none !important;
    }
`;

    const sklandImportStyles = `
    #prts-skland-import-panel { position: fixed; right: 16px; top: 96px; z-index: 2147483647; width: 292px; box-sizing: border-box; border: 1px solid rgba(15, 23, 42, 0.12); border-radius: 8px; background: #ffffff; color: #1f2937; box-shadow: 0 14px 38px rgba(15, 23, 42, 0.18); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; overflow: hidden; }
    #prts-skland-import-panel * { box-sizing: border-box; }
    .prts-skland-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px 14px 10px; border-bottom: 1px solid #eef2f7; }
    .prts-skland-title { margin: 0; font-size: 15px; line-height: 1.4; font-weight: 700; color: #111827; }
    .prts-skland-subtitle { margin: 4px 0 0; font-size: 12px; line-height: 1.5; color: #64748b; }
    .prts-skland-close { width: 28px; height: 28px; border: none; border-radius: 4px; background: transparent; color: #64748b; font-size: 20px; line-height: 1; cursor: pointer; }
    .prts-skland-close:hover { background: #f1f5f9; color: #0f172a; }
    .prts-skland-body { padding: 12px 14px 14px; }
    .prts-skland-label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 700; color: #475569; }
    .prts-skland-accounts { display: flex; gap: 6px; margin-bottom: 12px; }
    .prts-skland-account { flex: 1; height: 30px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; color: #475569; cursor: pointer; font-size: 13px; font-weight: 700; }
    .prts-skland-account.active { border-color: #2563eb; background: #2563eb; color: #ffffff; }
    .prts-skland-primary { width: 100%; height: 36px; border: none; border-radius: 4px; background: #2563eb; color: #ffffff; cursor: pointer; font-size: 14px; font-weight: 700; }
    .prts-skland-primary:hover { background: #1d4ed8; }
    .prts-skland-primary:disabled { background: #94a3b8; cursor: wait; }
    .prts-skland-status { min-height: 36px; margin: 12px 0 0; padding: 8px 10px; border-radius: 4px; background: #f8fafc; color: #475569; font-size: 12px; line-height: 1.55; white-space: pre-line; }
    .prts-skland-status.success { background: #ecfdf5; color: #047857; }
    .prts-skland-status.error { background: #fef2f2; color: #b91c1c; }
    .prts-skland-link { display: inline-flex; align-items: center; margin-top: 10px; color: #2563eb; font-size: 12px; text-decoration: none; }
    .prts-skland-link:hover { text-decoration: underline; }
    @media (max-width: 520px) {
        #prts-skland-import-panel { left: 12px; right: 12px; top: auto; bottom: 12px; width: auto; }
    }
`;

    GM_addStyle(isSklandHost() ? sklandImportStyles : mergedStyles);

    // =========================================================================
    //                            MODULE 3: 工具函数与核心算法
    // =========================================================================

    // 获取 React Fiber 节点
    function getFiberNode(element) {
        if (!element) return null;
        const key = Object.keys(element).find(k => k.startsWith('__reactFiber$'));
        return key ? element[key] : null;
    }

    // 提取 React 节点中的文本内容
    function getReactNodeText(node) {
        if (!node) return '';
        if (typeof node === 'string' || typeof node === 'number') return String(node);
        if (Array.isArray(node)) return node.map(getReactNodeText).join('');
        if (node.props && node.props.children) return getReactNodeText(node.props.children);
        return '';
    }

    // 向上遍历 Fiber 树，获取完整的作业数据
    function extractOperationFromFiber(element) {
        let fiber = getFiberNode(element);
        let depth = 0;

        while (fiber && depth < 30) { // 向上遍历最多 30 层
            const props = fiber.memoizedProps;
            if (props) {
                const candidate = props.operation || props.data || props.copilot || props.item;
                if (candidate && typeof candidate === 'object') {
                    if (candidate.parsedContent || Array.isArray(candidate.opers) || typeof candidate.content === 'string') {
                        return candidate;
                    }
                }
            }
            fiber = fiber.return;
            depth++;
        }
        return null;
    }

    // 获取悬浮窗组件(Popover)内部的文本内容
    function extractPopoverContentFromFiber(element) {
        let fiber = getFiberNode(element);
        let depth = 0;

        while (fiber && depth < 15) {
            const props = fiber.memoizedProps;
            if (props && props.content !== undefined) {
                return getReactNodeText(props.content);
            }
            fiber = fiber.return;
            depth++;
        }
        return "";
    }

    function matchOperatorGroups(requiredGroups, ownedOpsSet, usedOwnedOps, allowUnknownFallbackGroup) {
        const groups = requiredGroups
            .map((group, index) => {
                const allowedNames = (group.opers || [])
                    .map(o => o.name)
                    .filter(Boolean);
                const candidates = allowedNames
                    .filter(name => ownedOpsSet.has(name) && !usedOwnedOps.has(name));
                return {
                    index,
                    name: group.name || '未命名干员组',
                    candidates,
                    total: allowedNames.length
                };
            })
            .filter(group => !(allowUnknownFallbackGroup && group.total === 0));

        const groupOrder = [...groups].sort((a, b) => a.candidates.length - b.candidates.length);
        const matchedByOperator = new Map();

        function tryAssign(group, seenOperators) {
            for (const opName of group.candidates) {
                if (seenOperators.has(opName)) continue;
                seenOperators.add(opName);

                const previousGroup = matchedByOperator.get(opName);
                if (!previousGroup || tryAssign(previousGroup, seenOperators)) {
                    matchedByOperator.set(opName, group);
                    return true;
                }
            }
            return false;
        }

        const missingGroups = [];
        groupOrder.forEach(group => {
            if (!tryAssign(group, new Set())) {
                missingGroups.push(`[${group.name}]`);
            }
        });

        matchedByOperator.forEach((group, opName) => {
            usedOwnedOps.add(opName);
        });

        return missingGroups;
    }

    /**
     * 干员与干员组的可用性判定
     */
    function checkOperationAvailability(operation, ownedOpsSet, filterMode) {
        if (!ownedOpsSet || ownedOpsSet.size === 0 || filterMode === 'NONE') {
            return { isAvailable: true, missingCount: 0, missingOps:[] };
        }

        let parsed = operation.parsedContent;
        if (!parsed) {
            if (Array.isArray(operation.opers) || Array.isArray(operation.groups)) {
                parsed = operation;
            } else if (typeof operation.content === 'string') {
                try { parsed = JSON.parse(operation.content); } catch(e) {}
            }
        }
        const { opers: requiredOps = [], groups: requiredGroups =[] } = parsed || {};

        if (requiredOps.length === 0 && requiredGroups.length === 0) {
            return { isAvailable: true, missingCount: 0, missingOps:[] };
        }

        const usedOwnedOps = new Set();
        const missingDetails =[];

        requiredOps.forEach(op => {
            const opName = op.name;
            if (operation._isFallback && !OP_ID_MAP[opName]) return; // 忽略错抓的非干员词汇

            if (ownedOpsSet.has(opName)) {
                usedOwnedOps.add(opName);
            } else {
                missingDetails.push(opName);
            }
        });

        if (requiredGroups.length > 0) {
            const missingGroups = matchOperatorGroups(requiredGroups, ownedOpsSet, usedOwnedOps, operation._isFallback);
            missingDetails.push(...missingGroups);
        }

        const missingCount = missingDetails.length;
        let isAvailable = true;

        if (filterMode === 'PERFECT' && missingCount > 0) {
            isAvailable = false;
        } else if (filterMode === 'SUPPORT' && missingCount > 1) {
            isAvailable = false;
        }

        return { isAvailable, missingCount, missingOps: missingDetails };
    }

    // =========================================================================
    //                            MODULE 4: 数据存取与账号管理
    // =========================================================================

    /**
     * 持久化保存所有多账号数据
     */
    function saveAccountsData() {
        activeAccountId = normalizeAccountId(activeAccountId);
        accountsData = normalizeAccountsData(accountsData);
        GM_setValue(ACCOUNTS_DATA_KEY, JSON.stringify({
            activeAccountId,
            accountsData
        }));
    }

    /**
     * 加载干员数据：具备高级的向下兼容与数据迁移能力
     */
    function loadOwnedOps() {
        currentFilterMode = normalizeFilterMode(currentFilterMode);
        // 尝试加载主存储集合
        const unifiedStore = GM_getValue(ACCOUNTS_DATA_KEY);
        let migrated = false;

        if (unifiedStore) {
            try {
                const parsed = JSON.parse(unifiedStore);
                activeAccountId = normalizeAccountId(parsed.activeAccountId);
                accountsData = normalizeAccountsData(parsed.accountsData);
            } catch (e) {
                console.error('[Better PRTS] 主数据解析失败', e);
                activeAccountId = 1;
                accountsData = createEmptyAccountsData();
            }
        } else {
            // [迁移] 尝试从用户单独定义的 prts_plus_user_ops_N 中恢复
            for (let i = 1; i <= 3; i++) {
                const legacyVal = GM_getValue(`prts_plus_user_ops_${i}`);
                if (legacyVal) {
                    try { accountsData[i] = sanitizeOperatorNames(JSON.parse(legacyVal)); migrated = true; } catch(e){}
                }
            }
            const activeLegacy = GM_getValue('prts_plus_active_account');
            if (activeLegacy) activeAccountId = normalizeAccountId(activeLegacy);

            // [迁移] 尝试从最远古的单账号版本恢复到账号 1
            const veryOldVal = GM_getValue('prts_plus_user_ops');
            if (veryOldVal && accountsData[1].length === 0) {
                try {
                    let ops = JSON.parse(veryOldVal);
                    if (Array.isArray(ops)) {
                    if (ops.length > 0 && typeof ops[0] === 'object') {
                        ops = ops.filter(op => isOwnedOperatorRecord(op) && op.name).map(op => op.name);
                    }
                        accountsData[1] = sanitizeOperatorNames(ops);
                        migrated = true;
                    }
                } catch(e){}
            }
        }

        if (migrated) saveAccountsData(); // 如果发生了任何迁移，立即转储至新结构

        ownedOpsSet = new Set(accountsData[activeAccountId] || []);
        console.log(`[Better PRTS] 已加载账号 ${activeAccountId} 的 ${ownedOpsSet.size} 名持有干员`);
    }

    /**
     * 执行账号切换
     */
    function switchAccount(id) {
        id = normalizeAccountId(id);
        if (id === activeAccountId) return;

        activeAccountId = id;
        saveAccountsData(); // 记忆选中状态

        ownedOpsSet = new Set(accountsData[activeAccountId] ||[]);

        // 1. 同步悬浮窗面板内的小按钮状态
        const accBtns = document.querySelectorAll('.prts-acc-btn');
        accBtns.forEach(btn => {
            if (parseInt(btn.dataset.id) === activeAccountId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 2. 销毁并重建控制栏以刷新UI文案和导入数量
        const bar = document.getElementById('prts-filter-bar');
        if (bar) bar.remove();
        injectFilterControls();

        // 3. 立刻触发重新筛选运算
        if (currentFilterMode !== 'NONE') {
            requestFilterUpdate();
        }
    }

    // 给主控制栏用的循环切换
    function cycleAccount() {
        let nextId = activeAccountId + 1;
        if (nextId > 3) nextId = 1;
        switchAccount(nextId);
    }

    // =========================================================================
    //                            MODULE 5: 业务逻辑 - 筛选、折叠与净化
    // =========================================================================

    function isFilterDisabledPage() {
        const path = window.location.pathname;
        return path.startsWith('/create') || path.startsWith('/editor');
    }

    function handleImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json, .txt';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) {
                alert('❌ 文件过大，请上传标准格式的干员数据文件');
                return;
            }

            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const names = parseImportedOperatorNames(event.target.result, file.name);

                    if (names.length > 0) {
                        // 保存至当前活跃账号
                        accountsData[activeAccountId] = names;
                        saveAccountsData();
                        ownedOpsSet = new Set(names);

                        // 销毁并重建控制栏以更新数字
                        const bar = document.getElementById('prts-filter-bar');
                        if (bar) bar.remove();
                        injectFilterControls();

                        alert(`✅ 账号 ${activeAccountId} 导入成功！
共识别 ${names.length} 名持有干员。`);
                        if (currentFilterMode !== 'NONE') requestFilterUpdate();
                    } else {
                        alert('⚠️ 未能识别有效的干员数据，请检查文件格式');
                    }
                } catch (err) {
                    console.error(err);
                    alert('❌ 导入过程中发生未知错误: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function handleOpenSklandImport() {
        let opened = null;
        try {
            opened = window.open(SKLAND_HOME_URL, '_blank');
            if (opened) opened.opener = null;
        } catch (error) {
            opened = null;
        }
        alert(opened
            ? '已打开森空岛页面。请在森空岛网页登录后，使用页面右侧的 Better-PRTS-Plus 导入面板读取干员数据。'
            : '已尝试打开森空岛页面。如果没有看到新窗口，请手动打开 https://www.skland.com/index 登录后使用 Better-PRTS-Plus 导入面板。');
    }

    function createSklandIconImage() {
        const wrapper = document.createElement('span');
        wrapper.innerHTML = SKLAND_FAVICON_SVG;
        return wrapper.firstElementChild || wrapper;
    }

    function toggleDisplayMode() {
        displayMode = (displayMode === 'GRAY') ? 'HIDE' : 'GRAY';
        GM_setValue(DISPLAY_MODE_KEY, displayMode);
        const bar = document.getElementById('prts-filter-bar');
        if (bar) bar.remove();
        injectFilterControls();
        requestFilterUpdate();
    }

    function toggleFilter(mode) {
        if (ownedOpsSet.size === 0) {
            alert(`请先为当前 账号 ${activeAccountId} 导入干员数据！`);
            return;
        }
        currentFilterMode = (currentFilterMode === mode) ? 'NONE' : mode;
        currentFilterMode = normalizeFilterMode(currentFilterMode);
        GM_setValue(FILTER_MODE_KEY, currentFilterMode);
        updateFilterButtonStyles();
        requestFilterUpdate();
    }

    function applySidebarCollapse() {
        if (isFilterDisabledPage()) return;
        const wrapper = document.querySelector('.docs-content-wrapper');
        if (!wrapper) return;
        const layoutContainer = wrapper.firstElementChild;
        if (layoutContainer && layoutContainer.classList.contains('flex')) {
            if (CONFIG.hideSidebar) {
                layoutContainer.classList.add('prts-sidebar-hidden-layout');
            } else {
                layoutContainer.classList.remove('prts-sidebar-hidden-layout');
            }
        }
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

    function injectFilterControls() {
        if (isFilterDisabledPage()) {
            const existing = document.getElementById('prts-filter-bar');
            if (existing) existing.remove();
            return;
        }

        const searchInputGroup = findSearchInputGroup();
        if (!searchInputGroup) return;
        const searchRow = searchInputGroup.parentElement;
        if (!searchRow || !searchRow.parentNode) return;

        let controlBar = document.getElementById('prts-filter-bar');
        let isNew = false;
        if (!controlBar) {
            isNew = true;
            controlBar = document.createElement('div');
            controlBar.id = 'prts-filter-bar';
        }

        if (searchRow.nextElementSibling !== controlBar) {
            searchRow.parentNode.insertBefore(controlBar, searchRow.nextElementSibling);
        }

        const paths = {
            import: 'M11 6h3l-6 6-6-6h3V1h6v5zm-7 8v2h12v-2h-2v1H6v-1H4z',
            eyeOn: 'M8 3C3 3 0 8 0 8s3 5 8 5 8-5 8-5-3-5-8-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z M8 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
            eyeOff: 'M6.41 7.83c-.03.39.07.79.31 1.12.24.34.59.58.98.68.39.1.81.02 1.15-.21.34-.23.59-.57.7-.96.1-.39.02-.8-.21-1.15-.16-.23-.38-.42-.64-.53L6.41 7.83z M2.05 2.64L1.03 3.66l2.54 2.54C2.22 6.75 1.12 7.34 0 8c0 0 4 5.6 8 5.6 1.41 0 2.71-.35 3.85-.96l2.08 2.09 1.02-1.02L2.05 2.64z M8 12c-2.21 0-4-1.79-4-4 0-.2.02-.39.05-.58l5.04 5.04c-1.24.74-3.46.59-1.09-.46z M13.57 11.6c.54-1.06.83-2.24.83-3.6 0 0-4-5.6-8-5.6-.69 0-1.34.09-1.98.25L6.07 4.3C6.68 4.1 7.33 4 8 4c2.21 0 4 1.79 4 4 0 .64-.14 1.24-.38 1.79l1.95 1.81z',
            perfect: 'M13.76 3.84l-7.2 7.2L3.04 7.52 1.6 8.96l5.04 5.04 8.64-8.64z',
            support: 'M12 6.4c0-1.77-1.43-3.2-3.2-3.2S5.6 4.63 5.6 6.4s1.43 3.2 3.2 3.2 3.2-1.43 3.2-3.2zm-3.2 1.6c-.88 0-1.6-.72-1.6-1.6s.72-1.6 1.6-1.6 1.6.72 1.6 1.6-.72 1.6-1.6 1.6zm3.2-1.6c0-1.77-1.43-3.2-3.2-3.2-.45 0-.86.1-1.26.26.7.74 1.15 1.72 1.24 2.82.02.21.02.41 0 .62-.1 1.04-.51 1.98-1.16 2.71.37.13.75.19 1.18.19 1.77.01 3.2-1.42 3.2-3.4zM8.8 10.4H2.4c-.88 0-1.6.72-1.6 1.6v2.4h9.6V12c0-.88-.72-1.6-1.6-1.6zm-5.6 2.4h4.8v.8H3.2v-.8zm12-1.6h-4.8c.21 0 .4.03.59.07.67.15 1.29.44 1.81.85.91.71 1.5 1.81 1.57 3.04.01.1.01.18.03.28V12c0-.88-.72-1.6-1.6-1.6z',
            user: 'M8 8c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0 1c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
            sidebarToggle: 'M14 3H2c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zm-1 9H9V4h4v8zM3 4h4v8H3V4z',
            skland: SKLAND_FAVICON_SVG
        };

        const renderButton = (id, text, svgPath, onClick, active = false, disabled = false) => {
            let btn = document.getElementById(id);
            const iconHTML = svgPath.startsWith('<svg')
                ? svgPath
                : `<span class="bp4-icon" aria-hidden="true" style="margin-right:6px"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="${svgPath}"></path></svg></span>`;
            const innerHTML = `
                ${iconHTML}
                <span class="bp4-button-text">${text}</span>
            `;

            if (!btn) {
                btn = document.createElement('button');
                btn.type = "button";
                btn.className = 'prts-btn';
                btn.id = id;
                btn.onclick = onClick;
            }

            if (btn.innerHTML !== innerHTML) btn.innerHTML = innerHTML;

            if (active && !btn.classList.contains('prts-active')) btn.classList.add('prts-active');
            if (!active && btn.classList.contains('prts-active')) btn.classList.remove('prts-active');

            if (disabled) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            } else {
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }
            return btn;
        };

        // 顺序生成元素

        // (1) 账号循环切换按钮
        const btnAccountText = `账号 ${activeAccountId}`;
        const btnAccount = renderButton('btn-account', btnAccountText, paths.user, cycleAccount);
        controlBar.appendChild(btnAccount);

        // (2) 导入按钮
        const importText = ownedOpsSet.size > 0 ? `导入干员 (${ownedOpsSet.size})` : '导入干员';
        const btnImport = renderButton('btn-import', importText, paths.import, handleImport);
        controlBar.appendChild(btnImport);

        const btnSklandImport = renderButton('btn-skland-import', '森空岛导入', paths.skland, handleOpenSklandImport);
        controlBar.appendChild(btnSklandImport);

        // (3) 模式切换
        const displayModeText = displayMode === 'GRAY' ? '置灰模式' : '隐藏模式';
        const displayModeIcon = displayMode === 'GRAY' ? paths.eyeOn : paths.eyeOff;
        const btnSetting = renderButton('btn-setting', displayModeText, displayModeIcon, toggleDisplayMode);
        controlBar.appendChild(btnSetting);

        // (4) 分割线
        let divider = document.getElementById('prts-divider-el');
        if (!divider) {
            divider = document.createElement('div');
            divider.className = 'prts-divider';
            divider.id = 'prts-divider-el';
        }
        controlBar.appendChild(divider);

        // (5) 完美阵容
        const btnPerfect = renderButton('btn-perfect', '完美阵容', paths.perfect, () => toggleFilter('PERFECT'), currentFilterMode === 'PERFECT');
        controlBar.appendChild(btnPerfect);

        // (6) 允许助战
        const btnSupport = renderButton('btn-support', '允许助战', paths.support, () => toggleFilter('SUPPORT'), currentFilterMode === 'SUPPORT');
        controlBar.appendChild(btnSupport);

        if (isNew && currentFilterMode !== 'NONE') {
            requestFilterUpdate();
        }
    }

    function findBilibiliUrl(text) {
        const match = String(text || '').match(/(?:【.*?】\s*)?(https?:\/\/(?:www\.)?(?:bilibili\.com\/video\/|b23\.tv\/)[^\s<"']+)/i);
        return match ? { fullText: match[0], url: match[1] } : null;
    }

    function extractAndRemoveBilibiliUrl(container) {
        const link = Array.from(container.querySelectorAll('a[href]'))
            .find(anchor => findBilibiliUrl(anchor.href));
        if (link) {
            const url = findBilibiliUrl(link.href).url;
            link.remove();
            return url;
        }

        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
        let textNode = walker.nextNode();
        while (textNode) {
            const match = findBilibiliUrl(textNode.nodeValue);
            if (match) {
                textNode.nodeValue = textNode.nodeValue.replace(match.fullText, '').trim();
                return match.url;
            }
            textNode = walker.nextNode();
        }
        return null;
    }

    function trimTrailingDescriptionNoise(container) {
        while (container.lastChild) {
            const node = container.lastChild;
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() === '') {
                node.remove();
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
                node.remove();
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'P' && node.textContent.trim() === '') {
                node.remove();
            } else {
                break;
            }
        }
    }

    function wrapDescriptionContent(descContainer) {
        const content = document.createElement('div');
        content.className = 'prts-desc-content';

        while (descContainer.firstChild) {
            content.appendChild(descContainer.firstChild);
        }
        if (content.textContent.trim() === '') {
            content.textContent = '(无文字描述)';
        }
        descContainer.appendChild(content);
    }

    function cleanBilibiliLinks(cardInner) {
        if (!CONFIG.cleanLink) return;
        const descContainer = cardInner.querySelector('.grow.text-gray-700');
        if (!descContainer || descContainer.dataset.biliProcessed) return;

        const videoUrl = extractAndRemoveBilibiliUrl(descContainer);
        trimTrailingDescriptionNoise(descContainer);
        wrapDescriptionContent(descContainer);
        descContainer.classList.add('prts-desc-wrapper');
        descContainer.classList.remove('grow');
        descContainer.style.width = '100%';

        if (videoUrl) {
            const btnContainer = document.createElement('div');
            btnContainer.className = 'prts-video-box';

            const linkBtn = document.createElement('a');
            linkBtn.href = videoUrl;
            linkBtn.target = "_blank";
            linkBtn.rel = "noopener noreferrer";
            linkBtn.className = 'prts-bili-link';
            const icon = document.createElement('span');
            icon.className = 'bp4-icon bp4-icon-video';
            linkBtn.appendChild(icon);
            linkBtn.appendChild(document.createTextNode('参考视频'));
            linkBtn.onclick = (e) => e.stopPropagation();

            btnContainer.appendChild(linkBtn);
            if (descContainer.parentNode) {
                descContainer.parentNode.insertBefore(btnContainer, descContainer.nextSibling);
            }
        }

        descContainer.dataset.biliProcessed = "true";
    }

    function requestFilterUpdate() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            rafId = null;
            applyFilterLogic();
        });
    }

    function scheduleFilterUpdate(delay = 80) {
        if (isFilterDisabledPage()) return;
        if (filterDebounceTimer) clearTimeout(filterDebounceTimer);
        filterDebounceTimer = setTimeout(() => {
            filterDebounceTimer = null;
            requestFilterUpdate();
        }, delay);
    }

    function syncPageScaffold() {
        applySidebarCollapse();
        optimizeDialogContent();
        createFloatingBall();
        injectFilterControls();
    }

    function getRouteKey() {
        return `${window.location.pathname}${window.location.search}`;
    }

    function handleRouteChange() {
        const routeKey = getRouteKey();
        if (routeKey === lastRouteKey) return false;

        lastRouteKey = routeKey;
        syncPageScaffold();
        scheduleFilterUpdate(120);
        return true;
    }

    function isScriptOwnedNode(node) {
        if (!node || node.nodeType !== 1) return false;
        return Boolean(node.closest?.('#prts-filter-bar, #prts-float-container, .prts-status-label'));
    }

    function hasRelevantDomMutation(mutations) {
        for (const mutation of mutations) {
            if (isScriptOwnedNode(mutation.target)) continue;

            const added = Array.from(mutation.addedNodes || []);
            const removed = Array.from(mutation.removedNodes || []);
            const changedNodes = added.concat(removed);
            if (changedNodes.some(node => !isScriptOwnedNode(node))) return true;
        }
        return false;
    }

    function optimizeCardVisuals(card, cardInner) {
        if (!CONFIG.visuals) return;

        const heading = cardInner.querySelector(`h4, h5, ${BP_SELECTORS.heading}`);
        const stageCodeSpan = cardInner.querySelector('.flex.whitespace-pre .inline-block.font-bold.my-auto');

        if (heading && !heading.dataset.badgeProcessed) {
            const titleTextNode = heading.querySelector('.whitespace-nowrap.overflow-hidden.text-ellipsis') || heading;
            let currentText = titleTextNode.innerText.trim();

            let badgeText = null;
            let titleCleanText = currentText;

            const rawCode = stageCodeSpan ? stageCodeSpan.innerText.trim() : "";
            const isInternalId = rawCode.includes('_') || (rawCode.length > 5 && /^[a-z]+$/.test(rawCode.replace(/\d/g, '')));

            if (rawCode && !isInternalId) {
                badgeText = rawCode;
                const escapedCode = rawCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`^\\s*(?:\\[|【)?\\s*${escapedCode}\\s*(?:\\]|】)?\\s*(?:[-_=:：|]\\s*|\\s+)?`, 'i');
                titleCleanText = currentText.replace(regex, '');
            } else {
                // 完美匹配格式:
                // [带横杠的标准格式] PA-1, PA-EX-1, 1-7, S4-1
                // [用户偷懒的不带杠格式] PA5, LE10
                // 以及匹配前置的各种括号 [PA-1], 【PA-1】
                const fallbackRegex = /^(?:\[|【)?(([A-Za-z0-9]{1,6}(?:-[A-Za-z0-9]{1,4})*-\d{1,3})|([A-Za-z]{2,5}\d{1,3}))(?:\]|】)?\s*(?:[-_=:：|]\s*|\s+(?!$))?(.*)$/i;

                const match = currentText.match(fallbackRegex);
                if (match) {
                    badgeText = match[1].toUpperCase(); // 提取到的关卡号，并统一转为大写 (如 pa-5 -> PA-5)
                    titleCleanText = match[4].trim();   // 剥离出真实的标题文本
                }
            }

            if (badgeText) {
                titleTextNode.innerText = titleCleanText;

                const badge = document.createElement('span');
                badge.className = 'prts-level-badge';
                badge.innerText = badgeText;
                heading.insertBefore(badge, heading.firstChild);
            }

            heading.dataset.badgeProcessed = "true";
        }

        const allDivs = Array.from(cardInner.querySelectorAll('div'));
        const labelDiv = allDivs.find(div => div.innerText.trim() === '干员/干员组');

        if (labelDiv && !labelDiv.dataset.opsProcessed) {
            const tagsContainer = labelDiv.nextElementSibling;
            if (tagsContainer) {
                const tags = tagsContainer.querySelectorAll(BP_SELECTORS.tag);
                let grid = tagsContainer.querySelector('.prts-op-grid');
                if (!grid) {
                    grid = document.createElement('div');
                    grid.className = 'prts-op-grid';
                    tagsContainer.insertBefore(grid, tagsContainer.firstChild);
                }

                tags.forEach(tag => {
                    if (tag.dataset.opExtracted) return;

                    const rawText = tag.innerText.trim();
                    const cleanText = rawText.replace(/^\[|\]$/g, '');
                    const parts = cleanText.split(/\s+/);
                    const nameKey = parts[0];
                    const extraInfo = parts[1] || "";

                    let newItem = null;

                    if (OP_ID_MAP[nameKey]) {
                        const opId = OP_ID_MAP[nameKey];
                        newItem = document.createElement('div');
                        newItem.className = 'prts-op-item';
                        const img = document.createElement('img');
                        img.src = `/assets/operator-avatars/webp96/${opId}.webp`;
                        img.className = 'prts-op-img';
                        img.loading = "lazy";
                        newItem.appendChild(img);
                    } else if (nameKey.length > 0) {
                        newItem = document.createElement('div');
                        newItem.className = 'prts-op-text';
                        newItem.innerText = nameKey;
                    }

                    if (newItem && extraInfo) {
                        const badge = document.createElement('div');
                        badge.className = 'prts-op-skill';
                        badge.innerText = extraInfo;
                        newItem.appendChild(badge);
                    }

                    if (!newItem) return;

                    const interactiveWrapper = tag.closest(BP_SELECTORS.popoverTarget);
                    if (interactiveWrapper) {
                        grid.appendChild(interactiveWrapper);
                        interactiveWrapper.innerHTML = '';
                        interactiveWrapper.appendChild(newItem);
                    } else {
                        const tooltipText = `${nameKey}${extraInfo ? ' ' + extraInfo : ''}`;
                        newItem.setAttribute('data-prts-tooltip', tooltipText);
                        grid.appendChild(newItem);
                        tag.style.display = 'none';
                    }

                    tag.dataset.opExtracted = "true";
                });
                labelDiv.dataset.opsProcessed = "true";
            }
        }
    }

    function enhancePopover(portalNode) {
        const content = portalNode.querySelector(BP_SELECTORS.popoverContent);
        if (!content || content.dataset.optimized) return;

        const wrapper = content.closest(BP_SELECTORS.popover);
        if (wrapper && (
            wrapper.classList.contains('bp4-suggest-popover') ||
            wrapper.classList.contains('bp6-suggest-popover') ||
            wrapper.classList.contains('bp4-select-popover') ||
            wrapper.classList.contains('bp6-select-popover')
        )) {
            return;
        }

        if (window.location.pathname.startsWith('/create')) {
            if (content.querySelector(BP_SELECTORS.menuOrItem)) return;
        }

        const text = content.innerText.trim();
        const cleanText = text.replace(/^->\s*/, '');
        const firstWord = cleanText.split(/[\s,，]+/)[0];
        const isSingleOperator = OP_ID_MAP[firstWord];

        if (!text.startsWith('->') && !text.includes(',') && !isSingleOperator) return;

        const rawList = cleanText.split(/[,，]\s*/);
        const validOps =[];

        rawList.forEach(entry => {
            const parts = entry.trim().split(/\s+/);
            const name = parts[0];
            const skill = parts[1] || "";

            if (OP_ID_MAP[name]) {
                validOps.push({ name: name, id: OP_ID_MAP[name], skill: skill });
            }
        });

        if (validOps.length > 0) {
            content.innerHTML = '';
            const grid = document.createElement('div');
            grid.className = 'prts-popover-grid';

            validOps.forEach(op => {
                const item = document.createElement('div');
                item.className = 'prts-popover-item';
                item.title = `${op.name} ${op.skill ? '(技能 ' + op.skill + ')' : ''}`;

                const img = document.createElement('img');
                img.src = `/assets/operator-avatars/webp96/${op.id}.webp`;
                img.className = 'prts-popover-img';

                item.appendChild(img);
                if (op.skill) {
                    const badge = document.createElement('div');
                    badge.className = 'prts-popover-skill';
                    badge.innerText = op.skill;
                    item.appendChild(badge);
                }
                grid.appendChild(item);
            });

            content.appendChild(grid);
            content.dataset.optimized = "true";
        }
    }

    /**
     * [筛选逻辑的核心应用方法] - 包含最优算法注入
     */
    function applyFilterLogic() {
        if (isFilterDisabledPage()) return;
        isProcessingFilter = true;

        try {
            let cards = document.querySelectorAll('ul.grid > li, .tabular-nums ul > li');
            if (cards.length === 0) return;

            cards.forEach(card => {
                const cardInner = card.querySelector(BP_SELECTORS.card);
                if (!cardInner) return;

                optimizeCardVisuals(card, cardInner);
                cleanBilibiliLinks(cardInner);

                const operation = getOperationForCard(card, cardInner);

                const { isAvailable, missingCount, missingOps } = checkOperationAvailability(operation, ownedOpsSet, currentFilterMode);

                if (!isAvailable && displayMode === 'HIDE') {
                    if (card.style.display !== 'none') card.style.display = 'none';
                    return;
                } else {
                    if (card.style.display === 'none') card.style.display = '';
                }

                const hasGrayClass = card.classList.contains('prts-card-gray');
                if (!isAvailable && displayMode === 'GRAY') {
                    if (!hasGrayClass) card.classList.add('prts-card-gray');
                } else {
                    if (hasGrayClass) card.classList.remove('prts-card-gray');
                }

                const existingLabel = cardInner.querySelector('.prts-status-label');
                const showMissingInfo = !isAvailable || (currentFilterMode === 'SUPPORT' && missingCount === 1);

                if (!showMissingInfo) {
                    if (existingLabel) existingLabel.remove();
                    return;
                }

                let labelText = '';
                let iconText = '';
                let newClass = 'prts-status-label';

                if (currentFilterMode === 'SUPPORT' && missingCount === 1) {
                    newClass += ' prts-label-support';
                    const name = missingOps[0];
                    iconText = '👤';
                    labelText = `需助战: ${name}`;
                } else {
                    newClass += ' prts-label-missing';
                    const listStr = missingOps.slice(0, 3).join(', ') + (missingCount > 3 ? '...' : '');
                    iconText = '✘';
                    labelText = `缺 ${missingCount} 人${missingCount > 0 ? ': ' + listStr : ''}`;
                }

                if (existingLabel) {
                    updateStatusLabel(existingLabel, newClass, iconText, labelText);
                } else {
                    const labelDiv = document.createElement('div');
                    updateStatusLabel(labelDiv, newClass, iconText, labelText);

                    const descContainer = cardInner.querySelector('.prts-desc-wrapper') ||
                                         cardInner.querySelector('.grow.text-gray-700') ||
                                         cardInner.querySelector('.text-gray-700');
                    if (descContainer) {
                        cardInner.insertBefore(labelDiv, descContainer);
                    } else {
                        cardInner.appendChild(labelDiv);
                    }
                }
            });

        } finally {
            isProcessingFilter = false;
        }
    }

    // =========================================================================
    //                            MODULE 6: 侧边栏与悬浮球面板
    // =========================================================================

    function createDialogTag(text) {
        const tag = document.createElement('span');
        tag.classList.add('prts-dialog-tag');

        if (text.includes('升级') || text.includes('优化') || text.includes('更新')) {
            tag.classList.add('prts-tag-update');
            tag.textContent = '更新';
        } else if (text.includes('修复') || text.includes('问题') || text.includes('Bug')) {
            tag.classList.add('prts-tag-fix');
            tag.textContent = '维护';
        } else if (text.includes('活动') || text.includes('关卡')) {
            tag.classList.add('prts-tag-event');
            tag.textContent = '活动';
        } else {
            tag.classList.add('prts-tag-note');
            tag.textContent = '通知';
        }

        return tag;
    }

    function optimizeDialogContent() {
        const dialog = document.querySelector(BP_SELECTORS.dialog);
        if (!dialog || dialog.dataset.contentOptimized) return;

        const title = dialog.querySelector(BP_SELECTORS.heading);
        if (title && title.innerText.includes('公告')) {
            const contentBody = dialog.querySelector('.markdown-body');
            if (contentBody) {
                const headers = contentBody.querySelectorAll('h2');
                headers.forEach(h2 => {
                    if (!h2.querySelector('.prts-dialog-tag')) {
                        h2.insertBefore(createDialogTag(h2.textContent), h2.firstChild);
                    }
                });
            }
            dialog.dataset.contentOptimized = "true";
        }
    }

    function saveConfig() {
        GM_setValue('prts_cfg_visuals', CONFIG.visuals);
        GM_setValue('prts_cfg_link', CONFIG.cleanLink);
        GM_setValue('prts_cfg_hide_sidebar', CONFIG.hideSidebar);
    }

    function registerAccountsDataChangeListener() {
        if (typeof GM_addValueChangeListener !== 'function') return;
        GM_addValueChangeListener(ACCOUNTS_DATA_KEY, (_name, oldValue, newValue, remote) => {
            if (!remote || oldValue === newValue) return;
            refreshOwnedOpsFromStorage();
        });
    }

    function refreshOwnedOpsFromStorage() {
        loadOwnedOps();
        const bar = document.getElementById('prts-filter-bar');
        if (bar) bar.remove();
        injectFilterControls();
        if (currentFilterMode !== 'NONE') requestFilterUpdate();
    }

    function initSklandImportPage() {
        loadOwnedOps();
        if (document.body) {
            createSklandImportPanel();
            return;
        }
        window.addEventListener('DOMContentLoaded', createSklandImportPanel, { once: true });
    }

    function createSklandImportPanel() {
        if (document.getElementById('prts-skland-import-panel')) return;

        let targetAccountId = normalizeAccountId(activeAccountId);
        const panel = document.createElement('section');
        panel.id = 'prts-skland-import-panel';

        const head = document.createElement('div');
        head.className = 'prts-skland-head';

        const headingWrap = document.createElement('div');
        const title = document.createElement('h2');
        title.className = 'prts-skland-title';
        title.textContent = 'Better-PRTS-Plus';
        const subtitle = document.createElement('p');
        subtitle.className = 'prts-skland-subtitle';
        subtitle.textContent = '从当前森空岛登录态读取明日方舟干员。';
        headingWrap.appendChild(title);
        headingWrap.appendChild(subtitle);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'prts-skland-close';
        closeBtn.title = '关闭';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => panel.remove();

        head.appendChild(headingWrap);
        head.appendChild(closeBtn);
        panel.appendChild(head);

        const body = document.createElement('div');
        body.className = 'prts-skland-body';

        const accountLabel = document.createElement('span');
        accountLabel.className = 'prts-skland-label';
        accountLabel.textContent = '导入到账号档位';
        body.appendChild(accountLabel);

        const accountRow = document.createElement('div');
        accountRow.className = 'prts-skland-accounts';
        const accountButtons = [];
        ACCOUNT_IDS.forEach(id => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'prts-skland-account';
            btn.textContent = `账号 ${id}`;
            btn.onclick = () => {
                targetAccountId = id;
                renderSklandAccountButtons(accountButtons, targetAccountId);
            };
            accountButtons.push(btn);
            accountRow.appendChild(btn);
        });
        body.appendChild(accountRow);

        const importBtn = document.createElement('button');
        importBtn.type = 'button';
        importBtn.className = 'prts-skland-primary';
        importBtn.textContent = '读取并导入干员';
        body.appendChild(importBtn);

        const status = document.createElement('div');
        status.className = 'prts-skland-status';
        status.textContent = '请先确认当前页面已经登录森空岛。导入只会保存干员名称，不会保存森空岛凭据。';
        body.appendChild(status);

        const link = document.createElement('a');
        link.className = 'prts-skland-link';
        link.href = 'https://prts.plus/';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = '打开 PRTS Plus';
        body.appendChild(link);

        importBtn.onclick = async () => {
            importBtn.disabled = true;
            importBtn.textContent = '读取中...';
            setSklandPanelStatus(status, `正在读取森空岛数据，并导入到账号 ${targetAccountId}。`, '');
            try {
                const summary = await importSklandOperatorsToAccount(targetAccountId);
                targetAccountId = summary.accountId;
                renderSklandAccountButtons(accountButtons, targetAccountId);
                setSklandPanelStatus(status, formatSklandImportSummary(summary), 'success');
            } catch (error) {
                console.error('[Better PRTS] 森空岛导入失败', error instanceof Error ? error.message : error);
                setSklandPanelStatus(status, error instanceof Error ? error.message : '森空岛导入失败，请稍后重试。', 'error');
            } finally {
                importBtn.disabled = false;
                importBtn.textContent = '读取并导入干员';
            }
        };

        renderSklandAccountButtons(accountButtons, targetAccountId);
        const lastSummary = readSklandLastImportSummary();
        if (lastSummary) setSklandPanelStatus(status, `最近导入：
${formatSklandImportSummary(lastSummary)}`, 'success');

        panel.appendChild(body);
        document.body.appendChild(panel);
    }

    function renderSklandAccountButtons(buttons, activeId) {
        buttons.forEach((btn, index) => {
            const id = ACCOUNT_IDS[index];
            btn.classList.toggle('active', id === activeId);
        });
    }

    function setSklandPanelStatus(status, text, type) {
        status.className = 'prts-skland-status';
        if (type) status.classList.add(type);
        status.textContent = text;
    }

    function readSklandLastImportSummary() {
        const parsed = safeJsonParse(GM_getValue(SKLAND_LAST_IMPORT_KEY) || '', null);
        if (!isPlainRecord(parsed)) return null;
        return {
            accountId: normalizeAccountId(parsed.accountId),
            operatorCount: Number.isFinite(Number(parsed.operatorCount)) ? Number(parsed.operatorCount) : 0,
            nickname: stringValue(parsed.nickname),
            uid: stringValue(parsed.uid),
            importedAt: stringValue(parsed.importedAt)
        };
    }

    function formatSklandImportSummary(summary) {
        const timeText = summary.importedAt ? new Date(summary.importedAt).toLocaleString() : '';
        const lines = [
            `账号 ${summary.accountId} 已导入 ${summary.operatorCount} 名干员。`,
            `${summary.nickname || '博士'} / UID ${summary.uid || '未知'}`
        ];
        if (timeText) lines.push(timeText);
        return lines.join('\n');
    }

    function createFloatingBall() {
        if (document.getElementById('prts-float-container')) return;

        const savedPos = parseFloatingPosition(GM_getValue('prts_float_pos', '{"top":"40%","isRight":true}'));
        const container = document.createElement('div');
        container.id = 'prts-float-container';

        container.style.top = savedPos.top;
        if (savedPos.isRight) {
            container.style.left = 'auto';
            container.style.right = '0px';
            container.classList.add('snap-right');
        } else {
            container.style.left = '0px';
            container.style.right = 'auto';
            container.classList.add('snap-left');
        }

        const btn = document.createElement('div');
        btn.className = 'prts-float-btn';
        btn.title = "脚本设置 (可拖拽)";
        btn.style.touchAction = 'none';
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M27,7.35l-9-5.2a4,4,0,0,0-4,0L5,7.35a4,4,0,0,0-2,3.46V21.19a4,4,0,0,0,2,3.46l9,5.2a4,4,0,0,0,4,0l9-5.2a4,4,0,0,0,2-3.46V10.81A4,4,0,0,0,27,7.35Zm-11.74-3a1.51,1.51,0,0,1,1.5,0l8.49,4.9L16,14.56,6.76,9.22Zm-9,18.17a1.51,1.51,0,0,1-.75-1.3v-9.8l9.24,5.33V27.39Zm19.48,0-8.49,4.9V16.72l9.24-5.33v9.8A1.51,1.51,0,0,1,25.74,22.49Z"></path></svg>`;

        const panel = document.createElement('div');
        panel.className = 'prts-settings-panel';

        const createSwitch = (label, checked, onChange) => {
            const div = document.createElement('div');
            div.className = 'prts-panel-item';
            div.innerHTML = `<span>${label}</span><label class="prts-switch"><input type="checkbox" ${checked ? 'checked' : ''}><span class="prts-slider"></span></label>`;
            const input = div.querySelector('input');
            input.onchange = (e) => onChange(e.target.checked);
            return div;
        };

        const title = document.createElement('div');
        title.className = 'prts-panel-title';
        title.innerHTML = `<span style="margin-right:auto">功能开关</span><span style="font-size:12px;opacity:0.6">刷新生效</span>`;
        panel.appendChild(title);

        panel.appendChild(createSwitch('🖼️ 作业卡片美化', CONFIG.visuals, (val) => {
            CONFIG.visuals = val; saveConfig(); if(val) requestFilterUpdate(); else location.reload();
        }));
        panel.appendChild(createSwitch('🔗 视频链接优化', CONFIG.cleanLink, (val) => {
            CONFIG.cleanLink = val; saveConfig(); if(val) requestFilterUpdate();
        }));

        panel.appendChild(createSwitch('🗂️ 折叠侧边栏', CONFIG.hideSidebar, (val) => {
            CONFIG.hideSidebar = val; saveConfig(); applySidebarCollapse();
        }));

        //[V12.0/V3.1.0 优美的多账号悬浮面板]
        const accRow = document.createElement('div');
        accRow.className = 'prts-panel-item';
        accRow.style.marginTop = '8px';
        accRow.style.marginBottom = '8px';
        accRow.innerHTML = `<span>👤 切换账号</span>`;

        const accBtnGroup = document.createElement('div');
        accBtnGroup.style.display = 'flex';
        accBtnGroup.style.gap = '6px';

        for (let i = 1; i <= 3; i++) {
            const accBtn = document.createElement('button');
            accBtn.className = 'prts-btn prts-acc-btn';
            accBtn.dataset.id = i;
            accBtn.innerText = String(i);
            if (i === activeAccountId) accBtn.classList.add('active');

            accBtn.onclick = (e) => {
                e.stopPropagation();
                switchAccount(i);
            };
            accBtnGroup.appendChild(accBtn);
        }
        accRow.appendChild(accBtnGroup);
        panel.appendChild(accRow);

        const importBtn = document.createElement('button');
        importBtn.className = 'prts-btn';
        importBtn.style.width = '100%'; importBtn.style.marginTop = '4px';
        importBtn.innerHTML = '📂 导入干员数据';
        importBtn.onclick = handleImport;
        panel.appendChild(importBtn);

        const sklandBtn = document.createElement('button');
        sklandBtn.className = 'prts-btn';
        sklandBtn.style.width = '100%'; sklandBtn.style.marginTop = '8px';
        sklandBtn.appendChild(createSklandIconImage());
        sklandBtn.appendChild(document.createTextNode('森空岛导入'));
        sklandBtn.onclick = handleOpenSklandImport;
        panel.appendChild(sklandBtn);

        container.appendChild(panel);
        container.appendChild(btn);
        document.body.appendChild(container);

        let isDragging = false;
        let hasMoved = false;
        let startX, startY, initialLeft, initialTop, initialSnapRight, activePointerId;

        btn.addEventListener('pointerdown', (e) => {
            activePointerId = e.pointerId;
            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            const rect = container.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            initialSnapRight = container.style.right === '0px' || (container.classList.contains('snap-right') && !container.classList.contains('snap-left'));

            container.classList.remove('is-snapping');
            container.classList.add('is-dragging');
            container.style.left = initialLeft + 'px';
            container.style.top = initialTop + 'px';
            container.style.right = 'auto';
            container.style.transform = 'none';
            btn.setPointerCapture?.(e.pointerId);
            e.preventDefault();
        });

        document.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            if (activePointerId !== undefined && e.pointerId !== activePointerId) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            const winWidth = window.innerWidth;
            const winHeight = window.innerHeight;
            const elWidth = container.offsetWidth;
            const elHeight = container.offsetHeight;

            if (newLeft < 0) newLeft = 0;
            if (newLeft > winWidth - elWidth) newLeft = winWidth - elWidth;
            if (newTop < 0) newTop = 0;
            if (newTop > winHeight - elHeight) newTop = winHeight - elHeight;

            container.style.left = newLeft + 'px';
            container.style.top = newTop + 'px';
        });

        const finishDrag = (e) => {
            if (!isDragging) return;
            if (activePointerId !== undefined && e.pointerId !== activePointerId) return;
            isDragging = false;
            btn.releasePointerCapture?.(activePointerId);
            activePointerId = undefined;
            container.classList.remove('is-dragging');
            container.style.transform = '';

            if (hasMoved) {
                const winWidth = window.innerWidth;
                const rect = container.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;

                container.classList.add('is-snapping');
                let isRight = true;
                if (centerX < winWidth / 2) {
                    container.style.left = '0px';
                    container.style.right = 'auto';
                    container.classList.remove('snap-right');
                    container.classList.add('snap-left');
                    isRight = false;
                } else {
                    container.style.left = 'auto';
                    container.style.right = '0px';
                    container.classList.remove('snap-left');
                    container.classList.add('snap-right');
                    isRight = true;
                }
                const topPercent = (rect.top / window.innerHeight * 100).toFixed(1) + '%';
                container.style.top = topPercent;

                GM_setValue('prts_float_pos', JSON.stringify({ top: topPercent, isRight: isRight }));
            } else {
                if (initialSnapRight) {
                    container.style.left = 'auto';
                    container.style.right = '0px';
                    container.classList.remove('snap-left');
                    container.classList.add('snap-right');
                } else {
                    container.style.left = '0px';
                    container.style.right = 'auto';
                    container.classList.remove('snap-right');
                    container.classList.add('snap-left');
                }
            }
        };

        document.addEventListener('pointerup', finishDrag);
        document.addEventListener('pointercancel', finishDrag);

        btn.onclick = (e) => {
            e.stopPropagation();
            if (!hasMoved) container.classList.toggle('prts-float-open');
        };
        panel.onclick = (e) => e.stopPropagation();
        document.addEventListener('click', () => {
            if (!isDragging) container.classList.remove('prts-float-open');
        });
    }

    // =========================================================================
    //                            MODULE 7: 初始化与统一监听
    // =========================================================================

    function init() {
        if (isSklandHost()) {
            initSklandImportPage();
            return;
        }
        if (!isPrtsHost()) return;

        loadOwnedOps();
        registerAccountsDataChangeListener();
        syncPageScaffold();
        scheduleFilterUpdate(0);

        // 卡片渲染观察者
        const observer = new MutationObserver((mutations) => {
            if (handleRouteChange()) return;

            if (isProcessingFilter) return;
            if (isFilterDisabledPage()) return;

            if (hasRelevantDomMutation(mutations)) {
                syncPageScaffold();
                scheduleFilterUpdate(80);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        const portalInnerObserver = new MutationObserver((mutations) => {
            if (!CONFIG.visuals) return;
            mutations.forEach(mutation => {
                const portalNode = mutation.target.closest(BP_SELECTORS.portal);
                if (portalNode) enhancePopover(portalNode);
            });
        });

        const bodyObserver = new MutationObserver((mutations) => {
            if (!CONFIG.visuals) return;
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.matches(BP_SELECTORS.portal)) {
                            setTimeout(() => enhancePopover(node), 0);
                            portalInnerObserver.observe(node, { childList: true, subtree: true });
                        }
                    });
                }
            });
        });

        bodyObserver.observe(document.body, { childList: true });

        // 保底同步刷新
        setInterval(() => {
            if (handleRouteChange()) return;
            const missingFilterBar = !isFilterDisabledPage() && !document.getElementById('prts-filter-bar');
            syncPageScaffold();
            if (missingFilterBar && currentFilterMode !== 'NONE') {
                scheduleFilterUpdate(120);
            }
        }, 3000);
    }

    init();

})();
