import { useCallback, useState } from 'react'
import { ToastViewport } from './components/dashboard/common/ToastViewport'
import { SearchPage } from './pages/search/SearchPage'
import './App.css'

/**
 * 260808 silee - FaultMon 화면 루트 컴포넌트
 */
function App() {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId))
  }, [])

  const pushToast = useCallback(({ title, message, type = 'default' }) => {
    // 260808 silee - 같은 위치에 알림이 계속 쌓이지 않도록 최근 3개만 유지합니다.
    const toast = {
      id: Date.now(),
      title,
      message,
      type,
    }

    setToasts((current) => [toast, ...current].slice(0, 3))

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id))
    }, 4800)
  }, [])

  return (
    <main className="dashboard-shell">
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      <SearchPage onNotify={pushToast} />
    </main>
  )
}

export default App
