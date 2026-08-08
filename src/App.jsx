import { useCallback, useEffect, useState } from 'react'
import { ToastViewport } from './components/dashboard/common/ToastViewport'
import { SearchPage } from './pages/search/SearchPage'
import './App.css'

/**
 * 260808 silee - FaultMon 화면 루트 컴포넌트
 */
function App() {
  const [activeView, setActiveView] = useState(getViewFromPath)
  const [toasts, setToasts] = useState([])
  const [notificationLogs, setNotificationLogs] = useState([])
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true)

  useEffect(() => {
    /** 260808 silee - 브라우저 뒤로가기 화면 동기화 함수 */
    const handlePopState = () => {
      setActiveView(getViewFromPath())
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const dismissToast = useCallback((toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId))
  }, [])

  const pushToast = useCallback(({ title, message, type = 'default' }) => {
    // 260808 silee - 같은 위치에 알림이 계속 쌓이지 않도록 최근 3개만 유지합니다.
    const toast = {
      id: Date.now(),
      createdAt: new Date().toLocaleTimeString('ko-KR', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      title,
      message,
      type,
    }

    setNotificationLogs((current) => [toast, ...current].slice(0, 1000))

    if (isNotificationEnabled) {
      setToasts((current) => [toast, ...current].slice(0, 3))

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id))
      }, 4800)
    }
  }, [isNotificationEnabled])

  const changeView = useCallback((nextView) => {
    // 260808 silee - Home/Search 탭을 실제 URL로 남겨 F5 후에도 위치를 유지합니다.
    const nextPath = nextView === 'search' ? '/search' : '/'

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }

    setActiveView(nextView)
  }, [])

  return (
    <main className="dashboard-shell">
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      <SearchPage
        activeView={activeView}
        isNotificationEnabled={isNotificationEnabled}
        notificationLogs={notificationLogs}
        onNotificationToggle={() => setIsNotificationEnabled((current) => !current)}
        onNotify={pushToast}
        onViewChange={changeView}
      />
    </main>
  )
}

/**
 * 260808 silee - 현재 URL 기준 FaultMon 화면 선택 함수
 */
function getViewFromPath() {
  return window.location.pathname.toLowerCase().startsWith('/search') ? 'search' : 'home'
}

export default App
