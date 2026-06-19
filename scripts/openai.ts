import { Agent, run } from '@openai/agents';

/**
 * Common interface for AI review providers.
 * Makes it easy to extend to multiple AI providers in the future (e.g., Anthropic, Gemini).
 */
export interface AIProvider {
  generateReview(prompt: string): Promise<string>;
}

/**
 * Implementation of AIProvider using the official OpenAI Agents SDK.
 */
export class OpenAIProvider implements AIProvider {
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    if (!apiKey) {
      throw new Error('OpenAI API key must be provided to initialize OpenAIProvider.');
    }
    // Set the environment variable since the Agents SDK relies on it
    process.env.OPENAI_API_KEY = apiKey;
    this.model = model;
  }

  /**
   * Generates a PR review using the OpenAI Agents SDK runner.
   */
  async generateReview(prompt: string): Promise<string> {
    try {
      const agent = new Agent({
        name: 'PR Review Agent',
        instructions: `You are an expert software engineer and code reviewer.
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
- Do not explain files that look correct or have trivial changes.`,
        model: this.model,
      });

      const result = await run(agent, prompt);
      return result.finalOutput || '🤖 OpenAI returned an empty review.';
    } catch (error: any) {
      throw new Error(`OpenAI API request failed: ${error.message || error}`);
    }
  }
}
