import axios from './axiosClient';

const chatApi = {
    /** Lấy danh sách hội thoại của user hiện tại */
    getConversations: () =>
        axios.get('/chat/conversations'),

    /** Tạo hoặc lấy lại conversation (find-or-create) */
    createConversation: (data) =>
        axios.post('/chat/conversations', data),

    /** Lấy lịch sử tin nhắn của 1 phiên (phân trang) */
    getMessages: (conversationId, page = 0, size = 30) =>
        axios.get(`/chat/conversations/${conversationId}/messages`, {
            params: { page, size },
        }),

    /** Đánh dấu tất cả tin nhắn trong conversation là đã đọc */
    markAsRead: (conversationId) =>
        axios.patch(`/chat/conversations/${conversationId}/read`),
};

export default chatApi;
