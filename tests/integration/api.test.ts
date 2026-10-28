import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { Application } from 'express';
import { prisma } from '../../src/config/database';
import { HashUtil } from '../../src/common/utils/hash';
import { JwtUtil } from '../../src/common/utils/jwt';
import { Role, SeverityLevel, IRL, ProposalStatus, ImpactAssessmentStatus } from '@prisma/client';

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

  describe('AI Intelligence, Priority Overrides & Duplicate Clustering', () => {
    it('GET /api/v1/reports/:id/analysis should return structured extraction and confidence', async () => {
      vi.spyOn(prisma.aIAnalysis, 'findUnique').mockResolvedValueOnce({
        id: 'analysis-1',
        reportId: 'rep-uuid-1',
        domain: 'Water Management',
        subdomain: 'Rural Drinking Water',
        problemType: 'Infrastructure Failure',
        severity: SeverityLevel.HIGH,
        urgency: SeverityLevel.HIGH,
        estimatedAffectedPopulation: 600,
        requiredExpertise: ['Civil Engineering', 'Water Resources', 'IoT Monitoring'],
        keywords: ['hand pump', 'groundwater', 'scarcity'],
        entities: { detectedIssue: 'Infrastructure Failure' },
        confidence: 0.88,
        isFallback: true,
        modelVersion: 'deterministic-rules-v1',
      } as any);

      const res = await request(app).get('/api/v1/reports/rep-uuid-1/analysis');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.domain).toBe('Water Management');
      expect(res.body.data.confidence).toBe(0.88);
    });

    it('GET /api/v1/reports/:id/priority should return explainable factor contributions', async () => {
      vi.spyOn(prisma.priorityAssessment, 'findUnique').mockResolvedValueOnce({
        id: 'prio-1',
        reportId: 'rep-uuid-1',
        priorityScore: 84.0,
        recommendedPriority: SeverityLevel.CRITICAL,
        factorBreakdown: [
          { factor: 'severity', rawScore: 75, weight: 0.3, contribution: 22.5 },
          { factor: 'population', rawScore: 80, weight: 0.25, contribution: 20.0 },
        ],
        algorithmVersion: 'priority-v1.0.0',
        report: {
          id: 'rep-uuid-1',
          referenceNumber: 'JS-2026-TEST1',
          title: 'Broken Hand Pump',
          severity: 'HIGH',
        },
      } as any);

      const res = await request(app).get('/api/v1/reports/rep-uuid-1/priority');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.priorityScore).toBe(84.0);
      expect(res.body.data.recommendedPriority).toBe('CRITICAL');
    });

    it('POST /api/v1/reports/:id/priority/decision should require reason when overriding priority', async () => {
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
        severity: SeverityLevel.MEDIUM,
        priorityAssessment: { recommendedPriority: SeverityLevel.LOW },
      } as any);

      const res = await request(app)
        .post('/api/v1/reports/rep-uuid-1/priority/decision')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          decisionType: 'MODIFIED',
          finalPriority: SeverityLevel.CRITICAL,
          // Reason intentionally omitted
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('recorded justification is mandatory');
    });

    it('GET /api/v1/clusters/reports/:id/duplicate-candidates should retrieve similar reports above threshold', async () => {
      vi.spyOn(prisma.reportEmbedding, 'findUnique').mockResolvedValueOnce({
        id: 'emb-1',
        reportId: 'rep-uuid-1',
        embeddingJson: new Array(768).fill(0.1),
      } as any);

      vi.spyOn(prisma.reportEmbedding, 'findMany').mockResolvedValueOnce([
        {
          id: 'emb-2',
          reportId: 'rep-uuid-2',
          embeddingJson: new Array(768).fill(0.1), // Identical vector -> 1.0 similarity
          report: {
            id: 'rep-uuid-2',
            referenceNumber: 'JS-2026-TEST2',
            title: 'Nearby Tube Well Failure',
            description: 'Adjacent village water point broken',
            domain: 'Water Management',
            district: 'Khunti',
            estimatedAffectedPopulation: 800,
            status: 'VALIDATED',
            createdAt: new Date(),
          },
        },
      ] as any);

      const res = await request(app).get('/api/v1/clusters/reports/rep-uuid-1/duplicate-candidates');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.candidates).toHaveLength(1);
      expect(res.body.data.candidates[0].similarityPercentage).toBe(100);
    });
  });

  describe('University Matching, Proposals, IRL Lifecycle & Impact', () => {
    it('GET /api/v1/challenges/:id/university-matches should return explainable university rankings', async () => {
      vi.spyOn(prisma.universityRecommendation, 'findMany').mockResolvedValueOnce([
        {
          id: 'rec-1',
          challengeId: 'chal-1',
          universityId: 'univ-bit',
          totalScore: 88.0,
          rank: 1,
          scoreCoverage: 1.0,
          facultyExpertiseScore: 90.0,
          departmentScore: 80.0,
          whyRecommended: 'Civil Engineering Dept + Certified Water Lab',
          university: {
            id: 'univ-bit',
            name: 'BIT Mesra',
            district: 'Ranchi',
            departments: [],
            laboratories: [],
          },
        },
      ] as any);

      const res = await request(app).get('/api/v1/challenges/chal-1/university-matches');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].totalScore).toBe(88.0);
      expect(res.body.data[0].rank).toBe(1);
    });

    it('POST /api/v1/projects/:id/readiness/advance should reject illegal IRL level skipping', async () => {
      const facultyToken = JwtUtil.signAccessToken({
        userId: 'user-faculty',
        email: 'prof.kumar@bitmesra.ac.in',
        roles: [Role.FACULTY],
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'user-faculty',
        email: 'prof.kumar@bitmesra.ac.in',
        accountStatus: 'ACTIVE',
        roles: [{ role: Role.FACULTY }],
        orgMemberships: [],
      } as any);

      vi.spyOn(prisma.project, 'findUnique').mockResolvedValueOnce({
        id: 'proj-1',
        currentIrl: IRL.IRL_2, // Current: IRL_2
        pilots: [],
        deployments: [],
        impactAssessments: [],
      } as any);

      const res = await request(app)
        .post('/api/v1/projects/proj-1/readiness/advance')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          targetIrl: IRL.IRL_6, // Illegal jump: IRL_2 directly to IRL_6
          reason: 'Attempting to skip prototype stages',
          evidenceSummary: 'None',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Invalid IRL jump');
    });

    it('POST /api/v1/projects/:projectId/impact should compute 5-factor impact score', async () => {
      const facultyToken = JwtUtil.signAccessToken({
        userId: 'user-faculty',
        email: 'prof.kumar@bitmesra.ac.in',
        roles: [Role.FACULTY],
      });

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
        id: 'user-faculty',
        email: 'prof.kumar@bitmesra.ac.in',
        accountStatus: 'ACTIVE',
        roles: [{ role: Role.FACULTY }],
        orgMemberships: [],
      } as any);

      vi.spyOn(prisma.project, 'findUnique').mockResolvedValueOnce({
        id: 'proj-1',
        deployments: [{ id: 'dep-1' }],
      } as any);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        return callback({
          impactAssessment: {
            create: vi.fn().mockResolvedValue({
              id: 'ia-1',
              projectId: 'proj-1',
              totalImpactScore: 88.0,
              reductionPercentage: 82.4,
              status: ImpactAssessmentStatus.SUBMITTED,
            }),
          },
          auditEvent: { create: vi.fn().mockResolvedValue({}) },
        });
      });

      const res = await request(app)
        .post('/api/v1/projects/proj-1/impact')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          targetPopulation: 4350,
          verifiedBeneficiariesCount: 3920,
          baselineValue: 17,
          postDeploymentValue: 3,
          citizenSatisfactionAvg: 4.3,
          sustainabilityRating: 85,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalImpactScore).toBe(88.0);
      expect(res.body.data.reductionPercentage).toBe(82.4);
    });

    it('PATCH /api/v1/impact/:id/verify should record verified impact decision by government officer', async () => {
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

      vi.spyOn(prisma.impactAssessment, 'findUnique').mockResolvedValueOnce({
        id: 'ia-1',
        totalImpactScore: 88.0,
        status: ImpactAssessmentStatus.SUBMITTED,
      } as any);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        return callback({
          impactAssessment: {
            update: vi.fn().mockResolvedValue({
              id: 'ia-1',
              status: ImpactAssessmentStatus.VERIFIED,
              verifiedAt: new Date(),
            }),
          },
          auditEvent: { create: vi.fn().mockResolvedValue({}) },
        });
      });

      const res = await request(app)
        .patch('/api/v1/impact/ia-1/verify')
        .set('Authorization', `Bearer ${officerToken}`)
        .send({
          decision: 'VERIFIED',
          notes: 'Field verified in Murhu block. Sustainable community outcomes confirmed.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('VERIFIED');
    });

    it('GET /api/v1/analytics/overview should return state-wide intelligence counts', async () => {
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

      vi.spyOn(prisma.report, 'count').mockResolvedValue(15);
      vi.spyOn(prisma.innovationChallenge, 'count').mockResolvedValue(5);
      vi.spyOn(prisma.project, 'count').mockResolvedValue(4);
      vi.spyOn(prisma.pilot, 'count').mockResolvedValue(2);
      vi.spyOn(prisma.deployment, 'count').mockResolvedValue(2);
      vi.spyOn(prisma.impactAssessment, 'count').mockResolvedValue(1);
      vi.spyOn(prisma.problemCluster, 'count').mockResolvedValue(3);
      vi.spyOn(prisma.organization, 'count').mockResolvedValue(4);
      vi.spyOn(prisma.report, 'groupBy').mockResolvedValue([
        { domain: 'Water Management', _count: { id: 10 }, _sum: { estimatedAffectedPopulation: 4500 } },
      ] as any);
      vi.spyOn(prisma.project, 'groupBy').mockResolvedValue([
        { currentIrl: IRL.IRL_6, _count: { id: 2 } },
      ] as any);

      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalReports).toBe(15);
      expect(res.body.data.reportsByDomain).toHaveLength(1);
    });

    it('GET /api/v1/audit should return append-only audit events for authorized officers', async () => {
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

      vi.spyOn(prisma.auditEvent, 'findMany').mockResolvedValueOnce([
        {
          id: 'audit-1',
          action: 'REPORT_VALIDATED',
          resourceType: 'Report',
          resourceId: 'rep-uuid-1',
          actorRole: 'GOVERNMENT_OFFICER',
          createdAt: new Date(),
        },
      ] as any);
      vi.spyOn(prisma.auditEvent, 'count').mockResolvedValueOnce(1);

      const res = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].action).toBe('REPORT_VALIDATED');
    });
  });
});
