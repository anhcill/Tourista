'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  FaHotel, FaPlaneDeparture, FaStar, FaDollarSign, FaChartLine,
  FaChartBar, FaCalendarAlt, FaUsers, FaMoneyBillWave,
  FaArrowUp, FaArrowDown, FaSyncAlt, FaArrowRight
} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import partnerApi from '@/api/partnerApi';
import styles from './page.module.css';

const formatCurrency = (amount, currency = 'VND') => {
  const num = Number(amount || 0);
  return `${new Intl.NumberFormat('vi-VN').format(num)} ${currency}`;
};

const formatK = (num) => {
  const n = Number(num || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const PIE_COLORS = ['#0f7fb6', '#00a8a8', '#f59e0b', '#ef4444', '#8b5cf6'];

const PERIODS = [
  { label: '7 ngày', value: '7d' },
  { label: '30 ngày', value: '30d' },
  { label: '90 ngày', value: '90d' },
  { label: 'Năm nay', value: '1y' },
];

type PropertyItem = {
    name?: string;
    type: 'hotel' | 'tour';
    revenue: number;
    bookings: number;
    rating: number;
    city?: string;
};

type MonthlyBucket = {
    hotel: number;
    tour: number;
};

type HotelRecord = {
    name?: string;
    isActive?: boolean;
    totalRevenue?: number;
    totalBookings?: number;
    avgRating?: number;
    city?: string;
};

type TourRecord = {
    title?: string;
    isActive?: boolean;
    totalRevenue?: number;
    totalBookings?: number;
    avgRating?: number;
    city?: string;
};

type BookingRecord = {
    id?: string | number;
    serviceName?: string;
    hotelName?: string;
    tourTitle?: string;
    guestName?: string;
    bookingCode?: string;
    totalAmount?: number;
    status?: string;
    createdAt?: string;
};

export default function PartnerPage() {
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [tours, setTours] = useState<TourRecord[]>([]);
  const [hotelBookings, setHotelBookings] = useState<BookingRecord[]>([]);
  const [tourBookings, setTourBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [revenueStats, setRevenueStats] = useState<{
    dailyData?: { date: string; revenue: number; bookings: number }[];
    totalRevenue?: number;
    totalBookings?: number;
    avgDailyRevenue?: number;
    revenueGrowth?: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [hotelData, tourData, hotelBk, tourBk, revStats] = await Promise.all([
          partnerApi.getPartnerHotels().catch(() => []),
          partnerApi.getPartnerTours().catch(() => []),
          partnerApi.getPartnerHotelBookings({ size: 100 }).catch(() => []),
          partnerApi.getPartnerTourBookings({ size: 100 }).catch(() => []),
          partnerApi.getRevenueStats(period).catch(() => null),
        ]);

        setHotels(Array.isArray(hotelData) ? hotelData : (hotelData?.result || []));
        setTours(Array.isArray(tourData) ? tourData : (tourData?.result || []));
        setHotelBookings(Array.isArray(hotelBk) ? hotelBk : (hotelBk?.result?.content || hotelBk?.content || []));
        setTourBookings(Array.isArray(tourBk) ? tourBk : (tourBk?.result?.content || tourBk?.content || []));
        setRevenueStats(revStats?.result || revStats || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Revenue data from real backend
  const revenueData = useMemo(() => {
    if (!revenueStats || !revenueStats?.dailyData?.length) {
      // Fallback: generate empty placeholder for the selected period
      const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
      const now = new Date();
      return Array.from({ length: days }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (days - 1 - i));
        return {
          date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          fullDate: d.toISOString().slice(0, 10),
          revenue: 0,
          bookings: 0,
        };
      });
    }
    return revenueStats.dailyData.map((d) => ({
      date: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      fullDate: d.date,
      revenue: Number(d.revenue || 0),
      bookings: Number(d.bookings || 0),
    }));
  }, [revenueStats, period]);

  const totalRevenue = Number(revenueStats?.totalRevenue || 0);
  const totalBookings = Number(revenueStats?.totalBookings || 0);
  const avgDailyRevenue = Number(revenueStats?.avgDailyRevenue || 0);
  const revenueGrowth = Number(revenueStats?.revenueGrowth || 0);

  // Revenue breakdown
  const hotelRevenue = useMemo(() =>
    hotels.reduce((sum, h) => sum + Number(h.totalRevenue || 0), 0),
  [hotels]);

  const tourRevenue = useMemo(() =>
    tours.reduce((sum, t) => sum + Number(t.totalRevenue || 0), 0),
  [tours]);

  const breakdownData = [
    { name: 'Khách sạn', value: hotelRevenue },
    { name: 'Tour', value: tourRevenue },
  ].filter(d => d.value > 0);

  // Top properties
  const topProperties = useMemo(() => {
    const hotelItems = hotels.map(h => ({
      name: h.name,
      type: 'hotel',
      revenue: Number(h.totalRevenue || 0),
      bookings: Number(h.totalBookings || 0),
      rating: Number(h.avgRating || 0),
      city: h.city,
    }));
    const tourItems = tours.map(t => ({
      name: t.title,
      type: 'tour',
      revenue: Number(t.totalRevenue || 0),
      bookings: Number(t.totalBookings || 0),
      rating: Number(t.avgRating || 0),
      city: t.city,
    }));
    return [...hotelItems, ...tourItems]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [hotels, tours]);

  // Monthly comparison
  const monthlyData = useMemo(() => {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
    // Aggregate revenueData into monthly buckets
    const monthlyMap: Record<string, MonthlyBucket> = {};
    revenueData.forEach((d) => {
      const monthKey = d.fullDate ? d.fullDate.slice(0, 7) : null; // "2026-03"
      if (!monthKey) return;
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { hotel: 0, tour: 0 };
      // Split evenly for demo (backend would provide hotel/tour breakdown separately)
      const half = (d.revenue || 0) / 2;
      monthlyMap[monthKey].hotel += half;
      monthlyMap[monthKey].tour += half;
    });
    const sortedKeys = Object.keys(monthlyMap).sort().slice(0, 6);
    if (sortedKeys.length === 0) {
      return months.map((month, i) => ({
        month,
        hotel: Math.round((totalRevenue * 0.6) / 6 * (0.8 + Math.random() * 0.4)),
        tour: Math.round((totalRevenue * 0.4) / 6 * (0.8 + Math.random() * 0.4)),
      }));
    }
    return sortedKeys.map((key) => ({
      month: `T${parseInt(key.split('-')[1], 10)}`,
      hotel: Math.round(monthlyMap[key].hotel),
      tour: Math.round(monthlyMap[key].tour),
    }));
  }, [revenueData, totalRevenue]);

  // Recent bookings
  const recentBookings = useMemo(() => {
    const all: (BookingRecord & { _type: 'hotel' | 'tour'; _name: string })[] = [
      ...hotelBookings.map(b => ({ ...b, _type: 'hotel' as const, _name: b.serviceName || b.hotelName || '' })),
      ...tourBookings.map(b => ({ ...b, _type: 'tour' as const, _name: b.serviceName || b.tourTitle || '' })),
    ];
    return all
      .sort((a, b) => new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime())
      .slice(0, 5);
  }, [hotelBookings, tourBookings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      const [hotelData, tourData, hotelBk, tourBk, revStats] = await Promise.all([
        partnerApi.getPartnerHotels().catch(() => []),
        partnerApi.getPartnerTours().catch(() => []),
        partnerApi.getPartnerHotelBookings({ size: 100 }).catch(() => []),
        partnerApi.getPartnerTourBookings({ size: 100 }).catch(() => []),
        partnerApi.getRevenueStats(period).catch(() => null),
      ]);
      setHotels(Array.isArray(hotelData) ? hotelData : (hotelData?.result || []));
      setTours(Array.isArray(tourData) ? tourData : (tourData?.result || []));
      setHotelBookings(Array.isArray(hotelBk) ? hotelBk : (hotelBk?.result?.content || hotelBk?.content || []));
      setTourBookings(Array.isArray(tourBk) ? tourBk : (tourBk?.result?.content || tourBk?.content || []));
      setRevenueStats(revStats?.result || revStats || null);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Đang tải dữ liệu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p>{error}</p>
          <p className={styles.errorHint}>Bạn cần có quyền Partner/Host để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <h2>Partner Dashboard</h2>
          <p>Tổng quan doanh thu và hiệu suất kinh doanh</p>
        </div>
        <div className={styles.heroRight}>
            <div className={styles.periodSelector}>
            {PERIODS.map(p => (
              <button
                key={p.value}
                className={`${styles.periodBtn} ${period === p.value ? styles.periodBtnActive : ''}`}
                onClick={async () => {
                  setPeriod(p.value);
                  setLoading(true);
                  try {
                    const revStats = await partnerApi.getRevenueStats(p.value).catch(() => null);
                    setRevenueStats(revStats?.result || revStats || null);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className={styles.refreshBtn} onClick={handleRefresh} disabled={refreshing}>
            <FaSyncAlt className={refreshing ? styles.spinning : ''} />
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' }}>
            <FaDollarSign style={{ color: '#1d4ed8' }} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Tổng doanh thu</span>
            <strong className={styles.kpiValue}>{formatCurrency(totalRevenue)}</strong>
            <div className={`${styles.kpiChange} ${revenueGrowth >= 0 ? styles.positive : styles.negative}`}>
              {revenueGrowth >= 0 ? <FaArrowUp /> : <FaArrowDown />}
              <span>{Math.abs(revenueGrowth).toFixed(1)}% so với kỳ trước</span>
            </div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
            <FaCalendarAlt style={{ color: '#15803d' }} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Tổng đơn đặt</span>
            <strong className={styles.kpiValue}>{totalBookings}</strong>
            <span className={styles.kpiSub}>Trong kỳ đã chọn</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'linear-gradient(135deg, #fef9c3, #fef08a)' }}>
            <FaChartLine style={{ color: '#a16207' }} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Doanh thu TB/ngày</span>
            <strong className={styles.kpiValue}>{formatCurrency(avgDailyRevenue)}</strong>
            <span className={styles.kpiSub}>{revenueData.length} ngày</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon} style={{ background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)' }}>
            <FaStar style={{ color: '#be185d' }} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Đánh giá TB</span>
            <strong className={styles.kpiValue}>
              {(() => {
                const allRatings = [...hotels, ...tours].map(i => Number(i.avgRating || 0));
                const avg = allRatings.length ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0;
                return avg.toFixed(1);
              })()}
            </strong>
            <span className={styles.kpiSub}>
              {hotels.length + tours.length} dịch vụ
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Revenue Trend Chart */}
        <div className={styles.chartCard} style={{ flex: 2 }}>
          <div className={styles.chartHeader}>
            <div>
              <h3><FaChartBar /> Doanh thu theo ngày</h3>
              <p>Biểu đồ xu hướng doanh thu trong kỳ</p>
            </div>
          </div>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#6c8797' }}
                  interval={revenueData.length > 14 ? Math.floor(revenueData.length / 7) - 1 : 0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#6c8797' }}
                  tickFormatter={formatK}
                  width={50}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                  labelStyle={{ color: '#1a4058' }}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e9ecef', fontSize: 13 }}
                />
                <Bar dataKey="revenue" fill="#0f7fb6" radius={[4, 4, 0, 0]} name="Doanh thu" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className={styles.chartCard} style={{ flex: 1 }}>
          <div className={styles.chartHeader}>
            <div>
              <h3><FaMoneyBillWave /> Phân bổ doanh thu</h3>
              <p>Theo loại dịch vụ</p>
            </div>
          </div>
          <div className={styles.chartBody}>
            {breakdownData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={breakdownData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {breakdownData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Doanh thu']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.pieLegend}>
                  {breakdownData.map((item, i) => (
                    <div key={item.name} className={styles.legendItem}>
                      <span className={styles.legendDot} style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className={styles.legendLabel}>{item.name}</span>
                      <strong className={styles.legendValue}>{formatCurrency(item.value)}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.emptyChart}>Chưa có dữ liệu doanh thu</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className={styles.bottomRow}>
        {/* Top Properties */}
        <div className={styles.tableCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3><FaStar /> Top dịch vụ hiệu suất cao</h3>
              <p>Sắp xếp theo doanh thu</p>
            </div>
          </div>
          <div className={styles.tableBody}>
            {topProperties.length === 0 ? (
              <div className={styles.emptyChart}>Chưa có dữ liệu</div>
            ) : (
              <table className={styles.miniTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Dịch vụ</th>
                    <th>Loại</th>
                    <th>Đơn</th>
                    <th>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {topProperties.map((p, i) => (
                    <tr key={`${p.type}-${i}`}>
                      <td><span className={styles.rankBadge}>{i + 1}</span></td>
                      <td>
                        <div className={styles.propName}>{p.name}</div>
                        <div className={styles.propCity}>📍 {p.city || 'N/A'}</div>
                      </td>
                      <td>
                        <span className={`${styles.typeBadge} ${p.type === 'hotel' ? styles.typeHotel : styles.typeTour}`}>
                          {p.type === 'hotel' ? 'KS' : 'Tour'}
                        </span>
                      </td>
                      <td><strong>{p.bookings}</strong></td>
                      <td className={styles.revenueCell}>{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className={styles.tableCard}>
          <div className={styles.chartHeader}>
            <div>
              <h3><FaCalendarAlt /> Đơn gần đây</h3>
              <p>Hoạt động mới nhất</p>
            </div>
          </div>
          <div className={styles.tableBody}>
            {recentBookings.length === 0 ? (
              <div className={styles.emptyChart}>Chưa có đơn nào</div>
            ) : (
              <div className={styles.recentList}>
                {recentBookings.map((b, i) => (
                  <div key={`${b._type}-${b.id || i}`} className={styles.recentItem}>
                    <div className={styles.recentIcon}>
                      {b._type === 'hotel' ? <FaHotel /> : <FaPlaneDeparture />}
                    </div>
                    <div className={styles.recentInfo}>
                      <div className={styles.recentName}>{b._name || 'N/A'}</div>
                      <div className={styles.recentMeta}>
                        {b.guestName || 'Khách'} · {b.bookingCode || '-'}
                      </div>
                    </div>
                    <div className={styles.recentRight}>
                      <div className={styles.recentAmount}>{formatCurrency(b.totalAmount)}</div>
                      <span className={`${styles.recentStatus} ${styles[`status${b.status || 'PENDING'}`]}`}>
                        {b.status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Properties Summary */}
      <div className={styles.section}>
        <h3>
          <FaChartLine /> Tổng quan tài sản
        </h3>
        <div className={styles.assetGrid}>
          <div className={styles.assetCard}>
            <FaHotel className={styles.assetIcon} style={{ color: '#1d4ed8' }} />
            <div>
              <strong>{hotels.length}</strong>
              <span>Khách sạn</span>
              <small>{hotels.filter(h => h.isActive).length} đang hoạt động</small>
            </div>
          </div>
          <div className={styles.assetCard}>
            <FaPlaneDeparture className={styles.assetIcon} style={{ color: '#15803d' }} />
            <div>
              <strong>{tours.length}</strong>
              <span>Tour</span>
              <small>{tours.filter(t => t.isActive).length} đang hoạt động</small>
            </div>
          </div>
          <div className={styles.assetCard}>
            <FaUsers className={styles.assetIcon} style={{ color: '#be185d' }} />
            <div>
              <strong>{(hotelBookings.length + tourBookings.length).toLocaleString('vi-VN')}</strong>
              <span>Tổng đơn</span>
              <small>{hotelBookings.filter(b => b.status === 'CONFIRMED').length + tourBookings.filter(b => b.status === 'CONFIRMED').length} đã xác nhận</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
