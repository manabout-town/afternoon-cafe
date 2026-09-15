# AI 티 검사기 — 실제 사이트 교차 확인

측정일 2026-09-15 (1차), 규칙 수정 후 재측정 2026-09-15 (2차, fix round 1),
대상 확장 재측정 2026-09-15 (3차, 규칙 변경 없음).
`scripts/cross-check.mjs`로 `tools/ai-slop-check.js`의 `analyze()`를 실제 라이브 사이트
DOM에 그대로 돌려 검사기 자체를 점검했다(Chromium, 1440×900). 대상은 작성자 실측 노트(2026-08)의
9곳. 1·2차는 그중 5곳, 3차는 avara.xyz(자동 접속 시 403)를 뺀 나머지 9곳 전부를 돌렸다.
최종 결과는 맨 아래 "3차 결과".

## 1차 결과 (규칙 완화 전)

| 사이트 | 점수 | 걸린 항목 |
|---|---|---|
| https://linear.app | 7/10 | text-color(13가지), radius(타이트 + 소프트 + 중간), motion(기본 ease·all 38곳) |
| https://oriorai.com | 7/10 | body-size(16px), text-color(9가지), motion(기본 ease·all 1곳) |
| https://harryjatkins.com | 8/10 | background(rgb(255, 255, 255)), motion(기본 ease·all 5곳) |
| https://augen.pro | 6/10 | body-size(16px), letter-spacing(0.008 ~ -0.020em), radius(중간 + 소프트 + 타이트), motion(기본 ease·all 22곳) |
| https://shopify.design | 측정 실패 | page.goto: Timeout 45000ms exceeded. |

1차 리뷰에서 text-color·motion 판정이 실측 근거 없이 "서드파티 위젯", "쇼케이스 한두 곳"
같은 추측으로 적혀 있다는 지적을 받았다. 실제로 코드를 뜯어보니 두 규칙 자체에 결함이
있었다 — 아래 "규칙 수정"에서 다룬다.

## 규칙 수정 (2차: fix round 1)

### text-color — 알파만 다른 같은 색을 다른 색으로 셌다

`tools/ai-slop-check.js`의 기존 로직은 `t.color` 문자열을 그대로 키로 썼다. 즉
`rgba(26,24,20,0.68)`과 `rgba(26,24,20,0.92)`처럼 **알파만 다른 같은 색**도 서로 다른
항목으로 집계됐다. 게다가 등장 횟수(`n >= 2`)로만 걸러서, 화면 어딘가에 2번 이상 쓰인
아주 작은 비중의 색도 그대로 카운트에 들어갔다.

linear.app을 문자수 가중으로 재보면 상위 4개 색이 정확히 베이스라인 §6의 4단계
(주/본문/보조/비활성, `208,214,224` 35.1% · `138,143,152` 34.8% · `98,102,109` 9.5% ·
`247,248,248` 9.0%)와 일치했다. 나머지는 배지·태그 색 등 3% 미만 강조색이었다.
oriorai.com은 더 심했다 — Chrome이 `getComputedStyle`에서 일부 색을 `oklab(...)`로
반환하는데, 기존 정규식(`parseColor`)이 `rgb()/rgba()`만 파싱해서 oklab 색은 **알파값까지
포함한 문자열 그대로** 키가 됐다. 그 결과 `oklab(0.973071 ... / 0.4)`, `.../0.5)`,
`.../0.75)`, `.../0.8)`가 같은 색의 네 가지 다른 알파인데도 서로 다른 "색"으로 잡혀
9가지로 부풀었다.

**변경**: 알파-0(완전 투명) 색은 무시. `rgb()/rgba()`는 기존처럼 RGB로 묶고, 그 외
색 함수(`oklab`/`oklch`/`lab` 등)는 문자열에서 `/ 알파)` 부분만 잘라내 베이스로 묶는다.
문자수 3% 미만인 그룹은 카운트에서 제외. 그룹이 5개를 넘으면 실패. `found`는
`${n}가지 색 계열`.

**판정: 기준 과함 → 완화(알파만 다른 색을 같은 계열로 묶고, 3% 미만 강조색 무시)**

### motion — 단 1건의 `ease`나 `all`만으로도 무조건 실패했다

기존 로직은 `transition: all .2s ease-out` 같은 항목이 페이지에 **단 1건**만 있어도
`bad.length === 0`이 깨져 무조건 실패였다. 게다가 `property`에 `all`이 들어있다는
이유만으로도 실패 처리했는데, `all 0.16s cubic-bezier(.16,1,.3,1)`처럼 곡선 자체는
좋은 값이어도 걸렸다. 실측해보니 harryjatkins.com조차 `padding-left, padding-right`
전환 2건이 `ease`였고(나머지 71건은 `cubic-bezier(.16,1,.3,1)`), linear.app은 338건 중
`property: all`이 다수 있었지만 타이밍 자체는 `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
(베이스라인이 인용한 값과 동일 계열)이었다 — `all` 사용 자체가 아니라 "기본값 방치"가
문제인데 기존 규칙은 이 둘을 구분하지 못했다.

**변경**: `all` 조건 삭제. `bad` = 타이밍에 `ease`가 포함되거나 지속시간이 1초를
넘는 전환. 전체 대비 `bad` 비율이 25% 이상일 때만 실패. `found`는
`기본 ease ${bad}/${total}곳 (${pct}%)`.

**판정: 기준 과함 → 완화(단일 occurrence 무조건 실패 → 25% 이상 비율 기준, `all` 조건 삭제)**

### 테스트 (test-first)

`tests/analyze.test.mjs`에 아래를 먼저 추가해 RED 확인 후 위 두 규칙을 고쳐 GREEN
확인했다.

- 같은 색의 알파 차이 + 3% 미만 강조색 → text-color 통과
- `oklab(...)` 알파만 다른 3개 → text-color 통과 (그룹 1개)
- 비중 있는 6개 이상 색 계열 → text-color 실패(유지 확인)
- 10건 중 1건만 `ease` → motion 통과
- 4건 중 4건 `ease` → motion 실패
- 기존 `property: 'all', timing: 'linear'` 단일 케이스 — 실패 기대값을 **통과**로 수정

RED (analyze() 수정 전, `tests/analyze.test.mjs`만 실행):
```
node --test tests/analyze.test.mjs
✔ 글자색: 같은 색의 투명도 차이는 한 계열로 묶고, 전체의 3% 미만인 강조색은 무시
✔ 글자색: rgb() 외 색 함수(oklab 등)도 알파만 다르면 한 계열로 묶는다
✖ 글자색: 비중 있는 서로 다른 색 계열이 6가지 이상이면 실패
✖ 움직임: 기본 ease 비율 25% 이상이면 실패, all은 더 이상 걸지 않음, cubic-bezier 쉼표는 안 쪼갬
✖ 움직임: ease가 25% 미만이면 통과, 25% 이상이면 실패
ℹ tests 14
ℹ pass 11
ℹ fail 3
```
(앞의 두 통과 케이스는 기존 문자열-키 로직에서도 우연히 같은 결과가 나온 경우이고,
실패 3건이 새 그룹핑·비율 로직을 요구하는 핵심 RED였다.)

GREEN (analyze() 수정 후, 전체 스위트):
```
node --test "tests/*.test.mjs"
ℹ tests 64
ℹ pass 64
ℹ fail 0
```

`tests/pages.test.mjs`의 before·steps 01~10·after·quickstart·tailwind/after·styles 4종
전부 기존과 동일한 누적 통과 집합을 유지했다 (변경 없이 그린).

## 2차 결과 (규칙 수정 후 재측정)

| 사이트 | 점수 | 걸린 항목 |
|---|---|---|
| https://linear.app | 9/10 | radius(타이트 + 소프트 + 중간) |
| https://oriorai.com | 9/10 | body-size(16px) |
| https://harryjatkins.com | 9/10 | background(rgb(255, 255, 255)) |
| https://augen.pro | 6/10 | body-size(16px), letter-spacing(0.008 ~ -0.020em), radius(중간 + 소프트 + 타이트), motion(기본 ease 22/22곳 (100%)) |
| https://shopify.design | 측정 실패 | page.goto: Timeout 45000ms exceeded. |

측정 성공 4곳 중 3곳이 9/10, augen.pro만 6/10. shopify.design은 두 차례 모두 45초 내
접속 실패로 제외(요구치 ≥3 성공은 충족).

## 남은 실패 항목 판정 (측정값 기반, 추측 없음)

- **linear.app / radius(타이트+소프트+중간 혼용)** — 사이트가 규칙과 다름 → 유지.
  실측: border-radius가 있는 요소 239개 중 타이트(≤8px) 76개, 소프트(≥12px) 35개,
  중간 18개로 세 계열이 실제로 공존한다. 자동 수집기가 페이지 전체 DOM을 훑어
  베이스라인이 손으로 잰 핵심 컴포넌트(2/4/6px)보다 넓은 범위(아이콘·배지·임베드 등)를
  포함하기 때문으로 보이나, 어느 요소가 서드파티인지는 개별 확인하지 않았다 — 원인은
  "측정 범위가 넓다"까지만 확인, 그 이상은 원인 미확인.
- **oriorai.com / body-size(16px)** — 사이트가 규칙과 다름 → 유지. 실측(문자수 가중):
  16px 326자, 13px 160자, 14px 23자로 16px가 최빈. 베이스라인 2026-08 실측(14px×13+7+5)과
  다르다. 사이트가 그 사이 바뀐 것인지 베이스라인 당시 측정 방식 차이인지는 원인 미확인 —
  책에는 "베이스라인 실측 이후 사이트가 바뀌었을 수 있다"는 한계로만 적는다.
- **harryjatkins.com / background(rgb(255,255,255))** — 사이트가 규칙과 다름 → 유지.
  베이스라인 표 자체가 harryjatkins.com의 `#F7F7F7`을 "(표면)"이라고 명시했다 — 즉
  카드/패널 색이지 `<body>` 배경이 아니다. 실측 `<body>` 배경은 순백이라 규칙이
  정확히 걸어낸 것.
- **augen.pro / body-size(16px)** — 사이트가 규칙과 다름 → 유지. 실측: 16px 1112자,
  27px 282자, 14px 225자로 16px가 압도적 최빈. oriorai.com과 같은 이유로 원인 미확인
  (베이스라인 이후 변경 가능성).
- **augen.pro / letter-spacing(0.008 ~ -0.020em)** — 사이트가 규칙과 다름 → 유지.
  실측: 140px 히어로 텍스트("Invisible Approach")가 `letter-spacing: 1.12px` = `+0.008em`.
  베이스라인은 augen.pro가 전 크기에 `-0.02em`을 균일 적용한다고 적었고 양수 자간은
  소형 라벨 전용이라고 명시했는데, 140px 대형 히어로에 양수 자간이 실제로 쓰이고 있다 —
  베이스라인 서술과 다른 예외 사례로 기록.
- **augen.pro / radius(3계열 혼용)** — linear.app과 동일 사유(측정 범위) → 유지.
- **augen.pro / motion(기본 ease 22/22곳, 100%)** — 사이트가 규칙과 다름 → 유지.
  진짜 이상치. 22건 전 전환이 `ease, ease`(opacity/visibility, background-color/color 등)이고
  25% 완화 기준을 적용해도 100%라 실패. 다른 3개 사이트는 완화 후 전부 통과했는데
  augen.pro만 전 구간이 기본값이다 — 규칙 문제가 아니라 이 사이트가 실제로 모션을
  커스터마이징하지 않은 것.

## 3차 결과 (대상 확장, 2026-09-15, 규칙·기준값 변경 없음)

2차까지 빠져 있던 interfere.com, becaneparis.com, dirtverse.co, podium.global을 `SITES`에
추가해 같은 스크립트로 한 번에 다시 돌렸다. avara.xyz는 자동 접속에서 403이 나와 계속 제외.

| 사이트 | 점수 | 걸린 항목 |
|---|---|---|
| https://linear.app | 9/10 | radius(타이트 + 소프트 + 중간) |
| https://oriorai.com | 9/10 | body-size(16px) |
| https://harryjatkins.com | 9/10 | background(rgb(255, 255, 255)) |
| https://augen.pro | 6/10 | body-size(16px), letter-spacing(0.008 ~ -0.020em), radius(중간 + 소프트 + 타이트), motion(기본 ease 22/22곳 (100%)) |
| https://shopify.design | 측정 실패 | page.goto: Timeout 45000ms exceeded. |
| https://interfere.com | 5/10 | background(rgb(255, 255, 255)), line-height(최대 1.29배), letter-spacing(-0.010 ~ -0.051em), radius(타이트 + 소프트 + 중간), reading-width(가장 넓은 문단 1054px) |
| https://becaneparis.com | 7/10 | body-size(8px), letter-spacing(0.000 ~ 0.000em), motion(기본 ease 2/2곳 (100%)) |
| https://dirtverse.co | 6/10 | background(rgb(255, 255, 255)), body-size(20px), letter-spacing(0.000 ~ 0.000em), radius(타이트 + 중간) |
| https://podium.global | 7/10 | background(rgb(0, 0, 0)), body-size(16px), letter-spacing(0.000 ~ 0.000em) |

**요약**: 측정 성공 8곳 — 9점 3곳(linear, oriorai, harryjatkins), 7점 2곳(becaneparis,
podium), 6점 2곳(augen, dirtverse), 5점 1곳(interfere). 10점은 없다. shopify.design은 세
차례 모두 45초 안에 열리지 않아 제외. 앞의 4곳은 2차와 점수·걸린 항목이 같다.

### 새로 넣은 4곳 판정 (2026-09-15 측정값, 추측 없음)

같은 조건(1440×900)에서 `getComputedStyle`로 세부 값을 따로 뽑아 확인했다.

- **interfere.com / background(순백)** — 사이트가 바뀜 → 규칙 유지. 2026-08 노트는 다크
  `oklch(0.15 0 0)`였는데, 이번에는 `<body>`·`<html>` 배경이 모두 `rgb(255,255,255)`로 나왔다.
- **interfere.com / line-height(1.29배)** — 사이트가 규칙과 다름 → 유지. 28px 소제목이
  `line-height: 36px`(1.29배). 56~59px 큰 제목은 1.0배로 통과 범위.
- **interfere.com / letter-spacing(-0.051em)** — **검사기 한계(원인 확인)** → 이번 판에서는 수정 안 함.
  Chrome이 이 사이트의 큰 제목 자간을 `-2%`, `-3%`처럼 퍼센트로 돌려주는데, 검사기는
  `parseFloat`로 숫자만 떼어 px로 계산한다. `-3% ÷ 59px`가 `-0.051em`으로 잡혀 범위를 벗어났지만,
  실제 값은 `-0.03em`으로 권장 범위 안이다. 퍼센트 자간 처리는 다음 개정 후보로 남긴다.
- **interfere.com / radius(3계열)** — linear.app과 같은 사유(측정 범위) → 유지. 타이트 218개,
  소프트 14개, 중간 14개.
- **interfere.com / reading-width(1054px)** — 사이트가 규칙과 다름 → 유지. 가장 넓은 문단은
  알림처럼 보이는 문장("Interfere detected a surge in failed pas…")으로 폭 1054px.
- **becaneparis.com / body-size(8px)** — 사이트가 규칙과 다름 → 유지. 20자 이상인 글자 덩어리가
  8px 21자 하나뿐이라 그 값이 최빈값이 됐다. 2026-08 노트(8px)와 같다.
- **becaneparis.com / letter-spacing(0)** — 사이트가 규칙과 다름 → 유지. 30px 제목 2개가
  `letter-spacing: normal`.
- **becaneparis.com / motion(2/2 ease)** — 사이트가 규칙과 다름 → 유지. 전환 2건이 모두
  `transform | ease`. 표본이 2건뿐이라는 점은 함께 적는다.
- **dirtverse.co / background(순백)** — 사이트가 바뀜 → 유지. 2026-08 노트는 `#F2F2EF`였는데,
  이번에는 `<body>`·`<html>` 배경이 모두 투명(`rgba(0,0,0,0)`)이라 브라우저 기본값인 흰색으로 판정됐다.
- **dirtverse.co / body-size(20px)** — 사이트가 바뀜 → 유지. 문자수 가중 20px 216자, 10px 179자,
  15px 120자. 2026-08 노트는 13px.
- **dirtverse.co / letter-spacing(0)** — 사이트가 규칙과 다름 → 유지. 40px 제목이 `normal`.
- **dirtverse.co / radius(타이트+중간)** — 사이트가 규칙과 다름 → 유지. 타이트 49개, 중간 1개.
- **podium.global / background(순검정)** — 규칙이 정확히 걸어냄 → 유지. 2026-08 노트에도
  `rgb(0,0,0)`으로 적혀 있고, 책은 "순검정은 강한 인상을 노린 표현형 사이트의 선택"으로 설명한다.
- **podium.global / body-size(16px)** — 사이트가 바뀜 → 유지. 16px 360자, 12px 92자. 2026-08 노트는 12px.
- **podium.global / letter-spacing(0)** — 사이트가 규칙과 다름 → 유지. 62px 제목이 `normal`.

"사이트가 바뀜"은 2026-08 노트와 이번 값이 다르다는 사실까지만 뜻한다. 그사이 개편인지
재는 방식 차이인지는 확인하지 못했다.

### 2026-08 노트와 달라진 점 (실측 유통기한)

- **본문 크기**: 8월 노트에서는 9곳 모두 16px 미만이었다. 9월 측정에서는 성공한 8곳 중
  oriorai.com(16px), augen.pro(16px), podium.global(16px), dirtverse.co(20px) 4곳이 16px 이상으로 나왔다.
- **배경**: 8월 노트의 라이트 모드 body 배경 중 순백은 0곳이었다(harryjatkins.com의 `#F7F7F7`은
  표면 색이라 제외). 9월에는 dirtverse.co가 흰색으로 판정됐고, 다크였던 interfere.com도 흰 배경으로 나왔다.
- 책에서는 8월 수치를 "(2026-08 기록)"으로 날짜를 붙여 인용하고, 이 변화는 PART 3의 3.1에 적는다.

## 결론

- **완화한 규칙**: text-color(알파 무시 + 그룹핑 + 3% 임계값), motion(비율 기준 25%,
  `all` 조건 삭제). 두 규칙 모두 실측 근거로 RED→GREEN 확인 후 `tools/ai-slop-check.js`에
  반영, 기존 61개 테스트를 포함한 전체 스위트 그린 유지.
- **유지한 규칙**: background, body-size, letter-spacing, radius. 실패 항목 전부 측정값을
  직접 인용해 판정했으며, 추측성 서술("서드파티 위젯이라서", "사이트 개편일 것이다")은
  전부 "원인 미확인"으로 정정했다.
- **책에 쓸 수 있는 한계 두 가지**: (1) augen.pro는 여전히 진짜 아웃라이어 —
  본문 16px·모션 22/22 기본 ease·140px 히어로 양수 자간까지, 규칙을 완화해도 걸리는
  사이트가 있다는 걸 보여주는 좋은 예. (2) 베이스라인(2026-08)과 이번 재측정(2026-09)
  사이에 oriorai.com·augen.pro의 본문 크기가 14px→16px로 달라졌다 — 라이브 사이트는
  계속 바뀌므로 "실측"도 유통기한이 있다는 한계로 밝힌다.
- **3차(대상 확장)**: 기준값은 그대로 두고 8곳을 쟀다. 새로 걸린 항목은 대부분 사이트 쪽 선택이거나
  2026-08 이후 달라진 값이다. 검사기 쪽 문제로 확인된 것은 퍼센트 자간(interfere.com) 1건이며, 이번 판에서는
  기록만 하고 고치지 않았다.
