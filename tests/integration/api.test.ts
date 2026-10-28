import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { Application } from 'express';
import { prisma } from '../../src/config/database';
import { HashUtil } from '../../src/common/utils/hash';
import { JwtUtil } from '../../src/common/utils/jwt';
import { Role } from '@prisma/client';

describe('JanSamadhan Innovation Hub API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('Health & System Endpoints', () => {
    it('GET /health should return 200 UP', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('UP');
    });

    it('GET /ready should respond with service dependency readiness', async () => {
      const res = await request(app).get('/ready');
      expect([200, 503]).toContain(res.status);
    });

    it('GET /api/v1/evaluation/experiment should return comparative experiment benchmarks', async () => {
      const res = await request(app).get('/api/v1/evaluation/experiment');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.methods.hybridMatching.precisionAt5).toBe(0.91);
      expect(res.body.data.methods.keywordMatching.precisionAt5).toBe(0.62);
    });

    it('GET /api/v1/non-existent-route should return 404 NOT_FOUND', async () => {
      const res = await request(app).get('/api/v1/non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Authentication & Authorization Flow', () => {
    it('POST /api/v1/auth/register should fail with 422 if password does not meet complexity requirements', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Invalid User',
          email: 'invalid@example.com',
          password: 'simple',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ValidationError');
    });

    it('POST /api/v1/auth/register should reject public registration with privileged role PLATFORM_ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Attacker',
          email: 'attacker@example.com',
          password: 'SecretPassword123',
          role: 'PLATFORM_ADMIN',
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/login should fail with 401 when user is not found or password incorrect', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UnauthorizedError');
    });

    it('POST /api/v1/auth/login should issue JWT access and refresh tokens on valid credentials', async () => {
      const mockPasswordHash = await HashUtil.hash('Citizen@2026');
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'user-123',
        name: 'Sunita Soren',
        email: 'sunita@jharkhand.example',
        passwordHash: mockPasswordHash,
        accountStatus: 'ACTIVE',
        roles: [{ id: 'r1', userId: 'user-123', role: Role.CITIZEN, assignedAt: new Date(), assignedBy: null }],
        orgMemberships: [],
      } as any);

      vi.spyOn(prisma.refreshToken, 'create').mockResolvedValueOnce({} as any);
      vi.spyOn(prisma.auditEvent, 'create').mockResolvedValueOnce({} as any);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'sunita@jharkhand.example',
          password: 'Citizen@2026',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe('sunita@jharkhand.example');
    });

    it('POST /api/v1/auth/refresh should rotate refresh token and return new token pair', async () => {
      const mockToken = 'raw-refresh-token-string';
      const tokenHash = JwtUtil.hashToken(mockToken);

      vi.spyOn(prisma.refreshToken, 'findUnique').mockResolvedValueOnce({
        id: 'tok-1',
        userId: 'user-123',
        tokenHash,
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
        user: {
          id: 'user-123',
          email: 'sunita@jharkhand.example',
          roles: [{ role: Role.CITIZEN }],
        },
      } as any);

      vi.spyOn(prisma, '$transaction').mockResolvedValueOnce([{}, {}] as any);

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: mockToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
    });

    it('GET /api/v1/auth/me should return authenticated user details', async () => {
      const validToken = JwtUtil.signAccessToken({
        userId: 'user-123',
        email: 'sunita@jharkhand.example',
        roles: [Role.CITIZEN],
      });

      const mockUser = {
        id: 'user-123',
        name: 'Sunita Soren',
        email: 'sunita@jharkhand.example',
        accountStatus: 'ACTIVE',
        roles: [{ role: Role.CITIZEN }],
        orgMemberships: [],
        facultyProfile: null,
      };

      // Mock twice: once for authenticate middleware, once for AuthController.me
      vi.spyOn(prisma.user, 'findUnique')
        .mockResolvedValueOnce(mockUser as any)
        .mockResolvedValueOnce(mockUser as any);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('sunita@jharkhand.example');
    });

    it('GET /api/v1/auth/me should fail with 401 if unauthenticated', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Citizen Reporting & Governance API Workflow', () => {
    it('POST /api/v1/reports should create a report and generate reference number', async () => {
      const citizenToken = JwtUtil.signAccessToken({
        userId: 'user-citizen',
        email: 'citizen@jharkhand.example',
        roles: [Role.CITIZEN],
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'user-citizen',
        email: 'citizen@jharkhand.example',
        accountStatus: 'ACTIVE',
        roles: [{ role: Role.CITIZEN }],
        orgMemberships: [],
      } as any);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        return callback({
          report: {
            create: vi.fn().mockResolvedValue({
              id: 'rep-uuid-1',
              referenceNumber: 'JS-2026-TEST1',
              title: 'Broken Hand Pump in Village',
              description: 'The main handpump in Murhu village has stopped working for three weeks.',
              domain: 'Water Management',
              district: 'Khunti',
              status: 'SUBMITTED',
            }),
          },
          auditEvent: { create: vi.fn().mockResolvedValue({}) },
        });
      });

      vi.spyOn(prisma.backgroundJob, 'create').mockResolvedValueOnce({
        id: 'job-1',
        queueName: 'ai-intelligence',
        jobName: 'AI_ANALYZE_REPORT',
        status: 'PENDING',
      } as any);

      const res = await request(app)
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          title: 'Broken Hand Pump in Village',
          description: 'The main handpump in Murhu village has stopped working for three weeks.',
          domain: 'Water Management',
          district: 'Khunti',
          estimatedAffectedPopulation: 600,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('rep-uuid-1');
    });

    it('POST /api/v1/reports/:id/validate should forbid CITIZEN role from validating reports', async () => {
      const citizenToken = JwtUtil.signAccessToken({
        userId: 'user-citizen',
        email: 'citizen@jharkhand.example',
        roles: [Role.CITIZEN],
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'user-citizen',
        email: 'citizen@jharkhand.example',
        accountStatus: 'ACTIVE',
        roles: [{ role: Role.CITIZEN }],
        orgMemberships: [],
      } as any);

      const res = await request(app)
        .post('/api/v1/reports/rep-uuid-1/validate')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ notes: 'Illegal citizen validation attempt' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ForbiddenError');
    });

    it('POST /api/v1/reports/:id/validate should permit GOVERNMENT_OFFICER to validate report', async () => {
      const officerToken = JwtUtil.signAccessToken({
        userId: 'user-officer',
        email: 'officer@jharkhand.gov.in',
        roles: [Role.GOVERNMENT_OFFICER],
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'user-officer',
        email: 'officer@jharkhand.gov.in',
        accountStatus: 'ACTIVE',
        roles: [{ role: Role.GOVERNMENT_OFFICER }],
        orgMemberships: [],
      } as any);

      vi.spyOn(prisma.report, 'findUnique').mockResolvedValueOnce({
        id: 'rep-uuid-1',
        title: 'Broken Hand Pump',
        status: 'SUBMITTED',
        citizenId: 'user-citizen',
        aiAnalysis: null,
      } as any);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        return callback({
          report: {
            update: vi.fn().mockResolvedValue({ id: 'rep-uuid-1', status: 'VALIDATED' }),
          },
          reportReview: { create: vi.fn().mockResolvedValue({}) },
          notification: { create: vi.fn().mockResolvedValue({}) },
          auditEvent: { create: vi.fn().mockResolvedValue({}) },
        });
      });

      const res = await request(app)
        .post('/api/v1/reports/rep-uuid-1/validate')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({ notes: 'Verified with Block Officer. Genuine requirement.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.report.status).toBe('VALIDATED');
    });
  });
});
