'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCamera, FaKey, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import userApi from '@/api/userApi';
import { updateUser } from '@/store/slices/authSlice';
import styles from './page.module.css';

export default function ProfilePage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    
    // Fallback UI State while checking auth
    const [mounted, setMounted] = useState(false);
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    
    // Form fields
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        avatarUrl: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [loadingError, setLoadingError] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        const loadProfile = async () => {
            setLoadingError('');
            setIsProfileLoading(true);

            try {
                const profile = await userApi.getMyProfile();

                setFormData({
                    fullName: profile?.fullName || user?.fullName || user?.name || '',
                    email: profile?.email || user?.email || '',
                    phone: profile?.phone || '',
                    avatarUrl: profile?.avatarUrl || user?.avatarUrl || '',
                });

                dispatch(updateUser(profile || {}));
            } catch (error) {
                const message = error?.message || 'Khong the tai thong tin profile.';
                setLoadingError(message);
                toast.error(message);

                setFormData({
                    fullName: user?.fullName || user?.name || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    avatarUrl: user?.avatarUrl || '',
                });
            } finally {
                setIsProfileLoading(false);
            }
        };

        void loadProfile();
    }, [dispatch, isAuthenticated, mounted, router, user]);

    // Fast return for Next.js hydration
    if (!mounted) return <main className={styles.loadingPage}>Dang tai profile...</main>;

    if (!isAuthenticated) {
        return <main className={styles.loadingPage}>Dang chuyen den trang dang nhap...</main>;
    }

    if (isProfileLoading) return <main className={styles.loadingPage}>Dang tai thong tin profile...</main>;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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

            setFormData({
                fullName: updated?.fullName || normalizedFullName,
                email: updated?.email || formData.email,
                phone: updated?.phone || '',
                avatarUrl: updated?.avatarUrl || '',
            });

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
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1>Hồ sơ của tôi</h1>
                    <p>Quản lý thông tin cá nhân, cài đặt bảo mật và tùy chọn ưu tiên của bạn.</p>
                </div>
            </section>

            <section className={styles.profileContainer}>
                <div className={styles.sidebar}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarWrapper}>
                            {user?.avatarUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={user.avatarUrl} alt="Avatar" className={styles.avatarImage} loading="lazy" decoding="async" />
                            ) : (
                                <div className={styles.avatarLetter}>{getInitials(user?.fullName || user?.name)}</div>
                            )}
                            <button
                                type="button"
                                className={styles.changeAvatarBtn}
                                title="Cap nhat URL avatar ben duoi"
                                onClick={() => toast.info('Ban co the cap nhat avatar bang URL trong form.')}
                            >
                                <FaCamera />
                            </button>
                        </div>
                        <h2 className={styles.userNameCard}>{user?.fullName || user?.name || 'Thành viên mới'}</h2>
                        <span className={styles.userRoleBadge}>{user?.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng VIP'}</span>
                    </div>

                    <nav className={styles.profileNav}>
                        <button className={`${styles.navItem} ${styles.activeNavItem}`}><FaUser /> Thông tin cá nhân</button>
                        <button className={styles.navItem} onClick={() => router.push('/profile/bookings')}><FaKey /> Lịch sử Đặt chỗ</button>
                        <button className={styles.navItem} onClick={() => router.push('/favorites')}><FaMapMarkerAlt /> Địa điểm Yêu thích</button>
                    </nav>
                </div>

                <div className={styles.mainContent}>
                    <div className={styles.cardBox}>
                        <h3 className={styles.cardTitle}>Thông tin liên hệ</h3>

                        {loadingError ? (
                            <div className={styles.warningBanner}>{loadingError}</div>
                        ) : null}
                        
                        <form className={styles.formGrid} onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Họ và tên</label>
                                <div className={styles.inputWrapper}>
                                    <FaUser className={styles.inputIcon} />
                                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="VD: Lê Đức Anh" required />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Email (Tài khoản Google)</label>
                                <div className={styles.inputWrapper}>
                                    <FaEnvelope className={styles.inputIcon} />
                                    <input type="email" name="email" value={formData.email} disabled className={styles.disabledInput} />
                                </div>
                                <span className={styles.helpText}>Email la dinh danh dang nhap va khong the thay doi.</span>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Số điện thoại</label>
                                <div className={styles.inputWrapper}>
                                    <FaPhone className={styles.inputIcon} />
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="0815913408" />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Avatar URL</label>
                                <div className={styles.inputWrapper}>
                                    <FaUser className={styles.inputIcon} />
                                    <input type="text" name="avatarUrl" value={formData.avatarUrl} onChange={handleChange} placeholder="https://..." />
                                </div>
                                <span className={styles.helpText}>Bo trong neu khong su dung avatar rieng.</span>
                            </div>

                            <div className={styles.formActions}>
                                <button type="submit" className={styles.btnSave} disabled={isSaving}>
                                    {isSaving ? 'Đang cập nhật...' : <><FaSave /> Lưu thay đổi</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
}
