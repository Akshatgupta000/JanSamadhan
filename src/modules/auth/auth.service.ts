import { prisma } from '../../config/database';
import { HashUtil } from '../../common/utils/hash';
import { JwtUtil } from '../../common/utils/jwt';
import { AuditService } from '../../common/utils/audit';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../common/errors/app-error';
import { Role } from '@prisma/client';

export class AuthService {
  public static async register(
    data: {
      name: string;
      email: string;
      password: string;
      role: 'CITIZEN' | 'STUDENT' | 'FACULTY' | 'INDUSTRY_PARTNER';
      organizationId?: string;
    },
    meta: { ipAddress?: string; userAgent?: string; correlationId?: string }
  ) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await HashUtil.hash(data.password);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          roles: {
            create: {
              role: data.role as Role,
            },
          },
        },
        include: {
          roles: true,
        },
      });

      if (data.organizationId) {
        await tx.organizationMembership.create({
          data: {
            organizationId: data.organizationId,
            userId: newUser.id,
            roleInOrg: data.role === 'STUDENT' ? 'STUDENT_MEMBER' : 'MEMBER',
          },
        });
      }

      await AuditService.record(
        {
          actorId: newUser.id,
          actorRole: data.role,
          action: 'AUTH_REGISTER',
          resourceType: 'User',
          resourceId: newUser.id,
          correlationId: meta.correlationId,
          afterState: { email: newUser.email, role: data.role },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
        tx
      );

      return newUser;
    });

    const accessToken = JwtUtil.signAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.role),
    });

    const { token: rawRefreshToken, hash: refreshHash } = JwtUtil.generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles.map((r) => r.role),
      },
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
      },
    };
  }

  public static async login(
    data: { email: string; password: string },
    meta: { ipAddress?: string; userAgent?: string; correlationId?: string }
  ) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        roles: true,
        orgMemberships: {
          include: { organization: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.accountStatus !== 'ACTIVE') {
      throw new UnauthorizedError('Account is suspended or pending approval');
    }

    const isValid = await HashUtil.verify(user.passwordHash, data.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const roles = user.roles.map((r) => r.role);
    const accessToken = JwtUtil.signAccessToken({
      userId: user.id,
      email: user.email,
      roles,
    });

    const { token: rawRefreshToken, hash: refreshHash } = JwtUtil.generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt,
      },
    });

    await AuditService.record({
      actorId: user.id,
      actorRole: roles[0] || 'USER',
      action: 'AUTH_LOGIN',
      resourceType: 'User',
      resourceId: user.id,
      correlationId: meta.correlationId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles,
        organization: user.orgMemberships[0]?.organization || null,
      },
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
      },
    };
  }

  public static async refreshToken(rawRefreshToken: string) {
    const tokenHash = JwtUtil.hashToken(rawRefreshToken);

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Reuse detection: if already revoked, revoke all tokens for this user as a security measure
    if (tokenRecord.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError('Revoked token reuse detected. All sessions terminated.');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Rotate refresh token
    const { token: newRawRefreshToken, hash: newHash } = JwtUtil.generateRefreshToken();
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: {
          revokedAt: new Date(),
          replacedByToken: newHash,
        },
      }),
      prisma.refreshToken.create({
        data: {
          userId: tokenRecord.userId,
          tokenHash: newHash,
          expiresAt: newExpiresAt,
        },
      }),
    ]);

    const newAccessToken = JwtUtil.signAccessToken({
      userId: tokenRecord.user.id,
      email: tokenRecord.user.email,
      roles: tokenRecord.user.roles.map((r) => r.role),
    });

    return {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRawRefreshToken,
      },
    };
  }

  public static async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = JwtUtil.hashToken(rawRefreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
    }
  }

  public static async changePassword(
    userId: string,
    currentPass: string,
    newPass: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const isValid = await HashUtil.verify(user.passwordHash, currentPass);
    if (!isValid) throw new BadRequestError('Current password incorrect');

    const newHash = await HashUtil.hash(newPass);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      // Revoke all existing refresh tokens
      prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}

