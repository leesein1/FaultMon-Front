// 실시간 고장 알림 toast를 화면 우측 상단에 표시하는 컴포넌트입니다.
export function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="toast-viewport" aria-live="polite" aria-label="realtime notifications">
      {toasts.map((toast) => (
        <article className="noti-toast" key={toast.id}>
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
