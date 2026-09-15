import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, checkPage, passedIds, RULES } from './_helpers.mjs';

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

test('before: 10개 전부 걸린다', async () => {
  const r = await checkPage(browser, 'before/index.html');
  assert.equal(r.total, 10);
  assert.deepEqual(passedIds(r), [], JSON.stringify(r.results, null, 1));
});

const DIRS = ['01-background', '02-body-size', '03-line-height', '04-letter-spacing', '05-font',
  '06-text-color', '07-radius', '08-gap', '09-motion', '10-reading-width'];

DIRS.forEach((dir, i) => {
  test(`steps/${dir}: 앞의 ${i + 1}개 규칙만 통과`, async () => {
    const r = await checkPage(browser, `steps/${dir}/index.html`);
    assert.deepEqual(passedIds(r), RULES.slice(0, i + 1), JSON.stringify(r.results, null, 1));
  });
});

test('after: 10/10', async () => {
  const r = await checkPage(browser, 'after/index.html');
  assert.equal(r.score, 10, JSON.stringify(r.results, null, 1));
});
