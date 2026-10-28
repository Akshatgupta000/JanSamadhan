import { prisma } from '../../config/database';

export class AuditRetrievalService {
  public static async list(filter: {
    resourceType?: string;
    resourceId?: string;
    action?: string;
    actorId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 25;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.resourceType) where.resourceType = filter.resourceType;
    if (filter.resourceId) where.resourceId = filter.resourceId;
    if (filter.action) where.action = filter.action;
    if (filter.actorId) where.actorId = filter.actorId;

    const [items, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditEvent.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

