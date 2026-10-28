import { prisma } from '../../config/database';
import { AIFactory } from '../../integrations/ai/ai.factory';
import { PriorityCalculator } from '../prioritization/priority.calculator';
import { NotFoundError } from '../../common/errors/app-error';
import { logger } from '../../config/logger';
import { JobDispatcher } from '../../jobs/job-dispatcher';
import { ProcessingStatus } from '@prisma/client';

export class IntelligenceService {
  /**
   * Processes a report: extracts structured intelligence, computes embeddings,
   * and calculates explainable priority score.
   */
  public static async analyzeReport(reportId: string): Promise<any> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundError('Report not found');

    const aiProvider = AIFactory.getProvider();

    try {
      // 1. Structured AI Extraction
      const extracted = await aiProvider.extractProblemIntelligence(
        report.description,
        report.title
      );

      // 2. Generate Embedding Vector
      const textToEmbed = `${report.title} ${report.description} ${extracted.domain} ${extracted.subdomain || ''} ${extracted.requiredExpertise.join(' ')}`;
      const embedding = await aiProvider.generateEmbedding(textToEmbed);

      // 3. Explainable Priority Calculation
      const priorityResult = PriorityCalculator.calculate({
        severity: extracted.severity || report.severity,
        urgency: extracted.urgency || report.urgency,
        population: extracted.estimatedAffectedPopulation || report.estimatedAffectedPopulation,
        publicSafetyConcern: report.publicSafetyConcern,
        recurrence: report.recurrence,
      });

      // 4. Save to Database in Transaction
      await prisma.$transaction(async (tx) => {
        // Upsert AI Analysis
        await tx.aIAnalysis.upsert({
          where: { reportId },
          create: {
            reportId,
            domain: extracted.domain,
            subdomain: extracted.subdomain,
            problemType: extracted.problemType,
            severity: extracted.severity,
            urgency: extracted.urgency,
            estimatedAffectedPopulation: extracted.estimatedAffectedPopulation,
            requiredExpertise: extracted.requiredExpertise,
            keywords: extracted.keywords,
            entities: extracted.entities,
            confidence: extracted.confidence,
            suggestedTitle: extracted.suggestedTitle,
            problemSummary: extracted.problemSummary,
            evidenceUsed: extracted.evidenceUsed,
            isFallback: extracted.isFallback,
            modelVersion: extracted.modelVersion,
            processingStatus: ProcessingStatus.COMPLETED,
          },
          update: {
            domain: extracted.domain,
            subdomain: extracted.subdomain,
            problemType: extracted.problemType,
            severity: extracted.severity,
            urgency: extracted.urgency,
            estimatedAffectedPopulation: extracted.estimatedAffectedPopulation,
            requiredExpertise: extracted.requiredExpertise,
            keywords: extracted.keywords,
            entities: extracted.entities,
            confidence: extracted.confidence,
            suggestedTitle: extracted.suggestedTitle,
            problemSummary: extracted.problemSummary,
            evidenceUsed: extracted.evidenceUsed,
            isFallback: extracted.isFallback,
            modelVersion: extracted.modelVersion,
            processingStatus: ProcessingStatus.COMPLETED,
          },
        });

        // Upsert Embedding
        await tx.reportEmbedding.upsert({
          where: { reportId },
          create: {
            reportId,
            modelName: 'text-embedding-004',
            dimension: embedding.length,
            embeddingJson: embedding,
          },
          update: {
            embeddingJson: embedding,
          },
        });

        // Upsert Priority Assessment
        await tx.priorityAssessment.upsert({
          where: { reportId },
          create: {
            reportId,
            severityScore: priorityResult.factorBreakdown.find((f) => f.factor === 'severity')?.normalizedScore || 50,
            populationScore: priorityResult.factorBreakdown.find((f) => f.factor === 'population')?.normalizedScore || 50,
            urgencyScore: priorityResult.factorBreakdown.find((f) => f.factor === 'urgency')?.normalizedScore || 50,
            publicSafetyScore: priorityResult.factorBreakdown.find((f) => f.factor === 'publicSafety')?.normalizedScore || 20,
            recurrenceScore: priorityResult.factorBreakdown.find((f) => f.factor === 'recurrence')?.normalizedScore || 20,
            priorityScore: priorityResult.priorityScore,
            recommendedPriority: priorityResult.recommendedPriority,
            factorBreakdown: priorityResult.factorBreakdown as any,
            algorithmVersion: priorityResult.algorithmVersion,
          },
          update: {
            severityScore: priorityResult.factorBreakdown.find((f) => f.factor === 'severity')?.normalizedScore || 50,
            populationScore: priorityResult.factorBreakdown.find((f) => f.factor === 'population')?.normalizedScore || 50,
            urgencyScore: priorityResult.factorBreakdown.find((f) => f.factor === 'urgency')?.normalizedScore || 50,
            publicSafetyScore: priorityResult.factorBreakdown.find((f) => f.factor === 'publicSafety')?.normalizedScore || 20,
            recurrenceScore: priorityResult.factorBreakdown.find((f) => f.factor === 'recurrence')?.normalizedScore || 20,
            priorityScore: priorityResult.priorityScore,
            recommendedPriority: priorityResult.recommendedPriority,
            factorBreakdown: priorityResult.factorBreakdown as any,
            algorithmVersion: priorityResult.algorithmVersion,
          },
        });

        // Update Report fields with structured domain & population if unassigned
        await tx.report.update({
          where: { id: reportId },
          data: {
            domain: extracted.domain,
            subdomain: extracted.subdomain || report.subdomain,
            severity: extracted.severity,
            urgency: extracted.urgency,
            estimatedAffectedPopulation:
              report.estimatedAffectedPopulation > 0
                ? report.estimatedAffectedPopulation
                : extracted.estimatedAffectedPopulation,
          },
        });
      });

      logger.info({ reportId, confidence: extracted.confidence }, 'AI analysis completed');

      return {
        aiAnalysis: extracted,
        priority: priorityResult,
      };
    } catch (error: any) {
      logger.error({ error, reportId }, 'AI analysis failed');
      await prisma.aIAnalysis.upsert({
        where: { reportId },
        create: {
          reportId,
          domain: report.domain,
          severity: report.severity,
          urgency: report.urgency,
          requiredExpertise: [],
          keywords: [],
          entities: {},
          confidence: 0.0,
          processingStatus: ProcessingStatus.FAILED,
          errorMessage: error.message || 'Analysis failed',
        },
        update: {
          processingStatus: ProcessingStatus.FAILED,
          errorMessage: error.message || 'Analysis failed',
        },
      });
      throw error;
    }
  }

  public static async getAnalysis(reportId: string) {
    const analysis = await prisma.aIAnalysis.findUnique({
      where: { reportId },
    });
    if (!analysis) throw new NotFoundError('AI analysis record not found');
    return analysis;
  }

  public static async reprocess(reportId: string) {
    return JobDispatcher.dispatch('ai-intelligence', 'AI_ANALYZE_REPORT', { reportId });
  }
}

// Register background job handler
JobDispatcher.registerHandler('AI_ANALYZE_REPORT', async (data: { reportId: string }) => {
  return IntelligenceService.analyzeReport(data.reportId);
});

