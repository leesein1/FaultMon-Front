import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchFaultDetail, fetchFaultList, fetchTodayStats } from '../../api/faultMonApi'
import { createFaultMonConnection } from '../../api/faultMonSignalR'
import { CoordinateMap } from '../../components/dashboard/center/CoordinateMap'
import { ShellHeader } from '../../components/dashboard/common/ShellHeader'
import { LeftRail } from '../../components/dashboard/left/LeftRail'
import { RightRail } from '../../components/dashboard/right/RightRail'
import { SearchForm } from '../../components/search/SearchForm'
import { createNotification, createNotificationKey } from '../../notify'

const initialFilters = {
  keyword: '',
  vehicleNo: '',
  receiptNo: '',
  customer: '',
  manager: '',
  statuses: [],
  dateTimeFrom: '',
  dateTimeTo: '',
}

const emptyStats = {
  total: 0,
  inProgress: 0,
  completed: 0,
  completedRate: 0,
}

const pageSize = 10
const sampleSearchFaults = [
  {
    id: -9001,
    incidentId: -9001,
    occurredDate: '2026. 08. 08.',
    occurredAt: '13:12:04',
    occurredAtIso: '2026-08-08T13:12',
    assignedAt: '2026. 08. 08. 13:15:20',
    assignedAtIso: '2026-08-08T13:15',
    endedAt: '-',
    endedAtIso: '',
    receiptNo: 'F-260808-S001',
    equipment: '269조5969',
    vehicleNo: '269조5969',
    dispatchVehicle: '출동 차량 3',
    faultName: '제동 거리 이상',
    faultText: '제동 반응 지연 경고가 감지되었습니다.',
    status: 'received',
    statusText: '접수완료',
    customer: '사고자87',
    manager: '출동기사2',
    managerPhone: '010-0000-0001',
    location: '용산 인근',
    latitude: 37.5297,
    longitude: 126.9644,
    actions: ['제동 계통 점검', '현장 안전 확보', '정비소 이동 여부 확인'],
  },
  {
    id: -9002,
    incidentId: -9002,
    occurredDate: '2026. 08. 08.',
    occurredAt: '13:08:41',
    occurredAtIso: '2026-08-08T13:08',
    assignedAt: '2026. 08. 08. 13:11:03',
    assignedAtIso: '2026-08-08T13:11',
    endedAt: '-',
    endedAtIso: '',
    receiptNo: 'F-260808-S002',
    equipment: '183하7741',
    vehicleNo: '183하7741',
    dispatchVehicle: '출동 차량 5',
    faultName: '엔진 과열',
    faultText: '냉각수 온도 상승으로 즉시 확인이 필요합니다.',
    status: 'dispatching',
    statusText: '출동중',
    customer: '접수자12',
    manager: '출동기사5',
    managerPhone: '010-0000-0002',
    location: '광천 인근',
    latitude: 37.5312,
    longitude: 126.9678,
    actions: ['냉각수 확인', '엔진룸 열 식힘', '운행 중지 안내'],
  },
  {
    id: -9003,
    incidentId: -9003,
    occurredDate: '2026. 08. 08.',
    occurredAt: '13:03:28',
    occurredAtIso: '2026-08-08T13:03',
    assignedAt: '2026. 08. 08. 13:05:12',
    assignedAtIso: '2026-08-08T13:05',
    endedAt: '-',
    endedAtIso: '',
    receiptNo: 'F-260808-S003',
    equipment: '52마8014',
    vehicleNo: '52마8014',
    dispatchVehicle: '출동 차량 1',
    faultName: 'ABS 센서 이상',
    faultText: 'ABS 센서 통신 이상 신호가 수신되었습니다.',
    status: 'repairing',
    statusText: '수리중',
    customer: '접수자31',
    manager: '정비담당1',
    managerPhone: '010-0000-0003',
    location: '서울역 인근',
    latitude: 37.5547,
    longitude: 126.9707,
    actions: ['진단기 연결', '휠 센서 확인', '이상 코드 초기화'],
  },
  {
    id: -9004,
    incidentId: -9004,
    occurredDate: '2026. 08. 08.',
    occurredAt: '12:58:10',
    occurredAtIso: '2026-08-08T12:58',
    assignedAt: '2026. 08. 08. 13:00:22',
    assignedAtIso: '2026-08-08T13:00',
    endedAt: '2026. 08. 08. 13:24:19',
    endedAtIso: '2026-08-08T13:24',
    receiptNo: 'F-260808-S004',
    equipment: '77바2290',
    vehicleNo: '77바2290',
    dispatchVehicle: '출동 차량 7',
    faultName: '타이어 압력 저하',
    faultText: '우측 후륜 압력 저하가 확인되었습니다.',
    status: 'done',
    statusText: '완료',
    customer: '접수자04',
    manager: '출동기사7',
    managerPhone: '010-0000-0004',
    location: '공덕 인근',
    latitude: 37.5435,
    longitude: 126.9511,
    actions: ['타이어 압력 보충', '누기 여부 확인', '조치 완료 등록'],
  },
]

/**
 * 260808 silee - FaultMon 메인 화면 제어 함수
 */
export function SearchPage({
  activeView,
  isNotificationEnabled,
  notificationLogs,
  onNotificationToggle,
  onViewChange,
  onNotify,
}) {
  const [filters, setFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const [faults, setFaults] = useState([])
  const [todayStats, setTodayStats] = useState(emptyStats)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [signalEvents, setSignalEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const [signalStatus, setSignalStatus] = useState('connecting')
  const [signalUserCount, setSignalUserCount] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState('')
  const activeViewRef = useRef(activeView)
  const latestNotificationKeyRef = useRef('')

  const filteredFaults = useMemo(() => filterFaults(faults, appliedFilters), [faults, appliedFilters])
  const homeVisibleFaults = useMemo(() => faults.slice(0, visibleCount), [faults, visibleCount])
  const selectedFault = useMemo(() => {
    if (selectedId == null) {
      return null
    }

    if (selectedDetail?.id === selectedId) {
      return selectedDetail
    }

    return faults.find((fault) => fault.id === selectedId) ?? null
  }, [faults, selectedDetail, selectedId])
  const homeHasMoreFaults = visibleCount < faults.length
  const homeSelectedIndex = faults.findIndex((fault) => fault.id === selectedFault?.id)

  const refreshDashboard = useCallback(async ({ notify = true, logType = 'API', showLoading = true } = {}) => {
    // 260808 silee - 새로고침 때 목록과 금일 통계를 함께 갱신합니다.
    if (showLoading) {
      setIsLoading(true)
    }
    setErrorMessage('')

    try {
      const [faultList, stats] = await Promise.all([fetchFaultList(), fetchTodayStats()])
      const now = formatLogTime(new Date())

      setFaults(faultList)
      setTodayStats(stats)
      setLastSyncTime(now)
      setSignalEvents((current) =>
        [
          { time: now, type: logType, message: '고장 목록과 금일 통계를 갱신했습니다.' },
          ...current,
        ].slice(0, 8),
      )

      if (faultList.length > 0) {
        setSelectedId((current) => current ?? faultList[0].id)
        latestNotificationKeyRef.current ||= createNotificationKey(faultList[0])
      }

      if (notify && faultList.length > 0) {
        onNotify?.({
          title: `[${now}] FaultMon API`,
          message: `${faultList.length}건의 최근 고장 데이터를 불러왔습니다.`,
          type: 'success',
        })
      }

      return faultList
    } catch {
      setErrorMessage('FaultMon API 데이터를 불러오지 못했습니다.')
      setSignalEvents((current) =>
        [
          { time: formatLogTime(new Date()), type: 'Error', message: 'FaultMon API 호출 실패' },
          ...current,
        ].slice(0, 8),
      )
      return []
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [onNotify])

  useEffect(() => {
    refreshDashboard()
  }, [refreshDashboard])

  useEffect(() => {
    activeViewRef.current = activeView
  }, [activeView])

  useEffect(() => {
    let isMounted = true
    const connection = createFaultMonConnection()

    connection.on('FaultMonUserCount', (count) => {
      if (isMounted) {
        setSignalUserCount(Number(count) || 0)
      }
    })

    connection.on('Signal_FLTLIST', async () => {
      if (!isMounted) {
        return
      }

      if (activeViewRef.current === 'search') {
        const now = formatLogTime(new Date())
        setSignalEvents((current) =>
          [
            { time: now, type: 'SignalR', message: '검색 화면에서는 자동 갱신을 보류했습니다.' },
            ...current,
          ].slice(0, 8),
        )
        return
      }

      const faultList = await refreshDashboard({ notify: false, logType: 'SignalR', showLoading: false })
      const latestFault = faultList[0]
      const notificationKey = createNotificationKey(latestFault)

      if (notificationKey && latestNotificationKeyRef.current !== notificationKey) {
        latestNotificationKeyRef.current = notificationKey
        onNotify?.(createNotification(latestFault))
      }
    })

    connection.on('FaultMonScheduleTick', (payload) => {
      if (!isMounted) {
        return
      }

      const now = formatLogTime(new Date())
      setSignalEvents((current) =>
        [
          {
            time: now,
            type: 'Schedule',
            message: `PROC_SCH_REPEAT_INSERT 실행 (${payload?.activeConnections ?? 0} connections)`,
          },
          ...current,
        ].slice(0, 8),
      )
    })

    connection.on('FaultMonScheduleError', () => {
      if (!isMounted) {
        return
      }

      setSignalEvents((current) =>
        [
          { time: formatLogTime(new Date()), type: 'Error', message: 'FaultMon 스케줄 실행 실패' },
          ...current,
        ].slice(0, 8),
      )
    })

    connection.onreconnecting(() => {
      if (isMounted) {
        setSignalStatus('reconnecting')
      }
    })

    connection.onreconnected(() => {
      if (isMounted) {
        setSignalStatus('connected')
        connection.invoke('GetUserCount').catch(() => {})
      }
    })

    connection.onclose(() => {
      if (isMounted) {
        setSignalStatus('disconnected')
        setSignalUserCount(0)
      }
    })

    connection
      .start()
      .then(() => {
        if (!isMounted) {
          return
        }

        setSignalStatus('connected')
        connection.invoke('GetUserCount').catch(() => {})
        onNotify?.({
          title: `[${formatLogTime(new Date())}] SignalR`,
          message: 'FaultMon 실시간 연결이 준비되었습니다.',
          type: 'success',
        })
      })
      .catch(() => {
        if (isMounted) {
          setSignalStatus('disconnected')
        }
      })

    return () => {
      isMounted = false
      connection.stop().catch(() => {})
    }
  }, [onNotify, refreshDashboard])

  useEffect(() => {
    // 260808 silee - 홈 목록은 항상 10건부터 다시 확인하도록 초기화합니다.
    setVisibleCount(pageSize)
  }, [filters])

  useEffect(() => {
    if (selectedId != null && faults.length > 0 && !faults.some((fault) => fault.id === selectedId)) {
      setSelectedId(faults[0].id)
    }
  }, [faults, selectedId])

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null)
      return
    }

    let isCancelled = false

    fetchFaultDetail(selectedId)
      .then((detail) => {
        if (!isCancelled) {
          setSelectedDetail(detail)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSelectedDetail(null)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [selectedId])

  const stats = useMemo(() => {
    const received = faults.filter((fault) => fault.status === 'received').length

    return [
      { label: '오늘 접수', value: todayStats.total, caption: '금일 전체' },
      { label: '접수완료', value: received, caption: '현재 목록 기준', tone: 'received' },
      { label: '진행중', value: todayStats.inProgress, caption: '출동/처리중' },
      { label: '완료율', value: `${todayStats.completedRate}%`, caption: `${todayStats.completed}건 완료` },
    ]
  }, [faults, todayStats])

  const handleFilterChange = (event) => {
    const { checked, name, value } = event.target

    if (name === 'statusesAll') {
      setFilters((current) => ({ ...current, statuses: [] }))
      return
    }

    if (name === 'statuses') {
      setFilters((current) => ({
        ...current,
        statuses: checked
          ? [...current.statuses, value]
          : current.statuses.filter((status) => status !== value),
      }))
      return
    }

    setFilters((current) => ({ ...current, [name]: value }))
  }

  const handleSearch = () => {
    const matchedFaults = filterFaults(faults, filters)
    setAppliedFilters(filters)
    setSelectedId(matchedFaults[0]?.id ?? null)
  }

  const resetFilters = () => {
    setFilters(initialFilters)
    setAppliedFilters(initialFilters)
    setSelectedId(faults[0]?.id ?? null)
    setVisibleCount(pageSize)
  }

  const handleSelectFault = (faultId) => {
    setSelectedId((current) => (current === faultId ? null : faultId))
  }

  return (
    <>
      <ShellHeader
        activeView={activeView}
        isNotificationEnabled={isNotificationEnabled}
        lastSyncTime={lastSyncTime}
        notificationLogs={notificationLogs}
        onNotificationToggle={onNotificationToggle}
        onViewChange={onViewChange}
        signalStatus={signalStatus}
        signalUserCount={signalUserCount}
      />

      {errorMessage && <div className="api-error-banner">{errorMessage}</div>}

      {activeView === 'home' ? (
        <section className="ops-layout">
          <LeftRail
            faults={homeVisibleFaults}
            hasMore={homeHasMoreFaults}
            isLoading={isLoading}
            loadedCount={homeVisibleFaults.length}
            selectedIndex={homeSelectedIndex}
            selectedId={selectedId}
            stats={stats}
            totalCount={faults.length}
            onLoadMore={() => setVisibleCount((current) => current + pageSize)}
            onSelectFault={handleSelectFault}
          />
          <CoordinateMap
            faults={homeVisibleFaults}
            selectedFault={selectedFault}
            selectedId={selectedId}
            onSelectFault={handleSelectFault}
          />
          <RightRail selectedFault={selectedFault} signalEvents={signalEvents} />
        </section>
      ) : (
        <SearchWorkspace
          filteredFaults={filteredFaults}
          filters={filters}
          isLoading={isLoading}
          selectedFault={selectedFault}
          selectedId={selectedId}
          totalCount={faults.length}
          onChange={handleFilterChange}
          onReset={resetFilters}
          onSearch={handleSearch}
          onSelectFault={handleSelectFault}
        />
      )}
    </>
  )
}

/**
 * 260808 silee - FaultMon 검색 화면 구성 함수
 */
function SearchWorkspace({
  filters,
  isLoading,
  filteredFaults: _filteredFaults,
  totalCount,
  selectedId,
  selectedFault,
  onChange,
  onReset,
  onSearch,
  onSelectFault,
}) {
  const isSampleMode = true
  const displayFaults = sampleSearchFaults
  const displaySelectedFault =
    selectedFault ?? displayFaults.find((fault) => fault.id === selectedId) ?? null

  return (
    <section className="search-workspace">
      <div className="search-main-layout">
        <div className="search-left-column">
          <SearchForm
            filters={filters}
            isLoading={isLoading}
            onChange={onChange}
            onReset={onReset}
            onSearch={onSearch}
          />
          <SearchResultsPanel
            faults={displayFaults}
            isSampleMode={isSampleMode}
            isLoading={isLoading}
            selectedId={selectedId}
            totalCount={isSampleMode ? displayFaults.length : totalCount}
            onSelectFault={onSelectFault}
          />
        </div>
        <div className="search-right-column">
          <div className="search-map-slot">
            <CoordinateMap
              faults={displayFaults}
              selectedFault={displaySelectedFault}
              selectedId={selectedId}
              onSelectFault={onSelectFault}
            />
          </div>
          <SearchDetailPanel selectedFault={displaySelectedFault} />
        </div>
      </div>
    </section>
  )
}

/**
 * 260808 silee - FaultMon 검색 결과 테이블 표시 함수
 */
function SearchResultsPanel({ faults, isSampleMode, isLoading, selectedId, totalCount, onSelectFault }) {
  return (
    <section className={`panel search-results-panel ${isSampleMode ? 'sample-mode' : ''}`}>
      <header className="panel-header search-summary-header">
        <div>
          <h2>Search Result</h2>
          <p>검색 버튼으로 적용된 FaultMon 결과</p>
        </div>
        <span>
          {faults.length} / {totalCount}건
        </span>
      </header>

      <div className="search-results-wrap">
        <table className="fault-table search-result-table">
          <thead>
            <tr>
              <th>발생 일시</th>
              <th>차량 번호</th>
              <th>고장명</th>
              <th>접수 번호</th>
              <th>상태</th>
              <th>위치</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="empty-table" colSpan="6">
                  FaultMon 데이터를 불러오는 중입니다.
                </td>
              </tr>
            )}
            {!isLoading && faults.length === 0 && (
              <tr>
                <td className="empty-table" colSpan="6">
                  검색 조건에 맞는 고장 이벤트가 없습니다.
                </td>
              </tr>
            )}
            {!isLoading &&
              faults.map((fault) => (
                <tr
                  className={fault.id === selectedId ? 'selected' : ''}
                  key={fault.id}
                  onClick={() => onSelectFault(fault.id)}
                >
                  <td>
                    <strong>{fault.occurredDate}</strong>
                    <span>{fault.occurredAt}</span>
                  </td>
                  <td>
                    <strong>{fault.vehicleNo}</strong>
                    <span>{fault.dispatchVehicle}</span>
                  </td>
                  <td>{fault.faultName}</td>
                  <td>{fault.receiptNo}</td>
                  <td>
                    <span className={`state ${fault.status}`}>{fault.statusText}</span>
                  </td>
                  <td>{fault.location}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/**
 * 260808 silee - FaultMon 검색 상세 정보 표시 함수
 */
function SearchDetailPanel({ selectedFault }) {
  if (!selectedFault) {
    return (
      <section className="panel search-detail-panel">
        <header className="panel-header">
          <h2>Search Detail</h2>
          <p>no selection</p>
        </header>
        <div className="empty-detail">검색 결과에서 고장 이벤트를 선택해주세요.</div>
      </section>
    )
  }

  return (
    <section className="panel search-detail-panel">
      <header className="panel-header">
        <h2>Search Detail</h2>
        <p>{selectedFault.receiptNo}</p>
      </header>
      <dl className="search-detail-list">
        <SearchDetailItem label="차량 번호" value={selectedFault.vehicleNo} />
        <SearchDetailItem label="고장명" value={selectedFault.faultName} />
        <SearchDetailItem label="접수자" value={selectedFault.customer} />
        <SearchDetailItem label="담당자" value={selectedFault.manager} />
        <SearchDetailItem label="담당자 연락처" value={selectedFault.managerPhone} />
        <SearchDetailItem label="출동 차량" value={selectedFault.dispatchVehicle} />
        <SearchDetailItem label="위치" value={selectedFault.location} />
        <SearchDetailItem label="배정 시각" value={selectedFault.assignedAt} />
        <SearchDetailItem label="완료 시각" value={selectedFault.endedAt} />
      </dl>
    </section>
  )
}

/**
 * 260808 silee - FaultMon 검색 상세 항목 표시 함수
 */
function SearchDetailItem({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || '-'}</dd>
    </div>
  )
}

/**
 * 260808 silee - FaultMon 목록 필터 함수
 */
function filterFaults(source, filters) {
  const keyword = filters.keyword.trim().toLowerCase()

  return source.filter((fault) => {
    const keywordMatched =
      !keyword ||
      lowerText(fault.equipment).includes(keyword) ||
      lowerText(fault.vehicleNo).includes(keyword) ||
      lowerText(fault.faultName).includes(keyword) ||
      lowerText(fault.receiptNo).includes(keyword) ||
      lowerText(fault.location).includes(keyword) ||
      lowerText(fault.customer).includes(keyword) ||
      lowerText(fault.manager).includes(keyword) ||
      lowerText(fault.managerPhone).includes(keyword) ||
      lowerText(fault.dispatchVehicle).includes(keyword) ||
      lowerText(fault.faultText).includes(keyword)
    const statusMatched = filters.statuses.length === 0 || filters.statuses.includes(fault.status)
    const dateFromMatched = !filters.dateTimeFrom || fault.occurredAtIso >= filters.dateTimeFrom
    const dateToMatched = !filters.dateTimeTo || fault.occurredAtIso <= filters.dateTimeTo

    return (
      keywordMatched &&
      statusMatched &&
      dateFromMatched &&
      dateToMatched &&
      containsText(fault.vehicleNo, filters.vehicleNo) &&
      containsText(fault.receiptNo, filters.receiptNo) &&
      containsText(fault.customer, filters.customer) &&
      containsText(fault.manager, filters.manager)
    )
  })
}

/**
 * 260808 silee - 상세 검색어 포함 여부 확인 함수
 */
function containsText(source, keyword) {
  const normalizedKeyword = String(keyword ?? '').trim().toLowerCase()

  if (!normalizedKeyword) {
    return true
  }

  return lowerText(source).includes(normalizedKeyword)
}

/**
 * 260808 silee - 검색 비교용 소문자 변환 함수
 */
function lowerText(value) {
  return String(value ?? '').toLowerCase()
}

/**
 * 260808 silee - 갱신 로그 시간 표시 함수
 */
function formatLogTime(value) {
  return value.toLocaleTimeString('ko-KR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
