    const RELEASE_LEVELS = { normal: '普通更新', important: '重要更新', urgent: '紧急更新' };

    function parseScriptVersion(version) {
        const match = typeof version === 'string' && version.match(/^(\d+(?:\.\d+){1,3})(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/);
        if (!match || version.length > 100) throw new Error('脚本版本号无效');
        const numbers = match[1].split('.').map(Number);
        if (!numbers.every(Number.isSafeInteger)) throw new Error('脚本版本号超出范围');
        return { numbers, prerelease: match[2]?.split('.') || [] };
    }

    function compareScriptVersions(left, right) {
        const a = parseScriptVersion(left);
        const b = parseScriptVersion(right);
        for (let i = 0; i < 4; i++) {
            const difference = (a.numbers[i] || 0) - (b.numbers[i] || 0);
            if (difference) return Math.sign(difference);
        }
        if (!a.prerelease.length || !b.prerelease.length) {
            return Number(!a.prerelease.length) - Number(!b.prerelease.length);
        }
        for (let i = 0; i < Math.max(a.prerelease.length, b.prerelease.length); i++) {
            const x = a.prerelease[i];
            const y = b.prerelease[i];
            if (x === undefined || y === undefined) return x === undefined ? -1 : 1;
            if (x === y) continue;
            const numericX = /^\d+$/.test(x);
            const numericY = /^\d+$/.test(y);
            if (numericX && numericY) {
                const difference = BigInt(x) - BigInt(y);
                if (difference) return difference > 0n ? 1 : -1;
                continue;
            }
            if (numericX !== numericY) return numericX ? -1 : 1;
            return x > y ? 1 : -1;
        }
        return 0;
    }

    function validateReleaseManifest(data) {
        if (!data || data.schemaVersion !== 1 || !Array.isArray(data.releases)) {
            throw new Error('更新说明格式无效');
        }
        const releases = [...data.releases];
        releases.forEach(release => {
            if (!release || typeof release !== 'object' || !Object.hasOwn(RELEASE_LEVELS, release.level) ||
                typeof release.notes !== 'string' || !release.notes.trim() || release.notes.length > 12000 ||
                release.humanWritten !== true) {
                throw new Error('每个版本必须填写更新级别和人工撰写的更新说明，并确认 humanWritten');
            }
            parseScriptVersion(release.version);
        });
        releases.sort((a, b) => compareScriptVersions(b.version, a.version));
        if (releases.some((release, index) => index && compareScriptVersions(release.version, releases[index - 1].version) === 0)) {
            throw new Error('更新说明包含重复版本');
        }
        return { schemaVersion: 1, releases };
    }
