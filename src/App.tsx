import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminRoute from "./components/AdminRoute";
import Main from "./pages/Main";
import TutorialMain from "./pages/TutorialMain";
import Location from "./pages/Location";
import Sell from "./pages/Sell";
import SellResult from "./pages/SellResult";
import SellResultDetail from "./pages/SellResultDetail";
import Payment from "./pages/Payment";
import TutorialPayment from "./pages/TutorialPayment";
import BarcodePrototype from "./pages/BarcodePrototype";
import MyPage from "./pages/MyPage";
import MyGifticons from "./pages/MyGifticons";
import History from "./pages/History";
import PaymentMethods from "./pages/PaymentMethods";
import OneTouchPayment from "./pages/OneTouchPayment";
import DiscountCoupon from "./pages/DiscountCoupon";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFail from "./pages/PaymentFail";
import NotFound from "./pages/NotFound";
import ChatSupport from "./components/ChatSupport";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import MembershipManagement from "./pages/MembershipManagement";
import LandingPage from "./pages/Landing/LandingPage";

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
          <Route path="/" element={<Main />} />
          <Route path="/main" element={<Main />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/tutorial" element={<TutorialMain />} />
          <Route path="/location" element={<Location />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/sell/result/:jobId" element={<SellResult />} />
          <Route path="/sell/result/:jobId/detail" element={<SellResultDetail />} />
          <Route path="/payment/:storeId" element={<Payment />} />
          <Route path="/tutorial/payment/:storeId" element={<TutorialPayment />} />
          <Route path="/prototype/barcode/:storeId" element={<BarcodePrototype />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/my-gifticons" element={<MyGifticons />} />
          <Route path="/history" element={<History />} />
          <Route path="/one-touch-payment" element={<OneTouchPayment />} />
          <Route path="/discount-coupon" element={<DiscountCoupon />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
          <Route path="/membership-management" element={<MembershipManagement />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-fail" element={<PaymentFail />} />
          {/* Admin Routes */}
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
