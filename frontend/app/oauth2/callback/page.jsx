'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../../src/store/slices/authSlice';

// Loading spinner (dùng chung cho Suspense fallback và CallbackHandler)
const Spinner = () => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '16px',
        fontFamily: 'sans-serif',
        color: '#555',
    }}>
        <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e0e0e0',
            borderTop: '3px solid #4285F4',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
        }} />
        <p>Đang xử lý đăng nhập Google...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

// Component thực sự xử lý OAuth2
// Phải tách riêng vì useSearchParams() cần được wrap trong Suspense
function CallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useDispatch();

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        if (!accessToken) {
            // Không có token → về trang login
            router.replace('/login?error=oauth_failed');
            return;
        }

        try {
            // Decode JWT payload để lấy thông tin user (email, role)
            const payload = JSON.parse(atob(accessToken.split('.')[1]));

            const user = {
                email: payload.sub,
                role: payload.role,
            };

            // Lưu vào Redux store — authSlice sẽ tự persist vào localStorage
            dispatch(loginSuccess({
                token: accessToken,
                refreshToken: refreshToken,
                user: user,
            }));

            // Redirect về trang chủ sau khi lưu session
            router.replace('/');
        } catch (err) {
            console.error('OAuth2 callback error:', err);
            router.replace('/login?error=oauth_failed');
        }
    }, [searchParams, dispatch, router]);

    return <Spinner />;
}

// Default export: bọc Suspense để Next.js App Router hỗ trợ useSearchParams
export default function OAuth2CallbackPage() {
    return (
        <Suspense fallback={<Spinner />}>
            <CallbackHandler />
        </Suspense>
    );
}
