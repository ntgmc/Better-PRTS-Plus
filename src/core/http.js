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

