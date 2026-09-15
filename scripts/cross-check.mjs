import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITES = ['https://linear.app', 'https://oriorai.com', 'https://harryjatkins.com', 'https://augen.pro', 'https://shopify.design', 'https://interfere.com', 'https://becaneparis.com', 'https://dirtverse.co', 'https://podium.global'];

const browser = await chromium.launch();
const rows = [];
for (const url of SITES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.addScriptTag({ path: path.join(ROOT, 'tools/ai-slop-check.js') });
    const r = await page.evaluate(() => window.__aiSlop);
    rows.push(`| ${url} | ${r.score}/${r.total} | ${r.results.filter(x => x.pass === false).map(x => `${x.id}(${x.found})`).join(', ') || '-'} |`);
  } catch (e) {
    rows.push(`| ${url} | 측정 실패 | ${e.message.split('\n')[0]} |`);
  }
  await page.close();
}
await browser.close();
console.log(['| 사이트 | 점수 | 걸린 항목 |', '|---|---|---|', ...rows].join('\n'));
