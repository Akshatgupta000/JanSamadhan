import { prisma } from '../../config/database';
import { NotFoundError } from '../../common/errors/app-error';
import { AuditService } from '../../common/utils/audit';
import { DeploymentStatus, Role } from '@prisma/client';

export class DeploymentsService {
  public static async create(data: {
    projectId: string;
    pilotId?: string;
    location: string;
    district: string;
    state?: string;
    responsibleOrgId: string;
    operationalStatus?: DeploymentStatus;
    estimatedBeneficiaries?: number;
    verifiedBeneficiaries?: number;
    sustainabilityPlan?: string;
    evidenceSummary?: string;
  }) {
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new NotFoundError('Project not found');

    const created = await prisma.deployment.create({
      data: {
        projectId: data.projectId,
        pilotId: data.pilotId,
        location: data.location,
        district: data.district,
        state: data.state || 'Jharkhand',
        responsibleOrgId: data.responsibleOrgId,
        operationalStatus: data.operationalStatus || DeploymentStatus.ACTIVE,
        estimatedBeneficiaries: data.estimatedBeneficiaries || 0,
        verifiedBeneficiaries: data.verifiedBeneficiaries || 0,
        sustainabilityPlan: data.sustainabilityPlan,
        evidenceSummary: data.evidenceSummary,
        status: 'PENDING_VERIFICATION',
      },
      include: {
        responsibleOrg: true,
      },
    });

    await AuditService.record({
      actorRole: 'DEPLOYMENT_LEAD',
      action: 'DEPLOYMENT_REGISTERED',
      resourceType: 'Deployment',
      resourceId: created.id,
      afterState: { location: created.location, district: created.district },
    });

    return created;
  }

  public static async verify(
    id: string,
    verifiedStatus: 'VERIFIED' | 'REJECTED',
    verifiedBeneficiaries: number,
    officer: { id: string; roles: Role[] }
  ) {
    const deployment = await prisma.deployment.findUnique({ where: { id } });
    if (!deployment) throw new NotFoundError('Deployment not found');

    const updated = await prisma.deployment.update({
      where: { id },
      data: {
        status: verifiedStatus,
        verifiedBeneficiaries,
        verifiedById: officer.id,
        verifiedAt: new Date(),
      },
    });

    await AuditService.record({
      actorId: officer.id,
      actorRole: 'GOVERNMENT_OFFICER',
      action: 'DEPLOYMENT_VERIFIED',
      resourceType: 'Deployment',
      resourceId: id,
      beforeState: { status: deployment.status },
      afterState: { status: verifiedStatus, verifiedBeneficiaries },
    });

    return updated;
  }

  public static async list(filter: { projectId?: string; district?: string }) {
    const where: any = {};
    if (filter.projectId) where.projectId = filter.projectId;
    if (filter.district) where.district = filter.district;

    return prisma.deployment.findMany({
      where,
      include: {
        project: { select: { id: true, title: true, currentIrl: true } },
        responsibleOrg: true,
        verifiedBy: { select: { id: true, name: true } },
        pilot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
