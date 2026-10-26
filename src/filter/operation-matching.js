    function matchOperatorGroups(requiredGroups, ownedOpsSet, usedOwnedOps, allowUnknownFallbackGroup,
        checkTraining, unknownTraining = [], lowTraining = [], trainingIssues = []) {
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
                        .map(op => {
                            const result = checkTraining(op);
                            trainingIssues.push({ name: op.name, group: group.name, ...result });
                            return `${op.name}：${result.detail}`;
                        });
                    if (low.length) lowTraining.push(`[${group.name}] ${low.join(' / ')}`);
                }
            }
        });

        matchedByOperator.forEach((group, opName) => {
            usedOwnedOps.add(opName);
            if (checkTraining) {
                const op = requiredGroups[group.index].opers.find(candidate => candidate.name === opName);
                const result = checkTraining(op);
                if (result.status === 'unknown') {
                    unknownTraining.push(`${opName}：${result.detail}`);
                    trainingIssues.push({ name: opName, group: group.name, ...result });
                }
            }
        });

        return missingGroups;
    }

    function getParsedOperationContent(operation) {
        let parsed = operation?.parsedContent;
        if (parsed == null) {
            if (operation?.opers !== undefined || operation?.groups !== undefined) {
                parsed = operation;
            } else if (typeof operation?.content === 'string' && operation.content.trim()) {
                parsed = safeJsonParse(operation.content, undefined);
                if (parsed === undefined) throw new Error('作业 JSON 格式异常。');
            }
        }

        const requiredOps = parsed?.opers ?? [];
        const requiredGroups = parsed?.groups ?? [];
        if ((parsed != null && !isPlainRecord(parsed)) ||
            !Array.isArray(requiredOps) || !Array.isArray(requiredGroups) ||
            !requiredOps.every(hasNamedOperatorEntry) ||
            !requiredGroups.every(group => isPlainRecord(group) &&
                (group.opers == null || (Array.isArray(group.opers) && group.opers.every(hasNamedOperatorEntry))))) {
            throw new Error('作业干员数据格式异常。');
        }
        return { requiredOps, requiredGroups };
    }

    function hasNamedOperatorEntry(entry) {
        return isPlainRecord(entry) && typeof entry.name === 'string' && entry.name.trim().length > 0;
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
        const issues = [];
        const addIssue = (label, current, required, status = 'low') => {
            issues.push({ label, current, required, status });
        };
        const check = (label, required, actual) => {
            if (!Number.isInteger(required) || required < 0) return;
            const unit = label === '潜能' ? '潜' : '级';
            if (!Number.isInteger(actual)) {
                unknown.push(label);
                addIssue(label, '未知', `${required}${unit}`, 'unknown');
            } else if (actual < required) {
                details.push(`${label} ${actual}/${required}`);
                addIssue(label, `${actual}${unit}`, `${required}${unit}`);
            }
        };
        const eliteText = elite => ['', '精一', '精二'][elite] ?? '精英化未知';
        if (Number.isInteger(requirements.level) && requirements.level > 0) {
            const requiredElite = Number.isInteger(requirements.elite) ? eliteText(requirements.elite) : '';
            if (!Number.isInteger(training?.elite) || !Number.isInteger(training?.level)) {
                unknown.push('等级');
                addIssue('等级', '未知', `${requiredElite}${requirements.level}级`, 'unknown');
            }
            else if (Number.isInteger(requirements.elite) && requirements.elite >= 0
                ? training.elite < requirements.elite ||
                  (training.elite === requirements.elite && training.level < requirements.level)
                : training.level < requirements.level) {
                details.push(`当前${eliteText(training.elite)}${training.level}级，要求${requiredElite}${requirements.level}级`);
                addIssue('等级', `${eliteText(training.elite)}${training.level}级`, `${requiredElite}${requirements.level}级`);
            }
        }
        if (requirements.elite > 0) {
            if (!Number.isInteger(training?.elite)) {
                if (!unknown.includes('等级')) {
                    unknown.push('精英化');
                    addIssue('精英化', '未知', eliteText(requirements.elite), 'unknown');
                }
            } else if (training.elite < requirements.elite && !details.some(detail => detail.startsWith('当前'))) {
                details.push(`当前${eliteText(training.elite) || '无'}，要求${eliteText(requirements.elite)}`);
                addIssue('精英化', eliteText(training.elite) || '未精英化', eliteText(requirements.elite));
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
            const skillText = level => ({ 8: '专一', 9: '专二', 10: '专三' }[level] || `${level}级`);
            const skillLabel = Number.isInteger(skill) && skill >= 1 && skill <= 3 ? `${skill}技能` : '技能';
            if (requirements.skill_level > 7 && (!Number.isInteger(skill) || skill < 1 || skill > 3)) {
                unknown.push('技能编号');
                addIssue('技能编号未标注', '未知', skillText(requirements.skill_level), 'unknown');
            } else if (!Number.isInteger(actual)) {
                unknown.push('技能');
                addIssue(skillLabel, '未知', skillText(requirements.skill_level), 'unknown');
            } else if (actual < requirements.skill_level) {
                details.push(`${skillLabel}当前${skillText(actual)}，要求${skillText(requirements.skill_level)}`);
                addIssue(skillLabel, skillText(actual), skillText(requirements.skill_level));
            }
        }
        const moduleType = { 1: 'X', 2: 'Y', 3: 'D', 4: 'A', 5: 'B' }[requirements.module];
        if (moduleType) {
            const moduleLevel = requirements.module_level > 0 ? requirements.module_level : 1;
            check(`模组${moduleType}`, moduleLevel, training?.[`mod${moduleType}`]);
        }
        check('潜能', requirements.potential, training?.potential);
        if (details.length) return { status: 'low', detail: details.join('、'), issues };
        return unknown.length ? { status: 'unknown', detail: `${unknown.join('、')}数据未知`, issues } : { status: 'ok' };
    }

    /**
     * 干员与干员组的可用性判定
     */
    function checkOperationAvailability(operation, ownedOpsSet, filterMode, training = {}, checkTraining = false) {
        if (!ownedOpsSet || ownedOpsSet.size === 0 || (filterMode === 'NONE' && !checkTraining)) {
            return { isAvailable: true, missingCount: 0, missingOps:[], lowTraining: [], unknownTraining: [], trainingIssues: [], hasRequirements: false };
        }

        const { requiredOps, requiredGroups } = getParsedOperationContent(operation);

        if (requiredOps.length === 0 && requiredGroups.length === 0) {
            return { isAvailable: true, missingCount: 0, missingOps:[], lowTraining: [], unknownTraining: [], trainingIssues: [], hasRequirements: false };
        }

        const usedOwnedOps = new Set();
        const missingDetails =[];
        const lowTraining = [];
        const unknownTraining = [];
        const trainingIssues = [];
        const hasRequirements = [...requiredOps, ...requiredGroups.flatMap(group => group.opers || [])]
            .some(op => op?.requirements && Object.values(op.requirements).some(value => Number.isInteger(value) && value > 0));
        const trainingResults = new Map();
        const evaluate = op => {
            if (!trainingResults.has(op)) trainingResults.set(op, checkOperatorTraining(op, training[op.name]));
            return trainingResults.get(op);
        };

        requiredOps.forEach(op => {
            const opName = op.name;
            if (operation._isFallback && !OP_ID_MAP[opName]) return; // 忽略错抓的非干员词汇

            if (ownedOpsSet.has(opName)) {
                const result = checkTraining ? evaluate(op) : { status: 'ok' };
                if (result.status !== 'ok') trainingIssues.push({ name: opName, ...result });
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
                checkTraining ? evaluate : null, unknownTraining, lowTraining, trainingIssues);
            missingDetails.push(...missingGroups);
        }

        const missingCount = missingDetails.length;
        let isAvailable = true;

        if (filterMode === 'PERFECT' && missingCount > 0) {
            isAvailable = false;
        } else if (filterMode === 'SUPPORT' && missingCount > 1) {
            isAvailable = false;
        }

        return { isAvailable, missingCount, missingOps: missingDetails, lowTraining, unknownTraining, trainingIssues, hasRequirements };
    }
