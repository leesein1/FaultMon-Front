const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

/**
 * 260808 silee - FaultMon 최근 고장 목록 조회 함수
 */
export async function fetchFaultList() {
  const rows = await requestJson('/Fault/GetFaultList')
  return rows.map(mapFaultRow)
}

/**
 * 260808 silee - FaultMon 누적 고장 이력 검색 함수
 */
export async function fetchFaultHistory(filters) {
  const rows = await requestJson(`/api/faultmon/faults/search?${buildFaultHistoryQuery(filters)}`)

  return {
    items: rows.map(mapFaultRow),
    totalCount: numberOrZero(rows[0]?.TotalCount),
  }
}

/**
 * 260808 silee - FaultMon 금일 통계 조회 함수
 */
export async function fetchTodayStats() {
  const rows = await requestJson('/Fault/GetStatToday')
  const row = rows[0] ?? {}

  return {
    total: numberOrZero(row.TotalCount),
    inProgress: numberOrZero(row.InProgressCount),
    completed: numberOrZero(row.CompletedCount),
    completedRate: numberOrZero(row.CompletedRate),
  }
}

/**
 * 260808 silee - FaultMon 고장 상세 조회 함수
 */
export async function fetchFaultDetail(incidentId) {
  const rows = await requestJson(`/Fault/GetFaultListDetail?IncidentID=${encodeURIComponent(incidentId)}`)
  return rows[0] ? mapFaultRow(rows[0]) : null
}

/**
 * 260808 silee - FaultMon 상세 팝업 데이터 조회 함수
 */
export async function fetchFaultDetailPop(incidentId) {
  const rows = await requestJson(`/Fault/GetFaultListDetailPop?IncidentID=${encodeURIComponent(incidentId)}`)
  return rows[0] ? mapFaultRow(rows[0]) : null
}

/**
 * 260808 silee - FaultMon API 공통 JSON 요청 함수
 */
async function requestJson(path) {
  // 260808 silee - 로컬은 Vite proxy, 배포는 VITE_API_BASE_URL 기준으로 호출합니다.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`FaultMon API request failed: ${response.status}`)
  }

  return response.json()
}

/**
 * 260808 silee - FaultMon 검색 조건 query string 생성 함수
 */
function buildFaultHistoryQuery(filters) {
  const params = new URLSearchParams()
  const statuses = (filters.statuses ?? []).map(mapStatusValue).filter(Boolean)

  appendParam(params, 'keyword', filters.keyword)
  appendParam(params, 'receiptNo', filters.receiptNo)
  appendParam(params, 'vehicleNo', filters.vehicleNo)
  appendParam(params, 'customerName', filters.customer)
  appendParam(params, 'mangerName', filters.manager)
  appendParam(params, 'statuses', statuses.join(','))
  appendParam(params, 'setTimeFrom', filters.dateTimeFrom)
  appendParam(params, 'setTimeTo', filters.dateTimeTo)
  appendParam(params, 'page', filters.page ?? 1)
  appendParam(params, 'pageSize', filters.pageSize ?? 100)

  return params.toString()
}

/**
 * 260808 silee - 빈 검색 조건 제외 함수
 */
function appendParam(params, key, value) {
  if (value == null || value === '') {
    return
  }

  params.set(key, value)
}

/**
 * 260808 silee - 화면 상태값을 DB Stat 값으로 변환 함수
 */
function mapStatusValue(status) {
  if (status === 'received') {
    return '0'
  }

  if (status === 'dispatching') {
    return '1'
  }

  if (status === 'repairing') {
    return '2'
  }

  if (status === 'done') {
    return '3'
  }

  return ''
}

/**
 * 260808 silee - DB row 화면 데이터 변환 함수
 */
function mapFaultRow(row) {
  // 260808 silee - DB 컬럼명을 화면에서 쓰기 편한 이름으로 정리합니다.
  const occurredAt = parseDate(row.SetTime)
  const assignedAt = parseDate(row.AssignedTime)
  const endedAt = parseDate(row.EndTime)
  const status = mapStatus(row.Stat)
  const latitude = toNumber(row.GPS_Lati)
  const longitude = toNumber(row.GPS_Long)

  return {
    id: numberOrZero(row.IncidentID),
    incidentId: numberOrZero(row.IncidentID),
    occurredDate: formatDate(occurredAt),
    occurredAt: formatTime(occurredAt),
    occurredAtIso: formatDateTimeLocal(occurredAt),
    assignedAt: formatDateTime(assignedAt),
    assignedAtIso: formatDateTimeLocal(assignedAt),
    endedAt: formatDateTime(endedAt),
    endedAtIso: formatDateTimeLocal(endedAt),
    receiptNo: text(row.ReceiptNo, `INC-${row.IncidentID ?? '-'}`),
    equipment: text(row.C_ViheicleLicense, row.VehicleLicense ?? '-'),
    faultName: text(row.FaultName, row.FaultID ? `Fault ${row.FaultID}` : '-'),
    faultText: text(row.FaultText, ''),
    status: status.value,
    statusText: status.label,
    manager: text(row.MangerName, row.MangerID ? `Manager ${row.MangerID}` : '-'),
    managerPhone: text(row.MangerPhone, '-'),
    customer: text(row.CustomerName, '-'),
    vehicleNo: text(row.C_ViheicleLicense, row.VehicleLicense ?? '-'),
    dispatchVehicle: text(row.VehicleLicense, row.VehicleID ? `출동 차량 ${row.VehicleID}` : '-'),
    location: text(row.LocationText, '-'),
    latitude,
    longitude,
    mapX: coordinateToPercent(longitude, 126.55, 127.35),
    mapY: 100 - coordinateToPercent(latitude, 37.15, 37.75),
    managerTodayCount: row.MangerCnt == null ? null : numberOrZero(row.MangerCnt),
    totalCount: numberOrZero(row.TotalCount),
    actions: buildActions(row),
    raw: row,
  }
}

/**
 * 260808 silee - 고장 조치 항목 구성 함수
 */
function buildActions(row) {
  const actions = [row.FaultText, row.FaultAct1, row.FaultAct2, row.FaultAct3]
    .map((value) => text(value, ''))
    .filter(Boolean)

  if (actions.length > 0) {
    return actions
  }

  return ['고장 위치 확인', '담당자 배정 확인', '현장 조치 상태 확인']
}

/**
 * 260808 silee - FaultMon Stat 상태 변환 함수
 */
function mapStatus(stat) {
  const value = Number(stat)

  if (value === 0) {
    return { value: 'received', label: '접수완료' }
  }

  if (value === 1) {
    return { value: 'dispatching', label: '출동중' }
  }

  if (value === 2) {
    return { value: 'repairing', label: '수리중' }
  }

  if (value === 3) {
    return { value: 'done', label: '완료' }
  }

  return { value: 'unknown', label: '미확인' }
}

/**
 * 260808 silee - 날짜 문자열 파싱 함수
 */
function parseDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * 260808 silee - 날짜 표시 포맷 함수
 */
function formatDate(value) {
  if (!value) {
    return '-'
  }

  return value.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * 260808 silee - 시간 표시 포맷 함수
 */
function formatTime(value) {
  if (!value) {
    return '-'
  }

  return value.toLocaleTimeString('ko-KR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * 260808 silee - 날짜/시간 표시 포맷 함수
 */
function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  return `${formatDate(value)} ${formatTime(value)}`
}

/**
 * 260808 silee - 검색 input 날짜/시간 포맷 함수
 */
function formatDateTimeLocal(value) {
  if (!value) {
    return ''
  }

  const offset = value.getTimezoneOffset() * 60000
  return new Date(value.getTime() - offset).toISOString().slice(0, 16)
}

/**
 * 260808 silee - 좌표 백분율 변환 함수
 */
function coordinateToPercent(value, min, max) {
  if (value == null) {
    return 50
  }

  const percent = ((value - min) / (max - min)) * 100
  return Math.min(92, Math.max(8, percent))
}

/**
 * 260808 silee - 빈 문자열 기본값 처리 함수
 */
function text(value, fallback) {
  if (value == null) {
    return fallback
  }

  const normalized = String(value).trim()
  return normalized || fallback
}

/**
 * 260808 silee - 숫자 변환 함수
 */
function toNumber(value) {
  if (value == null || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * 260808 silee - 숫자 기본값 0 처리 함수
 */
function numberOrZero(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
