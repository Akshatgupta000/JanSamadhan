import { prisma } from '../../config/database';
import { ClusteringCalculator } from './clustering.calculator';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error';
import { AuditService } from '../../common/utils/audit';
import { ClusterStatus, Role } from '@prisma/client';

export class ClusteringService {
  /**
   * Retrieves similar existing candidate reports for duplicate detection.
   */
  public static async getDuplicateCandidates(
    reportId: string,
    threshold: number = 0.70,
    topK: number = 5
  ) {
    const targetEmbeddingRecord = await prisma.reportEmbedding.findUnique({
      where: { reportId },
    });
    if (!targetEmbeddingRecord) {
      throw new BadRequestError('Embedding for this report has not been generated yet. Please process the report first.');
    }

    const targetVector = targetEmbeddingRecord.embeddingJson as number[];

    // Fetch embeddings of all other reports
    const otherEmbeddings = await prisma.reportEmbedding.findMany({
      where: { reportId: { not: reportId } },
      include: {
        report: {
          select: {
            id: true,
            referenceNumber: true,
            title: true,
            description: true,
            domain: true,
            subdomain: true,
            district: true,
            estimatedAffectedPopulation: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    const candidates = otherEmbeddings
      .map((record) => {
        const otherVector = record.embeddingJson as number[];
        const similarity = ClusteringCalculator.cosineSimilarity(targetVector, otherVector);
        return {
          reportId: record.reportId,
          referenceNumber: record.report.referenceNumber,
          title: record.report.title,
          description: record.report.description,
          domain: record.report.domain,
          district: record.report.district,
          estimatedAffectedPopulation: record.report.estimatedAffectedPopulation,
          status: record.report.status,
          similarityScore: similarity,
          similarityPercentage: Math.round(similarity * 100),
          createdAt: record.report.createdAt,
        };
      })
      .filter((c) => c.similarityScore >= threshold)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, topK);

    return {
      targetReportId: reportId,
      threshold,
      candidateCount: candidates.length,
      candidates,
    };
  }

  public static async createCluster(data: {
    name: string;
    summary?: string;
    domain: string;
    district: string;
    reportIds: string[];
    createdById?: string;
  }) {
    if (!data.reportIds || data.reportIds.length === 0) {
      throw new BadRequestError('At least one report is required to create a cluster');
    }

    const reports = await prisma.report.findMany({
      where: { id: { in: data.reportIds } },
    });

    if (reports.length !== data.reportIds.length) {
      throw new BadRequestError('One or more report IDs are invalid');
    }

    const populations = reports.map((r) => r.estimatedAffectedPopulation);
    const { rawTotal, deduplicated } = ClusteringCalculator.calculateDeduplicatedPopulation(populations);

    const cluster = await prisma.$transaction(async (tx) => {
      const created = await tx.problemCluster.create({
        data: {
          name: data.name,
          summary: data.summary,
          domain: data.domain,
          district: data.district,
          status: ClusterStatus.PROPOSED,
          rawTotalPopulation: rawTotal,
          deduplicatedPopulation: deduplicated,
          createdById: data.createdById,
          members: {
            create: data.reportIds.map((rId) => ({
              reportId: rId,
              similarityScore: 0.85,
            })),
          },
        },
        include: {
          members: { include: { report: true } },
        },
      });

      await AuditService.record(
        {
          actorId: data.createdById,
          actorRole: 'OFFICER',
          action: 'CLUSTER_CREATED',
          resourceType: 'ProblemCluster',
          resourceId: created.id,
          afterState: { name: created.name, membersCount: created.members.length },
        },
        tx
      );

      return created;
    });

    return cluster;
  }

  public static async listClusters(filter: {
    domain?: string;
    district?: string;
    status?: ClusterStatus;
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
      prisma.problemCluster.findMany({
        where,
        include: {
          members: {
            include: {
              report: {
                select: {
                  id: true,
                  referenceNumber: true,
                  title: true,
                  district: true,
                  estimatedAffectedPopulation: true,
                  status: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.problemCluster.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public static async getById(id: string) {
    const cluster = await prisma.problemCluster.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            report: {
              include: {
                aiAnalysis: true,
                priorityAssessment: true,
              },
            },
          },
        },
        challenges: true,
      },
    });
    if (!cluster) throw new NotFoundError('Cluster not found');
    return cluster;
  }

  public static async reviewCluster(
    id: string,
    officer: { id: string; roles: Role[] },
    data: { status: ClusterStatus; reviewNotes?: string }
  ) {
    const cluster = await prisma.problemCluster.findUnique({ where: { id } });
    if (!cluster) throw new NotFoundError('Cluster not found');

    const updated = await prisma.problemCluster.update({
      where: { id },
      data: {
        status: data.status,
        reviewedById: officer.id,
        reviewNotes: data.reviewNotes,
      },
    });

    await AuditService.record({
      actorId: officer.id,
      actorRole: 'GOVERNMENT_OFFICER',
      action: 'CLUSTER_REVIEWED',
      resourceType: 'ProblemCluster',
      resourceId: id,
      beforeState: { status: cluster.status },
      afterState: { status: data.status },
      reason: data.reviewNotes,
    });

    return updated;
  }
}

