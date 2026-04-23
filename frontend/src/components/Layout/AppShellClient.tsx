'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import ReduxProvider from '@/store/ReduxProvider';
import Header from '@/components/Layout/Header/Header';
import Footer from '@/components/Layout/Footer/Footer';
import MobileBottomNav from '@/components/Layout/MobileBottomNav/MobileBottomNav';
import Toast from '@/components/Common/Toast/Toast';
import DetailTopSearchBar from '@/components/Hotels/DetailTopSearchBar/DetailTopSearchBar';
import BotChatWidget from '@/components/Chat/BotChatWidget';
import { ThemeProvider } from '@/components/ThemeProvider/ThemeProvider';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import PullToRefresh from '@/components/Common/PullToRefresh/PullToRefresh';
import { p2pModalBus } from '@/utils/p2pModalBus';

type AppShellClientProps = {
  children: ReactNode;
};

export default function AppShellClient({ children }: AppShellClientProps) {
  useServiceWorker();
  const pathname = usePathname();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isP2PModalOpen, setIsP2PModalOpen] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to P2P modal open/close events (no Redux dependency here)
  useEffect(() => {
    const unsub = p2pModalBus.subscribe((open) => {
      setIsP2PModalOpen(open);
    });
    return unsub;
  }, []);

  // Lock body scroll when P2P chat modal is open
  useEffect(() => {
    if (isP2PModalOpen) {
      document.body.classList.add('chat-modal-open');
    } else {
      document.body.classList.remove('chat-modal-open');
    }
    return () => {
      document.body.classList.remove('chat-modal-open');
    };
  }, [isP2PModalOpen]);

  const handleRefresh = useCallback(async () => {
    if (refreshTimer.current) return;
    refreshTimer.current = setTimeout(() => {
      refreshTimer.current = null;
    }, 1000);
    window.location.reload();
  }, []);

  const authPathPrefixes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/oauth2',
  ];

  const isAuthPage = authPathPrefixes.some(
    (prefix) => pathname === prefix || (pathname || '').startsWith(`${prefix}/`),
  );
  const isAdminRoute = (pathname || '').startsWith('/admin');
  const isHotelDetailPage = /^\/hotels\/\d+$/.test(pathname || '');

  return (
    <ThemeProvider>
      <ReduxProvider>
        {isAuthPage || isAdminRoute ? (
          <>
            {children}
            <Toast />
          </>
        ) : (
          <div className="app-shell">
            <PullToRefresh onRefresh={handleRefresh} key={refreshKey} />
            {!isP2PModalOpen && (isHotelDetailPage ? <DetailTopSearchBar /> : <Header />)}
            <main className="app-main">{children}</main>
            {!isP2PModalOpen && <MobileBottomNav />}
            <Footer />
            <Toast />
            <BotChatWidget />
          </div>
        )}
      </ReduxProvider>
    </ThemeProvider>
  );
}
