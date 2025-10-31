let kakaoLoaded = false;

export async function loadKakaoMaps(appKey?: string): Promise<typeof window & { kakao: any }> {
  if (typeof window === 'undefined') throw new Error('Window is undefined');
  const w = window as any;
  if (w.kakao?.maps && kakaoLoaded) return w;

  if (!appKey) {
    appKey = (import.meta as any).env?.VITE_KAKAO_APP_KEY;
  }
  if (!appKey) throw new Error('VITE_KAKAO_APP_KEY is not set');

  // 이미 로딩 중인 스크립트가 있으면 대기
  const existing = document.querySelector('script[data-kakao-maps="true"]') as HTMLScriptElement | null;
  if (!existing) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.setAttribute('data-kakao-maps', 'true');
      script.async = true;
      script.defer = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Kakao Maps SDK'));
      document.head.appendChild(script);
    });
  }

  await new Promise<void>((resolve, reject) => {
    const w2 = window as any;
    if (!w2.kakao || !w2.kakao.maps) {
      // @ts-ignore
      (window as any).kakao?.maps?.load ? w2.kakao.maps.load(resolve) : setTimeout(() => {
        try {
          w2.kakao.maps.load(resolve);
        } catch (e) {
          reject(new Error('Kakao maps load failed'));
        }
      }, 0);
    } else {
      resolve();
    }
  });

  kakaoLoaded = true;
  return window as any;
}
