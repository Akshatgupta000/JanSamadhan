import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env';
import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  roles: Role[];
}

export class JwtUtil {
  public static signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRATION as any,
      issuer: 'jansamadhan-api',
      audience: 'jansamadhan-client',
    });
  }

  public static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'jansamadhan-api',
      audience: 'jansamadhan-client',
    }) as TokenPayload;
  }

  public static generateRefreshToken(): { token: string; hash: string } {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { token: rawToken, hash };
  }

  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

