    const RESOURCE_URL = 'https://raw.githubusercontent.com/ntgmc/Better-PRTS-Plus/main/resources/data.json';
    const RESOURCE_URLS = [
        RESOURCE_URL,
        'https://cdn.jsdelivr.net/gh/ntgmc/Better-PRTS-Plus@main/resources/data.json',
        'https://gcore.jsdelivr.net/gh/ntgmc/Better-PRTS-Plus@main/resources/data.json'
    ];
    const RESOURCE_CACHE_KEY = 'prts_plus_resources_v1';
    const RESOURCE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
    let resourceUpdatePending = null;
    let resourceCheckedAt = 0;
    let resourceVersion = BUILTIN_RESOURCE_VERSION;

    function validateResourceData(data) {
        if (!isPlainRecord(data) || data.schemaVersion !== 1 ||
            !Number.isSafeInteger(data.resourceVersion) || data.resourceVersion < 1 ||
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
        if (data.resourceVersion < resourceVersion) {
            throw new Error('资源版本早于当前数据');
        }
        return data;
    }

    function applyResourceData(data) {
        validateResourceData(data);
        Object.keys(OP_ID_MAP).forEach(name => delete OP_ID_MAP[name]);
        data.operators.forEach(op => { OP_ID_MAP[op.name] = op.id; });
        Object.keys(OP_MODULE_TYPES).forEach(id => delete OP_MODULE_TYPES[id]);
        Object.assign(OP_MODULE_TYPES, data.moduleTypes);
        resourceVersion = data.resourceVersion;
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

    function downloadFirstValidJson(urls, validate, maxBytes) {
        const cancellations = new Set();
        // 复用并发择优思路：https://github.com/kkocdko/user-scripts/blob/master/scripts/snippets/snippets.js (Unlicense)
        return Promise.any(urls.map(url => {
            let request;
            let timeoutId;
            let cancel;
            return new Promise((resolve, reject) => {
                cancel = () => {
                    reject(new Error('下载请求已取消'));
                    request?.abort();
                };
                cancellations.add(cancel);
                // anonymous 请求在部分浏览器中忽略内置 timeout。
                timeoutId = setTimeout(() => {
                    reject(new Error('下载请求超时'));
                    request?.abort();
                }, 15000);
                request = GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    anonymous: true,
                    timeout: 15000,
                    onload: response => {
                        try {
                            if (response.status !== 200) throw new Error(`下载请求失败：HTTP ${response.status}`);
                            if (typeof response.responseText !== 'string' || response.responseText.length > maxBytes) {
                                throw new Error('下载文件无效或过大');
                            }
                            resolve(validate(JSON.parse(response.responseText)));
                        } catch (error) { reject(error); }
                    },
                    onerror: () => reject(new Error('下载请求失败')),
                    ontimeout: () => reject(new Error('下载请求超时')),
                    onabort: () => reject(new Error('下载请求已取消'))
                });
            }).finally(() => {
                clearTimeout(timeoutId);
                cancellations.delete(cancel);
            });
        })).finally(() => {
            cancellations.forEach(cancel => cancel());
        });
    }

    function updateResources() {
        if (resourceUpdatePending) return resourceUpdatePending;
        if (Date.now() - resourceCheckedAt < RESOURCE_CHECK_INTERVAL_MS) return Promise.resolve(false);
        const updateToast = showPrtsToast('正在更新干员与模组数据…', 'loading', '正在下载数据，请稍候。', 0);
        resourceUpdatePending = downloadFirstValidJson(RESOURCE_URLS, validateResourceData, 2 * 1024 * 1024).then(data => {
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
            updateToast(cacheSaved ? '数据更新成功' : '数据已更新，缓存保存失败', cacheSaved ? 'success' : 'warning',
                cacheSaved ? '干员与模组数据已更新。' : '本页已使用最新数据，下次打开页面将重新同步。');
            return true;
        }).catch(error => {
            console.warn('[Better PRTS] 资源更新失败，继续使用已有资源', error);
            const detail = error instanceof AggregateError ? '所有资源下载源均不可用，请稍后重试。' : error.message || '请稍后重试。';
            updateToast('干员与模组数据更新失败', 'error', `${detail}\n继续使用已有数据。`);
            return false;
        }).finally(() => {
            resourceUpdatePending = null;
        });
        return resourceUpdatePending;
    }
