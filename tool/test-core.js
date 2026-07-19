const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const sourceFiles = [
  'src/core/constants.js',
  'src/data/operators.generated.js',
  'src/import/parsers.js',
  'src/core/account-state.js',
  'src/core/filter-scheduler.js',
  'src/import/skland.js',
  'src/dom/card-resolution.js',
  'src/filter/operation-matching.js',
  'src/import/accounts.js'
];

const source = sourceFiles
  .map(file => fs.readFileSync(path.join(repoRoot, file), 'utf8'))
  .join('\n') + `
globalThis.__testExports = {
  ACCOUNT_BACKUP_TYPE,
  ACCOUNT_BACKUP_VERSION,
  parseImportedOperatorNames,
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
  getCurrentAccountState,
  getOwnedOpsSnapshot: () => Array.from(ownedOpsSet),
  publishAccountState,
  commitAccountState,
  commitSklandImportResult,
  matchOperatorGroups,
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
  ACCOUNT_BACKUP_TYPE,
  ACCOUNT_BACKUP_VERSION,
  parseImportedOperatorNames,
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
  getCurrentAccountState,
  getOwnedOpsSnapshot,
  publishAccountState,
  commitAccountState,
  commitSklandImportResult,
  matchOperatorGroups,
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

function hostArray(value) {
  return Array.from(value);
}

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
      config: { visuals: false, cleanLink: false, hideSidebar: true },
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
  assert.strictEqual(backup.preferences.config.visuals, false);
  assert.strictEqual(backup.preferences.config.cleanLink, false);
  assert.strictEqual(backup.preferences.config.hideSidebar, true);
  assert.deepStrictEqual(hostObject(backup.preferences.floatingPosition), { top: '95%', isRight: false });
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

test('account state serialization preserves the normalized unified schema', () => {
  const state = createAccountState({
    activeAccountId: 2,
    accountsData: { 1: ['阿米娅'], 2: ['W'], 3: [] },
    accountMeta: { 2: { label: '主账号', labelSource: 'manual' } }
  });
  const parsed = JSON.parse(serializeAccountState(state));
  assert.deepStrictEqual(hostObject(createAccountState(parsed)), hostObject(state));
  assert.deepStrictEqual(Object.keys(parsed).sort(), ['accountMeta', 'accountsData', 'activeAccountId']);
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
