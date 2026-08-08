import { useState } from 'react'

/**
 * 260808 silee - FaultMon 검색 조건 표시 함수
 */
export function SearchForm({ filters, isLoading, onChange, onRefresh, onReset }) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  return (
    <section className="search-panel" aria-label="fault search filters">
      <div className="search-controls">
        <label>
          <span>Keyword</span>
          <input
            name="keyword"
            type="search"
            value={filters.keyword}
            placeholder="차량 번호, 고장명, 접수번호, 위치"
            onChange={onChange}
          />
        </label>
        <button type="button" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? 'Loading' : 'Refresh'}
        </button>
        <button type="button" onClick={onReset}>
          Reset
        </button>
        <button
          className="advanced-toggle"
          type="button"
          aria-label={isAdvancedOpen ? '상세 검색 닫기' : '상세 검색 열기'}
          aria-expanded={isAdvancedOpen}
          onClick={() => setIsAdvancedOpen((current) => !current)}
        >
          <span className="advanced-chevron">{isAdvancedOpen ? '⌃' : '⌄'}</span>
        </button>
      </div>

      <div className={`advanced-shell ${isAdvancedOpen ? 'open' : ''}`}>
        {/* 260808 silee - 상태와 기간 조건은 필요할 때만 열어 화면 높이를 아낍니다. */}
        <div className="advanced-controls">
          <label>
            <span>Status</span>
            <select name="status" value={filters.status} onChange={onChange}>
              <option value="all">All</option>
              <option value="received">접수완료</option>
              <option value="dispatching">출동중</option>
              <option value="repairing">수리중</option>
              <option value="done">완료</option>
            </select>
          </label>
          <label>
            <span>From</span>
            <input
              name="dateTimeFrom"
              type="datetime-local"
              value={filters.dateTimeFrom}
              onChange={onChange}
            />
          </label>
          <label>
            <span>To</span>
            <input
              name="dateTimeTo"
              type="datetime-local"
              value={filters.dateTimeTo}
              onChange={onChange}
            />
          </label>
        </div>
      </div>
    </section>
  )
}
