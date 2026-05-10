import axiosClient from "./axiosClient";
import {
  extractList,
  extractPaging,
  normalizeUsers,
  normalizeHotels,
  normalizeTours,
  normalizeAdminBookings,
  normalizePromotions,
  normalizeAuditLogs,
  normalizeRole,
  normalizeStatus,
  normalizeHotelStatus,
  normalizeTourStatus,
  normalizeBookingWorkflowStatus,
  normalizeError
} from "../utils/adminDataUtils";

const DASHBOARD_CACHE_TTL_MS = 30000;
let dashboardCache = {
  fetchedAt: 0,
  data: null,
};

const safeRequest = async (request, fallbackMessage) => {
  try {
    return await request();
  } catch (error) {
    throw normalizeError(error, fallbackMessage);
  }
};
const toAdminOverview = (
  response,
  key,
  fallbackPage = 1,
  fallbackSize = 10,
) => {
  const list = extractList(response);
  const paging = extractPaging(
    response,
    fallbackPage,
    fallbackSize,
    list.length,
  );

  return {
    [key]: list,
    meta: {
      total: paging.total,
      page: paging.page,
      size: paging.size,
    },
    dataMode: "live",
    hasMockFallback: false,
  };
};

const adminApi = {
  getDashboardOverview: async ({ force = false } = {}) => {
    const now = Date.now();
    if (
      !force &&
      dashboardCache.data &&
      now - dashboardCache.fetchedAt < DASHBOARD_CACHE_TTL_MS
    ) {
      return dashboardCache.data;
    }

    let data;

    try {
      const statsResponse = await axiosClient.get("/admin/statistics/dashboard");
      const stats = statsResponse?.data || {};

      const revenueByMonth = Array.isArray(stats.revenueByMonth) ? stats.revenueByMonth : [];
      const revenueSeries = revenueByMonth.map((item) => {
        const monthMap = {
          "01": "T1", "02": "T2", "03": "T3", "04": "T4",
          "05": "T5", "06": "T6", "07": "T7", "08": "T8",
          "09": "T9", "10": "T10", "11": "T11", "12": "T12",
        };
        const monthKey = String(item.month || "");
        const parts = monthKey.split("-");
        const label = parts.length === 2
          ? `${monthMap[parts[1]] || parts[1]}/${parts[0].slice(2)}`
          : monthKey;

        return {
          key: item.month || label,
          label,
          value: Number(item.revenue || 0),
        };
      });

      const recentBookingsRaw = Array.isArray(stats.recentBookings) ? stats.recentBookings : [];
      const recentBookings = recentBookingsRaw.map((b) => ({
        bookingCode: b.booking_code || b.bookingCode || "",
        bookingType: b.booking_type || b.bookingType || "",
        guestName: b.user_name || b.guestName || b.userName || "",
        createdAt: b.created_at || b.createdAt || null,
        status: b.status || "",
        totalAmount: Number(b.total_amount || b.totalAmount || 0),
        currency: "VND",
      }));

      data = {
        stats: {
          totalRevenue: Number(stats.totalRevenue || 0),
          bookingsToday: 0,
          hotelCount: Number(stats.totalHotels || 0),
          tourCount: Number(stats.totalTours || 0),
          totalUsers: Number(stats.totalUsers || 0),
          totalBookings: Number(stats.totalBookings || 0),
          totalReviews: Number(stats.totalReviews || 0),
          pendingReviews: Number(stats.pendingReviews || 0),
          pendingHotels: Number(stats.pendingHotels || 0),
          pendingTours: Number(stats.pendingTours || 0),
          monthlyRevenue: Number(stats.monthlyRevenue || 0),
        },
        revenueSeries,
        recentBookings,
        topDestinations: Array.isArray(stats.topDestinations) ? stats.topDestinations : [],
        bookingsByMonth: Array.isArray(stats.bookingsByMonth) ? stats.bookingsByMonth : [],
        dataMode: "live",
        hasMockFallback: false,
      };
    } catch {
      data = {
        stats: {
          totalRevenue: 0,
          bookingsToday: 0,
          hotelCount: 0,
          tourCount: 0,
        },
        revenueSeries: [],
        recentBookings: [],
        dataMode: "live",
        hasMockFallback: false,
      };
    }

    dashboardCache = {
      fetchedAt: Date.now(),
      data,
    };

    return data;
  },

  getAdminUsers: async ({
    search = "",
    role = "ALL",
    status = "ALL",
    page = 1,
    limit = 10,
  } = {}) => {
    const response = await safeRequest(
      () =>
        axiosClient.get("/admin/users", {
          params: { search, role, status, page, limit },
        }),
      "Khong the tai danh sach users.",
    );

    const overview = toAdminOverview(response, "users", page, limit);
    return {
      ...overview,
      users: normalizeUsers(overview.users),
    };
  },

  updateUserRole: async (userId, role, reason) => {
    const payload = {
      role: normalizeRole(role),
      reason: String(reason || "").trim(),
    };

    return safeRequest(
      () => axiosClient.patch(`/admin/users/${userId}/role`, payload),
      "Cap nhat role user that bai.",
    );
  },

  updateUserStatus: async (userId, status, reason) => {
    const payload = {
      status: normalizeStatus(status),
      reason: String(reason || "").trim(),
    };

    return safeRequest(
      () => axiosClient.patch(`/admin/users/${userId}/status`, payload),
      "Cap nhat status user that bai.",
    );
  },

  getAdminHotels: async ({
    search = "",
    status = "ALL",
    city = "ALL",
    page = 1,
    limit = 8,
  } = {}) => {
    const response = await safeRequest(
      () =>
        axiosClient.get("/admin/hotels", {
          params: { search, status, city, page, limit },
        }),
      "Khong the tai danh sach hotels.",
    );

    const overview = toAdminOverview(response, "hotels", page, limit);
    return {
      ...overview,
      hotels: normalizeHotels(overview.hotels),
    };
  },

  updateHotelStatus: async (hotelId, status, reason) => {
    const payload = {
      status: normalizeHotelStatus(status),
      reason: String(reason || "").trim(),
    };

    return safeRequest(
      () => axiosClient.patch(`/admin/hotels/${hotelId}/status`, payload),
      "Cap nhat trang thai hotel that bai.",
    );
  },

  getAdminTours: async ({
    search = "",
    status = "ALL",
    city = "ALL",
    operator = "ALL",
    page = 1,
    limit = 8,
  } = {}) => {
    const response = await safeRequest(
      () =>
        axiosClient.get("/admin/tours", {
          params: { search, status, city, operator, page, limit },
        }),
      "Khong the tai danh sach tours.",
    );

    const overview = toAdminOverview(response, "tours", page, limit);
    return {
      ...overview,
      tours: normalizeTours(overview.tours),
    };
  },

  updateTourStatus: async (tourId, status, reason) => {
    const payload = {
      status: normalizeTourStatus(status),
      reason: String(reason || "").trim(),
    };

    return safeRequest(
      () => axiosClient.patch(`/admin/tours/${tourId}/status`, payload),
      "Cap nhat trang thai tour that bai.",
    );
  },

  getAdminBookings: async ({
    search = "",
    status = "ALL",
    type = "ALL",
    paymentStatus = "ALL",
    page = 1,
    limit = 10,
  } = {}) => {
    const response = await safeRequest(
      () =>
        axiosClient.get("/admin/bookings", {
          params: { search, status, type, paymentStatus, page, limit },
        }),
      "Khong the tai danh sach bookings.",
    );

    const overview = toAdminOverview(response, "bookings", page, limit);
    return {
      ...overview,
      bookings: normalizeAdminBookings(overview.bookings),
    };
  },

  updateBookingStatus: async (bookingId, status, reason) => {
    const payload = {
      status: normalizeBookingWorkflowStatus(status),
      reason: String(reason || "").trim(),
    };

    dashboardCache = {
      fetchedAt: 0,
      data: null,
    };

    return safeRequest(
      () => axiosClient.patch(`/admin/bookings/${bookingId}/status`, payload),
      "Cap nhat trang thai booking that bai.",
    );
  },

  getAdminPromotions: async ({
    search = "",
    status = "ALL",
    type = "ALL",
    page = 1,
    limit = 10,
  } = {}) => {
    const response = await safeRequest(
      () =>
        axiosClient.get("/admin/promotions", {
          params: { search, status, type, page, limit },
        }),
      "Khong the tai danh sach promotions.",
    );

    const overview = toAdminOverview(response, "promotions", page, limit);
    return {
      ...overview,
      promotions: normalizePromotions(overview.promotions),
    };
  },

  getAdminAuditLogs: async ({
    search = "",
    action = "ALL",
    resource = "ALL",
    page = 1,
    limit = 12,
  } = {}) => {
    const response = await safeRequest(
      () =>
        axiosClient.get("/admin/audit-logs", {
          params: { q: search, action, resource, page, limit },
        }),
      "Khong the tai audit logs.",
    );

    const overview = toAdminOverview(response, "auditLogs", page, limit);
    return {
      ...overview,
      auditLogs: normalizeAuditLogs(overview.auditLogs),
    };
  },

  createAdminPromotion: async (payload) => {
    return safeRequest(
      () => axiosClient.post("/admin/promotions", payload),
      "Tao promotion that bai.",
    );
  },

  updateAdminPromotion: async (promotionId, payload) => {
    return safeRequest(
      () => axiosClient.patch(`/admin/promotions/${promotionId}`, payload),
      "Cap nhat promotion that bai.",
    );
  },

  updateAdminPromotionStatus: async (promotionId, isActive, reason) => {
    return safeRequest(
      () =>
        axiosClient.patch(`/admin/promotions/${promotionId}/status`, {
          isActive: Boolean(isActive),
          reason: String(reason || "").trim(),
        }),
      "Cap nhat trang thai promotion that bai.",
    );
  },

  deleteAdminPromotion: async (promotionId, reason) => {
    return safeRequest(
      () =>
        axiosClient.delete(`/admin/promotions/${promotionId}`, {
          data: {
            reason: String(reason || "").trim(),
          },
        }),
      "Xoa promotion that bai.",
    );
  },

  // ===================== HOTEL CRUD =====================

  getHotelById: async (hotelId) => {
    const response = await safeRequest(
      () => axiosClient.get(`/admin/hotels/${hotelId}`),
      "Khong the tai chi tiet hotel.",
    );
    return response?.data?.result || response?.data;
  },

  createHotel: async (payload) => {
    return safeRequest(
      () => axiosClient.post("/admin/hotels", payload),
      "Tao hotel that bai.",
    );
  },

  updateHotel: async (hotelId, payload) => {
    return safeRequest(
      () => axiosClient.put(`/admin/hotels/${hotelId}`, payload),
      "Cap nhat hotel that bai.",
    );
  },

  // ===================== TOUR CRUD =====================

  getTourById: async (tourId) => {
    const response = await safeRequest(
      () => axiosClient.get(`/admin/tours/${tourId}`),
      "Khong the tai chi tiet tour.",
    );
    return response?.data?.result || response?.data;
  },

  createTour: async (payload) => {
    return safeRequest(
      () => axiosClient.post("/admin/tours", payload),
      "Tao tour that bai.",
    );
  },

  updateTour: async (tourId, payload) => {
    return safeRequest(
      () => axiosClient.put(`/admin/tours/${tourId}`, payload),
      "Cap nhat tour that bai.",
    );
  },

  // ===================== REVIEW MODERATION =====================

  /**
   * @param {{ page?: number, size?: number, status?: string, targetType?: string }} options
   */
  getReviews: async ({ page = 0, size = 20, status, targetType } = {}) => {
    const params = { page, size };
    if (status) params.status = status;
    if (targetType) params.targetType = targetType;
    return safeRequest(
      () => axiosClient.get('/admin/reviews', { params }),
      "Khong the tai danh sach reviews.",
    );
  },

  getReviewById: async (id) => {
    return safeRequest(
      () => axiosClient.get(`/admin/reviews/${id}`),
      "Khong the tai chi tiet review.",
    );
  },

  approveReview: async (id) => {
    return safeRequest(
      () => axiosClient.patch(`/admin/reviews/${id}/approve`),
      "Duyet review that bai.",
    );
  },

  rejectReview: async (id) => {
    return safeRequest(
      () => axiosClient.patch(`/admin/reviews/${id}/reject`),
      "Tu choi review that bai.",
    );
  },

  replyToReview: async (id, reply) => {
    return safeRequest(
      () => axiosClient.post(`/admin/reviews/${id}/reply`, { reply }),
      "Phan hoi review that bai.",
    );
  },

  deleteReview: async (id) => {
    return safeRequest(
      () => axiosClient.delete(`/admin/reviews/${id}`),
      "Xoa review that bai.",
    );
  },

  getReviewCounts: async () => {
    return safeRequest(
      () => axiosClient.get('/admin/reviews/counts'),
      "Khong the tai so lieu review.",
    );
  },

  // Hotel Import from CSV
  importHotelsParse: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return safeRequest(
      () => axiosClient.post('/admin/hotels/import/parse', formData),
      "Parse CSV that bai.",
    );
  },

  importHotelsPreview: async (request) => {
    return safeRequest(
      () => axiosClient.post('/admin/hotels/import/preview', request),
      "Preview import that bai.",
    );
  },

  importHotelsExecute: async (request) => {
    return safeRequest(
      () => axiosClient.post('/admin/hotels/import/execute', request),
      "Import hotels that bai.",
    );
  },

  // Map endpoints
  getHotelsForMap: async ({ city = 'ALL', status = 'ALL', limit = 500 } = {}) => {
    return safeRequest(
      () => axiosClient.get('/admin/hotels/map', { params: { city, status, limit } }),
      "Khong the tai du lieu ban do.",
    );
  },

  getCitiesWithHotels: async () => {
    return safeRequest(
      () => axiosClient.get('/admin/hotels/map/cities'),
      "Khong the tai danh sach thanh pho.",
    );
  },

  // ===================== COMBO CRUD =====================
  getAdminCombos: async ({
    search = '',
    status = 'ALL',
    type = 'ALL',
    page = 1,
    limit = 10,
  } = {}) => {
    const response = await safeRequest(
      () =>
        axiosClient.get('/admin/combos', {
          params: { q: search, status, type, page, size: limit },
        }),
      'Khong the tai danh sach combos.',
    );
    return response?.data?.result || response?.data || response;
  },

  getComboById: async (comboId) => {
    const response = await safeRequest(
      () => axiosClient.get(`/admin/combos/${comboId}`),
      'Khong the tai chi tiet combo.',
    );
    return response?.data?.result || response?.data || response;
  },

  createAdminCombo: async (payload) => {
    return safeRequest(
      () => axiosClient.post('/admin/combos', payload),
      'Tao combo that bai.',
    );
  },

  updateAdminCombo: async (comboId, payload) => {
    return safeRequest(
      () => axiosClient.put(`/admin/combos/${comboId}`, payload),
      'Cap nhat combo that bai.',
    );
  },

  updateAdminComboStatus: async (comboId, isActive, reason) => {
    return safeRequest(
      () =>
        axiosClient.patch(`/admin/combos/${comboId}/status`, {
          isActive: Boolean(isActive),
          reason: String(reason || '').trim(),
        }),
      'Cap nhat trang thai combo that bai.',
    );
  },

  deleteAdminCombo: async (comboId, reason) => {
    return safeRequest(
      () =>
        axiosClient.delete(`/admin/combos/${comboId}`, {
          data: {
            reason: String(reason || '').trim(),
          },
        }),
      'Xoa combo that bai.',
    );
  },
};

export default adminApi;

