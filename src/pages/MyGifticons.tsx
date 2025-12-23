import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Filter, ArrowUpDown, Plus, Gift, ArrowLeft } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  expiryDateRaw?: string; // 원본 날짜 문자열 (기한만료 체크용)
  salePrice?: number; // 판매 가격 (used_gifticons에서 가져옴)
}

const MyGifticons = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState<"전체" | "사용가능" | "사용완료" | "판매완료" | "기한만료">("전체");
  const [subFilter, setSubFilter] = useState<"전체" | "보유중" | "판매중">("전체");
  const [gifticons, setGifticons] = useState<Gifticon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedGifticon, setSelectedGifticon] = useState<Gifticon | null>(null);
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false);
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [sellingGifticon, setSellingGifticon] = useState<Gifticon | null>(null);
  const [salePrice, setSalePrice] = useState<string>("");

  useEffect(() => {
    const filter = searchParams.get("filter") as "전체" | "사용가능" | "사용완료" | "판매완료" | "기한만료" | null;
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
        const { data: gifticonsData, error: gifticonsError } = await supabase
          .from('gifticons')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (gifticonsError) {
          console.error("기프티콘 로드 오류:", gifticonsError);
          setLoading(false);
          return;
        }

        // Load used_gifticons for selling status (id로 조인)
        const gifticonIds = gifticonsData?.map(g => g.id) || [];
        let usedGifticonsMap = new Map<string, { sale_price: number; status: string }>();
        
        if (gifticonIds.length > 0) {
          const { data: usedGifticonsData, error: usedGifticonsError } = await supabase
            .from('used_gifticons')
            .select('id, sale_price, status')
            .in('id', gifticonIds);

          if (!usedGifticonsError && usedGifticonsData) {
            usedGifticonsData.forEach(ug => {
              usedGifticonsMap.set(ug.id, { sale_price: ug.sale_price, status: ug.status });
            });
          }
        }

        if (gifticonsData) {
          const formattedGifticons: Gifticon[] = gifticonsData.map(g => {
            const usedGifticon = usedGifticonsMap.get(g.id);
            return {
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
              barcode: (g as any).barcode || undefined,
              expiryDateRaw: g.expiry_date, // 원본 날짜 저장
              salePrice: usedGifticon?.sale_price
            };
          });
          setGifticons(formattedGifticons);
        }
      } else {
        setIsLoggedIn(false);
        // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
        navigate("/");
        return;
      }
      
      setLoading(false);
    };

    checkUserAndLoadGifticons();
  }, [navigate]);

  const filteredGifticons = gifticons.filter((gifticon) => {
    // 기한만료 필터 처리: 만료일이 지났고 상태가 "사용가능"인 것만
    if (filterStatus === "기한만료") {
      if (!gifticon.expiryDateRaw) return false;
      // 상태가 사용완료나 판매완료면 기한만료로 표시하지 않음
      if (gifticon.status === "사용완료" || gifticon.status === "판매완료") {
        return false;
      }
      const expiryDate = new Date(gifticon.expiryDateRaw);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);
      return expiryDate < today;
    }
    
    // 먼저 상위 필터 적용
    if (filterStatus !== "전체" && filterStatus !== "기한만료" && gifticon.status !== filterStatus) {
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

  const handleSellClick = (gifticon: Gifticon) => {
    // 판매완료 상태는 판매 불가
    if (gifticon.status === "판매완료") {
      toast({
        title: "판매 불가",
        description: "판매완료된 기프티콘은 더 이상 판매할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    
    // 사용가능 상태만 판매 가능
    if (gifticon.status !== "사용가능") {
      toast({
        title: "판매 불가",
        description: "사용가능 상태의 기프티콘만 판매할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }
    
    setSellingGifticon(gifticon);
    setSalePrice(gifticon.salePrice?.toString() || "");
    setIsSellDialogOpen(true);
  };

  const handleSellConfirm = async () => {
    if (!sellingGifticon || !isLoggedIn) return;
    
    const price = parseInt(salePrice.replace(/,/g, ''));
    
    // 유효성 검사
    if (isNaN(price) || price <= 0) {
      toast({
        title: "가격 오류",
        description: "올바른 가격을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (price > sellingGifticon.originalPrice) {
      toast({
        title: "가격 오류",
        description: "판매 가격은 원가보다 높을 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // used_gifticons에 레코드 생성 (id를 gifticons.id로 명시 지정)
      const { error: insertError } = await supabase
        .from('used_gifticons')
        .insert({
          id: sellingGifticon.id, // gifticons.id와 동일한 값으로 지정
          seller_id: session.user.id,
          available_at: sellingGifticon.brand,
          name: sellingGifticon.name,
          barcode: sellingGifticon.barcode || '',
          original_price: sellingGifticon.originalPrice,
          sale_price: price,
          expiry_date: sellingGifticon.expiryDateRaw || new Date().toISOString().split('T')[0],
          status: '판매중'
        });

      if (insertError) {
        // 이미 존재하는 경우 업데이트
        if (insertError.code === '23505') { // unique violation
          const { error: updateError } = await supabase
            .from('used_gifticons')
            .update({
              sale_price: price,
              status: '판매중'
            })
            .eq('id', sellingGifticon.id);

          if (updateError) {
            throw updateError;
          }
        } else {
          throw insertError;
        }
      }

      // gifticons.is_selling = true로 업데이트
      const { error: updateGifticonError } = await supabase
        .from('gifticons')
        .update({ is_selling: true })
        .eq('id', sellingGifticon.id);

      if (updateGifticonError) {
        throw updateGifticonError;
      }

      // 로컬 상태 업데이트
      setGifticons(prev => prev.map(g =>
        g.id === sellingGifticon.id 
          ? { ...g, isSelling: true, salePrice: price } 
          : g
      ));

      toast({
        title: "판매 등록 완료",
        description: "기프티콘이 판매중 상태로 등록되었습니다.",
      });

      setIsSellDialogOpen(false);
      setSellingGifticon(null);
      setSalePrice("");
    } catch (error: any) {
      console.error("판매 등록 오류:", error);
      toast({
        title: "판매 등록 실패",
        description: error.message || "판매 등록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleCancelSelling = async (id: string) => {
    if (!isLoggedIn) return;

    try {
      // used_gifticons 레코드 삭제
      const { error: deleteError } = await supabase
        .from('used_gifticons')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // gifticons.is_selling = false로 업데이트
      const { error: updateError } = await supabase
        .from('gifticons')
        .update({ is_selling: false })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // 로컬 상태 업데이트
      setGifticons(prev => prev.map(g =>
        g.id === id ? { ...g, isSelling: false, salePrice: undefined } : g
      ));

      toast({
        title: "판매 취소 완료",
        description: "판매가 취소되었습니다.",
      });
    } catch (error: any) {
      console.error("판매 취소 오류:", error);
      toast({
        title: "판매 취소 실패",
        description: error.message || "판매 취소 중 오류가 발생했습니다.",
        variant: "destructive",
      });
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
    // 판매완료 상태는 바코드 보기 불가
    if (gifticon.status === "판매완료") {
      toast({
        title: "접근 불가",
        description: "판매완료된 기프티콘은 더 이상 확인할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

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
          <Button 
            variant={filterStatus === "기한만료" ? "default" : "outline"} 
            className="flex-1 min-w-[70px]"
            onClick={() => setFilterStatus("기한만료")}
          >
            기한만료
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
                  {gifticon.expiryDateRaw && (() => {
                    // 기한만료는 만료일이 지났고 상태가 사용가능인 것만 표시
                    if (gifticon.status === "사용완료" || gifticon.status === "판매완료") {
                      return null;
                    }
                    const expiryDate = new Date(gifticon.expiryDateRaw);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    expiryDate.setHours(0, 0, 0, 0);
                    return expiryDate < today ? (
                      <div className="absolute inset-0 bg-destructive/60 flex items-center justify-center">
                        <Badge variant="destructive" className="text-sm whitespace-nowrap">
                          기한만료
                        </Badge>
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-sm text-muted-foreground truncate">{gifticon.brand}</p>
                  <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
                    {gifticon.name}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        gifticon.status === "사용가능" ? "default" : 
                        gifticon.status === "판매완료" ? "outline" : "secondary"
                      }
                      className="text-xs whitespace-nowrap"
                    >
                      {gifticon.status}
                    </Badge>
                    {gifticon.isSelling && gifticon.status === "사용가능" && (
                      <Badge variant="default" className="text-xs whitespace-nowrap bg-primary/80">
                        판매중
                      </Badge>
                    )}
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
                        if (gifticon.isSelling) {
                          handleCancelSelling(gifticon.id);
                        } else {
                          handleSellClick(gifticon);
                        }
                      }}
                      disabled={!isLoggedIn || gifticon.status === "판매완료"}
                    >
                      {gifticon.isSelling ? "판매 취소" : "판매하기"}
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
                      disabled={!isLoggedIn || gifticon.status === "판매완료"}
                    >
                      복구
                    </Button>
                  )}
                  {gifticon.status === "판매완료" && (
                    <div className="text-xs text-muted-foreground text-center mt-2">
                      판매 완료된 기프티콘입니다
                    </div>
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

      {/* 판매 가격 입력 모달 */}
      <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>판매 가격 설정</DialogTitle>
            <DialogDescription>
              판매할 가격을 입력해주세요. (최대 {sellingGifticon?.originalPrice.toLocaleString()}원)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="salePrice">판매 가격 (원)</Label>
              <Input
                id="salePrice"
                type="text"
                placeholder="예: 8000"
                value={salePrice}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setSalePrice(value);
                }}
                onBlur={(e) => {
                  const numValue = parseInt(e.target.value.replace(/,/g, ''));
                  if (!isNaN(numValue)) {
                    setSalePrice(numValue.toLocaleString());
                  }
                }}
              />
              {sellingGifticon && (
                <div className="text-sm text-muted-foreground">
                  원가: {sellingGifticon.originalPrice.toLocaleString()}원
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSellDialogOpen(false);
                setSellingGifticon(null);
                setSalePrice("");
              }}
            >
              취소
            </Button>
            <Button onClick={handleSellConfirm}>
              판매 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default MyGifticons;
