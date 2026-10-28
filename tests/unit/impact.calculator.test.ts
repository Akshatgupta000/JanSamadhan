import { describe, it, expect } from 'vitest';
import { ImpactCalculator } from '../../src/modules/impact/impact.calculator';

describe('ImpactCalculator Unit Tests', () => {
  it('should calculate reduction percentage correctly', () => {
    // 17 incidents down to 3 incidents -> (17 - 3) / 17 * 100 = 82.35%
    const reduction = ImpactCalculator.calculateReductionPercentage(17, 3);
    expect(reduction).toBe(82.35);
  });

  it('should return null when baseline is missing or non-positive', () => {
    expect(ImpactCalculator.calculateReductionPercentage(null, 5)).toBeNull();
    expect(ImpactCalculator.calculateReductionPercentage(0, 5)).toBeNull();
    expect(ImpactCalculator.calculateReductionPercentage(-10, 5)).toBeNull();
  });

  it('should calculate overall social impact score according to the 5 weighted factors', () => {
    // Factors:
    // populationBenefited: 25%
    // problemReduction: 30%
    // citizenSatisfaction: 20%
    // sustainability: 15%
    // deploymentSuccess: 10%
    const result = ImpactCalculator.calculate({
      targetPopulation: 4350,
      verifiedBeneficiariesCount: 3920, // 3920/4350 = 90%
      baselineValue: 17,
      postDeploymentValue: 3,           // 82%
      citizenSatisfactionAvg: 4.3,      // (4.3 - 1)/4 = 82.5% -> 83
      sustainabilityRating: 85,
      isDeploymentActive: true,         // 100
      hasSustainabilityPlan: true,
    });

    expect(result.totalImpactScore).toBeGreaterThan(75);
    expect(result.totalImpactScore).toBeLessThanOrEqual(100);
    expect(result.factorBreakdown).toHaveLength(5);
    expect(result.algorithmVersion).toBe('impact-v1.0.0');
  });

  it('should penalize worsening problem where post-deployment exceeds baseline', () => {
    const worsening = ImpactCalculator.calculateReductionPercentage(10, 20);
    expect(worsening).toBe(-100);

    const result = ImpactCalculator.calculate({
      baselineValue: 10,
      postDeploymentValue: 20,
    });

    expect(result.problemReductionScore).toBe(10); // Minimum penalty score
  });
});
