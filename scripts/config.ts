import { AIProvider } from './provider';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';

export interface ProviderConfig {
  provider: 'openai' | 'gemini';
  model?: string;
}

export function parseProviderConfig(commentBody: string): ProviderConfig {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;

  const providerMatch = commentBody.match(/--provider\s+(\S+)/i);
  const modelMatch = commentBody.match(/--model\s+(\S+)/i);

  const requestedProvider = providerMatch?.[1]?.toLowerCase();
  const requestedModel = modelMatch?.[1];

  if (requestedProvider === 'gemini') {
    if (!hasGemini) throw new Error('Gemini provider requested but GEMINI_API_KEY is not set.');
    return { provider: 'gemini', model: requestedModel };
  }
  if (requestedProvider === 'openai') {
    if (!hasOpenAI) throw new Error('OpenAI provider requested but OPENAI_API_KEY is not set.');
    return { provider: 'openai', model: requestedModel };
  }

  if (requestedModel) {
    if (requestedModel.startsWith('gemini')) {
      if (!hasGemini) throw new Error('Model appears to be a Gemini model but GEMINI_API_KEY is not set.');
      return { provider: 'gemini', model: requestedModel };
    }
    if (hasOpenAI) {
      return { provider: 'openai', model: requestedModel };
    }
  }

  if (hasOpenAI && !hasGemini) return { provider: 'openai' };
  if (hasGemini && !hasOpenAI) return { provider: 'gemini' };
  if (hasOpenAI && hasGemini) return { provider: 'openai' };

  throw new Error('No AI provider configured. Set OPENAI_API_KEY and/or GEMINI_API_KEY.');
}

export function createProvider(config: ProviderConfig): AIProvider {
  if (config.provider === 'openai') {
    const model = config.model || process.env.OPENAI_MODEL || 'gpt-4o';
    return new OpenAIProvider(process.env.OPENAI_API_KEY!, model);
  }
  const model = config.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  return new GeminiProvider(process.env.GEMINI_API_KEY!, model);
}
