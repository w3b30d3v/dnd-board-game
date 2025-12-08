import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { unstable_noStore as noStore } from 'next/cache';

const LoginContent = dynamic(() => import('./LoginContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 spinner" />
    </div>
  ),
});

export default function LoginPage() {
  noStore();
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 spinner" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
