// FaultMon 대시보드의 기본 검색과 상세 기간/상태 필터를 제공하는 검색 폼 컴포넌트입니다.
import { useState } from 'react'

export function SearchForm({ filters, onChange, onReset }) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  return (
    <section className="search-panel" aria-label="fault search filters">
      <div className="search-title">
        <p className="meta-label">Fault Search</p>
        <h2>실시간 고장 이벤트 필터</h2>
      </div>
      <div className="search-controls">
        <label>
          <span>Keyword</span>
          <input
            name="keyword"
            type="search"
            value={filters.keyword}
            placeholder="장비명, 고장명, 접수번호"
            onChange={onChange}
          />
        </label>
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
          <span className="advanced-chevron">{isAdvancedOpen ? '▲' : '▼'}</span>
        </button>
      </div>

      <div className={`advanced-shell ${isAdvancedOpen ? 'open' : ''}`}>
        <div className="advanced-controls">
          <label>
            <span>Severity</span>
            <select name="severity" value={filters.severity} onChange={onChange}>
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="minor">Minor</option>
              <option value="normal">Normal</option>
            </select>
          </label>
          <label>
            <span>Status</span>
            <select name="status" value={filters.status} onChange={onChange}>
              <option value="all">All</option>
              <option value="received">접수</option>
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
