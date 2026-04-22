import type { Metadata } from 'next';
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import AppShellClient from "@/components/Layout/AppShellClient";
import I18nProvider from "@/components/I18nProvider/I18nProvider";

const inter = Inter({
  subsets: ["latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Tourista Studio | Dat tour va khach san',
    template: '%s | Tourista Studio',
  },
  description:
    'Nen tang dat tour du lich va khach san tai Viet Nam voi quy trinh nhanh, minh bach va an toan.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Tourista Studio | Dat tour va khach san',
    description:
      'Kham pha tour va khach san chat luong cao, dat lich nhanh, thanh toan tien loi.',
    url: siteUrl,
    siteName: 'Tourista Studio',
    locale: 'vi_VN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} ${poppins.variable}`}>
        <I18nProvider>
          <AppShellClient>{children}</AppShellClient>
        </I18nProvider>
      </body>
    </html>
  );
}
