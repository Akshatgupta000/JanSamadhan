import { describe, it, expect } from 'vitest';
import { PriorityCalculator } from '../../src/modules/prioritization/priority.calculator';
import { SeverityLevel, UrgencyLevel, RecurrenceType } from '@prisma/client';

describe('PriorityCalculator Unit Tests', () => {
  it('should calculate correct priority score with the exact weights from prompt example', () => {
    // Prompt example values:
    // Severity: 90 -> contr 27
    // Population: 80 -> contr 20
    // Urgency: 85 -> contr 17
    // Public safety: 80 -> contr 12
    // Recurrence: 80 -> contr 8
    // Total = 84 -> CRITICAL

    const result = PriorityCalculator.calculate({
      severity: SeverityLevel.CRITICAL, // 100 * 0.3 = 30
      urgency: UrgencyLevel.HIGH,        // 75 * 0.2 = 15
      population: 600,                   // 80 * 0.25 = 20
      publicSafetyConcern: true,         // 100 * 0.15 = 15
      recurrence: RecurrenceType.RECURRING_DAILY, // 85 * 0.10 = 8.5
    });

    // 30 + 15 + 20 + 15 + 8.5 = 88.5 -> CRITICAL
    expect(result.priorityScore).toBe(88.5);
    expect(result.recommendedPriority).toBe(SeverityLevel.CRITICAL);
    expect(result.factorBreakdown).toHaveLength(5);
    expect(result.algorithmVersion).toBe('priority-v1.0.0');
  });

  it('should assign LOW priority band when all factors are minimal', () => {
    const result = PriorityCalculator.calculate({
      severity: SeverityLevel.LOW,       // 25 * 0.3 = 7.5
      urgency: UrgencyLevel.LOW,          // 25 * 0.2 = 5
      population: 5,                     // 20 * 0.25 = 5
      publicSafetyConcern: false,        // 20 * 0.15 = 3
      recurrence: RecurrenceType.ONCE,   // 20 * 0.1 = 2
    });

    // 7.5 + 5 + 5 + 3 + 2 = 22.5 -> LOW (< 40)
    expect(result.priorityScore).toBe(22.5);
    expect(result.recommendedPriority).toBe(SeverityLevel.LOW);
  });

  it('should handle missing values safely with documented neutral defaults', () => {
    const result = PriorityCalculator.calculate({
      severity: null,
      urgency: null,
      population: null,
      publicSafetyConcern: null,
      recurrence: null,
    });

    expect(result.priorityScore).toBeGreaterThan(0);
    expect(result.priorityScore).toBeLessThan(100);
    expect(result.factorBreakdown).toHaveLength(5);
    expect(result.factorBreakdown.every((f) => typeof f.contribution === 'number')).toBe(true);
  });

  it('should normalize population logarithmically without raw population distortion', () => {
    const scoreZero = PriorityCalculator.normalizePopulation(0);
    const scoreSmall = PriorityCalculator.normalizePopulation(20);
    const scoreMedium = PriorityCalculator.normalizePopulation(300);
    const scoreLarge = PriorityCalculator.normalizePopulation(1000);
    const scoreHuge = PriorityCalculator.normalizePopulation(10000);

    expect(scoreZero).toBe(10);
    expect(scoreSmall).toBe(20);
    expect(scoreMedium).toBe(65);
    expect(scoreLarge).toBe(80);
    expect(scoreHuge).toBe(100);

    expect(scoreSmall).toBeLessThan(scoreMedium);
    expect(scoreMedium).toBeLessThan(scoreLarge);
    expect(scoreLarge).toBeLessThanOrEqual(scoreHuge);
  });
});

