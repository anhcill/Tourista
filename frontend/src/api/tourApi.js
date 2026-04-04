import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "../utils/constants";

const tourApi = {
  getTours: (params) => {
    return axiosClient.get(API_ENDPOINTS.TOURS.LIST, { params });
  },

  getFeaturedTours: (params) => {
    return axiosClient.get(API_ENDPOINTS.TOURS.FEATURED, { params });
  },

  searchTours: (searchParams) => {
    return axiosClient.get(API_ENDPOINTS.TOURS.SEARCH, {
      params: searchParams,
    });
  },

  getTourDetail: (id) => {
    const url = API_ENDPOINTS.TOURS.DETAIL.replace(":id", id);
    return axiosClient.get(url);
  },

  getTourReviews: (id, params = {}) => {
    const url = (API_ENDPOINTS.TOURS.REVIEWS || `/api/tours/${id}/reviews`);
    return axiosClient.get(url.replace(":id", id), { params });
  },

  getSimilarTours: (id, params = {}) => {
    const url = (API_ENDPOINTS.TOURS.SIMILAR || `/api/tours/${id}/similar`);
    return axiosClient.get(url.replace(":id", id), { params });
  },
};

export default tourApi;
