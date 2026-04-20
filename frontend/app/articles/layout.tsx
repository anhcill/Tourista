import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Cam nang du lich',
    template: '%s | Cam nang Tourista Studio',
  },
  description:
    'Doc bai viet ve kinh nghiem du lich, goi y diem den va meo dat tour hieu qua.',
};

export default function ArticlesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
