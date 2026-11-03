    const siteRedesignStyles = `
    /* Optional filter layout and title limits; preserve the site's visual styles. */
    body.prts-site-redesign :is(.bp4-card, .bp6-card) > .flex:has(> :is(.bp4-input-group, .bp6-input-group) > input[type="search"]) > :is(.bp4-input-group, .bp6-input-group) {
        flex: 1 1 16rem;
        min-width: 0;
        max-width: none;
    }
    body.prts-site-redesign #prts-filter-bar {
        margin: var(--prts-space-3) 0 0;
        padding-top: 0;
        border-top: 0;
        gap: var(--prts-space-2);
    }
    body.prts-site-redesign li > :is(.bp4-card, .bp6-card) > :is(.bp4-popover2-target, .bp6-popover-target):has(> h4) {
        white-space: normal;
        overflow: visible;
    }
    body.prts-site-redesign li > :is(.bp4-card, .bp6-card) h4 { align-items: start; }
    body.prts-site-redesign li > :is(.bp4-card, .bp6-card) h4 > .whitespace-nowrap {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        white-space: normal;
        overflow-wrap: anywhere;
    }
    body.prts-site-redesign .grid > :is(.bp4-card, .bp6-card) > .flex:first-child :is(.bp4-popover2-target, .bp6-popover-target) { white-space: normal; overflow: visible; }
    body.prts-site-redesign .grid > :is(.bp4-card, .bp6-card) > .flex:first-child h4 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        white-space: normal;
    }
    @media (max-width: 47.999rem) {
        body.prts-site-redesign :is(.bp4-card, .bp6-card):has([role="tablist"]) > h4 { flex-wrap: wrap; gap: var(--prts-space-1); }
        body.prts-site-redesign :is(.bp4-card, .bp6-card):has([role="tablist"]) > h4 > :is(.bp4-tabs, .bp6-tabs) { padding-left: 0; }
        body.prts-site-redesign :is(.bp4-card, .bp6-card):has([role="tablist"]) > h4 > button { margin-right: 0; }
        body.prts-site-redesign #prts-filter-accounts { display: flex; flex-wrap: wrap; }
        body.prts-site-redesign #prts-filter-accounts > #btn-account { flex-basis: 100%; width: 100%; }
        body.prts-site-redesign #prts-filter-accounts > .prts-btn { flex: 1 0 auto; }
    }
    `;
