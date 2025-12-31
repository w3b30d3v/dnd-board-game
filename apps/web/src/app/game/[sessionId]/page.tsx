'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { ImmersiveProvider } from '@/components/immersion/ImmersiveProvider';
import { AmbientParticles } from '@/components/dnd/AmbientParticles';
import { AtmosphericBackground } from '@/components/dnd/AtmosphericBackground';

// Dynamic import to avoid SSR issues with PixiJS
const GameSessionContent = dynamic(
  () => import('./GameSessionContent').then((mod) => mod.GameSessionContent),
  { ssr: false }
);

export default function GameSessionPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <p className="text-text-secondary">Invalid session ID</p>
      </div>
    );
  }

  return (
    <ImmersiveProvider>
      <AtmosphericBackground theme="dungeon" intensity="medium" showParticles={false}>
        <div className="min-h-screen relative overflow-hidden">
          {/* Ambient Particles */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <AmbientParticles variant="dust" />
          </div>

          {/* Main Content */}
          <div className="relative z-10">
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 spinner border-4 mx-auto mb-4" />
                    <p className="text-text-secondary">Loading Game Session...</p>
                  </div>
                </div>
              }
            >
              <GameSessionContent sessionId={sessionId} />
            </Suspense>
          </div>
        </div>
      </AtmosphericBackground>
    </ImmersiveProvider>
  );
}
