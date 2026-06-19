import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './provider';

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    if (!apiKey) {
      throw new Error('Gemini API key must be provided to initialize GeminiProvider.');
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateReview(prompt: string): Promise<string> {
    try {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text() || 'Gemini returned an empty review.';
    } catch (error: any) {
      throw new Error(`Gemini API request failed: ${error.message || error}`);
    }
  }
}
