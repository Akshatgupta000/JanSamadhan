import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error';
import { AuditService } from '../../common/utils/audit';
import { MilestoneStatus, IRL, Role } from '@prisma/client';

export class MilestonesService {
  public static async create(projectId: string, data: {
    title: string;
    description?: string;
    targetIrl: IRL;
    dueDate?: string;
  }) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundError('Project not found');

    return prisma.projectMilestone.create({
      data: {
        projectId,
        title: data.title,
        description: data.description,
        targetIrl: data.targetIrl,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });
  }

  public static async submitDeliverable(
    milestoneId: string,
    deliverableUrl: string,
    notes?: string
  ) {
    const milestone = await prisma.projectMilestone.findUnique({ where: { id: milestoneId } });
    if (!milestone) throw new NotFoundError('Milestone not found');

    return prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: {
        deliverableUrl,
        notes,
        status: MilestoneStatus.SUBMITTED,
      },
    });
  }

  public static async review(
    milestoneId: string,
    status: MilestoneStatus,
    reviewer: { id: string; roles: Role[] },
    notes?: string
  ) {
    const milestone = await prisma.projectMilestone.findUnique({ where: { id: milestoneId } });
    if (!milestone) throw new NotFoundError('Milestone not found');

    const updated = await prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: {
        status,
        reviewedById: reviewer.id,
        reviewedAt: new Date(),
        notes: notes || milestone.notes,
      },
    });

    await AuditService.record({
      actorId: reviewer.id,
      actorRole: reviewer.roles[0] || 'FACULTY',
      action: 'MILESTONE_REVIEWED',
      resourceType: 'ProjectMilestone',
      resourceId: milestoneId,
      beforeState: { status: milestone.status },
      afterState: { status },
      reason: notes,
    });

    return updated;
  }
}

