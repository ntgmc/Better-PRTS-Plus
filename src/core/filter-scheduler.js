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
