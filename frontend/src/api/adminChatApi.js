import axiosClient from './axiosClient';

const adminChatApi = {
    /** Lay tat ca hoi thoai (admin) */
    getConversations: () =>
        axiosClient.get('/admin/chat/conversations'),

    /** Lay tin nhan cua 1 hoi thoai (admin) */
    getMessages: (conversationId, page = 0, size = 50) =>
        axiosClient.get(`/admin/chat/conversations/${conversationId}/messages`, {
            params: { page, size },
        }),

    /** Danh dau da doc */
    markAsRead: (conversationId) =>
        axiosClient.patch(`/admin/chat/conversations/${conversationId}/read`),

    /** Gui tin nhan tra loi */
    sendMessage: (conversationId, content) =>
        axiosClient.post(`/admin/chat/conversations/${conversationId}/send`, { content }),
};

export default adminChatApi;
