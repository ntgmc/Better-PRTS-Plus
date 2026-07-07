const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const sourceFiles = [
  'src/core/constants.js',
  'src/data/operators.generated.js',
  'src/import/parsers.js',
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
const context = {
  console,
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
  matchOperatorGroups,
  parseAccountsBackup,
  getSklandArknightsBindingOptionsFromList,
  normalizeSklandArknightsBindings,
  selectSklandBindingOption,
  selectSklandArknightsBinding,
  convertSklandPlayerInfoToNames
} = context.__testExports;

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
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

console.log('All core function tests passed.');
