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
  matchOperatorGroups,
  parseAccountsBackup,
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
  matchOperatorGroups,
  parseAccountsBackup,
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

test('parseAccountsBackup normalizes data and preferences', () => {
  const backup = parseAccountsBackup({
    type: ACCOUNT_BACKUP_TYPE,
    version: ACCOUNT_BACKUP_VERSION,
    activeAccountId: '2',
    accountsData: { 1: ['A', 'A', ''], 2: ['B'], 3: null },
    accountMeta: {
      2: { label: '<b>主号</b>', labelSource: 'manual' }
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
