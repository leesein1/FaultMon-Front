import { useEffect, useMemo, useRef, useState } from 'react'
import { loadKakaoMap } from '../../../api/kakaoMapLoader'
import { PanelHeader } from '../common/PanelHeader'

const defaultCenter = {
  lat: 36.3,
  lng: 127.5,
}

const selectedZoomLevel = 3

/**
 * 260808 silee - FaultMon 카카오맵 표시 함수
 */
export function CoordinateMap({ faults, selectedFault, selectedId, onSelectFault }) {
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const markerRefs = useRef([])
  const selectedOverlayRef = useRef(null)
  const boundsRef = useRef(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [mapError, setMapError] = useState('')

  const validFaults = useMemo(
    // 260808 silee - GPS 값이 없는 건은 지도에 찍지 않고 목록/상세에서는 그대로 보여줍니다.
    () =>
      faults.filter(
        (fault) =>
          Number.isFinite(fault.latitude) &&
          Number.isFinite(fault.longitude),
      ),
    [faults],
  )

  useEffect(() => {
    // 260808 silee - SDK 로딩과 지도 객체 생성은 최초 1회만 처리합니다.
    let isCancelled = false

    loadKakaoMap()
      .then((maps) => {
        if (isCancelled || !mapElementRef.current || mapRef.current) {
          return
        }

        mapRef.current = new maps.Map(mapElementRef.current, {
          center: new maps.LatLng(defaultCenter.lat, defaultCenter.lng),
          level: 12,
        })
        mapRef.current.relayout()
        setIsMapReady(true)
      })
      .catch((error) => {
        if (!isCancelled) {
          setMapError(error.message)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    // 260808 silee - 목록이 바뀌면 마커를 다시 만들고, 선택 중이 아닐 때만 전체 영역을 맞춥니다.
    if (!isMapReady || !mapRef.current || !window.kakao?.maps) {
      return
    }

    const maps = window.kakao.maps
    markerRefs.current.forEach((marker) => marker.setMap(null))
    markerRefs.current = []

    if (validFaults.length === 0) {
      boundsRef.current = null
      mapRef.current.setCenter(new maps.LatLng(defaultCenter.lat, defaultCenter.lng))
      mapRef.current.setLevel(12)
      return
    }

    const bounds = new maps.LatLngBounds()

    validFaults.forEach((fault) => {
      const position = new maps.LatLng(fault.latitude, fault.longitude)
      const markerElement = document.createElement('button')
      markerElement.type = 'button'
      markerElement.className = `kakao-fault-marker ${fault.status} ${fault.id === selectedId ? 'active' : ''}`
      markerElement.setAttribute('aria-label', `${fault.vehicleNo} ${fault.statusText}`)
      markerElement.addEventListener('click', () => onSelectFault(fault.id))

      const marker = new maps.CustomOverlay({
        position,
        yAnchor: 1,
        content: markerElement,
      })

      marker.setMap(mapRef.current)
      markerRefs.current.push(marker)
      bounds.extend(position)
    })

    boundsRef.current = bounds

    if (selectedId != null) {
      return
    }

    if (validFaults.length === 1) {
      mapRef.current.setCenter(new maps.LatLng(validFaults[0].latitude, validFaults[0].longitude))
      mapRef.current.setLevel(4)
    } else {
      mapRef.current.setBounds(bounds)
    }
  }, [isMapReady, onSelectFault, selectedId, validFaults])

  useEffect(() => {
    // 260808 silee - 선택된 고장 건은 카드 오버레이를 띄우고 해당 위치로 확대합니다.
    if (
      !mapRef.current ||
      !isMapReady ||
      !window.kakao?.maps ||
      !Number.isFinite(selectedFault?.latitude) ||
      !Number.isFinite(selectedFault?.longitude)
    ) {
      if (selectedOverlayRef.current) {
        selectedOverlayRef.current.setMap(null)
        selectedOverlayRef.current = null
      }
      return
    }

    const maps = window.kakao.maps
    const position = new maps.LatLng(selectedFault.latitude, selectedFault.longitude)

    if (selectedOverlayRef.current) {
      selectedOverlayRef.current.setMap(null)
    }

    selectedOverlayRef.current = new maps.CustomOverlay({
      position,
      xAnchor: 0.5,
      yAnchor: 1.18,
      content: `
        <div class="kakao-fault-card">
          <span class="state ${selectedFault.status}">${escapeHtml(selectedFault.statusText)}</span>
          <strong>${escapeHtml(selectedFault.vehicleNo)}</strong>
          <small>${escapeHtml(selectedFault.faultName)}</small>
          <em>${escapeHtml(selectedFault.location)}</em>
        </div>
      `,
    })

    selectedOverlayRef.current.setMap(mapRef.current)
    mapRef.current.setLevel(selectedZoomLevel, { animate: true })
    mapRef.current.panTo(position)
  }, [isMapReady, selectedFault])

  useEffect(() => {
    // 260808 silee - 선택을 해제하면 현재 표시 중인 마커들이 보이도록 전체 보기로 되돌립니다.
    if (!isMapReady || !mapRef.current || selectedFault) {
      return
    }

    if (boundsRef.current && validFaults.length > 1) {
      mapRef.current.setBounds(boundsRef.current)
      return
    }

    if (validFaults.length === 1) {
      mapRef.current.setCenter(new window.kakao.maps.LatLng(validFaults[0].latitude, validFaults[0].longitude))
      mapRef.current.setLevel(8)
      return
    }

    mapRef.current.setCenter(new window.kakao.maps.LatLng(defaultCenter.lat, defaultCenter.lng))
    mapRef.current.setLevel(12)
  }, [isMapReady, selectedFault, validFaults])

  return (
    <section className="panel map-panel">
      <PanelHeader title="Kakao Map" subtitle="GPS_Lati / GPS_Long live markers" />
      <div className="map-surface">
        <div className="kakao-map-canvas" ref={mapElementRef}></div>
        {mapError && (
          <div className="map-message">
            카카오맵을 불러오지 못했습니다.
            <small>{mapError}</small>
          </div>
        )}
        {!mapError && validFaults.length === 0 && (
          <div className="map-message">표시할 GPS 좌표가 없습니다.</div>
        )}
      </div>
    </section>
  )
}

/**
 * 260808 silee - 지도 오버레이 HTML 문자 치환 함수
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
