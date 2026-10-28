import { PrismaClient, Role, OrgType, VerificationStatus, MemberRole, ReportStatus, Visibility, RecurrenceType, SeverityLevel, UrgencyLevel, ChallengeStatus, TeamRole, InvitationStatus, ProposalStatus, ProjectStatus, IRL, MilestoneStatus, CollaborationType, CollaborationStatus, PilotStatus, DeploymentStatus, ImpactAssessmentStatus } from '@prisma/client';
import { HashUtil } from '../src/common/utils/hash';
import { PriorityCalculator } from '../src/modules/prioritization/priority.calculator';
import { UniversityMatchingCalculator } from '../src/modules/matching/university-matching.calculator';
import { ImpactCalculator } from '../src/modules/impact/impact.calculator';
import { MockAIProvider } from '../src/integrations/ai/mock-ai.provider';

const prisma = new PrismaClient();
const aiProvider = new MockAIProvider();

async function main() {
  console.log('🌱 Starting JanSamadhan Innovation Hub Idempotent Seed...');

  // 1. Seed Taxonomies
  console.log('  -> Seeding Taxonomies...');
  const domainData = [
    { code: 'WATER_MGMT', name: 'Water Management', type: 'PROBLEM_DOMAIN', description: 'Drinking water, groundwater, quality, pipelines, and handpumps' },
    { code: 'AGRI_TECH', name: 'Agriculture', type: 'PROBLEM_DOMAIN', description: 'Irrigation, crop health, soil quality, and farmer support' },
    { code: 'SANITATION', name: 'Sanitation', type: 'PROBLEM_DOMAIN', description: 'Waste disposal, sewage, drainage, and community cleanliness' },
    { code: 'HEALTHCARE', name: 'Healthcare', type: 'PROBLEM_DOMAIN', description: 'Rural clinics, telemedicine, drug supply, and public health' },
    { code: 'EDUCATION', name: 'Education', type: 'PROBLEM_DOMAIN', description: 'School infrastructure, digital learning, and literacy' },
    { code: 'LOCAL_INFRA', name: 'Local Infrastructure', type: 'PROBLEM_DOMAIN', description: 'Rural roads, culverts, street lighting, and community buildings' },
  ];

  for (const d of domainData) {
    await prisma.taxonomy.upsert({
      where: { code: d.code },
      create: d,
      update: d,
    });
  }

  // 2. Seed Users & Passwords
  console.log('  -> Seeding Users & Stakeholders...');
  const adminHash = await HashUtil.hash('Admin@2026');
  const officerHash = await HashUtil.hash('Officer@2026');
  const facultyHash = await HashUtil.hash('Faculty@2026');
  const studentHash = await HashUtil.hash('Student@2026');
  const citizenHash = await HashUtil.hash('Citizen@2026');
  const industryHash = await HashUtil.hash('Industry@2026');

  // Platform Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@jansamadhan.gov.in' },
    create: {
      name: 'Platform Administrator',
      email: 'admin@jansamadhan.gov.in',
      passwordHash: adminHash,
      accountStatus: 'ACTIVE',
      roles: { create: { role: Role.PLATFORM_ADMIN } },
    },
    update: {},
  });

  // Government Officer (Higher & Technical Education, Jharkhand)
  const officerUser = await prisma.user.upsert({
    where: { email: 'officer.ranchi@jharkhand.gov.in' },
    create: {
      name: 'Dr. Rajesh Verma (Nodal Officer)',
      email: 'officer.ranchi@jharkhand.gov.in',
      passwordHash: officerHash,
      accountStatus: 'ACTIVE',
      roles: { create: { role: Role.GOVERNMENT_OFFICER } },
    },
    update: {},
  });

  // Citizens
  const citizen1 = await prisma.user.upsert({
    where: { email: 'citizen.murhu@jharkhand.example' },
    create: {
      name: 'Ramesh Munda',
      email: 'citizen.murhu@jharkhand.example',
      passwordHash: citizenHash,
      accountStatus: 'ACTIVE',
      roles: { create: { role: Role.CITIZEN } },
    },
    update: {},
  });

  const citizen2 = await prisma.user.upsert({
    where: { email: 'citizen.torpa@jharkhand.example' },
    create: {
      name: 'Sunita Horo',
      email: 'citizen.torpa@jharkhand.example',
      passwordHash: citizenHash,
      accountStatus: 'ACTIVE',
      roles: { create: { role: Role.CITIZEN } },
    },
    update: {},
  });

  // Faculty Member
  const facultyUser = await prisma.user.upsert({
    where: { email: 'prof.kumar@bitmesra.ac.in' },
    create: {
      name: 'Prof. Alok Kumar',
      email: 'prof.kumar@bitmesra.ac.in',
      passwordHash: facultyHash,
      accountStatus: 'ACTIVE',
      roles: { create: { role: Role.FACULTY } },
    },
    update: {},
  });

  // Students
  const student1 = await prisma.user.upsert({
    where: { email: 'student.lead@bitmesra.ac.in' },
    create: {
      name: 'Priya Sharma (Team Lead)',
      email: 'student.lead@bitmesra.ac.in',
      passwordHash: studentHash,
      accountStatus: 'ACTIVE',
      roles: { create: { role: Role.STUDENT } },
    },
    update: {},
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student.rohit@bitmesra.ac.in' },
    create: {
      name: 'Rohit Kujur',
      email: 'student.rohit@bitmesra.ac.in',
      passwordHash: studentHash,
      accountStatus: 'ACTIVE',
      roles: { create: { role: Role.STUDENT } },
    },
    update: {},
  });

  // Industry Partner
  const industryUser = await prisma.user.upsert({
    where: { email: 'contact@jaltech.example' },
    create: {
      name: 'Vikram Sengupta (JalTech Innovations)',
      email: 'contact@jaltech.example',
      passwordHash: industryHash,
      accountStatus: 'ACTIVE',
      roles: { create: { role: Role.INDUSTRY_PARTNER } },
    },
    update: {},
  });

  // 3. Seed Organizations
  console.log('  -> Seeding Universities & Industry Organizations...');
  const bitMesra = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Birla Institute of Technology, Mesra',
      type: OrgType.UNIVERSITY,
      district: 'Ranchi',
      state: 'Jharkhand',
      latitude: 23.4123,
      longitude: 85.4399,
      website: 'https://www.bitmesra.ac.in',
      verifiedStatus: VerificationStatus.VERIFIED,
      description: 'Premier technical and research university with specialized civil and environmental engineering faculties.',
    },
    update: {},
  });

  const nitJamshedpur = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'National Institute of Technology, Jamshedpur',
      type: OrgType.UNIVERSITY,
      district: 'East Singhbhum',
      state: 'Jharkhand',
      latitude: 22.7758,
      longitude: 86.1437,
      website: 'http://www.nitjsr.ac.in',
      verifiedStatus: VerificationStatus.VERIFIED,
    },
    update: {},
  });

  const jalTech = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'JalTech Solutions Pvt Ltd',
      type: OrgType.STARTUP,
      district: 'Ranchi',
      state: 'Jharkhand',
      website: 'https://jaltech.example',
      verifiedStatus: VerificationStatus.VERIFIED,
      description: 'IoT-enabled rural drinking water monitoring and flow sensor technologies.',
    },
    update: {},
  });

  await prisma.industryCapability.upsert({
    where: { organizationId: jalTech.id },
    create: {
      organizationId: jalTech.id,
      domains: ['Water Management', 'IoT Monitoring', 'Rural Infrastructure'],
      techStack: ['LoRaWAN', 'Flow Sensors', 'Solar Telemetry', 'Cloud Dashboard'],
      mentorshipAvailable: true,
      fundingAvailable: true,
      equipmentAvailable: true,
      apiAccessAvailable: true,
      deploymentSupport: true,
    },
    update: {},
  });

  // Department & Lab for BIT Mesra
  const civilDept = await prisma.department.upsert({
    where: { organizationId_code: { organizationId: bitMesra.id, code: 'CIVIL' } },
    create: {
      organizationId: bitMesra.id,
      name: 'Department of Civil and Environmental Engineering',
      code: 'CIVIL',
      headOfDepartment: 'Dr. Anand Kumar',
    },
    update: {},
  });

  await prisma.laboratory.create({
    data: {
      organizationId: bitMesra.id,
      departmentId: civilDept.id,
      name: 'Water Resources & IoT Systems Research Centre',
      code: 'WREC-01',
      capabilities: ['Water quality assessment', 'Groundwater hydrology modeling', 'IoT telemetry testbench', 'GIS mapping'],
      equipmentList: ['Spectrophotometer', 'Pressure Transducers', 'LoRaWAN Gateways', 'Turbidity Meters'],
      facilityDescription: 'Certified facility for rural water testing and embedded sensor integration.',
    },
  });

  // Faculty Profile
  await prisma.facultyProfile.upsert({
    where: { userId: facultyUser.id },
    create: {
      userId: facultyUser.id,
      organizationId: bitMesra.id,
      departmentId: civilDept.id,
      designation: 'Associate Professor',
      expertiseAreas: ['Civil Engineering', 'Water Resources', 'IoT Monitoring', 'GIS'],
      researchInterests: ['Rural Groundwater Scarcity', 'Smart Sensor Networks', 'Community Handpump Reliability'],
      publicationCount: 32,
      citationsCount: 420,
      previousDeploymentCount: 4,
    },
    update: {},
  });

  // 4. Seed Reports (Realistic Rural Drinking Water Scenario in Khunti district)
  console.log('  -> Seeding Problem Reports (Drinking Water Failure in Khunti)...');
  const rep1 = await prisma.report.upsert({
    where: { referenceNumber: 'JS-2026-WTR01' },
    create: {
      referenceNumber: 'JS-2026-WTR01',
      citizenId: citizen1.id,
      title: 'Recurring Handpump Breakdown and Deep Groundwater Depletion in Murhu Village',
      description: 'For the last three months, our village hand pumps stop working every few days and nearly 600 people depend on them. Groundwater level drops severely during dry periods and water output is rusty and contaminated.',
      domain: 'Water Management',
      subdomain: 'Rural Drinking Water',
      problemType: 'Infrastructure Failure',
      district: 'Khunti',
      villageOrTown: 'Murhu Village',
      state: 'Jharkhand',
      latitude: 23.0722,
      longitude: 85.2755,
      estimatedAffectedPopulation: 600,
      recurrence: RecurrenceType.RECURRING_DAILY,
      severity: SeverityLevel.HIGH,
      urgency: UrgencyLevel.HIGH,
      publicSafetyConcern: true,
      status: ReportStatus.VALIDATED,
      visibility: Visibility.PUBLIC,
    },
    update: {},
  });

  const rep2 = await prisma.report.upsert({
    where: { referenceNumber: 'JS-2026-WTR02' },
    create: {
      referenceNumber: 'JS-2026-WTR02',
      citizenId: citizen2.id,
      title: 'Severe Drinking Water Pipeline Leakage and Borewell Failure in Torpa',
      description: 'The community tube well and solar pump in Torpa market square broke down two weeks ago. Over 1,200 villagers and school children are forced to travel 3 kilometers for drinking water.',
      domain: 'Water Management',
      subdomain: 'Rural Drinking Water',
      problemType: 'Infrastructure Failure',
      district: 'Khunti',
      villageOrTown: 'Torpa',
      state: 'Jharkhand',
      latitude: 22.9555,
      longitude: 85.1122,
      estimatedAffectedPopulation: 1200,
      recurrence: RecurrenceType.CONTINUOUS,
      severity: SeverityLevel.HIGH,
      urgency: UrgencyLevel.HIGH,
      publicSafetyConcern: true,
      status: ReportStatus.VALIDATED,
      visibility: Visibility.PUBLIC,
    },
    update: {},
  });

  // Generate AI Analysis & Embeddings for Reports
  const embedding1 = await aiProvider.generateEmbedding(`${rep1.title} ${rep1.description}`);
  await prisma.reportEmbedding.upsert({
    where: { reportId: rep1.id },
    create: {
      reportId: rep1.id,
      modelName: 'text-embedding-004',
      dimension: 768,
      embeddingJson: embedding1,
    },
    update: {},
  });

  const prio1 = PriorityCalculator.calculate({
    severity: rep1.severity,
    urgency: rep1.urgency,
    population: rep1.estimatedAffectedPopulation,
    publicSafetyConcern: rep1.publicSafetyConcern,
    recurrence: rep1.recurrence,
  });

  await prisma.priorityAssessment.upsert({
    where: { reportId: rep1.id },
    create: {
      reportId: rep1.id,
      severityScore: 75,
      populationScore: 65,
      urgencyScore: 75,
      publicSafetyScore: 100,
      recurrenceScore: 85,
      priorityScore: prio1.priorityScore,
      recommendedPriority: prio1.recommendedPriority,
      factorBreakdown: prio1.factorBreakdown as any,
      algorithmVersion: prio1.algorithmVersion,
    },
    update: {},
  });

  // Priority Decision (Officer Accepted)
  await prisma.priorityDecision.create({
    data: {
      reportId: rep1.id,
      officerId: officerUser.id,
      recommendedPriority: SeverityLevel.HIGH,
      finalPriority: SeverityLevel.HIGH,
      decisionType: 'ACCEPTED',
      reason: 'Confirmed severe recurring water shortage affecting large rural population',
    },
  });

  // 5. Problem Cluster
  console.log('  -> Creating Regional Problem Cluster...');
  const cluster = await prisma.problemCluster.create({
    data: {
      name: 'Khunti District Rural Water Infrastructure & Handpump Failure Cluster',
      summary: 'Combined regional water scarcity cluster across Murhu, Torpa, and Rania blocks with 1,800 direct citizens affected.',
      domain: 'Water Management',
      district: 'Khunti',
      status: 'ACTIVE',
      rawTotalPopulation: 1800,
      deduplicatedPopulation: 1550,
      createdById: officerUser.id,
      reviewedById: officerUser.id,
      reviewNotes: 'Cluster verified as chronic groundwater and mechanical handpump maintenance deficit.',
      members: {
        create: [
          { reportId: rep1.id, similarityScore: 0.92 },
          { reportId: rep2.id, similarityScore: 0.88 },
        ],
      },
    },
  });

  // 6. Innovation Challenge
  console.log('  -> Creating Innovation Challenge...');
  const challenge = await prisma.innovationChallenge.create({
    data: {
      referenceNumber: 'CHAL-2026-WTR01',
      title: 'Solar-Powered Low-Cost Hand Pump IoT Telemetry and Groundwater Monitoring System',
      description: 'Develop and deploy a low-cost, rugged IoT telemetry kit for rural community hand pumps that detects mechanical failure, groundwater drop, and water contamination in real-time, notifying block engineers before complete outage.',
      domain: 'Water Management',
      subdomain: 'Rural Drinking Water',
      district: 'Khunti',
      priority: SeverityLevel.HIGH,
      sourceReportId: rep1.id,
      clusterId: cluster.id,
      createdByOfficerId: officerUser.id,
      status: ChallengeStatus.IN_PROGRESS,
      requiredExpertise: ['Civil Engineering', 'Water Resources', 'IoT Monitoring', 'GIS'],
      estimatedBeneficiaries: 4350,
    },
  });

  // 7. Explainable University Recommendation
  console.log('  -> Calculating University Recommendations...');
  const univRanked = UniversityMatchingCalculator.rankUniversities(
    {
      domain: challenge.domain,
      subdomain: challenge.subdomain,
      requiredExpertise: challenge.requiredExpertise as string[],
      district: challenge.district,
    },
    [
      {
        id: bitMesra.id,
        name: bitMesra.name,
        district: bitMesra.district,
        departments: [{ id: civilDept.id, name: civilDept.name, code: civilDept.code }],
        facultyProfiles: [
          {
            id: 'f1',
            designation: 'Associate Professor',
            expertiseAreas: ['Civil Engineering', 'Water Resources', 'IoT Monitoring', 'GIS'],
            researchInterests: ['Rural Groundwater Scarcity'],
            previousDeploymentCount: 4,
            publicationCount: 32,
          },
        ],
        laboratories: [
          {
            id: 'l1',
            name: 'Water Resources & IoT Systems Research Centre',
            capabilities: ['Water quality assessment', 'Groundwater hydrology modeling', 'IoT telemetry testbench'],
            equipmentList: ['Spectrophotometer', 'Pressure Transducers'],
          },
        ],
        verifiedSuccessCount: 3,
      },
      {
        id: nitJamshedpur.id,
        name: nitJamshedpur.name,
        district: nitJamshedpur.district,
        departments: [{ id: 'd2', name: 'Department of Civil Engineering', code: 'CE' }],
        facultyProfiles: [],
        laboratories: [],
      },
    ]
  );

  for (const rec of univRanked) {
    await prisma.universityRecommendation.create({
      data: {
        challengeId: challenge.id,
        universityId: rec.universityId,
        totalScore: rec.totalScore,
        scoreCoverage: rec.scoreCoverage,
        facultyExpertiseScore: rec.facultyExpertiseScore,
        departmentScore: rec.departmentScore,
        previousProjectScore: rec.previousProjectScore,
        laboratoryScore: rec.laboratoryScore,
        successScore: rec.successScore,
        geographyScore: rec.geographyScore,
        rank: rec.rank,
        factorBreakdown: rec.factorBreakdown as any,
        whyRecommended: rec.whyRecommended,
        algorithmVersion: rec.algorithmVersion,
      },
    });
  }

  // 8. Team & Proposal
  console.log('  -> Forming Team and Submitting Proposal...');
  const team = await prisma.team.create({
    data: {
      name: 'JalRakshak Innovation Team',
      universityId: bitMesra.id,
      challengeId: challenge.id,
      createdById: student1.id,
      members: {
        create: [
          { userId: student1.id, role: TeamRole.STUDENT_LEAD, status: InvitationStatus.ACCEPTED },
          { userId: student2.id, role: TeamRole.STUDENT_MEMBER, status: InvitationStatus.ACCEPTED },
          { userId: facultyUser.id, role: TeamRole.FACULTY_MENTOR, status: InvitationStatus.ACCEPTED },
        ],
      },
    },
  });

  const proposal = await prisma.proposal.create({
    data: {
      challengeId: challenge.id,
      teamId: team.id,
      submittedById: student1.id,
      title: 'JalRakshak: Cellular-LoRa Hybrid Telemetry for Community Hand Pumps',
      problemUnderstanding: 'Rural handpumps fail silently without central visibility. Preventive telemetry drastically reduces downtime from 45 days to under 48 hours.',
      proposedSolution: 'Solar-powered vibration, flow, and acoustic leak sensor clamp for standard India Mark II hand pumps, uploading hourly telemetry via NB-IoT/LoRaWAN.',
      technicalApproach: 'Custom ESP32 firmware with sleep states, piezo-electric pump handle sensor, cloud dashboard, and SMS alerts to village pump caretakers.',
      requiredResources: 'BIT Mesra IoT lab, 20 test sensors, JalTech telemetry gateways.',
      expectedBeneficiaries: 4350,
      implementationPlan: 'Phase 1: Lab bench (Month 1), Phase 2: Pilot in 10 pumps (Month 2), Phase 3: Block deployment (Month 3-5).',
      estimatedTimeline: '6 months',
      expectedImpact: '80% reduction in water outage hours; over 4,000 villagers with uninterrupted drinking water.',
      risksAndLimitations: 'Physical vandalism or theft of solar panels (mitigated by tamper-proof steel casing).',
      status: ProposalStatus.APPROVED,
    },
  });

  // 9. Project Execution & Milestones (IRL-6 Community Pilot)
  console.log('  -> Creating Active Project with IRL-6 Community Pilot...');
  const project = await prisma.project.create({
    data: {
      challengeId: challenge.id,
      proposalId: proposal.id,
      teamId: team.id,
      title: 'JalRakshak Community Water Monitoring Project',
      description: 'Implementation and field deployment of smart telemetry kits on 15 rural hand pumps in Khunti.',
      status: ProjectStatus.ACTIVE,
      currentIrl: IRL.IRL_6, // Community Pilot
      repositoryUrl: 'https://github.com/jharkhand-innovation/jalrakshak-telemetry',
      prototypeUrl: 'https://jalrakshak-preview.jharkhand.gov.in',
      milestones: {
        create: [
          { title: 'M1: Research Baseline & Problem Validation', targetIrl: IRL.IRL_2, status: MilestoneStatus.APPROVED, reviewedById: facultyUser.id },
          { title: 'M2: Architectural Hardware Concept Design', targetIrl: IRL.IRL_3, status: MilestoneStatus.APPROVED, reviewedById: facultyUser.id },
          { title: 'M3: Functional Lab Prototype Tested', targetIrl: IRL.IRL_5, status: MilestoneStatus.APPROVED, reviewedById: facultyUser.id },
          { title: 'M4: Field Community Pilot in Murhu Village', targetIrl: IRL.IRL_6, status: MilestoneStatus.SUBMITTED },
        ],
      },
    },
  });

  // Record sequential IRL Transitions: IRL_1 -> IRL_2 -> IRL_3 -> IRL_4 -> IRL_5 -> IRL_6
  const transitions = [
    { from: IRL.IRL_1, to: IRL.IRL_2, reason: 'Proposal approved by technical review panel. Research baseline accepted.' },
    { from: IRL.IRL_2, to: IRL.IRL_3, reason: 'Hardware design schematic and component specification approved.' },
    { from: IRL.IRL_3, to: IRL.IRL_4, reason: 'Working laboratory prototype fabricated and tested on test bench.' },
    { from: IRL.IRL_4, to: IRL.IRL_5, reason: 'Bench stress testing and environmental durability verified.' },
    { from: IRL.IRL_5, to: IRL.IRL_6, reason: 'Installed on 12 village hand pumps for active community field pilot.' },
  ];

  for (const t of transitions) {
    await prisma.iRLTransition.create({
      data: {
        projectId: project.id,
        fromIrl: t.from,
        toIrl: t.to,
        actorId: facultyUser.id,
        approvedById: officerUser.id,
        reason: t.reason,
      },
    });
  }

  // 10. Industry Collaboration
  await prisma.collaboration.create({
    data: {
      challengeId: challenge.id,
      projectId: project.id,
      industryOrgId: jalTech.id,
      proposedByType: 'INDUSTRY',
      collaborationType: CollaborationType.TECH_APIS,
      description: 'JalTech provides free LoRaWAN gateways, cloud ingestion APIs, and sensor calibration support.',
      status: CollaborationStatus.ACTIVE,
    },
  });

  // 11. Community Pilot & Deployment
  console.log('  -> Recording Pilot and Field Deployment...');
  const pilot = await prisma.pilot.create({
    data: {
      projectId: project.id,
      targetCommunity: 'Murhu & Torpa Rural Blocks',
      location: 'Gram Panchayat Murhu',
      district: 'Khunti',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-08-31'),
      objectives: 'Evaluate sensor uptime, daily stroke volume calculation, and caretaker SMS alert responsiveness across 12 hand pumps.',
      baselineMeasurements: { pumpFailuresPerMonth: 17, averageRepairDowntimeDays: 38 },
      testResults: { telemetryPacketSuccessRate: 98.4, batterySolarAutonomyDays: 24 },
      participantFeedback: { communitySatisfaction: 4.3, caretakerAlertAccuracy: 95.0 },
      status: PilotStatus.COMPLETED,
      reviewStatus: 'APPROVED',
      reviewedById: officerUser.id,
    },
  });

  const deployment = await prisma.deployment.create({
    data: {
      projectId: project.id,
      pilotId: pilot.id,
      location: '15 Hand Pump Sites in Murhu & Torpa Gram Panchayats',
      district: 'Khunti',
      responsibleOrgId: bitMesra.id,
      operationalStatus: DeploymentStatus.ACTIVE,
      estimatedBeneficiaries: 4350,
      verifiedBeneficiaries: 3920,
      sustainabilityPlan: 'Gram Panchayat water sanitation committee trained; replacement parts funded through Jal Jeevan Mission maintenance grant.',
      evidenceSummary: '15 units active for 90 days; real-time telemetry dashboard verified by Block Development Officer.',
      status: 'VERIFIED',
      verifiedById: officerUser.id,
      verifiedAt: new Date(),
    },
  });

  // 12. Social Impact Measurement Engine
  console.log('  -> Calculating and Verifying Social Impact Score...');
  const impactCalculation = ImpactCalculator.calculate({
    targetPopulation: 4350,
    rawBeneficiariesCount: 4350,
    verifiedBeneficiariesCount: 3920,
    baselineValue: 17, // 17 incidents/month before
    postDeploymentValue: 3, // 3 incidents/month after
    citizenSatisfactionAvg: 4.3,
    sustainabilityRating: 85,
    isDeploymentActive: true,
    hasSustainabilityPlan: true,
  });

  await prisma.impactAssessment.create({
    data: {
      projectId: project.id,
      deploymentId: deployment.id,
      populationBenefitedScore: impactCalculation.populationBenefitedScore,
      problemReductionScore: impactCalculation.problemReductionScore,
      citizenSatisfactionScore: impactCalculation.citizenSatisfactionScore,
      sustainabilityScore: impactCalculation.sustainabilityScore,
      deploymentSuccessScore: impactCalculation.deploymentSuccessScore,
      totalImpactScore: impactCalculation.totalImpactScore,
      baselineValue: 17,
      postDeploymentValue: 3,
      reductionPercentage: impactCalculation.reductionPercentage,
      rawBeneficiariesCount: 4350,
      verifiedBeneficiariesCount: 3920,
      citizenSatisfactionAvg: 4.3,
      factorBreakdown: impactCalculation.factorBreakdown as any,
      algorithmVersion: impactCalculation.algorithmVersion,
      status: ImpactAssessmentStatus.VERIFIED,
      verifiedById: officerUser.id,
      verificationNotes: 'Verified via ground inspection and water committee interviews. Total impact score 88.0/100.',
      verifiedAt: new Date(),
    },
  });

  console.log('✅ JanSamadhan Innovation Hub Seed Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

