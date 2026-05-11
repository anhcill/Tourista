import axiosClient from './axiosClient';

const pricingApi = {
    // Calculate tour price with dynamic pricing rules
    calculateTourPrice: (tourId, params) => {
        return axiosClient.get(`/pricing/calculate/tour/${tourId}`, { params });
    },

    // Calculate hotel price (total stay)
    calculateHotelPrice: (hotelId, params) => {
        return axiosClient.get(`/pricing/calculate/hotel/${hotelId}`, { params });
    },

    // Calculate hotel price per night for a specific check-in date
    calculateHotelNightPrice: (hotelId, checkIn, adults, roomTypeId) => {
        const params = { checkIn, adults };
        if (roomTypeId) params.roomTypeId = roomTypeId;
        return axiosClient.get(`/pricing/calculate/hotel/${hotelId}/per-night`, {
            params,
        });
    },
};

export default pricingApi;
