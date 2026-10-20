// ==UserScript==
// @name         Better-PRTS-Plus
// @namespace    https://github.com/ntgmc/Better-PRTS-Plus
// @version      4.1.1
// @description  按持有干员和练度筛选 PRTS Plus 作业，支持干员组、多账号切换、干员头像展示和深色模式适配。
// @author       一只摆烂的42
// @match        https://zoot.plus/*
// @match        https://prts.plus/*
// @match        https://www.skland.com/*
// @match        https://skland.com/*
// @icon         https://prts.plus/favicon.ico
// @homepage     https://github.com/ntgmc/Better-PRTS-Plus
// @supportURL   https://github.com/ntgmc/Better-PRTS-Plus/issues
// @updateURL    https://github.com/ntgmc/Better-PRTS-Plus/releases/latest/download/Better-PRTS-Plus.user.js
// @downloadURL  https://github.com/ntgmc/Better-PRTS-Plus/releases/latest/download/Better-PRTS-Plus.user.js
// @grant        GM_info
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_addValueChangeListener
// @connect      zonai.skland.com
// @connect      github.com
// @connect      release-assets.githubusercontent.com
// @connect      raw.githubusercontent.com
// @connect      cdn.jsdelivr.net
// @connect      gcore.jsdelivr.net
// @connect      gh-proxy.com
// @connect      ghfast.top
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

    // [V12.0/V3.1.0 数据重构] 将账号数据统一存储以提升性能，并兼容旧版格式。
    const ACCOUNTS_DATA_KEY = 'prts_plus_accounts_data';
    const CONFIG_KEY = 'prts_plus_settings';
    const SKLAND_LAST_IMPORT_KEY = 'prts_plus_skland_last_import';
    const ACCOUNT_BACKUP_TYPE = 'Better-PRTS-Plus.accounts-backup';
    const ACCOUNT_BACKUP_VERSION = 1;
    const ACCOUNT_BACKUP_MAX_BYTES = 2 * 1024 * 1024;
    const OPERATOR_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
    const ACCOUNT_LABEL_MAX_LENGTH = 20;
    const LEGACY_ACCOUNT_IDS = [1, 2, 3];
    const SKLAND_BASE_URL = 'https://zonai.skland.com';
    const SKLAND_HOME_URL = 'https://www.skland.com/index';
    const SKLAND_REQUEST_TIMEOUT_MS = 25000;

    // [设置配置] 功能开关默认状态
    const SKLAND_FAVICON_SVG = '<svg class="prts-btn-icon-svg" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M0,15h1v1H0z" fill="#CCE519" opacity="0.039"/><path d="M2,15h1v1H2z" fill="#C8EE21" opacity="0.424"/><path d="M15,0h1v1H15z" fill="#D0D017" opacity="0.043"/><path d="M14,15h1v1H14z" fill="#D3F825" opacity="0.486"/><path d="M4,15h2v1H4z" fill="#C7EB21" opacity="0.502"/><path d="M11,15h3v1H11z" fill="#C9ED21" opacity="0.502"/><path d="M6,15h1v1H6z" fill="#C9EF1F" opacity="0.502"/><path d="M10,15h1v1H10z" fill="#C9F11F" opacity="0.502"/><path d="M3,15h1v1H3zM7,15h1v1H7z" fill="#CBEF21" opacity="0.502"/><path d="M8,15h2v1H8z" fill="#CDF321" opacity="0.502"/><path d="M14,0h1v1H14z" fill="#D1F323" opacity="0.502"/><path d="M15,1h1v1H15z" fill="#D0F321" opacity="0.6"/><path d="M0,13h1v1H0z" fill="#CFEF23" opacity="0.651"/><path d="M0,11h1v1H0z" fill="#D3B809" opacity="0.71"/><path d="M2,0h1v1H2z" fill="#D6F822" opacity="0.745"/><path d="M0,10h1v1H0z" fill="#DFC01A" opacity="0.757"/><path d="M0,12h1v1H0z" fill="#C9F718" opacity="0.769"/><path d="M0,2h1v1H0z" fill="#CDF222" opacity="0.773"/><path d="M13,0h1v1H13z" fill="#D2F723" opacity="0.792"/><path d="M0,5h1v1H0z" fill="#C0E51A" opacity="0.816"/><path d="M0,4h1v1H0z" fill="#C6EB17" opacity="0.816"/><path d="M0,6h1v1H0z" fill="#C9E618" opacity="0.816"/><path d="M15,14h1v1H15z" fill="#C9F127" opacity="0.816"/><path d="M4,0h2v1H4zM9,0h3v1H9z" fill="#CDF222" opacity="0.816"/><path d="M6,0h1v1H6z" fill="#CFF322" opacity="0.816"/><path d="M8,0h1v1H8z" fill="#D0F61F" opacity="0.816"/><path d="M7,0h1v1H7z" fill="#D4FB1D" opacity="0.816"/><path d="M0,8h1v1H0z" fill="#D5F022" opacity="0.816"/><path d="M0,7h1v1H0z" fill="#E0B61D" opacity="0.816"/><path d="M12,0h1v1H12z" fill="#CEF221" opacity="0.824"/><path d="M9,6h1v1H9z" fill="#9BB075" opacity="0.827"/><path d="M3,0h1v1H3z" fill="#CEF221" opacity="0.827"/><path d="M0,9h1v1H0z" fill="#D2FD21" opacity="0.827"/><path d="M0,3h1v1H0z" fill="#D0F522" opacity="0.831"/><path d="M8,10h1v1H8z" fill="#4B4848" opacity="0.859"/><path d="M10,6h1v1H10z" fill="#EBE6D6" opacity="0.89"/><path d="M1,14h1v1H1z" fill="#D0F421" opacity="0.922"/><path d="M15,8h1v1H15z" fill="#95DC0B" opacity="0.933"/><path d="M15,7h1v1H15z" fill="#9EBD4D" opacity="0.933"/><path d="M15,10h1v1H15z" fill="#A7B177" opacity="0.933"/><path d="M15,9h1v1H15z" fill="#ABB952" opacity="0.933"/><path d="M15,6h1v1H15z" fill="#BBCA71" opacity="0.933"/><path d="M15,11h1v1H15z" fill="#BBD01D" opacity="0.933"/><path d="M15,5h1v1H15z" fill="#C1E516" opacity="0.933"/><path d="M15,12h1v1H15z" fill="#D0F320" opacity="0.933"/><path d="M15,4h1v1H15z" fill="#D3F721" opacity="0.933"/><path d="M15,2h1v1H15z" fill="#CCF021" opacity="0.937"/><path d="M9,7h1v1H9z" fill="#4D5441" opacity="0.937"/><path d="M15,3h1v1H15z" fill="#CDF022" opacity="0.941"/><path d="M5,10h1v1H5z" fill="#E1F0D0" opacity="0.945"/><path d="M12,8h1v1H12z" fill="#4B4749" opacity="0.945"/><path d="M8,9h1v1H8z" fill="#FAF9FB" opacity="0.953"/><path d="M15,13h1v1H15z" fill="#CFF121" opacity="0.961"/><path d="M10,7h1v1H10z" fill="#2F2D28" opacity="0.961"/><path d="M9,10h1v1H9z" fill="#323031" opacity="0.976"/><path d="M13,8h1v1H13z" fill="#9E9693" opacity="0.98"/><path d="M5,9h1v1H5z" fill="#ABB09A" opacity="0.98"/><path d="M12,9h1v1H12z" fill="#1C1B19" opacity="0.98"/><path d="M6,10h1v1H6z" fill="#525650" opacity="0.984"/><path d="M11,6h1v1H11z" fill="#FCFDF6" opacity="0.992"/><path d="M12,6h1v1H12z" fill="#FEFEFE" opacity="0.992"/><path d="M13,9h1v1H13z" fill="#272429" opacity="0.992"/><path d="M9,9h1v1H9z" fill="#3D3D3D" opacity="0.992"/><path d="M7,10h1v1H7z" fill="#1F1F20" opacity="0.996"/><path d="M6,9h1v1H6z" fill="#282A06" opacity="0.996"/><path d="M11,7h1v1H11z" fill="#555653" opacity="0.996"/><path d="M7,12h1v1H7z" fill="#656379"/><path d="M8,6h1v1H8z" fill="#667D4D"/><path d="M7,9h1v1H7z" fill="#69696F"/><path d="M7,4h1v1H7z" fill="#6B687A"/><path d="M4,7h1v1H4z" fill="#6F6C80"/><path d="M14,8h1v1H14z" fill="#719246"/><path d="M4,8h1v1H4z" fill="#767574"/><path d="M3,7h1v1H3z" fill="#7C7778"/><path d="M8,12h1v1H8z" fill="#7C7967"/><path d="M9,12h1v1H9z" fill="#828073"/><path d="M7,8h1v1H7z" fill="#82827E"/><path d="M2,9h1v1H2z" fill="#82C10A"/><path d="M12,11h1v1H12z" fill="#848194"/><path d="M7,3h1v1H7z" fill="#8984A5"/><path d="M6,12h1v1H6z" fill="#8A8EA8"/><path d="M7,5h1v1H7z" fill="#8C8C86"/><path d="M3,9h1v1H3z" fill="#8CA753"/><path d="M2,5h1v1H2z" fill="#908AA8"/><path d="M3,6h1v1H3z" fill="#93948D"/><path d="M10,12h1v1H10z" fill="#94978F"/><path d="M2,7h1v1H2z" fill="#959994"/><path d="M14,10h1v1H14z" fill="#9692A3"/><path d="M5,7h1v1H5z" fill="#989892"/><path d="M8,3h1v1H8z" fill="#9EA675"/><path d="M14,5h1v1H14z" fill="#A1AF5D"/><path d="M3,8h1v1H3z" fill="#A2B173"/><path d="M13,4h1v1H13z" fill="#A3B357"/><path d="M8,8h1v1H8z" fill="#A5A4A7"/><path d="M6,7h1v1H6z" fill="#A5A6AD"/><path d="M6,13h1v1H6z" fill="#A5B030"/><path d="M6,6h1v1H6z" fill="#A5BF2C"/><path d="M7,2h1v1H7z" fill="#A6A4B0"/><path d="M1,5h1v1H1z" fill="#A6AA95"/><path d="M11,3h1v1H11z" fill="#A6B658"/><path d="M9,3h1v1H9z" fill="#A7C711"/><path d="M8,2h1v1H8z" fill="#A8B959"/><path d="M12,4h1v1H12z" fill="#A9AF8C"/><path d="M10,3h1v1H10z" fill="#A9B862"/><path d="M1,10h1v1H1z" fill="#A9CB31"/><path d="M11,12h1v1H11z" fill="#ABB288"/><path d="M2,4h1v1H2z" fill="#ABB86E"/><path d="M12,12h1v1H12z" fill="#ABBE4F"/><path d="M4,6h1v1H4z" fill="#ACBA68"/><path d="M9,13h1v1H9z" fill="#ADB95F"/><path d="M6,3h1v1H6z" fill="#ADC054"/><path d="M8,4h1v1H8z" fill="#AEAEAD"/><path d="M13,11h1v1H13z" fill="#AEB789"/><path d="M2,8h1v1H2z" fill="#AED330"/><path d="M1,6h1v1H1z" fill="#AFB97C"/><path d="M6,4h1v1H6z" fill="#B0C061"/><path d="M1,11h1v1H1z" fill="#B0C765"/><path d="M1,4h1v1H1z" fill="#B1BD74"/><path d="M3,5h1v1H3z" fill="#B1C64C"/><path d="M7,6h1v1H7z" fill="#B2B0B8"/><path d="M2,10h1v1H2z" fill="#B2B19B"/><path d="M7,13h1v1H7z" fill="#B2BE62"/><path d="M6,2h1v1H6z" fill="#B2CF29"/><path d="M12,3h1v1H12z" fill="#B4D70F"/><path d="M8,13h1v1H8z" fill="#B7C36A"/><path d="M14,11h1v1H14z" fill="#B7CE3E"/><path d="M10,13h1v1H10z" fill="#B9B938"/><path d="M9,4h1v1H9z" fill="#B9BAB2"/><path d="M13,7h1v1H13z" fill="#B9BCA2"/><path d="M14,7h1v1H14z" fill="#BAC981"/><path d="M2,12h1v1H2z" fill="#BBC39A"/><path d="M7,1h1v1H7z" fill="#BBDB28"/><path d="M5,13h1v1H5z" fill="#BBDF11"/><path d="M3,13h1v1H3z" fill="#BCDF15"/><path d="M13,12h1v1H13z" fill="#BCDF18"/><path d="M6,5h1v1H6z" fill="#BDDA2E"/><path d="M1,12h1v1H1z" fill="#BDDB2F"/><path d="M2,13h1v1H2z" fill="#BDE114"/><path d="M5,6h1v1H5z" fill="#BEDA35"/><path d="M4,13h1v1H4zM11,13h1v1H11z" fill="#C0E215"/><path d="M14,4h1v1H14z" fill="#C2E710"/><path d="M2,3h1v1H2z" fill="#C3E617"/><path d="M3,4h1v1H3z" fill="#C3E714"/><path d="M6,11h1v1H6z" fill="#C4C3C3"/><path d="M10,2h1v1H10z" fill="#C6EB12"/><path d="M3,2h1v1H3z" fill="#C7EA21"/><path d="M11,2h1v1H11z" fill="#C7EC14"/><path d="M4,5h1v1H4z" fill="#C7EF0A"/><path d="M4,2h1v1H4zM13,2h1v1H13zM4,3h1v1H4z" fill="#C8EB21"/><path d="M2,2h1v1H2z" fill="#C8EC21"/><path d="M13,3h1v1H13z" fill="#C8EE14"/><path d="M5,4h1v1H5z" fill="#C8EF15"/><path d="M3,12h1v1H3z" fill="#C9CEB2"/><path d="M5,12h1v1H5z" fill="#CACFAA"/><path d="M8,1h1v1H8z" fill="#CAEE22"/><path d="M1,3h1v1H1z" fill="#CAEF1A"/><path d="M5,3h1v1H5z" fill="#CAF016"/><path d="M4,12h1v1H4z" fill="#CBD0B0"/><path d="M3,3h1v1H3z" fill="#CBEE21"/><path d="M1,7h1v1H1z" fill="#CBF12D"/><path d="M12,13h1v1H12z" fill="#CBF216"/><path d="M4,9h1v1H4z" fill="#CCCACC"/><path d="M12,2h1v1H12z" fill="#CCEF21"/><path d="M4,4h1v1H4z" fill="#CCEF22"/><path d="M1,13h1v1H1z" fill="#CCF01E"/><path d="M5,2h1v1H5z" fill="#CCF11D"/><path d="M9,2h1v1H9z" fill="#CDF513"/><path d="M13,13h1v1H13z" fill="#CFF320"/><path d="M1,8h1v1H1z" fill="#CFF419"/><path d="M14,2h1v1H14z" fill="#CFF422"/><path d="M5,5h1v1H5z" fill="#CFF617"/><path d="M14,3h1v1H14z" fill="#D0F322"/><path d="M12,7h1v1H12z" fill="#D1D1D5"/><path d="M6,1h1v1H6z" fill="#D1F820"/><path d="M11,8h1v1H11z" fill="#151616"/><path d="M3,1h2v1H3zM12,1h1v1H12z" fill="#D2F723"/><path d="M5,1h1v1H5zM10,1h2v1H10z" fill="#D3F823"/><path d="M14,12h1v1H14z" fill="#D3F918"/><path d="M13,1h1v1H13z" fill="#D4F823"/><path d="M9,1h1v1H9z" fill="#D4F923"/><path d="M14,13h1v1H14z" fill="#D5FA22"/><path d="M1,9h1v1H1z" fill="#D6F621"/><path d="M9,14h1v1H9z" fill="#D6FA16"/><path d="M9,5h1v1H9z" fill="#D7D4E0"/><path d="M8,14h1v1H8z" fill="#D7F613"/><path d="M2,1h1v1H2z" fill="#D7FC24"/><path d="M1,2h1v1H1z" fill="#D9FF23"/><path d="M14,14h1v1H14z" fill="#D9FF24"/><path d="M1,1h1v1H1z" fill="#DAFF24"/><path d="M7,14h1v1H7z" fill="#DCFF17"/><path d="M4,14h2v1H4z" fill="#DDFF22"/><path d="M3,14h1v1H3z" fill="#DEFF22"/><path d="M2,14h1v1H2z" fill="#DEFF23"/><path d="M12,14h1v1H12z" fill="#E0FF23"/><path d="M13,5h1v1H13z" fill="#E1DEEF"/><path d="M11,14h1v1H11z" fill="#E1FF22"/><path d="M13,14h1v1H13z" fill="#E1FF23"/><path d="M14,1h1v1H14z" fill="#E1FF25"/><path d="M10,14h1v1H10z" fill="#E2FF1F"/><path d="M6,14h1v1H6z" fill="#E3FF21"/><path d="M11,4h1v1H11z" fill="#EAE7F7"/><path d="M3,10h1v1H3z" fill="#EEEAF3"/><path d="M14,6h1v1H14z" fill="#F2EDFF"/><path d="M10,4h1v1H10z" fill="#F5F2FF"/><path d="M2,11h1v1H2z" fill="#FFFEFF"/><path d="M10,5h3v1H10zM13,6h1v1H13zM4,10h1v1H4zM3,11h3v1H3z" fill="#FFFFFF"/><path d="M8,11h1v1H8z" fill="#1E1F1E"/><path d="M10,10h1v1H10z" fill="#1F1F23"/><path d="M10,9h1v1H10z" fill="#212121"/><path d="M9,11h1v1H9z" fill="#22221B"/><path d="M10,8h1v1H10z" fill="#272829"/><path d="M11,9h1v1H11z" fill="#292929"/><path d="M11,10h1v1H11z" fill="#292A2B"/><path d="M7,11h1v1H7z" fill="#2F2F2E"/><path d="M9,8h1v1H9z" fill="#302F32"/><path d="M12,10h1v1H12z" fill="#3A3B3A"/><path d="M2,6h1v1H2z" fill="#46435C"/><path d="M10,11h1v1H10z" fill="#48472B"/><path d="M13,10h1v1H13z" fill="#4B4A54"/><path d="M8,5h1v1H8z" fill="#4C4755"/><path d="M8,7h1v1H8z" fill="#4D553F"/><path d="M11,11h1v1H11z" fill="#4F4D4E"/><path d="M6,8h1v1H6z" fill="#5C5B54"/><path d="M14,9h1v1H14z" fill="#605D93"/><path d="M5,8h1v1H5z" fill="#615F60"/><path d="M7,7h1v1H7z" fill="#626084"/><path d="M0,14h1v1H0z" fill="#CEEC1E" opacity="0.165"/><path d="M1,15h1v1H1z" fill="#CCEF1E" opacity="0.259"/><path d="M15,15h1v1H15z" fill="#C9F225" opacity="0.318"/><path d="M0,1h1v1H0z" fill="#CEF122" opacity="0.373"/><path d="M1,0h1v1H1z" fill="#CAEF21" opacity="0.384"/></svg>';

    const CONFIG_DEFINITIONS = {
        collapseDescription: { group: '作业卡片', label: '折叠作业描述', icon: 'collapseDescription', default: true, legacyKey: 'prts_cfg_link', alias: 'cleanLink', reloadOnDisable: true },
        operatorAvatars: { group: '作业卡片', label: '干员头像', icon: 'operatorAvatars', default: true, legacyKey: 'prts_cfg_visuals', alias: 'visuals', reloadOnDisable: true },
        stageBadge: { group: '作业卡片', label: '显示关卡代号', icon: 'stageBadge', default: true, legacyKey: 'prts_cfg_visuals', alias: 'visuals', reloadOnDisable: true },
        showExactTime: { group: '作业卡片', label: '显示完整上传时间', icon: 'exactTime', default: false, legacyKey: 'prts_cfg_exact_time' },
        cleanLink: { group: '作业卡片', label: '视频链接按钮', icon: 'videoLink', default: true, legacyKey: 'prts_cfg_link', reloadOnDisable: true },
        hideVideo: { group: '作业卡片', label: '隐藏视频作业', icon: 'hideVideo', default: false, legacyKey: 'prts_cfg_hide_video' },
        hidePrtsBadge: { group: '作业卡片', label: '隐藏 PRTS 类型标签', icon: 'hidePrtsBadge', default: true, reloadOnDisable: true },
        trainingPromptStyle: { group: '作业卡片', label: '练度提示样式', icon: 'trainingPromptStyle', default: 'COMPACT', options: ['COMPACT', 'DETAILED'], optionLabels: { COMPACT: '缩略', DETAILED: '完整' } },
        siteRedesign: { group: '页面增强', label: '全站样式优化', icon: 'siteRedesign', default: false },
        popoverAvatars: { group: '页面增强', label: '干员组弹窗头像', icon: 'popoverAvatars', default: true, legacyKey: 'prts_cfg_visuals', alias: 'visuals', reloadOnDisable: true },
        hideSidebar: { group: '页面增强', label: '折叠侧边栏', icon: 'hideSidebar', default: false, legacyKey: 'prts_cfg_hide_sidebar' },
        hideOperatorMatchingSettings: { group: '页面增强', label: '隐藏原站干员匹配设置', icon: 'hideOperatorMatchingSettings', default: true },
        announcementTags: { group: '页面增强', label: '公告分类标签', icon: 'announcementTags', default: true, reloadOnDisable: true },
        importantUpdatesOnly: { group: '脚本更新', label: '仅重要更新提示（含紧急更新）', icon: 'importantUpdatesOnly', default: false },
        compatDebug: { group: '诊断', label: '兼容诊断', icon: 'compatDebug', default: false, legacyKey: 'prts_cfg_compat_debug' },
        filterMode: { default: 'NONE', options: ['NONE', 'PERFECT', 'SUPPORT'], legacyKey: 'prts_plus_filter_mode' },
        displayMode: { default: 'GRAY', options: ['GRAY', 'HIDE'], legacyKey: 'prts_plus_display_mode' },
        trainingCheck: { default: false, legacyKey: 'prts_plus_training_check' },
        floatingPosition: { default: { top: '40%', isRight: true }, legacyKey: 'prts_float_pos' }
    };

    function normalizeConfig(value) {
        const parsed = typeof value === 'string' ? safeJsonParse(value, null) : value;
        const raw = isPlainRecord(parsed) ? parsed : {};
        return Object.fromEntries(Object.entries(CONFIG_DEFINITIONS).map(([key, definition]) => {
            const candidate = raw[key] ?? (definition.alias ? raw[definition.alias] : undefined);
            const normalized = key === 'floatingPosition' ? parseFloatingPosition(candidate)
                : definition.options ? (definition.options.includes(candidate) ? candidate : definition.default)
                : typeof candidate === 'boolean' ? candidate : definition.default;
            return [key, normalized];
        }));
    }

    function loadConfig() {
        const stored = GM_getValue(CONFIG_KEY);
        const parsed = typeof stored === 'string' ? safeJsonParse(stored, null) : stored;
        if (isPlainRecord(parsed)) return normalizeConfig(parsed);
        const legacy = Object.fromEntries(Object.entries(CONFIG_DEFINITIONS).map(([key, definition]) => [
            key, definition.legacyKey ? GM_getValue(definition.legacyKey, definition.default) : definition.default
        ]));
        const config = normalizeConfig(legacy);
        GM_setValue(CONFIG_KEY, JSON.stringify(config));
        return config;
    }

    const CONFIG = loadConfig();
    // 这些增强会修改原站 DOM；本页启用过后，关闭需刷新才能完整还原。
    const enabledReloadSettings = new Set(Object.keys(CONFIG_DEFINITIONS).filter(key =>
        CONFIG_DEFINITIONS[key].reloadOnDisable && CONFIG[key]));

    function needsSettingsReload() {
        return [...enabledReloadSettings].some(key => !CONFIG[key]);
    }

    function saveConfig() {
        GM_setValue(CONFIG_KEY, JSON.stringify(normalizeConfig(CONFIG)));
        Object.entries(CONFIG_DEFINITIONS).forEach(([key, definition]) => {
            if (definition.reloadOnDisable && CONFIG[key]) enabledReloadSettings.add(key);
        });
    }

    const BP_SELECTORS = {
        inputGroup: '.bp4-input-group, .bp6-input-group',
        card: '.bp4-card, .bp6-card',
        operationCard: 'ul > li:has(> .bp4-card, > .bp6-card)',
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
    let nextAccountId = 4;
    let accountsData = { 1:[], 2: [], 3:[] }; // 各账号的干员名单
    let accountsTraining = { 1: {}, 2: {}, 3: {} };
    let accountMeta = createDefaultAccountMeta();

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
    const RAW_OPS = [{"id":"char_002_amiya","name":"阿米娅"},{"id":"char_003_kalts","name":"凯尔希"},{"id":"char_009_12fce","name":"12F"},{"id":"char_010_chen","name":"陈"},{"id":"char_017_huang","name":"煌"},{"id":"char_1011_lava2","name":"炎狱炎熔"},{"id":"char_1012_skadi2","name":"浊心斯卡蒂"},{"id":"char_1013_chen2","name":"假日威龙陈"},{"id":"char_1014_nearl2","name":"耀骑士临光"},{"id":"char_1015_aglna2","name":"予愿安洁莉娜"},{"id":"char_1016_agoat2","name":"纯烬艾雅法拉"},{"id":"char_1019_siege2","name":"维娜·维多利亚"},{"id":"char_101_sora","name":"空"},{"id":"char_1020_reed2","name":"焰影苇草"},{"id":"char_1021_kroos2","name":"寒芒克洛丝"},{"id":"char_1022_flwr2","name":"撷英调香师"},{"id":"char_1023_ghost2","name":"归溟幽灵鲨"},{"id":"char_1024_hbisc2","name":"濯尘芙蓉"},{"id":"char_1026_gvial2","name":"百炼嘉维尔"},{"id":"char_1027_greyy2","name":"承曦格雷伊"},{"id":"char_1028_texas2","name":"缄默德克萨斯"},{"id":"char_1029_yato2","name":"麒麟R夜刀"},{"id":"char_102_texas","name":"德克萨斯"},{"id":"char_1030_noirc2","name":"火龙S黑角"},{"id":"char_1031_slent2","name":"淬羽赫默"},{"id":"char_1032_excu2","name":"圣约送葬人"},{"id":"char_1033_swire2","name":"琳琅诗怀雅"},{"id":"char_1034_jesca2","name":"涤火杰西卡"},{"id":"char_1035_wisdel","name":"维什戴尔"},{"id":"char_1036_fang2","name":"历阵锐枪芬"},{"id":"char_1038_whitw2","name":"荒芜拉普兰德"},{"id":"char_1039_thorn2","name":"引星棘刺"},{"id":"char_103_angel","name":"能天使"},{"id":"char_1040_blaze2","name":"烛煌"},{"id":"char_1041_angel2","name":"新约能天使"},{"id":"char_1042_phatm2","name":"酒神"},{"id":"char_1043_leizi2","name":"司霆惊蛰"},{"id":"char_1044_hsgma2","name":"斩业星熊"},{"id":"char_1045_svash2","name":"凛御银灰"},{"id":"char_1046_sbell2","name":"圣聆初雪"},{"id":"char_1047_halo2","name":"溯光星源"},{"id":"char_1048_orchd2","name":"焰狐龙梓兰"},{"id":"char_1049_catap2","name":"雷狼龙S空爆"},{"id":"char_1050_chen3","name":"赤刃明霄陈"},{"id":"char_1051_headb2","name":"怒潮凛冬"},{"id":"char_1052_kalts2","name":"凯尔希·思衡托"},{"id":"char_106_franka","name":"芙兰卡"},{"id":"char_107_liskam","name":"雷蛇"},{"id":"char_108_silent","name":"赫默"},{"id":"char_109_fmout","name":"远山"},{"id":"char_110_deepcl","name":"深海色"},{"id":"char_112_siege","name":"推进之王"},{"id":"char_113_cqbw","name":"W"},{"id":"char_115_headbr","name":"凛冬"},{"id":"char_117_myrrh","name":"末药"},{"id":"char_118_yuki","name":"白雪"},{"id":"char_120_hibisc","name":"芙蓉"},{"id":"char_121_lava","name":"炎熔"},{"id":"char_122_beagle","name":"米格鲁"},{"id":"char_123_fang","name":"芬"},{"id":"char_124_kroos","name":"克洛丝"},{"id":"char_126_shotst","name":"流星"},{"id":"char_127_estell","name":"艾丝黛尔"},{"id":"char_128_plosis","name":"白面鸮"},{"id":"char_129_bluep","name":"蓝毒"},{"id":"char_130_doberm","name":"杜宾"},{"id":"char_131_flameb","name":"炎客"},{"id":"char_133_mm","name":"梅"},{"id":"char_134_ifrit","name":"伊芙利特"},{"id":"char_135_halo","name":"星源"},{"id":"char_136_hsguma","name":"星熊"},{"id":"char_137_brownb","name":"猎蜂"},{"id":"char_140_whitew","name":"拉普兰德"},{"id":"char_141_nights","name":"夜烟"},{"id":"char_143_ghost","name":"幽灵鲨"},{"id":"char_144_red","name":"红"},{"id":"char_145_prove","name":"普罗旺斯"},{"id":"char_147_shining","name":"闪灵"},{"id":"char_148_nearl","name":"临光"},{"id":"char_149_scave","name":"清道夫"},{"id":"char_1502_crosly","name":"弑君者"},{"id":"char_150_snakek","name":"蛇屠箱"},{"id":"char_151_myrtle","name":"桃金娘"},{"id":"char_154_morgan","name":"摩根"},{"id":"char_155_tiger","name":"因陀罗"},{"id":"char_157_dagda","name":"达格达"},{"id":"char_158_milu","name":"守林人"},{"id":"char_159_peacok","name":"断罪者"},{"id":"char_163_hpsts","name":"火神"},{"id":"char_164_nightm","name":"夜魔"},{"id":"char_166_skfire","name":"天火"},{"id":"char_171_bldsk","name":"华法琳"},{"id":"char_172_svrash","name":"银灰"},{"id":"char_173_slchan","name":"崖心"},{"id":"char_174_slbell","name":"初雪"},{"id":"char_179_cgbird","name":"夜莺"},{"id":"char_180_amgoat","name":"艾雅法拉"},{"id":"char_181_flower","name":"调香师"},{"id":"char_183_skgoat","name":"地灵"},{"id":"char_185_frncat","name":"慕斯"},{"id":"char_187_ccheal","name":"嘉维尔"},{"id":"char_188_helage","name":"赫拉格"},{"id":"char_190_clour","name":"红云"},{"id":"char_192_falco","name":"翎羽"},{"id":"char_193_frostl","name":"霜叶"},{"id":"char_194_leto","name":"烈夏"},{"id":"char_195_glassb","name":"真理"},{"id":"char_196_sunbr","name":"古米"},{"id":"char_197_poca","name":"早露"},{"id":"char_198_blackd","name":"讯使"},{"id":"char_199_yak","name":"角峰"},{"id":"char_2012_typhon","name":"提丰"},{"id":"char_2013_cerber","name":"刻俄柏"},{"id":"char_2014_nian","name":"年"},{"id":"char_2015_dusk","name":"夕"},{"id":"char_201_moeshd","name":"可颂"},{"id":"char_2023_ling","name":"令"},{"id":"char_2024_chyue","name":"重岳"},{"id":"char_2025_shu","name":"黍"},{"id":"char_2026_yu","name":"余"},{"id":"char_2027_wang","name":"望"},{"id":"char_202_demkni","name":"塞雷娅"},{"id":"char_204_platnm","name":"白金"},{"id":"char_206_gnosis","name":"灵知"},{"id":"char_208_melan","name":"玫兰莎"},{"id":"char_209_ardign","name":"卡缇"},{"id":"char_210_stward","name":"史都华德"},{"id":"char_211_adnach","name":"安德切尔"},{"id":"char_212_ansel","name":"安赛尔"},{"id":"char_213_mostma","name":"莫斯提马"},{"id":"char_214_kafka","name":"卡夫卡"},{"id":"char_215_mantic","name":"狮蝎"},{"id":"char_218_cuttle","name":"安哲拉"},{"id":"char_219_meteo","name":"陨星"},{"id":"char_220_grani","name":"格拉尼"},{"id":"char_222_bpipe","name":"风笛"},{"id":"char_225_haak","name":"阿"},{"id":"char_226_hmau","name":"吽"},{"id":"char_230_savage","name":"暴行"},{"id":"char_235_jesica","name":"杰西卡"},{"id":"char_236_rope","name":"暗索"},{"id":"char_237_gravel","name":"砾"},{"id":"char_240_wyvern","name":"香草"},{"id":"char_241_panda","name":"食铁兽"},{"id":"char_242_otter","name":"梅尔"},{"id":"char_243_waaifu","name":"槐琥"},{"id":"char_245_cello","name":"塑心"},{"id":"char_248_mgllan","name":"麦哲伦"},{"id":"char_249_mlyss","name":"缪尔赛思"},{"id":"char_250_phatom","name":"傀影"},{"id":"char_252_bibeak","name":"柏喙"},{"id":"char_253_greyy","name":"格雷伊"},{"id":"char_254_vodfox","name":"巫恋"},{"id":"char_258_podego","name":"波登可"},{"id":"char_260_durnar","name":"坚雷"},{"id":"char_261_sddrag","name":"苇草"},{"id":"char_263_skadi","name":"斯卡蒂"},{"id":"char_264_f12yin","name":"山"},{"id":"char_265_sophia","name":"鞭刃"},{"id":"char_271_spikes","name":"芳汀"},{"id":"char_272_strong","name":"孑"},{"id":"char_274_astesi","name":"星极"},{"id":"char_275_breeze","name":"微风"},{"id":"char_277_sqrrel","name":"阿消"},{"id":"char_278_orchid","name":"梓兰"},{"id":"char_279_excu","name":"送葬人"},{"id":"char_281_popka","name":"泡普卡"},{"id":"char_282_catap","name":"空爆"},{"id":"char_283_midn","name":"月见夜"},{"id":"char_284_spot","name":"斑点"},{"id":"char_285_medic2","name":"Lancet-2"},{"id":"char_286_cast3","name":"Castle-3"},{"id":"char_289_gyuki","name":"缠丸"},{"id":"char_290_vigna","name":"红豆"},{"id":"char_291_aglina","name":"安洁莉娜"},{"id":"char_293_thorns","name":"棘刺"},{"id":"char_294_ayer","name":"断崖"},{"id":"char_297_hamoni","name":"和弦"},{"id":"char_298_susuro","name":"苏苏洛"},{"id":"char_300_phenxi","name":"菲亚梅塔"},{"id":"char_301_cutter","name":"刻刀"},{"id":"char_302_glaze","name":"安比尔"},{"id":"char_304_zebra","name":"暴雨"},{"id":"char_306_leizi","name":"惊蛰"},{"id":"char_308_swire","name":"诗怀雅"},{"id":"char_311_mudrok","name":"泥岩"},{"id":"char_322_lmlee","name":"老鲤"},{"id":"char_325_bison","name":"拜松"},{"id":"char_326_glacus","name":"格劳克斯"},{"id":"char_328_cammou","name":"卡达"},{"id":"char_332_archet","name":"空弦"},{"id":"char_333_sidero","name":"铸铁"},{"id":"char_336_folivo","name":"稀音"},{"id":"char_337_utage","name":"宴"},{"id":"char_338_iris","name":"爱丽丝"},{"id":"char_340_shwaz","name":"黑"},{"id":"char_341_sntlla","name":"寒檀"},{"id":"char_343_tknogi","name":"月禾"},{"id":"char_344_beewax","name":"蜜蜡"},{"id":"char_345_folnic","name":"亚叶"},{"id":"char_346_aosta","name":"奥斯塔"},{"id":"char_347_jaksel","name":"杰克"},{"id":"char_348_ceylon","name":"锡兰"},{"id":"char_349_chiave","name":"贾维"},{"id":"char_350_surtr","name":"史尔特尔"},{"id":"char_355_ethan","name":"伊桑"},{"id":"char_356_broca","name":"布洛卡"},{"id":"char_358_lisa","name":"铃兰"},{"id":"char_362_saga","name":"嵯峨"},{"id":"char_363_toddi","name":"熔泉"},{"id":"char_365_aprl","name":"四月"},{"id":"char_366_acdrop","name":"酸糖"},{"id":"char_367_swllow","name":"灰喉"},{"id":"char_369_bena","name":"贝娜"},{"id":"char_373_lionhd","name":"莱恩哈特"},{"id":"char_376_therex","name":"THRM-EX"},{"id":"char_377_gdglow","name":"澄闪"},{"id":"char_378_asbest","name":"石棉"},{"id":"char_379_sesa","name":"慑砂"},{"id":"char_381_bubble","name":"泡泡"},{"id":"char_383_snsant","name":"雪雉"},{"id":"char_385_finlpp","name":"清流"},{"id":"char_388_mint","name":"薄绿"},{"id":"char_391_rosmon","name":"迷迭香"},{"id":"char_393_toledo","name":"德·托莱多"},{"id":"char_394_hadiya","name":"哈蒂娅"},{"id":"char_4000_jnight","name":"正义骑士号"},{"id":"char_4004_pudd","name":"布丁"},{"id":"char_4006_melnte","name":"玫拉"},{"id":"char_4009_irene","name":"艾丽妮"},{"id":"char_400_weedy","name":"温蒂"},{"id":"char_4010_etlchi","name":"隐德来希"},{"id":"char_4011_lessng","name":"止颂"},{"id":"char_4013_kjera","name":"耶拉"},{"id":"char_4014_lunacu","name":"子月"},{"id":"char_4015_spuria","name":"空构"},{"id":"char_4016_kazema","name":"风丸"},{"id":"char_4017_puzzle","name":"谜图"},{"id":"char_4019_ncdeer","name":"九色鹿"},{"id":"char_401_elysm","name":"极境"},{"id":"char_4023_rfalcn","name":"红隼"},{"id":"char_4025_aprot2","name":"暮落"},{"id":"char_4026_vulpis","name":"忍冬"},{"id":"char_4027_heyak","name":"霍尔海雅"},{"id":"char_402_tuye","name":"图耶"},{"id":"char_4031_liesel","name":"复奏"},{"id":"char_4032_provs","name":"但书"},{"id":"char_4036_forcer","name":"见行者"},{"id":"char_4037_demetr","name":"贝洛内"},{"id":"char_4039_horn","name":"号角"},{"id":"char_4040_rockr","name":"洛洛"},{"id":"char_4041_chnut","name":"褐果"},{"id":"char_4042_lumen","name":"流明"},{"id":"char_4043_erato","name":"埃拉托"},{"id":"char_4045_heidi","name":"海蒂"},{"id":"char_4046_ebnhlz","name":"黑键"},{"id":"char_4047_pianst","name":"车尔尼"},{"id":"char_4048_doroth","name":"多萝西"},{"id":"char_4051_akkord","name":"协律"},{"id":"char_4052_surfer","name":"寻澜"},{"id":"char_4054_malist","name":"至简"},{"id":"char_4055_bgsnow","name":"鸿雪"},{"id":"char_4056_titi","name":"缇缇"},{"id":"char_4058_pepe","name":"佩佩"},{"id":"char_405_absin","name":"苦艾"},{"id":"char_4062_totter","name":"铅踝"},{"id":"char_4063_quartz","name":"石英"},{"id":"char_4064_mlynar","name":"玛恩纳"},{"id":"char_4065_judge","name":"斥罪"},{"id":"char_4066_highmo","name":"海沫"},{"id":"char_4067_lolxh","name":"罗小黑"},{"id":"char_4071_peper","name":"明椒"},{"id":"char_4072_ironmn","name":"白铁"},{"id":"char_4077_palico","name":"泰拉大陆调查团"},{"id":"char_4078_bdhkgt","name":"截云"},{"id":"char_4079_haini","name":"海霓"},{"id":"char_4080_lin","name":"林"},{"id":"char_4081_warmy","name":"温米"},{"id":"char_4082_qiubai","name":"仇白"},{"id":"char_4083_chimes","name":"铎铃"},{"id":"char_4087_ines","name":"伊内丝"},{"id":"char_4088_hodrer","name":"赫德雷"},{"id":"char_4091_ulika","name":"U-Official"},{"id":"char_4093_frston","name":"Friston-3"},{"id":"char_4098_vvana","name":"薇薇安娜"},{"id":"char_4100_caper","name":"跃跃"},{"id":"char_4102_threye","name":"凛视"},{"id":"char_4104_coldst","name":"冰酿"},{"id":"char_4105_almond","name":"杏仁"},{"id":"char_4106_bryota","name":"苍苔"},{"id":"char_4107_vrdant","name":"维荻"},{"id":"char_4109_baslin","name":"深律"},{"id":"char_4110_delphn","name":"戴菲恩"},{"id":"char_4114_harold","name":"哈洛德"},{"id":"char_4116_blkkgt","name":"锏"},{"id":"char_4117_ray","name":"莱伊"},{"id":"char_4119_wanqin","name":"万顷"},{"id":"char_411_tomimi","name":"特米米"},{"id":"char_4121_zuole","name":"左乐"},{"id":"char_4122_grabds","name":"小满"},{"id":"char_4123_ela","name":"艾拉"},{"id":"char_4124_iana","name":"双月"},{"id":"char_4125_rdoc","name":"医生"},{"id":"char_4126_fuze","name":"导火索"},{"id":"char_4130_luton","name":"露托"},{"id":"char_4131_odda","name":"奥达"},{"id":"char_4132_ascln","name":"阿斯卡纶"},{"id":"char_4133_logos","name":"逻各斯"},{"id":"char_4134_cetsyr","name":"魔王"},{"id":"char_4136_phonor","name":"PhonoR-0"},{"id":"char_4137_udflow","name":"深巡"},{"id":"char_4138_narant","name":"娜仁图亚"},{"id":"char_4139_papyrs","name":"莎草"},{"id":"char_4140_lasher","name":"衡沙"},{"id":"char_4141_marcil","name":"玛露西尔"},{"id":"char_4142_laios","name":"莱欧斯"},{"id":"char_4143_sensi","name":"森西"},{"id":"char_4144_chilc","name":"齐尔查克"},{"id":"char_4145_ulpia","name":"乌尔比安"},{"id":"char_4146_nymph","name":"妮芙"},{"id":"char_4147_mitm","name":"渡桥"},{"id":"char_4148_philae","name":"菲莱"},{"id":"char_4151_tinman","name":"锡人"},{"id":"char_4155_talr","name":"裁度"},{"id":"char_415_flint","name":"燧石"},{"id":"char_4162_cathy","name":"凯瑟琳"},{"id":"char_4163_rosesa","name":"瑰盐"},{"id":"char_4164_tecno","name":"特克诺"},{"id":"char_4165_ctrail","name":"云迹"},{"id":"char_4166_varkis","name":"摆渡人"},{"id":"char_416_zumama","name":"森蚺"},{"id":"char_4171_wulfen","name":"钼铅"},{"id":"char_4172_xingzh","name":"行箸"},{"id":"char_4173_nowell","name":"诺威尔"},{"id":"char_4177_brigid","name":"水灯心"},{"id":"char_4178_alanna","name":"阿兰娜"},{"id":"char_4179_monstr","name":"Mon3tr"},{"id":"char_4182_oblvns","name":"丰川祥子"},{"id":"char_4183_mortis","name":"若叶睦"},{"id":"char_4184_dolris","name":"三角初华"},{"id":"char_4185_amoris","name":"祐天寺若麦"},{"id":"char_4186_tmoris","name":"八幡海铃"},{"id":"char_4187_graceb","name":"聆音"},{"id":"char_4188_confes","name":"CONFESS-47"},{"id":"char_4191_tippi","name":"蒂比"},{"id":"char_4193_lemuen","name":"蕾缪安"},{"id":"char_4194_rmixer","name":"信仰搅拌机"},{"id":"char_4195_radian","name":"电弧"},{"id":"char_4196_reckpr","name":"录武官"},{"id":"char_4198_christ","name":"Miss.Christine"},{"id":"char_4199_makiri","name":"松桐"},{"id":"char_4202_haruka","name":"遥"},{"id":"char_4203_kichi","name":"吉星"},{"id":"char_4204_mantra","name":"真言"},{"id":"char_4207_branch","name":"折桠"},{"id":"char_4208_wintim","name":"冬时"},{"id":"char_420_flamtl","name":"焰尾"},{"id":"char_4211_snhunt","name":"雪猎"},{"id":"char_4212_nasti","name":"娜斯提"},{"id":"char_4213_skybx","name":"天空盒"},{"id":"char_4214_cairn","name":"响石"},{"id":"char_4215_buddy","name":"罗德岛隐秘队"},{"id":"char_4217_makoto","name":"结城理"},{"id":"char_4218_aigis","name":"埃癸斯"},{"id":"char_4219_yukari","name":"岳羽由加莉"},{"id":"char_421_crow","name":"羽毛笔"},{"id":"char_4220_kormr","name":"虎狼丸"},{"id":"char_4221_ju","name":"矩"},{"id":"char_4222_taraxa","name":"风絮"},{"id":"char_4223_botany","name":"伯塔尼"},{"id":"char_4224_turdus","name":"乌啾"},{"id":"char_4225_tanya","name":"裂响"},{"id":"char_4226_veen","name":"维伊"},{"id":"char_4227_gallus","name":"GALLUS²"},{"id":"char_4228_closur","name":"可露希尔"},{"id":"char_4229_aphris","name":"谬因"},{"id":"char_422_aurora","name":"极光"},{"id":"char_4230_mcnist","name":"机械师"},{"id":"char_4231_clemnt","name":"克莱门莎"},{"id":"char_4232_hbound","name":"旅骨"},{"id":"char_4234_pedro","name":"佩德洛"},{"id":"char_4235_thumpy","name":"珊比"},{"id":"char_4236_tmslot","name":"时隙"},{"id":"char_4237_jcinta","name":"嘉辛塔"},{"id":"char_423_blemsh","name":"瑕光"},{"id":"char_426_billro","name":"卡涅利安"},{"id":"char_427_vigil","name":"伺夜"},{"id":"char_430_fartth","name":"远牙"},{"id":"char_431_ashlok","name":"灰毫"},{"id":"char_433_windft","name":"掠风"},{"id":"char_436_whispr","name":"絮雨"},{"id":"char_437_mizuki","name":"水月"},{"id":"char_440_pinecn","name":"松果"},{"id":"char_445_wscoot","name":"骋风"},{"id":"char_446_aroma","name":"阿罗玛"},{"id":"char_449_glider","name":"蜜莓"},{"id":"char_450_necras","name":"死芒"},{"id":"char_451_robin","name":"罗宾"},{"id":"char_452_bstalk","name":"豆苗"},{"id":"char_455_nothin","name":"乌有"},{"id":"char_456_ash","name":"灰烬"},{"id":"char_457_blitz","name":"闪击"},{"id":"char_458_rfrost","name":"霜华"},{"id":"char_459_tachak","name":"战车"},{"id":"char_464_cement","name":"洋灰"},{"id":"char_466_qanik","name":"雪绒"},{"id":"char_469_indigo","name":"深靛"},{"id":"char_472_pasngr","name":"异客"},{"id":"char_473_mberry","name":"桑葚"},{"id":"char_474_glady","name":"歌蕾蒂娅"},{"id":"char_475_akafyu","name":"赤冬"},{"id":"char_476_blkngt","name":"夜半"},{"id":"char_478_kirara","name":"绮良"},{"id":"char_479_sleach","name":"琴柳"},{"id":"char_484_robrta","name":"罗比菈塔"},{"id":"char_485_pallas","name":"帕拉斯"},{"id":"char_486_takila","name":"龙舌兰"},{"id":"char_487_bobb","name":"波卜"},{"id":"char_488_buildr","name":"青枳"},{"id":"char_489_serum","name":"蚀清"},{"id":"char_491_humus","name":"休谟斯"},{"id":"char_492_quercu","name":"夏栎"},{"id":"char_493_firwhl","name":"火哨"},{"id":"char_494_vendla","name":"刺玫"},{"id":"char_496_wildmn","name":"野鬃"},{"id":"char_497_ctable","name":"晓歌"},{"id":"char_498_inside","name":"隐现"},{"id":"char_499_kaitou","name":"折光"},{"id":"char_500_noirc","name":"黑角"},{"id":"char_501_durin","name":"杜林"},{"id":"char_502_nblade","name":"夜刀"},{"id":"char_503_rang","name":"巡林者"}]
    // END GENERATED OPERATOR DATA
    const OP_ID_MAP = Object.create(null);
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

// Generated from the Arknights game uniequip_table.json by tool/update-operator-data.ps1.
// Branch order follows uniequip_002/003/004 IDs, not the displayed module order.
// Resource version covers both operator and module snapshots.
const BUILTIN_RESOURCE_VERSION = 1;
const OP_MODULE_TYPES = Object.create(null);
Object.entries({
    Y: `002_amiya 1022_flwr2 102_texas 1046_sbell2 1047_halo2 108_silent 110_deepcl 118_yuki 127_estell 129_bluep 130_doberm 131_flameb 135_halo 137_brownb 144_red 155_tiger 157_dagda 158_milu 164_nightm 166_skfire 181_flower 183_skgoat 187_ccheal 194_leto 195_glassb 199_yak 201_moeshd 2023_ling 214_kafka 219_meteo 226_hmau 235_jesica 241_panda 253_greyy 261_sddrag 271_spikes 274_astesi 277_sqrrel 289_gyuki 290_vigna 301_cutter 304_zebra 328_cammou 333_sidero 341_sntlla 345_folnic 349_chiave 365_aprl 367_swllow 369_bena 385_finlpp 393_toledo 4004_pudd 4006_melnte 4013_kjera 4014_lunacu 4023_rfalcn 4031_liesel 4037_demetr 4054_malist 4067_lolxh 4078_bdhkgt 4087_ines 4107_vrdant 4109_baslin 4110_delphn 411_tomimi 4125_rdoc 4126_fuze 4141_marcil 4142_laios 4143_sensi 4147_mitm 415_flint 4164_tecno 4166_varkis 4171_wulfen 4173_nowell 4182_oblvns 4183_mortis 4186_tmoris 4193_lemuen 4202_haruka 4217_makoto 4226_veen 4229_aphris 451_robin 452_bstalk 458_rfrost 466_qanik 497_ctable`,
    XYA: `003_kalts 1023_ghost2 1026_gvial2 1033_swire2 2012_typhon 2015_dusk 206_gnosis 250_phatom 4027_heyak 416_zumama 437_mizuki 472_pasngr`,
    XY: `010_chen 017_huang 1012_skadi2 1013_chen2 1014_nearl2 1016_agoat2 1019_siege2 1020_reed2 1029_yato2 1031_slent2 1032_excu2 1034_jesca2 103_angel 1040_blaze2 112_siege 113_cqbw 1502_crosly 179_cgbird 180_amgoat 188_helage 197_poca 2013_cerber 2014_nian 2024_chyue 2025_shu 202_demkni 222_bpipe 225_haak 245_cello 248_mgllan 249_mlyss 311_mudrok 322_lmlee 340_shwaz 350_surtr 358_lisa 377_gdglow 400_weedy 4010_etlchi 4011_lessng 4026_vulpis 4039_horn 4042_lumen 4065_judge 4072_ironmn 4080_lin 4082_qiubai 4088_hodrer 4116_blkkgt 4117_ray 4121_zuole 4132_ascln 4138_narant 4145_ulpia 4146_nymph 4194_rmixer 426_billro 427_vigil 430_fartth 474_glady 479_sleach 485_pallas`,
    X: `1001_amiya2 1011_lava2 101_sora 1021_kroos2 1024_hbisc2 1027_greyy2 1030_noirc2 1035_wisdel 1036_fang2 1037_amiya3 1038_whitw2 1039_thorn2 1041_angel2 1042_phatm2 1043_leizi2 1044_hsgma2 1048_orchd2 1049_catap2 1050_chen3 1051_headb2 106_franka 107_liskam 109_fmout 115_headbr 117_myrrh 126_shotst 128_plosis 133_mm 140_whitew 141_nights 143_ghost 145_prove 148_nearl 149_scave 150_snakek 151_myrtle 154_morgan 159_peacok 163_hpsts 171_bldsk 172_svrash 173_slchan 174_slbell 185_frncat 190_clour 193_frostl 196_sunbr 198_blackd 2026_yu 2027_wang 204_platnm 215_mantic 218_cuttle 220_grani 230_savage 236_rope 237_gravel 242_otter 243_waaifu 252_bibeak 254_vodfox 258_podego 260_durnar 265_sophia 272_strong 275_breeze 279_excu 294_ayer 297_hamoni 298_susuro 302_glaze 306_leizi 308_swire 325_bison 326_glacus 336_folivo 337_utage 338_iris 343_tknogi 344_beewax 346_aosta 347_jaksel 348_ceylon 355_ethan 356_broca 363_toddi 366_acdrop 373_lionhd 378_asbest 379_sesa 381_bubble 383_snsant 388_mint 4015_spuria 4016_kazema 4017_puzzle 4019_ncdeer 401_elysm 4025_aprot2 402_tuye 4032_provs 4036_forcer 4040_rockr 4041_chnut 4043_erato 4045_heidi 4047_pianst 4051_akkord 4052_surfer 4056_titi 405_absin 4062_totter 4063_quartz 4064_mlynar 4066_highmo 4071_peper 4079_haini 4081_warmy 4083_chimes 4100_caper 4102_threye 4104_coldst 4105_almond 4106_bryota 4114_harold 4119_wanqin 4122_grabds 4124_iana 4130_luton 4131_odda 4134_cetsyr 4137_udflow 4139_papyrs 4140_lasher 4144_chilc 4148_philae 4151_tinman 4155_talr 4162_cathy 4163_rosesa 4172_xingzh 4177_brigid 4178_alanna 4179_monstr 4184_dolris 4185_amoris 4196_reckpr 4198_christ 4203_kichi 4204_mantra 4207_branch 4208_wintim 4211_snhunt 4212_nasti 4214_cairn 4218_aigis 4219_yukari 421_crow 4221_ju 4223_botany 4224_turdus 4225_tanya 4228_closur 422_aurora 4232_hbound 4235_thumpy 4236_tmslot 4237_jcinta 431_ashlok 433_windft 436_whispr 440_pinecn 445_wscoot 446_aroma 449_glider 450_necras 455_nothin 457_blitz 459_tachak 464_cement 469_indigo 473_mberry 475_akafyu 476_blkngt 478_kirara 484_robrta 486_takila 487_bobb 488_buildr 489_serum 491_humus 492_quercu 493_firwhl 494_vendla 496_wildmn 498_inside 499_kaitou`,
    YX: `1028_texas2 136_hsguma 147_shining 213_mostma 263_skadi 264_f12yin 362_saga 4048_doroth 4055_bgsnow 420_flamtl 423_blemsh 456_ash`,
    XD: `134_ifrit 293_thorns`,
    YXA: `291_aglina 300_phenxi 332_archet 4009_irene`,
    XA: `391_rosmon 4058_pepe`,
    XYD: `4046_ebnhlz`,
    DY: `4098_vvana 4133_logos`,
    D: `4123_ela`,
    AB: `4195_radian`,
    A: `4230_mcnist`
}).forEach(([types, ids]) => ids.split(' ').forEach(id => { OP_MODULE_TYPES[`char_${id}`] = types; }));
    const RESOURCE_URL = 'https://raw.githubusercontent.com/ntgmc/Better-PRTS-Plus/main/resources/data.json';
    const RESOURCE_URLS = [
        RESOURCE_URL,
        'https://cdn.jsdelivr.net/gh/ntgmc/Better-PRTS-Plus@main/resources/data.json',
        'https://gcore.jsdelivr.net/gh/ntgmc/Better-PRTS-Plus@main/resources/data.json'
    ];
    const RESOURCE_CACHE_KEY = 'prts_plus_resources_v1';
    const RESOURCE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
    let resourceUpdatePending = null;
    let resourceCheckedAt = 0;
    let resourceVersion = BUILTIN_RESOURCE_VERSION;

    function validateResourceData(data) {
        if (!isPlainRecord(data) || data.schemaVersion !== 1 ||
            !Number.isSafeInteger(data.resourceVersion) || data.resourceVersion < 1 ||
            !Array.isArray(data.operators) || !data.operators.length || !isPlainRecord(data.moduleTypes)) {
            throw new Error('资源格式无效');
        }
        const ids = new Set();
        const names = new Set();
        for (const op of data.operators) {
            if (!isPlainRecord(op) || typeof op.id !== 'string' || !/^char_\d+_[a-z0-9_]+$/.test(op.id) ||
                typeof op.name !== 'string' || !op.name.trim() || op.name !== op.name.trim() ||
                op.name.length > 50 || /[\x00-\x1f\x7f]/.test(op.name) || ids.has(op.id) || names.has(op.name)) {
                throw new Error('干员资源无效或重复');
            }
            ids.add(op.id);
            names.add(op.name);
        }
        const modules = Object.entries(data.moduleTypes);
        if (!modules.length || modules.some(([id, types]) =>
            !/^char_\d+_[a-z0-9_]+$/.test(id) || typeof types !== 'string' || !/^[XYDAB]{1,3}$/.test(types))) {
            throw new Error('模组资源无效');
        }
        if (data.resourceVersion < resourceVersion) {
            throw new Error('资源版本早于当前数据');
        }
        return data;
    }

    function applyResourceData(data) {
        validateResourceData(data);
        Object.keys(OP_ID_MAP).forEach(name => delete OP_ID_MAP[name]);
        data.operators.forEach(op => { OP_ID_MAP[op.name] = op.id; });
        Object.keys(OP_MODULE_TYPES).forEach(id => delete OP_MODULE_TYPES[id]);
        Object.assign(OP_MODULE_TYPES, data.moduleTypes);
        resourceVersion = data.resourceVersion;
    }

    function loadCachedResources() {
        try {
            const cache = JSON.parse(GM_getValue(RESOURCE_CACHE_KEY, 'null'));
            if (!cache) return;
            applyResourceData(cache.data);
            resourceCheckedAt = Number.isFinite(cache.checkedAt) && cache.checkedAt <= Date.now() ? cache.checkedAt : 0;
        } catch (error) {
            console.warn('[Better PRTS] 资源缓存读取失败，使用内置资源', error);
        }
    }

    function downloadFirstValidJson(urls, validate, maxBytes) {
        const cancellations = new Set();
        // 复用并发择优思路：https://github.com/kkocdko/user-scripts/blob/master/scripts/snippets/snippets.js (Unlicense)
        return Promise.any(urls.map(url => {
            let request;
            let timeoutId;
            let cancel;
            return new Promise((resolve, reject) => {
                cancel = () => {
                    reject(new Error('下载请求已取消'));
                    request?.abort();
                };
                cancellations.add(cancel);
                // anonymous 请求在部分浏览器中忽略内置 timeout。
                timeoutId = setTimeout(() => {
                    reject(new Error('下载请求超时'));
                    request?.abort();
                }, 15000);
                request = GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    anonymous: true,
                    timeout: 15000,
                    onload: response => {
                        try {
                            if (response.status !== 200) throw new Error(`下载请求失败：HTTP ${response.status}`);
                            if (typeof response.responseText !== 'string' || response.responseText.length > maxBytes) {
                                throw new Error('下载文件无效或过大');
                            }
                            resolve(validate(JSON.parse(response.responseText)));
                        } catch (error) { reject(error); }
                    },
                    onerror: () => reject(new Error('下载请求失败')),
                    ontimeout: () => reject(new Error('下载请求超时')),
                    onabort: () => reject(new Error('下载请求已取消'))
                });
            }).finally(() => {
                clearTimeout(timeoutId);
                cancellations.delete(cancel);
            });
        })).finally(() => {
            cancellations.forEach(cancel => cancel());
        });
    }

    function updateResources() {
        if (resourceUpdatePending) return resourceUpdatePending;
        if (Date.now() - resourceCheckedAt < RESOURCE_CHECK_INTERVAL_MS) return Promise.resolve(false);
        const updateToast = showPrtsToast('正在更新干员与模组数据…', 'loading', '正在下载数据，请稍候。', 0);
        resourceUpdatePending = downloadFirstValidJson(RESOURCE_URLS, validateResourceData, 2 * 1024 * 1024).then(data => {
            applyResourceData(data);
            resourceCheckedAt = Date.now();
            let cacheSaved = true;
            try {
                GM_setValue(RESOURCE_CACHE_KEY, JSON.stringify({ checkedAt: resourceCheckedAt, data }));
            } catch (error) {
                cacheSaved = false;
                console.warn('[Better PRTS] 资源缓存保存失败，本页已更新', error);
            }
            if (isPrtsHost()) refreshResourceViews();
            updateToast(cacheSaved ? '数据更新成功' : '数据已更新，缓存保存失败', cacheSaved ? 'success' : 'warning',
                cacheSaved ? '干员与模组数据已更新。' : '本页已使用最新数据，下次打开页面将重新同步。');
            return true;
        }).catch(error => {
            console.warn('[Better PRTS] 资源更新失败，继续使用已有资源', error);
            const detail = error instanceof AggregateError ? '所有资源下载源均不可用，请稍后重试。' : error.message || '请稍后重试。';
            updateToast('干员与模组数据更新失败', 'error', `${detail}\n继续使用已有数据。`);
            return false;
        }).finally(() => {
            resourceUpdatePending = null;
        });
        return resourceUpdatePending;
    }
    function getAccountIds(value = accountsData) {
        return Object.keys(value || {})
            .filter(key => /^[1-9]\d*$/.test(key) && Number.isSafeInteger(Number(key)))
            .map(Number).sort((a, b) => a - b);
    }

    function createEmptyAccountsData(ids = LEGACY_ACCOUNT_IDS) {
        return Object.fromEntries(ids.map(id => [id, []]));
    }

    function getDefaultAccountLabel(id) {
        return `账号 ${normalizeAccountId(id)}`;
    }

    function createDefaultAccountMeta(ids = LEGACY_ACCOUNT_IDS) {
        const meta = {};
        ids.forEach(id => {
            meta[id] = { label: getDefaultAccountLabel(id), labelSource: 'default' };
        });
        return meta;
    }

    function normalizeAccountId(id) {
        const parsed = Number(id);
        return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
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

    function normalizeOperatorTraining(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
        const limits = { elite: [0, 2], level: [1, 90], potential: [1, 6], mainSkill: [1, 7],
            skill1: [0, 3], skill2: [0, 3], skill3: [0, 3],
            modX: [0, 3], modY: [0, 3], modD: [0, 3], modA: [0, 3], modB: [0, 3] };
        const result = {};
        Object.entries(limits).forEach(([key, [min, max]]) => {
            const raw = value[key];
            if (typeof raw !== 'number' && (typeof raw !== 'string' || !raw.trim())) return;
            const number = Number(raw);
            if (Number.isInteger(number) && number >= min && number <= max) result[key] = number;
        });
        return result;
    }

    function normalizeAccountsTraining(value, accounts) {
        const result = {};
        getAccountIds(accounts).forEach(id => {
            result[id] = {};
            (accounts[id] || []).forEach(name => {
                if (!Object.prototype.hasOwnProperty.call(value?.[id] || {}, name)) return;
                const training = normalizeOperatorTraining(value[id][name]);
                if (Object.keys(training).length) {
                    Object.defineProperty(result[id], name, { value: training, enumerable: true, configurable: true });
                }
            });
        });
        return result;
    }

    function normalizeAccountsData(value) {
        const ids = isPlainRecord(value) ? getAccountIds(value) : [];
        const normalized = createEmptyAccountsData(ids.length ? ids : LEGACY_ACCOUNT_IDS);
        if (!isPlainRecord(value)) return normalized;

        getAccountIds(normalized).forEach(id => {
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

    function normalizeAccountMeta(value, ids = LEGACY_ACCOUNT_IDS) {
        const normalized = createDefaultAccountMeta(ids);
        if (!isPlainRecord(value)) return normalized;

        ids.forEach(id => {
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
            return JSON.parse(typeof rawValue === 'string' ? rawValue.replace(/^\uFEFF/, '') : rawValue);
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
        if (!Array.isArray(json)) throw new Error('JSON 数据格式错误：干员名单必须是数组。');
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

        const parsed = safeJsonParse(text, undefined);
        if (parsed !== undefined) return parseOperatorNamesFromJson(parsed);
        if (/^[\[{]/.test(text.trimStart()) || /\.json$/i.test(fileName)) {
            throw new Error('JSON 格式错误，请检查内容是否完整、语法是否正确。');
        }

        return parseOperatorNamesFromText(text);
    }

    function parseImportedOperators(rawText, fileName = '') {
        const names = parseImportedOperatorNames(rawText, fileName);
        const records = safeJsonParse(String(rawText || ''), null);
        const training = {};
        if (Array.isArray(records)) {
            records.forEach(op => {
                if (!isOwnedOperatorRecord(op)) return;
                const name = normalizeOperatorName(op?.name);
                if (!names.includes(name)) return;
                Object.defineProperty(training, name, {
                    value: normalizeOperatorTraining(op), enumerable: true, configurable: true
                });
            });
        }
        return { names, training };
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
        const rawData = isPlainRecord(source.accountsData) ? source.accountsData : {};
        const data = normalizeAccountsData(source.nextAccountId ? rawData : { ...createEmptyAccountsData(), ...rawData });
        const ids = getAccountIds(data);
        const activeId = normalizeAccountId(source.activeAccountId);
        const state = {
            activeAccountId: ids.includes(activeId) ? activeId : ids[0],
            nextAccountId: Math.max(normalizeAccountId(source.nextAccountId), ids[ids.length - 1] + 1),
            accountsData: data,
            accountMeta: normalizeAccountMeta(source.accountMeta, ids)
        };
        state.accountsTraining = normalizeAccountsTraining(source.accountsTraining, state.accountsData);
        return state;
    }

    function serializeAccountState(value) {
        const state = createAccountState(value);
        return JSON.stringify({
            activeAccountId: state.activeAccountId,
            nextAccountId: state.nextAccountId,
            accountsData: state.accountsData,
            accountsTraining: state.accountsTraining,
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
        if (!state.accountMeta[accountId] || state.accountMeta[accountId].skland) return { state, migrated: false };

        const nextMeta = normalizeAccountMeta(state.accountMeta, getAccountIds(state.accountsData));
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
            LEGACY_ACCOUNT_IDS.forEach(id => {
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

    function getOperatorImportDiff(previousNames, nextNames, previousTraining = {}, nextTraining = {}) {
        const previousSet = new Set(sanitizeOperatorNames(previousNames));
        const nextSet = new Set(sanitizeOperatorNames(nextNames));
        const removedNames = [...previousSet].filter(name => !nextSet.has(name));
        const diff = {
            added: 0, removed: removedNames.length, total: nextSet.size, removedNames,
            trainingCount: 0, decreasedTrainingNames: [], clearedTrainingNames: []
        };

        nextSet.forEach(name => {
            if (!previousSet.has(name)) diff.added += 1;
            const next = normalizeOperatorTraining(
                Object.prototype.hasOwnProperty.call(nextTraining, name) ? nextTraining[name] : null
            );
            if (Object.keys(next).length) diff.trainingCount += 1;
            if (!previousSet.has(name)) return;

            const previous = normalizeOperatorTraining(
                Object.prototype.hasOwnProperty.call(previousTraining, name) ? previousTraining[name] : null
            );
            const fields = Object.entries(previous);
            if (fields.some(([key]) => next[key] === undefined)) diff.clearedTrainingNames.push(name);
            // 精英化升级会重置等级，不能只比较等级数值。
            if (fields.some(([key, value]) => next[key] < value
                && !(key === 'level' && next.elite > previous.elite))) {
                diff.decreasedTrainingNames.push(name);
            }
        });
        return diff;
    }

    function requireAccount(state, accountId) {
        const id = normalizeAccountId(accountId);
        if (id !== Number(accountId) || !Object.prototype.hasOwnProperty.call(state.accountsData, id)) {
            throw new Error('目标账号已删除，请重新选择账号。');
        }
        return id;
    }

    function createAddedAccountState(state, rawLabel) {
        const next = createAccountState(state);
        const id = next.nextAccountId;
        if (!Number.isSafeInteger(id + 1)) throw new Error('无法继续添加账号。');
        next.nextAccountId = id + 1;
        next.accountsData[id] = [];
        next.activeAccountId = id;
        return createRenamedAccountState(next, id, rawLabel);
    }

    function createRemovedAccountState(state, accountId) {
        const next = createAccountState(state);
        const id = requireAccount(next, accountId);
        if (getAccountIds(next.accountsData).length <= 1) throw new Error('至少需要保留一个账号。');
        delete next.accountsData[id];
        delete next.accountsTraining[id];
        delete next.accountMeta[id];
        return createAccountState(next);
    }

    function createAccountSwitchState(state, accountId) {
        const next = createAccountState(state);
        next.activeAccountId = requireAccount(next, accountId);
        return next;
    }

    function createRenamedAccountState(state, accountId, rawLabel) {
        const currentState = createAccountState(state);
        const id = requireAccount(currentState, accountId);
        const cleaned = stringValue(rawLabel).replace(/[\x00-\x1F\x7F]/g, '').trim();
        const currentMeta = currentState.accountMeta[id] || {};
        currentState.accountMeta[id] = {
            label: normalizeAccountLabel(cleaned, id),
            labelSource: cleaned ? 'manual' : 'default',
            ...(currentMeta.skland ? { skland: currentMeta.skland } : {})
        };
        return createAccountState(currentState);
    }

    function createSklandImportState(state, { accountId, names, training, binding, importedAt } = {}) {
        const currentState = createAccountState(state);
        const targetAccountId = requireAccount(currentState, accountId);
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
        currentState.accountsTraining[targetAccountId] = training || {};
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
        const error = new Error('已取消森空岛导入。');
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
        throw new Error('未找到森空岛登录凭据，请先在当前页面登录森空岛。');
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
        const cultivateInfo = await getSklandGameCultivateInfo(credential, refreshed.token, refreshed.timestamp, binding.uid);
        const training = convertSklandPlayerInfoToTraining(playerInfo, cultivateInfo);
        const importedAt = new Date().toISOString();
        const confirmed = await confirmOperatorImport(
            targetAccountId, names, training, `森空岛 · ${binding.nickname || '博士'} / UID ${binding.uid}`
        );
        if (!confirmed) throw createSklandImportCancelledError();
        return commitSklandImport({
            accountId: targetAccountId,
            names,
            training,
            binding,
            importedAt
        });
    }

    function commitSklandImport(importData) {
        // 以提交时的共享存储为基准，避免旧页面回写其他账号的数据。
        const resolved = resolveStoredAccountState(readAccountStorageSnapshot());
        reportAccountStateDiagnostics(resolved.diagnostics);
        const result = createSklandImportState(resolved.state, importData);
        commitAccountState(result.state);
        try {
            GM_setValue(SKLAND_LAST_IMPORT_KEY, JSON.stringify(result.summary));
        } catch (_error) {
            console.warn('[Better PRTS] 森空岛兼容摘要保存失败，账号数据已保存');
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

        throw new Error('未找到该森空岛账号绑定的明日方舟角色。');
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
        if (bindings.length === 0) throw new Error('未找到该森空岛账号绑定的明日方舟角色。');

        const accountSyncMeta = getAccountSklandSyncMeta(accountId);
        const preferredUid = normalizeSklandSyncText(options.preferredUid ?? accountSyncMeta?.uid);
        const defaultBinding = selectSklandBindingOption(bindings, preferredUid, bindingOptions?.defaultUid);
        if (!defaultBinding) throw new Error('未找到该森空岛账号绑定的明日方舟角色。');
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

    async function getSklandGameCultivateInfo(credential, token, timestamp, uid) {
        const data = await sklandSignedGet('/api/v1/game/cultivate/player',
            `uid=${encodeURIComponent(uid)}`, credential, token, timestamp);
        if (data.code !== 0 || !Array.isArray(data.data?.characters)) {
            throw new Error('读取森空岛干员练度失败，请稍后重试。');
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
                if (!response.ok) throw new Error(`森空岛接口请求失败：HTTP ${response.status}`);
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
                        reject(new Error(`森空岛接口请求失败：HTTP ${response.status}`));
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

    function convertSklandPlayerInfoToTraining(gamePlayerInfo, cultivateInfo) {
        const data = isPlainRecord(gamePlayerInfo?.data) ? gamePlayerInfo.data : {};
        const characters = Array.isArray(cultivateInfo?.data?.characters) ? cultivateInfo.data.characters : [];
        const cultivatedById = new Map(characters.filter(isPlainRecord).map(char => [char.id, char]));
        const training = {};
        for (const raw of Array.isArray(data.chars) ? data.chars : []) {
            const id = String(raw?.charId ?? raw?.id ?? '');
            const name = normalizeOperatorName(data.charInfoMap?.[id]?.name ?? raw?.name);
            if (!name || !id.startsWith('char_')) continue;
            const character = { ...raw, ...cultivatedById.get(id) };
            const skills = Array.isArray(character.skills) ? character.skills : [];
            const record = normalizeOperatorTraining({
                elite: character.evolvePhase, level: character.level,
                potential: character.potentialRank == null ? undefined : Number(character.potentialRank) + 1,
                mainSkill: character.mainSkillLevel,
                skill1: skills[0]?.level, skill2: skills[1]?.level, skill3: skills[2]?.level
            });
            const moduleTypes = OP_MODULE_TYPES[id];
            if (cultivatedById.has(id) && Array.isArray(character.equips)) {
                for (const type of moduleTypes || '') record[`mod${type}`] = 0;
            }
            for (const equip of Array.isArray(character.equips) ? character.equips : []) {
                const match = /^uniequip_00([2-4])_(.+)$/.exec(equip.id);
                if (!match || match[2] !== id.split('_').slice(2).join('_')) continue;
                const type = moduleTypes?.[Number(match[1]) - 2];
                if (type) Object.assign(record, normalizeOperatorTraining({ [`mod${type}`]: equip.level }));
            }
            Object.defineProperty(training, name, { value: record, enumerable: true, configurable: true });
        }
        return training;
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

    function getOperationListRoot() {
        const operationSetTab = document.querySelector('[role="tab"][data-tab-id="operationSet"][aria-selected="true"]');
        if (operationSetTab || /[?&]opset=/.test(window.location.search)) {
            return document.querySelector('.bp4-drawer, .bp6-drawer');
        }
        return document;
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
        const tags = Array.from(card.querySelectorAll(`${BP_SELECTORS.tag}, .prts-op-text, .prts-op-item`));
        const requiredOps = [];
        const requiredGroups = [];

        tags.forEach(tag => {
            if (tag.querySelector('h4')) return;
            if (tag.style.display === 'none') return;

            const text = tag.querySelector('.prts-op-img')?.alt || tag.innerText.trim();
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

    function getCardTypeTag(cardInner, text) {
        return Array.from(cardInner.querySelectorAll('h4 .bp4-tag, h4 .bp6-tag'))
            .find(tag => tag.textContent.trim() === text);
    }

    function isVideoOperationCard(cardInner, operation) {
        if (operation?.type) return operation.type === 'VIDEO';
        return Boolean(getCardTypeTag(cardInner, '视频') || getCardTypeTag(cardInner, 'Video'));
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
    const iconStyles = `
    .prts-icon { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; flex: 0 0 auto; line-height: 0; color: inherit; }
    .prts-icon svg { display: block; width: 100%; height: 100%; }
`;

    const toastStyles = `
    #prts-toast-container { position: fixed; right: 16px; bottom: 24px; z-index: 2147483647; width: min(360px, calc(100vw - 32px)); display: flex; flex-direction: column; gap: 8px; pointer-events: none; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; }
    .prts-toast { pointer-events: auto; padding: 10px 12px; border-radius: 6px; border: 1px solid #e5e7eb; background: #ffffff; color: #1f2937; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18); transform: translateY(0); opacity: 1; transition: opacity 0.18s ease, transform 0.18s ease; }
    .prts-toast.is-leaving { opacity: 0; transform: translateY(6px); }
    .prts-toast-title { font-size: 13px; line-height: 1.45; font-weight: 700; }
    .prts-toast-detail { margin-top: 4px; color: #475569; font-size: 12px; line-height: 1.55; white-space: pre-line; }
    .prts-toast.loading { border-inline-start: 3px solid var(--prts-color-primary, #2563eb); }
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
    @media (prefers-reduced-motion: reduce) {
        .prts-toast { transition: none !important; }
        .prts-toast.is-leaving { transform: none !important; }
    }
`;

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

    .prts-exact-time { font-size: 0 !important; }
    .prts-exact-time::after { content: attr(data-prts-exact-time); font-size: 0.875rem; }

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

    /* 3. 通用按钮图标 */
    .prts-btn .bp4-icon { fill: currentColor; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; line-height: 0; }
    .prts-btn .bp4-icon svg { width: 16px; height: 16px; display: block; flex: 0 0 auto; }
    .prts-btn-icon-img, .prts-btn-icon-svg { border-radius: var(--prts-radius-sm); flex: 0 0 auto; object-fit: contain; display: inline-block; vertical-align: middle; }
    .prts-btn-icon-svg { overflow: visible; }

    .prts-account-sync-chip { display: inline-flex; align-items: center; max-width: min(100%, 360px); min-height: 26px; padding: 3px 8px; border: 1px solid #bfdbfe; border-radius: 999px; background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 700; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .prts-panel-actions { display: flex; gap: 8px; margin-top: 8px; width: 100%; }
    .prts-panel-actions .prts-btn { flex: 1 1 0 !important; margin: 0 !important; padding: 6px 8px !important; font-size: 13px !important; }


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

    /* 8. 导入弹窗 */

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
    .prts-import-action.primary.danger { border-color: #dc2626 !important; background: #dc2626 !important; color: #ffffff !important; }
    .prts-import-action.primary.danger:hover, .prts-import-action.primary.danger:focus-visible { border-color: #b91c1c !important; background: #b91c1c !important; color: #ffffff !important; }
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

    /* 9. 悬浮球 & 控制面板 */
    #prts-float-container { position: fixed; z-index: 9999; display: flex; align-items: center; opacity: 0.9; user-select: none; transition: opacity 0.3s, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
    #prts-float-container:hover, #prts-float-container:focus-within, #prts-float-container.prts-float-open { opacity: 1; }
    #prts-float-container.is-dragging { opacity: 1; transition: none !important; }
    #prts-float-container.is-snapping { transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
    #prts-float-container.snap-right:not(:hover):not(:focus-within):not(.prts-float-open):not(.is-dragging) { transform: translateX(calc(100% - 16px)); }
    #prts-float-container.snap-left:not(:hover):not(:focus-within):not(.prts-float-open):not(.is-dragging) { transform: translateX(calc(-100% + 16px)); }

    .prts-float-btn { width: 48px; height: 48px; background-color: #fff; border: 1px solid #e5e7eb; border-right: none; border-radius: 8px 0 0 8px; box-shadow: -2px 2px 8px rgba(0,0,0,0.1); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #374151; transition: all 0.3s; position: relative; z-index: 2; }
    .prts-float-btn > .prts-icon { width: 24px; height: 24px; }
    .prts-float-btn svg { width: 24px; height: 24px; fill: currentColor; opacity: 0; }
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
        --prts-font-mono: ui-monospace, SFMono-Regular, monospace;
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
    /* Hallmark · component: filter toolbar · genre: modern-minimal · theme: existing PRTS tokens
     * states: default, hover, focus, pressed, disabled; pre-emit critique: P5 H5 E4 S5 R5 V4 */
    #prts-filter-bar {
        container: prts-filter / inline-size;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: var(--prts-space-1);
        width: 100%;
        min-width: 0;
        margin: var(--prts-space-2) 0 var(--prts-space-3);
        padding: 0;
        color: var(--prts-color-text);
        font-family: var(--prts-font-sans);
    }
    #prts-filter-bar * { box-sizing: border-box; }
    .prts-filter-main-row { display: flex; align-items: center; flex-wrap: wrap; gap: var(--prts-space-2); min-width: 0; }
    .prts-filter-group { display: contents; }
    #prts-filter-accounts > #btn-account { width: 160px; min-width: 0; justify-content: flex-start !important; text-align: left; }
    #prts-filter-bar .prts-btn { flex: 0 0 auto; gap: var(--prts-space-2) !important; min-width: 0; min-height: 44px !important; padding: var(--prts-space-2) var(--prts-space-3) !important; color: var(--prts-color-text) !important; font-size: 14px !important; line-height: 20px !important; white-space: nowrap; }
    @media (hover: hover) and (pointer: fine) {
        #prts-filter-bar .prts-btn { min-height: 38px !important; height: 38px; }
        #prts-filter-bar .prts-account-select { min-height: 32px !important; height: 32px; }
    }
    #prts-filter-bar .prts-btn:enabled:hover { background: var(--prts-color-surface-hover) !important; }
    #prts-filter-bar .prts-btn:enabled:active { background: var(--prts-color-primary-soft) !important; }
    #prts-filter-bar .prts-btn[aria-pressed='true'] {
        border-color: transparent !important;
        background: var(--prts-color-primary-soft) !important;
        color: var(--prts-color-primary-hover) !important;
    }
    #prts-filter-bar #btn-account:disabled { opacity: 1 !important; cursor: default !important; }
    #prts-filter-options > #btn-setting { margin-left: var(--prts-space-1); }
    .prts-filter-sync-row { display: flex; min-width: 0; }
    .prts-filter-sync-row:empty { display: none; }
    #prts-filter-bar .prts-account-sync-chip {
        max-width: 100%; min-height: 0; padding: 0; border: 0; border-radius: 0;
        background: transparent; color: var(--prts-color-text-muted); font-weight: 400; line-height: 1.6;
        white-space: normal; overflow-wrap: anywhere;
    }
    @container prts-filter (max-width: 360px) {
        .prts-filter-main-row { display: grid; }
        #prts-filter-accounts, #prts-filter-options { display: grid; align-items: center; gap: var(--prts-space-2); grid-template-columns: repeat(2, minmax(0, 1fr)); }
        #prts-filter-accounts > #btn-account { grid-column: 1 / -1; width: 100%; }
        #prts-filter-options > #btn-setting { margin-left: 0; }
        #prts-filter-bar .prts-btn { padding-inline: var(--prts-space-2) !important; }
    }
    @container prts-filter (max-width: 280px) {
        #prts-filter-accounts { grid-template-columns: minmax(0, 1fr); }
    }
    /* Hallmark · component: filter results · theme: existing PRTS tokens
     * states: loading, summary, empty, pending, focus; pre-emit critique: P5 H4 E4 S5 R5 V4 */
    #prts-filter-results {
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        padding: var(--prts-space-2) 0 0;
        border-top: 1px solid var(--prts-color-border-soft);
        color: var(--prts-color-text-muted);
        font-size: 13px;
        line-height: 1.6;
        overflow-wrap: anywhere;
        font-variant-numeric: tabular-nums;
    }
    #prts-filter-bar > #prts-filter-results { padding-top: 0; border-top: 0; font-size: 12px; line-height: 1.5; }
    #prts-filter-results .prts-filter-summary, #prts-filter-results .prts-filter-empty-message { margin: 0; color: inherit; }
    #prts-filter-results .prts-filter-empty {
        margin-top: var(--prts-space-2);
        padding: var(--prts-space-3);
        border: 1px solid var(--prts-color-border-soft);
        border-radius: var(--prts-radius-md);
        background: var(--prts-color-surface-muted);
        color: var(--prts-color-text);
    }
    #btn-filter-show-all { min-height: 44px !important; margin-top: var(--prts-space-1); white-space: nowrap; }
    #btn-filter-show-all:active { background: var(--prts-color-surface-hover) !important; }
    .prts-filter-empty[hidden], #btn-filter-show-all[hidden] { display: none !important; }
    .prts-btn {
        box-sizing: border-box;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 6px !important;
        min-height: 34px !important;
        padding: 6px 10px !important;
        margin-right: 0 !important;
        border: 1px solid transparent !important;
        border-radius: var(--prts-radius-md) !important;
        color: var(--prts-color-text-muted) !important;
        background: transparent !important;
        font-family: var(--prts-font-sans) !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        line-height: 1.25 !important;
        box-shadow: none !important;
        cursor: pointer !important;
        transition: color var(--prts-duration-fast) var(--prts-ease-out), background-color var(--prts-duration-fast) var(--prts-ease-out), border-color var(--prts-duration-fast) var(--prts-ease-out) !important;
        touch-action: manipulation;
    }
    .prts-btn:not(:disabled):hover {
        background: var(--prts-color-surface-hover) !important;
        color: var(--prts-color-text) !important;
        text-decoration: none !important;
    }
    .prts-btn:focus-visible, .prts-import-action:focus-visible, .prts-account-rename:focus-visible, .prts-skland-close:focus-visible, .prts-skland-primary:focus-visible, .prts-skland-link:focus-visible, .prts-skland-binding-radio:focus-visible, .prts-float-btn:focus-visible {
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
    /* Hallmark · component: account switcher · theme: existing PRTS · states: default, hover, focus, pressed, selected
     * pre-emit critique: P4 H5 E4 S5 R5 V4 */
    .prts-account-toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--prts-space-2); }
    .prts-account-toolbar .prts-btn { min-height: 44px !important; white-space: nowrap; }
    .prts-account-list { display: flex; flex-direction: column; gap: var(--prts-space-2); width: 100%; max-height: min(320px, 45vh); margin-top: var(--prts-space-2); overflow-y: auto; overscroll-behavior: contain; }
    .prts-account-row {
        flex-shrink: 0;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 44px 44px;
        align-items: center;
        width: 100%;
        border: 1px solid var(--prts-color-border-soft);
        border-radius: var(--prts-radius-lg);
        background: var(--prts-color-surface-muted);
    }
    .prts-account-row.is-active { border-color: var(--prts-color-primary); background: var(--prts-color-primary-soft); }
    .prts-acc-btn {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: var(--prts-space-1);
        min-width: 0;
        min-height: 64px;
        margin: 0;
        padding: var(--prts-space-2) var(--prts-space-3);
        padding-right: calc(var(--prts-space-3) + 16px + var(--prts-space-2));
        border: none;
        border-radius: var(--prts-radius-lg);
        background: transparent;
        color: var(--prts-color-text);
        font: inherit;
        text-align: left;
        cursor: pointer;
        touch-action: manipulation;
    }
    .prts-account-heading { display: flex; align-items: center; gap: var(--prts-space-2); min-width: 0; }
    .prts-account-name { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 600; line-height: 1.5; }
    .prts-account-heading .bp4-icon { position: absolute; top: 50%; right: var(--prts-space-3); transform: translateY(-50%); display: flex; color: var(--prts-color-primary); visibility: hidden; }
    .prts-acc-btn.active .bp4-icon { visibility: visible; }
    .prts-account-count, .prts-account-sync-meta { color: var(--prts-color-text-muted); font-size: 11px; line-height: 1.5; }
    .prts-account-count { font-variant-numeric: tabular-nums; }
    .prts-account-sync-meta { display: none; white-space: normal; overflow-wrap: anywhere; }
    .prts-account-sync-meta.is-visible { display: block; }
    .prts-account-rename {
        justify-self: center;
        width: 44px;
        min-height: 44px;
        padding: 0;
        border: none;
        border-radius: var(--prts-radius-md);
        background: transparent;
        color: var(--prts-color-text-muted);
        font: inherit;
        font-size: 12px;
        white-space: nowrap;
        cursor: pointer;
        touch-action: manipulation;
    }
    @media (hover: hover) {
        .prts-account-row:hover { border-color: var(--prts-color-primary); }
        .prts-account-rename:hover { background: var(--prts-color-surface-hover); color: var(--prts-color-primary); }
    }
    #prts-float-container .prts-account-delete { color: var(--prts-color-danger); }
    .prts-account-rename:disabled { opacity: 0.45; cursor: not-allowed; }
    .prts-acc-btn:active, .prts-account-rename:active { background: var(--prts-color-surface-hover); }
    .prts-acc-btn:focus-visible { outline: 2px solid var(--prts-color-primary); outline-offset: 2px; }
    .prts-account-sync-chip {
        border-color: var(--prts-color-primary);
        background: var(--prts-color-primary-soft);
        color: var(--prts-color-primary);
        flex: 0 1 auto;
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
    /* Hallmark · component: training status · theme: existing PRTS tokens
     * states: low, unknown, collapsed, expanded, focus; contrast: pass
     * pre-emit critique: P4 H5 E5 S5 R5 V4 */
    body .prts-status-label.prts-training-status {
        display: flex !important;
        flex-direction: column;
        align-items: stretch !important;
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        gap: 0;
        margin: var(--prts-space-2) 0 !important;
        padding: var(--prts-space-2) var(--prts-space-3);
        border-color: var(--prts-color-border-soft);
        background: var(--prts-color-surface-muted);
        color: var(--prts-color-text) !important;
        font-family: var(--prts-font-sans);
        font-weight: 400 !important;
        overflow-wrap: anywhere;
    }
    body .prts-status-label.prts-training-compact { padding-top: 0; padding-bottom: 0; }
    .prts-training-details > .prts-training-heading {
        min-height: 44px;
        padding: 0;
        cursor: pointer;
        list-style: none;
    }
    .prts-training-details > .prts-training-heading::-webkit-details-marker { display: none; }
    .prts-training-details .prts-training-heading-text {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .prts-training-toggle {
        display: inline-flex;
        align-items: center;
        gap: var(--prts-space-1);
        margin-left: auto;
        color: var(--prts-color-text-muted);
        font-size: 11px;
        font-weight: 400;
        white-space: nowrap;
        flex: 0 0 auto;
    }
    .prts-training-toggle::after { content: '▾'; }
    .prts-training-details[open] > summary .prts-training-toggle::after { content: '▴'; }
    .prts-training-details[open] { padding-bottom: var(--prts-space-2); }
    .prts-training-details > summary:hover .prts-training-toggle,
    .prts-training-details > summary:active .prts-training-toggle { color: var(--prts-color-primary); }
    .prts-training-details > summary:focus-visible {
        outline: 2px solid var(--prts-color-primary);
        outline-offset: 2px;
        border-radius: var(--prts-radius-sm);
    }
    .prts-training-heading {
        display: flex;
        align-items: center;
        gap: var(--prts-space-2);
        min-width: 0;
        padding-bottom: var(--prts-space-2);
        font-weight: 600;
    }
    .prts-label-missing .prts-training-heading { color: var(--prts-color-danger); }
    .prts-label-support .prts-training-heading { color: var(--prts-color-warning); }
    .prts-training-columns, .prts-training-row {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 1fr);
        align-items: baseline;
        gap: var(--prts-space-2);
    }
    .prts-training-columns {
        padding-bottom: var(--prts-space-1);
        font-size: 11px;
        color: var(--prts-color-text-muted);
    }
    .prts-training-operator {
        padding: var(--prts-space-2) 0;
        border-top: 1px solid var(--prts-color-border-soft);
    }
    .prts-training-operator:last-child { padding-bottom: 0; }
    .prts-training-name {
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        gap: var(--prts-space-1) var(--prts-space-2);
        margin-bottom: var(--prts-space-1);
        font-weight: 600;
    }
    .prts-training-group { color: var(--prts-color-text-muted); font-size: 11px; font-weight: 400; }
    .prts-training-row + .prts-training-row { margin-top: var(--prts-space-1); }
    .prts-training-field { color: var(--prts-color-text-muted); }
    .prts-training-current { color: var(--prts-color-danger); }
    .prts-training-unknown .prts-training-current { color: var(--prts-color-warning); }
    .prts-training-required { font-weight: 600; }
    .prts-training-more { margin-top: var(--prts-space-2); }
    .prts-training-more summary {
        box-sizing: border-box;
        min-height: 44px;
        padding: var(--prts-space-3) 0;
        border-top: 1px solid var(--prts-color-border-soft);
        color: var(--prts-color-text-muted);
        cursor: pointer;
        white-space: nowrap;
    }
    .prts-training-more summary:hover { color: var(--prts-color-primary); }
    .prts-training-more summary:focus-visible {
        outline: 2px solid var(--prts-color-primary);
        outline-offset: 2px;
        border-radius: var(--prts-radius-sm);
    }
    .prts-training-more summary:active { color: var(--prts-color-primary-hover); }
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
    /* Hallmark · component: stage badge · genre: modern-minimal · theme: existing PRTS tokens
     * states: default; contrast: pass (40–41); pre-emit critique: P4 H5 E5 S5 R5 V4 */
    .prts-level-badge {
        display: inline-block;
        box-sizing: border-box;
        flex: 0 0 auto;
        max-width: 50%;
        margin-inline-end: var(--prts-space-2);
        padding: 1px var(--prts-space-2);
        overflow: hidden;
        border: 1px solid var(--prts-color-ring);
        border-radius: var(--prts-radius-sm);
        background: var(--prts-color-primary-soft) !important;
        color: var(--prts-color-primary-hover) !important;
        font-family: var(--prts-font-mono);
        font-size: clamp(12px, 0.75em, 14px);
        font-weight: 700;
        line-height: 1.4;
        letter-spacing: 0.02em;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: middle;
    }
    body.high-contrast-theme .prts-level-badge { border-color: var(--prts-color-primary); }
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
    .prts-toast.loading { border-inline-start: 3px solid var(--prts-color-primary) !important; }
    .prts-toast.success { border-inline-start: 3px solid var(--prts-color-success) !important; }
    .prts-toast.warning { border-inline-start: 3px solid var(--prts-color-warning) !important; }
    .prts-toast.error { border-inline-start: 3px solid var(--prts-color-danger) !important; }
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
        border-color: var(--prts-color-border) !important;
        background: var(--prts-color-surface-muted) !important;
        color: var(--prts-color-text-muted) !important;
        box-shadow: var(--prts-shadow-sm) !important;
        touch-action: none;
    }
    .prts-float-btn::after {
        content: '';
        position: absolute;
        left: 5px;
        width: 3px;
        height: 16px;
        border-radius: var(--prts-radius-sm);
        background: var(--prts-color-text-subtle);
        pointer-events: none;
    }
    #prts-float-container.snap-left .prts-float-btn::after { left: auto; right: 5px; }
    #prts-float-container:is(:hover, :focus-within, .prts-float-open, .is-dragging) .prts-float-btn::after { opacity: 0; }
    #prts-float-container:is(:hover, :focus-within, .prts-float-open, .is-dragging) .prts-float-btn svg { opacity: 1; }
    /* Hallmark · component: settings panel · theme: existing PRTS tokens
     * states: open, saved, pending reload, focus; pre-emit critique: P5 H4 E4 S5 R5 V4 */
    .prts-settings-panel {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        z-index: 3;
        width: min(292px, var(--prts-panel-width, calc(100vw - 24px))) !important;
        max-height: min(560px, var(--prts-panel-max-height, calc(100dvh - 24px)));
        overflow: hidden;
        padding: var(--prts-space-3) !important;
        border-color: var(--prts-color-border-soft) !important;
        border-radius: var(--prts-radius-lg) !important;
        background: var(--prts-color-surface) !important;
        color: var(--prts-color-text) !important;
        box-shadow: var(--prts-shadow-lg) !important;
        font-family: var(--prts-font-sans) !important;
    }
    .prts-settings-panel * { box-sizing: border-box; }
    .prts-settings-panel > .prts-panel-title { flex-shrink: 0; gap: var(--prts-space-2); }
    .prts-settings-heading {
        margin-right: auto;
        padding: 0;
        border: none;
        background: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;
        white-space: nowrap;
    }
    .prts-settings-heading:focus-visible { outline: 2px solid var(--prts-color-primary); outline-offset: 2px; }
    .prts-settings-close, .prts-submenu-close { flex: 0 0 44px; width: 44px; min-height: 44px !important; margin: 0 !important; padding: 0 !important; }
    .prts-submenu-close .bp4-icon { margin-right: 0 !important; }
    .prts-settings-content { display: flex; flex-direction: column; min-height: 0; overflow: auto; overscroll-behavior: contain; }
    /* Hallmark · component: cascading settings panels · theme: existing PRTS tokens
     * states: open, closed, hover, focus, active; pre-emit critique: P5 H5 E4 S5 R5 V4 */
    .prts-settings-panel, .prts-submenu-panel {
        transition: visibility var(--prts-duration-base), opacity var(--prts-duration-base) var(--prts-ease-out), transform var(--prts-duration-base) var(--prts-ease-out);
    }
    .prts-submenu-panel {
        position: absolute; z-index: 4; display: flex; flex-direction: column;
        width: min(340px, var(--prts-submenu-width, calc(100vw - 48px)));
        max-height: calc(100dvh - 24px); padding: 0; overflow: hidden; box-sizing: border-box;
        border: 1px solid var(--prts-color-border-soft); border-radius: var(--prts-radius-lg);
        background: var(--prts-color-surface); color: var(--prts-color-text);
        box-shadow: var(--prts-shadow-lg); font-family: var(--prts-font-sans);
        visibility: hidden; opacity: 0; pointer-events: none;
        transform: translateX(var(--prts-submenu-offset, -20px)) scale(0.95);
        transform-origin: var(--prts-submenu-origin, top left);
    }
    .prts-submenu-left { --prts-submenu-offset: 20px; --prts-submenu-origin: top right; }
    .prts-submenu-panel.is-open { z-index: 5; visibility: visible; opacity: 1; pointer-events: auto; transform: translateX(0) scale(1); }
    .prts-submenu-panel * { box-sizing: border-box; }
    .prts-submenu-panel > .prts-modal-head { flex-shrink: 0; align-items: center; padding: var(--prts-space-2) var(--prts-space-3); }
    .prts-submenu-panel .prts-modal-title { font-size: 14px; }
    .prts-submenu-content { min-height: 0; overflow: auto; overscroll-behavior: contain; padding: var(--prts-space-1) var(--prts-space-3) var(--prts-space-3); }
    .prts-panel-item.prts-account-section { flex-direction: column; align-items: stretch; gap: 0; }
    .prts-account-import { width: 100%; margin-top: var(--prts-space-2); }
    .prts-submenu-button { flex-shrink: 0; width: 100%; min-height: 44px !important; justify-content: flex-start !important; margin: 0 !important; }
    .prts-submenu-button[hidden] { display: none !important; }
    .prts-submenu-arrow { margin-left: auto; }
    .prts-submenu-left .prts-submenu-arrow, .prts-submenu-left .prts-submenu-close .prts-icon { transform: rotate(180deg); }
    #prts-float-container .prts-submenu-button[aria-expanded='true'] { background: var(--prts-color-primary-soft) !important; color: var(--prts-color-primary-hover) !important; }
    .prts-about-name { margin: var(--prts-space-2) 0; color: var(--prts-color-text); font-size: 17px; overflow-wrap: anywhere; }
    .prts-about-version { margin: 0 0 var(--prts-space-3); color: var(--prts-color-text-muted); font-size: 13px; overflow-wrap: anywhere; }
    .prts-about-description, .prts-about-credits { margin: var(--prts-space-3) 0; color: var(--prts-color-text-muted); font-size: 13px; line-height: 1.65; white-space: pre-line; }
    .prts-about-links { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--prts-space-2); margin: var(--prts-space-3) 0; }
    .prts-about-links .prts-btn { min-width: 0; min-height: 44px !important; margin: 0 !important; text-decoration: none; }
    #prts-float-container .prts-submenu-panel .prts-btn, #prts-float-container .prts-submenu-button { min-height: 44px !important; color: var(--prts-color-text-muted) !important; }
    .prts-about-update { width: 100%; min-height: 44px !important; margin: var(--prts-space-2) 0 !important; }
    .prts-submenu-content .prts-panel-actions { flex-wrap: wrap; }
    .prts-submenu-content .prts-panel-actions .prts-btn { flex: 1 1 118px !important; min-width: 0; }
    .prts-settings-panel.prts-settings-compact { padding: var(--prts-space-2) !important; }
    .prts-settings-compact > .prts-panel-title { margin-bottom: var(--prts-space-1); }
    #prts-settings-reload {
        flex-shrink: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--prts-space-2);
        margin-top: var(--prts-space-2);
        padding-top: var(--prts-space-2);
        border-top: 1px solid var(--prts-color-border-soft);
        font-size: 13px;
    }
    #prts-settings-reload[hidden] { display: none; }
    #prts-settings-reload > [role='status'] { flex: 1 1 120px; min-width: 0; }
    #prts-settings-reload .prts-btn { flex: 1 1 96px; min-width: 0; margin: 0 !important; min-height: 44px !important; white-space: nowrap; }
    .prts-panel-title {
        color: var(--prts-color-text) !important;
        border-color: var(--prts-color-border-soft) !important;
    }
    .prts-panel-item {
        min-height: 44px;
        gap: var(--prts-space-3);
        margin: 0;
        padding: var(--prts-space-1) 0;
        border-bottom: 1px solid var(--prts-color-border-soft);
        color: var(--prts-color-text-muted) !important;
        line-height: 1.5;
    }
    .prts-panel-item:last-child { border-bottom: 0; }
    .prts-panel-choice { align-items: flex-start; flex-direction: column; gap: var(--prts-space-2); padding: var(--prts-space-3) 0; }
    .prts-panel-segments {
        display: flex;
        width: 100%;
        gap: var(--prts-space-1);
        padding: var(--prts-space-1);
        border: 1px solid var(--prts-color-border-soft);
        border-radius: var(--prts-radius-md);
        background: var(--prts-color-surface-muted);
    }
    .prts-panel-segment {
        flex: 1 1 0;
        min-width: 0;
        min-height: 44px;
        padding: var(--prts-space-1) var(--prts-space-2);
        border: 1px solid transparent;
        border-radius: var(--prts-radius-sm);
        background: transparent;
        color: var(--prts-color-text-muted);
        font: inherit;
        cursor: pointer;
        white-space: nowrap;
    }
    .prts-panel-segment:hover { background: var(--prts-color-surface-hover); }
    .prts-panel-segment[aria-pressed='true'] {
        background: var(--prts-color-surface);
        border-color: var(--prts-color-primary);
        color: var(--prts-color-text);
        box-shadow: var(--prts-shadow-sm);
        font-weight: 600;
    }
    .prts-panel-segment:active { border-color: var(--prts-color-primary); }
    .prts-panel-segment:focus-visible {
        outline: 2px solid var(--prts-color-primary);
        outline-offset: -2px;
        box-shadow: none;
    }
    .prts-switch { width: 44px; height: 44px; flex: 0 0 auto; }
    .prts-switch .prts-slider { top: 11px; bottom: 11px; left: 2px; right: 2px; }
    .prts-slider:before { left: 3px; bottom: 3px; }
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
        .prts-btn, .prts-acc-btn, .prts-account-rename, .prts-import-action {
            min-height: 44px !important;
        }
        #prts-float-container { max-width: calc(100vw - 24px); }
        .prts-settings-panel {
            width: min(320px, var(--prts-panel-width, calc(100vw - 24px))) !important;
            max-height: var(--prts-panel-max-height, calc(100dvh - 24px));
        }
        #prts-import-dialog, #prts-modal {
            border-radius: var(--prts-radius-lg) var(--prts-radius-lg) 0 0 !important;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        #prts-float-container, #prts-float-container.is-snapping, .prts-settings-panel, .prts-submenu-panel, .prts-btn, .prts-import-action, .prts-op-item, .prts-op-text, .prts-popover-item, .prts-slider, .prts-slider:before {
            transition: none !important;
        }
        .prts-op-item:hover, .prts-op-text:hover {
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
    #prts-skland-import-panel { position: fixed; right: 16px; top: 96px; z-index: 2147483646; width: 292px; box-sizing: border-box; border: 1px solid rgba(15, 23, 42, 0.12); border-radius: 8px; background: #ffffff; color: #1f2937; box-shadow: 0 14px 38px rgba(15, 23, 42, 0.18); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; overflow: hidden; }
    #prts-skland-import-panel * { box-sizing: border-box; }
    .prts-skland-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 14px 14px 10px; border-bottom: 1px solid #eef2f7; }
    .prts-skland-title { margin: 0; font-size: 15px; line-height: 1.4; font-weight: 700; color: #111827; }
    .prts-skland-subtitle { margin: 4px 0 0; font-size: 12px; line-height: 1.5; color: #64748b; }
    .prts-skland-close { width: 28px; height: 28px; border: none; border-radius: 4px; background: transparent; color: #64748b; font-size: 20px; line-height: 1; cursor: pointer; }
    .prts-skland-close:hover { background: #f1f5f9; color: #0f172a; }
    .prts-skland-body { padding: 12px 14px 14px; }
    .prts-skland-label { display: block; margin-bottom: 8px; font-size: 12px; font-weight: 700; color: #475569; }
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
    .prts-import-action.primary.danger { border-color: #dc2626 !important; background: #dc2626 !important; color: #ffffff !important; }
    .prts-import-action.primary.danger:hover, .prts-import-action.primary.danger:focus-visible { border-color: #b91c1c !important; background: #b91c1c !important; color: #ffffff !important; }
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
    .prts-skland-primary:focus-visible, .prts-skland-close:focus-visible, .prts-skland-link:focus-visible, .prts-skland-binding-radio:focus-visible, .prts-import-close:focus-visible, .prts-import-action:focus-visible {
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

    const accountSelectStyles = `
    /* Hallmark · component: account select · theme: existing PRTS tokens
     * pre-emit critique: P4 H4 E4 S5 R5 V4 · states: default, hover, focus, disabled */
    .prts-account-select {
        box-sizing: border-box;
        min-width: 0;
        max-width: 100%;
        width: 220px;
        min-height: 44px;
        padding: 6px 10px;
        border: 1px solid var(--prts-color-border);
        border-radius: var(--prts-radius-md);
        background: var(--prts-color-surface);
        color: var(--prts-color-text);
        font: 600 13px var(--prts-font-sans);
        text-overflow: ellipsis;
        cursor: pointer;
        touch-action: manipulation;
    }
    @media (hover: hover) {
        .prts-account-select:hover { border-color: var(--prts-color-primary); }
    }
    .prts-account-select:focus {
        border-color: var(--prts-color-primary);
        outline: none;
        box-shadow: none;
    }
    .prts-account-select:focus-visible {
        outline: 2px solid var(--prts-color-primary);
        outline-offset: -2px;
    }
    .prts-account-select:disabled { opacity: 0.56; cursor: not-allowed; }
    #prts-skland-target-account { width: 100%; margin-bottom: 12px; }
`;

    const scriptUpdateStyles = `
    /* Hallmark · component: update modal · theme: existing PRTS tokens
     * pre-emit critique: P4 H4 E4 S5 R5 V3 · states: default, hover, focus, active */
    .prts-update-notes { white-space: normal; overflow-wrap: anywhere; font-size: 13px; line-height: 1.65; color: var(--prts-color-text-muted); }
    .prts-update-notes p { margin: 0 0 12px; white-space: pre-wrap; }
    .prts-update-notes h3 { margin: 20px 0 12px; padding-bottom: 6px; border-bottom: 1px solid var(--prts-color-border); font-size: 15px; color: var(--prts-color-text); }
    .prts-update-notes h4 { margin: 14px 0 6px; font-size: 13px; font-weight: 600; color: var(--prts-color-text); }
    .prts-release-notes { margin-bottom: 16px; }
    .prts-release-notes ul, .prts-release-notes ol { margin: 0 0 12px; padding-left: 22px; }
    .prts-release-notes ul { list-style: disc outside; }
    .prts-release-notes ol { list-style: decimal outside; }
    .prts-release-notes li { margin: 4px 0; white-space: pre-wrap; }
    .prts-release-notes code { padding: 1px 4px; border-radius: 3px; background: var(--prts-color-surface-muted); font-family: var(--prts-font-mono); }
    .prts-release-notes a { color: var(--prts-color-primary); text-decoration: underline; }
    .prts-release-notes a:focus-visible { outline: 2px solid var(--prts-color-primary); outline-offset: 2px; }
    .prts-modal-actions-extra { flex-direction: column; }
    .prts-modal-actions-extra .prts-import-action { width: 100%; min-height: 44px; white-space: nowrap; }
    .prts-modal-actions-extra .prts-import-action:active { transform: translateY(1px); }
`;

    const siteRedesignStyles = `
    /* Hallmark · macrostructure: Workbench · genre: modern-minimal · theme: existing PRTS tokens
     * Optional visual layer; all rules are scoped for immediate restoration on disable.
     * pre-emit critique: P5 H5 E4 S5 R5 V4 */
    body.prts-site-redesign {
        --prts-site-page: var(--prts-color-surface-muted);
        --prts-site-radius: 12px;
        --prts-site-gap: 24px;
        --prts-site-padding: 20px;
        --prts-site-action: #2563eb;
        --prts-site-action-hover: #1d4ed8;
        --prts-site-action-text: #ffffff;
        background: var(--prts-site-page);
        color: var(--prts-color-text);
        font-family: var(--prts-font-sans);
    }
    body.prts-site-redesign #root > div {
        background: var(--prts-site-page);
        color: var(--prts-color-text);
    }
    body.prts-site-redesign :is(.bp4-navbar, .bp6-navbar) {
        padding-inline: clamp(12px, 2.5vw, 32px);
        background: var(--prts-color-surface);
        color: var(--prts-color-text);
        border-bottom: 1px solid var(--prts-color-border-soft);
        box-shadow: var(--prts-shadow-sm);
    }
    body.prts-site-redesign :is(.bp4-navbar, .bp6-navbar) > a { color: var(--prts-color-text); }
    body.prts-site-redesign .docs-content-wrapper > .flex:has(> [class~="md:w-2/3"]) {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--prts-site-gap);
        max-width: 1440px;
        margin: var(--prts-site-gap) auto 0;
        padding-inline: clamp(12px, 2.5vw, 32px);
        align-items: start;
    }
    body.prts-site-redesign .docs-content-wrapper > .flex > :is([class~="md:w-2/3"], [class~="md:w-1/3"]) {
        width: 100%;
        min-width: 0;
        margin: 0;
        order: 0;
    }
    body.prts-site-redesign .docs-content-wrapper > .flex > [class~="md:w-1/3"] { order: 1; }
    body.prts-site-redesign .docs-content-wrapper > .flex:has(> [class~="md:w-2/3"]) > a { order: 2; }
    body.prts-site-redesign .prts-sidebar-hidden-layout { grid-template-columns: minmax(0, 1fr) !important; }
    body.prts-site-redesign .prts-sidebar-hidden-layout > [class~="md:w-2/3"] { display: block !important; }
    body.prts-site-redesign .prts-sidebar-hidden-layout > :is([class~="md:w-1/3"], a) { display: none !important; }
    body.prts-site-redesign .grid[style*="auto-fill"]:has(> li > :is(.bp4-card, .bp6-card), > .bp4-card, > .bp6-card) {
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 24rem), 1fr)) !important;
    }
    body.prts-site-redesign :is(.bp4-card, .bp6-card) {
        min-width: 0;
        border: 1px solid var(--prts-color-border-soft);
        border-radius: var(--prts-site-radius);
        background: var(--prts-color-surface);
        color: var(--prts-color-text);
        box-shadow: none;
        transition: border-color var(--prts-duration-fast) var(--prts-ease-out);
    }
    body.prts-site-redesign .docs-content-wrapper :is(.bp4-card, .bp6-card) {
        padding: var(--prts-site-padding);
    }
    body.prts-site-redesign :is(.bp4-heading, .bp6-heading) {
        color: var(--prts-color-text);
        line-height: 1.5;
        font-style: normal;
    }
    body.prts-site-redesign :is(.bp4-heading, .bp6-heading) :is(.bp4-icon, .bp6-icon) {
        color: var(--prts-color-text-subtle);
    }
    body.prts-site-redesign li:has(> :is(.bp4-card, .bp6-card)) { min-width: 0; }
    body.prts-site-redesign li > :is(.bp4-card, .bp6-card) { gap: var(--prts-space-3); }
    body.prts-site-redesign li:has(> :is(.bp4-card, .bp6-card)) > .absolute,
    body.prts-site-redesign .grid > :is(.bp4-card, .bp6-card) > .absolute {
        top: var(--prts-site-padding);
        right: var(--prts-site-padding);
    }
    body.prts-site-redesign :is(.bp4-card, .bp6-card) > .grow {
        color: var(--prts-color-text-muted);
        overflow-wrap: anywhere;
    }
    body.prts-site-redesign :is(.bp4-card, .bp6-card) > .flex:has(> .prts-level-badge) { flex-wrap: wrap; }
    body.prts-site-redesign #prts-filter-bar {
        margin-top: var(--prts-space-3);
        margin-bottom: 0;
        padding-top: var(--prts-space-3);
        border-top: 1px solid var(--prts-color-border-soft);
        gap: var(--prts-space-2);
    }
    body.prts-site-redesign :is(.bp4-button, .bp6-button) {
        border-radius: var(--prts-radius-md);
        font-weight: 500;
        white-space: nowrap;
        box-shadow: none;
    }
    body.prts-site-redesign :is(.bp4-button, .bp6-button):not(.bp4-small, .bp6-small) {
        min-height: 38px;
        padding: var(--prts-space-2) var(--prts-space-3);
    }
    body.prts-site-redesign :is(.bp4-button, .bp6-button):not([class*="-intent-"]) {
        background: var(--prts-color-surface);
        color: var(--prts-color-text-muted);
        border: 1px solid var(--prts-color-border);
    }
    body.prts-site-redesign :is(.bp4-button, .bp6-button):is(.bp4-minimal, .bp6-minimal) {
        background: transparent;
        border-color: transparent;
    }
    body.prts-site-redesign :is(.bp4-button, .bp6-button):is(.bp4-active, .bp6-active):not([class*="-intent-"]) {
        background: var(--prts-color-primary-soft);
        color: var(--prts-color-primary);
        border-color: transparent;
    }
    body.prts-site-redesign :is(.bp4-button, .bp6-button):is(.bp4-intent-primary, .bp6-intent-primary) {
        background: var(--prts-site-action);
        color: var(--prts-site-action-text);
        border: 1px solid var(--prts-site-action);
    }
    body.prts-site-redesign :is(.bp4-button, .bp6-button):is(.bp4-intent-primary, .bp6-intent-primary) > :is(.bp4-icon, .bp6-icon, .bp4-button-text, .bp6-button-text) { color: inherit; }
    body.prts-site-redesign :is(.bp4-button-group, .bp6-button-group):is(.bp4-minimal, .bp6-minimal) > :is(.bp4-intent-primary, .bp6-intent-primary) {
        background: var(--prts-color-primary-soft);
        color: var(--prts-color-primary);
    }
    body.prts-site-redesign :is(.bp4-button, .bp6-button):is(:disabled, .bp4-disabled, .bp6-disabled) {
        opacity: 0.5;
        cursor: not-allowed;
    }
    body.prts-site-redesign :is(.bp4-button-group, .bp6-button-group) > :is(.bp4-button, .bp6-button) {
        border-radius: 0;
    }
    body.prts-site-redesign :is(.bp4-button-group, .bp6-button-group) > :first-child {
        border-start-start-radius: var(--prts-radius-md);
        border-end-start-radius: var(--prts-radius-md);
    }
    body.prts-site-redesign :is(.bp4-button-group, .bp6-button-group) > :last-child {
        border-start-end-radius: var(--prts-radius-md);
        border-end-end-radius: var(--prts-radius-md);
    }
    body.prts-site-redesign :is(.bp4-input, .bp6-input, .bp4-html-select select, .bp6-html-select select) {
        border: 1px solid var(--prts-color-border);
        border-radius: var(--prts-radius-md);
        background: var(--prts-color-surface);
        color: var(--prts-color-text);
        box-shadow: none;
    }
    body.prts-site-redesign input:is(.bp4-input, .bp6-input) { height: 38px; }
    body.prts-site-redesign :is(.bp4-input, .bp6-input)::placeholder {
        color: var(--prts-color-text-subtle);
        font-style: normal;
    }
    body.prts-site-redesign :is(.bp4-input, .bp6-input):disabled { opacity: 0.5; cursor: not-allowed; }
    body.prts-site-redesign :is(.bp4-input, .bp6-input)[aria-invalid="true"] { border-color: var(--prts-color-danger); }
    body.prts-site-redesign :is(.bp4-tab, .bp6-tab)[aria-selected="true"] { color: var(--prts-color-primary); }
    body.prts-site-redesign :is(.bp4-tab-indicator, .bp6-tab-indicator) { background: var(--prts-color-primary); }
    body.prts-site-redesign :is(.bp4-dialog, .bp6-dialog, .bp4-drawer, .bp6-drawer) {
        max-width: calc(100% - 24px);
        background: var(--prts-color-surface);
        color: var(--prts-color-text);
        box-shadow: var(--prts-shadow-lg);
    }
    body.prts-site-redesign :is(.bp4-dialog, .bp6-dialog) {
        border: 1px solid var(--prts-color-border-soft);
        border-radius: var(--prts-site-radius);
    }
    body.prts-site-redesign :is(.bp4-dialog-header, .bp6-dialog-header, .bp4-drawer-header, .bp6-drawer-header) {
        background: var(--prts-color-surface);
        color: var(--prts-color-text);
        box-shadow: none;
        border-bottom: 1px solid var(--prts-color-border-soft);
    }
    body.prts-site-redesign :is(.bp4-dialog-header, .bp6-dialog-header) {
        border-radius: var(--prts-site-radius) var(--prts-site-radius) 0 0;
    }
    body.prts-site-redesign :is(.bp4-popover2-content, .bp6-popover-content) {
        border: 1px solid var(--prts-color-border);
        border-radius: var(--prts-radius-lg);
        box-shadow: var(--prts-shadow-md);
    }
    body.prts-site-redesign :is(.bp4-menu, .bp6-menu) { padding: var(--prts-space-1); }
    body.prts-site-redesign :is(.bp4-menu-item, .bp6-menu-item) { border-radius: var(--prts-radius-sm); }
    body.prts-site-redesign .docs-content-wrapper > section {
        max-width: 1440px;
        margin-inline: auto;
        padding-top: var(--prts-site-gap);
    }
    body.prts-site-redesign .docs-content-wrapper > section > div { padding-inline: clamp(12px, 2.5vw, 32px); }
    body.prts-site-redesign .markdown-body {
        color: var(--prts-color-text-muted);
        line-height: 1.75;
        overflow-wrap: anywhere;
    }
    body.prts-site-redesign .markdown-body :is(h1, h2, h3) {
        color: var(--prts-color-text);
        border-color: var(--prts-color-border-soft);
        font-style: normal;
    }
    body.prts-site-redesign :is(.bp4-button, .bp6-button, .bp4-input, .bp6-input, .bp4-tab, .bp6-tab, .bp4-menu-item, .bp6-menu-item, a[href], select, [tabindex="0"]):focus-visible {
        outline: 2px solid var(--prts-color-primary);
        outline-offset: 2px;
    }
    @media (hover: hover) {
        body.prts-site-redesign :is(.bp4-card, .bp6-card):is(.bp4-interactive, .bp6-interactive):hover {
            border-color: color-mix(in srgb, var(--prts-color-border-soft) 85%, var(--prts-color-text-subtle));
            box-shadow: none;
        }
        body.prts-site-redesign :is(.bp4-button, .bp6-button):not([class*="-intent-"], :disabled, .bp4-disabled, .bp6-disabled, .bp4-active, .bp6-active):hover {
            background: var(--prts-color-surface-hover);
            color: var(--prts-color-text);
        }
        body.prts-site-redesign :is(.bp4-button, .bp6-button):is(.bp4-intent-primary, .bp6-intent-primary):not(:disabled, .bp4-disabled, .bp6-disabled):hover {
            background: var(--prts-site-action-hover);
            color: var(--prts-site-action-text);
        }
    }
    @media (min-width: 64rem) {
        body.prts-site-redesign .docs-content-wrapper > .flex:has(> [class~="md:w-2/3"]) {
            grid-template-columns: minmax(0, 1fr) 300px;
        }
    }
    @media (max-width: 48rem) {
        body.prts-site-redesign { --prts-site-gap: 16px; --prts-site-padding: 16px; }
        body.prts-site-redesign :is(.bp4-navbar, .bp6-navbar) > div:nth-child(2) { display: none; }
        body.prts-site-redesign :is(.bp4-navbar, .bp6-navbar) > div:last-child { gap: var(--prts-space-1); }
        body.prts-site-redesign :is(.bp4-navbar, .bp6-navbar) > div:last-child :is(.bp4-button, .bp6-button) {
            min-width: 36px;
            padding-inline: var(--prts-space-2);
        }
        body.prts-site-redesign :is(.bp4-navbar, .bp6-navbar) > div:last-child :is(.bp4-button-text, .bp6-button-text) {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            overflow: hidden;
            clip-path: inset(50%);
        }
        body.prts-site-redesign :is(.bp4-navbar, .bp6-navbar) > div:last-child :is(.bp4-icon-caret-down, .bp6-icon-caret-down) { display: none; }
        body.prts-site-redesign .grid:has(> li > :is(.bp4-card, .bp6-card), > .bp4-card, > .bp6-card) { grid-template-columns: minmax(0, 1fr) !important; }
        body.prts-site-redesign .docs-content-wrapper > .flex > [class~="md:w-1/3"] > .sticky { position: static; }
    }
    @media (max-width: 22.5rem) {
        body.prts-site-redesign :is(.bp4-navbar, .bp6-navbar) > a > :is(.bp4-tag, .bp6-tag) { display: none; }
    }
    @media (pointer: coarse) {
        body.prts-site-redesign :is(.bp4-button, .bp6-button):not(.bp4-small, .bp6-small) { min-height: 44px; }
        body.prts-site-redesign :is(.bp4-navbar, .bp6-navbar) :is(.bp4-button, .bp6-button) { min-width: 44px; }
        body.prts-site-redesign input:is(.bp4-input, .bp6-input) { height: 44px; }
        body.prts-site-redesign :is(.bp4-menu-item, .bp6-menu-item) { min-height: 44px; align-items: center; }
    }
    @media (prefers-reduced-motion: reduce) {
        body.prts-site-redesign :is(.bp4-card, .bp6-card) { transition: none !important; }
    }
    `;

    GM_addStyle(iconStyles + toastStyles + (isSklandHost() ? sklandImportStyles : mergedStyles + siteRedesignStyles) + accountSelectStyles + scriptUpdateStyles);
    // =========================================================================
    //                            MODULE 3.5: DOM UI HELPERS
    // =========================================================================

    const SVG_NS = 'http://www.w3.org/2000/svg';
    let prtsModalCleanup = null;

    // 16px 实心图标：名称对应用途；不同含义使用不同轮廓。
    const PRTS_ICON_PATHS = {
        account: 'M11 4.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2 14c0-3 2.4-5 6-5s6 2 6 5v1H2Z',
        accounts: 'M1 3h14v11H1Zm1.5 1.5v8h11v-8ZM7.5 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3 12c0-1.6 1-2.5 2.5-2.5S8 10.4 8 12Zm6-6h3v1.5H9Zm0 3h3v1.5H9Z',
        selected: 'M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM4 8l1.1-1.1L7 8.8l3.9-3.9L12 6l-5 5Z',
        perfectSquad: 'M5.5 4a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0ZM1 5a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm10 0a2 2 0 1 1 4 0 2 2 0 0 1-4 0ZM4 13v-2c0-2 1.7-3 4-3 1.2 0 2.2.3 2.9.8L8 11.7 6.9 10.6 5 12.5l.5.5ZM0 12v-1c0-2 1.2-3 3-3h.8A4.6 4.6 0 0 0 2.5 11v1Zm8.2 1.1 1.1-1.1 1.6 1.6 3.5-3.5 1.1 1.1-4.6 4.6Z',
        support: 'M9 4.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM1 14v-1c0-2.5 2-4 5-4 .8 0 1.6.1 2.3.4A5 5 0 0 0 7 13v1ZM11 8h1.5v2.75h2.75v1.5H12.5V15H11v-2.75H8.25v-1.5H11Z',
        trainingCheck: 'M5 1h6v2h3v12H2V3h3Zm1.5 1.5v2h3v-2ZM3.5 4.5v9h9v-9H11V6H5V4.5ZM5 9l1.1-1.1L8 9.8l2.9-2.9L12 8l-4 4Z',
        grayMode: 'M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 1.5v11a5.5 5.5 0 0 0 0-11Z',
        hideMode: 'M1.6.5 15.5 14.4l-1.1 1.1L.5 1.6ZM8 3c3.3 0 5.7 2.5 7.5 5a15 15 0 0 1-2.7 3l-1.1-1.1a12 12 0 0 0 2-1.9C12.2 6.1 10.3 4.5 8 4.5h-.6L6 3.1ZM3.2 4.9 4.3 6a13 13 0 0 0-2 2c1.5 1.9 3.4 3.5 5.7 3.5h.6l1.4 1.4L8 13C4.7 13 2.3 10.5.5 8a15 15 0 0 1 2.7-3.1Z',
        showAll: 'M8 3c3.3 0 5.7 2.5 7.5 5-1.8 2.5-4.2 5-7.5 5S2.3 10.5.5 8C2.3 5.5 4.7 3 8 3Zm0 1.5C5.7 4.5 3.8 6.1 2.3 8c1.5 1.9 3.4 3.5 5.7 3.5s4.2-1.6 5.7-3.5C12.2 6.1 10.3 4.5 8 4.5ZM10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
        importOperators: 'M12 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 9h1c3.6 0 6 2 6 5v1H8v-2h5c-.5-1.4-1.9-2-4-2H8ZM1 9h3V7l4 4-4 4v-2H1Z',
        importBackup: 'M7 1h4l4 4v10H7v-1.5h6.5V6H10V2.5H7Zm4.5 2.1V4.5h1.4ZM1 7h4V4.5L9.5 9 5 13.5V11H1Z',
        exportBackup: 'M2 1h7l4 4v3h-1.5V6H8V2.5H3.5v11H8V15H2Zm7.5 2.1v1.4h1.4ZM7 10h4V7.5l4 3.5-4 3.5V12H7Z',
        checkUpdates: 'M4 11h-.5C1.6 11 .5 9.5.5 7.7c0-1.7 1.1-3 2.7-3.3C4 .8 11.8.8 12.6 4.4c1.7.2 2.9 1.6 2.9 3.3 0 1.8-1.1 3.3-3 3.3H12V9.5h.5c.9 0 1.5-.7 1.5-1.8 0-1-.8-1.8-1.8-1.8h-.8l-.2-.8c-.6-2.8-5.8-2.8-6.4 0l-.2.8h-.8C2.8 5.9 2 6.7 2 7.7c0 1.1.6 1.8 1.5 1.8H4ZM7 7h2v5h2l-3 3-3-3h2Z',
        reload: 'M13.5 1v5.5H8L10 4.5a4.5 4.5 0 1 0 2.4 5H14A6 6 0 1 1 11.1 3.4Z',
        cards: 'M4 1h11v11h-1.5V2.5H4ZM1 4h11v11H1Zm1.5 1.5v8h8v-8ZM4 8h5v1.5H4Zm0 3h4v1.5H4Z',
        pageEnhancements: 'M1 2h14v12H1Zm1.5 4v6.5h11V6Zm0-2.5v1h11v-1ZM8 6.5l.9 2.1L11 9.5l-2.1.9L8 12.5l-.9-2.1L5 9.5l2.1-.9Z',
        siteRedesign: 'M1 2h14v12H1Zm1.5 1.5v2h11v-2Zm0 3.5v5.5h3V7Zm4.5 0v5.5h6.5V7Zm1 1h4.5v1.5H8Zm0 2.5h3V12H8Z',
        collapseDescription: 'M2 1h12v1.5H2Zm0 3h12v1.5H2Zm0 3h8v1.5H2Zm2 6 4-4 4 4-1.1 1.1L8 11.2l-2.9 2.9Z',
        operatorAvatars: 'M1 1h14v14H1Zm1.5 1.5v11h11v-11ZM10.5 6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM4 12c0-2 1.5-3 4-3s4 1 4 3Z',
        stageBadge: 'M8 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 9.5 3 6a5 5 0 0 1 5-5Zm0 1.5A3.5 3.5 0 0 0 4.5 6c0 2.1 2.2 5.2 3.5 6.7 1.3-1.5 3.5-4.6 3.5-6.7A3.5 3.5 0 0 0 8 2.5ZM10 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
        exactTime: 'M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM7 4h1.5v3.6l2.8 1.6-.8 1.3L7 8.4Z',
        videoLink: 'M1 2h8v6H7.5V3.5h-5v7H6V12H1ZM4 5l3 2-3 2Zm5 4h4v1.5H9Zm-1-2h2v1.5H8a2 2 0 0 0 0 4h2V14H8a3.5 3.5 0 0 1 0-7Zm4 0h.5a3.5 3.5 0 0 1 0 7H12v-1.5h.5a2 2 0 0 0 0-4H12Z',
        hideVideo: 'M1 1.5 14.5 15l1-1L2 0ZM1 5h1.5v6.5h6V10L10 11.5V13H1ZM6 3h4v2.5L15 3v9l-3-1.5v-2L13.5 10V5.5L10 7.3V4.5H7.5Z',
        hidePrtsBadge: 'M1 1.5 14.5 15l1-1L2 0ZM5 2h5l5 5v3l-1.5 1.5-1.1-1.1L13.5 9.4V7.6L9.4 3.5H6.5ZM1 4h1.5v5.4l4.1 4.1h1.8l1.7-1.7 1.1 1.1L9 15H6L1 10Z',
        trainingPromptStyle: 'M1 2h3v3H1Zm5 .5h9V4H6ZM1 6.5h3v3H1ZM6 7h9v1.5H6ZM1 11h3v3H1Zm5 .5h7V13H6Z',
        popoverAvatars: 'M1 1h14v11h-4l-4 3v-3H1Zm1.5 1.5v8h6v1.5l2-1.5h3v-8ZM7 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.5 9V8c0-1.3 4-1.3 4 0v1Zm5 0V8c0-1.3 4-1.3 4 0v1Z',
        hideSidebar: 'M1 2h14v12H1Zm1.5 1.5v9h3v-9Zm4.5 0v9h6.5v-9Zm3 1 1 1-2 2h3v1.5H9l2 2-1 1L6.8 8Z',
        hideOperatorMatchingSettings: 'M2 1h1.5v4H2Zm0 7h1.5v7H2ZM.5 5h4.5v3H.5ZM7 1h1.5v8H7ZM5.5 9H10v3H5.5ZM7 12h1.5v3H7Zm5-11h1.5v3H12Zm-1.5 3H15v3h-4.5Zm.7 5.2 1.8 1.8 1.8-1.8 1 1-1.8 1.8 1.8 1.8-1 1-1.8-1.8-1.8 1.8-1-1 1.8-1.8-1.8-1.8Z',
        announcementTags: 'M1 5h4l7-4v12l-7-4H1Zm1.5 1.5v1h3l5 2.9V3.6l-5 2.9ZM3 10h2l1 5H4Zm10.5-5h2v1.5h-2Zm0 3h2v1.5h-2Z',
        importantUpdatesOnly: 'M8 1a4 4 0 0 1 4 4v4l2 2v1H2v-1l2-2V5a4 4 0 0 1 4-4Zm0 1.5A2.5 2.5 0 0 0 5.5 5v4.6l-.9.9h6.8l-.9-.9V5A2.5 2.5 0 0 0 8 2.5ZM6 13h4a2 2 0 0 1-4 0ZM7.2 4h1.6v3.5H7.2Zm0 4.5h1.6V10H7.2Z',
        compatDebug: 'M4 1 6 3h4l2-2 1 1-2 2 .7 1H15v1.5h-3V8h3v1.5h-3V11h3v1.5h-3.5A4 4 0 0 1 8 15a4 4 0 0 1-3.5-2.5H1V11h3V9.5H1V8h3V6.5H1V5h3.3L5 4 3 2Zm1.5 5v5a2.5 2.5 0 0 0 5 0V6ZM7.2 7h1.6v6H7.2Z',
        missingOperators: 'M9 4.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM1 14v-1c0-2.5 2-4 5-4 .8 0 1.6.1 2.3.4A5 5 0 0 0 7 13v1ZM9 11h6v2H9Z',
        lowTraining: 'M8 1a7 7 0 0 1 7 7v3h-1.5V8a5.5 5.5 0 0 0-11 0v3H1V8a7 7 0 0 1 7-7ZM7.2 3h1.6v2H7.2ZM3.5 5l1.4 1.4-1 1L2.5 6Zm9 0 1 1-1.4 1.4-1-1ZM7 7h2v5h2l-3 3-3-3h2Z',
        pending: 'M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM5.5 6a2.5 2.5 0 1 1 4 2l-.8.6V10H7.2V7.9l1.4-1.1A1 1 0 1 0 7 6ZM7.2 11h1.6v1.5H7.2Z',
        unmarkedTraining: 'M2 1h7l4 4v10H2Zm1.5 1.5v11h8V6H8V2.5Zm6 .6v1.4h1.4ZM5 8a2 2 0 1 1 3.2 1.6l-.5.4v.5H6.3v-1l1-1A.6.6 0 1 0 6.4 8Zm1.3 3.5h1.4V13H6.3Z',
        about: 'M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM7.2 4h1.6v1.6H7.2Zm0 3h1.6v5H7.2Z',
        close: 'M3 1.9 8 6.9l5-5L14.1 3l-5 5 5 5-1.1 1.1-5-5-5 5L1.9 13l5-5-5-5Z',
        collapsePanel: 'M10.5 2 4.5 8l6 6 1.1-1.1L6.7 8l4.9-4.9Z',
        expandSubmenu: 'M5.5 2 4.4 3.1 9.3 8l-4.9 4.9L5.5 14l6-6Z',
        playVideo: 'M1 2h14v12H1Zm1.5 1.5v9h11v-9ZM6 5l5 3-5 3Z',
        externalSource: 'M8 1h7v7h-1.5V3.6L7.1 10 6 8.9l6.4-6.4H8ZM1 4h5v1.5H2.5v8h8V10H12v5H1Z',
        settings: 'M6.5 1h3l.5 2 1.8.8 1.8-.9 1.5 2.6-1.7 1.2v2.6l1.7 1.2-1.5 2.6-1.8-.9-1.8.8-.5 2h-3L6 13l-1.8-.8-1.8.9L.9 10.5l1.7-1.2V6.7L.9 5.5l1.5-2.6 1.8.9L6 3ZM8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'
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

    function showPrtsToast(message, type = 'info', detail = '', duration = 4000) {
        const container = ensurePrtsToastContainer();
        const toast = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'prts-toast-title';
        toast.appendChild(title);

        const detailEl = document.createElement('div');
        detailEl.className = 'prts-toast-detail';
        toast.appendChild(detailEl);
        container.appendChild(toast);

        let timeoutId;
        const update = (nextMessage, nextType = 'info', nextDetail = '', nextDuration = 4000) => {
            window.clearTimeout(timeoutId);
            const toastType = ['loading', 'success', 'warning', 'error'].includes(nextType) ? nextType : '';
            toast.className = `prts-toast${toastType ? ` ${toastType}` : ''}`;
            title.textContent = nextMessage;
            detailEl.textContent = nextDetail;
            detailEl.hidden = !nextDetail;
            if (nextDuration > 0) {
                timeoutId = window.setTimeout(() => {
                    toast.classList.add('is-leaving');
                    window.setTimeout(() => toast.remove(), 220);
                }, nextDuration);
            }
        };
        update(message, type, detail, duration);
        return update;
    }

    function createSvgIconFromPath(pathData, viewBox = '0 0 16 16') {
        const span = document.createElement('span');
        span.className = 'bp4-icon prts-icon';
        span.setAttribute('aria-hidden', 'true');

        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('viewBox', viewBox);
        svg.setAttribute('fill', 'currentColor');
        svg.setAttribute('fill-rule', 'evenodd');
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
                imported.dataset.prtsIcon = 'skland';
                return imported;
            }
        } catch (error) {
            console.warn('[Better PRTS] Failed to render Skland icon', error);
        }

        return createPrtsIcon('externalSource');
    }

    function createPrtsIcon(icon) {
        if (!icon) return null;
        if (icon === 'skland') return createSklandIconImage();
        if (!Object.hasOwn(PRTS_ICON_PATHS, icon)) return null;
        const element = createSvgIconFromPath(PRTS_ICON_PATHS[icon]);
        element.dataset.prtsIcon = icon;
        return element;
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

    function createAccountSelect(id, selectedId, onChange) {
        let select = document.getElementById(id);
        if (select?.tagName !== 'SELECT') {
            select?.remove();
            select = document.createElement('select');
            select.id = id;
            select.className = 'prts-account-select';
            select.setAttribute('aria-label', id === 'btn-account' ? '切换当前账号' : '选择导入目标账号');
        }
        const ids = getAccountIds();
        const signature = JSON.stringify(ids.map(accountId => [accountId, getAccountLabel(accountId)]));
        if (select.dataset.accounts !== signature) {
            select.replaceChildren(...ids.map(accountId => {
                const option = document.createElement('option');
                option.value = String(accountId);
                const label = getAccountLabel(accountId);
                option.textContent = label === getDefaultAccountLabel(accountId) ? label : `${label}（账号 ${accountId}）`;
                return option;
            }));
            select.dataset.accounts = signature;
        }
        const value = String(ids.includes(selectedId) ? selectedId : activeAccountId);
        if (select.value !== value) select.value = value;
        select.onchange = onChange;
        return select;
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
        cancelValue = null,
        extraAction = null,
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

            if (extraAction) {
                const extraBtn = document.createElement('button');
                extraBtn.type = 'button';
                extraBtn.className = 'prts-import-action';
                extraBtn.textContent = extraAction.text;
                extraBtn.onclick = () => closePrtsModal(extraAction.value);
                actions.appendChild(extraBtn);
                actions.classList.add('prts-modal-actions-extra');
            }
            actions.appendChild(cancelBtn);
            actions.appendChild(confirmBtn);

            dialog.appendChild(head);
            dialog.appendChild(body);
            dialog.appendChild(actions);
            backdrop.appendChild(dialog);

            const finish = value => closePrtsModal(value);
            const handleKeydown = event => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    finish(null);
                }
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
            cancelBtn.onclick = () => finish(cancelValue);
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
            window.setTimeout(() => (inputEl || (tone === 'danger' ? cancelBtn : confirmBtn)).focus(), 0);
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
    const RELEASE_LEVELS = { normal: '普通更新', important: '重要更新', urgent: '紧急更新' };

    function parseScriptVersion(version) {
        const match = typeof version === 'string' && version.match(/^(\d+(?:\.\d+){1,3})(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/);
        if (!match || version.length > 100) throw new Error('脚本版本号无效');
        const numbers = match[1].split('.').map(Number);
        if (!numbers.every(Number.isSafeInteger)) throw new Error('脚本版本号超出范围');
        return { numbers, prerelease: match[2]?.split('.') || [] };
    }

    function compareScriptVersions(left, right) {
        const a = parseScriptVersion(left);
        const b = parseScriptVersion(right);
        for (let i = 0; i < 4; i++) {
            const difference = (a.numbers[i] || 0) - (b.numbers[i] || 0);
            if (difference) return Math.sign(difference);
        }
        if (!a.prerelease.length || !b.prerelease.length) {
            return Number(!a.prerelease.length) - Number(!b.prerelease.length);
        }
        for (let i = 0; i < Math.max(a.prerelease.length, b.prerelease.length); i++) {
            const x = a.prerelease[i];
            const y = b.prerelease[i];
            if (x === undefined || y === undefined) return x === undefined ? -1 : 1;
            if (x === y) continue;
            const numericX = /^\d+$/.test(x);
            const numericY = /^\d+$/.test(y);
            if (numericX && numericY) {
                const difference = BigInt(x) - BigInt(y);
                if (difference) return difference > 0n ? 1 : -1;
                continue;
            }
            if (numericX !== numericY) return numericX ? -1 : 1;
            return x > y ? 1 : -1;
        }
        return 0;
    }

    function validateReleaseManifest(data) {
        if (!data || data.schemaVersion !== 1 || !Array.isArray(data.releases)) {
            throw new Error('更新说明格式无效');
        }
        const releases = [...data.releases];
        releases.forEach(release => {
            if (!release || typeof release !== 'object' || !Object.hasOwn(RELEASE_LEVELS, release.level) ||
                typeof release.notes !== 'string' || !release.notes.trim() || release.notes.length > 12000 ||
                release.humanWritten !== true) {
                throw new Error('每个版本必须填写更新级别和人工撰写的更新说明，并确认 humanWritten');
            }
            parseScriptVersion(release.version);
        });
        releases.sort((a, b) => compareScriptVersions(b.version, a.version));
        if (releases.some((release, index) => index && compareScriptVersions(release.version, releases[index - 1].version) === 0)) {
            throw new Error('更新说明包含重复版本');
        }
        return { schemaVersion: 1, releases };
    }
    const SCRIPT_RELEASE_URL = 'https://github.com/ntgmc/Better-PRTS-Plus/releases';
    const SCRIPT_UPDATE_URL = `${SCRIPT_RELEASE_URL}/latest/download/update.json`;
    const SCRIPT_UPDATE_URLS = [
        SCRIPT_UPDATE_URL,
        `https://gh-proxy.com/${SCRIPT_UPDATE_URL}`,
        `https://ghfast.top/${SCRIPT_UPDATE_URL}`
    ];
    const SCRIPT_IGNORED_VERSION_KEY = 'prts_plus_ignored_script_version';
    const SCRIPT_UPDATE_INTERVAL_MS = 60 * 60 * 1000;
    let scriptUpdatePending = null;
    let scriptUpdateManifest = null;
    let scriptUpdateCheckedAt = 0;
    let scriptUpdateAttemptedAt = 0;
    let scriptUpdatePromptedVersion = '';

    function getAvailableScriptUpdate(manifest, currentVersion) {
        const releases = validateReleaseManifest(manifest).releases.filter(release =>
            !parseScriptVersion(release.version).prerelease.length && compareScriptVersions(release.version, currentVersion) > 0);
        if (!releases.length) return null;
        const level = releases.some(release => release.level === 'urgent') ? 'urgent'
            : releases.some(release => release.level === 'important') ? 'important' : 'normal';
        return { version: releases[0].version, level, releases };
    }

    function downloadScriptUpdateManifest() {
        return downloadFirstValidJson(SCRIPT_UPDATE_URLS, data => {
            const manifest = validateReleaseManifest(data);
            const latest = manifest.releases.find(release => !parseScriptVersion(release.version).prerelease.length);
            const knownLatest = scriptUpdateManifest?.releases.find(release => !parseScriptVersion(release.version).prerelease.length);
            if ((latest && compareScriptVersions(latest.version, knownLatest?.version || GM_info.script.version) < 0) ||
                (!latest && knownLatest)) {
                throw new Error('更新说明早于当前已知版本');
            }
            return manifest;
        }, 1024 * 1024);
    }

    async function promptScriptUpdate(manifest, manual) {
        const currentVersion = GM_info.script.version;
        const update = getAvailableScriptUpdate(manifest, currentVersion);
        if (!update) {
            if (manual) showPrtsToast('当前已是最新正式版', 'success', `当前版本：${currentVersion}`);
            return false;
        }
        if (!manual && (scriptUpdatePromptedVersion === update.version ||
            GM_getValue(SCRIPT_IGNORED_VERSION_KEY, '') === update.version ||
            (CONFIG.importantUpdatesOnly && update.level === 'normal'))) return false;
        // 避免自动检查打断正在操作的子面板、导入或确认窗口；下一轮检查继续提示。
        if (document.getElementById('prts-modal') || document.getElementById('prts-import-dialog') ||
            (!manual && document.querySelector('.prts-submenu-panel.is-open'))) {
            if (manual) showPrtsToast('发现新版本', 'info', '请先关闭当前窗口，再点击“检查脚本更新”。');
            return false;
        }
        scriptUpdatePromptedVersion = update.version;
        const choice = await showScriptUpdateModal(update);
        try {
            if (choice === 'important') {
                const previous = CONFIG.importantUpdatesOnly;
                CONFIG.importantUpdatesOnly = true;
                try { saveConfig(); } catch (error) { CONFIG.importantUpdatesOnly = previous; throw error; }
                document.querySelectorAll('[data-prts-config-key="importantUpdatesOnly"]').forEach(input => { input.checked = true; });
                showPrtsToast('已改为仅提示重要和紧急更新', 'success');
            } else if (choice === 'skip') {
                GM_setValue(SCRIPT_IGNORED_VERSION_KEY, update.version);
            } else if (choice === true) {
                // 安装链接固定到已检测的版本，避免检查与安装之间切换版本。
                GM_openInTab(`${SCRIPT_RELEASE_URL}/download/v${encodeURIComponent(update.version)}/Better-PRTS-Plus.user.js`, { active: true, insert: true });
            }
        } catch (error) {
            scriptUpdatePromptedVersion = '';
            showPrtsToast('更新操作未完成', 'error', error.message || '请重试。');
        }
        return true;
    }

    function appendReleaseNoteText(container, text) {
        let offset = 0;
        // 只创建白名单节点；HTML 保留为文字，链接只允许 HTTP(S)。
        const tokens = /`([^`\n]+)`|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;
        for (const match of text.matchAll(tokens)) {
            container.appendChild(document.createTextNode(text.slice(offset, match.index)));
            const node = document.createElement(match[1] ? 'code' : match[2] ? 'strong' : match[3] ? 'em' : 'a');
            node.textContent = match[1] || match[2] || match[3] || match[4];
            if (match[5]) {
                node.href = match[5];
                node.target = '_blank';
                node.rel = 'noopener noreferrer';
            }
            container.appendChild(node);
            offset = match.index + match[0].length;
        }
        container.appendChild(document.createTextNode(text.slice(offset)));
    }

    function renderReleaseNotes(markdown) {
        const content = document.createElement('div');
        content.className = 'prts-release-notes';
        let list = null, paragraph = null;
        for (const line of markdown.split(/\r?\n/)) {
            if (!line.trim()) { list = null; paragraph = null; continue; }
            const heading = line.match(/^ {0,3}#{1,6}\s+(.+?)(?:\s+#+)?$/);
            const item = line.match(/^ {0,3}(?:[-+*]|(\d+)[.)])\s+(.+)$/);
            if (heading) {
                list = null; paragraph = null;
                const title = document.createElement('h4');
                appendReleaseNoteText(title, heading[1]);
                content.appendChild(title);
            } else if (item) {
                paragraph = null;
                const tag = item[1] ? 'ol' : 'ul';
                if (!list || list.tagName.toLowerCase() !== tag) {
                    list = document.createElement(tag);
                    if (item[1]) list.start = Number(item[1]);
                    content.appendChild(list);
                }
                const entry = document.createElement('li');
                appendReleaseNoteText(entry, item[2]);
                list.appendChild(entry);
            } else {
                if (list && /^\s+/.test(line)) {
                    appendReleaseNoteText(list.lastChild, '\n' + line.trim());
                    continue;
                }
                list = null;
                if (!paragraph) {
                    paragraph = document.createElement('p');
                    content.appendChild(paragraph);
                } else paragraph.appendChild(document.createTextNode('\n'));
                appendReleaseNoteText(paragraph, line);
            }
        }
        return content;
    }

    function showScriptUpdateModal(update, preview = false) {
        const message = document.createElement('div');
        message.className = 'prts-update-notes';
        const versions = document.createElement('p');
        versions.textContent = `当前版本：${GM_info.script.version}\n新版本：${update.version} · ${RELEASE_LEVELS[update.level]}`;
        message.appendChild(versions);
        for (const release of update.releases) {
            const title = document.createElement('h3');
            title.textContent = `${release.version} · ${RELEASE_LEVELS[release.level]}`;
            message.appendChild(title);
            message.appendChild(renderReleaseNotes(release.notes));
        }
        const hint = document.createElement('p');
        hint.textContent = preview ? '当前为样式预览，下方按钮只显示点击反馈。'
            : '点击“立即更新”后，请在油猴页面确认安装，再刷新当前页面。';
        message.appendChild(hint);
        return showPrtsModal({
            title: preview ? 'Better-PRTS-Plus 更新弹窗预览' : 'Better-PRTS-Plus 发现新版本', message,
            extraAction: { text: '仅重要更新提示', value: 'important' },
            cancelText: '当前版本不再提示', cancelValue: 'skip', confirmText: '立即更新'
        });
    }

    async function previewScriptUpdate(level = 'important') {
        if (!Object.hasOwn(RELEASE_LEVELS, level)) throw new Error('更新级别无效');
        if (document.getElementById('prts-modal') || document.getElementById('prts-import-dialog')) {
            showPrtsToast('请先关闭当前窗口', 'info', '关闭后可继续预览更新弹窗。');
            return false;
        }
        const release = {
            version: '99.0.0', level,
            notes: '这是一份用于测试弹窗样式的示例说明。\n\n### 新增\n\n- 显示新版本号、**更新级别**和分类更新说明。\n\n### 优化\n\n- 可切换网站的浅色、深色或高对比度主题，多次预览。\n\n### 修复\n\n- 在窄屏下检查长文本换行，确认内容显示完整，底部操作按钮清晰可用。'
        };
        const choice = await showScriptUpdateModal({ ...release, releases: [release] }, true);
        if (choice !== null) {
            const action = choice === 'important' ? '仅重要更新提示' : choice === 'skip' ? '当前版本不再提示' : '立即更新';
            showPrtsToast('预览操作', 'info', `已点击“${action}”。`);
        }
        return choice;
    }

    betterPrtsDebug.previewScriptUpdate = previewScriptUpdate;

    function checkScriptUpdates(manual = false) {
        if (scriptUpdatePending) return scriptUpdatePending;
        if (!manual && !scriptUpdateManifest && Date.now() - scriptUpdateAttemptedAt < 5 * 60 * 1000) return Promise.resolve(false);
        scriptUpdatePending = (async () => {
            try {
                if (manual || !scriptUpdateManifest || Date.now() - scriptUpdateCheckedAt >= SCRIPT_UPDATE_INTERVAL_MS) {
                    scriptUpdateAttemptedAt = Date.now();
                    scriptUpdateManifest = await downloadScriptUpdateManifest();
                    scriptUpdateCheckedAt = Date.now();
                }
                return await promptScriptUpdate(scriptUpdateManifest, manual);
            } catch (error) {
                console.warn('[Better PRTS] 检查脚本更新失败', error);
                if (manual) showPrtsToast('检查脚本更新失败', 'error',
                    error instanceof AggregateError ? '所有更新下载源均不可用，请稍后重试。' : error.message || '请稍后重试。');
                return false;
            }
        })().finally(() => { scriptUpdatePending = null; });
        return scriptUpdatePending;
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
                    if (candidate.parsedContent || candidate.opers !== undefined || candidate.groups !== undefined || typeof candidate.content === 'string') {
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

    function matchOperatorGroups(requiredGroups, ownedOpsSet, usedOwnedOps, allowUnknownFallbackGroup,
        checkTraining, unknownTraining = [], lowTraining = [], trainingIssues = []) {
        const groups = requiredGroups
            .map((group, index) => {
                const allowedNames = (group.opers || [])
                    .map(o => o.name)
                    .filter(Boolean);
                const candidates = (group.opers || [])
                    .filter(op => ownedOpsSet.has(op.name) && !usedOwnedOps.has(op.name))
                    .filter(op => !checkTraining || checkTraining(op).status !== 'low')
                    .sort((left, right) => checkTraining
                        ? Number(checkTraining(left).status === 'unknown') - Number(checkTraining(right).status === 'unknown')
                        : 0)
                    .map(op => op.name);
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
                if (checkTraining) {
                    const low = (requiredGroups[group.index].opers || [])
                        .filter(op => ownedOpsSet.has(op.name) && checkTraining(op).status === 'low')
                        .map(op => {
                            const result = checkTraining(op);
                            trainingIssues.push({ name: op.name, group: group.name, ...result });
                            return `${op.name}：${result.detail}`;
                        });
                    if (low.length) lowTraining.push(`[${group.name}] ${low.join(' / ')}`);
                }
            }
        });

        matchedByOperator.forEach((group, opName) => {
            usedOwnedOps.add(opName);
            if (checkTraining) {
                const op = requiredGroups[group.index].opers.find(candidate => candidate.name === opName);
                const result = checkTraining(op);
                if (result.status === 'unknown') {
                    unknownTraining.push(`${opName}：${result.detail}`);
                    trainingIssues.push({ name: opName, group: group.name, ...result });
                }
            }
        });

        return missingGroups;
    }

    function getParsedOperationContent(operation) {
        let parsed = operation?.parsedContent;
        if (parsed == null) {
            if (operation?.opers !== undefined || operation?.groups !== undefined) {
                parsed = operation;
            } else if (typeof operation?.content === 'string' && operation.content.trim()) {
                parsed = safeJsonParse(operation.content, undefined);
                if (parsed === undefined) throw new Error('作业 JSON 格式异常。');
            }
        }

        const requiredOps = parsed?.opers ?? [];
        const requiredGroups = parsed?.groups ?? [];
        if ((parsed != null && !isPlainRecord(parsed)) ||
            !Array.isArray(requiredOps) || !Array.isArray(requiredGroups) ||
            !requiredOps.every(hasNamedOperatorEntry) ||
            !requiredGroups.every(group => isPlainRecord(group) &&
                (group.opers == null || (Array.isArray(group.opers) && group.opers.every(hasNamedOperatorEntry))))) {
            throw new Error('作业干员数据格式异常。');
        }
        return { requiredOps, requiredGroups };
    }

    function hasNamedOperatorEntry(entry) {
        return isPlainRecord(entry) && typeof entry.name === 'string' && entry.name.trim().length > 0;
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

    function checkOperatorTraining(op, training) {
        const requirements = op?.requirements;
        if (!requirements || typeof requirements !== 'object') return { status: 'ok' };
        const details = [];
        const unknown = [];
        const issues = [];
        const addIssue = (label, current, required, status = 'low') => {
            issues.push({ label, current, required, status });
        };
        const check = (label, required, actual) => {
            if (!Number.isInteger(required) || required < 0) return;
            const unit = label === '潜能' ? '潜' : '级';
            if (!Number.isInteger(actual)) {
                unknown.push(label);
                addIssue(label, '未知', `${required}${unit}`, 'unknown');
            } else if (actual < required) {
                details.push(`${label} ${actual}/${required}`);
                addIssue(label, `${actual}${unit}`, `${required}${unit}`);
            }
        };
        const eliteText = elite => ['', '精一', '精二'][elite] ?? '精英化未知';
        if (Number.isInteger(requirements.level) && requirements.level > 0) {
            const requiredElite = Number.isInteger(requirements.elite) ? eliteText(requirements.elite) : '';
            if (!Number.isInteger(training?.elite) || !Number.isInteger(training?.level)) {
                unknown.push('等级');
                addIssue('等级', '未知', `${requiredElite}${requirements.level}级`, 'unknown');
            }
            else if (Number.isInteger(requirements.elite) && requirements.elite >= 0
                ? training.elite < requirements.elite ||
                  (training.elite === requirements.elite && training.level < requirements.level)
                : training.level < requirements.level) {
                details.push(`当前${eliteText(training.elite)}${training.level}级，要求${requiredElite}${requirements.level}级`);
                addIssue('等级', `${eliteText(training.elite)}${training.level}级`, `${requiredElite}${requirements.level}级`);
            }
        }
        if (requirements.elite > 0) {
            if (!Number.isInteger(training?.elite)) {
                if (!unknown.includes('等级')) {
                    unknown.push('精英化');
                    addIssue('精英化', '未知', eliteText(requirements.elite), 'unknown');
                }
            } else if (training.elite < requirements.elite && !details.some(detail => detail.startsWith('当前'))) {
                details.push(`当前${eliteText(training.elite) || '无'}，要求${eliteText(requirements.elite)}`);
                addIssue('精英化', eliteText(training.elite) || '未精英化', eliteText(requirements.elite));
            }
        }
        if (Number.isInteger(requirements.skill_level) && requirements.skill_level > 0) {
            const skill = Number(op.skill);
            const mastery = skill >= 1 && skill <= 3 ? training?.[`skill${skill}`] : undefined;
            const actual = Number.isInteger(training?.mainSkill)
                ? training.mainSkill === 7 && requirements.skill_level > 7
                    ? Number.isInteger(mastery) ? 7 + mastery : undefined
                    : training.mainSkill
                : undefined;
            const skillText = level => ({ 8: '专一', 9: '专二', 10: '专三' }[level] || `${level}级`);
            const skillLabel = Number.isInteger(skill) && skill >= 1 && skill <= 3 ? `${skill}技能` : '技能';
            if (requirements.skill_level > 7 && (!Number.isInteger(skill) || skill < 1 || skill > 3)) {
                unknown.push('技能编号');
                addIssue('技能编号未标注', '未知', skillText(requirements.skill_level), 'unknown');
            } else if (!Number.isInteger(actual)) {
                unknown.push('技能');
                addIssue(skillLabel, '未知', skillText(requirements.skill_level), 'unknown');
            } else if (actual < requirements.skill_level) {
                details.push(`${skillLabel}当前${skillText(actual)}，要求${skillText(requirements.skill_level)}`);
                addIssue(skillLabel, skillText(actual), skillText(requirements.skill_level));
            }
        }
        const moduleType = { 1: 'X', 2: 'Y', 3: 'D', 4: 'A', 5: 'B' }[requirements.module];
        if (moduleType) {
            const moduleLevel = requirements.module_level > 0 ? requirements.module_level : 1;
            check(`模组${moduleType}`, moduleLevel, training?.[`mod${moduleType}`]);
        }
        check('潜能', requirements.potential, training?.potential);
        if (details.length) return { status: 'low', detail: details.join('、'), issues };
        return unknown.length ? { status: 'unknown', detail: `${unknown.join('、')}数据未知`, issues } : { status: 'ok' };
    }

    /**
     * 干员与干员组的可用性判定
     */
    function checkOperationAvailability(operation, ownedOpsSet, filterMode, training = {}, checkTraining = false) {
        if (!ownedOpsSet || ownedOpsSet.size === 0 || (filterMode === 'NONE' && !checkTraining)) {
            return { isAvailable: true, missingCount: 0, missingOps:[], lowTraining: [], unknownTraining: [], trainingIssues: [], hasRequirements: false };
        }

        const { requiredOps, requiredGroups } = getParsedOperationContent(operation);

        if (requiredOps.length === 0 && requiredGroups.length === 0) {
            return { isAvailable: true, missingCount: 0, missingOps:[], lowTraining: [], unknownTraining: [], trainingIssues: [], hasRequirements: false };
        }

        const usedOwnedOps = new Set();
        const missingDetails =[];
        const lowTraining = [];
        const unknownTraining = [];
        const trainingIssues = [];
        const hasRequirements = [...requiredOps, ...requiredGroups.flatMap(group => group.opers || [])]
            .some(op => op?.requirements && Object.values(op.requirements).some(value => Number.isInteger(value) && value > 0));
        const evaluate = op => checkOperatorTraining(op, training[op.name]);

        requiredOps.forEach(op => {
            const opName = op.name;
            if (operation._isFallback && !OP_ID_MAP[opName]) return; // 忽略错抓的非干员词汇

            if (ownedOpsSet.has(opName)) {
                const result = checkTraining ? evaluate(op) : { status: 'ok' };
                if (result.status !== 'ok') trainingIssues.push({ name: opName, ...result });
                if (result.status === 'low') {
                    missingDetails.push(opName);
                    lowTraining.push(`${opName}：${result.detail}`);
                } else {
                    usedOwnedOps.add(opName);
                    if (result.status === 'unknown') unknownTraining.push(`${opName}：${result.detail}`);
                }
            } else {
                missingDetails.push(opName);
            }
        });

        if (requiredGroups.length > 0) {
            const missingGroups = matchOperatorGroups(requiredGroups, ownedOpsSet, usedOwnedOps, operation._isFallback,
                checkTraining ? evaluate : null, unknownTraining, lowTraining, trainingIssues);
            missingDetails.push(...missingGroups);
        }

        const missingCount = missingDetails.length;
        let isAvailable = true;

        if (filterMode === 'PERFECT' && missingCount > 0) {
            isAvailable = false;
        } else if (filterMode === 'SUPPORT' && missingCount > 1) {
            isAvailable = false;
        }

        return { isAvailable, missingCount, missingOps: missingDetails, lowTraining, unknownTraining, trainingIssues, hasRequirements };
    }
    // =========================================================================
    //                            MODULE 4: 数据存取与账号管理
    // =========================================================================

    function getCurrentAccountState() {
        return createAccountState({ activeAccountId, nextAccountId, accountsData, accountsTraining, accountMeta });
    }

    function publishAccountState(value) {
        const state = createAccountState(value);
        activeAccountId = state.activeAccountId;
        nextAccountId = state.nextAccountId;
        accountsData = state.accountsData;
        accountsTraining = state.accountsTraining;
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
        LEGACY_ACCOUNT_IDS.forEach(id => {
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
            console.warn('[Better PRTS] 账号数据兼容诊断', diagnostic.code, diagnostic.source);
        });
    }

    /**
     * 加载干员数据，迁移旧版存储格式。
     */
    function loadOwnedOps() {
        const resolved = resolveStoredAccountState(readAccountStorageSnapshot());
        reportAccountStateDiagnostics(resolved.diagnostics);
        if (resolved.migrated) {
            commitAccountState(resolved.state);
        } else {
            publishAccountState(resolved.state);
        }
        console.log(`[Better PRTS] 已加载账号 ${activeAccountId} 的 ${ownedOpsSet.size} 名干员`);
    }

    /**
     * 执行账号切换
     */
    function switchAccount(id) {
        const restoreFocus = document.activeElement?.id === 'btn-account';
        try {
            const latest = resolveStoredAccountState(readAccountStorageSnapshot()).state;
            commitAccountState(createAccountSwitchState(latest, id));
            refreshAccountStateUi();
            if (restoreFocus) document.getElementById('btn-account')?.focus({ preventScroll: true });
        } catch (error) {
            showPrtsToast('切换账号失败', 'error', error.message);
        }
    }

    // 给主控制栏用的循环切换
    function cycleAccount() {
        const ids = getAccountIds();
        switchAccount(ids[(ids.indexOf(activeAccountId) + 1) % ids.length]);
    }

    function refreshAccountControls() {
        const canRemove = getAccountIds().length > 1;
        document.querySelectorAll('.prts-account-list').forEach(renderAccountList);
        document.querySelectorAll('.prts-account-select').forEach(select => {
            const previousId = Number(select.value);
            createAccountSelect(select.id, select.id === 'btn-account' ? activeAccountId : previousId, select.onchange);
            if (select.id !== 'btn-account' && Number(select.value) !== previousId && !select.disabled) select.onchange?.();
        });
        document.querySelectorAll('.prts-acc-btn').forEach(btn => {
            const id = normalizeAccountId(btn.dataset.id);
            const label = getAccountLabel(id);
            btn.querySelector('.prts-account-name').textContent = label;
            btn.querySelector('.prts-account-count').textContent = `${getAccountOperatorCount(id)} 名干员`;
            btn.title = formatAccountSklandTitle(id);
            btn.setAttribute('aria-label', `切换到 ${label}`);
            btn.setAttribute('aria-pressed', String(id === activeAccountId));
            btn.classList.toggle('active', id === activeAccountId);
            const row = btn.closest('.prts-account-row');
            row.classList.toggle('is-active', id === activeAccountId);
            row.querySelector('.prts-account-rename').setAttribute('aria-label', `重命名 ${label}`);
            const removeButton = row.querySelector('.prts-account-delete');
            removeButton.setAttribute('aria-label', `删除 ${label}`);
            removeButton.disabled = !canRemove;
            removeButton.title = canRemove ? `删除 ${label}` : '至少需要保留一个账号';

            const syncMetaEl = btn.querySelector('.prts-account-sync-meta');
            if (syncMetaEl) {
                const meta = getAccountSklandSyncMeta(id);
                syncMetaEl.textContent = meta ? `森空岛 · ${new Date(meta.importedAt).toLocaleString(undefined, {
                    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
                })}` : '';
                syncMetaEl.classList.toggle('is-visible', Boolean(meta));
            }
        });

        document.querySelectorAll('[data-prts-config-key]').forEach(input => {
            const key = input.dataset.prtsConfigKey;
            if (key && Object.prototype.hasOwnProperty.call(CONFIG, key)) {
                if (input.tagName === 'BUTTON') input.setAttribute('aria-pressed', String(input.value === CONFIG[key]));
                else input.checked = CONFIG[key] === true;
            }
        });
        updateSettingsReloadNotice();
    }

    function refreshAccountStateUi(forceFilterUpdate = false) {
        const bar = document.getElementById('prts-filter-bar');
        if (bar) bar.remove();
        injectFilterControls();
        refreshAccountControls();
        updateFloatingLayout();
        applySidebarCollapse();
        if (forceFilterUpdate || CONFIG.filterMode !== 'NONE' || CONFIG.trainingCheck) requestFilterUpdate();
    }

    async function confirmOperatorImport(accountId, names, training, sourceLabel) {
        const id = normalizeAccountId(accountId);
        while (true) {
            const resolved = resolveStoredAccountState(readAccountStorageSnapshot());
            reportAccountStateDiagnostics(resolved.diagnostics);
            const state = resolved.state;
            requireAccount(state, id);
            const diff = getOperatorImportDiff(state.accountsData[id], names, state.accountsTraining[id], training);
            const danger = diff.removed > 0 || diff.decreasedTrainingNames.length > 0 || diff.clearedTrainingNames.length > 0;
            const lines = [
                `导入到：${state.accountMeta[id].label}（账号 ${id}）`,
                `来源：${sourceLabel || '导入内容'}`,
                `当前 ${state.accountsData[id].length} 名 → 导入后 ${diff.total} 名`,
                `新增 ${diff.added} 名 / 移除 ${diff.removed} 名`,
                diff.trainingCount ? `含练度数据：${diff.trainingCount} / ${diff.total} 名干员` : '不包含练度数据',
                '导入会替换此账号的干员名单和练度。'
            ];
            if (diff.removed) lines.push(`将移除 ${diff.removed} 名干员：${diff.removedNames.join('、')}`);
            if (diff.decreasedTrainingNames.length) {
                lines.push(`练度将降低的干员（${diff.decreasedTrainingNames.length} 名）：${diff.decreasedTrainingNames.join('、')}`);
            }
            if (diff.clearedTrainingNames.length) {
                lines.push(`将清空部分或全部练度的干员（${diff.clearedTrainingNames.length} 名）：${diff.clearedTrainingNames.join('、')}`);
            }
            if (danger) lines.push('请核对目标账号和数据来源，再确认是否覆盖已有数据。');
            const confirmed = await showPrtsConfirm({
                title: danger ? '导入将覆盖已有数据' : '导入预览',
                message: lines.join('\n'),
                confirmText: danger ? '确认覆盖并导入' : '确认导入',
                cancelText: '取消',
                tone: danger ? 'danger' : ''
            });
            if (!confirmed) return null;

            const latest = resolveStoredAccountState(readAccountStorageSnapshot()).state;
            if (['accountsData', 'accountsTraining', 'accountMeta'].some(key =>
                JSON.stringify(state[key][id]) !== JSON.stringify(latest[key][id]))) continue;
            return latest;
        }
    }

    async function renameAccount(id) {
        const accountId = normalizeAccountId(id);
        const currentLabel = getAccountLabel(accountId);
        const rawLabel = await showPrtsPrompt({
            title: `重命名账号 ${accountId}`,
            message: '填写新的账号昵称，留空恢复默认名称。',
            inputLabel: '账号昵称',
            defaultValue: currentLabel,
            maxLength: ACCOUNT_LABEL_MAX_LENGTH,
            confirmText: '保存',
            cancelText: '取消'
        });
        if (rawLabel === null) return;

        try {
            const latest = resolveStoredAccountState(readAccountStorageSnapshot()).state;
            commitAccountState(createRenamedAccountState(latest, accountId, rawLabel));
            refreshAccountStateUi();
            showPrtsToast('账号名称已更新', 'success', `${getAccountLabel(accountId)} / ${getAccountOperatorCount(accountId)} 名干员`);
        } catch (error) {
            showPrtsToast('重命名失败', 'error', error.message);
        }
    }

    async function addAccount() {
        const label = await showPrtsPrompt({
            title: '添加账号', message: '填写账号昵称，留空使用默认名称。', inputLabel: '账号昵称',
            maxLength: ACCOUNT_LABEL_MAX_LENGTH, confirmText: '添加', cancelText: '取消'
        });
        if (label === null) return;
        try {
            const latest = resolveStoredAccountState(readAccountStorageSnapshot()).state;
            commitAccountState(createAddedAccountState(latest, label));
            refreshAccountStateUi();
            showPrtsToast('账号已添加', 'success', `已切换到 ${getAccountLabel(activeAccountId)}，可导入干员数据。`);
        } catch (error) {
            showPrtsToast('添加账号失败', 'error', error.message);
        }
    }

    async function removeAccount(accountId) {
        try {
            while (true) {
                const state = resolveStoredAccountState(readAccountStorageSnapshot()).state;
                const id = requireAccount(state, accountId);
                if (getAccountIds(state.accountsData).length <= 1) throw new Error('至少需要保留一个账号。');
                const confirmed = await showPrtsConfirm({
                    title: '删除账号',
                    message: `确认删除 ${state.accountMeta[id].label}（账号 ${id}）？该账号的干员名单（${state.accountsData[id].length} 名）、练度和同步记录将一并删除，无法撤销。`,
                    confirmText: '确认删除', cancelText: '取消', tone: 'danger'
                });
                if (!confirmed) return;
                const latest = resolveStoredAccountState(readAccountStorageSnapshot()).state;
                if (['accountsData', 'accountsTraining', 'accountMeta'].some(key =>
                    JSON.stringify(state[key][id]) !== JSON.stringify(latest[key][id]))) continue;
                commitAccountState(createRemovedAccountState(latest, id));
                refreshAccountStateUi(true);
                document.getElementById('prts-add-account')?.focus({ preventScroll: true });
                showPrtsToast('账号已删除', 'success');
                return;
            }
        } catch (error) {
            showPrtsToast('删除账号失败', 'error', error.message);
        }
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
            `切换到 ${label}（账号 ${accountId}）`,
            `${getAccountOperatorCount(accountId)} 名干员`
        ];
        const skland = getAccountSklandSyncMeta(accountId);
        const sklandSummary = formatSklandSyncSummary(skland, { includeDetail: true });
        if (sklandSummary) lines.push(sklandSummary);
        return lines.join('\n');
    }

    function getBackupPreferences() {
        return {
            filterMode: CONFIG.filterMode,
            trainingCheck: CONFIG.trainingCheck,
            displayMode: CONFIG.displayMode,
            config: Object.fromEntries(Object.entries(CONFIG_DEFINITIONS)
                .filter(([, definition]) => definition.group)
                .map(([key]) => [key, CONFIG[key]])),
            floatingPosition: parseFloatingPosition(CONFIG.floatingPosition)
        };
    }

    function buildAccountsBackup() {
        const state = getCurrentAccountState();

        return {
            type: ACCOUNT_BACKUP_TYPE,
            version: ACCOUNT_BACKUP_VERSION,
            exportedAt: new Date().toISOString(),
            activeAccountId: state.activeAccountId,
            nextAccountId: state.nextAccountId,
            accountsData: state.accountsData,
            accountsTraining: state.accountsTraining,
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
        const config = normalizeConfig({
            ...rawConfig, filterMode: raw.filterMode, trainingCheck: raw.trainingCheck,
            displayMode: raw.displayMode, floatingPosition: raw.floatingPosition
        });
        return {
            filterMode: config.filterMode,
            trainingCheck: config.trainingCheck,
            displayMode: config.displayMode,
            config: Object.fromEntries(Object.entries(CONFIG_DEFINITIONS)
                .filter(([, definition]) => definition.group)
                .map(([key]) => [key, config[key]])),
            floatingPosition: config.floatingPosition
        };
    }

    function parseAccountsBackup(value) {
        if (Array.isArray(value)) {
            throw new Error('这看起来是单个账号的干员名单，请使用“导入干员数据”。');
        }
        if (!isPlainRecord(value)) {
            throw new Error('这不是有效的 Better-PRTS-Plus 全部配置备份。');
        }
        if (value.type !== ACCOUNT_BACKUP_TYPE || value.version !== ACCOUNT_BACKUP_VERSION) {
            throw new Error('备份格式不匹配，请选择 Better-PRTS-Plus 导出的全部配置文件。');
        }

        return {
            ...createAccountState(value),
            preferences: normalizeBackupPreferences(value.preferences)
        };
    }

    function formatAccountsBackupSummary(backup) {
        const lines = [
            `将用备份中的 ${getAccountIds(backup.accountsData).length} 个账号覆盖当前全部账号、账号昵称和脚本设置。`,
            `导入后将切换到：${backup.accountMeta[backup.activeAccountId].label}`,
            ''
        ];

        getAccountIds(backup.accountsData).forEach(id => {
            lines.push(`${backup.accountMeta[id].label}：${backup.accountsData[id].length} 名干员`);
        });
        lines.push('');
        lines.push('确认继续导入？');
        return lines.join('\n');
    }

    function applyAccountsBackup(backup) {
        const nextState = createAccountState(backup);
        const preferences = normalizeBackupPreferences(backup.preferences);
        const nextConfig = normalizeConfig({ ...preferences.config, ...preferences });
        commitAccountState(nextState);
        Object.assign(CONFIG, nextConfig);
        saveConfig();

        refreshAccountStateUi(true);
        syncPageScaffold();
        document.querySelectorAll(BP_SELECTORS.portal).forEach(enhancePopover);
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
                    showPrtsToast('全部配置导入成功', 'success', `已切换到 ${getAccountLabel(activeAccountId)}。`);
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
    //                            MODULE 5: 干员导入与筛选控件
    // =========================================================================

    function isFilterDisabledPage() {
        const path = window.location.pathname;
        return path.startsWith('/create') || path.startsWith('/editor');
    }

    function getImportErrorMessage(error) {
        return error instanceof Error ? error.message : '未知错误';
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

    async function applyImportedOperatorNames(accountId, names, sourceLabel, statusEl, training = {}) {
        const targetAccountId = normalizeAccountId(accountId);
        const sanitizedNames = sanitizeOperatorNames(names);
        if (sanitizedNames.length === 0) {
            const message = '未能识别有效的干员数据，请检查 JSON/TXT 内容。';
            setOperatorImportStatus(statusEl, message, 'warning');
            showPrtsToast('未能识别有效的干员数据', 'warning', '请检查文件或粘贴内容后重试。');
            return false;
        }

        const nextState = await confirmOperatorImport(targetAccountId, sanitizedNames, training, sourceLabel);
        if (!nextState) {
            setOperatorImportStatus(statusEl, '已取消导入，未修改账号数据。');
            return false;
        }
        const accountLabel = nextState.accountMeta[targetAccountId].label;
        const diff = getOperatorImportDiff(nextState.accountsData[targetAccountId], sanitizedNames);
        const diffText = formatOperatorImportDiff(diff);
        const sourceText = sourceLabel ? `来源：${sourceLabel}` : '来源：导入内容';
        const unrecognizedNames = sanitizedNames.filter(name => !Object.prototype.hasOwnProperty.call(OP_ID_MAP, name));
        const recognitionText = `已识别 ${sanitizedNames.length - unrecognizedNames.length} 名 / 未识别 ${unrecognizedNames.length} 名`;

        nextState.accountsData[targetAccountId] = sanitizedNames;
        nextState.accountsTraining[targetAccountId] = training;
        commitAccountState(nextState);
        refreshAccountStateUi();

        const type = unrecognizedNames.length ? 'warning' : 'success';
        const message = unrecognizedNames.length ? `${accountLabel} 导入完成，请核对未识别名称` : `${accountLabel} 导入成功`;
        const detail = [diffText, sourceText, recognitionText];
        if (unrecognizedNames.length) {
            detail.push(`未识别名称：${unrecognizedNames.join('、')}`, '这些名称已保留，请核对拼写；新干员可能尚未收录。');
        }
        setOperatorImportStatus(statusEl, `${message}\n${detail.join('\n')}`, type);
        showPrtsToast(message, type, detail.join('\n'));
        return true;
    }

    function readOperatorImportFile(accountId, file, statusEl) {
        if (!file) return Promise.resolve(false);

        if (file.size > OPERATOR_IMPORT_MAX_BYTES) {
            const message = '文件过大，请选择较小的 JSON/TXT 干员数据文件。';
            setOperatorImportStatus(statusEl, message, 'error');
            showPrtsToast('导入失败', 'error', message);
            return Promise.resolve(false);
        }

        setOperatorImportStatus(statusEl, `正在读取 ${file.name || '导入文件'}…`, 'loading');
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = async event => {
                try {
                    const { names, training } = parseImportedOperators(event.target.result, file.name);
                    resolve(await applyImportedOperatorNames(accountId, names, file.name || '文件导入', statusEl, training));
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

        const targetAccountId = normalizeAccountId(activeAccountId);
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
        title.textContent = `导入到 ${getAccountLabel(targetAccountId)}`;
        const subtitle = document.createElement('p');
        subtitle.className = 'prts-import-subtitle';
        subtitle.textContent = '选择文件或粘贴 JSON/TXT 文本，核对预览并确认后，会替换此账号的干员名单和练度。';
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
        textarea.placeholder = '每行填写一个干员名称，或粘贴 MAA 导出的 JSON 内容';

        const help = document.createElement('p');
        help.id = 'prts-import-dialog-help';
        help.className = 'prts-import-help';
        help.textContent = 'TXT 每行填写一个干员名；空行及以 # 或 // 开头的行会被忽略。';

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
        cancelBtn.textContent = '关闭';
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
            await readOperatorImportFile(targetAccountId, file, status);
            setBusy(false);
            fileInput.value = '';
        };

        pasteBtn.onclick = async () => {
            const rawText = textarea.value;
            if (!rawText.trim()) {
                const message = '请先粘贴 JSON 内容，或每行填写一个干员名称。';
                setOperatorImportStatus(status, message, 'error');
                showPrtsToast('无法导入空内容', 'error', message);
                textarea.focus();
                return;
            }

            setBusy(true);
            try {
                const { names, training } = parseImportedOperators(rawText, '');
                await applyImportedOperatorNames(targetAccountId, names, '粘贴内容', status, training);
            } catch (error) {
                const message = getImportErrorMessage(error);
                console.error('[Better PRTS] 粘贴导入干员数据失败', error);
                setOperatorImportStatus(status, `导入失败：${message}`, 'error');
                showPrtsToast('导入失败', 'error', message);
            } finally {
                setBusy(false);
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
            if (document.getElementById('prts-modal')) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                closeOperatorImportDialog();
            }
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
                ? '请登录森空岛，然后在页面右侧的 Better-PRTS-Plus 导入面板中读取干员数据。'
                : '如果没有看到新窗口，请手动打开 https://www.skland.com/index，登录后使用 Better-PRTS-Plus 导入面板。'
        );
    }

    function toggleDisplayMode() {
        CONFIG.displayMode = (CONFIG.displayMode === 'GRAY') ? 'HIDE' : 'GRAY';
        saveConfig();
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
        CONFIG.filterMode = normalizeFilterMode(CONFIG.filterMode === mode ? 'NONE' : mode);
        saveConfig();
        updateFilterButtonStyles();
        requestFilterUpdate();
    }

    function toggleTrainingCheck() {
        if (ownedOpsSet.size === 0) {
            showPrtsToast('请先导入干员数据', 'warning', `当前账号：${getAccountLabel(activeAccountId)}`);
            return;
        }
        CONFIG.trainingCheck = !CONFIG.trainingCheck;
        saveConfig();
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
        const trainingBtn = document.getElementById('btn-training');
        if (!perfectBtn || !supportBtn) return;

        perfectBtn.classList.remove('prts-active');
        supportBtn.classList.remove('prts-active');
        perfectBtn.setAttribute('aria-pressed', CONFIG.filterMode === 'PERFECT' ? 'true' : 'false');
        supportBtn.setAttribute('aria-pressed', CONFIG.filterMode === 'SUPPORT' ? 'true' : 'false');

        if (CONFIG.filterMode === 'PERFECT') perfectBtn.classList.add('prts-active');
        else if (CONFIG.filterMode === 'SUPPORT') supportBtn.classList.add('prts-active');
        if (trainingBtn) {
            trainingBtn.classList.toggle('prts-active', CONFIG.trainingCheck);
            trainingBtn.setAttribute('aria-pressed', String(CONFIG.trainingCheck));
        }
    }

    let filterResults = null;

    function renderFilterResults(stats = filterResults) {
        filterResults = stats;
        const root = getOperationListRoot();
        const list = root && root !== document ? root.querySelector('ul.grid') : null;
        const container = root === document ? document.getElementById('prts-filter-bar') : list?.parentElement;
        let results = document.getElementById('prts-filter-results');
        if (!container || isFilterDisabledPage()) {
            results?.remove();
            return;
        }
        if (!results) {
            results = document.createElement('div');
            results.id = 'prts-filter-results';
            results.setAttribute('role', 'status');
            results.setAttribute('aria-live', 'polite');
            results.setAttribute('aria-atomic', 'true');
            const summary = document.createElement('p');
            summary.className = 'prts-filter-summary';
            const empty = document.createElement('div');
            empty.className = 'prts-filter-empty';
            const message = document.createElement('p');
            message.className = 'prts-filter-empty-message';
            empty.appendChild(message);
            empty.appendChild(createPrtsButton({
                id: 'btn-filter-show-all', text: '切换为置灰模式', icon: 'showAll',
                onClick: () => {
                    toggleDisplayMode();
                    const activeRoot = getOperationListRoot();
                    (activeRoot === document ? document.getElementById('btn-setting') : activeRoot)?.focus();
                }
            }));
            results.appendChild(summary);
            results.appendChild(empty);
        }

        if (list) {
            if (list.previousElementSibling !== results) container.insertBefore(results, list);
        } else if (container.lastChild !== results) {
            container.appendChild(results);
        }

        const scope = list ? '本作业集' : '本页';
        let summaryText = `正在统计${scope}作业…`;
        let messageText = '';
        let showAll = false;
        if (stats) {
            const filtering = ownedOpsSet.size > 0 && (CONFIG.filterMode !== 'NONE' || CONFIG.trainingCheck);
            summaryText = `${scope} ${stats.totalCards} 份作业`;
            if (filtering) {
                summaryText += `，可用 ${stats.availableCards} 份，需助战 ${stats.supportCards} 份，待核验 ${stats.pendingCards} 份，不符合 ${stats.unavailableCards} 份`;
            } else if (stats.totalCards) {
                summaryText += ownedOpsSet.size ? '，未开启筛选' : '，请先导入干员数据后筛选';
            }
            if (stats.hiddenVideoCards) summaryText += `，已隐藏视频作业 ${stats.hiddenVideoCards} 份`;
            summaryText += '。';

            if (!stats.totalCards) {
                messageText = list ? '本作业集暂无作业。' : '当前页面暂无作业。正在加载时请稍候，也可调整搜索条件或翻页。';
            } else if (stats.hiddenVideoCards === stats.totalCards) {
                messageText = `${scope}全部是视频作业，已隐藏。可在悬浮球 → 作业卡片中关闭“隐藏视频作业”${list ? '' : '，或查看其他页'}。`;
            } else if (filtering && !stats.availableCards && !stats.supportCards) {
                if (stats.pendingCards) {
                    messageText = `${scope}暂未找到已确认可用的作业，已保留 ${stats.pendingCards} 份待核验作业。请查看卡片提示或补充干员数据。`;
                } else {
                    showAll = CONFIG.displayMode === 'HIDE' && !stats.visibleCards;
                    messageText = showAll
                        ? `${scope}没有符合当前筛选条件的作业，已隐藏 ${stats.unavailableCards} 份。可切换为置灰模式查看原因，或调整筛选条件、切换账号${list ? '' : '、查看其他页'}。`
                        : `${scope}没有符合当前筛选条件的作业。请调整筛选条件、切换账号${list ? '' : '，或查看其他页'}。`;
                }
            }
        }

        const summary = results.querySelector('.prts-filter-summary');
        const message = results.querySelector('.prts-filter-empty-message');
        if (summary.textContent !== summaryText) summary.textContent = summaryText;
        if (message.textContent !== messageText) message.textContent = messageText;
        results.querySelector('.prts-filter-empty').hidden = !messageText;
        document.getElementById('btn-filter-show-all').hidden = !showAll;
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
        if (mainRow.parentElement !== controlBar) controlBar.insertBefore(mainRow, controlBar.firstChild);

        let syncRow = document.getElementById('prts-filter-sync-row');
        if (!syncRow) {
            syncRow = document.createElement('div');
            syncRow.id = 'prts-filter-sync-row';
        }
        syncRow.className = 'prts-filter-sync-row';
        if (syncRow.parentElement !== controlBar) controlBar.appendChild(syncRow);

        // 顺序生成元素

        // (1) 少量账号点击轮换，三个及以上直接选择。
        let accountControl;
        if (getAccountIds().length < 3) {
            const existing = document.getElementById('btn-account');
            if (existing && existing.tagName !== 'BUTTON') existing.remove();
            const label = getAccountLabel(activeAccountId);
            accountControl = createPrtsButton({
                id: 'btn-account', text: label, icon: 'account', disabled: getAccountIds().length === 1,
                ariaLabel: `当前账号 ${label}${getAccountIds().length === 1 ? '，仅有一个账号' : '，点击切换账号'}`, onClick: cycleAccount
            });
        } else {
            accountControl = createAccountSelect('btn-account', activeAccountId, event => switchAccount(Number(event.target.value)));
        }

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
            if (accountSyncChip.parentElement !== syncRow) syncRow.appendChild(accountSyncChip);
        } else if (accountSyncChip) {
            accountSyncChip.remove();
        }

        // (2) 导入按钮
        const importText = ownedOpsSet.size > 0 ? `导入干员 (${ownedOpsSet.size})` : '导入干员';
        const btnImport = createPrtsButton({ id: 'btn-import', text: importText, icon: 'importOperators', ariaLabel: importText, onClick: handleImport });

        const btnSklandImport = createPrtsButton({ id: 'btn-skland-import', text: '森空岛导入', icon: 'skland', onClick: handleOpenSklandImport });

        // (3) 模式切换
        const displayModeText = CONFIG.displayMode === 'GRAY' ? '置灰模式' : '隐藏模式';
        const displayModeIcon = CONFIG.displayMode === 'GRAY' ? 'grayMode' : 'hideMode';
        const btnSetting = createPrtsButton({ id: 'btn-setting', text: displayModeText, icon: displayModeIcon, pressed: CONFIG.displayMode === 'HIDE', ariaLabel: `当前为${displayModeText}，点击切换显示模式`, onClick: toggleDisplayMode });

        // (4) 完美阵容
        const btnPerfect = createPrtsButton({
            id: 'btn-perfect',
            text: '完美阵容',
            icon: 'perfectSquad',
            onClick: () => toggleFilter('PERFECT'),
            active: CONFIG.filterMode === 'PERFECT',
            pressed: CONFIG.filterMode === 'PERFECT'
        });

        // (5) 允许助战
        const btnSupport = createPrtsButton({
            id: 'btn-support',
            text: '允许助战',
            icon: 'support',
            onClick: () => toggleFilter('SUPPORT'),
            active: CONFIG.filterMode === 'SUPPORT',
            pressed: CONFIG.filterMode === 'SUPPORT'
        });
        const btnTraining = createPrtsButton({
            id: 'btn-training', text: '校验练度', icon: 'trainingCheck',
            onClick: toggleTrainingCheck, active: CONFIG.trainingCheck, pressed: CONFIG.trainingCheck
        });
        btnTraining.title = '核对作业标注的练度要求；缺少数据时提示“待核验”';

        [
            ['prts-filter-accounts', '账号与数据', [accountControl, btnImport, btnSklandImport]],
            ['prts-filter-options', '筛选条件与显示模式', [btnPerfect, btnSupport, btnTraining, btnSetting]]
        ].forEach(([id, label, controls], index) => {
            let group = document.getElementById(id);
            if (!group) {
                group = document.createElement('div');
                group.id = id;
                group.className = 'prts-filter-group';
                group.setAttribute('role', 'group');
                group.setAttribute('aria-label', label);
            }
            // 原生下拉框展开时，移动它或父节点会关闭菜单并丢失焦点。
            if (mainRow.children[index] !== group) mainRow.insertBefore(group, mainRow.children[index] || null);
            controls.forEach((control, controlIndex) => {
                if (group.children[controlIndex] !== control) group.insertBefore(control, group.children[controlIndex] || null);
            });
        });

        renderFilterResults();
        if (isNew) requestFilterUpdate();
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
            content.textContent = '暂无文字描述';
        }
        descContainer.appendChild(content);
    }

    function cleanBilibiliLinks(cardInner) {
        if (!CONFIG.cleanLink) return;
        const descContainer = cardInner.querySelector('.grow.text-gray-700, .prts-desc-wrapper');
        if (!descContainer || descContainer.dataset.biliProcessed) return;

        const videoUrl = extractAndRemoveBilibiliUrl(descContainer);
        trimTrailingDescriptionNoise(descContainer);

        if (videoUrl) {
            const btnContainer = document.createElement('div');
            btnContainer.className = 'prts-video-box';

            const linkBtn = document.createElement('a');
            linkBtn.href = videoUrl;
            linkBtn.target = "_blank";
            linkBtn.rel = "noopener noreferrer";
            linkBtn.className = 'prts-bili-link';
            linkBtn.setAttribute('aria-label', '打开参考视频');
            linkBtn.appendChild(createPrtsIcon('playVideo'));
            linkBtn.appendChild(document.createTextNode('参考视频'));
            linkBtn.onclick = (e) => e.stopPropagation();

            btnContainer.appendChild(linkBtn);
            if (descContainer.parentNode) {
                descContainer.parentNode.insertBefore(btnContainer, descContainer.nextSibling);
            }
        }

        descContainer.dataset.biliProcessed = "true";
    }

    function collapseCardDescription(cardInner) {
        if (!CONFIG.collapseDescription) return;
        const descContainer = cardInner.querySelector('.grow.text-gray-700');
        if (!descContainer || descContainer.classList.contains('prts-desc-wrapper')) return;
        wrapDescriptionContent(descContainer);
        descContainer.classList.add('prts-desc-wrapper');
        descContainer.classList.remove('grow');
        descContainer.style.width = '100%';
        descContainer.tabIndex = 0;
        descContainer.setAttribute('aria-label', '作业描述');
    }

    function getOperationCards() {
        return Array.from(getOperationListRoot()?.querySelectorAll(BP_SELECTORS.operationCard) || []);
    }

    function getCardFromMutationNode(node) {
        const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
        if (!element) return null;
        if (element.matches?.(BP_SELECTORS.operationCard)) return element;
        return element.closest?.(BP_SELECTORS.operationCard) || null;
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

    function syncOperationTypeButtons(hidden = CONFIG.hideVideo) {
        document.querySelectorAll('.bp4-button-group.flex-wrap, .bp6-button-group.flex-wrap').forEach(group => {
            const labels = Array.from(group.children, button => button.textContent.trim());
            if (labels.length === 3 && labels[1] === 'PRTS' && ['视频', 'Video', 'Videos'].includes(labels[2])) {
                group.style.display = hidden ? 'none' : '';
            }
        });
    }

    function syncOperatorMatchingSettings(hidden = CONFIG.hideOperatorMatchingSettings) {
        document.querySelectorAll('button.bp4-button, button.bp6-button').forEach(button => {
            if (button.textContent.trim() !== '干员匹配设置') return;
            button.style.display = hidden ? 'none' : '';
            const group = button.parentElement;
            if (group?.matches('div.flex.flex-wrap.items-center.gap-1')) {
                group.style.display = hidden && group.children.length === 1 ? 'none' : '';
            }
        });
    }

    function syncSiteRedesign() {
        document.body?.classList.toggle('prts-site-redesign', isPrtsHost() && CONFIG.siteRedesign);
    }

    function syncPageScaffold() {
        syncSiteRedesign();
        applySidebarCollapse();
        optimizeDialogContent();
        createFloatingBall();
        injectFilterControls();
        syncOperationTypeButtons();
        syncOperatorMatchingSettings();
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
        renderFilterResults(null);
        syncPageScaffold();
        scheduleFilterUpdate(120);
        return true;
    }

    function isScriptOwnedNode(node) {
        const element = node?.nodeType === 1 ? node : node?.parentElement;
        return Boolean(element?.closest?.('#prts-filter-bar, #prts-filter-results, #prts-float-container, #prts-toast-container, #prts-import-dialog, #prts-import-dialog-backdrop, #prts-modal, #prts-modal-backdrop, #prts-compat-debug-panel, .prts-import-status, .prts-status-label'));
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
                    node.querySelectorAll?.(BP_SELECTORS.operationCard).forEach(childCard => dirtyCards.add(childCard));
                }
            });
        }
        return dirtyCards;
    }

    function hasRelevantDomMutation(mutations) {
        for (const mutation of mutations) {
            if (isScriptOwnedNode(mutation.target)) continue;
            if (mutation.type === 'characterData' && getCardFromMutationNode(mutation.target)) return true;

            const added = Array.from(mutation.addedNodes || []);
            const removed = Array.from(mutation.removedNodes || []);
            const changedNodes = added.concat(removed);
            if (changedNodes.some(node => !isScriptOwnedNode(node))) return true;
        }
        return false;
    }

    function addStageBadge(cardInner) {
        if (!CONFIG.stageBadge) return;

        const heading = cardInner.querySelector(`h4, h5, ${BP_SELECTORS.heading}`);
        const stageCodeSpan = cardInner.querySelector('.flex.whitespace-pre .inline-block.font-bold.my-auto');

        if (heading && !heading.querySelector('.prts-level-badge')) {
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
                // 支持带横杠的 PA-1、PA-EX-1、1-7、S4-1，以及省略横杠的 PA5、LE10。
                // 关卡号可带方括号，如 [PA-1]、【PA-1】。
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
                badge.title = badgeText;
                heading.insertBefore(badge, heading.firstChild);
            }
        }
    }

    function replaceCardOperatorAvatars(cardInner) {
        if (!CONFIG.operatorAvatars) return;
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

    function refreshResourceViews() {
        if (CONFIG.operatorAvatars) {
            document.querySelectorAll('.prts-op-text').forEach(item => {
                const name = item.firstChild?.textContent.trim();
                const id = OP_ID_MAP[name];
                if (!id) return;
                const skill = item.querySelector('.prts-op-skill');
                const img = document.createElement('img');
                img.src = `/assets/operator-avatars/webp96/${id}.webp`;
                img.className = 'prts-op-img';
                img.loading = 'lazy';
                img.alt = name;
                item.classList.replace('prts-op-text', 'prts-op-item');
                item.replaceChildren(img);
                if (skill) item.appendChild(skill);
            });
        }
        requestFilterUpdate();
    }

    function enhancePopover(portalNode) {
        if (!CONFIG.popoverAvatars) return;
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
        let hasUnknownOps = false;

        rawList.forEach(entry => {
            const parts = entry.trim().split(/\s+/);
            const name = parts[0];
            const skill = parts[1] || "";
            if (!name) return;

            if (OP_ID_MAP[name]) {
                validOps.push({ name: name, id: OP_ID_MAP[name], skill: skill });
            } else {
                hasUnknownOps = true;
                reportUnknownOperatorName(name, { source: 'popover', example: cleanText });
            }
        });

        if (!hasUnknownOps && validOps.length > 0) {
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
     * 记录作业卡片的数据来源、筛选状态和可见状态。
     */
    function createCardDiagnostics(source = 'none') {
        return {
            fiberCards: source === 'fiber' ? 1 : 0,
            fallbackCards: source === 'fallback' ? 1 : 0,
            noDataCards: source === 'none' ? 1 : 0,
            filterStatus: 'pending',
            visible: true
        };
    }

    function syncOperationCardTime(cardInner) {
        const timeText = cardInner.querySelector('.bp4-icon-time, .bp6-icon-time')?.parentElement
            ?.querySelector('.bp4-popover2-target > span, .bp6-popover-target > span');
        if (!timeText) return;
        const exactTime = CONFIG.showExactTime ? extractPopoverContentFromFiber(timeText) : '';
        timeText.classList.toggle('prts-exact-time', Boolean(exactTime));
        if (exactTime) {
            timeText.dataset.prtsExactTime = exactTime;
            timeText.setAttribute('aria-label', exactTime);
        } else {
            delete timeText.dataset.prtsExactTime;
            timeText.removeAttribute('aria-label');
        }
    }

    function updateTrainingStatusLabel(label, className, icon, text, issues) {
        const compact = CONFIG.trainingPromptStyle === 'COMPACT';
        const state = JSON.stringify([className, icon, text, issues, compact]);
        if (label.dataset.prtsStatusState === state) return;
        const expanded = label.querySelector('.prts-training-more')?.open;
        const compactExpanded = label.querySelector('.prts-training-details')?.open;
        label.className = `${className} prts-training-status${compact ? ' prts-training-compact' : ''}`;
        label.removeAttribute('aria-label');
        label.onclick = event => event.stopPropagation();
        label.onkeydown = event => {
            if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
        };
        label.replaceChildren();

        const heading = document.createElement(compact ? 'summary' : 'div');
        heading.className = 'prts-training-heading';
        const iconEl = createPrtsIcon(icon) || document.createElement('span');
        iconEl.classList.add('prts-status-icon');
        iconEl.setAttribute('aria-hidden', 'true');
        heading.appendChild(iconEl);
        const headingText = document.createElement('span');
        headingText.className = 'prts-training-heading-text';
        headingText.textContent = text;
        headingText.title = text;
        heading.appendChild(headingText);
        let content = label;
        if (compact) {
            content = document.createElement('details');
            content.className = 'prts-training-details';
            content.open = Boolean(compactExpanded);
            content.appendChild(heading);
            label.appendChild(content);
            const hint = document.createElement('span');
            hint.className = 'prts-training-toggle';
            hint.setAttribute('aria-hidden', 'true');
            hint.textContent = '详情';
            heading.appendChild(hint);
        } else {
            label.appendChild(heading);
        }

        const columns = document.createElement('div');
        columns.className = 'prts-training-columns';
        for (const title of ['项目', '当前', '作业要求']) {
            const column = document.createElement('span');
            column.textContent = title;
            columns.appendChild(column);
        }
        content.appendChild(columns);

        let extra;
        const orderedIssues = [...issues].sort((left, right) =>
            Number(left.status === 'unknown') - Number(right.status === 'unknown'));
        orderedIssues.forEach((operator, index) => {
            if (index === 2) {
                extra = document.createElement('details');
                extra.className = 'prts-training-more';
                extra.open = Boolean(expanded);
                const summary = document.createElement('summary');
                summary.textContent = `还有 ${issues.length - 2} 项，展开查看`;
                extra.appendChild(summary);
                content.appendChild(extra);
            }
            const section = document.createElement('div');
            section.className = 'prts-training-operator';
            const name = document.createElement('div');
            name.className = 'prts-training-name';
            name.textContent = operator.name;
            if (operator.group) {
                const group = document.createElement('span');
                group.className = 'prts-training-group';
                group.textContent = `干员组：${operator.group}`;
                name.appendChild(group);
            }
            section.appendChild(name);
            operator.issues.forEach(issue => {
                const row = document.createElement('div');
                row.className = `prts-training-row prts-training-${issue.status}`;
                for (const [className, value, title] of [
                    ['prts-training-field', issue.label, '项目'],
                    ['prts-training-current', issue.current, '当前'],
                    ['prts-training-required', issue.required, '作业要求']
                ]) {
                    const cell = document.createElement('span');
                    cell.className = className;
                    cell.textContent = value;
                    cell.setAttribute('aria-label', `${title}：${value}`);
                    row.appendChild(cell);
                }
                section.appendChild(row);
            });
            (extra || content).appendChild(section);
        });
        label.dataset.prtsStatusState = state;
    }

    function processOperationCard(card) {
        try {
            return processOperationCardContent(card);
        } catch (error) {
            console.warn('[Better PRTS] 作业卡片处理失败', error instanceof Error ? error.message : '未知错误');
            const operation = operationCache.get(card)?.resolution.operation;
            operationCache.delete(card);
            const diagnostics = createCardDiagnostics('none');
            cardDiagnosticsCache.set(card, diagnostics);
            const cardInner = card.querySelector(BP_SELECTORS.card);
            const hiddenVideo = CONFIG.hideVideo && cardInner && isVideoOperationCard(cardInner, operation);
            diagnostics.filterStatus = hiddenVideo ? 'hiddenVideo' : 'pending';
            diagnostics.visible = !hiddenVideo;
            card.style.display = hiddenVideo ? 'none' : '';
            card.classList.remove('prts-card-gray');
            if (cardInner) {
                const label = cardInner.querySelector('.prts-status-label') || document.createElement('div');
                label.onclick = null;
                label.onkeydown = null;
                updateStatusLabel(label, 'prts-status-label prts-label-support', 'pending', '作业数据待核验');
                if (!label.parentElement) cardInner.appendChild(label);
            }
            return diagnostics;
        }
    }

    function processOperationCardContent(card) {
        const cardInner = card.querySelector(BP_SELECTORS.card);
        if (!cardInner) {
            const diagnostics = createCardDiagnostics('none');
            card.style.display = '';
            card.classList.remove('prts-card-gray');
            cardDiagnosticsCache.set(card, diagnostics);
            return diagnostics;
        }

        if (CONFIG.hidePrtsBadge) getCardTypeTag(cardInner, 'PRTS')?.remove();
        syncOperationCardTime(cardInner);
        addStageBadge(cardInner);
        replaceCardOperatorAvatars(cardInner);
        cleanBilibiliLinks(cardInner);
        collapseCardDescription(cardInner);

        const resolution = getOperationResolutionForCard(card, cardInner);
        const operation = resolution.operation;
        const diagnostics = hasEffectiveOperationData(operation)
            ? createCardDiagnostics(resolution.source)
            : createCardDiagnostics('none');

        if (CONFIG.hideVideo && isVideoOperationCard(cardInner, operation)) {
            diagnostics.filterStatus = 'hiddenVideo';
            diagnostics.visible = false;
            if (card.style.display !== 'none') card.style.display = 'none';
            cardDiagnosticsCache.set(card, diagnostics);
            return diagnostics;
        }
        const { isAvailable, missingCount, missingOps, lowTraining, unknownTraining, trainingIssues, hasRequirements } =
            checkOperationAvailability(operation, ownedOpsSet, CONFIG.filterMode, accountsTraining[activeAccountId], CONFIG.trainingCheck);

        if (!isAvailable || (CONFIG.trainingCheck && CONFIG.filterMode === 'NONE' && missingCount > 0)) {
            diagnostics.filterStatus = 'unavailable';
        } else if (diagnostics.noDataCards || (CONFIG.trainingCheck && (unknownTraining.length || !hasRequirements))) {
            diagnostics.filterStatus = 'pending';
        } else {
            diagnostics.filterStatus = CONFIG.filterMode === 'SUPPORT' && missingCount === 1 ? 'support' : 'available';
        }

        if (!isAvailable && CONFIG.displayMode === 'HIDE') {
            diagnostics.visible = false;
            if (card.style.display !== 'none') card.style.display = 'none';
            cardDiagnosticsCache.set(card, diagnostics);
            return diagnostics;
        }

        if (card.style.display === 'none') card.style.display = '';

        const hasGrayClass = card.classList.contains('prts-card-gray');
        if (!isAvailable && CONFIG.displayMode === 'GRAY') {
            if (!hasGrayClass) card.classList.add('prts-card-gray');
        } else if (hasGrayClass) {
            card.classList.remove('prts-card-gray');
        }

        const existingLabel = cardInner.querySelector('.prts-status-label');
        const showMissingInfo = !isAvailable || (CONFIG.filterMode === 'SUPPORT' && missingCount === 1) ||
            (CONFIG.trainingCheck && diagnostics.noDataCards === 0 &&
                (lowTraining.length || unknownTraining.length || !hasRequirements));

        if (!showMissingInfo) {
            if (existingLabel) existingLabel.remove();
            cardDiagnosticsCache.set(card, diagnostics);
            return diagnostics;
        }

        let labelText = '';
        let iconText = '';
        let newClass = 'prts-status-label';

        if (CONFIG.filterMode === 'SUPPORT' && missingCount === 1) {
            newClass += ' prts-label-support';
            const name = missingOps[0];
            iconText = 'support';
            labelText = `需助战：${name}`;
        } else if (missingCount > 0 && CONFIG.filterMode !== 'NONE') {
            newClass += ' prts-label-missing';
            const listStr = missingOps.slice(0, 3).join('、') + (missingCount > 3 ? '…' : '');
            iconText = lowTraining.length ? 'lowTraining' : 'missingOperators';
            labelText = `${lowTraining.length ? '未达要求' : '缺'} ${missingCount} 人${missingCount > 0 ? '：' + listStr : ''}`;
        }
        if (CONFIG.trainingCheck) {
            if (!labelText && lowTraining.length) labelText = `练度不足 · ${lowTraining.length} 个位置`;
            else if (!labelText && unknownTraining.length) labelText = `练度待核验 · ${unknownTraining.length} 人`;
            if (!hasRequirements) labelText += `${labelText ? ' · ' : ''}未标注练度`;
        }
        if (!iconText) {
            iconText = lowTraining.length ? 'lowTraining' : unknownTraining.length ? 'pending' : 'unmarkedTraining';
            if (lowTraining.length) newClass += ' prts-label-missing';
            else if (unknownTraining.length) newClass += ' prts-label-support';
        }

        const labelDiv = existingLabel || document.createElement('div');
        if (CONFIG.trainingCheck && trainingIssues.length) {
            updateTrainingStatusLabel(labelDiv, newClass, iconText, labelText, trainingIssues);
        } else {
            labelDiv.onclick = null;
            labelDiv.onkeydown = null;
            updateStatusLabel(labelDiv, newClass, iconText, labelText);
        }
        if (!existingLabel) {
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
            noDataCards: 0,
            availableCards: 0,
            supportCards: 0,
            pendingCards: 0,
            unavailableCards: 0,
            hiddenVideoCards: 0,
            visibleCards: 0
        };

        cards.forEach(card => {
            const cached = cardDiagnosticsCache.get(card) || processOperationCard(card);
            diagnostics.fiberCards += cached.fiberCards;
            diagnostics.fallbackCards += cached.fallbackCards;
            diagnostics.noDataCards += cached.noDataCards;
            diagnostics[`${cached.filterStatus}Cards`] += 1;
            diagnostics.visibleCards += Number(cached.visible);
        });
        return diagnostics;
    }

    function applyFilterLogic() {
        if (isFilterDisabledPage()) {
            filterUpdateCoordinator.reset();
            setCompatibilityDiagnostics({ totalCards: 0, fiberCards: 0, fallbackCards: 0, noDataCards: 0 });
            renderFilterResults(null);
            return;
        }
        isProcessingFilter = true;

        try {
            const cards = getOperationCards();
            if (cards.length === 0) filterUpdateCoordinator.reset();

            const work = filterUpdateCoordinator.takeWork(cards);
            work.cards.forEach(processOperationCard);

            const diagnostics = aggregateCardDiagnostics(cards);
            setCompatibilityDiagnostics(diagnostics);
            renderFilterResults(diagnostics);
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
        if (!CONFIG.announcementTags) return;
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

    function registerAccountsDataChangeListener() {
        if (typeof GM_addValueChangeListener !== 'function') return;
        GM_addValueChangeListener(ACCOUNTS_DATA_KEY, (_name, oldValue, newValue, remote) => {
            if (!remote || oldValue === newValue) return;
            refreshOwnedOpsFromStorage();
        });
    }

    function refreshOwnedOpsFromStorage() {
        loadOwnedOps();
        if (isSklandHost()) {
            refreshAccountControls();
            return;
        }
        const bar = document.getElementById('prts-filter-bar');
        if (bar) bar.remove();
        injectFilterControls();
        refreshAccountControls();
        updateFloatingLayout();
        if (CONFIG.filterMode !== 'NONE' || CONFIG.trainingCheck) requestFilterUpdate();
    }

    function initSklandImportPage() {
        loadOwnedOps();
        registerAccountsDataChangeListener();
        if (document.body) {
            createSklandImportPanel();
            return;
        }
        window.addEventListener('DOMContentLoaded', createSklandImportPanel, { once: true });
    }

    function createSklandImportPanel() {
        if (document.getElementById('prts-skland-import-panel')) return;

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
        subtitle.textContent = '通过当前登录的森空岛账号读取明日方舟干员。';
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
        const defaultStatusText = '请确认当前页面已登录森空岛。读取后可预览干员名单和练度变化，确认后再导入。';

        const accountLabel = document.createElement('span');
        accountLabel.className = 'prts-skland-label';
        accountLabel.textContent = '目标账号';
        body.appendChild(accountLabel);

        const accountSelect = createAccountSelect('prts-skland-target-account', activeAccountId, () => {
            renderSklandSelectedAccountStatus(status, Number(accountSelect.value), defaultStatusText);
        });
        body.appendChild(accountSelect);

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
            const accountId = Number(accountSelect.value);
            const progressText = `正在读取森空岛数据，完成后请核对 ${getAccountLabel(accountId)} 的导入预览。`;
            const updateToast = showPrtsToast('正在读取森空岛干员…', 'loading', progressText, 0);
            importBtn.disabled = true;
            importBtn.textContent = '读取中…';
            accountSelect.disabled = true;
            setSklandPanelStatus(status, progressText, 'loading');
            try {
                const summary = await importSklandOperatorsToAccount(accountId, {
                    selectBinding: (bindings, defaultBinding) => showSklandBindingPicker(bindings, defaultBinding?.uid, accountId)
                });
                createAccountSelect(accountSelect.id, summary.accountId, accountSelect.onchange);
                const detail = formatSklandImportSummary(summary);
                setSklandPanelStatus(status, detail, 'success');
                updateToast('森空岛干员导入成功', 'success', detail);
            } catch (error) {
                if (isSklandImportCancelledError(error)) {
                    setSklandPanelStatus(status, '已取消导入，未修改账号数据。', '');
                    updateToast('已取消森空岛导入', 'info', '未修改账号数据。');
                    return;
                }
                console.error('[Better PRTS] 森空岛导入失败', error instanceof Error ? error.message : error);
                const detail = error instanceof Error ? error.message : '森空岛导入失败，请稍后重试。';
                setSklandPanelStatus(status, detail, 'error');
                updateToast('森空岛干员导入失败', 'error', detail);
            } finally {
                importBtn.disabled = false;
                importBtn.textContent = '读取并导入干员';
                accountSelect.disabled = false;
            }
        };

        renderSklandSelectedAccountStatus(status, Number(accountSelect.value), defaultStatusText);

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

    function updateSettingsReloadNotice() {
        const notice = document.getElementById('prts-settings-reload');
        if (notice) notice.hidden = !needsSettingsReload();
    }

    function updateFloatingLayout() {
        const container = document.getElementById('prts-float-container');
        if (!container || container.classList.contains('is-dragging')) return;
        const panel = document.getElementById('prts-settings-panel');
        const viewport = window.visualViewport;
        const left = viewport?.offsetLeft || 0;
        const top = viewport?.offsetTop || 0;
        const width = viewport?.width || window.innerWidth;
        const height = viewport?.height || window.innerHeight;
        const savedPos = CONFIG.floatingPosition;
        const ballTop = Math.max(top, Math.min(
            parseFloat(savedPos.top) / 100 * window.innerHeight, top + height - container.offsetHeight
        ));

        container.style.top = `${ballTop}px`;
        container.style.left = savedPos.isRight ? 'auto' : `${left}px`;
        container.style.right = savedPos.isRight ? `${window.innerWidth - left - width}px` : 'auto';
        container.classList.toggle('snap-right', savedPos.isRight);
        container.classList.toggle('snap-left', !savedPos.isRight);
        panel.classList.toggle('prts-settings-compact', height < 240);
        panel.style.setProperty('--prts-panel-width', `${Math.max(0, width - 24)}px`);
        panel.style.setProperty('--prts-panel-max-height', `${Math.max(0, height - 24)}px`);
        // 以悬浮球为锚点，空间不足时贴合可见视口；面板不参与拖拽区域的尺寸计算。
        const ballLeft = left + (savedPos.isRight ? width - container.offsetWidth : 0);
        const preferredLeft = savedPos.isRight ? ballLeft - 7 - panel.offsetWidth : ballLeft + container.offsetWidth + 7;
        const panelLeft = Math.max(left + 12, Math.min(preferredLeft, left + width - panel.offsetWidth - 12));
        const panelTop = Math.max(top + 12, Math.min(ballTop, top + height - panel.offsetHeight - 12));
        panel.style.left = `${panelLeft - ballLeft}px`;
        panel.style.right = 'auto';
        panel.style.top = `${panelTop - ballTop}px`;

        container.classList.toggle('prts-submenu-left', savedPos.isRight);
        container.querySelectorAll('.prts-submenu-panel').forEach(submenu => {
            const roomLeft = panelLeft - left - 12;
            const roomRight = left + width - 12 - panelLeft - panel.offsetWidth;
            let opensLeft = savedPos.isRight;
            submenu.style.setProperty('--prts-submenu-width', `${Math.max(0, width - 48)}px`);
            submenu.style.maxHeight = `${Math.max(0, height - 24)}px`;
            const fitsLeft = roomLeft >= submenu.offsetWidth + 8;
            const fitsRight = roomRight >= submenu.offsetWidth + 8;
            if (opensLeft ? !fitsLeft && fitsRight : !fitsRight && fitsLeft) opensLeft = !opensLeft;
            let submenuLeft;
            if (fitsLeft || fitsRight) {
                submenuLeft = opensLeft ? panelLeft - submenu.offsetWidth - 8 : panelLeft + panel.offsetWidth + 8;
            } else {
                // 窄屏保留上一级的 24px 边缘，仍按同一方向逐层展开。
                submenu.style.setProperty('--prts-submenu-width', `${Math.max(0, panel.offsetWidth - 24)}px`);
                submenuLeft = opensLeft ? panelLeft + panel.offsetWidth - submenu.offsetWidth - 24 : panelLeft + 24;
            }
            const entryTop = document.getElementById(submenu.dataset.triggerId).getBoundingClientRect().top;
            const submenuTop = Math.max(top + 12, Math.min(entryTop, top + height - submenu.offsetHeight - 12));
            submenu.style.left = `${submenuLeft - ballLeft}px`;
            submenu.style.top = `${submenuTop - ballTop}px`;
            container.classList.toggle('prts-submenu-left', opensLeft);
        });
    }

    function renderAccountList(list) {
        const ids = getAccountIds();
        const signature = ids.join(',');
        if (list.dataset.accounts === signature) return;
        list.replaceChildren(...ids.map(id => {
            const row = document.createElement('div');
            row.className = 'prts-account-row';
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'prts-acc-btn';
            button.dataset.id = id;
            button.onclick = () => switchAccount(id);
            const heading = document.createElement('span');
            heading.className = 'prts-account-heading';
            const name = document.createElement('span');
            name.className = 'prts-account-name';
            heading.appendChild(name);
            heading.appendChild(createPrtsIcon('selected'));
            button.appendChild(heading);
            const count = document.createElement('span');
            count.className = 'prts-account-count';
            button.appendChild(count);
            const syncMeta = document.createElement('span');
            syncMeta.className = 'prts-account-sync-meta';
            button.appendChild(syncMeta);
            row.appendChild(button);
            const rename = createPrtsButton({ className: 'prts-account-rename', text: '改名', onClick: () => renameAccount(id) });
            row.appendChild(rename);
            const remove = createPrtsButton({
                className: 'prts-account-rename prts-account-delete', text: '删除',
                disabled: ids.length <= 1, onClick: () => removeAccount(id)
            });
            row.appendChild(remove);
            return row;
        }));
        list.dataset.accounts = signature;
    }

    function createFloatingBall() {
        if (document.getElementById('prts-float-container')) return;

        const container = document.createElement('div');
        container.id = 'prts-float-container';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'prts-float-btn';
        btn.title = "脚本设置（可拖拽）";
        btn.setAttribute('aria-label', '打开脚本设置面板，可拖拽');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'prts-settings-panel');
        btn.style.touchAction = 'none';
        btn.appendChild(createPrtsIcon('settings'));

        const panel = document.createElement('div');
        panel.id = 'prts-settings-panel';
        panel.className = 'prts-settings-panel';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', 'Better-PRTS-Plus 设置');

        const title = document.createElement('div');
        title.className = 'prts-panel-title';
        const titleText = document.createElement('button');
        titleText.type = 'button';
        titleText.className = 'prts-settings-heading';
        titleText.textContent = '设置';
        title.appendChild(titleText);
        title.appendChild(createPrtsButton({
            className: 'prts-btn prts-settings-close', icon: 'close', ariaLabel: '关闭脚本设置面板',
            onClick: () => {
                setFloatOpen(false);
                btn.focus({ preventScroll: true });
            }
        }));
        panel.appendChild(title);

        const content = document.createElement('div');
        content.id = 'prts-settings-main';
        content.className = 'prts-settings-content';
        panel.appendChild(content);

        const submenus = [];
        let activeSubmenu = null;
        const setSubmenuOpen = (next, restoreFocus = true) => {
            const previous = activeSubmenu;
            if (previous) {
                previous.panel.classList.remove('is-open');
                previous.panel.inert = true;
                previous.panel.setAttribute('aria-hidden', 'true');
                previous.button.setAttribute('aria-expanded', 'false');
            }
            activeSubmenu = next;
            if (next) {
                next.panel.inert = false;
                next.panel.setAttribute('aria-hidden', 'false');
                next.button.setAttribute('aria-expanded', 'true');
                updateFloatingLayout();
                next.panel.classList.add('is-open');
                next.close.focus({ preventScroll: true });
            } else if (restoreFocus && previous) previous.button.focus({ preventScroll: true });
        };
        const createSubmenu = (id, label, icon) => {
            const submenuPanel = document.createElement('div');
            submenuPanel.id = `prts-${id}-panel`;
            submenuPanel.className = 'prts-submenu-panel';
            submenuPanel.inert = true;
            submenuPanel.setAttribute('aria-hidden', 'true');
            submenuPanel.setAttribute('role', 'region');
            submenuPanel.setAttribute('aria-labelledby', `prts-${id}-title`);
            const head = document.createElement('div');
            head.className = 'prts-modal-head';
            const heading = document.createElement('h2');
            heading.id = `prts-${id}-title`;
            heading.className = 'prts-modal-title';
            heading.textContent = label;
            head.appendChild(heading);
            const close = createPrtsButton({
                className: 'prts-btn prts-submenu-close', icon: 'collapsePanel', ariaLabel: `收起${label}`,
                onClick: () => setSubmenuOpen(null)
            });
            head.appendChild(close);
            submenuPanel.appendChild(head);
            const body = document.createElement('div');
            body.className = 'prts-submenu-content';
            submenuPanel.appendChild(body);
            const button = createPrtsButton({
                id: `prts-settings-${id}-button`, className: 'prts-btn prts-submenu-button',
                icon, text: label, ariaControls: submenuPanel.id, expanded: false,
                onClick: () => setSubmenuOpen(activeSubmenu === submenu ? null : submenu)
            });
            const arrow = createPrtsIcon('expandSubmenu');
            arrow.classList.add('prts-submenu-arrow');
            button.appendChild(arrow);
            content.appendChild(button);
            submenuPanel.dataset.triggerId = button.id;
            submenuPanel.onclick = event => event.stopPropagation();
            const submenu = { panel: submenuPanel, body, button, close };
            submenus.push(submenu);
            return submenu;
        };
        const cards = createSubmenu('cards', '作业卡片', 'cards');
        const pageEnhancements = createSubmenu('page', '页面增强', 'pageEnhancements');
        const accounts = createSubmenu('accounts', '账号与数据', 'accounts');
        const about = createSubmenu('about', '关于', 'about');
        const diagnostics = createSubmenu('diagnostics', '诊断', 'compatDebug');
        const aboutContent = about.body;
        const aboutName = document.createElement('h3');
        aboutName.className = 'prts-about-name';
        aboutName.textContent = 'Better-PRTS-Plus';
        const aboutVersion = document.createElement('p');
        aboutVersion.className = 'prts-about-version';
        aboutVersion.textContent = `当前版本 ${GM_info.script.version}`;
        const aboutDescription = document.createElement('p');
        aboutDescription.className = 'prts-about-description';
        aboutDescription.textContent = '按持有干员和练度筛选 PRTS Plus 作业，支持多账号管理和页面显示调整。';
        const aboutCredits = document.createElement('p');
        aboutCredits.className = 'prts-about-credits';
        aboutCredits.textContent = '作者：一只摆烂的42（ntgmc）\n开源协议：GPL-3.0\n感谢 PRTS Plus 提供作业平台。';
        aboutContent.appendChild(aboutName);
        aboutContent.appendChild(aboutVersion);
        aboutContent.appendChild(aboutDescription);
        aboutContent.appendChild(aboutCredits);
        const aboutLinks = document.createElement('div');
        aboutLinks.className = 'prts-about-links';
        [
            ['项目主页', 'https://github.com/ntgmc/Better-PRTS-Plus'],
            ['使用说明', 'https://github.com/ntgmc/Better-PRTS-Plus/blob/main/README.md'],
            ['问题反馈', 'https://github.com/ntgmc/Better-PRTS-Plus/issues'],
            ['更新记录', SCRIPT_RELEASE_URL]
        ].forEach(([text, url]) => {
            const link = document.createElement('a');
            link.className = 'prts-btn';
            link.textContent = text;
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            aboutLinks.appendChild(link);
        });
        aboutContent.appendChild(aboutLinks);

        const reloadNotice = document.createElement('div');
        reloadNotice.id = 'prts-settings-reload';
        reloadNotice.hidden = true;
        const reloadStatus = document.createElement('div');
        reloadStatus.setAttribute('role', 'status');
        reloadStatus.setAttribute('aria-live', 'polite');
        reloadStatus.textContent = '已保存，刷新后生效';
        reloadNotice.appendChild(reloadStatus);
        reloadNotice.appendChild(createPrtsButton({
            text: '立即刷新', icon: 'reload', onClick: () => location.reload()
        }));
        panel.appendChild(reloadNotice);

        let debugOptionsRevealed = CONFIG.compatDebug === true;
        diagnostics.button.hidden = !debugOptionsRevealed;

        const revealDebugOptions = event => {
            if (!event.shiftKey) return;
            event.preventDefault();
            event.stopPropagation();
            debugOptionsRevealed = !debugOptionsRevealed;
            diagnostics.button.hidden = !debugOptionsRevealed;
            if (!debugOptionsRevealed && activeSubmenu === diagnostics) setSubmenuOpen(null, false);
            updateFloatingLayout();
        };

        titleText.addEventListener('click', revealDebugOptions);

        const groupContents = {
            '作业卡片': cards.body, '页面增强': pageEnhancements.body,
            '脚本更新': aboutContent, '诊断': diagnostics.body
        };
        Object.entries(CONFIG_DEFINITIONS).forEach(([key, definition]) => {
            if (!definition.group) return;
            const target = groupContents[definition.group];
            if (definition.group === '脚本更新') {
                const groupTitle = document.createElement('div');
                groupTitle.className = 'prts-panel-title';
                groupTitle.textContent = definition.group;
                target.appendChild(groupTitle);
            }
            const onChange = value => {
                CONFIG[key] = value;
                saveConfig();
                refreshAccountControls();
                syncPageScaffold();
                document.querySelectorAll(BP_SELECTORS.portal).forEach(enhancePopover);
                requestFilterUpdate();
            };
            if (definition.options) {
                const item = document.createElement('div');
                item.className = 'prts-panel-item prts-panel-choice';
                const labelText = document.createElement('span');
                labelText.className = 'prts-panel-item-label';
                labelText.appendChild(createPrtsIcon(definition.icon));
                labelText.appendChild(document.createTextNode(definition.label));
                const choices = document.createElement('div');
                choices.className = 'prts-panel-segments';
                choices.setAttribute('role', 'group');
                choices.setAttribute('aria-label', definition.label);
                definition.options.forEach(value => {
                    const button = createPrtsButton({
                        className: 'prts-panel-segment', text: definition.optionLabels[value],
                        pressed: CONFIG[key] === value,
                        onClick: () => onChange(value)
                    });
                    button.dataset.prtsConfigKey = key;
                    button.value = value;
                    choices.appendChild(button);
                });
                item.appendChild(labelText);
                item.appendChild(choices);
                target.appendChild(item);
            } else {
                target.appendChild(createPrtsSwitch({
                    label: definition.label, checked: CONFIG[key], configKey: key, icon: definition.icon, onChange
                }));
            }
        });
        const updatePreviewLabel = document.createElement('div');
        updatePreviewLabel.className = 'prts-panel-item-label';
        updatePreviewLabel.textContent = '更新弹窗预览';
        diagnostics.body.appendChild(updatePreviewLabel);
        const updatePreviewActions = document.createElement('div');
        updatePreviewActions.className = 'prts-panel-actions';
        Object.entries(RELEASE_LEVELS).forEach(([level, text]) => {
            updatePreviewActions.appendChild(createPrtsButton({
                text, onClick: () => previewScriptUpdate(level)
            }));
        });
        diagnostics.body.appendChild(updatePreviewActions);
        aboutContent.appendChild(createPrtsButton({
            className: 'prts-btn prts-about-update', icon: 'checkUpdates', text: '检查脚本更新',
            onClick: () => checkScriptUpdates(true)
        }));

        // 账号管理
        const accRow = document.createElement('div');
        accRow.className = 'prts-panel-item prts-account-section';

        const accTitle = document.createElement('span');
        accTitle.className = 'prts-panel-item-label';
        accTitle.appendChild(createPrtsIcon('accounts'));
        const accTitleText = document.createElement('span');
        accTitleText.textContent = '账号管理';
        accTitle.appendChild(accTitleText);
        const accountToolbar = document.createElement('div');
        accountToolbar.className = 'prts-account-toolbar';
        accountToolbar.appendChild(accTitle);
        accountToolbar.appendChild(createPrtsButton({ id: 'prts-add-account', text: '添加账号', onClick: addAccount }));
        accRow.appendChild(accountToolbar);

        const accBtnGroup = document.createElement('div');
        accBtnGroup.className = 'prts-account-list';

        renderAccountList(accBtnGroup);
        accRow.appendChild(accBtnGroup);
        accounts.body.appendChild(accRow);

        const importBtn = createPrtsButton({ className: 'prts-btn prts-account-import', icon: 'importOperators', text: '导入干员数据', onClick: handleImport });
        accounts.body.appendChild(importBtn);

        const sklandBtn = createPrtsButton({ className: 'prts-btn prts-account-import', icon: 'skland', text: '森空岛导入', onClick: handleOpenSklandImport });
        accounts.body.appendChild(sklandBtn);

        const backupActions = document.createElement('div');
        backupActions.className = 'prts-panel-actions';

        const exportBtn = createPrtsButton({ className: 'prts-btn', icon: 'exportBackup', text: '导出全部配置', onClick: handleExportAccountsBackup });

        const importBackupBtn = createPrtsButton({ className: 'prts-btn', icon: 'importBackup', text: '导入全部配置', onClick: handleImportAccountsBackup });

        backupActions.appendChild(exportBtn);
        backupActions.appendChild(importBackupBtn);
        accounts.body.appendChild(backupActions);

        container.appendChild(panel);
        submenus.forEach(submenu => container.appendChild(submenu.panel));
        container.appendChild(btn);
        document.body.appendChild(container);
        refreshAccountControls();
        updateFloatingLayout();
        window.addEventListener('resize', updateFloatingLayout);
        window.visualViewport?.addEventListener('resize', updateFloatingLayout);
        window.visualViewport?.addEventListener('scroll', updateFloatingLayout);
        const panelObserver = new ResizeObserver(updateFloatingLayout);
        panelObserver.observe(panel);
        submenus.forEach(submenu => panelObserver.observe(submenu.panel));
        content.addEventListener('scroll', updateFloatingLayout);

        let isDragging = false;
        let hasMoved = false;
        let startX, startY, initialLeft, initialTop, activePointerId;

        btn.addEventListener('pointerdown', (e) => {
            activePointerId = e.pointerId;
            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            const rect = container.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
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
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                hasMoved = true;
                setFloatOpen(false);
            }

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            const viewport = window.visualViewport;
            const left = viewport?.offsetLeft || 0;
            const top = viewport?.offsetTop || 0;
            const width = viewport?.width || window.innerWidth;
            const height = viewport?.height || window.innerHeight;
            newLeft = Math.max(left, Math.min(newLeft, left + width - container.offsetWidth));
            newTop = Math.max(top, Math.min(newTop, top + height - container.offsetHeight));

            container.style.left = newLeft + 'px';
            container.style.top = newTop + 'px';
        });

        const finishDrag = (e) => {
            if (!isDragging) return;
            if (activePointerId !== undefined && e.pointerId !== activePointerId) return;
            const rect = container.getBoundingClientRect();
            isDragging = false;
            btn.releasePointerCapture?.(activePointerId);
            activePointerId = undefined;
            container.classList.remove('is-dragging');
            container.style.transform = '';

            if (hasMoved) {
                const viewport = window.visualViewport;
                const midpoint = (viewport?.offsetLeft || 0) + (viewport?.width || window.innerWidth) / 2;
                CONFIG.floatingPosition = {
                    top: (rect.top / window.innerHeight * 100).toFixed(1) + '%',
                    isRight: rect.left + rect.width / 2 >= midpoint
                };
                saveConfig();
                container.classList.add('is-snapping');
            }
            updateFloatingLayout();
        };

        document.addEventListener('pointerup', finishDrag);
        document.addEventListener('pointercancel', finishDrag);

        const setFloatOpen = isOpen => {
            if (!isOpen) setSubmenuOpen(null, false);
            if (isOpen) updateFloatingLayout();
            container.classList.toggle('prts-float-open', isOpen);
            btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        };

        btn.onclick = (e) => {
            e.stopPropagation();
            if (!hasMoved || e.detail === 0) setFloatOpen(!container.classList.contains('prts-float-open'));
            hasMoved = false;
        };
        panel.onclick = event => {
            event.stopPropagation();
            if (!event.target.closest?.('.prts-submenu-button')) setSubmenuOpen(null, false);
        };
        document.addEventListener('click', event => {
            if (!isDragging && !event.target.closest?.('#prts-modal-backdrop, #prts-import-dialog-backdrop')) setFloatOpen(false);
        });
        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || !container.classList.contains('prts-float-open') ||
                document.getElementById('prts-modal') || document.getElementById('prts-import-dialog')) return;
            event.preventDefault();
            if (activeSubmenu) setSubmenuOpen(null);
            else {
                setFloatOpen(false);
                btn.focus({ preventScroll: true });
            }
        });
    }
    // =========================================================================
    //                            MODULE 7: 初始化与统一监听
    // =========================================================================

    function init() {
        if (!isSklandHost() && !isPrtsHost()) return;
        loadCachedResources();
        updateResources();
        setInterval(updateResources, RESOURCE_CHECK_INTERVAL_MS);
        checkScriptUpdates();
        setInterval(checkScriptUpdates, 60 * 1000);
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

        observer.observe(document.body, { childList: true, characterData: true, subtree: true });

        const portalInnerObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                const portalNode = mutation.target.closest(BP_SELECTORS.portal);
                if (portalNode) enhancePopover(portalNode);
            });
        });

        const bodyObserver = new MutationObserver((mutations) => {
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
            if (missingFilterBar && (CONFIG.filterMode !== 'NONE' || CONFIG.trainingCheck || CONFIG.hideVideo)) {
                scheduleFilterUpdate(120);
            }
        }, 3000);
    }

    init();

})();
