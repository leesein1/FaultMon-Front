// 좌측 영역의 금일 통계와 실시간 고장 데이터 테이블을 담당하는 컴포넌트입니다.
import { PanelHeader } from '../common/PanelHeader'

export function LeftRail({ faults, selectedId, stats, onSelectFault }) {
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
          <table className="fault-table">
            <thead>
              <tr>
                <th>발생 일시</th>
                <th>장비명</th>
                <th>고장 등급</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {faults.length === 0 && (
                <tr>
                  <td className="empty-table" colSpan="4">
                    검색 조건에 맞는 고장 이벤트가 없습니다.
                  </td>
                </tr>
              )}
              {faults.map((fault) => (
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
                    <span className={`severity ${fault.severity}`}>{fault.severityText}</span>
                  </td>
                  <td>
                    <span className={`state ${fault.status}`}>{fault.statusText}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </aside>
  )
}
