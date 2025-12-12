'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamic import to avoid SSR issues with PixiJS
const GameBoardTest = dynamic(
  () => import('./GameBoardTest').then((mod) => mod.GameBoardTest),
  { ssr: false }
);

export default function GameTestPage() {
  return (
    <div className="min-h-screen bg-bg-dark">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 spinner border-4 mx-auto mb-4" />
              <p className="text-text-secondary">Loading Game Board...</p>
            </div>
          </div>
        }
      >
        <GameBoardTest />
      </Suspense>
    </div>
  );
}
