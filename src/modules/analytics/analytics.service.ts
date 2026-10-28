import { prisma } from '../../config/database';
import { ReportStatus, ProjectStatus, IRL, ClusterStatus } from '@prisma/client';

export class AnalyticsService {
  public static async getOverview() {
    const [
      totalReports,
      submittedReports,
      underReviewReports,
      validatedReports,
      rejectedReports,
      linkedReports,
      totalChallenges,
      openChallenges,
      totalProjects,
      activeProjects,
      totalPilots,
      activeDeployments,
      verifiedImpacts,
      clustersCount,
      universitiesCount,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: ReportStatus.SUBMITTED } }),
      prisma.report.count({ where: { status: ReportStatus.UNDER_REVIEW } }),
      prisma.report.count({ where: { status: ReportStatus.VALIDATED } }),
      prisma.report.count({ where: { status: ReportStatus.REJECTED } }),
      prisma.report.count({ where: { status: ReportStatus.LINKED_TO_CHALLENGE } }),
      prisma.innovationChallenge.count(),
      prisma.innovationChallenge.count({ where: { status: 'OPEN' } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: ProjectStatus.ACTIVE } }),
      prisma.pilot.count(),
      prisma.deployment.count({ where: { operationalStatus: 'ACTIVE' } }),
      prisma.impactAssessment.count({ where: { status: 'VERIFIED' } }),
      prisma.problemCluster.count(),
      prisma.organization.count({ where: { type: 'UNIVERSITY' } }),
    ]);

    // Group reports by domain
    const domainCounts = await prisma.report.groupBy({
      by: ['domain'],
      _count: { id: true },
      _sum: { estimatedAffectedPopulation: true },
    });

    // Group reports by severity
    const severityCounts = await prisma.report.groupBy({
      by: ['severity'],
      _count: { id: true },
    });

    // Group projects by current IRL
    const irlCounts = await prisma.project.groupBy({
      by: ['currentIrl'],
      _count: { id: true },
    });

    return {
      summary: {
        totalReports,
        awaitingReview: submittedReports,
        underReview: underReviewReports,
        validatedReports,
        rejectedReports,
        linkedToChallenge: linkedReports,
        totalChallenges,
        openChallenges,
        totalProjects,
        activeProjects,
        totalPilots,
        activeDeployments,
        verifiedImpacts,
        problemClusters: clustersCount,
        registeredUniversities: universitiesCount,
      },
      reportsByDomain: domainCounts.map((d) => ({
        domain: d.domain,
        reportCount: d._count.id,
        affectedPopulation: d._sum.estimatedAffectedPopulation || 0,
      })),
      reportsBySeverity: severityCounts.map((s) => ({
        severity: s.severity,
        count: s._count.id,
      })),
      projectsByIrl: irlCounts.map((i) => ({
        irl: i.currentIrl,
        count: i._count.id,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  public static async getDistrictHeatmap() {
    const districtReports = await prisma.report.groupBy({
      by: ['district'],
      _count: { id: true },
      _sum: { estimatedAffectedPopulation: true },
    });

    const districtProjects = await prisma.project.groupBy({
      by: ['challengeId'],
      _count: { id: true },
    });

    const districtDeployments = await prisma.deployment.groupBy({
      by: ['district'],
      _count: { id: true },
      _sum: { verifiedBeneficiaries: true },
    });

    return districtReports.map((dr) => {
      const depMatch = districtDeployments.find((d) => d.district.toLowerCase() === dr.district.toLowerCase());
      return {
        district: dr.district,
        state: 'Jharkhand',
        reportCount: dr._count.id,
        totalAffectedPopulation: dr._sum.estimatedAffectedPopulation || 0,
        activeDeployments: depMatch?._count.id || 0,
        verifiedBeneficiaries: depMatch?._sum.verifiedBeneficiaries || 0,
      };
    });
  }

  public static async getDomainAnalytics() {
    const domainReports = await prisma.report.groupBy({
      by: ['domain'],
      _count: { id: true },
      _sum: { estimatedAffectedPopulation: true },
    });

    const domainChallenges = await prisma.innovationChallenge.groupBy({
      by: ['domain'],
      _count: { id: true },
      _sum: { estimatedBeneficiaries: true },
    });

    return domainReports.map((dr) => {
      const chMatch = domainChallenges.find((c) => c.domain.toLowerCase() === dr.domain.toLowerCase());
      return {
        domain: dr.domain,
        reportCount: dr._count.id,
        affectedPopulation: dr._sum.estimatedAffectedPopulation || 0,
        activeChallenges: chMatch?._count.id || 0,
        estimatedBeneficiaries: chMatch?._sum.estimatedBeneficiaries || 0,
      };
    });
  }

  public static async getClusterAnalytics() {
    const [totalClusters, proposedClusters, activeClusters, clusters] = await Promise.all([
      prisma.problemCluster.count(),
      prisma.problemCluster.count({ where: { status: ClusterStatus.PROPOSED } }),
      prisma.problemCluster.count({ where: { status: ClusterStatus.ACTIVE } }),
      prisma.problemCluster.findMany({
        select: {
          id: true,
          name: true,
          domain: true,
          district: true,
          status: true,
          rawTotalPopulation: true,
          deduplicatedPopulation: true,
          _count: { select: { members: true, challenges: true } },
        },
      }),
    ]);

    const totalRaw = clusters.reduce((acc, c) => acc + c.rawTotalPopulation, 0);
    const totalDeduplicated = clusters.reduce((acc, c) => acc + c.deduplicatedPopulation, 0);

    return {
      summary: {
        totalClusters,
        proposedClusters,
        activeClusters,
        totalRawPopulation: totalRaw,
        totalDeduplicatedPopulation: totalDeduplicated,
        overlapEliminated: Math.max(0, totalRaw - totalDeduplicated),
      },
      clusters,
    };
  }

  public static async getProjectAnalytics() {
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      irlGroups,
      totalMilestones,
      approvedMilestones,
      pilotsCount,
      deploymentsCount,
      impactAssessments,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: ProjectStatus.ACTIVE } }),
      prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
      prisma.project.groupBy({
        by: ['currentIrl'],
        _count: { id: true },
      }),
      prisma.projectMilestone.count(),
      prisma.projectMilestone.count({ where: { status: 'APPROVED' } }),
      prisma.pilot.count(),
      prisma.deployment.count(),
      prisma.impactAssessment.findMany({
        where: { status: 'VERIFIED' },
        select: { totalImpactScore: true, reductionPercentage: true },
      }),
    ]);

    const avgImpact =
      impactAssessments.length > 0
        ? impactAssessments.reduce((acc: number, i: any) => acc + i.totalImpactScore, 0) / impactAssessments.length
        : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      irlDistribution: irlGroups.map((g: any) => ({ irl: g.currentIrl, count: g._count.id })),
      milestones: {
        total: totalMilestones,
        approved: approvedMilestones,
        completionRate: totalMilestones > 0 ? Math.round((approvedMilestones / totalMilestones) * 100) : 0,
      },
      pilots: { total: pilotsCount },
      deployments: { total: deploymentsCount },
      impact: {
        verifiedAssessmentsCount: impactAssessments.length,
        averageVerifiedImpactScore: Math.round(avgImpact * 10) / 10,
      },
    };
  }
}

