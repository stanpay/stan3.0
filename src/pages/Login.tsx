import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/main");
      }
    });

    // Note: 매직링크는 /main으로 리다이렉트되므로 Login 페이지를 거치지 않습니다.
    // 매직링크 처리는 Main.tsx에서 수행됩니다.
    // 하지만 혹시 / 경로에서 매직링크가 들어올 경우를 대비해 처리 로직 유지
    const urlParams = new URLSearchParams(window.location.search);
    const tokenHash = urlParams.get('token_hash');
    
    if (tokenHash) {
      console.log("🔗 [Login] 매직링크 감지 - Main으로 리다이렉트 필요");
      // Main 페이지로 리다이렉트하여 매직링크 처리
      navigate(`/main?token_hash=${tokenHash}&type=${urlParams.get('type') || 'email'}`);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/main");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 배포 환경 URL 확인
      // 우선순위: 1) VITE_SITE_URL 환경 변수, 2) window.location.origin, 3) fallback
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
      
      console.log('🔗 Redirect URL:', redirectUrl);

      // Supabase의 기본 이메일 인증 방식 사용
      // 매직링크와 OTP가 모두 포함된 이메일을 발송합니다
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          // 사용자가 없으면 자동으로 회원가입
          shouldCreateUser: true,
          // 리다이렉트 URL 설정 (매직링크 클릭 시 이동할 주소)
          // 배포 환경에서는 환경 변수의 URL 사용, 개발 환경에서는 현재 origin 사용
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("이메일 발송 오류:", error);
        
        // Rate Limit 오류에 대한 더 친절한 메시지
        let errorMessage = error.message || "이메일 발송 중 오류가 발생했습니다.";
        if (error.message?.includes('rate limit') || error.message?.includes('after')) {
          // Rate limit 오류 메시지에서 시간 추출 시도
          const timeMatch = error.message.match(/(\d+)\s*(second|초)/i);
          if (timeMatch) {
            errorMessage = `보안을 위해 ${timeMatch[1]}초 후에 다시 시도해주세요.`;
          } else {
            errorMessage = "잠시 후 다시 시도해주세요. 보안을 위해 이메일 재전송에 제한이 있습니다.";
          }
        }
        
        throw new Error(errorMessage);
      }

      setOtpSent(true);
      toast({
        title: "인증 이메일 발송 완료",
        description: "이메일을 확인하세요. 인증번호를 입력하거나 매직링크를 클릭하여 로그인하세요.",
      });
    } catch (error: any) {
      console.error("인증번호 발송 오류:", error);
      toast({
        title: "발송 실패",
        description: error.message || "인증번호 발송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 입력된 OTP 코드 정리 (공백 제거)
      const cleanOtp = otp.trim().replace(/\s/g, '');
      
      if (!cleanOtp || cleanOtp.length !== 6) {
        throw new Error("인증번호는 6자리 숫자여야 합니다.");
      }

      // Supabase의 기본 OTP 검증 방식 사용
      const {
        data: { session, user },
        error,
      } = await supabase.auth.verifyOtp({
        email: email,
        token: cleanOtp,
        type: 'email',
      });

      if (error) {
        console.error("OTP 검증 오류:", error);
        
        // 더 자세한 오류 메시지 제공
        let errorMessage = "인증번호가 올바르지 않습니다.";
        if (error.message?.includes('expired') || error.code === 'otp_expired') {
          errorMessage = "인증번호가 만료되었습니다. 새로운 인증번호를 요청해주세요.";
        } else if (error.message?.includes('invalid') || error.code === 'invalid_token') {
          errorMessage = "인증번호가 올바르지 않습니다. 다시 확인해주세요.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }

      if (session && user) {
        // 로그인 성공 - 세션 생성됨
        toast({
          title: "로그인 성공",
          description: "환영합니다!",
        });
        
        // 메인 페이지로 이동 (useEffect에서 자동으로 처리되지만 명시적으로 이동)
        navigate("/main");
      } else {
        throw new Error("세션을 생성할 수 없습니다.");
      }
    } catch (error: any) {
      console.error("인증번호 검증 오류:", error);
      toast({
        title: "인증 실패",
        description: error.message || "인증번호를 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <MessageCircle className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-3 text-foreground">
            스탠
          </h1>
          <p className="text-muted-foreground text-lg">
            결제의 기준이 되다
          </p>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-xl border border-border/50">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <Button 
                type="submit"
                className="w-full h-12 text-lg font-semibold rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? "발송 중..." : "인증 이메일 받기"}
              </Button>

              <Button 
                type="button"
                variant="outline"
                className="w-full h-12 text-lg font-semibold rounded-xl"
                onClick={() => navigate("/main")}
              >
                데모 구경하기
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-display">이메일</Label>
                <Input
                  id="email-display"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">인증번호</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="6자리 인증번호를 입력하세요"
                  value={otp}
                  onChange={(e) => {
                    // 숫자만 입력 허용
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setOtp(value);
                  }}
                  required
                  disabled={isLoading}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                />
                <p className="text-xs text-muted-foreground">
                  이메일에 받은 6자리 인증번호를 입력하세요. 인증번호는 60분간 유효합니다.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 text-lg font-semibold rounded-xl"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                  }}
                  disabled={isLoading}
                >
                  다시 받기
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 h-12 text-lg font-semibold rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? "확인 중..." : "로그인"}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {otpSent 
                ? "이메일의 인증번호를 입력하여 로그인하세요" 
                : "이메일로 인증번호를 받아 간편하게 로그인하세요"
              }
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              로그인하면 서비스 이용약관 및<br />개인정보 처리방침에 동의하게 됩니다
            </p>
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
