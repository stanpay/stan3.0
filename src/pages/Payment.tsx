import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Gift, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

const Payment = () => {
  const { storeId } = useParams();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("method1");
  const [purchasedGifticons, setPurchasedGifticons] = useState<number[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const storeNames: Record<string, string> = {
    baskin: "베스킨라빈스",
    starbucks: "스타벅스",
    mega: "메가커피",
    compose: "컴포즈커피",
    ediya: "이디야커피",
    paik: "빽다방",
  };

  const membershipNames: Record<string, string> = {
    baskin: "해피포인트",
    starbucks: "스타벅스 멤버쉽",
    mega: "메가커피 멤버쉽",
    compose: "컴포즈커피 멤버쉽",
    ediya: "이디야 멤버쉽",
    paik: "빽다방 멤버쉽",
  };

  const storeName = storeNames[storeId || ""] || "매장";
  const membershipName = membershipNames[storeId || ""] || "멤버쉽";

  const paymentMethods = [
    { 
      id: "method1", 
      name: "기프티콘 + KT 멤버십 할인 + 해피포인트 적립", 
      discount: "25%",
      benefits: ["기프티콘 10% 할인", "KT 멤버십 10% 추가할인", "해피포인트 5% 적립"]
    },
    { 
      id: "method2", 
      name: "기프티콘 + 해피포인트 적립", 
      discount: "15%",
      benefits: ["기프티콘 10% 할인", "해피포인트 5% 적립"]
    },
    { 
      id: "method3", 
      name: "멤버십 할인", 
      discount: "10%",
      benefits: ["해피포인트 10% 할인"]
    },
  ];

  const gifticons = [
    { id: 1, name: "아메리카노 Tall", price: "4,500원", originalPrice: 4500, discount: "10%", discountAmount: 450 },
    { id: 2, name: "카페라떼 Grande", price: "5,500원", originalPrice: 5500, discount: "15%", discountAmount: 825 },
    { id: 3, name: "프라푸치노 Grande", price: "6,500원", originalPrice: 6500, discount: "20%", discountAmount: 1300 },
  ];

  const handlePurchase = (id: number) => {
    if (purchasedGifticons.includes(id)) {
      setPurchasedGifticons(purchasedGifticons.filter(gifticonId => gifticonId !== id));
    } else {
      setPurchasedGifticons([...purchasedGifticons, id]);
    }
  };

  const handlePayment = () => {
    toast.success("결제가 완료되었습니다!");
  };

  const handleConfirmStep1 = () => {
    setStep(2);
    setCurrentCardIndex(0);
  };

  // 2단계에서 보여줄 총 카드 수 (기프티콘 + 멤버십)
  const totalCards = purchasedGifticons.length + 1;

  const handleNextCard = () => {
    if (currentCardIndex < totalCards - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const BarcodeDisplay = ({ number }: { number: string }) => {
    // 실제 바코드처럼 다양한 두께의 바 패턴 생성
    const bars: { width: number; isBlack: boolean }[] = [];
    
    // 시작 가드 패턴
    bars.push({ width: 2, isBlack: true }, { width: 1, isBlack: false }, { width: 2, isBlack: true });
    
    // 숫자 기반 패턴 생성
    number.split('').forEach((digit) => {
      const num = parseInt(digit);
      // 각 숫자를 2-4개의 바로 표현 (얇은 바, 중간 바, 두꺼운 바)
      const widths = [1, 2, 1, 3, 2, 1, 3, 2, 2, 1];
      const pattern = [true, false, true, false];
      
      pattern.forEach((isBlack, i) => {
        bars.push({ width: widths[(num + i) % widths.length], isBlack });
      });
    });
    
    // 끝 가드 패턴
    bars.push({ width: 2, isBlack: true }, { width: 1, isBlack: false }, { width: 2, isBlack: true });
    
    return (
      <div className="space-y-1">
        <div className="flex gap-0 h-16 items-center justify-center bg-white p-3 rounded-lg">
          {bars.map((bar, i) => (
            <div
              key={i}
              className={bar.isBlack ? 'bg-black' : 'bg-white'}
              style={{
                width: `${bar.width * 2}px`,
                height: '100%',
              }}
            />
          ))}
        </div>
        <p className="text-center font-mono text-xs tracking-widest">{number}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <main className={`max-w-md mx-auto px-4 ${step === 2 ? 'h-screen flex flex-col' : 'py-6 space-y-4'}`}>
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-50">
          {step === 2 ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : (
            <Link to="/main">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
        {step === 1 ? (
          <>
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold mb-4">결제방식 추천</h2>
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    selectedPaymentMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-border"
                  }`}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-sm">{method.name}</h3>
                      </div>
                      <div className="space-y-1">
                        {method.benefits.map((benefit, index) => (
                          <p key={index} className="text-xs text-muted-foreground">
                            • {benefit}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="ml-3 flex flex-col items-end gap-2">
                      <span className="text-lg font-bold text-primary whitespace-nowrap">
                        최대 {method.discount}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentMethod === method.id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {selectedPaymentMethod === method.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Gifticon Section - Only shown when payment method is selected */}
            {selectedPaymentMethod && (
              <Card className="p-5 rounded-2xl border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold">추천 기프티콘</h2>
                </div>
                
                <div className="space-y-3">
                  {gifticons.map((item) => {
                    const isPurchased = purchasedGifticons.includes(item.id);
                    
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl transition-all ${
                          isPurchased ? "bg-primary/10 border-2 border-primary" : "bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-muted-foreground line-through">
                                {item.price}
                              </span>
                              <span className="text-sm font-bold text-primary">
                                {item.discount} ({item.discountAmount.toLocaleString()}원) 할인
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={isPurchased ? "default" : "outline"}
                            className="rounded-lg"
                            onClick={() => handlePurchase(item.id)}
                          >
                            {isPurchased ? "선택됨" : "선택"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Confirm Button */}
            <Button
              onClick={handleConfirmStep1}
              className="w-full h-14 text-lg font-semibold rounded-xl"
            >
              확인
            </Button>
          </>
        ) : (
          <>
            {/* Step 2: Vertical Scroll View - Fixed Layout */}
            <div className="flex gap-3 h-full py-6 overflow-hidden">
              {/* Progress Mini Bar - Vertical */}
              <div className="flex flex-col gap-1.5 justify-start pt-4">
                {Array.from({ length: totalCards }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      index === currentCardIndex
                        ? "h-8 bg-primary"
                        : "h-4 bg-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Scrollable Card Container with Snap - No scrollbar */}
                <div 
                  className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                  style={{
                    scrollSnapType: 'y mandatory',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                  }}
                  onScroll={(e) => {
                    const container = e.currentTarget;
                    const cards = Array.from(container.children);
                    let minDistance = Infinity;
                    let closestIndex = 0;
                    
                    cards.forEach((card, index) => {
                      const rect = (card as HTMLElement).getBoundingClientRect();
                      const containerRect = container.getBoundingClientRect();
                      const distance = Math.abs(rect.top - containerRect.top);
                      
                      if (distance < minDistance) {
                        minDistance = distance;
                        closestIndex = index;
                      }
                    });
                    
                    if (closestIndex !== currentCardIndex) {
                      setCurrentCardIndex(closestIndex);
                    }
                  }}
                >
                  {/* Gifticon Cards */}
                  {purchasedGifticons.map((id, index) => {
                    const gifticon = gifticons.find(g => g.id === id);
                    if (!gifticon) return null;
                    
                    return (
                      <div
                        key={`gifticon-${id}`}
                        className="snap-start w-full flex-shrink-0"
                        style={{
                          scrollSnapAlign: 'start',
                          scrollSnapStop: 'always',
                          marginBottom: index === purchasedGifticons.length - 1 && totalCards === purchasedGifticons.length ? '0' : '1rem'
                        }}
                      >
                        <Card className="p-4 rounded-2xl border-border/50">
                          <div className="space-y-3">
                            <BarcodeDisplay number={`8801234${id.toString().padStart(6, "0")}`} />
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Gift className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">기프티콘</p>
                                <p className="font-bold text-sm">{gifticon.name}</p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    );
                  })}

                  {/* Membership Card */}
                  <div 
                    className="snap-start w-full flex-shrink-0"
                    style={{
                      scrollSnapAlign: 'start',
                      scrollSnapStop: 'always',
                    }}
                  >
                    <Card className="p-4 rounded-2xl border-border/50">
                      <div className="space-y-3">
                        <BarcodeDisplay number="1234567890123" />
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                              <CreditCard className="w-4 h-4 text-secondary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">멤버십</p>
                              <p className="font-bold text-sm">{membershipName}</p>
                            </div>
                          </div>
                          {storeId === "starbucks" && (
                            <div className="flex items-center gap-2 text-xs pl-[44px]">
                              <span className="text-muted-foreground">적립 가능 별:</span>
                              <span>⭐⭐⭐</span>
                            </div>
                          )}
                          {storeId === "baskin" && (
                            <div className="flex items-center gap-2 text-xs pl-[44px]">
                              <span className="text-muted-foreground">보유 포인트:</span>
                              <span className="font-semibold">1,500P</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Fixed Bottom Button */}
                <div className="flex-shrink-0 pt-4">
                  <Button
                    onClick={handlePayment}
                    className="w-full h-14 text-lg font-semibold rounded-xl"
                  >
                    결제수단 선택
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Payment;
