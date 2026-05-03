import axiosClient from './axiosClient';

const safeRequest = async (fn, fallbackMessage) => {
  try {
    const response = await fn();
    return response?.data;
  } catch (err) {
    if (err?.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error(fallbackMessage);
  }
};

const partnerApi = {
  getPartnerHotels: async () => {
    return safeRequest(
      () => axiosClient.get('/partner/hotels'),
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
