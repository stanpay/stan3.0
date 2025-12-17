import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

// 🚀 Toss Payments SDK 사전 로딩 (관리자 페이지가 아닐 때만)
const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;
const isAdminPath = window.location.pathname.startsWith('/admin');

if (clientKey && !isAdminPath) {
  console.log('⚡ Toss Payments SDK 사전 로딩 시작');
  const preloadStart = performance.now();
  
  loadTossPayments(clientKey)
    .then(() => {
      const preloadTime = Math.round(performance.now() - preloadStart);
      console.log(`✅ Toss Payments SDK 사전 로딩 완료 (${preloadTime}ms)`);
    })
    .catch((error) => {
      console.error('⚠️ Toss Payments SDK 사전 로딩 실패:', error);
    });
} else if (isAdminPath) {
  console.log('ℹ️ 관리자 페이지: Toss Payments SDK 로딩 건너뜀');
}

createRoot(document.getElementById("root")!).render(<App />);
