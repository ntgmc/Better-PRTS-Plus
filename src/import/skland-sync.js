    const SKLAND_SYNC_KEY = 'prts_plus_skland_sync';
    const SKLAND_SYNC_CONSENT_VERSION = 2;
    const SKLAND_AUTO_REFRESH_MS = 24 * 60 * 60 * 1000;
    const SKLAND_RETRY_MS = 60 * 60 * 1000;
    let sklandSyncRunning = false;

    function readSklandSyncStore() {
        const raw = GM_getValue(SKLAND_SYNC_KEY);
        const value = typeof raw === 'string' ? safeJsonParse(raw, null) : raw;
        const store = { consentVersion: 0, autoRefresh: false, vault: null, accounts: {} };
        if (!isPlainRecord(value) || ![1, SKLAND_SYNC_CONSENT_VERSION].includes(value.consentVersion)) return store;
        store.consentVersion = value.consentVersion;
        store.vault = normalizeSklandVault(value.vault);
        store.autoRefresh = value.autoRefresh === true;
        for (const [id, entry] of Object.entries(isPlainRecord(value.accounts) ? value.accounts : {})) {
            if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) || !isPlainRecord(entry)) continue;
            const legacy = store.consentVersion === 1;
            if (legacy ? typeof entry.credential !== 'string' || !/^[A-Za-z0-9._-]{12,2048}$/.test(entry.credential)
                : !isSklandSealedValue(entry.sealedCredential)) continue;
            const uid = normalizeSklandSyncText(entry.uid);
            if (!uid) continue;
            store.accounts[id] = {
                ...(legacy ? { credential: entry.credential } : { sealedCredential: {
                    iv: entry.sealedCredential.iv, ciphertext: entry.sealedCredential.ciphertext
                } }), uid,
                lastAttemptAt: Number.isFinite(entry.lastAttemptAt) && entry.lastAttemptAt > 0 ? entry.lastAttemptAt : 0,
                lastSuccessAt: Number.isFinite(entry.lastSuccessAt) && entry.lastSuccessAt > 0 ? entry.lastSuccessAt : 0,
                status: ['expired', 'failed', 'review'].includes(entry.status) ? entry.status : ''
            };
        }
        return store;
    }

    function writeSklandSyncStore(store) {
        GM_setValue(SKLAND_SYNC_KEY, JSON.stringify(store));
    }

    function isSklandSyncEnabled(store = readSklandSyncStore()) {
        return store.consentVersion === SKLAND_SYNC_CONSENT_VERSION && Boolean(store.vault);
    }

    async function setSklandSyncEnabled(enabled, passphrase) {
        if (!enabled) {
            writeSklandSyncStore({ consentVersion: 0, autoRefresh: false, vault: null, accounts: {} });
            lockSklandVault();
            return;
        }
        const previous = GM_getValue(SKLAND_SYNC_KEY);
        const legacy = readSklandSyncStore();
        requireSklandWebCrypto();
        const salt = sklandBytesToHex(crypto.getRandomValues(new Uint8Array(16)));
        const key = await deriveSklandVaultKey(passphrase, salt);
        const store = { consentVersion: SKLAND_SYNC_CONSENT_VERSION, autoRefresh: true, accounts: {},
            vault: { version: SKLAND_VAULT_VERSION, salt, check: await sealSklandValue(key, SKLAND_VAULT_CHECK, 'check') }
        };
        if (legacy.consentVersion === 1) {
            for (const [id, entry] of Object.entries(legacy.accounts)) {
                const { credential, ...metadata } = entry;
                store.accounts[id] = { ...metadata, sealedCredential: await sealSklandValue(key, credential, `${id}:${entry.uid}`) };
            }
            store.autoRefresh = legacy.autoRefresh;
        }
        if (GM_getValue(SKLAND_SYNC_KEY) !== previous) throw new Error('凭据设置已更改，请重试。');
        writeSklandSyncStore(store);
        sklandVaultSession = { key, salt };
    }

    function clearSklandSavedAccounts(accountId = null) {
        const store = readSklandSyncStore();
        if (accountId === null) store.accounts = {};
        else delete store.accounts[accountId];
        writeSklandSyncStore(store);
    }

    async function saveSklandCredentialForAccount(summary, credential) {
        const store = readSklandSyncStore();
        if (!isSklandSyncEnabled(store)) return;
        if (typeof credential !== 'string' || !/^[A-Za-z0-9._-]{12,2048}$/.test(credential)) {
            throw new Error('登录凭据格式不支持保存，请重新登录森空岛后重试。');
        }
        if (!isSklandVaultUnlocked(store)) throw new Error('凭据已锁定，请解锁后重新导入以保存凭据。');
        const sealedCredential = await sealSklandValue(sklandVaultSession.key, credential, `${summary.accountId}:${summary.uid}`);
        const latest = readSklandSyncStore();
        if (!isSklandVaultUnlocked(latest) || latest.vault.salt !== store.vault.salt) {
            throw new Error('凭据设置已更改，请重试。');
        }
        const state = resolveStoredAccountState(readAccountStorageSnapshot()).state;
        requireAccount(state, summary.accountId);
        if (state.accountMeta[summary.accountId]?.skland?.uid !== summary.uid) throw new Error('账号角色已更改，请重试。');
        const now = Date.now();
        latest.accounts[summary.accountId] = {
            sealedCredential, uid: summary.uid, lastAttemptAt: now, lastSuccessAt: now, status: ''
        };
        writeSklandSyncStore(latest);
    }

    function isSklandAccountRefreshDue(entry, now = Date.now()) {
        return entry.status !== 'expired' && entry.status !== 'review'
            && now - entry.lastSuccessAt >= SKLAND_AUTO_REFRESH_MS
            && now - entry.lastAttemptAt >= SKLAND_RETRY_MS;
    }

    function requireSavedSklandAccount(accountId, expected) {
        const store = readSklandSyncStore();
        const entry = store.accounts[accountId];
        if (!isSklandVaultUnlocked(store) || !entry || JSON.stringify(entry.sealedCredential) !== JSON.stringify(expected.sealedCredential) || entry.uid !== expected.uid) {
            throw new Error('保存的凭据已移除或更改，本次刷新已停止。');
        }
        const state = resolveStoredAccountState(readAccountStorageSnapshot()).state;
        requireAccount(state, accountId);
        if (state.accountMeta[accountId]?.skland?.uid !== entry.uid) {
            throw new Error('账号对应的角色已更改，请在森空岛重新读取并导入此账号。');
        }
        return state;
    }

    async function refreshSavedSklandAccount(accountId, entry, automatic) {
        requireSavedSklandAccount(accountId, entry);
        const credential = await decryptSklandCredential(accountId, entry);
        requireSavedSklandAccount(accountId, entry);
        const refreshed = await refreshSklandToken(credential);
        requireSavedSklandAccount(accountId, entry);
        const options = await getSklandArknightsBindingOptions(credential, refreshed.token, refreshed.timestamp);
        const binding = options.bindings.find(option => option.uid === entry.uid);
        if (!binding) throw new Error('原角色已解除绑定，请在森空岛重新读取并导入此账号。');
        requireSavedSklandAccount(accountId, entry);
        const player = await getSklandGamePlayerInfo(credential, refreshed.token, refreshed.timestamp, binding.uid);
        requireSavedSklandAccount(accountId, entry);
        const cultivate = await getSklandGameCultivateInfo(credential, refreshed.token, refreshed.timestamp, binding.uid);
        const names = convertSklandPlayerInfoToNames(player);
        const training = convertSklandPlayerInfoToTraining(player, cultivate);
        while (true) {
            const state = requireSavedSklandAccount(accountId, entry);
            const diff = getOperatorImportDiff(state.accountsData[accountId], names, state.accountsTraining[accountId], training);
            if (diff.removed || diff.decreasedTrainingNames.length || diff.clearedTrainingNames.length) {
                if (automatic) return 'review';
                const confirmed = await confirmOperatorImport(accountId, names, training,
                    `森空岛 · ${binding.nickname} / UID ${maskSklandUid(binding.uid)}`);
                if (!confirmed) return 'review';
                const latest = requireSavedSklandAccount(accountId, entry);
                if (['accountsData', 'accountsTraining', 'accountMeta'].some(key =>
                    JSON.stringify(confirmed[key][accountId]) !== JSON.stringify(latest[key][accountId]))) continue;
            }
            commitSklandImport({ accountId, names, training, binding, importedAt: new Date().toISOString() }, { preserveActiveAccount: true });
            return '';
        }
    }

    async function refreshSavedSklandAccounts(automatic = false) {
        if (sklandSyncRunning || (automatic && document.visibilityState !== 'visible')) return;
        const run = async () => {
            const store = readSklandSyncStore();
            if (!isSklandVaultUnlocked(store) || (automatic && !store.autoRefresh)) return;
            const state = resolveStoredAccountState(readAccountStorageSnapshot()).state;
            const ids = getAccountIds(state.accountsData).filter(id => store.accounts[id]
                && (!automatic || isSklandAccountRefreshDue(store.accounts[id])));
            if (!ids.length) return;
            sklandSyncRunning = true;
            const results = [];
            try {
                refreshSklandSyncControls();
                for (const id of ids) {
                    const latest = readSklandSyncStore();
                    if (!isSklandVaultUnlocked(latest) || (automatic && (!latest.autoRefresh || document.visibilityState !== 'visible'))) break;
                    const entry = latest.accounts[id];
                    if (!entry || (automatic && !isSklandAccountRefreshDue(entry))) continue;
                    const label = resolveStoredAccountState(readAccountStorageSnapshot()).state.accountMeta[id]?.label || `账号 ${id}`;
                    latest.accounts[id].lastAttemptAt = Date.now();
                    writeSklandSyncStore(latest);
                    let status = 'failed';
                    try {
                        status = await refreshSavedSklandAccount(id, entry, automatic);
                        results.push(`${label}：${status === 'review' ? '待手动确认，已保留原数据' : '已刷新'}`);
                    } catch (error) {
                        if (error?.code === 'SKLAND_AUTH_EXPIRED') status = 'expired';
                        results.push(`${label}：${status === 'expired' ? '登录已失效，请重新登录并导入' : '刷新失败，已保留原数据，请稍后重试或重新导入'}`);
                    }
                    const current = readSklandSyncStore();
                    const saved = current.accounts[id];
                    if (saved && JSON.stringify(saved.sealedCredential) === JSON.stringify(entry.sealedCredential) && saved.uid === entry.uid) {
                        saved.status = status;
                        if (!status) saved.lastSuccessAt = Date.now();
                        writeSklandSyncStore(current);
                    }
                    refreshSklandSyncControls();
                }
            } finally {
                sklandSyncRunning = false;
                if (isSklandHost()) refreshAccountControls();
                else refreshAccountStateUi(true);
                refreshSklandSyncControls();
            }
            if (results.length && !automatic) showPrtsToast('森空岛批量刷新完成',
                results.every(line => line.endsWith('已刷新')) ? 'success' : 'warning', results.join('\n'), 10000);
        };
        if (typeof navigator !== 'undefined' && navigator.locks?.request) {
            return navigator.locks.request('better-prts-skland-sync', { ifAvailable: true }, lock => {
                if (lock) return run();
                if (!automatic) showPrtsToast('其他页面正在刷新森空岛数据', 'info', '请等待刷新完成后重试。');
            });
        }
        return run();
    }

    function startSklandAutoRefresh() {
        if (!isPrtsHost()) return;
        const check = () => refreshSavedSklandAccounts(true).catch(() => {
            // 存储失败时不继续请求，也不输出可能含凭据的异常。
            showPrtsToast('森空岛自动刷新未完成', 'warning', '无法保存刷新状态，请检查脚本存储后手动重试。');
        });
        document.addEventListener('visibilitychange', check);
        window.setInterval(check, 60 * 1000);
        check();
    }

    function registerSklandSyncChangeListener() {
        window.addEventListener('pagehide', () => { lockSklandVault(); refreshSklandSyncControls(); });
        if (typeof GM_addValueChangeListener !== 'function') return;
        GM_addValueChangeListener(SKLAND_SYNC_KEY, (_name, _oldValue, _newValue, remote) => {
            if (remote) {
                if (!isSklandVaultUnlocked()) lockSklandVault();
                refreshSklandSyncControls();
            }
        });
    }
