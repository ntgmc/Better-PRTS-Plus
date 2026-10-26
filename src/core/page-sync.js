    let lastRouteKey = getRouteKey();

    function isFilterDisabledPage() {
        const path = window.location.pathname;
        return path.startsWith('/create') || path.startsWith('/editor');
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
            filterUpdateCoordinator.dispose();
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
        filterUpdateCoordinator.dispose();
        renderFilterResults(null);
        syncPageScaffold();
        scheduleFilterUpdate(120);
        return true;
    }

    function isScriptOwnedNode(node) {
        const element = node?.nodeType === 1 ? node : node?.parentElement;
        return Boolean(element?.closest?.('#prts-filter-bar, #prts-filter-results, #prts-float-container, #prts-toast-container, #prts-import-dialog, #prts-import-dialog-backdrop, #prts-modal, #prts-modal-backdrop, #prts-compat-debug-panel, .prts-import-status, .prts-status-label, .prts-popover-grid'));
    }

    function collectPageMutations(mutations) {
        const dirtyCards = new Set();
        const portals = new Set();
        let scaffoldChanged = false;
        for (const mutation of mutations) {
            if (isScriptOwnedNode(mutation.target)) continue;
            const element = mutation.target.nodeType === Node.ELEMENT_NODE ? mutation.target : mutation.target.parentElement;
            const portal = element?.closest?.(BP_SELECTORS.portal);
            if (portal) portals.add(portal);
            const targetCard = getCardFromMutationNode(mutation.target);
            if (mutation.type === 'characterData') {
                if (targetCard) dirtyCards.add(targetCard);
                continue;
            }
            const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes].filter(node => !isScriptOwnedNode(node));
            if (!changedNodes.length) continue;
            if (targetCard) dirtyCards.add(targetCard);
            else if (!portal) scaffoldChanged = true;
            for (const node of changedNodes) {
                const card = getCardFromMutationNode(node);
                if (card) dirtyCards.add(card);
                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                if (!card) node.querySelectorAll(BP_SELECTORS.operationCard).forEach(child => dirtyCards.add(child));
                if (node.matches(BP_SELECTORS.portal)) portals.add(node);
                node.querySelectorAll(BP_SELECTORS.portal).forEach(child => portals.add(child));
            }
        }
        return { dirtyCards, portals, scaffoldChanged };
    }

    function initPrtsPage() {
        syncPageScaffold();
        scheduleFilterUpdate(0);
        document.querySelectorAll(BP_SELECTORS.portal).forEach(enhancePopover);
        const observer = new MutationObserver(mutations => {
            const { dirtyCards, portals, scaffoldChanged } = collectPageMutations(mutations);
            portals.forEach(portal => { if (portal.isConnected) enhancePopover(portal); });
            if (handleRouteChange()) return;
            if (scaffoldChanged) syncPageScaffold();
            if (scaffoldChanged || dirtyCards.size) scheduleFilterUpdate(80, { forceFull: false, dirtyCards });
        });
        observer.observe(document.body, { childList: true, characterData: true, subtree: true });

        const fallbackTimer = setInterval(() => {
            if (document.hidden || handleRouteChange()) return;
            const missingFilterBar = !isFilterDisabledPage() && !document.getElementById('prts-filter-bar');
            syncPageScaffold();
            if (missingFilterBar) scheduleFilterUpdate(120);
        }, 3000);
        return () => {
            observer.disconnect();
            clearInterval(fallbackTimer);
            filterUpdateCoordinator.dispose();
        };
    }

