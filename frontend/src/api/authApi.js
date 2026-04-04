import axiosClient from './axiosClient';
import { API_ENDPOINTS } from '../utils/constants';

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
    verifyEmail: (token) => {
        return axiosClient.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
    },
};

export default authApi;
