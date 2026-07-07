const SKLAND_IMPORT_CANCELLED_CODE = 'SKLAND_IMPORT_CANCELLED';

function createSklandImportCancelledError() {
        const error = new Error('已取消森空岛角色选择。');
        error.code = SKLAND_IMPORT_CANCELLED_CODE;
        return error;
    }

    function isSklandImportCancelledError(error) {
        return Boolean(error && typeof error === 'object' && error.code === SKLAND_IMPORT_CANCELLED_CODE);
    }

    function readSklandCredentialFromStorage() {
        let raw = '';
        try {
            raw = window.localStorage.getItem('SK_OAUTH_CRED_KEY') || '';
        } catch (error) {
            throw new Error('无法读取森空岛网页存储，请确认浏览器允许脚本访问 localStorage。');
        }

        const candidates = [];
        const pushCandidate = value => {
            if (typeof value === 'string' && value.trim()) candidates.push(value.trim());
        };
        const pushJsonCandidates = text => {
            try {
                const parsed = JSON.parse(text);
                if (typeof parsed === 'string') pushCandidate(parsed);
                if (isPlainRecord(parsed)) {
                    pushCandidate(parsed.cred);
                    pushCandidate(parsed.value);
                }
            } catch (error) {
                // 不是 JSON 时按原始凭据继续处理。
            }
        };

        pushCandidate(raw);
        const decodedRaw = decodeSklandCredentialText(raw);
        pushCandidate(decodedRaw);
        pushJsonCandidates(raw);
        if (decodedRaw !== raw) pushJsonCandidates(decodedRaw);

        for (const candidate of candidates) {
            const normalized = normalizeSklandCredentialCandidate(candidate);
            if (normalized) return normalized;
        }
        throw new Error('未找到森空岛登录凭据，请先在当前森空岛页面完成登录。');
    }

    function decodeSklandCredentialText(value) {
        let decoded = String(value || '').trim();
        for (let i = 0; i < 2; i++) {
            try {
                const next = decodeURIComponent(decoded);
                if (next === decoded) break;
                decoded = next;
            } catch (error) {
                break;
            }
        }
        return decoded;
    }

    function normalizeSklandCredentialCandidate(value) {
        const candidate = decodeSklandCredentialText(value).replace(/^["']|["']$/g, '').trim();
        if (!candidate || candidate.length < 12) return null;
        if (candidate.includes('=') || candidate.includes(';')) return null;
        return candidate;
    }

    async function importSklandOperatorsToAccount(accountId, options = {}) {
        const targetAccountId = normalizeAccountId(accountId);
        const importOptions = isPlainRecord(options) ? options : {};
        const credential = readSklandCredentialFromStorage();
        const refreshed = await refreshSklandToken(credential);
        const bindingOptions = await getSklandArknightsBindingOptions(credential, refreshed.token, refreshed.timestamp);
        const binding = await resolveSklandImportBinding(targetAccountId, bindingOptions, importOptions);
        const playerInfo = await getSklandGamePlayerInfo(credential, refreshed.token, refreshed.timestamp, binding.uid);
        const names = convertSklandPlayerInfoToNames(playerInfo);
        const importedAt = new Date().toISOString();

        accountsData[targetAccountId] = names;
        activeAccountId = targetAccountId;
        updateAccountLabelFromSkland(targetAccountId, binding.nickname);
        const skland = updateAccountSklandSyncMeta(targetAccountId, {
            uid: binding.uid,
            nickname: binding.nickname,
            importedAt,
            operatorCount: names.length
        });
        saveAccountsData();
        ownedOpsSet = new Set(names);

        const summary = {
            accountId: targetAccountId,
            accountLabel: getAccountLabel(targetAccountId),
            operatorCount: skland?.operatorCount ?? names.length,
            nickname: skland?.nickname || binding.nickname,
            uid: skland?.uid || binding.uid,
            importedAt: skland?.importedAt || importedAt
        };
        GM_setValue(SKLAND_LAST_IMPORT_KEY, JSON.stringify(summary));
        return summary;
    }

    async function refreshSklandToken(credential) {
        const path = '/api/v1/auth/refresh';
        const timestamp = `${Math.floor(Date.now() / 1000)}`;
        const sign = await generateSklandSign('', path, '', timestamp);
        const data = await sklandRequestJson(`${SKLAND_BASE_URL}${path}`, {
            method: 'GET',
            headers: buildSklandHeaders(timestamp, sign, { cred: credential })
        });
        if (data.code !== 0 || data.message !== 'OK' || !isPlainRecord(data.data) || typeof data.data.token !== 'string') {
            throw new Error('森空岛登录凭据已失效，请刷新页面或重新登录森空岛。');
        }
        return {
            token: data.data.token,
            timestamp: stringValue(data.timestamp) || timestamp
        };
    }

    async function getSklandArknightsBindingOptions(credential, token, timestamp) {
        const data = await sklandSignedGet('/api/v1/game/player/binding', '', credential, token, timestamp);
        if (data.code !== 0 || data.message !== 'OK' || !isPlainRecord(data.data) || !Array.isArray(data.data.list)) {
            throw new Error('读取森空岛绑定角色失败，请稍后重试。');
        }

        const bindingOptions = getSklandArknightsBindingOptionsFromList(data.data.list);
        if (bindingOptions.bindings.length > 0) return bindingOptions;

        throw new Error('森空岛账号未找到已绑定的明日方舟角色。');
    }

    function getSklandArknightsBindingOptionsFromList(list) {
        if (!Array.isArray(list)) return { bindings: [], defaultUid: '' };

        let lastDefaultUid = '';
        for (const item of list) {
            if (!isPlainRecord(item) || item.appCode !== 'arknights' || !Array.isArray(item.bindingList)) continue;
            const defaultUid = stringValue(item.defaultUid);
            lastDefaultUid = defaultUid || lastDefaultUid;
            const bindings = normalizeSklandArknightsBindings(item.bindingList, defaultUid);
            if (bindings.length > 0) return { bindings, defaultUid };
        }
        return { bindings: [], defaultUid: lastDefaultUid };
    }

    function normalizeSklandBindingOption(value, defaultUid = '') {
        if (!isPlainRecord(value)) return null;

        const uid = normalizeSklandSyncText(value.uid);
        if (!uid) return null;

        const defaultUidText = normalizeSklandSyncText(defaultUid);
        const nickname = normalizeSklandSyncText(value.nickName ?? value.nickname ?? uid) || uid;
        const channelName = normalizeSklandSyncText(value.channelName ?? value.channel ?? '官方', 32) || '官方';
        return {
            uid,
            nickname,
            channelName,
            isDefault: defaultUidText ? uid === defaultUidText : value.isDefault === true
        };
    }

    function normalizeSklandArknightsBindings(bindingList, defaultUid = '') {
        if (!Array.isArray(bindingList)) return [];

        const seen = new Set();
        const bindings = [];
        bindingList.forEach(rawBinding => {
            const binding = normalizeSklandBindingOption(rawBinding, defaultUid);
            if (!binding || seen.has(binding.uid)) return;
            seen.add(binding.uid);
            bindings.push(binding);
        });
        return bindings;
    }

    function selectSklandBindingOption(bindings, preferredUid = '', defaultUid = '') {
        const normalized = normalizeSklandArknightsBindings(bindings, defaultUid);
        if (normalized.length === 0) return null;

        const preferredUidText = normalizeSklandSyncText(preferredUid);
        if (preferredUidText) {
            const preferred = normalized.find(binding => binding.uid === preferredUidText);
            if (preferred) return preferred;
        }

        const defaultBinding = normalized.find(binding => binding.isDefault);
        return defaultBinding || normalized[0];
    }

    function selectSklandArknightsBinding(list, preferredUid = '') {
        const bindingOptions = getSklandArknightsBindingOptionsFromList(list);
        return selectSklandBindingOption(bindingOptions.bindings, preferredUid, bindingOptions.defaultUid);
    }

    function resolveSelectedSklandBinding(selected, bindings) {
        const uid = typeof selected === 'string' || typeof selected === 'number'
            ? normalizeSklandSyncText(selected)
            : normalizeSklandSyncText(selected?.uid);
        if (!uid) return null;
        return bindings.find(binding => binding.uid === uid) || null;
    }

    async function resolveSklandImportBinding(accountId, bindingOptions, options = {}) {
        const bindings = normalizeSklandArknightsBindings(bindingOptions?.bindings || [], bindingOptions?.defaultUid);
        if (bindings.length === 0) throw new Error('森空岛账号未找到已绑定的明日方舟角色。');

        const accountSyncMeta = getAccountSklandSyncMeta(accountId);
        const preferredUid = normalizeSklandSyncText(options.preferredUid ?? accountSyncMeta?.uid);
        const defaultBinding = selectSklandBindingOption(bindings, preferredUid, bindingOptions?.defaultUid);
        if (!defaultBinding) throw new Error('森空岛账号未找到已绑定的明日方舟角色。');
        if (bindings.length === 1 || typeof options.selectBinding !== 'function') return defaultBinding;

        const selected = await options.selectBinding(bindings, defaultBinding, {
            accountId: normalizeAccountId(accountId),
            preferredUid,
            defaultUid: normalizeSklandSyncText(bindingOptions?.defaultUid)
        });
        if (selected === null || selected === undefined || selected === false) {
            throw createSklandImportCancelledError();
        }

        const resolved = resolveSelectedSklandBinding(selected, bindings);
        if (!resolved) throw new Error('选择的森空岛角色无效，请重试。');
        return resolved;
    }

    async function getSklandGamePlayerInfo(credential, token, timestamp, uid) {
        const query = `uid=${encodeURIComponent(uid)}`;
        const data = await sklandSignedGet('/api/v1/game/player/info', query, credential, token, timestamp);
        if (data.code !== 0 || data.message !== 'OK') {
            throw new Error('读取森空岛干员数据失败，请稍后重试。');
        }
        return data;
    }

    async function sklandSignedGet(path, query, credential, token, timestamp) {
        const sign = await generateSklandSign(token, path, query, timestamp);
        const url = `${SKLAND_BASE_URL}${path}${query ? `?${query}` : ''}`;
        return sklandRequestJson(url, {
            method: 'GET',
            headers: buildSklandHeaders(timestamp, sign, { cred: credential, token })
        });
    }

    function buildSklandHeaders(timestamp, sign, extraHeaders = {}) {
        return {
            'Content-Type': 'application/json',
            platform: '1',
            'Accept-Language': 'zh-Hans-CN;q=1.0',
            dId: '',
            vName: '1.21.0',
            language: 'zh-hans-CN',
            sign,
            timestamp,
            ...extraHeaders
        };
    }

    async function sklandRequestJson(url, init) {
        const method = init.method || 'GET';
        const headers = init.headers || {};
        const body = init.body;
        let fetchError = null;

        if (typeof fetch === 'function') {
            const controller = typeof AbortController === 'function' ? new AbortController() : null;
            const timeoutId = controller ? window.setTimeout(() => controller.abort(), SKLAND_REQUEST_TIMEOUT_MS) : null;
            try {
                const response = await fetch(url, {
                    method,
                    headers,
                    body,
                    signal: controller?.signal,
                    credentials: 'omit'
                });
                if (!response.ok) throw new Error(`森空岛接口请求失败: HTTP ${response.status}`);
                return await response.json();
            } catch (error) {
                fetchError = error;
            } finally {
                if (timeoutId !== null) window.clearTimeout(timeoutId);
            }
        }

        if (typeof GM_xmlhttpRequest !== 'function') {
            throw fetchError instanceof Error ? fetchError : new Error('森空岛接口请求失败，请稍后重试。');
        }

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method,
                url,
                headers,
                data: body,
                timeout: SKLAND_REQUEST_TIMEOUT_MS,
                responseType: 'json',
                onload: response => {
                    if (response.status < 200 || response.status >= 300) {
                        reject(new Error(`森空岛接口请求失败: HTTP ${response.status}`));
                        return;
                    }
                    if (response.response && typeof response.response === 'object') {
                        resolve(response.response);
                        return;
                    }
                    try {
                        resolve(JSON.parse(response.responseText || 'null'));
                    } catch (error) {
                        reject(new Error('森空岛接口返回格式异常，请稍后重试。'));
                    }
                },
                ontimeout: () => reject(new Error('森空岛接口请求超时，请稍后重试。')),
                onerror: () => reject(new Error('森空岛接口请求失败，请稍后重试。'))
            });
        });
    }

    function convertSklandPlayerInfoToNames(gamePlayerInfo) {
        const data = isPlainRecord(gamePlayerInfo) && isPlainRecord(gamePlayerInfo.data) ? gamePlayerInfo.data : null;
        const chars = data && Array.isArray(data.chars) ? data.chars : [];
        const charInfoMap = data && isPlainRecord(data.charInfoMap) ? data.charInfoMap : {};
        const names = [];

        for (const raw of chars) {
            if (!isPlainRecord(raw)) continue;
            const id = stringValue(raw.charId ?? raw.id);
            if (!id.startsWith('char_')) continue;
            const meta = isPlainRecord(charInfoMap[id]) ? charInfoMap[id] : null;
            const name = normalizeOperatorName(meta?.name ?? raw.name);
            if (name) names.push(name);
        }

        const sanitized = sanitizeOperatorNames(names);
        if (sanitized.length === 0) {
            throw new Error('森空岛干员数据为空，请确认账号已绑定明日方舟角色。');
        }
        return sanitized.sort((left, right) => left.localeCompare(right, 'zh-CN'));
    }

    async function generateSklandSign(token, path, queryOrBody, timestamp) {
        const headerForSign = {
            platform: '1',
            timestamp,
            dId: '',
            vName: '1.21.0'
        };
        const source = path + queryOrBody + timestamp + JSON.stringify(headerForSign);
        const hmac = await hmacSha256Hex(token, source);
        return md5Hex(hmac);
    }

    async function hmacSha256Hex(key, message) {
        const blockSize = 64;
        let keyBytes = utf8Bytes(key);
        if (keyBytes.length > blockSize) keyBytes = await sha256Bytes(keyBytes);

        const paddedKey = new Uint8Array(blockSize);
        paddedKey.set(keyBytes);

        const outerPad = new Uint8Array(blockSize);
        const innerPad = new Uint8Array(blockSize);
        for (let i = 0; i < blockSize; i++) {
            outerPad[i] = paddedKey[i] ^ 0x5c;
            innerPad[i] = paddedKey[i] ^ 0x36;
        }

        const innerHash = await sha256Bytes(concatBytes(innerPad, utf8Bytes(message)));
        const finalHash = await sha256Bytes(concatBytes(outerPad, innerHash));
        return bytesToHex(finalHash);
    }

    async function sha256Bytes(bytes) {
        if (!window.crypto?.subtle) throw new Error('当前浏览器不支持森空岛请求签名所需的 WebCrypto。');
        return new Uint8Array(await window.crypto.subtle.digest('SHA-256', bytes));
    }

    function utf8Bytes(value) {
        return new TextEncoder().encode(String(value));
    }

    function concatBytes(left, right) {
        const combined = new Uint8Array(left.length + right.length);
        combined.set(left, 0);
        combined.set(right, left.length);
        return combined;
    }

    function bytesToHex(bytes) {
        return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function md5Hex(input) {
        const bytes = utf8Bytes(input);
        const wordCount = (((bytes.length + 8) >>> 6) + 1) * 16;
        const words = new Array(wordCount).fill(0);
        for (let i = 0; i < bytes.length; i++) {
            words[i >> 2] |= bytes[i] << ((i % 4) * 8);
        }
        words[bytes.length >> 2] |= 0x80 << ((bytes.length % 4) * 8);
        const bitLength = bytes.length * 8;
        words[wordCount - 2] = bitLength >>> 0;
        words[wordCount - 1] = Math.floor(bitLength / 0x100000000) >>> 0;

        let a = 0x67452301;
        let b = 0xefcdab89;
        let c = 0x98badcfe;
        let d = 0x10325476;

        for (let i = 0; i < wordCount; i += 16) {
            const oldA = a;
            const oldB = b;
            const oldC = c;
            const oldD = d;

            a = md5Ff(a, b, c, d, words[i], 7, -680876936);
            d = md5Ff(d, a, b, c, words[i + 1], 12, -389564586);
            c = md5Ff(c, d, a, b, words[i + 2], 17, 606105819);
            b = md5Ff(b, c, d, a, words[i + 3], 22, -1044525330);
            a = md5Ff(a, b, c, d, words[i + 4], 7, -176418897);
            d = md5Ff(d, a, b, c, words[i + 5], 12, 1200080426);
            c = md5Ff(c, d, a, b, words[i + 6], 17, -1473231341);
            b = md5Ff(b, c, d, a, words[i + 7], 22, -45705983);
            a = md5Ff(a, b, c, d, words[i + 8], 7, 1770035416);
            d = md5Ff(d, a, b, c, words[i + 9], 12, -1958414417);
            c = md5Ff(c, d, a, b, words[i + 10], 17, -42063);
            b = md5Ff(b, c, d, a, words[i + 11], 22, -1990404162);
            a = md5Ff(a, b, c, d, words[i + 12], 7, 1804603682);
            d = md5Ff(d, a, b, c, words[i + 13], 12, -40341101);
            c = md5Ff(c, d, a, b, words[i + 14], 17, -1502002290);
            b = md5Ff(b, c, d, a, words[i + 15], 22, 1236535329);

            a = md5Gg(a, b, c, d, words[i + 1], 5, -165796510);
            d = md5Gg(d, a, b, c, words[i + 6], 9, -1069501632);
            c = md5Gg(c, d, a, b, words[i + 11], 14, 643717713);
            b = md5Gg(b, c, d, a, words[i], 20, -373897302);
            a = md5Gg(a, b, c, d, words[i + 5], 5, -701558691);
            d = md5Gg(d, a, b, c, words[i + 10], 9, 38016083);
            c = md5Gg(c, d, a, b, words[i + 15], 14, -660478335);
            b = md5Gg(b, c, d, a, words[i + 4], 20, -405537848);
            a = md5Gg(a, b, c, d, words[i + 9], 5, 568446438);
            d = md5Gg(d, a, b, c, words[i + 14], 9, -1019803690);
            c = md5Gg(c, d, a, b, words[i + 3], 14, -187363961);
            b = md5Gg(b, c, d, a, words[i + 8], 20, 1163531501);
            a = md5Gg(a, b, c, d, words[i + 13], 5, -1444681467);
            d = md5Gg(d, a, b, c, words[i + 2], 9, -51403784);
            c = md5Gg(c, d, a, b, words[i + 7], 14, 1735328473);
            b = md5Gg(b, c, d, a, words[i + 12], 20, -1926607734);

            a = md5Hh(a, b, c, d, words[i + 5], 4, -378558);
            d = md5Hh(d, a, b, c, words[i + 8], 11, -2022574463);
            c = md5Hh(c, d, a, b, words[i + 11], 16, 1839030562);
            b = md5Hh(b, c, d, a, words[i + 14], 23, -35309556);
            a = md5Hh(a, b, c, d, words[i + 1], 4, -1530992060);
            d = md5Hh(d, a, b, c, words[i + 4], 11, 1272893353);
            c = md5Hh(c, d, a, b, words[i + 7], 16, -155497632);
            b = md5Hh(b, c, d, a, words[i + 10], 23, -1094730640);
            a = md5Hh(a, b, c, d, words[i + 13], 4, 681279174);
            d = md5Hh(d, a, b, c, words[i], 11, -358537222);
            c = md5Hh(c, d, a, b, words[i + 3], 16, -722521979);
            b = md5Hh(b, c, d, a, words[i + 6], 23, 76029189);
            a = md5Hh(a, b, c, d, words[i + 9], 4, -640364487);
            d = md5Hh(d, a, b, c, words[i + 12], 11, -421815835);
            c = md5Hh(c, d, a, b, words[i + 15], 16, 530742520);
            b = md5Hh(b, c, d, a, words[i + 2], 23, -995338651);

            a = md5Ii(a, b, c, d, words[i], 6, -198630844);
            d = md5Ii(d, a, b, c, words[i + 7], 10, 1126891415);
            c = md5Ii(c, d, a, b, words[i + 14], 15, -1416354905);
            b = md5Ii(b, c, d, a, words[i + 5], 21, -57434055);
            a = md5Ii(a, b, c, d, words[i + 12], 6, 1700485571);
            d = md5Ii(d, a, b, c, words[i + 3], 10, -1894986606);
            c = md5Ii(c, d, a, b, words[i + 10], 15, -1051523);
            b = md5Ii(b, c, d, a, words[i + 1], 21, -2054922799);
            a = md5Ii(a, b, c, d, words[i + 8], 6, 1873313359);
            d = md5Ii(d, a, b, c, words[i + 15], 10, -30611744);
            c = md5Ii(c, d, a, b, words[i + 6], 15, -1560198380);
            b = md5Ii(b, c, d, a, words[i + 13], 21, 1309151649);
            a = md5Ii(a, b, c, d, words[i + 4], 6, -145523070);
            d = md5Ii(d, a, b, c, words[i + 11], 10, -1120210379);
            c = md5Ii(c, d, a, b, words[i + 2], 15, 718787259);
            b = md5Ii(b, c, d, a, words[i + 9], 21, -343485551);

            a = md5Add(a, oldA);
            b = md5Add(b, oldB);
            c = md5Add(c, oldC);
            d = md5Add(d, oldD);
        }

        return md5WordToHex(a) + md5WordToHex(b) + md5WordToHex(c) + md5WordToHex(d);
    }

    function md5Add(left, right) {
        return (left + right) >>> 0;
    }

    function md5RotateLeft(value, shift) {
        return (value << shift) | (value >>> (32 - shift));
    }

    function md5Cmn(query, a, b, x, shift, constant) {
        return md5Add(md5RotateLeft(md5Add(md5Add(a, query), md5Add(x, constant)), shift), b);
    }

    function md5Ff(a, b, c, d, x, shift, constant) {
        return md5Cmn((b & c) | (~b & d), a, b, x, shift, constant);
    }

    function md5Gg(a, b, c, d, x, shift, constant) {
        return md5Cmn((b & d) | (c & ~d), a, b, x, shift, constant);
    }

    function md5Hh(a, b, c, d, x, shift, constant) {
        return md5Cmn(b ^ c ^ d, a, b, x, shift, constant);
    }

    function md5Ii(a, b, c, d, x, shift, constant) {
        return md5Cmn(c ^ (b | ~d), a, b, x, shift, constant);
    }

    function md5WordToHex(word) {
        let output = '';
        for (let i = 0; i < 4; i++) {
            output += ((word >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
        }
        return output;
    }
