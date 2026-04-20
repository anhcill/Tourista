'use client';

import { useState, useCallback } from 'react';
import { FaShareAlt, FaLink, FaFacebook, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import styles from './ShareButtons.module.css';

type ShareTarget = 'facebook' | 'zalo' | 'copy';

interface ShareButtonsProps {
  url?: string;
  title: string;
  description?: string;
  image?: string;
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
}

export default function ShareButtons({
  url,
  title,
  description,
  image,
  size = 'md',
  label,
  className = '',
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = useCallback(() => {
    if (url) return url;
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  }, [url]);

  const handleNativeShare = async () => {
    const shareUrl = getShareUrl();
    if (!navigator.share) {
      toast.info('Trình duyệt không hỗ trợ chia sẻ trực tiếp. Hãy dùng các nút bên dưới.');
      return;
    }
    try {
      await navigator.share({
        title,
        text: description,
        url: shareUrl,
      });
    } catch {
      // User cancelled or error — silent
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = getShareUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      toast.success('Đã sao chép link!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Không thể sao chép link.');
    }
  };

  const handleShare = (target: ShareTarget) => {
    const shareUrl = encodeURIComponent(getShareUrl());
    const encodedTitle = encodeURIComponent(title);
    const encodedDesc = encodeURIComponent(description || '');

    switch (target) {
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${encodedTitle}`,
          '_blank',
          'width=600,height=400,noopener,noreferrer'
        );
        break;
      case 'zalo':
        window.open(
          `https://chat.zalo.me/?link=${shareUrl}`,
          '_blank',
          'width=600,height=700,noopener,noreferrer'
        );
        break;
      default:
        void handleCopyLink();
    }
  };

  const btnClass = `${styles.btn} ${size === 'sm' ? styles.btnSm : ''} ${className}`;

  return (
    <div className={`${styles.wrap} ${size === 'sm' ? styles.wrapSm : ''}`}>
      {label && <span className={styles.label}>{label}</span>}

      <button
        type="button"
        className={`${styles.btn} ${styles.btnShare} ${size === 'sm' ? styles.btnSm : ''}`}
        onClick={handleNativeShare}
        title="Chia sẻ..."
      >
        <FaShareAlt />
        {size === 'md' && <span>Chia sẻ</span>}
      </button>

      <button
        type="button"
        className={`${styles.btn} ${styles.btnFb} ${size === 'sm' ? styles.btnSm : ''}`}
        onClick={() => handleShare('facebook')}
        title="Chia sẻ lên Facebook"
      >
        <FaFacebook />
        {size === 'md' && <span>Facebook</span>}
      </button>

      <button
        type="button"
        className={`${styles.btn} ${styles.btnZalo} ${size === 'sm' ? styles.btnSm : ''}`}
        onClick={() => handleShare('zalo')}
        title="Chia sẻ qua Zalo"
      >
        <span className={styles.zaloIcon}>Z</span>
        {size === 'md' && <span>Zalo</span>}
      </button>

      <button
        type="button"
        className={`${styles.btn} ${copied ? styles.btnCopied : styles.btnCopy} ${size === 'sm' ? styles.btnSm : ''}`}
        onClick={() => handleShare('copy')}
        title="Sao chép link"
      >
        {copied ? <FaCheck /> : <FaLink />}
        {size === 'md' && <span>{copied ? 'Đã sao!' : 'Copy link'}</span>}
      </button>
    </div>
  );
}
