import axiosClient from './axiosClient';
import { API_ENDPOINTS } from '../utils/constants';

const articleApi = {
  getArticles: (params) => {
    return axiosClient.get('/articles', { params });
  },

  getFeaturedArticles: (limit = 6) => {
    return axiosClient.get('/articles/featured', { params: { limit } });
  },

  getArticleBySlug: (slug) => {
    return axiosClient.get(`/articles/${slug}`);
  },

  createArticle: (data) => {
    return axiosClient.post('/articles', data);
  },

  updateArticle: (id, data) => {
    return axiosClient.put(`/articles/${id}`, data);
  },

  deleteArticle: (id) => {
    return axiosClient.delete(`/articles/${id}`);
  },

  toggleLike: (id) => {
    return axiosClient.post(`/articles/${id}/like`);
  },

  getComments: (articleId, params) => {
    return axiosClient.get(`/articles/${articleId}/comments`, { params });
  },

  createComment: (articleId, data) => {
    return axiosClient.post(`/articles/${articleId}/comments`, data);
  },

  deleteComment: (commentId) => {
    return axiosClient.delete(`/articles/comments/${commentId}`);
  },
};

export default articleApi;
