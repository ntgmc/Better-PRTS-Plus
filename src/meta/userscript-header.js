// ==UserScript==
// @name         Better-PRTS-Plus
// @namespace    https://github.com/ntgmc/Better-PRTS-Plus
// @version      4.1.3
// @description  按持有干员和练度筛选 PRTS Plus 作业，支持干员组、多账号切换、干员头像展示和深色模式适配。
// @author       一只摆烂的42
// @match        https://zoot.plus/*
// @match        https://prts.plus/*
// @match        https://www.skland.com/*
// @match        https://skland.com/*
// @icon         https://prts.plus/favicon.ico
// @homepage     https://github.com/ntgmc/Better-PRTS-Plus
// @supportURL   https://github.com/ntgmc/Better-PRTS-Plus/issues
// @updateURL    https://gh-proxy.com/https://github.com/ntgmc/Better-PRTS-Plus/releases/latest/download/Better-PRTS-Plus.user.js
// @downloadURL  https://gh-proxy.com/https://github.com/ntgmc/Better-PRTS-Plus/releases/latest/download/Better-PRTS-Plus.user.js
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

