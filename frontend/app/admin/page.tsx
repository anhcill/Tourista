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
  PENDING: 'Đang chờ',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
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
        setOverview(data as DashboardOverview);
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
          <h2>Tổng quan Dashboard</h2>
          <p>Đang tải dữ liệu dashboard...</p>
        </div>
      </section>
    );
  }

  if (error || !overview) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Tổng quan Dashboard</h2>
          <p>{error || 'Không có dữ liệu dashboard.'}</p>
        </div>
      </section>
    );
  }

  const statCards = [
    {
      title: 'Tổng doanh thu',
      value: `${formatVnd(overview.stats.totalRevenue)} VND`,
      note: 'Tổng doanh thu từ danh sách booking hiện có',
      icon: <FaMoneyBillWave />,
      tone: 'cyan',
    },
    {
      title: 'Booking hôm nay',
      value: String(overview.stats.bookingsToday),
      note: 'Số booking được tạo trong ngày',
      icon: <FaCalendarDay />,
      tone: 'emerald',
    },
    {
      title: 'Tổng số khách sạn',
      value: String(overview.stats.hotelCount),
      note: 'Số khách sạn lấy được từ API',
      icon: <FaBuilding />,
      tone: 'amber',
    },
    {
      title: 'Tổng số tour',
      value: String(overview.stats.tourCount),
      note: 'Số tour lấy được từ API',
      icon: <FaPlaneDeparture />,
      tone: 'slate',
    },
  ] as const;

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Tổng quan Dashboard</h2>
          <p>Đã kết nối dữ liệu dashboard, biểu đồ doanh thu 6 tháng và recent bookings.</p>
        </div>

        <span className={`${styles.dataBadge} ${overview.hasMockFallback ? styles.dataBadgeMock : styles.dataBadgeLive}`}>
          {overview.hasMockFallback ? 'Đang dùng dữ liệu mock fallback' : 'Đang dùng dữ liệu API'}
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
            <h3>Doanh thu 6 tháng gần nhất</h3>
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
            <h3>Các Booking gần đây</h3>
            <p>Top 6 booking mới nhất</p>
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
