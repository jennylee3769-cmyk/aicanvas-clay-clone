# AICANVAS 8기 복습 아카이브 — 클레이모피즘 클론

`https://aicanvas-08-01.vercel.app/` (1회차~5회차 + 홈)을 역설계해 **구조·콘텐츠·인터랙션은 그대로** 두고
디자인만 **클레이모피즘(찰흙처럼 말랑한 3D 파스텔)** 으로 다시 만든 정적 사이트입니다.

- 원본: HTML/CSS/Vanilla JS 정적 사이트, Vercel 배포
- 클론: 같은 마크업·같은 스크립트 로직·같은 콘텐츠(문구 100% 동일), 새 디자인 시스템 `clay.css`

## 바로 열기

```bash
# 압축을 푼 폴더(aicanvas-clay-clone) 안에서
python3 -m http.server 8000
# 브라우저 → http://localhost:8000/
```

`index.html`을 더블클릭해도 대부분 동작합니다(모든 링크·자산이 상대 경로).
워크스페이스 원본에서는 사이트가 `clone/` 폴더 안에 있습니다.

## 공개 배포

- 사이트: https://aicanvas-clay-clone.vercel.app/
- GitHub: https://github.com/jennylee3769-cmyk/aicanvas-clay-clone
- Vercel 프로젝트가 위 GitHub 저장소(`main`)에 연결되어 있어, push하면 자동으로 다시 배포됩니다.

## 구성

| 경로 | 내용 |
| --- | --- |
| `index.html` | 홈 — 히어로 + 1~5회차 카드 + 안내 |
| `sessions/01`~`05/index.html` | 회차별 복습 페이지 (10개 섹션) |
| `clay.css` | 클레이모피즘 디자인 시스템 전체 (토큰·컴포넌트·반응형·다크) |
| `app.js` `hub.js` `theme.js` `session.js` | 원본과 동일한 상호작용 로직 |
| `assets/clay/*.jpg` | 회차별 3D 클레이 일러스트 6장 |
| `assets/fonts/PretendardVariable.woff2` | 오프라인 내장 폰트 |

## 동작하는 것

- 1~5회차 · 전체 목록 이동 (칩 · 카드 · 푸터)
- 목차 스크롤 스파이 (현재 섹션 강조, 모바일 가로 자동 스크롤)
- 복습 내용 검색 + 결과 수 표시 / 초기화
- 프롬프트 아코디언 · 전체 펼치기/접기
- 미션 체크 → 완료 수 · 진행바 · 브라우저 저장(새로고침 유지)
- 복습 메모 자동 저장 · 복사 · txt 파일 받기
- 밝게/어둡게(클레이 나이트) 테마, 설정 유지
- 모바일 목차(details) 자동 접힘/펼침

## 디자인 토큰 요약

- 파스텔: lavender `#cdbcff` · sky `#a8d5ff` · mint `#a5e8cd` · butter `#ffe3a0` · peach `#ffc6aa` · pink `#ffafc9`
- 포인트: `#7a67ff`, 잉크 `#332f4d`, 뮤트 `#6c6789`
- 형태: radius 40/30/22/16, 버튼·칩은 알약형
- 점토 질감: 바깥 확산 그림자 + 위쪽 흰 하이라이트 + 아래쪽 색 음영의 3겹 `box-shadow`, 입력·진행바는 눌린(inset) 질감

## 출처와 이용

- 콘텐츠 원본: AICANVAS 8기 복습 아카이브 (강사 김진수 · AICLab). 저작권은 원저작자에게 있습니다.
- 이 클론은 **개인 복습·학습용**으로 제작했으며, 콘텐츠와 구성의 저작권은 원저작자에게 있습니다.
- 역설계 도구: [REA — Reverse Engineer Anything](https://github.com/morluto/rea) (MIT)의 `inspect-web-page`(CDP 증거 수집)로 구조를 확인했습니다. 자세한 분석은 `analysis.md` 참고.
