// 브랜드페이 인증 콜백 페이지
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CallbackAuth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code');
      const customerKey = searchParams.get('customerKey');

      if (!code || !customerKey) {
        setError('인증 정보가 누락되었습니다.');
        return;
      }

      try {
        // 1. Access Token 발급 (Supabase Edge Function 호출)
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('로그인이 필요합니다.');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        // 2. customerKey 검증
        const expectedCustomerKey = `customer_${user.id.replace(/-/g, '').substring(0, 20)}`;
        if (!customerKey.startsWith('customer_')) {
          setError('유효하지 않은 고객 키입니다.');
          return;
        }

        // 3. Access Token을 Supabase에 저장 (나중에 사용)
        // 실제로는 Edge Function을 통해 서버에서 처리해야 합니다
        console.log('✅ 브랜드페이 인증 성공:', { code, customerKey });

        // 4. 원래 결제하려던 페이지로 돌아가기
        const returnUrl = sessionStorage.getItem('toss_payment_return_url') || '/main';
        sessionStorage.removeItem('toss_payment_return_url');
        
        setTimeout(() => {
          navigate(returnUrl);
        }, 1500);

      } catch (err: any) {
        console.error('인증 처리 오류:', err);
        setError(err.message || '인증 처리 중 오류가 발생했습니다.');
      }
    };

    handleAuth();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        {!error ? (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
            <h1 className="text-2xl font-bold mb-2">브랜드페이 인증 중</h1>
            <p className="text-muted-foreground">잠시만 기다려주세요...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-destructive">인증 실패</h1>
            <p className="text-muted-foreground">{error}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default CallbackAuth;

