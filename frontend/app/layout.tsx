import type { Metadata } from 'next';
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import AppShellClient from "@/components/Layout/AppShellClient";

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Tourista | Dat tour va khach san',
    template: '%s | Tourista',
  },
  description:
    'Nen tang dat tour du lich va khach san tai Viet Nam voi quy trinh nhanh, minh bach va an toan.',
  openGraph: {
    title: 'Tourista | Dat tour va khach san',
    description:
      'Kham pha tour va khach san chat luong cao, dat lich nhanh, thanh toan tien loi.',
    url: siteUrl,
    siteName: 'Tourista',
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
        <AppShellClient>{children}</AppShellClient>
      </body>
    </html>
  );
}
