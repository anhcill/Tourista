import axiosClient from "./axiosClient";

const favoriteApi = {
  getMyFavorites: async () => {
    const response = await axiosClient.get("/favorites");
    return response?.data || response || [];
  },

  addFavorite: async (targetType, targetId) => {
    const response = await axiosClient.post("/favorites", {
      targetType,
      targetId,
    });
    return response?.data || response;
  },

  removeFavorite: async (targetType, targetId) => {
    await axiosClient.delete("/favorites", {
      params: { targetType, targetId },
    });
  },
};

export default favoriteApi;
