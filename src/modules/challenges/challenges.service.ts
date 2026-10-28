import { prisma } from '../../config/database';
import { NotFoundError } from '../../common/errors/app-error';
import { AuditService } from '../../common/utils/audit';
import { ChallengeStatus, Role } from '@prisma/client';
import crypto from 'crypto';

export class ChallengesService {
  public static async list(filter: {
    domain?: string;
    district?: string;
    status?: ChallengeStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.domain) where.domain = filter.domain;
    if (filter.district) where.district = filter.district;
    if (filter.status) where.status = filter.status;

    const [items, total] = await Promise.all([
      prisma.innovationChallenge.findMany({
        where,
        include: {
          teams: true,
          proposals: true,
          projects: true,
          universityRecommendations: {
            include: { university: { select: { id: true, name: true, district: true } } },
            orderBy: { rank: 'asc' },
            take: 3,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.innovationChallenge.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public static async getById(id: string) {
    const challenge = await prisma.innovationChallenge.findUnique({
      where: { id },
      include: {
        sourceReport: true,
        cluster: {
          include: {
            members: { include: { report: true } },
          },
        },
        universityRecommendations: {
          include: { university: true },
          orderBy: { rank: 'asc' },
        },
        industryRecommendations: {
          include: { industryOrg: true },
          orderBy: { rank: 'asc' },
        },
        teams: {
          include: {
            university: true,
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
        proposals: {
          include: { team: true, submittedBy: { select: { id: true, name: true } } },
        },
        projects: {
          include: { team: true, milestones: true, pilots: true, deployments: true },
        },
        collaborations: {
          include: { industryOrg: true },
        },
      },
    });

    if (!challenge) throw new NotFoundError('Innovation challenge not found');
    return challenge;
  }

  public static async create(
    data: {
      title: string;
      description: string;
      domain: string;
      subdomain?: string;
      district: string;
      priority?: any;
      requiredExpertise: string[];
      estimatedBeneficiaries?: number;
      sourceReportId?: string;
      clusterId?: string;
    },
    officer: { id: string; roles: Role[] }
  ) {
    const year = new Date().getFullYear();
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    const referenceNumber = `CHAL-${year}-${rand}`;

    const challenge = await prisma.$transaction(async (tx) => {
      const created = await tx.innovationChallenge.create({
        data: {
          referenceNumber,
          title: data.title,
          description: data.description,
          domain: data.domain,
          subdomain: data.subdomain,
          district: data.district,
          priority: data.priority || 'HIGH',
          requiredExpertise: data.requiredExpertise,
          estimatedBeneficiaries: data.estimatedBeneficiaries || 500,
          sourceReportId: data.sourceReportId,
          clusterId: data.clusterId,
          createdByOfficerId: officer.id,
          status: ChallengeStatus.OPEN,
        },
      });

      if (data.sourceReportId) {
        await tx.report.update({
          where: { id: data.sourceReportId },
          data: { status: 'LINKED_TO_CHALLENGE' },
        });
      }

      await AuditService.record(
        {
          actorId: officer.id,
          actorRole: 'GOVERNMENT_OFFICER',
          action: 'CHALLENGE_CREATED',
          resourceType: 'InnovationChallenge',
          resourceId: created.id,
          afterState: { referenceNumber, title: created.title },
        },
        tx
      );

      return created;
    });

    return challenge;
  }
}

