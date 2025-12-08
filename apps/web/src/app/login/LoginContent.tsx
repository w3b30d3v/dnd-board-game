'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useAuth, useGuestOnly } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { EnchantedCard } from '@/components/dnd/EnchantedCard';

// Dynamic import for particles
const AmbientParticles = dynamic(
  () => import('@/components/dnd/AmbientParticles').then((mod) => mod.AmbientParticles),
  { ssr: false }
);

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
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="dnd-page-background" />
        <div className="w-16 h-16 spinner border-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Multi-layer background */}
      <div className="dnd-page-background" />

      {/* Particles - magical for login */}
      <Suspense fallback={null}>
        <AmbientParticles variant="magic" />
      </Suspense>

      {/* Vignette */}
      <div className="dnd-vignette" />

      {/* Content */}
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block group">
              <h1 className="dnd-heading-epic text-4xl pb-2 logo-glow-pulse">
                D&D Board
              </h1>
            </Link>
            <p className="text-text-muted mt-2 dnd-flavor">
              &quot;Return to your adventure, brave hero...&quot;
            </p>
          </div>

          {/* Card */}
          <EnchantedCard className="p-8" showCorners>
            <h2 className="text-2xl font-display text-center mb-6 text-text-primary">
              Welcome Back
            </h2>

            <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />

            <div className="dnd-divider my-6" />

            <OAuthButtons disabled={isLoading} />

            <p className="mt-6 text-center text-text-secondary text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-primary hover:text-primary-400 transition-colors duration-200 hover:underline"
              >
                Begin your journey
              </Link>
            </p>
          </EnchantedCard>

          {/* Footer text */}
          <p className="text-center text-text-muted text-xs mt-6">
            By signing in, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
