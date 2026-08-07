// 로고 없이 화면명, SignalR 연결 상태, 동기화 정보를 표현하는 상단 헤더 컴포넌트입니다.
export function ShellHeader() {
  return (
    <header className="shell-header">
      <div>
        <p className="meta-label">Realtime Signal Monitor</p>
        <h1>FaultMon Operations</h1>
      </div>
      <div className="header-controls" aria-label="system status">
        <span className="connection-chip">
          <i></i>
          SignalR Connected
        </span>
        <span>Last sync 15:42:20</span>
        <span>ServiceBroker</span>
      </div>
    </header>
  )
}
