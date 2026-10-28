import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';
import { prisma } from '../../config/database';
import { Role } from '@prisma/client';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = JwtUtil.verifyAccessToken(token);

    // Verify user is still active in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        roles: true,
        orgMemberships: true,
      },
    });

    if (!user || user.accountStatus !== 'ACTIVE') {
      return next(new UnauthorizedError('User account not found or suspended'));
    }

    req.user = {
      id: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.role),
      orgId: user.orgMemberships[0]?.organizationId,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Access token has expired'));
    }
    return next(new UnauthorizedError('Invalid access token'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = JwtUtil.verifyAccessToken(token);
    prisma.user
      .findUnique({
        where: { id: payload.userId },
        include: { roles: true, orgMemberships: true },
      })
      .then((user) => {
        if (user && user.accountStatus === 'ACTIVE') {
          req.user = {
            id: user.id,
            email: user.email,
            roles: user.roles.map((r) => r.role),
            orgId: user.orgMemberships[0]?.organizationId,
          };
        }
        next();
      })
      .catch(() => next());
  } catch {
    next();
  }
}

export function requireRoles(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole && !req.user.roles.includes('PLATFORM_ADMIN')) {
      return next(
        new ForbiddenError(
          `Access forbidden: Requires one of [${allowedRoles.join(', ')}] role(s)`
        )
      );
    }

    next();
  };
}

