    async function requestSklandVaultPassphrase(create = false) {
        const form = document.createElement('form');
        form.className = 'prts-skland-vault-form';
        const intro = document.createElement('p');
        intro.className = 'prts-skland-sync-hint';
        intro.textContent = create
            ? '设置至少 12 个字符的独立口令，请勿使用森空岛密码。口令不会保存；遗忘后需清除凭据并重新导入。'
            : '输入加密口令，仅解锁当前页面。刷新或关闭页面后需重新解锁。';
        form.appendChild(intro);
        const fields = [];
        for (const labelText of create ? ['加密口令', '再次输入口令'] : ['加密口令']) {
            const label = document.createElement('label');
            label.className = 'prts-modal-field';
            const text = document.createElement('span');
            text.className = 'prts-modal-field-label';
            text.textContent = labelText;
            const input = document.createElement('input');
            input.type = 'password';
            input.className = 'prts-modal-input';
            input.autocomplete = create ? 'new-password' : 'current-password';
            input.minLength = 12;
            input.maxLength = 256;
            input.required = true;
            label.appendChild(text);
            label.appendChild(input);
            form.appendChild(label);
            fields.push(input);
        }
        const hint = document.createElement('p');
        hint.className = 'prts-skland-sync-hint';
        hint.setAttribute('role', 'status');
        form.appendChild(hint);
        const pending = showPrtsModal({
            title: create ? '设置凭据加密口令' : '解锁森空岛凭据', message: form,
            confirmText: create ? '设置口令并开启' : '解锁当前页面', cancelText: '取消'
        });
        const confirm = document.querySelector('#prts-modal .primary');
        const validate = () => {
            const validLength = fields[0].value.length >= 12;
            const matches = !create || fields[0].value === fields[1].value;
            confirm.disabled = !validLength || !matches;
            hint.textContent = create && fields[1].value && !matches ? '两次输入的口令不一致。' : '';
        };
        fields.forEach(input => { input.oninput = validate; });
        form.onsubmit = event => { event.preventDefault(); if (!confirm.disabled) confirm.click(); };
        validate();
        window.setTimeout(() => fields[0].focus(), 0);
        const confirmed = await pending;
        const passphrase = confirmed === true ? fields[0].value : null;
        fields.forEach(input => { input.value = ''; });
        return passphrase;
    }

    async function handleSklandVaultUnlock() {
        const passphrase = await requestSklandVaultPassphrase();
        if (passphrase === null) return;
        try {
            await unlockSklandVault(passphrase);
        } catch (_error) {
            showPrtsToast('未能解锁凭据', 'error', '口令错误、浏览器不支持加密或数据已损坏。请重试；遗忘口令需关闭功能后重新导入。');
        }
        refreshSklandSyncControls();
    }

    function createSklandSyncControls() {
        const section = document.createElement('section');
        section.className = 'prts-skland-sync';
        section.setAttribute('aria-label', '森空岛快捷刷新');
        const heading = document.createElement('h3');
        heading.textContent = '森空岛快捷刷新';
        section.appendChild(heading);

        const toggleLabel = document.createElement('label');
        toggleLabel.className = 'prts-skland-sync-option';
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.className = 'prts-skland-sync-enabled';
        toggleLabel.appendChild(toggle);
        toggleLabel.appendChild(document.createTextNode('保存登录凭据（风险可选）'));
        section.appendChild(toggleLabel);
        const hint = document.createElement('p');
        hint.className = 'prts-skland-sync-hint';
        hint.textContent = '开启后，逐个登录森空岛并读取导入一次，即可在这里刷新全部已保存账号。关闭会清除全部凭据。';
        section.appendChild(hint);

        const autoLabel = document.createElement('label');
        autoLabel.className = 'prts-skland-sync-option';
        const auto = document.createElement('input');
        auto.type = 'checkbox';
        auto.className = 'prts-skland-sync-auto';
        autoLabel.appendChild(auto);
        autoLabel.appendChild(document.createTextNode('自动刷新（每 24 小时）'));
        section.appendChild(autoLabel);
        const autoHint = document.createElement('p');
        autoHint.className = 'prts-skland-sync-hint';
        autoHint.textContent = '仅在当前页面已解锁且 PRTS Plus 页面可见时检查，到期才刷新；失败后至少间隔 1 小时重试。';
        section.appendChild(autoHint);

        const vaultStatus = document.createElement('p');
        vaultStatus.className = 'prts-skland-sync-hint prts-skland-vault-status';
        vaultStatus.setAttribute('role', 'status');
        section.appendChild(vaultStatus);
        const vaultAction = createPrtsButton({ text: '解锁凭据', onClick: async () => {
            if (isSklandVaultUnlocked()) { lockSklandVault(); refreshSklandSyncControls(); }
            else await handleSklandVaultUnlock();
        } });
        vaultAction.classList.add('prts-skland-vault-action');
        section.appendChild(vaultAction);
        const refresh = createPrtsButton({ text: '刷新全部已保存账号', icon: 'reload', onClick: async () => {
            if (!isSklandVaultUnlocked()) await handleSklandVaultUnlock();
            if (!isSklandVaultUnlocked()) return;
            try { await refreshSavedSklandAccounts(); }
            catch (_error) { showPrtsToast('森空岛刷新未完成', 'error', '无法保存刷新状态，请检查脚本存储后重试。'); }
        } });
        refresh.classList.add('prts-skland-sync-refresh');
        section.appendChild(refresh);
        const list = document.createElement('div');
        list.className = 'prts-skland-sync-list';
        list.setAttribute('role', 'status');
        list.setAttribute('aria-live', 'polite');
        section.appendChild(list);

        toggle.onchange = async () => {
            const enabled = toggle.checked;
            toggle.checked = isSklandSyncEnabled();
            if (enabled) {
                const confirmed = await showPrtsConfirm({
                    title: '保存森空岛登录凭据的风险',
                    message: [
                        '登录凭据（cred，常称 token）可用于访问你的森空岛账号。泄露后，他人可能读取账号和游戏资料，或执行该凭据权限内的其他操作。',
                        '凭据使用独立口令加密后保存在油猴脚本存储中，口令和解密密钥不落盘，不进入本项目配置备份或上传至本项目服务器。每次打开页面需解锁一次；旧版明文凭据会在设置口令后加密迁移。加密不能保护正在解锁的页面、被入侵的设备或恶意扩展，弱口令也可能被破解。请勿在共用或不可信设备上开启。',
                        '脚本使用保存的凭据向森空岛官方接口读取角色、干员和练度。开启本功能后默认启用自动刷新，可单独关闭。每个账号最多每 24 小时自动刷新一次，仅在当前页面已解锁且 PRTS Plus 页面可见时运行；也可随时手动刷新。非官方接入可能因接口或平台规则变化而失效，并存在访问限制或账号异常的风险。',
                        '关闭此功能会清除脚本保存的全部凭据并停止后续刷新，已导入的干员数据会保留。清除本地凭据不等于撤销登录；如怀疑泄露，请通过森空岛官方渠道处理账号安全。'
                    ].join('\n\n'),
                    acknowledgement: '我已阅读并理解上述风险，同意在此浏览器保存登录凭据。',
                    confirmText: '同意风险并开启', cancelText: '暂不开启', tone: 'danger'
                });
                if (!confirmed) return;
            }
            try {
                if (enabled) requireSklandWebCrypto();
                const passphrase = enabled ? await requestSklandVaultPassphrase(true) : null;
                if (enabled && passphrase === null) return;
                await setSklandSyncEnabled(enabled, passphrase);
                refreshSklandSyncControls();
            } catch (_error) {
                showPrtsToast('设置未保存', 'error', '无法启用加密或写入脚本存储，请检查浏览器支持及扩展权限后重试。');
                refreshSklandSyncControls();
            }
        };
        auto.onchange = () => {
            try {
                const store = readSklandSyncStore();
                if (!isSklandSyncEnabled(store)) return;
                store.autoRefresh = auto.checked;
                writeSklandSyncStore(store);
            } catch (_error) { showPrtsToast('设置未保存', 'error', '无法写入脚本存储，请重试。'); }
            refreshSklandSyncControls();
        };
        return section;
    }

    function refreshSklandSyncControls() {
        const store = readSklandSyncStore();
        const enabled = isSklandSyncEnabled(store);
        const unlocked = isSklandVaultUnlocked(store);
        const state = resolveStoredAccountState(readAccountStorageSnapshot()).state;
        const ids = getAccountIds(state.accountsData).filter(id => store.accounts[id]);
        document.querySelectorAll('.prts-skland-sync').forEach(section => {
            const toggle = section.querySelector('.prts-skland-sync-enabled');
            toggle.checked = enabled;
            const vaultStatus = section.querySelector('.prts-skland-vault-status');
            vaultStatus.textContent = store.consentVersion === 1
                ? '旧版凭据尚未加密，已暂停刷新。请开启并设置加密口令以迁移，或移除旧凭据。'
                : enabled ? unlocked ? '凭据已加密 · 当前页面已解锁' : '凭据已加密 · 已锁定，自动刷新暂停'
                    : '口令和解密密钥不会保存到浏览器。';
            const vaultAction = section.querySelector('.prts-skland-vault-action');
            vaultAction.hidden = !enabled;
            vaultAction.querySelector('.bp4-button-text').textContent = unlocked ? '立即锁定' : '解锁凭据';
            const auto = section.querySelector('.prts-skland-sync-auto');
            auto.checked = store.autoRefresh;
            auto.disabled = !enabled;
            const refresh = section.querySelector('.prts-skland-sync-refresh');
            refresh.disabled = !enabled || !ids.length || sklandSyncRunning;
            refresh.querySelector('.bp4-button-text').textContent = sklandSyncRunning ? '正在刷新…' : '刷新全部已保存账号';
            const list = section.querySelector('.prts-skland-sync-list');
            list.replaceChildren();
            if (!ids.length) {
                list.textContent = enabled ? '尚未保存账号，请前往森空岛登录并读取导入。' : '未开启，登录凭据不会保存。';
                return;
            }
            ids.forEach(id => {
                const entry = store.accounts[id];
                const row = document.createElement('div');
                row.className = 'prts-skland-sync-account';
                const text = document.createElement('span');
                const status = { expired: '登录已失效，请重新登录并导入', failed: '刷新失败，可手动重试', review: '有覆盖变化，待手动确认' }[entry.status];
                text.textContent = `${state.accountMeta[id].label} · ${status || '已保存'}\n上次刷新：${entry.lastSuccessAt ? new Date(entry.lastSuccessAt).toLocaleString() : '尚未刷新'}`;
                row.appendChild(text);
                const remove = createPrtsButton({ text: '移除凭据', ariaLabel: `移除 ${state.accountMeta[id].label} 的登录凭据`, onClick: () => {
                    try { clearSklandSavedAccounts(id); }
                    catch (_error) { showPrtsToast('移除凭据失败', 'error', '无法写入脚本存储，请重试。'); }
                    refreshSklandSyncControls();
                } });
                row.appendChild(remove);
                list.appendChild(row);
            });
        });
    }
