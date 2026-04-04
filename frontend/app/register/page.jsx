import { Suspense } from 'react';
import AuthPage from '@/components/Auth/AuthPage';

export default function RegisterPage() {
    return (
        <Suspense fallback={null}>
            <AuthPage initialMode="register" />
        </Suspense>
    );
}
