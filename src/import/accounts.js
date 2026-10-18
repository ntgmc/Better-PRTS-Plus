    // =========================================================================
    //                            MODULE 4: 数据存取与账号管理
    // =========================================================================

    function getCurrentAccountState() {
        return createAccountState({ activeAccountId, nextAccountId, accountsData, accountsTraining, accountMeta });
    }

    function publishAccountState(value) {
        const state = createAccountState(value);
        activeAccountId = state.activeAccountId;
        nextAccountId = state.nextAccountId;
        accountsData = state.accountsData;
        accountsTraining = state.accountsTraining;
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
        LEGACY_ACCOUNT_IDS.forEach(id => {
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
        const restoreFocus = document.activeElement?.id === 'btn-account';
        try {
            const latest = resolveStoredAccountState(readAccountStorageSnapshot()).state;
            commitAccountState(createAccountSwitchState(latest, id));
            refreshAccountStateUi();
            if (restoreFocus) document.getElementById('btn-account')?.focus({ preventScroll: true });
        } catch (error) {
            showPrtsToast('切换账号失败', 'error', error.message);
        }
    }

    // 给主控制栏用的循环切换
    function cycleAccount() {
        const ids = getAccountIds();
        switchAccount(ids[(ids.indexOf(activeAccountId) + 1) % ids.length]);
    }

    function refreshAccountControls() {
        const canRemove = getAccountIds().length > 1;
        document.querySelectorAll('.prts-account-list').forEach(renderAccountList);
        document.querySelectorAll('.prts-account-select').forEach(select => {
            const previousId = Number(select.value);
            createAccountSelect(select.id, select.id === 'btn-account' ? activeAccountId : previousId, select.onchange);
            if (select.id !== 'btn-account' && Number(select.value) !== previousId && !select.disabled) select.onchange?.();
        });
        document.querySelectorAll('.prts-acc-btn').forEach(btn => {
            const id = normalizeAccountId(btn.dataset.id);
            const label = getAccountLabel(id);
            btn.querySelector('.prts-account-name').textContent = label;
            btn.querySelector('.prts-account-count').textContent = `${getAccountOperatorCount(id)} 名干员`;
            btn.title = formatAccountSklandTitle(id);
            btn.setAttribute('aria-label', `切换到 ${label}`);
            btn.setAttribute('aria-pressed', String(id === activeAccountId));
            btn.classList.toggle('active', id === activeAccountId);
            const row = btn.closest('.prts-account-row');
            row.classList.toggle('is-active', id === activeAccountId);
            row.querySelector('.prts-account-rename').setAttribute('aria-label', `重命名 ${label}`);
            const removeButton = row.querySelector('.prts-account-delete');
            removeButton.setAttribute('aria-label', `删除 ${label}`);
            removeButton.disabled = !canRemove;
            removeButton.title = canRemove ? `删除 ${label}` : '至少需要保留一个账号';

            const syncMetaEl = btn.querySelector('.prts-account-sync-meta');
            if (syncMetaEl) {
                const meta = getAccountSklandSyncMeta(id);
                syncMetaEl.textContent = meta ? `森空岛 · ${new Date(meta.importedAt).toLocaleString(undefined, {
                    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
                })}` : '';
                syncMetaEl.classList.toggle('is-visible', Boolean(meta));
            }
        });

        document.querySelectorAll('[data-prts-config-key]').forEach(input => {
            const key = input.dataset.prtsConfigKey;
            if (key && Object.prototype.hasOwnProperty.call(CONFIG, key)) {
                if (input.tagName === 'BUTTON') input.setAttribute('aria-pressed', String(input.value === CONFIG[key]));
                else input.checked = CONFIG[key] === true;
            }
        });
        updateSettingsReloadNotice();
    }

    function refreshAccountStateUi(forceFilterUpdate = false) {
        const bar = document.getElementById('prts-filter-bar');
        if (bar) bar.remove();
        injectFilterControls();
        refreshAccountControls();
        updateFloatingLayout();
        applySidebarCollapse();
        if (forceFilterUpdate || CONFIG.filterMode !== 'NONE' || CONFIG.trainingCheck) requestFilterUpdate();
    }

    async function confirmOperatorImport(accountId, names, training, sourceLabel) {
        const id = normalizeAccountId(accountId);
        while (true) {
            const resolved = resolveStoredAccountState(readAccountStorageSnapshot());
            reportAccountStateDiagnostics(resolved.diagnostics);
            const state = resolved.state;
            requireAccount(state, id);
            const diff = getOperatorImportDiff(state.accountsData[id], names, state.accountsTraining[id], training);
            const danger = diff.removed > 0 || diff.decreasedTrainingNames.length > 0 || diff.clearedTrainingNames.length > 0;
            const lines = [
                `导入到：${state.accountMeta[id].label}（账号 ${id}）`,
                `来源：${sourceLabel || '导入内容'}`,
                `当前 ${state.accountsData[id].length} 名 → 导入后 ${diff.total} 名`,
                `新增 ${diff.added} 名 / 移除 ${diff.removed} 名`,
                diff.trainingCount ? `包含练度：${diff.trainingCount} / ${diff.total} 名干员` : '不包含练度数据',
                '导入会替换此账号的干员名单和练度。'
            ];
            if (diff.removed) lines.push(`将移除 ${diff.removed} 名干员：${diff.removedNames.join('、')}`);
            if (diff.decreasedTrainingNames.length) {
                lines.push(`练度将降低 ${diff.decreasedTrainingNames.length} 名：${diff.decreasedTrainingNames.join('、')}`);
            }
            if (diff.clearedTrainingNames.length) {
                lines.push(`部分或全部练度将被清空 ${diff.clearedTrainingNames.length} 名：${diff.clearedTrainingNames.join('、')}`);
            }
            if (danger) lines.push('请核对账号和来源，确认要覆盖这些已有数据吗？');
            const confirmed = await showPrtsConfirm({
                title: danger ? '导入将覆盖已有数据' : '导入预览',
                message: lines.join('\n'),
                confirmText: danger ? '确认覆盖并导入' : '确认导入',
                cancelText: '取消',
                tone: danger ? 'danger' : ''
            });
            if (!confirmed) return null;

            const latest = resolveStoredAccountState(readAccountStorageSnapshot()).state;
            if (['accountsData', 'accountsTraining', 'accountMeta'].some(key =>
                JSON.stringify(state[key][id]) !== JSON.stringify(latest[key][id]))) continue;
            return latest;
        }
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

        try {
            const latest = resolveStoredAccountState(readAccountStorageSnapshot()).state;
            commitAccountState(createRenamedAccountState(latest, accountId, rawLabel));
            refreshAccountStateUi();
            showPrtsToast('账号名称已更新', 'success', `${getAccountLabel(accountId)} / ${getAccountOperatorCount(accountId)} 名干员`);
        } catch (error) {
            showPrtsToast('重命名失败', 'error', error.message);
        }
    }

    async function addAccount() {
        const label = await showPrtsPrompt({
            title: '添加账号', message: '填写账号昵称，留空使用默认名称。', inputLabel: '账号昵称',
            maxLength: ACCOUNT_LABEL_MAX_LENGTH, confirmText: '添加', cancelText: '取消'
        });
        if (label === null) return;
        try {
            const latest = resolveStoredAccountState(readAccountStorageSnapshot()).state;
            commitAccountState(createAddedAccountState(latest, label));
            refreshAccountStateUi();
            showPrtsToast('账号已添加', 'success', `已切换到 ${getAccountLabel(activeAccountId)}，可导入干员数据。`);
        } catch (error) {
            showPrtsToast('添加账号失败', 'error', error.message);
        }
    }

    async function removeAccount(accountId) {
        try {
            while (true) {
                const state = resolveStoredAccountState(readAccountStorageSnapshot()).state;
                const id = requireAccount(state, accountId);
                if (getAccountIds(state.accountsData).length <= 1) throw new Error('至少需要保留一个账号。');
                const confirmed = await showPrtsConfirm({
                    title: '删除账号',
                    message: `删除 ${state.accountMeta[id].label}（账号 ${id}）及其 ${state.accountsData[id].length} 名干员、练度和同步记录？此操作无法撤销。`,
                    confirmText: '确认删除', cancelText: '取消', tone: 'danger'
                });
                if (!confirmed) return;
                const latest = resolveStoredAccountState(readAccountStorageSnapshot()).state;
                if (['accountsData', 'accountsTraining', 'accountMeta'].some(key =>
                    JSON.stringify(state[key][id]) !== JSON.stringify(latest[key][id]))) continue;
                commitAccountState(createRemovedAccountState(latest, id));
                refreshAccountStateUi(true);
                document.getElementById('prts-add-account')?.focus({ preventScroll: true });
                showPrtsToast('账号已删除', 'success');
                return;
            }
        } catch (error) {
            showPrtsToast('删除账号失败', 'error', error.message);
        }
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
            `切换到 ${label}（账号 ${accountId}）`,
            `${getAccountOperatorCount(accountId)} 名干员`
        ];
        const skland = getAccountSklandSyncMeta(accountId);
        const sklandSummary = formatSklandSyncSummary(skland, { includeDetail: true });
        if (sklandSummary) lines.push(sklandSummary);
        return lines.join('\n');
    }

    function getBackupPreferences() {
        return {
            filterMode: CONFIG.filterMode,
            trainingCheck: CONFIG.trainingCheck,
            displayMode: CONFIG.displayMode,
            config: Object.fromEntries(Object.entries(CONFIG_DEFINITIONS)
                .filter(([, definition]) => definition.group)
                .map(([key]) => [key, CONFIG[key]])),
            floatingPosition: parseFloatingPosition(CONFIG.floatingPosition)
        };
    }

    function buildAccountsBackup() {
        const state = getCurrentAccountState();

        return {
            type: ACCOUNT_BACKUP_TYPE,
            version: ACCOUNT_BACKUP_VERSION,
            exportedAt: new Date().toISOString(),
            activeAccountId: state.activeAccountId,
            nextAccountId: state.nextAccountId,
            accountsData: state.accountsData,
            accountsTraining: state.accountsTraining,
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
        const config = normalizeConfig({
            ...rawConfig, filterMode: raw.filterMode, trainingCheck: raw.trainingCheck,
            displayMode: raw.displayMode, floatingPosition: raw.floatingPosition
        });
        return {
            filterMode: config.filterMode,
            trainingCheck: config.trainingCheck,
            displayMode: config.displayMode,
            config: Object.fromEntries(Object.entries(CONFIG_DEFINITIONS)
                .filter(([, definition]) => definition.group)
                .map(([key]) => [key, config[key]])),
            floatingPosition: config.floatingPosition
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
            ...createAccountState(value),
            preferences: normalizeBackupPreferences(value.preferences)
        };
    }

    function formatAccountsBackupSummary(backup) {
        const lines = [
            `将用备份中的 ${getAccountIds(backup.accountsData).length} 个账号替换当前全部账号、账号昵称和 UI 偏好。`,
            `导入后当前账号: ${backup.accountMeta[backup.activeAccountId].label}`,
            ''
        ];

        getAccountIds(backup.accountsData).forEach(id => {
            lines.push(`${backup.accountMeta[id].label}: ${backup.accountsData[id].length} 名干员`);
        });
        lines.push('');
        lines.push('确认继续导入？');
        return lines.join('\n');
    }

    function applyAccountsBackup(backup) {
        const nextState = createAccountState(backup);
        const preferences = normalizeBackupPreferences(backup.preferences);
        const nextConfig = normalizeConfig({ ...preferences.config, ...preferences });
        commitAccountState(nextState);
        Object.assign(CONFIG, nextConfig);
        saveConfig();

        refreshAccountStateUi(true);
        syncPageScaffold();
        document.querySelectorAll(BP_SELECTORS.portal).forEach(enhancePopover);
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
