import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, Gift, History, Settings, LogOut, Plus } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MyPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string>("user@example.com");
  const [userName, setUserName] = useState<string>("사용자");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const email = session.user.email || "";
        setUserEmail(email);
        
        // 이메일 앞부분을 이름으로 사용
        const displayName = email.split("@")[0];
        setUserName(displayName);
        setIsLoggedIn(true);
      } else {
        // 로그인하지 않은 경우 더미 데이터 사용
        setUserEmail("user@example.com");
        setUserName("사용자");
        setIsLoggedIn(false);
      }
      
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUserEmail("user@example.com");
        setUserName("사용자");
        setIsLoggedIn(false);
      } else if (session) {
        const email = session.user.email || "";
        setUserEmail(email);
        const displayName = email.split("@")[0];
        setUserName(displayName);
        setIsLoggedIn(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "로그아웃 되었습니다",
    });
    navigate("/");
  };

  const menuItems = [
    { icon: Gift, label: "내 기프티콘", path: "/my-gifticons" },
    { icon: History, label: "결제 내역", path: "/history" },
    { icon: Settings, label: "포인트/멤버십 관리", path: "/points-membership" },
    { icon: Settings, label: "결제수단 설정", path: "/payment-methods" },
    { icon: Settings, label: "설정", path: "/settings" },
  ];

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
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">마이페이지</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Profile Section */}
        <Card className="p-6 mb-6 rounded-2xl border-border/50">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xl font-bold">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">{userName}님</h2>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>

          {/* Points Balance */}
          <div className="flex items-center justify-between py-4 border-y border-border my-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">포인트 잔액</p>
              <p className="text-2xl font-bold text-primary">
                {isLoggedIn ? "3,000" : "15,000"} P
              </p>
            </div>
            <Button className="rounded-xl gap-2">
              <Plus className="w-4 h-4" />
              충전
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <Link to="/my-gifticons" className="text-center cursor-pointer hover:opacity-80 transition-opacity">
              <p className="text-2xl font-bold text-primary mb-1">
                {isLoggedIn ? "0" : "12"}
              </p>
              <p className="text-xs text-muted-foreground">보유 기프티콘</p>
            </Link>
            <Link to="/history" className="text-center border-l border-r border-border cursor-pointer hover:opacity-80 transition-opacity">
              <p className="text-2xl font-bold text-primary mb-1">
                {isLoggedIn ? "0" : "45"}
              </p>
              <p className="text-xs text-muted-foreground">결제 횟수</p>
            </Link>
            <Link to="/my-gifticons?filter=사용가능&subFilter=판매중" className="text-center cursor-pointer hover:opacity-80 transition-opacity">
              <p className="text-2xl font-bold text-primary mb-1">
                {isLoggedIn ? "0" : "8"}
              </p>
              <p className="text-xs text-muted-foreground">판매 중</p>
            </Link>
          </div>
        </Card>

        {/* Menu Items */}
        <div className="space-y-2 mb-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Card className="p-4 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer rounded-xl border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Login/Logout Button */}
        {isLoggedIn ? (
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-border/50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            로그아웃
          </Button>
        ) : (
          <Button
            className="w-full h-12 rounded-xl"
            onClick={() => navigate("/")}
          >
            로그인
          </Button>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default MyPage;
