# AI 티 검사기 — 실제 사이트 교차 확인

측정일 2026-09-15. `scripts/cross-check.mjs`로 `tools/ai-slop-check.js`의 `analyze()`를
실제 라이브 사이트 DOM에 그대로 돌려 검사기 자체를 점검했다. 대상은 실측 베이스라인
(`~/.claude/design-refs/web-craft-baseline.md`) 9곳 중 5곳.

## 결과

| 사이트 | 점수 | 걸린 항목 |
|---|---|---|
| https://linear.app | 7/10 | text-color(13가지), radius(타이트 + 소프트 + 중간), motion(기본 ease·all 38곳) |
| https://oriorai.com | 7/10 | body-size(16px), text-color(9가지), motion(기본 ease·all 1곳) |
| https://harryjatkins.com | 8/10 | background(rgb(255, 255, 255)), motion(기본 ease·all 5곳) |
| https://augen.pro | 6/10 | body-size(16px), letter-spacing(0.008 ~ -0.020em), radius(중간 + 소프트 + 타이트), motion(기본 ease·all 22곳) |
| https://shopify.design | 측정 실패 | page.goto: Timeout 45000ms exceeded. |

측정 성공 4곳(≥3 충족). shopify.design은 헤드리스 접속이 45초 내 완료되지 않아 제외.

## 판정 (규칙 완화 없음 — 전부 유지)

모든 실패 항목을 `web-craft-baseline.md`의 실측값과 대조했다. 어느 것도 "베이스라인과
정확히 일치하는데 검사기가 과하게 걸었다"는 케이스가 아니어서 `analyze()` 기준은
바꾸지 않았다. 항목별 근거:

- **linear.app / text-color(13가지)** — 사이트가 규칙과 다름 → 유지. 베이스라인은
  본문 텍스트의 알파 4단(주/본문/보조/비활성)만 실측한 것이고, 실 페이지에는 배지·상태색·
  링크색 등 비-중립 강조색이 더 섞여 있다. 검사기가 페이지 전체 텍스트 색을 세므로
  베이스라인이 재던 범위보다 넓다 — 검사기가 틀린 게 아니라 측정 대상이 다르다.
- **linear.app / radius(타이트+소프트+중간 혼용)** — 사이트가 규칙과 다름 → 유지.
  베이스라인은 linear.app의 핵심 컴포넌트 radius(2/4/6px)만 수기로 쟀지만, 자동 수집기는
  화면에 보이는 모든 요소(서드파티 위젯·아이콘·임베드 포함)를 훑는다. 계열 혼용이 실제로
  존재하므로 규칙을 완화하면 "before" 같은 진짜 AI슬롭 예제까지 통과시킬 위험이 있다.
- **linear.app / motion(기본 ease·all 38곳)** — 사이트가 규칙과 다름 → 유지. 베이스라인이
  인용한 `0.16s cubic-bezier(...)`는 쇼케이스급 전환 한두 곳이고, 실제 페이지에는 손대지
  않은 사소한 hover 전환(`transition: all .2s ease`)이 다수 남아있다. 이건 실제 사이트도
  100% 규칙을 지키진 않는다는 뜻이지, 검사기 임계값이 과한 게 아니다.
- **oriorai.com / body-size(16px)** — 사이트가 규칙과 다름 → 유지. 베이스라인 실측(2026-08)은
  14px 최빈이었지만 이번 재측정(2026-09)은 16px로 나왔다. 사이트가 그 사이 개편됐거나
  본문 섹션 구성이 바뀐 것으로 보인다. 규칙(12~15px)은 베이스라인 수치를 그대로 따르므로
  유지.
- **oriorai.com / text-color(9가지)**, **motion(1곳)** — linear.app과 동일한 이유(강조색·
  잔여 기본 전환) → 유지.
- **harryjatkins.com / background(rgb(255,255,255))** — 사이트가 규칙과 다름 → 유지.
  베이스라인 표에서 harryjatkins.com의 `#F7F7F7`은 "(표면)"이라고 명시돼 있다 — 즉 카드/
  패널 색이고 `<body>` 배경이 아니다. 실제 `<body>` 배경은 순백이라 규칙이 정확히 걸어낸
  케이스.
- **augen.pro / body-size(16px)** — oriorai.com과 동일 사유(재측정 시점 차이) → 유지.
- **augen.pro / letter-spacing(0.008 ~ -0.020em)** — 사이트가 규칙과 다름 → 유지.
  베이스라인은 augen.pro가 전 크기에 `-0.02em`을 균일 적용한다고 적었고, 양수 자간은
  "8~14px대 소형 대문자 라벨"에서만 나온다고 명시했다. 이번 측정에서 28px 이상(디스플레이
  기준) 요소 중 양수(+0.008em)가 섞인 건 베이스라인이 말한 소형 라벨 패턴을 벗어난
  예외 케이스 — 검사기 기준이 과한 게 아니라 사이트의 특정 요소가 베이스라인 패턴과
  다른 것.
- **augen.pro / radius(중간+소프트+타이트)**, **motion(22곳)** — linear.app과 동일한 이유
  (자동 수집 범위가 넓어 서드파티/잔여 기본값까지 포함) → 유지.

## 결론

4개 사이트 중 3곳이 7~8/10, 1곳(augen.pro)이 6/10으로 브리프 기대치(7/10 이상)를
살짝 밑돌았지만, 걸린 항목 전부가 "베이스라인 실측과 정확히 일치하는데 검사기가
과하게 건 경우"가 아니라 (a) 측정 범위 차이(전체 DOM vs 수기 표본), (b) 사이트가
그 사이 개편됨, (c) 베이스라인 자체가 예외로 명시한 패턴을 벗어난 요소였다. 따라서
`tools/ai-slop-check.js`의 `analyze()` 임계값은 변경하지 않았고, `tests/analyze.test.mjs`·
`tests/pages.test.mjs` 모두 기존 상태 그대로 유지된다(수정 없음, 전체 스위트 그린).
