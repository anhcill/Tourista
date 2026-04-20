import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "../utils/constants";

const bookingApi = {
  // Create new booking
  createBooking: (bookingData) => {
    return axiosClient.post(API_ENDPOINTS.BOOKINGS.CREATE, bookingData);
  },

  // Create new tour booking
  createTourBooking: (bookingData) => {
    return axiosClient.post(API_ENDPOINTS.BOOKINGS.CREATE_TOUR, bookingData);
  },

  // Create VNPAY payment URL
  createVnpayPayment: (paymentData) => {
    return axiosClient.post("/payments/vnpay/create", paymentData);
  },

  // Verify VNPAY return callback
  verifyVnpayReturn: (params) => {
    return axiosClient.get("/payments/vnpay/return", { params });
  },

  // Get all bookings for current user
  getBookings: (params) => {
    return axiosClient.get(API_ENDPOINTS.BOOKINGS.MY, { params });
  },

  // Get booking detail by ID
  getBookingDetail: (id) => {
    const url = API_ENDPOINTS.BOOKINGS.DETAIL.replace(":id", id);
    return axiosClient.get(url);
  },

  // Update booking
  updateBooking: (id, updateData) => {
    const url = API_ENDPOINTS.BOOKINGS.UPDATE.replace(":id", id);
    return axiosClient.put(url, updateData);
  },

  // Cancel booking (user-initiated)
  cancelBooking: (id, reason = '') => {
    const url = API_ENDPOINTS.BOOKINGS.CANCEL.replace(':id', id);
    return axiosClient.post(url, reason ? { reason } : {});
  },
};

export default bookingApi;
