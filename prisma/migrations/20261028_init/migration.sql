-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'GOVERNMENT_OFFICER', 'UNIVERSITY_ADMIN', 'FACULTY', 'STUDENT', 'INDUSTRY_PARTNER', 'PLATFORM_ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('UNIVERSITY', 'GOVERNMENT_DEPT', 'INDUSTRY_COMPANY', 'STARTUP', 'CSR_ORG');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ADMIN', 'MEMBER', 'FACULTY_MEMBER', 'STUDENT_MEMBER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'VALIDATED', 'REJECTED', 'LINKED_TO_CHALLENGE', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE_CITIZEN', 'GOVERNMENT_ONLY');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('ONCE', 'RECURRING_DAILY', 'RECURRING_WEEKLY', 'RECURRING_SEASONAL', 'CONTINUOUS');

-- CreateEnum
CREATE TYPE "SeverityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('START_REVIEW', 'REQUEST_INFO', 'APPROVE_VALIDATE', 'REJECT');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ClusterStatus" AS ENUM ('PROPOSED', 'REVIEWED', 'ACTIVE', 'RESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('OPEN', 'MATCHING', 'ACCEPTED', 'IN_PROGRESS', 'PILOT_STAGE', 'DEPLOYED', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('STUDENT_LEAD', 'STUDENT_MEMBER', 'FACULTY_MENTOR');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "IRL" AS ENUM ('IRL_0', 'IRL_1', 'IRL_2', 'IRL_3', 'IRL_4', 'IRL_5', 'IRL_6', 'IRL_7', 'IRL_8', 'IRL_9');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CollaborationType" AS ENUM ('MENTORSHIP', 'FUNDING', 'TECH_APIS', 'EQUIPMENT', 'TESTING', 'DEPLOYMENT');

-- CreateEnum
CREATE TYPE "CollaborationStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'DECLINED', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PilotStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('PROPOSED', 'ACTIVE', 'SUSPENDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ImpactAssessmentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedByToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "OrgType" NOT NULL,
    "verifiedStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "website" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Jharkhand',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "areasOfExpertise" JSONB,
    "availableResources" JSONB,
    "collaborationPreferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleInOrg" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "headOfDepartment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "expertiseAreas" JSONB NOT NULL,
    "researchInterests" JSONB NOT NULL,
    "bio" TEXT,
    "publicationCount" INTEGER NOT NULL DEFAULT 0,
    "citationsCount" INTEGER NOT NULL DEFAULT 0,
    "previousDeploymentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Laboratory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "departmentId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL,
    "equipmentList" JSONB NOT NULL,
    "facilityDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Laboratory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryCapability" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "domains" JSONB NOT NULL,
    "techStack" JSONB NOT NULL,
    "mentorshipAvailable" BOOLEAN NOT NULL DEFAULT true,
    "fundingAvailable" BOOLEAN NOT NULL DEFAULT false,
    "equipmentAvailable" BOOLEAN NOT NULL DEFAULT false,
    "apiAccessAvailable" BOOLEAN NOT NULL DEFAULT false,
    "deploymentSupport" BOOLEAN NOT NULL DEFAULT true,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustryCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Taxonomy" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Taxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "subdomain" TEXT,
    "problemType" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "villageOrTown" TEXT,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Jharkhand',
    "estimatedAffectedPopulation" INTEGER NOT NULL DEFAULT 0,
    "firstObservedDate" TIMESTAMP(3),
    "recurrence" "RecurrenceType" NOT NULL DEFAULT 'ONCE',
    "severity" "SeverityLevel" NOT NULL DEFAULT 'MEDIUM',
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'MEDIUM',
    "publicSafetyConcern" BOOLEAN NOT NULL DEFAULT false,
    "supportingText" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportEvidence" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'local',
    "uploadStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
    "sha256Checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportReview" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "action" "ReviewAction" NOT NULL,
    "notes" TEXT,
    "previousStatus" "ReportStatus" NOT NULL,
    "newStatus" "ReportStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "subdomain" TEXT,
    "problemType" TEXT,
    "severity" "SeverityLevel" NOT NULL DEFAULT 'MEDIUM',
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'MEDIUM',
    "estimatedAffectedPopulation" INTEGER NOT NULL DEFAULT 0,
    "requiredExpertise" JSONB NOT NULL,
    "keywords" JSONB NOT NULL,
    "entities" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "suggestedTitle" TEXT,
    "problemSummary" TEXT,
    "evidenceUsed" JSONB,
    "isFallback" BOOLEAN NOT NULL DEFAULT true,
    "modelVersion" TEXT NOT NULL DEFAULT 'fallback-v1',
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'COMPLETED',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportEmbedding" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL DEFAULT 'text-embedding-004',
    "dimension" INTEGER NOT NULL DEFAULT 768,
    "embeddingJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemCluster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "domain" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "status" "ClusterStatus" NOT NULL DEFAULT 'PROPOSED',
    "rawTotalPopulation" INTEGER NOT NULL DEFAULT 0,
    "deduplicatedPopulation" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClusterMember" (
    "id" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClusterMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriorityAssessment" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "severityScore" DOUBLE PRECISION NOT NULL,
    "populationScore" DOUBLE PRECISION NOT NULL,
    "urgencyScore" DOUBLE PRECISION NOT NULL,
    "publicSafetyScore" DOUBLE PRECISION NOT NULL,
    "recurrenceScore" DOUBLE PRECISION NOT NULL,
    "priorityScore" DOUBLE PRECISION NOT NULL,
    "recommendedPriority" "SeverityLevel" NOT NULL,
    "factorBreakdown" JSONB NOT NULL,
    "algorithmVersion" TEXT NOT NULL DEFAULT 'priority-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriorityAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriorityDecision" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "recommendedPriority" "SeverityLevel" NOT NULL,
    "finalPriority" "SeverityLevel" NOT NULL,
    "decisionType" TEXT NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriorityDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InnovationChallenge" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "subdomain" TEXT,
    "district" TEXT NOT NULL,
    "priority" "SeverityLevel" NOT NULL DEFAULT 'HIGH',
    "sourceReportId" TEXT,
    "clusterId" TEXT,
    "createdByOfficerId" TEXT NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'OPEN',
    "requiredExpertise" JSONB NOT NULL,
    "estimatedBeneficiaries" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InnovationChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UniversityRecommendation" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "scoreCoverage" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "facultyExpertiseScore" DOUBLE PRECISION NOT NULL,
    "departmentScore" DOUBLE PRECISION NOT NULL,
    "previousProjectScore" DOUBLE PRECISION NOT NULL,
    "laboratoryScore" DOUBLE PRECISION NOT NULL,
    "successScore" DOUBLE PRECISION NOT NULL,
    "geographyScore" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "factorBreakdown" JSONB NOT NULL,
    "whyRecommended" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL DEFAULT 'univ-match-v1',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniversityRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryRecommendation" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "industryOrgId" TEXT NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "techExpertiseScore" DOUBLE PRECISION NOT NULL,
    "mentorshipScore" DOUBLE PRECISION NOT NULL,
    "fundingScore" DOUBLE PRECISION NOT NULL,
    "equipmentScore" DOUBLE PRECISION NOT NULL,
    "deploymentScore" DOUBLE PRECISION NOT NULL,
    "geographyScore" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "factorBreakdown" JSONB NOT NULL,
    "whyRecommended" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL DEFAULT 'industry-match-v1',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndustryRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "challengeId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'STUDENT_MEMBER',
    "status" "InvitationStatus" NOT NULL DEFAULT 'ACCEPTED',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "problemUnderstanding" TEXT NOT NULL,
    "proposedSolution" TEXT NOT NULL,
    "technicalApproach" TEXT NOT NULL,
    "requiredResources" TEXT,
    "expectedBeneficiaries" INTEGER NOT NULL DEFAULT 0,
    "implementationPlan" TEXT NOT NULL,
    "estimatedTimeline" TEXT,
    "expectedImpact" TEXT,
    "risksAndLimitations" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'SUBMITTED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalReview" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" "ProposalStatus" NOT NULL,
    "feedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentIrl" "IRL" NOT NULL DEFAULT 'IRL_1',
    "repositoryUrl" TEXT,
    "prototypeUrl" TEXT,
    "documentationUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetCompletionDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetIrl" "IRL" NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "deliverableUrl" TEXT,
    "notes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneEvidence" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'local',
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MilestoneEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IRLTransition" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fromIrl" "IRL" NOT NULL,
    "toIrl" "IRL" NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceSummary" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IRLTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collaboration" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT,
    "projectId" TEXT,
    "industryOrgId" TEXT NOT NULL,
    "proposedByType" TEXT NOT NULL,
    "collaborationType" "CollaborationType" NOT NULL,
    "description" TEXT NOT NULL,
    "resourceCommitment" TEXT,
    "status" "CollaborationStatus" NOT NULL DEFAULT 'PROPOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collaboration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pilot" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "targetCommunity" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Jharkhand',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "objectives" TEXT NOT NULL,
    "baselineMeasurements" JSONB,
    "testResults" JSONB,
    "participantFeedback" JSONB,
    "issuesEncountered" TEXT,
    "status" "PilotStatus" NOT NULL DEFAULT 'PLANNED',
    "reviewedById" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pilot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "pilotId" TEXT,
    "location" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Jharkhand',
    "deploymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsibleOrgId" TEXT NOT NULL,
    "operationalStatus" "DeploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "estimatedBeneficiaries" INTEGER NOT NULL DEFAULT 0,
    "verifiedBeneficiaries" INTEGER NOT NULL DEFAULT 0,
    "sustainabilityPlan" TEXT,
    "evidenceSummary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactAssessment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "deploymentId" TEXT,
    "populationBenefitedScore" DOUBLE PRECISION NOT NULL,
    "problemReductionScore" DOUBLE PRECISION NOT NULL,
    "citizenSatisfactionScore" DOUBLE PRECISION NOT NULL,
    "sustainabilityScore" DOUBLE PRECISION NOT NULL,
    "deploymentSuccessScore" DOUBLE PRECISION NOT NULL,
    "totalImpactScore" DOUBLE PRECISION NOT NULL,
    "baselineValue" DOUBLE PRECISION,
    "postDeploymentValue" DOUBLE PRECISION,
    "reductionPercentage" DOUBLE PRECISION,
    "rawBeneficiariesCount" INTEGER NOT NULL DEFAULT 0,
    "verifiedBeneficiariesCount" INTEGER NOT NULL DEFAULT 0,
    "citizenSatisfactionAvg" DOUBLE PRECISION,
    "sustainabilityScoreDetails" JSONB,
    "deploymentSuccessDetails" JSONB,
    "factorBreakdown" JSONB NOT NULL,
    "algorithmVersion" TEXT NOT NULL DEFAULT 'impact-v1',
    "status" "ImpactAssessmentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "verifiedById" TEXT,
    "verificationNotes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImpactAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "resourceType" TEXT,
    "resourceId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "correlationId" TEXT,
    "beforeState" JSONB,
    "afterState" JSONB,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundJob" (
    "id" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "data" JSONB,
    "result" JSONB,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackgroundJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIEvaluationRun" (
    "id" TEXT NOT NULL,
    "moduleName" TEXT NOT NULL,
    "datasetName" TEXT NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "metrics" JSONB NOT NULL,
    "config" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIEvaluationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_accountStatus_idx" ON "User"("accountStatus");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_role_idx" ON "UserRole"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE INDEX "Organization_district_idx" ON "Organization"("district");

-- CreateIndex
CREATE INDEX "Organization_verifiedStatus_idx" ON "Organization"("verifiedStatus");

-- CreateIndex
CREATE INDEX "OrganizationMembership_organizationId_idx" ON "OrganizationMembership"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationMembership_userId_idx" ON "OrganizationMembership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key" ON "OrganizationMembership"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Department_organizationId_idx" ON "Department"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_organizationId_code_key" ON "Department"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyProfile_userId_key" ON "FacultyProfile"("userId");

-- CreateIndex
CREATE INDEX "FacultyProfile_organizationId_idx" ON "FacultyProfile"("organizationId");

-- CreateIndex
CREATE INDEX "FacultyProfile_departmentId_idx" ON "FacultyProfile"("departmentId");

-- CreateIndex
CREATE INDEX "Laboratory_organizationId_idx" ON "Laboratory"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryCapability_organizationId_key" ON "IndustryCapability"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Taxonomy_code_key" ON "Taxonomy"("code");

-- CreateIndex
CREATE INDEX "Taxonomy_type_idx" ON "Taxonomy"("type");

-- CreateIndex
CREATE INDEX "Taxonomy_code_idx" ON "Taxonomy"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Report_referenceNumber_key" ON "Report"("referenceNumber");

-- CreateIndex
CREATE INDEX "Report_citizenId_idx" ON "Report"("citizenId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_district_idx" ON "Report"("district");

-- CreateIndex
CREATE INDEX "Report_domain_idx" ON "Report"("domain");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "ReportEvidence_reportId_idx" ON "ReportEvidence"("reportId");

-- CreateIndex
CREATE INDEX "ReportReview_reportId_idx" ON "ReportReview"("reportId");

-- CreateIndex
CREATE INDEX "ReportReview_reviewerId_idx" ON "ReportReview"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "AIAnalysis_reportId_key" ON "AIAnalysis"("reportId");

-- CreateIndex
CREATE INDEX "AIAnalysis_reportId_idx" ON "AIAnalysis"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportEmbedding_reportId_key" ON "ReportEmbedding"("reportId");

-- CreateIndex
CREATE INDEX "ReportEmbedding_reportId_idx" ON "ReportEmbedding"("reportId");

-- CreateIndex
CREATE INDEX "ProblemCluster_domain_idx" ON "ProblemCluster"("domain");

-- CreateIndex
CREATE INDEX "ProblemCluster_district_idx" ON "ProblemCluster"("district");

-- CreateIndex
CREATE INDEX "ProblemCluster_status_idx" ON "ProblemCluster"("status");

-- CreateIndex
CREATE INDEX "ClusterMember_clusterId_idx" ON "ClusterMember"("clusterId");

-- CreateIndex
CREATE INDEX "ClusterMember_reportId_idx" ON "ClusterMember"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ClusterMember_clusterId_reportId_key" ON "ClusterMember"("clusterId", "reportId");

-- CreateIndex
CREATE UNIQUE INDEX "PriorityAssessment_reportId_key" ON "PriorityAssessment"("reportId");

-- CreateIndex
CREATE INDEX "PriorityAssessment_reportId_idx" ON "PriorityAssessment"("reportId");

-- CreateIndex
CREATE INDEX "PriorityAssessment_recommendedPriority_idx" ON "PriorityAssessment"("recommendedPriority");

-- CreateIndex
CREATE INDEX "PriorityDecision_reportId_idx" ON "PriorityDecision"("reportId");

-- CreateIndex
CREATE INDEX "PriorityDecision_officerId_idx" ON "PriorityDecision"("officerId");

-- CreateIndex
CREATE UNIQUE INDEX "InnovationChallenge_referenceNumber_key" ON "InnovationChallenge"("referenceNumber");

-- CreateIndex
CREATE INDEX "InnovationChallenge_status_idx" ON "InnovationChallenge"("status");

-- CreateIndex
CREATE INDEX "InnovationChallenge_domain_idx" ON "InnovationChallenge"("domain");

-- CreateIndex
CREATE INDEX "InnovationChallenge_district_idx" ON "InnovationChallenge"("district");

-- CreateIndex
CREATE INDEX "UniversityRecommendation_challengeId_idx" ON "UniversityRecommendation"("challengeId");

-- CreateIndex
CREATE INDEX "UniversityRecommendation_universityId_idx" ON "UniversityRecommendation"("universityId");

-- CreateIndex
CREATE INDEX "IndustryRecommendation_challengeId_idx" ON "IndustryRecommendation"("challengeId");

-- CreateIndex
CREATE INDEX "IndustryRecommendation_industryOrgId_idx" ON "IndustryRecommendation"("industryOrgId");

-- CreateIndex
CREATE INDEX "Team_universityId_idx" ON "Team"("universityId");

-- CreateIndex
CREATE INDEX "Team_challengeId_idx" ON "Team"("challengeId");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

-- CreateIndex
CREATE INDEX "Proposal_challengeId_idx" ON "Proposal"("challengeId");

-- CreateIndex
CREATE INDEX "Proposal_teamId_idx" ON "Proposal"("teamId");

-- CreateIndex
CREATE INDEX "Proposal_status_idx" ON "Proposal"("status");

-- CreateIndex
CREATE INDEX "ProposalReview_proposalId_idx" ON "ProposalReview"("proposalId");

-- CreateIndex
CREATE INDEX "ProposalReview_reviewerId_idx" ON "ProposalReview"("reviewerId");

-- CreateIndex
CREATE INDEX "Project_challengeId_idx" ON "Project"("challengeId");

-- CreateIndex
CREATE INDEX "Project_teamId_idx" ON "Project"("teamId");

-- CreateIndex
CREATE INDEX "Project_currentIrl_idx" ON "Project"("currentIrl");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "ProjectMilestone_projectId_idx" ON "ProjectMilestone"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMilestone_status_idx" ON "ProjectMilestone"("status");

-- CreateIndex
CREATE INDEX "MilestoneEvidence_milestoneId_idx" ON "MilestoneEvidence"("milestoneId");

-- CreateIndex
CREATE INDEX "IRLTransition_projectId_idx" ON "IRLTransition"("projectId");

-- CreateIndex
CREATE INDEX "Collaboration_industryOrgId_idx" ON "Collaboration"("industryOrgId");

-- CreateIndex
CREATE INDEX "Collaboration_status_idx" ON "Collaboration"("status");

-- CreateIndex
CREATE INDEX "Pilot_projectId_idx" ON "Pilot"("projectId");

-- CreateIndex
CREATE INDEX "Pilot_status_idx" ON "Pilot"("status");

-- CreateIndex
CREATE INDEX "Deployment_projectId_idx" ON "Deployment"("projectId");

-- CreateIndex
CREATE INDEX "Deployment_operationalStatus_idx" ON "Deployment"("operationalStatus");

-- CreateIndex
CREATE INDEX "ImpactAssessment_projectId_idx" ON "ImpactAssessment"("projectId");

-- CreateIndex
CREATE INDEX "ImpactAssessment_status_idx" ON "ImpactAssessment"("status");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "AuditEvent_resourceType_resourceId_idx" ON "AuditEvent"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditEvent_action_idx" ON "AuditEvent"("action");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_idx" ON "AuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "BackgroundJob_queueName_idx" ON "BackgroundJob"("queueName");

-- CreateIndex
CREATE INDEX "BackgroundJob_status_idx" ON "BackgroundJob"("status");

-- CreateIndex
CREATE INDEX "AIEvaluationRun_moduleName_idx" ON "AIEvaluationRun"("moduleName");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyProfile" ADD CONSTRAINT "FacultyProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laboratory" ADD CONSTRAINT "Laboratory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laboratory" ADD CONSTRAINT "Laboratory_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryCapability" ADD CONSTRAINT "IndustryCapability_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Taxonomy" ADD CONSTRAINT "Taxonomy_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Taxonomy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportEvidence" ADD CONSTRAINT "ReportEvidence_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportReview" ADD CONSTRAINT "ReportReview_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportReview" ADD CONSTRAINT "ReportReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportEmbedding" ADD CONSTRAINT "ReportEmbedding_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClusterMember" ADD CONSTRAINT "ClusterMember_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "ProblemCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClusterMember" ADD CONSTRAINT "ClusterMember_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityAssessment" ADD CONSTRAINT "PriorityAssessment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityDecision" ADD CONSTRAINT "PriorityDecision_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityDecision" ADD CONSTRAINT "PriorityDecision_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InnovationChallenge" ADD CONSTRAINT "InnovationChallenge_sourceReportId_fkey" FOREIGN KEY ("sourceReportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InnovationChallenge" ADD CONSTRAINT "InnovationChallenge_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "ProblemCluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityRecommendation" ADD CONSTRAINT "UniversityRecommendation_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "InnovationChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UniversityRecommendation" ADD CONSTRAINT "UniversityRecommendation_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryRecommendation" ADD CONSTRAINT "IndustryRecommendation_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "InnovationChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndustryRecommendation" ADD CONSTRAINT "IndustryRecommendation_industryOrgId_fkey" FOREIGN KEY ("industryOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "InnovationChallenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "InnovationChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalReview" ADD CONSTRAINT "ProposalReview_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalReview" ADD CONSTRAINT "ProposalReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "InnovationChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneEvidence" ADD CONSTRAINT "MilestoneEvidence_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "ProjectMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IRLTransition" ADD CONSTRAINT "IRLTransition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IRLTransition" ADD CONSTRAINT "IRLTransition_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IRLTransition" ADD CONSTRAINT "IRLTransition_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "InnovationChallenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_industryOrgId_fkey" FOREIGN KEY ("industryOrgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pilot" ADD CONSTRAINT "Pilot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pilot" ADD CONSTRAINT "Pilot_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "Pilot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_responsibleOrgId_fkey" FOREIGN KEY ("responsibleOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactAssessment" ADD CONSTRAINT "ImpactAssessment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactAssessment" ADD CONSTRAINT "ImpactAssessment_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactAssessment" ADD CONSTRAINT "ImpactAssessment_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

