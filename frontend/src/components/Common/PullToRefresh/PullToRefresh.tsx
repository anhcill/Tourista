'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './PullToRefresh.module.css';

export default function PullToRefresh({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [status, setStatus] = useState<'idle' | 'pulling' | 'ready' | 'refreshing'>('idle');
  const [touchStart, setTouchStart] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isEnabled, setIsEnabled] = useState(false);
  const isRefreshing = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsEnabled(window.innerWidth <= 768);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--pull-height', `${pullDistance}px`);
    }
  }, [pullDistance]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (isRefreshing.current || window.scrollY > 10) return;
    setTouchStart(e.touches[0].clientY);
    setStatus('pulling');
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isEnabled || status === 'refreshing' || window.scrollY > 10) return;
    const delta = e.touches[0].clientY - touchStart;
    if (delta > 0) {
      const dist = Math.min(delta * 0.5, 100);
      setPullDistance(dist);
      setStatus(dist >= 80 ? 'ready' : 'pulling');
    }
  };

  const onTouchEnd = async () => {
    if (!isEnabled || status === 'refreshing') return;

    if (pullDistance >= 80) {
      isRefreshing.current = true;
      setStatus('refreshing');
      try {
        await onRefresh();
      } finally {
        isRefreshing.current = false;
        setStatus('idle');
        setPullDistance(0);
        setTouchStart(0);
      }
    } else {
      setStatus('idle');
      setPullDistance(0);
    }
  };

  if (!isEnabled) return null;

  return (
    <div
      ref={containerRef}
      className={styles.pullContainer}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className={`${styles.indicator} ${styles[status]}`}>
        {status === 'pulling' && (
          <div className={styles.pullHint}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.arrowDown}>
              <path d="M12 5v14M19 12l-7 7-7-7"/>
            </svg>
            <span>Kéo xuống để tải lại</span>
          </div>
        )}
        {status === 'ready' && (
          <div className={styles.pullHint}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.arrowUp}>
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
            <span>Thả để tải lại</span>
          </div>
        )}
        {status === 'refreshing' && (
          <div className={styles.spinner}>
            <div className={styles.dot} />
            <div className={styles.dot} />
            <div className={styles.dot} />
          </div>
        )}
      </div>
    </div>
  );
}
