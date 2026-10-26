    function getAccountIds(value = accountsData) {
        return Object.keys(value || {})
            .filter(key => /^[1-9]\d*$/.test(key) && Number.isSafeInteger(Number(key)))
            .map(Number).sort((a, b) => a - b);
    }

    function createEmptyAccountsData(ids = LEGACY_ACCOUNT_IDS) {
        return Object.fromEntries(ids.map(id => [id, []]));
    }

    function getDefaultAccountLabel(id) {
        return `账号 ${normalizeAccountId(id)}`;
    }

    function createDefaultAccountMeta(ids = LEGACY_ACCOUNT_IDS) {
        const meta = {};
        ids.forEach(id => {
            meta[id] = { label: getDefaultAccountLabel(id), labelSource: 'default' };
        });
        return meta;
    }

    function normalizeAccountId(id) {
        const parsed = Number(id);
        return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
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

    function normalizeOperatorTraining(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
        const limits = { elite: [0, 2], level: [1, 90], potential: [1, 6], mainSkill: [1, 7],
            skill1: [0, 3], skill2: [0, 3], skill3: [0, 3],
            modX: [0, 3], modY: [0, 3], modD: [0, 3], modA: [0, 3], modB: [0, 3] };
        const result = {};
        Object.entries(limits).forEach(([key, [min, max]]) => {
            const raw = value[key];
            if (typeof raw !== 'number' && (typeof raw !== 'string' || !raw.trim())) return;
            const number = Number(raw);
            if (Number.isInteger(number) && number >= min && number <= max) result[key] = number;
        });
        return result;
    }

    function normalizeAccountsTraining(value, accounts) {
        const result = {};
        getAccountIds(accounts).forEach(id => {
            result[id] = {};
            (accounts[id] || []).forEach(name => {
                if (!Object.prototype.hasOwnProperty.call(value?.[id] || {}, name)) return;
                const training = normalizeOperatorTraining(value[id][name]);
                if (Object.keys(training).length) {
                    Object.defineProperty(result[id], name, { value: training, enumerable: true, configurable: true });
                }
            });
        });
        return result;
    }

    function normalizeAccountsData(value) {
        const ids = isPlainRecord(value) ? getAccountIds(value) : [];
        const normalized = createEmptyAccountsData(ids.length ? ids : LEGACY_ACCOUNT_IDS);
        if (!isPlainRecord(value)) return normalized;

        getAccountIds(normalized).forEach(id => {
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

    function normalizeSklandSyncText(value, maxLength = 64) {
        return stringValue(value).replace(/[\x00-\x1F\x7F]/g, '').slice(0, maxLength);
    }

    function normalizeSklandSyncMeta(value) {
        if (!isPlainRecord(value)) return null;

        const importedAtText = normalizeSklandSyncText(value.importedAt);
        const importedAtDate = new Date(importedAtText);
        if (!importedAtText || Number.isNaN(importedAtDate.getTime())) return null;

        const operatorCount = Number(value.operatorCount);
        return {
            uid: normalizeSklandSyncText(value.uid),
            nickname: normalizeSklandSyncText(value.nickname),
            importedAt: importedAtDate.toISOString(),
            operatorCount: Number.isFinite(operatorCount) && operatorCount > 0 ? Math.floor(operatorCount) : 0
        };
    }

    function normalizeSklandImportSummary(value) {
        if (!isPlainRecord(value)) return null;
        const skland = normalizeSklandSyncMeta(value);
        if (!skland) return null;

        return {
            accountId: normalizeAccountId(value.accountId),
            accountLabel: stringValue(value.accountLabel),
            ...skland
        };
    }

    function formatSklandSyncTime(importedAt) {
        const date = new Date(stringValue(importedAt));
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
    }

    function formatSklandSyncSummary(meta, options = {}) {
        const skland = normalizeSklandSyncMeta(meta);
        if (!skland) return '';

        const timeText = formatSklandSyncTime(skland.importedAt);
        const separator = options.compact ? ' ' : '：';
        const lines = [timeText ? `来自森空岛 · 上次同步${separator}${timeText}` : '来自森空岛'];
        if (options.includeDetail) {
            lines.push(`${skland.nickname || '博士'} / UID ${skland.uid || '未知'} / ${skland.operatorCount} 名干员`);
        }
        return lines.join('\n');
    }

    function normalizeAccountMeta(value, ids = LEGACY_ACCOUNT_IDS) {
        const normalized = createDefaultAccountMeta(ids);
        if (!isPlainRecord(value)) return normalized;

        ids.forEach(id => {
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
            const nextMeta = { label, labelSource };
            const skland = normalizeSklandSyncMeta(raw.skland);
            if (skland) nextMeta.skland = skland;
            normalized[id] = nextMeta;
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

    function isOwnedOperatorRecord(op) {
        if (!op || typeof op !== 'object') return false;
        if (!Object.prototype.hasOwnProperty.call(op, 'own')) return true;

        const own = op.own;
        if (own === false || own === 0) return false;
        if (typeof own === 'string' && ['false', '0', 'no'].includes(own.trim().toLowerCase())) return false;
        return true;
    }

    function parseOperatorNamesFromJson(json) {
        if (!Array.isArray(json)) throw new Error('JSON 数据格式错误：干员名单必须是数组。');
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
        return parseImportedOperators(rawText, fileName).names;
    }

    function parseImportedOperators(rawText, fileName = '') {
        const text = String(rawText || '');
        const records = safeJsonParse(text, undefined);
        if (records === undefined) {
            if (/^[\[{]/.test(text.replace(/^\uFEFF/, '').trimStart()) || /\.json$/i.test(fileName)) {
                throw new Error('JSON 格式错误，请检查内容是否完整、语法是否正确。');
            }
            return { names: parseOperatorNamesFromText(text), training: {} };
        }
        const names = parseOperatorNamesFromJson(records);
        const importedNames = new Set(names);
        const training = {};
        records.forEach(op => {
            if (!isOwnedOperatorRecord(op)) return;
            const name = normalizeOperatorName(op?.name);
            if (!importedNames.has(name)) return;
            Object.defineProperty(training, name, {
                value: normalizeOperatorTraining(op), enumerable: true, configurable: true
            });
        });
        return { names, training };
    }
