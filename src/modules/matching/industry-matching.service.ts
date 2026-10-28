import { prisma } from '../../config/database';
import { IndustryMatchingCalculator } from './industry-matching.calculator';
import { NotFoundError } from '../../common/errors/app-error';
import { AuditService } from '../../common/utils/audit';
import { OrgType } from '@prisma/client';

export class IndustryMatchingService {
  public static async generateMatches(challengeId: string) {
    const challenge = await prisma.innovationChallenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) throw new NotFoundError('Challenge not found');

    const partners = await prisma.organization.findMany({
      where: {
        type: { in: [OrgType.INDUSTRY_COMPANY, OrgType.STARTUP, OrgType.CSR_ORG] },
        industryCapability: { isNot: null },
      },
      include: {
        industryCapability: true,
      },
    });

    const capabilityData = partners.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      district: p.district,
      latitude: p.latitude,
      longitude: p.longitude,
      domains: (p.industryCapability?.domains as string[]) || [],
      techStack: (p.industryCapability?.techStack as string[]) || [],
      mentorshipAvailable: p.industryCapability?.mentorshipAvailable ?? true,
      fundingAvailable: p.industryCapability?.fundingAvailable ?? false,
      equipmentAvailable: p.industryCapability?.equipmentAvailable ?? false,
      apiAccessAvailable: p.industryCapability?.apiAccessAvailable ?? false,
      deploymentSupport: p.industryCapability?.deploymentSupport ?? true,
    }));

    const ranked = IndustryMatchingCalculator.rankPartners(
      {
        domain: challenge.domain,
        requiredExpertise: (challenge.requiredExpertise as string[]) || [],
        district: challenge.district,
      },
      capabilityData
    );

    await prisma.$transaction(async (tx) => {
      await tx.industryRecommendation.deleteMany({
        where: { challengeId },
      });

      for (const rec of ranked) {
        await tx.industryRecommendation.create({
          data: {
            challengeId,
            industryOrgId: rec.industryOrgId,
            totalScore: rec.totalScore,
            techExpertiseScore: rec.techExpertiseScore,
            mentorshipScore: rec.mentorshipScore,
            fundingScore: rec.fundingScore,
            equipmentScore: rec.equipmentScore,
            deploymentScore: rec.deploymentScore,
            geographyScore: rec.geographyScore,
            rank: rec.rank,
            factorBreakdown: rec.factorBreakdown,
            whyRecommended: rec.whyRecommended,
            algorithmVersion: rec.algorithmVersion,
          },
        });
      }

      await AuditService.record(
        {
          actorRole: 'SYSTEM',
          action: 'INDUSTRY_RECOMMENDATIONS_GENERATED',
          resourceType: 'InnovationChallenge',
          resourceId: challengeId,
          afterState: { rankedCount: ranked.length },
        },
        tx
      );
    });

    return ranked;
  }

  public static async getMatches(challengeId: string) {
    const matches = await prisma.industryRecommendation.findMany({
      where: { challengeId },
      include: {
        industryOrg: {
          select: {
            id: true,
            name: true,
            type: true,
            district: true,
            industryCapability: true,
          },
        },
      },
      orderBy: { rank: 'asc' },
    });

    return matches;
  }
}
