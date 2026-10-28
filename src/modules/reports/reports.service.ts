import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors/app-error';
import { AuditService } from '../../common/utils/audit';
import { JobDispatcher } from '../../jobs/job-dispatcher';
import { ReportStatus, Visibility, Role } from '@prisma/client';
import crypto from 'crypto';

export class ReportsService {
  public static generateReferenceNumber(): string {
    const year = new Date().getFullYear();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `JS-${year}-${randomHex}`;
  }

  public static async create(
    data: any,
    user: { id: string; email: string; roles: Role[] },
    meta: { correlationId?: string; ipAddress?: string; userAgent?: string }
  ) {
    const referenceNumber = this.generateReferenceNumber();

    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.report.create({
        data: {
          referenceNumber,
          citizenId: user.id,
          title: data.title,
          description: data.description,
          domain: data.domain,
          subdomain: data.subdomain,
          problemType: data.problemType,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          villageOrTown: data.villageOrTown,
          district: data.district,
          state: data.state || 'Jharkhand',
          estimatedAffectedPopulation: data.estimatedAffectedPopulation || 0,
          firstObservedDate: data.firstObservedDate ? new Date(data.firstObservedDate) : null,
          recurrence: data.recurrence || 'ONCE',
          severity: data.severity || 'MEDIUM',
          urgency: data.urgency || 'MEDIUM',
          publicSafetyConcern: Boolean(data.publicSafetyConcern),
          supportingText: data.supportingText,
          visibility: data.visibility || 'PUBLIC',
          status: ReportStatus.SUBMITTED,
        },
      });

      await AuditService.record(
        {
          actorId: user.id,
          actorRole: user.roles[0] || 'CITIZEN',
          action: 'REPORT_SUBMITTED',
          resourceType: 'Report',
          resourceId: created.id,
          correlationId: meta.correlationId,
          afterState: { referenceNumber, title: created.title, status: created.status },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
        tx
      );

      return created;
    });

    // Dispatch background job for AI extraction, embedding, and priority scoring
    await JobDispatcher.dispatch('ai-intelligence', 'AI_ANALYZE_REPORT', {
      reportId: report.id,
    });

    return report;
  }

  public static async getById(
    id: string,
    user?: { id: string; roles: Role[] }
  ) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        citizen: { select: { id: true, name: true, email: true } },
        evidence: true,
        aiAnalysis: true,
        priorityAssessment: true,
        priorityDecisions: {
          include: { officer: { select: { id: true, name: true } } },
        },
        reviews: {
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        clusterMembers: {
          include: { cluster: true },
        },
      },
    });

    if (!report) throw new NotFoundError('Report not found');

    // Access control: private reports only viewable by creator, government officer, or platform admin
    if (report.visibility !== Visibility.PUBLIC) {
      if (!user) {
        throw new ForbiddenError('Private report requires authentication');
      }
      const isCreator = report.citizenId === user.id;
      const isGovOrAdmin = user.roles.some((r) =>
        ([Role.GOVERNMENT_OFFICER, Role.PLATFORM_ADMIN] as Role[]).includes(r)
      );
      if (!isCreator && !isGovOrAdmin) {
        throw new ForbiddenError('Access forbidden to this private citizen report');
      }
    }

    return report;
  }

  public static async list(
    filter: {
      domain?: string;
      district?: string;
      status?: ReportStatus;
      severity?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
    user?: { id: string; roles: Role[] }
  ) {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.domain) where.domain = filter.domain;
    if (filter.district) where.district = { contains: filter.district, mode: 'insensitive' };
    if (filter.status) where.status = filter.status;
    if (filter.severity) where.severity = filter.severity;
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        { referenceNumber: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    // Filter visibility unless government/admin
    const isGovOrAdmin = user?.roles.some((r) =>
      ([Role.GOVERNMENT_OFFICER, Role.PLATFORM_ADMIN] as Role[]).includes(r)
    );
    if (!isGovOrAdmin) {
      if (user) {
        where.OR = [
          { visibility: Visibility.PUBLIC },
          { citizenId: user.id },
        ];
      } else {
        where.visibility = Visibility.PUBLIC;
      }
    }

    const [items, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          evidence: true,
          aiAnalysis: true,
          priorityAssessment: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public static async getUserReports(
    userId: string,
    pagination: { page?: number; limit?: number }
  ) {
    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.report.findMany({
        where: { citizenId: userId },
        include: {
          evidence: true,
          aiAnalysis: true,
          priorityAssessment: true,
          reviews: { orderBy: { createdAt: 'desc' } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count({ where: { citizenId: userId } }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public static async addEvidence(
    reportId: string,
    evidenceData: {
      fileKey: string;
      originalFilename: string;
      mimeType: string;
      fileSize: number;
      storageProvider: string;
    },
    user: { id: string; roles: Role[] }
  ) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundError('Report not found');

    const isCreator = report.citizenId === user.id;
    const isGovOrAdmin = user.roles.some((r) =>
      ([Role.GOVERNMENT_OFFICER, Role.PLATFORM_ADMIN] as Role[]).includes(r)
    );
    if (!isCreator && !isGovOrAdmin) {
      throw new ForbiddenError('Only the reporting citizen or authorized officer can add evidence');
    }

    return prisma.reportEvidence.create({
      data: {
        reportId,
        fileKey: evidenceData.fileKey,
        originalFilename: evidenceData.originalFilename,
        mimeType: evidenceData.mimeType,
        fileSize: evidenceData.fileSize,
        storageProvider: evidenceData.storageProvider,
      },
    });
  }

  public static async withdraw(
    reportId: string,
    user: { id: string; roles: Role[] },
    reason?: string
  ) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundError('Report not found');

    if (report.citizenId !== user.id && !user.roles.includes(Role.PLATFORM_ADMIN)) {
      throw new ForbiddenError('You can only withdraw your own reports');
    }

    if (report.status === ReportStatus.VALIDATED || report.status === ReportStatus.LINKED_TO_CHALLENGE) {
      throw new BadRequestError('Validated or challenge-linked reports cannot be withdrawn');
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.WITHDRAWN },
    });

    await AuditService.record({
      actorId: user.id,
      actorRole: user.roles[0] || 'CITIZEN',
      action: 'REPORT_WITHDRAWN',
      resourceType: 'Report',
      resourceId: reportId,
      reason: reason || 'Citizen requested withdrawal',
    });

    return updated;
  }

  public static async getHistory(
    reportId: string,
    user: { id: string; roles: Role[] }
  ) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reviews: {
          include: { reviewer: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
        challengesDerived: {
          select: { id: true, referenceNumber: true, title: true, status: true },
        },
      },
    });
    if (!report) throw new NotFoundError('Report not found');

    const isCreator = report.citizenId === user.id;
    const isGovOrAdmin = user.roles.some((r) =>
      ([Role.GOVERNMENT_OFFICER, Role.PLATFORM_ADMIN] as Role[]).includes(r)
    );
    if (!isCreator && !isGovOrAdmin) {
      throw new ForbiddenError('You do not have permission to view the audit history of this report');
    }

    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        resourceType: 'Report',
        resourceId: reportId,
      },
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      reportId: report.id,
      referenceNumber: report.referenceNumber,
      status: report.status,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      reviews: report.reviews,
      linkedChallenges: report.challengesDerived,
      auditTrail: auditEvents,
    };
  }
}

