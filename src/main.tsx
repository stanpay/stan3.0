import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

// 🚀 Toss Payments SDK 사전 로딩 (앱 시작 시)
const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
if (clientKey) {
  console.log('⚡ Toss Payments SDK 사전 로딩 시작');
  const preloadStart = performance.now();
  
  loadTossPayments(clientKey)
    .then(() => {
      const preloadTime = Math.round(performance.now() - preloadStart);
      console.log(`✅ Toss Payments SDK 사전 로딩 완료 (${preloadTime}ms)`);
    })
    .catch((error) => {
      console.error('⚠️ Toss Payments SDK 사전 로딩 실패:', error);
    });
}

// 개발 환경에서 위치 모킹
if (import.meta.env.DEV) {
  // 서울 강남구 역삼동 좌표 (기본값)
  const MOCK_LATITUDE = 37.5010;
  const MOCK_LONGITUDE = 127.0374;
  const MOCK_ACCURACY = 10; // 미터 단위

  const originalGeolocation = navigator.geolocation;

  // getCurrentPosition 모킹
  navigator.geolocation.getCurrentPosition = function(
    success: PositionCallback,
    error?: PositionErrorCallback,
    options?: PositionOptions
  ) {
    console.log("📍 [개발 모드] 위치 모킹 활성화 - 서울 강남구 역삼동");
    
    // 약간의 지연을 추가하여 실제 API처럼 동작
    setTimeout(() => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: MOCK_LATITUDE,
          longitude: MOCK_LONGITUDE,
          accuracy: MOCK_ACCURACY,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };
      
      success(mockPosition);
    }, 100);
  };

  // watchPosition 모킹
  navigator.geolocation.watchPosition = function(
    success: PositionCallback,
    error?: PositionErrorCallback,
    options?: PositionOptions
  ) {
    console.log("📍 [개발 모드] 위치 모킹 활성화 (watchPosition) - 서울 강남구 역삼동");
    
    const mockPosition: GeolocationPosition = {
      coords: {
        latitude: MOCK_LATITUDE,
        longitude: MOCK_LONGITUDE,
        accuracy: MOCK_ACCURACY,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    };
    
    setTimeout(() => {
      success(mockPosition);
    }, 100);
    
    // watchPosition은 watchID를 반환해야 함
    return 1;
  };

  // clearWatch 모킹
  navigator.geolocation.clearWatch = function(watchId: number) {
    console.log("📍 [개발 모드] 위치 모킹 clearWatch");
  };
}

createRoot(document.getElementById("root")!).render(<App />);
