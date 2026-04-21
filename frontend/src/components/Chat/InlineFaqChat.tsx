'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openBot } from '../../store/slices/chatSlice';
import faqApi from '../../api/faqApi';
import styles from './InlineFaqChat.module.css';

interface InlineFaqItem {
    id: string;
    question: string;
    answer: string;
    category?: string;
}

interface InlineFaqChatProps {
    context: 'HOTEL' | 'TOUR';
    className?: string;
}

interface Offer {
    id: string;
    emoji: string;
    label: string;
    hint: string;
}

const unwrapPayload = (response: { data?: { data?: unknown } | unknown }): unknown => {
    return (response as { data?: { data?: unknown } }).data?.data ?? (response as { data?: unknown }).data ?? response;
};

// Nút bấm nhanh cho từng context
const HOTEL_OFFERS: Offer[] = [
    { id: 'hotel_cancel', emoji: '❌', label: 'Hủy phòng / Hoàn tiền', hint: 'Xem chính sách hủy và hoàn tiền' },
    { id: 'hotel_payment', emoji: '💳', label: 'Thanh toán', hint: 'Cách thanh toán và các phương thức' },
    { id: 'hotel_checkin', emoji: '🕐', label: 'Check-in / Check-out', hint: 'Giờ nhận và trả phòng' },
    { id: 'hotel_amenities', emoji: '🛎️', label: 'Tiện nghi', hint: 'WiFi, hồ bơi, bữa sáng...' },
    { id: 'hotel_location', emoji: '📍', label: 'Địa chỉ & Bản đồ', hint: 'Vị trí và cách di chuyển' },
    { id: 'hotel_contact', emoji: '📞', label: 'Liên hệ chủ khách sạn', hint: 'Chat trực tiếp với chủ khách sạn' },
];

const TOUR_OFFERS: Offer[] = [
    { id: 'tour_cancel', emoji: '❌', label: 'Hủy tour / Hoàn tiền', hint: 'Xem chính sách hủy và hoàn tiền' },
    { id: 'tour_payment', emoji: '💳', label: 'Thanh toán', hint: 'Cách thanh toán và các phương thức' },
    { id: 'tour_itinerary', emoji: '🗓️', label: 'Lịch trình', hint: 'Xem chi tiết lịch trình tour' },
    { id: 'tour_include', emoji: '✅', label: 'Bao gồm / Không bao gồm', hint: 'Giá tour bao gồm những gì' },
    { id: 'tour_weather', emoji: '🌤️', label: 'Thời tiết & Chuẩn bị', hint: 'Mang gì, mặc gì cho chuyến đi' },
    { id: 'tour_contact', emoji: '📞', label: 'Liên hệ chủ tour', hint: 'Chat trực tiếp với chủ tour' },
];

const InlineFaqChat = ({ context, className }: InlineFaqChatProps) => {
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector(
        (state: { auth: { isAuthenticated: boolean } }) => state.auth
    );

    const [faqs, setFaqs] = useState<InlineFaqItem[]>([]);
    const [openFaq, setOpenFaq] = useState<string | null>(null);
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const offers = context === 'HOTEL' ? HOTEL_OFFERS : TOUR_OFFERS;

    const loadFaqs = useCallback(async () => {
        if (faqs.length > 0) return;
        try {
            const res = await faqApi.getFaqs(context);
            const data = unwrapPayload(res) as InlineFaqItem[];
            if (Array.isArray(data)) {
                setFaqs(data.slice(0, 5));
            }
        } catch {
            // silent fail — FAQ is supplementary
        }
    }, [context, faqs.length]);

    // Auto-expand first FAQ item if loaded
    useEffect(() => {
        if (faqs.length > 0 && openFaq === null) {
            setOpenFaq(faqs[0].id);
        }
    }, [faqs, openFaq]);

    const handleOfferClick = (offerId: string) => {
        if (offerId === 'hotel_contact' || offerId === 'tour_contact') {
            dispatch(openBot());
            return;
        }

        const offer = offers.find(o => o.id === offerId);
        if (!offer) return;

        // Extract keyword from offer label for rule-based matching
        const keywordMap: Record<string, string> = {
            hotel_cancel: 'chính sách hủy và hoàn tiền khách sạn',
            hotel_payment: 'thanh toán khách sạn vnpay atm',
            hotel_checkin: 'giờ check-in check-out nhận phòng trả phòng',
            hotel_amenities: 'tiện nghi wifi hồ bơi bữa sáng gym spa đỗ xe',
            hotel_location: 'địa chỉ khách sạn bản đồ cách trung tâm',
            tour_cancel: 'chính sách hủy và hoàn tiền tour du lịch',
            tour_payment: 'thanh toán tour du lịch vnpay đặt cọc',
            tour_itinerary: 'lịch trình tour chi tiết ngày khởi hành',
            tour_include: 'giá tour bao gồm không bao gồm gì',
            tour_weather: 'thời tiết du lịch chuẩn bị mang theo trang phục',
        };

        const keyword = keywordMap[offerId] || offer.label;
        setQuestion(keyword);
        setAnswer(null);
        setError(null);

        // Auto-submit
        void (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await faqApi.askQuestion(keyword, context);
                const data = (unwrapPayload(res) as { data?: string })?.data;
                setAnswer(data || null);
                if (!data) {
                    setError('Chưa có câu trả lời cho chủ đề này. Bạn thử hỏi cách khác nhé.');
                }
            } catch {
                setError('Có lỗi khi truy vấn. Bạn thử lại sau ít phút.');
            } finally {
                setIsLoading(false);
            }
        })();
    };

    const handleAsk = async () => {
        const q = question.trim();
        if (!q) return;

        setIsLoading(true);
        setError(null);
        setAnswer(null);

        try {
            const res = await faqApi.askQuestion(q, context);
            const data = (unwrapPayload(res) as { data?: string })?.data;
            if (data) {
                setAnswer(data);
            } else {
                setError('Chưa có câu trả lời cho câu hỏi này. Bạn thử hỏi cách khác nhé.');
            }
        } catch {
            setError('Có lỗi khi hỏi. Bạn thử lại sau ít phút.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenBot = () => {
        dispatch(openBot());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleAsk();
        }
    };

    return (
        <div className={`${styles.container} ${className || ''}`}>
            {/* ── Offer Quick Buttons ── */}
            <div className={styles.offerSection}>
                <div className={styles.offerSectionHeader}>
                    <span>⚡ Bạn cần tìm hiểu điều gì?</span>
                </div>
                <div className={styles.offerGrid}>
                    {offers.map((offer) => (
                        <button
                            key={offer.id}
                            className={styles.offerBtn}
                            onClick={() => handleOfferClick(offer.id)}
                            title={offer.hint}
                        >
                            <span className={styles.offerEmoji}>{offer.emoji}</span>
                            <span className={styles.offerLabel}>{offer.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Custom Question Input ── */}
            <div className={styles.inputSection}>
                <div className={styles.inputRow}>
                    <textarea
                        className={styles.input}
                        placeholder={`Hỏi về ${context === 'HOTEL' ? 'khách sạn' : 'tour'} này...`}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                        rows={2}
                    />
                    <button
                        className={styles.askBtn}
                        onClick={() => void handleAsk()}
                        disabled={isLoading || !question.trim()}
                    >
                        {isLoading ? '...' : 'Gửi'}
                    </button>
                </div>
                {error && <p className={styles.error}>{error}</p>}
                {answer && (
                    <div className={styles.answerBox}>
                        {(answer).split('\n').map((line, i) => (
                            <p key={i}>{line.startsWith('-') || line.startsWith('•') ? line : line}</p>
                        ))}
                    </div>
                )}
            </div>

            {/* ── FAQ Accordion ── */}
            {isAuthenticated && (
                <div className={styles.faqSection}>
                    <div className={styles.faqHeader}>
                        <span>📋 Câu hỏi thường gặp</span>
                        <button className={styles.chatOwnerBtn} onClick={handleOpenBot}>
                            💬 Chat với chủ {context === 'HOTEL' ? 'khách sạn' : 'tour'}
                        </button>
                    </div>
                    {faqs.length === 0 && (
                        <div className={styles.faqLoading}>
                            <button className={styles.loadFaqBtn} onClick={() => void loadFaqs()}>
                                📋 Tải câu hỏi thường gặp
                            </button>
                        </div>
                    )}
                    {faqs.map((faq) => (
                        <div key={faq.id} className={styles.faqItem}>
                            <button
                                className={`${styles.faqQ} ${openFaq === faq.id ? styles.faqQOpen : ''}`}
                                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                            >
                                <span className={styles.faqQText}>{faq.question}</span>
                                <span className={`${styles.faqChevron} ${openFaq === faq.id ? styles.open : ''}`}>
                                    ▾
                                </span>
                            </button>
                            {openFaq === faq.id && (
                                <div className={styles.faqA}>{faq.answer}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {!isAuthenticated && (
                <p className={styles.loginHint}>
                    💡{' '}
                    <button className={styles.loginLink} onClick={handleOpenBot}>
                        Đăng nhập
                    </button>{' '}
                    để xem FAQ hoặc chat trực tiếp với chủ {context === 'HOTEL' ? 'khách sạn' : 'tour'}
                </p>
            )}
        </div>
    );
};

export default InlineFaqChat;
