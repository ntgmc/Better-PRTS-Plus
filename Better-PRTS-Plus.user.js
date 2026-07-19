// ==UserScript==
// @name         Better-PRTS-Plus
// @namespace    https://github.com/ntgmc/Better-PRTS-Plus
// @version      3.2.3
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
    const ACCOUNT_BACKUP_TYPE = 'Better-PRTS-Plus.accounts-backup';
    const ACCOUNT_BACKUP_VERSION = 1;
    const ACCOUNT_BACKUP_MAX_BYTES = 2 * 1024 * 1024;
    const OPERATOR_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
    const ACCOUNT_LABEL_MAX_LENGTH = 20;
    const ACCOUNT_IDS = [1, 2, 3];
    const SKLAND_BASE_URL = 'https://zonai.skland.com';
    const SKLAND_HOME_URL = 'https://www.skland.com/index';
    const SKLAND_REQUEST_TIMEOUT_MS = 25000;

    // [设置配置] 功能开关默认状态
    const SKLAND_FAVICON_SVG = '<svg class="prts-btn-icon-svg" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M0,15h1v1H0z" fill="#CCE519" opacity="0.039"/><path d="M2,15h1v1H2z" fill="#C8EE21" opacity="0.424"/><path d="M15,0h1v1H15z" fill="#D0D017" opacity="0.043"/><path d="M14,15h1v1H14z" fill="#D3F825" opacity="0.486"/><path d="M4,15h2v1H4z" fill="#C7EB21" opacity="0.502"/><path d="M11,15h3v1H11z" fill="#C9ED21" opacity="0.502"/><path d="M6,15h1v1H6z" fill="#C9EF1F" opacity="0.502"/><path d="M10,15h1v1H10z" fill="#C9F11F" opacity="0.502"/><path d="M3,15h1v1H3zM7,15h1v1H7z" fill="#CBEF21" opacity="0.502"/><path d="M8,15h2v1H8z" fill="#CDF321" opacity="0.502"/><path d="M14,0h1v1H14z" fill="#D1F323" opacity="0.502"/><path d="M15,1h1v1H15z" fill="#D0F321" opacity="0.6"/><path d="M0,13h1v1H0z" fill="#CFEF23" opacity="0.651"/><path d="M0,11h1v1H0z" fill="#D3B809" opacity="0.71"/><path d="M2,0h1v1H2z" fill="#D6F822" opacity="0.745"/><path d="M0,10h1v1H0z" fill="#DFC01A" opacity="0.757"/><path d="M0,12h1v1H0z" fill="#C9F718" opacity="0.769"/><path d="M0,2h1v1H0z" fill="#CDF222" opacity="0.773"/><path d="M13,0h1v1H13z" fill="#D2F723" opacity="0.792"/><path d="M0,5h1v1H0z" fill="#C0E51A" opacity="0.816"/><path d="M0,4h1v1H0z" fill="#C6EB17" opacity="0.816"/><path d="M0,6h1v1H0z" fill="#C9E618" opacity="0.816"/><path d="M15,14h1v1H15z" fill="#C9F127" opacity="0.816"/><path d="M4,0h2v1H4zM9,0h3v1H9z" fill="#CDF222" opacity="0.816"/><path d="M6,0h1v1H6z" fill="#CFF322" opacity="0.816"/><path d="M8,0h1v1H8z" fill="#D0F61F" opacity="0.816"/><path d="M7,0h1v1H7z" fill="#D4FB1D" opacity="0.816"/><path d="M0,8h1v1H0z" fill="#D5F022" opacity="0.816"/><path d="M0,7h1v1H0z" fill="#E0B61D" opacity="0.816"/><path d="M12,0h1v1H12z" fill="#CEF221" opacity="0.824"/><path d="M9,6h1v1H9z" fill="#9BB075" opacity="0.827"/><path d="M3,0h1v1H3z" fill="#CEF221" opacity="0.827"/><path d="M0,9h1v1H0z" fill="#D2FD21" opacity="0.827"/><path d="M0,3h1v1H0z" fill="#D0F522" opacity="0.831"/><path d="M8,10h1v1H8z" fill="#4B4848" opacity="0.859"/><path d="M10,6h1v1H10z" fill="#EBE6D6" opacity="0.89"/><path d="M1,14h1v1H1z" fill="#D0F421" opacity="0.922"/><path d="M15,8h1v1H15z" fill="#95DC0B" opacity="0.933"/><path d="M15,7h1v1H15z" fill="#9EBD4D" opacity="0.933"/><path d="M15,10h1v1H15z" fill="#A7B177" opacity="0.933"/><path d="M15,9h1v1H15z" fill="#ABB952" opacity="0.933"/><path d="M15,6h1v1H15z" fill="#BBCA71" opacity="0.933"/><path d="M15,11h1v1H15z" fill="#BBD01D" opacity="0.933"/><path d="M15,5h1v1H15z" fill="#C1E516" opacity="0.933"/><path d="M15,12h1v1H15z" fill="#D0F320" opacity="0.933"/><path d="M15,4h1v1H15z" fill="#D3F721" opacity="0.933"/><path d="M15,2h1v1H15z" fill="#CCF021" opacity="0.937"/><path d="M9,7h1v1H9z" fill="#4D5441" opacity="0.937"/><path d="M15,3h1v1H15z" fill="#CDF022" opacity="0.941"/><path d="M5,10h1v1H5z" fill="#E1F0D0" opacity="0.945"/><path d="M12,8h1v1H12z" fill="#4B4749" opacity="0.945"/><path d="M8,9h1v1H8z" fill="#FAF9FB" opacity="0.953"/><path d="M15,13h1v1H15z" fill="#CFF121" opacity="0.961"/><path d="M10,7h1v1H10z" fill="#2F2D28" opacity="0.961"/><path d="M9,10h1v1H9z" fill="#323031" opacity="0.976"/><path d="M13,8h1v1H13z" fill="#9E9693" opacity="0.98"/><path d="M5,9h1v1H5z" fill="#ABB09A" opacity="0.98"/><path d="M12,9h1v1H12z" fill="#1C1B19" opacity="0.98"/><path d="M6,10h1v1H6z" fill="#525650" opacity="0.984"/><path d="M11,6h1v1H11z" fill="#FCFDF6" opacity="0.992"/><path d="M12,6h1v1H12z" fill="#FEFEFE" opacity="0.992"/><path d="M13,9h1v1H13z" fill="#272429" opacity="0.992"/><path d="M9,9h1v1H9z" fill="#3D3D3D" opacity="0.992"/><path d="M7,10h1v1H7z" fill="#1F1F20" opacity="0.996"/><path d="M6,9h1v1H6z" fill="#282A06" opacity="0.996"/><path d="M11,7h1v1H11z" fill="#555653" opacity="0.996"/><path d="M7,12h1v1H7z" fill="#656379"/><path d="M8,6h1v1H8z" fill="#667D4D"/><path d="M7,9h1v1H7z" fill="#69696F"/><path d="M7,4h1v1H7z" fill="#6B687A"/><path d="M4,7h1v1H4z" fill="#6F6C80"/><path d="M14,8h1v1H14z" fill="#719246"/><path d="M4,8h1v1H4z" fill="#767574"/><path d="M3,7h1v1H3z" fill="#7C7778"/><path d="M8,12h1v1H8z" fill="#7C7967"/><path d="M9,12h1v1H9z" fill="#828073"/><path d="M7,8h1v1H7z" fill="#82827E"/><path d="M2,9h1v1H2z" fill="#82C10A"/><path d="M12,11h1v1H12z" fill="#848194"/><path d="M7,3h1v1H7z" fill="#8984A5"/><path d="M6,12h1v1H6z" fill="#8A8EA8"/><path d="M7,5h1v1H7z" fill="#8C8C86"/><path d="M3,9h1v1H3z" fill="#8CA753"/><path d="M2,5h1v1H2z" fill="#908AA8"/><path d="M3,6h1v1H3z" fill="#93948D"/><path d="M10,12h1v1H10z" fill="#94978F"/><path d="M2,7h1v1H2z" fill="#959994"/><path d="M14,10h1v1H14z" fill="#9692A3"/><path d="M5,7h1v1H5z" fill="#989892"/><path d="M8,3h1v1H8z" fill="#9EA675"/><path d="M14,5h1v1H14z" fill="#A1AF5D"/><path d="M3,8h1v1H3z" fill="#A2B173"/><path d="M13,4h1v1H13z" fill="#A3B357"/><path d="M8,8h1v1H8z" fill="#A5A4A7"/><path d="M6,7h1v1H6z" fill="#A5A6AD"/><path d="M6,13h1v1H6z" fill="#A5B030"/><path d="M6,6h1v1H6z" fill="#A5BF2C"/><path d="M7,2h1v1H7z" fill="#A6A4B0"/><path d="M1,5h1v1H1z" fill="#A6AA95"/><path d="M11,3h1v1H11z" fill="#A6B658"/><path d="M9,3h1v1H9z" fill="#A7C711"/><path d="M8,2h1v1H8z" fill="#A8B959"/><path d="M12,4h1v1H12z" fill="#A9AF8C"/><path d="M10,3h1v1H10z" fill="#A9B862"/><path d="M1,10h1v1H1z" fill="#A9CB31"/><path d="M11,12h1v1H11z" fill="#ABB288"/><path d="M2,4h1v1H2z" fill="#ABB86E"/><path d="M12,12h1v1H12z" fill="#ABBE4F"/><path d="M4,6h1v1H4z" fill="#ACBA68"/><path d="M9,13h1v1H9z" fill="#ADB95F"/><path d="M6,3h1v1H6z" fill="#ADC054"/><path d="M8,4h1v1H8z" fill="#AEAEAD"/><path d="M13,11h1v1H13z" fill="#AEB789"/><path d="M2,8h1v1H2z" fill="#AED330"/><path d="M1,6h1v1H1z" fill="#AFB97C"/><path d="M6,4h1v1H6z" fill="#B0C061"/><path d="M1,11h1v1H1z" fill="#B0C765"/><path d="M1,4h1v1H1z" fill="#B1BD74"/><path d="M3,5h1v1H3z" fill="#B1C64C"/><path d="M7,6h1v1H7z" fill="#B2B0B8"/><path d="M2,10h1v1H2z" fill="#B2B19B"/><path d="M7,13h1v1H7z" fill="#B2BE62"/><path d="M6,2h1v1H6z" fill="#B2CF29"/><path d="M12,3h1v1H12z" fill="#B4D70F"/><path d="M8,13h1v1H8z" fill="#B7C36A"/><path d="M14,11h1v1H14z" fill="#B7CE3E"/><path d="M10,13h1v1H10z" fill="#B9B938"/><path d="M9,4h1v1H9z" fill="#B9BAB2"/><path d="M13,7h1v1H13z" fill="#B9BCA2"/><path d="M14,7h1v1H14z" fill="#BAC981"/><path d="M2,12h1v1H2z" fill="#BBC39A"/><path d="M7,1h1v1H7z" fill="#BBDB28"/><path d="M5,13h1v1H5z" fill="#BBDF11"/><path d="M3,13h1v1H3z" fill="#BCDF15"/><path d="M13,12h1v1H13z" fill="#BCDF18"/><path d="M6,5h1v1H6z" fill="#BDDA2E"/><path d="M1,12h1v1H1z" fill="#BDDB2F"/><path d="M2,13h1v1H2z" fill="#BDE114"/><path d="M5,6h1v1H5z" fill="#BEDA35"/><path d="M4,13h1v1H4zM11,13h1v1H11z" fill="#C0E215"/><path d="M14,4h1v1H14z" fill="#C2E710"/><path d="M2,3h1v1H2z" fill="#C3E617"/><path d="M3,4h1v1H3z" fill="#C3E714"/><path d="M6,11h1v1H6z" fill="#C4C3C3"/><path d="M10,2h1v1H10z" fill="#C6EB12"/><path d="M3,2h1v1H3z" fill="#C7EA21"/><path d="M11,2h1v1H11z" fill="#C7EC14"/><path d="M4,5h1v1H4z" fill="#C7EF0A"/><path d="M4,2h1v1H4zM13,2h1v1H13zM4,3h1v1H4z" fill="#C8EB21"/><path d="M2,2h1v1H2z" fill="#C8EC21"/><path d="M13,3h1v1H13z" fill="#C8EE14"/><path d="M5,4h1v1H5z" fill="#C8EF15"/><path d="M3,12h1v1H3z" fill="#C9CEB2"/><path d="M5,12h1v1H5z" fill="#CACFAA"/><path d="M8,1h1v1H8z" fill="#CAEE22"/><path d="M1,3h1v1H1z" fill="#CAEF1A"/><path d="M5,3h1v1H5z" fill="#CAF016"/><path d="M4,12h1v1H4z" fill="#CBD0B0"/><path d="M3,3h1v1H3z" fill="#CBEE21"/><path d="M1,7h1v1H1z" fill="#CBF12D"/><path d="M12,13h1v1H12z" fill="#CBF216"/><path d="M4,9h1v1H4z" fill="#CCCACC"/><path d="M12,2h1v1H12z" fill="#CCEF21"/><path d="M4,4h1v1H4z" fill="#CCEF22"/><path d="M1,13h1v1H1z" fill="#CCF01E"/><path d="M5,2h1v1H5z" fill="#CCF11D"/><path d="M9,2h1v1H9z" fill="#CDF513"/><path d="M13,13h1v1H13z" fill="#CFF320"/><path d="M1,8h1v1H1z" fill="#CFF419"/><path d="M14,2h1v1H14z" fill="#CFF422"/><path d="M5,5h1v1H5z" fill="#CFF617"/><path d="M14,3h1v1H14z" fill="#D0F322"/><path d="M12,7h1v1H12z" fill="#D1D1D5"/><path d="M6,1h1v1H6z" fill="#D1F820"/><path d="M11,8h1v1H11z" fill="#151616"/><path d="M3,1h2v1H3zM12,1h1v1H12z" fill="#D2F723"/><path d="M5,1h1v1H5zM10,1h2v1H10z" fill="#D3F823"/><path d="M14,12h1v1H14z" fill="#D3F918"/><path d="M13,1h1v1H13z" fill="#D4F823"/><path d="M9,1h1v1H9z" fill="#D4F923"/><path d="M14,13h1v1H14z" fill="#D5FA22"/><path d="M1,9h1v1H1z" fill="#D6F621"/><path d="M9,14h1v1H9z" fill="#D6FA16"/><path d="M9,5h1v1H9z" fill="#D7D4E0"/><path d="M8,14h1v1H8z" fill="#D7F613"/><path d="M2,1h1v1H2z" fill="#D7FC24"/><path d="M1,2h1v1H1z" fill="#D9FF23"/><path d="M14,14h1v1H14z" fill="#D9FF24"/><path d="M1,1h1v1H1z" fill="#DAFF24"/><path d="M7,14h1v1H7z" fill="#DCFF17"/><path d="M4,14h2v1H4z" fill="#DDFF22"/><path d="M3,14h1v1H3z" fill="#DEFF22"/><path d="M2,14h1v1H2z" fill="#DEFF23"/><path d="M12,14h1v1H12z" fill="#E0FF23"/><path d="M13,5h1v1H13z" fill="#E1DEEF"/><path d="M11,14h1v1H11z" fill="#E1FF22"/><path d="M13,14h1v1H13z" fill="#E1FF23"/><path d="M14,1h1v1H14z" fill="#E1FF25"/><path d="M10,14h1v1H10z" fill="#E2FF1F"/><path d="M6,14h1v1H6z" fill="#E3FF21"/><path d="M11,4h1v1H11z" fill="#EAE7F7"/><path d="M3,10h1v1H3z" fill="#EEEAF3"/><path d="M14,6h1v1H14z" fill="#F2EDFF"/><path d="M10,4h1v1H10z" fill="#F5F2FF"/><path d="M2,11h1v1H2z" fill="#FFFEFF"/><path d="M10,5h3v1H10zM13,6h1v1H13zM4,10h1v1H4zM3,11h3v1H3z" fill="#FFFFFF"/><path d="M8,11h1v1H8z" fill="#1E1F1E"/><path d="M10,10h1v1H10z" fill="#1F1F23"/><path d="M10,9h1v1H10z" fill="#212121"/><path d="M9,11h1v1H9z" fill="#22221B"/><path d="M10,8h1v1H10z" fill="#272829"/><path d="M11,9h1v1H11z" fill="#292929"/><path d="M11,10h1v1H11z" fill="#292A2B"/><path d="M7,11h1v1H7z" fill="#2F2F2E"/><path d="M9,8h1v1H9z" fill="#302F32"/><path d="M12,10h1v1H12z" fill="#3A3B3A"/><path d="M2,6h1v1H2z" fill="#46435C"/><path d="M10,11h1v1H10z" fill="#48472B"/><path d="M13,10h1v1H13z" fill="#4B4A54"/><path d="M8,5h1v1H8z" fill="#4C4755"/><path d="M8,7h1v1H8z" fill="#4D553F"/><path d="M11,11h1v1H11z" fill="#4F4D4E"/><path d="M6,8h1v1H6z" fill="#5C5B54"/><path d="M14,9h1v1H14z" fill="#605D93"/><path d="M5,8h1v1H5z" fill="#615F60"/><path d="M7,7h1v1H7z" fill="#626084"/><path d="M0,14h1v1H0z" fill="#CEEC1E" opacity="0.165"/><path d="M1,15h1v1H1z" fill="#CCEF1E" opacity="0.259"/><path d="M15,15h1v1H15z" fill="#C9F225" opacity="0.318"/><path d="M0,1h1v1H0z" fill="#CEF122" opacity="0.373"/><path d="M1,0h1v1H1z" fill="#CAEF21" opacity="0.384"/></svg>';

    const CONFIG = {
        visuals: GM_getValue('prts_cfg_visuals', true),       // 干员头像优化
        cleanLink: GM_getValue('prts_cfg_link', true),        // 链接净化
        hideSidebar: GM_getValue('prts_cfg_hide_sidebar', false), // 折叠侧边栏
        compatDebug: GM_getValue('prts_cfg_compat_debug', false)  // 兼容性诊断
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
    let accountMeta = createDefaultAccountMeta();

    let currentFilterMode = GM_getValue(FILTER_MODE_KEY, 'NONE');
    let displayMode = normalizeDisplayMode(GM_getValue(DISPLAY_MODE_KEY, 'GRAY'));
    let ownedOpsSet = new Set();
    const operationCache = new WeakMap();
    const cardDiagnosticsCache = new WeakMap();

    let isProcessingFilter = false;
    let lastRouteKey = `${window.location.pathname}${window.location.search}`;
    let operatorImportDialogCleanup = null;
    // =========================================================================
    //                            MODULE 2: 数据与样式
    // =========================================================================

    // [数据] 干员头像数据映射
    // BEGIN GENERATED OPERATOR DATA
    const RAW_OPS = [{"id":"char_002_amiya","name":"阿米娅"},{"id":"char_003_kalts","name":"凯尔希"},{"id":"char_009_12fce","name":"12F"},{"id":"char_010_chen","name":"陈"},{"id":"char_017_huang","name":"煌"},{"id":"char_1011_lava2","name":"炎狱炎熔"},{"id":"char_1012_skadi2","name":"浊心斯卡蒂"},{"id":"char_1013_chen2","name":"假日威龙陈"},{"id":"char_1014_nearl2","name":"耀骑士临光"},{"id":"char_1016_agoat2","name":"纯烬艾雅法拉"},{"id":"char_1019_siege2","name":"维娜·维多利亚"},{"id":"char_101_sora","name":"空"},{"id":"char_1020_reed2","name":"焰影苇草"},{"id":"char_1021_kroos2","name":"寒芒克洛丝"},{"id":"char_1022_flwr2","name":"撷英调香师"},{"id":"char_1023_ghost2","name":"归溟幽灵鲨"},{"id":"char_1024_hbisc2","name":"濯尘芙蓉"},{"id":"char_1026_gvial2","name":"百炼嘉维尔"},{"id":"char_1027_greyy2","name":"承曦格雷伊"},{"id":"char_1028_texas2","name":"缄默德克萨斯"},{"id":"char_1029_yato2","name":"麒麟R夜刀"},{"id":"char_102_texas","name":"德克萨斯"},{"id":"char_1030_noirc2","name":"火龙S黑角"},{"id":"char_1031_slent2","name":"淬羽赫默"},{"id":"char_1032_excu2","name":"圣约送葬人"},{"id":"char_1033_swire2","name":"琳琅诗怀雅"},{"id":"char_1034_jesca2","name":"涤火杰西卡"},{"id":"char_1035_wisdel","name":"维什戴尔"},{"id":"char_1036_fang2","name":"历阵锐枪芬"},{"id":"char_1038_whitw2","name":"荒芜拉普兰德"},{"id":"char_1039_thorn2","name":"引星棘刺"},{"id":"char_103_angel","name":"能天使"},{"id":"char_1040_blaze2","name":"烛煌"},{"id":"char_1041_angel2","name":"新约能天使"},{"id":"char_1042_phatm2","name":"酒神"},{"id":"char_1043_leizi2","name":"司霆惊蛰"},{"id":"char_1044_hsgma2","name":"斩业星熊"},{"id":"char_1045_svash2","name":"凛御银灰"},{"id":"char_1046_sbell2","name":"圣聆初雪"},{"id":"char_1047_halo2","name":"溯光星源"},{"id":"char_1048_orchd2","name":"焰狐龙梓兰"},{"id":"char_1049_catap2","name":"雷狼龙S空爆"},{"id":"char_1050_chen3","name":"赤刃明霄陈"},{"id":"char_1051_headb2","name":"怒潮凛冬"},{"id":"char_1052_kalts2","name":"凯尔希·思衡托"},{"id":"char_106_franka","name":"芙兰卡"},{"id":"char_107_liskam","name":"雷蛇"},{"id":"char_108_silent","name":"赫默"},{"id":"char_109_fmout","name":"远山"},{"id":"char_110_deepcl","name":"深海色"},{"id":"char_112_siege","name":"推进之王"},{"id":"char_113_cqbw","name":"W"},{"id":"char_115_headbr","name":"凛冬"},{"id":"char_117_myrrh","name":"末药"},{"id":"char_118_yuki","name":"白雪"},{"id":"char_120_hibisc","name":"芙蓉"},{"id":"char_121_lava","name":"炎熔"},{"id":"char_122_beagle","name":"米格鲁"},{"id":"char_123_fang","name":"芬"},{"id":"char_124_kroos","name":"克洛丝"},{"id":"char_126_shotst","name":"流星"},{"id":"char_127_estell","name":"艾丝黛尔"},{"id":"char_128_plosis","name":"白面鸮"},{"id":"char_129_bluep","name":"蓝毒"},{"id":"char_130_doberm","name":"杜宾"},{"id":"char_131_flameb","name":"炎客"},{"id":"char_133_mm","name":"梅"},{"id":"char_134_ifrit","name":"伊芙利特"},{"id":"char_135_halo","name":"星源"},{"id":"char_136_hsguma","name":"星熊"},{"id":"char_137_brownb","name":"猎蜂"},{"id":"char_140_whitew","name":"拉普兰德"},{"id":"char_141_nights","name":"夜烟"},{"id":"char_143_ghost","name":"幽灵鲨"},{"id":"char_144_red","name":"红"},{"id":"char_145_prove","name":"普罗旺斯"},{"id":"char_147_shining","name":"闪灵"},{"id":"char_148_nearl","name":"临光"},{"id":"char_149_scave","name":"清道夫"},{"id":"char_1502_crosly","name":"弑君者"},{"id":"char_150_snakek","name":"蛇屠箱"},{"id":"char_151_myrtle","name":"桃金娘"},{"id":"char_154_morgan","name":"摩根"},{"id":"char_155_tiger","name":"因陀罗"},{"id":"char_157_dagda","name":"达格达"},{"id":"char_158_milu","name":"守林人"},{"id":"char_159_peacok","name":"断罪者"},{"id":"char_163_hpsts","name":"火神"},{"id":"char_164_nightm","name":"夜魔"},{"id":"char_166_skfire","name":"天火"},{"id":"char_171_bldsk","name":"华法琳"},{"id":"char_172_svrash","name":"银灰"},{"id":"char_173_slchan","name":"崖心"},{"id":"char_174_slbell","name":"初雪"},{"id":"char_179_cgbird","name":"夜莺"},{"id":"char_180_amgoat","name":"艾雅法拉"},{"id":"char_181_flower","name":"调香师"},{"id":"char_183_skgoat","name":"地灵"},{"id":"char_185_frncat","name":"慕斯"},{"id":"char_187_ccheal","name":"嘉维尔"},{"id":"char_188_helage","name":"赫拉格"},{"id":"char_190_clour","name":"红云"},{"id":"char_192_falco","name":"翎羽"},{"id":"char_193_frostl","name":"霜叶"},{"id":"char_194_leto","name":"烈夏"},{"id":"char_195_glassb","name":"真理"},{"id":"char_196_sunbr","name":"古米"},{"id":"char_197_poca","name":"早露"},{"id":"char_198_blackd","name":"讯使"},{"id":"char_199_yak","name":"角峰"},{"id":"char_2012_typhon","name":"提丰"},{"id":"char_2013_cerber","name":"刻俄柏"},{"id":"char_2014_nian","name":"年"},{"id":"char_2015_dusk","name":"夕"},{"id":"char_201_moeshd","name":"可颂"},{"id":"char_2023_ling","name":"令"},{"id":"char_2024_chyue","name":"重岳"},{"id":"char_2025_shu","name":"黍"},{"id":"char_2026_yu","name":"余"},{"id":"char_2027_wang","name":"望"},{"id":"char_202_demkni","name":"塞雷娅"},{"id":"char_204_platnm","name":"白金"},{"id":"char_206_gnosis","name":"灵知"},{"id":"char_208_melan","name":"玫兰莎"},{"id":"char_209_ardign","name":"卡缇"},{"id":"char_210_stward","name":"史都华德"},{"id":"char_211_adnach","name":"安德切尔"},{"id":"char_212_ansel","name":"安赛尔"},{"id":"char_213_mostma","name":"莫斯提马"},{"id":"char_214_kafka","name":"卡夫卡"},{"id":"char_215_mantic","name":"狮蝎"},{"id":"char_218_cuttle","name":"安哲拉"},{"id":"char_219_meteo","name":"陨星"},{"id":"char_220_grani","name":"格拉尼"},{"id":"char_222_bpipe","name":"风笛"},{"id":"char_225_haak","name":"阿"},{"id":"char_226_hmau","name":"吽"},{"id":"char_230_savage","name":"暴行"},{"id":"char_235_jesica","name":"杰西卡"},{"id":"char_236_rope","name":"暗索"},{"id":"char_237_gravel","name":"砾"},{"id":"char_240_wyvern","name":"香草"},{"id":"char_241_panda","name":"食铁兽"},{"id":"char_242_otter","name":"梅尔"},{"id":"char_243_waaifu","name":"槐琥"},{"id":"char_245_cello","name":"塑心"},{"id":"char_248_mgllan","name":"麦哲伦"},{"id":"char_249_mlyss","name":"缪尔赛思"},{"id":"char_250_phatom","name":"傀影"},{"id":"char_252_bibeak","name":"柏喙"},{"id":"char_253_greyy","name":"格雷伊"},{"id":"char_254_vodfox","name":"巫恋"},{"id":"char_258_podego","name":"波登可"},{"id":"char_260_durnar","name":"坚雷"},{"id":"char_261_sddrag","name":"苇草"},{"id":"char_263_skadi","name":"斯卡蒂"},{"id":"char_264_f12yin","name":"山"},{"id":"char_265_sophia","name":"鞭刃"},{"id":"char_271_spikes","name":"芳汀"},{"id":"char_272_strong","name":"孑"},{"id":"char_274_astesi","name":"星极"},{"id":"char_275_breeze","name":"微风"},{"id":"char_277_sqrrel","name":"阿消"},{"id":"char_278_orchid","name":"梓兰"},{"id":"char_279_excu","name":"送葬人"},{"id":"char_281_popka","name":"泡普卡"},{"id":"char_282_catap","name":"空爆"},{"id":"char_283_midn","name":"月见夜"},{"id":"char_284_spot","name":"斑点"},{"id":"char_285_medic2","name":"Lancet-2"},{"id":"char_286_cast3","name":"Castle-3"},{"id":"char_289_gyuki","name":"缠丸"},{"id":"char_290_vigna","name":"红豆"},{"id":"char_291_aglina","name":"安洁莉娜"},{"id":"char_293_thorns","name":"棘刺"},{"id":"char_294_ayer","name":"断崖"},{"id":"char_297_hamoni","name":"和弦"},{"id":"char_298_susuro","name":"苏苏洛"},{"id":"char_300_phenxi","name":"菲亚梅塔"},{"id":"char_301_cutter","name":"刻刀"},{"id":"char_302_glaze","name":"安比尔"},{"id":"char_304_zebra","name":"暴雨"},{"id":"char_306_leizi","name":"惊蛰"},{"id":"char_308_swire","name":"诗怀雅"},{"id":"char_311_mudrok","name":"泥岩"},{"id":"char_322_lmlee","name":"老鲤"},{"id":"char_325_bison","name":"拜松"},{"id":"char_326_glacus","name":"格劳克斯"},{"id":"char_328_cammou","name":"卡达"},{"id":"char_332_archet","name":"空弦"},{"id":"char_333_sidero","name":"铸铁"},{"id":"char_336_folivo","name":"稀音"},{"id":"char_337_utage","name":"宴"},{"id":"char_338_iris","name":"爱丽丝"},{"id":"char_340_shwaz","name":"黑"},{"id":"char_341_sntlla","name":"寒檀"},{"id":"char_343_tknogi","name":"月禾"},{"id":"char_344_beewax","name":"蜜蜡"},{"id":"char_345_folnic","name":"亚叶"},{"id":"char_346_aosta","name":"奥斯塔"},{"id":"char_347_jaksel","name":"杰克"},{"id":"char_348_ceylon","name":"锡兰"},{"id":"char_349_chiave","name":"贾维"},{"id":"char_350_surtr","name":"史尔特尔"},{"id":"char_355_ethan","name":"伊桑"},{"id":"char_356_broca","name":"布洛卡"},{"id":"char_358_lisa","name":"铃兰"},{"id":"char_362_saga","name":"嵯峨"},{"id":"char_363_toddi","name":"熔泉"},{"id":"char_365_aprl","name":"四月"},{"id":"char_366_acdrop","name":"酸糖"},{"id":"char_367_swllow","name":"灰喉"},{"id":"char_369_bena","name":"贝娜"},{"id":"char_373_lionhd","name":"莱恩哈特"},{"id":"char_376_therex","name":"THRM-EX"},{"id":"char_377_gdglow","name":"澄闪"},{"id":"char_378_asbest","name":"石棉"},{"id":"char_379_sesa","name":"慑砂"},{"id":"char_381_bubble","name":"泡泡"},{"id":"char_383_snsant","name":"雪雉"},{"id":"char_385_finlpp","name":"清流"},{"id":"char_388_mint","name":"薄绿"},{"id":"char_391_rosmon","name":"迷迭香"},{"id":"char_394_hadiya","name":"哈蒂娅"},{"id":"char_4000_jnight","name":"正义骑士号"},{"id":"char_4004_pudd","name":"布丁"},{"id":"char_4006_melnte","name":"玫拉"},{"id":"char_4009_irene","name":"艾丽妮"},{"id":"char_400_weedy","name":"温蒂"},{"id":"char_4010_etlchi","name":"隐德来希"},{"id":"char_4011_lessng","name":"止颂"},{"id":"char_4013_kjera","name":"耶拉"},{"id":"char_4014_lunacu","name":"子月"},{"id":"char_4015_spuria","name":"空构"},{"id":"char_4016_kazema","name":"风丸"},{"id":"char_4017_puzzle","name":"谜图"},{"id":"char_4019_ncdeer","name":"九色鹿"},{"id":"char_401_elysm","name":"极境"},{"id":"char_4023_rfalcn","name":"红隼"},{"id":"char_4025_aprot2","name":"暮落"},{"id":"char_4026_vulpis","name":"忍冬"},{"id":"char_4027_heyak","name":"霍尔海雅"},{"id":"char_402_tuye","name":"图耶"},{"id":"char_4031_liesel","name":"复奏"},{"id":"char_4032_provs","name":"但书"},{"id":"char_4036_forcer","name":"见行者"},{"id":"char_4037_demetr","name":"贝洛内"},{"id":"char_4039_horn","name":"号角"},{"id":"char_4040_rockr","name":"洛洛"},{"id":"char_4041_chnut","name":"褐果"},{"id":"char_4042_lumen","name":"流明"},{"id":"char_4043_erato","name":"埃拉托"},{"id":"char_4045_heidi","name":"海蒂"},{"id":"char_4046_ebnhlz","name":"黑键"},{"id":"char_4047_pianst","name":"车尔尼"},{"id":"char_4048_doroth","name":"多萝西"},{"id":"char_4051_akkord","name":"协律"},{"id":"char_4052_surfer","name":"寻澜"},{"id":"char_4054_malist","name":"至简"},{"id":"char_4055_bgsnow","name":"鸿雪"},{"id":"char_4056_titi","name":"缇缇"},{"id":"char_4058_pepe","name":"佩佩"},{"id":"char_405_absin","name":"苦艾"},{"id":"char_4062_totter","name":"铅踝"},{"id":"char_4063_quartz","name":"石英"},{"id":"char_4064_mlynar","name":"玛恩纳"},{"id":"char_4065_judge","name":"斥罪"},{"id":"char_4066_highmo","name":"海沫"},{"id":"char_4067_lolxh","name":"罗小黑"},{"id":"char_4071_peper","name":"明椒"},{"id":"char_4072_ironmn","name":"白铁"},{"id":"char_4077_palico","name":"泰拉大陆调查团"},{"id":"char_4078_bdhkgt","name":"截云"},{"id":"char_4079_haini","name":"海霓"},{"id":"char_4080_lin","name":"林"},{"id":"char_4081_warmy","name":"温米"},{"id":"char_4082_qiubai","name":"仇白"},{"id":"char_4083_chimes","name":"铎铃"},{"id":"char_4087_ines","name":"伊内丝"},{"id":"char_4088_hodrer","name":"赫德雷"},{"id":"char_4091_ulika","name":"U-Official"},{"id":"char_4093_frston","name":"Friston-3"},{"id":"char_4098_vvana","name":"薇薇安娜"},{"id":"char_4100_caper","name":"跃跃"},{"id":"char_4102_threye","name":"凛视"},{"id":"char_4104_coldst","name":"冰酿"},{"id":"char_4105_almond","name":"杏仁"},{"id":"char_4106_bryota","name":"苍苔"},{"id":"char_4107_vrdant","name":"维荻"},{"id":"char_4109_baslin","name":"深律"},{"id":"char_4110_delphn","name":"戴菲恩"},{"id":"char_4114_harold","name":"哈洛德"},{"id":"char_4116_blkkgt","name":"锏"},{"id":"char_4117_ray","name":"莱伊"},{"id":"char_4119_wanqin","name":"万顷"},{"id":"char_411_tomimi","name":"特米米"},{"id":"char_4121_zuole","name":"左乐"},{"id":"char_4122_grabds","name":"小满"},{"id":"char_4123_ela","name":"艾拉"},{"id":"char_4124_iana","name":"双月"},{"id":"char_4125_rdoc","name":"医生"},{"id":"char_4126_fuze","name":"导火索"},{"id":"char_4130_luton","name":"露托"},{"id":"char_4131_odda","name":"奥达"},{"id":"char_4132_ascln","name":"阿斯卡纶"},{"id":"char_4133_logos","name":"逻各斯"},{"id":"char_4134_cetsyr","name":"魔王"},{"id":"char_4136_phonor","name":"PhonoR-0"},{"id":"char_4137_udflow","name":"深巡"},{"id":"char_4138_narant","name":"娜仁图亚"},{"id":"char_4139_papyrs","name":"莎草"},{"id":"char_4140_lasher","name":"衡沙"},{"id":"char_4141_marcil","name":"玛露西尔"},{"id":"char_4142_laios","name":"莱欧斯"},{"id":"char_4143_sensi","name":"森西"},{"id":"char_4144_chilc","name":"齐尔查克"},{"id":"char_4145_ulpia","name":"乌尔比安"},{"id":"char_4146_nymph","name":"妮芙"},{"id":"char_4147_mitm","name":"渡桥"},{"id":"char_4148_philae","name":"菲莱"},{"id":"char_4151_tinman","name":"锡人"},{"id":"char_4155_talr","name":"裁度"},{"id":"char_415_flint","name":"燧石"},{"id":"char_4162_cathy","name":"凯瑟琳"},{"id":"char_4163_rosesa","name":"瑰盐"},{"id":"char_4164_tecno","name":"特克诺"},{"id":"char_4165_ctrail","name":"云迹"},{"id":"char_4166_varkis","name":"摆渡人"},{"id":"char_416_zumama","name":"森蚺"},{"id":"char_4171_wulfen","name":"钼铅"},{"id":"char_4172_xingzh","name":"行箸"},{"id":"char_4173_nowell","name":"诺威尔"},{"id":"char_4177_brigid","name":"水灯心"},{"id":"char_4178_alanna","name":"阿兰娜"},{"id":"char_4179_monstr","name":"Mon3tr"},{"id":"char_4182_oblvns","name":"丰川祥子"},{"id":"char_4183_mortis","name":"若叶睦"},{"id":"char_4184_dolris","name":"三角初华"},{"id":"char_4185_amoris","name":"祐天寺若麦"},{"id":"char_4186_tmoris","name":"八幡海铃"},{"id":"char_4187_graceb","name":"聆音"},{"id":"char_4188_confes","name":"CONFESS-47"},{"id":"char_4191_tippi","name":"蒂比"},{"id":"char_4193_lemuen","name":"蕾缪安"},{"id":"char_4194_rmixer","name":"信仰搅拌机"},{"id":"char_4195_radian","name":"电弧"},{"id":"char_4196_reckpr","name":"录武官"},{"id":"char_4198_christ","name":"Miss.Christine"},{"id":"char_4199_makiri","name":"松桐"},{"id":"char_4202_haruka","name":"遥"},{"id":"char_4203_kichi","name":"吉星"},{"id":"char_4204_mantra","name":"真言"},{"id":"char_4207_branch","name":"折桠"},{"id":"char_4208_wintim","name":"冬时"},{"id":"char_420_flamtl","name":"焰尾"},{"id":"char_4211_snhunt","name":"雪猎"},{"id":"char_4212_nasti","name":"娜斯提"},{"id":"char_4213_skybx","name":"天空盒"},{"id":"char_4214_cairn","name":"响石"},{"id":"char_4215_buddy","name":"罗德岛隐秘队"},{"id":"char_421_crow","name":"羽毛笔"},{"id":"char_4221_ju","name":"矩"},{"id":"char_4222_taraxa","name":"风絮"},{"id":"char_4223_botany","name":"伯塔尼"},{"id":"char_4224_turdus","name":"乌啾"},{"id":"char_4225_tanya","name":"裂响"},{"id":"char_4226_veen","name":"维伊"},{"id":"char_4227_gallus","name":"GALLUS²"},{"id":"char_4228_closur","name":"可露希尔"},{"id":"char_422_aurora","name":"极光"},{"id":"char_423_blemsh","name":"瑕光"},{"id":"char_426_billro","name":"卡涅利安"},{"id":"char_427_vigil","name":"伺夜"},{"id":"char_430_fartth","name":"远牙"},{"id":"char_431_ashlok","name":"灰毫"},{"id":"char_433_windft","name":"掠风"},{"id":"char_436_whispr","name":"絮雨"},{"id":"char_437_mizuki","name":"水月"},{"id":"char_440_pinecn","name":"松果"},{"id":"char_445_wscoot","name":"骋风"},{"id":"char_446_aroma","name":"阿罗玛"},{"id":"char_449_glider","name":"蜜莓"},{"id":"char_450_necras","name":"死芒"},{"id":"char_451_robin","name":"罗宾"},{"id":"char_452_bstalk","name":"豆苗"},{"id":"char_455_nothin","name":"乌有"},{"id":"char_456_ash","name":"灰烬"},{"id":"char_457_blitz","name":"闪击"},{"id":"char_458_rfrost","name":"霜华"},{"id":"char_459_tachak","name":"战车"},{"id":"char_464_cement","name":"洋灰"},{"id":"char_466_qanik","name":"雪绒"},{"id":"char_469_indigo","name":"深靛"},{"id":"char_472_pasngr","name":"异客"},{"id":"char_473_mberry","name":"桑葚"},{"id":"char_474_glady","name":"歌蕾蒂娅"},{"id":"char_475_akafyu","name":"赤冬"},{"id":"char_476_blkngt","name":"夜半"},{"id":"char_478_kirara","name":"绮良"},{"id":"char_479_sleach","name":"琴柳"},{"id":"char_484_robrta","name":"罗比菈塔"},{"id":"char_485_pallas","name":"帕拉斯"},{"id":"char_486_takila","name":"龙舌兰"},{"id":"char_487_bobb","name":"波卜"},{"id":"char_488_buildr","name":"青枳"},{"id":"char_489_serum","name":"蚀清"},{"id":"char_491_humus","name":"休谟斯"},{"id":"char_492_quercu","name":"夏栎"},{"id":"char_493_firwhl","name":"火哨"},{"id":"char_494_vendla","name":"刺玫"},{"id":"char_496_wildmn","name":"野鬃"},{"id":"char_497_ctable","name":"晓歌"},{"id":"char_498_inside","name":"隐现"},{"id":"char_499_kaitou","name":"折光"},{"id":"char_500_noirc","name":"黑角"},{"id":"char_501_durin","name":"杜林"},{"id":"char_502_nblade","name":"夜刀"},{"id":"char_503_rang","name":"巡林者"}]
    // END GENERATED OPERATOR DATA
    const OP_ID_MAP = {};
    if (typeof RAW_OPS !== 'undefined' && RAW_OPS.length > 0) {
        RAW_OPS.forEach(op => { OP_ID_MAP[op.name] = op.id; });
    }
    const unknownOperatorReports = new Map();

    function reportUnknownOperatorName(name, context = {}) {
        const normalized = typeof name === 'string' ? name.trim() : '';
        if (!normalized) return;

        const source = typeof context.source === 'string' && context.source.trim()
            ? context.source.trim()
            : 'unknown';
        const example = typeof context.example === 'string'
            ? context.example.trim().slice(0, 120)
            : '';

        let report = unknownOperatorReports.get(normalized);
        if (!report) {
            report = {
                name: normalized,
                count: 0,
                contexts: new Set(),
                examples: new Set()
            };
            unknownOperatorReports.set(normalized, report);
            console.warn('[Better PRTS] 未知干员名称', { name: normalized, source, example });
        }

        report.count += 1;
        report.contexts.add(source);
        if (example && report.examples.size < 5) {
            report.examples.add(example);
        }
    }

    function getUnknownOperatorReports() {
        return Array.from(unknownOperatorReports.values()).map(report => ({
            name: report.name,
            count: report.count,
            contexts: Array.from(report.contexts),
            examples: Array.from(report.examples)
        }));
    }

    const betterPrtsDebug = window.BetterPRTSPlusDebug || {};
    betterPrtsDebug.getUnknownOperators = getUnknownOperatorReports;
    window.BetterPRTSPlusDebug = betterPrtsDebug;

    function createEmptyAccountsData() {
        return { 1: [], 2: [], 3: [] };
    }

    function getDefaultAccountLabel(id) {
        return `账号 ${normalizeAccountId(id)}`;
    }

    function createDefaultAccountMeta() {
        const meta = {};
        ACCOUNT_IDS.forEach(id => {
            meta[id] = { label: getDefaultAccountLabel(id), labelSource: 'default' };
        });
        return meta;
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

    function normalizeAccountLabel(label, id) {
        const cleaned = typeof label === 'string'
            ? label.replace(/[\x00-\x1F\x7F]/g, '').trim()
            : '';
        return cleaned ? cleaned.slice(0, ACCOUNT_LABEL_MAX_LENGTH) : getDefaultAccountLabel(id);
    }

    function normalizeAccountLabelSource(source) {
        return ['default', 'manual', 'skland'].includes(source) ? source : 'default';
    }

    function normalizeSklandSyncText(value, maxLength = 64) {
        return stringValue(value).replace(/[\x00-\x1F\x7F]/g, '').slice(0, maxLength);
    }

    function normalizeSklandSyncMeta(value) {
        if (!isPlainRecord(value)) return null;

        const importedAtText = normalizeSklandSyncText(value.importedAt);
        const importedAtDate = new Date(importedAtText);
        if (!importedAtText || Number.isNaN(importedAtDate.getTime())) return null;

        const operatorCount = Number(value.operatorCount);
        return {
            uid: normalizeSklandSyncText(value.uid),
            nickname: normalizeSklandSyncText(value.nickname),
            importedAt: importedAtDate.toISOString(),
            operatorCount: Number.isFinite(operatorCount) && operatorCount > 0 ? Math.floor(operatorCount) : 0
        };
    }

    function normalizeSklandImportSummary(value) {
        if (!isPlainRecord(value)) return null;
        const skland = normalizeSklandSyncMeta(value);
        if (!skland) return null;

        return {
            accountId: normalizeAccountId(value.accountId),
            accountLabel: stringValue(value.accountLabel),
            ...skland
        };
    }

    function formatSklandSyncTime(importedAt) {
        const date = new Date(stringValue(importedAt));
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
    }

    function formatSklandSyncSummary(meta, options = {}) {
        const skland = normalizeSklandSyncMeta(meta);
        if (!skland) return '';

        const timeText = formatSklandSyncTime(skland.importedAt);
        const separator = options.compact ? ' ' : '：';
        const lines = [timeText ? `来自森空岛 · 上次同步${separator}${timeText}` : '来自森空岛'];
        if (options.includeDetail) {
            lines.push(`${skland.nickname || '博士'} / UID ${skland.uid || '未知'} / ${skland.operatorCount} 名干员`);
        }
        return lines.join('\n');
    }

    function normalizeAccountMeta(value) {
        const normalized = createDefaultAccountMeta();
        if (!value || typeof value !== 'object') return normalized;

        ACCOUNT_IDS.forEach(id => {
            const raw = value[id];
            if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;

            const rawLabel = typeof raw.label === 'string'
                ? raw.label.replace(/[\x00-\x1F\x7F]/g, '').trim()
                : '';
            const label = normalizeAccountLabel(rawLabel, id);
            let labelSource = rawLabel ? normalizeAccountLabelSource(raw.labelSource) : 'default';
            if (label === getDefaultAccountLabel(id) && labelSource !== 'skland') {
                labelSource = 'default';
            }
            const nextMeta = { label, labelSource };
            const skland = normalizeSklandSyncMeta(raw.skland);
            if (skland) nextMeta.skland = skland;
            normalized[id] = nextMeta;
        });
        return normalized;
    }

    function getAccountLabel(id) {
        const accountId = normalizeAccountId(id);
        const meta = accountMeta && accountMeta[accountId];
        return meta?.label || getDefaultAccountLabel(accountId);
    }

    function getAccountOperatorCount(id) {
        return (accountsData[normalizeAccountId(id)] || []).length;
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
    // =========================================================================
    //                       MODULE 2: 账户状态与迁移
    // =========================================================================

    function createAccountState(value = {}) {
        const source = isPlainRecord(value) ? value : {};
        const state = {
            activeAccountId: normalizeAccountId(source.activeAccountId),
            accountsData: normalizeAccountsData(source.accountsData),
            accountMeta: normalizeAccountMeta(source.accountMeta)
        };
        return state;
    }

    function serializeAccountState(value) {
        const state = createAccountState(value);
        return JSON.stringify({
            activeAccountId: state.activeAccountId,
            accountsData: state.accountsData,
            accountMeta: state.accountMeta
        });
    }

    function parseLegacyOperatorStore(rawValue, diagnostics, source) {
        if (!rawValue) return [];
        try {
            const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
            if (!Array.isArray(parsed)) {
                diagnostics.push({ code: 'invalid-legacy-store', source });
                return [];
            }
            const names = parsed.length > 0 && typeof parsed[0] === 'object'
                ? parsed.filter(op => isOwnedOperatorRecord(op) && op.name).map(op => op.name)
                : parsed;
            return sanitizeOperatorNames(names);
        } catch (_error) {
            diagnostics.push({ code: 'invalid-legacy-json', source });
            return [];
        }
    }

    function applyLegacySklandSummary(state, rawSummary) {
        const summary = normalizeSklandImportSummary(
            typeof rawSummary === 'string' ? safeJsonParse(rawSummary, null) : rawSummary
        );
        if (!summary) return { state, migrated: false };

        const accountId = normalizeAccountId(summary.accountId);
        if (state.accountMeta[accountId]?.skland) return { state, migrated: false };

        const nextMeta = normalizeAccountMeta(state.accountMeta);
        nextMeta[accountId] = {
            ...nextMeta[accountId],
            skland: normalizeSklandSyncMeta(summary)
        };
        return {
            state: createAccountState({ ...state, accountMeta: nextMeta }),
            migrated: true
        };
    }

    function resolveStoredAccountState(snapshot = {}) {
        const source = isPlainRecord(snapshot) ? snapshot : {};
        const diagnostics = [];
        let state = createAccountState();
        let migrated = false;

        if (source.unifiedStore) {
            try {
                const parsed = typeof source.unifiedStore === 'string'
                    ? JSON.parse(source.unifiedStore)
                    : source.unifiedStore;
                state = createAccountState(parsed);
                if (!parsed?.accountMeta) migrated = true;
            } catch (_error) {
                diagnostics.push({ code: 'invalid-unified-store', source: ACCOUNTS_DATA_KEY });
            }
        } else {
            const legacyAccounts = isPlainRecord(source.legacyAccounts) ? source.legacyAccounts : {};
            const accounts = createEmptyAccountsData();
            ACCOUNT_IDS.forEach(id => {
                const rawValue = legacyAccounts[id];
                if (!rawValue) return;
                accounts[id] = parseLegacyOperatorStore(rawValue, diagnostics, `account-${id}`);
                migrated = true;
            });

            if (accounts[1].length === 0 && source.veryOldStore) {
                accounts[1] = parseLegacyOperatorStore(source.veryOldStore, diagnostics, 'single-account');
                migrated = true;
            }

            state = createAccountState({
                activeAccountId: source.legacyActiveAccountId,
                accountsData: accounts,
                accountMeta: createDefaultAccountMeta()
            });
        }

        const sklandMigration = applyLegacySklandSummary(state, source.legacySklandSummary);
        state = sklandMigration.state;
        migrated = migrated || sklandMigration.migrated;
        if (sklandMigration.migrated) {
            diagnostics.push({ code: 'migrated-skland-summary', source: SKLAND_LAST_IMPORT_KEY });
        }

        return { state, migrated, diagnostics };
    }

    function createAccountSwitchState(state, accountId) {
        return createAccountState({ ...createAccountState(state), activeAccountId: accountId });
    }

    function createRenamedAccountState(state, accountId, rawLabel) {
        const currentState = createAccountState(state);
        const id = normalizeAccountId(accountId);
        const cleaned = stringValue(rawLabel).replace(/[\x00-\x1F\x7F]/g, '').trim();
        const currentMeta = currentState.accountMeta[id] || {};
        currentState.accountMeta[id] = {
            label: normalizeAccountLabel(cleaned, id),
            labelSource: cleaned ? 'manual' : 'default',
            ...(currentMeta.skland ? { skland: currentMeta.skland } : {})
        };
        return createAccountState(currentState);
    }

    function createSklandImportState(state, { accountId, names, binding, importedAt } = {}) {
        const currentState = createAccountState(state);
        const targetAccountId = normalizeAccountId(accountId);
        const operatorNames = sanitizeOperatorNames(names);
        if (operatorNames.length === 0) throw new Error('森空岛返回的干员数据为空。');

        const uid = normalizeSklandSyncText(binding?.uid);
        if (!uid) throw new Error('选择的森空岛角色无效，请重试。');
        const nickname = normalizeSklandSyncText(binding?.nickname ?? uid) || uid;
        const normalizedImportedAt = new Date(importedAt).toISOString();
        const currentMeta = currentState.accountMeta[targetAccountId] || {};
        const nextLabel = currentMeta.labelSource === 'manual'
            ? currentMeta.label
            : normalizeAccountLabel(nickname, targetAccountId);
        const nextLabelSource = currentMeta.labelSource === 'manual'
            ? 'manual'
            : (nextLabel === getDefaultAccountLabel(targetAccountId) ? 'default' : 'skland');
        const skland = normalizeSklandSyncMeta({
            uid,
            nickname,
            importedAt: normalizedImportedAt,
            operatorCount: operatorNames.length
        });

        currentState.activeAccountId = targetAccountId;
        currentState.accountsData[targetAccountId] = operatorNames;
        currentState.accountMeta[targetAccountId] = {
            ...currentMeta,
            label: nextLabel,
            labelSource: nextLabelSource,
            skland
        };

        const nextState = createAccountState(currentState);
        return {
            state: nextState,
            summary: {
                accountId: targetAccountId,
                accountLabel: nextState.accountMeta[targetAccountId].label,
                operatorCount: operatorNames.length,
                nickname: skland.nickname,
                uid: skland.uid,
                importedAt: skland.importedAt
            }
        };
    }
    // =========================================================================
    //                         MODULE 3: 筛选更新调度
    // =========================================================================

    function createFilterUpdateCoordinator({ requestFrame, cancelFrame, setDelay, clearDelay, run }) {
        let frameId = null;
        let delayId = null;
        let pendingCards = null;
        let forceFull = true;

        function collect(options = {}) {
            if (options.forceFull !== false) forceFull = true;
            if (!options.dirtyCards) return;
            if (!pendingCards) pendingCards = new Set();
            options.dirtyCards.forEach(card => {
                if (card) pendingCards.add(card);
            });
        }

        function request(options = {}) {
            collect(options);
            if (frameId !== null) cancelFrame(frameId);
            frameId = requestFrame(() => {
                frameId = null;
                run();
            });
        }

        function schedule(delay = 80, options = {}) {
            collect(options);
            if (delayId !== null) clearDelay(delayId);
            delayId = setDelay(() => {
                delayId = null;
                request({ forceFull: false });
            }, delay);
        }

        function takeWork(allCards) {
            const dirtyCards = pendingCards
                ? Array.from(pendingCards).filter(card => card.isConnected !== false)
                : [];
            pendingCards = null;
            const processAll = forceFull || dirtyCards.length === 0;
            forceFull = false;
            return { cards: processAll ? allCards : dirtyCards, processAll };
        }

        function reset() {
            pendingCards = null;
            forceFull = true;
        }

        function dispose() {
            if (frameId !== null) cancelFrame(frameId);
            if (delayId !== null) clearDelay(delayId);
            frameId = null;
            delayId = null;
            reset();
        }

        return { request, schedule, takeWork, reset, dispose };
    }
const SKLAND_IMPORT_CANCELLED_CODE = 'SKLAND_IMPORT_CANCELLED';

function createSklandImportCancelledError() {
        const error = new Error('已取消森空岛角色选择。');
        error.code = SKLAND_IMPORT_CANCELLED_CODE;
        return error;
    }

    function isSklandImportCancelledError(error) {
        return Boolean(error && typeof error === 'object' && error.code === SKLAND_IMPORT_CANCELLED_CODE);
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

    async function importSklandOperatorsToAccount(accountId, options = {}) {
        const targetAccountId = normalizeAccountId(accountId);
        const importOptions = isPlainRecord(options) ? options : {};
        const credential = readSklandCredentialFromStorage();
        const refreshed = await refreshSklandToken(credential);
        const bindingOptions = await getSklandArknightsBindingOptions(credential, refreshed.token, refreshed.timestamp);
        const binding = await resolveSklandImportBinding(targetAccountId, bindingOptions, importOptions);
        const playerInfo = await getSklandGamePlayerInfo(credential, refreshed.token, refreshed.timestamp, binding.uid);
        const names = convertSklandPlayerInfoToNames(playerInfo);
        const importedAt = new Date().toISOString();
        const result = createSklandImportState(getCurrentAccountState(), {
            accountId: targetAccountId,
            names,
            binding,
            importedAt
        });

        return commitSklandImportResult(result);
    }

    function commitSklandImportResult(result) {
        commitAccountState(result.state);
        try {
            GM_setValue(SKLAND_LAST_IMPORT_KEY, JSON.stringify(result.summary));
        } catch (_error) {
            console.warn('[Better PRTS] 森空岛兼容摘要保存失败，账户数据已成功保存');
        }
        return result.summary;
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

    async function getSklandArknightsBindingOptions(credential, token, timestamp) {
        const data = await sklandSignedGet('/api/v1/game/player/binding', '', credential, token, timestamp);
        if (data.code !== 0 || data.message !== 'OK' || !isPlainRecord(data.data) || !Array.isArray(data.data.list)) {
            throw new Error('读取森空岛绑定角色失败，请稍后重试。');
        }

        const bindingOptions = getSklandArknightsBindingOptionsFromList(data.data.list);
        if (bindingOptions.bindings.length > 0) return bindingOptions;

        throw new Error('森空岛账号未找到已绑定的明日方舟角色。');
    }

    function getSklandArknightsBindingOptionsFromList(list) {
        if (!Array.isArray(list)) return { bindings: [], defaultUid: '' };

        let lastDefaultUid = '';
        for (const item of list) {
            if (!isPlainRecord(item) || item.appCode !== 'arknights' || !Array.isArray(item.bindingList)) continue;
            const defaultUid = stringValue(item.defaultUid);
            lastDefaultUid = defaultUid || lastDefaultUid;
            const bindings = normalizeSklandArknightsBindings(item.bindingList, defaultUid);
            if (bindings.length > 0) return { bindings, defaultUid };
        }
        return { bindings: [], defaultUid: lastDefaultUid };
    }

    function normalizeSklandBindingOption(value, defaultUid = '') {
        if (!isPlainRecord(value)) return null;

        const uid = normalizeSklandSyncText(value.uid);
        if (!uid) return null;

        const defaultUidText = normalizeSklandSyncText(defaultUid);
        const nickname = normalizeSklandSyncText(value.nickName ?? value.nickname ?? uid) || uid;
        const channelName = normalizeSklandSyncText(value.channelName ?? value.channel ?? '官方', 32) || '官方';
        return {
            uid,
            nickname,
            channelName,
            isDefault: defaultUidText ? uid === defaultUidText : value.isDefault === true
        };
    }

    function normalizeSklandArknightsBindings(bindingList, defaultUid = '') {
        if (!Array.isArray(bindingList)) return [];

        const seen = new Set();
        const bindings = [];
        bindingList.forEach(rawBinding => {
            const binding = normalizeSklandBindingOption(rawBinding, defaultUid);
            if (!binding || seen.has(binding.uid)) return;
            seen.add(binding.uid);
            bindings.push(binding);
        });
        return bindings;
    }

    function selectSklandBindingOption(bindings, preferredUid = '', defaultUid = '') {
        const normalized = normalizeSklandArknightsBindings(bindings, defaultUid);
        if (normalized.length === 0) return null;

        const preferredUidText = normalizeSklandSyncText(preferredUid);
        if (preferredUidText) {
            const preferred = normalized.find(binding => binding.uid === preferredUidText);
            if (preferred) return preferred;
        }

        const defaultBinding = normalized.find(binding => binding.isDefault);
        return defaultBinding || normalized[0];
    }

    function selectSklandArknightsBinding(list, preferredUid = '') {
        const bindingOptions = getSklandArknightsBindingOptionsFromList(list);
        return selectSklandBindingOption(bindingOptions.bindings, preferredUid, bindingOptions.defaultUid);
    }

    function resolveSelectedSklandBinding(selected, bindings) {
        const uid = typeof selected === 'string' || typeof selected === 'number'
            ? normalizeSklandSyncText(selected)
            : normalizeSklandSyncText(selected?.uid);
        if (!uid) return null;
        return bindings.find(binding => binding.uid === uid) || null;
    }

    async function resolveSklandImportBinding(accountId, bindingOptions, options = {}) {
        const bindings = normalizeSklandArknightsBindings(bindingOptions?.bindings || [], bindingOptions?.defaultUid);
        if (bindings.length === 0) throw new Error('森空岛账号未找到已绑定的明日方舟角色。');

        const accountSyncMeta = getAccountSklandSyncMeta(accountId);
        const preferredUid = normalizeSklandSyncText(options.preferredUid ?? accountSyncMeta?.uid);
        const defaultBinding = selectSklandBindingOption(bindings, preferredUid, bindingOptions?.defaultUid);
        if (!defaultBinding) throw new Error('森空岛账号未找到已绑定的明日方舟角色。');
        if (bindings.length === 1 || typeof options.selectBinding !== 'function') return defaultBinding;

        const selected = await options.selectBinding(bindings, defaultBinding, {
            accountId: normalizeAccountId(accountId),
            preferredUid,
            defaultUid: normalizeSklandSyncText(bindingOptions?.defaultUid)
        });
        if (selected === null || selected === undefined || selected === false) {
            throw createSklandImportCancelledError();
        }

        const resolved = resolveSelectedSklandBinding(selected, bindings);
        if (!resolved) throw new Error('选择的森空岛角色无效，请重试。');
        return resolved;
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

    function normalizeDisplayMode(mode) {
        return ['GRAY', 'HIDE'].includes(mode) ? mode : 'GRAY';
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

    function getOperationResolutionForCard(card, cardInner) {
        const signature = getCardSignature(card);
        const cached = operationCache.get(card);
        if (cached && cached.signature === signature) {
            return cached.resolution;
        }

        const cardInnerOperation = extractOperationFromFiber(cardInner);
        const cardOperation = cardInnerOperation || extractOperationFromFiber(card);
        const resolution = cardOperation
            ? { operation: cardOperation, source: 'fiber' }
            : { operation: buildFallbackOperation(card), source: 'fallback' };

        operationCache.set(card, { signature, resolution });
        return resolution;
    }

    function getOperationForCard(card, cardInner) {
        return getOperationResolutionForCard(card, cardInner).operation;
    }

    function updateStatusLabel(label, className, icon, text) {
        const state = `${className}|${icon}|${text}`;
        if (label.dataset.prtsStatusState === state) return;

        label.className = className;
        label.setAttribute('aria-label', text);
        label.replaceChildren();

        const iconEl = createPrtsIcon(icon) || document.createElement('span');
        iconEl.classList.add('prts-status-icon');
        iconEl.setAttribute('aria-hidden', 'true');

        label.appendChild(iconEl);
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
    #prts-filter-bar { display: flex; align-items: flex-start; flex-direction: column; width: 100%; margin-top: 8px; margin-bottom: 12px; padding-left: 2px; }
    .prts-filter-main-row { display: flex; align-items: center; flex-wrap: wrap; width: 100%; }
    .prts-filter-sync-row { display: flex; align-items: center; width: 100%; padding-left: 48px; margin-top: 2px; }
    .prts-filter-sync-row:empty { display: none; }
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
    .prts-btn .bp4-icon { width: 16px !important; height: 16px !important; margin-right: 7px !important; color: #5c7080 !important; fill: currentColor !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; flex: 0 0 auto !important; line-height: 0 !important; vertical-align: middle !important; }
    .prts-btn .bp4-icon svg { width: 16px !important; height: 16px !important; display: block !important; flex: 0 0 auto !important; }
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
    .prts-account-list { display: flex; flex-direction: column; gap: 6px; width: 100%; margin-top: 6px; }
    .prts-account-row { display: flex; align-items: center; gap: 6px; width: 100%; }
    .prts-account-cell { display: flex; flex: 1 1 auto; min-width: 0; flex-direction: column; gap: 3px; }
    .prts-acc-btn { flex: 1 1 auto !important; min-width: 0 !important; justify-content: flex-start !important; padding: 5px 8px !important; border: 1px solid #cbd5e1 !important; margin: 0 !important; border-radius: 4px !important; transition: all 0.2s; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
    .prts-account-cell .prts-acc-btn { width: 100% !important; }
    .prts-account-sync-meta { display: none; min-width: 0; padding-left: 2px; font-size: 11px; line-height: 1.35; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .prts-account-sync-meta.is-visible { display: block; }
    .prts-account-sync-chip { display: inline-flex; align-items: center; max-width: min(100%, 360px); min-height: 26px; padding: 3px 8px; border: 1px solid #bfdbfe; border-radius: 999px; background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 700; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .prts-account-rename { flex: 0 0 auto; border: 1px solid #cbd5e1; border-radius: 4px; background: transparent; color: #64748b; cursor: pointer; font-size: 12px; padding: 4px 6px; line-height: 1.2; }
    .prts-account-rename:hover { color: #2563eb; border-color: #93c5fd; background-color: rgba(147, 197, 253, 0.16); }
    .prts-panel-actions { display: flex; gap: 8px; margin-top: 8px; width: 100%; }
    .prts-panel-actions .prts-btn { flex: 1 1 0 !important; margin: 0 !important; padding: 6px 8px !important; font-size: 13px !important; }
    .prts-acc-btn.active { background-color: #3b82f6 !important; color: #fff !important; border-color: #3b82f6 !important; }
    .prts-debug-options { display: none; margin: 2px 0 12px; padding: 10px 0 0; border-top: 1px dashed #cbd5e1; }
    .prts-debug-options.is-visible { display: block; }
    .prts-debug-options .prts-panel-item { margin-bottom: 0; }
    body.dark .prts-acc-btn { border-color: #415262 !important; color: #c4d0dc !important; }
    body.dark .prts-acc-btn.active { background-color: #2563eb !important; border-color: #2563eb !important; color: #fff !important; }
    body.dark .prts-account-rename { border-color: #415262; color: #c4d0dc; }
    body.dark .prts-account-rename:hover { color: #60a5fa; border-color: #60a5fa; background-color: rgba(96, 165, 250, 0.16); }
    body.dark .prts-debug-options { border-color: #415262; }
    body.high-contrast-theme .prts-acc-btn { border-color: #38383b !important; color: #d1d5db !important; }
    body.high-contrast-theme .prts-acc-btn.active { background-color: #2563eb !important; border-color: #2563eb !important; color: #fff !important; }
    body.high-contrast-theme .prts-account-rename { border-color: #38383b; color: #d1d5db; }
    body.high-contrast-theme .prts-account-rename:hover { color: #60a5fa; border-color: #60a5fa; background-color: rgba(96, 165, 250, 0.16); }
    body.high-contrast-theme .prts-debug-options { border-color: #38383b; }


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

    /* 8. 导入弹窗与 Toast */
    #prts-toast-container { position: fixed; right: 16px; bottom: 24px; z-index: 2147483647; width: min(360px, calc(100vw - 32px)); display: flex; flex-direction: column; gap: 8px; pointer-events: none; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; }
    .prts-toast { pointer-events: auto; padding: 10px 12px; border-radius: 6px; border: 1px solid #e5e7eb; background: #ffffff; color: #1f2937; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18); transform: translateY(0); opacity: 1; transition: opacity 0.18s ease, transform 0.18s ease; }
    .prts-toast.is-leaving { opacity: 0; transform: translateY(6px); }
    .prts-toast-title { font-size: 13px; line-height: 1.45; font-weight: 700; }
    .prts-toast-detail { margin-top: 4px; color: #475569; font-size: 12px; line-height: 1.55; white-space: pre-line; }
    .prts-toast.success { border-color: #bbf7d0; background: #f0fdf4; color: #166534; }
    .prts-toast.success .prts-toast-detail { color: #047857; }
    .prts-toast.warning { border-color: #fde68a; background: #fffbeb; color: #92400e; }
    .prts-toast.warning .prts-toast-detail { color: #b45309; }
    .prts-toast.error { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
    .prts-toast.error .prts-toast-detail { color: #b91c1c; }
    body.dark .prts-toast { border-color: #415262; background: #30404d; color: #f5f8fa; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45); }
    body.dark .prts-toast .prts-toast-detail { color: #c4d0dc; }
    body.dark .prts-toast.success { border-color: #047857; background: rgba(16, 185, 129, 0.16); color: #bbf7d0; }
    body.dark .prts-toast.success .prts-toast-detail { color: #86efac; }
    body.dark .prts-toast.warning { border-color: #b45309; background: rgba(245, 158, 11, 0.16); color: #fde68a; }
    body.dark .prts-toast.warning .prts-toast-detail { color: #fcd34d; }
    body.dark .prts-toast.error { border-color: #b91c1c; background: rgba(239, 68, 68, 0.16); color: #fecaca; }
    body.dark .prts-toast.error .prts-toast-detail { color: #fca5a5; }
    body.high-contrast-theme .prts-toast { border-color: #38383b; background: #18181c; color: #e0e0e0; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55); }
    body.high-contrast-theme .prts-toast .prts-toast-detail { color: #d1d5db; }
    body.high-contrast-theme .prts-toast.success { border-color: #22c55e; color: #bbf7d0; }
    body.high-contrast-theme .prts-toast.warning { border-color: #f59e0b; color: #fde68a; }
    body.high-contrast-theme .prts-toast.error { border-color: #ef4444; color: #fecaca; }

    #prts-compat-debug-panel { position: fixed; left: 16px; bottom: 24px; z-index: 2147483645; width: min(390px, calc(100vw - 32px)); box-sizing: border-box; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #1e293b; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; pointer-events: none; }
    #prts-compat-debug-panel * { box-sizing: border-box; }
    .prts-compat-debug-title { font-size: 12px; line-height: 1.4; font-weight: 700; color: #2563eb; }
    .prts-compat-debug-summary { margin-top: 3px; font-size: 13px; line-height: 1.45; font-weight: 700; color: #0f172a; }
    .prts-compat-debug-meta { margin-top: 4px; font-size: 11px; line-height: 1.45; color: #64748b; overflow-wrap: anywhere; }
    body.dark #prts-compat-debug-panel { border-color: #415262; background: #30404d; color: #f5f8fa; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45); }
    body.dark .prts-compat-debug-title { color: #60a5fa; }
    body.dark .prts-compat-debug-summary { color: #f5f8fa; }
    body.dark .prts-compat-debug-meta { color: #c4d0dc; }
    body.high-contrast-theme #prts-compat-debug-panel { border-color: #38383b; background: #18181c; color: #e0e0e0; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55); }
    body.high-contrast-theme .prts-compat-debug-title { color: #60a5fa; }
    body.high-contrast-theme .prts-compat-debug-summary { color: #ffffff; }
    body.high-contrast-theme .prts-compat-debug-meta { color: #d1d5db; }

    #prts-import-dialog-backdrop { position: fixed; inset: 0; z-index: 2147483646; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(15, 23, 42, 0.38); box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; }
    #prts-import-dialog { width: min(520px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; box-sizing: border-box; border: 1px solid rgba(15, 23, 42, 0.12); border-radius: 8px; background: #ffffff; color: #1f2937; box-shadow: 0 18px 48px rgba(15, 23, 42, 0.28); }
    #prts-import-dialog * { box-sizing: border-box; }
    .prts-import-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 16px 16px 12px; border-bottom: 1px solid #eef2f7; }
    .prts-import-title { margin: 0; color: #111827; font-size: 16px; line-height: 1.45; font-weight: 700; }
    .prts-import-subtitle { margin: 4px 0 0; color: #64748b; font-size: 12px; line-height: 1.5; }
    .prts-import-close { flex: 0 0 auto; width: 44px; min-height: 44px; border: none; border-radius: 4px; background: transparent; color: #64748b; cursor: pointer; font-size: 24px; line-height: 1; }
    .prts-import-close:hover, .prts-import-close:focus-visible { background: #f1f5f9; color: #0f172a; outline: none; }
    .prts-import-body { padding: 14px 16px 16px; }
    .prts-import-label { display: block; margin-bottom: 8px; color: #475569; font-size: 13px; font-weight: 700; }
    .prts-import-textarea { display: block; width: 100%; min-height: 176px; resize: vertical; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #111827; font: 13px/1.5 ui-monospace, SFMono-Regular, Consolas, "Microsoft YaHei", monospace; }
    .prts-import-textarea:focus { border-color: #2563eb; outline: 2px solid rgba(37, 99, 235, 0.2); outline-offset: 1px; }
    .prts-import-help { margin: 6px 0 0; color: #64748b; font-size: 12px; line-height: 1.5; }
    .prts-import-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .prts-import-action { min-height: 44px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; color: #334155; cursor: pointer; padding: 0 14px; font-size: 13px; font-weight: 700; }
    .prts-import-action:hover, .prts-import-action:focus-visible { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; outline: none; }
    .prts-import-action.primary { border-color: #2563eb; background: #2563eb; color: #ffffff; }
    .prts-import-action.primary:hover, .prts-import-action.primary:focus-visible { border-color: #1d4ed8; background: #1d4ed8; color: #ffffff; }
    .prts-import-action:disabled { opacity: 0.55; cursor: wait; }
    .prts-import-status { min-height: 42px; margin-top: 12px; padding: 8px 10px; border-radius: 4px; background: #f8fafc; color: #475569; font-size: 12px; line-height: 1.55; white-space: pre-line; }
    .prts-import-status.loading { background: #eff6ff; color: #1d4ed8; }
    .prts-import-status.success { background: #ecfdf5; color: #047857; }
    .prts-import-status.warning { background: #fffbeb; color: #b45309; }
    .prts-import-status.error { background: #fef2f2; color: #b91c1c; }
    #prts-modal-backdrop { position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(15, 23, 42, 0.46); box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; }
    #prts-modal { width: min(440px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; box-sizing: border-box; border: 1px solid rgba(15, 23, 42, 0.12); border-radius: 8px; background: #ffffff; color: #1f2937; box-shadow: 0 18px 48px rgba(15, 23, 42, 0.28); }
    #prts-modal * { box-sizing: border-box; }
    .prts-modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 16px 16px 12px; border-bottom: 1px solid #eef2f7; }
    .prts-modal-title { margin: 0; color: #111827; font-size: 16px; line-height: 1.45; font-weight: 700; }
    .prts-modal-body { padding: 14px 16px 0; }
    .prts-modal-message { color: #475569; font-size: 13px; line-height: 1.55; white-space: pre-line; overflow-wrap: anywhere; }
    .prts-modal-field { display: block; margin-top: 12px; }
    .prts-modal-field-label { display: block; margin-bottom: 8px; color: #475569; font-size: 13px; font-weight: 700; }
    .prts-modal-input { display: block; width: 100%; min-height: 44px; padding: 9px 10px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #111827; font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; }
    .prts-modal-input:focus { border-color: #2563eb; outline: 2px solid rgba(37, 99, 235, 0.2); outline-offset: 1px; }
    .prts-modal-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 16px 16px; }
    .prts-modal-actions .prts-import-action { min-width: 88px; }
    .prts-import-action.primary.danger { border-color: #dc2626; background: #dc2626; color: #ffffff; }
    .prts-import-action.primary.danger:hover, .prts-import-action.primary.danger:focus-visible { border-color: #b91c1c; background: #b91c1c; color: #ffffff; }
    body.dark #prts-import-dialog { border-color: #415262; background: #30404d; color: #f5f8fa; box-shadow: 0 18px 48px rgba(0, 0, 0, 0.52); }
    body.dark .prts-import-head { border-color: #415262; }
    body.dark .prts-import-title { color: #f5f8fa; }
    body.dark .prts-import-subtitle, body.dark .prts-import-label, body.dark .prts-import-help { color: #c4d0dc; }
    body.dark .prts-import-close { color: #c4d0dc; }
    body.dark .prts-import-close:hover, body.dark .prts-import-close:focus-visible { background: rgba(138, 155, 168, 0.15); color: #f5f8fa; }
    body.dark .prts-import-textarea { border-color: #415262; background: #202b33; color: #f5f8fa; }
    body.dark .prts-import-action { border-color: #415262; background: #30404d; color: #f5f8fa; }
    body.dark .prts-import-action:hover, body.dark .prts-import-action:focus-visible { border-color: #60a5fa; background: rgba(96, 165, 250, 0.16); color: #bfdbfe; }
    body.dark .prts-import-action.primary { border-color: #2563eb; background: #2563eb; color: #ffffff; }
    body.dark .prts-import-status { background: #202b33; color: #c4d0dc; }
    body.dark .prts-import-status.loading { background: rgba(96, 165, 250, 0.16); color: #bfdbfe; }
    body.dark .prts-import-status.success { background: rgba(16, 185, 129, 0.16); color: #86efac; }
    body.dark .prts-import-status.warning { background: rgba(245, 158, 11, 0.16); color: #fcd34d; }
    body.dark .prts-import-status.error { background: rgba(239, 68, 68, 0.16); color: #fca5a5; }
    body.dark #prts-modal { border-color: #415262; background: #30404d; color: #f5f8fa; box-shadow: 0 18px 48px rgba(0, 0, 0, 0.52); }
    body.dark .prts-modal-head { border-color: #415262; }
    body.dark .prts-modal-title { color: #f5f8fa; }
    body.dark .prts-modal-message, body.dark .prts-modal-field-label { color: #c4d0dc; }
    body.dark .prts-modal-input { border-color: #415262; background: #202b33; color: #f5f8fa; }
    body.high-contrast-theme #prts-import-dialog { border-color: #38383b; background: #18181c; color: #e0e0e0; }
    body.high-contrast-theme .prts-import-head { border-color: #38383b; }
    body.high-contrast-theme .prts-import-title { color: #ffffff; }
    body.high-contrast-theme .prts-import-subtitle, body.high-contrast-theme .prts-import-label, body.high-contrast-theme .prts-import-help { color: #d1d5db; }
    body.high-contrast-theme .prts-import-textarea { border-color: #38383b; background: #2d2d30; color: #ffffff; }
    body.high-contrast-theme .prts-import-action { border-color: #38383b; background: #2d2d30; color: #e0e0e0; }
    body.high-contrast-theme .prts-import-status { background: #2d2d30; color: #d1d5db; }
    body.high-contrast-theme #prts-modal { border-color: #38383b; background: #18181c; color: #e0e0e0; }
    body.high-contrast-theme .prts-modal-head { border-color: #38383b; }
    body.high-contrast-theme .prts-modal-title { color: #ffffff; }
    body.high-contrast-theme .prts-modal-message, body.high-contrast-theme .prts-modal-field-label { color: #d1d5db; }
    body.high-contrast-theme .prts-modal-input { border-color: #38383b; background: #2d2d30; color: #ffffff; }
    @media (max-width: 520px) {
        #prts-import-dialog-backdrop { align-items: flex-end; padding: 12px; }
        #prts-import-dialog { width: calc(100vw - 24px); max-height: calc(100vh - 24px); }
        #prts-modal-backdrop { align-items: flex-end; padding: 12px; }
        #prts-modal { width: calc(100vw - 24px); max-height: calc(100vh - 24px); }
        .prts-import-actions { flex-direction: column; }
        .prts-import-action { width: 100%; }
        .prts-modal-actions { flex-direction: column-reverse; }
        .prts-modal-actions .prts-import-action { width: 100%; }
    }
    @media (prefers-reduced-motion: reduce) {
        .prts-toast { transition: none; }
        .prts-toast.is-leaving { transform: none; }
    }

    /* 9. 悬浮球 & 控制面板 */
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


    /* Unified script UI tokens and accessibility polish */
    :root {
        --prts-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
        --prts-color-primary: #2563eb;
        --prts-color-primary-hover: #1d4ed8;
        --prts-color-primary-soft: #eff6ff;
        --prts-color-accent: #d97706;
        --prts-color-danger: #dc2626;
        --prts-color-success: #047857;
        --prts-color-warning: #b45309;
        --prts-color-surface: #ffffff;
        --prts-color-surface-muted: #f8fafc;
        --prts-color-surface-hover: #f1f5f9;
        --prts-color-text: #111827;
        --prts-color-text-muted: #475569;
        --prts-color-text-subtle: #64748b;
        --prts-color-border: #cbd5e1;
        --prts-color-border-soft: #e5e7eb;
        --prts-color-ring: rgba(37, 99, 235, 0.28);
        --prts-space-1: 4px;
        --prts-space-2: 8px;
        --prts-space-3: 12px;
        --prts-space-4: 16px;
        --prts-space-5: 20px;
        --prts-radius-sm: 4px;
        --prts-radius-md: 6px;
        --prts-radius-lg: 8px;
        --prts-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.08);
        --prts-shadow-md: 0 10px 30px rgba(15, 23, 42, 0.18);
        --prts-shadow-lg: 0 18px 48px rgba(15, 23, 42, 0.28);
        --prts-duration-fast: 160ms;
        --prts-duration-base: 220ms;
        --prts-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
        --prts-z-float: 2147483644;
        --prts-z-toast: 2147483647;
        --prts-z-dialog: 2147483646;
        --prts-z-modal: 2147483647;
    }
    body.dark {
        --prts-color-primary: #60a5fa;
        --prts-color-primary-hover: #93c5fd;
        --prts-color-primary-soft: rgba(96, 165, 250, 0.16);
        --prts-color-accent: #f59e0b;
        --prts-color-danger: #f87171;
        --prts-color-success: #86efac;
        --prts-color-warning: #fcd34d;
        --prts-color-surface: #30404d;
        --prts-color-surface-muted: #202b33;
        --prts-color-surface-hover: rgba(138, 155, 168, 0.15);
        --prts-color-text: #f5f8fa;
        --prts-color-text-muted: #c4d0dc;
        --prts-color-text-subtle: #8a9baa;
        --prts-color-border: #415262;
        --prts-color-border-soft: #415262;
        --prts-color-ring: rgba(96, 165, 250, 0.32);
        --prts-shadow-md: 0 10px 30px rgba(0, 0, 0, 0.45);
        --prts-shadow-lg: 0 18px 48px rgba(0, 0, 0, 0.52);
    }
    body.high-contrast-theme {
        --prts-color-primary: #60a5fa;
        --prts-color-primary-hover: #93c5fd;
        --prts-color-primary-soft: rgba(96, 165, 250, 0.18);
        --prts-color-accent: #f59e0b;
        --prts-color-danger: #fca5a5;
        --prts-color-success: #bbf7d0;
        --prts-color-warning: #fde68a;
        --prts-color-surface: #18181c;
        --prts-color-surface-muted: #2d2d30;
        --prts-color-surface-hover: rgba(138, 155, 168, 0.18);
        --prts-color-text: #ffffff;
        --prts-color-text-muted: #e0e0e0;
        --prts-color-text-subtle: #d1d5db;
        --prts-color-border: #38383b;
        --prts-color-border-soft: #38383b;
        --prts-color-ring: rgba(96, 165, 250, 0.38);
        --prts-shadow-md: 0 10px 30px rgba(0, 0, 0, 0.55);
        --prts-shadow-lg: 0 18px 48px rgba(0, 0, 0, 0.6);
    }
    #prts-filter-bar {
        gap: 0 !important;
        padding: var(--prts-space-1) 0 !important;
        margin-top: var(--prts-space-2) !important;
        margin-bottom: var(--prts-space-3) !important;
        font-family: var(--prts-font-sans);
    }
    .prts-filter-main-row {
        gap: var(--prts-space-1) !important;
    }
    .prts-filter-sync-row {
        padding-left: 48px;
        margin-top: 2px;
    }
    .prts-btn {
        gap: 6px !important;
        min-height: 34px !important;
        padding: 6px 10px !important;
        margin-right: 0 !important;
        border: 1px solid transparent !important;
        border-radius: var(--prts-radius-md) !important;
        color: var(--prts-color-text-muted) !important;
        background: transparent !important;
        font-family: var(--prts-font-sans) !important;
        font-weight: 600 !important;
        transition: color var(--prts-duration-fast) var(--prts-ease-out), background-color var(--prts-duration-fast) var(--prts-ease-out), border-color var(--prts-duration-fast) var(--prts-ease-out), box-shadow var(--prts-duration-fast) var(--prts-ease-out) !important;
        touch-action: manipulation;
    }
    .prts-btn:hover {
        background: var(--prts-color-surface-hover) !important;
        color: var(--prts-color-text) !important;
        text-decoration: none !important;
    }
    .prts-btn:focus-visible, .prts-import-action:focus-visible, .prts-account-rename:focus-visible, .prts-skland-close:focus-visible, .prts-skland-account:focus-visible, .prts-skland-primary:focus-visible, .prts-skland-link:focus-visible, .prts-skland-binding-radio:focus-visible, .prts-float-btn:focus-visible {
        outline: 2px solid var(--prts-color-primary) !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px var(--prts-color-ring) !important;
    }
    .prts-btn.prts-active, .prts-btn[aria-pressed="true"] {
        border-color: var(--prts-color-primary) !important;
        background: var(--prts-color-primary-soft) !important;
        color: var(--prts-color-primary) !important;
    }
    .prts-btn:disabled, .prts-import-action:disabled {
        opacity: 0.56 !important;
        cursor: not-allowed !important;
    }
    .prts-btn .bp4-icon, .prts-btn-icon-img, .prts-btn-icon-svg {
        width: 16px !important;
        height: 16px !important;
        margin-right: 0 !important;
        color: currentColor !important;
    }
    .prts-btn .bp4-button-text {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .prts-panel-item-label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }
    .prts-panel-item-label .bp4-icon {
        width: 16px;
        height: 16px;
        color: var(--prts-color-text-subtle);
        flex: 0 0 auto;
    }
    .prts-account-row { gap: var(--prts-space-2); }
    .prts-account-cell {
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
        flex-direction: column;
        gap: 3px;
    }
    .prts-acc-btn, .prts-account-rename {
        min-height: 34px !important;
        border-color: var(--prts-color-border) !important;
        border-radius: var(--prts-radius-md) !important;
        color: var(--prts-color-text-muted) !important;
        background: var(--prts-color-surface) !important;
    }
    .prts-account-cell .prts-acc-btn {
        width: 100% !important;
    }
    .prts-account-sync-meta {
        color: var(--prts-color-text-subtle);
    }
    .prts-account-sync-chip {
        border-color: var(--prts-color-primary);
        background: var(--prts-color-primary-soft);
        color: var(--prts-color-primary);
        flex: 0 1 auto;
    }
    .prts-acc-btn.active {
        background: var(--prts-color-primary) !important;
        border-color: var(--prts-color-primary) !important;
        color: #ffffff !important;
    }
    .prts-divider {
        height: 24px !important;
        margin: 0 var(--prts-space-1) !important;
        background: var(--prts-color-border-soft) !important;
    }
    .prts-status-label {
        width: fit-content;
        max-width: 100%;
        gap: 6px;
        padding: 3px 8px;
        border-radius: var(--prts-radius-md);
        border: 1px solid transparent;
        line-height: 1.45 !important;
    }
    .prts-status-icon {
        width: 14px;
        height: 14px;
        margin-right: 0 !important;
        color: currentColor;
        flex: 0 0 auto;
    }
    .prts-label-missing {
        border-color: rgba(220, 38, 38, 0.28);
        background: rgba(220, 38, 38, 0.08);
        color: var(--prts-color-danger) !important;
    }
    .prts-label-support {
        border-color: rgba(217, 119, 6, 0.32);
        background: rgba(217, 119, 6, 0.1);
        color: var(--prts-color-accent) !important;
    }
    .prts-desc-wrapper:focus {
        outline: 2px solid var(--prts-color-primary);
        outline-offset: 2px;
        border-radius: var(--prts-radius-sm);
    }
    .prts-desc-wrapper:hover .prts-desc-content, .prts-desc-wrapper:focus .prts-desc-content, .prts-desc-wrapper:focus-within .prts-desc-content {
        position: absolute;
        top: -4px;
        left: -8px;
        width: calc(100% + 16px);
        height: auto;
        white-space: normal;
        overflow: visible;
        background: var(--prts-color-surface) !important;
        color: var(--prts-color-text-muted) !important;
        border: 1px solid var(--prts-color-border-soft) !important;
        border-radius: var(--prts-radius-md);
        box-shadow: var(--prts-shadow-md) !important;
    }
    .prts-bili-link {
        gap: 5px;
        color: var(--prts-color-primary) !important;
        font-weight: 600 !important;
    }
    .prts-bili-link:focus-visible {
        outline: 2px solid var(--prts-color-primary);
        outline-offset: 2px;
        border-radius: var(--prts-radius-sm);
    }
    .prts-op-grid { gap: var(--prts-space-2) !important; }
    .prts-op-item, .prts-op-text, .prts-popover-item {
        border-radius: var(--prts-radius-md) !important;
        border-color: var(--prts-color-border) !important;
        background: var(--prts-color-surface-muted) !important;
        transition: transform var(--prts-duration-fast) var(--prts-ease-out), box-shadow var(--prts-duration-fast) var(--prts-ease-out), border-color var(--prts-duration-fast) var(--prts-ease-out) !important;
    }
    .prts-op-item:hover, .prts-op-text:hover, .prts-op-item:focus-visible, .prts-op-text:focus-visible, .prts-popover-item:focus-visible {
        border-color: var(--prts-color-primary) !important;
        box-shadow: 0 0 0 3px var(--prts-color-ring), var(--prts-shadow-sm) !important;
        outline: none;
    }
    .prts-op-img, .prts-popover-img { border-radius: calc(var(--prts-radius-md) - 1px) !important; }
    .prts-level-badge {
        border-radius: var(--prts-radius-sm) !important;
        background: var(--prts-color-primary) !important;
        border-color: var(--prts-color-primary-hover) !important;
        box-shadow: var(--prts-shadow-sm) !important;
    }
    [data-prts-tooltip]:hover::after, [data-prts-tooltip]:focus-visible::after {
        background: var(--prts-color-text) !important;
        color: var(--prts-color-surface) !important;
        border-radius: var(--prts-radius-md) !important;
        box-shadow: var(--prts-shadow-md) !important;
    }
    [data-prts-tooltip]:hover::before, [data-prts-tooltip]:focus-visible::before {
        border-color: var(--prts-color-text) transparent transparent transparent !important;
    }
    .prts-dialog-tag {
        border-radius: var(--prts-radius-sm);
        font-size: 12px;
        line-height: 1.3;
    }
    #prts-toast-container {
        z-index: var(--prts-z-toast) !important;
        gap: var(--prts-space-2) !important;
        font-family: var(--prts-font-sans) !important;
    }
    .prts-toast {
        border-color: var(--prts-color-border-soft) !important;
        border-radius: var(--prts-radius-lg) !important;
        background: var(--prts-color-surface) !important;
        color: var(--prts-color-text) !important;
        box-shadow: var(--prts-shadow-md) !important;
    }
    .prts-toast-detail { color: var(--prts-color-text-muted) !important; }
    #prts-import-dialog-backdrop, #prts-modal-backdrop {
        background: rgba(15, 23, 42, 0.52) !important;
        font-family: var(--prts-font-sans) !important;
    }
    #prts-import-dialog-backdrop { z-index: var(--prts-z-dialog) !important; }
    #prts-modal-backdrop { z-index: var(--prts-z-modal) !important; }
    #prts-import-dialog, #prts-modal {
        border-color: var(--prts-color-border-soft) !important;
        border-radius: var(--prts-radius-lg) !important;
        background: var(--prts-color-surface) !important;
        color: var(--prts-color-text) !important;
        box-shadow: var(--prts-shadow-lg) !important;
    }
    .prts-import-head, .prts-modal-head { border-color: var(--prts-color-border-soft) !important; }
    .prts-import-title, .prts-modal-title { color: var(--prts-color-text) !important; }
    .prts-import-subtitle, .prts-import-label, .prts-import-help, .prts-modal-message, .prts-modal-field-label {
        color: var(--prts-color-text-muted) !important;
    }
    .prts-import-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--prts-color-text-subtle) !important;
        transition: color var(--prts-duration-fast) var(--prts-ease-out), background-color var(--prts-duration-fast) var(--prts-ease-out) !important;
    }
    .prts-import-close .bp4-icon {
        width: 16px;
        height: 16px;
    }
    .prts-import-close:hover {
        background: var(--prts-color-surface-hover) !important;
        color: var(--prts-color-text) !important;
    }
    .prts-import-textarea, .prts-modal-input {
        border-color: var(--prts-color-border) !important;
        border-radius: var(--prts-radius-md) !important;
        background: var(--prts-color-surface) !important;
        color: var(--prts-color-text) !important;
    }
    .prts-import-textarea:focus, .prts-modal-input:focus {
        border-color: var(--prts-color-primary) !important;
        outline: 2px solid var(--prts-color-ring) !important;
        outline-offset: 1px !important;
    }
    .prts-import-action {
        border-color: var(--prts-color-border) !important;
        border-radius: var(--prts-radius-md) !important;
        background: var(--prts-color-surface) !important;
        color: var(--prts-color-text-muted) !important;
        font-family: var(--prts-font-sans) !important;
        transition: color var(--prts-duration-fast) var(--prts-ease-out), background-color var(--prts-duration-fast) var(--prts-ease-out), border-color var(--prts-duration-fast) var(--prts-ease-out) !important;
    }
    .prts-import-action:hover {
        border-color: var(--prts-color-primary) !important;
        background: var(--prts-color-primary-soft) !important;
        color: var(--prts-color-primary) !important;
    }
    .prts-import-action.primary {
        border-color: var(--prts-color-primary) !important;
        background: var(--prts-color-primary) !important;
        color: #ffffff !important;
    }
    .prts-import-status {
        border-radius: var(--prts-radius-md) !important;
        background: var(--prts-color-surface-muted) !important;
        color: var(--prts-color-text-muted) !important;
    }
    #prts-compat-debug-panel {
        z-index: calc(var(--prts-z-float) - 1) !important;
        border-color: var(--prts-color-border) !important;
        border-radius: var(--prts-radius-lg) !important;
        background: var(--prts-color-surface) !important;
        color: var(--prts-color-text) !important;
        box-shadow: var(--prts-shadow-md) !important;
        font-family: var(--prts-font-sans) !important;
    }
    #prts-float-container {
        z-index: var(--prts-z-float) !important;
        transition: opacity var(--prts-duration-base) var(--prts-ease-out), transform var(--prts-duration-base) var(--prts-ease-out) !important;
    }
    .prts-float-btn {
        padding: 0;
        font: inherit;
        border-color: var(--prts-color-border-soft) !important;
        background: var(--prts-color-surface) !important;
        color: var(--prts-color-text-muted) !important;
        box-shadow: var(--prts-shadow-sm) !important;
        touch-action: none;
    }
    .prts-settings-panel {
        width: min(292px, calc(100vw - 72px)) !important;
        max-height: min(560px, calc(100vh - 24px));
        overflow: auto;
        overscroll-behavior: contain;
        padding: var(--prts-space-4) !important;
        border-color: var(--prts-color-border-soft) !important;
        border-radius: var(--prts-radius-lg) !important;
        background: var(--prts-color-surface) !important;
        color: var(--prts-color-text) !important;
        box-shadow: var(--prts-shadow-lg) !important;
        font-family: var(--prts-font-sans) !important;
    }
    .prts-panel-title {
        color: var(--prts-color-text) !important;
        border-color: var(--prts-color-border-soft) !important;
    }
    .prts-panel-item { color: var(--prts-color-text-muted) !important; }
    .prts-switch { width: 40px; height: 22px; flex: 0 0 auto; }
    .prts-switch input:focus-visible + .prts-slider {
        outline: 2px solid var(--prts-color-primary);
        outline-offset: 2px;
        box-shadow: 0 0 0 4px var(--prts-color-ring);
    }
    .prts-slider {
        background: var(--prts-color-border) !important;
        transition: background-color var(--prts-duration-fast) var(--prts-ease-out) !important;
    }
    .prts-slider:before {
        transition: transform var(--prts-duration-fast) var(--prts-ease-out) !important;
        box-shadow: var(--prts-shadow-sm);
    }
    input:checked + .prts-slider { background: var(--prts-color-primary) !important; }
    input:checked + .prts-slider:before { transform: translateX(18px) !important; }
    @media (max-width: 520px) {
        #prts-filter-bar { gap: var(--prts-space-2) !important; }
        .prts-btn, .prts-acc-btn, .prts-account-rename, .prts-import-action {
            min-height: 44px !important;
        }
        #prts-filter-bar .prts-btn {
            flex: 1 1 calc(50% - var(--prts-space-2));
            min-width: 0;
        }
        #prts-float-container { max-width: calc(100vw - 24px); }
        .prts-settings-panel {
            width: min(320px, calc(100vw - 72px)) !important;
            max-height: calc(100vh - 24px);
        }
        #prts-import-dialog, #prts-modal {
            border-radius: var(--prts-radius-lg) var(--prts-radius-lg) 0 0 !important;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        #prts-float-container, #prts-float-container.is-snapping, .prts-settings-panel, .prts-btn, .prts-import-action, .prts-toast, .prts-op-item, .prts-op-text, .prts-popover-item, .prts-slider, .prts-slider:before {
            transition: none !important;
        }
        .prts-toast.is-leaving, .prts-op-item:hover, .prts-op-text:hover {
            transform: none !important;
        }
    }

    /* 10. 侧边栏折叠布局 */
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
    #prts-modal-backdrop { position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(15, 23, 42, 0.46); box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; }
    #prts-modal { width: min(440px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; box-sizing: border-box; border: 1px solid rgba(15, 23, 42, 0.12); border-radius: 8px; background: #ffffff; color: #1f2937; box-shadow: 0 18px 48px rgba(15, 23, 42, 0.28); }
    #prts-modal * { box-sizing: border-box; }
    .prts-modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 16px 16px 12px; border-bottom: 1px solid #eef2f7; }
    .prts-modal-title { margin: 0; color: #111827; font-size: 16px; line-height: 1.45; font-weight: 700; }
    .prts-modal-body { padding: 14px 16px 0; }
    .prts-modal-message { color: #475569; font-size: 13px; line-height: 1.55; white-space: normal; overflow-wrap: anywhere; }
    .prts-modal-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 16px 16px; }
    .prts-modal-actions .prts-import-action { min-width: 88px; }
    .prts-import-close { flex: 0 0 auto; width: 44px; min-height: 44px; border: none; border-radius: 4px; background: transparent; color: #64748b; cursor: pointer; font-size: 24px; line-height: 1; }
    .prts-import-close:hover, .prts-import-close:focus-visible { background: #f1f5f9; color: #0f172a; outline: none; }
    .prts-import-action { min-height: 44px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff; color: #334155; cursor: pointer; padding: 0 14px; font-size: 13px; font-weight: 700; }
    .prts-import-action:hover, .prts-import-action:focus-visible { border-color: #93c5fd; background: #eff6ff; color: #1d4ed8; outline: none; }
    .prts-import-action.primary { border-color: #2563eb; background: #2563eb; color: #ffffff; }
    .prts-import-action.primary:hover, .prts-import-action.primary:focus-visible { border-color: #1d4ed8; background: #1d4ed8; color: #ffffff; }
    .prts-skland-binding-picker { display: flex; flex-direction: column; gap: 10px; }
    .prts-skland-binding-intro { margin: 0; color: #475569; font-size: 13px; line-height: 1.55; }
    .prts-skland-binding-list { display: flex; flex-direction: column; gap: 8px; max-height: min(320px, calc(100vh - 220px)); overflow: auto; padding: 2px; }
    .prts-skland-binding-option { display: flex; align-items: flex-start; gap: 10px; min-height: 58px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; background: #ffffff; color: #111827; cursor: pointer; transition: border-color 160ms cubic-bezier(0.16, 1, 0.3, 1), background-color 160ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 160ms cubic-bezier(0.16, 1, 0.3, 1); }
    .prts-skland-binding-option:hover { border-color: #93c5fd; background: #f8fafc; }
    .prts-skland-binding-option.is-selected { border-color: #2563eb; background: #eff6ff; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18); }
    .prts-skland-binding-radio { flex: 0 0 auto; width: 18px; height: 18px; margin: 2px 0 0; accent-color: #2563eb; cursor: pointer; }
    .prts-skland-binding-text { display: flex; flex: 1 1 auto; min-width: 0; flex-direction: column; gap: 4px; }
    .prts-skland-binding-name-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; min-width: 0; }
    .prts-skland-binding-name { min-width: 0; color: #111827; font-size: 14px; line-height: 1.35; font-weight: 700; overflow-wrap: anywhere; }
    .prts-skland-binding-badge { flex: 0 0 auto; padding: 2px 6px; border: 1px solid #bfdbfe; border-radius: 999px; background: #eff6ff; color: #2563eb; font-size: 11px; line-height: 1.2; font-weight: 700; }
    .prts-skland-binding-meta { color: #64748b; font-size: 12px; line-height: 1.45; overflow-wrap: anywhere; }
    :root {
        --prts-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
        --prts-color-primary: #2563eb;
        --prts-color-primary-hover: #1d4ed8;
        --prts-color-primary-soft: #eff6ff;
        --prts-color-surface: #ffffff;
        --prts-color-surface-muted: #f8fafc;
        --prts-color-surface-hover: #f1f5f9;
        --prts-color-text: #111827;
        --prts-color-text-muted: #475569;
        --prts-color-text-subtle: #64748b;
        --prts-color-border: #cbd5e1;
        --prts-color-border-soft: #e5e7eb;
        --prts-color-ring: rgba(37, 99, 235, 0.28);
        --prts-radius-md: 6px;
        --prts-radius-lg: 8px;
        --prts-shadow-lg: 0 18px 48px rgba(15, 23, 42, 0.28);
        --prts-duration-fast: 160ms;
        --prts-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    }
    body.dark {
        --prts-color-primary: #60a5fa;
        --prts-color-primary-hover: #93c5fd;
        --prts-color-primary-soft: rgba(96, 165, 250, 0.16);
        --prts-color-surface: #30404d;
        --prts-color-surface-muted: #202b33;
        --prts-color-surface-hover: rgba(138, 155, 168, 0.15);
        --prts-color-text: #f5f8fa;
        --prts-color-text-muted: #c4d0dc;
        --prts-color-text-subtle: #8a9baa;
        --prts-color-border: #415262;
        --prts-color-border-soft: #415262;
        --prts-color-ring: rgba(96, 165, 250, 0.32);
        --prts-shadow-lg: 0 18px 48px rgba(0, 0, 0, 0.52);
    }
    body.high-contrast-theme {
        --prts-color-primary: #60a5fa;
        --prts-color-primary-hover: #93c5fd;
        --prts-color-primary-soft: rgba(96, 165, 250, 0.18);
        --prts-color-surface: #18181c;
        --prts-color-surface-muted: #2d2d30;
        --prts-color-surface-hover: rgba(138, 155, 168, 0.18);
        --prts-color-text: #ffffff;
        --prts-color-text-muted: #e0e0e0;
        --prts-color-text-subtle: #d1d5db;
        --prts-color-border: #38383b;
        --prts-color-border-soft: #38383b;
        --prts-color-ring: rgba(96, 165, 250, 0.38);
        --prts-shadow-lg: 0 18px 48px rgba(0, 0, 0, 0.6);
    }
    #prts-skland-import-panel {
        border-color: var(--prts-color-border-soft) !important;
        border-radius: var(--prts-radius-lg) !important;
        background: var(--prts-color-surface) !important;
        color: var(--prts-color-text) !important;
        box-shadow: var(--prts-shadow-lg) !important;
        font-family: var(--prts-font-sans) !important;
    }
    .prts-skland-head { border-color: var(--prts-color-border-soft) !important; }
    .prts-skland-title { color: var(--prts-color-text) !important; }
    .prts-skland-subtitle, .prts-skland-label, .prts-skland-binding-intro { color: var(--prts-color-text-muted) !important; }
    #prts-modal-backdrop { background: rgba(15, 23, 42, 0.52) !important; }
    #prts-modal {
        border-color: var(--prts-color-border-soft) !important;
        border-radius: var(--prts-radius-lg) !important;
        background: var(--prts-color-surface) !important;
        color: var(--prts-color-text) !important;
        box-shadow: var(--prts-shadow-lg) !important;
        font-family: var(--prts-font-sans) !important;
    }
    .prts-modal-head { border-color: var(--prts-color-border-soft) !important; }
    .prts-modal-title { color: var(--prts-color-text) !important; }
    .prts-modal-message { color: var(--prts-color-text-muted) !important; }
    .prts-import-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--prts-color-text-subtle) !important;
        transition: color var(--prts-duration-fast) var(--prts-ease-out), background-color var(--prts-duration-fast) var(--prts-ease-out);
    }
    .prts-import-close .bp4-icon { width: 16px; height: 16px; }
    .prts-import-close:hover, .prts-import-close:focus-visible {
        background: var(--prts-color-surface-hover) !important;
        color: var(--prts-color-text) !important;
    }
    .prts-import-action {
        border-color: var(--prts-color-border) !important;
        border-radius: var(--prts-radius-md) !important;
        background: var(--prts-color-surface) !important;
        color: var(--prts-color-text-muted) !important;
        font-family: var(--prts-font-sans) !important;
        transition: color var(--prts-duration-fast) var(--prts-ease-out), background-color var(--prts-duration-fast) var(--prts-ease-out), border-color var(--prts-duration-fast) var(--prts-ease-out);
    }
    .prts-import-action:hover, .prts-import-action:focus-visible {
        border-color: var(--prts-color-primary) !important;
        background: var(--prts-color-primary-soft) !important;
        color: var(--prts-color-primary) !important;
    }
    .prts-import-action.primary {
        border-color: var(--prts-color-primary) !important;
        background: var(--prts-color-primary) !important;
        color: #ffffff !important;
    }
    .prts-skland-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 44px;
        min-height: 44px;
        color: var(--prts-color-text-subtle) !important;
        transition: color var(--prts-duration-fast) var(--prts-ease-out), background-color var(--prts-duration-fast) var(--prts-ease-out);
    }
    .prts-skland-close .bp4-icon { width: 16px; height: 16px; }
    .prts-skland-close:hover, .prts-skland-close:focus-visible {
        background: var(--prts-color-surface-hover) !important;
        color: var(--prts-color-text) !important;
    }
    .prts-skland-account {
        min-height: 44px;
        border-color: var(--prts-color-border) !important;
        border-radius: var(--prts-radius-md) !important;
        background: var(--prts-color-surface) !important;
        color: var(--prts-color-text-muted) !important;
    }
    .prts-skland-account.active {
        border-color: var(--prts-color-primary) !important;
        background: var(--prts-color-primary) !important;
        color: #ffffff !important;
    }
    .prts-skland-primary {
        min-height: 44px;
        border-radius: var(--prts-radius-md) !important;
        background: var(--prts-color-primary) !important;
        transition: background-color var(--prts-duration-fast) var(--prts-ease-out), box-shadow var(--prts-duration-fast) var(--prts-ease-out);
    }
    .prts-skland-primary:hover { background: var(--prts-color-primary-hover) !important; }
    .prts-skland-primary:disabled { opacity: 0.6; cursor: wait; }
    .prts-skland-status {
        border-radius: var(--prts-radius-md) !important;
        background: var(--prts-color-surface-muted) !important;
        color: var(--prts-color-text-muted) !important;
    }
    .prts-skland-status.loading { background: var(--prts-color-primary-soft) !important; color: var(--prts-color-primary) !important; }
    .prts-skland-link { color: var(--prts-color-primary) !important; }
    .prts-skland-binding-option {
        border-color: var(--prts-color-border) !important;
        border-radius: var(--prts-radius-md) !important;
        background: var(--prts-color-surface) !important;
        color: var(--prts-color-text) !important;
        transition: border-color var(--prts-duration-fast) var(--prts-ease-out), background-color var(--prts-duration-fast) var(--prts-ease-out), box-shadow var(--prts-duration-fast) var(--prts-ease-out);
    }
    .prts-skland-binding-option:hover {
        border-color: var(--prts-color-primary) !important;
        background: var(--prts-color-surface-hover) !important;
    }
    .prts-skland-binding-option.is-selected {
        border-color: var(--prts-color-primary) !important;
        background: var(--prts-color-primary-soft) !important;
        box-shadow: 0 0 0 3px var(--prts-color-ring) !important;
    }
    .prts-skland-binding-radio { accent-color: var(--prts-color-primary); }
    .prts-skland-binding-name { color: var(--prts-color-text) !important; }
    .prts-skland-binding-meta { color: var(--prts-color-text-subtle) !important; }
    .prts-skland-binding-badge {
        border-color: var(--prts-color-primary) !important;
        background: var(--prts-color-primary-soft) !important;
        color: var(--prts-color-primary) !important;
    }
    .prts-skland-account:focus-visible, .prts-skland-primary:focus-visible, .prts-skland-close:focus-visible, .prts-skland-link:focus-visible, .prts-skland-binding-radio:focus-visible, .prts-import-close:focus-visible, .prts-import-action:focus-visible {
        outline: 2px solid var(--prts-color-primary);
        outline-offset: 2px;
        box-shadow: 0 0 0 4px var(--prts-color-ring);
    }
    @media (max-width: 520px) {
        #prts-skland-import-panel { left: 12px; right: 12px; top: auto; bottom: max(12px, env(safe-area-inset-bottom)); width: auto; }
        #prts-modal-backdrop { align-items: flex-end; padding: 12px; }
        #prts-modal { width: calc(100vw - 24px); max-height: calc(100vh - 24px); border-radius: var(--prts-radius-lg) var(--prts-radius-lg) 0 0 !important; }
        .prts-modal-actions { flex-direction: column-reverse; }
        .prts-modal-actions .prts-import-action { width: 100%; }
        .prts-skland-binding-list { max-height: min(360px, calc(100vh - 260px)); }
    }
    @media (prefers-reduced-motion: reduce) {
        .prts-skland-close, .prts-skland-primary, .prts-skland-binding-option, .prts-import-close, .prts-import-action { transition: none !important; }
    }
`;

    GM_addStyle(isSklandHost() ? sklandImportStyles : mergedStyles);
    // =========================================================================
    //                            MODULE 3.5: DOM UI HELPERS
    // =========================================================================

    const SVG_NS = 'http://www.w3.org/2000/svg';
    let prtsModalCleanup = null;

    const PRTS_ICON_PATHS = {
        account: 'M8 8c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0 1c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
        archive: 'M2 2h12v3H2V2zm1 4h10v8H3V6zm3 2v1.5h4V8H6z',
        check: 'M13.76 3.84l-7.2 7.2L3.04 7.52 1.6 8.96l5.04 5.04 8.64-8.64z',
        close: 'M3.72 2.28 8 6.56l4.28-4.28 1.44 1.44L9.44 8l4.28 4.28-1.44 1.44L8 9.44l-4.28 4.28-1.44-1.44L6.56 8 2.28 3.72z',
        download: 'M8 11.5 3.75 7.25l1.1-1.1L7.2 8.5V1h1.6v7.5l2.35-2.35 1.1 1.1L8 11.5zM2 13h12v1.6H2V13z',
        eyeOff: 'M6.41 7.83c-.03.39.07.79.31 1.12.24.34.59.58.98.68.39.1.81.02 1.15-.21.34-.23.59-.57.7-.96.1-.39.02-.8-.21-1.15-.16-.23-.38-.42-.64-.53L6.41 7.83z M2.05 2.64 1.03 3.66l12.9 12.07 1.02-1.02-2.08-2.09C14.05 11.84 15 10.72 16 8c0 0-3-5-8-5-1.23 0-2.36.3-3.37.8L2.05 2.64zM8 12c-2.21 0-4-1.79-4-4 0-.2.02-.39.05-.58l5.04 5.04C8.74 12.56 8.37 12 8 12z',
        eyeOn: 'M8 3C3 3 0 8 0 8s3 5 8 5 8-5 8-5-3-5-8-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z M8 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
        filter: 'M1 2h14L9.5 8v5.5L6.5 15V8L1 2z',
        import: 'M11 6h3l-6 6-6-6h3V1h6v5zm-9 8v2h12v-2h-2v1H4v-1H2z',
        layout: 'M14 3H2c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zm-1 9H9V4h4v8zM3 4h4v8H3V4z',
        link: 'M6.2 10.6 5.1 9.5l4.4-4.4 1.1 1.1-4.4 4.4zm-1.6 2.2c-1 0-1.9-.4-2.6-1.1-1.4-1.4-1.4-3.8 0-5.2l2.2-2.2 1.1 1.1-2.2 2.2c-.8.8-.8 2.2 0 3 .8.8 2.2.8 3 0l1.1 1.1c-.7.7-1.6 1.1-2.6 1.1zm7.2-1.1-1.1-1.1 2.2-2.2c.8-.8.8-2.2 0-3-.8-.8-2.2-.8-3 0L8.8 4.3c1.4-1.4 3.8-1.4 5.2 0 1.4 1.4 1.4 3.8 0 5.2l-2.2 2.2z',
        missing: 'M8 1.4 15.2 14H.8L8 1.4zm0 3.1L3.5 12.4h9L8 4.5zm-.8 2.4h1.6v2.9H7.2V6.9zm0 3.8h1.6v1.5H7.2v-1.5z',
        operators: 'M5.5 7.2A2.6 2.6 0 1 1 5.5 2a2.6 2.6 0 0 1 0 5.2zM1 13.5c.3-2.7 2.1-4.4 4.5-4.4s4.2 1.7 4.5 4.4H1zm10.6-4.3a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4zm-.8 4.3c-.1-1.2-.5-2.2-1.1-3 .5-.2 1.1-.3 1.9-.3 1.9 0 3.3 1.2 3.5 3.3h-4.3z',
        save: 'M2 1h10l2 2v12H2V1zm2 2v4h7V3H4zm1 8v2h6v-2H5z',
        settings: 'M9.5 1 10 3l1.8.8 1.8-.9 1.5 2.6-1.7 1.2c.1.4.1.8.1 1.3s0 .9-.1 1.3l1.7 1.2-1.5 2.6-1.8-.9-1.8.8-.5 2h-3l-.5-2-1.8-.8-1.8.9L.9 10.5l1.7-1.2C2.5 8.9 2.5 8.5 2.5 8s0-.9.1-1.3L.9 5.5l1.5-2.6 1.8.9L6 3l.5-2h3zM8 5.2A2.8 2.8 0 1 0 8 10.8 2.8 2.8 0 0 0 8 5.2z',
        support: 'M12 6.4c0-1.77-1.43-3.2-3.2-3.2S5.6 4.63 5.6 6.4s1.43 3.2 3.2 3.2 3.2-1.43 3.2-3.2zm-3.2 1.6c-.88 0-1.6-.72-1.6-1.6s.72-1.6 1.6-1.6 1.6.72 1.6 1.6-.72 1.6-1.6 1.6zm6.4 6.4H.8V12c0-.88.72-1.6 1.6-1.6h9.6c.88 0 1.6.72 1.6 1.6v2.4z',
        upload: 'M8 4.5 3.75 8.75l1.1 1.1L7.2 7.5V15h1.6V7.5l2.35 2.35 1.1-1.1L8 4.5zM2 1h12v1.6H2V1z',
        video: 'M2 3h8c.55 0 1 .45 1 1v2l3-2v8l-3-2v2c0 .55-.45 1-1 1H2c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1z'
    };

    function getFocusableDialogElements(root) {
        return Array.from(root.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'))
            .filter(element => element instanceof HTMLElement && element.getClientRects().length > 0);
    }

    function ensurePrtsToastContainer() {
        let container = document.getElementById('prts-toast-container');
        if (container) return container;

        container = document.createElement('div');
        container.id = 'prts-toast-container';
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'false');
        document.body.appendChild(container);
        return container;
    }

    function showPrtsToast(message, type = 'info', detail = '') {
        const container = ensurePrtsToastContainer();
        const toastType = ['success', 'warning', 'error'].includes(type) ? type : '';
        const toast = document.createElement('div');
        toast.className = `prts-toast${toastType ? ` ${toastType}` : ''}`;

        const title = document.createElement('div');
        title.className = 'prts-toast-title';
        title.textContent = message;
        toast.appendChild(title);

        if (detail) {
            const detailEl = document.createElement('div');
            detailEl.className = 'prts-toast-detail';
            detailEl.textContent = detail;
            toast.appendChild(detailEl);
        }

        container.appendChild(toast);
        window.setTimeout(() => {
            toast.classList.add('is-leaving');
            window.setTimeout(() => toast.remove(), 220);
        }, 4000);
    }

    function createSvgIconFromPath(pathData, viewBox = '0 0 16 16') {
        const span = document.createElement('span');
        span.className = 'bp4-icon';
        span.setAttribute('aria-hidden', 'true');

        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('viewBox', viewBox);
        svg.setAttribute('fill', 'currentColor');
        svg.setAttribute('focusable', 'false');

        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', String(pathData || ''));
        svg.appendChild(path);
        span.appendChild(svg);
        return span;
    }

    function createSklandIconImage() {
        try {
            const parsed = new DOMParser().parseFromString(SKLAND_FAVICON_SVG, 'image/svg+xml');
            const svg = parsed.documentElement;
            if (svg?.tagName?.toLowerCase() === 'svg') {
                const imported = document.importNode(svg, true);
                imported.classList.add('prts-btn-icon-svg');
                imported.setAttribute('aria-hidden', 'true');
                imported.setAttribute('focusable', 'false');
                return imported;
            }
        } catch (error) {
            console.warn('[Better PRTS] Failed to render Skland icon', error);
        }

        return createSvgIconFromPath('M2 2h12v12H2z');
    }

    function createPrtsIcon(icon) {
        if (!icon) return null;
        if (icon === 'skland' || icon.type === 'skland') return createSklandIconImage();
        if (typeof icon === 'string') return createSvgIconFromPath(PRTS_ICON_PATHS[icon] || icon);
        if (icon.path) return createSvgIconFromPath(icon.path, icon.viewBox || '0 0 16 16');
        if (icon instanceof Node) return icon.cloneNode(true);
        return null;
    }

    function createPrtsButton({
        id,
        className = 'prts-btn',
        icon = null,
        text = '',
        active = false,
        disabled = false,
        title = '',
        ariaLabel = '',
        ariaControls = '',
        ariaDescribedBy = '',
        expanded = null,
        pressed = null,
        onClick = null
    } = {}) {
        let btn = id ? document.getElementById(id) : null;
        if (!btn || btn.tagName !== 'BUTTON') {
            btn = document.createElement('button');
            btn.type = 'button';
            if (id) btn.id = id;
        }

        btn.className = className;
        btn.classList.toggle('prts-active', active === true);
        btn.disabled = disabled === true;
        btn.style.opacity = '';
        btn.style.cursor = '';

        if (title) btn.title = title;
        else btn.removeAttribute('title');

        if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
        else btn.removeAttribute('aria-label');

        if (ariaControls) btn.setAttribute('aria-controls', ariaControls);
        else btn.removeAttribute('aria-controls');

        if (ariaDescribedBy) btn.setAttribute('aria-describedby', ariaDescribedBy);
        else btn.removeAttribute('aria-describedby');

        if (expanded !== null) btn.setAttribute('aria-expanded', expanded === true ? 'true' : 'false');
        else btn.removeAttribute('aria-expanded');

        if (pressed !== null) btn.setAttribute('aria-pressed', pressed === true ? 'true' : 'false');
        else btn.removeAttribute('aria-pressed');

        if (btn._prtsClickHandler) {
            btn.removeEventListener('click', btn._prtsClickHandler);
            btn._prtsClickHandler = null;
        }
        if (typeof onClick === 'function') {
            btn._prtsClickHandler = onClick;
            btn.addEventListener('click', onClick);
        }

        const children = [];
        const iconEl = createPrtsIcon(icon);
        if (iconEl) children.push(iconEl);

        const label = document.createElement('span');
        label.className = 'bp4-button-text';
        label.textContent = text;
        children.push(label);

        btn.replaceChildren(...children);
        return btn;
    }

    function createPrtsSwitch({ label, checked, onChange, configKey, icon = null } = {}) {
        const item = document.createElement('div');
        item.className = 'prts-panel-item';

        const labelText = document.createElement('span');
        labelText.className = 'prts-panel-item-label';
        const iconEl = createPrtsIcon(icon);
        if (iconEl) labelText.appendChild(iconEl);
        const textEl = document.createElement('span');
        textEl.textContent = label || '';
        labelText.appendChild(textEl);

        const switchLabel = document.createElement('label');
        switchLabel.className = 'prts-switch';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = checked === true;
        if (configKey) input.dataset.prtsConfigKey = configKey;
        if (label) input.setAttribute('aria-label', label);
        input.onchange = event => {
            if (typeof onChange === 'function') onChange(event.target.checked);
        };

        const slider = document.createElement('span');
        slider.className = 'prts-slider';
        slider.setAttribute('aria-hidden', 'true');

        switchLabel.appendChild(input);
        switchLabel.appendChild(slider);
        item.appendChild(labelText);
        item.appendChild(switchLabel);
        return item;
    }

    function closePrtsModal(resolveValue = null) {
        if (prtsModalCleanup) {
            prtsModalCleanup(resolveValue);
            prtsModalCleanup = null;
            return;
        }

        document.getElementById('prts-modal')?.remove();
        document.getElementById('prts-modal-backdrop')?.remove();
    }

    function appendPrtsModalMessage(parent, message) {
        if (message instanceof Node) {
            parent.appendChild(message);
            return;
        }

        const messageEl = document.createElement('div');
        messageEl.className = 'prts-modal-message';
        messageEl.textContent = String(message || '');
        parent.appendChild(messageEl);
    }

    function showPrtsModal({
        title,
        message,
        confirmText = '确定',
        cancelText = '取消',
        tone = '',
        input = null
    } = {}) {
        return new Promise(resolve => {
            closePrtsModal(null);

            const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            const backdrop = document.createElement('div');
            backdrop.id = 'prts-modal-backdrop';

            const dialog = document.createElement('div');
            dialog.id = 'prts-modal';
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-modal', 'true');
            dialog.setAttribute('aria-labelledby', 'prts-modal-title');
            dialog.setAttribute('aria-describedby', 'prts-modal-message');

            const head = document.createElement('div');
            head.className = 'prts-modal-head';

            const titleEl = document.createElement('h2');
            titleEl.id = 'prts-modal-title';
            titleEl.className = 'prts-modal-title';
            titleEl.textContent = title || '';

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'prts-import-close';
            closeBtn.setAttribute('aria-label', '关闭窗口');
            closeBtn.appendChild(createPrtsIcon('close'));

            head.appendChild(titleEl);
            head.appendChild(closeBtn);

            const body = document.createElement('div');
            body.className = 'prts-modal-body';

            const messageWrap = document.createElement('div');
            messageWrap.id = 'prts-modal-message';
            appendPrtsModalMessage(messageWrap, message);
            body.appendChild(messageWrap);

            let inputEl = null;
            if (input) {
                const field = document.createElement('label');
                field.className = 'prts-modal-field';

                const fieldLabel = document.createElement('span');
                fieldLabel.className = 'prts-modal-field-label';
                fieldLabel.textContent = input.label || '';

                inputEl = document.createElement('input');
                inputEl.type = 'text';
                inputEl.className = 'prts-modal-input';
                inputEl.value = input.defaultValue || '';
                if (Number.isFinite(input.maxLength)) inputEl.maxLength = input.maxLength;

                field.appendChild(fieldLabel);
                field.appendChild(inputEl);
                body.appendChild(field);
            }

            const actions = document.createElement('div');
            actions.className = 'prts-modal-actions';

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'prts-import-action';
            cancelBtn.textContent = cancelText;

            const confirmBtn = document.createElement('button');
            confirmBtn.type = 'button';
            confirmBtn.className = `prts-import-action primary${tone ? ` ${tone}` : ''}`;
            confirmBtn.textContent = confirmText;

            actions.appendChild(cancelBtn);
            actions.appendChild(confirmBtn);

            dialog.appendChild(head);
            dialog.appendChild(body);
            dialog.appendChild(actions);
            backdrop.appendChild(dialog);

            const finish = value => closePrtsModal(value);
            const handleKeydown = event => {
                if (event.key === 'Escape') finish(null);
                if (event.key === 'Tab') {
                    const focusable = getFocusableDialogElements(dialog);
                    if (focusable.length === 0) return;
                    const first = focusable[0];
                    const last = focusable[focusable.length - 1];
                    if (event.shiftKey && document.activeElement === first) {
                        event.preventDefault();
                        last.focus();
                    } else if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
                if (event.key === 'Enter' && inputEl && document.activeElement === inputEl) {
                    event.preventDefault();
                    finish(inputEl.value);
                }
            };

            closeBtn.onclick = () => finish(null);
            cancelBtn.onclick = () => finish(null);
            confirmBtn.onclick = () => finish(inputEl ? inputEl.value : true);
            backdrop.addEventListener('click', event => {
                if (event.target === backdrop) finish(null);
            });
            document.addEventListener('keydown', handleKeydown, true);

            prtsModalCleanup = value => {
                document.removeEventListener('keydown', handleKeydown, true);
                backdrop.remove();
                if (previousFocus?.isConnected) previousFocus.focus();
                resolve(value);
            };

            document.body.appendChild(backdrop);
            window.setTimeout(() => (inputEl || confirmBtn).focus(), 0);
        });
    }

    function showPrtsConfirm(options = {}) {
        return showPrtsModal(options).then(value => value === true);
    }

    function showPrtsPrompt(options = {}) {
        return showPrtsModal({
            ...options,
            input: {
                label: options.inputLabel || '',
                defaultValue: options.defaultValue || '',
                maxLength: options.maxLength
            }
        }).then(value => (typeof value === 'string' ? value : null));
    }
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

    function getParsedOperationContent(operation) {
        let parsed = operation?.parsedContent;
        if (!parsed) {
            if (Array.isArray(operation?.opers) || Array.isArray(operation?.groups)) {
                parsed = operation;
            } else if (typeof operation?.content === 'string') {
                try { parsed = JSON.parse(operation.content); } catch(e) {}
            }
        }

        return {
            requiredOps: Array.isArray(parsed?.opers) ? parsed.opers : [],
            requiredGroups: Array.isArray(parsed?.groups) ? parsed.groups : []
        };
    }

    function hasNamedOperatorEntry(entry) {
        return typeof entry?.name === 'string' && entry.name.trim().length > 0;
    }

    function hasKnownOperatorEntry(entry) {
        return hasNamedOperatorEntry(entry) && Boolean(OP_ID_MAP[entry.name.trim()]);
    }

    function hasGroupEntry(group) {
        return hasNamedOperatorEntry(group) ||
            (Array.isArray(group?.opers) && group.opers.some(hasNamedOperatorEntry));
    }

    function hasKnownGroupCandidate(group) {
        return Array.isArray(group?.opers) && group.opers.some(hasKnownOperatorEntry);
    }

    function hasEffectiveOperationData(operation) {
        if (!operation || typeof operation !== 'object') return false;

        const { requiredOps, requiredGroups } = getParsedOperationContent(operation);
        if (operation._isFallback) {
            return requiredOps.some(hasKnownOperatorEntry) || requiredGroups.some(hasKnownGroupCandidate);
        }
        return requiredOps.some(hasNamedOperatorEntry) || requiredGroups.some(hasGroupEntry);
    }

    /**
     * 干员与干员组的可用性判定
     */
    function checkOperationAvailability(operation, ownedOpsSet, filterMode) {
        if (!ownedOpsSet || ownedOpsSet.size === 0 || filterMode === 'NONE') {
            return { isAvailable: true, missingCount: 0, missingOps:[] };
        }

        const { requiredOps, requiredGroups } = getParsedOperationContent(operation);

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

    function getCurrentAccountState() {
        return createAccountState({ activeAccountId, accountsData, accountMeta });
    }

    function publishAccountState(value) {
        const state = createAccountState(value);
        activeAccountId = state.activeAccountId;
        accountsData = state.accountsData;
        accountMeta = state.accountMeta;
        ownedOpsSet = new Set(accountsData[activeAccountId] || []);
        return state;
    }

    function commitAccountState(value) {
        const state = createAccountState(value);
        GM_setValue(ACCOUNTS_DATA_KEY, serializeAccountState(state));
        return publishAccountState(state);
    }

    function readAccountStorageSnapshot() {
        const legacyAccounts = {};
        ACCOUNT_IDS.forEach(id => {
            legacyAccounts[id] = GM_getValue(`prts_plus_user_ops_${id}`);
        });
        return {
            unifiedStore: GM_getValue(ACCOUNTS_DATA_KEY),
            legacyAccounts,
            legacyActiveAccountId: GM_getValue('prts_plus_active_account'),
            veryOldStore: GM_getValue('prts_plus_user_ops'),
            legacySklandSummary: GM_getValue(SKLAND_LAST_IMPORT_KEY)
        };
    }

    function reportAccountStateDiagnostics(diagnostics) {
        diagnostics.forEach(diagnostic => {
            console.warn('[Better PRTS] 账户数据兼容诊断', diagnostic.code, diagnostic.source);
        });
    }

    /**
     * 加载干员数据：具备高级的向下兼容与数据迁移能力
     */
    function loadOwnedOps() {
        currentFilterMode = normalizeFilterMode(currentFilterMode);
        displayMode = normalizeDisplayMode(displayMode);
        const resolved = resolveStoredAccountState(readAccountStorageSnapshot());
        reportAccountStateDiagnostics(resolved.diagnostics);
        if (resolved.migrated) {
            commitAccountState(resolved.state);
        } else {
            publishAccountState(resolved.state);
        }
        console.log(`[Better PRTS] 已加载账号 ${activeAccountId} 的 ${ownedOpsSet.size} 名持有干员`);
    }

    /**
     * 执行账号切换
     */
    function switchAccount(id) {
        id = normalizeAccountId(id);
        if (id === activeAccountId) return;

        commitAccountState(createAccountSwitchState(getCurrentAccountState(), id));

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
        refreshAccountControls();

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

    function refreshAccountControls() {
        document.querySelectorAll('.prts-acc-btn').forEach(btn => {
            const id = normalizeAccountId(btn.dataset.id);
            const label = getAccountLabel(id);
            btn.textContent = `${label} (${getAccountOperatorCount(id)})`;
            btn.title = formatAccountSklandTitle(id);
            btn.classList.toggle('active', id === activeAccountId);

            const syncMetaEl = btn.closest('.prts-account-row')?.querySelector('.prts-account-sync-meta');
            if (syncMetaEl) {
                const syncText = formatSklandSyncSummary(getAccountSklandSyncMeta(id));
                syncMetaEl.textContent = syncText;
                syncMetaEl.classList.toggle('is-visible', Boolean(syncText));
            }
        });

        document.querySelectorAll('[data-prts-config-key]').forEach(input => {
            const key = input.dataset.prtsConfigKey;
            if (key && Object.prototype.hasOwnProperty.call(CONFIG, key)) {
                input.checked = CONFIG[key] === true;
            }
        });
    }

    function refreshAccountStateUi(forceFilterUpdate = false) {
        const bar = document.getElementById('prts-filter-bar');
        if (bar) bar.remove();
        injectFilterControls();
        refreshAccountControls();
        applyFloatingPositionToContainer();
        applySidebarCollapse();
        if (forceFilterUpdate || currentFilterMode !== 'NONE') requestFilterUpdate();
    }

    async function renameAccount(id) {
        const accountId = normalizeAccountId(id);
        const currentLabel = getAccountLabel(accountId);
        const rawLabel = await showPrtsPrompt({
            title: `重命名账号 ${accountId}`,
            message: '输入新的账号昵称，留空会恢复默认名称。',
            inputLabel: '账号昵称',
            defaultValue: currentLabel,
            maxLength: ACCOUNT_LABEL_MAX_LENGTH,
            confirmText: '保存',
            cancelText: '取消'
        });
        if (rawLabel === null) return;

        commitAccountState(createRenamedAccountState(getCurrentAccountState(), accountId, rawLabel));
        refreshAccountStateUi();
        showPrtsToast('账号名称已更新', 'success', `${getAccountLabel(accountId)} / ${getAccountOperatorCount(accountId)} 名干员`);
    }

    function getAccountSklandSyncMeta(id) {
        const accountId = normalizeAccountId(id);
        return normalizeSklandSyncMeta(accountMeta?.[accountId]?.skland);
    }

    function getAccountSklandImportSummary(id) {
        const accountId = normalizeAccountId(id);
        const skland = getAccountSklandSyncMeta(accountId);
        if (!skland) return null;

        return {
            accountId,
            accountLabel: getAccountLabel(accountId),
            ...skland
        };
    }

    function formatAccountSklandTitle(id) {
        const accountId = normalizeAccountId(id);
        const label = getAccountLabel(accountId);
        const lines = [
            `切换到 ${label}`,
            `${getAccountOperatorCount(accountId)} 名干员`
        ];
        const skland = getAccountSklandSyncMeta(accountId);
        const sklandSummary = formatSklandSyncSummary(skland, { includeDetail: true });
        if (sklandSummary) lines.push(sklandSummary);
        return lines.join('\n');
    }

    function getBackupPreferences() {
        return {
            filterMode: normalizeFilterMode(currentFilterMode),
            displayMode: normalizeDisplayMode(displayMode),
            config: {
                visuals: CONFIG.visuals === true,
                cleanLink: CONFIG.cleanLink === true,
                hideSidebar: CONFIG.hideSidebar === true
            },
            floatingPosition: parseFloatingPosition(GM_getValue('prts_float_pos', '{"top":"40%","isRight":true}'))
        };
    }

    function buildAccountsBackup() {
        const state = getCurrentAccountState();

        return {
            type: ACCOUNT_BACKUP_TYPE,
            version: ACCOUNT_BACKUP_VERSION,
            exportedAt: new Date().toISOString(),
            activeAccountId: state.activeAccountId,
            accountsData: state.accountsData,
            accountMeta: state.accountMeta,
            preferences: getBackupPreferences()
        };
    }

    function formatBackupTimestamp(date) {
        const pad = value => String(value).padStart(2, '0');
        return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate())
        ].join('') + '-' + [
            pad(date.getHours()),
            pad(date.getMinutes()),
            pad(date.getSeconds())
        ].join('');
    }

    function downloadJsonFile(fileName, payload) {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    function handleExportAccountsBackup() {
        try {
            const backup = buildAccountsBackup();
            const fileName = `better-prts-plus-backup-${formatBackupTimestamp(new Date())}.json`;
            downloadJsonFile(fileName, backup);
            showPrtsToast('已导出全部配置', 'success', fileName);
        } catch (error) {
            console.error('[Better PRTS] 导出全部配置失败', error);
            showPrtsToast('导出全部配置失败', 'error', error instanceof Error ? error.message : '未知错误');
        }
    }

    function normalizeBackupPreferences(value) {
        const raw = isPlainRecord(value) ? value : {};
        const rawConfig = isPlainRecord(raw.config) ? raw.config : {};
        return {
            filterMode: normalizeFilterMode(raw.filterMode),
            displayMode: normalizeDisplayMode(raw.displayMode),
            config: {
                visuals: rawConfig.visuals !== false,
                cleanLink: rawConfig.cleanLink !== false,
                hideSidebar: rawConfig.hideSidebar === true
            },
            floatingPosition: parseFloatingPosition(raw.floatingPosition)
        };
    }

    function parseAccountsBackup(value) {
        if (Array.isArray(value)) {
            throw new Error('这看起来是单账号干员列表，请使用“导入干员数据”。');
        }
        if (!isPlainRecord(value)) {
            throw new Error('这不是有效的 Better-PRTS-Plus 全部配置备份。');
        }
        if (value.type !== ACCOUNT_BACKUP_TYPE || value.version !== ACCOUNT_BACKUP_VERSION) {
            throw new Error('备份格式不匹配，请选择 Better-PRTS-Plus 导出的全部配置文件。');
        }

        return {
            activeAccountId: normalizeAccountId(value.activeAccountId),
            accountsData: normalizeAccountsData(value.accountsData),
            accountMeta: normalizeAccountMeta(value.accountMeta),
            preferences: normalizeBackupPreferences(value.preferences)
        };
    }

    function formatAccountsBackupSummary(backup) {
        const lines = [
            '将覆盖当前 3 个账号、账号昵称和 UI 偏好。',
            `导入后当前账号: ${backup.accountMeta[backup.activeAccountId].label}`,
            ''
        ];

        ACCOUNT_IDS.forEach(id => {
            lines.push(`${backup.accountMeta[id].label}: ${backup.accountsData[id].length} 名干员`);
        });
        lines.push('');
        lines.push('确认继续导入？');
        return lines.join('\n');
    }

    function applyFloatingPositionToContainer() {
        const container = document.getElementById('prts-float-container');
        if (!container) return;

        const savedPos = parseFloatingPosition(GM_getValue('prts_float_pos', '{"top":"40%","isRight":true}'));
        container.style.top = savedPos.top;
        if (savedPos.isRight) {
            container.style.left = 'auto';
            container.style.right = '0px';
            container.classList.add('snap-right');
            container.classList.remove('snap-left');
        } else {
            container.style.left = '0px';
            container.style.right = 'auto';
            container.classList.add('snap-left');
            container.classList.remove('snap-right');
        }
    }

    function applyAccountsBackup(backup) {
        const nextState = createAccountState(backup);
        currentFilterMode = normalizeFilterMode(backup.preferences.filterMode);
        displayMode = normalizeDisplayMode(backup.preferences.displayMode);
        CONFIG.visuals = backup.preferences.config.visuals === true;
        CONFIG.cleanLink = backup.preferences.config.cleanLink === true;
        CONFIG.hideSidebar = backup.preferences.config.hideSidebar === true;

        commitAccountState(nextState);
        GM_setValue(FILTER_MODE_KEY, currentFilterMode);
        GM_setValue(DISPLAY_MODE_KEY, displayMode);
        saveConfig();
        GM_setValue('prts_float_pos', JSON.stringify(backup.preferences.floatingPosition));

        refreshAccountStateUi(true);
    }

    function handleImportAccountsBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > ACCOUNT_BACKUP_MAX_BYTES) {
                showPrtsToast('配置文件过大', 'error', '请选择 Better-PRTS-Plus 导出的备份文件。');
                return;
            }

            const reader = new FileReader();
            reader.onload = async event => {
                try {
                    const parsed = safeJsonParse(event.target.result, null);
                    const backup = parseAccountsBackup(parsed);
                    const confirmed = await showPrtsConfirm({
                        title: '导入全部配置',
                        message: formatAccountsBackupSummary(backup),
                        confirmText: '确认导入',
                        cancelText: '取消',
                        tone: 'danger'
                    });
                    if (!confirmed) return;

                    applyAccountsBackup(backup);
                    showPrtsToast('全部配置导入成功', 'success', `${getAccountLabel(activeAccountId)} 已切换为当前账号。`);
                } catch (error) {
                    console.error('[Better PRTS] 导入全部配置失败', error);
                    showPrtsToast('导入全部配置失败', 'error', error instanceof Error ? error.message : '未知错误');
                }
            };
            reader.onerror = () => {
                showPrtsToast('导入全部配置失败', 'error', reader.error?.message || '无法读取文件，请重试。');
            };
            reader.readAsText(file);
        };
        input.click();
    }
    // =========================================================================
    //                            MODULE 5: 业务逻辑 - 筛选、折叠与净化
    // =========================================================================

    function isFilterDisabledPage() {
        const path = window.location.pathname;
        return path.startsWith('/create') || path.startsWith('/editor');
    }

    function getImportErrorMessage(error) {
        return error instanceof Error ? error.message : '未知错误';
    }

    function getOperatorImportDiff(previousNames, nextNames) {
        const previousSet = new Set(sanitizeOperatorNames(previousNames));
        const nextSet = new Set(sanitizeOperatorNames(nextNames));
        let added = 0;
        let removed = 0;

        nextSet.forEach(name => {
            if (!previousSet.has(name)) added += 1;
        });
        previousSet.forEach(name => {
            if (!nextSet.has(name)) removed += 1;
        });

        return { added, removed, total: nextSet.size };
    }

    function formatOperatorImportDiff(diff) {
        return `新增 ${diff.added} / 移除 ${diff.removed} / 当前 ${diff.total}`;
    }

    function setOperatorImportStatus(statusEl, message, type = '') {
        if (!statusEl) return;

        const statusType = ['loading', 'success', 'warning', 'error'].includes(type) ? type : '';
        statusEl.className = `prts-import-status${statusType ? ` ${statusType}` : ''}`;
        statusEl.textContent = message;
        statusEl.setAttribute('role', statusType === 'error' ? 'alert' : 'status');
        statusEl.setAttribute('aria-live', statusType === 'error' ? 'assertive' : 'polite');
    }

    function closeOperatorImportDialog() {
        if (operatorImportDialogCleanup) {
            operatorImportDialogCleanup();
            operatorImportDialogCleanup = null;
            return;
        }

        document.getElementById('prts-import-dialog')?.remove();
        document.getElementById('prts-import-dialog-backdrop')?.remove();
    }

    function applyImportedOperatorNames(names, sourceLabel, statusEl) {
        const sanitizedNames = sanitizeOperatorNames(names);
        if (sanitizedNames.length === 0) {
            const message = '未能识别有效的干员数据，请检查 JSON/TXT 内容。';
            setOperatorImportStatus(statusEl, message, 'warning');
            showPrtsToast('未能识别有效的干员数据', 'warning', '请检查文件或粘贴内容后重试。');
            return false;
        }

        const accountLabel = getAccountLabel(activeAccountId);
        const diff = getOperatorImportDiff(accountsData[activeAccountId] || [], sanitizedNames);
        const diffText = formatOperatorImportDiff(diff);
        const sourceText = sourceLabel ? `来源：${sourceLabel}` : '来源：导入内容';

        const nextState = getCurrentAccountState();
        nextState.accountsData[nextState.activeAccountId] = sanitizedNames;
        commitAccountState(nextState);
        refreshAccountStateUi();

        const message = `${accountLabel} 导入成功`;
        const detail = `${diffText}\n${sourceText}`;
        setOperatorImportStatus(statusEl, `${message}\n${detail}`, 'success');
        showPrtsToast(message, 'success', detail);
        return true;
    }

    function readOperatorImportFile(file, statusEl) {
        if (!file) return Promise.resolve(false);

        if (file.size > OPERATOR_IMPORT_MAX_BYTES) {
            const message = '文件过大，请上传标准格式的干员数据文件。';
            setOperatorImportStatus(statusEl, message, 'error');
            showPrtsToast('导入失败', 'error', message);
            return Promise.resolve(false);
        }

        setOperatorImportStatus(statusEl, `正在读取 ${file.name || '导入文件'}...`, 'loading');
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const names = parseImportedOperatorNames(event.target.result, file.name);
                    resolve(applyImportedOperatorNames(names, file.name || '文件导入', statusEl));
                } catch (error) {
                    const message = getImportErrorMessage(error);
                    console.error('[Better PRTS] 导入干员数据失败', error);
                    setOperatorImportStatus(statusEl, `导入失败：${message}`, 'error');
                    showPrtsToast('导入失败', 'error', message);
                    resolve(false);
                }
            };
            reader.onerror = () => {
                const message = reader.error?.message || '无法读取文件，请重试。';
                setOperatorImportStatus(statusEl, `导入失败：${message}`, 'error');
                showPrtsToast('导入失败', 'error', message);
                resolve(false);
            };
            reader.readAsText(file);
        });
    }

    function openOperatorImportDialog() {
        const existingDialog = document.getElementById('prts-import-dialog');
        if (existingDialog) {
            existingDialog.querySelector('.prts-import-textarea')?.focus();
            return;
        }

        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const backdrop = document.createElement('div');
        backdrop.id = 'prts-import-dialog-backdrop';

        const dialog = document.createElement('div');
        dialog.id = 'prts-import-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'prts-import-dialog-title');
        dialog.setAttribute('aria-describedby', 'prts-import-dialog-help');

        const head = document.createElement('div');
        head.className = 'prts-import-head';

        const headingWrap = document.createElement('div');
        const title = document.createElement('h2');
        title.id = 'prts-import-dialog-title';
        title.className = 'prts-import-title';
        title.textContent = `导入到 ${getAccountLabel(activeAccountId)}`;
        const subtitle = document.createElement('p');
        subtitle.className = 'prts-import-subtitle';
        subtitle.textContent = '选择文件或粘贴 JSON/TXT 文本，导入后会替换当前账号的干员列表。';
        headingWrap.appendChild(title);
        headingWrap.appendChild(subtitle);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'prts-import-close';
        closeBtn.setAttribute('aria-label', '关闭导入窗口');
        closeBtn.appendChild(createPrtsIcon('close'));
        closeBtn.onclick = closeOperatorImportDialog;

        head.appendChild(headingWrap);
        head.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'prts-import-body';

        const label = document.createElement('label');
        label.className = 'prts-import-label';
        label.htmlFor = 'prts-import-textarea';
        label.textContent = '粘贴干员数据';

        const textarea = document.createElement('textarea');
        textarea.id = 'prts-import-textarea';
        textarea.className = 'prts-import-textarea';
        textarea.spellcheck = false;
        textarea.placeholder = '例如：每行一个干员名称，或粘贴 MAA 导出的 JSON 内容';

        const help = document.createElement('p');
        help.id = 'prts-import-dialog-help';
        help.className = 'prts-import-help';
        help.textContent = 'TXT 支持每行一个干员名，空行、# 和 // 开头的行会被忽略。';

        const actions = document.createElement('div');
        actions.className = 'prts-import-actions';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.txt,application/json,text/plain';
        fileInput.hidden = true;

        const fileBtn = document.createElement('button');
        fileBtn.type = 'button';
        fileBtn.className = 'prts-import-action';
        fileBtn.textContent = '选择文件';
        fileBtn.onclick = () => fileInput.click();

        const pasteBtn = document.createElement('button');
        pasteBtn.type = 'button';
        pasteBtn.className = 'prts-import-action primary';
        pasteBtn.textContent = '导入粘贴内容';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'prts-import-action';
        cancelBtn.textContent = '取消';
        cancelBtn.onclick = closeOperatorImportDialog;

        const status = document.createElement('div');
        status.className = 'prts-import-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.textContent = '请选择文件，或在文本框粘贴干员数据后导入。';

        const setBusy = busy => {
            fileBtn.disabled = busy;
            pasteBtn.disabled = busy;
        };

        fileInput.onchange = async event => {
            const file = event.target.files?.[0];
            if (!file) return;
            setBusy(true);
            const imported = await readOperatorImportFile(file, status);
            setBusy(false);
            fileInput.value = '';
            if (imported) window.setTimeout(closeOperatorImportDialog, 700);
        };

        pasteBtn.onclick = () => {
            const rawText = textarea.value;
            if (!rawText.trim()) {
                const message = '请先粘贴 JSON 或逐行干员名称。';
                setOperatorImportStatus(status, message, 'error');
                showPrtsToast('无法导入空内容', 'error', message);
                textarea.focus();
                return;
            }

            try {
                const names = parseImportedOperatorNames(rawText, '');
                const imported = applyImportedOperatorNames(names, '粘贴内容', status);
                if (imported) window.setTimeout(closeOperatorImportDialog, 700);
            } catch (error) {
                const message = getImportErrorMessage(error);
                console.error('[Better PRTS] 粘贴导入干员数据失败', error);
                setOperatorImportStatus(status, `导入失败：${message}`, 'error');
                showPrtsToast('导入失败', 'error', message);
            }
        };

        actions.appendChild(fileBtn);
        actions.appendChild(pasteBtn);
        actions.appendChild(cancelBtn);

        body.appendChild(label);
        body.appendChild(textarea);
        body.appendChild(help);
        body.appendChild(actions);
        body.appendChild(fileInput);
        body.appendChild(status);

        dialog.appendChild(head);
        dialog.appendChild(body);
        backdrop.appendChild(dialog);

        backdrop.addEventListener('click', event => {
            if (event.target === backdrop) closeOperatorImportDialog();
        });

        const handleKeydown = event => {
            if (event.key === 'Escape') closeOperatorImportDialog();
            if (event.key === 'Tab') {
                const focusable = getFocusableDialogElements(dialog);
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', handleKeydown, true);
        operatorImportDialogCleanup = () => {
            document.removeEventListener('keydown', handleKeydown, true);
            backdrop.remove();
            if (previousFocus?.isConnected) previousFocus.focus();
        };

        document.body.appendChild(backdrop);
        textarea.focus();
    }

    function handleImport() {
        openOperatorImportDialog();
    }

    function handleOpenSklandImport() {
        let opened = null;
        try {
            opened = window.open(SKLAND_HOME_URL, '_blank');
            if (opened) opened.opener = null;
        } catch (error) {
            opened = null;
        }
        showPrtsToast(
            opened ? '已打开森空岛页面' : '已尝试打开森空岛页面',
            opened ? 'success' : 'warning',
            opened
                ? '请在森空岛网页登录后，使用页面右侧的 Better-PRTS-Plus 导入面板读取干员数据。'
                : '如果没有看到新窗口，请手动打开 https://www.skland.com/index 登录后使用 Better-PRTS-Plus 导入面板。'
        );
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
            showPrtsToast('请先导入干员数据', 'warning', `当前账号：${getAccountLabel(activeAccountId)}`);
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
        perfectBtn.setAttribute('aria-pressed', currentFilterMode === 'PERFECT' ? 'true' : 'false');
        supportBtn.setAttribute('aria-pressed', currentFilterMode === 'SUPPORT' ? 'true' : 'false');

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
        controlBar.setAttribute('role', 'toolbar');
        controlBar.setAttribute('aria-label', 'Better-PRTS-Plus 筛选工具栏');

        if (searchRow.nextElementSibling !== controlBar) {
            searchRow.parentNode.insertBefore(controlBar, searchRow.nextElementSibling);
        }

        let mainRow = document.getElementById('prts-filter-main-row');
        if (!mainRow) {
            mainRow = document.createElement('div');
            mainRow.id = 'prts-filter-main-row';
        }
        mainRow.className = 'prts-filter-main-row';
        controlBar.appendChild(mainRow);

        let syncRow = document.getElementById('prts-filter-sync-row');
        if (!syncRow) {
            syncRow = document.createElement('div');
            syncRow.id = 'prts-filter-sync-row';
        }
        syncRow.className = 'prts-filter-sync-row';
        controlBar.appendChild(syncRow);

        const paths = {
            import: 'M11 6h3l-6 6-6-6h3V1h6v5zm-9 8v2h12v-2h-2v1H4v-1H2z',
            eyeOn: 'M8 3C3 3 0 8 0 8s3 5 8 5 8-5 8-5-3-5-8-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z M8 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
            eyeOff: 'M6.41 7.83c-.03.39.07.79.31 1.12.24.34.59.58.98.68.39.1.81.02 1.15-.21.34-.23.59-.57.7-.96.1-.39.02-.8-.21-1.15-.16-.23-.38-.42-.64-.53L6.41 7.83z M2.05 2.64L1.03 3.66l2.54 2.54C2.22 6.75 1.12 7.34 0 8c0 0 4 5.6 8 5.6 1.41 0 2.71-.35 3.85-.96l2.08 2.09 1.02-1.02L2.05 2.64z M8 12c-2.21 0-4-1.79-4-4 0-.2.02-.39.05-.58l5.04 5.04c-1.24.74-3.46.59-1.09-.46z M13.57 11.6c.54-1.06.83-2.24.83-3.6 0 0-4-5.6-8-5.6-.69 0-1.34.09-1.98.25L6.07 4.3C6.68 4.1 7.33 4 8 4c2.21 0 4 1.79 4 4 0 .64-.14 1.24-.38 1.79l1.95 1.81z',
            perfect: 'M13.76 3.84l-7.2 7.2L3.04 7.52 1.6 8.96l5.04 5.04 8.64-8.64z',
            support: 'M12 6.4c0-1.77-1.43-3.2-3.2-3.2S5.6 4.63 5.6 6.4s1.43 3.2 3.2 3.2 3.2-1.43 3.2-3.2zm-3.2 1.6c-.88 0-1.6-.72-1.6-1.6s.72-1.6 1.6-1.6 1.6.72 1.6 1.6-.72 1.6-1.6 1.6zm3.2-1.6c0-1.77-1.43-3.2-3.2-3.2-.45 0-.86.1-1.26.26.7.74 1.15 1.72 1.24 2.82.02.21.02.41 0 .62-.1 1.04-.51 1.98-1.16 2.71.37.13.75.19 1.18.19 1.77.01 3.2-1.42 3.2-3.4zM8.8 10.4H2.4c-.88 0-1.6.72-1.6 1.6v2.4h9.6V12c0-.88-.72-1.6-1.6-1.6zm-5.6 2.4h4.8v.8H3.2v-.8zm12-1.6h-4.8c.21 0 .4.03.59.07.67.15 1.29.44 1.81.85.91.71 1.5 1.81 1.57 3.04.01.1.01.18.03.28V12c0-.88-.72-1.6-1.6-1.6z',
            user: 'M8 8c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0 1c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
            sidebarToggle: 'M14 3H2c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zm-1 9H9V4h4v8zM3 4h4v8H3V4z',
            skland: 'skland'
        };

        // 顺序生成元素

        // (1) 账号循环切换按钮
        const btnAccountText = getAccountLabel(activeAccountId);
        const btnAccount = createPrtsButton({ id: 'btn-account', text: btnAccountText, icon: 'account', ariaLabel: `当前账号 ${btnAccountText}，点击切换账号`, onClick: cycleAccount });
        mainRow.appendChild(btnAccount);

        const activeSklandSync = getAccountSklandSyncMeta(activeAccountId);
        let accountSyncChip = document.getElementById('prts-account-sync-chip');
        if (activeSklandSync) {
            if (!accountSyncChip) {
                accountSyncChip = document.createElement('span');
                accountSyncChip.id = 'prts-account-sync-chip';
                accountSyncChip.className = 'prts-account-sync-chip';
            }
            accountSyncChip.textContent = formatSklandSyncSummary(activeSklandSync, { compact: true });
            accountSyncChip.title = formatSklandSyncSummary(activeSklandSync, { includeDetail: true });
            syncRow.appendChild(accountSyncChip);
        } else if (accountSyncChip) {
            accountSyncChip.remove();
        }

        // (2) 导入按钮
        const importText = ownedOpsSet.size > 0 ? `导入干员 (${ownedOpsSet.size})` : '导入干员';
        const btnImport = createPrtsButton({ id: 'btn-import', text: importText, icon: 'import', ariaLabel: importText, onClick: handleImport });
        mainRow.appendChild(btnImport);

        const btnSklandImport = createPrtsButton({ id: 'btn-skland-import', text: '森空岛导入', icon: 'skland', onClick: handleOpenSklandImport });
        mainRow.appendChild(btnSklandImport);

        // (3) 模式切换
        const displayModeText = displayMode === 'GRAY' ? '置灰模式' : '隐藏模式';
        const displayModeIcon = displayMode === 'GRAY' ? 'eyeOn' : 'eyeOff';
        const btnSetting = createPrtsButton({ id: 'btn-setting', text: displayModeText, icon: displayModeIcon, pressed: displayMode === 'HIDE', ariaLabel: `当前为${displayModeText}，点击切换显示模式`, onClick: toggleDisplayMode });
        mainRow.appendChild(btnSetting);

        // (4) 分割线
        let divider = document.getElementById('prts-divider-el');
        if (!divider) {
            divider = document.createElement('div');
            divider.className = 'prts-divider';
            divider.id = 'prts-divider-el';
        }
        mainRow.appendChild(divider);

        // (5) 完美阵容
        const btnPerfect = createPrtsButton({
            id: 'btn-perfect',
            text: '完美阵容',
            icon: 'check',
            onClick: () => toggleFilter('PERFECT'),
            active: currentFilterMode === 'PERFECT',
            pressed: currentFilterMode === 'PERFECT'
        });
        mainRow.appendChild(btnPerfect);

        // (6) 允许助战
        const btnSupport = createPrtsButton({
            id: 'btn-support',
            text: '允许助战',
            icon: 'support',
            onClick: () => toggleFilter('SUPPORT'),
            active: currentFilterMode === 'SUPPORT',
            pressed: currentFilterMode === 'SUPPORT'
        });
        mainRow.appendChild(btnSupport);

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
        descContainer.tabIndex = 0;
        descContainer.setAttribute('aria-label', '作业描述');

        if (videoUrl) {
            const btnContainer = document.createElement('div');
            btnContainer.className = 'prts-video-box';

            const linkBtn = document.createElement('a');
            linkBtn.href = videoUrl;
            linkBtn.target = "_blank";
            linkBtn.rel = "noopener noreferrer";
            linkBtn.className = 'prts-bili-link';
            linkBtn.setAttribute('aria-label', '打开参考视频');
            linkBtn.appendChild(createPrtsIcon('video'));
            linkBtn.appendChild(document.createTextNode('参考视频'));
            linkBtn.onclick = (e) => e.stopPropagation();

            btnContainer.appendChild(linkBtn);
            if (descContainer.parentNode) {
                descContainer.parentNode.insertBefore(btnContainer, descContainer.nextSibling);
            }
        }

        descContainer.dataset.biliProcessed = "true";
    }

    function getOperationCards() {
        return Array.from(document.querySelectorAll('ul.grid > li, .tabular-nums ul > li'));
    }

    function getCardFromMutationNode(node) {
        const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
        if (!element) return null;
        if (element.matches?.('ul.grid > li, .tabular-nums ul > li')) return element;
        return element.closest?.('ul.grid > li, .tabular-nums ul > li') || null;
    }

    const filterUpdateCoordinator = createFilterUpdateCoordinator({
        requestFrame: callback => requestAnimationFrame(callback),
        cancelFrame: id => cancelAnimationFrame(id),
        setDelay: (callback, delay) => setTimeout(callback, delay),
        clearDelay: id => clearTimeout(id),
        run: () => applyFilterLogic()
    });

    function requestFilterUpdate(options = {}) {
        filterUpdateCoordinator.request(options);
    }

    function scheduleFilterUpdate(delay = 80, options = {}) {
        if (isFilterDisabledPage()) {
            filterUpdateCoordinator.reset();
            return;
        }
        filterUpdateCoordinator.schedule(delay, options);
    }

    function syncPageScaffold() {
        applySidebarCollapse();
        optimizeDialogContent();
        createFloatingBall();
        injectFilterControls();
        if (isFilterDisabledPage()) {
            setCompatibilityDiagnostics({ totalCards: 0, fiberCards: 0, fallbackCards: 0, noDataCards: 0 });
        } else {
            renderCompatibilityDiagnosticsPanel();
        }
    }

    function getRouteKey() {
        return `${window.location.pathname}${window.location.search}`;
    }

    function createCompatibilityDiagnostics(totalCards = 0, fiberCards = 0, fallbackCards = 0, noDataCards = 0) {
        return {
            route: getRouteKey(),
            totalCards,
            fiberCards,
            fallbackCards,
            noDataCards,
            updatedAt: new Date().toISOString()
        };
    }

    let compatibilityDiagnostics = createCompatibilityDiagnostics();

    function getCompatibilityDiagnostics() {
        return { ...compatibilityDiagnostics };
    }

    function setCompatibilityDiagnostics(stats) {
        compatibilityDiagnostics = createCompatibilityDiagnostics(
            Number(stats?.totalCards) || 0,
            Number(stats?.fiberCards) || 0,
            Number(stats?.fallbackCards) || 0,
            Number(stats?.noDataCards) || 0
        );
        renderCompatibilityDiagnosticsPanel();
    }

    function removeCompatibilityDiagnosticsPanel() {
        document.getElementById('prts-compat-debug-panel')?.remove();
    }

    function renderCompatibilityDiagnosticsPanel() {
        if (!CONFIG.compatDebug || isFilterDisabledPage()) {
            removeCompatibilityDiagnosticsPanel();
            return;
        }
        if (!document.body) return;

        let panel = document.getElementById('prts-compat-debug-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'prts-compat-debug-panel';
            panel.setAttribute('role', 'status');
            panel.setAttribute('aria-live', 'polite');

            const title = document.createElement('div');
            title.className = 'prts-compat-debug-title';
            title.textContent = '兼容诊断';

            const summary = document.createElement('div');
            summary.className = 'prts-compat-debug-summary';

            const meta = document.createElement('div');
            meta.className = 'prts-compat-debug-meta';

            panel.appendChild(title);
            panel.appendChild(summary);
            panel.appendChild(meta);
            document.body.appendChild(panel);
        }

        const diagnostics = getCompatibilityDiagnostics();
        const summary = panel.querySelector('.prts-compat-debug-summary');
        const meta = panel.querySelector('.prts-compat-debug-meta');
        const timeText = diagnostics.updatedAt ? new Date(diagnostics.updatedAt).toLocaleTimeString() : '未刷新';

        if (summary) {
            summary.textContent = `卡片 ${diagnostics.totalCards} · Fiber ${diagnostics.fiberCards} · fallback ${diagnostics.fallbackCards} · 无有效数据 ${diagnostics.noDataCards}`;
        }
        if (meta) {
            meta.textContent = `${diagnostics.route || '/'} · ${timeText}`;
        }
    }

    betterPrtsDebug.getCompatibilityDiagnostics = getCompatibilityDiagnostics;
    window.BetterPRTSPlusDebug = betterPrtsDebug;

    function handleRouteChange() {
        const routeKey = getRouteKey();
        if (routeKey === lastRouteKey) return false;

        lastRouteKey = routeKey;
        filterUpdateCoordinator.reset();
        syncPageScaffold();
        scheduleFilterUpdate(120);
        return true;
    }

    function isScriptOwnedNode(node) {
        if (!node || node.nodeType !== 1) return false;
        return Boolean(node.closest?.('#prts-filter-bar, #prts-float-container, #prts-toast-container, #prts-import-dialog, #prts-import-dialog-backdrop, #prts-modal, #prts-modal-backdrop, #prts-compat-debug-panel, .prts-import-status, .prts-status-label'));
    }

    function collectDirtyCardsFromMutations(mutations) {
        const dirtyCards = new Set();
        for (const mutation of mutations) {
            if (isScriptOwnedNode(mutation.target)) continue;

            const targetCard = getCardFromMutationNode(mutation.target);
            if (targetCard) dirtyCards.add(targetCard);

            const changedNodes = Array.from(mutation.addedNodes || []).concat(Array.from(mutation.removedNodes || []));
            changedNodes.forEach(node => {
                if (isScriptOwnedNode(node)) return;
                const card = getCardFromMutationNode(node);
                if (card) dirtyCards.add(card);
                if (node?.nodeType === Node.ELEMENT_NODE) {
                    node.querySelectorAll?.('ul.grid > li, .tabular-nums ul > li').forEach(childCard => dirtyCards.add(childCard));
                }
            });
        }
        return dirtyCards;
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
                        img.alt = nameKey;
                        newItem.title = `${nameKey}${extraInfo ? ' ' + extraInfo : ''}`;
                        newItem.setAttribute('aria-label', newItem.title);
                        newItem.appendChild(img);
                    } else if (nameKey.length > 0) {
                        reportUnknownOperatorName(nameKey, { source: 'card', example: cleanText });
                        newItem = document.createElement('div');
                        newItem.className = 'prts-op-text';
                        newItem.innerText = nameKey;
                        newItem.title = `${nameKey}${extraInfo ? ' ' + extraInfo : ''}`;
                        newItem.setAttribute('aria-label', newItem.title);
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
                        if (!interactiveWrapper.hasAttribute('tabindex')) interactiveWrapper.tabIndex = 0;
                        interactiveWrapper.title = `${nameKey}${extraInfo ? ' ' + extraInfo : ''}`;
                        interactiveWrapper.setAttribute('aria-label', interactiveWrapper.title);
                        grid.appendChild(interactiveWrapper);
                interactiveWrapper.replaceChildren();
                        interactiveWrapper.appendChild(newItem);
                    } else {
                        const tooltipText = `${nameKey}${extraInfo ? ' ' + extraInfo : ''}`;
                        newItem.setAttribute('data-prts-tooltip', tooltipText);
                        newItem.tabIndex = 0;
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
        const hasOperatorSeparator = text.includes(',') || text.includes('，');

        if (!text.startsWith('->') && !hasOperatorSeparator && !isSingleOperator) return;

        const rawList = cleanText.split(/[,，]\s*/);
        const validOps =[];

        rawList.forEach(entry => {
            const parts = entry.trim().split(/\s+/);
            const name = parts[0];
            const skill = parts[1] || "";
            if (!name) return;

            if (OP_ID_MAP[name]) {
                validOps.push({ name: name, id: OP_ID_MAP[name], skill: skill });
            } else {
                reportUnknownOperatorName(name, { source: 'popover', example: cleanText });
            }
        });

        if (validOps.length > 0) {
            content.replaceChildren();
            const grid = document.createElement('div');
            grid.className = 'prts-popover-grid';

            validOps.forEach(op => {
                const item = document.createElement('div');
                item.className = 'prts-popover-item';
                item.title = `${op.name} ${op.skill ? '(技能 ' + op.skill + ')' : ''}`;
                item.tabIndex = 0;
                item.setAttribute('aria-label', item.title);

                const img = document.createElement('img');
                img.src = `/assets/operator-avatars/webp96/${op.id}.webp`;
                img.className = 'prts-popover-img';
                img.alt = op.name;

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
    function createCardDiagnostics(source = 'none') {
        return {
            fiberCards: source === 'fiber' ? 1 : 0,
            fallbackCards: source === 'fallback' ? 1 : 0,
            noDataCards: source === 'none' ? 1 : 0
        };
    }

    function processOperationCard(card) {
        const cardInner = card.querySelector(BP_SELECTORS.card);
        if (!cardInner) {
            const diagnostics = createCardDiagnostics('none');
            cardDiagnosticsCache.set(card, diagnostics);
            return diagnostics;
        }

        optimizeCardVisuals(card, cardInner);
        cleanBilibiliLinks(cardInner);

        const resolution = getOperationResolutionForCard(card, cardInner);
        const operation = resolution.operation;
        const diagnostics = hasEffectiveOperationData(operation)
            ? createCardDiagnostics(resolution.source)
            : createCardDiagnostics('none');

        const { isAvailable, missingCount, missingOps } = checkOperationAvailability(operation, ownedOpsSet, currentFilterMode);

        if (!isAvailable && displayMode === 'HIDE') {
            if (card.style.display !== 'none') card.style.display = 'none';
            cardDiagnosticsCache.set(card, diagnostics);
            return diagnostics;
        }

        if (card.style.display === 'none') card.style.display = '';

        const hasGrayClass = card.classList.contains('prts-card-gray');
        if (!isAvailable && displayMode === 'GRAY') {
            if (!hasGrayClass) card.classList.add('prts-card-gray');
        } else if (hasGrayClass) {
            card.classList.remove('prts-card-gray');
        }

        const existingLabel = cardInner.querySelector('.prts-status-label');
        const showMissingInfo = !isAvailable || (currentFilterMode === 'SUPPORT' && missingCount === 1);

        if (!showMissingInfo) {
            if (existingLabel) existingLabel.remove();
            cardDiagnosticsCache.set(card, diagnostics);
            return diagnostics;
        }

        let labelText = '';
        let iconText = '';
        let newClass = 'prts-status-label';

        if (currentFilterMode === 'SUPPORT' && missingCount === 1) {
            newClass += ' prts-label-support';
            const name = missingOps[0];
            iconText = 'support';
            labelText = `需助战: ${name}`;
        } else {
            newClass += ' prts-label-missing';
            const listStr = missingOps.slice(0, 3).join(', ') + (missingCount > 3 ? '...' : '');
            iconText = 'missing';
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

        cardDiagnosticsCache.set(card, diagnostics);
        return diagnostics;
    }

    function aggregateCardDiagnostics(cards) {
        const diagnostics = {
            totalCards: cards.length,
            fiberCards: 0,
            fallbackCards: 0,
            noDataCards: 0
        };

        cards.forEach(card => {
            const cached = cardDiagnosticsCache.get(card) || processOperationCard(card);
            diagnostics.fiberCards += cached.fiberCards;
            diagnostics.fallbackCards += cached.fallbackCards;
            diagnostics.noDataCards += cached.noDataCards;
        });
        return diagnostics;
    }

    function applyFilterLogic() {
        if (isFilterDisabledPage()) {
            filterUpdateCoordinator.reset();
            setCompatibilityDiagnostics({ totalCards: 0, fiberCards: 0, fallbackCards: 0, noDataCards: 0 });
            return;
        }
        isProcessingFilter = true;

        try {
            const cards = getOperationCards();
            if (cards.length === 0) {
                filterUpdateCoordinator.reset();
                setCompatibilityDiagnostics({ totalCards: 0, fiberCards: 0, fallbackCards: 0, noDataCards: 0 });
                return;
            }

            const work = filterUpdateCoordinator.takeWork(cards);
            work.cards.forEach(processOperationCard);

            setCompatibilityDiagnostics(aggregateCardDiagnostics(cards));
        } catch (error) {
            filterUpdateCoordinator.reset();
            throw error;
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
        GM_setValue('prts_cfg_compat_debug', CONFIG.compatDebug);
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
        refreshAccountControls();
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
        closeBtn.setAttribute('aria-label', '关闭森空岛导入面板');
        closeBtn.appendChild(createPrtsIcon('close'));
        closeBtn.onclick = () => panel.remove();

        head.appendChild(headingWrap);
        head.appendChild(closeBtn);
        panel.appendChild(head);

        const body = document.createElement('div');
        body.className = 'prts-skland-body';
        const defaultStatusText = '请先确认当前页面已经登录森空岛。导入只会保存干员名称，不会保存森空岛凭据。';

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
            btn.textContent = getAccountLabel(id);
            btn.onclick = () => {
                targetAccountId = id;
                renderSklandAccountButtons(accountButtons, targetAccountId);
                renderSklandSelectedAccountStatus(status, targetAccountId, defaultStatusText);
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
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.textContent = defaultStatusText;
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
            setSklandPanelStatus(status, `正在读取森空岛数据，并导入到 ${getAccountLabel(targetAccountId)}。`, 'loading');
            try {
                const summary = await importSklandOperatorsToAccount(targetAccountId, {
                    selectBinding: (bindings, defaultBinding) => showSklandBindingPicker(bindings, defaultBinding?.uid, targetAccountId)
                });
                targetAccountId = summary.accountId;
                renderSklandAccountButtons(accountButtons, targetAccountId);
                setSklandPanelStatus(status, formatSklandImportSummary(summary), 'success');
            } catch (error) {
                if (isSklandImportCancelledError(error)) {
                    setSklandPanelStatus(status, '已取消角色选择，未修改账号数据。', '');
                    return;
                }
                console.error('[Better PRTS] 森空岛导入失败', error instanceof Error ? error.message : error);
                setSklandPanelStatus(status, error instanceof Error ? error.message : '森空岛导入失败，请稍后重试。', 'error');
            } finally {
                importBtn.disabled = false;
                importBtn.textContent = '读取并导入干员';
            }
        };

        renderSklandAccountButtons(accountButtons, targetAccountId);
        renderSklandSelectedAccountStatus(status, targetAccountId, defaultStatusText);

        panel.appendChild(body);
        document.body.appendChild(panel);
    }

    async function showSklandBindingPicker(bindings, preferredUid, accountId) {
        const availableBindings = normalizeSklandArknightsBindings(bindings);
        if (availableBindings.length === 0) return null;

        const accountLabel = getAccountLabel(accountId);
        const lastUid = normalizeSklandSyncText(getAccountSklandSyncMeta(accountId)?.uid);
        let selectedBinding = selectSklandBindingOption(availableBindings, preferredUid) || availableBindings[0];

        const content = document.createElement('div');
        content.className = 'prts-skland-binding-picker';

        const intro = document.createElement('p');
        intro.className = 'prts-skland-binding-intro';
        intro.textContent = `检测到多个明日方舟角色，请选择要导入到 ${accountLabel} 的角色。`;
        content.appendChild(intro);

        const list = document.createElement('div');
        list.className = 'prts-skland-binding-list';
        list.setAttribute('role', 'radiogroup');
        list.setAttribute('aria-label', '森空岛明日方舟角色');
        content.appendChild(list);

        const options = [];
        const selectByIndex = (index, focus = false) => {
            const next = options[index];
            if (!next) return;
            selectedBinding = next.binding;
            options.forEach(option => {
                const selected = option.binding.uid === selectedBinding.uid;
                option.root.classList.toggle('is-selected', selected);
                option.input.checked = selected;
            });
            if (focus) next.input.focus();
        };

        availableBindings.forEach((binding, index) => {
            const option = document.createElement('label');
            option.className = 'prts-skland-binding-option';

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'prts-skland-binding';
            input.className = 'prts-skland-binding-radio';
            input.value = binding.uid;
            input.checked = binding.uid === selectedBinding.uid;
            input.onchange = () => selectByIndex(index);
            input.onkeydown = event => {
                if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) return;
                event.preventDefault();
                const delta = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
                const nextIndex = (index + delta + availableBindings.length) % availableBindings.length;
                selectByIndex(nextIndex, true);
            };

            const textWrap = document.createElement('span');
            textWrap.className = 'prts-skland-binding-text';

            const nameRow = document.createElement('span');
            nameRow.className = 'prts-skland-binding-name-row';

            const name = document.createElement('span');
            name.className = 'prts-skland-binding-name';
            name.textContent = binding.nickname || '博士';
            nameRow.appendChild(name);

            if (lastUid && binding.uid === lastUid) {
                const badge = document.createElement('span');
                badge.className = 'prts-skland-binding-badge';
                badge.textContent = '上次导入';
                nameRow.appendChild(badge);
            } else if (binding.isDefault) {
                const badge = document.createElement('span');
                badge.className = 'prts-skland-binding-badge';
                badge.textContent = '森空岛默认';
                nameRow.appendChild(badge);
            }

            const meta = document.createElement('span');
            meta.className = 'prts-skland-binding-meta';
            meta.textContent = `UID ${binding.uid} / ${binding.channelName || '官方'}`;

            textWrap.appendChild(nameRow);
            textWrap.appendChild(meta);
            option.appendChild(input);
            option.appendChild(textWrap);
            option.classList.toggle('is-selected', input.checked);
            list.appendChild(option);
            options.push({ root: option, input, binding });
        });

        const resultPromise = showPrtsModal({
            title: '选择森空岛角色',
            message: content,
            confirmText: '导入所选角色',
            cancelText: '取消'
        });

        window.setTimeout(() => {
            const selectedOption = options.find(option => option.binding.uid === selectedBinding.uid);
            selectedOption?.input.focus();
        }, 20);

        const confirmed = await resultPromise;
        return confirmed === true ? selectedBinding : null;
    }

    function renderSklandSelectedAccountStatus(status, accountId, fallbackText) {
        const summary = getAccountSklandImportSummary(accountId);
        if (summary) {
            setSklandPanelStatus(status, `该账号上次同步：
${formatSklandImportSummary(summary)}`, 'success');
            return;
        }
        setSklandPanelStatus(status, fallbackText, '');
    }

    function renderSklandAccountButtons(buttons, activeId) {
        buttons.forEach((btn, index) => {
            const id = ACCOUNT_IDS[index];
            btn.textContent = getAccountLabel(id);
            btn.title = formatAccountSklandTitle(id);
            btn.classList.toggle('active', id === activeId);
        });
    }

    function setSklandPanelStatus(status, text, type) {
        status.className = 'prts-skland-status';
        if (type) status.classList.add(type);
        status.setAttribute('role', type === 'error' ? 'alert' : 'status');
        status.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        status.textContent = text;
    }

    function readSklandLastImportSummary() {
        const parsed = safeJsonParse(GM_getValue(SKLAND_LAST_IMPORT_KEY) || '', null);
        return normalizeSklandImportSummary(parsed);
    }

    function formatSklandImportSummary(summary) {
        const normalized = normalizeSklandImportSummary(summary);
        if (!normalized) return '';

        const timeText = formatSklandSyncTime(normalized.importedAt);
        const accountLabel = normalized.accountLabel || getAccountLabel(normalized.accountId);
        const lines = [
            `${accountLabel} 已导入 ${normalized.operatorCount} 名干员。`,
            `${normalized.nickname || '博士'} / UID ${normalized.uid || '未知'}`
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

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'prts-float-btn';
        btn.title = "脚本设置 (可拖拽)";
        btn.setAttribute('aria-label', '打开脚本设置面板，可拖拽');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'prts-settings-panel');
        btn.style.touchAction = 'none';
        const floatSvg = document.createElementNS(SVG_NS, 'svg');
        floatSvg.setAttribute('viewBox', '0 0 32 32');
        floatSvg.setAttribute('aria-hidden', 'true');
        floatSvg.setAttribute('focusable', 'false');
        const floatPath = document.createElementNS(SVG_NS, 'path');
        floatPath.setAttribute('d', 'M27,7.35l-9-5.2a4,4,0,0,0-4,0L5,7.35a4,4,0,0,0-2,3.46V21.19a4,4,0,0,0,2,3.46l9,5.2a4,4,0,0,0,4,0l9-5.2a4,4,0,0,0,2-3.46V10.81A4,4,0,0,0,27,7.35Zm-11.74-3a1.51,1.51,0,0,1,1.5,0l8.49,4.9L16,14.56,6.76,9.22Zm-9,18.17a1.51,1.51,0,0,1-.75-1.3v-9.8l9.24,5.33V27.39Zm19.48,0-8.49,4.9V16.72l9.24-5.33v9.8A1.51,1.51,0,0,1,25.74,22.49Z');
        floatSvg.appendChild(floatPath);
        btn.appendChild(floatSvg);

        const panel = document.createElement('div');
        panel.id = 'prts-settings-panel';
        panel.className = 'prts-settings-panel';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', 'Better-PRTS-Plus 设置');

        const createSwitch = (label, checked, onChange, configKey, icon) => createPrtsSwitch({ label, checked, onChange, configKey, icon });

        const title = document.createElement('div');
        title.className = 'prts-panel-title';
        title.tabIndex = 0;
        title.setAttribute('role', 'button');
        title.setAttribute('aria-label', '功能开关');
        const titleText = document.createElement('span');
        titleText.textContent = '功能开关';
        titleText.style.marginRight = 'auto';
        const titleHint = document.createElement('span');
        titleHint.textContent = '刷新生效';
        titleHint.style.fontSize = '12px';
        titleHint.style.opacity = '0.6';
        title.appendChild(titleText);
        title.appendChild(titleHint);
        panel.appendChild(title);

        let debugOptionsRevealed = CONFIG.compatDebug === true;
        const debugOptions = document.createElement('div');
        debugOptions.className = 'prts-debug-options';
        if (debugOptionsRevealed) debugOptions.classList.add('is-visible');

        const revealDebugOptions = event => {
            if (!event.shiftKey) return;
            event.preventDefault();
            event.stopPropagation();
            debugOptionsRevealed = !debugOptionsRevealed;
            debugOptions.classList.toggle('is-visible', debugOptionsRevealed);
        };

        title.addEventListener('click', revealDebugOptions);
        title.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                revealDebugOptions(event);
            }
        });

        panel.appendChild(createSwitch('作业卡片美化', CONFIG.visuals, (val) => {
            CONFIG.visuals = val; saveConfig(); if(val) requestFilterUpdate(); else location.reload();
        }, 'visuals', 'operators'));
        panel.appendChild(createSwitch('视频链接优化', CONFIG.cleanLink, (val) => {
            CONFIG.cleanLink = val; saveConfig(); if(val) requestFilterUpdate();
        }, 'cleanLink', 'link'));

        panel.appendChild(createSwitch('折叠侧边栏', CONFIG.hideSidebar, (val) => {
            CONFIG.hideSidebar = val; saveConfig(); applySidebarCollapse();
        }, 'hideSidebar', 'layout'));

        debugOptions.appendChild(createSwitch('兼容诊断', CONFIG.compatDebug, (val) => {
            CONFIG.compatDebug = val;
            saveConfig();
            if (val) {
                renderCompatibilityDiagnosticsPanel();
                requestFilterUpdate();
            } else {
                removeCompatibilityDiagnosticsPanel();
            }
        }, 'compatDebug', 'filter'));
        panel.appendChild(debugOptions);

        //[V12.0/V3.1.0 优美的多账号悬浮面板]
        const accRow = document.createElement('div');
        accRow.className = 'prts-panel-item';
        accRow.style.marginTop = '8px';
        accRow.style.marginBottom = '8px';
        accRow.style.flexDirection = 'column';
        accRow.style.alignItems = 'stretch';

        const accTitle = document.createElement('span');
        accTitle.className = 'prts-panel-item-label';
        accTitle.appendChild(createPrtsIcon('account'));
        const accTitleText = document.createElement('span');
        accTitleText.textContent = '切换账号';
        accTitle.appendChild(accTitleText);
        accRow.appendChild(accTitle);

        const accBtnGroup = document.createElement('div');
        accBtnGroup.className = 'prts-account-list';

        for (let i = 1; i <= 3; i++) {
            const row = document.createElement('div');
            row.className = 'prts-account-row';

            const accountCell = document.createElement('div');
            accountCell.className = 'prts-account-cell';

            const accBtn = document.createElement('button');
            accBtn.type = 'button';
            accBtn.className = 'prts-btn prts-acc-btn';
            accBtn.dataset.id = i;
            accBtn.onclick = (e) => {
                e.stopPropagation();
                switchAccount(i);
            };

            const syncMeta = document.createElement('span');
            syncMeta.className = 'prts-account-sync-meta';

            const renameBtn = document.createElement('button');
            renameBtn.type = 'button';
            renameBtn.className = 'prts-account-rename';
            renameBtn.dataset.id = i;
            renameBtn.textContent = '改名';
            renameBtn.onclick = (e) => {
                e.stopPropagation();
                renameAccount(i);
            };

            accountCell.appendChild(accBtn);
            accountCell.appendChild(syncMeta);
            row.appendChild(accountCell);
            row.appendChild(renameBtn);
            accBtnGroup.appendChild(row);
        }
        accRow.appendChild(accBtnGroup);
        panel.appendChild(accRow);

        const importBtn = createPrtsButton({ className: 'prts-btn', icon: 'import', text: '导入干员数据', onClick: handleImport });
        importBtn.style.width = '100%'; importBtn.style.marginTop = '4px';
        panel.appendChild(importBtn);

        const sklandBtn = createPrtsButton({ className: 'prts-btn', icon: 'skland', text: '森空岛导入', onClick: handleOpenSklandImport });
        sklandBtn.style.width = '100%'; sklandBtn.style.marginTop = '8px';
        panel.appendChild(sklandBtn);

        const backupActions = document.createElement('div');
        backupActions.className = 'prts-panel-actions';

        const exportBtn = createPrtsButton({ className: 'prts-btn', icon: 'download', text: '导出全部配置', onClick: handleExportAccountsBackup });

        const importBackupBtn = createPrtsButton({ className: 'prts-btn', icon: 'upload', text: '导入全部配置', onClick: handleImportAccountsBackup });

        backupActions.appendChild(exportBtn);
        backupActions.appendChild(importBackupBtn);
        panel.appendChild(backupActions);

        container.appendChild(panel);
        container.appendChild(btn);
        document.body.appendChild(container);
        refreshAccountControls();

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

        const setFloatOpen = isOpen => {
            container.classList.toggle('prts-float-open', isOpen);
            btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        };

        btn.onclick = (e) => {
            e.stopPropagation();
            if (!hasMoved) setFloatOpen(!container.classList.contains('prts-float-open'));
        };
        panel.onclick = (e) => e.stopPropagation();
        document.addEventListener('click', () => {
            if (!isDragging) setFloatOpen(false);
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') setFloatOpen(false);
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
                const dirtyCards = collectDirtyCardsFromMutations(mutations);
                syncPageScaffold();
                scheduleFilterUpdate(80, { forceFull: false, dirtyCards });
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
