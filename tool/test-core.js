const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const sourceFiles = [
  'src/core/constants.js',
  'src/data/operators.generated.js',
  'src/data/module-types.generated.js',
  'src/data/resources.js',
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
  BUILTIN_RESOURCE_VERSION,
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
  OP_ID_MAP,
  RESOURCE_CACHE_KEY,
  RESOURCE_URL,
  validateResourceData,
  refreshResourceViews,
  buildFallbackOperation,
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
  syncOperatorMatchingSettings,
  syncOperationCardTime,
  updateTrainingStatusLabel,
  CONFIG,
  getCurrentAccountState,
  getOwnedOpsSnapshot: () => Array.from(ownedOpsSet),
  publishAccountState,
  commitAccountState,
  commitSklandImport,
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
  BUILTIN_RESOURCE_VERSION,
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
  OP_ID_MAP,
  RESOURCE_CACHE_KEY,
  RESOURCE_URL,
  validateResourceData,
  refreshResourceViews,
  buildFallbackOperation,
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
  syncOperatorMatchingSettings,
  syncOperationCardTime,
  updateTrainingStatusLabel,
  CONFIG,
  getCurrentAccountState,
  getOwnedOpsSnapshot,
  publishAccountState,
  commitAccountState,
  commitSklandImport,
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

const resourceSnapshot = JSON.parse(fs.readFileSync(path.join(repoRoot, 'resources/data.json'), 'utf8'));
const updatedResource = {
  schemaVersion: 1,
  resourceVersion: resourceSnapshot.resourceVersion + 1,
  operators: [{ id: 'char_999999_hotupdate', name: '测试干员' }],
  moduleTypes: { char_999999_hotupdate: 'YX' }
};

function createResourceHarness(cache = null, builtinVersion = resourceSnapshot.resourceVersion) {
  let now = 1700000000000;
  let refreshes = 0;
  let aborts = 0;
  const abortedUrls = [];
  const timers = new Map();
  const requests = [];
  const toasts = [];
  const saved = new Map();
  const sandbox = {
    BUILTIN_RESOURCE_VERSION: builtinVersion,
    OP_ID_MAP: { 旧干员: 'char_999998_old' },
    OP_MODULE_TYPES: { char_999998_old: 'X' },
    isPlainRecord: value => Boolean(value) && typeof value === 'object' && !Array.isArray(value),
    isPrtsHost: () => true,
    refreshResourceViews: () => { refreshes++; },
    showPrtsToast: (...args) => {
      const toast = [args];
      toasts.push(toast);
      return (...next) => toast.push(next);
    },
    console: { warn() {} },
    Date: { now: () => now },
    setTimeout: callback => { const id = Symbol(); timers.set(id, callback); return id; },
    clearTimeout: id => timers.delete(id),
    GM_getValue: (key, fallback) => saved.has(key) ? saved.get(key) : fallback,
    GM_setValue: (key, value) => saved.set(key, value),
    GM_xmlhttpRequest: request => {
      requests.push(request);
      return { abort: () => { aborts++; abortedUrls.push(request.url); } };
    }
  };
  if (cache !== null) saved.set(RESOURCE_CACHE_KEY, cache);
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'src/data/resources.js'), 'utf8') + `
    globalThis.api = { RESOURCE_URLS, loadCachedResources, updateResources, applyResourceData };
  `, sandbox);
  return {
    sandbox, requests, saved, timers, toasts, abortedUrls,
    get aborts() { return aborts; },
    api: sandbox.api,
    get refreshes() { return refreshes; },
    advance: () => { now += 60 * 60 * 1000; },
    respond: (data = updatedResource, status = 200, request = requests.at(-1)) => request.onload({
      status, responseText: typeof data === 'string' ? data : JSON.stringify(data)
    })
  };
}

test('published resources match embedded operator and module snapshots', () => {
  validateResourceData(resourceSnapshot);
  assert.strictEqual(resourceSnapshot.resourceVersion, BUILTIN_RESOURCE_VERSION);
  assert.deepStrictEqual(resourceSnapshot.operators,
    JSON.parse(fs.readFileSync(path.join(repoRoot, 'tool/operator-data.generated.json'), 'utf8')));
  assert.deepStrictEqual(resourceSnapshot.moduleTypes, hostObject(OP_MODULE_TYPES));
  assert.deepStrictEqual(Object.fromEntries(resourceSnapshot.operators.map(op => [op.name, op.id])), hostObject(OP_ID_MAP));
});

test('resource hot update replaces live tables, persists cache and throttles duplicate requests', async () => {
  const h = createResourceHarness();
  const pending = h.api.updateResources();
  assert.strictEqual(h.api.updateResources(), pending);
  assert.strictEqual(h.requests.length, h.api.RESOURCE_URLS.length);
  assert.strictEqual(h.requests[0].url, RESOURCE_URL);
  assert.deepStrictEqual(h.requests.map(request => request.url), hostObject(h.api.RESOURCE_URLS));
  const header = fs.readFileSync(path.join(repoRoot, 'src/meta/userscript-header.js'), 'utf8');
  for (const request of h.requests) {
    assert.strictEqual(request.anonymous, true);
    assert(header.includes(`// @connect      ${new URL(request.url).hostname}`));
  }
  assert.strictEqual(h.toasts.length, 1);
  assert.strictEqual(h.toasts[0][0][1], 'loading');
  assert.strictEqual(h.toasts[0][0][3], 0);
  h.respond();
  assert.strictEqual(await pending, true);
  assert.deepStrictEqual(hostObject(h.sandbox.OP_ID_MAP), { 测试干员: 'char_999999_hotupdate' });
  assert.deepStrictEqual(hostObject(h.sandbox.OP_MODULE_TYPES), updatedResource.moduleTypes);
  assert.deepStrictEqual(JSON.parse(h.saved.get(RESOURCE_CACHE_KEY)).data, updatedResource);
  assert.strictEqual(h.refreshes, 1);
  assert.strictEqual(h.timers.size, 0);
  assert.deepStrictEqual(h.abortedUrls, h.requests.slice(0, -1).map(request => request.url));
  // A cancelled request may still deliver a late response; it must not overwrite the winner.
  h.respond(resourceSnapshot, 200, h.requests[0]);
  assert.strictEqual(h.refreshes, 1);
  assert.deepStrictEqual(JSON.parse(h.saved.get(RESOURCE_CACHE_KEY)).data, updatedResource);
  assert.strictEqual(h.toasts[0].at(-1)[1], 'success');
  assert.strictEqual(await h.api.updateResources(), false);
  assert.strictEqual(h.toasts.length, 1);
  assert.strictEqual(h.requests.length, h.api.RESOURCE_URLS.length);
  h.advance();
  const next = h.api.updateResources();
  h.respond({ ...updatedResource, resourceVersion: updatedResource.resourceVersion + 1, moduleTypes: { char_999999_hotupdate: 'YXA' } });
  assert.strictEqual(await next, true);
  assert.strictEqual(h.sandbox.OP_MODULE_TYPES.char_999999_hotupdate, 'YXA');
});

test('invalid or unavailable sources do not block a valid mirror or origin', async () => {
  for (const winner of [0, 1, 2]) {
    const h = createResourceHarness();
    const pending = h.api.updateResources();
    const failures = h.requests.filter((_, index) => index !== winner);
    h.respond({ ...updatedResource, schemaVersion: 2 }, 200, failures[0]);
    failures[1].onerror();
    h.respond(updatedResource, 200, h.requests[winner]);
    assert.strictEqual(await pending, true);
    assert.strictEqual(h.sandbox.OP_ID_MAP.测试干员, 'char_999999_hotupdate');
    assert.strictEqual(h.refreshes, 1);
    assert.strictEqual(h.timers.size, 0);
  }
});

test('one source throwing on request startup does not block other mirrors', async () => {
  const h = createResourceHarness();
  const request = h.sandbox.GM_xmlhttpRequest;
  h.sandbox.GM_xmlhttpRequest = options => {
    if (options.url === RESOURCE_URL) throw new Error('source unavailable');
    return request(options);
  };
  const pending = h.api.updateResources();
  h.respond();
  assert.strictEqual(await pending, true);
  assert.strictEqual(h.requests.length, h.api.RESOURCE_URLS.length - 1);
  assert.strictEqual(h.timers.size, 0);
});

test('cached resources load immediately and survive failed refreshes', async () => {
  const cache = JSON.stringify({ data: updatedResource, checkedAt: 1700000000000 });
  const h = createResourceHarness(cache);
  h.api.loadCachedResources();
  assert.strictEqual(h.sandbox.OP_ID_MAP.测试干员, 'char_999999_hotupdate');
  assert.strictEqual(await h.api.updateResources(), false);
  assert.strictEqual(h.requests.length, 0);
  assert.strictEqual(h.toasts.length, 0);
  h.advance();
  for (const failure of ['onerror', 'ontimeout', 'onabort']) {
    const pending = h.api.updateResources();
    h.requests.slice(-h.api.RESOURCE_URLS.length).forEach(request => request[failure]());
    assert.strictEqual(await pending, false);
    assert.strictEqual(h.sandbox.OP_ID_MAP.测试干员, 'char_999999_hotupdate');
    assert.strictEqual(h.saved.get(RESOURCE_CACHE_KEY), cache);
    assert.strictEqual(h.toasts.at(-1).at(-1)[1], 'error');
    assert(h.toasts.at(-1).at(-1)[2].includes('所有资源下载源均不可用'));
    assert(h.toasts.at(-1).at(-1)[2].includes('继续使用已有数据'));
    assert.strictEqual(h.timers.size, 0);
  }
});

test('a future cache timestamp does not prevent resource refresh', async () => {
  const h = createResourceHarness(JSON.stringify({ data: updatedResource, checkedAt: 1800000000000 }));
  h.api.loadCachedResources();
  const pending = h.api.updateResources();
  assert.strictEqual(h.requests.length, h.api.RESOURCE_URLS.length);
  h.respond();
  assert.strictEqual(await pending, true);
});

test('resource requests time out even when the browser ignores the native timeout', async () => {
  const h = createResourceHarness();
  const pending = h.api.updateResources();
  [...h.timers.values()].forEach(callback => callback());
  assert.strictEqual(await pending, false);
  assert.strictEqual(h.aborts, h.api.RESOURCE_URLS.length);
  assert.strictEqual(h.timers.size, 0);
  h.respond();
  assert.deepStrictEqual(hostObject(h.sandbox.OP_ID_MAP), { 旧干员: 'char_999998_old' });
  const retry = h.api.updateResources();
  h.respond();
  assert.strictEqual(await retry, true);
});

test('invalid resources never replace working tables or cache', async () => {
  const badData = [
    '{broken',
    { ...updatedResource, schemaVersion: 2 },
    ...[undefined, null, 0, -1, 1.5, '2', Number.MAX_SAFE_INTEGER + 1].map(resourceVersion => ({ ...updatedResource, resourceVersion })),
    { ...updatedResource, operators: [] },
    { ...updatedResource, operators: [...updatedResource.operators, ...updatedResource.operators] },
    { ...updatedResource, operators: [{ id: '../secret', name: '无效' }] },
    { ...updatedResource, operators: [{ id: 'char_999999_hotupdate', name: ' invalid ' }] },
    { ...updatedResource, moduleTypes: {} },
    { ...updatedResource, moduleTypes: { char_999999_hotupdate: 'INVALID' } },
    ' '.repeat(2 * 1024 * 1024 + 1)
  ];
  const h = createResourceHarness('{broken');
  h.api.loadCachedResources();
  for (const data of badData) {
    const pending = h.api.updateResources();
    h.requests.slice(-h.api.RESOURCE_URLS.length).forEach(request => h.respond(data, 200, request));
    assert.strictEqual(await pending, false);
    assert.deepStrictEqual(hostObject(h.sandbox.OP_ID_MAP), { 旧干员: 'char_999998_old' });
    assert.deepStrictEqual(hostObject(h.sandbox.OP_MODULE_TYPES), { char_999998_old: 'X' });
    assert.strictEqual(h.saved.get(RESOURCE_CACHE_KEY), '{broken');
  }
  const pending = h.api.updateResources();
  h.requests.slice(-h.api.RESOURCE_URLS.length).forEach(request => h.respond(updatedResource, 503, request));
  assert.strictEqual(await pending, false);
});

test('resource update remains usable when cache persistence fails', async () => {
  const h = createResourceHarness();
  h.sandbox.GM_setValue = () => { throw new Error('storage failed'); };
  const pending = h.api.updateResources();
  h.respond();
  assert.strictEqual(await pending, true);
  assert.strictEqual(h.sandbox.OP_ID_MAP.测试干员, 'char_999999_hotupdate');
  assert.strictEqual(h.refreshes, 1);
  assert.strictEqual(h.toasts[0].at(-1)[1], 'warning');
  assert(h.toasts[0].at(-1)[0].includes('缓存保存失败'));
});

test('older and unversioned caches cannot replace newer embedded resources or delay refresh', async () => {
  for (const resourceVersion of [undefined, 1, 2]) {
    const cache = JSON.stringify({ data: { ...updatedResource, resourceVersion }, checkedAt: 1700000000000 });
    const h = createResourceHarness(cache, 3);
    h.api.loadCachedResources();
    assert.deepStrictEqual(hostObject(h.sandbox.OP_ID_MAP), { 旧干员: 'char_999998_old' });
    assert.deepStrictEqual(hostObject(h.sandbox.OP_MODULE_TYPES), { char_999998_old: 'X' });
    const pending = h.api.updateResources();
    assert.strictEqual(h.requests.length, h.api.RESOURCE_URLS.length);
    h.respond({ ...updatedResource, resourceVersion: 4 });
    assert.strictEqual(await pending, true);
  }
});

test('a stale mirror response cannot win before a newer source or overwrite a newer cache', async () => {
  for (const cached of [false, true]) {
    const cache = cached ? JSON.stringify({ data: { ...updatedResource, resourceVersion: 3 }, checkedAt: 0 }) : null;
    const h = createResourceHarness(cache, cached ? 1 : 3);
    h.api.loadCachedResources();
    const beforeOperators = hostObject(h.sandbox.OP_ID_MAP);
    const beforeModules = hostObject(h.sandbox.OP_MODULE_TYPES);
    const pending = h.api.updateResources();
    h.respond({ ...updatedResource, resourceVersion: 2 }, 200, h.requests[1]);
    await new Promise(setImmediate);
    assert.deepStrictEqual(hostObject(h.sandbox.OP_ID_MAP), beforeOperators);
    assert.deepStrictEqual(hostObject(h.sandbox.OP_MODULE_TYPES), beforeModules);
    assert.strictEqual(h.saved.get(RESOURCE_CACHE_KEY), cache ?? undefined);
    assert.strictEqual(h.aborts, 0);
    const newer = { ...updatedResource, resourceVersion: 4, moduleTypes: { char_999999_hotupdate: 'YXA' } };
    h.respond(newer, 200, h.requests[0]);
    assert.strictEqual(await pending, true);
    assert.strictEqual(h.sandbox.OP_MODULE_TYPES.char_999999_hotupdate, 'YXA');
    assert.deepStrictEqual(JSON.parse(h.saved.get(RESOURCE_CACHE_KEY)).data, newer);
    assert.throws(() => h.api.applyResourceData({ ...updatedResource, resourceVersion: 3 }));
    assert.strictEqual(h.sandbox.OP_MODULE_TYPES.char_999999_hotupdate, 'YXA');
    assert.strictEqual(h.timers.size, 0);
  }
});

test('all stale or unversioned download sources preserve current resources and cache', async () => {
  const cache = JSON.stringify({ data: { ...updatedResource, resourceVersion: 3 }, checkedAt: 0 });
  const h = createResourceHarness(cache, 1);
  h.api.loadCachedResources();
  const pending = h.api.updateResources();
  h.requests.forEach((request, index) => h.respond({ ...updatedResource, resourceVersion: index || undefined }, 200, request));
  assert.strictEqual(await pending, false);
  assert.strictEqual(h.sandbox.OP_ID_MAP.测试干员, 'char_999999_hotupdate');
  assert.strictEqual(h.sandbox.OP_MODULE_TYPES.char_999999_hotupdate, 'YX');
  assert.strictEqual(h.saved.get(RESOURCE_CACHE_KEY), cache);
  assert.strictEqual(h.refreshes, 0);
  assert.strictEqual(h.timers.size, 0);
});

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
    assert.strictEqual(migrated.trainingPromptStyle, 'COMPACT');
    assert.strictEqual(migrated.hideOperatorMatchingSettings, true);
    assert.strictEqual(normalizeConfig({ hideOperatorMatchingSettings: false }).hideOperatorMatchingSettings, false);
    assert.strictEqual(normalizeConfig({ trainingPromptStyle: 'DETAILED' }).trainingPromptStyle, 'DETAILED');
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
      trainingCheck: 'true', trainingPromptStyle: 'invalid', floatingPosition: '{bad-json', unknown: true
    });
    assert.strictEqual(invalid.operatorAvatars, true);
    assert.strictEqual(invalid.hideVideo, false);
    assert.strictEqual(invalid.trainingCheck, false);
    assert.strictEqual(invalid.trainingPromptStyle, 'COMPACT');
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
    replaceChildren(...children) {
      this.children.slice().forEach(child => child.remove());
      text = '';
      children.forEach(child => this.appendChild(child));
    },
    remove() {
      if (this.parentElement) this.parentElement.children.splice(this.parentElement.children.indexOf(this), 1);
      this.parentElement = null;
    },
    setAttribute(key, value) { this.attributes.set(key, value); },
    removeAttribute(key) { this.attributes.delete(key); },
    closest() { return null; },
    querySelector(selector) {
      return this.children.find(child => selector === `.${child.className}` || selector.toUpperCase() === child.tagName)
        || this.children.map(child => child.querySelector(selector)).find(Boolean) || null;
    },
    querySelectorAll() { return []; }
  };
  node.classList = {
    contains: name => node.className.split(/\s+/).includes(name),
    add: name => { node.className = `${node.className} ${name}`.trim(); },
    toggle: (name, force = !node.classList.contains(name)) => {
      if (force) node.classList.add(name);
      else node.classList.remove(name);
      return force;
    },
    replace: (oldName, newName) => { node.className = node.className.split(/\s+/).map(value => value === oldName ? newName : value).join(' '); },
    remove: name => { node.className = node.className.split(/\s+/).filter(value => value !== name).join(' '); }
  };
  return node;
}

test('both host branches inject toast layout, state and reduced-motion styles', () => {
  for (const skland of [false, true]) {
    let css = '';
    vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'src/styles/styles.js'), 'utf8'), {
      isSklandHost: () => skland,
      GM_addStyle: styles => { css += styles; }
    });
    assert.match(css, /#prts-toast-container\s*\{[^}]*position:\s*fixed/, skland ? 'Skland' : 'PRTS Plus');
    for (const state of ['loading', 'success', 'error']) {
      assert(css.includes(`.prts-toast.${state}`), `${skland ? 'Skland' : 'PRTS Plus'}: ${state}`);
    }
    assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.prts-toast/);
    assert(css.includes('.prts-toast.is-leaving'));
  }
});

test('sync toasts persist while loading, update in place and dismiss after completion', () => {
  const body = createTestElement('body');
  const timers = new Map();
  const sandbox = {
    document: {
      body, createElement: createTestElement,
      getElementById: id => body.children.find(child => child.id === id)
    },
    window: {
      setTimeout: (callback, delay) => { const id = Symbol(); timers.set(id, { callback, delay }); return id; },
      clearTimeout: id => timers.delete(id)
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'src/ui/dom-helpers.js'), 'utf8'), sandbox);
  const update = sandbox.showPrtsToast('同步中', 'loading', '正在读取数据', 0);
  const container = body.firstChild;
  const toast = container.firstChild;
  assert.strictEqual(container.attributes.get('aria-live'), 'polite');
  assert.strictEqual(toast.className, 'prts-toast loading');
  assert.strictEqual(timers.size, 0);
  update('同步成功', 'success', '已更新数据');
  assert.strictEqual(container.children.length, 1);
  assert.strictEqual(container.firstChild, toast);
  assert.strictEqual(toast.className, 'prts-toast success');
  assert.strictEqual(toast.firstChild.textContent, '同步成功');
  assert.strictEqual(toast.lastChild.textContent, '已更新数据');
  const dismiss = [...timers.values()][0];
  assert.strictEqual(dismiss.delay, 4000);
  timers.clear();
  dismiss.callback();
  assert(toast.classList.contains('is-leaving'));
  const remove = [...timers.values()][0];
  assert.strictEqual(remove.delay, 220);
  remove.callback();
  assert.strictEqual(container.children.length, 0);
});

test('Skland sync reports success, failure and cancellation and restores controls', async () => {
  for (const outcome of ['success', 'error', 'cancel']) {
    const body = createTestElement('body');
    const messages = [];
    let complete;
    const sandbox = {
      document: {
        body, createElement: createTestElement,
        getElementById: id => body.children.find(child => child.id === id)
      },
      activeAccountId: '1', ACCOUNT_IDS: ['1', '2', '3'],
      normalizeAccountId: id => id,
      getAccountLabel: id => `账号 ${id}`,
      formatAccountSklandTitle: () => '',
      getAccountSklandImportSummary: () => null,
      createPrtsIcon: () => createTestElement('svg'),
      showPrtsToast: (...args) => { messages.push(args); return (...next) => messages.push(next); },
      importSklandOperatorsToAccount: () => new Promise((resolve, reject) => {
        complete = () => outcome === 'success' ? resolve({ accountId: '1' }) : reject(new Error(outcome));
      }),
      isSklandImportCancelledError: error => error.message === 'cancel',
      console: { error() {} }
    };
    vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'src/ui/panels.js'), 'utf8'), sandbox);
    sandbox.formatSklandImportSummary = () => '账号 1 已导入 2 名干员。';
    sandbox.createSklandImportPanel();
    const panel = body.firstChild;
    const button = panel.querySelector('.prts-skland-primary');
    const status = panel.querySelector('.prts-skland-status');
    const accounts = panel.querySelector('.prts-skland-accounts').children;
    const pending = button.onclick();
    assert.strictEqual(button.disabled, true);
    assert(accounts.every(account => account.disabled));
    assert.strictEqual(messages[0][1], 'loading');
    assert.strictEqual(messages[0][3], 0);
    complete();
    await pending;
    assert.strictEqual(button.disabled, false);
    assert(accounts.every(account => !account.disabled));
    assert.strictEqual(messages.length, 2);
    assert.strictEqual(messages[1][1], outcome === 'cancel' ? 'info' : outcome);
    assert.strictEqual(status.attributes.get('role'), outcome === 'error' ? 'alert' : 'status');
  }
});

test('hot updates upgrade rendered unknown operators and keep fallback filtering requirements', () => {
  const savedAvatars = CONFIG.operatorAvatars;
  const savedContext = { document: context.document, requestFilterUpdate: context.requestFilterUpdate };
  let refreshes = 0;
  const item = createTestElement();
  item.className = 'prts-op-text';
  item.title = '测试干员 2';
  item.setAttribute('aria-label', item.title);
  item.appendChild(createTestElement('span', '测试干员'));
  const skill = createTestElement('div', '2');
  skill.className = 'prts-op-skill';
  item.appendChild(skill);
  const group = createTestElement('div', '干员组');
  group.className = 'prts-op-text';
  context.document = {
    createElement: createTestElement,
    querySelectorAll: () => [item, group].filter(node => node.className === 'prts-op-text')
  };
  context.requestFilterUpdate = () => { refreshes++; };
  OP_ID_MAP.测试干员 = 'char_999999_hotupdate';
  CONFIG.operatorAvatars = true;
  try {
    refreshResourceViews();
    refreshResourceViews();
    assert.strictEqual(refreshes, 2);
    assert.strictEqual(item.className, 'prts-op-item');
    assert.strictEqual(item.firstChild.alt, '测试干员');
    assert.strictEqual(item.firstChild.src, '/assets/operator-avatars/webp96/char_999999_hotupdate.webp');
    assert.strictEqual(item.lastChild, skill);
    assert.strictEqual(item.attributes.get('aria-label'), '测试干员 2');
    assert.strictEqual(group.className, 'prts-op-text');
    const operation = buildFallbackOperation({ querySelectorAll: () => [item] });
    assert.deepStrictEqual(hostObject(operation.parsedContent.opers), [{ name: '测试干员' }]);
    CONFIG.operatorAvatars = false;
    refreshResourceViews();
    assert.strictEqual(refreshes, 3);
  } finally {
    delete OP_ID_MAP.测试干员;
    CONFIG.operatorAvatars = savedAvatars;
    Object.assign(context, savedContext);
  }
});

test('stage badges retry delayed metadata and recover after a heading rerender', () => {
  const savedStageBadge = CONFIG.stageBadge;
  const savedDocument = context.document;
  CONFIG.stageBadge = true;
  context.document = { createElement: createTestElement };
  try {
    const heading = createTestElement('h4', '昨日海 - YW-8 - 鳞的记忆 一摆到底版');
    const stageCode = createTestElement('span', 'act52side_08');
    const card = { querySelector: selector => selector.startsWith('h4') ? heading : stageCode };

    addStageBadge(card);
    assert.strictEqual(heading.querySelector('.prts-level-badge'), null);

    stageCode.innerText = 'YW-8';
    addStageBadge(card);
    const badge = heading.querySelector('.prts-level-badge');
    assert.strictEqual(badge?.innerText, 'YW-8');
    assert.strictEqual(badge.title, 'YW-8');
    assert(heading.textContent.includes('昨日海 - YW-8 - 鳞的记忆'));

    addStageBadge(card);
    assert.strictEqual(heading.children.length, 1);

    badge.remove();
    addStageBadge(card);
    assert.strictEqual(heading.querySelector('.prts-level-badge')?.innerText, 'YW-8');
    assert.strictEqual(heading.children.length, 1);
  } finally {
    CONFIG.stageBadge = savedStageBadge;
    context.document = savedDocument;
  }
});

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
      if (definition.group) CONFIG[key] = definition.options
        ? definition.options.find(value => value !== definition.default) : !definition.default;
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
    assert.strictEqual(restored.trainingPromptStyle, 'DETAILED');
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

test('native matching settings hide and restore without hiding neighboring controls', () => {
  const savedDocument = context.document;
  const button = createTestElement('button', ' 干员匹配设置 ');
  const otherButton = createTestElement('button', '其他设置');
  const group = createTestElement();
  group.matches = selector => selector === 'div.flex.flex-wrap.items-center.gap-1';
  group.appendChild(button);
  context.document = {
    querySelectorAll(selector) {
      assert.strictEqual(selector, 'button.bp4-button, button.bp6-button');
      return [button, otherButton];
    }
  };
  try {
    syncOperatorMatchingSettings();
    syncOperatorMatchingSettings();
    assert.strictEqual(button.style.display, 'none');
    assert.strictEqual(group.style.display, 'none');
    assert.strictEqual(otherButton.style.display, undefined);
    group.appendChild(otherButton);
    syncOperatorMatchingSettings();
    assert.strictEqual(group.style.display, '');
    assert.strictEqual(button.style.display, 'none');
    assert.strictEqual(otherButton.style.display, undefined);
    syncOperatorMatchingSettings(false);
    assert.strictEqual(button.style.display, '');
    assert.strictEqual(group.style.display, '');
    button.remove();
    syncOperatorMatchingSettings(true);
    assert.strictEqual(button.style.display, 'none');
  } finally {
    context.document = savedDocument;
  }
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

test('BOM JSON parses names and MAA training consistently for files and pasted text', () => {
  const payloads = [
    { raw: '["阿米娅","W"]', expected: { names: ['阿米娅', 'W'], training: {} } },
    {
      raw: JSON.stringify([
        { name: '阿米娅', own: true, elite: 2, level: 80, mainSkill: 7, skill2: 3 },
        { name: 'W', own: false, level: 90 }
      ]),
      expected: { names: ['阿米娅'], training: { 阿米娅: { elite: 2, level: 80, mainSkill: 7, skill2: 3 } } }
    }
  ];
  for (const { raw, expected } of payloads) {
    for (const fileName of ['operators.json', '']) {
      assert.deepStrictEqual(hostObject(parseImportedOperators('\uFEFF' + raw, fileName)), expected);
      assert.deepStrictEqual(hostArray(parseImportedOperatorNames('\uFEFF' + raw, fileName)), expected.names);
    }
  }
});

test('operation parsing rejects malformed entries instead of discarding requirements', () => {
  const malformed = [
    { opers: [null] }, { opers: [{ name: '阿米娅' }, null] },
    { opers: ['阿米娅'] }, { opers: [{}] }, { opers: [{ name: 1 }] },
    { groups: [null] }, { groups: ['术师'] },
    { groups: [{ name: '术师', opers: [null] }] },
    { groups: [{ opers: ['阿米娅'] }] }, { groups: [{ opers: {} }] },
    { opers: {} }, { groups: {} }, { parsedContent: [] },
    { parsedContent: { groups: [null] } },
    { content: '{broken' }, { content: '{"opers":[null]}' }
  ];
  for (const operation of malformed) {
    assert.throws(() => context.getParsedOperationContent(operation), /作业/);
    assert.throws(() => checkOperationAvailability(operation, new Set(['阿米娅']), 'PERFECT'), /作业/);
  }
});

test('operation filtering preserves empty, disabled, support and fallback pass-through rules', () => {
  const owned = new Set(['阿米娅']);
  for (const operation of [null, {}, { opers: [], groups: [] }, { content: '' }]) {
    assert.strictEqual(checkOperationAvailability(operation, owned, 'PERFECT').isAvailable, true);
  }
  assert.strictEqual(checkOperationAvailability({ opers: [null] }, new Set(), 'PERFECT').isAvailable, true);
  assert.strictEqual(checkOperationAvailability({ opers: [null] }, owned, 'NONE').isAvailable, true);
  assert.strictEqual(checkOperationAvailability({ opers: [{ name: 'W' }] }, owned, 'SUPPORT').isAvailable, true);
  assert.strictEqual(checkOperationAvailability({ opers: [{ name: 'W' }, { name: '能天使' }] },
    owned, 'SUPPORT').isAvailable, false);
  assert.strictEqual(checkOperationAvailability({ groups: [{ name: '未知候选' }], _isFallback: true },
    owned, 'PERFECT').isAvailable, true);
  assert.strictEqual(checkOperationAvailability({ groups: [{ name: '未知候选' }] },
    owned, 'PERFECT').isAvailable, false);
  assert.strictEqual(checkOperationAvailability({ opers: [{ name: '作者' }], _isFallback: true },
    owned, 'PERFECT').isAvailable, true);
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

test('training comparisons carry field values and preserve unknown data alongside deficits', () => {
  const op = { name: '阿米娅', skill: 2, requirements: {
    elite: 2, level: 60, skill_level: 10, module: 1, module_level: 2, potential: 2
  } };
  const training = { elite: 1, level: 50, mainSkill: 7, skill2: 1, potential: 1 };
  const result = checkOperatorTraining(op, training);
  assert.strictEqual(result.status, 'low');
  assert.deepStrictEqual(hostObject(result.issues), [
    { label: '等级', current: '精一50级', required: '精二60级', status: 'low' },
    { label: '2技能', current: '专一', required: '专三', status: 'low' },
    { label: '模组X', current: '未知', required: '2级', status: 'unknown' },
    { label: '潜能', current: '1潜', required: '2潜', status: 'low' }
  ]);
  const availability = checkOperationAvailability({ groups: [{ name: '术师', opers: [op] }] },
    new Set(['阿米娅']), 'SUPPORT', { '阿米娅': training }, true);
  assert.strictEqual(availability.isAvailable, true);
  assert.strictEqual(availability.missingCount, 1);
  assert.strictEqual(availability.trainingIssues[0].group, '术师');
  assert.deepStrictEqual(hostObject(availability.trainingIssues[0].issues), hostObject(result.issues));
  assert.strictEqual(checkOperationAvailability({ opers: [op] }, new Set(['阿米娅']),
    'PERFECT', { '阿米娅': training }, false).trainingIssues.length, 0);
});

test('training panels retain all comparisons, render literal text and preserve expansion on refresh', () => {
  const savedStyle = CONFIG.trainingPromptStyle;
  CONFIG.trainingPromptStyle = 'DETAILED';
  const savedDocument = context.document;
  const savedIcon = context.createPrtsIcon;
  context.document = { createElement: createTestElement,
    createTextNode: text => createTestElement('span', text) };
  context.createPrtsIcon = () => createTestElement('svg');
  try {
    const label = createTestElement();
    label.setAttribute('aria-label', 'old status');
    const issues = [
      { name: '待核验干员', status: 'unknown', issues: [
        { label: '等级', current: '未知', required: '精二60级', status: 'unknown' }
      ] },
      { name: '<img onerror=alert(1)>', group: '术师', status: 'low', issues: [
        { label: '2技能', current: '专一', required: '专三', status: 'low' }
      ] },
      { name: '芬', status: 'low', issues: [
        { label: '等级', current: '1级', required: '55级', status: 'low' }
      ] }
    ];
    const render = () => updateTrainingStatusLabel(label, 'prts-status-label prts-label-missing',
      'missing', '练度不足', issues);
    render();
    assert.strictEqual(label.attributes.has('aria-label'), false);
    assert.strictEqual(label.children[2].children[0].textContent, '<img onerror=alert(1)>干员组：术师');
    assert.strictEqual(label.children[2].children[1].children[1].textContent, '专一');
    assert.strictEqual(label.children[2].children[1].children[2].textContent, '专三');
    const more = label.querySelector('details');
    assert.strictEqual(more.open, false);
    assert.strictEqual(more.children[1].children[0].textContent, '待核验干员');
    assert(label.textContent.includes('未知'));
    assert(label.textContent.includes('还有 1 项'));
    more.open = true;
    render();
    assert.strictEqual(label.querySelector('details'), more);
    issues[0].issues[0].required = '精二70级';
    render();
    assert.strictEqual(label.querySelector('details').open, true);
    assert(label.textContent.includes('精二70级'));
  } finally {
    CONFIG.trainingPromptStyle = savedStyle;
    context.document = savedDocument;
    context.createPrtsIcon = savedIcon;
  }
});

test('compact training prompts expand full comparisons and update when the style changes', () => {
  const savedStyle = CONFIG.trainingPromptStyle;
  const savedDocument = context.document;
  const savedIcon = context.createPrtsIcon;
  context.document = { createElement: createTestElement };
  context.createPrtsIcon = () => createTestElement('svg');
  try {
    CONFIG.trainingPromptStyle = 'COMPACT';
    const label = createTestElement();
    const issues = ['阿米娅', '芬', '桃金娘'].map(name => ({ name, status: 'low', issues: [
      { label: '等级', current: '1级', required: '精二60级', status: 'low' }
    ] }));
    const render = () => updateTrainingStatusLabel(label, 'prts-status-label prts-label-missing',
      'missing', '练度不足', issues);
    render();
    let stopped = 0;
    const event = { stopPropagation() { stopped++; }, preventDefault() { assert.fail('native disclosure should remain enabled'); } };
    label.onclick(event);
    label.onkeydown({ ...event, key: 'Enter' });
    label.onkeydown({ ...event, key: ' ' });
    label.onkeydown({ ...event, key: 'Tab' });
    assert.strictEqual(stopped, 3);
    const details = label.querySelector('.prts-training-details');
    assert.strictEqual(details.open, false);
    assert.strictEqual(details.children[0].tagName, 'SUMMARY');
    assert.strictEqual(label.classList.contains('prts-training-compact'), true);
    assert(label.textContent.includes('阿米娅'));
    assert(label.textContent.includes('桃金娘'));
    details.open = true;
    details.querySelector('.prts-training-more').open = true;
    render();
    assert.strictEqual(label.querySelector('.prts-training-details'), details);
    issues[0].issues[0].required = '精二70级';
    render();
    assert.strictEqual(label.querySelector('.prts-training-details').open, true);
    assert.strictEqual(label.querySelector('.prts-training-more').open, true);
    assert(label.textContent.includes('精二70级'));
    CONFIG.trainingPromptStyle = 'DETAILED';
    render();
    assert.strictEqual(label.querySelector('.prts-training-details'), null);
    assert.strictEqual(label.classList.contains('prts-training-compact'), false);
    assert.strictEqual(label.children[0].tagName, 'DIV');
    CONFIG.trainingPromptStyle = 'COMPACT';
    render();
    assert.strictEqual(label.querySelector('.prts-training-details').open, false);
  } finally {
    CONFIG.trainingPromptStyle = savedStyle;
    context.document = savedDocument;
    context.createPrtsIcon = savedIcon;
  }
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
});

test('Skland imports new and additional module branches without hiding missing data', () => {
  const operators = [
    ['char_4217_makoto', '结城理', 'Y', '002'],
    ['char_4218_aigis', '埃癸斯', 'X', '002'],
    ['char_4219_yukari', '岳羽由加莉', 'X', '002'],
    ['char_1020_reed2', '焰影苇草', 'Y', '003'],
    ['char_300_phenxi', '菲亚梅塔', 'A', '004']
  ];
  const player = { data: { chars: operators.map(([id, name]) => ({ id, name })) } };
  const cultivate = { data: { characters: operators.map(([id, , , slot]) => ({
    id, equips: [{ id: `uniequip_${slot}_${id.split('_').slice(2).join('_')}`, level: 3 }]
  })) } };
  const imported = convertSklandPlayerInfoToTraining(player, cultivate);
  for (const [id, name, type] of operators) {
    assert(OP_MODULE_TYPES[id].includes(type));
    assert.strictEqual(imported[name][`mod${type}`], 3);
  }
  const operation = { opers: [{ name: '结城理', requirements: { module: 2, module_level: 3 } }] };
  const owned = new Set(['结城理']);
  assert.strictEqual(checkOperationAvailability(operation, owned, 'PERFECT', imported, true).unknownTraining.length, 0);
  assert.strictEqual(checkOperationAvailability(operation, owned, 'PERFECT', imported, true).isAvailable, true);
  const locked = convertSklandPlayerInfoToTraining(player, {
    data: { characters: [{ id: 'char_4217_makoto', equips: [] }] }
  });
  assert.strictEqual(locked['结城理'].modY, 0);
  assert.strictEqual(checkOperationAvailability(operation, owned, 'PERFECT', locked, true).isAvailable, false);
  const unavailable = convertSklandPlayerInfoToTraining(player);
  assert.strictEqual(checkOperationAvailability(operation, owned, 'PERFECT', unavailable, true).unknownTraining[0],
    '结城理：模组Y数据未知');
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

function createAccountPage(sharedStorage, hostname) {
  const page = vm.createContext({
    ...context,
    window: { ...context.window, location: { ...context.window.location, hostname } },
    GM_getValue: (key, fallback) => sharedStorage.has(key) ? sharedStorage.get(key) : fallback,
    GM_setValue: (key, value) => sharedStorage.set(key, value)
  });
  page.globalThis = page;
  vm.runInContext(source, page, { filename: 'better-prts-plus-account-page.js' });
  page.loadOwnedOps();
  return page;
}

function createOperatorImportPage(sharedStorage) {
  const page = createAccountPage(sharedStorage, 'prts.plus');
  const body = createTestElement('body');
  const readers = [];
  const toasts = [];
  page.document = {
    body, activeElement: null,
    createElement: tag => Object.assign(createTestElement(tag), { addEventListener() {}, focus() {} }),
    getElementById: id => {
      const find = node => node.id === id ? node : node.children.map(find).find(Boolean);
      return find(body) || null;
    },
    addEventListener() {}, removeEventListener() {}
  };
  page.HTMLElement = class {};
  page.FileReader = class {
    constructor() { readers.push(this); }
    readAsText(file) { this.file = file; }
  };
  page.window.setTimeout = () => 0;
  page.createPrtsIcon = () => createTestElement('svg');
  page.showPrtsToast = (...args) => toasts.push(args);
  page.refreshAccountStateUi = () => {};
  vm.runInContext(fs.readFileSync(path.join(repoRoot, 'src/ui/import-controls.js'), 'utf8'), page);
  return { page, readers, toasts };
}

test('file and paste imports preserve BOM JSON names and training through storage', async () => {
  for (const raw of [
    '\uFEFF["阿米娅","W"]',
    '\uFEFF' + JSON.stringify([{ name: '阿米娅', own: true, elite: 2, level: 80, skill2: 3 }])
  ]) {
    for (const method of ['file', 'paste']) {
      const sharedStorage = new Map();
      const { page, readers, toasts } = createOperatorImportPage(sharedStorage);
      page.openOperatorImportDialog();
      const dialog = page.document.getElementById('prts-import-dialog');
      if (method === 'file') {
        const pending = dialog.querySelector('input').onchange({
          target: { files: [{ name: 'operators.json', size: raw.length }] }
        });
        readers[0].onload({ target: { result: raw } });
        await pending;
      } else {
        dialog.querySelector('.prts-import-textarea').value = raw;
        dialog.querySelector('.prts-import-actions').children
          .find(button => button.textContent === '导入粘贴内容').onclick();
      }
      const saved = JSON.parse(sharedStorage.get('prts_plus_accounts_data'));
      const isMaa = raw.includes('own');
      assert.deepStrictEqual(saved.accountsData[1], isMaa ? ['阿米娅'] : ['阿米娅', 'W']);
      assert.deepStrictEqual(saved.accountsTraining[1], isMaa ? { 阿米娅: { elite: 2, level: 80, skill2: 3 } } : {});
      assert.strictEqual(toasts.at(-1)[1], 'success');
    }
  }
});

function createFilterPage(displayMode) {
  const sharedStorage = new Map([
    ['prts_plus_accounts_data', serializeAccountState({ accountsData: { 1: ['阿米娅'] } })]
  ]);
  const page = createAccountPage(sharedStorage, 'prts.plus');
  const cards = [];
  const errors = [];
  Object.assign(page.__testExports.CONFIG, {
    filterMode: 'PERFECT', displayMode, trainingCheck: false, compatDebug: false,
    hidePrtsBadge: false, hideVideo: false, showExactTime: false,
    stageBadge: false, operatorAvatars: false, cleanLink: false, collapseDescription: false
  });
  page.console = { log() {}, warn: (...args) => errors.push(args) };
  page.document = {
    createElement: createTestElement,
    createTextNode: text => createTestElement('span', text),
    querySelectorAll: () => cards,
    getElementById: () => null
  };
  page.isFilterDisabledPage = () => false;
  page.createPrtsIcon = () => createTestElement('svg');
  page.getCardSignature = () => 'unchanged card text';
  const addCard = operation => {
    const card = createTestElement('li');
    const inner = createTestElement('div');
    const query = inner.querySelector.bind(inner);
    inner.querySelector = selector => selector === '.prts-status-label'
      ? inner.children.find(child => child.classList.contains('prts-status-label')) || null : query(selector);
    inner.__reactFiber$test = { memoizedProps: { operation } };
    card.appendChild(inner);
    card.querySelector = () => inner;
    cards.push(card);
    return { card, inner };
  };
  return { page, addCard, errors };
}

test('malformed cards stay pending while later cards filter and repaired cards recover', () => {
  for (const displayMode of ['GRAY', 'HIDE']) {
    const { page, addCard, errors } = createFilterPage(displayMode);
    const malformed = [
      { opers: [null] }, { groups: [null] },
      { opers: [{ name: '阿米娅' }, null] },
      { groups: [{ name: '术师', opers: [null] }] },
      { groups: [{ name: '术师', opers: {} }] },
      { content: '{broken' },
      { get parsedContent() { throw new Error('unexpected card error'); } }
    ].map(addCard);
    malformed.forEach(({ card }) => {
      card.style.display = 'none';
      card.classList.add('prts-card-gray');
    });
    const available = addCard({ opers: [{ name: '阿米娅' }] });
    const missing = addCard({ opers: [{ name: 'W' }] });
    assert.doesNotThrow(() => page.applyFilterLogic());
    for (const { card, inner } of malformed) {
      assert.strictEqual(card.style.display, '');
      assert.strictEqual(card.classList.contains('prts-card-gray'), false);
      assert.strictEqual(inner.querySelector('.prts-status-label')?.attributes.get('aria-label'), '作业数据待核验');
    }
    assert.notStrictEqual(available.card.style.display, 'none');
    assert.strictEqual(available.inner.querySelector('.prts-status-label'), null);
    assert.strictEqual(missing.card.style.display === 'none', displayMode === 'HIDE');
    assert.strictEqual(missing.card.classList.contains('prts-card-gray'), displayMode === 'GRAY');
    assert.strictEqual(errors.length, malformed.length);
    const diagnostics = page.getCompatibilityDiagnostics();
    assert.strictEqual(diagnostics.noDataCards, malformed.length);
    assert.strictEqual(diagnostics.fiberCards, 2);

    for (const { inner } of malformed) inner.__reactFiber$test.memoizedProps.operation = { opers: [{ name: '阿米娅' }] };
    assert.doesNotThrow(() => page.applyFilterLogic());
    for (const { inner } of malformed) assert.strictEqual(inner.querySelector('.prts-status-label'), null);
    assert.strictEqual(page.getCompatibilityDiagnostics().noDataCards, 0);
  }
});

test('diagnostic aggregation isolates uncached malformed cards', () => {
  const { page, addCard } = createFilterPage('HIDE');
  const malformed = addCard({ parsedContent: { groups: [null] } });
  const available = addCard({ opers: [{ name: '阿米娅' }] });
  const diagnostics = page.aggregateCardDiagnostics([malformed.card, available.card]);
  assert.strictEqual(diagnostics.noDataCards, 1);
  assert.strictEqual(diagnostics.fiberCards, 1);
  assert.strictEqual(malformed.inner.querySelector('.prts-status-label')?.attributes.get('aria-label'), '作业数据待核验');
  assert.notStrictEqual(available.card.style.display, 'none');
});

test('pending cards preserve video hiding and support-mode filtering', () => {
  const { page, addCard } = createFilterPage('HIDE');
  Object.assign(page.__testExports.CONFIG, { hideVideo: true, filterMode: 'SUPPORT' });
  const video = addCard({ type: 'VIDEO', opers: [null] });
  const support = addCard({ opers: [{ name: 'W' }] });
  const missing = addCard({ opers: [{ name: 'W' }, { name: '能天使' }] });
  assert.doesNotThrow(() => page.applyFilterLogic());
  assert.strictEqual(video.card.style.display, 'none');
  assert.notStrictEqual(support.card.style.display, 'none');
  assert.strictEqual(support.inner.querySelector('.prts-status-label')?.attributes.get('aria-label'), '需助战: W');
  assert.strictEqual(missing.card.style.display, 'none');
});

test('file and text imports keep the dialog target across remote account switches', async () => {
  for (const scenario of ['paste', 'file-before-read', 'file-during-read']) {
    const initial = createAccountState({
      activeAccountId: 2,
      accountsData: { 1: ['阿米娅'], 2: ['W'], 3: ['能天使'] },
      accountsTraining: { 2: { W: { level: 10 } } },
      accountMeta: {
        2: { label: '导入账号', labelSource: 'manual' },
        3: { label: '远端账号', labelSource: 'manual' }
      }
    });
    const sharedStorage = new Map([['prts_plus_accounts_data', serializeAccountState(initial)]]);
    const { page, readers, toasts } = createOperatorImportPage(sharedStorage);
    const remotePage = createAccountPage(sharedStorage, 'prts.plus');
    page.openOperatorImportDialog();
    const dialog = page.document.getElementById('prts-import-dialog');
    const status = dialog.querySelector('.prts-import-status');
    const fileInput = dialog.querySelector('input');
    const file = { name: 'operators.json', size: 100 };
    let pending;
    if (scenario === 'file-during-read') {
      pending = fileInput.onchange({ target: { files: [file] } });
      assert.strictEqual(readers.length, 1);
    }

    const latest = createAccountSwitchState(remotePage.getCurrentAccountState(), 3);
    latest.accountsData[3] = ['凯尔希', '能天使'];
    latest.accountsTraining[3] = { 凯尔希: { level: 90 } };
    remotePage.commitAccountState(latest);
    // Simulate delivery of the remote storage change while keeping the dialog open.
    page.loadOwnedOps();
    page.openOperatorImportDialog();
    assert.strictEqual(page.document.getElementById('prts-import-dialog'), dialog);
    assert.strictEqual(dialog.querySelector('.prts-import-title').textContent, '导入到 导入账号');
    assert.strictEqual(page.getCurrentAccountState().activeAccountId, 3);

    const raw = JSON.stringify([{ name: '阿米娅', own: true, elite: 2, level: 80 }]);
    if (scenario === 'paste') {
      dialog.querySelector('.prts-import-textarea').value = raw;
      const pasteButton = dialog.querySelector('.prts-import-actions').children
        .find(button => button.textContent === '导入粘贴内容');
      pasteButton.onclick();
    } else {
      if (!pending) pending = fileInput.onchange({ target: { files: [file] } });
      assert.strictEqual(readers[0].file, file);
      readers[0].onload({ target: { result: raw } });
      await pending;
    }

    const saved = JSON.parse(sharedStorage.get('prts_plus_accounts_data'));
    assert.deepStrictEqual(saved.accountsData[2], ['阿米娅'], scenario);
    assert.deepStrictEqual(saved.accountsTraining[2], { 阿米娅: { elite: 2, level: 80 } }, scenario);
    for (const id of [1, 3]) {
      assert.deepStrictEqual(saved.accountsData[id], hostArray(latest.accountsData[id]), scenario);
      assert.deepStrictEqual(saved.accountsTraining[id], hostObject(latest.accountsTraining[id]), scenario);
    }
    assert.strictEqual(saved.activeAccountId, 3, scenario);
    assert.deepStrictEqual(saved.accountMeta, hostObject(latest.accountMeta), scenario);
    assert.deepStrictEqual(hostObject(page.getCurrentAccountState()), saved, scenario);
    assert.deepStrictEqual(hostArray(page.__testExports.getOwnedOpsSnapshot()), ['凯尔希', '能天使'], scenario);
    assert(status.textContent.startsWith('导入账号 导入成功\n新增 1 / 移除 1 / 当前 1'), scenario);
    assert.strictEqual(toasts.at(-1)[0], '导入账号 导入成功', scenario);
    assert.strictEqual(toasts.at(-1)[1], 'success', scenario);
  }
});

test('Skland import from a stale page preserves other accounts updated during the request', async () => {
  const sharedStorage = new Map();
  const initial = createAccountState({
    accountsData: { 1: ['W'], 2: ['阿米娅'], 3: ['能天使'] },
    accountsTraining: { 1: { W: { level: 1 } }, 2: { 阿米娅: { level: 1 } } }
  });
  sharedStorage.set('prts_plus_accounts_data', serializeAccountState(initial));
  const sklandPage = createAccountPage(sharedStorage, 'www.skland.com');
  const prtsPage = createAccountPage(sharedStorage, 'prts.plus');
  const latest = createAccountState({
    activeAccountId: 2,
    accountsData: { 1: ['凯尔希'], 2: ['W', '能天使'], 3: [] },
    accountsTraining: {
      1: { 凯尔希: { level: 90 } },
      2: { W: { elite: 2, level: 90, skill3: 3, modX: 3 } }
    },
    accountMeta: {
      1: { label: '最新手动昵称', labelSource: 'manual' },
      2: {
        label: '最新二号', labelSource: 'manual',
        skland: { uid: '222', nickname: '二号博士', importedAt: '2026-07-19T00:00:00.000Z', operatorCount: 2 }
      },
      3: { label: '已清空三号', labelSource: 'manual' }
    }
  });
  sklandPage.readSklandCredentialFromStorage = () => 'test-credential';
  sklandPage.refreshSklandToken = async () => ({ token: 'test-token', timestamp: '1' });
  sklandPage.getSklandArknightsBindingOptions = async () => ({ bindings: [{ uid: '111', nickname: '导入博士' }] });
  sklandPage.getSklandGamePlayerInfo = async () => ({ data: { chars: [
    { id: 'char_002_amiya', name: '阿米娅', evolvePhase: 2, level: 80 }
  ] } });
  sklandPage.getSklandGameCultivateInfo = async () => {
    prtsPage.commitAccountState(latest);
    assert.deepStrictEqual(hostObject(sklandPage.getCurrentAccountState()), hostObject(initial));
    return { data: { characters: [] } };
  };

  const summary = await sklandPage.importSklandOperatorsToAccount(1);
  const saved = JSON.parse(sharedStorage.get('prts_plus_accounts_data'));
  for (const id of [2, 3]) {
    assert.deepStrictEqual(saved.accountsData[id], hostArray(latest.accountsData[id]));
    assert.deepStrictEqual(saved.accountsTraining[id], hostObject(latest.accountsTraining[id]));
    assert.deepStrictEqual(saved.accountMeta[id], hostObject(latest.accountMeta[id]));
  }
  assert.strictEqual(saved.activeAccountId, 1);
  assert.deepStrictEqual(saved.accountsData[1], ['阿米娅']);
  assert.deepStrictEqual(saved.accountsTraining[1], { 阿米娅: { elite: 2, level: 80 } });
  assert.strictEqual(saved.accountMeta[1].label, '最新手动昵称');
  assert.strictEqual(saved.accountMeta[1].labelSource, 'manual');
  assert.strictEqual(saved.accountMeta[1].skland.uid, '111');
  assert.strictEqual(summary.accountLabel, '最新手动昵称');
  assert.deepStrictEqual(JSON.parse(sharedStorage.get('prts_plus_skland_last_import')), hostObject(summary));
  assert.deepStrictEqual(hostObject(sklandPage.getCurrentAccountState()), saved);
  assert.deepStrictEqual(hostArray(sklandPage.__testExports.getOwnedOpsSnapshot()), ['阿米娅']);
});

test('commitSklandImport leaves storage and published state unchanged when the account write fails', () => {
  const sharedStorage = new Map([
    ['prts_plus_accounts_data', serializeAccountState({ accountsData: { 2: ['W'] } })]
  ]);
  const page = createAccountPage(sharedStorage, 'www.skland.com');
  const initial = hostObject(page.getCurrentAccountState());
  const savedStorage = new Map(sharedStorage);
  page.GM_setValue = () => { throw new Error('storage failure'); };

  assert.throws(() => page.commitSklandImport({
    accountId: 1,
    names: ['阿米娅'],
    binding: { uid: '111', nickname: '博士' },
    importedAt: '2026-07-19T00:00:00.000Z'
  }), /storage failure/);
  assert.deepStrictEqual(sharedStorage, savedStorage);
  assert.deepStrictEqual(hostObject(page.getCurrentAccountState()), initial);
  assert.deepStrictEqual(hostArray(page.__testExports.getOwnedOpsSnapshot()), []);
});

test('commitSklandImport treats the compatibility summary as non-critical', () => {
  const importData = {
    accountId: 3,
    names: ['阿米娅'],
    binding: { uid: '333', nickname: '博士三号' },
    importedAt: '2026-07-19T00:00:00.000Z'
  };
  failStorageKey = 'prts_plus_skland_last_import';
  const warningCount = warnings.length;
  const summary = commitSklandImport(importData);
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
