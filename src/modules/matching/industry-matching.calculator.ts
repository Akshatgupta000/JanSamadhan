import { INDUSTRY_MATCH_WEIGHTS } from '../../common/constants/weights';
import { GeospatialUtil } from '../../common/utils/geospatial';

export interface IndustryCapabilityData {
  id: string;
  name: string;
  type: string;
  district: string;
  latitude?: number | null;
  longitude?: number | null;
  domains: string[];
  techStack: string[];
  mentorshipAvailable: boolean;
  fundingAvailable: boolean;
  equipmentAvailable: boolean;
  apiAccessAvailable: boolean;
  deploymentSupport: boolean;
}

export interface IndustryMatchResult {
  industryOrgId: string;
  industryOrgName: string;
  orgType: string;
  district: string;
  totalScore: number;
  rank: number;
  techExpertiseScore: number;
  mentorshipScore: number;
  fundingScore: number;
  equipmentScore: number;
  deploymentScore: number;
  geographyScore: number;
  factorBreakdown: any[];
  whyRecommended: string;
  algorithmVersion: string;
}

export class IndustryMatchingCalculator {
  public static readonly VERSION = 'industry-match-v1.0.0';

  public static rankPartners(
    challenge: {
      domain: string;
      requiredExpertise: string[];
      district: string;
      latitude?: number | null;
      longitude?: number | null;
    },
    partners: IndustryCapabilityData[]
  ): IndustryMatchResult[] {
    const results: IndustryMatchResult[] = partners.map((partner) => {
      // 1. Tech Expertise
      const reqLower = challenge.requiredExpertise.map((r) => r.toLowerCase());
      const partnerSkills = [...partner.domains, ...partner.techStack].map((s) => s.toLowerCase());
      const matched = reqLower.filter((req) => partnerSkills.some((ps) => ps.includes(req) || req.includes(ps)));
      const techExpertiseScore =
        challenge.requiredExpertise.length > 0
          ? Math.min(100, Math.round((matched.length / challenge.requiredExpertise.length) * 100))
          : 60;

      // 2. Mentorship
      const mentorshipScore = partner.mentorshipAvailable ? 100 : 20;

      // 3. Tech / APIs
      const apiScore = partner.apiAccessAvailable ? 100 : 30;

      // 4. Funding / CSR
      const fundingScore = partner.fundingAvailable ? 100 : 30;

      // 5. Equipment & Testing
      const equipmentScore = partner.equipmentAvailable ? 100 : 25;

      // 6. Deployment assistance & Geography
      const geoScore = GeospatialUtil.scoreGeographicSuitability(
        challenge.latitude,
        challenge.longitude,
        challenge.district,
        partner.latitude,
        partner.longitude,
        partner.district
      );
      const deploymentScore = partner.deploymentSupport ? (geoScore * 0.5 + 50) : geoScore * 0.5;

      const techContr = techExpertiseScore * INDUSTRY_MATCH_WEIGHTS.TECH_EXPERTISE;
      const mentorContr = mentorshipScore * INDUSTRY_MATCH_WEIGHTS.MENTORSHIP;
      const apiContr = apiScore * INDUSTRY_MATCH_WEIGHTS.TECH_APIS;
      const fundContr = fundingScore * INDUSTRY_MATCH_WEIGHTS.FUNDING;
      const equipContr = equipmentScore * INDUSTRY_MATCH_WEIGHTS.EQUIPMENT;
      const depContr = deploymentScore * INDUSTRY_MATCH_WEIGHTS.DEPLOYMENT_GEOGRAPHY;

      const totalScore = Number(
        (techContr + mentorContr + apiContr + fundContr + equipContr + depContr).toFixed(2)
      );

      const reasons: string[] = [];
      if (partner.mentorshipAvailable) reasons.push('Mentorship available');
      if (partner.fundingAvailable) reasons.push('CSR / Innovation Funding');
      if (partner.apiAccessAvailable) reasons.push('API / Cloud Tools');
      if (partner.deploymentSupport) reasons.push('Field deployment assistance');

      const whyRecommended = reasons.join(' | ') || 'Industry domain alignment';

      const factorBreakdown = [
        { factor: 'techExpertise', score: techExpertiseScore, weight: INDUSTRY_MATCH_WEIGHTS.TECH_EXPERTISE, contribution: Number(techContr.toFixed(2)) },
        { factor: 'mentorship', score: mentorshipScore, weight: INDUSTRY_MATCH_WEIGHTS.MENTORSHIP, contribution: Number(mentorContr.toFixed(2)) },
        { factor: 'techApis', score: apiScore, weight: INDUSTRY_MATCH_WEIGHTS.TECH_APIS, contribution: Number(apiContr.toFixed(2)) },
        { factor: 'funding', score: fundingScore, weight: INDUSTRY_MATCH_WEIGHTS.FUNDING, contribution: Number(fundContr.toFixed(2)) },
        { factor: 'equipment', score: equipmentScore, weight: INDUSTRY_MATCH_WEIGHTS.EQUIPMENT, contribution: Number(equipContr.toFixed(2)) },
        { factor: 'deploymentGeography', score: deploymentScore, weight: INDUSTRY_MATCH_WEIGHTS.DEPLOYMENT_GEOGRAPHY, contribution: Number(depContr.toFixed(2)) },
      ];

      return {
        industryOrgId: partner.id,
        industryOrgName: partner.name,
        orgType: partner.type,
        district: partner.district,
        totalScore,
        rank: 1,
        techExpertiseScore,
        mentorshipScore,
        fundingScore: apiScore,
        equipmentScore,
        deploymentScore,
        geographyScore: geoScore,
        factorBreakdown,
        whyRecommended,
        algorithmVersion: this.VERSION,
      };
    });

    results.sort((a, b) => b.totalScore - a.totalScore);
    results.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    return results;
  }
}

