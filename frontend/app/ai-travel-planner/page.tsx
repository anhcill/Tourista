'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaWallet,
    FaRegLightbulb, FaCheck, FaSpinner, FaChevronRight,
    FaSuitcaseRolling
} from 'react-icons/fa';
import { IoMdFlash } from 'react-icons/io';
import { toast } from 'react-toastify';
import travelPlanApi from '@/api/travelPlanApi';
import AIPanel from '@/components/AI/AIPanel';
import styles from './page.module.css';

const INTEREST_OPTIONS = [
    { value: 'beach', label: 'Biển', icon: '🏖️' },
    { value: 'nature', label: 'Thiên nhiên', icon: '⛰️' },
    { value: 'food', label: 'Ẩm thực', icon: '🍜' },
    { value: 'culture', label: 'Văn hóa', icon: '🏛️' },
    { value: 'adventure', label: 'Phiêu lưu', icon: '🧗' },
    { value: 'shopping', label: 'Mua sắm', icon: '🛍️' },
];

const TRIP_TYPES = [
    { value: 'RELAX', label: 'Nghỉ dưỡng', icon: '😌' },
    { value: 'ADVENTURE', label: 'Phiêu lưu', icon: '🚀' },
    { value: 'FAMILY', label: 'Gia đình', icon: '👨‍👩‍👧‍👦' },
    { value: 'ROMANTIC', label: 'Lãng mạn', icon: '💑' },
    { value: 'BUSINESS', label: 'Công tác', icon: '💼' },
];

const BUDGET_OPTIONS = [
    { value: 'THAP', label: 'Tiết kiệm', sub: '< 2tr', icon: '💰' },
    { value: 'TRUNG_BINH', label: 'Trung bình', sub: '2-10tr', icon: '💵' },
    { value: 'CAO', label: 'Cao cấp', sub: '> 10tr', icon: '💎' },
];

const POPULAR_DESTINATIONS = ['Đà Nẵng', 'Hội An', 'Phú Quốc', 'Nha Trang', 'Hà Nội', 'TP HCM', 'Sa Pa', 'Huế'];

const ACTIVITY_ICONS: Record<string, string> = {
    sight_seeing: '📸',
    food: '🍽️',
    transport: '🚗',
    accommodation: '🏨',
    shopping: '🛒',
};

type PlanActivity = {
    type?: string;
    time?: string;
    title?: string;
    description?: string;
    location?: string;
    tips?: string;
    estimatedCost?: number;
};

type DayPlan = {
    day?: string | number;
    date?: string;
    title?: string;
    activities?: PlanActivity[];
};

type TravelPlan = {
    destination?: string;
    tripDuration?: string;
    summary?: string;
    dayPlans?: DayPlan[];
    packingList?: string[];
    weatherNote?: string;
    localTips?: string;
};

function formatVND(amount: number | string | null | undefined) {
    if (!amount && amount !== 0) return '';
    return Number(amount).toLocaleString('vi-VN');
}

export default function AITravelPlannerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<TravelPlan | null>(null);
    const [activeDay, setActiveDay] = useState(0);
    const [showChat, setShowChat] = useState(false);

    const [form, setForm] = useState({
        destination: '',
        checkIn: '',
        checkOut: '',
        adults: 2,
        children: 0,
        budget: 'TRUNG_BINH',
        interests: [] as string[],
        tripType: 'RELAX',
    });

    const updateField = (field: string, value: string | number | string[]) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const toggleInterest = (value: string) => {
        setForm((prev) => {
            const current = prev.interests || [];
            const next = current.includes(value)
                ? current.filter((i) => i !== value)
                : [...current, value];
            return { ...prev, interests: next };
        });
    };

    const LOADING_MESSAGES = [
        '🗺️ Đang phân tích địa điểm...',
        '📅 Lên lịch từng ngày...',
        '🍜 Tìm ẩm thực đặc sản...',
        '🏨 Tìm chỗ nghỉ phù hợp...',
        '✨ AI đang viết lịch trình chi tiết...',
        '🎒 Chuẩn bị danh sách đồ dùng...',
        '💡 Tổng hợp mẹo hay...',
    ];
    const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

    useEffect(() => {
        if (!loading) return;
        setLoadingMsgIdx(0);
        const interval = setInterval(() => {
            setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
        }, 2500);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.destination?.trim()) {
            toast.error('Vui lòng nhập điểm đến');
            return;
        }
        setLoading(true);
        setPlan(null);
        try {
            const payload = {
                destination: form.destination,
                checkIn: form.checkIn || undefined,
                checkOut: form.checkOut || undefined,
                adults: form.adults,
                children: form.children,
                budget: form.budget,
                interests: (form.interests || []).join(','),
                tripType: form.tripType,
            };
            const data = await travelPlanApi.generate(payload);
            const result = data?.data;
            if (result) {
                setPlan(result);
                setActiveDay(0);
            } else {
                const msg = (data as { message?: string })?.message;
                toast.error(msg || 'Tạo lịch trình thất bại');
            }
        } catch {
            toast.error('Tạo lịch trình thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const today = new Date();
    const defaultCheckIn = today.toISOString().split('T')[0];
    const defaultCheckOut = new Date(today.getTime() + 3 * 86400000).toISOString().split('T')[0];

    return (
        <div className={styles.page}>
            {/* Hero */}
            <div className={styles.hero}>
                <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=80"
                    alt="Travel"
                    className={styles.heroBg}
                />
                <div className={styles.heroOverlay} />
                <div className={styles.heroContent}>
                    <span className={styles.heroBadge}><IoMdFlash /> AI Travel Planner</span>
                    <h1 className={styles.heroTitle}>Lên lịch trình du lịch thông minh</h1>
                    <p className={styles.heroSub}>Miễn phí · Tức thì · Cá nhân hóa</p>
                </div>
            </div>

            {/* Main */}
            <div className={styles.main}>
                <div className={styles.grid}>

                    {/* FORM CARD */}
                    <form className={styles.card} onSubmit={handleSubmit}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>📋 Tạo lịch trình</span>
                        </div>

                        <div className={styles.cardBody}>
                            {/* Destination */}
                            <div className={styles.field}>
                                <label className={styles.label}><FaMapMarkerAlt /> Điểm đến <span>*</span></label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="VD: Đà Nẵng, Hội An..."
                                    value={form.destination}
                                    onChange={(e) => updateField('destination', e.target.value)}
                                    required
                                />
                                <div className={styles.chips}>
                                    {POPULAR_DESTINATIONS.slice(0, 5).map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            className={`${styles.chip} ${form.destination === d ? styles.chipOn : ''}`}
                                            onClick={() => updateField('destination', d)}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dates */}
                            <div className={styles.row2}>
                                <div className={styles.field}>
                                    <label className={styles.label}><FaCalendarAlt /> Ngày đi</label>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={form.checkIn || defaultCheckIn}
                                        min={defaultCheckIn}
                                        onChange={(e) => updateField('checkIn', e.target.value)}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}><FaCalendarAlt /> Ngày về</label>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={form.checkOut || defaultCheckOut}
                                        min={form.checkIn || defaultCheckIn}
                                        onChange={(e) => updateField('checkOut', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* People */}
                            <div className={styles.row2}>
                                <div className={styles.field}>
                                    <label className={styles.label}><FaUsers /> Người lớn</label>
                                    <div className={styles.counter}>
                                        <button type="button" onClick={() => updateField('adults', Math.max(1, form.adults - 1))}>−</button>
                                        <span>{form.adults}</span>
                                        <button type="button" onClick={() => updateField('adults', form.adults + 1)}>+</button>
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}><FaUsers /> Trẻ em</label>
                                    <div className={styles.counter}>
                                        <button type="button" onClick={() => updateField('children', Math.max(0, form.children - 1))}>−</button>
                                        <span>{form.children}</span>
                                        <button type="button" onClick={() => updateField('children', form.children + 1)}>+</button>
                                    </div>
                                </div>
                            </div>

                            {/* Budget */}
                            <div className={styles.field}>
                                <label className={styles.label}><FaWallet /> Ngân sách</label>
                                <div className={styles.budgetRow}>
                                    {BUDGET_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            className={`${styles.budgetOpt} ${form.budget === opt.value ? styles.budgetOn : ''}`}
                                            onClick={() => updateField('budget', opt.value)}
                                        >
                                            <span>{opt.icon}</span>
                                            <span className={styles.budgetName}>{opt.label}</span>
                                            <span className={styles.budgetSub}>{opt.sub}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Trip Type */}
                            <div className={styles.field}>
                                <label className={styles.label}><FaRegLightbulb /> Loại chuyến đi</label>
                                <div className={styles.chips}>
                                    {TRIP_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            className={`${styles.chip} ${form.tripType === t.value ? styles.chipOn : ''}`}
                                            onClick={() => updateField('tripType', t.value)}
                                        >
                                            {t.icon} {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Interests */}
                            <div className={styles.field}>
                                <label className={styles.label}><FaRegLightbulb /> Sở thích</label>
                                <div className={styles.chips}>
                                    {INTEREST_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            className={`${styles.chip} ${form.interests.includes(opt.value) ? styles.chipOn : ''}`}
                                            onClick={() => toggleInterest(opt.value)}
                                        >
                                            {opt.icon} {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? (
                                <><FaSpinner className={styles.spin} /> {LOADING_MESSAGES[loadingMsgIdx]}</>
                            ) : (
                                <><IoMdFlash /> Tạo lịch trình AI</>
                            )}
                        </button>
                    </form>

                    {/* RESULTS CARD */}
                    <div className={styles.resultCard}>
                        {!plan ? (
                            <div className={styles.empty}>
                                <span className={styles.emptyEmoji}>🗺️</span>
                                <p className={styles.emptyTitle}>Chưa có lịch trình</p>
                                <p className={styles.emptyDesc}>Điền thông tin và nhấn <strong>Tạo lịch trình AI</strong> để nhận gợi ý ngay!</p>
                                <button className={styles.chatBtn} onClick={() => setShowChat(true)}>
                                    💬 Chat với AI Assistant
                                </button>
                            </div>
                        ) : (
                            <div className={styles.plan}>
                                {/* Plan Header */}
                                <div className={styles.planHead}>
                                    <div className={styles.planHeadLeft}>
                                        <h2 className={styles.planDest}>{plan.destination}</h2>
                                        <span className={styles.planDur}><FaCalendarAlt /> {plan.tripDuration}</span>
                                    </div>
                                    {plan.summary && <p className={styles.planSummary}>{plan.summary}</p>}
                                </div>

                                {/* Day Tabs */}
                                {plan.dayPlans && plan.dayPlans.length > 0 && (
                                    <div className={styles.dayTabs}>
                                        {plan.dayPlans.map((day, idx) => (
                                            <button
                                                key={idx}
                                                className={`${styles.dayTab} ${activeDay === idx ? styles.dayTabOn : ''}`}
                                                onClick={() => setActiveDay(idx)}
                                            >
                                                <span>Ngày {day.day || idx + 1}</span>
                                                <span className={styles.dayTabDate}>{day.date}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Day Content */}
                                {plan.dayPlans && plan.dayPlans[activeDay] && (
                                    <div className={styles.dayContent}>
                                        <h3 className={styles.dayTitle}>{plan.dayPlans[activeDay].title}</h3>
                                        <div className={styles.acts}>
                                            {(plan.dayPlans[activeDay].activities || []).map((act, idx) => (
                                                <div key={idx} className={`${styles.act} ${styles[`act_${act.type || 'sight_seeing'}`]}`}>
                                                    <span className={styles.actTime}>{act.time || '--:--'}</span>
                                                    <div className={styles.actLine} />
                                                    <div className={styles.actBody}>
                                                        <span className={styles.actType}>{ACTIVITY_ICONS[act.type || 'sight_seeing'] || '📸'}</span>
                                                        <div className={styles.actInfo}>
                                                            <strong>{act.title}</strong>
                                                            {act.description && <p>{act.description}</p>}
                                                            {act.location && <span>📍 {act.location}</span>}
                                                            {act.tips && <span className={styles.actTip}>💡 {act.tips}</span>}
                                                        </div>
                                                        {act.estimatedCost != null && act.estimatedCost > 0 && (
                                                            <span className={styles.actCost}>~{formatVND(act.estimatedCost)}đ</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Packing */}
                                {plan.packingList && plan.packingList.length > 0 && (
                                    <div className={styles.packSection}>
                                        <h4 className={styles.packTitle}>🎒 Đồ dùng cần mang</h4>
                                        <div className={styles.packGrid}>
                                            {plan.packingList.map((item, idx) => (
                                                <div key={idx} className={styles.packItem}>
                                                    <FaCheck className={styles.packCheck} /> {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tips */}
                                {(plan.weatherNote || plan.localTips) && (
                                    <div className={styles.tips}>
                                        {plan.weatherNote && (
                                            <div className={styles.tip}>
                                                <strong>🌤️ Thời tiết</strong>
                                                <p>{plan.weatherNote}</p>
                                            </div>
                                        )}
                                        {plan.localTips && (
                                            <div className={styles.tip}>
                                                <strong>💡 Mẹo</strong>
                                                <p>{plan.localTips}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className={styles.planActions}>
                                    <button className={styles.actBtnPrimary} onClick={() => router.push(`/tours/search?destination=${encodeURIComponent(plan.destination || '')}`)}>
                                        <FaChevronRight /> Tìm tour
                                    </button>
                                    <button className={styles.actBtnSecondary} onClick={() => router.push(`/hotels/search?destination=${encodeURIComponent(plan.destination || '')}`)}>
                                        🏨 Tìm khách sạn
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Widget */}
            <div className={styles.chatWrapper}>
                <AIPanel isOpen={showChat} onClose={() => setShowChat(false)} />
                {!showChat && (
                    <button className={styles.chatFab} onClick={() => setShowChat(true)}>
                        💬 Chat AI
                    </button>
                )}
            </div>
        </div>
    );
}
