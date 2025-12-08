import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { unstable_noStore as noStore } from 'next/cache';

const RegisterContent = dynamic(() => import('./RegisterContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 spinner" />
    </div>
  ),
});

export default function RegisterPage() {
  noStore();
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 spinner" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
