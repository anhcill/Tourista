import axios from "axios";
import { API_BASE_URL, STORAGE_KEYS } from "../utils/constants";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "../utils/authStorage";

// Create axios instance
const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    // Read auth token from hardened storage helper.
    const token = getAccessToken();

    // Add token to headers if exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    // Return data directly
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    const clearSessionAndRedirectLogin = () => {
      clearAuthTokens();
      localStorage.removeItem(STORAGE_KEYS.USER);

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = getRefreshToken();

        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const payload = response?.data?.data || response?.data || {};
          const token = payload?.accessToken;
          const newRefreshToken = payload?.refreshToken;

          if (!token) {
            throw new Error("Refresh token không trả về access token mới.");
          }

          // Save new token
          setAccessToken(token);
          if (newRefreshToken) {
            setRefreshToken(newRefreshToken);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosClient(originalRequest);
        } else {
          // Không còn refresh token => phiên đã hết, buộc đăng nhập lại
          clearSessionAndRedirectLogin();
          return Promise.reject({
            message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
            status: 401,
          });
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        clearSessionAndRedirectLogin();

        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "An error occurred";

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  },
);

export default axiosClient;
