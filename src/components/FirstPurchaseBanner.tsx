import { Alert } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";

const FirstPurchaseBanner = () => {
  return (
    <Alert className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400 rounded-none border-x-0 border-t-0">
      <div className="flex items-center justify-center gap-2 py-2">
        <Sparkles className="w-4 h-4" />
        <span className="font-semibold">첫구매 무료 적용중</span>
      </div>
    </Alert>
  );
};

export default FirstPurchaseBanner;
