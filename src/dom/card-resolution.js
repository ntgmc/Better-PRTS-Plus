    const operationCache = new WeakMap();

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
        // React 可复用文字相同的卡片，但更新其中的练度要求或作业类型。
        const operation = extractOperationFromFiber(cardInner) || extractOperationFromFiber(card);
        if (operation) {
            const resolution = { operation, source: 'fiber' };
            operationCache.set(card, { resolution });
            return resolution;
        }

        const signature = getCardSignature(card);
        const cached = operationCache.get(card);
        if (cached?.resolution.source === 'fallback' && cached.signature === signature) return cached.resolution;
        const resolution = { operation: buildFallbackOperation(card), source: 'fallback' };
        operationCache.set(card, { signature, resolution });
        return resolution;
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
