import { prisma } from '../../config/database';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../common/errors/app-error';
import { AuditService } from '../../common/utils/audit';
import {
  ReportStatus,
  ReviewAction,
  Role,
  ChallengeStatus,
  SeverityLevel,
} from '@prisma/client';
import crypto from 'crypto';

export class ValidationService {
  public static async startReview(
    reportId: string,
    officer: { id: string; roles: Role[] },
    notes?: string
  ) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundError('Report not found');

    if (report.status === ReportStatus.WITHDRAWN) {
      throw new BadRequestError('Cannot review a withdrawn report');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const rep = await tx.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.UNDER_REVIEW },
      });

      await tx.reportReview.create({
        data: {
          reportId,
          reviewerId: officer.id,
          action: ReviewAction.START_REVIEW,
          notes,
          previousStatus: report.status,
          newStatus: ReportStatus.UNDER_REVIEW,
        },
      });

      await AuditService.record(
        {
          actorId: officer.id,
          actorRole: 'GOVERNMENT_OFFICER',
          action: 'REPORT_REVIEW_STARTED',
          resourceType: 'Report',
          resourceId: reportId,
          beforeState: { status: report.status },
          afterState: { status: ReportStatus.UNDER_REVIEW },
          reason: notes,
        },
        tx
      );

      return rep;
    });

    return updated;
  }

  public static async requestInformation(
    reportId: string,
    officer: { id: string; roles: Role[] },
    notes: string
  ) {
    if (!notes || notes.trim().length === 0) {
      throw new BadRequestError('Information request notes are required');
    }

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundError('Report not found');

    return prisma.$transaction(async (tx) => {
      const review = await tx.reportReview.create({
        data: {
          reportId,
          reviewerId: officer.id,
          action: ReviewAction.REQUEST_INFO,
          notes,
          previousStatus: report.status,
          newStatus: report.status,
        },
      });

      // Create notification for citizen
      await tx.notification.create({
        data: {
          userId: report.citizenId,
          title: `Additional Information Requested: ${report.referenceNumber}`,
          message: notes,
          type: 'INFO_REQUESTED',
          resourceType: 'Report',
          resourceId: report.id,
        },
      });

      await AuditService.record(
        {
          actorId: officer.id,
          actorRole: 'GOVERNMENT_OFFICER',
          action: 'REPORT_INFO_REQUESTED',
          resourceType: 'Report',
          resourceId: reportId,
          reason: notes,
        },
        tx
      );

      return review;
    });
  }

  public static async validateReport(
    reportId: string,
    officer: { id: string; roles: Role[] },
    data: {
      notes?: string;
      promoteToChallenge?: boolean;
      linkToChallengeId?: string;
    }
  ) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { aiAnalysis: true },
    });
    if (!report) throw new NotFoundError('Report not found');

    if (report.status === ReportStatus.REJECTED) {
      throw new BadRequestError('Cannot validate a rejected report without formal reopen');
    }

    return prisma.$transaction(async (tx) => {
      const updatedReport = await tx.report.update({
        where: { id: reportId },
        data: {
          status: data.linkToChallengeId
            ? ReportStatus.LINKED_TO_CHALLENGE
            : ReportStatus.VALIDATED,
        },
      });

      await tx.reportReview.create({
        data: {
          reportId,
          reviewerId: officer.id,
          action: ReviewAction.APPROVE_VALIDATE,
          notes: data.notes,
          previousStatus: report.status,
          newStatus: updatedReport.status,
        },
      });

      let challenge = null;

      // Automatically promote to Innovation Challenge if requested
      if (data.promoteToChallenge) {
        const year = new Date().getFullYear();
        const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
        const refNumber = `CHAL-${year}-${rand}`;

        challenge = await tx.innovationChallenge.create({
          data: {
            referenceNumber: refNumber,
            title: `Innovation Challenge: ${report.title}`,
            description: report.description,
            domain: report.domain,
            subdomain: report.subdomain,
            district: report.district,
            priority: report.severity,
            sourceReportId: report.id,
            createdByOfficerId: officer.id,
            status: ChallengeStatus.OPEN,
            requiredExpertise: report.aiAnalysis?.requiredExpertise || ['Civil Engineering', 'General Engineering'],
            estimatedBeneficiaries: report.estimatedAffectedPopulation || 500,
          },
        });
      }

      // Link to existing challenge
      if (data.linkToChallengeId) {
        challenge = await tx.innovationChallenge.findUnique({
          where: { id: data.linkToChallengeId },
        });
        if (!challenge) throw new NotFoundError('Target challenge not found');

        await tx.report.update({
          where: { id: reportId },
          data: { status: ReportStatus.LINKED_TO_CHALLENGE },
        });
      }

      // Notify citizen of validation
      await tx.notification.create({
        data: {
          userId: report.citizenId,
          title: `Report Validated: ${report.referenceNumber}`,
          message: 'Your report has been verified and validated by the Department of Higher & Technical Education.',
          type: 'REPORT_VALIDATED',
          resourceType: 'Report',
          resourceId: report.id,
        },
      });

      await AuditService.record(
        {
          actorId: officer.id,
          actorRole: 'GOVERNMENT_OFFICER',
          action: 'REPORT_VALIDATED',
          resourceType: 'Report',
          resourceId: reportId,
          beforeState: { status: report.status },
          afterState: { status: updatedReport.status, challengeId: challenge?.id },
          reason: data.notes,
        },
        tx
      );

      return { report: updatedReport, challenge };
    });
  }

  public static async rejectReport(
    reportId: string,
    officer: { id: string; roles: Role[] },
    reason: string
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestError('A specific rejection reason is mandatory');
    }

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundError('Report not found');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.REJECTED },
      });

      await tx.reportReview.create({
        data: {
          reportId,
          reviewerId: officer.id,
          action: ReviewAction.REJECT,
          notes: reason,
          previousStatus: report.status,
          newStatus: ReportStatus.REJECTED,
        },
      });

      // Notify citizen
      await tx.notification.create({
        data: {
          userId: report.citizenId,
          title: `Report Rejected: ${report.referenceNumber}`,
          message: `Reason: ${reason}`,
          type: 'REPORT_REJECTED',
          resourceType: 'Report',
          resourceId: report.id,
        },
      });

      await AuditService.record(
        {
          actorId: officer.id,
          actorRole: 'GOVERNMENT_OFFICER',
          action: 'REPORT_REJECTED',
          resourceType: 'Report',
          resourceId: reportId,
          beforeState: { status: report.status },
          afterState: { status: ReportStatus.REJECTED },
          reason,
        },
        tx
      );

      return updated;
    });
  }
}

