'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../../src/store/slices/authSlice';
import authApi from '../../../src/api/authApi';

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
        const code = searchParams.get('code');

        if (!code) {
            // Không có code → về trang login
            router.replace('/login?error=oauth_failed');
            return;
        }

        const exchange = async () => {
            try {
                const response = await authApi.exchangeOAuth2Code(code);
                const payload = response?.data || response;
                const accessToken = payload?.accessToken;
                const refreshToken = payload?.refreshToken;
                const user = payload?.user || null;

                if (!accessToken || !refreshToken || !user) {
                    throw new Error('OAuth2 exchange payload is invalid.');
                }

                dispatch(loginSuccess({
                    token: accessToken,
                    refreshToken,
                    user,
                }));

                const role = String(user?.role || '').toUpperCase();
                const destination = role === 'ADMIN' || role === 'ROLE_ADMIN' ? '/admin' : '/';
                router.replace(destination);
            } catch (err) {
                // Log chi tiết để debug
                const errorMessage = err?.response?.data?.message || err?.message || 'Không thể kết nối máy chủ OAuth2';
                console.error('OAuth2 callback exchange error:', {
                    message: errorMessage,
                    status: err?.response?.status,
                    code: err?.code,
                    fullError: err,
                });
                router.replace(`/login?error=${encodeURIComponent(errorMessage)}`);
            }
        };

        exchange();
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
