    function findBilibiliUrl(text) {
        const match = String(text || '').match(/(?:【.*?】\s*)?(https?:\/\/(?:www\.)?(?:bilibili\.com\/video\/|b23\.tv\/)[^\s<"']+)/i);
        return match ? { fullText: match[0], url: match[1] } : null;
    }

    function extractAndRemoveBilibiliUrl(container) {
        const link = Array.from(container.querySelectorAll('a[href]'))
            .find(anchor => findBilibiliUrl(anchor.href));
        if (link) {
            const url = findBilibiliUrl(link.href).url;
            link.remove();
            return url;
        }

        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
        let textNode = walker.nextNode();
        while (textNode) {
            const match = findBilibiliUrl(textNode.nodeValue);
            if (match) {
                textNode.nodeValue = textNode.nodeValue.replace(match.fullText, '').trim();
                return match.url;
            }
            textNode = walker.nextNode();
        }
        return null;
    }

    function trimTrailingDescriptionNoise(container) {
        while (container.lastChild) {
            const node = container.lastChild;
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() === '') {
                node.remove();
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
                node.remove();
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'P' && node.textContent.trim() === '') {
                node.remove();
            } else {
                break;
            }
        }
    }

    function wrapDescriptionContent(descContainer) {
        const content = document.createElement('div');
        content.className = 'prts-desc-content';

        while (descContainer.firstChild) {
            content.appendChild(descContainer.firstChild);
        }
        if (content.textContent.trim() === '') {
            content.textContent = '暂无文字描述';
        }
        descContainer.appendChild(content);
    }

    function cleanBilibiliLinks(cardInner) {
        if (!CONFIG.cleanLink) return;
        const descContainer = cardInner.querySelector('.grow.text-gray-700, .prts-desc-wrapper');
        if (!descContainer || descContainer.dataset.biliProcessed) return;

        const videoUrl = extractAndRemoveBilibiliUrl(descContainer);
        trimTrailingDescriptionNoise(descContainer);

        if (videoUrl) {
            const btnContainer = document.createElement('div');
            btnContainer.className = 'prts-video-box';

            const linkBtn = document.createElement('a');
            linkBtn.href = videoUrl;
            linkBtn.target = "_blank";
            linkBtn.rel = "noopener noreferrer";
            linkBtn.className = 'prts-bili-link';
            linkBtn.setAttribute('aria-label', '打开参考视频');
            linkBtn.appendChild(createPrtsIcon('playVideo'));
            linkBtn.appendChild(document.createTextNode('参考视频'));
            linkBtn.onclick = (e) => e.stopPropagation();

            btnContainer.appendChild(linkBtn);
            if (descContainer.parentNode) {
                descContainer.parentNode.insertBefore(btnContainer, descContainer.nextSibling);
            }
        }

        descContainer.dataset.biliProcessed = "true";
    }

    function collapseCardDescription(cardInner) {
        if (!CONFIG.collapseDescription) return;
        const descContainer = cardInner.querySelector('.grow.text-gray-700');
        if (!descContainer || descContainer.classList.contains('prts-desc-wrapper')) return;
        wrapDescriptionContent(descContainer);
        descContainer.classList.add('prts-desc-wrapper');
        descContainer.classList.remove('grow');
        descContainer.style.width = '100%';
        descContainer.tabIndex = 0;
        descContainer.setAttribute('aria-label', '作业描述');
    }

    function addStageBadge(cardInner) {
        if (!CONFIG.stageBadge) return;

        const heading = cardInner.querySelector(`h4, h5, ${BP_SELECTORS.heading}`);
        const stageCodeSpan = cardInner.querySelector('.flex.whitespace-pre .inline-block.font-bold.my-auto');

        if (heading && !heading.querySelector('.prts-level-badge')) {
            const titleTextNode = heading.querySelector('.whitespace-nowrap.overflow-hidden.text-ellipsis') || heading;
            let currentText = titleTextNode.innerText.trim();

            let badgeText = null;
            let titleCleanText = currentText;

            const rawCode = stageCodeSpan ? stageCodeSpan.innerText.trim() : "";
            const isInternalId = rawCode.includes('_') || (rawCode.length > 5 && /^[a-z]+$/.test(rawCode.replace(/\d/g, '')));

            if (rawCode && !isInternalId) {
                badgeText = rawCode;
                const escapedCode = rawCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`^\\s*(?:\\[|【)?\\s*${escapedCode}\\s*(?:\\]|】)?\\s*(?:[-_=:：|]\\s*|\\s+)?`, 'i');
                titleCleanText = currentText.replace(regex, '');
            } else {
                // 支持带横杠的 PA-1、PA-EX-1、1-7、S4-1，以及省略横杠的 PA5、LE10。
                // 关卡号可带方括号，如 [PA-1]、【PA-1】。
                const fallbackRegex = /^(?:\[|【)?(([A-Za-z0-9]{1,6}(?:-[A-Za-z0-9]{1,4})*-\d{1,3})|([A-Za-z]{2,5}\d{1,3}))(?:\]|】)?\s*(?:[-_=:：|]\s*|\s+(?!$))?(.*)$/i;

                const match = currentText.match(fallbackRegex);
                if (match) {
                    badgeText = match[1].toUpperCase(); // 提取到的关卡号，并统一转为大写 (如 pa-5 -> PA-5)
                    titleCleanText = match[4].trim();   // 剥离出真实的标题文本
                }
            }

            if (badgeText) {
                titleTextNode.innerText = titleCleanText;

                const badge = document.createElement('span');
                badge.className = 'prts-level-badge';
                badge.innerText = badgeText;
                badge.title = badgeText;
                heading.insertBefore(badge, heading.firstChild);
            }
        }
    }

    function getStageFilter() {
        const filterCard = findSearchInputGroup()?.closest(BP_SELECTORS.card);
        const icon = filterCard?.querySelector('[data-icon="area-of-interest"], .bp4-icon-area-of-interest, .bp6-icon-area-of-interest');
        let fiber = getFiberNode(icon);
        let levels = [];
        for (let depth = 0; fiber && depth < 30; depth++, fiber = fiber.return) {
            const props = fiber.memoizedProps;
            if (Array.isArray(props?.items)) levels = props.items;
            if (typeof props?.value === 'string' && typeof props.onChange === 'function') return { onChange: props.onChange, levels, value: props.value };
        }
        return null;
    }

    function applyStageFilter(stageName) {
        const filter = getStageFilter();
        if (!filter) {
            showPrtsToast('无法应用关卡筛选', 'error', '请刷新页面后重试');
            return false;
        }
        // 原站筛选器只列出普通关卡，突袭和磨难作业也应选中对应的普通关卡。
        const normalStageName = stageName.replace(/#f#$/, '').replace('bossrush_tm', 'bossrush_');
        const level = filter.levels.find(item => item.stageId === stageName || item.stageId === normalStageName ||
            item.levelId === stageName || item.name === stageName || item.catThree === stageName);
        filter.onChange(level?.stageId || stageName);
        return true;
    }

    function syncCardStageFilters(cardInner) {
        if (!CONFIG.clickStageFilter && !cardInner.querySelector('.prts-stage-filter')) return;

        const badge = cardInner.querySelector('.prts-level-badge');
        const levelTag = Array.from(cardInner.querySelectorAll(BP_SELECTORS.tag))
            .find(tag => tag.querySelector('.inline-block.font-bold.my-auto'));
        let stageName = extractOperationFromFiber(cardInner)?.parsedContent?.stageName;
        let fiber = getFiberNode(levelTag);
        for (let depth = 0; fiber && depth < 15; depth++, fiber = fiber.return) {
            if (typeof fiber.memoizedProps?.level?.stageId === 'string') {
                stageName = fiber.memoizedProps.level.stageId;
                break;
            }
        }
        if (typeof stageName !== 'string' || !stageName.trim()) {
            stageName = levelTag?.querySelector('.inline-block.font-bold.my-auto')?.textContent || badge?.textContent || '';
        }
        stageName = stageName.trim();
        const enabled = CONFIG.clickStageFilter && stageName && Boolean(getStageFilter());
        const targets = new Set([badge, levelTag, ...cardInner.querySelectorAll('.prts-stage-filter')].filter(Boolean));
        targets.forEach(target => {
            if (!enabled) {
                if (!target.classList.contains('prts-stage-filter')) return;
                target.classList.remove('prts-stage-filter');
                ['role', 'tabindex', 'aria-label'].forEach(name => target.removeAttribute(name));
                target.onclick = null;
                target.onkeydown = null;
                return;
            }
            target.classList.add('prts-stage-filter');
            target.setAttribute('role', 'button');
            target.setAttribute('tabindex', '0');
            const label = badge?.textContent || levelTag?.querySelector('.inline-block.font-bold.my-auto')?.textContent || stageName;
            target.setAttribute('aria-label', `筛选关卡：${label}`);
            target.onclick = event => {
                if (!CONFIG.clickStageFilter) return;
                event.preventDefault();
                event.stopPropagation();
                applyStageFilter(stageName);
            };
            target.onkeydown = event => {
                if (event.key === 'Enter' || event.key === ' ') target.onclick(event);
            };
        });
    }

    function replaceCardOperatorAvatars(cardInner) {
        if (!CONFIG.operatorAvatars) return;
        const allDivs = Array.from(cardInner.querySelectorAll('div'));
        const labelDiv = allDivs.find(div => div.innerText.trim() === '干员/干员组');

        if (labelDiv && !labelDiv.dataset.opsProcessed) {
            const tagsContainer = labelDiv.nextElementSibling;
            if (tagsContainer) {
                const tags = tagsContainer.querySelectorAll(BP_SELECTORS.tag);
                let grid = tagsContainer.querySelector('.prts-op-grid');
                if (!grid) {
                    grid = document.createElement('div');
                    grid.className = 'prts-op-grid';
                    tagsContainer.insertBefore(grid, tagsContainer.firstChild);
                }

                tags.forEach(tag => {
                    if (tag.dataset.opExtracted) return;

                    const rawText = tag.innerText.trim();
                    const cleanText = rawText.replace(/^\[|\]$/g, '');
                    const parts = cleanText.split(/\s+/);
                    const nameKey = parts[0];
                    const extraInfo = parts[1] || "";

                    let newItem = null;

                    if (OP_ID_MAP[nameKey]) {
                        const opId = OP_ID_MAP[nameKey];
                        newItem = document.createElement('div');
                        newItem.className = 'prts-op-item';
                        const img = document.createElement('img');
                        img.src = `/assets/operator-avatars/webp96/${opId}.webp`;
                        img.className = 'prts-op-img';
                        img.loading = "lazy";
                        img.alt = nameKey;
                        newItem.title = `${nameKey}${extraInfo ? ' ' + extraInfo : ''}`;
                        newItem.setAttribute('aria-label', newItem.title);
                        newItem.appendChild(img);
                    } else if (nameKey.length > 0) {
                        reportUnknownOperatorName(nameKey, { source: 'card', example: cleanText });
                        newItem = document.createElement('div');
                        newItem.className = 'prts-op-text';
                        newItem.innerText = nameKey;
                        newItem.title = `${nameKey}${extraInfo ? ' ' + extraInfo : ''}`;
                        newItem.setAttribute('aria-label', newItem.title);
                    }

                    if (newItem && extraInfo) {
                        const badge = document.createElement('div');
                        badge.className = 'prts-op-skill';
                        badge.innerText = extraInfo;
                        newItem.appendChild(badge);
                    }

                    if (!newItem) return;

                    const interactiveWrapper = tag.closest(BP_SELECTORS.popoverTarget);
                    if (interactiveWrapper) {
                        if (!interactiveWrapper.hasAttribute('tabindex')) interactiveWrapper.tabIndex = 0;
                        interactiveWrapper.title = `${nameKey}${extraInfo ? ' ' + extraInfo : ''}`;
                        interactiveWrapper.setAttribute('aria-label', interactiveWrapper.title);
                        grid.appendChild(interactiveWrapper);
                        interactiveWrapper.replaceChildren();
                        interactiveWrapper.appendChild(newItem);
                    } else {
                        const tooltipText = `${nameKey}${extraInfo ? ' ' + extraInfo : ''}`;
                        newItem.setAttribute('data-prts-tooltip', tooltipText);
                        newItem.tabIndex = 0;
                        grid.appendChild(newItem);
                        tag.style.display = 'none';
                    }

                    tag.dataset.opExtracted = "true";
                });
                labelDiv.dataset.opsProcessed = "true";
            }
        }
    }

    function refreshResourceViews() {
        if (CONFIG.operatorAvatars) {
            document.querySelectorAll('.prts-op-text').forEach(item => {
                const name = item.firstChild?.textContent.trim();
                const id = OP_ID_MAP[name];
                if (!id) return;
                const skill = item.querySelector('.prts-op-skill');
                const img = document.createElement('img');
                img.src = `/assets/operator-avatars/webp96/${id}.webp`;
                img.className = 'prts-op-img';
                img.loading = 'lazy';
                img.alt = name;
                item.classList.replace('prts-op-text', 'prts-op-item');
                item.replaceChildren(img);
                if (skill) item.appendChild(skill);
            });
        }
        requestFilterUpdate();
    }

    function enhancePopover(portalNode) {
        if (!CONFIG.popoverAvatars) return;
        const content = portalNode.querySelector(BP_SELECTORS.popoverContent);
        if (!content || content.dataset.optimized) return;

        const wrapper = content.closest(BP_SELECTORS.popover);
        if (wrapper && (
            wrapper.classList.contains('bp4-suggest-popover') ||
            wrapper.classList.contains('bp6-suggest-popover') ||
            wrapper.classList.contains('bp4-select-popover') ||
            wrapper.classList.contains('bp6-select-popover')
        )) {
            return;
        }

        if (window.location.pathname.startsWith('/create')) {
            if (content.querySelector(BP_SELECTORS.menuOrItem)) return;
        }

        const text = content.innerText.trim();
        const cleanText = text.replace(/^->\s*/, '');
        const firstWord = cleanText.split(/[\s,，]+/)[0];
        const isSingleOperator = OP_ID_MAP[firstWord];
        const hasOperatorSeparator = text.includes(',') || text.includes('，');

        if (!text.startsWith('->') && !hasOperatorSeparator && !isSingleOperator) return;

        const rawList = cleanText.split(/[,，]\s*/);
        const validOps =[];
        let hasUnknownOps = false;

        rawList.forEach(entry => {
            const parts = entry.trim().split(/\s+/);
            const name = parts[0];
            const skill = parts[1] || "";
            if (!name) return;

            if (OP_ID_MAP[name]) {
                validOps.push({ name: name, id: OP_ID_MAP[name], skill: skill });
            } else {
                hasUnknownOps = true;
                reportUnknownOperatorName(name, { source: 'popover', example: cleanText });
            }
        });

        if (!hasUnknownOps && validOps.length > 0) {
            content.replaceChildren();
            const grid = document.createElement('div');
            grid.className = 'prts-popover-grid';

            validOps.forEach(op => {
                const item = document.createElement('div');
                item.className = 'prts-popover-item';
                item.title = `${op.name} ${op.skill ? '(技能 ' + op.skill + ')' : ''}`;
                item.tabIndex = 0;
                item.setAttribute('aria-label', item.title);

                const img = document.createElement('img');
                img.src = `/assets/operator-avatars/webp96/${op.id}.webp`;
                img.className = 'prts-popover-img';
                img.alt = op.name;

                item.appendChild(img);
                if (op.skill) {
                    const badge = document.createElement('div');
                    badge.className = 'prts-popover-skill';
                    badge.innerText = op.skill;
                    item.appendChild(badge);
                }
                grid.appendChild(item);
            });

            content.appendChild(grid);
            content.dataset.optimized = "true";
        }
    }


    function createDialogTag(text) {
        const tag = document.createElement('span');
        tag.classList.add('prts-dialog-tag');

        if (text.includes('升级') || text.includes('优化') || text.includes('更新')) {
            tag.classList.add('prts-tag-update');
            tag.textContent = '更新';
        } else if (text.includes('修复') || text.includes('问题') || text.includes('Bug')) {
            tag.classList.add('prts-tag-fix');
            tag.textContent = '维护';
        } else if (text.includes('活动') || text.includes('关卡')) {
            tag.classList.add('prts-tag-event');
            tag.textContent = '活动';
        } else {
            tag.classList.add('prts-tag-note');
            tag.textContent = '通知';
        }

        return tag;
    }

    function optimizeDialogContent() {
        if (!CONFIG.announcementTags) return;
        const dialog = document.querySelector(BP_SELECTORS.dialog);
        if (!dialog || dialog.dataset.contentOptimized) return;

        const title = dialog.querySelector(BP_SELECTORS.heading);
        if (title && title.innerText.includes('公告')) {
            const contentBody = dialog.querySelector('.markdown-body');
            if (contentBody) {
                const headers = contentBody.querySelectorAll('h2');
                headers.forEach(h2 => {
                    if (!h2.querySelector('.prts-dialog-tag')) {
                        h2.insertBefore(createDialogTag(h2.textContent), h2.firstChild);
                    }
                });
            }
            dialog.dataset.contentOptimized = "true";
        }
    }
