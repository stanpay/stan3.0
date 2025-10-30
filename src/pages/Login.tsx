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
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/main`,
        },
      });

      if (error) throw error;

      setOtpSent(true);
      toast({
        title: "인증번호 발송",
        description: "이메일로 인증번호가 발송되었습니다.",
      });
    } catch (error: any) {
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
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) throw error;

      toast({
        title: "로그인 성공",
        description: "환영합니다!",
      });
    } catch (error: any) {
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
                {isLoading ? "발송 중..." : "인증번호 받기"}
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
              {otpSent ? "이메일로 발송된 인증번호를 입력하세요" : "이메일로 간편하게 로그인하세요"}
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
