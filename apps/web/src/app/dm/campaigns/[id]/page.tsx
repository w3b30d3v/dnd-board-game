import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { unstable_noStore as noStore } from 'next/cache';

const CampaignEditorContent = dynamic(() => import('./CampaignEditorContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 spinner" />
    </div>
  ),
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignEditorPage({ params }: PageProps) {
  noStore();
  const { id } = await params;

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 spinner" />
      </div>
    }>
      <CampaignEditorContent campaignId={id} />
    </Suspense>
  );
}
