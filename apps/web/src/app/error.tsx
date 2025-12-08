'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-6xl font-display text-error">Oops!</h1>
        <h2 className="text-2xl font-display text-text-primary">Something went wrong</h2>
        <p className="text-text-secondary">
          An unexpected error occurred. Please try again.
        </p>
        <button onClick={reset} className="btn-primary mt-4">
          Try Again
        </button>
      </div>
    </div>
  );
}
