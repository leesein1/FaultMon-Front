/**
 * 260808 silee - FaultMon 알림 데이터 생성 함수
 */
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
