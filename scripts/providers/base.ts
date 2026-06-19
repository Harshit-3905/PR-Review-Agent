export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderClient {
  generateContent(apiKey: string, model: string, messages: AIMessage[]): Promise<string>;
}
