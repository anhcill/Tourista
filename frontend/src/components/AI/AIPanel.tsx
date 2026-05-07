'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaUser, FaTimes, FaComments, FaSpinner } from 'react-icons/fa';
import { MdSmartToy, MdSend } from 'react-icons/md';
import styles from './AIPanel.module.css';
import chatApi from '@/api/chatApi';

interface Message {
    id?: string | number;
    sender?: 'user' | 'bot';
    content: string;
    timestamp?: string;
}

const WELCOME_BOT = {
    id: 'welcome',
    sender: 'bot' as const,
    content: `🌟 Chào bạn! Mình là AI Assistant của Tourista Studio!

Mình có thể giúp bạn:

🗺️ **Gợi ý Tour** - Nói địa điểm + ngân sách + số người
🏨 **Tìm Khách sạn** - Nói địa điểm + ngân sách
🔍 **Tra cứu Booking** - Gửi mã TRS-YYYYMMDD-XXXXXX
❓ **Hỏi đáp** - Chính sách, thanh toán, liên hệ

Ví dụ: "Tìm tour Đà Nẵng 5 triệu cho 2 người"

Bạn cần gì nào?`,
    timestamp: new Date().toISOString(),
};

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
    const [messages, setMessages] = useState<Message[]>([WELCOME_BOT]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Send message via REST API
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now(),
            sender: 'user',
            content: text.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Call chatbot API - returns AI response
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text.trim() }),
            });

            const data = await response.json();
            
            const botMsg: Message = {
                id: Date.now() + 1,
                sender: 'bot',
                content: data?.data?.content || data?.message || 
                    'Xin lỗi, mình chưa hiểu ý bạn. Bạn thử hỏi cụ thể hơn nhé!',
                timestamp: new Date().toISOString(),
            };
            
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Send error:', error);
            
            // Fallback responses for demo
            const lowerText = text.toLowerCase();
            let response = 'Mình đã ghi nhận câu hỏi của bạn! Bạn có thể liên hệ hotline 1900 1234 để được hỗ trợ nhanh hơn nhé!';
            
            if (lowerText.includes('tour') || lowerText.includes('đi')) {
                response = '🎯 Bạn muốn tìm tour? Hãy vào trang **Tours** và chọn điểm đến yêu thích nhé! Hoặc mình gợi ý: Đà Nẵng, Phú Quốc, Nha Trang...';
            } else if (lowerText.includes('khách sạn') || lowerText.includes('hotel')) {
                response = '🏨 Mình giới thiệu bạn vào trang **Khách sạn** để tìm nơi lưu trú phù hợp nhé!';
            } else if (lowerText.includes('TRS') || lowerText.includes('booking')) {
                response = '🔍 Để tra cứu booking, bạn cần đăng nhập và vào **Tài khoản > Lịch sử Booking** nhé!';
            } else if (lowerText.includes('hủ') || lowerText.includes('hoàn')) {
                response = '❌ **Chính sách hủy tour:**\n• Hủy trước 7 ngày → hoàn 80%\n• Hủy 3-7 ngày → hoàn 50%\n• Dưới 3 ngày → không hoàn';
            } else if (lowerText.includes('thanh toán')) {
                response = '💳 Tourista hỗ trợ thanh toán qua:\n• **VNPay** - thẻ ATM/Visa\n• **Chuyển khoản** ngân hàng\n• **MoMo**, **ZaloPay**';
            } else if (lowerText.includes('chào') || lowerText.includes('hello') || lowerText.includes('hi')) {
                response = '👋 Xin chào! Rất vui được hỗ trợ bạn! Bạn cần tìm gì hôm nay?';
            }

            const botMsg: Message = {
                id: Date.now() + 1,
                sender: 'bot',
                content: response,
                timestamp: new Date().toISOString(),
            };
            
            setMessages(prev => [...prev, botMsg]);
        } finally {
            setIsTyping(false);
        }
    }, []);

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
        
        // Simple markdown-like parsing
        const parseContent = (text: string) => {
            return text.split('\n').map((line, i) => {
                const formatted = line
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/`(.*?)`/g, '<code>$1</code>');
                return (
                    <span key={i}>
                        <span dangerouslySetInnerHTML={{ __html: formatted }} />
                        {i < text.split('\n').length - 1 && <br />}
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
                                <FaTimes />
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
