'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MapEditorContent = dynamic(() => import('./MapEditorContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center">
      <div className="w-12 h-12 spinner" />
    </div>
  ),
});

export default function MapEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-dark flex items-center justify-center">
          <div className="w-12 h-12 spinner" />
        </div>
      }
    >
      <MapEditorContent />
    </Suspense>
  );
}
