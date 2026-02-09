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
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let hasChecked = false;

    const checkAdmin = async (session?: any): Promise<void> => {
      // 세션이 명시적으로 전달되지 않았을 때만 hasChecked 체크
      if (!session && hasChecked) return;
      
      try {
        // 세션 파라미터가 없으면 직접 확인
        let currentSession = session;
        if (!currentSession) {
          const { data: { session: fetchedSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (!isMounted) return;

          if (sessionError || !fetchedSession) {
            console.log("세션이 없거나 에러:", sessionError?.message || "세션 없음");
            // 세션이 없을 때는 hasChecked를 설정하지 않아서 나중에 재확인 가능하도록 함
            if (isMounted) {
              setIsAdmin(false);
              setIsChecking(false);
              setIsAuthorized(false);
            }
            return;
          }
          currentSession = fetchedSession;
          hasChecked = true; // 세션을 찾았을 때만 체크 플래그 설정
        } else {
          // 세션이 전달된 경우 hasChecked 리셋
          hasChecked = false;
        }

      if (!isMounted) return;

      // 관리자 권한 확인 (타임아웃 없이)
      hasChecked = true; // 권한 확인 시작 전에 체크 플래그 설정
      const operator = await isOperator();

      if (!isMounted) return;

      console.log("관리자 권한 확인 결과:", operator);
      if (isMounted) {
        setIsAdmin(operator);
        setIsChecking(false);
        // 권한 확인이 완료된 후에만 인증 상태 설정
        if (operator) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      }
    } catch (error: any) {
      console.error("관리자 권한 확인 오류:", error);
      if (isMounted) {
        setIsAdmin(false);
        setIsChecking(false);
        setIsAuthorized(false);
      }
    }
  };

    // 인증 상태 변경 감지 (먼저 설정하여 INITIAL_SESSION 이벤트를 받음)
    const authStateChangeResult = supabase.auth.onAuthStateChange(async (event, session) => {
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
            setIsAuthorized(false);
          }
        }
        return;
      }

      // SIGNED_OUT 이벤트 처리
      if (event === "SIGNED_OUT" || !session) {
        if (isMounted) {
          setIsAdmin(false);
          setIsChecking(false);
          setIsAuthorized(false);
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
            setIsAuthorized(false);
          }
        }
      }
    });
    
    const subscription = authStateChangeResult?.data?.subscription;

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
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []); // 한 번만 실행

  // 확인 중이고 아직 권한 확인이 완료되지 않았으면 로딩 표시 (정보 유출 방지)
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

  // 권한 확인이 완료되었고 관리자가 아니면 메인으로 리다이렉트
  if (!isAdmin) {
    return <Navigate to="/main" replace state={{ from: location.pathname }} />;
  }

  // 권한 확인이 완료되었지만 아직 인증되지 않았으면 로딩 표시
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  // 관리자이고 권한 확인이 완료된 경우에만 페이지 표시
  return <>{children}</>;
};

export default AdminRoute;

