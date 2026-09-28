import { COLORS, coverCrop, formatDate, sortedScorers, MONTHS_EN } from './lib.js';

export const W = 1080, H = 1350;
const TITLE = '"Black Han Sans", "Apple SD Gothic Neo", sans-serif';
const BODY = '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif';

function canvas() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  return [c, c.getContext('2d')];
}
function stripes(ctx, x, y, w, h, n) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? COLORS.black : COLORS.blue;
    ctx.fillRect(x + (w / n) * i, y, w / n + 1, h);
  }
}
function drawPhoto(ctx, img) {
  const c = coverCrop(img.width, img.height, W, H);
  ctx.drawImage(img, c.sx, c.sy, c.sw, c.sh, 0, 0, W, H);
}
function text(ctx, s, x, y, size, { font = BODY, color = COLORS.white, align = 'left', weight = '' } = {}) {
  ctx.font = `${weight} ${size}px ${font}`.trim();
  ctx.fillStyle = color; ctx.textAlign = align;
  ctx.fillText(s, x, y, W - 128); // maxWidth: 긴 이름은 가로로 압축
}
function logo(ctx, img, x, y, size) {
  if (img) ctx.drawImage(img, x, y, size, size);
  else text(ctx, 'GONGGIGYE', x, y + 56, 56, { font: TITLE });
}
const scoreLine = g => `${g.a}  ${g.as} : ${g.bs}  ${g.b}`;

export function cover(r, img, logoImg) {
  const [c, ctx] = canvas();
  if (img) drawPhoto(ctx, img); else stripes(ctx, 0, 0, W, H, 12);
  const g = ctx.createLinearGradient(0, H * 0.35, 0, H);
  g.addColorStop(0, 'rgba(14,26,60,0)'); g.addColorStop(1, 'rgba(14,26,60,0.95)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  logo(ctx, logoImg, 48, 48, 170);
  const n = r.games.length;
  let y = n === 1 ? H - 370 : H - 190 - n * 76;
  text(ctx, 'MATCH RESULT', 64, y, 72, { font: TITLE });
  y += 60;
  text(ctx, `${formatDate(r.date)} · ${r.place}`, 64, y, 40);
  if (n === 1) text(ctx, scoreLine(r.games[0]), W / 2, y + 190, 124, { font: TITLE, align: 'center' });
  else r.games.forEach((gm, i) => text(ctx, `${i + 1}  ${scoreLine(gm)}`, 64, y + 90 + i * 76, 64, { font: TITLE }));
  return c;
}

export function summary(r, logoImg) {
  const [c, ctx] = canvas();
  ctx.fillStyle = COLORS.navy; ctx.fillRect(0, 0, W, H);
  stripes(ctx, 0, 0, W, 28, 16);
  logo(ctx, logoImg, W - 48 - 150, 70, 150);
  text(ctx, 'RESULT', 64, 190, 96, { font: TITLE });
  text(ctx, `${formatDate(r.date)} · ${r.place}${r.people ? ` · ${r.people}명` : ''}`, 64, 256, 40);
  let y = 380;
  r.games.forEach((g, i) => {
    text(ctx, `${i + 1}경기`, 64, y, 40, { color: '#9FB0E8' });
    text(ctx, scoreLine(g), W / 2 + 40, y, 60, { font: TITLE, align: 'center' });
    y += 88;
  });
  const sc = sortedScorers(r.scorers);
  if (sc.length) {
    y += 30;
    ctx.fillStyle = COLORS.blue; ctx.fillRect(64, y - 44, 8, 52);
    text(ctx, '득점 · 도움', 90, y, 44, { weight: '700' });
    y += 70;
    for (const s of sc) {
      if (y > H - 60) break;
      text(ctx, s.name, 64, y, 40);
      text(ctx, `골 ${s.goals} · 도움 ${s.assists}`, W - 64, y, 40, { align: 'right' });
      y += 58;
    }
  }
  return c;
}

export function photoSlide(img) {
  const [c, ctx] = canvas();
  drawPhoto(ctx, img);
  return c;
}

export function schedule(s, logoImg) {
  const [c, ctx] = canvas();
  const m = Number(s.month.split('-')[1]);
  ctx.fillStyle = COLORS.navy; ctx.fillRect(0, 0, W, H);
  stripes(ctx, 0, 0, 36, H, 1);
  logo(ctx, logoImg, 90, 70, 170);
  text(ctx, `${MONTHS_EN[m - 1].toUpperCase()} FIXTURES`, 90, 360, 92, { font: TITLE });
  text(ctx, `${m}월 경기 일정`, 90, 430, 48);
  let y = 560;
  for (const x of s.matches) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(90, y - 70, W - 154, 150);
    text(ctx, formatDate(x.date), 120, y, 64, { font: TITLE });
    text(ctx, `${x.start}–${x.end}`, 120, y + 56, 38);
    text(ctx, x.place, W - 94, y, 40, { align: 'right' });
    if (x.opp) text(ctx, `vs ${x.opp}`, W - 94, y + 56, 40, { align: 'right', color: '#9FB0E8', weight: '700' });
    y += 180;
  }
  text(ctx, '참여는 톡방 투표로!', W / 2, H - 80, 40, { align: 'center' });
  return c;
}
