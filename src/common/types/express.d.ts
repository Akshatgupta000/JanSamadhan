import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  roles: Role[];
  orgId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      correlationId: string;
    }
  }
}

