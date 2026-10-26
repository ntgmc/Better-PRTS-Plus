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

