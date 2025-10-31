let kakaoLoaded = false;

export async function loadKakaoMaps(appKey?: string): Promise<typeof window & { kakao: any }> {
  if (typeof window === 'undefined') throw new Error('Window is undefined');
  const w = window as any;
  if (w.kakao?.maps && kakaoLoaded) return w;

  if (!appKey) {
    appKey = (import.meta as any).env?.VITE_KAKAO_APP_KEY;
  }
  if (!appKey) {
    const errorMsg = 'VITE_KAKAO_APP_KEY is not set. Please set the environment variable in your deployment platform (e.g., Vercel, Netlify) or .env file for local development.';
    console.error('❌ [Kakao SDK]', errorMsg);
    throw new Error(errorMsg);
  }

  // 이미 로딩 중인 스크립트가 있으면 대기
  const existing = document.querySelector('script[data-kakao-maps="true"]') as HTMLScriptElement | null;
  if (!existing) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.setAttribute('data-kakao-maps', 'true');
      script.async = true;
      script.defer = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
      script.onload = () => {
        console.log('✅ [Kakao SDK] 스크립트 로드 완료');
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Kakao Maps SDK'));
      document.head.appendChild(script);
    });
  } else {
    // 이미 스크립트가 로드되어 있는 경우, 로드 완료 대기
    await new Promise<void>((resolve) => {
      if (existing.complete) {
        resolve();
      } else {
        existing.onload = () => resolve();
      }
    });
  }

  // kakao 객체가 사용 가능할 때까지 대기
  let retries = 0;
  const maxRetries = 50; // 최대 5초
  while (!(window as any).kakao && retries < maxRetries) {
    await new Promise(resolve => setTimeout(resolve, 100));
    retries++;
  }

  const w2 = window as any;
  if (!w2.kakao) {
    throw new Error('Kakao SDK 객체를 찾을 수 없습니다');
  }

  // kakao.maps.load() 호출 (autoload=false이므로 수동 호출 필요)
  if (!w2.kakao.maps) {
    throw new Error('Kakao Maps SDK를 찾을 수 없습니다');
  }

  await new Promise<void>((resolve, reject) => {
    try {
      if (w2.kakao.maps.load) {
        w2.kakao.maps.load(() => {
          console.log('✅ [Kakao SDK] kakao.maps.load() 완료');
          resolve();
        });
      } else {
        // 이미 로드된 경우
        resolve();
      }
    } catch (e) {
      reject(new Error('Kakao maps load failed: ' + (e as Error).message));
    }
  });

  // services 라이브러리가 로드되었는지 확인 (최대 5초 대기)
  retries = 0;
  while (!w2.kakao?.maps?.services && retries < maxRetries) {
    await new Promise(resolve => setTimeout(resolve, 100));
    retries++;
  }

  if (!w2.kakao?.maps?.services) {
    console.error('❌ [Kakao SDK] services 라이브러리를 찾을 수 없습니다');
    console.error('Kakao 객체:', w2.kakao);
    console.error('Kakao maps:', w2.kakao?.maps);
    throw new Error('Kakao Maps services library failed to load');
  }

  console.log('✅ [Kakao SDK] services 라이브러리 로드 완료');
  kakaoLoaded = true;
  return window as any;
}
