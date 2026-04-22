import axiosClient from './axiosClient';
import { API_ENDPOINTS } from '../utils/constants';

const promotionApi = {
    getActivePromotions: () => {
        return axiosClient.get(API_ENDPOINTS.PROMOTIONS.LIST);
    },
};

export default promotionApi;
