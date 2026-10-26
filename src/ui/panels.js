    function updateSettingsReloadNotice() {
        const notice = document.getElementById('prts-settings-reload');
        if (notice) notice.hidden = !needsSettingsReload();
    }

    function updateFloatingLayout() {
        const container = document.getElementById('prts-float-container');
        if (!container || container.classList.contains('is-dragging')) return;
        const panel = document.getElementById('prts-settings-panel');
        const viewport = window.visualViewport;
        const left = viewport?.offsetLeft || 0;
        const top = viewport?.offsetTop || 0;
        const width = viewport?.width || window.innerWidth;
        const height = viewport?.height || window.innerHeight;
        const savedPos = CONFIG.floatingPosition;
        const ballTop = Math.max(top, Math.min(
            parseFloat(savedPos.top) / 100 * window.innerHeight, top + height - container.offsetHeight
        ));

        container.style.top = `${ballTop}px`;
        container.style.left = savedPos.isRight ? 'auto' : `${left}px`;
        container.style.right = savedPos.isRight ? `${window.innerWidth - left - width}px` : 'auto';
        container.classList.toggle('snap-right', savedPos.isRight);
        container.classList.toggle('snap-left', !savedPos.isRight);
        panel.classList.toggle('prts-settings-compact', height < 240);
        panel.style.setProperty('--prts-panel-width', `${Math.max(0, width - 24)}px`);
        panel.style.setProperty('--prts-panel-max-height', `${Math.max(0, height - 24)}px`);
        // 以悬浮球为锚点，空间不足时贴合可见视口；面板不参与拖拽区域的尺寸计算。
        const ballLeft = left + (savedPos.isRight ? width - container.offsetWidth : 0);
        const preferredLeft = savedPos.isRight ? ballLeft - 7 - panel.offsetWidth : ballLeft + container.offsetWidth + 7;
        const panelLeft = Math.max(left + 12, Math.min(preferredLeft, left + width - panel.offsetWidth - 12));
        const panelTop = Math.max(top + 12, Math.min(ballTop, top + height - panel.offsetHeight - 12));
        panel.style.left = `${panelLeft - ballLeft}px`;
        panel.style.right = 'auto';
        panel.style.top = `${panelTop - ballTop}px`;

        container.classList.toggle('prts-submenu-left', savedPos.isRight);
        container.querySelectorAll('.prts-submenu-panel').forEach(submenu => {
            const roomLeft = panelLeft - left - 12;
            const roomRight = left + width - 12 - panelLeft - panel.offsetWidth;
            let opensLeft = savedPos.isRight;
            submenu.style.setProperty('--prts-submenu-width', `${Math.max(0, width - 48)}px`);
            submenu.style.maxHeight = `${Math.max(0, height - 24)}px`;
            const fitsLeft = roomLeft >= submenu.offsetWidth + 8;
            const fitsRight = roomRight >= submenu.offsetWidth + 8;
            if (opensLeft ? !fitsLeft && fitsRight : !fitsRight && fitsLeft) opensLeft = !opensLeft;
            let submenuLeft;
            if (fitsLeft || fitsRight) {
                submenuLeft = opensLeft ? panelLeft - submenu.offsetWidth - 8 : panelLeft + panel.offsetWidth + 8;
            } else {
                // 窄屏保留上一级的 24px 边缘，仍按同一方向逐层展开。
                submenu.style.setProperty('--prts-submenu-width', `${Math.max(0, panel.offsetWidth - 24)}px`);
                submenuLeft = opensLeft ? panelLeft + panel.offsetWidth - submenu.offsetWidth - 24 : panelLeft + 24;
            }
            const entryTop = document.getElementById(submenu.dataset.triggerId).getBoundingClientRect().top;
            const submenuTop = Math.max(top + 12, Math.min(entryTop, top + height - submenu.offsetHeight - 12));
            submenu.style.left = `${submenuLeft - ballLeft}px`;
            submenu.style.top = `${submenuTop - ballTop}px`;
            container.classList.toggle('prts-submenu-left', opensLeft);
        });
    }

    function renderAccountList(list) {
        const ids = getAccountIds();
        const signature = ids.join(',');
        if (list.dataset.accounts === signature) return;
        list.replaceChildren(...ids.map(id => {
            const row = document.createElement('div');
            row.className = 'prts-account-row';
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'prts-acc-btn';
            button.dataset.id = id;
            button.onclick = () => switchAccount(id);
            const heading = document.createElement('span');
            heading.className = 'prts-account-heading';
            const name = document.createElement('span');
            name.className = 'prts-account-name';
            heading.appendChild(name);
            heading.appendChild(createPrtsIcon('selected'));
            button.appendChild(heading);
            const count = document.createElement('span');
            count.className = 'prts-account-count';
            button.appendChild(count);
            const syncMeta = document.createElement('span');
            syncMeta.className = 'prts-account-sync-meta';
            button.appendChild(syncMeta);
            row.appendChild(button);
            const rename = createPrtsButton({ className: 'prts-account-rename', text: '改名', onClick: () => renameAccount(id) });
            row.appendChild(rename);
            const remove = createPrtsButton({
                className: 'prts-account-rename prts-account-delete', text: '删除',
                disabled: ids.length <= 1, onClick: () => removeAccount(id)
            });
            row.appendChild(remove);
            return row;
        }));
        list.dataset.accounts = signature;
    }

    function createFloatingBall() {
        if (document.getElementById('prts-float-container')) return;

        const container = document.createElement('div');
        container.id = 'prts-float-container';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'prts-float-btn';
        btn.title = "脚本设置（可拖拽）";
        btn.setAttribute('aria-label', '打开脚本设置面板，可拖拽');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'prts-settings-panel');
        btn.style.touchAction = 'none';
        btn.appendChild(createPrtsIcon('settings'));

        const panel = document.createElement('div');
        panel.id = 'prts-settings-panel';
        panel.className = 'prts-settings-panel';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', 'Better-PRTS-Plus 设置');

        const title = document.createElement('div');
        title.className = 'prts-panel-title';
        const titleText = document.createElement('button');
        titleText.type = 'button';
        titleText.className = 'prts-settings-heading';
        titleText.textContent = '设置';
        title.appendChild(titleText);
        title.appendChild(createPrtsButton({
            className: 'prts-btn prts-settings-close', icon: 'close', ariaLabel: '关闭脚本设置面板',
            onClick: () => {
                setFloatOpen(false);
                btn.focus({ preventScroll: true });
            }
        }));
        panel.appendChild(title);

        const content = document.createElement('div');
        content.id = 'prts-settings-main';
        content.className = 'prts-settings-content';
        panel.appendChild(content);

        const submenus = [];
        let activeSubmenu = null;
        const setSubmenuOpen = (next, restoreFocus = true) => {
            const previous = activeSubmenu;
            if (previous) {
                previous.panel.classList.remove('is-open');
                previous.panel.inert = true;
                previous.panel.setAttribute('aria-hidden', 'true');
                previous.button.setAttribute('aria-expanded', 'false');
            }
            activeSubmenu = next;
            if (next) {
                next.panel.inert = false;
                next.panel.setAttribute('aria-hidden', 'false');
                next.button.setAttribute('aria-expanded', 'true');
                updateFloatingLayout();
                next.panel.classList.add('is-open');
                next.close.focus({ preventScroll: true });
            } else if (restoreFocus && previous) previous.button.focus({ preventScroll: true });
        };
        const createSubmenu = (id, label, icon) => {
            const submenuPanel = document.createElement('div');
            submenuPanel.id = `prts-${id}-panel`;
            submenuPanel.className = 'prts-submenu-panel';
            submenuPanel.inert = true;
            submenuPanel.setAttribute('aria-hidden', 'true');
            submenuPanel.setAttribute('role', 'region');
            submenuPanel.setAttribute('aria-labelledby', `prts-${id}-title`);
            const head = document.createElement('div');
            head.className = 'prts-modal-head';
            const heading = document.createElement('h2');
            heading.id = `prts-${id}-title`;
            heading.className = 'prts-modal-title';
            heading.textContent = label;
            head.appendChild(heading);
            const close = createPrtsButton({
                className: 'prts-btn prts-submenu-close', icon: 'collapsePanel', ariaLabel: `收起${label}`,
                onClick: () => setSubmenuOpen(null)
            });
            head.appendChild(close);
            submenuPanel.appendChild(head);
            const body = document.createElement('div');
            body.className = 'prts-submenu-content';
            submenuPanel.appendChild(body);
            const button = createPrtsButton({
                id: `prts-settings-${id}-button`, className: 'prts-btn prts-submenu-button',
                icon, text: label, ariaControls: submenuPanel.id, expanded: false,
                onClick: () => setSubmenuOpen(activeSubmenu === submenu ? null : submenu)
            });
            const arrow = createPrtsIcon('expandSubmenu');
            arrow.classList.add('prts-submenu-arrow');
            button.appendChild(arrow);
            content.appendChild(button);
            submenuPanel.dataset.triggerId = button.id;
            submenuPanel.onclick = event => event.stopPropagation();
            const submenu = { panel: submenuPanel, body, button, close };
            submenus.push(submenu);
            return submenu;
        };
        const cards = createSubmenu('cards', '作业卡片', 'cards');
        const pageEnhancements = createSubmenu('page', '页面增强', 'pageEnhancements');
        const accounts = createSubmenu('accounts', '账号与数据', 'accounts');
        const about = createSubmenu('about', '关于', 'about');
        const diagnostics = createSubmenu('diagnostics', '诊断', 'compatDebug');
        const aboutContent = about.body;
        const aboutName = document.createElement('h3');
        aboutName.className = 'prts-about-name';
        aboutName.textContent = 'Better-PRTS-Plus';
        const aboutVersion = document.createElement('p');
        aboutVersion.className = 'prts-about-version';
        aboutVersion.textContent = `当前版本 ${GM_info.script.version}`;
        const aboutDescription = document.createElement('p');
        aboutDescription.className = 'prts-about-description';
        aboutDescription.textContent = '按持有干员和练度筛选 PRTS Plus 作业，支持多账号管理和页面显示调整。';
        const aboutCredits = document.createElement('p');
        aboutCredits.className = 'prts-about-credits';
        aboutCredits.textContent = '作者：一只摆烂的42（ntgmc）\n开源协议：GPL-3.0\n感谢 PRTS Plus 提供作业平台。';
        aboutContent.appendChild(aboutName);
        aboutContent.appendChild(aboutVersion);
        aboutContent.appendChild(aboutDescription);
        aboutContent.appendChild(aboutCredits);
        const aboutLinks = document.createElement('div');
        aboutLinks.className = 'prts-about-links';
        [
            ['项目主页', 'https://github.com/ntgmc/Better-PRTS-Plus'],
            ['使用说明', 'https://github.com/ntgmc/Better-PRTS-Plus/blob/main/README.md'],
            ['问题反馈', 'https://github.com/ntgmc/Better-PRTS-Plus/issues'],
            ['更新记录', SCRIPT_RELEASE_URL]
        ].forEach(([text, url]) => {
            const link = document.createElement('a');
            link.className = 'prts-btn';
            link.textContent = text;
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            aboutLinks.appendChild(link);
        });
        aboutContent.appendChild(aboutLinks);

        const reloadNotice = document.createElement('div');
        reloadNotice.id = 'prts-settings-reload';
        reloadNotice.hidden = true;
        const reloadStatus = document.createElement('div');
        reloadStatus.setAttribute('role', 'status');
        reloadStatus.setAttribute('aria-live', 'polite');
        reloadStatus.textContent = '已保存，刷新后生效';
        reloadNotice.appendChild(reloadStatus);
        reloadNotice.appendChild(createPrtsButton({
            text: '立即刷新', icon: 'reload', onClick: () => location.reload()
        }));
        panel.appendChild(reloadNotice);

        let debugOptionsRevealed = CONFIG.compatDebug === true;
        diagnostics.button.hidden = !debugOptionsRevealed;

        const revealDebugOptions = event => {
            if (!event.shiftKey) return;
            event.preventDefault();
            event.stopPropagation();
            debugOptionsRevealed = !debugOptionsRevealed;
            diagnostics.button.hidden = !debugOptionsRevealed;
            if (!debugOptionsRevealed && activeSubmenu === diagnostics) setSubmenuOpen(null, false);
            updateFloatingLayout();
        };

        titleText.addEventListener('click', revealDebugOptions);

        const groupContents = {
            '作业卡片': cards.body, '页面增强': pageEnhancements.body,
            '脚本更新': aboutContent, '诊断': diagnostics.body
        };
        Object.entries(CONFIG_DEFINITIONS).forEach(([key, definition]) => {
            if (!definition.group) return;
            const target = groupContents[definition.group];
            if (definition.group === '脚本更新') {
                const groupTitle = document.createElement('div');
                groupTitle.className = 'prts-panel-title';
                groupTitle.textContent = definition.group;
                target.appendChild(groupTitle);
            }
            const onChange = value => {
                CONFIG[key] = value;
                saveConfig();
                refreshAccountControls();
                syncPageScaffold();
                document.querySelectorAll(BP_SELECTORS.portal).forEach(enhancePopover);
                requestFilterUpdate();
            };
            if (definition.options) {
                const item = document.createElement('div');
                item.className = 'prts-panel-item prts-panel-choice';
                const labelText = document.createElement('span');
                labelText.className = 'prts-panel-item-label';
                labelText.appendChild(createPrtsIcon(definition.icon));
                labelText.appendChild(document.createTextNode(definition.label));
                const choices = document.createElement('div');
                choices.className = 'prts-panel-segments';
                choices.setAttribute('role', 'group');
                choices.setAttribute('aria-label', definition.label);
                definition.options.forEach(value => {
                    const button = createPrtsButton({
                        className: 'prts-panel-segment', text: definition.optionLabels[value],
                        pressed: CONFIG[key] === value,
                        onClick: () => onChange(value)
                    });
                    button.dataset.prtsConfigKey = key;
                    button.value = value;
                    choices.appendChild(button);
                });
                item.appendChild(labelText);
                item.appendChild(choices);
                target.appendChild(item);
            } else {
                target.appendChild(createPrtsSwitch({
                    label: definition.label, checked: CONFIG[key], configKey: key, icon: definition.icon, onChange
                }));
            }
        });
        const updatePreviewLabel = document.createElement('div');
        updatePreviewLabel.className = 'prts-panel-item-label';
        updatePreviewLabel.textContent = '更新弹窗预览';
        diagnostics.body.appendChild(updatePreviewLabel);
        const updatePreviewActions = document.createElement('div');
        updatePreviewActions.className = 'prts-panel-actions';
        Object.entries(RELEASE_LEVELS).forEach(([level, text]) => {
            updatePreviewActions.appendChild(createPrtsButton({
                text, onClick: () => previewScriptUpdate(level)
            }));
        });
        diagnostics.body.appendChild(updatePreviewActions);
        aboutContent.appendChild(createPrtsButton({
            className: 'prts-btn prts-about-update', icon: 'checkUpdates', text: '检查脚本更新',
            onClick: () => checkScriptUpdates(true)
        }));

        // 账号管理
        const accRow = document.createElement('div');
        accRow.className = 'prts-panel-item prts-account-section';

        const accTitle = document.createElement('span');
        accTitle.className = 'prts-panel-item-label';
        accTitle.appendChild(createPrtsIcon('accounts'));
        const accTitleText = document.createElement('span');
        accTitleText.textContent = '账号管理';
        accTitle.appendChild(accTitleText);
        const accountToolbar = document.createElement('div');
        accountToolbar.className = 'prts-account-toolbar';
        accountToolbar.appendChild(accTitle);
        accountToolbar.appendChild(createPrtsButton({ id: 'prts-add-account', text: '添加账号', onClick: addAccount }));
        accRow.appendChild(accountToolbar);

        const accBtnGroup = document.createElement('div');
        accBtnGroup.className = 'prts-account-list';

        renderAccountList(accBtnGroup);
        accRow.appendChild(accBtnGroup);
        accounts.body.appendChild(accRow);

        const importBtn = createPrtsButton({ className: 'prts-btn prts-account-import', icon: 'importOperators', text: '导入干员数据', onClick: handleImport });
        accounts.body.appendChild(importBtn);

        const sklandBtn = createPrtsButton({ className: 'prts-btn prts-account-import', icon: 'skland', text: '森空岛导入', onClick: handleOpenSklandImport });
        accounts.body.appendChild(sklandBtn);

        const backupActions = document.createElement('div');
        backupActions.className = 'prts-panel-actions';

        const exportBtn = createPrtsButton({ className: 'prts-btn', icon: 'exportBackup', text: '导出全部配置', onClick: handleExportAccountsBackup });

        const importBackupBtn = createPrtsButton({ className: 'prts-btn', icon: 'importBackup', text: '导入全部配置', onClick: handleImportAccountsBackup });

        backupActions.appendChild(exportBtn);
        backupActions.appendChild(importBackupBtn);
        accounts.body.appendChild(backupActions);

        container.appendChild(panel);
        submenus.forEach(submenu => container.appendChild(submenu.panel));
        container.appendChild(btn);
        document.body.appendChild(container);
        refreshAccountControls();
        updateFloatingLayout();
        window.addEventListener('resize', updateFloatingLayout);
        window.visualViewport?.addEventListener('resize', updateFloatingLayout);
        window.visualViewport?.addEventListener('scroll', updateFloatingLayout);
        const panelObserver = new ResizeObserver(updateFloatingLayout);
        panelObserver.observe(panel);
        submenus.forEach(submenu => panelObserver.observe(submenu.panel));
        content.addEventListener('scroll', updateFloatingLayout);

        let isDragging = false;
        let hasMoved = false;
        let startX, startY, initialLeft, initialTop, activePointerId;

        btn.addEventListener('pointerdown', (e) => {
            activePointerId = e.pointerId;
            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            const rect = container.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
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
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                hasMoved = true;
                setFloatOpen(false);
            }

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            const viewport = window.visualViewport;
            const left = viewport?.offsetLeft || 0;
            const top = viewport?.offsetTop || 0;
            const width = viewport?.width || window.innerWidth;
            const height = viewport?.height || window.innerHeight;
            newLeft = Math.max(left, Math.min(newLeft, left + width - container.offsetWidth));
            newTop = Math.max(top, Math.min(newTop, top + height - container.offsetHeight));

            container.style.left = newLeft + 'px';
            container.style.top = newTop + 'px';
        });

        const finishDrag = (e) => {
            if (!isDragging) return;
            if (activePointerId !== undefined && e.pointerId !== activePointerId) return;
            const rect = container.getBoundingClientRect();
            isDragging = false;
            btn.releasePointerCapture?.(activePointerId);
            activePointerId = undefined;
            container.classList.remove('is-dragging');
            container.style.transform = '';

            if (hasMoved) {
                const viewport = window.visualViewport;
                const midpoint = (viewport?.offsetLeft || 0) + (viewport?.width || window.innerWidth) / 2;
                CONFIG.floatingPosition = {
                    top: (rect.top / window.innerHeight * 100).toFixed(1) + '%',
                    isRight: rect.left + rect.width / 2 >= midpoint
                };
                saveConfig();
                container.classList.add('is-snapping');
            }
            updateFloatingLayout();
        };

        document.addEventListener('pointerup', finishDrag);
        document.addEventListener('pointercancel', finishDrag);

        const setFloatOpen = isOpen => {
            if (!isOpen) setSubmenuOpen(null, false);
            if (isOpen) updateFloatingLayout();
            container.classList.toggle('prts-float-open', isOpen);
            btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        };

        btn.onclick = (e) => {
            e.stopPropagation();
            if (!hasMoved || e.detail === 0) setFloatOpen(!container.classList.contains('prts-float-open'));
            hasMoved = false;
        };
        panel.onclick = event => {
            event.stopPropagation();
            if (!event.target.closest?.('.prts-submenu-button')) setSubmenuOpen(null, false);
        };
        document.addEventListener('click', event => {
            if (!isDragging && !event.target.closest?.('#prts-modal-backdrop, #prts-import-dialog-backdrop')) setFloatOpen(false);
        });
        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || !container.classList.contains('prts-float-open') ||
                document.getElementById('prts-modal') || document.getElementById('prts-import-dialog')) return;
            event.preventDefault();
            if (activeSubmenu) setSubmenuOpen(null);
            else {
                setFloatOpen(false);
                btn.focus({ preventScroll: true });
            }
        });
    }
