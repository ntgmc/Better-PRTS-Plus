    function createEmptyAccountsData() {
        return { 1: [], 2: [], 3: [] };
    }

    function getDefaultAccountLabel(id) {
        return `账号 ${normalizeAccountId(id)}`;
    }

    function createDefaultAccountMeta() {
        const meta = {};
        ACCOUNT_IDS.forEach(id => {
            meta[id] = { label: getDefaultAccountLabel(id), labelSource: 'default' };
        });
        return meta;
    }

    function normalizeAccountId(id) {
        const parsed = parseInt(id, 10);
        return ACCOUNT_IDS.includes(parsed) ? parsed : 1;
    }

    function normalizeOperatorName(name) {
        return typeof name === 'string' ? name.trim() : '';
    }

    function sanitizeOperatorNames(names) {
        if (!Array.isArray(names)) return [];

        const seen = new Set();
        const result = [];
        names.forEach(name => {
            const normalized = normalizeOperatorName(name);
            if (!normalized) return;
            if (normalized.length > 50) return;
            if (/[\x00-\x1F\x7F]/.test(normalized)) return;
            if (seen.has(normalized)) return;
            seen.add(normalized);
            result.push(normalized);
        });
        return result;
    }

    function normalizeAccountsData(value) {
        const normalized = createEmptyAccountsData();
        if (!value || typeof value !== 'object') return normalized;

        ACCOUNT_IDS.forEach(id => {
            normalized[id] = sanitizeOperatorNames(value[id]);
        });
        return normalized;
    }

    function normalizeAccountLabel(label, id) {
        const cleaned = typeof label === 'string'
            ? label.replace(/[\x00-\x1F\x7F]/g, '').trim()
            : '';
        return cleaned ? cleaned.slice(0, ACCOUNT_LABEL_MAX_LENGTH) : getDefaultAccountLabel(id);
    }

    function normalizeAccountLabelSource(source) {
        return ['default', 'manual', 'skland'].includes(source) ? source : 'default';
    }

    function normalizeAccountMeta(value) {
        const normalized = createDefaultAccountMeta();
        if (!value || typeof value !== 'object') return normalized;

        ACCOUNT_IDS.forEach(id => {
            const raw = value[id];
            if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;

            const rawLabel = typeof raw.label === 'string'
                ? raw.label.replace(/[\x00-\x1F\x7F]/g, '').trim()
                : '';
            const label = normalizeAccountLabel(rawLabel, id);
            let labelSource = rawLabel ? normalizeAccountLabelSource(raw.labelSource) : 'default';
            if (label === getDefaultAccountLabel(id) && labelSource !== 'skland') {
                labelSource = 'default';
            }
            normalized[id] = { label, labelSource };
        });
        return normalized;
    }

    function getAccountLabel(id) {
        const accountId = normalizeAccountId(id);
        const meta = accountMeta && accountMeta[accountId];
        return meta?.label || getDefaultAccountLabel(accountId);
    }

    function getAccountOperatorCount(id) {
        return (accountsData[normalizeAccountId(id)] || []).length;
    }

    function safeJsonParse(rawValue, fallback) {
        try {
            return JSON.parse(rawValue);
        } catch (e) {
            return fallback;
        }
    }

    function isOwnedOperatorRecord(op) {
        if (!op || typeof op !== 'object') return false;
        if (!Object.prototype.hasOwnProperty.call(op, 'own')) return true;

        const own = op.own;
        if (own === false || own === 0) return false;
        if (typeof own === 'string' && ['false', '0', 'no'].includes(own.trim().toLowerCase())) return false;
        return true;
    }

    function parseOperatorNamesFromJson(json) {
        if (!Array.isArray(json)) throw new Error('数据格式非数组');
        if (json.length === 0) return [];

        if (typeof json[0] === 'string') {
            return sanitizeOperatorNames(json);
        }

        if (typeof json[0] === 'object' && json[0] !== null && 'name' in json[0]) {
            return sanitizeOperatorNames(
                json
                    .filter(isOwnedOperatorRecord)
                    .map(op => normalizeOperatorName(op?.name))
            );
        }

        return [];
    }

    function parseOperatorNamesFromText(text) {
        return sanitizeOperatorNames(
            String(text || '')
                .replace(/^\uFEFF/, '')
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#') && !line.startsWith('//'))
        );
    }

    function parseImportedOperatorNames(rawText, fileName = '') {
        const text = String(rawText || '');

        const parsed = safeJsonParse(text, null);
        if (parsed !== null) return parseOperatorNamesFromJson(parsed);
        if (/\.json$/i.test(fileName)) throw new Error('文件格式错误：不是有效的 JSON 文件');

        return parseOperatorNamesFromText(text);
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

