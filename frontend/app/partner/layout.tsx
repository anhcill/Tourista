import type { Metadata } from 'next';
import PartnerShell from './PartnerShell';

export const metadata: Metadata = {
  title: 'Partner Dashboard | Tourista Studio',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PartnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PartnerShell>{children}</PartnerShell>;
}
