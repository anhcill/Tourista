'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeBot } from '../../store/slices/chatSlice';
import chatApi from '../../api/chatApi';
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
];

const FAQ_ITEMS = [
    { q: 'Làm sao đặt tour trên Tourista?', a: 'Chọn tour → Chọn ngày & số người → Điền thông tin → Thanh toán qua VNPay hoặc chuyển khoản. Sau khi thanh toán thành công, bạn sẽ nhận mã booking qua email.' },
    { q: 'Tôi có thể hủy tour không?', a: 'Bạn có thể hủy tour theo chính sách: Hủy trước 7 ngày → hoàn 80%, 3-7 ngày → hoàn 50%, dưới 3 ngày → không hoàn. Chi tiết tại mục "Hủy/Hoàn tiền" trên website.' },
    { q: 'Thanh toán bằng cách nào?', a: 'Tourista hỗ trợ: 💳 Thẻ ATM/Visa qua VNPay, 🏦 Chuyển khoản ngân hàng (thông tin trong email xác nhận). Thanh toán an toàn qua cổng VNPay được mã hóa.' },
    { q: 'Mã booking là gì?', a: 'Mã booking (format: TRS-YYYYMMDD-XXXXXX) là mã đặt chỗ duy nhất của bạn, được gửi qua email sau khi đặt thành công. Dùng mã này để tra cứu hoặc liên hệ hỗ trợ.' },
    { q: 'Booking có thể đổi ngày không?', a: 'Có thể đổi ngày nếu còn chỗ và thông báo trước tối thiểu 5 ngày. Liên hệ hotline hoặc chat với đối tác trực tiếp để được hỗ trợ đổi lịch.' },
];

/* ──────────── Status helpers ──────────── */
type ViewId = 'home' | 'hot_tour' | 'lookup' | 'payment' | 'cancel' | 'contact' | 'faq';

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
                onClick={() => dispatch(isBotOpen ? closeBot() : dispatch({ type: 'chat/openBot' }))}
                aria-label="Mở hỗ trợ"
            >
                <span className={styles.fabIcon}>{isBotOpen ? '✕' : '🗺️'}</span>
            </button>
        </div>
    );
};

export default BotChatWidget;
