import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Filter, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

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

  return (
    <div className="min-h-screen bg-background pb-20">
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
          <Button variant="default" className="flex-1">
            전체
          </Button>
          <Button variant="outline" className="flex-1">
            사용가능
          </Button>
          <Button variant="outline" className="flex-1">
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
          {gifticons.map((gifticon) => (
            <Card
              key={gifticon.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square bg-card flex items-center justify-center p-4 border-b border-border relative">
                <div className="text-7xl">{gifticon.image}</div>
                {gifticon.status === "사용완료" && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <Badge variant="secondary" className="text-sm">
                      사용완료
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <p className="text-sm text-muted-foreground">{gifticon.brand}</p>
                <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
                  {gifticon.name}
                </p>
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      gifticon.status === "사용가능" ? "default" : "secondary"
                    }
                    className="text-xs"
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
              </div>
            </Card>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default MyGifticons;
