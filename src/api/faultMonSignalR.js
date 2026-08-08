import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const SIGNALR_HUB_URL = import.meta.env.VITE_SIGNALR_HUB_URL || `${API_BASE_URL}/hubs/faultmon`

/**
 * 260808 silee - FaultMon SignalR 연결 생성 함수
 */
export function createFaultMonConnection() {
  return new HubConnectionBuilder()
    .withUrl(SIGNALR_HUB_URL || '/hubs/faultmon')
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(LogLevel.Information)
    .build()
}
