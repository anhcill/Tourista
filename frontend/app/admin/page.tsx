'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FaBuilding,
  FaCalendarDay,
  FaMoneyBillWave,
  FaPlaneDeparture,
} from 'react-icons/fa';
import adminApi from '@/api/adminApi';
import StatCard from '@/components/Admin/Common/StatCard/StatCard';
import type { DashboardOverview } from './types';
import styles from './page.module.css';

const formatVnd = (value: number) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN');
};

const statusLabelMap: Record<string, string> = {
  PENDING: 'Dang cho',
  CONFIRMED: 'Da xac nhan',
  COMPLETED: 'Hoan tat',
  CANCELLED: 'Da huy',
};

const statusClassMap: Record<string, string> = {
  PENDING: 'statusPending',
  CONFIRMED: 'statusConfirmed',
  COMPLETED: 'statusCompleted',
  CANCELLED: 'statusCancelled',
};

const getBarLevel = (value: number, max: number) => {
  if (max <= 0 || value <= 0) return 1;
  return Math.max(1, Math.min(10, Math.ceil((value / max) * 10)));
};

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await adminApi.getDashboardOverview();
        setOverview(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Khong the tai dashboard admin.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const revenueMax = useMemo(() => {
    const series = overview?.revenueSeries || [];
    return series.reduce((max, item) => Math.max(max, Number(item.value || 0)), 0);
  }, [overview]);

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Dashboard Tong quan</h2>
          <p>Dang tai du lieu dashboard...</p>
        </div>
      </section>
    );
  }

  if (error || !overview) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Dashboard Tong quan</h2>
          <p>{error || 'Khong co du lieu dashboard.'}</p>
        </div>
      </section>
    );
  }

  const statCards = [
    {
      title: 'Tong doanh thu',
      value: `${formatVnd(overview.stats.totalRevenue)} VND`,
      note: 'Tong doanh thu tu danh sach booking hien co',
      icon: <FaMoneyBillWave />,
      tone: 'cyan',
    },
    {
      title: 'Booking hom nay',
      value: String(overview.stats.bookingsToday),
      note: 'So booking duoc tao trong ngay',
      icon: <FaCalendarDay />,
      tone: 'emerald',
    },
    {
      title: 'Tong so hotel',
      value: String(overview.stats.hotelCount),
      note: 'So hotel lay duoc tu API',
      icon: <FaBuilding />,
      tone: 'amber',
    },
    {
      title: 'Tong so tour',
      value: String(overview.stats.tourCount),
      note: 'So tour lay duoc tu API',
      icon: <FaPlaneDeparture />,
      tone: 'slate',
    },
  ] as const;

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Dashboard Tong quan</h2>
          <p>Day 2: da ket noi dashboard data, chart doanh thu 6 thang va recent bookings.</p>
        </div>

        <span className={`${styles.dataBadge} ${overview.hasMockFallback ? styles.dataBadgeMock : styles.dataBadgeLive}`}>
          {overview.hasMockFallback ? 'Dang dung du lieu mock fallback' : 'Dang dung du lieu API'}
        </span>
      </div>

      <div className={styles.statGrid}>
        {statCards.map((item) => (
          <StatCard
            key={item.title}
            icon={item.icon}
            title={item.title}
            value={item.value}
            note={item.note}
            tone={item.tone}
          />
        ))}
      </div>

      <div className={styles.panelGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Doanh thu 6 thang gan nhat</h3>
            <p>Don vi: VND</p>
          </div>

          <div className={styles.chartWrap}>
            {overview.revenueSeries.map((item) => {
              const barLevel = getBarLevel(Number(item.value || 0), revenueMax);
              const levelClass = styles[`level${barLevel}`] || styles.level1;

              return (
                <div key={item.key} className={styles.chartItem}>
                  <div className={styles.chartTrack}>
                    <span className={`${styles.chartFill} ${levelClass}`} />
                  </div>
                  <strong>{formatVnd(item.value)}</strong>
                  <small>{item.label}</small>
                </div>
              );
            })}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Recent Bookings</h3>
            <p>Top 6 booking moi nhat</p>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Guest</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th className={styles.alignRight}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentBookings.map((booking) => {
                  const statusClass = statusClassMap[booking.status] || styles.statusPending;
                  return (
                    <tr key={booking.bookingCode}>
                      <td>{booking.bookingCode}</td>
                      <td>{booking.bookingType}</td>
                      <td>{booking.guestName}</td>
                      <td>{formatDateTime(booking.createdAt)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${statusClass}`}>
                          {statusLabelMap[booking.status] || booking.status}
                        </span>
                      </td>
                      <td className={styles.alignRight}>{formatVnd(booking.totalAmount)} {booking.currency}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
