-- Create franchises table
CREATE TABLE IF NOT EXISTS public.franchises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create franchise_payment_methods table (프랜차이즈별 결제 방식)
CREATE TABLE IF NOT EXISTS public.franchise_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  method_name TEXT NOT NULL, -- 예: "투썸하트 멤버십", "해피포인트 결제", "해피포인트 적립"
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(franchise_id, method_name)
);

-- Create stores table (매장 정보)
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES public.franchises(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gifticon_available BOOLEAN DEFAULT false, -- 기프티콘 사용가능 여부
  local_currency_available BOOLEAN DEFAULT false, -- 지역화폐 사용가능 여부
  parking_available BOOLEAN DEFAULT false, -- 주차가능 여부
  free_parking BOOLEAN DEFAULT false, -- 무료주차 여부
  parking_size TEXT CHECK (parking_size IN ('넓음', '보통', '좁음')), -- 주차장 규모 수준
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_franchise_payment_methods_franchise_id ON public.franchise_payment_methods(franchise_id);
CREATE INDEX idx_stores_franchise_id ON public.stores(franchise_id);

-- Enable RLS
ALTER TABLE public.franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.franchise_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for franchises (모든 사용자가 읽기 가능)
CREATE POLICY "Anyone can view franchises"
  ON public.franchises
  FOR SELECT
  USING (true);

-- RLS Policies for franchise_payment_methods (모든 사용자가 읽기 가능)
CREATE POLICY "Anyone can view franchise_payment_methods"
  ON public.franchise_payment_methods
  FOR SELECT
  USING (true);

-- RLS Policies for stores (모든 사용자가 읽기 가능)
CREATE POLICY "Anyone can view stores"
  ON public.stores
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.franchises TO anon, authenticated;
GRANT SELECT ON public.franchise_payment_methods TO anon, authenticated;
GRANT SELECT ON public.stores TO anon, authenticated;

