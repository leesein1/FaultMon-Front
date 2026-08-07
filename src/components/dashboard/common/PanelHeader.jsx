// 패널 제목과 보조 설명을 일관된 형태로 표시하는 공통 헤더 컴포넌트입니다.
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
