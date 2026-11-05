    const SKLAND_VAULT_VERSION = 1;
    const SKLAND_VAULT_CHECK = 'Better-PRTS-Plus Skland vault';
    let sklandVaultSession = null;

    function sklandBytesToHex(value) {
        return Array.from(new Uint8Array(value), byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function sklandHexToBytes(value) {
        return Uint8Array.from(value.match(/../g), byte => parseInt(byte, 16));
    }

    function isSklandSealedValue(value) {
        return isPlainRecord(value) && typeof value.iv === 'string' && /^[a-f0-9]{24}$/.test(value.iv)
            && typeof value.ciphertext === 'string' && /^(?:[a-f0-9]{2}){16,2064}$/.test(value.ciphertext);
    }

    function normalizeSklandVault(value) {
        if (!isPlainRecord(value) || value.version !== SKLAND_VAULT_VERSION
            || typeof value.salt !== 'string' || !/^[a-f0-9]{32}$/.test(value.salt)
            || !isSklandSealedValue(value.check)) return null;
        return { version: SKLAND_VAULT_VERSION, salt: value.salt, check: { iv: value.check.iv, ciphertext: value.check.ciphertext } };
    }

    function requireSklandWebCrypto() {
        if (typeof crypto === 'undefined' || !crypto.subtle || typeof crypto.getRandomValues !== 'function') {
            throw new Error('当前浏览器不支持凭据加密，无法开启保存。请使用支持 Web Crypto 的浏览器。');
        }
    }

    async function deriveSklandVaultKey(passphrase, salt) {
        requireSklandWebCrypto();
        if (typeof passphrase !== 'string' || passphrase.length < 12 || passphrase.length > 256) {
            throw new Error('请使用 12～256 个字符的独立加密口令。');
        }
        const bytes = new TextEncoder().encode(passphrase);
        try {
            const material = await crypto.subtle.importKey('raw', bytes, 'PBKDF2', false, ['deriveKey']);
            return await crypto.subtle.deriveKey({
                name: 'PBKDF2', hash: 'SHA-256', salt: sklandHexToBytes(salt), iterations: 600000
            }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
        } finally {
            bytes.fill(0);
        }
    }

    async function sealSklandValue(key, text, context) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const bytes = new TextEncoder().encode(text);
        try {
            const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv,
                additionalData: new TextEncoder().encode(`Better-PRTS-Plus:skland:${context}`)
            }, key, bytes);
            return { iv: sklandBytesToHex(iv), ciphertext: sklandBytesToHex(ciphertext) };
        } finally {
            bytes.fill(0);
        }
    }

    async function openSklandValue(key, sealed, context) {
        let bytes;
        try {
            bytes = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: sklandHexToBytes(sealed.iv),
                additionalData: new TextEncoder().encode(`Better-PRTS-Plus:skland:${context}`)
            }, key, sklandHexToBytes(sealed.ciphertext)));
            return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        } catch (_error) {
            throw new Error('口令错误或加密数据已损坏，请重试；仍失败时可关闭功能后重新导入。');
        } finally {
            bytes?.fill(0);
        }
    }

    function isSklandVaultUnlocked(store = readSklandSyncStore()) {
        return isSklandSyncEnabled(store) && store.mode === 'encrypted' && Boolean(sklandVaultSession)
            && sklandVaultSession.salt === store.vault.salt;
    }

    function lockSklandVault() {
        sklandVaultSession = null;
    }

    async function unlockSklandVault(passphrase) {
        const store = readSklandSyncStore();
        if (!isSklandSyncEnabled(store) || store.mode !== 'encrypted') throw new Error('请先开启口令加密保存。');
        const key = await deriveSklandVaultKey(passphrase, store.vault.salt);
        const check = await openSklandValue(key, store.vault.check, 'check');
        if (check !== SKLAND_VAULT_CHECK) throw new Error('加密数据校验失败，请重新设置。');
        if (JSON.stringify(readSklandSyncStore().vault) !== JSON.stringify(store.vault)) {
            throw new Error('凭据设置已更改，请重试。');
        }
        sklandVaultSession = { key, salt: store.vault.salt };
    }

    async function decryptSklandCredential(accountId, entry) {
        const store = readSklandSyncStore();
        if (!isSklandVaultUnlocked(store)) throw new Error('凭据已锁定，请先解锁。');
        const credential = await openSklandValue(sklandVaultSession.key, entry.sealedCredential, `${accountId}:${entry.uid}`);
        if (!/^[A-Za-z0-9._-]{12,2048}$/.test(credential)) throw new Error('保存的凭据格式无效，请重新导入。');
        return credential;
    }
