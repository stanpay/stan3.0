import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PointsMembership = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [pointsState, setPointsState] = useState({
    "해피포인트": false,
    "CJONE": false,
    "LPoint": false,
    "Hpoint": false,
  });

  const [membershipState, setMembershipState] = useState({
    "스타벅스": false,
    "빽다방": false,
    "투썸": false,
    "메가커피": false,
    "컴포즈커피": false,
    "이디야커피": false,
  });

  const [carrierState, setCarrierState] = useState({
    "SKT": false,
    "KT": false,
    "LG U+": false,
  });

  useEffect(() => {
    const checkUserAndLoadSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsLoggedIn(true);
        
        // Load user's settings from database
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (data && !error) {
          setPointsState({
            "해피포인트": data.happy_point,
            "CJONE": data.cjone,
            "LPoint": data.lpoint,
            "Hpoint": data.hpoint,
          });
          setMembershipState({
            "스타벅스": data.starbucks,
            "빽다방": data.paik,
            "투썸": data.twosome,
            "메가커피": data.mega_coffee,
            "컴포즈커피": data.compose_coffee,
            "이디야커피": data.ediya,
          });
          setCarrierState({
            "SKT": data.skt,
            "KT": data.kt,
            "LG U+": data.lg_uplus,
          });
        }
      } else {
        setIsLoggedIn(false);
        // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
        navigate("/");
        return;
      }
      
      setLoading(false);
    };

    checkUserAndLoadSettings();
  }, [navigate]);

  const handleToggle = async (
    category: "points" | "membership" | "carrier",
    item: string
  ) => {
    if (!isLoggedIn) {
      toast({
        title: "로그인이 필요합니다",
        variant: "destructive",
      });
      return;
    }

    if (category === "points") {
      const newState = { ...pointsState, [item]: !pointsState[item as keyof typeof pointsState] };
      setPointsState(newState);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const columnMap: Record<string, string> = {
          "해피포인트": "happy_point",
          "CJONE": "cjone",
          "LPoint": "lpoint",
          "Hpoint": "hpoint",
        };
        
        await supabase
          .from('user_settings')
          .update({ [columnMap[item]]: newState[item as keyof typeof newState] })
          .eq('user_id', session.user.id);
      }
    } else if (category === "membership") {
      const newState = { ...membershipState, [item]: !membershipState[item as keyof typeof membershipState] };
      setMembershipState(newState);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const columnMap: Record<string, string> = {
          "스타벅스": "starbucks",
          "빽다방": "paik",
          "투썸": "twosome",
          "메가커피": "mega_coffee",
          "컴포즈커피": "compose_coffee",
          "이디야커피": "ediya",
        };
        
        await supabase
          .from('user_settings')
          .update({ [columnMap[item]]: newState[item as keyof typeof newState] })
          .eq('user_id', session.user.id);
      }
    } else {
      const newState = { ...carrierState, [item]: !carrierState[item as keyof typeof carrierState] };
      setCarrierState(newState);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const columnMap: Record<string, string> = {
          "SKT": "skt",
          "KT": "kt",
          "LG U+": "lg_uplus",
        };
        
        await supabase
          .from('user_settings')
          .update({ [columnMap[item]]: newState[item as keyof typeof newState] })
          .eq('user_id', session.user.id);
      }
    }
  };

  const renderItems = (
    items: Record<string, boolean>,
    category: "points" | "membership" | "carrier"
  ) => {
    return (
      <div className="space-y-2">
        {Object.entries(items).map(([name, isEnabled]) => (
          <Card
            key={name}
            className="p-4 flex items-center justify-between rounded-xl border-border/50"
          >
            <span className="font-medium">{name}</span>
            <Switch
              checked={isEnabled}
              onCheckedChange={() => handleToggle(category, name)}
              disabled={!isLoggedIn}
            />
          </Card>
        ))}
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/mypage">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">포인트/멤버십 관리</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {!isLoggedIn && (
          <div className="text-center py-4 mb-4 text-muted-foreground bg-card rounded-xl border border-border">
            로그인 후 이용해주세요
          </div>
        )}
        
        <Tabs defaultValue="points" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="points">포인트</TabsTrigger>
            <TabsTrigger value="membership">멤버십</TabsTrigger>
            <TabsTrigger value="carrier">통신사</TabsTrigger>
          </TabsList>

          <TabsContent value="points">
            {renderItems(pointsState, "points")}
          </TabsContent>

          <TabsContent value="membership">
            {renderItems(membershipState, "membership")}
          </TabsContent>

          <TabsContent value="carrier">
            {renderItems(carrierState, "carrier")}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default PointsMembership;
