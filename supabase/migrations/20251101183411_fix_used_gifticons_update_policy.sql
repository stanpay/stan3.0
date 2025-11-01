-- Fix UPDATE policy for used_gifticons
-- 기존 정책 제거
DROP POLICY IF EXISTS "Users can update gifticons" ON public.used_gifticons;

-- 통합 UPDATE 정책: 모든 필요한 경우를 하나의 정책으로 처리
CREATE POLICY "Users can update gifticons"
  ON public.used_gifticons FOR UPDATE
  USING (
    -- 기존 행 조건:
    -- 1. 판매중인 기프티콘을 예약하는 경우 (reserved_by가 NULL)
    -- 2. 자신이 예약한 기프티콘을 관리하는 경우 (reserved_by가 자신)
    (
      (status = '판매중' AND reserved_by IS NULL AND auth.role() = 'authenticated')
      OR
      (auth.uid() = reserved_by)
    )
  )
  WITH CHECK (
    -- 새 행 조건:
    -- 1. 예약: reserved_by가 현재 사용자이고 status가 '대기중'
    -- 2. 예약 해제: reserved_by가 NULL이고 status가 '판매중'
    -- 3. 결제 완료: reserved_by가 현재 사용자이고 status가 '판매완료'
    (
      (auth.uid() = reserved_by AND status = '대기중')
      OR
      (reserved_by IS NULL AND status = '판매중')
      OR
      (auth.uid() = reserved_by AND status = '판매완료')
    )
  );

