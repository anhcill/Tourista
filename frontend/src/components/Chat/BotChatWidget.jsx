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
import bookingApi from '../../api/bookingApi';
import favoriteApi from '../../api/favoriteApi';
import { getAccessToken } from '../../utils/authStorage';
import styles from './BotChatWidget.module.css';

const BOT_HISTORY_PAGE_SIZE = 30;

const unwrapPayload = (response) => response?.data ?? response ?? null;
const unwrapPagePayload = (response) => {
    const page = response?.data ?? response ?? null;

    if (Array.isArray(page)) {
        return {
            content: page,
            number: 0,
            totalPages: 1,
            last: true,
        };
    }

    return {
        content: Array.isArray(page?.content) ? page.content : [],
        number: Number.isInteger(page?.number) ? page.number : 0,
        totalPages: Number.isInteger(page?.totalPages) ? page.totalPages : 1,
        last: typeof page?.last === 'boolean' ? page.last : true,
    };
};
const unwrapListPayload = (response) => {
    const payload = response?.data ?? response ?? [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    return [];
};

const dedupeMessagesById = (items) => {
    if (!Array.isArray(items)) return [];

    const seen = new Set();
    const result = [];

    items.forEach((item) => {
        const fallbackKey = `${item?.senderId ?? 'bot'}-${item?.createdAt ?? ''}-${item?.content ?? ''}`;
        const key = item?.id ?? fallbackKey;

        if (seen.has(key)) return;
        seen.add(key);
        result.push(item);
    });

    return result;
};

const resolvePrimaryFavoriteLocation = (favorites) => {
    if (!Array.isArray(favorites) || favorites.length === 0) return '';

    const locationCount = new Map();
    favorites.forEach((item) => {
        const location = String(item?.location || '').trim();
        if (!location) return;

        const key = location.toLowerCase();
        const current = locationCount.get(key) || { label: location, count: 0 };
        current.count += 1;
        locationCount.set(key, current);
    });

    let selected = '';
    let selectedCount = -1;
    locationCount.forEach((value) => {
        if (value.count > selectedCount) {
            selectedCount = value.count;
            selected = value.label;
        }
    });

    return selected;
};

const resolveLatestBooking = (bookings) => {
    if (!Array.isArray(bookings) || bookings.length === 0) return null;

    const safeBookings = [...bookings].sort((a, b) => {
        const aTime = new Date(a?.createdAt || 0).getTime();
        const bTime = new Date(b?.createdAt || 0).getTime();
        return bTime - aTime;
    });

    return safeBookings[0] || null;
};

const resolveBudgetSegment = (bookings) => {
    if (!Array.isArray(bookings) || bookings.length === 0) return '';

    const amounts = bookings
        .map((booking) => Number(booking?.totalAmount || 0))
        .filter((value) => Number.isFinite(value) && value > 0);

    if (amounts.length === 0) return '';

    const average = amounts.reduce((sum, value) => sum + value, 0) / amounts.length;
    if (average <= 3000000) return 'toi uu chi phi';
    if (average <= 8000000) return 'can bang trai nghiem va chi phi';
    return 'uu tien trai nghiem chat luong cao';
};

const DEFAULT_QUICK_PROMPTS = [
    { label: '🔥 Tour hot', text: 'Cho mình xem các tour hot nhất hiện nay' },
    { label: '💸 Giá rẻ', text: 'Gợi ý tour giá rẻ ngân sách sinh viên' },
    { label: '🎯 Combo', text: 'Tourista có bán combo vé máy bay và khách sạn không?' },
    { label: '🔍 Tra cứu', text: 'Tôi muốn tra cứu mã đặt chỗ TRS-' },
    { label: '📞 Liên hệ', text: 'Cho tôi thông tin liên hệ hỗ trợ' },
];

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
                        {msg.content?.split('\n').map((line, i) => (
                            <p key={i} dangerouslySetInnerHTML={{
                                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
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
    const [isConciergeLoading, setIsConciergeLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(0);
    const [hasMoreHistory, setHasMoreHistory] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [pendingOutgoing, setPendingOutgoing] = useState([]);
    const [conciergeContext, setConciergeContext] = useState({
        favorites: [],
        bookings: [],
    });

    const endRef = useRef(null);
    const inputRef = useRef(null);
    const fallbackTimerRef = useRef(null);
    const hasInitializedRef = useRef(false);

    const convMessages = useMemo(() => {
        if (!activeBotConversationId) return [];
        return messages[activeBotConversationId] || [];
    }, [activeBotConversationId, messages]);

    const isOwnMessage = useCallback((msg) => {
        if (!msg || msg?.senderId == null || user?.id == null) return false;
        return Number(msg.senderId) === Number(user.id);
    }, [user?.id]);

    const loadConversationPage = useCallback(async (conversationId, page, appendOlder = false) => {
        const response = await chatApi.getMessages(conversationId, page, BOT_HISTORY_PAGE_SIZE);
        const pageData = unwrapPagePayload(response);

        if (appendOlder) {
            const current = messages[conversationId] || [];
            const merged = dedupeMessagesById([...pageData.content, ...current]);
            dispatch(setMessages({ conversationId, messages: merged }));
        } else {
            dispatch(setMessages({ conversationId, messages: dedupeMessagesById(pageData.content) }));
        }

        setHistoryPage(pageData.number);
        setHasMoreHistory(pageData.number + 1 < pageData.totalPages && !pageData.last);
    }, [dispatch, messages]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [convMessages, isTyping, pendingOutgoing]);

    useEffect(() => {
        if (!activeBotConversationId) {
            setPendingOutgoing([]);
            return;
        }

        setPendingOutgoing([]);
    }, [activeBotConversationId]);

    useEffect(() => {
        if (!isBotOpen || !isAuthenticated) {
            setConciergeContext({ favorites: [], bookings: [] });
            setIsConciergeLoading(false);
            return;
        }

        let isMounted = true;

        const loadConciergeContext = async () => {
            setIsConciergeLoading(true);

            const [favoritesResult, bookingsResult] = await Promise.allSettled([
                favoriteApi.getMyFavorites(),
                bookingApi.getBookings({ page: 1, size: 6 }),
            ]);

            if (!isMounted) return;

            const favorites = favoritesResult.status === 'fulfilled'
                ? unwrapListPayload(favoritesResult.value)
                : [];

            const bookings = bookingsResult.status === 'fulfilled'
                ? unwrapListPayload(bookingsResult.value)
                : [];

            setConciergeContext({ favorites, bookings });
            setIsConciergeLoading(false);
        };

        loadConciergeContext();

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, isBotOpen]);

    const initBotConversation = useCallback(async () => {
        if (typeof window !== 'undefined') {
            const token = getAccessToken();
            if (!token) {
                setInitError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để chat với bot.');
                return null;
            }
        }

        if (activeBotConversationId) {
            const cached = messages[activeBotConversationId] || [];
            dispatch(setActiveBotConversation(activeBotConversationId));

            if (cached.length > 0) {
                setHistoryPage(0);
                setHasMoreHistory(cached.length >= BOT_HISTORY_PAGE_SIZE);

                try {
                    dispatch(markConversationRead(activeBotConversationId));
                    await chatApi.markAsRead(activeBotConversationId);
                } catch (readError) {
                    console.warn('[Bot] markAsRead warning:', readError);
                }

                return activeBotConversationId;
            }

            setIsLoading(true);
            setInitError('');
            try {
                await loadConversationPage(activeBotConversationId, 0, false);
                dispatch(markConversationRead(activeBotConversationId));
                await chatApi.markAsRead(activeBotConversationId);
                return activeBotConversationId;
            } catch (error) {
                setInitError(extractErrorMessage(error));
                return null;
            } finally {
                setIsLoading(false);
                setTimeout(() => inputRef.current?.focus(), 100);
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
            await loadConversationPage(conv.id, 0, false);

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
    }, [activeBotConversationId, dispatch, loadConversationPage, messages]);

    useEffect(() => {
        if (!isBotOpen || !isAuthenticated) {
            hasInitializedRef.current = false;
            return;
        }

        if (hasInitializedRef.current) {
            return;
        }
        hasInitializedRef.current = true;

        if (typeof window !== 'undefined') {
            const token = getAccessToken();
            if (!token) {
                setInitError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để chat với bot.');
                hasInitializedRef.current = false;
                return;
            }
        }

        void initBotConversation();
    }, [isBotOpen, isAuthenticated, initBotConversation]);

    useEffect(() => {
        const lastMsg = convMessages[convMessages.length - 1];
        if (!lastMsg) return;

        if (!isOwnMessage(lastMsg)) {
            setIsTyping(false);
        }
    }, [convMessages, isOwnMessage]);

    useEffect(() => {
        if (pendingOutgoing.length === 0 || convMessages.length === 0) return;

        setPendingOutgoing((prev) => prev.filter((pending) => {
            const pendingTime = new Date(pending.createdAt).getTime();

            return !convMessages.some((msg) => {
                if (!isOwnMessage(msg)) return false;

                const contentMatched = String(msg?.content || '').trim() === String(pending?.content || '').trim();
                if (!contentMatched) return false;

                const msgTime = new Date(msg?.createdAt || 0).getTime();
                return Number.isFinite(msgTime) && Math.abs(msgTime - pendingTime) <= 30000;
            });
        }));
    }, [convMessages, pendingOutgoing.length, isOwnMessage]);

    const handleSend = useCallback(async (overrideText) => {
        const text = (overrideText ?? input).trim();
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
        setPendingOutgoing((prev) => [...prev, {
            tempId: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            content: text,
            createdAt: new Date().toISOString(),
        }]);

        if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
        }

        fallbackTimerRef.current = setTimeout(async () => {
            try {
                await loadConversationPage(conversationId, 0, false);
            } catch (refreshError) {
                console.warn('[Bot] history refresh warning:', refreshError);
            } finally {
                setIsTyping(false);
            }
        }, 4500);
    }, [activeBotConversationId, initBotConversation, input, isLoading, loadConversationPage, sendMessage]);

    useEffect(() => {
        return () => {
            if (fallbackTimerRef.current) {
                clearTimeout(fallbackTimerRef.current);
            }
        };
    }, []);

    const handleLoadOlder = useCallback(async () => {
        if (!activeBotConversationId || !hasMoreHistory || isLoadingHistory || isLoading) return;

        setIsLoadingHistory(true);
        try {
            await loadConversationPage(activeBotConversationId, historyPage + 1, true);
        } catch (error) {
            console.warn('[Bot] load older history warning:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [activeBotConversationId, hasMoreHistory, historyPage, isLoading, isLoadingHistory, loadConversationPage]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
        }
    };

    const personalizedPrompts = useMemo(() => {
        if (!isAuthenticated) return [];

        const prompts = [];
        const firstName = String(user?.fullName || '').trim().split(' ')[0] || '';
        const favoriteLocation = resolvePrimaryFavoriteLocation(conciergeContext.favorites);
        const latestBooking = resolveLatestBooking(conciergeContext.bookings);
        const budgetSegment = resolveBudgetSegment(conciergeContext.bookings);
        const topFavorite = conciergeContext.favorites?.[0];

        if (favoriteLocation) {
            prompts.push({
                label: `📍 ${favoriteLocation}`,
                text: `Len ke hoach lich trinh ca nhan hoa cho ${favoriteLocation} trong 3 ngay 2 dem.`,
            });
        }

        if (latestBooking?.bookingCode) {
            prompts.push({
                label: '🧾 Booking gan nhat',
                text: `Toi muon checklist chuan bi chuyen di cho ma booking ${latestBooking.bookingCode}.`,
            });
        }

        if (topFavorite?.title) {
            prompts.push({
                label: '❤️ Tu favorite',
                text: `Goi y hanh trinh tu muc yeu thich "${topFavorite.title}" de dat nhanh trong tuan nay.`,
            });
        }

        if (budgetSegment) {
            prompts.push({
                label: '💰 Ngan sach ca nhan',
                text: `Tu van tour theo phong cach ${budgetSegment} cho nhom cua toi.`,
            });
        }

        if (firstName && prompts.length < 3) {
            prompts.push({
                label: `👋 Chao ${firstName}`,
                text: 'Chao tro ly, hay goi y ke hoach du lich ca nhan hoa cho toi trong thang nay.',
            });
        }

        return prompts.slice(0, 4);
    }, [conciergeContext.bookings, conciergeContext.favorites, isAuthenticated, user?.fullName]);

    const conciergeHighlights = useMemo(() => {
        const highlights = [];
        const favoriteLocation = resolvePrimaryFavoriteLocation(conciergeContext.favorites);
        const latestBooking = resolveLatestBooking(conciergeContext.bookings);
        const favoriteCount = conciergeContext.favorites?.length || 0;

        if (favoriteLocation) {
            highlights.push(`Ban dang quan tam nhieu den ${favoriteLocation}.`);
        }
        if (latestBooking?.bookingCode) {
            highlights.push(`Da dong bo ma booking gan nhat: ${latestBooking.bookingCode}.`);
        }
        if (favoriteCount > 0) {
            highlights.push(`Dang co ${favoriteCount} muc yeu thich san sang de len lich trinh.`);
        }

        return highlights;
    }, [conciergeContext.bookings, conciergeContext.favorites]);

    const quickPrompts = useMemo(() => {
        const merged = [...personalizedPrompts, ...DEFAULT_QUICK_PROMPTS];
        return merged.slice(0, 8);
    }, [personalizedPrompts]);

    return (
        <div className={styles.chatBox}>
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

            <div className={styles.messagesArea}>
                {isLoading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner} />
                        <span>Đang mở kênh trợ lý du lịch...</span>
                    </div>
                ) : (
                    <>
                        {hasMoreHistory ? (
                            <button
                                className={styles.loadOlderBtn}
                                onClick={handleLoadOlder}
                                disabled={isLoadingHistory}
                            >
                                {isLoadingHistory ? 'Đang tải đoạn chat cũ...' : 'Xem đoạn chat trước đó'}
                            </button>
                        ) : null}

                        {!initError && convMessages.length === 0 ? (
                            <div className={styles.welcomeCard}>
                                <div className={styles.welcomeTitle}>Lên kế hoạch chuyến đi chỉ trong vài tin nhắn</div>
                                <div className={styles.welcomeMeta}>Bạn có thể tra cứu booking, hỏi thanh toán hoặc nhắn ngân sách + số người + điểm đến + số ngày để mình gợi ý tour sát nhu cầu.</div>
                                {isConciergeLoading ? (
                                    <p className={styles.conciergeLoading}>Dang tai du lieu ca nhan hoa cho tro ly...</p>
                                ) : conciergeHighlights.length > 0 ? (
                                    <ul className={styles.conciergeList}>
                                        {conciergeHighlights.map((item) => (
                                            <li key={item} className={styles.conciergeItem}>{item}</li>
                                        ))}
                                    </ul>
                                ) : null}
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
                                isOwn={isOwnMessage(msg)}
                                onSend={(txt) => void handleSend(txt)}
                            />
                        ))}

                        {pendingOutgoing.map((pending) => (
                            <MessageBubble
                                key={pending.tempId}
                                msg={{
                                    contentType: 'TEXT',
                                    content: pending.content,
                                    createdAt: pending.createdAt,
                                    senderId: user?.id,
                                }}
                                isOwn
                                onSend={(txt) => void handleSend(txt)}
                            />
                        ))}

                        {isTyping && <TypingIndicator />}
                    </>
                )}
                <div ref={endRef} />
            </div>

            {!isLoading && convMessages.filter(m => m.senderId != null).length === 0 && (
                <div className={styles.quickPrompts}>
                    {quickPrompts.map(q => (
                        <button
                            key={q.label}
                            className={styles.quickPromptBtn}
                            onClick={() => {
                                setInput(q.text);
                                inputRef.current?.focus();
                            }}
                        >
                            {q.label}
                        </button>
                    ))}
                </div>
            )}

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
                    onClick={() => void handleSend()}
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
    const { sendMessage } = useChatWebSocket();

    return (
        <div className={styles.widget}>
            {isBotOpen && (
                <div className={styles.chatBoxWrapper}>
                    <BotChatBox sendMessage={sendMessage} />
                </div>
            )}

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
