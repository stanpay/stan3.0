import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Filter, ArrowUpDown, Plus, Gift, ArrowLeft } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import JsBarcode from "jsbarcode";

interface Gifticon {
  id: string;
  brand: string;
  name: string;
  originalPrice: number;
  image: string;
  expiryDate: string;
  status: "사용가능" | "사용완료" | "판매완료";
  isSelling: boolean;
  barcode?: string;
}

const MyGifticons = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState<"전체" | "사용가능" | "사용완료" | "판매완료">("전체");
  const [subFilter, setSubFilter] = useState<"전체" | "보유중" | "판매중">("전체");
  const [gifticons, setGifticons] = useState<Gifticon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedGifticon, setSelectedGifticon] = useState<Gifticon | null>(null);
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false);

  useEffect(() => {
    const filter = searchParams.get("filter") as "전체" | "사용가능" | "사용완료" | "판매완료" | null;
    const subFilterParam = searchParams.get("subFilter") as "전체" | "보유중" | "판매중" | null;
    
    if (filter) {
      setFilterStatus(filter);
    }
    if (subFilterParam) {
      setSubFilter(subFilterParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkUserAndLoadGifticons = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsLoggedIn(true);
        
        // Load user's gifticons from database
        const { data, error } = await supabase
          .from('gifticons')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (data && !error) {
          const formattedGifticons: Gifticon[] = data.map(g => ({
            id: g.id,
            brand: g.brand,
            name: g.name,
            originalPrice: g.original_price,
            image: g.image,
            expiryDate: new Date(g.expiry_date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\. /g, '.').replace(/\.$/, ''),
            status: g.status as "사용가능" | "사용완료" | "판매완료",
            isSelling: g.is_selling || false,
            barcode: (g as any).barcode || undefined
          }));
          setGifticons(formattedGifticons);
        }
      } else {
        setIsLoggedIn(false);
        // Show dummy data for non-logged in users
        const dummyGifticons: Gifticon[] = [
          {
            id: "1",
            brand: "스타벅스",
            name: "카페 아메리카노 Tall",
            originalPrice: 4500,
            image: "☕",
            expiryDate: "2025.12.31",
            status: "사용가능",
            isSelling: false,
            barcode: "1234567890123",
          },
          {
            id: "2",
            brand: "CU",
            name: "5천원권",
            originalPrice: 5000,
            image: "🎫",
            expiryDate: "2025.11.30",
            status: "사용가능",
            isSelling: false,
            barcode: "2345678901234",
          },
          {
            id: "3",
            brand: "맥도날드",
            name: "빅맥 세트",
            originalPrice: 6500,
            image: "🍔",
            expiryDate: "2025.10.15",
            status: "사용가능",
            isSelling: false,
            barcode: "3456789012345",
          },
          {
            id: "4",
            brand: "GS25",
            name: "3천원권",
            originalPrice: 3000,
            image: "🎫",
            expiryDate: "2025.09.20",
            status: "사용완료",
            isSelling: false,
            barcode: "4567890123456",
          },
          {
            id: "5",
            brand: "투썸플레이스",
            name: "아메리카노(HOT)",
            originalPrice: 4000,
            image: "☕",
            expiryDate: "2025.12.15",
            status: "사용가능",
            isSelling: false,
            barcode: "5678901234567",
          },
          {
            id: "6",
            brand: "배스킨라빈스",
            name: "파인트 아이스크림",
            originalPrice: 8500,
            image: "🍦",
            expiryDate: "2025.11.25",
            status: "사용가능",
            isSelling: false,
            barcode: "6789012345678",
          },
        ];
        setGifticons(dummyGifticons);
      }
      
      setLoading(false);
    };

    checkUserAndLoadGifticons();
  }, []);

  const filteredGifticons = gifticons.filter((gifticon) => {
    // 먼저 상위 필터 적용
    if (filterStatus !== "전체" && gifticon.status !== filterStatus) {
      return false;
    }
    
    // 사용가능 필터 선택 시 추가 필터 적용
    if (filterStatus === "사용가능") {
      if (subFilter === "보유중" && gifticon.isSelling) {
        return false;
      }
      if (subFilter === "판매중" && !gifticon.isSelling) {
        return false;
      }
    }
    
    return true;
  });

  const toggleSelling = async (id: string) => {
    if (!isLoggedIn) return;

    const gifticon = gifticons.find(g => g.id === id);
    if (!gifticon) return;

    const newSellingStatus = !gifticon.isSelling;

    const { error } = await supabase
      .from('gifticons')
      .update({ is_selling: newSellingStatus })
      .eq('id', id);

    if (!error) {
      setGifticons(prev => prev.map(g =>
        g.id === id ? { ...g, isSelling: newSellingStatus } : g
      ));
    }
  };

  const restoreGifticon = async (id: string) => {
    if (!isLoggedIn) return;

    const { error } = await supabase
      .from('gifticons')
      .update({ status: '사용가능' })
      .eq('id', id);

    if (!error) {
      setGifticons(prev => prev.map(g =>
        g.id === id ? { ...g, status: '사용가능' as const } : g
      ));
      toast({
        title: "복구 완료",
        description: "기프티콘이 사용가능 상태로 변경되었습니다.",
      });
    } else {
      toast({
        title: "복구 실패",
        description: error.message || "기프티콘 복구 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleGifticonClick = (gifticon: Gifticon) => {
    if (!gifticon.barcode) {
      toast({
        title: "바코드 없음",
        description: "이 기프티콘에는 바코드가 없습니다.",
        variant: "destructive",
      });
      return;
    }
    setSelectedGifticon(gifticon);
    setIsBarcodeDialogOpen(true);
  };

  const handleCloseBarcode = () => {
    setIsBarcodeDialogOpen(false);
    setSelectedGifticon(null);
  };

  const BarcodeDisplay = ({ number }: { number: string }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
      if (svgRef.current && number) {
        try {
          // 숫자만 추출 (문자열이 있을 수 있음)
          const barcodeNumber = number.replace(/\D/g, '');
          
          if (barcodeNumber.length === 0) {
            return;
          }

          // EAN-13 형식인지 확인 (13자리)
          if (barcodeNumber.length === 13) {
            try {
              JsBarcode(svgRef.current, barcodeNumber, {
                format: "EAN13",
                width: 2,
                height: 80,
                displayValue: false,
                background: "transparent",
                lineColor: "#000000",
                margin: 0,
              });
            } catch (ean13Error) {
              // EAN-13 체크섬 오류 시 CODE128로 대체
              console.warn("EAN13 체크섬 오류, CODE128로 변경:", ean13Error);
              JsBarcode(svgRef.current, barcodeNumber, {
                format: "CODE128",
                width: 2,
                height: 80,
                displayValue: false,
                background: "transparent",
                lineColor: "#000000",
                margin: 0,
              });
            }
          } else if (barcodeNumber.length === 8) {
            // EAN-8 형식 (8자리)
            try {
              JsBarcode(svgRef.current, barcodeNumber, {
                format: "EAN8",
                width: 2,
                height: 80,
                displayValue: false,
                background: "transparent",
                lineColor: "#000000",
                margin: 0,
              });
            } catch (ean8Error) {
              // EAN-8 체크섬 오류 시 CODE128로 대체
              console.warn("EAN8 체크섬 오류, CODE128로 변경:", ean8Error);
              JsBarcode(svgRef.current, barcodeNumber, {
                format: "CODE128",
                width: 2,
                height: 80,
                displayValue: false,
                background: "transparent",
                lineColor: "#000000",
                margin: 0,
              });
            }
          } else {
            // CODE128 형식 (다양한 길이 지원)
            JsBarcode(svgRef.current, barcodeNumber, {
              format: "CODE128",
              width: 2,
              height: 80,
              displayValue: false,
              background: "transparent",
              lineColor: "#000000",
              margin: 0,
            });
          }
        } catch (error) {
          console.error("바코드 생성 오류:", error);
        }
      }
    }, [number]);

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-center bg-white p-3 rounded-lg">
          <svg
            ref={svgRef}
            className="max-w-full h-20"
            style={{ maxHeight: '80px' }}
          />
        </div>
        <p className="text-center font-mono text-xs tracking-widest">{number}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  // 바코드 화면 표시
  if (isBarcodeDialogOpen && selectedGifticon) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header with Back Button */}
        <header className="sticky top-0 z-50 bg-card border-b border-border">
          <div className="max-w-md mx-auto py-4 px-4 relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={handleCloseBarcode}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Barcode Card */}
        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="p-4 rounded-2xl border-border/50">
            <div className="space-y-3">
              <BarcodeDisplay number={selectedGifticon.barcode || ""} />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">기프티콘</p>
                  <p className="font-bold text-sm">{selectedGifticon.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedGifticon.originalPrice.toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </main>
      </div>
    );
  }

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
          {filteredGifticons.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-muted-foreground">
              {isLoggedIn ? "기프티콘이 없습니다" : "로그인 후 이용해주세요"}
            </div>
          ) : (
            filteredGifticons.map((gifticon) => (
              <Card
                key={gifticon.id}
                className="overflow-hidden hover:shadow-lg transition-shadow w-full cursor-pointer"
                onClick={() => handleGifticonClick(gifticon)}
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
                      variant={gifticon.isSelling ? "secondary" : "default"}
                      size="sm"
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelling(gifticon.id);
                      }}
                      disabled={!isLoggedIn}
                    >
                      {gifticon.isSelling ? "판매중" : "판매하기"}
                    </Button>
                  )}
                  {gifticon.status === "사용완료" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreGifticon(gifticon.id);
                      }}
                      disabled={!isLoggedIn}
                    >
                      복구
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
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
