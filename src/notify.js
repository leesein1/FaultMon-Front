/**
 * 260808 silee - FaultMon 알림 데이터 생성 함수
 */
export function createNotification(fault) {
  const time = fault.occurredAt && fault.occurredAt !== '-' ? fault.occurredAt : formatTime(new Date())

  return {
    id: Date.now(),
    title: `[접수번호 : ${fault.receiptNo}] - [${fault.faultName}]- [${time}]`,
    message: `${fault.vehicleNo || '-'} / ${fault.location || '-'} / ${fault.faultText || fault.statusText}`,
    type: 'danger',
  }
}

/**
 * 260808 silee - FaultMon 알림 중복 비교 키 생성 함수
 */
export function createNotificationKey(fault) {
  if (!fault) {
    return ''
  }

  return [fault.receiptNo, fault.faultName, fault.occurredAt].join('|')
}

/**
 * 260808 silee - 알림 시간 표시 함수
 */
function formatTime(value) {
  return value.toLocaleTimeString('ko-KR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
