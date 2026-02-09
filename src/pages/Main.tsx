import { MapPin, ArrowUpDown, Search, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoreCard from "@/components/StoreCard";
import BottomNav from "@/components/BottomNav";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import TutorialModal from "@/components/TutorialModal";
import FirstPurchaseBanner from "@/components/FirstPurchaseBanner";
import { shouldShowTutorial } from "@/lib/tutorial";

const Main = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"distance" | "discount">("distance");
  const [currentLocation, setCurrentLocation] = useState("위치 가져오는 중...");
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isManualLocation, setIsManualLocation] = useState(false);

  interface StoreData {
    id: string;
    name: string;
    distance: string;
    distanceNum: number;
    image: string;
    maxDiscount: string | null; // 할인율이 없으면 null
    discountNum: number; // 정렬용 할인율 (0-100)
    maxDiscountPercent: number | null; // 최대 할인율 (%)
    lat?: number;
    lon?: number;
    address?: string;
    local_currency_available?: boolean; // 지역화폐 사용가능 여부
    local_currency_discount_rate?: number | null; // 지역화폐 할인율
    parking_available?: boolean; // 주차가능 여부
    free_parking?: boolean; // 무료주차 여부
    parking_size?: string | null; // 주차장 규모 ('넓음', '보통', '좁음')
  }

  const [stores, setStores] = useState<StoreData[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [isLoadingMoreStores, setIsLoadingMoreStores] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{latitude: number, longitude: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [hasPaymentHistory, setHasPaymentHistory] = useState<boolean | null>(null);

  const getAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      console.log("🏠 [주소 변환] 시작:", { latitude, longitude });
      
      // Kakao Maps SDK 로드 보장
      const { loadKakaoMaps } = await import("@/lib/kakao");
      await loadKakaoMaps();
      
      const kakao = (window as any).kakao;
      if (!kakao?.maps?.services) {
        console.error("❌ [주소 변환] Kakao Maps services를 찾을 수 없습니다");
        return "위치를 확인할 수 없음";
      }

      // Geocoder 서비스 사용 (JavaScript 키로 가능)
      const geocoder = new kakao.maps.services.Geocoder();
      
      return new Promise<string>((resolve) => {
        // 10초 타임아웃 설정
        const timeoutId = setTimeout(() => {
          console.error("⏱️ [주소 변환] Timeout - Geocoder 응답이 10초 내에 오지 않음");
          resolve("위치를 확인할 수 없음");
        }, 10000);
        
        const coord = new kakao.maps.LatLng(latitude, longitude);
        const callback = (result: any, status: any) => {
          clearTimeout(timeoutId); // 타임아웃 해제
          
          if (status === kakao.maps.services.Status.OK) {
            console.log("✅ [주소 변환] Kakao Geocoder 응답:", result);
            
            if (result.length > 0) {
              // 지번 주소 우선, 없으면 도로명 주소 사용
              const address = result[0].address || result[0].road_address;
              
              if (address) {
                console.log("주소 데이터:", address);
                
                // 시/군 단위 추출 (예: 제주시, 서울특별시 -> 서울시)
                let cityName = "";
                
                // region_2depth_name에 시/군/구 정보가 있음 (예: 제주시, 강남구)
                if (address.region_2depth_name) {
                  cityName = address.region_2depth_name;
                  
                  // 서울특별시, 부산광역시 같은 경우 region_1depth_name 사용
                  if (address.region_1depth_name && 
                      (address.region_1depth_name.includes('특별시') || 
                       address.region_1depth_name.includes('광역시'))) {
                    // 서울특별시 -> 서울시, 부산광역시 -> 부산시
                    cityName = address.region_1depth_name
                      .replace(/특별시$/, '시')
                      .replace(/광역시$/, '시');
                  }
                } else if (address.region_1depth_name) {
                  // region_2depth_name이 없는 경우 (특별자치도 등)
                  cityName = address.region_1depth_name
                    .replace(/특별자치도$/, '')
                    .replace(/도$/, '')
                    .replace(/특별시$/, '시')
                    .replace(/광역시$/, '시');
                }
                
                // 동/읍/면 단위 추출 (예: 연동)
                let districtName = "";
                if (address.region_3depth_name) {
                  districtName = address.region_3depth_name;
                } else if (address.region_3depth_h_name) {
                  // 행정동이 있는 경우
                  districtName = address.region_3depth_h_name;
                }
                
                // 결과 조합: "제주시 연동" 형식 (시/동 또는 읍/면까지)
                if (cityName && districtName) {
                  const formattedAddress = `${cityName} ${districtName}`;
                  console.log("✅ [주소 변환] 최종 주소:", formattedAddress);
                  resolve(formattedAddress);
                  return;
                } else if (cityName) {
                  console.log("✅ [주소 변환] 최종 주소:", cityName);
                  resolve(cityName);
                  return;
                }
              }
            }
          } else {
            console.error("❌ [주소 변환] Geocoder 상태:", status);
          }
          
          resolve("위치를 확인할 수 없음");
        };
        
        try {
          geocoder.coord2Address(coord.getLng(), coord.getLat(), callback);
        } catch (error) {
          clearTimeout(timeoutId);
          console.error("❌ [주소 변환] coord2Address 호출 실패:", error);
          resolve("위치를 확인할 수 없음");
        }
      });
    } catch (error) {
      console.error("❌ [주소 변환] 실패:", error);
      return "위치를 확인할 수 없음";
    }
  };

  useEffect(() => {
    // 이전 로그인 상태를 추적하기 위한 ref 사용
    const prevSessionRef = { current: null as any };
    
    const checkAuthAndInitLocation = async () => {
      console.log("🔐 [인증 확인] 시작");
      
      // 로그인 상태 확인
      const { data: { session } } = await supabase.auth.getSession();
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);
      console.log(`🔐 [인증 상태] ${loggedIn ? '로그인됨' : '로그인 안됨'}`);
      
      // 초기 세션 상태를 ref에 저장 (onAuthStateChange에서 사용)
      prevSessionRef.current = session;
      
      // 튜토리얼 모달 표시 여부 확인 (로그인된 경우에만, 결제 이력 없고 완료 안 한 경우)
      if (session) {
        try {
          const { data: paymentHistory, error: paymentError } = await supabase
            .from('payment_history')
            .select('id')
            .eq('user_id', session.user.id)
            .limit(1);

          const paymentHistoryExists = !paymentError && paymentHistory && paymentHistory.length > 0;
          setHasPaymentHistory(paymentHistoryExists);
          const needTutorial = await shouldShowTutorial(paymentHistoryExists);
          if (needTutorial) {
            setShowTutorialModal(true);
          }
        } catch (error) {
          console.error("튜토리얼 모달 표시 판단 실패:", error);
        }
      } else {
        setHasPaymentHistory(false);
      }

      // 최근 위치 조회 시간 확인 (5분 이내면 재조회 하지 않음)
      const lastLocationFetchTime = localStorage.getItem("lastLocationFetchTime");
      const now = Date.now();
      const LOCATION_CACHE_DURATION = 5 * 60 * 1000; // 5분
      
      console.log("🔍 [위치 캐시 확인] 시작");
      console.log("📍 [위치 캐시] lastLocationFetchTime:", lastLocationFetchTime, "(타입:", typeof lastLocationFetchTime, ")");
      console.log("📍 [위치 캐시] 현재 시간:", now);
      
      // localStorage 전체 상태 확인
      console.log("🔍 [localStorage 전체 상태]:", Object.keys(localStorage).filter(key => key.includes('location') || key.includes('Location')).reduce((obj, key) => {
        obj[key] = localStorage.getItem(key);
        return obj;
      }, {} as Record<string, string | null>));

      let cacheMissReason = "";
      let lastFetchTimestamp = 0;
      let timeSinceLastFetch = Number.POSITIVE_INFINITY;

      if (!lastLocationFetchTime) {
        cacheMissReason = "❌ 위치 조회 기록이 없음 (lastLocationFetchTime이 null/undefined)";
        console.log(cacheMissReason);
      } else {
        lastFetchTimestamp = parseInt(lastLocationFetchTime);
        if (isNaN(lastFetchTimestamp)) {
          cacheMissReason = "❌ 위치 조회 기록이 숫자가 아님 (parseInt 실패)";
          console.log(cacheMissReason);
        } else {
          timeSinceLastFetch = now - lastFetchTimestamp;
        const secondsSinceLastFetch = Math.floor(timeSinceLastFetch / 1000);
        const minutesSinceLastFetch = Math.floor(secondsSinceLastFetch / 60);
        
          console.log("⏱️ [위치 캐시] 마지막 위치 조회:", `${secondsSinceLastFetch}초 전 (${minutesSinceLastFetch}분 전)`);
        console.log("⏱️ [위치 캐시] 캐시 유효 기간:", LOCATION_CACHE_DURATION / 1000, "초");

          if (timeSinceLastFetch >= LOCATION_CACHE_DURATION) {
            cacheMissReason = `❌ 캐시 만료됨 (${timeSinceLastFetch / 1000}초 경과 > ${LOCATION_CACHE_DURATION / 1000}초)`;
            console.log(cacheMissReason);
          }
        }
      }

      const hasValidRecentCache = !!lastFetchTimestamp && timeSinceLastFetch < LOCATION_CACHE_DURATION;
      console.log("⏱️ [위치 캐시] 캐시 유효 여부:", hasValidRecentCache, hasValidRecentCache ? "✅ HIT" : "❌ MISS");

      if (hasValidRecentCache) {
        console.log("✅✅✅ [위치 캐시 HIT] 5분 이내 캐시 유효 - 저장된 위치 사용, 위치 조회 건너뜀 ✅✅✅");
        console.log("✅✅✅ [위치 캐시 HIT] 5분 이내 캐시 유효 - 저장된 위치 사용, 위치 조회 건너뜀 ✅✅✅");
          
          // 저장된 위치 정보 불러오기
          const savedCoordinates = localStorage.getItem("currentCoordinates");
          const savedLocation = localStorage.getItem("selectedLocation");
          const isManualLocationValue = localStorage.getItem("isManualLocation") === "true";
          
          console.log("📍 [위치 캐시] savedLocation:", savedLocation);
          console.log("📍 [위치 캐시] savedCoordinates:", savedCoordinates);
          
          setIsManualLocation(isManualLocationValue);
          setIsLoadingLocation(false);
          
          if (savedLocation) {
            setCurrentLocation(savedLocation);
          } else {
            setCurrentLocation("위치 불러올 수 없음");
          }
          
          if (savedCoordinates) {
            try {
              const coords = JSON.parse(savedCoordinates);
              const { latitude, longitude } = coords;
              if (typeof latitude === 'number' && typeof longitude === 'number' && 
                  !isNaN(latitude) && !isNaN(longitude) &&
                  latitude >= -90 && latitude <= 90 &&
                  longitude >= -180 && longitude <= 180) {
                setCurrentCoords({ latitude, longitude });
                
                // 저장된 매장 정보가 있으면 사용, 없으면 다시 조회
                const savedStores = localStorage.getItem('nearbyStores');
                if (savedStores) {
                  try {
                    const storesData = JSON.parse(savedStores);
                    setStores(storesData);
                    setIsLoadingStores(false);
                    console.log("✅ [위치 캐시] 저장된 매장 정보 사용");
                  } catch (e) {
                    console.log("⚠️ [위치 캐시] 저장된 매장 정보 파싱 실패, 다시 조회");
                    // 저장된 매장 정보가 없거나 파싱 실패 시 다시 조회
                    await fetchNearbyStores(latitude, longitude);
                  }
                } else {
                  console.log("⚠️ [위치 캐시] 저장된 매장 정보 없음, 다시 조회");
                  await fetchNearbyStores(latitude, longitude);
                }
              }
            } catch (error) {
              console.error("❌ [위치 캐시] 저장된 좌표 파싱 오류:", error);
            }
          }
          
          console.log("✅✅✅ [위치 캐시 완료] 위치 조회 완전히 건너뜀 - RETURN ✅✅✅");
          return; // 이미 위치를 조회했으므로 새로 조회하지 않음
        }

      if (cacheMissReason) {
        console.log("❌❌❌ [위치 캐시 MISS] 이유:", cacheMissReason, "- 위치 다시 조회 ❌❌❌");
      } else {
        console.log("❌❌❌ [위치 캐시 MISS] 알 수 없는 이유로 캐시 무효 - 위치 다시 조회 ❌❌❌");
      }
      
      console.log("🌍🌍🌍 [위치 조회 시작] 새로운 위치 정보 가져오기 🌍🌍🌍");

      // 로그인한 경우 실제 위치 가져오기
      console.log("🚀🚀🚀 [위치 초기화] 시작 - 위치 조회 🚀🚀🚀");
      
      // 위치 조회 시작 시간 기록
      const fetchTimestamp = Date.now();
      const timestampString = fetchTimestamp.toString();
      console.log("📝 [위치 타임스탬프 저장 전] localStorage 상태:", Object.keys(localStorage).filter(key => key.includes('location') || key.includes('Location')).reduce((obj, key) => {
        obj[key] = localStorage.getItem(key);
        return obj;
      }, {} as Record<string, string | null>));

      localStorage.setItem("lastLocationFetchTime", timestampString);
      console.log("✅ [위치 타임스탬프] 기록 완료:", fetchTimestamp, "(문자열:", timestampString, ")");

      const savedValue = localStorage.getItem("lastLocationFetchTime");
      console.log("✅ [위치 타임스탬프] localStorage에서 읽은 값:", savedValue, "(타입:", typeof savedValue, ")");
      console.log("✅ [위치 타임스탬프] 저장 값과 일치:", savedValue === timestampString ? "✅ 일치" : "❌ 불일치");

      console.log("📝 [위치 타임스탬프 저장 후] localStorage 상태:", Object.keys(localStorage).filter(key => key.includes('location') || key.includes('Location')).reduce((obj, key) => {
        obj[key] = localStorage.getItem(key);
        return obj;
      }, {} as Record<string, string | null>));
      
      // Kakao SDK 로드 보장
      try {
        const { loadKakaoMaps } = await import("@/lib/kakao");
        await loadKakaoMaps();
        console.log("✅ [Kakao SDK] 로드 완료");
      } catch (error: any) {
        console.error("❌ [위치 초기화] Kakao SDK 로드 실패:", error);
        setIsLoadingLocation(false);
        setCurrentLocation("위치 불러올 수 없음");
        localStorage.removeItem("selectedLocation");
        localStorage.removeItem("currentCoordinates");
        toast({
          title: "위치 기반 검색 불가",
          description: error.message || "카카오 SDK 설정 오류입니다. 배포 환경에 VITE_KAKAO_APP_KEY 환경 변수를 설정해주세요.",
          variant: "destructive",
        });
        setIsLoadingStores(false);
        setStores([]);
        return;
      }

      // Main 페이지 최초 접근 시 위치 정보 확인
      setIsLoadingLocation(true);

      // localStorage에 저장된 좌표 확인
      let savedCoordinates = localStorage.getItem("currentCoordinates");
      const savedLocation = localStorage.getItem("selectedLocation");
      const isManualLocationValue = localStorage.getItem("isManualLocation") === "true";
      setIsManualLocation(isManualLocationValue);

      // 사용자가 직접 설정한 위치가 있으면 그것을 사용 (현재 위치를 불러오지 않음)
      if (isManualLocationValue) {
        // savedLocation이 없는 경우 처리
        if (!savedLocation) {
          console.warn("⚠️ [위치 정보] 사용자 위치 설정 플래그는 있지만 저장된 위치가 없음");
          setCurrentLocation("위치 불러올 수 없음");
          setIsLoadingLocation(false);
          return; // 사용자 위치 설정이므로 현재 위치 가져오기 건너뛰기
        }
        // 좌표가 있으면 바로 사용
        if (savedCoordinates) {
          try {
            const coords = JSON.parse(savedCoordinates);
            const { latitude, longitude } = coords;
            
            // 좌표 유효성 검사
            if (typeof latitude === 'number' && typeof longitude === 'number' && 
                !isNaN(latitude) && !isNaN(longitude) &&
                latitude >= -90 && latitude <= 90 &&
                longitude >= -180 && longitude <= 180) {
              
              console.log("✅ [위치 정보] 직접 설정한 위치 사용:", { latitude, longitude, location: savedLocation });
              
              // 저장된 위치를 ~시 ~동 형식으로 변환하여 표시
              try {
                const formattedAddress = await getAddressFromCoords(latitude, longitude);
                setCurrentLocation(formattedAddress);
                localStorage.setItem("selectedLocation", formattedAddress);
              } catch (error) {
                console.error("주소 변환 오류:", error);
                setCurrentLocation(savedLocation);
              }
              setIsManualLocation(true);
              setCurrentCoords({ latitude, longitude });
              setIsLoadingLocation(false);
              
              // 매장 정보 가져오기
              console.log("🏪 [매장 검색] fetchNearbyStores 호출 시작");
              await fetchNearbyStores(latitude, longitude);
              return; // 직접 설정한 위치를 사용했으므로 현재 위치 가져오기 건너뛰기
            } else {
              console.warn("⚠️ [위치 정보] 저장된 좌표가 유효하지 않음:", { latitude, longitude });
              // 유효하지 않은 좌표는 제거하고 주소 검색으로 좌표 가져오기
              localStorage.removeItem("currentCoordinates");
              savedCoordinates = null; // 변수 업데이트하여 fallback 로직이 실행되도록 함
            }
          } catch (error) {
            console.error("❌ [위치 초기화] 저장된 좌표 파싱 오류:", error);
            // 저장된 좌표가 잘못되었으면 제거하고 주소 검색으로 좌표 가져오기
            localStorage.removeItem("currentCoordinates");
            savedCoordinates = null; // 변수 업데이트하여 fallback 로직이 실행되도록 함
          }
        }
        
        // 좌표가 없으면 주소 검색으로 좌표 가져오기 (최근 위치 선택 시)
        if (!savedCoordinates) {
          try {
            console.log("🔍 [위치 정보] 주소 검색으로 좌표 가져오기:", savedLocation);
            const { searchAddress } = await import("@/lib/kakao");
            const searchResult = await searchAddress(savedLocation);
            
            if (searchResult.documents && searchResult.documents.length > 0) {
              const firstResult = searchResult.documents[0];
              const latitude = parseFloat(firstResult.y);
              const longitude = parseFloat(firstResult.x);
              
              // 좌표 저장
              localStorage.setItem("currentCoordinates", JSON.stringify({ latitude, longitude }));
              
              console.log("✅ [위치 정보] 주소 검색으로 좌표 획득:", { latitude, longitude });
              
              // 저장된 위치를 ~시 ~동 형식으로 변환하여 표시
              try {
                const formattedAddress = await getAddressFromCoords(latitude, longitude);
                setCurrentLocation(formattedAddress);
                localStorage.setItem("selectedLocation", formattedAddress);
              } catch (error) {
                console.error("주소 변환 오류:", error);
                setCurrentLocation(savedLocation);
              }
              setIsManualLocation(true);
              setCurrentCoords({ latitude, longitude });
              setIsLoadingLocation(false);
              
              // 매장 정보 가져오기
              console.log("🏪 [매장 검색] fetchNearbyStores 호출 시작");
              await fetchNearbyStores(latitude, longitude);
              return; // 직접 설정한 위치를 사용했으므로 현재 위치 가져오기 건너뛰기
            } else {
              console.warn("⚠️ [위치 정보] 주소 검색 결과 없음:", savedLocation);
              // 이전 사용자 위치값 표시
              setCurrentLocation(savedLocation || "위치 불러올 수 없음");
              setIsLoadingLocation(false);
              return; // 수동 위치 설정이므로 브라우저 위치 가져오기 건너뛰기
            }
          } catch (error) {
            console.error("❌ [위치 초기화] 주소 검색 오류:", error);
            // 이전 사용자 위치값 표시
            setCurrentLocation(savedLocation || "위치 불러올 수 없음");
            setIsLoadingLocation(false);
            return; // 수동 위치 설정이므로 브라우저 위치 가져오기 건너뛰기
          }
        }
      }
      
      // 직접 설정한 위치가 없으면 기본적으로 현재 위치 가져오기
      console.log("🌍 [위치 정보] 현재 위치 가져오기 시작");
      await fetchBrowserLocation();
    };

    const fetchBrowserLocation = async () => {
      // 위치 권한 확인 및 현재 위치 가져오기
      if (navigator.geolocation) {
        console.log("🌍 [위치 정보] 브라우저 위치 정보 요청 시작");
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              console.log("✅ [위치 정보] 좌표 획득 성공:", { latitude, longitude });
              
              // 좌표를 주소로 변환
              console.log("🏠 [주소 변환] 시작");
              const address = await getAddressFromCoords(latitude, longitude);
              console.log("✅ [주소 변환] 완료:", address);
              
              // 저장 및 표시 (현재 위치는 자동으로 가져온 것이므로 isManualLocation 플래그 없음)
              localStorage.setItem("selectedLocation", address);
              localStorage.setItem("currentCoordinates", JSON.stringify({ latitude, longitude }));
              localStorage.removeItem("isManualLocation"); // 현재 위치는 수동 설정이 아님
              setIsManualLocation(false);
              setCurrentLocation(address);
              setCurrentCoords({ latitude, longitude });
              setIsLoadingLocation(false);
              
              // 매장 정보 가져오기
              console.log("🏪 [매장 검색] fetchNearbyStores 호출 시작");
              await fetchNearbyStores(latitude, longitude);
            } catch (error) {
              console.error("❌ [위치 초기화] 주소 변환 중 오류:", error);
              // 이전 사용자 위치값 표시
              const previousLocation = localStorage.getItem("selectedLocation");
              setCurrentLocation(previousLocation || "위치 불러올 수 없음");
              // localStorage는 유지 (이전 위치값을 보여주기 위해)
              setIsLoadingLocation(false);
            }
          },
          (error) => {
            console.error("❌ [위치 정보] 획득 실패:", error);
            console.log("에러 코드:", error.code);
            console.log("에러 메시지:", error.message);
            
            // 이전 사용자 위치값 표시
            const previousLocation = localStorage.getItem("selectedLocation");
            setCurrentLocation(previousLocation || "위치 불러올 수 없음");
            // localStorage는 유지 (이전 위치값을 보여주기 위해)
            setIsLoadingLocation(false);
            
            // 에러 메시지 표시 (권한 거부시)
            if (error.code === error.PERMISSION_DENIED) {
              console.warn("⚠️ [위치 권한] 사용자가 위치 권한을 거부했습니다");
              toast({
                title: "위치 권한 필요",
                description: "위치 권한을 허용하면 자동으로 현재 위치가 설정됩니다.",
              });
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0 // 항상 새로운 위치 가져오기
          }
        );
      } else {
        // Geolocation 미지원
        // 이전 사용자 위치값 표시
        const previousLocation = localStorage.getItem("selectedLocation");
        setCurrentLocation(previousLocation || "위치 불러올 수 없음");
        // localStorage는 유지 (이전 위치값을 보여주기 위해)
        setIsLoadingLocation(false);
      }
    };

    checkAuthAndInitLocation();

    // 세션 만료 감지 및 처리
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔐 [인증 상태 변경]", event, session ? "세션 있음" : "세션 없음");
      
      const wasLoggedIn = !!prevSessionRef.current;
      const isNowLoggedIn = !!session;
      
      if (event === "INITIAL_SESSION" && !session && wasLoggedIn) {
        setIsLoggedIn(false);
        prevSessionRef.current = null;
        return;
      }

      if (event === "SIGNED_OUT" || (!session && wasLoggedIn)) {
        setIsLoggedIn(false);
        localStorage.removeItem("lastLocationFetchTime");
      } else if (event === "SIGNED_IN" || (session && isNowLoggedIn)) {
        // 로그인되거나 토큰이 갱신된 경우
        console.log("✅ [세션 유지/갱신] 로그인 상태 유지");
        setIsLoggedIn(true);
        
        // onAuthStateChange에서는 위치를 조회하지 않음
        // 위치 조회는 checkAuthAndInitLocation에서만 수행됨 (앱 실행 시에만)
        // 단, 저장된 위치 정보가 있으면 상태만 업데이트
        const savedLocation = localStorage.getItem("selectedLocation");
        const savedCoordinates = localStorage.getItem("currentCoordinates");
        const isManualLocationValue = localStorage.getItem("isManualLocation") === "true";
        
        if (savedLocation || savedCoordinates) {
          setIsManualLocation(isManualLocationValue);
          if (savedLocation) {
            setCurrentLocation(savedLocation);
          }
          if (savedCoordinates) {
            try {
              const coords = JSON.parse(savedCoordinates);
              const { latitude, longitude } = coords;
              if (typeof latitude === 'number' && typeof longitude === 'number' && 
                  !isNaN(latitude) && !isNaN(longitude) &&
                  latitude >= -90 && latitude <= 90 &&
                  longitude >= -180 && longitude <= 180) {
                setCurrentCoords({ latitude, longitude });
              }
            } catch (error) {
              console.error("❌ [세션 갱신] 저장된 좌표 파싱 오류:", error);
            }
          }
        }
      }
      
      // 현재 세션 상태 저장
      prevSessionRef.current = session;
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast, navigate]);

  const handleRefreshLocation = async () => {
    console.log("🔄🔄🔄 [수동 새로고침] 위치 재조회 시작 🔄🔄🔄");

    console.log("🔄 [수동 새로고침 전] localStorage 상태:", Object.keys(localStorage).filter(key => key.includes('location') || key.includes('Location')).reduce((obj, key) => {
      obj[key] = localStorage.getItem(key);
      return obj;
    }, {} as Record<string, string | null>));
    
    // 수동 새로고침 시 타임스탬프 업데이트하여 위치를 새로 조회
    const refreshTimestamp = Date.now();
    const refreshTimestampString = refreshTimestamp.toString();
    localStorage.setItem("lastLocationFetchTime", refreshTimestampString);
    console.log("✅ [수동 새로고침] 타임스탬프 업데이트:", refreshTimestamp, "(문자열:", refreshTimestampString, ")");

    const refreshedValue = localStorage.getItem("lastLocationFetchTime");
    console.log("✅ [수동 새로고침 후] localStorage에서 읽은 값:", refreshedValue, "(일치:", refreshedValue === refreshTimestampString ? "✅" : "❌", ")");
    
    setIsLoadingLocation(true);
    setCurrentLocation("위치 확인 중...");
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const address = await getAddressFromCoords(latitude, longitude);
            
            localStorage.setItem("selectedLocation", address);
            localStorage.setItem("currentCoordinates", JSON.stringify({ latitude, longitude }));
            localStorage.removeItem("isManualLocation"); // 새로고침으로 현재 위치를 가져왔으므로 수동 설정 아님
            setIsManualLocation(false);
            setCurrentLocation(address);
            setCurrentCoords({ latitude, longitude });
            setIsLoadingLocation(false);
            
            await fetchNearbyStores(latitude, longitude);
            
            toast({
              title: "위치 업데이트 완료",
              description: "현재 위치가 업데이트되었습니다.",
            });
          } catch (error) {
            console.error("❌ [위치 새로고침] 주소 변환 중 오류:", error);
            // 이전 사용자 위치값 표시
            const previousLocation = localStorage.getItem("selectedLocation");
            setCurrentLocation(previousLocation || "위치 불러올 수 없음");
            // localStorage는 유지 (이전 위치값을 보여주기 위해)
            setIsLoadingLocation(false);
            
            toast({
              title: "위치 업데이트 실패",
              description: "주소 변환에 실패했습니다.",
              variant: "destructive",
            });
          }
        },
        (error) => {
          console.error("위치 가져오기 실패:", error);
          // 이전 사용자 위치값 표시
          const previousLocation = localStorage.getItem("selectedLocation");
          setCurrentLocation(previousLocation || "위치 불러올 수 없음");
          // localStorage는 유지 (이전 위치값을 보여주기 위해)
          setIsLoadingLocation(false);
          
          toast({
            title: "위치 업데이트 실패",
            description: "위치를 가져올 수 없습니다.",
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    }
  };


  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // 지구 반경 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  const fetchNearbyStores = async (latitude: number, longitude: number) => {
    try {
      setIsLoadingStores(true);
      console.log("🏪 [매장 검색] 시작:", { latitude, longitude });

      // Kakao SDK 로드 보장
      try {
        const { loadKakaoMaps } = await import("@/lib/kakao");
        await loadKakaoMaps();
      } catch (error: any) {
        console.error("❌ [매장 검색] Kakao SDK 로드 실패:", error);
        throw new Error(error.message || "Kakao SDK를 로드할 수 없습니다. VITE_KAKAO_APP_KEY 환경 변수를 확인해주세요.");
      }
      
      const kakao = (window as any).kakao;
      if (!kakao?.maps) {
        console.error("❌ [매장 검색] Kakao SDK를 찾을 수 없습니다");
        throw new Error("Kakao SDK가 로드되지 않았습니다");
      }
      
      // services 라이브러리 확인
      if (!kakao.maps.services) {
        console.error("❌ [매장 검색] Kakao Maps services를 찾을 수 없습니다");
        throw new Error("Kakao Maps services 라이브러리가 로드되지 않았습니다");
      }
      
      console.log("✅ [매장 검색] Kakao SDK 확인 완료");

      const radius = 10000; // 10km (미터 단위)
      console.log("📏 [매장 검색] 검색 반경:", radius, "미터");

      // 검색할 브랜드 목록
      const brands = [
        { keyword: "스타벅스", image: "starbucks" },
        { keyword: "베스킨라빈스", image: "baskin" },
        { keyword: "메가커피", image: "mega" },
        { keyword: "파스쿠찌", image: "pascucci" },
        { keyword: "투썸플레이스", image: "twosome" },
      ];
      console.log("🔍 [매장 검색] 검색할 브랜드:", brands.map(b => b.keyword));

      // Places 서비스 객체 생성 (SDK 로드 이후 안전)
      console.log("🗺️ [매장 검색] Places 서비스 객체 생성");
      const ps = new kakao.maps.services.Places();
      console.log("✅ [매장 검색] Places 서비스 준비 완료");

      // 모든 브랜드를 병렬로 검색
      console.log("🔄 [매장 검색] 병렬 검색 시작");
      const searchPromises = brands.map((brand) => {
        return new Promise<any[]>((resolve, reject) => {
          console.log(`🔍 [${brand.keyword}] 검색 시작`);
          const options = {
            location: new kakao.maps.LatLng(latitude, longitude),
            radius: radius,
            size: 15,
          };
          console.log(`⚙️ [${brand.keyword}] 검색 옵션:`, options);

          ps.keywordSearch(
            brand.keyword,
            (data: any[], status: any) => {
              console.log(`📊 [${brand.keyword}] 응답 상태:`, status);
              if (status === kakao.maps.services.Status.OK) {
                console.log(`✅ [${brand.keyword}] 검색 성공 - 결과 ${data.length}개:`, data);
                
                const stores = data.map((place: any) => {
                  // 거리 계산
                  const distanceNum = calculateDistance(
                    latitude,
                    longitude,
                    parseFloat(place.y),
                    parseFloat(place.x)
                  ) * 1000; // km를 m로 변환
                  
                  return {
                    id: place.id,
                    name: place.place_name,
                    distance: distanceNum < 1000 ? `${Math.round(distanceNum)}m` : `${(distanceNum / 1000).toFixed(1)}km`,
                    distanceNum: Math.round(distanceNum),
                    image: brand.image,
                    maxDiscount: null, // 실제 데이터 조회 후 업데이트됨
                    discountNum: 0, // 실제 데이터 조회 후 업데이트됨
                    maxDiscountPercent: null, // 실제 데이터 조회 후 업데이트됨
                    lat: parseFloat(place.y),
                    lon: parseFloat(place.x),
                    address: place.road_address_name || place.address_name,
                  };
                });
                
                console.log(`📍 [${brand.keyword}] 처리된 매장 데이터:`, stores);
                resolve(stores);
              } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
                console.log(`⚠️ [${brand.keyword}] 검색 결과 없음`);
                resolve([]);
              } else {
                console.error(`❌ [${brand.keyword}] 검색 실패 - 상태:`, status);
                resolve([]);
              }
            },
            options
          );
        });
      });
      console.log("⏳ [매장 검색] 모든 브랜드 검색 대기 중...");

      const results = await Promise.all(searchPromises);
      console.log("✅ [매장 검색] 모든 브랜드 검색 완료");
      console.log("📊 [매장 검색] 브랜드별 결과:", results.map((r, i) => `${brands[i].keyword}: ${r.length}개`));
      
      let allStores = results.flat();
      console.log("🏪 [매장 검색] 총 매장 수:", allStores.length);
      console.log("📋 [매장 검색] 최종 매장 목록:", allStores);
      
      // 거리순으로 정렬하여 초기 8개 선택
      allStores.sort((a, b) => a.distanceNum - b.distanceNum);
      const initialStores = allStores.slice(0, 8);
      const remainingStores = allStores.slice(8);
      
      console.log("🚀 [초기 로딩] 처음 8개 매장만 빠르게 표시");
      
      // 각 매장의 할인 정보 조회 (초기 8개만 먼저 처리)
      console.log("🔄 [할인 정보 조회] 초기 8개 매장 처리 시작");
      const initialStoresWithDiscount = await Promise.all(initialStores.map(async (store) => {
        try {
          // 파스쿠찌와 투썸플레이스만 할인율 조회
          if (store.image !== 'pascucci' && store.image !== 'twosome') {
            return {
              ...store,
              maxDiscount: null,
              discountNum: 0,
              maxDiscountPercent: null,
            };
          }

          // 파스쿠찌와 투썸플레이스 할인 정보 조회
          // 1. 프랜차이즈 정보 조회
          const brandNameMap: Record<string, string> = {
            starbucks: "스타벅스",
            baskin: "베스킨라빈스",
            mega: "메가커피",
            pascucci: "파스쿠찌",
            twosome: "투썸플레이스",
            compose: "컴포즈커피",
            ediya: "이디야",
            paik: "빽다방",
          };
          const brandName = brandNameMap[store.image] || store.image;

          // 프랜차이즈 정보 조회
          let franchiseData: any = null;
          try {
            const { data: franchise, error: franchiseError } = await supabase
              .from('franchises' as any)
              .select('id')
              .eq('name', brandName)
              .single();
            
            if (!franchiseError && franchise) {
              franchiseData = franchise;
            }
          } catch (e) {
            console.log(`⚠️ [할인 정보] ${store.name}: 프랜차이즈 정보 조회 실패`);
          }

          // 2. 프랜차이즈별 결제 방식 적립/할인 정보 조회
          let franchiseDiscountRate = 0;
          if (franchiseData) {
            try {
              const { data: paymentMethods, error: paymentMethodsError } = await supabase
                .from('franchise_payment_methods' as any)
                .select('method_name, method_type, rate')
                .eq('franchise_id', franchiseData.id);

              if (!paymentMethodsError && paymentMethods && paymentMethods.length > 0) {
                // 파스쿠찌: 해피포인트 적립 (5%)
                if (store.image === 'pascucci') {
                  const happyPoint = paymentMethods.find((pm: any) => 
                    pm.method_name === '해피포인트' && (pm.method_type === '적립' || pm.method_type === 'accumulation')
                  );
                  if (happyPoint && (happyPoint as any).rate) {
                    franchiseDiscountRate = (happyPoint as any).rate;
                  }
                }
                // 투썸플레이스: 투썸하트는 스탬프 타입이므로 할인율에 포함하지 않음 (할인율 없음)
                // 투썸플레이스는 지역화폐 할인율과 기프티콘 할인율만 고려
              }
            } catch (e) {
              console.log(`⚠️ [할인 정보] ${store.name}: 프랜차이즈 결제 방식 정보 조회 실패`);
            }
          }

          // 3. 매장 정보 조회 (kakao_place_id로, 실패 시 무시)
          let localCurrencyDiscount = 0;
          let maxGifticonDiscount = 0;
          let storeData: any = null;
          
          try {
            // storeId가 숫자인지 확인 (카카오 플레이스 ID)
            const isNumeric = /^\d+$/.test(store.id);
            let storeError: any = null;

            if (isNumeric && franchiseData) {
              // kakao_place_id로 조회 시도
              const { data, error } = await supabase
                .from('stores' as any)
                .select('local_currency_available, local_currency_discount_rate, parking_available, free_parking, parking_size, gifticon_available')
                .eq('kakao_place_id', store.id)
                .single();
              
              storeData = data;
              storeError = error;
            }

            // kakao_place_id 조회 실패 시 franchise_id로 조회 시도
            if (storeError && franchiseData) {
              const { data, error } = await supabase
                .from('stores' as any)
                .select('local_currency_available, local_currency_discount_rate, parking_available, free_parking, parking_size, gifticon_available')
                .eq('franchise_id', franchiseData.id)
                .limit(1)
                .single();
              
              if (!error && data) {
                storeData = data;
              }
            }

            if (storeData) {
              // 지역화폐 할인율
              localCurrencyDiscount = (storeData as any).local_currency_discount_rate || 0;

              // 기프티콘 할인율 조회 (추천 기프티콘 로직과 동일: 천원대별로 하나씩, 할인효율 순)
              if ((storeData as any).gifticon_available) {
                try {
                  // 천원대별로 그룹화하는 헬퍼 함수
                  const getPriceRange = (price: number): number => {
                    return Math.floor(price / 1000) * 1000;
                  };

                  // 할인효율 계산 함수: (원가-할인가)/할인가
                  const getDiscountEfficiency = (originalPrice: number, salePrice: number): number => {
                    if (salePrice === 0) return 0;
                    return (originalPrice - salePrice) / salePrice;
                  };

                  // 정렬 함수 (마감일 임박순 최우선, 그 다음 할인효율 내림차순, 같은 효율일 땐 판매가 오름차순)
                  const sortByDiscountEfficiency = (a: any, b: any): number => {
                    // 1순위: 마감일 임박순 (expiry_date 오름차순)
                    const expiryA = new Date(a.expiry_date).getTime();
                    const expiryB = new Date(b.expiry_date).getTime();
                    if (expiryA !== expiryB) {
                      return expiryA - expiryB; // 마감일 임박순 (오름차순)
                    }
                    
                    // 2순위: 할인효율 내림차순
                    const efficiencyA = getDiscountEfficiency(a.original_price, a.sale_price);
                    const efficiencyB = getDiscountEfficiency(b.original_price, b.sale_price);
                    if (efficiencyA !== efficiencyB) {
                      return efficiencyB - efficiencyA; // 할인효율 내림차순
                    }
                    
                    // 3순위: 같은 효율일 경우 판매가 오름차순
                    return a.sale_price - b.sale_price;
                  };

                  // 모든 판매중 기프티콘 조회
                  const { data: gifticonsData, error: gifticonsError } = await supabase
                    .from('used_gifticons' as any)
                    .select('original_price, sale_price, expiry_date')
                    .eq('available_at', brandName)
                    .eq('status', '판매중');

                  if (!gifticonsError && gifticonsData && gifticonsData.length > 0) {
                    // 할인효율 기준으로 정렬
                    const sortedData = [...gifticonsData].sort(sortByDiscountEfficiency);

                    // 천원대별로 그룹화하면서 할인효율이 높은 순으로 이미 정렬된 데이터를 사용
                    const groupedByThousand = new Map<number, any>();
                    sortedData.forEach((item: any) => {
                      const priceRange = getPriceRange(item.original_price);
                      // 같은 천원대에 아직 항목이 없으면 추가 (이미 할인효율 순으로 정렬되어 있으므로 첫 번째가 최고 효율)
                      if (!groupedByThousand.has(priceRange)) {
                        groupedByThousand.set(priceRange, item);
                      }
                    });

                    // 그룹화된 항목들의 할인율 계산 (추천 기프티콘에서 처음 가져오는 기프티콘들)
                    const selectedGifticons = Array.from(groupedByThousand.values());
                    if (selectedGifticons.length > 0) {
                      const discounts = selectedGifticons.map((g: any) => {
                        const discountAmount = g.original_price - g.sale_price;
                        return Math.round((discountAmount / g.original_price) * 100);
                      });
                      maxGifticonDiscount = Math.max(...discounts);
                    }
                  }
                } catch (e) {
                  console.log(`⚠️ [할인 정보] ${store.name}: 기프티콘 정보 조회 실패`);
                }
              }
            }
          } catch (e) {
            console.log(`⚠️ [할인 정보] ${store.name}: 매장 정보 조회 실패`);
          }

          // 4. 최대 할인율 계산 (프랜차이즈 적립/할인, 지역화폐 할인율, 기프티콘 할인율 중 최대값)
          const maxDiscountPercent = Math.max(franchiseDiscountRate, localCurrencyDiscount, maxGifticonDiscount);
          
          if (maxDiscountPercent > 0) {
            const discountDetails = [];
            if (franchiseDiscountRate > 0) {
              discountDetails.push(`프랜차이즈: ${franchiseDiscountRate}%`);
            }
            if (localCurrencyDiscount > 0) {
              discountDetails.push(`지역화폐: ${localCurrencyDiscount}%`);
            }
            if (maxGifticonDiscount > 0) {
              discountDetails.push(`기프티콘: ${maxGifticonDiscount}%`);
            }
            console.log(`✅ [할인 정보] ${store.name} (${store.id}): 최대 ${maxDiscountPercent}% 할인 (${discountDetails.join(', ')})`);
          }

          return {
            ...store,
            maxDiscount: maxDiscountPercent > 0 ? `최대 ${maxDiscountPercent}% 할인` : null,
            discountNum: maxDiscountPercent,
            maxDiscountPercent: maxDiscountPercent > 0 ? maxDiscountPercent : null,
            local_currency_available: storeData?.local_currency_available || false,
            local_currency_discount_rate: storeData?.local_currency_discount_rate || null,
            parking_available: storeData?.parking_available || false,
            free_parking: storeData?.free_parking || false,
            parking_size: storeData?.parking_size || null,
          };
        } catch (error) {
          console.error(`❌ [할인 정보] ${store.name} 조회 오류:`, error);
          return {
            ...store,
            maxDiscount: null,
            discountNum: 0,
            maxDiscountPercent: null,
            local_currency_available: false,
            local_currency_discount_rate: null,
            parking_available: false,
            free_parking: false,
            parking_size: null,
          };
        }
      }));

      console.log("✅ [할인 정보 조회] 초기 8개 완료");
      
      // 초기 8개 먼저 표시
      setStores(initialStoresWithDiscount);
      setIsLoadingStores(false);
      
      // localStorage에 초기 매장 정보 저장 (Payment 페이지에서 사용)
      try {
        localStorage.setItem('nearbyStores', JSON.stringify(initialStoresWithDiscount));
      } catch (e) {
        console.error("localStorage 저장 오류:", e);
      }
      
      console.log("✅ [초기 로딩] 완료 - 초기 8개 매장 표시");
      
      // 나머지 매장 데이터 백그라운드 로딩
      if (remainingStores.length > 0) {
        setIsLoadingMoreStores(true);
        console.log("🔄 [추가 로딩] 나머지 매장 데이터 로딩 시작");
        
        // 나머지 매장의 할인 정보 조회
        const remainingStoresWithDiscount = await Promise.all(remainingStores.map(async (store) => {
          try {
            // 파스쿠찌와 투썸플레이스만 할인율 조회
            if (store.image !== 'pascucci' && store.image !== 'twosome') {
              return {
                ...store,
                maxDiscount: null,
                discountNum: 0,
                maxDiscountPercent: null,
              };
            }

            // 파스쿠찌와 투썸플레이스 할인 정보 조회
            // 1. 프랜차이즈 정보 조회
            const brandNameMap: Record<string, string> = {
              starbucks: "스타벅스",
              baskin: "베스킨라빈스",
              mega: "메가커피",
              pascucci: "파스쿠찌",
              twosome: "투썸플레이스",
              compose: "컴포즈커피",
              ediya: "이디야",
              paik: "빽다방",
            };
            const brandName = brandNameMap[store.image] || store.image;

            // 프랜차이즈 정보 조회
            let franchiseData: any = null;
            try {
              const { data: franchise, error: franchiseError } = await supabase
                .from('franchises' as any)
                .select('id')
                .eq('name', brandName)
                .single();
              
              if (!franchiseError && franchise) {
                franchiseData = franchise;
              }
            } catch (e) {
              console.log(`⚠️ [할인 정보] ${store.name}: 프랜차이즈 정보 조회 실패`);
            }

            // 2. 프랜차이즈별 결제 방식 적립/할인 정보 조회
            let franchiseDiscountRate = 0;
            if (franchiseData) {
              try {
                const { data: paymentMethods, error: paymentMethodsError } = await supabase
                  .from('franchise_payment_methods' as any)
                  .select('method_name, method_type, rate')
                  .eq('franchise_id', franchiseData.id);

                if (!paymentMethodsError && paymentMethods && paymentMethods.length > 0) {
                  // 파스쿠찌: 해피포인트 적립 (5%)
                  if (store.image === 'pascucci') {
                    const happyPoint = paymentMethods.find((pm: any) => 
                      pm.method_name === '해피포인트' && (pm.method_type === '적립' || pm.method_type === 'accumulation')
                    );
                    if (happyPoint && (happyPoint as any).rate) {
                      franchiseDiscountRate = (happyPoint as any).rate;
                    }
                  }
                }
              } catch (e) {
                console.log(`⚠️ [할인 정보] ${store.name}: 프랜차이즈 결제 방식 정보 조회 실패`);
              }
            }

            // 3. 매장 정보 조회 (kakao_place_id로, 실패 시 무시)
            let localCurrencyDiscount = 0;
            let maxGifticonDiscount = 0;
            let storeData: any = null;
            
            try {
              // storeId가 숫자인지 확인 (카카오 플레이스 ID)
              const isNumeric = /^\d+$/.test(store.id);
              let storeError: any = null;

              if (isNumeric && franchiseData) {
                // kakao_place_id로 조회 시도
                const { data, error } = await supabase
                  .from('stores' as any)
                  .select('local_currency_available, local_currency_discount_rate, parking_available, free_parking, parking_size, gifticon_available')
                  .eq('kakao_place_id', store.id)
                  .single();
                
                storeData = data;
                storeError = error;
              }

              // kakao_place_id 조회 실패 시 franchise_id로 조회 시도
              if (storeError && franchiseData) {
                const { data, error } = await supabase
                  .from('stores' as any)
                  .select('local_currency_available, local_currency_discount_rate, parking_available, free_parking, parking_size, gifticon_available')
                  .eq('franchise_id', franchiseData.id)
                  .limit(1)
                  .single();
                
                if (!error && data) {
                  storeData = data;
                }
              }

              if (storeData) {
                // 지역화폐 할인율
                localCurrencyDiscount = (storeData as any).local_currency_discount_rate || 0;

                // 기프티콘 할인율 조회 (추천 기프티콘 로직과 동일: 천원대별로 하나씩, 할인효율 순)
                if ((storeData as any).gifticon_available) {
                  try {
                    // 천원대별로 그룹화하는 헬퍼 함수
                    const getPriceRange = (price: number): number => {
                      return Math.floor(price / 1000) * 1000;
                    };

                    // 할인효율 계산 함수: (원가-할인가)/할인가
                    const getDiscountEfficiency = (originalPrice: number, salePrice: number): number => {
                      if (salePrice === 0) return 0;
                      return (originalPrice - salePrice) / salePrice;
                    };

                    // 정렬 함수 (마감일 임박순 최우선, 그 다음 할인효율 내림차순, 같은 효율일 땐 판매가 오름차순)
                    const sortByDiscountEfficiency = (a: any, b: any): number => {
                      // 1순위: 마감일 임박순 (expiry_date 오름차순)
                      const expiryA = new Date(a.expiry_date).getTime();
                      const expiryB = new Date(b.expiry_date).getTime();
                      if (expiryA !== expiryB) {
                        return expiryA - expiryB; // 마감일 임박순 (오름차순)
                      }
                      
                      // 2순위: 할인효율 내림차순
                      const efficiencyA = getDiscountEfficiency(a.original_price, a.sale_price);
                      const efficiencyB = getDiscountEfficiency(b.original_price, b.sale_price);
                      if (efficiencyA !== efficiencyB) {
                        return efficiencyB - efficiencyA; // 할인효율 내림차순
                      }
                      
                      // 3순위: 같은 효율일 경우 판매가 오름차순
                      return a.sale_price - b.sale_price;
                    };

                    // 모든 판매중 기프티콘 조회
                    const { data: gifticonsData, error: gifticonsError } = await supabase
                      .from('used_gifticons' as any)
                      .select('original_price, sale_price, expiry_date')
                      .eq('available_at', brandName)
                      .eq('status', '판매중');

                    if (!gifticonsError && gifticonsData && gifticonsData.length > 0) {
                      // 할인효율 기준으로 정렬
                      const sortedData = [...gifticonsData].sort(sortByDiscountEfficiency);

                      // 천원대별로 그룹화하면서 할인효율이 높은 순으로 이미 정렬된 데이터를 사용
                      const groupedByThousand = new Map<number, any>();
                      sortedData.forEach((item: any) => {
                        const priceRange = getPriceRange(item.original_price);
                        // 같은 천원대에 아직 항목이 없으면 추가 (이미 할인효율 순으로 정렬되어 있으므로 첫 번째가 최고 효율)
                        if (!groupedByThousand.has(priceRange)) {
                          groupedByThousand.set(priceRange, item);
                        }
                      });

                      // 그룹화된 항목들의 할인율 계산 (추천 기프티콘에서 처음 가져오는 기프티콘들)
                      const selectedGifticons = Array.from(groupedByThousand.values());
                      if (selectedGifticons.length > 0) {
                        const discounts = selectedGifticons.map((g: any) => {
                          const discountAmount = g.original_price - g.sale_price;
                          return Math.round((discountAmount / g.original_price) * 100);
                        });
                        maxGifticonDiscount = Math.max(...discounts);
                      }
                    }
                  } catch (e) {
                    console.log(`⚠️ [할인 정보] ${store.name}: 기프티콘 정보 조회 실패`);
                  }
                }
              }
            } catch (e) {
              console.log(`⚠️ [할인 정보] ${store.name}: 매장 정보 조회 실패`);
            }

            // 4. 최대 할인율 계산 (프랜차이즈 적립/할인, 지역화폐 할인율, 기프티콘 할인율 중 최대값)
            const maxDiscountPercent = Math.max(franchiseDiscountRate, localCurrencyDiscount, maxGifticonDiscount);
            
            if (maxDiscountPercent > 0) {
              const discountDetails = [];
              if (franchiseDiscountRate > 0) {
                discountDetails.push(`프랜차이즈: ${franchiseDiscountRate}%`);
              }
              if (localCurrencyDiscount > 0) {
                discountDetails.push(`지역화폐: ${localCurrencyDiscount}%`);
              }
              if (maxGifticonDiscount > 0) {
                discountDetails.push(`기프티콘: ${maxGifticonDiscount}%`);
              }
              console.log(`✅ [할인 정보] ${store.name} (${store.id}): 최대 ${maxDiscountPercent}% 할인 (${discountDetails.join(', ')})`);
            }

            return {
              ...store,
              maxDiscount: maxDiscountPercent > 0 ? `최대 ${maxDiscountPercent}% 할인` : null,
              discountNum: maxDiscountPercent,
              maxDiscountPercent: maxDiscountPercent > 0 ? maxDiscountPercent : null,
              local_currency_available: storeData?.local_currency_available || false,
              local_currency_discount_rate: storeData?.local_currency_discount_rate || null,
              parking_available: storeData?.parking_available || false,
              free_parking: storeData?.free_parking || false,
              parking_size: storeData?.parking_size || null,
            };
          } catch (error) {
            console.error(`❌ [할인 정보] ${store.name} 조회 오류:`, error);
            return {
              ...store,
              maxDiscount: null,
              discountNum: 0,
              maxDiscountPercent: null,
              local_currency_available: false,
              local_currency_discount_rate: null,
              parking_available: false,
              free_parking: false,
              parking_size: null,
            };
          }
        }));

        // 전체 매장 데이터 합치기
        const allStoresWithDiscount = [...initialStoresWithDiscount, ...remainingStoresWithDiscount];
        
        // localStorage에 전체 매장 정보 저장
        try {
          localStorage.setItem('nearbyStores', JSON.stringify(allStoresWithDiscount));
        } catch (e) {
          console.error("localStorage 저장 오류:", e);
        }
        
        setStores(allStoresWithDiscount);
        setIsLoadingMoreStores(false);
        console.log("✅ [추가 로딩] 완료 - 전체 매장 데이터 표시");
      }
    } catch (error) {
      console.error("❌ [매장 검색] 실패:", error);
      console.error("에러 스택:", (error as Error).stack);
      setIsLoadingStores(false);
      toast({
        title: "매장 정보 로딩 실패",
        description: "매장 정보를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  // 검색어로 필터링
  const filteredStores = searchQuery.trim()
    ? stores.filter(store => 
        store.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : stores;

  const sortedStores = [...filteredStores].sort((a, b) => {
    if (sortBy === "distance") {
      return a.distanceNum - b.distanceNum;
    } else {
      return b.discountNum - a.discountNum;
    }
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <TutorialModal 
        open={showTutorialModal} 
        onClose={() => setShowTutorialModal(false)}
      />
      {hasPaymentHistory === false && <FirstPurchaseBanner />}
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border/50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-2 w-full">
            <Button 
              variant="outline" 
              className="group flex-1 justify-start h-12 rounded-xl border-border/50 hover:border-primary/50 transition-colors"
              disabled={isLoadingLocation}
              onClick={() => navigate('/location')}
            >
              <div className="flex items-center">
                {isLoadingLocation ? (
                  <Loader2 className="w-5 h-5 mr-2 text-primary animate-spin" />
                ) : (
                  <MapPin className="w-5 h-5 mr-2 text-primary group-hover:text-white transition-colors" />
                )}
                <span className="font-medium">
                  {isLoadingLocation 
                    ? "위치 확인 중..." 
                    : `${isManualLocation ? "사용자 위치" : "현재 위치"}: ${currentLocation}`}
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl border-border/50 hover:border-primary/50 transition-colors"
              disabled={isLoadingLocation}
              onClick={handleRefreshLocation}
              aria-label="위치 새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Store Grid */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="매장 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">결제 가능 매장</h2>
            <p className="text-muted-foreground">
              {sortBy === "distance" ? "거리 순으로 정렬됩니다" : "최대 할인율 순으로 정렬됩니다"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy(sortBy === "distance" ? "discount" : "distance")}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortBy === "distance" ? "거리순" : "할인순"}
          </Button>
        </div>

        {isLoadingStores ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">매장 정보를 불러오는 중...</p>
          </div>
        ) : sortedStores.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              {sortedStores.map((store) => (
                <StoreCard 
                  key={store.id} 
                  {...store}
                />
              ))}
            </div>
            {isLoadingMoreStores && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {[...Array(4)].map((_, index) => (
                  <div key={`skeleton-${index}`} className="animate-fade-in">
                    <div className="overflow-hidden rounded-lg border border-border/50 bg-card">
                      <div className="flex flex-col">
                        <div className="flex-1 bg-primary/10 flex items-center justify-center p-4 relative">
                          <Skeleton className="w-20 h-20 rounded-md" />
                        </div>
                        <div className="p-3 bg-card">
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">주변에 매장이 없습니다</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Main;
