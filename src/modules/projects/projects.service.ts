import { prisma } from '../../config/database';
import { NotFoundError } from '../../common/errors/app-error';
import { ProjectStatus, IRL } from '@prisma/client';

export class ProjectsService {
  public static async list(filter: {
    status?: ProjectStatus;
    currentIrl?: IRL;
    teamId?: string;
    challengeId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.currentIrl) where.currentIrl = filter.currentIrl;
    if (filter.teamId) where.teamId = filter.teamId;
    if (filter.challengeId) where.challengeId = filter.challengeId;

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          team: { include: { university: true } },
          challenge: true,
          milestones: true,
          pilots: true,
          deployments: true,
          impactAssessments: true,
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public static async getById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            university: true,
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
        challenge: true,
        proposal: true,
        milestones: {
          include: { evidence: true, reviewedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        irlTransitions: {
          include: {
            actor: { select: { id: true, name: true } },
            approvedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        collaborations: {
          include: { industryOrg: true },
        },
        pilots: {
          include: { reviewedBy: { select: { id: true, name: true } } },
        },
        deployments: {
          include: { responsibleOrg: true, verifiedBy: { select: { id: true, name: true } } },
        },
        impactAssessments: {
          include: { verifiedBy: { select: { id: true, name: true } } },
        },
      },
    });

    if (!project) throw new NotFoundError('Project not found');
    return project;
  }

  public static async updateLinks(
    id: string,
    links: { repositoryUrl?: string; prototypeUrl?: string; documentationUrl?: string }
  ) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundError('Project not found');

    return prisma.project.update({
      where: { id },
      data: links,
    });
  }
}
