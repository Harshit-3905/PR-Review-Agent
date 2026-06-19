import OpenAI from 'openai';
import type { ProviderClient, AIMessage } from './base';

export class OpenRouterProvider implements ProviderClient {
  async generateContent(apiKey: string, model: string, messages: AIMessage[]): Promise<string> {
    const client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    });

    const result = await client.chat.completions.create({
      model,
      messages,
      max_tokens: 4096,
    });

    return result.choices[0]?.message?.content || 'OpenRouter returned an empty review.';
  }
}
