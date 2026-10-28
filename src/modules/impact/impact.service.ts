import { prisma } from '../../config/database';
import { ImpactCalculator } from './impact.calculator';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error';
import { AuditService } from '../../common/utils/audit';
import { ImpactAssessmentStatus, Role } from '@prisma/client';

export class ImpactService {
  public static async calculateAndSubmit(
    projectId: string,
    data: {
      deploymentId?: string;
      targetPopulation?: number;
      rawBeneficiariesCount?: number;
      verifiedBeneficiariesCount?: number;
      baselineValue?: number;
      postDeploymentValue?: number;
      citizenSatisfactionAvg?: number;
      sustainabilityRating?: number;
      isDeploymentActive?: boolean;
      hasSustainabilityPlan?: boolean;
      sustainabilityScoreDetails?: any;
      deploymentSuccessDetails?: any;
    }
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { deployments: true },
    });
    if (!project) throw new NotFoundError('Project not found');

    const result = ImpactCalculator.calculate({
      targetPopulation: data.targetPopulation,
      rawBeneficiariesCount: data.rawBeneficiariesCount,
      verifiedBeneficiariesCount: data.verifiedBeneficiariesCount,
      baselineValue: data.baselineValue,
      postDeploymentValue: data.postDeploymentValue,
      citizenSatisfactionAvg: data.citizenSatisfactionAvg,
      sustainabilityRating: data.sustainabilityRating,
      isDeploymentActive: data.isDeploymentActive ?? true,
      hasSustainabilityPlan: data.hasSustainabilityPlan ?? true,
    });

    const assessment = await prisma.$transaction(async (tx) => {
      const created = await tx.impactAssessment.create({
        data: {
          projectId,
          deploymentId: data.deploymentId || project.deployments[0]?.id,
          populationBenefitedScore: result.populationBenefitedScore,
          problemReductionScore: result.problemReductionScore,
          citizenSatisfactionScore: result.citizenSatisfactionScore,
          sustainabilityScore: result.sustainabilityScore,
          deploymentSuccessScore: result.deploymentSuccessScore,
          totalImpactScore: result.totalImpactScore,
          baselineValue: data.baselineValue,
          postDeploymentValue: data.postDeploymentValue,
          reductionPercentage: result.reductionPercentage,
          rawBeneficiariesCount: data.rawBeneficiariesCount || 0,
          verifiedBeneficiariesCount: data.verifiedBeneficiariesCount || 0,
          citizenSatisfactionAvg: data.citizenSatisfactionAvg,
          sustainabilityScoreDetails: data.sustainabilityScoreDetails,
          deploymentSuccessDetails: data.deploymentSuccessDetails,
          factorBreakdown: result.factorBreakdown as any,
          algorithmVersion: result.algorithmVersion,
          status: ImpactAssessmentStatus.SUBMITTED,
        },
      });

      await AuditService.record(
        {
          actorRole: 'PROJECT_TEAM',
          action: 'IMPACT_ASSESSMENT_SUBMITTED',
          resourceType: 'ImpactAssessment',
          resourceId: created.id,
          afterState: { totalImpactScore: created.totalImpactScore, reduction: result.reductionPercentage },
        },
        tx
      );

      return created;
    });

    return assessment;
  }

  public static async verify(
    assessmentId: string,
    decision: 'VERIFIED' | 'REJECTED',
    notes: string,
    officer: { id: string; roles: Role[] }
  ) {
    const assessment = await prisma.impactAssessment.findUnique({
      where: { id: assessmentId },
    });
    if (!assessment) throw new NotFoundError('Impact assessment not found');

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.impactAssessment.update({
        where: { id: assessmentId },
        data: {
          status:
            decision === 'VERIFIED'
              ? ImpactAssessmentStatus.VERIFIED
              : ImpactAssessmentStatus.REJECTED,
          verifiedById: officer.id,
          verificationNotes: notes,
          verifiedAt: new Date(),
        },
      });

      await AuditService.record(
        {
          actorId: officer.id,
          actorRole: 'GOVERNMENT_OFFICER',
          action: 'IMPACT_VERIFIED',
          resourceType: 'ImpactAssessment',
          resourceId: assessmentId,
          beforeState: { status: assessment.status },
          afterState: { status: res.status, score: assessment.totalImpactScore },
          reason: notes,
        },
        tx
      );

      return res;
    });

    return updated;
  }

  public static async getByProject(projectId: string) {
    const assessments = await prisma.impactAssessment.findMany({
      where: { projectId },
      include: {
        verifiedBy: { select: { id: true, name: true } },
        deployment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return assessments;
  }
}
