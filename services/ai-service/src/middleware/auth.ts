// Authentication Middleware
// Validates JWT tokens for protected routes

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../lib/config.js';
import { logger } from '../lib/logger.js';

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    logger.warn({ error }, 'Invalid token');
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Optional auth - allows unauthenticated requests but adds user if token present
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;
      req.user = {
        userId: payload.userId,
        email: payload.email,
      };
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }

  next();
}
