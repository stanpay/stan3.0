import { supabase } from "@/integrations/supabase/client";

/**
 * 현재 사용자가 운영자인지 확인하는 함수
 * 환경변수 VITE_OPERATOR_EMAIL에 설정된 이메일 주소와 비교
 */
export async function isOperator(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.email) {
      return false;
    }

    const operatorEmail = import.meta.env.VITE_OPERATOR_EMAIL;
    
    if (!operatorEmail) {
      // 환경변수가 없으면 기본값으로 설정 (개발 환경)
      console.warn("VITE_OPERATOR_EMAIL 환경변수가 설정되지 않았습니다.");
      return false;
    }

    return session.user.email === operatorEmail;
  } catch (error) {
    console.error("운영자 확인 중 오류 발생:", error);
    return false;
  }
}

/**
 * 현재 사용자가 운영자인지 확인하는 동기 함수 (세션이 이미 확인된 경우)
 */
export function checkOperatorEmail(email: string | undefined): boolean {
  if (!email) {
    return false;
  }

  const operatorEmail = import.meta.env.VITE_OPERATOR_EMAIL;
  
  if (!operatorEmail) {
    return false;
  }

  return email === operatorEmail;
}

