/*!
 * AI 티 검사기 v1.0 — 전자책 「AI가 만든 티 벗기기」 부록
 * 사용법: 검사할 사이트를 PC 크롬에서 열기 → F12 → Console 탭 → 이 파일 내용 전부 붙여넣고 Enter
 * 규칙 수치 근거: 라이브 사이트 9곳 실측(2026-08)
 */
(function () {
  const SYSTEM_FONTS = ['-apple-system', 'blinkmacsystemfont', 'system-ui', 'segoe ui', 'roboto',
    'helvetica neue', 'helvetica', 'arial', 'sans-serif', 'serif', 'apple sd gothic neo',
    'malgun gothic', '맑은 고딕', 'dotum', '돋움', 'gulim', '굴림'];
  const DISPLAY_PX = 28;

  const parseColor = v => {
    const m = /^rgba?\(([^)]+)\)$/.exec((v || '').trim());
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  // rgb()/rgba() 외 색 함수(oklab/oklch/lab/color() 등)도 알파만 떼어내 베이스를 묶는다.
  const colorAlpha = v => {
    const c = parseColor(v);
    if (c) return c.a;
    const m = /\/\s*([\d.]+)\s*\)\s*$/.exec((v || '').trim());
    return m ? parseFloat(m[1]) : 1;
  };
  const colorBaseKey = v => {
    const c = parseColor(v);
    if (c) return `${c.r},${c.g},${c.b}`;
    return (v || '').trim().replace(/\s*\/\s*[\d.]+\s*\)\s*$/, ')');
  };
  const splitList = v => (v || '').split(/,(?![^(]*\))/).map(s => s.trim()).filter(Boolean);
  const firstFamily = v => (splitList(v)[0] || '').replace(/["']/g, '').toLowerCase();
  const weightedMode = (items, key, weight) => {
    const m = new Map();
    for (const it of items) m.set(key(it), (m.get(key(it)) || 0) + weight(it));
    let best = null, bestW = -1;
    for (const [k, w] of m) if (w > bestW) { best = k; bestW = w; }
    return best;
  };

  function analyze(snap) {
    const results = [];
    const add = (id, name, pass, found, fix) => results.push({ id, name, pass, found, fix });

    let bg = parseColor(snap.bodyBg);
    if (bg && bg.a === 0) bg = parseColor(snap.htmlBg);
    if (bg && bg.a === 0) bg = { r: 255, g: 255, b: 255, a: 1 };
    const pure = bg && ((bg.r === 255 && bg.g === 255 && bg.b === 255) || (bg.r === 0 && bg.g === 0 && bg.b === 0));
    add('background', '배경색', !pure, bg ? `rgb(${bg.r}, ${bg.g}, ${bg.b})` : snap.bodyBg,
      '순백·순검정 대신 라이트 #F2~#F7 / 다크 #08~#1F');

    const body = snap.texts.filter(t => t.chars >= 20 && t.fontSize < DISPLAY_PX);
    const size = weightedMode(body, t => t.fontSize, t => t.chars);
    add('body-size', '본문 글자 크기', size === null || (size >= 12 && size <= 15),
      size === null ? '본문 없음' : `${size}px`, '본문 14px (12~15px)');

    const display = snap.texts.filter(t => t.fontSize >= DISPLAY_PX);
    const ratios = display.map(t => t.lineHeight === 'normal' ? 1.2 : parseFloat(t.lineHeight) / t.fontSize);
    const worst = ratios.length ? Math.max(...ratios) : null;
    add('line-height', '큰 제목 줄 간격', worst === null || worst <= 1.25,
      worst === null ? '큰 제목 없음' : `최대 ${worst.toFixed(2)}배`, '큰 제목 1.05~1.2배');

    const ems = display.map(t => t.letterSpacing === 'normal' ? 0 : parseFloat(t.letterSpacing) / t.fontSize);
    add('letter-spacing', '큰 제목 자간', ems.every(v => v <= -0.01 && v >= -0.05),
      ems.length ? `${Math.max(...ems).toFixed(3)} ~ ${Math.min(...ems).toFixed(3)}em` : '큰 제목 없음',
      '큰 제목 -0.02 ~ -0.04em');

    const family = weightedMode(snap.texts, t => firstFamily(t.fontFamily), t => t.chars);
    add('font', '폰트', family === null || !SYSTEM_FONTS.includes(family), family || '글자 없음',
      'Pretendard 같은 웹폰트 지정');

    const colorChars = new Map();
    let colorTotalChars = 0;
    for (const t of snap.texts) {
      if (colorAlpha(t.color) === 0) continue; // 완전 투명(안 보이는 글자)은 무시
      const key = colorBaseKey(t.color); // 알파 무시하고 베이스 색으로 묶음 (rgb든 oklab이든)
      colorChars.set(key, (colorChars.get(key) || 0) + t.chars);
      colorTotalChars += t.chars;
    }
    const colorGroups = colorTotalChars
      ? [...colorChars.values()].filter(n => n / colorTotalChars >= 0.03).length : 0;
    add('text-color', '글자색 단계', colorGroups <= 5, `${colorGroups}가지 색 계열`, '같은 색의 투명도 4단계');

    const families = new Set();
    for (const r of snap.radii) {
      if (r.endsWith('%')) continue;
      const px = parseFloat(r);
      if (!(px > 0) || px >= 100) continue;
      families.add(px <= 8 ? '타이트' : px >= 12 ? '소프트' : '중간');
    }
    add('radius', '모서리 둥글기', families.size <= 1, families.size ? [...families].join(' + ') : '없음',
      '한 계열만: 2~8px 또는 14~32px');

    const gaps = snap.gaps.map(g => g.split(' ')[0]);
    const gapMode = weightedMode(gaps, g => g, () => 1);
    const share = gaps.length ? gaps.filter(g => g === gapMode).length / gaps.length : 0;
    add('gap', '간격', gaps.length < 3 || !(gapMode === '16px' && share >= 0.5),
      gaps.length ? `가장 많은 값 ${gapMode} (${Math.round(share * 100)}%)` : '없음',
      '안쪽 4~12px, 섹션 사이 24px 이상');

    const sec = d => parseFloat(d) * (d.endsWith('ms') ? 0.001 : 1);
    const motionTotal = snap.transitions.length;
    const bad = snap.transitions.filter(t => splitList(t.timing).includes('ease')
      || splitList(t.duration).some(d => sec(d) > 1));
    const motionRatio = motionTotal ? bad.length / motionTotal : 0;
    add('motion', '움직임', motionTotal === 0 || motionRatio < 0.25,
      bad.length ? `기본 ease ${bad.length}/${motionTotal}곳 (${Math.round(motionRatio * 100)}%)` : `${motionTotal}곳 정상`,
      '160ms 감속 곡선, 큰 동작 480ms');

    if (snap.viewportWidth < 1000) {
      add('reading-width', '읽기 폭', null, `화면 ${snap.viewportWidth}px`, 'PC 화면(1000px 이상)에서 다시 실행');
    } else {
      const paras = snap.texts.filter(t => t.tag === 'p' && t.chars >= 60);
      const widest = paras.length ? Math.max(...paras.map(t => t.width)) : null;
      add('reading-width', '읽기 폭', widest === null || widest <= 720,
        widest === null ? '긴 문단 없음' : `가장 넓은 문단 ${Math.round(widest)}px`, '문단 폭 440~680px');
    }

    const judged = results.filter(r => r.pass !== null);
    return { score: judged.filter(r => r.pass).length, total: judged.length, results };
  }

  function collect(doc, win) {
    const cs = e => win.getComputedStyle(e);
    const visible = [...doc.querySelectorAll('body *')].filter(e => e.getClientRects().length > 0).slice(0, 4000);
    const texts = visible
      .filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1))
      .map(e => {
        const s = cs(e);
        return { tag: e.tagName.toLowerCase(), fontSize: parseFloat(s.fontSize), lineHeight: s.lineHeight,
          letterSpacing: s.letterSpacing, fontFamily: s.fontFamily, color: s.color,
          width: e.getBoundingClientRect().width, chars: e.textContent.trim().length };
      });
    const styles = visible.map(cs);
    return {
      bodyBg: cs(doc.body).backgroundColor,
      htmlBg: cs(doc.documentElement).backgroundColor,
      viewportWidth: win.innerWidth,
      texts,
      radii: styles.map(s => s.borderTopLeftRadius).filter(v => v && v !== '0px'),
      gaps: styles.filter(s => /flex|grid/.test(s.display) && s.gap && !/^(normal|0px)/.test(s.gap)).map(s => s.gap),
      transitions: styles.filter(s => splitList(s.transitionDuration).some(d => parseFloat(d) > 0))
        .map(s => ({ property: s.transitionProperty, duration: s.transitionDuration, timing: s.transitionTimingFunction })),
    };
  }

  if (typeof module === 'object' && module.exports) module.exports = { analyze, collect };
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.body) {
    const report = analyze(collect(document, window));
    window.__aiSlop = report;
    console.log(`%cAI 티 검사 ${report.score}/${report.total}`, 'font-size:16px;font-weight:bold');
    console.table(report.results.map(r => ({ 항목: r.name,
      결과: r.pass === null ? '측정 불가' : r.pass ? '통과' : '고치기', 현재: r.found, 권장: r.fix })));
  }
})();
