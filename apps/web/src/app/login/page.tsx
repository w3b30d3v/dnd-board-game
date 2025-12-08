'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useGuestOnly } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const { isLoading: checkingAuth } = useGuestOnly('/dashboard');

  const handleLogin = async (email: string, password: string) => {
    clearError();
    const success = await login(email, password);
    if (success) {
      router.push('/dashboard');
    }
    return success;
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-cinzel text-primary">D&D Board</h1>
          </Link>
        </div>

        <div className="bg-bg-medium rounded-xl border border-border p-8">
          <h2 className="text-2xl font-cinzel text-center mb-6">Welcome Back</h2>

          <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-4 text-text-muted text-sm">or continue with</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          <OAuthButtons disabled={isLoading} />

          <p className="mt-6 text-center text-text-secondary text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
