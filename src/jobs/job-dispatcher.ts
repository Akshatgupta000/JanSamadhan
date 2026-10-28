import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { ProcessingStatus } from '@prisma/client';

export type JobHandler = (data: any) => Promise<any>;

export class JobDispatcher {
  private static handlers = new Map<string, JobHandler>();

  public static registerHandler(jobName: string, handler: JobHandler): void {
    this.handlers.set(jobName, handler);
  }

  /**
   * Dispatches a background job. If Redis/BullMQ is operational, queues there;
   * otherwise executes asynchronously in an in-memory queue while persisting tracking in DB.
   */
  public static async dispatch(queueName: string, jobName: string, data: any): Promise<string> {
    // 1. Create a BackgroundJob tracking record in DB
    const record = await prisma.backgroundJob.create({
      data: {
        queueName,
        jobName,
        status: ProcessingStatus.PENDING,
        data,
      },
    });

    // 2. Run asynchronously (non-blocking)
    setImmediate(async () => {
      await this.executeJob(record.id, jobName, data);
    });

    return record.id;
  }

  private static async executeJob(jobId: string, jobName: string, data: any): Promise<void> {
    const handler = this.handlers.get(jobName);
    if (!handler) {
      logger.error({ jobName, jobId }, 'No handler registered for background job');
      await prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: ProcessingStatus.FAILED,
          errorMessage: `No handler registered for job type ${jobName}`,
        },
      });
      return;
    }

    try {
      await prisma.backgroundJob.update({
        where: { id: jobId },
        data: { status: ProcessingStatus.PROCESSING },
      });

      const result = await handler(data);

      await prisma.backgroundJob.update({
        where: { id: jobId },
        data: {
          status: ProcessingStatus.COMPLETED,
          result: result || {},
        },
      });
      logger.info({ jobId, jobName }, 'Background job completed successfully');
    } catch (error: any) {
      logger.error({ error, jobId, jobName }, 'Background job execution failed');
      try {
        await prisma.backgroundJob.update({
          where: { id: jobId },
          data: {
            status: ProcessingStatus.FAILED,
            errorMessage: error.message || 'Unknown error occurred',
          },
        });
      } catch (dbErr) {
        logger.warn({ dbErr }, 'Could not record background job failure in database');
      }
    }
  }
}

