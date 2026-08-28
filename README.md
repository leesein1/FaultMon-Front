# FaultMon Front

FaultMon 실시간 고장 관제 화면을 React + Vite 기반으로 구성한 프론트 프로젝트입니다.

기존 FaultMon .NET MVC 화면의 최근 고장 목록, 상세, 지도, 알림 흐름을 `08.SeinServices.Api`의 FaultMon API와 연결해서 사용합니다.

## 현재 상태

- `/` : 실시간 고장 관제 Home 화면
- `/search` : FaultMon 누적 고장 이력 Search 화면
- Kakao Map JavaScript SDK 기반 고장 위치 표시
- FaultMon API 목록/통계/상세/누적 검색 연결
- SignalR 연결 상태, 접속자 수, 알림 로그 표시
- Search 화면은 SignalR 이벤트를 받더라도 검색 결과를 자동 갱신하지 않음
- `/search` 새로고침 시 같은 Search 화면 유지
- Vercel SPA rewrite 설정 포함

## 실행

```bash
npm install
npm run dev
```

기본 개발 주소:

```txt
http://localhost:5173
```

Search 화면:

```txt
http://localhost:5173/search
```

## 빌드와 검사

```bash
npm run lint
npm run build
```

## 환경변수

`.env`는 로컬 전용으로 사용하고, Git에는 `.env.example`만 올립니다.

```env
VITE_KAKAO_MAP_JS_KEY=your-kakao-javascript-key
VITE_API_BASE_URL=https://your-api-host
VITE_SIGNALR_HUB_URL=https://your-api-host/hubs/faultmon
```

로컬 Docker API를 Vite proxy로 붙일 때는 아래처럼 둘 수 있습니다.

```env
VITE_API_BASE_URL=
VITE_SIGNALR_HUB_URL=/hubs/faultmon
```

Vercel 배포 환경변수 예시:

```env
VITE_KAKAO_MAP_JS_KEY=카카오 JavaScript 키
VITE_API_BASE_URL=https://api.silee.net
VITE_SIGNALR_HUB_URL=https://api.silee.net/hubs/faultmon
```

## 화면 구조

Home:

- 좌측: 금일 통계, 실시간 고장 목록
- 중앙: Kakao Map 고장 위치 마커
- 우측: 선택 고장 상세, 조치 상태, Signal Log

Search:

- 좌측 위: 누적 이력 검색 조건
- 좌측 아래: Search Result 리스트
- 우측 위: Kakao Map 검색 결과 위치
- 우측 아래: 선택 고장 상세

## Search 조건

Search 조건은 4줄로 구성합니다.

- 1줄: 통합 검색
- 2줄: 접수 번호, 차량 번호, 접수자, 담당자
- 3줄: 상태 복수 선택
- 4줄: 시간 시작, 시간 종료

통합 검색 대상:

- 차량 번호
- 고장명
- 고장 내용
- 접수 번호
- 접수자
- 담당자
- 담당자 연락처
- 위치

상태 조건:

- 전체
- 접수완료
- 출동중
- 수리중
- 완료

## API 연결

Home 화면:

```txt
GET /Fault/GetFaultList
GET /Fault/GetStatToday
GET /Fault/GetFaultListDetail?IncidentID={id}
```

Search 화면:

```txt
GET /api/faultmon/faults/search
```

Search API query:

```txt
keyword
receiptNo
vehicleNo
customerName
mangerName
statuses
setTimeFrom
setTimeTo
page
pageSize
```

`statuses`는 DB `Stat` 값 기준으로 쉼표 구분 문자열을 보냅니다.

```txt
0: 접수완료
1: 출동중
2: 수리중
3: 완료
```

## DB 프로시저

누적 이력 검색용 프로시저는 API 프로젝트에 SQL 파일로 정리되어 있습니다.

```txt
08.SeinServices.Api/docs/sql/PROC_FAULT_HISTORY_SEARCH.sql
```

해당 프로시저는 사용자가 제공한 `RcvFault`, `mt_FaultCode`, `mt_manager`, `mt_corporate_vehicle` 구조를 기준으로 작성했습니다.

## SignalR 동작

SignalR Hub:

```txt
/hubs/faultmon
```

수신 이벤트:

- `FaultMonUserCount` : 현재 SignalR 접속자 수 표시
- `Signal_FLTLIST` : Home 화면에서 FaultMon 목록 갱신 및 알림 표시
- `FaultMonScheduleTick` : `PROC_SCH_REPEAT_INSERT` 실행 로그 표시
- `FaultMonScheduleError` : 스케줄 실행 실패 로그 표시

Search 화면에서는 `Signal_FLTLIST`를 받아도 목록을 자동 갱신하지 않고 Signal Log에 보류 로그만 남깁니다. Search는 지금까지 DB에 쌓인 누적 고장 이력을 조건으로 조회하는 화면입니다.

## 주요 파일

| 파일 | 역할 |
| --- | --- |
| `src/App.jsx` | 전역 알림, URL 기반 Home/Search 화면 전환 |
| `src/pages/search/SearchPage.jsx` | FaultMon 화면 상태, API 조회, SignalR 수신, Search/Home 화면 구성 |
| `src/components/search/SearchForm.jsx` | 4줄 Search 조회 조건 폼 |
| `src/components/dashboard/center/CoordinateMap.jsx` | Kakao Map 지도와 고장 마커 |
| `src/components/dashboard/common/ShellHeader.jsx` | Home/Search 메뉴, SignalR 상태, 접속자 수, 알림 로그 |
| `src/api/faultMonApi.js` | FaultMon API 호출과 DB row 화면 모델 변환 |
| `src/api/faultMonSignalR.js` | FaultMon SignalR 연결 생성 |
| `src/notify.js` | FaultMon 알림 문구와 중복 비교 키 생성 |
| `vite.config.js` | 로컬 Docker API/Vite proxy 설정 |
| `vercel.json` | Vercel SPA rewrite 설정 |

## 배포 참고

Vercel에서 `/search` 직접 접근 및 새로고침을 지원하기 위해 `vercel.json`은 모든 경로를 `index.html`로 rewrite합니다.

Cloudflare/Vercel 도메인에서 API를 호출하려면 백엔드 CORS에 해당 프론트 도메인이 등록되어 있어야 합니다.
