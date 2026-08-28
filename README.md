# FaultMon Front

차량 고장 관제 화면을 React + Vite로 다시 구성한 FaultMon V2 프론트입니다.

V1은 .NET MVC 프로젝트 안에 화면과 서버 로직이 함께 있었습니다. V2에서는 React 프론트와 ASP.NET Core API를 분리했고, 고장 조회와 실시간 처리는 `08.SeinServices.Api`를 사용합니다.

실무에서 접했던 관제 시스템을 개인적으로 다시 구현한 V1을 기반으로, 구조를 나누고 검색 기능을 추가하면서 현재 형태로 개편했습니다.

- V1: [FaultMon](https://github.com/leesein1/FaultMon)
- API: [08.SeinServices.Api](https://github.com/leesein1/08.SeinServices.Api)

---

## V1에서 바꾼 부분

- MVC 통합 구조 → React 프론트 / ASP.NET Core API 분리
- Leaflet 지도 → Kakao Map JavaScript SDK
- DB 변경 감지 중심 구조 → API + SignalR Hub 연결
- 최근 고장 관제 화면에 누적 고장 이력 Search 화면 추가
- Vercel SPA 배포 구조 적용

---

## 화면

### Home

- 금일 고장 통계
- 최근 고장 목록
- Kakao Map 위치 표시
- 선택 고장 상세
- SignalR 연결 상태, 접속자 수, 이벤트 로그

### Search

- 누적 고장 이력 검색
- 접수번호, 차량번호, 접수자, 담당자 조건
- 상태 복수 선택
- 시작/종료 시간 조건
- 검색 결과 지도 표시와 상세 조회

`/search`는 SignalR 이벤트를 받아도 현재 검색 결과를 자동 갱신하지 않습니다. 검색 조건으로 조회한 결과는 유지하고 이벤트만 로그에 남깁니다.

---

## 구조

```text
FaultMon Front
  ├─ Home
  ├─ Search
  ├─ Kakao Map
  └─ SignalR Client
       │
       ├─ REST API
       └─ /hubs/faultmon
       │
       ▼
SeinServices.Api
       │
       ▼
     MSSQL
```

기술은 `React`, `Vite`, `Kakao Map JavaScript SDK`, `SignalR`을 사용합니다.

---

## API / SignalR

Home:

```text
GET /Fault/GetFaultList
GET /Fault/GetStatToday
GET /Fault/GetFaultListDetail?IncidentID={id}
```

Search:

```text
GET /api/faultmon/faults/search
```

SignalR Hub:

```text
/hubs/faultmon
```

수신 이벤트:

- `FaultMonUserCount`
- `Signal_FLTLIST`
- `FaultMonScheduleTick`
- `FaultMonScheduleError`

<details>
<summary><b>Search query / 주요 파일</b></summary>
<br/>

Search query:

```text
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

| 파일 | 역할 |
| --- | --- |
| `src/App.jsx` | Home / Search 전환, 전역 알림 |
| `src/pages/search/SearchPage.jsx` | 화면 상태, API 조회, SignalR 처리 |
| `src/components/search/SearchForm.jsx` | 누적 이력 검색 조건 |
| `src/components/dashboard/center/CoordinateMap.jsx` | Kakao Map 및 마커 |
| `src/components/dashboard/common/ShellHeader.jsx` | 메뉴, SignalR 상태, 접속자 수 |
| `src/api/faultMonApi.js` | API 호출 및 화면 데이터 변환 |
| `src/api/faultMonSignalR.js` | SignalR 연결 생성 |

</details>

---

## 실행

```bash
npm install
npm run dev
npm run lint
npm run build
```

환경변수:

```env
VITE_KAKAO_MAP_JS_KEY=your-kakao-javascript-key
VITE_API_BASE_URL=https://your-api-host
VITE_SIGNALR_HUB_URL=https://your-api-host/hubs/faultmon
```

Vercel에서는 `/search` 직접 접근과 새로고침을 위해 모든 경로를 `index.html`로 rewrite합니다.
