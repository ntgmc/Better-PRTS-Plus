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

