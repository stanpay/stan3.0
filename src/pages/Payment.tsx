import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Gift, CreditCard } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

const Payment = () => {
  const { storeId } = useParams();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("method1");
  const [purchasedGifticons, setPurchasedGifticons] = useState<number[]>([]);

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
    { id: 1, name: "아메리카노 Tall", price: "4,500원", discount: "10%" },
    { id: 2, name: "카페라떼 Grande", price: "5,500원", discount: "15%" },
    { id: 3, name: "프라푸치노 Grande", price: "6,500원", discount: "20%" },
  ];

  const handlePurchase = (id: number) => {
    setPurchasedGifticons([...purchasedGifticons, id]);
    toast.success("기프티콘이 발급되었습니다!");
  };

  const handlePayment = () => {
    toast.success("결제가 완료되었습니다!");
  };

  const handleConfirmStep1 = () => {
    if (purchasedGifticons.length === 0) {
      toast.error("기프티콘을 선택해주세요!");
      return;
    }
    setStep(2);
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
      <div className="space-y-2">
        <div className="flex gap-0 h-24 items-center justify-center bg-white p-4 rounded-lg">
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
        <p className="text-center font-mono text-sm tracking-widest">{number}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/main">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold flex-1">{storeName}</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
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
                                {item.discount} 할인
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
            {/* Step 2: Barcodes */}
            <div className="space-y-4">
              {/* Purchased Gifticons Barcodes */}
              {purchasedGifticons.length > 0 && (
                <Card className="p-5 rounded-2xl border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold">기프티콘</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {purchasedGifticons.map((id) => {
                      const gifticon = gifticons.find(g => g.id === id);
                      if (!gifticon) return null;
                      
                      return (
                        <div key={id} className="space-y-3 p-4 bg-muted/50 rounded-xl">
                          <p className="font-semibold text-center">{gifticon.name}</p>
                          <BarcodeDisplay number={`8801234${id.toString().padStart(6, "0")}`} />
                          <p className="text-xs text-center text-muted-foreground">
                            유효기간: 2025.12.31
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Membership Barcode */}
              <Card className="p-5 rounded-2xl border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-secondary" />
                  </div>
                  <h2 className="text-lg font-bold">멤버십</h2>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl space-y-3">
                  <p className="font-semibold text-center">{membershipName}</p>
                  <BarcodeDisplay number="1234567890123" />
                  {storeId === "starbucks" && (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <span className="text-muted-foreground">적립 가능 별:</span>
                      <span>⭐⭐⭐</span>
                    </div>
                  )}
                  {storeId === "baskin" && (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <span className="text-muted-foreground">보유 포인트:</span>
                      <span className="font-semibold">1,500P</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Payment Method Selection Button */}
            <Button
              onClick={handlePayment}
              className="w-full h-14 text-lg font-semibold rounded-xl"
            >
              결제수단 선택
            </Button>
          </>
        )}
      </main>
    </div>
  );
};

export default Payment;
