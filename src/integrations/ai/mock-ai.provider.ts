import { IAIProvider, AIIntelligenceOutput } from './ai.interface';
import { SeverityLevel, UrgencyLevel } from '@prisma/client';
import crypto from 'crypto';

export class MockAIProvider implements IAIProvider {
  public async extractProblemIntelligence(
    description: string,
    title?: string
  ): Promise<AIIntelligenceOutput> {
    const fullText = `${title || ''} ${description}`.toLowerCase();

    // 1. Domain & Subdomain classification
    let domain = 'Local Infrastructure';
    let subdomain = 'Public Utilities';
    let problemType = 'Maintenance Issue';
    let requiredExpertise = ['Civil Engineering', 'Operations Management'];

    if (
      fullText.includes('water') ||
      fullText.includes('hand pump') ||
      fullText.includes('pump') ||
      fullText.includes('well') ||
      fullText.includes('drinking') ||
      fullText.includes('pipeline') ||
      fullText.includes('arsenic') ||
      fullText.includes('fluoride')
    ) {
      domain = 'Water Management';
      subdomain = 'Rural Drinking Water';
      problemType = 'Infrastructure Failure';
      requiredExpertise = ['Civil Engineering', 'Water Resources', 'IoT Monitoring', 'GIS'];
    } else if (
      fullText.includes('crop') ||
      fullText.includes('farmer') ||
      fullText.includes('agriculture') ||
      fullText.includes('irrigation') ||
      fullText.includes('pest') ||
      fullText.includes('soil')
    ) {
      domain = 'Agriculture';
      subdomain = 'Irrigation & Farming';
      problemType = 'Resource Shortage';
      requiredExpertise = ['Agricultural Engineering', 'Agronomy', 'IoT Sensors', 'Soil Science'];
    } else if (
      fullText.includes('hospital') ||
      fullText.includes('health') ||
      fullText.includes('disease') ||
      fullText.includes('medicine') ||
      fullText.includes('doctor') ||
      fullText.includes('clinic')
    ) {
      domain = 'Healthcare';
      subdomain = 'Rural Healthcare Delivery';
      problemType = 'Service Deficit';
      requiredExpertise = ['Biomedical Engineering', 'Telemedicine', 'Public Health'];
    } else if (
      fullText.includes('school') ||
      fullText.includes('education') ||
      fullText.includes('student') ||
      fullText.includes('teacher') ||
      fullText.includes('classroom')
    ) {
      domain = 'Education';
      subdomain = 'Digital Learning & Infrastructure';
      problemType = 'Educational Gap';
      requiredExpertise = ['Educational Technology', 'Computer Science'];
    } else if (
      fullText.includes('waste') ||
      fullText.includes('garbage') ||
      fullText.includes('drain') ||
      fullText.includes('sanitation') ||
      fullText.includes('toilet')
    ) {
      domain = 'Sanitation';
      subdomain = 'Solid & Liquid Waste';
      problemType = 'Environmental Hazard';
      requiredExpertise = ['Environmental Engineering', 'Waste Management', 'Biotechnology'];
    }

    // 2. Severity & Urgency extraction
    let severity: SeverityLevel = SeverityLevel.MEDIUM;
    let urgency: UrgencyLevel = UrgencyLevel.MEDIUM;

    if (
      fullText.includes('critical') ||
      fullText.includes('danger') ||
      fullText.includes('death') ||
      fullText.includes('outbreak') ||
      fullText.includes('collapse') ||
      fullText.includes('poison')
    ) {
      severity = SeverityLevel.CRITICAL;
      urgency = UrgencyLevel.CRITICAL;
    } else if (
      fullText.includes('high') ||
      fullText.includes('urgent') ||
      fullText.includes('severe') ||
      fullText.includes('broken') ||
      fullText.includes('stop working') ||
      fullText.includes('recurring')
    ) {
      severity = SeverityLevel.HIGH;
      urgency = UrgencyLevel.HIGH;
    } else if (
      fullText.includes('minor') ||
      fullText.includes('cosmetic') ||
      fullText.includes('slight')
    ) {
      severity = SeverityLevel.LOW;
      urgency = UrgencyLevel.LOW;
    }

    // 3. Population estimation
    let estimatedAffectedPopulation = 250;
    const popMatch = fullText.match(
      /(?:nearly|about|around|over|approx|approximately)?\s*([0-9]+(?:,[0-9]+)?)\s*(?:people|citizens|residents|villagers|families|farmers|students|children|households)/i
    );
    if (popMatch && popMatch[1]) {
      const num = parseInt(popMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(num) && num > 0) {
        // If household/families mentioned, multiply by average household size ~5
        if (fullText.includes('families') || fullText.includes('households')) {
          estimatedAffectedPopulation = num * 5;
        } else {
          estimatedAffectedPopulation = num;
        }
      }
    }

    // 4. Keyword & Entity extraction
    const candidateWords = fullText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['this', 'that', 'with', 'from', 'have', 'were', 'every', 'last', 'they', 'their'].includes(w));
    const uniqueKeywords = Array.from(new Set(candidateWords)).slice(0, 8);

    const entities: Record<string, any> = {
      detectedIssue: problemType,
      targetGroup: fullText.includes('village') ? 'Rural Community' : 'General Public',
    };

    const evidenceUsed: string[] = [];
    if (fullText.includes('hand pump')) evidenceUsed.push('hand pump');
    if (fullText.includes('drinking')) evidenceUsed.push('drinking water scarcity');
    if (fullText.includes('every few days')) evidenceUsed.push('recurring failure pattern');

    return {
      domain,
      subdomain,
      problemType,
      severity,
      urgency,
      estimatedAffectedPopulation,
      requiredExpertise,
      keywords: uniqueKeywords,
      entities,
      confidence: 0.88,
      suggestedTitle: title || `Societal Challenge: ${domain} - ${subdomain}`,
      problemSummary: description.slice(0, 250) + (description.length > 250 ? '...' : ''),
      evidenceUsed,
      isFallback: true,
      modelVersion: 'deterministic-rules-v1',
    };
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    const dimension = 768;
    const vector = new Array(dimension).fill(0);
    const normalized = text.toLowerCase().trim();

    // Generate pseudo-semantic vector using word n-gram hashes and semantic clusters
    const words = normalized.split(/\s+/);
    for (const word of words) {
      if (word.length === 0) continue;
      const hash = crypto.createHash('sha256').update(word).digest();
      for (let i = 0; i < 8; i++) {
        const idx = (hash.readUInt16BE(i * 2) % dimension);
        const sign = (hash[i] % 2 === 0) ? 1 : -1;
        vector[idx] += sign;
      }
    }

    // Add strong semantic topic biases so related texts share high cosine similarity
    const waterTerms = ['water', 'pump', 'handpump', 'drinking', 'well', 'arsenic', 'pipeline', 'contamination'];
    const agritechTerms = ['crop', 'farmer', 'irrigation', 'farming', 'soil', 'harvest'];
    const healthTerms = ['health', 'hospital', 'disease', 'clinic', 'medicine', 'doctor'];

    for (const term of waterTerms) {
      if (normalized.includes(term)) {
        for (let i = 0; i < 40; i++) vector[i] += 2.0;
      }
    }
    for (const term of agritechTerms) {
      if (normalized.includes(term)) {
        for (let i = 40; i < 80; i++) vector[i] += 2.0;
      }
    }
    for (const term of healthTerms) {
      if (normalized.includes(term)) {
        for (let i = 80; i < 120; i++) vector[i] += 2.0;
      }
    }

    // L2 normalize vector
    let norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) norm = 1;

    return vector.map((v) => Number((v / norm).toFixed(6)));
  }
}

