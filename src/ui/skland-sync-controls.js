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
            confirmText: create ? '设置口令并保存' : '解锁当前页面', cancelText: '取消'
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

    async function handleSklandStorageMode(mode) {
        const plaintext = mode === 'plaintext';
        const confirmed = await showPrtsConfirm({
            title: plaintext ? '免口令保存凭据：更高风险' : '保存森空岛登录凭据的风险',
            message: [
                '登录凭据（cred，也常被称为 token）能用来访问你的森空岛账号。凭据泄露后，别人可能读取你的账号和游戏资料，或执行这份凭据允许的其他操作。',
                plaintext
                    ? '免口令模式会把凭据以明文保存在油猴脚本存储中，刷新或新开页面都不用解锁。如果有人读取了脚本存储、油猴备份或同步数据，就可能直接拿到并使用凭据，风险比口令加密更高。请勿在共用或不可信的设备上使用。即使以后切回加密模式，旧备份中的明文也不会被清除。'
                    : '凭据会用独立口令加密，再存入油猴脚本存储。脚本不会保存口令或解密密钥，每次打开页面都需解锁一次；已有明文凭据会在设置口令后一起加密。加密无法防止凭据在解锁期间被窃取，也无法防范被入侵的设备或恶意扩展；弱口令仍可能被破解。请勿在共用或不可信的设备上开启。',
                '凭据不会写入本项目的配置备份，也不会上传到本项目服务器。脚本只用它向森空岛官方接口读取角色、干员和练度。',
                `首次开启本功能时，默认也会开启自动刷新，你可以单独关闭。每个账号每 24 小时最多自动刷新一次，只在 PRTS Plus 页面可见${plaintext ? '' : '且已解锁'}时运行，也可手动刷新。脚本通过非官方方式接入，接口或平台规则变化可能让功能失效，也可能遇到访问限制或账号异常。`,
                '切换保存方式会保留账号关联和刷新时间。关闭功能会清除脚本保存的全部凭据，停止后续刷新，但会保留已导入的干员数据。清除本地凭据不会撤销登录。如果怀疑凭据泄露，请通过森空岛官方渠道处理账号安全问题。'
            ].join('\n\n'),
            acknowledgement: plaintext
                ? '我理解明文保存的更高风险，同意免口令保存登录凭据。'
                : '我已阅读并理解上述风险，同意在此浏览器加密保存登录凭据。',
            confirmText: plaintext ? '同意风险并免口令保存' : '同意风险并继续', cancelText: '取消', tone: 'danger'
        });
        if (!confirmed) return;
        try {
            const store = readSklandSyncStore();
            if (isSklandSyncEnabled(store) && !canUseSklandSavedCredentials(store)) {
                await handleSklandVaultUnlock();
                if (!canUseSklandSavedCredentials()) return;
            }
            if (!plaintext) requireSklandWebCrypto();
            const passphrase = plaintext ? null : await requestSklandVaultPassphrase(true);
            if (!plaintext && passphrase === null) return;
            await setSklandSyncEnabled(true, passphrase, mode);
        } catch (_error) {
            showPrtsToast('设置未保存', 'error', '无法转换凭据或写入脚本存储，原设置已保留。请检查口令、浏览器加密支持及扩展权限后重试。');
        } finally {
            refreshSklandSyncControls();
        }
    }

    let sklandSyncControlsCount = 0;

    function createSklandSyncControls({ showHeading = true } = {}) {
        const section = document.createElement('section');
        section.className = 'prts-skland-sync';
        section.setAttribute('aria-label', '森空岛快捷刷新');
        if (showHeading) {
            const heading = document.createElement('h3');
            heading.textContent = '森空岛快捷刷新';
            section.appendChild(heading);
        }

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

        const modes = document.createElement('fieldset');
        modes.className = 'prts-skland-sync-modes';
        const legend = document.createElement('legend');
        legend.textContent = '凭据保存方式';
        modes.appendChild(legend);
        const modeName = `prts-skland-storage-mode-${++sklandSyncControlsCount}`;
        for (const [value, text] of [['encrypted', '口令加密（默认）'], ['plaintext', '免口令保存（高风险）']]) {
            const label = document.createElement('label');
            label.className = 'prts-skland-sync-option';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = modeName;
            radio.value = value;
            radio.className = 'prts-skland-sync-mode';
            radio.checked = value === 'encrypted';
            radio.onchange = async () => {
                if (!radio.checked || !isSklandSyncEnabled()) return;
                refreshSklandSyncControls();
                await handleSklandStorageMode(value);
            };
            label.appendChild(radio);
            label.appendChild(document.createTextNode(text));
            modes.appendChild(label);
        }
        section.appendChild(modes);

        const autoLabel = document.createElement('label');
        autoLabel.className = 'prts-skland-sync-option';
        const auto = document.createElement('input');
        auto.type = 'checkbox';
        auto.className = 'prts-skland-sync-auto';
        autoLabel.appendChild(auto);
        autoLabel.appendChild(document.createTextNode('自动刷新（每 24 小时）'));
        section.appendChild(autoLabel);
        const autoHint = document.createElement('p');
        autoHint.className = 'prts-skland-sync-hint prts-skland-sync-auto-hint';
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
            if (!canUseSklandSavedCredentials()) await handleSklandVaultUnlock();
            if (!canUseSklandSavedCredentials()) return;
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
            const mode = section.querySelector('.prts-skland-sync-mode:checked').value;
            refreshSklandSyncControls();
            if (enabled) {
                await handleSklandStorageMode(mode);
                return;
            }
            try { await setSklandSyncEnabled(false); }
            catch (_error) { showPrtsToast('设置未保存', 'error', '无法写入脚本存储，请重试。'); }
            refreshSklandSyncControls();
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
            section.querySelectorAll('.prts-skland-sync-mode').forEach(radio => {
                radio.checked = radio.value === store.mode;
                radio.disabled = sklandSyncRunning;
            });
            section.querySelector('.prts-skland-sync-auto-hint').textContent = store.mode === 'plaintext'
                ? '仅在 PRTS Plus 页面可见时检查，无需解锁；到期才刷新，失败后至少间隔 1 小时重试。'
                : '仅在当前页面已解锁且 PRTS Plus 页面可见时检查，到期才刷新；失败后至少间隔 1 小时重试。';
            const vaultStatus = section.querySelector('.prts-skland-vault-status');
            vaultStatus.textContent = store.consentVersion === 1
                ? '旧版凭据已暂停刷新。请阅读风险告示并选择保存方式以继续，或移除旧凭据。'
                : enabled ? store.mode === 'plaintext' ? '凭据以明文保存 · 无需解锁，风险较高'
                    : unlocked ? '凭据已加密 · 当前页面已解锁' : '凭据已加密 · 已锁定，自动刷新暂停'
                    : '默认使用口令加密。免口令模式会明文保存凭据，风险更高，需另外阅读告示并同意。';
            const vaultAction = section.querySelector('.prts-skland-vault-action');
            vaultAction.hidden = !enabled || store.mode === 'plaintext';
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
