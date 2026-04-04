import { Suspense } from 'react';
import AuthPage from '@/components/Auth/AuthPage';

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <AuthPage initialMode="login" />
        </Suspense>
    );
}
