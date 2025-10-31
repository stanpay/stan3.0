import { MapPin, ArrowUpDown, Search, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoreCard from "@/components/StoreCard";
import BottomNav from "@/components/BottomNav";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Main = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"distance" | "discount">("distance");
  const [currentLocation, setCurrentLocation] = useState("위치 가져오는 중...");
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  interface StoreData {
    id: string;
    name: string;
    distance: string;
    distanceNum: number;
    image: string;
    maxDiscount: string;
    discountNum: number;
    lat?: number;
    lon?: number;
    address?: string;
  }

  const [stores, setStores] = useState<StoreData[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [currentCoords, setCurrentCoords] = useState<{latitude: number, longitude: number} | null>(null);

  // 더미 데이터
  const dummyStores: StoreData[] = [
    {
      id: "dummy-1",
      name: "스타벅스 강남역점",
      distance: "350m",
      distanceNum: 350,
      image: "starbucks",
      maxDiscount: "2,500원",
      discountNum: 2500,
      address: "서울 강남구 강남대로 지하 396"
    },
    {
      id: "dummy-2",
      name: "베스킨라빈스 역삼점",
      distance: "520m",
      distanceNum: 520,
      image: "baskin",
      maxDiscount: "3,000원",
      discountNum: 3000,
      address: "서울 강남구 역삼동 735-3"
    },
    {
      id: "dummy-3",
      name: "메가커피 테헤란로점",
      distance: "280m",
      distanceNum: 280,
      image: "mega",
      maxDiscount: "1,800원",
      discountNum: 1800,
      address: "서울 강남구 테헤란로 123"
    },
    {
      id: "dummy-4",
      name: "파스쿠찌 삼성점",
      distance: "450m",
      distanceNum: 450,
      image: "pascucci",
      maxDiscount: "2,300원",
      discountNum: 2300,
      address: "서울 강남구 삼성동 156-1"
    },
    {
      id: "dummy-5",
      name: "투썸플레이스 논현점",
      distance: "610m",
      distanceNum: 610,
      image: "twosome",
      maxDiscount: "2,400원",
      discountNum: 2400,
      address: "서울 강남구 논현동 120-5"
    },
    {
      id: "dummy-6",
      name: "스타벅스 선릉역점",
      distance: "730m",
      distanceNum: 730,
      image: "starbucks",
      maxDiscount: "2,500원",
      discountNum: 2500,
      address: "서울 강남구 선릉로 428"
    },
  ];

  const getAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      // Kakao 로컬 API 사용 (CORS 지원, 한국 주소에 최적화)
      const kakaoAppKey = (import.meta as any).env?.VITE_KAKAO_APP_KEY;
      if (!kakaoAppKey) {
        console.error("Kakao API 키가 설정되지 않았습니다.");
        return "위치를 확인할 수 없음";
      }

      const response = await fetch(
        `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}&input_coord=WGS84`,
        {
          headers: {
            'Authorization': `KakaoAK ${kakaoAppKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Kakao API 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log("Kakao API 응답:", data);

      if (data.documents && data.documents.length > 0) {
        // 지번 주소 우선, 없으면 도로명 주소 사용
        const address = data.documents[0].address || data.documents[0].road_address;
        
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
            console.log("최종 주소:", formattedAddress);
            return formattedAddress;
          } else if (cityName) {
            return cityName;
          }
        }
      }
      
      return "위치를 확인할 수 없음";
    } catch (error) {
      console.error("주소 변환 실패:", error);
      return "위치를 확인할 수 없음";
    }
  };

  useEffect(() => {
    const checkAuthAndInitLocation = async () => {
      console.log("🔐 [인증 확인] 시작");
      
      // 매직링크로 리다이렉트된 경우 처리 (PKCE flow)
      // 매직링크가 /main?token_hash=...로 리다이렉트되는 경우를 처리
      const urlParams = new URLSearchParams(window.location.search);
      const tokenHash = urlParams.get('token_hash');
      const typeFromQuery = urlParams.get('type');
      
      if (tokenHash) {
        console.log("🔗 [매직링크 처리] token_hash 발견:", tokenHash.substring(0, 20) + "...");
        try {
          const {
            data: { session, user },
            error,
          } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: (typeFromQuery || 'email') as 'email' | 'magiclink',
          });

          if (error) {
            console.error("❌ [매직링크 인증 오류]:", error);
            toast({
              title: "인증 실패",
              description: error.message || "인증 링크가 유효하지 않습니다.",
              variant: "destructive",
            });
            // URL 정리 후 로그인 페이지로 이동
            window.history.replaceState({}, document.title, "/main");
            navigate("/");
            return;
          } 
          
          if (session && user) {
            console.log("✅ [매직링크 인증 성공]");
            toast({
              title: "로그인 성공",
              description: "환영합니다!",
            });
            // URL 정리 (query string 제거)
            window.history.replaceState({}, document.title, "/main");
            // 인증 완료 후 계속 진행 (return 없이 계속 실행)
            setIsLoggedIn(true);
            // 여기서 return 하지 않고 계속 진행하여 위치 초기화 수행
          } else {
            console.error("❌ [매직링크] 세션 생성 실패");
            throw new Error("세션을 생성할 수 없습니다.");
          }
        } catch (error: any) {
          console.error("❌ [매직링크 처리 오류]:", error);
          toast({
            title: "인증 실패",
            description: error.message || "인증 링크 처리 중 오류가 발생했습니다.",
            variant: "destructive",
          });
          // URL 정리
          window.history.replaceState({}, document.title, "/main");
          navigate("/");
          return;
        }
      }
      
      // 로그인 상태 확인 (매직링크 처리 후에도 실행됨)
      const { data: { session } } = await supabase.auth.getSession();
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);
      console.log(`🔐 [인증 상태] ${loggedIn ? '로그인됨' : '로그인 안됨'}`);
      
      if (!loggedIn) {
        // 로그인하지 않은 경우 더미 데이터 사용
        console.log("📦 [더미 데이터] 사용");
        setCurrentLocation("강남구 역삼동");
        setStores(dummyStores);
        setIsLoadingLocation(false);
        setIsLoadingStores(false);
        return;
      }

      // 로그인한 경우 실제 위치 가져오기
      console.log("📍 [위치 초기화] 시작");
      
      // Kakao SDK 로드 보장
      try {
        const { loadKakaoMaps } = await import("@/lib/kakao");
        await loadKakaoMaps();
        console.log("✅ [Kakao SDK] 로드 완료");
      } catch (error: any) {
        console.error("❌ [위치 초기화] Kakao SDK 로드 실패:", error);
        setIsLoadingLocation(false);
        const defaultLocation = "강남구 역삼동";
        setCurrentLocation(defaultLocation);
        localStorage.setItem("selectedLocation", defaultLocation);
        toast({
          title: "위치 기반 검색 불가",
          description: error.message || "카카오 SDK 설정 오류입니다. 배포 환경에 VITE_KAKAO_APP_KEY 환경 변수를 설정해주세요.",
          variant: "destructive",
        });
        // SDK 없이도 기본 위치로 설정
        setIsLoadingStores(false);
        setStores([]);
        return;
      }

      // Main 페이지 진입 시 항상 현재 위치를 새로 가져오기
      setIsLoadingLocation(true);

      // 위치 권한 확인 및 현재 위치 가져오기
      if (navigator.geolocation) {
        console.log("🌍 [위치 정보] 브라우저 위치 정보 요청 시작");
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log("✅ [위치 정보] 좌표 획득 성공:", { latitude, longitude });
            
            // 좌표를 주소로 변환
            console.log("🏠 [주소 변환] 시작");
            const address = await getAddressFromCoords(latitude, longitude);
            console.log("✅ [주소 변환] 완료:", address);
            
            // 저장 및 표시
            localStorage.setItem("selectedLocation", address);
            localStorage.setItem("currentCoordinates", JSON.stringify({ latitude, longitude }));
            setCurrentLocation(address);
            setCurrentCoords({ latitude, longitude });
            setIsLoadingLocation(false);
            
            // 매장 정보 가져오기
            console.log("🏪 [매장 검색] fetchNearbyStores 호출 시작");
            await fetchNearbyStores(latitude, longitude);
          },
          (error) => {
            console.error("❌ [위치 정보] 획득 실패:", error);
            console.log("에러 코드:", error.code);
            console.log("에러 메시지:", error.message);
            
            // 기본값 설정
            const defaultLocation = "강남구 역삼동";
            setCurrentLocation(defaultLocation);
            localStorage.setItem("selectedLocation", defaultLocation);
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
        const defaultLocation = "강남구 역삼동";
        setCurrentLocation(defaultLocation);
        localStorage.setItem("selectedLocation", defaultLocation);
        setIsLoadingLocation(false);
      }
    };

    checkAuthAndInitLocation();
  }, [toast, navigate]);

  const handleRefreshLocation = async () => {
    if (!isLoggedIn) {
      toast({
        title: "로그인 필요",
        description: "위치 기반 매장 검색을 이용하려면 로그인이 필요합니다.",
      });
      return;
    }
    
    setIsLoadingLocation(true);
    setCurrentLocation("위치 확인 중...");
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await getAddressFromCoords(latitude, longitude);
          
          localStorage.setItem("selectedLocation", address);
          localStorage.setItem("currentCoordinates", JSON.stringify({ latitude, longitude }));
          setCurrentLocation(address);
          setCurrentCoords({ latitude, longitude });
          setIsLoadingLocation(false);
          
          await fetchNearbyStores(latitude, longitude);
          
          toast({
            title: "위치 업데이트 완료",
            description: "현재 위치가 업데이트되었습니다.",
          });
        },
        (error) => {
          console.error("위치 가져오기 실패:", error);
          const defaultLocation = "강남구 역삼동";
          setCurrentLocation(defaultLocation);
          localStorage.setItem("selectedLocation", defaultLocation);
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
      console.log("✅ [매장 검색] Kakao SDK 확인 완료");

      const radius = 10000; // 10km (미터 단위)
      console.log("📏 [매장 검색] 검색 반경:", radius, "미터");

      // 검색할 브랜드 목록
      const brands = [
        { keyword: "스타벅스", image: "starbucks", discountNum: 2500 },
        { keyword: "베스킨라빈스", image: "baskin", discountNum: 3000 },
        { keyword: "메가커피", image: "mega", discountNum: 1800 },
        { keyword: "파스쿠찌", image: "pascucci", discountNum: 2300 },
        { keyword: "투썸플레이스", image: "twosome", discountNum: 2400 },
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
                    maxDiscount: `${brand.discountNum.toLocaleString()}원`,
                    discountNum: brand.discountNum,
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
      
      const allStores = results.flat();
      console.log("🏪 [매장 검색] 총 매장 수:", allStores.length);
      console.log("📋 [매장 검색] 최종 매장 목록:", allStores);
      
      // localStorage에 매장 정보 저장 (Payment 페이지에서 사용)
      try {
        localStorage.setItem('nearbyStores', JSON.stringify(allStores));
      } catch (e) {
        console.error("localStorage 저장 오류:", e);
      }
      
      setStores(allStores);
      setIsLoadingStores(false);
      console.log("✅ [매장 검색] 완료 - 상태 업데이트 완료");
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

  const sortedStores = [...stores].sort((a, b) => {
    if (sortBy === "distance") {
      return a.distanceNum - b.distanceNum;
    } else {
      return b.discountNum - a.discountNum;
    }
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border/50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-md mx-auto px-4 py-4">
          <Button 
            variant="outline" 
            className="w-full justify-between h-12 rounded-xl border-border/50 hover:border-primary/50 transition-colors"
            disabled={isLoadingLocation || !isLoggedIn}
            onClick={() => {
              if (isLoggedIn) {
                navigate('/location');
              } else {
                toast({
                  title: "로그인 필요",
                  description: "위치 설정을 이용하려면 로그인이 필요합니다.",
                });
              }
            }}
          >
            <div className="flex items-center">
              {isLoadingLocation ? (
                <Loader2 className="w-5 h-5 mr-2 text-primary animate-spin" />
              ) : (
                <MapPin className="w-5 h-5 mr-2 text-primary" />
              )}
              <span className="font-medium">
                {isLoadingLocation ? "위치 확인 중..." : `현재 위치: ${currentLocation}`}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRefreshLocation();
              }}
              disabled={isLoadingLocation}
              className="p-1.5 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
            </button>
          </Button>
        </div>
      </header>

      {/* Store Grid */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="매장 검색..."
            className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">결제 가능 매장</h2>
            <p className="text-muted-foreground">
              {sortBy === "distance" ? "거리 순으로 정렬됩니다" : "최대 할인금액 순으로 정렬됩니다"}
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
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            {sortedStores.map((store) => (
              <StoreCard 
                key={store.id} 
                {...store} 
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>
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
