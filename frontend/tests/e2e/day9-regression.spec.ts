import { test, expect } from '@playwright/test';
import { mockApi } from './helpers/mockApi';
import { seedAuthStorage } from './helpers/session';

test.describe('Day 9 E2E Regression', () => {
  test('login flow redirects after successful authentication', async ({ page }) => {
    await mockApi(page, { loginRole: 'USER' });

    await page.goto('/login');

    const loginForm = page.locator('form').first();
    await loginForm.getByPlaceholder('Email của bạn').fill('user@tourista.vn');
    await loginForm.getByPlaceholder('Mật khẩu').fill('Password123!');
    await page.getByRole('button', { name: /Bắt đầu khám phá|Bat dau kham pha/i }).click();

    await expect(page).toHaveURL(/\/$/);
  });

  test('tour booking flow reaches payment success and booking history', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page, { loginRole: 'USER' });

    await page.goto('/tours/search?city=Da%20Nang&departureDate=2026-08-20&adults=2&children=1');
    await expect(page.getByRole('heading', { name: /Tour tại Da Nang|Tour tai Da Nang/i })).toBeVisible();

    await page.goto('/tours/1');
    await expect(page).toHaveURL(/\/tours\/1$/);

    await page.goto('/tours/1/book?departureId=501&departureDate=2026-08-20&adults=2&children=1');
    await expect(page).toHaveURL(/\/tours\/1\/book/);

    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /Xác nhận đặt tour|Xac nhan dat tour/i }).click();

    await expect(page).toHaveURL(/\/payments\/success/);
    await expect(page.getByRole('heading', { name: /Thanh toán thành công|Thanh toan thanh cong|Thanh toán đang xử lý/i })).toBeVisible();

    await page.getByRole('button', { name: /Xem lịch sử booking|Xem lich su booking/i }).click();
    await expect(page).toHaveURL(/\/profile\/bookings/);
    await expect(page.getByText(/Lịch sử booking|Lich su booking/i)).toBeVisible();
  });

  test('profile and favorites pages render authenticated data', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page, { loginRole: 'USER' });

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile/);
    await expect(
      page.getByText(/Dang tai thong tin profile|Hồ sơ của tôi|Ho so cua toi/i).first(),
    ).toBeVisible();

    await page.goto('/favorites');
    await expect(page.getByRole('heading', { name: /Danh sách yêu thích|Danh sach yeu thich/i })).toBeVisible();
    await expect(page.getByText(/Da Nang Discovery 4N3D/i)).toBeVisible();
  });

  test('admin basic dashboard loads key widgets', async ({ page }) => {
    await seedAuthStorage(page, 'ADMIN');
    await mockApi(page, { loginRole: 'ADMIN' });

    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: /Tourista Admin/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Dashboard Tong quan/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Recent Bookings/i })).toBeVisible();
  });
});
