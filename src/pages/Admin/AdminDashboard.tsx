import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, LogOut, Search, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type UsedGifticon = Database["public"]["Tables"]["used_gifticons"]["Row"];
type SupportMessage = Database["public"]["Tables"]["support_messages"]["Row"];

interface ChatRoom {
  user_id: string | null;
  lastMessage: string;
  lastMessageTime: string;
  messageCount: number;
  unreadCount: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("gifticons");
  const [gifticons, setGifticons] = useState<UsedGifticon[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoadingGifticons, setIsLoadingGifticons] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [gifticonSearch, setGifticonSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedChatRoom, setSelectedChatRoom] = useState<string | null>(null);
  const [readChatRooms, setReadChatRooms] = useState<Map<string | null, string>>(new Map()); // user_id -> read_at timestamp

  // 기프티콘 데이터 로드
  const loadGifticons = async (isMountedRef?: { current: boolean }) => {
    setIsLoadingGifticons(true);
    try {
      // 모든 상태의 기프티콘을 가져오기 위해 필터 없이 조회
      let query = supabase
        .from("used_gifticons")
        .select("*")
        .order("created_at", { ascending: false });

      // 상태 필터가 "all"이 아닐 때만 필터 적용
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Supabase 쿼리 오류:", error);
        throw error;
      }

      if (isMountedRef && !isMountedRef.current) return;

      console.log(`총 ${data?.length || 0}개의 기프티콘을 불러왔습니다.`);
      
      // 상태별 분포 확인 (디버깅용)
      if (data && data.length > 0) {
        const statusCounts = data.reduce((acc: Record<string, number>, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});
        console.log("상태별 분포:", statusCounts);
      }

      // 검색 필터링 (클라이언트 사이드)
      let filteredData = data || [];
      if (gifticonSearch) {
        const searchLower = gifticonSearch.toLowerCase();
        filteredData = filteredData.filter(
          (item) =>
            item.barcode.toLowerCase().includes(searchLower) ||
            item.seller_id.toLowerCase().includes(searchLower) ||
            item.id.toLowerCase().includes(searchLower)
        );
      }

      if (isMountedRef && !isMountedRef.current) return;
      setGifticons(filteredData);
    } catch (error: any) {
      console.error("기프티콘 로드 오류:", error);
      if (isMountedRef && !isMountedRef.current) return;
      toast({
        title: "오류",
        description: error.message || "기프티콘 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      if (isMountedRef && !isMountedRef.current) return;
      setIsLoadingGifticons(false);
    }
  };

  // 읽음 상태 로드
  const loadReadStatus = async (isMountedRef?: { current: boolean }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (isMountedRef && !isMountedRef.current) return;

      const { data, error } = await supabase
        .from("admin_chat_reads")
        .select("user_id, read_at")
        .eq("admin_id", user.id);

      if (error) {
        console.error("읽음 상태 로드 오류:", error);
        return;
      }

      if (isMountedRef && !isMountedRef.current) return;

      const readMap = new Map<string | null, string>();
      data?.forEach((item) => {
        readMap.set(item.user_id, item.read_at);
      });
      setReadChatRooms(readMap);
    } catch (error) {
      console.error("읽음 상태 로드 오류:", error);
    }
  };

  // 채팅 메시지 데이터 로드
  const loadMessages = async (isMountedRef?: { current: boolean }) => {
    setIsLoadingMessages(true);
    try {
      // 모든 메시지 불러오기 (RLS 정책으로 관리자만 접근 가능)
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase 쿼리 오류:", error);
        throw error;
      }

      if (isMountedRef && !isMountedRef.current) return;

      console.log(`총 ${data?.length || 0}개의 메시지를 불러왔습니다.`);

      // 검색 필터링 (클라이언트 사이드)
      let filteredData = data || [];
      if (messageSearch) {
        const searchLower = messageSearch.toLowerCase();
        filteredData = filteredData.filter(
          (item) =>
            item.message.toLowerCase().includes(searchLower) ||
            item.page_name.toLowerCase().includes(searchLower) ||
            item.page_path.toLowerCase().includes(searchLower) ||
            (item.user_id && item.user_id.toLowerCase().includes(searchLower))
        );
      }

      if (isMountedRef && !isMountedRef.current) return;
      setMessages(filteredData);
    } catch (error: any) {
      console.error("메시지 로드 오류:", error);
      if (isMountedRef && !isMountedRef.current) return;
      toast({
        title: "오류",
        description: error.message || "메시지 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      setMessages([]);
    } finally {
      if (isMountedRef && !isMountedRef.current) return;
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    const isMountedRef = { current: true };

    if (activeTab === "gifticons") {
      loadGifticons(isMountedRef);
    } else if (activeTab === "messages") {
      loadMessages(isMountedRef);
      loadReadStatus(isMountedRef);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [activeTab, statusFilter]);

  useEffect(() => {
    const isMountedRef = { current: true };

    if (activeTab === "gifticons") {
      loadGifticons(isMountedRef);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [gifticonSearch]);

  useEffect(() => {
    const isMountedRef = { current: true };

    if (activeTab === "messages") {
      loadMessages(isMountedRef);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [messageSearch]);

  // 기프티콘 상태 변경
  const updateGifticonStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("used_gifticons")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "기프티콘 상태가 업데이트되었습니다.",
      });

      loadGifticons();
    } catch (error: any) {
      console.error("상태 업데이트 오류:", error);
      toast({
        title: "오류",
        description: "상태 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      판매중: "default",
      대기중: "secondary",
      판매완료: "outline",
      기한만료: "destructive",
    };

    const labels: Record<string, string> = {
      판매중: "판매중",
      대기중: "대기중",
      판매완료: "판매완료",
      기한만료: "기한만료",
    };

    return (
      <Badge variant={variants[status] || "default"} className="whitespace-nowrap">
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // 유효한 날짜가 아니면 원본 문자열 반환 (브랜드명 등)
        return dateString;
      }
      // 날짜만 있는 경우 (시간 정보가 없는 경우) 날짜만 표시
      // 시간 정보가 있는 경우에만 시간까지 표시
      if (dateString.includes('T') || dateString.includes(' ')) {
        // 시간 정보가 있는 경우
        return date.toLocaleString("ko-KR");
      } else {
        // 날짜만 있는 경우 (expiry_date 등)
        return date.toLocaleDateString("ko-KR");
      }
    } catch {
      // 파싱 실패 시 원본 문자열 반환
      return dateString;
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "어제";
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
    }
  };

  // 채팅방 목록 생성 (user_id별로 그룹화 - 같은 user_id는 같은 채팅방)
  const chatRooms = useMemo(() => {
    const roomMap = new Map<string | null, ChatRoom>();
    
    // user_id별로 메시지 그룹화 (같은 user_id는 같은 채팅방)
    messages.forEach((message) => {
      const userId = message.user_id;
      
      // 이미 존재하는 채팅방인지 확인
      if (!roomMap.has(userId)) {
        // 새 채팅방 생성
        roomMap.set(userId, {
          user_id: userId,
          lastMessage: message.message,
          lastMessageTime: message.created_at,
          messageCount: 1,
          unreadCount: 0,
        });
      } else {
        // 기존 채팅방 업데이트
        const room = roomMap.get(userId)!;
        const messageTime = new Date(message.created_at).getTime();
        const lastMessageTime = new Date(room.lastMessageTime).getTime();
        
        // 더 최신 메시지로 업데이트
        if (messageTime > lastMessageTime) {
          room.lastMessage = message.message;
          room.lastMessageTime = message.created_at;
        }
        room.messageCount += 1;
      }
    });
    
    // 읽지 않은 메시지 수 계산 (읽음 시간 이후의 메시지만 카운트)
    roomMap.forEach((room) => {
      const readAt = readChatRooms.get(room.user_id);
      if (!readAt) {
        // 읽지 않은 경우 전체 메시지 수
        room.unreadCount = room.messageCount;
      } else {
        // 읽음 시간 이후의 메시지만 카운트
        const readTime = new Date(readAt).getTime();
        const unreadMessages = messages.filter((msg) => {
          if (msg.user_id !== room.user_id) return false;
          return new Date(msg.created_at).getTime() > readTime;
        });
        room.unreadCount = unreadMessages.length;
      }
    });
    
    return Array.from(roomMap.values()).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }, [messages, readChatRooms]);

  // 선택된 채팅방의 메시지 필터링 (같은 user_id의 모든 메시지)
  const filteredMessages = useMemo(() => {
    if (!selectedChatRoom) return [];
    return messages
      .filter((msg) => {
        // 같은 user_id를 가진 메시지만 필터링
        // null 값도 정확히 비교
        if (selectedChatRoom === null) {
          return msg.user_id === null;
        }
        return msg.user_id === selectedChatRoom;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, selectedChatRoom]);

  // 첫 번째 채팅방 자동 선택
  useEffect(() => {
    if (chatRooms.length > 0 && !selectedChatRoom) {
      setSelectedChatRoom(chatRooms[0].user_id);
    }
  }, [chatRooms, selectedChatRoom]);

  // 채팅방 선택 시 읽음 처리 (DB에 저장)
  useEffect(() => {
    let isMounted = true;

    const markAsRead = async () => {
      if (selectedChatRoom === null) {
        // 익명 사용자 채팅방 처리
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user || !isMounted) return;

          // user_id가 null인 경우 기존 레코드 확인 후 업데이트 또는 삽입
          const { data: existing } = await supabase
            .from("admin_chat_reads")
            .select("id")
            .eq("admin_id", user.id)
            .is("user_id", null)
            .single();

          if (!isMounted) return;

          if (existing) {
            // 기존 레코드 업데이트
            const { error } = await supabase
              .from("admin_chat_reads")
              .update({ read_at: new Date().toISOString() })
              .eq("id", existing.id);

            if (error) {
              console.error("읽음 상태 저장 오류:", error);
              return;
            }
          } else {
            // 새 레코드 삽입
            const { error } = await supabase
              .from("admin_chat_reads")
              .insert({
                admin_id: user.id,
                user_id: null,
                read_at: new Date().toISOString(),
              });

            if (error) {
              console.error("읽음 상태 저장 오류:", error);
              return;
            }
          }

          if (!isMounted) return;

          // 로컬 상태 업데이트
          setReadChatRooms((prev) => {
            const newMap = new Map(prev);
            newMap.set(null, new Date().toISOString());
            return newMap;
          });
        } catch (error) {
          console.error("읽음 처리 오류:", error);
        }
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

        // DB에 읽음 상태 저장 (UPSERT)
        const { error } = await supabase
          .from("admin_chat_reads")
          .upsert(
            {
              admin_id: user.id,
              user_id: selectedChatRoom,
              read_at: new Date().toISOString(),
            },
            {
              onConflict: "admin_id,user_id",
            }
          );

        if (error) {
          console.error("읽음 상태 저장 오류:", error);
          return;
        }

        if (!isMounted) return;

        // 로컬 상태 업데이트
        setReadChatRooms((prev) => {
          const newMap = new Map(prev);
          newMap.set(selectedChatRoom, new Date().toISOString());
          return newMap;
        });
      } catch (error) {
        console.error("읽음 처리 오류:", error);
      }
    };

    markAsRead();

    return () => {
      isMounted = false;
    };
  }, [selectedChatRoom]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">관리자 대시보드</h1>
            <p className="text-muted-foreground mt-1">중고 기프티콘 및 채팅 관리</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        </div>

        {/* 탭 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="gifticons">중고 기프티콘 관리</TabsTrigger>
            <TabsTrigger value="messages">채팅 관리</TabsTrigger>
          </TabsList>

          {/* 기프티콘 관리 탭 */}
          <TabsContent value="gifticons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>중고 기프티콘 목록</CardTitle>
                <CardDescription>
                  등록된 중고 기프티콘을 관리할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 필터 및 검색 */}
                <div className="space-y-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="바코드, 판매자 ID, 기프티콘 ID로 검색..."
                      value={gifticonSearch}
                      onChange={(e) => setGifticonSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {/* 상태 필터 버튼 */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={statusFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("all")}
                    >
                      전체
                    </Button>
                    <Button
                      variant={statusFilter === "판매중" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("판매중")}
                    >
                      판매중
                    </Button>
                    <Button
                      variant={statusFilter === "대기중" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("대기중")}
                    >
                      대기중
                    </Button>
                    <Button
                      variant={statusFilter === "판매완료" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("판매완료")}
                    >
                      판매완료
                    </Button>
                    <Button
                      variant={statusFilter === "기한만료" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("기한만료")}
                    >
                      기한만료
                    </Button>
                  </div>
                </div>

                {/* 테이블 */}
                {isLoadingGifticons ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>상품명</TableHead>
                          <TableHead>바코드</TableHead>
                          <TableHead>판매자 ID</TableHead>
                          <TableHead>원가</TableHead>
                          <TableHead>판매가</TableHead>
                          <TableHead>상태</TableHead>
                          <TableHead>만료일</TableHead>
                          <TableHead>브랜드</TableHead>
                          <TableHead>예약일</TableHead>
                          <TableHead>예약자 ID</TableHead>
                          <TableHead>등록일</TableHead>
                          <TableHead>수정일</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gifticons.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                              데이터가 없습니다.
                            </TableCell>
                          </TableRow>
                        ) : (
                          gifticons.map((gifticon) => (
                            <TableRow key={gifticon.id}>
                              <TableCell className="font-mono text-xs">
                                {gifticon.id.substring(0, 8)}...
                              </TableCell>
                              <TableCell>{gifticon.name || "-"}</TableCell>
                              <TableCell className="font-mono">{gifticon.barcode}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {gifticon.seller_id.substring(0, 8)}...
                              </TableCell>
                              <TableCell>{gifticon.original_price.toLocaleString()}원</TableCell>
                              <TableCell>{gifticon.sale_price.toLocaleString()}원</TableCell>
                              <TableCell>
                                <Select
                                  value={gifticon.status}
                                  onValueChange={(value) => updateGifticonStatus(gifticon.id, value)}
                                >
                                  <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="판매중">판매중</SelectItem>
                                    <SelectItem value="대기중">대기중</SelectItem>
                                    <SelectItem value="판매완료">판매완료</SelectItem>
                                    <SelectItem value="기한만료">기한만료</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>{formatDate(gifticon.expiry_date)}</TableCell>
                              <TableCell>{gifticon.available_at || "-"}</TableCell>
                              <TableCell>{formatDate(gifticon.reserved_at)}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {gifticon.reserved_by ? `${gifticon.reserved_by.substring(0, 8)}...` : "-"}
                              </TableCell>
                              <TableCell>{formatDate(gifticon.created_at)}</TableCell>
                              <TableCell>{formatDate(gifticon.updated_at)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 채팅 관리 탭 */}
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>채팅 메시지 목록</CardTitle>
                <CardDescription>
                  고객 지원 메시지를 관리할 수 있습니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 검색 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="메시지, 페이지명, 경로, 사용자 ID로 검색..."
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* 채팅방 목록 및 메시지 */}
                {isLoadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : chatRooms.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    채팅방이 없습니다.
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row gap-4 h-[600px]">
                    {/* 왼쪽: 채팅방 목록 */}
                    <div className="w-full lg:w-1/3 border rounded-lg flex flex-col overflow-hidden lg:h-full h-[300px]">
                      <div className="p-4 border-b bg-muted/50 flex-shrink-0">
                        <h3 className="font-semibold">채팅방 목록</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {chatRooms.length}개의 채팅방
                        </p>
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="p-2">
                          {chatRooms.map((room) => (
                            <div
                              key={room.user_id || "anonymous"}
                              onClick={() => setSelectedChatRoom(room.user_id)}
                              className={cn(
                                "p-3 rounded-lg cursor-pointer transition-colors mb-2",
                                selectedChatRoom === room.user_id
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted hover:bg-muted/80"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {room.user_id
                                        ? `${room.user_id.substring(0, 8)}...`
                                        : "익명 사용자"}
                                    </div>
                                    <div
                                      className={cn(
                                        "text-xs mt-1 truncate",
                                        selectedChatRoom === room.user_id
                                          ? "text-primary-foreground/80"
                                          : "text-muted-foreground"
                                      )}
                                    >
                                      {room.lastMessage}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  {room.unreadCount > 0 && (
                                    <Badge
                                      variant={
                                        selectedChatRoom === room.user_id
                                          ? "secondary"
                                          : "default"
                                      }
                                      className="text-xs"
                                    >
                                      {room.unreadCount}
                                    </Badge>
                                  )}
                                  <span
                                    className={cn(
                                      "text-xs",
                                      selectedChatRoom === room.user_id
                                        ? "text-primary-foreground/70"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    {formatTime(room.lastMessageTime)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* 오른쪽: 선택된 채팅방의 메시지 목록 */}
                    <div className="w-full lg:w-2/3 border rounded-lg flex flex-col overflow-hidden lg:h-full h-[300px]">
                      {selectedChatRoom ? (
                        <>
                          <div className="p-4 border-b bg-muted/50 flex-shrink-0">
                            <h3 className="font-semibold">
                              {selectedChatRoom
                                ? `사용자: ${selectedChatRoom.substring(0, 8)}...`
                                : "익명 사용자"}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {filteredMessages.length}개의 메시지
                            </p>
                          </div>
                          <ScrollArea className="flex-1">
                            <div className="p-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>메시지</TableHead>
                                    <TableHead>페이지명</TableHead>
                                    <TableHead>경로</TableHead>
                                    <TableHead>작성일</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredMessages.length === 0 ? (
                                    <TableRow>
                                      <TableCell
                                        colSpan={5}
                                        className="text-center py-8 text-muted-foreground"
                                      >
                                        메시지가 없습니다.
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    filteredMessages.map((message) => (
                                      <TableRow key={message.id}>
                                        <TableCell className="font-mono text-xs">
                                          {message.id.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell className="max-w-md">
                                          <div className="whitespace-pre-wrap break-words">
                                            {message.message}
                                          </div>
                                        </TableCell>
                                        <TableCell>{message.page_name}</TableCell>
                                        <TableCell className="font-mono text-xs">
                                          {message.page_path}
                                        </TableCell>
                                        <TableCell>{formatDate(message.created_at)}</TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </ScrollArea>
                        </>
                      ) : (
                        <div className="flex items-center justify-center flex-1 text-muted-foreground">
                          채팅방을 선택해주세요.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

