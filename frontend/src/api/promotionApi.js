import axiosClient from './axiosClient';

const promotionApi = {
  // Lấy danh sách khuyến mãi đang active
  getActivePromotions: () => axiosClient.get('/promotions'),

  // Validate mã khuyến mãi
  validatePromo: (data) => axiosClient.post('/promotions/validate', data),
};

export default promotionApi;
