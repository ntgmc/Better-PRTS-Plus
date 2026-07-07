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
