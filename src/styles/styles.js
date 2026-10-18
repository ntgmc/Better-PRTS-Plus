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

    GM_addStyle(iconStyles + toastStyles + (isSklandHost() ? sklandImportStyles : mergedStyles) + accountSelectStyles + scriptUpdateStyles);
