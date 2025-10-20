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
  status: "사용가능" | "사용완료";
}

const MyGifticons = () => {
  const [filterStatus, setFilterStatus] = useState<"전체" | "사용가능" | "사용완료">("전체");
  const [sellingStatus, setSellingStatus] = useState<Record<number, boolean>>({});

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
    if (filterStatus === "전체") return true;
    return gifticon.status === filterStatus;
  });

  const toggleSelling = (id: number) => {
    setSellingStatus(prev => ({
      ...prev,
      [id]: !prev[id]
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
        <div className="flex items-center gap-3">
          <Button 
            variant={filterStatus === "전체" ? "default" : "outline"} 
            className="flex-1"
            onClick={() => setFilterStatus("전체")}
          >
            전체
          </Button>
          <Button 
            variant={filterStatus === "사용가능" ? "default" : "outline"} 
            className="flex-1"
            onClick={() => setFilterStatus("사용가능")}
          >
            사용가능
          </Button>
          <Button 
            variant={filterStatus === "사용완료" ? "default" : "outline"} 
            className="flex-1"
            onClick={() => setFilterStatus("사용완료")}
          >
            사용완료
          </Button>
        </div>
      </div>

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
          {filteredGifticons.map((gifticon) => (
            <Card
              key={gifticon.id}
              className="overflow-hidden hover:shadow-lg transition-shadow w-full"
            >
              <div className="aspect-square bg-card flex items-center justify-center p-4 border-b border-border relative overflow-hidden">
                <div className="text-7xl">{gifticon.image}</div>
                {gifticon.status === "사용완료" && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <Badge variant="secondary" className="text-sm whitespace-nowrap">
                      사용완료
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
                      gifticon.status === "사용가능" ? "default" : "secondary"
                    }
                    className="text-xs whitespace-nowrap"
                  >
                    {gifticon.status}
                  </Badge>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {gifticon.originalPrice.toLocaleString()}
                  <span className="text-sm font-normal">원</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  ~{gifticon.expiryDate}
                </p>
                {gifticon.status === "사용가능" && (
                  <Button
                    variant={sellingStatus[gifticon.id] ? "secondary" : "default"}
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => toggleSelling(gifticon.id)}
                  >
                    {sellingStatus[gifticon.id] ? "판매중" : "판매하기"}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Gifticon Floating Button */}
      <Link to="/sell">
        <Button
          size="icon"
          className="fixed bottom-44 right-6 h-16 w-16 rounded-full shadow-lg z-40 bg-background border-2 border-primary hover:bg-primary/10"
        >
          <Plus className="h-7 w-7 text-primary" />
        </Button>
      </Link>

      <BottomNav />
    </div>
  );
};

export default MyGifticons;
