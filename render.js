import { COLORS, coverCrop, formatDate, sortedScorers, MONTHS_EN, photoRect, defaultView } from './lib.js';

export const W = 1080, H = 1350;
const TITLE = '"Black Han Sans", "Pretendard", "Apple SD Gothic Neo", sans-serif';
const BODY = '"Pretendard", "Apple SD Gothic Neo", sans-serif';
const SUB = '#9FB0E8';
const M = 64; // 좌우 여백

// target을 주면 그 캔버스에 다시 그림 (편집기에서 매 프레임 재사용)
function canvas(target) {
  const c = target || Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = c.getContext('2d');
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  return [c, ctx];
}
function stripes(ctx, x, y, w, h, n) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? COLORS.black : COLORS.blue;
    ctx.fillRect(x + (w / n) * i, y, w / n + 1, h);
  }
}
function text(ctx, s, x, y, size, { font = BODY, color = COLORS.white, align = 'left', weight = '', max = W - 2 * M } = {}) {
  ctx.font = `${weight} ${size}px ${font}`.trim();
  ctx.fillStyle = color; ctx.textAlign = align;
  ctx.fillText(s, x, y, max); // max: 긴 이름은 가로로 압축
}
function width(ctx, s, size, font = TITLE, weight = '') {
  ctx.font = `${weight} ${size}px ${font}`.trim();
  return ctx.measureText(s).width;
}
function logo(ctx, img, x, y, size, alignRight = false) {
  if (img) return ctx.drawImage(img, alignRight ? x - size : x, y, size, size);
  text(ctx, 'GONGGIGYE', x, y + size / 2 + 18, 48, { font: TITLE, align: alignRight ? 'right' : 'left', max: 320 });
}
function pill(ctx, s, x, y, { bg = COLORS.blue, size = 34 } = {}) {
  const w = width(ctx, s, size, BODY, '800') + 48;
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(x, y, w, size + 30, (size + 30) / 2); ctx.fill();
  text(ctx, s, x + 24, y + size + 6, size, { weight: '800' });
}
function bottomShade(ctx, from) {
  const g = ctx.createLinearGradient(0, from, 0, H);
  g.addColorStop(0, 'rgba(14,26,60,0)'); g.addColorStop(0.55, 'rgba(14,26,60,0.85)'); g.addColorStop(1, 'rgba(14,26,60,0.98)');
  ctx.fillStyle = g; ctx.fillRect(0, from, W, H - from);
}
// 흐린 배경 (같은 사진을 꽉 채워 흐리게). 편집기에서는 한 번 만들어 재사용
// 작은 캔버스에 자기 자신을 조금씩 밀어 겹쳐 그리는 간이 박스 블러 (pass회 반복)
function boxBlur(t, pass) {
  const tc = t.getContext('2d'), copy = Object.assign(document.createElement('canvas'), { width: t.width, height: t.height });
  const cc = copy.getContext('2d');
  for (let p = 0; p < pass; p++) {
    cc.clearRect(0, 0, t.width, t.height); cc.drawImage(t, 0, 0);
    tc.globalAlpha = 1 / 5;
    for (const [dx, dy] of [[0, 0], [-2, 0], [2, 0], [0, -2], [0, 2]]) tc.drawImage(copy, dx, dy);
    tc.globalAlpha = 1;
  }
}
export function makeBg(img) {
  const [c, ctx] = canvas();
  const cr = coverCrop(img.width, img.height, W, H);
  // 흐림: ctx.filter는 iOS Safari가 지원하지 않아 (선명한 사진이 겹쳐 보임) 쓰지 않는다.
  // 대신 아주 작게 줄였다가(3단계) 다시 키워서 모든 브라우저에서 같은 흐림을 만든다.
  let src = img, sx = cr.sx, sy = cr.sy, sw = cr.sw, sh = cr.sh;
  for (const k of [8, 24, 48]) {
    const t = Object.assign(document.createElement('canvas'), { width: Math.round(W / k), height: Math.round(H / k) });
    const tc = t.getContext('2d');
    tc.imageSmoothingEnabled = true; tc.imageSmoothingQuality = 'high';
    tc.drawImage(src, sx, sy, sw, sh, 0, 0, t.width, t.height);
    src = t; sx = sy = 0; sw = t.width; sh = t.height;
  }
  // 한 번에 키우면 모자이크처럼 보여서, 키울 때도 단계적으로 (각 단계의 부드러운 보간이 쌓여 흐림이 매끈해짐)
  for (const k of [12, 3]) {
    const t = Object.assign(document.createElement('canvas'), { width: Math.round(W / k), height: Math.round(H / k) });
    const tc = t.getContext('2d');
    tc.imageSmoothingEnabled = true; tc.imageSmoothingQuality = 'high';
    tc.drawImage(src, 0, 0, sw, sh, 0, 0, t.width, t.height);
    if (k === 12) boxBlur(t, 3);
    src = t; sw = t.width; sh = t.height;
  }
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, sw, sh, -60, -60, W + 120, H + 120);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 0, W, H); // 밝기 70%
  return c;
}
// 사진을 view대로 그리고, 캔버스 안에 들어온 가장자리는 흐린 배경에 녹인다 (페더)
const FEATHER = 130;
let fgCanvas;
function photoLayer(ctx, img, view, bg) {
  ctx.drawImage(bg || makeBg(img), 0, 0);
  const r = photoRect(img.width, img.height, view);
  fgCanvas ||= Object.assign(document.createElement('canvas'), { width: W, height: H });
  const f = fgCanvas.getContext('2d');
  f.globalCompositeOperation = 'source-over';
  f.clearRect(0, 0, W, H);
  f.drawImage(img, r.x, r.y, r.w, r.h);
  f.globalCompositeOperation = 'destination-in';
  const fade = (x0, y0, x1, y1) => {
    const g = f.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    f.fillStyle = g; f.fillRect(0, 0, W, H);
  };
  const fw = Math.min(FEATHER, r.w / 3), fh = Math.min(FEATHER, r.h / 3);
  if (r.y > 0) fade(0, r.y, 0, r.y + fh);
  if (r.y + r.h < H) fade(0, r.y + r.h, 0, r.y + r.h - fh);
  if (r.x > 0) fade(r.x, 0, r.x + fw, 0);
  if (r.x + r.w < W) fade(r.x + r.w, 0, r.x + r.w - fw, 0);
  ctx.drawImage(fgCanvas, 0, 0);
  return r;
}

// "파랑  2 : 6  검정" — 이긴 팀은 흰색, 진 팀은 흐리게
function scoreRow(ctx, g, cx, y, size) {
  const sc = `${g.as} : ${g.bs}`;
  const half = width(ctx, sc, size) / 2 + size * 0.35;
  const nameSize = Math.round(size * 0.56);
  const col = (me, other) => (me >= other ? COLORS.white : SUB);
  text(ctx, sc, cx, y, size, { font: TITLE, align: 'center' });
  text(ctx, g.a, cx - half, y - size * 0.12, nameSize, { font: TITLE, align: 'right', color: col(g.as, g.bs), max: cx - half - M });
  text(ctx, g.b, cx + half, y - size * 0.12, nameSize, { font: TITLE, align: 'left', color: col(g.bs, g.as), max: W - M - (cx + half) });
}
const meta = r => [formatDate(r.date), r.place, r.people ? `${r.people}명` : ''].filter(Boolean).join(' · ');

// o = { view, bg, target } — 모두 선택. view가 없으면 자동 배치
export function cover(r, img, logoImg, o = {}) {
  const [c, ctx] = canvas(o.target);
  ctx.fillStyle = COLORS.navy; ctx.fillRect(0, 0, W, H);
  const games = r.games.slice(0, 3);
  const resH = games.length === 1 ? 300 : 110 + games.length * 96; // 결과 블록 높이
  let y = H - resH - 60;
  if (img) {
    const auto = defaultView(img.width, img.height, 'cover');
    photoLayer(ctx, img, o.view || auto, o.bg);
    // 글자 위치는 자동 배치 기준으로 고정 (편집 중에 글자가 따라 움직이지 않게)
    const pr = photoRect(img.width, img.height, auto);
    y = Math.min(y, Math.max(760, pr.y + pr.h - 80));
  } else stripes(ctx, 0, 0, W, y - 100, 12);
  bottomShade(ctx, y - 260);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14;
  logo(ctx, logoImg, 56, 36, 110);
  text(ctx, formatDate(r.date), W - 56, 104, 40, { align: 'right', weight: '800' });
  text(ctx, 'MATCH RESULT', M, y, 58, { font: TITLE, color: SUB });
  if (r.games.length > 3) text(ctx, `외 ${r.games.length - 3}경기`, W - M, y, 34, { align: 'right', color: SUB });
  if (games.length === 1) scoreRow(ctx, games[0], W / 2, y + 190, 160);
  else games.forEach((g, i) => scoreRow(ctx, g, W / 2, y + 110 + i * 96, 88));
  text(ctx, [r.place, r.people ? `${r.people}명` : ''].filter(Boolean).join(' · '), M, H - 46, 32, { color: SUB });
  return c;
}

export function summary(r, logoImg) {
  const [c, ctx] = canvas();
  ctx.fillStyle = COLORS.navy; ctx.fillRect(0, 0, W, H);
  stripes(ctx, 0, 0, W, 20, 16);
  stripes(ctx, 0, H - 20, W, 20, 16);
  logo(ctx, logoImg, W - 56, 50, 110, true);
  text(ctx, 'FULL TIME', M, 150, 96, { font: TITLE });
  text(ctx, meta(r), M, 214, 38, { color: SUB });

  const sc = sortedScorers(r.scorers).slice(0, 6);
  const top = 270, bottom = H - 60;
  const n = r.games.length;
  const gamesH = sc.length ? Math.min(n === 1 ? 340 : 180 * n, 600) : Math.min(n === 1 ? 520 : 240 * n, bottom - top);
  const cardH = gamesH / n;
  const top0 = sc.length ? top : top + (bottom - top - gamesH) / 2; // 득점자 없으면 가운데
  r.games.forEach((g, i) => {
    const y = top0 + i * cardH;
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath(); ctx.roundRect(M, y, W - 2 * M, cardH - 16, 28); ctx.fill();
    if (r.games.length > 1) text(ctx, `${i + 1}경기`, M + 32, y + 50, 30, { color: SUB, weight: '700' });
    const size = Math.min(n === 1 ? 180 : 110, (cardH - 16) * 0.58);
    scoreRow(ctx, g, W / 2, y + (cardH - 16) / 2 + size * 0.36, size);
  });
  if (!sc.length) return c;

  let y = top + gamesH + 60;
  ctx.fillStyle = COLORS.blue; ctx.fillRect(M, y - 40, 10, 50);
  text(ctx, '득점 · 도움', M + 30, y, 46, { weight: '800' });
  const rowH = Math.min(118, (bottom - y - 20) / sc.length);
  const fs = Math.min(48, rowH * 0.46);
  y += 30;
  sc.forEach((p, i) => {
    const cy = y + rowH * (i + 0.5);
    ctx.fillStyle = i === 0 ? COLORS.blue : 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.arc(M + rowH * 0.32, cy, rowH * 0.3, 0, Math.PI * 2); ctx.fill();
    text(ctx, String(i + 1), M + rowH * 0.32, cy + fs * 0.36, fs * 0.9, { font: TITLE, align: 'center' });
    text(ctx, p.name, M + rowH * 0.8, cy + fs * 0.36, fs, { weight: '700', max: 360 });
    const dots = '●'.repeat(Math.min(p.goals, 8));
    text(ctx, dots, M + rowH * 0.8 + 380, cy + fs * 0.3, fs * 0.6, { color: COLORS.blue, max: 220 });
    const stat = [p.goals && `${p.goals}골`, p.assists && `${p.assists}도움`].filter(Boolean).join(' ');
    text(ctx, stat, W - M, cy + fs * 0.36, fs, { align: 'right', font: TITLE });
  });
  return c;
}

// 잘한 선수 카드: 선수 사진 꽉 채움 + 이름 + 기록
export function playerCard(p, r, img, logoImg, badge, o = {}) {
  const [c, ctx] = canvas(o.target);
  photoLayer(ctx, img, o.view || defaultView(img.width, img.height, 'player'), o.bg);
  bottomShade(ctx, H * 0.45);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 16;
  if (badge) pill(ctx, badge, 56, 56);
  logo(ctx, logoImg, W - 56, 40, 100, true);
  ctx.shadowBlur = 0;
  text(ctx, p.name, M, H - 330, 128, { font: TITLE });
  let x = M;
  for (const [n, label] of [[p.goals, 'GOALS'], [p.assists, 'ASSISTS']]) {
    text(ctx, String(n), x, H - 150, 150, { font: TITLE, color: n ? COLORS.white : SUB });
    x += width(ctx, String(n), 150) + 18;
    text(ctx, label, x, H - 156, 40, { weight: '800', color: SUB });
    x += width(ctx, label, 40, BODY, '800') + 70;
  }
  ctx.fillStyle = COLORS.blue; ctx.fillRect(M, H - 104, 120, 8);
  text(ctx, [formatDate(r.date), r.place].filter(Boolean).join(' · '), M, H - 48, 32, { color: SUB });
  return c;
}
// 선수 카드 배지: 골 1위는 TOP SCORER, 골 없이 도움만 있으면 PLAYMAKER
export function badgeFor(p, i, list) {
  if (i === 0 && p.goals > 0 && (list.length < 2 || list[1].goals < p.goals)) return '★ TOP SCORER';
  if (!p.goals && p.assists) return 'PLAYMAKER';
  return '';
}

// 추가 사진: 자동 배치(가로는 1.25배 확대 + 위아래 녹임) 또는 사용자가 맞춘 view
export function photoSlide(img, o = {}) {
  const [c, ctx] = canvas(o.target);
  photoLayer(ctx, img, o.view || defaultView(img.width, img.height, 'photo'), o.bg);
  return c;
}

export function schedule(s, logoImg) {
  const [c, ctx] = canvas();
  const m = Number(s.month.split('-')[1]);
  ctx.fillStyle = COLORS.navy; ctx.fillRect(0, 0, W, H);
  stripes(ctx, 0, 0, 36, H, 1);
  logo(ctx, logoImg, 90, 60, 150);
  text(ctx, `${MONTHS_EN[m - 1].toUpperCase()}`, 90, 360, 120, { font: TITLE });
  text(ctx, 'FIXTURES', 90, 470, 120, { font: TITLE, color: SUB });
  text(ctx, `${m}월 공기계 경기 일정`, 90, 540, 44, { weight: '700' });
  const rowH = Math.min(190, (H - 620 - 130) / s.matches.length);
  s.matches.forEach((x, i) => {
    const y = 620 + i * rowH;
    ctx.fillStyle = x.opp ? 'rgba(30,63,203,0.35)' : 'rgba(255,255,255,0.08)';
    ctx.beginPath(); ctx.roundRect(90, y, W - 154, rowH - 20, 28); ctx.fill();
    const mid = y + (rowH - 20) / 2;
    text(ctx, formatDate(x.date), 126, mid + 4, 66, { font: TITLE });
    text(ctx, `${x.start}–${x.end}`, 126, mid + 56, 36, { color: SUB });
    text(ctx, x.place, W - 100, mid + 4, 42, { align: 'right', weight: '700', max: 420 });
    if (x.opp) text(ctx, `vs ${x.opp}`, W - 100, mid + 56, 38, { align: 'right', color: SUB, weight: '800', max: 420 });
  });
  text(ctx, '참여는 톡방 투표로!', (W + 36) / 2, H - 70, 40, { align: 'center', weight: '700' });
  return c;
}
