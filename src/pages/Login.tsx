import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/main");
      }
    });

    // Listen for auth state changes (OAuth callback handling)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/main");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleKakaoLogin = async () => {
    setIsLoading(true);

    try {
      // 배포 환경 URL 확인
      // 우선순위: 1) VITE_SITE_URL 환경 변수, 2) window.location.origin
      let siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      
      // localhost가 아닌 경우 (배포 환경) 확실하게 처리
      if (!siteUrl.includes('localhost') && !siteUrl.includes('127.0.0.1')) {
        // 배포 환경에서 https로 강제 (Vercel은 자동으로 https)
        if (!siteUrl.startsWith('http')) {
          siteUrl = `https://${siteUrl}`;
        } else if (siteUrl.startsWith('http://') && !siteUrl.includes('localhost')) {
          siteUrl = siteUrl.replace('http://', 'https://');
        }
      }
      
      const redirectUrl = `${siteUrl}/main`;
      
      console.log('🔗 카카오 로그인 리다이렉트 URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("카카오 로그인 오류:", error);
        toast({
          title: "로그인 실패",
          description: error.message || "카카오 로그인 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
      // 성공 시 리다이렉트되므로 여기서는 아무것도 하지 않음
    } catch (error: any) {
      console.error("카카오 로그인 처리 오류:", error);
      toast({
        title: "로그인 실패",
        description: error.message || "카카오 로그인 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-3 text-primary">
            Stan
          </h1>
          <p className="text-muted-foreground text-lg">
            할인의 기준이 되다
          </p>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-xl border border-border/50">
          <div className="space-y-6">
            <button
              onClick={handleKakaoLogin}
              disabled={isLoading}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <img
                src="/assets/kakao_login_large_wide.png"
                alt="카카오 로그인"
                className="w-full h-auto"
              />
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                카카오 계정으로 간편하게 로그인하세요
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                로그인하면 서비스 이용약관 및<br />개인정보 처리방침에 동의하게 됩니다
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            심플하고 스마트한 결제 경험
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
