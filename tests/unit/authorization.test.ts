import { describe, it, expect } from 'vitest';
import { requireRoles } from '../../src/common/middleware/auth.middleware';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../../src/common/errors/app-error';

describe('Role & Authorization Policy Unit Tests', () => {
  it('should throw UnauthorizedError when request user is unauthenticated', () => {
    const middleware = requireRoles(Role.GOVERNMENT_OFFICER);
    const req: any = {};
    const res: any = {};
    let caughtError: any = null;

    middleware(req, res, (err) => {
      caughtError = err;
    });

    expect(caughtError).toBeInstanceOf(UnauthorizedError);
  });

  it('should throw ForbiddenError when CITIZEN attempts to access GOVERNMENT_OFFICER endpoint', () => {
    const middleware = requireRoles(Role.GOVERNMENT_OFFICER);
    const req: any = {
      user: {
        id: 'citizen-id',
        email: 'citizen@example.com',
        roles: [Role.CITIZEN],
      },
    };
    const res: any = {};
    let caughtError: any = null;

    middleware(req, res, (err) => {
      caughtError = err;
    });

    expect(caughtError).toBeInstanceOf(ForbiddenError);
  });

  it('should allow GOVERNMENT_OFFICER on validation routes', () => {
    const middleware = requireRoles(Role.GOVERNMENT_OFFICER);
    const req: any = {
      user: {
        id: 'officer-id',
        email: 'officer@jharkhand.gov.in',
        roles: [Role.GOVERNMENT_OFFICER],
      },
    };
    const res: any = {};
    let passed = false;

    middleware(req, res, (err) => {
      if (!err) passed = true;
    });

    expect(passed).toBe(true);
  });

  it('should allow PLATFORM_ADMIN on all role-restricted routes', () => {
    const middleware = requireRoles(Role.GOVERNMENT_OFFICER, Role.UNIVERSITY_ADMIN);
    const req: any = {
      user: {
        id: 'admin-id',
        email: 'admin@jansamadhan.gov.in',
        roles: [Role.PLATFORM_ADMIN],
      },
    };
    const res: any = {};
    let passed = false;

    middleware(req, res, (err) => {
      if (!err) passed = true;
    });

    expect(passed).toBe(true);
  });
});
