const statusOptions = [
  { value: 'received', label: '접수완료' },
  { value: 'dispatching', label: '출동중' },
  { value: 'repairing', label: '수리중' },
  { value: 'done', label: '완료' },
]

/**
 * 260808 silee - FaultMon 4줄 조회 조건 입력 폼 함수
 */
export function SearchForm({ filters, isLoading, onChange, onSearch, onReset }) {
  return (
    <section className="search-panel" aria-label="fault search filters">
      <header className="search-panel-header">
        <div>
          <h2>Fault Search</h2>
          <p>누적 고장 이력 상세 조회</p>
        </div>
        <div className="search-action-buttons">
          <button className="search-submit-button" type="button" onClick={onSearch} disabled={isLoading}>
            Search
          </button>
          <button type="button" onClick={onReset}>
            Reset
          </button>
        </div>
      </header>

      {/* 260808 silee - 조건 영역은 업무 조회 화면처럼 4줄로 고정해서 한눈에 보이게 둡니다. */}
      <div className="condition-form">
        <ConditionInput
          className="condition-span-all"
          name="keyword"
          label="통합 검색"
          value={filters.keyword}
          placeholder="차량, 고장명, 고장 내용, 접수 번호, 담당, 위치"
          onChange={onChange}
        />

        <div className="condition-row four-columns">
          <ConditionInput
            name="receiptNo"
            label="접수 번호"
            value={filters.receiptNo}
            placeholder="ReceiptNo"
            onChange={onChange}
          />
          <ConditionInput
            name="vehicleNo"
            label="차량 번호"
            value={filters.vehicleNo}
            placeholder="차량 번호"
            onChange={onChange}
          />
          <ConditionInput
            name="customer"
            label="접수자"
            value={filters.customer}
            placeholder="접수자"
            onChange={onChange}
          />
          <ConditionInput
            name="manager"
            label="담당자"
            value={filters.manager}
            placeholder="담당자"
            onChange={onChange}
          />
        </div>

        <fieldset className="status-choice-group">
          <legend>상태</legend>
          <label className={filters.statuses.length === 0 ? 'active' : ''}>
            <input
              checked={filters.statuses.length === 0}
              name="statusesAll"
              type="checkbox"
              onChange={onChange}
            />
            전체
          </label>
          {statusOptions.map((option) => (
            <label className={filters.statuses.includes(option.value) ? 'active' : ''} key={option.value}>
              <input
                checked={filters.statuses.includes(option.value)}
                name="statuses"
                type="checkbox"
                value={option.value}
                onChange={onChange}
              />
              {option.label}
            </label>
          ))}
        </fieldset>

        <div className="condition-row time-row">
          <ConditionInput
            name="dateTimeFrom"
            label="시간 시작"
            type="datetime-local"
            value={filters.dateTimeFrom}
            onChange={onChange}
          />
          <ConditionInput
            name="dateTimeTo"
            label="시간 종료"
            type="datetime-local"
            value={filters.dateTimeTo}
            onChange={onChange}
          />
        </div>
      </div>
    </section>
  )
}

/**
 * 260808 silee - FaultMon 조회 조건 입력칸 표시 함수
 */
function ConditionInput({ className = '', name, label, type = 'text', value, placeholder = '', onChange }) {
  return (
    <label className={className}>
      <span>{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </label>
  )
}
