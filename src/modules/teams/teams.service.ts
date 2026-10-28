import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors/app-error';
import { AuditService } from '../../common/utils/audit';
import { TeamRole, InvitationStatus, Role } from '@prisma/client';

export class TeamsService {
  public static async createTeam(data: {
    name: string;
    universityId: string;
    challengeId?: string;
    createdById: string;
    mentorUserId?: string;
  }) {
    const univ = await prisma.organization.findUnique({ where: { id: data.universityId } });
    if (!univ) throw new NotFoundError('University not found');

    const team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: {
          name: data.name,
          universityId: data.universityId,
          challengeId: data.challengeId,
          createdById: data.createdById,
          members: {
            create: {
              userId: data.createdById,
              role: TeamRole.STUDENT_LEAD,
              status: InvitationStatus.ACCEPTED,
            },
          },
        },
        include: {
          members: { include: { user: true } },
          university: true,
        },
      });

      if (data.mentorUserId) {
        await tx.teamMember.create({
          data: {
            teamId: created.id,
            userId: data.mentorUserId,
            role: TeamRole.FACULTY_MENTOR,
            status: InvitationStatus.ACCEPTED,
          },
        });
      }

      await AuditService.record(
        {
          actorId: data.createdById,
          actorRole: 'STUDENT_LEAD',
          action: 'TEAM_CREATED',
          resourceType: 'Team',
          resourceId: created.id,
          afterState: { name: created.name, universityId: created.universityId },
        },
        tx
      );

      return created;
    });

    return team;
  }

  public static async addMember(
    teamId: string,
    data: { userId: string; role: TeamRole },
    user: { id: string; roles: Role[] }
  ) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });
    if (!team) throw new NotFoundError('Team not found');

    const isLeadOrAdmin =
      team.createdById === user.id ||
      team.members.some((m) => m.userId === user.id && m.role === TeamRole.STUDENT_LEAD) ||
      user.roles.includes(Role.PLATFORM_ADMIN) ||
      user.roles.includes(Role.UNIVERSITY_ADMIN);

    if (!isLeadOrAdmin) {
      throw new ForbiddenError('Only the team lead or university administrator can invite members');
    }

    const existing = team.members.find((m) => m.userId === data.userId);
    if (existing) {
      throw new BadRequestError('User is already a member or invited to this team');
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId: data.userId,
        role: data.role,
        status: InvitationStatus.INVITED,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return member;
  }

  public static async respondInvitation(
    teamId: string,
    userId: string,
    accept: boolean
  ) {
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!member) throw new NotFoundError('Invitation not found');

    return prisma.teamMember.update({
      where: { id: member.id },
      data: {
        status: accept ? InvitationStatus.ACCEPTED : InvitationStatus.DECLINED,
      },
    });
  }

  public static async getById(id: string) {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        university: true,
        challenge: true,
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, facultyProfile: true } },
          },
        },
        proposals: true,
        projects: true,
      },
    });
    if (!team) throw new NotFoundError('Team not found');
    return team;
  }
}

