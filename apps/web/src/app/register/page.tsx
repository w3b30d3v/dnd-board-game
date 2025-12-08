'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useGuestOnly } from '@/hooks/useAuth';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();
  const { isLoading: checkingAuth } = useGuestOnly('/dashboard');

  const handleRegister = async (
    email: string,
    username: string,
    password: string,
    displayName: string
  ) => {
    clearError();
    const success = await register(email, username, password, displayName);
    if (success) {
      router.push('/dashboard');
    }
    return success;
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-dark">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-cinzel text-primary">D&D Board</h1>
          </Link>
        </div>

        <div className="bg-bg-medium rounded-xl border border-border p-8">
          <h2 className="text-2xl font-cinzel text-center mb-6">Create Your Account</h2>

          <RegisterForm onSubmit={handleRegister} isLoading={isLoading} error={error} />

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-4 text-text-muted text-sm">or continue with</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          <OAuthButtons disabled={isLoading} />

          <p className="mt-6 text-center text-text-secondary text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
