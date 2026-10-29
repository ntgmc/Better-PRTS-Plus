    let activityPreview = null;
    let activityShortcutsExpanded = null;

    function setActivityPreview(enabled) {
        if (enabled) {
            const levels = (getStageFilter()?.levels || []).filter(level => level.catOne === '活动关卡');
            const source = levels.find(level => /-S-\d+$/.test(level.catThree));
            if (!source) {
                showPrtsToast('暂时无法模拟活动', 'warning', '请在作业列表加载关卡后重试。');
                return;
            }
            const now = Math.floor(Date.now() / 1000);
            activityPreview = {
                id: 'diagnostic-preview', name: `模拟活动 · ${source.catTwo}`, startTime: now, endTime: now + 3600,
                groups: [['NORMAL', /^[A-Z\d]+-\d+$/], ['EX', /-EX-\d+$/], ['S', /-S-\d+$/]].map(([kind, pattern]) => ({
                    id: `preview-${kind}`, name: '', kind, startTime: now + (kind === 'S' ? 60 : 0), endTime: now + 3600,
                    stages: levels.filter(level => level.catTwo === source.catTwo && pattern.test(level.catThree))
                        .map(level => ({ id: level.stageId, code: level.catThree, name: level.name, levelId: level.levelId }))
                })).filter(group => group.stages.length)
            };
        } else activityPreview = null;
        const button = document.getElementById('prts-activity-preview');
        if (button) {
            button.textContent = activityPreview ? '结束模拟活动' : '模拟活动';
            button.setAttribute('aria-pressed', String(Boolean(activityPreview)));
        }
        if (activityPreview) activityShortcutsExpanded = true;
        syncActivityShortcuts(Boolean(activityPreview));
    }

    function getActiveActivities(schedule, now = Math.floor(Date.now() / 1000)) {
        return schedule.filter(activity => activity.startTime <= now && now <= activity.endTime).map(activity => ({
            ...activity,
            groups: activity.groups.map(group => ({ ...group,
                state: now < group.startTime ? 'upcoming' : now > group.endTime ? 'ended' : 'open'
            }))
        }));
    }

    function formatActivityTime(timestamp) {
        return new Intl.DateTimeFormat('zh-CN', {
            timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
        }).format(new Date(timestamp * 1000));
    }

    function collapseActivityShortcutsOnFocus(event) {
        const panel = document.getElementById('prts-activity-shortcuts');
        if (!panel || panel.contains(event.target) || !event.target.matches?.(':focus-visible') ||
            event.target.closest?.('.bp4-overlay:has(.bp4-overlay-backdrop), .bp6-overlay:has(.bp6-overlay-backdrop)')) return;
        const target = event.target.getBoundingClientRect();
        const bounds = panel.getBoundingClientRect();
        if (target.left < bounds.right && target.right > bounds.left && target.top < bounds.bottom && target.bottom > bounds.top) {
            panel.querySelector('details').open = false;
        }
    }

    function syncActivityShortcuts(restoreExpanded = false) {
        let panel = document.getElementById('prts-activity-shortcuts');
        const filter = (CONFIG.activityShortcuts || activityPreview) && !isFilterDisabledPage() ? getStageFilter() : null;
        const activities = filter ? getActiveActivities(activityPreview ? [activityPreview] : activitySchedule) : [];
        if (!activities.length) {
            panel?.remove();
            return;
        }
        if (!panel) {
            panel = document.createElement('aside');
            panel.id = 'prts-activity-shortcuts';
            panel.setAttribute('aria-label', '活动关卡快捷筛选');
            const details = document.createElement('details');
            activityShortcutsExpanded ??= window.innerWidth >= 640;
            details.open = activityShortcutsExpanded;
            const summary = document.createElement('summary');
            summary.textContent = '活动关卡';
            summary.onclick = () => { activityShortcutsExpanded = !details.open; };
            details.appendChild(summary);
            const body = document.createElement('div');
            body.className = 'prts-activity-body';
            details.appendChild(body);
            panel.appendChild(details);
            panel.appendChild(createPrtsButton({
                className: 'prts-btn prts-activity-close', icon: 'close', ariaLabel: '关闭活动关卡快捷筛选',
                title: '关闭后可在设置 → 页面增强中恢复', onClick: () => {
                    if (activityPreview) {
                        setActivityPreview(false);
                        document.querySelector('.prts-float-btn')?.focus({ preventScroll: true });
                        return;
                    }
                    CONFIG.activityShortcuts = false;
                    saveConfig();
                    refreshAccountControls();
                    panel.remove();
                    document.querySelector('.prts-float-btn')?.focus({ preventScroll: true });
                    showPrtsToast('已关闭活动关卡快捷筛选', 'info', '可在设置 → 页面增强中重新开启。');
                }
            }));
            document.body.appendChild(panel);
        }
        if (restoreExpanded) panel.querySelector('details').open = activityShortcutsExpanded;
        panel.classList.toggle('prts-activity-left', CONFIG.floatingPosition.isRight);
        const levels = new Map(filter.levels.flatMap(level => [[level.stageId, level], [level.levelId, level]]));
        const signature = JSON.stringify(activities);
        const body = panel.querySelector('.prts-activity-body');
        if (panel.dataset.signature !== signature) {
            body.replaceChildren();
            for (const activity of activities) {
                const heading = document.createElement('h2');
                heading.textContent = activity.name;
                body.appendChild(heading);
                const end = document.createElement('p');
                end.className = 'prts-activity-time';
                end.textContent = `至 ${formatActivityTime(activity.endTime)}（北京时间）`;
                body.appendChild(end);
                for (const group of activity.groups) {
                    const section = document.createElement('section');
                    const title = document.createElement('h3');
                    const label = { NORMAL: '普通关', EX: 'EX 关', S: 'S 关', OTHER: '特殊关' }[group.kind];
                    title.textContent = `${label}${group.name ? ` · ${group.name}` : ''}`;
                    section.appendChild(title);
                    const status = document.createElement('p');
                    status.className = 'prts-activity-time';
                    status.textContent = group.state === 'upcoming' ? `${formatActivityTime(group.startTime)} 开放（北京时间）`
                        : group.state === 'ended' ? '已结束' : '已开放';
                    section.appendChild(status);
                    const buttons = document.createElement('div');
                    buttons.className = 'prts-activity-stages';
                    for (const stage of group.stages) {
                        const button = createPrtsButton({
                            text: stage.code, ariaLabel: `筛选关卡：${stage.code} ${stage.name}`,
                            onClick: () => {
                                const now = Math.floor(Date.now() / 1000);
                                if ((!CONFIG.activityShortcuts && !activityPreview) || now < group.startTime || now > group.endTime) {
                                    syncActivityShortcuts();
                                    return;
                                }
                                if (applyStageFilter(button.dataset.stageId)) syncActivityShortcuts();
                            }
                        });
                        button.dataset.activityStage = stage.id;
                        buttons.appendChild(button);
                    }
                    section.appendChild(buttons);
                    body.appendChild(section);
                }
            }
            panel.dataset.signature = signature;
        }
        const groups = new Map(activities.flatMap(activity => activity.groups.flatMap(group =>
            group.stages.map(stage => [stage.id, { group, stage }]))));
        body.querySelectorAll('[data-activity-stage]').forEach(button => {
            const { group, stage } = groups.get(button.dataset.activityStage);
            const level = levels.get(stage.id) || levels.get(stage.levelId);
            button.dataset.stageId = level?.stageId || stage.id;
            button.disabled = group.state !== 'open' || !level;
            button.title = `${stage.name}${group.state === 'upcoming' ? ' · 尚未开放'
                : group.state === 'ended' ? ' · 已结束' : !level ? ' · 作业站尚未收录' : ''}`;
            button.setAttribute('aria-pressed', String(Boolean(level) && filter.value === level.stageId));
        });
    }
