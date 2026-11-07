// Run with an existing Playwright installation; see docs/development.md.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const output = process.env.PRTS_REVIEW_OUTPUT || fs.mkdtempSync(path.join(os.tmpdir(), 'prts-layout-review-'));
const script = fs.readFileSync(path.join(root, 'Better-PRTS-Plus.user.js'), 'utf8');
const resources = JSON.parse(fs.readFileSync(path.join(root, 'resources/data.json'), 'utf8'));
const version = script.match(/^\/\/\s*@version\s+(\S+)/m)[1];
const widths = [320, 375, 414, 768, 1024, 1440];
const themes = ['light', 'dark', 'high-contrast'];
const report = { layouts: [], visuals: [], interactions: [], errors: [] };

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
  });
  try {
    for (const theme of themes) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
      await context.addInitScript(({ theme, resources, version }) => {
        localStorage.setItem('theme', JSON.stringify(theme));
        localStorage.setItem('zoot-plus-lang', JSON.stringify('cn'));
        localStorage.setItem('zoot-plus-last-noticed', String(Date.now()));
        const store = {
          prts_plus_settings: JSON.stringify({ siteRedesign: true, activityShortcuts: false }),
          prts_plus_resources_v1: JSON.stringify({ checkedAt: Date.now(), data: resources }),
        };
        window.GM_getValue = (key, fallback) => sessionStorage.getItem(key) ?? store[key] ?? fallback;
        window.GM_setValue = (key, value) => { sessionStorage.setItem(key, value); };
        window.GM_addStyle = css => {
          const style = document.createElement('style');
          style.textContent = css;
          document.head.append(style);
        };
        window.GM_addValueChangeListener = () => 0;
        window.GM_removeValueChangeListener = () => {};
        window.GM_info = { script: { version } };
        window.GM_xmlhttpRequest = options => {
          queueMicrotask(() => options.onerror?.({ error: 'Offline update check in layout review' }));
          return { abort() {} };
        };
      }, { theme, resources, version });
      const page = await context.newPage();
      page.on('pageerror', error => report.errors.push({ theme, message: error.message }));
      await page.route('**/*', route => {
        const request = route.request();
        const publicSetQuery = request.method() === 'POST' && new URL(request.url()).pathname === '/set/query';
        return (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !publicSetQuery) || /googletagmanager|google-analytics/.test(request.url())
          ? route.abort() : route.continue();
      });
      if (process.env.PRTS_REVIEW_SCOPE === 'sidebar') {
        await checkProfileSidebar(page, theme);
        await context.close();
        continue;
      }
      console.log(`${theme}: index and original visual styles`);
      await page.goto('https://prts.plus/', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('ul.grid > li .bp6-card');
      await page.evaluate(script);
      await page.waitForSelector('body.prts-site-redesign');
      await page.waitForTimeout(300);
      for (const selector of ['body', '.bp6-navbar', '.bp6-navbar button:not(.bp6-minimal)', 'input[type="search"]', 'ul.grid > li .bp6-card', '.prts-account-select', '#btn-import', '.prts-float-btn']) {
        await checkVisuals(page, theme, selector);
      }
      await checkAutoLoadMore(page, theme, 'operations', 'ul.grid > li');
      await captureList(page, theme, 'index', 'ul.grid > li .bp6-card h4 > .whitespace-nowrap');
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.locator('input[type="search"]').fill('1-7');
      await page.waitForTimeout(700);
      assert.equal(await page.locator('input[type="search"]').inputValue(), '1-7');
      await page.locator('input[type="search"]').fill('');
      await page.waitForTimeout(700);
      await page.getByRole('tab', { name: '作业集', exact: true }).click();
      await page.waitForSelector('.grid > .bp6-card');
      await checkAutoLoadMore(page, theme, 'sets', '.grid > .bp6-card');
      await captureList(page, theme, 'sets', '.grid > .bp6-card > .flex:first-child h4');
      await page.getByRole('tab', { name: '作业', exact: true }).click();
      await page.waitForSelector('ul.grid > li .bp6-card');
      await page.setViewportSize({ width: 1440, height: 1000 });
      await checkAutoLoadMoreSetting(page, theme);

      console.log(`${theme}: import and settings height limits`);
      await page.locator('#btn-import').click();
      await page.waitForSelector('#prts-import-dialog');
      for (const selector of ['#prts-import-dialog', '.prts-import-textarea', '.prts-import-action', '.prts-import-action.primary']) await checkVisuals(page, theme, selector);
      await capturePanels(page, theme, 'import', '#prts-import-dialog');
      await page.keyboard.press('Escape');
      await page.waitForSelector('#prts-import-dialog', { state: 'hidden' });
      await page.locator('.prts-float-btn').click();
      await page.getByRole('button', { name: '页面增强', exact: true }).click();
      await checkVisuals(page, theme, '#prts-settings-panel');
      await checkVisuals(page, theme, '#prts-page-panel');
      await capturePanels(page, theme, 'settings', '.prts-settings-panel, .prts-submenu-panel.is-open');
      const toggle = page.getByRole('checkbox', { name: '全站样式优化', exact: true });
      await toggle.focus();
      await page.keyboard.press('Space');
      assert.equal(await page.locator('body').evaluate(e => e.classList.contains('prts-site-redesign')), false);
      await toggle.focus();
      await page.keyboard.press('Space');
      assert.equal(await page.locator('body').evaluate(e => e.classList.contains('prts-site-redesign')), true);
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: '账号与数据', exact: true }).click();
      await checkVisuals(page, theme, '.prts-account-row.is-active');
      await capturePanels(page, theme, 'accounts', '.prts-settings-panel, .prts-submenu-panel.is-open');
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      report.interactions.push(`${theme}: search, tabs, import cancellation, settings, accounts and immediate layout toggle`);
      await checkProfileSidebar(page, theme);
      await context.close();
    }
    assert.deepEqual(report.errors, [], 'no browser runtime errors');
    report.passed = true;
  } catch (error) {
    report.failure = error.message;
    throw error;
  } finally {
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    await browser.close();
    console.log(`Layout review: ${report.layouts.length} layouts, ${report.visuals.length} visual comparisons. Evidence: ${output}`);
  }
}

async function checkProfileSidebar(page, theme) {
  console.log(`${theme}: compact profile and original follow controls`);
  const profileUrl = 'https://prts.plus/profile/7661';
  const layoutSelector = '.docs-content-wrapper > .flex';
  const sidebarSelector = `${layoutSelector} > div:nth-child(2)`;
  const infoResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/user/info');
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });
  const { data: user } = await (await infoResponse).json();
  await page.waitForSelector(`${sidebarSelector} .bp6-card`);
  await page.evaluate(script);
  await page.waitForSelector('.prts-float-btn');
  const sidebar = page.locator(sidebarSelector);
  const originalWidth = (await sidebar.boundingBox()).width;
  await sidebar.evaluate(e => { window.reviewProfileNodes = [e, ...e.querySelectorAll('button')]; });
  const toggleSidebar = async (name = '折叠侧边栏') => {
    await page.locator('.prts-float-btn').click();
    await page.getByRole('button', { name: '页面增强', exact: true }).click();
    const toggle = page.getByRole('checkbox', { name, exact: true });
    await toggle.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.locator('#prts-settings-panel').waitFor({ state: 'hidden' });
  };
  await toggleSidebar();
  await page.waitForSelector('.prts-profile-compact-layout');
  assert(await sidebar.isVisible(), 'anonymous profile retains its login prompt and statistics');
  assert(await sidebar.evaluate(e => window.reviewProfileNodes.every(node => node === e || e.contains(node))));
  assert.equal(await page.evaluate(() => JSON.parse(GM_getValue('prts_plus_settings')).hideSidebar), true);
  await toggleSidebar();
  assert.equal((await sidebar.boundingBox()).width, originalWidth, 'disabling restores the original sidebar width');
  await toggleSidebar();

  let following = false, followWrites = 0, ownProfile = false;
  await page.route('https://prts.maa.plus/**', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === '/user/info') return route.fulfill({ json: { status_code: 200, data: {
      ...user, fans_count: user.fans_count + Number(following), relation: following ? 'FOLLOWING' : 'NONE'
    } } });
    if (url.pathname === '/user/me') return route.fulfill({ json: { status_code: 200, data: {
      id: ownProfile ? user.id : '999999999', user_name: '验证账号', activated: true
    } } });
    if (request.method() === 'POST' && [`/follow/follow/${user.id}`, `/follow/unfollow/${user.id}`].includes(url.pathname)) {
      following = url.pathname.includes('/follow/follow/');
      followWrites++;
      return route.fulfill({ json: { status_code: 200, data: null } });
    }
    if (url.pathname.startsWith('/follow/')) return route.fulfill({ json: { status_code: 200, data: { has_next: false, total: 0, page: 1, data: [] } } });
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && url.pathname !== '/set/query') return route.abort();
    const headers = { ...request.headers() };
    delete headers.authorization;
    return route.continue({ headers });
  });
  await page.addInitScript(userId => {
    localStorage.setItem('zoot-plus-auth', JSON.stringify({ token: 'browser-review-fixture', validBefore: '2099-01-01T00:00:00Z',
      userId: sessionStorage.getItem('reviewOwnProfile') ? userId : '999999999', username: '验证账号', activated: true }));
  }, user.id);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector(`${sidebarSelector} button.bp6-fill`);
  await page.evaluate(script);
  await page.waitForSelector('.prts-profile-compact-layout');
  const follow = sidebar.getByRole('button', { name: '关注', exact: true });
  await follow.focus();
  await page.keyboard.press('Enter');
  await sidebar.getByRole('button', { name: '已关注', exact: true }).waitFor();
  assert.equal(followWrites, 1, 'the original follow action is still wired');
  assert((await sidebar.textContent()).includes(String(user.fans_count + 1)), 'original statistics update after following');
  await sidebar.getByRole('button', { name: '已关注', exact: true }).click();
  await follow.waitFor();
  assert.equal(followWrites, 2, 'the original unfollow action is still wired');
  for (const width of [1440, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const boxes = await page.locator(`${sidebarSelector}, ${sidebarSelector} .bp6-card, ${sidebarSelector} button`).evaluateAll(es => es.map(e => {
      const r = e.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    }));
    assert(boxes.every(r => r.left >= 0 && r.right <= width + 1), 'profile information fits the viewport');
    const listBox = await page.locator(`${layoutSelector} > div:first-child`).boundingBox();
    assert(boxes[0].bottom <= listBox.y, 'profile information sits above the full-width list');
    assert.equal(Math.round(boxes[0].right - boxes[0].left), Math.round(listBox.width));
    if (width === 1440) assert(boxes[0].bottom - boxes[0].top < 90, 'the desktop header stays compact');
    report.layouts.push({ theme, name: 'profile-sidebar', width, boxes });
    await page.screenshot({ path: path.join(output, `${theme}-profile-${width}.png`) });
  }
  await page.setViewportSize({ width: 320, height: 1000 });
  await toggleSidebar('全站样式优化');
  assert.equal(await page.locator('body.prts-site-redesign').count(), 0);
  assert(await sidebar.evaluate(e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }), 'compact profile works independently of site redesign');
  await page.screenshot({ path: path.join(output, `${theme}-profile-original-style-320.png`) });
  await toggleSidebar('全站样式优化');
  const heading = sidebar.locator('h4').first();
  await heading.evaluate(e => { e.textContent = '验证很长的用户名称LongUserNameWithoutSpaces'.repeat(3); });
  assert(await heading.evaluate(e => e.scrollWidth <= e.clientWidth + 1), 'long user names wrap');
  await page.screenshot({ path: path.join(output, `${theme}-profile-long-name-320.png`) });
  ownProfile = true;
  await page.evaluate(() => sessionStorage.setItem('reviewOwnProfile', 'true'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector(`${sidebarSelector} .bp6-card`);
  await page.evaluate(script);
  await page.waitForSelector('.prts-profile-compact-layout');
  assert.equal(await sidebar.locator('button.bp6-fill').count(), 0, 'own profile retains its original controls');
  const fans = sidebar.getByRole('button', { name: /粉丝/ });
  assert(await fans.isEnabled(), 'own follow lists remain available');
  await fans.click();
  await page.waitForSelector('.bp6-dialog');
  await page.keyboard.press('Escape');
  await page.waitForSelector('.bp6-dialog', { state: 'hidden' });
  await page.screenshot({ path: path.join(output, `${theme}-profile-own-320.png`) });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: '首页', exact: true }).click();
  await page.waitForSelector('.prts-sidebar-hidden-layout');
  assert.equal(await page.locator('.prts-profile-compact-layout').count(), 0);
  assert.equal(await sidebar.isVisible(), false, 'ordinary pages still collapse the sidebar');
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.prts-profile-compact-layout');
  await toggleSidebar();
  assert.equal(await page.locator('.prts-profile-compact-layout').count(), 0);
  report.interactions.push(`${theme}: anonymous and own profiles, keyboard toggle, original nodes, save and reopen, follow/unfollow and live statistics, own fan list, independent site redesign toggle, long names, home/profile navigation and restoration`);
}

async function checkAutoLoadMore(page, theme, name, selector) {
  for (let round = 0; round < 2; round++) {
    const before = await page.locator(selector).count();
    await page.evaluate(() => window.scrollTo(0, document.scrollingElement.scrollHeight));
    await page.waitForFunction(({ selector, before }) => document.querySelectorAll(selector).length > before, { selector, before });
    report.interactions.push(`${theme}: ${name} scroll loads page ${round + 2} without clicking`);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function checkAutoLoadMoreSetting(page, theme) {
  const openSetting = async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('.prts-float-btn').click();
    await page.getByRole('button', { name: '页面增强', exact: true }).click();
    return page.getByRole('checkbox', { name: '滚动自动加载更多', exact: true });
  };
  const closeSettings = async () => {
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
  };
  const toggle = await openSetting();
  assert(await toggle.isChecked(), 'scroll loading defaults on');
  await toggle.focus();
  await page.keyboard.press('Space');
  assert.equal(await toggle.isChecked(), false);
  assert.equal(await page.evaluate(() => JSON.parse(GM_getValue('prts_plus_settings')).autoLoadMore), false);
  await closeSettings();
  const before = await page.locator('ul.grid > li').count();
  await page.evaluate(() => window.scrollTo(0, document.scrollingElement.scrollHeight));
  await page.waitForTimeout(500);
  assert.equal(await page.locator('ul.grid > li').count(), before, 'disabled scroll loading leaves the list unchanged');
  await page.getByRole('button', { name: '加载更多', exact: true }).click();
  await page.waitForFunction(before => document.querySelectorAll('ul.grid > li').length > before, before);
  const enabled = await openSetting();
  await enabled.focus();
  await page.keyboard.press('Space');
  assert(await enabled.isChecked());
  await closeSettings();
  await checkAutoLoadMore(page, theme, 'reenabled operations', 'ul.grid > li');
  report.interactions.push(`${theme}: scroll loading keyboard toggle, saved preference, manual loading while disabled and immediate reenabling`);
}

async function checkVisuals(page, theme, selector) {
  const element = page.locator(`${selector}:visible`).first();
  const readStyle = () => element.evaluate(e => {
    const s = getComputedStyle(e);
    return Object.fromEntries(['color', 'background-color', 'border-color', 'border-radius', 'box-shadow'].map(property => [property, s.getPropertyValue(property)]));
  });
  for (const state of ['default', 'hover']) {
    await page.locator('body').evaluate(e => e.classList.add('prts-site-redesign'));
    if (state === 'hover') await element.hover();
    else await page.mouse.move(0, 0);
    await page.waitForTimeout(250);
    const enabled = await readStyle();
    await page.locator('body').evaluate(e => e.classList.remove('prts-site-redesign'));
    await page.waitForTimeout(250);
    const original = await readStyle();
    assert.deepEqual(enabled, original, `${theme} ${selector} ${state} keeps the original visual style`);
    report.visuals.push({ theme, selector, state, style: original });
  }
  await page.locator('body').evaluate(e => e.classList.add('prts-site-redesign'));
  await page.mouse.move(0, 0);
}

async function captureList(page, theme, name, titleSelector) {
  const title = page.locator(titleSelector).first();
  const originalTitle = await title.textContent();
  await title.evaluate(e => { e.textContent = '测试长标题：时间啊向前，核对卡片标题最多显示两行。'.repeat(8); });
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(250);
    const result = await page.evaluate(titleSelector => {
      const bar = document.getElementById('prts-filter-bar');
      const buttons = [...bar.querySelectorAll('button, select')].filter(e => e.getBoundingClientRect().width);
      const title = document.querySelector(titleSelector);
      const style = getComputedStyle(title);
      return {
        viewport: innerWidth,
        filterFits: [bar, ...buttons].every(e => { const r = e.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; }),
        clamp: style.webkitLineClamp,
        titleHeight: title.getBoundingClientRect().height,
        lineHeight: parseFloat(style.lineHeight),
      };
    }, titleSelector);
    assert(result.filterFits, `${theme} ${name} filter fits at ${width}px`);
    assert.equal(result.clamp, '2', 'long card titles keep the two-line limit');
    assert(result.titleHeight <= 2 * result.lineHeight + 1, 'long card titles do not exceed two lines');
    report.layouts.push({ theme, name, width, ...result });
    await page.screenshot({ path: path.join(output, `${theme}-${name}-${width}.png`) });
  }
  await title.evaluate((e, text) => { e.textContent = text; }, originalTitle);
}

async function capturePanels(page, theme, name, selector) {
  for (const [width, height] of [[320, 600], [375, 800], [768, 600], [1440, 1000]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(300);
    const panels = await page.locator(selector).evaluateAll(elements => elements.map(e => {
      const r = e.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, scrollWidth: e.scrollWidth, clientWidth: e.clientWidth };
    }));
    assert(panels.length && panels.every(r => r.left >= -1 && r.right <= width + 1 && r.top >= -1 && r.bottom <= height + 1 && r.scrollWidth <= r.clientWidth + 1), `${theme} ${name} respects the viewport at ${width}x${height}`);
    report.layouts.push({ theme, name, width, height, panels });
    await page.screenshot({ path: path.join(output, `${theme}-${name}-${width}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}

main().catch(error => { console.error(error); process.exitCode = 1; });
