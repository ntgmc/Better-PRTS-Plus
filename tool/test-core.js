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
  'src/dom/page-enhancements.js',
  'src/ui/panels.js'
];

const source = sourceFiles
  .map(file => fs.readFileSync(path.join(repoRoot, file), 'utf8'))
  .join('\n') + `
globalThis.__testExports = {
  getAccountIds,
  createAddedAccountState,
  createRemovedAccountState,
  addAccount,
  removeAccount,
  renameAccount,
  switchAccount,
  cycleAccount,
  confirmOperatorImport,
  formatAccountsBackupSummary,
  getOperatorImportDiff,
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
  getOperatorImportDiff,
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

const releaseManifestSource = fs.readFileSync(path.join(repoRoot, 'src/core/release-manifest.js'), 'utf8');
const updateRelease = (version = '3.11.0', level = 'normal', notes = '更新测试说明') => ({ version, level, notes, humanWritten: true });
const releaseManifest = (...releases) => ({ schemaVersion: 1, releases });

function createScriptUpdateHarness(saved = new Map(), version = '3.10.1') {
  const requests = [], dialogs = [], toasts = [], opened = [], timers = new Map(), abortedUrls = [];
  let now = 1700000000000;
  const h = { saved, requests, dialogs, toasts, opened, timers, abortedUrls, choice: null, busy: false };
  const sandbox = {
    console: { warn() {} },
    Date: { now: () => now },
    BUILTIN_RESOURCE_VERSION: resourceSnapshot.resourceVersion,
    GM_info: { script: { version } }, CONFIG: { importantUpdatesOnly: false }, betterPrtsDebug: {},
    GM_getValue: (key, fallback) => saved.has(key) ? saved.get(key) : fallback,
    GM_setValue: (key, value) => saved.set(key, value),
    GM_openInTab: (...args) => opened.push(args),
    GM_xmlhttpRequest: options => { requests.push(options); return { abort: () => { abortedUrls.push(options.url); options.onabort(); } }; },
    saveConfig: () => sandbox.GM_setValue('config', JSON.stringify(sandbox.CONFIG)),
    showPrtsToast: (...args) => toasts.push(args),
    showPrtsModal: options => { dialogs.push(options); return Promise.resolve(h.choice); },
    document: { createElement: createTestElement, getElementById: () => h.busy ? {} : null, querySelector: () => null, querySelectorAll: () => [] },
    setTimeout: callback => { const id = Symbol(); timers.set(id, () => { timers.delete(id); callback(); }); return id; },
    clearTimeout: id => timers.delete(id)
  };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'src/data/resources.js'), 'utf8') + '\n' + releaseManifestSource + '\n' +
    fs.readFileSync(path.join(repoRoot, 'src/core/script-updates.js'), 'utf8') + `
    globalThis.api = { checkScriptUpdates, compareScriptVersions, getAvailableScriptUpdate, validateReleaseManifest, SCRIPT_IGNORED_VERSION_KEY, SCRIPT_UPDATE_URLS };
  `, sandbox);
  return Object.assign(h, {
    sandbox, api: sandbox.api,
    advance: (ms = 60 * 60 * 1000) => { now += ms; },
    respond: (data = releaseManifest(updateRelease()), status = 200, request = requests.at(-1)) => request.onload({ status, responseText: typeof data === 'string' ? data : JSON.stringify(data) })
  });
}

test('script versions compare numerically, order prereleases, and ignore build metadata', () => {
  const { compareScriptVersions: compare } = createScriptUpdateHarness().api;
  const ordered = ['3.9.9', '3.10.1', '3.10.10-alpha', '3.10.10-alpha.2', '3.10.10-alpha.10', '3.10.10-beta', '3.10.10', '3.10.10.1'];
  ordered.slice(1).forEach((version, index) => {
    assert.strictEqual(compare(ordered[index], version), -1);
    assert.strictEqual(compare(version, ordered[index]), 1);
  });
  assert.strictEqual(compare('3.10.1+build.9', '3.10.1'), 0);
  assert.strictEqual(compare('3.10', '3.10.0'), 0);
  for (const invalid of ['', null, 'v3.10.1', '3.10.1\n', '3.10.1-beta..2', '3.9007199254740992']) assert.throws(() => compare(invalid, '3.10'));
});

test('release manifests reject missing human confirmation, empty notes, invalid levels and duplicate versions', () => {
  const { validateReleaseManifest: validate } = createScriptUpdateHarness().api;
  for (const invalid of [null, { schemaVersion: 2, releases: [] }, releaseManifest(null),
    ...[{ notes: ' ' }, { notes: 12 }, { humanWritten: false }, { humanWritten: 'true' }, { level: 'critical' }, { level: '__proto__' }, { version: 'invalid' }]
      .map(change => releaseManifest({ ...updateRelease(), ...change })),
    releaseManifest(updateRelease('3.11'), updateRelease('3.11.0'))]) assert.throws(() => validate(invalid));
});

test('skipping multiple releases preserves important and urgent changes and excludes prereleases', () => {
  const { getAvailableScriptUpdate: available } = createScriptUpdateHarness().api;
  const manifest = releaseManifest(updateRelease('3.12.0', 'normal'), updateRelease('3.11.0', 'important'), updateRelease('4.0.0-beta.1', 'urgent'));
  const update = available(manifest, '3.10.1');
  assert.strictEqual(update.version, '3.12.0');
  assert.strictEqual(update.level, 'important');
  assert.strictEqual(update.releases.length, 2);
  assert.strictEqual(available(manifest, '3.11.0').level, 'normal');
  assert.strictEqual(available(manifest, '3.12.0'), null);
  manifest.releases.push(updateRelease('3.10.2', 'urgent'));
  assert.strictEqual(available(manifest, '3.10.1').level, 'urgent');
});

test('script checks deduplicate requests, throttle downloads and prompt once per page version', async () => {
  const h = createScriptUpdateHarness();
  const pending = h.api.checkScriptUpdates();
  assert.strictEqual(h.api.checkScriptUpdates(), pending);
  assert.strictEqual(h.requests.length, h.api.SCRIPT_UPDATE_URLS.length);
  assert.deepStrictEqual(h.requests.map(request => request.url), hostObject(h.api.SCRIPT_UPDATE_URLS));
  assert.strictEqual(h.requests[0].url, 'https://github.com/ntgmc/Better-PRTS-Plus/releases/latest/download/update.json');
  for (const request of h.requests) {
    assert.strictEqual(request.anonymous, true);
    assert.strictEqual(request.timeout, 15000);
    assert(fs.readFileSync(path.join(repoRoot, 'src/meta/userscript-header.js'), 'utf8').includes(`// @connect      ${new URL(request.url).hostname}`));
  }
  h.respond(releaseManifest(updateRelease('3.11.0', 'important', '<img src=x onerror=alert(1)>\n保留换行')));
  assert.strictEqual(await pending, true);
  assert.strictEqual(h.timers.size, 0);
  assert(h.dialogs[0].message.textContent.includes('<img src=x onerror=alert(1)>\n保留换行'));
  assert.strictEqual(h.dialogs[0].message.children.length, 0);
  assert.strictEqual(h.dialogs[0].extraAction.text, '仅重要更新提示');
  assert.strictEqual(h.dialogs[0].cancelText, '当前版本不再提示');
  assert.strictEqual(h.dialogs[0].confirmText, '立即更新');
  await h.api.checkScriptUpdates();
  assert.strictEqual(h.requests.length, h.api.SCRIPT_UPDATE_URLS.length);
  assert.strictEqual(h.dialogs.length, 1);
  h.advance();
  const next = h.api.checkScriptUpdates();
  h.respond(releaseManifest(updateRelease('3.12.0')));
  await next;
  assert.strictEqual(h.dialogs.length, 2);
});

test('script checks use the first valid origin or mirror and cancel slower requests', async () => {
  for (const winner of [0, 1, 2]) {
    const h = createScriptUpdateHarness();
    const pending = h.api.checkScriptUpdates();
    h.respond(releaseManifest(updateRelease('3.11.0', 'important')), 200, h.requests[winner]);
    assert.strictEqual(await pending, true);
    assert.deepStrictEqual(h.abortedUrls, h.requests.filter((_, index) => index !== winner).map(request => request.url));
    assert.strictEqual(h.timers.size, 0);
    h.respond(releaseManifest(updateRelease('99.0.0')), 200, h.requests[(winner + 1) % 3]);
    assert.strictEqual(await h.api.checkScriptUpdates(), false);
    assert.strictEqual(h.dialogs.length, 1);
    assert(!h.dialogs[0].message.textContent.includes('99.0.0'));
  }
});

test('script checks tolerate malformed responses and sources throwing before a valid mirror responds', async () => {
  for (const winner of [0, 1, 2]) {
    const h = createScriptUpdateHarness();
    const pending = h.api.checkScriptUpdates();
    const failures = h.requests.filter((_, index) => index !== winner);
    h.respond(releaseManifest({ ...updateRelease(), humanWritten: false }), 200, failures[0]);
    failures[1].onerror();
    h.respond(releaseManifest(updateRelease()), 200, h.requests[winner]);
    assert.strictEqual(await pending, true);
    assert.strictEqual(h.dialogs.length, 1);
    assert.strictEqual(h.timers.size, 0);
  }
  const h = createScriptUpdateHarness();
  const request = h.sandbox.GM_xmlhttpRequest;
  h.sandbox.GM_xmlhttpRequest = options => {
    if (options.url === h.api.SCRIPT_UPDATE_URLS[0]) throw new Error('origin unavailable');
    return request(options);
  };
  const pending = h.api.checkScriptUpdates();
  h.respond();
  assert.strictEqual(await pending, true);
  assert.strictEqual(h.requests.length, 2);
  assert.strictEqual(h.timers.size, 0);
});

test('stale update mirrors cannot mask newer installed or already detected versions', async () => {
  for (const cached of [false, true]) {
    const h = createScriptUpdateHarness();
    if (cached) {
      const initial = h.api.checkScriptUpdates();
      h.respond(releaseManifest(updateRelease('3.12.0', 'important')));
      await initial;
    }
    const pending = h.api.checkScriptUpdates(true);
    const requests = h.requests.slice(-h.api.SCRIPT_UPDATE_URLS.length);
    h.respond(releaseManifest(updateRelease(cached ? '3.11.0' : '3.9.0')), 200, requests[1]);
    if (cached) h.respond(releaseManifest(), 200, requests[2]);
    await new Promise(setImmediate);
    assert.strictEqual(h.dialogs.length, cached ? 1 : 0);
    h.respond(releaseManifest(updateRelease('3.13.0', 'urgent')), 200, requests[0]);
    assert.strictEqual(await pending, true);
    assert(h.dialogs.at(-1).message.textContent.includes('3.13.0'));
    assert.strictEqual(h.timers.size, 0);
  }
});

test('important-only preference hides ordinary updates and keeps important and urgent notifications', async () => {
  for (const level of ['normal', 'important', 'urgent']) {
    const h = createScriptUpdateHarness();
    h.sandbox.CONFIG.importantUpdatesOnly = true;
    const pending = h.api.checkScriptUpdates();
    h.respond(releaseManifest(updateRelease('3.11.0', level)));
    await pending;
    assert.strictEqual(h.dialogs.length, level === 'normal' ? 0 : 1);
  }
  const h = createScriptUpdateHarness();
  h.choice = 'important';
  const pending = h.api.checkScriptUpdates();
  h.respond();
  await pending;
  assert.strictEqual(h.sandbox.CONFIG.importantUpdatesOnly, true);
  assert.strictEqual(JSON.parse(h.saved.get('config')).importantUpdatesOnly, true);
});

test('ignored target version persists across pages, later versions and manual checks remain available', async () => {
  const saved = new Map();
  const h = createScriptUpdateHarness(saved);
  h.choice = 'skip';
  const pending = h.api.checkScriptUpdates();
  h.respond();
  await pending;
  assert.strictEqual(saved.get(h.api.SCRIPT_IGNORED_VERSION_KEY), '3.11.0');
  const other = createScriptUpdateHarness(saved);
  let next = other.api.checkScriptUpdates();
  other.respond();
  assert.strictEqual(await next, false);
  other.sandbox.CONFIG.importantUpdatesOnly = true;
  next = other.api.checkScriptUpdates(true);
  other.respond();
  await next;
  assert.strictEqual(other.dialogs.length, 1);
  other.sandbox.CONFIG.importantUpdatesOnly = false;
  other.advance();
  next = other.api.checkScriptUpdates();
  other.respond(releaseManifest(updateRelease('3.12.0')));
  await next;
  assert.strictEqual(other.dialogs.length, 2);
});

test('update installation opens only the detected tagged userscript and storage errors remain visible', async () => {
  const h = createScriptUpdateHarness();
  h.choice = true;
  const pending = h.api.checkScriptUpdates();
  h.respond();
  await pending;
  assert.strictEqual(h.opened[0][0], 'https://github.com/ntgmc/Better-PRTS-Plus/releases/download/v3.11.0/Better-PRTS-Plus.user.js');
  for (const choice of ['important', 'skip']) {
    const broken = createScriptUpdateHarness();
    broken.choice = choice;
    broken.sandbox.GM_setValue = () => { throw new Error('storage failure'); };
    const attempt = broken.api.checkScriptUpdates();
    broken.respond();
    await attempt;
    assert.strictEqual(broken.sandbox.CONFIG.importantUpdatesOnly, false);
    assert(broken.toasts.some(toast => toast[1] === 'error'));
  }
});

test('automatic checks defer until an active import or confirmation closes', async () => {
  const h = createScriptUpdateHarness();
  h.busy = true;
  const pending = h.api.checkScriptUpdates();
  h.respond();
  await pending;
  assert.strictEqual(h.dialogs.length, 0);
  h.busy = false;
  await h.api.checkScriptUpdates();
  assert.strictEqual(h.dialogs.length, 1);
  assert.strictEqual(h.requests.length, h.api.SCRIPT_UPDATE_URLS.length);
});

test('automatic updates wait for settings submenus while manual checks can open above them', async () => {
  const h = createScriptUpdateHarness();
  let open = true;
  h.sandbox.document.querySelector = selector => {
    assert.strictEqual(selector, '.prts-submenu-panel.is-open');
    return open ? {} : null;
  };
  const automatic = h.api.checkScriptUpdates();
  h.respond();
  assert.strictEqual(await automatic, false);
  assert.strictEqual(h.dialogs.length, 0);
  const manual = h.api.checkScriptUpdates(true);
  h.respond();
  assert.strictEqual(await manual, true);
  assert.strictEqual(h.dialogs.length, 1);
  const other = createScriptUpdateHarness();
  other.sandbox.document.querySelector = h.sandbox.document.querySelector;
  const pending = other.api.checkScriptUpdates();
  other.respond();
  await pending;
  open = false;
  assert.strictEqual(await other.api.checkScriptUpdates(), true);
  assert.strictEqual(other.dialogs.length, 1);
});

test('update style previews cover all levels and buttons without changing real update behavior', async () => {
  for (const level of ['normal', 'important', 'urgent']) {
    for (const choice of ['important', 'skip', true, null]) {
      const saved = new Map([['existing', 'preserved']]);
      const h = createScriptUpdateHarness(saved);
      h.choice = choice;
      h.sandbox.CONFIG.importantUpdatesOnly = true;
      const preview = h.sandbox.betterPrtsDebug.previewScriptUpdate;
      assert.strictEqual(await preview(level), choice);
      assert(h.dialogs[0].title.includes('预览'));
      assert(h.dialogs[0].message.textContent.includes(`99.0.0 · ${{ normal: '普通更新', important: '重要更新', urgent: '紧急更新' }[level]}`));
      assert(h.dialogs[0].message.textContent.includes('样式测试示例'));
      assert.deepStrictEqual([...saved], [['existing', 'preserved']]);
      assert.strictEqual(h.sandbox.CONFIG.importantUpdatesOnly, true);
      assert.strictEqual(h.requests.length, 0);
      assert.strictEqual(h.opened.length, 0);
      assert.strictEqual(h.timers.size, 0);
      assert.strictEqual(h.toasts.length, choice === null ? 0 : 1);
      await preview(level);
      assert.strictEqual(h.dialogs.length, 2);
      h.choice = null;
      const real = h.api.checkScriptUpdates();
      h.respond(releaseManifest(updateRelease('99.0.0', 'important')));
      assert.strictEqual(await real, true);
      assert.strictEqual(h.dialogs.length, 3);
      assert(!h.dialogs[2].title.includes('预览'));
    }
  }
  const h = createScriptUpdateHarness();
  await h.sandbox.betterPrtsDebug.previewScriptUpdate();
  assert(h.dialogs[0].message.textContent.includes('重要更新'));
  await assert.rejects(h.sandbox.betterPrtsDebug.previewScriptUpdate('__proto__'), /更新级别无效/);
  h.busy = true;
  assert.strictEqual(await h.sandbox.betterPrtsDebug.previewScriptUpdate('urgent'), false);
  assert.strictEqual(h.dialogs.length, 1);
});

test('failed script checks and timeouts stay silent automatically and can be retried manually', async () => {
  for (const failure of ['invalid-json', 'http', 'timeout', 'ontimeout', 'onerror', 'onabort', 'oversized', 'schema', 'startup']) {
    const h = createScriptUpdateHarness();
    const request = h.sandbox.GM_xmlhttpRequest;
    if (failure === 'startup') h.sandbox.GM_xmlhttpRequest = () => { throw new Error('source unavailable'); };
    const pending = h.api.checkScriptUpdates();
    const requestCount = h.requests.length;
    if (failure === 'timeout') [...h.timers.values()].forEach(callback => callback());
    else if (failure.startsWith('on')) h.requests.forEach(request => request[failure]());
    else h.requests.forEach(request => h.respond(failure === 'oversized' ? 'x'.repeat(1024 * 1024 + 1)
      : failure === 'schema' ? releaseManifest({ ...updateRelease(), humanWritten: false }) : 'invalid', failure === 'http' ? 503 : 200, request));
    assert.strictEqual(await pending, false);
    assert.strictEqual(h.timers.size, 0);
    if (failure === 'timeout') assert.strictEqual(h.abortedUrls.length, h.api.SCRIPT_UPDATE_URLS.length);
    assert.strictEqual(h.toasts.length, 0);
    assert.strictEqual(h.dialogs.length, 0);
    await h.api.checkScriptUpdates();
    assert.strictEqual(h.requests.length, requestCount);
    h.sandbox.GM_xmlhttpRequest = request;
    const retry = h.api.checkScriptUpdates(true);
    h.respond();
    await retry;
    assert.strictEqual(h.dialogs.length, 1);
    assert.strictEqual(h.timers.size, 0);
  }
  const h = createScriptUpdateHarness();
  const pending = h.api.checkScriptUpdates(true);
  h.requests.forEach(request => request.onerror());
  await pending;
  assert(h.toasts.some(toast => toast[1] === 'error' && toast[2].includes('所有更新下载源均不可用')));
});

test('release preparation refuses unconfirmed notes and publishes only the selected version and history', () => {
  const temporary = fs.mkdtempSync(path.join(require('os').tmpdir(), 'prts-release-notes-'));
  try {
    fs.mkdirSync(path.join(temporary, 'tool'));
    fs.mkdirSync(path.join(temporary, 'src/core'), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, 'tool/prepare-release.js'), path.join(temporary, 'tool/prepare-release.js'));
    fs.writeFileSync(path.join(temporary, 'src/core/release-manifest.js'), releaseManifestSource);
    const prepare = () => require('child_process').spawnSync(process.execPath,
      [path.join(temporary, 'tool/prepare-release.js'), '3.11.0', path.join(temporary, 'output')], { encoding: 'utf8' });
    for (const manifest of [releaseManifest(), releaseManifest({ ...updateRelease(), humanWritten: false }), releaseManifest({ ...updateRelease(), notes: '' })]) {
      fs.writeFileSync(path.join(temporary, 'releases.json'), JSON.stringify(manifest));
      assert.notStrictEqual(prepare().status, 0);
      assert(!fs.existsSync(path.join(temporary, 'output')));
    }
    const notes = '维护者提供的正式说明\n第二行原文';
    fs.writeFileSync(path.join(temporary, 'releases.json'), JSON.stringify(releaseManifest(updateRelease('3.12.0'), updateRelease('3.11.0', 'important', notes), updateRelease('3.10.1'))));
    const result = prepare();
    assert.strictEqual(result.status, 0, result.stderr);
    const manifest = JSON.parse(fs.readFileSync(path.join(temporary, 'output/update.json'), 'utf8'));
    assert.deepStrictEqual(manifest.releases.map(release => release.version), ['3.11.0', '3.10.1']);
    assert.strictEqual(fs.readFileSync(path.join(temporary, 'output/RELEASE_NOTES.md'), 'utf8'), `## 3.11.0 · 重要更新\n\n${notes}\n`);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('AI summaries default to comparing main with the latest release and support explicit version tags', async () => {
  const { summarizeChanges } = require('./summarize-pr-changelog');
  const before = fs.readFileSync(path.join(repoRoot, 'releases.json'), 'utf8');
  const base = 'a'.repeat(40);
  const head = 'b'.repeat(40);
  const files = [{ filename: 'src/main.js', status: 'modified', additions: 1, deletions: 0, patch: '+releaseChange();' },
    { filename: 'Better-PRTS-Plus.user.js', patch: 'BUILD_OUTPUT_MUST_BE_SKIPPED' }];
  for (const [baseTag, apiType] of [['', 'message'], ['v3.9.0', 'response'], ['archive/v3.8.0', 'chatcompletion']]) {
    const tag = baseTag || 'v3.10.1';
    const requests = [];
    const env = { GITHUB_REPOSITORY: 'owner/repo', BASE_TAG: baseTag, GITHUB_TOKEN: 'test-github-key', CHANGELOG_API_KEY: 'test-ai-key', CHANGELOG_MODEL: 'test-model', CHANGELOG_API_TYPE: apiType };
    const routes = {
      'releases/latest': { tag_name: tag },
      [`commits/${encodeURIComponent(tag)}`]: { sha: base },
      'commits/main': { sha: head },
      [`compare/${base}...${head}?per_page=1`]: { status: 'ahead', files }
    };
    const summary = await summarizeChanges(env, async (url, options) => {
      requests.push({ url, options });
      const route = url.replace('https://api.github.com/repos/owner/repo/', '');
      if (url.startsWith('https://api.github.com/')) {
        assert(Object.hasOwn(routes, route), `Unexpected GitHub route: ${route}`);
        return { ok: true, json: async () => routes[route] };
      }
      const text = requests.filter(item => !item.url.startsWith('https://api.github.com/')).length === 1 ? '版本分块事实' : '版本变更摘要\n更新级别：重要';
      const response = apiType === 'message' ? { content: [{ type: 'text', text }] }
        : apiType === 'response' ? { output: [{ content: [{ type: 'output_text', text }] }] }
          : { choices: [{ message: { content: text }, finish_reason: 'stop' }] };
      return { ok: true, json: async () => response };
    });
    assert(summary.includes(`main 对比 ${tag}`));
    assert(summary.includes(`Base SHA：${base}`) && summary.includes(`Head SHA：${head}`));
    assert(summary.includes('版本变更摘要') && summary.includes('更新级别：重要'));
    assert(!summary.includes('版本分块事实') && !summary.includes('最终更新内容'));
    assert.strictEqual(requests.length, baseTag ? 5 : 6);
    assert.strictEqual(requests.some(item => item.url.endsWith('/releases/latest')), !baseTag);
    const extraction = requests.at(-2);
    const reduction = requests.at(-1);
    assert(extraction.options.body.includes('+releaseChange();'));
    assert(extraction.options.body.includes(base) && extraction.options.body.includes(head));
    assert(!extraction.options.body.includes('BUILD_OUTPUT_MUST_BE_SKIPPED'));
    assert(reduction.options.body.includes('版本分块事实') && reduction.options.body.includes('合并同类项'));
    const extractBody = JSON.parse(extraction.options.body);
    const extractSystem = apiType === 'message' ? extractBody.system : (extractBody.input || extractBody.messages)[0].content;
    assert(!/普通|重要|紧急|维护者|人工确认|仅供/.test(extractSystem));
    assert(!reduction.options.body.includes('维护者') && !reduction.options.body.includes('人工确认'));
    assert([extraction, reduction].every(item => !item.options.headers.Authorization?.includes('test-github-key')));
    assert(requests.slice(0, -2).every(item => item.options.headers.Authorization === 'Bearer test-github-key' && !item.options.headers['x-api-key']));
  }
  assert.strictEqual(fs.readFileSync(path.join(repoRoot, 'releases.json'), 'utf8'), before);
});

test('version summaries skip unchanged ranges and refuse incomplete or unrelated comparisons', async () => {
  const { summarizeChanges } = require('./summarize-pr-changelog');
  const env = { GITHUB_REPOSITORY: 'owner/repo', GITHUB_TOKEN: 'test-key', CHANGELOG_API_KEY: 'test-ai-key', CHANGELOG_MODEL: 'test-model' };
  const base = 'a'.repeat(40);
  const head = 'b'.repeat(40);
  const run = (comparison, overrides = {}) => summarizeChanges(env, async url => {
    assert(url.startsWith('https://api.github.com/'), 'Unchanged or invalid comparisons must not request AI');
    const result = url.endsWith('/releases/latest') ? { tag_name: 'v3.10.1' }
      : url.endsWith('/commits/v3.10.1') ? { sha: base }
        : url.endsWith('/commits/main') ? { sha: head } : comparison;
    return { ok: true, json: async () => Object.hasOwn(overrides, url.split('/').at(-1)) ? overrides[url.split('/').at(-1)] : result };
  });
  assert((await run({ status: 'identical', files: [] })).includes('没有文件变化'));
  await assert.rejects(run({ status: 'ahead', files: Array.from({ length: 300 }, () => ({})) }), /300 文件上限/);
  await assert.rejects(run({ status: 'diverged', files: [] }), /不是 main 的祖先/);
  await assert.rejects(run({ status: 'behind', files: [] }), /不是 main 的祖先/);
  await assert.rejects(run({ status: 'ahead' }), /文件列表格式无效/);
  await assert.rejects(run({}, { latest: {} }), /未找到上一正式版本/);
  await assert.rejects(run({}, { main: { sha: 'invalid' } }), /版本提交无效/);
  await assert.rejects(summarizeChanges(env, async () => ({ ok: false, status: 404 })), /HTTP 404/);
  for (const invalid of [{ SUMMARY_TYPE: 'unknown' }, { BASE_TAG: 'invalid\nref' }, { SUMMARY_TYPE: 'pr' }]) {
    await assert.rejects(summarizeChanges({ ...env, ...invalid }, () => { throw new Error('must not request'); }), /请选择|请填写/);
  }
});

test('PR summaries support three APIs and preserve the release manifest', async () => {
  const { summarizeChanges } = require('./summarize-pr-changelog');
  const before = fs.readFileSync(path.join(repoRoot, 'releases.json'), 'utf8');
  for (const apiType of ['message', 'response', 'chatcompletion']) {
    const requests = [];
    const env = { SUMMARY_TYPE: 'pr', GITHUB_REPOSITORY: 'owner/repo', PR_NUMBER: '12', GITHUB_TOKEN: 'test-github-key', CHANGELOG_API_KEY: 'test-ai-key', CHANGELOG_MODEL: 'test-model', CHANGELOG_API_TYPE: apiType, CHANGELOG_BASE_URL: 'https://model.invalid/v1' };
    const pr = { title: 'Example', base: { ref: 'main' }, head: { sha: 'a'.repeat(40) }, changed_files: 2 };
    const files = [{ filename: 'src/main.js', status: 'modified', additions: 1, deletions: 0, patch: '+checkScriptUpdates();' },
      { filename: 'Better-PRTS-Plus.user.js', patch: 'BUILD_OUTPUT_MUST_BE_SKIPPED' }];
    const response = apiType === 'message' ? { content: [{ type: 'text', text: 'AI 测试摘要' }] }
      : apiType === 'response' ? { output: [{ content: [{ type: 'output_text', text: 'AI 测试摘要' }] }] }
        : { choices: [{ message: { content: 'AI 测试摘要' }, finish_reason: 'stop' }] };
    const summary = await summarizeChanges(env, async (url, options) => {
      requests.push({ url, options });
      return { ok: true, json: async () => url.includes('/files?') ? files : url.startsWith('https://api.github.com/') ? pr : response };
    });
    assert(summary.includes('AI 测试摘要'));
    assert(!summary.includes('最终更新内容') && !summary.includes('humanWritten'));
    assert(summary.includes(pr.head.sha));
    assert.strictEqual(requests.length, 5);
    const ai = requests.at(-2);
    assert(!ai.options.body.includes('BUILD_OUTPUT_MUST_BE_SKIPPED'));
    assert(ai.options.body.includes('+checkScriptUpdates();'));
    assert.strictEqual(ai.options.redirect, 'error');
    assert(!ai.options.headers.Authorization?.includes('test-github-key'));
    assert(requests.slice(0, 3).every(item => !item.options.headers['x-api-key']));
    for (const invalid of [{ CHANGELOG_API_KEY: '' }, { CHANGELOG_API_TYPE: 'unknown' }, { CHANGELOG_BASE_URL: 'http://model.invalid' }, { PR_NUMBER: '../secret' }]) {
      await assert.rejects(summarizeChanges({ ...env, ...invalid }, () => { throw new Error('must not request'); }));
    }
    await assert.rejects(summarizeChanges(env, async url => ({ ok: true, json: async () => url.includes('/files?') ? files.slice(0, 1) : pr })), /不完整/);
    await assert.rejects(summarizeChanges(env, async url => ({ ok: true, json: async () => url.includes('/files?') ? files : url.startsWith('https://api.github.com/') ? pr : { stop_reason: 'max_tokens' } })), /截断/);
  }
  assert.strictEqual(fs.readFileSync(path.join(repoRoot, 'releases.json'), 'utf8'), before);
});

test('PR analysis merges all chunks, judges importance once and logs request progress', async () => {
  const { summarizeChanges } = require('./summarize-pr-changelog');
  const env = { SUMMARY_TYPE: 'pr', GITHUB_REPOSITORY: 'owner/repo', PR_NUMBER: '12', GITHUB_TOKEN: 'test-key', CHANGELOG_API_KEY: 'test-ai-key', CHANGELOG_MODEL: 'test-model' };
  const pr = { title: 'Long PR', base: { ref: 'main' }, head: { sha: 'a'.repeat(40) }, changed_files: 101 };
  const files = Array.from({ length: 101 }, (_, index) => ({ filename: `file-${index}.js`, patch: '+' + 'x'.repeat(300), status: 'modified', additions: 1, deletions: 0 }));
  let modelCalls = 0;
  const logs = [];
  const summary = await summarizeChanges(env, async (url, options) => ({ ok: true, json: async () => {
    if (url.startsWith('https://api.github.com/')) return url.includes('/files?') ? files.slice(url.endsWith('page=1') ? 0 : 100, url.endsWith('page=1') ? 100 : 101) : pr;
    modelCalls++;
    const payload = JSON.parse(options.body);
    if (modelCalls <= 2) {
      assert(payload.messages[0].content.length < 25000);
      assert(!/普通|重要|紧急/.test(payload.system));
    } else {
      assert(payload.messages[0].content.includes('分块 1/2\n摘要 1：统一账号切换'));
      assert(payload.messages[0].content.includes('分块 2/2\n摘要 2：统一账号切换'));
      assert(payload.system.includes('合并同类项') && payload.system.includes('根据整体影响'));
    }
    return { content: [{ type: 'text', text: modelCalls <= 2 ? `摘要 ${modelCalls}：统一账号切换` : '新增统一账号切换。\n更新级别：普通，属于体验调整。' }],
      usage: { input_tokens: 81, output_tokens: 23 }, stop_reason: 'end_turn' };
  } }), message => logs.push(message));
  assert.strictEqual(modelCalls, 3);
  assert(summary.includes('新增统一账号切换。') && summary.includes('更新级别：普通'));
  assert(!summary.includes('摘要 1') && !summary.includes('摘要 2'));
  for (const stage of ['分块分析 1/2', '分块分析 2/2', '合并总结']) {
    assert(logs.some(line => line.includes(`${stage} 开始：`) && line.includes('input_chars=') && line.includes('estimated_tokens=')));
    assert(logs.some(line => line.includes(`${stage} 响应：input_tokens=81 output_tokens=23 stop=end_turn elapsed_ms=`)));
    assert(logs.some(line => line.includes(`${stage} 完成：output_chars=`)));
  }
  assert(logs.some(line => line.includes('文件=101 分析文件=101') && line.includes('分块=2')));
  assert(!logs.join('\n').includes('test-key') && !logs.join('\n').includes('test-ai-key'));
  let metadataReads = 0;
  await assert.rejects(summarizeChanges(env, async url => ({ ok: true, json: async () => {
    if (url.includes('/files?')) return files.slice(url.endsWith('page=1') ? 0 : 100, url.endsWith('page=1') ? 100 : 101);
    return metadataReads++ ? { ...pr, head: { sha: 'b'.repeat(40) } } : pr;
  } })), /PR 已更新/);
  await assert.rejects(summarizeChanges(env, async () => ({ ok: false, status: 429 })), /HTTP 429/);
});

test('final summarization rejects truncation, bad responses and request failures for all APIs', async () => {
  const { summarizeChanges } = require('./summarize-pr-changelog');
  const pr = { title: 'Example', base: { ref: 'main' }, head: { sha: 'a'.repeat(40) }, changed_files: 1 };
  const files = [{ filename: 'src/main.js', patch: '+change();', status: 'modified', additions: 1, deletions: 0 }];
  for (const apiType of ['message', 'response', 'chatcompletion']) {
    const env = { SUMMARY_TYPE: 'pr', GITHUB_REPOSITORY: 'owner/repo', PR_NUMBER: '12', GITHUB_TOKEN: 'test-key', CHANGELOG_API_KEY: 'test-ai-key', CHANGELOG_MODEL: 'test-model', CHANGELOG_API_TYPE: apiType };
    const extraction = apiType === 'message' ? { content: [{ type: 'text', text: '分块事实' }] }
      : apiType === 'response' ? { output: [{ content: [{ type: 'output_text', text: '分块事实' }] }] }
        : { choices: [{ message: { content: '分块事实' }, finish_reason: 'stop' }] };
    const truncated = apiType === 'message' ? { stop_reason: 'max_tokens' }
      : apiType === 'response' ? { status: 'incomplete' } : { choices: [{ finish_reason: 'length' }] };
    for (const failure of ['truncated', 'empty', 'http', 'json', 'network']) {
      let modelCalls = 0;
      const logs = [];
      await assert.rejects(summarizeChanges(env, async url => {
        if (url.startsWith('https://api.github.com/')) return { ok: true, json: async () => url.includes('/files?') ? files : pr };
        modelCalls++;
        if (modelCalls === 2 && failure === 'network') throw new Error('https://secret:test-ai-key@model.invalid');
        return { ok: !(modelCalls === 2 && failure === 'http'), status: 429, json: async () => {
          if (modelCalls === 1) return extraction;
          if (failure === 'json') throw new Error('private API response');
          return failure === 'truncated' ? truncated : {};
        } };
      }, message => logs.push(message)), error => {
        assert(/合并总结.*(截断|有效摘要|HTTP 429|有效 JSON|网络错误)/.test(error.message));
        assert(!error.message.includes('test-ai-key') && !error.message.includes('private API response'));
        return true;
      });
      assert.strictEqual(modelCalls, 2);
      assert(logs.some(line => line.includes('合并总结 开始')));
      assert(!logs.some(line => line.includes('合并总结 完成') || line.includes('变更总结完成')));
    }
  }
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

test('settings categories preserve controls and state while switching and collapsing submenus', () => {
  const body = createTestElement('body');
  const listeners = new Map();
  const all = node => [node, ...node.children.flatMap(all)];
  const document = {
    body, activeElement: null,
    getElementById: id => all(body).find(node => node.id === id),
    querySelectorAll: () => [],
    addEventListener: (event, listener) => listeners.set(event, listener)
  };
  document.createElement = tag => {
    const element = createTestElement(tag);
    element.events = new Map();
    element.addEventListener = (event, listener) => element.events.set(event, listener);
    element.focus = () => { document.activeElement = element; };
    return element;
  };
  document.createElementNS = (_namespace, tag) => document.createElement(tag);
  document.createTextNode = text => createTestElement('text', text);
  let saves = 0, checks = 0;
  const actions = [];
  const sandbox = {
    document, window: { addEventListener() {} },
    GM_info: { script: { version: '7.8.9-beta.1' } },
    SCRIPT_RELEASE_URL: 'https://github.com/ntgmc/Better-PRTS-Plus/releases',
    CONFIG: { importantUpdatesOnly: false, compatDebug: false }, CONFIG_DEFINITIONS,
    RELEASE_LEVELS: { normal: '普通更新', important: '重要更新', urgent: '紧急更新' }, BP_SELECTORS: {},
    saveConfig: () => { saves++; }, checkScriptUpdates: manual => { assert.strictEqual(manual, true); checks++; },
    refreshAccountControls() {}, syncPageScaffold() {}, enhancePopover() {}, requestFilterUpdate() {},
    getAccountIds: () => [1, 2, 3], addAccount() {},
    handleImport: () => actions.push('import'), handleOpenSklandImport: () => actions.push('skland'),
    handleExportAccountsBackup: () => actions.push('export'), handleImportAccountsBackup: () => actions.push('restore'),
    ResizeObserver: class { observe() {} }
  };
  vm.runInNewContext(['src/ui/dom-helpers.js', 'src/ui/panels.js'].map(file => fs.readFileSync(path.join(repoRoot, file), 'utf8')).join('\n'), sandbox);
  sandbox.updateFloatingLayout = () => {};
  sandbox.createFloatingBall();
  const main = document.getElementById('prts-settings-main');
  const about = document.getElementById('prts-about-panel');
  const entry = document.getElementById('prts-settings-about-button');
  const ball = body.firstChild.lastChild;
  main.scrollTop = 123;
  const originalContent = main.textContent;
  assert.strictEqual(about.tagName, 'DIV');
  assert.strictEqual(about.parentElement, ball.parentElement);
  assert.strictEqual(about.inert, true);
  const categoryIds = ['cards', 'page', 'accounts', 'about', 'diagnostics'];
  const categoryPanels = categoryIds.map(id => document.getElementById(`prts-${id}-panel`));
  const categoryButtons = categoryIds.map(id => document.getElementById(`prts-settings-${id}-button`));
  assert.strictEqual(main.children.length, categoryIds.length);
  assert(categoryPanels.every(node => node.inert && node.attributes.get('aria-hidden') === 'true'));
  assert.strictEqual(categoryButtons[4].hidden, true);
  Object.entries(CONFIG_DEFINITIONS).forEach(([key, definition]) => {
    if (!definition.group) return;
    const target = { '作业卡片': 0, '页面增强': 1, '脚本更新': 3, '诊断': 4 }[definition.group];
    const controls = all(categoryPanels[target]).filter(node => node.dataset.prtsConfigKey === key);
    assert.strictEqual(controls.length, definition.options?.length || 1, key);
    assert(!all(main).some(node => node.dataset.prtsConfigKey === key));
  });
  for (const [text, expected] of [['导入干员数据', 'import'], ['森空岛导入', 'skland'], ['导出全部配置', 'export'], ['导入全部配置', 'restore']]) {
    all(categoryPanels[2]).find(node => node.tagName === 'BUTTON' && node.textContent === text)._prtsClickHandler();
    assert.strictEqual(actions.at(-1), expected);
  }
  assert.strictEqual(all(categoryPanels[2]).filter(node => node.className === 'prts-acc-btn').length, 3);
  assert(!main.textContent.includes('脚本更新'));
  assert(!main.textContent.includes('检查脚本更新'));
  assert(about.textContent.includes('7.8.9-beta.1'));
  assert(about.textContent.includes('一只摆烂的42（ntgmc）'));
  assert(about.textContent.includes('GPL-3.0'));
  const links = all(about).filter(node => node.tagName === 'A');
  assert.deepStrictEqual(links.map(link => link.textContent), ['项目主页', '使用说明', '问题反馈', '更新记录']);
  assert(links.every(link => link.href.startsWith('https://github.com/') && link.target === '_blank' && link.rel === 'noopener noreferrer'));
  ball.onclick({ stopPropagation() {}, detail: 0 });
  entry._prtsClickHandler();
  assert.strictEqual(about.inert, false);
  assert(about.classList.contains('is-open'));
  assert.notStrictEqual(main.hidden, true);
  assert.strictEqual(main.textContent, originalContent);
  assert.strictEqual(main.scrollTop, 123);
  assert.strictEqual(entry.attributes.get('aria-expanded'), 'true');
  const close = all(about).find(node => node.attributes.get('aria-label') === '收起关于');
  assert.strictEqual(document.activeElement, close);
  const preference = all(about).find(node => node.dataset.prtsConfigKey === 'importantUpdatesOnly');
  preference.onchange({ target: { checked: true } });
  assert.strictEqual(sandbox.CONFIG.importantUpdatesOnly, true);
  assert.strictEqual(saves, 1);
  all(about).find(node => node.tagName === 'BUTTON' && node.textContent === '检查脚本更新')._prtsClickHandler();
  assert.strictEqual(checks, 1);
  const escape = () => listeners.get('keydown')({ key: 'Escape', target: body, preventDefault() {} });
  const modal = createTestElement();
  modal.id = 'prts-modal';
  body.appendChild(modal);
  listeners.get('click')({ target: { closest: () => modal } });
  escape();
  assert.strictEqual(about.inert, false);
  modal.remove();
  escape();
  assert.strictEqual(about.inert, true);
  assert(!about.classList.contains('is-open'));
  assert.notStrictEqual(about.hidden, true, 'closing keeps the panel rendered for its exit animation');
  assert.strictEqual(document.activeElement, entry);
  assert(body.firstChild.classList.contains('prts-float-open'));
  assert.strictEqual(main.scrollTop, 123);
  assert.strictEqual(entry.attributes.get('aria-expanded'), 'false');
  entry._prtsClickHandler();
  entry._prtsClickHandler();
  assert.strictEqual(about.inert, true, 'clicking About again collapses just the child');
  entry._prtsClickHandler();
  close._prtsClickHandler();
  assert.strictEqual(about.inert, true);
  assert(body.firstChild.classList.contains('prts-float-open'));
  entry._prtsClickHandler();
  document.getElementById('prts-settings-panel').onclick({ target: body, stopPropagation() {} });
  assert.strictEqual(about.inert, true, 'using the parent collapses its child');
  for (const [index, button] of categoryButtons.entries()) {
    button._prtsClickHandler();
    assert.strictEqual(categoryPanels.filter(node => node.classList.contains('is-open')).length, 1);
    assert.strictEqual(categoryPanels[index].inert, false);
    assert.strictEqual(button.attributes.get('aria-expanded'), 'true');
    assert(categoryPanels.filter((_, i) => i !== index).every(node => node.inert));
  }
  const heading = all(body).find(node => node.className === 'prts-settings-heading');
  heading.events.get('click')({ shiftKey: true, preventDefault() {}, stopPropagation() {} });
  assert.strictEqual(categoryButtons[4].hidden, false);
  heading.events.get('click')({ shiftKey: true, preventDefault() {}, stopPropagation() {} });
  assert.strictEqual(categoryButtons[4].hidden, true);
  assert(categoryPanels.every(node => node.inert));
  categoryButtons[0]._prtsClickHandler();
  const collapse = all(categoryPanels[0]).find(node => node.dataset.prtsConfigKey === 'collapseDescription');
  collapse.onchange({ target: { checked: false } });
  assert.strictEqual(sandbox.CONFIG.collapseDescription, false);
  assert.strictEqual(saves, 2);
  const detailed = all(categoryPanels[0]).find(node => node.dataset.prtsConfigKey === 'trainingPromptStyle' && node.value === 'DETAILED');
  detailed._prtsClickHandler();
  assert.strictEqual(sandbox.CONFIG.trainingPromptStyle, 'DETAILED');
  assert.strictEqual(saves, 3);
  listeners.get('click')({ target: body });
  assert(categoryPanels.every(node => node.inert));
  assert(!body.firstChild.classList.contains('prts-float-open'));
  ball.onclick({ stopPropagation() {}, detail: 0 });
  assert(categoryPanels.every(node => node.inert), 'reopening settings leaves children collapsed');
  escape();
  assert(!body.firstChild.classList.contains('prts-float-open'));
  assert.strictEqual(document.activeElement, ball);
});

test('real modal buttons return distinct update choices and keep Escape local', async () => {
  const body = createTestElement('body');
  const listeners = new Map();
  const document = { body, activeElement: null, addEventListener: (event, listener) => listeners.set(event, listener), removeEventListener: event => listeners.delete(event) };
  document.createElement = document.createElementNS = (...args) => {
    const element = createTestElement(args.at(-1));
    element.addEventListener = () => {};
    element.focus = () => { document.activeElement = element; };
    return element;
  };
  document.getElementById = id => {
    const visit = node => node.id === id ? node : node.children.map(visit).find(Boolean);
    return visit(body);
  };
  class ElementType { static [Symbol.hasInstance](value) { return value?.nodeType === 1; } }
  const sandbox = { document, Node: ElementType, HTMLElement: ElementType, window: { setTimeout: callback => callback(), clearTimeout() {} } };
  vm.runInNewContext(fs.readFileSync(path.join(repoRoot, 'src/ui/dom-helpers.js'), 'utf8'), sandbox);
  for (const [index, expected] of [[0, 'important'], [1, 'skip'], [2, true]]) {
    const pending = sandbox.showPrtsModal({ title: '更新', message: '说明', extraAction: { text: '仅重要更新提示', value: 'important' }, cancelValue: 'skip' });
    const actions = document.getElementById('prts-modal').lastChild;
    assert.strictEqual(actions.children.length, 3);
    actions.children[index].onclick();
    assert.strictEqual(await pending, expected);
    assert.strictEqual(body.children.length, 0);
    assert.strictEqual(listeners.size, 0);
  }
  const confirm = sandbox.showPrtsConfirm({ title: '原有确认' });
  document.getElementById('prts-modal').lastChild.firstChild.onclick();
  assert.strictEqual(await confirm, false);
  const escaped = sandbox.showPrtsModal({ extraAction: { text: '偏好', value: 'important' } });
  assert.strictEqual(document.getElementById('prts-modal-backdrop').parentElement, body);
  let prevented = false, stopped = false;
  listeners.get('keydown')({ key: 'Escape', preventDefault: () => { prevented = true; }, stopPropagation: () => { stopped = true; } });
  assert.strictEqual(await escaped, null);
  assert(prevented && stopped);
  sandbox.showPrtsToast('页面反馈', 'info', '', 0);
  assert.strictEqual(document.getElementById('prts-toast-container').parentElement, body);
});

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
        body, createElement: createTestElement, createElementNS: (_namespace, tag) => createTestElement(tag),
        getElementById: id => {
          const all = node => [node, ...node.children.flatMap(all)];
          return all(body).find(child => child.id === id);
        }
      },
      activeAccountId: 1, getAccountIds: () => [1, 2, 3, 4],
      getDefaultAccountLabel: id => `账号 ${id}`,
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
    vm.runInNewContext(['src/ui/dom-helpers.js', 'src/ui/panels.js'].map(file => fs.readFileSync(path.join(repoRoot, file), 'utf8')).join('\n'), sandbox);
    sandbox.showPrtsToast = (...args) => { messages.push(args); return (...next) => messages.push(next); };
    sandbox.formatSklandImportSummary = () => '账号 1 已导入 2 名干员。';
    sandbox.createSklandImportPanel();
    const panel = body.firstChild;
    const button = panel.querySelector('.prts-skland-primary');
    const status = panel.querySelector('.prts-skland-status');
    const accounts = panel.querySelector('.prts-account-select');
    accounts.value = '4';
    assert.strictEqual(accounts.children[0].textContent, '账号 1');
    const pending = button.onclick();
    assert.strictEqual(button.disabled, true);
    assert.strictEqual(accounts.disabled, true);
    assert.strictEqual(messages[0][1], 'loading');
    assert.strictEqual(messages[0][3], 0);
    complete();
    await pending;
    assert.strictEqual(button.disabled, false);
    assert.strictEqual(accounts.disabled, false);
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

test('mixed operator group popovers keep all original content and can retry when names become known', () => {
  const savedPopoverAvatars = CONFIG.popoverAvatars;
  const savedDocument = context.document;
  const unknownName = '未知新干员';
  const savedId = OP_ID_MAP[unknownName];
  CONFIG.popoverAvatars = true;
  context.document = { createElement: createTestElement };
  try {
    for (const separator of [', ', '，']) for (const unknownFirst of [false, true]) {
      delete OP_ID_MAP[unknownName];
      const candidates = ['阿米娅 2', `${unknownName} 3`];
      if (unknownFirst) candidates.reverse();
      const content = createTestElement();
      const originalNodes = ['-> ', candidates[0], separator, candidates[1]].map(text => createTestElement('span', text));
      originalNodes.forEach(node => content.appendChild(node));
      const originalText = content.textContent;
      const portal = { querySelector: () => content };
      enhancePopover(portal);
      enhancePopover(portal);
      assert.strictEqual(content.textContent, originalText);
      assert.deepStrictEqual(content.children, originalNodes);
      assert.strictEqual(content.dataset.optimized, undefined);
      assert(context.window.BetterPRTSPlusDebug.getUnknownOperators().some(report =>
        report.name === unknownName && report.contexts.includes('popover')));

      OP_ID_MAP[unknownName] = 'char_999999_new';
      enhancePopover(portal);
      const grid = content.firstChild;
      assert.strictEqual(grid.className, 'prts-popover-grid');
      assert.strictEqual(grid.children.length, 2);
      assert.deepStrictEqual(grid.children.map(item => item.firstChild.alt), candidates.map(entry => entry.split(' ')[0]));
      assert.deepStrictEqual(grid.children.map(item => item.lastChild.innerText), candidates.map(entry => entry.split(' ')[1]));
      assert.strictEqual(content.dataset.optimized, 'true');
      enhancePopover(portal);
      assert.strictEqual(content.firstChild, grid);
    }
  } finally {
    CONFIG.popoverAvatars = savedPopoverAvatars;
    context.document = savedDocument;
    if (savedId === undefined) delete OP_ID_MAP[unknownName];
    else OP_ID_MAP[unknownName] = savedId;
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
  const notice = { hidden: true };
  context.location = { reload() { reloads++; } };
  context.document = { getElementById: () => notice, querySelectorAll: () => [] };
  context.refreshAccountStateUi = () => context.updateSettingsReloadNotice();
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
    assert.strictEqual(reloads, 0);
    assert.strictEqual(notice.hidden, false);
    assert.strictEqual(storage.has('prts_cfg_visuals'), false);
    assert.strictEqual(storage.has('prts_plus_filter_mode'), false);
    applyAccountsBackup(backup);
    assert.strictEqual(reloads, 0);
    assert.strictEqual(notice.hidden, false);
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

test('settings batch reload notices survive multiple changes and clear when reverted', () => {
  const saved = new Map([[CONFIG_KEY, JSON.stringify({ operatorAvatars: false })]]);
  const page = createAccountPage(saved, 'prts.plus');
  const config = page.__testExports.CONFIG;
  const notice = { hidden: true };
  page.document = { getElementById: () => notice, querySelectorAll: () => [] };
  const update = (key, value) => {
    config[key] = value;
    page.saveConfig();
    page.refreshAccountControls();
    assert.strictEqual(JSON.parse(saved.get(CONFIG_KEY))[key], value);
  };

  update('operatorAvatars', false);
  assert.strictEqual(notice.hidden, true, 'an enhancement never enabled needs no reload');
  update('hideVideo', true);
  assert.strictEqual(notice.hidden, true, 'live settings need no reload');
  update('collapseDescription', false);
  update('stageBadge', false);
  assert.strictEqual(notice.hidden, false);
  update('collapseDescription', true);
  assert.strictEqual(notice.hidden, false, 'another setting still needs reload');
  update('stageBadge', true);
  assert.strictEqual(notice.hidden, true);
  update('operatorAvatars', true);
  update('operatorAvatars', false);
  assert.strictEqual(notice.hidden, false, 'enhancements enabled in this session need reload on disable');
  const reloaded = createAccountPage(saved, 'prts.plus');
  assert.strictEqual(reloaded.needsSettingsReload(), false);
});

test('floating layout cascades both edges and keeps parent and child within the visible viewport', () => {
  const page = createAccountPage(new Map(), 'prts.plus');
  const config = page.__testExports.CONFIG;
  const container = Object.assign(createTestElement(), { offsetWidth: 48, offsetHeight: 48 });
  const panel = {
    classList: createTestElement().classList,
    style: { setProperty(key, value) { this[key] = value; } },
    get offsetWidth() { return Math.min(320, parseFloat(this.style['--prts-panel-width'])); },
    get offsetHeight() { return Math.min(560, parseFloat(this.style['--prts-panel-max-height'])); }
  };
  const about = {
    dataset: { triggerId: 'prts-settings-about-button' },
    style: { setProperty(key, value) { this[key] = value; } },
    get offsetWidth() { return Math.min(340, parseFloat(this.style['--prts-submenu-width'])); },
    get offsetHeight() { return Math.min(600, parseFloat(this.style.maxHeight)); }
  };
  container.querySelectorAll = () => [about];
  const entry = { getBoundingClientRect: () => ({ top: parseFloat(container.style.top) + parseFloat(panel.style.top) + panel.offsetHeight - 60 }) };
  page.document = { getElementById: id => ({
    'prts-float-container': container, 'prts-settings-panel': panel,
    'prts-about-panel': about, 'prts-settings-about-button': entry
  })[id] };
  for (const [width, height, offsetLeft, offsetTop] of [
    [320, 568, 0, 0], [375, 667, 0, 0], [414, 896, 0, 0],
    [768, 1024, 0, 0], [667, 375, 0, 0], [192, 340, 80, 120], [160, 284, 0, 0], [333, 187, 0, 0]
  ]) {
    page.window.innerWidth = 1280;
    page.window.innerHeight = 900;
    page.window.visualViewport = { width, height, offsetLeft, offsetTop };
    for (const isRight of [false, true]) {
      for (const top of ['0%', '40%', '95%']) {
        config.floatingPosition = { top, isRight };
        page.updateFloatingLayout();
        const ballTop = parseFloat(container.style.top);
        const panelTop = ballTop + parseFloat(panel.style.top);
        assert(ballTop >= offsetTop && ballTop + 48 <= offsetTop + height);
        assert(panelTop >= offsetTop + 12);
        assert(panelTop + panel.offsetHeight <= offsetTop + height - 12);
        const ballLeft = offsetLeft + (isRight ? width - container.offsetWidth : 0);
        const panelLeft = ballLeft + parseFloat(panel.style.left);
        assert(panelLeft >= offsetLeft + 12);
        assert(panelLeft + panel.offsetWidth <= offsetLeft + width - 12);
        const aboutLeft = ballLeft + parseFloat(about.style.left);
        const aboutTop = ballTop + parseFloat(about.style.top);
        assert(aboutLeft >= offsetLeft + 12);
        assert(aboutLeft + about.offsetWidth <= offsetLeft + width - 12);
        assert(aboutTop >= offsetTop + 12);
        assert(aboutTop + about.offsetHeight <= offsetTop + height - 12);
        if (width >= 768) {
          assert(isRight ? aboutLeft + about.offsetWidth + 8 <= panelLeft : aboutLeft >= panelLeft + panel.offsetWidth + 8);
        } else {
          assert.strictEqual(about.offsetWidth, panel.offsetWidth - 24);
          assert.strictEqual(isRight ? panelLeft + panel.offsetWidth - aboutLeft - about.offsetWidth : aboutLeft - panelLeft, 24);
        }
        assert.strictEqual(container.classList.contains('prts-submenu-left'), isRight);
        assert.strictEqual(parseFloat(panel.style['--prts-panel-width']), width - 24);
        assert.strictEqual(container.classList.contains('snap-right'), isRight);
        assert.strictEqual(panel.classList.contains('prts-settings-compact'), height < 240);
        assert.strictEqual(container.style.left, isRight ? 'auto' : `${offsetLeft}px`);
        assert.strictEqual(container.style.right, isRight ? `${1280 - offsetLeft - width}px` : 'auto');
      }
    }
  }
  page.window.visualViewport = undefined;
  config.floatingPosition = { top: '95%', isRight: true };
  page.updateFloatingLayout();
  assert.strictEqual(container.style.top, '852px');
  assert.strictEqual(parseFloat(panel.style['--prts-panel-max-height']), 876);
});

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

test('operator imports reject broken JSON without falling back to TXT', () => {
  for (const raw of ['["阿米娅",', '{bad json', '["阿米娅",]', '["阿米娅"] trailing', '[', '{']) {
    for (const prefix of ['', ' \t\r\n', '\uFEFF', '\uFEFF \r\n']) {
      for (const fileName of ['', 'ops.txt', 'ops.json', 'ops.JSON']) {
        assert.throws(() => parseImportedOperatorNames(prefix + raw, fileName), /JSON 格式错误/);
        assert.throws(() => parseImportedOperators(prefix + raw, fileName), /JSON 格式错误/);
      }
    }
  }
  assert.throws(() => parseImportedOperatorNames('阿米娅', 'ops.json'), /JSON 格式错误/);
});

test('valid JSON with an unsupported shape never falls back to TXT', () => {
  for (const raw of ['null', '{}', '{"name":"阿米娅"}', '"阿米娅"', '123', 'true']) {
    for (const fileName of ['', 'ops.txt', 'ops.json']) {
      assert.throws(() => parseImportedOperators(raw, fileName), /JSON 数据格式错误/);
    }
  }
});

test('file and pasted imports preserve accounts on errors and report unrecognized names without rejecting them', async () => {
  const initial = createAccountState({
    activeAccountId: 2, accountsData: { 1: ['W'], 2: ['能天使'], 3: ['凯尔希'] },
    accountsTraining: { 2: { 能天使: { elite: 2, level: 90 } } }
  });
  const cases = [
    { raw: '["阿米娅",', type: 'error' },
    { raw: '\uFEFF \n{bad json', type: 'error' },
    { raw: '# comment\n// skip\n', type: 'warning' },
    { raw: '阿米娅\n W \n阿米娅', names: ['阿米娅', 'W'], recognized: 2, unknown: [], type: 'success' },
    { raw: '阿米娅\n未知新干员\n未知新干员', names: ['阿米娅', '未知新干员'], recognized: 1,
      unknown: ['未知新干员'], type: 'warning' },
    { raw: '未知新干员', names: ['未知新干员'], recognized: 0, unknown: ['未知新干员'], type: 'warning' },
    { raw: '[{"name":"阿米娅","elite":2,"level":80}]', names: ['阿米娅'],
      training: { 阿米娅: { elite: 2, level: 80 } }, recognized: 1, unknown: [], type: 'success' }
  ];
  for (const method of ['paste', 'file']) for (const example of cases) {
    const sharedStorage = new Map([['prts_plus_accounts_data', serializeAccountState(initial)]]);
    const { page, readers, toasts } = createOperatorImportPage(sharedStorage);
    const scheduled = [];
    let writes = 0;
    page.GM_setValue = (key, value) => { writes++; sharedStorage.set(key, value); };
    page.window.setTimeout = (...args) => scheduled.push(args);
    page.console = { ...page.console, error() {} };
    page.openOperatorImportDialog();
    const dialog = page.document.getElementById('prts-import-dialog');
    const status = dialog.querySelector('.prts-import-status');
    if (method === 'paste') {
      dialog.querySelector('.prts-import-textarea').value = example.raw;
      await dialog.querySelector('.prts-import-action primary').onclick();
    } else {
      const pending = dialog.querySelector('input').onchange({
        target: { files: [{ name: 'ops.txt', size: example.raw.length }] }
      });
      readers[0].onload({ target: { result: example.raw } });
      await pending;
    }
    assert.strictEqual(status.className, `prts-import-status ${example.type}`);
    assert.strictEqual(toasts.at(-1)[1], example.type);
    assert.strictEqual(page.document.getElementById('prts-import-dialog'), dialog);
    assert.strictEqual(scheduled.length, 0, 'import results must stay visible for review');
    if (example.names) {
      assert.strictEqual(writes, 1);
      const expected = hostObject(createAccountState({
        ...initial, accountsData: { ...initial.accountsData, 2: example.names },
        accountsTraining: { 2: example.training || {} }
      }));
      assert.deepStrictEqual(hostObject(page.getCurrentAccountState()), expected);
      assert.deepStrictEqual(JSON.parse(sharedStorage.get('prts_plus_accounts_data')), expected);
      assert(status.textContent.includes(`已识别 ${example.recognized} 名 / 未识别 ${example.unknown.length} 名`));
      for (const name of example.unknown) assert(status.textContent.includes(name));
      if (example.unknown.length) assert(status.textContent.includes('这些名称已保留，请核对拼写'));
    } else {
      assert.strictEqual(writes, 0);
      assert.deepStrictEqual(hostObject(page.getCurrentAccountState()), hostObject(initial));
      assert.strictEqual(sharedStorage.get('prts_plus_accounts_data'), serializeAccountState(initial));
      if (example.type === 'error') {
        assert(status.textContent.includes('JSON 格式错误'));
        assert.strictEqual(status.attributes.get('role'), 'alert');
      }
    }
    page.closeOperatorImportDialog();
  }
});

test('import differences detect removals, lower training and missing fields without treating promotion as a downgrade', () => {
  const previous = { elite: 1, level: 80, potential: 6, mainSkill: 7, skill1: 3, skill2: 3, skill3: 3,
    modX: 3, modY: 3, modD: 3, modA: 3, modB: 3 };
  for (const key of Object.keys(previous)) {
    const lower = { ...previous, [key]: previous[key] - 1 };
    const diff = getOperatorImportDiff(['阿米娅'], ['阿米娅'], { 阿米娅: previous }, { 阿米娅: lower });
    assert.deepStrictEqual(hostArray(diff.decreasedTrainingNames), ['阿米娅'], key);
    assert.strictEqual(diff.clearedTrainingNames.length, 0, key);
    delete lower[key];
    const missing = getOperatorImportDiff(['阿米娅'], ['阿米娅'], { 阿米娅: previous }, { 阿米娅: lower });
    assert.deepStrictEqual(hostArray(missing.clearedTrainingNames), ['阿米娅'], key);
    assert.strictEqual(missing.decreasedTrainingNames.length, 0, key);
  }
  const promoted = getOperatorImportDiff(['阿米娅'], ['阿米娅', 'W', 'W'], { 阿米娅: previous },
    { 阿米娅: { ...previous, elite: 2, level: 1 } });
  assert.strictEqual(promoted.added, 1);
  assert.strictEqual(promoted.total, 2);
  assert.strictEqual(promoted.trainingCount, 1);
  assert.strictEqual(promoted.decreasedTrainingNames.length, 0);
  assert.strictEqual(promoted.clearedTrainingNames.length, 0);
  const txt = getOperatorImportDiff(['阿米娅', 'W'], ['阿米娅'], { 阿米娅: previous });
  assert.deepStrictEqual(hostArray(txt.removedNames), ['W']);
  assert.deepStrictEqual(hostArray(txt.clearedTrainingNames), ['阿米娅']);
  assert.strictEqual(txt.trainingCount, 0);
  assert.strictEqual(getOperatorImportDiff(['W'], ['W'], { W: { modX: 0 } }).clearedTrainingNames.length, 1);
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
    for (const fileName of ['operators.json', 'operators.txt', '']) {
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

test('operation availability matches overlapping groups and reserves fixed operators', () => {
  const groups = [
    { name: 'wide', opers: [{ name: 'A' }, { name: 'B' }] },
    { name: 'left', opers: [{ name: 'A' }, { name: 'C' }] },
    { name: 'right', opers: [{ name: 'A' }, { name: 'C' }] }
  ];
  const owned = new Set(['A', 'B', 'C']);
  for (const order of [groups, [...groups].reverse()]) {
    const matched = checkOperationAvailability({ groups: order }, owned, 'PERFECT');
    assert.strictEqual(matched.isAvailable, true);
    assert.strictEqual(matched.missingCount, 0);
    const operation = { opers: [{ name: 'C' }], groups: order };
    const reserved = checkOperationAvailability(operation, owned, 'PERFECT');
    assert.strictEqual(reserved.isAvailable, false);
    assert.strictEqual(reserved.missingCount, 1);
    const support = checkOperationAvailability(operation, owned, 'SUPPORT');
    assert.strictEqual(support.isAvailable, true);
    assert.strictEqual(support.missingCount, 1);
  }
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

test('dynamic accounts preserve legacy slots, grow beyond three and round trip sparse IDs and backups', () => {
  const { getAccountIds, createAddedAccountState, createRemovedAccountState, formatAccountsBackupSummary } = context.__testExports;
  const initial = createAccountState({ accountsData: { 2: ['W'] } });
  assert.deepStrictEqual(hostArray(getAccountIds(initial.accountsData)), [1, 2, 3]);
  let state = initial;
  for (let index = 4; index <= 12; index++) state = createAddedAccountState(state, index === 4 ? '主账号' : '');
  assert.strictEqual(state.activeAccountId, 12);
  assert.strictEqual(getAccountIds(state.accountsData).length, 12);
  assert.strictEqual(state.accountMeta[4].label, '主账号');
  assert.strictEqual(state.accountMeta[12].label, '账号 12');
  state = createSklandImportState(state, { accountId: 4, names: ['阿米娅'], training: { 阿米娅: { level: 80 } },
    binding: { uid: '444', nickname: '博士' }, importedAt: '2026-10-18T00:00:00Z' }).state;
  state = createRemovedAccountState(state, 2);
  state = createRemovedAccountState(state, 12);
  const restored = createAccountState(JSON.parse(serializeAccountState(state)));
  assert.deepStrictEqual(hostObject(restored), hostObject(state));
  assert(!getAccountIds(restored.accountsData).includes(2));
  const previous = getCurrentAccountState();
  try {
    publishAccountState(restored);
    const backup = parseAccountsBackup(hostObject(buildAccountsBackup()));
    const { preferences, ...backupState } = backup;
    assert.deepStrictEqual(hostObject(backupState), hostObject(restored));
    assert.strictEqual(backup.accountMeta[4].skland.uid, '444');
    assert.strictEqual(backup.accountsTraining[4].阿米娅.level, 80);
    assert(formatAccountsBackupSummary(backup).includes('10 个账号'));
  } finally { publishAccountState(previous); }
  const added = createAddedAccountState(restored, '新增');
  assert.strictEqual(added.activeAccountId, 13, 'removed IDs must not be reused by a pending import');
  assert.deepStrictEqual(hostObject(initial.accountsData), { 1: [], 2: ['W'], 3: [] });
});

test('removing accounts keeps one, selects a remaining account and refuses deleted import targets', () => {
  const { getAccountIds, createRemovedAccountState } = context.__testExports;
  let state = createAccountState({ activeAccountId: 2, accountsData: { 2: ['W'] } });
  state = createRemovedAccountState(state, 2);
  assert.strictEqual(state.activeAccountId, 1);
  assert(!('2' in state.accountsTraining));
  assert(!('2' in state.accountMeta));
  state = createRemovedAccountState(state, 1);
  assert.strictEqual(state.activeAccountId, 3);
  assert.deepStrictEqual(hostArray(getAccountIds(state.accountsData)), [3]);
  assert.throws(() => createRemovedAccountState(state, 3), /至少需要保留一个账号/);
  assert.throws(() => createRenamedAccountState(state, 2, '旧目标'), /已删除/);
  assert.throws(() => createAccountSwitchState(state, 2), /已删除/);
  assert.throws(() => createSklandImportState(state, { accountId: 2 }), /已删除/);
  const malformed = JSON.parse('{"0":[],"-1":[],"01":[],"__proto__":{},"9007199254740992":[],"7":["W"]}');
  const normalized = createAccountState({ nextAccountId: 2, activeAccountId: 9, accountsData: malformed });
  assert.deepStrictEqual(hostArray(getAccountIds(normalized.accountsData)), [7]);
  assert.strictEqual(normalized.activeAccountId, 7);
  assert.strictEqual(normalized.nextAccountId, 8);
});

test('account actions use latest shared data, reconfirm changed deletion and preserve state on failed writes', async () => {
  const initial = createAccountState({ accountsData: { 1: ['阿米娅'] } });
  const sharedStorage = new Map([['prts_plus_accounts_data', serializeAccountState(initial)]]);
  const page = createAccountPage(sharedStorage, 'prts.plus');
  const actions = page.__testExports;
  const toasts = [];
  page.document = { getElementById: () => null };
  page.showPrtsToast = (...args) => toasts.push(args);
  page.refreshAccountStateUi = () => {};
  page.showPrtsPrompt = async () => {
    const remote = createRenamedAccountState(JSON.parse(sharedStorage.get('prts_plus_accounts_data')), 2, '远端改名');
    remote.accountsData[3] = ['W'];
    sharedStorage.set('prts_plus_accounts_data', serializeAccountState(remote));
    return '新账号';
  };
  await actions.addAccount();
  let saved = JSON.parse(sharedStorage.get('prts_plus_accounts_data'));
  assert.strictEqual(saved.activeAccountId, 4);
  assert.strictEqual(saved.accountMeta[2].label, '远端改名');
  assert.deepStrictEqual(saved.accountsData[3], ['W']);
  page.showPrtsPrompt = async () => '本地改名';
  await actions.renameAccount(4);
  assert.strictEqual(JSON.parse(sharedStorage.get('prts_plus_accounts_data')).accountMeta[4].label, '本地改名');
  let confirmations = 0;
  page.showPrtsConfirm = async () => {
    if (++confirmations === 1) {
      const remote = JSON.parse(sharedStorage.get('prts_plus_accounts_data'));
      remote.accountsData[4] = ['能天使'];
      sharedStorage.set('prts_plus_accounts_data', JSON.stringify(remote));
    }
    return true;
  };
  await actions.removeAccount(4);
  assert.strictEqual(confirmations, 2);
  saved = sharedStorage.get('prts_plus_accounts_data');
  assert(!JSON.parse(saved).accountsData[4]);
  assert.deepStrictEqual(JSON.parse(saved).accountsData[3], ['W']);
  page.showPrtsConfirm = async () => false;
  await actions.removeAccount(2);
  assert.strictEqual(sharedStorage.get('prts_plus_accounts_data'), saved);
  page.showPrtsPrompt = async () => null;
  await actions.addAccount();
  assert.strictEqual(sharedStorage.get('prts_plus_accounts_data'), saved);
  const published = hostObject(actions.getCurrentAccountState());
  page.GM_setValue = () => { throw new Error('write failed'); };
  page.showPrtsPrompt = async () => '失败';
  await actions.addAccount();
  assert.strictEqual(toasts.at(-1)[0], '添加账号失败');
  assert.deepStrictEqual(hostObject(actions.getCurrentAccountState()), published);
  assert.strictEqual(sharedStorage.get('prts_plus_accounts_data'), saved);
});

test('imports stop if another page removes the target before or during confirmation', async () => {
  const { createAddedAccountState, createRemovedAccountState } = context.__testExports;
  for (const beforePreview of [true, false]) {
    const initial = createAddedAccountState(createAccountState(), '待导入');
    const sharedStorage = new Map([['prts_plus_accounts_data', serializeAccountState(initial)]]);
    const page = createAccountPage(sharedStorage, 'prts.plus');
    const removeTarget = () => sharedStorage.set('prts_plus_accounts_data', serializeAccountState(createRemovedAccountState(initial, 4)));
    if (beforePreview) removeTarget();
    page.showPrtsConfirm = async () => { removeTarget(); return true; };
    await assert.rejects(page.confirmOperatorImport(4, ['W'], {}, '文本'), /已删除/);
    assert(!JSON.parse(sharedStorage.get('prts_plus_accounts_data')).accountsData[4]);
    assert.throws(() => page.commitSklandImport({ accountId: 4, names: ['W'] }), /已删除/);
  }
});

test('toolbar selects three or more accounts and cycles sparse IDs below three without losing focus', () => {
  const { createRemovedAccountState } = context.__testExports;
  const { page } = createFilterPage('GRAY');
  page.refreshAccountStateUi = () => {
    page.document.getElementById('prts-filter-bar')?.remove();
    page.injectFilterControls();
  };
  let control = page.document.getElementById('btn-account');
  assert.strictEqual(control.tagName, 'SELECT');
  assert.strictEqual(control.children.length, 3);
  page.injectFilterControls();
  assert.strictEqual(page.document.getElementById('btn-account'), control, 'periodic updates preserve the open native control');
  control.focus();
  control.onchange({ target: { value: '3' } });
  assert.strictEqual(page.getCurrentAccountState().activeAccountId, 3);
  assert.strictEqual(page.document.activeElement, page.document.getElementById('btn-account'));
  page.commitAccountState(createRemovedAccountState(page.getCurrentAccountState(), 2));
  page.injectFilterControls();
  control = page.document.getElementById('btn-account');
  assert.strictEqual(control.tagName, 'BUTTON');
  control.onclick();
  assert.strictEqual(page.getCurrentAccountState().activeAccountId, 1);
  page.document.getElementById('btn-account').onclick();
  assert.strictEqual(page.getCurrentAccountState().activeAccountId, 3);
  page.commitAccountState(createRemovedAccountState(page.getCurrentAccountState(), 1));
  page.refreshAccountStateUi();
  assert.strictEqual(page.document.getElementById('btn-account').disabled, true);
});

test('periodic toolbar refresh preserves attached controls, account focus and unchanged select values', () => {
  const { page } = createFilterPage('GRAY');
  const control = page.document.getElementById('btn-account');
  const mainRow = page.document.getElementById('prts-filter-main-row');
  const bar = page.document.getElementById('prts-filter-bar');
  const originalOrder = [...mainRow.children];
  Object.defineProperty(bar.parentElement.firstChild, 'nextElementSibling', { get: () => bar });
  let moves = 0, writes = 0, value = control.value;
  // Keeping the same JS object is insufficient: reattaching it or an ancestor closes native menus.
  [bar, mainRow, ...originalOrder].forEach(node => {
    const remove = node.remove;
    node.remove = function () { moves++; remove.call(this); };
  });
  Object.defineProperty(control, 'value', { get: () => value, set: next => { writes++; value = next; } });
  control.focus();
  page.injectFilterControls();
  page.injectFilterControls();
  assert.strictEqual(moves, 0);
  assert.strictEqual(writes, 0);
  assert.strictEqual(page.document.activeElement, control);
  assert.deepStrictEqual(mainRow.children, originalOrder);
  page.createAccountSelect('btn-account', 2, control.onchange);
  assert.strictEqual(control.value, '2');
  assert.strictEqual(writes, 1, 'an actual account change must still update the select');
});

test('account state serialization preserves the normalized unified schema', () => {
  const state = createAccountState({
    activeAccountId: 2,
    accountsData: { 1: ['阿米娅'], 2: ['W'], 3: [] },
    accountMeta: { 2: { label: '主账号', labelSource: 'manual' } }
  });
  const parsed = JSON.parse(serializeAccountState(state));
  assert.deepStrictEqual(hostObject(createAccountState(parsed)), hostObject(state));
  assert.deepStrictEqual(Object.keys(parsed).sort(), ['accountMeta', 'accountsData', 'accountsTraining', 'activeAccountId', 'nextAccountId']);
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
    GM_setValue: (key, value) => sharedStorage.set(key, value),
    showPrtsConfirm: async () => true
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
  const previews = [];
  page.showPrtsConfirm = async options => { previews.push(options); return true; };
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
  return { page, readers, toasts, previews };
}

test('Escape closes only the operator import dialog and stops before settings shortcuts', () => {
  const { page } = createOperatorImportPage(new Map());
  let keydown;
  page.document.addEventListener = (event, listener) => { if (event === 'keydown') keydown = listener; };
  page.openOperatorImportDialog();
  assert(page.document.getElementById('prts-import-dialog'));
  let prevented = false, stopped = false;
  keydown({ key: 'Escape', preventDefault: () => { prevented = true; }, stopPropagation: () => { stopped = true; } });
  assert.strictEqual(page.document.getElementById('prts-import-dialog'), null);
  assert(prevented && stopped);
});

test('file and paste imports preview destructive changes before writing and preserve data on cancellation', async () => {
  const initial = createAccountState({ activeAccountId: 2,
    accountsData: { 1: ['凯尔希'], 2: ['阿米娅', 'W'] },
    accountsTraining: { 2: { 阿米娅: { elite: 2, level: 80, skill2: 3 } } },
    accountMeta: { 2: { label: '大号', labelSource: 'manual' } }
  });
  for (const method of ['file', 'paste']) for (const confirmed of [false, true]) {
    const stored = serializeAccountState(initial);
    const sharedStorage = new Map([['prts_plus_accounts_data', stored]]);
    const { page, readers, toasts } = createOperatorImportPage(sharedStorage);
    let answer;
    let preview;
    let writes = 0;
    page.showPrtsConfirm = options => { preview = options; return new Promise(resolve => { answer = resolve; }); };
    page.GM_setValue = (key, value) => { writes++; sharedStorage.set(key, value); };
    page.openOperatorImportDialog();
    const dialog = page.document.getElementById('prts-import-dialog');
    const paste = dialog.querySelector('.prts-import-action primary');
    let pending;
    if (method === 'file') {
      pending = dialog.querySelector('input').onchange({ target: { files: [{ name: 'ops.txt', size: 9 }] } });
      readers[0].onload({ target: { result: '阿米娅\n能天使' } });
    } else {
      dialog.querySelector('.prts-import-textarea').value = '阿米娅\n能天使';
      pending = paste.onclick();
    }
    assert.strictEqual(writes, 0);
    assert.strictEqual(sharedStorage.get('prts_plus_accounts_data'), stored);
    assert.strictEqual(paste.disabled, true);
    assert.strictEqual(preview.tone, 'danger');
    assert.strictEqual(preview.confirmText, '确认覆盖并导入');
    for (const text of ['大号（账号 2）', method === 'file' ? 'ops.txt' : '粘贴内容',
      '当前 2 名 → 导入后 2 名', '新增 1 名 / 移除 1 名', '不包含练度数据', '将移除 1 名干员：W',
      '部分或全部练度将被清空 1 名：阿米娅']) assert(preview.message.includes(text), text);
    answer(confirmed);
    await pending;
    assert.strictEqual(paste.disabled, false);
    assert.strictEqual(writes, confirmed ? 1 : 0);
    if (confirmed) {
      const saved = JSON.parse(sharedStorage.get('prts_plus_accounts_data'));
      assert.deepStrictEqual(saved.accountsData[2], ['阿米娅', '能天使']);
      assert.deepStrictEqual(saved.accountsTraining[2], {});
      assert.strictEqual(toasts.at(-1)[1], 'success');
    } else {
      assert.strictEqual(sharedStorage.get('prts_plus_accounts_data'), stored);
      assert.deepStrictEqual(hostObject(page.getCurrentAccountState()), hostObject(initial));
      assert.strictEqual(dialog.querySelector('.prts-import-status').textContent, '已取消导入，未修改账号数据。');
      assert.strictEqual(toasts.length, 0);
    }
  }
});

test('import preview repeats when the target changes and preserves other accounts changed during confirmation', async () => {
  for (const targetChanged of [false, true]) {
    const initial = createAccountState({ accountsData: { 1: ['阿米娅'] }, accountsTraining: { 1: { 阿米娅: { level: 10 } } } });
    const sharedStorage = new Map([['prts_plus_accounts_data', serializeAccountState(initial)]]);
    const { page, previews } = createOperatorImportPage(sharedStorage);
    const remote = createAccountPage(sharedStorage, 'prts.plus');
    page.showPrtsConfirm = async options => {
      previews.push(options);
      if (previews.length === 1) {
        assert.strictEqual(options.tone, '');
        assert(options.message.includes('包含练度：1 / 1 名干员'));
        const latest = remote.getCurrentAccountState();
        latest.activeAccountId = 3;
        latest.accountsData[3] = ['W'];
        if (targetChanged) latest.accountsTraining[1].阿米娅.level = 90;
        remote.commitAccountState(latest);
      } else {
        assert.strictEqual(options.tone, 'danger');
        assert(options.message.includes('练度将降低 1 名：阿米娅'));
        return false;
      }
      return true;
    };
    const imported = await page.applyImportedOperatorNames(1, ['阿米娅'], '粘贴内容', null, { 阿米娅: { level: 20 } });
    assert.strictEqual(imported, !targetChanged);
    assert.strictEqual(previews.length, targetChanged ? 2 : 1);
    const saved = JSON.parse(sharedStorage.get('prts_plus_accounts_data'));
    assert.strictEqual(saved.accountsTraining[1].阿米娅.level, targetChanged ? 90 : 20);
    assert.deepStrictEqual(saved.accountsData[3], ['W']);
    assert.strictEqual(saved.activeAccountId, 3);
  }
});

test('file and paste import write failures report errors and restore controls without changing published data', async () => {
  for (const method of ['file', 'paste']) {
    const initial = serializeAccountState({ accountsData: { 1: ['W'] } });
    const sharedStorage = new Map([['prts_plus_accounts_data', initial]]);
    const { page, readers, toasts } = createOperatorImportPage(sharedStorage);
    vm.runInContext('GM_setValue = () => { throw new Error("storage failure"); };', page);
    page.console = { ...page.console, error() {} };
    page.openOperatorImportDialog();
    const dialog = page.document.getElementById('prts-import-dialog');
    const paste = dialog.querySelector('.prts-import-action primary');
    let pending;
    if (method === 'file') {
      pending = dialog.querySelector('input').onchange({ target: { files: [{ name: 'ops.txt', size: 3 }] } });
      readers[0].onload({ target: { result: '阿米娅' } });
    } else {
      dialog.querySelector('.prts-import-textarea').value = '阿米娅';
      pending = paste.onclick();
    }
    await pending;
    assert.strictEqual(sharedStorage.get('prts_plus_accounts_data'), initial);
    assert.strictEqual(serializeAccountState(page.getCurrentAccountState()), initial);
    assert.strictEqual(toasts.at(-1)[1], 'error');
    assert.strictEqual(paste.disabled, false);
    assert(dialog.querySelector('.prts-import-status error').textContent.includes('storage failure'));
  }
});

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
        await dialog.querySelector('.prts-import-actions').children
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
  const frames = new Map();
  const body = createTestElement('body');
  const searchRow = createTestElement();
  const searchGroup = createTestElement();
  searchRow.appendChild(searchGroup);
  body.appendChild(searchRow);
  Object.assign(page.__testExports.CONFIG, {
    filterMode: 'PERFECT', displayMode, trainingCheck: false, compatDebug: false,
    hidePrtsBadge: false, hideVideo: false, showExactTime: false,
    stageBadge: false, operatorAvatars: false, cleanLink: false, collapseDescription: false
  });
  page.console = { log() {}, warn: (...args) => errors.push(args) };
  page.document = {
    body,
    createElement: tag => Object.assign(createTestElement(tag), {
      addEventListener(type, listener) { this[`on${type}`] = listener; },
      removeEventListener(type) { this[`on${type}`] = null; },
      focus() { page.document.activeElement = this; }
    }),
    createTextNode: text => createTestElement('span', text),
    querySelector: () => null,
    querySelectorAll: () => cards,
    getElementById: id => {
      const find = node => node.id === id ? node : node.children.map(find).find(Boolean);
      return find(body) || null;
    }
  };
  page.requestAnimationFrame = callback => { const id = Symbol(); frames.set(id, callback); return id; };
  page.cancelAnimationFrame = id => frames.delete(id);
  vm.runInContext(['src/ui/dom-helpers.js', 'src/ui/import-controls.js']
    .map(file => fs.readFileSync(path.join(repoRoot, file), 'utf8')).join('\n'), page);
  page.isFilterDisabledPage = () => false;
  page.findSearchInputGroup = () => searchGroup;
  page.createPrtsIcon = () => createTestElement('svg');
  page.injectFilterControls();
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
  return { page, addCard, errors, cards, frames, body };
}

test('filter statistics partition cards using the same availability results as rendering', () => {
  for (const displayMode of ['GRAY', 'HIDE']) {
    const { page, addCard, cards } = createFilterPage(displayMode);
    Object.assign(page.__testExports.CONFIG, { filterMode: 'SUPPORT', hideVideo: true });
    addCard({ opers: [{ name: '阿米娅' }] });
    addCard({ opers: [{ name: 'W' }] });
    addCard({ opers: [{ name: 'W' }, { name: '能天使' }] });
    addCard({ opers: [null] });
    addCard({ opers: [] });
    addCard({ type: 'VIDEO', opers: [{ name: '阿米娅' }] });
    page.applyFilterLogic();
    const stats = page.aggregateCardDiagnostics(cards);
    assert.strictEqual(stats.totalCards, 6);
    assert.strictEqual(stats.availableCards, 1);
    assert.strictEqual(stats.supportCards, 1);
    assert.strictEqual(stats.unavailableCards, 1);
    assert.strictEqual(stats.pendingCards, 2);
    assert.strictEqual(stats.hiddenVideoCards, 1);
    assert.strictEqual(stats.visibleCards, displayMode === 'HIDE' ? 4 : 5);
    const results = page.document.getElementById('prts-filter-results');
    assert.strictEqual(results.querySelector('.prts-filter-summary').textContent,
      '本页 6 份作业，可用 1 份，需助战 1 份，待核验 2 份，不符合 1 份，视频已隐藏 1 份。');
    assert.strictEqual(results.querySelector('.prts-filter-empty').hidden, true);
    assert.strictEqual(results.attributes.get('aria-live'), 'polite');
    page.injectFilterControls();
    assert.strictEqual(page.document.getElementById('prts-filter-results'), results);
    assert.strictEqual(page.document.getElementById('prts-filter-bar').lastChild, results);
  }
});

test('operation set statistics stay in the loaded drawer and exclude background jobs', () => {
  const { page, addCard, cards, body } = createFilterPage('HIDE');
  const background = addCard({ opers: [{ name: '阿米娅' }] });
  let selectedTab = createTestElement();
  let drawer = null;
  page.document.querySelector = selector => selector.startsWith('[role="tab"]') ? selectedTab : drawer;
  page.applyFilterLogic();
  assert.strictEqual(page.getOperationCards().length, 0);
  assert.strictEqual(page.document.getElementById('prts-filter-results'), null);

  page.window.location.search = '?opset=123';
  drawer = createTestElement();
  drawer.querySelectorAll = () => [];
  body.appendChild(drawer);
  page.applyFilterLogic();
  assert.strictEqual(page.document.getElementById('prts-filter-results'), null);

  const content = createTestElement();
  const list = createTestElement('ul');
  content.appendChild(list);
  drawer.appendChild(content);
  drawer.querySelector = selector => selector === 'ul.grid' ? list : null;
  const setCards = Array.from({ length: 8 }, () => addCard({ opers: [{ name: '阿米娅' }] }).card);
  setCards.forEach(card => list.appendChild(card));
  drawer.querySelectorAll = () => setCards;
  // Direct links to a set can have no selected tab behind the drawer.
  selectedTab = null;
  page.applyFilterLogic();
  const results = page.document.getElementById('prts-filter-results');
  assert.strictEqual(results.parentElement, content);
  assert.strictEqual(content.children[content.children.indexOf(list) - 1], results);
  assert.strictEqual(page.document.getElementById('prts-filter-bar').children.includes(results), false);
  assert(results.textContent.includes('本作业集 8 份作业，可用 8 份'));
  assert.strictEqual(page.getCompatibilityDiagnostics().totalCards, 8);
  page.injectFilterControls();
  assert.strictEqual(results.parentElement, content);
  assert.strictEqual(page.document.getElementById('prts-filter-results'), results);

  drawer.remove();
  drawer = null;
  selectedTab = createTestElement();
  page.window.location.search = '';
  page.applyFilterLogic();
  assert.strictEqual(page.document.getElementById('prts-filter-results'), null);
  cards.splice(0, cards.length, background.card);
  selectedTab = null;
  page.applyFilterLogic();
  assert(page.document.getElementById('prts-filter-results').textContent.includes('本页 1 份作业，可用 1 份'));
});

test('card text mutations retry delayed stage badges while script result text is ignored', () => {
  const { page, addCard, frames } = createFilterPage('GRAY');
  page.Node = { ELEMENT_NODE: 1 };
  page.__testExports.CONFIG.stageBadge = true;
  const { card, inner } = addCard({ opers: [{ name: '阿米娅' }] });
  const heading = createTestElement('h4', '昨日海 - YW-8 - 鳞的记忆');
  const stage = createTestElement('span', 'act52side_08');
  const query = inner.querySelector.bind(inner);
  inner.querySelector = selector => selector.startsWith('h4') ? heading
    : selector === '.flex.whitespace-pre .inline-block.font-bold.my-auto' ? stage : query(selector);
  card.matches = selector => selector === 'ul > li:has(> .bp4-card, > .bp6-card)';
  stage.closest = selector => card.matches(selector) ? card : null;
  page.applyFilterLogic();
  assert.strictEqual(heading.querySelector('.prts-level-badge'), null);

  stage.innerText = 'YW-8';
  const mutations = [{ type: 'characterData', target: { nodeType: 3, parentElement: stage } }];
  assert.strictEqual(page.hasRelevantDomMutation(mutations), true);
  const dirtyCards = page.collectDirtyCardsFromMutations(mutations);
  assert.strictEqual(dirtyCards.size, 1);
  assert(dirtyCards.has(card));
  page.requestFilterUpdate({ forceFull: false, dirtyCards });
  runOnlyCallback(frames);
  assert.strictEqual(heading.querySelector('.prts-level-badge')?.innerText, 'YW-8');

  const results = page.document.getElementById('prts-filter-results');
  results.closest = selector => selector.includes('#prts-filter-results') ? results : null;
  const scriptText = [{ type: 'characterData', target: { nodeType: 3, parentElement: results } }];
  assert.strictEqual(page.hasRelevantDomMutation(scriptText), false);
  assert.strictEqual(page.collectDirtyCardsFromMutations(scriptText).size, 0);
  const unrelatedText = [{ type: 'characterData', target: { nodeType: 3, parentElement: createTestElement() } }];
  assert.strictEqual(page.hasRelevantDomMutation(unrelatedText), false);
});

test('an empty filtered page explains hiding and can reveal cards without clearing the filter', () => {
  const { page, addCard, frames } = createFilterPage('HIDE');
  const missing = addCard({ opers: [{ name: 'W' }] });
  page.applyFilterLogic();
  const results = page.document.getElementById('prts-filter-results');
  assert.strictEqual(missing.card.style.display, 'none');
  assert(results.querySelector('.prts-filter-empty-message').textContent.includes('已隐藏 1 份'));
  const button = page.document.getElementById('btn-filter-show-all');
  assert.strictEqual(button.hidden, false);
  button.onclick();
  runOnlyCallback(frames);
  assert.strictEqual(page.__testExports.CONFIG.displayMode, 'GRAY');
  assert.strictEqual(page.__testExports.CONFIG.filterMode, 'PERFECT');
  assert.strictEqual(missing.card.style.display, '');
  assert.strictEqual(missing.card.classList.contains('prts-card-gray'), true);
  assert.strictEqual(page.document.activeElement, page.document.getElementById('btn-setting'));
  assert.strictEqual(page.document.getElementById('btn-filter-show-all').hidden, true);
  assert(!page.document.getElementById('prts-filter-results').textContent.includes('已隐藏 1 份'));
});

test('filter statistics distinguish uncertain training and standalone training failures from usable cards', () => {
  const { page, addCard, cards } = createFilterPage('HIDE');
  page.__testExports.CONFIG.trainingCheck = true;
  addCard({ opers: [{ name: '阿米娅', requirements: { level: 80 } }] });
  addCard({ opers: [{ name: '阿米娅' }] });
  page.applyFilterLogic();
  assert.strictEqual(page.aggregateCardDiagnostics(cards).pendingCards, 2);
  const results = page.document.getElementById('prts-filter-results');
  assert(results.querySelector('.prts-filter-empty-message').textContent.includes('2 份待核验作业已保留'));
  assert(cards.every(card => card.style.display !== 'none'));
  page.__testExports.CONFIG.filterMode = 'NONE';
  const state = page.getCurrentAccountState();
  state.accountsTraining[1] = { 阿米娅: { elite: 2, level: 20 } };
  page.publishAccountState(state);
  page.requestFilterUpdate();
  page.applyFilterLogic();
  const stats = page.aggregateCardDiagnostics(cards);
  assert.strictEqual(stats.availableCards, 0);
  assert.strictEqual(stats.pendingCards, 1);
  assert.strictEqual(stats.unavailableCards, 1);
});

test('statistics refresh dirty cards and exclude removed cards without reprocessing unchanged cards', () => {
  const { page, addCard, cards, frames } = createFilterPage('HIDE');
  const available = addCard({ opers: [{ name: '阿米娅' }] });
  const missing = addCard({ opers: [{ name: 'W' }] });
  page.applyFilterLogic();
  let processed = 0;
  const process = page.processOperationCard;
  page.processOperationCard = card => { processed++; return process(card); };
  // A real card text mutation also invalidates operationCache through its signature.
  let signature = 'changed card text';
  page.getCardSignature = card => card === missing.card ? signature : 'unchanged card text';
  missing.inner.__reactFiber$test.memoizedProps.operation = { opers: [{ name: '阿米娅' }] };
  page.requestFilterUpdate({ forceFull: false, dirtyCards: new Set([missing.card]) });
  runOnlyCallback(frames);
  assert.strictEqual(processed, 1);
  assert(page.document.getElementById('prts-filter-results').textContent.includes('可用 2 份'));
  cards.splice(cards.indexOf(available.card), 1);
  signature = 'changed again';
  page.requestFilterUpdate({ forceFull: false, dirtyCards: new Set([missing.card]) });
  runOnlyCallback(frames);
  assert.strictEqual(processed, 2);
  assert(page.document.getElementById('prts-filter-results').textContent.includes('本页 1 份作业，可用 1 份'));
});

test('statistics reset for empty pages, disabled routes, inactive filters and accounts without data', () => {
  const { page, addCard, cards, frames } = createFilterPage('HIDE');
  const results = page.document.getElementById('prts-filter-results');
  assert.strictEqual(results.querySelector('.prts-filter-summary').textContent, '正在统计本页作业…');
  addCard({ opers: [{ name: 'W' }] });
  page.applyFilterLogic();
  page.toggleFilter('PERFECT');
  runOnlyCallback(frames);
  assert.strictEqual(results.querySelector('.prts-filter-summary').textContent, '本页 1 份作业，未开启筛选。');
  assert.strictEqual(results.querySelector('.prts-filter-empty').hidden, true);
  const state = page.getCurrentAccountState();
  state.accountsData[1] = [];
  page.publishAccountState(state);
  page.requestFilterUpdate();
  runOnlyCallback(frames);
  assert(results.textContent.includes('请先导入干员数据后筛选'));
  cards.length = 0;
  page.applyFilterLogic();
  assert.strictEqual(results.querySelector('.prts-filter-summary').textContent, '本页 0 份作业。');
  assert(results.querySelector('.prts-filter-empty-message').textContent.includes('若正在加载，请稍候'));
  page.renderFilterResults(null);
  assert.strictEqual(results.querySelector('.prts-filter-summary').textContent, '正在统计本页作业…');
  page.isFilterDisabledPage = () => true;
  page.applyFilterLogic();
  page.injectFilterControls();
  assert.strictEqual(page.document.getElementById('prts-filter-results'), null);
});

test('video-only pages explain video hiding instead of offering an ineffective gray-mode action', () => {
  const { page, addCard } = createFilterPage('HIDE');
  page.__testExports.CONFIG.hideVideo = true;
  addCard({ type: 'VIDEO', opers: [null] });
  page.applyFilterLogic();
  assert(page.document.getElementById('prts-filter-results').textContent.includes('本页作业均为视频，已被隐藏'));
  assert.strictEqual(page.document.getElementById('btn-filter-show-all').hidden, true);
});

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
      await pasteButton.onclick();
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

  sklandPage.showPrtsConfirm = async preview => {
    assert.strictEqual(preview.tone, 'danger');
    assert(preview.message.includes('最新手动昵称（账号 1）'));
    assert(preview.message.includes('森空岛 · 导入博士 / UID 111'));
    assert(preview.message.includes('将移除 1 名干员：凯尔希'));
    return true;
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

test('cancelling a Skland import preview preserves account data and sync metadata', async () => {
  const initial = serializeAccountState({ accountsData: { 1: ['W'] } });
  const sharedStorage = new Map([['prts_plus_accounts_data', initial], ['prts_plus_skland_last_import', 'previous summary']]);
  const page = createAccountPage(sharedStorage, 'www.skland.com');
  page.readSklandCredentialFromStorage = () => 'test-credential';
  page.refreshSklandToken = async () => ({ token: 'test-token', timestamp: '1' });
  page.getSklandArknightsBindingOptions = async () => ({ bindings: [{ uid: '111', nickname: '博士' }] });
  page.getSklandGamePlayerInfo = async () => ({ data: { chars: [{ id: 'char_002_amiya', name: '阿米娅' }] } });
  page.getSklandGameCultivateInfo = async () => ({ data: { characters: [] } });
  page.showPrtsConfirm = async () => false;
  await assert.rejects(page.importSklandOperatorsToAccount(1), { code: 'SKLAND_IMPORT_CANCELLED' });
  assert.strictEqual(sharedStorage.get('prts_plus_accounts_data'), initial);
  assert.strictEqual(sharedStorage.get('prts_plus_skland_last_import'), 'previous summary');
  assert.strictEqual(serializeAccountState(page.getCurrentAccountState()), initial);
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
