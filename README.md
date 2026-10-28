# JanSamadhan Innovation Hub - Backend

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-LTS-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-lightgrey.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-blue.svg)](https://github.com/pgvector/pgvector)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-darkblue.svg)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-35%20Passing-success.svg)](https://vitest.dev/)

**Smart India Hackathon Problem Statement:** SIH 26043  
**Organization:** Government of Jharkhand  
**Department:** Department of Higher & Technical Education  
**Category:** Software / Smart Education  
**Positioning:** Explainable AI-Powered Problem Intelligence, Stakeholder Matching, and Innovation Lifecycle Management Platform

---

## 1. Executive Overview

JanSamadhan Innovation Hub is a modular backend platform that connects:
**Citizens → Government → Universities → Students & Faculty → Industry & Startups → Communities**

It transforms unstructured societal grievances into actionable, validated innovation challenges, matches them with capable academic institutions using transparent capability models, tracks projects through validated **Innovation Readiness Levels (IRL-0 to IRL-9)**, and verifies measurable real-world social impact.

### Core Business Pipeline
```
REPORT → VALIDATE → AI UNDERSTAND → DETECT DUPLICATES → CLUSTER → PRIORITIZE
→ MATCH UNIVERSITIES → FORM TEAMS → SUBMIT PROPOSALS → MATCH INDUSTRY PARTNERS
→ EXECUTE PROJECT → RUN COMMUNITY PILOT → DEPLOY SOLUTION → MEASURE IMPACT
```

---

## 2. Architecture & Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Runtime** | Node.js (LTS v18/20) + TypeScript (Strict Mode) | Strong typing, maintainability, type-safe models |
| **Web Framework** | Express.js 4.21 with versioned routing (`/api/v1`) | Mature, flexible REST API foundation |
| **Relational Database** | PostgreSQL 16 + Prisma ORM 5.22 | Relational schema, transactions, migrations, foreign keys |
| **Vector Engine** | PostgreSQL `pgvector` extension | High-performance cosine similarity for duplicate detection |
| **Validation** | Zod 3.23 | Strict schema validation for inputs and environment |
| **Security & Auth** | Argon2id + JWT + Refresh Token Rotation | High-entropy password hashing, session revocation, reuse detection |
| **Background Jobs** | BullMQ + Redis + Database Job Dispatcher | Asynchronous, non-blocking AI extraction and recalculation |
| **Storage Adapter** | S3-compatible client (AWS SDK v3) & Local File Adapter | Modular object storage with safe file metadata in Postgres |
| **Testing** | Vitest 2.1 + Supertest 7.0 | Automated unit tests, integration tests, and coverage reporting |
| **Documentation** | Swagger / OpenAPI 3.0.3 UI (`/docs`) | Interactive schema explorer and REST client |

---

## 3. Directory Structure

```
.
├── src/
│   ├── app.ts                          # Express application assembly & route mounting
│   ├── server.ts                       # Server startup, port listening & graceful shutdown
│   ├── config/
│   │   ├── env.ts                      # Zod-validated environment configuration
│   │   ├── database.ts                 # PrismaClient singleton & connection checks
│   │   ├── logger.ts                   # Pino structured logging with credential redaction
│   │   └── security.ts                 # Role hierarchy & permissions matrix
│   ├── common/
│   │   ├── constants/                  # Algorithm weights, IRL levels, priority bands
│   │   ├── errors/                     # AppError classes & centralized errorHandler
│   │   ├── middleware/                 # Auth, RBAC, request ID, rate limiting, validation
│   │   └── utils/                      # Argon2id hash, JWT utils, audit logger, geospatial math
│   ├── modules/
│   │   ├── auth/                       # Registration, login, token rotation, password change
│   │   ├── users/                      # User profiles, administrative role assignment
│   │   ├── organizations/              # Universities, government depts, industry partners
│   │   ├── taxonomies/                 # Problem domains, subdomains, categories
│   │   ├── reports/                    # Problem reporting, evidence upload, history
│   │   ├── validation/                 # Government review, approval, rejection, challenge promotion
│   │   ├── intelligence/               # AI structured problem extraction & reprocessing
│   │   ├── clustering/                 # Semantic duplicate detection & problem clustering
│   │   ├── prioritization/             # Transparent weighted priority scoring & overrides
│   │   ├── matching/                   # Explainable university & industry matching engines
│   │   ├── challenges/                 # Innovation challenge catalog & lifecycle
│   │   ├── teams/                      # Multidisciplinary student/faculty project teams
│   │   ├── proposals/                  # Technical proposals & faculty/officer reviews
│   │   ├── projects/                   # Project tracking & milestone management
│   │   ├── milestones/                 # Deliverables, evidence, and milestone verification
│   │   ├── readiness/                  # Validated sequential IRL-0 through IRL-9 transitions
│   │   ├── collaborations/             # Industry mentorship, funding, APIs, equipment offers
│   │   ├── pilots/                     # Community pilot trials & baseline/test metrics
│   │   ├── deployments/                # Operational field deployments & verification
│   │   ├── impact/                     # 5-factor social impact engine & verification
│   │   ├── analytics/                  # Government overview & district-level heatmaps
│   │   ├── audit/                      # Append-only audit trail retrieval
│   │   ├── notifications/              # In-app notifications with read/unread tracking
│   │   ├── evaluation/                 # Research comparative experiment (Keyword vs Embedding vs Hybrid)
│   │   └── admin/                      # System health, readiness, and background jobs
│   ├── integrations/
│   │   ├── ai/                         # IAIProvider, Gemini provider, deterministic fallback
│   │   ├── storage/                    # IStorageAdapter, S3 adapter, local storage adapter
│   │   └── email/                      # IEmailAdapter, SMTP adapter, mock email adapter
│   ├── jobs/                           # Resilient asynchronous job dispatcher
│   └── docs/                           # OpenAPI 3.0.3 specification
├── prisma/
│   ├── schema.prisma                   # Normalized database schema with 39 models
│   └── seed.ts                         # Complete idempotent seed script with demonstration flow
├── tests/
│   ├── unit/                           # Priority, University Matching, Clustering, Impact, Auth tests
│   └── integration/                    # Supertest API endpoint tests
├── docker-compose.yml                  # PostgreSQL (pgvector), Redis, MinIO, API
├── Dockerfile                          # Multi-stage production container build
├── package.json                        # Dependencies, scripts, and build targets
└── README.md                           # Documentation
```

---

## 4. Explainable Algorithms & Mathematical Formulations

### A. Explainable Priority Intelligence
Calculates a transparent score (0–100) and maps it to actionable governance bands:
$$\text{PriorityScore} = (\text{Severity} \times 0.30) + (\text{Population} \times 0.25) + (\text{Urgency} \times 0.20) + (\text{PublicSafety} \times 0.15) + (\text{Recurrence} \times 0.10)$$

* **Severity Normalization:** CRITICAL: 100, HIGH: 75, MEDIUM: 50, LOW: 25.
* **Population Normalization:** Continuous piecewise scaling ($\le 25$: 20, $\le 100$: 40, $\le 500$: 65, $\le 1500$: 80, $\le 5000$: 90, $> 5000$: 100).
* **Urgency Normalization:** CRITICAL: 100, HIGH: 75, MEDIUM: 50, LOW: 25.
* **Public Safety Normalization:** Concern identified: 100, Standard: 20.
* **Recurrence Normalization:** CONTINUOUS: 100, DAILY: 85, WEEKLY: 70, SEASONAL: 50, ONCE: 20.
* **Priority Bands:** LOW (0–39.99), MEDIUM (40–59.99), HIGH (60–79.99), CRITICAL (80–100).
* **Human-in-the-Loop:** Government officers can accept, modify, or reject recommendations. Modifications require an audit justification.

### B. Explainable University Recommendation Engine
The platform ranks eligible academic institutions with transparent factor-by-factor evidence:
$$\text{MatchScore} = (\text{FacultyExpertise} \times 0.30) + (\text{Department} \times 0.20) + (\text{PreviousProjects} \times 0.20) + (\text{Laboratory} \times 0.15) + (\text{SuccessHistory} \times 0.10) + (\text{Geography} \times 0.05)$$

Every recommendation provides:
1. Overall score and rank.
2. Score Coverage indicator (percentage of required institutional capability data available).
3. Matched departments, faculty skills, specialized laboratories, and prior deployment count.
4. Haversine distance and geographical proximity scoring.

### C. Social Impact Measurement Engine
Evaluates whether a deployed solution produced genuine societal improvement:
$$\text{ImpactScore} = (\text{PopulationBenefited} \times 0.25) + (\text{ProblemReduction} \times 0.30) + (\text{Satisfaction} \times 0.20) + (\text{Sustainability} \times 0.15) + (\text{DeploymentSuccess} \times 0.10)$$

$$\text{ProblemReductionPercentage} = \frac{\text{BaselineValue} - \text{PostDeploymentValue}}{\text{BaselineValue}} \times 100$$

---

## 5. Innovation Readiness Levels (IRL-0 to IRL-9)

| Level | Identifier | Milestone Definition | Verification Requirement |
| :---: | :---: | :--- | :--- |
| **0** | `IRL_0` | Problem Reported | Citizen submission |
| **1** | `IRL_1` | Problem Validated | Government officer verification |
| **2** | `IRL_2` | Research Completed | Proposal approval & baseline study |
| **3** | `IRL_3` | Concept Developed | Technical schematic & architectural design |
| **4** | `IRL_4` | Prototype Developed | Working lab bench unit |
| **5** | `IRL_5` | Prototype Tested | Laboratory stress & environmental testing |
| **6** | `IRL_6` | Community Pilot | Field trial with target community (e.g. 12 hand pumps) |
| **7** | `IRL_7` | Deployment Ready | Production design & municipal maintenance handover |
| **8** | `IRL_8` | Deployed | Operational solution in the field |
| **9** | `IRL_9` | Impact Verified | Documented before-and-after outcome evaluation |

*Arbitrary level skipping is forbidden. Sequential progression must be approved with documented evidence.*

---

## 6. Seed Accounts & Credentials

For local demonstration and testing purposes, run `npm run prisma:seed`. Fictional demonstration credentials:

| Role | Email | Password | Organization |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `admin@jansamadhan.gov.in` | `Admin@2026` | Platform Governance |
| **Government Officer** | `officer.ranchi@jharkhand.gov.in` | `Officer@2026` | Dept of Higher & Technical Education |
| **Faculty Mentor** | `prof.kumar@bitmesra.ac.in` | `Faculty@2026` | BIT Mesra (Civil Engineering) |
| **Student Lead** | `student.lead@bitmesra.ac.in` | `Student@2026` | JalRakshak Innovation Team |
| **Student Member** | `student.rohit@bitmesra.ac.in` | `Student@2026` | JalRakshak Innovation Team |
| **Citizen (Murhu)** | `citizen.murhu@jharkhand.example` | `Citizen@2026` | Khunti District |
| **Citizen (Torpa)** | `citizen.torpa@jharkhand.example` | `Citizen@2026` | Khunti District |
| **Industry Partner** | `contact@jaltech.example` | `Industry@2026` | JalTech Solutions Ltd |

---

## 7. Setup & Execution Instructions

### A. Prerequisites
- Node.js LTS (v18.19+ or v20+)
- npm (v9+)
- Docker & Docker Compose (optional, for containerized PostgreSQL/Redis/MinIO)

### B. Environment Configuration
Copy the configuration template:
```bash
cp .env.example .env
```

### C. Local Development with Docker
Start database, vector engine, cache, and object storage:
```bash
docker compose up -d postgres redis minio
```

### D. Database Migrations & Seeding
```bash
# Generate Prisma Client
npm run prisma:generate

# Apply Migrations
npm run prisma:migrate

# Seed Demonstration Data
npm run prisma:seed
```

### E. Run Automated Tests
```bash
# Run unit and integration tests
npm test

# Run tests with code coverage report
npm run test:coverage
```

### F. Start the Backend API
```bash
# Development mode with hot-reload
npm run dev

# Production build and run
npm run build
npm start
```

API will be live at: `http://localhost:4000`  
Interactive Swagger Documentation: `http://localhost:4000/docs`  
Health check: `http://localhost:4000/health`  
Readiness check: `http://localhost:4000/ready`  

---

## 8. Complete Demonstration Procedure (SIH 26043 Workflow)

Follow this step-by-step walkthrough to test the complete lifecycle:

1. **Citizen Submits Problem:**
   `POST /api/v1/reports` with citizen token. Submits hand pump failure in Murhu Village, Khunti. Generates reference number `JS-2026-XXXX`.
2. **AI Intelligence Analysis:**
   Async background job processes report: extracts domain (`Water Management`), entities, affected population (~600), generates embedding vector, and calculates priority score (88.5/100 -> `CRITICAL`).
3. **Duplicate Detection & Clustering:**
   `GET /api/v1/clusters/reports/:id/duplicate-candidates` retrieves nearby Torpa report (similarity score: 92%). Government creates problem cluster `Khunti Rural Water Cluster` with combined deduplicated population (1,550 citizens).
4. **Government Review & Priority Decision:**
   `POST /api/v1/reports/:id/priority/decision` records officer review and human override justification in the audit trail.
5. **Government Validation & Challenge Creation:**
   `POST /api/v1/reports/:id/validate` validates report and creates Innovation Challenge `CHAL-2026-WTR01`.
6. **Explainable University Matching:**
   `POST /api/v1/challenges/:id/university-matches/generate` ranks universities. BIT Mesra ranked #1 (Score: 88/100) due to matching Civil Dept, Water Resources Lab, and 4 prior rural deployments.
7. **Team Formation & Proposal:**
   BIT Mesra students form `JalRakshak Tech Team`, assign `Prof. Alok Kumar` as mentor, and submit proposal `POST /api/v1/proposals`.
8. **Proposal Approval & Project Initialization:**
   `POST /api/v1/proposals/:id/review` approves proposal, automatically creating active project with milestones at `IRL_2`.
9. **Industry Collaboration:**
   `POST /api/v1/collaborations` registers JalTech Solutions contributing LoRaWAN gateways and cloud APIs.
10. **Progress Through Milestones & IRL:**
    Team completes prototype (`IRL_5`), installs on 12 pumps in Murhu, and advances to Community Pilot (`IRL_6`) via `POST /api/v1/projects/:id/readiness/advance`.
11. **Pilot & Deployment:**
    `POST /api/v1/deployments` registers 15 active telemetry units serving 3,920 beneficiaries.
12. **Social Impact Verification:**
    `POST /api/v1/projects/:id/impact` calculates Impact Score: 88/100 (82.4% problem reduction, 4.3/5 satisfaction). Government officer verifies outcome via `PATCH /api/v1/impact/:id/verify`.
13. **Government Intelligence Analytics:**
    `GET /api/v1/analytics/overview` and `GET /api/v1/analytics/districts` reflect the verified resolution on state and district dashboards.
14. **Audit Trail Verification:**
    `GET /api/v1/audit` displays the tamper-evident chronological ledger of every decision made throughout the lifecycle.
