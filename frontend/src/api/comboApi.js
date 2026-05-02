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

const comboApi = {
  // Public browsing
  getCombos: async () => {
    return safeRequest(
      () => axiosClient.get('/combos'),
      'Khong the tai danh sach combo.',
    );
  },

  getFeaturedCombos: async () => {
    return safeRequest(
      () => axiosClient.get('/combos/featured'),
      'Khong the tai combo noi bat.',
    );
  },

  getCombosByType: async (type) => {
    return safeRequest(
      () => axiosClient.get(`/combos/type/${type}`),
      'Khong the tai combo theo loai.',
    );
  },

  getComboById: async (id) => {
    return safeRequest(
      () => axiosClient.get(`/combos/${id}`),
      'Khong the tai chi tiet combo.',
    );
  },

  // Booking (requires auth)
  bookCombo: async (payload) => {
    return safeRequest(
      () => axiosClient.post('/combos/book', payload),
      'Dat combo that bai.',
    );
  },
};

export default comboApi;
