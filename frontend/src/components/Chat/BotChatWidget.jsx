'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    openBot, closeBot,
    setActiveBotConversation, setMessages, markConversationRead,
} from '../../store/slices/chatSlice';
import { useChatWebSocket } from '../../hooks/useChatWebSocket';
import BookingItineraryCard from './BookingItineraryCard/BookingItineraryCard';
import ScenarioChoiceCard from './ScenarioChoiceCard/ScenarioChoiceCard';
import TourResultCard from './TourResultCard/TourResultCard';
import chatApi from '../../api/chatApi';
import { STORAGE_KEYS } from '../../utils/constants';
import styles from './BotChatWidget.module.css';

const unwrapPayload = (response) => response?.data ?? response ?? null;
const unwrapPageContent = (response) => response?.data?.content ?? response?.content ?? [];
const extractErrorMessage = (error) => {
    if (!error) return 'Không thể kết nối chatbot lúc này.';
    if (typeof error === 'string') return error;
    return error?.message || error?.data?.message || 'Không thể kết nối chatbot lúc này.';
};

/* ───────────────────────── Message Bubble ───────────────────────── */
const MessageBubble = ({ msg, isOwn, onSend }) => {
    const isBookingCard = msg.contentType === 'BOOKING_DETAILS';
    const isScenarioChoice = msg.contentType === 'SCENARIO_CHOICE';
    const isTourCards = msg.contentType === 'TOUR_CARDS';
    const isSystem = msg.contentType === 'SYSTEM_LOG';

    if (isSystem) {
        return (
            <div className={styles.systemMsg}>
                <span>{msg.content}</span>
            </div>
        );
    }

    return (
        <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleBot}`}>
            {!isOwn && (
                <div className={styles.botAvatar}>🧭</div>
            )}
            <div className={`${styles.bubbleContent} ${isOwn ? styles.bubbleContentOwn : styles.bubbleContentBot}`}>
                {isBookingCard ? (
                    <BookingItineraryCard metadata={msg.metadata} />
                ) : isScenarioChoice ? (
                    <ScenarioChoiceCard metadata={msg.metadata} onChoice={onSend} />
                ) : isTourCards ? (
                    <TourResultCard metadata={msg.metadata} />
                ) : (
                    <div className={styles.bubbleText}>
                        {/* Render markdown-light: **bold**, newlines */}
                        {msg.content?.split('\n').map((line, i) => (
                            <p key={i} dangerouslySetInnerHTML={{
                                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            }} />
                        ))}
                    </div>
                )}
                <span className={styles.bubbleTime}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
            </div>
        </div>
    );
};

/* ───────────────────────── TypingIndicator ───────────────────────── */
const TypingIndicator = () => (
    <div className={`${styles.bubble} ${styles.bubbleBot}`}>
        <div className={styles.botAvatar}>🧭</div>
        <div className={`${styles.bubbleContent} ${styles.bubbleContentBot} ${styles.typingBubble}`}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
        </div>
    </div>
);

/* ───────────────────────── BotChatBox ───────────────────────── */
const BotChatBox = ({ sendMessage }) => {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector(state => state.auth);
    const { activeBotConversationId, messages, isBotOpen } = useSelector(state => state.chat);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [initError, setInitError] = useState('');
    const endRef = useRef(null);
    const inputRef = useRef(null);

    const convMessages = useMemo(() => {
        if (!activeBotConversationId) return [];
        return messages[activeBotConversationId] || [];
    }, [activeBotConversationId, messages]);

    // Scroll to bottom khi có tin mới
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [convMessages, isTyping]);

    const initBotConversation = useCallback(async () => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
            if (!token) {
                setInitError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để chat với bot.');
                return null;
            }
        }

        setIsLoading(true);
        setInitError('');

        try {
            const res = await chatApi.createConversation({ type: 'BOT' });
            const conv = unwrapPayload(res);

            if (!conv?.id) {
                throw new Error('Không lấy được hội thoại BOT.');
            }

            dispatch(setActiveBotConversation(conv.id));

            const histRes = await chatApi.getMessages(conv.id);
            const hist = unwrapPageContent(histRes);
            dispatch(setMessages({ conversationId: conv.id, messages: hist }));

            // Đánh dấu đã đọc là best-effort, không block luồng chat
            try {
                dispatch(markConversationRead(conv.id));
                await chatApi.markAsRead(conv.id);
            } catch (readError) {
                console.warn('[Bot] markAsRead warning:', readError);
            }

            return conv.id;
        } catch (error) {
            if (error?.status === 401) {
                setInitError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.');
                return null;
            }

            const message = extractErrorMessage(error);
            setInitError(message);
            console.error('[Bot] Init error:', {
                message,
                status: error?.status,
                raw: error,
            });
            return null;
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [dispatch]);

    // Khi mở bot: init conversation + load lịch sử
    useEffect(() => {
        if (!isBotOpen || !isAuthenticated) return;

        if (typeof window !== 'undefined') {
            const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
            if (!token) {
                setInitError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để chat với bot.');
                return;
            }
        }

        initBotConversation();
    }, [isBotOpen, isAuthenticated, initBotConversation]);

    // Khi nhận tin nhắn BOT trả về → ẩn typing indicator
    useEffect(() => {
        const lastMsg = convMessages[convMessages.length - 1];
        if (!lastMsg) {
            return;
        }

        const isOwnMessage =
            lastMsg?.senderId != null && user?.id != null
                ? Number(lastMsg.senderId) === Number(user.id)
                : false;

        if (!isOwnMessage) {
            setIsTyping(false);
        }
    }, [convMessages, user]);

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        let conversationId = activeBotConversationId;
        if (!conversationId) {
            conversationId = await initBotConversation();
        }

        if (!conversationId) {
            setInitError('Không thể khởi tạo hội thoại chatbot. Vui lòng thử lại.');
            return;
        }

        const sent = sendMessage(conversationId, text);
        if (!sent) {
            setInitError('Mất kết nối chat thời gian thực. Vui lòng đợi vài giây rồi gửi lại.');
            return;
        }

        setInput('');
        setInitError('');
        setIsTyping(true);

        // Fallback: nếu WS miss frame, pull lại lịch sử sau 4.5s để tránh treo 3 chấm
        setTimeout(async () => {
            try {
                const histRes = await chatApi.getMessages(conversationId);
                const hist = unwrapPageContent(histRes);
                dispatch(setMessages({ conversationId, messages: hist }));
            } catch (refreshError) {
                console.warn('[Bot] history refresh warning:', refreshError);
            } finally {
                setIsTyping(false);
            }
        }, 4500);
    }, [input, isLoading, activeBotConversationId, initBotConversation, sendMessage, dispatch]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const QUICK_PROMPTS = [
        { label: '🔥 Tour hot', text: 'Cho mình xem các tour hot nhất hiện nay' },
        { label: '💸 Giá rẻ', text: 'Gợi ý tour giá rẻ ngân sách sinh viên' },
        { label: '🎯 Combo', text: 'Tourista có bán combo vé máy bay và khách sạn không?' },
        { label: '🔍 Tra cứu', text: 'Tôi muốn tra cứu mã đặt chỗ TRS-' },
        { label: '📞 Liên hệ', text: 'Cho tôi thông tin liên hệ hỗ trợ' },
    ];

    return (
        <div className={styles.chatBox}>
            {/* Header */}
            <div className={styles.chatHeader}>
                <div className={styles.chatHeaderLeft}>
                    <div className={styles.botIcon}>🌴</div>
                    <div>
                        <div className={styles.chatHeaderName}>Tourista Travel Buddy</div>
                        <div className={styles.chatHeaderStatus}>
                            <span className={styles.onlineDot} /> Sẵn sàng tư vấn hành trình
                        </div>
                    </div>
                </div>
                <button className={styles.closeBtn} onClick={() => dispatch(closeBot())} aria-label="Đóng">
                    ✕
                </button>
            </div>

            {/* Messages */}
            <div className={styles.messagesArea}>
                {isLoading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner} />
                        <span>Đang mở kênh trợ lý du lịch...</span>
                    </div>
                ) : (
                    <>
                        {!initError && convMessages.length === 0 ? (
                            <div className={styles.welcomeCard}>
                                <div className={styles.welcomeTitle}>Lên kế hoạch chuyến đi chỉ trong vài tin nhắn</div>
                                <div className={styles.welcomeMeta}>Bạn có thể tra cứu booking, hỏi thanh toán hoặc nhắn ngân sách + số người + điểm đến + số ngày để mình gợi ý tour sát nhu cầu.</div>
                            </div>
                        ) : null}
                        {initError ? (
                            <div className={styles.systemMsg}>
                                <span>{initError}</span>
                            </div>
                        ) : null}
                        {convMessages.map((msg, idx) => (
                            <MessageBubble 
                                key={msg.id ?? idx} 
                                msg={msg} 
                                isOwn={msg.senderId != null} 
                                onSend={(txt) => {
                                    setInput(txt);
                                    // Set timeout nhỏ để state input cập nhật trước khi click gửi
                                    setTimeout(() => {
                                        const sendBtn = document.getElementById('botSendBtn');
                                        if (sendBtn) sendBtn.click();
                                    }, 50);
                                }} 
                            />
                        ))}
                        {isTyping && <TypingIndicator />}
                    </>
                )}
                <div ref={endRef} />
            </div>

            {/* Quick prompts (hiện khi chưa có tin) */}
            {!isLoading && convMessages.filter(m => m.senderId != null).length === 0 && (
                <div className={styles.quickPrompts}>
                    {QUICK_PROMPTS.map(q => (
                        <button key={q.label} className={styles.quickPromptBtn}
                            onClick={() => { setInput(q.text); inputRef.current?.focus(); }}>
                            {q.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className={styles.inputArea}>
                <textarea
                    ref={inputRef}
                    className={styles.input}
                    placeholder={isAuthenticated
                        ? 'Nhắn điểm đến, ngân sách hoặc mã TRS-...'
                        : 'Đăng nhập để sử dụng tính năng này'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!isAuthenticated || isLoading}
                    rows={1}
                />
                <button
                    id="botSendBtn"
                    className={styles.sendBtn}
                    onClick={handleSend}
                    disabled={!input.trim() || !isAuthenticated || isLoading}
                    aria-label="Gửi"
                >
                    ✈
                </button>
            </div>
        </div>
    );
};

/* ───────────────────────── BotChatWidget (FAB) ───────────────────────── */
const BotChatWidget = () => {
    const dispatch = useDispatch();
    const { isBotOpen, totalUnread } = useSelector(state => state.chat);
    // Init WS connection globally
    const { sendMessage } = useChatWebSocket();

    return (
        <div className={styles.widget}>
            {/* Chat box */}
            {isBotOpen && (
                <div className={styles.chatBoxWrapper}>
                    <BotChatBox sendMessage={sendMessage} />
                </div>
            )}

            {/* FAB Button */}
            <button
                className={`${styles.fab} ${isBotOpen ? styles.fabActive : ''}`}
                onClick={() => dispatch(isBotOpen ? closeBot() : openBot())}
                aria-label="Chat hỗ trợ"
            >
                <span className={styles.fabIcon}>{isBotOpen ? '✕' : '🗺️'}</span>
                {!isBotOpen && totalUnread > 0 && (
                    <span className={styles.badge}>{totalUnread > 9 ? '9+' : totalUnread}</span>
                )}
            </button>
        </div>
    );
};

export default BotChatWidget;
