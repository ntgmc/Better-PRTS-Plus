// Run with an existing Playwright installation; see docs/development.md.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const output = process.env.PRTS_REVIEW_OUTPUT || fs.mkdtempSync(path.join(os.tmpdir(), 'prts-follow-review-'));
const script = fs.readFileSync(path.join(root, 'Better-PRTS-Plus.user.js'), 'utf8');
const resources = JSON.parse(fs.readFileSync(path.join(root, 'resources/data.json'), 'utf8'));
const version = script.match(/^\/\/\s*@version\s+(\S+)/m)[1];
const report = { screenshots: [], checks: [], errors: [] };

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
  try {
    for (const theme of ['light', 'dark', 'high-contrast']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
      let followedId = '', followRequests = 0;
      await context.addInitScript(({ theme, resources, version }) => {
        localStorage.setItem('theme', JSON.stringify(theme));
        localStorage.setItem('zoot-plus-lang', JSON.stringify('cn'));
        localStorage.setItem('zoot-plus-last-noticed', String(Date.now()));
        localStorage.setItem('zoot-plus-auth', JSON.stringify({
          token: 'browser-review-fixture', validBefore: '2099-01-01T00:00:00Z',
          userId: '999999999', username: '验证账号', activated: true
        }));
        window.GM_getValue = (key, fallback) => {
          if (key === 'prts_plus_resources_v1') return JSON.stringify({ checkedAt: Date.now(), data: resources });
          return sessionStorage.getItem(key) ?? (key === 'prts_plus_settings'
            ? JSON.stringify({ activityShortcuts: false, autoLoadMore: false }) : fallback);
        };
        window.GM_setValue = (key, value) => sessionStorage.setItem(key, value);
        window.GM_addStyle = css => { const style = document.createElement('style'); style.textContent = css; document.head.append(style); };
        window.GM_addValueChangeListener = () => 0;
        window.GM_removeValueChangeListener = () => {};
        window.GM_info = { script: { version } };
        window.GM_xmlhttpRequest = options => {
          queueMicrotask(() => options.onerror?.({ error: 'Offline resource check in browser review' }));
          return { abort() {} };
        };
      }, { theme, resources, version });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(45000);
      page.on('pageerror', error => report.errors.push({ theme, message: error.message }));
      await page.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url());
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) || /googletagmanager|google-analytics/.test(url.hostname)) return route.abort();
        if (url.hostname !== 'prts.maa.plus') return route.continue();
        if (url.pathname === '/follow/followingList') {
          followRequests++;
          return route.fulfill({ json: { status_code: 200, data: { has_next: false, page: 1, total: followedId ? 1 : 0, data: followedId ? [{ id: followedId }] : [] } } });
        }
        if (url.pathname === '/user/me') return route.fulfill({ json: { status_code: 200, data: { id: '999999999', user_name: '验证账号', activated: true } } });
        // Keep the site public: only the login and follow relationship are fixtures.
        const headers = { ...request.headers() };
        delete headers.authorization;
        for (const key of [...url.searchParams.keys()]) if (/only.?following/i.test(key)) url.searchParams.delete(key);
        return route.continue({ headers, url: url.toString() });
      });
      console.log(`${theme}: followed author markers and settings`);
      await page.goto('https://prts.plus/', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('ul.grid > li .bp6-card');
      await page.getByRole('button', { name: '最新', exact: true }).click();
      await page.waitForFunction(() => new Set(Array.from(document.querySelectorAll('ul.grid > li .bp6-icon-user + a'), a => a.getAttribute('href'))).size > 1);
      const authors = await page.locator('ul.grid > li .bp6-icon-user + a').evaluateAll(es => es.map(e => e.getAttribute('href').split('/').pop()));
      assert(new Set(authors).size > 1, 'fixture needs at least two public authors');
      followedId = authors[0];
      await page.evaluate(script);
      await page.waitForSelector('.prts-followed-badge');
      const checkMarkers = async () => {
        const rows = await page.locator('ul.grid > li .bp6-card').evaluateAll(es => es.map(e => ({
          id: e.querySelector('.bp6-icon-user + a')?.getAttribute('href').split('/').pop(),
          marked: e.classList.contains('prts-followed-card'), badges: e.querySelectorAll('.prts-followed-badge').length
        })));
        assert(rows.some(row => row.marked));
        assert(rows.some(row => !row.marked));
        for (const row of rows) {
          assert.equal(row.marked, row.id === followedId);
          assert.equal(row.badges, Number(row.marked));
        }
      };
      await checkMarkers();
      for (const width of [1440, 375, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        const badge = page.locator('.prts-followed-badge').first();
        await badge.scrollIntoViewIfNeeded();
        assert(await badge.evaluate(e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
        const filename = `${theme}-${width}.png`;
        await page.screenshot({ path: path.join(output, filename) });
        report.screenshots.push(filename);
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.evaluate(() => scrollTo(0, 0));
      const onlyFollowing = page.locator('button:has(.bp6-icon-following)');
      await onlyFollowing.click();
      await page.waitForFunction(() => !document.querySelector('.prts-followed-badge'));
      await onlyFollowing.click();
      await page.waitForSelector('.prts-followed-badge');
      await checkMarkers();
      await page.locator('.prts-float-btn').click();
      await page.getByRole('button', { name: '作业卡片', exact: true }).click();
      const toggle = page.getByRole('checkbox', { name: '标记关注用户作业', exact: true });
      assert(await toggle.isChecked());
      await toggle.focus();
      await page.keyboard.press('Space');
      await page.waitForFunction(() => !document.querySelector('.prts-followed-badge, .prts-followed-card'));
      assert.equal(await page.evaluate(() => JSON.parse(GM_getValue('prts_plus_settings')).markFollowedAuthors), false);
      const before = followRequests;
      await page.waitForTimeout(3200);
      assert.equal(followRequests, before, 'disabled feature stops follow requests');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('ul.grid > li .bp6-card');
      await page.getByRole('button', { name: '最新', exact: true }).click();
      await page.waitForFunction(() => new Set(Array.from(document.querySelectorAll('ul.grid > li .bp6-icon-user + a'), a => a.getAttribute('href'))).size > 1);
      followedId = await page.locator('ul.grid > li .bp6-icon-user + a').first().getAttribute('href').then(href => href.split('/').pop());
      await page.evaluate(script);
      await page.waitForSelector('.prts-float-btn');
      await page.locator('.prts-float-btn').click();
      await page.getByRole('button', { name: '作业卡片', exact: true }).click();
      assert.equal(await toggle.isChecked(), false, 'disabled preference survives reopening');
      assert.equal(await page.locator('.prts-followed-badge, .prts-followed-card').count(), 0);
      await toggle.focus();
      await page.keyboard.press('Space');
      await page.waitForSelector('.prts-followed-badge');
      await checkMarkers();
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.evaluate(() => localStorage.setItem('zoot-plus-auth', '{}'));
      await page.waitForFunction(() => !document.querySelector('.prts-followed-badge, .prts-followed-card'));
      report.checks.push(`${theme}: author IDs, mixed list, only-following toggle, keyboard setting, save, reopen, immediate cleanup, reenabling and logout`);
      await context.close();
    }
    assert.deepEqual(report.errors, []);
    report.passed = true;
  } catch (error) {
    report.failure = error.message;
    throw error;
  } finally {
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    await browser.close();
    console.log(`Followed author review: ${output}`);
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
