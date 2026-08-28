import { useEffect, useMemo, useRef, useState } from 'react'
import { DayPicker } from '@daypicker/react'
import { ko } from '@daypicker/react/locale'
import '@daypicker/react/style.css'

const statusOptions = [
  { value: 'received', label: '접수완료' },
  { value: 'dispatching', label: '출동중' },
  { value: 'repairing', label: '수리중' },
  { value: 'done', label: '완료' },
]

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

      <div className="condition-form">
        <ConditionInput
          className="condition-span-all"
          name="keyword"
          label="통합 검색"
          value={filters.keyword}
          placeholder="차량, 고장명, 고장 내용, 접수 번호, 담당자, 위치"
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

        <DateRangePicker
          fromValue={filters.dateTimeFrom}
          toValue={filters.dateTimeTo}
          onChange={onChange}
        />
      </div>
    </section>
  )
}

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

function DateRangePicker({ fromValue, toValue, onChange }) {
  const [openPicker, setOpenPicker] = useState(null)
  const pickerRef = useRef(null)
  const selectedRange = useMemo(() => ({
    from: parseLocalDate(fromValue),
    to: parseLocalDate(toValue),
  }), [fromValue, toValue])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!pickerRef.current?.contains(event.target)) {
        setOpenPicker(null)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenPicker(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleSelect = (date) => {
    if (!date || !openPicker) {
      return
    }

    emitDateChange(onChange, openPicker === 'from' ? 'dateTimeFrom' : 'dateTimeTo', formatLocalDate(date))

    if (openPicker === 'from' && selectedRange.to && date > selectedRange.to) {
      emitDateChange(onChange, 'dateTimeTo', '')
    }

    if (openPicker === 'to' && selectedRange.from && date < selectedRange.from) {
      emitDateChange(onChange, 'dateTimeFrom', '')
    }

    setOpenPicker(null)
  }

  return (
    <div className="condition-row time-row" ref={pickerRef}>
      <span className="time-row-title">발생 시간</span>
      <div className="date-range-controls">
        <button
          className="date-range-button"
          type="button"
          aria-expanded={openPicker === 'from'}
          onClick={() => setOpenPicker((current) => current === 'from' ? null : 'from')}
        >
          {formatDisplayDate(selectedRange.from)}
        </button>
        <span className="date-range-separator">~</span>
        <button
          className="date-range-button"
          type="button"
          aria-expanded={openPicker === 'to'}
          onClick={() => setOpenPicker((current) => current === 'to' ? null : 'to')}
        >
          {formatDisplayDate(selectedRange.to)}
        </button>
      </div>

      {openPicker && (
        <div className="date-picker-popover">
          <DayPicker
            animate
            mode="single"
            locale={ko}
            selected={openPicker === 'from' ? selectedRange.from : selectedRange.to}
            onSelect={handleSelect}
          />
        </div>
      )}
    </div>
  )
}

function emitDateChange(onChange, name, value) {
  onChange({
    target: {
      name,
      value,
    },
  })
}

function parseLocalDate(value) {
  if (!value) {
    return undefined
  }

  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) {
    return undefined
  }

  return new Date(year, month - 1, day)
}

function formatLocalDate(value) {
  if (!value) {
    return ''
  }

  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDisplayDate(value) {
  if (!value) {
    return '날짜 선택'
  }

  return value.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
