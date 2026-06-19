import type { AIMessage, ProviderClient } from './providers/base';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import { AnthropicProvider } from './providers/anthropic';
import { OpenRouterProvider } from './providers/openrouter';

export type ProviderType = 'openai' | 'gemini' | 'anthropic' | 'openrouter';

const SYSTEM_PROMPT = `You are an expert software engineer and code reviewer.
Your task is to provide a constructive, thorough, and highly professional review of the code changes in the pull request.
Focus on:
1. **Bugs**: Logic errors, edge cases, incorrect assumptions, or resource leaks.
2. **Security**: Vulnerabilities, exposure of secrets, or insecure practices.
3. **Performance**: Inefficiencies, costly queries, blocking operations, or excessive memory usage.
4. **Testing**: Suggest tests for complex logic or point out missing tests.

Rules for feedback:
- Be respectful, concise, and direct.
- Highlight both issues and positive aspects of the code if applicable.
- Provide concrete code examples/suggestions using markdown diff codeblocks where helpful.
- Reference line numbers or function names if you see specific problems.
- Do not explain files that look correct or have trivial changes.`;

export interface AIProviderConfig {
  provider: ProviderType;
  apiKey: string;
  model: string;
}

export class AIProvider {
  private client: ProviderClient;

  constructor(private config: AIProviderConfig) {
    this.client = this.createClient(config.provider);
  }

  async generateReview(prompt: string): Promise<string> {
    const messages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];

    return this.client.generateContent(this.config.apiKey, this.config.model, messages);
  }

  private createClient(provider: ProviderType): ProviderClient {
    switch (provider) {
      case 'openai':
        return new OpenAIProvider();
      case 'gemini':
        return new GeminiProvider();
      case 'anthropic':
        return new AnthropicProvider();
      case 'openrouter':
        return new OpenRouterProvider();
    }
  }
}
