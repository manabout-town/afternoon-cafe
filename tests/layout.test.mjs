import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium, openPage, ROOT } from './_helpers.mjs';

export const PAGES = ['before/index.html', 'after/index.html', 'tailwind/after.html',
  'styles/minimal/index.html', 'styles/editorial/index.html', 'styles/dark/index.html', 'styles/soft/index.html'];
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

for (const rel of PAGES) {
  test(`${rel}: 섹션 구성`, async () => {
    assert.ok(existsSync(path.join(ROOT, rel)), `${rel} 없음`);
    const page = await openPage(browser, rel);
    const ids = await page.$$eval('section', s => s.map(e => e.id || e.className));
    assert.deepEqual(ids, ['hero', 'about', 'menu', 'visit']);
    assert.equal(await page.$$eval('.menu-card', c => c.length), 3);
    assert.equal(await page.$$eval('img:not([alt])', i => i.length), 0);
    await page.close();
  });
  for (const width of [320, 390, 430]) {
    test(`${rel}: ${width}px 가로 넘침 없음`, async () => {
      const page = await openPage(browser, rel, { width });
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(over <= 0, `${over}px 넘침`);
      await page.close();
    });
  }
}
