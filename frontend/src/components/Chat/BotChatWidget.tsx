'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeBot, openBot } from '../../store/slices/chatSlice';
import chatApi from '../../api/chatApi';
import axiosClient from '../../api/axiosClient';
import BookingItineraryCard from './BookingItineraryCard/BookingItineraryCard';
import TourResultCard from './TourResultCard/TourResultCard';
import styles from './BotChatWidget.module.css';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AppSelectorType = <T>(selector: (state: any) => T) => T;
const useAppSelector: AppSelectorType = useSelector as any;
/* eslint-enable */

/* ──────────── Service definitions ──────────── */
const SERVICES = [
    { id: 'hot_tour',   emoji: '🔥', label: 'Tour Hot',          color: '#ef4444', bg: '#fef2f2' },
    { id: 'lookup',     emoji: '🔍', label: 'Tra cứu Booking',   color: '#0ea5e9', bg: '#f0f9ff' },
    { id: 'payment',    emoji: '💳', label: 'Thanh toán',         color: '#f59e0b', bg: '#fffbeb' },
    { id: 'cancel',     emoji: '❌', label: 'Hủy/Hoàn tiền',     color: '#8b5cf6', bg: '#f5f3ff' },
    { id: 'contact',    emoji: '📞', label: 'Liên hệ hỗ trợ',   color: '#10b981', bg: '#ecfdf5' },
    { id: 'faq',        emoji: '❓', label: 'Câu hỏi thường gặp', color: '#64748b', bg: '#f8fafc' },
    { id: 'ai_chat',    emoji: '🤖', label: 'Chat với AI',        color: '#667eea', bg: '#eef2ff' },
];

const FAQ_ITEMS = [
    { q: 'Làm sao đặt tour trên Tourista?', a: 'Chọn tour → Chọn ngày & số người → Điền thông tin → Thanh toán qua VNPay hoặc chuyển khoản. Sau khi thanh toán thành công, bạn sẽ nhận mã booking qua email.' },
    { q: 'Tôi có thể hủy tour không?', a: 'Bạn có thể hủy tour theo chính sách: Hủy trước 7 ngày → hoàn 80%, 3-7 ngày → hoàn 50%, dưới 3 ngày → không hoàn. Chi tiết tại mục "Hủy/Hoàn tiền" trên website.' },
    { q: 'Thanh toán bằng cách nào?', a: 'Tourista hỗ trợ: 💳 Thẻ ATM/Visa qua VNPay, 🏦 Chuyển khoản ngân hàng (thông tin trong email xác nhận). Thanh toán an toàn qua cổng VNPay được mã hóa.' },
    { q: 'Mã booking là gì?', a: 'Mã booking (format: TRS-YYYYMMDD-XXXXXX) là mã đặt chỗ duy nhất của bạn, được gửi qua email sau khi đặt thành công. Dùng mã này để tra cứu hoặc liên hệ hỗ trợ.' },
    { q: 'Booking có thể đổi ngày không?', a: 'Có thể đổi ngày nếu còn chỗ và thông báo trước tối thiểu 5 ngày. Liên hệ hotline hoặc chat với đối tác trực tiếp để được hỗ trợ đổi lịch.' },
];

/* ──────────── Status helpers ──────────── */
type ViewId = 'home' | 'hot_tour' | 'lookup' | 'payment' | 'cancel' | 'contact' | 'faq' | 'ai_chat';

interface BookingResult {
    bookingCode: string;
    bookingType: 'TOUR' | 'HOTEL';
    status: string;
    totalAmount: number;
    [key: string]: unknown;
}

/* ──────────── Tour Card from API ──────────── */
interface TourCard {
    id: number;
    title: string;
    slug?: string;
    cityVi: string;
    durationDays: number;
    durationNights: number;
    pricePerAdult: number;
    avgRating?: number;
    reviewCount?: number;
    imageUrl?: string | null;
}

/* ──────────── Home Panel ──────────── */
const HomePanel = ({ onSelect }: { onSelect: (id: string) => void }) => (
    <div className={styles.homePanel}>
        <div className={styles.homeGreeting}>
            <div className={styles.homeBotIcon}>🌴</div>
            <div>
                <div className={styles.homeGreetingTitle}>Tourista Travel Buddy</div>
                <div className={styles.homeGreetingSub}>Chọn dịch vụ bạn cần hỗ trợ</div>
            </div>
        </div>
        <div className={styles.serviceGrid}>
            {SERVICES.map(s => (
                <button
                    key={s.id}
                    className={styles.serviceBtn}
                    style={{ '--svc-color': s.color, '--svc-bg': s.bg } as React.CSSProperties}
                    onClick={() => onSelect(s.id)}
                >
                    <span className={styles.serviceEmoji}>{s.emoji}</span>
                    <span className={styles.serviceLabel}>{s.label}</span>
                </button>
            ))}
        </div>
    </div>
);

/* ──────────── Hot Tours View ──────────── */
const HotToursView = ({ onBack }: { onBack: () => void }) => {
    const [tours, setTours] = useState<TourCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        chatApi.getHotTours()
            .then(r => {
                const data = r?.data?.data ?? [];
                setTours(Array.isArray(data) ? data : []);
            })
            .catch(() => setError('Không tải được tour. Thử lại sau.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className={styles.contentView}>
            <div className={styles.viewHeader}>
                <button className={styles.backBtn} onClick={onBack}>←</button>
                <span className={styles.viewTitle}>🔥 Tour Hot</span>
            </div>
            <div className={styles.viewBody}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner} />
                        <span>Đang tải tour hot...</span>
                    </div>
                ) : error ? (
                    <div className={styles.errorState}>{error}</div>
                ) : tours.length === 0 ? (
                    <div className={styles.emptyState}>Chưa có tour hot lúc này.</div>
                ) : (
                    <div className={styles.tourList}>
                        {tours.map(t => (
                            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                            <TourResultCard key={t.id} metadata={JSON.stringify([t]) as any} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/* ──────────── Booking Lookup View ──────────── */
const BookingLookupView = ({ onBack }: { onBack: () => void }) => {
    const { user } = useAppSelector(state => state.auth);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<BookingResult | null>(null);
    const [error, setError] = useState('');

    const handleLookup = useCallback(async () => {
        if (!code.trim()) return;
        if (!user) {
            setError('Vui lòng đăng nhập để tra cứu booking.');
            return;
        }
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const res = await chatApi.lookupBooking(code.trim());
            if (res?.data?.success && res?.data?.data) {
                setResult(res.data.data);
            } else {
                setError(res?.data?.message || 'Không tìm thấy booking.');
            }
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            setError(e?.response?.data?.message || 'Tra cứu thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [code, user]);

    return (
        <div className={styles.contentView}>
            <div className={styles.viewHeader}>
                <button className={styles.backBtn} onClick={onBack}>←</button>
                <span className={styles.viewTitle}>🔍 Tra cứu Booking</span>
            </div>
            <div className={styles.viewBody}>
                <div className={styles.lookupIntro}>
                    Nhập mã booking của bạn (format: <code>TRS-YYYYMMDD-XXXXXX</code>)
                </div>
                <div className={styles.lookupForm}>
                    <input
                        className={styles.lookupInput}
                        type="text"
                        placeholder="Ví dụ: TRS-20260325-934D6D"
                        value={code}
                        onChange={e => setCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && void handleLookup()}
                        disabled={loading}
                    />
                    <button
                        className={styles.lookupBtn}
                        onClick={() => void handleLookup()}
                        disabled={loading || !code.trim()}
                    >
                        {loading ? '...' : 'Tra cứu'}
                    </button>
                </div>

                {loading && (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner} />
                        <span>Đang tra cứu...</span>
                    </div>
                )}

                {error && (
                    <div className={styles.errorState}>{error}</div>
                )}

                {result && (
                    <div className={styles.bookingResult}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <BookingItineraryCard metadata={result as any} />
                    </div>
                )}
            </div>
        </div>
    );
};

/* ──────────── Payment Guide View ──────────── */
const PaymentGuideView = ({ onBack }: { onBack: () => void }) => (
    <div className={styles.contentView}>
        <div className={styles.viewHeader}>
            <button className={styles.backBtn} onClick={onBack}>←</button>
            <span className={styles.viewTitle}>💳 Thanh toán</span>
        </div>
        <div className={styles.viewBody}>
            <div className={styles.guideSection}>
                <h4 className={styles.guideTitle}>1. Thanh toán qua VNPay</h4>
                <p className={styles.guideText}>
                    Sau khi đặt tour, chọn <strong>VNPay</strong> để thanh toán bằng thẻ ATM/Visa/Mastercard.
                    Giao dịch được mã hóa bảo mật qua cổng VNPay.
                </p>
            </div>
            <div className={styles.guideSection}>
                <h4 className={styles.guideTitle}>2. Chuyển khoản ngân hàng</h4>
                <p className={styles.guideText}>
                    Chuyển khoản theo thông tin trong <strong>email xác nhận</strong> sau khi đặt.
                    Sử dụng <strong>mã booking</strong> làm nội dung chuyển khoản để hệ thống tự động xác nhận.
                </p>
            </div>
            <div className={styles.guideSection}>
                <h4 className={styles.guideTitle}>3. Xác nhận</h4>
                <p className={styles.guideText}>
                    Sau khi thanh toán thành công, bạn sẽ nhận email xác nhận kèm <strong>mã booking</strong> trong vòng 5-15 phút.
                    Dùng mã này để tra cứu hoặc liên hệ hỗ trợ.
                </p>
            </div>
        </div>
    </div>
);

/* ──────────── Cancel Policy View ──────────── */
const CancelPolicyView = ({ onBack }: { onBack: () => void }) => (
    <div className={styles.contentView}>
        <div className={styles.viewHeader}>
            <button className={styles.backBtn} onClick={onBack}>←</button>
            <span className={styles.viewTitle}>❌ Hủy & Hoàn tiền</span>
        </div>
        <div className={styles.viewBody}>
            <div className={styles.guideSection}>
                <h4 className={styles.guideTitle}>Chính sách hủy tour</h4>
                <div className={styles.policyGrid}>
                    <div className={styles.policyCard}>
                        <div className={styles.policyDays}>7+ ngày</div>
                        <div className={styles.policyRate}>Hoàn 80%</div>
                    </div>
                    <div className={styles.policyCard}>
                        <div className={styles.policyDays}>3–7 ngày</div>
                        <div className={styles.policyRate}>Hoàn 50%</div>
                    </div>
                    <div className={styles.policyCard}>
                        <div className={styles.policyDays}>Dưới 3 ngày</div>
                        <div className={styles.policyRate}>Không hoàn</div>
                    </div>
                </div>
            </div>
            <div className={styles.guideSection}>
                <h4 className={styles.guideTitle}>Cách hủy</h4>
                <p className={styles.guideText}>
                    Gửi yêu cầu hủy qua email <strong>hotro@tourista.vn</strong> kèm <strong>mã booking</strong>.
                    Hoặc liên hệ hotline <strong>1900 1234</strong> (8h–22h hàng ngày).
                </p>
            </div>
            <div className={styles.guideSection}>
                <h4 className={styles.guideTitle}>Lưu ý</h4>
                <p className={styles.guideText}>
                    Thời gian hoàn tiền: <strong>5–10 ngày làm việc</strong> sau khi xác nhận hủy thành công.
                    Phí hủy tính trên tổng giá trị booking ban đầu.
                </p>
            </div>
        </div>
    </div>
);

/* ──────────── Contact View ──────────── */
const ContactView = ({ onBack }: { onBack: () => void }) => (
    <div className={styles.contentView}>
        <div className={styles.viewHeader}>
            <button className={styles.backBtn} onClick={onBack}>←</button>
            <span className={styles.viewTitle}>📞 Liên hệ hỗ trợ</span>
        </div>
        <div className={styles.viewBody}>
            <div className={styles.guideSection}>
                <h4 className={styles.guideTitle}>Hotline</h4>
                <p className={styles.guideText}><strong>1900 1234</strong><br />8h00 – 22h00, 7 ngày/tuần</p>
            </div>
            <div className={styles.guideSection}>
                <h4 className={styles.guideTitle}>Email</h4>
                <p className={styles.guideText}><strong>hotro@tourista.vn</strong><br />Phản hồi trong 24h</p>
            </div>
            <div className={styles.guideSection}>
                <h4 className={styles.guideTitle}>Địa chỉ</h4>
                <p className={styles.guideText}>Tầng 12, Tòa nhà ABC Tower<br />123 Nguyễn Huệ, Quận 1<br />TP. Hồ Chí Minh</p>
            </div>
            <div className={styles.guideSection}>
                <h4 className={styles.guideTitle}>Mạng xã hội</h4>
                <p className={styles.guideText}>
                    📘 Facebook: <strong>@TouristaStudio</strong><br />
                    📸 Instagram: <strong>@tourista.vn</strong>
                </p>
            </div>
        </div>
    </div>
);

/* ──────────── FAQ View ──────────── */
const FaqView = ({ onBack }: { onBack: () => void }) => {
    const [openIdx, setOpenIdx] = useState<number | null>(0);

    return (
        <div className={styles.contentView}>
            <div className={styles.viewHeader}>
                <button className={styles.backBtn} onClick={onBack}>←</button>
                <span className={styles.viewTitle}>❓ Câu hỏi thường gặp</span>
            </div>
            <div className={styles.viewBody}>
                {FAQ_ITEMS.map((item, idx) => (
                    <div key={idx} className={styles.faqItem}>
                        <button
                            className={styles.faqQuestion}
                            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                        >
                            <span>{item.q}</span>
                            <span className={styles.faqChevron}>{openIdx === idx ? '▲' : '▼'}</span>
                        </button>
                        {openIdx === idx && (
                            <div className={styles.faqAnswer}>{item.a}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ──────────── AI Chat View ──────────── */
interface AiMessage {
    id: string;
    sender: 'user' | 'bot';
    content: string;
    timestamp: string;
}

const AI_WELCOME = `🌟 Chào bạn! Mình là AI Assistant của Tourista!

Mình có thể giúp bạn:
🗺️ **Gợi ý Tour** - Nói địa điểm + ngân sách + số người
🏨 **Tìm Khách sạn** - Nói địa điểm + ngân sách
🔍 **Tra cứu Booking** - Gửi mã TRS-YYYYMMDD-XXXXXX
❓ **Hỏi đáp** - Chính sách, thanh toán, liên hệ

Bạn cần gì nào?`;

const AI_QUICK_ACTIONS = [
    { label: 'Tìm tour', icon: '🗺️', prompt: 'Tìm tour du lịch Đà Nẵng 5 triệu cho 2 người' },
    { label: 'Tìm khách sạn', icon: '🏨', prompt: 'Tìm khách sạn Đà Nẵng ngân sách 2 triệu' },
    { label: 'Tra cứu booking', icon: '🔍', prompt: 'Tra cứu booking của tôi' },
    { label: 'Chính sách hủy', icon: '❌', prompt: 'Chính sách hủy tour như thế nào?' },
];

/** Safe markdown parser — renders **bold** and `code` via React elements (no XSS) */
const parseAiContent = (text: string): React.ReactNode[] => {
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
                parts.push(<code key={partKey++} style={{background:'rgba(0,0,0,0.08)',padding:'1px 4px',borderRadius:3,fontFamily:'monospace',fontSize:'0.85em'}}>{m.slice(1, -1)}</code>);
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

const AIChatView = ({ onBack }: { onBack: () => void }) => {
    const [messages, setMessages] = useState<AiMessage[]>(() => [{
        id: 'welcome',
        sender: 'bot',
        content: AI_WELCOME,
        timestamp: new Date().toISOString(),
    }]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const msgIdRef = useRef(0);
    const nextMsgId = useCallback(() => `msg_${Date.now()}_${++msgIdRef.current}`, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;
        const userMsg: AiMessage = {
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
                conversationId,
            });
            let botContent = '';
            if (data?.success && data?.data) {
                botContent = data.data.content || '';
                if (data.data.conversationId && !conversationId) {
                    setConversationId(data.data.conversationId);
                }
            } else if ((data as any)?.message) {
                botContent = (data as any).message;
            }
            if (!botContent || botContent.trim() === '') {
                botContent = 'Xin lỗi, mình chưa hiểu ý bạn. Bạn thử hỏi cụ thể hơn nhé!';
            }
            setMessages(prev => [...prev, {
                id: nextMsgId(), sender: 'bot', content: botContent, timestamp: new Date().toISOString(),
            }]);
        } catch {
            // Fallback response khi API lỗi
            const lower = text.toLowerCase();
            let fb = 'Mình đã ghi nhận câu hỏi của bạn! Liên hệ hotline 1900 1234 để được hỗ trợ nhanh hơn nhé!';
            if (lower.includes('tour') || lower.includes('đi')) fb = '🎯 Hãy vào trang **Tours** để chọn điểm đến yêu thích nhé!';
            else if (lower.includes('khách sạn') || lower.includes('hotel')) fb = '🏨 Vào trang **Khách sạn** để tìm nơi lưu trú phù hợp nhé!';
            else if (lower.includes('TRS') || lower.includes('booking')) fb = '🔍 Đăng nhập và vào **Tài khoản > Lịch sử Booking** để tra cứu nhé!';
            else if (lower.includes('chào') || lower.includes('hello') || lower.includes('hi')) fb = '👋 Xin chào! Rất vui được hỗ trợ bạn!';
            setMessages(prev => [...prev, {
                id: nextMsgId(), sender: 'bot', content: fb, timestamp: new Date().toISOString(),
            }]);
        } finally {
            setIsTyping(false);
        }
    }, [conversationId, nextMsgId]);

    const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={styles.contentView}>
            <div className={styles.viewHeader}>
                <button className={styles.backBtn} onClick={onBack}>←</button>
                <span className={styles.viewTitle}>🤖 Chat với AI</span>
            </div>
            <div className={styles.viewBody} style={{padding: 0, display:'flex', flexDirection:'column', flex:1, overflow:'hidden'}}>
                {/* Messages */}
                <div style={{flex:1, overflowY:'auto', padding:'12px', display:'flex', flexDirection:'column', gap:'8px'}}>
                    {messages.map(msg => {
                        const isBot = msg.sender === 'bot';
                        return (
                            <div key={msg.id} style={{display:'flex',gap:'6px',maxWidth:'88%',alignSelf: isBot ? 'flex-start' : 'flex-end', flexDirection: isBot ? 'row' : 'row-reverse'}}>
                                <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0,
                                    background: isBot ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#e2e8f0',
                                    color: isBot ? '#fff' : '#64748b'}}>
                                    {isBot ? '🤖' : '👤'}
                                </div>
                                <div style={{padding:'8px 12px',borderRadius:14,fontSize:'0.83rem',lineHeight:1.5,whiteSpace:'pre-wrap',wordBreak:'break-word',
                                    background: isBot ? '#fff' : 'linear-gradient(135deg,#667eea,#764ba2)',
                                    color: isBot ? '#1e293b' : '#fff',
                                    border: isBot ? '1px solid #e2e8f0' : 'none',
                                    borderTopLeftRadius: isBot ? 4 : 14,
                                    borderTopRightRadius: isBot ? 14 : 4}}>
                                    <div>{parseAiContent(msg.content)}</div>
                                    <div style={{fontSize:'0.6rem',opacity:0.6,marginTop:2,textAlign: isBot ? 'left' : 'right'}}>{formatTime(msg.timestamp)}</div>
                                </div>
                            </div>
                        );
                    })}
                    {isTyping && (
                        <div style={{display:'flex',gap:6,alignSelf:'flex-start'}}>
                            <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#667eea,#764ba2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#fff'}}>🤖</div>
                            <div style={{padding:'10px 14px',background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,borderTopLeftRadius:4,display:'flex',gap:3}}>
                                {[0,1,2].map(i => <span key={i} style={{width:6,height:6,borderRadius:'50%',background:'#667eea',animation:`bounce 1.4s ease-in-out ${i*0.18}s infinite`}} />)}
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                {/* Quick actions (only when welcome) */}
                {messages.length === 1 && (
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,padding:'8px 12px',borderTop:'1px solid #e2e8f0',background:'#fff'}}>
                        {AI_QUICK_ACTIONS.map((a, i) => (
                            <button key={i} onClick={() => sendMessage(a.prompt)}
                                style={{display:'flex',alignItems:'center',gap:6,padding:'7px 8px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',fontSize:'0.76rem',fontWeight:500,color:'#475569',transition:'all 0.2s'}}>
                                <span>{a.icon}</span><span>{a.label}</span>
                            </button>
                        ))}
                    </div>
                )}
                {/* Input */}
                <form onSubmit={e => { e.preventDefault(); if (input.trim()) sendMessage(input); }}
                    style={{display:'flex',gap:6,padding:'8px 12px',borderTop:'1px solid #e2e8f0',background:'#fff',flexShrink:0}}>
                    <input type="text" placeholder="Nhắn tin cho AI..." value={input} onChange={e => setInput(e.target.value)}
                        style={{flex:1,height:36,border:'1.5px solid #e2e8f0',borderRadius:18,padding:'0 12px',fontSize:'0.83rem',outline:'none'}} />
                    <button type="submit" disabled={!input.trim()}
                        style={{width:36,height:36,borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#667eea,#764ba2)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,opacity: input.trim() ? 1 : 0.5}}>
                        ▶
                    </button>
                </form>
            </div>
        </div>
    );
};

/* ──────────── BotChatBox ──────────── */
const BotChatBox = () => {
    const dispatch = useDispatch();
    const [view, setView] = useState<ViewId>('home');

    const goHome = useCallback(() => setView('home'), []);

    return (
        <div className={styles.chatBox}>
            {/* Header */}
            <div className={styles.chatHeader}>
                <div className={styles.chatHeaderLeft}>
                    {view !== 'home' && (
                        <button className={styles.headerBackBtn} onClick={goHome}>←</button>
                    )}
                    <div className={styles.botIcon}>🌴</div>
                    <div>
                        <div className={styles.chatHeaderName}>Tourista Travel Buddy</div>
                        <div className={styles.chatHeaderStatus}>
                            <span className={styles.onlineDot} />
                            Hỗ trợ 24/7
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

            {/* Views */}
            <div className={styles.messagesArea}>
                {view === 'home' && (
                    <HomePanel onSelect={(id) => setView(id as ViewId)} />
                )}
                {view === 'hot_tour' && <HotToursView onBack={goHome} />}
                {view === 'lookup' && <BookingLookupView onBack={goHome} />}
                {view === 'payment' && <PaymentGuideView onBack={goHome} />}
                {view === 'cancel' && <CancelPolicyView onBack={goHome} />}
                {view === 'contact' && <ContactView onBack={goHome} />}
                {view === 'faq' && <FaqView onBack={goHome} />}
                {view === 'ai_chat' && <AIChatView onBack={goHome} />}
            </div>
        </div>
    );
};

/* ──────────── BotChatWidget (FAB) ──────────── */
const BotChatWidget = () => {
    const dispatch = useDispatch();
    const { isBotOpen } = useAppSelector(state => state.chat);

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
                aria-label="Mở hỗ trợ"
            >
                <span className={styles.fabIcon}>{isBotOpen ? '✕' : '🗺️'}</span>
            </button>
        </div>
    );
};

export default BotChatWidget;
