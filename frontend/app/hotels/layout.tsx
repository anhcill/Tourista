import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Khach san',
    template: '%s | Khach san Tourista',
  },
  description:
    'Tim va dat khach san theo diem den, ngay luu tru, tien nghi va muc gia phu hop.',
};

export default function HotelsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
