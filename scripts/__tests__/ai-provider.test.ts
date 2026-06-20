import { describe, it, expect, vi } from 'vitest';
import { AIProvider } from '../ai-provider';

vi.mock('../providers/openai', () => ({
  OpenAIProvider: class {
    generateContent = vi.fn().mockResolvedValue('openai response');
  },
}));

vi.mock('../providers/gemini', () => ({
  GeminiProvider: class {
    generateContent = vi.fn().mockResolvedValue('gemini response');
  },
}));

vi.mock('../providers/anthropic', () => ({
  AnthropicProvider: class {
    generateContent = vi.fn().mockResolvedValue('anthropic response');
  },
}));

vi.mock('../providers/openrouter', () => ({
  OpenRouterProvider: class {
    generateContent = vi.fn().mockResolvedValue('openrouter response');
  },
}));

describe('AIProvider', () => {
  it('dispatches to openrouter provider', async () => {
    const provider = new AIProvider({ provider: 'openrouter', apiKey: 'sk-or-key', model: 'openrouter/free' });
    const result = await provider.generateReview('review this');
    expect(result).toBe('openrouter response');
  });

  it('dispatches to openai provider', async () => {
    const provider = new AIProvider({ provider: 'openai', apiKey: 'sk-key', model: 'gpt-5.4-mini' });
    const result = await provider.generateReview('review this');
    expect(result).toBe('openai response');
  });

  it('dispatches to gemini provider', async () => {
    const provider = new AIProvider({ provider: 'gemini', apiKey: 'gk-key', model: 'gemini-2.0-flash' });
    const result = await provider.generateReview('review this');
    expect(result).toBe('gemini response');
  });

  it('dispatches to anthropic provider', async () => {
    const provider = new AIProvider({ provider: 'anthropic', apiKey: 'sk-ant-key', model: 'claude-sonnet-4-20250514' });
    const result = await provider.generateReview('review this');
    expect(result).toBe('anthropic response');
  });
});
