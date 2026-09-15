import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STEPS, AFTER_COPY } from './steps.mjs';
import { replaceBlock, replaceOnce } from './blocks.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(path.join(ROOT, rel), 'utf8');
const write = (rel, html) => {
  const file = path.join(ROOT, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, html);
  console.log('ok', rel);
};
const deeper = html => html.replaceAll('../images/', '../../images/');

let html = read('before/index.html');
STEPS.forEach((step, i) => {
  html = replaceBlock(html, i + 1, step.css);
  for (const [from, to] of step.html || []) html = replaceOnce(html, from, to);
  write(`steps/${step.dir}/index.html`, deeper(html));
});
let after = html;
for (const [from, to] of AFTER_COPY) after = replaceOnce(after, from, to);
write('after/index.html', after);

const snippet = read('quickstart/snippet.html');
write('quickstart/index.html', replaceOnce(read('before/index.html'), '</head>', `${snippet.trim()}\n</head>`));
