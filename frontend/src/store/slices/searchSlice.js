import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    location: '',
    checkIn: null,
    checkOut: null,
    guests: {
        adults: 2,
        children: 0,
        rooms: 1,
    },
    searchHistory: [],
};

const searchSlice = createSlice({
    name: 'search',
    initialState,
    reducers: {
        setLocation: (state, action) => {
            state.location = action.payload;
        },

        setCheckIn: (state, action) => {
            state.checkIn = action.payload;
        },

        setCheckOut: (state, action) => {
            state.checkOut = action.payload;
        },

        setGuests: (state, action) => {
            state.guests = { ...state.guests, ...action.payload };
        },

        setSearchParams: (state, action) => {
            state.location = action.payload.location || state.location;
            state.checkIn = action.payload.checkIn || state.checkIn;
            state.checkOut = action.payload.checkOut || state.checkOut;
            state.guests = action.payload.guests || state.guests;
        },

        addToSearchHistory: (state, action) => {
            // Add to beginning of array
            state.searchHistory.unshift(action.payload);

            // Keep only last 10 searches
            if (state.searchHistory.length > 10) {
                state.searchHistory = state.searchHistory.slice(0, 10);
            }
        },

        clearSearchHistory: (state) => {
            state.searchHistory = [];
        },

        resetSearch: (state) => {
            state.location = '';
            state.checkIn = null;
            state.checkOut = null;
            state.guests = initialState.guests;
        },
    },
});

export const {
    setLocation,
    setCheckIn,
    setCheckOut,
    setGuests,
    setSearchParams,
    addToSearchHistory,
    clearSearchHistory,
    resetSearch,
} = searchSlice.actions;

export default searchSlice.reducer;
