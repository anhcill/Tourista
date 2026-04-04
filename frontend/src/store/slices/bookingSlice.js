import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    bookings: [],
    currentBooking: null,
    loading: false,
    error: null,
};

const bookingSlice = createSlice({
    name: 'bookings',
    initialState,
    reducers: {
        // Fetch bookings
        fetchBookingsStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchBookingsSuccess: (state, action) => {
            state.loading = false;
            state.bookings = action.payload;
        },
        fetchBookingsFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },

        // Create booking
        createBookingStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        createBookingSuccess: (state, action) => {
            state.loading = false;
            state.currentBooking = action.payload;
            state.bookings.unshift(action.payload);
        },
        createBookingFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },

        // Set current booking
        setCurrentBooking: (state, action) => {
            state.currentBooking = action.payload;
        },

        // Clear current booking
        clearCurrentBooking: (state) => {
            state.currentBooking = null;
        },

        // Cancel booking
        cancelBookingSuccess: (state, action) => {
            const index = state.bookings.findIndex(b => b.id === action.payload);
            if (index !== -1) {
                state.bookings[index].status = 'cancelled';
            }
        },
    },
});

export const {
    fetchBookingsStart,
    fetchBookingsSuccess,
    fetchBookingsFailure,
    createBookingStart,
    createBookingSuccess,
    createBookingFailure,
    setCurrentBooking,
    clearCurrentBooking,
    cancelBookingSuccess,
} = bookingSlice.actions;

export default bookingSlice.reducer;
