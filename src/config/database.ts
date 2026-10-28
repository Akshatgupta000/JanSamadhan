import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { env } from './env';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

if (env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

// Log queries in debug mode if needed
if (env.LOG_LEVEL === 'debug' || env.LOG_LEVEL === 'trace') {
  // @ts-ignore
  prisma.$on('query', (e: any) => {
    logger.debug({ query: e.query, params: e.params, duration: `${e.duration}ms` }, 'Database Query');
  });
}

// @ts-ignore
prisma.$on('error', (e: any) => {
  logger.error({ error: e.message, target: e.target }, 'Database Error');
});

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.warn({ error }, 'Database connection check failed');
    return false;
  }
}

