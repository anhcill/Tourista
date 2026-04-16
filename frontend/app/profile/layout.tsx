import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Tai khoan',
    template: '%s | Tai khoan Tourista',
  },
  description: 'Quan ly thong tin ca nhan, lich su dat tour va don dat phong tren Tourista.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
