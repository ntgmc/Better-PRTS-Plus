    function normalizeBlockedUsers(value) {
        if (!Array.isArray(value)) return [];
        const users = new Map();
        for (const user of value) {
            if (!isPlainRecord(user) || !['string', 'number'].includes(typeof user.id)) continue;
            const id = String(user.id);
            if (!/^[1-9]\d*$/.test(id) || (typeof user.id === 'number' && !Number.isSafeInteger(user.id))) continue;
            const name = typeof user.name === 'string' ? user.name.trim().slice(0, 100) : '';
            users.set(id, { id, name: name || `用户 ${id}` });
        }
        return [...users.values()];
    }

    function isBlockedAuthorHidden(id) {
        if (!CONFIG.blockUsers || !CONFIG.blockedUsers.some(user => user.id === String(id))) return false;
        const profileId = window.location.pathname.match(/^\/profile\/([1-9]\d*)\/?$/)?.[1];
        return !(profileId === String(id) && new URLSearchParams(window.location.search).get('prts_blacklist') === profileId);
    }

    function setAuthorBlocked(id, name, blocked) {
        const fromProfile = document.activeElement?.closest('#prts-profile-block-controls');
        const previous = CONFIG.blockedUsers;
        CONFIG.blockedUsers = normalizeBlockedUsers([
            ...previous.filter(user => user.id !== String(id)), ...(blocked ? [{ id, name }] : [])
        ]);
        try {
            saveConfig();
        } catch {
            CONFIG.blockedUsers = previous;
            showPrtsToast('黑名单保存失败', 'error', '请重试，当前名单未更改。');
            return;
        }
        syncBlockedAuthors();
        if (fromProfile) document.querySelector('#prts-profile-block-controls button')?.focus({ preventScroll: true });
        requestFilterUpdate();
        showPrtsToast(blocked ? '已拉黑该用户' : '已解除拉黑', 'success');
    }

    function syncBlockedAuthorCard(cardInner, operation) {
        const author = cardInner.querySelector('.bp4-icon-user, .bp6-icon-user')?.parentElement
            ?.querySelector('a[href^="/profile/"]');
        const id = operation?.uploaderId ?? author?.getAttribute('href')?.match(/^\/profile\/([1-9]\d*)\/?$/)?.[1];
        const hidden = isBlockedAuthorHidden(id);
        const container = cardInner.parentElement?.tagName === 'LI' ? cardInner.parentElement : cardInner;
        container.classList.toggle('prts-blocked-content', hidden);
        return hidden;
    }

    function renderBlockedUsers() {
        const list = document.getElementById('prts-blacklist-list');
        if (!list) return;
        const signature = JSON.stringify(CONFIG.blockedUsers);
        if (list.dataset.users === signature) return;
        const hadFocus = list.contains(document.activeElement);
        list.replaceChildren();
        if (!CONFIG.blockedUsers.length) {
            const empty = document.createElement('p');
            empty.className = 'prts-about-description';
            empty.textContent = '黑名单为空。开启后，可在用户个人主页拉黑。';
            list.appendChild(empty);
        }
        for (const user of CONFIG.blockedUsers) {
            const row = document.createElement('div');
            row.className = 'prts-blacklist-row';
            const link = document.createElement('a');
            link.className = 'prts-blacklist-user';
            link.href = `/profile/${user.id}?prts_blacklist=${user.id}`;
            link.textContent = user.name;
            link.title = `查看 ${user.name} 的主页（ID ${user.id}）`;
            const id = document.createElement('span');
            id.className = 'prts-blacklist-id';
            id.textContent = `ID ${user.id}`;
            link.appendChild(id);
            row.appendChild(link);
            row.appendChild(createPrtsButton({
                text: '解除拉黑', ariaLabel: `解除拉黑 ${user.name}`,
                onClick: () => setAuthorBlocked(user.id, user.name, false)
            }));
            list.appendChild(row);
        }
        list.dataset.users = signature;
        if (hadFocus) (list.querySelector('button') || document.getElementById('prts-blacklist-close')).focus();
    }

    function syncBlockedProfileControls() {
        const profileId = window.location.pathname.match(/^\/profile\/([1-9]\d*)\/?$/)?.[1];
        const layout = document.querySelector('.docs-content-wrapper > .flex');
        const heading = layout?.children[1]?.querySelector(BP_SELECTORS.heading);
        const profileCard = heading?.closest(BP_SELECTORS.card);
        let controls = document.getElementById('prts-profile-block-controls');
        if (!CONFIG.blockUsers || !profileId || !profileCard) {
            controls?.remove();
            return;
        }
        if (!controls) {
            controls = document.createElement('div');
            controls.id = 'prts-profile-block-controls';
        }
        if (controls.parentElement !== profileCard) profileCard.appendChild(controls);
        const blocked = CONFIG.blockedUsers.some(user => user.id === profileId);
        const hidden = isBlockedAuthorHidden(profileId);
        const name = heading.textContent.trim();
        const signature = JSON.stringify([profileId, name, blocked, hidden]);
        if (controls.dataset.user === signature) return;
        controls.replaceChildren();
        const blueprint = profileCard.classList.contains('bp6-card') ? 'bp6' : 'bp4';
        controls.appendChild(createPrtsButton({
            className: `${blueprint}-button ${blueprint}-fill ${blueprint}-minimal`,
            icon: 'blockUsers', text: blocked ? '解除拉黑' : '拉黑此用户',
            onClick: () => setAuthorBlocked(profileId, name, !blocked)
        }));
        if (blocked) {
            const notice = document.createElement('span');
            notice.textContent = hidden ? '已拉黑该用户。请从悬浮球 → 黑名单进入主页查看作业。' : '正在查看黑名单用户的作业。';
            controls.appendChild(notice);
        }
        controls.dataset.user = signature;
    }

    function syncBlockedOperationDetails() {
        document.querySelectorAll('.bp4-drawer, .bp6-drawer').forEach(drawer => {
            const author = Array.from(drawer.querySelectorAll('a[href^="/profile/"]'))
                .find(link => !link.closest(BP_SELECTORS.card));
            const id = author?.getAttribute('href')?.match(/^\/profile\/([1-9]\d*)\/?$/)?.[1];
            const hidden = !isFilterDisabledPage() && isBlockedAuthorHidden(id);
            drawer.classList.toggle('prts-blocked-detail', hidden);
            let notice = drawer.querySelector('.prts-blocked-detail-notice');
            if (!hidden) {
                notice?.remove();
            } else if (!notice) {
                notice = document.createElement('p');
                notice.className = 'prts-blocked-detail-notice';
                notice.setAttribute('role', 'status');
                notice.textContent = '此作业的作者已被拉黑。请从悬浮球 → 黑名单进入该用户主页查看作业。';
                const query = new URLSearchParams(window.location.search);
                query.delete('op');
                query.delete('opset');
                const back = document.createElement('a');
                back.className = 'prts-btn';
                back.href = `${window.location.pathname}${query.size ? `?${query}` : ''}`;
                back.textContent = '返回列表';
                notice.appendChild(back);
                drawer.appendChild(notice);
            }
        });
    }

    function syncBlockedAuthors() {
        renderBlockedUsers();
        syncBlockedOperationDetails();
        if (!CONFIG.blockUsers || isFilterDisabledPage()) {
            document.querySelectorAll('.prts-blocked-content').forEach(node => node.classList.remove('prts-blocked-content'));
            document.getElementById('prts-profile-block-controls')?.remove();
            return;
        }
        document.querySelectorAll('.bp4-icon-user + a[href^="/profile/"], .bp6-icon-user + a[href^="/profile/"]')
            .forEach(author => {
                const card = author.closest(BP_SELECTORS.card);
                if (card) syncBlockedAuthorCard(card);
            });
        syncBlockedProfileControls();
    }
