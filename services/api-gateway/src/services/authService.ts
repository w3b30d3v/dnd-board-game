import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';
import type { RegisterInput } from '../schemas/auth.js';
import type { User } from '@prisma/client';

export type SafeUser = Omit<User, 'passwordHash'>;

export interface AuthResult {
  user: SafeUser;
  token: string;
  refreshToken: string;
}

interface JwtPayload {
  userId: string;
  displayName?: string; // Public display name only, no PII like email
  type: 'access' | 'refresh';
}

// Parse duration string to seconds (e.g., "15m" -> 900, "7d" -> 604800)
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // Default to 15 minutes

  const value = parseInt(match[1]!, 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: return 900;
  }
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly accessTokenExpiry: number;
  private readonly refreshTokenExpiry: number;

  constructor() {
    this.jwtSecret = config.jwt.secret;
    this.accessTokenExpiry = parseDuration(config.jwt.expiresIn);
    this.refreshTokenExpiry = parseDuration(config.jwt.refreshExpiresIn);
  }

  async register(data: RegisterInput): Promise<AuthResult> {
    // Check existing user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existing) {
      throw new Error(
        existing.email === data.email ? 'Email already registered' : 'Username already taken'
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        displayName: data.displayName || data.username,
        passwordHash,
      },
    });

    // Generate tokens
    const token = this.generateAccessToken(user.id, user.displayName || user.username);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token in session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const token = this.generateAccessToken(user.id, user.displayName || user.username);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token in session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ token: string }> {
    // Verify the refresh token
    const payload = this.verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new Error('Session expired');
    }

    // Generate new access token with user info (displayName only, no PII)
    const user = session.user;
    const token = this.generateAccessToken(payload.userId, user.displayName || user.username);

    return { token };
  }

  async logout(refreshToken: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token: refreshToken },
    });
  }

  async verifyAccessToken(token: string): Promise<SafeUser | null> {
    const payload = this.verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    return user ? this.sanitizeUser(user) : null;
  }

  async getUserById(userId: string): Promise<SafeUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user ? this.sanitizeUser(user) : null;
  }

  private generateAccessToken(userId: string, displayName: string): string {
    const options: SignOptions = { expiresIn: this.accessTokenExpiry };
    // Only include displayName (public), never email (PII)
    return jwt.sign({ userId, displayName, type: 'access' } as JwtPayload, this.jwtSecret, options);
  }

  private generateRefreshToken(userId: string): string {
    const options: SignOptions = { expiresIn: this.refreshTokenExpiry };
    return jwt.sign({ userId, type: 'refresh' } as JwtPayload, this.jwtSecret, options);
  }

  private verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch {
      return null;
    }
  }

  private sanitizeUser(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safe } = user;
    return safe;
  }
}

export const authService = new AuthService();
