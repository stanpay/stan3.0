import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isOperator } from "@/lib/admin";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let hasChecked = false;

    const checkAdmin = async (session?: any): Promise<void> => {
      if (hasChecked) return;
      hasChecked = true;

      try {
        // 세션 파라미터가 없으면 직접 확인
        let currentSession = session;
        if (!currentSession) {
          const { data: { session: fetchedSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (!isMounted) return;

          if (sessionError || !fetchedSession) {
            console.log("세션이 없거나 에러:", sessionError?.message || "세션 없음");
            if (isMounted) {
              setIsAdmin(false);
              setIsChecking(false);
            }
            return;
          }
          currentSession = fetchedSession;
        }

        if (!isMounted) return;

        // 관리자 권한 확인 (타임아웃 없이)
        const operator = await isOperator();

        if (!isMounted) return;

        console.log("관리자 권한 확인 결과:", operator);
        if (isMounted) {
          setIsAdmin(operator);
          setIsChecking(false);
        }
      } catch (error: any) {
        console.error("관리자 권한 확인 오류:", error);
        if (isMounted) {
          setIsAdmin(false);
          setIsChecking(false);
        }
      }
    };

    // 인증 상태 변경 감지 (먼저 설정하여 INITIAL_SESSION 이벤트를 받음)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log("인증 상태 변경:", event, session ? "세션 있음" : "세션 없음");

      // INITIAL_SESSION 이벤트를 먼저 처리 (새로고침 시)
      if (event === "INITIAL_SESSION") {
        if (session) {
          checkAdmin(session);
        } else {
          if (isMounted) {
            setIsAdmin(false);
            setIsChecking(false);
          }
        }
        return;
      }

      // SIGNED_OUT 이벤트 처리
      if (event === "SIGNED_OUT" || !session) {
        if (isMounted) {
          setIsAdmin(false);
          setIsChecking(false);
        }
        return;
      }

      // SIGNED_IN, TOKEN_REFRESHED 이벤트 처리
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session) {
          // hasChecked를 리셋하여 다시 체크 가능하도록 함
          hasChecked = false;
          checkAdmin(session);
        } else {
          if (isMounted) {
            setIsAdmin(false);
            setIsChecking(false);
          }
        }
      }
    });

    // INITIAL_SESSION 이벤트가 오지 않을 경우를 대비한 폴백 (짧은 지연 후)
    timeoutId = setTimeout(() => {
      if (isMounted && !hasChecked) {
        console.log("INITIAL_SESSION 이벤트 대기 중... 직접 확인 실행");
        checkAdmin();
      }
    }, 300);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []); // 한 번만 실행

  // 확인 중이면 로딩 표시
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">관리자 권한 확인 중...</p>
        </div>
      </div>
    );
  }

  // 관리자가 아니면 로그인 페이지로 리다이렉트
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  // 관리자면 페이지 표시
  return <>{children}</>;
};

export default AdminRoute;

