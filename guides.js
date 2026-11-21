/* 🩷 하츄핑 놀이터 — 도안 데이터
   600x600 좌표계. 도안은 assets/ 의 진짜 캐릭터 선화 PNG(투명 배경)로 그린다.
   각 도안은 4단계(steps)의 따라그리기 영역(boxes)과 색칠 힌트 이미지를 가진다.
*/
(function () {
  'use strict';

  const A = 'assets/';

  /* ---------- 도안 ----------
     img   : 투명 배경 검은 선화 PNG (1200x1200)
     hint  : 같은 그림의 색칠 예시 PNG (힌트 레이어)
     cover : 캐릭터가 차지하는 대략의 영역 (진행률 계산용, 0~600)
     steps : 따라그리기 단계. boxes 는 그 단계에서 밝게 보여 줄 영역들
  */
  const GUIDES = [
    {
      id: 'hatchuping',
      name: '하츄핑',
      emoji: '🩷',
      tag: '하트 요정',
      img: 'hatchuping-line.png',
      hint: 'hatchuping-color.png',
      color: '#ff8fc0',
      cover: [105, 15, 390, 560],
      steps: [
        { label: '머리 모양', tip: '하트 장식과 곱슬머리를 따라 그려요', boxes: [[105, 20, 390, 250]] },
        { label: '얼굴 표정', tip: '반짝이는 눈과 미소를 그려요', boxes: [[190, 140, 220, 155]] },
        { label: '드레스와 날개', tip: '프릴 드레스와 요정 날개를 그려요', boxes: [[120, 225, 360, 235]] },
        { label: '마법봉과 구두', tip: '하트 마법봉과 발그레 구두를 그려요', boxes: [[375, 170, 110, 180], [245, 435, 180, 140]] },
      ],
    },
    {
      id: 'star',
      name: '반짝별 요정핑',
      emoji: '⭐',
      tag: '별 요정',
      img: 'star-line.png',
      hint: 'star-color.png',
      color: '#ffd166',
      cover: [55, 20, 480, 565],
      steps: [
        { label: '머리와 별핀', tip: '동글동글 머리와 별 머리핀을 그려요', boxes: [[120, 20, 340, 150]] },
        { label: '얼굴 표정', tip: '초롱초롱 눈과 웃는 입을 그려요', boxes: [[165, 130, 230, 165]] },
        { label: '별 드레스와 날개', tip: '별이 박힌 드레스와 날개를 그려요', boxes: [[115, 255, 320, 235]] },
        { label: '마법봉과 신발', tip: '별 마법봉과 반짝이 신발을 그려요', boxes: [[50, 85, 150, 315], [415, 90, 125, 115], [215, 465, 175, 115]] },
      ],
    },
    {
      id: 'ribbon',
      name: '리본 요정핑',
      emoji: '🎀',
      tag: '리본 요정',
      img: 'ribbon-line.png',
      hint: 'ribbon-color.png',
      color: '#ff9ec7',
      cover: [85, 15, 415, 565],
      steps: [
        { label: '큰 리본과 머리', tip: '머리 위 큼직한 리본을 그려요', boxes: [[135, 15, 330, 165]] },
        { label: '얼굴 표정', tip: '반짝이는 눈과 방긋 미소를 그려요', boxes: [[200, 155, 200, 130]] },
        { label: '리본 드레스', tip: '리본이 달린 드레스를 그려요', boxes: [[140, 275, 315, 200]] },
        { label: '마법봉과 날개', tip: '마법봉, 리본 날개, 리본 구두를 그려요', boxes: [[85, 135, 155, 225], [390, 180, 105, 135], [230, 500, 150, 80]] },
      ],
    },
    {
      id: 'rainbow',
      name: '무지개 요정핑',
      emoji: '🌈',
      tag: '무지개 요정',
      img: 'rainbow-line.png',
      hint: 'rainbow-color.png',
      color: '#8ec9ff',
      cover: [80, 20, 425, 560],
      steps: [
        { label: '무지개와 머리', tip: '머리 위 무지개를 그려요', boxes: [[140, 20, 300, 245]] },
        { label: '얼굴 표정', tip: '동글 눈과 웃는 입을 그려요', boxes: [[165, 135, 230, 160]] },
        { label: '무지개 드레스', tip: '무지개와 구름이 있는 드레스를 그려요', boxes: [[95, 250, 330, 220]] },
        { label: '구름과 신발', tip: '웃는 구름과 하트 구두를 그려요', boxes: [[390, 100, 120, 105], [205, 500, 215, 75]] },
      ],
    },
    {
      id: 'cupcake',
      name: '하트 컵케이크',
      emoji: '🧁',
      tag: '디저트',
      img: 'cupcake-line.png',
      hint: 'cupcake-color.png',
      color: '#ffb3d1',
      cover: [105, 5, 395, 565],
      steps: [
        { label: '하트 토핑', tip: '꼭대기 하트를 그려요', boxes: [[180, 5, 250, 175]] },
        { label: '크림 소용돌이', tip: '도톰한 크림을 그려요', boxes: [[110, 100, 390, 155]] },
        { label: '웃는 얼굴', tip: '귀여운 얼굴을 그려요', boxes: [[190, 290, 200, 135]] },
        { label: '컵과 하트 장식', tip: '종이 컵과 하트 사탕을 그려요', boxes: [[105, 395, 400, 180], [365, 260, 130, 125]] },
      ],
    },
    {
      id: 'free',
      name: '자유 그리기',
      emoji: '✏️',
      tag: '백지',
      free: true,
      color: '#b79bff',
      cover: [0, 0, 600, 600],
      steps: [
        { label: '자유롭게', tip: '하고 싶은 그림을 마음껏 그려요' },
        { label: '자유롭게', tip: '하고 싶은 그림을 마음껏 그려요' },
        { label: '자유롭게', tip: '하고 싶은 그림을 마음껏 그려요' },
        { label: '자유롭게', tip: '하고 싶은 그림을 마음껏 그려요' },
      ],
    },
  ];

  /* ---------- 썸네일/레이어용 이미지 태그 ---------- */
  function artImg(guide, cls) {
    if (!guide.img) return '';
    return (
      '<img class="' + (cls || 'line-art') + '" src="' + A + guide.img +
      '" alt="" draggable="false" decoding="async">'
    );
  }

  /* ---------- 색칠 모드 밑그림 (검은 선화) ---------- */
  function lineSvg(guide) {
    if (guide.free) return '<div class="line-free"></div>';
    return artImg(guide, 'line-art');
  }

  /* ---------- 색칠 예시(힌트) 레이어 ---------- */
  function hintSvg(guide) {
    if (!guide.hint) return '';
    return '<img class="hint-art" src="' + A + guide.hint + '" alt="" draggable="false">';
  }

  /* ---------- 따라그리기: 단계별 연한 밑그림 ---------- */
  let uid = 0;
  function traceSvg(guide) {
    if (guide.free) {
      return (
        '<svg class="trace-svg free" viewBox="0 0 600 600" aria-hidden="true">' +
        '<rect x="14" y="14" width="572" height="572" rx="34" class="free-frame"/>' +
        '<text x="300" y="300" text-anchor="middle" class="free-note">자유롭게 그려 보세요</text>' +
        '</svg>'
      );
    }
    const id = 'tr' + ++uid;
    let defs =
      '<filter id="' + id + '-soft" x="-25%" y="-25%" width="150%" height="150%">' +
      '<feGaussianBlur stdDeviation="16"/></filter>';
    let groups = '';
    guide.steps.forEach((st, i) => {
      const maskId = id + '-m' + (i + 1);
      const boxes = st.boxes || [];
      const rects = boxes
        .map((b) => '<rect x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + b[3] + '" fill="#fff"/>')
        .join('');
      if (rects) {
        defs +=
          '<mask id="' + maskId + '" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="600">' +
          '<g filter="url(#' + id + '-soft)">' + rects + '</g></mask>';
      }
      groups +=
        '<g class="step" data-step="' + (i + 1) + '"' + (rects ? ' mask="url(#' + maskId + ')"' : '') + '>' +
        '<image href="' + A + guide.img + '" x="0" y="0" width="600" height="600" preserveAspectRatio="xMidYMid meet"/>' +
        '</g>';
    });
    // 전체 윤곽을 아주 연하게 깔아 두어 지금 어디를 그리는지 보이게 한다
    const ghost =
      '<g class="ghost"><image href="' + A + guide.img +
      '" x="0" y="0" width="600" height="600" preserveAspectRatio="xMidYMid meet"/></g>';
    return (
      '<svg class="trace-svg" viewBox="0 0 600 600" aria-hidden="true">' +
      '<defs>' + defs + '</defs>' + ghost + groups + '</svg>'
    );
  }

  /* ---------- 따라그리기 단계 요약 (시작 화면 미리보기용) ---------- */
  function fullTraceSvg(guide) {
    return traceSvg(guide);
  }

  window.GUIDES = GUIDES;
  window.guideSvg = lineSvg;
  window.guideLineSvg = lineSvg;
  window.guideTraceSvg = traceSvg;
  window.guideHintSvg = hintSvg;
  window.guideAsset = function (name) {
    return A + name;
  };

  /* ---------- 도장(스티커) 모양 ---------- */
  const n = (v) => String(Math.round(v * 100) / 100);
  function heartD(cx, cy, s) {
    return (
      'M' + n(cx) + ',' + n(cy + s * 0.8) +
      ' C' + n(cx - s * 0.2) + ',' + n(cy + s * 0.5) + ' ' + n(cx - s) + ',' + n(cy + s * 0.06) + ' ' + n(cx - s * 0.56) + ',' + n(cy - s * 0.44) +
      ' C' + n(cx - s * 0.28) + ',' + n(cy - s * 0.76) + ' ' + n(cx) + ',' + n(cy - s * 0.52) + ' ' + n(cx) + ',' + n(cy - s * 0.3) +
      ' C' + n(cx) + ',' + n(cy - s * 0.52) + ' ' + n(cx + s * 0.28) + ',' + n(cy - s * 0.76) + ' ' + n(cx + s * 0.56) + ',' + n(cy - s * 0.44) +
      ' C' + n(cx + s) + ',' + n(cy + s * 0.06) + ' ' + n(cx + s * 0.2) + ',' + n(cy + s * 0.5) + ' ' + n(cx) + ',' + n(cy + s * 0.8) + ' Z'
    );
  }
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
  function ribbonD(cx, cy, s) {
    return (
      'M' + n(cx) + ',' + n(cy) +
      ' C' + n(cx - s * 0.3) + ',' + n(cy - s * 0.45) + ' ' + n(cx - s) + ',' + n(cy - s * 0.55) + ' ' + n(cx - s * 1.05) + ',' + n(cy - s * 0.2) +
      ' C' + n(cx - s * 1.1) + ',' + n(cy + s * 0.18) + ' ' + n(cx - s * 0.45) + ',' + n(cy + s * 0.32) + ' ' + n(cx) + ',' + n(cy + s * 0.12) +
      ' C' + n(cx + s * 0.45) + ',' + n(cy + s * 0.32) + ' ' + n(cx + s * 1.1) + ',' + n(cy + s * 0.18) + ' ' + n(cx + s * 1.05) + ',' + n(cy - s * 0.2) +
      ' C' + n(cx + s) + ',' + n(cy - s * 0.55) + ' ' + n(cx + s * 0.3) + ',' + n(cy - s * 0.45) + ' ' + n(cx) + ',' + n(cy) + ' Z'
    );
  }
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

  window.Shapes = { heartD, starD, sparkD, cloudD, ribbonD };
})();
