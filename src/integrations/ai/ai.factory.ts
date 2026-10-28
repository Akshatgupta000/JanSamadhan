import { IAIProvider } from './ai.interface';
import { MockAIProvider } from './mock-ai.provider';
import { GeminiAIProvider } from './gemini-ai.provider';
import { env } from '../../config/env';

export class AIFactory {
  private static instance: IAIProvider;

  public static getProvider(): IAIProvider {
    if (!this.instance) {
      if (env.AI_PROVIDER === 'gemini' && env.AI_API_KEY) {
        this.instance = new GeminiAIProvider();
      } else {
        this.instance = new MockAIProvider();
      }
    }
    return this.instance;
  }
}

