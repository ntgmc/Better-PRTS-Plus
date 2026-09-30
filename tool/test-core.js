const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const sourceFiles = [
  'src/core/constants.js',
  'src/data/operators.generated.js',
  'src/data/module-types.generated.js',
  'src/import/parsers.js',
  'src/core/account-state.js',
  'src/core/filter-scheduler.js',
  'src/import/skland.js',
  'src/dom/card-resolution.js',
  'src/filter/operation-matching.js',
  'src/import/accounts.js',
  'src/dom/page-enhancements.js'
];

const source = sourceFiles
  .map(file => fs.readFileSync(path.join(repoRoot, file), 'utf8'))
  .join('\n') + `
globalThis.__testExports = {
  CONFIG_KEY,
  CONFIG_DEFINITIONS,
  normalizeConfig,
  loadConfig,
  saveConfig,
  buildAccountsBackup,
  applyAccountsBackup,
  addStageBadge,
  replaceCardOperatorAvatars,
  collapseCardDescription,
  cleanBilibiliLinks,
  enhancePopover,
  ACCOUNT_BACKUP_TYPE,
  ACCOUNT_BACKUP_VERSION,
  OP_MODULE_TYPES,
  parseImportedOperatorNames,
  parseImportedOperators,
  normalizeAccountMeta,
  normalizeSklandSyncMeta,
  normalizeSklandImportSummary,
  createAccountState,
  serializeAccountState,
  resolveStoredAccountState,
  createAccountSwitchState,
  createRenamedAccountState,
  createSklandImportState,
  createFilterUpdateCoordinator,
  getCardTypeTag,
  isVideoOperationCard,
  syncOperationTypeButtons,
  syncOperationCardTime,
  CONFIG,
  getCurrentAccountState,
  getOwnedOpsSnapshot: () => Array.from(ownedOpsSet),
  publishAccountState,
  commitAccountState,
  commitSklandImportResult,
  matchOperatorGroups,
  checkOperationAvailability,
  checkOperatorTraining,
  convertSklandPlayerInfoToTraining,
  parseAccountsBackup,
  getSklandArknightsBindingOptionsFromList,
  normalizeSklandArknightsBindings,
  selectSklandBindingOption,
  selectSklandArknightsBinding,
  convertSklandPlayerInfoToNames
};
`;

const storage = new Map();
const warnings = [];
let failStorageKey = null;
const context = {
  console: {
    log: (...args) => console.log(...args),
    error: (...args) => console.error(...args),
    warn: (...args) => warnings.push(args)
  },
  setTimeout,
  clearTimeout,
  TextEncoder,
  Uint8Array,
  ArrayBuffer,
  DataView,
  window: {
    location: { hostname: 'prts.plus', pathname: '/', search: '' },
    BetterPRTSPlusDebug: {},
    setTimeout,
    clearTimeout
  },
  GM_getValue(key, fallback) {
    return storage.has(key) ? storage.get(key) : fallback;
  },
  GM_setValue(key, value) {
    if (key === failStorageKey) throw new Error(`storage failure: ${key}`);
    storage.set(key, value);
  }
};
context.globalThis = context;

vm.createContext(context);
vm.runInContext(source, context, { filename: 'better-prts-plus-core.js' });

const {
  CONFIG_KEY,
  CONFIG_DEFINITIONS,
  normalizeConfig,
  loadConfig,
  saveConfig,
  buildAccountsBackup,
  applyAccountsBackup,
  addStageBadge,
  replaceCardOperatorAvatars,
  collapseCardDescription,
  cleanBilibiliLinks,
  enhancePopover,
  ACCOUNT_BACKUP_TYPE,
  ACCOUNT_BACKUP_VERSION,
  OP_MODULE_TYPES,
  parseImportedOperatorNames,
  parseImportedOperators,
  normalizeAccountMeta,
  normalizeSklandSyncMeta,
  normalizeSklandImportSummary,
  createAccountState,
  serializeAccountState,
  resolveStoredAccountState,
  createAccountSwitchState,
  createRenamedAccountState,
  createSklandImportState,
  createFilterUpdateCoordinator,
  getCardTypeTag,
  isVideoOperationCard,
  syncOperationTypeButtons,
  syncOperationCardTime,
  CONFIG,
  getCurrentAccountState,
  getOwnedOpsSnapshot,
  publishAccountState,
  commitAccountState,
  commitSklandImportResult,
  matchOperatorGroups,
  checkOperationAvailability,
  checkOperatorTraining,
  convertSklandPlayerInfoToTraining,
  parseAccountsBackup,
  getSklandArknightsBindingOptionsFromList,
  normalizeSklandArknightsBindings,
  selectSklandBindingOption,
  selectSklandArknightsBinding,
  convertSklandPlayerInfoToNames
} = context.__testExports;

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

test('unified settings migrate legacy values, validate types and prefer saved independent choices', () => {
  const savedStorage = new Map(storage);
  try {
    storage.clear();
    storage.set('prts_cfg_visuals', false);
    storage.set('prts_cfg_link', false);
    storage.set('prts_plus_filter_mode', 'SUPPORT');
    storage.set('prts_plus_display_mode', 'HIDE');
    storage.set('prts_plus_training_check', true);
    storage.set('prts_float_pos', '{"top":"120%","isRight":false}');
    const migrated = loadConfig();
    for (const key of ['operatorAvatars', 'stageBadge', 'popoverAvatars', 'collapseDescription', 'cleanLink']) {
      assert.strictEqual(migrated[key], false, key);
    }
    assert.strictEqual(migrated.filterMode, 'SUPPORT');
    assert.strictEqual(migrated.displayMode, 'HIDE');
    assert.strictEqual(migrated.trainingCheck, true);
    assert.deepStrictEqual(hostObject(migrated.floatingPosition), { top: '95%', isRight: false });
    assert.deepStrictEqual(JSON.parse(storage.get(CONFIG_KEY)), hostObject(migrated));
    storage.set(CONFIG_KEY, JSON.stringify({ operatorAvatars: true, stageBadge: false, collapseDescription: true }));
    const loaded = loadConfig();
    assert.strictEqual(loaded.operatorAvatars, true);
    assert.strictEqual(loaded.stageBadge, false);
    assert.strictEqual(loaded.popoverAvatars, true);
    assert.strictEqual(loaded.collapseDescription, true);
    assert.strictEqual(loaded.cleanLink, true);
    assert.strictEqual(loaded.filterMode, 'NONE');
    const invalid = normalizeConfig({
      operatorAvatars: 'false', hideVideo: 1, filterMode: 'invalid', displayMode: null,
      trainingCheck: 'true', floatingPosition: '{bad-json', unknown: true
    });
    assert.strictEqual(invalid.operatorAvatars, true);
    assert.strictEqual(invalid.hideVideo, false);
    assert.strictEqual(invalid.trainingCheck, false);
    assert.strictEqual(invalid.filterMode, 'NONE');
    assert.strictEqual(invalid.displayMode, 'GRAY');
    assert.strictEqual(Object.hasOwn(invalid, 'unknown'), false);
    assert.deepStrictEqual(hostObject(invalid.floatingPosition), { top: '40%', isRight: true });
    storage.set(CONFIG_KEY, '{bad-json');
    assert.strictEqual(loadConfig().operatorAvatars, false);
    failStorageKey = CONFIG_KEY;
    assert.throws(saveConfig, /storage failure/);
  } finally {
    failStorageKey = null;
    storage.clear();
    savedStorage.forEach((value, key) => storage.set(key, value));
  }
});

function createTestElement(tagName = 'div', text = '') {
  const node = {
    nodeType: 1, tagName: tagName.toUpperCase(), children: [], dataset: {}, style: {}, className: '',
    attributes: new Map(), parentElement: null,
    get parentNode() { return this.parentElement; },
    get firstChild() { return this.children[0] || null; },
    get lastChild() { return this.children[this.children.length - 1] || null; },
    get textContent() { return text + this.children.map(child => child.textContent).join(''); },
    set textContent(value) { this.replaceChildren(); text = value; },
    get innerText() { return this.textContent; },
    set innerText(value) { this.textContent = value; },
    appendChild(child) {
      child.remove();
      child.parentElement = this;
      this.children.push(child);
      return child;
    },
    insertBefore(child, reference) {
      this.appendChild(child);
      if (reference) {
        this.children.pop();
        this.children.splice(this.children.indexOf(reference), 0, child);
      }
    },
    replaceChildren() {
      this.children.slice().forEach(child => child.remove());
      text = '';
    },
    remove() {
      if (this.parentElement) this.parentElement.children.splice(this.parentElement.children.indexOf(this), 1);
      this.parentElement = null;
    },
    setAttribute(key, value) { this.attributes.set(key, value); },
    closest() { return null; },
    querySelector(selector) { return this.children.find(child => selector === `.${child.className}`) || null; },
    querySelectorAll() { return []; }
  };
  node.classList = {
    contains: name => node.className.split(/\s+/).includes(name),
    add: name => { node.className = `${node.className} ${name}`.trim(); },
    remove: name => { node.className = node.className.split(/\s+/).filter(value => value !== name).join(' '); }
  };
  return node;
}

test('card badges, avatars, descriptions and links work independently and remain idempotent', () => {
  const savedConfig = { ...CONFIG };
  const savedContext = {
    document: context.document, Node: context.Node, NodeFilter: context.NodeFilter,
    createPrtsIcon: context.createPrtsIcon
  };
  context.Node = { ELEMENT_NODE: 1, TEXT_NODE: 3 };
  context.NodeFilter = { SHOW_TEXT: 4 };
  context.document = {
    createElement: createTestElement,
    createTextNode: text => createTestElement('span', text),
    createTreeWalker: () => ({ nextNode: () => null })
  };
  context.createPrtsIcon = () => createTestElement('svg');
  try {
    for (const avatars of [false, true]) for (const badge of [false, true]) {
      CONFIG.operatorAvatars = avatars;
      CONFIG.stageBadge = badge;
      const heading = createTestElement('h4', '【1-7】 作业标题');
      const label = createTestElement('div', '干员/干员组');
      const tags = createTestElement();
      const tag = createTestElement('span', '[阿米娅 2]');
      tags.appendChild(tag);
      tags.querySelectorAll = () => [tag];
      label.nextElementSibling = tags;
      const card = {
        querySelector: selector => selector.startsWith('h4') ? heading : null,
        querySelectorAll: () => [label]
      };
      addStageBadge(card);
      replaceCardOperatorAvatars(card);
      addStageBadge(card);
      replaceCardOperatorAvatars(card);
      assert.strictEqual(heading.children.length, Number(badge));
      if (badge) {
        assert.strictEqual(heading.children[0].innerText, '1-7');
        assert(heading.textContent.includes('作业标题'));
        assert(!heading.textContent.includes('【1-7】'));
      } else {
        assert.strictEqual(heading.textContent, '【1-7】 作业标题');
      }
      const grid = tags.querySelector('.prts-op-grid');
      assert.strictEqual(Boolean(grid), avatars);
      if (avatars) {
        assert.strictEqual(grid.children.length, 1);
        assert.strictEqual(grid.children[0].children[0].alt, '阿米娅');
        assert.strictEqual(tag.style.display, 'none');
      }
    }
    for (const collapse of [false, true]) for (const link of [false, true]) {
      CONFIG.collapseDescription = collapse;
      CONFIG.cleanLink = link;
      const desc = createTestElement();
      desc.appendChild(createTestElement('span', '作业描述'));
      const anchor = createTestElement('a', '视频地址');
      anchor.href = 'https://www.bilibili.com/video/BV123/';
      desc.appendChild(anchor);
      desc.querySelectorAll = selector => selector === 'a[href]' && anchor.parentElement ? [anchor] : [];
      const parent = createTestElement();
      parent.appendChild(desc);
      const card = { querySelector: () => desc };
      // A link can be enabled after the description has already been folded.
      collapseCardDescription(card);
      cleanBilibiliLinks(card);
      collapseCardDescription(card);
      cleanBilibiliLinks(card);
      assert.strictEqual(desc.classList.contains('prts-desc-wrapper'), collapse);
      assert.strictEqual(Boolean(desc.querySelector('.prts-desc-content')), collapse);
      assert.strictEqual(Boolean(anchor.parentElement), !link);
      assert.strictEqual(parent.children.length, link ? 2 : 1);
      assert.strictEqual(desc.attributes.has('aria-label'), collapse);
      if (link) assert.strictEqual(parent.children[1].children[0].href, anchor.href);
    }
    CONFIG.operatorAvatars = false;
    const content = createTestElement('div', '-> 阿米娅 2');
    const portal = { querySelector: () => content };
    CONFIG.popoverAvatars = false;
    enhancePopover(portal);
    assert.strictEqual(content.textContent, '-> 阿米娅 2');
    CONFIG.popoverAvatars = true;
    enhancePopover(portal);
    enhancePopover(portal);
    assert.strictEqual(content.children.length, 1);
    assert.strictEqual(content.children[0].children[0].children[0].alt, '阿米娅');
  } finally {
    Object.assign(CONFIG, savedConfig);
    Object.assign(context, savedContext);
  }
});

test('backup round trips every registered option and restores unified settings', () => {
  const savedConfig = { ...CONFIG };
  const savedStorage = new Map(storage);
  const savedState = getCurrentAccountState();
  const savedContext = {
    document: context.document, location: context.location,
    refreshAccountStateUi: context.refreshAccountStateUi, syncPageScaffold: context.syncPageScaffold
  };
  let reloads = 0;
  context.location = { reload() { reloads++; } };
  context.refreshAccountStateUi = () => {};
  context.syncPageScaffold = () => {};
  try {
    Object.entries(CONFIG_DEFINITIONS).forEach(([key, definition]) => {
      if (definition.group) CONFIG[key] = !definition.default;
    });
    CONFIG.filterMode = 'SUPPORT';
    CONFIG.displayMode = 'HIDE';
    CONFIG.trainingCheck = true;
    CONFIG.floatingPosition = { top: '61%', isRight: false };
    const backup = parseAccountsBackup(hostObject(buildAccountsBackup()));
    Object.entries(CONFIG_DEFINITIONS).forEach(([key, definition]) => {
      if (definition.group) assert.strictEqual(backup.preferences.config[key], CONFIG[key], key);
    });
    Object.assign(CONFIG, normalizeConfig({}));
    applyAccountsBackup(backup);
    const restored = JSON.parse(storage.get(CONFIG_KEY));
    assert.deepStrictEqual(restored, hostObject(CONFIG));
    assert.strictEqual(restored.filterMode, 'SUPPORT');
    assert.strictEqual(restored.displayMode, 'HIDE');
    assert.strictEqual(restored.trainingCheck, true);
    assert.strictEqual(restored.compatDebug, true);
    assert.deepStrictEqual(restored.floatingPosition, { top: '61%', isRight: false });
    assert.strictEqual(reloads, 1);
    assert.strictEqual(storage.has('prts_cfg_visuals'), false);
    assert.strictEqual(storage.has('prts_plus_filter_mode'), false);
    context.document = { querySelectorAll: () => [] };
    applyAccountsBackup(backup);
    assert.strictEqual(reloads, 1);
  } finally {
    Object.assign(CONFIG, savedConfig);
    Object.assign(context, savedContext);
    publishAccountState(savedState);
    storage.clear();
    savedStorage.forEach((value, key) => storage.set(key, value));
  }
});

function hostArray(value) {
  return Array.from(value);
}

test('video cards use operation type or localized title tag', () => {
  const prtsTag = { textContent: 'PRTS' };
  const videoTag = { textContent: '视频' };
  const cardInner = tags => ({
    querySelectorAll(selector) {
      assert.strictEqual(selector, 'h4 .bp4-tag, h4 .bp6-tag');
      return tags;
    }
  });
  assert.strictEqual(getCardTypeTag(cardInner([prtsTag]), 'PRTS'), prtsTag);
  assert.strictEqual(isVideoOperationCard(cardInner([]), { type: 'VIDEO' }), true);
  assert.strictEqual(isVideoOperationCard(cardInner([videoTag]), { type: 'PRTS' }), false);
  assert.strictEqual(isVideoOperationCard(cardInner([prtsTag]), {}), false);
  assert.strictEqual(isVideoOperationCard(cardInner([videoTag]), {}), true);
  assert.strictEqual(isVideoOperationCard(cardInner([{ textContent: 'Video' }]), {}), true);
});

test('card time uses the existing tooltip and restores relative time when disabled', () => {
  const classes = new Set();
  const attributes = new Map();
  const timeText = {
    dataset: {},
    classList: { toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); } },
    setAttribute(name, value) { attributes.set(name, value); },
    removeAttribute(name) { attributes.delete(name); },
    __reactFiber$test: { memoizedProps: {}, return: { memoizedProps: { content: '2026-09-21 10:11:12' } } }
  };
  const cardInner = {
    querySelector() { return { parentElement: { querySelector() { return timeText; } } }; }
  };
  CONFIG.showExactTime = true;
  syncOperationCardTime(cardInner);
  assert.strictEqual(timeText.dataset.prtsExactTime, '2026-09-21 10:11:12');
  assert.strictEqual(attributes.get('aria-label'), '2026-09-21 10:11:12');
  assert.strictEqual(classes.has('prts-exact-time'), true);
  CONFIG.showExactTime = false;
  syncOperationCardTime(cardInner);
  assert.strictEqual(classes.has('prts-exact-time'), false);
  assert.strictEqual(timeText.dataset.prtsExactTime, undefined);
  assert.strictEqual(attributes.has('aria-label'), false);
  CONFIG.showExactTime = true;
  timeText.__reactFiber$test.return.memoizedProps.content = '';
  syncOperationCardTime(cardInner);
  assert.strictEqual(classes.has('prts-exact-time'), false);
  CONFIG.showExactTime = false;
});

test('operation type buttons follow video hiding without affecting other groups', () => {
  const group = labels => ({ children: labels.map(textContent => ({ textContent })), style: { display: '' } });
  const typeGroup = group(['全部', 'PRTS', '视频']);
  const sortGroup = group(['最新', '最热', '评分']);
  context.document = {
    querySelectorAll(selector) {
      assert.strictEqual(selector, '.bp4-button-group.flex-wrap, .bp6-button-group.flex-wrap');
      return [typeGroup, sortGroup];
    }
  };
  syncOperationTypeButtons(true);
  assert.strictEqual(typeGroup.style.display, 'none');
  assert.strictEqual(sortGroup.style.display, '');
  syncOperationTypeButtons(false);
  assert.strictEqual(typeGroup.style.display, '');
  delete context.document;
});

function hostObject(value) {
  return JSON.parse(JSON.stringify(value));
}

test('parseImportedOperatorNames parses JSON string arrays', () => {
  assert.deepStrictEqual(hostArray(parseImportedOperatorNames('["阿米娅","阿米娅","  W  "]', 'ops.json')), ['阿米娅', 'W']);
});

test('parseImportedOperatorNames filters unowned MAA records', () => {
  const raw = JSON.stringify([
    { name: 'A', own: true },
    { name: 'B', own: false },
    { name: 'C', own: 0 },
    { name: 'D', own: 'false' },
    { name: 'E' }
  ]);
  assert.deepStrictEqual(hostArray(parseImportedOperatorNames(raw, 'maa.json')), ['A', 'E']);
});

test('parseImportedOperatorNames handles TXT comments and special characters', () => {
  const raw = ['# comment', 'GALLUS²', '// skip', 'Miss.Christine', '', 'U-Official'].join('\n');
  assert.deepStrictEqual(hostArray(parseImportedOperatorNames(raw, 'ops.txt')), ['GALLUS²', 'Miss.Christine', 'U-Official']);
});

test('parseImportedOperatorNames rejects invalid JSON files', () => {
  assert.throws(() => parseImportedOperatorNames('{bad json', 'ops.json'), /JSON/);
});

test('matchOperatorGroups reassigns wider candidates for narrow groups', () => {
  const used = new Set();
  const missing = matchOperatorGroups([
    { name: 'wide', opers: [{ name: 'A' }, { name: 'B' }] },
    { name: 'narrow', opers: [{ name: 'A' }] }
  ], new Set(['A', 'B']), used, false);
  assert.deepStrictEqual(hostArray(missing), []);
  assert.deepStrictEqual([...used].sort(), ['A', 'B']);
});

test('training requirements distinguish insufficient, unknown and absent data', () => {
  const op = { name: '阿米娅', skill: 2, requirements: {
    elite: 2, level: 60, skill_level: 10, module: 1, module_level: 2, potential: 2
  } };
  const trained = { elite: 2, level: 80, mainSkill: 7, skill2: 3, modX: 2, potential: 2 };
  assert.strictEqual(checkOperatorTraining(op, trained).status, 'ok');
  assert.strictEqual(checkOperatorTraining(op, { ...trained, skill2: 1 }).status, 'low');
  assert.strictEqual(checkOperatorTraining(op, { ...trained, mainSkill: 6 }).status, 'low');
  assert.strictEqual(checkOperatorTraining(op, { ...trained, level: 1 }).status, 'low');
  assert.strictEqual(checkOperatorTraining(op, { ...trained, elite: 1, level: 1 }).detail, '当前精一1级，要求精二60级');
  assert.strictEqual(checkOperatorTraining(op, { ...trained, elite: 2, level: 1 }).detail, '当前精二1级，要求精二60级');
  assert.strictEqual(checkOperatorTraining({ name: '阿米娅', requirements: { elite: 2 } }, { elite: 1 }).detail,
    '当前精一，要求精二');
  assert.strictEqual(checkOperatorTraining(op, { ...trained, modX: 1 }).status, 'low');
  assert.strictEqual(checkOperatorTraining({ name: '阿米娅', requirements: { module: 3 } },
    { modD: 1 }).status, 'ok');
  assert.strictEqual(checkOperatorTraining(op, {}).status, 'unknown');
  assert.strictEqual(checkOperatorTraining({ name: '阿米娅', requirements: { elite: 0 } }, {}).status, 'ok');
  assert.strictEqual(checkOperatorTraining({ name: '阿米娅' }, {}).status, 'ok');
});

test('training prompts omit unpromoted prefixes and label selected skill mastery', () => {
  assert.strictEqual(checkOperatorTraining({ requirements: { elite: 0, level: 60 } },
    { elite: 0, level: 1 }).detail, '当前1级，要求60级');
  assert.strictEqual(checkOperatorTraining({ requirements: { elite: 2, level: 60 } },
    { elite: 0, level: 1 }).detail, '当前1级，要求精二60级');
  assert.strictEqual(checkOperatorTraining({ requirements: { elite: 2 } },
    { elite: 0 }).detail, '当前无，要求精二');
  [8, 9, 10].forEach((level, index) => {
    const op = { skill: 2, requirements: { skill_level: level } };
    assert.strictEqual(checkOperatorTraining(op, { mainSkill: 5 }).detail,
      `2技能当前5级，要求${['专一', '专二', '专三'][index]}`);
    assert.strictEqual(checkOperatorTraining(op, { mainSkill: 7, skill2: index + 1 }).status, 'ok');
  });
  assert.strictEqual(checkOperatorTraining({ skill: 2, requirements: { skill_level: 10 } },
    { mainSkill: 7, skill1: 3, skill2: 1 }).detail, '2技能当前专一，要求专三');
  assert.strictEqual(checkOperatorTraining({ skill: 2, requirements: { skill_level: 10 } },
    { mainSkill: 7 }).status, 'unknown');
  assert.strictEqual(checkOperatorTraining({ skill: 2, requirements: { skill_level: 7 } },
    { mainSkill: 5 }).detail, '2技能当前5级，要求7级');
});

test('training check combines support vacancies and group alternatives', () => {
  const operation = { parsedContent: {
    opers: [{ name: '阿米娅', skill: 2, requirements: { skill_level: 10 } }],
    groups: [{ name: '先锋', opers: [
      { name: '芬', requirements: { elite: 2 } },
      { name: '桃金娘', requirements: { elite: 1 } }
    ] }]
  } };
  const owned = new Set(['阿米娅', '芬', '桃金娘']);
  const training = { '阿米娅': { mainSkill: 7, skill2: 1 }, '芬': { elite: 0 }, '桃金娘': { elite: 1 } };
  let result = checkOperationAvailability(operation, owned, 'SUPPORT', training, true);
  assert.strictEqual(result.missingCount, 1);
  assert.strictEqual(result.isAvailable, true);
  assert.strictEqual(result.lowTraining.length, 1);
  assert.strictEqual(result.unknownTraining.length, 0);
  result = checkOperationAvailability(operation, owned, 'PERFECT',
    { '阿米娅': { mainSkill: 7, skill2: 3 }, '桃金娘': { elite: 1 } }, true);
  assert.strictEqual(result.unknownTraining.length, 0);
  result = checkOperationAvailability(operation, owned, 'PERFECT', training, true);
  assert.strictEqual(result.isAvailable, false);
  result = checkOperationAvailability(operation, owned, 'PERFECT', {}, true);
  assert.strictEqual(result.isAvailable, true);
  assert(result.unknownTraining.length > 0);
  result = checkOperationAvailability(operation, owned, 'PERFECT', training, false);
  assert.strictEqual(result.isAvailable, true);
  result = checkOperationAvailability(operation, new Set(['阿米娅', '芬']), 'PERFECT',
    { '阿米娅': { mainSkill: 7, skill2: 3 }, '芬': { elite: 0 } }, true);
  assert.strictEqual(result.lowTraining.length, 1);
  assert.strictEqual(result.missingOps[0], '[先锋]');
});

test('imported training survives account switches and backup normalization', () => {
  const imported = parseImportedOperators(JSON.stringify([
    { name: '阿米娅', elite: 2, level: 80, skill2: 3, own: true },
    { name: '芬', own: false }
  ]), 'maa.json');
  assert.deepStrictEqual(hostArray(imported.names), ['阿米娅']);
  const initial = createAccountState({ accountsData: { 1: imported.names }, accountsTraining: { 1: imported.training } });
  const restored = createAccountState(JSON.parse(serializeAccountState(createAccountSwitchState(initial, 2))));
  assert.strictEqual(restored.accountsTraining[1]['阿米娅'].skill2, 3);
  assert.strictEqual(restored.accountsTraining[1]['芬'], undefined);
});

test('matchOperatorGroups does not reuse already used operators', () => {
  const used = new Set(['A']);
  const missing = matchOperatorGroups([
    { name: 'needA', opers: [{ name: 'A' }] }
  ], new Set(['A']), used, false);
  assert.deepStrictEqual(hostArray(missing), ['[needA]']);
});

test('matchOperatorGroups skips empty fallback groups', () => {
  const missing = matchOperatorGroups([
    { name: 'unknown', opers: [] }
  ], new Set(['A']), new Set(), true);
  assert.deepStrictEqual(hostArray(missing), []);
});

test('parseAccountsBackup rejects single-account operator lists', () => {
  assert.throws(() => parseAccountsBackup(['Amiya']), /单账号/);
});

test('normalizeAccountMeta keeps legacy account metadata valid', () => {
  const meta = normalizeAccountMeta({
    1: { label: '主号', labelSource: 'manual' },
    2: { label: '', labelSource: 'manual' }
  });

  assert.strictEqual(meta[1].label, '主号');
  assert.strictEqual(meta[1].labelSource, 'manual');
  assert.strictEqual(meta[1].skland, undefined);
  assert.strictEqual(meta[2].labelSource, 'default');
});

test('normalizeSklandSyncMeta cleans and preserves valid per-account sync metadata', () => {
  const meta = normalizeSklandSyncMeta({
    uid: ' 123456789\x00 ',
    nickname: ' 博士\x7f ',
    importedAt: '2026-07-07T01:02:03.000Z',
    operatorCount: '42.9'
  });

  assert.deepStrictEqual(hostObject(meta), {
    uid: '123456789',
    nickname: '博士',
    importedAt: '2026-07-07T01:02:03.000Z',
    operatorCount: 42
  });
});

test('normalizeSklandSyncMeta tolerates empty identity and rejects invalid time', () => {
  assert.deepStrictEqual(hostObject(normalizeSklandSyncMeta({
    uid: '',
    nickname: '',
    importedAt: '2026-07-07T01:02:03.000Z',
    operatorCount: -10
  })), {
    uid: '',
    nickname: '',
    importedAt: '2026-07-07T01:02:03.000Z',
    operatorCount: 0
  });
  assert.strictEqual(normalizeSklandSyncMeta({
    uid: '123',
    nickname: '博士',
    importedAt: 'not-a-date',
    operatorCount: 1
  }), null);
});

test('normalizeSklandImportSummary normalizes legacy global summary shape', () => {
  const summary = normalizeSklandImportSummary({
    accountId: '3',
    accountLabel: '三号',
    uid: '10001',
    nickname: 'Doctor',
    importedAt: '2026-07-07T01:02:03.000Z',
    operatorCount: 12
  });

  assert.strictEqual(summary.accountId, 3);
  assert.strictEqual(summary.accountLabel, '三号');
  assert.strictEqual(summary.uid, '10001');
  assert.strictEqual(summary.operatorCount, 12);
});

test('parseAccountsBackup normalizes data and preferences', () => {
  const backup = parseAccountsBackup({
    type: ACCOUNT_BACKUP_TYPE,
    version: ACCOUNT_BACKUP_VERSION,
    activeAccountId: '2',
    accountsData: { 1: ['A', 'A', ''], 2: ['B'], 3: null },
    accountMeta: {
      2: {
        label: '<b>主号</b>',
        labelSource: 'manual',
        skland: {
          uid: '98765',
          nickname: '主号博士',
          importedAt: '2026-07-07T01:02:03.000Z',
          operatorCount: 396
        }
      }
    },
    preferences: {
      filterMode: 'PERFECT',
      displayMode: 'HIDE',
      config: { visuals: false, cleanLink: false, hideVideo: true, showExactTime: true, hideSidebar: true },
      floatingPosition: { top: '120%', isRight: false }
    }
  });

  assert.strictEqual(backup.activeAccountId, 2);
  assert.deepStrictEqual(hostArray(backup.accountsData[1]), ['A']);
  assert.deepStrictEqual(hostArray(backup.accountsData[2]), ['B']);
  assert.strictEqual(backup.accountMeta[2].label, '<b>主号</b>');
  assert.strictEqual(backup.accountMeta[2].labelSource, 'manual');
  assert.deepStrictEqual(hostObject(backup.accountMeta[2].skland), {
    uid: '98765',
    nickname: '主号博士',
    importedAt: '2026-07-07T01:02:03.000Z',
    operatorCount: 396
  });
  assert.strictEqual(backup.preferences.filterMode, 'PERFECT');
  assert.strictEqual(backup.preferences.displayMode, 'HIDE');
  assert.strictEqual(backup.preferences.config.operatorAvatars, false);
  assert.strictEqual(backup.preferences.config.stageBadge, false);
  assert.strictEqual(backup.preferences.config.popoverAvatars, false);
  assert.strictEqual(backup.preferences.config.collapseDescription, false);
  assert.strictEqual(backup.preferences.config.cleanLink, false);
  assert.strictEqual(backup.preferences.config.hideVideo, true);
  assert.strictEqual(backup.preferences.config.showExactTime, true);
  assert.strictEqual(backup.preferences.config.hideSidebar, true);
  assert.deepStrictEqual(hostObject(backup.preferences.floatingPosition), { top: '95%', isRight: false });
  assert.strictEqual(parseAccountsBackup({ type: ACCOUNT_BACKUP_TYPE, version: ACCOUNT_BACKUP_VERSION }).preferences.config.hideVideo, false);
  assert.strictEqual(parseAccountsBackup({ type: ACCOUNT_BACKUP_TYPE, version: ACCOUNT_BACKUP_VERSION }).preferences.config.showExactTime, false);
});

test('parseAccountsBackup rejects incompatible backup schema', () => {
  assert.throws(() => parseAccountsBackup({ type: ACCOUNT_BACKUP_TYPE, version: 999 }), /备份格式/);
});

test('getSklandArknightsBindingOptionsFromList normalizes multiple Arknights bindings', () => {
  const options = getSklandArknightsBindingOptionsFromList([
    {
      appCode: 'endfield',
      bindingList: [
        { uid: 'endfield-uid', nickname: '终末地博士', channelName: '鹰角网络' }
      ]
    },
    {
      appCode: 'arknights',
      defaultUid: '222222222',
      bindingList: [
        { uid: '111111111', nickName: '官服博士', channelName: '官服' },
        { uid: '', nickName: '空 UID', channelName: '官服' },
        { uid: '222222222', nickname: 'B服博士', channel: 'B服' },
        { uid: '222222222', nickname: '重复博士', channelName: 'B服' }
      ]
    }
  ]);

  assert.strictEqual(options.defaultUid, '222222222');
  assert.deepStrictEqual(hostObject(options.bindings), [
    {
      uid: '111111111',
      nickname: '官服博士',
      channelName: '官服',
      isDefault: false
    },
    {
      uid: '222222222',
      nickname: 'B服博士',
      channelName: 'B服',
      isDefault: true
    }
  ]);
});

test('normalizeSklandArknightsBindings keeps only valid real UID bindings', () => {
  const bindings = normalizeSklandArknightsBindings([
    { uid: 10001, nickName: '', channelName: '' },
    { uid: '', nickName: '空 UID' },
    { uid: 10001, nickName: '重复 UID' },
    { uid: '10002', nickname: '博士\x00', channel: '渠道服' }
  ], '10002');

  assert.deepStrictEqual(hostObject(bindings), [
    {
      uid: '10001',
      nickname: '10001',
      channelName: '官方',
      isDefault: false
    },
    {
      uid: '10002',
      nickname: '博士',
      channelName: '渠道服',
      isDefault: true
    }
  ]);
});

test('selectSklandBindingOption prefers the saved account UID', () => {
  const binding = selectSklandBindingOption([
    { uid: '111111111', nickname: '官服博士', channelName: '官服', isDefault: true },
    { uid: '222222222', nickname: 'B服博士', channelName: 'B服', isDefault: false }
  ], '222222222');

  assert.deepStrictEqual(hostObject(binding), {
    uid: '222222222',
    nickname: 'B服博士',
    channelName: 'B服',
    isDefault: false
  });
});

test('selectSklandBindingOption falls back to Skland default then first binding', () => {
  assert.deepStrictEqual(hostObject(selectSklandBindingOption([
    { uid: '111111111', nickname: '官服博士', channelName: '官服' },
    { uid: '222222222', nickname: 'B服博士', channelName: 'B服' }
  ], '999999999', '222222222')), {
    uid: '222222222',
    nickname: 'B服博士',
    channelName: 'B服',
    isDefault: true
  });

  assert.deepStrictEqual(hostObject(selectSklandBindingOption([
    { uid: '111111111', nickname: '官服博士', channelName: '官服' },
    { uid: '222222222', nickname: 'B服博士', channelName: 'B服' }
  ], '999999999', '333333333')), {
    uid: '111111111',
    nickname: '官服博士',
    channelName: '官服',
    isDefault: false
  });
});

test('selectSklandArknightsBinding uses matching non-empty defaultUid', () => {
  const binding = selectSklandArknightsBinding([
    {
      appCode: 'endfield',
      bindingList: [
        { uid: 'endfield-uid', defaultRole: { roleId: 'not-arknights', nickname: '终末地博士' } }
      ]
    },
    {
      appCode: 'arknights',
      defaultUid: '123456789',
      bindingList: [
        { uid: '000000000', nickName: '备用博士', channelName: 'B服' },
        { uid: '123456789', nickName: '雪糕我只吃铃兰的#5776', channelName: '官服' }
      ]
    }
  ]);

  assert.deepStrictEqual(hostObject(binding), {
    uid: '123456789',
    nickname: '雪糕我只吃铃兰的#5776',
    channelName: '官服',
    isDefault: true
  });
});

test('selectSklandArknightsBinding falls back to bindingList uid for empty defaultUid', () => {
  const binding = selectSklandArknightsBinding([
    {
      appCode: 'arknights',
      defaultUid: '',
      bindingList: [
        { uid: '987654321', nickName: '晓晗#7658', channelName: '官服' }
      ]
    }
  ]);

  assert.deepStrictEqual(hostObject(binding), {
    uid: '987654321',
    nickname: '晓晗#7658',
    channelName: '官服',
    isDefault: false
  });
});

test('selectSklandArknightsBinding treats blank defaultUid as missing', () => {
  const binding = selectSklandArknightsBinding([
    {
      appCode: 'arknights',
      defaultUid: '   ',
      bindingList: [
        { uid: '', nickName: '空 UID' },
        { uid: '456789123', nickname: 'Doctor', channel: '渠道服' }
      ]
    }
  ]);

  assert.deepStrictEqual(hostObject(binding), {
    uid: '456789123',
    nickname: 'Doctor',
    channelName: '渠道服',
    isDefault: false
  });
});

test('selectSklandArknightsBinding does not synthesize mismatched defaultUid roles', () => {
  const binding = selectSklandArknightsBinding([
    {
      appCode: 'arknights',
      defaultUid: '333333333',
      bindingList: [
        { uid: '111111111', nickName: '第一个博士', channelName: '官服' },
        { uid: '222222222', nickName: '第二个博士', channelName: 'B服' }
      ]
    }
  ]);

  assert.deepStrictEqual(hostObject(binding), {
    uid: '111111111',
    nickname: '第一个博士',
    channelName: '官服',
    isDefault: false
  });
});

test('selectSklandArknightsBinding ignores endfield bindings', () => {
  const binding = selectSklandArknightsBinding([
    {
      appCode: 'endfield',
      bindingList: [
        { uid: '987654321', defaultRole: { roleId: '0987654321', nickname: '晓晗' } }
      ]
    }
  ]);

  assert.strictEqual(binding, null);
});

test('convertSklandPlayerInfoToNames maps charInfoMap names and raw fallbacks', () => {
  const names = convertSklandPlayerInfoToNames({
    data: {
      chars: [
        { charId: 'char_a', name: 'RawA' },
        { id: 'char_b', name: 'FallbackB' },
        { charId: 'token_bad', name: 'Bad' },
        { charId: 'char_a', name: 'RawA' }
      ],
      charInfoMap: {
        char_a: { name: 'MetaA' }
      }
    }
  });
  assert.strictEqual(names.length, 2);
  assert(names.includes('MetaA'));
  assert(names.includes('FallbackB'));
});

test('convertSklandPlayerInfoToNames rejects empty Skland data', () => {
  assert.throws(() => convertSklandPlayerInfoToNames({ data: { chars: [] } }), /为空/);
});

test('Skland cultivation maps mastery, potential and module branches to the correct operator', () => {
  const training = convertSklandPlayerInfoToTraining({ data: {
    chars: [
      { id: 'char_002_amiya', evolvePhase: 2, level: 80, mainSkillLevel: 7, potentialRank: 1,
        skills: [{ level: 0 }, { level: 3 }] },
      { id: 'char_1035_wisdel', evolvePhase: 2, level: 1, mainSkillLevel: 7 },
      { id: 'char_1028_texas2', evolvePhase: 2, level: 60, mainSkillLevel: 7 },
      { id: 'char_003_kalts', evolvePhase: 2, level: 60, mainSkillLevel: 7 }
    ],
    charInfoMap: {
      char_002_amiya: { name: '阿米娅' },
      char_1035_wisdel: { name: '维什戴尔' },
      char_1028_texas2: { name: '缄默德克萨斯' },
      char_003_kalts: { name: '凯尔希' }
    }
  } }, { data: { characters: [
    { id: 'char_002_amiya', equips: [{ id: 'uniequip_002_amiya', level: 1 }] },
    { id: 'char_1035_wisdel', equips: [
      { id: 'uniequip_002_wisdel', level: 3 },
      { id: 'uniequip_002_amiya', level: 3 }
    ] },
    { id: 'char_1028_texas2', equips: [
      { id: 'uniequip_002_texas2', level: 2 },
      { id: 'uniequip_003_texas2', level: 1 }
    ] },
    { id: 'char_003_kalts', equips: [] }
  ] } });
  assert.strictEqual(training['阿米娅'].skill2, 3);
  assert.strictEqual(training['阿米娅'].potential, 2);
  assert.strictEqual(training['阿米娅'].modX, undefined);
  assert.strictEqual(training['阿米娅'].modY, 1);
  assert.strictEqual(training['维什戴尔'].modX, 3);
  assert.strictEqual(training['缄默德克萨斯'].modY, 2);
  assert.strictEqual(training['缄默德克萨斯'].modX, 1);
  assert.strictEqual(training['凯尔希'].modX, 0);
  assert.strictEqual(training['凯尔希'].modY, 0);
  assert.strictEqual(training['凯尔希'].modA, 0);
  assert.strictEqual(checkOperatorTraining({ name: '凯尔希', requirements: { module: 1 } },
    training['凯尔希']).status, 'low');
  assert.strictEqual(checkOperatorTraining({ name: '维什戴尔', requirements: { module: 1, module_level: 3 } },
    training['维什戴尔']).status, 'ok');
  assert.strictEqual(OP_MODULE_TYPES.char_1035_wisdel, 'X');
  assert.strictEqual(OP_MODULE_TYPES.char_4133_logos, 'DY');
  assert.strictEqual(Object.keys(OP_MODULE_TYPES).length, 378);
});

test('account state serialization preserves the normalized unified schema', () => {
  const state = createAccountState({
    activeAccountId: 2,
    accountsData: { 1: ['阿米娅'], 2: ['W'], 3: [] },
    accountMeta: { 2: { label: '主账号', labelSource: 'manual' } }
  });
  const parsed = JSON.parse(serializeAccountState(state));
  assert.deepStrictEqual(hostObject(createAccountState(parsed)), hostObject(state));
  assert.deepStrictEqual(Object.keys(parsed).sort(), ['accountMeta', 'accountsData', 'accountsTraining', 'activeAccountId']);
});

test('resolveStoredAccountState migrates missing metadata', () => {
  const result = resolveStoredAccountState({
    unifiedStore: JSON.stringify({ activeAccountId: 2, accountsData: { 1: [], 2: ['W'], 3: [] } })
  });
  assert.strictEqual(result.migrated, true);
  assert.strictEqual(result.state.activeAccountId, 2);
  assert.deepStrictEqual(hostArray(result.state.accountsData[2]), ['W']);
  assert.strictEqual(result.state.accountMeta[2].label, '账号 2');
});

test('resolveStoredAccountState migrates legacy stores and owned records', () => {
  const result = resolveStoredAccountState({
    legacyAccounts: { 2: JSON.stringify(['W', 'W']) },
    legacyActiveAccountId: 2,
    veryOldStore: JSON.stringify([
      { name: '阿米娅', own: true },
      { name: '能天使', own: false }
    ])
  });
  assert.strictEqual(result.migrated, true);
  assert.deepStrictEqual(hostArray(result.state.accountsData[1]), ['阿米娅']);
  assert.deepStrictEqual(hostArray(result.state.accountsData[2]), ['W']);
  assert.strictEqual(result.state.activeAccountId, 2);
});

test('resolveStoredAccountState migrates a legacy Skland summary into account metadata', () => {
  const result = resolveStoredAccountState({
    unifiedStore: JSON.stringify({
      activeAccountId: 1,
      accountsData: { 1: ['阿米娅'], 2: [], 3: [] },
      accountMeta: { 1: { label: '账号 1', labelSource: 'default' } }
    }),
    legacySklandSummary: JSON.stringify({
      accountId: 1,
      uid: '123',
      nickname: '博士',
      importedAt: '2026-07-19T00:00:00.000Z',
      operatorCount: 1
    })
  });
  assert.strictEqual(result.migrated, true);
  assert.strictEqual(result.state.accountMeta[1].skland.uid, '123');
  assert(result.diagnostics.some(item => item.code === 'migrated-skland-summary'));
});

test('resolveStoredAccountState reports corrupt unified data without exposing content', () => {
  const result = resolveStoredAccountState({ unifiedStore: '{secret-token:bad-json' });
  assert.strictEqual(result.migrated, false);
  assert.strictEqual(result.state.activeAccountId, 1);
  assert.deepStrictEqual(hostObject(result.diagnostics), [
    { code: 'invalid-unified-store', source: 'prts_plus_accounts_data' }
  ]);
});

test('commitAccountState leaves published state unchanged when storage fails', () => {
  const initial = publishAccountState(createAccountState({
    activeAccountId: 1,
    accountsData: { 1: ['阿米娅'], 2: [], 3: [] }
  }));
  failStorageKey = 'prts_plus_accounts_data';
  assert.throws(() => commitAccountState(createAccountSwitchState(initial, 2)), /storage failure/);
  failStorageKey = null;
  assert.deepStrictEqual(hostObject(getCurrentAccountState()), hostObject(initial));
  assert.deepStrictEqual(hostArray(getOwnedOpsSnapshot()), ['阿米娅']);
});

test('createRenamedAccountState preserves Skland metadata', () => {
  const initial = createAccountState({
    accountMeta: {
      1: {
        label: '森空岛昵称',
        labelSource: 'skland',
        skland: { uid: '123', nickname: '博士', importedAt: '2026-01-01T00:00:00.000Z', operatorCount: 10 }
      }
    }
  });
  const renamed = createRenamedAccountState(initial, 1, '手动昵称');
  assert.strictEqual(renamed.accountMeta[1].label, '手动昵称');
  assert.strictEqual(renamed.accountMeta[1].labelSource, 'manual');
  assert.strictEqual(renamed.accountMeta[1].skland.uid, '123');
});

test('createSklandImportState commits a complete transition and preserves manual labels', () => {
  const initial = createAccountState({
    activeAccountId: 1,
    accountsData: { 1: ['阿米娅'], 2: [], 3: [] },
    accountMeta: { 2: { label: '手动二号', labelSource: 'manual' } }
  });
  const result = createSklandImportState(initial, {
    accountId: 2,
    names: ['W', 'W', '能天使'],
    binding: { uid: '222', nickname: '森空岛博士' },
    importedAt: '2026-07-19T00:00:00.000Z'
  });
  assert.strictEqual(result.state.activeAccountId, 2);
  assert.deepStrictEqual(hostArray(result.state.accountsData[2]), ['W', '能天使']);
  assert.strictEqual(result.state.accountMeta[2].label, '手动二号');
  assert.strictEqual(result.summary.operatorCount, 2);
  assert.deepStrictEqual(hostArray(initial.accountsData[2]), []);
});

test('commitSklandImportResult treats the compatibility summary as non-critical', () => {
  const result = createSklandImportState(createAccountState(), {
    accountId: 3,
    names: ['阿米娅'],
    binding: { uid: '333', nickname: '博士三号' },
    importedAt: '2026-07-19T00:00:00.000Z'
  });
  failStorageKey = 'prts_plus_skland_last_import';
  const warningCount = warnings.length;
  const summary = commitSklandImportResult(result);
  failStorageKey = null;
  assert.strictEqual(summary.accountId, 3);
  assert.strictEqual(getCurrentAccountState().activeAccountId, 3);
  assert(!storage.get('prts_plus_accounts_data').includes('credential'));
  assert(!storage.get('prts_plus_accounts_data').includes('token'));
  assert.strictEqual(warnings.length, warningCount + 1);
});

function createSchedulerHarness(run = () => {}) {
  let nextId = 1;
  const frames = new Map();
  const delays = new Map();
  const coordinator = createFilterUpdateCoordinator({
    requestFrame(callback) {
      const id = nextId++;
      frames.set(id, callback);
      return id;
    },
    cancelFrame(id) {
      frames.delete(id);
    },
    setDelay(callback) {
      const id = nextId++;
      delays.set(id, callback);
      return id;
    },
    clearDelay(id) {
      delays.delete(id);
    },
    run
  });
  return { coordinator, frames, delays };
}

function runOnlyCallback(callbacks) {
  assert.strictEqual(callbacks.size, 1);
  const callback = callbacks.values().next().value;
  callbacks.clear();
  callback();
}

test('filter coordinator coalesces frames and dirty cards', () => {
  let runs = 0;
  const harness = createSchedulerHarness(() => { runs += 1; });
  harness.coordinator.takeWork([]);
  const first = { isConnected: true };
  const second = { isConnected: true };
  harness.coordinator.request({ forceFull: false, dirtyCards: new Set([first]) });
  harness.coordinator.request({ forceFull: false, dirtyCards: new Set([second]) });
  runOnlyCallback(harness.frames);
  const work = harness.coordinator.takeWork([]);
  assert.strictEqual(runs, 1);
  assert.strictEqual(work.processAll, false);
  assert.deepStrictEqual(hostArray(work.cards), [first, second]);
});

test('filter coordinator keeps full updates dominant across debounce replacement', () => {
  const harness = createSchedulerHarness();
  harness.coordinator.takeWork([]);
  const dirty = { isConnected: true };
  harness.coordinator.schedule(80, { forceFull: true });
  harness.coordinator.schedule(40, { forceFull: false, dirtyCards: [dirty] });
  runOnlyCallback(harness.delays);
  runOnlyCallback(harness.frames);
  const allCards = [{ isConnected: true }];
  const work = harness.coordinator.takeWork(allCards);
  assert.strictEqual(work.processAll, true);
  assert.strictEqual(work.cards, allCards);
});

test('filter coordinator reset forces the next run to process all cards', () => {
  const harness = createSchedulerHarness();
  harness.coordinator.takeWork([]);
  harness.coordinator.request({ forceFull: false, dirtyCards: [{ isConnected: true }] });
  harness.coordinator.reset();
  const allCards = [{ isConnected: true }];
  const work = harness.coordinator.takeWork(allCards);
  assert.strictEqual(work.processAll, true);
  assert.strictEqual(work.cards, allCards);
});

test('filter coordinator can schedule again after a run throws', () => {
  let shouldThrow = true;
  const harness = createSchedulerHarness(() => {
    if (shouldThrow) throw new Error('filter failure');
  });
  harness.coordinator.request();
  assert.throws(() => runOnlyCallback(harness.frames), /filter failure/);
  shouldThrow = false;
  harness.coordinator.request();
  assert.doesNotThrow(() => runOnlyCallback(harness.frames));
});

(async () => {
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`ok - ${name}`);
    } catch (error) {
      console.error(`not ok - ${name}`);
      throw error;
    }
  }
  console.log('All core function tests passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
