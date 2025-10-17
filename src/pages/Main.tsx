import { MapPin, ArrowUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoreCard from "@/components/StoreCard";
import BottomNav from "@/components/BottomNav";
import { Link } from "react-router-dom";
import { useState } from "react";

const Main = () => {
  const [sortBy, setSortBy] = useState<"distance" | "discount">("distance");

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
        <div className="max-w-md mx-auto px-4 py-4 space-y-3">
          <Link to="/location">
            <Button 
              variant="outline" 
              className="w-full justify-start h-12 rounded-xl border-border/50 hover:border-primary/50 transition-colors"
            >
              <MapPin className="w-5 h-5 mr-2 text-primary" />
              <span className="font-medium">현재 위치: 강남구 역삼동</span>
            </Button>
          </Link>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="매장 검색..."
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </div>
      </header>

      {/* Store Grid */}
      <main className="max-w-md mx-auto px-4 py-6">
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
