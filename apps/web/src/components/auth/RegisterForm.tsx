'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, underscores, and hyphens'
      ),
    displayName: z.string().min(1, 'Display name is required').max(50),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSubmit: (
    email: string,
    username: string,
    password: string,
    displayName: string
  ) => Promise<boolean>;
  isLoading?: boolean;
  error?: string | null;
}

export function RegisterForm({ onSubmit, isLoading, error }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const handleFormSubmit = async (data: RegisterFormData) => {
    await onSubmit(data.email, data.username, data.password, data.displayName);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-4"
    >
      {error && (
        <div className="p-4 bg-error/10 border border-error/50 rounded-lg text-error text-sm flex items-center gap-2 animate-shake">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="animate-fade-in-up animation-delay-100">
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className={`input transition-transform duration-150 focus:scale-[1.01] ${errors.email ? 'input-error' : ''}`}
          placeholder="adventurer@example.com"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="error-message animate-fade-in">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="animate-fade-in-up animation-delay-150">
        <label htmlFor="username" className="label">
          Username
        </label>
        <input
          id="username"
          type="text"
          {...register('username')}
          className={`input transition-transform duration-150 focus:scale-[1.01] ${errors.username ? 'input-error' : ''}`}
          placeholder="dragon_slayer"
          disabled={isLoading}
        />
        {errors.username && (
          <p className="error-message animate-fade-in">
            {errors.username.message}
          </p>
        )}
      </div>

      <div className="animate-fade-in-up animation-delay-200">
        <label htmlFor="displayName" className="label">
          Display Name
        </label>
        <input
          id="displayName"
          type="text"
          {...register('displayName')}
          className={`input transition-transform duration-150 focus:scale-[1.01] ${errors.displayName ? 'input-error' : ''}`}
          placeholder="Sir Reginald the Brave"
          disabled={isLoading}
        />
        {errors.displayName && (
          <p className="error-message animate-fade-in">
            {errors.displayName.message}
          </p>
        )}
      </div>

      <div className="animate-fade-in-up animation-delay-250">
        <label htmlFor="password" className="label">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            className={`input pr-12 transition-transform duration-150 focus:scale-[1.01] ${errors.password ? 'input-error' : ''}`}
            placeholder="Min. 8 characters"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary p-1 rounded transition-all duration-200 hover:scale-110 active:scale-95"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p className="error-message animate-fade-in">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="animate-fade-in-up animation-delay-300">
        <label htmlFor="confirmPassword" className="label">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          {...register('confirmPassword')}
          className={`input transition-transform duration-150 focus:scale-[1.01] ${errors.confirmPassword ? 'input-error' : ''}`}
          placeholder="Confirm your password"
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="error-message animate-fade-in">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="animate-fade-in-up animation-delay-350">
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="-ml-1 mr-2 h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creating account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </div>
    </form>
  );
}
