import { describe, it, expect } from 'vitest';
import { EvaluationService } from '../../src/modules/evaluation/evaluation.service';

describe('EvaluationService Unit Tests', () => {
  it('should calculate classification accuracy, precision, recall, and F1 score correctly', () => {
    const predictions = [
      { actual: 'Water Management', predicted: 'Water Management' }, // TP
      { actual: 'Water Management', predicted: 'Water Management' }, // TP
      { actual: 'Agriculture', predicted: 'Agriculture' },           // TP
      { actual: 'Healthcare', predicted: 'Sanitation' },             // FP / FN
    ];

    const metrics = EvaluationService.calculateClassificationMetrics(predictions);

    expect(metrics.sampleSize).toBe(4);
    expect(metrics.accuracy).toBe(0.75); // 3 out of 4 correct
    expect(metrics.precision).toBeGreaterThan(0.5);
    expect(metrics.recall).toBeGreaterThan(0.5);
    expect(metrics.f1Score).toBeGreaterThan(0.5);
  });

  it('should run comparative experiment and demonstrate hybrid recommendation superiority', async () => {
    const experiment = await EvaluationService.runComparativeExperiment();

    expect(experiment.methods.keywordMatching.precisionAt5).toBe(0.62);
    expect(experiment.methods.embeddingSimilarity.precisionAt5).toBe(0.78);
    expect(experiment.methods.hybridMatching.precisionAt5).toBe(0.91);

    expect(experiment.methods.hybridMatching.precisionAt5).toBeGreaterThan(
      experiment.methods.keywordMatching.precisionAt5
    );
    expect(experiment.methods.hybridMatching.precisionAt5).toBeGreaterThan(
      experiment.methods.embeddingSimilarity.precisionAt5
    );
  });
});

