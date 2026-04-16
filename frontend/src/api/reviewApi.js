import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "../utils/constants";
import { uploadReviewMediaToCloudinary } from "../utils/cloudinaryUpload";

const reviewApi = {
  // Get all reviews
  getReviews: (params) => {
    return axiosClient.get(API_ENDPOINTS.REVIEWS.LIST, { params });
  },

  // Get reviews for specific hotel
  getHotelReviews: (hotelId, params) => {
    const url = API_ENDPOINTS.REVIEWS.BY_HOTEL.replace(":hotelId", hotelId);
    return axiosClient.get(url, { params });
  },

  // Create review
  createReview: (reviewData) => {
    return axiosClient.post(API_ENDPOINTS.REVIEWS.CREATE, reviewData);
  },

  // Upload media to Cloudinary first, then create review with mediaUrls
  createReviewWithMedia: async ({ reviewData, files }) => {
    const mediaUrls = await uploadReviewMediaToCloudinary(files || []);
    return axiosClient.post(API_ENDPOINTS.REVIEWS.CREATE, {
      ...(reviewData || {}),
      mediaUrls,
    });
  },

  // Update review
  updateReview: (id, updateData) => {
    const url = API_ENDPOINTS.REVIEWS.UPDATE.replace(":id", id);
    return axiosClient.put(url, updateData);
  },

  // Delete review
  deleteReview: (id) => {
    const url = API_ENDPOINTS.REVIEWS.DELETE.replace(":id", id);
    return axiosClient.delete(url);
  },
};

export default reviewApi;
