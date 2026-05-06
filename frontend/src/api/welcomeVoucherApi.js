import axiosClient from './axiosClient';

const welcomeVoucherApi = {
  /** Lấy thông tin welcome voucher (public) */
  getVoucher: () => axiosClient.get('/welcome-voucher'),

  /** Claim voucher về tài khoản (cần login) */
  claimVoucher: () => axiosClient.post('/welcome-voucher/claim'),
};

export default welcomeVoucherApi;
