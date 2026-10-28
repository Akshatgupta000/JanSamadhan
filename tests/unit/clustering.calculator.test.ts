import { describe, it, expect } from 'vitest';
import { ClusteringCalculator } from '../../src/modules/clustering/clustering.calculator';

describe('ClusteringCalculator Unit Tests', () => {
  it('should calculate cosine similarity of 1.0 for identical vectors', () => {
    const vecA = [0.5, 0.5, 0.5, 0.5];
    const similarity = ClusteringCalculator.cosineSimilarity(vecA, vecA);
    expect(similarity).toBe(1.0);
  });

  it('should calculate cosine similarity of 0.0 for orthogonal vectors', () => {
    const vecA = [1, 0, 0, 0];
    const vecB = [0, 1, 0, 0];
    const similarity = ClusteringCalculator.cosineSimilarity(vecA, vecB);
    expect(similarity).toBe(0.0);
  });

  it('should handle zero vectors and dimension mismatch without crashing', () => {
    expect(ClusteringCalculator.cosineSimilarity([], [])).toBe(0);
    expect(ClusteringCalculator.cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    expect(ClusteringCalculator.cosineSimilarity([0, 0], [0, 0])).toBe(0);
  });

  it('should compute deduplicated population discount instead of naive linear summation', () => {
    // Village A: 600, Village B: 1200, Village C: 800
    // Naive sum = 2600
    // Deduplicated formula = Max(1200) + (600 + 800) * 0.7 = 1200 + 980 = 2180
    const { rawTotal, deduplicated } = ClusteringCalculator.calculateDeduplicatedPopulation([
      600, 1200, 800,
    ]);

    expect(rawTotal).toBe(2600);
    expect(deduplicated).toBe(2180);
    expect(deduplicated).toBeLessThan(rawTotal);
  });
});

