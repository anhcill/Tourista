'use client';

import { Inter, Poppins } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import ReduxProvider from "../src/store/ReduxProvider";
import Header from "../src/components/Layout/Header/Header";
import Footer from "../src/components/Layout/Footer/Footer";
import Toast from "../src/components/Common/Toast/Toast";
import DetailTopSearchBar from "../src/components/Hotels/DetailTopSearchBar/DetailTopSearchBar";
import BotChatWidget from "../src/components/Chat/BotChatWidget";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const authPathPrefixes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/oauth2',
  ];
  const isAuthPage = authPathPrefixes.some((prefix) =>
    pathname === prefix || (pathname || '').startsWith(`${prefix}/`),
  );
  const isAdminRoute = (pathname || '').startsWith('/admin');
  const isHotelDetailPage = /^\/hotels\/\d+$/.test(pathname || '');

  return (
    <html lang="vi">
      <body className={`${inter.variable} ${poppins.variable}`}>
        <ReduxProvider>
          {isAuthPage || isAdminRoute ? (
            // Auth pages and admin shell: no public header/footer
            <>
              {children}
              <Toast />
            </>
          ) : (
            // Regular pages: with header/footer
            <div className="app-shell">
              {isHotelDetailPage ? <DetailTopSearchBar /> : <Header />}
              <main className="app-main">
                {children}
              </main>
              <Footer />
              <Toast />
              {/* Bot Chat Widget — floating button góc dưới phải mọi trang */}
              <BotChatWidget />
            </div>
          )}
        </ReduxProvider>
      </body>
    </html>
  );
}
