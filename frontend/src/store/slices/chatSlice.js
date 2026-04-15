import { createSlice } from '@reduxjs/toolkit';

/** chatSlice — quản lý state Chat toàn cục
 *
 * messages: { [conversationId]: Message[] }
 *   Mỗi message: { id, conversationId, senderId, senderName, senderAvatar,
 *                  contentType, content, metadata, isRead, createdAt }
 *
 * contentType: 'TEXT' | 'IMAGE' | 'BOOKING_DETAILS' | 'SYSTEM_LOG'
 * metadata: chuỗi JSON (parse ra để render BookingItineraryCard khi contentType = BOOKING_DETAILS)
 */

const initialState = {
    // Danh sách hội thoại đã load
    conversations: [],
    // Map conversationId → Message[]
    messages: {},
    // ID phiên chat đang active (Bot widget)
    activeBotConversationId: null,
    // ID phiên P2P đang mở (Partner modal)
    activeP2PConversationId: null,
    // Tổng số tin chưa đọc (để hiển thị badge Navbar)
    totalUnread: 0,
    // Trạng thái WebSocket
    isWsConnected: false,
    // Bot Widget đang mở hay đóng
    isBotOpen: false,
    loading: false,
    error: null,
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        // ── Bot Widget ───────────────────────────────────────────────────
        openBot: (state) => { state.isBotOpen = true; },
        closeBot: (state) => { state.isBotOpen = false; },
        toggleBot: (state) => { state.isBotOpen = !state.isBotOpen; },

        setActiveBotConversation: (state, action) => {
            state.activeBotConversationId = action.payload;
        },

        // ── P2P Chat ─────────────────────────────────────────────────────
        setActiveP2PConversation: (state, action) => {
            state.activeP2PConversationId = action.payload;
        },
        closeP2P: (state) => {
            state.activeP2PConversationId = null;
        },

        // ── Conversations ────────────────────────────────────────────────
        setConversations: (state, action) => {
            state.conversations = action.payload;
            // Tính tổng unread từ danh sách
            state.totalUnread = action.payload.reduce(
                (sum, c) => sum + (c.unreadCount || 0), 0
            );
        },

        // ── Messages ─────────────────────────────────────────────────────
        setMessages: (state, action) => {
            const { conversationId, messages } = action.payload;
            state.messages[conversationId] = messages;
        },

        // Thêm message mới (đến từ WebSocket push)
        addMessage: (state, action) => {
            const msg = action.payload;
            const cid = msg.conversationId;
            if (!state.messages[cid]) {
                state.messages[cid] = [];
            }
            // Tránh duplicate nếu chính user gửi và server push lại
            const exists = state.messages[cid].some(m => m.id === msg.id);
            if (!exists) {
                state.messages[cid].push(msg);
            }
            // Nếu đây là tin từ người khác và conversation không đang mở → tăng unread
            const isActive = cid === state.activeBotConversationId
                          || cid === state.activeP2PConversationId;
            if (!isActive && msg.senderId != null) {
                state.totalUnread += 1;
                // Cập nhật unreadCount trong conversations list
                const conv = state.conversations.find(c => c.id === cid);
                if (conv) conv.unreadCount = (conv.unreadCount || 0) + 1;
            }
            // Cập nhật snippet trong danh sách
            const convItem = state.conversations.find(c => c.id === cid);
            if (convItem) {
                convItem.lastMessageSnippet = msg.content;
                convItem.lastMessageType = msg.contentType;
                convItem.lastMessageAt = msg.createdAt;
            }
        },

        // Đánh dấu messages đã đọc trong 1 conversation
        markConversationRead: (state, action) => {
            const cid = action.payload;
            const unreadBefore = state.conversations.find(c => c.id === cid)?.unreadCount || 0;
            state.totalUnread = Math.max(0, state.totalUnread - unreadBefore);
            const conv = state.conversations.find(c => c.id === cid);
            if (conv) conv.unreadCount = 0;
        },

        // ── WebSocket ────────────────────────────────────────────────────
        setWsConnected: (state, action) => {
            state.isWsConnected = action.payload;
        },

        setLoading: (state, action) => { state.loading = action.payload; },
        setError: (state, action) => { state.error = action.payload; },
    },
});

export const {
    openBot, closeBot, toggleBot,
    setActiveBotConversation,
    setActiveP2PConversation, closeP2P,
    setConversations, setMessages, addMessage, markConversationRead,
    setWsConnected,
    setLoading, setError,
} = chatSlice.actions;

export default chatSlice.reducer;
