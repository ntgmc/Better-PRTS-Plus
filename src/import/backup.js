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
            throw new Error('这看起来是单个账号的干员名单，请使用“导入干员数据”。');
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
            `将用备份中的 ${getAccountIds(backup.accountsData).length} 个账号覆盖当前全部账号、账号昵称和脚本设置。`,
            `导入后将切换到：${backup.accountMeta[backup.activeAccountId].label}`,
            ''
        ];

        getAccountIds(backup.accountsData).forEach(id => {
            lines.push(`${backup.accountMeta[id].label}：${backup.accountsData[id].length} 名干员`);
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
                    showPrtsToast('全部配置导入成功', 'success', `已切换到 ${getAccountLabel(activeAccountId)}。`);
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
