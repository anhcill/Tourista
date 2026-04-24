'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FaBuilding,
  FaCalendarDay,
  FaMoneyBillWave,
  FaPlaneDeparture,
  FaUsers,
  FaStar,
  FaSyncAlt,
  FaChartLine,
  FaChartBar,
} from 'react-icons/fa';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import adminApi from '@/api/adminApi';
import StatCard from '@/components/Admin/Common/StatCard/StatCard';
import type { DashboardOverview } from './types';
import styles from './page.module.css';

const formatVnd = (value: number) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));
const formatK = (num: number) => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return String(num);
};

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN');
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Đang chờ',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

const PIE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color?: string; fill?: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#0f172a' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: 0, color: entry.color || entry.fill, fontWeight: 600, fontSize: 12 }}>
            {entry.name}: {entry.name.includes('Doanh thu') || entry.name.includes('revenue')
              ? `${formatVnd(entry.value)} VND`
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await adminApi.getDashboardOverview();
      setOverview(data as DashboardOverview);
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  };

  // Chart data
  const revenueSeriesData = useMemo(() => {
    return (overview?.revenueSeries || []).map((item) => ({
      label: item.label,
      value: Number(item.value || 0),
    }));
  }, [overview]);

  const bookingStatusData = useMemo(() => {
    const all = overview?.recentBookings || [];
    const counts: Record<string, number> = {};
    all.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_LABELS[status] || status,
      value,
    }));
  }, [overview]);

  const bookingsByMonthData = useMemo(() => {
    return (overview?.bookingsByMonth || []).map((item) => ({
      month: item.month,
      'Đã hoàn tất': item.completed || 0,
      'Đã hủy': item.cancelled || 0,
      'Đang chờ': item.pending || 0,
    }));
  }, [overview]);

  const topDestData = useMemo(() => {
    return (overview?.topDestinations || []).map((d) => ({
      name: d.name || '-',
      tours: d.tour_count || 0,
      reviews: d.review_count || 0,
    }));
  }, [overview]);

  if (loading && !refreshing) {
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
      note: 'Từ booking đã hoàn tất',
      icon: <FaMoneyBillWave />,
      tone: 'cyan' as const,
    },
    {
      title: 'Doanh thu tháng',
      value: `${formatVnd(overview.stats.monthlyRevenue || 0)} VND`,
      note: 'Tháng này',
      icon: <FaCalendarDay />,
      tone: 'emerald' as const,
    },
    {
      title: 'Tổng khách sạn',
      value: String(overview.stats.hotelCount),
      note: `${overview.stats.pendingHotels || 0} đang chờ duyệt`,
      icon: <FaBuilding />,
      tone: 'amber' as const,
    },
    {
      title: 'Tổng tour',
      value: String(overview.stats.tourCount),
      note: `${overview.stats.pendingTours || 0} đang chờ duyệt`,
      icon: <FaPlaneDeparture />,
      tone: 'slate' as const,
    },
    {
      title: 'Tổng người dùng',
      value: String(overview.stats.totalUsers || 0),
      note: 'Tài khoản đã đăng ký',
      icon: <FaUsers />,
      tone: 'cyan' as const,
    },
    {
      title: 'Tổng đánh giá',
      value: String(overview.stats.totalReviews || 0),
      note: `${overview.stats.pendingReviews || 0} đang chờ duyệt`,
      icon: <FaStar />,
      tone: 'emerald' as const,
    },
  ] as const;

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Tổng quan Dashboard</h2>
          <p>Thống kê từ cơ sở dữ liệu thực. Dữ liệu được cập nhật mỗi 30 giây.</p>
        </div>
        <div className={styles.heroRight}>
          <span className={`${styles.dataBadge} ${overview.hasMockFallback ? styles.dataBadgeMock : styles.dataBadgeLive}`}>
            {overview.hasMockFallback ? 'Đang dùng dữ liệu mock fallback' : 'Dữ liệu thực từ database'}
          </span>
          <button className={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
            <FaSyncAlt className={refreshing ? styles.spinning : ''} />
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
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

      {/* Charts Row 1: Revenue Area Chart + Booking Status Donut */}
      <div className={styles.panelGrid}>
        {/* Revenue Area Chart */}
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3><FaChartLine /> Doanh thu 12 tháng gần nhất</h3>
              <p>Đơn vị: VND — Biểu đồ diện tích</p>
            </div>
          </div>
          <div className={styles.chartWrap}>
            {revenueSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenueSeriesData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f7fb6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0f7fb6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#6c8797' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6c8797' }}
                    tickFormatter={formatK}
                    width={52}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [formatVnd(Number(value)) + ' VND', 'Doanh thu']}
                    labelStyle={{ color: '#1a4058', fontWeight: 700 }}
                    contentStyle={{ borderRadius: 10, border: '1px solid #e9ecef', fontSize: 13 }}
                    cursor={{ stroke: '#0f7fb6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#0f7fb6"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#0f7fb6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>Chưa có dữ liệu doanh thu</div>
            )}
          </div>
        </article>

        {/* Booking Status Donut */}
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3><FaChartBar /> Trạng thái đơn đặt gần đây</h3>
              <p>Phân bổ theo trạng thái</p>
            </div>
          </div>
          <div className={styles.chartWrap}>
            {bookingStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {bookingStatusData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [value, 'Đơn']}
                      contentStyle={{ borderRadius: 10, border: '1px solid #e9ecef', fontSize: 13 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.pieLegend}>
                  {bookingStatusData.map((item, i) => (
                    <div key={item.name} className={styles.legendItem}>
                      <span
                        className={styles.legendDot}
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className={styles.legendLabel}>{item.name}</span>
                      <strong className={styles.legendValue}>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.emptyChart}>Chưa có dữ liệu booking</div>
            )}
          </div>
        </article>
      </div>

      {/* Charts Row 2: Bookings by Month Bar Chart + Top Destinations */}
      {bookingsByMonthData.length > 0 && (
        <div className={styles.panelGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h3><FaChartBar /> Bookings theo tháng</h3>
                <p>Phân bổ trạng thái booking mỗi tháng</p>
              </div>
            </div>
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bookingsByMonthData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6c8797' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6c8797' }} width={36} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #e9ecef', fontSize: 13 }}
                    cursor={{ fill: 'rgba(15,127,182,0.05)' }}
                  />
                  <Bar dataKey="Đã hoàn tất" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} name="Đã hoàn tất" />
                  <Bar dataKey="Đã xác nhận" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="Đã xác nhận" />
                  <Bar dataKey="Đã hủy" stackId="a" fill="#ef4444" radius={[3, 3, 0, 0]} name="Đã hủy" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          {topDestData.length > 0 && (
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h3><FaPlaneDeparture /> Top điểm đến phổ biến</h3>
                  <p>Theo số tour và review</p>
                </div>
              </div>
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topDestData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#6c8797' }} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#6c8797' }}
                      width={60}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value, name) => [value, name === 'tours' ? 'Số tour' : 'Reviews']}
                      contentStyle={{ borderRadius: 10, border: '1px solid #e9ecef', fontSize: 13 }}
                    />
                    <Bar dataKey="tours" fill="#0f7fb6" radius={[0, 4, 4, 0]} name="Số tour" />
                    <Bar dataKey="reviews" fill="#00a8a8" radius={[0, 4, 4, 0]} name="Reviews" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          )}
        </div>
      )}

      {/* Recent Bookings Table */}
      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3><FaCalendarDay /> Booking gần đây</h3>
            <p>Top 10 booking mới nhất</p>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Guest</th>
                <th>Service</th>
                <th>Time</th>
                <th>Status</th>
                <th className={styles.alignRight}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentBookings.length > 0 ? (
                overview.recentBookings.map((booking) => {
                  const statusClass = styles[`status${booking.status}`] || styles.statusPending;
                  return (
                    <tr key={booking.bookingCode}>
                      <td><strong>{booking.bookingCode}</strong></td>
                      <td>{booking.guestName}</td>
                      <td>{booking.bookingType}</td>
                      <td>{formatDateTime(booking.createdAt)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${statusClass}`}>
                          {STATUS_LABELS[booking.status] || booking.status}
                        </span>
                      </td>
                      <td className={styles.alignRight}>{formatVnd(booking.totalAmount)} {booking.currency}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyChart}>Chưa có booking nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
