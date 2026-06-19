import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseProviderConfig } from '../config';

const OPENAI_KEY = 'sk-test-openai';
const GEMINI_KEY = 'gk-test-gemini';
const ANTHROPIC_KEY = 'sk-ant-test-anthropic';

describe('parseProviderConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('single provider available', () => {
    it('defaults to openai when only OPENAI_API_KEY is set', () => {
      process.env.OPENAI_API_KEY = OPENAI_KEY;
      const result = parseProviderConfig('/review-ai');
      expect(result.provider).toBe('openai');
      expect(result.model).toBeUndefined();
    });

    it('defaults to gemini when only GEMINI_API_KEY is set', () => {
      process.env.GEMINI_API_KEY = GEMINI_KEY;
      const result = parseProviderConfig('/review-ai');
      expect(result.provider).toBe('gemini');
      expect(result.model).toBeUndefined();
    });

    it('defaults to anthropic when only ANTHROPIC_API_KEY is set', () => {
      process.env.ANTHROPIC_API_KEY = ANTHROPIC_KEY;
      const result = parseProviderConfig('/review-ai');
      expect(result.provider).toBe('anthropic');
      expect(result.model).toBeUndefined();
    });

    it('throws when no API keys are set', () => {
      expect(() => parseProviderConfig('/review-ai')).toThrow(
        'No AI provider configured'
      );
    });
  });

  describe('multiple providers available', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = OPENAI_KEY;
      process.env.GEMINI_API_KEY = GEMINI_KEY;
      process.env.ANTHROPIC_API_KEY = ANTHROPIC_KEY;
    });

    it('defaults to openai when no flags are provided', () => {
      const result = parseProviderConfig('/review-ai');
      expect(result.provider).toBe('openai');
    });

    it('selects anthropic with --provider anthropic flag', () => {
      const result = parseProviderConfig('/review-ai --provider anthropic');
      expect(result.provider).toBe('anthropic');
      expect(result.model).toBeUndefined();
    });

    it('selects gemini with --provider gemini flag', () => {
      const result = parseProviderConfig('/review-ai --provider gemini');
      expect(result.provider).toBe('gemini');
      expect(result.model).toBeUndefined();
    });

    it('selects openai with --provider openai flag', () => {
      const result = parseProviderConfig('/review-ai --provider openai');
      expect(result.provider).toBe('openai');
      expect(result.model).toBeUndefined();
    });

    it('parses --model flag with openai', () => {
      const result = parseProviderConfig('/review-ai --model gpt-4o');
      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-4o');
    });

    it('parses --model flag with gemini model name', () => {
      const result = parseProviderConfig('/review-ai --model gemini-2.0-flash');
      expect(result.provider).toBe('gemini');
      expect(result.model).toBe('gemini-2.0-flash');
    });

    it('parses --model flag with claude model name', () => {
      const result = parseProviderConfig('/review-ai --model claude-sonnet-4-20250514');
      expect(result.provider).toBe('anthropic');
      expect(result.model).toBe('claude-sonnet-4-20250514');
    });

    it('combines --provider anthropic with --model', () => {
      const result = parseProviderConfig('/review-ai --provider anthropic --model claude-opus-4-20250514');
      expect(result.provider).toBe('anthropic');
      expect(result.model).toBe('claude-opus-4-20250514');
    });

    it('is case insensitive for provider names', () => {
      const result = parseProviderConfig('/review-ai --provider Gemini');
      expect(result.provider).toBe('gemini');
    });
  });

  describe('error handling', () => {
    it('throws when --provider gemini but key is missing', () => {
      process.env.OPENAI_API_KEY = OPENAI_KEY;
      expect(() => parseProviderConfig('/review-ai --provider gemini')).toThrow(
        'Gemini provider requested but GEMINI_API_KEY is not set'
      );
    });

    it('throws when --provider openai but key is missing', () => {
      process.env.GEMINI_API_KEY = GEMINI_KEY;
      expect(() => parseProviderConfig('/review-ai --provider openai')).toThrow(
        'OpenAI provider requested but OPENAI_API_KEY is not set'
      );
    });

    it('throws when gemini model requested but key is missing', () => {
      process.env.OPENAI_API_KEY = OPENAI_KEY;
      expect(() => parseProviderConfig('/review-ai --model gemini-2.0-flash')).toThrow(
        'Model appears to be a Gemini model but GEMINI_API_KEY is not set'
      );
    });

    it('throws when --provider anthropic but key is missing', () => {
      process.env.OPENAI_API_KEY = OPENAI_KEY;
      expect(() => parseProviderConfig('/review-ai --provider anthropic')).toThrow(
        'Anthropic provider requested but ANTHROPIC_API_KEY is not set'
      );
    });

    it('throws when claude model requested but key is missing', () => {
      process.env.OPENAI_API_KEY = OPENAI_KEY;
      expect(() => parseProviderConfig('/review-ai --model claude-sonnet-4-20250514')).toThrow(
        'Model appears to be an Anthropic model but ANTHROPIC_API_KEY is not set'
      );
    });
  });

  describe('comment body variations', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = OPENAI_KEY;
      process.env.GEMINI_API_KEY = GEMINI_KEY;
      process.env.ANTHROPIC_API_KEY = ANTHROPIC_KEY;
    });

    it('works with extra text around the command', () => {
      const result = parseProviderConfig('Can you review this? /review-ai --provider anthropic Thanks!');
      expect(result.provider).toBe('anthropic');
    });

    it('ignores flags not related to provider/model', () => {
      const result = parseProviderConfig('/review-ai --verbose --provider gemini');
      expect(result.provider).toBe('gemini');
    });
  });
});
