/**
 * 260808 silee - 우측 상단 알림 표시 함수
 */
export function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-label="realtime notifications">
      {toasts.map((toast) => (
        <article className={`noti-toast ${toast.type ?? 'default'}`} key={toast.id}>
          <button type="button" aria-label="알림 닫기" onClick={() => onDismiss(toast.id)}>
            ×
          </button>
          <strong>{toast.title}</strong>
          <span>{toast.message}</span>
        </article>
      ))}
    </div>
  )
}
