import { prisma } from '../../config/database';
import { NotFoundError } from '../../common/errors/app-error';
import { AuditService } from '../../common/utils/audit';
import { PilotStatus, Role } from '@prisma/client';

export class PilotsService {
  public static async create(projectId: string, data: {
    targetCommunity: string;
    location: string;
    district: string;
    state?: string;
    startDate: string;
    endDate?: string;
    objectives: string;
    baselineMeasurements?: any;
  }) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError('Project not found');

    const created = await prisma.pilot.create({
      data: {
        projectId,
        targetCommunity: data.targetCommunity,
        location: data.location,
        district: data.district,
        state: data.state || 'Jharkhand',
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        objectives: data.objectives,
        baselineMeasurements: data.baselineMeasurements || {},
        status: PilotStatus.ACTIVE,
      },
    });

    await AuditService.record({
      actorRole: 'PROJECT_TEAM',
      action: 'PILOT_LAUNCHED',
      resourceType: 'Pilot',
      resourceId: created.id,
      afterState: { community: created.targetCommunity, district: created.district },
    });

    return created;
  }

  public static async updateResults(
    id: string,
    data: {
      testResults?: any;
      participantFeedback?: any;
      issuesEncountered?: string;
      status?: PilotStatus;
    }
  ) {
    const pilot = await prisma.pilot.findUnique({ where: { id } });
    if (!pilot) throw new NotFoundError('Pilot not found');

    return prisma.pilot.update({
      where: { id },
      data: {
        testResults: data.testResults,
        participantFeedback: data.participantFeedback,
        issuesEncountered: data.issuesEncountered,
        status: data.status || pilot.status,
      },
    });
  }

  public static async review(
    id: string,
    reviewStatus: 'APPROVED' | 'REJECTED',
    reviewer: { id: string; roles: Role[] }
  ) {
    const pilot = await prisma.pilot.findUnique({ where: { id } });
    if (!pilot) throw new NotFoundError('Pilot not found');

    return prisma.pilot.update({
      where: { id },
      data: {
        reviewStatus,
        reviewedById: reviewer.id,
      },
    });
  }

  public static async list(projectId?: string) {
    const where: any = {};
    if (projectId) where.projectId = projectId;

    return prisma.pilot.findMany({
      where,
      include: {
        project: { select: { id: true, title: true, currentIrl: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

