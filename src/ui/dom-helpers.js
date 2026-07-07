    // =========================================================================
    //                            MODULE 3.5: DOM UI HELPERS
    // =========================================================================

    const SVG_NS = 'http://www.w3.org/2000/svg';
    let prtsModalCleanup = null;

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
        if (typeof icon === 'string') return createSvgIconFromPath(icon);
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
        btn.style.opacity = disabled ? '0.5' : '1';
        btn.style.cursor = disabled ? 'not-allowed' : 'pointer';

        if (title) btn.title = title;
        else btn.removeAttribute('title');

        if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
        else btn.removeAttribute('aria-label');

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

    function createPrtsSwitch({ label, checked, onChange, configKey } = {}) {
        const item = document.createElement('div');
        item.className = 'prts-panel-item';

        const labelText = document.createElement('span');
        labelText.textContent = label || '';

        const switchLabel = document.createElement('label');
        switchLabel.className = 'prts-switch';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = checked === true;
        if (configKey) input.dataset.prtsConfigKey = configKey;
        input.onchange = event => {
            if (typeof onChange === 'function') onChange(event.target.checked);
        };

        const slider = document.createElement('span');
        slider.className = 'prts-slider';

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
            closeBtn.textContent = '×';

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
