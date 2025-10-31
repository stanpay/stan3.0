import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

serve(async (req) => {
  const { email, code } = await req.json();
  if (!email || !code) {
    return new Response(JSON.stringify({ error: "필수값 누락" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // DB에서 코드 조회
  const { data, error } = await supabase
    .from("verification_codes")
    .select("*")
    .eq("email", email)
    .single();
  
  if (error || !data) {
    return new Response(JSON.stringify({ valid: false, error: "코드 불일치" }), { 
      status: 404, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  // 만료 여부 체크
  if (data.code === code && new Date(data.expires_at) > new Date()) {
    // 검증 성공 - Supabase Admin API로 사용자 확인/생성
    const { data: authData, error: authError } = await supabase.auth.admin.getUserByEmail(email);
    
    let userId;
    if (authError || !authData?.user) {
      // 사용자가 없으면 생성
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      
      if (createError || !newUser?.user) {
        return new Response(JSON.stringify({ valid: false, error: "사용자 생성 실패" }), { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        });
      }
      
      userId = newUser.user.id;
    } else {
      userId = authData.user.id;
    }
    
    // 인증번호 검증 성공 - 임시 OTP 토큰 생성 후 세션으로 변환
    // Supabase의 generateLink를 사용해서 OTP 토큰 생성
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    
    if (linkError || !linkData) {
      return new Response(JSON.stringify({ valid: false, error: "로그인 토큰 생성 실패" }), { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      });
    }
    
    // 매직링크 URL에서 토큰 추출
    const linkUrl = linkData.properties?.action_link || linkData.properties?.hashed_token || "";
    const tokenMatch = linkUrl.match(/token=([^&]+)/);
    const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : (linkData.properties?.hashed_token || null);
    
    // 클라이언트에서 verifyOtp로 사용할 수 있도록 토큰 반환
    return new Response(JSON.stringify({ 
      valid: true,
      token: token,
      user_id: userId
    }), { headers: { "Content-Type": "application/json" } });
  } else {
    return new Response(JSON.stringify({ valid: false, error: "인증번호가 올바르지 않거나 만료되었습니다." }), { 
      status: 400, 
      headers: { "Content-Type": "application/json" } 
    });
  }
});
