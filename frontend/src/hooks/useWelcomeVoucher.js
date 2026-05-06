/**
 * Hook quản lý trạng thái welcome voucher 500K.
 * Chỉ hiện cho user CHƯA đăng nhập.
 * Khi claim → lưu vào localStorage để không hiện lại.
 */
'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import welcomeVoucherApi from '@/api/welcomeVoucherApi';

const STORAGE_KEY = 'tv_welcome_voucher_dismissed';
const STORAGE_CLAIMED_KEY = 'tv_welcome_voucher_claimed';

/**
 * @returns {{
 *   voucher: object|null,           // thông tin voucher từ API
 *   isVisible: boolean,             // có hiện banner không
 *   isLoading: boolean,
 *   isClaiming: boolean,
 *   claimable: boolean,            // có thể claim được không
 *   claimed: boolean,              // đã claim rồi (hoặc đã có trong localStorage)
 *   dismissed: boolean,             // đã tắt bằng nút X
 *   onDismiss: () => void,         // tắt banner
 *   onClaim: () => Promise<void>,  // claim voucher
 * }}
 */
export function useWelcomeVoucher() {
  const { isAuthenticated } = useSelector(state => state.auth);
  const [voucher, setVoucher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);

  // Đã tắt bằng nút X hoặc đã claim rồi → không hiện
  const dismissed = typeof window !== 'undefined'
    ? localStorage.getItem(STORAGE_KEY) === '1' || localStorage.getItem(STORAGE_CLAIMED_KEY) === '1'
    : false;

  useEffect(() => {
    // Chỉ chạy cho guest user
    if (isAuthenticated) {
      setIsLoading(false);
      return;
    }

    welcomeVoucherApi.getVoucher()
      .then(res => {
        const data = res?.data?.data ?? res?.data ?? null;
        setVoucher(data);
      })
      .catch(() => {
        // Lỗi API → không hiện gì
        setVoucher(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isAuthenticated]);

  const onDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    // Trigger re-render by updating state
    setVoucher(prev => prev ? { ...prev, _dismissed: true } : null);
  };

  const onClaim = async () => {
    setIsClaiming(true);
    try {
      await welcomeVoucherApi.claimVoucher();
      // Đánh dấu đã claim → không hiện lại
      localStorage.setItem(STORAGE_CLAIMED_KEY, '1');
      localStorage.setItem(STORAGE_KEY, '1');
      setVoucher(prev => prev ? { ...prev, claimed: true, claimable: false, _dismissed: true } : null);
    } catch (err) {
      console.error('[WelcomeVoucher] Claim failed:', err);
      // Claim thất bại → vẫn hiện banner
    } finally {
      setIsClaiming(false);
    }
  };

  const isVisible = !isAuthenticated
    && !dismissed
    && !isLoading
    && voucher?.hasVoucher
    && voucher?.claimable;

  return {
    voucher,
    isVisible,
    isLoading,
    isClaiming,
    claimable: voucher?.claimable ?? false,
    claimed: voucher?.claimed ?? false,
    dismissed,
    onDismiss,
    onClaim,
  };
}
