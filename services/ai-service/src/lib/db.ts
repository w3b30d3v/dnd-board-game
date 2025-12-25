// Database client for AI Service
// Uses Prisma to persist Campaign Studio conversations

import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

// Global Prisma instance (singleton)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error({ error }, 'Database connection failed');
    return false;
  }
}

// Graceful shutdown
export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
