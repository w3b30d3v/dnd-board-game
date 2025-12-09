// HTTP Basic Authentication middleware for password-protecting the staging site
import { Request, Response, NextFunction } from 'express';

const SITE_USERNAME = process.env.SITE_USERNAME || 'admin';
const SITE_PASSWORD = process.env.SITE_PASSWORD || '';
const ENABLE_BASIC_AUTH = process.env.ENABLE_BASIC_AUTH === 'true';

export function basicAuth(req: Request, res: Response, next: NextFunction) {
  // Skip if basic auth is not enabled
  if (!ENABLE_BASIC_AUTH || !SITE_PASSWORD) {
    return next();
  }

  // Skip auth for webhook endpoints (NanoBanana needs to call these)
  if (req.path.startsWith('/api/media/webhook') || req.path.startsWith('/media/webhook')) {
    return next();
  }

  // Skip auth for health checks
  if (req.path === '/health' || req.path === '/api/health' || req.path.startsWith('/health/')) {
    return next();
  }

  // Skip auth for public auth endpoints (register, login, refresh)
  if (req.path.startsWith('/auth/')) {
    return next();
  }

  const authHeader = req.headers.authorization;

  // Skip basic auth if request has a Bearer token (JWT auth)
  // The actual JWT validation happens in the auth middleware
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="D&D Board Game (Staging)"');
    return res.status(401).json({ error: 'Authentication required' });
  }

  const base64Credentials = authHeader.split(' ')[1] || '';
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  if (username === SITE_USERNAME && password === SITE_PASSWORD) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="D&D Board Game (Staging)"');
  return res.status(401).json({ error: 'Invalid credentials' });
}
