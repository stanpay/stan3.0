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
            setIsLoadingLocation(false);
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

  const storesData = [
    { id: "baskin", name: "베스킨라빈스", distance: "250m", distanceNum: 250, image: "🍦", maxDiscount: "3,000원", discountNum: 3000 },
    { id: "starbucks", name: "스타벅스", distance: "320m", distanceNum: 320, image: "☕", maxDiscount: "2,500원", discountNum: 2500 },
    { id: "mega", name: "메가커피", distance: "450m", distanceNum: 450, image: "☕", maxDiscount: "1,800원", discountNum: 1800 },
    { id: "compose", name: "컴포즈커피", distance: "580m", distanceNum: 580, image: "☕", maxDiscount: "2,200원", discountNum: 2200 },
    { id: "ediya", name: "이디야커피", distance: "620m", distanceNum: 620, image: "☕", maxDiscount: "1,500원", discountNum: 1500 },
    { id: "paik", name: "빽다방", distance: "740m", distanceNum: 740, image: "☕", maxDiscount: "1,200원", discountNum: 1200 },
  ];

  const stores = [...storesData].sort((a, b) => {
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

        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          {stores.map((store) => (
            <StoreCard key={store.id} {...store} />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Main;
