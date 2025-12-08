'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { CharacterWizard } from '@/components/character-builder/CharacterWizard';

// Dynamic import for particles
const AmbientParticles = dynamic(
  () => import('@/components/dnd/AmbientParticles').then((mod) => mod.AmbientParticles),
  { ssr: false }
);

export default function CharacterCreateContent() {
  const { user, isLoading } = useRequireAuth('/login');

  if (isLoading || !user) {
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

      {/* Particles - magical for character creation */}
      <Suspense fallback={null}>
        <AmbientParticles variant="magic" />
      </Suspense>

      {/* Vignette */}
      <div className="dnd-vignette" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="glass border-b border-border/50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="group">
                <span className="dnd-heading-epic text-2xl pb-0 logo-glow-pulse">
                  D&D Board
                </span>
              </Link>

              <nav className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-text-secondary hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 text-center animate-fade-in-up">
            <h1 className="dnd-heading-epic text-4xl pb-4">
              Character Creation
            </h1>
            <p className="text-text-secondary dnd-flavor max-w-2xl mx-auto">
              &quot;Every hero begins their journey with a single step. Choose wisely, for these decisions will shape your destiny.&quot;
            </p>
          </div>

          <CharacterWizard />
        </main>
      </div>
    </div>
  );
}
