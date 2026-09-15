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
