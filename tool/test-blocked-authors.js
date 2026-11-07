module.exports = ({ assert, test, normalizeConfig, CONFIG_KEY, createAccountPage, createFollowedAuthorsHarness, createTestElement, hostObject }) => {
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
    page.setAuthorBlocked('22', '同名作者', true);
    for (const item of [blocked, ordinary, set]) {
      assert.strictEqual(item.inner.children.length, 1, 'author rows retain only their original content');
    }
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
    assert.strictEqual(page.__testExports.CONFIG.blockedUsers.length, 1, 'turning off preserves the list');
    page.__testExports.CONFIG.blockUsers = true;
    page.syncBlockedAuthors();
    assert(set.inner.classList.contains('prts-blocked-content'));
    page.setAuthorBlocked('22', '', false);
    page.applyFilterLogic();
    for (const node of [blocked.card, added.card, set.inner]) assert(!node.classList.contains('prts-blocked-content'));
  });

  test('profile controls stay inside the original user card, preserve follow controls and clean up immediately', () => {
    for (const blueprint of ['bp4', 'bp6']) {
      const h = setup(), { page } = h;
      const layout = createTestElement();
      const main = createTestElement(), sidebar = createTestElement();
      const profileCard = createTestElement();
      profileCard.className = `${blueprint}-card`;
      const heading = createTestElement('h4', '作者');
      const follow = createTestElement('button', '已关注');
      heading.closest = () => profileCard;
      profileCard.appendChild(heading);
      profileCard.appendChild(follow);
      sidebar.appendChild(profileCard);
      layout.appendChild(main);
      layout.appendChild(sidebar);
      h.body.appendChild(layout);
      sidebar.querySelector = () => heading;
      const query = page.document.querySelector;
      page.document.querySelector = selector => selector === '.docs-content-wrapper > .flex' ? layout
        : selector === '#prts-profile-block-controls button' ? page.document.getElementById('prts-profile-block-controls')?.querySelector('button') : query(selector);
      page.window.location.pathname = '/profile/22';
      page.syncBlockedProfileControls();
      const controls = page.document.getElementById('prts-profile-block-controls');
      assert.strictEqual(controls.parentElement, profileCard);
      assert.strictEqual(main.children.length, 0, 'no separate row above the operation list');
      const button = controls.querySelector('button');
      assert.strictEqual(button.className, `${blueprint}-button ${blueprint}-fill ${blueprint}-minimal`);
      assert(button.textContent.includes('拉黑此用户'));
      page.syncBlockedProfileControls();
      assert.strictEqual(controls.querySelector('button'), button, 'routine sync preserves keyboard focus');
      button.closest = () => controls;
      button.focus();
      button._prtsClickHandler();
      assert.strictEqual(page.isBlockedAuthorHidden('22'), true);
      assert.strictEqual(page.document.activeElement, controls.querySelector('button'));
      assert(controls.textContent.includes('解除拉黑'));
      assert(controls.textContent.includes('已拉黑该用户'));
      assert.deepStrictEqual(profileCard.children.slice(0, 2), [heading, follow], 'original follow nodes remain mounted');
      page.window.location.search = '?prts_blacklist=22';
      page.syncBlockedProfileControls();
      assert(controls.textContent.includes('正在查看'));
      page.__testExports.CONFIG.blockUsers = false;
      page.syncBlockedAuthors();
      assert.strictEqual(page.document.getElementById('prts-profile-block-controls'), null);
      assert.deepStrictEqual(profileCard.children, [heading, follow]);
      page.__testExports.CONFIG.blockUsers = true;
      page.syncBlockedAuthors();
      assert.strictEqual(page.document.getElementById('prts-profile-block-controls').parentElement, profileCard);
      page.window.location.pathname = '/';
      page.syncBlockedProfileControls();
      assert.strictEqual(page.document.getElementById('prts-profile-block-controls'), null);
    }
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
