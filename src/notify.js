// 원본 FaultMon의 notify(title, message) 역할을 React toast 데이터로 변환하는 파일입니다.
export function createNotification(fault) {
  const now = new Date()
  const time = now.toLocaleTimeString('ko-KR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return {
    id: now.getTime(),
    title: `[${time}] - ${fault.receiptNo}`,
    message: fault.faultName,
  }
}
