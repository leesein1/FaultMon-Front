const KAKAO_MAP_SCRIPT_ID = 'kakao-map-sdk'

let kakaoMapPromise

/**
 * 260808 silee - 카카오맵 SDK 로딩 함수
 */
export function loadKakaoMap() {
  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao.maps)
  }

  if (kakaoMapPromise) {
    return kakaoMapPromise
  }

  const appKey = import.meta.env.VITE_KAKAO_MAP_JS_KEY

  if (!appKey) {
    // 260808 silee - 키가 빠지면 지도 영역에서 바로 원인을 볼 수 있게 에러를 올립니다.
    return Promise.reject(new Error('VITE_KAKAO_MAP_JS_KEY is not configured.'))
  }

  kakaoMapPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID)

    if (existingScript) {
      existingScript.addEventListener('load', () => window.kakao.maps.load(() => resolve(window.kakao.maps)))
      existingScript.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.id = KAKAO_MAP_SCRIPT_ID
    script.async = true
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao.maps))
    script.onerror = () => reject(new Error('Failed to load Kakao Maps SDK.'))

    document.head.appendChild(script)
  })

  return kakaoMapPromise
}
