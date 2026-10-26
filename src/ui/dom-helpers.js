    // =========================================================================
    //                            MODULE 3.5: DOM UI HELPERS
    // =========================================================================

    const SVG_NS = 'http://www.w3.org/2000/svg';
    let prtsModalCleanup = null;

    // 16px 实心图标：名称对应用途；不同含义使用不同轮廓。
    const PRTS_ICON_PATHS = {
        account: 'M11 4.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2 14c0-3 2.4-5 6-5s6 2 6 5v1H2Z',
        accounts: 'M1 3h14v11H1Zm1.5 1.5v8h11v-8ZM7.5 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3 12c0-1.6 1-2.5 2.5-2.5S8 10.4 8 12Zm6-6h3v1.5H9Zm0 3h3v1.5H9Z',
        selected: 'M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM4 8l1.1-1.1L7 8.8l3.9-3.9L12 6l-5 5Z',
        perfectSquad: 'M5.5 4a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0ZM1 5a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm10 0a2 2 0 1 1 4 0 2 2 0 0 1-4 0ZM4 13v-2c0-2 1.7-3 4-3 1.2 0 2.2.3 2.9.8L8 11.7 6.9 10.6 5 12.5l.5.5ZM0 12v-1c0-2 1.2-3 3-3h.8A4.6 4.6 0 0 0 2.5 11v1Zm8.2 1.1 1.1-1.1 1.6 1.6 3.5-3.5 1.1 1.1-4.6 4.6Z',
        support: 'M9 4.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM1 14v-1c0-2.5 2-4 5-4 .8 0 1.6.1 2.3.4A5 5 0 0 0 7 13v1ZM11 8h1.5v2.75h2.75v1.5H12.5V15H11v-2.75H8.25v-1.5H11Z',
        trainingCheck: 'M5 1h6v2h3v12H2V3h3Zm1.5 1.5v2h3v-2ZM3.5 4.5v9h9v-9H11V6H5V4.5ZM5 9l1.1-1.1L8 9.8l2.9-2.9L12 8l-4 4Z',
        grayMode: 'M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 1.5v11a5.5 5.5 0 0 0 0-11Z',
        hideMode: 'M1.6.5 15.5 14.4l-1.1 1.1L.5 1.6ZM8 3c3.3 0 5.7 2.5 7.5 5a15 15 0 0 1-2.7 3l-1.1-1.1a12 12 0 0 0 2-1.9C12.2 6.1 10.3 4.5 8 4.5h-.6L6 3.1ZM3.2 4.9 4.3 6a13 13 0 0 0-2 2c1.5 1.9 3.4 3.5 5.7 3.5h.6l1.4 1.4L8 13C4.7 13 2.3 10.5.5 8a15 15 0 0 1 2.7-3.1Z',
        showAll: 'M8 3c3.3 0 5.7 2.5 7.5 5-1.8 2.5-4.2 5-7.5 5S2.3 10.5.5 8C2.3 5.5 4.7 3 8 3Zm0 1.5C5.7 4.5 3.8 6.1 2.3 8c1.5 1.9 3.4 3.5 5.7 3.5s4.2-1.6 5.7-3.5C12.2 6.1 10.3 4.5 8 4.5ZM10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
        importOperators: 'M12 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 9h1c3.6 0 6 2 6 5v1H8v-2h5c-.5-1.4-1.9-2-4-2H8ZM1 9h3V7l4 4-4 4v-2H1Z',
        importBackup: 'M7 1h4l4 4v10H7v-1.5h6.5V6H10V2.5H7Zm4.5 2.1V4.5h1.4ZM1 7h4V4.5L9.5 9 5 13.5V11H1Z',
        exportBackup: 'M2 1h7l4 4v3h-1.5V6H8V2.5H3.5v11H8V15H2Zm7.5 2.1v1.4h1.4ZM7 10h4V7.5l4 3.5-4 3.5V12H7Z',
        checkUpdates: 'M4 11h-.5C1.6 11 .5 9.5.5 7.7c0-1.7 1.1-3 2.7-3.3C4 .8 11.8.8 12.6 4.4c1.7.2 2.9 1.6 2.9 3.3 0 1.8-1.1 3.3-3 3.3H12V9.5h.5c.9 0 1.5-.7 1.5-1.8 0-1-.8-1.8-1.8-1.8h-.8l-.2-.8c-.6-2.8-5.8-2.8-6.4 0l-.2.8h-.8C2.8 5.9 2 6.7 2 7.7c0 1.1.6 1.8 1.5 1.8H4ZM7 7h2v5h2l-3 3-3-3h2Z',
        reload: 'M13.5 1v5.5H8L10 4.5a4.5 4.5 0 1 0 2.4 5H14A6 6 0 1 1 11.1 3.4Z',
        cards: 'M4 1h11v11h-1.5V2.5H4ZM1 4h11v11H1Zm1.5 1.5v8h8v-8ZM4 8h5v1.5H4Zm0 3h4v1.5H4Z',
        pageEnhancements: 'M1 2h14v12H1Zm1.5 4v6.5h11V6Zm0-2.5v1h11v-1ZM8 6.5l.9 2.1L11 9.5l-2.1.9L8 12.5l-.9-2.1L5 9.5l2.1-.9Z',
        siteRedesign: 'M1 2h14v12H1Zm1.5 1.5v2h11v-2Zm0 3.5v5.5h3V7Zm4.5 0v5.5h6.5V7Zm1 1h4.5v1.5H8Zm0 2.5h3V12H8Z',
        collapseDescription: 'M2 1h12v1.5H2Zm0 3h12v1.5H2Zm0 3h8v1.5H2Zm2 6 4-4 4 4-1.1 1.1L8 11.2l-2.9 2.9Z',
        operatorAvatars: 'M1 1h14v14H1Zm1.5 1.5v11h11v-11ZM10.5 6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM4 12c0-2 1.5-3 4-3s4 1 4 3Z',
        stageBadge: 'M8 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 9.5 3 6a5 5 0 0 1 5-5Zm0 1.5A3.5 3.5 0 0 0 4.5 6c0 2.1 2.2 5.2 3.5 6.7 1.3-1.5 3.5-4.6 3.5-6.7A3.5 3.5 0 0 0 8 2.5ZM10 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
        clickStageFilter: 'M1 2h14v1.5L9 9v5l-2 1V9L1 3.5Zm2.7 1.5L8 7.4l4.3-3.9Z',
        exactTime: 'M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM7 4h1.5v3.6l2.8 1.6-.8 1.3L7 8.4Z',
        videoLink: 'M1 2h8v6H7.5V3.5h-5v7H6V12H1ZM4 5l3 2-3 2Zm5 4h4v1.5H9Zm-1-2h2v1.5H8a2 2 0 0 0 0 4h2V14H8a3.5 3.5 0 0 1 0-7Zm4 0h.5a3.5 3.5 0 0 1 0 7H12v-1.5h.5a2 2 0 0 0 0-4H12Z',
        hideVideo: 'M1 1.5 14.5 15l1-1L2 0ZM1 5h1.5v6.5h6V10L10 11.5V13H1ZM6 3h4v2.5L15 3v9l-3-1.5v-2L13.5 10V5.5L10 7.3V4.5H7.5Z',
        hidePrtsBadge: 'M1 1.5 14.5 15l1-1L2 0ZM5 2h5l5 5v3l-1.5 1.5-1.1-1.1L13.5 9.4V7.6L9.4 3.5H6.5ZM1 4h1.5v5.4l4.1 4.1h1.8l1.7-1.7 1.1 1.1L9 15H6L1 10Z',
        trainingPromptStyle: 'M1 2h3v3H1Zm5 .5h9V4H6ZM1 6.5h3v3H1ZM6 7h9v1.5H6ZM1 11h3v3H1Zm5 .5h7V13H6Z',
        popoverAvatars: 'M1 1h14v11h-4l-4 3v-3H1Zm1.5 1.5v8h6v1.5l2-1.5h3v-8ZM7 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.5 9V8c0-1.3 4-1.3 4 0v1Zm5 0V8c0-1.3 4-1.3 4 0v1Z',
        hideSidebar: 'M1 2h14v12H1Zm1.5 1.5v9h3v-9Zm4.5 0v9h6.5v-9Zm3 1 1 1-2 2h3v1.5H9l2 2-1 1L6.8 8Z',
        hideOperatorMatchingSettings: 'M2 1h1.5v4H2Zm0 7h1.5v7H2ZM.5 5h4.5v3H.5ZM7 1h1.5v8H7ZM5.5 9H10v3H5.5ZM7 12h1.5v3H7Zm5-11h1.5v3H12Zm-1.5 3H15v3h-4.5Zm.7 5.2 1.8 1.8 1.8-1.8 1 1-1.8 1.8 1.8 1.8-1 1-1.8-1.8-1.8 1.8-1-1 1.8-1.8-1.8-1.8Z',
        announcementTags: 'M1 5h4l7-4v12l-7-4H1Zm1.5 1.5v1h3l5 2.9V3.6l-5 2.9ZM3 10h2l1 5H4Zm10.5-5h2v1.5h-2Zm0 3h2v1.5h-2Z',
        importantUpdatesOnly: 'M8 1a4 4 0 0 1 4 4v4l2 2v1H2v-1l2-2V5a4 4 0 0 1 4-4Zm0 1.5A2.5 2.5 0 0 0 5.5 5v4.6l-.9.9h6.8l-.9-.9V5A2.5 2.5 0 0 0 8 2.5ZM6 13h4a2 2 0 0 1-4 0ZM7.2 4h1.6v3.5H7.2Zm0 4.5h1.6V10H7.2Z',
        compatDebug: 'M4 1 6 3h4l2-2 1 1-2 2 .7 1H15v1.5h-3V8h3v1.5h-3V11h3v1.5h-3.5A4 4 0 0 1 8 15a4 4 0 0 1-3.5-2.5H1V11h3V9.5H1V8h3V6.5H1V5h3.3L5 4 3 2Zm1.5 5v5a2.5 2.5 0 0 0 5 0V6ZM7.2 7h1.6v6H7.2Z',
        missingOperators: 'M9 4.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM1 14v-1c0-2.5 2-4 5-4 .8 0 1.6.1 2.3.4A5 5 0 0 0 7 13v1ZM9 11h6v2H9Z',
        lowTraining: 'M8 1a7 7 0 0 1 7 7v3h-1.5V8a5.5 5.5 0 0 0-11 0v3H1V8a7 7 0 0 1 7-7ZM7.2 3h1.6v2H7.2ZM3.5 5l1.4 1.4-1 1L2.5 6Zm9 0 1 1-1.4 1.4-1-1ZM7 7h2v5h2l-3 3-3-3h2Z',
        pending: 'M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM5.5 6a2.5 2.5 0 1 1 4 2l-.8.6V10H7.2V7.9l1.4-1.1A1 1 0 1 0 7 6ZM7.2 11h1.6v1.5H7.2Z',
        unmarkedTraining: 'M2 1h7l4 4v10H2Zm1.5 1.5v11h8V6H8V2.5Zm6 .6v1.4h1.4ZM5 8a2 2 0 1 1 3.2 1.6l-.5.4v.5H6.3v-1l1-1A.6.6 0 1 0 6.4 8Zm1.3 3.5h1.4V13H6.3Z',
        about: 'M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM7.2 4h1.6v1.6H7.2Zm0 3h1.6v5H7.2Z',
        close: 'M3 1.9 8 6.9l5-5L14.1 3l-5 5 5 5-1.1 1.1-5-5-5 5L1.9 13l5-5-5-5Z',
        collapsePanel: 'M10.5 2 4.5 8l6 6 1.1-1.1L6.7 8l4.9-4.9Z',
        expandSubmenu: 'M5.5 2 4.4 3.1 9.3 8l-4.9 4.9L5.5 14l6-6Z',
        playVideo: 'M1 2h14v12H1Zm1.5 1.5v9h11v-9ZM6 5l5 3-5 3Z',
        externalSource: 'M8 1h7v7h-1.5V3.6L7.1 10 6 8.9l6.4-6.4H8ZM1 4h5v1.5H2.5v8h8V10H12v5H1Z',
        settings: 'M6.5 1h3l.5 2 1.8.8 1.8-.9 1.5 2.6-1.7 1.2v2.6l1.7 1.2-1.5 2.6-1.8-.9-1.8.8-.5 2h-3L6 13l-1.8-.8-1.8.9L.9 10.5l1.7-1.2V6.7L.9 5.5l1.5-2.6 1.8.9L6 3ZM8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'
    };

    function getFocusableDialogElements(root) {
        return Array.from(root.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'))
            .filter(element => element instanceof HTMLElement && element.getClientRects().length > 0);
    }

    function ensurePrtsToastContainer() {
        let container = document.getElementById('prts-toast-container');
        if (container) return container;

        container = document.createElement('div');
        container.id = 'prts-toast-container';
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'false');
        document.body.appendChild(container);
        return container;
    }

    function showPrtsToast(message, type = 'info', detail = '', duration = 4000) {
        const container = ensurePrtsToastContainer();
        const toast = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'prts-toast-title';
        toast.appendChild(title);

        const detailEl = document.createElement('div');
        detailEl.className = 'prts-toast-detail';
        toast.appendChild(detailEl);
        container.appendChild(toast);

        let timeoutId;
        const update = (nextMessage, nextType = 'info', nextDetail = '', nextDuration = 4000) => {
            window.clearTimeout(timeoutId);
            const toastType = ['loading', 'success', 'warning', 'error'].includes(nextType) ? nextType : '';
            toast.className = `prts-toast${toastType ? ` ${toastType}` : ''}`;
            title.textContent = nextMessage;
            detailEl.textContent = nextDetail;
            detailEl.hidden = !nextDetail;
            if (nextDuration > 0) {
                timeoutId = window.setTimeout(() => {
                    toast.classList.add('is-leaving');
                    window.setTimeout(() => toast.remove(), 220);
                }, nextDuration);
            }
        };
        update(message, type, detail, duration);
        return update;
    }

    function createSvgIconFromPath(pathData, viewBox = '0 0 16 16') {
        const span = document.createElement('span');
        span.className = 'bp4-icon prts-icon';
        span.setAttribute('aria-hidden', 'true');

        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('viewBox', viewBox);
        svg.setAttribute('fill', 'currentColor');
        svg.setAttribute('fill-rule', 'evenodd');
        svg.setAttribute('focusable', 'false');

        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', String(pathData || ''));
        svg.appendChild(path);
        span.appendChild(svg);
        return span;
    }

    function createSklandIconImage() {
        try {
            const parsed = new DOMParser().parseFromString(SKLAND_FAVICON_SVG, 'image/svg+xml');
            const svg = parsed.documentElement;
            if (svg?.tagName?.toLowerCase() === 'svg') {
                const imported = document.importNode(svg, true);
                imported.classList.add('prts-btn-icon-svg');
                imported.setAttribute('aria-hidden', 'true');
                imported.setAttribute('focusable', 'false');
                imported.dataset.prtsIcon = 'skland';
                return imported;
            }
        } catch (error) {
            console.warn('[Better PRTS] Failed to render Skland icon', error);
        }

        return createPrtsIcon('externalSource');
    }

    function createPrtsIcon(icon) {
        if (!icon) return null;
        if (icon === 'skland') return createSklandIconImage();
        if (!Object.hasOwn(PRTS_ICON_PATHS, icon)) return null;
        const element = createSvgIconFromPath(PRTS_ICON_PATHS[icon]);
        element.dataset.prtsIcon = icon;
        return element;
    }

    function createPrtsButton({
        id,
        className = 'prts-btn',
        icon = null,
        text = '',
        active = false,
        disabled = false,
        title = '',
        ariaLabel = '',
        ariaControls = '',
        ariaDescribedBy = '',
        expanded = null,
        pressed = null,
        onClick = null
    } = {}) {
        let btn = id ? document.getElementById(id) : null;
        if (!btn || btn.tagName !== 'BUTTON') {
            btn = document.createElement('button');
            btn.type = 'button';
            if (id) btn.id = id;
        }

        btn.className = className;
        btn.classList.toggle('prts-active', active === true);
        btn.disabled = disabled === true;
        btn.style.opacity = '';
        btn.style.cursor = '';

        if (title) btn.title = title;
        else btn.removeAttribute('title');

        if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
        else btn.removeAttribute('aria-label');

        if (ariaControls) btn.setAttribute('aria-controls', ariaControls);
        else btn.removeAttribute('aria-controls');

        if (ariaDescribedBy) btn.setAttribute('aria-describedby', ariaDescribedBy);
        else btn.removeAttribute('aria-describedby');

        if (expanded !== null) btn.setAttribute('aria-expanded', expanded === true ? 'true' : 'false');
        else btn.removeAttribute('aria-expanded');

        if (pressed !== null) btn.setAttribute('aria-pressed', pressed === true ? 'true' : 'false');
        else btn.removeAttribute('aria-pressed');

        if (btn._prtsClickHandler) {
            btn.removeEventListener('click', btn._prtsClickHandler);
            btn._prtsClickHandler = null;
        }
        if (typeof onClick === 'function') {
            btn._prtsClickHandler = onClick;
            btn.addEventListener('click', onClick);
        }

        const children = [];
        const iconEl = createPrtsIcon(icon);
        if (iconEl) children.push(iconEl);

        const label = document.createElement('span');
        label.className = 'bp4-button-text';
        label.textContent = text;
        children.push(label);

        btn.replaceChildren(...children);
        return btn;
    }

    function createAccountSelect(id, selectedId, onChange) {
        let select = document.getElementById(id);
        if (select?.tagName !== 'SELECT') {
            select?.remove();
            select = document.createElement('select');
            select.id = id;
            select.className = 'prts-account-select';
            select.setAttribute('aria-label', id === 'btn-account' ? '切换当前账号' : '选择导入目标账号');
        }
        const ids = getAccountIds();
        const signature = JSON.stringify(ids.map(accountId => [accountId, getAccountLabel(accountId)]));
        if (select.dataset.accounts !== signature) {
            select.replaceChildren(...ids.map(accountId => {
                const option = document.createElement('option');
                option.value = String(accountId);
                const label = getAccountLabel(accountId);
                option.textContent = label === getDefaultAccountLabel(accountId) ? label : `${label}（账号 ${accountId}）`;
                return option;
            }));
            select.dataset.accounts = signature;
        }
        const value = String(ids.includes(selectedId) ? selectedId : activeAccountId);
        if (select.value !== value) select.value = value;
        select.onchange = onChange;
        return select;
    }

    function createPrtsSwitch({ label, checked, onChange, configKey, icon = null } = {}) {
        const item = document.createElement('div');
        item.className = 'prts-panel-item';

        const labelText = document.createElement('span');
        labelText.className = 'prts-panel-item-label';
        const iconEl = createPrtsIcon(icon);
        if (iconEl) labelText.appendChild(iconEl);
        const textEl = document.createElement('span');
        textEl.textContent = label || '';
        labelText.appendChild(textEl);

        const switchLabel = document.createElement('label');
        switchLabel.className = 'prts-switch';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = checked === true;
        if (configKey) input.dataset.prtsConfigKey = configKey;
        if (label) input.setAttribute('aria-label', label);
        input.onchange = event => {
            if (typeof onChange === 'function') onChange(event.target.checked);
        };

        const slider = document.createElement('span');
        slider.className = 'prts-slider';
        slider.setAttribute('aria-hidden', 'true');

        switchLabel.appendChild(input);
        switchLabel.appendChild(slider);
        item.appendChild(labelText);
        item.appendChild(switchLabel);
        return item;
    }

    function closePrtsModal(resolveValue = null) {
        if (prtsModalCleanup) {
            prtsModalCleanup(resolveValue);
            prtsModalCleanup = null;
            return;
        }

        document.getElementById('prts-modal')?.remove();
        document.getElementById('prts-modal-backdrop')?.remove();
    }

    function appendPrtsModalMessage(parent, message) {
        if (message instanceof Node) {
            parent.appendChild(message);
            return;
        }

        const messageEl = document.createElement('div');
        messageEl.className = 'prts-modal-message';
        messageEl.textContent = String(message || '');
        parent.appendChild(messageEl);
    }

    function showPrtsModal({
        title,
        message,
        confirmText = '确定',
        cancelText = '取消',
        cancelValue = null,
        extraAction = null,
        tone = '',
        input = null
    } = {}) {
        return new Promise(resolve => {
            closePrtsModal(null);

            const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            const backdrop = document.createElement('div');
            backdrop.id = 'prts-modal-backdrop';

            const dialog = document.createElement('div');
            dialog.id = 'prts-modal';
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-modal', 'true');
            dialog.setAttribute('aria-labelledby', 'prts-modal-title');
            dialog.setAttribute('aria-describedby', 'prts-modal-message');

            const head = document.createElement('div');
            head.className = 'prts-modal-head';

            const titleEl = document.createElement('h2');
            titleEl.id = 'prts-modal-title';
            titleEl.className = 'prts-modal-title';
            titleEl.textContent = title || '';

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'prts-import-close';
            closeBtn.setAttribute('aria-label', '关闭窗口');
            closeBtn.appendChild(createPrtsIcon('close'));

            head.appendChild(titleEl);
            head.appendChild(closeBtn);

            const body = document.createElement('div');
            body.className = 'prts-modal-body';

            const messageWrap = document.createElement('div');
            messageWrap.id = 'prts-modal-message';
            appendPrtsModalMessage(messageWrap, message);
            body.appendChild(messageWrap);

            let inputEl = null;
            if (input) {
                const field = document.createElement('label');
                field.className = 'prts-modal-field';

                const fieldLabel = document.createElement('span');
                fieldLabel.className = 'prts-modal-field-label';
                fieldLabel.textContent = input.label || '';

                inputEl = document.createElement('input');
                inputEl.type = 'text';
                inputEl.className = 'prts-modal-input';
                inputEl.value = input.defaultValue || '';
                if (Number.isFinite(input.maxLength)) inputEl.maxLength = input.maxLength;

                field.appendChild(fieldLabel);
                field.appendChild(inputEl);
                body.appendChild(field);
            }

            const actions = document.createElement('div');
            actions.className = 'prts-modal-actions';

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'prts-import-action';
            cancelBtn.textContent = cancelText;

            const confirmBtn = document.createElement('button');
            confirmBtn.type = 'button';
            confirmBtn.className = `prts-import-action primary${tone ? ` ${tone}` : ''}`;
            confirmBtn.textContent = confirmText;

            if (extraAction) {
                const extraBtn = document.createElement('button');
                extraBtn.type = 'button';
                extraBtn.className = 'prts-import-action';
                extraBtn.textContent = extraAction.text;
                extraBtn.onclick = () => closePrtsModal(extraAction.value);
                actions.appendChild(extraBtn);
                actions.classList.add('prts-modal-actions-extra');
            }
            actions.appendChild(cancelBtn);
            actions.appendChild(confirmBtn);

            dialog.appendChild(head);
            dialog.appendChild(body);
            dialog.appendChild(actions);
            backdrop.appendChild(dialog);

            const finish = value => closePrtsModal(value);
            const handleKeydown = event => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    finish(null);
                }
                if (event.key === 'Tab') {
                    const focusable = getFocusableDialogElements(dialog);
                    if (focusable.length === 0) return;
                    const first = focusable[0];
                    const last = focusable[focusable.length - 1];
                    if (event.shiftKey && document.activeElement === first) {
                        event.preventDefault();
                        last.focus();
                    } else if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
                if (event.key === 'Enter' && inputEl && document.activeElement === inputEl) {
                    event.preventDefault();
                    finish(inputEl.value);
                }
            };

            closeBtn.onclick = () => finish(null);
            cancelBtn.onclick = () => finish(cancelValue);
            confirmBtn.onclick = () => finish(inputEl ? inputEl.value : true);
            backdrop.addEventListener('click', event => {
                if (event.target === backdrop) finish(null);
            });
            document.addEventListener('keydown', handleKeydown, true);

            prtsModalCleanup = value => {
                document.removeEventListener('keydown', handleKeydown, true);
                backdrop.remove();
                if (previousFocus?.isConnected) previousFocus.focus();
                resolve(value);
            };

            document.body.appendChild(backdrop);
            window.setTimeout(() => (inputEl || (tone === 'danger' ? cancelBtn : confirmBtn)).focus(), 0);
        });
    }

    function showPrtsConfirm(options = {}) {
        return showPrtsModal(options).then(value => value === true);
    }

    function showPrtsPrompt(options = {}) {
        return showPrtsModal({
            ...options,
            input: {
                label: options.inputLabel || '',
                defaultValue: options.defaultValue || '',
                maxLength: options.maxLength
            }
        }).then(value => (typeof value === 'string' ? value : null));
    }
