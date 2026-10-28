import { IAIProvider, AIIntelligenceOutput } from './ai.interface';
import { MockAIProvider } from './mock-ai.provider';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export class GeminiAIProvider implements IAIProvider {
  private fallback: MockAIProvider;

  constructor() {
    this.fallback = new MockAIProvider();
  }

  public async extractProblemIntelligence(
    description: string,
    title?: string
  ): Promise<AIIntelligenceOutput> {
    if (!env.AI_API_KEY) {
      logger.info('Gemini AI key not configured; using deterministic rule-based engine');
      return this.fallback.extractProblemIntelligence(description, title);
    }

    try {
      // In production with an active Gemini key, invoke Gemini 1.5 Flash via REST endpoint
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.AI_MODEL_NAME}:generateContent?key=${env.AI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Analyze this citizen report for JanSamadhan Innovation Hub:\nTitle: ${title || 'N/A'}\nDescription: ${description}\nReturn JSON with keys: domain, subdomain, problemType, severity (LOW|MEDIUM|HIGH|CRITICAL), urgency (LOW|MEDIUM|HIGH|CRITICAL), estimatedAffectedPopulation (number), requiredExpertise (array of strings), keywords (array of strings), entities (object), confidence (0.0-1.0), suggestedTitle (string), problemSummary (string), evidenceUsed (array of strings).`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const data: any = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('Empty response from Gemini API');
      }

      const parsed = JSON.parse(content);
      return {
        ...parsed,
        isFallback: false,
        modelVersion: `gemini-${env.AI_MODEL_NAME}`,
      };
    } catch (error) {
      logger.warn({ error }, 'Failed to invoke Gemini API, falling back to rule-based engine');
      return this.fallback.extractProblemIntelligence(description, title);
    }
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    if (!env.AI_API_KEY) {
      return this.fallback.generateEmbedding(text);
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.EMBEDDING_MODEL_NAME}:embedContent?key=${env.AI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: { parts: [{ text }] },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini embedding API returned status ${response.status}`);
      }

      const data: any = await response.json();
      return data.embedding.values;
    } catch (error) {
      logger.warn({ error }, 'Failed to invoke Gemini Embedding API, falling back to deterministic embedding');
      return this.fallback.generateEmbedding(text);
    }
  }
}

