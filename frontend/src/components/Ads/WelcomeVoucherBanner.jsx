'use client';

import React, { useState } from 'react';
import { FaTimes, FaGift, FaCopy } from 'react-icons/fa';
import { useWelcomeVoucher } from '@/hooks/useWelcomeVoucher';
import styles from './WelcomeVoucherBanner.module.css';

const WelcomeVoucherBanner = () => {
  const { isVisible, voucher, isClaiming, onDismiss, onClaim } = useWelcomeVoucher();
  const [copied, setCopied] = useState(false);

  if (!isVisible) return null;

  const handleCopy = async () => {
    if (voucher?.code) {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClaim = async () => {
    await onClaim();
  };

  return (
    <div className={styles.banner}>
      <div className={styles.container}>
        {/* Left: Gift icon + text */}
        <div className={styles.leftSide}>
          <div className={styles.iconWrap}>
            <FaGift className={styles.icon} />
          </div>
          <div className={styles.textContent}>
            <span className={styles.badge}>🎁 Voucher mới</span>
            <h4 className={styles.title}>Chuyến đi đầu tiên — Miễn phí 500K!</h4>
            <p className={styles.subtitle}>
              Đặt tour hoặc khách sạn đầu tiên, nhận ngay{' '}
              <strong className={styles.highlight}>voucher giảm 500.000đ</strong>
              {' '}cho đơn từ 500K.
            </p>
          </div>
        </div>

        {/* Right: Code + buttons */}
        <div className={styles.rightSide}>
          <div className={styles.codeWrap}>
            <span className={styles.codeLabel}>Mã của bạn</span>
            <div className={styles.codeRow}>
              <code className={styles.code}>{voucher?.code || 'WELCOME500K'}</code>
              <button
                className={styles.copyBtn}
                onClick={handleCopy}
                title="Sao chép mã"
              >
                <FaCopy size={12} />
              </button>
            </div>
            <span className={styles.minOrder}>Đơn tối thiểu: {voucher?.minOrderAmount
              ? `${(voucher.minOrderAmount / 1000).toLocaleString('vi-VN')}K`
              : '500K'}</span>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.claimBtn}
              onClick={handleClaim}
              disabled={isClaiming}
            >
              {isClaiming ? 'Đang xử lý...' : 'Lưu vào tài khoản'}
            </button>
            {copied && <span className={styles.copiedMsg}>Đã sao chép!</span>}
          </div>
        </div>

        {/* Close button */}
        <button className={styles.closeBtn} onClick={onDismiss} aria-label="Đóng thông báo">
          <FaTimes size={14} />
        </button>
      </div>
    </div>
  );
};

export default WelcomeVoucherBanner;
