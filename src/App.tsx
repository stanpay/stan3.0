import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Main from "./pages/Main";
import Location from "./pages/Location";
import Sell from "./pages/Sell";
import Marketplace from "./pages/Marketplace";
import Payment from "./pages/Payment";
import MyPage from "./pages/MyPage";
import MyGifticons from "./pages/MyGifticons";
import History from "./pages/History";
import PaymentMethods from "./pages/PaymentMethods";
import PointsMembership from "./pages/PointsMembership";
import UploadLogos from "./pages/UploadLogos";
import NotFound from "./pages/NotFound";
import ChatSupport from "./components/ChatSupport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/main" element={<Main />} />
          <Route path="/location" element={<Location />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/payment/:storeId" element={<Payment />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/my-gifticons" element={<MyGifticons />} />
          <Route path="/history" element={<History />} />
          <Route path="/points-membership" element={<PointsMembership />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
          <Route path="/upload-logos" element={<UploadLogos />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatSupport />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
