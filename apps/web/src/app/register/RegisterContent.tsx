'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useAuth, useGuestOnly } from '@/hooks/useAuth';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { EnchantedCard } from '@/components/dnd/EnchantedCard';

// Dynamic import for particles
const AmbientParticles = dynamic(
  () => import('@/components/dnd/AmbientParticles').then((mod) => mod.AmbientParticles),
  { ssr: false }
);

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

      {/* Particles - embers for registration (starting a new fire) */}
      <Suspense fallback={null}>
        <AmbientParticles variant="embers" />
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
              &quot;A new hero rises from the ashes...&quot;
            </p>
          </div>

          {/* Card */}
          <EnchantedCard variant="legendary" className="p-8" showCorners>
            <h2 className="text-2xl font-display text-center mb-6 text-text-primary">
              Create Your Legend
            </h2>

            <RegisterForm onSubmit={handleRegister} isLoading={isLoading} error={error} />

            <div className="dnd-divider my-6" />

            <OAuthButtons disabled={isLoading} />

            <p className="mt-6 text-center text-text-secondary text-sm">
              Already a hero?{' '}
              <Link
                href="/login"
                className="text-primary hover:text-primary-400 transition-colors duration-200 hover:underline"
              >
                Return to battle
              </Link>
            </p>
          </EnchantedCard>

          {/* Footer text */}
          <p className="text-center text-text-muted text-xs mt-6">
            By creating an account, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
