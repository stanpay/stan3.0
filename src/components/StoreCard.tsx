import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

interface StoreCardProps {
  id: string;
  name: string;
  distance: string;
  image: string;
  maxDiscount: string;
}

const StoreCard = ({ id, name, distance, image, maxDiscount }: StoreCardProps) => {
  return (
    <Link to={`/payment/${id}`}>
      <Card className="aspect-square overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border-border/50">
        <div className="h-full flex flex-col">
          <div className="flex-1 bg-primary/10 flex items-center justify-center p-4 relative">
            <div className="text-6xl">{image}</div>
            <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-lg text-xs font-bold">
              최대 {maxDiscount}
            </div>
          </div>
          <div className="p-4 bg-card">
            <h3 className="font-bold text-lg mb-1">{name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
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
