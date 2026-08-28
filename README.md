# FaultMon Front

FaultMon 차량 고장 관제 화면을 React + Vite로 다시 구성한 프론트 프로젝트입니다.

기존 .NET MVC 버전에서 화면과 API가 한 프로젝트에 있던 구조를 분리했고, 현재는 `08.SeinServices.Api`의 FaultMon API와 SignalR Hub를 사용합니다.

- V1: [FaultMon](https://github.com/leesein1/FaultMon)
- API: [08.SeinServices.Api](https://github.com/leesein1/08.SeinServices.Api)

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

`/search`는 SignalR 이벤트를 받아도 검색 결과를 자동 갱신하지 않습니다. 현재 검색 조건으로 조회한 결과를 유지하고 이벤트만 로그에 남깁니다.

---

## 기술

`React` `Vite` `Kakao Map JavaScript SDK` `SignalR`

API 서버는 ASP.NET Core 기반 `SeinServices.Api`를 사용합니다.

---

## API / SignalR

Home에서 사용하는 API:

```text
GET /Fault/GetFaultList
GET /Fault/GetStatToday
GET /Fault/GetFaultListDetail?IncidentID={id}
```

누적 이력 검색:

```text
GET /api/faultmon/faults/search
```

검색 파라미터:

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

SignalR Hub:

```text
/hubs/faultmon
```

수신 이벤트:

- `FaultMonUserCount`
- `Signal_FLTLIST`
- `FaultMonScheduleTick`
- `FaultMonScheduleError`

---

## 주요 파일

| 파일 | 역할 |
| --- | --- |
| `src/App.jsx` | Home / Search 전환, 전역 알림 |
| `src/pages/search/SearchPage.jsx` | 화면 상태, API 조회, SignalR 처리 |
| `src/components/search/SearchForm.jsx` | 누적 이력 검색 조건 |
| `src/components/dashboard/center/CoordinateMap.jsx` | Kakao Map 및 마커 |
| `src/components/dashboard/common/ShellHeader.jsx` | 메뉴, SignalR 상태, 접속자 수 |
| `src/api/faultMonApi.js` | API 호출 및 화면 데이터 변환 |
| `src/api/faultMonSignalR.js` | SignalR 연결 생성 |
| `vite.config.js` | 로컬 API proxy |
| `vercel.json` | SPA rewrite |

---

## 실행

```bash
npm install
npm run dev
```

```bash
npm run lint
npm run build
```

환경변수 예시:

```env
VITE_KAKAO_MAP_JS_KEY=your-kakao-javascript-key
VITE_API_BASE_URL=https://your-api-host
VITE_SIGNALR_HUB_URL=https://your-api-host/hubs/faultmon
```

Vercel에서는 `/search` 직접 접근과 새로고침을 위해 모든 경로를 `index.html`로 rewrite합니다.
