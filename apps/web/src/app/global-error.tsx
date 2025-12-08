'use client';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-bg-primary text-text-primary">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-6xl font-bold text-red-500">Error</h1>
            <h2 className="text-2xl text-white">Something went wrong</h2>
            <p className="text-gray-400">
              A critical error occurred. Please refresh the page.
            </p>
            <button
              onClick={reset}
              className="bg-amber-500 text-black px-6 py-3 rounded-lg font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
