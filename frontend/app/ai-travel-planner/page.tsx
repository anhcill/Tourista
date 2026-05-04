'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaWallet,
    FaSuitcaseRolling, FaUmbrellaBeach, FaMountain, FaUtensils,
    FaCamera, FaPlane, FaRegLightbulb, FaCheck, FaSpinner,
    FaChevronRight, FaRegClock, FaRegMoneyBillAlt,
    FaHeart, FaShoppingCart, FaBed, FaCar, FaGem
} from 'react-icons/fa';
import { MdFamilyRestroom, MdBusiness } from 'react-icons/md';
import { toast } from 'react-toastify';
import travelPlanApi from '@/api/travelPlanApi';
import styles from './page.module.css';

const INTEREST_OPTIONS = [
    { value: 'beach', label: 'Biển', icon: <FaUmbrellaBeach /> },
    { value: 'nature', label: 'Thiên nhiên', icon: <FaMountain /> },
    { value: 'food', label: 'Ẩm thực', icon: <FaUtensils /> },
    { value: 'culture', label: 'Văn hóa', icon: <FaCamera /> },
    { value: 'adventure', label: 'Phiêu lưu', icon: <FaPlane /> },
    { value: 'shopping', label: 'Mua sắm', icon: <FaShoppingCart /> },
];

const TRIP_TYPES = [
    { value: 'RELAX', label: 'Nghỉ dưỡng', icon: <FaUmbrellaBeach /> },
    { value: 'ADVENTURE', label: 'Phiêu lưu', icon: <FaMountain /> },
    { value: 'FAMILY', label: 'Gia đình', icon: <MdFamilyRestroom /> },
    { value: 'ROMANTIC', label: 'Lãng mạn', icon: <FaHeart /> },
    { value: 'BUSINESS', label: 'Công tác', icon: <MdBusiness /> },
];

const BUDGET_OPTIONS = [
    { value: 'THAP', label: 'Tiết kiệm', sub: '< 2 triệu/người', icon: <FaRegMoneyBillAlt /> },
    { value: 'TRUNG_BINH', label: 'Trung bình', sub: '2-10 triệu/người', icon: <FaWallet /> },
    { value: 'CAO', label: 'Cao cấp', sub: '> 10 triệu/người', icon: <FaGem /> },
];

const POPULAR_DESTINATIONS = [
    'Đà Nẵng', 'Hội An', 'Phú Quốc', 'Nha Trang', 'Hà Nội',
    'Hồ Chí Minh', 'Sa Pa', 'Cần Thơ', 'Vũng Tàu', 'Huế',
];

const ACTIVITY_ICONS: Record<string, React.ReactElement> = {
    sight_seeing: <FaCamera />,
    food: <FaUtensils />,
    transport: <FaCar />,
    accommodation: <FaBed />,
    shopping: <FaShoppingCart />,
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

    const [form, setForm] = useState<{
        destination: string;
        checkIn: string;
        checkOut: string;
        adults: number;
        children: number;
        budget: string;
        interests: string[];
        tripType: string;
    }>({
        destination: '',
        checkIn: '',
        checkOut: '',
        adults: 2,
        children: 0,
        budget: 'TRUNG_BINH',
        interests: [],
        tripType: 'RELAX',
    });

    const updateField = (field: string, value: string | number | string[]) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const toggleInterest = (value: string) => {
        setForm((prev) => {
            const current: string[] = prev.interests || [];
            const next = current.includes(value)
                ? current.filter((i) => i !== value)
                : [...current, value];
            return { ...prev, interests: next };
        });
    };

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
            <div className={styles.heroSection}>
                <div className={styles.heroContent}>
                    <div className={styles.heroIcon}>
                        <FaRegLightbulb />
                    </div>
                    <h1 className={styles.heroTitle}>AI Travel Planner</h1>
                    <p className={styles.heroSubtitle}>
                        Để trí tuệ nhân tạo lập lịch trình du lịch hoàn hảo cho bạn — miễn phí, tức thì
                    </p>
                </div>
            </div>

            <div className={styles.mainContainer}>
                <div className={styles.layout}>
                    {/* LEFT — Form */}
                    <aside className={styles.formSection}>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <h2 className={styles.formTitle}>Tạo lịch trình của bạn</h2>

                            {/* Destination */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    <FaMapMarkerAlt /> Điểm đến <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="VD: Đà Nẵng, Hội An, Phú Quốc..."
                                    value={form.destination}
                                    onChange={(e) => updateField('destination', e.target.value)}
                                    required
                                />
                                <div className={styles.quickDest}>
                                    {POPULAR_DESTINATIONS.slice(0, 5).map((d) => (
                                        <button
                                            key={d}
                                            type="button"
                                            className={`${styles.quickChip} ${form.destination === d ? styles.quickChipActive : ''}`}
                                            onClick={() => updateField('destination', d)}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dates */}
                            <div className={styles.dateRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}><FaCalendarAlt /> Ngày đi</label>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={form.checkIn || defaultCheckIn}
                                        min={defaultCheckIn}
                                        onChange={(e) => updateField('checkIn', e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
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
                            <div className={styles.peopleRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}><FaUsers /> Người lớn</label>
                                    <div className={styles.counter}>
                                        <button type="button" onClick={() => updateField('adults', Math.max(1, (form.adults || 1) - 1))}>−</button>
                                        <span>{form.adults || 1}</span>
                                        <button type="button" onClick={() => updateField('adults', (form.adults || 1) + 1)}>+</button>
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}><FaUsers /> Trẻ em</label>
                                    <div className={styles.counter}>
                                        <button type="button" onClick={() => updateField('children', Math.max(0, (form.children || 0) - 1))}>−</button>
                                        <span>{form.children || 0}</span>
                                        <button type="button" onClick={() => updateField('children', (form.children || 0) + 1)}>+</button>
                                    </div>
                                </div>
                            </div>

                            {/* Budget */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaWallet /> Ngân sách</label>
                                <div className={styles.budgetGrid}>
                                    {BUDGET_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            className={`${styles.budgetCard} ${form.budget === opt.value ? styles.budgetCardActive : ''}`}
                                            onClick={() => updateField('budget', opt.value)}
                                        >
                                            <span className={styles.budgetIcon}>{opt.icon}</span>
                                            <span className={styles.budgetLabel}>{opt.label}</span>
                                            <span className={styles.budgetSub}>{opt.sub}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Trip type */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaRegLightbulb /> Loại chuyến đi</label>
                                <div className={styles.chipGrid}>
                                    {TRIP_TYPES.map((t) => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            className={`${styles.chip} ${form.tripType === t.value ? styles.chipActive : ''}`}
                                            onClick={() => updateField('tripType', t.value)}
                                        >
                                            {t.icon} {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Interests */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaRegLightbulb /> Sở thích</label>
                                <div className={styles.chipGrid}>
                                    {INTEREST_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            className={`${styles.chip} ${(form.interests || []).includes(opt.value) ? styles.chipActive : ''}`}
                                            onClick={() => toggleInterest(opt.value)}
                                        >
                                            {opt.icon} {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? (
                                    <><FaSpinner className={styles.spinner} /> Đang tạo lịch trình...</>
                                ) : (
                                    <><FaRegLightbulb /> Tạo lịch trình AI ngay</>
                                )}
                            </button>
                        </form>
                    </aside>

                    {/* RIGHT — Plan Results */}
                    <section className={styles.resultSection}>
                        {!plan ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}><FaMapMarkerAlt /></div>
                                <h3>Chưa có lịch trình</h3>
                                <p>Điền thông tin bên trái và nhấn &ldquo;Tạo lịch trình AI&rdquo; để nhận gợi ý lịch trình hoàn hảo cho chuyến đi của bạn.</p>
                            </div>
                        ) : (
                            <div className={styles.planResult}>
                                {/* Header */}
                                <div className={styles.planHeader}>
                                    <div className={styles.planMeta}>
                                        <h2 className={styles.planDest}>{plan.destination}</h2>
                                        <span className={styles.planDuration}><FaRegClock /> {plan.tripDuration}</span>
                                    </div>
                                    {plan.summary && (
                                        <p className={styles.planSummary}>{plan.summary}</p>
                                    )}
                                </div>

                                {/* Day tabs */}
                                {plan.dayPlans && plan.dayPlans.length > 0 && (
                                    <div className={styles.dayTabs}>
                                        {plan.dayPlans.map((day: DayPlan, idx: number) => (
                                            <button
                                                key={idx}
                                                className={`${styles.dayTab} ${activeDay === idx ? styles.dayTabActive : ''}`}
                                                onClick={() => setActiveDay(idx)}
                                            >
                                                <span className={styles.dayTabNum}>Ngày {day.day || idx + 1}</span>
                                                <span className={styles.dayTabDate}>{day.date}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Day content */}
                                {plan.dayPlans && plan.dayPlans[activeDay] && (
                                    <div className={styles.dayContent}>
                                        <h3 className={styles.dayTitle}>
                                            {plan.dayPlans[activeDay].title}
                                        </h3>

                                        <div className={styles.activitiesList}>
                                            {(plan.dayPlans[activeDay].activities || []).map((act: PlanActivity, idx: number) => (
                                                <div key={idx} className={`${styles.activityCard} ${styles[`activity_${act.type || 'sight_seeing'}`]}`}>
                                                    <div className={styles.activityTime}>{act.time || '--:--'}</div>
                                                    <div className={styles.activityDot} />
                                                    <div className={styles.activityBody}>
                                                        <div className={styles.activityHeader}>
                                                            <span className={styles.activityTypeIcon}>
                                                                {ACTIVITY_ICONS[act.type || 'sight_seeing'] || <FaCamera />}
                                                            </span>
                                                            <strong className={styles.activityTitle}>{act.title}</strong>
                                                            {act.estimatedCost != null && act.estimatedCost > 0 && (
                                                                <span className={styles.activityCost}>
                                                                    ~{formatVND(act.estimatedCost)}đ
                                                                </span>
                                                            )}
                                                        </div>
                                                        {act.description && (
                                                            <p className={styles.activityDesc}>{act.description}</p>
                                                        )}
                                                        {act.location && (
                                                            <span className={styles.activityLoc}>
                                                                <FaMapMarkerAlt /> {act.location}
                                                            </span>
                                                        )}
                                                        {act.tips && (
                                                            <p className={styles.activityTips}>
                                                                <FaRegLightbulb /> {act.tips}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Packing list */}
                                {plan.packingList && plan.packingList.length > 0 && (
                                    <div className={styles.packingSection}>
                                        <h3 className={styles.sectionTitle}>
                                            <FaSuitcaseRolling /> Đồ dùng cần mang
                                        </h3>
                                        <div className={styles.packingGrid}>
                                            {plan.packingList.map((item: string, idx: number) => (
                                                <div key={idx} className={styles.packingItem}>
                                                    <FaCheck className={styles.checkIcon} />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tips */}
                                {(plan.weatherNote || plan.localTips) && (
                                    <div className={styles.tipsSection}>
                                        {plan.weatherNote && (
                                            <div className={styles.tipCard}>
                                                <h4><FaUmbrellaBeach /> Thời tiết</h4>
                                                <p>{plan.weatherNote}</p>
                                            </div>
                                        )}
                                        {plan.localTips && (
                                            <div className={styles.tipCard}>
                                                <h4><FaRegLightbulb /> Mẹo địa phương</h4>
                                                <p>{plan.localTips}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className={styles.planActions}>
                                    <button className={styles.actionBtnPrimary} onClick={() => router.push(`/tours/search?destination=${encodeURIComponent(plan.destination || '')}`)}>
                                        <FaChevronRight /> Tìm tour phù hợp
                                    </button>
                                    <button className={styles.actionBtnSecondary} onClick={() => router.push(`/hotels/search?destination=${encodeURIComponent(plan.destination || '')}`)}>
                                        <FaBed /> Tìm khách sạn
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
