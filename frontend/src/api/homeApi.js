import axiosClient from './axiosClient';
import { API_ENDPOINTS } from '../utils/constants';

const homeApi = {
    getCompareCategories: () => {
        return axiosClient.get(API_ENDPOINTS.HOME.COMPARE_CATEGORIES);
    },
    getTestimonials: (limit = 6) => {
        return axiosClient.get(API_ENDPOINTS.HOME.TESTIMONIALS, { params: { limit } });
    },
};

export default homeApi;
