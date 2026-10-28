import { prisma } from '../../config/database';
import { ReportStatus, ProjectStatus, IRL } from '@prisma/client';

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
}

