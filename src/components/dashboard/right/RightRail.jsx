import { PanelHeader } from '../common/PanelHeader'

/**
 * 260808 silee - 우측 고장 상세/로그 표시 함수
 */
export function RightRail({ selectedFault, signalEvents }) {
  if (!selectedFault) {
    return (
      <aside className="right-rail">
        <section className="panel detail-panel">
          <PanelHeader title="Fault Detail" subtitle="no selection" />
          <div className="empty-detail">선택된 고장 이벤트가 없습니다.</div>
        </section>
      </aside>
    )
  }

  return (
    <aside className="right-rail">
      <section className="panel detail-panel">
        <PanelHeader title="Fault Detail" subtitle={selectedFault.receiptNo} />
        <dl className="detail-list">
          <DetailItem label="차량 번호" value={selectedFault.vehicleNo} />
          <DetailItem label="고장명" value={selectedFault.faultName} />
          <DetailItem label="접수자" value={selectedFault.customer} />
          <DetailItem label="접수 번호" value={selectedFault.receiptNo} />
          <DetailItem label="담당자" value={selectedFault.manager} />
          <DetailItem label="담당자 연락처" value={selectedFault.managerPhone} />
          <DetailItem label="출동 차량" value={selectedFault.dispatchVehicle} />
          <DetailItem label="배정 시각" value={selectedFault.assignedAt} />
          <DetailItem label="완료 시각" value={selectedFault.endedAt} />
          {selectedFault.managerTodayCount != null && (
            <DetailItem label="담당자 금일 건수" value={`${selectedFault.managerTodayCount}건`} />
          )}
        </dl>
      </section>

      <section className="panel action-panel">
        <PanelHeader title="Action Status" subtitle={selectedFault.faultText || 'field response checklist'} />
        {/* 260808 silee - DB에 조치 문구가 있으면 그대로, 없으면 기본 확인 항목을 표시합니다. */}
        <ol className="action-list">
          {selectedFault.actions.map((action, index) => (
            <li key={`${index}-${action}`}>
              <span>{index + 1}</span>
              {action}
            </li>
          ))}
        </ol>
      </section>

      <section className="panel event-panel">
        <PanelHeader title="Signal Log" subtitle="refresh trace" />
        <div className="event-list">
          {signalEvents.length === 0 && <div className="empty-detail">아직 갱신 로그가 없습니다.</div>}
          {signalEvents.map((event, index) => (
            <div className="event-item" key={`${event.time}-${event.type}-${index}`}>
              <span>{event.time}</span>
              <strong>{event.type}</strong>
              <small>{event.message}</small>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}

/**
 * 260808 silee - 고장 상세 항목 표시 함수
 */
function DetailItem({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || '-'}</dd>
    </div>
  )
}
