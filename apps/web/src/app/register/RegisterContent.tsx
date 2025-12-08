'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useGuestOnly } from '@/hooks/useAuth';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export default function RegisterContent() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();
  const { isLoading: checkingAuth } = useGuestOnly('/dashboard');

  const handleRegister = async (
    email: string,
    username: string,
    password: string,
    displayName: string
  ) => {
    clearError();
    const success = await register(email, username, password, displayName);
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
            Begin your journey
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 hover:shadow-glow transition-shadow duration-300">
          <h2 className="text-2xl font-display text-center mb-6 text-text-primary">
            Create Your Account
          </h2>

          <RegisterForm onSubmit={handleRegister} isLoading={isLoading} error={error} />

          <div className="divider">
            <span>or continue with</span>
          </div>

          <OAuthButtons disabled={isLoading} />

          <p className="mt-6 text-center text-text-secondary text-sm">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary hover:text-primary-400 transition-colors duration-200 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer text */}
        <p className="text-center text-text-muted text-xs mt-6">
          By creating an account, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
