import { MapPin, ArrowUpDown, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoreCard from "@/components/StoreCard";
import BottomNav from "@/components/BottomNav";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const Main = () => {
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<"distance" | "discount">("distance");
  const [currentLocation, setCurrentLocation] = useState("위치 가져오는 중...");
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  const getAddressFromCoords = async (latitude: number, longitude: number) => {
    try {
      // Nominatim API 사용 (무료, API 키 불필요)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ko&zoom=18`,
        {
          headers: {
            'User-Agent': 'StanPay App'
          }
        }
      );
      
      const data = await response.json();
      console.log("Nominatim 응답:", data);
      
      if (data && data.address) {
        const address = data.address;
        console.log("주소 데이터:", address);
        
        // 한국 주소 형식 파싱
        let cityName = "";
        let districtName = "";
        
        // 시/도 찾기 (city, state, province 중 하나)
        if (address.city) {
          cityName = address.city;
        } else if (address.province || address.state) {
          cityName = address.province || address.state;
          // 도 단위인 경우 시/군 추가
          if (address.county) {
            cityName = address.county;
          }
        }
        
        // 동/읍/면 찾기 (더 구체적인 순서로)
        if (address.neighbourhood) {
          districtName = address.neighbourhood;
        } else if (address.suburb) {
          districtName = address.suburb;
        } else if (address.quarter) {
          districtName = address.quarter;
        } else if (address.village) {
          districtName = address.village;
        } else if (address.town) {
          districtName = address.town;
        } else if (address.municipality) {
          districtName = address.municipality;
        }
        
        // 결과 조합
        if (cityName && districtName) {
          // "시" 또는 "군" 제거하고 깔끔하게
          cityName = cityName.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, '');
          const formattedAddress = `${cityName} ${districtName}`;
          console.log("최종 주소:", formattedAddress);
          return formattedAddress;
        } else if (cityName) {
          return cityName;
        }
      }
      
      // 주소를 찾지 못한 경우 display_name 사용
      if (data.display_name) {
        const parts = data.display_name.split(',').map(p => p.trim());
        console.log("display_name 파싱:", parts);
        if (parts.length >= 2) {
          return `${parts[0]} ${parts[1]}`;
        }
      }
      
      return "위치를 확인할 수 없음";
    } catch (error) {
      console.error("주소 변환 실패:", error);
      return "위치를 확인할 수 없음";
    }
  };

  useEffect(() => {
    const initLocation = async () => {
      // Main 페이지 진입 시 항상 현재 위치를 새로 가져오기
      setIsLoadingLocation(true);

      // 위치 권한 확인 및 현재 위치 가져오기
      if (navigator.geolocation) {
        console.log("위치 정보 요청 시작...");
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log("좌표:", latitude, longitude);
            
            // 좌표를 주소로 변환
            const address = await getAddressFromCoords(latitude, longitude);
            
            // 저장 및 표시
            localStorage.setItem("selectedLocation", address);
            localStorage.setItem("currentCoordinates", JSON.stringify({ latitude, longitude }));
            setCurrentLocation(address);
            setCurrentCoords({ latitude, longitude });
            setIsLoadingLocation(false);
            
            // 매장 정보 가져오기
            await fetchNearbyStores(latitude, longitude);
          },
          (error) => {
            console.error("위치 가져오기 실패:", error);
            
            // 기본값 설정
            const defaultLocation = "강남구 역삼동";
            setCurrentLocation(defaultLocation);
            localStorage.setItem("selectedLocation", defaultLocation);
            setIsLoadingLocation(false);
            
            // 에러 메시지 표시 (권한 거부시)
            if (error.code === error.PERMISSION_DENIED) {
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

    initLocation();
  }, [toast]);

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
      console.log("매장 검색 시작:", latitude, longitude);

      // Kakao SDK가 로드될 때까지 대기
      await new Promise<void>((resolve) => {
        const checkKakao = () => {
          if ((window as any).kakao && (window as any).kakao.maps) {
            console.log("Kakao SDK 로드 완료");
            resolve();
          } else {
            console.log("Kakao SDK 로딩 중...");
            setTimeout(checkKakao, 100);
          }
        };
        checkKakao();
      });

      const kakao = (window as any).kakao;
      const radius = 10000; // 10km (미터 단위)

      // 검색할 브랜드 목록
      const brands = [
        { keyword: "스타벅스", image: "starbucks", discountNum: 2500 },
        { keyword: "베스킨라빈스", image: "baskin", discountNum: 3000 },
        { keyword: "메가커피", image: "mega", discountNum: 1800 },
      ];

      // Places 서비스 객체 생성
      const ps = new kakao.maps.services.Places();

      // 모든 브랜드를 병렬로 검색
      const searchPromises = brands.map((brand) => {
        return new Promise<any[]>((resolve, reject) => {
          const options = {
            location: new kakao.maps.LatLng(latitude, longitude),
            radius: radius,
            size: 45,
          };

          ps.keywordSearch(
            brand.keyword,
            (data: any[], status: any) => {
              if (status === kakao.maps.services.Status.OK) {
                console.log(`${brand.keyword} 검색 결과:`, data);
                
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
                
                resolve(stores);
              } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
                console.log(`${brand.keyword} 검색 결과 없음`);
                resolve([]);
              } else {
                console.error(`${brand.keyword} 검색 실패:`, status);
                resolve([]);
              }
            },
            options
          );
        });
      });

      const results = await Promise.all(searchPromises);
      const allStores = results.flat();

      console.log("총 매장 수:", allStores.length);
      setStores(allStores);
      setIsLoadingStores(false);
    } catch (error) {
      console.error("매장 검색 실패:", error);
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
          <Link to="/location">
            <Button 
              variant="outline" 
              className="w-full justify-start h-12 rounded-xl border-border/50 hover:border-primary/50 transition-colors"
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <Loader2 className="w-5 h-5 mr-2 text-primary animate-spin" />
              ) : (
                <MapPin className="w-5 h-5 mr-2 text-primary" />
              )}
              <span className="font-medium">
                {isLoadingLocation ? "위치 확인 중..." : `현재 위치: ${currentLocation}`}
              </span>
            </Button>
          </Link>
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
              <StoreCard key={store.id} {...store} />
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
