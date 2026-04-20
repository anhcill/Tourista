'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import ReduxProvider from '@/store/ReduxProvider';
import Header from '@/components/Layout/Header/Header';
import Footer from '@/components/Layout/Footer/Footer';
import Toast from '@/components/Common/Toast/Toast';
import DetailTopSearchBar from '@/components/Hotels/DetailTopSearchBar/DetailTopSearchBar';
import BotChatWidget from '@/components/Chat/BotChatWidget';
import { ThemeProvider } from '@/components/ThemeProvider/ThemeProvider';

type AppShellClientProps = {
  children: ReactNode;
};

export default function AppShellClient({ children }: AppShellClientProps) {
  const pathname = usePathname();
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
            {isHotelDetailPage ? <DetailTopSearchBar /> : <Header />}
            <main className="app-main">{children}</main>
            <Footer />
            <Toast />
            <BotChatWidget />
          </div>
        )}
      </ReduxProvider>
    </ThemeProvider>
  );
}
