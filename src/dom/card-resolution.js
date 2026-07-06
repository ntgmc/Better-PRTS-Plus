    function parseFloatingPosition(rawValue) {
        const fallback = { top: '40%', isRight: true };
        const parsed = typeof rawValue === 'string' ? safeJsonParse(rawValue, fallback) : rawValue;
        const topValue = typeof parsed?.top === 'string' ? parsed.top : fallback.top;
        const topNumber = /^-?\d+(?:\.\d+)?%$/.test(topValue) ? parseFloat(topValue) : parseFloat(fallback.top);
        const clampedTop = Math.min(95, Math.max(0, topNumber));

        return {
            top: `${Number(clampedTop.toFixed(1))}%`,
            isRight: parsed?.isRight !== false
        };
    }

    function normalizeFilterMode(mode) {
        return ['NONE', 'PERFECT', 'SUPPORT'].includes(mode) ? mode : 'NONE';
    }

    function normalizeDisplayMode(mode) {
        return ['GRAY', 'HIDE'].includes(mode) ? mode : 'GRAY';
    }

    function findSearchInputGroup() {
        const blueprintGroup = document.querySelector(BP_SELECTORS.inputGroup);
        if (blueprintGroup) return blueprintGroup;

        const searchInput = document.querySelector('input[type="search"][enterkeyhint="search"]') ||
                            document.querySelector('input[type="search"]');
        return searchInput?.closest('div') || null;
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
        const tags = Array.from(card.querySelectorAll(`${BP_SELECTORS.tag}, .prts-op-text`));
        const requiredOps = [];
        const requiredGroups = [];

        tags.forEach(tag => {
            if (tag.querySelector('h4')) return;
            if (tag.style.display === 'none') return;

            const text = tag.innerText.trim();
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
        const signature = getCardSignature(card);
        const cached = operationCache.get(card);
        if (cached && cached.signature === signature) {
            return cached.resolution;
        }

        const cardInnerOperation = extractOperationFromFiber(cardInner);
        const cardOperation = cardInnerOperation || extractOperationFromFiber(card);
        const resolution = cardOperation
            ? { operation: cardOperation, source: 'fiber' }
            : { operation: buildFallbackOperation(card), source: 'fallback' };

        operationCache.set(card, { signature, resolution });
        return resolution;
    }

    function getOperationForCard(card, cardInner) {
        return getOperationResolutionForCard(card, cardInner).operation;
    }

    function updateStatusLabel(label, className, iconText, text) {
        const state = `${className}|${iconText}|${text}`;
        if (label.dataset.prtsStatusState === state) return;

        label.className = className;
        label.replaceChildren();

        const icon = document.createElement('span');
        icon.className = 'bp4-icon';
        icon.style.marginRight = '6px';
        icon.textContent = iconText;

        label.appendChild(icon);
        label.appendChild(document.createTextNode(text));
        label.dataset.prtsStatusState = state;
    }
