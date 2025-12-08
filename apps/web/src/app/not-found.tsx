import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-6xl font-display text-primary">404</h1>
        <h2 className="text-2xl font-display text-text-primary">Page Not Found</h2>
        <p className="text-text-secondary">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/" className="btn-primary inline-block mt-4">
          Return Home
        </Link>
      </div>
    </div>
  );
}
