import { Router, type Request, type Response, type IRouter } from 'express';
import { authService } from '../services/authService.js';
import { validateBody } from '../middleware/validation.js';
import { auth } from '../middleware/auth.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.js';

const router: IRouter = Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', validateBody(registerSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    // Check for Prisma connection errors
    if (message.includes('connect') || message.includes('ECONNREFUSED') || message.includes('database')) {
      res.status(503).json({ error: 'Database connection error', details: message });
      return;
    }
    res.status(400).json({ error: message });
  }
});

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    // Check for Prisma connection errors
    if (message.includes('connect') || message.includes('ECONNREFUSED') || message.includes('database')) {
      res.status(503).json({ error: 'Database connection error', details: message });
      return;
    }
    res.status(401).json({ error: message });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', validateBody(refreshTokenSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.refreshAccessToken(req.body.refreshToken);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    res.status(401).json({ error: message });
  }
});

/**
 * POST /auth/logout
 * Logout and invalidate refresh token
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.json({ success: true });
  } catch {
    // Always return success for logout
    res.json({ success: true });
  }
});

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me', auth, async (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;
