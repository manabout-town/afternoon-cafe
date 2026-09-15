import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, checkPage, passedIds } from './_helpers.mjs';

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

test('before: 10개 전부 걸린다', async () => {
  const r = await checkPage(browser, 'before/index.html');
  assert.equal(r.total, 10);
  assert.deepEqual(passedIds(r), [], JSON.stringify(r.results, null, 1));
});
