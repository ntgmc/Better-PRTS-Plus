    const SCRIPT_RELEASE_URL = 'https://github.com/ntgmc/Better-PRTS-Plus/releases';
    const SCRIPT_UPDATE_URL = `${SCRIPT_RELEASE_URL}/latest/download/update.json`;
    const SCRIPT_UPDATE_URLS = [
        SCRIPT_UPDATE_URL,
        `https://gh-proxy.com/${SCRIPT_UPDATE_URL}`,
        `https://ghfast.top/${SCRIPT_UPDATE_URL}`
    ];
    const SCRIPT_IGNORED_VERSION_KEY = 'prts_plus_ignored_script_version';
    const SCRIPT_UPDATE_INTERVAL_MS = 60 * 60 * 1000;
    let scriptUpdatePending = null;
    let scriptUpdateManifest = null;
    let scriptUpdateCheckedAt = 0;
    let scriptUpdateAttemptedAt = 0;
    let scriptUpdatePromptedVersion = '';

    function getAvailableScriptUpdate(manifest, currentVersion) {
        const releases = validateReleaseManifest(manifest).releases.filter(release =>
            !parseScriptVersion(release.version).prerelease.length && compareScriptVersions(release.version, currentVersion) > 0);
        if (!releases.length) return null;
        const level = releases.some(release => release.level === 'urgent') ? 'urgent'
            : releases.some(release => release.level === 'important') ? 'important' : 'normal';
        return { version: releases[0].version, level, releases };
    }

    function downloadScriptUpdateManifest() {
        return downloadFirstValidJson(SCRIPT_UPDATE_URLS, data => {
            const manifest = validateReleaseManifest(data);
            const latest = manifest.releases.find(release => !parseScriptVersion(release.version).prerelease.length);
            const knownLatest = scriptUpdateManifest?.releases.find(release => !parseScriptVersion(release.version).prerelease.length);
            if ((latest && compareScriptVersions(latest.version, knownLatest?.version || GM_info.script.version) < 0) ||
                (!latest && knownLatest)) {
                throw new Error('更新说明早于当前已知版本');
            }
            return manifest;
        }, 1024 * 1024);
    }

    async function promptScriptUpdate(manifest, manual) {
        const currentVersion = GM_info.script.version;
        const update = getAvailableScriptUpdate(manifest, currentVersion);
        if (!update) {
            if (manual) showPrtsToast('当前已是最新正式版', 'success', `当前版本：${currentVersion}`);
            return false;
        }
        if (!manual && (scriptUpdatePromptedVersion === update.version ||
            GM_getValue(SCRIPT_IGNORED_VERSION_KEY, '') === update.version ||
            (CONFIG.importantUpdatesOnly && update.level === 'normal'))) return false;
        // 避免自动检查打断正在操作的子面板、导入或确认窗口；下一轮检查继续提示。
        if (document.getElementById('prts-modal') || document.getElementById('prts-import-dialog') ||
            (!manual && document.querySelector('.prts-submenu-panel.is-open'))) {
            if (manual) showPrtsToast('发现新版本', 'info', '请先关闭当前窗口，再点击“检查脚本更新”。');
            return false;
        }
        scriptUpdatePromptedVersion = update.version;
        const choice = await showScriptUpdateModal(update);
        try {
            if (choice === 'important') {
                const previous = CONFIG.importantUpdatesOnly;
                CONFIG.importantUpdatesOnly = true;
                try { saveConfig(); } catch (error) { CONFIG.importantUpdatesOnly = previous; throw error; }
                document.querySelectorAll('[data-prts-config-key="importantUpdatesOnly"]').forEach(input => { input.checked = true; });
                showPrtsToast('已改为仅提示重要和紧急更新', 'success');
            } else if (choice === 'skip') {
                GM_setValue(SCRIPT_IGNORED_VERSION_KEY, update.version);
            } else if (choice === true) {
                // 安装链接固定到已检测的版本，避免检查与安装之间切换版本。
                GM_openInTab(`${SCRIPT_RELEASE_URL}/download/v${encodeURIComponent(update.version)}/Better-PRTS-Plus.user.js`, { active: true, insert: true });
            }
        } catch (error) {
            scriptUpdatePromptedVersion = '';
            showPrtsToast('更新操作未完成', 'error', error.message || '请重试。');
        }
        return true;
    }

    function appendReleaseNoteText(container, text) {
        let offset = 0;
        // 只创建白名单节点；HTML 保留为文字，链接只允许 HTTP(S)。
        const tokens = /`([^`\n]+)`|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;
        for (const match of text.matchAll(tokens)) {
            container.appendChild(document.createTextNode(text.slice(offset, match.index)));
            const node = document.createElement(match[1] ? 'code' : match[2] ? 'strong' : match[3] ? 'em' : 'a');
            node.textContent = match[1] || match[2] || match[3] || match[4];
            if (match[5]) {
                node.href = match[5];
                node.target = '_blank';
                node.rel = 'noopener noreferrer';
            }
            container.appendChild(node);
            offset = match.index + match[0].length;
        }
        container.appendChild(document.createTextNode(text.slice(offset)));
    }

    function renderReleaseNotes(markdown) {
        const content = document.createElement('div');
        content.className = 'prts-release-notes';
        let list = null, paragraph = null;
        for (const line of markdown.split(/\r?\n/)) {
            if (!line.trim()) { list = null; paragraph = null; continue; }
            const heading = line.match(/^ {0,3}#{1,6}\s+(.+?)(?:\s+#+)?$/);
            const item = line.match(/^ {0,3}(?:[-+*]|(\d+)[.)])\s+(.+)$/);
            if (heading) {
                list = null; paragraph = null;
                const title = document.createElement('h4');
                appendReleaseNoteText(title, heading[1]);
                content.appendChild(title);
            } else if (item) {
                paragraph = null;
                const tag = item[1] ? 'ol' : 'ul';
                if (!list || list.tagName.toLowerCase() !== tag) {
                    list = document.createElement(tag);
                    if (item[1]) list.start = Number(item[1]);
                    content.appendChild(list);
                }
                const entry = document.createElement('li');
                appendReleaseNoteText(entry, item[2]);
                list.appendChild(entry);
            } else {
                if (list && /^\s+/.test(line)) {
                    appendReleaseNoteText(list.lastChild, '\n' + line.trim());
                    continue;
                }
                list = null;
                if (!paragraph) {
                    paragraph = document.createElement('p');
                    content.appendChild(paragraph);
                } else paragraph.appendChild(document.createTextNode('\n'));
                appendReleaseNoteText(paragraph, line);
            }
        }
        return content;
    }

    function showScriptUpdateModal(update, preview = false) {
        const message = document.createElement('div');
        message.className = 'prts-update-notes';
        const versions = document.createElement('p');
        versions.textContent = `当前版本：${GM_info.script.version}\n新版本：${update.version} · ${RELEASE_LEVELS[update.level]}`;
        message.appendChild(versions);
        for (const release of update.releases) {
            const title = document.createElement('h3');
            title.textContent = `${release.version} · ${RELEASE_LEVELS[release.level]}`;
            message.appendChild(title);
            message.appendChild(renderReleaseNotes(release.notes));
        }
        const hint = document.createElement('p');
        hint.textContent = preview ? '这是样式预览，点击下方按钮仅显示操作反馈。'
            : '点击“立即更新”后，请在油猴页面确认安装，再刷新当前页面。';
        message.appendChild(hint);
        return showPrtsModal({
            title: preview ? 'Better-PRTS-Plus 更新弹窗预览' : 'Better-PRTS-Plus 发现新版本', message,
            extraAction: { text: '仅重要更新提示', value: 'important' },
            cancelText: '当前版本不再提示', cancelValue: 'skip', confirmText: '立即更新'
        });
    }

    async function previewScriptUpdate(level = 'important') {
        if (!Object.hasOwn(RELEASE_LEVELS, level)) throw new Error('更新级别无效');
        if (document.getElementById('prts-modal') || document.getElementById('prts-import-dialog')) {
            showPrtsToast('请先关闭当前窗口', 'info', '关闭后可继续预览更新弹窗。');
            return false;
        }
        const release = {
            version: '99.0.0', level,
            notes: '以下内容为样式测试示例。\n\n### 新增\n\n- 展示新版本、**更新级别**和分类更新说明。\n\n### 优化\n\n- 可切换网站的浅色、深色或高对比主题，重复预览。\n\n### 修复\n\n- 检查较窄屏幕上的长文本换行，确认内容完整显示，底部操作按钮清晰可用。'
        };
        const choice = await showScriptUpdateModal({ ...release, releases: [release] }, true);
        if (choice !== null) {
            const action = choice === 'important' ? '仅重要更新提示' : choice === 'skip' ? '当前版本不再提示' : '立即更新';
            showPrtsToast('预览操作', 'info', `已点击“${action}”。`);
        }
        return choice;
    }

    betterPrtsDebug.previewScriptUpdate = previewScriptUpdate;

    function checkScriptUpdates(manual = false) {
        if (scriptUpdatePending) return scriptUpdatePending;
        if (!manual && !scriptUpdateManifest && Date.now() - scriptUpdateAttemptedAt < 5 * 60 * 1000) return Promise.resolve(false);
        scriptUpdatePending = (async () => {
            try {
                if (manual || !scriptUpdateManifest || Date.now() - scriptUpdateCheckedAt >= SCRIPT_UPDATE_INTERVAL_MS) {
                    scriptUpdateAttemptedAt = Date.now();
                    scriptUpdateManifest = await downloadScriptUpdateManifest();
                    scriptUpdateCheckedAt = Date.now();
                }
                return await promptScriptUpdate(scriptUpdateManifest, manual);
            } catch (error) {
                console.warn('[Better PRTS] 检查脚本更新失败', error);
                if (manual) showPrtsToast('检查脚本更新失败', 'error',
                    error instanceof AggregateError ? '所有更新下载源均不可用，请稍后重试。' : error.message || '请稍后重试。');
                return false;
            }
        })().finally(() => { scriptUpdatePending = null; });
        return scriptUpdatePending;
    }
