import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error';
import { AuditService } from '../../common/utils/audit';
import { SeverityLevel, Role } from '@prisma/client';

export class PrioritizationService {
  public static async getReportPriority(reportId: string) {
    const assessment = await prisma.priorityAssessment.findUnique({
      where: { reportId },
      include: {
        report: {
          select: {
            id: true,
            referenceNumber: true,
            title: true,
            severity: true,
            urgency: true,
            estimatedAffectedPopulation: true,
            publicSafetyConcern: true,
            recurrence: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundError('Priority assessment has not been generated for this report yet');
    }

    return assessment;
  }

  public static async recordDecision(
    reportId: string,
    officer: { id: string; roles: Role[] },
    decision: {
      decisionType: 'ACCEPTED' | 'MODIFIED' | 'REJECTED';
      finalPriority: SeverityLevel;
      reason?: string;
      notes?: string;
    }
  ) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { priorityAssessment: true },
    });

    if (!report) throw new NotFoundError('Report not found');
    const recommendedPriority = report.priorityAssessment?.recommendedPriority || report.severity;

    if (decision.decisionType === 'MODIFIED' && !decision.reason) {
      throw new BadRequestError('A recorded justification is mandatory when overriding the AI priority recommendation');
    }

    const result = await prisma.$transaction(async (tx) => {
      const decisionRecord = await tx.priorityDecision.create({
        data: {
          reportId,
          officerId: officer.id,
          recommendedPriority,
          finalPriority: decision.finalPriority,
          decisionType: decision.decisionType,
          reason: decision.reason,
          notes: decision.notes,
        },
      });

      // Update Report severity to reflect the authoritative officer decision
      await tx.report.update({
        where: { id: reportId },
        data: { severity: decision.finalPriority },
      });

      await AuditService.record(
        {
          actorId: officer.id,
          actorRole: 'GOVERNMENT_OFFICER',
          action: 'PRIORITY_DECISION_RECORDED',
          resourceType: 'Report',
          resourceId: reportId,
          beforeState: { severity: report.severity, recommended: recommendedPriority },
          afterState: { finalPriority: decision.finalPriority, decisionType: decision.decisionType },
          reason: decision.reason,
        },
        tx
      );

      return decisionRecord;
    });

    return result;
  }
}

