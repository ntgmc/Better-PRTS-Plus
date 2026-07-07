    // =========================================================================
    //                            MODULE 3.5: DOM UI HELPERS
    // =========================================================================

    const SVG_NS = 'http://www.w3.org/2000/svg';
    let prtsModalCleanup = null;

    const PRTS_ICON_PATHS = {
        account: 'M8 8c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0 1c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
        archive: 'M2 2h12v3H2V2zm1 4h10v8H3V6zm3 2v1.5h4V8H6z',
        check: 'M13.76 3.84l-7.2 7.2L3.04 7.52 1.6 8.96l5.04 5.04 8.64-8.64z',
        close: 'M3.72 2.28 8 6.56l4.28-4.28 1.44 1.44L9.44 8l4.28 4.28-1.44 1.44L8 9.44l-4.28 4.28-1.44-1.44L6.56 8 2.28 3.72z',
        download: 'M8 11.5 3.75 7.25l1.1-1.1L7.2 8.5V1h1.6v7.5l2.35-2.35 1.1 1.1L8 11.5zM2 13h12v1.6H2V13z',
        eyeOff: 'M6.41 7.83c-.03.39.07.79.31 1.12.24.34.59.58.98.68.39.1.81.02 1.15-.21.34-.23.59-.57.7-.96.1-.39.02-.8-.21-1.15-.16-.23-.38-.42-.64-.53L6.41 7.83z M2.05 2.64 1.03 3.66l12.9 12.07 1.02-1.02-2.08-2.09C14.05 11.84 15 10.72 16 8c0 0-3-5-8-5-1.23 0-2.36.3-3.37.8L2.05 2.64zM8 12c-2.21 0-4-1.79-4-4 0-.2.02-.39.05-.58l5.04 5.04C8.74 12.56 8.37 12 8 12z',
        eyeOn: 'M8 3C3 3 0 8 0 8s3 5 8 5 8-5 8-5-3-5-8-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z M8 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
        filter: 'M1 2h14L9.5 8v5.5L6.5 15V8L1 2z',
        import: 'M11 6h3l-6 6-6-6h3V1h6v5zm-9 8v2h12v-2h-2v1H4v-1H2z',
        layout: 'M14 3H2c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zm-1 9H9V4h4v8zM3 4h4v8H3V4z',
        link: 'M6.2 10.6 5.1 9.5l4.4-4.4 1.1 1.1-4.4 4.4zm-1.6 2.2c-1 0-1.9-.4-2.6-1.1-1.4-1.4-1.4-3.8 0-5.2l2.2-2.2 1.1 1.1-2.2 2.2c-.8.8-.8 2.2 0 3 .8.8 2.2.8 3 0l1.1 1.1c-.7.7-1.6 1.1-2.6 1.1zm7.2-1.1-1.1-1.1 2.2-2.2c.8-.8.8-2.2 0-3-.8-.8-2.2-.8-3 0L8.8 4.3c1.4-1.4 3.8-1.4 5.2 0 1.4 1.4 1.4 3.8 0 5.2l-2.2 2.2z',
        missing: 'M8 1.4 15.2 14H.8L8 1.4zm0 3.1L3.5 12.4h9L8 4.5zm-.8 2.4h1.6v2.9H7.2V6.9zm0 3.8h1.6v1.5H7.2v-1.5z',
        operators: 'M5.5 7.2A2.6 2.6 0 1 1 5.5 2a2.6 2.6 0 0 1 0 5.2zM1 13.5c.3-2.7 2.1-4.4 4.5-4.4s4.2 1.7 4.5 4.4H1zm10.6-4.3a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4zm-.8 4.3c-.1-1.2-.5-2.2-1.1-3 .5-.2 1.1-.3 1.9-.3 1.9 0 3.3 1.2 3.5 3.3h-4.3z',
        save: 'M2 1h10l2 2v12H2V1zm2 2v4h7V3H4zm1 8v2h6v-2H5z',
        settings: 'M9.5 1 10 3l1.8.8 1.8-.9 1.5 2.6-1.7 1.2c.1.4.1.8.1 1.3s0 .9-.1 1.3l1.7 1.2-1.5 2.6-1.8-.9-1.8.8-.5 2h-3l-.5-2-1.8-.8-1.8.9L.9 10.5l1.7-1.2C2.5 8.9 2.5 8.5 2.5 8s0-.9.1-1.3L.9 5.5l1.5-2.6 1.8.9L6 3l.5-2h3zM8 5.2A2.8 2.8 0 1 0 8 10.8 2.8 2.8 0 0 0 8 5.2z',
        support: 'M12 6.4c0-1.77-1.43-3.2-3.2-3.2S5.6 4.63 5.6 6.4s1.43 3.2 3.2 3.2 3.2-1.43 3.2-3.2zm-3.2 1.6c-.88 0-1.6-.72-1.6-1.6s.72-1.6 1.6-1.6 1.6.72 1.6 1.6-.72 1.6-1.6 1.6zm6.4 6.4H.8V12c0-.88.72-1.6 1.6-1.6h9.6c.88 0 1.6.72 1.6 1.6v2.4z',
        upload: 'M8 4.5 3.75 8.75l1.1 1.1L7.2 7.5V15h1.6V7.5l2.35 2.35 1.1-1.1L8 4.5zM2 1h12v1.6H2V1z',
        video: 'M2 3h8c.55 0 1 .45 1 1v2l3-2v8l-3-2v2c0 .55-.45 1-1 1H2c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1z'
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

    function showPrtsToast(message, type = 'info', detail = '') {
        const container = ensurePrtsToastContainer();
        const toastType = ['success', 'warning', 'error'].includes(type) ? type : '';
        const toast = document.createElement('div');
        toast.className = `prts-toast${toastType ? ` ${toastType}` : ''}`;

        const title = document.createElement('div');
        title.className = 'prts-toast-title';
        title.textContent = message;
        toast.appendChild(title);

        if (detail) {
            const detailEl = document.createElement('div');
            detailEl.className = 'prts-toast-detail';
            detailEl.textContent = detail;
            toast.appendChild(detailEl);
        }

        container.appendChild(toast);
        window.setTimeout(() => {
            toast.classList.add('is-leaving');
            window.setTimeout(() => toast.remove(), 220);
        }, 4000);
    }

    function createSvgIconFromPath(pathData, viewBox = '0 0 16 16') {
        const span = document.createElement('span');
        span.className = 'bp4-icon';
        span.setAttribute('aria-hidden', 'true');

        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('viewBox', viewBox);
        svg.setAttribute('fill', 'currentColor');
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
                return imported;
            }
        } catch (error) {
            console.warn('[Better PRTS] Failed to render Skland icon', error);
        }

        return createSvgIconFromPath('M2 2h12v12H2z');
    }

    function createPrtsIcon(icon) {
        if (!icon) return null;
        if (icon === 'skland' || icon.type === 'skland') return createSklandIconImage();
        if (typeof icon === 'string') return createSvgIconFromPath(PRTS_ICON_PATHS[icon] || icon);
        if (icon.path) return createSvgIconFromPath(icon.path, icon.viewBox || '0 0 16 16');
        if (icon instanceof Node) return icon.cloneNode(true);
        return null;
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

            actions.appendChild(cancelBtn);
            actions.appendChild(confirmBtn);

            dialog.appendChild(head);
            dialog.appendChild(body);
            dialog.appendChild(actions);
            backdrop.appendChild(dialog);

            const finish = value => closePrtsModal(value);
            const handleKeydown = event => {
                if (event.key === 'Escape') finish(null);
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
            cancelBtn.onclick = () => finish(null);
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
            window.setTimeout(() => (inputEl || confirmBtn).focus(), 0);
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
