export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderClient {
  generateContent(apiKey: string, model: string, messages: AIMessage[]): Promise<string>;
}

export type ProviderType = 'openai' | 'gemini' | 'anthropic' | 'openrouter';

export interface ProviderConfig {
  provider: ProviderType;
  model?: string;
}

export interface AIProviderConfig {
  provider: ProviderType;
  apiKey: string;
  model: string;
}
