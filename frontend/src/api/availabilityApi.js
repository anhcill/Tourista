import axiosClient from './axiosClient';

const availabilityApi = {
  /**
   * @param {number} hotelId
   * @param {{ checkIn?: string, checkOut?: string, adults?: number, rooms?: number }} options
   */
  getRoomAvailability: async (hotelId, { checkIn, checkOut, adults = 2, rooms = 1 } = {}) => {
    const params = { adults, rooms };
    if (checkIn) params.checkIn = checkIn;
    if (checkOut) params.checkOut = checkOut;
    const response = await axiosClient.get(`/availability/hotels/${hotelId}`, { params });
    return response?.data;
  },
};

export default availabilityApi;
