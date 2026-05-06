'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import { openBot, closeBot, setActiveBotConversation, addMessage } from '../../store/slices/chatSlice';
import chatApi from '../../api/chatApi';
import { useChatWebSocket } from '../../hooks/useChatWebSocket';
import MessageBubble from './shared/MessageBubble';
import styles from './BotChatWidget.module.css';

/* eslint-disable @typescript-eslint/no-explicit-any */
const useAppSelector: TypedUseSelectorHook<any> = useSelector;
/* eslint-enable */

const GREETING = `👋 Xin chào! Mình là **Tourista Travel Buddy** — trợ lý du lịch AI của bạn.\n\nMình có thể giúp bạn:\n- 🔍 **Tra cứu booking** — gửi mã TRS-YYYYMMDD-XXXXXX\n- 🗺️ **Gợi ý tour** phù hợp ngân sách & số người\n- 💳 **Hướng dẫn thanh toán** VNPay, chuyển khoản\n- 📋 **Chính sách hủy/đổi** lịch\n- 📞 **Kết nối hỗ trợ** Tourista\n\nBạn cần hỗ trợ gì hôm nay? 😊`;

/* ───────────────────────── Offer Buttons ───────────────────────── */
const OFFERS = [
    { id: 'hot_tour', emoji: '🔥', label: 'Tour Hot', hint: 'Xem các tour hot nhất' },
    { id: 'cancel', emoji: '❌', label: 'Hủy/Hoàn tiền', hint: 'Chính sách hủy và hoàn tiền' },
    { id: 'payment', emoji: '💳', label: 'Thanh toán', hint: 'Hướng dẫn thanh toán' },
    { id: 'contact', emoji: '📞', label: 'Liên hệ hỗ trợ', hint: 'Thông tin liên hệ hỗ trợ' },
    { id: 'visa', emoji: '🛂', label: 'Visa & Giấy tờ', hint: 'Thủ tục Visa, hộ chiếu' },
    { id: 'insurance', emoji: '🔄', label: 'Đổi/Trả/Hoàn', hint: 'Chính sách đổi trả hoàn tiền' },
];

const QUESTION_MAP = {
    hot_tour: 'Cho mình xem các tour hot nhất hiện nay',
    cancel: 'Chính sách hủy tour và hoàn tiền như thế nào?',
    payment: 'Tourista Studio có những hình thức thanh toán nào? Hướng dẫn thanh toán VNPay giúp mình.',
    contact: 'Cho mình thông tin liên hệ hỗ trợ của Tourista Studio',
    visa: 'Cho mình hỏi về thủ tục Visa và giấy tờ cần thiết khi đi du lịch nước ngoài',
    insurance: 'Chính sách đổi, trả và hoàn tiền trên Tourista Studio như thế nào?',
};

/* ───────────────────────── Bot Chat Box ───────────────────────── */
const BotChatBox = () => {
    const dispatch = useDispatch();
    const { sendMessage } = useChatWebSocket();
    const { user } = useAppSelector(state => state.auth);
    const { messages: wsMessages, activeBotConversationId } = useAppSelector(state => state.chat);

    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const [showOffers, setShowOffers] = useState(true);

    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Merge greeting + WebSocket messages
    const displayMessages = React.useMemo(() => {
        if (!conversationId) return [];
        const wsList = wsMessages[conversationId] || [];

        if (wsList.length === 0) {
            return [{
                id: 0,
                senderId: 0,
                contentType: 'TEXT',
                content: GREETING,
                createdAt: new Date().toISOString(),
            }];
        }

        return wsList.filter(msg => msg.contentType !== 'TYPING');
    }, [conversationId, wsMessages]);

    // Detect typing indicator
    useEffect(() => {
        if (!conversationId) return;
        const msgs = wsMessages[conversationId] || [];
        const lastMsg = msgs[msgs.length - 1];
        setIsTyping(lastMsg?.contentType === 'TYPING');
    }, [wsMessages, conversationId]);

    // Initialize BOT conversation via REST, then subscribe to WebSocket
    useEffect(() => {
        if (!user) return;

        const init = async () => {
            try {
                const res = await chatApi.createConversation({ type: 'BOT' });
                const conv = res?.data?.data ?? res?.data;
                if (conv?.id) {
                    setConversationId(conv.id);
                    dispatch(setActiveBotConversation(conv.id));

                    const histRes = await chatApi.getMessages(conv.id);
                    const hist = histRes?.data?.content ?? [];
                    hist.forEach(msg => dispatch(addMessage({ ...msg, conversationId: conv.id })));
                }
            } catch (err) {
                console.error('[Bot] Failed to init conversation:', err);
            }
        };

        void init();
    }, [user, dispatch]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [displayMessages]);

    const sendText = useCallback(async (text) => {
        if (!conversationId || !text.trim()) return;

        // Gửi luôn — sendMessage tự kiểm tra WebSocket
        const sent = sendMessage(conversationId, text.trim());
        if (!sent) {
            console.warn('[Bot] Failed to send via WebSocket');
        }
        setIsTyping(true);
        setShowOffers(false);
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [conversationId, sendMessage]);

    const handleOfferSelect = useCallback((offerId) => {
        void sendText(QUESTION_MAP[offerId] || '');
    }, [sendText]);

    const handleSend = useCallback(() => {
        const text = input.trim();
        if (!text) return;
        void sendText(text);
    }, [input, sendText]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

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
                        showDateLabel={null}
                        onFaqSelect={handleOfferSelect}
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
                <div className={styles.offersSection}>
                    <div className={styles.offersHeader}>⚡ Bạn cần tìm hiểu điều gì?</div>
                    <div className={styles.offersGrid}>
                        {OFFERS.map((offer) => (
                            <button
                                key={offer.id}
                                className={styles.offerBtn}
                                onClick={() => handleOfferSelect(offer.id)}
                                title={offer.hint}
                            >
                                <span className={styles.offerEmoji}>{offer.emoji}</span>
                                <span className={styles.offerLabel}>{offer.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
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
    const { isBotOpen, totalUnread } = useAppSelector(state => state.chat);

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
