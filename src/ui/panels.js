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
        const bar = document.getElementById('prts-filter-bar');
        if (bar) bar.remove();
        injectFilterControls();
        refreshAccountControls();
        if (CONFIG.filterMode !== 'NONE') requestFilterUpdate();
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
        const defaultStatusText = '请先确认当前页面已经登录森空岛。读取后将预览干员名单和练度变化，确认后导入。';

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
            const accountId = targetAccountId;
            const progressText = `正在读取森空岛数据，稍后请确认导入到 ${getAccountLabel(accountId)} 的变化。`;
            const updateToast = showPrtsToast('森空岛数据同步中…', 'loading', progressText, 0);
            importBtn.disabled = true;
            importBtn.textContent = '同步中…';
            accountButtons.forEach(button => { button.disabled = true; });
            setSklandPanelStatus(status, progressText, 'loading');
            try {
                const summary = await importSklandOperatorsToAccount(accountId, {
                    selectBinding: (bindings, defaultBinding) => showSklandBindingPicker(bindings, defaultBinding?.uid, accountId)
                });
                targetAccountId = summary.accountId;
                renderSklandAccountButtons(accountButtons, targetAccountId);
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
                accountButtons.forEach(button => { button.disabled = false; });
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

        const aboutPanel = document.getElementById('prts-about-panel');
        container.classList.toggle('prts-submenu-left', savedPos.isRight);
        if (!aboutPanel || aboutPanel.hidden) return;
        const roomLeft = panelLeft - left - 12;
        const roomRight = left + width - 12 - panelLeft - panel.offsetWidth;
        let opensLeft = savedPos.isRight;
        aboutPanel.style.setProperty('--prts-about-width', `${Math.max(0, width - 48)}px`);
        aboutPanel.style.maxHeight = `${Math.max(0, height - 24)}px`;
        const fitsLeft = roomLeft >= aboutPanel.offsetWidth + 8;
        const fitsRight = roomRight >= aboutPanel.offsetWidth + 8;
        if (opensLeft ? !fitsLeft && fitsRight : !fitsRight && fitsLeft) opensLeft = !opensLeft;
        let aboutLeft;
        if (fitsLeft || fitsRight) {
            aboutLeft = opensLeft ? panelLeft - aboutPanel.offsetWidth - 8 : panelLeft + panel.offsetWidth + 8;
        } else {
            // 窄屏保留上一级的 24px 边缘，仍按同一方向逐层展开。
            aboutPanel.style.setProperty('--prts-about-width', `${Math.max(0, panel.offsetWidth - 24)}px`);
            aboutLeft = opensLeft ? panelLeft + panel.offsetWidth - aboutPanel.offsetWidth - 24 : panelLeft + 24;
        }
        const entryTop = document.getElementById('prts-settings-about-button').getBoundingClientRect().top;
        const aboutTop = Math.max(top + 12, Math.min(entryTop, top + height - aboutPanel.offsetHeight - 12));
        aboutPanel.style.left = `${aboutLeft - ballLeft}px`;
        aboutPanel.style.top = `${aboutTop - ballTop}px`;
        container.classList.toggle('prts-submenu-left', opensLeft);
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

        const aboutPanel = document.createElement('div');
        aboutPanel.id = 'prts-about-panel';
        aboutPanel.hidden = true;
        aboutPanel.setAttribute('role', 'region');
        aboutPanel.setAttribute('aria-labelledby', 'prts-about-title');
        const aboutHead = document.createElement('div');
        aboutHead.className = 'prts-modal-head';
        const aboutTitle = document.createElement('h2');
        aboutTitle.id = 'prts-about-title';
        aboutTitle.className = 'prts-modal-title';
        aboutTitle.textContent = '关于';
        aboutHead.appendChild(aboutTitle);
        const aboutClose = createPrtsButton({
            className: 'prts-btn prts-about-close', icon: 'close', ariaLabel: '收起关于',
            onClick: () => setAboutOpen(false)
        });
        aboutHead.appendChild(aboutClose);
        aboutPanel.appendChild(aboutHead);
        const aboutContent = document.createElement('div');
        aboutContent.className = 'prts-about-content';
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
        aboutPanel.appendChild(aboutContent);

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

        titleText.addEventListener('click', revealDebugOptions);

        let currentGroup = '';
        Object.entries(CONFIG_DEFINITIONS).forEach(([key, definition]) => {
            if (!definition.group) return;
            const target = definition.group === '诊断' ? debugOptions
                : definition.group === '脚本更新' ? aboutContent : content;
            if (definition.group !== currentGroup) {
                const groupTitle = document.createElement('div');
                groupTitle.className = 'prts-panel-title';
                groupTitle.textContent = definition.group;
                target.appendChild(groupTitle);
                currentGroup = definition.group;
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
        debugOptions.appendChild(updatePreviewLabel);
        const updatePreviewActions = document.createElement('div');
        updatePreviewActions.className = 'prts-panel-actions';
        Object.entries(RELEASE_LEVELS).forEach(([level, text]) => {
            updatePreviewActions.appendChild(createPrtsButton({
                text, onClick: () => previewScriptUpdate(level)
            }));
        });
        debugOptions.appendChild(updatePreviewActions);
        content.appendChild(debugOptions);
        aboutContent.appendChild(createPrtsButton({
            className: 'prts-btn prts-about-update', icon: 'download', text: '检查脚本更新',
            onClick: () => checkScriptUpdates(true)
        }));

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

            const accBtn = document.createElement('button');
            accBtn.type = 'button';
            accBtn.className = 'prts-acc-btn';
            accBtn.dataset.id = i;
            accBtn.onclick = (e) => {
                e.stopPropagation();
                switchAccount(i);
            };

            const heading = document.createElement('span');
            heading.className = 'prts-account-heading';
            const name = document.createElement('span');
            name.className = 'prts-account-name';
            heading.appendChild(name);
            heading.appendChild(createPrtsIcon('check'));

            const count = document.createElement('span');
            count.className = 'prts-account-count';
            const syncMeta = document.createElement('span');
            syncMeta.className = 'prts-account-sync-meta';
            accBtn.appendChild(heading);
            accBtn.appendChild(count);
            accBtn.appendChild(syncMeta);

            const renameBtn = document.createElement('button');
            renameBtn.type = 'button';
            renameBtn.className = 'prts-account-rename';
            renameBtn.dataset.id = i;
            renameBtn.textContent = '改名';
            renameBtn.onclick = (e) => {
                e.stopPropagation();
                renameAccount(i);
            };

            row.appendChild(accBtn);
            row.appendChild(renameBtn);
            accBtnGroup.appendChild(row);
        }
        accRow.appendChild(accBtnGroup);
        content.appendChild(accRow);

        const importBtn = createPrtsButton({ className: 'prts-btn', icon: 'import', text: '导入干员数据', onClick: handleImport });
        importBtn.style.width = '100%'; importBtn.style.marginTop = '4px';
        content.appendChild(importBtn);

        const sklandBtn = createPrtsButton({ className: 'prts-btn', icon: 'skland', text: '森空岛导入', onClick: handleOpenSklandImport });
        sklandBtn.style.width = '100%'; sklandBtn.style.marginTop = '8px';
        content.appendChild(sklandBtn);

        const backupActions = document.createElement('div');
        backupActions.className = 'prts-panel-actions';

        const exportBtn = createPrtsButton({ className: 'prts-btn', icon: 'download', text: '导出全部配置', onClick: handleExportAccountsBackup });

        const importBackupBtn = createPrtsButton({ className: 'prts-btn', icon: 'upload', text: '导入全部配置', onClick: handleImportAccountsBackup });

        backupActions.appendChild(exportBtn);
        backupActions.appendChild(importBackupBtn);
        content.appendChild(backupActions);

        const aboutButton = createPrtsButton({
            id: 'prts-settings-about-button', className: 'prts-btn prts-settings-about-button',
            icon: 'info', text: '关于', ariaControls: aboutPanel.id, expanded: false,
            onClick: () => setAboutOpen(aboutPanel.hidden)
        });
        const submenuArrow = document.createElement('span');
        submenuArrow.className = 'prts-submenu-arrow';
        submenuArrow.setAttribute('aria-hidden', 'true');
        submenuArrow.textContent = '›';
        aboutButton.appendChild(submenuArrow);
        content.appendChild(aboutButton);

        const setAboutOpen = (isOpen, restoreFocus = true) => {
            aboutPanel.hidden = !isOpen;
            aboutButton.setAttribute('aria-expanded', String(isOpen));
            if (isOpen) updateFloatingLayout();
            if (isOpen || restoreFocus) (isOpen ? aboutClose : aboutButton).focus({ preventScroll: true });
        };

        container.appendChild(panel);
        container.appendChild(aboutPanel);
        container.appendChild(btn);
        document.body.appendChild(container);
        refreshAccountControls();
        updateFloatingLayout();
        window.addEventListener('resize', updateFloatingLayout);
        window.visualViewport?.addEventListener('resize', updateFloatingLayout);
        window.visualViewport?.addEventListener('scroll', updateFloatingLayout);
        const panelObserver = new ResizeObserver(updateFloatingLayout);
        panelObserver.observe(panel);
        panelObserver.observe(aboutPanel);
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
            if (!isOpen) setAboutOpen(false, false);
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
            if (!event.target.closest?.('#prts-settings-about-button')) setAboutOpen(false, false);
        };
        aboutPanel.onclick = event => event.stopPropagation();
        document.addEventListener('click', event => {
            if (!isDragging && !event.target.closest?.('#prts-modal-backdrop, #prts-import-dialog-backdrop')) setFloatOpen(false);
        });
        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || !container.classList.contains('prts-float-open') ||
                document.getElementById('prts-modal') || document.getElementById('prts-import-dialog')) return;
            event.preventDefault();
            if (!aboutPanel.hidden) setAboutOpen(false);
            else {
                setFloatOpen(false);
                btn.focus({ preventScroll: true });
            }
        });
    }
