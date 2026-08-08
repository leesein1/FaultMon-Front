import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchFaultDetail, fetchFaultList, fetchTodayStats } from '../../api/faultMonApi'
import { CoordinateMap } from '../../components/dashboard/center/CoordinateMap'
import { ShellHeader } from '../../components/dashboard/common/ShellHeader'
import { LeftRail } from '../../components/dashboard/left/LeftRail'
import { RightRail } from '../../components/dashboard/right/RightRail'
import { SearchForm } from '../../components/search/SearchForm'

const initialFilters = {
  keyword: '',
  status: 'all',
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

/**
 * 260808 silee - FaultMon 관제 메인 화면 함수
 */
export function SearchPage({ onNotify }) {
  const [filters, setFilters] = useState(initialFilters)
  const [faults, setFaults] = useState([])
  const [todayStats, setTodayStats] = useState(emptyStats)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [signalEvents, setSignalEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [visibleCount, setVisibleCount] = useState(pageSize)

  const filteredFaults = useMemo(() => filterFaults(faults, filters), [faults, filters])
  // 260808 silee - 목록은 처음 10건만 보여주고, 더 보기는 같은 테이블 안에서만 늘립니다.
  const visibleFaults = useMemo(
    () => filteredFaults.slice(0, visibleCount),
    [filteredFaults, visibleCount],
  )
  const selectedFault = useMemo(() => {
    // 260808 silee - 같은 행을 다시 누르면 선택을 비우고 지도는 전체 보기로 돌아갑니다.
    if (selectedId == null) {
      return null
    }

    if (selectedDetail?.id === selectedId) {
      return selectedDetail
    }

    return visibleFaults.find((fault) => fault.id === selectedId) ?? null
  }, [selectedDetail, selectedId, visibleFaults])

  const hasMoreFaults = visibleCount < filteredFaults.length
  const selectedIndex = filteredFaults.findIndex((fault) => fault.id === selectedFault?.id)

  const refreshDashboard = useCallback(async () => {
    // 260808 silee - 새로고침 시 목록과 금일 통계를 같이 갱신합니다.
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [faultList, stats] = await Promise.all([fetchFaultList(), fetchTodayStats()])
      const now = formatLogTime(new Date())

      setFaults(faultList)
      setTodayStats(stats)
      setSignalEvents((current) =>
        [
          { time: now, type: 'API', message: '고장 목록과 금일 통계를 갱신했습니다.' },
          ...current,
        ].slice(0, 8),
      )

      if (faultList.length > 0) {
        setSelectedId((current) => current ?? faultList[0].id)
        onNotify?.({
          title: `[${now}] FaultMon API`,
          message: `${faultList.length}건의 최근 고장 데이터를 불러왔습니다.`,
          type: 'success',
        })
      }
    } catch {
      setErrorMessage('FaultMon API 데이터를 불러오지 못했습니다.')
      setSignalEvents((current) =>
        [
          { time: formatLogTime(new Date()), type: 'Error', message: 'FaultMon API 호출 실패' },
          ...current,
        ].slice(0, 8),
      )
    } finally {
      setIsLoading(false)
    }
  }, [onNotify])

  useEffect(() => {
    refreshDashboard()
  }, [refreshDashboard])

  useEffect(() => {
    // 260808 silee - 필터가 바뀌면 다시 10건부터 확인하도록 초기화합니다.
    setVisibleCount(pageSize)
  }, [filters])

  useEffect(() => {
    if (
      selectedId != null &&
      visibleFaults.length > 0 &&
      !visibleFaults.some((fault) => fault.id === selectedId)
    ) {
      setSelectedId(visibleFaults[0].id)
    }
  }, [selectedId, visibleFaults])

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
    const received = filteredFaults.filter((fault) => fault.status === 'received').length

    return [
      { label: '오늘 접수', value: todayStats.total, caption: '금일 전체' },
      { label: '접수완료', value: received, caption: '현재 목록 기준', tone: 'received' },
      { label: '진행중', value: todayStats.inProgress, caption: '출동/처리중' },
      { label: '완료율', value: `${todayStats.completedRate}%`, caption: `${todayStats.completed}건 완료` },
    ]
  }, [filteredFaults, todayStats])

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const resetFilters = () => {
    setFilters(initialFilters)
    setSelectedId(faults[0]?.id ?? null)
    setVisibleCount(pageSize)
  }

  const handleSelectFault = (faultId) => {
    setSelectedId((current) => (current === faultId ? null : faultId))
  }

  return (
    <>
      <ShellHeader />
      <SearchForm
        filters={filters}
        isLoading={isLoading}
        onChange={handleFilterChange}
        onRefresh={refreshDashboard}
        onReset={resetFilters}
      />

      {errorMessage && <div className="api-error-banner">{errorMessage}</div>}

      <section className="ops-layout">
        <LeftRail
          faults={visibleFaults}
          hasMore={hasMoreFaults}
          isLoading={isLoading}
          loadedCount={visibleFaults.length}
          selectedIndex={selectedIndex}
          selectedId={selectedId}
          stats={stats}
          totalCount={filteredFaults.length}
          onLoadMore={() => setVisibleCount((current) => current + pageSize)}
          onSelectFault={handleSelectFault}
        />
        <CoordinateMap
          faults={visibleFaults}
          selectedFault={selectedFault}
          selectedId={selectedId}
          onSelectFault={handleSelectFault}
        />
        <RightRail selectedFault={selectedFault} signalEvents={signalEvents} />
      </section>
    </>
  )
}

/**
 * 260808 silee - FaultMon 목록 필터 함수
 */
function filterFaults(source, filters) {
  // 260808 silee - 화면 검색은 차량번호, 고장명, 접수번호, 위치 기준으로 맞춥니다.
  const keyword = filters.keyword.trim().toLowerCase()

  return source.filter((fault) => {
    const keywordMatched =
      !keyword ||
      fault.equipment.toLowerCase().includes(keyword) ||
      fault.faultName.toLowerCase().includes(keyword) ||
      fault.receiptNo.toLowerCase().includes(keyword) ||
      fault.location.toLowerCase().includes(keyword)
    const statusMatched = filters.status === 'all' || fault.status === filters.status
    const dateFromMatched = !filters.dateTimeFrom || fault.occurredAtIso >= filters.dateTimeFrom
    const dateToMatched = !filters.dateTimeTo || fault.occurredAtIso <= filters.dateTimeTo

    return keywordMatched && statusMatched && dateFromMatched && dateToMatched
  })
}

/**
 * 260808 silee - 갱신 로그 시간 포맷 함수
 */
function formatLogTime(value) {
  return value.toLocaleTimeString('ko-KR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
