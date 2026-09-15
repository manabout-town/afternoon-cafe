import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { ROOT, RULES } from './_helpers.mjs';

const { analyze } = createRequire(import.meta.url)(path.join(ROOT, 'tools/ai-slop-check.js'));
const FONT = '"Pretendard Variable", Pretendard, sans-serif';
const txt = o => ({ tag: 'p', fontSize: 14, lineHeight: '22.4px', letterSpacing: '-0.154px',
  fontFamily: FONT, color: 'rgba(26, 24, 20, 0.68)', width: 504, chars: 80, ...o });
const good = () => ({
  bodyBg: 'rgb(246, 245, 242)', htmlBg: 'rgba(0, 0, 0, 0)', viewportWidth: 1440,
  texts: [
    txt({ tag: 'h1', fontSize: 56, lineHeight: '61.6px', letterSpacing: '-1.96px', color: 'rgba(26, 24, 20, 0.92)', chars: 18 }),
    txt({}), txt({ chars: 120 }),
  ],
  radii: ['6px', '8px', '4px'],
  gaps: ['8px', '12px', '6px', '32px'],
  transitions: [{ property: 'background-color, transform', duration: '0.16s, 0.16s',
    timing: 'cubic-bezier(0, 0, 0.2, 1), cubic-bezier(0, 0, 0.2, 1)' }],
});
const failed = s => analyze(s).results.filter(r => r.pass === false).map(r => r.id);

test('좋은 스냅샷은 10/10, 결과 순서는 RULES', () => {
  const r = analyze(good());
  assert.equal(r.score, 10); assert.equal(r.total, 10);
  assert.deepEqual(r.results.map(x => x.id), RULES);
});

test('배경: 순백·순검정·투명(=흰색)은 실패, html 배경은 인정', () => {
  assert.deepEqual(failed({ ...good(), bodyBg: 'rgb(255, 255, 255)' }), ['background']);
  assert.deepEqual(failed({ ...good(), bodyBg: 'rgb(0, 0, 0)' }), ['background']);
  assert.deepEqual(failed({ ...good(), bodyBg: 'rgba(0, 0, 0, 0)' }), ['background']);
  assert.deepEqual(failed({ ...good(), bodyBg: 'rgba(0, 0, 0, 0)', htmlBg: 'rgb(8, 9, 10)' }), []);
  assert.deepEqual(failed({ ...good(), bodyBg: 'oklch(0.15 0 0)' }), []);
});

test('본문 크기: 16px 실패, 15px 통과', () => {
  const s = good(); s.texts = s.texts.map(t => t.tag === 'p' ? { ...t, fontSize: 16 } : t);
  assert.deepEqual(failed(s), ['body-size']);
  const s2 = good(); s2.texts = s2.texts.map(t => t.tag === 'p' ? { ...t, fontSize: 15, lineHeight: '24px' } : t);
  assert.deepEqual(failed(s2), []);
});

test('큰 제목 줄 간격: 1.5 실패, normal 통과', () => {
  const s = good(); s.texts[0] = { ...s.texts[0], lineHeight: '84px' };
  assert.deepEqual(failed(s), ['line-height']);
  const s2 = good(); s2.texts[0] = { ...s2.texts[0], lineHeight: 'normal' };
  assert.deepEqual(failed(s2), []);
});

test('큰 제목 자간: normal·과도한 음수 실패', () => {
  const s = good(); s.texts[0] = { ...s.texts[0], letterSpacing: 'normal' };
  assert.deepEqual(failed(s), ['letter-spacing']);
  const s2 = good(); s2.texts[0] = { ...s2.texts[0], letterSpacing: '-5px' };
  assert.deepEqual(failed(s2), ['letter-spacing']);
});

test('폰트: 시스템 폰트 스택 실패', () => {
  const s = good(); s.texts = s.texts.map(t => ({ ...t, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }));
  assert.deepEqual(failed(s), ['font']);
});

test('글자색: 두 번 이상 쓰인 색이 6가지면 실패', () => {
  const s = good();
  for (const c of ['#111', '#333', '#666', '#777', '#888', '#999'].map((_, i) => `rgb(${i}, ${i}, ${i})`))
    s.texts.push(txt({ color: c, chars: 10 }), txt({ color: c, chars: 10 }));
  assert.deepEqual(failed(s), ['text-color']);
});

test('모서리: 타이트+소프트 혼용 실패, 알약·원형은 제외', () => {
  assert.deepEqual(failed({ ...good(), radii: ['4px', '24px'] }), ['radius']);
  assert.deepEqual(failed({ ...good(), radii: ['16px', '24px', '50%', '9999px'] }), []);
});

test('간격: 16px가 절반 이상이면 실패', () => {
  assert.deepEqual(failed({ ...good(), gaps: ['16px', '16px', '16px', '8px'] }), ['gap']);
  assert.deepEqual(failed({ ...good(), gaps: ['16px', '8px', '12px'] }), []);
});

test('움직임: ease 기본값·all 실패, cubic-bezier 쉼표는 안 쪼갬', () => {
  const t = { property: 'transform', duration: '0.3s', timing: 'ease' };
  assert.deepEqual(failed({ ...good(), transitions: [t] }), ['motion']);
  assert.deepEqual(failed({ ...good(), transitions: [{ ...t, property: 'all', timing: 'linear' }] }), ['motion']);
  assert.deepEqual(failed({ ...good(), transitions: [{ ...t, timing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }] }), []);
});

test('읽기 폭: 넓은 문단 실패, 좁은 화면은 측정 불가', () => {
  const s = good(); s.texts = s.texts.map(t => t.tag === 'p' ? { ...t, width: 1232 } : t);
  assert.deepEqual(failed(s), ['reading-width']);
  const r = analyze({ ...good(), viewportWidth: 390 });
  assert.equal(r.results.find(x => x.id === 'reading-width').pass, null);
  assert.equal(r.total, 9); assert.equal(r.score, 9);
});
