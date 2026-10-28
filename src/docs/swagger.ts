export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'JanSamadhan Innovation Hub API',
    version: '1.0.0',
    description: `
**Smart India Hackathon Problem Statement:** SIH 26043  
**Organization:** Government of Jharkhand, Department of Higher & Technical Education  
**Capstone Category:** Software / Smart Education  

An explainable AI-powered problem intelligence, stakeholder matching, and innovation lifecycle management platform connecting:
**Citizens → Government → Universities → Students and Faculty → Industry and Startups → Communities**

### Complete Business Lifecycle
\`REPORT → VALIDATE → AI UNDERSTAND → DETECT DUPLICATES → CLUSTER → PRIORITIZE → MATCH UNIVERSITIES → FORM TEAMS → SUBMIT PROPOSALS → MATCH INDUSTRY PARTNERS → EXECUTE PROJECT → RUN COMMUNITY PILOT → DEPLOY SOLUTION → MEASURE IMPACT\`
    `,
    contact: {
      name: 'Department of Higher & Technical Education, Government of Jharkhand',
      email: 'support@jansamadhan.jharkhand.gov.in',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Root',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT access token retrieved from /auth/login or /auth/register',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
          correlationId: { type: 'string', example: 'd3b07384-d113-4f0f-8c34-399084de1878' },
          timestamp: { type: 'string', example: '2026-10-28T18:00:00.000Z' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'UNAUTHORIZED' },
              message: { type: 'string', example: 'Access token expired or invalid' },
              details: { type: 'object' },
            },
          },
          correlationId: { type: 'string' },
          timestamp: { type: 'string' },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Application liveness health check',
        responses: { 200: { description: 'Server is healthy' } },
      },
    },
    '/ready': {
      get: {
        summary: 'Dependency readiness check (Database, Storage, AI providers)',
        responses: { 200: { description: 'All required dependencies operational' } },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Citizen / Student / Faculty / Industry registration',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Sunita Soren' },
                  email: { type: 'string', example: 'sunita@jharkhand.example' },
                  password: { type: 'string', example: 'Jharkhand@2026' },
                  role: { type: 'string', enum: ['CITIZEN', 'STUDENT', 'FACULTY', 'INDUSTRY_PARTNER'], example: 'CITIZEN' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'User registered with tokens' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'User login with access and refresh token issuance',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'citizen@jharkhand.example' },
                  password: { type: 'string', example: 'Citizen@2026' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Login successful' } },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current authenticated user profile',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Profile details' } },
      },
    },
    '/reports': {
      get: {
        summary: 'List and filter community problem reports',
        parameters: [
          { name: 'domain', in: 'query', schema: { type: 'string' } },
          { name: 'district', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Paginated list of reports' } },
      },
      post: {
        summary: 'Submit a new citizen problem report (Triggers async AI intelligence)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'domain', 'district'],
                properties: {
                  title: { type: 'string', example: 'Recurring Drinking Water Handpump Failure in Murhu' },
                  description: { type: 'string', example: 'For the last three months, our village hand pumps stop working every few days and nearly 600 people depend on them.' },
                  domain: { type: 'string', example: 'Water Management' },
                  subdomain: { type: 'string', example: 'Rural Drinking Water' },
                  district: { type: 'string', example: 'Khunti' },
                  estimatedAffectedPopulation: { type: 'number', example: 600 },
                  publicSafetyConcern: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Report registered' } },
      },
    },
    '/reports/{id}': {
      get: {
        summary: 'Retrieve single report with AI analysis and priority breakdown',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Report details' } },
      },
    },
    '/reports/{id}/validate': {
      post: {
        summary: 'Government officer validates problem report and promotes to Innovation Challenge',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notes: { type: 'string', example: 'Verified with Block Development Officer. Severe ground water issue.' },
                  promoteToChallenge: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Report validated and challenge created' } },
      },
    },
    '/reports/{id}/priority/decision': {
      post: {
        summary: 'Government officer accepts or overrides explainable priority recommendation',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['decisionType', 'finalPriority'],
                properties: {
                  decisionType: { type: 'string', enum: ['ACCEPTED', 'MODIFIED', 'REJECTED'], example: 'ACCEPTED' },
                  finalPriority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], example: 'HIGH' },
                  reason: { type: 'string', example: 'Confirmed immediate public water scarcity' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Priority decision recorded with audit' } },
      },
    },
    '/challenges/{id}/university-matches': {
      get: {
        summary: 'Get explainable university recommendations with transparent factor breakdown',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Ranked universities with evidence' } },
      },
    },
    '/projects/{id}/readiness/advance': {
      post: {
        summary: 'Advance project Innovation Readiness Level (IRL-0 to IRL-9)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['targetIrl', 'reason'],
                properties: {
                  targetIrl: { type: 'string', example: 'IRL_6' },
                  reason: { type: 'string', example: 'Community pilot telemetry tested and approved' },
                  evidenceSummary: { type: 'string', example: 'Pilot IoT logs and 50 household survey results' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'IRL advanced' } },
      },
    },
    '/projects/{id}/impact': {
      post: {
        summary: 'Calculate explainable Social Impact Score based on field measurements',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  targetPopulation: { type: 'number', example: 4350 },
                  verifiedBeneficiariesCount: { type: 'number', example: 3920 },
                  baselineValue: { type: 'number', example: 17 }, // 17 incidents/month
                  postDeploymentValue: { type: 'number', example: 3 }, // 3 incidents/month
                  citizenSatisfactionAvg: { type: 'number', example: 4.3 }, // out of 5.0
                  sustainabilityRating: { type: 'number', example: 85 },
                  isDeploymentActive: { type: 'boolean', example: true },
                  hasSustainabilityPlan: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Impact score calculated' } },
      },
    },
    '/analytics/overview': {
      get: {
        summary: 'Government intelligence dashboard analytics',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Overview statistics and charts' } },
      },
    },
    '/evaluation/experiment': {
      get: {
        summary: 'Run reproducible research experiment (Keyword vs Embedding vs Hybrid Semantic Match)',
        responses: { 200: { description: 'Precision@5, NDCG@5, and latency benchmarks' } },
      },
    },
  },
};
