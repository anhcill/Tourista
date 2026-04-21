'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openBot, closeBot } from '../../store/slices/chatSlice';
import faqApi from '../../api/faqApi';
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
                        <p
                            key={i}
                            dangerouslySetInnerHTML={{
                                __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                            }}
                        />
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
    const { user } = useSelector(
        (state: { auth: { isAuthenticated: boolean; user?: { id?: number; fullName?: string } } }) => state.auth
    );

    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [showOffers, setShowOffers] = useState(true);

    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: 1,
                    senderId: 0 as number,
                    contentType: 'TEXT' as ContentType,
                    content: `Xin chào${user?.fullName ? ` ${user.fullName.split(' ')[0]}` : ''}! Mình là **Tourista Travel Buddy** — trợ lý du lịch của bạn.\n\nMình có thể giúp bạn giải đáp nhanh: chính sách hủy, thanh toán, lịch trình tour, visa, bảo hiểm và nhiều hơn nữa.\n\n**Chọn một chủ đề bên dưới** hoặc **nhắn tin trực tiếp** để mình hỗ trợ nhé! 👇`,
                    createdAt: new Date().toISOString(),
                },
            ]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const sendAnswer = async (question: string) => {
        if (isTyping) return;

        const userMsg: ChatMessage = {
            id: Date.now(),
            senderId: user?.id ?? null,
            contentType: 'TEXT' as ContentType,
            content: question,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMsg]);
        setShowOffers(false);
        setIsTyping(true);

        try {
            const res = await faqApi.askQuestion(question, 'GENERAL') as any;
            const data = res?.data?.data ?? res?.data ?? res;
            const answer = typeof data === 'string' ? data : (data?.answer || '');

            const botMsg: ChatMessage = {
                id: Date.now() + 1,
                senderId: 0 as number,
                contentType: 'TEXT' as ContentType,
                content: answer || 'Xin lỗi, mình chưa tìm được câu trả lời phù hợp cho bạn. Bạn thử hỏi cách khác nhé!',
                createdAt: new Date().toISOString(),
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('[Bot] FAQ Error:', error);
            const errorMsg: ChatMessage = {
                id: Date.now() + 1,
                senderId: 0 as number,
                contentType: 'TEXT' as ContentType,
                content: 'Xin lỗi, hiện tại hệ thống đang bận. Bạn vui lòng thử lại sau ít phút nhé!',
                createdAt: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleOfferSelect = (offer: Offer) => {
        const questionMap: Record<string, string> = {
            hot_tour: 'Cho mình xem các tour hot nhất hiện nay',
            cancel: 'Chính sách hủy tour và hoàn tiền như thế nào?',
            payment: 'Tourista Studio có những hình thức thanh toán nào? Hướng dẫn thanh toán VNPay giúp mình.',
            contact: 'Cho mình thông tin liên hệ hỗ trợ của Tourista Studio',
            visa: 'Cho mình hỏi về thủ tục Visa và giấy tờ cần thiết khi đi du lịch nước ngoài',
            insurance: 'Chính sách đổi, trả và hoàn tiền trên Tourista Studio như thế nào?',
        };
        void sendAnswer(questionMap[offer.id] || offer.label);
    };

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;
        setInput(text);
        setShowOffers(false);
        // Set input as text, then send
        const finalText = text;
        setInput('');
        void sendAnswer(finalText);
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
                            Chọn Offer để được hỗ trợ nhanh
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
                {messages.map((msg, idx) => (
                    <MessageBubble
                        key={msg.id ?? idx}
                        msg={msg}
                        isOwn={msg.senderId !== 0}
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
            {showOffers && !isTyping && (
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
