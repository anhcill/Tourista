'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openBot, closeBot, setActiveBotConversation, addMessage } from '../../store/slices/chatSlice';
import chatApi from '../../api/chatApi';
import { useChatWebSocket } from '../../hooks/useChatWebSocket';
import type { ChatMessage, ContentType } from '../../types/chat';
import styles from './BotChatWidget.module.css';

interface Offer {
    id: string;
    emoji: string;
    label: string;
    hint: string;
}

const OFFERS: Offer[] = [
    { id: 'hot_tour', emoji: '🔥', label: 'Tour Hot', hint: 'Xem các tour hot nhất' },
    { id: 'cancel', emoji: '❌', label: 'Hủy/Hoàn tiền', hint: 'Chính sách hủy và hoàn tiền' },
    { id: 'payment', emoji: '💳', label: 'Thanh toán', hint: 'Hướng dẫn thanh toán' },
    { id: 'contact', emoji: '📞', label: 'Liên hệ hỗ trợ', hint: 'Thông tin liên hệ hỗ trợ' },
    { id: 'visa', emoji: '🛂', label: 'Visa & Giấy tờ', hint: 'Thủ tục Visa, hộ chiếu' },
    { id: 'insurance', emoji: '🔄', label: 'Đổi/Trả/Hoàn', hint: 'Chính sách đổi trả hoàn tiền' },
];

const GREETING = `Xin chào! Mình là **Tourista Travel Buddy** — trợ lý du lịch của bạn.\n\nMình có thể giúp bạn giải đáp nhanh: chính sách hủy, thanh toán, lịch trình tour, visa, bảo hiểm và nhiều hơn nữa.\n\n**Chọn một chủ đề bên dưới** hoặc **nhắn tin trực tiếp** để mình hỗ trợ nhé! 👇`;

/* ───────────────────────── Safe Markdown Parser ───────────────────────── */
const renderSafeText = (text: string): React.ReactNode[] => {
    const segments: React.ReactNode[] = [];
    const parts = (text || '').split(/(\*\*.*?\*\*)/g);
    parts.forEach((part, i) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            segments.push(<strong key={i}>{part.slice(2, -2)}</strong>);
        } else if (part) {
            segments.push(<span key={i}>{part}</span>);
        }
    });
    return segments;
};

/* ───────────────────────── Message Bubble ───────────────────────── */
interface MessageBubbleProps {
    msg: ChatMessage;
    isOwn: boolean;
}

const MessageBubble = React.memo<MessageBubbleProps>(({ msg, isOwn }) => {
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
            {!isOwn && <div className={styles.botAvatar}>🌴</div>}
            <div className={`${styles.bubbleContent} ${isOwn ? styles.bubbleContentOwn : styles.bubbleContentBot}`}>
                <div className={styles.bubbleText}>
                    {(msg.content ?? '').split('\n').map((line, i) => (
                        <p key={i}>{renderSafeText(line)}</p>
                    ))}
                </div>
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

/* ───────────────────────── Offer Buttons ───────────────────────── */
interface OfferButtonsProps {
    onSelect: (offer: Offer) => void;
    disabled: boolean;
}

const OfferButtons = ({ onSelect, disabled }: OfferButtonsProps) => (
    <div className={styles.offersSection}>
        <div className={styles.offersHeader}>⚡ Bạn cần tìm hiểu điều gì?</div>
        <div className={styles.offersGrid}>
            {OFFERS.map((offer) => (
                <button
                    key={offer.id}
                    className={styles.offerBtn}
                    onClick={() => onSelect(offer)}
                    disabled={disabled}
                    title={offer.hint}
                >
                    <span className={styles.offerEmoji}>{offer.emoji}</span>
                    <span className={styles.offerLabel}>{offer.label}</span>
                </button>
            ))}
        </div>
    </div>
);

/* ───────────────────────── Bot Chat Box ───────────────────────── */
const BotChatBox = () => {
    const dispatch = useDispatch();
    const { sendMessage } = useChatWebSocket();
    const { user } = useSelector(
        (state: { auth: { isAuthenticated: boolean; user?: { id?: number; fullName?: string } } }) => state.auth
    );
    const { messages: wsMessages, activeBotConversationId } = useSelector(
        (state: { chat: { messages: Record<number, ChatMessage[]>; activeBotConversationId: number | null } }) => state.chat
    );

    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [isWsReady, setIsWsReady] = useState(false);

    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const initializedRef = useRef(false);

    // Merge greeting + WebSocket messages into one display list
    const displayMessages = React.useMemo<ChatMessage[]>(() => {
        if (!conversationId) return [];
        const wsList: ChatMessage[] = wsMessages[conversationId] || [];

        // If wsList is empty (not yet loaded from WS), prepend greeting
        if (wsList.length === 0 && !initializedRef.current) {
            return [{
                id: 0,
                senderId: 0 as number,
                contentType: 'TEXT' as ContentType,
                content: GREETING,
                createdAt: new Date().toISOString(),
            }];
        }

        // If wsList already has messages from WS, use them (server sent greeting + history)
        return wsList;
    }, [conversationId, wsMessages]);

    // Initialize BOT conversation via REST, then subscribe to WebSocket
    useEffect(() => {
        if (initializedRef.current || !user) return;
        initializedRef.current = true;

        const init = async () => {
            try {
                const res = await chatApi.createConversation({ type: 'BOT' });
                console.log('[Bot] createConversation raw response:', JSON.stringify(res, null, 2));
                const conv = res?.data?.data ?? res?.data;
                console.log('[Bot] Unwrapped conversation:', conv);
                if (conv?.id) {
                    setConversationId(conv.id);
                    dispatch(setActiveBotConversation(conv.id));

                    // Load existing message history
                    const histRes = await chatApi.getMessages(conv.id);
                    const hist: ChatMessage[] = histRes?.data?.content ?? [];
                    hist.forEach(msg => dispatch(addMessage({ ...msg, conversationId: conv.id })));

                    setIsWsReady(true);
                }
            } catch (err) {
                console.error('[Bot] Failed to init conversation:', err);
            }
        };

        void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Handle incoming WebSocket messages for bot typing indicator
    useEffect(() => {
        if (!conversationId) return;
        const msgs = wsMessages[conversationId] || [];
        const lastMsg = msgs[msgs.length - 1];
        setIsTyping(false);
    }, [wsMessages, conversationId]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [displayMessages]);

    const sendText = async (text: string) => {
        if (!conversationId || !text.trim()) return;
        if (!isWsReady) {
            console.warn('[Bot] WebSocket not ready yet');
            return;
        }

        const sent = sendMessage(conversationId, text.trim());
        if (!sent) {
            console.warn('[Bot] Failed to send via WebSocket');
        }
        setIsTyping(true);
        setShowOffers(false);
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const [showOffers, setShowOffers] = useState(true);

    const handleOfferSelect = (offer: Offer) => {
        const questionMap: Record<string, string> = {
            hot_tour: 'Cho mình xem các tour hot nhất hiện nay',
            cancel: 'Chính sách hủy tour và hoàn tiền như thế nào?',
            payment: 'Tourista Studio có những hình thức thanh toán nào? Hướng dẫn thanh toán VNPay giúp mình.',
            contact: 'Cho mình thông tin liên hệ hỗ trợ của Tourista Studio',
            visa: 'Cho mình hỏi về thủ tục Visa và giấy tờ cần thiết khi đi du lịch nước ngoài',
            insurance: 'Chính sách đổi, trả và hoàn tiền trên Tourista Studio như thế nào?',
        };
        void sendText(questionMap[offer.id] || offer.label);
    };

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;
        void sendText(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSend();
        }
    };

    const handleOpenBot = () => {
        dispatch(openBot());
    };

    return (
        <div className={styles.chatBox}>
            {/* ── Header ── */}
            <div className={styles.chatHeader}>
                <div className={styles.chatHeaderLeft}>
                    <div className={styles.botIcon}>🌴</div>
                    <div>
                        <div className={styles.chatHeaderName}>Tourista Travel Buddy</div>
                        <div className={styles.chatHeaderStatus}>
                            <span className={styles.onlineDot} />
                            Chat 24/7
                        </div>
                    </div>
                </div>
                <button
                    className={styles.closeBtn}
                    onClick={() => dispatch(closeBot())}
                    aria-label="Đóng"
                >
                    ✕
                </button>
            </div>

            {/* ── Messages Area ── */}
            <div className={styles.messagesArea}>
                {displayMessages.map((msg, idx) => (
                    <MessageBubble
                        key={msg.id ?? idx}
                        msg={msg}
                        isOwn={msg.senderId != null && user?.id != null && Number(msg.senderId) === Number(user.id)}
                    />
                ))}
                {isTyping && (
                    <div className={`${styles.bubble} ${styles.bubbleBot}`}>
                        <div className={styles.botAvatar}>🌴</div>
                        <div className={`${styles.bubbleContent} ${styles.bubbleContentBot} ${styles.typingBubble}`}>
                            <span className={styles.dot} />
                            <span className={styles.dot} />
                            <span className={styles.dot} />
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* ── Offer Buttons ── */}
            {showOffers && !isTyping && displayMessages.length > 0 && (
                <OfferButtons onSelect={handleOfferSelect} disabled={isTyping} />
            )}

            {/* ── Input Area ── */}
            <div className={styles.inputArea}>
                <textarea
                    ref={inputRef}
                    className={styles.input}
                    placeholder="Nhắn tin để được hỗ trợ..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isTyping}
                    rows={1}
                />
                <button
                    className={styles.sendBtn}
                    onClick={() => void handleSend()}
                    disabled={!input.trim() || isTyping}
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
    const { isBotOpen, totalUnread } = useSelector(
        (state: { chat: { isBotOpen: boolean; totalUnread: number } }) => state.chat
    );

    return (
        <div className={styles.widget}>
            {isBotOpen && (
                <div className={styles.chatBoxWrapper}>
                    <BotChatBox />
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
