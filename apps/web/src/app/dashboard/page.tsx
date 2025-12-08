import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { unstable_noStore as noStore } from 'next/cache';

const DashboardContent = dynamic(() => import('./DashboardContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 spinner" />
    </div>
  ),
});

export default function DashboardPage() {
  noStore();
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 spinner" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
