import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Gift, CreditCard, Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import JsBarcode from "jsbarcode";

interface UsedGifticon {
  id: string;
  available_at: string;
  name?: string;
  expiry_date: string;
  barcode: string;
  original_price: number;
  sale_price: number;
}

interface SelectedGifticon {
  id: string;
  count: number;
  sale_price: number;
  reservedIds: string[]; // 대기중인 기프티콘 ID들
}

const Payment = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [gifticons, setGifticons] = useState<UsedGifticon[]>([]);
  const [selectedGifticons, setSelectedGifticons] = useState<Map<string, SelectedGifticon>>(new Map());
  const [userPoints, setUserPoints] = useState<number>(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [actualStoreName, setActualStoreName] = useState<string>("");
  const [recentlyPurchasedCount, setRecentlyPurchasedCount] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [storeBrand, setStoreBrand] = useState<string>(""); // 매장 브랜드명 (스타벅스, 파스쿠찌 등)
  const [actualGifticonBarcodes, setActualGifticonBarcodes] = useState<Map<string, string>>(new Map()); // 실제 기프티콘 바코드 맵
  const [franchiseId, setFranchiseId] = useState<string | null>(null);
  const [franchisePaymentMethods, setFranchisePaymentMethods] = useState<Array<{
    method_name: string;
    method_type: string | null;
    rate: number | null;
  }>>([]);
  const [storeInfo, setStoreInfo] = useState<{
    gifticon_available: boolean;
    local_currency_available: boolean;
    local_currency_discount_rate: number | null;
    parking_available: boolean;
    free_parking: boolean;
    parking_size: string | null;
  } | null>(null);
  const [selectedPaymentOptions, setSelectedPaymentOptions] = useState<Set<string>>(new Set());
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // 기프티콘 할인율 중 최대값 계산
  const maxGifticonDiscount = useMemo(() => {
    if (gifticons.length === 0) return 0;
    return Math.max(...gifticons.map(g => {
      const discountAmount = g.original_price - g.sale_price;
      return Math.round((discountAmount / g.original_price) * 100);
    }));
  }, [gifticons]);

  // 기프티콘 할인 방식의 할인율을 동적으로 계산
  const gifticonMethodDiscount = maxGifticonDiscount > 0 
    ? `${maxGifticonDiscount}%`
    : "0%";

  // 더미 기프티콘 데이터
  const dummyGifticons: UsedGifticon[] = [
    {
      id: "dummy-1",
      available_at: "스타벅스",
      name: "스타벅스 아메리카노 Tall",
      expiry_date: "2025-12-31",
      barcode: "1234567890123",
      original_price: 4500,
      sale_price: 3600,
    },
    {
      id: "dummy-2",
      available_at: "베스킨라빈스",
      name: "베스킨라빈스 싱글레귤러",
      expiry_date: "2025-11-30",
      barcode: "2345678901234",
      original_price: 3500,
      sale_price: 2800,
    },
    {
      id: "dummy-3",
      available_at: "메가커피",
      name: "메가커피 메가리치아이스티",
      expiry_date: "2025-10-31",
      barcode: "3456789012345",
      original_price: 3000,
      sale_price: 2400,
    },
    {
      id: "dummy-4",
      available_at: "컴포즈커피",
      name: "컴포즈커피 아메리카노",
      expiry_date: "2025-09-30",
      barcode: "4567890123456",
      original_price: 2500,
      sale_price: 2000,
    },
    {
      id: "dummy-5",
      available_at: "이디야커피",
      name: "이디야커피 카페라떼",
      expiry_date: "2025-08-31",
      barcode: "5678901234567",
      original_price: 4000,
      sale_price: 3200,
    },
    {
      id: "dummy-6",
      available_at: "파스쿠찌",
      name: "파스쿠찌 아메리카노",
      expiry_date: "2025-12-31",
      barcode: "6789012345678",
      original_price: 5000,
      sale_price: 4000,
    },
    {
      id: "dummy-7",
      available_at: "파스쿠찌",
      name: "파스쿠찌 카페라떼",
      expiry_date: "2025-11-30",
      barcode: "7890123456789",
      original_price: 5500,
      sale_price: 4400,
    },
  ];

  const storeNames: Record<string, string> = {
    baskin: "베스킨라빈스",
    starbucks: "스타벅스",
    mega: "메가커피",
    compose: "컴포즈커피",
    ediya: "이디야커피",
    paik: "빽다방",
    pascucci: "파스쿠찌",
    twosome: "투썸플레이스",
  };

  const membershipNames: Record<string, string> = {
    baskin: "해피포인트",
    starbucks: "스타벅스 멤버쉽",
    mega: "메가커피 멤버쉽",
    compose: "컴포즈커피 멤버쉽",
    ediya: "이디야 멤버쉽",
    paik: "빽다방 멤버쉽",
  };

  const membershipName = membershipNames[storeId || ""] || "멤버쉽";

  // 실제 매장명 조회 및 브랜드 설정 (Main 페이지에서 넘어온 매장명 매칭)
  useEffect(() => {
    const fetchStoreName = async () => {
      if (!storeId) {
        setActualStoreName("매장");
        setStoreBrand("");
        return;
      }

      try {
        // 1. localStorage에서 매장 정보 확인 (Main 페이지에서 저장한 경우) - 우선순위 1
        const storedStores = localStorage.getItem('nearbyStores');
        if (storedStores) {
          try {
            const stores = JSON.parse(storedStores);
            // storeId와 정확히 일치하는 매장 찾기
            const store = stores.find((s: any) => String(s.id) === String(storeId));
            if (store) {
              if (store.name) {
                setActualStoreName(store.name);
              }
              // 매장의 image 필드를 브랜드명으로 변환
              if (store.image && storeNames[store.image]) {
                setStoreBrand(storeNames[store.image]);
              } else if (store.image) {
                // storeNames에 없는 경우 image 값을 그대로 사용 (한글인 경우)
                setStoreBrand(store.image);
              }
              return;
            }
          } catch (e) {
            console.error("localStorage 파싱 오류:", e);
          }
        }

        // 2. storeNames에서 브랜드명 매핑 확인 - 우선순위 2
        if (storeNames[storeId]) {
          setActualStoreName(storeNames[storeId]);
          setStoreBrand(storeNames[storeId]);
          return;
        }

        // 3. 기본값
        setActualStoreName("매장");
        setStoreBrand("");
      } catch (error) {
        console.error("매장명 조회 오류:", error);
        setActualStoreName("매장");
        setStoreBrand("");
      }
    };

    fetchStoreName();
  }, [storeId]);

  // 프랜차이즈 및 매장 정보 조회
  useEffect(() => {
    const fetchFranchiseAndStoreInfo = async () => {
      if (!storeBrand) {
        setIsLoadingPaymentMethods(false);
        return;
      }

      try {
        // 1. 프랜차이즈 정보 조회
        const { data: franchiseData, error: franchiseError } = await supabase
          .from('franchises' as any)
          .select('id')
          .eq('name', storeBrand)
          .single();

        if (franchiseError && franchiseError.code !== 'PGRST116') {
          console.error("프랜차이즈 조회 오류:", franchiseError);
          setIsLoadingPaymentMethods(false);
          return;
        }

        if (franchiseData) {
          setFranchiseId(franchiseData.id);

          // 2. 프랜차이즈별 결제 방식 조회 (method_name, method_type, rate 포함)
          const { data: paymentMethodsData, error: paymentMethodsError } = await supabase
            .from('franchise_payment_methods' as any)
            .select('method_name, method_type, rate')
            .eq('franchise_id', franchiseData.id);

          if (paymentMethodsError) {
            console.error("결제 방식 조회 오류:", paymentMethodsError);
            setIsLoadingPaymentMethods(false);
          } else if (paymentMethodsData) {
            setFranchisePaymentMethods(paymentMethodsData.map((pm: any) => ({
              method_name: pm.method_name,
              method_type: pm.method_type,
              rate: pm.rate,
            })));
            setIsLoadingPaymentMethods(false);
          } else {
            setIsLoadingPaymentMethods(false);
          }
        } else {
          // 프랜차이즈 정보가 없으면 로딩 완료
          setIsLoadingPaymentMethods(false);
        }

        // 3. 매장 정보 조회 (storeId를 기반으로)
        if (storeId) {
          // storeId가 UUID 형식인지 확인 (UUID는 8-4-4-4-12 패턴)
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeId);
          
          if (isUUID) {
            // storeId가 UUID인 경우, id 컬럼으로 조회
            const { data: storeData, error: storeError } = await supabase
              .from('stores' as any)
              .select('gifticon_available, local_currency_available, local_currency_discount_rate, parking_available, free_parking, parking_size')
              .eq('id', storeId)
              .single();

            if (!storeError && storeData) {
              setStoreInfo({
                gifticon_available: storeData.gifticon_available || false,
                local_currency_available: storeData.local_currency_available || false,
                local_currency_discount_rate: storeData.local_currency_discount_rate || null,
                parking_available: storeData.parking_available || false,
                free_parking: storeData.free_parking || false,
                parking_size: storeData.parking_size,
              });
            }
          } else {
            // storeId가 숫자인 경우 (카카오 플레이스 ID), kakao_place_id 컬럼으로 조회
            const { data: storeData, error: storeError } = await supabase
              .from('stores' as any)
              .select('gifticon_available, local_currency_available, local_currency_discount_rate, parking_available, free_parking, parking_size')
              .eq('kakao_place_id', storeId)
              .single();

            if (!storeError && storeData) {
              setStoreInfo({
                gifticon_available: storeData.gifticon_available || false,
                local_currency_available: storeData.local_currency_available || false,
                local_currency_discount_rate: storeData.local_currency_discount_rate || null,
                parking_available: storeData.parking_available || false,
                free_parking: storeData.free_parking || false,
                parking_size: storeData.parking_size,
              });
            } else if (storeError && storeError.code === 'PGRST116' && franchiseData) {
              // kakao_place_id로 찾지 못한 경우, franchise_id와 매칭 시도
              const { data: storeByNameData, error: storeByNameError } = await supabase
                .from('stores' as any)
                .select('gifticon_available, local_currency_available, local_currency_discount_rate, parking_available, free_parking, parking_size')
                .eq('franchise_id', franchiseData.id)
                .limit(1)
                .single();

              if (!storeByNameError && storeByNameData) {
                setStoreInfo({
                  gifticon_available: storeByNameData.gifticon_available || false,
                  local_currency_available: storeByNameData.local_currency_available || false,
                  local_currency_discount_rate: storeByNameData.local_currency_discount_rate || null,
                  parking_available: storeByNameData.parking_available || false,
                  free_parking: storeByNameData.free_parking || false,
                  parking_size: storeByNameData.parking_size,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("프랜차이즈/매장 정보 조회 오류:", error);
        setIsLoadingPaymentMethods(false);
      }
    };

    fetchFranchiseAndStoreInfo();
  }, [storeBrand, storeId]);

  // 기프티콘 사용 가능 여부 계산 (결제 방식 생성 및 useEffect에서 사용)
  const isGifticonAvailable = storeInfo?.gifticon_available || false;
  const hasGifticons = gifticons.length > 0;
  const canUseGifticon = isGifticonAvailable && hasGifticons;

  // 동적 결제 방식 생성 (프랜차이즈 결제 방식 + 기프티콘 분리)
  const paymentMethods = useMemo(() => {
    const methods: Array<{
      id: string;
      name: string;
      enabled: boolean;
      type: 'membership' | 'gifticon' | 'local_currency' | 'combined';
      method_type?: string | null;
      rate?: number | null;
      gifticonDiscount?: number;
      description?: string;
    }> = [];

    // 기프티콘 사용 가능 여부 및 최대 할인율 (이미 상단에서 계산됨)

    // 프랜차이즈별 결제 방식 추가 (기프티콘과 분리)
    if (franchisePaymentMethods.length > 0) {
      franchisePaymentMethods.forEach((method) => {
        // 프랜차이즈 결제 방식만 별도로 추가
        let description = "";
        if (method.method_type === '적립' && method.rate) {
          description = `${method.rate}% 적립`;
        } else if (method.method_type === '스탬프') {
          description = "스탬프 적립";
        } else if (method.method_type === '결제' && method.rate) {
          description = `${method.rate}% 할인`;
        }

        // 해피포인트와 투썸하트는 추후 서비스 예정으로 설정
        const isComingSoon = method.method_name === '해피포인트' || method.method_name === '투썸하트';

        methods.push({
          id: `method-${method.method_name}`,
          name: method.method_name,
          enabled: !isComingSoon, // 해피포인트, 투썸하트는 false
          type: 'membership',
          method_type: method.method_type,
          rate: method.rate,
          description: description,
        });
      });
    }

    // 기프티콘 결제 방식 추가 (항상 별도로 표시)
    if (canUseGifticon) {
      methods.push({
        id: 'method-gifticon',
        name: '기프티콘',
        enabled: true,
        type: 'gifticon',
        gifticonDiscount: maxGifticonDiscount,
        description: `기프티콘 ${maxGifticonDiscount}% 할인`,
      });
    }

    // 지역화폐 사용 가능 여부에 따라 지역화폐 옵션 추가
    if (storeInfo?.local_currency_available) {
      const discountRate = storeInfo.local_currency_discount_rate;
      const description = discountRate 
        ? `지역화폐 ${discountRate}% 할인`
        : "지역화폐 사용";
      
      methods.push({
        id: 'method-local-currency',
        name: '지역화폐',
        enabled: true,
        type: 'local_currency',
        description: description,
      });
    }

    // 기본값 제거: 로딩 중이거나 정보가 없으면 빈 배열 반환
    // 프랜차이즈 정보가 로딩 중이거나 없는 경우 빈 배열 반환하여 기본값이 표시되지 않도록 함
    if (isLoadingPaymentMethods || (methods.length === 0 && !storeInfo)) {
      return [];
    }

    return methods;
  }, [franchisePaymentMethods, storeInfo, gifticons, maxGifticonDiscount, isLoadingPaymentMethods]);


  // 이전 로그인 상태를 추적하기 위한 ref 사용
  const prevSessionRef = useMemo(() => ({ current: null as any }), []);

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);
      
      // 초기 세션 상태 저장
      prevSessionRef.current = session;
      
      if (!loggedIn) {
        // 데모 모드: 더미 포인트 설정
        // 기프티콘은 fetchGifticons에서 브랜드별로 필터링하여 설정됨
        setUserPoints(50000);
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // 세션 만료 감지 및 로그아웃 처리
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const wasLoggedIn = !!prevSessionRef.current;
      const isNowLoggedIn = !!session;
      
      // INITIAL_SESSION 이벤트 처리: 세션이 없고 이전에 로그인 상태였다면 로그아웃으로 간주
      if (event === "INITIAL_SESSION" && !session && wasLoggedIn) {
        console.log("⚠️ [Payment] 세션 만료 - 로그인 페이지로 이동");
        setIsLoggedIn(false);
        
        toast.error("세션이 만료되었습니다. 다시 로그인해주세요.");
        
        // 로그인 페이지로 리다이렉트
        navigate("/");
        prevSessionRef.current = null;
        return;
      }
      
      if (event === "SIGNED_OUT" || (!session && wasLoggedIn)) {
        // 세션이 만료되거나 로그아웃된 경우
        console.log("⚠️ [Payment] 로그아웃 감지 - 로그인 페이지로 이동");
        setIsLoggedIn(false);
        
        // 로그인 상태였다가 만료된 경우에만 알림 표시 후 로그인 페이지로 이동
        if (wasLoggedIn) {
          toast.error("세션이 만료되었습니다. 다시 로그인해주세요.");
          
          // 로그인 페이지로 리다이렉트
          navigate("/");
        }
      } else if (event === "SIGNED_IN" || (session && isNowLoggedIn)) {
        // 로그인되거나 토큰이 갱신된 경우
        setIsLoggedIn(true);
      }
      
      // 현재 세션 상태 저장
      prevSessionRef.current = session;
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // 초기 데이터 로딩 완료 체크
  useEffect(() => {
    // storeBrand가 설정되고, 결제 방식 로딩이 완료되면 초기 로딩 종료
    if (storeBrand && !isLoadingPaymentMethods) {
      // 약간의 지연을 두고 초기 로딩 종료 (데이터 렌더링 완료 대기)
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } else if (!storeBrand) {
      // storeBrand가 없으면 즉시 로딩 종료
      setIsInitialLoading(false);
    }
  }, [storeBrand, isLoadingPaymentMethods]);

  // 사용자 포인트 조회
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (!isLoggedIn) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserPoints(profile.points || 0);
        }
      }
    };
    fetchUserPoints();
  }, [isLoggedIn]);

  // 기프티콘 목록 조회 (브랜드별 필터링 및 금액대별 중복 제거)
  useEffect(() => {
    const fetchGifticons = async () => {
      if (!isLoggedIn) {
        // 데모 모드: 더미 데이터 필터링 (storeBrand에 따라)
        if (storeBrand) {
          const filteredDummy = dummyGifticons.filter(
            (gifticon) => gifticon.available_at === storeBrand
          );
          setGifticons(filteredDummy);
        } else {
          setGifticons(dummyGifticons);
        }
        return;
      }

      if (!storeBrand) {
        // 브랜드 정보가 없으면 기프티콘 조회하지 않음
        setGifticons([]);
        return;
      }

      setIsLoading(true);
      try {
        // 먼저 판매중 기프티콘을 금액대별로 조회
        const { data: allData, error: fetchError } = await supabase
          .from('used_gifticons')
          .select('*')
          .eq('status', '판매중')
          .eq('available_at', storeBrand)
          .order('sale_price', { ascending: true });

        if (fetchError) throw fetchError;

        if (!allData || allData.length === 0) {
          setGifticons([]);
          return;
        }

        // 금액대별로 그룹화하여 각 금액대별 하나씩만 선택
        const groupedByPrice = new Map<number, UsedGifticon>();
        allData.forEach((item) => {
          if (!groupedByPrice.has(item.sale_price)) {
            groupedByPrice.set(item.sale_price, item);
          }
        });

        // 화면에 표시될 각 금액대별 기프티콘 1개씩만 대기중으로 변경
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const displayGifticons = Array.from(groupedByPrice.values());
          for (const gifticon of displayGifticons) {
            // 각 금액대의 첫 번째 기프티콘만 대기중으로 변경
            const { error: reserveError } = await supabase
              .from('used_gifticons')
              .update({
                status: '대기중',
                reserved_by: session.user.id,
                reserved_at: new Date().toISOString()
              })
              .eq('id', gifticon.id);

            if (reserveError) {
              console.error("기프티콘 예약 오류:", reserveError);
            }
          }

          // 대기중으로 변경된 기프티콘 조회
          const { data, error } = await supabase
            .from('used_gifticons')
            .select('*')
            .eq('status', '대기중')
            .eq('available_at', storeBrand)
            .order('sale_price', { ascending: true });

          if (error) throw error;

          if (data) {
            // 금액대별 중복 제거하여 최종 표시
            const finalGroupedByPrice = new Map<number, UsedGifticon>();
            data.forEach((item) => {
              if (!finalGroupedByPrice.has(item.sale_price)) {
                finalGroupedByPrice.set(item.sale_price, item);
              }
            });
            setGifticons(Array.from(finalGroupedByPrice.values()));
          } else {
            setGifticons([]);
          }
        } else {
          // 세션이 없으면 그룹화된 데이터만 표시
          setGifticons(Array.from(groupedByPrice.values()));
        }
      } catch (error: any) {
        console.error("기프티콘 조회 오류:", error);
        toast.error("기프티콘을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGifticons();
  }, [isLoggedIn, storeBrand]);

  // 페이지 언마운트 시 모든 대기중 기프티콘을 판매중으로 복구
  useEffect(() => {
    return () => {
      if (!isLoggedIn) return; // 데모 모드에서는 상태 복구 불필요

      const releaseAllReservedGifticons = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user || !storeBrand) return;

        // 해당 사용자가 예약한 해당 브랜드의 대기중 기프티콘을 판매중으로 복구
        await supabase
          .from('used_gifticons')
          .update({ 
            status: '판매중',
            reserved_by: null,
            reserved_at: null
          })
          .eq('available_at', storeBrand)
          .eq('status', '대기중')
          .eq('reserved_by', session.user.id);
      };

      releaseAllReservedGifticons();
    };
  }, [selectedGifticons, isLoggedIn, storeBrand]);

  // 기프티콘 선택 시 결제방식에서도 자동으로 기프티콘 선택
  useEffect(() => {
    if (selectedGifticons.size > 0) {
      // 기프티콘을 하나라도 선택하면 결제방식에서도 기프티콘 선택
      setSelectedPaymentOptions(prev => {
        const newSet = new Set(prev);
        if (canUseGifticon && !newSet.has('method-gifticon')) {
          newSet.add('method-gifticon');
        }
        return newSet;
      });
    } else {
      // 기프티콘을 모두 해제하면 결제방식에서도 기프티콘 해제
      setSelectedPaymentOptions(prev => {
        const newSet = new Set(prev);
        newSet.delete('method-gifticon');
        return newSet;
      });
    }
  }, [selectedGifticons.size, canUseGifticon]);

  // 기프티콘 개수 증가
  const handleIncrease = async (gifticon: UsedGifticon) => {
    // 데모 모드일 때는 간단한 처리
    if (!isLoggedIn) {
      const currentSelected = selectedGifticons.get(gifticon.sale_price.toString()) || {
        id: gifticon.id,
        count: 0,
        sale_price: gifticon.sale_price,
        reservedIds: []
      };

      const newCount = currentSelected.count + 1;
      const totalCost = Array.from(selectedGifticons.values())
        .reduce((sum, item) => sum + (item.count * item.sale_price), 0);
      const additionalCost = gifticon.sale_price;

      if (totalCost + additionalCost > userPoints) {
        toast.error(`포인트가 부족합니다. 보유 포인트: ${userPoints.toLocaleString()}원`);
        return;
      }

      // 더미 ID 생성
      const reservedIds = Array.from({ length: newCount }, (_, i) => `${gifticon.id}-${i + 1}`);

      setSelectedGifticons(new Map(selectedGifticons).set(gifticon.sale_price.toString(), {
        id: gifticon.id,
        count: newCount,
        sale_price: gifticon.sale_price,
        reservedIds
      }));

      toast.success(`${gifticon.sale_price.toLocaleString()}원 기프티콘 ${newCount}개 선택`);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    const currentSelected = selectedGifticons.get(gifticon.sale_price.toString()) || {
      id: gifticon.id,
      count: 0,
      sale_price: gifticon.sale_price,
      reservedIds: []
    };

    const newCount = currentSelected.count + 1;
    const totalCost = (currentSelected.count + 1) * gifticon.sale_price;

    // 포인트 한도 체크
    const currentTotalCost = Array.from(selectedGifticons.values())
      .reduce((sum, item) => sum + (item.count * item.sale_price), 0);
    const additionalCost = gifticon.sale_price;

    if (currentTotalCost + additionalCost > userPoints) {
      toast.error(`포인트가 부족합니다. 보유 포인트: ${userPoints.toLocaleString()}원`);
      return;
    }

    // 개수만큼 기프티콘 ID 조회 및 대기중으로 변경
    try {
      let idsToReserve: string[] = [];
      let availableItems: any[] = [];
      let soldItems: any[] = [];

      // 1. 먼저 이미 내가 예약한 대기중 기프티콘 조회 (우선순위 1)
      const { data: myReservedItems, error: fetchMyError } = await supabase
        .from('used_gifticons')
        .select('id')
        .eq('status', '대기중')
        .eq('available_at', storeBrand)
        .eq('sale_price', gifticon.sale_price)
        .eq('reserved_by', session.user.id)
        .limit(newCount);

      if (fetchMyError) throw fetchMyError;
      if (myReservedItems) {
        idsToReserve = myReservedItems.map(item => item.id);
      }

      // 2. 내가 예약한 것들로 부족하면, reserved_by가 null인 대기중 기프티콘 조회 (우선순위 2)
      if (idsToReserve.length < newCount) {
        const { data: availableData, error: fetchAvailableError } = await supabase
          .from('used_gifticons')
          .select('id')
          .eq('status', '대기중')
          .eq('available_at', storeBrand)
          .eq('sale_price', gifticon.sale_price)
          .is('reserved_by', null)
          .limit(newCount - idsToReserve.length);

        if (fetchAvailableError) throw fetchAvailableError;
        if (availableData) {
          availableItems = availableData;
          idsToReserve = [...idsToReserve, ...availableItems.map(item => item.id)];
        }
      }

      // 3. 여전히 부족하면 판매중인 기프티콘도 가져오기 (우선순위 3)
      if (idsToReserve.length < newCount) {
        const { data: soldData, error: soldError } = await supabase
          .from('used_gifticons')
          .select('id')
          .eq('status', '판매중')
          .eq('available_at', storeBrand)
          .eq('sale_price', gifticon.sale_price)
          .limit(newCount - idsToReserve.length);

        if (soldError) throw soldError;
        if (soldData) {
          soldItems = soldData;
          idsToReserve = [...idsToReserve, ...soldItems.map(item => item.id)];
        }
      }

      if (idsToReserve.length < newCount) {
        toast.error("선택 가능한 기프티콘이 부족합니다.");
        return;
      }

      // 대기중이 아니거나 reserved_by가 다른 기프티콘만 업데이트
      const myReservedIds = myReservedItems?.map(item => item.id) || [];
      const availableIds = availableItems.map(item => item.id) || [];
      const soldIds = soldItems.map(item => item.id) || [];

      // availableItems는 이미 대기중이므로 reserved_by만 업데이트
      if (availableIds.length > 0) {
        const { error: updateAvailableError } = await supabase
          .from('used_gifticons')
          .update({
            reserved_by: session.user.id,
            reserved_at: new Date().toISOString()
          })
          .in('id', availableIds);

        if (updateAvailableError) {
          console.error("기프티콘 예약 오류 (available):", updateAvailableError);
          throw updateAvailableError;
        }
      }

      // soldItems는 판매중이므로 대기중으로 변경
      if (soldIds.length > 0) {
        const { error: updateSoldError } = await supabase
          .from('used_gifticons')
          .update({
            status: '대기중',
            reserved_by: session.user.id,
            reserved_at: new Date().toISOString()
          })
          .in('id', soldIds);

        if (updateSoldError) {
          console.error("기프티콘 예약 오류 (sold):", updateSoldError);
          throw updateSoldError;
        }
      }

      // 선택 상태 업데이트
      setSelectedGifticons(new Map(selectedGifticons).set(gifticon.sale_price.toString(), {
        id: gifticon.id,
        count: newCount,
        sale_price: gifticon.sale_price,
        reservedIds: idsToReserve
      }));

      toast.success(`${gifticon.sale_price.toLocaleString()}원 기프티콘 ${newCount}개 선택`);
    } catch (error: any) {
      console.error("기프티콘 선택 오류:", error);
      toast.error(error.message || "기프티콘 선택 중 오류가 발생했습니다.");
    }
  };

  // 기프티콘 개수 감소
  const handleDecrease = async (gifticon: UsedGifticon) => {
    const currentSelected = selectedGifticons.get(gifticon.sale_price.toString());
    if (!currentSelected || currentSelected.count <= 0) return;

    // 데모 모드일 때는 간단한 처리
    if (!isLoggedIn) {
      const newCount = currentSelected.count - 1;

      if (newCount === 0) {
        const newMap = new Map(selectedGifticons);
        newMap.delete(gifticon.sale_price.toString());
        setSelectedGifticons(newMap);
      } else {
        const remainingIds = currentSelected.reservedIds.slice(1);
        setSelectedGifticons(new Map(selectedGifticons).set(gifticon.sale_price.toString(), {
          ...currentSelected,
          count: newCount,
          reservedIds: remainingIds
        }));
      }
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const newCount = currentSelected.count - 1;

    try {
      if (newCount === 0) {
        // 모두 해제 (reserved_by만 null로 설정, 상태는 대기중 유지)
        const { error } = await supabase
          .from('used_gifticons')
          .update({
            reserved_by: null,
            reserved_at: null
          })
          .in('id', currentSelected.reservedIds);

        if (error) throw error;

        const newMap = new Map(selectedGifticons);
        newMap.delete(gifticon.sale_price.toString());
        setSelectedGifticons(newMap);
      } else {
        // 하나만 해제 (reserved_by만 null로 설정, 상태는 대기중 유지)
        const idsToRelease = currentSelected.reservedIds.slice(0, 1);
        const remainingIds = currentSelected.reservedIds.slice(1);

        const { error } = await supabase
          .from('used_gifticons')
          .update({
            reserved_by: null,
            reserved_at: null
          })
          .in('id', idsToRelease);

        if (error) throw error;

        setSelectedGifticons(new Map(selectedGifticons).set(gifticon.sale_price.toString(), {
          ...currentSelected,
          count: newCount,
          reservedIds: remainingIds
        }));
      }
    } catch (error: any) {
      console.error("기프티콘 해제 오류:", error);
      toast.error("기프티콘 해제 중 오류가 발생했습니다.");
    }
  };

  // 기프티콘 전체 선택 해제 (휴지통 버튼용)
  const handleRemoveAll = async (gifticon: UsedGifticon) => {
    const currentSelected = selectedGifticons.get(gifticon.sale_price.toString());
    if (!currentSelected || currentSelected.count === 0) return;

    // 데모 모드일 때는 간단한 처리
    if (!isLoggedIn) {
      const newMap = new Map(selectedGifticons);
      newMap.delete(gifticon.sale_price.toString());
      setSelectedGifticons(newMap);
      toast.success("선택이 취소되었습니다.");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    try {
      // 모든 선택 해제 (reserved_by만 null로 설정, 상태는 대기중 유지)
      const { error } = await supabase
        .from('used_gifticons')
        .update({
          reserved_by: null,
          reserved_at: null
        })
        .in('id', currentSelected.reservedIds);

      if (error) throw error;

      const newMap = new Map(selectedGifticons);
      newMap.delete(gifticon.sale_price.toString());
      setSelectedGifticons(newMap);

      toast.success("선택이 취소되었습니다.");
    } catch (error: any) {
      console.error("기프티콘 선택 해제 오류:", error);
      toast.error("선택 해제 중 오류가 발생했습니다.");
    }
  };

  // 총 선택한 포인트 계산
  const totalCost = Array.from(selectedGifticons.values())
    .reduce((sum, item) => sum + (item.count * item.sale_price), 0);

  // 총 기프티콘 금액권 계산 (original_price 합계)
  const totalOriginalPrice = Array.from(selectedGifticons.values())
    .reduce((sum, item) => {
      const gifticon = gifticons.find(g => g.sale_price === item.sale_price);
      if (gifticon) {
        return sum + (gifticon.original_price * item.count);
      }
      return sum;
    }, 0);

  // 총 할인 금액 계산
  const totalDiscount = Array.from(selectedGifticons.values())
    .reduce((sum, item) => {
      const gifticon = gifticons.find(g => g.sale_price === item.sale_price);
      if (gifticon) {
        const discountPerItem = gifticon.original_price - gifticon.sale_price;
        return sum + (discountPerItem * item.count);
      }
      return sum;
    }, 0);

  const handlePayment = async () => {
    if (selectedGifticons.size === 0) {
      toast.error("선택한 기프티콘이 없습니다.");
      return;
    }

    if (totalCost > userPoints) {
      toast.error("포인트가 부족합니다.");
      return;
    }

    // 데모 모드일 때는 간단한 처리
    if (!isLoggedIn) {
      toast.success("결제가 완료되었습니다! (데모 모드)");
      setSelectedGifticons(new Map());
      setStep(2);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    setIsLoading(true);
    try {
      // 모든 선택한 기프티콘을 판매완료로 변경
      const allReservedIds: string[] = [];
      const purchasedGifticonsData: Array<{ gifticon: UsedGifticon; reservedId: string }> = [];
      
      for (const selected of selectedGifticons.values()) {
        allReservedIds.push(...selected.reservedIds);
        const gifticon = gifticons.find(g => g.sale_price === selected.sale_price);
        if (gifticon) {
          // 각 예약된 기프티콘에 대해 데이터 수집
          for (const reservedId of selected.reservedIds) {
            purchasedGifticonsData.push({ gifticon, reservedId });
          }
        }
      }

      // used_gifticons에서 상세 정보 조회
      const { data: usedGifticonsData, error: fetchError } = await supabase
        .from('used_gifticons')
        .select('*')
        .in('id', allReservedIds);

      if (fetchError) throw fetchError;

      // 타입 안전성을 위한 타입 단언 (name 필드가 추가됨)
      type UsedGifticonWithName = UsedGifticon & { name?: string };
      const typedGifticonsData = usedGifticonsData as UsedGifticonWithName[];

      // 판매완료로 상태 변경
      const { error: updateError } = await supabase
        .from('used_gifticons')
        .update({ status: '판매완료' })
        .in('id', allReservedIds);

      if (updateError) throw updateError;

      // gifticons 테이블에 구매한 기프티콘 추가
      if (typedGifticonsData && typedGifticonsData.length > 0) {
        const gifticonsToInsert = typedGifticonsData.map((item) => ({
          user_id: session.user.id,
          brand: item.available_at, // available_at을 brand로 사용
          name: item.name || `${item.available_at} 기프티콘`, // used_gifticons의 name 사용 (없으면 fallback)
          image: '🎫', // 기본 이미지
          original_price: item.original_price,
          expiry_date: item.expiry_date,
          status: '사용가능', // 초기 상태는 사용가능 (step 2 진입 시 사용완료로 변경)
          is_selling: false,
        }));

        const { error: insertError } = await supabase
          .from('gifticons')
          .insert(gifticonsToInsert);

        if (insertError) throw insertError;

        // 방금 구매한 기프티콘 개수 저장 (step 2에서 사용완료 처리 시 사용)
        setRecentlyPurchasedCount(typedGifticonsData.length);
      }

      // 포인트 차감
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({ points: userPoints - totalCost })
        .eq('id', session.user.id);

      if (pointsError) throw pointsError;

      setUserPoints(userPoints - totalCost);
      toast.success("결제가 완료되었습니다!");
      
      // 선택 상태 초기화
      setSelectedGifticons(new Map());
      setStep(2);
    } catch (error: any) {
      console.error("결제 오류:", error);
      toast.error(error.message || "결제 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmStep1 = () => {
    setStep(2);
    setCurrentCardIndex(0);
  };

  // 2단계에서 보여줄 총 카드 수 (기프티콘 + 멤버십)
  const totalCards = Array.from(selectedGifticons.values())
    .reduce((sum, item) => sum + item.count, 0) + 1;

  const BarcodeDisplay = ({ number }: { number: string }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
      if (svgRef.current && number) {
        try {
          // 숫자만 추출 (문자열이 있을 수 있음)
          const barcodeNumber = number.replace(/\D/g, '');
          
          if (barcodeNumber.length === 0) {
            return;
          }

          // EAN-13 형식인지 확인 (13자리)
          if (barcodeNumber.length === 13) {
            JsBarcode(svgRef.current, barcodeNumber, {
              format: "EAN13",
              width: 2,
              height: 80,
              displayValue: false,
              background: "transparent",
              lineColor: "#000000",
              margin: 0,
            });
          } else if (barcodeNumber.length === 8) {
            // EAN-8 형식 (8자리)
            JsBarcode(svgRef.current, barcodeNumber, {
              format: "EAN8",
              width: 2,
              height: 80,
              displayValue: false,
              background: "transparent",
              lineColor: "#000000",
              margin: 0,
            });
          } else {
            // CODE128 형식 (다양한 길이 지원)
            JsBarcode(svgRef.current, barcodeNumber, {
              format: "CODE128",
              width: 2,
              height: 80,
              displayValue: false,
              background: "transparent",
              lineColor: "#000000",
              margin: 0,
            });
          }
        } catch (error) {
          console.error("바코드 생성 오류:", error);
        }
      }
    }, [number]);

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-center bg-white p-3 rounded-lg">
          <svg
            ref={svgRef}
            className="max-w-full h-20"
            style={{ maxHeight: '80px' }}
          />
        </div>
        <p className="text-center font-mono text-xs tracking-widest">{number}</p>
      </div>
    );
  };

  // 선택한 기프티콘 목록 생성 (개수만큼)
  const purchasedGifticonsList: Array<{ id: string; gifticon: UsedGifticon }> = [];
  for (const selected of selectedGifticons.values()) {
    const gifticon = gifticons.find(g => g.sale_price === selected.sale_price);
    if (gifticon) {
      for (let i = 0; i < selected.count; i++) {
        purchasedGifticonsList.push({ id: selected.reservedIds[i] || gifticon.id, gifticon });
      }
    }
  }

  // Step 2 진입 시 예약된 기프티콘의 실제 바코드 조회
  useEffect(() => {
    const fetchActualBarcodes = async () => {
      if (step !== 2 || selectedGifticons.size === 0) return;

      // 모든 예약된 기프티콘 ID 수집
      const allReservedIds: string[] = [];
      for (const selected of selectedGifticons.values()) {
        allReservedIds.push(...selected.reservedIds);
      }

      if (allReservedIds.length === 0) return;

      // 데모 모드에서는 실제 바코드 조회 불필요 (이미 gifticon.barcode에 있음)
      if (!isLoggedIn) {
        return;
      }

      try {
        // 각 예약된 기프티콘의 실제 바코드 조회
        const { data: gifticonsData, error } = await supabase
          .from('used_gifticons')
          .select('id, barcode')
          .in('id', allReservedIds);

        if (error) throw error;

        if (gifticonsData) {
          const barcodeMap = new Map<string, string>();
          gifticonsData.forEach((item) => {
            barcodeMap.set(item.id, item.barcode);
          });
          setActualGifticonBarcodes(barcodeMap);
        }
      } catch (error: any) {
        console.error("기프티콘 바코드 조회 오류:", error);
      }
    };

    fetchActualBarcodes();
  }, [step, selectedGifticons, isLoggedIn]);

  // Step 2 진입 시 (바코드 표시 시) 자동으로 사용완료 처리
  useEffect(() => {
    const markGifticonsAsUsed = async () => {
      if (step !== 2 || recentlyPurchasedCount === 0) return;
      if (!isLoggedIn) return; // 데모 모드에서는 사용완료 처리 불필요

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      try {
        // 가장 최근에 구매한 기프티콘들을 조회 (방금 추가된 것들)
        const { data: recentGifticons, error: fetchError } = await supabase
          .from('gifticons')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('status', '사용가능')
          .order('created_at', { ascending: false })
          .limit(recentlyPurchasedCount);

        if (fetchError) throw fetchError;

        // 방금 구매한 기프티콘들을 사용완료로 변경
        if (recentGifticons && recentGifticons.length > 0) {
          const gifticonIds = recentGifticons.map(g => g.id);
          const { error: updateError } = await supabase
            .from('gifticons')
            .update({ status: '사용완료' })
            .in('id', gifticonIds)
            .eq('user_id', session.user.id)
            .eq('status', '사용가능');

          if (updateError) throw updateError;

          // 처리 완료 후 카운트 초기화
          setRecentlyPurchasedCount(0);
        }
      } catch (error: any) {
        console.error("기프티콘 사용완료 처리 오류:", error);
        // 오류가 발생해도 사용자에게는 표시하지 않음 (이미 바코드는 보여주고 있으므로)
      }
    };

    // step 2 진입 후 약간의 딜레이를 두고 실행 (상태 업데이트 완료 후)
    const timer = setTimeout(() => {
      markGifticonsAsUsed();
    }, 500);

    return () => clearTimeout(timer);
  }, [step, recentlyPurchasedCount, isLoggedIn]);

  // 초기 로딩 중일 때 전체 로딩 화면 표시
  if (isInitialLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-background ${step === 2 ? 'h-screen overflow-hidden' : 'min-h-screen pb-6'}`}>
      {step === 1 && (
        <header className="sticky top-0 z-50 bg-card border-b border-border">
          <div className="max-w-md mx-auto py-4 relative">
            <Link to="/main" className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold w-full text-center">
              {actualStoreName || "매장"}
            </h1>
          </div>
        </header>
      )}
      
      <main className={`max-w-md mx-auto ${step === 2 ? 'h-full flex flex-col pl-14 pr-4 overflow-hidden' : 'px-4 py-6 space-y-4'}`}>
        {step === 1 ? (
          <>
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold mb-4">결제방식 추천</h2>
              {isLoadingPaymentMethods ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">결제 방식 정보를 불러오는 중...</p>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">사용 가능한 결제 방식이 없습니다.</p>
                </div>
              ) : (
                paymentMethods.map((method) => {
                const isSelected = selectedPaymentOptions.has(method.id);
                const isEnabled = method.enabled || false;
                const isGifticon = method.type === 'gifticon';
                const isMembership = method.type === 'membership';
                const isCombined = method.type === 'combined';
                
                // 할인율/적립률 표시 계산 (description 우선 사용)
                let displayDiscount = method.description || "";
                if (!displayDiscount) {
                  if (isGifticon) {
                    displayDiscount = method.gifticonDiscount ? `${method.gifticonDiscount}% 할인` : gifticonMethodDiscount;
                  } else if (isMembership && method.method_type) {
                    if (method.method_type === '적립' && method.rate) {
                      displayDiscount = `${method.rate}% 적립`;
                    } else if (method.method_type === '스탬프') {
                      displayDiscount = "스탬프 적립";
                    } else if (method.method_type === '결제' && method.rate) {
                      displayDiscount = `${method.rate}% 할인`;
                    } else {
                      displayDiscount = "적용";
                    }
                  } else if (isCombined) {
                    displayDiscount = method.description || "적용";
                  } else {
                    displayDiscount = "적용";
                  }
                }
                
                return (
                  <Card
                    key={method.id}
                    className={`p-4 transition-all border-2 ${
                      !isEnabled
                        ? "bg-muted/30 border-muted opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "border-primary bg-primary/5 cursor-pointer"
                        : "border-border/50 hover:border-border cursor-pointer"
                    }`}
                    onClick={() => {
                      if (isEnabled) {
                        const newSet = new Set(selectedPaymentOptions);
                        if (isSelected) {
                          newSet.delete(method.id);
                        } else {
                          newSet.add(method.id);
                        }
                        setSelectedPaymentOptions(newSet);
                      }
                    }}
                  >
                    <div className="relative">
                      {!isEnabled && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <div className="bg-muted/90 px-4 py-2 rounded-lg border-2 border-muted-foreground/50">
                            <span className="text-sm font-semibold text-muted-foreground">
                              추후 서비스 예정
                            </span>
                          </div>
                        </div>
                      )}
                      <div className={`flex items-start justify-between ${!isEnabled ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (!isEnabled) return;
                              const newSet = new Set(selectedPaymentOptions);
                              if (checked) {
                                newSet.add(method.id);
                              } else {
                                newSet.delete(method.id);
                              }
                              setSelectedPaymentOptions(newSet);
                            }}
                            disabled={!isEnabled}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h3 className={`font-semibold text-sm ${!isEnabled ? 'text-muted-foreground' : ''}`}>
                              {method.name}
                            </h3>
                            {displayDiscount && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {displayDiscount}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
                })
              )}
            </div>

            {/* Gifticon Section */}
            {canUseGifticon && (
              <Card className="p-5 rounded-2xl border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold">추천 기프티콘</h2>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    보유 포인트: {userPoints.toLocaleString()}원
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
                ) : gifticons.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    등록된 기프티콘이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gifticons.map((gifticon) => {
                      const selected = selectedGifticons.get(gifticon.sale_price.toString());
                      const count = selected?.count || 0;
                      const discountAmount = gifticon.original_price - gifticon.sale_price;
                      const discountPercent = Math.round((discountAmount / gifticon.original_price) * 100);
                      
                      return (
                        <div
                          key={gifticon.id}
                          className={`p-4 rounded-xl transition-all ${
                            count > 0 ? "bg-primary/10 border-2 border-primary" : "bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold">{gifticon.name || "기프티콘"}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground line-through">
                                  {gifticon.original_price.toLocaleString()}원
                                </span>
                                <span className="text-sm font-bold text-primary">
                                  {discountPercent}% ({discountAmount.toLocaleString()}원) 할인
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                판매가: {gifticon.sale_price.toLocaleString()}원
                              </p>
                            </div>
                            {count === 0 ? (
                              <Button
                                size="sm"
                                variant="default"
                                className="rounded-lg"
                                onClick={() => handleIncrease(gifticon)}
                                disabled={isLoading || (totalCost + gifticon.sale_price > userPoints)}
                              >
                                선택
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg w-8 h-8 p-0"
                                  onClick={() => handleDecrease(gifticon)}
                                  disabled={isLoading}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="font-bold min-w-[2rem] text-center">
                                  {count}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg w-8 h-8 p-0"
                                  onClick={() => handleIncrease(gifticon)}
                                  disabled={isLoading || (totalCost + gifticon.sale_price > userPoints)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg w-8 h-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveAll(gifticon)}
                                  disabled={isLoading}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {totalCost > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">총 구매 포인트</span>
                      <span className="font-bold text-lg text-primary">
                        {totalCost.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">총 기프티콘 금액권</span>
                      <span className="font-semibold">
                        {totalOriginalPrice.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">총 할인 금액</span>
                      <span className="font-semibold text-primary">
                        {totalDiscount.toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">남은 포인트</span>
                      <span className={`font-semibold ${userPoints - totalCost < 0 ? 'text-destructive' : ''}`}>
                        {(userPoints - totalCost).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Confirm Button */}
            <Button
              onClick={handleConfirmStep1}
              className="w-full h-14 text-lg font-semibold rounded-xl"
              disabled={isLoading}
            >
              확인
            </Button>
          </>
        ) : (
          <>
            {/* Step 2: Vertical Scroll View */}
            <div className="absolute left-2 top-4 flex flex-col gap-3 z-50">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex flex-col gap-1.5">
                {Array.from({ length: totalCards }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      index === currentCardIndex
                        ? "h-8 bg-primary"
                        : "h-4 bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col h-full py-4 pb-20 overflow-hidden">
              <div 
                className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                style={{
                  scrollSnapType: 'y mandatory',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
                onScroll={(e) => {
                  const container = e.currentTarget;
                  const cards = Array.from(container.children);
                  let minDistance = Infinity;
                  let closestIndex = 0;
                  
                  cards.forEach((card, index) => {
                    const rect = (card as HTMLElement).getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    const distance = Math.abs(rect.top - containerRect.top);
                    
                    if (distance < minDistance) {
                      minDistance = distance;
                      closestIndex = index;
                    }
                  });
                  
                  if (closestIndex !== currentCardIndex) {
                    setCurrentCardIndex(closestIndex);
                  }
                }}
              >
                {purchasedGifticonsList.map((item, index) => {
                  const gifticon = item.gifticon;
                  // 실제 바코드가 있으면 사용, 없으면 기본 바코드 사용
                  const actualBarcode = actualGifticonBarcodes.get(item.id) || gifticon.barcode;
                  return (
                    <div
                      key={`gifticon-${item.id}-${index}`}
                      className="snap-start mb-4"
                      style={{
                        scrollSnapAlign: 'start',
                        scrollSnapStop: 'always',
                      }}
                    >
                      <Card className="p-4 rounded-2xl border-border/50">
                        <div className="space-y-3">
                          <BarcodeDisplay number={actualBarcode} />
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Gift className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">기프티콘</p>
                              <p className="font-bold text-sm">{gifticon.name || "기프티콘"}</p>
                              <p className="text-xs text-muted-foreground">
                                {gifticon.sale_price.toLocaleString()}원
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                })}

                {/* Membership Card */}
                <div 
                  className="snap-start"
                  style={{
                    scrollSnapAlign: 'start',
                    scrollSnapStop: 'always',
                  }}
                >
                  <Card className="p-4 rounded-2xl border-border/50 relative">
                    {/* 추후 서비스 예정 오버레이 */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/80 rounded-2xl">
                      <div className="bg-muted/90 px-4 py-2 rounded-lg border-2 border-muted-foreground/50">
                        <span className="text-sm font-semibold text-muted-foreground">
                          추후 서비스 예정
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 opacity-50">
                      <BarcodeDisplay number="1234567890123" />
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="w-4 h-4 text-secondary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">멤버십</p>
                            <p className="font-bold text-sm">{membershipName}</p>
                          </div>
                        </div>
                        {storeId === "starbucks" && (
                          <div className="flex items-center gap-2 text-xs pl-[44px]">
                            <span className="text-muted-foreground">적립 가능 별:</span>
                            <span>⭐⭐⭐</span>
                          </div>
                        )}
                        {storeId === "baskin" && (
                          <div className="flex items-center gap-2 text-xs pl-[44px]">
                            <span className="text-muted-foreground">보유 포인트:</span>
                            <span className="font-semibold">1,500P</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <Button
                onClick={handlePayment}
                className="w-full h-14 text-lg font-semibold rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? "처리 중..." : "결제수단 선택"}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Payment;
