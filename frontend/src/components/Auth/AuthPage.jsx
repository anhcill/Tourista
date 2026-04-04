'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    FaUser, FaEnvelope, FaLock, FaGoogle,
    FaPlane, FaMapMarkerAlt, FaPassport, FaUmbrellaBeach,
    FaEye, FaEyeSlash, FaCheckCircle
} from 'react-icons/fa';
import { loginStart, loginSuccess, loginFailure } from '@/store/slices/authSlice';
import Button from '@/components/Common/Button/Button';
import Input from '@/components/Common/Input/Input';
import authApi from '@/api/authApi';
import { API_BASE_URL } from '@/utils/constants';
import styles from './Auth.module.css';

const ADMIN_ROLE_SET = new Set(['ADMIN', 'ROLE_ADMIN']);

const normalizeRole = (value) => String(value || '').trim().toUpperCase();

const isAdminUser = (user) => {
    if (!user || typeof user !== 'object') return false;

    const values = [];

    if (typeof user.role === 'string') values.push(user.role);

    if (Array.isArray(user.roles)) {
        user.roles.forEach((roleItem) => {
            if (typeof roleItem === 'string') values.push(roleItem);
            else if (roleItem && typeof roleItem === 'object') {
                if (typeof roleItem.name === 'string') values.push(roleItem.name);
                if (typeof roleItem.role === 'string') values.push(roleItem.role);
                if (typeof roleItem.authority === 'string') values.push(roleItem.authority);
            }
        });
    }

    if (Array.isArray(user.authorities)) {
        user.authorities.forEach((authorityItem) => {
            if (typeof authorityItem === 'string') values.push(authorityItem);
            else if (authorityItem && typeof authorityItem === 'object' && typeof authorityItem.authority === 'string') {
                values.push(authorityItem.authority);
            }
        });
    }

    return values
        .map(normalizeRole)
        .some((roleName) => ADMIN_ROLE_SET.has(roleName));
};

const getDefaultPostLoginRoute = (user, searchParams) => {
    const redirect = searchParams.get('redirect');
    if (redirect) return redirect;
    return isAdminUser(user) ? '/admin' : '/';
};

const AuthPage = ({ initialMode = 'login' }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const [isFlipped, setIsFlipped] = useState(initialMode === 'register');
    const [isLoading, setIsLoading] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegPassword, setShowRegPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [registerSuccess, setRegisterSuccess] = useState(false);

    // Login form state
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [loginErrors, setLoginErrors] = useState({});

    // Register form state
    const [registerData, setRegisterData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [registerErrors, setRegisterErrors] = useState({});

    // Redirect nếu đã login
    useEffect(() => {
        if (isAuthenticated) {
            const redirect = getDefaultPostLoginRoute(user, searchParams);
            router.push(redirect);
        }
    }, [isAuthenticated, router, searchParams, user]);

    // Xử lý OAuth2 callback (Google trả về token qua URL)
    useEffect(() => {
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');
        const error = searchParams.get('error');

        if (error) {
            toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
            return;
        }

        if (token) {
            // Google OAuth thành công — backend đã redirect kèm token
            try {
                const userStr = searchParams.get('user');
                const user = userStr ? JSON.parse(decodeURIComponent(userStr)) : { email: '' };
                dispatch(loginSuccess({ user, token, refreshToken: refreshToken || '' }));
                toast.success('Đăng nhập Google thành công! 🎉');
                router.push(getDefaultPostLoginRoute(user, searchParams));
            } catch {
                toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
            }
        }
    }, [searchParams, dispatch, router]);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
        setLoginErrors({});
        setRegisterErrors({});
        setRegisterSuccess(false);
    };

    // ─── Validate login ───────────────────────────────────────────────
    const validateLogin = () => {
        const errors = {};
        if (!loginData.email) errors.email = 'Email không được để trống';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) errors.email = 'Email không hợp lệ';
        if (!loginData.password) errors.password = 'Mật khẩu không được để trống';
        return errors;
    };

    // ─── Validate register ────────────────────────────────────────────
    const validateRegister = () => {
        const errors = {};
        if (!registerData.fullName || registerData.fullName.trim().length < 2)
            errors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
        if (!registerData.email) errors.email = 'Email không được để trống';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) errors.email = 'Email không hợp lệ';
        if (!registerData.password || registerData.password.length < 8)
            errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
        if (registerData.password !== registerData.confirmPassword)
            errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
        return errors;
    };

    // ─── Submit Login ──────────────────────────────────────────────────
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        const errors = validateLogin();
        if (Object.keys(errors).length > 0) {
            setLoginErrors(errors);
            return;
        }
        setLoginErrors({});
        setIsLoading(true);
        dispatch(loginStart());

        try {
            const response = await authApi.login({
                email: loginData.email,
                password: loginData.password,
            });

            // Backend trả về { success, message, data: { accessToken, refreshToken, user } }
            const payload = response?.data || response;
            const token = payload?.accessToken || '';
            const refreshToken = payload?.refreshToken || '';
            const user = payload?.user || null;

            if (!token) {
                throw new Error('Không nhận được access token từ máy chủ.');
            }

            dispatch(loginSuccess({ user, token, refreshToken }));
            toast.success('Đăng nhập thành công! Chào mừng trở lại 👋');

            const redirect = getDefaultPostLoginRoute(user, searchParams);
            router.push(redirect);
        } catch (error) {
            const message = error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
            dispatch(loginFailure(message));
            toast.error(message);

            // Nếu bị khóa tài khoản
            if (error?.status === 423) {
                setLoginErrors({ general: 'Tài khoản đã bị khóa tạm thời do đăng nhập sai nhiều lần.' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Submit Register ───────────────────────────────────────────────
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        const errors = validateRegister();
        if (Object.keys(errors).length > 0) {
            setRegisterErrors(errors);
            return;
        }
        setRegisterErrors({});
        setIsLoading(true);

        try {
            await authApi.register({
                fullName: registerData.fullName.trim(),
                email: registerData.email,
                password: registerData.password,
            });

            setRegisterSuccess(true);
            toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản. 📧');
        } catch (error) {
            const message = error?.message || 'Đăng ký thất bại. Email có thể đã được sử dụng.';
            toast.error(message);

            if (error?.status === 409) {
                setRegisterErrors({ email: 'Email này đã được đăng ký.' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Google OAuth ──────────────────────────────────────────────────
    const handleGoogleLogin = () => {
        // Redirect đến Spring Security OAuth2 endpoint
        window.location.href = `${API_BASE_URL.replace('/api', '')}/oauth2/authorization/google`;
    };

    return (
        <div className={styles.authContainer}>
            {/* Floating travel elements */}
            <div className={styles.floatingElements}>
                <FaPlane className={`${styles.floatingIcon} ${styles.plane}`} />
                <FaUmbrellaBeach className={`${styles.floatingIcon} ${styles.beach}`} />
                <FaMapMarkerAlt className={`${styles.floatingIcon} ${styles.marker}`} />
                <FaPassport className={`${styles.floatingIcon} ${styles.passport}`} />
            </div>

            <div className={styles.authWrapper}>
                <div className={`${styles.cardContainer} ${isFlipped ? styles.flipped : ''}`}>

                    {/* ══════════════ LOGIN CARD ══════════════ */}
                    <div className={`${styles.card} ${styles.cardFront}`}>
                        <div className={styles.logoSection}>
                            <div className={styles.logo}>
                                <FaPlane className={styles.logoIcon} />
                                <span className={styles.logoText}>Tourista</span>
                            </div>
                        </div>

                        <div className={styles.cardHeader}>
                            <h2 className={styles.title}>Xin chào! 👋</h2>
                            <p className={styles.subtitle}>Sẵn sàng cho chuyến phiêu lưu mới chưa?</p>
                        </div>

                        {loginErrors.general && (
                            <div className={styles.alertError}>
                                {loginErrors.general}
                            </div>
                        )}

                        <form onSubmit={handleLoginSubmit} className={styles.form} noValidate>
                            <div className={styles.fieldGroup}>
                                <Input
                                    type="email"
                                    placeholder="Email của bạn"
                                    value={loginData.email}
                                    onChange={(e) => {
                                        setLoginData({ ...loginData, email: e.target.value });
                                        if (loginErrors.email) setLoginErrors({ ...loginErrors, email: '' });
                                    }}
                                    icon={<FaEnvelope />}
                                    required
                                />
                                {loginErrors.email && <span className={styles.fieldError}>{loginErrors.email}</span>}
                            </div>

                            <div className={styles.fieldGroup}>
                                <div className={styles.passwordWrapper}>
                                    <Input
                                        type={showLoginPassword ? 'text' : 'password'}
                                        placeholder="Mật khẩu"
                                        value={loginData.password}
                                        onChange={(e) => {
                                            setLoginData({ ...loginData, password: e.target.value });
                                            if (loginErrors.password) setLoginErrors({ ...loginErrors, password: '' });
                                        }}
                                        icon={<FaLock />}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeBtn}
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                    >
                                        {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {loginErrors.password && <span className={styles.fieldError}>{loginErrors.password}</span>}
                            </div>

                            <div className={styles.forgotPassword}>
                                <a href="/forgot-password">Quên mật khẩu?</a>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth
                                loading={isLoading}
                                className={styles.submitBtn}
                            >
                                Bắt đầu khám phá ✈️
                            </Button>
                        </form>

                        <div className={styles.divider}>
                            <span>Hoặc tiếp tục với</span>
                        </div>

                        <div className={styles.socialButtons}>
                            <button
                                type="button"
                                className={`${styles.socialBtn} ${styles.googleBtn}`}
                                onClick={handleGoogleLogin}
                            >
                                <FaGoogle /> Đăng nhập với Google
                            </button>
                        </div>

                        <div className={styles.switchText}>
                            Chưa có tài khoản?{' '}
                            <button type="button" onClick={handleFlip} className={styles.switchBtn}>
                                Đăng ký ngay 🚀
                            </button>
                        </div>

                        <div className={styles.trustBadge}>
                            <span>🔒 An toàn &amp; Bảo mật</span>
                        </div>
                    </div>

                    {/* ══════════════ REGISTER CARD ══════════════ */}
                    <div className={`${styles.card} ${styles.cardBack}`}>
                        <div className={styles.logoSection}>
                            <div className={styles.logo}>
                                <FaPlane className={styles.logoIcon} />
                                <span className={styles.logoText}>Tourista</span>
                            </div>
                        </div>

                        {registerSuccess ? (
                            /* ── Màn hình thành công ── */
                            <div className={styles.successScreen}>
                                <FaCheckCircle className={styles.successIcon} />
                                <h3 className={styles.successTitle}>Đăng ký thành công! 🎉</h3>
                                <p className={styles.successDesc}>
                                    Chúng tôi đã gửi email xác thực đến <strong>{registerData.email}</strong>.
                                    Vui lòng kiểm tra hộp thư và click vào link xác thực trước khi đăng nhập.
                                </p>
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onClick={() => {
                                        setRegisterSuccess(false);
                                        setRegisterData({ fullName: '', email: '', password: '', confirmPassword: '' });
                                        setIsFlipped(false);
                                    }}
                                    className={styles.submitBtn}
                                >
                                    Đến trang đăng nhập
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className={styles.cardHeader}>
                                    <h2 className={styles.title}>Cùng đi du lịch nào! 🌍</h2>
                                    <p className={styles.subtitle}>Tạo tài khoản để bắt đầu hành trình</p>
                                </div>

                                <form onSubmit={handleRegisterSubmit} className={styles.form} noValidate>
                                    <div className={styles.fieldGroup}>
                                        <Input
                                            type="text"
                                            placeholder="Họ và tên"
                                            value={registerData.fullName}
                                            onChange={(e) => {
                                                setRegisterData({ ...registerData, fullName: e.target.value });
                                                if (registerErrors.fullName) setRegisterErrors({ ...registerErrors, fullName: '' });
                                            }}
                                            icon={<FaUser />}
                                            required
                                        />
                                        {registerErrors.fullName && <span className={styles.fieldError}>{registerErrors.fullName}</span>}
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Input
                                            type="email"
                                            placeholder="Email của bạn"
                                            value={registerData.email}
                                            onChange={(e) => {
                                                setRegisterData({ ...registerData, email: e.target.value });
                                                if (registerErrors.email) setRegisterErrors({ ...registerErrors, email: '' });
                                            }}
                                            icon={<FaEnvelope />}
                                            required
                                        />
                                        {registerErrors.email && <span className={styles.fieldError}>{registerErrors.email}</span>}
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <div className={styles.passwordWrapper}>
                                            <Input
                                                type={showRegPassword ? 'text' : 'password'}
                                                placeholder="Mật khẩu (tối thiểu 8 ký tự)"
                                                value={registerData.password}
                                                onChange={(e) => {
                                                    setRegisterData({ ...registerData, password: e.target.value });
                                                    if (registerErrors.password) setRegisterErrors({ ...registerErrors, password: '' });
                                                }}
                                                icon={<FaLock />}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className={styles.eyeBtn}
                                                onClick={() => setShowRegPassword(!showRegPassword)}
                                            >
                                                {showRegPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                        {registerErrors.password && <span className={styles.fieldError}>{registerErrors.password}</span>}
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <div className={styles.passwordWrapper}>
                                            <Input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="Xác nhận mật khẩu"
                                                value={registerData.confirmPassword}
                                                onChange={(e) => {
                                                    setRegisterData({ ...registerData, confirmPassword: e.target.value });
                                                    if (registerErrors.confirmPassword) setRegisterErrors({ ...registerErrors, confirmPassword: '' });
                                                }}
                                                icon={<FaLock />}
                                                required
                                            />
                                            <button
                                                type="button"
                                                className={styles.eyeBtn}
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                        {registerErrors.confirmPassword && <span className={styles.fieldError}>{registerErrors.confirmPassword}</span>}
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        fullWidth
                                        loading={isLoading}
                                        className={styles.submitBtn}
                                    >
                                        Đăng ký ngay 🎒
                                    </Button>
                                </form>

                                <div className={styles.divider}>
                                    <span>Hoặc đăng ký với</span>
                                </div>

                                <div className={styles.socialButtons}>
                                    <button
                                        type="button"
                                        className={`${styles.socialBtn} ${styles.googleBtn}`}
                                        onClick={handleGoogleLogin}
                                    >
                                        <FaGoogle /> Đăng ký với Google
                                    </button>
                                </div>

                                <div className={styles.switchText}>
                                    Đã có tài khoản?{' '}
                                    <button type="button" onClick={handleFlip} className={styles.switchBtn}>
                                        Đăng nhập ngay 👆
                                    </button>
                                </div>

                                <div className={styles.trustBadge}>
                                    <span>🔒 An toàn &amp; Bảo mật</span>
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AuthPage;
