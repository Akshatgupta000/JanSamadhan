export class ClusteringCalculator {
  /**
   * Calculates cosine similarity between two vector embeddings.
   * Returns a score between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized text vectors).
   */
  public static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return Number(Math.max(-1, Math.min(1, similarity)).toFixed(4));
  }

  /**
   * Calculates deduplicated population estimate from a list of report population estimates.
   * Rather than naive summing which counts overlapping households multiple times,
   * applies a progressive clustering discount factor for nearby/duplicate reports:
   * Deduped = Max(P) + Sum(Others) * 0.7
   */
  public static calculateDeduplicatedPopulation(populations: number[]): {
    rawTotal: number;
    deduplicated: number;
  } {
    if (!populations || populations.length === 0) {
      return { rawTotal: 0, deduplicated: 0 };
    }

    const rawTotal = populations.reduce((sum, p) => sum + (p || 0), 0);
    const sorted = [...populations].sort((a, b) => b - a);
    const max = sorted[0] || 0;
    const remainder = sorted.slice(1).reduce((sum, p) => sum + (p || 0), 0);

    const deduplicated = Math.round(max + remainder * 0.7);

    return {
      rawTotal,
      deduplicated,
    };
  }
}

