import axiosClient from './axiosClient';
import { API_ENDPOINTS } from '../utils/constants';

const pricingApi = {
    // Calculate tour price with dynamic pricing rules
    calculateTourPrice: (tourId, params) => {
        return axiosClient.get(API_ENDPOINTS.PRICING.CALC_TOUR.replace('/tour', `/${tourId}`), { params });
    },

    // Calculate hotel price (total stay)
    calculateHotelPrice: (hotelId, params) => {
        return axiosClient.get(API_ENDPOINTS.PRICING.CALC_HOTEL.replace('/hotel', `/${hotelId}`), { params });
    },

    // Calculate hotel price per night for a specific check-in date
    calculateHotelNightPrice: (hotelId, checkIn, adults) => {
        return axiosClient.get(`${API_ENDPOINTS.PRICING.CALC_HOTEL_NIGHT.replace('/hotel', `/${hotelId}`)}/per-night`, {
            params: { checkIn, adults },
        });
    },
};

export default pricingApi;
