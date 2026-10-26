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
                    if (candidate.parsedContent || candidate.opers !== undefined || candidate.groups !== undefined || typeof candidate.content === 'string') {
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

