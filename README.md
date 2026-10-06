# 공기계 포스트 생성기

폰에서 https://mosw626.github.io/gonggigye/ 접속 → 입력 → [만들기] → [공유 / 저장] → 인스타 업로드 → [캡션 복사] 붙여넣기.

- 해시태그·색 바꾸기: `lib.js` 맨 위 상수
- 로고 바꾸기: `assets/logo.png` 교체 (정사각, 투명 배경 권장)
- 테스트: `node test.mjs`
- 배포할 때: `index.html`·`render.js`의 import 주소 `?v=숫자`를 1 올린다 (캐시 우회)

폰트: assets/BlackHanSans.woff2 (Black Han Sans, OFL), assets/HangulFill.woff2 (Pretendard Black에서 Black Han Sans에 없는 한글 8591자만 추린 것, OFL).
