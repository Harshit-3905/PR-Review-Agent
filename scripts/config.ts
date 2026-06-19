import { AIProvider } from './provider';
import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';
import { AnthropicProvider } from './anthropic';

export interface ProviderConfig {
  provider: 'openai' | 'gemini' | 'anthropic';
  model?: string;
}

export function parseProviderConfig(commentBody: string): ProviderConfig {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  const providerMatch = commentBody.match(/--provider\s+(\S+)/i);
  const modelMatch = commentBody.match(/--model\s+(\S+)/i);

  const requestedProvider = providerMatch?.[1]?.toLowerCase();
  const requestedModel = modelMatch?.[1];

  if (requestedProvider === 'anthropic') {
    if (!hasAnthropic) throw new Error('Anthropic provider requested but ANTHROPIC_API_KEY is not set.');
    return { provider: 'anthropic', model: requestedModel };
  }
  if (requestedProvider === 'gemini') {
    if (!hasGemini) throw new Error('Gemini provider requested but GEMINI_API_KEY is not set.');
    return { provider: 'gemini', model: requestedModel };
  }
  if (requestedProvider === 'openai') {
    if (!hasOpenAI) throw new Error('OpenAI provider requested but OPENAI_API_KEY is not set.');
    return { provider: 'openai', model: requestedModel };
  }

  if (requestedModel) {
    const modelLower = requestedModel.toLowerCase();
    if (modelLower.startsWith('claude')) {
      if (!hasAnthropic) throw new Error('Model appears to be an Anthropic model but ANTHROPIC_API_KEY is not set.');
      return { provider: 'anthropic', model: requestedModel };
    }
    if (modelLower.startsWith('gemini')) {
      if (!hasGemini) throw new Error('Model appears to be a Gemini model but GEMINI_API_KEY is not set.');
      return { provider: 'gemini', model: requestedModel };
    }
    if (hasOpenAI) {
      return { provider: 'openai', model: requestedModel };
    }
  }

  const available: string[] = [];
  if (hasOpenAI) available.push('openai');
  if (hasGemini) available.push('gemini');
  if (hasAnthropic) available.push('anthropic');

  if (available.length === 1) {
    return { provider: available[0] as ProviderConfig['provider'] };
  }
  if (available.length > 1) {
    return { provider: 'openai' };
  }

  throw new Error('No AI provider configured. Set OPENAI_API_KEY, GEMINI_API_KEY, and/or ANTHROPIC_API_KEY.');
}

export function createProvider(config: ProviderConfig): AIProvider {
  if (config.provider === 'openai') {
    const model = config.model || process.env.OPENAI_MODEL || 'gpt-4o';
    return new OpenAIProvider(process.env.OPENAI_API_KEY!, model);
  }
  if (config.provider === 'gemini') {
    const model = config.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    return new GeminiProvider(process.env.GEMINI_API_KEY!, model);
  }
  const model = config.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
  return new AnthropicProvider(process.env.ANTHROPIC_API_KEY!, model);
}
