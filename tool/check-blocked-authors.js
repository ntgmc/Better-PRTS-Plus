// Run with an existing Playwright installation; see docs/development.md.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const output = process.env.PRTS_REVIEW_OUTPUT || fs.mkdtempSync(path.join(os.tmpdir(), 'prts-blacklist-review-'));
const script = fs.readFileSync(path.join(root, 'Better-PRTS-Plus.user.js'), 'utf8');
const resources = JSON.parse(fs.readFileSync(path.join(root, 'resources/data.json'), 'utf8'));
const version = script.match(/^\/\/\s*@version\s+(\S+)/m)[1];
const report = { screenshots: [], checks: [], errors: [] };
const sidebarSelector = '.docs-content-wrapper > .flex > div:nth-child(2)';

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
  let activePage;
  try {
    for (const theme of ['light', 'dark', 'high-contrast']) {
      console.log(`${theme}: blacklist actions and persistence`);
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN', acceptDownloads: true });
      await context.addInitScript(({ theme, resources, version, script }) => {
        localStorage.setItem('theme', JSON.stringify(theme));
        localStorage.setItem('zoot-plus-lang', JSON.stringify('cn'));
        localStorage.setItem('zoot-plus-last-noticed', String(Date.now()));
        window.GM_getValue = (key, fallback) => {
          if (key === 'prts_plus_resources_v1') return JSON.stringify({ checkedAt: Date.now(), data: resources });
          return sessionStorage.getItem(key) ?? (key === 'prts_plus_settings'
            ? JSON.stringify({ activityShortcuts: false, autoLoadMore: false, markFollowedAuthors: false }) : fallback);
        };
        window.GM_setValue = (key, value) => {
          if (window.failBlacklistSave && key === 'prts_plus_settings') throw new Error('Review storage failure');
          sessionStorage.setItem(key, value);
        };
        window.GM_addStyle = css => { const style = document.createElement('style'); style.textContent = css; (document.head || document.documentElement).append(style); };
        window.GM_addValueChangeListener = () => 0;
        window.GM_removeValueChangeListener = () => {};
        window.GM_info = { script: { version } };
        window.GM_xmlhttpRequest = options => {
          queueMicrotask(() => options.onerror?.({ error: 'Offline resource check in browser review' }));
          return { abort() {} };
        };
        document.addEventListener('DOMContentLoaded', () => eval(script), { once: true });
      }, { theme, resources, version, script });
      const page = await context.newPage();
      activePage = page;
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(45000);
      page.on('pageerror', error => report.errors.push({ theme, message: error.message }));
      await page.route('**/*', route => {
        const request = route.request(), url = new URL(request.url());
        const publicSetQuery = request.method() === 'POST' && url.hostname === 'prts.maa.plus' && url.pathname === '/set/query';
        if ((!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !publicSetQuery) || /googletagmanager|google-analytics/.test(url.hostname)) return route.abort();
        return route.continue();
      });
      const operation = 'ul > li > .bp6-card:has(.bp6-icon-user + a)';
      const authorLink = '.bp6-icon-user + a';
      const openCategory = async id => {
        if (await page.locator('.prts-float-btn').getAttribute('aria-expanded') === 'false') await page.locator('.prts-float-btn').click();
        const entry = page.locator(`#prts-settings-${id}-button`);
        if (await entry.getAttribute('aria-expanded') === 'true') return;
        if (await page.locator('.prts-submenu-panel.is-open').count()) await page.keyboard.press('Escape');
        await entry.click();
      };
      const openBlacklist = () => openCategory('blacklist');
      const closeSettings = async () => {
        const route = page.url();
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
        await page.locator('#prts-settings-panel').waitFor({ state: 'hidden' });
        assert.equal(page.url(), route, 'closing settings preserves the underlying drawer and route');
      };
      const savedUsers = () => page.evaluate(() => JSON.parse(GM_getValue('prts_plus_settings')).blockedUsers);
      const assertAuthorHidden = async (id, expected) => {
        await page.waitForFunction(({ id, expected, operation }) => {
          const cards = [...document.querySelectorAll(operation)].filter(card => card.querySelector('.bp6-icon-user + a')?.getAttribute('href') === `/profile/${id}`);
          return cards.length && cards.every(card => (getComputedStyle(card.parentElement).display === 'none') === expected);
        }, { id, expected, operation });
      };
      await page.goto('https://prts.plus/', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(operation);
      assert.equal(await page.locator('.prts-block-user').count(), 0, 'default off preserves original UI');
      await openBlacklist();
      const toggle = page.getByRole('checkbox', { name: '启用用户黑名单', exact: true });
      assert.equal(await toggle.isChecked(), false);
      await toggle.focus();
      await page.keyboard.press('Space');
      await closeSettings();
      await page.getByRole('button', { name: '最新', exact: true }).click();
      await page.waitForFunction(() => new Set([...document.querySelectorAll('ul.grid > li .bp6-icon-user + a')].map(a => a.getAttribute('href'))).size > 1);
      const first = page.locator(operation).first();
      const id = (await first.locator(authorLink).getAttribute('href')).split('/').pop();
      const name = await first.locator(authorLink).textContent();
      assert.equal(await page.locator('.prts-block-user').count(), 0, 'enabled feature adds no card shortcuts');
      const profileResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/user/info');
      await first.locator(authorLink).click();
      const { data: user } = await (await profileResponse).json();
      await page.waitForSelector('#prts-profile-block-controls button');
      await checkProfileLayout(page, theme, openCategory, closeSettings);
      let following = false, followWrites = 0;
      await page.route('https://prts.maa.plus/**', async route => {
        const request = route.request(), url = new URL(request.url());
        if (url.pathname === '/user/info') {
          const response = await route.fetch({ headers: { ...request.headers(), authorization: '' } });
          const result = await response.json();
          if (String(result.data?.id) === id) result.data = { ...result.data, relation: following ? 'FOLLOWING' : 'NONE', fans_count: user.fans_count + Number(following) };
          return route.fulfill({ json: result });
        }
        if (url.pathname === '/user/me') return route.fulfill({ json: { status_code: 200, data: { id: '999999999', user_name: '验证账号', activated: true } } });
        if (request.method() === 'POST' && [`/follow/follow/${id}`, `/follow/unfollow/${id}`].includes(url.pathname)) {
          following = url.pathname.includes('/follow/follow/');
          followWrites++;
          return route.fulfill({ json: { status_code: 200, data: null } });
        }
        const publicSetQuery = request.method() === 'POST' && url.pathname === '/set/query';
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !publicSetQuery) return route.abort();
        const headers = { ...request.headers() };
        delete headers.authorization;
        return route.continue({ headers });
      });
      await page.evaluate(() => sessionStorage.setItem('reviewFollowControls', 'true'));
      await page.addInitScript(() => {
        if (sessionStorage.getItem('reviewFollowControls')) localStorage.setItem('zoot-plus-auth', JSON.stringify({ token: 'browser-review-fixture', validBefore: '2099-01-01T00:00:00Z', userId: '999999999', username: '验证账号', activated: true }));
        else localStorage.removeItem('zoot-plus-auth');
      });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#prts-profile-block-controls button');
      const userCard = page.locator('#prts-profile-block-controls').locator('..');
      await userCard.getByRole('button', { name: '关注', exact: true }).click();
      await userCard.getByRole('button', { name: '已关注', exact: true }).waitFor();
      await checkProfileLayout(page, `${theme}-following`, openCategory, closeSettings);
      await userCard.getByRole('button', { name: '已关注', exact: true }).focus();
      await page.keyboard.press('Enter');
      await userCard.getByRole('button', { name: '关注', exact: true }).waitFor();
      assert.equal(followWrites, 2, 'original follow and unfollow controls still work');
      await page.locator('#prts-profile-block-controls button').focus();
      await page.keyboard.press('Enter');
      await assertAuthorHidden(id, true);
      assert.equal(await page.locator('#prts-profile-block-controls button').evaluate(e => e === document.activeElement), true, 'profile action preserves keyboard focus');
      assert.equal((await savedUsers())[0].id, id);
      await capture(page, theme, 'profile-blocked-compact-320', 320, `${sidebarSelector} .bp6-card:first-child`);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.evaluate(() => { sessionStorage.removeItem('reviewFollowControls'); localStorage.removeItem('zoot-plus-auth'); });
      await page.goto('https://prts.plus/', { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: '最新', exact: true }).click();
      await assertAuthorHidden(id, true);
      assert(await page.locator(`${operation}:visible`).count(), 'other authors remain visible');
      await page.locator('#btn-setting').click();
      await assertAuthorHidden(id, true);
      await page.locator('#btn-setting').click();
      await page.getByRole('button', { name: '加载更多', exact: true }).click();
      await page.waitForFunction(() => document.querySelectorAll('ul.grid > li').length > 10);
      await assertAuthorHidden(id, true);
      await openBlacklist();
      assert.equal(await page.locator('.prts-blacklist-user').first().getAttribute('href'), `/profile/${id}?prts_blacklist=${id}`);
      assert((await page.locator('.prts-blacklist-user').first().textContent()).includes(name));
      for (const width of [1440, 375, 320]) await capture(page, theme, `list-${width}`, width, '#prts-blacklist-panel');
      await page.setViewportSize({ width: 1440, height: 1000 });
      await toggle.focus();
      await page.keyboard.press('Space');
      await assertAuthorHidden(id, false);
      assert.equal((await savedUsers()).length, 1, 'disabling preserves users');
      await toggle.focus();
      await page.keyboard.press('Space');
      await assertAuthorHidden(id, true);
      await page.locator('.prts-blacklist-user').first().click();
      await page.waitForURL(`**/profile/${id}?prts_blacklist=${id}`);
      await page.waitForSelector('#prts-profile-block-controls');
      await assertAuthorHidden(id, false);
      assert((await page.locator('#prts-profile-block-controls').textContent()).includes('正在查看'));
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#prts-profile-block-controls');
      await assertAuthorHidden(id, false);
      await capture(page, theme, 'profile-320', 320, `${sidebarSelector} .bp6-card:first-child`);
      await page.locator(`${operation}:visible`).first().click();
      await page.waitForSelector(`.bp6-drawer a[href="/profile/${id}"]`);
      assert.equal(await page.locator('.prts-blocked-detail-notice').count(), 0, 'blacklist profile can open the operation');
      const operationId = new URL(page.url()).searchParams.get('op');
      assert(operationId);
      await capture(page, theme, 'profile-detail-320', 320, '.bp6-drawer');
      await page.goto(`https://prts.plus/profile/${id}?op=${operationId}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.prts-blocked-detail-notice');
      assert.equal(await page.locator('.bp6-drawer > section').isVisible(), false, 'direct operation links hide blocked content and download controls');
      await capture(page, theme, 'direct-detail-hidden-320', 320, '.bp6-drawer');
      await openBlacklist();
      await toggle.locator('..').click();
      await page.locator('.prts-blocked-detail-notice').waitFor({ state: 'hidden' });
      assert(await page.locator('.bp6-drawer > section').isVisible(), 'disabling restores the original operation');
      await toggle.locator('..').click();
      assert(await toggle.isChecked(), 'reenabling inside the operation drawer persists');
      await page.locator('.prts-blocked-detail-notice').waitFor();
      await closeSettings();
      await page.getByRole('link', { name: '返回列表', exact: true }).click();
      await page.waitForURL(`**/profile/${id}`);
      await page.waitForSelector('.bp6-drawer', { state: 'hidden' });
      await page.waitForSelector('#prts-profile-block-controls');
      await assertAuthorHidden(id, true);
      await capture(page, theme, 'profile-hidden-320', 320, `${sidebarSelector} .bp6-card:first-child`);
      await page.locator('#prts-profile-block-controls button').click();
      await assertAuthorHidden(id, false);
      assert.equal((await savedUsers()).length, 0);
      await page.locator('#prts-profile-block-controls button').click();
      await assertAuthorHidden(id, true);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await openBlacklist();
      // Verify export/import through the real settings UI.
      await openCategory('accounts');
      const downloadEvent = page.waitForEvent('download');
      await page.getByRole('button', { name: '导出全部配置', exact: true }).click();
      const download = await downloadEvent;
      const backupPath = path.join(output, `${theme}-backup.json`);
      await download.saveAs(backupPath);
      const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      assert.equal(backup.preferences.config.blockedUsers[0].id, id);
      await openBlacklist();
      await page.evaluate(() => { window.failBlacklistSave = true; });
      await page.locator('#prts-blacklist-list button').first().click();
      assert.equal((await savedUsers()).length, 1);
      await page.getByText('黑名单保存失败', { exact: true }).waitFor();
      await page.evaluate(() => { window.failBlacklistSave = false; });
      await page.locator('#prts-blacklist-list button').first().focus();
      await page.keyboard.press('Enter');
      assert.equal((await savedUsers()).length, 0);
      assert.equal(await page.locator('#prts-blacklist-close').evaluate(e => e === document.activeElement), true);
      await capture(page, theme, 'empty-320', 320, '#prts-blacklist-panel');
      await openCategory('accounts');
      const chooserEvent = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: '导入全部配置', exact: true }).click();
      await (await chooserEvent).setFiles(backupPath);
      await page.getByRole('button', { name: '确认导入', exact: true }).click();
      await page.getByText('全部配置导入成功', { exact: true }).waitFor();
      await assertAuthorHidden(id, true);
      await openBlacklist();
      assert.equal((await savedUsers())[0].id, id);
      report.checks.push(`${theme}: profile user card and original follow controls, sidebar collapse/restore, no card shortcuts, keyboard blocking, author IDs, appended cards, both display modes, immediate disable/enable, profile entry and reload, matching profile details, direct detail links hidden, ordinary profile hidden, export/import, save failure and focus recovery`);

      console.log(`${theme}: set members and narrow layouts`);
      await closeSettings();
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto('https://prts.plus/', { waitUntil: 'domcontentloaded' });
      await page.getByRole('tab', { name: '作业集', exact: true }).click();
      const setSelector = '.bp6-card.bp6-interactive:has(.bp6-icon-document):has(.bp6-icon-user + a)';
      await page.waitForSelector(`${setSelector}:visible`);
      await page.locator(`${setSelector}:visible`).first().click();
      const member = '.bp6-drawer ul > li > .bp6-card';
      await page.waitForSelector(`${member}:visible`);
      const memberId = (await page.locator(`${member}:visible ${authorLink}`).first().getAttribute('href')).split('/').pop();
      const setUrl = page.url();
      assert.equal(await page.locator('.prts-block-user').count(), 0, 'set members have no block shortcuts');
      await page.goto(`https://prts.plus/profile/${memberId}`, { waitUntil: 'domcontentloaded' });
      await page.locator('#prts-profile-block-controls button').click();
      await page.goto(setUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.bp6-drawer');
      await page.waitForFunction(({ member, memberId }) => {
        const cards = [...document.querySelectorAll(member)].filter(card => card.querySelector('.bp6-icon-user + a')?.getAttribute('href') === `/profile/${memberId}`);
        return cards.length && cards.every(card => getComputedStyle(card.parentElement).display === 'none');
      }, { member, memberId });
      await page.locator('.bp6-drawer').focus();
      await page.keyboard.press('Escape');
      await page.waitForSelector('.bp6-drawer', { state: 'hidden' });
      await page.getByRole('tab', { name: '作业集', exact: true }).click();
      await page.locator(setSelector).first().waitFor({ state: 'attached' });
      const set = page.locator(setSelector).first();
      const creatorId = (await set.locator(authorLink).getAttribute('href')).split('/').pop();
      await page.goto(`https://prts.plus/profile/${creatorId}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#prts-profile-block-controls button');
      const creatorBlock = page.locator('#prts-profile-block-controls button');
      if ((await creatorBlock.textContent()).includes('拉黑此用户')) await creatorBlock.click();
      await page.goto('https://prts.plus/', { waitUntil: 'domcontentloaded' });
      await page.getByRole('tab', { name: '作业集', exact: true }).click();
      await page.waitForFunction(({ setSelector, creatorId }) => [...document.querySelectorAll(setSelector)].filter(card => card.querySelector('.bp6-icon-user + a')?.getAttribute('href') === `/profile/${creatorId}`).every(card => getComputedStyle(card).display === 'none'), { setSelector, creatorId });
      await page.locator('button:has(.bp6-icon-list)').click();
      await page.waitForFunction(({ setSelector, creatorId }) => {
        const cards = [...document.querySelectorAll(setSelector)].filter(card => card.querySelector('.bp6-icon-user + a')?.getAttribute('href') === `/profile/${creatorId}`);
        return cards.length && cards.every(card => getComputedStyle(card).display === 'none');
      }, { setSelector, creatorId });
      await openBlacklist();
      for (const width of [1440, 320]) await capture(page, theme, `sets-${width}`, width, '#prts-blacklist-panel');
      await closeSettings();
      await page.goto('https://prts.plus/create', { waitUntil: 'domcontentloaded' });
      assert.equal(await page.locator('.prts-block-user, #prts-profile-block-controls, .prts-blocked-content').count(), 0);
      report.checks.push(`${theme}: profile-only blocking hides set creators and their own member author IDs, set grid/list cleanup, narrow blacklist, create page exclusion`);
      // A long saved name tests the same backup input boundary used by users.
      backup.preferences.config.blockedUsers[0].name = '验证很长的用户名LongNameWithoutSpaces'.repeat(4);
      const longBackup = path.join(output, `${theme}-long-backup.json`);
      fs.writeFileSync(longBackup, JSON.stringify(backup));
      await openBlacklist();
      await openCategory('accounts');
      const longChooser = page.waitForEvent('filechooser');
      await page.getByRole('button', { name: '导入全部配置', exact: true }).click();
      await (await longChooser).setFiles(longBackup);
      await page.getByRole('button', { name: '确认导入', exact: true }).click();
      await page.getByText('全部配置导入成功', { exact: true }).waitFor();
      await openBlacklist();
      await capture(page, theme, 'long-name-320', 320, '#prts-blacklist-panel');
      await context.close();
    }
    assert.deepEqual(report.errors, []);
    report.passed = true;
  } catch (error) {
    report.failure = error.message;
    if (activePage && !activePage.isClosed()) {
      report.state = await activePage.evaluate(() => ({
        url: location.href, enabled: JSON.parse(GM_getValue('prts_plus_settings')).blockUsers,
        focused: document.activeElement?.outerHTML.slice(0, 1000),
        drawerAuthors: [...document.querySelectorAll('.bp6-drawer a[href^="/profile/"]')].map(a => a.getAttribute('href'))
      }));
      await activePage.screenshot({ path: path.join(output, 'failure.png') });
    }
    throw error;
  } finally {
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    await browser.close();
    console.log(`Blacklist review: ${output}`);
  }
}

async function checkProfileLayout(page, theme, openCategory, closeSettings) {
  const card = page.locator(`${sidebarSelector} .bp6-card`).first();
  await card.evaluate(e => { window.originalProfileNodes = [...e.children].filter(node => node.id !== 'prts-profile-block-controls'); });
  for (const collapsed of [false, true]) {
    await openCategory('page');
    const toggle = page.getByRole('checkbox', { name: '折叠侧边栏', exact: true });
    if (await toggle.isChecked() !== collapsed) {
      await toggle.focus();
      await page.keyboard.press('Space');
    }
    await closeSettings();
    for (const width of theme.endsWith('-following') ? [1440, 768, 375, 320] : [1440, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert(await card.evaluate(e => window.originalProfileNodes.every(node => node.parentElement === e)), 'original profile and follow nodes remain mounted');
      assert(await page.locator('#prts-profile-block-controls').evaluate(e => e.parentElement.classList.contains('bp6-card')), 'profile action lives inside original user card');
      const boxes = await card.locator('button').evaluateAll(es => es.map(e => { const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; }));
      assert(boxes.every(r => r.left >= 0 && r.right <= width + 1), `${theme}: all profile actions fit ${width}px`);
      if (collapsed && boxes.length === 2) {
        assert(Math.abs(boxes[1].left - boxes[0].right - 16) <= 1, `follow and block buttons stay adjacent at ${width}px: ${JSON.stringify(boxes)}`);
        assert(Math.abs((boxes[0].top + boxes[0].bottom) - (boxes[1].top + boxes[1].bottom)) <= 2, 'follow and block buttons share a row');
        const cardBox = await card.boundingBox();
        assert(Math.abs(cardBox.x + cardBox.width - boxes[1].right - 17) <= 1, 'profile actions align with the right card padding');
      }
      if (collapsed && width === 1440) assert((await card.boundingBox()).height < 90, 'desktop user card remains compact');
      await capture(page, theme, `profile-${collapsed ? 'compact' : 'regular'}-${width}`, width, `${sidebarSelector} .bp6-card:first-child`);
    }
  }
  if (theme.endsWith('-following')) {
    const heading = card.locator('h4').first();
    await heading.evaluate(e => { window.originalHeadingNodes = [...e.childNodes]; e.textContent = '很长的用户名LongNameWithoutSpaces'.repeat(4); });
    assert(await heading.evaluate(e => e.scrollWidth <= e.clientWidth + 1), 'long profile names wrap beside the actions');
    await capture(page, theme, 'profile-long-name-320', 320, `${sidebarSelector} .bp6-card:first-child`);
    await heading.evaluate(e => e.replaceChildren(...window.originalHeadingNodes));
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}

async function capture(page, theme, name, width, selector) {
  await page.setViewportSize({ width, height: 1000 });
  const target = page.locator(selector);
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  assert(await target.evaluate(e => { const r = e.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; }), `${name}: component fits viewport`);
  if (selector.includes('blacklist')) assert(await target.evaluate(e => e.scrollWidth <= e.clientWidth + 1), `${name}: no internal horizontal overflow`);
  const filename = `${theme}-${name}.png`;
  await page.screenshot({ path: path.join(output, filename) });
  report.screenshots.push(filename);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
