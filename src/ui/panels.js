    // =========================================================================
    //                            MODULE 6: 侧边栏与悬浮球面板
    // =========================================================================

    function createDialogTag(text) {
        const tag = document.createElement('span');
        tag.classList.add('prts-dialog-tag');

        if (text.includes('升级') || text.includes('优化') || text.includes('更新')) {
            tag.classList.add('prts-tag-update');
            tag.textContent = '更新';
        } else if (text.includes('修复') || text.includes('问题') || text.includes('Bug')) {
            tag.classList.add('prts-tag-fix');
            tag.textContent = '维护';
        } else if (text.includes('活动') || text.includes('关卡')) {
            tag.classList.add('prts-tag-event');
            tag.textContent = '活动';
        } else {
            tag.classList.add('prts-tag-note');
            tag.textContent = '通知';
        }

        return tag;
    }

    function optimizeDialogContent() {
        const dialog = document.querySelector(BP_SELECTORS.dialog);
        if (!dialog || dialog.dataset.contentOptimized) return;

        const title = dialog.querySelector(BP_SELECTORS.heading);
        if (title && title.innerText.includes('公告')) {
            const contentBody = dialog.querySelector('.markdown-body');
            if (contentBody) {
                const headers = contentBody.querySelectorAll('h2');
                headers.forEach(h2 => {
                    if (!h2.querySelector('.prts-dialog-tag')) {
                        h2.insertBefore(createDialogTag(h2.textContent), h2.firstChild);
                    }
                });
            }
            dialog.dataset.contentOptimized = "true";
        }
    }

    function saveConfig() {
        GM_setValue('prts_cfg_visuals', CONFIG.visuals);
        GM_setValue('prts_cfg_link', CONFIG.cleanLink);
        GM_setValue('prts_cfg_hide_sidebar', CONFIG.hideSidebar);
        GM_setValue('prts_cfg_compat_debug', CONFIG.compatDebug);
    }

    function registerAccountsDataChangeListener() {
        if (typeof GM_addValueChangeListener !== 'function') return;
        GM_addValueChangeListener(ACCOUNTS_DATA_KEY, (_name, oldValue, newValue, remote) => {
            if (!remote || oldValue === newValue) return;
            refreshOwnedOpsFromStorage();
        });
    }

    function refreshOwnedOpsFromStorage() {
        loadOwnedOps();
        const bar = document.getElementById('prts-filter-bar');
        if (bar) bar.remove();
        injectFilterControls();
        refreshAccountControls();
        if (currentFilterMode !== 'NONE') requestFilterUpdate();
    }

    function initSklandImportPage() {
        loadOwnedOps();
        if (document.body) {
            createSklandImportPanel();
            return;
        }
        window.addEventListener('DOMContentLoaded', createSklandImportPanel, { once: true });
    }

    function createSklandImportPanel() {
        if (document.getElementById('prts-skland-import-panel')) return;

        let targetAccountId = normalizeAccountId(activeAccountId);
        const panel = document.createElement('section');
        panel.id = 'prts-skland-import-panel';

        const head = document.createElement('div');
        head.className = 'prts-skland-head';

        const headingWrap = document.createElement('div');
        const title = document.createElement('h2');
        title.className = 'prts-skland-title';
        title.textContent = 'Better-PRTS-Plus';
        const subtitle = document.createElement('p');
        subtitle.className = 'prts-skland-subtitle';
        subtitle.textContent = '从当前森空岛登录态读取明日方舟干员。';
        headingWrap.appendChild(title);
        headingWrap.appendChild(subtitle);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'prts-skland-close';
        closeBtn.title = '关闭';
        closeBtn.setAttribute('aria-label', '关闭森空岛导入面板');
        closeBtn.appendChild(createPrtsIcon('close'));
        closeBtn.onclick = () => panel.remove();

        head.appendChild(headingWrap);
        head.appendChild(closeBtn);
        panel.appendChild(head);

        const body = document.createElement('div');
        body.className = 'prts-skland-body';
        const defaultStatusText = '请先确认当前页面已经登录森空岛。导入只会保存干员名称，不会保存森空岛凭据。';

        const accountLabel = document.createElement('span');
        accountLabel.className = 'prts-skland-label';
        accountLabel.textContent = '导入到账号档位';
        body.appendChild(accountLabel);

        const accountRow = document.createElement('div');
        accountRow.className = 'prts-skland-accounts';
        const accountButtons = [];
        ACCOUNT_IDS.forEach(id => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'prts-skland-account';
            btn.textContent = getAccountLabel(id);
            btn.onclick = () => {
                targetAccountId = id;
                renderSklandAccountButtons(accountButtons, targetAccountId);
                renderSklandSelectedAccountStatus(status, targetAccountId, defaultStatusText);
            };
            accountButtons.push(btn);
            accountRow.appendChild(btn);
        });
        body.appendChild(accountRow);

        const importBtn = document.createElement('button');
        importBtn.type = 'button';
        importBtn.className = 'prts-skland-primary';
        importBtn.textContent = '读取并导入干员';
        body.appendChild(importBtn);

        const status = document.createElement('div');
        status.className = 'prts-skland-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.textContent = defaultStatusText;
        body.appendChild(status);

        const link = document.createElement('a');
        link.className = 'prts-skland-link';
        link.href = 'https://prts.plus/';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = '打开 PRTS Plus';
        body.appendChild(link);

        importBtn.onclick = async () => {
            importBtn.disabled = true;
            importBtn.textContent = '读取中...';
            setSklandPanelStatus(status, `正在读取森空岛数据，并导入到 ${getAccountLabel(targetAccountId)}。`, 'loading');
            try {
                const summary = await importSklandOperatorsToAccount(targetAccountId, {
                    selectBinding: (bindings, defaultBinding) => showSklandBindingPicker(bindings, defaultBinding?.uid, targetAccountId)
                });
                targetAccountId = summary.accountId;
                renderSklandAccountButtons(accountButtons, targetAccountId);
                setSklandPanelStatus(status, formatSklandImportSummary(summary), 'success');
            } catch (error) {
                if (isSklandImportCancelledError(error)) {
                    setSklandPanelStatus(status, '已取消角色选择，未修改账号数据。', '');
                    return;
                }
                console.error('[Better PRTS] 森空岛导入失败', error instanceof Error ? error.message : error);
                setSklandPanelStatus(status, error instanceof Error ? error.message : '森空岛导入失败，请稍后重试。', 'error');
            } finally {
                importBtn.disabled = false;
                importBtn.textContent = '读取并导入干员';
            }
        };

        renderSklandAccountButtons(accountButtons, targetAccountId);
        renderSklandSelectedAccountStatus(status, targetAccountId, defaultStatusText);

        panel.appendChild(body);
        document.body.appendChild(panel);
    }

    async function showSklandBindingPicker(bindings, preferredUid, accountId) {
        const availableBindings = normalizeSklandArknightsBindings(bindings);
        if (availableBindings.length === 0) return null;

        const accountLabel = getAccountLabel(accountId);
        const lastUid = normalizeSklandSyncText(getAccountSklandSyncMeta(accountId)?.uid);
        let selectedBinding = selectSklandBindingOption(availableBindings, preferredUid) || availableBindings[0];

        const content = document.createElement('div');
        content.className = 'prts-skland-binding-picker';

        const intro = document.createElement('p');
        intro.className = 'prts-skland-binding-intro';
        intro.textContent = `检测到多个明日方舟角色，请选择要导入到 ${accountLabel} 的角色。`;
        content.appendChild(intro);

        const list = document.createElement('div');
        list.className = 'prts-skland-binding-list';
        list.setAttribute('role', 'radiogroup');
        list.setAttribute('aria-label', '森空岛明日方舟角色');
        content.appendChild(list);

        const options = [];
        const selectByIndex = (index, focus = false) => {
            const next = options[index];
            if (!next) return;
            selectedBinding = next.binding;
            options.forEach(option => {
                const selected = option.binding.uid === selectedBinding.uid;
                option.root.classList.toggle('is-selected', selected);
                option.input.checked = selected;
            });
            if (focus) next.input.focus();
        };

        availableBindings.forEach((binding, index) => {
            const option = document.createElement('label');
            option.className = 'prts-skland-binding-option';

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'prts-skland-binding';
            input.className = 'prts-skland-binding-radio';
            input.value = binding.uid;
            input.checked = binding.uid === selectedBinding.uid;
            input.onchange = () => selectByIndex(index);
            input.onkeydown = event => {
                if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) return;
                event.preventDefault();
                const delta = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
                const nextIndex = (index + delta + availableBindings.length) % availableBindings.length;
                selectByIndex(nextIndex, true);
            };

            const textWrap = document.createElement('span');
            textWrap.className = 'prts-skland-binding-text';

            const nameRow = document.createElement('span');
            nameRow.className = 'prts-skland-binding-name-row';

            const name = document.createElement('span');
            name.className = 'prts-skland-binding-name';
            name.textContent = binding.nickname || '博士';
            nameRow.appendChild(name);

            if (lastUid && binding.uid === lastUid) {
                const badge = document.createElement('span');
                badge.className = 'prts-skland-binding-badge';
                badge.textContent = '上次导入';
                nameRow.appendChild(badge);
            } else if (binding.isDefault) {
                const badge = document.createElement('span');
                badge.className = 'prts-skland-binding-badge';
                badge.textContent = '森空岛默认';
                nameRow.appendChild(badge);
            }

            const meta = document.createElement('span');
            meta.className = 'prts-skland-binding-meta';
            meta.textContent = `UID ${binding.uid} / ${binding.channelName || '官方'}`;

            textWrap.appendChild(nameRow);
            textWrap.appendChild(meta);
            option.appendChild(input);
            option.appendChild(textWrap);
            option.classList.toggle('is-selected', input.checked);
            list.appendChild(option);
            options.push({ root: option, input, binding });
        });

        const resultPromise = showPrtsModal({
            title: '选择森空岛角色',
            message: content,
            confirmText: '导入所选角色',
            cancelText: '取消'
        });

        window.setTimeout(() => {
            const selectedOption = options.find(option => option.binding.uid === selectedBinding.uid);
            selectedOption?.input.focus();
        }, 20);

        const confirmed = await resultPromise;
        return confirmed === true ? selectedBinding : null;
    }

    function renderSklandSelectedAccountStatus(status, accountId, fallbackText) {
        const summary = getAccountSklandImportSummary(accountId);
        if (summary) {
            setSklandPanelStatus(status, `该账号上次同步：
${formatSklandImportSummary(summary)}`, 'success');
            return;
        }
        setSklandPanelStatus(status, fallbackText, '');
    }

    function renderSklandAccountButtons(buttons, activeId) {
        buttons.forEach((btn, index) => {
            const id = ACCOUNT_IDS[index];
            btn.textContent = getAccountLabel(id);
            btn.title = formatAccountSklandTitle(id);
            btn.classList.toggle('active', id === activeId);
        });
    }

    function setSklandPanelStatus(status, text, type) {
        status.className = 'prts-skland-status';
        if (type) status.classList.add(type);
        status.setAttribute('role', type === 'error' ? 'alert' : 'status');
        status.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        status.textContent = text;
    }

    function readSklandLastImportSummary() {
        const parsed = safeJsonParse(GM_getValue(SKLAND_LAST_IMPORT_KEY) || '', null);
        return normalizeSklandImportSummary(parsed);
    }

    function formatSklandImportSummary(summary) {
        const normalized = normalizeSklandImportSummary(summary);
        if (!normalized) return '';

        const timeText = formatSklandSyncTime(normalized.importedAt);
        const accountLabel = normalized.accountLabel || getAccountLabel(normalized.accountId);
        const lines = [
            `${accountLabel} 已导入 ${normalized.operatorCount} 名干员。`,
            `${normalized.nickname || '博士'} / UID ${normalized.uid || '未知'}`
        ];
        if (timeText) lines.push(timeText);
        return lines.join('\n');
    }

    function createFloatingBall() {
        if (document.getElementById('prts-float-container')) return;

        const savedPos = parseFloatingPosition(GM_getValue('prts_float_pos', '{"top":"40%","isRight":true}'));
        const container = document.createElement('div');
        container.id = 'prts-float-container';

        container.style.top = savedPos.top;
        if (savedPos.isRight) {
            container.style.left = 'auto';
            container.style.right = '0px';
            container.classList.add('snap-right');
        } else {
            container.style.left = '0px';
            container.style.right = 'auto';
            container.classList.add('snap-left');
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'prts-float-btn';
        btn.title = "脚本设置 (可拖拽)";
        btn.setAttribute('aria-label', '打开脚本设置面板，可拖拽');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'prts-settings-panel');
        btn.style.touchAction = 'none';
        const floatSvg = document.createElementNS(SVG_NS, 'svg');
        floatSvg.setAttribute('viewBox', '0 0 32 32');
        floatSvg.setAttribute('aria-hidden', 'true');
        floatSvg.setAttribute('focusable', 'false');
        const floatPath = document.createElementNS(SVG_NS, 'path');
        floatPath.setAttribute('d', 'M27,7.35l-9-5.2a4,4,0,0,0-4,0L5,7.35a4,4,0,0,0-2,3.46V21.19a4,4,0,0,0,2,3.46l9,5.2a4,4,0,0,0,4,0l9-5.2a4,4,0,0,0,2-3.46V10.81A4,4,0,0,0,27,7.35Zm-11.74-3a1.51,1.51,0,0,1,1.5,0l8.49,4.9L16,14.56,6.76,9.22Zm-9,18.17a1.51,1.51,0,0,1-.75-1.3v-9.8l9.24,5.33V27.39Zm19.48,0-8.49,4.9V16.72l9.24-5.33v9.8A1.51,1.51,0,0,1,25.74,22.49Z');
        floatSvg.appendChild(floatPath);
        btn.appendChild(floatSvg);

        const panel = document.createElement('div');
        panel.id = 'prts-settings-panel';
        panel.className = 'prts-settings-panel';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', 'Better-PRTS-Plus 设置');

        const createSwitch = (label, checked, onChange, configKey, icon) => createPrtsSwitch({ label, checked, onChange, configKey, icon });

        const title = document.createElement('div');
        title.className = 'prts-panel-title';
        title.tabIndex = 0;
        title.setAttribute('role', 'button');
        title.setAttribute('aria-label', '功能开关');
        const titleText = document.createElement('span');
        titleText.textContent = '功能开关';
        titleText.style.marginRight = 'auto';
        const titleHint = document.createElement('span');
        titleHint.textContent = '刷新生效';
        titleHint.style.fontSize = '12px';
        titleHint.style.opacity = '0.6';
        title.appendChild(titleText);
        title.appendChild(titleHint);
        panel.appendChild(title);

        let debugOptionsRevealed = CONFIG.compatDebug === true;
        const debugOptions = document.createElement('div');
        debugOptions.className = 'prts-debug-options';
        if (debugOptionsRevealed) debugOptions.classList.add('is-visible');

        const revealDebugOptions = event => {
            if (!event.shiftKey) return;
            event.preventDefault();
            event.stopPropagation();
            debugOptionsRevealed = !debugOptionsRevealed;
            debugOptions.classList.toggle('is-visible', debugOptionsRevealed);
        };

        title.addEventListener('click', revealDebugOptions);
        title.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                revealDebugOptions(event);
            }
        });

        panel.appendChild(createSwitch('作业卡片美化', CONFIG.visuals, (val) => {
            CONFIG.visuals = val; saveConfig(); if(val) requestFilterUpdate(); else location.reload();
        }, 'visuals', 'operators'));
        panel.appendChild(createSwitch('视频链接优化', CONFIG.cleanLink, (val) => {
            CONFIG.cleanLink = val; saveConfig(); if(val) requestFilterUpdate();
        }, 'cleanLink', 'link'));

        panel.appendChild(createSwitch('折叠侧边栏', CONFIG.hideSidebar, (val) => {
            CONFIG.hideSidebar = val; saveConfig(); applySidebarCollapse();
        }, 'hideSidebar', 'layout'));

        debugOptions.appendChild(createSwitch('兼容诊断', CONFIG.compatDebug, (val) => {
            CONFIG.compatDebug = val;
            saveConfig();
            if (val) {
                renderCompatibilityDiagnosticsPanel();
                requestFilterUpdate();
            } else {
                removeCompatibilityDiagnosticsPanel();
            }
        }, 'compatDebug', 'filter'));
        panel.appendChild(debugOptions);

        //[V12.0/V3.1.0 优美的多账号悬浮面板]
        const accRow = document.createElement('div');
        accRow.className = 'prts-panel-item';
        accRow.style.marginTop = '8px';
        accRow.style.marginBottom = '8px';
        accRow.style.flexDirection = 'column';
        accRow.style.alignItems = 'stretch';

        const accTitle = document.createElement('span');
        accTitle.className = 'prts-panel-item-label';
        accTitle.appendChild(createPrtsIcon('account'));
        const accTitleText = document.createElement('span');
        accTitleText.textContent = '切换账号';
        accTitle.appendChild(accTitleText);
        accRow.appendChild(accTitle);

        const accBtnGroup = document.createElement('div');
        accBtnGroup.className = 'prts-account-list';

        for (let i = 1; i <= 3; i++) {
            const row = document.createElement('div');
            row.className = 'prts-account-row';

            const accountCell = document.createElement('div');
            accountCell.className = 'prts-account-cell';

            const accBtn = document.createElement('button');
            accBtn.type = 'button';
            accBtn.className = 'prts-btn prts-acc-btn';
            accBtn.dataset.id = i;
            accBtn.onclick = (e) => {
                e.stopPropagation();
                switchAccount(i);
            };

            const syncMeta = document.createElement('span');
            syncMeta.className = 'prts-account-sync-meta';

            const renameBtn = document.createElement('button');
            renameBtn.type = 'button';
            renameBtn.className = 'prts-account-rename';
            renameBtn.dataset.id = i;
            renameBtn.textContent = '改名';
            renameBtn.onclick = (e) => {
                e.stopPropagation();
                renameAccount(i);
            };

            accountCell.appendChild(accBtn);
            accountCell.appendChild(syncMeta);
            row.appendChild(accountCell);
            row.appendChild(renameBtn);
            accBtnGroup.appendChild(row);
        }
        accRow.appendChild(accBtnGroup);
        panel.appendChild(accRow);

        const importBtn = createPrtsButton({ className: 'prts-btn', icon: 'import', text: '导入干员数据', onClick: handleImport });
        importBtn.style.width = '100%'; importBtn.style.marginTop = '4px';
        panel.appendChild(importBtn);

        const sklandBtn = createPrtsButton({ className: 'prts-btn', icon: 'skland', text: '森空岛导入', onClick: handleOpenSklandImport });
        sklandBtn.style.width = '100%'; sklandBtn.style.marginTop = '8px';
        panel.appendChild(sklandBtn);

        const backupActions = document.createElement('div');
        backupActions.className = 'prts-panel-actions';

        const exportBtn = createPrtsButton({ className: 'prts-btn', icon: 'download', text: '导出全部配置', onClick: handleExportAccountsBackup });

        const importBackupBtn = createPrtsButton({ className: 'prts-btn', icon: 'upload', text: '导入全部配置', onClick: handleImportAccountsBackup });

        backupActions.appendChild(exportBtn);
        backupActions.appendChild(importBackupBtn);
        panel.appendChild(backupActions);

        container.appendChild(panel);
        container.appendChild(btn);
        document.body.appendChild(container);
        refreshAccountControls();

        let isDragging = false;
        let hasMoved = false;
        let startX, startY, initialLeft, initialTop, initialSnapRight, activePointerId;

        btn.addEventListener('pointerdown', (e) => {
            activePointerId = e.pointerId;
            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            const rect = container.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            initialSnapRight = container.style.right === '0px' || (container.classList.contains('snap-right') && !container.classList.contains('snap-left'));

            container.classList.remove('is-snapping');
            container.classList.add('is-dragging');
            container.style.left = initialLeft + 'px';
            container.style.top = initialTop + 'px';
            container.style.right = 'auto';
            container.style.transform = 'none';
            btn.setPointerCapture?.(e.pointerId);
            e.preventDefault();
        });

        document.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            if (activePointerId !== undefined && e.pointerId !== activePointerId) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            const winWidth = window.innerWidth;
            const winHeight = window.innerHeight;
            const elWidth = container.offsetWidth;
            const elHeight = container.offsetHeight;

            if (newLeft < 0) newLeft = 0;
            if (newLeft > winWidth - elWidth) newLeft = winWidth - elWidth;
            if (newTop < 0) newTop = 0;
            if (newTop > winHeight - elHeight) newTop = winHeight - elHeight;

            container.style.left = newLeft + 'px';
            container.style.top = newTop + 'px';
        });

        const finishDrag = (e) => {
            if (!isDragging) return;
            if (activePointerId !== undefined && e.pointerId !== activePointerId) return;
            isDragging = false;
            btn.releasePointerCapture?.(activePointerId);
            activePointerId = undefined;
            container.classList.remove('is-dragging');
            container.style.transform = '';

            if (hasMoved) {
                const winWidth = window.innerWidth;
                const rect = container.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;

                container.classList.add('is-snapping');
                let isRight = true;
                if (centerX < winWidth / 2) {
                    container.style.left = '0px';
                    container.style.right = 'auto';
                    container.classList.remove('snap-right');
                    container.classList.add('snap-left');
                    isRight = false;
                } else {
                    container.style.left = 'auto';
                    container.style.right = '0px';
                    container.classList.remove('snap-left');
                    container.classList.add('snap-right');
                    isRight = true;
                }
                const topPercent = (rect.top / window.innerHeight * 100).toFixed(1) + '%';
                container.style.top = topPercent;

                GM_setValue('prts_float_pos', JSON.stringify({ top: topPercent, isRight: isRight }));
            } else {
                if (initialSnapRight) {
                    container.style.left = 'auto';
                    container.style.right = '0px';
                    container.classList.remove('snap-left');
                    container.classList.add('snap-right');
                } else {
                    container.style.left = '0px';
                    container.style.right = 'auto';
                    container.classList.remove('snap-right');
                    container.classList.add('snap-left');
                }
            }
        };

        document.addEventListener('pointerup', finishDrag);
        document.addEventListener('pointercancel', finishDrag);

        const setFloatOpen = isOpen => {
            container.classList.toggle('prts-float-open', isOpen);
            btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        };

        btn.onclick = (e) => {
            e.stopPropagation();
            if (!hasMoved) setFloatOpen(!container.classList.contains('prts-float-open'));
        };
        panel.onclick = (e) => e.stopPropagation();
        document.addEventListener('click', () => {
            if (!isDragging) setFloatOpen(false);
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') setFloatOpen(false);
        });
    }
