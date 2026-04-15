import axiosClient from "./axiosClient";
import { API_ENDPOINTS } from "../utils/constants";

const authApi = {
  // Login
  login: (credentials) => {
    return axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },

  // Register
  register: (userData) => {
    return axiosClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
  },

  // Logout — gửi refreshToken để backend invalidate
  logout: (refreshToken) => {
    return axiosClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
  },

  // Refresh token
  refreshToken: (refreshToken) => {
    return axiosClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
  },

  // Exchange one-time OAuth2 code for tokens
  exchangeOAuth2Code: (code) => {
    return axiosClient.post(API_ENDPOINTS.AUTH.OAUTH2_EXCHANGE, { code });
  },

  // Forgot password
  forgotPassword: (email) => {
    return axiosClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  // Reset password
  resetPassword: (token, newPassword) => {
    return axiosClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      newPassword,
    });
  },

  // Verify email
  verifyEmail: async (token) => {
    try {
      // Backend currently expects GET /auth/verify-email?token=...
      return await axiosClient.get(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
        params: { token },
      });
    } catch (error) {
      // Fallback to POST for backward compatibility with older contracts
      if (error?.status === 404 || error?.status === 405) {
        return axiosClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
      }
      throw error;
    }
  },
};

export default authApi;
