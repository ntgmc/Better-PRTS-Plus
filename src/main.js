    function init() {
        if (!isSklandHost() && !isPrtsHost()) return;
        loadCachedResources();
        updateResources();
        setInterval(updateResources, RESOURCE_CHECK_INTERVAL_MS);
        checkScriptUpdates();
        setInterval(checkScriptUpdates, 60 * 1000);
        loadOwnedOps();
        registerAccountsDataChangeListener();
        if (isSklandHost()) createSklandImportPanel();
        else initPrtsPage();
    }

    if (document.body) init();
    else document.addEventListener('DOMContentLoaded', init, { once: true });

})();
