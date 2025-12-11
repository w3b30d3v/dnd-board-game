'use client';

import { Suspense } from 'react';
import CharacterDetailsContent from './CharacterDetailsContent';

export default function CharacterDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CharacterDetailsContent />
    </Suspense>
  );
}
