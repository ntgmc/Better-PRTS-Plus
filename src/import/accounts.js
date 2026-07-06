    // =========================================================================
    //                            MODULE 4: 数据存取与账号管理
    // =========================================================================

    /**
     * 持久化保存所有多账号数据
     */
    function saveAccountsData() {
        activeAccountId = normalizeAccountId(activeAccountId);
        accountsData = normalizeAccountsData(accountsData);
        accountMeta = normalizeAccountMeta(accountMeta);
        GM_setValue(ACCOUNTS_DATA_KEY, JSON.stringify({
            activeAccountId,
            accountsData,
            accountMeta
        }));
    }

    /**
     * 加载干员数据：具备高级的向下兼容与数据迁移能力
     */
    function loadOwnedOps() {
        currentFilterMode = normalizeFilterMode(currentFilterMode);
        displayMode = normalizeDisplayMode(displayMode);
        accountMeta = createDefaultAccountMeta();
        // 尝试加载主存储集合
        const unifiedStore = GM_getValue(ACCOUNTS_DATA_KEY);
        let migrated = false;

        if (unifiedStore) {
            try {
                const parsed = JSON.parse(unifiedStore);
                activeAccountId = normalizeAccountId(parsed.activeAccountId);
                accountsData = normalizeAccountsData(parsed.accountsData);
                accountMeta = normalizeAccountMeta(parsed.accountMeta);
                if (!parsed.accountMeta) migrated = true;
            } catch (e) {
                console.error('[Better PRTS] 主数据解析失败', e);
                activeAccountId = 1;
                accountsData = createEmptyAccountsData();
                accountMeta = createDefaultAccountMeta();
            }
        } else {
            // [迁移] 尝试从用户单独定义的 prts_plus_user_ops_N 中恢复
            for (let i = 1; i <= 3; i++) {
                const legacyVal = GM_getValue(`prts_plus_user_ops_${i}`);
                if (legacyVal) {
                    try { accountsData[i] = sanitizeOperatorNames(JSON.parse(legacyVal)); migrated = true; } catch(e){}
                }
            }
            const activeLegacy = GM_getValue('prts_plus_active_account');
            if (activeLegacy) activeAccountId = normalizeAccountId(activeLegacy);

            // [迁移] 尝试从最远古的单账号版本恢复到账号 1
            const veryOldVal = GM_getValue('prts_plus_user_ops');
            if (veryOldVal && accountsData[1].length === 0) {
                try {
                    let ops = JSON.parse(veryOldVal);
                    if (Array.isArray(ops)) {
                    if (ops.length > 0 && typeof ops[0] === 'object') {
                        ops = ops.filter(op => isOwnedOperatorRecord(op) && op.name).map(op => op.name);
                    }
                        accountsData[1] = sanitizeOperatorNames(ops);
                        migrated = true;
                    }
                } catch(e){}
            }
        }

        if (migrated) saveAccountsData(); // 如果发生了任何迁移，立即转储至新结构

        ownedOpsSet = new Set(accountsData[activeAccountId] || []);
        console.log(`[Better PRTS] 已加载账号 ${activeAccountId} 的 ${ownedOpsSet.size} 名持有干员`);
    }

    /**
     * 执行账号切换
     */
    function switchAccount(id) {
        id = normalizeAccountId(id);
        if (id === activeAccountId) return;

        activeAccountId = id;
        saveAccountsData(); // 记忆选中状态

        ownedOpsSet = new Set(accountsData[activeAccountId] ||[]);

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
            btn.title = `切换到 ${label}`;
            btn.classList.toggle('active', id === activeAccountId);
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

    function renameAccount(id) {
        const accountId = normalizeAccountId(id);
        const currentLabel = getAccountLabel(accountId);
        const rawLabel = window.prompt(`重命名账号 ${accountId}`, currentLabel);
        if (rawLabel === null) return;

        const cleaned = String(rawLabel).replace(/[\x00-\x1F\x7F]/g, '').trim();
        accountMeta = normalizeAccountMeta(accountMeta);
        accountMeta[accountId] = {
            label: normalizeAccountLabel(cleaned, accountId),
            labelSource: cleaned ? 'manual' : 'default'
        };
        saveAccountsData();
        refreshAccountStateUi();
    }

    function updateAccountLabelFromSkland(id, nickname) {
        const accountId = normalizeAccountId(id);
        const sklandLabel = normalizeAccountLabel(nickname, accountId);
        if (sklandLabel === getDefaultAccountLabel(accountId)) return;

        accountMeta = normalizeAccountMeta(accountMeta);
        if (accountMeta[accountId]?.labelSource === 'manual') return;

        accountMeta[accountId] = {
            label: sklandLabel,
            labelSource: 'skland'
        };
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
        activeAccountId = normalizeAccountId(activeAccountId);
        accountsData = normalizeAccountsData(accountsData);
        accountMeta = normalizeAccountMeta(accountMeta);

        return {
            type: ACCOUNT_BACKUP_TYPE,
            version: ACCOUNT_BACKUP_VERSION,
            exportedAt: new Date().toISOString(),
            activeAccountId,
            accountsData,
            accountMeta,
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
            alert(`✅ 已导出全部配置：${fileName}`);
        } catch (error) {
            console.error('[Better PRTS] 导出全部配置失败', error);
            alert('❌ 导出全部配置失败: ' + (error instanceof Error ? error.message : '未知错误'));
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
        activeAccountId = backup.activeAccountId;
        accountsData = normalizeAccountsData(backup.accountsData);
        accountMeta = normalizeAccountMeta(backup.accountMeta);
        currentFilterMode = normalizeFilterMode(backup.preferences.filterMode);
        displayMode = normalizeDisplayMode(backup.preferences.displayMode);
        CONFIG.visuals = backup.preferences.config.visuals === true;
        CONFIG.cleanLink = backup.preferences.config.cleanLink === true;
        CONFIG.hideSidebar = backup.preferences.config.hideSidebar === true;

        saveAccountsData();
        GM_setValue(FILTER_MODE_KEY, currentFilterMode);
        GM_setValue(DISPLAY_MODE_KEY, displayMode);
        saveConfig();
        GM_setValue('prts_float_pos', JSON.stringify(backup.preferences.floatingPosition));

        ownedOpsSet = new Set(accountsData[activeAccountId] || []);
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
                alert('❌ 配置文件过大，请选择 Better-PRTS-Plus 导出的备份文件');
                return;
            }

            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const parsed = safeJsonParse(event.target.result, null);
                    const backup = parseAccountsBackup(parsed);
                    if (!window.confirm(formatAccountsBackupSummary(backup))) return;

                    applyAccountsBackup(backup);
                    alert('✅ 全部配置导入成功');
                } catch (error) {
                    console.error('[Better PRTS] 导入全部配置失败', error);
                    alert('❌ 导入全部配置失败: ' + (error instanceof Error ? error.message : '未知错误'));
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

