import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

serve(async (req) => {
  const { email } = await req.json();
  if (!email) {
    return new Response(JSON.stringify({ error: "이메일이 없습니다" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 6자리 인증번호 생성
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10분 유효

  // DB에 저장
  const { error: dbError } = await supabase
    .from("verification_codes")
    .upsert({ email, code, expires_at: expiresAt });

  if (dbError) {
    return new Response(JSON.stringify({ error: "인증번호 저장 실패" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  // 인증번호를 포함한 커스텀 이메일 전송
  // Supabase Admin API를 사용해서 이메일 전송
  // 또는 외부 이메일 API 사용 (Resend, SendGrid 등)
  
  // 방법 1: Supabase가 제공하는 SMTP를 통한 직접 이메일 전송 (설정 필요)
  // 방법 2: 외부 이메일 API 사용 (권장)
  
  // Resend API 사용 예시 (환경변수에 RESEND_API_KEY 설정 필요)
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (RESEND_API_KEY) {
    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "noreply@yourdomain.com", // 실제 도메인으로 변경 필요
          to: email,
          subject: "스탠 - 인증번호",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>인증번호를 확인하세요</h2>
              <p>아래 인증번호를 입력하여 로그인을 완료하세요:</p>
              <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #333; font-size: 32px; margin: 0; letter-spacing: 8px;">${code}</h1>
              </div>
              <p style="color: #666; font-size: 12px;">이 인증번호는 10분간 유효합니다.</p>
              <p style="color: #666; font-size: 12px;">이 요청을 하지 않으셨다면 무시하셔도 됩니다.</p>
            </div>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error("이메일 전송 실패:", await emailResponse.text());
      }
    } catch (emailError) {
      console.error("이메일 전송 오류:", emailError);
    }
  } else {
    // Resend API 키가 없으면 콘솔에만 출력 (개발/테스트용)
    console.log(`[인증번호] ${email}: ${code}`);
    console.warn("RESEND_API_KEY가 설정되지 않아 이메일이 전송되지 않았습니다.");
  }

  return new Response(JSON.stringify({ success: true, code }), { 
    headers: { "Content-Type": "application/json" } 
  });
});
