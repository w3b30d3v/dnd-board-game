'use client';

import { ReactNode, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for particles to avoid SSR issues
const AmbientParticles = dynamic(
  () => import('./AmbientParticles').then((mod) => mod.AmbientParticles),
  { ssr: false }
);

interface DNDPageLayoutProps {
  children: ReactNode;
  particles?: 'dust' | 'magic' | 'embers' | 'none';
  className?: string;
}

export function DNDPageLayout({
  children,
  particles = 'dust',
  className = '',
}: DNDPageLayoutProps) {
  return (
    <div className={`min-h-screen relative ${className}`}>
      {/* Layer 1: Textured background */}
      <div className="dnd-page-background" />

      {/* Layer 2: Ambient particles */}
      {particles !== 'none' && (
        <Suspense fallback={null}>
          <AmbientParticles variant={particles} />
        </Suspense>
      )}

      {/* Layer 3: Vignette overlay */}
      <div className="dnd-vignette" />

      {/* Layer 4: Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
