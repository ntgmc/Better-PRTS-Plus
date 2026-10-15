    const RESOURCE_URL = 'https://raw.githubusercontent.com/ntgmc/Better-PRTS-Plus/main/resources/data.json';
    const RESOURCE_CACHE_KEY = 'prts_plus_resources_v1';
    const RESOURCE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
    let resourceUpdatePending = null;
    let resourceCheckedAt = 0;

    function validateResourceData(data) {
        if (!isPlainRecord(data) || data.schemaVersion !== 1 ||
            !Array.isArray(data.operators) || !data.operators.length || !isPlainRecord(data.moduleTypes)) {
            throw new Error('资源格式无效');
        }
        const ids = new Set();
        const names = new Set();
        for (const op of data.operators) {
            if (!isPlainRecord(op) || typeof op.id !== 'string' || !/^char_\d+_[a-z0-9_]+$/.test(op.id) ||
                typeof op.name !== 'string' || !op.name.trim() || op.name !== op.name.trim() ||
                op.name.length > 50 || /[\x00-\x1f\x7f]/.test(op.name) || ids.has(op.id) || names.has(op.name)) {
                throw new Error('干员资源无效或重复');
            }
            ids.add(op.id);
            names.add(op.name);
        }
        const modules = Object.entries(data.moduleTypes);
        if (!modules.length || modules.some(([id, types]) =>
            !/^char_\d+_[a-z0-9_]+$/.test(id) || typeof types !== 'string' || !/^[XYDAB]{1,3}$/.test(types))) {
            throw new Error('模组资源无效');
        }
        return data;
    }

    function applyResourceData(data) {
        validateResourceData(data);
        Object.keys(OP_ID_MAP).forEach(name => delete OP_ID_MAP[name]);
        data.operators.forEach(op => { OP_ID_MAP[op.name] = op.id; });
        Object.keys(OP_MODULE_TYPES).forEach(id => delete OP_MODULE_TYPES[id]);
        Object.assign(OP_MODULE_TYPES, data.moduleTypes);
    }

    function loadCachedResources() {
        try {
            const cache = JSON.parse(GM_getValue(RESOURCE_CACHE_KEY, 'null'));
            if (!cache) return;
            applyResourceData(cache.data);
            resourceCheckedAt = Number.isFinite(cache.checkedAt) && cache.checkedAt <= Date.now() ? cache.checkedAt : 0;
        } catch (error) {
            console.warn('[Better PRTS] 资源缓存读取失败，使用内置资源', error);
        }
    }

    function updateResources() {
        if (resourceUpdatePending) return resourceUpdatePending;
        if (Date.now() - resourceCheckedAt < RESOURCE_CHECK_INTERVAL_MS) return Promise.resolve(false);
        const updateToast = showPrtsToast('资源数据同步中…', 'loading', '已开始同步干员与模组数据，请稍候。', 0);
        let request;
        let timeoutId;
        resourceUpdatePending = new Promise((resolve, reject) => {
            // anonymous 请求在部分浏览器中忽略内置 timeout。
            timeoutId = setTimeout(() => {
                reject(new Error('资源请求超时'));
                request?.abort();
            }, 15000);
            request = GM_xmlhttpRequest({
                method: 'GET',
                url: RESOURCE_URL,
                anonymous: true,
                timeout: 15000,
                onload: response => {
                    try {
                        if (response.status !== 200) throw new Error(`资源请求失败: HTTP ${response.status}`);
                        if (typeof response.responseText !== 'string' || response.responseText.length > 2 * 1024 * 1024) {
                            throw new Error('资源文件过大或为空');
                        }
                        resolve(JSON.parse(response.responseText));
                    } catch (error) { reject(error); }
                },
                onerror: () => reject(new Error('资源请求失败')),
                ontimeout: () => reject(new Error('资源请求超时')),
                onabort: () => reject(new Error('资源请求已取消'))
            });
        }).then(data => {
            applyResourceData(data);
            resourceCheckedAt = Date.now();
            let cacheSaved = true;
            try {
                GM_setValue(RESOURCE_CACHE_KEY, JSON.stringify({ checkedAt: resourceCheckedAt, data }));
            } catch (error) {
                cacheSaved = false;
                console.warn('[Better PRTS] 资源缓存保存失败，本页已更新', error);
            }
            if (isPrtsHost()) refreshResourceViews();
            updateToast(cacheSaved ? '资源数据同步成功' : '资源数据已更新，缓存保存失败', cacheSaved ? 'success' : 'warning',
                cacheSaved ? '干员与模组数据已更新。' : '本页已使用最新数据，下次打开页面将重新同步。');
            return true;
        }).catch(error => {
            console.warn('[Better PRTS] 资源更新失败，继续使用已有资源', error);
            updateToast('资源数据同步失败', 'error', `${error.message || '请稍后重试。'}\n继续使用已有数据。`);
            return false;
        }).finally(() => {
            clearTimeout(timeoutId);
            resourceUpdatePending = null;
        });
        return resourceUpdatePending;
    }
