export interface AIProvider {
  generateReview(prompt: string): Promise<string>;
}
