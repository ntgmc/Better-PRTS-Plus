// Uses an existing Playwright installation and only synthetic Skland credentials.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const output = process.env.PRTS_REVIEW_OUTPUT || path.join(root, 'tool/.cache/skland-sync-review');
const script = fs.readFileSync(path.join(root, 'Better-PRTS-Plus.user.js'), 'utf8');
const resources = JSON.parse(fs.readFileSync(path.join(root, 'resources/data.json'), 'utf8'));
const version = script.match(/^\/\/\s*@version\s+(\S+)/m)[1];
const report = { checks: [], layouts: [], errors: [] };
const passphrase = 'test-only-vault-passphrase';

async function prepare(browser, theme, host, saved = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN', reducedMotion: 'reduce' });
  await context.addInitScript(({ theme, resources, version, saved }) => {
    localStorage.setItem('theme', JSON.stringify(theme));
    localStorage.setItem('zoot-plus-lang', JSON.stringify('cn'));
    localStorage.setItem('zoot-plus-last-noticed', String(Date.now()));
    localStorage.setItem('SK_OAUTH_CRED_KEY', 'first-test-credential');
    const store = window.__store = {
      prts_plus_settings: JSON.stringify({ activityShortcuts: false }),
      prts_plus_resources_v1: JSON.stringify({ checkedAt: Date.now(), data: resources }), ...saved
    };
    window.__requests = [];
    window.__failSecond = false;
    window.GM_getValue = (key, fallback) => store[key] ?? fallback;
    window.GM_setValue = (key, value) => {
      if (window.__failSyncWrite && key === 'prts_plus_skland_sync') throw new Error('Synthetic storage failure');
      store[key] = value;
    };
    window.GM_addValueChangeListener = () => 0;
    window.GM_info = { script: { version } };
    window.GM_addStyle = css => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.append(style);
    };
    const respond = (url, headers) => {
      const pathname = new URL(url).pathname;
      const uid = headers.cred === 'second-test-credential' ? '222' : '111';
      window.__requests.push({ pathname, uid });
      if (window.__failSecond && uid === '222') return { code: 10002, message: '登录已失效' };
      if (pathname.endsWith('/auth/refresh')) return { code: 0, message: 'OK', data: { token: 'synthetic-api-token' } };
      if (pathname.endsWith('/binding')) return { code: 0, message: 'OK', data: { list: [{ appCode: 'arknights', defaultUid: uid, bindingList: [{ uid, nickName: `测试博士${uid}`, channelName: '官方' }] }] } };
      if (pathname.endsWith('/player/info')) return { code: 0, message: 'OK', data: {
        chars: [{ charId: 'char_002_amiya', evolvePhase: 2, level: window.__level || 80, mainSkillLevel: 7 }],
        charInfoMap: { char_002_amiya: { name: '阿米娅' } }
      } };
      return { code: 0, message: 'OK', data: { characters: [] } };
    };
    const originalFetch = window.fetch.bind(window);
    window.fetch = (url, init) => {
      if (String(url).startsWith('https://zonai.skland.com/')) throw new Error('Credentials reached page fetch');
      return originalFetch(url, init);
    };
    window.GM_xmlhttpRequest = options => {
      queueMicrotask(() => {
        if (options.url.startsWith('https://zonai.skland.com/')) options.onload({ status: 200, response: respond(options.url, options.headers) });
        else options.onerror?.({ error: 'Offline update check in sync review' });
      });
      return { abort() {} };
    };
  }, { theme, resources, version, saved });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push({ theme, host, message: error.message }));
  await page.route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname === 'www.skland.com') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>森空岛导入测试</title></head><body></body></html>' });
    const publicSetQuery = request.method() === 'POST' && url.pathname === '/set/query';
    return url.hostname === 'zonai.skland.com' || (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !publicSetQuery)
      || /googletagmanager|google-analytics/.test(request.url()) ? route.abort() : route.continue();
  });
  await page.goto(host === 'skland' ? 'https://www.skland.com/index' : 'https://prts.plus/', { waitUntil: 'domcontentloaded' });
  if (host !== 'skland') await page.waitForSelector('ul.grid > li .bp6-card');
  await page.evaluate(script);
  if (host !== 'skland') {
    await page.locator('.prts-float-btn').click();
    await page.getByRole('button', { name: '账号与数据', exact: true }).click();
    const accounts = page.locator('#prts-accounts-panel');
    assert.equal(await accounts.locator('.prts-skland-sync').count(), 0);
    await page.getByRole('button', { name: '森空岛快捷刷新', exact: true }).click();
    assert.equal(await accounts.getAttribute('aria-hidden'), 'false');
    assert.equal(await page.locator('#prts-skland-sync-panel').getAttribute('aria-hidden'), 'false');
  }
  await page.waitForSelector('.prts-skland-sync');
  return { page, context };
}

async function capture(page, theme, host, state) {
  for (const [width, height] of [[320, 600], [375, 800], [1440, 1000]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(150);
    const modal = state.includes('risk') || state.includes('password');
    if (!modal) {
      await page.locator('.prts-skland-sync-list').scrollIntoViewIfNeeded();
      await page.locator('.prts-toast').evaluateAll(nodes => nodes.forEach(node => node.remove()));
    }
    const selector = modal ? '#prts-modal' : host === 'skland' ? '#prts-skland-import-panel' : '#prts-skland-sync-panel';
    const boxes = await page.locator(selector).evaluateAll(nodes => nodes.map(e => {
      const r = e.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: e.clientWidth, scrollWidth: e.scrollWidth };
    }));
    assert(boxes.length && boxes.every(r => r.left >= -1 && r.right <= width + 1 && r.top >= -1 && r.bottom <= height + 1 && r.scrollWidth <= r.width + 1), `${host} ${state} fits ${width}px`);
    report.layouts.push({ theme, host, state, width, boxes });
    await page.screenshot({ path: path.join(output, `${theme}-${host}-${state}-${width}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}

async function enable(page, theme, host, mode = 'encrypted') {
  const before = await page.evaluate(() => __store.prts_plus_skland_sync);
  assert(await page.getByRole('radio', { name: '口令加密（默认）', exact: true }).isChecked());
  assert(await page.locator('.prts-skland-vault-action').isHidden());
  if (mode === 'plaintext') await page.getByRole('radio', { name: '免口令保存（高风险）', exact: true }).check();
  await page.getByRole('checkbox', { name: '保存登录凭据（风险可选）', exact: true }).click();
  const confirm = page.getByRole('button', { name: mode === 'plaintext' ? '同意风险并免口令保存' : '同意风险并继续', exact: true });
  assert(await confirm.isDisabled());
  await capture(page, theme, host, mode === 'plaintext' ? 'plaintext-enable-risk' : 'risk');
  await page.keyboard.press('Shift+Tab');
  assert(await page.getByRole('button', { name: '取消', exact: true }).evaluate(e => e === document.activeElement));
  await page.keyboard.press('Tab');
  assert(await page.locator('#prts-modal .prts-import-close').evaluate(e => e === document.activeElement));
  const ack = page.locator('#prts-modal .prts-skland-sync-acknowledgement input');
  await ack.focus();
  await page.keyboard.press('Space');
  assert(await confirm.isEnabled());
  await page.getByRole('button', { name: '取消', exact: true }).click();
  assert.equal(await page.locator('.prts-skland-sync-enabled').isChecked(), false);
  assert.equal(await page.evaluate(() => __store.prts_plus_skland_sync), before);
  if (mode === 'plaintext') await page.getByRole('radio', { name: '免口令保存（高风险）', exact: true }).check();
  await page.locator('.prts-skland-sync-enabled').click();
  assert(await confirm.isDisabled(), 'acknowledgement resets after cancellation');
  await ack.check();
  await confirm.click();
  if (mode === 'plaintext') {
    await page.waitForFunction(() => JSON.parse(__store.prts_plus_skland_sync || '{}').mode === 'plaintext');
    assert(await page.locator('.prts-skland-vault-action').isHidden());
    assert.equal(await page.locator('#prts-modal').count(), 0);
    report.checks.push(`${theme} ${host}: plaintext opt-in requires separate consent, cancellation preserves default encryption, no password requested`);
    return;
  }
  const fields = page.locator('#prts-modal input[type="password"]');
  const submit = page.getByRole('button', { name: '设置口令并保存', exact: true });
  assert(await submit.isDisabled());
  await fields.nth(0).fill('short');
  await fields.nth(1).fill('short');
  assert(await submit.isDisabled());
  await fields.nth(0).fill(passphrase);
  await fields.nth(1).fill('different-test-passphrase');
  assert(await submit.isDisabled());
  await fields.nth(1).fill(passphrase);
  await capture(page, theme, host, 'password');
  await submit.click();
  await page.waitForFunction(() => JSON.parse(__store.prts_plus_skland_sync || '{}').consentVersion === 2);
  assert.equal(await page.locator('.prts-skland-sync-enabled').isChecked(), true);
  assert.equal(await page.locator('.prts-skland-sync-auto').isChecked(), true);
  report.checks.push(`${theme} ${host}: risk acknowledgement, cancellation, keyboard and explicit consent`);
}

async function importAccount(page, id, credential) {
  await page.evaluate(credential => localStorage.setItem('SK_OAUTH_CRED_KEY', credential), credential);
  await page.locator('#prts-skland-target-account').selectOption(String(id));
  await page.getByRole('button', { name: '读取并导入干员', exact: true }).click();
  await page.getByRole('button', { name: '确认导入', exact: true }).click();
  await page.waitForFunction(id => JSON.parse(__store.prts_plus_skland_sync || '{}').accounts?.[id], id);
}

async function switchMode(page, mode) {
  await page.getByRole('radio', { name: mode === 'plaintext' ? '免口令保存（高风险）' : '口令加密（默认）', exact: true }).click();
  const confirm = page.getByRole('button', { name: mode === 'plaintext' ? '同意风险并免口令保存' : '同意风险并继续', exact: true });
  assert(await confirm.isDisabled());
  await page.locator('#prts-modal .prts-skland-sync-acknowledgement input').check();
  await confirm.click();
}

async function checkModeSwitches(page, theme, host) {
  const original = await page.evaluate(() => __store.prts_plus_skland_sync);
  await page.getByRole('button', { name: '立即锁定', exact: true }).click();
  await page.getByRole('radio', { name: '免口令保存（高风险）', exact: true }).click();
  assert(await page.getByRole('button', { name: '同意风险并免口令保存', exact: true }).isDisabled());
  assert((await page.locator('#prts-modal-message').textContent()).includes('明文'));
  await capture(page, theme, host, 'plaintext-switch-risk');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => __store.prts_plus_skland_sync), original);
  assert(await page.getByRole('radio', { name: '口令加密（默认）', exact: true }).isChecked());
  await switchMode(page, 'plaintext');
  await page.getByLabel('加密口令', { exact: true }).fill('wrong-test-passphrase');
  await page.getByRole('button', { name: '解锁当前页面', exact: true }).click();
  await page.getByText('未能解锁凭据', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => __store.prts_plus_skland_sync), original);
  await page.evaluate(() => { window.__failSyncWrite = true; });
  await switchMode(page, 'plaintext');
  await page.getByLabel('加密口令', { exact: true }).fill(passphrase);
  await page.getByRole('button', { name: '解锁当前页面', exact: true }).click();
  await page.getByText('设置未保存', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => __store.prts_plus_skland_sync), original);
  assert(await page.getByRole('radio', { name: '口令加密（默认）', exact: true }).isChecked());
  await page.evaluate(() => { window.__failSyncWrite = false; });
  await switchMode(page, 'plaintext');
  await page.waitForFunction(() => JSON.parse(__store.prts_plus_skland_sync).mode === 'plaintext');
  const plaintext = await page.evaluate(() => JSON.parse(__store.prts_plus_skland_sync));
  assert.equal(plaintext.plaintextConsentVersion, 1);
  assert.equal(plaintext.vault, null);
  assert(Object.values(plaintext.accounts).every(entry => entry.credential && !entry.sealedCredential));
  assert(await page.locator('.prts-skland-vault-action').isHidden());
  assert((await page.locator('.prts-skland-vault-status').textContent()).includes('明文'));
  assert((await page.locator('.prts-skland-sync-auto-hint').textContent()).includes('无需解锁'));
  await capture(page, theme, host, 'plaintext-saved');
  await switchMode(page, 'encrypted');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => __store.prts_plus_skland_sync), JSON.stringify(plaintext));
  await switchMode(page, 'encrypted');
  await page.getByLabel('加密口令', { exact: true }).fill(passphrase);
  await page.getByLabel('再次输入口令', { exact: true }).fill(passphrase);
  await page.getByRole('button', { name: '设置口令并保存', exact: true }).click();
  await page.waitForFunction(() => JSON.parse(__store.prts_plus_skland_sync).mode === 'encrypted');
  const encrypted = await page.evaluate(() => JSON.parse(__store.prts_plus_skland_sync));
  for (const [id, before] of Object.entries(plaintext.accounts)) {
    const { credential, ...metadata } = before;
    const { sealedCredential, ...result } = encrypted.accounts[id];
    assert.deepEqual(result, metadata);
    assert(sealedCredential);
  }
  assert.equal(encrypted.autoRefresh, plaintext.autoRefresh);
  assert(!JSON.stringify(encrypted).includes('test-credential'));
  report.checks.push(`${theme} ${host}: both mode switches preserve metadata, separate risk consent, cancel, wrong password, write failure and plaintext status`);
}

async function checkNestedNavigation(browser, theme, isRight) {
  const { page, context } = await prepare(browser, theme, 'prts', {
    prts_plus_settings: JSON.stringify({ activityShortcuts: false, floatingPosition: { top: '40%', isRight } })
  });
  try {
    const accounts = page.locator('#prts-accounts-panel');
    const sync = page.locator('#prts-skland-sync-panel');
    const entry = page.getByRole('button', { name: '森空岛快捷刷新', exact: true });
    for (const [width, height] of [[320, 600], [375, 800], [768, 900], [1440, 1000]]) {
      await page.setViewportSize({ width, height });
      await page.keyboard.press('Escape');
      assert.equal(await sync.getAttribute('aria-hidden'), 'true');
      assert.equal(await accounts.getAttribute('aria-hidden'), 'false');
      assert(await entry.evaluate(node => node === document.activeElement));
      if (width === 375 || width === 1440) {
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(output, `${theme}-prts-accounts-${isRight ? 'right' : 'left'}-${width}.png`) });
      }
      await entry.press('Enter');
      await page.getByRole('radio', { name: '免口令保存（高风险）', exact: true }).focus();
      await page.keyboard.press('ArrowUp');
      assert(await page.getByRole('radio', { name: '口令加密（默认）', exact: true }).isChecked());
      await page.waitForTimeout(250);
      const layout = await page.locator('#prts-settings-panel, #prts-accounts-panel, #prts-skland-sync-panel').evaluateAll(nodes => nodes.map(node => {
        const box = node.getBoundingClientRect();
        return { id: node.id, left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width,
          clientWidth: node.clientWidth, scrollWidth: node.scrollWidth, zIndex: Number(getComputedStyle(node).zIndex) };
      }));
      assert(layout.every(box => box.left >= -1 && box.right <= width + 1 && box.top >= -1 && box.bottom <= height + 1 && box.scrollWidth <= box.clientWidth + 1));
      const [, parent, child] = layout;
      assert(child.zIndex > parent.zIndex);
      if (width >= 1440) assert(isRight ? child.right + 7 <= parent.left : child.left >= parent.right + 7);
      if (width < 768) assert(Math.abs((isRight ? parent.right - child.right : child.left - parent.left) - 24) < 1);
      report.layouts.push({ theme, host: 'prts', state: 'nested-navigation', width, isRight, boxes: layout });
      await page.screenshot({ path: path.join(output, `${theme}-prts-nested-${isRight ? 'right' : 'left'}-${width}.png`) });
      await page.getByRole('button', { name: '收起森空岛快捷刷新', exact: true }).click();
      assert.equal(await accounts.getAttribute('aria-hidden'), 'false');
      assert(await entry.evaluate(node => node === document.activeElement));
      await entry.press('Enter');
    }
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    assert.equal(await accounts.getAttribute('aria-hidden'), 'true');
    assert(await page.getByRole('button', { name: '账号与数据', exact: true }).evaluate(node => node === document.activeElement));
    await page.getByRole('button', { name: '账号与数据', exact: true }).press('Enter');
    await entry.press('Enter');
    await page.locator('#prts-settings-about-button').click();
    assert.equal(await accounts.getAttribute('aria-hidden'), 'true');
    assert.equal(await sync.getAttribute('aria-hidden'), 'true');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: '账号与数据', exact: true }).click();
    await entry.click();
    await page.locator('body').click({ position: { x: 700, y: 10 } });
    assert.equal(await sync.getAttribute('aria-hidden'), 'true');
    assert.equal(await accounts.getAttribute('aria-hidden'), 'true');
    report.checks.push(`${theme} ${isRight ? 'right' : 'left'}: three-level navigation, keyboard radios, focus return, parent preservation, category switching, outside close and viewport layout`);
  } finally {
    await context.close();
  }
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
  try {
    for (const theme of ['light', 'dark', 'high-contrast']) {
      console.log(`${theme}: nested navigation, consent, imports and batch refresh`);
      for (const isRight of [false, true]) await checkNestedNavigation(browser, theme, isRight);
      const skland = await prepare(browser, theme, 'skland');
      const page = skland.page;
      await enable(page, theme, 'skland');
      await importAccount(page, 1, 'first-test-credential');
      await importAccount(page, 2, 'second-test-credential');
      await capture(page, theme, 'skland', 'saved');
      await checkModeSwitches(page, theme, 'skland');
      assert.equal(await page.locator('.prts-skland-sync-account').count(), 2);
      const saved = await page.evaluate(() => __store);
      assert(!saved.prts_plus_skland_sync.includes('test-credential'));
      assert(!JSON.stringify(saved).includes(passphrase));
      assert(!await page.locator('.prts-skland-status').evaluate(e => /UID (111|222)/.test(e.textContent)));
      await skland.context.close();

      const prts = await prepare(browser, theme, 'prts', saved);
      const p = prts.page;
      assert.equal(await p.evaluate(() => __requests.length), 0, 'entering again does not refresh recent accounts');
      assert((await p.locator('.prts-skland-vault-status').textContent()).includes('已锁定'));
      await capture(p, theme, 'prts', 'locked');
      await p.getByRole('button', { name: '解锁凭据', exact: true }).click();
      await p.getByLabel('加密口令', { exact: true }).fill('wrong-test-passphrase');
      await p.getByRole('button', { name: '解锁当前页面', exact: true }).click();
      await p.getByText('未能解锁凭据', { exact: true }).waitFor();
      assert((await p.locator('.prts-skland-vault-status').textContent()).includes('已锁定'));
      assert.equal(await p.evaluate(() => __requests.length), 0);
      await p.evaluate(() => { window.__level = 90; window.__failSecond = true; });
      await p.getByRole('button', { name: '刷新全部已保存账号', exact: true }).click();
      await p.getByLabel('加密口令', { exact: true }).fill(passphrase);
      await p.getByRole('button', { name: '解锁当前页面', exact: true }).click();
      await p.waitForFunction(() => JSON.parse(__store.prts_plus_skland_sync).accounts[2].status === 'expired');
      const state = await p.evaluate(() => JSON.parse(__store.prts_plus_accounts_data));
      assert.equal(state.activeAccountId, 2);
      assert.equal(state.accountsTraining[1]['阿米娅'].level, 90);
      assert.equal(state.accountsTraining[2]['阿米娅'].level, 80);
      assert((await p.locator('.prts-skland-sync-list').textContent()).includes('登录已失效'));
      assert(!(await p.locator('.prts-skland-sync').textContent()).includes('test-credential'));
      await capture(p, theme, 'prts', 'partial-failure');
      await p.evaluate(() => { window.__failSecond = false; });
      await p.getByRole('button', { name: '刷新全部已保存账号', exact: true }).click();
      await p.waitForFunction(() => JSON.parse(__store.prts_plus_accounts_data).accountsTraining[2]['阿米娅'].level === 90);
      await checkModeSwitches(p, theme, 'prts');
      await p.getByRole('button', { name: '立即锁定', exact: true }).click();
      assert((await p.locator('.prts-skland-vault-status').textContent()).includes('已锁定'));
      await p.locator('.prts-skland-sync-enabled').uncheck();
      assert.deepEqual(await p.evaluate(() => JSON.parse(__store.prts_plus_skland_sync).accounts), {});
      assert(await p.getByRole('button', { name: '刷新全部已保存账号', exact: true }).isDisabled());
      assert(await p.locator('.prts-skland-vault-action').isHidden());
      await enable(p, theme, 'prts');
      await p.keyboard.press('Escape');
      report.checks.push(`${theme}: encrypted storage, password validation, wrong password, reload lock, unlock and batch refresh, partial failure, retry, UID masking, active account and disable cleanup`);
      await prts.context.close();

      const plain = await prepare(browser, theme, 'skland');
      await enable(plain.page, theme, 'skland', 'plaintext');
      await importAccount(plain.page, 1, 'first-test-credential');
      const plainSaved = await plain.page.evaluate(() => {
        const value = JSON.parse(__store.prts_plus_skland_sync);
        value.accounts[1].lastAttemptAt = value.accounts[1].lastSuccessAt = 0;
        return { ...__store, prts_plus_skland_sync: JSON.stringify(value) };
      });
      assert(plainSaved.prts_plus_skland_sync.includes('first-test-credential'));
      await plain.context.close();
      const reloaded = await prepare(browser, theme, 'prts', plainSaved);
      const r = reloaded.page;
      await r.waitForFunction(() => JSON.parse(__store.prts_plus_skland_sync).accounts[1].lastSuccessAt > 0);
      assert(await r.locator('.prts-skland-vault-action').isHidden());
      assert.equal(await r.locator('#prts-modal').count(), 0);
      assert.equal(await r.evaluate(() => __requests.length), 4);
      await capture(r, theme, 'prts', 'plaintext-reload');
      await r.getByRole('button', { name: '刷新全部已保存账号', exact: true }).click();
      await r.waitForFunction(() => __requests.length === 8);
      await r.waitForFunction(() => !document.querySelector('.prts-skland-sync-refresh').disabled);
      await r.locator('.prts-skland-sync-enabled').uncheck();
      assert(!await r.evaluate(() => __store.prts_plus_skland_sync.includes('credential')));
      assert(await r.getByRole('radio', { name: '口令加密（默认）', exact: true }).isChecked());
      report.checks.push(`${theme}: fresh plaintext import without unlock, automatic and manual refresh after reload, disable clears plaintext and restores default`);
      await reloaded.context.close();
    }
    assert.deepEqual(report.errors, []);
    report.passed = true;
  } catch (error) {
    report.failure = error.message;
    throw error;
  } finally {
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    await browser.close();
    console.log(`Skland sync review: ${report.layouts.length} layouts. Evidence: ${output}`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
