    function safeJsonParse(rawValue, fallback) {
        try {
            return JSON.parse(typeof rawValue === 'string' ? rawValue.replace(/^\uFEFF/, '') : rawValue);
        } catch (e) {
            return fallback;
        }
    }

    function isSklandHost() {
        return /(^|\.)skland\.com$/i.test(window.location.hostname);
    }

    function isPrtsHost() {
        return /(^|\.)prts\.plus$/i.test(window.location.hostname) || /(^|\.)zoot\.plus$/i.test(window.location.hostname);
    }

    function isPlainRecord(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function stringValue(value) {
        if (typeof value === 'string') return value.trim();
        if (typeof value === 'number' && Number.isFinite(value)) return String(value);
        return '';
    }
    function parseFloatingPosition(rawValue) {
        const fallback = { top: '40%', isRight: true };
        const parsed = typeof rawValue === 'string' ? safeJsonParse(rawValue, fallback) : rawValue;
        const topValue = typeof parsed?.top === 'string' ? parsed.top : fallback.top;
        const topNumber = /^-?\d+(?:\.\d+)?%$/.test(topValue) ? parseFloat(topValue) : parseFloat(fallback.top);
        const clampedTop = Math.min(95, Math.max(0, topNumber));

        return {
            top: `${Number(clampedTop.toFixed(1))}%`,
            isRight: parsed?.isRight !== false
        };
    }

    function normalizeFilterMode(mode) {
        return ['NONE', 'PERFECT', 'SUPPORT'].includes(mode) ? mode : 'NONE';
    }


