import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors/app-error';
import { AuditService } from '../../common/utils/audit';
import { IRL, Role } from '@prisma/client';
import { IRL_DEFINITIONS } from '../../common/constants/weights';

export class ReadinessService {
  private static irlOrder: Record<IRL, number> = {
    IRL_0: 0,
    IRL_1: 1,
    IRL_2: 2,
    IRL_3: 3,
    IRL_4: 4,
    IRL_5: 5,
    IRL_6: 6,
    IRL_7: 7,
    IRL_8: 8,
    IRL_9: 9,
  };

  public static async advanceIRL(
    projectId: string,
    targetIrl: IRL,
    evidenceSummary: string,
    reason: string,
    user: { id: string; roles: Role[] }
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestError('A detailed reason is required for advancing Innovation Readiness Level');
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        pilots: true,
        deployments: true,
        impactAssessments: true,
      },
    });
    if (!project) throw new NotFoundError('Project not found');

    const currentOrder = this.irlOrder[project.currentIrl];
    const targetOrder = this.irlOrder[targetIrl];

    // Enforce valid forward progression (cannot jump more than 1 level at a time)
    if (targetOrder <= currentOrder) {
      throw new BadRequestError(`Target IRL (${targetIrl}) must be ahead of current level (${project.currentIrl})`);
    }
    if (targetOrder > currentOrder + 1) {
      throw new BadRequestError(
        `Invalid IRL jump: Cannot advance directly from ${project.currentIrl} to ${targetIrl}. Sequential milestone progression required.`
      );
    }

    // Specific domain rules:
    // IRL_6 (Community Pilot) requires a recorded pilot
    if (targetIrl === IRL.IRL_6 && project.pilots.length === 0) {
      throw new BadRequestError('Advancement to IRL-6 requires a registered community pilot');
    }

    // IRL_8 (Deployed) requires a registered deployment
    if (targetIrl === IRL.IRL_8 && project.deployments.length === 0) {
      throw new BadRequestError('Advancement to IRL-8 requires a verified operational deployment record');
    }

    // IRL_9 (Impact Verified) requires verified impact assessment
    if (targetIrl === IRL.IRL_9) {
      const verifiedImpact = project.impactAssessments.find((ia) => ia.status === 'VERIFIED');
      if (!verifiedImpact) {
        throw new BadRequestError('Advancement to IRL-9 requires an approved and verified Impact Assessment');
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedProj = await tx.project.update({
        where: { id: projectId },
        data: { currentIrl: targetIrl },
      });

      const transition = await tx.iRLTransition.create({
        data: {
          projectId,
          fromIrl: project.currentIrl,
          toIrl: targetIrl,
          actorId: user.id,
          approvedById: user.id,
          reason,
          evidenceSummary,
        },
      });

      await AuditService.record(
        {
          actorId: user.id,
          actorRole: user.roles[0] || 'FACULTY',
          action: 'IRL_TRANSITION_APPROVED',
          resourceType: 'Project',
          resourceId: projectId,
          beforeState: { irl: project.currentIrl },
          afterState: { irl: targetIrl },
          reason,
        },
        tx
      );

      return { project: updatedProj, transition };
    });

    return updated;
  }

  public static async getHistory(projectId: string) {
    const transitions = await prisma.iRLTransition.findMany({
      where: { projectId },
      include: {
        actor: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      definitions: IRL_DEFINITIONS,
      transitions,
    };
  }
}

