/* 🩷 하츄핑 따라그리기 — 도안 데이터
   600x600 좌표계의 벡터 도안 6종.
   각 도안은 4단계(steps)와 색칠 도우미(coloring)로 구성된다.
*/
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  const n = (v) => String(Math.round(v * 100) / 100);
  const P = (d, cls) => '<path d="' + d + '"' + (cls ? ' class="' + cls + '"' : '') + '/>';
  const C = (cx, cy, r, cls) =>
    '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(r) + '"' + (cls ? ' class="' + cls + '"' : '') + '/>';
  const E = (cx, cy, rx, ry, cls) =>
    '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(rx) + '" ry="' + n(ry) + '"' + (cls ? ' class="' + cls + '"' : '') + '/>';

  // 하트 모양 path
  function heartD(cx, cy, s) {
    return (
      'M' + n(cx) + ',' + n(cy + s * 0.8) +
      ' C' + n(cx - s * 0.2) + ',' + n(cy + s * 0.5) + ' ' + n(cx - s) + ',' + n(cy + s * 0.06) + ' ' + n(cx - s * 0.56) + ',' + n(cy - s * 0.44) +
      ' C' + n(cx - s * 0.28) + ',' + n(cy - s * 0.76) + ' ' + n(cx) + ',' + n(cy - s * 0.52) + ' ' + n(cx) + ',' + n(cy - s * 0.3) +
      ' C' + n(cx) + ',' + n(cy - s * 0.52) + ' ' + n(cx + s * 0.28) + ',' + n(cy - s * 0.76) + ' ' + n(cx + s * 0.56) + ',' + n(cy - s * 0.44) +
      ' C' + n(cx + s) + ',' + n(cy + s * 0.06) + ' ' + n(cx + s * 0.2) + ',' + n(cy + s * 0.5) + ' ' + n(cx) + ',' + n(cy + s * 0.8) + ' Z'
    );
  }

  // 별 모양 path
  function starD(cx, cy, R, r, rot) {
    r = r || R * 0.48;
    rot = rot === undefined ? -Math.PI / 2 : rot;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? R : r;
      const a = rot + (i * Math.PI) / 5;
      pts.push(n(cx + Math.cos(a) * rad) + ',' + n(cy + Math.sin(a) * rad));
    }
    return 'M' + pts.join(' L') + ' Z';
  }

  // 반짝이(4갈래)
  function sparkD(cx, cy, r) {
    const k = r * 0.16;
    return (
      'M' + n(cx) + ',' + n(cy - r) +
      ' Q' + n(cx + k) + ',' + n(cy - k) + ' ' + n(cx + r) + ',' + n(cy) +
      ' Q' + n(cx + k) + ',' + n(cy + k) + ' ' + n(cx) + ',' + n(cy + r) +
      ' Q' + n(cx - k) + ',' + n(cy + k) + ' ' + n(cx - r) + ',' + n(cy) +
      ' Q' + n(cx - k) + ',' + n(cy - k) + ' ' + n(cx) + ',' + n(cy - r) + ' Z'
    );
  }

  // 리본 모양 path (도장용)
  function ribbonD(cx, cy, s) {
    return (
      'M' + n(cx) + ',' + n(cy) +
      ' C' + n(cx - s * 0.3) + ',' + n(cy - s * 0.45) + ' ' + n(cx - s) + ',' + n(cy - s * 0.55) + ' ' + n(cx - s * 1.05) + ',' + n(cy - s * 0.2) +
      ' C' + n(cx - s * 1.1) + ',' + n(cy + s * 0.18) + ' ' + n(cx - s * 0.45) + ',' + n(cy + s * 0.32) + ' ' + n(cx) + ',' + n(cy + s * 0.12) +
      ' C' + n(cx + s * 0.45) + ',' + n(cy + s * 0.32) + ' ' + n(cx + s * 1.1) + ',' + n(cy + s * 0.18) + ' ' + n(cx + s * 1.05) + ',' + n(cy - s * 0.2) +
      ' C' + n(cx + s) + ',' + n(cy - s * 0.55) + ' ' + n(cx + s * 0.3) + ',' + n(cy - s * 0.45) + ' ' + n(cx) + ',' + n(cy) + ' Z'
    );
  }

  // 구름 모양 path (등 3개 + 평평한 바닥)
  function cloudD(cx, cy, w, h) {
    const L = cx - w / 2, R = cx + w / 2, B = cy + h / 2, T = cy - h / 2;
    return (
      'M' + n(L + w * 0.08) + ',' + n(B) +
      ' C' + n(L - w * 0.02) + ',' + n(B - h * 0.12) + ' ' + n(L - w * 0.02) + ',' + n(B - h * 0.5) + ' ' + n(L + w * 0.14) + ',' + n(B - h * 0.52) +
      ' C' + n(L + w * 0.1) + ',' + n(T + h * 0.1) + ' ' + n(L + w * 0.34) + ',' + n(T - h * 0.02) + ' ' + n(L + w * 0.46) + ',' + n(T + h * 0.3) +
      ' C' + n(L + w * 0.56) + ',' + n(T - h * 0.02) + ' ' + n(L + w * 0.86) + ',' + n(T + h * 0.2) + ' ' + n(R - w * 0.1) + ',' + n(B - h * 0.5) +
      ' C' + n(R + w * 0.02) + ',' + n(B - h * 0.48) + ' ' + n(R + w * 0.02) + ',' + n(B - h * 0.1) + ' ' + n(R - w * 0.08) + ',' + n(B) +
      ' Z'
    );
  }

  // 웃는 입(ω)
  const smile = (cx, cy, w) => {
    const ww = w / 2;
    return (
      'M' + n(cx - ww) + ',' + n(cy) +
      ' C' + n(cx - ww * 0.72) + ',' + n(cy + ww * 0.75) + ' ' + n(cx - ww * 0.22) + ',' + n(cy + ww * 0.8) + ' ' + n(cx) + ',' + n(cy + ww * 0.16) +
      ' C' + n(cx + ww * 0.22) + ',' + n(cy + ww * 0.8) + ' ' + n(cx + ww * 0.72) + ',' + n(cy + ww * 0.75) + ' ' + n(cx + ww) + ',' + n(cy)
    );
  };

  // 볼 터치
  const blush = (cx, cy) =>
    P('M' + n(cx - 14) + ',' + n(cy + 4) + ' L' + n(cx - 6) + ',' + n(cy - 5), 'thin') +
    P('M' + n(cx - 4) + ',' + n(cy + 6) + ' L' + n(cx + 4) + ',' + n(cy - 3), 'thin') +
    P('M' + n(cx + 6) + ',' + n(cy + 7) + ' L' + n(cx + 14) + ',' + n(cy - 2), 'thin');

  // 큰 눈 (윤곽 + 눈동자 + 반짝)
  function eyes(cx1, cx2, cy, rx, ry) {
    const pr = Math.min(rx, ry) * 0.46;
    const hr = Math.max(2.6, rx * 0.19);
    return (
      E(cx1, cy, rx, ry) +
      E(cx2, cy, rx, ry) +
      C(cx1, cy + ry * 0.06, pr, 'pupil') +
      C(cx2, cy + ry * 0.06, pr, 'pupil') +
      C(cx1 + rx * 0.28, cy - ry * 0.26, hr, 'shine') +
      C(cx2 + rx * 0.28, cy - ry * 0.26, hr, 'shine')
    );
  }

  /* ---------- 도안 A : 하츄핑 ---------- */
  const HEAD_A =
    'M300,292 C258,262 196,236 178,190 C164,152 186,116 224,112 C252,109 276,126 300,152 ' +
    'C324,126 348,109 376,112 C414,116 436,152 422,190 C404,236 342,262 300,292 Z';
  const DRESS_A = 'M274,302 C264,328 248,364 238,404 C270,420 330,420 362,404 C352,364 336,328 326,302 Z';
  const ARM_L_A = 'M264,308 C244,330 232,352 228,368';
  const ARM_R_A = 'M336,308 C356,330 368,352 372,368';
  const WING_L_A = 'M250,300 C224,268 186,262 172,282 C158,302 178,318 196,326 C212,332 232,318 250,304 Z';
  const WING_R_A = 'M350,300 C376,268 414,262 428,282 C442,302 422,318 404,326 C388,332 368,318 350,304 Z';

  const guideA = {
    id: 'hatchuping',
    name: '하츄핑',
    emoji: '🩷',
    tag: '기본 요정',
    steps: [
      {
        label: '얼굴·몸 윤곽',
        tip: '하트 모양 얼굴을 크게 그려 봐요',
        art:
          P(HEAD_A) +
          P(DRESS_A) +
          P(ARM_L_A) +
          P(ARM_R_A) +
          C(226, 374, 8, 'thin') +
          C(374, 374, 8, 'thin') +
          P('M282,418 L278,458') +
          P('M318,418 L322,458') +
          E(270, 463, 13, 7, 'thin') +
          E(330, 463, 13, 7, 'thin'),
      },
      {
        label: '큰 눈·입',
        tip: '반짝반짝 큰 눈을 그려 봐요',
        art:
          eyes(252, 348, 190, 26, 30) +
          P(smile(300, 234, 30)) +
          blush(226, 238) +
          blush(376, 238),
      },
      {
        label: '리본·하트 장식',
        tip: '머리 리본과 하트를 더해요',
        art:
          P('M298,100 C268,80 244,74 238,90 C232,106 260,114 298,108') +
          P('M302,100 C332,80 356,74 362,90 C368,106 340,114 302,108') +
          E(300, 104, 13, 12, 'thin') +
          P('M292,114 C282,132 274,144 266,152') +
          P('M308,114 C318,132 326,144 334,152') +
          P(WING_L_A) +
          P(WING_R_A) +
          P(heartD(186, 234, 15), 'thin') +
          P(heartD(414, 234, 15), 'thin') +
          P(heartD(300, 352, 22), 'thin') +
          P(sparkD(150, 150, 18), 'thin') +
          P(sparkD(452, 176, 14), 'thin'),
      },
      {
        label: '예쁘게 색칠',
        tip: '좋아하는 색으로 꾸며 봐요',
        art: '',
      },
    ],
    coloring:
      '<path d="' + HEAD_A + '" fill="#ffc9e0" stroke="none"/>' +
      '<path d="' + DRESS_A + '" fill="#d9c9ff" stroke="none"/>' +
      '<path d="' + WING_L_A + '" fill="#fff0f9" stroke="none"/>' +
      '<path d="' + WING_R_A + '" fill="#fff0f9" stroke="none"/>' +
      '<path d="' + heartD(186, 234, 15) + '" fill="#ff8fbb" stroke="none"/>' +
      '<path d="' + heartD(414, 234, 15) + '" fill="#ff8fbb" stroke="none"/>' +
      '<path d="' + heartD(300, 352, 22) + '" fill="#ff7fb0" stroke="none"/>' +
      '<ellipse cx="270" cy="463" rx="13" ry="7" fill="#ffd8b8" stroke="none"/>' +
      '<ellipse cx="330" cy="463" rx="13" ry="7" fill="#ffd8b8" stroke="none"/>',
  };

  /* ---------- 도안 B : 반짝별 요정핑 ---------- */
  const STAR_B = starD(300, 172, 118, 57);
  const DRESS_B = 'M274,268 C266,300 254,338 246,378 C278,394 322,394 354,378 C346,338 334,300 326,268 Z';

  const guideB = {
    id: 'star',
    name: '반짝별 요정핑',
    emoji: '⭐',
    tag: '별 요정',
    steps: [
      {
        label: '별 얼굴·몸 윤곽',
        tip: '뾰족뾰족 별 얼굴을 그려 봐요',
        art:
          P(STAR_B) +
          P(DRESS_B) +
          P('M264,292 C244,312 232,336 228,356') +
          P('M336,292 C356,312 368,336 372,356') +
          C(226, 362, 8, 'thin') +
          C(374, 362, 8, 'thin') +
          P('M284,388 L282,422') +
          P('M316,388 L318,422') +
          E(276, 427, 12, 6, 'thin') +
          E(324, 427, 12, 6, 'thin'),
      },
      {
        label: '큰 눈·입',
        tip: '별 가운데에 큰 눈을 그려요',
        art:
          eyes(281, 319, 170, 15, 19) +
          P(smile(300, 200, 20)) +
          P(sparkD(300, 128, 9), 'thin'),
      },
      {
        label: '요술봉·반짝이',
        tip: '요술봉과 반짝이를 더해요',
        art:
          P('M376,358 L398,300') +
          P(starD(402, 288, 21, 9)) +
          P(sparkD(196, 148, 20), 'thin') +
          P(sparkD(418, 176, 15), 'thin') +
          P(sparkD(222, 96, 12), 'thin') +
          P(sparkD(392, 104, 10), 'thin') +
          P(heartD(300, 348, 18), 'thin') +
          P(starD(300, 300, 13, 6), 'thin'),
      },
      {
        label: '예쁘게 색칠',
        tip: '노랑 별과 분홍 옷을 칠해 봐요',
        art: '',
      },
    ],
    coloring:
      '<path d="' + STAR_B + '" fill="#ffe58a" stroke="none"/>' +
      '<path d="' + DRESS_B + '" fill="#ffb9d6" stroke="none"/>' +
      '<path d="' + starD(402, 288, 21, 9) + '" fill="#ffd24d" stroke="none"/>' +
      '<path d="' + heartD(300, 348, 18) + '" fill="#ff7fb0" stroke="none"/>' +
      '<ellipse cx="276" cy="427" rx="12" ry="6" fill="#ffd8b8" stroke="none"/>' +
      '<ellipse cx="324" cy="427" rx="12" ry="6" fill="#ffd8b8" stroke="none"/>',
  };

  /* ---------- 도안 C : 리본 요정핑 ---------- */
  const HEAD_C = 'M204,196 C204,142 246,104 300,104 C354,104 396,142 396,196 C396,252 354,290 300,290 C246,290 204,252 204,196 Z';
  const DRESS_C = 'M274,288 C266,318 254,352 246,392 C278,408 322,408 354,392 C346,352 334,318 326,288 Z';

  const guideC = {
    id: 'ribbon',
    name: '리본 요정핑',
    emoji: '🎀',
    tag: '리본 요정',
    steps: [
      {
        label: '얼굴·머리 윤곽',
        tip: '동글동글 얼굴과 곱슬머리를 그려요',
        art:
          P(HEAD_C) +
          P('M212,140 C188,182 192,242 218,274') +
          P('M388,140 C412,182 408,242 382,274') +
          P(DRESS_C) +
          P('M264,310 C244,326 232,346 228,366') +
          P('M336,310 C356,326 368,346 372,366') +
          C(226, 370, 9, 'thin') +
          C(374, 370, 9, 'thin') +
          P('M284,400 L282,436') +
          P('M316,400 L318,436') +
          E(276, 441, 12, 6, 'thin') +
          E(324, 441, 12, 6, 'thin'),
      },
      {
        label: '큰 눈·입',
        tip: '커다란 눈과 방긋 웃는 입',
        art:
          eyes(266, 334, 194, 24, 28) +
          P(smile(300, 238, 28)) +
          blush(226, 226) +
          blush(374, 226),
      },
      {
        label: '큰 리본 장식',
        tip: '머리 위에 큰 리본을 얹어요',
        art:
          P('M292,120 C256,86 218,78 210,100 C202,122 244,134 292,126') +
          P('M308,120 C344,86 382,78 390,100 C398,122 356,134 308,126') +
          E(300, 124, 17, 16, 'thin') +
          P('M290,138 C278,162 268,178 258,188') +
          P('M310,138 C322,162 332,178 342,188') +
          P(heartD(206, 280, 15), 'thin') +
          P(heartD(394, 280, 15), 'thin') +
          P(sparkD(160, 210, 16), 'thin') +
          P(sparkD(440, 210, 16), 'thin') +
          P(heartD(300, 340, 18), 'thin'),
      },
      {
        label: '예쁘게 색칠',
        tip: '리본과 드레스를 색칠해 봐요',
        art: '',
      },
    ],
    coloring:
      '<path d="' + HEAD_C + '" fill="#ffd0e2" stroke="none"/>' +
      '<path d="' + DRESS_C + '" fill="#cfe6ff" stroke="none"/>' +
      '<path d="' + heartD(206, 280, 15) + '" fill="#ff8fbb" stroke="none"/>' +
      '<path d="' + heartD(394, 280, 15) + '" fill="#ff8fbb" stroke="none"/>' +
      '<path d="' + heartD(300, 340, 16) + '" fill="#ff7fb0" stroke="none"/>' +
      '<ellipse cx="276" cy="441" rx="12" ry="6" fill="#ffd8b8" stroke="none"/>' +
      '<ellipse cx="324" cy="441" rx="12" ry="6" fill="#ffd8b8" stroke="none"/>',
  };

  /* ---------- 도안 D : 무지개 요정핑 ---------- */
  const RAINBOW_1 = 'M150,250 A150,150 0 0 1 450,250';
  const RAINBOW_2 = 'M180,250 A120,120 0 0 1 420,250';
  const RAINBOW_3 = 'M210,250 A90,90 0 0 1 390,250';
  const CLOUD_L = cloudD(146, 254, 122, 68);
  const CLOUD_R = cloudD(454, 254, 122, 68);
  const DRESS_D = 'M276,422 C268,446 260,466 252,486 C282,500 318,500 348,486 C340,466 332,446 324,422 Z';
  const WING_L_D = 'M264,424 C240,392 204,386 190,406 C176,426 196,442 214,450 C230,456 250,442 264,428 Z';
  const WING_R_D = 'M336,424 C360,392 396,386 410,406 C424,426 404,442 386,450 C370,456 350,442 336,428 Z';

  const guideD = {
    id: 'rainbow',
    name: '무지개 요정핑',
    emoji: '🌈',
    tag: '무지개 요정',
    steps: [
      {
        label: '무지개·구름',
        tip: '둥근 무지개 다리와 구름을 그려요',
        art: P(RAINBOW_1) + P(RAINBOW_2) + P(RAINBOW_3) + P(CLOUD_L) + P(CLOUD_R),
      },
      {
        label: '얼굴·큰 눈',
        tip: '구름에 웃는 얼굴, 요정 얼굴도 그려요',
        art:
          C(300, 360, 66) +
          P(DRESS_D) +
          P('M286,496 L284,520') +
          P('M314,496 L316,520') +
          E(278, 525, 11, 6, 'thin') +
          E(322, 525, 11, 6, 'thin') +
          eyes(287, 313, 358, 13, 16) +
          P(smile(300, 384, 18)) +
          C(124, 260, 5, 'thin') +
          C(152, 260, 5, 'thin') +
          P('M128,275 C134,282 142,282 148,275', 'thin') +
          C(432, 260, 5, 'thin') +
          C(460, 260, 5, 'thin') +
          P('M436,275 C442,282 450,282 456,275', 'thin'),
      },
      {
        label: '날개·반짝이',
        tip: '요정 날개와 반짝이를 더해요',
        art:
          P(WING_L_D) +
          P(WING_R_D) +
          P(heartD(300, 200, 17), 'thin') +
          P(heartD(300, 458, 14), 'thin') +
          P(sparkD(196, 340, 15), 'thin') +
          P(sparkD(404, 340, 15), 'thin'),
      },
      {
        label: '예쁘게 색칠',
        tip: '무지개에 일곱 빛깔을 칠해 봐요',
        art: '',
      },
    ],
    coloring:
      '<path d="' + RAINBOW_1 + '" fill="none" stroke="#ffb3cf" stroke-width="14" stroke-opacity="0.75"/>' +
      '<path d="' + RAINBOW_2 + '" fill="none" stroke="#ffe08a" stroke-width="14" stroke-opacity="0.75"/>' +
      '<path d="' + RAINBOW_3 + '" fill="none" stroke="#9fe6c8" stroke-width="14" stroke-opacity="0.75"/>' +
      '<path d="' + CLOUD_L + '" fill="#ffffff" stroke="none"/>' +
      '<path d="' + CLOUD_R + '" fill="#ffffff" stroke="none"/>' +
      '<circle cx="300" cy="360" r="66" fill="#ffd9e8" stroke="none"/>' +
      '<path d="' + DRESS_D + '" fill="#d9c9ff" stroke="none"/>' +
      '<path d="' + WING_L_D + '" fill="#fff0f9" stroke="none"/>' +
      '<path d="' + WING_R_D + '" fill="#fff0f9" stroke="none"/>' +
      '<path d="' + heartD(300, 200, 17) + '" fill="#ff7fb0" stroke="none"/>' +
      '<path d="' + heartD(300, 458, 14) + '" fill="#ff9dbf" stroke="none"/>',
  };

  /* ---------- 도안 E : 하트 컵케이크 ---------- */
  const CUP = 'M206,372 L394,372 L364,514 C358,522 242,522 236,514 Z';
  const CREAM =
    'M206,372 C184,354 186,322 212,314 C202,290 226,266 252,276 C252,246 290,232 310,254 ' +
    'C334,232 366,248 358,278 C386,270 404,296 390,318 C414,330 408,362 386,372 Z';

  const guideE = {
    id: 'cupcake',
    name: '하트 컵케이크',
    emoji: '🧁',
    tag: '달콤 간식',
    steps: [
      {
        label: '컵·크림 윤곽',
        tip: '동글동글 크림과 컵을 그려요',
        art:
          P(CREAM) +
          P(CUP) +
          P('M250,378 L258,510', 'thin') +
          P('M300,378 L300,512', 'thin') +
          P('M350,378 L342,510', 'thin'),
      },
      {
        label: '큰 눈·입',
        tip: '크림에 웃는 얼굴을 그려요',
        art:
          eyes(262, 338, 330, 14, 17) +
          P(smile(300, 356, 24)) +
          blush(230, 350) +
          blush(370, 350),
      },
      {
        label: '하트·스프링클',
        tip: '하트와 알록달록 스프링클',
        art:
          P(heartD(300, 236, 32)) +
          P('M214,344 C244,320 272,338 300,312 C330,338 358,320 386,344', 'thin') +
          P(sparkD(240, 316, 11), 'thin') +
          P(heartD(262, 292, 11), 'thin') +
          P(starD(344, 300, 14, 7), 'thin') +
          P(heartD(318, 324, 10), 'thin') +
          P(heartD(272, 430, 13), 'thin') +
          P(heartD(300, 462, 15), 'thin') +
          P(heartD(330, 430, 12), 'thin') +
          P(sparkD(160, 260, 16), 'thin') +
          P(sparkD(444, 250, 13), 'thin'),
      },
      {
        label: '예쁘게 색칠',
        tip: '달콤한 색으로 칠해 봐요',
        art: '',
      },
    ],
    coloring:
      '<path d="' + CREAM + '" fill="#ffe7f2" stroke="none"/>' +
      '<path d="' + CUP + '" fill="#d9c9ff" stroke="none"/>' +
      '<path d="' + heartD(300, 236, 32) + '" fill="#ff7fb0" stroke="none"/>' +
      '<path d="' + heartD(272, 430, 11) + '" fill="#ffb0cc" stroke="none"/>' +
      '<path d="' + heartD(300, 462, 13) + '" fill="#ffb0cc" stroke="none"/>' +
      '<path d="' + heartD(330, 430, 10) + '" fill="#ffb0cc" stroke="none"/>',
  };

  /* ---------- 도안 F : 자유 그리기 ---------- */
  const guideF = {
    id: 'free',
    name: '자유 그리기',
    emoji: '✏️',
    tag: '백지 도안',
    free: true,
    steps: [],
    coloring:
      '<rect x="26" y="26" width="548" height="548" rx="44" fill="none" stroke="#ffc9e0" ' +
      'stroke-width="4" stroke-dasharray="2 16" stroke-linecap="round"/>',
  };

  const GUIDES = [guideA, guideB, guideC, guideD, guideE, guideF];

  /* ---------- SVG 렌더 ---------- */
  function svgFor(guide, opts) {
    opts = opts || {};
    const cls = 'guide-svg' + (opts.preview ? ' preview' : '');
    let inner = '';
    if (!guide.free) {
      guide.steps.forEach((st, i) => {
        inner += '<g class="step" data-step="' + (i + 1) + '">' + (st.art || '') + '</g>';
      });
    }
    inner += '<g class="fills">' + (guide.coloring || '') + '</g>';
    return (
      '<svg class="' + cls + '" viewBox="0 0 600 600" fill="none" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>'
    );
  }

  /* ---------- 선화 전체 = 색칠 모드 밑그림 ---------- */
  function lineArtFor(guide) {
    return guide.steps.map((s) => s.art || '').join('');
  }

  // 색칠 모드용 검은 선화 SVG (인쇄물 같은 도안)
  function lineSvg(guide) {
    const art = guide.free ? (guide.coloring || '') : lineArtFor(guide);
    return (
      '<svg class="line-svg" viewBox="0 0 600 600" fill="none" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<g class="ink">' + art + '</g></svg>'
    );
  }

  // 따라그리기 모드용 연한 점선 가이드
  function traceSvg(guide) {
    let inner = '';
    if (!guide.free) {
      guide.steps.forEach((st, i) => {
        inner += '<g class="step" data-step="' + (i + 1) + '">' + (st.art || '') + '</g>';
      });
    } else {
      inner = '<g class="step free-frame">' + (guide.coloring || '') + '</g>';
    }
    return (
      '<svg class="trace-svg" viewBox="0 0 600 600" fill="none" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>'
    );
  }

  // 색칠 예시(힌트) 레이어
  function hintSvg(guide) {
    return (
      '<svg class="hint-svg" viewBox="0 0 600 600" aria-hidden="true">' +
      (guide.coloring || '') + '</svg>'
    );
  }

  window.GUIDES = GUIDES;
  window.guideSvg = svgFor;
  window.guideLineSvg = lineSvg;
  window.guideTraceSvg = traceSvg;
  window.guideHintSvg = hintSvg;
  window.guideLineArt = lineArtFor;
  window.Shapes = { heartD, starD, sparkD, cloudD, smile, ribbonD };
})();
