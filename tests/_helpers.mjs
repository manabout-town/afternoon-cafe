import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
export const RULES = ['background', 'body-size', 'line-height', 'letter-spacing', 'font',
  'text-color', 'radius', 'gap', 'motion', 'reading-width'];

export async function openPage(browser, relPath, { width = 1440, waitUntil = 'domcontentloaded' } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto('file://' + path.join(ROOT, relPath), { waitUntil });
  return page;
}

export async function checkPage(browser, relPath, opts = {}) {
  const page = await openPage(browser, relPath, opts);
  await page.addScriptTag({ path: path.join(ROOT, 'tools/ai-slop-check.js') });
  const report = await page.evaluate(() => window.__aiSlop);
  await page.close();
  return report;
}

export const passedIds = r => r.results.filter(x => x.pass === true).map(x => x.id);
