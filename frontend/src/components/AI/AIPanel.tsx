'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { FaPaperPlane, FaRobot, FaUser, FaTimes, FaMicrophone, FaImage } from 'react-icons/fa';
import { MdSend, MdSmartToy } from 'react-icons/md';
import styles from './AIPanel.module.css';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AppSelectorType = <T>(selector: (state: any) => T) => T;
const useAppSelector: AppSelectorType = useSelector as any;
/* eslint-enable */

interface Message {
    id?: string | number;
    sender?: string;
    content: string;
    type?: 'USER' | 'BOT' | 'SYSTEM';
    timestamp?: string;
}

const WELCOME_MESSAGE = {
    id: 'welcome',
    sender: 'bot',
    type: 'BOT' as const,
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
    embedded?: boolean;
}

export default function AIPanel({ isOpen = true, onClose, embedded = true }: AIPanelProps) {
    const { user } = useAppSelector(state => state.auth);
    const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const stompClientRef = useRef<any>(null);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Connect to WebSocket
    useEffect(() => {
        if (!user?.email) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';
        
        const connectStomp = () => {
            try {
                // Simple STOMP-like implementation using native WebSocket
                const socket = new WebSocket(wsUrl);
                socketRef.current = socket;

                socket.onopen = () => {
                    console.log('WebSocket connected');
                    setIsConnected(true);
                    
                    // Send CONNECT frame (simplified)
                    socket.send(JSON.stringify({
                        type: 'CONNECT',
                        headers: {
                            'login': user.email,
                            'passcode': '',
                        }
                    }));

                    // Create or get conversation
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/chat/conversations`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'BOT' }),
                        credentials: 'include',
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data?.data?.id) {
                            setConversationId(data.data.id);
                        }
                    })
                    .catch(err => console.log('Conversation error:', err));
                };

                socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'MESSAGE' || data.contentType === 'MESSAGE') {
                            setMessages(prev => [...prev, {
                                id: data.id,
                                sender: data.senderRole === 'BOT' ? 'bot' : 'user',
                                type: data.senderRole === 'BOT' ? 'BOT' : 'USER',
                                content: data.content,
                                timestamp: data.createdAt,
                            }]);
                            setIsTyping(false);
                        }
                    } catch {
                        // Ignore parse errors
                    }
                };

                socket.onclose = () => {
                    console.log('WebSocket disconnected');
                    setIsConnected(false);
                };

                socket.onerror = (error) => {
                    console.log('WebSocket error:', error);
                };

            } catch (error) {
                console.log('STOMP connection error:', error);
            }
        };

        connectStomp();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [user?.email]);

    // Send message
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || !conversationId) return;

        const userMessage: Message = {
            id: Date.now(),
            sender: 'user',
            type: 'USER',
            content: text.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    content: text.trim(),
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to send');
            }
        } catch (error) {
            console.error('Send error:', error);
            // Add error message
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    sender: 'bot',
                    type: 'BOT',
                    content: 'Xin lỗi, mình không thể trả lời lúc này. Bạn thử lại sau nhé!',
                    timestamp: new Date().toISOString(),
                }]);
                setIsTyping(false);
            }, 1000);
        }
    }, [conversationId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleQuickAction = (prompt: string) => {
        sendMessage(prompt);
    };

    const formatTime = (timestamp?: string) => {
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = (msg: Message, index: number) => {
        const isBot = msg.type === 'BOT' || msg.sender === 'bot';
        
        return (
            <div key={msg.id || index} className={`${styles.message} ${isBot ? styles.botMessage : styles.userMessage}`}>
                <div className={styles.messageAvatar}>
                    {isBot ? <MdSmartToy /> : <FaUser />}
                </div>
                <div className={styles.messageBubble}>
                    <div className={styles.messageContent}>
                        {msg.content.split('\n').map((line, i) => (
                            <span key={i}>
                                {line.startsWith('**') && line.endsWith('**') ? (
                                    <strong>{line.replace(/\*\*/g, '')}</strong>
                                ) : line.startsWith('• ') ? (
                                    <span>• {line.substring(2)}</span>
                                ) : (
                                    line
                                )}
                                {i < msg.content.split('\n').length - 1 && <br />}
                            </span>
                        ))}
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
        <div className={`${styles.panel} ${embedded ? styles.embedded : styles.floating}`}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.avatar}>
                        <MdSmartToy />
                    </div>
                    <div className={styles.headerInfo}>
                        <span className={styles.headerTitle}>AI Assistant</span>
                        <span className={styles.headerStatus}>
                            <span className={`${styles.statusDot} ${isConnected ? styles.online : styles.offline}`} />
                            {isConnected ? 'Đang kết nối' : 'Offline'}
                        </span>
                    </div>
                </div>
                {onClose && (
                    <button className={styles.closeBtn} onClick={onClose}>
                        <FaTimes />
                    </button>
                )}
            </div>

            {/* Messages */}
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
            {!messages.length && (
                <div className={styles.quickActions}>
                    {QUICK_ACTIONS.map((action, idx) => (
                        <button
                            key={idx}
                            className={styles.quickActionBtn}
                            onClick={() => handleQuickAction(action.prompt)}
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
                    placeholder="Nhắn tin cho AI Assistant..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={!conversationId}
                />
                <button 
                    type="submit" 
                    className={styles.sendBtn}
                    disabled={!input.trim() || !conversationId}
                >
                    <MdSend />
                </button>
            </form>
        </div>
    );
}
