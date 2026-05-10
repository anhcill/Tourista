'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaUser } from 'react-icons/fa';
import { MdSmartToy, MdSend } from 'react-icons/md';
import styles from './AIPanel.module.css';
import axiosClient from '@/api/axiosClient';

interface Message {
    id?: string | number;
    sender?: 'user' | 'bot';
    content: string;
    timestamp?: string;
}

const WELCOME_BOT_CONTENT = `🌟 Chào bạn! Mình là AI Assistant của Tourista Studio!

Mình có thể giúp bạn:

🗺️ **Gợi ý Tour** - Nói địa điểm + ngân sách + số người
🏨 **Tìm Khách sạn** - Nói địa điểm + ngân sách
🔍 **Tra cứu Booking** - Gửi mã TRS-YYYYMMDD-XXXXXX
❓ **Hỏi đáp** - Chính sách, thanh toán, liên hệ

Ví dụ: "Tìm tour Đà Nẵng 5 triệu cho 2 người"

Bạn cần gì nào?`;

const QUICK_ACTIONS = [
    { label: 'Tìm tour', icon: '🗺️', prompt: 'Tìm tour du lịch Đà Nẵng 5 triệu cho 2 người' },
    { label: 'Tìm khách sạn', icon: '🏨', prompt: 'Tìm khách sạn Đà Nẵng ngân sách 2 triệu' },
    { label: 'Tra cứu booking', icon: '🔍', prompt: 'Tra cứu booking của tôi' },
    { label: 'Chính sách hủy', icon: '❌', prompt: 'Chính sách hủy tour như thế nào?' },
];

interface AIPanelProps {
    isOpen?: boolean;
    onClose?: () => void;
    compact?: boolean;
}

export default function AIPanel({ isOpen = true, onClose, compact = false }: AIPanelProps) {
    const [messages, setMessages] = useState<Message[]>(() => [{
        id: 'welcome',
        sender: 'bot' as const,
        content: WELCOME_BOT_CONTENT,
        timestamp: new Date().toISOString(),
    }]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const msgIdRef = useRef(0);
    const nextMsgId = useCallback(() => `msg_${Date.now()}_${++msgIdRef.current}`, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Send message via REST API - kết nối với backend AI chatbot
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: nextMsgId(),
            sender: 'user',
            content: text.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Gọi API qua axiosClient (auto token refresh khi 401)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data: any = await axiosClient.post('/chat/message', {
                message: text.trim(),
                conversationId: conversationId,
            });

            // axiosClient interceptor đã unwrap response.data
            // Backend trả về: { success: true, data: ChatMessageResponse }
            let botContent = '';

            if (data?.success && data?.data) {
                botContent = data.data.content || '';
                // Lưu conversationId nếu có (dùng cho lần gửi tiếp theo)
                if (data.data.conversationId && !conversationId) {
                    setConversationId(data.data.conversationId);
                }
            } else if ((data as any)?.message) {
                botContent = (data as any).message;
            }

            if (!botContent || botContent.trim() === '') {
                botContent = 'Xin lỗi, mình chưa hiểu ý bạn. Bạn thử hỏi cụ thể hơn nhé!';
            }

            const botMsg: Message = {
                id: nextMsgId(),
                sender: 'bot',
                content: botContent,
                timestamp: new Date().toISOString(),
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Send error:', error);

            // Fallback response khi API lỗi
            const lowerText = text.toLowerCase();
            let fallback = 'Mình đã ghi nhận câu hỏi của bạn! Liên hệ hotline 1900 1234 để được hỗ trợ nhanh hơn nhé!';

            if (lowerText.includes('tour') || lowerText.includes('đi')) {
                fallback = '🎯 Hãy vào trang **Tours** và chọn điểm đến yêu thích nhé!';
            } else if (lowerText.includes('khách sạn') || lowerText.includes('hotel')) {
                fallback = '🏨 Vào trang **Khách sạn** để tìm nơi lưu trú phù hợp nhé!';
            } else if (lowerText.includes('TRS') || lowerText.includes('booking')) {
                fallback = '🔍 Đăng nhập và vào **Tài khoản > Lịch sử Booking** để tra cứu nhé!';
            } else if (lowerText.includes('hủ') || lowerText.includes('hoàn')) {
                fallback = '❌ **Chính sách hủy tour:**\n• Hủy trước 7 ngày → hoàn 80%\n• Hủy 3-7 ngày → hoàn 50%\n• Dưới 3 ngày → không hoàn';
            } else if (lowerText.includes('thanh toán')) {
                fallback = '💳 Tourista hỗ trợ thanh toán qua:\n• **VNPay** - thẻ ATM/Visa\n• **Chuyển khoản** ngân hàng\n• **MoMo**, **ZaloPay**';
            } else if (lowerText.includes('chào') || lowerText.includes('hello') || lowerText.includes('hi')) {
                fallback = '👋 Xin chào! Rất vui được hỗ trợ bạn! Bạn cần tìm gì hôm nay?';
            }

            const botMsg: Message = {
                id: nextMsgId(),
                sender: 'bot',
                content: fallback,
                timestamp: new Date().toISOString(),
            };

            setMessages(prev => [...prev, botMsg]);
        } finally {
            setIsTyping(false);
        }
    }, [conversationId, nextMsgId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            sendMessage(input);
        }
    };

    const formatTime = (timestamp?: string) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = (msg: Message, index: number) => {
        const isBot = msg.sender === 'bot';
        
        // Safe markdown-like parsing (no dangerouslySetInnerHTML — prevents XSS)
        const parseContent = (text: string) => {
            const lines = text.split('\n');
            return lines.map((line, i) => {
                const parts: React.ReactNode[] = [];
                const regex = /(\*\*.*?\*\*|`.*?`)/g;
                let lastIndex = 0;
                let match;
                let partKey = 0;
                while ((match = regex.exec(line)) !== null) {
                    if (match.index > lastIndex) {
                        parts.push(<span key={partKey++}>{line.slice(lastIndex, match.index)}</span>);
                    }
                    const m = match[0];
                    if (m.startsWith('**') && m.endsWith('**') && m.length > 4) {
                        parts.push(<strong key={partKey++}>{m.slice(2, -2)}</strong>);
                    } else if (m.startsWith('`') && m.endsWith('`') && m.length > 2) {
                        parts.push(<code key={partKey++}>{m.slice(1, -1)}</code>);
                    }
                    lastIndex = regex.lastIndex;
                }
                if (lastIndex < line.length) {
                    parts.push(<span key={partKey++}>{line.slice(lastIndex)}</span>);
                }
                return (
                    <span key={i}>
                        {parts.length > 0 ? parts : line}
                        {i < lines.length - 1 && <br />}
                    </span>
                );
            });
        };
        
        return (
            <div key={msg.id || index} className={`${styles.message} ${isBot ? styles.botMessage : styles.userMessage}`}>
                <div className={styles.messageAvatar}>
                    {isBot ? <MdSmartToy /> : <FaUser />}
                </div>
                <div className={styles.messageBubble}>
                    <div className={styles.messageContent}>
                        {parseContent(msg.content)}
                    </div>
                    {msg.timestamp && (
                        <div className={styles.messageTime}>{formatTime(msg.timestamp)}</div>
                    )}
                </div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className={styles.widget}>
            {/* Chat Panel */}
            <div className={`${styles.chatBox} ${isMinimized ? styles.minimized : ''}`}>
                {/* Header */}
                <div className={styles.header}>
                    <img
                        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"
                        alt="Travel banner"
                        className={styles.headerBg}
                    />
                    <div className={styles.headerOverlay} />
                    <div className={styles.headerLeft}>
                        <div className={styles.avatar}>
                            <MdSmartToy />
                        </div>
                        <div className={styles.headerInfo}>
                            <span className={styles.headerTitle}>AI Assistant</span>
                            <span className={styles.headerStatus}>
                                <span className={`${styles.statusDot} ${styles.online}`} />
                                Đang trực tuyến
                            </span>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <button 
                            className={styles.minimizeBtn} 
                            onClick={() => setIsMinimized(!isMinimized)}
                            title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
                        >
                            {isMinimized ? '□' : '−'}
                        </button>
                        {onClose && (
                            <button className={styles.closeBtn} onClick={onClose}>
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages */}
                {!isMinimized && (
                    <>
                        <div className={styles.messages}>
                            {messages.map(renderMessage)}
                            
                            {isTyping && (
                                <div className={`${styles.message} ${styles.botMessage}`}>
                                    <div className={styles.messageAvatar}>
                                        <MdSmartToy />
                                    </div>
                                    <div className={styles.typingIndicator}>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        {messages.length === 1 && (
                            <div className={styles.quickActions}>
                                {QUICK_ACTIONS.map((action, idx) => (
                                    <button
                                        key={idx}
                                        className={styles.quickActionBtn}
                                        onClick={() => sendMessage(action.prompt)}
                                    >
                                        <span>{action.icon}</span>
                                        <span>{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <form className={styles.inputArea} onSubmit={handleSubmit}>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Nhắn tin cho AI..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button 
                                type="submit" 
                                className={styles.sendBtn}
                                disabled={!input.trim()}
                            >
                                <MdSend />
                            </button>
                        </form>
                    </>
                )}
            </div>

            {/* FAB Button (when minimized or hidden) */}
            {!isMinimized && (
                <button 
                    className={styles.fabBadge}
                    onClick={() => setIsMinimized(true)}
                    title="Thu nhỏ chat"
                >
                    <span className={styles.fabBadgeDot} />
                </button>
            )}
        </div>
    );
}
