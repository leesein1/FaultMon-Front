import { useState } from 'react'

/**
 * 260808 silee - 상단 메뉴와 연결 상태 표시 함수
 */
export function ShellHeader({
  activeView,
  onViewChange,
  signalStatus,
  signalUserCount,
  lastSyncTime,
  notificationLogs = [],
  isNotificationEnabled,
  onNotificationToggle,
}) {
  const [isLogOpen, setIsLogOpen] = useState(false)
  const statusText = getStatusText(signalStatus)

  return (
    <header className="shell-header">
      <nav className="shell-nav" aria-label="FaultMon 화면 메뉴">
        <button
          className={activeView === 'home' ? 'active' : ''}
          type="button"
          onClick={() => onViewChange('home')}
        >
          Home
        </button>
        <button
          className={activeView === 'search' ? 'active' : ''}
          type="button"
          onClick={() => onViewChange('search')}
        >
          Search
        </button>
      </nav>

      <div className="header-controls" aria-label="system status">
        <span className={`connection-chip ${signalStatus}`}>
          <i></i>
          {statusText}
        </span>
        <span>Connections {signalUserCount}</span>
        <span>Last sync {lastSyncTime || '-'}</span>
        <span>ServiceBroker</span>
        <button
          className={`notification-enable-toggle ${isNotificationEnabled ? 'on' : 'off'}`}
          type="button"
          aria-pressed={isNotificationEnabled}
          onClick={onNotificationToggle}
        >
          Alarm {isNotificationEnabled ? 'ON' : 'OFF'}
        </button>
        <div className="notification-log-shell">
          <button
            className={`notification-log-toggle ${isLogOpen ? 'open' : ''}`}
            type="button"
            aria-label={`알림 로그 ${notificationLogs.length}건`}
            aria-expanded={isLogOpen}
            onClick={() => setIsLogOpen((current) => !current)}
          >
            <BellAlertIcon />
            <span>{notificationLogs.length}</span>
          </button>
          {isLogOpen && (
            <section className="notification-log-panel" aria-label="fault notification log">
              <header>
                <strong>Alert Log</strong>
                <span>{notificationLogs.length}/1000</span>
              </header>
              <div className="notification-log-list">
                {notificationLogs.length === 0 && (
                  <div className="notification-log-empty">아직 알림 로그가 없습니다.</div>
                )}
                {notificationLogs.map((log) => (
                  <article className={`notification-log-item ${log.type ?? 'default'}`} key={log.id}>
                    <span>{log.createdAt}</span>
                    <strong>{log.title}</strong>
                    <small>{log.message}</small>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </header>
  )
}

/**
 * 260808 silee - 무료 MIT Heroicons bell-alert SVG 표시 함수
 */
function BellAlertIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a3 3 0 0 1-5.714 0M12 6.75v3.75m0 3h.008v.008H12V13.5Z"
      />
    </svg>
  )
}

/**
 * 260808 silee - SignalR 상태 문구 변환 함수
 */
function getStatusText(status) {
  if (status === 'connected') {
    return 'SignalR Connected'
  }

  if (status === 'reconnecting') {
    return 'SignalR Reconnecting'
  }

  if (status === 'connecting') {
    return 'SignalR Connecting'
  }

  return 'SignalR Disconnected'
}
