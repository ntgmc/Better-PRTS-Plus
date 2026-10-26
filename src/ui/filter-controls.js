    function toggleDisplayMode() {
        CONFIG.displayMode = (CONFIG.displayMode === 'GRAY') ? 'HIDE' : 'GRAY';
        saveConfig();
        injectFilterControls();
        requestFilterUpdate();
    }

    function toggleFilter(mode) {
        if (ownedOpsSet.size === 0) {
            showPrtsToast('请先导入干员数据', 'warning', `当前账号：${getAccountLabel(activeAccountId)}`);
            return;
        }
        CONFIG.filterMode = normalizeFilterMode(CONFIG.filterMode === mode ? 'NONE' : mode);
        saveConfig();
        updateFilterButtonStyles();
        requestFilterUpdate();
    }

    function toggleTrainingCheck() {
        if (ownedOpsSet.size === 0) {
            showPrtsToast('请先导入干员数据', 'warning', `当前账号：${getAccountLabel(activeAccountId)}`);
            return;
        }
        CONFIG.trainingCheck = !CONFIG.trainingCheck;
        saveConfig();
        updateFilterButtonStyles();
        requestFilterUpdate();
    }

    function applySidebarCollapse() {
        if (isFilterDisabledPage()) return;
        const wrapper = document.querySelector('.docs-content-wrapper');
        if (!wrapper) return;
        const layoutContainer = wrapper.firstElementChild;
        if (layoutContainer && layoutContainer.classList.contains('flex')) {
            if (CONFIG.hideSidebar) {
                layoutContainer.classList.add('prts-sidebar-hidden-layout');
            } else {
                layoutContainer.classList.remove('prts-sidebar-hidden-layout');
            }
        }
    }

    function updateFilterButtonStyles() {
        const perfectBtn = document.getElementById('btn-perfect');
        const supportBtn = document.getElementById('btn-support');
        const trainingBtn = document.getElementById('btn-training');
        if (!perfectBtn || !supportBtn) return;

        perfectBtn.classList.remove('prts-active');
        supportBtn.classList.remove('prts-active');
        perfectBtn.setAttribute('aria-pressed', CONFIG.filterMode === 'PERFECT' ? 'true' : 'false');
        supportBtn.setAttribute('aria-pressed', CONFIG.filterMode === 'SUPPORT' ? 'true' : 'false');

        if (CONFIG.filterMode === 'PERFECT') perfectBtn.classList.add('prts-active');
        else if (CONFIG.filterMode === 'SUPPORT') supportBtn.classList.add('prts-active');
        if (trainingBtn) {
            trainingBtn.classList.toggle('prts-active', CONFIG.trainingCheck);
            trainingBtn.setAttribute('aria-pressed', String(CONFIG.trainingCheck));
        }
    }

    let filterResults = null;

    function renderFilterResults(stats = filterResults) {
        filterResults = stats;
        const root = getOperationListRoot();
        const list = root && root !== document ? root.querySelector('ul.grid') : null;
        const container = root === document ? document.getElementById('prts-filter-bar') : list?.parentElement;
        let results = document.getElementById('prts-filter-results');
        if (!container || isFilterDisabledPage()) {
            results?.remove();
            return;
        }
        if (!results) {
            results = document.createElement('div');
            results.id = 'prts-filter-results';
            results.setAttribute('role', 'status');
            results.setAttribute('aria-live', 'polite');
            results.setAttribute('aria-atomic', 'true');
            const summary = document.createElement('p');
            summary.className = 'prts-filter-summary';
            const empty = document.createElement('div');
            empty.className = 'prts-filter-empty';
            const message = document.createElement('p');
            message.className = 'prts-filter-empty-message';
            empty.appendChild(message);
            empty.appendChild(createPrtsButton({
                id: 'btn-filter-show-all', text: '切换为置灰模式', icon: 'showAll',
                onClick: () => {
                    toggleDisplayMode();
                    const activeRoot = getOperationListRoot();
                    (activeRoot === document ? document.getElementById('btn-setting') : activeRoot)?.focus();
                }
            }));
            results.appendChild(summary);
            results.appendChild(empty);
        }

        if (list) {
            if (list.previousElementSibling !== results) container.insertBefore(results, list);
        } else if (container.lastChild !== results) {
            container.appendChild(results);
        }

        const scope = list ? '本作业集' : '本页';
        let summaryText = `正在统计${scope}作业…`;
        let messageText = '';
        let showAll = false;
        if (stats) {
            const filtering = ownedOpsSet.size > 0 && (CONFIG.filterMode !== 'NONE' || CONFIG.trainingCheck);
            summaryText = `${scope} ${stats.totalCards} 份作业`;
            if (filtering) {
                summaryText += `，可用 ${stats.availableCards} 份，需助战 ${stats.supportCards} 份，待核验 ${stats.pendingCards} 份，不符合 ${stats.unavailableCards} 份`;
            } else if (stats.totalCards) {
                summaryText += ownedOpsSet.size ? '，未开启筛选' : '，请先导入干员数据后筛选';
            }
            if (stats.hiddenVideoCards) summaryText += `，已隐藏视频作业 ${stats.hiddenVideoCards} 份`;
            summaryText += '。';

            if (!stats.totalCards) {
                messageText = list ? '本作业集暂无作业。' : '当前页面暂无作业。正在加载时请稍候，也可调整搜索条件或翻页。';
            } else if (stats.hiddenVideoCards === stats.totalCards) {
                messageText = `${scope}全部是视频作业，已隐藏。可在悬浮球 → 作业卡片中关闭“隐藏视频作业”${list ? '' : '，或查看其他页'}。`;
            } else if (filtering && !stats.availableCards && !stats.supportCards) {
                if (stats.pendingCards) {
                    messageText = `${scope}暂未找到已确认可用的作业，已保留 ${stats.pendingCards} 份待核验作业。请查看卡片提示或补充干员数据。`;
                } else {
                    showAll = CONFIG.displayMode === 'HIDE' && !stats.visibleCards;
                    messageText = showAll
                        ? `${scope}没有符合当前筛选条件的作业，已隐藏 ${stats.unavailableCards} 份。可切换为置灰模式查看原因，或调整筛选条件、切换账号${list ? '' : '、查看其他页'}。`
                        : `${scope}没有符合当前筛选条件的作业。请调整筛选条件、切换账号${list ? '' : '，或查看其他页'}。`;
                }
            }
        }

        const summary = results.querySelector('.prts-filter-summary');
        const message = results.querySelector('.prts-filter-empty-message');
        if (summary.textContent !== summaryText) summary.textContent = summaryText;
        if (message.textContent !== messageText) message.textContent = messageText;
        results.querySelector('.prts-filter-empty').hidden = !messageText;
        document.getElementById('btn-filter-show-all').hidden = !showAll;
    }

    function injectFilterControls() {
        if (isFilterDisabledPage()) {
            const existing = document.getElementById('prts-filter-bar');
            if (existing) existing.remove();
            return;
        }

        const searchInputGroup = findSearchInputGroup();
        if (!searchInputGroup) return;
        const searchRow = searchInputGroup.parentElement;
        if (!searchRow || !searchRow.parentNode) return;

        let controlBar = document.getElementById('prts-filter-bar');
        let isNew = false;
        if (!controlBar) {
            isNew = true;
            controlBar = document.createElement('div');
            controlBar.id = 'prts-filter-bar';
        }
        controlBar.setAttribute('role', 'toolbar');
        controlBar.setAttribute('aria-label', 'Better-PRTS-Plus 筛选工具栏');

        if (searchRow.nextElementSibling !== controlBar) {
            searchRow.parentNode.insertBefore(controlBar, searchRow.nextElementSibling);
        }

        let mainRow = document.getElementById('prts-filter-main-row');
        if (!mainRow) {
            mainRow = document.createElement('div');
            mainRow.id = 'prts-filter-main-row';
        }
        mainRow.className = 'prts-filter-main-row';
        if (mainRow.parentElement !== controlBar) controlBar.insertBefore(mainRow, controlBar.firstChild);

        let syncRow = document.getElementById('prts-filter-sync-row');
        if (!syncRow) {
            syncRow = document.createElement('div');
            syncRow.id = 'prts-filter-sync-row';
        }
        syncRow.className = 'prts-filter-sync-row';
        if (syncRow.parentElement !== controlBar) controlBar.appendChild(syncRow);

        // 顺序生成元素

        // (1) 少量账号点击轮换，三个及以上直接选择。
        let accountControl;
        if (getAccountIds().length < 3) {
            const existing = document.getElementById('btn-account');
            if (existing && existing.tagName !== 'BUTTON') existing.remove();
            const label = getAccountLabel(activeAccountId);
            accountControl = createPrtsButton({
                id: 'btn-account', text: label, icon: 'account', disabled: getAccountIds().length === 1,
                ariaLabel: `当前账号 ${label}${getAccountIds().length === 1 ? '，仅有一个账号' : '，点击切换账号'}`, onClick: cycleAccount
            });
        } else {
            accountControl = createAccountSelect('btn-account', activeAccountId, event => switchAccount(Number(event.target.value)));
        }

        const activeSklandSync = getAccountSklandSyncMeta(activeAccountId);
        let accountSyncChip = document.getElementById('prts-account-sync-chip');
        if (activeSklandSync) {
            if (!accountSyncChip) {
                accountSyncChip = document.createElement('span');
                accountSyncChip.id = 'prts-account-sync-chip';
                accountSyncChip.className = 'prts-account-sync-chip';
            }
            accountSyncChip.textContent = formatSklandSyncSummary(activeSklandSync, { compact: true });
            accountSyncChip.title = formatSklandSyncSummary(activeSklandSync, { includeDetail: true });
            if (accountSyncChip.parentElement !== syncRow) syncRow.appendChild(accountSyncChip);
        } else if (accountSyncChip) {
            accountSyncChip.remove();
        }

        // (2) 导入按钮
        const importText = ownedOpsSet.size > 0 ? `导入干员 (${ownedOpsSet.size})` : '导入干员';
        const btnImport = createPrtsButton({ id: 'btn-import', text: importText, icon: 'importOperators', ariaLabel: importText, onClick: handleImport });

        const btnSklandImport = createPrtsButton({ id: 'btn-skland-import', text: '森空岛导入', icon: 'skland', onClick: handleOpenSklandImport });

        // (3) 模式切换
        const displayModeText = CONFIG.displayMode === 'GRAY' ? '置灰模式' : '隐藏模式';
        const displayModeIcon = CONFIG.displayMode === 'GRAY' ? 'grayMode' : 'hideMode';
        const btnSetting = createPrtsButton({ id: 'btn-setting', text: displayModeText, icon: displayModeIcon, pressed: CONFIG.displayMode === 'HIDE', ariaLabel: `当前为${displayModeText}，点击切换显示模式`, onClick: toggleDisplayMode });

        // (4) 完美阵容
        const btnPerfect = createPrtsButton({
            id: 'btn-perfect',
            text: '完美阵容',
            icon: 'perfectSquad',
            onClick: () => toggleFilter('PERFECT'),
            active: CONFIG.filterMode === 'PERFECT',
            pressed: CONFIG.filterMode === 'PERFECT'
        });

        // (5) 允许助战
        const btnSupport = createPrtsButton({
            id: 'btn-support',
            text: '允许助战',
            icon: 'support',
            onClick: () => toggleFilter('SUPPORT'),
            active: CONFIG.filterMode === 'SUPPORT',
            pressed: CONFIG.filterMode === 'SUPPORT'
        });
        const btnTraining = createPrtsButton({
            id: 'btn-training', text: '校验练度', icon: 'trainingCheck',
            onClick: toggleTrainingCheck, active: CONFIG.trainingCheck, pressed: CONFIG.trainingCheck
        });
        btnTraining.title = '核对作业标注的练度要求；缺少数据时提示“待核验”';

        [
            ['prts-filter-accounts', '账号与数据', [accountControl, btnImport, btnSklandImport]],
            ['prts-filter-options', '筛选条件与显示模式', [btnPerfect, btnSupport, btnTraining, btnSetting]]
        ].forEach(([id, label, controls], index) => {
            let group = document.getElementById(id);
            if (!group) {
                group = document.createElement('div');
                group.id = id;
                group.className = 'prts-filter-group';
                group.setAttribute('role', 'group');
                group.setAttribute('aria-label', label);
            }
            // 原生下拉框展开时，移动它或父节点会关闭菜单并丢失焦点。
            if (mainRow.children[index] !== group) mainRow.insertBefore(group, mainRow.children[index] || null);
            controls.forEach((control, controlIndex) => {
                if (group.children[controlIndex] !== control) group.insertBefore(control, group.children[controlIndex] || null);
            });
        });

        renderFilterResults();
        if (isNew) requestFilterUpdate();
    }
