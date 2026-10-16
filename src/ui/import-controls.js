    // =========================================================================
    //                            MODULE 5: 业务逻辑 - 筛选、折叠与净化
    // =========================================================================

    function isFilterDisabledPage() {
        const path = window.location.pathname;
        return path.startsWith('/create') || path.startsWith('/editor');
    }

    function getImportErrorMessage(error) {
        return error instanceof Error ? error.message : '未知错误';
    }

    function formatOperatorImportDiff(diff) {
        return `新增 ${diff.added} / 移除 ${diff.removed} / 当前 ${diff.total}`;
    }

    function setOperatorImportStatus(statusEl, message, type = '') {
        if (!statusEl) return;

        const statusType = ['loading', 'success', 'warning', 'error'].includes(type) ? type : '';
        statusEl.className = `prts-import-status${statusType ? ` ${statusType}` : ''}`;
        statusEl.textContent = message;
        statusEl.setAttribute('role', statusType === 'error' ? 'alert' : 'status');
        statusEl.setAttribute('aria-live', statusType === 'error' ? 'assertive' : 'polite');
    }

    function closeOperatorImportDialog() {
        if (operatorImportDialogCleanup) {
            operatorImportDialogCleanup();
            operatorImportDialogCleanup = null;
            return;
        }

        document.getElementById('prts-import-dialog')?.remove();
        document.getElementById('prts-import-dialog-backdrop')?.remove();
    }

    async function applyImportedOperatorNames(accountId, names, sourceLabel, statusEl, training = {}) {
        const targetAccountId = normalizeAccountId(accountId);
        const sanitizedNames = sanitizeOperatorNames(names);
        if (sanitizedNames.length === 0) {
            const message = '未能识别有效的干员数据，请检查 JSON/TXT 内容。';
            setOperatorImportStatus(statusEl, message, 'warning');
            showPrtsToast('未能识别有效的干员数据', 'warning', '请检查文件或粘贴内容后重试。');
            return false;
        }

        const nextState = await confirmOperatorImport(targetAccountId, sanitizedNames, training, sourceLabel);
        if (!nextState) {
            setOperatorImportStatus(statusEl, '已取消导入，未修改账号数据。');
            return false;
        }
        const accountLabel = nextState.accountMeta[targetAccountId].label;
        const diff = getOperatorImportDiff(nextState.accountsData[targetAccountId], sanitizedNames);
        const diffText = formatOperatorImportDiff(diff);
        const sourceText = sourceLabel ? `来源：${sourceLabel}` : '来源：导入内容';
        const unrecognizedNames = sanitizedNames.filter(name => !Object.prototype.hasOwnProperty.call(OP_ID_MAP, name));
        const recognitionText = `已识别 ${sanitizedNames.length - unrecognizedNames.length} 名 / 未识别 ${unrecognizedNames.length} 名`;

        nextState.accountsData[targetAccountId] = sanitizedNames;
        nextState.accountsTraining[targetAccountId] = training;
        commitAccountState(nextState);
        refreshAccountStateUi();

        const type = unrecognizedNames.length ? 'warning' : 'success';
        const message = unrecognizedNames.length ? `${accountLabel} 已导入，名称待核对` : `${accountLabel} 导入成功`;
        const detail = [diffText, sourceText, recognitionText];
        if (unrecognizedNames.length) {
            detail.push(`未识别名称：${unrecognizedNames.join('、')}`, '这些名称已保留，请核对拼写；新干员可能尚未收录。');
        }
        setOperatorImportStatus(statusEl, `${message}\n${detail.join('\n')}`, type);
        showPrtsToast(message, type, detail.join('\n'));
        return true;
    }

    function readOperatorImportFile(accountId, file, statusEl) {
        if (!file) return Promise.resolve(false);

        if (file.size > OPERATOR_IMPORT_MAX_BYTES) {
            const message = '文件过大，请上传标准格式的干员数据文件。';
            setOperatorImportStatus(statusEl, message, 'error');
            showPrtsToast('导入失败', 'error', message);
            return Promise.resolve(false);
        }

        setOperatorImportStatus(statusEl, `正在读取 ${file.name || '导入文件'}...`, 'loading');
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = async event => {
                try {
                    const { names, training } = parseImportedOperators(event.target.result, file.name);
                    resolve(await applyImportedOperatorNames(accountId, names, file.name || '文件导入', statusEl, training));
                } catch (error) {
                    const message = getImportErrorMessage(error);
                    console.error('[Better PRTS] 导入干员数据失败', error);
                    setOperatorImportStatus(statusEl, `导入失败：${message}`, 'error');
                    showPrtsToast('导入失败', 'error', message);
                    resolve(false);
                }
            };
            reader.onerror = () => {
                const message = reader.error?.message || '无法读取文件，请重试。';
                setOperatorImportStatus(statusEl, `导入失败：${message}`, 'error');
                showPrtsToast('导入失败', 'error', message);
                resolve(false);
            };
            reader.readAsText(file);
        });
    }

    function openOperatorImportDialog() {
        const existingDialog = document.getElementById('prts-import-dialog');
        if (existingDialog) {
            existingDialog.querySelector('.prts-import-textarea')?.focus();
            return;
        }

        const targetAccountId = normalizeAccountId(activeAccountId);
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const backdrop = document.createElement('div');
        backdrop.id = 'prts-import-dialog-backdrop';

        const dialog = document.createElement('div');
        dialog.id = 'prts-import-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'prts-import-dialog-title');
        dialog.setAttribute('aria-describedby', 'prts-import-dialog-help');

        const head = document.createElement('div');
        head.className = 'prts-import-head';

        const headingWrap = document.createElement('div');
        const title = document.createElement('h2');
        title.id = 'prts-import-dialog-title';
        title.className = 'prts-import-title';
        title.textContent = `导入到 ${getAccountLabel(targetAccountId)}`;
        const subtitle = document.createElement('p');
        subtitle.className = 'prts-import-subtitle';
        subtitle.textContent = '选择文件或粘贴 JSON/TXT 文本，预览变化并确认后替换此账号的数据。';
        headingWrap.appendChild(title);
        headingWrap.appendChild(subtitle);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'prts-import-close';
        closeBtn.setAttribute('aria-label', '关闭导入窗口');
        closeBtn.appendChild(createPrtsIcon('close'));
        closeBtn.onclick = closeOperatorImportDialog;

        head.appendChild(headingWrap);
        head.appendChild(closeBtn);

        const body = document.createElement('div');
        body.className = 'prts-import-body';

        const label = document.createElement('label');
        label.className = 'prts-import-label';
        label.htmlFor = 'prts-import-textarea';
        label.textContent = '粘贴干员数据';

        const textarea = document.createElement('textarea');
        textarea.id = 'prts-import-textarea';
        textarea.className = 'prts-import-textarea';
        textarea.spellcheck = false;
        textarea.placeholder = '例如：每行一个干员名称，或粘贴 MAA 导出的 JSON 内容';

        const help = document.createElement('p');
        help.id = 'prts-import-dialog-help';
        help.className = 'prts-import-help';
        help.textContent = 'TXT 支持每行一个干员名，空行、# 和 // 开头的行会被忽略。';

        const actions = document.createElement('div');
        actions.className = 'prts-import-actions';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.txt,application/json,text/plain';
        fileInput.hidden = true;

        const fileBtn = document.createElement('button');
        fileBtn.type = 'button';
        fileBtn.className = 'prts-import-action';
        fileBtn.textContent = '选择文件';
        fileBtn.onclick = () => fileInput.click();

        const pasteBtn = document.createElement('button');
        pasteBtn.type = 'button';
        pasteBtn.className = 'prts-import-action primary';
        pasteBtn.textContent = '导入粘贴内容';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'prts-import-action';
        cancelBtn.textContent = '关闭';
        cancelBtn.onclick = closeOperatorImportDialog;

        const status = document.createElement('div');
        status.className = 'prts-import-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.textContent = '请选择文件，或在文本框粘贴干员数据后导入。';

        const setBusy = busy => {
            fileBtn.disabled = busy;
            pasteBtn.disabled = busy;
        };

        fileInput.onchange = async event => {
            const file = event.target.files?.[0];
            if (!file) return;
            setBusy(true);
            await readOperatorImportFile(targetAccountId, file, status);
            setBusy(false);
            fileInput.value = '';
        };

        pasteBtn.onclick = async () => {
            const rawText = textarea.value;
            if (!rawText.trim()) {
                const message = '请先粘贴 JSON 或逐行干员名称。';
                setOperatorImportStatus(status, message, 'error');
                showPrtsToast('无法导入空内容', 'error', message);
                textarea.focus();
                return;
            }

            setBusy(true);
            try {
                const { names, training } = parseImportedOperators(rawText, '');
                await applyImportedOperatorNames(targetAccountId, names, '粘贴内容', status, training);
            } catch (error) {
                const message = getImportErrorMessage(error);
                console.error('[Better PRTS] 粘贴导入干员数据失败', error);
                setOperatorImportStatus(status, `导入失败：${message}`, 'error');
                showPrtsToast('导入失败', 'error', message);
            } finally {
                setBusy(false);
            }
        };

        actions.appendChild(fileBtn);
        actions.appendChild(pasteBtn);
        actions.appendChild(cancelBtn);

        body.appendChild(label);
        body.appendChild(textarea);
        body.appendChild(help);
        body.appendChild(actions);
        body.appendChild(fileInput);
        body.appendChild(status);

        dialog.appendChild(head);
        dialog.appendChild(body);
        backdrop.appendChild(dialog);

        backdrop.addEventListener('click', event => {
            if (event.target === backdrop) closeOperatorImportDialog();
        });

        const handleKeydown = event => {
            if (document.getElementById('prts-modal')) return;
            if (event.key === 'Escape') closeOperatorImportDialog();
            if (event.key === 'Tab') {
                const focusable = getFocusableDialogElements(dialog);
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', handleKeydown, true);
        operatorImportDialogCleanup = () => {
            document.removeEventListener('keydown', handleKeydown, true);
            backdrop.remove();
            if (previousFocus?.isConnected) previousFocus.focus();
        };

        document.body.appendChild(backdrop);
        textarea.focus();
    }

    function handleImport() {
        openOperatorImportDialog();
    }

    function handleOpenSklandImport() {
        let opened = null;
        try {
            opened = window.open(SKLAND_HOME_URL, '_blank');
            if (opened) opened.opener = null;
        } catch (error) {
            opened = null;
        }
        showPrtsToast(
            opened ? '已打开森空岛页面' : '已尝试打开森空岛页面',
            opened ? 'success' : 'warning',
            opened
                ? '请在森空岛网页登录后，使用页面右侧的 Better-PRTS-Plus 导入面板读取干员数据。'
                : '如果没有看到新窗口，请手动打开 https://www.skland.com/index 登录后使用 Better-PRTS-Plus 导入面板。'
        );
    }

    function toggleDisplayMode() {
        CONFIG.displayMode = (CONFIG.displayMode === 'GRAY') ? 'HIDE' : 'GRAY';
        saveConfig();
        const bar = document.getElementById('prts-filter-bar');
        if (bar) bar.remove();
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
                id: 'btn-filter-show-all', text: '切换置灰，查看作业', icon: 'eyeOn',
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
            if (stats.hiddenVideoCards) summaryText += `，视频已隐藏 ${stats.hiddenVideoCards} 份`;
            summaryText += '。';

            if (!stats.totalCards) {
                messageText = list ? '本作业集暂无作业。' : '当前页面暂无作业。若正在加载，请稍候；也可调整搜索条件或翻页。';
            } else if (stats.hiddenVideoCards === stats.totalCards) {
                messageText = `${scope}作业均为视频，已被隐藏。可在悬浮球中关闭“隐藏视频作业”${list ? '' : '，或查看其他页'}。`;
            } else if (filtering && !stats.availableCards && !stats.supportCards) {
                if (stats.pendingCards) {
                    messageText = `${scope}暂无已确认可用的作业，${stats.pendingCards} 份待核验作业已保留。请查看卡片提示或补充干员数据。`;
                } else {
                    showAll = CONFIG.displayMode === 'HIDE' && !stats.visibleCards;
                    messageText = showAll
                        ? `${scope}没有符合当前筛选条件的作业，已隐藏 ${stats.unavailableCards} 份。可切换置灰查看原因，或调整筛选条件、切换账号${list ? '' : '、查看其他页'}。`
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
        controlBar.appendChild(mainRow);

        let syncRow = document.getElementById('prts-filter-sync-row');
        if (!syncRow) {
            syncRow = document.createElement('div');
            syncRow.id = 'prts-filter-sync-row';
        }
        syncRow.className = 'prts-filter-sync-row';
        controlBar.appendChild(syncRow);

        const paths = {
            import: 'M11 6h3l-6 6-6-6h3V1h6v5zm-9 8v2h12v-2h-2v1H4v-1H2z',
            eyeOn: 'M8 3C3 3 0 8 0 8s3 5 8 5 8-5 8-5-3-5-8-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z M8 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
            eyeOff: 'M6.41 7.83c-.03.39.07.79.31 1.12.24.34.59.58.98.68.39.1.81.02 1.15-.21.34-.23.59-.57.7-.96.1-.39.02-.8-.21-1.15-.16-.23-.38-.42-.64-.53L6.41 7.83z M2.05 2.64L1.03 3.66l2.54 2.54C2.22 6.75 1.12 7.34 0 8c0 0 4 5.6 8 5.6 1.41 0 2.71-.35 3.85-.96l2.08 2.09 1.02-1.02L2.05 2.64z M8 12c-2.21 0-4-1.79-4-4 0-.2.02-.39.05-.58l5.04 5.04c-1.24.74-3.46.59-1.09-.46z M13.57 11.6c.54-1.06.83-2.24.83-3.6 0 0-4-5.6-8-5.6-.69 0-1.34.09-1.98.25L6.07 4.3C6.68 4.1 7.33 4 8 4c2.21 0 4 1.79 4 4 0 .64-.14 1.24-.38 1.79l1.95 1.81z',
            perfect: 'M13.76 3.84l-7.2 7.2L3.04 7.52 1.6 8.96l5.04 5.04 8.64-8.64z',
            support: 'M12 6.4c0-1.77-1.43-3.2-3.2-3.2S5.6 4.63 5.6 6.4s1.43 3.2 3.2 3.2 3.2-1.43 3.2-3.2zm-3.2 1.6c-.88 0-1.6-.72-1.6-1.6s.72-1.6 1.6-1.6 1.6.72 1.6 1.6-.72 1.6-1.6 1.6zm3.2-1.6c0-1.77-1.43-3.2-3.2-3.2-.45 0-.86.1-1.26.26.7.74 1.15 1.72 1.24 2.82.02.21.02.41 0 .62-.1 1.04-.51 1.98-1.16 2.71.37.13.75.19 1.18.19 1.77.01 3.2-1.42 3.2-3.4zM8.8 10.4H2.4c-.88 0-1.6.72-1.6 1.6v2.4h9.6V12c0-.88-.72-1.6-1.6-1.6zm-5.6 2.4h4.8v.8H3.2v-.8zm12-1.6h-4.8c.21 0 .4.03.59.07.67.15 1.29.44 1.81.85.91.71 1.5 1.81 1.57 3.04.01.1.01.18.03.28V12c0-.88-.72-1.6-1.6-1.6z',
            user: 'M8 8c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0 1c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
            sidebarToggle: 'M14 3H2c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zm-1 9H9V4h4v8zM3 4h4v8H3V4z',
            skland: 'skland'
        };

        // 顺序生成元素

        // (1) 账号循环切换按钮
        const btnAccountText = getAccountLabel(activeAccountId);
        const btnAccount = createPrtsButton({ id: 'btn-account', text: btnAccountText, icon: 'account', ariaLabel: `当前账号 ${btnAccountText}，点击切换账号`, onClick: cycleAccount });
        mainRow.appendChild(btnAccount);

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
            syncRow.appendChild(accountSyncChip);
        } else if (accountSyncChip) {
            accountSyncChip.remove();
        }

        // (2) 导入按钮
        const importText = ownedOpsSet.size > 0 ? `导入干员 (${ownedOpsSet.size})` : '导入干员';
        const btnImport = createPrtsButton({ id: 'btn-import', text: importText, icon: 'import', ariaLabel: importText, onClick: handleImport });
        mainRow.appendChild(btnImport);

        const btnSklandImport = createPrtsButton({ id: 'btn-skland-import', text: '森空岛导入', icon: 'skland', onClick: handleOpenSklandImport });
        mainRow.appendChild(btnSklandImport);

        // (3) 模式切换
        const displayModeText = CONFIG.displayMode === 'GRAY' ? '置灰模式' : '隐藏模式';
        const displayModeIcon = CONFIG.displayMode === 'GRAY' ? 'eyeOn' : 'eyeOff';
        const btnSetting = createPrtsButton({ id: 'btn-setting', text: displayModeText, icon: displayModeIcon, pressed: CONFIG.displayMode === 'HIDE', ariaLabel: `当前为${displayModeText}，点击切换显示模式`, onClick: toggleDisplayMode });
        mainRow.appendChild(btnSetting);

        // (4) 分割线
        let divider = document.getElementById('prts-divider-el');
        if (!divider) {
            divider = document.createElement('div');
            divider.className = 'prts-divider';
            divider.id = 'prts-divider-el';
        }
        mainRow.appendChild(divider);

        // (5) 完美阵容
        const btnPerfect = createPrtsButton({
            id: 'btn-perfect',
            text: '完美阵容',
            icon: 'check',
            onClick: () => toggleFilter('PERFECT'),
            active: CONFIG.filterMode === 'PERFECT',
            pressed: CONFIG.filterMode === 'PERFECT'
        });
        mainRow.appendChild(btnPerfect);

        // (6) 允许助战
        const btnSupport = createPrtsButton({
            id: 'btn-support',
            text: '允许助战',
            icon: 'support',
            onClick: () => toggleFilter('SUPPORT'),
            active: CONFIG.filterMode === 'SUPPORT',
            pressed: CONFIG.filterMode === 'SUPPORT'
        });
        mainRow.appendChild(btnSupport);
        const btnTraining = createPrtsButton({
            id: 'btn-training', text: '校验练度', icon: 'check',
            onClick: toggleTrainingCheck, active: CONFIG.trainingCheck, pressed: CONFIG.trainingCheck
        });
        btnTraining.title = '按作业标注的练度要求校验；数据不足时提示待核验';
        mainRow.appendChild(btnTraining);

        renderFilterResults();
        if (isNew) requestFilterUpdate();
    }
