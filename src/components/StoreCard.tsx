import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StoreCardProps {
  id: string;
  name: string;
  distance: string;
  image: string;
  maxDiscount: string | null; // 할인율이 없으면 null
  address?: string;
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
  local_currency_available?: boolean; // 지역화폐 사용가능 여부
  local_currency_discount_rate?: number | null; // 지역화폐 할인율
  parking_available?: boolean; // 주차가능 여부
  free_parking?: boolean; // 무료주차 여부
  parking_size?: string | null; // 주차장 규모 ('넓음', '보통', '좁음')
}

const brandLogos: Record<string, string> = {
  starbucks: "https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNTA4MjlfMjgx%2FMDAxNzU2NDc1MzQ5MDg3.DfBA7igmTBTBDImxB5xYeYo2u0CkoEE7koZ4ftZd88kg.38N8phV00xjgzB4Nxlokk5y-5jQlNguJKmhDGEKH0Tog.PNG%2F4.png&type=sc960_832",
  baskin: "https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyMzAyMjJfODMg%2FMDAxNjc3MDY4NjQ1NTI5.M_v0jLl65iN6AZLntTDRNHLnKpFZo9qV8PLwsOTvC_Ug.t8CrUh9Qz--ZORSdxyWEIwo2ShJTpngAmJ4-1A5ulFkg.PNG.futurara%2F%25BA%25A3%25B6%25F3%25B7%25CE%25B0%25ED.png&type=a340",
  mega: "https://img.79plus.co.kr/megahp/common/img/new_logo.png",
  pascucci: "https://www.pascucci.co.kr/lib/images/common/foot_logo2.png",
  twosome: "https://www.twosome.co.kr/resources/images/content/bi_img_logo_.svg",
};

const StoreCard = ({ 
  id, 
  name, 
  distance, 
  image, 
  maxDiscount, 
  address, 
  isLoggedIn = true, 
  onLoginRequired,
  local_currency_available = false,
  local_currency_discount_rate = null,
  parking_available = false,
  free_parking = false,
  parking_size = null,
}: StoreCardProps) => {
  const navigate = useNavigate();
  const logoSrc = brandLogos[image] || brandLogos.starbucks;
  
  // 매장명 길이에 따라 폰트 크기 자동 조절
  const getFontSizeClass = () => {
    if (name.length <= 8) return "text-base";
    if (name.length <= 12) return "text-sm";
    if (name.length <= 16) return "text-xs";
    return "text-[0.65rem]";
  };

  const handleClick = () => {
    // 로그인 여부와 관계없이 결제 페이지로 이동 (더미 데이터 표시)
    navigate(`/payment/${id}`);
  };

  // 지역화폐 칩 표시 여부
  const showLocalCurrencyChip = local_currency_available && local_currency_discount_rate !== null && local_currency_discount_rate > 0;
  
  // 주차 칩 표시 여부
  const showParkingChip = parking_available;
  
  // 주차 칩 텍스트 생성
  const getParkingText = () => {
    if (!parking_available) return "";
    if (free_parking) {
      return parking_size ? `무료 주차 가능: ${parking_size}` : "무료 주차 가능";
    }
    return parking_size ? `주차 가능: ${parking_size}` : "주차 가능";
  };
  
  return (
    <div onClick={handleClick}>
      <Card className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border-border/50">
        <div className="flex flex-col">
          <div className="flex-1 bg-primary/10 flex items-center justify-center p-4 relative">
            <img 
              src={logoSrc} 
              alt={name}
              className="w-20 h-20 object-contain"
            />
            {maxDiscount && (
              <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-lg text-xs font-bold">
                {maxDiscount}
              </div>
            )}
          </div>
          <div className="p-3 bg-card">
            <h3 className={`font-bold mb-1 whitespace-nowrap ${getFontSizeClass()}`}>{name}</h3>
            <div className="flex items-center text-xs text-muted-foreground mb-2">
              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="break-words">{distance}</span>
            </div>
            {(showLocalCurrencyChip || showParkingChip) && (
              <div className="flex flex-nowrap gap-1 overflow-x-auto scrollbar-hide">
                {showLocalCurrencyChip && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shrink-0">
                    지역화폐 {local_currency_discount_rate}%할인
                  </span>
                )}
                {showParkingChip && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border whitespace-nowrap shrink-0">
                    {getParkingText()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StoreCard;
