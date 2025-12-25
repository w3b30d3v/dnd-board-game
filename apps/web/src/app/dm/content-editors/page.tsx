'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ContentEditorHubContent = dynamic(() => import('./ContentEditorHubContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center">
      <div className="w-12 h-12 spinner" />
    </div>
  ),
});

export default function ContentEditorHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-dark flex items-center justify-center">
          <div className="w-12 h-12 spinner" />
        </div>
      }
    >
      <ContentEditorHubContent />
    </Suspense>
  );
}
