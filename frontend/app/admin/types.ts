export type AdminBookingRow = {
  bookingCode: string;
  bookingType: string;
  guestName: string;
  createdAt: string | null;
  status: string;
  totalAmount: number;
  currency: string;
};

export type RevenuePoint = {
  key: string;
  label: string;
  value: number;
};

export type DashboardOverview = {
  stats: {
    totalRevenue: number;
    bookingsToday: number;
    hotelCount: number;
    tourCount: number;
    totalUsers?: number;
    totalBookings?: number;
    totalReviews?: number;
    pendingReviews?: number;
    pendingHotels?: number;
    pendingTours?: number;
    monthlyRevenue?: number;
  };
  revenueSeries: RevenuePoint[];
  recentBookings: AdminBookingRow[];
  topDestinations?: Array<{
    name: string;
    tour_count: number;
    avg_rating: number;
    review_count: number;
  }>;
  bookingsByMonth?: Array<{
    month: string;
    total_bookings: number;
    completed: number;
    cancelled: number;
    pending: number;
  }>;
  dataMode: 'live-or-partial' | 'mock';
  hasMockFallback: boolean;
};

export type AdminUserRole = 'ADMIN' | 'USER' | 'HOST';

export type AdminUserStatus = 'ACTIVE' | 'LOCKED' | 'BANNED';

export type AdminUserRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  isEmailVerified: boolean;
  authProvider: string;
  createdAt: string | null;
  lastLoginAt: string | null;
};

export type AdminUsersOverview = {
  users: AdminUserRow[];
  meta: {
    total: number;
    page: number;
    size: number;
  };
  dataMode: 'live-or-partial' | 'mock';
  hasMockFallback: boolean;
};

export type AdminHotelStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type AdminHotelRow = {
  id: string;
  name: string;
  city: string;
  address: string;
  starRating: number;
  avgRating: number;
  reviewCount: number;
  hostName: string;
  hostEmail: string;
  status: AdminHotelStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminHotelsOverview = {
  hotels: AdminHotelRow[];
  meta: {
    total: number;
    page: number;
    size: number;
  };
  dataMode: 'live-or-partial' | 'mock';
  hasMockFallback: boolean;
};

export type AdminTourStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type AdminTourRow = {
  id: string;
  title: string;
  city: string;
  location: string;
  durationDays: number;
  priceFrom: number;
  seatsTotal: number;
  seatsRemaining: number;
  operatorName: string;
  operatorEmail: string;
  status: AdminTourStatus;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminToursOverview = {
  tours: AdminTourRow[];
  meta: {
    total: number;
    page: number;
    size: number;
  };
  dataMode: 'live-or-partial' | 'mock';
  hasMockFallback: boolean;
};

export type AdminBookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type AdminBookingType = 'HOTEL' | 'TOUR';

export type AdminBookingPaymentStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';

export type AdminBookingManagementRow = {
  id: string;
  bookingCode: string;
  bookingType: AdminBookingType;
  guestName: string;
  guestEmail: string;
  serviceName: string;
  serviceCity: string;
  startDate: string | null;
  endDate: string | null;
  status: AdminBookingStatus;
  paymentStatus: AdminBookingPaymentStatus;
  totalAmount: number;
  currency: string;
  createdAt: string | null;
  note: string;
};

export type AdminBookingsOverview = {
  bookings: AdminBookingManagementRow[];
  meta: {
    total: number;
    page: number;
    size: number;
  };
  dataMode: 'live-or-partial' | 'mock';
  hasMockFallback: boolean;
};

export type AdminPromotionType = 'PERCENT' | 'FIXED';

export type AdminPromotionLifecycleStatus = 'ACTIVE' | 'INACTIVE' | 'UPCOMING' | 'EXPIRED';

export type AdminPromotionRow = {
  id: string;
  code: string;
  name: string;
  description: string;
  type: AdminPromotionType;
  value: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number;
  usedCount: number;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminPromotionsOverview = {
  promotions: AdminPromotionRow[];
  meta: {
    total: number;
    page: number;
    size: number;
  };
  dataMode: 'live-or-partial' | 'mock';
  hasMockFallback: boolean;
};

export type AdminAuditLogRow = {
  id: string;
  actorId: string | null;
  actorEmail: string;
  action: string;
  resource: string;
  resourceId: string | null;
  beforeData: string;
  afterData: string;
  reason: string;
  timestamp: string | null;
};

export type AdminAuditLogsOverview = {
  auditLogs: AdminAuditLogRow[];
  meta: {
    total: number;
    page: number;
    size: number;
  };
  dataMode: 'live-or-partial' | 'mock';
  hasMockFallback: boolean;
};
