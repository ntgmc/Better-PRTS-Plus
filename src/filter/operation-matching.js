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

    function matchOperatorGroups(requiredGroups, ownedOpsSet, usedOwnedOps, allowUnknownFallbackGroup) {
        const groups = requiredGroups
            .map((group, index) => {
                const allowedNames = (group.opers || [])
                    .map(o => o.name)
                    .filter(Boolean);
                const candidates = allowedNames
                    .filter(name => ownedOpsSet.has(name) && !usedOwnedOps.has(name));
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
            }
        });

        matchedByOperator.forEach((group, opName) => {
            usedOwnedOps.add(opName);
        });

        return missingGroups;
    }

    /**
     * 干员与干员组的可用性判定
     */
    function checkOperationAvailability(operation, ownedOpsSet, filterMode) {
        if (!ownedOpsSet || ownedOpsSet.size === 0 || filterMode === 'NONE') {
            return { isAvailable: true, missingCount: 0, missingOps:[] };
        }

        let parsed = operation.parsedContent;
        if (!parsed) {
            if (Array.isArray(operation.opers) || Array.isArray(operation.groups)) {
                parsed = operation;
            } else if (typeof operation.content === 'string') {
                try { parsed = JSON.parse(operation.content); } catch(e) {}
            }
        }
        const { opers: requiredOps = [], groups: requiredGroups =[] } = parsed || {};

        if (requiredOps.length === 0 && requiredGroups.length === 0) {
            return { isAvailable: true, missingCount: 0, missingOps:[] };
        }

        const usedOwnedOps = new Set();
        const missingDetails =[];

        requiredOps.forEach(op => {
            const opName = op.name;
            if (operation._isFallback && !OP_ID_MAP[opName]) return; // 忽略错抓的非干员词汇

            if (ownedOpsSet.has(opName)) {
                usedOwnedOps.add(opName);
            } else {
                missingDetails.push(opName);
            }
        });

        if (requiredGroups.length > 0) {
            const missingGroups = matchOperatorGroups(requiredGroups, ownedOpsSet, usedOwnedOps, operation._isFallback);
            missingDetails.push(...missingGroups);
        }

        const missingCount = missingDetails.length;
        let isAvailable = true;

        if (filterMode === 'PERFECT' && missingCount > 0) {
            isAvailable = false;
        } else if (filterMode === 'SUPPORT' && missingCount > 1) {
            isAvailable = false;
        }

        return { isAvailable, missingCount, missingOps: missingDetails };
    }

