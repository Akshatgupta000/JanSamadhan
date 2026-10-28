import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

export interface AuditLogParams {
  actorId?: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  correlationId?: string;
  beforeState?: any;
  afterState?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  public static async record(params: AuditLogParams, tx?: any): Promise<void> {
    const client = tx || prisma;
    try {
      await client.auditEvent.create({
        data: {
          actorId: params.actorId,
          actorRole: params.actorRole,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          correlationId: params.correlationId,
          beforeState: params.beforeState ? (params.beforeState as any) : undefined,
          afterState: params.afterState ? (params.afterState as any) : undefined,
          reason: params.reason,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      logger.error({ error, params }, 'Failed to record audit event');
    }
  }
}

