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
        if (!CONFIG.announcementTags) return;
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

    function registerAccountsDataChangeListener() {
        if (typeof GM_addValueChangeListener !== 'function') return;
        GM_addValueChangeListener(ACCOUNTS_DATA_KEY, (_name, oldValue, newValue, remote) => {
            if (!remote || oldValue === newValue) return;
            refreshOwnedOpsFromStorage();
        });
    }

    function refreshOwnedOpsFromStorage() {
        loadOwnedOps();
        if (isSklandHost()) {
            refreshAccountControls();
            return;
        }
        const bar = document.getElementById('prts-filter-bar');
        if (bar) bar.remove();
        injectFilterControls();
        refreshAccountControls();
        updateFloatingLayout();
        if (CONFIG.filterMode !== 'NONE' || CONFIG.trainingCheck) requestFilterUpdate();
    }

    function initSklandImportPage() {
        loadOwnedOps();
        registerAccountsDataChangeListener();
        if (document.body) {
            createSklandImportPanel();
            return;
        }
        window.addEventListener('DOMContentLoaded', createSklandImportPanel, { once: true });
    }

    function createSklandImportPanel() {
        if (document.getElementById('prts-skland-import-panel')) return;

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
        const defaultStatusText = '请先确认当前页面已经登录森空岛。读取后将预览干员名单和练度变化，确认后导入。';

        const accountLabel = document.createElement('span');
        accountLabel.className = 'prts-skland-label';
        accountLabel.textContent = '导入到账号';
        body.appendChild(accountLabel);

        const accountSelect = createAccountSelect('prts-skland-target-account', activeAccountId, () => {
            renderSklandSelectedAccountStatus(status, Number(accountSelect.value), defaultStatusText);
        });
        body.appendChild(accountSelect);

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
            const accountId = Number(accountSelect.value);
            const progressText = `正在读取森空岛数据，稍后请确认导入到 ${getAccountLabel(accountId)} 的变化。`;
            const updateToast = showPrtsToast('森空岛数据同步中…', 'loading', progressText, 0);
            importBtn.disabled = true;
            importBtn.textContent = '同步中…';
            accountSelect.disabled = true;
            setSklandPanelStatus(status, progressText, 'loading');
            try {
                const summary = await importSklandOperatorsToAccount(accountId, {
                    selectBinding: (bindings, defaultBinding) => showSklandBindingPicker(bindings, defaultBinding?.uid, accountId)
                });
                createAccountSelect(accountSelect.id, summary.accountId, accountSelect.onchange);
                const detail = formatSklandImportSummary(summary);
                setSklandPanelStatus(status, detail, 'success');
                updateToast('森空岛数据同步成功', 'success', detail);
            } catch (error) {
                if (isSklandImportCancelledError(error)) {
                    setSklandPanelStatus(status, '已取消导入，未修改账号数据。', '');
                    updateToast('已取消森空岛数据同步', 'info', '未修改账号数据。');
                    return;
                }
                console.error('[Better PRTS] 森空岛导入失败', error instanceof Error ? error.message : error);
                const detail = error instanceof Error ? error.message : '森空岛导入失败，请稍后重试。';
                setSklandPanelStatus(status, detail, 'error');
                updateToast('森空岛数据同步失败', 'error', detail);
            } finally {
                importBtn.disabled = false;
                importBtn.textContent = '读取并导入干员';
                accountSelect.disabled = false;
            }
        };

        renderSklandSelectedAccountStatus(status, Number(accountSelect.value), defaultStatusText);

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
            heading.appendChild(createPrtsIcon('check'));
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
                className: 'prts-btn prts-submenu-close', icon: 'close', ariaLabel: `收起${label}`,
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
            const arrow = document.createElement('span');
            arrow.className = 'prts-submenu-arrow';
            arrow.setAttribute('aria-hidden', 'true');
            arrow.textContent = '›';
            button.appendChild(arrow);
            content.appendChild(button);
            submenuPanel.dataset.triggerId = button.id;
            submenuPanel.onclick = event => event.stopPropagation();
            const submenu = { panel: submenuPanel, body, button, close };
            submenus.push(submenu);
            return submenu;
        };
        const cards = createSubmenu('cards', '作业卡片', 'layout');
        const pageEnhancements = createSubmenu('page', '页面增强', 'settings');
        const accounts = createSubmenu('accounts', '账号与数据', 'account');
        const about = createSubmenu('about', '关于', 'info');
        const diagnostics = createSubmenu('diagnostics', '诊断', 'filter');
        const aboutContent = about.body;
        const aboutName = document.createElement('h3');
        aboutName.className = 'prts-about-name';
        aboutName.textContent = 'Better-PRTS-Plus';
        const aboutVersion = document.createElement('p');
        aboutVersion.className = 'prts-about-version';
        aboutVersion.textContent = `当前版本 ${GM_info.script.version}`;
        const aboutDescription = document.createElement('p');
        aboutDescription.className = 'prts-about-description';
        aboutDescription.textContent = 'PRTS Plus 增强脚本，支持持有干员与练度筛选、多账号管理和页面显示优化。';
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
            text: '立即刷新', icon: 'check', onClick: () => location.reload()
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
            className: 'prts-btn prts-about-update', icon: 'download', text: '检查脚本更新',
            onClick: () => checkScriptUpdates(true)
        }));

        // 账号管理
        const accRow = document.createElement('div');
        accRow.className = 'prts-panel-item prts-account-section';

        const accTitle = document.createElement('span');
        accTitle.className = 'prts-panel-item-label';
        accTitle.appendChild(createPrtsIcon('account'));
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

        const importBtn = createPrtsButton({ className: 'prts-btn prts-account-import', icon: 'import', text: '导入干员数据', onClick: handleImport });
        accounts.body.appendChild(importBtn);

        const sklandBtn = createPrtsButton({ className: 'prts-btn prts-account-import', icon: 'skland', text: '森空岛导入', onClick: handleOpenSklandImport });
        accounts.body.appendChild(sklandBtn);

        const backupActions = document.createElement('div');
        backupActions.className = 'prts-panel-actions';

        const exportBtn = createPrtsButton({ className: 'prts-btn', icon: 'download', text: '导出全部配置', onClick: handleExportAccountsBackup });

        const importBackupBtn = createPrtsButton({ className: 'prts-btn', icon: 'upload', text: '导入全部配置', onClick: handleImportAccountsBackup });

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
