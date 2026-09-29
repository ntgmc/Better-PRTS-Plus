    // =========================================================================
    //                            MODULE 3: 工具函数与核心算法
    // =========================================================================

    // 获取 React Fiber 节点
    function getFiberNode(element) {
        if (!element) return null;
        const key = Object.keys(element).find(k => k.startsWith('__reactFiber$'));
        return key ? element[key] : null;
    }

    // 提取 React 节点中的文本内容
    function getReactNodeText(node) {
        if (!node) return '';
        if (typeof node === 'string' || typeof node === 'number') return String(node);
        if (Array.isArray(node)) return node.map(getReactNodeText).join('');
        if (node.props && node.props.children) return getReactNodeText(node.props.children);
        return '';
    }

    // 向上遍历 Fiber 树，获取完整的作业数据
    function extractOperationFromFiber(element) {
        let fiber = getFiberNode(element);
        let depth = 0;

        while (fiber && depth < 30) { // 向上遍历最多 30 层
            const props = fiber.memoizedProps;
            if (props) {
                const candidate = props.operation || props.data || props.copilot || props.item;
                if (candidate && typeof candidate === 'object') {
                    if (candidate.parsedContent || Array.isArray(candidate.opers) || typeof candidate.content === 'string') {
                        return candidate;
                    }
                }
            }
            fiber = fiber.return;
            depth++;
        }
        return null;
    }

    // 获取悬浮窗组件(Popover)内部的文本内容
    function extractPopoverContentFromFiber(element) {
        let fiber = getFiberNode(element);
        let depth = 0;

        while (fiber && depth < 15) {
            const props = fiber.memoizedProps;
            if (props && props.content !== undefined) {
                return getReactNodeText(props.content);
            }
            fiber = fiber.return;
            depth++;
        }
        return "";
    }

    function matchOperatorGroups(requiredGroups, ownedOpsSet, usedOwnedOps, allowUnknownFallbackGroup,
        checkTraining, unknownTraining = [], lowTraining = []) {
        const groups = requiredGroups
            .map((group, index) => {
                const allowedNames = (group.opers || [])
                    .map(o => o.name)
                    .filter(Boolean);
                const candidates = (group.opers || [])
                    .filter(op => ownedOpsSet.has(op.name) && !usedOwnedOps.has(op.name))
                    .filter(op => !checkTraining || checkTraining(op).status !== 'low')
                    .sort((left, right) => checkTraining
                        ? Number(checkTraining(left).status === 'unknown') - Number(checkTraining(right).status === 'unknown')
                        : 0)
                    .map(op => op.name);
                return {
                    index,
                    name: group.name || '未命名干员组',
                    candidates,
                    total: allowedNames.length
                };
            })
            .filter(group => !(allowUnknownFallbackGroup && group.total === 0));

        const groupOrder = [...groups].sort((a, b) => a.candidates.length - b.candidates.length);
        const matchedByOperator = new Map();

        function tryAssign(group, seenOperators) {
            for (const opName of group.candidates) {
                if (seenOperators.has(opName)) continue;
                seenOperators.add(opName);

                const previousGroup = matchedByOperator.get(opName);
                if (!previousGroup || tryAssign(previousGroup, seenOperators)) {
                    matchedByOperator.set(opName, group);
                    return true;
                }
            }
            return false;
        }

        const missingGroups = [];
        groupOrder.forEach(group => {
            if (!tryAssign(group, new Set())) {
                missingGroups.push(`[${group.name}]`);
                if (checkTraining) {
                    const low = (requiredGroups[group.index].opers || [])
                        .filter(op => ownedOpsSet.has(op.name) && checkTraining(op).status === 'low')
                        .map(op => `${op.name}：${checkTraining(op).detail}`);
                    if (low.length) lowTraining.push(`[${group.name}] ${low.join(' / ')}`);
                }
            }
        });

        matchedByOperator.forEach((group, opName) => {
            usedOwnedOps.add(opName);
            if (checkTraining) {
                const op = requiredGroups[group.index].opers.find(candidate => candidate.name === opName);
                const result = checkTraining(op);
                if (result.status === 'unknown') unknownTraining.push(`${opName}：${result.detail}`);
            }
        });

        return missingGroups;
    }

    function getParsedOperationContent(operation) {
        let parsed = operation?.parsedContent;
        if (!parsed) {
            if (Array.isArray(operation?.opers) || Array.isArray(operation?.groups)) {
                parsed = operation;
            } else if (typeof operation?.content === 'string') {
                try { parsed = JSON.parse(operation.content); } catch(e) {}
            }
        }

        return {
            requiredOps: Array.isArray(parsed?.opers) ? parsed.opers : [],
            requiredGroups: Array.isArray(parsed?.groups) ? parsed.groups : []
        };
    }

    function hasNamedOperatorEntry(entry) {
        return typeof entry?.name === 'string' && entry.name.trim().length > 0;
    }

    function hasKnownOperatorEntry(entry) {
        return hasNamedOperatorEntry(entry) && Boolean(OP_ID_MAP[entry.name.trim()]);
    }

    function hasGroupEntry(group) {
        return hasNamedOperatorEntry(group) ||
            (Array.isArray(group?.opers) && group.opers.some(hasNamedOperatorEntry));
    }

    function hasKnownGroupCandidate(group) {
        return Array.isArray(group?.opers) && group.opers.some(hasKnownOperatorEntry);
    }

    function hasEffectiveOperationData(operation) {
        if (!operation || typeof operation !== 'object') return false;

        const { requiredOps, requiredGroups } = getParsedOperationContent(operation);
        if (operation._isFallback) {
            return requiredOps.some(hasKnownOperatorEntry) || requiredGroups.some(hasKnownGroupCandidate);
        }
        return requiredOps.some(hasNamedOperatorEntry) || requiredGroups.some(hasGroupEntry);
    }

    function checkOperatorTraining(op, training) {
        const requirements = op?.requirements;
        if (!requirements || typeof requirements !== 'object') return { status: 'ok' };
        const details = [];
        const unknown = [];
        const check = (label, required, actual) => {
            if (!Number.isInteger(required) || required < 0) return;
            if (!Number.isInteger(actual)) unknown.push(label);
            else if (actual < required) details.push(`${label} ${actual}/${required}`);
        };
        const eliteText = elite => ['未精英化', '精一', '精二'][elite] || '精英化未知';
        if (Number.isInteger(requirements.level) && requirements.level > 0) {
            if (!Number.isInteger(training?.elite) || !Number.isInteger(training?.level)) unknown.push('等级');
            else if (Number.isInteger(requirements.elite) && requirements.elite >= 0
                ? training.elite < requirements.elite ||
                  (training.elite === requirements.elite && training.level < requirements.level)
                : training.level < requirements.level) {
                const requiredElite = Number.isInteger(requirements.elite) ? eliteText(requirements.elite) : '';
                details.push(`当前${eliteText(training.elite)}${training.level}级，要求${requiredElite}${requirements.level}级`);
            }
        }
        if (requirements.elite > 0) {
            if (!Number.isInteger(training?.elite)) {
                if (!unknown.includes('等级')) unknown.push('精英化');
            } else if (training.elite < requirements.elite && !details.some(detail => detail.startsWith('当前'))) {
                details.push(`当前${eliteText(training.elite)}，要求${eliteText(requirements.elite)}`);
            }
        }
        if (Number.isInteger(requirements.skill_level) && requirements.skill_level > 0) {
            const skill = Number(op.skill);
            const mastery = skill >= 1 && skill <= 3 ? training?.[`skill${skill}`] : undefined;
            const actual = Number.isInteger(training?.mainSkill)
                ? training.mainSkill === 7 && requirements.skill_level > 7
                    ? Number.isInteger(mastery) ? 7 + mastery : undefined
                    : training.mainSkill
                : undefined;
            if (requirements.skill_level > 7 && (!Number.isInteger(skill) || skill < 1 || skill > 3)) unknown.push('技能编号');
            else check('技能', requirements.skill_level, actual);
        }
        const moduleType = { 1: 'X', 2: 'Y', 3: 'D', 4: 'A', 5: 'B' }[requirements.module];
        if (moduleType) {
            const moduleLevel = requirements.module_level > 0 ? requirements.module_level : 1;
            check(`模组${moduleType}`, moduleLevel, training?.[`mod${moduleType}`]);
        }
        check('潜能', requirements.potential, training?.potential);
        if (details.length) return { status: 'low', detail: details.join('、') };
        return unknown.length ? { status: 'unknown', detail: `${unknown.join('、')}数据未知` } : { status: 'ok' };
    }

    /**
     * 干员与干员组的可用性判定
     */
    function checkOperationAvailability(operation, ownedOpsSet, filterMode, training = {}, checkTraining = false) {
        if (!ownedOpsSet || ownedOpsSet.size === 0 || (filterMode === 'NONE' && !checkTraining)) {
            return { isAvailable: true, missingCount: 0, missingOps:[], lowTraining: [], unknownTraining: [], hasRequirements: false };
        }

        const { requiredOps, requiredGroups } = getParsedOperationContent(operation);

        if (requiredOps.length === 0 && requiredGroups.length === 0) {
            return { isAvailable: true, missingCount: 0, missingOps:[], lowTraining: [], unknownTraining: [], hasRequirements: false };
        }

        const usedOwnedOps = new Set();
        const missingDetails =[];
        const lowTraining = [];
        const unknownTraining = [];
        const hasRequirements = [...requiredOps, ...requiredGroups.flatMap(group => group.opers || [])]
            .some(op => op?.requirements && Object.values(op.requirements).some(value => Number.isInteger(value) && value > 0));
        const evaluate = op => checkOperatorTraining(op, training[op.name]);

        requiredOps.forEach(op => {
            const opName = op.name;
            if (operation._isFallback && !OP_ID_MAP[opName]) return; // 忽略错抓的非干员词汇

            if (ownedOpsSet.has(opName)) {
                const result = checkTraining ? evaluate(op) : { status: 'ok' };
                if (result.status === 'low') {
                    missingDetails.push(opName);
                    lowTraining.push(`${opName}：${result.detail}`);
                } else {
                    usedOwnedOps.add(opName);
                    if (result.status === 'unknown') unknownTraining.push(`${opName}：${result.detail}`);
                }
            } else {
                missingDetails.push(opName);
            }
        });

        if (requiredGroups.length > 0) {
            const missingGroups = matchOperatorGroups(requiredGroups, ownedOpsSet, usedOwnedOps, operation._isFallback,
                checkTraining ? evaluate : null, unknownTraining, lowTraining);
            missingDetails.push(...missingGroups);
        }

        const missingCount = missingDetails.length;
        let isAvailable = true;

        if (filterMode === 'PERFECT' && missingCount > 0) {
            isAvailable = false;
        } else if (filterMode === 'SUPPORT' && missingCount > 1) {
            isAvailable = false;
        }

        return { isAvailable, missingCount, missingOps: missingDetails, lowTraining, unknownTraining, hasRequirements };
    }
