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
import type {
    ChatMessage,
    QuickPrompt,
    ConciergeContext,
    PendingMessage,
    ContentType,
} from '../../types/chat';
import styles from './BotChatWidget.module.css';

const BOT_HISTORY_PAGE_SIZE = 30;

const DEFAULT_QUICK_PROMPTS: QuickPrompt[] = [
    { label: '🔥 Tour hot', text: 'Cho minh xem cac tour hot nhat hien nay' },
    { label: '💸 Gia re', text: 'Go y tour gia re ngan sach sinh vien' },
    { label: '🎯 Combo', text: 'Tourista Studio co ban combo ve may bay va khach san khong?' },
    { label: '🔍 Tra cuu', text: 'Toi muon tra cuu ma dat cho TRS-' },
    { label: '📞 Lien he', text: 'Cho toi thong tin lien he ho tro' },
];

const unwrapPayload = (response: { data?: unknown } | unknown): unknown =>
    (response as { data?: unknown })?.data ?? response ?? null;

const unwrapPagePayload = (
    response: { data?: { content?: unknown[]; number?: number; totalPages?: number; last?: boolean } | unknown[] } | unknown
) => {
    const page = (response as { data?: unknown })?.data ?? response ?? null;

    if (Array.isArray(page)) {
        return {
            content: page,
            number: 0,
            totalPages: 1,
            last: true,
        };
    }

    const p = page as {
        content?: unknown[];
        number?: number;
        totalPages?: number;
        last?: boolean;
    };

    return {
        content: Array.isArray(p?.content) ? p.content : [],
        number: typeof p?.number === 'number' ? p.number : 0,
        totalPages: typeof p?.totalPages === 'number' ? p.totalPages : 1,
        last: typeof p?.last === 'boolean' ? p.last : true,
    };
};

const unwrapListPayload = (response: unknown): unknown[] => {
    const payload = (response as { data?: unknown })?.data ?? response ?? [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray((payload as { content?: unknown })?.content)) return (payload as { content: unknown[] }).content;
    return [];
};

const dedupeMessagesById = (items: ChatMessage[]): ChatMessage[] => {
    if (!Array.isArray(items)) return [];

    const seen = new Set<string>();
    const result: ChatMessage[] = [];

    for (const item of items) {
        const fallbackKey = `${item?.senderId ?? 'bot'}-${item?.createdAt ?? ''}-${item?.content ?? ''}`;
        const key = String(item?.id ?? fallbackKey);

        if (seen.has(key)) continue;
        seen.add(key);
        result.push(item);
    }

    return result;
};

const resolvePrimaryFavoriteLocation = (favorites: Record<string, unknown>[]): string => {
    if (!Array.isArray(favorites) || favorites.length === 0) return '';

    const locationCount = new Map<string, { label: string; count: number }>();
    for (const item of favorites) {
        const location = String((item as Record<string, unknown>)?.location ?? '').trim();
        if (!location) continue;

        const key = location.toLowerCase();
        const current = locationCount.get(key) || { label: location, count: 0 };
        current.count += 1;
        locationCount.set(key, current);
    }

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

const resolveLatestBooking = (bookings: Record<string, unknown>[]): Record<string, unknown> | null => {
    if (!Array.isArray(bookings) || bookings.length === 0) return null;

    const sorted = [...bookings].sort((a, b) => {
        const aTime = new Date(String((a as Record<string, unknown>)?.createdAt || 0)).getTime();
        const bTime = new Date(String((b as Record<string, unknown>)?.createdAt || 0)).getTime();
        return bTime - aTime;
    });

    return sorted[0] || null;
};

const resolveBudgetSegment = (bookings: Record<string, unknown>[]): string => {
    if (!Array.isArray(bookings) || bookings.length === 0) return '';

    const amounts = bookings
        .map((b) => Number((b as Record<string, unknown>)?.totalAmount || 0))
        .filter((v) => Number.isFinite(v) && v > 0);

    if (amounts.length === 0) return '';

    const average = amounts.reduce((sum, v) => sum + v, 0) / amounts.length;
    if (average <= 3000000) return 'toi uu chi phi';
    if (average <= 8000000) return 'can bang trai nghiem va chi phi';
    return 'uu tien trai nghiem chat luong cao';
};

const extractErrorMessage = (error: unknown): string => {
    if (!error) return 'Khong the ket noi chatbot luc nay.';
    if (typeof error === 'string') return error;
    const e = error as { message?: string; data?: { message?: string } };
    return e?.message || e?.data?.message || 'Khong the ket noi chatbot luc nay.';
};

/* ───────────────────────── Message Bubble ───────────────────────── */
interface MessageBubbleProps {
    msg: ChatMessage;
    isOwn: boolean;
    onSend: (text: string) => void;
}

const MessageBubble = React.memo<MessageBubbleProps>(({ msg, isOwn, onSend }) => {
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
            {!isOwn && <div className={styles.botAvatar}>🧭</div>}
            <div className={`${styles.bubbleContent} ${isOwn ? styles.bubbleContentOwn : styles.bubbleContentBot}`}>
                {isBookingCard ? (
                    <BookingItineraryCard metadata={msg.metadata ?? null} />
                ) : isScenarioChoice ? (
                    <ScenarioChoiceCard metadata={msg.metadata ?? null} onChoice={onSend} />
                ) : isTourCards ? (
                    <TourResultCard metadata={msg.metadata ?? null} />
                ) : (
                    <div className={styles.bubbleText}>
                        {(msg.content ?? '').split('\n').map((line, i) => (
                            <p
                                key={i}
                                dangerouslySetInnerHTML={{
                                    __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                                }}
                            />
                        ))}
                    </div>
                )}
                <span className={styles.bubbleTime}>
                    {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                          })
                        : ''}
                </span>
            </div>
        </div>
    );
});

MessageBubble.displayName = 'MessageBubble';

/* ───────────────────────── Typing Indicator ───────────────────────── */
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

/* ───────────────────────── Bot Chat Box ───────────────────────── */
interface BotChatBoxProps {
    sendMessage: (conversationId: number, content: string) => boolean;
}

const BotChatBox = ({ sendMessage }: BotChatBoxProps) => {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state: { auth: { isAuthenticated: boolean; user?: { id?: number; fullName?: string } } }) => state.auth);
    const { activeBotConversationId, messages, isBotOpen } = useSelector(
        (state: { chat: { activeBotConversationId: number | null; messages: Record<number, ChatMessage[]>; isBotOpen: boolean } }) => state.chat
    );

    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [initError, setInitError] = useState('');
    const [isConciergeLoading, setIsConciergeLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(0);
    const [hasMoreHistory, setHasMoreHistory] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [pendingOutgoing, setPendingOutgoing] = useState<PendingMessage[]>([]);
    const [conciergeContext, setConciergeContext] = useState<ConciergeContext>({
        favorites: [],
        bookings: [],
    });

    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasInitializedRef = useRef(false);

    const convMessages = useMemo((): ChatMessage[] => {
        if (!activeBotConversationId) return [];
        return messages[activeBotConversationId] || [];
    }, [activeBotConversationId, messages]);

    const isOwnMessage = useCallback(
        (msg: ChatMessage): boolean => {
            if (!msg || msg?.senderId == null || user?.id == null) return false;
            return Number(msg.senderId) === Number(user.id);
        },
        [user?.id]
    );

    const loadConversationPage = useCallback(
        async (conversationId: number, page: number, appendOlder = false) => {
            const response = await chatApi.getMessages(conversationId, page, BOT_HISTORY_PAGE_SIZE);
            const pageData = unwrapPagePayload(response);

            if (appendOlder) {
                const current = messages[conversationId] || [];
                const merged = dedupeMessagesById([...(pageData.content as ChatMessage[]), ...current]);
                dispatch(setMessages({ conversationId, messages: merged }));
            } else {
                dispatch(
                    setMessages({ conversationId, messages: dedupeMessagesById(pageData.content as ChatMessage[]) })
                );
            }

            setHistoryPage(pageData.number);
            setHasMoreHistory(
                pageData.number + 1 < pageData.totalPages && !pageData.last
            );
        },
        [dispatch, messages]
    );

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

            const favorites =
                favoritesResult.status === 'fulfilled' ? unwrapListPayload(favoritesResult.value) : [];
            const bookings =
                bookingsResult.status === 'fulfilled' ? unwrapListPayload(bookingsResult.value) : [];

            setConciergeContext({ favorites: favorites as Record<string, unknown>[], bookings: bookings as Record<string, unknown>[] });
            setIsConciergeLoading(false);
        };

        loadConciergeContext();

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, isBotOpen]);

    const initBotConversation = useCallback(
        async (): Promise<number | null> => {
            if (typeof window !== 'undefined') {
                const token = getAccessToken();
                if (!token) {
                    setInitError('Phien dang nhap da het han. Vui long dang nhap lai de chat voi bot.');
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
                const conv = unwrapPayload(res) as { id?: number };

                if (!conv?.id) {
                    throw new Error('Khong lay duoc hoi thoai BOT.');
                }

                dispatch(setActiveBotConversation(conv.id as number));
                await loadConversationPage(conv.id as number, 0, false);

                try {
                    dispatch(markConversationRead(conv.id as number));
                    await chatApi.markAsRead(conv.id as number);
                } catch (readError) {
                    console.warn('[Bot] markAsRead warning:', readError);
                }

                return conv.id as number;
            } catch (error) {
                const e = error as { status?: number };
                if (e?.status === 401) {
                    setInitError('Phien dang nhap da het han. Vui long dang nhap lai de tiep tuc.');
                    return null;
                }

                const message = extractErrorMessage(error);
                setInitError(message);
                console.error('[Bot] Init error:', {
                    message,
                    status: (error as { status?: number })?.status,
                    raw: error,
                });
                return null;
            } finally {
                setIsLoading(false);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        },
        [activeBotConversationId, dispatch, loadConversationPage, messages]
    );

    useEffect(() => {
        if (!isBotOpen || !isAuthenticated) {
            hasInitializedRef.current = false;
            return;
        }

        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

        if (typeof window !== 'undefined') {
            const token = getAccessToken();
            if (!token) {
                setInitError('Phien dang nhap da het han. Vui long dang nhap lai de chat voi bot.');
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

        setPendingOutgoing((prev) =>
            prev.filter((pending) => {
                const pendingTime = new Date(pending.createdAt).getTime();

                return !convMessages.some((msg) => {
                    if (!isOwnMessage(msg)) return false;

                    const contentMatched =
                        String(msg?.content || '').trim() === String(pending?.content || '').trim();
                    if (!contentMatched) return false;

                    const msgTime = new Date(msg?.createdAt || 0).getTime();
                    return (
                        Number.isFinite(msgTime) && Math.abs(msgTime - pendingTime) <= 30000
                    );
                });
            })
        );
    }, [convMessages, pendingOutgoing.length, isOwnMessage]);

    const handleSend = useCallback(
        async (overrideText?: string) => {
            const text = (overrideText ?? input).trim();
            if (!text || isLoading) return;

            let conversationId = activeBotConversationId;
            if (!conversationId) {
                conversationId = (await initBotConversation()) as number;
            }

            if (!conversationId) {
                setInitError('Khong the khoi tao hoi thoai chatbot. Vui long thu lai.');
                return;
            }

            const sent = sendMessage(conversationId, text);
            if (!sent) {
                setInitError('Mat ket noi chat thoi gian thuc. Vui long doi vai giay roi gui lai.');
                return;
            }

            setInput('');
            setInitError('');
            setIsTyping(true);
            setPendingOutgoing((prev) => [
                ...prev,
                {
                    tempId: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    content: text,
                    createdAt: new Date().toISOString(),
                },
            ]);

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
        },
        [activeBotConversationId, initBotConversation, input, isLoading, loadConversationPage, sendMessage]
    );

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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
        }
    };

    const personalizedPrompts = useMemo((): QuickPrompt[] => {
        if (!isAuthenticated) return [];

        const prompts: QuickPrompt[] = [];
        const firstName = String(user?.fullName || '').trim().split(' ')[0] || '';
        const favoriteLocation = resolvePrimaryFavoriteLocation(
            conciergeContext.favorites as Record<string, unknown>[]
        );
        const latestBooking = resolveLatestBooking(conciergeContext.bookings as Record<string, unknown>[]);
        const budgetSegment = resolveBudgetSegment(conciergeContext.bookings as Record<string, unknown>[]);
        const topFavorite = conciergeContext.favorites?.[0] as Record<string, unknown> | undefined;

        if (favoriteLocation) {
            prompts.push({
                label: `📍 ${favoriteLocation}`,
                text: `Len ke hoach lich trinh ca nhan hoa cho ${favoriteLocation} trong 3 ngay 2 dem.`,
            });
        }

        if ((latestBooking as Record<string, unknown>)?.bookingCode) {
            prompts.push({
                label: '🧾 Booking gan nhat',
                text: `Toi muon checklist chuan bi chuyen di cho ma booking ${(latestBooking as Record<string, unknown>).bookingCode}.`,
            });
        }

        if (topFavorite?.title) {
            prompts.push({
                label: '❤️ Tu favorite',
                text: `Go y hanh trinh tu muc yeu thich "${topFavorite.title}" de dat nhanh trong tuan nay.`,
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

    const conciergeHighlights = useMemo((): string[] => {
        const highlights: string[] = [];
        const favoriteLocation = resolvePrimaryFavoriteLocation(
            conciergeContext.favorites as Record<string, unknown>[]
        );
        const latestBooking = resolveLatestBooking(
            conciergeContext.bookings as Record<string, unknown>[]
        );
        const favoriteCount = conciergeContext.favorites?.length || 0;

        if (favoriteLocation) {
            highlights.push(`Ban dang quan tam nhieu den ${favoriteLocation}.`);
        }
        if ((latestBooking as Record<string, unknown>)?.bookingCode) {
            highlights.push(
                `Da dong bo ma booking gan nhat: ${(latestBooking as Record<string, unknown>).bookingCode}.`
            );
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

    const renderMessage = useCallback(
        (msg: ChatMessage, idx: number) => (
            <MessageBubble
                key={msg.id ?? idx}
                msg={msg}
                isOwn={isOwnMessage(msg)}
                onSend={(txt: string) => void handleSend(txt)}
            />
        ),
        [isOwnMessage, handleSend]
    );

    return (
        <div className={styles.chatBox}>
            {/* ── Header ── */}
            <div className={styles.chatHeader}>
                <div className={styles.chatHeaderLeft}>
                    <div className={styles.botIcon}>🌴</div>
                    <div>
                        <div className={styles.chatHeaderName}>Tourista Studio Travel Buddy</div>
                        <div className={styles.chatHeaderStatus}>
                            <span className={styles.onlineDot} />
                            San sang tu van hanh trinh
                        </div>
                    </div>
                </div>
                <button
                    className={styles.closeBtn}
                    onClick={() => dispatch(closeBot())}
                    aria-label="Dong"
                >
                    ✕
                </button>
            </div>

            {/* ── Messages Area ── */}
            <div className={styles.messagesArea}>
                {isLoading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner} />
                        <span>Dang mo kenh tro ly du lich...</span>
                    </div>
                ) : (
                    <>
                        {hasMoreHistory ? (
                            <button
                                className={styles.loadOlderBtn}
                                onClick={handleLoadOlder}
                                disabled={isLoadingHistory}
                            >
                                {isLoadingHistory ? 'Dang tai doan chat cu...' : 'Xem doan chat truoc do'}
                            </button>
                        ) : null}

                        {!initError && convMessages.length === 0 ? (
                            <div className={styles.welcomeCard}>
                                <div className={styles.welcomeTitle}>
                                    Len ke hoach chuyen di chi trong vai tin nhan
                                </div>
                                <div className={styles.welcomeMeta}>
                                    Ban co the tra cuu booking, hoi thanh toan hoac nhap ngan sach + so nguoi + diem den + so ngay de minh goi y tour sat nhu cau.
                                </div>
                                {isConciergeLoading ? (
                                    <p className={styles.conciergeLoading}>
                                        Dang tai du lieu ca nhan hoa cho tro ly...
                                    </p>
                                ) : conciergeHighlights.length > 0 ? (
                                    <ul className={styles.conciergeList}>
                                        {conciergeHighlights.map((item, idx) => (
                                            <li key={idx} className={styles.conciergeItem}>
                                                {item}
                                            </li>
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

                        {convMessages.map(renderMessage)}

                        {pendingOutgoing.map((pending) => (
                            <MessageBubble
                                key={pending.tempId}
                                msg={{
                                    contentType: 'TEXT' as ContentType,
                                    content: pending.content,
                                    createdAt: pending.createdAt,
                                    senderId: user?.id ?? null,
                                }}
                                isOwn
                                onSend={(txt: string) => void handleSend(txt)}
                            />
                        ))}

                        {isTyping && <TypingIndicator />}
                    </>
                )}
                <div ref={endRef} />
            </div>

            {/* ── Quick Prompts (first message only) ── */}
            {!isLoading && convMessages.filter((m) => m.senderId != null).length === 0 && (
                <div className={styles.quickPrompts}>
                    {quickPrompts.map((q) => (
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

            {/* ── Input Area ── */}
            <div className={styles.inputArea}>
                <textarea
                    ref={inputRef}
                    className={styles.input}
                    placeholder={
                        isAuthenticated
                            ? 'Nhac diem den, ngan sach hoac ma TRS-...'
                            : 'Dang nhap de su dung tinh nang nay'
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!isAuthenticated || isLoading}
                    rows={1}
                />
                <button
                    id="botSendBtn"
                    className={styles.sendBtn}
                    onClick={() => void handleSend()}
                    disabled={!input.trim() || !isAuthenticated || isLoading}
                    aria-label="Gui"
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
    const { isBotOpen, totalUnread } = useSelector(
        (state: { chat: { isBotOpen: boolean; totalUnread: number } }) => state.chat
    );
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
                aria-label="Chat ho tro"
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
