import { Plus, Filter, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";

interface Product {
  id: number;
  brand: string;
  name: string;
  discount: number;
  originalPrice: number;
  salePrice: number;
  image: string;
  deadline?: string;
}

const Marketplace = () => {
  const products: Product[] = [
    {
      id: 1,
      brand: "투썸플레이스",
      name: "딸기생크림 케이크",
      discount: 27,
      originalPrice: 38000,
      salePrice: 27740,
      image: "🍰",
    },
    {
      id: 2,
      brand: "쉐이크 쉑",
      name: "쉐이크쉑 쉑버거 베이컨 세트",
      discount: 41,
      originalPrice: 19900,
      salePrice: 11700,
      image: "🍔",
      deadline: "12월 23일 남음",
    },
    {
      id: 3,
      brand: "쉐이크 쉑",
      name: "쉐이크쉑 쉑버거 세트",
      discount: 35,
      originalPrice: 18000,
      salePrice: 11700,
      image: "🍔",
    },
    {
      id: 4,
      brand: "메가MGC커피",
      name: "메가커피 아이스 아메리카노",
      discount: 30,
      originalPrice: 4500,
      salePrice: 3150,
      image: "☕",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 w-full overflow-x-hidden relative">
      {/* 추후 서비스 예정 오버레이 */}
      <div className="absolute inset-0 flex items-center justify-center z-50 bg-background/90">
        <div className="bg-muted/90 px-6 py-3 rounded-lg border-2 border-muted-foreground/50">
          <span className="text-base font-semibold text-muted-foreground">
            추후 서비스 예정
          </span>
        </div>
      </div>
      
      {/* Top Banner */}
      <div className="bg-primary text-primary-foreground py-3 text-center font-semibold">
        타상품 교환불가 기프티콘
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="w-full max-w-md mx-auto px-3 py-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="flex-1 text-xs px-2">
              <span className="mr-1">📱</span>
              전체보기
            </Button>
            <Button variant="outline" className="flex-1 text-xs px-2">
              <span className="mr-1">🔍</span>
              상품권류
            </Button>
            <Button variant="outline" className="flex-1 text-xs px-2">
              <span className="mr-1">🛒</span>
              편의점/마트
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="w-full max-w-md mx-auto px-3 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground text-sm">전체 브랜드</span>
          <span className="text-muted-foreground">▼</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Filter className="w-5 h-5" />
          <ArrowUpDown className="w-5 h-5" />
        </div>
      </div>

      {/* Products Grid */}
      <div className="w-full max-w-md mx-auto px-3 py-4">
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-card flex items-center justify-center p-4 border-b border-border relative">
                <div className="text-7xl">{product.image}</div>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-sm text-muted-foreground">{product.brand}</p>
                <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </p>
                <div className="flex items-baseline gap-2">
                  <Badge variant="destructive" className="text-xs">
                    {product.discount}%
                  </Badge>
                  <span className="text-xs text-muted-foreground line-through">
                    {product.originalPrice.toLocaleString()}원
                  </span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {product.salePrice.toLocaleString()}
                  <span className="text-sm font-normal">원</span>
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

export default Marketplace;
