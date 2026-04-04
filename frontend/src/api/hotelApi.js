import axiosClient from './axiosClient';
import { API_ENDPOINTS } from '../utils/constants';

const hotelApi = {
    // Get all hotels with pagination and filters
    getHotels: (params) => {
        return axiosClient.get(API_ENDPOINTS.HOTELS.LIST, { params });
    },

    // Get hotel detail by ID
    getHotelDetail: (id) => {
        const url = API_ENDPOINTS.HOTELS.DETAIL.replace(':id', id);
        return axiosClient.get(url);
    },

    // Search hotels
    searchHotels: (searchParams) => {
        return axiosClient.get(API_ENDPOINTS.HOTELS.SEARCH, {
            params: searchParams,
        });
    },

    // Get featured hotels
    getFeaturedHotels: () => {
        return axiosClient.get(API_ENDPOINTS.HOTELS.FEATURED);
    },

    // Get trending hotels
    getTrendingHotels: () => {
        return axiosClient.get(API_ENDPOINTS.HOTELS.TRENDING);
    },
};

export default hotelApi;
