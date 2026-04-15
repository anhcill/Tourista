import type { Page } from '@playwright/test';

type SeedRole = 'USER' | 'ADMIN';

type SeedUser = {
  id: number;
  email: string;
  fullName: string;
  role: SeedRole;
  avatarUrl?: string;
  phone?: string;
};

export const createSeedUser = (role: SeedRole = 'USER'): SeedUser => {
  if (role === 'ADMIN') {
    return {
      id: 1,
      email: 'admin@tourista.vn',
      fullName: 'Tourista Admin',
      role: 'ADMIN',
      avatarUrl: '',
      phone: '0900000001',
    };
  }

  return {
    id: 2,
    email: 'user@tourista.vn',
    fullName: 'Tourista User',
    role: 'USER',
    avatarUrl: '',
    phone: '0900000002',
  };
};

export const seedAuthStorage = async (page: Page, role: SeedRole = 'USER') => {
  const user = createSeedUser(role);

  await page.addInitScript((payload) => {
    window.localStorage.setItem('tourista_token', payload.token);
    window.localStorage.setItem('tourista_refresh_token', payload.refreshToken);
    window.localStorage.setItem('tourista_user', JSON.stringify(payload.user));
  }, {
    token: 'seed-token-for-e2e',
    refreshToken: 'seed-refresh-token-for-e2e',
    user,
  });

  return user;
};
