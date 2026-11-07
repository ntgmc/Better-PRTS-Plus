module.exports = ({ assert, test, normalizeConfig, CONFIG_KEY, createAccountPage, createFollowedAuthorsHarness, hostObject }) => {
  const setup = () => {
    const h = createFollowedAuthorsHarness();
    h.page.__testExports.CONFIG.blockUsers = true;
    h.toasts = [];
    h.page.showPrtsToast = (...args) => h.toasts.push(args);
    return h;
  };

  test('blacklist defaults off and normalizes IDs, duplicate names and untrusted saved entries', () => {
    const defaults = normalizeConfig({});
    assert.strictEqual(defaults.blockUsers, false);
    assert.deepStrictEqual(hostObject(defaults.blockedUsers), []);
    const config = normalizeConfig({ blockUsers: true, blockedUsers: [
      { id: 22, name: ' 同名作者 ' }, { id: '33', name: '同名作者' }, { id: '22', name: '新名称' },
      { id: '44' }, { id: '0' }, { id: '../22' }, { id: -1 }, { id: Number.MAX_SAFE_INTEGER + 1 }, null
    ] });
    assert.deepStrictEqual(hostObject(config.blockedUsers), [
      { id: '22', name: '新名称' }, { id: '33', name: '同名作者' }, { id: '44', name: '用户 44' }
    ]);
    assert.deepStrictEqual(hostObject(normalizeConfig({ blockedUsers: {} }).blockedUsers), []);
  });

  test('blocking uses author IDs, hides new jobs and sets, survives display modes and restores immediately', () => {
    const h = setup(), { page } = h;
    const blocked = h.addAuthor('22'), ordinary = h.addAuthor('33'), set = h.addAuthor('22', true);
    page.syncBlockedAuthors();
    let stopped = 0;
    blocked.inner.querySelector('.prts-btn prts-block-user')._prtsClickHandler({ preventDefault() { stopped++; }, stopPropagation() { stopped++; } });
    assert.strictEqual(stopped, 2, 'blocking does not open the operation or navigate');
    const button = blocked.inner.querySelector('.prts-btn prts-block-user');
    for (const key of ['Enter', ' ']) button.onkeydown({ key, stopPropagation() { stopped++; } });
    assert.strictEqual(stopped, 4, 'keyboard activation does not reach the interactive card');
    page.applyFilterLogic();
    assert(blocked.card.classList.contains('prts-blocked-content'));
    assert(!ordinary.card.classList.contains('prts-blocked-content'), 'same name does not hide another ID');
    assert(set.inner.classList.contains('prts-blocked-content'));
    const added = h.addAuthor('22');
    for (const mode of ['GRAY', 'HIDE']) {
      page.__testExports.CONFIG.displayMode = mode;
      page.applyFilterLogic();
      assert(added.card.classList.contains('prts-blocked-content'));
      const stats = page.aggregateCardDiagnostics(h.cards);
      assert.strictEqual(stats.hiddenBlockedCards, 2);
      assert.strictEqual(stats.visibleCards, 1);
    }
    assert(page.document.getElementById('prts-filter-results').textContent.includes('已隐藏黑名单用户作业 2 份'));
    page.__testExports.CONFIG.blockUsers = false;
    page.syncBlockedAuthors();
    page.applyFilterLogic();
    for (const node of [blocked.card, added.card, set.inner]) assert(!node.classList.contains('prts-blocked-content'));
    assert.strictEqual(blocked.inner.querySelector('.prts-btn prts-block-user'), null);
    assert.strictEqual(page.__testExports.CONFIG.blockedUsers.length, 1, 'turning off preserves the list');
    page.__testExports.CONFIG.blockUsers = true;
    page.syncBlockedAuthors();
    assert(set.inner.classList.contains('prts-blocked-content'));
    page.setAuthorBlocked('22', '', false);
    page.applyFilterLogic();
    for (const node of [blocked.card, added.card, set.inner]) assert(!node.classList.contains('prts-blocked-content'));
  });

  test('only the matching blacklist profile link reveals a blocked author and leaving restores hiding', () => {
    const h = setup(), { page } = h;
    const author = h.addAuthor('22'), other = h.addAuthor('33');
    page.setAuthorBlocked('22', '作者', true);
    page.setAuthorBlocked('33', '其他作者', true);
    for (const [pathname, search, revealed] of [
      ['/profile/22', '', false], ['/profile/22', '?prts_blacklist=33', false],
      ['/profile/220', '?prts_blacklist=22', false], ['/', '?prts_blacklist=22', false],
      ['/profile/22', '?prts_blacklist=22', true], ['/profile/22/', '?prts_blacklist=22&opset=7', true],
      ['/', '', false], ['/profile/22', '', false]
    ]) {
      Object.assign(page.window.location, { pathname, search });
      page.processOperationCard(author.card);
      page.processOperationCard(other.card);
      assert.strictEqual(author.card.classList.contains('prts-blocked-content'), !revealed, pathname + search);
      assert(other.card.classList.contains('prts-blocked-content'), 'other blocked authors stay hidden inside sets');
    }
  });

  test('direct operation details hide blocked content and restore only for the matching profile or disabled setting', () => {
    const h = setup(), { page } = h;
    const drawer = h.addAuthor('22', true).inner;
    const author = drawer.querySelector('a');
    author.closest = () => null;
    drawer.querySelectorAll = () => [author];
    const queryAll = page.document.querySelectorAll;
    page.document.querySelectorAll = selector => selector === '.bp4-drawer, .bp6-drawer' ? [drawer] : queryAll(selector);
    page.setAuthorBlocked('22', '作者', true);
    assert(drawer.classList.contains('prts-blocked-detail'));
    assert(drawer.querySelector('.prts-blocked-detail-notice').textContent.includes('已被拉黑'));
    Object.assign(page.window.location, { pathname: '/profile/22', search: '?prts_blacklist=22&op=123' });
    page.syncBlockedOperationDetails();
    assert(!drawer.classList.contains('prts-blocked-detail'));
    assert.strictEqual(drawer.querySelector('.prts-blocked-detail-notice'), null);
    page.window.location.pathname = '/';
    page.syncBlockedOperationDetails();
    assert(drawer.classList.contains('prts-blocked-detail'));
    page.__testExports.CONFIG.blockUsers = false;
    page.syncBlockedOperationDetails();
    assert(!drawer.classList.contains('prts-blocked-detail'));
    assert.strictEqual(drawer.querySelector('.prts-blocked-detail-notice'), null);
  });

  test('blacklist keeps hiding authors when operation parsing fails and clears entries on editor pages', () => {
    const h = setup(), { page } = h;
    const author = h.addAuthor('22');
    page.setAuthorBlocked('22', '作者', true);
    author.card.classList.remove('prts-blocked-content');
    page.getOperationResolutionForCard = () => { throw new Error('invalid operation'); };
    const stats = page.processOperationCard(author.card);
    assert.strictEqual(stats.filterStatus, 'hiddenBlocked');
    assert.strictEqual(stats.visible, false);
    assert(author.card.classList.contains('prts-blocked-content'));
    page.isFilterDisabledPage = () => true;
    page.syncBlockedAuthors();
    assert(!author.card.classList.contains('prts-blocked-content'));
    assert.strictEqual(author.inner.querySelector('.prts-btn prts-block-user'), null);
  });

  test('blacklist persists across pages and backups, handles old backups and preserves state on write failure', () => {
    const h = setup(), { page } = h;
    page.setAuthorBlocked('22', '作者', true);
    const saved = page.GM_getValue(CONFIG_KEY);
    const reopened = createAccountPage(new Map([[CONFIG_KEY, saved]]), 'prts.plus');
    assert.strictEqual(reopened.__testExports.CONFIG.blockUsers, true);
    assert.strictEqual(reopened.isBlockedAuthorHidden('22'), true);
    const backup = page.parseAccountsBackup(page.buildAccountsBackup());
    assert.deepStrictEqual(hostObject(backup.preferences.config.blockedUsers), [{ id: '22', name: '作者' }]);
    page.__testExports.CONFIG.blockedUsers = [];
    page.refreshAccountStateUi = () => {};
    page.refreshSklandSyncControls = () => {};
    page.syncPageScaffold = () => {};
    page.document.querySelectorAll = () => [];
    page.applyAccountsBackup(backup);
    assert.strictEqual(page.isBlockedAuthorHidden('22'), true);
    const oldBackup = page.buildAccountsBackup();
    delete oldBackup.preferences.config.blockedUsers;
    delete oldBackup.preferences.config.blockUsers;
    page.applyAccountsBackup(page.parseAccountsBackup(oldBackup));
    assert.strictEqual(page.__testExports.CONFIG.blockUsers, false);
    assert.deepStrictEqual(hostObject(page.__testExports.CONFIG.blockedUsers), []);
    page.applyAccountsBackup(backup);
    const before = JSON.stringify(page.__testExports.CONFIG.blockedUsers);
    page.GM_setValue = () => { throw new Error('storage failure'); };
    page.setAuthorBlocked('22', '', false);
    assert.strictEqual(JSON.stringify(page.__testExports.CONFIG.blockedUsers), before);
    assert.strictEqual(page.isBlockedAuthorHidden('22'), true);
    assert.strictEqual(h.toasts.at(-1)[1], 'error');
  });
};
