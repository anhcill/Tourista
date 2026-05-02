'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
    FaUser, FaEnvelope, FaPhone, FaCamera, FaSave,
    FaCheckCircle, FaTimesCircle, FaKey, FaHeart
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import userApi from '@/api/userApi';
import { updateUser } from '@/store/slices/authSlice';
import styles from './page.module.css';

export default function ProfilePage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const [mounted, setMounted] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [initialData, setInitialData] = useState(null);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        avatarUrl: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsaved, setHasUnsaved] = useState(false);

    const profileLoadedRef = useRef(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Auth guard
    useEffect(() => {
        if (!mounted) return;
        if (!isAuthenticated) {
            const redirect = typeof window !== 'undefined'
                ? `?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}` : '';
            router.replace(`/login${redirect}`);
            return;
        }
        setAuthChecked(true);
    }, [mounted, isAuthenticated, router]);

    // Load profile data ONCE
    useEffect(() => {
        if (!authChecked || profileLoadedRef.current) return;
        profileLoadedRef.current = true;

        const loadProfile = async () => {
            try {
                const profile = await userApi.getMyProfile();
                const name = profile?.fullName || user?.fullName || user?.name || '';
                const email = profile?.email || user?.email || '';
                const phone = profile?.phone || '';
                const avatarUrl = profile?.avatarUrl || user?.avatarUrl || '';

                setInitialData({ fullName: name, email, phone, avatarUrl });
                setFormData({ fullName: name, email, phone, avatarUrl });
                dispatch(updateUser(profile || {}));
            } catch {
                // Fallback to redux user data
                const name = user?.fullName || user?.name || '';
                const email = user?.email || '';
                const phone = user?.phone || '';
                const avatarUrl = user?.avatarUrl || '';
                setInitialData({ fullName: name, email, phone, avatarUrl });
                setFormData({ fullName: name, email, phone, avatarUrl });
            } finally {
                setProfileLoaded(true);
            }
        };

        void loadProfile();
    }, [authChecked, dispatch, user]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setHasUnsaved(true);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const normalizedFullName = formData.fullName.trim();
        const normalizedPhone = formData.phone.trim();
        const normalizedAvatarUrl = formData.avatarUrl.trim();

        if (normalizedFullName.length < 2) {
            toast.error('Ho ten phai co it nhat 2 ky tu.');
            return;
        }

        if (normalizedPhone && !/^(\+84|0)[3-9]\d{8}$/.test(normalizedPhone)) {
            toast.error('So dien thoai khong hop le.');
            return;
        }

        setIsSaving(true);

        try {
            const updated = await userApi.updateMyProfile({
                fullName: normalizedFullName,
                phone: normalizedPhone || null,
                avatarUrl: normalizedAvatarUrl || null,
            });

            const newData = {
                fullName: updated?.fullName || normalizedFullName,
                email: updated?.email || formData.email,
                phone: updated?.phone || '',
                avatarUrl: updated?.avatarUrl || '',
            };

            setFormData(newData);
            setInitialData(newData);
            setHasUnsaved(false);
            dispatch(updateUser(updated || {}));
            toast.success('Ho so da duoc cap nhat thanh cong!');
        } catch (error) {
            toast.error(error?.message || 'Khong the luu thay doi.');
        } finally {
            setIsSaving(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
    };

    const displayName = formData.fullName || user?.fullName || user?.name || 'Thành viên mới';
    const displayAvatar = formData.avatarUrl || user?.avatarUrl || null;
    const isAdmin = user?.role === 'ADMIN';

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1>Hồ sơ của tôi</h1>
                    <p>Quản lý thông tin cá nhân, cài đặt bảo mật và tùy chỉnh trải nghiệm của bạn.</p>
                </div>
            </section>

            <section className={styles.profileContainer}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarWrapper}>
                            {displayAvatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={displayAvatar} alt="Avatar" className={styles.avatarImage} loading="lazy" decoding="async" />
                            ) : (
                                <div className={styles.avatarLetter}>{getInitials(displayName)}</div>
                            )}
                        </div>
                        <h2 className={styles.userNameCard}>{displayName}</h2>
                        <span className={`${styles.userRoleBadge} ${isAdmin ? styles.badgeAdmin : styles.badgeUser}`}>
                            {isAdmin ? 'Quản trị viên' : 'Khách hàng'}
                        </span>
                    </div>

                    <nav className={styles.profileNav}>
                        <button className={`${styles.navItem} ${styles.activeNavItem}`}>
                            <FaUser /> Thông tin cá nhân
                        </button>
                        <button className={styles.navItem} onClick={() => router.push('/profile/bookings')}>
                            <FaKey /> Lịch sử Đặt chỗ
                        </button>
                        <button className={styles.navItem} onClick={() => router.push('/favorites')}>
                            <FaHeart /> Địa điểm Yêu thích
                        </button>
                    </nav>
                </aside>

                {/* Main */}
                <div className={styles.mainContent}>
                    <div className={styles.cardBox}>
                        <h3 className={styles.cardTitle}>Thông tin liên hệ</h3>

                        <form className={styles.formGrid} onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label htmlFor="fullName">Họ và tên</label>
                                <div className={styles.inputWrapper}>
                                    <FaUser className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="VD: Lê Đức Anh"
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="email">Email</label>
                                <div className={styles.inputWrapper}>
                                    <FaEnvelope className={styles.inputIcon} />
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        disabled
                                        className={styles.disabledInput}
                                        readOnly
                                    />
                                </div>
                                <span className={styles.helpText}>Email là thông tin đăng nhập và không thể thay đổi.</span>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="phone">Số điện thoại</label>
                                <div className={styles.inputWrapper}>
                                    <FaPhone className={styles.inputIcon} />
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="VD: 0815913408"
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="avatarUrl">Link Avatar</label>
                                <div className={styles.inputWrapper}>
                                    <FaCamera className={styles.inputIcon} />
                                    <input
                                        type="text"
                                        id="avatarUrl"
                                        name="avatarUrl"
                                        value={formData.avatarUrl}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                    />
                                </div>
                                <span className={styles.helpText}>Dán link ảnh hoặc bỏ trống để sử dụng avatar mặc định.</span>
                            </div>

                            <div className={styles.formActions}>
                                <button type="submit" className={styles.btnSave} disabled={isSaving || !hasUnsaved}>
                                    {isSaving ? (
                                        <span className={styles.savingText}>Đang cập nhật...</span>
                                    ) : (
                                        <><FaSave /> Lưu thay đổi</>
                                    )}
                                </button>
                                {hasUnsaved && (
                                    <button
                                        type="button"
                                        className={styles.btnCancel}
                                        onClick={() => {
                                            if (initialData) {
                                                setFormData(initialData);
                                                setHasUnsaved(false);
                                            }
                                        }}
                                    >
                                        Hủy bỏ
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
}
