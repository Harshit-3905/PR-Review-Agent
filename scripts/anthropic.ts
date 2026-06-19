import Anthropic from '@anthropic-ai/sdk';
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

export class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    if (!apiKey) {
      throw new Error('Anthropic API key must be provided to initialize AnthropicProvider.');
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateReview(prompt: string): Promise<string> {
    try {
      const client = new Anthropic({ apiKey: this.apiKey });
      const result = await client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = result.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('\n');

      return text || 'Anthropic returned an empty review.';
    } catch (error: any) {
      throw new Error(`Anthropic API request failed: ${error.message || error}`);
    }
  }
}
