'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { EnchantedCard } from '@/components/dnd/EnchantedCard';
import { OrnateCorners } from '@/components/dnd/OrnateCorners';

// Dynamic import for particles to avoid SSR issues
const AmbientParticles = dynamic(
  () => import('@/components/dnd/AmbientParticles').then((mod) => mod.AmbientParticles),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Multi-layer background */}
      <div className="dnd-page-background" />

      {/* Particles */}
      <Suspense fallback={null}>
        <AmbientParticles variant="dust" />
      </Suspense>

      {/* Vignette */}
      <div className="dnd-vignette" />

      {/* Main content */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center space-y-8 max-w-4xl animate-fade-in-up">
          {/* Epic Title */}
          <div className="relative inline-block">
            <h1 className="dnd-heading-epic text-5xl md:text-6xl lg:text-7xl pb-4">
              D&D Digital Board Game
            </h1>
          </div>

          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            A cinematic, multiplayer D&D 5e digital board game platform.
            <span className="block mt-2 dnd-flavor">
              &quot;Your adventure awaits, brave hero...&quot;
            </span>
          </p>

          {/* Call to Action Buttons */}
          <div className="flex gap-4 justify-center mt-8">
            <Link href="/register" className="btn-adventure">
              Begin Your Journey
            </Link>
            <Link href="/login" className="btn-stone">
              Return to the Realm
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 stagger-children">
            <EnchantedCard hover showCorners>
              <div className="text-center">
                <div className="text-4xl mb-4">⚔️</div>
                <h3 className="dnd-heading-section text-lg mb-2">RAW 5e Rules</h3>
                <p className="text-text-secondary text-sm">
                  Authentic D&D 5th Edition mechanics implemented exactly as written.
                </p>
              </div>
            </EnchantedCard>

            <EnchantedCard variant="magical" hover showCorners>
              <div className="text-center">
                <div className="text-4xl mb-4">🎭</div>
                <h3 className="dnd-heading-section text-lg mb-2">Real-time Multiplayer</h3>
                <p className="text-text-secondary text-sm">
                  Play with friends in synchronized sessions with WebSocket support.
                </p>
              </div>
            </EnchantedCard>

            <EnchantedCard variant="legendary" hover showCorners>
              <div className="text-center">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="dnd-heading-section text-lg mb-2">Dynamic Content</h3>
                <p className="text-text-secondary text-sm">
                  Generate character portraits, maps, and story elements automatically.
                </p>
              </div>
            </EnchantedCard>
          </div>

          {/* Status Badge */}
          <div className="mt-12 relative">
            <div className="dnd-divider" />
            <div className="enchanted-card inline-block px-6 py-3">
              <OrnateCorners variant="gold" />
              <p className="text-sm text-primary font-medium">
                ✨ Phase 1 Complete — Authentication Ready
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
