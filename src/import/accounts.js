    // =========================================================================
    //                            MODULE 4: 数据存取与账号管理
    // =========================================================================

    function getCurrentAccountState() {
        return createAccountState({ activeAccountId, accountsData, accountMeta });
    }

    function publishAccountState(value) {
        const state = createAccountState(value);
        activeAccountId = state.activeAccountId;
        accountsData = state.accountsData;
        accountMeta = state.accountMeta;
        ownedOpsSet = new Set(accountsData[activeAccountId] || []);
        return state;
    }

    function commitAccountState(value) {
        const state = createAccountState(value);
        GM_setValue(ACCOUNTS_DATA_KEY, serializeAccountState(state));
        return publishAccountState(state);
    }

    function readAccountStorageSnapshot() {
        const legacyAccounts = {};
        ACCOUNT_IDS.forEach(id => {
            legacyAccounts[id] = GM_getValue(`prts_plus_user_ops_${id}`);
        });
        return {
            unifiedStore: GM_getValue(ACCOUNTS_DATA_KEY),
            legacyAccounts,
            legacyActiveAccountId: GM_getValue('prts_plus_active_account'),
            veryOldStore: GM_getValue('prts_plus_user_ops'),
            legacySklandSummary: GM_getValue(SKLAND_LAST_IMPORT_KEY)
        };
    }

    function reportAccountStateDiagnostics(diagnostics) {
        diagnostics.forEach(diagnostic => {
            console.warn('[Better PRTS] 账户数据兼容诊断', diagnostic.code, diagnostic.source);
        });
    }

    /**
     * 加载干员数据：具备高级的向下兼容与数据迁移能力
     */
    function loadOwnedOps() {
        currentFilterMode = normalizeFilterMode(currentFilterMode);
        displayMode = normalizeDisplayMode(displayMode);
        const resolved = resolveStoredAccountState(readAccountStorageSnapshot());
        reportAccountStateDiagnostics(resolved.diagnostics);
        if (resolved.migrated) {
            commitAccountState(resolved.state);
        } else {
            publishAccountState(resolved.state);
        }
        console.log(`[Better PRTS] 已加载账号 ${activeAccountId} 的 ${ownedOpsSet.size} 名持有干员`);
    }

    /**
     * 执行账号切换
     */
    function switchAccount(id) {
        id = normalizeAccountId(id);
        if (id === activeAccountId) return;

        commitAccountState(createAccountSwitchState(getCurrentAccountState(), id));

        // 1. 同步悬浮窗面板内的小按钮状态
        const accBtns = document.querySelectorAll('.prts-acc-btn');
        accBtns.forEach(btn => {
            if (parseInt(btn.dataset.id) === activeAccountId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 2. 销毁并重建控制栏以刷新UI文案和导入数量
        const bar = document.getElementById('prts-filter-bar');
        if (bar) bar.remove();
        injectFilterControls();
        refreshAccountControls();

        // 3. 立刻触发重新筛选运算
        if (currentFilterMode !== 'NONE') {
            requestFilterUpdate();
        }
    }

    // 给主控制栏用的循环切换
    function cycleAccount() {
        let nextId = activeAccountId + 1;
        if (nextId > 3) nextId = 1;
        switchAccount(nextId);
    }

    function refreshAccountControls() {
        document.querySelectorAll('.prts-acc-btn').forEach(btn => {
            const id = normalizeAccountId(btn.dataset.id);
            const label = getAccountLabel(id);
            btn.textContent = `${label} (${getAccountOperatorCount(id)})`;
            btn.title = formatAccountSklandTitle(id);
            btn.classList.toggle('active', id === activeAccountId);

            const syncMetaEl = btn.closest('.prts-account-row')?.querySelector('.prts-account-sync-meta');
            if (syncMetaEl) {
                const syncText = formatSklandSyncSummary(getAccountSklandSyncMeta(id));
                syncMetaEl.textContent = syncText;
                syncMetaEl.classList.toggle('is-visible', Boolean(syncText));
            }
        });

        document.querySelectorAll('[data-prts-config-key]').forEach(input => {
            const key = input.dataset.prtsConfigKey;
            if (key && Object.prototype.hasOwnProperty.call(CONFIG, key)) {
                input.checked = CONFIG[key] === true;
            }
        });
    }

    function refreshAccountStateUi(forceFilterUpdate = false) {
        const bar = document.getElementById('prts-filter-bar');
        if (bar) bar.remove();
        injectFilterControls();
        refreshAccountControls();
        applyFloatingPositionToContainer();
        applySidebarCollapse();
        if (forceFilterUpdate || currentFilterMode !== 'NONE') requestFilterUpdate();
    }

    async function renameAccount(id) {
        const accountId = normalizeAccountId(id);
        const currentLabel = getAccountLabel(accountId);
        const rawLabel = await showPrtsPrompt({
            title: `重命名账号 ${accountId}`,
            message: '输入新的账号昵称，留空会恢复默认名称。',
            inputLabel: '账号昵称',
            defaultValue: currentLabel,
            maxLength: ACCOUNT_LABEL_MAX_LENGTH,
            confirmText: '保存',
            cancelText: '取消'
        });
        if (rawLabel === null) return;

        commitAccountState(createRenamedAccountState(getCurrentAccountState(), accountId, rawLabel));
        refreshAccountStateUi();
        showPrtsToast('账号名称已更新', 'success', `${getAccountLabel(accountId)} / ${getAccountOperatorCount(accountId)} 名干员`);
    }

    function getAccountSklandSyncMeta(id) {
        const accountId = normalizeAccountId(id);
        return normalizeSklandSyncMeta(accountMeta?.[accountId]?.skland);
    }

    function getAccountSklandImportSummary(id) {
        const accountId = normalizeAccountId(id);
        const skland = getAccountSklandSyncMeta(accountId);
        if (!skland) return null;

        return {
            accountId,
            accountLabel: getAccountLabel(accountId),
            ...skland
        };
    }

    function formatAccountSklandTitle(id) {
        const accountId = normalizeAccountId(id);
        const label = getAccountLabel(accountId);
        const lines = [
            `切换到 ${label}`,
            `${getAccountOperatorCount(accountId)} 名干员`
        ];
        const skland = getAccountSklandSyncMeta(accountId);
        const sklandSummary = formatSklandSyncSummary(skland, { includeDetail: true });
        if (sklandSummary) lines.push(sklandSummary);
        return lines.join('\n');
    }

    function getBackupPreferences() {
        return {
            filterMode: normalizeFilterMode(currentFilterMode),
            displayMode: normalizeDisplayMode(displayMode),
            config: {
                visuals: CONFIG.visuals === true,
                cleanLink: CONFIG.cleanLink === true,
                hideSidebar: CONFIG.hideSidebar === true
            },
            floatingPosition: parseFloatingPosition(GM_getValue('prts_float_pos', '{"top":"40%","isRight":true}'))
        };
    }

    function buildAccountsBackup() {
        const state = getCurrentAccountState();

        return {
            type: ACCOUNT_BACKUP_TYPE,
            version: ACCOUNT_BACKUP_VERSION,
            exportedAt: new Date().toISOString(),
            activeAccountId: state.activeAccountId,
            accountsData: state.accountsData,
            accountMeta: state.accountMeta,
            preferences: getBackupPreferences()
        };
    }

    function formatBackupTimestamp(date) {
        const pad = value => String(value).padStart(2, '0');
        return [
            date.getFullYear(),
            pad(date.getMonth() + 1),
            pad(date.getDate())
        ].join('') + '-' + [
            pad(date.getHours()),
            pad(date.getMinutes()),
            pad(date.getSeconds())
        ].join('');
    }

    function downloadJsonFile(fileName, payload) {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    function handleExportAccountsBackup() {
        try {
            const backup = buildAccountsBackup();
            const fileName = `better-prts-plus-backup-${formatBackupTimestamp(new Date())}.json`;
            downloadJsonFile(fileName, backup);
            showPrtsToast('已导出全部配置', 'success', fileName);
        } catch (error) {
            console.error('[Better PRTS] 导出全部配置失败', error);
            showPrtsToast('导出全部配置失败', 'error', error instanceof Error ? error.message : '未知错误');
        }
    }

    function normalizeBackupPreferences(value) {
        const raw = isPlainRecord(value) ? value : {};
        const rawConfig = isPlainRecord(raw.config) ? raw.config : {};
        return {
            filterMode: normalizeFilterMode(raw.filterMode),
            displayMode: normalizeDisplayMode(raw.displayMode),
            config: {
                visuals: rawConfig.visuals !== false,
                cleanLink: rawConfig.cleanLink !== false,
                hideSidebar: rawConfig.hideSidebar === true
            },
            floatingPosition: parseFloatingPosition(raw.floatingPosition)
        };
    }

    function parseAccountsBackup(value) {
        if (Array.isArray(value)) {
            throw new Error('这看起来是单账号干员列表，请使用“导入干员数据”。');
        }
        if (!isPlainRecord(value)) {
            throw new Error('这不是有效的 Better-PRTS-Plus 全部配置备份。');
        }
        if (value.type !== ACCOUNT_BACKUP_TYPE || value.version !== ACCOUNT_BACKUP_VERSION) {
            throw new Error('备份格式不匹配，请选择 Better-PRTS-Plus 导出的全部配置文件。');
        }

        return {
            activeAccountId: normalizeAccountId(value.activeAccountId),
            accountsData: normalizeAccountsData(value.accountsData),
            accountMeta: normalizeAccountMeta(value.accountMeta),
            preferences: normalizeBackupPreferences(value.preferences)
        };
    }

    function formatAccountsBackupSummary(backup) {
        const lines = [
            '将覆盖当前 3 个账号、账号昵称和 UI 偏好。',
            `导入后当前账号: ${backup.accountMeta[backup.activeAccountId].label}`,
            ''
        ];

        ACCOUNT_IDS.forEach(id => {
            lines.push(`${backup.accountMeta[id].label}: ${backup.accountsData[id].length} 名干员`);
        });
        lines.push('');
        lines.push('确认继续导入？');
        return lines.join('\n');
    }

    function applyFloatingPositionToContainer() {
        const container = document.getElementById('prts-float-container');
        if (!container) return;

        const savedPos = parseFloatingPosition(GM_getValue('prts_float_pos', '{"top":"40%","isRight":true}'));
        container.style.top = savedPos.top;
        if (savedPos.isRight) {
            container.style.left = 'auto';
            container.style.right = '0px';
            container.classList.add('snap-right');
            container.classList.remove('snap-left');
        } else {
            container.style.left = '0px';
            container.style.right = 'auto';
            container.classList.add('snap-left');
            container.classList.remove('snap-right');
        }
    }

    function applyAccountsBackup(backup) {
        const nextState = createAccountState(backup);
        currentFilterMode = normalizeFilterMode(backup.preferences.filterMode);
        displayMode = normalizeDisplayMode(backup.preferences.displayMode);
        CONFIG.visuals = backup.preferences.config.visuals === true;
        CONFIG.cleanLink = backup.preferences.config.cleanLink === true;
        CONFIG.hideSidebar = backup.preferences.config.hideSidebar === true;

        commitAccountState(nextState);
        GM_setValue(FILTER_MODE_KEY, currentFilterMode);
        GM_setValue(DISPLAY_MODE_KEY, displayMode);
        saveConfig();
        GM_setValue('prts_float_pos', JSON.stringify(backup.preferences.floatingPosition));

        refreshAccountStateUi(true);
    }

    function handleImportAccountsBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > ACCOUNT_BACKUP_MAX_BYTES) {
                showPrtsToast('配置文件过大', 'error', '请选择 Better-PRTS-Plus 导出的备份文件。');
                return;
            }

            const reader = new FileReader();
            reader.onload = async event => {
                try {
                    const parsed = safeJsonParse(event.target.result, null);
                    const backup = parseAccountsBackup(parsed);
                    const confirmed = await showPrtsConfirm({
                        title: '导入全部配置',
                        message: formatAccountsBackupSummary(backup),
                        confirmText: '确认导入',
                        cancelText: '取消',
                        tone: 'danger'
                    });
                    if (!confirmed) return;

                    applyAccountsBackup(backup);
                    showPrtsToast('全部配置导入成功', 'success', `${getAccountLabel(activeAccountId)} 已切换为当前账号。`);
                } catch (error) {
                    console.error('[Better PRTS] 导入全部配置失败', error);
                    showPrtsToast('导入全部配置失败', 'error', error instanceof Error ? error.message : '未知错误');
                }
            };
            reader.onerror = () => {
                showPrtsToast('导入全部配置失败', 'error', reader.error?.message || '无法读取文件，请重试。');
            };
            reader.readAsText(file);
        };
        input.click();
    }
