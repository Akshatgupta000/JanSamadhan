import { UNIVERSITY_MATCH_WEIGHTS } from '../../common/constants/weights';
import { GeospatialUtil } from '../../common/utils/geospatial';

export interface UniversityCapabilityData {
  id: string;
  name: string;
  district: string;
  latitude?: number | null;
  longitude?: number | null;
  departments: Array<{ id: string; name: string; code: string }>;
  facultyProfiles: Array<{
    id: string;
    designation: string;
    expertiseAreas: string[];
    researchInterests: string[];
    previousDeploymentCount: number;
    publicationCount: number;
  }>;
  laboratories: Array<{
    id: string;
    name: string;
    capabilities: string[];
    equipmentList: string[];
  }>;
  verifiedSuccessCount?: number;
}

export interface UniversityMatchFactorBreakdown {
  factor: string;
  name: string;
  weight: number;
  rawScore: number; // 0-100
  contribution: number;
  evidence: string[];
  explanation: string;
}

export interface UniversityMatchResult {
  universityId: string;
  universityName: string;
  district: string;
  totalScore: number; // 0-100
  scoreCoverage: number; // 0.0 - 1.0
  rank: number;
  facultyExpertiseScore: number;
  departmentScore: number;
  previousProjectScore: number;
  laboratoryScore: number;
  successScore: number;
  geographyScore: number;
  factorBreakdown: UniversityMatchFactorBreakdown[];
  matchingDepartments: string[];
  matchingFacultyExpertise: string[];
  matchingLaboratories: string[];
  whyRecommended: string;
  algorithmVersion: string;
}

export class UniversityMatchingCalculator {
  public static readonly VERSION = 'univ-match-v1.0.0';

  public static rankUniversities(
    challenge: {
      domain: string;
      subdomain?: string | null;
      requiredExpertise: string[];
      district: string;
      latitude?: number | null;
      longitude?: number | null;
    },
    universities: UniversityCapabilityData[]
  ): UniversityMatchResult[] {
    const results: UniversityMatchResult[] = universities.map((univ) => {
      // 1. Faculty Expertise Matching (Weight 30%)
      const reqExpLower = challenge.requiredExpertise.map((e) => e.toLowerCase());
      const matchingFacultySkills: string[] = [];
      let totalFacultySkillHits = 0;

      for (const fac of univ.facultyProfiles) {
        const facSkills = [...fac.expertiseAreas, ...fac.researchInterests].map((s) => s.toLowerCase());
        for (const req of reqExpLower) {
          if (facSkills.some((fs) => fs.includes(req) || req.includes(fs))) {
            matchingFacultySkills.push(req);
            totalFacultySkillHits++;
          }
        }
      }
      const uniqueMatchingSkills = Array.from(new Set(matchingFacultySkills));
      const facultyExpertiseScore =
        challenge.requiredExpertise.length > 0
          ? Math.min(100, Math.round((uniqueMatchingSkills.length / challenge.requiredExpertise.length) * 100))
          : 50;

      // 2. Department Relevance (Weight 20%)
      const matchingDeptNames: string[] = [];
      const domainLower = challenge.domain.toLowerCase();
      const subLower = (challenge.subdomain || '').toLowerCase();

      for (const dept of univ.departments) {
        const dName = dept.name.toLowerCase();
        if (
          dName.includes(domainLower) ||
          (domainLower.includes('water') && (dName.includes('civil') || dName.includes('environmental') || dName.includes('water'))) ||
          (domainLower.includes('agri') && (dName.includes('agri') || dName.includes('bio'))) ||
          (domainLower.includes('health') && (dName.includes('bio') || dName.includes('medical') || dName.includes('pharm'))) ||
          (subLower && dName.includes(subLower))
        ) {
          matchingDeptNames.push(dept.name);
        }
      }
      const departmentScore = matchingDeptNames.length > 0 ? Math.min(100, 60 + matchingDeptNames.length * 20) : 20;

      // 3. Previous Project / Research Similarity (Weight 20%)
      const totalPubs = univ.facultyProfiles.reduce((acc, f) => acc + (f.publicationCount || 0), 0);
      const previousProjectScore = Math.min(100, Math.round(Math.min(50, totalPubs) * 2));

      // 4. Laboratory Capability (Weight 15%)
      const matchingLabs: string[] = [];
      for (const lab of univ.laboratories) {
        const labText = `${lab.name} ${lab.capabilities.join(' ')} ${lab.equipmentList.join(' ')}`.toLowerCase();
        if (
          reqExpLower.some((req) => labText.includes(req)) ||
          labText.includes(domainLower) ||
          (domainLower.includes('water') && (labText.includes('water') || labText.includes('fluid') || labText.includes('iot')))
        ) {
          matchingLabs.push(lab.name);
        }
      }
      const laboratoryScore = matchingLabs.length > 0 ? Math.min(100, 50 + matchingLabs.length * 25) : 15;

      // 5. Success / Deployment History (Weight 10%)
      const deployments = univ.facultyProfiles.reduce((acc, f) => acc + (f.previousDeploymentCount || 0), 0);
      const successScore = Math.min(100, (univ.verifiedSuccessCount || 0) * 30 + deployments * 20);

      // 6. Geographic Suitability (Weight 5%)
      const geographyScore = GeospatialUtil.scoreGeographicSuitability(
        challenge.latitude,
        challenge.longitude,
        challenge.district,
        univ.latitude,
        univ.longitude,
        univ.district
      );

      // Weighted calculation
      const facContr = facultyExpertiseScore * UNIVERSITY_MATCH_WEIGHTS.FACULTY_EXPERTISE;
      const deptContr = departmentScore * UNIVERSITY_MATCH_WEIGHTS.DEPARTMENT;
      const projContr = previousProjectScore * UNIVERSITY_MATCH_WEIGHTS.PREVIOUS_PROJECTS;
      const labContr = laboratoryScore * UNIVERSITY_MATCH_WEIGHTS.LABORATORY_CAPABILITY;
      const succContr = successScore * UNIVERSITY_MATCH_WEIGHTS.PREVIOUS_SUCCESS;
      const geoContr = geographyScore * UNIVERSITY_MATCH_WEIGHTS.GEOGRAPHICAL_SUITABILITY;

      const totalScore = Number(
        (facContr + deptContr + projContr + labContr + succContr + geoContr).toFixed(2)
      );

      // Check coverage: whether faculty, lab, and dept data were available
      let coverageFactorsCount = 6;
      if (univ.facultyProfiles.length === 0) coverageFactorsCount--;
      if (univ.laboratories.length === 0) coverageFactorsCount--;
      if (univ.departments.length === 0) coverageFactorsCount--;
      const scoreCoverage = Number((coverageFactorsCount / 6).toFixed(2));

      // Explanation generation
      const whyParts: string[] = [];
      if (matchingDeptNames.length > 0) whyParts.push(`Departments: ${matchingDeptNames.join(', ')}`);
      if (uniqueMatchingSkills.length > 0) whyParts.push(`Faculty Expertise: ${uniqueMatchingSkills.join(', ')}`);
      if (matchingLabs.length > 0) whyParts.push(`Laboratories: ${matchingLabs.join(', ')}`);
      if (deployments > 0) whyParts.push(`${deployments} verified prior rural deployments`);
      if (geographyScore >= 80) whyParts.push(`Local geographic proximity (${univ.district} district)`);
      const whyRecommended = whyParts.join(' | ') || 'Institutional alignment with regional domain needs';

      const factorBreakdown: UniversityMatchFactorBreakdown[] = [
        {
          factor: 'facultyExpertise',
          name: 'Faculty Expertise Similarity',
          weight: UNIVERSITY_MATCH_WEIGHTS.FACULTY_EXPERTISE,
          rawScore: facultyExpertiseScore,
          contribution: Number(facContr.toFixed(2)),
          evidence: uniqueMatchingSkills,
          explanation: `Matched ${uniqueMatchingSkills.length} required expertise areas across faculty profiles.`,
        },
        {
          factor: 'department',
          name: 'Department Relevance',
          weight: UNIVERSITY_MATCH_WEIGHTS.DEPARTMENT,
          rawScore: departmentScore,
          contribution: Number(deptContr.toFixed(2)),
          evidence: matchingDeptNames,
          explanation: `Relevant academic departments found: ${matchingDeptNames.join(', ') || 'General Engineering'}.`,
        },
        {
          factor: 'previousProjects',
          name: 'Previous Project & Research Track Record',
          weight: UNIVERSITY_MATCH_WEIGHTS.PREVIOUS_PROJECTS,
          rawScore: previousProjectScore,
          contribution: Number(projContr.toFixed(2)),
          evidence: [`${totalPubs} faculty publications/projects`],
          explanation: `Assessed based on ${totalPubs} verified research outputs and projects.`,
        },
        {
          factor: 'laboratoryCapability',
          name: 'Laboratory & Facility Capability',
          weight: UNIVERSITY_MATCH_WEIGHTS.LABORATORY_CAPABILITY,
          rawScore: laboratoryScore,
          contribution: Number(labContr.toFixed(2)),
          evidence: matchingLabs,
          explanation: `Specialized facilities available: ${matchingLabs.join(', ') || 'Basic Labs'}.`,
        },
        {
          factor: 'previousSuccess',
          name: 'Verified Deployment Experience',
          weight: UNIVERSITY_MATCH_WEIGHTS.PREVIOUS_SUCCESS,
          rawScore: successScore,
          contribution: Number(succContr.toFixed(2)),
          evidence: [`${deployments} previous deployments`],
          explanation: `Track record of ${deployments} deployed field solutions.`,
        },
        {
          factor: 'geographicalSuitability',
          name: 'Geographical Proximity & Feasibility',
          weight: UNIVERSITY_MATCH_WEIGHTS.GEOGRAPHICAL_SUITABILITY,
          rawScore: geographyScore,
          contribution: Number(geoContr.toFixed(2)),
          evidence: [`Located in ${univ.district}, challenge in ${challenge.district}`],
          explanation: `Geographical score ${geographyScore}/100 based on district and travel feasibility.`,
        },
      ];

      return {
        universityId: univ.id,
        universityName: univ.name,
        district: univ.district,
        totalScore,
        scoreCoverage,
        rank: 1, // Will be set after sorting
        facultyExpertiseScore,
        departmentScore,
        previousProjectScore,
        laboratoryScore,
        successScore,
        geographyScore,
        factorBreakdown,
        matchingDepartments: matchingDeptNames,
        matchingFacultyExpertise: uniqueMatchingSkills,
        matchingLaboratories: matchingLabs,
        whyRecommended,
        algorithmVersion: this.VERSION,
      };
    });

    // Sort descending by totalScore and assign ranks
    results.sort((a, b) => b.totalScore - a.totalScore);
    results.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    return results;
  }
}

