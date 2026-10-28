import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../common/errors/app-error';
import { AuditService } from '../../common/utils/audit';
import { CollaborationStatus, CollaborationType, Role } from '@prisma/client';

export class CollaborationsService {
  public static async create(data: {
    challengeId?: string;
    projectId?: string;
    industryOrgId: string;
    proposedByType: 'INDUSTRY' | 'UNIVERSITY' | 'GOVERNMENT';
    collaborationType: CollaborationType;
    description: string;
    resourceCommitment?: string;
  }) {
    const org = await prisma.organization.findUnique({ where: { id: data.industryOrgId } });
    if (!org) throw new NotFoundError('Industry organization not found');

    const created = await prisma.collaboration.create({
      data: {
        challengeId: data.challengeId,
        projectId: data.projectId,
        industryOrgId: data.industryOrgId,
        proposedByType: data.proposedByType,
        collaborationType: data.collaborationType,
        description: data.description,
        resourceCommitment: data.resourceCommitment,
        status: CollaborationStatus.PROPOSED,
      },
      include: {
        industryOrg: true,
      },
    });

    await AuditService.record({
      actorRole: data.proposedByType,
      action: 'COLLABORATION_PROPOSED',
      resourceType: 'Collaboration',
      resourceId: created.id,
      afterState: { type: created.collaborationType, org: org.name },
    });

    return created;
  }

  public static async updateStatus(
    id: string,
    status: CollaborationStatus,
    user: { id: string; roles: Role[] }
  ) {
    const collab = await prisma.collaboration.findUnique({ where: { id } });
    if (!collab) throw new NotFoundError('Collaboration not found');

    const updated = await prisma.collaboration.update({
      where: { id },
      data: { status },
    });

    await AuditService.record({
      actorId: user.id,
      actorRole: user.roles[0] || 'USER',
      action: 'COLLABORATION_STATUS_UPDATED',
      resourceType: 'Collaboration',
      resourceId: id,
      beforeState: { status: collab.status },
      afterState: { status },
    });

    return updated;
  }

  public static async list(filter: {
    challengeId?: string;
    projectId?: string;
    industryOrgId?: string;
  }) {
    return prisma.collaboration.findMany({
      where: filter,
      include: {
        industryOrg: true,
        project: true,
        challenge: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
