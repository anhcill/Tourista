'use client';

import { useCallback, useRef, useState } from 'react';
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

type AppShellClientProps = {
  children: ReactNode;
};

export default function AppShellClient({ children }: AppShellClientProps) {
  useServiceWorker();
  const pathname = usePathname();
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            {isHotelDetailPage ? <DetailTopSearchBar /> : <Header />}
            <main className="app-main">{children}</main>
            <MobileBottomNav />
            <Footer />
            <Toast />
            <BotChatWidget />
          </div>
        )}
      </ReduxProvider>
    </ThemeProvider>
  );
}
