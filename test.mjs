import assert from 'node:assert/strict';
import * as L from './lib.js';

// 날짜
assert.equal(L.formatDate('2026-10-07'), '10/7(수)');
assert.equal(L.nextMonth(new Date(2026, 11, 15)), '2027-01');
assert.equal(L.nextMonth(new Date(2026, 8, 29)), '2026-10');

// 검증
const ok = { date: '2026-10-07', place: '북측 운동장', people: 14,
  games: [{ a: '파랑', as: 3, b: '검정', bs: 2 }], scorers: [], comment: '' };
assert.deepEqual(L.validateResult(ok), []);
assert.ok(L.validateResult({ ...ok, date: '' }).length);
assert.ok(L.validateResult({ ...ok, games: [] }).length);
assert.ok(L.validateResult({ ...ok, games: [{ a: '파랑', as: NaN, b: '검정', bs: 2 }] }).length);
assert.ok(L.validateResult({ ...ok, games: [{ a: '파랑', as: -1, b: '검정', bs: 2 }] }).length);
assert.ok(L.validateResult({ ...ok, games: [{ a: '파랑', as: 1.5, b: '검정', bs: 2 }] }).length);
assert.ok(L.validateResult({ ...ok, games: [{ a: '', as: 1, b: '검정', bs: 2 }] }).length);
const sOk = { month: '2026-10', matches: [{ date: '2026-10-07', start: '20:00', end: '22:00', place: '북측 운동장', opp: '' }] };
assert.deepEqual(L.validateSchedule(sOk), []);
assert.ok(L.validateSchedule({ ...sOk, matches: [] }).length);
assert.ok(L.validateSchedule({ ...sOk, matches: Array(5).fill(sOk.matches[0]) }).length);

// 슬라이드 수 (최대 10)
assert.deepEqual(L.planSlides(0), { extra: 0, dropped: 0, total: 2 });
assert.deepEqual(L.planSlides(1), { extra: 0, dropped: 0, total: 2 });
assert.deepEqual(L.planSlides(9), { extra: 8, dropped: 0, total: 10 });
assert.deepEqual(L.planSlides(12), { extra: 8, dropped: 3, total: 10 });

// 크롭: 가로 4000x3000 → 4:5 는 폭을 자름
assert.deepEqual(L.coverCrop(4000, 3000, 1080, 1350), { sx: 800, sy: 0, sw: 2400, sh: 3000 });
// 세로 3000x4000 → 높이를 자름
assert.deepEqual(L.coverCrop(3000, 4000, 1080, 1350), { sx: 0, sy: 125, sw: 3000, sh: 3750 });

// 득점자 정렬
assert.deepEqual(L.sortedScorers([{ name: 'A', goals: 1, assists: 0 }, { name: '', goals: 5, assists: 0 }, { name: 'B', goals: 2, assists: 0 }, { name: 'C', goals: 1, assists: 2 }]).map(s => s.name), ['B', 'C', 'A']);

// 캡션: 1판 + 득점자
assert.equal(L.resultCaption({ ...ok, scorers: [{ name: '김', goals: 2, assists: 0 }, { name: '박', goals: 0, assists: 1 }], comment: '다들 수고!' }),
`10/7(수) 공기계 경기 결과 ⚽
파랑 3 : 2 검정
득점: 김 2 / 도움: 박 1
다들 수고!

Match day 10/7 ⚽ 파랑 3–2 검정

${L.HASHTAGS}`);

// 캡션: 여러 판, 득점자·코멘트 없음
assert.equal(L.resultCaption({ ...ok, games: [{ a: '파랑', as: 3, b: '검정', bs: 2 }, { a: '검정', as: 1, b: '흰색', bs: 1 }] }),
`10/7(수) 공기계 경기 결과 ⚽
1경기 파랑 3 : 2 검정
2경기 검정 1 : 1 흰색

Match day 10/7 ⚽ Game 1: 파랑 3–2 검정 · Game 2: 검정 1–1 흰색

${L.HASHTAGS}`);

// 캡션: 일정 (친선전 포함)
assert.equal(L.scheduleCaption({ month: '2026-10', matches: [sOk.matches[0], { date: '2026-10-21', start: '20:00', end: '22:00', place: '대운동장', opp: 'FC FingS' }] }),
`10월 공기계 경기 일정 ⚽
10/7(수) 20:00–22:00 북측 운동장
10/21(수) 20:00–22:00 대운동장 vs FC FingS
참여는 톡방 투표로!

October fixtures ⚽ 10/7 20:00 · 10/21 20:00 vs FC FingS

${L.HASHTAGS}`);

console.log('OK');
