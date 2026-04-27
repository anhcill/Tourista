'use client';

import { useEffect, useState, useCallback } from 'react';
import { FaTag, FaCheck, FaTimes, FaChevronDown, FaChevronUp, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import promotionApi from '@/api/promotionApi';
import styles from './PromotionSelector.module.css';

type AppliedValidation = {
    valid: boolean;
    code: string;
    name: string;
    description: string | null;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    finalAmount: number;
    errorMessage?: string;
};

type PromoItem = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    discountType: string;
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number | null;
    appliesTo: string;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
    usageLimit?: number;
    usedCount?: number;
};

const formatVnd = (value: unknown) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));

const DISCOUNT_LABELS = {
    PERCENTAGE: '%',
    FIXED: '₫',
};

export default function PromotionSelector({
    appliesTo = 'HOTEL',
    orderAmount = 0,
    onApply,
    selectedPromo,
    onRemove,
}) {
    const [promos, setPromos] = useState<PromoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [applyingCode, setApplyingCode] = useState('');
    const [applyingPromoId, setApplyingPromoId] = useState<number | null>(null);
    const [appliedPromo, setAppliedPromo] = useState<PromoItem | null>(selectedPromo || null);
    const [appliedValidation, setAppliedValidation] = useState<AppliedValidation | null>(null);

    useEffect(() => {
        const fetchPromos = async () => {
            try {
                setLoading(true);
                const res = await promotionApi.getActivePromotions();
                const list = Array.isArray(res?.data)
                    ? res.data
                    : Array.isArray(res?.data?.content)
                        ? res.data.content
                        : [];
                setPromos(list);
            } catch {
                setError('Không thể tải danh sách khuyến mãi.');
            } finally {
                setLoading(false);
            }
        };
        fetchPromos();
    }, []);

    const checkPromoUsable = useCallback((promo, amount) => {
        if (!promo || !amount || amount <= 0) return { usable: false, reason: null };
        const now = new Date();
        if (promo.validUntil) {
            const until = new Date(promo.validUntil);
            if (until < now) return { usable: false, reason: 'Đã hết hạn' };
        }
        if (promo.validFrom) {
            const from = new Date(promo.validFrom);
            if (from > now) return { usable: false, reason: 'Chưa có hiệu lực' };
        }
        if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
            return { usable: false, reason: 'Hết lượt' };
        }
        if (promo.minOrderAmount && amount < Number(promo.minOrderAmount)) {
            return {
                usable: false,
                reason: `Đơn tối thiểu ${formatVnd(promo.minOrderAmount)}`,
            };
        }
        const appliesTo = promo.appliesTo;
        if (appliesTo && appliesTo !== 'ALL') {
            if (appliesTo !== appliesTo.toUpperCase()) {
                // only matches if same type
                if (appliesTo.toUpperCase() !== appliesTo) return { usable: false, reason: 'Không áp dụng' };
            }
        }
        return { usable: true, reason: null };
    }, []);

    const handleApply = useCallback(async (promo) => {
        if (applyingPromoId) return;
        setApplyingPromoId(promo.id);

        try {
            const res = await promotionApi.validatePromo({
                code: promo.code,
                appliesTo,
                orderAmount: Number(orderAmount),
            });
            const result = res?.data;

            if (!result?.valid) {
                toast.error(result?.errorMessage || 'Mã không hợp lệ cho đơn hàng này.');
                return;
            }

            setAppliedPromo(result);
            setAppliedValidation(result);
            toast.success(`Áp dụng "${result.name}" thành công! Giảm ${formatVnd(result.discountAmount)}`);
            if (onApply) onApply(result);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Không thể áp dụng mã khuyến mãi.');
        } finally {
            setApplyingPromoId(null);
        }
    }, [applyingPromoId, appliesTo, orderAmount, onApply]);

    const handleRemove = useCallback(() => {
        setAppliedPromo(null);
        setAppliedValidation(null);
        if (onRemove) onRemove();
        toast.info('Đã gỡ mã khuyến mãi.');
    }, [onRemove]);

    const visiblePromos = expanded ? promos : promos.slice(0, 4);
    const hasMore = promos.length > 4;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <FaTag className={styles.headerIcon} />
                    <span className={styles.headerTitle}>Mã khuyến mãi</span>
                    {appliedPromo && appliedValidation && (
                        <span className={styles.appliedBadge}>
                            <FaCheck /> Đã áp dụng
                        </span>
                    )}
                </div>
                {appliedPromo && appliedValidation && (
                    <button type="button" className={styles.removeBtn} onClick={handleRemove}>
                        <FaTimes /> Gỡ bỏ
                    </button>
                )}
            </div>

            {/* Applied Promo Banner */}
            {appliedPromo && appliedValidation && (
                <div className={styles.appliedBanner}>
                    <div className={styles.appliedBannerLeft}>
                        <div className={styles.appliedCode}>{appliedPromo.code}</div>
                        <div className={styles.appliedName}>{appliedPromo.name}</div>
                        {appliedPromo.description && (
                            <div className={styles.appliedDesc}>{appliedPromo.description}</div>
                        )}
                    </div>
                    <div className={styles.appliedBannerRight}>
                        <div className={styles.discountAmount}>
                            -{formatVnd(appliedValidation.discountAmount)}
                        </div>
                        <div className={styles.finalAmount}>
                            Thành tiền: {formatVnd(appliedValidation.finalAmount)}
                        </div>
                    </div>
                </div>
            )}

            {/* Promo List */}
            {loading ? (
                <div className={styles.loadingRow}>
                    <span className={styles.skeleton} />
                    <span className={styles.skeleton} />
                    <span className={styles.skeleton} />
                </div>
            ) : error ? (
                <p className={styles.errorMsg}>{error}</p>
            ) : promos.length === 0 ? (
                <p className={styles.emptyMsg}>Hiện không có khuyến mãi nào khả dụng.</p>
            ) : (
                <div className={styles.promoList}>
                    {visiblePromos.map((promo) => {
                        const { usable, reason } = checkPromoUsable(promo, orderAmount);
                        const isActive = appliedPromo?.code === promo.code;
                        const isApplying = applyingPromoId === promo.id;
                        const discountLabel = promo.discountType === 'PERCENTAGE'
                            ? `${promo.discountValue}%`
                            : formatVnd(promo.discountValue);

                        return (
                            <div
                                key={promo.id}
                                className={`${styles.promoCard} ${!usable ? styles.promoCardDisabled : ''} ${isActive ? styles.promoCardActive : ''}`}
                            >
                                <div className={styles.promoCardLeft}>
                                    <div className={styles.promoCodeTag}>
                                        <span className={styles.promoCode}>{promo.code}</span>
                                        <span className={styles.promoDiscount}>{discountLabel}</span>
                                    </div>
                                    <div className={styles.promoName}>{promo.name}</div>
                                    {promo.description && (
                                        <div className={styles.promoDesc}>{promo.description}</div>
                                    )}
                                    <div className={styles.promoMeta}>
                                        {promo.minOrderAmount && (
                                            <span>Đơn tối thiểu: {formatVnd(promo.minOrderAmount)}</span>
                                        )}
                                        {promo.validUntil && (
                                            <span>HSD: {new Date(promo.validUntil).toLocaleDateString('vi-VN')}</span>
                                        )}
                                        {promo.appliesTo && promo.appliesTo !== 'ALL' && (
                                            <span className={styles.appliesToTag}>
                                                Chỉ {promo.appliesTo === 'HOTEL' ? 'Khách sạn' : 'Tour'}
                                            </span>
                                        )}
                                    </div>
                                    {!usable && reason && (
                                        <div className={styles.unusableReason}>
                                            <FaInfoCircle /> {reason}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.promoCardRight}>
                                    {isActive ? (
                                        <button
                                            type="button"
                                            className={styles.appliedBtn}
                                            onClick={handleRemove}
                                        >
                                            <FaCheck /> Đã chọn
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className={`${styles.applyBtn} ${!usable ? styles.applyBtnDisabled : ''}`}
                                            disabled={!usable || isApplying}
                                            onClick={() => usable && handleApply(promo)}
                                        >
                                            {isApplying ? 'Đang áp dụng...' : 'Áp dụng'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {hasMore && (
                        <button
                            type="button"
                            className={styles.showMoreBtn}
                            onClick={() => setExpanded((v) => !v)}
                        >
                            {expanded ? (
                                <>
                                    <FaChevronUp /> Thu gọn
                                </>
                            ) : (
                                <>
                                    <FaChevronDown /> Xem thêm {promos.length - 4} mã khác
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
