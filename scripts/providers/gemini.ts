import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ProviderClient, AIMessage } from '../types/provider';

export class GeminiProvider implements ProviderClient {
  async generateContent(apiKey: string, model: string, messages: AIMessage[]): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });

    const systemMsg = messages.find((m) => m.role === 'system');
    const userMsg = messages.find((m) => m.role === 'user');

    const prompt = systemMsg
      ? `${systemMsg.content}\n\n${userMsg?.content || ''}`
      : (userMsg?.content || '');

    const result = await geminiModel.generateContent(prompt);
    return result.response.text() || 'Gemini returned an empty review.';
  }
}
