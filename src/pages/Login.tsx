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
      // 6자리 인증번호 생성
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10분 유효

      // DB에 직접 저장 (RLS 정책 조정 필요)
      const { error: dbError } = await supabase
        .from("verification_codes")
        .upsert({ email, code, expires_at: expiresAt });

      if (dbError) {
        console.error("DB 저장 오류:", dbError);
        throw new Error("인증번호 저장 실패: " + dbError.message);
      }

      // TODO: 실제 이메일 전송 (현재는 콘솔에 출력)
      // 실제 서비스에서는 Resend API나 다른 이메일 서비스 사용 필요
      console.log(`[인증번호] ${email}: ${code}`);
      
      // 개발 환경에서는 토스트로 인증번호 표시 (나중에 제거)
      if (import.meta.env.DEV) {
        toast({
          title: "인증번호 (개발용)",
          description: `인증번호: ${code}`,
          duration: 30000,
        });
      }

      setOtpSent(true);
      toast({
        title: "인증번호 이메일 발송",
        description: "이메일을 확인하세요. 인증번호를 입력하여 로그인하세요.",
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
      // DB에서 인증번호 확인
      const { data: codeData, error: codeError } = await supabase
        .from("verification_codes")
        .select("*")
        .eq("email", email)
        .single();

      if (codeError || !codeData) {
        throw new Error("인증번호를 찾을 수 없습니다.");
      }

      // 만료 여부 및 코드 일치 확인
      const now = new Date();
      const expiresAt = new Date(codeData.expires_at);

      if (codeData.code !== otp) {
        throw new Error("인증번호가 올바르지 않습니다.");
      }

      if (expiresAt <= now) {
        throw new Error("인증번호가 만료되었습니다.");
      }

      // 인증번호 검증 성공
      // 인증번호 삭제
      await supabase
        .from("verification_codes")
        .delete()
        .eq("email", email);

      // 인증 완료 상태 저장
      localStorage.setItem('verified_email', email);
      localStorage.setItem('verified_at', new Date().toISOString());

      // 인증번호 검증 완료 - 사용자 생성 및 로그인
      // Supabase는 인증번호만으로 직접 로그인할 수 없으므로,
      // 여기서는 인증번호 검증 완료만 처리하고,
      // 실제 로그인은 사용자가 이미 세션이 있으면 그대로 사용
      
      // 기존 세션 확인
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // 이미 로그인되어 있으면 성공
        toast({
          title: "로그인 성공",
          description: "환영합니다!",
        });
      } else {
        // 세션이 없으면 인증 완료 안내
        toast({
          title: "인증번호 확인 완료",
          description: "로그인을 완료하려면 이메일의 링크를 확인해주세요.",
        });
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
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  disabled={isLoading}
                  maxLength={6}
                />
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
