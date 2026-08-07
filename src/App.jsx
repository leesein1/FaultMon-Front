// FaultMon 프론트엔드의 앱 루트로, 전역 실시간 알림과 현재 페이지를 조립하는 파일입니다.
import { useEffect, useState } from 'react'
import { ToastViewport } from './components/dashboard/common/ToastViewport'
import { faults } from './data/faultData'
import { createNotification } from './notify'
import { SearchPage } from './pages/search/SearchPage'
import './App.css'

function App() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const pushToast = () => {
      const target = faults[Math.floor(Math.random() * faults.length)]
      const toast = createNotification(target)

      setToasts((current) => [toast, ...current].slice(0, 3))

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id))
      }, 4800)
    }

    pushToast()
    const timer = window.setInterval(pushToast, 5000)

    return () => window.clearInterval(timer)
  }, [])

  const dismissToast = (toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId))
  }

  return (
    <main className="dashboard-shell">
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      <SearchPage />
    </main>
  )
}

export default App
