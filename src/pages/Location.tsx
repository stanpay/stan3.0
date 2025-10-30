import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, Search, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Location = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const recentLocations = [
    "강남구 역삼동",
    "서초구 서초동",
    "송파구 잠실동",
  ];

  const handleLocationSelect = (location: string) => {
    localStorage.setItem("selectedLocation", location);
    localStorage.removeItem("currentCoordinates");
    navigate("/main");
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "위치 서비스 미지원",
        description: "브라우저가 위치 서비스를 지원하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // 좌표를 저장
        localStorage.setItem("currentCoordinates", JSON.stringify({ latitude, longitude }));
        localStorage.setItem("selectedLocation", "현재 위치");
        
        setIsLoadingLocation(false);
        toast({
          title: "위치 설정 완료",
          description: "현재 위치로 설정되었습니다.",
        });
        navigate("/main");
      },
      (error) => {
        setIsLoadingLocation(false);
        let errorMessage = "위치를 가져올 수 없습니다.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "위치 정보를 사용할 수 없습니다.";
            break;
          case error.TIMEOUT:
            errorMessage = "위치 요청 시간이 초과되었습니다.";
            break;
        }
        
        toast({
          title: "위치 가져오기 실패",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/main">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold flex-1">위치 설정</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="동/읍/면으로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl"
            />
          </div>
        </div>

        {/* Current Location */}
        <Button
          variant="outline"
          className="w-full justify-start h-14 mb-6 rounded-xl border-primary/50 hover:bg-primary/5"
          onClick={handleCurrentLocation}
          disabled={isLoadingLocation}
        >
          {isLoadingLocation ? (
            <Loader2 className="w-5 h-5 mr-3 text-primary animate-spin" />
          ) : (
            <MapPin className="w-5 h-5 mr-3 text-primary" />
          )}
          <span className="font-medium">
            {isLoadingLocation ? "위치 가져오는 중..." : "현재 위치로 설정"}
          </span>
        </Button>

        {/* Recent Locations */}
        <div>
          <h2 className="text-lg font-bold mb-4">최근 위치</h2>
          <div className="space-y-2">
            {recentLocations.map((location) => (
              <Card
                key={location}
                className="p-4 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleLocationSelect(location)}
              >
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="font-medium">{location}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Location;
