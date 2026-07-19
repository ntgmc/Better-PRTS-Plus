    // =========================================================================
    //                       MODULE 2: 账户状态与迁移
    // =========================================================================

    function createAccountState(value = {}) {
        const source = isPlainRecord(value) ? value : {};
        const state = {
            activeAccountId: normalizeAccountId(source.activeAccountId),
            accountsData: normalizeAccountsData(source.accountsData),
            accountMeta: normalizeAccountMeta(source.accountMeta)
        };
        return state;
    }

    function serializeAccountState(value) {
        const state = createAccountState(value);
        return JSON.stringify({
            activeAccountId: state.activeAccountId,
            accountsData: state.accountsData,
            accountMeta: state.accountMeta
        });
    }

    function parseLegacyOperatorStore(rawValue, diagnostics, source) {
        if (!rawValue) return [];
        try {
            const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
            if (!Array.isArray(parsed)) {
                diagnostics.push({ code: 'invalid-legacy-store', source });
                return [];
            }
            const names = parsed.length > 0 && typeof parsed[0] === 'object'
                ? parsed.filter(op => isOwnedOperatorRecord(op) && op.name).map(op => op.name)
                : parsed;
            return sanitizeOperatorNames(names);
        } catch (_error) {
            diagnostics.push({ code: 'invalid-legacy-json', source });
            return [];
        }
    }

    function applyLegacySklandSummary(state, rawSummary) {
        const summary = normalizeSklandImportSummary(
            typeof rawSummary === 'string' ? safeJsonParse(rawSummary, null) : rawSummary
        );
        if (!summary) return { state, migrated: false };

        const accountId = normalizeAccountId(summary.accountId);
        if (state.accountMeta[accountId]?.skland) return { state, migrated: false };

        const nextMeta = normalizeAccountMeta(state.accountMeta);
        nextMeta[accountId] = {
            ...nextMeta[accountId],
            skland: normalizeSklandSyncMeta(summary)
        };
        return {
            state: createAccountState({ ...state, accountMeta: nextMeta }),
            migrated: true
        };
    }

    function resolveStoredAccountState(snapshot = {}) {
        const source = isPlainRecord(snapshot) ? snapshot : {};
        const diagnostics = [];
        let state = createAccountState();
        let migrated = false;

        if (source.unifiedStore) {
            try {
                const parsed = typeof source.unifiedStore === 'string'
                    ? JSON.parse(source.unifiedStore)
                    : source.unifiedStore;
                state = createAccountState(parsed);
                if (!parsed?.accountMeta) migrated = true;
            } catch (_error) {
                diagnostics.push({ code: 'invalid-unified-store', source: ACCOUNTS_DATA_KEY });
            }
        } else {
            const legacyAccounts = isPlainRecord(source.legacyAccounts) ? source.legacyAccounts : {};
            const accounts = createEmptyAccountsData();
            ACCOUNT_IDS.forEach(id => {
                const rawValue = legacyAccounts[id];
                if (!rawValue) return;
                accounts[id] = parseLegacyOperatorStore(rawValue, diagnostics, `account-${id}`);
                migrated = true;
            });

            if (accounts[1].length === 0 && source.veryOldStore) {
                accounts[1] = parseLegacyOperatorStore(source.veryOldStore, diagnostics, 'single-account');
                migrated = true;
            }

            state = createAccountState({
                activeAccountId: source.legacyActiveAccountId,
                accountsData: accounts,
                accountMeta: createDefaultAccountMeta()
            });
        }

        const sklandMigration = applyLegacySklandSummary(state, source.legacySklandSummary);
        state = sklandMigration.state;
        migrated = migrated || sklandMigration.migrated;
        if (sklandMigration.migrated) {
            diagnostics.push({ code: 'migrated-skland-summary', source: SKLAND_LAST_IMPORT_KEY });
        }

        return { state, migrated, diagnostics };
    }

    function createAccountSwitchState(state, accountId) {
        return createAccountState({ ...createAccountState(state), activeAccountId: accountId });
    }

    function createRenamedAccountState(state, accountId, rawLabel) {
        const currentState = createAccountState(state);
        const id = normalizeAccountId(accountId);
        const cleaned = stringValue(rawLabel).replace(/[\x00-\x1F\x7F]/g, '').trim();
        const currentMeta = currentState.accountMeta[id] || {};
        currentState.accountMeta[id] = {
            label: normalizeAccountLabel(cleaned, id),
            labelSource: cleaned ? 'manual' : 'default',
            ...(currentMeta.skland ? { skland: currentMeta.skland } : {})
        };
        return createAccountState(currentState);
    }

    function createSklandImportState(state, { accountId, names, binding, importedAt } = {}) {
        const currentState = createAccountState(state);
        const targetAccountId = normalizeAccountId(accountId);
        const operatorNames = sanitizeOperatorNames(names);
        if (operatorNames.length === 0) throw new Error('森空岛返回的干员数据为空。');

        const uid = normalizeSklandSyncText(binding?.uid);
        if (!uid) throw new Error('选择的森空岛角色无效，请重试。');
        const nickname = normalizeSklandSyncText(binding?.nickname ?? uid) || uid;
        const normalizedImportedAt = new Date(importedAt).toISOString();
        const currentMeta = currentState.accountMeta[targetAccountId] || {};
        const nextLabel = currentMeta.labelSource === 'manual'
            ? currentMeta.label
            : normalizeAccountLabel(nickname, targetAccountId);
        const nextLabelSource = currentMeta.labelSource === 'manual'
            ? 'manual'
            : (nextLabel === getDefaultAccountLabel(targetAccountId) ? 'default' : 'skland');
        const skland = normalizeSklandSyncMeta({
            uid,
            nickname,
            importedAt: normalizedImportedAt,
            operatorCount: operatorNames.length
        });

        currentState.activeAccountId = targetAccountId;
        currentState.accountsData[targetAccountId] = operatorNames;
        currentState.accountMeta[targetAccountId] = {
            ...currentMeta,
            label: nextLabel,
            labelSource: nextLabelSource,
            skland
        };

        const nextState = createAccountState(currentState);
        return {
            state: nextState,
            summary: {
                accountId: targetAccountId,
                accountLabel: nextState.accountMeta[targetAccountId].label,
                operatorCount: operatorNames.length,
                nickname: skland.nickname,
                uid: skland.uid,
                importedAt: skland.importedAt
            }
        };
    }
