    const cardDiagnosticsCache = new WeakMap();
    function createCardDiagnostics(source = 'none') {
        return {
            fiberCards: source === 'fiber' ? 1 : 0,
            fallbackCards: source === 'fallback' ? 1 : 0,
            noDataCards: source === 'none' ? 1 : 0,
            filterStatus: 'pending',
            visible: true
        };
    }

    function syncOperationCardTime(cardInner) {
        const timeText = cardInner.querySelector('.bp4-icon-time, .bp6-icon-time')?.parentElement
            ?.querySelector('.bp4-popover2-target > span, .bp6-popover-target > span');
        if (!timeText) return;
        const exactTime = CONFIG.showExactTime ? extractPopoverContentFromFiber(timeText) : '';
        timeText.classList.toggle('prts-exact-time', Boolean(exactTime));
        if (exactTime) {
            timeText.dataset.prtsExactTime = exactTime;
            timeText.setAttribute('aria-label', exactTime);
        } else {
            delete timeText.dataset.prtsExactTime;
            timeText.removeAttribute('aria-label');
        }
    }

    function updateTrainingStatusLabel(label, className, icon, text, issues) {
        const compact = CONFIG.trainingPromptStyle === 'COMPACT';
        const state = JSON.stringify([className, icon, text, issues, compact]);
        if (label.dataset.prtsStatusState === state) return;
        const expanded = label.querySelector('.prts-training-more')?.open;
        const compactExpanded = label.querySelector('.prts-training-details')?.open;
        label.className = `${className} prts-training-status${compact ? ' prts-training-compact' : ''}`;
        label.removeAttribute('aria-label');
        label.onclick = event => event.stopPropagation();
        label.onkeydown = event => {
            if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
        };
        label.replaceChildren();

        const heading = document.createElement(compact ? 'summary' : 'div');
        heading.className = 'prts-training-heading';
        const iconEl = createPrtsIcon(icon) || document.createElement('span');
        iconEl.classList.add('prts-status-icon');
        iconEl.setAttribute('aria-hidden', 'true');
        heading.appendChild(iconEl);
        const headingText = document.createElement('span');
        headingText.className = 'prts-training-heading-text';
        headingText.textContent = text;
        headingText.title = text;
        heading.appendChild(headingText);
        let content = label;
        if (compact) {
            content = document.createElement('details');
            content.className = 'prts-training-details';
            content.open = Boolean(compactExpanded);
            content.appendChild(heading);
            label.appendChild(content);
            const hint = document.createElement('span');
            hint.className = 'prts-training-toggle';
            hint.setAttribute('aria-hidden', 'true');
            hint.textContent = '详情';
            heading.appendChild(hint);
        } else {
            label.appendChild(heading);
        }

        const columns = document.createElement('div');
        columns.className = 'prts-training-columns';
        for (const title of ['项目', '当前', '作业要求']) {
            const column = document.createElement('span');
            column.textContent = title;
            columns.appendChild(column);
        }
        content.appendChild(columns);

        let extra;
        const orderedIssues = [...issues].sort((left, right) =>
            Number(left.status === 'unknown') - Number(right.status === 'unknown'));
        orderedIssues.forEach((operator, index) => {
            if (index === 2) {
                extra = document.createElement('details');
                extra.className = 'prts-training-more';
                extra.open = Boolean(expanded);
                const summary = document.createElement('summary');
                summary.textContent = `还有 ${issues.length - 2} 项，展开查看`;
                extra.appendChild(summary);
                content.appendChild(extra);
            }
            const section = document.createElement('div');
            section.className = 'prts-training-operator';
            const name = document.createElement('div');
            name.className = 'prts-training-name';
            name.textContent = operator.name;
            if (operator.group) {
                const group = document.createElement('span');
                group.className = 'prts-training-group';
                group.textContent = `干员组：${operator.group}`;
                name.appendChild(group);
            }
            section.appendChild(name);
            operator.issues.forEach(issue => {
                const row = document.createElement('div');
                row.className = `prts-training-row prts-training-${issue.status}`;
                for (const [className, value, title] of [
                    ['prts-training-field', issue.label, '项目'],
                    ['prts-training-current', issue.current, '当前'],
                    ['prts-training-required', issue.required, '作业要求']
                ]) {
                    const cell = document.createElement('span');
                    cell.className = className;
                    cell.textContent = value;
                    cell.setAttribute('aria-label', `${title}：${value}`);
                    row.appendChild(cell);
                }
                section.appendChild(row);
            });
            (extra || content).appendChild(section);
        });
        label.dataset.prtsStatusState = state;
    }

    function processOperationCard(card) {
        try {
            return processOperationCardContent(card);
        } catch (error) {
            console.warn('[Better PRTS] 作业卡片处理失败', error instanceof Error ? error.message : '未知错误');
            const operation = operationCache.get(card)?.resolution.operation;
            operationCache.delete(card);
            const diagnostics = createCardDiagnostics('none');
            cardDiagnosticsCache.set(card, diagnostics);
            const cardInner = card.querySelector(BP_SELECTORS.card);
            const hiddenVideo = CONFIG.hideVideo && cardInner && isVideoOperationCard(cardInner, operation);
            diagnostics.filterStatus = hiddenVideo ? 'hiddenVideo' : 'pending';
            diagnostics.visible = !hiddenVideo;
            card.style.display = hiddenVideo ? 'none' : '';
            card.classList.remove('prts-card-gray');
            if (cardInner) {
                const label = cardInner.querySelector('.prts-status-label') || document.createElement('div');
                label.onclick = null;
                label.onkeydown = null;
                updateStatusLabel(label, 'prts-status-label prts-label-support', 'pending', '作业数据待核验');
                if (!label.parentElement) cardInner.appendChild(label);
            }
            return diagnostics;
        }
    }

    function processOperationCardContent(card) {
        const cardInner = card.querySelector(BP_SELECTORS.card);
        if (!cardInner) {
            const diagnostics = createCardDiagnostics('none');
            card.style.display = '';
            card.classList.remove('prts-card-gray');
            cardDiagnosticsCache.set(card, diagnostics);
            return diagnostics;
        }

        if (CONFIG.hidePrtsBadge) getCardTypeTag(cardInner, 'PRTS')?.remove();
        syncOperationCardTime(cardInner);
        addStageBadge(cardInner);
        syncCardStageFilters(cardInner);
        replaceCardOperatorAvatars(cardInner);
        cleanBilibiliLinks(cardInner);
        collapseCardDescription(cardInner);

        const resolution = getOperationResolutionForCard(card, cardInner);
        const operation = resolution.operation;
        const diagnostics = hasEffectiveOperationData(operation)
            ? createCardDiagnostics(resolution.source)
            : createCardDiagnostics('none');

        if (CONFIG.hideVideo && isVideoOperationCard(cardInner, operation)) {
            diagnostics.filterStatus = 'hiddenVideo';
            diagnostics.visible = false;
            if (card.style.display !== 'none') card.style.display = 'none';
            cardDiagnosticsCache.set(card, diagnostics);
            return diagnostics;
        }
        const { isAvailable, missingCount, missingOps, lowTraining, unknownTraining, trainingIssues, hasRequirements } =
            checkOperationAvailability(operation, ownedOpsSet, CONFIG.filterMode, accountsTraining[activeAccountId], CONFIG.trainingCheck);

        if (!isAvailable || (CONFIG.trainingCheck && CONFIG.filterMode === 'NONE' && missingCount > 0)) {
            diagnostics.filterStatus = 'unavailable';
        } else if (diagnostics.noDataCards || (CONFIG.trainingCheck && (unknownTraining.length || !hasRequirements))) {
            diagnostics.filterStatus = 'pending';
        } else {
            diagnostics.filterStatus = CONFIG.filterMode === 'SUPPORT' && missingCount === 1 ? 'support' : 'available';
        }

        if (!isAvailable && CONFIG.displayMode === 'HIDE') {
            diagnostics.visible = false;
            if (card.style.display !== 'none') card.style.display = 'none';
            cardDiagnosticsCache.set(card, diagnostics);
            return diagnostics;
        }

        if (card.style.display === 'none') card.style.display = '';

        const hasGrayClass = card.classList.contains('prts-card-gray');
        if (!isAvailable && CONFIG.displayMode === 'GRAY') {
            if (!hasGrayClass) card.classList.add('prts-card-gray');
        } else if (hasGrayClass) {
            card.classList.remove('prts-card-gray');
        }

        const existingLabel = cardInner.querySelector('.prts-status-label');
        const showMissingInfo = !isAvailable || (CONFIG.filterMode === 'SUPPORT' && missingCount === 1) ||
            (CONFIG.trainingCheck && diagnostics.noDataCards === 0 &&
                (lowTraining.length || unknownTraining.length || !hasRequirements));

        if (!showMissingInfo) {
            if (existingLabel) existingLabel.remove();
            cardDiagnosticsCache.set(card, diagnostics);
            return diagnostics;
        }

        let labelText = '';
        let iconText = '';
        let newClass = 'prts-status-label';

        if (CONFIG.filterMode === 'SUPPORT' && missingCount === 1) {
            newClass += ' prts-label-support';
            const name = missingOps[0];
            iconText = 'support';
            labelText = `需助战：${name}`;
        } else if (missingCount > 0 && CONFIG.filterMode !== 'NONE') {
            newClass += ' prts-label-missing';
            const listStr = missingOps.slice(0, 3).join('、') + (missingCount > 3 ? '…' : '');
            iconText = lowTraining.length ? 'lowTraining' : 'missingOperators';
            labelText = `${lowTraining.length ? '未达要求' : '缺'} ${missingCount} 人${missingCount > 0 ? '：' + listStr : ''}`;
        }
        if (CONFIG.trainingCheck) {
            if (!labelText && lowTraining.length) labelText = `练度不足 · ${lowTraining.length} 个位置`;
            else if (!labelText && unknownTraining.length) labelText = `练度待核验 · ${unknownTraining.length} 人`;
            if (!hasRequirements) labelText += `${labelText ? ' · ' : ''}未标注练度`;
        }
        if (!iconText) {
            iconText = lowTraining.length ? 'lowTraining' : unknownTraining.length ? 'pending' : 'unmarkedTraining';
            if (lowTraining.length) newClass += ' prts-label-missing';
            else if (unknownTraining.length) newClass += ' prts-label-support';
        }

        const labelDiv = existingLabel || document.createElement('div');
        if (CONFIG.trainingCheck && trainingIssues.length) {
            updateTrainingStatusLabel(labelDiv, newClass, iconText, labelText, trainingIssues);
        } else {
            labelDiv.onclick = null;
            labelDiv.onkeydown = null;
            updateStatusLabel(labelDiv, newClass, iconText, labelText);
        }
        if (!existingLabel) {
            const descContainer = cardInner.querySelector('.prts-desc-wrapper') ||
                                 cardInner.querySelector('.grow.text-gray-700') ||
                                 cardInner.querySelector('.text-gray-700');
            if (descContainer) {
                cardInner.insertBefore(labelDiv, descContainer);
            } else {
                cardInner.appendChild(labelDiv);
            }
        }

        cardDiagnosticsCache.set(card, diagnostics);
        return diagnostics;
    }

    function aggregateCardDiagnostics(cards) {
        const diagnostics = {
            totalCards: cards.length,
            fiberCards: 0,
            fallbackCards: 0,
            noDataCards: 0,
            availableCards: 0,
            supportCards: 0,
            pendingCards: 0,
            unavailableCards: 0,
            hiddenVideoCards: 0,
            visibleCards: 0
        };

        cards.forEach(card => {
            const cached = cardDiagnosticsCache.get(card) || processOperationCard(card);
            diagnostics.fiberCards += cached.fiberCards;
            diagnostics.fallbackCards += cached.fallbackCards;
            diagnostics.noDataCards += cached.noDataCards;
            diagnostics[`${cached.filterStatus}Cards`] += 1;
            diagnostics.visibleCards += Number(cached.visible);
        });
        return diagnostics;
    }

    function applyFilterLogic() {
        if (isFilterDisabledPage()) {
            filterUpdateCoordinator.reset();
            setCompatibilityDiagnostics({ totalCards: 0, fiberCards: 0, fallbackCards: 0, noDataCards: 0 });
            renderFilterResults(null);
            return;
        }
        try {
            const cards = getOperationCards();
            if (cards.length === 0) filterUpdateCoordinator.reset();

            const work = filterUpdateCoordinator.takeWork(cards);
            work.cards.forEach(processOperationCard);

            const diagnostics = aggregateCardDiagnostics(cards);
            setCompatibilityDiagnostics(diagnostics);
            renderFilterResults(diagnostics);
        } catch (error) {
            filterUpdateCoordinator.reset();
            throw error;
        }
    }
