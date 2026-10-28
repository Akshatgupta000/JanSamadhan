import { IMPACT_WEIGHTS } from '../../common/constants/weights';

export interface ImpactCalculationInput {
  targetPopulation?: number;
  verifiedBeneficiariesCount?: number;
  rawBeneficiariesCount?: number;
  baselineValue?: number | null;
  postDeploymentValue?: number | null;
  citizenSatisfactionAvg?: number | null; // 1.0 to 5.0 scale
  sustainabilityRating?: number | null; // 0-100 or rubric score
  isDeploymentActive?: boolean;
  hasSustainabilityPlan?: boolean;
}

export interface ImpactCalculationResult {
  totalImpactScore: number; // 0-100
  populationBenefitedScore: number;
  problemReductionScore: number;
  citizenSatisfactionScore: number;
  sustainabilityScore: number;
  deploymentSuccessScore: number;
  reductionPercentage: number | null;
  factorBreakdown: Array<{
    factor: string;
    name: string;
    weight: number;
    rawScore: number;
    contribution: number;
    explanation: string;
  }>;
  algorithmVersion: string;
  calculatedAt: string;
}

export class ImpactCalculator {
  public static readonly VERSION = 'impact-v1.0.0';

  /**
   * Calculates problem reduction percentage:
   * (baseline - postDeployment) / baseline * 100
   */
  public static calculateReductionPercentage(
    baseline?: number | null,
    postDeployment?: number | null
  ): number | null {
    if (baseline == null || postDeployment == null || baseline <= 0) {
      return null;
    }
    const reduction = ((baseline - postDeployment) / baseline) * 100;
    // Bound between -100% and 100%
    return Number(Math.max(-100, Math.min(100, reduction)).toFixed(2));
  }

  public static calculate(input: ImpactCalculationInput): ImpactCalculationResult {
    // 1. Population Benefited Score (Weight 25%)
    // Compares verified beneficiaries against target or raw beneficiaries
    const beneficiaries = input.verifiedBeneficiariesCount ?? input.rawBeneficiariesCount ?? 0;
    const target = input.targetPopulation && input.targetPopulation > 0 ? input.targetPopulation : 500;
    const populationBenefitedScore = Math.min(100, Math.round((beneficiaries / target) * 100));

    // 2. Problem Reduction Score (Weight 30%)
    const reductionPct = this.calculateReductionPercentage(input.baselineValue, input.postDeploymentValue);
    let problemReductionScore = 50; // Neutral default if no baseline
    if (reductionPct !== null) {
      if (reductionPct <= 0) {
        problemReductionScore = 10; // Problem worsened or unchanged
      } else {
        problemReductionScore = Math.min(100, Math.round(reductionPct));
      }
    }

    // 3. Citizen Satisfaction Score (Weight 20%)
    // Scale 1.0 - 5.0 converted to 0 - 100
    let citizenSatisfactionScore = 60;
    if (input.citizenSatisfactionAvg != null && input.citizenSatisfactionAvg >= 1.0) {
      citizenSatisfactionScore = Math.min(
        100,
        Math.max(0, Math.round(((input.citizenSatisfactionAvg - 1.0) / 4.0) * 100))
      );
    }

    // 4. Solution Sustainability Score (Weight 15%)
    let sustainabilityScore = input.sustainabilityRating ?? 60;
    if (input.hasSustainabilityPlan) {
      sustainabilityScore = Math.min(100, sustainabilityScore + 20);
    }

    // 5. Deployment Success Score (Weight 10%)
    const deploymentSuccessScore = input.isDeploymentActive ? 100 : 40;

    // Weighted Total
    const popContr = populationBenefitedScore * IMPACT_WEIGHTS.POPULATION_BENEFITED;
    const redContr = problemReductionScore * IMPACT_WEIGHTS.PROBLEM_REDUCTION;
    const satContr = citizenSatisfactionScore * IMPACT_WEIGHTS.CITIZEN_SATISFACTION;
    const susContr = sustainabilityScore * IMPACT_WEIGHTS.SUSTAINABILITY;
    const depContr = deploymentSuccessScore * IMPACT_WEIGHTS.DEPLOYMENT_SUCCESS;

    const totalImpactScore = Number(
      (popContr + redContr + satContr + susContr + depContr).toFixed(2)
    );

    const factorBreakdown = [
      {
        factor: 'populationBenefited',
        name: 'Population Benefited',
        weight: IMPACT_WEIGHTS.POPULATION_BENEFITED,
        rawScore: populationBenefitedScore,
        contribution: Number(popContr.toFixed(2)),
        explanation: `${beneficiaries} verified beneficiaries out of target ${target} (${populationBenefitedScore}/100).`,
      },
      {
        factor: 'problemReduction',
        name: 'Measured Problem Reduction',
        weight: IMPACT_WEIGHTS.PROBLEM_REDUCTION,
        rawScore: problemReductionScore,
        contribution: Number(redContr.toFixed(2)),
        explanation: reductionPct !== null
          ? `Problem reduced by ${reductionPct}% from baseline (${input.baselineValue} -> ${input.postDeploymentValue}).`
          : 'Baseline comparison pending or incomplete; neutral score applied.',
      },
      {
        factor: 'citizenSatisfaction',
        name: 'Citizen Satisfaction',
        weight: IMPACT_WEIGHTS.CITIZEN_SATISFACTION,
        rawScore: citizenSatisfactionScore,
        contribution: Number(satContr.toFixed(2)),
        explanation: input.citizenSatisfactionAvg != null
          ? `Average community satisfaction: ${input.citizenSatisfactionAvg.toFixed(1)}/5.0 (${citizenSatisfactionScore}/100).`
          : 'Community satisfaction survey in progress.',
      },
      {
        factor: 'sustainability',
        name: 'Solution Sustainability',
        weight: IMPACT_WEIGHTS.SUSTAINABILITY,
        rawScore: sustainabilityScore,
        contribution: Number(susContr.toFixed(2)),
        explanation: `Assessed on maintenance plan, institutional governance, and resource runway (${sustainabilityScore}/100).`,
      },
      {
        factor: 'deploymentSuccess',
        name: 'Operational Deployment Success',
        weight: IMPACT_WEIGHTS.DEPLOYMENT_SUCCESS,
        rawScore: deploymentSuccessScore,
        contribution: Number(depContr.toFixed(2)),
        explanation: input.isDeploymentActive
          ? 'Solution actively operating in the field (100/100).'
          : 'Deployment in transitional or testing phase (40/100).',
      },
    ];

    return {
      totalImpactScore,
      populationBenefitedScore,
      problemReductionScore,
      citizenSatisfactionScore,
      sustainabilityScore,
      deploymentSuccessScore,
      reductionPercentage: reductionPct,
      factorBreakdown,
      algorithmVersion: this.VERSION,
      calculatedAt: new Date().toISOString(),
    };
  }
}

