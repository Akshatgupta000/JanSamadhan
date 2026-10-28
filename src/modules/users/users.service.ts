import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors/app-error';
import { Role, AccountStatus } from '@prisma/client';
import { AuditService } from '../../common/utils/audit';

export class UsersService {
  public static async list(filter: {
    role?: Role;
    status?: AccountStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status) where.accountStatus = filter.status;
    if (filter.role) {
      where.roles = { some: { role: filter.role } };
    }
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          accountStatus: true,
          emailVerifiedAt: true,
          createdAt: true,
          roles: { select: { role: true, assignedAt: true } },
          orgMemberships: {
            include: { organization: { select: { id: true, name: true, type: true } } },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public static async assignRole(
    userId: string,
    role: Role,
    adminUser: { id: string; roles: Role[] }
  ) {
    if (!adminUser.roles.includes(Role.PLATFORM_ADMIN)) {
      throw new ForbiddenError('Only Platform Administrators can assign system roles');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
    if (!targetUser) throw new NotFoundError('Target user not found');

    const existingRole = targetUser.roles.find((r) => r.role === role);
    if (existingRole) {
      throw new BadRequestError(`User already possesses the ${role} role`);
    }

    const newRole = await prisma.userRole.create({
      data: {
        userId,
        role,
        assignedBy: adminUser.id,
      },
    });

    await AuditService.record({
      actorId: adminUser.id,
      actorRole: 'PLATFORM_ADMIN',
      action: 'USER_ROLE_ASSIGNED',
      resourceType: 'User',
      resourceId: userId,
      afterState: { assignedRole: role },
    });

    return newRole;
  }

  public static async updateStatus(
    userId: string,
    status: AccountStatus,
    adminUser: { id: string; roles: Role[] }
  ) {
    if (!adminUser.roles.includes(Role.PLATFORM_ADMIN)) {
      throw new ForbiddenError('Only Platform Administrators can alter account status');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { accountStatus: status },
      select: { id: true, name: true, email: true, accountStatus: true },
    });

    await AuditService.record({
      actorId: adminUser.id,
      actorRole: 'PLATFORM_ADMIN',
      action: 'USER_STATUS_UPDATED',
      resourceType: 'User',
      resourceId: userId,
      afterState: { accountStatus: status },
    });

    return updated;
  }
}

