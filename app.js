/* 🩷 하츄핑 놀이터 — 앱 로직
   모드 1) 색칠하기 : 검은 선화 위에 페인트통·크레파스·매직·반짝이
   모드 2) 따라그리기 : 점선 가이드를 4단계로 따라 그리기
*/
(function () {
  'use strict';

  const GUIDES = window.GUIDES;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const LOGICAL = 600;
  const PAINT = 900;
  const K = PAINT / LOGICAL;

  const STICKER_POOL = ['🩷', '⭐', '🎀', '🌈', '🍓', '🧁', '🦄', '💎', '🌸', '🍭', '🫧', '🌟'];
  const PRAISES = [
    '우와! 하츄핑이 너무 예뻐졌어요',
    '색을 정말 잘 골랐어요!',
    '반짝반짝 멋진 작품이에요',
    '손끝이 예술가 같아요!',
    '하츄핑이 행복해 보여요 🩷',
  ];

  /* ================= 상태 ================= */
  const state = {
    mode: 'color',
    guideId: 'hatchuping',
    tool: 'fill',          // fill | crayon | pen | glitter | eraser | stamp
    stamp: 'heart',
    color: '#ff8fc0',
    size: 2,
    hint: false,
    showAll: false,
    guideAlpha: 0.72,
    step: 1,
    muted: false,
  };

  const WIDTHS = {
    pen: [6, 12, 20],
    crayon: [14, 24, 36],
    glitter: [10, 17, 26],
    eraser: [26, 44, 68],
    stamp: [26, 38, 52],
  };

  const PALETTE = [
    '#ff8fc0', '#ff5f7e', '#ffd166', '#ffe58a', '#7fe3c4', '#8ec9ff',
    '#b79bff', '#ff9f5a', '#ffffff', '#7a4a5c', '#ffc2dc', '#c98b6b',
  ];

  const store = new Map();      // "mode|guide" -> ops[]
  const maskCache = new Map();  // guideId -> {promise,data,img}
  let session = null;
  let lastTouch = 0;

  /* ================= DOM ================= */
  const stageEl = $('#stage');
  const paint = $('#paintCanvas');
  const pctx = paint.getContext('2d');
  const fx = $('#fxCanvas');
  const fctx = fx.getContext('2d');
  const lineLayer = $('#lineLayer');
  const traceLayer = $('#traceLayer');
  const hintLayer = $('#hintLayer');
  const stageHint = $('#stageHint');
  const progressBar = $('#progressBar');
  const progressLabel = $('#progressLabel');

  paint.width = paint.height = PAINT;

  /* ================= 사운드 ================= */
  const Sound = {
    ctx: null,
    noiseBuf: null,
    lastBrush: 0,
    unlock() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        try { this.ctx = new AC(); } catch (e) { return; }
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    tone(opts) {
      if (!this.ctx || state.muted) return;
      const t0 = this.ctx.currentTime + (opts.when || 0);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = opts.type || 'sine';
      osc.frequency.setValueAtTime(opts.freq, t0);
      if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + (opts.dur || 0.15));
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(opts.gain || 0.07, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + (opts.dur || 0.15));
      osc.connect(g).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + (opts.dur || 0.15) + 0.02);
    },
    noise(dur, gain, freq) {
      if (!this.ctx || state.muted) return;
      if (!this.noiseBuf) {
        const len = Math.floor(this.ctx.sampleRate * 0.4);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      const t0 = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = freq || 1400;
      bp.Q.value = 0.9;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain || 0.05, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(bp).connect(g).connect(this.ctx.destination);
      src.start(t0);
      src.stop(t0 + dur + 0.03);
    },
    brush() {
      const now = performance.now();
      if (now - this.lastBrush < 90) return;
      this.lastBrush = now;
      this.noise(0.14, 0.028, 900 + Math.random() * 700);
    },
    splash() {
      this.tone({ freq: 420, to: 190, dur: 0.26, type: 'sine', gain: 0.1 });
      this.noise(0.24, 0.06, 800);
    },
    pop() {
      this.tone({ freq: 620, to: 1080, dur: 0.11, type: 'triangle', gain: 0.09 });
    },
    nope() {
      this.tone({ freq: 230, to: 170, dur: 0.12, type: 'square', gain: 0.035 });
    },
    step() {
      this.tone({ freq: 720, to: 900, dur: 0.1, type: 'sine', gain: 0.06 });
    },
  };
  // 완성 팡파르
  Sound.fanfare = function () {
    if (state.muted) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      this.tone({ freq: f, dur: 0.28, type: 'triangle', gain: 0.085, when: i * 0.11 });
    });
    this.tone({ freq: 1318.5, dur: 0.5, type: 'sine', gain: 0.05, when: 0.46 });
    this.noise(0.5, 0.05, 2200);
  };

  /* ================= 유틸 ================= */
  function hexToRgb(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const v = parseInt(h, 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  function tint(hex, amt) {
    const [r, g, b] = hexToRgb(hex);
    const f = (v) => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }
  function hash(i, seed) {
    const x = Math.sin(i * 12.9898 + (seed || 0) * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }
  function debounce(fn, ms) {
    let t = 0;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  function currentGuide() {
    return GUIDES.find((g) => g.id === state.guideId) || GUIDES[0];
  }
  function keyOf() {
    return state.mode + '|' + state.guideId;
  }
  function ops() {
    const k = keyOf();
    if (!store.has(k)) store.set(k, []);
    return store.get(k);
  }

  // 메모리 보호: 오래된 동작은 버린다 (실행취소 40단계)
  function addOp(op) {
    const list = ops();
    list.push(op);
    while (list.length > 40) list.shift();
    return op;
  }

  /* ================= 레이어 렌더 ================= */
  function renderLayers() {
    const g = currentGuide();
    lineLayer.innerHTML = window.guideLineSvg(g);
    traceLayer.innerHTML = window.guideTraceSvg(g);
    hintLayer.innerHTML = window.guideHintSvg(g);
    const tsvg = traceLayer.querySelector('svg');
    if (tsvg) tsvg.style.setProperty('--guide-alpha', state.guideAlpha);
    applyModeVisibility();
  }

  function applyModeVisibility() {
    const colorMode = state.mode === 'color';
    lineLayer.classList.toggle('is-off', !colorMode);
    traceLayer.classList.toggle('is-off', colorMode);
    hintLayer.classList.toggle('is-on', colorMode && state.hint);
    hintLayer.classList.toggle('is-off', !colorMode);
    stageEl.classList.toggle('is-fill', colorMode && state.tool === 'fill');
    stageHint.textContent = colorMode ? '톡 누르면 색이 철썩! 🎨' : '연한 밑그림을 따라 그려 보세요 ✏️';
  }

  function refreshTraceSteps() {
    const tsvg = traceLayer.querySelector('svg');
    if (!tsvg) return;
    const free = currentGuide().free;
    tsvg.classList.toggle('show-all', !!(state.showAll || free));
    $$('.step', tsvg).forEach((el) => {
      const n = Number(el.getAttribute('data-step'));
      el.classList.toggle('is-on', !free && n === state.step);
      el.classList.toggle('is-past', !free && n < state.step);
    });
    tsvg.style.setProperty('--guide-alpha', state.guideAlpha);
  }

  /* ================= 그리기 ================= */
  function px(e) {
    const r = stageEl.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * LOGICAL,
      y: ((e.clientY - r.top) / r.height) * LOGICAL,
    };
  }

  function widthFor(tool) {
    const arr = WIDTHS[tool] || WIDTHS.pen;
    return arr[Math.max(0, Math.min(2, state.size - 1))];
  }

  /* --- 붓 한 조각 --- */
  function seg(ctx, op, i) {
    const pts = op.pts;
    const a = pts[i - 1];
    const b = pts[i];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (op.brush === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = op.w;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
      return;
    }

    if (op.brush === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = op.color;
      ctx.lineWidth = op.w;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
      return;
    }

    if (op.brush === 'crayon') {
      ctx.globalCompositeOperation = 'source-over';
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const wob = Math.sin(i * 0.9) * op.w * 0.06;
      const layers = [
        { off: 0, w: 0.82, c: op.color },
        { off: 0.3, w: 0.3, c: tint(op.color, 0.22) },
        { off: -0.3, w: 0.26, c: tint(op.color, -0.08) },
      ];
      layers.forEach((L) => {
        const o = L.off * op.w + wob;
        ctx.strokeStyle = L.c;
        ctx.lineWidth = op.w * L.w;
        ctx.beginPath();
        ctx.moveTo(a[0] + nx * o, a[1] + ny * o);
        ctx.lineTo(b[0] + nx * o, b[1] + ny * o);
        ctx.stroke();
      });
      // 크레파스 알갱이
      if (i % 2 === 0) {
        ctx.fillStyle = tint(op.color, hash(i, op.seed) > 0.5 ? 0.45 : -0.15);
        ctx.beginPath();
        ctx.arc(b[0] + (hash(i + 7, op.seed) - 0.5) * op.w * 0.7,
          b[1] + (hash(i + 13, op.seed) - 0.5) * op.w * 0.7, op.w * 0.11, 0, 7);
        ctx.fill();
      }
      return;
    }

    if (op.brush === 'glitter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = op.color;
      ctx.lineWidth = Math.max(2, op.w * 0.42);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
      if (i % 3 === 0) {
        const r = op.w * (0.55 + hash(i, op.seed) * 0.6);
        const cx = b[0] + (hash(i + 3, op.seed) - 0.5) * op.w * 0.6;
        const cy = b[1] + (hash(i + 5, op.seed) - 0.5) * op.w * 0.6;
        const S = window.Shapes;
        ctx.fillStyle = tint(op.color, 0.35);
        ctx.fill(new Path2D(S.sparkD(cx, cy, r)));
        ctx.fillStyle = '#fff';
        ctx.fill(new Path2D(S.sparkD(cx, cy, r * 0.5)));
      }
      if (i % 5 === 0) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(b[0] - op.w * 0.2, b[1] + op.w * 0.15, op.w * 0.12, 0, 7);
        ctx.fill();
      }
    }
  }

  function dot(ctx, op) {
    const p = op.pts[0];
    ctx.lineCap = 'round';
    if (op.brush === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(p[0], p[1], op.w / 2, 0, 7);
      ctx.fill();
      return;
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = op.color;
    if (op.brush === 'glitter') {
      ctx.fill(new Path2D(window.Shapes.sparkD(p[0], p[1], op.w * 0.6)));
      ctx.fillStyle = '#fff';
      ctx.fill(new Path2D(window.Shapes.sparkD(p[0], p[1], op.w * 0.3)));
      return;
    }
    ctx.beginPath();
    ctx.arc(p[0], p[1], op.w / 2, 0, 7);
    ctx.fill();
  }

  function drawStrokeFull(ctx, op) {
    if (!op.pts.length) return;
    dot(ctx, op);
    for (let i = 1; i < op.pts.length; i++) seg(ctx, op, i);
  }

  function drawStampOp(ctx, op) {
    const S = window.Shapes;
    const s = op.size;
    let d;
    if (op.kind === 'heart') d = S.heartD(op.x, op.y, s);
    else if (op.kind === 'star') d = S.starD(op.x, op.y, s, s * 0.5);
    else if (op.kind === 'ribbon') d = S.ribbonD(op.x, op.y, s);
    else d = S.sparkD(op.x, op.y, s);
    const path = new Path2D(d);
    ctx.save();
    ctx.translate(op.x, op.y);
    ctx.rotate(op.rot || 0);
    ctx.translate(-op.x, -op.y);
    ctx.fillStyle = op.color;
    ctx.fill(path);
    ctx.lineWidth = Math.max(1.6, s * 0.1);
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.stroke(path);
    ctx.restore();
  }

  /* ================= 페인트통 ================= */
  const visited = new Uint8Array(PAINT * PAINT);
  const stack = new Int32Array(PAINT * PAINT);
  let maskData = null;

  // 선화 PNG를 불러오는 캐시
  const artCache = new Map();
  function loadArt(src) {
    if (artCache.has(src)) return artCache.get(src);
    const p = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
    artCache.set(src, p);
    return p;
  }

  function ensureMask(guide) {
    if (maskCache.has(guide.id)) return maskCache.get(guide.id).promise;
    const entry = { data: null, img: null };
    entry.promise = (async () => {
      if (guide.free) {
        // 백지 도안: 선이 없으니 캔버스 전체가 칠해질 수 있는 영역
        entry.data = new Uint8Array(PAINT * PAINT);
        return entry;
      }
      const art = await loadArt(window.guideAsset(guide.img));
      if (!art) return null;
      const c = document.createElement('canvas');
      c.width = c.height = PAINT;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.clearRect(0, 0, PAINT, PAINT);
      // 선을 살짝 두껍게 찍어 선 사이 미세한 틈으로 물감이 새지 않게 한다
      [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]].forEach((d) =>
        g.drawImage(art, d[0], d[1], PAINT, PAINT)
      );
      const d = g.getImageData(0, 0, PAINT, PAINT).data;
      const arr = new Uint8Array(PAINT * PAINT);
      let linePixels = 0;
      for (let i = 0, j = 3; i < arr.length; i++, j += 4) {
        if (d[j] > 120) { arr[i] = 1; linePixels++; }
      }
      entry.data = arr;
      entry.linePixels = linePixels;
      entry.img = art;
      return entry;
    })();
    maskCache.set(guide.id, entry);
    return entry.promise;
  }

  function computeRegion(mask, sx, sy) {
    const W = PAINT;
    const start = sy * W + sx;
    if (sx < 0 || sy < 0 || sx >= W || sy >= W) return null;
    if (mask[start]) return null;
    visited.fill(0);
    let sp = 0;
    stack[sp++] = start;
    visited[start] = 1;
    let minX = sx, maxX = sx, minY = sy, maxY = sy;
    while (sp > 0) {
      const p = stack[--sp];
      const x = p % W;
      const y = (p - x) / W;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x > 0) { const q = p - 1; if (!visited[q] && !mask[q]) { visited[q] = 1; stack[sp++] = q; } }
      if (x < W - 1) { const q = p + 1; if (!visited[q] && !mask[q]) { visited[q] = 1; stack[sp++] = q; } }
      if (y > 0) { const q = p - W; if (!visited[q] && !mask[q]) { visited[q] = 1; stack[sp++] = q; } }
      if (y < W - 1) { const q = p + W; if (!visited[q] && !mask[q]) { visited[q] = 1; stack[sp++] = q; } }
    }
    return { minX, minY, maxX, maxY };
  }

  function findFree(mask, sx, sy) {
    const W = PAINT;
    if (sx >= 0 && sy >= 0 && sx < W && sy < W && !mask[sy * W + sx]) return [sx, sy];
    for (let r = 3; r <= 20; r += 2) {
      const steps = 8 + r * 2;
      for (let a = 0; a < steps; a++) {
        const ang = (a / steps) * Math.PI * 2;
        const x = Math.round(sx + Math.cos(ang) * r);
        const y = Math.round(sy + Math.sin(ang) * r);
        if (x < 0 || y < 0 || x >= W || y >= W) continue;
        if (!mask[y * W + x]) return [x, y];
      }
    }
    return null;
  }

  function buildFillCrop(op) {
    const mask = maskData;
    if (!mask) return;
    const g = currentGuide();
    const sx = Math.max(0, Math.min(PAINT - 1, Math.round(op.x * K)));
    const sy = Math.max(0, Math.min(PAINT - 1, Math.round(op.y * K)));
    const box = computeRegion(mask, sx, sy);
    if (!box) return;
    const w = box.maxX - box.minX + 1;
    const h = box.maxY - box.minY + 1;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cg = c.getContext('2d');
    const id = cg.createImageData(w, h);
    const [r, gr, b] = hexToRgb(op.color);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!visited[(box.minY + y) * PAINT + box.minX + x]) continue;
        const i = (y * w + x) * 4;
        id.data[i] = r;
        id.data[i + 1] = gr;
        id.data[i + 2] = b;
        id.data[i + 3] = 255;
      }
    }
    cg.putImageData(id, 0, 0);
    op._crop = c;
    op._box = box;
    void g;
  }

  async function doFill(x, y, color) {
    const guide = currentGuide();
    const entry = await ensureMask(guide);
    if (!entry || !entry.data) return false;
    maskData = entry.data;
    const sx0 = Math.round(x * K);
    const sy0 = Math.round(y * K);
    const spot = findFree(maskData, sx0, sy0);
    if (!spot) return false;
    const op = { t: 'fill', x: spot[0] / K, y: spot[1] / K, color };
    buildFillCrop(op);
    if (!op._crop) return false;
    addOp(op);
    paintFill(pctx, op);
    return true;
  }

  function paintFill(ctx, op) {
    if (!op._crop) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(op._crop, op._box.minX - 2, op._box.minY - 2, op._box.maxX - op._box.minX + 5, op._box.maxY - op._box.minY + 5);
    ctx.restore();
  }

  /* ================= 전체 다시 그리기 ================= */
  function redraw() {
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.clearRect(0, 0, PAINT, PAINT);
    pctx.setTransform(K, 0, 0, K, 0, 0);
    maskData = null;
    for (const op of ops()) {
      if (op.t === 'fill') {
        if (!op._crop) {
          const entry = maskCache.get(currentGuide().id);
          if (entry && entry.data) {
            maskData = entry.data;
            buildFillCrop(op);
          }
        }
        if (op._crop) paintFill(pctx, op);
      } else if (op.t === 'stamp') {
        drawStampOp(pctx, op);
      } else {
        drawStrokeFull(pctx, op);
      }
    }
    pctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* ================= 포인터 ================= */
  function hideHint() {
    stageHint.classList.add('is-gone');
  }

  async function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (session) return;
    e.preventDefault();
    Sound.unlock();
    hideHint();
    const p = px(e);
    try { stageEl.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }

    if (state.mode === 'color' && state.tool === 'fill') {
      const ok = await doFill(p.x, p.y, state.color);
      if (ok) Sound.splash();
      else Sound.nope();
      pulse();
      updateProgressSoon();
      return;
    }

    if (state.tool === 'stamp') {
      stampAt(p.x, p.y);
      session = { kind: 'stamp', last: p };
      Sound.pop();
      return;
    }

    const op = {
      t: 'stroke',
      brush: state.tool === 'eraser' ? 'eraser' : state.tool,
      color: state.color,
      w: widthFor(state.tool),
      pts: [[p.x, p.y]],
      seed: (Math.random() * 1000) | 0,
    };
    addOp(op);
    session = { kind: 'stroke', op, last: p };
    pctx.setTransform(K, 0, 0, K, 0, 0);
    dot(pctx, op);
    Sound.brush();
  }

  function onMove(e) {
    if (!session) return;
    e.preventDefault();
    const p = px(e);

    if (session.kind === 'stamp') {
      const gap = widthFor('stamp') * 0.95;
      if (Math.hypot(p.x - session.last.x, p.y - session.last.y) > gap) {
        stampAt(p.x, p.y);
        session.last = p;
      }
      return;
    }

    const op = session.op;
    const last = session.last;
    const minStep = op.brush === 'eraser' ? 2 : 1.4;
    if (Math.hypot(p.x - last.x, p.y - last.y) < minStep) return;
    op.pts.push([p.x, p.y]);
    pctx.setTransform(K, 0, 0, K, 0, 0);
    seg(pctx, op, op.pts.length - 1);
    session.last = p;
    Sound.brush();
  }

  function onUp() {
    if (!session) return;
    session = null;
    updateProgressSoon();
  }

  function stampAt(x, y) {
    const op = {
      t: 'stamp',
      kind: state.stamp,
      x,
      y,
      color: state.color,
      size: widthFor('stamp'),
      rot: (Math.random() - 0.5) * 0.5,
    };
    addOp(op);
    pctx.setTransform(K, 0, 0, K, 0, 0);
    drawStampOp(pctx, op);
    pulse();
  }

  /* ================= 실행취소 / 초기화 ================= */
  function undo() {
    const list = ops();
    if (!list.length) { Sound.nope(); return; }
    list.pop();
    redraw();
    Sound.step();
    updateProgressSoon();
  }

  function resetAll() {
    store.set(keyOf(), []);
    redraw();
    Sound.step();
    updateProgressSoon();
  }

  /* ================= 진행률 ================= */
  function coverage() {
    const entry = maskCache.get(currentGuide().id);
    const mask = entry && entry.data ? entry.data : null;
    const cover = currentGuide().cover || [0, 0, LOGICAL, LOGICAL];
    const cx0 = cover[0] * K, cy0 = cover[1] * K;
    const cx1 = (cover[0] + cover[2]) * K, cy1 = (cover[1] + cover[3]) * K;
    const d = pctx.getImageData(0, 0, PAINT, PAINT).data;
    let c = 0;
    let total = 0;
    for (let i = 3; i < d.length; i += 16) {
      const p = (i - 3) / 4;
      if (mask && mask[p]) continue;
      const x = p % PAINT;
      const y = (p - x) / PAINT;
      if (x < cx0 || x > cx1 || y < cy0 || y > cy1) continue;
      total++;
      if (d[i] > 12) c++;
    }
    return total ? Math.min(1, c / total) : 0;
  }

  function strokeLength() {
    let len = 0;
    for (const op of ops()) {
      if (op.t !== 'stroke') continue;
      for (let i = 1; i < op.pts.length; i++) {
        len += Math.hypot(op.pts[i][0] - op.pts[i - 1][0], op.pts[i][1] - op.pts[i - 1][1]);
      }
    }
    return len;
  }

  let praised = 0;
  function updateProgress() {
    const v = state.mode === 'color' ? coverage() : Math.min(1, strokeLength() / 1100);
    const pct = Math.round(v * 100);
    progressBar.style.width = pct + '%';
    progressLabel.textContent = pct + '%';
    progressHeart.textContent = pct > 84 ? '💖' : pct > 45 ? '💗' : '🩷';
    if (v > 0.35 && praised === 0) { praised = 1; toast('와아, 잘하고 있어요! 🩷'); }
    else if (v > 0.7 && praised <= 1) { praised = 2; toast('거의 다 됐어요! 조금만 더 ✨'); }
  }
  const updateProgressSoon = debounce(updateProgress, 350);

  /* ================= 완성 축하 ================= */
  let particles = [];
  let fxRaf = 0;
  let fxSize = { w: 300, h: 300 };

  function resizeFx() {
    const r = stageEl.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    fx.width = Math.max(1, Math.round(r.width * dpr));
    fx.height = Math.max(1, Math.round(r.height * dpr));
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fxSize = { w: r.width, h: r.height };
  }

  function fxLoop() {
    fctx.clearRect(0, 0, fxSize.w, fxSize.h);
    particles = particles.filter((p) => p.life > 0);
    particles.forEach((p) => {
      p.vy += 0.12;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 1;
      fctx.save();
      fctx.translate(p.x, p.y);
      fctx.rotate(p.rot);
      fctx.globalAlpha = Math.max(0, Math.min(1, p.life / 40));
      fctx.font = p.size + 'px serif';
      fctx.textAlign = 'center';
      fctx.textBaseline = 'middle';
      fctx.fillText(p.e, 0, 0);
      fctx.restore();
    });
    if (particles.length) {
      fxRaf = requestAnimationFrame(fxLoop);
    } else {
      fctx.clearRect(0, 0, fxSize.w, fxSize.h);
      fxRaf = 0;
    }
  }

  function burst(n) {
    const emojis = ['🩷', '💖', '⭐', '✨', '🎀', '🌈', '💫'];
    for (let i = 0; i < (n || 46); i++) {
      particles.push({
        x: fxSize.w * (0.5 + (Math.random() - 0.5) * 0.9),
        y: fxSize.h * 0.2 * Math.random(),
        vx: (Math.random() - 0.5) * 3.8,
        vy: -1 - Math.random() * 3.5,
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.3,
        size: 14 + Math.random() * 18,
        life: 55 + Math.random() * 40,
        e: emojis[(Math.random() * emojis.length) | 0],
      });
    }
    if (!fxRaf) fxRaf = requestAnimationFrame(fxLoop);
  }

  function clearFx() {
    particles = [];
    fctx.clearRect(0, 0, fxSize.w, fxSize.h);
    if (fxRaf) { cancelAnimationFrame(fxRaf); fxRaf = 0; }
  }

  function pulse() {
    // 캔버스 살짝 반짝
    stageEl.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.012)' }, { transform: 'scale(1)' }],
      { duration: 220, easing: 'ease-out' }
    );
  }

  /* ================= 저장 / 그림첩 ================= */
  function composeCanvas(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, size, size);
    g.drawImage(paint, 0, 0, size, size);
    if (state.mode === 'color') {
      const entry = maskCache.get(currentGuide().id);
      if (entry && entry.img) g.drawImage(entry.img, 0, 0, size, size);
    }
    return c;
  }

  function downloadPNG() {
    const c = composeCanvas(PAINT);
    const a = document.createElement('a');
    const d = new Date();
    const stampStr = d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
    a.download = 'hatchuping-' + state.mode + '-' + stampStr + '.png';
    a.href = c.toDataURL('image/png');
    a.click();
    toast('PNG로 저장했어요! 🖼️');
    Sound.pop();
  }

  const LS_GALLERY = 'hatchuping.gallery.v1';
  const LS_STICKERS = 'hatchuping.stickers.v1';
  const LS_SETTINGS = 'hatchuping.settings.v1';

  function readLS(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeLS(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function saveToGallery() {
    const c = document.createElement('canvas');
    c.width = c.height = 600;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, 600, 600);
    g.drawImage(paint, 0, 0, 600, 600);
    if (state.mode === 'color') {
      const entry = maskCache.get(currentGuide().id);
      if (entry && entry.img) g.drawImage(entry.img, 0, 0, 600, 600);
    }
    const data = c.toDataURL('image/png');
    const list = readLS(LS_GALLERY, []);
    list.unshift({
      id: 'g' + Date.now(),
      ts: Date.now(),
      mode: state.mode,
      guide: currentGuide().name,
      img: data,
    });
    while (list.length > 12) list.pop();
    const ok = writeLS(LS_GALLERY, list);
    if (!ok) {
      // 용량이 부족하면 오래된 것부터 지우고 재시도
      while (list.length > 1 && !writeLS(LS_GALLERY, list)) list.pop();
    }
    renderGallery();
    toast('그림첩에 저장했어요! 🖼️');
    Sound.pop();
  }

  function renderGallery() {
    const list = readLS(LS_GALLERY, []);
    const grid = $('#galleryGrid');
    const empty = $('#galleryEmpty');
    grid.innerHTML = '';
    $('#galleryCount').textContent = String(list.length);
    empty.classList.toggle('is-hidden', list.length > 0);
    list.forEach((item) => {
      const b = document.createElement('button');
      b.className = 'gallery-item';
      b.type = 'button';
      b.innerHTML = '<img src="' + item.img + '" alt="' + (item.guide || '내 그림') + '"><span class="tag">' + (item.guide || '') + '</span>';
      b.addEventListener('click', () => viewItem(item.id));
      grid.appendChild(b);
    });
    renderStickers();
  }

  function renderStickers() {
    const stickers = readLS(LS_STICKERS, []);
    const shelf = $('#stickerShelf');
    shelf.innerHTML = '';
    if (!stickers.length) {
      shelf.innerHTML = '<span class="none">그림을 완성하면 스티커를 받아요 🩷</span>';
      return;
    }
    stickers.slice(-14).forEach((s) => {
      const sp = document.createElement('span');
      sp.textContent = s.e;
      sp.title = s.d || '';
      shelf.appendChild(sp);
    });
  }

  let viewing = null;
  function viewItem(id) {
    const list = readLS(LS_GALLERY, []);
    const item = list.find((i) => i.id === id);
    if (!item) return;
    viewing = item;
    $('#viewImage').src = item.img;
    $('#viewTitle').textContent = '🖼️ ' + (item.guide || '내 그림');
    openModal('#viewModal');
  }

  function deleteItem() {
    if (!viewing) return;
    const list = readLS(LS_GALLERY, []).filter((i) => i.id !== viewing.id);
    writeLS(LS_GALLERY, list);
    viewing = null;
    closeModal('#viewModal');
    renderGallery();
    toast('그림을 지웠어요');
  }

  /* ================= 토스트 / 모달 ================= */
  let toastTimer = 0;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('is-on'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('is-on');
      setTimeout(() => { el.hidden = true; }, 300);
    }, 1900);
  }

  function openModal(sel) {
    const el = $(sel);
    el.hidden = false;
  }
  function closeModal(sel) {
    $(sel).hidden = true;
  }

  /* ================= 완성 ================= */
  function celebrate() {
    const stickers = readLS(LS_STICKERS, []);
    const sticker = STICKER_POOL[(Math.random() * STICKER_POOL.length) | 0];
    stickers.push({ e: sticker, d: new Date().toISOString().slice(0, 10) });
    writeLS(LS_STICKERS, stickers);
    $('#doneSticker').textContent = sticker;
    $('#doneTitle').textContent = state.mode === 'color' ? '색칠 완성! 🎨' : '따라그리기 완성! ✏️';
    $('#doneText').textContent = PRAISES[(Math.random() * PRAISES.length) | 0] + ' ' + sticker + ' 스티커를 받았어요!';
    openModal('#doneModal');
    resizeFx();
    burst(48);
    setTimeout(() => burst(26), 260);
    Sound.fanfare();
    renderStickers();
  }

  /* ================= UI ================= */
  function buildGuideList() {
    const list = $('#guideList');
    list.innerHTML = '';
    GUIDES.forEach((g) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'guide-card' + (g.id === state.guideId ? ' is-active' : '');
      b.dataset.guide = g.id;
      const thumb = g.free
        ? '<span class="guide-thumb is-free">✏️</span>'
        : '<span class="guide-thumb">' + window.guideLineSvg(g) + '</span>';
      b.innerHTML =
        thumb +
        '<span class="guide-meta"><span class="guide-name">' + g.emoji + ' ' + g.name + '</span>' +
        '<span class="guide-tag">' + g.tag + '</span></span>';
      b.addEventListener('click', () => selectGuide(g.id));
      list.appendChild(b);
    });
  }

  function buildPalette() {
    const p = $('#palette');
    p.innerHTML = '';
    PALETTE.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch' + (c === state.color ? ' is-on' : '');
      b.style.background = c;
      b.dataset.color = c;
      b.setAttribute('aria-label', '색 ' + c);
      b.addEventListener('click', () => setColor(c));
      p.appendChild(b);
    });
  }

  function buildSteps() {
    const bar = $('#stepBar');
    bar.innerHTML = '';
    currentGuide().steps.forEach((st, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'step-chip' + (i + 1 === state.step ? ' is-on' : '');
      b.dataset.step = String(i + 1);
      b.innerHTML = '<span class="num">' + (i + 1) + '</span><span class="slabel">' + st.label + '</span>';
      b.title = st.tip || '';
      b.addEventListener('click', () => setStep(i + 1));
      bar.appendChild(b);
    });
  }

  function setColor(c) {
    state.color = c;
    $$('#palette .swatch').forEach((el) => el.classList.toggle('is-on', el.dataset.color === c));
    saveSettings();
  }

  function setTool(t) {
    state.tool = t;
    $$('#toolGrid .tool[data-tool]').forEach((el) => el.classList.toggle('is-on', el.dataset.tool === t));
    $$('#stampGrid .stamp').forEach((el) => el.classList.remove('is-on'));
    $('#sizeRow').classList.toggle('is-dim', t === 'fill');
    applyModeVisibility();
    saveSettings();
  }

  function setStamp(kind) {
    state.stamp = kind;
    state.tool = 'stamp';
    $$('#toolGrid .tool[data-tool]').forEach((el) => el.classList.remove('is-on'));
    $$('#stampGrid .stamp').forEach((el) => el.classList.toggle('is-on', el.dataset.stamp === kind));
    applyModeVisibility();
  }

  function setSize(n) {
    state.size = n;
    $$('#sizeRow .size').forEach((el) => el.classList.toggle('is-on', Number(el.dataset.size) === n));
    saveSettings();
  }

  function selectGuide(id) {
    if (state.guideId === id) return;
    state.guideId = id;
    state.step = 1;
    praised = 0;
    $$('#guideList .guide-card').forEach((el) => el.classList.toggle('is-active', el.dataset.guide === id));
    renderLayers();
    buildSteps();
    refreshTraceSteps();
    redraw();
    ensureMask(currentGuide()).then((entry) => {
      if (entry && entry.data) {
        maskData = entry.data;
      }
    });
    Sound.step();
    updateProgressSoon();
    hideHint();
  }

  function setStep(n) {
    state.step = n;
    $$('#stepBar .step-chip').forEach((el) => {
      el.classList.toggle('is-on', Number(el.dataset.step) === n);
      el.classList.toggle('is-done', Number(el.dataset.step) < n);
    });
    refreshTraceSteps();
    if (n === 4) toast('선을 다 그렸어요! 이제 색칠해 봐요 🎨');
    else toast('좋아요! ' + n + '단계예요 ✏️');
    Sound.step();
  }

  function setMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    state.tool = mode === 'color' ? 'fill' : 'pen';
    state.step = 1;
    praised = 0;
    $$('.mode-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.mode === mode));
    $('#modeCaption').textContent = mode === 'color' ? '색칠공부' : '따라그리기';
    document.body.classList.toggle('mode-trace', mode === 'trace');
    $('#controlsColor').classList.toggle('is-hidden', mode !== 'color');
    $('#controlsTrace').classList.toggle('is-hidden', mode !== 'trace');
    $('#hintBtn').classList.toggle('is-on', state.hint);
    $('#toolGrid .tool[data-tool="fill"]').classList.toggle('is-hidden', mode !== 'color');
    $('#hintLayer').classList.toggle('is-on', mode === 'color' && state.hint);
    $$('#toolGrid .tool[data-tool]').forEach((el) => el.classList.toggle('is-on', el.dataset.tool === state.tool));
    $$('#stampGrid .stamp').forEach((el) => el.classList.remove('is-on'));
    buildSteps();
    renderLayers();
    refreshTraceSteps();
    redraw();
    ensureMask(currentGuide());
    hideHintReset();
    updateProgressSoon();
    saveSettings();
    fitStage();
  }

  function hideHintReset() {
    stageHint.classList.remove('is-gone');
    setTimeout(() => {
      if (!ops().length) return;
      stageHint.classList.add('is-gone');
    }, 2600);
  }

  /* ================= 설정 저장 ================= */
  function saveSettings() {
    writeLS(LS_SETTINGS, {
      mode: state.mode,
      guideId: state.guideId,
      tool: state.tool,
      color: state.color,
      size: state.size,
      muted: state.muted,
      hint: state.hint,
    });
  }
  function loadSettings() {
    const s = readLS(LS_SETTINGS, null);
    if (!s) return;
    if (s.guideId && GUIDES.some((g) => g.id === s.guideId)) state.guideId = s.guideId;
    if (s.color && PALETTE.includes(s.color)) state.color = s.color;
    if (s.size) state.size = s.size;
    state.muted = !!s.muted;
    state.hint = !!s.hint;
  }

  /* ================= 화면 맞춤 ================= */
  function fitStage() {
    const root = document.documentElement;
    if (window.innerWidth > 1000) {
      root.style.removeProperty('--stage-max');
      return;
    }
    const h = (sel) => {
      const el = $(sel);
      return el ? el.getBoundingClientRect().height : 0;
    };
    const controls = state.mode === 'color' ? h('#controlsColor') : h('#controlsTrace');
    const used = h('.topbar') + h('.guides-panel') + h('.progress') + controls + h('.tools-panel');
    const avail = window.innerHeight - used - 78;
    const size = Math.max(200, Math.min(window.innerWidth - 24, avail));
    root.style.setProperty('--stage-max', size + 'px');
  }

  /* ================= 이벤트 연결 ================= */
  function bind() {
    stageEl.addEventListener('pointerdown', onDown);
    stageEl.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    stageEl.addEventListener('contextmenu', (e) => e.preventDefault());

    $$('.mode-btn').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    $$('#toolGrid .tool[data-tool]').forEach((b) =>
      b.addEventListener('click', () => { setTool(b.dataset.tool); Sound.step(); })
    );
    $('#undoBtn2').addEventListener('click', undo);
    $('#undoBtn').addEventListener('click', undo);

    $$('#sizeRow .size').forEach((b) => b.addEventListener('click', () => setSize(Number(b.dataset.size))));
    $$('#stampGrid .stamp').forEach((b) =>
      b.addEventListener('click', () => { setStamp(b.dataset.stamp); Sound.pop(); })
    );

    $('#soundBtn').addEventListener('click', () => {
      state.muted = !state.muted;
      $('#soundBtn').textContent = state.muted ? '🔇' : '🔊';
    $('#showAllBtn').classList.toggle('is-on', !!state.showAll);
      Sound.unlock();
      if (!state.muted) Sound.pop();
      saveSettings();
    });

    $('#hintBtn').addEventListener('click', () => {
      state.hint = !state.hint;
      $('#hintBtn').classList.toggle('is-on', state.hint);
      hintLayer.classList.toggle('is-on', state.hint);
      Sound.step();
      saveSettings();
    });

    $('#doneBtnColor').addEventListener('click', celebrate);
    $('#doneBtnTrace').addEventListener('click', celebrate);
    $('#doneBtn2') && $('#doneBtn2').addEventListener('click', celebrate);

    $('#showAllBtn').addEventListener('click', () => {
      state.showAll = !state.showAll;
      $('#showAllBtn').classList.toggle('is-on', state.showAll);
      refreshTraceSteps();
      Sound.step();
    });

    $('#opacityRange').value = String(Math.round(state.guideAlpha * 100));
    $('#opacityRange').addEventListener('input', (e) => {
      state.guideAlpha = Number(e.target.value) / 100;
      const tsvg = traceLayer.querySelector('svg');
      if (tsvg) tsvg.style.setProperty('--guide-alpha', state.guideAlpha);
    });

    $('#resetBtnColor').addEventListener('click', () => {
      if (!ops().length) { toast('아직 아무것도 없어요 🙂'); return; }
      openModal('#confirmModal');
    });
    $('#resetBtnTrace').addEventListener('click', () => {
      if (!ops().length) { toast('아직 아무것도 없어요 🙂'); return; }
      openModal('#confirmModal');
    });
    $('#confirmYes').addEventListener('click', () => {
      closeModal('#confirmModal');
      resetAll();
      toast('새로 시작해요! ✨');
    });
    $('#confirmNo').addEventListener('click', () => closeModal('#confirmModal'));

    $('#downloadBtn').addEventListener('click', downloadPNG);
    $('#saveBtn').addEventListener('click', saveToGallery);
    $('#gallerySave').addEventListener('click', saveToGallery);
    $('#galleryBtn').addEventListener('click', () => { renderGallery(); openModal('#galleryModal'); });
    $('#galleryBtn2').addEventListener('click', () => { renderGallery(); openModal('#galleryModal'); });
    $('#galleryClose').addEventListener('click', () => closeModal('#galleryModal'));
    $('#viewClose').addEventListener('click', () => closeModal('#viewModal'));
    $('#viewDelete').addEventListener('click', deleteItem);
    $('#viewDownload').addEventListener('click', () => {
      if (!viewing) return;
      const a = document.createElement('a');
      a.download = 'hatchuping-gallery.png';
      a.href = viewing.img;
      a.click();
    });

    $('#doneClose').addEventListener('click', () => { clearFx(); closeModal('#doneModal'); });
    $('#doneSave').addEventListener('click', () => {
      saveToGallery();
      clearFx();
      closeModal('#doneModal');
    });

    $$('.modal').forEach((m) => {
      m.addEventListener('click', (e) => {
        if (e.target === m && m.id !== 'doneModal' && m.id !== 'confirmModal') m.hidden = true;
      });
    });

    // 시작 화면
    $$('.choice').forEach((b) =>
      b.addEventListener('click', () => {
        Sound.unlock();
        setMode(b.dataset.mode);
        const s = $('#startScreen');
        s.classList.add('is-gone');
        setTimeout(() => { s.style.display = 'none'; }, 400);
        Sound.fanfare();
      })
    );

    window.addEventListener('resize', debounce(() => { resizeFx(); fitStage(); }, 180));
  }

  /* ================= 초기화 ================= */
  function init() {
    loadSettings();
    buildGuideList();
    buildPalette();
    buildSteps();
    renderLayers();
    refreshTraceSteps();
    setSize(state.size);
    setColor(state.color);
    setTool(state.mode === 'color' ? state.tool : 'pen');
    $('#soundBtn').textContent = state.muted ? '🔇' : '🔊';
    $('#showAllBtn').classList.toggle('is-on', !!state.showAll);
    $('#hintBtn').classList.toggle('is-on', state.hint);
    $('#modeCaption').textContent = state.mode === 'color' ? '색칠공부' : '따라그리기';
    document.body.classList.toggle('mode-trace', state.mode === 'trace');

    // 시작 화면 미리보기 그림
    const hp = GUIDES[0];
    const ca = $('#choiceArtColor');
    if (ca) ca.innerHTML = window.guideLineSvg(hp);
    const ct = $('#choiceArtTrace');
    if (ct) {
      ct.innerHTML = window.guideTraceSvg(hp);
      const svg = ct.querySelector('svg');
      if (svg) {
        svg.classList.add('show-all');
        svg.style.setProperty('--guide-alpha', '1');
      }
    }

    $$('.mode-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.mode === state.mode));
    $('#controlsColor').classList.toggle('is-hidden', state.mode !== 'color');
    $('#controlsTrace').classList.toggle('is-hidden', state.mode !== 'trace');
    $('#toolGrid .tool[data-tool="fill"]').classList.toggle('is-hidden', state.mode !== 'color');

    bind();
    ensureMask(currentGuide()).then((entry) => {
      if (entry && entry.data) maskData = entry.data;
    });
    resizeFx();
    renderGallery();
    updateProgress();
    fitStage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
