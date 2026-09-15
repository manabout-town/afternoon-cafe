import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT, RULES } from './_helpers.mjs';

const must = ['images/menu-1.jpg', 'images/menu-2.jpg', 'images/menu-3.jpg', 'rules/CLAUDE.md',
  'rules/cursor-ui.mdc', 'rules/chatgpt.txt', 'prompts.md', 'README.md', 'index.html'];

test('필수 파일 존재, 사진은 400KB 이하', () => {
  for (const f of must) assert.ok(existsSync(path.join(ROOT, f)), f);
  for (const n of [1, 2, 3]) assert.ok(statSync(path.join(ROOT, `images/menu-${n}.jpg`)).size < 400_000);
});

test('index.html 링크가 전부 실제 파일을 가리킴', () => {
  const html = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const hrefs = [...html.matchAll(/href="([^"#:]+)"/g)].map(m => m[1]);
  assert.ok(hrefs.length >= 8);
  for (const h of hrefs) assert.ok(existsSync(path.join(ROOT, h.endsWith('/') ? h + 'index.html' : h)), h);
});

test('규칙 파일 3종에 10개 규칙 수치가 모두 들어 있음', () => {
  const needles = ['#FFFFFF', '14px', '1.1', '-0.04em', 'Pretendard', '4단계', '한 계열', '16px', '160ms', '680px'];
  for (const f of ['rules/CLAUDE.md', 'rules/cursor-ui.mdc', 'rules/chatgpt.txt']) {
    const t = readFileSync(path.join(ROOT, f), 'utf8');
    for (const n of needles) assert.ok(t.includes(n), `${f}: ${n} 없음`);
  }
});

test('사진·민감정보: 전화번호·이메일 없음', () => {
  for (const f of ['README.md', 'index.html', 'prompts.md', 'before/index.html', 'after/index.html']) {
    const t = readFileSync(path.join(ROOT, f), 'utf8');
    assert.doesNotMatch(t, /01[016789]-?\d{3,4}-?\d{4}/, f);
    assert.doesNotMatch(t, /[\w.]+@[\w-]+\.[a-z]{2,}/i, f);
  }
});
