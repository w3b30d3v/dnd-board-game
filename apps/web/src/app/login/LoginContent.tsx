'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useGuestOnly } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export default function LoginContent() {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-vignette pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <h1
              className="text-4xl font-display text-primary transition-transform duration-200 group-hover:scale-[1.02]"
              style={{
                textShadow: '0 0 20px rgba(245, 158, 11, 0.5)'
              }}
            >
              D&D Board
            </h1>
          </Link>
          <p className="text-text-muted mt-2">
            Your adventure awaits
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 hover:shadow-glow transition-shadow duration-300">
          <h2 className="text-2xl font-display text-center mb-6 text-text-primary">
            Welcome Back
          </h2>

          <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />

          <div className="divider">
            <span>or continue with</span>
          </div>

          <OAuthButtons disabled={isLoading} />

          <p className="mt-6 text-center text-text-secondary text-sm">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-primary hover:text-primary-400 transition-colors duration-200 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer text */}
        <p className="text-center text-text-muted text-xs mt-6">
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
