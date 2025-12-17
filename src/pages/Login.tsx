import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // 세션이 있고 유효하면 메인으로 이동
      if (session && !error) {
        navigate("/main");
      }
      // 세션이 없거나 에러가 있으면 로그인 페이지에 머물기 (아무것도 하지 않음)
    });

    // Listen for auth state changes (OAuth callback handling)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Login 페이지 인증 상태 변경:", event, session ? "세션 있음" : "세션 없음");
      
      // 관리자 페이지 관련 경로인지 확인
      const isAdminPath = window.location.pathname.startsWith("/admin");
      
      if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
        // 로그아웃 이벤트: 루트에 머물도록 함 (이미 루트에 있으면 아무것도 하지 않음)
        // 단, 관리자 페이지에서는 관리자 로그인 페이지로 이동
        if (isAdminPath) {
          navigate("/admin/login", { replace: true });
        } else if (window.location.pathname !== "/") {
          navigate("/", { replace: true });
        }
      } else if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        // 관리자 페이지 경로가 아니면 메인으로 이동
        // 관리자 페이지는 AdminLogin에서 처리하도록 함
        if (!isAdminPath) {
        navigate("/main");
        }
      } else if (event === "INITIAL_SESSION" && session) {
        // 초기 세션 로드 시 세션이 있으면 메인으로 이동
        // 단, 관리자 페이지 경로가 아니면
        if (!isAdminPath) {
        navigate("/main");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleKakaoLogin = async () => {
    setIsLoading(true);

    try {
      // localhost 환경 감지
      const currentOrigin = window.location.origin;
      const isLocalhost = currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');
      
      // localhost인 경우 무조건 현재 브라우저의 origin 사용 (환경 변수 무시)
      // 배포 환경인 경우 환경 변수 또는 현재 origin 사용
      let siteUrl: string;
      if (isLocalhost) {
        // localhost에서는 항상 현재 브라우저 URL 사용
        siteUrl = currentOrigin;
        console.log('🔗 [localhost 감지] 환경 변수 무시하고 현재 브라우저 URL 사용');
      } else {
        // 배포 환경: 환경 변수 우선, 없으면 현재 origin
        siteUrl = import.meta.env.VITE_SITE_URL || currentOrigin;
        
        // https 보장
        if (!siteUrl.startsWith('http')) {
          siteUrl = `https://${siteUrl}`;
        } else if (siteUrl.startsWith('http://')) {
          siteUrl = siteUrl.replace('http://', 'https://');
        }
      }
      
      // redirectTo URL 생성
      const redirectUrl = `${siteUrl}/main`;
      
      // 상세 로깅
      console.log('🔍 [OAuth 설정 확인]');
      console.log('  - 현재 브라우저 origin:', currentOrigin);
      console.log('  - 환경 변수 VITE_SITE_URL:', import.meta.env.VITE_SITE_URL || '(없음)');
      console.log('  - 최종 사용 siteUrl:', siteUrl);
      console.log('  - redirectTo URL:', redirectUrl);
      console.log('  - localhost 여부:', isLocalhost);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: redirectUrl,
        },
      });
      
      // Supabase가 생성한 OAuth URL 확인
      if (data?.url) {
        console.log('🔗 [Supabase 생성 OAuth URL]:', data.url);
        try {
          const urlObj = new URL(data.url);
          const redirectToParam = urlObj.searchParams.get('redirect_to');
          console.log('  - URL의 redirect_to 파라미터:', redirectToParam || '(없음)');
          
          if (isLocalhost && redirectToParam && !redirectToParam.includes('localhost')) {
            console.warn('⚠️ [경고] redirectTo가 localhost가 아닙니다!');
            console.warn('  - Supabase 대시보드의 Site URL을 localhost로 설정해주세요.');
          }
        } catch (e) {
          console.error('URL 파싱 오류:', e);
        }
      }

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
