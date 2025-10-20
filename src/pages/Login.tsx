import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Login = () => {
  const handleKakaoLogin = () => {
    // 카카오 로그인 로직은 나중에 구현
    console.log("카카오 로그인");
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
          <Button 
            onClick={handleKakaoLogin}
            className="w-full h-14 text-lg font-semibold bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#000000] rounded-xl"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            카카오톡으로 시작하기
          </Button>

          <Link to="/main" className="block mt-4">
            <Button 
              variant="outline"
              className="w-full h-14 text-lg font-semibold rounded-xl"
            >
              데모 구경하기
            </Button>
          </Link>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
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
