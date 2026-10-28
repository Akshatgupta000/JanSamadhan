import { prisma } from '../../config/database';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors/app-error';
import { AuditService } from '../../common/utils/audit';
import { ProposalStatus, ProjectStatus, IRL, Role, ChallengeStatus } from '@prisma/client';

export class ProposalsService {
  public static async submit(
    data: {
      challengeId: string;
      teamId: string;
      title: string;
      problemUnderstanding: string;
      proposedSolution: string;
      technicalApproach: string;
      requiredResources?: string;
      expectedBeneficiaries?: number;
      implementationPlan: string;
      estimatedTimeline?: string;
      expectedImpact?: string;
      risksAndLimitations?: string;
    },
    user: { id: string; roles: Role[] }
  ) {
    const challenge = await prisma.innovationChallenge.findUnique({
      where: { id: data.challengeId },
    });
    if (!challenge) throw new NotFoundError('Challenge not found');

    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
      include: { members: true },
    });
    if (!team) throw new NotFoundError('Team not found');

    // Verify user is in team
    const isMember = team.members.some((m) => m.userId === user.id);
    if (!isMember && !user.roles.includes(Role.PLATFORM_ADMIN)) {
      throw new ForbiddenError('You must be a member of this team to submit a proposal');
    }

    const proposal = await prisma.$transaction(async (tx) => {
      const created = await tx.proposal.create({
        data: {
          challengeId: data.challengeId,
          teamId: data.teamId,
          submittedById: user.id,
          title: data.title,
          problemUnderstanding: data.problemUnderstanding,
          proposedSolution: data.proposedSolution,
          technicalApproach: data.technicalApproach,
          requiredResources: data.requiredResources,
          expectedBeneficiaries: data.expectedBeneficiaries || 0,
          implementationPlan: data.implementationPlan,
          estimatedTimeline: data.estimatedTimeline,
          expectedImpact: data.expectedImpact,
          risksAndLimitations: data.risksAndLimitations,
          status: ProposalStatus.SUBMITTED,
        },
      });

      // Update challenge status to in-progress matching/review
      await tx.innovationChallenge.update({
        where: { id: data.challengeId },
        data: { status: ChallengeStatus.ACCEPTED },
      });

      await AuditService.record(
        {
          actorId: user.id,
          actorRole: user.roles[0] || 'STUDENT',
          action: 'PROPOSAL_SUBMITTED',
          resourceType: 'Proposal',
          resourceId: created.id,
          afterState: { title: created.title, teamId: data.teamId },
        },
        tx
      );

      return created;
    });

    return proposal;
  }

  public static async review(
    proposalId: string,
    decision: ProposalStatus,
    feedback: string,
    reviewer: { id: string; roles: Role[] }
  ) {
    if (!feedback || feedback.trim().length === 0) {
      throw new BadRequestError('Detailed review feedback is required');
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { challenge: true, team: true },
    });
    if (!proposal) throw new NotFoundError('Proposal not found');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.proposal.update({
        where: { id: proposalId },
        data: { status: decision },
      });

      await tx.proposalReview.create({
        data: {
          proposalId,
          reviewerId: reviewer.id,
          decision,
          feedback,
        },
      });

      let project = null;

      // If approved, initialize a Project and transition from IRL-1 to IRL-2
      if (decision === ProposalStatus.APPROVED) {
        project = await tx.project.create({
          data: {
            challengeId: proposal.challengeId,
            proposalId: proposal.id,
            teamId: proposal.teamId,
            title: proposal.title,
            description: proposal.proposedSolution,
            status: ProjectStatus.ACTIVE,
            currentIrl: IRL.IRL_2, // Research completed
            targetCompletionDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
            milestones: {
              create: [
                {
                  title: 'M1: Research & Requirements Baseline',
                  description: 'Comprehensive problem analysis, stakeholder interviews, and baseline data collection.',
                  targetIrl: IRL.IRL_2,
                  status: 'APPROVED',
                  reviewedById: reviewer.id,
                  reviewedAt: new Date(),
                },
                {
                  title: 'M2: Architectural Concept Design',
                  description: 'Technical design specification, component architecture, and Bill of Materials.',
                  targetIrl: IRL.IRL_3,
                  status: 'PENDING',
                },
                {
                  title: 'M3: Functional Lab Prototype',
                  description: 'Working lab bench prototype demonstrating core telemetry and automated monitoring.',
                  targetIrl: IRL.IRL_4,
                  status: 'PENDING',
                },
              ],
            },
          },
        });

        // Record IRL Transition
        await tx.iRLTransition.create({
          data: {
            projectId: project.id,
            fromIrl: IRL.IRL_1,
            toIrl: IRL.IRL_2,
            actorId: reviewer.id,
            approvedById: reviewer.id,
            reason: 'Proposal approved by technical review panel. Research baseline accepted.',
            evidenceSummary: 'Proposal technical architecture and feasibility validated.',
          },
        });
      }

      await AuditService.record(
        {
          actorId: reviewer.id,
          actorRole: reviewer.roles[0] || 'FACULTY',
          action: 'PROPOSAL_REVIEWED',
          resourceType: 'Proposal',
          resourceId: proposalId,
          beforeState: { status: proposal.status },
          afterState: { status: decision, projectId: project?.id },
          reason: feedback,
        },
        tx
      );

      return { proposal: updated, project };
    });
  }

  public static async getById(id: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        challenge: true,
        team: { include: { members: { include: { user: true } }, university: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        reviews: {
          include: { reviewer: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        projects: true,
      },
    });
    if (!proposal) throw new NotFoundError('Proposal not found');
    return proposal;
  }
}
