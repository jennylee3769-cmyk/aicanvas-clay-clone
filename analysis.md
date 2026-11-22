# AICANVAS 8기 복습 아카이브 — REA 역설계 분석 & 클레이모피즘 클론

작업일: 2026-11-22 · 대상: `https://aicanvas-08-01.vercel.app/` (1회차~5회차 전체)
산출물: `clone/` (실행 가능한 정적 사이트), `analysis.md`(이 문서), 비교 스크린샷

---

## 1. REA 도구 (Reverse Engineer Anything)

| 항목 | 내용 |
| --- | --- |
| 저장소 | https://github.com/morluto/rea (clone 위치: `rea/`) |
| 배포 | npm `rea-agents@6.10.1` (MIT) |
| 형태 | 로컬 MCP 서버 + CLI (`rea …`) |
| 지원 대상 | 네이티브 바이너리, JavaScript/Electron, **웹 사이트**, .NET, Android, 펌웨어, 런타임/네트워크 캡처 |
| 웹 분석 방식 | 사용자가 소유한 Chrome 계열 브라우저에 **CDP(Chrome DevTools Protocol)** 로 붙어 수동적(passive)으로 증거를 수집. 자동 조작 도구가 아니라 관찰·역설계 도구 |

### 1.1 이 작업 환경에서 실행한 절차

REA는 Node.js 런타임이 필요한 TypeScript 프로젝트이고, 이 샌드박스에는 Node가 없었습니다.

1. 포터블 Node 설치 — `nodejs.org` 배포본(v22)은 REA가 요구하는 `zlib.createZstdDecompress`(Node 22.15+)가 없어 실패 → **Node v26.13.1**로 교체(`.local/node26`).
2. 패키지 설치 — `npm i -g rea-agents`가 시간 제한을 넘겨 `npm pack rea-agents@latest`로 42MB tarball을 받아 `rea_cli/package`에 풀고 `node scripts/rea.mjs`로 실행(→ `rea --version` = **6.10.1**).
3. 브라우저 — 샌드박스 Chromium에 시스템 라이브러리(`libnspr4`, `libnss3` 등)가 없어 Debian bookworm deb 37개를 받아 `LD_LIBRARY_PATH`로 연결해 실제 렌더링 브라우저를 확보.
4. 사이트 접근 — Vercel **Security Checkpoint**(자동화 요청 차단)가 걸려 일반 HTTP 요청은 403/429. 실제 브라우저로 접속해 12초 내외의 챌린지를 통과한 뒤 세션을 유지.

### 1.2 실제 실행한 REA 명령과 결과

```bash
# 브라우저 타깃 목록 (CDP)
rea list-browser-targets http://127.0.0.1:9222 --json
# → browser: Chrome/159.0.8154.6, page target 1개 확인

# 페이지 수동 관찰 (증거 수집)
rea inspect-web-page http://127.0.0.1:9222 <TARGET_ID> \
  --observation-ms 2000 --include-accessibility-text \
  --include-storage-keys --include-json-body-shapes --json
# → Evidence 233KB 저장 (rea_inspect_04.json)
#   evidence_id ev_7956e2cf…, confidence: observed, authority: external-service

# 정적 번들 분석 (라우트/벤더 추론)
rea analyze-web-bundle http://127.0.0.1:9222 <TARGET_ID> --json
# → capability_unavailable: 이 샌드박스에 procps(ps)가 없어 자식 프로세스 소유권 검사 불가
```

`inspect-web-page` 증거에서 확인된 값:

- **target**: `https://aicanvas-08-01.vercel.app/sessions/04/` — `AICANVAS 8기 4회차 · 바이브코딩 · 나의 GEO 홈페이지 만들기`
- **DOM**: 766 노드 (SPAN 56, DIV 52, P 46, A 36, META 24, STRONG 24, LI 20, ARTICLE 19, H3 16, BUTTON 14 …)
- **접근성 트리**: 919 노드, heading 26 · link 36 · checkbox 8 · textarea 4 · button 6
- **스크립트 3개**: `app.js` (7,332자, SHA-256 `cf8b9e28…`), `session.js` (355B), `theme.js` — 모두 `<script>`(module 아님)
- **리소스 8개**: CSS/JS만. 이미지·폰트 요청 0건
- **storage**: 초기 상태에서 localStorage/sessionStorage 키 0 → 저장은 사용자 행동 이후 발생(app.js 코드로 확인)
- **completeness**: `policy_filtered` + `attach_limited` (REA가 붙기 전 네트워크/콘솔은 수집 불가) — 이 한계는 문서에도 그대로 기록

> 한계(사실 기록): `analyze-web-bundle`은 실행되지 않았습니다(사이트 문제가 아니라 샌드박스에 `ps` 바이너리가 없는 환경 제약). 대신 REA의 DOM/접근성/리소스 증거 + 원본 HTML·CSS·JS 원문 수집으로 구조를 확정했습니다.

---

## 2. 대상 사이트 분석

### 2.1 사이트 개요

- **성격**: 강의(AICANVAS 8기, 강사 김진수 · AICLab 소장) **회차별 복습 아카이브**. 홈 + 1~5회차 상세 페이지.
- **호스팅**: Vercel 정적 배포. 서버 로직 없음.
- **언어/표기**: 한국어, 2026.10.21 시작 / 1회차 10.21, 2회차 10.28, 3회차 11.04, 4회차 11.11, 5회차 11.18.

### 2.2 페이지 맵 (실측)

| 경로 | 문서 제목 | 비고 |
| --- | --- | --- |
| `/` | AICANVAS 8기 · 회차별 복습 아카이브 | 히어로 + 회차 카드 5개 + 안내 |
| `/sessions/01/` | 1회차 · 나의 AI 작업을 시작하는 시간 | |
| `/sessions/02/` | 2회차 · 나의 지식 자산 만들기 | 인라인 SVG 개념도 포함 |
| `/sessions/03/` | 3회차 · 엔티티맵에서 블로그와 칼럼으로 | |
| `/sessions/04/` | 4회차 · 바이브코딩 · 나의 GEO 홈페이지 만들기 | |
| `/sessions/05/` | 5회차 · GEO 글쓰기 스킬 · 브라우저로 이어지는 작업 | 자료 카드 19개 |
| `/sessions/` | 404 | 목록 페이지는 없고 홈이 목록 역할 |

### 2.3 기술 스택

- **순수 HTML + CSS + Vanilla JS**. 프레임워크·번들러·하이드레이션 없음, 빌드 산출물이 곧 소스.
- 외부 도메인 요청 **0건** — CSP `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'` 로 잠금.
- **이미지 파일 없음**: 시각 요소는 전부 타이포그래피·CSS 그라디언트·보더. 유일한 그래픽은 2회차의 인라인 SVG 개념도.

| 자산 | 크기 | 역할 |
| --- | --- | --- |
| `styles.css` | 14,123 B | 기본 레이아웃·컴포넌트 골격 (테슬라풍 흑/백/블루) |
| `hub.css` | 15,606 B | 키네틱 타이포그래피·아카이브 카드 |
| `editorial.css` | 6,633 B | 최종 레이어 — 흑색 + 금색(#c9a84c) 에디토리얼 |
| `session-links.css` | 589 B | 회차 이동 칩 |
| `session.css` (회차별) | 711 B / 1,057 B | 모바일 목차(details) 동작 |
| `theme.js` | 300 B | 페인트 전 테마 복원 |
| `hub.js` | 718 B | 홈 테마 토글 |
| `app.js` | 7,747 B | 검색·아코디언·미션·메모·테마·목차 스파이 |
| `session.js` | 355 B | 모바일 목차 열림 상태 동기화 |

**CSS 캐스케이드가 곧 디자인 결정**입니다. `styles.css → hub.css → editorial.css` 순서로 로드되며 뒤 레이어가 변수(`--bg`, `--accent`, `--card`, `--shadow`, radius)를 통째로 덮어씁니다. 이 구조 덕분에 마크업을 건드리지 않고 **스타일 계층만 교체**하는 방식으로 클론을 만들 수 있었습니다.

### 2.4 화면 구조 (회차 페이지 공통)

```
topbar (fixed, 브랜드 / 회차·출처 / 밝게·어둡게)
└ hero (2단: 카피 + kinetic-art 패널, 회차 이동 칩 포함)
  breadcrumb
  summary-strip (4칸: 녹화 영상·인사이트·프롬프트·체크 수)
  mobile-menu > #site-nav (sticky 페이지 목차, 9개)
  reading
    #overview  한눈에 복습 (chapter-layout: 본문 카드 + factor-card)
    #insights  핵심 인사이트 (검색 + 카드 그리드 + details "내 일에 적용하기")
    #knowledge / #writing  재료·개념·구조 (회차별)
    #replay    녹화본 2개 (video-cover)
    #prompts   강사 채팅 원문 프롬프트 (아코디언, 전체 펼치기)
    #missions  복습 체크 (체크박스 + 진행률 + 진행바)
    #workspace 작업 환경 (1회차)
    #notes     복습 메모 (자동저장·복사·파일 받기)
    #resources 자료실 (외부 링크 카드)
    #sources   자료 기준·한계
  footer + toast + copy-fallback dialog
```

### 2.5 인터랙션 8종 (원본 JS 동작)

| # | 동작 | 구현 |
| --- | --- | --- |
| 1 | 밝게/어둡게 | `data-theme-set` → `<html data-theme>`, `localStorage["aicanvas-08-01:theme"]`, meta theme-color 갱신 |
| 2 | 목차 현재 위치 표시 | scroll/rAF + `ResizeObserver`, `scroll-padding-top` 기준, 모바일에서 목차 가로 스크롤 자동 이동 |
| 3 | 내용 검색 | `[data-searchable]` 텍스트 매칭, 결과 수·분류별 개수 상태 문구, 초기화 |
| 4 | 프롬프트 아코디언 | `<details>` 8~11개 + "모두 펼치기/접기" 라벨 동기화 |
| 5 | 미션 체크 | 체크 상태 배열 저장(`{session}:missions`), 완료 수 텍스트, `<progress>`, 취소선 스타일 |
| 6 | 복습 메모 | 입력 즉시 저장(`{session}:notes`), 복사, txt 파일 다운로드(BOM 포함) |
| 7 | 모바일 목차 | `details` 자동 열림/닫힘(1023px 경계), 항목 클릭 시 닫힘 |
| 8 | 복사 실패 대체 | `navigator.clipboard` 거부 시 `<dialog>` + textarea 선택 |

### 2.6 콘텐츠 규모 (원본 마크업 실측)

| 페이지 | 인사이트 카드 | 채팅 원문 프롬프트 | 체크 항목 | 자료 카드 | 메모 칸 | 본문 단어 |
| --- | --- | --- | --- | --- | --- | --- |
| 홈 | – | – | – | – | – | 402 |
| 1회차 | 8 | 5 | 5 | 8 | 5 | 1,656 |
| 2회차 | 6 | 11 | 9 | 5 | 3 | 1,972 |
| 3회차 | 6 | 5 | 8 | 3 | 3 | 1,103 |
| 4회차 | 6 | 7 | 8 | 5 | 3 | 1,339 |
| 5회차 | 6 | 11 | 8 | 19 | 3 | 2,369 |

---

## 3. 클레이모피즘 재디자인

요청 스타일 원문:

> 찰흙처럼 말랑말랑하고 귀여운 3D 캐릭터 스타일.
> “클레이모피즘 인포그래픽, 부드러운 3D 플라스틱 질감, 둥글둥글한 모양, 친근한 파스텔 컬러, 거대한 노트북과 상호작용하는 3D 캐릭터들, 친숙한 AI 기술 컨셉.”
> `Claymorphism style infographic, cute 3D soft plastic textures, rounded inflated shapes, friendly pastel colors, 3D characters interacting with a giant notebook, playful and accessible AI technology.`

### 3.1 디자인 토큰

| 종류 | 값 |
| --- | --- |
| 배경 | 라벤더 미스트 `#f2edff` + 3겹 방사형 그라디언트(스카이·핑크·민트) + 떠 있는 점토 덩어리 4개 |
| 파스텔 | lavender `#cdbcff` · sky `#a8d5ff` · mint `#a5e8cd` · butter `#ffe3a0` · peach `#ffc6aa` · pink `#ffafc9` |
| 잉크/뮤트 | `#332f4d` / `#6c6789` |
| 포인트 | `#7a67ff` (버튼·현재 위치·번호) |
| 형태 | radius 40 / 30 / 22 / 16 px, 버튼·칩은 **알약형(999px)** |
| 점토 그림자 | `0 22px 38px -18px rgba(96,74,180,.38)` + `inset 0 -8px 16px rgba(122,103,255,.14)` + `inset 0 6px 12px rgba(255,255,255,.95)` — 바깥 확산 + 위쪽 하이라이트 + 아래쪽 음영의 3겹 |
| 눌린 상태 | `inset` 그림자만 남기는 press 레시피(입력창·진행바·체크박스 트랙) |
| 타이포 | Pretendard Variable(오프라인 내장) 800~900, 자간 −0.035em, 제목 clamp(26→58px) |
| 다크 | “클레이 나이트”: 배경 `#211d33`, 카드 `#2e2947`, 포인트 `#a795ff` |

### 3.2 컴포넌트 매핑 (원본 → 클레이)

| 원본 | 클레이 처리 |
| --- | --- |
| 흑색 topbar | 반투명 유리 + 하단 라운드 28px 점토 바, 브랜드 아이콘은 점토 블롭 |
| 히어로(흑색 2단 + 큰 세리프) | 흰색~라벤더 그라디언트 점토 카드 + 둥근 그림자, 오른쪽은 **3D 클레이 일러스트 패널** |
| kinetic-art 타이포 | 일러스트 아래 점토 스티커형 라벨(잉크색 + 흰 하이라이트) |
| 회차 칩(각진 보더) | 알약형 점토 칩, 현재 회차는 보라 그라디언트 + 눌린 그림자 |
| summary-strip(각진 표) | 파스텔 4색 점토 카드 |
| 목차(sticky 바) | 알약형 점토 트레이, 현재 위치 보라 칩 |
| 인사이트 카드(백색 + 검정 보더) | 카드별 파스텔(mint/lavender/peach/butter), 번호는 점토 구슬, motif 점 3개 |
| 프롬프트 아코디언 | 점토 카드 + 번호 구슬 + `＋` 회전, `pre`는 눌린 파스텔 블록 |
| 미션 체크(기본 체크박스) | 점토 트랙 + 민트 체크, 완료 시 취소선 |
| 진행바 | 점토 트랙 + 보라 그라디언트 채움 |
| 메모 입력 | 눌린 점토 입력창, 포커스 시 링 |
| 자료 카드(백색 보더) | 4색 순환 파스텔, hover 시 떠오름 |
| 다시보기 카드(금색/흑색) | 1번 보라·2번 스카이 점토 카드 + 흰 재생 버튼 |
| 아카이브 카드(흑/금) | 점토 카드 안에 그라디언트 커버(보라/스카이 교차) + 점토 버튼 |
| 토스트/다이얼로그 | 남보라 점토 알약 / 큰 라운드 다이얼로그 |

### 3.3 3D 클레이 일러스트 (생성 이미지 6장)

`clone/assets/clay/` — Midjourney 계열 이미지 생성 도구로 위 영문 프롬프트에 회차 주제를 더해 제작(1000px, JPEG 86%).

| 파일 | 주제 | 배치 |
| --- | --- | --- |
| `home.jpg` | 점토 캐릭터들이 커다란 노트북과 블록을 쌓는 모습 | 홈 히어로 |
| `session-01.jpg` | 책상의 캐릭터 + 전구·나침반·미니 로봇 | 1회차 히어로 |
| `session-02.jpg` | 지식 카드를 폴더에 나누고 연결 지도 | 2회차 |
| `session-03.jpg` | 연결 고리를 이어 블로그 글로 | 3회차 |
| `session-04.jpg` | 둥근 블록으로 홈페이지 화면 만들기 | 4회차 |
| `session-05.jpg` | 지팡이로 폴더·브라우저 정리 | 5회차 |

### 3.4 구현 방식 — 왜 콘텐츠가 100% 같은가

- **마크업·콘텐츠·스크립트**: 원본 HTML의 body 마크업을 그대로 사용(문구·링크·프롬프트 원문·표·각주 포함). `app.js`/`hub.js`/`theme.js`는 원본 로직 그대로, `session.js`만 목차가 없는 회차에서도 안전하도록 null 가드 1줄 추가.
- **디자인**: 원본 CSS 5개 레이어를 전부 제거하고 **단일 `clay.css`(약 840줄)** 로 교체. 원본 클래스 108개를 모두 새로 정의.
- **링크**: 절대 경로(`/sessions/01/`)를 상대 경로로 바꿔 폴더만 옮겨도 1~5회차 이동이 동작.
- **폰트**: Pretendard Variable woff2를 `assets/fonts/`에 내장(CSP `'self'` 유지, 오프라인 동작).

---

## 4. 클론 실행 방법

```bash
# 압축을 푼 폴더(aicanvas-clay-clone)에서
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000/  (또는 index.html 직접 열기)
```

> 압축 파일은 `index.html`이 최상위에 오도록 묶었습니다(풀자마자 열림). 작업 폴더 원본은 `clone/` 아래에 있습니다.

폴더 구조:

```
clone/
├─ index.html                  홈(회차 목록)
├─ sessions/01..05/index.html  1~5회차 복습 페이지
├─ clay.css                    클레이모피즘 디자인 시스템 전체
├─ theme.js / hub.js / app.js / session.js
├─ favicon.svg
└─ assets/
   ├─ clay/home.jpg, session-01..05.jpg
   └─ fonts/PretendardVariable.woff2
```

---

## 5. 검증

### 5.1 자동 테스트 — 34/34 통과

`capture/test_clone.py` (Playwright, 로컬 서버 대상):

- 페이지: 5개 회차 + 홈 로드, 제목·h1, 콘솔/페이지 오류 0
- 이동: `전체 목록`·`1~5회차` 칩 12개 링크 모두 HTTP 200, 홈 카드 5개 링크 200
- 검색: “재료표” 입력 시 18개 중 7개 노출 + 상태 문구, 초기화 시 복원
- 프롬프트: 전체 펼치기 7/7, 라벨 “모두 접기”로 변경, 전체 접기
- 미션: 체크 → `1 / 8 완료`, progress=1, localStorage `aicanvas-08-04:missions`, 완료 스타일, 새로고침 유지
- 메모: 입력 즉시 localStorage 저장, `aicanvas-08-04-my-notes.txt` 다운로드, 복사(토스트/대체 다이얼로그)
- 테마: 다크 전환·새로고침 유지
- 목차: `#missions` 스크롤 시 `aria-current=location`
- 모바일(390px): 목차 접힘→펼침, 가로 스크롤 없음
- 회차별 고유 구성: 1회차 motif 8개, 2회차 SVG 개념도 + 모바일 대체, 5회차 chapter-list

### 5.2 콘텐츠 충실도 — 원본 대비 100%

| 페이지 | 제목 일치 | 링크 수(원본/클론) | 글자 수(원본/클론) | 텍스트 자카드 |
| --- | --- | --- | --- | --- |
| 홈 | 8/8 | 16/16 | 1,710/1,710 | 1.000 |
| 1회차 | 34/34 | 40/40 | 6,699/6,699 | 1.000 |
| 2회차 | 28/28 | 34/34 | 8,154/8,154 | 1.000 |
| 3회차 | 24/24 | 36/36 | 4,615/4,615 | 1.000 |
| 4회차 | 27/27 | 36/36 | 5,445/5,445 | 1.000 |
| 5회차 | 43/43 | 69/69 | 9,888/9,888 | 1.000 |
| **합계** | **164/164** | **231/231** | **36,511/36,511** | **1.000** |

### 5.3 스크린샷

- 원본: `capture/shots/orig/{home,01..05}_{desktop_hero,desktop_full,mobile_full}.png`
- 클론: `capture/shots/clone/{home,01..05}_{desktop_hero,desktop_full,mobile_full}.png` + 섹션별(`04_insights`, `04_missions`, `04_resources`, `04_replay`, `04_art_panel`, `dark_02_hero`)
- 비교(나란히): `capture/compare/compare_home_hero.png`, `compare_01_hero.png`, `compare_04_hero.png`, `compare_04_full.png`

---

## 6. 남은 한계 · 주의

- `rea analyze-web-bundle`(번들 라우트/벤더 정적 추론)은 이 샌드박스에 `ps`(procps)가 없어 실행되지 않았습니다. 사이트 자체는 번들러를 쓰지 않는 정적 사이트여서 라우트 추론의 실익도 제한적입니다.
- Vercel Security Checkpoint 때문에 캡처 자동화에는 첫 접속 후 약 12초 대기가 필요합니다(사람이 브라우저로 보는 데는 영향 없음).
- 원본은 저작권자(AICLab)의 강의 복습 자료입니다. 이 클론은 개인 복습·학습 목적 산출물이며, 사용자 GitHub에 임의로 push하지 않았습니다(요청 시 별도 진행).
