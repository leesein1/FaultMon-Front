// 우측 영역의 선택 고장 상세, 현장 조치 상태, SignalR 이벤트 로그를 담당하는 컴포넌트입니다.
import { PanelHeader } from '../common/PanelHeader'

export function RightRail({ selectedFault, signalEvents }) {
  return (
    <aside className="right-rail">
      <section className="panel detail-panel">
        <PanelHeader title="Fault Detail" subtitle={selectedFault.receiptNo} />
        <dl className="detail-list">
          <DetailItem label="장비명" value={selectedFault.equipment} />
          <DetailItem label="고장명" value={selectedFault.faultName} />
          <DetailItem label="접수자" value={selectedFault.customer} />
          <DetailItem label="사고 차량" value={selectedFault.vehicleNo} />
          <DetailItem label="담당자" value={selectedFault.manager} />
          <DetailItem label="출동 차량" value={selectedFault.dispatchVehicle} />
        </dl>
      </section>

      <section className="panel action-panel">
        <PanelHeader title="Action Status" subtitle="field response checklist" />
        <ol className="action-list">
          {selectedFault.actions.map((action, index) => (
            <li key={action}>
              <span>{index + 1}</span>
              {action}
            </li>
          ))}
        </ol>
      </section>

      <section className="panel event-panel">
        <PanelHeader title="Signal Log" subtitle="live refresh trace" />
        <div className="event-list">
          {signalEvents.map((event) => (
            <div className="event-item" key={`${event.time}-${event.message}`}>
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

function DetailItem({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
