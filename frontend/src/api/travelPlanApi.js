import axiosClient from './axiosClient';

const travelPlanApi = {
  generate: async (data) => {
    try {
      const response = await axiosClient.post('/travel-plan/generate', data);
      return response;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Tạo lịch trình thất bại. Vui lòng thử lại.';
      throw new Error(msg);
    }
  },
};

export default travelPlanApi;
