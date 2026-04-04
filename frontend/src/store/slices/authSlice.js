import { createSlice } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '../../utils/constants';

// Get initial user from localStorage
const getUserFromStorage = () => {
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem(STORAGE_KEYS.USER);
        return user ? JSON.parse(user) : null;
    }
    return null;
};

const getTokenFromStorage = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    }
    return null;
};

const initialState = {
    user: getUserFromStorage(),
    token: getTokenFromStorage(),
    isAuthenticated: !!getTokenFromStorage(),
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        loginSuccess: (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.error = null;

            // Save to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(action.payload.user));
                localStorage.setItem(STORAGE_KEYS.TOKEN, action.payload.token);
                if (action.payload.refreshToken) {
                    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, action.payload.refreshToken);
                }
            }
        },
        loginFailure: (state, action) => {
            state.loading = false;
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            state.error = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;

            // Clear localStorage
            if (typeof window !== 'undefined') {
                localStorage.removeItem(STORAGE_KEYS.USER);
                localStorage.removeItem(STORAGE_KEYS.TOKEN);
                localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            }
        },
        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload };

            // Update localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(state.user));
            }
        },
        clearError: (state) => {
            state.error = null;
        },
    },
});

export const {
    loginStart,
    loginSuccess,
    loginFailure,
    logout,
    updateUser,
    clearError,
} = authSlice.actions;

export default authSlice.reducer;
