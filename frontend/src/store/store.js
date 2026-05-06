import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import hotelReducer from './slices/hotelSlice';
import bookingReducer from './slices/bookingSlice';
import searchReducer from './slices/searchSlice';
import uiReducer from './slices/uiSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        hotels: hotelReducer,
        bookings: bookingReducer,
        search: searchReducer,
        ui: uiReducer,
        chat: chatReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['ui/showToast'],
                ignoredActionPaths: ['payload.timestamp'],
                ignoredPaths: ['ui.toast'],
            },
        }),
});

/** @type {import('@reduxjs/toolkit').RootState} */
export const RootState = store.getState;
/** @type {import('@reduxjs/toolkit').AppDispatch} */
export const AppDispatch = store.dispatch;
