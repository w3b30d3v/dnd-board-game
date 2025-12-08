'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { EnchantedCard } from '@/components/dnd/EnchantedCard';
import { OrnateCorners } from '@/components/dnd/OrnateCorners';

// Dynamic import for particles
const AmbientParticles = dynamic(
  () => import('@/components/dnd/AmbientParticles').then((mod) => mod.AmbientParticles),
  { ssr: false }
);

export default function DashboardContent() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth('/login');
  const logout = useAuthStore(state => state.logout);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="dnd-page-background" />
        <div className="w-16 h-16 spinner border-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Multi-layer background */}
      <div className="dnd-page-background" />

      {/* Particles - dust for dashboard */}
      <Suspense fallback={null}>
        <AmbientParticles variant="dust" />
      </Suspense>

      {/* Vignette */}
      <div className="dnd-vignette" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="glass border-b border-border/50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="group">
                <span className="dnd-heading-epic text-2xl pb-0 logo-glow-pulse">
                  D&D Board
                </span>
              </Link>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-text-muted">Welcome back,</p>
                  <p className="font-medium text-primary">{user.displayName}</p>
                </div>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-bg-primary font-bold transition-transform duration-200 hover:scale-110 shadow-glow">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>

                <button
                  onClick={handleLogout}
                  className="btn-stone text-sm px-4 py-2"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 animate-fade-in-up">
            <h1 className="dnd-heading-epic text-4xl pb-4">
              Your Quest Board
            </h1>
            <p className="text-text-secondary dnd-flavor">
              &quot;What adventure calls to you today, brave {user.displayName}?&quot;
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {/* Characters Card */}
            <EnchantedCard showCorners hover>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center transition-transform duration-200 group-hover:rotate-3 group-hover:scale-110">
                  <span className="text-2xl">⚔️</span>
                </div>
                <div>
                  <h3 className="dnd-heading-section text-lg mb-0 border-none pb-0">
                    My Heroes
                  </h3>
                  <p className="text-sm text-text-muted">0 characters</p>
                </div>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                Create and manage your D&D 5e characters with the full character builder.
              </p>
              <button className="btn-adventure w-full" disabled>
                Coming in Phase 2
              </button>
            </EnchantedCard>

            {/* Campaigns Card */}
            <EnchantedCard variant="magical" showCorners hover>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-110">
                  <span className="text-2xl">📜</span>
                </div>
                <div>
                  <h3 className="dnd-heading-section text-lg mb-0 border-none pb-0" style={{ color: '#A78BFA' }}>
                    Campaigns
                  </h3>
                  <p className="text-sm text-text-muted">0 campaigns</p>
                </div>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                Join existing campaigns or create your own adventure as a Dungeon Master.
              </p>
              <button className="btn-magic w-full" disabled>
                Coming in Phase 6
              </button>
            </EnchantedCard>

            {/* Quick Play Card */}
            <EnchantedCard variant="legendary" showCorners hover>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center transition-transform duration-200 group-hover:rotate-3 group-hover:scale-110">
                  <span className="text-2xl">🎲</span>
                </div>
                <div>
                  <h3 className="dnd-heading-section text-lg mb-0 border-none pb-0">
                    Quick Play
                  </h3>
                  <p className="text-sm text-text-muted">Jump right in</p>
                </div>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                Start a quick game session with pre-made characters and scenarios.
              </p>
              <button className="btn-stone w-full" disabled>
                Coming in Phase 5
              </button>
            </EnchantedCard>
          </div>

          {/* Account Info Section */}
          <div className="mt-12 animate-fade-in-up">
            <div className="dnd-divider mb-8" />
            <h2 className="dnd-heading-section text-xl mb-6">
              Hero&apos;s Chronicle
            </h2>
            <EnchantedCard className="relative">
              <OrnateCorners variant="gold" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-text-muted mb-1">Email</p>
                  <p className="text-text-primary font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Username</p>
                  <p className="text-primary font-medium">@{user.username}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Display Name</p>
                  <p className="text-text-primary font-medium">{user.displayName}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted mb-1">Adventure Began</p>
                  <p className="text-text-primary font-medium">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </EnchantedCard>
          </div>
        </main>
      </div>
    </div>
  );
}
