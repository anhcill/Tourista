import axiosClient from './axiosClient';

const safeRequest = async (fn, fallbackMessage) => {
  try {
    // axiosClient interceptor already returns response.data (the HTTP body)
    // so we return it directly — no extra .data unwrap needed
    const response = await fn();
    return response;
  } catch (err) {
    // axiosClient rejects with { message, status, data }
    const msg = err?.data?.message || err?.message;
    if (msg) throw new Error(msg);
    throw new Error(fallbackMessage);
  }
};

const partnerApi = {
  getPartnerHotels: async ({ page = 0, size = 10 } = {}) => {
    return safeRequest(
      () => axiosClient.get('/partner/hotels', { params: { page, size } }),
      'Không thể tải danh sách khách sạn.',
    );
  },

  getPartnerTours: async () => {
    return safeRequest(
      () => axiosClient.get('/partner/tours'),
      'Không thể tải danh sách tour.',
    );
  },

  getPartnerHotelBookings: async ({ page = 0, size = 20, status } = {}) => {
    const params = { page, size };
    if (status) params.status = status;
    return safeRequest(
      () => axiosClient.get('/partner/bookings/hotels', { params }),
      'Không thể tải bookings khách sạn.',
    );
  },

  getPartnerTourBookings: async ({ page = 0, size = 20, status } = {}) => {
    const params = { page, size };
    if (status) params.status = status;
    return safeRequest(
      () => axiosClient.get('/partner/bookings/tours', { params }),
      'Không thể tải bookings tour.',
    );
  },

  getPartnerReviews: async ({ page = 0, size = 10 } = {}) => {
    return safeRequest(
      () => axiosClient.get('/partner/reviews', { params: { page, size } }),
      'Không thể tải danh sách review.',
    );
  },

  replyToReview: async (reviewId, reply) => {
    return safeRequest(
      () => axiosClient.post(`/partner/reviews/${reviewId}/reply`, { reply }),
      'Không thể gửi phản hồi.',
    );
  },

  getRevenueStats: async (period = '30d') => {
    return safeRequest(
      () => axiosClient.get('/partner/revenue-stats', { params: { period } }),
      'Không thể tải thống kê doanh thu.',
    );
  },
};

export default partnerApi;
