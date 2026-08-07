# FaultMon Front

FaultMon의 React 기반 실시간 고장 관제 프론트엔드입니다.

이 프로젝트는 기존 ASP.NET MVC/jQuery 기반 FaultMon 화면을 React로 이관하기 위한 프론트엔드 작업 공간입니다. 현재는 실제 API 연동 전 단계의 UI 가안이며, SignalR 실시간 알림과 고장 관제 대시보드 구조를 보여주는 데 초점을 둡니다.

## Tech Stack

| 항목 | 버전 |
| --- | --- |
| Node.js | v24.13.1 |
| npm | 11.8.0 |
| React | ^19.2.8 |
| React DOM | ^19.2.8 |
| Vite | ^8.2.0 |
| @vitejs/plugin-react | ^6.0.4 |
| Oxlint | ^1.75.0 |

## UI Concept

- 절제된 다크 모드 기반 B2B SaaS 관제 화면
- 좌측: 금일 통계와 실시간 고장 데이터 테이블
- 중앙: Dark/Muted 스타일 좌표 지도와 dot/ping 마커
- 우측: 선택 고장 상세, 조치 현황, SignalR 이벤트 로그
- 우측 상단: 실시간 고장 알림 toast
- 검색 영역: 기본 검색 + 접히는 상세 검색

## Current Features

- 샘플 고장 데이터 기반 대시보드 렌더링
- 고장 row 선택 시 지도/상세 정보 동기화
- 고장 등급별 muted badge 표현
- Critical 고장만 강한 red accent로 강조
- 5초마다 실시간 알림 toast 데모
- Keyword 검색
- 상세 검색 접기/펼치기
- Severity / Status 필터
- From / To 날짜+시+분 기간 필터

## Project Structure

```txt
src
├─ App.jsx
├─ App.css
├─ index.css
├─ main.jsx
├─ notify.js
├─ data
│  └─ faultData.js
├─ pages
│  └─ search
│     └─ SearchPage.jsx
└─ components
   ├─ dashboard
   │  ├─ left
   │  │  └─ LeftRail.jsx
   │  ├─ center
   │  │  └─ CoordinateMap.jsx
   │  ├─ right
   │  │  └─ RightRail.jsx
   │  └─ common
   │     ├─ PanelHeader.jsx
   │     ├─ ShellHeader.jsx
   │     └─ ToastViewport.jsx
   └─ search
      └─ SearchForm.jsx
```

## Key Files

| 파일 | 역할 |
| --- | --- |
| `src/App.jsx` | 앱 루트, 전역 toast 알림, 현재 페이지 조립 |
| `src/pages/search/SearchPage.jsx` | 검색 페이지, 필터 상태, 3단 대시보드 조립 |
| `src/components/search/SearchForm.jsx` | 기본 검색 및 상세 검색 폼 |
| `src/components/dashboard/left/LeftRail.jsx` | 좌측 통계 및 고장 데이터 테이블 |
| `src/components/dashboard/center/CoordinateMap.jsx` | 중앙 좌표 지도 및 dot/ping 마커 |
| `src/components/dashboard/right/RightRail.jsx` | 우측 상세 정보, 조치 현황, Signal 로그 |
| `src/components/dashboard/common/ToastViewport.jsx` | 우측 상단 실시간 알림 toast |
| `src/data/faultData.js` | UI 가안용 샘플 고장/SignalR 데이터 |
| `src/notify.js` | 원본 `notify(title, message)` 역할의 toast 데이터 생성 |

## Project Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

기본 개발 서버 주소는 보통 아래 주소입니다.

```txt
http://localhost:5173
```

## Build

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

## Preview

```bash
npm run preview
```

## Scripts

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | Vite 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 생성 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | Oxlint 실행 |

## Next Steps

- SeinServices.Api의 Fault API 연동
- SignalR Hub 실제 연결
- 샘플 데이터 제거 및 API 응답 모델 정리
- 실제 지도 라이브러리/타일 적용
- 알림 toast를 실제 DB 변경 이벤트 기반으로 전환
