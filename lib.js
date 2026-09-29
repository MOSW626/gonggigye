// 수정 포인트: 해시태그·색은 여기만 바꾸면 된다
export const HASHTAGS = '#공기계 #GONGGIGYE #KAIST #카이스트 #기계공학과 #풋살 #축구';
export const COLORS = { navy: '#0E1A3C', blue: '#1E3FCB', black: '#0A0A0A', white: '#FFFFFF' };
export const MAX_SLIDES = 10;
export const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = '일월화수목금토';

const parts = iso => iso.split('-').map(Number);
const md = iso => { const [, m, d] = parts(iso); return `${m}/${d}`; };

export function formatDate(iso) {
  const [y, m, d] = parts(iso);
  return `${m}/${d}(${DAYS[new Date(y, m - 1, d).getDay()]})`;
}

export function nextMonth(today = new Date()) {
  const d = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const score = s => Number.isInteger(s) && s >= 0;

export function validateResult(r) {
  const e = [];
  if (!r.date) e.push('날짜를 입력하세요');
  if (!r.games.length || r.games.length > 6) e.push('경기는 1~6판');
  r.games.forEach((g, i) => {
    if (!g.a || !g.b) e.push(`${i + 1}경기: 팀 이름을 입력하세요`);
    if (!score(g.as) || !score(g.bs)) e.push(`${i + 1}경기: 점수는 0 이상 정수`);
  });
  r.scorers.forEach(s => {
    if (!score(s.goals) || !score(s.assists)) e.push(`${s.name}: 골·도움은 0 이상 정수`);
  });
  return e;
}

export function validateSchedule(s) {
  const e = [];
  if (!s.month) e.push('월을 입력하세요');
  if (s.matches.length < 1 || s.matches.length > 4) e.push('경기는 1~4건');
  s.matches.forEach((m, i) => {
    if (!m.date || !m.start || !m.end || !m.place) e.push(`${i + 1}번째 경기: 날짜·시간·장소를 입력하세요`);
  });
  return e;
}

// 표지(사진 1장 사용) + 결과 1장 + 선수카드 + 추가사진, 인스타 10장 제한. 선수카드가 우선.
export function planSlides(photoCount, playerCount = 0) {
  const room = MAX_SLIDES - 2;
  const players = Math.min(playerCount, room);
  const rest = Math.max(photoCount - 1, 0);
  const extra = Math.min(rest, room - players);
  return { players, extra, dropped: (playerCount - players) + (rest - extra), total: 2 + players + extra };
}

// fy: 세로로 자를 때 초점 (0 = 맨 위, 0.5 = 가운데)
export function coverCrop(sw, sh, dw, dh, fy = 0.5) {
  const scale = Math.max(dw / sw, dh / sh);
  const cw = dw / scale, ch = dh / scale;
  return { sx: (sw - cw) / 2, sy: (sh - ch) * fy, sw: cw, sh: ch };
}

// 자르지 않고 상자 안에 통째로 넣을 크기
export function containRect(sw, sh, bw, bh) {
  const s = Math.min(bw / sw, bh / sh);
  return { w: Math.round(sw * s), h: Math.round(sh * s) };
}

export function sortedScorers(list) {
  return list.filter(s => s.name).sort((a, b) => (b.goals - a.goals) || (b.assists - a.assists));
}

const scoreKo = g => `${g.a} ${g.as} : ${g.bs} ${g.b}`;
const scoreEn = g => `${g.a} ${g.as}–${g.bs} ${g.b}`;

export function resultCaption(r) {
  const multi = r.games.length > 1;
  const lines = [`${formatDate(r.date)} 공기계 경기 결과 ⚽`];
  r.games.forEach((g, i) => lines.push((multi ? `${i + 1}경기 ` : '') + scoreKo(g)));
  const sc = sortedScorers(r.scorers);
  const goals = sc.filter(s => s.goals > 0).map(s => `${s.name} ${s.goals}`);
  const assists = sc.filter(s => s.assists > 0).map(s => `${s.name} ${s.assists}`);
  const gl = [goals.length && `득점: ${goals.join(', ')}`, assists.length && `도움: ${assists.join(', ')}`].filter(Boolean);
  if (gl.length) lines.push(gl.join(' / '));
  if (r.comment) lines.push(r.comment);
  const en = r.games.map((g, i) => (multi ? `Game ${i + 1}: ` : '') + scoreEn(g)).join(' · ');
  return [...lines, '', `Match day ${md(r.date)} ⚽ ${en}`, '', HASHTAGS].join('\n');
}

export function scheduleCaption(s) {
  const m = Number(s.month.split('-')[1]);
  const opp = x => (x.opp ? ` vs ${x.opp}` : '');
  const lines = [`${m}월 공기계 경기 일정 ⚽`,
    ...s.matches.map(x => `${formatDate(x.date)} ${x.start}–${x.end} ${x.place}${opp(x)}`),
    '참여는 톡방 투표로!'];
  const en = s.matches.map(x => `${md(x.date)} ${x.start}${opp(x)}`).join(' · ');
  return [...lines, '', `${MONTHS_EN[m - 1]} fixtures ⚽ ${en}`, '', HASHTAGS].join('\n');
}

// ── 사진 배치 (v2.1) ──
// view = { zoom, cx, cy }: zoom은 "폭 맞춤" 대비 배율, cx/cy는 사진 중심의 캔버스 좌표
export const CW = 1080, CH = 1350;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function photoRect(sw, sh, { zoom, cx, cy }) {
  const w = Math.round(CW * zoom), h = Math.round(sh * (CW / sw) * zoom);
  return { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w, h };
}

// 자동 배치. kind: 'cover'(표지, bottom 필요) | 'player'(선수 카드) | 'photo'(추가 사진)
// 가로 사진: 폭 맞춤에서 1.25배 (좌우 한쪽 최대 12%만 잘림) / 세로 사진·선수: 꽉 채우고 위 30% 초점
export function defaultView(sw, sh, kind, { bottom } = {}) {
  const h0 = sh * (CW / sw);
  if (kind === 'player' || h0 >= CH) {
    const zoom = Math.max(1, CH / h0), h = Math.round(h0 * zoom);
    const focus = kind === 'photo' ? 0.5 : 0.3;
    return { zoom, cx: CW / 2, cy: h / 2 - (h - CH) * focus };
  }
  const zoom = 1 / Math.max(1 / 1.25, 1 - 2 * 0.12);
  const h = photoRect(sw, sh, { zoom, cx: 0, cy: 0 }).h;
  // 표지: 사진 아래 끝을 bottom(스코어 블록 위)에 맞춤 → 스코어 아래 빈 공간이 안 생김
  return { zoom, cx: CW / 2, cy: bottom ? bottom - h / 2 : CH / 2 };
}

export function clampView({ zoom, cx, cy }) {
  return { zoom: clamp(zoom, 0.4, 4), cx: clamp(cx, 0, CW), cy: clamp(cy, 0, CH) };
}
