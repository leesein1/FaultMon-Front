// FaultMon 검색/관제 메인 페이지로, 검색 폼과 3단 대시보드 레이아웃을 조립하는 파일입니다.
import { useMemo, useState } from 'react'
import { CoordinateMap } from '../../components/dashboard/center/CoordinateMap'
import { ShellHeader } from '../../components/dashboard/common/ShellHeader'
import { LeftRail } from '../../components/dashboard/left/LeftRail'
import { RightRail } from '../../components/dashboard/right/RightRail'
import { SearchForm } from '../../components/search/SearchForm'
import { faults, signalEvents } from '../../data/faultData'

const initialFilters = {
  keyword: '',
  severity: 'all',
  status: 'all',
  dateTimeFrom: '',
  dateTimeTo: '',
}

export function SearchPage() {
  const [filters, setFilters] = useState(initialFilters)
  const filteredFaults = useMemo(() => filterFaults(faults, filters), [filters])
  const [selectedId, setSelectedId] = useState(faults[0].id)
  const selectedFault =
    filteredFaults.find((fault) => fault.id === selectedId) ?? filteredFaults[0] ?? faults[0]

  const stats = useMemo(() => {
    const critical = filteredFaults.filter((fault) => fault.severity === 'critical').length
    const active = filteredFaults.filter((fault) => fault.status !== 'done').length
    const completed = filteredFaults.filter((fault) => fault.status === 'done').length

    return [
      { label: 'Total', value: filteredFaults.length, caption: 'filtered' },
      { label: 'Critical', value: critical, caption: 'requires attention', tone: 'critical' },
      { label: 'Active', value: active, caption: 'in progress' },
      { label: 'Resolved', value: completed, caption: 'closed' },
    ]
  }, [filteredFaults])

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const resetFilters = () => {
    setFilters(initialFilters)
    setSelectedId(faults[0].id)
  }

  return (
    <>
      <ShellHeader />
      <SearchForm filters={filters} onChange={handleFilterChange} onReset={resetFilters} />

      <section className="ops-layout">
        <LeftRail
          faults={filteredFaults}
          selectedId={selectedFault.id}
          stats={stats}
          onSelectFault={setSelectedId}
        />
        <CoordinateMap
          faults={filteredFaults}
          selectedFault={selectedFault}
          selectedId={selectedFault.id}
          onSelectFault={setSelectedId}
        />
        <RightRail selectedFault={selectedFault} signalEvents={signalEvents} />
      </section>
    </>
  )
}

function filterFaults(source, filters) {
  const keyword = filters.keyword.trim().toLowerCase()

  return source.filter((fault) => {
    const keywordMatched =
      !keyword ||
      fault.equipment.toLowerCase().includes(keyword) ||
      fault.faultName.toLowerCase().includes(keyword) ||
      fault.receiptNo.toLowerCase().includes(keyword)
    const severityMatched = filters.severity === 'all' || fault.severity === filters.severity
    const statusMatched = filters.status === 'all' || fault.status === filters.status
    const dateFromMatched = !filters.dateTimeFrom || fault.occurredAtIso >= filters.dateTimeFrom
    const dateToMatched = !filters.dateTimeTo || fault.occurredAtIso <= filters.dateTimeTo

    return keywordMatched && severityMatched && statusMatched && dateFromMatched && dateToMatched
  })
}
