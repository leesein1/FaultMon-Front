// 중앙 영역의 muted dark 지도와 좌표 dot/ping 마커를 담당하는 컴포넌트입니다.
import { PanelHeader } from '../common/PanelHeader'

export function CoordinateMap({ faults, selectedFault, selectedId, onSelectFault }) {
  return (
    <section className="panel map-panel">
      <PanelHeader title="Coordinate Layer" subtitle="dark muted equipment coordinates" />
      <div className="map-surface">
        <div className="map-noise"></div>
        <div className="map-line line-a"></div>
        <div className="map-line line-b"></div>
        {faults.map((fault) => (
          <button
            className={`coordinate-dot ${fault.severity} ${fault.id === selectedId ? 'active' : ''}`}
            key={fault.id}
            style={{ left: `${fault.mapX}%`, top: `${fault.mapY}%` }}
            type="button"
            onClick={() => onSelectFault(fault.id)}
            aria-label={`${fault.equipment} coordinate`}
          >
            <span></span>
          </button>
        ))}
        {selectedFault && (
          <div className="coordinate-card">
            <span className={`severity ${selectedFault.severity}`}>{selectedFault.severityText}</span>
            <strong>{selectedFault.equipment}</strong>
            <small>{selectedFault.location}</small>
          </div>
        )}
      </div>
    </section>
  )
}
