import { prisma } from '../../config/database';
import { UniversityMatchingCalculator } from './university-matching.calculator';
import { NotFoundError } from '../../common/errors/app-error';
import { AuditService } from '../../common/utils/audit';
import { OrgType } from '@prisma/client';

export class UniversityMatchingService {
  public static async generateMatches(challengeId: string) {
    const challenge = await prisma.innovationChallenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) throw new NotFoundError('Challenge not found');

    // Load all universities with verified status and capability profiles
    const universities = await prisma.organization.findMany({
      where: {
        type: OrgType.UNIVERSITY,
      },
      include: {
        departments: true,
        facultyProfiles: true,
        laboratories: true,
      },
    });

    // Map to calculator format
    const capabilityData = universities.map((u) => ({
      id: u.id,
      name: u.name,
      district: u.district,
      latitude: u.latitude,
      longitude: u.longitude,
      departments: u.departments.map((d) => ({ id: d.id, name: d.name, code: d.code })),
      facultyProfiles: u.facultyProfiles.map((f) => ({
        id: f.id,
        designation: f.designation,
        expertiseAreas: (f.expertiseAreas as string[]) || [],
        researchInterests: (f.researchInterests as string[]) || [],
        previousDeploymentCount: f.previousDeploymentCount || 0,
        publicationCount: f.publicationCount || 0,
      })),
      laboratories: u.laboratories.map((l) => ({
        id: l.id,
        name: l.name,
        capabilities: (l.capabilities as string[]) || [],
        equipmentList: (l.equipmentList as string[]) || [],
      })),
    }));

    const ranked = UniversityMatchingCalculator.rankUniversities(
      {
        domain: challenge.domain,
        subdomain: challenge.subdomain,
        requiredExpertise: (challenge.requiredExpertise as string[]) || [],
        district: challenge.district,
      },
      capabilityData
    );

    // Save recommendations in DB (replace older recommendations for this challenge)
    await prisma.$transaction(async (tx) => {
      await tx.universityRecommendation.deleteMany({
        where: { challengeId },
      });

      for (const rec of ranked) {
        await tx.universityRecommendation.create({
          data: {
            challengeId,
            universityId: rec.universityId,
            totalScore: rec.totalScore,
            scoreCoverage: rec.scoreCoverage,
            facultyExpertiseScore: rec.facultyExpertiseScore,
            departmentScore: rec.departmentScore,
            previousProjectScore: rec.previousProjectScore,
            laboratoryScore: rec.laboratoryScore,
            successScore: rec.successScore,
            geographyScore: rec.geographyScore,
            rank: rec.rank,
            factorBreakdown: rec.factorBreakdown as any,
            whyRecommended: rec.whyRecommended,
            algorithmVersion: rec.algorithmVersion,
          },
        });
      }

      await AuditService.record(
        {
          actorRole: 'SYSTEM',
          action: 'UNIVERSITY_RECOMMENDATIONS_GENERATED',
          resourceType: 'InnovationChallenge',
          resourceId: challengeId,
          afterState: { rankedCount: ranked.length, topMatch: ranked[0]?.universityName },
        },
        tx
      );
    });

    return ranked;
  }

  public static async getMatches(challengeId: string) {
    const matches = await prisma.universityRecommendation.findMany({
      where: { challengeId },
      include: {
        university: {
          select: {
            id: true,
            name: true,
            district: true,
            website: true,
            departments: true,
            laboratories: true,
          },
        },
      },
      orderBy: { rank: 'asc' },
    });

    return matches;
  }
}

