import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    hotels: [],
    featuredHotels: [],
    trendingHotels: [],
    currentHotel: null,
    loading: false,
    error: null,
    pagination: {
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
    },
    filters: {
        priceMin: null,
        priceMax: null,
        rating: null,
        amenities: [],
        sortBy: 'popularity_desc',
    },
};

const hotelSlice = createSlice({
    name: 'hotels',
    initialState,
    reducers: {
        // Fetch hotels
        fetchHotelsStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchHotelsSuccess: (state, action) => {
            state.loading = false;
            state.hotels = action.payload.data;
            state.pagination = action.payload.pagination;
        },
        fetchHotelsFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },

        // Fetch hotel detail
        fetchHotelDetailStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchHotelDetailSuccess: (state, action) => {
            state.loading = false;
            state.currentHotel = action.payload;
        },
        fetchHotelDetailFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },

        // Featured hotels
        setFeaturedHotels: (state, action) => {
            state.featuredHotels = action.payload;
        },

        // Trending hotels
        setTrendingHotels: (state, action) => {
            state.trendingHotels = action.payload;
        },

        // Update filters
        updateFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },

        // Reset filters
        resetFilters: (state) => {
            state.filters = initialState.filters;
        },

        // Clear current hotel
        clearCurrentHotel: (state) => {
            state.currentHotel = null;
        },
    },
});

export const {
    fetchHotelsStart,
    fetchHotelsSuccess,
    fetchHotelsFailure,
    fetchHotelDetailStart,
    fetchHotelDetailSuccess,
    fetchHotelDetailFailure,
    setFeaturedHotels,
    setTrendingHotels,
    updateFilters,
    resetFilters,
    clearCurrentHotel,
} = hotelSlice.actions;

export default hotelSlice.reducer;
