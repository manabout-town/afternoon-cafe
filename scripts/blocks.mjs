export function replaceBlock(html, n, css) {
  const re = new RegExp(`(/\\* \\[${n} [^\\]]+\\] \\*/\\n)[\\s\\S]*?(/\\* \\[/${n}\\] \\*/)`);
  if (!re.test(html)) throw new Error(`블록 ${n} 없음`);
  return html.replace(re, (_, open, close) => `${open}${css.trim()}\n${close}`);
}
export function replaceOnce(html, from, to) {
  if (!html.includes(from)) throw new Error(`찾을 수 없음: ${from}`);
  return html.replaceAll(from, to);
}
