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

    function getOperatorImportDiff(previousNames, nextNames) {
        const previousSet = new Set(sanitizeOperatorNames(previousNames));
        const nextSet = new Set(sanitizeOperatorNames(nextNames));
        let added = 0;
        let removed = 0;

        nextSet.forEach(name => {
            if (!previousSet.has(name)) added += 1;
        });
        previousSet.forEach(name => {
            if (!nextSet.has(name)) removed += 1;
        });

        return { added, removed, total: nextSet.size };
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

    function applyImportedOperatorNames(names, sourceLabel, statusEl) {
        const sanitizedNames = sanitizeOperatorNames(names);
        if (sanitizedNames.length === 0) {
            const message = '未能识别有效的干员数据，请检查 JSON/TXT 内容。';
            setOperatorImportStatus(statusEl, message, 'warning');
            showPrtsToast('未能识别有效的干员数据', 'warning', '请检查文件或粘贴内容后重试。');
            return false;
        }

        const accountLabel = getAccountLabel(activeAccountId);
        const diff = getOperatorImportDiff(accountsData[activeAccountId] || [], sanitizedNames);
        const diffText = formatOperatorImportDiff(diff);
        const sourceText = sourceLabel ? `来源：${sourceLabel}` : '来源：导入内容';

        const nextState = getCurrentAccountState();
        nextState.accountsData[nextState.activeAccountId] = sanitizedNames;
        commitAccountState(nextState);
        refreshAccountStateUi();

        const message = `${accountLabel} 导入成功`;
        const detail = `${diffText}\n${sourceText}`;
        setOperatorImportStatus(statusEl, `${message}\n${detail}`, 'success');
        showPrtsToast(message, 'success', detail);
        return true;
    }

    function readOperatorImportFile(file, statusEl) {
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
            reader.onload = event => {
                try {
                    const names = parseImportedOperatorNames(event.target.result, file.name);
                    resolve(applyImportedOperatorNames(names, file.name || '文件导入', statusEl));
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
        title.textContent = `导入到 ${getAccountLabel(activeAccountId)}`;
        const subtitle = document.createElement('p');
        subtitle.className = 'prts-import-subtitle';
        subtitle.textContent = '选择文件或粘贴 JSON/TXT 文本，导入后会替换当前账号的干员列表。';
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
        cancelBtn.textContent = '取消';
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
            const imported = await readOperatorImportFile(file, status);
            setBusy(false);
            fileInput.value = '';
            if (imported) window.setTimeout(closeOperatorImportDialog, 700);
        };

        pasteBtn.onclick = () => {
            const rawText = textarea.value;
            if (!rawText.trim()) {
                const message = '请先粘贴 JSON 或逐行干员名称。';
                setOperatorImportStatus(status, message, 'error');
                showPrtsToast('无法导入空内容', 'error', message);
                textarea.focus();
                return;
            }

            try {
                const names = parseImportedOperatorNames(rawText, '');
                const imported = applyImportedOperatorNames(names, '粘贴内容', status);
                if (imported) window.setTimeout(closeOperatorImportDialog, 700);
            } catch (error) {
                const message = getImportErrorMessage(error);
                console.error('[Better PRTS] 粘贴导入干员数据失败', error);
                setOperatorImportStatus(status, `导入失败：${message}`, 'error');
                showPrtsToast('导入失败', 'error', message);
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
        displayMode = (displayMode === 'GRAY') ? 'HIDE' : 'GRAY';
        GM_setValue(DISPLAY_MODE_KEY, displayMode);
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
        currentFilterMode = (currentFilterMode === mode) ? 'NONE' : mode;
        currentFilterMode = normalizeFilterMode(currentFilterMode);
        GM_setValue(FILTER_MODE_KEY, currentFilterMode);
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
        if (!perfectBtn || !supportBtn) return;

        perfectBtn.classList.remove('prts-active');
        supportBtn.classList.remove('prts-active');
        perfectBtn.setAttribute('aria-pressed', currentFilterMode === 'PERFECT' ? 'true' : 'false');
        supportBtn.setAttribute('aria-pressed', currentFilterMode === 'SUPPORT' ? 'true' : 'false');

        if (currentFilterMode === 'PERFECT') perfectBtn.classList.add('prts-active');
        else if (currentFilterMode === 'SUPPORT') supportBtn.classList.add('prts-active');
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
        const displayModeText = displayMode === 'GRAY' ? '置灰模式' : '隐藏模式';
        const displayModeIcon = displayMode === 'GRAY' ? 'eyeOn' : 'eyeOff';
        const btnSetting = createPrtsButton({ id: 'btn-setting', text: displayModeText, icon: displayModeIcon, pressed: displayMode === 'HIDE', ariaLabel: `当前为${displayModeText}，点击切换显示模式`, onClick: toggleDisplayMode });
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
            active: currentFilterMode === 'PERFECT',
            pressed: currentFilterMode === 'PERFECT'
        });
        mainRow.appendChild(btnPerfect);

        // (6) 允许助战
        const btnSupport = createPrtsButton({
            id: 'btn-support',
            text: '允许助战',
            icon: 'support',
            onClick: () => toggleFilter('SUPPORT'),
            active: currentFilterMode === 'SUPPORT',
            pressed: currentFilterMode === 'SUPPORT'
        });
        mainRow.appendChild(btnSupport);

        if (isNew && currentFilterMode !== 'NONE') {
            requestFilterUpdate();
        }
    }
