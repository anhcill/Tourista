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
    Accept: "application/json",
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

    // Only set Content-Type for non-FormData requests.
    // FormData (file uploads) must NOT have a manual Content-Type — axios
    // auto-sets "multipart/form-data" with the correct boundary.
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
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
      sessionStorage.removeItem(STORAGE_KEYS.USER);

      // Only redirect to login if the user was actually logged in before.
      // If there was never a token, just reject — don't yank them to /login.
      if (typeof window !== "undefined") {
        const hadToken = getAccessToken() || getRefreshToken();
        if (hadToken) {
          window.location.href = "/login";
        }
      }
    };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
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
        } catch (refreshError) {
          // Refresh failed, logout user and redirect
          clearSessionAndRedirectLogin();
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token → user never logged in or session expired.
        // If they had an access token that just expired, redirect them to login.
        // If they were never logged in, just reject silently.
        clearSessionAndRedirectLogin();
        return Promise.reject({
          message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          status: 401,
        });
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
