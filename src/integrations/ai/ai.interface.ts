import { SeverityLevel, UrgencyLevel } from '@prisma/client';

export interface AIIntelligenceOutput {
  domain: string;
  subdomain?: string;
  problemType?: string;
  severity: SeverityLevel;
  urgency: UrgencyLevel;
  estimatedAffectedPopulation: number;
  requiredExpertise: string[];
  keywords: string[];
  entities: Record<string, any>;
  confidence: number;
  suggestedTitle: string;
  problemSummary: string;
  evidenceUsed: string[];
  isFallback: boolean;
  modelVersion: string;
}

export interface IAIProvider {
  extractProblemIntelligence(description: string, title?: string): Promise<AIIntelligenceOutput>;
  generateEmbedding(text: string): Promise<number[]>;
}

