/**
 * 260808 silee - 패널 제목 표시 공통 함수
 */
export function PanelHeader({ title, subtitle }) {
  return (
    <header className="panel-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </header>
  )
}
