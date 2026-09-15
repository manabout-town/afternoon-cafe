export const PRETENDARD = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
export const PLEX_MONO = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap';

export const STEPS = [
  { dir: '01-background', css: `
:root{--bg:#F6F5F2;--surface:#FBFAF8}
body{background:var(--bg)}
.menu-card{background:var(--surface)}` },
  { dir: '02-body-size', css: `
body{font-size:14px}
.meta{font-size:12px}
h3{font-size:16px}` },
  { dir: '03-line-height', css: `
body{line-height:1.6}
h1{line-height:1.1}
h2{line-height:1.2}
h3{line-height:1.35}` },
  { dir: '04-letter-spacing', css: `
body{letter-spacing:-0.011em}
h1{letter-spacing:-0.035em}
h2{letter-spacing:-0.025em}
.label{font-size:11px;letter-spacing:0.05em;text-transform:uppercase}` },
  { dir: '05-font', css: `
:root{--font-body:"Pretendard Variable",Pretendard,-apple-system,sans-serif;--font-display:var(--font-body);--font-mono:"IBM Plex Mono",ui-monospace,monospace}
body{font-family:var(--font-body)}
h1,h2{font-family:var(--font-display)}
.price,.label{font-family:var(--font-mono)}`,
    html: [['<!-- [5 폰트 링크] --><!-- [/5 폰트 링크] -->',
      `<!-- [5 폰트 링크] -->\n<link rel="stylesheet" href="${PRETENDARD}">\n<link rel="stylesheet" href="${PLEX_MONO}">\n<!-- [/5 폰트 링크] -->`]] },
  { dir: '06-text-color', css: `
:root{--ink:26,24,20;--on-ink:#F6F5F2}
body,h1,h2{color:rgba(var(--ink),.92)}
.hero p,.section p{color:rgba(var(--ink),.68)}
.price{color:rgba(var(--ink),.92)}
.section .meta,footer{color:rgba(var(--ink),.45)}
.btn-primary{background:rgb(var(--ink));color:var(--on-ink)}
.btn-ghost{background:transparent;color:rgba(var(--ink),.92);box-shadow:inset 0 0 0 1px rgba(var(--ink),.2)}`,
    html: [
      ['☕ 오후세시 커피</a>', '오후세시 커피</a>'],
      ['<h2>🌟 우리의 이야기</h2>', '<h2>우리의 이야기</h2>'],
      ['<h2>☕ 시그니처 메뉴</h2>', '<h2>시그니처 메뉴</h2>'],
      ['<h2>📍 오시는 길</h2>', '<h2>오시는 길</h2>'],
      ['🚀 메뉴 보러가기', '메뉴 보기'],
      ['📍 오시는 길 안내', '오시는 길'],
      ['🎉 지금 바로 예약하기', '예약하기'],
      ['<span class="icon">🥛</span> ', ''],
      ['<span class="icon">🫘</span> ', ''],
      ['<span class="icon">🍰</span> ', ''],
      [' ✨</h1>', '</h1>'],
      ['<p>✨ ', '<p>'],
    ] },
  { dir: '07-radius', css: `
:root{--r-sm:4px;--r-md:6px;--r-lg:8px}
.btn{border-radius:var(--r-md)}
.menu-card{border-radius:var(--r-lg)}
.menu-card img{border-radius:var(--r-sm)}
.map{border-radius:var(--r-lg)}` },
  { dir: '08-gap', css: `
.hero-actions{gap:8px}
.menu-grid{gap:12px}
.menu-card{gap:6px}
.info{gap:32px}` },
  { dir: '09-motion', css: `
:root{--ease-out:cubic-bezier(0,0,.2,1);--ease-expo:cubic-bezier(.16,1,.3,1)}
.btn{transition:background-color 160ms var(--ease-out),transform 160ms var(--ease-out)}
.btn:hover{transform:translateY(-1px)}
.menu-card{transition:transform 480ms var(--ease-expo)}
.menu-card:hover{transform:translateY(-2px)}
@media (prefers-reduced-motion:reduce){.btn,.menu-card{transition:none}}` },
  { dir: '10-reading-width', css: `
.container{max-width:1244px}
.hero p,.section p{max-width:36em}` },
];

// 완성본에서만: AI가 흔히 쓰는 빈 문구를 가게 이야기로 (PART 3 '한 번에 고치기'에서 설명)
export const AFTER_COPY = [
  ['당신의 일상에 특별함을 더하는 공간', '오후 세 시, 햇빛이 테이블 끝까지 들어오는 곳'],
  ['특별한 경험을 선사하는 프리미엄 스페셜티 커피 공간. 엄선된 원두와 정성 가득한 한 잔으로 여러분의 소중한 하루를 더욱 빛나게 만들어 드립니다.',
    '망원동 골목 끝 작은 로스터리입니다. 화요일과 금요일에 원두를 볶고, 볶은 지 사흘 지난 원두만 씁니다.'],
  ['혁신적인 커피 경험을 통해 고객 여러분께 최고의 가치를 제공하기 위해 끊임없이 노력하고 있습니다. 언제든지 편하게 방문해 주세요!',
    '창가 자리는 예약 없이 먼저 오시는 순서대로 앉으실 수 있습니다.'],
];
