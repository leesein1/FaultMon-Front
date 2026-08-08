/**
 * 260808 silee - 상단 연결 상태 표시 함수
 */
export function ShellHeader() {
  return (
    <header className="shell-header">
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
