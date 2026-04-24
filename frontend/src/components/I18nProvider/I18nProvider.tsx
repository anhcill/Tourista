'use client';

import { I18nextProvider } from 'react-i18next';
import { useHydrated } from '@/hooks/useHydrated';
import i18n from '@/i18n';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const mounted = useHydrated();

  if (!mounted) {
    return <>{children}</>;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
