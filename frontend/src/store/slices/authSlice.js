import { createSlice } from "@reduxjs/toolkit";
import { STORAGE_KEYS } from "../../utils/constants";
import {
  clearAuthTokens,
  getAccessToken,
  setAccessToken,
  setRefreshToken,
} from "../../utils/authStorage";

const hasWindow = () => typeof window !== "undefined";

const readUserWithMigration = () => {
  if (!hasWindow()) return null;
  try {
    // Try sessionStorage first (new location)
    const sessionUser = window.sessionStorage.getItem(STORAGE_KEYS.USER);
    if (sessionUser) return JSON.parse(sessionUser);

    // Fallback: localStorage (legacy location) — migrate to sessionStorage
    const legacyUser = window.localStorage.getItem(STORAGE_KEYS.USER);
    if (legacyUser) {
      const parsed = JSON.parse(legacyUser);
      window.sessionStorage.setItem(STORAGE_KEYS.USER, legacyUser);
      window.localStorage.removeItem(STORAGE_KEYS.USER);
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

const writeUser = (user) => {
  if (!hasWindow()) return;
  try {
    if (user) {
      window.sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      window.localStorage.removeItem(STORAGE_KEYS.USER);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEYS.USER);
      window.localStorage.removeItem(STORAGE_KEYS.USER);
    }
  } catch {
    // Ignore storage errors
  }
};

const clearUser = () => {
  if (!hasWindow()) return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEYS.USER);
    window.localStorage.removeItem(STORAGE_KEYS.USER);
  } catch {
    // Ignore storage errors
  }
};

const getTokenFromStorage = () => {
  if (hasWindow()) {
    return getAccessToken();
  }
  return null;
};

const initialState = {
  user: readUserWithMigration(),
  token: getTokenFromStorage(),
  isAuthenticated: !!getTokenFromStorage(),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
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

      // Save user to sessionStorage (secure, not persisted across tabs)
      writeUser(action.payload.user);
      setAccessToken(action.payload.token);
      if (action.payload.refreshToken) {
        setRefreshToken(action.payload.refreshToken);
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

      // Clear all storage
      clearUser();
      clearAuthTokens();
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      writeUser(state.user);
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
