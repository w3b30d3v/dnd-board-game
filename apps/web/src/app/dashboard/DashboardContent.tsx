'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Header */}
      <header className="glass border-b border-border/50 animate-slide-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="group">
              <span
                className="text-2xl font-display text-primary transition-transform duration-200 inline-block group-hover:scale-[1.02]"
                style={{ textShadow: '0 0 20px rgba(245, 158, 11, 0.3)' }}
              >
                D&D Board
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-text-muted">Welcome back,</p>
                <p className="font-medium text-text-primary">{user.displayName}</p>
              </div>

              <div
                className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center text-bg-primary font-bold transition-transform duration-200 hover:scale-110"
              >
                {user.displayName.charAt(0).toUpperCase()}
              </div>

              <button
                onClick={handleLogout}
                className="btn-ghost text-sm px-4 py-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="heading-1 mb-8 animate-fade-in-up">
          Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Characters Card */}
          <div className="card-hover group animate-fade-in-up animation-delay-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center transition-transform duration-200 group-hover:rotate-3 group-hover:scale-110">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-lg text-text-primary group-hover:text-primary transition-colors">
                  My Characters
                </h3>
                <p className="text-sm text-text-muted">0 characters</p>
              </div>
            </div>
            <p className="text-text-secondary text-sm">
              Create and manage your D&D 5e characters with the full character builder.
            </p>
            <button
              className="btn-primary w-full mt-4"
              disabled
            >
              Coming in Phase 2
            </button>
          </div>

          {/* Campaigns Card */}
          <div className="card-hover group animate-fade-in-up animation-delay-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-110">
                <svg
                  className="w-6 h-6 text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-lg text-text-primary group-hover:text-secondary transition-colors">
                  Campaigns
                </h3>
                <p className="text-sm text-text-muted">0 campaigns</p>
              </div>
            </div>
            <p className="text-text-secondary text-sm">
              Join existing campaigns or create your own adventure as a Dungeon Master.
            </p>
            <button
              className="btn-secondary w-full mt-4"
              disabled
            >
              Coming in Phase 6
            </button>
          </div>

          {/* Quick Play Card */}
          <div className="card-hover group animate-fade-in-up animation-delay-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-info/20 flex items-center justify-center transition-transform duration-200 group-hover:rotate-3 group-hover:scale-110">
                <svg
                  className="w-6 h-6 text-info"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-lg text-text-primary group-hover:text-info transition-colors">
                  Quick Play
                </h3>
                <p className="text-sm text-text-muted">Jump right in</p>
              </div>
            </div>
            <p className="text-text-secondary text-sm">
              Start a quick game session with pre-made characters and scenarios.
            </p>
            <button
              className="btn-outline w-full mt-4"
              disabled
            >
              Coming in Phase 5
            </button>
          </div>
        </div>

        {/* Account Info Section */}
        <div className="mt-12 animate-fade-in-up animation-delay-400">
          <h2 className="font-display text-xl mb-4 text-text-primary">
            Account Information
          </h2>
          <div className="card hover:shadow-lg transition-shadow duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-text-muted mb-1">Email</p>
                <p className="text-text-primary">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">Username</p>
                <p className="text-text-primary">@{user.username}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">Display Name</p>
                <p className="text-text-primary">{user.displayName}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted mb-1">Member Since</p>
                <p className="text-text-primary">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
