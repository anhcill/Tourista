import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "../utils/constants";

const homeApi = {
  getTestimonials: (params) => {
    return axiosClient.get(API_ENDPOINTS.HOME.TESTIMONIALS, { params });
  },
};

export default homeApi;
