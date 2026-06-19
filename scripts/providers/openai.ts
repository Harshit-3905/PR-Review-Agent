import { Agent, run } from '@openai/agents';
import type { ProviderClient, AIMessage } from './base';

export class OpenAIProvider implements ProviderClient {
  async generateContent(apiKey: string, model: string, messages: AIMessage[]): Promise<string> {
    process.env.OPENAI_API_KEY = apiKey;

    const systemMsg = messages.find((m) => m.role === 'system');
    const userMsg = messages.find((m) => m.role === 'user');

    const agent = new Agent({
      name: 'PR Review Agent',
      instructions: systemMsg?.content || '',
      model,
    });

    const result = await run(agent, userMsg?.content || '');
    return result.finalOutput || 'OpenAI returned an empty review.';
  }
}
