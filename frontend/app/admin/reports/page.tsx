'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  FaChartBar,
  FaChartLine,
  FaHotel,
  FaPlaneDeparture,
  FaReceipt,
  FaSyncAlt,
  FaUsers,
} from 'react-icons/fa';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import adminApi from '@/api/adminApi';
import type { DashboardOverview } from '../types';
import styles from './page.module.css';

const formatVnd = (v: unknown) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));

type StatsShape = {
  totalRevenue?: number;
  monthlyRevenue?: number;
  hotelCount?: number;
  tourCount?: number;
  totalUsers?: number;
  totalReviews?: number;
  pendingHotels?: number;
  pendingTours?: number;
  pendingReviews?: number;
};

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardOverview | null>(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError('');

      const data = await adminApi.getDashboardOverview({ force: true });
      setStats(data as DashboardOverview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải báo cáo.');
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const revenueData = useMemo(() => {
    if (!stats?.revenueSeries?.length) return [];
    return stats.revenueSeries.map((item) => ({
      label: item.label,
      value: Number(item.value || 0),
    }));
  }, [stats]);

  const bookingsData = useMemo(() => {
    if (!stats?.bookingsByMonth?.length) return [];
    return stats.bookingsByMonth.map((item) => ({
      month: item.month,
      completed: item.completed || 0,
      cancelled: item.cancelled || 0,
      pending: item.pending || 0,
    }));
  }, [stats]);

  if (loading && !refreshing) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Báo cáo & Thống kê</h2>
          <p>Đang tải dữ liệu...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Báo cáo & Thống kê</h2>
          <p className={styles.error}>{error}</p>
        </div>
      </section>
    );
  }

  const s: StatsShape = stats?.stats || {};

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Báo cáo & Thống kê</h2>
          <p>Tổng quan doanh thu và hoạt động kinh doanh trên toàn hệ thống.</p>
        </div>
        <div className={styles.heroActions}>
          <button className={styles.refreshBtn} onClick={() => void load({ silent: true })} disabled={refreshing}>
            <FaSyncAlt className={refreshing ? styles.spinning : ''} />
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dbeafe' }}>
            <FaReceipt style={{ color: '#1d4ed8' }} />
          </div>
          <div>
            <span className={styles.statLabel}>Tổng doanh thu</span>
            <strong className={styles.statValue}>{formatVnd(s.totalRevenue)} VND</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dcfce7' }}>
            <FaChartLine style={{ color: '#15803d' }} />
          </div>
          <div>
            <span className={styles.statLabel}>Doanh thu tháng</span>
            <strong className={styles.statValue}>{formatVnd(s.monthlyRevenue)} VND</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef9c3' }}>
            <FaHotel style={{ color: '#a16207' }} />
          </div>
          <div>
            <span className={styles.statLabel}>Khách sạn</span>
            <strong className={styles.statValue}>{s.hotelCount || 0}</strong>
            <small>{(s.pendingHotels || 0) > 0 ? `${s.pendingHotels} chờ duyệt` : 'Tất cả đã duyệt'}</small>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fce7f3' }}>
            <FaPlaneDeparture style={{ color: '#be185d' }} />
          </div>
          <div>
            <span className={styles.statLabel}>Tour</span>
            <strong className={styles.statValue}>{s.tourCount || 0}</strong>
            <small>{(s.pendingTours || 0) > 0 ? `${s.pendingTours} chờ duyệt` : 'Tất cả đã duyệt'}</small>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#e0e7ff' }}>
            <FaUsers style={{ color: '#4338ca' }} />
          </div>
          <div>
            <span className={styles.statLabel}>Người dùng</span>
            <strong className={styles.statValue}>{(s.totalUsers || 0).toLocaleString('vi-VN')}</strong>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef3c7' }}>
            <FaChartBar style={{ color: '#d97706' }} />
          </div>
          <div>
            <span className={styles.statLabel}>Đánh giá</span>
            <strong className={styles.statValue}>{s.totalReviews || 0}</strong>
            <small>{(s.pendingReviews || 0) > 0 ? `${s.pendingReviews} chờ duyệt` : 'Không có chờ duyệt'}</small>
          </div>
        </div>
      </div>

      {revenueData.length ? (
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3><FaChartLine /> Doanh thu 12 tháng gần nhất</h3>
          </div>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6c8797' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6c8797' }} width={52} tickLine={false} />
                <Tooltip
                  formatter={(value) => [formatVnd(value) + ' VND', 'Doanh thu']}
                  labelStyle={{ color: '#1a4058', fontWeight: 700 }}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e9ecef', fontSize: 13 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0f7fb6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0f7fb6' }}
                  activeDot={{ r: 5, fill: '#0f7fb6', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      ) : null}

      {/* Bookings by Month */}
      {bookingsData.length ? (
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3><FaChartBar /> Bookings theo tháng</h3>
          </div>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bookingsData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6c8797' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6c8797' }} width={36} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: '1px solid #e9ecef', fontSize: 13 }}
                  cursor={{ fill: 'rgba(15,127,182,0.05)' }}
                />
                <Bar dataKey="completed" fill="#22c55e" name="Hoàn tất" radius={[3, 3, 0, 0]} />
                <Bar dataKey="pending" fill="#f59e0b" name="Đang chờ" radius={[3, 3, 0, 0]} />
                <Bar dataKey="cancelled" fill="#ef4444" name="Đã hủy" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      ) : null}

      {stats?.topDestinations?.length ? (
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3><FaPlaneDeparture /> Top điểm đến phổ biến</h3>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Điểm đến</th>
                  <th>Số tour</th>
                  <th>Đánh giá TB</th>
                  <th>Số đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {stats.topDestinations.map((d, i) => (
                  <tr key={i}>
                    <td><strong>{d.name || '-'}</strong></td>
                    <td>{(d.tour_count || 0).toLocaleString('vi-VN')}</td>
                    <td>⭐ {(d.avg_rating || 0).toFixed(1)}</td>
                    <td>{(d.review_count || 0).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}
    </section>
  );
}
