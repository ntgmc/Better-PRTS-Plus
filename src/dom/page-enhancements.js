    function findBilibiliUrl(text) {
        const match = String(text || '').match(/(?:【.*?】\s*)?(https?:\/\/(?:www\.)?(?:bilibili\.com\/video\/|b23\.tv\/)[^\s<"']+)/i);
        return match ? { fullText: match[0], url: match[1] } : null;
    }

    function extractAndRemoveBilibiliUrl(container) {
        const link = Array.from(container.querySelectorAll('a[href]'))
            .find(anchor => findBilibiliUrl(anchor.href));
        if (link) {
            const url = findBilibiliUrl(link.href).url;
            link.remove();
            return url;
        }

        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
        let textNode = walker.nextNode();
        while (textNode) {
            const match = findBilibiliUrl(textNode.nodeValue);
            if (match) {
                textNode.nodeValue = textNode.nodeValue.replace(match.fullText, '').trim();
                return match.url;
            }
            textNode = walker.nextNode();
        }
        return null;
    }

    function trimTrailingDescriptionNoise(container) {
        while (container.lastChild) {
            const node = container.lastChild;
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() === '') {
                node.remove();
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
                node.remove();
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'P' && node.textContent.trim() === '') {
                node.remove();
            } else {
                break;
            }
        }
    }

    function wrapDescriptionContent(descContainer) {
        const content = document.createElement('div');
        content.className = 'prts-desc-content';

        while (descContainer.firstChild) {
            content.appendChild(descContainer.firstChild);
        }
        if (content.textContent.trim() === '') {
            content.textContent = '(无文字描述)';
        }
        descContainer.appendChild(content);
    }

    function cleanBilibiliLinks(cardInner) {
        if (!CONFIG.cleanLink) return;
        const descContainer = cardInner.querySelector('.grow.text-gray-700');
        if (!descContainer || descContainer.dataset.biliProcessed) return;

        const videoUrl = extractAndRemoveBilibiliUrl(descContainer);
        trimTrailingDescriptionNoise(descContainer);
        wrapDescriptionContent(descContainer);
        descContainer.classList.add('prts-desc-wrapper');
        descContainer.classList.remove('grow');
        descContainer.style.width = '100%';

        if (videoUrl) {
            const btnContainer = document.createElement('div');
            btnContainer.className = 'prts-video-box';

            const linkBtn = document.createElement('a');
            linkBtn.href = videoUrl;
            linkBtn.target = "_blank";
            linkBtn.rel = "noopener noreferrer";
            linkBtn.className = 'prts-bili-link';
            const icon = document.createElement('span');
            icon.className = 'bp4-icon bp4-icon-video';
            linkBtn.appendChild(icon);
            linkBtn.appendChild(document.createTextNode('参考视频'));
            linkBtn.onclick = (e) => e.stopPropagation();

            btnContainer.appendChild(linkBtn);
            if (descContainer.parentNode) {
                descContainer.parentNode.insertBefore(btnContainer, descContainer.nextSibling);
            }
        }

        descContainer.dataset.biliProcessed = "true";
    }

    function requestFilterUpdate() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            rafId = null;
            applyFilterLogic();
        });
    }

    function scheduleFilterUpdate(delay = 80) {
        if (isFilterDisabledPage()) return;
        if (filterDebounceTimer) clearTimeout(filterDebounceTimer);
        filterDebounceTimer = setTimeout(() => {
            filterDebounceTimer = null;
            requestFilterUpdate();
        }, delay);
    }

    function syncPageScaffold() {
        applySidebarCollapse();
        optimizeDialogContent();
        createFloatingBall();
        injectFilterControls();
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
        syncPageScaffold();
        scheduleFilterUpdate(120);
        return true;
    }

    function isScriptOwnedNode(node) {
        if (!node || node.nodeType !== 1) return false;
        return Boolean(node.closest?.('#prts-filter-bar, #prts-float-container, #prts-toast-container, #prts-import-dialog, #prts-import-dialog-backdrop, #prts-compat-debug-panel, .prts-import-status, .prts-status-label'));
    }

    function hasRelevantDomMutation(mutations) {
        for (const mutation of mutations) {
            if (isScriptOwnedNode(mutation.target)) continue;

            const added = Array.from(mutation.addedNodes || []);
            const removed = Array.from(mutation.removedNodes || []);
            const changedNodes = added.concat(removed);
            if (changedNodes.some(node => !isScriptOwnedNode(node))) return true;
        }
        return false;
    }

    function optimizeCardVisuals(card, cardInner) {
        if (!CONFIG.visuals) return;

        const heading = cardInner.querySelector(`h4, h5, ${BP_SELECTORS.heading}`);
        const stageCodeSpan = cardInner.querySelector('.flex.whitespace-pre .inline-block.font-bold.my-auto');

        if (heading && !heading.dataset.badgeProcessed) {
            const titleTextNode = heading.querySelector('.whitespace-nowrap.overflow-hidden.text-ellipsis') || heading;
            let currentText = titleTextNode.innerText.trim();

            let badgeText = null;
            let titleCleanText = currentText;

            const rawCode = stageCodeSpan ? stageCodeSpan.innerText.trim() : "";
            const isInternalId = rawCode.includes('_') || (rawCode.length > 5 && /^[a-z]+$/.test(rawCode.replace(/\d/g, '')));

            if (rawCode && !isInternalId) {
                badgeText = rawCode;
                const escapedCode = rawCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`^\\s*(?:\\[|【)?\\s*${escapedCode}\\s*(?:\\]|】)?\\s*(?:[-_=:：|]\\s*|\\s+)?`, 'i');
                titleCleanText = currentText.replace(regex, '');
            } else {
                // 完美匹配格式:
                // [带横杠的标准格式] PA-1, PA-EX-1, 1-7, S4-1
                // [用户偷懒的不带杠格式] PA5, LE10
                // 以及匹配前置的各种括号 [PA-1], 【PA-1】
                const fallbackRegex = /^(?:\[|【)?(([A-Za-z0-9]{1,6}(?:-[A-Za-z0-9]{1,4})*-\d{1,3})|([A-Za-z]{2,5}\d{1,3}))(?:\]|】)?\s*(?:[-_=:：|]\s*|\s+(?!$))?(.*)$/i;

                const match = currentText.match(fallbackRegex);
                if (match) {
                    badgeText = match[1].toUpperCase(); // 提取到的关卡号，并统一转为大写 (如 pa-5 -> PA-5)
                    titleCleanText = match[4].trim();   // 剥离出真实的标题文本
                }
            }

            if (badgeText) {
                titleTextNode.innerText = titleCleanText;

                const badge = document.createElement('span');
                badge.className = 'prts-level-badge';
                badge.innerText = badgeText;
                heading.insertBefore(badge, heading.firstChild);
            }

            heading.dataset.badgeProcessed = "true";
        }

        const allDivs = Array.from(cardInner.querySelectorAll('div'));
        const labelDiv = allDivs.find(div => div.innerText.trim() === '干员/干员组');

        if (labelDiv && !labelDiv.dataset.opsProcessed) {
            const tagsContainer = labelDiv.nextElementSibling;
            if (tagsContainer) {
                const tags = tagsContainer.querySelectorAll(BP_SELECTORS.tag);
                let grid = tagsContainer.querySelector('.prts-op-grid');
                if (!grid) {
                    grid = document.createElement('div');
                    grid.className = 'prts-op-grid';
                    tagsContainer.insertBefore(grid, tagsContainer.firstChild);
                }

                tags.forEach(tag => {
                    if (tag.dataset.opExtracted) return;

                    const rawText = tag.innerText.trim();
                    const cleanText = rawText.replace(/^\[|\]$/g, '');
                    const parts = cleanText.split(/\s+/);
                    const nameKey = parts[0];
                    const extraInfo = parts[1] || "";

                    let newItem = null;

                    if (OP_ID_MAP[nameKey]) {
                        const opId = OP_ID_MAP[nameKey];
                        newItem = document.createElement('div');
                        newItem.className = 'prts-op-item';
                        const img = document.createElement('img');
                        img.src = `/assets/operator-avatars/webp96/${opId}.webp`;
                        img.className = 'prts-op-img';
                        img.loading = "lazy";
                        newItem.appendChild(img);
                    } else if (nameKey.length > 0) {
                        reportUnknownOperatorName(nameKey, { source: 'card', example: cleanText });
                        newItem = document.createElement('div');
                        newItem.className = 'prts-op-text';
                        newItem.innerText = nameKey;
                    }

                    if (newItem && extraInfo) {
                        const badge = document.createElement('div');
                        badge.className = 'prts-op-skill';
                        badge.innerText = extraInfo;
                        newItem.appendChild(badge);
                    }

                    if (!newItem) return;

                    const interactiveWrapper = tag.closest(BP_SELECTORS.popoverTarget);
                    if (interactiveWrapper) {
                        grid.appendChild(interactiveWrapper);
                        interactiveWrapper.innerHTML = '';
                        interactiveWrapper.appendChild(newItem);
                    } else {
                        const tooltipText = `${nameKey}${extraInfo ? ' ' + extraInfo : ''}`;
                        newItem.setAttribute('data-prts-tooltip', tooltipText);
                        grid.appendChild(newItem);
                        tag.style.display = 'none';
                    }

                    tag.dataset.opExtracted = "true";
                });
                labelDiv.dataset.opsProcessed = "true";
            }
        }
    }

    function enhancePopover(portalNode) {
        const content = portalNode.querySelector(BP_SELECTORS.popoverContent);
        if (!content || content.dataset.optimized) return;

        const wrapper = content.closest(BP_SELECTORS.popover);
        if (wrapper && (
            wrapper.classList.contains('bp4-suggest-popover') ||
            wrapper.classList.contains('bp6-suggest-popover') ||
            wrapper.classList.contains('bp4-select-popover') ||
            wrapper.classList.contains('bp6-select-popover')
        )) {
            return;
        }

        if (window.location.pathname.startsWith('/create')) {
            if (content.querySelector(BP_SELECTORS.menuOrItem)) return;
        }

        const text = content.innerText.trim();
        const cleanText = text.replace(/^->\s*/, '');
        const firstWord = cleanText.split(/[\s,，]+/)[0];
        const isSingleOperator = OP_ID_MAP[firstWord];
        const hasOperatorSeparator = text.includes(',') || text.includes('，');

        if (!text.startsWith('->') && !hasOperatorSeparator && !isSingleOperator) return;

        const rawList = cleanText.split(/[,，]\s*/);
        const validOps =[];

        rawList.forEach(entry => {
            const parts = entry.trim().split(/\s+/);
            const name = parts[0];
            const skill = parts[1] || "";
            if (!name) return;

            if (OP_ID_MAP[name]) {
                validOps.push({ name: name, id: OP_ID_MAP[name], skill: skill });
            } else {
                reportUnknownOperatorName(name, { source: 'popover', example: cleanText });
            }
        });

        if (validOps.length > 0) {
            content.innerHTML = '';
            const grid = document.createElement('div');
            grid.className = 'prts-popover-grid';

            validOps.forEach(op => {
                const item = document.createElement('div');
                item.className = 'prts-popover-item';
                item.title = `${op.name} ${op.skill ? '(技能 ' + op.skill + ')' : ''}`;

                const img = document.createElement('img');
                img.src = `/assets/operator-avatars/webp96/${op.id}.webp`;
                img.className = 'prts-popover-img';

                item.appendChild(img);
                if (op.skill) {
                    const badge = document.createElement('div');
                    badge.className = 'prts-popover-skill';
                    badge.innerText = op.skill;
                    item.appendChild(badge);
                }
                grid.appendChild(item);
            });

            content.appendChild(grid);
            content.dataset.optimized = "true";
        }
    }

    /**
     * [筛选逻辑的核心应用方法] - 包含最优算法注入
     */
    function applyFilterLogic() {
        if (isFilterDisabledPage()) {
            setCompatibilityDiagnostics({ totalCards: 0, fiberCards: 0, fallbackCards: 0, noDataCards: 0 });
            return;
        }
        isProcessingFilter = true;

        try {
            let cards = document.querySelectorAll('ul.grid > li, .tabular-nums ul > li');
            const diagnostics = {
                totalCards: cards.length,
                fiberCards: 0,
                fallbackCards: 0,
                noDataCards: 0
            };
            if (cards.length === 0) {
                setCompatibilityDiagnostics(diagnostics);
                return;
            }

            cards.forEach(card => {
                const cardInner = card.querySelector(BP_SELECTORS.card);
                if (!cardInner) {
                    diagnostics.noDataCards += 1;
                    return;
                }

                optimizeCardVisuals(card, cardInner);
                cleanBilibiliLinks(cardInner);

                const resolution = getOperationResolutionForCard(card, cardInner);
                const operation = resolution.operation;
                if (hasEffectiveOperationData(operation)) {
                    if (resolution.source === 'fiber') {
                        diagnostics.fiberCards += 1;
                    } else {
                        diagnostics.fallbackCards += 1;
                    }
                } else {
                    diagnostics.noDataCards += 1;
                }

                const { isAvailable, missingCount, missingOps } = checkOperationAvailability(operation, ownedOpsSet, currentFilterMode);

                if (!isAvailable && displayMode === 'HIDE') {
                    if (card.style.display !== 'none') card.style.display = 'none';
                    return;
                } else {
                    if (card.style.display === 'none') card.style.display = '';
                }

                const hasGrayClass = card.classList.contains('prts-card-gray');
                if (!isAvailable && displayMode === 'GRAY') {
                    if (!hasGrayClass) card.classList.add('prts-card-gray');
                } else {
                    if (hasGrayClass) card.classList.remove('prts-card-gray');
                }

                const existingLabel = cardInner.querySelector('.prts-status-label');
                const showMissingInfo = !isAvailable || (currentFilterMode === 'SUPPORT' && missingCount === 1);

                if (!showMissingInfo) {
                    if (existingLabel) existingLabel.remove();
                    return;
                }

                let labelText = '';
                let iconText = '';
                let newClass = 'prts-status-label';

                if (currentFilterMode === 'SUPPORT' && missingCount === 1) {
                    newClass += ' prts-label-support';
                    const name = missingOps[0];
                    iconText = '👤';
                    labelText = `需助战: ${name}`;
                } else {
                    newClass += ' prts-label-missing';
                    const listStr = missingOps.slice(0, 3).join(', ') + (missingCount > 3 ? '...' : '');
                    iconText = '✘';
                    labelText = `缺 ${missingCount} 人${missingCount > 0 ? ': ' + listStr : ''}`;
                }

                if (existingLabel) {
                    updateStatusLabel(existingLabel, newClass, iconText, labelText);
                } else {
                    const labelDiv = document.createElement('div');
                    updateStatusLabel(labelDiv, newClass, iconText, labelText);

                    const descContainer = cardInner.querySelector('.prts-desc-wrapper') ||
                                         cardInner.querySelector('.grow.text-gray-700') ||
                                         cardInner.querySelector('.text-gray-700');
                    if (descContainer) {
                        cardInner.insertBefore(labelDiv, descContainer);
                    } else {
                        cardInner.appendChild(labelDiv);
                    }
                }
            });

            setCompatibilityDiagnostics(diagnostics);

        } finally {
            isProcessingFilter = false;
        }
    }
