import axiosClient from './axiosClient';

const adminChatApi = {
    /** Lay tat ca hoi thoai (admin) */
    getConversations: () =>
        axiosClient.get('/chat/conversations/admin'),

    /** Lay tin nhan cua 1 hoi thoai (admin) */
    getMessages: (conversationId, page = 0, size = 50) =>
        axiosClient.get(`/chat/conversations/${conversationId}/messages/admin`, {
            params: { page, size },
        }),

    /** Danh dau da doc */
    markAsRead: (conversationId) =>
        axiosClient.patch(`/chat/conversations/${conversationId}/read/admin`),

    /** Gui tin nhan tra loi */
    sendMessage: (conversationId, content) =>
        axiosClient.post(`/chat/conversations/${conversationId}/send`, { content }),
};

export default adminChatApi;
