-- Allow 'admin' as seller_id in used_gifticons table while maintaining foreign key constraint for UUIDs
-- seller_id를 text 타입으로 변경 (UUID와 'admin' 모두 허용)
ALTER TABLE public.used_gifticons 
  DROP CONSTRAINT IF EXISTS used_gifticons_seller_id_fkey;

ALTER TABLE public.used_gifticons 
  ALTER COLUMN seller_id TYPE text USING seller_id::text;

-- CHECK 제약: 'admin'이거나 유효한 UUID 형식이어야 함
ALTER TABLE public.used_gifticons
  ADD CONSTRAINT seller_id_check 
  CHECK (
    seller_id = 'admin' 
    OR (seller_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  );

-- UUID인 경우에만 auth.users에 존재하는지 확인하는 함수
CREATE OR REPLACE FUNCTION public.check_seller_id_exists()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 'admin'인 경우 통과
  IF NEW.seller_id = 'admin' THEN
    RETURN NEW;
  END IF;
  
  -- UUID 형식인 경우 auth.users에 존재하는지 확인
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id::text = NEW.seller_id
  ) THEN
    RAISE EXCEPTION 'seller_id % does not exist in auth.users', NEW.seller_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- INSERT와 UPDATE 시 seller_id 검증 트리거
CREATE TRIGGER check_seller_id_before_insert
  BEFORE INSERT ON public.used_gifticons
  FOR EACH ROW
  EXECUTE FUNCTION public.check_seller_id_exists();

CREATE TRIGGER check_seller_id_before_update
  BEFORE UPDATE ON public.used_gifticons
  FOR EACH ROW
  WHEN (OLD.seller_id IS DISTINCT FROM NEW.seller_id)
  EXECUTE FUNCTION public.check_seller_id_exists();

