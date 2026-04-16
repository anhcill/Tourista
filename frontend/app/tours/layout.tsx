import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Tour du lich',
    template: '%s | Tour Tourista',
  },
  description:
    'Kham pha danh sach tour noi bat, lich trinh ro rang va dat cho nhanh tren Tourista.',
};

export default function ToursLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
