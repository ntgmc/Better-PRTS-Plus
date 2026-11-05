module.exports = ({ assert, test, createAccountState, serializeAccountState, createAccountPage, hostObject, hostArray }) => {
const passphrase = 'test-only-vault-passphrase';
function createSavedSklandPage(sharedStorage = new Map()) {
  const initial = createAccountState({ activeAccountId: 2, accountsData: { 1: ['阿米娅'], 2: ['W'] },
    accountMeta: Object.fromEntries([1, 2].map(id => [id, { label: `博士${id}`, labelSource: 'manual', skland: {
      uid: `${id}11`, nickname: `博士${id}`, importedAt: '2020-01-01T00:00:00.000Z', operatorCount: 1
    } }]))
  });
  if (!sharedStorage.has('prts_plus_accounts_data')) sharedStorage.set('prts_plus_accounts_data', serializeAccountState(initial));
  const page = createAccountPage(sharedStorage, 'prts.plus');
  const requests = [], toasts = [];
  page.document.visibilityState = 'visible';
  page.refreshSklandSyncControls = () => {};
  page.refreshAccountStateUi = () => {};
  page.showPrtsToast = (...args) => toasts.push(args);
  page.refreshSklandToken = async credential => {
    requests.push(['auth', credential]);
    return { token: 'temporary-api-token', timestamp: '1' };
  };
  page.getSklandArknightsBindingOptions = async credential => ({ bindings: [
    { uid: credential.includes('second') ? '211' : '111', nickname: '博士', isDefault: true }
  ] });
  page.getSklandGamePlayerInfo = async (_credential, _token, _timestamp, uid) => {
    requests.push(['player', uid]);
    return { data: { chars: [{ id: 'char_002_amiya', name: uid === '111' ? '阿米娅' : 'W', evolvePhase: 2, level: 80 }] } };
  };
  page.getSklandGameCultivateInfo = async () => ({ data: { characters: [] } });
  const save = async (mode = 'encrypted') => {
    await page.setSklandSyncEnabled(true, passphrase, mode);
    for (const id of [1, 2]) await page.saveSklandCredentialForAccount({ accountId: id, uid: `${id}11` },
      id === 1 ? 'first-test-credential' : 'second-test-credential');
    const store = page.readSklandSyncStore();
    Object.values(store.accounts).forEach(entry => { entry.lastAttemptAt = 0; entry.lastSuccessAt = 0; });
    page.writeSklandSyncStore(store);
  };
  return { page, sharedStorage, requests, toasts, save };
}

test('Skland credentials require current consent, stay out of backups, and are erased on disable', async () => {
  const h = createSavedSklandPage();
  const { page } = h;
  await page.saveSklandCredentialForAccount({ accountId: 1, uid: '111' }, 'first-test-credential');
  assert.strictEqual(h.sharedStorage.has('prts_plus_skland_sync'), false);
  h.sharedStorage.set('prts_plus_skland_sync', JSON.stringify({ consentVersion: 999, accounts: { 1: { credential: 'first-test-credential', uid: '111' } } }));
  assert.strictEqual(page.isSklandSyncEnabled(), false);
  assert.deepStrictEqual(hostObject(page.readSklandSyncStore().accounts), {});
  await h.save();
  const store = page.readSklandSyncStore();
  assert.strictEqual(store.accounts[1].credential, undefined);
  assert.strictEqual(await page.decryptSklandCredential(1, store.accounts[1]), 'first-test-credential');
  assert(!h.sharedStorage.get('prts_plus_skland_sync').includes('test-credential'));
  assert(!h.sharedStorage.get('prts_plus_skland_sync').includes(passphrase));
  assert.strictEqual(store.autoRefresh, true);
  const backup = JSON.stringify(page.buildAccountsBackup());
  assert(!/credential|token|prts_plus_skland_sync|consentVersion/.test(backup));
  assert(!h.sharedStorage.get('prts_plus_accounts_data').includes('credential'));
  await assert.rejects(page.saveSklandCredentialForAccount({ accountId: 1, uid: '111' }, 'bad\r\ncredential'), /格式/);
  await page.setSklandSyncEnabled(false);
  assert.strictEqual(page.isSklandSyncEnabled(), false);
  assert(!h.sharedStorage.get('prts_plus_skland_sync').includes('credential'));
  assert.deepStrictEqual(hostObject(page.getCurrentAccountState().accountsData[1]), ['阿米娅']);
});

test('Skland imports only save credentials after consent and a confirmed successful import', async () => {
  for (const enabled of [false, true]) for (const confirmed of [false, true]) {
    const h = createSavedSklandPage();
    if (enabled) await h.page.setSklandSyncEnabled(true, passphrase);
    h.page.readSklandCredentialFromStorage = () => 'first-test-credential';
    h.page.showPrtsConfirm = async () => confirmed;
    if (confirmed) await h.page.importSklandOperatorsToAccount(1);
    else await assert.rejects(h.page.importSklandOperatorsToAccount(1), { code: 'SKLAND_IMPORT_CANCELLED' });
    assert.strictEqual(Boolean(h.page.readSklandSyncStore().accounts[1]), enabled && confirmed);
  }
  const h = createSavedSklandPage();
  await h.page.setSklandSyncEnabled(true, passphrase);
  h.page.readSklandCredentialFromStorage = () => 'first-test-credential';
  const write = h.page.GM_setValue;
  h.page.GM_setValue = (key, value) => {
    if (key === 'prts_plus_skland_sync') throw new Error('storage failed');
    write(key, value);
  };
  const summary = await h.page.importSklandOperatorsToAccount(1);
  assert.strictEqual(summary.credentialSaveFailed, true);
  assert.strictEqual(h.page.getCurrentAccountState().accountsTraining[1]['阿米娅'].level, 80);
});

test('Skland auth distinguishes expired credentials from transient and malformed responses', async () => {
  const page = createAccountPage(new Map(), 'prts.plus');
  page.generateSklandSign = async () => 'synthetic-sign';
  for (const response of [null, { code: 503, message: '服务繁忙' }, { code: 0, message: 'OK', data: {} }]) {
    page.sklandRequestJson = async () => response;
    await assert.rejects(page.refreshSklandToken('test-credential'), error => error.code !== 'SKLAND_AUTH_EXPIRED');
  }
  for (const response of [{ code: 10002, message: 'expired' }, { code: 123, message: '请先登录' }]) {
    page.sklandRequestJson = async () => response;
    await assert.rejects(page.refreshSklandToken('test-credential'), { code: 'SKLAND_AUTH_EXPIRED' });
  }
});

for (const mode of ['encrypted', 'plaintext']) test(`Skland ${mode} auto refresh is per-account, waits 24 hours after success and one hour after failure`, async () => {
  const h = createSavedSklandPage();
  await h.save(mode);
  await h.page.refreshSavedSklandAccounts(true);
  assert.strictEqual(h.requests.filter(([type]) => type === 'auth').length, 2);
  assert.strictEqual(h.page.getCurrentAccountState().activeAccountId, 2);
  assert.strictEqual(h.page.getCurrentAccountState().accountsTraining[1]['阿米娅'].level, 80);
  await h.page.refreshSavedSklandAccounts(true);
  const secondPage = createSavedSklandPage(h.sharedStorage);
  if (mode === 'encrypted') await secondPage.page.unlockSklandVault(passphrase);
  await secondPage.page.refreshSavedSklandAccounts(true);
  assert.strictEqual(h.requests.length, 4);
  assert.strictEqual(secondPage.requests.length, 0, 'reloads share the persisted throttle');
  assert.strictEqual(h.toasts.length, 0, 'routine automatic success stays quiet');
  const now = Date.now();
  const entry = { status: '', lastSuccessAt: now - 86400000, lastAttemptAt: now - 3600000 };
  assert(h.page.isSklandAccountRefreshDue(entry, now));
  assert(!h.page.isSklandAccountRefreshDue({ ...entry, lastSuccessAt: now - 86400000 + 1 }, now));
  assert(!h.page.isSklandAccountRefreshDue({ ...entry, lastAttemptAt: now - 3600000 + 1 }, now));
  for (const status of ['expired', 'review']) assert(!h.page.isSklandAccountRefreshDue({ ...entry, status }, now));
});

for (const mode of ['encrypted', 'plaintext']) test(`Skland ${mode} auto refresh skips hidden pages and disabled preference; manual refresh still works`, async () => {
  const h = createSavedSklandPage();
  await h.save(mode);
  h.page.document.visibilityState = 'hidden';
  await h.page.refreshSavedSklandAccounts(true);
  assert.strictEqual(h.requests.length, 0);
  h.page.document.visibilityState = 'visible';
  const store = h.page.readSklandSyncStore();
  store.autoRefresh = false;
  h.page.writeSklandSyncStore(store);
  await h.page.refreshSavedSklandAccounts(true);
  assert.strictEqual(h.requests.length, 0);
  await h.page.refreshSavedSklandAccounts();
  assert.strictEqual(h.requests.length, 4);
  assert.strictEqual(h.toasts.at(-1)[1], 'success');
});

for (const mode of ['encrypted', 'plaintext']) test(`Skland ${mode} refresh isolates expired and failed accounts and never logs or displays credentials`, async () => {
  for (const expired of [false, true]) {
    const h = createSavedSklandPage();
    await h.save(mode);
    h.page.refreshSklandToken = async credential => {
      h.requests.push(['auth', credential]);
      if (credential.includes('first')) {
        const error = new Error(`private response ${credential}`);
        if (expired) error.code = 'SKLAND_AUTH_EXPIRED';
        throw error;
      }
      return { token: 'short-lived', timestamp: '1' };
    };
    await h.page.refreshSavedSklandAccounts();
    const store = h.page.readSklandSyncStore();
    assert.strictEqual(store.accounts[1].status, expired ? 'expired' : 'failed');
    assert.strictEqual(store.accounts[1].lastSuccessAt, 0);
    assert.strictEqual(store.accounts[2].status, '');
    assert.strictEqual(h.page.getCurrentAccountState().accountsTraining[2].W.level, 80);
    assert.strictEqual(h.toasts.at(-1)[1], 'warning');
    assert(!JSON.stringify(h.toasts).includes('credential'));
    await h.page.refreshSavedSklandAccounts(true);
    assert.strictEqual(h.requests.filter(([type]) => type === 'auth').length, 2);
  }
});

test('Skland saved refresh uses the exact role and preserves data if a binding disappears', async () => {
  const h = createSavedSklandPage();
  await h.save();
  h.page.getSklandArknightsBindingOptions = async () => ({ bindings: [
    { uid: 'different-default', nickname: '其他角色', isDefault: true }
  ] });
  const before = h.sharedStorage.get('prts_plus_accounts_data');
  await h.page.refreshSavedSklandAccounts();
  assert.strictEqual(h.sharedStorage.get('prts_plus_accounts_data'), before);
  assert(!h.requests.some(([type]) => type === 'player'));
});

test('Skland auto refresh preserves destructive changes for manual review and accepts a confirmed manual retry', async () => {
  const h = createSavedSklandPage();
  await h.save();
  const state = h.page.getCurrentAccountState();
  state.accountsData[1].push('能天使');
  h.page.commitAccountState(state);
  let confirmations = 0;
  h.page.showPrtsConfirm = async () => { confirmations++; return false; };
  await h.page.refreshSavedSklandAccounts(true);
  assert.strictEqual(confirmations, 0);
  assert.strictEqual(h.page.readSklandSyncStore().accounts[1].status, 'review');
  assert.deepStrictEqual(hostArray(h.page.getCurrentAccountState().accountsData[1]), ['阿米娅', '能天使']);
  await h.page.refreshSavedSklandAccounts();
  assert.strictEqual(confirmations, 1);
  assert.deepStrictEqual(hostArray(h.page.getCurrentAccountState().accountsData[1]), ['阿米娅', '能天使']);
  h.page.showPrtsConfirm = async () => true;
  await h.page.refreshSavedSklandAccounts();
  assert.deepStrictEqual(hostArray(h.page.getCurrentAccountState().accountsData[1]), ['阿米娅']);
  assert.strictEqual(h.page.readSklandSyncStore().accounts[1].status, '');
});

test('Skland auto refresh holds lower and missing training for manual review', async () => {
  for (const training of [{ elite: 2, level: 90 }, { elite: 2, level: 80, skill1: 3 }]) {
    const h = createSavedSklandPage();
    await h.save();
    const state = h.page.getCurrentAccountState();
    state.accountsTraining[1] = { 阿米娅: training };
    h.page.commitAccountState(state);
    await h.page.refreshSavedSklandAccounts(true);
    assert.strictEqual(h.page.readSklandSyncStore().accounts[1].status, 'review');
    assert.deepStrictEqual(hostObject(h.page.getCurrentAccountState().accountsTraining[1]['阿米娅']), training);
  }
});

for (const mode of ['encrypted', 'plaintext']) test(`Skland ${mode} disabling during a request prevents further requests, commits and credential resurrection`, async () => {
  const h = createSavedSklandPage();
  await h.save(mode);
  const before = h.sharedStorage.get('prts_plus_accounts_data');
  let release;
  h.page.refreshSklandToken = () => new Promise(resolve => { release = resolve; });
  const pending = h.page.refreshSavedSklandAccounts();
  while (!release) await new Promise(resolve => setImmediate(resolve));
  await h.page.refreshSavedSklandAccounts();
  await h.page.setSklandSyncEnabled(false);
  release({ token: 'temporary', timestamp: '1' });
  await pending;
  assert.strictEqual(h.sharedStorage.get('prts_plus_accounts_data'), before);
  assert.strictEqual(h.requests.length, 0);
  assert.deepStrictEqual(hostObject(h.page.readSklandSyncStore().accounts), {});
});

test('Skland storage failure stops requests, keeps existing data and releases the running state', async () => {
  const h = createSavedSklandPage();
  await h.save();
  const before = h.sharedStorage.get('prts_plus_accounts_data');
  const write = h.page.GM_setValue;
  h.page.GM_setValue = () => { throw new Error('storage failed'); };
  await assert.rejects(h.page.refreshSavedSklandAccounts(), /storage failed/);
  assert.strictEqual(h.requests.length, 0);
  assert.strictEqual(h.sharedStorage.get('prts_plus_accounts_data'), before);
  h.page.GM_setValue = write;
  let failUi = true;
  h.page.refreshSklandSyncControls = () => {
    if (failUi) { failUi = false; throw new Error('UI read failed'); }
  };
  await assert.rejects(h.page.refreshSavedSklandAccounts(), /UI read failed/);
  await h.page.refreshSavedSklandAccounts();
  assert.strictEqual(h.requests.length, 4);
});

test('Skland scheduler checks on visibility and once per minute only on PRTS hosts', async () => {
  for (const hostname of ['prts.plus', 'www.skland.com']) {
    const page = createAccountPage(new Map(), hostname);
    const intervals = [], listeners = [], checks = [];
    page.window.setInterval = (callback, delay) => intervals.push({ callback, delay });
    page.document.addEventListener = (name, callback) => listeners.push({ name, callback });
    page.refreshSavedSklandAccounts = async automatic => checks.push(automatic);
    page.startSklandAutoRefresh();
    if (hostname === 'www.skland.com') {
      assert.strictEqual(checks.length + intervals.length + listeners.length, 0);
      continue;
    }
    assert.strictEqual(intervals[0].delay, 60000);
    assert.strictEqual(listeners[0].name, 'visibilitychange');
    intervals[0].callback();
    listeners[0].callback();
    assert.deepStrictEqual(checks, [true, true, true]);
  }
});

for (const mode of ['encrypted', 'plaintext']) test(`Skland ${mode} saved credentials are cleared on account deletion and backup restore`, async () => {
  const h = createSavedSklandPage();
  await h.save(mode);
  h.page.document.getElementById = () => null;
  await h.page.removeAccount(1);
  assert.strictEqual(h.page.readSklandSyncStore().accounts[1], undefined);
  assert(h.page.readSklandSyncStore().accounts[2]);
  h.page.syncPageScaffold = () => {};
  h.page.applyAccountsBackup(h.page.buildAccountsBackup());
  assert.deepStrictEqual(hostObject(h.page.readSklandSyncStore().accounts), {});
  assert(h.page.isSklandSyncEnabled());
});

test('Skland cross-tab lock skips concurrent refresh and rechecks throttles when acquired', async () => {
  const h = createSavedSklandPage();
  await h.save();
  let acquired = false;
  h.page.navigator = { locks: { request: async (name, options, callback) => {
    assert.strictEqual(name, 'better-prts-skland-sync');
    assert.strictEqual(options.ifAvailable, true);
    return callback(acquired ? {} : null);
  } } };
  await h.page.refreshSavedSklandAccounts(true);
  assert.strictEqual(h.requests.length, 0);
  await h.page.refreshSavedSklandAccounts();
  assert.strictEqual(h.toasts.at(-1)[0], '其他页面正在刷新森空岛数据');
  acquired = true;
  await h.page.refreshSavedSklandAccounts(true);
  await h.page.refreshSavedSklandAccounts(true);
  assert.strictEqual(h.requests.length, 4);
});

test('Skland vault uses randomized authenticated encryption and a non-exportable derived key', async () => {
  const h = createSavedSklandPage();
  await h.save();
  const first = h.page.readSklandSyncStore().accounts[1];
  await h.page.saveSklandCredentialForAccount({ accountId: 1, uid: '111' }, 'first-test-credential');
  const second = h.page.readSklandSyncStore().accounts[1];
  assert.notStrictEqual(first.sealedCredential.iv, second.sealedCredential.iv);
  assert.notStrictEqual(first.sealedCredential.ciphertext, second.sealedCredential.ciphertext);
  assert.strictEqual(await h.page.decryptSklandCredential(1, second), 'first-test-credential');
  await assert.rejects(h.page.decryptSklandCredential(2, second), /口令错误或加密数据已损坏/);
  await assert.rejects(h.page.decryptSklandCredential(1, { ...second, uid: 'another-role' }), /口令错误或加密数据已损坏/);
  const salt = h.page.readSklandSyncStore().vault.salt;
  const key = await h.page.deriveSklandVaultKey(passphrase, salt);
  assert.strictEqual(key.extractable, false);
  await assert.rejects(h.page.crypto.subtle.exportKey('raw', key));
  const other = createSavedSklandPage();
  await other.save();
  assert.notStrictEqual(other.page.readSklandSyncStore().vault.salt, salt);
});

test('Skland vault stays locked after reload or a wrong password, without requests or storage changes', async () => {
  const h = createSavedSklandPage();
  await h.save();
  const before = h.sharedStorage.get('prts_plus_skland_sync');
  const reload = createSavedSklandPage(h.sharedStorage);
  assert(!reload.page.isSklandVaultUnlocked());
  await reload.page.refreshSavedSklandAccounts(true);
  await reload.page.refreshSavedSklandAccounts();
  assert.strictEqual(reload.requests.length, 0);
  await assert.rejects(reload.page.unlockSklandVault('wrong-test-passphrase'), /口令错误或加密数据已损坏/);
  assert(!reload.page.isSklandVaultUnlocked());
  assert.strictEqual(h.sharedStorage.get('prts_plus_skland_sync'), before);
  await reload.page.unlockSklandVault(passphrase);
  await reload.page.refreshSavedSklandAccounts(true);
  assert.strictEqual(reload.requests.length, 4);
  reload.page.lockSklandVault();
  assert(!reload.page.isSklandVaultUnlocked());
  await assert.rejects(reload.page.saveSklandCredentialForAccount({ accountId: 1, uid: '111' }, 'first-test-credential'), /锁定/);
});

test('Skland tampered credentials fail closed, preserve operator data and do not block other accounts', async () => {
  const h = createSavedSklandPage();
  await h.save();
  const store = h.page.readSklandSyncStore();
  const sealed = store.accounts[1].sealedCredential;
  sealed.ciphertext = (sealed.ciphertext.startsWith('00') ? '01' : '00') + sealed.ciphertext.slice(2);
  h.page.writeSklandSyncStore(store);
  await h.page.refreshSavedSklandAccounts();
  assert(!h.requests.some(([type, value]) => type === 'auth' && value === 'first-test-credential'));
  assert.strictEqual(h.page.readSklandSyncStore().accounts[1].status, 'failed');
  assert.strictEqual(h.page.getCurrentAccountState().accountsTraining[1]['阿米娅'], undefined);
  assert.strictEqual(h.page.getCurrentAccountState().accountsTraining[2].W.level, 80);
  h.page.lockSklandVault();
  const changed = h.page.readSklandSyncStore();
  changed.vault.check.ciphertext = '00'.repeat(32);
  h.page.writeSklandSyncStore(changed);
  await assert.rejects(h.page.unlockSklandVault(passphrase), /口令错误或加密数据已损坏/);
  assert(!h.page.isSklandVaultUnlocked());
});

test('Skland encryption has no plaintext fallback when crypto, password or persistence fails', async () => {
  const h = createSavedSklandPage();
  h.page.crypto = {};
  await assert.rejects(h.page.setSklandSyncEnabled(true, passphrase), /不支持凭据加密/);
  assert.strictEqual(h.sharedStorage.has('prts_plus_skland_sync'), false);
  h.page.crypto = require('node:crypto').webcrypto;
  for (const invalid of ['', 'short', 'x'.repeat(257)]) {
    await assert.rejects(h.page.setSklandSyncEnabled(true, invalid), /独立加密口令/);
    assert.strictEqual(h.sharedStorage.has('prts_plus_skland_sync'), false);
  }
  h.page.GM_setValue = () => { throw new Error('storage failed'); };
  await assert.rejects(h.page.setSklandSyncEnabled(true, passphrase), /storage failed/);
  assert(!h.page.isSklandVaultUnlocked());
  assert.strictEqual(h.sharedStorage.has('prts_plus_skland_sync'), false);
});

test('Skland legacy plaintext is paused and atomically migrated to ciphertext after setting a password', async () => {
  const h = createSavedSklandPage();
  const legacy = JSON.stringify({ consentVersion: 1, autoRefresh: false, accounts: {
    1: { credential: 'first-test-credential', uid: '111', lastSuccessAt: 123, lastAttemptAt: 456, status: '' }
  } });
  h.sharedStorage.set('prts_plus_skland_sync', legacy);
  assert(!h.page.isSklandSyncEnabled());
  await h.page.refreshSavedSklandAccounts();
  assert.strictEqual(h.requests.length, 0);
  const write = h.page.GM_setValue;
  h.page.GM_setValue = () => { throw new Error('storage failed'); };
  await assert.rejects(h.page.setSklandSyncEnabled(true, passphrase), /storage failed/);
  assert.strictEqual(h.sharedStorage.get('prts_plus_skland_sync'), legacy);
  h.page.GM_setValue = write;
  await h.page.setSklandSyncEnabled(true, passphrase);
  const store = h.page.readSklandSyncStore();
  assert.strictEqual(store.consentVersion, 2);
  assert.strictEqual(store.autoRefresh, false);
  assert.strictEqual(store.accounts[1].lastSuccessAt, 123);
  assert(!h.sharedStorage.get('prts_plus_skland_sync').includes('test-credential'));
  assert.strictEqual(await h.page.decryptSklandCredential(1, store.accounts[1]), 'first-test-credential');
  assert.strictEqual(h.page.getCurrentAccountState().activeAccountId, 2);
});

test('Skland lock during a request prevents the next request and operator commit', async () => {
  const h = createSavedSklandPage();
  await h.save();
  const before = h.sharedStorage.get('prts_plus_accounts_data');
  let release;
  h.page.refreshSklandToken = () => new Promise(resolve => { release = resolve; });
  const pending = h.page.refreshSavedSklandAccounts();
  while (!release) await new Promise(resolve => setImmediate(resolve));
  h.page.lockSklandVault();
  release({ token: 'temporary', timestamp: '1' });
  await pending;
  assert.strictEqual(h.requests.length, 0);
  assert.strictEqual(h.sharedStorage.get('prts_plus_accounts_data'), before);
});

test('Skland encrypted storage is the default for new and existing users; plaintext requires explicit versioned consent', async () => {
  const h = createSavedSklandPage();
  assert.strictEqual(h.page.readSklandSyncStore().mode, 'encrypted');
  await h.save();
  const original = h.page.readSklandSyncStore();
  delete original.mode;
  h.page.writeSklandSyncStore(original);
  const existing = createSavedSklandPage(h.sharedStorage);
  assert.strictEqual(existing.page.readSklandSyncStore().mode, 'encrypted');
  assert(existing.page.isSklandSyncEnabled());
  assert(!existing.page.canUseSklandSavedCredentials());
  for (const invalid of [{ mode: 'plaintext' }, { mode: 'plaintext', plaintextConsentVersion: 999 }, { mode: 'unknown' }]) {
    h.page.writeSklandSyncStore({ consentVersion: 2, autoRefresh: true, accounts: {
      1: { credential: 'first-test-credential', uid: '111' }
    }, ...invalid });
    assert(!h.page.isSklandSyncEnabled());
    await h.page.refreshSavedSklandAccounts(true);
    assert.strictEqual(h.requests.length, 0);
  }
});

test('Skland explicit plaintext mode works without crypto, persists across pages, stays out of backups and clears on disable', async () => {
  const h = createSavedSklandPage();
  h.page.crypto = {};
  await h.save('plaintext');
  const store = h.page.readSklandSyncStore();
  assert.strictEqual(store.mode, 'plaintext');
  assert.strictEqual(store.plaintextConsentVersion, 1);
  assert.strictEqual(store.vault, null);
  assert.strictEqual(store.accounts[1].sealedCredential, undefined);
  assert.strictEqual(store.accounts[1].credential, 'first-test-credential');
  assert(h.page.canUseSklandSavedCredentials());
  assert(!h.page.isSklandVaultUnlocked());
  await assert.rejects(h.page.unlockSklandVault(passphrase), /口令加密保存/);
  assert(!/credential|token|prts_plus_skland_sync|plaintextConsentVersion/.test(JSON.stringify(h.page.buildAccountsBackup())));
  assert(!h.sharedStorage.get('prts_plus_accounts_data').includes('credential'));
  await assert.rejects(h.page.saveSklandCredentialForAccount({ accountId: 1, uid: '111' }, 'bad\r\ncredential'), /格式/);
  const reload = createSavedSklandPage(h.sharedStorage);
  await reload.page.refreshSavedSklandAccounts(true);
  assert.strictEqual(reload.requests.length, 4);
  await reload.page.setSklandSyncEnabled(false);
  assert(!reload.page.canUseSklandSavedCredentials());
  assert.strictEqual(reload.page.readSklandSyncStore().mode, 'encrypted');
  assert(!h.sharedStorage.get('prts_plus_skland_sync').includes('credential'));
  assert.strictEqual(reload.page.getCurrentAccountState().accountsTraining[1]['阿米娅'].level, 80);
});

test('Skland modes migrate all credentials atomically while preserving roles, timestamps, preferences and operator data', async () => {
  const h = createSavedSklandPage();
  await h.save();
  const source = h.page.readSklandSyncStore();
  source.autoRefresh = false;
  source.accounts[1].lastSuccessAt = 123;
  source.accounts[1].lastAttemptAt = 456;
  source.accounts[2].status = 'expired';
  h.page.writeSklandSyncStore(source);
  const accountState = h.sharedStorage.get('prts_plus_accounts_data');
  await h.page.setSklandSyncEnabled(true, null, 'plaintext');
  assert(!h.page.isSklandVaultUnlocked());
  assert(h.sharedStorage.get('prts_plus_skland_sync').includes('first-test-credential'));
  await h.page.setSklandSyncEnabled(true, passphrase, 'encrypted');
  const result = h.page.readSklandSyncStore();
  assert.strictEqual(result.mode, 'encrypted');
  assert.strictEqual(result.autoRefresh, false);
  assert.strictEqual(result.plaintextConsentVersion, undefined);
  assert.strictEqual(result.accounts[1].lastSuccessAt, 123);
  assert.strictEqual(result.accounts[1].lastAttemptAt, 456);
  assert.strictEqual(result.accounts[2].status, 'expired');
  for (const id of [1, 2]) {
    assert.strictEqual(result.accounts[id].uid, `${id}11`);
    assert.strictEqual(result.accounts[id].credential, undefined);
    assert.strictEqual(await h.page.decryptSklandCredential(id, result.accounts[id]), id === 1 ? 'first-test-credential' : 'second-test-credential');
  }
  assert(!h.sharedStorage.get('prts_plus_skland_sync').includes('test-credential'));
  assert.strictEqual(h.sharedStorage.get('prts_plus_accounts_data'), accountState);
});

test('Skland mode switching preserves the original store on a locked vault, wrong password, tampering or write failure', async () => {
  const h = createSavedSklandPage();
  await h.save();
  const original = h.sharedStorage.get('prts_plus_skland_sync');
  h.page.lockSklandVault();
  await assert.rejects(h.page.setSklandSyncEnabled(true, null, 'plaintext'), /请先解锁/);
  await assert.rejects(h.page.unlockSklandVault('wrong-test-passphrase'));
  assert.strictEqual(h.sharedStorage.get('prts_plus_skland_sync'), original);
  await h.page.unlockSklandVault(passphrase);
  const tampered = h.page.readSklandSyncStore();
  tampered.accounts[2].sealedCredential.ciphertext = '00'.repeat(32);
  h.page.writeSklandSyncStore(tampered);
  const corrupted = h.sharedStorage.get('prts_plus_skland_sync');
  await assert.rejects(h.page.setSklandSyncEnabled(true, null, 'plaintext'), /加密数据已损坏/);
  assert.strictEqual(h.sharedStorage.get('prts_plus_skland_sync'), corrupted, 'no partial plaintext migration');
  h.sharedStorage.set('prts_plus_skland_sync', original);
  const write = h.page.GM_setValue;
  h.page.GM_setValue = () => { throw new Error('storage failed'); };
  await assert.rejects(h.page.setSklandSyncEnabled(true, null, 'plaintext'), /storage failed/);
  assert.strictEqual(h.sharedStorage.get('prts_plus_skland_sync'), original);
  assert(h.page.isSklandVaultUnlocked());
  h.page.GM_setValue = write;
  await h.page.setSklandSyncEnabled(true, null, 'plaintext');
  const plaintext = h.sharedStorage.get('prts_plus_skland_sync');
  h.page.GM_setValue = () => { throw new Error('storage failed'); };
  await assert.rejects(h.page.setSklandSyncEnabled(true, passphrase), /storage failed/);
  assert.strictEqual(h.sharedStorage.get('prts_plus_skland_sync'), plaintext);
  assert(h.page.canUseSklandSavedCredentials());
  assert(!h.page.isSklandVaultUnlocked());
});

test('Skland legacy plaintext stays paused until explicitly choosing a supported mode', async () => {
  const h = createSavedSklandPage();
  h.sharedStorage.set('prts_plus_skland_sync', JSON.stringify({ consentVersion: 1, autoRefresh: false, accounts: {
    1: { credential: 'first-test-credential', uid: '111', lastSuccessAt: 123 }
  } }));
  assert.strictEqual(h.page.readSklandSyncStore().mode, 'encrypted');
  assert(!h.page.canUseSklandSavedCredentials());
  await h.page.refreshSavedSklandAccounts(true);
  assert.strictEqual(h.requests.length, 0);
  await h.page.setSklandSyncEnabled(true, null, 'plaintext');
  assert(h.page.canUseSklandSavedCredentials());
  assert.strictEqual(h.page.readSklandSyncStore().accounts[1].lastSuccessAt, 123);
  assert.strictEqual(h.page.readSklandSyncStore().autoRefresh, false);
});

test('Skland mode changes during a request stop further requests and operator commits', async () => {
  for (const mode of ['encrypted', 'plaintext']) {
    const h = createSavedSklandPage();
    await h.save(mode);
    const before = h.sharedStorage.get('prts_plus_accounts_data');
    let release;
    h.page.refreshSklandToken = async credential => {
      if (release) {
        h.requests.push(['unexpected-auth', credential]);
        return { token: 'temporary', timestamp: '1' };
      }
      return new Promise(resolve => { release = resolve; });
    };
    const pending = h.page.refreshSavedSklandAccounts();
    while (!release) await new Promise(resolve => setImmediate(resolve));
    await h.page.setSklandSyncEnabled(true, passphrase, mode === 'encrypted' ? 'plaintext' : 'encrypted');
    const converted = h.sharedStorage.get('prts_plus_skland_sync');
    release({ token: 'temporary', timestamp: '1' });
    await pending;
    assert.strictEqual(h.requests.length, 0);
    assert.strictEqual(h.sharedStorage.get('prts_plus_accounts_data'), before);
    assert.strictEqual(h.sharedStorage.get('prts_plus_skland_sync'), converted);
  }
});

test('Skland transport only uses the userscript channel and never exposes raw errors', async () => {
  for (const hostname of ['prts.plus', 'www.skland.com']) {
    const page = createAccountPage(new Map(), hostname);
    page.fetch = () => { throw new Error('page fetch must never receive credentials'); };
    let request;
    page.GM_xmlhttpRequest = options => {
      request = options;
      options.onload({ status: 200, response: { code: 0 } });
    };
    await page.sklandRequestJson('https://zonai.skland.com/api/v1/auth/refresh', { headers: { cred: 'first-test-credential' } });
    assert.strictEqual(request.anonymous, true);
    assert.strictEqual(request.headers.cred, 'first-test-credential');
    delete page.GM_xmlhttpRequest;
    await assert.rejects(page.sklandRequestJson('https://zonai.skland.com/api/v1/auth/refresh', {}), /油猴网络接口不可用/);
    assert(!page.getSklandImportErrorMessage(new Error('secret first-test-credential')).includes('test-credential'));
    assert.strictEqual(page.maskSklandUid('123456789'), '12••••89');
    assert.strictEqual(page.maskSklandUid('123'), '••••');
  }
});
};
