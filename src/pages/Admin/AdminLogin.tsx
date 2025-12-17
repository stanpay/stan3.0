import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { isOperator, checkAdminEmail, updateAdminLastLogin } from "@/lib/admin";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    // 인증 상태 변경 감지
    const checkAdminSession = async (session: any) => {
      if (!isMounted || !session) return;

      try {
        const operator = await isOperator();
        if (!isMounted) return;
        
        if (operator) {
          // replace: true로 히스토리 스택에 추가하지 않음
          navigate("/admin", { replace: true });
        }
      } catch (error) {
        console.error("관리자 세션 확인 오류:", error);
      }
    };

    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (session && !error) {
        checkAdminSession(session);
      }
    });

    // 인증 상태 변경 감지
    subscription = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      if (event === "SIGNED_IN" && session) {
        checkAdminSession(session);
      } else if (event === "SIGNED_OUT") {
        // 로그아웃 시 아무것도 하지 않음 (로그인 페이지에 머무름)
      }
    });

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const trimmedEmail = email.trim();

      // 1단계: admin_users 테이블에서 관리자 이메일인지 확인 (일반 사용자 차단)
      const isAdminEmail = await checkAdminEmail(trimmedEmail);
      if (!isAdminEmail) {
        toast({
          title: "접근 거부",
          description: "관리자만 로그인할 수 있습니다. 일반 사용자는 접근할 수 없습니다.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // 2단계: Supabase Auth로 로그인 시도
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        toast({
          title: "로그인 실패",
          description: error.message || "이메일 또는 비밀번호가 올바르지 않습니다.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // 3단계: 세션이 제대로 설정될 때까지 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 200));

      // 4단계: 관리자 권한 재확인 (이중 검증)
      const operator = await isOperator();
      if (!operator) {
        // 관리자가 아니면 즉시 로그아웃
        await supabase.auth.signOut();
        toast({
          title: "접근 권한 없음",
          description: "관리자 권한이 확인되지 않았습니다.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // 5단계: 로그인 시간 업데이트
      await updateAdminLastLogin(trimmedEmail);

      // 6단계: 관리자 대시보드로 이동
      toast({
        title: "로그인 성공",
        description: "관리자 페이지로 이동합니다.",
      });
      
      // 세션이 완전히 설정될 때까지 약간의 지연 후 이동
      setTimeout(() => {
        navigate("/admin", { replace: true });
      }, 100);
    } catch (error: any) {
      console.error("로그인 오류:", error);
      toast({
        title: "로그인 오류",
        description: error.message || "로그인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>관리자 로그인</CardTitle>
          <CardDescription>
            관리자 전용 이메일과 비밀번호로 로그인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">관리자 이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
              <p className="text-xs text-muted-foreground">
                관리자 전용 이메일로만 로그인 가능합니다
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground text-center">
              ⚠️ 관리자 전용 페이지입니다.<br />
              일반 사용자는 접근할 수 없습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;

