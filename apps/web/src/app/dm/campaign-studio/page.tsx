'use client';

import { Suspense } from 'react';
import CampaignStudioContent from './CampaignStudioContent';

export default function CampaignStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-dark flex items-center justify-center">
          <div className="w-12 h-12 spinner" />
        </div>
      }
    >
      <CampaignStudioContent />
    </Suspense>
  );
}
