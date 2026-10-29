    const ACTIVITY_CACHE_KEY = 'prts_plus_activity_schedule_v1';
    let activitySchedule = [];
    let activityCheckedAt = 0;
    let activityUpdatePending = null;

    function validateActivitySchedule(data) {
        const validText = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 200;
        const validTimes = value => Number.isSafeInteger(value.startTime) && value.startTime > 0 &&
            Number.isSafeInteger(value.endTime) && value.endTime > value.startTime;
        if (!isPlainRecord(data) || data.schemaVersion !== 1 || !Array.isArray(data.activities) || !data.activities.length) {
            throw new Error('活动日程格式无效');
        }
        const ids = new Set();
        for (const activity of data.activities) {
            if (!isPlainRecord(activity) || !validText(activity.id) || ids.has(activity.id) ||
                !validText(activity.name) || !validTimes(activity) || !Array.isArray(activity.groups) || !activity.groups.length) {
                throw new Error('活动信息无效');
            }
            ids.add(activity.id);
            const stageIds = new Set();
            for (const group of activity.groups) {
                if (!isPlainRecord(group) || !validText(group.id) || typeof group.name !== 'string' || group.name.length > 200 ||
                    !['NORMAL', 'EX', 'S', 'OTHER'].includes(group.kind) || !validTimes(group) ||
                    group.startTime < activity.startTime || group.endTime > activity.endTime ||
                    !Array.isArray(group.stages) || !group.stages.length) throw new Error('活动分区无效');
                for (const stage of group.stages) {
                    if (!isPlainRecord(stage) || !validText(stage.id) || stageIds.has(stage.id) ||
                        !validText(stage.code) || !validText(stage.name) || !validText(stage.levelId)) throw new Error('活动关卡无效');
                    stageIds.add(stage.id);
                }
            }
        }
        return data;
    }

    function loadCachedActivitySchedule() {
        try {
            const cache = JSON.parse(GM_getValue(ACTIVITY_CACHE_KEY, 'null'));
            if (!cache) return;
            activitySchedule = validateActivitySchedule(cache.data).activities;
            activityCheckedAt = Number.isFinite(cache.checkedAt) && cache.checkedAt <= Date.now() ? cache.checkedAt : 0;
        } catch (error) {
            console.warn('[Better PRTS] 活动日程缓存读取失败', error);
        }
    }

    function updateActivitySchedule() {
        if (!CONFIG.activityShortcuts) return Promise.resolve(false);
        if (activityUpdatePending) return activityUpdatePending;
        if (Date.now() - activityCheckedAt < RESOURCE_CHECK_INTERVAL_MS) return Promise.resolve(false);
        activityCheckedAt = Date.now();
        const urls = RESOURCE_URLS.map(url => url.replace('/data.json', '/activities.json'));
        activityUpdatePending = downloadFirstValidJson(urls, validateActivitySchedule, 2 * 1024 * 1024).then(data => {
            activitySchedule = data.activities;
            try {
                GM_setValue(ACTIVITY_CACHE_KEY, JSON.stringify({ checkedAt: activityCheckedAt, data }));
            } catch (error) {
                console.warn('[Better PRTS] 活动日程缓存保存失败', error);
            }
            syncActivityShortcuts();
            return true;
        }).catch(error => {
            console.warn('[Better PRTS] 活动日程更新失败，保留已有日程', error);
            return false;
        }).finally(() => { activityUpdatePending = null; });
        return activityUpdatePending;
    }
