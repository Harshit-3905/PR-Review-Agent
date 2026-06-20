import type { ProviderConfig } from './types/provider';

export function parseProviderConfig(commentBody: string): ProviderConfig {
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  const providerMatch = commentBody.match(/--provider\s+(\S+)/i);
  const modelMatch = commentBody.match(/--model\s+(\S+)/i);

  const requestedProvider = providerMatch?.[1]?.toLowerCase();
  const requestedModel = modelMatch?.[1];

  if (requestedProvider === 'openrouter') {
    if (!hasOpenRouter) throw new Error('OpenRouter provider requested but OPENROUTER_API_KEY is not set.');
    return { provider: 'openrouter', model: requestedModel };
  }
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
    if (hasOpenRouter) {
      return { provider: 'openrouter', model: requestedModel };
    }
    if (hasOpenAI) {
      return { provider: 'openai', model: requestedModel };
    }
  }

  // Default priority: openrouter > openai > gemini > anthropic
  const defaultPriority: ProviderConfig['provider'][] = ['openrouter', 'openai', 'gemini', 'anthropic'];
  const hasKey: Record<ProviderConfig['provider'], () => boolean> = {
    openrouter: () => hasOpenRouter,
    openai: () => hasOpenAI,
    gemini: () => hasGemini,
    anthropic: () => hasAnthropic,
  };

  for (const provider of defaultPriority) {
    if (hasKey[provider]()) {
      return { provider };
    }
  }

  throw new Error('No AI provider configured. Set OPENROUTER_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, and/or ANTHROPIC_API_KEY.');
}
