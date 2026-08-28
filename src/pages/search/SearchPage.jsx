import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchFaultDetail,
  fetchFaultHistory,
  fetchFaultList,
  fetchTodayStats,
} from '../../api/faultMonApi'
import { createFaultMonConnection } from '../../api/faultMonSignalR'
import { CoordinateMap } from '../../components/dashboard/center/CoordinateMap'
import { ShellHeader } from '../../components/dashboard/common/ShellHeader'
import { LeftRail } from '../../components/dashboard/left/LeftRail'
import { RightRail } from '../../components/dashboard/right/RightRail'
import { SearchForm } from '../../components/search/SearchForm'
import { createNotification, createNotificationKey } from '../../notify'

function createInitialFilters() {
  const today = formatInputDate(new Date())

  return {
    keyword: '',
    vehicleNo: '',
    receiptNo: '',
    customer: '',
    manager: '',
    statuses: [],
    dateTimeFrom: today,
    dateTimeTo: today,
    page: 1,
    pageSize: 100,
  }
}

const emptyStats = {
  total: 0,
  inProgress: 0,
  completed: 0,
  completedRate: 0,
}

const pageSize = 10

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
  const [filters, setFilters] = useState(() => createInitialFilters())
  const [faults, setFaults] = useState([])
  const [searchFaults, setSearchFaults] = useState([])
  const [searchTotalCount, setSearchTotalCount] = useState(0)
  const [todayStats, setTodayStats] = useState(emptyStats)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [signalEvents, setSignalEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [isSearchLoadingMore, setIsSearchLoadingMore] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchErrorMessage, setSearchErrorMessage] = useState('')
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const [signalStatus, setSignalStatus] = useState('connecting')
  const [signalUserCount, setSignalUserCount] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState('')
  const activeViewRef = useRef(activeView)
  const didAutoSearchRef = useRef(false)
  const isSearchLoadingMoreRef = useRef(false)
  const nextSearchPageRef = useRef(2)
  const latestNotificationKeyRef = useRef('')

  const activeFaults = activeView === 'search' ? searchFaults : faults
  const homeVisibleFaults = useMemo(() => faults.slice(0, visibleCount), [faults, visibleCount])
  const selectedFault = useMemo(() => {
    if (selectedId == null) {
      return null
    }

    if (selectedDetail?.id === selectedId) {
      return selectedDetail
    }

    return activeFaults.find((fault) => fault.id === selectedId) ?? null
  }, [activeFaults, selectedDetail, selectedId])
  const homeHasMoreFaults = visibleCount < faults.length
  const homeSelectedIndex = faults.findIndex((fault) => fault.id === selectedFault?.id)

  const refreshDashboard = useCallback(async ({ notify = true, logType = 'API', showLoading = true } = {}) => {
    // 260808 silee - 홈 화면 최근 목록과 금일 통계를 함께 갱신합니다.
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
          { time: now, type: logType, message: '최근 고장 목록과 금일 통계를 갱신했습니다.' },
          ...current,
        ].slice(0, 8),
      )

      if (faultList.length > 0 && activeViewRef.current === 'home') {
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
            { time: now, type: 'SignalR', message: 'Search 화면에서는 누적 이력 결과를 자동 갱신하지 않습니다.' },
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
    // 260808 silee - 홈 목록은 항상 처음 10건부터 다시 확인합니다.
    setVisibleCount(pageSize)
  }, [faults])

  useEffect(() => {
    if (activeView !== 'home') {
      return
    }

    if (selectedId != null && faults.length > 0 && !faults.some((fault) => fault.id === selectedId)) {
      setSelectedId(faults[0].id)
    }
  }, [activeView, faults, selectedId])

  useEffect(() => {
    if (!selectedId || selectedId < 1) {
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
      setFilters((current) => ({ ...current, statuses: [], page: 1 }))
      return
    }

    if (name === 'statuses') {
      setFilters((current) => ({
        ...current,
        page: 1,
        statuses: checked
          ? [...current.statuses, value]
          : current.statuses.filter((status) => status !== value),
      }))
      return
    }

    setFilters((current) => ({ ...current, [name]: value, page: 1 }))
  }

  const runSearch = useCallback(async (nextFilters, { append = false } = {}) => {
    // 260808 silee - Search 화면은 SignalR 갱신 대신 DB 누적 이력을 직접 조회합니다.
    setHasSearched(true)
    if (append) {
      isSearchLoadingMoreRef.current = true
      setIsSearchLoadingMore(true)
    } else {
      nextSearchPageRef.current = 2
      setIsSearchLoading(true)
    }
    setSearchErrorMessage('')

    try {
      const result = await fetchFaultHistory(nextFilters)
      setFilters(nextFilters)
      setSearchFaults((current) => append ? [...current, ...result.items] : result.items)
      setSearchTotalCount(result.totalCount)
      if (!append) {
        setSelectedId(result.items[0]?.id ?? null)
      }
    } catch {
      if (!append) {
        setSearchFaults([])
        setSearchTotalCount(0)
        setSelectedId(null)
        setSearchErrorMessage('FaultMon 누적 이력 검색에 실패했습니다.')
      } else {
        nextSearchPageRef.current = nextFilters.page ?? nextSearchPageRef.current
      }
    } finally {
      if (append) {
        isSearchLoadingMoreRef.current = false
        setIsSearchLoadingMore(false)
      } else {
        setIsSearchLoading(false)
      }
    }
  }, [])

  const handleSearch = () => {
    runSearch({ ...filters, page: 1 })
  }

  const handleLoadMoreSearch = () => {
    if (isSearchLoading || isSearchLoadingMoreRef.current || searchFaults.length >= searchTotalCount) {
      return
    }

    const nextPage = nextSearchPageRef.current
    nextSearchPageRef.current += 1
    runSearch({ ...filters, page: nextPage }, { append: true })
  }

  useEffect(() => {
    if (activeView !== 'search' || didAutoSearchRef.current) {
      return
    }

    didAutoSearchRef.current = true
    handleSearch()
  }, [activeView])

  const resetFilters = () => {
    nextSearchPageRef.current = 2
    setFilters(createInitialFilters())
    setSearchFaults([])
    setSearchTotalCount(0)
    setHasSearched(false)
    setSearchErrorMessage('')
    setSelectedId(activeViewRef.current === 'home' ? faults[0]?.id ?? null : null)
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
          faults={searchFaults}
          filters={filters}
          hasSearched={hasSearched}
          hasMore={searchFaults.length < searchTotalCount}
          isLoading={isSearchLoading}
          isLoadingMore={isSearchLoadingMore}
          searchErrorMessage={searchErrorMessage}
          selectedFault={selectedFault}
          selectedId={selectedId}
          totalCount={searchTotalCount}
          onChange={handleFilterChange}
          onReset={resetFilters}
          onSearch={handleSearch}
          onLoadMore={handleLoadMoreSearch}
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
  faults,
  filters,
  hasSearched,
  hasMore,
  isLoading,
  isLoadingMore,
  searchErrorMessage,
  selectedId,
  selectedFault,
  totalCount,
  onChange,
  onReset,
  onSearch,
  onLoadMore,
  onSelectFault,
}) {
  const selectedIndex = faults.findIndex((fault) => fault.id === selectedId)
  const selectedPosition = selectedIndex >= 0 ? selectedIndex + 1 : null

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
            faults={faults}
            hasSearched={hasSearched}
            hasMore={hasMore}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            searchErrorMessage={searchErrorMessage}
            selectedId={selectedId}
            totalCount={totalCount}
            onLoadMore={onLoadMore}
            onSelectFault={onSelectFault}
          />
        </div>
        <div className="search-right-column">
          <div className="search-map-slot">
            <CoordinateMap
              faults={faults}
              selectedFault={selectedFault}
              selectedId={selectedId}
              onSelectFault={onSelectFault}
            />
          </div>
          <SearchDetailPanel
            selectedFault={selectedFault}
            selectedPosition={selectedPosition}
            totalCount={totalCount}
          />
        </div>
      </div>
    </section>
  )
}

/**
 * 260808 silee - FaultMon 검색 결과 테이블 표시 함수
 */
function SearchResultsPanel({
  faults,
  hasSearched,
  hasMore,
  isLoading,
  isLoadingMore,
  searchErrorMessage,
  selectedId,
  totalCount,
  onLoadMore,
  onSelectFault,
}) {
  const handleScroll = (event) => {
    if (!hasMore || isLoading || isLoadingMore) {
      return
    }

    const element = event.currentTarget
    const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight

    if (distanceToBottom <= 80) {
      onLoadMore?.()
    }
  }

  return (
    <section className="panel search-results-panel">
      <header className="panel-header search-summary-header">
        <div>
          <h2>Search Result</h2>
          <p>Search 버튼으로 조회한 누적 고장 이력</p>
        </div>
        <span>
          {faults.length} / {totalCount}건
        </span>
      </header>

      <div className="search-results-wrap" onScroll={handleScroll}>
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
                  누적 고장 이력을 조회하는 중입니다.
                </td>
              </tr>
            )}
            {!isLoading && searchErrorMessage && (
              <tr>
                <td className="empty-table" colSpan="6">
                  {searchErrorMessage}
                </td>
              </tr>
            )}
            {!isLoading && !searchErrorMessage && !hasSearched && (
              <tr>
                <td className="empty-table" colSpan="6">
                  조건을 입력하고 Search 버튼을 눌러주세요.
                </td>
              </tr>
            )}
            {!isLoading && !searchErrorMessage && hasSearched && faults.length === 0 && (
              <tr>
                <td className="empty-table" colSpan="6">
                  검색 조건에 맞는 고장 이력이 없습니다.
                </td>
              </tr>
            )}
            {!isLoading &&
              !searchErrorMessage &&
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
            {!isLoading && !searchErrorMessage && isLoadingMore && (
              <tr>
                <td className="empty-table loading-more" colSpan="6">
                  다음 100건 조회 중입니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/**
 * 260808 silee - FaultMon 검색 상세 정보 표시 함수
 */
function SearchDetailPanel({ selectedFault, selectedPosition, totalCount }) {
  if (!selectedFault) {
    return (
      <section className="panel search-detail-panel">
        <header className="panel-header">
          <h2>Search Detail</h2>
          <p>no selection</p>
        </header>
        <div className="empty-detail">검색 결과에서 고장 이력을 선택해주세요.</div>
      </section>
    )
  }

  return (
    <section className="panel search-detail-panel">
      <header className="panel-header">
        <h2>Search Detail</h2>
        <p>{selectedFault.receiptNo}</p>
        {selectedPosition && (
          <span className="selected-position-chip">
            {selectedPosition}번째 / {totalCount}건
          </span>
        )}
      </header>
      <dl className="search-detail-list">
        <SearchDetailItem label="차량 번호" value={selectedFault.vehicleNo} />
        <SearchDetailItem label="고장명" value={selectedFault.faultName} />
        <SearchDetailItem label="고장 내용" value={selectedFault.faultText} />
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

function formatInputDate(value) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
