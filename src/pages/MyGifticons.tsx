import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Filter, ArrowUpDown, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";

interface Gifticon {
  id: number;
  brand: string;
  name: string;
  originalPrice: number;
  image: string;
  expiryDate: string;
  status: "사용가능" | "사용완료" | "판매완료";
}

const MyGifticons = () => {
  const [filterStatus, setFilterStatus] = useState<"전체" | "사용가능" | "사용완료" | "판매완료">("전체");
  const [subFilter, setSubFilter] = useState<"전체" | "보유중" | "판매중">("전체");
  const [sellingStatus, setSellingStatus] = useState<Record<number, boolean>>({});
  const [restoredStatus, setRestoredStatus] = useState<Record<number, boolean>>({});
  const [gifticonStatus, setGifticonStatus] = useState<Record<number, "사용가능" | "사용완료" | "판매완료">>({});

  const gifticons: Gifticon[] = [
    {
      id: 1,
      brand: "스타벅스",
      name: "카페 아메리카노 Tall",
      originalPrice: 4500,
      image: "☕",
      expiryDate: "2025.12.31",
      status: "사용가능",
    },
    {
      id: 2,
      brand: "CU",
      name: "5천원권",
      originalPrice: 5000,
      image: "🎫",
      expiryDate: "2025.11.30",
      status: "사용가능",
    },
    {
      id: 3,
      brand: "맥도날드",
      name: "빅맥 세트",
      originalPrice: 6500,
      image: "🍔",
      expiryDate: "2025.10.15",
      status: "사용가능",
    },
    {
      id: 4,
      brand: "GS25",
      name: "3천원권",
      originalPrice: 3000,
      image: "🎫",
      expiryDate: "2025.09.20",
      status: "사용완료",
    },
    {
      id: 5,
      brand: "투썸플레이스",
      name: "아메리카노(HOT)",
      originalPrice: 4000,
      image: "☕",
      expiryDate: "2025.12.15",
      status: "사용가능",
    },
    {
      id: 6,
      brand: "배스킨라빈스",
      name: "파인트 아이스크림",
      originalPrice: 8500,
      image: "🍦",
      expiryDate: "2025.11.25",
      status: "사용가능",
    },
  ];

  const filteredGifticons = gifticons.filter((gifticon) => {
    // 현재 기프티콘의 실제 상태 확인 (복구되었으면 사용가능으로 처리)
    const currentStatus = gifticonStatus[gifticon.id] || gifticon.status;
    
    // 먼저 상위 필터 적용
    if (filterStatus !== "전체" && currentStatus !== filterStatus) {
      return false;
    }
    
    // 사용가능 필터 선택 시 추가 필터 적용
    if (filterStatus === "사용가능") {
      if (subFilter === "보유중" && sellingStatus[gifticon.id]) {
        return false;
      }
      if (subFilter === "판매중" && !sellingStatus[gifticon.id]) {
        return false;
      }
    }
    
    return true;
  });

  const toggleSelling = (id: number) => {
    setSellingStatus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const restoreGifticon = (id: number) => {
    setGifticonStatus(prev => ({
      ...prev,
      [id]: "사용가능"
    }));
    setRestoredStatus(prev => ({
      ...prev,
      [id]: true
    }));
  };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/mypage">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">내 기프티콘</h1>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="max-w-md mx-auto px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button 
            variant={filterStatus === "전체" ? "default" : "outline"} 
            className="flex-1 min-w-[70px]"
            onClick={() => setFilterStatus("전체")}
          >
            전체
          </Button>
          <Button 
            variant={filterStatus === "사용가능" ? "default" : "outline"} 
            className="flex-1 min-w-[70px]"
            onClick={() => setFilterStatus("사용가능")}
          >
            사용가능
          </Button>
          <Button 
            variant={filterStatus === "사용완료" ? "default" : "outline"} 
            className="flex-1 min-w-[70px]"
            onClick={() => setFilterStatus("사용완료")}
          >
            사용완료
          </Button>
          <Button 
            variant={filterStatus === "판매완료" ? "default" : "outline"} 
            className="flex-1 min-w-[70px]"
            onClick={() => setFilterStatus("판매완료")}
          >
            판매완료
          </Button>
        </div>
      </div>

      {/* Sub Filter Chips - Only show when "사용가능" is selected */}
      {filterStatus === "사용가능" && (
        <div className="max-w-md mx-auto px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge
              variant={subFilter === "전체" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
              onClick={() => setSubFilter("전체")}
            >
              전체
            </Badge>
            <Badge
              variant={subFilter === "보유중" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
              onClick={() => setSubFilter("보유중")}
            >
              보유중
            </Badge>
            <Badge
              variant={subFilter === "판매중" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1"
              onClick={() => setSubFilter("판매중")}
            >
              판매중
            </Badge>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">전체 브랜드</span>
          <span className="text-muted-foreground">▼</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Filter className="w-5 h-5" />
          <ArrowUpDown className="w-5 h-5" />
        </div>
      </div>

      {/* Gifticons Grid */}
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          {filteredGifticons.map((gifticon) => {
            const currentStatus = gifticonStatus[gifticon.id] || gifticon.status;
            const isRestored = restoredStatus[gifticon.id];
            
            return (
            <Card
              key={gifticon.id}
              className="overflow-hidden hover:shadow-lg transition-shadow w-full"
            >
              <div className="aspect-square bg-card flex items-center justify-center p-4 border-b border-border relative overflow-hidden">
                <div className="text-7xl">{gifticon.image}</div>
                {currentStatus === "사용완료" && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <Badge variant="secondary" className="text-sm whitespace-nowrap">
                      사용완료
                    </Badge>
                  </div>
                )}
                {isRestored && currentStatus === "사용가능" && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="default" className="text-xs whitespace-nowrap">
                      복구됨
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <p className="text-sm text-muted-foreground truncate">{gifticon.brand}</p>
                <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
                  {gifticon.name}
                </p>
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      currentStatus === "사용가능" ? "default" : "secondary"
                    }
                    className="text-xs whitespace-nowrap"
                  >
                    {currentStatus}
                  </Badge>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {gifticon.originalPrice.toLocaleString()}
                  <span className="text-sm font-normal">원</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  ~{gifticon.expiryDate}
                </p>
                {currentStatus === "사용가능" && (
                  <Button
                    variant={sellingStatus[gifticon.id] ? "secondary" : "default"}
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => toggleSelling(gifticon.id)}
                  >
                    {sellingStatus[gifticon.id] ? "판매중" : "판매하기"}
                  </Button>
                )}
                {currentStatus === "사용완료" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => restoreGifticon(gifticon.id)}
                  >
                    복구
                  </Button>
                )}
              </div>
            </Card>
          )})}
        </div>
      </div>

      {/* Add Gifticon Floating Button */}
      <Link to="/sell">
        <Button
          size="icon"
          className="fixed bottom-40 right-6 h-14 w-14 rounded-full shadow-lg z-40 bg-background border-2 border-primary hover:bg-primary/10"
        >
          <Plus className="h-6 w-6 text-primary" />
        </Button>
      </Link>

      <BottomNav />
    </div>
  );
};

export default MyGifticons;
