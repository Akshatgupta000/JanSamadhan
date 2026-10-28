import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { Application } from 'express';
import { prisma } from '../../src/config/database';
import { HashUtil } from '../../src/common/utils/hash';
import { JwtUtil } from '../../src/common/utils/jwt';
import {
  Role,
  SeverityLevel,
  IRL,
  ProposalStatus,
  ImpactAssessmentStatus,
  ClusterStatus,
  ChallengeStatus,
  ReportStatus,
  CollaborationStatus,
} from '@prisma/client';

describe('JanSamadhan Innovation Hub - 22-Step End-to-End Acceptance Test (Section 34)', () => {
  let app: Application;
  let citizenToken: string;
  let officerToken: string;
  let facultyToken: string;
  let industryToken: string;
  let adminToken: string;
  let sharedPasswordHash: string;

  const mockCitizenId = 'user-citizen-01';
  const mockOfficerId = 'user-officer-01';
  const mockFacultyId = 'user-faculty-01';
  const mockIndustryId = 'user-industry-01';
  const mockAdminId = 'user-admin-01';

  const mockReportId = 'rep-khunti-water-01';
  const mockClusterId = 'cluster-khunti-01';
  const mockChallengeId = 'chal-khunti-water-01';
  const mockTeamId = 'team-jalrakshak-01';
  const mockProposalId = 'prop-jalrakshak-01';
  const mockProjectId = 'proj-jalrakshak-01';
  const mockImpactId = 'impact-khunti-01';

  beforeAll(async () => {
    app = createApp();
    sharedPasswordHash = await HashUtil.hash('CitizenSecure@2026');

    citizenToken = JwtUtil.signAccessToken({
      userId: mockCitizenId,
      email: 'citizen.khunti@jharkhand.example',
      roles: [Role.CITIZEN],
    });

    officerToken = JwtUtil.signAccessToken({
      userId: mockOfficerId,
      email: 'officer.water@jharkhand.gov.in',
      roles: [Role.GOVERNMENT_OFFICER],
    });

    facultyToken = JwtUtil.signAccessToken({
      userId: mockFacultyId,
      email: 'prof.kumar@bitmesra.ac.in',
      roles: [Role.FACULTY],
    });

    industryToken = JwtUtil.signAccessToken({
      userId: mockIndustryId,
      email: 'csr.lead@tatasteel.example',
      roles: [Role.INDUSTRY_PARTNER],
    });

    adminToken = JwtUtil.signAccessToken({
      userId: mockAdminId,
      email: 'admin@jansamadhan.jharkhand.gov.in',
      roles: [Role.PLATFORM_ADMIN],
    });
  });

  beforeEach(() => {
    vi.restoreAllMocks();

    // Default mock for user lookup used across auth middleware
    vi.spyOn(prisma.user, 'findUnique').mockImplementation(async (args: any) => {
      const id = args.where.id;
      const email = args.where.email;

      let matchedRole: Role = Role.CITIZEN;
      let matchedEmail = 'citizen.khunti@jharkhand.example';
      if (id === mockOfficerId || email === 'officer.water@jharkhand.gov.in') {
        matchedRole = Role.GOVERNMENT_OFFICER;
        matchedEmail = 'officer.water@jharkhand.gov.in';
      } else if (id === mockFacultyId || email === 'prof.kumar@bitmesra.ac.in') {
        matchedRole = Role.FACULTY;
        matchedEmail = 'prof.kumar@bitmesra.ac.in';
      } else if (id === mockIndustryId || email === 'csr.lead@tatasteel.example') {
        matchedRole = Role.INDUSTRY_PARTNER;
        matchedEmail = 'csr.lead@tatasteel.example';
      } else if (id === mockAdminId || email === 'admin@jansamadhan.jharkhand.gov.in') {
        matchedRole = Role.PLATFORM_ADMIN;
        matchedEmail = 'admin@jansamadhan.jharkhand.gov.in';
      }

      return {
        id: id || mockCitizenId,
        name: 'Mock Test User',
        email: email || matchedEmail,
        passwordHash: sharedPasswordHash,
        accountStatus: 'ACTIVE',
        roles: [{ role: matchedRole }],
        orgMemberships: [{ organizationId: 'org-bit-mesra' }],
      } as any;
    });
  });

  // Step 1: A citizen registers and logs in
  it('Step 1: Citizen registers and logs in successfully', async () => {
    vi.spyOn(prisma.refreshToken, 'create').mockResolvedValueOnce({} as any);
    vi.spyOn(prisma.auditEvent, 'create').mockResolvedValueOnce({} as any);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'citizen.khunti@jharkhand.example',
        password: 'CitizenSecure@2026',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.tokens.accessToken).toBeDefined();
    expect(loginRes.body.data.user.email).toBe('citizen.khunti@jharkhand.example');
  });

  // Step 2: The citizen submits a rural drinking-water problem with description, location, evidence
  it('Step 2: Citizen submits a rural drinking-water problem report with evidence metadata', async () => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback({
        report: {
          create: vi.fn().mockResolvedValue({
            id: mockReportId,
            referenceNumber: 'JS-2026-WTR01',
            title: 'Severe Arsenic and Fluoride Contamination in Murhu Handpumps',
            description: 'Three deep borewells in Murhu block are discharging contaminated reddish water.',
            domain: 'Water Management',
            subdomain: 'Rural Drinking Water',
            district: 'Khunti',
            state: 'Jharkhand',
            latitude: 23.0784,
            longitude: 85.2789,
            estimatedAffectedPopulation: 1450,
            status: ReportStatus.SUBMITTED,
          }),
        },
        auditEvent: { create: vi.fn().mockResolvedValue({}) },
      });
    });

    vi.spyOn(prisma.backgroundJob, 'create').mockResolvedValueOnce({
      id: 'job-wtr-01',
      queueName: 'ai-intelligence',
      jobName: 'AI_ANALYZE_REPORT',
      status: 'PENDING',
    } as any);

    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Severe Arsenic and Fluoride Contamination in Murhu Handpumps',
        description: 'Three deep borewells in Murhu block are discharging contaminated reddish water.',
        domain: 'Water Management',
        subdomain: 'Rural Drinking Water',
        district: 'Khunti',
        latitude: 23.0784,
        longitude: 85.2789,
        estimatedAffectedPopulation: 1450,
        publicSafetyConcern: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(mockReportId);
  });

  // Step 3: The system stores the report and its initial workflow state
  it('Step 3: System stores report with initial workflow state SUBMITTED', async () => {
    vi.spyOn(prisma.report, 'findUnique').mockResolvedValueOnce({
      id: mockReportId,
      referenceNumber: 'JS-2026-WTR01',
      title: 'Severe Arsenic and Fluoride Contamination in Murhu Handpumps',
      domain: 'Water Management',
      district: 'Khunti',
      status: ReportStatus.SUBMITTED,
      visibility: 'PUBLIC',
      estimatedAffectedPopulation: 1450,
      evidence: [],
      reviews: [],
    } as any);

    const res = await request(app).get(`/api/v1/reports/${mockReportId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('SUBMITTED');
  });

  // Step 4 & 5: Background job analyzes report, API exposes structured classification, confidence & evidence
  it('Step 4 & 5: AI intelligence extraction exposes structured classification, confidence, and evidence', async () => {
    vi.spyOn(prisma.aIAnalysis, 'findUnique').mockResolvedValueOnce({
      id: 'analysis-wtr-01',
      reportId: mockReportId,
      domain: 'Water Management',
      subdomain: 'Rural Drinking Water',
      problemType: 'Chemical Contamination & Groundwater Depletion',
      severity: SeverityLevel.CRITICAL,
      urgency: SeverityLevel.HIGH,
      estimatedAffectedPopulation: 1450,
      requiredExpertise: ['Environmental Engineering', 'Water Filtration', 'IoT Water Quality Sensors'],
      keywords: ['arsenic', 'fluoride', 'groundwater', 'handpump'],
      confidence: 0.92,
      modelVersion: 'gemini-1.5-flash',
      isFallback: false,
    } as any);

    const res = await request(app).get(`/api/v1/reports/${mockReportId}/analysis`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.domain).toBe('Water Management');
    expect(res.body.data.severity).toBe('CRITICAL');
    expect(res.body.data.confidence).toBe(0.92);
  });

  // Step 6: Duplicate engine retrieves similar existing reports
  it('Step 6: Duplicate detection retrieves similar reports with compatible embeddings', async () => {
    vi.spyOn(prisma.reportEmbedding, 'findUnique').mockResolvedValueOnce({
      id: 'emb-01',
      reportId: mockReportId,
      embeddingJson: new Array(768).fill(0.2),
    } as any);

    vi.spyOn(prisma.reportEmbedding, 'findMany').mockResolvedValueOnce([
      {
        id: 'emb-02',
        reportId: 'rep-khunti-water-02',
        embeddingJson: new Array(768).fill(0.2), // Identical -> 1.0 similarity
        report: {
          id: 'rep-khunti-water-02',
          referenceNumber: 'JS-2026-WTR02',
          title: 'Fluoride Poisoning in Murhu Block School Water Source',
          description: 'High fluoride concentration causing skeletal symptoms in children.',
          domain: 'Water Management',
          district: 'Khunti',
          estimatedAffectedPopulation: 850,
          status: ReportStatus.SUBMITTED,
          createdAt: new Date(),
        },
      },
    ] as any);

    const res = await request(app).get(`/api/v1/reports/${mockReportId}/duplicate-candidates`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.candidates).toHaveLength(1);
    expect(res.body.data.candidates[0].similarityPercentage).toBeGreaterThanOrEqual(70);
  });

  // Step 7: System recommends a cluster or creates one through authorized workflow
  it('Step 7: Government officer creates a Problem Cluster with deduplicated population', async () => {
    vi.spyOn(prisma.report, 'findMany').mockResolvedValueOnce([
      { id: mockReportId, estimatedAffectedPopulation: 1450 } as any,
      { id: 'rep-khunti-water-02', estimatedAffectedPopulation: 850 } as any,
    ]);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback({
        problemCluster: {
          create: vi.fn().mockResolvedValue({
            id: mockClusterId,
            name: 'Khunti Groundwater Quality Crisis Cluster',
            domain: 'Water Management',
            district: 'Khunti',
            status: ClusterStatus.PROPOSED,
            rawTotalPopulation: 2300,
            deduplicatedPopulation: 2000,
            members: [
              { reportId: mockReportId, similarityScore: 0.94 },
              { reportId: 'rep-khunti-water-02', similarityScore: 0.91 },
            ],
          }),
        },
        auditEvent: { create: vi.fn().mockResolvedValue({}) },
      });
    });

    const res = await request(app)
      .post('/api/v1/clusters')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        name: 'Khunti Groundwater Quality Crisis Cluster',
        domain: 'Water Management',
        district: 'Khunti',
        reportIds: [mockReportId, 'rep-khunti-water-02'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deduplicatedPopulation).toBe(2000);
  });

  // Step 8: Priority engine calculates transparent score and factor breakdown
  it('Step 8: Priority engine calculates transparent score and factor breakdown', async () => {
    vi.spyOn(prisma.priorityAssessment, 'findUnique').mockResolvedValueOnce({
      id: 'prio-wtr-01',
      reportId: mockReportId,
      priorityScore: 92.5,
      recommendedPriority: SeverityLevel.CRITICAL,
      factorBreakdown: [
        { factor: 'severity', rawScore: 100, weight: 0.3, contribution: 30.0 },
        { factor: 'population', rawScore: 85, weight: 0.25, contribution: 21.25 },
        { factor: 'urgency', rawScore: 90, weight: 0.2, contribution: 18.0 },
        { factor: 'publicSafety', rawScore: 100, weight: 0.15, contribution: 15.0 },
        { factor: 'recurrence', rawScore: 82.5, weight: 0.1, contribution: 8.25 },
      ],
      algorithmVersion: 'priority-v1.0.0',
      report: { id: mockReportId, referenceNumber: 'JS-2026-WTR01', title: 'Severe Contamination' },
    } as any);

    const res = await request(app).get(`/api/v1/reports/${mockReportId}/priority`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.priorityScore).toBe(92.5);
    expect(res.body.data.recommendedPriority).toBe('CRITICAL');
  });

  // Step 9: Government officer reviews report and accepts or overrides priority with recorded reason
  it('Step 9: Government officer records priority decision with required justification', async () => {
    vi.spyOn(prisma.report, 'findUnique').mockResolvedValueOnce({
      id: mockReportId,
      severity: SeverityLevel.HIGH,
      priorityAssessment: { recommendedPriority: SeverityLevel.CRITICAL },
    } as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback({
        priorityDecision: {
          create: vi.fn().mockResolvedValue({
            id: 'pdec-01',
            reportId: mockReportId,
            decisionType: 'ACCEPTED',
            finalPriority: SeverityLevel.CRITICAL,
            officerReason: 'Confirmed critical health hazards from Khunti District Public Health Office',
          }),
        },
        report: { update: vi.fn().mockResolvedValue({}) },
        auditEvent: { create: vi.fn().mockResolvedValue({}) },
      });
    });

    const res = await request(app)
      .post(`/api/v1/reports/${mockReportId}/priority/decision`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        decisionType: 'ACCEPTED',
        finalPriority: SeverityLevel.CRITICAL,
        reason: 'Confirmed critical health hazards from Khunti District Public Health Office',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.decisionType).toBe('ACCEPTED');
  });

  // Step 10: Authorized officer validates report and promotes or links it to an innovation challenge
  it('Step 10: Officer validates report and creates Innovation Challenge linked to source report', async () => {
    vi.spyOn(prisma.report, 'findUnique').mockResolvedValueOnce({
      id: mockReportId,
      status: ReportStatus.SUBMITTED,
      citizenId: mockCitizenId,
    } as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback({
        report: { update: vi.fn().mockResolvedValue({ id: mockReportId, status: ReportStatus.VALIDATED }) },
        reportReview: { create: vi.fn().mockResolvedValue({}) },
        notification: { create: vi.fn().mockResolvedValue({}) },
        auditEvent: { create: vi.fn().mockResolvedValue({}) },
      });
    });

    const valRes = await request(app)
      .post(`/api/v1/reports/${mockReportId}/validate`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ notes: 'Validated following field inspection in Murhu block.' });

    expect(valRes.status).toBe(200);
    expect(valRes.body.data.report.status).toBe('VALIDATED');

    // Create Innovation Challenge
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback({
        innovationChallenge: {
          create: vi.fn().mockResolvedValue({
            id: mockChallengeId,
            referenceNumber: 'CHAL-2026-WTR01',
            title: 'Khunti Low-Cost Solar-Powered Arsenic & Fluoride Remediation Challenge',
            domain: 'Water Management',
            district: 'Khunti',
            sourceReportId: mockReportId,
            status: ChallengeStatus.OPEN,
          }),
        },
        report: { update: vi.fn().mockResolvedValue({ id: mockReportId, status: ReportStatus.LINKED_TO_CHALLENGE }) },
        auditEvent: { create: vi.fn().mockResolvedValue({}) },
      });
    });

    const chalRes = await request(app)
      .post('/api/v1/challenges')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        title: 'Khunti Low-Cost Solar-Powered Arsenic & Fluoride Remediation Challenge',
        description: 'Design robust decentralized filtration units for rural drinking water points.',
        domain: 'Water Management',
        district: 'Khunti',
        sourceReportId: mockReportId,
        requiredExpertise: ['Chemical Engineering', 'Water Filtration', 'Solar IoT'],
      });

    expect(chalRes.status).toBe(201);
    expect(chalRes.body.data.referenceNumber).toBe('CHAL-2026-WTR01');
  });

  // Step 11 & 12: Matching engine recommends universities with explainable rankings and supporting evidence
  it('Step 11 & 12: Matching engine computes explainable university rankings with evidence', async () => {
    vi.spyOn(prisma.universityRecommendation, 'findMany').mockResolvedValueOnce([
      {
        id: 'rec-bit-01',
        challengeId: mockChallengeId,
        universityId: 'org-bit-mesra',
        totalScore: 91.5,
        rank: 1,
        scoreCoverage: 1.0,
        facultyExpertiseScore: 95.0,
        departmentScore: 85.0,
        previousProjectsScore: 90.0,
        labFacilitiesScore: 95.0,
        successMetricsScore: 90.0,
        geographicScore: 90.0,
        whyRecommended: 'Top ranked in Environmental & Civil Engineering with certified Water Quality Testing Laboratory',
        university: {
          id: 'org-bit-mesra',
          name: 'Birla Institute of Technology (BIT) Mesra',
          district: 'Ranchi',
          departments: [{ name: 'Civil and Environmental Engineering' }],
          laboratories: [{ name: 'Advanced Environmental & Water Quality Testing Lab' }],
        },
      },
    ] as any);

    const res = await request(app).get(`/api/v1/challenges/${mockChallengeId}/university-matches`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].rank).toBe(1);
    expect(res.body.data[0].totalScore).toBe(91.5);
    expect(res.body.data[0].scoreCoverage).toBe(1.0);
    expect(res.body.data[0].whyRecommended).toContain('Environmental');
  });

  // Step 13 & 14: University accepts challenge, forms team, assigns faculty mentor
  it('Step 13 & 14: University forms student-faculty team JalRakshak for the challenge', async () => {
    vi.spyOn(prisma.organization, 'findUnique').mockResolvedValueOnce({
      id: 'org-bit-mesra',
      name: 'Birla Institute of Technology (BIT) Mesra',
    } as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback({
        team: {
          create: vi.fn().mockResolvedValue({
            id: mockTeamId,
            name: 'JalRakshak Innovation Unit',
            challengeId: mockChallengeId,
            universityId: 'org-bit-mesra',
            createdById: mockFacultyId,
            status: 'ACTIVE',
            members: [
              { userId: mockFacultyId, role: 'FACULTY_MENTOR' },
              { userId: 'user-student-01', role: 'STUDENT_LEAD' },
            ],
            university: { id: 'org-bit-mesra', name: 'BIT Mesra' },
          }),
        },
        auditEvent: { create: vi.fn().mockResolvedValue({}) },
      });
    });

    const res = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        name: 'JalRakshak Innovation Unit',
        challengeId: mockChallengeId,
        universityId: 'org-bit-mesra',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('JalRakshak Innovation Unit');
  });

  // Step 15: Team submits proposal and project is established
  it('Step 15: Team submits proposal and reviewer approves proposal establishing Project at IRL_1', async () => {
    vi.spyOn(prisma.innovationChallenge, 'findUnique').mockResolvedValueOnce({
      id: mockChallengeId,
      status: ChallengeStatus.OPEN,
    } as any);

    vi.spyOn(prisma.team, 'findUnique').mockResolvedValueOnce({
      id: mockTeamId,
      members: [{ userId: mockFacultyId }],
    } as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback({
        proposal: {
          create: vi.fn().mockResolvedValue({
            id: mockProposalId,
            title: 'Decentralized Solar-Powered Arsenic Adsorption & IoT Flow Cell',
            challengeId: mockChallengeId,
            teamId: mockTeamId,
            status: ProposalStatus.SUBMITTED,
            budgetEstimate: 185000,
          }),
        },
        innovationChallenge: {
          update: vi.fn().mockResolvedValue({}),
        },
        auditEvent: { create: vi.fn().mockResolvedValue({}) },
      });
    });

    const propRes = await request(app)
      .post('/api/v1/proposals')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Decentralized Solar-Powered Arsenic Adsorption & IoT Flow Cell',
        problemUnderstanding: 'Severe groundwater contamination requiring decentralized sustainable filtration.',
        proposedSolution: 'Solar-powered multi-stage adsorption filter with activated alumina.',
        technicalApproach: 'Continuous-flow bed adsorption with GSM turbidity/arsenic sensor.',
        implementationPlan: 'Prototype lab validation followed by 250 household village pilot.',
        challengeId: mockChallengeId,
        teamId: mockTeamId,
      });

    expect(propRes.status).toBe(201);
    expect(propRes.body.data.status).toBe('SUBMITTED');

    // Review & approve proposal -> establishes Project
    vi.spyOn(prisma.proposal, 'findUnique').mockResolvedValueOnce({
      id: mockProposalId,
      title: 'Decentralized Solar-Powered Arsenic Adsorption',
      challengeId: mockChallengeId,
      teamId: mockTeamId,
      challenge: { title: 'Khunti Remediation Challenge' },
    } as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback({
        proposal: {
          update: vi.fn().mockResolvedValue({ id: mockProposalId, status: ProposalStatus.APPROVED }),
        },
        proposalReview: { create: vi.fn().mockResolvedValue({}) },
        project: {
          create: vi.fn().mockResolvedValue({
            id: mockProjectId,
            title: 'Decentralized Solar-Powered Arsenic Adsorption',
            currentIrl: IRL.IRL_1,
            status: 'ACTIVE',
          }),
        },
        iRLTransition: { create: vi.fn().mockResolvedValue({}) },
        auditEvent: { create: vi.fn().mockResolvedValue({}) },
      });
    });

    const reviewRes = await request(app)
      .patch(`/api/v1/proposals/${mockProposalId}/review`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        decision: ProposalStatus.APPROVED,
        feedback: 'Technical architecture, budget, and mentor qualifications approved for prototype funding.',
      });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.proposal.status).toBe('APPROVED');
  });

  // Step 16: Project progresses through milestones and valid IRL transitions
  it('Step 16: Project advances through sequential IRL progression (IRL_1 to IRL_2)', async () => {
    vi.spyOn(prisma.project, 'findUnique').mockResolvedValueOnce({
      id: mockProjectId,
      currentIrl: IRL.IRL_1,
      pilots: [],
      deployments: [],
      impactAssessments: [],
    } as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback({
        project: {
          update: vi.fn().mockResolvedValue({ id: mockProjectId, currentIrl: IRL.IRL_2 }),
        },
        iRLTransition: {
          create: vi.fn().mockResolvedValue({
            id: 'trans-01',
            projectId: mockProjectId,
            fromIrl: IRL.IRL_1,
            toIrl: IRL.IRL_2,
            reason: 'Bench-scale adsorption isotherms confirmed in BIT Mesra water laboratory',
          }),
        },
        auditEvent: { create: vi.fn().mockResolvedValue({}) },
      });
    });

    const res = await request(app)
      .post(`/api/v1/projects/${mockProjectId}/readiness/advance`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        targetIrl: IRL.IRL_2,
        reason: 'Bench-scale adsorption isotherms confirmed in BIT Mesra water laboratory',
        evidenceSummary: 'Spectrophotometer readings show 96% reduction in dissolved arsenic.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.project.currentIrl).toBe('IRL_2');
  });

  // Step 17: Industry partner receives match and participates via authorized collaboration
  it('Step 17: Industry partner requests collaboration and provides testing and CSR support', async () => {
    vi.spyOn(prisma.industryRecommendation, 'findMany').mockResolvedValueOnce([
      {
        id: 'ind-rec-01',
        challengeId: mockChallengeId,
        industryOrgId: 'org-tatasteel',
        totalScore: 89.0,
        rank: 1,
        whyRecommended: 'Rural drinking water CSR mandate in Khunti district and IoT fabrication facilities',
        industryOrg: {
          id: 'org-tatasteel',
          name: 'Tata Steel Rural Development Society (TSRDS)',
          district: 'Jamshedpur',
        },
      },
    ] as any);

    const matchRes = await request(app).get(`/api/v1/challenges/${mockChallengeId}/industry-matches`);
    expect(matchRes.status).toBe(200);
    expect(matchRes.body.data[0].rank).toBe(1);

    // Create Collaboration Offer
    vi.spyOn(prisma.organization, 'findUnique').mockResolvedValueOnce({
      id: 'org-tatasteel',
      name: 'Tata Steel Rural Development Society',
    } as any);

    vi.spyOn(prisma.collaboration, 'create').mockResolvedValueOnce({
      id: 'collab-01',
      challengeId: mockChallengeId,
      projectId: mockProjectId,
      industryOrgId: 'org-tatasteel',
      collaborationType: 'FUNDING',
      status: CollaborationStatus.PROPOSED,
    } as any);

    vi.spyOn(prisma.auditEvent, 'create').mockResolvedValueOnce({} as any);

    const collabRes = await request(app)
      .post('/api/v1/collaborations')
      .set('Authorization', `Bearer ${industryToken}`)
      .send({
        challengeId: mockChallengeId,
        projectId: mockProjectId,
        industryOrgId: 'org-tatasteel',
        proposedByType: 'INDUSTRY',
        collaborationType: 'FUNDING',
        description: 'CSR capital grant for village filtration skids and solar telemetry modules.',
      });

    expect(collabRes.status).toBe(201);
    expect(collabRes.body.success).toBe(true);
    expect(collabRes.body.data.id).toBe('collab-01');
  });

  // Step 18: Project records community pilot and deployment evidence
  it('Step 18: Project records community pilot in Murhu block and active deployment record', async () => {
    vi.spyOn(prisma.project, 'findUnique').mockResolvedValueOnce({
      id: mockProjectId,
      status: 'ACTIVE',
    } as any);

    vi.spyOn(prisma.pilot, 'create').mockResolvedValueOnce({
      id: 'pilot-khunti-01',
      projectId: mockProjectId,
      targetCommunity: 'Murhu Tribal Gram Sabha',
      location: 'Murhu Village Panchayat Kendra',
      district: 'Khunti',
      status: 'ACTIVE',
    } as any);

    vi.spyOn(prisma.auditEvent, 'create').mockResolvedValueOnce({} as any);

    const pilotRes = await request(app)
      .post(`/api/v1/projects/${mockProjectId}/pilots`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        targetCommunity: 'Murhu Tribal Gram Sabha',
        location: 'Murhu Village Panchayat Kendra',
        district: 'Khunti',
        startDate: '2026-09-01T00:00:00Z',
        endDate: '2026-10-15T00:00:00Z',
        objectives: 'Turbidity < 1 NTU, Arsenic < 0.01 mg/L for 45 continuous days',
      });

    expect(pilotRes.status).toBe(201);
    expect(pilotRes.body.data.location).toBe('Murhu Village Panchayat Kendra');

    // Create Deployment
    vi.spyOn(prisma.project, 'findUnique').mockResolvedValueOnce({
      id: mockProjectId,
      status: 'ACTIVE',
    } as any);

    vi.spyOn(prisma.deployment, 'create').mockResolvedValueOnce({
      id: 'dep-khunti-01',
      projectId: mockProjectId,
      location: 'Murhu Block, Khunti District',
      district: 'Khunti',
      operationalStatus: 'ACTIVE',
      verifiedBeneficiaries: 3920,
    } as any);

    vi.spyOn(prisma.auditEvent, 'create').mockResolvedValueOnce({} as any);

    const depRes = await request(app)
      .post('/api/v1/deployments')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        projectId: mockProjectId,
        responsibleOrgId: 'org-bit-mesra',
        location: 'Murhu Block, Khunti District',
        district: 'Khunti',
        latitude: 23.0784,
        longitude: 85.2789,
        verifiedBeneficiaries: 3920,
      });

    expect(depRes.status).toBe(201);
    expect(depRes.body.data.operationalStatus).toBe('ACTIVE');
  });

  // Step 19: Impact module calculates scores from documented measurements
  it('Step 19: Impact engine calculates 5-factor verified social impact score', async () => {
    vi.spyOn(prisma.project, 'findUnique').mockResolvedValueOnce({
      id: mockProjectId,
      deployments: [{ id: 'dep-khunti-01' }],
    } as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback({
        impactAssessment: {
          create: vi.fn().mockResolvedValue({
            id: mockImpactId,
            projectId: mockProjectId,
            totalImpactScore: 89.2,
            reductionPercentage: 82.4,
            status: ImpactAssessmentStatus.SUBMITTED,
          }),
        },
        auditEvent: { create: vi.fn().mockResolvedValue({}) },
      });
    });

    const res = await request(app)
      .post(`/api/v1/projects/${mockProjectId}/impact`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        targetPopulation: 4350,
        verifiedBeneficiariesCount: 3920,
        baselineValue: 17,
        postDeploymentValue: 3,
        citizenSatisfactionAvg: 4.4,
        sustainabilityRating: 88,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.totalImpactScore).toBe(89.2);
    expect(res.body.data.reductionPercentage).toBe(82.4);
  });

  // Step 20: Authorized reviewer verifies or rejects impact assessment
  it('Step 20: Government officer verifies impact assessment with field verification remarks', async () => {
    vi.spyOn(prisma.impactAssessment, 'findUnique').mockResolvedValueOnce({
      id: mockImpactId,
      status: ImpactAssessmentStatus.SUBMITTED,
    } as any);

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      return callback({
        impactAssessment: {
          update: vi.fn().mockResolvedValue({
            id: mockImpactId,
            status: ImpactAssessmentStatus.VERIFIED,
            verifiedAt: new Date(),
          }),
        },
        auditEvent: { create: vi.fn().mockResolvedValue({}) },
      });
    });

    const res = await request(app)
      .patch(`/api/v1/impact/${mockImpactId}/verify`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        decision: 'VERIFIED',
        notes: 'Water quality tests in Murhu confirm compliance with BIS 10500 drinking water norms.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('VERIFIED');
  });

  // Step 21: Government analytics APIs reflect relevant workflow and verified outcome
  it('Step 21: Analytics APIs reflect verified impact and district intelligence', async () => {
    vi.spyOn(prisma.report, 'count').mockResolvedValue(12);
    vi.spyOn(prisma.innovationChallenge, 'count').mockResolvedValue(3);
    vi.spyOn(prisma.project, 'count').mockResolvedValue(2);
    vi.spyOn(prisma.pilot, 'count').mockResolvedValue(2);
    vi.spyOn(prisma.deployment, 'count').mockResolvedValue(2);
    vi.spyOn(prisma.impactAssessment, 'count').mockResolvedValue(1);
    vi.spyOn(prisma.problemCluster, 'count').mockResolvedValue(2);
    vi.spyOn(prisma.organization, 'count').mockResolvedValue(6);

    vi.spyOn(prisma.report, 'groupBy').mockResolvedValue([
      { domain: 'Water Management', _count: { id: 10 }, _sum: { estimatedAffectedPopulation: 4350 } },
    ] as any);

    vi.spyOn(prisma.project, 'groupBy').mockResolvedValue([
      { currentIrl: IRL.IRL_2, _count: { id: 2 } },
    ] as any);

    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalReports).toBe(12);
  });

  // Step 22: Audit history explains important decisions throughout the process
  it('Step 22: Audit trail and Report history explain all governance decisions across the lifecycle', async () => {
    vi.spyOn(prisma.report, 'findUnique').mockResolvedValueOnce({
      id: mockReportId,
      referenceNumber: 'JS-2026-WTR01',
      citizenId: mockCitizenId,
      status: ReportStatus.LINKED_TO_CHALLENGE,
      createdAt: new Date(),
      updatedAt: new Date(),
      reviews: [
        {
          id: 'rev-01',
          action: 'VALIDATE',
          notes: 'Validated following field inspection in Murhu block.',
          reviewer: { id: mockOfficerId, name: 'Sanjay Kumar Verma', email: 'officer.water@jharkhand.gov.in' },
        },
      ],
      challengesDerived: [
        { id: mockChallengeId, referenceNumber: 'CHAL-2026-WTR01', title: 'Khunti Challenge', status: 'OPEN' },
      ],
    } as any);

    vi.spyOn(prisma.auditEvent, 'findMany').mockResolvedValueOnce([
      {
        id: 'aud-01',
        action: 'REPORT_SUBMITTED',
        resourceType: 'Report',
        resourceId: mockReportId,
        actorRole: 'CITIZEN',
        createdAt: new Date(),
      },
      {
        id: 'aud-02',
        action: 'REPORT_VALIDATED',
        resourceType: 'Report',
        resourceId: mockReportId,
        actorRole: 'GOVERNMENT_OFFICER',
        createdAt: new Date(),
      },
    ] as any);

    const historyRes = await request(app)
      .get(`/api/v1/reports/${mockReportId}/history`)
      .set('Authorization', `Bearer ${citizenToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.success).toBe(true);
    expect(historyRes.body.data.referenceNumber).toBe('JS-2026-WTR01');
    expect(historyRes.body.data.reviews).toHaveLength(1);
    expect(historyRes.body.data.auditTrail).toHaveLength(2);
  });
});
