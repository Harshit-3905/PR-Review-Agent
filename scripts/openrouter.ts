import OpenAI from 'openai';
import { AIProvider } from './provider';

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

export class OpenRouterProvider implements AIProvider {
  private model: string;
  private client: OpenAI;

  constructor(apiKey: string, model: string) {
    if (!apiKey) {
      throw new Error('OpenRouter API key must be provided to initialize OpenRouterProvider.');
    }
    this.model = model;
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    });
  }

  async generateReview(prompt: string): Promise<string> {
    try {
      const result = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: 4096,
      });

      return result.choices[0]?.message?.content || 'OpenRouter returned an empty review.';
    } catch (error: any) {
      throw new Error(`OpenRouter API request failed: ${error.message || error}`);
    }
  }
}
