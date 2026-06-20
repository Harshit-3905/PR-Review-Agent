import Anthropic from '@anthropic-ai/sdk';
import type { ProviderClient, AIMessage } from '../types/provider';

export class AnthropicProvider implements ProviderClient {
  async generateContent(apiKey: string, model: string, messages: AIMessage[]): Promise<string> {
    const client = new Anthropic({ apiKey });

    const systemMsg = messages.find((m) => m.role === 'system');
    const userMsg = messages.find((m) => m.role === 'user');

    const result = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemMsg?.content || '',
      messages: [{ role: 'user', content: userMsg?.content || '' }],
    });

    const text = result.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    return text || 'Anthropic returned an empty review.';
  }
}
