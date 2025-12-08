import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-8 max-w-4xl">
        <h1 className="heading-1 text-5xl">D&D Digital Board Game</h1>
        <p className="text-xl text-text-secondary">
          A cinematic, multiplayer, AI-powered D&D 5e digital board game platform
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <Link href="/register" className="btn-primary">
            Get Started
          </Link>
          <Link href="/login" className="btn-outline">
            Sign In
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="card">
            <h3 className="heading-3 text-lg mb-2">RAW 5e Rules</h3>
            <p className="text-text-secondary">
              Authentic D&D 5th Edition mechanics implemented exactly as written.
            </p>
          </div>

          <div className="card">
            <h3 className="heading-3 text-lg mb-2">Real-time Multiplayer</h3>
            <p className="text-text-secondary">
              Play with friends in synchronized sessions with WebSocket support.
            </p>
          </div>

          <div className="card">
            <h3 className="heading-3 text-lg mb-2">AI-Powered Content</h3>
            <p className="text-text-secondary">
              Generate character portraits, maps, and story elements with AI.
            </p>
          </div>
        </div>

        <div className="mt-12 p-4 bg-bg-light rounded-lg border border-primary/30">
          <p className="text-sm text-text-muted">
            Phase 1 Complete - Authentication Ready
          </p>
        </div>
      </div>
    </main>
  );
}
