import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Login from "./pages/Login";
import Main from "./pages/Main";
import Location from "./pages/Location";
import Sell from "./pages/Sell";
import Payment from "./pages/Payment";
import MyPage from "./pages/MyPage";
import MyGifticons from "./pages/MyGifticons";
import History from "./pages/History";
import PaymentMethods from "./pages/PaymentMethods";
import OneTouchPayment from "./pages/OneTouchPayment";
import DiscountCoupon from "./pages/DiscountCoupon";
import CallbackAuth from "./pages/CallbackAuth";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFail from "./pages/PaymentFail";
import NotFound from "./pages/NotFound";
import ChatSupport from "./components/ChatSupport";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/main" element={<ProtectedRoute><Main /></ProtectedRoute>} />
          <Route path="/location" element={<ProtectedRoute><Location /></ProtectedRoute>} />
          <Route path="/sell" element={<ProtectedRoute><Sell /></ProtectedRoute>} />
          <Route path="/payment/:storeId" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
          <Route path="/my-gifticons" element={<ProtectedRoute><MyGifticons /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/one-touch-payment" element={<ProtectedRoute><OneTouchPayment /></ProtectedRoute>} />
          <Route path="/discount-coupon" element={<ProtectedRoute><DiscountCoupon /></ProtectedRoute>} />
          <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
          <Route path="/callback-auth" element={<CallbackAuth />} />
          <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
          <Route path="/payment-fail" element={<ProtectedRoute><PaymentFail /></ProtectedRoute>} />
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatSupport />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
