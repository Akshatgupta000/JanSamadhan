import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/database';

const app = createApp();

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(
    { port: env.PORT, host: env.HOST, env: env.NODE_ENV },
    `JanSamadhan Innovation Hub Backend operational at http://${env.HOST}:${env.PORT}`
  );
  logger.info(`OpenAPI Documentation available at http://${env.HOST}:${env.PORT}/docs`);
});

// Graceful Shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown of JanSamadhan API...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Database connection safely closed.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during database disconnect.');
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds timeout
  setTimeout(() => {
    logger.error('Forced shutdown after 10s timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

