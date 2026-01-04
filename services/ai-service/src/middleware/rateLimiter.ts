// Rate Limiter Middleware
// Simple in-memory rate limiter for AI generation endpoints

import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production for multiple instances)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Prefix for the rate limit key
}

/**
 * Create a rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyPrefix = 'rl' } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: { userId: string } }).user;

    if (!user?.userId) {
      // No user, skip rate limiting (auth middleware should handle this)
      return next();
    }

    const key = `${keyPrefix}:${user.userId}`;
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    // Initialize or reset if window expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    // Check if over limit
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      logger.warn({
        userId: user.userId,
        key,
        count: entry.count,
        maxRequests,
        retryAfter,
      }, 'Rate limit exceeded');

      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
        retryAfter,
      });
      return;
    }

    // Add rate limit headers
    res.set('X-RateLimit-Limit', String(maxRequests));
    res.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
    res.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));

    next();
  };
}

// Pre-configured rate limiters for different endpoints

/**
 * Rate limiter for chat messages (higher limit)
 * 30 messages per minute per user
 */
export const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 30,
  keyPrefix: 'chat',
});

/**
 * Rate limiter for content generation (lower limit, more expensive)
 * 10 generations per minute per user
 */
export const generationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 10,
  keyPrefix: 'gen',
});

/**
 * Rate limiter for video generation (very expensive, low limit)
 * 3 videos per 5 minutes per user
 */
export const videoRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  maxRequests: 3,
  keyPrefix: 'video',
});

/**
 * Rate limiter for voice generation
 * 10 narrations per minute per user
 */
export const voiceRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 10,
  keyPrefix: 'voice',
});
