    let followedAuthorIds = new Set();
    let followedAuthorsToken = '';
    let followedAuthorsRequest = null;
    let followedAuthorsCheckedAt = 0;

    function getPrtsFollowToken() {
        try {
            const auth = safeJsonParse(localStorage.getItem('zoot-plus-auth'), null);
            return isPlainRecord(auth) && typeof auth.token === 'string' &&
                new Date(auth.validBefore).getTime() > Date.now() ? auth.token : '';
        } catch {
            return '';
        }
    }

    function isFollowingOnlyList(card) {
        if (card.closest('.bp4-drawer, .bp6-drawer')) return false;
        return Boolean(document.querySelector('button.bp4-active:has(.bp4-icon-following), button.bp6-active:has(.bp6-icon-following)'));
    }

    function clearFollowedAuthors() {
        followedAuthorsRequest?.abort();
        followedAuthorsRequest = null;
        followedAuthorsToken = '';
        followedAuthorsCheckedAt = 0;
        followedAuthorIds.clear();
        document.querySelectorAll('.prts-followed-card').forEach(card => card.classList.remove('prts-followed-card'));
        document.querySelectorAll('.prts-followed-badge').forEach(badge => badge.remove());
    }

    function syncFollowedAuthorCards() {
        document.querySelectorAll('.bp4-icon-user + a[href^="/profile/"], .bp6-icon-user + a[href^="/profile/"]')
            .forEach(author => {
                const card = author.closest(BP_SELECTORS.card);
                if (card) syncFollowedAuthorBadge(card, card);
            });
    }

    async function syncFollowedAuthors(forceRefresh = false) {
        const token = CONFIG.markFollowedAuthors && !isFilterDisabledPage() ? getPrtsFollowToken() : '';
        if (token !== followedAuthorsToken) clearFollowedAuthors();
        syncFollowedAuthorCards();
        if (!token || document.hidden) return;
        followedAuthorsToken = token;
        if (followedAuthorsRequest || (!forceRefresh && Date.now() - followedAuthorsCheckedAt < 60000)) return;
        followedAuthorsCheckedAt = Date.now();
        const controller = new AbortController();
        followedAuthorsRequest = controller;
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const ids = new Set();
            let hasNext = true;
            for (let page = 1; hasNext; page++) {
                const response = await fetch(`https://prts.maa.plus/follow/followingList?page=${page}&size=100`, {
                    headers: { Authorization: `Bearer ${token}` }, credentials: 'omit', signal: controller.signal
                });
                if (!response.ok) throw new Error('关注列表请求失败');
                const result = await response.json();
                const data = result?.data;
                if (result?.status_code !== 200 || !isPlainRecord(data) || typeof data.has_next !== 'boolean' ||
                    !Array.isArray(data.data) || (data.has_next && !data.data.length) ||
                    !data.data.every(user => isPlainRecord(user) && /^(?:[1-9]\d*)$/.test(String(user.id)))) {
                    throw new Error('关注列表格式无效');
                }
                data.data.forEach(user => ids.add(String(user.id)));
                hasNext = data.has_next;
            }
            if (controller.signal.aborted || getPrtsFollowToken() !== token || !CONFIG.markFollowedAuthors) return;
            followedAuthorIds = ids;
            syncFollowedAuthorCards();
        } catch {
            if (!controller.signal.aborted) console.warn('[Better PRTS] 关注列表读取失败，稍后重试');
        } finally {
            clearTimeout(timeout);
            if (followedAuthorsRequest === controller) followedAuthorsRequest = null;
        }
    }

    function syncFollowedAuthorBadge(card, cardInner, operation) {
        const author = cardInner.querySelector('.bp4-icon-user, .bp6-icon-user')?.parentElement
            ?.querySelector('a[href^="/profile/"]');
        const authorId = operation?.uploaderId ?? author?.getAttribute('href')?.match(/^\/profile\/(\d+)\/?$/)?.[1];
        const isAuthorProfile = window.location.pathname.match(/^\/profile\/(\d+)\/?$/)?.[1] === String(authorId);
        const followed = CONFIG.markFollowedAuthors && Boolean(author) && !isFollowingOnlyList(card) &&
            !isAuthorProfile && followedAuthorIds.has(String(authorId));
        cardInner.classList.toggle('prts-followed-card', followed);
        const existing = cardInner.querySelector('.prts-followed-badge');
        if (!followed) {
            existing?.remove();
        } else if (!existing || existing.previousElementSibling !== author) {
            existing?.remove();
            const badge = document.createElement('span');
            badge.className = 'prts-followed-badge';
            badge.textContent = '已关注';
            author.after(badge);
        }
    }
