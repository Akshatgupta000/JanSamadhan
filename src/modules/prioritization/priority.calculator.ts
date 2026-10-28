import { SeverityLevel, UrgencyLevel, RecurrenceType } from '@prisma/client';
import { PRIORITY_WEIGHTS } from '../../common/constants/weights';

export interface PriorityFactorScore {
  factor: 'severity' | 'population' | 'urgency' | 'publicSafety' | 'recurrence';
  name: string;
  rawValue: any;
  normalizedScore: number; // 0-100
  weight: number;
  contribution: number;
  explanation: string;
}

export interface PriorityCalculationResult {
  priorityScore: number; // 0-100
  recommendedPriority: SeverityLevel;
  factorBreakdown: PriorityFactorScore[];
  algorithmVersion: string;
  calculatedAt: string;
}

export class PriorityCalculator {
  public static readonly VERSION = 'priority-v1.0.0';

  /**
   * Normalizes Severity level to a 0-100 scale:
   * CRITICAL: 100
   * HIGH: 75
   * MEDIUM: 50
   * LOW: 25
   */
  public static normalizeSeverity(severity?: SeverityLevel | null): number {
    switch (severity) {
      case SeverityLevel.CRITICAL:
        return 100;
      case SeverityLevel.HIGH:
        return 75;
      case SeverityLevel.MEDIUM:
        return 50;
      case SeverityLevel.LOW:
        return 25;
      default:
        return 50; // Documented default for missing value
    }
  }

  /**
   * Normalizes Urgency level to a 0-100 scale:
   * CRITICAL: 100
   * HIGH: 75
   * MEDIUM: 50
   * LOW: 25
   */
  public static normalizeUrgency(urgency?: UrgencyLevel | null): number {
    switch (urgency) {
      case UrgencyLevel.CRITICAL:
        return 100;
      case UrgencyLevel.HIGH:
        return 75;
      case UrgencyLevel.MEDIUM:
        return 50;
      case UrgencyLevel.LOW:
        return 25;
      default:
        return 50;
    }
  }

  /**
   * Normalizes affected population to a 0-100 scale using continuous piecewise log scaling.
   * <= 10: 10
   * 50: 30
   * 200: 50
   * 600: 80
   * 2000+: 100
   */
  public static normalizePopulation(population?: number | null): number {
    if (population == null || population <= 0) {
      return 10; // Documented minimal impact baseline
    }
    if (population <= 25) return 20;
    if (population <= 100) return 40;
    if (population <= 500) return 65;
    if (population <= 1500) return 80;
    if (population <= 5000) return 90;
    return 100;
  }

  /**
   * Normalizes Public Safety concern:
   * True: 100
   * False: 20
   */
  public static normalizePublicSafety(isPublicSafetyConcern?: boolean | null): number {
    return isPublicSafetyConcern ? 100 : 20;
  }

  /**
   * Normalizes Problem Recurrence:
   * CONTINUOUS: 100
   * RECURRING_DAILY: 85
   * RECURRING_WEEKLY: 70
   * RECURRING_SEASONAL: 50
   * ONCE: 20
   */
  public static normalizeRecurrence(recurrence?: RecurrenceType | null): number {
    switch (recurrence) {
      case RecurrenceType.CONTINUOUS:
        return 100;
      case RecurrenceType.RECURRING_DAILY:
        return 85;
      case RecurrenceType.RECURRING_WEEKLY:
        return 70;
      case RecurrenceType.RECURRING_SEASONAL:
        return 50;
      case RecurrenceType.ONCE:
        return 20;
      default:
        return 20;
    }
  }

  public static calculate(params: {
    severity?: SeverityLevel | null;
    urgency?: UrgencyLevel | null;
    population?: number | null;
    publicSafetyConcern?: boolean | null;
    recurrence?: RecurrenceType | null;
  }): PriorityCalculationResult {
    const sevScore = this.normalizeSeverity(params.severity);
    const popScore = this.normalizePopulation(params.population);
    const urgScore = this.normalizeUrgency(params.urgency);
    const safetyScore = this.normalizePublicSafety(params.publicSafetyConcern);
    const recScore = this.normalizeRecurrence(params.recurrence);

    const sevContr = sevScore * PRIORITY_WEIGHTS.SEVERITY;
    const popContr = popScore * PRIORITY_WEIGHTS.POPULATION;
    const urgContr = urgScore * PRIORITY_WEIGHTS.URGENCY;
    const safetyContr = safetyScore * PRIORITY_WEIGHTS.PUBLIC_SAFETY;
    const recContr = recScore * PRIORITY_WEIGHTS.RECURRENCE;

    const totalScore = Number((sevContr + popContr + urgContr + safetyContr + recContr).toFixed(2));

    let recommendedPriority: SeverityLevel = SeverityLevel.LOW;
    if (totalScore >= 80) {
      recommendedPriority = SeverityLevel.CRITICAL;
    } else if (totalScore >= 60) {
      recommendedPriority = SeverityLevel.HIGH;
    } else if (totalScore >= 40) {
      recommendedPriority = SeverityLevel.MEDIUM;
    } else {
      recommendedPriority = SeverityLevel.LOW;
    }

    const factorBreakdown: PriorityFactorScore[] = [
      {
        factor: 'severity',
        name: 'Problem Severity',
        rawValue: params.severity || 'UNKNOWN (DEFAULT: MEDIUM)',
        normalizedScore: sevScore,
        weight: PRIORITY_WEIGHTS.SEVERITY,
        contribution: Number(sevContr.toFixed(2)),
        explanation: `Severity assessed as ${params.severity || 'MEDIUM'}, scaled to ${sevScore}/100.`,
      },
      {
        factor: 'population',
        name: 'Estimated Affected Population',
        rawValue: params.population || 0,
        normalizedScore: popScore,
        weight: PRIORITY_WEIGHTS.POPULATION,
        contribution: Number(popContr.toFixed(2)),
        explanation: `Estimated affected population of ${params.population || 0} normalized to ${popScore}/100.`,
      },
      {
        factor: 'urgency',
        name: 'Response Urgency',
        rawValue: params.urgency || 'UNKNOWN (DEFAULT: MEDIUM)',
        normalizedScore: urgScore,
        weight: PRIORITY_WEIGHTS.URGENCY,
        contribution: Number(urgContr.toFixed(2)),
        explanation: `Urgency assessed as ${params.urgency || 'MEDIUM'}, scaled to ${urgScore}/100.`,
      },
      {
        factor: 'publicSafety',
        name: 'Public Safety Hazard',
        rawValue: Boolean(params.publicSafetyConcern),
        normalizedScore: safetyScore,
        weight: PRIORITY_WEIGHTS.PUBLIC_SAFETY,
        contribution: Number(safetyContr.toFixed(2)),
        explanation: params.publicSafetyConcern
          ? 'Active public safety concern identified (100/100).'
          : 'No immediate direct public safety hazard reported (20/100).',
      },
      {
        factor: 'recurrence',
        name: 'Problem Recurrence',
        rawValue: params.recurrence || 'ONCE',
        normalizedScore: recScore,
        weight: PRIORITY_WEIGHTS.RECURRENCE,
        contribution: Number(recContr.toFixed(2)),
        explanation: `Recurrence pattern is ${params.recurrence || 'ONCE'}, scaled to ${recScore}/100.`,
      },
    ];

    return {
      priorityScore: totalScore,
      recommendedPriority,
      factorBreakdown,
      algorithmVersion: this.VERSION,
      calculatedAt: new Date().toISOString(),
    };
  }
}

