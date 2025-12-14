import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

interface JwtPayload {
  userId: string;
  displayName?: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  userId: string;
  displayName: string;
}

/**
 * Validate a JWT access token
 * Returns user info if valid, null if invalid
 */
export function validateToken(token: string): AuthenticatedUser | null {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Only accept access tokens
    if (payload.type !== 'access') {
      logger.warn('Invalid token type', { type: payload.type });
      return null;
    }

    return {
      userId: payload.userId,
      displayName: payload.displayName || 'User',
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.debug('Invalid token', { error: error.message });
    } else {
      logger.error('Token validation error', { error });
    }
    return null;
  }
}

/**
 * Extract token from Authorization header or query param
 */
export function extractToken(
  authHeader?: string,
  queryToken?: string
): string | null {
  // Try Authorization header first
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) {
      return match[1]!;
    }
  }

  // Fallback to query parameter
  if (queryToken) {
    return queryToken;
  }

  return null;
}
