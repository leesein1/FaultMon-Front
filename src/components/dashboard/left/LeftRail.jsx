import { PanelHeader } from '../common/PanelHeader'

/**
 * 260808 silee - 좌측 통계/고장 목록 표시 함수
 */
export function LeftRail({
  faults,
  hasMore,
  isLoading,
  loadedCount,
  selectedIndex,
  selectedId,
  stats,
  totalCount,
  onLoadMore,
  onSelectFault,
}) {
  return (
    <aside className="left-rail">
      <section className="stats-grid" aria-label="today metrics">
        {stats.map((item) => (
          <article className={`stat-tile ${item.tone ?? ''}`} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.caption}</small>
          </article>
        ))}
      </section>

      <section className="panel table-panel">
        <PanelHeader title="Live Faults" subtitle="RcvFault event table" />
        <div className="table-wrap">
          {/* 260808 silee - 테이블 높이는 고정하고 내부에서만 스크롤되도록 CSS에서 처리합니다. */}
          <table className="fault-table">
            <thead>
              <tr>
                <th>발생 일시</th>
                <th>차량/고장</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="empty-table" colSpan="3">
                    FaultMon 데이터를 불러오는 중입니다.
                  </td>
                </tr>
              )}
              {!isLoading && faults.length === 0 && (
                <tr>
                  <td className="empty-table" colSpan="3">
                    조건에 맞는 고장 이벤트가 없습니다.
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
                      <strong>{fault.equipment}</strong>
                      <span>{fault.faultName}</span>
                    </td>
                    <td>
                      <span className={`state ${fault.status}`}>{fault.statusText}</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!isLoading && totalCount > 0 && (
          <div className="table-footer">
            {/* 260808 silee - 현재 선택이 전체 결과 중 몇 번째인지 바로 확인하는 표시입니다. */}
            <span>
              선택 {selectedIndex >= 0 ? selectedIndex + 1 : '-'} / {totalCount}건
            </span>
            {hasMore ? (
              <button type="button" onClick={onLoadMore}>
                더 보기 ({loadedCount}/{totalCount})
              </button>
            ) : (
              <span>전체 표시 완료</span>
            )}
          </div>
        )}
      </section>
    </aside>
  )
}
