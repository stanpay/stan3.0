import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import starbucksLogo from "@/assets/starbucks-logo.png";
import baskinLogo from "@/assets/baskin-logo.png";
import megaLogo from "@/assets/mega-logo.png";

interface StoreCardProps {
  id: string;
  name: string;
  distance: string;
  image: string;
  maxDiscount: string;
  address?: string;
}

const brandLogos: Record<string, string> = {
  starbucks: starbucksLogo,
  baskin: baskinLogo,
  mega: megaLogo,
};

const StoreCard = ({ id, name, distance, image, maxDiscount, address }: StoreCardProps) => {
  const logoSrc = brandLogos[image] || starbucksLogo;
  
  return (
    <Link to={`/payment/${id}`}>
      <Card className="aspect-square overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border-border/50">
        <div className="h-full flex flex-col">
          <div className="flex-1 bg-primary/10 flex items-center justify-center p-4 relative">
            <img 
              src={logoSrc} 
              alt={name}
              className="w-20 h-20 object-contain"
            />
            <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-lg text-xs font-bold">
              최대 {maxDiscount}
            </div>
          </div>
          <div className="p-3 bg-card">
            <h3 className="font-bold text-base mb-0.5 truncate" title={name}>{name}</h3>
            {address && (
              <p className="text-xs text-muted-foreground mb-1 truncate" title={address}>
                {address}
              </p>
            )}
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{distance}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default StoreCard;
