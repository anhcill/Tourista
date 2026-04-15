import axiosClient from "./axiosClient";

const userApi = {
  getMyProfile: async () => {
    const response = await axiosClient.get("/users/me");
    return response?.data || response;
  },

  updateMyProfile: async (payload) => {
    const response = await axiosClient.patch("/users/me", payload);
    return response?.data || response;
  },
};

export default userApi;
