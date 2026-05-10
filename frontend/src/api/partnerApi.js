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

  getHotelById: async (hotelId) => {
    return safeRequest(
      () => axiosClient.get(`/partner/hotels/${hotelId}`),
      'Không thể tải chi tiết khách sạn.',
    );
  },

  createHotel: async (payload) => {
    return safeRequest(
      () => axiosClient.post('/partner/hotels', payload),
      'Tạo khách sạn thất bại.',
    );
  },

  updateHotel: async (hotelId, payload) => {
    return safeRequest(
      () => axiosClient.put(`/partner/hotels/${hotelId}`, payload),
      'Cập nhật khách sạn thất bại.',
    );
  },

  getPartnerTours: async () => {
    return safeRequest(
      () => axiosClient.get('/partner/tours'),
      'Không thể tải danh sách tour.',
    );
  },

  getTourById: async (tourId) => {
    return safeRequest(
      () => axiosClient.get(`/partner/tours/${tourId}`),
      'Không thể tải chi tiết tour.',
    );
  },

  createTour: async (payload) => {
    return safeRequest(
      () => axiosClient.post('/partner/tours', payload),
      'Tạo tour thất bại.',
    );
  },

  updateTour: async (tourId, payload) => {
    return safeRequest(
      () => axiosClient.put(`/partner/tours/${tourId}`, payload),
      'Cập nhật tour thất bại.',
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
